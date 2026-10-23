/**
 * src/services/s89IndexedDbService.ts
 * Servicio de almacenamiento persistente en IndexedDB para formularios y asignaciones S-89.
 *
 * Garantiza que todas las boletas de asignación S-89 (Reunión Vida y Ministerio Cristianos),
 * sus estados de entrega/confirmación, notas de consejo y PDFs rellenados permanezcan
 * disponibles al 100% sin conexión (Offline-First), sincronizándose además con el Service Worker.
 */

import { S89Slip } from '../types';
import { encryptPinAtRest, decryptPinAtRest } from '../utils/theocraticSecurity';

const DB_NAME = 'kongre_s89_offline_db_v1';
const DB_VERSION = 1;

const STORE_WEEK_SLIPS = 's89_slips_by_week';
const STORE_SLIP_OVERRIDES = 's89_slip_overrides';
const STORE_FILLED_PDFS = 's89_filled_pdfs';

export interface S89WeekOfflineRecord {
  weekId: string;
  congregationId: string;
  weekStartDate: string;
  weekEndDate: string;
  slipCount: number;
  updatedAt: string;
  slips?: S89Slip[];
  encryptedSlips?: string;
}

export interface S89SlipOverrideRecord {
  slipId: string;
  weekId: string;
  studentId: string;
  deliveredStatus: 'pendiente' | 'entregada' | 'confirmada';
  deliveredAt?: string;
  counselNotes?: string;
  updatedAt: string;
}

export interface S89FilledPdfCacheRecord {
  cacheKey: string;
  weekId: string;
  layout: string;
  fileName: string;
  bytes: Uint8Array;
  slipCount: number;
  updatedAt: string;
}

export interface S89OfflineStorageStats {
  isPersistentGranted: boolean;
  cachedWeeksCount: number;
  totalCachedSlips: number;
  cachedPdfsCount: number;
  lastSyncedAt: string | null;
}

let dbInstance: IDBDatabase | null = null;
let dbOpenPromise: Promise<IDBDatabase> | null = null;

/**
 * Solicita al navegador almacenamiento persistente (StorageManager.persist)
 * para evitar que el sistema operativo purgue IndexedDB bajo presión de memoria.
 */
export async function ensureS89PersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const alreadyPersisted = await navigator.storage.persisted();
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Abre la base de datos IndexedDB dedicada a los formularios S-89.
 */
export function openS89IndexedDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB no está disponible en este navegador.'));
  }

  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_WEEK_SLIPS)) {
          const weekStore = db.createObjectStore(STORE_WEEK_SLIPS, { keyPath: 'weekId' });
          weekStore.createIndex('congregationId', 'congregationId', { unique: false });
          weekStore.createIndex('weekStartDate', 'weekStartDate', { unique: false });
          weekStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_SLIP_OVERRIDES)) {
          const overrideStore = db.createObjectStore(STORE_SLIP_OVERRIDES, { keyPath: 'slipId' });
          overrideStore.createIndex('weekId', 'weekId', { unique: false });
          overrideStore.createIndex('studentId', 'studentId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_FILLED_PDFS)) {
          const pdfStore = db.createObjectStore(STORE_FILLED_PDFS, { keyPath: 'cacheKey' });
          pdfStore.createIndex('weekId', 'weekId', { unique: false });
        }
      };

      request.onsuccess = (event: Event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbOpenPromise = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (event: Event) => {
        dbOpenPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      dbOpenPromise = null;
      reject(err);
    }
  });

  return dbOpenPromise;
}

function sealWeekRecord(record: S89WeekOfflineRecord): S89WeekOfflineRecord {
  const copy: S89WeekOfflineRecord = { ...record };
  if (copy.slips) {
    try {
      copy.encryptedSlips = encryptPinAtRest(JSON.stringify(copy.slips));
      delete copy.slips;
    } catch {}
  }
  return copy;
}

function unsealWeekRecord(raw: S89WeekOfflineRecord): S89WeekOfflineRecord {
  if (!raw || typeof raw !== 'object') return raw;
  const copy: S89WeekOfflineRecord = { ...raw };
  if (!copy.slips && copy.encryptedSlips) {
    try {
      const decrypted = decryptPinAtRest(copy.encryptedSlips);
      if (decrypted) {
        copy.slips = JSON.parse(decrypted);
      }
    } catch {
      copy.slips = [];
    }
  }
  return copy;
}

/**
 * Guarda de forma persistente las boletas S-89 de una semana en IndexedDB y las sincroniza con el Service Worker.
 */
