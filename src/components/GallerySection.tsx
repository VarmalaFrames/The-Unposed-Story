import React, { useState, useMemo } from 'react';
import { PhotoItem, SiteSettings } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { Layers, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface GallerySectionProps {
  photos: PhotoItem[];
  settings?: SiteSettings;
  onPhotoClick: (photo: PhotoItem) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ photos, settings, onPhotoClick }) => {
  const [activeMoment, setActiveMoment] = useState<string>('All');
  const [activeCouple, setActiveCouple] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(9);

  // Derive unique moments and couples
  const moments = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.moment) set.add(p.moment);
    });
    return ['All', ...Array.from(set)];
  }, [photos]);

  const couples = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.coupleName) set.add(p.coupleName);
    });
    return ['All', ...Array.from(set)];
  }, [photos]);

  // Filtered list
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchMoment = activeMoment === 'All' || p.moment === activeMoment;
      const matchCouple = activeCouple === 'All' || p.coupleName === activeCouple;
      return matchMoment && matchCouple;
    });
  }, [photos, activeMoment, activeCouple]);

  const visiblePhotos = filteredPhotos.slice(0, visibleCount);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-[#F9FAFB] border-b border-gray-100">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="eyebrow">
              <span className="rule" />
              <span>{settings?.galleryBadge || 'Full Portfolio'}</span>
            </div>
            <h2 className="section-title">{settings?.galleryHeadline || 'Every day, in its own light.'}</h2>
          </div>
          <p className="text-sm md:text-base text-gray-500 max-w-md font-normal leading-relaxed">
            {settings?.gallerySubtext || 'Filter through ceremonies, traditions, and emotions to experience the full tapestry of real wedding celebrations.'}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-10 pb-6 border-b border-gray-200">
          {/* Moment Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {moments.map((m) => {
              const isActive = activeMoment === m;
              return (
                <button
                  key={m}
                  onClick={() => {
                    setActiveMoment(m);
                    setVisibleCount(9);
                  }}
                  id={`filter-moment-${m.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-900 hover:text-black'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Couple Selection Dropdown (if multiple couples exist) */}
          {couples.length > 2 && (
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] uppercase tracking-widest text-gray-400 font-bold hidden sm:inline">
                Wedding:
              </span>
              <div className="relative">
                <select
                  value={activeCouple}
                  onChange={(e) => {
                    setActiveCouple(e.target.value);
                    setVisibleCount(9);
                  }}
                  id="couple-select-filter"
                  className="appearance-none pl-4 pr-9 py-2 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-black cursor-pointer shadow-2xs"
                >
                  {couples.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All Celebrations' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Gallery Grid / Masonry */}
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200 p-8">
            <Layers className="w-8 h-8 text-gray-400 mx-auto mb-3 opacity-60" />
            <p className="text-base text-gray-600 font-medium">No photographs found for this filter selection.</p>
            <button
              onClick={() => {
                setActiveMoment('All');
                setActiveCouple('All');
              }}
              className="mt-4 px-5 py-2 text-xs uppercase tracking-widest font-bold text-black border border-black rounded-full hover:bg-black hover:text-white transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
              {visiblePhotos.map((photo, idx) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.6, delay: (idx % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onPhotoClick(photo)}
                  id={`gallery-item-${photo.id}`}
                  className="group relative mb-6 break-inside-avoid overflow-hidden rounded-xl bg-white cursor-pointer border border-gray-100 shadow-2xs hover:border-gray-300 hover:shadow-md transition-all duration-300"
                >
                  <OptimizedImage
                    src={photo.image}
                    alt={photo.caption || photo.moment || 'Wedding Photo'}
                    targetWidth={800}
                    quality={80}
                    watermark={settings?.watermarkShowInGallery !== false}
                    settings={settings}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    containerClassName="w-full min-h-[220px] bg-neutral-100"
                  />

                  {/* Gradient Caption Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    {photo.moment && (
                      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                        {photo.moment}
                      </span>
                    )}
                    {photo.caption && (
                      <p className="text-white text-sm md:text-base font-medium leading-snug">
                        {photo.caption}
                      </p>
                    )}
                    {photo.coupleName && (
                      <p className="text-gray-300 text-[11px] uppercase tracking-wider mt-1 font-semibold">
                        {photo.coupleName} {photo.date ? `· ${photo.date}` : ''}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredPhotos.length && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  id="gallery-load-more-btn"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black text-white text-[11px] uppercase tracking-widest font-bold hover:bg-gray-800 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <span>Load More Photos ({filteredPhotos.length - visibleCount} remaining)</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
