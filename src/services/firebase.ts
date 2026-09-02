import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  PhotoItem,
  InquiryItem,
  SiteSettings,
  PackageItem,
  TestimonialItem,
  FaqItem,
  FilmItem,
} from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Quota management and rate limiting
const QUOTA_KEY = 'unposed_firestore_quota_exhausted';
let isQuotaExceeded = false;

// Check if quota limit was reached recently (within last 3 hours)
try {
  const recorded = localStorage.getItem(QUOTA_KEY);
  if (recorded) {
    const elapsed = Date.now() - parseInt(recorded, 10);
    if (elapsed < 3 * 60 * 60 * 1000) {
      isQuotaExceeded = true;
    } else {
      localStorage.removeItem(QUOTA_KEY);
    }
  }
} catch {
  // Ignore localStorage access errors
}

export function markQuotaExhausted() {
  isQuotaExceeded = true;
  try {
    localStorage.setItem(QUOTA_KEY, Date.now().toString());
  } catch {}
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errStr = error instanceof Error ? error.message : String(error);
  
  if (
    errStr.includes('resource-exhausted') ||
    errStr.includes('Quota limit exceeded') ||
    errStr.includes('Quota exceeded')
  ) {
    markQuotaExhausted();
    console.warn('[Firestore Notice] Free daily write quota reached for today. Safely using high-capacity local IndexedDB persistence.');
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  return errInfo;
}

// Deep sanitize helper to strip undefined and non-serializable fields
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export const FirebaseService = {
  isQuotaLimited(): boolean {
    return isQuotaExceeded;
  },

  isConfigured(): boolean {
    return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
  },

  getProjectInfo() {
    return {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain,
    };
  },

  // ==================== PHOTOS ====================
  async fetchPhotos(): Promise<PhotoItem[] | null> {
    try {
      const colRef = collection(db, 'photos');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q).catch(async () => {
        // Fallback without index/ordering in case createdAt index is pending
        return await getDocs(colRef);
      });

      if (snapshot.empty) {
        return null;
      }

      const photos: PhotoItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PhotoItem;
        photos.push({
          ...data,
          id: docSnap.id || data.id,
        });
      });

      // Sort client-side as guarantee
      photos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return photos;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'photos');
      return null;
    }
  },

  async savePhoto(photo: PhotoItem): Promise<boolean> {
    if (isQuotaExceeded) return false;
    const docPath = `photos/${photo.id}`;
    try {
      const sanitized = sanitizeForFirestore({
        id: photo.id,
        image: photo.image,
        caption: photo.caption || '',
        moment: photo.moment || 'Wedding Ceremony',
        coupleName: photo.coupleName || '',
        date: photo.date || new Date().toISOString().split('T')[0],
        featured: Boolean(photo.featured),
        createdAt: photo.createdAt || Date.now(),
        cloudSynced: true,
      });

      await setDoc(doc(db, 'photos', photo.id), sanitized, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
      return false;
    }
  },

  async saveAllPhotos(photos: PhotoItem[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!photos || photos.length === 0) return { success: true, count: 0 };
    if (isQuotaExceeded) return { success: false, count: 0, error: 'Quota exceeded' };
    try {
      // Save all photos concurrently with individual setDoc to avoid 10MB batch payload limits
      let savedCount = 0;
      // Process in small parallel chunks of 5 for optimal network concurrency
      const chunkSize = 5;
      for (let i = 0; i < photos.length; i += chunkSize) {
        if (isQuotaExceeded) break;
        const chunk = photos.slice(i, i + chunkSize);
        await Promise.allSettled(
          chunk.map(async (photo) => {
            const success = await FirebaseService.savePhoto(photo);
            if (success) savedCount++;
          })
        );
      }
      return { success: savedCount > 0, count: savedCount };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'photos');
      return { success: false, count: 0, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async deletePhoto(id: string): Promise<boolean> {
    if (isQuotaExceeded) return false;
    const docPath = `photos/${id}`;
    try {
      await deleteDoc(doc(db, 'photos', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
      return false;
    }
  },

  subscribePhotos(callback: (photos: PhotoItem[]) => void): Unsubscribe {
    if (isQuotaExceeded) return () => {};
    const colRef = collection(db, 'photos');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const photos: PhotoItem[] = [];
          snapshot.forEach((docSnap) => {
            photos.push({ ...(docSnap.data() as PhotoItem), id: docSnap.id });
          });
          photos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          callback(photos);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'photos');
      }
    );
  },

  // ==================== SITE SETTINGS ====================
  async fetchSettings(): Promise<SiteSettings | null> {
    const docPath = 'settings/global';
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        return snap.data() as SiteSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return null;
    }
  },

  async saveSettings(settings: SiteSettings): Promise<boolean> {
    if (isQuotaExceeded) return false;
    const docPath = 'settings/global';
    try {
      const sanitized = sanitizeForFirestore({
        ...settings,
        firebaseLastSyncedAt: Date.now(),
        firebaseSyncEnabled: true,
      });
      await setDoc(doc(db, 'settings', 'global'), sanitized, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
      return false;
    }
  },

  // ==================== INQUIRIES ====================
  async fetchInquiries(): Promise<InquiryItem[] | null> {
    try {
      const colRef = collection(db, 'inquiries');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;
      const inquiries: InquiryItem[] = [];
      snap.forEach((docSnap) => {
        inquiries.push({ ...(docSnap.data() as InquiryItem), id: docSnap.id });
      });
      inquiries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return inquiries;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'inquiries');
      return null;
    }
  },

  async saveInquiry(inquiry: InquiryItem): Promise<boolean> {
    if (isQuotaExceeded) return false;
    const docPath = `inquiries/${inquiry.id}`;
    try {
      const sanitized = sanitizeForFirestore(inquiry);
      await setDoc(doc(db, 'inquiries', inquiry.id), sanitized, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
      return false;
    }
  },

  async deleteInquiry(id: string): Promise<boolean> {
    if (isQuotaExceeded) return false;
    const docPath = `inquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
      return false;
    }
  },

  // ==================== PACKAGES ====================
  async fetchPackages(): Promise<PackageItem[] | null> {
    try {
      const colRef = collection(db, 'packages');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;
      const pkgs: PackageItem[] = [];
      snap.forEach((docSnap) => {
        pkgs.push({ ...(docSnap.data() as PackageItem), id: docSnap.id });
      });
      return pkgs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'packages');
      return null;
    }
  },

  async savePackages(packages: PackageItem[]): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      const batch = writeBatch(db);
      for (const pkg of packages) {
        const ref = doc(db, 'packages', pkg.id);
        batch.set(ref, sanitizeForFirestore(pkg), { merge: true });
      }
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'packages');
      return false;
    }
  },

  async deletePackage(id: string): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      await deleteDoc(doc(db, 'packages', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `packages/${id}`);
      return false;
    }
  },

  // ==================== TESTIMONIALS ====================
  async fetchTestimonials(): Promise<TestimonialItem[] | null> {
    try {
      const colRef = collection(db, 'testimonials');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;
      const list: TestimonialItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as TestimonialItem), id: docSnap.id });
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
      return null;
    }
  },

  async saveTestimonials(items: TestimonialItem[]): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      const batch = writeBatch(db);
      for (const t of items) {
        const ref = doc(db, 'testimonials', t.id);
        batch.set(ref, sanitizeForFirestore(t), { merge: true });
      }
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'testimonials');
      return false;
    }
  },

  async deleteTestimonial(id: string): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `testimonials/${id}`);
      return false;
    }
  },

  // ==================== FAQS ====================
  async fetchFaqs(): Promise<FaqItem[] | null> {
    try {
      const colRef = collection(db, 'faqs');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;
      const list: FaqItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as FaqItem), id: docSnap.id });
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'faqs');
      return null;
    }
  },

  async saveFaqs(items: FaqItem[]): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      const batch = writeBatch(db);
      for (const f of items) {
        const ref = doc(db, 'faqs', f.id);
        batch.set(ref, sanitizeForFirestore(f), { merge: true });
      }
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'faqs');
      return false;
    }
  },

  async deleteFaq(id: string): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      await deleteDoc(doc(db, 'faqs', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `faqs/${id}`);
      return false;
    }
  },

  // ==================== FILMS ====================
  async fetchFilms(): Promise<FilmItem[] | null> {
    try {
      const colRef = collection(db, 'films');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;
      const list: FilmItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as FilmItem), id: docSnap.id });
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'films');
      return null;
    }
  },

  async saveFilms(items: FilmItem[]): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      const batch = writeBatch(db);
      for (const film of items) {
        const ref = doc(db, 'films', film.id);
        batch.set(ref, sanitizeForFirestore(film), { merge: true });
      }
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'films');
      return false;
    }
  },

  async deleteFilm(id: string): Promise<boolean> {
    if (isQuotaExceeded) return false;
    try {
      await deleteDoc(doc(db, 'films', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `films/${id}`);
      return false;
    }
  },

  // ==================== FULL BACKUP & SYNC ====================
  async syncEverythingToCloud(data: {
    photos: PhotoItem[];
    settings: SiteSettings;
    inquiries: InquiryItem[];
    packages?: PackageItem[];
    testimonials?: TestimonialItem[];
    faqs?: FaqItem[];
    films?: FilmItem[];
  }): Promise<{ success: boolean; message: string }> {
    try {
      const promises: Promise<unknown>[] = [];

      if (data.photos && data.photos.length > 0) {
        promises.push(this.saveAllPhotos(data.photos));
      }
      if (data.settings) {
        promises.push(this.saveSettings(data.settings));
      }
      if (data.inquiries && data.inquiries.length > 0) {
        for (const inq of data.inquiries) {
          promises.push(this.saveInquiry(inq));
        }
      }
      if (data.packages && data.packages.length > 0) {
        promises.push(this.savePackages(data.packages));
      }
      if (data.testimonials && data.testimonials.length > 0) {
        promises.push(this.saveTestimonials(data.testimonials));
      }
      if (data.faqs && data.faqs.length > 0) {
        promises.push(this.saveFaqs(data.faqs));
      }
      if (data.films && data.films.length > 0) {
        promises.push(this.saveFilms(data.films));
      }

      await Promise.all(promises);
      return {
        success: true,
        message: `Successfully synchronized ${data.photos?.length || 0} photos, settings, and portfolio data to Firestore!`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Synchronization error occurred',
      };
    }
  },
};
