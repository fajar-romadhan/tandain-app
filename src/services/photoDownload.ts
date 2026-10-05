import type { Photo } from '../types';

/**
 * Returns the highest resolution / full HD download URL for a given photo.
 * For Google Drive photos, appends '=d' which serves the exact uncompressed
 * master file directly from Google Drive with attachment headers.
 */
export const getPhotoHdUrl = (photo: Photo): string => {
  if (!photo) return '';

  // Pattern 1: URL contains Google UserContent CDN link
  if (photo.url && photo.url.includes('googleusercontent.com/d/')) {
    // Replace width limit (=w1200, =w600, =w400) or size limit (=s...) with =d (Direct HD Attachment)
    return photo.url.replace(/=[wsd]\d*.*$/, '=d');
  }

  // Pattern 2: Photo ID is a valid Google Drive file ID
  if (
    photo.id &&
    !photo.id.startsWith('sample') &&
    !photo.id.startsWith('local') &&
    photo.id.length >= 20
  ) {
    return `https://lh3.googleusercontent.com/d/${photo.id}=d`;
  }

  // Fallback to existing photo URL
  return photo.url;
};

/**
 * Downloads a single photo in 100% full original resolution (HD)
 * as stored in the source Google Drive folder.
 * Works seamlessly across iOS Safari, Android Chrome, and Desktop browsers.
 */
export const downloadPhotoHd = async (
  photo: Photo,
  onProgress?: (loading: boolean) => void
): Promise<void> => {
  if (!photo) return;
  onProgress?.(true);

  const hdUrl = getPhotoHdUrl(photo);
  const rawName = photo.name || 'foto.jpg';
  const fileName = /\.(jpe?g|png|webp|heic)$/i.test(rawName)
    ? rawName
    : `${rawName}.jpg`;

  try {
    // Attempt Blob fetch for silent direct download with correct filename
    const response = await fetch(hdUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke blob URL after a short buffer
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (_err) {
    // Fallback: Direct attachment link trigger (Google CDN =d sends Content-Disposition: attachment)
    const directLink = document.createElement('a');
    directLink.href = hdUrl;
    directLink.download = fileName;
    directLink.target = '_blank';
    directLink.rel = 'noopener noreferrer';
    document.body.appendChild(directLink);
    directLink.click();
    document.body.removeChild(directLink);
  } finally {
    onProgress?.(false);
  }
};
