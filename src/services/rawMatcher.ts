import type { MatchingResult } from '../types';

export const RAW_EXTENSIONS = [
  'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'raf', 'orf',
  'rw2', 'pef', 'dng', 'srw', 'x3f', '3fr', 'fff', 'iiq', 'mos', 'rwl',
  'erf', 'kdc', 'dcr', 'mrw', 'mef'
];

export const isFileSystemAccessSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// Extracts the base filename without extension: "IMG_4821.JPG" -> "img_4821"
export const getBaseName = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex <= 0) return filename.toLowerCase();
  return filename.substring(0, dotIndex).toLowerCase();
};

export interface CopyProgress {
  current: number;
  total: number;
  currentFileName: string;
  statusText: string;
}

export const matchAndCopyLocalFiles = async (
  selectedFileNames: string[],
  targetTypes: 'raw' | 'jpg' | 'both',
  clientFolderName: string,
  onProgress?: (progress: CopyProgress) => void
): Promise<MatchingResult> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Browser kamu belum mendukung File System Access API. Buka di Google Chrome atau Microsoft Edge di laptop/desktop ya!');
  }

  // 1. Ask user to pick the folder
  // @ts-expect-error window.showDirectoryPicker is experimental but standard in modern Chrome/Edge
  const dirHandle = await window.showDirectoryPicker({
    mode: 'readwrite',
    id: 'tandain_photoshoot_folder',
  });

  onProgress?.({
    current: 0,
    total: selectedFileNames.length,
    currentFileName: '',
    statusText: 'Sedang membaca file di folder...',
  });

  // 2. Index all files in the chosen folder (shallow, no subfolder)
  const filesInDir = new Map<string, FileSystemFileHandle>();
  let hasSubfolders = false;

  for await (const [name, handle] of (dirHandle as any).entries()) {
    if (handle.kind === 'file') {
      filesInDir.set(name.toLowerCase(), handle as FileSystemFileHandle);
    } else if (handle.kind === 'directory') {
      hasSubfolders = true;
    }
  }

  // 3. Create destination subfolder: TANDAIN_[Client]_[Date]
  const cleanClient = clientFolderName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nowStr = new Date().toISOString().split('T')[0];
  const destFolderName = `TANDAIN_${cleanClient}_${nowStr}`;
  const destDirHandle = await (dirHandle as any).getDirectoryHandle(destFolderName, { create: true });

  const matched: string[] = [];
  const missing: string[] = [];
  const errors: string[] = [];
  let copiedCount = 0;

  // 4. For each selected file, find the matching RAW or JPG files
  const total = selectedFileNames.length;

  for (let i = 0; i < total; i++) {
    const rawSelected = selectedFileNames[i];
    const base = getBaseName(rawSelected);
    const filesToCopy: FileSystemFileHandle[] = [];

    // Find candidate files with matching base name
    for (const [lowerName, handle] of filesInDir.entries()) {
      const ext = lowerName.split('.').pop() || '';
      const candidateBase = getBaseName(lowerName);

      if (candidateBase === base) {
        const isRaw = RAW_EXTENSIONS.includes(ext);
        const isJpg = ext === 'jpg' || ext === 'jpeg';

        if (targetTypes === 'raw' && isRaw) {
          filesToCopy.push(handle);
        } else if (targetTypes === 'jpg' && isJpg) {
          filesToCopy.push(handle);
        } else if (targetTypes === 'both' && (isRaw || isJpg)) {
          filesToCopy.push(handle);
        }
      }
    }

    if (filesToCopy.length === 0) {
      missing.push(rawSelected);
    } else {
      for (const fileHandle of filesToCopy) {
        onProgress?.({
          current: i + 1,
          total,
          currentFileName: fileHandle.name,
          statusText: `Menyalin ${fileHandle.name} (${i + 1}/${total})...`,
        });

        try {
          const fileData = await fileHandle.getFile();
          const newFileHandle = await destDirHandle.getFileHandle(fileHandle.name, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(fileData);
          await writable.close();
          copiedCount++;
          matched.push(fileHandle.name);
        } catch (err: any) {
          errors.push(`Gagal menyalin ${fileHandle.name}: ${err?.message || err}`);
        }
      }
    }
  }

  if (matched.length === 0 && hasSubfolders) {
    errors.push('Fotonya mungkin ada di dalam subfolder kamera (misal 100CANON). Coba pilih langsung subfolder tersebut ya!');
  }

  onProgress?.({
    current: total,
    total,
    currentFileName: '',
    statusText: `Selesai! ${copiedCount} file berhasil disalin ke folder ${destFolderName}.`,
  });

  return {
    totalTarget: total,
    matched,
    missing,
    copiedCount,
    errors,
  };
};

