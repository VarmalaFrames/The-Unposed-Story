import React, { useEffect } from 'react';
import { PhotoItem, SiteSettings } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { X, ChevronLeft, ChevronRight, Calendar, ShieldCheck } from 'lucide-react';

interface LightboxProps {
  photo: PhotoItem | null;
  allPhotos: PhotoItem[];
  settings?: SiteSettings;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photo,
  allPhotos,
  settings,
  onClose,
  onNext,
  onPrev,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  const currentIndex = photo ? allPhotos.findIndex((p) => p.id === photo.id) : -1;

  // Intelligent Pre-caching of Adjacent Photos (Next & Previous)
  useEffect(() => {
    if (currentIndex === -1 || allPhotos.length <= 1) return;

    const nextIdx = (currentIndex + 1) % allPhotos.length;
    const prevIdx = (currentIndex - 1 + allPhotos.length) % allPhotos.length;

    const preloadTargets = [allPhotos[nextIdx]?.image, allPhotos[prevIdx]?.image];

    preloadTargets.forEach((imgSrc) => {
      if (imgSrc) {
        const img = new Image();
        img.src = getOptimizedImageUrl(imgSrc, 1800, 88);
      }
    });
  }, [currentIndex, allPhotos]);

  if (!photo) return null;

  return (
    <div
      id="fullscreen-lightbox"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-fade-in text-white"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/70 font-semibold">
          {photo.moment && (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {photo.moment}
            </span>
          )}
          {currentIndex !== -1 && (
            <span className="text-white/40">
              ({currentIndex + 1} / {allPhotos.length})
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          id="lightbox-close-btn"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close Lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {/* Prev Arrow */}
        <button
          onClick={onPrev}
          id="lightbox-prev-btn"
          className="absolute left-2 sm:left-6 z-10 w-12 h-12 rounded-full bg-black/60 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
          aria-label="Previous Photo"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Center Image */}
        <div className="max-w-5xl max-h-[72vh] flex items-center justify-center p-2 relative">
          <OptimizedImage
            src={photo.image}
            alt={photo.caption || 'Wedding Photo'}
            targetWidth={1800}
            quality={88}
            priority={true}
            watermark={settings?.watermarkShowInLightbox !== false}
            settings={settings}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl transition-all"
            containerClassName="max-h-[72vh] flex items-center justify-center"
          />
        </div>

        {/* Next Arrow */}
        <button
          onClick={onNext}
          id="lightbox-next-btn"
          className="absolute right-2 sm:right-6 z-10 w-12 h-12 rounded-full bg-black/60 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md cursor-pointer"
          aria-label="Next Photo"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Metadata & Caption */}
      <div className="w-full max-w-4xl mx-auto text-center z-10 pb-2">
        {photo.caption && (
          <p className="text-lg sm:text-xl text-white font-medium leading-snug mb-1">
            "{photo.caption}"
          </p>
        )}
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-wider text-gray-400 font-semibold">
          {photo.coupleName && <span className="text-white">{photo.coupleName}</span>}
          {photo.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-500" />
              {photo.date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
