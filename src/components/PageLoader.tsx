import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { LOGO_EMBLEM } from '../data/initialData';
import { Sparkles } from 'lucide-react';

interface PageLoaderProps {
  settings: SiteSettings;
  onLoadingComplete?: () => void;
  duration?: number; // ms
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  settings,
  onLoadingComplete,
  duration = 1600,
}) => {
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Disable body scroll while loader is active
    document.body.style.overflow = 'hidden';

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      const doneTimer = setTimeout(() => {
        setIsDone(true);
        document.body.style.overflow = '';
        if (onLoadingComplete) onLoadingComplete();
      }, 600); // fade out duration
      return () => clearTimeout(doneTimer);
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      document.body.style.overflow = '';
    };
  }, [duration, onLoadingComplete]);

  if (isDone) return null;

  const logoSrc = settings.logoUrl || LOGO_EMBLEM;

  return (
    <div
      id="page-loader-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#080808] text-white p-6 sm:p-10 select-none transition-all duration-700 ease-in-out ${
        isFading ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background ambient luxury glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl opacity-50 animate-pulse" />
      </div>

      {/* Top Header Label */}
      <div className="relative z-10 w-full flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500 font-semibold">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Editorial Wedding Atelier</span>
        </span>
        <span>Est. 2018</span>
      </div>

      {/* Center Studio Logo & Branding */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg px-4 my-auto">
        {/* Studio Logo with Glowing Frame */}
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-neutral-700/80 p-1.5 relative overflow-hidden bg-neutral-950 shadow-2xl backdrop-blur-md flex items-center justify-center">
            {/* Subtle animated rotating ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 animate-[spin_10s_linear_infinite]" />
            
            {/* Logo Image */}
            <img
              src={logoSrc}
              alt={settings.siteName || 'Studio Logo'}
              className="w-full h-full rounded-full object-cover shadow-md transition-transform duration-700 ease-out transform scale-100 animate-fade-in"
            />
          </div>

          {/* Sparkle Accent */}
          <div className="absolute -top-1 -right-1 text-amber-400 animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Studio Name in Cinematic Serif Typography */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
          {settings.siteName || 'Sandip Lade Photography'}
        </h1>

        {/* Subtitle / Category */}
        {settings.siteSubtitle && (
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-amber-200/90 font-semibold mb-2">
            {settings.siteSubtitle}
          </p>
        )}

        {/* Tagline */}
        <p className="font-serif text-sm sm:text-base italic text-neutral-400 tracking-wide font-normal max-w-md">
          {settings.tagline || 'Timeless wedding photography & cinematic films.'}
        </p>
      </div>

      {/* Bottom Footer Details */}
      <div className="relative z-10 text-center text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-medium">
        <span>Capturing Unscripted Human Emotion · Destination Weddings</span>
      </div>
    </div>
  );
};
