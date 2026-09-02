/**
 * Helper utilities for Google Drive image and folder links
 */

/**
 * Extracts the file ID from any Google Drive link format, including mobile, web, and direct share formats
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If user pasted just the raw alphanumeric Google Drive File ID (typically 25-45 chars)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  // Format: https://drive.google.com/file/d/FILE_ID/view... or /file/u/0/d/FILE_ID/...
  const fileDMatch = trimmed.match(/\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Format: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID or &id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Format: https://lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  // Format: drive.google.com/uc?id=FILE_ID or /uc?export=view&id=FILE_ID
  const ucMatch = trimmed.match(/\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]{20,})/);
  if (ucMatch && ucMatch[1]) return ucMatch[1];

  // Format: drive.google.com/thumbnail?id=FILE_ID
  const thumbMatch = trimmed.match(/\/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]{20,})/);
  if (thumbMatch && thumbMatch[1]) return thumbMatch[1];

  // Format: docs.google.com/.../d/FILE_ID/...
  const docsMatch = trimmed.match(/docs\.google\.com\/(?:.*\/)?d\/([a-zA-Z0-9_-]{20,})/);
  if (docsMatch && docsMatch[1]) return docsMatch[1];

  return null;
}

/**
 * Extracts folder ID from Google Drive folder link formats
 */
export function extractDriveFolderId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If user pasted just the raw alphanumeric Google Drive Folder ID
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  // Format: https://drive.google.com/drive/folders/FOLDER_ID or /drive/u/0/folders/FOLDER_ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{20,})/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  return null;
}

/**
 * Checks if a string is a Google Drive URL or Google Drive File ID
 */
export function isDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('lh3.googleusercontent.com/d/') ||
    /^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)
  );
}

/**
 * Converts any Google Drive image share link to a direct embeddable image link (Google UserContent CDN)
 */
export function convertDriveToDirectImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    // lh3.googleusercontent.com/d/{fileId} delivers direct high-speed image bytes
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Returns the Google Drive official thumbnail proxy URL (ultra-reliable fallback across all mobile browsers)
 */
export function getDriveThumbnailUrl(url: string, size = 1600): string {
  if (!url || typeof url !== 'string') return '';
  const fileId = extractDriveFileId(url.trim());
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }
  return url;
}

/**
 * Returns alternative Google Drive endpoints for reliable fallback
 */
export function getDriveAlternativeUrls(url: string, width = 1600): string[] {
  const fileId = extractDriveFileId(url);
  if (!fileId) return [];
  return [
    `https://lh3.googleusercontent.com/d/${fileId}=w${width}`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
  ];
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

