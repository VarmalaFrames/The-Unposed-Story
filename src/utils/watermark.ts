import { SiteSettings } from '../types';
import { LOGO_EMBLEM } from '../data/initialData';

export interface WatermarkCanvasOptions {
  text?: string;
  logoUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center' | 'top-right' | 'diagonal-repeat';
  opacity?: number; // 0 - 100
  style?: 'subtle-badge' | 'minimal-clean' | 'embossed-stamp' | 'cinematic-tag';
  type?: 'text' | 'logo' | 'both';
  scale?: number; // 1 = default canvas scale
}

/**
 * Creates a watermarked image URL (data URL) using HTML5 Canvas.
 * Protects high-resolution and preview photographs with the studio's branding.
 */
export async function applyWatermarkToCanvas(
  imageUrl: string,
  options: WatermarkCanvasOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(imageUrl);
        }

        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        // Draw original photo
        ctx.drawImage(img, 0, 0);

        const text = options.text || 'THE UNPOSED STORY · SANDEP LADE';
        const position = options.position || 'bottom-right';
        const opacity = (options.opacity ?? 65) / 100;
        const type = options.type || 'both';
        const style = options.style || 'subtle-badge';

        ctx.save();
        ctx.globalAlpha = opacity;

        const w = canvas.width;
        const h = canvas.height;
        const baseFontSize = Math.max(16, Math.round(Math.min(w, h) * 0.024));

        if (position === 'diagonal-repeat') {
          // Repeated diagonal tiled watermark across the entire photo
          ctx.font = `600 ${baseFontSize}px 'Cinzel', 'Playfair Display', serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 1;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          ctx.rotate((-28 * Math.PI) / 180);
          const stepX = baseFontSize * 16;
          const stepY = baseFontSize * 8;

          for (let x = -w * 1.5; x < w * 2; x += stepX) {
            for (let y = -h * 1.5; y < h * 2; y += stepY) {
              ctx.strokeText(text, x, y);
              ctx.fillText(text, x, y);
            }
          }
        } else {
          // Positioned watermark badge / tag
          ctx.font = `700 ${baseFontSize}px 'Montserrat', sans-serif`;
          const textMetrics = ctx.measureText(text);
          const paddingH = baseFontSize * 1.2;
          const paddingV = baseFontSize * 0.7;
          const badgeWidth = textMetrics.width + paddingH * 2;
          const badgeHeight = baseFontSize * 2.2;
          const margin = Math.max(20, Math.round(Math.min(w, h) * 0.04));

          let x = w - badgeWidth - margin;
          let y = h - badgeHeight - margin;

          if (position === 'bottom-left') {
            x = margin;
            y = h - badgeHeight - margin;
          } else if (position === 'bottom-center') {
            x = (w - badgeWidth) / 2;
            y = h - badgeHeight - margin;
          } else if (position === 'top-right') {
            x = w - badgeWidth - margin;
            y = margin;
          } else if (position === 'center') {
            x = (w - badgeWidth) / 2;
            y = (h - badgeHeight) / 2;
          }

          if (style === 'subtle-badge') {
            // Rounded dark translucent badge
            ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
            ctx.beginPath();
            const radius = badgeHeight / 2;
            ctx.roundRect(x, y, badgeWidth, badgeHeight, radius);
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Text
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x + badgeWidth / 2, y + badgeHeight / 2);
          } else if (style === 'embossed-stamp') {
            // Circular / squared luxury embossed photographer seal
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#F8FAFC';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`© ${text}`, x, y + badgeHeight / 2);
          } else {
            // Minimal clean with text shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y + badgeHeight / 2);
          }
        }

        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch {
        // In case of CORS or canvas security restrictions, fallback gracefully to original
        resolve(imageUrl);
      }
    };

    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

/**
 * Downloads a watermarked photo to client device
 */
export async function downloadWatermarkedPhoto(
  imageUrl: string,
  filename: string,
  options?: WatermarkCanvasOptions
) {
  try {
    const watermarkedDataUrl = await applyWatermarkToCanvas(imageUrl, options);
    const link = document.createElement('a');
    link.href = watermarkedDataUrl;
    link.download = filename || 'the-unposed-story-photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to download watermarked photo:', err);
  }
}
