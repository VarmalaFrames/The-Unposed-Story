import React, { useState, useEffect } from 'react';
import { SiteSettings, PhotoItem } from '../../types';
import { StorageService } from '../../services/storage';
import { SupabaseService, SupabaseTestResult } from '../../services/supabase';
import {
  Cloud,
  CheckCircle2,
  X,
  RefreshCw,
  Zap,
  HardDrive,
  UploadCloud,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileImage,
  Database,
  ArrowRight,
} from 'lucide-react';

interface SupabaseManagerProps {
  settings: SiteSettings;
  photos: PhotoItem[];
  onSettingsUpdated: (settings: SiteSettings) => void;
  onPhotosUpdated: (photos: PhotoItem[]) => void;
}

export const SupabaseManager: React.FC<SupabaseManagerProps> = ({
  settings,
  photos,
  onSettingsUpdated,
  onPhotosUpdated,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [supabaseBucket, setSupabaseBucket] = useState(settings.supabaseBucket || 'photos');
  const [supabaseAutoUpload, setSupabaseAutoUpload] = useState(settings.supabaseAutoUpload !== false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SupabaseTestResult | null>(null);

  // Migration & Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [syncOutcome, setSyncOutcome] = useState<{ success: boolean; message: string; count: number } | null>(null);

  // Single Direct Photo Test Upload State
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singleUploading, setSingleUploading] = useState(false);
  const [singleUploadResult, setSingleUploadResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  const isConfigured = SupabaseService.isConfigured({
    supabaseUrl,
    supabaseAnonKey,
    supabaseBucket,
  });

  // Calculate photo hosting stats
  const supabasePhotosCount = photos.filter(
    (p) => p.storageType === 'supabase' || p.image.includes('.supabase.co/storage/v1/object/public/')
  ).length;
  const localPhotosCount = photos.filter((p) => p.image.startsWith('data:image/')).length;
  const externalPhotosCount = photos.length - supabasePhotosCount - localPhotosCount;

  // Auto-run connection test if credentials exist on mount
  useEffect(() => {
    if (isConfigured && !testResult) {
      handleTestConnection();
    }
  }, []);

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const updated: SiteSettings = {
      ...settings,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      supabaseBucket: supabaseBucket.trim() || 'photos',
      supabaseAutoUpload,
    };

    StorageService.saveSettings(updated);
    onSettingsUpdated(updated);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const tempConfig: Partial<SiteSettings> = {
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      supabaseBucket: supabaseBucket.trim() || 'photos',
    };

    try {
      const res = await SupabaseService.testConnection(tempConfig);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to Supabase.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAllLocalPhotos = async () => {
    if (!isConfigured) {
      setTestResult({
        success: false,
        message: 'Please provide valid Supabase Project URL and Public Anon Key first.',
      });
      return;
    }

    // Save configuration before migrating
    handleSaveConfig();

    setIsSyncing(true);
    setSyncOutcome(null);
    setSyncProgress({ current: 0, total: photos.length, message: 'Initiating Supabase batch upload...' });

    try {
      const res = await SupabaseService.syncAllPhotosToSupabase(
        photos,
        (current, total, message) => {
          setSyncProgress({ current, total, message });
        },
        {
          supabaseUrl: supabaseUrl.trim(),
          supabaseAnonKey: supabaseAnonKey.trim(),
          supabaseBucket: supabaseBucket.trim() || 'photos',
        }
      );

      if (res.uploadedCount > 0) {
        StorageService.savePhotos(res.updatedPhotos);
        onPhotosUpdated(res.updatedPhotos);
        setSyncOutcome({
          success: true,
          count: res.uploadedCount,
          message: `Successfully migrated and uploaded ${res.uploadedCount} photograph${res.uploadedCount > 1 ? 's' : ''} to your Supabase Free Storage CDN!`,
        });
      } else if (res.errors.length > 0) {
        setSyncOutcome({
          success: false,
          count: 0,
          message: `Notice: ${res.errors[0]}`,
        });
      } else {
        setSyncOutcome({
          success: true,
          count: 0,
          message: 'All photographs are already hosted on Supabase or external CDN.',
        });
      }
    } catch (err: any) {
      setSyncOutcome({
        success: false,
        count: 0,
        message: err.message || 'Error during photo sync to Supabase.',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleSinglePhotoTestUpload = async () => {
    if (!singleFile) return;
    setSingleUploading(true);
    setSingleUploadResult(null);

    try {
      const res = await SupabaseService.uploadPhoto(singleFile, {
        fileName: singleFile.name.replace(/\.[^/.]+$/, ''),
        customSettings: {
          supabaseUrl: supabaseUrl.trim(),
          supabaseAnonKey: supabaseAnonKey.trim(),
          supabaseBucket: supabaseBucket.trim() || 'photos',
        },
      });

      if (res.success && res.url) {
        setSingleUploadResult({
          success: true,
          url: res.url,
        });

        // Add to portfolio automatically
        const newPhoto: PhotoItem = {
          id: 'photo_sb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          image: res.url,
          caption: singleFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          moment: 'Fine Art Portrait',
          coupleName: 'Real Wedding',
          date: new Date().toISOString().split('T')[0],
          featured: true,
          createdAt: Date.now(),
          storageType: 'supabase',
          supabasePath: res.path,
          cloudSynced: true,
        };

        const updated = [newPhoto, ...photos];
        StorageService.savePhotos(updated);
        onPhotosUpdated(updated);
      } else {
        setSingleUploadResult({
          success: false,
          error: res.error || 'Upload failed.',
        });
      }
    } catch (err: any) {
      setSingleUploadResult({
        success: false,
        error: err.message || 'Unexpected upload error.',
      });
    } finally {
      setSingleUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="supabase-manager-panel">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Supabase Free Tier Cloud Storage Connection
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                {isConfigured ? 'Connected (1 GB Free Forever)' : 'Not Connected'}
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-3xl leading-relaxed">
              Connect your free <strong>Supabase</strong> project to serve portfolio photographs via high-speed global CDN, permanent storage, and zero recurring hosting charges.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-gray-200 hover:border-black text-xs uppercase tracking-wider font-bold text-gray-800 transition-colors"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Supabase CDN Photos</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{supabasePhotosCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Local IndexedDB Photos</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{localPhotosCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Free Storage Allowance</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">1,000 MB</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Card */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              API Connection Credentials
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Obtain these from your Supabase project settings at <span className="font-mono text-gray-700">Project Settings &gt; API</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 hover:border-black text-xs font-bold text-gray-800 transition-colors cursor-pointer bg-gray-50 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </div>

        {/* Live Test Result Banner */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed animate-fade-in ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{testResult.message}</p>
                {testResult.publicUrlSample && (
                  <p className="text-[11px] text-emerald-700 font-mono break-all">
                    Public CDN Sample: {testResult.publicUrlSample}
                  </p>
                )}
                {testResult.bucketList && testResult.bucketList.length > 0 && (
                  <p className="text-[11px] text-emerald-800">
                    Accessible Buckets: <span className="font-mono font-bold">{testResult.bucketList.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1.5">
              Supabase Project URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzprojectid.supabase.co"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:outline-none focus:border-black transition-colors"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Your unique project endpoint: <code className="font-mono text-gray-700">https://[PROJECT-ID].supabase.co</code>
            </p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1.5">
              Supabase Public Anon Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:outline-none focus:border-black transition-colors"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Safe public anonymous client API key with Storage permissions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1.5">
              Storage Bucket Name
            </label>
            <input
              type="text"
              value={supabaseBucket}
              onChange={(e) => setSupabaseBucket(e.target.value)}
              placeholder="photos"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:outline-none focus:border-black transition-colors"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              The public storage bucket name in your Supabase Storage dashboard (default is <code className="font-mono text-gray-700">photos</code>).
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-700 mb-1.5">
              Automatic Upload Behavior
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={supabaseAutoUpload}
                onChange={(e) => setSupabaseAutoUpload(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-800">
                Automatically upload new portfolio photographs to Supabase CDN upon addition
              </span>
            </label>
          </div>
        </div>
      </form>

      {/* 1-Click Migration & Sync Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>1-Click Local Photo Migration to Supabase CDN</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Convert all local base64/IndexedDB photos into high-speed hosted Supabase CDN URLs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncAllLocalPhotos}
            disabled={isSyncing || !isConfigured || localPhotosCount === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isConfigured && localPhotosCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>
              {isSyncing
                ? 'Uploading to Supabase CDN...'
                : `Upload ${localPhotosCount} Local Photo${localPhotosCount === 1 ? '' : 's'} to Supabase`}
            </span>
          </button>
        </div>

        {/* Sync Progress Bar */}
        {syncProgress && (
          <div className="p-4 rounded-xl bg-neutral-900 text-white space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                {syncProgress.message}
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {syncProgress.current} / {syncProgress.total}
              </span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(syncProgress.current / Math.max(syncProgress.total, 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Sync Outcome Banner */}
        {syncOutcome && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed animate-fade-in ${
              syncOutcome.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {syncOutcome.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{syncOutcome.message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Zero Base64 Memory Overhead</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Moving images to Supabase CDN frees browser memory and delivers responsive, optimized image caching worldwide.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Permanent IndexedDB Fallback</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Your portfolio always retains offline backup in IndexedDB, guaranteeing instant client-side fallback.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Direct Photo Upload Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileImage className="w-4 h-4 text-emerald-600" />
              <span>Test Direct Photo Upload to Supabase</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload an image file directly to verify real-time storage bucket uploads and CDN URL generation.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSingleFile(e.target.files?.[0] || null)}
            className="w-full sm:w-auto flex-1 text-xs text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-800 hover:file:bg-black hover:file:text-white file:transition-colors file:cursor-pointer cursor-pointer border border-gray-200 rounded-xl p-1"
          />

          <button
            type="button"
            onClick={handleSinglePhotoTestUpload}
            disabled={singleUploading || !singleFile || !isConfigured}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto justify-center"
          >
            <UploadCloud className={`w-4 h-4 ${singleUploading ? 'animate-spin' : ''}`} />
            <span>{singleUploading ? 'Uploading Image...' : 'Upload & Add to Portfolio'}</span>
          </button>
        </div>

        {singleUploadResult && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed animate-fade-in ${
              singleUploadResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {singleUploadResult.success ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Image uploaded successfully and added to your portfolio!</p>
                  <p className="text-[11px] text-emerald-700 font-mono break-all">
                    Public CDN URL: {singleUploadResult.url}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="font-bold">{singleUploadResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2-Minute Setup Tutorial Card */}
      <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 sm:p-8 space-y-4">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-emerald-600" />
          <span>Quick 2-Minute Supabase Free Tier Setup Instructions</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-white border border-emerald-100 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
              1
            </span>
            <p className="text-xs font-bold text-gray-900">Create Free Account</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Sign up at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-bold">supabase.com</a>. Free tier includes 1 GB storage &amp; 2 GB bandwidth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-emerald-100 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
              2
            </span>
            <p className="text-xs font-bold text-gray-900">Create Storage Bucket</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              In your Supabase project, go to <strong>Storage</strong> &gt; <strong>New Bucket</strong>. Name it <span className="font-mono font-bold">photos</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-emerald-100 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
              3
            </span>
            <p className="text-xs font-bold text-gray-900">Enable Public Bucket</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Toggle <strong>Public bucket</strong> to <span className="text-emerald-700 font-bold">ON</span> so images are viewable by website visitors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-emerald-100 space-y-1.5 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
              4
            </span>
            <p className="text-xs font-bold text-gray-900">Paste Credentials &amp; Test</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Copy <strong>Project URL</strong> &amp; <strong>anon key</strong> from <strong>Settings &gt; API</strong> and click <strong>Test Connection</strong> above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
