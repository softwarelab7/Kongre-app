// src/utils/khsWorkloadWeighting.ts
import {
  Publisher,
  WeekSchedule,
  CartShift,
  OutgoingSpeakerAssignment,
  FieldServiceMeeting,
  PreachingGroup,
  CircuitOverseerVisit,
  CongregationSettings,
} from '../types';
import { getPubId, getPubDisplayName } from './familyGrouping';

export type KhsWeightCategory =
  | 'ensenanza'
  | 'estudiantil_lectura'
  | 'deberes_logistica'
  | 'ministerio_campo'
  | 'oraciones';

export interface KhsRoleWeightItem {
  key: string;
  label: string;
  shortLabel: string;
  category: KhsWeightCategory;
  defaultPoints: number;
  description: string;
  publisherRoleKey?: string; // clave correspondiente en pub.roles si aplica
}

export const KHS_ROLE_WEIGHT_DEFINITIONS: KhsRoleWeightItem[] = [
  // Enseñanza Principal y Presidencia (Alta preparación: 3.5 - 5.0 pts)
  {
    key: 'orador_publico',
    label: 'Discurso Público (Local o Saliente 30 min)',
    shortLabel: 'Discurso Público',
    category: 'ensenanza',
    defaultPoints: 5.0,
    description: 'Preparación y presentación de bosquejo oficial de 30 minutos.',
  },
  {
    key: 'fds_atalaya_conductor',
    label: 'Conductor del Estudio de La Atalaya',
    shortLabel: 'Cond. Atalaya',
    category: 'ensenanza',
    defaultPoints: 4.5,
    description: 'Dirección de 60 minutos de preguntas y respuestas del Estudio de La Atalaya.',
    publisherRoleKey: 'fds_presidente',
  },
  {
    key: 'vym_estudio_conductor',
    label: 'Conductor del Estudio Bíblico de Congregación',
    shortLabel: 'Cond. Estudio Bíblico',
    category: 'ensenanza',
    defaultPoints: 4.0,
    description: 'Dirección de 30 minutos del Estudio Bíblico de Congregación.',
    publisherRoleKey: 'vym_estudio_conductor',
  },
  {
    key: 'vym_tesoros_discurso',
    label: 'Discurso de Tesoros de la Biblia (10 min)',
    shortLabel: 'Tesoros (Discurso)',
    category: 'ensenanza',
    defaultPoints: 4.0,
    description: 'Discurso de enseñanza de 10 minutos en Vida y Ministerio.',
    publisherRoleKey: 'vym_tesoros_discurso',
  },
  {
    key: 'vym_vida_partes',
    label: 'Partes de Nuestra Vida Cristiana / Necesidades',
    shortLabel: 'Vida Cristiana',
    category: 'ensenanza',
    defaultPoints: 3.5,
    description: 'Discursos, análisis con el auditorio o necesidades de la congregación.',
    publisherRoleKey: 'vym_vida_partes',
  },
  {
    key: 'vym_presidente',
    label: 'Presidente de Reunión Entre Semana (VMC)',
    shortLabel: 'Presidente VMC',
    category: 'ensenanza',
    defaultPoints: 3.5,
    description: 'Presidencia completa, comentarios de apertura, transición y conclusión.',
    publisherRoleKey: 'vym_presidente',
  },
  {
    key: 'fds_presidente',
    label: 'Presidente de Reunión de Fin de Semana',
    shortLabel: 'Presidente FDS',
    category: 'ensenanza',
    defaultPoints: 3.0,
    description: 'Presidencia de la reunión pública de fin de semana.',
    publisherRoleKey: 'fds_presidente',
  },
  {
    key: 'vym_tesoros_perlas',
    label: 'Busquemos Perlas Escondidas (10 min)',
    shortLabel: 'Perlas Escondidas',
    category: 'ensenanza',
    defaultPoints: 3.0,
    description: 'Dirección de preguntas y análisis de Perlas Escondidas.',
    publisherRoleKey: 'vym_tesoros_perlas',
  },

  // Asignaciones Estudiantiles y Lecturas (Preparación media: 1.5 - 3.0 pts)
  {
    key: 'vym_maestros_titular',
    label: 'Seamos Mejores Maestros (Titular / Discurso)',
    shortLabel: 'Maestros (Titular)',
    category: 'estudiantil_lectura',
    defaultPoints: 3.0,
    description: 'Estudiante titular en demostración o discurso estudiantil.',
    publisherRoleKey: 'vym_maestros_titular',
  },
  {
    key: 'vym_tesoros_lectura',
    label: 'Lectura de la Biblia (4 min)',
    shortLabel: 'Lectura Bíblica',
    category: 'estudiantil_lectura',
    defaultPoints: 2.5,
    description: 'Lectura estudiantil de la Biblia en sala principal o auxiliar.',
    publisherRoleKey: 'vym_tesoros_lectura',
  },
  {
    key: 'fds_atalaya_lector',
    label: 'Lector del Estudio de La Atalaya',
    shortLabel: 'Lector Atalaya',
    category: 'estudiantil_lectura',
    defaultPoints: 2.5,
    description: 'Lectura de todos los párrafos del artículo de estudio semanal.',
    publisherRoleKey: 'fds_atalaya_lector',
  },
  {
    key: 'vym_estudio_lector',
    label: 'Lector del Estudio Bíblico de Congregación',
    shortLabel: 'Lector Estudio',
    category: 'estudiantil_lectura',
    defaultPoints: 2.0,
    description: 'Lectura de los párrafos en el Estudio Bíblico de Congregación.',
    publisherRoleKey: 'vym_estudio_lector',
  },
  {
    key: 'vym_maestros_ayudante',
    label: 'Seamos Mejores Maestros (Ayudante)',
    shortLabel: 'Maestros (Ayudante)',
    category: 'estudiantil_lectura',
    defaultPoints: 1.5,
    description: 'Compañero(a) ayudante en demostración estudiantil.',
    publisherRoleKey: 'vym_maestros_ayudante',
  },

  // Ministerio del Campo y Hospitalidad (1.5 - 2.5 pts)
  {
    key: 'servicio_campo_conductor',
    label: 'Conductor de Salida al Servicio del Campo',
    shortLabel: 'Cond. Salida Campo',
    category: 'ministerio_campo',
    defaultPoints: 2.5,
    description: 'Dirección de reunión para el servicio del campo y asignación de territorio.',
  },
  {
    key: 'carrito_turno',
    label: 'Turno de Predicación Pública (Carritos)',
    shortLabel: 'Turno Carrito',
    category: 'ministerio_campo',
    defaultPoints: 1.5,
    description: 'Participación en turno de exhibidor móvil o mesa pública.',
  },
  {
    key: 'hospitalidad_anfitrion',
    label: 'Hospitalidad (Comida Orador / Sup. Circuito)',
    shortLabel: 'Hospitalidad',
    category: 'ministerio_campo',
    defaultPoints: 2.0,
    description: 'Atención y hospitalidad a oradores visitantes o superintendente de circuito.',
  },

  // Deberes Técnicos, Acomodadores y Limpieza (1.5 - 2.0 pts)
  {
    key: 'deber_audio',
    label: 'Consola de Audio / Sonido',
    shortLabel: 'Audio',
    category: 'deberes_logistica',
    defaultPoints: 2.0,
    description: 'Operación de consola de sonido durante toda la reunión.',
    publisherRoleKey: 'deber_audio',
  },
  {
    key: 'deber_video',
    label: 'Operador de Video y Multimedia',
    shortLabel: 'Video/Multimedia',
    category: 'deberes_logistica',
    defaultPoints: 2.0,
    description: 'Proyección de videos, canciones e imágenes durante la reunión.',
    publisherRoleKey: 'deber_video',
  },
  {
    key: 'deber_zoom',
    label: 'Operador de Zoom / Transmisión',
    shortLabel: 'Zoom/Streaming',
    category: 'deberes_logistica',
    defaultPoints: 2.0,
    description: 'Control de videoconferencia y atención a conectados.',
    publisherRoleKey: 'deber_zoom',
  },
  {
    key: 'deber_plataforma',
    label: 'Siervo de Plataforma',
    shortLabel: 'Plataforma',
    category: 'deberes_logistica',
    defaultPoints: 2.0,
    description: 'Asistencia logística en plataforma y ajuste de atriles/micrófonos.',
    publisherRoleKey: 'deber_plataforma',
  },
  {
    key: 'deber_acomodador',
    label: 'Acomodador (Entrada / Auditorio)',
    shortLabel: 'Acomodador',
    category: 'deberes_logistica',
    defaultPoints: 2.0,
    description: 'Bienvenida, conteo de asistencia y orden en el auditorio.',
    publisherRoleKey: 'deber_acomodador',
  },
  {
    key: 'deber_seguridad',
    label: 'Seguridad / Vigilancia / Estacionamiento',
    shortLabel: 'Seguridad',
    category: 'deberes_logistica',
    defaultPoints: 2.0,
    description: 'Vigilancia de acceso y estacionamiento del Salón del Reino.',
    publisherRoleKey: 'deber_seguridad',
  },
  {
    key: 'deber_microfonos',
    label: 'Paso de Micrófonos',
    shortLabel: 'Micrófonos',
    category: 'deberes_logistica',
    defaultPoints: 1.5,
    description: 'Atención de micrófonos en el auditorio durante sesiones de comentarios.',
    publisherRoleKey: 'deber_microfonos',
  },
  {
    key: 'limpieza_salon',
    label: 'Limpieza Semanal del Salón (por Grupo)',
    shortLabel: 'Limpieza Salón',
    category: 'deberes_logistica',
    defaultPoints: 1.5,
    description: 'Participación grupal en el aseo semanal del Salón del Reino.',
  },

  // Oraciones (1.0 pt)
  {
    key: 'vym_oracion',
    label: 'Oración en Reunión Entre Semana',
    shortLabel: 'Oración VMC',
    category: 'oraciones',
    defaultPoints: 1.0,
    description: 'Oración de apertura o conclusión en reunión entre semana.',
    publisherRoleKey: 'vym_oracion',
  },
  {
    key: 'fds_oracion',
    label: 'Oración en Reunión de Fin de Semana',
    shortLabel: 'Oración FDS',
    category: 'oraciones',
    defaultPoints: 1.0,
    description: 'Oración en reunión de fin de semana.',
    publisherRoleKey: 'fds_oracion',
  },
];

