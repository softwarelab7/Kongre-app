// src/services/granularFirestoreService.ts
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, markFirestoreQuotaExceeded, isQuotaError } from '../firebase/config';
import {
  Publisher,
  WeekSchedule,
  Territory,
  CongregationNotice,
  AccountTransaction,
  QuarterlyAudit,
  LiteratureItem,
  LiteratureSpecialOrder,
  LiteratureGroupDistribution,
  LiteratureInventoryRecord,
  CongregationSettings,
  PreachingGroup,
  CustomDuty,
} from '../types';
import { sanitizeForFirestore, formatCanonicalCongregationId } from '../utils/theocraticSecurity';

export interface GranularSyncStats {
  publishersCount: number;
  weeksCount: number;
  territoriesCount: number;
  noticesCount: number;
  accountsExists: boolean;
  literatureExists: boolean;
  isMigrated: boolean;
  lastSyncAt: string | null;
}

export interface GranularSyncCallbacks {
  onPublishersUpdate?: (publishers: Publisher[]) => void;
  onWeeksUpdate?: (weeks: WeekSchedule[]) => void;
  onTerritoriesUpdate?: (territories: Territory[]) => void;
  onNoticesUpdate?: (notices: CongregationNotice[]) => void;
  onAccountsUpdate?: (transactions: AccountTransaction[], audits: QuarterlyAudit[]) => void;
  onLiteratureUpdate?: (data: {
    items?: LiteratureItem[];
    orders?: LiteratureSpecialOrder[];
    distributions?: LiteratureGroupDistribution[];
    inventory?: LiteratureInventoryRecord[];
  }) => void;
  onMainCongregationUpdate?: (data: any) => void;
  onSyncStatusChange?: (status: 'synced' | 'saving' | 'offline' | 'error') => void;
  onMigrationComplete?: (counts: Record<string, number>) => void;
  onError?: (err: any) => void;
}

// Canal de difusión para sincronización instantánea entre pestañas
const BROADCAST_CHANNEL_NAME = 'kongre_granular_sync_v4';

const notifyBroadcast = (action: string, congId: string, entity: string, entityId?: string) => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({
        action,
        congId,
        entity,
        entityId,
        timestamp: new Date().toISOString(),
      });
      bc.close();
    } catch {
      // ignore
    }
  }
};

/**
 * Normaliza y valida el ID canónico de la congregación
 */
export const resolveSafeCongId = (congId?: string | null): string => {
  if (!congId) return '';
  const clean = congId.trim().toUpperCase();
  if (['1001', 'CENTRAL', 'MAIN', 'ID'].includes(clean) || clean.length < 3) {
    return '';
  }
  return formatCanonicalCongregationId(clean);
};

// =============================================================================
// ESCRITURA Y MUTACIÓN GRANULAR (CERO SOBREESCRITURAS ENTRE ANCIANOS)
// =============================================================================

/**
 * Guarda o actualiza un único publicador en la subcolección /publishers/{pubId}
 */
export const savePublisherDoc = async (congId: string, publisher: Publisher): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !publisher?.id) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const pubRef = doc(db, 'congregations', safeId, 'publishers', String(publisher.id));
    const sanitized = sanitizeForFirestore({
      ...publisher,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(pubRef, sanitized, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'publishers', String(publisher.id));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Elimina un publicador de la subcolección /publishers/{pubId}
 */
export const deletePublisherDoc = async (congId: string, publisherId: string): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !publisherId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const pubRef = doc(db, 'congregations', safeId, 'publishers', String(publisherId));
    await deleteDoc(pubRef);
    notifyBroadcast('DELETE', safeId, 'publishers', String(publisherId));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda publicadores en lotes usando writeBatch (máx 400 por batch)
 */
export const savePublishersBatch = async (congId: string, publishers: Publisher[]): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !publishers || publishers.length === 0) return;
  if (isFirestoreQuotaExceeded()) return;

  const CHUNK_SIZE = 400;
  for (let i = 0; i < publishers.length; i += CHUNK_SIZE) {
    const chunk = publishers.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((pub) => {
      if (pub.id) {
        const ref = doc(db, 'congregations', safeId, 'publishers', String(pub.id));
        batch.set(ref, sanitizeForFirestore({ ...pub, updatedAt: new Date().toISOString() }), { merge: true });
      }
    });
    await batch.commit();
  }
  notifyBroadcast('BATCH_UPDATE', safeId, 'publishers');
};