export async function saveS89WeekSlipsToIndexedDb(
  weekId: string,
  slips: S89Slip[],
  meta?: {
    congregationId?: string;
    weekStartDate?: string;
    weekEndDate?: string;
  }
): Promise<void> {
  if (!weekId) return;

  const record: S89WeekOfflineRecord = {
    weekId,
    congregationId: (meta?.congregationId || localStorage.getItem('kongre_congregation_number') || 'LOCAL').trim(),
    weekStartDate: meta?.weekStartDate || slips[0]?.date || weekId,
    weekEndDate: meta?.weekEndDate || '',
    slipCount: slips.length,
    updatedAt: new Date().toISOString(),
    slips,
  };

  const sealed = sealWeekRecord(record);

  try {
    const db = await openS89IndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_WEEK_SLIPS, 'readwrite');
      const store = tx.objectStore(STORE_WEEK_SLIPS);
      const req = store.put(sealed);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      localStorage.setItem(`kongre_s89_idb_fallback_${weekId}`, JSON.stringify(sealed));
    } catch {}
  }

  // Sincronizar en paralelo con el Service Worker para soporte de caché offline en segundo plano
  syncS89SlipsWithServiceWorker(weekId, slips, record.weekStartDate).catch(() => {});
}

/**
 * Recupera las boletas S-89 de una semana desde IndexedDB (o desde el endpoint virtual del Service Worker si aplica),
 * fusionando cualquier estado de entrega o confirmación registrado sin conexión.
 */