export const KHS_CATEGORY_META: Record<
  KhsWeightCategory,
  { label: string; shortLabel: string; badgeClass: string; barClass: string }
> = {
  ensenanza: {
    label: 'Enseñanza y Presidencia',
    shortLabel: 'Enseñanza',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    barClass: 'bg-indigo-600',
  },
  estudiantil_lectura: {
    label: 'Partes Estudiantiles y Lecturas',
    shortLabel: 'Estudiantil/Lectura',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    barClass: 'bg-amber-500',
  },
  deberes_logistica: {
    label: 'Deberes, Audio/Video y Acomodadores',
    shortLabel: 'Deberes/Audio',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    barClass: 'bg-emerald-500',
  },
  ministerio_campo: {
    label: 'Servicio del Campo, Carritos y Hospitalidad',
    shortLabel: 'Campo/Carritos',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    barClass: 'bg-sky-500',
  },
  oraciones: {
    label: 'Oraciones de Congregación',
    shortLabel: 'Oraciones',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    barClass: 'bg-purple-500',
  },
};

const STORAGE_KEY_WEIGHTS = 'kongre_khs_weights_v1';

export type KhsWeightsMap = Record<string, number>;

export function getDefaultKhsWeights(): KhsWeightsMap {
  const map: KhsWeightsMap = {};
  for (const item of KHS_ROLE_WEIGHT_DEFINITIONS) {
    map[item.key] = item.defaultPoints;
  }
  return map;
}

