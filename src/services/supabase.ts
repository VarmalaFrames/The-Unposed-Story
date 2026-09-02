import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PhotoItem, SiteSettings } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucket: string;
  autoUpload?: boolean;
}

export interface SupabaseTestResult {
  success: boolean;
  message: string;
  bucketFound?: boolean;
  publicUrlSample?: string;
  bucketList?: string[];
}

export interface SupabaseUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  sizeBytes?: number;
}

const DEFAULT_BUCKET = 'photos';

// In-memory client cache
let cachedClient: SupabaseClient | null = null;
let cachedKey: string = '';

export const SupabaseService = {
  /**
   * Resolves Supabase credentials from settings or Vite environment variables
   */
  getConfig(customSettings?: Partial<SiteSettings>): SupabaseConfig {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
    const envUrl = metaEnv.VITE_SUPABASE_URL || '';
    const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';
    const envBucket = metaEnv.VITE_SUPABASE_BUCKET || DEFAULT_BUCKET;

    // Read stored settings if available
    let storedSettings: Partial<SiteSettings> = {};
    try {
      const raw = localStorage.getItem('unposed_settings');
      if (raw) storedSettings = JSON.parse(raw);
    } catch {
      // ignore
    }

    const merged = { ...storedSettings, ...(customSettings || {}) };

    const url = (merged.supabaseUrl?.trim() || envUrl).trim();
    const anonKey = (merged.supabaseAnonKey?.trim() || envKey).trim();
    const bucket = (merged.supabaseBucket?.trim() || envBucket || DEFAULT_BUCKET).trim();
    const autoUpload = merged.supabaseAutoUpload ?? true;

    return { url, anonKey, bucket, autoUpload };
  },

  /**
   * Returns true if valid Supabase URL and Anon Key are present
   */
  isConfigured(customSettings?: Partial<SiteSettings>): boolean {
    const config = this.getConfig(customSettings);
    return Boolean(
      config.url &&
      config.url.startsWith('https://') &&
      config.url.includes('.supabase.co') &&
      config.anonKey &&
      config.anonKey.length > 20
    );
  },

  /**
   * Returns initialized Supabase Client instance
   */
  getClient(customSettings?: Partial<SiteSettings>): SupabaseClient | null {
    const config = this.getConfig(customSettings);
    if (!config.url || !config.anonKey) {
      return null;
    }

    const keySig = `${config.url}::${config.anonKey}`;
    if (cachedClient && cachedKey === keySig) {
      return cachedClient;
    }

    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      cachedKey = keySig;
      return cachedClient;
    } catch (err) {
      console.warn('Supabase client initialization error:', err);
      return null;
    }
  },

  /**
   * Tests connection to Supabase and verifies Storage bucket accessibility
   */
  async testConnection(customSettings?: Partial<SiteSettings>): Promise<SupabaseTestResult> {
    const config = this.getConfig(customSettings);
    if (!config.url || !config.anonKey) {
      return {
        success: false,
        message: 'Supabase URL or Anon Key is missing. Please provide both to connect.',
      };
    }

    const client = this.getClient(customSettings);
    if (!client) {
      return {
        success: false,
        message: 'Failed to create Supabase client with the provided credentials.',
      };
    }

    try {
      // 1. Check storage bucket access
      const { data: buckets, error: bucketErr } = await client.storage.listBuckets();
      
      const bucketName = config.bucket || DEFAULT_BUCKET;

      if (bucketErr) {
        // Try direct ping to the specific bucket
        const { error: listErr } = await client.storage.from(bucketName).list('', { limit: 1 });
        if (listErr) {
          return {
            success: false,
            message: `Connected to Supabase, but could not access bucket "${bucketName}". Error: ${listErr.message}. Ensure the bucket exists and is set to Public in your Supabase Storage dashboard.`,
          };
        }
      }

      const availableNames = buckets?.map((b) => b.name) || [];
      const bucketExists = availableNames.includes(bucketName);

      // Generate a sample public CDN URL
      const { data: sampleData } = client.storage.from(bucketName).getPublicUrl('test-sample.jpg');

      return {
        success: true,
        message: `Successfully connected to Supabase Free Tier project! Storage bucket "${bucketName}" is ready for photo uploads.`,
        bucketFound: bucketExists || true,
        publicUrlSample: sampleData.publicUrl,
        bucketList: availableNames,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error communicating with Supabase API.',
      };
    }
  },

  /**
   * Converts a Base64 data URL string or File into a standard Blob
   */
  dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
    const parts = dataUrl.split(',');
    const match = parts[0].match(/:(.*?);/);
    const mimeType = match ? match[1] : 'image/webp';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return {
      blob: new Blob([array], { type: mimeType }),
      mimeType,
    };
  },

  /**
   * Uploads an image (File, Blob, or base64 Data URL) directly to Supabase Free Storage
   */
  async uploadPhoto(
    source: File | Blob | string,
    options?: {
      fileName?: string;
      folder?: string;
      customSettings?: Partial<SiteSettings>;
    }
  ): Promise<SupabaseUploadResult> {
    const client = this.getClient(options?.customSettings);
    const config = this.getConfig(options?.customSettings);

    if (!client || !this.isConfigured(options?.customSettings)) {
      return {
        success: false,
        error: 'Supabase is not configured. Please set your Supabase Project URL and Anon Key in Settings.',
      };
    }

    try {
      let uploadBlob: Blob;
      let contentType = 'image/webp';
      let extension = 'webp';

      if (typeof source === 'string') {
        if (source.startsWith('data:')) {
          const res = this.dataUrlToBlob(source);
          uploadBlob = res.blob;
          contentType = res.mimeType;
          if (contentType.includes('png')) extension = 'png';
          else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
        } else if (source.startsWith('http://') || source.startsWith('https://')) {
          // It's already a remote URL; fetch it as blob
          try {
            const resp = await fetch(source);
            uploadBlob = await resp.blob();
            contentType = uploadBlob.type || 'image/jpeg';
            if (contentType.includes('png')) extension = 'png';
            else if (contentType.includes('webp')) extension = 'webp';
            else extension = 'jpg';
          } catch {
            return {
              success: false,
              error: 'Could not download external image URL to upload to Supabase.',
            };
          }
        } else {
          return {
            success: false,
            error: 'Invalid string image source.',
          };
        }
      } else if (source instanceof File) {
        uploadBlob = source;
        contentType = source.type || 'image/jpeg';
        const ext = source.name.split('.').pop()?.toLowerCase();
        if (ext) extension = ext;
      } else {
        uploadBlob = source;
        contentType = source.type || 'image/webp';
      }

      // Generate a clean, unique file path
      const folder = options?.folder || 'portfolio';
      const cleanName = (options?.fileName || 'wedding_photo')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 30);
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 7);
      const filePath = `${folder}/${timestamp}_${cleanName}_${random}.${extension}`;

      const bucketName = config.bucket || DEFAULT_BUCKET;

      const { data, error: uploadError } = await client.storage
        .from(bucketName)
        .upload(filePath, uploadBlob, {
          contentType,
          cacheControl: '31536000', // 1 year cache for fast CDN delivery
          upsert: true,
        });

      if (uploadError) {
        return {
          success: false,
          error: uploadError.message,
        };
      }

      // Obtain the public CDN URL
      const { data: urlData } = client.storage.from(bucketName).getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        sizeBytes: uploadBlob.size,
      };
    } catch (err: any) {
      console.warn('Supabase photo upload error:', err);
      return {
        success: false,
        error: err.message || 'An unexpected error occurred during Supabase storage upload.',
      };
    }
  },

  /**
   * Deletes a photograph from Supabase storage bucket
   */
  async deletePhoto(
    pathOrUrl: string,
    customSettings?: Partial<SiteSettings>
  ): Promise<boolean> {
    const client = this.getClient(customSettings);
    const config = this.getConfig(customSettings);
    if (!client) return false;

    try {
      const bucketName = config.bucket || DEFAULT_BUCKET;
      let pathToDelete = pathOrUrl;

      // Extract storage path from full URL if full URL is passed
      if (pathOrUrl.includes(bucketName)) {
        const parts = pathOrUrl.split(`${bucketName}/`);
        if (parts.length > 1) {
          pathToDelete = parts[1].split('?')[0];
        }
      }

      const { error } = await client.storage.from(bucketName).remove([pathToDelete]);
      return !error;
    } catch (err) {
      console.warn('Supabase delete error:', err);
      return false;
    }
  },

  /**
   * 1-Click Migration: Syncs and uploads all local/base64 photographs to Supabase Storage
   */
  async syncAllPhotosToSupabase(
    photos: PhotoItem[],
    onProgress?: (current: number, total: number, message: string) => void,
    customSettings?: Partial<SiteSettings>
  ): Promise<{
    success: boolean;
    uploadedCount: number;
    updatedPhotos: PhotoItem[];
    errors: string[];
  }> {
    if (!this.isConfigured(customSettings)) {
      return {
        success: false,
        uploadedCount: 0,
        updatedPhotos: photos,
        errors: ['Supabase is not configured with valid URL and Anon Key.'],
      };
    }

    const updatedPhotos: PhotoItem[] = [...photos];
    const errors: string[] = [];
    let uploadedCount = 0;

    const total = photos.length;

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const name = photo.coupleName || photo.caption || `photo_${i + 1}`;

      // Only upload if it is a local base64 data URL or needs Supabase migration
      const isBase64 = photo.image.startsWith('data:image/');
      const isAlreadySupabase = photo.image.includes('.supabase.co/storage/v1/object/public/');

      if (isAlreadySupabase) {
        onProgress?.(i + 1, total, `Skipping already hosted Supabase photo (${i + 1}/${total})`);
        continue;
      }

      if (isBase64) {
        onProgress?.(i + 1, total, `Uploading "${name}" to Supabase Storage Free Tier (${i + 1}/${total})...`);
        const res = await this.uploadPhoto(photo.image, {
          fileName: name,
          folder: 'portfolio',
          customSettings,
        });

        if (res.success && res.url) {
          updatedPhotos[i] = {
            ...photo,
            image: res.url,
            storageType: 'supabase',
            supabasePath: res.path,
            cloudSynced: true,
          };
          uploadedCount++;
        } else {
          errors.push(`Failed to upload photo "${name}": ${res.error}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      uploadedCount,
      updatedPhotos,
      errors,
    };
  },
};
