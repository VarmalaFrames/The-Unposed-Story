import React from 'react';
import { TestimonialItem, SiteSettings } from '../types';
import { Quote } from 'lucide-react';
import { motion } from 'motion/react';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  settings?: SiteSettings;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials, settings }) => {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-[#F9FAFB] border-b border-gray-100">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="eyebrow justify-center">
            <span className="rule" />
            <span>{settings?.testimonialsBadge || 'Kind Words'}</span>
            <span className="rule" />
          </div>
          <h2 className="section-title">{settings?.testimonialsHeadline || "From couples we've walked with."}</h2>
          {settings?.testimonialsSubtext && (
            <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto mt-3 font-normal leading-relaxed">
              {settings.testimonialsSubtext}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              id={`testimonial-card-${t.id}`}
              className="bg-white p-8 md:p-10 rounded-2xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-gray-300 hover:shadow-md transition-all relative"
            >
              <Quote className="w-8 h-8 text-gray-300 mb-4" />
              <p className="font-serif italic text-lg md:text-xl text-gray-800 leading-relaxed mb-6 font-normal">
                "{t.quote}"
              </p>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-gray-900 font-bold">
                  {t.coupleName}
                </p>
                {t.date && (
                  <span className="text-[10px] text-gray-400 font-medium">{t.date}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

