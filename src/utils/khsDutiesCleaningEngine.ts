// src/utils/khsDutiesCleaningEngine.ts
import {
  WeekSchedule,
  Publisher,
  CustomDuty,
  OutgoingSpeakerAssignment,
  PreachingGroup,
  CongregationSettings,
  CleaningProgramType,
  CleaningSuppliesStatus,
} from '../types';
import { getEligibleCandidates } from './autoAssigner';
import { getAssignedFamilyMembersInMeeting, getPubDisplayName } from './familyGrouping';

export interface CleaningChecklistArea {
  id: string;
  label: string;
  detail: string;
  scope: 'semanal' | 'profunda';
}

export const KHS_CLEANING_CHECKLIST_ITEMS: CleaningChecklistArea[] = [
  {
    id: 'auditorio_sillas',
    label: 'Auditorio principal y sillas',
    detail: 'Aspirar o barrer/trapear pisos, alinear sillas y limpiar respaldos.',
    scope: 'semanal',
  },
  {
    id: 'plataforma_atriles',
    label: 'Plataforma, atriles y micrófonos',
    detail: 'Desinfectar atriles, micrófonos y ordenar cables de audio/video.',
    scope: 'semanal',
  },
  {
    id: 'banos_suministros',
    label: 'Sanitarios, lavamanos e insumos',
    detail: 'Limpiar y desinfectar inodoros, espejos, reponer jabón y papel.',
    scope: 'semanal',
  },
  {
    id: 'entradas_cristales',
    label: 'Puertas de entrada, cristales y vestíbulo',
    detail: 'Limpiar huellas en vidrios de acceso, felpudos y mostrador de literatura.',
    scope: 'semanal',
  },
  {
    id: 'sala_auxiliar',
    label: 'Sala auxiliar, biblioteca y papeleras',
    detail: 'Vaciar todas las papeleras, colocar bolsas nuevas y ordenar mesas.',
    scope: 'semanal',
  },
  {
    id: 'exteriores_acera',
    label: 'Exteriores, estacionamiento y jardines',
    detail: 'Barrer entrada exterior, recoger hojas o papeles en jardines y parqueo.',
    scope: 'semanal',
  },
  {
    id: 'profunda_ventanas_persianas',
    label: 'Lavado profundo de ventanas, persianas y paredes',
    detail: 'Desempolvar marcos altos, rejillas de ventilación/aire y zócalos.',
    scope: 'profunda',
  },
  {
    id: 'profunda_tapiceria_lamparas',
    label: 'Tapicería de sillas, luminarias y bodega de aseo',
    detail: 'Limpieza de manchas en tapicería, lámparas y organización del cuarto de aseo.',
    scope: 'profunda',
  },
];

export const CLEANING_TYPE_LABELS: Record<CleaningProgramType, string> = {
  semanal: 'Aseo Semanal Regular',
  profunda: 'Limpieza Profunda (S-28)',
  visita_sc: 'Especial: Visita del Sup. de Circuito',
  evento_especial: 'Pre-Asamblea / Conmemoración',
};

export const CLEANING_SUPPLIES_LABELS: Record<CleaningSuppliesStatus, { label: string; badgeClass: string }> = {
  abastecido: {
    label: 'Insumos Completos',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  },
  reponer_pronto: {
    label: 'Reponer Pronto',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  },
  urgente: {
    label: 'Urgente Comprar Insumos',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  },
};

export interface DutyLiveStatus {
  publisherId: string;
  publisherName: string;
  meetingType: 'midweek' | 'weekend';
  dutyKey: string;
  dutyName: string;
  hasConflict: boolean;
  severity: 'ok' | 'warning' | 'error';
  platformClashes: string[];
  otherDutyClashes: string[];
  outgoingSpeakerClash?: string;
  absenceClash?: string;
  familyMembersInMeeting: string[];
}

/**
 * Returns all platform (non-duty) assignments a publisher has in a specific meeting
 */
