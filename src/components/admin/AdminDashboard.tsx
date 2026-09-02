import React, { useState } from 'react';
import {
  PhotoItem,
  PackageItem,
  TestimonialItem,
  FaqItem,
  FilmItem,
  InquiryItem,
  SiteSettings,
} from '../../types';
import { PhotoManager } from './PhotoManager';
import { ThemeManager } from './ThemeManager';
import { InquiryManager } from './InquiryManager';
import { CrudManager } from './CrudManager';
import { SettingsManager } from './SettingsManager';
import { DriveManager } from './DriveManager';
import {
  Camera,
  Palette,
  Film,
  Package,
  MessageSquareQuote,
  HelpCircle,
  Inbox,
  Settings,
  HardDrive,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface AdminDashboardProps {
  settings: SiteSettings;
  photos: PhotoItem[];
  packages: PackageItem[];
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  films: FilmItem[];
  inquiries: InquiryItem[];
  onPhotosUpdated: (photos: PhotoItem[]) => void;
  onPackagesUpdated: (packages: PackageItem[]) => void;
  onTestimonialsUpdated: (testimonials: TestimonialItem[]) => void;
  onFaqsUpdated: (faqs: FaqItem[]) => void;
  onFilmsUpdated: (films: FilmItem[]) => void;
  onInquiriesUpdated: (inquiries: InquiryItem[]) => void;
  onSettingsUpdated: (settings: SiteSettings) => void;
  onBackToSite: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  photos,
  packages,
  testimonials,
  faqs,
  films,
  inquiries,
  onPhotosUpdated,
  onPackagesUpdated,
  onTestimonialsUpdated,
  onFaqsUpdated,
  onFilmsUpdated,
  onInquiriesUpdated,
  onSettingsUpdated,
  onBackToSite,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    'photos' | 'theme' | 'films' | 'packages' | 'testimonials' | 'faqs' | 'inquiries' | 'settings' | 'drive'
  >('photos');

  const unreadInquiriesCount = inquiries.filter((i) => !i.read).length;

  interface NavTabItem {
    id: 'photos' | 'theme' | 'films' | 'packages' | 'testimonials' | 'faqs' | 'inquiries' | 'settings' | 'drive';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    highlight?: boolean;
  }

  const navTabs: NavTabItem[] = [
    { id: 'photos', label: 'Photos', icon: Camera, count: photos.length },
    { id: 'inquiries', label: 'Inquiries', icon: Inbox, count: unreadInquiriesCount, highlight: unreadInquiriesCount > 0 },
    { id: 'films', label: 'Films', icon: Film, count: films.length },
    { id: 'packages', label: 'Packages', icon: Package, count: packages.length },
    { id: 'testimonials', label: 'Kind Words', icon: MessageSquareQuote, count: testimonials.length },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle, count: faqs.length },
    { id: 'theme', label: 'Appearance', icon: Palette },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'drive', label: 'Google Drive', icon: HardDrive },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col text-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-black">
              {settings.siteName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] uppercase tracking-widest font-extrabold">
              Studio Portal
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBackToSite}
              id="admin-view-live-site-btn"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 hover:border-black text-xs uppercase tracking-widest font-bold text-gray-800 hover:text-black transition-colors"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onLogout}
              id="admin-logout-btn"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-black transition-colors"
              title="Lock & Exit Studio Admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Scroll Strip */}
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 overflow-x-auto scrollbar-none flex items-center gap-2 sm:gap-3 border-t border-gray-100">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                id={`admin-tab-${tab.id}`}
                className={`py-3.5 px-2 flex items-center gap-2 border-b-2 text-xs uppercase tracking-wider font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      (tab as any).highlight
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 md:px-10 py-10">
        {activeTab === 'photos' && (
          <PhotoManager
            photos={photos}
            settings={settings}
            onPhotosUpdated={onPhotosUpdated}
            onSettingsUpdated={onSettingsUpdated}
          />
        )}

        {activeTab === 'inquiries' && (
          <InquiryManager
            inquiries={inquiries}
            settings={settings}
            onInquiriesUpdated={onInquiriesUpdated}
          />
        )}

        {activeTab === 'theme' && (
          <ThemeManager
            settings={settings}
            onSettingsUpdated={onSettingsUpdated}
          />
        )}

        {(activeTab === 'films' ||
          activeTab === 'packages' ||
          activeTab === 'testimonials' ||
          activeTab === 'faqs') && (
          <CrudManager
            entityType={activeTab}
            films={films}
            packages={packages}
            testimonials={testimonials}
            faqs={faqs}
            photos={photos}
            settings={settings}
            onFilmsUpdated={onFilmsUpdated}
            onPackagesUpdated={onPackagesUpdated}
            onTestimonialsUpdated={onTestimonialsUpdated}
            onFaqsUpdated={onFaqsUpdated}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            settings={settings}
            photos={photos}
            onSettingsUpdated={onSettingsUpdated}
          />
        )}

        {activeTab === 'drive' && (
          <DriveManager
            settings={settings}
            photos={photos}
            onSettingsUpdated={onSettingsUpdated}
            onPhotosUpdated={onPhotosUpdated}
          />
        )}
      </main>
    </div>
  );
};
