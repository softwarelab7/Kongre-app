// src/utils/unifiedMonthlyAssignments.ts
import {
  Publisher,
  WeekSchedule,
  CongregationSettings,
  CartShift,
  CartLocation,
  OutgoingSpeakerAssignment,
  FieldServiceMeeting,
  PreachingGroup,
  CustomDuty,
  CircuitOverseerVisit,
  ClmPrograma,
  AssignmentStatus,
} from '../types';
import { arePublishersFamily, getPubId, getPubDisplayName } from './familyGrouping';
import { generateConfirmationUrl } from './whatsapp';

export type UnifiedAssignmentCategory =
  | 'vym'
  | 'fin_de_semana'
  | 'deberes'
  | 'limpieza'
  | 'carritos'
  | 'servicio_campo'
  | 'orador_saliente'
  | 'hospitalidad';

export interface UnifiedAssignmentItem {
  id: string;
  publisherId: string;
  publisherName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  category: UnifiedAssignmentCategory;
  categoryLabel: string;
  meetingOrVenue: string;
  title: string;
  subtitle?: string;
  partnerName?: string;
  room?: 'principal' | 'auxiliar';
  lessonNumber?: number;
  status: AssignmentStatus;
  weekId?: string;
  meetingType?: 'midweek' | 'weekend';
  assignmentPath?: string;
  canConfirmInPortal?: boolean;
  familyAssignedSameDay?: string[];
}

