import React from 'react';
import { PhotoItem, SiteSettings } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

interface FeaturedGridProps {
  photos: PhotoItem[];
  settings?: SiteSettings;
  onPhotoClick: (photo: PhotoItem) => void;
}

export const FeaturedGrid: React.FC<FeaturedGridProps> = ({ photos, settings, onPhotoClick }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <section id="featured-work" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="eyebrow">
              <span className="rule" />
              <span>{settings?.featuredBadge || 'Curated Highlights'}</span>
            </div>
            <h2 className="section-title">{settings?.featuredHeadline || 'Moments that linger.'}</h2>
          </div>
          <p className="text-sm md:text-base text-gray-500 max-w-md font-normal leading-relaxed">
            {settings?.featuredSubtext || 'Hand-picked frames reflecting genuine connection, unchoreographed emotions, and timeless intimacy.'}
          </p>
        </div>

        {/* Asymmetric Bento-style Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.slice(0, 6).map((photo, index) => {
            const isBig = index === 0;
            return (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onPhotoClick(photo)}
                id={`featured-card-${photo.id}`}
                className={`group relative overflow-hidden rounded-xl bg-gray-50 border border-gray-100 cursor-pointer shadow-xs hover:border-gray-300 transition-all duration-300 ${
                  isBig
                    ? 'sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto sm:min-h-[520px]'
                    : 'aspect-[4/5]'
                }`}
              >
                <OptimizedImage
                  src={photo.image}
                  alt={photo.caption || photo.moment || 'Wedding Photo'}
                  targetWidth={isBig ? 1400 : 800}
                  quality={82}
                  watermark={settings?.watermarkShowInFeatured !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  containerClassName="w-full h-full"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6" />

                {/* Hover Caption at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  {photo.caption && (
                    <p className="text-white text-base md:text-lg font-medium leading-snug">
                      "{photo.caption}"
                    </p>
                  )}
                  {photo.coupleName && (
                    <p className="text-gray-300 text-xs uppercase tracking-wider mt-1.5 font-semibold">
                      {photo.coupleName} {photo.date ? `· ${photo.date}` : ''}
                    </p>
                  )}
                </div>

                {/* Expand Icon */}
                <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

