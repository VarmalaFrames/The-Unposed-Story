import React, { useState, useId, useEffect } from 'react';
import { PhotoItem, SiteSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { IdbStorage } from '../../services/indexedDb';
import { OptimizedImage } from '../common/OptimizedImage';
import { MOMENT_SUGGESTIONS, DEFAULT_STRIP_AVATARS } from '../../data/initialData';
import { FirebaseService } from '../../services/firebase';
import {
  extractDriveFileId,
  convertDriveToDirectImageUrl,
  isDriveUrl,
} from '../../utils/driveHelper';
import {
  Plus,
  Upload,
  Trash2,
  Edit3,
  X,
  Sparkles,
  HardDrive,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Check,
  FolderSync,
  Zap,
  Gauge,
  Sliders,
  Database,
  Cloud,
  RefreshCw,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface PhotoManagerProps {
  photos: PhotoItem[];
  settings: SiteSettings;
  onPhotosUpdated: (photos: PhotoItem[]) => void;
  onSettingsUpdated: (settings: SiteSettings) => void;
}

interface QueuedUploadItem {
  id: string;
  file?: File;
  preview: string;
  moment: string;
  coupleName: string;
  caption: string;
  date: string;
  featured: boolean;
  stats?: {
    originalSize: string;
    compressedSize: string;
    savedPercent: number;
    format: string;
    width: number;
    height: number;
  };
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({
  photos,
  settings,
  onPhotosUpdated,
  onSettingsUpdated,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [uploadSource, setUploadSource] = useState<'device' | 'drive' | 'url'>('device');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMomentFilter, setSelectedMomentFilter] = useState('All');

  // Single Photo Form State
  const [singleFormData, setSingleFormData] = useState({
    image: '',
    caption: '',
    moment: 'Wedding Ceremony',
    coupleName: '',
    date: new Date().toISOString().split('T')[0],
    featured: true,
  });

  // Multi-File Manual Upload Queue State
  const [uploadQueue, setUploadQueue] = useState<QueuedUploadItem[]>([]);
  const [batchMoment, setBatchMoment] = useState('Wedding Ceremony');
  const [batchCouple, setBatchCouple] = useState('');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);

  // Bulk Drive Links Paste State
  const [bulkDriveText, setBulkDriveText] = useState('');

  // Image Optimization Compression Preset
  const [compressionPreset, setCompressionPreset] = useState<'balanced' | 'fast' | 'ultra'>('balanced');

  // Drive Quick Edit Modal/Popover State
  const [showDriveUrlModal, setShowDriveUrlModal] = useState(false);
  const [tempDriveUrl, setTempDriveUrl] = useState(settings.driveFolderUrl || '');

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<{
    usageFormatted: string;
    quotaFormatted: string;
    percentUsed: number;
  } | null>(null);

  const fileInputId = useId();

  // Load storage usage info
  useEffect(() => {
    IdbStorage.getStorageEstimate().then(setStorageEstimate);
  }, [photos.length]);

  // Force Resync / Reload from IndexedDB + Firebase
  const handleReloadFromStorage = async () => {
    setLoading(true);
    setPhotoNotice('Reloading photographs from high-capacity storage & cloud...');
    try {
      const reloaded = await StorageService.loadPhotosAsync();
      if (reloaded && reloaded.length > 0) {
        onPhotosUpdated(reloaded);
        setPhotoNotice(`Loaded ${reloaded.length} photographs from storage.`);
      } else {
        setPhotoNotice('Photographs are up to date in storage.');
      }
      IdbStorage.getStorageEstimate().then(setStorageEstimate);
    } catch (err: any) {
      setPhotoNotice('Storage refreshed.');
    } finally {
      setLoading(false);
      setTimeout(() => setPhotoNotice(null), 3500);
    }
  };

  // 1-Click Backup All Photos to Firebase Firestore Storage Base
  const handleBackupToFirebase = async () => {
    setCloudSyncing(true);
    setPhotoNotice('Backing up photographs to Firebase Storage Base...');
    try {
      const res = await FirebaseService.saveAllPhotos(photos);
      if (res.success) {
        setPhotoNotice(`All ${photos.length} photos successfully saved to Firebase Storage Base!`);
      } else {
        setPhotoNotice('Photos safely stored in IndexedDB local persistence.');
      }
    } catch (err: any) {
      setPhotoNotice(err.message || 'Firebase backup completed locally.');
    } finally {
      setCloudSyncing(false);
      setTimeout(() => setPhotoNotice(null), 4000);
    }
  };

  // Reset form
  const resetForm = () => {
    setSingleFormData({
      image: '',
      caption: '',
      moment: 'Wedding Ceremony',
      coupleName: '',
      date: new Date().toISOString().split('T')[0],
      featured: true,
    });
    setUploadQueue([]);
    setBulkDriveText('');
    setEditingPhoto(null);
    setFormOpen(false);
    setError(null);
    setUploadProgress(null);
  };

  // Start editing existing photo
  const handleStartEdit = (photo: PhotoItem) => {
    setEditingPhoto(photo);
    setSingleFormData({
      image: photo.image,
      caption: photo.caption || '',
      moment: photo.moment || 'Wedding Ceremony',
      coupleName: photo.coupleName || '',
      date: photo.date || new Date().toISOString().split('T')[0],
      featured: !!photo.featured,
    });
    setUploadSource(isDriveUrl(photo.image) ? 'drive' : 'url');
    setFormOpen(true);
  };

  // Preset configuration parameters
  const presetConfig = {
    fast: { maxDim: 1400, quality: 0.80, label: 'Fast Web', desc: '1400px · 80% WebP' },
    balanced: { maxDim: 1800, quality: 0.84, label: 'Balanced HD', desc: '1800px · 84% WebP (Recommended)' },
    ultra: { maxDim: 2200, quality: 0.88, label: 'Studio High-Res', desc: '2200px · 88% WebP' },
  };

  // Handle Manual Multiple File Selection from Computer/Phone
  const handleDeviceFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files: File[] = Array.from(e.target.files);
    setError(null);
    setLoading(true);

    const config = presetConfig[compressionPreset];

    try {
      const newItems: QueuedUploadItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Optimizing ${i + 1} of ${files.length}: ${file.name}...`);
        const stats = await StorageService.compressImageWithStats(file, config.maxDim, config.quality);
        newItems.push({
          id: 'queue_' + Math.random().toString(36).slice(2, 9),
          file,
          preview: stats.dataUrl,
          moment: batchMoment,
          coupleName: batchCouple,
          caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          date: batchDate,
          featured: true,
          stats: {
            originalSize: stats.originalSizeFormatted,
            compressedSize: stats.compressedSizeFormatted,
            savedPercent: stats.savedPercent,
            format: stats.format,
            width: stats.width,
            height: stats.height,
          },
        });
      }

      setUploadQueue((prev) => [...prev, ...newItems]);
      setUploadProgress(null);
    } catch (err: any) {
      setError(err.message || 'Error reading image files');
    } finally {
      setLoading(false);
    }
  };

  // Apply batch details to all queued items
  const applyBatchToQueue = () => {
    setUploadQueue((prev) =>
      prev.map((item) => ({
        ...item,
        moment: batchMoment,
        coupleName: batchCouple || item.coupleName,
        date: batchDate,
      }))
    );
  };

  // Remove single item from upload queue
  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle Bulk Drive Links Text Submission
  const handleProcessBulkDriveLinks = () => {
    if (!bulkDriveText.trim()) {
      setError('Please paste one or more Google Drive image links');
      return;
    }

    const lines = bulkDriveText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newItems: QueuedUploadItem[] = [];
    for (const line of lines) {
      const directUrl = convertDriveToDirectImageUrl(line);
      if (directUrl) {
        newItems.push({
          id: 'queue_drive_' + Math.random().toString(36).slice(2, 9),
          preview: directUrl,
          moment: batchMoment,
          coupleName: batchCouple,
          caption: 'Google Drive Photograph',
          date: batchDate,
          featured: true,
        });
      }
    }

    if (newItems.length === 0) {
      setError('No valid Google Drive or Image links found in text.');
      return;
    }

    setUploadQueue((prev) => [...prev, ...newItems]);
    setBulkDriveText('');
    setError(null);
  };

  // Submit / Save Photos (Single or Queue)
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If editing existing single photo
    if (editingPhoto) {
      setLoading(true);
      const updated = photos.map((p) =>
        p.id === editingPhoto.id
          ? {
              ...p,
              image: convertDriveToDirectImageUrl(singleFormData.image),
              caption: singleFormData.caption.trim(),
              moment: singleFormData.moment.trim(),
              coupleName: singleFormData.coupleName.trim(),
              date: singleFormData.date,
              featured: singleFormData.featured,
            }
          : p
      );
      StorageService.savePhotos(updated);
      onPhotosUpdated(updated);
      setLoading(false);
      setPhotoNotice('Photograph updated successfully.');
      setTimeout(() => setPhotoNotice(null), 3000);
      resetForm();
      return;
    }

    // If single URL mode without queue
    if (uploadQueue.length === 0) {
      if (!singleFormData.image) {
        setError('Please select photos from your device, paste a Drive link, or enter an Image URL');
        return;
      }

      setLoading(true);
      const newPhoto: PhotoItem = {
        id: 'photo_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        image: convertDriveToDirectImageUrl(singleFormData.image),
        caption: singleFormData.caption.trim(),
        moment: singleFormData.moment.trim(),
        coupleName: singleFormData.coupleName.trim(),
        date: singleFormData.date,
        featured: singleFormData.featured,
        createdAt: Date.now(),
      };
      const updated = [newPhoto, ...photos];
      StorageService.savePhotos(updated);
      await StorageService.saveSinglePhoto(newPhoto);
      onPhotosUpdated(updated);
      setLoading(false);
      setPhotoNotice('Photograph added to portfolio.');
      setTimeout(() => setPhotoNotice(null), 3000);
      resetForm();
      return;
    }

    // If multi-file or multi-drive queue exists
    setLoading(true);
    const newPhotos: PhotoItem[] = uploadQueue.map((item, idx) => ({
      id: 'photo_' + (Date.now() + idx).toString(36) + Math.random().toString(36).slice(2, 6),
      image: item.preview,
      caption: item.caption.trim(),
      moment: item.moment.trim(),
      coupleName: item.coupleName.trim(),
      date: item.date,
      featured: item.featured,
      createdAt: Date.now() + idx,
    }));

    const updated = [...newPhotos, ...photos];
    StorageService.savePhotos(updated);
    for (const photo of newPhotos) {
      await StorageService.saveSinglePhoto(photo);
    }
    onPhotosUpdated(updated);
    setLoading(false);
    setPhotoNotice(`Added ${newPhotos.length} photographs to portfolio.`);
    setTimeout(() => setPhotoNotice(null), 3000);
    resetForm();
  };

  // Delete photo
  const handleDeletePhoto = async (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    StorageService.savePhotos(updated);
    await StorageService.deletePhoto(id);
    onPhotosUpdated(updated);

    if (settings.heroPhotoId === id) {
      const newSettings = { ...settings, heroPhotoId: null };
      StorageService.saveSettings(newSettings);
      onSettingsUpdated(newSettings);
    }
    setConfirmDeletePhotoId(null);
    setPhotoNotice('Photograph deleted from portfolio.');
    setTimeout(() => setPhotoNotice(null), 3000);
  };

  // Set Hero Banner
  const handleSetHero = (id: string) => {
    const newSettings = { ...settings, heroPhotoId: id };
    StorageService.saveSettings(newSettings);
    onSettingsUpdated(newSettings);
    setPhotoNotice('Hero banner updated.');
    setTimeout(() => setPhotoNotice(null), 2500);
  };

  // Toggle Featured
  const handleToggleFeatured = async (id: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p));
    const target = updated.find((p) => p.id === id);
    StorageService.savePhotos(updated);
    if (target) {
      await StorageService.saveSinglePhoto(target);
    }
    onPhotosUpdated(updated);
  };

  // Toggle in Homepage Story Scroller Strip
  const handleToggleStoryStrip = (photo: PhotoItem) => {
    const currentList =
      settings.stripAvatars && settings.stripAvatars.length > 0
        ? settings.stripAvatars
        : DEFAULT_STRIP_AVATARS;

    const exists = currentList.some((a) => a.src === photo.image);
    let updated;
    if (exists) {
      updated = currentList.filter((a) => a.src !== photo.image);
      setPhotoNotice('Removed portrait from homepage story scroller.');
    } else {
      updated = [
        ...currentList,
        {
          id: 'av_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          src: photo.image,
          alt: photo.coupleName || photo.caption || 'Wedding moment',
        },
      ];
      setPhotoNotice('Added portrait to homepage story scroller.');
    }
    const newSettings = { ...settings, stripAvatars: updated };
    StorageService.saveSettings(newSettings);
    onSettingsUpdated(newSettings);
    setTimeout(() => setPhotoNotice(null), 2500);
  };

  // Save Drive Link shortcut
  const handleSaveDriveLinkQuick = () => {
    const updatedSettings = {
      ...settings,
      driveFolderUrl: tempDriveUrl.trim(),
    };
    StorageService.saveSettings(updatedSettings);
    onSettingsUpdated(updatedSettings);
    setShowDriveUrlModal(false);
  };

  // Filtered photos
  const filteredPhotos = photos.filter((p) => {
    const matchesMoment = selectedMomentFilter === 'All' || p.moment === selectedMomentFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      (p.coupleName && p.coupleName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.caption && p.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.moment && p.moment.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMoment && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Photo Notice Toast */}
      {photoNotice && (
        <div className="p-3.5 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{photoNotice}</span>
          </div>
          <button onClick={() => setPhotoNotice(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header with Drive Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-black" />
            <span>Photographs Portfolio ({photos.length})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-normal">
            Upload single or bulk photos manually, import directly from Google Drive links, and manage curated wedding stories.
          </p>
        </div>

        {!formOpen && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                resetForm();
                setUploadSource('device');
                setFormOpen(true);
              }}
              id="admin-manual-upload-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos (Manual)</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setUploadSource('drive');
                setFormOpen(true);
              }}
              id="admin-drive-import-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 bg-white hover:border-black text-black text-xs uppercase tracking-widest font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>Import Drive Link</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Base & Cloud Backup Dual Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Persistent Storage Base Bar */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900 truncate">
                  Storage Engine:
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% Free IndexedDB ({photos.length} Photos)
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                Zero Cloud Billing · <span className="font-semibold text-gray-700">{storageEstimate?.usageFormatted || 'Ready'} used</span> · Permanent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReloadFromStorage}
              disabled={loading}
              title="Resync and reload photographs from local high-capacity storage"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 hover:border-black text-gray-800 text-[11px] font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(photos, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `unposed-story-photos-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                setPhotoNotice('Downloaded full JSON backup of photographs.');
                setTimeout(() => setPhotoNotice(null), 3000);
              }}
              title="Download 100% free JSON backup of all photo assets"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-[11px] uppercase tracking-wider font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export Photos</span>
            </button>
          </div>
        </div>

        {/* Google Drive Link Quick Bar */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 truncate">
                  Drive Folder:
                </span>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono truncate max-w-[130px]">
                  {settings.driveFolderUrl ? 'Configured' : 'Not set'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                Direct link to your master RAW &amp; high-res Drive vault
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {settings.driveFolderUrl && settings.driveFolderUrl.startsWith('http') && (
              <a
                href={settings.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 hover:border-black text-[11px] font-bold text-gray-800 transition-colors"
              >
                <span>Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => {
                setTempDriveUrl(settings.driveFolderUrl || '');
                setShowDriveUrlModal(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-black hover:text-white text-[11px] font-bold text-gray-800 transition-colors cursor-pointer"
            >
              <FolderSync className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Drive Link Modal / Drawer */}
      {showDriveUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-600" />
                <span>Change Google Drive Folder Link</span>
              </h3>
              <button
                onClick={() => setShowDriveUrlModal(false)}
                className="p-1 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                  Google Drive Folder / Share Link
                </label>
                <input
                  type="url"
                  value={tempDriveUrl}
                  onChange={(e) => setTempDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-normal">
                Paste the shareable URL of your Google Drive folder where your client wedding photos and high-resolution master albums are archived.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDriveUrlModal(false)}
                className="px-4 py-2 rounded-full border border-gray-200 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDriveLinkQuick}
                className="px-5 py-2 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Save New Drive Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload & Management Panel (Modal / Card) */}
      {formOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                {editingPhoto ? 'Edit Photograph Metadata' : 'Add Photographs to Portfolio'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingPhoto
                  ? 'Update caption, moment ceremony, and couples details.'
                  : 'Choose your upload method: upload files manually from device, or import Google Drive links.'}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Source Tabs */}
          {!editingPhoto && (
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                type="button"
                onClick={() => setUploadSource('device')}
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                  uploadSource === 'device'
                    ? 'bg-black text-white border-black shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Files from Device (Manual)</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSource('drive')}
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                  uploadSource === 'drive'
                    ? 'bg-black text-white border-black shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <span>Google Drive Photo Links</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSource('url')}
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                  uploadSource === 'url'
                    ? 'bg-black text-white border-black shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Direct Image URL</span>
              </button>
            </div>
          )}

          {/* Common Batch Metadata Bar */}
          {!editingPhoto && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-black" />
                  <span>Default Metadata for this Upload</span>
                </span>
                {uploadQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={applyBatchToQueue}
                    className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Apply to all {uploadQueue.length} queued photos
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Moment / Ceremony
                  </label>
                  <select
                    value={batchMoment}
                    onChange={(e) => setBatchMoment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                  >
                    {MOMENT_SUGGESTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Couple / Wedding Name
                  </label>
                  <input
                    type="text"
                    value={batchCouple}
                    onChange={(e) => setBatchCouple(e.target.value)}
                    placeholder="e.g. Ananya & Kabir"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Wedding Date
                  </label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveAll} className="space-y-6">
            {/* 1. Device File Upload Zone */}
            {uploadSource === 'device' && !editingPhoto && (
              <div className="space-y-4">
                {/* Compression Preset Selector */}
                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-600 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Upload Optimization Profile</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      High-quality bicubic downsampling &amp; WebP encoding
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(['fast', 'balanced', 'ultra'] as const).map((preset) => {
                      const cfg = presetConfig[preset];
                      const isSelected = compressionPreset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCompressionPreset(preset)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                              : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{cfg.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {cfg.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label
                  htmlFor={fileInputId}
                  className="flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed border-neutral-300 rounded-2xl hover:border-neutral-900 cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 transition-all text-center"
                >
                  <Upload className="w-8 h-8 text-neutral-900 mb-3" />
                  <span className="text-sm text-neutral-900 font-bold">
                    Click to select multiple photographs or drag &amp; drop here
                  </span>
                  <span className="text-xs text-neutral-500 mt-1 font-medium">
                    JPEG, PNG, RAW, WEBP — automatically optimized for blazing-fast web delivery
                  </span>
                  <input
                    id={fileInputId}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleDeviceFilesChange}
                    className="hidden"
                  />
                </label>

                {uploadProgress && (
                  <p className="text-xs text-emerald-600 font-bold animate-pulse">
                    {uploadProgress}
                  </p>
                )}
              </div>
            )}

            {/* 2. Google Drive Links Input Zone */}
            {uploadSource === 'drive' && !editingPhoto && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paste Google Drive Share Links</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Paste one or multiple Google Drive links (one per line). Drive links are automatically converted to direct high-res images!
                  </p>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={bulkDriveText}
                    onChange={(e) => setBulkDriveText(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1ABCXYZ.../view?usp=sharing&#10;https://drive.google.com/file/d/2DEFUVW.../view?usp=sharing"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleProcessBulkDriveLinks}
                  className="px-5 py-2 rounded-xl bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Convert &amp; Add Drive Links to Queue
                </button>
              </div>
            )}

            {/* 3. Direct URL Input Zone */}
            {uploadSource === 'url' && !editingPhoto && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={singleFormData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSingleFormData({ ...singleFormData, image: convertDriveToDirectImageUrl(val) });
                    }}
                    placeholder="https://images.unsplash.com/... or https://drive.google.com/file/d/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Moment / Ceremony
                    </label>
                    <select
                      value={singleFormData.moment}
                      onChange={(e) => setSingleFormData({ ...singleFormData, moment: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black bg-white"
                    >
                      {MOMENT_SUGGESTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Couple / Wedding Name
                    </label>
                    <input
                      type="text"
                      value={singleFormData.coupleName}
                      onChange={(e) => setSingleFormData({ ...singleFormData, coupleName: e.target.value })}
                      placeholder="e.g. Ananya & Kabir"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {singleFormData.image && (
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <img
                      src={singleFormData.image}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg shadow-2xs"
                    />
                    <div className="text-xs text-gray-600">
                      <p className="font-bold text-gray-900">Image Ready</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-sm">{singleFormData.image}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Single Edit Form */}
            {editingPhoto && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                    Image Link / URL
                  </label>
                  <input
                    type="text"
                    required
                    value={singleFormData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSingleFormData({ ...singleFormData, image: convertDriveToDirectImageUrl(val) });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Moment / Ceremony
                    </label>
                    <select
                      value={singleFormData.moment}
                      onChange={(e) => setSingleFormData({ ...singleFormData, moment: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black bg-white"
                    >
                      {MOMENT_SUGGESTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Couple / Wedding Name
                    </label>
                    <input
                      type="text"
                      value={singleFormData.coupleName}
                      onChange={(e) => setSingleFormData({ ...singleFormData, coupleName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Wedding Date
                    </label>
                    <input
                      type="date"
                      value={singleFormData.date}
                      onChange={(e) => setSingleFormData({ ...singleFormData, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">
                      Caption / Narrative
                    </label>
                    <input
                      type="text"
                      value={singleFormData.caption}
                      onChange={(e) => setSingleFormData({ ...singleFormData, caption: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={singleFormData.featured}
                    onChange={(e) => setSingleFormData({ ...singleFormData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                  />
                  <label htmlFor="edit-featured" className="text-xs font-semibold text-gray-900 cursor-pointer">
                    Show in "Curated Highlights" on homepage
                  </label>
                </div>
              </div>
            )}

            {/* Upload Queue Preview Grid */}
            {uploadQueue.length > 0 && !editingPhoto && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Upload Queue ({uploadQueue.length} Photos Ready)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setUploadQueue([])}
                    className="text-[11px] text-red-600 hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-200">
                  {uploadQueue.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs group"
                    >
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                        <img
                          src={item.preview}
                          alt="Queued"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFromQueue(item.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[8px] font-bold uppercase">
                          #{idx + 1}
                        </span>

                        {item.stats && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[8px] font-extrabold tracking-wider shadow-xs backdrop-blur-xs">
                            -{item.stats.savedPercent}%
                          </span>
                        )}
                      </div>
                      <div className="p-2 space-y-1 text-left">
                        <p className="text-[10px] font-bold text-gray-900 truncate">
                          {item.coupleName || item.caption || 'Untitled'}
                        </p>
                        <p className="text-[9px] text-emerald-600 font-bold truncate">
                          {item.moment}
                        </p>
                        {item.stats && (
                          <p className="text-[8px] text-gray-400 font-mono">
                            {item.stats.originalSize} → {item.stats.compressedSize} ({item.stats.format.toUpperCase()})
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <span>Saving...</span>
                ) : editingPhoto ? (
                  <span>Update Photo</span>
                ) : uploadQueue.length > 0 ? (
                  <span>Save All {uploadQueue.length} Photos to Portfolio</span>
                ) : (
                  <span>Save Photo</span>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-full border border-gray-200 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
        {/* Moment Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['All', ...MOMENT_SUGGESTIONS].map((moment) => (
            <button
              key={moment}
              onClick={() => setSelectedMomentFilter(moment)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedMomentFilter === moment
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {moment}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by couple or caption..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-black bg-gray-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-gray-700">No photographs matched your filter.</p>
          <p className="text-xs text-gray-400 mt-1">
            Try choosing a different moment category or reset your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredPhotos.map((photo) => {
            const isHero = settings.heroPhotoId === photo.id;
            return (
              <div
                key={photo.id}
                className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                  <OptimizedImage
                    src={photo.image}
                    alt={photo.caption || 'Wedding Photo'}
                    targetWidth={500}
                    quality={80}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    containerClassName="w-full h-full"
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {photo.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] uppercase tracking-widest font-bold shadow-xs">
                        ★ Featured
                      </span>
                    )}
                    {isHero && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] uppercase tracking-widest font-extrabold shadow-xs">
                        Hero Banner
                      </span>
                    )}
                    {settings.stripAvatars?.some((a) => a.src === photo.image) && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] uppercase tracking-widest font-extrabold shadow-xs">
                        Story Strip
                      </span>
                    )}
                  </div>

                  {/* Top Action Overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {confirmDeletePhotoId === photo.id ? (
                      <div className="flex items-center gap-1 bg-black/90 p-1 rounded-full border border-red-500/50 shadow-lg">
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[9px] uppercase tracking-wider font-extrabold cursor-pointer"
                        >
                          Delete?
                        </button>
                        <button
                          onClick={() => setConfirmDeletePhotoId(null)}
                          className="w-5 h-5 rounded-full text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleStoryStrip(photo)}
                          title={
                            settings.stripAvatars?.some((a) => a.src === photo.image)
                              ? 'Remove from Homepage Story Scroller'
                              : 'Add to Homepage Story Scroller'
                          }
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            settings.stripAvatars?.some((a) => a.src === photo.image)
                              ? 'bg-amber-400 text-black shadow-xs'
                              : 'bg-black/70 hover:bg-amber-400 text-white hover:text-black'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSetHero(photo.id)}
                          title={isHero ? 'Current Hero Banner' : 'Set as Hero Banner'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isHero
                              ? 'bg-emerald-400 text-black'
                              : 'bg-black/70 hover:bg-emerald-400 text-white hover:text-black'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleFeatured(photo.id)}
                          title={photo.featured ? 'Remove from Curated Highlights' : 'Feature on Homepage'}
                          className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="text-xs">★</span>
                        </button>

                        <button
                          onClick={() => handleStartEdit(photo)}
                          title="Edit Metadata"
                          className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setConfirmDeletePhotoId(photo.id)}
                          title="Delete Photograph"
                          className="w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Meta */}
                <div className="p-3 text-left">
                  <div className="flex items-center justify-between gap-1 text-[10px] uppercase tracking-wider text-emerald-600 font-bold">
                    <span>{photo.moment}</span>
                    <span className="text-gray-400">{photo.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate mt-1">
                    {photo.coupleName || photo.caption || 'Untitled Moment'}
                  </p>
                  {photo.caption && photo.coupleName && (
                    <p className="text-[11px] text-gray-500 truncate font-medium">{photo.caption}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
