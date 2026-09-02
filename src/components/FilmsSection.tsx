import React from 'react';
import { FilmItem, SiteSettings } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { parseVideoUrl } from '../utils/videoHelper';
import { Play, Film, Instagram } from 'lucide-react';
import { motion } from 'motion/react';

interface FilmsSectionProps {
  films: FilmItem[];
  settings?: SiteSettings;
  onPlayFilm: (film: FilmItem) => void;
}

export const FilmsSection: React.FC<FilmsSectionProps> = ({ films, settings, onPlayFilm }) => {
  if (!films || films.length === 0) return null;

  return (
    <section id="films" className="py-24 md:py-32 bg-[#F9FAFB] border-b border-gray-100">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="eyebrow">
              <span className="rule" />
              <span>{settings?.filmsBadge || 'Cinematography & Reels'}</span>
            </div>
            <h2 className="section-title">{settings?.filmsHeadline || 'Wedding films in motion.'}</h2>
          </div>
          <p className="text-sm md:text-base text-gray-500 max-w-md font-normal leading-relaxed">
            {settings?.filmsSubtext || 'Heart-stirring cinematic storytelling, royal teaser films, and viral Instagram wedding reels crafted with pristine grading and heartfelt vows.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {films.map((film, idx) => {
            const videoInfo = parseVideoUrl(film.videoUrl);
            const isInstagram = videoInfo.provider === 'instagram' || film.provider === 'instagram';

            return (
              <motion.div
                key={film.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onPlayFilm(film)}
                id={`film-card-${film.id}`}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-black mb-4 border border-gray-100 shadow-2xs group-hover:border-gray-300 group-hover:shadow-md transition-all duration-300">
                  <OptimizedImage
                    src={
                      film.coverImage ||
                      (isInstagram
                        ? 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop')
                    }
                    alt={film.title}
                    targetWidth={900}
                    quality={80}
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-95"
                    containerClassName="w-full h-full"
                  />

                  {/* Ambient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center pl-0.5 shadow-2xl transition-all duration-300 group-hover:scale-110 ${
                        isInstagram
                          ? 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-pink-500/30'
                          : 'bg-white text-black'
                      }`}
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4">
                    {isInstagram ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold border border-white/10">
                        <Instagram className="w-3 h-3 text-pink-400" />
                        Instagram Reel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold border border-white/10">
                        <Film className="w-3 h-3 text-emerald-400" />
                        4K Cinema
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-black transition-colors leading-snug tracking-tight">
                  {film.title}
                </h3>
                {film.date && (
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1 font-semibold">
                    {film.date}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

