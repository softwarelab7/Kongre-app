/**
 * src/services/supabaseSyncService.ts
 * Servicio de sincronización teocrática de Cero Conocimiento (Zero-Knowledge) para Kongre2.
 * Los datos se cifran con AES-256-GCM (PBKDF2) en el dispositivo antes de ser transmitidos a Supabase.
 * Soporta sincronización bidireccional continua, cola offline y resolución de conflictos.
 */

import {
  syncPull,
  syncMeta,
  syncPush,
  syncDelete,
  syncVerifyPersonalPin,
  describeSyncError,
  type PersonalPinEntry,
  type VerifiedPublisher,
} from './syncApi';
import { encryptForSupabase, decryptFromSupabase, normalizePin, normalizePinV2 } from '../utils/crypto';
import {
  hashPersonalPin,
  encryptPinAtRest,
  decryptPinAtRest,
  isEncryptedPinAtRest,
  sanitizeInvitationsForPublicPayload,
  hashInvitationCode,
  isSafeDemoMode,
  packageDepartmentCompartment,
  unpackageDepartmentCompartment,
  type EncryptedCompartmentEnvelope,
} from '../utils/theocraticSecurity';
import {
  Publisher,
  Gender,
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
  OutgoingSpeakerAssignment,
  FieldServiceMeeting,
  CartLocation,
  CartShift,
  MonthlyServiceReport,
  CircuitOverseerVisit,
  MemorialPlan,
  TheocraticAssembly,
  CongregationEvent,
  AccountLinkRequest,
  ClmPrograma,
  HospitalityHost,
  Breaker,
  MaintenanceSheet,
  AuxPioneerRequest,
  BranchReportS1,
} from '../types';