/**
 * Guarda o actualiza una semana específica de reunión en /weeks/{weekId}
 */
export const saveWeekDoc = async (congId: string, week: WeekSchedule): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !week?.id) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const weekRef = doc(db, 'congregations', safeId, 'weeks', String(week.id));
    const sanitized = sanitizeForFirestore({
      ...week,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(weekRef, sanitized, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'weeks', String(week.id));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Elimina una semana de /weeks/{weekId}
 */
export const deleteWeekDoc = async (congId: string, weekId: string): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !weekId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const weekRef = doc(db, 'congregations', safeId, 'weeks', String(weekId));
    await deleteDoc(weekRef);
    notifyBroadcast('DELETE', safeId, 'weeks', String(weekId));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda semanas en lote con writeBatch
 */
export const saveWeeksBatch = async (congId: string, weeks: WeekSchedule[]): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !weeks || weeks.length === 0) return;
  if (isFirestoreQuotaExceeded()) return;

  const CHUNK_SIZE = 400;
  for (let i = 0; i < weeks.length; i += CHUNK_SIZE) {
    const chunk = weeks.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((week) => {
      if (week.id) {
        const ref = doc(db, 'congregations', safeId, 'weeks', String(week.id));
        batch.set(ref, sanitizeForFirestore({ ...week, updatedAt: new Date().toISOString() }), { merge: true });
      }
    });
    await batch.commit();
  }
  notifyBroadcast('BATCH_UPDATE', safeId, 'weeks');
};

/**
 * Guarda o actualiza un territorio en /territories/{terrId}
 */
export const saveTerritoryDoc = async (congId: string, territory: Territory): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !territory?.id) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const terrRef = doc(db, 'congregations', safeId, 'territories', String(territory.id));
    const sanitized = sanitizeForFirestore({
      ...territory,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(terrRef, sanitized, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'territories', String(territory.id));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Elimina un territorio de /territories/{terrId}
 */
export const deleteTerritoryDoc = async (congId: string, terrId: string): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !terrId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const terrRef = doc(db, 'congregations', safeId, 'territories', String(terrId));
    await deleteDoc(terrRef);
    notifyBroadcast('DELETE', safeId, 'territories', String(terrId));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda territorios en lote
 */
export const saveTerritoriesBatch = async (congId: string, territories: Territory[]): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !territories || territories.length === 0) return;
  if (isFirestoreQuotaExceeded()) return;

  const CHUNK_SIZE = 400;
  for (let i = 0; i < territories.length; i += CHUNK_SIZE) {
    const chunk = territories.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((terr) => {
      if (terr.id) {
        const ref = doc(db, 'congregations', safeId, 'territories', String(terr.id));
        batch.set(ref, sanitizeForFirestore({ ...terr, updatedAt: new Date().toISOString() }), { merge: true });
      }
    });
    await batch.commit();
  }
  notifyBroadcast('BATCH_UPDATE', safeId, 'territories');
};

/**
 * Guarda o actualiza un anuncio en /notices/{noticeId}
 */
