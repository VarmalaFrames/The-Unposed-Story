import React, { useState, useId } from 'react';
import { SiteSettings, PhotoItem, ScrollerAvatar } from '../../types';
import { StorageService } from '../../services/storage';
import { LOGO_EMBLEM, DEFAULT_STRIP_AVATARS, DEFAULT_VISION_IMAGES } from '../../data/initialData';
import { convertDriveToDirectImageUrl } from '../../utils/driveHelper';
import { FirebaseService } from '../../services/firebase';
import { SupabaseService } from '../../services/supabase';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import { downloadWatermarkedPhoto } from '../../utils/watermark';
import {
  Check,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  X,
  Layers,
  FolderOpen,
  HelpCircle,
  Database,
  Cloud,
  MessageSquare,
  Send,
  RefreshCw,
  ExternalLink,
  FileText,
  CheckCircle2,
  Zap,
  Shield,
  ShieldCheck,
  Lock,
  Download,
} from 'lucide-react';

interface SettingsManagerProps {
  settings: SiteSettings;
  photos: PhotoItem[];
  onSettingsUpdated: (settings: SiteSettings) => void;
}

type VisionSlot = 'groom' | 'couple' | 'brideTop' | 'brideBottom';

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  photos,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<SiteSettings>({
    ...settings,
    logoUrl: settings.logoUrl || LOGO_EMBLEM,
    logoType: settings.logoType || 'both',
    siteSubtitle: settings.siteSubtitle || 'Photography & Films',
    stripAvatars:
      settings.stripAvatars && settings.stripAvatars.length > 0
        ? settings.stripAvatars
        : DEFAULT_STRIP_AVATARS,
    visionImageGroom: settings.visionImageGroom || DEFAULT_VISION_IMAGES.groom,
    visionImageCouple: settings.visionImageCouple || DEFAULT_VISION_IMAGES.couple,
    visionImageBrideTop: settings.visionImageBrideTop || DEFAULT_VISION_IMAGES.brideTop,
    visionImageBrideBottom: settings.visionImageBrideBottom || DEFAULT_VISION_IMAGES.brideBottom,
  });
  const [saved, setSaved] = useState(false);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Scroller Avatars State
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newAvatarAlt, setNewAvatarAlt] = useState('');
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);

  // Vision Floating Images State
  const [visionUploadSlot, setVisionUploadSlot] = useState<VisionSlot | null>(null);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [visionGalleryPickerSlot, setVisionGalleryPickerSlot] = useState<VisionSlot | null>(null);
  const [visionNotice, setVisionNotice] = useState<string | null>(null);

  // Firebase Storage Base & Cloud Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  // Supabase Free Tier Storage State
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{
    success: boolean;
    message: string;
    bucketFound?: boolean;
    publicUrlSample?: string;
  } | null>(null);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [supabaseSyncMsg, setSupabaseSyncMsg] = useState<string | null>(null);

  const logoFileInputId = useId();
  const avatarFileInputId = useId();
  const visionGroomFileId = useId();
  const visionCoupleFileId = useId();
  const visionBrideTopFileId = useId();
  const visionBrideBottomFileId = useId();

  const visionSlotConfig: {
    key: VisionSlot;
    settingKey: 'visionImageGroom' | 'visionImageCouple' | 'visionImageBrideTop' | 'visionImageBrideBottom';
    label: string;
    sublabel: string;
    position: string;
    aspectText: string;
    fileInputId: string;
    defaultUrl: string;
  }[] = [
    {
      key: 'groom',
      settingKey: 'visionImageGroom',
      label: 'Floating Image 1 (Top-Left)',
      sublabel: 'Groom / Royal Portrait',
      position: 'Top Left',
      aspectText: 'Vertical (Aspect ~4:5)',
      fileInputId: visionGroomFileId,
      defaultUrl: DEFAULT_VISION_IMAGES.groom,
    },
    {
      key: 'couple',
      settingKey: 'visionImageCouple',
      label: 'Floating Image 2 (Bottom-Left)',
      sublabel: 'Couple / Candid Emotion',
      position: 'Bottom Left',
      aspectText: 'Square (Aspect 1:1)',
      fileInputId: visionCoupleFileId,
      defaultUrl: DEFAULT_VISION_IMAGES.couple,
    },
    {
      key: 'brideTop',
      settingKey: 'visionImageBrideTop',
      label: 'Floating Image 3 (Top-Right)',
      sublabel: 'Bride in Lehenga / Detail',
      position: 'Top Right',
      aspectText: 'Square (Aspect 1:1)',
      fileInputId: visionBrideTopFileId,
      defaultUrl: DEFAULT_VISION_IMAGES.brideTop,
    },
    {
      key: 'brideBottom',
      settingKey: 'visionImageBrideBottom',
      label: 'Floating Image 4 (Bottom-Right)',
      sublabel: 'Smiling Bride / Ceremony',
      position: 'Bottom Right',
      aspectText: 'Vertical (Aspect ~4:5)',
      fileInputId: visionBrideBottomFileId,
      defaultUrl: DEFAULT_VISION_IMAGES.brideBottom,
    },
  ];

  const currentAvatars: ScrollerAvatar[] =
    formData.stripAvatars && formData.stripAvatars.length > 0
      ? formData.stripAvatars
      : DEFAULT_STRIP_AVATARS;

  // Handle Scroller Avatar Upload from Device
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarUploadLoading(true);
    setAvatarError(null);

    try {
      const compressed = await StorageService.compressImage(file);
      const newEntry: ScrollerAvatar = {
        id: 'av_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        src: compressed,
        alt: file.name.replace(/\.[^/.]+$/, '') || 'Wedding portrait',
      };
      const updated = [...currentAvatars, newEntry];
      setFormData((prev) => ({
        ...prev,
        stripAvatars: updated,
      }));
      StorageService.saveSettings({ ...formData, stripAvatars: updated });
      onSettingsUpdated({ ...formData, stripAvatars: updated });
      setAvatarNotice('New portrait added to scroller strip.');
      setTimeout(() => setAvatarNotice(null), 3000);
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload scroller image file');
    } finally {
      setAvatarUploadLoading(false);
      e.target.value = '';
    }
  };

  // Add Avatar by URL / Google Drive link
  const handleAddAvatarUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAvatarUrl.trim()) return;
    const direct = convertDriveToDirectImageUrl(newAvatarUrl.trim());
    const newEntry: ScrollerAvatar = {
      id: 'av_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      src: direct,
      alt: newAvatarAlt.trim() || 'Wedding portrait',
    };
    const updated = [...currentAvatars, newEntry];
    setFormData((prev) => ({
      ...prev,
      stripAvatars: updated,
    }));
    StorageService.saveSettings({ ...formData, stripAvatars: updated });
    onSettingsUpdated({ ...formData, stripAvatars: updated });
    setNewAvatarUrl('');
    setNewAvatarAlt('');
    setAvatarNotice('Portrait URL added to scroller strip.');
    setTimeout(() => setAvatarNotice(null), 3000);
  };

  // Select Photo from Gallery
  const handleSelectFromGallery = (photo: PhotoItem) => {
    const newEntry: ScrollerAvatar = {
      id: 'av_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      src: photo.image,
      alt: photo.coupleName || photo.caption || 'Wedding moment',
    };
    const updated = [...currentAvatars, newEntry];
    setFormData((prev) => ({
      ...prev,
      stripAvatars: updated,
    }));
    StorageService.saveSettings({ ...formData, stripAvatars: updated });
    onSettingsUpdated({ ...formData, stripAvatars: updated });
    setAvatarNotice(`Added "${photo.coupleName || 'Photo'}" to scroller.`);
    setTimeout(() => setAvatarNotice(null), 3000);
  };

  // Delete Avatar
  const handleDeleteAvatar = (id: string) => {
    const updated = currentAvatars.filter((a) => a.id !== id);
    setFormData((prev) => ({
      ...prev,
      stripAvatars: updated,
    }));
    StorageService.saveSettings({ ...formData, stripAvatars: updated });
    onSettingsUpdated({ ...formData, stripAvatars: updated });
    setAvatarNotice('Portrait removed from scroller.');
    setTimeout(() => setAvatarNotice(null), 2500);
  };

  // Move Avatar Position
  const handleMoveAvatar = (index: number, direction: 'up' | 'down') => {
    const updated = [...currentAvatars];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setFormData((prev) => ({
      ...prev,
      stripAvatars: updated,
    }));
    StorageService.saveSettings({ ...formData, stripAvatars: updated });
    onSettingsUpdated({ ...formData, stripAvatars: updated });
  };

  // Reset Avatars to Default Curated
  const handleResetAvatars = () => {
    setFormData((prev) => ({
      ...prev,
      stripAvatars: [...DEFAULT_STRIP_AVATARS],
    }));
    StorageService.saveSettings({ ...formData, stripAvatars: [...DEFAULT_STRIP_AVATARS] });
    onSettingsUpdated({ ...formData, stripAvatars: [...DEFAULT_STRIP_AVATARS] });
    setAvatarNotice('Reset scroller to default curated portraits.');
    setTimeout(() => setAvatarNotice(null), 3000);
  };

  // Handle Logo File Upload from Device
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setLogoUploadLoading(true);
    setLogoError(null);

    try {
      const compressed = await StorageService.compressImage(file);
      setFormData((prev) => ({
        ...prev,
        logoUrl: compressed,
      }));
    } catch (err: any) {
      setLogoError(err.message || 'Failed to process logo image file');
    } finally {
      setLogoUploadLoading(false);
    }
  };

  // Handle Logo URL / Google Drive link input
  const handleLogoUrlChange = (val: string) => {
    const direct = convertDriveToDirectImageUrl(val);
    setFormData((prev) => ({
      ...prev,
      logoUrl: direct,
    }));
  };

  // Reset Logo to Default Studio Emblem
  const handleResetLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: LOGO_EMBLEM,
      logoType: 'both',
    }));
  };

  // Handle Vision Floating Image Upload from Device
  const handleVisionFileUpload = async (slot: VisionSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setVisionUploadSlot(slot);
    setVisionError(null);

    try {
      const compressed = await StorageService.compressImage(file);
      const cfg = visionSlotConfig.find((c) => c.key === slot);
      if (!cfg) return;
      const updated = {
        ...formData,
        [cfg.settingKey]: compressed,
      };
      setFormData(updated);
      StorageService.saveSettings(updated);
      onSettingsUpdated(updated);
      setVisionNotice(`Updated ${cfg.label} from device.`);
      setTimeout(() => setVisionNotice(null), 3000);
    } catch (err: any) {
      setVisionError(err.message || 'Failed to process vision image file');
    } finally {
      setVisionUploadSlot(null);
      e.target.value = '';
    }
  };

  // Handle Vision Floating Image URL / Google Drive link input
  const handleVisionUrlChange = (slot: VisionSlot, val: string) => {
    const direct = convertDriveToDirectImageUrl(val.trim());
    const cfg = visionSlotConfig.find((c) => c.key === slot);
    if (!cfg) return;
    const updated = {
      ...formData,
      [cfg.settingKey]: direct,
    };
    setFormData(updated);
    StorageService.saveSettings(updated);
    onSettingsUpdated(updated);
  };

  // Select Photo from Gallery for Vision Floating Slot
  const handleSelectVisionFromGallery = (photo: PhotoItem) => {
    if (!visionGalleryPickerSlot) return;
    const cfg = visionSlotConfig.find((c) => c.key === visionGalleryPickerSlot);
    if (!cfg) return;
    const updated = {
      ...formData,
      [cfg.settingKey]: photo.image,
    };
    setFormData(updated);
    StorageService.saveSettings(updated);
    onSettingsUpdated(updated);
    setVisionNotice(`Applied "${photo.coupleName || 'Photo'}" to ${cfg.label}.`);
    setVisionGalleryPickerSlot(null);
    setTimeout(() => setVisionNotice(null), 3000);
  };

  // Reset Single Vision Floating Slot to Default Curated Photo
  const handleResetVisionSlot = (slot: VisionSlot) => {
    const cfg = visionSlotConfig.find((c) => c.key === slot);
    if (!cfg) return;
    const updated = {
      ...formData,
      [cfg.settingKey]: cfg.defaultUrl,
    };
    setFormData(updated);
    StorageService.saveSettings(updated);
    onSettingsUpdated(updated);
    setVisionNotice(`Reset ${cfg.label} to default portrait.`);
    setTimeout(() => setVisionNotice(null), 2500);
  };

  // Reset All 4 Vision Floating Photos to Default Curated Photos
  const handleResetAllVision = () => {
    const updated = {
      ...formData,
      visionImageGroom: DEFAULT_VISION_IMAGES.groom,
      visionImageCouple: DEFAULT_VISION_IMAGES.couple,
      visionImageBrideTop: DEFAULT_VISION_IMAGES.brideTop,
      visionImageBrideBottom: DEFAULT_VISION_IMAGES.brideBottom,
    };
    setFormData(updated);
    StorageService.saveSettings(updated);
    onSettingsUpdated(updated);
    setVisionNotice('Reset all 4 floating artwork photos to default portraits.');
    setTimeout(() => setVisionNotice(null), 3000);
  };

  const handleSyncAllToFirebase = async () => {
    setIsSyncingCloud(true);
    setSyncSuccess(null);
    setSyncStatusMsg('Connecting to Firebase Firestore & syncing all assets...');
    try {
      const inquiries = StorageService.getInquiries();
      const res = await FirebaseService.syncEverythingToCloud({
        photos,
        settings: formData,
        inquiries,
      });
      if (res.success) {
        setSyncSuccess(true);
        setSyncStatusMsg(`Successfully synchronized ${photos.length} photos, studio settings, and ${inquiries.length} enquiries to Firebase Firestore database.`);
      } else {
        setSyncSuccess(false);
        setSyncStatusMsg('Firebase cloud synchronization completed with local fallback active.');
      }
    } catch (err: any) {
      setSyncSuccess(false);
      setSyncStatusMsg(err.message || 'Firebase synchronization error occurred.');
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => {
        setSyncStatusMsg(null);
      }, 5000);
    }
  };

  // Test Supabase Connection & Bucket Access
  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseTestResult(null);
    try {
      const res = await SupabaseService.testConnection(formData);
      setSupabaseTestResult(res);
    } catch (err: any) {
      setSupabaseTestResult({
        success: false,
        message: err.message || 'Failed to connect to Supabase.',
      });
    } finally {
      setSupabaseTesting(false);
    }
  };

  // Migrate / Upload all local photos to Supabase Storage
  const handleMigratePhotosToSupabase = async () => {
    setSupabaseSyncing(true);
    setSupabaseSyncMsg('Starting batch upload of local photos to Supabase Free Storage CDN...');
    try {
      const res = await SupabaseService.syncAllPhotosToSupabase(
        photos,
        (curr, total, msg) => {
          setSupabaseSyncMsg(msg);
        },
        formData
      );

      if (res.uploadedCount > 0) {
        StorageService.savePhotos(res.updatedPhotos);
        // Force refresh parent photo list if possible
        setSupabaseSyncMsg(`Success! Uploaded ${res.uploadedCount} photos to Supabase Free Tier Storage.`);
      } else if (res.errors.length > 0) {
        setSupabaseSyncMsg(`Notice: ${res.errors[0]}`);
      } else {
        setSupabaseSyncMsg('All photos are already hosted on Supabase or external CDN.');
      }
    } catch (err: any) {
      setSupabaseSyncMsg(`Error: ${err.message || 'Supabase migration failed'}`);
    } finally {
      setSupabaseSyncing(false);
      setTimeout(() => {
        setSupabaseSyncMsg(null);
      }, 6000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(formData);
    onSettingsUpdated(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentLogo = formData.logoUrl || LOGO_EMBLEM;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Site &amp; Studio Settings
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-normal">
          Upload custom site logo, customize brand typography, and configure general studio identity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Website Logo & Brand Identity Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Website Logo &amp; Header Branding</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Upload your studio's official logo image or emblem to display across the navigation bar and footer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetLogo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-black text-[11px] uppercase tracking-widest font-bold text-gray-600 hover:text-black transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Default</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Upload Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* File Upload Zone */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                  Upload Logo File (PNG, JPG, SVG, WEBP)
                </label>
                <label
                  htmlFor={logoFileInputId}
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-black cursor-pointer bg-gray-50/60 hover:bg-gray-50 transition-all text-center"
                >
                  <Upload className="w-4 h-4 text-black shrink-0" />
                  <span className="text-xs text-gray-800 font-bold">
                    {logoUploadLoading ? 'Processing image...' : 'Choose logo image from your device'}
                  </span>
                  <input
                    id={logoFileInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
                {logoError && (
                  <p className="text-xs text-red-600 mt-1 font-semibold">{logoError}</p>
                )}
              </div>

              {/* URL or Drive Link */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                  Or Paste Logo Image URL / Google Drive Link
                </label>
                <input
                  type="text"
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleLogoUrlChange(e.target.value)}
                  placeholder="https://... or Google Drive share link"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-mono"
                />
              </div>

              {/* Logo Presentation Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                    Logo Display Format
                  </label>
                  <select
                    value={formData.logoType || 'both'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        logoType: e.target.value as 'both' | 'image' | 'text',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                  >
                    <option value="both">Logo Image + Brand Text</option>
                    <option value="image">Logo Image Only</option>
                    <option value="text">Brand Typography Text Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                    Header Subtitle / Tag
                  </label>
                  <input
                    type="text"
                    value={formData.siteSubtitle || ''}
                    onChange={(e) => setFormData({ ...formData, siteSubtitle: e.target.value })}
                    placeholder="e.g. Photography & Films"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Visual Preview Box */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-black" />
                <span>Live Navbar Header Preview</span>
              </span>

              {/* Dark Preview (Hero State) */}
              <div className="p-4 rounded-xl bg-black text-white space-y-2 border border-gray-800">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">
                  Top Header (Dark Hero Overlay)
                </span>
                <div className="flex items-center gap-3 pt-1">
                  {(formData.logoType === 'both' || formData.logoType === 'image') && currentLogo && (
                    <img
                      src={currentLogo}
                      alt="Logo"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20"
                    />
                  )}
                  {(formData.logoType === 'both' || formData.logoType === 'text') && (
                    <div>
                      <span className="font-serif font-bold text-base tracking-tight block text-white">
                        {formData.siteName}
                      </span>
                      {formData.siteSubtitle && (
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold block">
                          {formData.siteSubtitle}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Light Preview (Scrolled State) */}
              <div className="p-4 rounded-xl bg-white text-gray-900 space-y-2 border border-gray-200 shadow-2xs">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">
                  Scrolled Navbar (Light Background)
                </span>
                <div className="flex items-center gap-3 pt-1">
                  {(formData.logoType === 'both' || formData.logoType === 'image') && currentLogo && (
                    <img
                      src={currentLogo}
                      alt="Logo"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-black/10"
                    />
                  )}
                  {(formData.logoType === 'both' || formData.logoType === 'text') && (
                    <div>
                      <span className="font-serif font-bold text-base tracking-tight block text-gray-900">
                        {formData.siteName}
                      </span>
                      {formData.siteSubtitle && (
                        <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold block">
                          {formData.siteSubtitle}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Homepage Story Strip & Scroller Photos Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          {avatarNotice && (
            <div className="p-3.5 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{avatarNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAvatarNotice(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Homepage Story Strip · Scroller Portraits</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] uppercase tracking-wider font-extrabold">
                  {currentAvatars.length} Portraits
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Customize, add, or replace the circular wedding portraits in the continuous horizontal scroller.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetAvatars}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-black text-[11px] uppercase tracking-widest font-bold text-gray-600 hover:text-black transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Default Portraits</span>
            </button>
          </div>

          {/* Live Mini Scroller Preview */}
          <div className="bg-[#FAFAFA] rounded-xl p-4 border border-neutral-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1">
                <Eye className="w-3 h-3 text-neutral-600" />
                <span>Live Strip Preview (Tight Scroller Gap)</span>
              </span>
              <span className="text-[10px] text-gray-400">Continuous 360° marquee</span>
            </div>
            <div className="overflow-x-auto scrollbar-none py-2">
              <div className="flex items-center gap-2.5 w-max">
                {currentAvatars.map((av, idx) => (
                  <div key={av.id || idx} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-neutral-200 shrink-0">
                      <img
                        src={av.src}
                        alt={av.alt || 'Portrait'}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add New Avatar Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. Upload from Computer / Phone */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  1. Upload from Device
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Upload portrait (JPG, PNG, WEBP) to add directly to the loop.
                </p>
              </div>
              <label
                htmlFor={avatarFileInputId}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{avatarUploadLoading ? 'Uploading...' : 'Choose File'}</span>
                <input
                  id={avatarFileInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </label>
              {avatarError && (
                <p className="text-xs text-red-600 mt-1 font-semibold">{avatarError}</p>
              )}
            </div>

            {/* 2. Select from Portfolio Gallery */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  2. Pick from Portfolio
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Select any existing photo from your studio's gallery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryPicker(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Select from Gallery ({photos.length})</span>
              </button>
            </div>

            {/* 3. Add by URL / Google Drive */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  3. Image URL or Drive Link
                </label>
                <input
                  type="text"
                  value={newAvatarUrl}
                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                  placeholder="https://... or Drive link"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs mb-2 bg-white focus:outline-none focus:border-black font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAvatarUrl}
                disabled={!newAvatarUrl.trim()}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URL to Strip</span>
              </button>
            </div>
          </div>

          {/* Current Scroller Images Manager List */}
          <div className="space-y-3 pt-2">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Manage Active Scroller Portraits ({currentAvatars.length})
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {currentAvatars.map((av, index) => (
                <div
                  key={av.id || index}
                  className="flex items-center justify-between gap-3 p-2.5 bg-gray-50/80 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-white shadow-xs bg-neutral-200 shrink-0">
                      <img
                        src={av.src}
                        alt={av.alt || 'Portrait'}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-900 truncate block">
                        {av.alt || `Portrait #${index + 1}`}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono truncate block">
                        Position #{index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveAvatar(index, 'up')}
                      disabled={index === 0}
                      title="Move Left/Earlier in loop"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-200 disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveAvatar(index, 'down')}
                      disabled={index === currentAvatars.length - 1}
                      title="Move Right/Later in loop"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-200 disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAvatar(av.id)}
                      title="Remove from scroller"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal: Pick from Portfolio Photos */}
        {showGalleryPicker && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    Select Photograph for Scroller Strip
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click any portfolio image to instantly add it to your homepage story scroller.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGalleryPicker(false)}
                  className="p-1.5 text-gray-400 hover:text-black rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleSelectFromGallery(p);
                      setShowGalleryPicker(false);
                    }}
                    className="group relative rounded-xl overflow-hidden aspect-square border border-gray-200 hover:border-black transition-all text-left focus:outline-none cursor-pointer"
                  >
                    <img
                      src={p.image}
                      alt={p.caption || 'Wedding photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                      <span className="text-white text-xs font-bold truncate">
                        {p.coupleName || p.caption || 'Select Photo'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        + Add to Scroller
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGalleryPicker(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 hover:border-black text-xs font-bold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Vision Banner Floating Artwork Card (About Section 4 Floating Cards) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Vision Banner Floating Artwork (4 About Section Cards)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Customize the four floating photos flanking the "Turning Visions Into Art" headline and newsletter section.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetAllVision}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-black text-[11px] uppercase tracking-widest font-bold text-gray-600 hover:text-black transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All 4 to Default</span>
            </button>
          </div>

          {visionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{visionNotice}</span>
            </div>
          )}

          {visionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              <span>{visionError}</span>
            </div>
          )}

          {/* 4-Column Grid for the 4 Floating Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visionSlotConfig.map((slot) => {
              const currentImg = formData[slot.settingKey] || slot.defaultUrl;
              const isUploading = visionUploadSlot === slot.key;

              return (
                <div
                  key={slot.key}
                  className="bg-gray-50/70 border border-gray-200/90 rounded-2xl p-5 space-y-4 hover:border-gray-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header with Slot & Aspect Ratio */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block">
                          {slot.position}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">
                          {slot.label}
                        </h4>
                        <span className="text-[11px] text-gray-500 font-normal">
                          {slot.sublabel}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-semibold text-gray-600 shrink-0">
                        {slot.aspectText}
                      </span>
                    </div>

                    {/* Image Preview */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-white shadow-xs bg-gray-200 aspect-[16/10] group">
                      <img
                        src={currentImg}
                        alt={slot.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => setVisionGalleryPickerSlot(slot.key)}
                          className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-gray-900 text-[11px] font-bold shadow-md hover:bg-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gallery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetVisionSlot(slot.key)}
                          title="Reset to default portrait"
                          className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Inputs */}
                  <div className="space-y-3 pt-2">
                    {/* Device Upload and Gallery Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        htmlFor={slot.fileInputId}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-black rounded-xl text-[11px] font-bold text-gray-800 hover:text-black transition-all cursor-pointer shadow-2xs text-center"
                      >
                        <Upload className="w-3.5 h-3.5 text-black shrink-0" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          id={slot.fileInputId}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVisionFileUpload(slot.key, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setVisionGalleryPickerSlot(slot.key)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-black rounded-xl text-[11px] font-bold text-gray-800 hover:text-black transition-all cursor-pointer shadow-2xs text-center"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pick Gallery</span>
                      </button>
                    </div>

                    {/* URL / Drive Link Input */}
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                        Image URL or Google Drive Link
                      </label>
                      <input
                        type="text"
                        value={formData[slot.settingKey] || ''}
                        onChange={(e) => handleVisionUrlChange(slot.key, e.target.value)}
                        placeholder="https://... or Google Drive link"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Pick Photo from Gallery for Vision Floating Slot */}
        {visionGalleryPickerSlot && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] p-6 flex flex-col space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Select Photo for {visionSlotConfig.find((c) => c.key === visionGalleryPickerSlot)?.label}
                  </h3>
                  <p className="text-xs text-gray-500 font-normal">
                    Choose any photo from your portfolio gallery to assign to this floating card.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVisionGalleryPickerSlot(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectVisionFromGallery(p)}
                    className="group relative rounded-xl overflow-hidden aspect-square border border-gray-200 hover:border-black transition-all text-left focus:outline-none cursor-pointer"
                  >
                    <img
                      src={p.image}
                      alt={p.caption || 'Wedding photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                      <span className="text-white text-xs font-bold truncate">
                        {p.coupleName || p.caption || 'Select Photo'}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        + Apply to Vision Slot
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setVisionGalleryPickerSlot(null)}
                  className="px-4 py-2 rounded-full border border-gray-200 hover:border-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Studio General Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <h3 className="text-base font-bold text-gray-900 tracking-tight pb-3 border-b border-gray-100">
            General Studio Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Studio Brand Name
              </label>
              <input
                type="text"
                required
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-serif font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Hero Homepage Photograph
              </label>
              <select
                value={formData.heroPhotoId || ''}
                onChange={(e) => setFormData({ ...formData, heroPhotoId: e.target.value || null })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black bg-white"
              >
                <option value="">Auto (Default Hero)</option>
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.coupleName ? `${p.coupleName} (${p.moment})` : p.caption || p.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
              Homepage Hero Tagline
            </label>
            <input
              type="text"
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
              About Narrative &amp; Philosophy
            </label>
            <textarea
              rows={4}
              required
              value={formData.aboutText}
              onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Founder / Lead Artist Name
              </label>
              <input
                type="text"
                required
                value={formData.founderName}
                onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Founder Title / Role
              </label>
              <input
                type="text"
                required
                value={formData.founderTitle}
                onChange={(e) => setFormData({ ...formData, founderTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Contact Email Address
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Instagram Handle
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Locations Line
              </label>
              <input
                type="text"
                value={formData.locationsLine}
                onChange={(e) => setFormData({ ...formData, locationsLine: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
              Google Drive Master Folder Link
            </label>
            <input
              type="url"
              value={formData.driveFolderUrl || ''}
              onChange={(e) => setFormData({ ...formData, driveFolderUrl: e.target.value })}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Used across the studio portal and photo uploader for direct Drive asset access.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Years Experience (Stat)
              </label>
              <input
                type="text"
                value={formData.statsYears}
                onChange={(e) => setFormData({ ...formData, statsYears: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Cities Covered (Stat)
              </label>
              <input
                type="text"
                value={formData.statsCities}
                onChange={(e) => setFormData({ ...formData, statsCities: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Footer Slogan
              </label>
              <input
                type="text"
                value={formData.footerLine}
                onChange={(e) => setFormData({ ...formData, footerLine: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* 100% Free Storage Base & Database Engine (Zero Cloud Billing Forever) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Permanent Local Storage Engine</span>
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] uppercase tracking-wider font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  100% Free Forever · $0.00 / mo
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-normal">
                Your portfolio, high-resolution photography, inquiries, and studio settings are stored locally on your device in high-capacity <strong>IndexedDB</strong>. Firebase and cloud billing are completely disabled ($0 cost).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const backup = {
                    settings: formData,
                    photos,
                    inquiries: StorageService.getInquiries(),
                    packages: StorageService.getPackages(),
                    films: StorageService.getFilms(),
                    testimonials: StorageService.getTestimonials(),
                    faqs: StorageService.getFaqs(),
                    exportedAt: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `unposed-story-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 hover:border-black text-gray-800 text-xs font-bold transition-all cursor-pointer bg-gray-50 hover:bg-white"
                title="Download 100% free complete JSON backup of your entire studio website"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Export Free Backup (JSON)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">
                Billing &amp; Cost Status
              </span>
              <span className="text-xs font-bold text-emerald-700 block">
                $0.00 · Free Forever
              </span>
              <span className="text-[10px] text-gray-500 mt-1 block">
                No credit cards, zero cloud charges
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">
                Active Storage Engine
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-gray-900">
                  {photos.length} Photographs Saved
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">
                IndexedDB High-Capacity Local Cache
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">
                Cloud &amp; Firestore Status
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span className="text-xs font-bold text-gray-700">
                  Disabled (Offline/Local Only)
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">
                100% private on your machine
              </span>
            </div>
          </div>
        </div>

        {/* Supabase Free Tier Cloud Storage Configuration (1 GB Free Forever) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>Supabase Free Tier Cloud Storage</span>
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] uppercase tracking-wider font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  1 GB Free Storage · $0.00 / mo
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-normal">
                Connect your free Supabase project to store and serve high-resolution wedding photography on a high-speed global CDN with 1 GB of free storage forever.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={supabaseTesting || !formData.supabaseUrl || !formData.supabaseAnonKey}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 hover:border-black text-gray-800 text-xs font-bold transition-all cursor-pointer bg-gray-50 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                title="Verify connection to your Supabase project and check public photo storage bucket"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${supabaseTesting ? 'animate-spin' : ''}`} />
                <span>{supabaseTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleMigratePhotosToSupabase}
                disabled={supabaseSyncing || !formData.supabaseUrl || !formData.supabaseAnonKey}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Upload all local/base64 photos to your free Supabase Storage CDN"
              >
                <Zap className={`w-3.5 h-3.5 ${supabaseSyncing ? 'animate-spin' : ''}`} />
                <span>{supabaseSyncing ? 'Uploading...' : 'Upload Photos (1-Click)'}</span>
              </button>
            </div>
          </div>

          {/* Test Result or Sync Message Banner */}
          {supabaseTestResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              supabaseTestResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-start gap-2">
                {supabaseTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{supabaseTestResult.message}</p>
                  {supabaseTestResult.publicUrlSample && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                      Sample CDN URL: {supabaseTestResult.publicUrlSample}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {supabaseSyncMsg && (
            <div className="p-3.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
              <span>{supabaseSyncMsg}</span>
            </div>
          )}

          {/* Configuration Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={formData.supabaseUrl || ''}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                placeholder="https://xyzprojectid.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Supabase Public Anon Key
              </label>
              <input
                type="password"
                value={formData.supabaseAnonKey || ''}
                onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; anon public key.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Storage Bucket Name
              </label>
              <input
                type="text"
                value={formData.supabaseBucket || 'photos'}
                onChange={(e) => setFormData({ ...formData, supabaseBucket: e.target.value })}
                placeholder="photos"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Name of the Public Storage bucket in your Supabase project (default: <span className="font-mono">photos</span>).
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                Auto-Upload to Supabase Free Tier
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.supabaseAutoUpload !== false}
                  onChange={(e) => setFormData({ ...formData, supabaseAutoUpload: e.target.checked })}
                  className="w-4 h-4 rounded text-black focus:ring-black"
                />
                <span className="text-xs font-bold text-gray-800">
                  Automatically upload newly added portfolio photos to Supabase Storage CDN
                </span>
              </label>
            </div>
          </div>

          {/* Quick Setup Guide Step-by-Step */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>How to set up your 100% Free Supabase Photo Storage (in 2 minutes)</span>
            </h4>
            <ol className="text-[11px] text-gray-600 space-y-1 list-decimal list-inside leading-relaxed font-normal">
              <li>Create a free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-bold">supabase.com</a> (Includes 1 GB storage &amp; 50,000 MAU free forever).</li>
              <li>Create a new project and open the <strong>Storage</strong> tab in the sidebar.</li>
              <li>Click <strong>New Bucket</strong>, name it <span className="font-mono font-bold text-black">photos</span>, and toggle <strong>Public bucket</strong> to <span className="font-bold text-emerald-700">ON</span>.</li>
              <li>Go to <strong>Project Settings &gt; API</strong>, copy your <strong>Project URL</strong> and <strong>anon key</strong>, paste them above, and click <strong>Test Connection</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Auto-Reply for Enquiries Automation Engine */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Auto-Reply for Enquiries Automation</span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={formData.autoReplyEnabled !== false}
                    onChange={(e) => setFormData({ ...formData, autoReplyEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                When a prospective couple submits an inquiry, automatically prepare and dispatch a personalized response with pricing guides, calendar check, and WhatsApp quick connect.
              </p>
            </div>

            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${formData.autoReplyEnabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
              {formData.autoReplyEnabled !== false ? '● Auto-Reply ON' : '○ Auto-Reply OFF'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Auto-Reply Email Subject Line
              </label>
              <input
                type="text"
                value={formData.autoReplySubject ?? 'Thank you for reaching out to The Unposed Story ✨'}
                onChange={(e) => setFormData({ ...formData, autoReplySubject: e.target.value })}
                placeholder="e.g. Thank you for reaching out to The Unposed Story"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Salutation Greeting
              </label>
              <input
                type="text"
                value={formData.autoReplyGreeting ?? 'Dear {name}, thank you for considering us to document your celebration.'}
                onChange={(e) => setFormData({ ...formData, autoReplyGreeting: e.target.value })}
                placeholder="Use {name} as placeholder"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Use {'{name}'} to automatically insert client's name.</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
              Auto-Reply Main Message Body
            </label>
            <textarea
              rows={4}
              value={formData.autoReplyMessage ?? 'We have received your celebration details and date preferences. Sandeep and our senior creative team are currently reviewing our availability calendar and will be in touch with you shortly with our tailored investment packages and portfolio recommendations.'}
              onChange={(e) => setFormData({ ...formData, autoReplyMessage: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Brochure &amp; Pricing PDF Link (Optional)
              </label>
              <input
                type="url"
                value={formData.autoReplyBrochureUrl ?? ''}
                onChange={(e) => setFormData({ ...formData, autoReplyBrochureUrl: e.target.value })}
                placeholder="https://drive.google.com/... or link to pricing guide"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Included in the auto-reply email for clients to review your work instantly.</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Estimated Response Time Promise
              </label>
              <input
                type="text"
                value={formData.autoReplyEstimatedTime ?? 'Within 4–12 hours'}
                onChange={(e) => setFormData({ ...formData, autoReplyEstimatedTime: e.target.value })}
                placeholder="e.g. Within 4–12 hours"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
              />
            </div>
          </div>

          {/* Live Auto-Reply Preview Card */}
          <div className="p-5 rounded-2xl bg-neutral-900 text-neutral-100 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Client Auto-Reply Email Preview</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">Auto-generated upon form submission</span>
            </div>

            <div className="bg-black/60 rounded-xl p-4 border border-neutral-800 space-y-2 text-xs">
              <div className="text-neutral-400 text-[11px]">
                <strong className="text-neutral-200">Subject:</strong> {formData.autoReplySubject || 'Thank you for reaching out to The Unposed Story ✨'}
              </div>
              <div className="text-neutral-400 text-[11px]">
                <strong className="text-neutral-200">From:</strong> {formData.siteName} &lt;{formData.contactEmail}&gt;
              </div>
              <hr className="border-neutral-800 my-2" />
              <p className="font-semibold text-neutral-200">
                {(formData.autoReplyGreeting || 'Dear {name}, thank you for considering us.').replace('{name}', 'Ananya & Rohan')}
              </p>
              <p className="text-neutral-300 leading-relaxed">
                {formData.autoReplyMessage || 'We have received your celebration details and date preferences. We will be in touch shortly.'}
              </p>
              {formData.autoReplyBrochureUrl && (
                <p className="text-emerald-400 pt-1">
                  📄 <strong>Studio Brochure &amp; Investment Guide:</strong>{' '}
                  <span className="underline break-all">{formData.autoReplyBrochureUrl}</span>
                </p>
              )}
              <div className="pt-2 text-[11px] text-neutral-400 border-t border-neutral-800">
                <span>Warmest regards,</span><br />
                <strong className="text-neutral-200">{formData.founderName || 'Sandeep'} &amp; The Team</strong> — <em>{formData.siteName}</em><br />
                <span>📞 {formData.contactPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Watermark & Intellectual Property Protection Studio */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Photo Watermark &amp; IP Protection Studio</span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={formData.watermarkEnabled !== false}
                    onChange={(e) =>
                      setFormData({ ...formData, watermarkEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Safeguard high-resolution wedding photography across your portfolio, gallery, and fullscreen lightbox views with bespoke logo emblems, photographer signatures, and anti-theft controls.
              </p>
            </div>

            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 ${
                formData.watermarkEnabled !== false
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {formData.watermarkEnabled !== false ? '● Watermark Active' : '○ Watermark Disabled'}
            </span>
          </div>

          {/* Watermark Configuration Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Options Form (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Watermark Text Input */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                  Watermark Signature / Studio Text
                </label>
                <input
                  type="text"
                  value={formData.watermarkText ?? 'THE UNPOSED STORY · PHOTOGRAPHY BY SANDIP LADE'}
                  onChange={(e) => setFormData({ ...formData, watermarkText: e.target.value })}
                  placeholder="e.g. THE UNPOSED STORY · SANDIP LADE"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-medium"
                />
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-bold">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        watermarkText: 'THE UNPOSED STORY · PHOTOGRAPHY BY SANDIP LADE',
                      })
                    }
                    className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer"
                  >
                    Full Signature
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        watermarkText: '© THE UNPOSED STORY',
                      })
                    }
                    className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer"
                  >
                    Copyright Short
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        watermarkText: 'THE UNPOSED STORY · CINEMATIC WEDDINGS',
                      })
                    }
                    className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer"
                  >
                    Cinematic Edition
                  </button>
                </div>
              </div>

              {/* Watermark Type & Aesthetic Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                    Watermark Format
                  </label>
                  <select
                    value={formData.watermarkType || 'both'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        watermarkType: e.target.value as 'both' | 'text' | 'logo',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="both">Both (Studio Emblem + Text)</option>
                    <option value="text">Text Signature Only</option>
                    <option value="logo">Studio Emblem Logo Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                    Visual Design Style
                  </label>
                  <select
                    value={formData.watermarkStyle || 'subtle-badge'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        watermarkStyle: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="subtle-badge">Subtle Glass Badge (Dark Glass)</option>
                    <option value="minimal-clean">Minimal Clean (Drop-Shadow Etched)</option>
                    <option value="embossed-stamp">Luxury Seal / Embossed Stamp</option>
                    <option value="cinematic-tag">Cinematic Tag (Camera Corner Monogram)</option>
                  </select>
                </div>
              </div>

              {/* Position Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                  Watermark Placement on Photographs
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'bottom-right', label: 'Bottom Right (Default)' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'center', label: 'Center (Hero Focus)' },
                    { id: 'diagonal-repeat', label: 'Diagonal Tiled Pattern' },
                  ].map((pos) => {
                    const isSelected = (formData.watermarkPosition || 'bottom-right') === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            watermarkPosition: pos.id as any,
                          })
                        }
                        className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-all text-left cursor-pointer border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opacity Slider & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                      Watermark Opacity
                    </label>
                    <span className="text-xs font-bold text-gray-900 font-mono">
                      {formData.watermarkOpacity ?? 65}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={formData.watermarkOpacity ?? 65}
                    onChange={(e) =>
                      setFormData({ ...formData, watermarkOpacity: Number(e.target.value) })
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>15% Subtle</span>
                    <span>65% Balanced</span>
                    <span>100% Bold</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">
                    Watermark Size Scale
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sm', label: 'Small' },
                      { id: 'md', label: 'Medium' },
                      { id: 'lg', label: 'Large' },
                    ].map((s) => {
                      const isSelected = (formData.watermarkSize || 'sm') === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, watermarkSize: s.id as any })}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border text-center ${
                            isSelected
                              ? 'bg-black text-white border-black shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* View Visibility Toggles */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">
                  Active Display Locations &amp; IP Protection
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.watermarkShowInGallery !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, watermarkShowInGallery: e.target.checked })
                      }
                      className="rounded text-black focus:ring-black accent-black w-4 h-4"
                    />
                    <span className="font-medium text-gray-800">Portfolio Gallery Masonry</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.watermarkShowInLightbox !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, watermarkShowInLightbox: e.target.checked })
                      }
                      className="rounded text-black focus:ring-black accent-black w-4 h-4"
                    />
                    <span className="font-medium text-gray-800">Fullscreen High-Res Lightbox</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.watermarkShowInFeatured !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, watermarkShowInFeatured: e.target.checked })
                      }
                      className="rounded text-black focus:ring-black accent-black w-4 h-4"
                    />
                    <span className="font-medium text-gray-800">Featured Grid &amp; Showcase</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preventImageStealing !== false}
                      onChange={(e) =>
                        setFormData({ ...formData, preventImageStealing: e.target.checked })
                      }
                      className="rounded text-black focus:ring-black accent-black w-4 h-4"
                    />
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Block Right-Click &amp; Drag Save</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Watermark Preview (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-time Watermark Preview</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Live Stage</span>
              </div>

              {/* Sample Photo Container with Live Watermark */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 border border-gray-200 shadow-md group">
                <img
                  src={
                    photos[0]?.image ||
                    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop'
                  }
                  alt="Watermark Sample"
                  className="w-full h-full object-cover"
                />

                {/* Dark Vignette to test contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Live Watermark Overlay Component */}
                <WatermarkOverlay
                  settings={formData}
                  overrideText={formData.watermarkText}
                  overridePosition={formData.watermarkPosition}
                  overrideOpacity={formData.watermarkOpacity}
                  overrideStyle={formData.watermarkStyle}
                  overrideType={formData.watermarkType}
                  overrideSize={formData.watermarkSize}
                  enabled={formData.watermarkEnabled !== false}
                />
              </div>

              {/* Download Sample Button */}
              <button
                type="button"
                onClick={() => {
                  const sampleImg =
                    photos[0]?.image ||
                    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop';
                  downloadWatermarkedPhoto(sampleImg, 'watermark-sample.jpg', {
                    text: formData.watermarkText,
                    position: formData.watermarkPosition,
                    opacity: formData.watermarkOpacity,
                    style: formData.watermarkStyle,
                    type: formData.watermarkType,
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-gray-800 text-xs font-bold transition-all border border-gray-200 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Test Download Sample with Watermark</span>
              </button>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-[11px] uppercase tracking-wider text-emerald-800">
                    Studio IP Protection Active
                  </strong>
                  <p className="text-[11px] text-emerald-700 leading-snug mt-0.5">
                    Couples and visitors viewing your portfolio will see this watermark overlay rendered over every wedding photo, protecting your creative copyrights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-8 shadow-2xs">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Website Section Headings &amp; Page Descriptions</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-normal">
              Customize any title, badge, or narrative paragraph across all sections of your website in real-time.
            </p>
          </div>

          {/* Group A: Hero & Story Quote Strip */}
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span>1. Homepage Hero &amp; Story Strip</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Hero Top Pill Badge
                </label>
                <input
                  type="text"
                  value={formData.heroBadge ?? 'Wedding Photography & Cinematic Films'}
                  onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Hero Headline / Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value, heroHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                Hero Narrative Subtext
              </label>
              <textarea
                rows={2}
                value={formData.heroSubtext ?? 'Candid wedding photography & cinematic films that capture the real emotion of your story.'}
                onChange={(e) => setFormData({ ...formData, heroSubtext: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Story Strip Quote Statement
                </label>
                <input
                  type="text"
                  value={formData.statsQuoteText ?? 'Every photo should tell a story, blending art and emotion to capture unique moments.'}
                  onChange={(e) => setFormData({ ...formData, statsQuoteText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Story Strip Signature / Author
                </label>
                <input
                  type="text"
                  value={formData.statsQuoteAuthor ?? `Photography by ${formData.founderName || 'Sandip'}`}
                  onChange={(e) => setFormData({ ...formData, statsQuoteAuthor: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Group B: Highlights, Gallery & Real Weddings */}
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span>2. Portfolio Galleries &amp; Real Weddings</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Curated Highlights Badge
                </label>
                <input
                  type="text"
                  value={formData.featuredBadge ?? 'Curated Highlights'}
                  onChange={(e) => setFormData({ ...formData, featuredBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Highlights Title
                </label>
                <input
                  type="text"
                  value={formData.featuredHeadline ?? 'Moments that linger.'}
                  onChange={(e) => setFormData({ ...formData, featuredHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Highlights Subtitle
                </label>
                <input
                  type="text"
                  value={formData.featuredSubtext ?? 'Hand-picked frames reflecting genuine connection, unchoreographed emotions, and timeless intimacy.'}
                  onChange={(e) => setFormData({ ...formData, featuredSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Full Gallery Badge
                </label>
                <input
                  type="text"
                  value={formData.galleryBadge ?? 'Full Portfolio'}
                  onChange={(e) => setFormData({ ...formData, galleryBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Full Gallery Title
                </label>
                <input
                  type="text"
                  value={formData.galleryHeadline ?? 'Every day, in its own light.'}
                  onChange={(e) => setFormData({ ...formData, galleryHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Full Gallery Subtitle
                </label>
                <input
                  type="text"
                  value={formData.gallerySubtext ?? 'Filter through ceremonies, traditions, and emotions to experience the full tapestry of real wedding celebrations.'}
                  onChange={(e) => setFormData({ ...formData, gallerySubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Real Weddings Badge
                </label>
                <input
                  type="text"
                  value={formData.storiesBadge ?? 'Real Weddings'}
                  onChange={(e) => setFormData({ ...formData, storiesBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Real Weddings Title
                </label>
                <input
                  type="text"
                  value={formData.storiesHeadline ?? 'Recent celebrations.'}
                  onChange={(e) => setFormData({ ...formData, storiesHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Real Weddings Subtitle
                </label>
                <input
                  type="text"
                  value={formData.storiesSubtext ?? 'Take a deeper dive into the cohesive visual journals of couples who trusted us with their once-in-a-lifetime stories.'}
                  onChange={(e) => setFormData({ ...formData, storiesSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Group C: Films, Floating Showcase & Packages */}
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span>3. Films, Floating Showcase &amp; Packages</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Films Badge
                </label>
                <input
                  type="text"
                  value={formData.filmsBadge ?? 'Cinematography & Reels'}
                  onChange={(e) => setFormData({ ...formData, filmsBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Films Title
                </label>
                <input
                  type="text"
                  value={formData.filmsHeadline ?? 'Wedding films in motion.'}
                  onChange={(e) => setFormData({ ...formData, filmsHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Films Subtitle
                </label>
                <input
                  type="text"
                  value={formData.filmsSubtext ?? 'Heart-stirring cinematic storytelling, royal teaser films, and viral Instagram wedding reels crafted with pristine grading and heartfelt vows.'}
                  onChange={(e) => setFormData({ ...formData, filmsSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Floating Showcase Badge
                </label>
                <input
                  type="text"
                  value={formData.floatingBadge ?? 'The Signature Aesthetic'}
                  onChange={(e) => setFormData({ ...formData, floatingBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Floating Showcase Title
                </label>
                <input
                  type="text"
                  value={formData.floatingHeadline ?? 'Moments suspended in time.'}
                  onChange={(e) => setFormData({ ...formData, floatingHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Floating Showcase Subtitle
                </label>
                <input
                  type="text"
                  value={formData.floatingSubtext ?? 'Every celebration is treated as an editorial work of art. Hover to explore the floating gallery or browse our bespoke packages below.'}
                  onChange={(e) => setFormData({ ...formData, floatingSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Packages Badge
                </label>
                <input
                  type="text"
                  value={formData.packagesBadge ?? 'Investment & Offerings'}
                  onChange={(e) => setFormData({ ...formData, packagesBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Packages Title
                </label>
                <input
                  type="text"
                  value={formData.packagesHeadline ?? 'Designed for timeless legacy.'}
                  onChange={(e) => setFormData({ ...formData, packagesHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Packages Subtitle
                </label>
                <input
                  type="text"
                  value={formData.packagesSubtext ?? 'Transparent collections tailored for intimate gatherings, traditional ceremonies, and grand destination celebrations.'}
                  onChange={(e) => setFormData({ ...formData, packagesSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Group D: Vision, About & Gear Showcase */}
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span>4. Vision Banner, Founder &amp; Gear Showcase</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Vision Badge
                </label>
                <input
                  type="text"
                  value={formData.visionBadge ?? 'Subscribe'}
                  onChange={(e) => setFormData({ ...formData, visionBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Vision Headline
                </label>
                <input
                  type="text"
                  value={formData.visionHeadline ?? 'Turning Visions Into Art'}
                  onChange={(e) => setFormData({ ...formData, visionHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Vision Description
                </label>
                <input
                  type="text"
                  value={formData.visionSubtext ?? 'Every wedding is a story waiting to be told. Book us to see real moments, behind the scenes, and exclusive shoot previews.'}
                  onChange={(e) => setFormData({ ...formData, visionSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Founder Status Badge
                </label>
                <input
                  type="text"
                  value={formData.founderBadge ?? 'Available For Hire'}
                  onChange={(e) => setFormData({ ...formData, founderBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Founder Greeting Title
                </label>
                <input
                  type="text"
                  value={formData.founderGreeting ?? `Hey Im ${formData.founderName || 'Sandip Lade'} !`}
                  onChange={(e) => setFormData({ ...formData, founderGreeting: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Gear Badge Label
                </label>
                <input
                  type="text"
                  value={formData.gearBadge ?? 'Gear and tools I use'}
                  onChange={(e) => setFormData({ ...formData, gearBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            {/* 3 Gear Tools Customizer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-700 block">Gear Item 1 (Camera Body)</span>
                <input
                  type="text"
                  placeholder="e.g. Canon R6 II"
                  value={formData.gear1Title ?? 'Canon R6 II'}
                  onChange={(e) => setFormData({ ...formData, gear1Title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white font-semibold"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.gear1Desc ?? 'Fast, precise, and built for any moment.'}
                  onChange={(e) => setFormData({ ...formData, gear1Desc: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-700 block">Gear Item 2 (Prime Lens 1)</span>
                <input
                  type="text"
                  placeholder="e.g. 35mm f/1.4"
                  value={formData.gear2Title ?? '35mm f/1.4'}
                  onChange={(e) => setFormData({ ...formData, gear2Title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white font-semibold"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.gear2Desc ?? 'Stunning portraits with rich depth and smooth blur.'}
                  onChange={(e) => setFormData({ ...formData, gear2Desc: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-700 block">Gear Item 3 (Prime Lens 2)</span>
                <input
                  type="text"
                  placeholder="e.g. 85mm f/1.4"
                  value={formData.gear3Title ?? '85mm f/1.4'}
                  onChange={(e) => setFormData({ ...formData, gear3Title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white font-semibold"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formData.gear3Desc ?? 'Rock-steady for long shots and creative frames.'}
                  onChange={(e) => setFormData({ ...formData, gear3Desc: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                />
              </div>
            </div>
          </div>

          {/* Group E: Testimonials, FAQs & Contact Inquiries */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span>5. Kind Words, FAQ &amp; Contact Inquiries</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Testimonials Badge
                </label>
                <input
                  type="text"
                  value={formData.testimonialsBadge ?? 'Kind Words'}
                  onChange={(e) => setFormData({ ...formData, testimonialsBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Testimonials Title
                </label>
                <input
                  type="text"
                  value={formData.testimonialsHeadline ?? 'From couples we’ve walked with.'}
                  onChange={(e) => setFormData({ ...formData, testimonialsHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Testimonials Subtitle
                </label>
                <input
                  type="text"
                  value={formData.testimonialsSubtext ?? 'Read candid reflections from couples whose cherished days we documented.'}
                  onChange={(e) => setFormData({ ...formData, testimonialsSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  FAQ Badge
                </label>
                <input
                  type="text"
                  value={formData.faqsBadge ?? 'Good to Know'}
                  onChange={(e) => setFormData({ ...formData, faqsBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  FAQ Title
                </label>
                <input
                  type="text"
                  value={formData.faqsHeadline ?? 'Frequently Asked Questions'}
                  onChange={(e) => setFormData({ ...formData, faqsHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  FAQ Subtitle / Helper
                </label>
                <input
                  type="text"
                  value={formData.faqsSubtext ?? 'Everything you need to know about our approach, travel, delivery timelines, and booking process.'}
                  onChange={(e) => setFormData({ ...formData, faqsSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Contact Badge
                </label>
                <input
                  type="text"
                  value={formData.contactBadge ?? 'Get in Touch'}
                  onChange={(e) => setFormData({ ...formData, contactBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Contact Title
                </label>
                <input
                  type="text"
                  value={formData.contactHeadline ?? 'Let’s tell your story.'}
                  onChange={(e) => setFormData({ ...formData, contactHeadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Contact Subtitle
                </label>
                <input
                  type="text"
                  value={formData.contactSubtext ?? 'Every celebration is distinct. Share your wedding dates, vision, and destinations with us so we can document your story seamlessly.'}
                  onChange={(e) => setFormData({ ...formData, contactSubtext: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            id="save-settings-submit-btn"
            className="px-8 py-3.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Settings &amp; Logo Saved Successfully!</span>
              </>
            ) : (
              <span>Save Studio Settings &amp; Logo</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