export interface UnifiedExtractorSources {
  publishers: Publisher[];
  publishersMap: Map<string, Publisher>;
  weeks: WeekSchedule[];
  settings: CongregationSettings;
  preachingGroups?: PreachingGroup[];
  customDuties?: CustomDuty[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  outgoingSpeakers?: OutgoingSpeakerAssignment[];
  fieldServiceMeetings?: FieldServiceMeeting[];
  circuitVisit?: CircuitOverseerVisit | null;
  clmProgramas?: Record<string, ClmPrograma>;
}

export interface PublisherMonthlyBundle {
  publisher: Publisher;
  monthKey: string; // 'YYYY-MM' or 'all_upcoming'
  assignments: UnifiedAssignmentItem[];
  countsByCategory: Record<UnifiedAssignmentCategory, number>;
  familySharedDaysCount: number;
}

const DUTY_FRIENDLY_LABELS: Record<string, string> = {
  deber_audio: 'Consola de Audio',
  deber_video: 'Video y Multimedia',
  deber_microfonos: 'Micrófonos',
  deber_acomodador: 'Acomodador (Entrada / Auditorio)',
  deber_seguridad: 'Seguridad / Estacionamiento',
  deber_plataforma: 'Plataforma',
  deber_zoom: 'Operador de Zoom / Transmisión',
  sonido: 'Consola de Audio',
  microfonos: 'Micrófonos',
  acomodador: 'Acomodador',
  seguridad: 'Seguridad / Estacionamiento',
  plataforma: 'Plataforma',
  video: 'Video y Multimedia',
  zoom: 'Operador de Zoom',
};

export function getDutyFriendlyLabel(dutyKey: string, customDuties?: CustomDuty[]): string {
  if (DUTY_FRIENDLY_LABELS[dutyKey]) return DUTY_FRIENDLY_LABELS[dutyKey];
  const custom = customDuties?.find((d) => d.key === dutyKey || d.id === dutyKey);
  if (custom) return custom.name;
  return dutyKey
    .replace(/^deber_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function formatSpanishMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === 'all_upcoming') return 'Próximas Asignaciones';
  const [y, m] = monthKey.split('-');
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const idx = parseInt(m, 10) - 1;
  return `${monthNames[idx] || m} ${y}`;
}

export function formatShortSpanishDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return dateStr;
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function matchesPublisherId(candidateId: string | undefined | null, pub: Publisher): boolean {
  if (!candidateId) return false;
  return (
    candidateId === pub.id ||
    (Boolean(pub.nid) && candidateId === pub.nid) ||
    candidateId === getPubId(pub)
  );
}

/**
 * Obtiene todos los IDs de publicadores asignados en una fecha específica (para calcular coincidencias familiares).
 */
function buildAssignedPublisherIdsByDate(sources: UnifiedExtractorSources): Map<string, Set<string>> {
  const byDate = new Map<string, Set<string>>();
  const add = (date: string | undefined, pid: string | undefined | null) => {
    if (!date || !pid) return;
    if (!byDate.has(date)) byDate.set(date, new Set());
    byDate.get(date)!.add(pid);
  };

  sources.weeks.forEach((w) => {
    const midDate = w.midweek.date || w.weekStartDate;
    if (!w.specialEvent?.noMeetingMidweek) {
      add(midDate, w.midweek.presidentId);
      add(midDate, w.midweek.auxiliaryCounselorId);
      add(midDate, w.midweek.initialPrayerId);
      add(midDate, w.midweek.finalPrayerId);
      add(midDate, w.midweek.tesoros.discurso.publisherId);
      add(midDate, w.midweek.tesoros.perlas.publisherId);
      add(midDate, w.midweek.tesoros.lecturaBiblia.publisherId);
      add(midDate, w.midweek.tesoros.lecturaBibliaAux?.publisherId);
      w.midweek.maestros.items.forEach((it) => {
        add(midDate, it.publisherId);
        add(midDate, it.assistantId);
      });
      w.midweek.vidaCristiana.items.forEach((it) => add(midDate, it.publisherId));
      add(midDate, w.midweek.vidaCristiana.estudioBiblico.conductorId);
      add(midDate, w.midweek.vidaCristiana.estudioBiblico.lectorId);
      Object.values(w.midweek.duties || {}).forEach((ids) => ids.forEach((id) => add(midDate, id)));
    }

    const wkndDate = w.weekend.date || w.weekEndDate;
    if (!w.specialEvent?.noMeetingWeekend) {
      add(wkndDate, w.weekend.presidentId);
      if (!w.weekend.isVisitingSpeaker) add(wkndDate, w.weekend.publicTalkSpeaker);
      add(wkndDate, w.weekend.hospitalityPublisherId);
      add(wkndDate, w.weekend.atalayaConductorId);
      add(wkndDate, w.weekend.atalayaLectorId);
      add(wkndDate, w.weekend.initialPrayerId);
      add(wkndDate, w.weekend.finalPrayerId);
      Object.values(w.weekend.duties || {}).forEach((ids) => ids.forEach((id) => add(wkndDate, id)));
    }
  });

  (sources.cartShifts || []).forEach((s) => {
    if (s.date) {
      add(s.date, s.publisher1Id);
      add(s.date, s.publisher2Id);
    }
  });

  (sources.fieldServiceMeetings || []).forEach((fsm) => {
    if (fsm.date && fsm.conductorId) {
      add(fsm.date, fsm.conductorId);
    }
  });

  return byDate;
}

/**
 * Extrae la lista unificada de TODAS las asignaciones de un publicador (VMC, Fin de Semana,
 * Deberes/Audio/Micrófonos/Acomodador, Limpieza, Carritos, Orador Saliente y Hospitalidad).
 */
export function extractUnifiedAssignmentsForPublisher(
  publisher: Publisher,
  sources: UnifiedExtractorSources,
  monthFilter: string = 'all_upcoming' // 'YYYY-MM' o 'all_upcoming'
): UnifiedAssignmentItem[] {
  const list: UnifiedAssignmentItem[] = [];
  const pubId = getPubId(publisher);
  const pubName = getPubDisplayName(publisher);
  if (!pubId) return list;

  const midTime = sources.settings.midweekMeetingTime || '19:00';
  const wkndTime = sources.settings.weekendMeetingTime || '10:00';
  const hallName = sources.settings.congregationName
    ? `Salón del Reino (${sources.settings.congregationName})`
    : 'Salón del Reino';

  // Grupo de predicación del publicador (para Limpieza)
  const myGroup = (sources.preachingGroups || []).find(
    (g) =>
      g.number === publisher.groupNumber ||
      g.memberIds.includes(publisher.id) ||
      g.overseerId === publisher.id ||
      g.assistantId === publisher.id
  );
  const myGroupNumber = myGroup?.number ?? publisher.groupNumber;

  const isDateIncluded = (dateStr: string): boolean => {
    if (!dateStr) return false;
    if (monthFilter && monthFilter !== 'all_upcoming') {
      return dateStr.startsWith(monthFilter);
    }
    return true;
  };

  // 1. REUNIONES SEMANALES (VMC, FIN DE SEMANA, DEBERES Y LIMPIEZA)
  sources.weeks.forEach((w) => {
    const midDate = w.midweek.date || w.weekStartDate;
    const wkndDate = w.weekend.date || w.weekEndDate;

    // 1A. ENTRE SEMANA (VIDA Y MINISTERIO + DEBERES)
    if (!w.specialEvent?.noMeetingMidweek && isDateIncluded(midDate)) {
      const addedPartKeys = new Set<string>();

      if (matchesPublisherId(w.midweek.presidentId, publisher)) {
        addedPartKeys.add('presidente');
        list.push({
          id: `uni-mid-pres-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 105,
          category: 'vym',
          categoryLabel: 'Vida y Ministerio',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Presidente de la Reunión',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'presidentId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.auxiliaryCounselorId, publisher)) {
        addedPartKeys.add('consejero_aux');
        list.push({
          id: `uni-mid-auxc-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 105,
          category: 'vym',
          categoryLabel: 'Vida y Ministerio',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Consejero de la Sala Auxiliar',
          room: 'auxiliar',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'auxiliaryCounselorId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.initialPrayerId, publisher)) {
        addedPartKeys.add('oracion_apertura');
        list.push({
          id: `uni-mid-inip-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 5,
          category: 'vym',
          categoryLabel: 'Vida y Ministerio',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Oración de Apertura',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'initialPrayerId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.finalPrayerId, publisher)) {
        addedPartKeys.add('oracion_cierre');
        list.push({
          id: `uni-mid-finp-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 5,
          category: 'vym',
          categoryLabel: 'Vida y Ministerio',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Oración de Conclusión',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'finalPrayerId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.tesoros.discurso.publisherId, publisher)) {
        addedPartKeys.add('discurso_tesoros');
        list.push({
          id: `uni-tes-disc-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 10,
          category: 'vym',
          categoryLabel: 'Tesoros de la Biblia',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: `Discurso (10 min): ${w.midweek.tesoros.discurso.title}`,
          status: w.midweek.tesoros.discurso.status || 'pendiente',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'tesoros.discurso',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.tesoros.perlas.publisherId, publisher)) {
        addedPartKeys.add('busquemos_perlas');
        list.push({
          id: `uni-tes-perl-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 10,
          category: 'vym',
          categoryLabel: 'Tesoros de la Biblia',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Busquemos Perlas Escondidas (10 min)',
          status: w.midweek.tesoros.perlas.status || 'pendiente',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'tesoros.perlas',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.tesoros.lecturaBiblia.publisherId, publisher)) {
        addedPartKeys.add('lectura_biblica_main');
        list.push({
          id: `uni-tes-lect-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 4,
          category: 'vym',
          categoryLabel: 'Asignación Estudiantil (S-89)',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Lectura de la Biblia (4 min)',
          subtitle: w.midweek.bibleReading ? `Lectura: ${w.midweek.bibleReading}` : undefined,
          room: 'principal',
          lessonNumber: w.midweek.tesoros.lecturaBiblia.lessonNumber,
          status: w.midweek.tesoros.lecturaBiblia.status || 'pendiente',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'tesoros.lecturaBiblia',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.tesoros.lecturaBibliaAux?.publisherId, publisher)) {
        addedPartKeys.add('lectura_biblica_aux');
        list.push({
          id: `uni-tes-lectaux-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 4,
          category: 'vym',
          categoryLabel: 'Asignación Estudiantil (S-89)',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Lectura de la Biblia (Sala Auxiliar)',
          subtitle: w.midweek.bibleReading ? `Lectura: ${w.midweek.bibleReading}` : undefined,
          room: 'auxiliar',
          lessonNumber: w.midweek.tesoros.lecturaBibliaAux?.lessonNumber,
          status: w.midweek.tesoros.lecturaBibliaAux?.status || 'pendiente',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'tesoros.lecturaBibliaAux',
          canConfirmInPortal: true,
        });
      }

      w.midweek.maestros.items.forEach((item, idx) => {
        if (matchesPublisherId(item.publisherId, publisher)) {
          const assistantName = item.assistantId
            ? sources.publishersMap.get(item.assistantId)?.name
            : undefined;
          list.push({
            id: `uni-maes-tit-${w.id}-${idx}-${pubId}`,
            publisherId: pubId,
            publisherName: pubName,
            date: midDate,
            time: midTime,
            durationMinutes: item.timeMinutes || 4,
            category: 'vym',
            categoryLabel: 'Seamos Mejores Maestros (S-89)',
            meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
            title: `Titular: ${item.title}`,
            partnerName: assistantName ? `Ayudante: ${assistantName}` : undefined,
            room: item.room || 'principal',
            lessonNumber: item.lessonNumber,
            status: item.status || 'pendiente',
            weekId: w.id,
            meetingType: 'midweek',
            assignmentPath: `maestros.${idx}`,
            canConfirmInPortal: true,
          });
        }
        if (matchesPublisherId(item.assistantId, publisher)) {
          const titularName = item.publisherId
            ? sources.publishersMap.get(item.publisherId)?.name || 'Estudiante'
            : 'Estudiante';
          list.push({
            id: `uni-maes-asst-${w.id}-${idx}-${pubId}`,
            publisherId: pubId,
            publisherName: pubName,
            date: midDate,
            time: midTime,
            durationMinutes: item.timeMinutes || 4,
            category: 'vym',
            categoryLabel: 'Seamos Mejores Maestros (S-89)',
            meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
            title: `Ayudante en: ${item.title}`,
            partnerName: `Titular: ${titularName}`,
            room: item.room || 'principal',
            status: item.status || 'pendiente',
            weekId: w.id,
            meetingType: 'midweek',
            assignmentPath: `maestros_helper.${idx}`,
            canConfirmInPortal: true,
          });
        }
      });

      w.midweek.vidaCristiana.items.forEach((item, idx) => {
        if (matchesPublisherId(item.publisherId, publisher)) {
          list.push({
            id: `uni-vida-${w.id}-${idx}-${pubId}`,
            publisherId: pubId,
            publisherName: pubName,
            date: midDate,
            time: midTime,
            durationMinutes: item.timeMinutes || 15,
            category: 'vym',
            categoryLabel: 'Nuestra Vida Cristiana',
            meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
            title: item.title,
            status: item.status || 'pendiente',
            weekId: w.id,
            meetingType: 'midweek',
            assignmentPath: `vida.${idx}`,
            canConfirmInPortal: true,
          });
        }
      });

      if (matchesPublisherId(w.midweek.vidaCristiana.estudioBiblico.conductorId, publisher)) {
        list.push({
          id: `uni-cbs-cond-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 30,
          category: 'vym',
          categoryLabel: 'Nuestra Vida Cristiana',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Conductor del Estudio Bíblico de la Congregación',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'vidaCristiana.estudioBiblico.conductorId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.midweek.vidaCristiana.estudioBiblico.lectorId, publisher)) {
        list.push({
          id: `uni-cbs-lect-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: midDate,
          time: midTime,
          durationMinutes: 30,
          category: 'vym',
          categoryLabel: 'Nuestra Vida Cristiana',
          meetingOrVenue: 'Reunión Vida y Ministerio Cristianos',
          title: 'Lector del Estudio Bíblico de la Congregación',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'midweek',
          assignmentPath: 'vidaCristiana.estudioBiblico.lectorId',
          canConfirmInPortal: true,
        });
      }

      // Deberes entre semana
      Object.entries(w.midweek.duties || {}).forEach(([dutyKey, ids]) => {
        if (ids.some((id) => matchesPublisherId(id, publisher))) {
          const coAssigned = ids
            .filter((id) => !matchesPublisherId(id, publisher))
            .map((id) => sources.publishersMap.get(id)?.name)
            .filter(Boolean);
          list.push({
            id: `uni-duty-mid-${w.id}-${dutyKey}-${pubId}`,
            publisherId: pubId,
            publisherName: pubName,
            date: midDate,
            time: midTime,
            durationMinutes: 105,
            category: 'deberes',
            categoryLabel: 'Deberes y Acomodadores',
            meetingOrVenue: 'Reunión Entre Semana',
            title: getDutyFriendlyLabel(dutyKey, sources.customDuties),
            partnerName: coAssigned.length > 0 ? `Con: ${coAssigned.join(', ')}` : undefined,
            status: 'confirmada',
            weekId: w.id,
            meetingType: 'midweek',
            assignmentPath: `midweek_duty_${dutyKey}`,
            canConfirmInPortal: true,
          });
        }
      });
    }

    // 1B. FIN DE SEMANA (DISCURSO PÚBLICO, ATALAYA, HOSPITALIDAD Y DEBERES)
    if (!w.specialEvent?.noMeetingWeekend && isDateIncluded(wkndDate)) {
      if (matchesPublisherId(w.weekend.presidentId, publisher)) {
        list.push({
          id: `uni-fds-pres-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: wkndDate,
          time: wkndTime,
          durationMinutes: 105,
          category: 'fin_de_semana',
          categoryLabel: 'Reunión de Fin de Semana',
          meetingOrVenue: 'Reunión del Fin de Semana',
          title: 'Presidente de la Reunión',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'weekend',
          assignmentPath: 'presidentId',
          canConfirmInPortal: true,
        });
      }

      if (
        !w.weekend.isVisitingSpeaker &&
        matchesPublisherId(w.weekend.publicTalkSpeaker, publisher)
      ) {
        list.push({
          id: `uni-fds-spk-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: wkndDate,
          time: wkndTime,
          durationMinutes: 30,
          category: 'fin_de_semana',
          categoryLabel: 'Discurso Público',
          meetingOrVenue: 'Reunión del Fin de Semana',
          title: `Orador de Discurso Público${w.weekend.publicTalkOutlineNumber ? ` (Bosquejo #${w.weekend.publicTalkOutlineNumber})` : ''}`,
          subtitle: w.weekend.publicTalkTheme || undefined,
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'weekend',
          assignmentPath: 'publicTalkSpeaker',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.weekend.atalayaConductorId, publisher)) {
        list.push({
          id: `uni-fds-atcond-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: wkndDate,
          time: wkndTime,
          durationMinutes: 60,
          category: 'fin_de_semana',
          categoryLabel: 'Estudio de La Atalaya',
          meetingOrVenue: 'Reunión del Fin de Semana',
          title: 'Conductor del Estudio de La Atalaya',
          subtitle: w.weekend.watchtowerTheme || undefined,
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'weekend',
          assignmentPath: 'atalayaConductorId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.weekend.atalayaLectorId, publisher)) {
        list.push({
          id: `uni-fds-atlect-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: wkndDate,
          time: wkndTime,
          durationMinutes: 60,
          category: 'fin_de_semana',
          categoryLabel: 'Estudio de La Atalaya',
          meetingOrVenue: 'Reunión del Fin de Semana',
          title: 'Lector de La Atalaya',
          subtitle: w.weekend.watchtowerTheme || undefined,
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'weekend',
          assignmentPath: 'atalayaLectorId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.weekend.finalPrayerId, publisher)) {
        list.push({
          id: `uni-fds-finp-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: wkndDate,
          time: wkndTime,
          durationMinutes: 5,
          category: 'fin_de_semana',
          categoryLabel: 'Reunión de Fin de Semana',
          meetingOrVenue: 'Reunión del Fin de Semana',
          title: 'Oración Final (Fin de Semana)',
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'weekend',
          assignmentPath: 'finalPrayerId',
          canConfirmInPortal: true,
        });
      }

      if (matchesPublisherId(w.weekend.hospitalityPublisherId, publisher)) {
        list.push({
          id: `uni-fds-hosp-${w.id}-${pubId}`,
          publisherId: pubId,
          publisherName: pubName,
          date: wkndDate,
          time: '12:30',
          durationMinutes: 90,
          category: 'hospitalidad',
          categoryLabel: 'Hospitalidad Teocrática',
          meetingOrVenue: hallName,
          title: 'Anfitrión de Hospitalidad para el Orador Público',
          subtitle: w.weekend.publicTalkSpeaker
            ? `Orador: ${w.weekend.publicTalkSpeaker}${w.weekend.visitingSpeakerCongregation ? ` (${w.weekend.visitingSpeakerCongregation})` : ''}`
            : undefined,
          status: 'confirmada',
          weekId: w.id,
          meetingType: 'weekend',
        });
      }

      // Deberes fin de semana
      Object.entries(w.weekend.duties || {}).forEach(([dutyKey, ids]) => {
        if (ids.some((id) => matchesPublisherId(id, publisher))) {
          const coAssigned = ids
            .filter((id) => !matchesPublisherId(id, publisher))
            .map((id) => sources.publishersMap.get(id)?.name)
            .filter(Boolean);
          list.push({
            id: `uni-duty-fds-${w.id}-${dutyKey}-${pubId}`,
            publisherId: pubId,
            publisherName: pubName,
            date: wkndDate,
            time: wkndTime,
            durationMinutes: 105,
            category: 'deberes',
            categoryLabel: 'Deberes y Acomodadores',
            meetingOrVenue: 'Reunión del Fin de Semana',
            title: getDutyFriendlyLabel(dutyKey, sources.customDuties),
            partnerName: coAssigned.length > 0 ? `Con: ${coAssigned.join(', ')}` : undefined,
            status: 'confirmada',
            weekId: w.id,
            meetingType: 'weekend',
            assignmentPath: `weekend_duty_${dutyKey}`,
            canConfirmInPortal: true,
          });
        }
      });
    }

    // 1C. LIMPIEZA SEMANAL DEL SALÓN DEL REINO POR GRUPO
    if (
      myGroupNumber !== undefined &&
      Array.isArray(w.cleaningGroupNumbers) &&
      w.cleaningGroupNumbers.includes(myGroupNumber) &&
      isDateIncluded(wkndDate)
    ) {
      const groupLabel = myGroup?.name || `Grupo ${myGroupNumber}`;
      list.push({
        id: `uni-clean-${w.id}-grp${myGroupNumber}-${pubId}`,
        publisherId: pubId,
        publisherName: pubName,
        date: wkndDate,
        time: wkndTime,
        durationMinutes: 45,
        category: 'limpieza',
        categoryLabel: 'Aseo y Limpieza del Salón',
        meetingOrVenue: hallName,
        title: `Limpieza Semanal del Salón del Reino (${groupLabel})`,
        subtitle: `Semana del ${w.weekStartDate} al ${w.weekEndDate}`,
        status: 'confirmada',
        weekId: w.id,
      });
    }
  });

  // 2. TURNOS DE PREDICACIÓN PÚBLICA (CARRITOS)
  (sources.cartShifts || []).forEach((shift) => {
    const isPub1 = matchesPublisherId(shift.publisher1Id, publisher);
    const isPub2 = matchesPublisherId(shift.publisher2Id, publisher);
    if (!isPub1 && !isPub2) return;

    const shiftDate = shift.date || '';
    if (shiftDate && !isDateIncluded(shiftDate)) return;

    const loc = (sources.cartLocations || []).find((l) => l.id === shift.locationId);
    const partnerId = isPub1 ? shift.publisher2Id : shift.publisher1Id;
    const partnerName = partnerId ? sources.publishersMap.get(partnerId)?.name : undefined;

    list.push({
      id: `uni-cart-${shift.id}-${pubId}`,
      publisherId: pubId,
      publisherName: pubName,
      date: shiftDate || sources.weeks[0]?.weekStartDate || new Date().toISOString().slice(0, 10),
      time: shift.startTime || '09:00',
      durationMinutes: 120,
      category: 'carritos',
      categoryLabel: 'Predicación con Exhibidores (Carritos)',
      meetingOrVenue: loc ? `${loc.name} (${loc.address})` : 'Punto de Exhibidor Público',
      title: `Turno de Carrito (${shift.dayOfWeek} ${shift.startTime} - ${shift.endTime})`,
      partnerName: partnerName ? `Compañero(a): ${partnerName}` : undefined,
      subtitle: shift.notes || undefined,
      status: 'confirmada',
    });
  });

  // 3. ORADOR SALIENTE (DISCURSOS EN OTRAS CONGREGACIONES)
  (sources.outgoingSpeakers || []).forEach((out) => {
    if (!matchesPublisherId(out.publisherId, publisher)) return;
    if (!isDateIncluded(out.date)) return;

    list.push({
      id: `uni-outspk-${out.id}-${pubId}`,
      publisherId: pubId,
      publisherName: pubName,
      date: out.date,
      time: wkndTime,
      durationMinutes: 105,
      category: 'orador_saliente',
      categoryLabel: 'Orador Visitante (Saliente)',
      meetingOrVenue: `Congregación ${out.destinationCongregation}`,
      title: `Discurso Público fuera (#${out.outlineNumber}): ${out.outlineTitle}`,
      subtitle: `Destino: Congregación ${out.destinationCongregation}`,
      status: 'confirmada',
    });
  });

  // 4. COMIDAS / ACOMPAÑAMIENTO EN VISITA DEL SUPERINTENDENTE DE CIRCUITO
  if (sources.circuitVisit) {
    (sources.circuitVisit.meals || []).forEach((meal) => {
      if (!matchesPublisherId(meal.hostPublisherId, publisher)) return;
      if (!isDateIncluded(meal.date)) return;
      list.push({
        id: `uni-sc-meal-${meal.id}-${pubId}`,
        publisherId: pubId,
        publisherName: pubName,
        date: meal.date,
        time: meal.mealType === 'almuerzo' ? '13:00' : '19:30',
        durationMinutes: 90,
        category: 'hospitalidad',
        categoryLabel: 'Hospitalidad Visita SC',
        meetingOrVenue: meal.location || 'Hogar de la familia anfitriona',
        title: `${meal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'} con el Superintendente de Circuito (${sources.circuitVisit?.overseerName || 'SC'})`,
        subtitle: meal.notes || undefined,
        status: meal.isConfirmed ? 'confirmada' : 'pendiente',
      });
    });
  }

  // 4B. SALIDAS AL SERVICIO DEL CAMPO (CONDUCTOR DE REUNIÓN PARA EL SERVICIO)
  (sources.fieldServiceMeetings || []).forEach((fsm) => {
    if (!matchesPublisherId(fsm.conductorId, publisher)) return;
    const fsmDate = fsm.date || '';
    if (fsmDate && !isDateIncluded(fsmDate)) return;

    const grp = fsm.groupNumber
      ? (sources.preachingGroups || []).find((g) => g.number === fsm.groupNumber)
      : undefined;
    const groupLabel = grp ? grp.name : fsm.groupNumber ? `Grupo ${fsm.groupNumber}` : 'Congregación General';

    list.push({
      id: `uni-fsm-${fsm.id}-${pubId}`,
      publisherId: pubId,
      publisherName: pubName,
      date: fsmDate || sources.weeks[0]?.weekStartDate || new Date().toISOString().slice(0, 10),
      time: fsm.time || '09:00',
      durationMinutes: 15,
      category: 'servicio_campo',
      categoryLabel: 'Servicio del Campo (Conductor)',
      meetingOrVenue: fsm.location || hallName,
      title: `Conductor de Salida al Servicio del Campo (${fsm.dayOfWeek} ${fsm.time})`,
      subtitle: `${groupLabel}${fsm.territoryNumber ? ` • Territorio sugerido: #${fsm.territoryNumber}` : ''}${fsm.notes ? ` • ${fsm.notes}` : ''}`,
      status: 'confirmada',
    });
  });

  // 5. ENRIQUECER CON COINCIDENCIA FAMILIAR (KHS FAMILY GROUPING)
  const assignedByDate = buildAssignedPublisherIdsByDate(sources);
  list.forEach((item) => {
    const pidsOnDate = assignedByDate.get(item.date);
    if (!pidsOnDate || pidsOnDate.size <= 1) return;
    const famNames: string[] = [];
    pidsOnDate.forEach((otherId) => {
      if (otherId === pubId || otherId === publisher.id || otherId === publisher.nid) return;
      const otherPub =
        sources.publishersMap.get(otherId) ||
        sources.publishers.find((p) => p.id === otherId || p.nid === otherId);
      if (otherPub && arePublishersFamily(publisher, otherPub)) {
        const displayName = getPubDisplayName(otherPub);
        if (displayName && !famNames.includes(displayName)) {
          famNames.push(displayName);
        }
      }
    });
    if (famNames.length > 0) {
      item.familyAssignedSameDay = famNames;
    }
  });

  return list.sort((a, b) => {
    const cmpDate = a.date.localeCompare(b.date);
    if (cmpDate !== 0) return cmpDate;
    return a.time.localeCompare(b.time);
  });
}

/**
 * Genera el paquete mensual unificado para TODOS los publicadores que tienen al menos 1 asignación en el mes.
 */
export function extractAllPublishersMonthlyBundles(
  sources: UnifiedExtractorSources,
  monthKey: string
): PublisherMonthlyBundle[] {
  const bundles: PublisherMonthlyBundle[] = [];

  sources.publishers.forEach((pub) => {
    if (pub.active === false) return;
    const assignments = extractUnifiedAssignmentsForPublisher(pub, sources, monthKey);
    if (assignments.length === 0) return;

    const countsByCategory: Record<UnifiedAssignmentCategory, number> = {
      vym: 0,
      fin_de_semana: 0,
      deberes: 0,
      limpieza: 0,
      carritos: 0,
      servicio_campo: 0,
      orador_saliente: 0,
      hospitalidad: 0,
    };

    const daysWithFamily = new Set<string>();
    assignments.forEach((a) => {
      countsByCategory[a.category] = (countsByCategory[a.category] || 0) + 1;
      if (a.familyAssignedSameDay && a.familyAssignedSameDay.length > 0) {
        daysWithFamily.add(a.date);
      }
    });

    bundles.push({
      publisher: pub,
      monthKey,
      assignments,
      countsByCategory,
      familySharedDaysCount: daysWithFamily.size,
    });
  });

  return bundles.sort((a, b) => a.publisher.name.localeCompare(b.publisher.name));
}

/**
 * Formatea UN SOLO MENSAJE DE WHATSAPP UNIFICADO con todas las asignaciones del mes para un hermano.
 */
export function formatUnifiedMonthlyWhatsAppMessage(
  publisher: Publisher,
  monthKey: string,
  assignments: UnifiedAssignmentItem[],
  congregationName?: string
): string {
  const honorific =
    publisher.gender === 'hermana' || (publisher.gender as string) === 'female'
      ? 'hermana'
      : 'hermano';
  const monthLabel = formatSpanishMonthLabel(monthKey);
  const cong = congregationName || 'la congregación';

  const categoryIcon: Record<UnifiedAssignmentCategory, string> = {
    vym: '📖',
    fin_de_semana: '🏛️',
    deberes: '🎧',
    limpieza: '🧹',
    carritos: '🛒',
    servicio_campo: '🧭',
    orador_saliente: '🎙️',
    hospitalidad: '🍽️',
  };

  let msg = `📋 *HOJA UNIFICADA DE ASIGNACIONES — ${monthLabel.toUpperCase()}*\n`;
  msg += `🏛 *Congregación:* ${cong}\n\n`;
  msg += `Apreciado(a) ${honorific} *${publisher.name}*,\n`;
  msg += `Con mucho cariño te compartimos el resumen unificado de todas tus asignaciones y privilegios programados (${assignments.length} en total):\n\n`;

  assignments.forEach((item, idx) => {
    const icon = categoryIcon[item.category] || '📌';
    const shortDate = formatShortSpanishDate(item.date);
    msg += `${idx + 1}. ${icon} *${shortDate}* (${item.time}) — *${item.title}*\n`;
    msg += `   • _${item.categoryLabel}_`;
    if (item.room) {
      msg += ` | ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}`;
    }
    if (item.partnerName) {
      msg += ` | ${item.partnerName}`;
    }
    if (item.lessonNumber) {
      msg += ` | Lección #${item.lessonNumber}`;
    }
    msg += `\n`;
    if (item.subtitle) {
      msg += `   • ${item.subtitle}\n`;
    }
    if (item.familyAssignedSameDay && item.familyAssignedSameDay.length > 0) {
      msg += `   • 👨‍👩‍👧‍👦 _También participa ese día: ${item.familyAssignedSameDay.join(', ')}_\n`;
    }
  });

  // Si alguna parte tiene enlace de confirmación directa, incluimos acceso al portal
  const firstConfirmable = assignments.find(
    (a) => a.weekId && a.meetingType && a.assignmentPath
  );
  if (firstConfirmable && firstConfirmable.weekId && firstConfirmable.meetingType && firstConfirmable.assignmentPath) {
    const url = generateConfirmationUrl(
      firstConfirmable.weekId,
      firstConfirmable.meetingType,
      firstConfirmable.assignmentPath,
      publisher.id
    );
    if (url) {
      msg += `\n📲 *Confirma tus asignaciones o descarga tu calendario (.ics) aquí:*\n${url}\n`;
    }
  }

  msg += `\n¡Muchas gracias por tu valiosa disposición y apoyo a la congregación! 🙏`;
  return msg;
}

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = (dateStr || '2026-01-01').replace(/-/g, '');
  const parts = (timeStr || '19:00').split(':');
  const hh = String(parts[0] || '19').padStart(2, '0');
  const mm = String(parts[1] || '00').padStart(2, '0');
  return `${cleanDate}T${hh}${mm}00`;
}

function addMinutesToIcsDateTime(dateStr: string, timeStr: string, minutes: number): string {
  const [y, m, d] = (dateStr || '2026-01-01').split('-').map(Number);
  const [hh, mm] = (timeStr || '19:00').split(':').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 19, mm || 0);
  dt.setMinutes(dt.getMinutes() + (minutes || 60));

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

/**
 * Descarga un archivo .ics (iCalendar RFC 5545) unificado con TODAS las asignaciones del publicador
 * e incluye doble recordatorio automático (24 horas antes y 2 horas antes).
 */
export function downloadPublisherUnifiedIcs(
  publisher: Publisher,
  monthKey: string,
  assignments: UnifiedAssignmentItem[],
  settings: CongregationSettings
): void {
  if (assignments.length === 0) return;

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const defaultLoc = settings.hallAddress || `Salón del Reino - ${settings.congregationName || 'Congregación'}`;

  const vevents = assignments.map((item) => {
    const dtStart = formatIcsDateTime(item.date, item.time);
    const dtEnd = addMinutesToIcsDateTime(item.date, item.time, item.durationMinutes || 60);

    const descLines = [
      `Asignación: ${item.title}`,
      `Categoría: ${item.categoryLabel}`,
      `Lugar / Reunión: ${item.meetingOrVenue}`,
    ];
    if (item.room) {
      descLines.push(`Sala: ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}`);
    }
    if (item.partnerName) {
      descLines.push(item.partnerName);
    }
    if (item.subtitle) {
      descLines.push(item.subtitle);
    }
    if (item.familyAssignedSameDay && item.familyAssignedSameDay.length > 0) {
      descLines.push(`Familiar asignado el mismo día: ${item.familyAssignedSameDay.join(', ')}`);
    }

    const cleanSummary = `[Kongre] ${item.title} (${item.categoryLabel})`.replace(/[\r\n]+/g, ' ');
    const cleanDesc = descLines.join('\\n').replace(/[\r\n]+/g, ' ');
    const cleanLoc = (item.meetingOrVenue || defaultLoc).replace(/[\r\n]+/g, ' ');

    return [
      'BEGIN:VEVENT',
      `UID:${item.id}@kongre.org`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${cleanSummary}`,
      `DESCRIPTION:${cleanDesc}`,
      `LOCATION:${cleanLoc}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Recordatorio (Mañana): ${cleanSummary}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Recordatorio (En 2 horas): ${cleanSummary}`,
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  const safeName = (publisher.name || 'Publicador').replace(/\s+/g, '_');
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kongre Gestor Teocratico//Mis Asignaciones//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Asignaciones - ${publisher.name}`,
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Mis_Asignaciones_${safeName}_${monthKey === 'all_upcoming' ? 'Proximas' : monthKey}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imprime la "Hoja Personal Unificada de Asignaciones del Mes" (estilo KHS) usando un iframe oculto
 * (compatible con entornos iframe sin depender de window.open bloqueado).
 */
export function printPublisherUnifiedMonthlySheet(
  publisher: Publisher,
  monthKey: string,
  assignments: UnifiedAssignmentItem[],
  settings: CongregationSettings
): void {
  const monthLabel = formatSpanishMonthLabel(monthKey);
  const congName = settings.congregationName || 'Congregación';

  const rowsHtml = assignments
    .map((item) => {
      const details: string[] = [];
      if (item.room) details.push(item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal');
      if (item.partnerName) details.push(item.partnerName);
      if (item.lessonNumber) details.push(`Lección #${item.lessonNumber}`);
      if (item.subtitle) details.push(item.subtitle);
      if (item.familyAssignedSameDay && item.familyAssignedSameDay.length > 0) {
        details.push(`Familiar asignado hoy: ${item.familyAssignedSameDay.join(', ')}`);
      }

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;white-space:nowrap;">
            ${formatShortSpanishDate(item.date)}<br/>
            <span style="font-size:11px;font-weight:500;color:#64748b;">${item.time} hs</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
            <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:#f1f5f9;color:#334155;text-transform:uppercase;">
              ${item.categoryLabel}
            </span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:700;color:#0f172a;font-size:13px;">${item.title}</div>
            ${
              details.length > 0
                ? `<div style="font-size:11px;color:#475569;margin-top:3px;">${details.join(' • ')}</div>`
                : ''
            }
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#334155;">
            ${item.meetingOrVenue}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Hoja de Asignaciones - ${publisher.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #0f172a; }
          .header { border-bottom: 3px solid #4f46e5; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 800; margin: 0; color: #1e1b4b; }
          .subtitle { font-size: 12px; color: #475569; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f8fafc; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.08em;">
              Congregación ${congName} • Hoja Personal KHS
            </div>
            <h1 class="title">Mis Asignaciones del Mes: ${publisher.name}</h1>
            <div class="subtitle">Periodo: ${monthLabel} • Total de privilegios programados: ${assignments.length}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Área / Sección</th>
              <th>Asignación y Detalles</th>
              <th>Reunión / Ubicación</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          Hoja personal unificada generada por Kongre • Incluye Vida y Ministerio, Fin de Semana, Audio/Video, Acomodadores, Limpieza y Predicación Pública.
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 250);
  }
}
