import React, { useState, useEffect, useRef } from 'react';
import { SiteSettings } from '../types';
import { LOGO_EMBLEM } from '../data/initialData';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  settings: SiteSettings;
  hasFilms: boolean;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ settings, hasFilms }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCompact, setDesktopCompact] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 120;
      setIsScrolled(scrolled);
      // Automatically switch to compact mode on heavy scroll, but hover expands it
      if (scrolled && window.scrollY > 400) {
        setDesktopCompact(true);
      } else {
        setDesktopCompact(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on click outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '#top' },
    { label: 'About', href: '#about' },
    { label: 'Portfolio', href: '#gallery' },
    ...(hasFilms ? [{ label: 'Films', href: '#films' }] : []),
    { label: 'Stories', href: '#weddings' },
    { label: 'Packages', href: '#packages' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      const offset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const logoSrc = settings.logoUrl || LOGO_EMBLEM;
  const isDesktopOpen = !desktopCompact || isHovered;

  return (
    <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* ========================================================
          DESKTOP FLOATING PILL NAVBAR
          Exact design from reference image:
          - Desktop / Open · Primary (Avatar + Links + Dark Contact Button)
          - Desktop / Closed (Avatar + "Available for work" + Green dot)
         ======================================================== */}
      <div
        className="hidden md:block pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className={`flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-xl border border-neutral-200/80 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-shadow duration-300 ${
            isScrolled ? 'ring-1 ring-black/5' : ''
          }`}
        >
          {/* Avatar / Logo with smooth click to top */}
          <a
            href="#top"
            onClick={(e) => handleNavClick(e, '#top')}
            className="flex-shrink-0 relative group p-0.5"
            title={settings.siteName || 'Home'}
            id="desktop-avatar-link"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200/90 bg-neutral-900 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105">
              <img
                src={logoSrc}
                alt={settings.siteName || 'Photographer'}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </a>

          {/* Animate between Full Open Menu and Closed "Available for work" State */}
          <AnimatePresence mode="wait" initial={false}>
            {isDesktopOpen ? (
              <motion.div
                key="desktop-open"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-6 pl-2 pr-1"
              >
                {/* Nav Links */}
                <nav className="flex items-center gap-5 lg:gap-7">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-[13px] lg:text-[14px] font-medium text-neutral-600 hover:text-black tracking-normal transition-colors duration-150 relative py-1"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>

                {/* Dark Charcoal Pill Contact Button */}
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  id="desktop-contact-btn"
                  className="px-6 py-2.5 rounded-full bg-[#242428] hover:bg-black text-white text-[13px] font-medium tracking-normal shadow-xs transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  Contact
                </a>
              </motion.div>
            ) : (
              <motion.button
                key="desktop-closed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDesktopCompact(false)}
                className="flex items-center gap-2.5 px-3 py-1 cursor-pointer text-left focus:outline-none"
              >
                <span className="text-[13px] font-medium text-neutral-700 select-none">
                  Available for work
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ========================================================
          TABLET & PHONE FLOATING NAVBAR & MODAL
          Exact design from reference image:
          - Tablet & Phone / Closed (Avatar + "Available for work" + Green dot + Blue Menu Button)
          - Tablet & Phone / Open (Rounded Card with Avatar, Blue Close Button, Centered Links, Blue Contact Button)
         ======================================================== */}
      <div className="md:hidden w-full max-w-sm pointer-events-auto" ref={menuRef}>
        <AnimatePresence mode="wait">
          {!mobileMenuOpen ? (
            /* Tablet & Phone / Closed State */
            <motion.div
              key="mobile-closed"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between p-1.5 pl-2 bg-white/95 backdrop-blur-xl border border-neutral-200/90 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
            >
              {/* Left: Avatar + "Available for work" + Green dot */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200/80 bg-neutral-900 flex-shrink-0">
                  <img
                    src={logoSrc}
                    alt={settings.siteName || 'Photographer'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-neutral-700">
                    Available for work
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse" />
                </div>
              </div>

              {/* Right: Indigo/Blue Menu Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                id="mobile-open-menu-btn"
                aria-label="Open navigation menu"
                className="w-9 h-9 rounded-full bg-[#5B60EA] hover:bg-[#4E53E2] active:scale-95 text-white flex items-center justify-center shadow-sm transition-transform cursor-pointer focus:outline-none"
              >
                <Menu className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </motion.div>
          ) : (
            /* Tablet & Phone / Open State */
            <motion.div
              key="mobile-open"
              initial={{ opacity: 0, y: -15, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white/98 backdrop-blur-2xl border border-neutral-200/90 rounded-[32px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col text-center"
            >
              {/* Top Row: Avatar on Left + Blue Close Button on Right */}
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-200/80 bg-neutral-900">
                  <img
                    src={logoSrc}
                    alt={settings.siteName || 'Photographer'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  id="mobile-close-menu-btn"
                  aria-label="Close navigation menu"
                  className="w-9 h-9 rounded-full bg-[#5B60EA] hover:bg-[#4E53E2] active:scale-95 text-white flex items-center justify-center shadow-sm transition-transform cursor-pointer focus:outline-none"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              {/* Centered Vertical Links */}
              <nav className="flex flex-col items-center gap-6 mb-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-[15px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors py-0.5 active:scale-98"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Bottom: Solid Indigo/Blue Pill Contact Button */}
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                id="mobile-contact-pill-btn"
                className="w-full py-3.5 rounded-full bg-[#5B60EA] hover:bg-[#4E53E2] active:scale-[0.98] text-white text-[14px] font-medium tracking-normal shadow-sm transition-all text-center block"
              >
                Contact
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop overlay for mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-xs z-[-1] pointer-events-auto md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </header>
  );
};
