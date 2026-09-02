import React from 'react';
import { PhotoItem, SiteSettings } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { Sparkles, ArrowDown, Heart, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingShowcaseProps {
  photos: PhotoItem[];
  settings?: SiteSettings;
  onPhotoClick: (photo: PhotoItem) => void;
}

export const FloatingShowcase: React.FC<FloatingShowcaseProps> = ({ photos, settings, onPhotoClick }) => {
  if (!photos || photos.length === 0) return null;

  // Curate 5 stunning photos for the multi-layer floating stage
  const showcasePhotos = photos.slice(0, 5);

  const floatingVariants = [
    {
      animate: {
        y: [-10, 10, -10],
        rotate: [-2, 1.5, -2],
      },
      transition: {
        duration: 5.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    {
      animate: {
        y: [8, -12, 8],
        rotate: [1.8, -1.5, 1.8],
      },
      transition: {
        duration: 6.8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      },
    },
    {
      animate: {
        y: [-14, 8, -14],
        rotate: [-1, 2, -1],
      },
      transition: {
        duration: 6.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      },
    },
    {
      animate: {
        y: [10, -8, 10],
        rotate: [2.2, -1.2, 2.2],
      },
      transition: {
        duration: 7.4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.8,
      },
    },
    {
      animate: {
        y: [-8, 12, -8],
        rotate: [-1.5, 1.8, -1.5],
      },
      transition: {
        duration: 5.8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.3,
      },
    },
  ];

  const handleScrollToPackages = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('packages');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="floating-showcase"
      className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-[#FAF9F6] via-[#F5F4F0] to-white border-t border-neutral-200/70"
    >
      {/* Subtle Luxury Ambient Glow & Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-200/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1240px] mx-auto px-6 md:px-10 relative z-10">
        {/* Header Eyebrow & Title */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-neutral-900 leading-tight mb-4"
          >
            {settings?.floatingHeadline || 'Moments suspended in time.'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm md:text-base text-neutral-600 font-normal leading-relaxed"
          >
            {settings?.floatingSubtext || 'Every celebration is treated as an editorial work of art. Hover to explore the floating gallery or browse our bespoke packages below.'}
          </motion.p>
        </div>

        {/* Floating Multi-Card Interactive Canvas */}
        <div className="relative min-h-[460px] sm:min-h-[520px] md:min-h-[560px] flex items-center justify-center mb-12">
          {/* Card 1: Far Left (Portrait floating) */}
          {showcasePhotos[0] && (
            <motion.div
              variants={floatingVariants[0]}
              animate="animate"
              transition={floatingVariants[0].transition}
              whileHover={{ scale: 1.06, rotate: 0, zIndex: 40 }}
              onClick={() => onPhotoClick(showcasePhotos[0])}
              className="absolute left-2 sm:left-6 md:left-10 lg:left-16 top-6 sm:top-10 w-40 sm:w-52 md:w-60 cursor-pointer group rounded-2xl bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/80 hover:shadow-[0_24px_50px_rgba(0,0,0,0.18)] transition-all duration-300 z-10"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100">
                <OptimizedImage
                  src={showcasePhotos[0].image}
                  alt={showcasePhotos[0].caption || 'Wedding moment'}
                  targetWidth={600}
                  quality={80}
                  watermark={settings?.watermarkShowInGallery !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-xs font-medium truncate flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {showcasePhotos[0].coupleName || 'View Photo'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card 2: Top Right (Landscape floating) */}
          {showcasePhotos[1] && (
            <motion.div
              variants={floatingVariants[1]}
              animate="animate"
              transition={floatingVariants[1].transition}
              whileHover={{ scale: 1.06, rotate: 0, zIndex: 40 }}
              onClick={() => onPhotoClick(showcasePhotos[1])}
              className="absolute right-3 sm:right-8 md:right-14 lg:right-20 top-4 sm:top-8 w-44 sm:w-60 md:w-72 cursor-pointer group rounded-2xl bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/80 hover:shadow-[0_24px_50px_rgba(0,0,0,0.18)] transition-all duration-300 z-20"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                <OptimizedImage
                  src={showcasePhotos[1].image}
                  alt={showcasePhotos[1].caption || 'Wedding moment'}
                  targetWidth={700}
                  quality={80}
                  watermark={settings?.watermarkShowInGallery !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-xs font-medium truncate flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {showcasePhotos[1].coupleName || 'View Photo'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card 3: Center Anchor (Large Editorial Feature) */}
          {showcasePhotos[2] && (
            <motion.div
              variants={floatingVariants[2]}
              animate="animate"
              transition={floatingVariants[2].transition}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 50 }}
              onClick={() => onPhotoClick(showcasePhotos[2])}
              className="relative w-56 sm:w-72 md:w-88 cursor-pointer group rounded-3xl bg-white p-3 sm:p-4 shadow-[0_24px_60px_rgba(0,0,0,0.16)] border border-white hover:shadow-[0_32px_70px_rgba(0,0,0,0.22)] transition-all duration-300 z-30 mx-auto"
            >
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100">
                <OptimizedImage
                  src={showcasePhotos[2].image}
                  alt={showcasePhotos[2].caption || 'Signature Couple'}
                  targetWidth={900}
                  quality={84}
                  watermark={settings?.watermarkShowInGallery !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent flex flex-col justify-between p-4 sm:p-5">
                  <div className="self-end">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-semibold">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      Featured Story
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif text-white text-lg sm:text-xl font-medium">
                      {showcasePhotos[2].coupleName || 'Eternal Elegance'}
                    </h4>
                    <p className="text-white/80 text-xs mt-0.5">
                      {showcasePhotos[2].moment || 'Wedding Collection'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card 4: Bottom Left (Floating Card) */}
          {showcasePhotos[3] && (
            <motion.div
              variants={floatingVariants[3]}
              animate="animate"
              transition={floatingVariants[3].transition}
              whileHover={{ scale: 1.06, rotate: 0, zIndex: 40 }}
              onClick={() => onPhotoClick(showcasePhotos[3])}
              className="absolute left-6 sm:left-14 md:left-24 bottom-2 sm:bottom-6 w-44 sm:w-56 md:w-64 cursor-pointer group rounded-2xl bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/80 hover:shadow-[0_24px_50px_rgba(0,0,0,0.18)] transition-all duration-300 z-20"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                <OptimizedImage
                  src={showcasePhotos[3].image}
                  alt={showcasePhotos[3].caption || 'Wedding moment'}
                  targetWidth={700}
                  quality={80}
                  watermark={settings?.watermarkShowInGallery !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-xs font-medium truncate flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {showcasePhotos[3].coupleName || 'View Photo'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Card 5: Bottom Right (Floating Portrait) */}
          {showcasePhotos[4] && (
            <motion.div
              variants={floatingVariants[4]}
              animate="animate"
              transition={floatingVariants[4].transition}
              whileHover={{ scale: 1.06, rotate: 0, zIndex: 40 }}
              onClick={() => onPhotoClick(showcasePhotos[4])}
              className="absolute right-4 sm:right-10 md:right-20 bottom-3 sm:bottom-8 w-36 sm:w-48 md:w-56 cursor-pointer group rounded-2xl bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-white/80 hover:shadow-[0_24px_50px_rgba(0,0,0,0.18)] transition-all duration-300 z-10"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100">
                <OptimizedImage
                  src={showcasePhotos[4].image}
                  alt={showcasePhotos[4].caption || 'Wedding moment'}
                  targetWidth={600}
                  quality={80}
                  watermark={settings?.watermarkShowInGallery !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-xs font-medium truncate flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {showcasePhotos[4].coupleName || 'View Photo'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom CTA leading into Packages */}
        <div className="flex justify-center">
          <a
            href="#packages"
            onClick={handleScrollToPackages}
            id="floating-to-packages-btn"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white border border-neutral-200 text-neutral-800 text-xs uppercase tracking-widest font-bold shadow-xs hover:shadow-md hover:border-neutral-400 hover:scale-102 active:scale-98 transition-all"
          >
            <span>Explore Investment &amp; Packages</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
};
