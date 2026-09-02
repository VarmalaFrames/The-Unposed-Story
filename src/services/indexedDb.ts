import { PhotoItem } from '../types';

const DB_NAME = 'UnposedStoryPortfolioDB';
const DB_VERSION = 2;
const STORES = {
  PHOTOS: 'photos',
  KV: 'key_value',
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store 1: High-capacity photos storage
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
          photoStore.createIndex('createdAt', 'createdAt', { unique: false });
          photoStore.createIndex('moment', 'moment', { unique: false });
          photoStore.createIndex('featured', 'featured', { unique: false });
        }

        // Store 2: General Key-Value store for large entities & settings
        if (!db.objectStoreNames.contains(STORES.KV)) {
          db.createObjectStore(STORES.KV, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  return dbPromise;
}

export const IdbStorage = {
  /**
   * Fetch all photos from IndexedDB
   */
  async getAllPhotos(): Promise<PhotoItem[]> {
    try {
      const db = await getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PHOTOS], 'readonly');
        const store = transaction.objectStore(STORES.PHOTOS);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result as PhotoItem[];
          // Sort by createdAt desc if available
          if (Array.isArray(items) && items.length > 0) {
            items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            resolve(items);
          } else {
            resolve([]);
          }
        };

        request.onerror = () => {
          console.warn('IDB getAllPhotos error:', request.error);
          resolve([]);
        };
      });
    } catch (err) {
      console.warn('IndexedDB unavailable for getAllPhotos:', err);
      return [];
    }
  },

  /**
   * Save array of photos to IndexedDB (replaces all or syncs)
   */
  async saveAllPhotos(photos: PhotoItem[]): Promise<boolean> {
    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PHOTOS], 'readwrite');
        const store = transaction.objectStore(STORES.PHOTOS);

        // Clear existing to match current exact state
        const clearReq = store.clear();

        clearReq.onsuccess = () => {
          if (!photos || photos.length === 0) {
            resolve(true);
            return;
          }

          let completed = 0;
          for (const photo of photos) {
            const putReq = store.put(photo);
            putReq.onsuccess = () => {
              completed++;
              if (completed === photos.length) {
                resolve(true);
              }
            };
            putReq.onerror = () => {
              console.warn('Error putting photo into IDB:', photo.id);
              completed++;
              if (completed === photos.length) {
                resolve(true);
              }
            };
          }
        };

        clearReq.onerror = () => {
          console.warn('Error clearing IDB photos store');
          resolve(false);
        };
      });
    } catch (err) {
      console.warn('IndexedDB unavailable for saveAllPhotos:', err);
      return false;
    }
  },

  /**
   * Save a single photo (upsert)
   */
  async saveSinglePhoto(photo: PhotoItem): Promise<boolean> {
    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PHOTOS], 'readwrite');
        const store = transaction.objectStore(STORES.PHOTOS);
        const req = store.put(photo);

        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn('Error putting single photo into IDB:', req.error);
          resolve(false);
        };
      });
    } catch (err) {
      console.warn('IndexedDB unavailable for saveSinglePhoto:', err);
      return false;
    }
  },

  /**
   * Delete single photo by ID
   */
  async deletePhoto(id: string): Promise<boolean> {
    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.PHOTOS], 'readwrite');
        const store = transaction.objectStore(STORES.PHOTOS);
        const req = store.delete(id);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (err) {
      console.warn('IndexedDB unavailable for deletePhoto:', err);
      return false;
    }
  },

  /**
   * Get generic key-value item from IDB
   */
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.KV], 'readonly');
        const store = transaction.objectStore(STORES.KV);
        const req = store.get(key);

        req.onsuccess = () => {
          if (req.result && req.result.value !== undefined) {
            resolve(req.result.value as T);
          } else {
            resolve(defaultValue);
          }
        };

        req.onerror = () => resolve(defaultValue);
      });
    } catch (err) {
      return defaultValue;
    }
  },

  /**
   * Save generic key-value item to IDB
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const db = await getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORES.KV], 'readwrite');
        const store = transaction.objectStore(STORES.KV);
        const req = store.put({ key, value, updatedAt: Date.now() });

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (err) {
      return false;
    }
  },

  /**
   * Estimate storage usage in bytes and percentage if supported
   */
  async getStorageEstimate(): Promise<{
    usageFormatted: string;
    quotaFormatted: string;
    percentUsed: number;
  }> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 1024 * 1024 * 1024; // fallback 1GB

        const formatBytes = (b: number) => {
          if (b >= 1024 * 1024 * 1024) return (b / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
          if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
          if (b >= 1024) return Math.round(b / 1024) + ' KB';
          return b + ' B';
        };

        const percent = Math.min(100, Math.round((usage / Math.max(1, quota)) * 100));

        return {
          usageFormatted: formatBytes(usage),
          quotaFormatted: formatBytes(quota),
          percentUsed: percent,
        };
      } catch {
        // ignore
      }
    }

    return {
      usageFormatted: 'Available',
      quotaFormatted: 'Unlimited (IndexedDB)',
      percentUsed: 0,
    };
  },
};
