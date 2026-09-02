/**
 * Intelligent Image Optimization & CDN Helper
 * Dynamically adjusts image URLs (Unsplash, Google Drive, Cloudinary, etc.)
 * to request appropriately sized, compressed, and next-gen (WebP/AVIF) formats.
 */

/**
 * Optimizes an image URL for the requested display width and quality.
 * Supports Unsplash CDN, Google Drive Direct CDN (lh3.googleusercontent.com),
 * and provides safe passthrough for data URLs and custom CDNs.
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  width: number = 1200,
  quality: number = 82
): string {
  if (!src) return '';

  const clean = src.trim();

  // If base64 data URL, return as is (already compressed during upload)
  if (clean.startsWith('data:')) {
    return clean;
  }

  // 1. Unsplash Optimization
  if (clean.includes('images.unsplash.com')) {
    try {
      const url = new URL(clean);
      url.searchParams.set('auto', 'format');
      if (!url.searchParams.has('fit')) {
        url.searchParams.set('fit', 'crop');
      }
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('w', width.toString());
      return url.toString();
    } catch {
      // Fallback regex replacement if URL parse fails
      return clean.replace(/([?&]w=)\d+/, `$1${width}`).replace(/([?&]q=)\d+/, `$1${quality}`);
    }
  }

  // 2. Google Drive / Google User Content Optimization
  // lh3.googleusercontent.com supports =w{width} parameter at the end
  if (clean.includes('lh3.googleusercontent.com/d/')) {
    const base = clean.split('=')[0];
    return `${base}=w${width}`;
  }

  if (clean.includes('lh3.googleusercontent.com/u/')) {
    const base = clean.split('=')[0];
    return `${base}=w${width}`;
  }

  // 3. Cloudinary Optimization
  if (clean.includes('res.cloudinary.com') && clean.includes('/upload/')) {
    return clean.replace(
      '/upload/',
      `/upload/f_auto,q_auto:${quality > 85 ? 'best' : 'good'},w_${width},c_limit/`
    );
  }

  return clean;
}

/**
 * Generates a responsive srcset string for high-DPI displays (Retina) and varying screen sizes.
 */
export function generateSrcSet(src: string | undefined | null, widths: number[] = [400, 800, 1200, 1600]): string {
  if (!src || src.startsWith('data:')) return '';

  return widths
    .map((w) => `${getOptimizedImageUrl(src, w)} ${w}w`)
    .join(', ');
}

/**
 * Preloads high-priority critical images (e.g. Hero banner)
 */
export function preloadImage(src: string, width?: number): void {
  if (typeof window === 'undefined' || !src) return;
  const optimized = width ? getOptimizedImageUrl(src, width) : src;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimized;
  document.head.appendChild(link);
}
