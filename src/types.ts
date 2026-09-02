export type MomentCategory =
  | 'All'
  | 'Haldi'
  | 'Mehendi'
  | 'Sangeet'
  | 'Wedding Ceremony'
  | 'Reception'
  | 'Pre-Wedding Shoot'
  | 'Couple Portraits'
  | 'Candid Moments';

export interface ScrollerAvatar {
  id: string;
  src: string;
  alt?: string;
}

export interface PhotoItem {
  id: string;
  image: string; // URL, Base64 data, or Firebase Storage URL
  caption?: string;
  moment?: string;
  coupleName?: string;
  date?: string;
  featured?: boolean;
  createdAt: number;
  cloudSynced?: boolean;
  storageType?: 'firestore' | 'drive' | 'url' | 'local';
}

export interface PackageItem {
  id: string;
  name: string;
  price: string;
  description: string;
  highlight?: boolean;
  createdAt?: number;
}

export interface TestimonialItem {
  id: string;
  coupleName: string;
  quote: string;
  date?: string;
  createdAt?: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  createdAt?: number;
}

export interface FilmItem {
  id: string;
  title: string;
  videoUrl: string;
  provider?: 'instagram' | 'youtube' | 'vimeo' | 'direct' | 'unknown';
  shortcode?: string;
  isVertical?: boolean;
  date?: string;
  coverPhotoId?: string;
  coverImage?: string;
  createdAt?: number;
}

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  weddingDate?: string;
  message: string;
  createdAt: number;
  read: boolean;
  autoReplied?: boolean;
  autoReplySentAt?: number;
  autoReplyNote?: string;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  aboutText: string;
  founderName: string;
  founderTitle: string;
  contactEmail: string;
  contactPhone: string;
  instagram: string;
  locationsLine: string;
  footerLine: string;
  heroPhotoId: string | null;
  statsYears: string;
  statsCities: string;
  theme: ThemeColors;
  driveClientId: string;
  driveFolderId: string | null;
  driveFolderUrl?: string;
  driveFolderTitle?: string;
  logoUrl?: string;
  logoType?: 'image' | 'text' | 'both';
  siteSubtitle?: string;

  // Auto-Reply System Settings
  autoReplyEnabled?: boolean;
  autoReplySubject?: string;
  autoReplyGreeting?: string;
  autoReplyMessage?: string;
  autoReplyBrochureUrl?: string;
  autoReplyWhatsappText?: string;
  autoReplyEstimatedTime?: string;
  autoReplyIncludePricingNote?: boolean;

  // 100% Free Forever Storage & Database Settings
  storageMode?: 'free-local' | 'free-cloud';
  firebaseSyncEnabled?: boolean;
  firebaseLastSyncedAt?: number;

  // Watermark & IP Copyright Protection Settings
  watermarkEnabled?: boolean;
  watermarkType?: 'text' | 'logo' | 'both';
  watermarkText?: string;
  watermarkLogoUrl?: string;
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center' | 'top-right' | 'diagonal-repeat';
  watermarkOpacity?: number; // 10 to 100
  watermarkStyle?: 'subtle-badge' | 'minimal-clean' | 'embossed-stamp' | 'cinematic-tag';
  watermarkSize?: 'sm' | 'md' | 'lg';
  watermarkShowInLightbox?: boolean;
  watermarkShowInGallery?: boolean;
  watermarkShowInFeatured?: boolean;
  preventImageStealing?: boolean; // Disables right-click context menu & image dragging

  // Custom Section Headings, Eyebrows & Descriptions
  heroBadge?: string;
  heroHeadline?: string;
  heroSubtext?: string;

  statsQuoteText?: string;
  statsQuoteAuthor?: string;
  stripAvatars?: ScrollerAvatar[];

  featuredBadge?: string;
  featuredHeadline?: string;
  featuredSubtext?: string;

  galleryBadge?: string;
  galleryHeadline?: string;
  gallerySubtext?: string;

  storiesBadge?: string;
  storiesHeadline?: string;
  storiesSubtext?: string;

  filmsBadge?: string;
  filmsHeadline?: string;
  filmsSubtext?: string;

  floatingBadge?: string;
  floatingHeadline?: string;
  floatingSubtext?: string;

  packagesBadge?: string;
  packagesHeadline?: string;
  packagesSubtext?: string;

  testimonialsBadge?: string;
  testimonialsHeadline?: string;
  testimonialsSubtext?: string;

  visionBadge?: string;
  visionHeadline?: string;
  visionSubtext?: string;
  visionImageGroom?: string;
  visionImageCouple?: string;
  visionImageBrideTop?: string;
  visionImageBrideBottom?: string;

  founderBadge?: string;
  founderGreeting?: string;
  gearBadge?: string;
  gear1Title?: string;
  gear1Desc?: string;
  gear2Title?: string;
  gear2Desc?: string;
  gear3Title?: string;
  gear3Desc?: string;

  faqsBadge?: string;
  faqsHeadline?: string;
  faqsSubtext?: string;

  contactBadge?: string;
  contactHeadline?: string;
  contactSubtext?: string;
}