export function loadKhsWeights(): KhsWeightsMap {
  const defaults = getDefaultKhsWeights();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_WEIGHTS);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveKhsWeights(weights: KhsWeightsMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_WEIGHTS, JSON.stringify(weights));
  } catch {
    // ignore storage errors
  }
}

export type KhsTimeRangeFilter =
  | 'all'
  | 'last_30_days'
  | 'last_60_days'
  | 'last_90_days'
  | 'current_month'
  | 'upcoming_30_days';

export interface KhsAssignmentEvent {
  publisherId: string;
  date: string; // YYYY-MM-DD
  weekStartDate: string; // YYYY-MM-DD Monday
  roleKey: string;
  roleLabel: string;
  category: KhsWeightCategory;
  points: number;
}

export type KhsLoadStatus = 'sobrecargado' | 'optimo' | 'subutilizado' | 'en_descanso';

export interface PublisherWorkloadReport {
  publisher: Publisher;
  displayName: string;
  cohort: 'anciano' | 'siervo_ministerial' | 'hermano_bautizado' | 'hermana_estudiante';
  cohortLabel: string;
  totalRawAssignments: number;
  totalWeightedPoints: number;
  pointsByCategory: Record<KhsWeightCategory, number>;
  countsByCategory: Record<KhsWeightCategory, number>;
  countsByRoleKey: Record<string, number>;
  pointsByRoleKey: Record<string, number>;
  lastAssignedDate?: string;
  daysSinceLastAssignment: number;
  maxConsecutiveWeeks: number;
  hasFatigueAlert: boolean; // >= 3 consecutive weeks with assignments
  enabledRoleKeys: string[];
  unusedRoleLabels: string[]; // Roles enabled in pub.roles with 0 assignments
  cohortAveragePoints: number;
  relativeLoadPercent: number; // % relative to cohort average (100% = exact average)
  loadStatus: KhsLoadStatus;
  events: KhsAssignmentEvent[];
}

export interface KhsRebalanceSuggestion {
  id: string;
  roleKey: string;
  roleLabel: string;
  overloadedPublisher: PublisherWorkloadReport;
  underutilizedPublisher: PublisherWorkloadReport;
  reason: string;
}

export interface KhsCongregationAuditSummary {
  reports: PublisherWorkloadReport[];
  equityIndexScore: number; // 0 - 100
  totalActivePublishers: number;
  totalAssignmentsCount: number;
  totalWeightedPoints: number;
  averagePointsPerPublisher: number;
  overloadedCount: number;
  optimalCount: number;
  underutilizedCount: number;
  restingCount: number;
  fatigueAlertCount: number;
  unusedQualifiedPublishersCount: number;
  categoryTotals: Record<KhsWeightCategory, { count: number; points: number }>;
  rebalanceSuggestions: KhsRebalanceSuggestion[];
}

function getMondayOfDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getPublisherCohort(
  pub: Publisher
): { cohort: PublisherWorkloadReport['cohort']; label: string } {
  const priv = (pub.privilege || pub.spiritualStatus || pub.role || '').toLowerCase();
  if (priv.includes('anciano') || priv.includes('elder')) {
    return { cohort: 'anciano', label: 'Anciano' };
  }
  if (priv.includes('siervo') || priv.includes('servant') || priv.includes('ministerial')) {
    return { cohort: 'siervo_ministerial', label: 'Siervo Ministerial' };
  }
  if (pub.gender === 'hermana' || pub.gender === 'female') {
    return { cohort: 'hermana_estudiante', label: 'Hermana' };
  }
  return { cohort: 'hermano_bautizado', label: 'Hermano / Estudiante' };
}

function isDateWithinRange(dateStr: string, range: KhsTimeRangeFilter): boolean {
  if (!dateStr || range === 'all') return true;
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return true;
  const targetTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  const diffDays = Math.round((todayMidnight - targetTime) / (1000 * 60 * 60 * 24));

  switch (range) {
    case 'last_30_days':
      return diffDays >= -7 && diffDays <= 30;
    case 'last_60_days':
      return diffDays >= -7 && diffDays <= 60;
    case 'last_90_days':
      return diffDays >= -7 && diffDays <= 90;
    case 'current_month': {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return dateStr.startsWith(ym);
    }
    case 'upcoming_30_days':
      return diffDays <= 0 && Math.abs(diffDays) <= 35;
    default:
      return true;
  }
}

export interface KhsAuditInputSources {
  publishers: Publisher[];
  weeks: WeekSchedule[];
  fieldServiceMeetings?: FieldServiceMeeting[];
  cartShifts?: CartShift[];
  outgoingSpeakers?: OutgoingSpeakerAssignment[];
  circuitVisit?: CircuitOverseerVisit | null;
  preachingGroups?: PreachingGroup[];
  weights?: KhsWeightsMap;
  timeRange?: KhsTimeRangeFilter;
}

