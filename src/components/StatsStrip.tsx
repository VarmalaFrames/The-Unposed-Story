import React from 'react';
import { SiteSettings } from '../types';
import { DEFAULT_STRIP_AVATARS } from '../data/initialData';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsStripProps {
  settings: SiteSettings;
  weddingsCount?: number;
}

export const StatsStrip: React.FC<StatsStripProps> = ({ settings }) => {
  // Use configured scroller avatars from site settings or default curated list
  const avatarList = (settings.stripAvatars && settings.stripAvatars.length > 0)
    ? settings.stripAvatars
    : DEFAULT_STRIP_AVATARS;

  // Ensure adequate items for seamless infinite marquee loop
  const repeatCount = Math.max(3, Math.ceil(24 / Math.max(1, avatarList.length)));
  const seamlessAvatars = Array(repeatCount).fill(avatarList).flat();

  return (
    <section
      id="stats-strip"
      className="py-8 sm:py-10 md:py-12 bg-[#FAFAFA] border-y border-neutral-200/80 overflow-hidden relative"
    >
      <div className="max-w-5xl mx-auto px-6 text-center">
        {/* 5 Solid Black Stars */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-1.5 mb-3 sm:mb-4"
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-neutral-900 text-neutral-900"
              strokeWidth={0}
            />
          ))}
        </motion.div>

        {/* Continuous Horizontal Circular Avatar Carousel with reduced spacing */}
        <div className="relative w-full max-w-2xl sm:max-w-3xl mx-auto overflow-hidden py-1 mb-4 sm:mb-6">
          {/* Left & Right Soft Fade Masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-[#FAFAFA] via-[#FAFAFA]/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-[#FAFAFA] via-[#FAFAFA]/80 to-transparent z-10" />

          <motion.div
            className="flex items-center gap-2.5 sm:gap-3.5 w-max"
            animate={{
              x: ['0%', '-50%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 25,
                ease: 'linear',
              },
            }}
          >
            {seamlessAvatars.map((avatar, idx) => {
              const optimizedThumb = getOptimizedImageUrl(avatar.src, 160, 75);
              return (
                <div
                  key={`${avatar.id}-${idx}`}
                  className="flex-shrink-0 group relative p-0.5"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white shadow-[0_3px_12px_rgba(0,0,0,0.07)] bg-neutral-200 transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={optimizedThumb}
                      alt={avatar.alt || 'Wedding story portrait'}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Narrative Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-xl sm:text-2xl md:text-3xl text-neutral-900 font-sans font-normal tracking-tight leading-snug max-w-2xl sm:max-w-3xl mx-auto mb-2 sm:mb-2.5"
        >
          {settings.statsQuoteText || 'Every photo should tell a story, blending art and emotion to capture unique moments.'}
        </motion.h2>

        {/* Subtitle / Signature */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-xs sm:text-sm text-neutral-500 font-normal tracking-wide"
        >
          {settings.statsQuoteAuthor || `Photography by ${settings.founderName || 'Sandip'}`}
        </motion.p>
      </div>
    </section>
  );
};
