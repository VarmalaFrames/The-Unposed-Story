import React, { useState } from 'react';
import { SiteSettings } from '../types';
import { LOGO_EMBLEM, DEFAULT_VISION_IMAGES } from '../data/initialData';
import { OptimizedImage } from './common/OptimizedImage';
import { Camera, Aperture, Maximize2, CheckCircle2, Sparkles, Send, MapPin, Globe, Film, Clock, Palette } from 'lucide-react';
import { motion } from 'motion/react';

interface AboutSectionProps {
  settings: SiteSettings;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 4000);
  };

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Curated floating images for the Turning Visions Into Art section (customizable via Admin Settings)
  const visionImages = {
    groom: settings.visionImageGroom || DEFAULT_VISION_IMAGES.groom,
    couple: settings.visionImageCouple || DEFAULT_VISION_IMAGES.couple,
    brideTop: settings.visionImageBrideTop || DEFAULT_VISION_IMAGES.brideTop,
    brideBottom: settings.visionImageBrideBottom || DEFAULT_VISION_IMAGES.brideBottom,
  };

  const gearItems = [
    {
      icon: Camera,
      title: settings.gear1Title || 'Canon R6 II',
      description: settings.gear1Desc || 'Fast, precise, and built for any moment.',
    },
    {
      icon: Aperture,
      title: settings.gear2Title || '35mm f/1.4',
      description: settings.gear2Desc || 'Stunning portraits with rich depth and smooth blur.',
    },
    {
      icon: Maximize2,
      title: settings.gear3Title || '85mm f/1.4',
      description: settings.gear3Desc || 'Rock-steady for long shots and creative frames.',
    },
  ];

  const valuePills = [
    { label: 'Creative Direction', icon: Palette },
    { label: 'Cinematic Edits', icon: Film },
    { label: 'On Time Delivery', icon: Clock },
  ];

  return (
    <section id="about" className="relative bg-[#FAFAFA] text-neutral-900 overflow-hidden border-t border-neutral-200/80">
      {/* Background Subtle Watermark Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* ========================================================
          PART 1: TURNING VISIONS INTO ART (SUBSCRIBE / VISION BANNER)
          Matching Image 1: Flanked by 4 floating rounded cards,
          centered Subscribe badge, headline, newsletter bar, and 3 feature pills
         ======================================================== */}
      <div className="relative pt-24 pb-20 md:pt-32 md:pb-28 border-b border-neutral-200/70 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative">
          {/* Floating Image 1 (Top Left: Groom in Sherwani) */}
          <motion.div
            initial={{ opacity: 0, x: -30, y: -10 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            animate={{
              y: [-8, 8, -8],
              rotate: [-1, 1, -1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="hidden lg:block absolute left-4 xl:left-8 top-0 w-36 xl:w-44 aspect-[4/5] rounded-[28px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.1)] border-4 border-white z-10"
          >
            <OptimizedImage
              src={visionImages.groom}
              alt="Groom wedding portrait"
              targetWidth={400}
              quality={80}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
          </motion.div>

          {/* Floating Image 2 (Bottom Left: Couple) */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            animate={{
              y: [8, -8, 8],
              rotate: [1.5, -1, 1.5],
            }}
            transition={{
              duration: 6.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="hidden lg:block absolute left-12 xl:left-16 bottom-2 w-32 xl:w-36 aspect-square rounded-[24px] overflow-hidden shadow-[0_14px_32px_rgba(0,0,0,0.08)] border-4 border-white z-10"
          >
            <OptimizedImage
              src={visionImages.couple}
              alt="Couple candid moment"
              targetWidth={400}
              quality={80}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
          </motion.div>

          {/* Floating Image 3 (Top Right: Bride in Red Lehenga) */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: -10 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            animate={{
              y: [10, -8, 10],
              rotate: [1, -1.5, 1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
            className="hidden lg:block absolute right-4 xl:right-8 top-2 w-36 xl:w-40 aspect-square rounded-[28px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.1)] border-4 border-white z-10"
          >
            <OptimizedImage
              src={visionImages.brideTop}
              alt="Indian bridal portrait"
              targetWidth={400}
              quality={80}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
          </motion.div>

          {/* Floating Image 4 (Bottom Right: Smiling Bride) */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            animate={{
              y: [-10, 8, -10],
              rotate: [-1.5, 1.2, -1.5],
            }}
            transition={{
              duration: 6.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.8,
            }}
            className="hidden lg:block absolute right-10 xl:right-16 bottom-0 w-36 xl:w-44 aspect-[4/5] rounded-[28px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.1)] border-4 border-white z-10"
          >
            <OptimizedImage
              src={visionImages.brideBottom}
              alt="Traditional bride smile"
              targetWidth={400}
              quality={80}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
          </motion.div>

          {/* Center Column Content */}
          <div className="max-w-xl md:max-w-2xl mx-auto text-center flex flex-col items-center relative z-20">
            {/* Pill Badge: Subscribe */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="px-4 py-1.5 rounded-full bg-white/90 border border-neutral-200/80 text-[12px] font-medium text-neutral-700 shadow-2xs mb-6"
            >
              {settings.visionBadge || 'Subscribe'}
            </motion.div>

            {/* Main Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-neutral-900 leading-tight mb-5"
            >
              {settings.visionHeadline || 'Turning Visions Into Art'}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-neutral-600 text-sm sm:text-base md:text-lg font-normal leading-relaxed max-w-lg mb-8"
            >
              {settings.visionSubtext || 'Every wedding is a story waiting to be told. Book us to see real moments, behind the scenes, and exclusive shoot previews.'}
            </motion.p>

            {/* Email Subscription Bar */}
            <motion.form
              onSubmit={handleSubscribe}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-md mb-8"
            >
              {subscribed ? (
                <div className="flex items-center justify-center gap-2 p-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Thank you! You're subscribed to our private gallery previews.</span>
                </div>
              ) : (
                <div className="flex items-center p-1.5 pl-5 bg-white rounded-full border border-neutral-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-200 transition-all">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="JaneSmith@mail.com"
                    required
                    id="vision-subscribe-email"
                    className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    id="vision-subscribe-submit"
                    className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold tracking-normal shadow-xs transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              )}
            </motion.form>

            {/* 3 Pill Badges: Creative Direction · Cinematic Edits · On Time Delivery */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
            >
              {valuePills.map((pill) => (
                <span
                  key={pill.label}
                  className="px-4 py-1.5 rounded-full bg-white border border-neutral-200/80 text-[12px] sm:text-[13px] font-medium text-neutral-700 shadow-2xs hover:border-neutral-300 transition-colors"
                >
                  {pill.label}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ========================================================
          PART 2: FOUNDER & GEARS SHOWCASE
          Matching Image 2: Centered Avatar, "Available For Hire",
          "Hey Im Sandip Lade !", "Get in Touch" / "View Portfolio" buttons,
          "Gear and tools I use", and the 3 Gear Cards (Canon R6 II, 35mm, 85mm)
         ======================================================== */}
      <div className="relative py-24 md:py-32 overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 flex flex-col items-center text-center relative z-10">
          
          {/* Avatar Profile Picture */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-white border border-neutral-200 shadow-md mb-5"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900">
              <img
                src={settings.logoUrl || LOGO_EMBLEM}
                alt={settings.founderName}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Pill: Available For Hire */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-700 shadow-2xs mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse" />
            <span>{settings.founderBadge || 'Available For Hire'}</span>
          </motion.div>

          {/* Heading: Hey Im Sandip Lade ! */}
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-neutral-900 mb-3"
          >
            {settings.founderGreeting || `Hey Im ${settings.founderName || 'Sandip Lade'} !`}
          </motion.h2>

          {/* Subtitle / Bio Description */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-neutral-600 text-sm sm:text-base md:text-lg font-normal max-w-2xl mx-auto space-y-3 mb-9 leading-relaxed whitespace-pre-line"
          >
            {settings.aboutText ? (
              settings.aboutText.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className={pIdx > 0 ? 'text-neutral-500 text-sm sm:text-base' : ''}>
                  {paragraph}
                </p>
              ))
            ) : (
              <>
                <p>
                  The Unposed Story is a Mumbai-based wedding photography and cinematic filmmaking studio founded by Sandip Lade.
                </p>
                <p className="text-neutral-500 text-sm sm:text-base">
                  We capture weddings as they truly happen — candid, emotional, cinematic, and unposed. From quiet family moments to unforgettable celebrations, every frame is created to preserve the feeling of your day.
                </p>
              </>
            )}
          </motion.div>

          {/* Two Action Buttons: Get in Touch & View Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-3 sm:gap-4 mb-16"
          >
            <a
              href="#contact"
              onClick={(e) => handleScrollTo(e, 'contact')}
              id="founder-get-in-touch-btn"
              className="px-7 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold tracking-normal shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Get in Touch
            </a>
            <a
              href="#gallery"
              onClick={(e) => handleScrollTo(e, 'gallery')}
              id="founder-view-portfolio-btn"
              className="px-7 py-3 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 text-xs font-semibold tracking-normal shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              View Portfolio
            </a>
          </motion.div>

          {/* Pill Badge: Gear and tools I use */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="px-4 py-1.5 rounded-full bg-white border border-neutral-200/80 text-[12px] font-medium text-neutral-700 shadow-2xs mb-10"
          >
            {settings.gearBadge || 'Gear and tools I use'}
          </motion.div>

          {/* 3 Gear Spec Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full max-w-4xl text-left">
            {gearItems.map((gear, idx) => {
              const Icon = gear.icon;
              return (
                <motion.div
                  key={gear.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 * idx + 0.5, ease: [0.22, 1, 0.36, 1] }}
                  id={`gear-card-${idx}`}
                  className="p-7 sm:p-8 rounded-[28px] bg-white border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:border-neutral-300 transition-all duration-300 flex flex-col"
                >
                  <div className="w-8 h-8 flex items-center justify-center text-neutral-700 mb-6">
                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    {gear.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-neutral-500 font-normal leading-relaxed">
                    {gear.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Studio Footnote & Origin */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center gap-4 text-xs text-neutral-400 mt-14 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              Mumbai, India
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              Available for Pan-India &amp; Global Destination Shoots
            </span>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
