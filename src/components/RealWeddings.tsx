import React from 'react';
import { PhotoItem, SiteSettings } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface RealWeddingsProps {
  photos: PhotoItem[];
  settings?: SiteSettings;
  onSelectCouple: (coupleName: string) => void;
}

export const RealWeddings: React.FC<RealWeddingsProps> = ({ photos, settings, onSelectCouple }) => {
  // Group photos by couple
  const weddingGroups = React.useMemo(() => {
    const map = new Map<string, { coupleName: string; date: string; cover: string; count: number }>();
    photos.forEach((p) => {
      if (!p.coupleName) return;
      if (!map.has(p.coupleName)) {
        map.set(p.coupleName, {
          coupleName: p.coupleName,
          date: p.date || '',
          cover: p.image,
          count: 0,
        });
      }
      const item = map.get(p.coupleName)!;
      item.count++;
      if (p.date && p.date > item.date) {
        item.date = p.date;
        item.cover = p.image;
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [photos]);

  if (weddingGroups.length === 0) return null;

  return (
    <section id="weddings" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="eyebrow">
              <span className="rule" />
              <span>{settings?.storiesBadge || 'Real Weddings'}</span>
            </div>
            <h2 className="section-title">{settings?.storiesHeadline || 'Recent celebrations.'}</h2>
          </div>
          <p className="text-sm md:text-base text-gray-500 max-w-md font-normal leading-relaxed">
            {settings?.storiesSubtext || 'Take a deeper dive into the cohesive visual journals of couples who trusted us with their once-in-a-lifetime stories.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
          {weddingGroups.map((w, idx) => (
            <motion.div
              key={w.coupleName}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onSelectCouple(w.coupleName)}
              id={`wedding-story-${w.coupleName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-50 mb-4 border border-gray-100 shadow-2xs group-hover:border-gray-300 transition-all duration-300">
                <OptimizedImage
                  src={w.cover}
                  alt={w.coupleName}
                  targetWidth={1000}
                  quality={82}
                  watermark={settings?.watermarkShowInGallery !== false}
                  settings={settings}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-[11px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                    <span>View Wedding Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-serif text-2xl font-bold text-gray-900 group-hover:text-black transition-colors tracking-tight">
                  {w.coupleName}
                </h3>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  {w.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {w.date}
                    </span>
                  )}
                  <span>· {w.count} photos</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