export const saveNoticeDoc = async (congId: string, notice: CongregationNotice): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !notice?.id) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const noticeRef = doc(db, 'congregations', safeId, 'notices', String(notice.id));
    const sanitized = sanitizeForFirestore({
      ...notice,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(noticeRef, sanitized, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'notices', String(notice.id));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Elimina un anuncio de /notices/{noticeId}
 */
export const deleteNoticeDoc = async (congId: string, noticeId: string): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !noticeId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const noticeRef = doc(db, 'congregations', safeId, 'notices', String(noticeId));
    await deleteDoc(noticeRef);
    notifyBroadcast('DELETE', safeId, 'notices', String(noticeId));
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda transacciones y auditorías en la subcolección /accounts/ledger
 */
export const saveAccountsData = async (
  congId: string,
  transactions: AccountTransaction[],
  audits: QuarterlyAudit[]
): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const accRef = doc(db, 'congregations', safeId, 'accounts', 'ledger');
    const payload = sanitizeForFirestore({
      transactions: transactions || [],
      quarterlyAudits: audits || [],
      updatedAt: new Date().toISOString(),
    });
    await setDoc(accRef, payload, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'accounts', 'ledger');
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda literatura en /literature/inventory
 */
export const saveLiteratureData = async (
  congId: string,
  items: LiteratureItem[],
  orders: LiteratureSpecialOrder[],
  distributions: LiteratureGroupDistribution[],
  records: LiteratureInventoryRecord[]
): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const litRef = doc(db, 'congregations', safeId, 'literature', 'inventory');
    const payload = sanitizeForFirestore({
      literatureItems: items || [],
      specialOrders: orders || [],
      groupDistributions: distributions || [],
      inventoryRecords: records || [],
      updatedAt: new Date().toISOString(),
    });
    await setDoc(litRef, payload, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'literature', 'inventory');
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda ajustes y metadatos en el documento principal /congregations/{congId}
 * (NO sobrescribe subcolecciones)
 */
export const saveCongregationSettings = async (
  congId: string,
  settings: CongregationSettings,
  extra?: Record<string, any>
): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const congRef = doc(db, 'congregations', safeId);
    const payload = sanitizeForFirestore({
      settings,
      ...(extra || {}),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(congRef, payload, { merge: true });

    const unhyphenated = safeId.replace(/-/g, '');
    if (unhyphenated !== safeId && unhyphenated.length >= 3) {
      await setDoc(doc(db, 'congregations', unhyphenated), payload, { merge: true }).catch(() => {});
    }

    notifyBroadcast('UPDATE', safeId, 'settings');
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda grupos de servicio en el documento principal
 */
export const savePreachingGroupsDoc = async (congId: string, groups: PreachingGroup[]): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const congRef = doc(db, 'congregations', safeId);
    const payload = sanitizeForFirestore({
      preachingGroups: groups || [],
      updatedAt: new Date().toISOString(),
    });
    await setDoc(congRef, payload, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'preachingGroups');
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

/**
 * Guarda deberes personalizados en el documento principal
 */
export const saveCustomDutiesDoc = async (congId: string, duties: CustomDuty[]): Promise<void> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) return;
  if (isFirestoreQuotaExceeded()) return;

  try {
    const congRef = doc(db, 'congregations', safeId);
    const payload = sanitizeForFirestore({
      customDuties: duties || [],
      updatedAt: new Date().toISOString(),
    });
    await setDoc(congRef, payload, { merge: true });
    notifyBroadcast('UPDATE', safeId, 'customDuties');
  } catch (err: any) {
    if (isQuotaError(err)) {
      await markFirestoreQuotaExceeded();
    }
    throw err;
  }
};

// =============================================================================
// DIAGNÓSTICO Y MIGRACIÓN AUTOMÁTICA DE MONOLÍTICO A SUBCOLECCIONES
// =============================================================================

/**
 * Verifica el estado actual de las subcolecciones para determinar si ya está migrado
 */
export const checkSubcollectionsStatus = async (congId: string): Promise<GranularSyncStats> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || isFirestoreQuotaExceeded()) {
    return {
      publishersCount: 0,
      weeksCount: 0,
      territoriesCount: 0,
      noticesCount: 0,
      accountsExists: false,
      literatureExists: false,
      isMigrated: false,
      lastSyncAt: null,
    };
  }

  try {
    const [pubSnap, weekSnap, terrSnap, notSnap, accSnap, litSnap, mainSnap] = await Promise.all([
      getDocs(collection(db, 'congregations', safeId, 'publishers')).catch(() => null),
      getDocs(collection(db, 'congregations', safeId, 'weeks')).catch(() => null),
      getDocs(collection(db, 'congregations', safeId, 'territories')).catch(() => null),
      getDocs(collection(db, 'congregations', safeId, 'notices')).catch(() => null),
      getDoc(doc(db, 'congregations', safeId, 'accounts', 'ledger')).catch(() => null),
      getDoc(doc(db, 'congregations', safeId, 'literature', 'inventory')).catch(() => null),
      getDoc(doc(db, 'congregations', safeId)).catch(() => null),
    ]);

    const pubsCount = pubSnap ? pubSnap.size : 0;
    const weeksCount = weekSnap ? weekSnap.size : 0;
    const terrsCount = terrSnap ? terrSnap.size : 0;
    const notsCount = notSnap ? notSnap.size : 0;
    const accountsExists = Boolean(accSnap && accSnap.exists());
    const literatureExists = Boolean(litSnap && litSnap.exists());

    const mainData = mainSnap && mainSnap.exists() ? mainSnap.data() : null;
    const hasSchemaV2 = mainData?.schemaVersion === 2 || mainData?.syncMode === 'granular';
    const hasAnySubcollectionDocs = pubsCount > 0 || weeksCount > 0 || terrsCount > 0;

    return {
      publishersCount: pubsCount,
      weeksCount,
      territoriesCount: terrsCount,
      noticesCount: notsCount,
      accountsExists,
      literatureExists,
      isMigrated: Boolean(hasSchemaV2 || hasAnySubcollectionDocs),
      lastSyncAt: mainData?.updatedAt || null,
    };
  } catch (err) {
    console.warn('Aviso verificando subcolecciones:', err);
    return {
      publishersCount: 0,
      weeksCount: 0,
      territoriesCount: 0,
      noticesCount: 0,
      accountsExists: false,
      literatureExists: false,
      isMigrated: false,
      lastSyncAt: null,
    };
  }
};

