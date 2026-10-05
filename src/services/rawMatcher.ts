import JSZip from 'jszip';
import type { MatchingResult } from '../types';

export const RAW_EXTENSIONS = [
  'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'raf', 'orf',
  'rw2', 'pef', 'dng', 'srw', 'x3f', '3fr', 'fff', 'iiq', 'mos', 'rwl',
  'erf', 'kdc', 'dcr', 'mrw', 'mef',
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
  phase: 'scan' | 'copy' | 'zip' | 'done';
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHED FILE (shared between Chrome & Safari paths)
// ─────────────────────────────────────────────────────────────────────────────
export interface MatchedFile {
  file: File;
  name: string;
  size: number;
  extension: string;
}

export interface ScanResult {
  matched: MatchedFile[];
  missing: string[];
  totalBytes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHROME / EDGE: File System Access API
// ─────────────────────────────────────────────────────────────────────────────

export const scanFolderChrome = async (
  selectedFileNames: string[],
  targetTypes: 'raw' | 'jpg' | 'both',
  onProgress?: (p: CopyProgress) => void,
): Promise<ScanResult> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('Browser belum mendukung. Buka di Google Chrome atau Microsoft Edge di laptop ya!');
  }

  // @ts-expect-error showDirectoryPicker is available in Chrome/Edge
  const dirHandle = await window.showDirectoryPicker({ mode: 'read', id: 'tandain_raw_scan' });

  onProgress?.({ current: 0, total: selectedFileNames.length, currentFileName: '', statusText: 'Membaca file di folder...', phase: 'scan' });

  // Index all files recursively (depth 2: folder + 1 level camera subfolder like 100CANON)
  const fileIndex = new Map<string, File>();

  async function indexDir(handle: FileSystemDirectoryHandle, depth: number) {
    for await (const [, entry] of (handle as any).entries()) {
      if (entry.kind === 'file') {
        const f: File = await entry.getFile();
        fileIndex.set(f.name.toLowerCase(), f);
      } else if (entry.kind === 'directory' && depth < 2) {
        await indexDir(entry, depth + 1);
      }
    }
  }

  await indexDir(dirHandle, 0);

  return matchFilesFromIndex(fileIndex, selectedFileNames, targetTypes, onProgress);
};

// ─────────────────────────────────────────────────────────────────────────────
// SAFARI / FIREFOX: <input webkitdirectory>
// ─────────────────────────────────────────────────────────────────────────────

export interface SafariMatchingResult {
  totalTarget: number;
  matched: MatchedFile[];
  matchedNames: string[];
  missing: string[];
  totalBytes: number;
}