// ---------------------------------------------------------------------------
// Safari & Alternative Browser Support (WebKit directory input + Mac Script)
// ---------------------------------------------------------------------------

export interface SafariMatchedFile {
  file: File;
  name: string;
  size: number;
  extension: string;
  relativePath: string;
}

export interface SafariMatchingResult {
  totalTarget: number;
  matched: SafariMatchedFile[];
  matchedNames: string[];
  missing: string[];
  totalBytes: number;
}

export const matchLocalFilesFromList = (
  fileList: FileList | File[],
  selectedFileNames: string[],
  targetTypes: 'raw' | 'jpg' | 'both'
): SafariMatchingResult => {
  const filesArray = Array.from(fileList);
  const matched: SafariMatchedFile[] = [];
  const missing: string[] = [];
  const matchedNames: string[] = [];
  let totalBytes = 0;

  for (const rawSelected of selectedFileNames) {
    const base = getBaseName(rawSelected);
    const candidateFiles: File[] = [];

    for (const f of filesArray) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const candidateBase = getBaseName(f.name);

      if (candidateBase === base) {
        const isRaw = RAW_EXTENSIONS.includes(ext);
        const isJpg = ext === 'jpg' || ext === 'jpeg';

        if (targetTypes === 'raw' && isRaw) {
          candidateFiles.push(f);
        } else if (targetTypes === 'jpg' && isJpg) {
          candidateFiles.push(f);
        } else if (targetTypes === 'both' && (isRaw || isJpg)) {
          candidateFiles.push(f);
        }
      }
    }

    if (candidateFiles.length === 0) {
      missing.push(rawSelected);
    } else {
      for (const cf of candidateFiles) {
        matched.push({
          file: cf,
          name: cf.name,
          size: cf.size,
          extension: (cf.name.split('.').pop() || '').toLowerCase(),
          relativePath: cf.webkitRelativePath || cf.name,
        });
        matchedNames.push(cf.name);
        totalBytes += cf.size;
      }
    }
  }

  return {
    totalTarget: selectedFileNames.length,
    matched,
    matchedNames,
    missing,
    totalBytes,
  };
};

/**
 * Generates an executable macOS .command bash script.
 * Double clicking this file in Finder automatically creates the target folder
 * and copies the matched RAW files using native macOS cp in 0.5 seconds!
 */
export const generateMacCopyScript = (
  fileNames: string[],
  clientName: string
): string => {
  const cleanClient = (clientName || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_');
  const nowStr = new Date().toISOString().split('T')[0];
  const destDir = `TANDAIN_${cleanClient}_RAW_${nowStr}`;

  // Generate find commands that search both current dir and camera subfolders (e.g. 100CANON)
  const copyLines = fileNames
    .map((name) => {
      const base = getBaseName(name);
      return `find . -maxdepth 3 -type f -iname "${base}.*" -exec cp -v {} "$DEST_DIR/" \\; 2>/dev/null || true`;
    })
    .join('\n');

  return `#!/bin/bash
# ========================================================
# TANDAIN — Script Otomatis Salin RAW (macOS Safari Helper)
# Klien: ${clientName}
# Tanggal: ${nowStr}
# ========================================================

cd "$(dirname "$0")" || exit 1
DEST_DIR="${destDir}"
mkdir -p "$DEST_DIR"

echo "=================================================="
echo "  🚀 TANDAIN: Menyalin File RAW Pilihan Klien"
echo "  Klien: ${clientName}"
echo "  Target Folder: $DEST_DIR"
echo "=================================================="

${copyLines}

echo ""
echo "=================================================="
echo "  ✅ SELESAI! Seluruh file pilihan telah disalin."
echo "  Lokasi: $(pwd)/$DEST_DIR"
echo "=================================================="
`;
};

/**
 * Generates a 1-line command ready to paste into macOS Terminal
 */
export const generateTerminalCopyCommand = (
  fileNames: string[],
  clientName: string
): string => {
  const cleanClient = (clientName || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_');
  const nowStr = new Date().toISOString().split('T')[0];
  const destDir = `TANDAIN_${cleanClient}_RAW_${nowStr}`;

  const patterns = fileNames.map((name) => `"${getBaseName(name)}.*"`).join(' ');

  return `mkdir -p "${destDir}" && for f in ${patterns}; do find . -maxdepth 3 -type f -iname "$f" -exec cp {} "${destDir}/" \\; ; done && echo "✅ Selesai salin RAW ke ${destDir}"`;
};

export const downloadTextFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'application/x-sh;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const downloadSingleFile = (file: File): void => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

