// src/utils/autoAssigner.ts
import { WeekSchedule, Publisher, CustomDuty, ConflictRuleSettings, Gender } from '../types';
import { isPublisherAssignedInWeek } from './conflictDetector';
import {
  arePublishersFamily,
  getAssignedFamilyMembersInMeeting,
  getPubDisplayName,
  isValidDemonstrationPair,
} from './familyGrouping';
import { loadKhsWeights } from './khsWorkloadWeighting';

export interface CandidateScore {
  publisher: Publisher;
  lastAssignedDate?: string;
  daysSinceLastAssignment: number; // larger is better
  totalHistoricalAssignments: number; // lower is better
  weightedPoints?: number; // KHS Workload Weighting (lower is better)
  isRecommended: boolean;
  hasConflictWarning?: string;
  familyMembersInMeeting?: string[]; // KHS Same-Night Family Grouping
  isFamilyGrouped?: boolean;
  isCompanionFamilyMatch?: boolean; // Si es familiar directo del titular en una demostración
}

// Compute all historical assignments for every publisher across all weeks
export function computePublisherAssignmentStats(allWeeks: WeekSchedule[], publishers: Publisher[]) {
  const weights = loadKhsWeights();
  const stats = new Map<
    string,
    { total: number; weightedPoints: number; lastDate?: string; byRole: Record<string, number> }
  >();

  publishers.forEach(p => {
    stats.set(p.id, { total: 0, weightedPoints: 0, lastDate: undefined, byRole: {} });
  });

  const sortedWeeks = [...allWeeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

  for (const w of sortedWeeks) {
    // Collect all assignments in w
    const record = (pid: string | undefined, role: string, date: string) => {
      if (!pid) return;
      const s = stats.get(pid);
      if (s) {
        const pts = weights[role] !== undefined ? weights[role] : 2.0;
        s.total += 1;
        s.weightedPoints = Math.round((s.weightedPoints + pts) * 10) / 10;
        s.lastDate = date;
        s.byRole[role] = (s.byRole[role] || 0) + 1;
      }
    };

    // Midweek
    record(w.midweek.presidentId, 'vym_presidente', w.midweek.date);
    record(w.midweek.initialPrayerId, 'vym_oracion', w.midweek.date);
    record(w.midweek.finalPrayerId, 'vym_oracion', w.midweek.date);
    record(w.midweek.tesoros.discurso.publisherId, 'vym_tesoros_discurso', w.midweek.date);
    record(w.midweek.tesoros.perlas.publisherId, 'vym_tesoros_perlas', w.midweek.date);
    record(w.midweek.tesoros.lecturaBiblia.publisherId, 'vym_tesoros_lectura', w.midweek.date);
    if (w.midweek.tesoros.lecturaBibliaAux?.publisherId) {
      record(w.midweek.tesoros.lecturaBibliaAux.publisherId, 'vym_tesoros_lectura', w.midweek.date);
    }
    w.midweek.maestros.items.forEach(m => {
      record(m.publisherId, 'vym_maestros_titular', w.midweek.date);
      record(m.assistantId, 'vym_maestros_ayudante', w.midweek.date);
    });
    w.midweek.vidaCristiana.items.forEach(v => {
      record(v.publisherId, 'vym_vida_partes', w.midweek.date);
    });
    record(w.midweek.vidaCristiana.estudioBiblico.conductorId, 'vym_estudio_conductor', w.midweek.date);
    record(w.midweek.vidaCristiana.estudioBiblico.lectorId, 'vym_estudio_lector', w.midweek.date);

    Object.entries(w.midweek.duties).forEach(([dutyKey, ids]) => {
      ids.forEach(id => record(id, dutyKey, w.midweek.date));
    });

    // Weekend
    record(w.weekend.presidentId, 'fds_presidente', w.weekend.date);
    record(w.weekend.atalayaConductorId, 'fds_atalaya_conductor', w.weekend.date);
    record(w.weekend.atalayaLectorId, 'fds_atalaya_lector', w.weekend.date);
    record(w.weekend.initialPrayerId, 'fds_oracion', w.weekend.date);
    record(w.weekend.finalPrayerId, 'fds_oracion', w.weekend.date);
    Object.entries(w.weekend.duties).forEach(([dutyKey, ids]) => {
      ids.forEach(id => record(id, dutyKey, w.weekend.date));
    });
  }

  return stats;
}

// Get ordered candidates for a specific role
export function getEligibleCandidates(
  roleKey: string,
  meetingDate: string,
  targetGender: Gender | 'any',
  currentAssignedIdsInMeeting: Set<string>,
  publishers: Publisher[],
  allWeeks: WeekSchedule[],
  companionPublisherId?: string
): CandidateScore[] {
  const stats = computePublisherAssignmentStats(allWeeks, publishers);
  const meetingTime = new Date(meetingDate).getTime();
  const companionPub = companionPublisherId
    ? publishers.find(p => p.id === companionPublisherId || p.nid === companionPublisherId)
    : undefined;

  const candidates: CandidateScore[] = [];

  for (const pub of publishers) {
    // 1. Must be active
    if (!pub.active) continue;

    // 2. Gender or S-38 Family Demonstration check
    if (companionPub) {
      // Si se elige ayudante (o titular) frente a un compañero ya definido, validar pauta S-38:
      // mismo género siempre permitido; distinto género solo si son familiares directos
      if (!isValidDemonstrationPair(companionPub, pub, true)) {
        continue;
      }
    } else if (targetGender !== 'any' && pub.gender !== targetGender) {
      continue;
    }

    // 3. Absence check
    const isAbsent = pub.absences.some(
      abs => abs.startDate <= meetingDate && abs.endDate >= meetingDate
    );
    if (isAbsent) continue;

    // 4. Role enabled check
    const hasRole = Boolean(
      pub.roles && (pub.roles[roleKey] || (roleKey === 'deber_audio' && pub.roles.deber_video))
    );
    if (!hasRole) continue;

    // 5. Check if already has an assignment in this specific meeting
    const alreadyInMeeting = currentAssignedIdsInMeeting.has(pub.id);

    const pubStat = stats.get(pub.id);
    let daysSinceLast = 9999;
    if (pubStat?.lastDate) {
      const lastTime = new Date(pubStat.lastDate).getTime();
      daysSinceLast = Math.max(0, Math.floor((meetingTime - lastTime) / (1000 * 60 * 60 * 24)));
    }

    // 6. KHS Same-Night Family Grouping check
    const assignedFamily = getAssignedFamilyMembersInMeeting(
      pub,
      currentAssignedIdsInMeeting,
      publishers
    );
    const familyNames = assignedFamily.map(f => getPubDisplayName(f));
    const isFamilyGrouped =
      pub.groupWithFamilyInMeetings !== false &&
      familyNames.length > 0 &&
      daysSinceLast >= 14; // Evita asignar dos semanas seguidas solo por agrupación familiar

    const isCompanionFamilyMatch = companionPub
      ? arePublishersFamily(companionPub, pub)
      : false;

    candidates.push({
      publisher: pub,
      lastAssignedDate: pubStat?.lastDate,
      daysSinceLastAssignment: daysSinceLast,
      totalHistoricalAssignments: pubStat?.total || 0,
      weightedPoints: pubStat?.weightedPoints || 0,
      isRecommended: false,
      hasConflictWarning: alreadyInMeeting ? 'Ya tiene otra asignación en esta misma reunión' : undefined,
      familyMembersInMeeting: familyNames.length > 0 ? familyNames : undefined,
      isFamilyGrouped,
      isCompanionFamilyMatch,
    });
  }

  // Sort:
  // 1. Without conflict warning first
  // 2. If selecting demonstration companion, prioritize family match or same-night family grouping (when rested >= 14 days)
  // 3. Longest time since last assignment (with +21 days virtual boost for KHS Same-Night Family Grouping)
  // 4. Lowest KHS Weighted Workload Points, then fewest total assignments
  candidates.sort((a, b) => {
    if (a.hasConflictWarning && !b.hasConflictWarning) return 1;
    if (!a.hasConflictWarning && b.hasConflictWarning) return -1;

    if (companionPub && a.isCompanionFamilyMatch !== b.isCompanionFamilyMatch) {
      if (a.isCompanionFamilyMatch && a.daysSinceLastAssignment >= 14) return -1;
      if (b.isCompanionFamilyMatch && b.daysSinceLastAssignment >= 14) return 1;
    }

    const effectiveDaysA =
      a.daysSinceLastAssignment + (a.isFamilyGrouped ? 21 : 0);
    const effectiveDaysB =
      b.daysSinceLastAssignment + (b.isFamilyGrouped ? 21 : 0);

    if (effectiveDaysB !== effectiveDaysA) {
      return effectiveDaysB - effectiveDaysA;
    }
    const ptsA = a.weightedPoints || 0;
    const ptsB = b.weightedPoints || 0;
    if (ptsA !== ptsB) {
      return ptsA - ptsB;
    }
    return a.totalHistoricalAssignments - b.totalHistoricalAssignments;
  });

  if (candidates.length > 0 && !candidates[0].hasConflictWarning) {
    candidates[0].isRecommended = true;
  }

  return candidates;
}

// Auto-assign an entire week avoiding all conflicts
export function autoAssignWeek(
  week: WeekSchedule,
  allWeeks: WeekSchedule[],
  publishers: Publisher[],
  rules: ConflictRuleSettings,
  customDuties: CustomDuty[]
): WeekSchedule {
  // If special event blocks meetings, skip
  if (week.specialEvent?.isSpecial) {
    if (week.specialEvent.noMeetingMidweek && week.specialEvent.noMeetingWeekend) {
      return week;
    }
  }

  const updated: WeekSchedule = JSON.parse(JSON.stringify(week));

  // --- MIDWEEK ASSIGNMENT ---
  if (!week.specialEvent?.noMeetingMidweek) {
    const midweekDate = updated.midweek.date;
    const assignedThisMeeting = new Set<string>();

    const pick = (
      role: string,
      gender: Gender | 'any' = 'any',
      companionPublisherId?: string
    ): string | undefined => {
      const list = getEligibleCandidates(
        role,
        midweekDate,
        gender,
        assignedThisMeeting,
        publishers,
        allWeeks,
        companionPublisherId
      );
      const chosen = list.find(c => !c.hasConflictWarning);
      if (chosen) {
        assignedThisMeeting.add(chosen.publisher.id);
        return chosen.publisher.id;
      }
      return undefined;
    };

    // 1. President (Brothers)
    if (!updated.midweek.presidentId) {
      const pid = pick('vym_presidente', 'hermano');
      if (pid) updated.midweek.presidentId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.presidentId);
    }

    // 2. Initial Prayer (Brothers)
    if (!updated.midweek.initialPrayerId) {
      const pid = pick('vym_oracion', 'hermano');
      if (pid) updated.midweek.initialPrayerId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.initialPrayerId);
    }

    // 3. Tesoros: Discurso (Brothers)
    if (!updated.midweek.tesoros.discurso.publisherId) {
      const pid = pick('vym_tesoros_discurso', 'hermano');
      if (pid) updated.midweek.tesoros.discurso.publisherId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.tesoros.discurso.publisherId);
    }

    // 4. Tesoros: Perlas (Brothers)
    if (!updated.midweek.tesoros.perlas.publisherId) {
      const pid = pick('vym_tesoros_perlas', 'hermano');
      if (pid) updated.midweek.tesoros.perlas.publisherId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.tesoros.perlas.publisherId);
    }

    // 5. Lectura de la Biblia (Brothers)
    if (!updated.midweek.tesoros.lecturaBiblia.publisherId) {
      const pid = pick('vym_tesoros_lectura', 'hermano');
      if (pid) updated.midweek.tesoros.lecturaBiblia.publisherId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.tesoros.lecturaBiblia.publisherId);
    }

    // 6. Seamos Mejores Maestros (Demonstrations)
    updated.midweek.maestros.items.forEach(item => {
      if (!item.publisherId) {
        // Can be brother or sister
        const titularId = pick('vym_maestros_titular', 'any');
        if (titularId) {
          item.publisherId = titularId;
          // Pick assistant respecting S-38 gender/family rule and KHS Family Grouping
          const assistantId = pick('vym_maestros_ayudante', 'any', titularId);
          if (assistantId) item.assistantId = assistantId;
        }
      } else {
        assignedThisMeeting.add(item.publisherId);
        if (item.assistantId) {
          assignedThisMeeting.add(item.assistantId);
        } else {
          const assistantId = pick('vym_maestros_ayudante', 'any', item.publisherId);
          if (assistantId) item.assistantId = assistantId;
        }
      }
    });

    // 7. Vida Cristiana: Partes
    updated.midweek.vidaCristiana.items.forEach(item => {
      if (!item.publisherId) {
        const pid = pick('vym_vida_partes', 'hermano');
        if (pid) item.publisherId = pid;
      } else {
        assignedThisMeeting.add(item.publisherId);
      }
    });

    // 8. Estudio Bíblico: Conductor y Lector
    if (!updated.midweek.vidaCristiana.estudioBiblico.conductorId) {
      const pid = pick('vym_estudio_conductor', 'hermano');
      if (pid) updated.midweek.vidaCristiana.estudioBiblico.conductorId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.vidaCristiana.estudioBiblico.conductorId);
    }

    if (!updated.midweek.vidaCristiana.estudioBiblico.lectorId) {
      const pid = pick('vym_estudio_lector', 'hermano');
      if (pid) updated.midweek.vidaCristiana.estudioBiblico.lectorId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.vidaCristiana.estudioBiblico.lectorId);
    }

    // 9. Final Prayer (Brothers)
    if (!updated.midweek.finalPrayerId) {
      const pid = pick('vym_oracion', 'hermano');
      if (pid) updated.midweek.finalPrayerId = pid;
    } else {
      assignedThisMeeting.add(updated.midweek.finalPrayerId);
    }

    // 10. Midweek Duties (Audio, Video, Microphones, Acomodador, Zoom, etc.)
    customDuties.filter(d => d.midweek).forEach(duty => {
      if (!updated.midweek.duties[duty.key]) {
        updated.midweek.duties[duty.key] = [];
      }
      const existing = updated.midweek.duties[duty.key];
      const needed = (duty.maxPeople || 1) - existing.length;
      for (let i = 0; i < needed; i++) {
        const pid = pick(duty.key, 'any');
        if (pid) {
          existing.push(pid);
        }
      }
    });
  }

  // --- WEEKEND ASSIGNMENT ---
  if (!week.specialEvent?.noMeetingWeekend) {
    const weekendDate = updated.weekend.date;
    const assignedThisMeeting = new Set<string>();

    const pickWeekend = (role: string, gender: Gender | 'any' = 'any'): string | undefined => {
      const list = getEligibleCandidates(role, weekendDate, gender, assignedThisMeeting, publishers, allWeeks);
      const chosen = list.find(c => !c.hasConflictWarning);
      if (chosen) {
        assignedThisMeeting.add(chosen.publisher.id);
        return chosen.publisher.id;
      }
      return undefined;
    };

    // 1. Weekend President
    if (!updated.weekend.presidentId) {
      const pid = pickWeekend('fds_presidente', 'hermano');
      if (pid) updated.weekend.presidentId = pid;
    } else {
      assignedThisMeeting.add(updated.weekend.presidentId);
    }

    // 2. Initial Prayer
    if (!updated.weekend.initialPrayerId) {
      const pid = pickWeekend('fds_oracion', 'hermano');
      if (pid) updated.weekend.initialPrayerId = pid;
    } else {
      assignedThisMeeting.add(updated.weekend.initialPrayerId);
    }

    // 3. Conductor La Atalaya
    if (!updated.weekend.atalayaConductorId) {
      const pid = pickWeekend('fds_presidente', 'hermano');
      if (pid) updated.weekend.atalayaConductorId = pid;
    } else {
      assignedThisMeeting.add(updated.weekend.atalayaConductorId);
    }

    // 4. Lector La Atalaya
    if (!updated.weekend.atalayaLectorId) {
      const pid = pickWeekend('fds_atalaya_lector', 'hermano');
      if (pid) updated.weekend.atalayaLectorId = pid;
    } else {
      assignedThisMeeting.add(updated.weekend.atalayaLectorId);
    }

    // 5. Final Prayer
    if (!updated.weekend.finalPrayerId) {
      const pid = pickWeekend('fds_oracion', 'hermano');
      if (pid) updated.weekend.finalPrayerId = pid;
    } else {
      assignedThisMeeting.add(updated.weekend.finalPrayerId);
    }

    // 6. Weekend Duties
    customDuties.filter(d => d.weekend).forEach(duty => {
      if (!updated.weekend.duties[duty.key]) {
        updated.weekend.duties[duty.key] = [];
      }
      const existing = updated.weekend.duties[duty.key];
      const needed = (duty.maxPeople || 1) - existing.length;
      for (let i = 0; i < needed; i++) {
        const pid = pickWeekend(duty.key, 'any');
        if (pid) {
          existing.push(pid);
        }
      }
    });
  }

  return updated;
}
