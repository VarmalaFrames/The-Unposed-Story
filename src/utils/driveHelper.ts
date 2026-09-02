/**
 * Helper utilities for Google Drive image and folder links
 */

/**
 * Extracts the file ID from various Google Drive file link formats
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Format: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Format: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Format: https://lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  // Format: drive.google.com/uc?id=FILE_ID
  const ucMatch = trimmed.match(/\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && ucMatch[1]) return ucMatch[1];

  return null;
}

/**
 * Extracts folder ID from Google Drive folder link formats
 */
export function extractDriveFolderId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Format: https://drive.google.com/drive/folders/FOLDER_ID or /drive/u/0/folders/FOLDER_ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  return null;
}

/**
 * Checks if a string is a Google Drive URL
 */
export function isDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    url.includes('lh3.googleusercontent.com/d/')
  );
}

/**
 * Converts any Google Drive image share link to a direct embeddable image link
 */
export function convertDriveToDirectImageUrl(url: string, size = 'w1600'): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    // lh3.googleusercontent.com/d/{fileId} is the fastest direct image delivery link for public Drive files
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Builds a standardized Google Drive folder link
 */
export function buildDriveFolderUrl(folderIdOrUrl: string): string {
  if (!folderIdOrUrl) return '';
  const trimmed = folderIdOrUrl.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return `https://drive.google.com/drive/folders/${trimmed}`;
}
