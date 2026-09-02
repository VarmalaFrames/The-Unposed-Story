import React, { useEffect, useState } from 'react';
import { FilmItem } from '../types';
import { parseVideoUrl } from '../utils/videoHelper';
import {
  X,
  Film,
  Instagram,
  ExternalLink,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  Maximize2,
} from 'lucide-react';

interface VideoModalProps {
  film: FilmItem | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ film, onClose }) => {
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  useEffect(() => {
    if (film) {
      const info = parseVideoUrl(film.videoUrl);
      const isReelOrShort = info.provider === 'instagram' || film.provider === 'instagram' || info.isVertical;
      setOrientation(isReelOrShort ? 'vertical' : 'horizontal');
    }
  }, [film]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!film) return null;

  const videoInfo = parseVideoUrl(film.videoUrl, isAutoplay);
  const isInstagram = videoInfo.provider === 'instagram' || film.provider === 'instagram';

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'));
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      id="film-video-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fade-in text-white overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full bg-neutral-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 ${
          isVertical ? 'max-w-md my-auto' : 'max-w-5xl my-auto'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-900/95 border-b border-gray-800">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            {isInstagram ? (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shrink-0">
                <Instagram className="w-4 h-4 text-white" />
              </div>
            ) : (
              <Film className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
                {film.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                <span>{isInstagram ? 'Instagram Reel' : 'Cinema Film'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">
                  {isVertical ? '9:16 Vertical' : '16:9 Landscape'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Video Angle: Vertical <-> Horizontal */}
            <button
              onClick={toggleOrientation}
              id="video-orientation-toggle-btn"
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                isVertical
                  ? 'bg-purple-600/80 hover:bg-purple-600 text-white shadow-xs'
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-xs'
              }`}
              title={isVertical ? 'Switch to Horizontal / Wide Screen' : 'Switch to Vertical / Phone Reel Angle'}
            >
              {isVertical ? (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vertical (9:16)</span>
                  <RotateCw className="w-3 h-3 text-purple-200" />
                </>
              ) : (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Horizontal (16:9)</span>
                  <RotateCw className="w-3 h-3 text-indigo-200" />
                </>
              )}
            </button>

            {/* Toggle Autoplay */}
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              id="video-autoplay-toggle-btn"
              className={`p-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                isAutoplay
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
              title={isAutoplay ? 'Autoplay Enabled' : 'Autoplay Disabled'}
            >
              <div className="flex items-center gap-1 px-1">
                <Play className={`w-3 h-3 ${isAutoplay ? 'text-emerald-400 fill-emerald-400' : ''}`} />
                <span className="text-[10px] hidden md:inline">{isAutoplay ? 'Auto' : 'Manual'}</span>
              </div>
            </button>

            {isInstagram && (
              <a
                href={film.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold tracking-wide transition-colors"
                title="Open directly in Instagram"
              >
                <span>Instagram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={onClose}
              id="video-modal-close-btn"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close video player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Container with Dynamic Angle */}
        <div className="relative w-full bg-black flex flex-col items-center justify-center transition-all duration-300">
          <div
            className={`w-full bg-black transition-all duration-300 flex items-center justify-center ${
              isVertical
                ? 'aspect-[9/16] max-h-[75vh] min-h-[480px]'
                : 'aspect-video max-h-[75vh] min-h-[300px]'
            }`}
          >
            <iframe
              key={`${videoInfo.embedUrl}-${orientation}-${isAutoplay}`}
              src={videoInfo.embedUrl}
              title={film.title}
              className="w-full h-full border-0"
              allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              scrolling="no"
            />
          </div>

          {/* Quick controls bar below video */}
          <div className="w-full py-2.5 px-4 bg-gray-900/90 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-300">
                Mode: <strong className="text-white capitalize">{orientation} View</strong>
              </span>
              <button
                onClick={toggleOrientation}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer ml-1"
              >
                Switch to {isVertical ? 'Horizontal (16:9)' : 'Vertical Reel (9:16)'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400">
                Autoplay: <span className={isAutoplay ? 'text-emerald-400 font-bold' : 'text-gray-400'}>{isAutoplay ? 'ON' : 'OFF'}</span>
              </span>
              {isInstagram && (
                <a
                  href={film.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>Open Reel</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
