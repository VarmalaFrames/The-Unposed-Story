import React from 'react';
import { PackageItem, SiteSettings } from '../types';
import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PackagesSectionProps {
  packages: PackageItem[];
  settings?: SiteSettings;
  onSelectPackage: (pkg: PackageItem) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({ packages, settings, onSelectPackage }) => {
  if (!packages || packages.length === 0) return null;

  return (
    <section id="packages" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <div className="eyebrow">
              <span className="rule" />
              <span>{settings?.packagesBadge || 'Investment & Offerings'}</span>
            </div>
            <h2 className="section-title">{settings?.packagesHeadline || 'Designed for timeless legacy.'}</h2>
          </div>
          <p className="text-sm md:text-base text-gray-500 max-w-md font-normal leading-relaxed">
            {settings?.packagesSubtext || 'Transparent collections tailored for intimate gatherings, traditional ceremonies, and grand destination celebrations.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg, idx) => {
            const isHighlight = pkg.highlight;
            const inclusions = pkg.description
              ? pkg.description
                  .split('\n')
                  .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
                  .filter(Boolean)
              : [];

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                id={`package-card-${pkg.id}`}
                className={`relative flex flex-col justify-between p-8 sm:p-10 rounded-2xl transition-all duration-300 ${
                  isHighlight
                    ? 'bg-[#111827] text-white border border-gray-800 shadow-xl md:-translate-y-2'
                    : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-400 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Highlight Badge */}
                {isHighlight && (
                  <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-emerald-400 text-black text-[10px] uppercase tracking-widest font-extrabold flex items-center gap-1.5 shadow-md">
                    <span>Most Chosen by Couples</span>
                  </div>
                )}

                <div>
                  <h3
                    className={`font-serif text-2xl font-bold mb-2 tracking-tight ${
                      isHighlight ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {pkg.name}
                  </h3>
                  <div
                    className={`font-serif text-3xl sm:text-4xl font-normal mb-6 pb-6 border-b ${
                      isHighlight
                        ? 'text-white border-gray-800'
                        : 'text-gray-900 border-gray-100'
                    }`}
                  >
                    {pkg.price}
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {inclusions.map((item, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-3 text-xs md:text-sm leading-relaxed ${
                          isHighlight ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isHighlight ? 'text-emerald-400' : 'text-black'
                          }`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectPackage(pkg)}
                  id={`btn-inquire-${pkg.id}`}
                  className={`w-full py-3.5 rounded-full text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    isHighlight
                      ? 'bg-white text-black hover:bg-gray-100 shadow-md'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <span>Inquire for this Package</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