export function computeKhsCongregationAudit(
  sources: KhsAuditInputSources
): KhsCongregationAuditSummary {
  const {
    publishers,
    weeks,
    fieldServiceMeetings = [],
    cartShifts = [],
    outgoingSpeakers = [],
    circuitVisit = null,
    weights = loadKhsWeights(),
    timeRange = 'all',
  } = sources;

  const roleDefMap = new Map<string, KhsRoleWeightItem>();
  KHS_ROLE_WEIGHT_DEFINITIONS.forEach((def) => roleDefMap.set(def.key, def));

  const activePublishers = publishers.filter((p) => p.active && !p.is_disfellowshipped && !p.is_moved);

  // Map publisher aliases (id, nid, normalized name) -> canonical publisher.id
  const pubLookup = new Map<string, Publisher>();
  activePublishers.forEach((p) => {
    pubLookup.set(p.id, p);
    if (p.nid) pubLookup.set(p.nid, p);
    const canonicalId = getPubId(p);
    if (canonicalId) pubLookup.set(canonicalId, p);
    if (p.name) pubLookup.set(p.name.trim().toLowerCase(), p);
  });

  const eventsByPubId = new Map<string, KhsAssignmentEvent[]>();
  activePublishers.forEach((p) => eventsByPubId.set(p.id, []));

  const pushEvent = (
    rawIdentifier: string | undefined | null,
    roleKey: string,
    dateStr: string,
    customLabel?: string
  ) => {
    if (!rawIdentifier || !dateStr) return;
    if (!isDateWithinRange(dateStr, timeRange)) return;

    const pub =
      pubLookup.get(rawIdentifier) ||
      pubLookup.get(rawIdentifier.trim().toLowerCase());
    if (!pub) return;

    const def = roleDefMap.get(roleKey);
    const category: KhsWeightCategory = def?.category || 'deberes_logistica';
    const points =
      weights[roleKey] !== undefined
        ? weights[roleKey]
        : def?.defaultPoints ?? 1.5;
    const roleLabel = customLabel || def?.shortLabel || roleKey;
    const weekStartDate = getMondayOfDateStr(dateStr);

    const list = eventsByPubId.get(pub.id);
    if (list) {
      list.push({
        publisherId: pub.id,
        date: dateStr,
        weekStartDate,
        roleKey,
        roleLabel,
        category,
        points,
      });
    }
  };

  // 1. Extract from Weeks (Midweek + Weekend + Duties + Cleaning)
  const sortedWeeks = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

  for (const w of sortedWeeks) {
    // Midweek
    if (!w.specialEvent?.noMeetingMidweek) {
      const mDate = w.midweek.date || w.weekStartDate;
      pushEvent(w.midweek.presidentId, 'vym_presidente', mDate);
      pushEvent(w.midweek.initialPrayerId, 'vym_oracion', mDate);
      pushEvent(w.midweek.finalPrayerId, 'vym_oracion', mDate);
      pushEvent(w.midweek.tesoros.discurso.publisherId, 'vym_tesoros_discurso', mDate);
      pushEvent(w.midweek.tesoros.perlas.publisherId, 'vym_tesoros_perlas', mDate);
      pushEvent(w.midweek.tesoros.lecturaBiblia.publisherId, 'vym_tesoros_lectura', mDate);
      if (w.midweek.tesoros.lecturaBibliaAux?.publisherId) {
        pushEvent(w.midweek.tesoros.lecturaBibliaAux.publisherId, 'vym_tesoros_lectura', mDate);
      }

      w.midweek.maestros.items.forEach((m) => {
        pushEvent(m.publisherId, 'vym_maestros_titular', mDate, m.title || 'Maestros (Titular)');
        pushEvent(m.assistantId, 'vym_maestros_ayudante', mDate, 'Ayudante Maestros');
      });

      w.midweek.vidaCristiana.items.forEach((v) => {
        pushEvent(v.publisherId, 'vym_vida_partes', mDate, v.title || 'Vida Cristiana');
      });

      pushEvent(
        w.midweek.vidaCristiana.estudioBiblico.conductorId,
        'vym_estudio_conductor',
        mDate
      );
      pushEvent(
        w.midweek.vidaCristiana.estudioBiblico.lectorId,
        'vym_estudio_lector',
        mDate
      );

      Object.entries(w.midweek.duties || {}).forEach(([dutyKey, ids]) => {
        const normalizedDutyKey = roleDefMap.has(dutyKey) ? dutyKey : 'deber_acomodador';
        (ids || []).forEach((id) => pushEvent(id, normalizedDutyKey, mDate));
      });
    }

    // Weekend
    if (!w.specialEvent?.noMeetingWeekend) {
      const wDate = w.weekend.date || w.weekEndDate || w.weekStartDate;
      pushEvent(w.weekend.presidentId, 'fds_presidente', wDate);
      pushEvent(w.weekend.atalayaConductorId, 'fds_atalaya_conductor', wDate);
      pushEvent(w.weekend.atalayaLectorId, 'fds_atalaya_lector', wDate);
      pushEvent(w.weekend.initialPrayerId, 'fds_oracion', wDate);
      pushEvent(w.weekend.finalPrayerId, 'fds_oracion', wDate);

      if (!w.weekend.isVisitingSpeaker && w.weekend.publicTalkSpeaker) {
        pushEvent(w.weekend.publicTalkSpeaker, 'orador_publico', wDate, 'Discurso Público Local');
      }
      if (w.weekend.hospitalityPublisherId) {
        pushEvent(
          w.weekend.hospitalityPublisherId,
          'hospitalidad_anfitrion',
          wDate,
          'Hospitalidad Orador'
        );
      }

      Object.entries(w.weekend.duties || {}).forEach(([dutyKey, ids]) => {
        const normalizedDutyKey = roleDefMap.has(dutyKey) ? dutyKey : 'deber_acomodador';
        (ids || []).forEach((id) => pushEvent(id, normalizedDutyKey, wDate));
      });
    }

    // Group Cleaning for the week
    if (Array.isArray(w.cleaningGroupNumbers) && w.cleaningGroupNumbers.length > 0) {
      w.cleaningGroupNumbers.forEach((grpNum) => {
        const groupMembers = activePublishers.filter(
          (p) => (p.groupNumber || 1) === grpNum
        );
        groupMembers.forEach((member) => {
          pushEvent(
            member.id,
            'limpieza_salon',
            w.weekend.date || w.weekStartDate,
            `Limpieza Grupo #${grpNum}`
          );
        });
      });
    }
  }

  // 2. Field Service Meetings (Conductors)
  fieldServiceMeetings.forEach((fsm) => {
    const dateStr = fsm.date || '';
    if (fsm.conductorId) {
      const effectiveDate =
        dateStr ||
        (sortedWeeks[sortedWeeks.length - 1]?.weekStartDate ??
          new Date().toISOString().slice(0, 10));
      pushEvent(
        fsm.conductorId,
        'servicio_campo_conductor',
        effectiveDate,
        `Salida al Campo (${fsm.dayOfWeek})`
      );
    }
  });

  // 3. Cart Shifts
  cartShifts.forEach((shift) => {
    const effectiveDate =
      shift.date ||
      (sortedWeeks[sortedWeeks.length - 1]?.weekStartDate ??
        new Date().toISOString().slice(0, 10));
    if (shift.publisher1Id) {
      pushEvent(
        shift.publisher1Id,
        'carrito_turno',
        effectiveDate,
        `Carrito (${shift.startTime}-${shift.endTime})`
      );
    }
    if (shift.publisher2Id) {
      pushEvent(
        shift.publisher2Id,
        'carrito_turno',
        effectiveDate,
        `Carrito (${shift.startTime}-${shift.endTime})`
      );
    }
  });

  // 4. Outgoing Speakers
  outgoingSpeakers.forEach((os) => {
    if (!os.date || !os.publisherId) return;
    pushEvent(
      os.publisherId,
      'orador_publico',
      os.date,
      `Orador Saliente (${os.destinationCongregation})`
    );
  });

  // 5. Circuit Overseer Visit Meals / Ministry
  if (circuitVisit) {
    (circuitVisit.meals || []).forEach((meal) => {
      if (meal.hostPublisherId && meal.date) {
        pushEvent(
          meal.hostPublisherId,
          'hospitalidad_anfitrion',
          meal.date,
          'Comida Sup. Circuito'
        );
      }
    });
    (circuitVisit.ministry || []).forEach((min) => {
      if (min.coCompanionPublisherId && min.date) {
        pushEvent(
          min.coCompanionPublisherId,
          'servicio_campo_conductor',
          min.date,
          'Acompañante Campo (Sup. Circuito)'
        );
      }
      if (min.wifeCompanionPublisherId && min.date) {
        pushEvent(
          min.wifeCompanionPublisherId,
          'servicio_campo_conductor',
          min.date,
          'Acompañante Campo (Esposa Sup. Circuito)'
        );
      }
    });
  }

  // Now compute per-publisher raw metrics
  const todayTime = new Date().getTime();

  const preliminaryReports: PublisherWorkloadReport[] = activePublishers.map((pub) => {
    const events = (eventsByPubId.get(pub.id) || []).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const { cohort, label: cohortLabel } = getPublisherCohort(pub);

    const pointsByCategory: Record<KhsWeightCategory, number> = {
      ensenanza: 0,
      estudiantil_lectura: 0,
      deberes_logistica: 0,
      ministerio_campo: 0,
      oraciones: 0,
    };
    const countsByCategory: Record<KhsWeightCategory, number> = {
      ensenanza: 0,
      estudiantil_lectura: 0,
      deberes_logistica: 0,
      ministerio_campo: 0,
      oraciones: 0,
    };
    const countsByRoleKey: Record<string, number> = {};
    const pointsByRoleKey: Record<string, number> = {};

    let totalWeightedPoints = 0;
    let lastAssignedDate: string | undefined;

    for (const ev of events) {
      totalWeightedPoints += ev.points;
      pointsByCategory[ev.category] =
        Math.round((pointsByCategory[ev.category] + ev.points) * 10) / 10;
      countsByCategory[ev.category] += 1;
      countsByRoleKey[ev.roleKey] = (countsByRoleKey[ev.roleKey] || 0) + 1;
      pointsByRoleKey[ev.roleKey] =
        Math.round(((pointsByRoleKey[ev.roleKey] || 0) + ev.points) * 10) / 10;
      if (!lastAssignedDate || ev.date > lastAssignedDate) {
        lastAssignedDate = ev.date;
      }
    }

    totalWeightedPoints = Math.round(totalWeightedPoints * 10) / 10;

    let daysSinceLastAssignment = 9999;
    if (lastAssignedDate) {
      const parts = lastAssignedDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        const lastTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        daysSinceLastAssignment = Math.max(
          0,
          Math.floor((todayTime - lastTime) / (1000 * 60 * 60 * 24))
        );
      }
    }

    // Calculate maxConsecutiveWeeks (ignoring group cleaning so only personal assignments trigger fatigue)
    const personalWeekMondays = Array.from(
      new Set(
        events
          .filter((e) => e.roleKey !== 'limpieza_salon')
          .map((e) => e.weekStartDate)
          .filter(Boolean)
      )
    ).sort();

    let maxConsecutiveWeeks = personalWeekMondays.length > 0 ? 1 : 0;
    let currentStreak = personalWeekMondays.length > 0 ? 1 : 0;
    for (let i = 1; i < personalWeekMondays.length; i++) {
      const prev = new Date(personalWeekMondays[i - 1]).getTime();
      const curr = new Date(personalWeekMondays[i]).getTime();
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays >= 5 && diffDays <= 9) {
        currentStreak += 1;
        if (currentStreak > maxConsecutiveWeeks) {
          maxConsecutiveWeeks = currentStreak;
        }
      } else {
        currentStreak = 1;
      }
    }

    // Check enabled roles vs used roles
    const enabledRoleKeys: string[] = [];
    const unusedRoleLabels: string[] = [];
    KHS_ROLE_WEIGHT_DEFINITIONS.forEach((def) => {
      if (!def.publisherRoleKey) return;
      const isEnabled = Boolean(pub.roles && pub.roles[def.publisherRoleKey]);
      if (isEnabled) {
        if (!enabledRoleKeys.includes(def.key)) {
          enabledRoleKeys.push(def.key);
        }
        const usedCount = countsByRoleKey[def.key] || 0;
        if (usedCount === 0 && !unusedRoleLabels.includes(def.shortLabel)) {
          unusedRoleLabels.push(def.shortLabel);
        }
      }
    });

    return {
      publisher: pub,
      displayName: getPubDisplayName(pub),
      cohort,
      cohortLabel,
      totalRawAssignments: events.length,
      totalWeightedPoints,
      pointsByCategory,
      countsByCategory,
      countsByRoleKey,
      pointsByRoleKey,
      lastAssignedDate,
      daysSinceLastAssignment,
      maxConsecutiveWeeks,
      hasFatigueAlert: maxConsecutiveWeeks >= 3,
      enabledRoleKeys,
      unusedRoleLabels,
      cohortAveragePoints: 0,
      relativeLoadPercent: 0,
      loadStatus: 'optimo',
      events,
    };
  });

  // Compute Cohort Averages
  const cohortSums: Record<PublisherWorkloadReport['cohort'], { sum: number; count: number }> = {
    anciano: { sum: 0, count: 0 },
    siervo_ministerial: { sum: 0, count: 0 },
    hermano_bautizado: { sum: 0, count: 0 },
    hermana_estudiante: { sum: 0, count: 0 },
  };

  preliminaryReports.forEach((r) => {
    cohortSums[r.cohort].sum += r.totalWeightedPoints;
    cohortSums[r.cohort].count += 1;
  });

  const globalSum = preliminaryReports.reduce((acc, r) => acc + r.totalWeightedPoints, 0);
  const globalAvg =
    preliminaryReports.length > 0 ? globalSum / preliminaryReports.length : 1;

  const finalReports: PublisherWorkloadReport[] = preliminaryReports.map((r) => {
    const cStats = cohortSums[r.cohort];
    const cohortAvg =
      cStats.count > 0 && cStats.sum > 0 ? cStats.sum / cStats.count : globalAvg || 1;
    const relativeLoadPercent =
      cohortAvg > 0 ? Math.round((r.totalWeightedPoints / cohortAvg) * 100) : 0;

    let loadStatus: KhsLoadStatus = 'optimo';
    if (r.totalWeightedPoints === 0 || r.daysSinceLastAssignment >= 35) {
      loadStatus = 'en_descanso';
    } else if (relativeLoadPercent > 140 || (r.hasFatigueAlert && relativeLoadPercent >= 115)) {
      loadStatus = 'sobrecargado';
    } else if (relativeLoadPercent < 60 && r.enabledRoleKeys.length > 0) {
      loadStatus = 'subutilizado';
    }

    return {
      ...r,
      cohortAveragePoints: Math.round(cohortAvg * 10) / 10,
      relativeLoadPercent,
      loadStatus,
    };
  });

  // Sort by totalWeightedPoints descending
  finalReports.sort((a, b) => b.totalWeightedPoints - a.totalWeightedPoints);

  // Category totals
  const categoryTotals: Record<KhsWeightCategory, { count: number; points: number }> = {
    ensenanza: { count: 0, points: 0 },
    estudiantil_lectura: { count: 0, points: 0 },
    deberes_logistica: { count: 0, points: 0 },
    ministerio_campo: { count: 0, points: 0 },
    oraciones: { count: 0, points: 0 },
  };

  finalReports.forEach((r) => {
    (Object.keys(categoryTotals) as KhsWeightCategory[]).forEach((cat) => {
      categoryTotals[cat].count += r.countsByCategory[cat];
      categoryTotals[cat].points =
        Math.round((categoryTotals[cat].points + r.pointsByCategory[cat]) * 10) / 10;
    });
  });

  // Build Rebalance Suggestions (Overloaded brother vs Underutilized/Resting brother with same capability)
  const rebalanceSuggestions: KhsRebalanceSuggestion[] = [];
  const overloadedList = finalReports.filter((r) => r.loadStatus === 'sobrecargado');
  const underutilizedList = [...finalReports]
    .filter((r) => r.loadStatus === 'subutilizado' || r.loadStatus === 'en_descanso')
    .sort((a, b) => a.totalWeightedPoints - b.totalWeightedPoints);

  const usedPairs = new Set<string>();
  for (const over of overloadedList) {
    for (const roleDef of KHS_ROLE_WEIGHT_DEFINITIONS) {
      if (!roleDef.publisherRoleKey) continue;
      if ((over.countsByRoleKey[roleDef.key] || 0) < 2) continue;

      const candidate = underutilizedList.find(
        (u) =>
          u.publisher.id !== over.publisher.id &&
          Boolean(u.publisher.roles && u.publisher.roles[roleDef.publisherRoleKey!]) &&
          !usedPairs.has(`${over.publisher.id}-${u.publisher.id}`)
      );

      if (candidate) {
        usedPairs.add(`${over.publisher.id}-${candidate.publisher.id}`);
        rebalanceSuggestions.push({
          id: `reb-${over.publisher.id}-${candidate.publisher.id}-${roleDef.key}`,
          roleKey: roleDef.key,
          roleLabel: roleDef.shortLabel,
          overloadedPublisher: over,
          underutilizedPublisher: candidate,
          reason: `${over.displayName} acumula ${over.totalWeightedPoints} pts (${over.countsByRoleKey[roleDef.key]}x en ${roleDef.shortLabel}), mientras que ${candidate.displayName} está habilitado para ${roleDef.shortLabel} y solo tiene ${candidate.totalWeightedPoints} pts.`,
        });
        if (rebalanceSuggestions.length >= 6) break;
      }
    }
    if (rebalanceSuggestions.length >= 6) break;
  }

  // Equity Index Score (0 - 100)
  const overloadedCount = finalReports.filter((r) => r.loadStatus === 'sobrecargado').length;
  const optimalCount = finalReports.filter((r) => r.loadStatus === 'optimo').length;
  const underutilizedCount = finalReports.filter((r) => r.loadStatus === 'subutilizado').length;
  const restingCount = finalReports.filter((r) => r.loadStatus === 'en_descanso').length;
  const fatigueAlertCount = finalReports.filter((r) => r.hasFatigueAlert).length;
  const unusedQualifiedPublishersCount = finalReports.filter(
    (r) => r.unusedRoleLabels.length > 0
  ).length;

  const totalCount = Math.max(1, finalReports.length);
  const penaltyOverload = (overloadedCount / totalCount) * 35;
  const penaltyResting = (restingCount / totalCount) * 25;
  const penaltyFatigue = (fatigueAlertCount / totalCount) * 20;
  const rawScore = Math.round(100 - penaltyOverload - penaltyResting - penaltyFatigue);
  const equityIndexScore = Math.max(15, Math.min(100, rawScore));

  return {
    reports: finalReports,
    equityIndexScore,
    totalActivePublishers: finalReports.length,
    totalAssignmentsCount: finalReports.reduce((acc, r) => acc + r.totalRawAssignments, 0),
    totalWeightedPoints: Math.round(globalSum * 10) / 10,
    averagePointsPerPublisher: Math.round(globalAvg * 10) / 10,
    overloadedCount,
    optimalCount,
    underutilizedCount,
    restingCount,
    fatigueAlertCount,
    unusedQualifiedPublishersCount,
    categoryTotals,
    rebalanceSuggestions,
  };
}

