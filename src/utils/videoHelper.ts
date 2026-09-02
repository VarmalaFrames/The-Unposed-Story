/**
 * Video Helper Utility
 * Parses, validates, and extracts embed URLs and thumbnails for
 * Instagram Reels, YouTube, Vimeo, and direct video sources.
 */

export interface VideoInfo {
  provider: 'instagram' | 'youtube' | 'vimeo' | 'direct' | 'unknown';
  embedUrl: string;
  thumbnailUrl: string;
  shortcode?: string;
  originalUrl: string;
  isVertical?: boolean;
}

/**
 * Extract Instagram Reel or Post shortcode from various URL formats:
 * - https://www.instagram.com/reel/C123abc/
 * - https://www.instagram.com/reels/C123abc/
 * - https://www.instagram.com/p/C123abc/
 * - https://www.instagram.com/tv/C123abc/
 * - instagram.com/reel/C123abc/?igsh=...
 */
export function extractInstagramShortcode(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:instagram\.com\/(?:p|reel|reels|tv)\/)([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Extract YouTube ID (works with watch, youtu.be, shorts, and embed)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

/**
 * Extract Vimeo ID
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Detect video provider from URL
 */
export function detectVideoProvider(url: string): 'instagram' | 'youtube' | 'vimeo' | 'direct' | 'unknown' {
  if (!url) return 'unknown';
  const clean = url.toLowerCase().trim();
  if (clean.includes('instagram.com/reel') || clean.includes('instagram.com/p/') || clean.includes('instagram.com/tv/')) {
    return 'instagram';
  }
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    return 'youtube';
  }
  if (clean.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov')) {
    return 'direct';
  }
  return 'unknown';
}

/**
 * Generate embeddable URL and default metadata for any video link with configurable autoplay
 */
export function parseVideoUrl(url: string, autoPlay: boolean = true): VideoInfo {
  const cleanUrl = (url || '').trim();
  const provider = detectVideoProvider(cleanUrl);

  if (provider === 'instagram') {
    const shortcode = extractInstagramShortcode(cleanUrl) || 'sample';
    // Instagram embed URL
    const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed/${autoPlay ? '?autoplay=1' : ''}`;
    // Fallback thumbnail
    const thumbnailUrl = `https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop`;

    return {
      provider: 'instagram',
      embedUrl,
      thumbnailUrl,
      shortcode,
      originalUrl: cleanUrl,
      isVertical: true,
    };
  }

  if (provider === 'youtube') {
    const ytId = extractYouTubeId(cleanUrl) || '';
    const isShort = cleanUrl.includes('/shorts/');
    const autoPlayParam = autoPlay ? 'autoplay=1&mute=1' : 'autoplay=0';
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}?${autoPlayParam}&rel=0&playsinline=1&enablejsapi=1`,
      thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '',
      shortcode: ytId,
      originalUrl: cleanUrl,
      isVertical: isShort,
    };
  }

  if (provider === 'vimeo') {
    const vmId = extractVimeoId(cleanUrl) || '';
    const autoPlayParam = autoPlay ? 'autoplay=1&muted=1' : 'autoplay=0';
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vmId}?${autoPlayParam}&playsinline=1`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop',
      shortcode: vmId,
      originalUrl: cleanUrl,
      isVertical: false,
    };
  }

  return {
    provider: provider === 'direct' ? 'direct' : 'unknown',
    embedUrl: cleanUrl,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop',
    originalUrl: cleanUrl,
    isVertical: false,
  };
}
