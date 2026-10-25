// src/utils/khsSpeakerExchangeEngine.ts
import {
  WeekSchedule,
  Publisher,
  OutgoingSpeakerAssignment,
  HospitalityHost,
  NeighboringCongregation,
  VisitingSpeakerDirectoryEntry,
  CartShift,
  FieldServiceMeeting,
  CongregationSettings,
  HospitalityMealType,
} from '../types';
import { findOutlineByNumber } from './theocraticData';

export interface SpeakerExchangeConflict {
  id: string;
  severity: 'error' | 'warning';
  module:
    | 'fin_de_semana'
    | 'deberes'
    | 'hospitalidad'
    | 'carritos'
    | 'predicacion'
    | 'ausencia'
    | 'salida_duplicada'
    | 'bosquejo_repetido';
  moduleLabel: string;
  title: string;
  description: string;
  date: string;
}

export interface OutlineRepetitionEvaluation {
  outlineNumber: number;
  outlineTitle: string;
  isRepeatedRecently: boolean;
  monthsSinceLast: number | null;
  lastDeliveredDate: string | null;
  lastSpeakerName: string | null;
  otherScheduledDate: string | null;
}

export interface RankedHospitalitySuggestion {
  host: HospitalityHost;
  publisher: Publisher;
  score: number;
  meetsCapacity: boolean;
  isAvailable: boolean;
  timesHostedCount: number;
  lastHostedDate: string | null;
  reasonBadge: string;
  dietaryWarning?: string;
}

export const MEAL_TYPE_LABELS: Record<HospitalityMealType, string> = {
  almuerzo: 'Almuerzo (Mediodía)',
  cena: 'Cena (Tarde/Noche)',
  desayuno: 'Desayuno',
  refrigerio: 'Refrigerio / Café',
  hospedaje: 'Alojamiento + Comidas',
};

/**
 * Combina las congregaciones vecinas guardadas en settings con cualquier congregación
 * mencionada previamente en semanas o salidas de oradores para no perder ningún dato.
 */