export function buildKhsEquityWhatsAppSummary(
  audit: KhsCongregationAuditSummary,
  congregationName: string,
  timeRangeLabel: string
): string {
  const lines: string[] = [];
  lines.push(`*AUDITORÍA DE EQUIDAD Y PESO DE CARGA*`);
  lines.push(`*Congregación:* ${congregationName}`);
  lines.push(`*Período:* ${timeRangeLabel}`);
  lines.push(`*Índice Global de Equidad:* ${audit.equityIndexScore}%`);
  lines.push(
    `*Carga Total:* ${audit.totalWeightedPoints} pts (${audit.totalAssignmentsCount} asignaciones) • Promedio: ${audit.averagePointsPerPublisher} pts/publicador`
  );
  lines.push('');

  lines.push(`*RESUMEN DE DISTRIBUCIÓN:*`);
  lines.push(`• Carga Óptima: ${audit.optimalCount} publicadores`);
  lines.push(`• Sobrecargados: ${audit.overloadedCount} publicadores`);
  lines.push(`• Subutilizados: ${audit.underutilizedCount} publicadores`);
  lines.push(`• En Descanso (+35 días o 0 pts): ${audit.restingCount} publicadores`);
  if (audit.fatigueAlertCount > 0) {
    lines.push(`• Alerta de Fatiga (3+ semanas seguidas): ${audit.fatigueAlertCount}`);
  }
  lines.push('');

  if (audit.rebalanceSuggestions.length > 0) {
    lines.push(`*SUGERENCIAS DE REBALANCEO:*`);
    audit.rebalanceSuggestions.slice(0, 4).forEach((s, idx) => {
      lines.push(
        `${idx + 1}. *${s.roleLabel}:* Dar descanso a ${s.overloadedPublisher.displayName} (${s.overloadedPublisher.totalWeightedPoints} pts) y priorizar a ${s.underutilizedPublisher.displayName} (${s.underutilizedPublisher.totalWeightedPoints} pts).`
      );
    });
    lines.push('');
  }

  const topResting = audit.reports
    .filter((r) => r.loadStatus === 'en_descanso' && r.enabledRoleKeys.length > 0)
    .slice(0, 5);
  if (topResting.length > 0) {
    lines.push(`*HERMANOS CAPACITADOS EN DESCANSO:*`);
    topResting.forEach((r) => {
      const daysTxt =
        r.daysSinceLastAssignment >= 900 ? 'Sin asignar' : `${r.daysSinceLastAssignment} días`;
      lines.push(
        `• ${r.displayName} (${r.cohortLabel}) — ${daysTxt} [Roles: ${r.unusedRoleLabels.slice(0, 3).join(', ')}]`
      );
    });
  }

  return lines.join('\n');
}