export function getPublisherPlatformPartsInMeeting(
  week: WeekSchedule,
  meetingType: 'midweek' | 'weekend',
  publisherId: string
): string[] {
  const parts: string[] = [];
  if (!publisherId) return parts;

  if (meetingType === 'midweek') {
    const m = week.midweek;
    if (m.presidentId === publisherId) parts.push('Presidente VMC');
    if (m.auxiliaryCounselorId === publisherId) parts.push('Consejero Sala Auxiliar');
    if (m.initialPrayerId === publisherId) parts.push('Oración Inicial');
    if (m.finalPrayerId === publisherId) parts.push('Oración Final');
    if (m.tesoros?.discurso?.publisherId === publisherId) parts.push('Tesoros (Discurso)');
    if (m.tesoros?.perlas?.publisherId === publisherId) parts.push('Perlas Escondidas');
    if (m.tesoros?.lecturaBiblia?.publisherId === publisherId) parts.push('Lectura de la Biblia');
    if (m.tesoros?.lecturaBibliaAux?.publisherId === publisherId) parts.push('Lectura Biblia (Aux.)');

    (m.maestros?.items || []).forEach((item, idx) => {
      if (item.publisherId === publisherId) parts.push(`Demostración #${idx + 1} (Titular)`);
      if (item.assistantId === publisherId) parts.push(`Demostración #${idx + 1} (Ayudante)`);
    });

    (m.vidaCristiana?.items || []).forEach((item) => {
      if (item.publisherId === publisherId) parts.push(`Vida Cristiana: ${item.title}`);
    });

    if (m.vidaCristiana?.estudioBiblico?.conductorId === publisherId) {
      parts.push('Conductor EBC');
    }
    if (m.vidaCristiana?.estudioBiblico?.lectorId === publisherId) {
      parts.push('Lector EBC');
    }
  } else {
    const w = week.weekend;
    if (w.presidentId === publisherId) parts.push('Presidente Fin de Semana');
    if (w.initialPrayerId === publisherId) parts.push('Oración Inicial');
    if (w.finalPrayerId === publisherId) parts.push('Oración Final');
    if (!w.isVisitingSpeaker && w.publicTalkSpeaker === publisherId) {
      parts.push(`Orador Discurso Público (#${w.publicTalkOutlineNumber || '?'})`);
    }
    if (w.atalayaConductorId === publisherId) parts.push('Conductor de La Atalaya');
    if (w.atalayaLectorId === publisherId) parts.push('Lector de La Atalaya');
    if (w.hospitalityPublisherId === publisherId) parts.push('Anfitrión Hospitalidad');
  }

  return parts;
}

/**
 * Returns allpublisher IDs assigned to anything (platform + duties) in a specific meeting
 */
