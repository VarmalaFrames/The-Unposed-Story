import React, { useState, useEffect } from 'react';
import {
  PhotoItem,
  PackageItem,
  TestimonialItem,
  FaqItem,
  FilmItem,
  InquiryItem,
  SiteSettings,
} from './types';
import { StorageService } from './services/storage';
import { FirebaseService } from './services/firebase';
import { IdbStorage } from './services/indexedDb';

// Public Components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StatsStrip } from './components/StatsStrip';
import { FeaturedGrid } from './components/FeaturedGrid';
import { GallerySection } from './components/GallerySection';
import { RealWeddings } from './components/RealWeddings';
import { FilmsSection } from './components/FilmsSection';
import { FloatingShowcase } from './components/FloatingShowcase';
import { PackagesSection } from './components/PackagesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { AboutSection } from './components/AboutSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { Lightbox } from './components/Lightbox';
import { VideoModal } from './components/VideoModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { PageLoader } from './components/PageLoader';
import { ScrollReveal } from './components/ScrollReveal';

// Admin Components
import { PinGate } from './components/admin/PinGate';
import { AdminDashboard } from './components/admin/AdminDashboard';

export function App() {
  // App State initialized from localStorage with robust defaults
  const [settings, setSettings] = useState<SiteSettings>(() => StorageService.getSettings());
  const [photos, setPhotos] = useState<PhotoItem[]>(() => StorageService.getPhotos());
  const [packages, setPackages] = useState<PackageItem[]>(() => StorageService.getPackages());
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(() => StorageService.getTestimonials());
  const [faqs, setFaqs] = useState<FaqItem[]>(() => StorageService.getFaqs());
  const [films, setFilms] = useState<FilmItem[]>(() => StorageService.getFilms());
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => StorageService.getInquiries());

  // View state: 'site' or 'admin'
  const [view, setView] = useState<'site' | 'admin'>('site');
  const [adminAuthed, setAdminAuthed] = useState<boolean>(false);

  // Modals state
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [playingFilm, setPlayingFilm] = useState<FilmItem | null>(null);
  const [selectedPackageForContact, setSelectedPackageForContact] = useState<string | undefined>(undefined);

  // Hydrate full data from Firebase Firestore & IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    StorageService.loadAllDataAsync().then((data) => {
      if (!isMounted) return;
      if (data.photos && data.photos.length > 0) {
        setPhotos(data.photos);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.films && data.films.length > 0) {
        setFilms(data.films);
      }
      if (data.packages && data.packages.length > 0) {
        setPackages(data.packages);
      }
      if (data.testimonials && data.testimonials.length > 0) {
        setTestimonials(data.testimonials);
      }
      if (data.faqs && data.faqs.length > 0) {
        setFaqs(data.faqs);
      }
      if (data.inquiries && data.inquiries.length > 0) {
        setInquiries(data.inquiries);
      }
    });

    // Real-time Firestore synchronization for photos
    const unsubPhotos = FirebaseService.subscribePhotos(async (livePhotos) => {
      if (!isMounted) return;
      if (livePhotos && livePhotos.length > 0) {
        const idbPhotos = await IdbStorage.getAllPhotos();
        const merged = StorageService.mergePhotos(livePhotos, idbPhotos);
        setPhotos(merged);
      }
    });

    return () => {
      isMounted = false;
      unsubPhotos();
    };
  }, []);

  // Handlers that update both local React state and cloud persistence
  const handlePhotosUpdated = (newPhotos: PhotoItem[]) => {
    setPhotos(newPhotos);
    StorageService.savePhotos(newPhotos);
  };

  const handleSettingsUpdated = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handlePackagesUpdated = (newPackages: PackageItem[]) => {
    setPackages(newPackages);
    StorageService.savePackages(newPackages);
  };

  const handleTestimonialsUpdated = (newTestimonials: TestimonialItem[]) => {
    setTestimonials(newTestimonials);
    StorageService.saveTestimonials(newTestimonials);
  };

  const handleFaqsUpdated = (newFaqs: FaqItem[]) => {
    setFaqs(newFaqs);
    StorageService.saveFaqs(newFaqs);
  };

  const handleFilmsUpdated = (newFilms: FilmItem[]) => {
    setFilms(newFilms);
    StorageService.saveFilms(newFilms);
  };

  const handleInquiriesUpdated = (newInquiries: InquiryItem[]) => {
    setInquiries(newInquiries);
    StorageService.saveInquiries(newInquiries);
  };

  // Check URL search path / backend parameter / hash / keyboard shortcut to access hidden admin
  useEffect(() => {
    const checkAdminTrigger = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const isSearchAdmin =
        searchParams.get('admin') === 'true' ||
        searchParams.get('admin') === 'portal' ||
        searchParams.get('admin') === '1' ||
        searchParams.get('backend') === 'true' ||
        searchParams.get('backend') === '1' ||
        searchParams.get('backend') === 'admin' ||
        searchParams.get('portal') === 'admin' ||
        searchParams.get('secret') === 'admin' ||
        searchParams.get('path') === 'backend' ||
        searchParams.get('section') === 'backend' ||
        searchParams.get('search') === 'backend';

      const isHashAdmin =
        window.location.hash === '#admin' ||
        window.location.hash === '#backend' ||
        window.location.hash === '#portal';

      const isPathAdmin =
        window.location.pathname.endsWith('/admin') ||
        window.location.pathname.endsWith('/backend') ||
        window.location.pathname.endsWith('/portal');

      if (isSearchAdmin || isHashAdmin || isPathAdmin) {
        setView('admin');
      }
    };

    checkAdminTrigger();
    window.addEventListener('popstate', checkAdminTrigger);
    window.addEventListener('hashchange', checkAdminTrigger);

    // Global keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A to trigger admin
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setView('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', checkAdminTrigger);
      window.removeEventListener('hashchange', checkAdminTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Clean exit from admin back to public site
  const handleExitAdmin = () => {
    setView('site');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.searchParams.delete('portal');
      url.searchParams.delete('backend');
      url.searchParams.delete('secret');
      url.searchParams.delete('path');
      url.searchParams.delete('section');
      url.searchParams.delete('search');
      url.hash = '';
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {
      window.location.hash = '';
    }
  };

  const handleLogoutAdmin = () => {
    setAdminAuthed(false);
    handleExitAdmin();
  };

  // Apply theme to document CSS variables
  useEffect(() => {
    if (settings.theme) {
      const root = document.documentElement.style;
      root.setProperty('--c-bg', settings.theme.bg);
      root.setProperty('--c-surface', settings.theme.surface);
      root.setProperty('--c-ink', settings.theme.ink);
      root.setProperty('--c-muted', settings.theme.muted);
      root.setProperty('--c-line', settings.theme.line);
      root.setProperty('--c-accent', settings.theme.accent);
      root.setProperty('--c-accent-soft', settings.theme.accentSoft);
    }
  }, [settings.theme]);

  // Featured photos
  const featuredPhotos = photos.filter((p) => p.featured);
  const heroPhoto = photos.find((p) => p.id === settings.heroPhotoId) || photos[0];

  // Number of unique wedding stories documented
  const weddingsCount = React.useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.coupleName) set.add(p.coupleName);
    });
    return set.size;
  }, [photos]);

  // Lightbox handlers
  const handleOpenLightbox = (photo: PhotoItem) => {
    setLightboxPhoto(photo);
  };

  const handleNextPhoto = () => {
    if (!lightboxPhoto) return;
    const idx = photos.findIndex((p) => p.id === lightboxPhoto.id);
    const nextIdx = (idx + 1) % photos.length;
    setLightboxPhoto(photos[nextIdx]);
  };

  const handlePrevPhoto = () => {
    if (!lightboxPhoto) return;
    const idx = photos.findIndex((p) => p.id === lightboxPhoto.id);
    const prevIdx = (idx - 1 + photos.length) % photos.length;
    setLightboxPhoto(photos[prevIdx]);
  };

  // Scroll to gallery
  const handleExploreClick = () => {
    const el = document.getElementById('gallery');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Select package from Pricing section -> scroll to contact & prepopulate
  const handleSelectPackage = (pkg: PackageItem) => {
    setSelectedPackageForContact(pkg.name);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter by couple when clicking Real Weddings story
  const handleSelectCouple = (coupleName: string) => {
    const galleryEl = document.getElementById('gallery');
    if (galleryEl) {
      galleryEl.scrollIntoView({ behavior: 'smooth' });
    }
    const matching = photos.find((p) => p.coupleName === coupleName);
    if (matching) {
      setLightboxPhoto(matching);
    }
  };

  // Refresh inquiries count
  const handleInquirySubmitted = () => {
    setInquiries(StorageService.getInquiries());
  };

  // View: Studio Admin Portal
  if (view === 'admin') {
    if (!adminAuthed) {
      return (
        <PinGate
          onSuccess={() => setAdminAuthed(true)}
          onBackToSite={handleExitAdmin}
        />
      );
    }

    return (
      <AdminDashboard
        settings={settings}
        photos={photos}
        packages={packages}
        testimonials={testimonials}
        faqs={faqs}
        films={films}
        inquiries={inquiries}
        onPhotosUpdated={handlePhotosUpdated}
        onPackagesUpdated={handlePackagesUpdated}
        onTestimonialsUpdated={handleTestimonialsUpdated}
        onFaqsUpdated={handleFaqsUpdated}
        onFilmsUpdated={handleFilmsUpdated}
        onInquiriesUpdated={handleInquiriesUpdated}
        onSettingsUpdated={handleSettingsUpdated}
        onBackToSite={handleExitAdmin}
        onLogout={handleLogoutAdmin}
      />
    );
  }

  // View: Public Luxury Editorial Website
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Editorial Webpage Initial Loader */}
      <PageLoader settings={settings} />

      {/* Navigation */}
      <Navbar
        settings={settings}
        hasFilms={films.length > 0}
        onOpenAdmin={() => setView('admin')}
      />

      {/* Hero */}
      <Hero
        settings={settings}
        heroPhoto={heroPhoto}
        onExploreClick={handleExploreClick}
      />

      {/* Statistics Strip */}
      <ScrollReveal>
        <StatsStrip
          settings={settings}
          weddingsCount={weddingsCount}
        />
      </ScrollReveal>

      {/* Featured Highlights Grid */}
      <ScrollReveal>
        <FeaturedGrid
          photos={featuredPhotos.length > 0 ? featuredPhotos : photos}
          settings={settings}
          onPhotoClick={handleOpenLightbox}
        />
      </ScrollReveal>

      {/* Full Gallery with Moments Filtering & Masonry */}
      <ScrollReveal>
        <GallerySection
          photos={photos}
          settings={settings}
          onPhotoClick={handleOpenLightbox}
        />
      </ScrollReveal>

      {/* Real Weddings Stories */}
      <ScrollReveal>
        <RealWeddings
          photos={photos}
          settings={settings}
          onSelectCouple={handleSelectCouple}
        />
      </ScrollReveal>

      {/* Wedding Films */}
      <ScrollReveal>
        <FilmsSection
          films={films}
          settings={settings}
          onPlayFilm={setPlayingFilm}
        />
      </ScrollReveal>

      {/* Signature Floating Showcase */}
      <ScrollReveal>
        <FloatingShowcase
          photos={photos}
          settings={settings}
          onPhotoClick={handleOpenLightbox}
        />
      </ScrollReveal>

      {/* Investment & Pricing Packages */}
      <ScrollReveal>
        <PackagesSection
          packages={packages}
          settings={settings}
          onSelectPackage={handleSelectPackage}
        />
      </ScrollReveal>

      {/* Client Testimonials / Kind Words */}
      <ScrollReveal>
        <TestimonialsSection
          testimonials={testimonials}
          settings={settings}
        />
      </ScrollReveal>

      {/* Founder & Artistic Philosophy */}
      <ScrollReveal>
        <AboutSection
          settings={settings}
        />
      </ScrollReveal>

      {/* FAQ Accordion */}
      <ScrollReveal>
        <FaqSection
          faqs={faqs}
          settings={settings}
        />
      </ScrollReveal>

      {/* Contact & Booking Inquiry */}
      <ScrollReveal>
        <ContactSection
          settings={settings}
          packages={packages}
          selectedPackageName={selectedPackageForContact}
          onInquirySubmitted={handleInquirySubmitted}
        />
      </ScrollReveal>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => setView('admin')}
      />

      {/* Floating WhatsApp Button */}
      <WhatsAppButton
        phone={settings.contactPhone}
        siteName={settings.siteName}
      />

      {/* Fullscreen Photo Lightbox */}
      <Lightbox
        photo={lightboxPhoto}
        allPhotos={photos}
        settings={settings}
        onClose={() => setLightboxPhoto(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
      />

      {/* Wedding Film Player Modal */}
      <VideoModal
        film={playingFilm}
        onClose={() => setPlayingFilm(null)}
      />
    </div>
  );
}

export default App;