/**
 * Migra los arrays del documento monolítico antiguo hacia subcolecciones granulares
 */
export const migrateMonolithicToSubcollections = async (
  congId: string,
  monolithicData: any
): Promise<{ success: boolean; message: string; counts: Record<string, number> }> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId || !monolithicData) {
    return { success: false, message: 'ID o datos no válidos para la migración', counts: {} };
  }
  if (isFirestoreQuotaExceeded()) {
    return { success: false, message: 'Cuota de Firestore pausada por límite diario', counts: {} };
  }

  const counts: Record<string, number> = {
    publishers: 0,
    weeks: 0,
    territories: 0,
    notices: 0,
  };

  try {
    // 1. Migrar publicadores
    if (Array.isArray(monolithicData.publishers) && monolithicData.publishers.length > 0) {
      await savePublishersBatch(safeId, monolithicData.publishers);
      counts.publishers = monolithicData.publishers.length;
    }

    // 2. Migrar semanas
    if (Array.isArray(monolithicData.weeks) && monolithicData.weeks.length > 0) {
      await saveWeeksBatch(safeId, monolithicData.weeks);
      counts.weeks = monolithicData.weeks.length;
    }

    // 3. Migrar territorios
    if (Array.isArray(monolithicData.territories) && monolithicData.territories.length > 0) {
      await saveTerritoriesBatch(safeId, monolithicData.territories);
      counts.territories = monolithicData.territories.length;
    }

    // 4. Migrar anuncios
    if (Array.isArray(monolithicData.notices) && monolithicData.notices.length > 0) {
      for (const notice of monolithicData.notices) {
        if (notice.id) await saveNoticeDoc(safeId, notice);
      }
      counts.notices = monolithicData.notices.length;
    }

    // 5. Migrar cuentas y auditorías
    if (
      (Array.isArray(monolithicData.transactions) && monolithicData.transactions.length > 0) ||
      (Array.isArray(monolithicData.quarterlyAudits) && monolithicData.quarterlyAudits.length > 0)
    ) {
      await saveAccountsData(
        safeId,
        monolithicData.transactions || [],
        monolithicData.quarterlyAudits || []
      );
    }

    // 6. Migrar literatura
    if (
      (Array.isArray(monolithicData.literatureItems) && monolithicData.literatureItems.length > 0) ||
      (Array.isArray(monolithicData.specialOrders) && monolithicData.specialOrders.length > 0)
    ) {
      await saveLiteratureData(
        safeId,
        monolithicData.literatureItems || [],
        monolithicData.specialOrders || [],
        monolithicData.groupDistributions || [],
        monolithicData.inventoryRecords || []
      );
    }

    // 7. Marcar documento raíz como migrado a schemaVersion 2
    const nowISO = new Date().toISOString();
    await setDoc(
      doc(db, 'congregations', safeId),
      {
        schemaVersion: 2,
        syncMode: 'granular',
        subcollectionsMigratedAt: nowISO,
        updatedAt: nowISO,
      },
      { merge: true }
    );

    const unhyphenated = safeId.replace(/-/g, '');
    if (unhyphenated !== safeId && unhyphenated.length >= 3) {
      await setDoc(
        doc(db, 'congregations', unhyphenated),
        {
          schemaVersion: 2,
          syncMode: 'granular',
          subcollectionsMigratedAt: nowISO,
          updatedAt: nowISO,
        },
        { merge: true }
      ).catch(() => {});
    }

    return {
      success: true,
      message: `Migración exitosa: ${counts.publishers} publicadores, ${counts.weeks} semanas, ${counts.territories} territorios.`,
      counts,
    };
  } catch (err: any) {
    console.error('Error migrando datos monolíticos a subcolecciones:', err);
    return {
      success: false,
      message: err?.message || 'Error durante la migración a subcolecciones',
      counts,
    };
  }
};