export function getAllAssignedIdsInMeeting(
  week: WeekSchedule,
  meetingType: 'midweek' | 'weekend',
  excludeDutyEntry?: { dutyKey: string; publisherId: string }
): Set<string> {
  const set = new Set<string>();

  if (meetingType === 'midweek') {
    const m = week.midweek;
    if (m.presidentId) set.add(m.presidentId);
    if (m.auxiliaryCounselorId) set.add(m.auxiliaryCounselorId);
    if (m.initialPrayerId) set.add(m.initialPrayerId);
    if (m.finalPrayerId) set.add(m.finalPrayerId);
    if (m.tesoros?.discurso?.publisherId) set.add(m.tesoros.discurso.publisherId);
    if (m.tesoros?.perlas?.publisherId) set.add(m.tesoros.perlas.publisherId);
    if (m.tesoros?.lecturaBiblia?.publisherId) set.add(m.tesoros.lecturaBiblia.publisherId);
    if (m.tesoros?.lecturaBibliaAux?.publisherId) set.add(m.tesoros.lecturaBibliaAux.publisherId);
    (m.maestros?.items || []).forEach((it) => {
      if (it.publisherId) set.add(it.publisherId);
      if (it.assistantId) set.add(it.assistantId);
    });
    (m.vidaCristiana?.items || []).forEach((it) => {
      if (it.publisherId) set.add(it.publisherId);
    });
    if (m.vidaCristiana?.estudioBiblico?.conductorId) set.add(m.vidaCristiana.estudioBiblico.conductorId);
    if (m.vidaCristiana?.estudioBiblico?.lectorId) set.add(m.vidaCristiana.estudioBiblico.lectorId);

    Object.entries(m.duties || {}).forEach(([dKey, ids]) => {
      (ids || []).forEach((id) => {
        if (excludeDutyEntry && excludeDutyEntry.dutyKey === dKey && excludeDutyEntry.publisherId === id) {
          return;
        }
        if (id) set.add(id);
      });
    });
  } else {
    const w = week.weekend;
    if (w.presidentId) set.add(w.presidentId);
    if (w.initialPrayerId) set.add(w.initialPrayerId);
    if (w.finalPrayerId) set.add(w.finalPrayerId);
    if (!w.isVisitingSpeaker && w.publicTalkSpeaker) set.add(w.publicTalkSpeaker);
    if (w.atalayaConductorId) set.add(w.atalayaConductorId);
    if (w.atalayaLectorId) set.add(w.atalayaLectorId);

    Object.entries(w.duties || {}).forEach(([dKey, ids]) => {
      (ids || []).forEach((id) => {
        if (excludeDutyEntry && excludeDutyEntry.dutyKey === dKey && excludeDutyEntry.publisherId === id) {
          return;
        }
        if (id) set.add(id);
      });
    });
  }

  return set;
}

/**
 * Evaluates live conflicts and KHS family grouping for a single duty assignment
 */
export function evaluateDutyAssignmentStatus(
  week: WeekSchedule,
  meetingType: 'midweek' | 'weekend',
  dutyKey: string,
  dutyName: string,
  publisherId: string,
  publishers: Publisher[],
  publishersMap: Map<string, Publisher>,
  customDuties: CustomDuty[],
  outgoingSpeakers: OutgoingSpeakerAssignment[] = []
): DutyLiveStatus {
  const pub = publishersMap.get(publisherId);
  const publisherName = pub?.name || 'Hno.';
  const meetingDate =
    meetingType === 'midweek'
      ? week.midweek?.date || week.weekStartDate
      : week.weekend?.date || week.weekEndDate;

  const platformClashes = getPublisherPlatformPartsInMeeting(week, meetingType, publisherId);

  const dutiesMap = (meetingType === 'midweek' ? week.midweek?.duties : week.weekend?.duties) || {};
  const otherDutyClashes: string[] = [];
  Object.entries(dutiesMap).forEach(([k, ids]) => {
    if (k !== dutyKey && (ids || []).includes(publisherId)) {
      const foundDuty = customDuties.find((d) => d.key === k);
      otherDutyClashes.push(foundDuty?.name || k.replace('deber_', '').toUpperCase());
    }
  });

  let outgoingSpeakerClash: string | undefined;
  if (meetingType === 'weekend' && outgoingSpeakers.length > 0) {
    const matchOut = outgoingSpeakers.find(
      (o) =>
        o.publisherId === publisherId &&
        o.date >= week.weekStartDate &&
        o.date <= week.weekEndDate
    );
    if (matchOut) {
      outgoingSpeakerClash = `Sale a discursar a ${matchOut.destinationCongregation} (Bosquejo #${matchOut.outlineNumber})`;
    }
  }

  let absenceClash: string | undefined;
  if (pub?.absences && pub.absences.length > 0) {
    const activeAbs = pub.absences.find(
      (a) => a.startDate <= meetingDate && a.endDate >= meetingDate
    );
    if (activeAbs) {
      absenceClash = `Ausencia registrada (${activeAbs.startDate} al ${activeAbs.endDate}${activeAbs.reason ? `: ${activeAbs.reason}` : ''})`;
    }
  }

  // Check family members in the same meeting
  const otherAssignedIds = getAllAssignedIdsInMeeting(week, meetingType, {
    dutyKey,
    publisherId,
  });
  const familyMembers = pub
    ? getAssignedFamilyMembersInMeeting(pub, otherAssignedIds, publishers).map((f) =>
        getPubDisplayName(f)
      )
    : [];

  const hasError =
    Boolean(absenceClash) ||
    Boolean(outgoingSpeakerClash) ||
    platformClashes.length > 0 ||
    otherDutyClashes.length > 0;

  return {
    publisherId,
    publisherName,
    meetingType,
    dutyKey,
    dutyName,
    hasConflict: hasError,
    severity: hasError ? 'error' : 'ok',
    platformClashes,
    otherDutyClashes,
    outgoingSpeakerClash,
    absenceClash,
    familyMembersInMeeting: familyMembers,
  };
}

