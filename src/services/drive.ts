import type { Photo } from '../types';
import { SAMPLE_GRADUATION_PHOTOS, SAMPLE_WEDDING_PHOTOS } from './sampleData';

export const extractDriveFolderId = (url: string): string | null => {
  if (!url) return null;

  // Pattern 1: /folders/FOLDER_ID
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  // Pattern 2: ?id=FOLDER_ID or &id=FOLDER_ID
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Pattern 3: If user pasted just the raw ID string
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
};

export interface DriveFetchResult {
  photos: Photo[];
  isLive: boolean;
  totalFound: number;
  error?: string;
}

/**
 * Fetch live photos from Google Drive API v3
 * Free quota from Google: 10,000,000 requests per day (Rp0)
 */
export const fetchPhotosFromGoogleDriveAPI = async (
  folderId: string,
  apiKey: string
): Promise<Photo[]> => {
  if (!folderId || !apiKey) return [];

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false and mimeType contains 'image/'`);
  const fields = encodeURIComponent('files(id,name,mimeType,thumbnailLink,imageMediaMetadata)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=1000&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `Google Drive API error: ${res.statusText}`;
    throw new Error(message);
  }

  const data = await res.json();
  const files: any[] = data.files || [];

  return files.map((file, idx) => {
    const width = file.imageMediaMetadata?.width || 1200;
    const height = file.imageMediaMetadata?.height || 800;
    const aspectRatio = width && height ? Number((width / height).toFixed(2)) : 1.5;

    // High quality Google CDN web-optimized image preview
    const cdnUrl = `https://lh3.googleusercontent.com/d/${file.id}=w1200`;
    const thumbUrl = `https://lh3.googleusercontent.com/d/${file.id}=w400`;

    return {
      id: file.id || `drive-photo-${idx}`,
      name: file.name,
      url: cdnUrl,
      thumbnailUrl: thumbUrl,
      width,
      height,
      aspectRatio,
    };
  });
};

/**
 * Main photo loader for Drive folder
 * Tries live API if apiKey is present, otherwise returns client-tailored sample set
 */
export const getPhotosForDriveFolder = async (
  folderId: string,
  clientName: string,
  apiKey?: string
): Promise<DriveFetchResult> => {
  // Try live Google Drive API if key is provided
  const activeKey = apiKey || import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';

  if (activeKey && folderId) {
    try {
      const livePhotos = await fetchPhotosFromGoogleDriveAPI(folderId, activeKey);
      if (livePhotos.length > 0) {
        return {
          photos: livePhotos,
          isLive: true,
          totalFound: livePhotos.length,
        };
      }
    } catch (err: any) {
      console.warn('Live Google Drive fetch error, using fallback:', err.message);
    }
  }

  // Graceful fallback: customized sample photo sets
  const isWisuda = clientName.toLowerCase().includes('wisuda') || clientName.toLowerCase().includes('grad');
  const baseSample = isWisuda ? SAMPLE_GRADUATION_PHOTOS : SAMPLE_WEDDING_PHOTOS;

  const simulatedPhotos = baseSample.map((p, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const prefix = isWisuda ? 'WISUDA_' : 'IMG_';
    return {
      ...p,
      id: `${folderId}-photo-${idx}`,
      name: `${prefix}${num}.JPG`,
    };
  });

  return {
    photos: simulatedPhotos,
    isLive: false,
    totalFound: simulatedPhotos.length,
  };
};

/**
 * Scan local JPG folder from laptop directly (Alternative 0-config method)
 * Reads actual file names and thumbnail blobs in 0.1s without uploading to cloud
 */
export const scanLocalPreviewFolder = async (): Promise<Photo[]> => {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new Error('Browser belum mendukung File System Access API. Gunakan Chrome atau Edge.');
  }

  const dirHandle = await (window as any).showDirectoryPicker();
  const photos: Photo[] = [];
  let idx = 0;

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const ext = entry.name.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
        const file = await entry.getFile();
        const blobUrl = URL.createObjectURL(file);
        photos.push({
          id: `local-${idx}`,
          name: entry.name,
          url: blobUrl,
          aspectRatio: 1.5,
        });
        idx++;
      }
    }
  }

  // Sort by filename naturally
  photos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return photos;
};