export function getMergedNeighboringCongregations(
  settings: CongregationSettings,
  weeks: WeekSchedule[],
  outgoingSpeakers: OutgoingSpeakerAssignment[]
): NeighboringCongregation[] {
  const saved = Array.isArray(settings.neighboringCongregations)
    ? [...settings.neighboringCongregations]
    : [];

  const byName = new Map<string, NeighboringCongregation>();
  saved.forEach((c) => {
    if (c && c.name) {
      byName.set(c.name.trim().toLowerCase(), c);
    }
  });

  // Extraer congregaciones de semanas con oradores visitantes
  weeks.forEach((w) => {
    const congName = w.weekend.visitingSpeakerCongregation?.trim();
    if (congName && !byName.has(congName.toLowerCase())) {
      const id = `ncong-auto-${congName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const autoCong: NeighboringCongregation = {
        id,
        name: congName,
        weekendMeetingDay: settings.weekendMeetingDay || 'Domingo',
        weekendMeetingTime: settings.weekendMeetingTime || '10:00',
        active: true,
      };
      byName.set(congName.toLowerCase(), autoCong);
      saved.push(autoCong);
    }
  });

  // Extraer congregaciones de oradores salientes
  outgoingSpeakers.forEach((out) => {
    const congName = out.destinationCongregation?.trim();
    if (congName && !byName.has(congName.toLowerCase())) {
      const id = `ncong-auto-${congName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const autoCong: NeighboringCongregation = {
        id,
        name: congName,
        weekendMeetingDay: settings.weekendMeetingDay || 'Domingo',
        weekendMeetingTime: out.destinationMeetingTime || settings.weekendMeetingTime || '10:00',
        address: out.destinationAddress,
        talkCoordinatorName: out.destinationCoordinatorName,
        talkCoordinatorPhone: out.destinationCoordinatorPhone,
        active: true,
      };
      byName.set(congName.toLowerCase(), autoCong);
      saved.push(autoCong);
    }
  });

  return saved.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Combina el directorio de oradores visitantes guardado en settings con los oradores
 * visitantes ya asignados en semanas históricas o futuras.
 */
export function getMergedVisitingSpeakersDirectory(
  settings: CongregationSettings,
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>
): VisitingSpeakerDirectoryEntry[] {
  const saved = Array.isArray(settings.visitingSpeakersDirectory)
    ? [...settings.visitingSpeakersDirectory]
    : [];

  const byName = new Map<string, VisitingSpeakerDirectoryEntry>();
  saved.forEach((s) => {
    if (s && s.name) {
      byName.set(s.name.trim().toLowerCase(), s);
    }
  });

  weeks.forEach((w) => {
    const wk = w.weekend;
    if (!wk.isVisitingSpeaker || !wk.publicTalkSpeaker) return;
    // Ignorar si es el ID de un publicador local
    if (publishersMap.has(wk.publicTalkSpeaker)) return;

    const speakerName = wk.publicTalkSpeaker.trim();
    if (!speakerName) return;

    const key = speakerName.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      if (
        wk.publicTalkOutlineNumber &&
        !existing.preparedOutlines.includes(wk.publicTalkOutlineNumber)
      ) {
        existing.preparedOutlines = [...existing.preparedOutlines, wk.publicTalkOutlineNumber].sort(
          (a, b) => a - b
        );
      }
      if (!existing.lastVisitDate || wk.date > existing.lastVisitDate) {
        existing.lastVisitDate = wk.date;
      }
      if (!existing.phone && wk.visitingSpeakerPhone) {
        existing.phone = wk.visitingSpeakerPhone;
      }
      if (!existing.congregationName && wk.visitingSpeakerCongregation) {
        existing.congregationName = wk.visitingSpeakerCongregation;
      }
    } else {
      const autoEntry: VisitingSpeakerDirectoryEntry = {
        id: wk.visitingSpeakerId || `vs-auto-${key.replace(/[^a-z0-9]/g, '-')}`,
        name: speakerName,
        phone: wk.visitingSpeakerPhone || '',
        privilege: 'anciano',
        congregationName: wk.visitingSpeakerCongregation || 'Congregación Vecina',
        preparedOutlines: wk.publicTalkOutlineNumber ? [wk.publicTalkOutlineNumber] : [],
        companionsDefault: wk.visitingSpeakerCompanions ?? 0,
        dietaryNotes: wk.visitingSpeakerDietaryNotes || '',
        lastVisitDate: wk.date,
        active: true,
      };
      byName.set(key, autoEntry);
      saved.push(autoEntry);
    }
  });

  return saved.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Evalúa si un bosquejo (#1-#194) ya fue presentado recientemente en la congregación
 * o si está programado en otra semana.
 */
export function evaluateOutlineRepetition(
  outlineNumber: number | undefined,
  currentWeekId: string | undefined,
  targetDate: string,
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  warnWithinMonths = 12
): OutlineRepetitionEvaluation | null {
  if (!outlineNumber || outlineNumber < 1 || outlineNumber > 194) return null;
  const outlineObj = findOutlineByNumber(outlineNumber);
  const outlineTitle = outlineObj?.title || `Bosquejo #${outlineNumber}`;

  let lastDeliveredDate: string | null = null;
  let lastSpeakerName: string | null = null;
  let otherScheduledDate: string | null = null;

  weeks.forEach((w) => {
    if (currentWeekId && w.id === currentWeekId) return;
    if (w.weekend.publicTalkOutlineNumber !== outlineNumber) return;

    const wDate = w.weekend.date || w.weekEndDate;
    let spk = w.weekend.publicTalkSpeaker || 'Orador';
    if (!w.weekend.isVisitingSpeaker && spk && publishersMap.has(spk)) {
      spk = publishersMap.get(spk)!.name;
    }

    if (wDate <= targetDate) {
      if (!lastDeliveredDate || wDate > lastDeliveredDate) {
        lastDeliveredDate = wDate;
        lastSpeakerName = spk;
      }
    } else {
      if (!otherScheduledDate || wDate < otherScheduledDate) {
        otherScheduledDate = wDate;
      }
    }
  });

  let monthsSinceLast: number | null = null;
  let isRepeatedRecently = false;

  if (lastDeliveredDate && targetDate) {
    const d1 = new Date(`${lastDeliveredDate}T00:00:00`);
    const d2 = new Date(`${targetDate}T00:00:00`);
    const diffDays = Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    monthsSinceLast = Math.round((diffDays / 30.44) * 10) / 10;
    if (monthsSinceLast <= warnWithinMonths) {
      isRepeatedRecently = true;
    }
  }

  if (otherScheduledDate) {
    isRepeatedRecently = true;
  }

  return {
    outlineNumber,
    outlineTitle,
    isRepeatedRecently,
    monthsSinceLast,
    lastDeliveredDate,
    lastSpeakerName,
    otherScheduledDate,
  };
}

/**
 * Detecta todos los choques en tiempo real para un hermano local que sale a dar un discurso
 * en otra congregación en una fecha determinada (Fin de Semana, Deberes, Hospitalidad, Carritos, Predicación, Ausencias).
 */
export function detectOutgoingSpeakerConflicts(
  publisherId: string,
  dateISO: string,
  weeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  outgoingSpeakers: OutgoingSpeakerAssignment[],
  cartShifts: CartShift[] = [],
  fieldServiceMeetings: FieldServiceMeeting[] = [],
  ignoreOutgoingId?: string
): SpeakerExchangeConflict[] {
  const conflicts: SpeakerExchangeConflict[] = [];
  if (!publisherId || !dateISO) return conflicts;

  const pub = publishersMap.get(publisherId);
  const pubName = pub?.name || 'El hermano';

  // 1. Verificar ausencias registradas del publicador
  if (pub?.absences && pub.absences.length > 0) {
    pub.absences.forEach((abs) => {
      if (dateISO >= abs.startDate && dateISO <= abs.endDate) {
        conflicts.push({
          id: `abs-${abs.id}`,
          severity: 'error',
          module: 'ausencia',
          moduleLabel: 'Ausencia Registrada',
          title: 'Ausencia / Vacaciones programadas',
          description: `${pubName} tiene una ausencia registrada del ${abs.startDate} al ${abs.endDate}${abs.reason ? ` (${abs.reason})` : ''}.`,
          date: dateISO,
        });
      }
    });
  }

  // 2. Verificar otra salida el mismo fin de semana
  outgoingSpeakers.forEach((other) => {
    if (ignoreOutgoingId && other.id === ignoreOutgoingId) return;
    if (other.publisherId !== publisherId) return;
    // Misma fecha o dentro de 2 días (mismo fin de semana)
    const d1 = new Date(`${dateISO}T00:00:00`).getTime();
    const d2 = new Date(`${other.date}T00:00:00`).getTime();
    const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      conflicts.push({
        id: `dup-out-${other.id}`,
        severity: 'error',
        module: 'salida_duplicada',
        moduleLabel: 'Doble Salida',
        title: `Ya tiene salida a ${other.destinationCongregation}`,
        description: `${pubName} ya está registrado para salir a "${other.destinationCongregation}" el ${other.date} (Bosquejo #${other.outlineNumber}).`,
        date: other.date,
      });
    }
  });

  // 3. Buscar la semana que corresponde a dateISO
  const matchingWeek = weeks.find(
    (w) =>
      (dateISO >= w.weekStartDate && dateISO <= w.weekEndDate) ||
      w.weekend.date === dateISO
  );

  if (matchingWeek) {
    const wk = matchingWeek.weekend;
    const wkDate = wk.date || dateISO;

    if (wk.presidentId === publisherId) {
      conflicts.push({
        id: `wk-pres-${matchingWeek.id}`,
        severity: 'error',
        module: 'fin_de_semana',
        moduleLabel: 'Reunión Fin de Semana',
        title: 'Presidente de la Reunión Local',
        description: `${pubName} está asignado como Presidente de la reunión de fin de semana local (${wkDate}).`,
        date: wkDate,
      });
    }

    if (!wk.isVisitingSpeaker && wk.publicTalkSpeaker === publisherId) {
      conflicts.push({
        id: `wk-spk-${matchingWeek.id}`,
        severity: 'error',
        module: 'fin_de_semana',
        moduleLabel: 'Discurso Público Local',
        title: 'Orador de Discurso Público Local',
        description: `${pubName} está asignado para presentar el discurso público local ese mismo fin de semana (${wkDate}).`,
        date: wkDate,
      });
    }

    if (wk.atalayaConductorId === publisherId) {
      conflicts.push({
        id: `wk-wtcond-${matchingWeek.id}`,
        severity: 'error',
        module: 'fin_de_semana',
        moduleLabel: 'Estudio de La Atalaya',
        title: 'Conductor de La Atalaya',
        description: `${pubName} es el Conductor del Estudio de La Atalaya ese fin de semana (${wkDate}).`,
        date: wkDate,
      });
    }

    if (wk.atalayaLectorId === publisherId) {
      conflicts.push({
        id: `wk-wtread-${matchingWeek.id}`,
        severity: 'error',
        module: 'fin_de_semana',
        moduleLabel: 'Estudio de La Atalaya',
        title: 'Lector de La Atalaya',
        description: `${pubName} está asignado como Lector de La Atalaya ese fin de semana (${wkDate}).`,
        date: wkDate,
      });
    }

    if (wk.initialPrayerId === publisherId || wk.finalPrayerId === publisherId) {
      conflicts.push({
        id: `wk-pray-${matchingWeek.id}`,
        severity: 'warning',
        module: 'fin_de_semana',
        moduleLabel: 'Oración Fin de Semana',
        title: 'Oración en Reunión Local',
        description: `${pubName} tiene asignada una oración en la reunión de fin de semana local (${wkDate}).`,
        date: wkDate,
      });
    }

    if (wk.hospitalityPublisherId === publisherId) {
      conflicts.push({
        id: `wk-hosp-${matchingWeek.id}`,
        severity: 'error',
        module: 'hospitalidad',
        moduleLabel: 'Hospitalidad',
        title: 'Anfitrión de Hospitalidad Local',
        description: `${pubName} está asignado para atender la comida/hospitalidad del orador visitante local ese fin de semana.`,
        date: wkDate,
      });
    }

    // Deberes de fin de semana (Audio, Micrófonos, Acomodador, etc.)
    const dutyNames: Record<string, string> = {
      deber_audio: 'Audio y Video',
      deber_video: 'Video',
      deber_microfonos: 'Micrófonos',
      deber_plataforma: 'Plataforma',
      deber_acomodador: 'Acomodador',
      deber_seguridad: 'Seguridad / Estacionamiento',
      deber_zoom: 'Anfitrión Zoom',
    };

    Object.entries(wk.duties || {}).forEach(([dutyKey, ids]) => {
      if (Array.isArray(ids) && ids.includes(publisherId)) {
        const label = dutyNames[dutyKey] || dutyKey.replace('deber_', '').toUpperCase();
        conflicts.push({
          id: `wk-duty-${matchingWeek.id}-${dutyKey}`,
          severity: 'error',
          module: 'deberes',
          moduleLabel: 'Deberes y Acomodadores',
          title: `Deber Local: ${label}`,
          description: `${pubName} tiene asignado el deber de ${label} en la reunión de fin de semana local (${wkDate}).`,
          date: wkDate,
        });
      }
    });
  }

  // 4. Verificar turnos de carritos en esa fecha
  cartShifts.forEach((shift) => {
    if (
      shift.date === dateISO &&
      (shift.publisher1Id === publisherId || shift.publisher2Id === publisherId)
    ) {
      conflicts.push({
        id: `cart-${shift.id}`,
        severity: 'warning',
        module: 'carritos',
        moduleLabel: 'Predicación Pública (Carritos)',
        title: `Turno de Carrito (${shift.startTime} - ${shift.endTime})`,
        description: `${pubName} tiene un turno de predicación con carritos el ${dateISO} de ${shift.startTime} a ${shift.endTime}.`,
        date: dateISO,
      });
    }
  });

  // 5. Verificar conducción de salida al campo en esa fecha
  fieldServiceMeetings.forEach((fsm) => {
    if (fsm.date === dateISO && fsm.conductorId === publisherId) {
      conflicts.push({
        id: `fsm-${fsm.id}`,
        severity: 'warning',
        module: 'predicacion',
        moduleLabel: 'Salida al Ministerio',
        title: `Conductor de Salida al Campo (${fsm.time})`,
        description: `${pubName} está programado para conducir la salida al servicio del campo el ${dateISO} a las ${fsm.time} (${fsm.location}).`,
        date: dateISO,
      });
    }
  });

  return conflicts;
}

/**
 * Sugiere y clasifica a las mejores familias anfitrionas de hospitalidad para una semana
 * usando criterios KHS: disponibilidad, capacidad (orador + acompañantes), y rotación equitativa.
 */
export function suggestBestHospitalityHosts(
  week: WeekSchedule,
  allWeeks: WeekSchedule[],
  hospitalityHosts: HospitalityHost[],
  publishersMap: Map<string, Publisher>,
  requiredGuests = 1,
  speakerDietaryNotes?: string
): RankedHospitalitySuggestion[] {
  const wkDate = week.weekend.date || week.weekEndDate;

  // Contar cuántas veces ha hospedado cada familia y su última fecha
  const hostStats = new Map<string, { count: number; lastDate: string | null }>();
  allWeeks.forEach((w) => {
    if (w.id === week.id) return;
    const hPubId = w.weekend.hospitalityPublisherId;
    if (!hPubId) return;
    const cur = hostStats.get(hPubId) || { count: 0, lastDate: null };
    cur.count += 1;
    const d = w.weekend.date || w.weekEndDate;
    if (!cur.lastDate || d > cur.lastDate) {
      cur.lastDate = d;
    }
    hostStats.set(hPubId, cur);
  });

  const suggestions: RankedHospitalitySuggestion[] = [];

  hospitalityHosts.forEach((host) => {
    const pub = publishersMap.get(host.publisherId);
    if (!pub || !pub.active) return;

    // Verificar si el anfitrión tiene ausencia registrada esa semana
    const isAbsent = (pub.absences || []).some(
      (abs) => wkDate >= abs.startDate && wkDate <= abs.endDate
    );

    const isAvailable = host.active && !isAbsent;
    const meetsCapacity = (host.capacity || 1) >= requiredGuests;
    const st = hostStats.get(host.publisherId) || { count: 0, lastDate: null };

    // Calcular puntaje (mayor es mejor)
    let score = 100;
    if (!isAvailable) score -= 80;
    if (!meetsCapacity) score -= 40;
    score -= st.count * 12;

    if (st.lastDate && wkDate) {
      const daysSince =
        (new Date(`${wkDate}T00:00:00`).getTime() -
          new Date(`${st.lastDate}T00:00:00`).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSince >= 0 && daysSince < 35) {
        score -= 30; // Hospedó hace menos de un mes
      }
    }

    let reasonBadge = 'Rotación ideal';
    if (!host.active) {
      reasonBadge = 'En pausa';
    } else if (isAbsent) {
      reasonBadge = 'Ausente esa fecha';
    } else if (!meetsCapacity) {
      reasonBadge = `Capacidad máx: ${host.capacity} pers.`;
    } else if (st.count === 0) {
      reasonBadge = '⭐ Sin turnos recientes (Prioridad #1)';
    } else if (st.lastDate) {
      reasonBadge = `Última vez: ${st.lastDate} (${st.count}x)`;
    }

    let dietaryWarning: string | undefined;
    if (speakerDietaryNotes?.trim() && host.dietaryNotes?.trim()) {
      dietaryWarning = `Orador: "${speakerDietaryNotes.trim()}" • Anfitrión: "${host.dietaryNotes.trim()}"`;
    } else if (speakerDietaryNotes?.trim()) {
      dietaryWarning = `Nota del orador: "${speakerDietaryNotes.trim()}"`;
    }

    suggestions.push({
      host,
      publisher: pub,
      score,
      meetsCapacity,
      isAvailable,
      timesHostedCount: st.count,
      lastHostedDate: st.lastDate,
      reasonBadge,
      dietaryWarning,
    });
  });

  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Genera el mensaje de WhatsApp estilo KHS para confirmar e invitar al Orador Visitante.
 */
export function buildWhatsAppVisitingSpeakerInvite(
  week: WeekSchedule,
  settings: CongregationSettings,
  publishersMap: Map<string, Publisher>,
  hospitalityHosts: HospitalityHost[]
): { phoneClean: string; message: string } {
  const w = week.weekend;
  const speakerName = w.publicTalkSpeaker || 'Estimado hermano';
  const outlineNum = w.publicTalkOutlineNumber;
  const theme =
    w.publicTalkTheme ||
    (outlineNum ? findOutlineByNumber(outlineNum)?.title : 'Discurso Público');
  const chairman = w.presidentId ? publishersMap.get(w.presidentId) : null;
  const hospitalityPub = w.hospitalityPublisherId
    ? publishersMap.get(w.hospitalityPublisherId)
    : null;
  const hostRecord = hospitalityHosts.find((h) => h.publisherId === w.hospitalityPublisherId);

  const mealLabel = w.hospitalityMealType
    ? MEAL_TYPE_LABELS[w.hospitalityMealType]
    : 'Hospitalidad y comida';

  let text = `*CONFIRMACIÓN DE DISCURSO PÚBLICO (S-99)*\n`;
  text += `Estimado hno. *${speakerName}*, ¡reciba nuestros afectuosos saludos cristianos!\n\n`;
  text += `Le escribimos de la *${settings.congregationName || 'Congregación'}* para confirmar con mucho gusto su visita como orador invitado:\n\n`;
  text += `📅 *Fecha:* ${w.date} (${settings.weekendMeetingDay || 'Fin de semana'})\n`;
  text += `⏰ *Hora de la reunión:* ${settings.weekendMeetingTime || '10:00'}\n`;
  if (settings.hallAddress) {
    text += `📍 *Dirección del Salón del Reino:* ${settings.hallAddress}\n`;
  }
  text += `\n📖 *Bosquejo asignado:* ${outlineNum ? `#${outlineNum} — ` : ''}"${theme}"\n`;
  if (w.openingSong) {
    text += `🎵 *Cántico de apertura sugerido:* #${w.openingSong}\n`;
  }
  if (chairman) {
    text += `👤 *Presidente de la reunión:* Hno. ${chairman.name}${chairman.phone ? ` (${chairman.phone})` : ''}\n`;
  }

  if (hospitalityPub) {
    const hostPhone = hostRecord?.contactPhone || hospitalityPub.phone || '';
    const hostAddr = w.hospitalityLocation || hostRecord?.alternateAddress || hospitalityPub.address || '';
    text += `\n🍽️ *Arreglo de Hospitalidad (${mealLabel}):*\n`;
    text += `• *Familia anfitriona:* ${hospitalityPub.name}${hostPhone ? ` (Tel: ${hostPhone})` : ''}\n`;
    if (hostAddr) {
      text += `• *Ubicación:* ${hostAddr}\n`;
    }
    if (w.visitingSpeakerCompanions && w.visitingSpeakerCompanions > 0) {
      text += `• *Invitados contemplados:* Usted + ${w.visitingSpeakerCompanions} acompañante(s)\n`;
    }
  }

  text += `\nPor favor confírmenos si todos los datos son correctos y el número de su cántico inicial si desea ajustarlo. ¡Esperamos con anhelo su edificante visita!`;

  const phoneClean = w.visitingSpeakerPhone
    ? w.visitingSpeakerPhone.replace(/[^0-9]/g, '')
    : '';

  return { phoneClean, message: text };
}

/**
 * Genera el recordatorio de WhatsApp en 1 Clic para la Familia Anfitriona de Hospitalidad.
 */
export function buildWhatsAppHostFamilyReminder(
  week: WeekSchedule,
  settings: CongregationSettings,
  publishersMap: Map<string, Publisher>,
  hospitalityHosts: HospitalityHost[]
): { phoneClean: string; message: string } | null {
  const w = week.weekend;
  if (!w.hospitalityPublisherId) return null;
  const hospitalityPub = publishersMap.get(w.hospitalityPublisherId);
  if (!hospitalityPub) return null;
  const hostRecord = hospitalityHosts.find((h) => h.publisherId === w.hospitalityPublisherId);

  const speakerName = w.publicTalkSpeaker || 'Orador visitante';
  const cong = w.visitingSpeakerCongregation
    ? ` (${w.visitingSpeakerCongregation})`
    : '';
  const speakerPhone = w.visitingSpeakerPhone ? `\n📞 *Contacto del orador:* ${w.visitingSpeakerPhone}` : '';
  const companions = w.visitingSpeakerCompanions || 0;
  const totalGuests = 1 + companions;
  const mealLabel = w.hospitalityMealType
    ? MEAL_TYPE_LABELS[w.hospitalityMealType]
    : 'Almuerzo / Comida';

  let text = `*🍽️ RECORDATORIO DE HOSPITALIDAD TEOCRÁTICA*\n`;
  text += `Querida familia *${hospitalityPub.name}*, ¡saludos cristianos!\n\n`;
  text += `Les agradecemos de corazón su amorosa disposición para atender a nuestro orador visitante este fin de semana:\n\n`;
  text += `📅 *Fecha:* ${w.date} (${settings.weekendMeetingDay} ${settings.weekendMeetingTime})\n`;
  text += `👤 *Orador visitante:* Hno. ${speakerName}${cong}${speakerPhone}\n`;
  text += `👥 *Comensales invitados:* ${totalGuests} ${totalGuests === 1 ? 'persona (solo el orador)' : `personas (orador + ${companions} acompañante/esposa)`}\n`;
  text += `🍲 *Modalidad:* ${mealLabel}\n`;
  if (w.visitingSpeakerDietaryNotes?.trim()) {
    text += `⚠️ *Notas de dieta / alergias del orador:* ${w.visitingSpeakerDietaryNotes.trim()}\n`;
  }
  if (w.hospitalityNotes?.trim()) {
    text += `📝 *Notas adicionales:* ${w.hospitalityNotes.trim()}\n`;
  }
  text += `\n¡Que Jehová bendiga ricamente su hospitalidad cristiana! (Hebreos 13:2).`;

  const phoneRaw = hostRecord?.contactPhone || hospitalityPub.phone || '';
  const phoneClean = phoneRaw.replace(/[^0-9]/g, '');
  return { phoneClean, message: text };
}

/**
 * Genera el mensaje de WhatsApp para el Coordinador de Discursos Públicos de una Congregación Vecina.
 */
export function buildWhatsAppCoordinatorExchangeMessage(
  neighboringCong: NeighboringCongregation,
  settings: CongregationSettings,
  week?: WeekSchedule
): { phoneClean: string; message: string } {
  const coordName = neighboringCong.talkCoordinatorName || 'Coordinador de Discursos Públicos';
  let text = `Estimado hno. *${coordName}* (${neighboringCong.name}), ¡saludos cristianos!\n\n`;
  text += `Le escribo de parte de la *${settings.congregationName || 'Congregación'}*${settings.coordinatorName ? ` (${settings.coordinatorName})` : ''} para coordinar el intercambio de oradores públicos.\n`;

  if (week) {
    const w = week.weekend;
    const outlineNum = w.publicTalkOutlineNumber;
    const theme =
      w.publicTalkTheme ||
      (outlineNum ? findOutlineByNumber(outlineNum)?.title : 'Discurso Público');
    text += `\n📅 *Fecha consultada:* ${w.date} (${settings.weekendMeetingDay} ${settings.weekendMeetingTime})\n`;
    if (w.publicTalkSpeaker) {
      text += `👤 *Orador:* Hno. ${w.publicTalkSpeaker}\n`;
    }
    if (outlineNum) {
      text += `📖 *Bosquejo:* #${outlineNum} "${theme}"\n`;
    }
    if (settings.hallAddress) {
      text += `📍 *Nuestro Salón del Reino:* ${settings.hallAddress}\n`;
    }
  } else {
    text += `\nNos gustaría confirmar la disponibilidad de sus oradores para nuestras próximas fechas del trimestre. Nuestro horario de reunión de fin de semana es los *${settings.weekendMeetingDay} a las ${settings.weekendMeetingTime}*.\n`;
  }

  text += `\n¡Muchas gracias por su valiosa colaboración teocrática!`;

  const phoneClean = neighboringCong.talkCoordinatorPhone
    ? neighboringCong.talkCoordinatorPhone.replace(/[^0-9]/g, '')
    : '';

  return { phoneClean, message: text };
}

/**
 * Genera la ficha de asignación WhatsApp para un Orador Local que sale a otra congregación.
 */
export function buildWhatsAppOutgoingSpeakerSlip(
  outgoing: OutgoingSpeakerAssignment,
  speaker: Publisher | undefined,
  neighboringCong: NeighboringCongregation | undefined,
  settings: CongregationSettings
): { phoneClean: string; message: string } {
  const speakerName = speaker?.name || 'Estimado hermano';
  const meetingTime =
    outgoing.destinationMeetingTime ||
    neighboringCong?.weekendMeetingTime ||
    'Por confirmar';
  const address =
    outgoing.destinationAddress ||
    neighboringCong?.address ||
    'Consultar ubicación con el coordinador destino';
  const coordName =
    outgoing.destinationCoordinatorName ||
    neighboringCong?.talkCoordinatorName ||
    '';
  const coordPhone =
    outgoing.destinationCoordinatorPhone ||
    neighboringCong?.talkCoordinatorPhone ||
    '';

  let text = `*📤 RECORDATORIO DE SALIDA DE DISCURSO PÚBLICO*\n`;
  text += `Querido hno. *${speakerName}*, ¡saludos cristianos!\n\n`;
  text += `Le recordamos su asignación para presentar el discurso público en una congregación vecina:\n\n`;
  text += `📅 *Fecha:* ${outgoing.date}\n`;
  text += `🏛️ *Congregación destino:* ${outgoing.destinationCongregation}\n`;
  text += `⏰ *Hora de reunión:* ${meetingTime}\n`;
  text += `📍 *Dirección:* ${address}\n`;
  text += `📖 *Bosquejo #${outgoing.outlineNumber}:* "${outgoing.outlineTitle}"\n`;
  if (coordName || coordPhone) {
    text += `👤 *Contacto en destino:* ${coordName}${coordPhone ? ` (${coordPhone})` : ''}\n`;
  }
  if (outgoing.notes) {
    text += `📝 *Notas:* ${outgoing.notes}\n`;
  }
  text += `\n*(El sistema de ${settings.congregationName || 'nuestra congregación'} ha protegido automáticamente esta fecha para que no tenga asignaciones locales en conflicto).*`;

  const phoneClean = speaker?.phone ? speaker.phone.replace(/[^0-9]/g, '') : '';
  return { phoneClean, message: text };
}
