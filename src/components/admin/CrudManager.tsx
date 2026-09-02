import React, { useState, useRef } from 'react';
import { FilmItem, PackageItem, TestimonialItem, FaqItem, PhotoItem, SiteSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { parseVideoUrl, detectVideoProvider, extractInstagramShortcode } from '../../utils/videoHelper';
import { convertDriveToDirectImageUrl, isDriveUrl } from '../../utils/driveHelper';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Film,
  Instagram,
  Play,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Video,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Camera,
  Check,
  Link,
  Search,
  FolderOpen,
  Sliders,
  ArrowRight,
  Info,
  Layers,
} from 'lucide-react';

type EntityType = 'films' | 'packages' | 'testimonials' | 'faqs';

interface CrudManagerProps {
  entityType: EntityType;
  films: FilmItem[];
  packages: PackageItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  photos?: PhotoItem[];
  settings?: SiteSettings;
  onFilmsUpdated: (items: FilmItem[]) => void;
  onPackagesUpdated: (items: PackageItem[]) => void;
  onTestimonialsUpdated: (items: TestimonialItem[]) => void;
  onFaqsUpdated: (items: FaqItem[]) => void;
}

export const CrudManager: React.FC<CrudManagerProps> = ({
  entityType,
  films,
  packages,
  testimonials,
  faqs,
  photos = [],
  settings,
  onFilmsUpdated,
  onPackagesUpdated,
  onTestimonialsUpdated,
  onFaqsUpdated,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Video Source selector tab inside the film form
  const [videoSourceType, setVideoSourceType] = useState<'instagram' | 'youtube' | 'custom'>('instagram');
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  // Thumbnail Tab inside Film Form: 'upload' | 'studio' | 'url' | 'auto'
  const [thumbnailTab, setThumbnailTab] = useState<'upload' | 'studio' | 'url' | 'auto'>('upload');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbStats, setThumbStats] = useState<{
    originalSize: string;
    compressedSize: string;
    savedPercent: number;
  } | null>(null);

  // Studio photo library filter state for film thumbnail picker
  const [studioPhotoSearch, setStudioPhotoSearch] = useState('');
  const [studioPhotoFilter, setStudioPhotoFilter] = useState('All');

  // Quick Thumbnail Editor Modal for existing Film row
  const [quickThumbFilm, setQuickThumbFilm] = useState<FilmItem | null>(null);
  const [quickThumbNewImage, setQuickThumbNewImage] = useState<string>('');
  const [quickThumbTab, setQuickThumbTab] = useState<'upload' | 'studio' | 'url' | 'auto'>('upload');
  const [quickThumbSaving, setQuickThumbSaving] = useState(false);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  // Generic form state
  const [filmForm, setFilmForm] = useState<{
    title: string;
    videoUrl: string;
    date: string;
    coverImage: string;
    provider?: 'instagram' | 'youtube' | 'vimeo' | 'direct' | 'unknown';
    shortcode?: string;
    isVertical?: boolean;
  }>({
    title: '',
    videoUrl: '',
    date: new Date().toISOString().split('T')[0],
    coverImage: '',
    provider: 'instagram',
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    description: '',
    highlight: false,
  });

  const [testimonialForm, setTestimonialForm] = useState({
    coupleName: '',
    quote: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
  });

  const resetForms = () => {
    setEditingId(null);
    setFormOpen(false);
    setFetchStatus(null);
    setThumbStats(null);
    setVideoSourceType('instagram');
    setThumbnailTab('upload');
    setFilmForm({
      title: '',
      videoUrl: '',
      date: new Date().toISOString().split('T')[0],
      coverImage: '',
      provider: 'instagram',
    });
    setPackageForm({
      name: '',
      price: '',
      description: '',
      highlight: false,
    });
    setTestimonialForm({
      coupleName: '',
      quote: '',
      date: new Date().toISOString().split('T')[0],
    });
    setFaqForm({
      question: '',
      answer: '',
    });
  };

  // Handle Video URL change with automatic detection & metadata extraction
  const handleVideoUrlChange = (url: string) => {
    const info = parseVideoUrl(url);
    if (info.provider === 'instagram') {
      setVideoSourceType('instagram');
    } else if (info.provider === 'youtube' || info.provider === 'vimeo') {
      setVideoSourceType('youtube');
    }

    setFilmForm((prev) => ({
      ...prev,
      videoUrl: url,
      provider: info.provider,
      shortcode: info.shortcode,
      isVertical: info.isVertical,
      // If user hasn't provided a coverImage, set smart default
      coverImage: prev.coverImage || (info.thumbnailUrl ? info.thumbnailUrl : prev.coverImage),
    }));

    if (info.provider === 'instagram' && info.shortcode) {
      setFetchStatus(`Instagram Reel shortcode (${info.shortcode}) detected successfully!`);
    } else if (info.provider === 'youtube' && info.shortcode) {
      setFetchStatus(`YouTube Video ID (${info.shortcode}) detected.`);
    } else {
      setFetchStatus(null);
    }
  };

  // Dedicated "Fetch Video from Link" action
  const handleFetchVideoFromLink = () => {
    if (!filmForm.videoUrl) {
      setFetchStatus('Please paste an Instagram Reel or YouTube link first.');
      return;
    }
    const info = parseVideoUrl(filmForm.videoUrl);
    setFilmForm((prev) => ({
      ...prev,
      provider: info.provider,
      shortcode: info.shortcode,
      isVertical: info.isVertical,
      coverImage: prev.coverImage || info.thumbnailUrl,
      title: prev.title || (info.provider === 'instagram' ? `Wedding Highlight Reel (${info.shortcode})` : prev.title),
    }));

    if (info.provider === 'instagram') {
      setFetchStatus(`Fetched Instagram Reel successfully! Embed preview ready.`);
    } else if (info.provider === 'youtube') {
      setFetchStatus(`Fetched YouTube Video (${info.shortcode}) with high-res thumbnail.`);
    } else {
      setFetchStatus(`Parsed video link as ${info.provider}.`);
    }
  };

  // Handle direct file upload for thumbnail in the main form
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingThumb(true);
    try {
      const stats = await StorageService.compressImageWithStats(file, 1600, 0.84);
      setFilmForm((prev) => ({ ...prev, coverImage: stats.dataUrl }));
      setThumbStats({
        originalSize: stats.originalSizeFormatted,
        compressedSize: stats.compressedSizeFormatted,
        savedPercent: stats.savedPercent,
      });
      setFetchStatus(`Thumbnail uploaded & optimized (${stats.compressedSizeFormatted})`);
    } catch (err: any) {
      setFetchStatus('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingThumb(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle quick thumbnail file upload for individual film
  const handleQuickThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !quickThumbFilm) return;
    const file = e.target.files[0];
    setUploadingThumb(true);
    try {
      const stats = await StorageService.compressImageWithStats(file, 1600, 0.84);
      setQuickThumbNewImage(stats.dataUrl);
    } catch (err: any) {
      alert('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingThumb(false);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    }
  };

  // Save Quick Thumbnail change
  const handleSaveQuickThumbnail = () => {
    if (!quickThumbFilm || !quickThumbNewImage) return;
    setQuickThumbSaving(true);
    const updated = films.map((f) =>
      f.id === quickThumbFilm.id ? { ...f, coverImage: quickThumbNewImage } : f
    );
    StorageService.saveFilms(updated);
    onFilmsUpdated(updated);
    setActionNotice(`Thumbnail updated for "${quickThumbFilm.title}"`);
    setTimeout(() => setActionNotice(null), 3500);
    setQuickThumbSaving(false);
    setQuickThumbFilm(null);
    setQuickThumbNewImage('');
  };

  // Handle Editing
  const startEdit = (id: string) => {
    setEditingId(id);
    setFetchStatus(null);
    setThumbStats(null);
    if (entityType === 'films') {
      const f = films.find((x) => x.id === id);
      if (f) {
        const info = parseVideoUrl(f.videoUrl);
        setVideoSourceType(info.provider === 'instagram' ? 'instagram' : 'youtube');
        setFilmForm({
          title: f.title,
          videoUrl: f.videoUrl,
          date: f.date || '',
          coverImage: f.coverImage || '',
          provider: f.provider || info.provider,
          shortcode: f.shortcode || info.shortcode,
          isVertical: f.isVertical ?? info.isVertical,
        });
      }
    } else if (entityType === 'packages') {
      const p = packages.find((x) => x.id === id);
      if (p) {
        setPackageForm({
          name: p.name,
          price: p.price,
          description: p.description,
          highlight: !!p.highlight,
        });
      }
    } else if (entityType === 'testimonials') {
      const t = testimonials.find((x) => x.id === id);
      if (t) {
        setTestimonialForm({
          coupleName: t.coupleName,
          quote: t.quote,
          date: t.date || '',
        });
      }
    } else if (entityType === 'faqs') {
      const q = faqs.find((x) => x.id === id);
      if (q) {
        setFaqForm({
          question: q.question,
          answer: q.answer,
        });
      }
    }
    setFormOpen(true);
  };

  // Open Quick Thumbnail Editor for a film
  const openQuickThumbEditor = (film: FilmItem) => {
    setQuickThumbFilm(film);
    setQuickThumbNewImage(film.coverImage || '');
    setQuickThumbTab('upload');
  };

  // Handle Deleting
  const handleDelete = (id: string) => {
    if (entityType === 'films') {
      const updated = films.filter((x) => x.id !== id);
      StorageService.saveFilms(updated);
      onFilmsUpdated(updated);
      setActionNotice('Film removed successfully.');
    } else if (entityType === 'packages') {
      const updated = packages.filter((x) => x.id !== id);
      StorageService.savePackages(updated);
      onPackagesUpdated(updated);
      setActionNotice('Package deleted successfully.');
    } else if (entityType === 'testimonials') {
      const updated = testimonials.filter((x) => x.id !== id);
      StorageService.saveTestimonials(updated);
      onTestimonialsUpdated(updated);
      setActionNotice('Testimonial removed successfully.');
    } else if (entityType === 'faqs') {
      const updated = faqs.filter((x) => x.id !== id);
      StorageService.saveFaqs(updated);
      onFaqsUpdated(updated);
      setActionNotice('FAQ item deleted successfully.');
    }
    setConfirmDeleteId(null);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (entityType === 'films') {
      const info = parseVideoUrl(filmForm.videoUrl);
      const filmData: FilmItem = {
        id: editingId || 'film_' + Date.now().toString(36),
        title: filmForm.title,
        videoUrl: filmForm.videoUrl,
        provider: filmForm.provider || info.provider,
        shortcode: filmForm.shortcode || info.shortcode,
        isVertical: filmForm.isVertical ?? info.isVertical,
        date: filmForm.date,
        coverImage: filmForm.coverImage || info.thumbnailUrl,
        createdAt: editingId ? films.find((f) => f.id === editingId)?.createdAt || Date.now() : Date.now(),
      };

      let updated: FilmItem[];
      if (editingId) {
        updated = films.map((f) => (f.id === editingId ? filmData : f));
        setActionNotice('Film updated successfully.');
      } else {
        updated = [filmData, ...films];
        setActionNotice('New film added to portfolio.');
      }
      StorageService.saveFilms(updated);
      onFilmsUpdated(updated);
    } else if (entityType === 'packages') {
      let updated: PackageItem[];
      if (editingId) {
        updated = packages.map((p) => (p.id === editingId ? { ...p, ...packageForm } : p));
        setActionNotice('Package details updated.');
      } else {
        const item: PackageItem = {
          id: 'pkg_' + Date.now().toString(36),
          ...packageForm,
          createdAt: Date.now(),
        };
        updated = [...packages, item];
        setActionNotice('New package created successfully.');
      }
      StorageService.savePackages(updated);
      onPackagesUpdated(updated);
    } else if (entityType === 'testimonials') {
      let updated: TestimonialItem[];
      if (editingId) {
        updated = testimonials.map((t) => (t.id === editingId ? { ...t, ...testimonialForm } : t));
        setActionNotice('Testimonial updated.');
      } else {
        const item: TestimonialItem = {
          id: 'test_' + Date.now().toString(36),
          ...testimonialForm,
          createdAt: Date.now(),
        };
        updated = [item, ...testimonials];
        setActionNotice('Kind words testimonial added.');
      }
      StorageService.saveTestimonials(updated);
      onTestimonialsUpdated(updated);
    } else if (entityType === 'faqs') {
      let updated: FaqItem[];
      if (editingId) {
        updated = faqs.map((q) => (q.id === editingId ? { ...q, ...faqForm } : q));
        setActionNotice('FAQ item updated.');
      } else {
        const item: FaqItem = {
          id: 'faq_' + Date.now().toString(36),
          ...faqForm,
          createdAt: Date.now(),
        };
        updated = [...faqs, item];
        setActionNotice('New FAQ item added.');
      }
      StorageService.saveFaqs(updated);
      onFaqsUpdated(updated);
    }

    resetForms();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const getTitle = () => {
    switch (entityType) {
      case 'films':
        return 'Cinematic Films & Wedding Reels';
      case 'packages':
        return 'Photography & Cinematography Packages';
      case 'testimonials':
        return 'Client Reviews & Kind Words';
      case 'faqs':
        return 'Frequently Asked Questions';
    }
  };

  const getButtonLabel = () => {
    switch (entityType) {
      case 'films':
        return 'Add Film / Reel';
      case 'packages':
        return 'Add New Package';
      case 'testimonials':
        return 'Add Testimonial';
      case 'faqs':
        return 'Add FAQ';
    }
  };

  const liveVideoInfo = filmForm.videoUrl ? parseVideoUrl(filmForm.videoUrl) : null;

  // Filtered studio photos for library picker
  const filteredStudioPhotos = photos.filter((p) => {
    const matchesSearch =
      !studioPhotoSearch ||
      (p.caption && p.caption.toLowerCase().includes(studioPhotoSearch.toLowerCase())) ||
      (p.coupleName && p.coupleName.toLowerCase().includes(studioPhotoSearch.toLowerCase())) ||
      (p.moment && p.moment.toLowerCase().includes(studioPhotoSearch.toLowerCase()));

    const matchesMoment =
      studioPhotoFilter === 'All' || p.moment?.toLowerCase() === studioPhotoFilter.toLowerCase();

    return matchesSearch && matchesMoment;
  });

  const uniqueMoments = ['All', ...Array.from(new Set(photos.map((p) => p.moment).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{getTitle()}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {entityType === 'films' &&
              'Manage your cinema videos, reels, and custom thumbnail poster images seamlessly.'}
            {entityType === 'packages' &&
              'Manage your bespoke investment collections, service tiers, and pricing guides.'}
            {entityType === 'testimonials' &&
              'Curate heartfelt praise and warm words from couples you have documented.'}
            {entityType === 'faqs' && 'Answer common questions about process, delivery, and travel.'}
          </p>
        </div>

        {!formOpen && (
          <button
            onClick={() => {
              resetForms();
              setFormOpen(true);
            }}
            id={`add-${entityType}-btn`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-extrabold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{getButtonLabel()}</span>
          </button>
        )}
      </div>

      {/* Form Drawer / Card */}
      {formOpen && (
        <div className="bg-white rounded-2xl border-2 border-black p-6 sm:p-8 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between pb-6 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? `Edit ${getTitle().split('&')[0].trim()}` : `Add New ${getTitle().split('&')[0].trim()}`}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Fill in the details below to update your live client portfolio.
              </p>
            </div>
            <button
              onClick={resetForms}
              className="p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 pt-6">
            {/* 1. FILMS FORM */}
            {entityType === 'films' && (
              <>
                {/* Source Selection Tabs */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">
                    Video Platform & Format
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoSourceType('instagram');
                        if (!filmForm.videoUrl.includes('instagram.com')) {
                          setFilmForm({ ...filmForm, provider: 'instagram', isVertical: true });
                        }
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        videoSourceType === 'instagram'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span>Instagram Reel (9:16)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVideoSourceType('youtube');
                        if (!filmForm.videoUrl.includes('youtube.com') && !filmForm.videoUrl.includes('youtu.be')) {
                          setFilmForm({ ...filmForm, provider: 'youtube', isVertical: false });
                        }
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        videoSourceType === 'youtube'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Film className="w-4 h-4 text-red-500" />
                      <span>YouTube / Vimeo Film (16:9)</span>
                    </button>
                  </div>
                </div>

                {/* Video URL Input with Auto-Fetch Button */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    {videoSourceType === 'instagram'
                      ? 'Instagram Reel / Post URL *'
                      : 'YouTube / Vimeo Video URL *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={filmForm.videoUrl}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                      placeholder={
                        videoSourceType === 'instagram'
                          ? 'https://www.instagram.com/reel/C3b45XYZ890/'
                          : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleFetchVideoFromLink}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-black hover:text-white text-gray-800 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                      title="Fetch details & thumbnail from link"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Auto Fetch</span>
                    </button>
                  </div>

                  {fetchStatus && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{fetchStatus}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-400 font-normal mt-1">
                    {videoSourceType === 'instagram'
                      ? 'Supports instagram.com/reel/..., instagram.com/reels/..., and instagram.com/p/... formats.'
                      : 'Supports full YouTube watch URLs, short URLs (youtu.be), YouTube Shorts, and Vimeo URLs.'}
                  </p>
                </div>

                {/* Film Title and Celebration Date */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Wedding Title / Reel Caption *
                    </label>
                    <input
                      type="text"
                      required
                      value={filmForm.title}
                      onChange={(e) => setFilmForm({ ...filmForm, title: e.target.value })}
                      placeholder="e.g. Tara & Neil — Sunset Haldi & Joyful Sangeet Reel"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Celebration Date
                    </label>
                    <input
                      type="date"
                      value={filmForm.date}
                      onChange={(e) => setFilmForm({ ...filmForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* THUMBNAIL MANAGEMENT STUDIO */}
                <div className="p-5 rounded-2xl bg-neutral-50 border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-extrabold text-gray-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>Thumbnail / Poster Image Customization</span>
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Change or upload high-res cover photos displayed on the films grid and video player.
                      </p>
                    </div>

                    {filmForm.coverImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilmForm({ ...filmForm, coverImage: '' });
                          setThumbStats(null);
                        }}
                        className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Source Selector Tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setThumbnailTab('upload')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        thumbnailTab === 'upload'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailTab('studio')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        thumbnailTab === 'studio'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Studio Photos ({photos.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThumbnailTab('url')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        thumbnailTab === 'url'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>Drive / Web URL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailTab('auto');
                        if (liveVideoInfo?.thumbnailUrl) {
                          setFilmForm({ ...filmForm, coverImage: liveVideoInfo.thumbnailUrl });
                          setFetchStatus('Extracted high-res thumbnail from video link!');
                        }
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        thumbnailTab === 'auto'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto Video Grab</span>
                    </button>
                  </div>

                  {/* TAB 1: DEVICE UPLOAD */}
                  {thumbnailTab === 'upload' && (
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-black bg-white rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-gray-50/80"
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-2 text-gray-700">
                          {uploadingThumb ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-900">
                          {uploadingThumb ? 'Optimizing Image...' : 'Click to Browse & Upload Photo from Computer / Phone'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Auto-compressed to ultra-fast high-res WebP format for fast loading
                        </p>
                      </div>

                      {thumbStats && (
                        <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
                          <span>
                            Optimized: <strong>{thumbStats.originalSize}</strong> →{' '}
                            <strong>{thumbStats.compressedSize}</strong>
                          </span>
                          <span className="font-extrabold text-emerald-600">
                            Saved {thumbStats.savedPercent}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SELECT FROM STUDIO PHOTOS */}
                  {thumbnailTab === 'studio' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={studioPhotoSearch}
                            onChange={(e) => setStudioPhotoSearch(e.target.value)}
                            placeholder="Search photos by couple, moment..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-black"
                          />
                        </div>

                        <select
                          value={studioPhotoFilter}
                          onChange={(e) => setStudioPhotoFilter(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white font-medium focus:outline-none"
                        >
                          {uniqueMoments.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {filteredStudioPhotos.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No matching studio photos found.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 scrollbar-thin">
                          {filteredStudioPhotos.map((photo) => {
                            const isSelected = filmForm.coverImage === photo.image;
                            return (
                              <div
                                key={photo.id}
                                onClick={() => {
                                  setFilmForm({ ...filmForm, coverImage: photo.image });
                                  setThumbStats(null);
                                }}
                                className={`group relative aspect-4/3 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-black ring-2 ring-black scale-95 shadow-md'
                                    : 'border-transparent hover:border-gray-400'
                                }`}
                              >
                                <img
                                  src={photo.image}
                                  alt={photo.caption || 'Studio Photo'}
                                  className="w-full h-full object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-[9px] text-white font-medium truncate">{photo.coupleName || photo.moment}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: DRIVE OR WEB URL */}
                  {thumbnailTab === 'url' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={filmForm.coverImage}
                          onChange={(e) => {
                            const val = e.target.value;
                            const direct = isDriveUrl(val) ? convertDriveToDirectImageUrl(val) : val;
                            setFilmForm({ ...filmForm, coverImage: direct });
                          }}
                          placeholder="Paste Google Drive share link, Dropbox link, or web image URL"
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-black font-mono bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Google Drive links are automatically converted into direct high-speed image streams.
                      </p>
                    </div>
                  )}

                  {/* TAB 4: AUTO VIDEO THUMBNAIL */}
                  {thumbnailTab === 'auto' && (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Automatic Video Poster Grabber</p>
                          <p className="text-[10px] text-gray-500">
                            {liveVideoInfo?.thumbnailUrl
                              ? 'Extracted high-res poster from video ID ' + liveVideoInfo.shortcode
                              : 'Enter a valid video URL above to auto-extract the thumbnail.'}
                          </p>
                        </div>
                      </div>

                      {liveVideoInfo?.thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilmForm({ ...filmForm, coverImage: liveVideoInfo.thumbnailUrl || '' });
                            setFetchStatus('Applied video thumbnail cover!');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold cursor-pointer hover:bg-gray-800"
                        >
                          Use Auto Poster
                        </button>
                      )}
                    </div>
                  )}

                  {/* LIVE THUMBNAIL PREVIEW CARD */}
                  <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-48 aspect-16/10 rounded-xl bg-black overflow-hidden relative border border-gray-300 shrink-0 shadow-xs group">
                      <img
                        src={
                          filmForm.coverImage ||
                          (videoSourceType === 'instagram'
                            ? 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop'
                            : 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop')
                        }
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                        {filmForm.coverImage ? 'Custom Cover' : 'Auto Default'}
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 w-full">
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>Current Thumbnail Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            filmForm.coverImage
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {filmForm.coverImage ? 'Custom High-Res Set' : 'Default Auto Poster'}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-500 truncate max-w-md font-mono">
                        {filmForm.coverImage || 'No custom URL set (using cinematic fallback)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live In-Form Video Player Preview Card */}
                {liveVideoInfo && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 text-white space-y-3 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs uppercase tracking-widest font-bold">
                          Live Video Player Preview ({liveVideoInfo.provider.toUpperCase()})
                        </span>
                      </div>

                      {liveVideoInfo.provider === 'instagram' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-[10px] font-bold">
                          <Instagram className="w-3 h-3" />
                          <span>Reel #{liveVideoInfo.shortcode}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                      {liveVideoInfo.provider === 'instagram' ? (
                        <div className="w-full max-w-[280px] aspect-[9/16] bg-black rounded-xl overflow-hidden border border-white/10 mx-auto">
                          <iframe
                            src={liveVideoInfo.embedUrl}
                            title="Instagram Reel Preview"
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            scrolling="no"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
                          <iframe
                            src={liveVideoInfo.embedUrl}
                            title="Film Preview"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. PACKAGES FORM */}
            {entityType === 'packages' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Package Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      placeholder="e.g. The Full Wedding Story"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Pricing Line *
                    </label>
                    <input
                      type="text"
                      required
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                      placeholder="e.g. ₹1,95,000 onward"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Inclusions (one item per line) *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                    placeholder="• 2–3 Days of coverage&#10;• Lead Candid Photographer + 2 Associates&#10;• 600+ hand-edited photographs&#10;• 3–5 min cinematic teaser"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="highlight-package-checkbox"
                    checked={packageForm.highlight}
                    onChange={(e) => setPackageForm({ ...packageForm, highlight: e.target.checked })}
                    className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                  />
                  <label
                    htmlFor="highlight-package-checkbox"
                    className="text-xs font-bold text-gray-900 cursor-pointer"
                  >
                    Highlight as "Most Popular / Recommended" Package
                  </label>
                </div>
              </>
            )}

            {/* 3. TESTIMONIALS FORM */}
            {entityType === 'testimonials' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Couple / Client Names *
                    </label>
                    <input
                      type="text"
                      required
                      value={testimonialForm.coupleName}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, coupleName: e.target.value })}
                      placeholder="e.g. Maya & Aditya (Goa)"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Celebration Date
                    </label>
                    <input
                      type="date"
                      value={testimonialForm.date}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Couple's Review / Quote *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={testimonialForm.quote}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })}
                    placeholder="We were blown away by Sandip and his team..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black italic"
                  />
                </div>
              </>
            )}

            {/* 4. FAQS FORM */}
            {entityType === 'faqs' && (
              <>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    placeholder="e.g. How far in advance should we book your dates?"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Answer *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="We recommend reserving 6 to 12 months in advance..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </>
            )}

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForms}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-black hover:border-black transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-entity-submit-btn"
                className="px-6 py-2.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-extrabold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
              >
                {editingId ? 'Update & Save' : 'Publish to Site'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUICK CHANGE THUMBNAIL MODAL FOR FILMS */}
      {quickThumbFilm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border-2 border-black p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Change Film Thumbnail</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{quickThumbFilm.title}</p>
                </div>
              </div>
              <button
                onClick={() => setQuickThumbFilm(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Tab Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setQuickThumbTab('upload')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  quickThumbTab === 'upload' ? 'bg-white text-black shadow-xs' : 'text-gray-600'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Device Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickThumbTab('studio')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  quickThumbTab === 'studio' ? 'bg-white text-black shadow-xs' : 'text-gray-600'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Studio Library</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickThumbTab('url')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  quickThumbTab === 'url' ? 'bg-white text-black shadow-xs' : 'text-gray-600'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>Drive URL</span>
              </button>
            </div>

            {/* QUICK TAB 1: DEVICE UPLOAD */}
            {quickThumbTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={quickFileInputRef}
                  accept="image/*"
                  onChange={handleQuickThumbnailUpload}
                  className="hidden"
                />
                <div
                  onClick={() => quickFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-black bg-gray-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center mx-auto mb-2 text-gray-800">
                    {uploadingThumb ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-900">
                    {uploadingThumb ? 'Compressing & Preparing...' : 'Click to Upload New Image from Phone/PC'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Automatic high-performance optimization</p>
                </div>
              </div>
            )}

            {/* QUICK TAB 2: STUDIO PHOTOS PICKER */}
            {quickThumbTab === 'studio' && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                  {photos.map((photo) => {
                    const isSelected = quickThumbNewImage === photo.image;
                    return (
                      <div
                        key={photo.id}
                        onClick={() => setQuickThumbNewImage(photo.image)}
                        className={`aspect-4/3 rounded-lg overflow-hidden border-2 relative cursor-pointer ${
                          isSelected ? 'border-black ring-2 ring-black' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img src={photo.image} alt={photo.caption} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUICK TAB 3: DRIVE URL */}
            {quickThumbTab === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={quickThumbNewImage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuickThumbNewImage(isDriveUrl(val) ? convertDriveToDirectImageUrl(val) : val);
                  }}
                  placeholder="Paste Google Drive share link or image URL"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-black"
                />
              </div>
            )}

            {/* Live New Preview in Modal */}
            <div className="p-3 bg-neutral-100 rounded-2xl flex items-center gap-3">
              <div className="w-24 h-16 rounded-xl bg-black overflow-hidden relative shrink-0 border border-gray-300">
                <img
                  src={quickThumbNewImage || 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=300'}
                  alt="New Poster Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-current" />
                </div>
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-900">New Thumbnail Preview</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {quickThumbNewImage ? 'Ready to apply to live films gallery' : 'No image chosen yet'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setQuickThumbFilm(null)}
                className="px-4 py-2 rounded-full border border-gray-200 text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickThumbnail}
                disabled={!quickThumbNewImage || quickThumbSaving}
                className="px-6 py-2 rounded-full bg-black text-white text-xs uppercase tracking-widest font-extrabold hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {quickThumbSaving ? 'Saving...' : 'Apply & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Views */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-2xs">
        {/* Films List */}
        {entityType === 'films' &&
          films.map((f) => {
            const videoInfo = parseVideoUrl(f.videoUrl);
            const isInstagram = videoInfo.provider === 'instagram' || f.provider === 'instagram';
            const isDeleting = confirmDeleteId === f.id;

            return (
              <div
                key={f.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail with Quick Change Hover trigger */}
                  <div
                    onClick={() => openQuickThumbEditor(f)}
                    className="w-20 h-14 rounded-xl bg-black overflow-hidden relative shrink-0 border border-gray-200 cursor-pointer group shadow-2xs"
                    title="Click to Change Thumbnail Image"
                  >
                    <img
                      src={
                        f.coverImage ||
                        (isInstagram
                          ? 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=300&auto=format&fit=crop'
                          : 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=300&auto=format&fit=crop')
                      }
                      alt={f.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      <div className="text-white flex flex-col items-center gap-0.5 opacity-90 group-hover:opacity-100">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-extrabold uppercase tracking-tighter hidden group-hover:inline">
                          Change
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate max-w-sm">{f.title}</p>
                      {isInstagram ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-[9px] font-extrabold uppercase tracking-wider">
                          <Instagram className="w-2.5 h-2.5" />
                          <span>Reel</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[9px] font-bold uppercase tracking-wider">
                          <Film className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Cinema</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="font-mono truncate max-w-xs">{f.videoUrl}</span>
                      {f.coverImage && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Custom Thumbnail</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 rounded-lg text-gray-500 hover:text-black cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Change Thumbnail Quick Action */}
                      <button
                        onClick={() => openQuickThumbEditor(f)}
                        id={`change-thumb-${f.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer border border-emerald-200/80"
                        title="Change Thumbnail Image"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Change Thumbnail</span>
                      </button>

                      <a
                        href={f.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                        title="Open Video Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => startEdit(f.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Edit Film"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(f.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Film"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

        {/* Packages List */}
        {entityType === 'packages' &&
          packages.map((p) => {
            const isDeleting = confirmDeleteId === p.id;
            return (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    {p.highlight && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] uppercase tracking-widest font-extrabold">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-black font-extrabold mt-0.5">{p.price}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 rounded-lg text-gray-500 hover:text-black cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(p.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Edit Package"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

        {/* Testimonials List */}
        {entityType === 'testimonials' &&
          testimonials.map((t) => {
            const isDeleting = confirmDeleteId === t.id;
            return (
              <div
                key={t.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.coupleName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 rounded-lg text-gray-500 hover:text-black cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(t.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Edit Testimonial"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Testimonial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

        {/* FAQs List */}
        {entityType === 'faqs' &&
          faqs.map((q) => {
            const isDeleting = confirmDeleteId === q.id;
            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">{q.question}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{q.answer}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-extrabold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 rounded-lg text-gray-500 hover:text-black cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(q.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Edit FAQ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(q.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
