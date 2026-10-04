import type { Photo } from '../types';
import { SAMPLE_GRADUATION_PHOTOS, SAMPLE_WEDDING_PHOTOS } from './sampleData';

export const extractDriveFolderId = (url: string): string | null => {
  if (!url) return null;
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // If user pasted just the ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
};

// Generates simulated photos for custom drive links or returns sample photo sets
export const getPhotosForDriveFolder = (folderId: string, clientName: string): Photo[] => {
  const isWisuda = clientName.toLowerCase().includes('wisuda') || clientName.toLowerCase().includes('grad');
  const baseSample = isWisuda ? SAMPLE_GRADUATION_PHOTOS : SAMPLE_WEDDING_PHOTOS;
  
  // Return clones with customized names based on client if wanted
  return baseSample.map((p, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const prefix = isWisuda ? 'WISUDA_' : 'IMG_';
    return {
      ...p,
      id: `${folderId}-photo-${idx}`,
      name: `${prefix}${num}.JPG`,
    };
  });
};
