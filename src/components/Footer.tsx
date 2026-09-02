import React, { useState } from 'react';
import { SiteSettings } from '../types';
import { LOGO_EMBLEM } from '../data/initialData';
import { Heart, Instagram, Phone, Mail } from 'lucide-react';

interface FooterProps {
  settings: SiteSettings;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin }) => {
  const [clickCount, setClickCount] = useState(0);

  const handleSecretClick = () => {
    const next = clickCount + 1;
    if (next >= 3) {
      setClickCount(0);
      onOpenAdmin();
    } else {
      setClickCount(next);
      setTimeout(() => setClickCount(0), 3000);
    }
  };

  const logoSrc = settings.logoUrl || LOGO_EMBLEM;
  const logoType = settings.logoType || 'both';

  return (
    <footer id="footer" className="bg-black text-white border-t border-gray-900 pt-16 pb-12">
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-gray-900 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              {(logoType === 'both' || logoType === 'image') && (
                <img
                  src={logoSrc}
                  alt={settings.siteName}
                  className="w-9 h-9 rounded-full object-cover shadow-xs"
                />
              )}
              {(logoType === 'both' || logoType === 'text') && (
                <div>
                  <span className="font-serif text-xl md:text-2xl font-bold tracking-tight block">
                    {settings.siteName}
                  </span>
                  {settings.siteSubtitle && (
                    <span className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-semibold block">
                      {settings.siteSubtitle}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs md:text-sm font-normal leading-relaxed max-w-sm">
              Mumbai-based candid wedding photography and cinematic filmmaking studio documenting authentic love stories across India &amp; worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 flex flex-col gap-2.5 text-xs uppercase tracking-widest font-semibold text-gray-400">
            <a href="#gallery" className="hover:text-white transition-colors">Portfolio Gallery</a>
            <a href="#weddings" className="hover:text-white transition-colors">Real Weddings</a>
            <a href="#packages" className="hover:text-white transition-colors">Pricing &amp; Collections</a>
            <a href="#about" className="hover:text-white transition-colors">About the Studio</a>
            <a href="#contact" className="hover:text-white transition-colors">Book a Consultation</a>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-3 text-xs text-gray-400 space-y-2.5 font-normal">
            <p className="text-white uppercase tracking-widest font-bold mb-3">Direct Contact</p>
            {settings.contactPhone && (
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{settings.contactPhone}</span>
              </p>
            )}
            {settings.contactEmail && (
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{settings.contactEmail}</span>
              </p>
            )}
            {settings.instagram && (
              <p className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>@{settings.instagram.replace('@', '')}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p
            onClick={handleSecretClick}
            title="© The Unposed Story"
            className="flex items-center gap-1.5 font-normal select-none cursor-default"
          >
            <span>© {new Date().getFullYear()} {settings.siteName}. Documenting authentic stories with</span>
            <Heart className="w-3 h-3 text-emerald-500 fill-current" />
          </p>

          <p className="text-[11px] text-gray-600 font-normal">
            {settings.footerLine || 'Real moments. Infinite memories.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