/**
 * Evaluates all duty assignments in a week and returns an array of active conflicts
 */
export function getWeekDutyConflicts(
  week: WeekSchedule,
  publishers: Publisher[],
  publishersMap: Map<string, Publisher>,
  customDuties: CustomDuty[],
  outgoingSpeakers: OutgoingSpeakerAssignment[] = []
): DutyLiveStatus[] {
  const results: DutyLiveStatus[] = [];

  customDuties
    .filter((d) => d.midweek)
    .forEach((duty) => {
      const ids = week.midweek?.duties?.[duty.key] || [];
      ids.forEach((pid) => {
        const status = evaluateDutyAssignmentStatus(
          week,
          'midweek',
          duty.key,
          duty.name,
          pid,
          publishers,
          publishersMap,
          customDuties,
          outgoingSpeakers
        );
        if (status.hasConflict) {
          results.push(status);
        }
      });
    });

  customDuties
    .filter((d) => d.weekend)
    .forEach((duty) => {
      const ids = week.weekend?.duties?.[duty.key] || [];
      ids.forEach((pid) => {
        const status = evaluateDutyAssignmentStatus(
          week,
          'weekend',
          duty.key,
          duty.name,
          pid,
          publishers,
          publishersMap,
          customDuties,
          outgoingSpeakers
        );
        if (status.hasConflict) {
          results.push(status);
        }
      });
    });

  return results;
}

/**
 * KHS Smart Auto-Assigner specifically for Mechanical Duties (Audio/Video, Microphones, Attendants, Platform, Zoom)
 * Preserves all platform parts, avoids outgoing speakers, respects absences, and applies KHS Same-Night Family Grouping.
 */
