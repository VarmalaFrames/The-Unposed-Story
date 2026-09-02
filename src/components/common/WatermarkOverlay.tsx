import React from 'react';
import { SiteSettings } from '../../types';
import { LOGO_EMBLEM } from '../../data/initialData';
import { Shield, Sparkles, Camera } from 'lucide-react';

export interface WatermarkOverlayProps {
  settings?: SiteSettings;
  overrideText?: string;
  overrideLogo?: string;
  overridePosition?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center' | 'top-right' | 'diagonal-repeat';
  overrideOpacity?: number;
  overrideStyle?: 'subtle-badge' | 'minimal-clean' | 'embossed-stamp' | 'cinematic-tag';
  overrideType?: 'text' | 'logo' | 'both';
  overrideSize?: 'sm' | 'md' | 'lg';
  enabled?: boolean;
  className?: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  settings,
  overrideText,
  overrideLogo,
  overridePosition,
  overrideOpacity,
  overrideStyle,
  overrideType,
  overrideSize,
  enabled,
  className = '',
}) => {
  // Check if watermark is globally enabled or explicitly passed
  const isEnabled = enabled !== undefined ? enabled : settings?.watermarkEnabled !== false;
  if (!isEnabled) return null;

  const text =
    overrideText ??
    settings?.watermarkText ??
    (settings?.founderName
      ? `${settings?.siteName?.toUpperCase() || 'THE UNPOSED STORY'} · ${settings.founderName.toUpperCase()}`
      : 'THE UNPOSED STORY · SANDEP LADE');

  const logoUrl = overrideLogo ?? settings?.watermarkLogoUrl ?? settings?.logoUrl ?? LOGO_EMBLEM;
  const position = overridePosition ?? settings?.watermarkPosition ?? 'bottom-right';
  const rawOpacity = overrideOpacity ?? settings?.watermarkOpacity ?? 65;
  const opacity = Math.min(1, Math.max(0.1, rawOpacity / 100));
  const style = overrideStyle ?? settings?.watermarkStyle ?? 'subtle-badge';
  const type = overrideType ?? settings?.watermarkType ?? 'both';
  const size = overrideSize ?? settings?.watermarkSize ?? 'sm';

  // Size scale factors
  const sizeClasses = {
    sm: {
      text: 'text-[9px] sm:text-[10px] tracking-[0.18em]',
      logo: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
      badge: 'px-2.5 py-1 gap-1.5',
      stamp: 'text-[10px] sm:text-xs',
    },
    md: {
      text: 'text-[10px] sm:text-[12px] tracking-[0.2em]',
      logo: 'w-4 h-4 sm:w-5 sm:h-5',
      badge: 'px-3.5 py-1.5 gap-2',
      stamp: 'text-xs sm:text-sm',
    },
    lg: {
      text: 'text-xs sm:text-sm tracking-[0.22em]',
      logo: 'w-5 h-5 sm:w-6 sm:h-6',
      badge: 'px-4 py-2 gap-2.5',
      stamp: 'text-sm sm:text-base',
    },
  }[size];

  // Position mapping
  const positionClasses = {
    'bottom-right': 'bottom-3 right-3 sm:bottom-4 sm:right-4 items-end justify-end',
    'bottom-left': 'bottom-3 left-3 sm:bottom-4 sm:left-4 items-start justify-start',
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2 sm:bottom-4 items-center justify-center',
    'top-right': 'top-3 right-3 sm:top-4 sm:right-4 items-start justify-end',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center',
    'diagonal-repeat': 'inset-0 flex items-center justify-center overflow-hidden',
  }[position];

  // Diagonal repeated security pattern
  if (position === 'diagonal-repeat') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex items-center justify-center ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 sm:gap-24 -rotate-25 scale-125 whitespace-nowrap">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif font-bold uppercase tracking-[0.25em] text-[11px] sm:text-xs"
            >
              {type !== 'text' && logoUrl && (
                <img
                  src={logoUrl}
                  alt=""
                  className="w-4 h-4 object-contain brightness-200 invert"
                />
              )}
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render individual watermark badge / stamp
  return (
    <div
      className={`absolute ${positionClasses} pointer-events-none select-none z-20 transition-opacity duration-300 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* 1. Subtle Badge Style */}
      {style === 'subtle-badge' && (
        <div
          className={`inline-flex items-center rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg ${sizeClasses.badge}`}
        >
          {type !== 'text' && logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className={`${sizeClasses.logo} object-contain shrink-0 filter brightness-125`}
            />
          )}
          {type !== 'logo' && (
            <span className={`font-bold font-sans uppercase whitespace-nowrap text-neutral-100 ${sizeClasses.text}`}>
              {text}
            </span>
          )}
        </div>
      )}

      {/* 2. Minimal Clean Style (Shadow Etched) */}
      {style === 'minimal-clean' && (
        <div className="inline-flex items-center gap-1.5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {type !== 'text' && logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className={`${sizeClasses.logo} object-contain filter drop-shadow-md brightness-150`}
            />
          )}
          {type !== 'logo' && (
            <span className={`font-bold uppercase tracking-[0.2em] font-sans ${sizeClasses.text}`}>
              {text}
            </span>
          )}
        </div>
      )}

      {/* 3. Embossed Luxury Stamp */}
      {style === 'embossed-stamp' && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-amber-500/30 text-amber-200/90 shadow-xl backdrop-blur-xs">
          {type !== 'text' && logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className={`${sizeClasses.logo} object-contain filter brightness-125 sepia`}
            />
          )}
          <div className="flex flex-col text-left">
            <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.25em] text-amber-400/80 font-bold">
              © Copyright Protected
            </span>
            {type !== 'logo' && (
              <span className={`font-serif font-bold uppercase tracking-[0.16em] text-neutral-100 ${sizeClasses.text}`}>
                {text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. Cinematic Corner Monogram */}
      {style === 'cinematic-tag' && (
        <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-sm border-l-2 border-emerald-400 text-white text-[9px] uppercase tracking-[0.22em] font-mono shadow-md backdrop-blur-xs">
          <Camera className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{text}</span>
        </div>
      )}
    </div>
  );
};
