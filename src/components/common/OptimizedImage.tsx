import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { SiteSettings } from '../../types';
import { WatermarkOverlay } from './WatermarkOverlay';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  targetWidth?: number;
  quality?: number;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  fallbackIconSize?: number;
  watermark?: boolean;
  settings?: SiteSettings;
  preventStealing?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  targetWidth = 1200,
  quality = 82,
  priority = false,
  className = '',
  containerClassName = '',
  fallbackIconSize = 22,
  watermark = false,
  settings,
  preventStealing,
  onClick,
  ...props
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [attemptedRawFallback, setAttemptedRawFallback] = useState<boolean>(false);

  // Compute optimized URL based on CDN / Direct link
  const optimizedSrc = React.useMemo(() => {
    return getOptimizedImageUrl(src, targetWidth, quality);
  }, [src, targetWidth, quality]);

  const [activeSrc, setActiveSrc] = useState<string>(optimizedSrc || src || '');

  useEffect(() => {
    setLoaded(false);
    setHasError(false);
    setAttemptedRawFallback(false);
    setActiveSrc(optimizedSrc || src || '');
  }, [src, optimizedSrc]);

  const handleError = () => {
    // If the optimized URL failed and we haven't tried the raw src, retry with the raw src
    if (!attemptedRawFallback && activeSrc !== src && src) {
      setAttemptedRawFallback(true);
      setActiveSrc(src);
    } else {
      setHasError(true);
    }
  };

  const shouldPreventStealing =
    preventStealing !== undefined
      ? preventStealing
      : settings?.preventImageStealing !== false;

  return (
    <div
      className={`relative overflow-hidden bg-neutral-100/80 select-none ${containerClassName}`}
      onClick={onClick}
      onContextMenu={(e) => {
        if (shouldPreventStealing) {
          e.preventDefault();
        }
      }}
    >
      {/* Error Fallback */}
      {hasError ? (
        <div className="w-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center text-neutral-400 bg-neutral-100">
          <ImageOff className="mb-2 opacity-50" style={{ width: fallbackIconSize, height: fallbackIconSize }} />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">Image unavailable</span>
          <span className="text-[9px] text-neutral-400 mt-1 max-w-[180px] truncate">{alt || 'Photo'}</span>
        </div>
      ) : (
        <>
          <img
            src={activeSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            referrerPolicy="no-referrer"
            draggable={!shouldPreventStealing}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            className={`block max-w-full transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-95'
            } ${className}`}
            {...props}
          />
          {/* Watermark Overlay */}
          {watermark && loaded && !hasError && (
            <WatermarkOverlay settings={settings} />
          )}
        </>
      )}
    </div>
  );
};