export async function getS89WeekSlipsFromIndexedDb(weekId: string): Promise<S89Slip[]> {
  if (!weekId) return [];

  let slips: S89Slip[] = [];

  try {
    const db = await openS89IndexedDb();
    const rawRecord = await new Promise<S89WeekOfflineRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_WEEK_SLIPS, 'readonly');
      const store = tx.objectStore(STORE_WEEK_SLIPS);
      const req = store.get(weekId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (rawRecord) {
      const unsealed = unsealWeekRecord(rawRecord);
      if (Array.isArray(unsealed.slips)) {
        slips = unsealed.slips;
      }
    }
  } catch {
    try {
      const fallback = localStorage.getItem(`kongre_s89_idb_fallback_${weekId}`);
      if (fallback) {
        const unsealed = unsealWeekRecord(JSON.parse(fallback));
        if (Array.isArray(unsealed.slips)) {
          slips = unsealed.slips;
        }
      }
    } catch {}
  }

  // Si aún está vacío, intentar recuperar desde la caché del Service Worker
  if (slips.length === 0 && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const res = await fetch(`/__offline__/s89/slips?weekId=${encodeURIComponent(weekId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.slips)) {
          slips = data.slips;
        }
      }
    } catch {}
  }

  if (slips.length === 0) return [];

  // Fusionar overrides locales de estado de entrega/confirmación
  const overrides = await getS89SlipOverridesForWeek(weekId);
  return slips.map((slip) => {
    const ov = overrides[slip.id];
    if (!ov) return slip;
    return {
      ...slip,
      deliveredStatus: ov.deliveredStatus || slip.deliveredStatus,
    };
  });
}

/**
 * Guarda el estado de entrega/confirmación de una boleta S-89 individual en IndexedDB para persistencia offline.
 */
export async function saveS89SlipOverrideToIndexedDb(
  slipId: string,
  weekId: string,
  studentId: string,
  deliveredStatus: 'pendiente' | 'entregada' | 'confirmada',
  counselNotes?: string
): Promise<void> {
  const override: S89SlipOverrideRecord = {
    slipId,
    weekId,
    studentId,
    deliveredStatus,
    deliveredAt: deliveredStatus === 'confirmada' ? new Date().toISOString() : undefined,
    counselNotes,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openS89IndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SLIP_OVERRIDES, 'readwrite');
      const store = tx.objectStore(STORE_SLIP_OVERRIDES);
      const req = store.put(override);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      localStorage.setItem(`kongre_s89_override_${slipId}`, JSON.stringify(override));
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kongre_s89_offline_updated', { detail: { weekId, slipId } }));
  }
}

/**
 * Obtiene todos los overrides de estado de entrega S-89 para una semana específica.
 */
export async function getS89SlipOverridesForWeek(
  weekId: string
): Promise<Record<string, S89SlipOverrideRecord>> {
  const map: Record<string, S89SlipOverrideRecord> = {};
  if (!weekId) return map;

  try {
    const db = await openS89IndexedDb();
    const list = await new Promise<S89SlipOverrideRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SLIP_OVERRIDES, 'readonly');
      const store = tx.objectStore(STORE_SLIP_OVERRIDES);
      const index = store.index('weekId');
      const req = index.getAll(weekId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const item of list) {
      map[item.slipId] = item;
    }
  } catch {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kongre_s89_override_')) {
          const parsed: S89SlipOverrideRecord = JSON.parse(localStorage.getItem(key) || '{}');
          if (parsed && parsed.weekId === weekId && parsed.slipId) {
            map[parsed.slipId] = parsed;
          }
        }
      }
    } catch {}
  }

  return map;
}

/**
 * Almacena en IndexedDB el archivo PDF S-89 ya rellenado para descarga o impresión instantánea sin conexión.
 */
export async function saveGeneratedS89PdfToIndexedDb(
  weekId: string,
  layout: string,
  bytes: Uint8Array,
  fileName: string,
  slipCount: number
): Promise<void> {
  if (!weekId || !bytes) return;
  const cacheKey = `${weekId}__${layout}`;
  const record: S89FilledPdfCacheRecord = {
    cacheKey,
    weekId,
    layout,
    fileName,
    bytes,
    slipCount,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await openS89IndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FILLED_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_FILLED_PDFS);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

/**
 * Obtiene un PDF S-89 previamente generado desde IndexedDB para uso offline inmediato.
 */
export async function getGeneratedS89PdfFromIndexedDb(
  weekId: string,
  layout = 'default'
): Promise<S89FilledPdfCacheRecord | null> {
  if (!weekId) return null;
  const cacheKey = `${weekId}__${layout}`;

  try {
    const db = await openS89IndexedDb();
    return await new Promise<S89FilledPdfCacheRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_FILLED_PDFS, 'readonly');
      const store = tx.objectStore(STORE_FILLED_PDFS);
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        if (!req.result) {
          resolve(null);
          return;
        }
        const rec = req.result as S89FilledPdfCacheRecord;
        resolve({
          ...rec,
          bytes:
            rec.bytes instanceof Uint8Array
              ? rec.bytes
              : new Uint8Array(rec.bytes as unknown as ArrayBuffer),
        });
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Obtiene estadísticas del almacenamiento offline de formularios S-89 en IndexedDB.
 */
export async function getS89OfflineStorageStats(): Promise<S89OfflineStorageStats> {
  let isPersistentGranted = false;
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      isPersistentGranted = await navigator.storage.persisted();
    } catch {}
  }

  try {
    const db = await openS89IndexedDb();
    return await new Promise<S89OfflineStorageStats>((resolve) => {
      const tx = db.transaction([STORE_WEEK_SLIPS, STORE_FILLED_PDFS], 'readonly');
      const weekStore = tx.objectStore(STORE_WEEK_SLIPS);
      const pdfStore = tx.objectStore(STORE_FILLED_PDFS);

      const weeksReq = weekStore.getAll();
      const pdfsReq = pdfStore.count();

      let weekRecords: S89WeekOfflineRecord[] = [];
      let pdfCount = 0;

      weeksReq.onsuccess = () => {
        weekRecords = weeksReq.result || [];
      };
      pdfsReq.onsuccess = () => {
        pdfCount = pdfsReq.result || 0;
      };

      tx.oncomplete = () => {
        const totalCachedSlips = weekRecords.reduce((acc, r) => acc + (r.slipCount || 0), 0);
        const sortedDates = weekRecords
          .map((r) => r.updatedAt)
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a));

        resolve({
          isPersistentGranted,
          cachedWeeksCount: weekRecords.length,
          totalCachedSlips,
          cachedPdfsCount: pdfCount,
          lastSyncedAt: sortedDates[0] || null,
        });
      };

      tx.onerror = () => {
        resolve({
          isPersistentGranted,
          cachedWeeksCount: 0,
          totalCachedSlips: 0,
          cachedPdfsCount: 0,
          lastSyncedAt: null,
        });
      };
    });
  } catch {
    return {
      isPersistentGranted,
      cachedWeeksCount: 0,
      totalCachedSlips: 0,
      cachedPdfsCount: 0,
      lastSyncedAt: null,
    };
  }
}

/**
 * Envía las boletas S-89 al Service Worker activo para que las respalde en su propio almacén IndexedDB
 * y registre la etiqueta de Background Sync ('kongre-sync-s89-forms').
 */
export async function syncS89SlipsWithServiceWorker(
  weekId: string,
  slips: S89Slip[],
  weekStartDate?: string
): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const activeWorker = reg.active || navigator.serviceWorker.controller;
    if (activeWorker) {
      activeWorker.postMessage({
        type: 'SYNC_S89_OFFLINE_DATA',
        payload: {
          weekId,
          weekStartDate: weekStartDate || slips[0]?.date || weekId,
          slips,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if ('sync' in reg && (reg as any).sync?.register) {
      await (reg as any).sync.register('kongre-sync-s89-forms').catch(() => {});
    }
  } catch {}
}