export function autoAssignWeekDutiesOnly(
  week: WeekSchedule,
  allWeeks: WeekSchedule[],
  publishers: Publisher[],
  customDuties: CustomDuty[],
  outgoingSpeakers: OutgoingSpeakerAssignment[] = [],
  scope: 'both' | 'midweek' | 'weekend' = 'both',
  overwriteExisting = false
): WeekSchedule {
  const updated: WeekSchedule = JSON.parse(JSON.stringify(week));

  // Helper to simulate updated week inside allWeeks for multi-week batch fairness
  const effectiveAllWeeks = allWeeks.map((w) => (w.id === updated.id ? updated : w));

  // 1. Midweek Duties
  if (
    (scope === 'both' || scope === 'midweek') &&
    !updated.specialEvent?.noMeetingMidweek
  ) {
    if (!updated.midweek.duties) updated.midweek.duties = {};
    const midweekDate = updated.midweek.date || updated.weekStartDate;

    if (overwriteExisting) {
      customDuties
        .filter((d) => d.midweek)
        .forEach((d) => {
          updated.midweek.duties[d.key] = [];
        });
    }

    const assignedMidweek = getAllAssignedIdsInMeeting(updated, 'midweek');

    customDuties
      .filter((d) => d.midweek)
      .forEach((duty) => {
        if (!updated.midweek.duties[duty.key]) {
          updated.midweek.duties[duty.key] = [];
        }
        const currentList = updated.midweek.duties[duty.key];
        const needed = Math.max(0, (duty.maxPeople || 1) - currentList.length);

        for (let i = 0; i < needed; i++) {
          const candidates = getEligibleCandidates(
            duty.key,
            midweekDate,
            'any',
            assignedMidweek,
            publishers,
            effectiveAllWeeks
          );
          const chosen = candidates.find(
            (c) => !c.hasConflictWarning && !currentList.includes(c.publisher.id)
          );
          if (chosen) {
            currentList.push(chosen.publisher.id);
            assignedMidweek.add(chosen.publisher.id);
          }
        }
      });
  }

  // 2. Weekend Duties
  if (
    (scope === 'both' || scope === 'weekend') &&
    !updated.specialEvent?.noMeetingWeekend
  ) {
    if (!updated.weekend.duties) updated.weekend.duties = {};
    const weekendDate = updated.weekend.date || updated.weekEndDate;

    if (overwriteExisting) {
      customDuties
        .filter((d) => d.weekend)
        .forEach((d) => {
          updated.weekend.duties[d.key] = [];
        });
    }

    const assignedWeekend = getAllAssignedIdsInMeeting(updated, 'weekend');

    // Also block brothers who have an Outgoing Public Talk this weekend
    outgoingSpeakers.forEach((out) => {
      if (out.date >= updated.weekStartDate && out.date <= updated.weekEndDate) {
        assignedWeekend.add(out.publisherId);
      }
    });

    customDuties
      .filter((d) => d.weekend)
      .forEach((duty) => {
        if (!updated.weekend.duties[duty.key]) {
          updated.weekend.duties[duty.key] = [];
        }
        const currentList = updated.weekend.duties[duty.key];
        const needed = Math.max(0, (duty.maxPeople || 1) - currentList.length);

        for (let i = 0; i < needed; i++) {
          const candidates = getEligibleCandidates(
            duty.key,
            weekendDate,
            'any',
            assignedWeekend,
            publishers,
            effectiveAllWeeks
          );
          const chosen = candidates.find(
            (c) => !c.hasConflictWarning && !currentList.includes(c.publisher.id)
          );
          if (chosen) {
            currentList.push(chosen.publisher.id);
            assignedWeekend.add(chosen.publisher.id);
          }
        }
      });
  }

  return updated;
}

export interface PublisherDutyEquityRow {
  publisher: Publisher;
  totalDuties: number;
  midweekDuties: number;
  weekendDuties: number;
  byDutyKey: Record<string, number>;
  lastDutyDate?: string;
}

/**
 * Computes duty distribution and equity across all weeks for qualified publishers
 */