export function printKhsEquityAuditReport(
  audit: KhsCongregationAuditSummary,
  settings: CongregationSettings,
  timeRangeLabel: string
): void {
  if (typeof document === 'undefined') return;

  const existingFrame = document.getElementById('khs-equity-print-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'khs-equity-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const rowsHtml = audit.reports
    .map((r, idx) => {
      const statusLabel =
        r.loadStatus === 'sobrecargado'
          ? 'SOBRECARGADO'
          : r.loadStatus === 'subutilizado'
          ? 'SUBUTILIZADO'
          : r.loadStatus === 'en_descanso'
          ? 'EN DESCANSO'
          : 'ÓPTIMO';
      const statusColor =
        r.loadStatus === 'sobrecargado'
          ? '#b91c1c'
          : r.loadStatus === 'subutilizado'
          ? '#b45309'
          : r.loadStatus === 'en_descanso'
          ? '#64748b'
          : '#047857';

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td>
            <strong>${r.displayName}</strong>
            <div style="font-size:10px;color:#64748b;">${r.cohortLabel} • Grupo #${r.publisher.groupNumber || 1}</div>
          </td>
          <td style="text-align:center;font-weight:700;color:#1e1b4b;">${r.totalWeightedPoints} pts</td>
          <td style="text-align:center;">${r.totalRawAssignments}</td>
          <td style="text-align:center;">${r.pointsByCategory.ensenanza} pts (${r.countsByCategory.ensenanza})</td>
          <td style="text-align:center;">${r.pointsByCategory.estudiantil_lectura} pts (${r.countsByCategory.estudiantil_lectura})</td>
          <td style="text-align:center;">${r.pointsByCategory.deberes_logistica} pts (${r.countsByCategory.deberes_logistica})</td>
          <td style="text-align:center;">${r.pointsByCategory.ministerio_campo} pts (${r.countsByCategory.ministerio_campo})</td>
          <td style="text-align:center;">${r.maxConsecutiveWeeks} sem.${r.hasFatigueAlert ? ' ⚠️' : ''}</td>
          <td style="text-align:center;">${r.daysSinceLastAssignment >= 900 ? '—' : `${r.daysSinceLastAssignment} d`}</td>
          <td style="text-align:center;font-weight:700;font-size:10px;color:${statusColor};">${statusLabel}</td>
        </tr>
      `;
    })
    .join('');

  const suggestionsHtml =
    audit.rebalanceSuggestions.length > 0
      ? `
      <div style="margin-top:16px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;">
        <h3 style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#1e293b;">Sugerencias de Rebalanceo Teocrático</h3>
        <ul style="margin:0;padding-left:18px;font-size:11px;color:#334155;">
          ${audit.rebalanceSuggestions.map((s) => `<li style="margin-bottom:4px;">${s.reason}</li>`).join('')}
        </ul>
      </div>
    `
      : '';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Auditoría de Equidad y Peso de Carga - ${settings.congregationName || 'Congregación'}</title>
      <style>
        @page { size: letter landscape; margin: 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
        .subtitle { font-size: 11px; color: #475569; margin-top: 2px; }
        .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
        .kpi { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
        .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
        .kpi-val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #1e293b; color: #ffffff; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.04em; padding: 6px 5px; border: 1px solid #1e293b; }
        td { padding: 5px; border: 1px solid #cbd5e1; vertical-align: middle; }
        tr:nth-child(even) { background: #f8fafc; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Auditoría de Equidad y Peso de Carga</div>
          <div class="subtitle">${settings.congregationName || 'Congregación'} • Período evaluado: ${timeRangeLabel}</div>
        </div>
        <div style="text-align:right;font-size:11px;color:#475569;">
          Índice de Equidad: <strong>${audit.equityIndexScore}%</strong><br/>
          Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi">
          <div class="kpi-label">Carga Total</div>
          <div class="kpi-val">${audit.totalWeightedPoints} pts (${audit.totalAssignmentsCount} asig.)</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Promedio por Publicador</div>
          <div class="kpi-val">${audit.averagePointsPerPublisher} pts</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Carga Óptima</div>
          <div class="kpi-val" style="color:#047857;">${audit.optimalCount} hermanos</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Sobrecargados / Fatiga</div>
          <div class="kpi-val" style="color:#b91c1c;">${audit.overloadedCount} (${audit.fatigueAlertCount} fatiga)</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Subutilizados / Descanso</div>
          <div class="kpi-val" style="color:#b45309;">${audit.underutilizedCount + audit.restingCount} hermanos</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:28px;">#</th>
            <th style="text-align:left;">Publicador / Privilegio</th>
            <th>Peso Total</th>
            <th>Asig.</th>
            <th>Enseñanza</th>
            <th>Estud./Lect.</th>
            <th>Deberes/Audio</th>
            <th>Campo/Carritos</th>
            <th>Racha Máx.</th>
            <th>Últ. Asig.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${suggestionsHtml}
    </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }
}
