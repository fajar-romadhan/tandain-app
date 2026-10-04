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
