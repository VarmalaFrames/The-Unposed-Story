import React from 'react';
import { SiteSettings, PhotoItem } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { ChevronDown, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  settings: SiteSettings;
  heroPhoto?: PhotoItem;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, heroPhoto, onExploreClick }) => {
  const heroImageSrc =
    heroPhoto?.image ||
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1600&auto=format&fit=crop';

  return (
    <header
      id="top"
      className="relative w-full h-screen min-h-[640px] flex items-end justify-center overflow-hidden bg-black"
    >
      {/* Background Media */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <OptimizedImage
          src={heroImageSrc}
          alt={settings.siteName}
          priority={true}
          targetWidth={1800}
          quality={85}
          className="w-full h-full object-cover object-center"
          containerClassName="w-full h-full"
        />
        {/* Minimalist Dark Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-6 md:px-10 pb-16 md:pb-24">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-white leading-[1.08] tracking-tight mb-6"
          >
            <span className="block font-serif italic text-white/95">
              {settings.tagline.includes('.') ? (
                <>
                  <span className="font-sans font-light tracking-tight text-white block text-2xl sm:text-3xl md:text-4xl mb-2 opacity-90">
                    {settings.tagline.split('.')[0]}.
                  </span>
                  <span className="font-serif italic font-normal text-4xl sm:text-5xl md:text-6xl lg:text-7xl block text-white">
                    {settings.tagline.split('.').slice(1).join('.').trim() || settings.tagline}
                  </span>
                </>
              ) : (
                settings.tagline
              )}
            </span>
          </motion.h1>

          {settings.heroSubtext && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
              className="text-sm sm:text-base text-white/80 font-normal max-w-xl mb-8 leading-relaxed"
            >
              {settings.heroSubtext}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-4 sm:gap-5"
          >
            <button
              onClick={onExploreClick}
              id="hero-explore-gallery-btn"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-[11px] uppercase tracking-widest font-bold transition-all duration-200 hover:bg-gray-100 shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Explore Gallery</span>
              <ArrowDownRight className="w-4 h-4" />
            </button>

            <a
              href="#contact"
              id="hero-check-availability-btn"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] uppercase tracking-widest font-semibold transition-all duration-200 hover:bg-white/20 cursor-pointer"
            >
              <span>Check Availability</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle bottom scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1.5 text-white/40 text-[9px] tracking-widest uppercase font-semibold"
      >
        <span>Scroll to explore</span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
      </motion.div>
    </header>
  );
};