export function normalizeCongregationId(rawId: string): string {
  return String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

/**
 * Determina si la aplicación o congregación actual está en modo de demostración
 * para desactivar absolutamente cualquier intento de conexión con Supabase.
 */
export function isDemoModeActive(congregationId?: string): boolean {
  if (typeof window !== 'undefined') {
    if (
      isSafeDemoMode() ||
      localStorage.getItem('kongre_demo_mode') === 'true' ||
      sessionStorage.getItem('kongre_demo_mode') === 'true' ||
      localStorage.getItem('kongre_is_guest') === 'true'
    ) {
      return true;
    }
  }
  if (congregationId) {
    const clean = normalizeCongregationId(congregationId);
    if (
      !clean ||
      clean.startsWith('DEMO') ||
      ['1001', 'CENTRAL', 'MAIN', 'ID', 'CONGCENTRAL', 'CONGREGACIONCENTRAL'].includes(clean)
    ) {
      return true;
    }
  }
  return false;
}

export interface CongregationFullData {
  settings: CongregationSettings;
  publishers: Publisher[];
  weeks: WeekSchedule[];
  territories: Territory[];
  notices: CongregationNotice[];
  transactions?: AccountTransaction[];
  audits?: QuarterlyAudit[];
  literatureItems?: LiteratureItem[];
  literatureOrders?: LiteratureSpecialOrder[];
  literatureDistributions?: LiteratureGroupDistribution[];
  literatureInventory?: LiteratureInventoryRecord[];
  invitations?: any[];
  preachingGroups?: PreachingGroup[];
  customDuties?: CustomDuty[];
  outgoingSpeakers?: OutgoingSpeakerAssignment[];
  fieldServiceMeetings?: FieldServiceMeeting[];
  cartLocations?: CartLocation[];
  cartShifts?: CartShift[];
  monthlyReports?: MonthlyServiceReport[];
  circuitVisit?: CircuitOverseerVisit | null;
  memorialPlans?: MemorialPlan[];
  theocraticAssemblies?: TheocraticAssembly[];
  congregationEvents?: CongregationEvent[];
  accountLinkRequests?: AccountLinkRequest[];
  clmProgramas?: Record<string, ClmPrograma>;
  hospitalityHosts?: HospitalityHost[];
  breakers?: Breaker[];
  maintenanceSheets?: MaintenanceSheet[];
  auxPioneerRequests?: AuxPioneerRequest[];
  branchReportsS1?: BranchReportS1[];
}

export interface PublicFilteredData {
  congregation_id: string;
  congregation_name: string;
  updated_at: string;
  settings?: Partial<CongregationSettings>;
  invitations?: any[];
  publishers: Array<{
    id: string;
    name: string;
    gender?: Gender;
    active?: boolean;
    groupNumber?: number;
    privilege?: string;
    theocraticRole?: string;
    personalPin?: string;
    personalPinHash?: string;
    theocraticRoles?: any;
    email?: string;
    roles?: any;
  }>;
  weeks: WeekSchedule[];
  notices: CongregationNotice[];
  territories: Array<{
    id: string;
    number: string;
    name: string;
    status: string;
  }>;
  fieldServiceMeetings?: FieldServiceMeeting[];
  cartLocations?: CartLocation[];
  cartShifts?: CartShift[];
  preachingGroups?: PreachingGroup[];
  customDuties?: CustomDuty[];
  clmProgramas?: Record<string, ClmPrograma>;
  congregationEvents?: CongregationEvent[];
  memorialPlans?: MemorialPlan[];
  theocraticAssemblies?: TheocraticAssembly[];
  monthlyReports?: MonthlyServiceReport[];
  departmentalEnvelope?: EncryptedCompartmentEnvelope;
}

import {
  enqueueOfflineOperation,
  getPendingOfflineOperations,
  updateOfflineOperation,
  removeOfflineOperation,
  getOfflineQueueStats,
  OfflineQueueItem,
  QueueActionType,
} from './indexedDbQueue';

const LOCAL_STORAGE_LAST_SYNC_KEY = 'kongre_last_supabase_sync_at';
const LOCAL_STORAGE_OFFLINE_QUEUE_KEY = 'kongre_offline_supabase_queue_v1';

/**
 * Función auxiliar para fusionar listas de publicadores resolviendo conflictos
 */
export function mergePublishers(local: Publisher[], remote: Publisher[]): Publisher[] {
  const map = new Map<string, Publisher>();
  // 1. Agregar registros remotos
  for (const p of remote) {
    if (p && p.id) map.set(p.id, { ...p });
  }
  // 2. Superponer locales preservando campos enriquecidos y asignaciones
  for (const p of local) {
    if (p && p.id) {
      const existing = map.get(p.id);
      if (!existing) {
        map.set(p.id, p);
      } else {
        map.set(p.id, {
          ...existing,
          ...p,
          assignments: { ...(existing.assignments || {}), ...(p.assignments || {}) },
          s21_records: { ...(existing.s21_records || {}), ...(p.s21_records || {}) },
        });
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Función auxiliar para fusionar elementos por ID (semanas, territorios, avisos)
 */
function mergeById<T extends { id: string }>(local: T[] = [], remote: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of remote) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of local) {
    if (item && item.id) {
      const existing = map.get(item.id);
      map.set(item.id, existing ? { ...existing, ...item } : item);
    }
  }
  return Array.from(map.values());
}

/**
 * Función especializada para fusionar informes mensuales S-4 y actividad de ministerio
 * entre escritorio y móvil respetando la marca de tiempo más reciente (updatedAt / reportedAt)
 * y preservando minutos exactos (ej. +15 min), metas y registros diarios.
 */
export function mergeMonthlyReports(
  local: MonthlyServiceReport[] = [],
  remote: MonthlyServiceReport[] = []
): MonthlyServiceReport[] {
  const map = new Map<string, MonthlyServiceReport>();
  const getKey = (r: MonthlyServiceReport) =>
    r.publisherId && r.month ? `${r.publisherId}::${r.month}` : r.id;

  const getTimestamp = (r: MonthlyServiceReport): number => {
    const ts = r.updatedAt || r.reportedAt;
    if (!ts) return 0;
    const parsed = new Date(ts).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getEffectiveTotalMinutes = (r: MonthlyServiceReport): number => {
    if (typeof r.totalMinutes === 'number') return r.totalMinutes;
    return (Number(r.hours) || 0) * 60 + (Number(r.minutes) || 0);
  };

  for (const item of remote) {
    if (item && (item.id || (item.publisherId && item.month))) {
      map.set(getKey(item), { ...item });
    }
  }

  for (const item of local) {
    if (!item || (!item.id && !(item.publisherId && item.month))) continue;
    const key = getKey(item);
    const existingRemote = map.get(key);
    if (!existingRemote) {
      map.set(key, { ...item });
      continue;
    }

    const localTs = getTimestamp(item);
    const remoteTs = getTimestamp(existingRemote);
    const localMins = getEffectiveTotalMinutes(item);
    const remoteMins = getEffectiveTotalMinutes(existingRemote);

    // Si el registro remoto es más reciente (o tiene más minutos cuando no hay timestamp local más nuevo),
    // priorizar el registro remoto para que la sesión móvil reciba los cambios hechos en escritorio (y viceversa).
    const remoteWins =
      remoteTs > localTs || (remoteTs === localTs && remoteMins >= localMins);

    const winner = remoteWins ? existingRemote : item;
    const loser = remoteWins ? item : existingRemote;

    // Unificar logs de tiempo por id si el ganador no los vació explícitamente en una edición posterior
    const mergedLogs =
      winner.timeLogs !== undefined
        ? winner.timeLogs
        : loser.timeLogs;

    map.set(key, {
      ...loser,
      ...winner,
      ...(mergedLogs ? { timeLogs: mergedLogs } : {}),
      returnVisitRecords: winner.returnVisitRecords ?? loser.returnVisitRecords,
      bibleStudyRecords: winner.bibleStudyRecords ?? loser.bibleStudyRecords,
    });
  }

  return Array.from(map.values());
}

/**
 * Función auxiliar para fusionar distribuciones de literatura por número de grupo
 */
function mergeDistributions(
  local: LiteratureGroupDistribution[] = [],
  remote: LiteratureGroupDistribution[] = []
): LiteratureGroupDistribution[] {
  const map = new Map<number, LiteratureGroupDistribution>();
  for (const item of remote) {
    if (item && item.groupNumber !== undefined) map.set(item.groupNumber, item);
  }
  for (const item of local) {
    if (item && item.groupNumber !== undefined) {
      const existing = map.get(item.groupNumber);
      map.set(item.groupNumber, existing ? { ...existing, ...item } : item);
    }
  }
  return Array.from(map.values());
}

/**
 * Función auxiliar para fusionar grupos de predicación por número de grupo
 */
function mergePreachingGroups(
  local: PreachingGroup[] = [],
  remote: PreachingGroup[] = []
): PreachingGroup[] {
  const map = new Map<number, PreachingGroup>();
  for (const item of remote) {
    if (item && typeof item.number === 'number') map.set(item.number, item);
  }
  for (const item of local) {
    if (item && typeof item.number === 'number') {
      const existing = map.get(item.number);
      map.set(item.number, existing ? { ...existing, ...item } : item);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.number - b.number);
}

export const supabaseSyncService = {
  normalizeCongregationId,

  /**
   * Obtiene la marca de tiempo de la última sincronización con Supabase
   */
  getLastSyncTimestamp(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LOCAL_STORAGE_LAST_SYNC_KEY);
  },

  /**
   * Sube la congregación a Supabase con doble payload cifrado:
   * - payload (admin): Cifrado con PIN Maestro para ancianos / admin
   * - payload_public: Cifrado con PIN de Congregación para publicadores / cartelera
   */
  async uploadCongregation(params: {
    congregationId: string;
    data: CongregationFullData;
    pinMaestro: string;
    pinCongregacion?: string;
    skipOfflineEnqueue?: boolean;
    /**
     * Rotación de PIN: si el PIN maestro o el de congregación cambiaron, indica aquí los PINs ANTERIORES.
     * Se usarán para autenticar la operación y los nuevos (pinMaestro / pinCongregacion) pasarán a ser
     * las credenciales vigentes en el servidor.
     */
    rotateFrom?: { pinMaestro?: string; pinCongregacion?: string };
  }): Promise<{ success: boolean; error?: string }> {
    const cleanId = normalizeCongregationId(params.congregationId);
    const cleanMasterPin = normalizePinV2(params.pinMaestro);
    const cleanPublicPin = normalizePinV2(params.pinCongregacion || params.pinMaestro);

    if (!cleanId) return { success: false, error: 'ID de congregación requerido' };
    if (!cleanMasterPin) return { success: false, error: 'PIN maestro requerido para cifrar' };

    // Si estamos en navegador sin conexión a internet, guardar en cola offline
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      if (!params.skipOfflineEnqueue) {
        this.enqueueOfflineChange(cleanId, params.data);
      }
      return { success: true };
    }

    // En modo demo no se conecta ni sube nada a Supabase
    if (isDemoModeActive(cleanId)) {
      return { success: true };
    }

    try {
      const nowISO = new Date().toISOString();

      let storedInvitations: any[] = params.data.invitations || [];
      if (storedInvitations.length === 0 && typeof window !== 'undefined') {
        try {
          const rawInv = localStorage.getItem('kongre_theocratic_invitations_v1');
          if (rawInv) {
            const decInv = isEncryptedPinAtRest(rawInv) ? decryptPinAtRest(rawInv) : rawInv;
            storedInvitations = JSON.parse(decInv || '[]');
          }
        } catch {}
      }

      const normalizedAdminInvitations = (storedInvitations || []).map((inv) => ({
        ...inv,
        codeHash: inv?.codeHash || (inv?.code && !String(inv.code).includes('••••') ? hashInvitationCode(inv.code) : undefined),
      }));

      // 1. Preparar snapshot completo para ancianos
      const adminPayload = {
        version: '2.0',
        type: 'full_sync',
        congregationId: cleanId,
        updatedAt: nowISO,
        settings: params.data.settings,
        publishers: (params.data.publishers || []).map((p) => ({
          ...p,
          personalPinHash: p.personalPin ? hashPersonalPin(p.personalPin, p.id) : p.personalPinHash,
        })),
        weeks: params.data.weeks,
        territories: params.data.territories,
        notices: params.data.notices,
        transactions: params.data.transactions || [],
        audits: params.data.audits || [],
        literatureItems: params.data.literatureItems || [],
        literatureOrders: params.data.literatureOrders || [],
        literatureDistributions: params.data.literatureDistributions || [],
        literatureInventory: params.data.literatureInventory || [],
        invitations: normalizedAdminInvitations,
        preachingGroups: params.data.preachingGroups || [],
        customDuties: params.data.customDuties || [],
        outgoingSpeakers: params.data.outgoingSpeakers || [],
        fieldServiceMeetings: params.data.fieldServiceMeetings || [],
        cartLocations: params.data.cartLocations || [],
        cartShifts: params.data.cartShifts || [],
        monthlyReports: params.data.monthlyReports || [],
        circuitVisit: params.data.circuitVisit || null,
        memorialPlans: params.data.memorialPlans || [],
        theocraticAssemblies: params.data.theocraticAssemblies || [],
        congregationEvents: params.data.congregationEvents || [],
        accountLinkRequests: params.data.accountLinkRequests || [],
        clmProgramas: params.data.clmProgramas || {},
        hospitalityHosts: params.data.hospitalityHosts || [],
        breakers: params.data.breakers || [],
        maintenanceSheets: params.data.maintenanceSheets || [],
        auxPioneerRequests: params.data.auxPioneerRequests || [],
        branchReportsS1: params.data.branchReportsS1 || [],
      };

      // 2. Preparar payload público (sin notas pastorales, sin tarjetas S-21 confidenciales y SIN PINs ni códigos de invitación en texto plano: solo hashes SHA-256)
      const publicPayload: PublicFilteredData = {
        congregation_id: cleanId,
        congregation_name: params.data.settings?.congregationName || 'Congregación',
        updated_at: nowISO,
        settings: {
          congregationName: params.data.settings?.congregationName || 'Congregación',
          congregationNumber: cleanId,
          congregationId: cleanId,
          congregationPinHash: params.data.settings?.congregationPinHash,
          circuitNumber: params.data.settings?.circuitNumber || '',
          city: params.data.settings?.city || '',
          country: params.data.settings?.country || '',
          hallAddress: params.data.settings?.hallAddress || '',
          midweekMeetingDay: params.data.settings?.midweekMeetingDay || 'Miércoles',
          midweekMeetingTime: params.data.settings?.midweekMeetingTime || '19:00',
          weekendMeetingDay: params.data.settings?.weekendMeetingDay || 'Domingo',
          weekendMeetingTime: params.data.settings?.weekendMeetingTime || '10:00',
          coordinatorName: params.data.settings?.coordinatorName || '',
          coordinatorEmail: params.data.settings?.coordinatorEmail || '',
          coordinatorPhotoURL: params.data.settings?.coordinatorPhotoURL || '',
          isRegistered: true,
          pdfOrientation: params.data.settings?.pdfOrientation,
          pdfPageSize: params.data.settings?.pdfPageSize,
          pdfTemplate: params.data.settings?.pdfTemplate,
          conflictRules: params.data.settings?.conflictRules,
        },
        invitations: sanitizeInvitationsForPublicPayload(normalizedAdminInvitations),
        publishers: (params.data.publishers || []).map((p) => {
          // Seguridad: NUNCA incluir personalPin ni personalPinHash en payload_public.
          // Los PINs personales se verifican en la Edge Function con límite de intentos,
          // impidiendo ataques de fuerza bruta offline sobre PINs de 4 dígitos.
          // Minimización de datos (Ley 1581 / RGPD): no enviar correos personales en el payload público.
          return {
            id: p.id,
            name: p.name,
            gender: p.gender,
            active: p.active,
            groupNumber: p.groupNumber,
            privilege: p.privilege,
            theocraticRole: p.theocraticRole,
            theocraticRoles: (p as any).theocraticRoles,
            roles: p.roles,
          };
        }),
        weeks: params.data.weeks || [],
        notices: params.data.notices || [],
        territories: (params.data.territories || []).map((t) => ({
          id: t.id,
          number: t.number,
          name: t.name,
          status: t.status,
        })),
        fieldServiceMeetings: params.data.fieldServiceMeetings || [],
        cartLocations: params.data.cartLocations || [],
        cartShifts: params.data.cartShifts || [],
        preachingGroups: params.data.preachingGroups || [],
        customDuties: params.data.customDuties || [],
        clmProgramas: params.data.clmProgramas || {},
        congregationEvents: params.data.congregationEvents || [],
        memorialPlans: params.data.memorialPlans || [],
        theocraticAssemblies: params.data.theocraticAssemblies || [],
        // Seguridad y Minimización (Ley 1581): los informes mensuales de predicación son privados
        // y solo viajan en el payload maestro para el cuerpo de ancianos, nunca en el payload público común.
      };

      // 3. Extraer PINs personales para verificación segura en la Edge Function
      const personalPinsList: PersonalPinEntry[] = [];
      for (const p of params.data.publishers || []) {
        const pin = p.personalPin ? String(p.personalPin).trim() : '';
        if (pin.length >= 4) {
          personalPinsList.push({
            id: p.id,
            pin,
            name: p.name || '',
            role: p.theocraticRole || (p.privilege === 'anciano' ? 'anciano' : 'publico'),
            privilege: p.privilege,
            theocraticRoles: Array.isArray((p as any).theocraticRoles) ? (p as any).theocraticRoles : undefined,
          });
        }
      }

      // 3b. Criptografía Estricta por Rol (Zero-Trust Compartments 1.3):
      // Generar compartimento departamental cifrado con Envelope Encryption para siervos autorizados
      try {
        const authorizedPublishers = personalPinsList
          .filter((p) => {
            const roles = [p.role, ...(p.theocraticRoles || [])];
            return (
              p.privilege === 'anciano' ||
              p.privilege === 'siervo_ministerial' ||
              roles.some((r) =>
                ['siervo_cuentas', 'siervo_territorios', 'siervo_literatura', 'encargado_mantenimiento'].includes(r)
              )
            );
          })
          .map((p) => ({ publisherId: p.id, personalPin: p.pin }));

        const deptData = {
          transactions: params.data.transactions || [],
          audits: params.data.audits || [],
          territories: params.data.territories || [],
          literatureItems: params.data.literatureItems || [],
          literatureOrders: params.data.literatureOrders || [],
          literatureDistributions: params.data.literatureDistributions || [],
          literatureInventory: params.data.literatureInventory || [],
          maintenanceSheets: params.data.maintenanceSheets || [],
        };

        publicPayload.departmentalEnvelope = await packageDepartmentCompartment({
          data: deptData,
          masterPin: cleanMasterPin,
          authorizedPublishers,
        });
      } catch (deptErr) {
        console.warn('[Sync] Aviso al empaquetar compartimento departamental:', deptErr);
      }

      // 4. Cifrar ambos payloads en el dispositivo (Cero Conocimiento).
      const encryptedAdmin = await encryptForSupabase(adminPayload, cleanMasterPin);
      const encryptedPublic = await encryptForSupabase(publicPayload, cleanPublicPin);

      // 5. Enviar a la Edge Function `kongre-sync`. El servidor valida el acceso (token derivado del PIN),
      //    decide qué puede escribir cada nivel (el PIN de congregación nunca puede tocar el payload maestro)
      //    y aplica el límite de intentos. Ya no hay verificación de propiedad en el cliente.
      //    Si este dispositivo tiene una lista de publicadores vacía/incompleta no se sobrescribe el payload
      //    maestro existente (evita el borrado catastrófico de datos de ancianos).
      const preserveMaster = Boolean(params.data.publishers && params.data.publishers.length <= 1);
      const rotating = Boolean(params.rotateFrom && (params.rotateFrom.pinMaestro || params.rotateFrom.pinCongregacion));
      const pushRes = await syncPush({
        id: cleanId,
        masterPin: params.rotateFrom?.pinMaestro ? normalizePinV2(params.rotateFrom.pinMaestro) : cleanMasterPin,
        publicPin: params.rotateFrom?.pinCongregacion ? normalizePinV2(params.rotateFrom.pinCongregacion) : cleanPublicPin,
        payload: encryptedAdmin,
        payloadPublic: encryptedPublic,
        preserveMaster,
        personalPins: personalPinsList.length > 0 ? personalPinsList : undefined,
        rotateTo: rotating
          ? {
              masterPin: params.rotateFrom?.pinMaestro ? cleanMasterPin : undefined,
              publicPin: params.rotateFrom?.pinCongregacion ? cleanPublicPin : undefined,
            }
          : undefined,
      });

      if (!pushRes.ok) {
        const message = describeSyncError(pushRes);
        // Errores de acceso o de límite de intentos no se reintentan desde la cola offline.
        if (pushRes.status === 401 || pushRes.status === 403 || pushRes.status === 429) {
          return {
            success: false,
            error: pushRes.status === 401
              ? 'Acceso denegado: Las credenciales no coinciden con el registro de esta congregación en la nube.'
              : message,
          };
        }
        console.warn('Sync push error:', pushRes.status, pushRes.error);
        if (!params.skipOfflineEnqueue) {
          this.enqueueOfflineChange(cleanId, params.data);
        }
        return { success: false, error: message };
      }

      if (typeof window !== 'undefined') {
        // La marca de tiempo la fija el servidor: evita desfases de reloj entre dispositivos.
        localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, pushRes.created_at);
        localStorage.removeItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Aviso en cifrado o subida a Supabase (encolado localmente):', err?.message || err);
      if (!params.skipOfflineEnqueue) {
        this.enqueueOfflineChange(cleanId, params.data);
      }
      return { success: false, error: err?.message || 'Error en cifrado' };
    }
  },

  /**
   * Consulta si hay actualizaciones remotas en Supabase para este ID
   */
  async checkRemoteUpdates(rawId: string, rawPin?: string): Promise<{
    hasUpdate: boolean;
    remoteCreatedAt?: string;
    error?: string;
  }> {
    const cleanId = normalizeCongregationId(rawId);
    if (!cleanId || isDemoModeActive(cleanId)) return { hasUpdate: false };
    if (!rawPin) return { hasUpdate: false, error: 'PIN requerido para consultar actualizaciones' };

    try {
      const res = await syncMeta(cleanId, normalizePinV2(rawPin));
      if (!res.ok) {
        return { hasUpdate: false, error: describeSyncError(res) };
      }
      if (!res.created_at) {
        return { hasUpdate: false };
      }

      const lastLocalSync = this.getLastSyncTimestamp();
      if (!lastLocalSync) {
        return { hasUpdate: true, remoteCreatedAt: res.created_at };
      }

      const remoteTime = new Date(res.created_at).getTime();
      const localTime = new Date(lastLocalSync).getTime();

      return {
        hasUpdate: remoteTime > localTime + 1000,
        remoteCreatedAt: res.created_at,
      };
    } catch (err: any) {
      return { hasUpdate: false, error: err?.message };
    }
  },

  /**
   * Descarga y descifra los datos de la congregación desde Supabase
   */
  async fetchAndDecryptCongregation(
    rawId: string,
    rawPin: string
  ): Promise<{ success: boolean; data?: any; isMaster?: boolean; error?: string }> {
    const cleanId = normalizeCongregationId(rawId);
    const cleanPin = normalizePinV2(rawPin);

    if (!cleanId) return { success: false, error: 'ID de congregación requerido' };
    if (!cleanPin) return { success: false, error: 'PIN requerido' };

    // En modo demo no se consulta Supabase
    if (isDemoModeActive(cleanId)) {
      return { success: false, error: 'Modo demo activo: sin conexión a Supabase.' };
    }

    try {
      // El servidor valida el PIN (token derivado) y limita los intentos. Con el PIN de congregación
      // solo devuelve payload_public; el payload maestro únicamente se entrega al PIN maestro.
      const res = await syncPull(cleanId, cleanPin);
      if (!res.ok) {
        return { success: false, error: describeSyncError(res) };
      }
      const data = {
        payload: res.payload,
        payload_public: res.payload_public,
        created_at: res.created_at,
      };

      // Intento 1: ¿Es el PIN Maestro? Intentar descifrar payload admin
      if (data.payload) {
        try {
          const decryptedAdmin = await decryptFromSupabase(data.payload, cleanPin);
          if (decryptedAdmin) {
            // Si también existe payload_public (ej. actualizado por un publicador con PIN de congregación),
            // fusionar monthlyReports más recientes para no perder informes enviados desde sesiones de publicador
            if (data.payload_public) {
              try {
                const decryptedPub = await decryptFromSupabase(data.payload_public, cleanPin);
                if (decryptedPub && Array.isArray(decryptedPub.monthlyReports)) {
                  decryptedAdmin.monthlyReports = mergeMonthlyReports(
                    decryptedAdmin.monthlyReports || [],
                    decryptedPub.monthlyReports
                  );
                }
              } catch {}
            }
            if (typeof window !== 'undefined' && data.created_at) {
              localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, data.created_at);
            }
            return { success: true, data: decryptedAdmin, isMaster: true };
          }
        } catch {
          // No era el PIN maestro o es un PIN personal/congregación
        }
      }

      // Intento 2: Intentar descifrar payload público con el PIN provisto
      if (data.payload_public) {
        try {
          const decryptedPublic = await decryptFromSupabase(data.payload_public, cleanPin);
          if (decryptedPublic) {
            if (typeof window !== 'undefined' && data.created_at) {
              localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, data.created_at);
            }
            return { success: true, data: decryptedPublic, isMaster: false };
          }
        } catch {
          // Falló descifrado público
        }
      }

      return {
        success: false,
        error: 'El PIN ingresado es incorrecto para este ID de congregación.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error al conectar con la base de datos de la congregación.',
      };
    }
  },

  /**
   * Desempaqueta el compartimento departamental de un payload público si el usuario
   * cuenta con credenciales autorizadas (PIN Maestro o PIN Personal de siervo ministerial).
   */
  async unwrapDepartmentalData(
    publicData: PublicFilteredData,
    credentials: { masterPin?: string; publisherId?: string; personalPin?: string }
  ): Promise<{
    transactions?: AccountTransaction[];
    audits?: QuarterlyAudit[];
    territories?: Territory[];
    literatureItems?: LiteratureItem[];
    literatureOrders?: LiteratureSpecialOrder[];
    literatureDistributions?: LiteratureGroupDistribution[];
    literatureInventory?: LiteratureInventoryRecord[];
    maintenanceSheets?: MaintenanceSheet[];
  } | null> {
    if (!publicData?.departmentalEnvelope) return null;
    try {
      return await unpackageDepartmentCompartment(publicData.departmentalEnvelope, credentials);
    } catch {
      return null;
    }
  },

  /**
   * Sincronización bidireccional inteligente:
   * - Comprueba si la nube tiene datos más nuevos.
   * - Si hay novedades remotas, las descarga, descifra y fusiona con Last-Write-Wins y unión no destructiva.
   * - Si el dispositivo local tiene cambios pendientes, los cifra y los sube.
   */
  async syncBidirectional(params: {
    congregationId: string;
    currentData: CongregationFullData;
    pinMaestro: string;
    pinCongregacion?: string;
    onDataUpdated?: (merged: CongregationFullData) => void;
    forceUpload?: boolean;
  }): Promise<{
    success: boolean;
    action: 'downloaded' | 'uploaded' | 'merged' | 'up_to_date' | 'offline_queued';
    mergedData?: CongregationFullData;
    error?: string;
  }> {
    const cleanId = normalizeCongregationId(params.congregationId);
    if (!cleanId) return { success: false, action: 'up_to_date', error: 'Sin ID de congregación' };

    // En modo demo no se sincroniza con Supabase
    if (isDemoModeActive(cleanId)) {
      return { success: true, action: 'up_to_date' };
    }

    // Si estamos en navegador sin internet, encolar cambios locales
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      this.enqueueOfflineChange(cleanId, params.currentData);
      return { success: true, action: 'offline_queued' };
    }

    try {
      // 1. Verificar si hay cambios en la nube
      const check = await this.checkRemoteUpdates(cleanId, params.pinMaestro || params.pinCongregacion);

      if (check.hasUpdate && !params.forceUpload) {
        // 2. Descargar y descifrar la versión remota
        const remote = await this.fetchAndDecryptCongregation(
          cleanId,
          params.pinMaestro || params.pinCongregacion || ''
        );

        if (remote.success && remote.data) {
          const rData = remote.data;

          // 3. Fusionar datos respetando adiciones de ambos extremos
          const merged: CongregationFullData = {
            settings: {
              ...(params.currentData.settings || {}),
              ...(rData.settings || {}),
            },
            publishers: mergePublishers(params.currentData.publishers || [], rData.publishers || []),
            weeks: mergeById(params.currentData.weeks || [], rData.weeks || []),
            territories: mergeById(params.currentData.territories || [], rData.territories || []),
            notices: mergeById(params.currentData.notices || [], rData.notices || []),
            transactions: mergeById(params.currentData.transactions || [], rData.transactions || []),
            audits: mergeById(params.currentData.audits || [], rData.audits || []),
            literatureItems: mergeById(params.currentData.literatureItems || [], rData.literatureItems || []),
            literatureOrders: mergeById(params.currentData.literatureOrders || [], rData.literatureOrders || []),
            literatureDistributions: mergeDistributions(params.currentData.literatureDistributions || [], rData.literatureDistributions || []),
            literatureInventory: mergeById(params.currentData.literatureInventory || [], rData.literatureInventory || []),
            preachingGroups: (rData.preachingGroups && rData.preachingGroups.length > 0) ? mergePreachingGroups(params.currentData.preachingGroups || [], rData.preachingGroups) : (params.currentData.preachingGroups || []),
            customDuties: (rData.customDuties && rData.customDuties.length > 0) ? mergeById(params.currentData.customDuties || [], rData.customDuties) : (params.currentData.customDuties || []),
            outgoingSpeakers: mergeById(params.currentData.outgoingSpeakers || [], rData.outgoingSpeakers || []),
            fieldServiceMeetings: mergeById(params.currentData.fieldServiceMeetings || [], rData.fieldServiceMeetings || []),
            cartLocations: mergeById(params.currentData.cartLocations || [], rData.cartLocations || []),
            cartShifts: mergeById(params.currentData.cartShifts || [], rData.cartShifts || []),
            monthlyReports: mergeMonthlyReports(params.currentData.monthlyReports || [], rData.monthlyReports || []),
            circuitVisit: rData.circuitVisit !== undefined ? rData.circuitVisit : params.currentData.circuitVisit,
            memorialPlans: mergeById(params.currentData.memorialPlans || [], rData.memorialPlans || []),
            theocraticAssemblies: mergeById(params.currentData.theocraticAssemblies || [], rData.theocraticAssemblies || []),
            congregationEvents: mergeById(params.currentData.congregationEvents || [], rData.congregationEvents || []),
            accountLinkRequests: mergeById(params.currentData.accountLinkRequests || [], rData.accountLinkRequests || []),
            clmProgramas: { ...(params.currentData.clmProgramas || {}), ...(rData.clmProgramas || {}) },
            hospitalityHosts: mergeById(params.currentData.hospitalityHosts || [], rData.hospitalityHosts || []),
            breakers: (rData.breakers && rData.breakers.length > 0) ? mergeById(params.currentData.breakers || [], rData.breakers) : (params.currentData.breakers || []),
            maintenanceSheets: (rData.maintenanceSheets && rData.maintenanceSheets.length > 0) ? mergeById(params.currentData.maintenanceSheets || [], rData.maintenanceSheets) : (params.currentData.maintenanceSheets || []),
            auxPioneerRequests: mergeById(params.currentData.auxPioneerRequests || [], rData.auxPioneerRequests || []),
            branchReportsS1: mergeById(params.currentData.branchReportsS1 || [], rData.branchReportsS1 || []),
            invitations: rData.invitations && rData.invitations.length > 0 ? rData.invitations : (params.currentData.invitations || []),
          };

          if (params.onDataUpdated) {
            params.onDataUpdated(merged);
          }

          if (check.remoteCreatedAt) {
            localStorage.setItem(LOCAL_STORAGE_LAST_SYNC_KEY, check.remoteCreatedAt);
          }

          return { success: true, action: 'downloaded', mergedData: merged };
        }
      }

      // 4. Solo subir snapshot actual si se solicitó subida explícita o hay cambios locales pendientes
      const hasPendingLocalUpload =
        typeof localStorage !== 'undefined' && localStorage.getItem('kongre_needs_cloud_upload') === 'true';

      if (!params.forceUpload && !hasPendingLocalUpload) {
        return { success: true, action: 'up_to_date' };
      }

      const uploadRes = await this.uploadCongregation({
        congregationId: cleanId,
        data: params.currentData,
        pinMaestro: params.pinMaestro,
        pinCongregacion: params.pinCongregacion,
      });

      if (!uploadRes.success) {
        return { success: false, action: 'up_to_date', error: uploadRes.error };
      }

      return { success: true, action: 'uploaded' };
    } catch (err: any) {
      console.warn('Error en syncBidirectional:', err);
      return { success: false, action: 'up_to_date', error: err?.message };
    }
  },

  /**
   * Guarda cambios pendientes en la cola persistente de IndexedDB si el dispositivo está sin internet
   */
  async enqueueOfflineChange(
    congregationId: string,
    data: CongregationFullData,
    options?: {
      actionType?: QueueActionType;
      description?: string;
      payload?: any;
    }
  ) {
    if (typeof window === 'undefined') return;
    const cleanId = normalizeCongregationId(congregationId || 'LOCAL') || 'LOCAL';
    const actionType = options?.actionType || 'FULL_SYNC';
    const description = options?.description || 'Actualización de congregación';

    try {
      await enqueueOfflineOperation({
        congregationId: cleanId,
        actionType,
        description,
        payload: options?.payload,
        snapshotData: data,
      });

      // Respaldo de compatibilidad cifrado en reposo
      const item = {
        congregationId: cleanId,
        encryptedData: encryptPinAtRest(JSON.stringify(data)),
        queuedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY, JSON.stringify(item));
      window.dispatchEvent(new CustomEvent('kongre_offline_sync_queued'));
    } catch (e) {
      console.warn('Error al encolar en IndexedDB:', e);
    }
  },

  /**
   * Encola específicamente una marcación o conteo de asistencia de reunión en IndexedDB
   */
  async enqueueAttendanceChange(params: {
    congregationId: string;
    weekId: string;
    description: string;
    attendancePayload: any;
    fullData: CongregationFullData;
  }) {
    return this.enqueueOfflineChange(params.congregationId, params.fullData, {
      actionType: 'UPDATE_ATTENDANCE',
      description: params.description || `Asistencia reunión (${params.weekId})`,
      payload: { weekId: params.weekId, attendance: params.attendancePayload },
    });
  },

  /**
   * Encola específicamente una edición de informe de servicio S-21 / S-4 en IndexedDB
   */
  async enqueueReportChange(params: {
    congregationId: string;
    publisherId: string;
    description: string;
    reportPayload: any;
    fullData: CongregationFullData;
  }) {
    return this.enqueueOfflineChange(params.congregationId, params.fullData, {
      actionType: 'UPDATE_SERVICE_REPORT',
      description: params.description || `Informe de servicio (${params.publisherId})`,
      payload: { publisherId: params.publisherId, report: params.reportPayload },
    });
  },

  /**
   * Obtiene estadísticas de la cola IndexedDB
   */
  async getQueueStats() {
    return getOfflineQueueStats();
  },

  /**
   * Procesa la cola offline de IndexedDB cuando se recupera la conexión a internet
   * y sube los cambios cifrados con AES-256 a Supabase.
   */
  async flushOfflineQueue(
    pinMaestro: string,
    pinCongregacion?: string
  ): Promise<{ success: boolean; syncedCount: number }> {
    if (typeof window === 'undefined') return { success: false, syncedCount: 0 };

    try {
      // 1. Obtener todas las operaciones pendientes de IndexedDB
      const pendingItems = await getPendingOfflineOperations();

      if (isDemoModeActive()) {
        for (const item of pendingItems) {
          await removeOfflineOperation(item.id);
        }
        localStorage.removeItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
        window.dispatchEvent(new CustomEvent('kongre_indexeddb_queue_changed'));
        return { success: true, syncedCount: pendingItems.length };
      }

      if (pendingItems.length === 0) {
        // Verificar si queda algún elemento en el localStorage antiguo o cifrado
        const rawLegacy = localStorage.getItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
        if (rawLegacy) {
          try {
            const item = JSON.parse(rawLegacy);
            const restoredData = item.encryptedData
              ? JSON.parse(decryptPinAtRest(item.encryptedData) || 'null')
              : item.data;
            if (item.congregationId && restoredData && pinMaestro) {
              const res = await this.uploadCongregation({
                congregationId: item.congregationId,
                data: restoredData,
                pinMaestro,
                pinCongregacion,
                skipOfflineEnqueue: true,
              });
              if (res.success) {
                localStorage.removeItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
                window.dispatchEvent(new CustomEvent('kongre_indexeddb_queue_changed'));
                return { success: true, syncedCount: 1 };
              }
            }
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
          }
        }
        return { success: true, syncedCount: 0 };
      }

      // Marcar todas como sincronizando
      for (const item of pendingItems) {
        await updateOfflineOperation(item.id, {
          status: 'syncing',
          attempts: (item.attempts || 0) + 1,
        });
      }

      // Encontrar el snapshot más reciente o por congregación
      const itemsWithSnapshot = pendingItems.filter((i) => i.snapshotData && i.congregationId);
      const latestItem = itemsWithSnapshot.length > 0
        ? itemsWithSnapshot[itemsWithSnapshot.length - 1]
        : pendingItems[pendingItems.length - 1];

      if (latestItem && latestItem.snapshotData && pinMaestro) {
        const res = await this.uploadCongregation({
          congregationId: latestItem.congregationId,
          data: latestItem.snapshotData,
          pinMaestro,
          pinCongregacion,
          skipOfflineEnqueue: true,
        });

        if (res.success) {
          // Remover todas las operaciones pendientes procesadas
          for (const item of pendingItems) {
            await removeOfflineOperation(item.id);
          }
          localStorage.removeItem(LOCAL_STORAGE_OFFLINE_QUEUE_KEY);
          window.dispatchEvent(new CustomEvent('kongre_indexeddb_queue_changed'));
          return { success: true, syncedCount: pendingItems.length };
        } else {
          // Marcar con error
          for (const item of pendingItems) {
            await updateOfflineOperation(item.id, {
              status: 'error',
              lastError: res.error || 'Fallo de conexión',
            });
          }
          return { success: false, syncedCount: 0 };
        }
      }

      return { success: true, syncedCount: 0 };
    } catch (err: any) {
      console.warn('Error al procesar la cola offline de IndexedDB:', err);
      return { success: false, syncedCount: 0 };
    }
  },

  /**
   * Elimina la congregación de la nube. Solo el PIN maestro puede hacerlo (lo valida el servidor).
   */
  async deleteCongregation(rawId: string, masterPin: string): Promise<{ success: boolean; error?: string }> {
    const cleanId = normalizeCongregationId(rawId);
    if (!cleanId || !masterPin) return { success: false, error: 'ID y PIN maestro requeridos' };
    if (isDemoModeActive(cleanId)) return { success: true };
    try {
      const res = await syncDelete(cleanId, normalizePinV2(masterPin));
      return res.ok ? { success: true } : { success: false, error: describeSyncError(res) };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  /**
   * Avisa cuando hay cambios remotos mediante sondeo de la Edge Function (reemplaza al canal Realtime:
   * la tabla ya no es accesible por el navegador). Devuelve la función para cancelar el sondeo.
   */
  subscribeToCongregation(
    rawId: string,
    rawPin: string,
    onRemoteUpdate: (info: { created_at: string }) => void,
    intervalMs: number = 30000
  ) {
    const cleanId = normalizeCongregationId(rawId);
    if (!cleanId || !rawPin || isDemoModeActive(cleanId)) return null;

    const timer = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      const check = await this.checkRemoteUpdates(cleanId, rawPin);
      if (check.hasUpdate && check.remoteCreatedAt) {
        onRemoteUpdate({ created_at: check.remoteCreatedAt });
      }
    }, Math.max(10000, intervalMs));

    return () => clearInterval(timer);
  },

  /**
   * Verifica un PIN personal en la Edge Function con límite de intentos y cero conocimiento.
   */
  async verifyPersonalPin(
    rawCongId: string,
    rawPublicPin: string,
    rawPersonalPin: string,
    publisherId: string
  ): Promise<{ success: boolean; publisher?: VerifiedPublisher; session_token?: string; error?: string }> {
    const cleanId = normalizeCongregationId(rawCongId);
    const cleanPubId = (publisherId || '').trim();
    if (!cleanId || !rawPublicPin || !rawPersonalPin || !cleanPubId) {
      return { success: false, error: 'Datos incompletos para verificación (ID, PIN y publicador requeridos)' };
    }
    if (isDemoModeActive(cleanId)) {
      return { success: false, error: 'No disponible en modo demo' };
    }
    try {
      const res = await syncVerifyPersonalPin(cleanId, rawPublicPin, rawPersonalPin, cleanPubId);
      if (!res.ok) {
        return { success: false, error: describeSyncError(res) };
      }
      if (res.session_token && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('kongre_server_role_token', res.session_token);
        } catch {}
      }
      return { success: true, publisher: res.publisher, session_token: res.session_token };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al conectar con el servidor de sincronización' };
    }
  },
};