// =============================================================================
// LISTENERS EN TIEMPO REAL (REACTIVOS Y MODULARES)
// =============================================================================

/**
 * Establece los listeners en tiempo real para las subcolecciones granulares y el documento raíz.
 * Retorna una función de limpieza para cancelar todos los observadores.
 */
export const setupGranularListeners = (
  congId: string,
  callbacks: GranularSyncCallbacks
): Unsubscribe => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) {
    return () => {};
  }

  const unsubs: Unsubscribe[] = [];
  let isMigrating = false;

  const handleQuota = (err: any) => {
    if (isQuotaError(err)) {
      markFirestoreQuotaExceeded();
      callbacks.onSyncStatusChange?.('offline');
    } else {
      console.warn('Aviso en listener Firestore:', err);
      callbacks.onSyncStatusChange?.('error');
    }
  };

  try {
    // 1. Listener Documento Principal (Settings, grupos, metadatos y fallback para migración inicial)
    const mainRef = doc(db, 'congregations', safeId);
    unsubs.push(
      onSnapshot(
        mainRef,
        async (docSnap) => {
          if (docSnap.metadata?.hasPendingWrites) return;

          if (!docSnap.exists()) {
            return;
          }

          const data = docSnap.data();
          callbacks.onMainCongregationUpdate?.(data);

          // Si el documento raíz tiene datos monolíticos y aún no tiene schemaVersion 2,
          // verificar e iniciar migración automática transparente en segundo plano
          if (
            !isMigrating &&
            data?.schemaVersion !== 2 &&
            ((data?.publishers && data.publishers.length > 0) ||
              (data?.weeks && data.weeks.length > 0) ||
              (data?.territories && data.territories.length > 0))
          ) {
            isMigrating = true;
            try {
              const status = await checkSubcollectionsStatus(safeId);
              if (!status.isMigrated || status.publishersCount === 0) {
                const res = await migrateMonolithicToSubcollections(safeId, data);
                if (res.success) {
                  callbacks.onMigrationComplete?.(res.counts);
                }
              }
            } catch (migErr) {
              console.warn('Aviso en migración automática de subcolecciones:', migErr);
            } finally {
              isMigrating = false;
            }
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );

    // 2. Listener Subcolección Publicadores (/congregations/{id}/publishers)
    const pubColRef = collection(db, 'congregations', safeId, 'publishers');
    unsubs.push(
      onSnapshot(
        pubColRef,
        (snap) => {
          if (snap.metadata?.hasPendingWrites) return;
          if (snap.empty) return;

          const pubs: Publisher[] = [];
          snap.forEach((d) => {
            pubs.push({ ...(d.data() as Publisher), id: d.id });
          });

          if (pubs.length > 0 && callbacks.onPublishersUpdate) {
            callbacks.onPublishersUpdate(pubs);
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );

    // 3. Listener Subcolección Semanas (/congregations/{id}/weeks)
    const weekColRef = collection(db, 'congregations', safeId, 'weeks');
    unsubs.push(
      onSnapshot(
        weekColRef,
        (snap) => {
          if (snap.metadata?.hasPendingWrites) return;
          if (snap.empty) return;

          const weeks: WeekSchedule[] = [];
          snap.forEach((d) => {
            weeks.push({ ...(d.data() as WeekSchedule), id: d.id });
          });

          if (weeks.length > 0 && callbacks.onWeeksUpdate) {
            callbacks.onWeeksUpdate(weeks);
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );

    // 4. Listener Subcolección Territorios (/congregations/{id}/territories)
    const terrColRef = collection(db, 'congregations', safeId, 'territories');
    unsubs.push(
      onSnapshot(
        terrColRef,
        (snap) => {
          if (snap.metadata?.hasPendingWrites) return;
          if (snap.empty) return;

          const territories: Territory[] = [];
          snap.forEach((d) => {
            territories.push({ ...(d.data() as Territory), id: d.id });
          });

          if (territories.length > 0 && callbacks.onTerritoriesUpdate) {
            callbacks.onTerritoriesUpdate(territories);
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );

    // 5. Listener Subcolección Tablero de Anuncios (/congregations/{id}/notices)
    const notColRef = collection(db, 'congregations', safeId, 'notices');
    unsubs.push(
      onSnapshot(
        notColRef,
        (snap) => {
          if (snap.metadata?.hasPendingWrites) return;
          if (snap.empty) return;

          const notices: CongregationNotice[] = [];
          snap.forEach((d) => {
            notices.push({ ...(d.data() as CongregationNotice), id: d.id });
          });

          if (notices.length > 0 && callbacks.onNoticesUpdate) {
            callbacks.onNoticesUpdate(notices);
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );

    // 6. Listener Subcolección Cuentas (/congregations/{id}/accounts/ledger)
    const accDocRef = doc(db, 'congregations', safeId, 'accounts', 'ledger');
    unsubs.push(
      onSnapshot(
        accDocRef,
        (docSnap) => {
          if (docSnap.metadata?.hasPendingWrites) return;
          if (!docSnap.exists()) return;

          const data = docSnap.data();
          if (callbacks.onAccountsUpdate && (data?.transactions || data?.quarterlyAudits)) {
            callbacks.onAccountsUpdate(data.transactions || [], data.quarterlyAudits || []);
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );

    // 7. Listener Subcolección Literatura (/congregations/{id}/literature/inventory)
    const litDocRef = doc(db, 'congregations', safeId, 'literature', 'inventory');
    unsubs.push(
      onSnapshot(
        litDocRef,
        (docSnap) => {
          if (docSnap.metadata?.hasPendingWrites) return;
          if (!docSnap.exists()) return;

          const data = docSnap.data();
          if (callbacks.onLiteratureUpdate) {
            callbacks.onLiteratureUpdate({
              items: data.literatureItems,
              orders: data.specialOrders,
              distributions: data.groupDistributions,
              inventory: data.inventoryRecords,
            });
          }
          callbacks.onSyncStatusChange?.('synced');
        },
        handleQuota
      )
    );
  } catch (err: any) {
    handleQuota(err);
  }

  // Escuchar eventos en vivo emitidos por otras pestañas en el mismo navegador
  let broadcastCleanup: (() => void) | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.congId === safeId) {
          // Un cambio local fue emitido en otra pestaña
          callbacks.onSyncStatusChange?.('synced');
        }
      };
      broadcastCleanup = () => {
        try {
          bc.close();
        } catch {}
      };
    } catch {}
  }

  return () => {
    unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    if (broadcastCleanup) broadcastCleanup();
  };
};

/**
 * Descarga y consolida todos los datos desde subcolecciones y documento principal
 * para crear una copia de respaldo completa en formato JSON
 */
export const fetchFullGranularCongregationData = async (congId: string): Promise<any> => {
  const safeId = resolveSafeCongId(congId);
  if (!safeId) return null;

  try {
    const [mainSnap, pubSnap, weekSnap, terrSnap, notSnap, accSnap, litSnap] = await Promise.all([
      getDoc(doc(db, 'congregations', safeId)),
      getDocs(collection(db, 'congregations', safeId, 'publishers')).catch(() => null),
      getDocs(collection(db, 'congregations', safeId, 'weeks')).catch(() => null),
      getDocs(collection(db, 'congregations', safeId, 'territories')).catch(() => null),
      getDocs(collection(db, 'congregations', safeId, 'notices')).catch(() => null),
      getDoc(doc(db, 'congregations', safeId, 'accounts', 'ledger')).catch(() => null),
      getDoc(doc(db, 'congregations', safeId, 'literature', 'inventory')).catch(() => null),
    ]);

    const baseData = mainSnap.exists() ? mainSnap.data() : {};

    const publishers: Publisher[] = [];
    if (pubSnap) {
      pubSnap.forEach((d) => publishers.push({ ...(d.data() as Publisher), id: d.id }));
    }

    const weeks: WeekSchedule[] = [];
    if (weekSnap) {
      weekSnap.forEach((d) => weeks.push({ ...(d.data() as WeekSchedule), id: d.id }));
    }

    const territories: Territory[] = [];
    if (terrSnap) {
      terrSnap.forEach((d) => territories.push({ ...(d.data() as Territory), id: d.id }));
    }

    const notices: CongregationNotice[] = [];
    if (notSnap) {
      notSnap.forEach((d) => notices.push({ ...(d.data() as CongregationNotice), id: d.id }));
    }

    const accData = accSnap && accSnap.exists() ? accSnap.data() : {};
    const litData = litSnap && litSnap.exists() ? litSnap.data() : {};

    return {
      ...baseData,
      publishers: publishers.length > 0 ? publishers : baseData.publishers || [],
      weeks: weeks.length > 0 ? weeks : baseData.weeks || [],
      territories: territories.length > 0 ? territories : baseData.territories || [],
      notices: notices.length > 0 ? notices : baseData.notices || [],
      transactions: accData.transactions || baseData.transactions || [],
      quarterlyAudits: accData.quarterlyAudits || baseData.quarterlyAudits || [],
      literatureItems: litData.literatureItems || baseData.literatureItems || [],
      specialOrders: litData.specialOrders || baseData.specialOrders || [],
      groupDistributions: litData.groupDistributions || baseData.groupDistributions || [],
      inventoryRecords: litData.inventoryRecords || baseData.inventoryRecords || [],
    };
  } catch (err) {
    console.error('Error descargando datos granulares de la congregación:', err);
    throw err;
  }
};