export const matchLocalFilesFromList = (
  fileList: FileList | File[],
  selectedFileNames: string[],
  targetTypes: 'raw' | 'jpg' | 'both',
): SafariMatchingResult => {
  const fileIndex = new Map<string, File>();
  for (const f of Array.from(fileList)) {
    fileIndex.set(f.name.toLowerCase(), f);
  }

  const result = matchFilesFromIndex(fileIndex, selectedFileNames, targetTypes);
  return {
    totalTarget: selectedFileNames.length,
    matched: result.matched,
    matchedNames: result.matched.map((m) => m.name),
    missing: result.missing,
    totalBytes: result.totalBytes,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CORE MATCHER
// ─────────────────────────────────────────────────────────────────────────────

function matchFilesFromIndex(
  fileIndex: Map<string, File>,
  selectedFileNames: string[],
  targetTypes: 'raw' | 'jpg' | 'both',
  onProgress?: (p: CopyProgress) => void,
): ScanResult {
  const matched: MatchedFile[] = [];
  const missing: string[] = [];
  let totalBytes = 0;

  const total = selectedFileNames.length;

  for (let i = 0; i < total; i++) {
    const sel = selectedFileNames[i];
    const base = getBaseName(sel);
    const found: MatchedFile[] = [];

    for (const [lowerName, file] of fileIndex.entries()) {
      const ext = (lowerName.split('.').pop() || '').toLowerCase();
      const candidateBase = getBaseName(lowerName);
      if (candidateBase !== base) continue;

      const isRaw = RAW_EXTENSIONS.includes(ext);
      const isJpg = ext === 'jpg' || ext === 'jpeg';

      if (
        (targetTypes === 'raw' && isRaw) ||
        (targetTypes === 'jpg' && isJpg) ||
        (targetTypes === 'both' && (isRaw || isJpg))
      ) {
        found.push({ file, name: file.name, size: file.size, extension: ext });
        totalBytes += file.size;
      }
    }

    if (found.length === 0) {
      missing.push(sel);
    } else {
      matched.push(...found);
      onProgress?.({ current: i + 1, total, currentFileName: found[0].name, statusText: `Mencocokkan ${i + 1}/${total}...`, phase: 'scan' });
    }
  }

  return { matched, missing, totalBytes };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD AS ZIP (the main zero-IT action)
// ─────────────────────────────────────────────────────────────────────────────

export const downloadMatchedAsZip = async (
  matched: MatchedFile[],
  clientName: string,
  onProgress?: (p: CopyProgress) => void,
): Promise<void> => {
  const zip = new JSZip();
  const total = matched.length;

  for (let i = 0; i < total; i++) {
    const item = matched[i];
    onProgress?.({ current: i + 1, total, currentFileName: item.name, statusText: `Menyiapkan file ${i + 1}/${total}...`, phase: 'zip' });
    const arrayBuf = await item.file.arrayBuffer();
    zip.file(item.name, arrayBuf);
  }

  onProgress?.({ current: total, total, currentFileName: '', statusText: 'Membuat file ZIP...', phase: 'zip' });

  const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const cleanClient = (clientName || 'Klien').replace(/[^a-zA-Z0-9_-]/g, '_');
  const nowStr = new Date().toISOString().split('T')[0];
  const filename = `RAW_Pilihan_${cleanClient}_${nowStr}.zip`;

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  onProgress?.({ current: total, total, currentFileName: filename, statusText: `✅ ZIP berhasil didownload!`, phase: 'done' });
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Chrome copy-to-disk (kept for backward compat; not shown in new UI)
// ─────────────────────────────────────────────────────────────────────────────

export const matchAndCopyLocalFiles = async (
  selectedFileNames: string[],
  targetTypes: 'raw' | 'jpg' | 'both',
  clientFolderName: string,
  onProgress?: (progress: CopyProgress) => void,
): Promise<MatchingResult> => {
  const scan = await scanFolderChrome(selectedFileNames, targetTypes, onProgress);

  if (scan.matched.length === 0) {
    return { totalTarget: selectedFileNames.length, matched: [], missing: scan.missing, copiedCount: 0, errors: [] };
  }

  // @ts-expect-error showDirectoryPicker available in Chrome/Edge
  const destRootHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'tandain_dest_folder' });
  const cleanClient = clientFolderName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const nowStr = new Date().toISOString().split('T')[0];
  const destFolderName = `TANDAIN_${cleanClient}_${nowStr}`;
  const destDirHandle = await (destRootHandle as any).getDirectoryHandle(destFolderName, { create: true });

  const errors: string[] = [];
  let copiedCount = 0;

  for (let i = 0; i < scan.matched.length; i++) {
    const item = scan.matched[i];
    onProgress?.({ current: i + 1, total: scan.matched.length, currentFileName: item.name, statusText: `Menyalin ${item.name}...`, phase: 'copy' });
    try {
      const newHandle = await destDirHandle.getFileHandle(item.name, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(await item.file.arrayBuffer());
      await writable.close();
      copiedCount++;
    } catch (err: any) {
      errors.push(`Gagal: ${item.name} — ${err?.message || err}`);
    }
  }

  return { totalTarget: selectedFileNames.length, matched: scan.matched.map((m) => m.name), missing: scan.missing, copiedCount, errors };
};
