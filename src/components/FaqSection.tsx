import React, { useState } from 'react';
import { FaqItem, SiteSettings } from '../types';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqSectionProps {
  faqs: FaqItem[];
  settings?: SiteSettings;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs, settings }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section id="faqs" className="py-24 md:py-32 bg-[#F9FAFB] border-b border-gray-100">
      <div className="max-w-[840px] mx-auto px-6 md:px-10">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="eyebrow justify-center">
            <span className="rule" />
            <span>{settings?.faqsBadge || 'Good to Know'}</span>
            <span className="rule" />
          </div>
          <h2 className="section-title">{settings?.faqsHeadline || 'Frequently Asked Questions'}</h2>
          {settings?.faqsSubtext && (
            <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto mt-3 font-normal leading-relaxed">
              {settings.faqsSubtext}
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={faq.id || idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="py-5"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  id={`faq-btn-${idx}`}
                  className="w-full flex items-center justify-between text-left gap-4 py-2 group cursor-pointer focus:outline-none"
                >
                  <span className="text-base md:text-lg font-bold text-gray-900 group-hover:text-black transition-colors tracking-tight">
                    {faq.question}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-900 shrink-0 shadow-2xs group-hover:border-black transition-all duration-200">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pb-2 text-sm md:text-base text-gray-600 leading-relaxed font-normal">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