export function computeDutyEquitabilityMatrix(
  weeks: WeekSchedule[],
  publishers: Publisher[],
  customDuties: CustomDuty[]
): PublisherDutyEquityRow[] {
  const dutyKeys = customDuties.map((d) => d.key);
  const rowsMap = new Map<string, PublisherDutyEquityRow>();

  publishers
    .filter((p) => p.active)
    .forEach((pub) => {
      const hasAnyDutyRole = dutyKeys.some(
        (k) => pub.roles?.[k] || (k === 'deber_audio' && pub.roles?.deber_video)
      );
      if (hasAnyDutyRole) {
        const byDutyKey: Record<string, number> = {};
        dutyKeys.forEach((k) => {
          byDutyKey[k] = 0;
        });
        rowsMap.set(pub.id, {
          publisher: pub,
          totalDuties: 0,
          midweekDuties: 0,
          weekendDuties: 0,
          byDutyKey,
          lastDutyDate: undefined,
        });
      }
    });

  const sortedWeeks = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

  sortedWeeks.forEach((w) => {
    const mDate = w.midweek?.date || w.weekStartDate;
    Object.entries(w.midweek?.duties || {}).forEach(([dKey, ids]) => {
      (ids || []).forEach((pid) => {
        const row = rowsMap.get(pid);
        if (row) {
          row.totalDuties += 1;
          row.midweekDuties += 1;
          row.byDutyKey[dKey] = (row.byDutyKey[dKey] || 0) + 1;
          row.lastDutyDate = mDate;
        }
      });
    });

    const wDate = w.weekend?.date || w.weekEndDate;
    Object.entries(w.weekend?.duties || {}).forEach(([dKey, ids]) => {
      (ids || []).forEach((pid) => {
        const row = rowsMap.get(pid);
        if (row) {
          row.totalDuties += 1;
          row.weekendDuties += 1;
          row.byDutyKey[dKey] = (row.byDutyKey[dKey] || 0) + 1;
          row.lastDutyDate = wDate;
        }
      });
    });
  });

  return Array.from(rowsMap.values()).sort((a, b) => b.totalDuties - a.totalDuties);
}

/**
 * Generates a 1-click WhatsApp Cleaning Reminder slip for the Field Service Group Overseer or Assistant
 */
export function buildGroupOverseerCleaningWhatsApp(params: {
  week: WeekSchedule;
  group: PreachingGroup;
  recipientName: string;
  recipientRoleLabel: 'Superintendente de Grupo' | 'Auxiliar de Grupo';
  members: Publisher[];
  settings: CongregationSettings;
}): string {
  const { week, group, recipientName, recipientRoleLabel, members, settings } = params;
  const cleaningType: CleaningProgramType = week.cleaningType || 'semanal';
  const typeLabel = CLEANING_TYPE_LABELS[cleaningType];
  const suppliesStatus: CleaningSuppliesStatus = week.cleaningSuppliesStatus || 'abastecido';
  const suppliesLabel = CLEANING_SUPPLIES_LABELS[suppliesStatus].label;

  const checklistItems = KHS_CLEANING_CHECKLIST_ITEMS.filter(
    (item) => cleaningType === 'profunda' || cleaningType === 'visita_sc' || cleaningType === 'evento_especial' || item.scope === 'semanal'
  );

  const completedSet = new Set(week.cleaningChecklistCompleted || []);

  let msg = `🧹 *PROGRAMA DE ASEO DEL SALÓN DEL REINO — ${settings.congregationName.toUpperCase()}*\n\n`;
  msg += `Hola querido hno. *${recipientName}* (${recipientRoleLabel} — *Grupo #${group.number}: ${group.name}*),\n`;
  msg += `Te recordamos con cariño que esta semana le corresponde a tu grupo el privilegio de mantener limpio y digno nuestro Salón del Reino:\n\n`;
  msg += `📅 *Semana:* ${week.weekStartDate} al ${week.weekEndDate}\n`;
  msg += `✨ *Modalidad:* ${typeLabel}\n`;
  msg += `🧴 *Estado de Insumos:* ${suppliesLabel}\n`;
  if (week.cleaningNotes) {
    msg += `📝 *Nota del Coordinador:* ${week.cleaningNotes}\n`;
  }

  msg += `\n📋 *LISTA DE VERIFICACIÓN S-28 (${checklistItems.length} áreas):*\n`;
  checklistItems.forEach((item) => {
    const done = completedSet.has(item.id);
    msg += `${done ? '✅' : '▫️'} *${item.label}:* ${item.detail}\n`;
  });

  if (members.length > 0) {
    const memberNames = members.map((m) => m.name).join(', ');
    msg += `\n👥 *Integrantes del Grupo #${group.number} (${members.length}):*\n${memberNames}\n`;
  }

  msg += `\n¡Muchas gracias por su excelente espíritu de colaboración para honrar a Jehová!`;
  return msg;
}
