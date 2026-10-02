// src/utils/conflictDetector.ts
import { WeekSchedule, Publisher, ConflictRuleSettings, ConflictAlert, OutgoingSpeakerAssignment } from '../types';

interface AssignmentEntry {
  publisherId: string;
  roleType: string;
  title: string;
  isDuty: boolean;
  isPresident: boolean;
}

export function detectConflictsInWeek(
  week: WeekSchedule,
  allWeeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  rules: ConflictRuleSettings,
  outgoingSpeakers: OutgoingSpeakerAssignment[] = []
): ConflictAlert[] {
  const alerts: ConflictAlert[] = [];
  const weekId = week.id;
  const weekStartDate = week.weekStartDate;

  // If special event completely cancels meeting, check if assignments were left
  if (week.specialEvent?.isSpecial) {
    if (week.specialEvent.noMeetingMidweek) {
      const hasMidweek = Boolean(
        week.midweek.presidentId ||
        week.midweek.tesoros.discurso.publisherId ||
        week.midweek.tesoros.perlas.publisherId
      );
      if (hasMidweek) {
        alerts.push({
          id: `special-midweek-${weekId}`,
          weekId,
          weekStartDate,
          meetingType: 'midweek',
          severity: 'warning',
          publisherId: '',
          publisherName: 'Evento Especial',
          type: 'special_event_clash',
          description: `Hay asignaciones en la reunión de entre semana, pero el evento "${week.specialEvent.title}" indica que no hay reunión.`,
          assignmentTitles: ['Reunión de entre semana'],
        });
      }
    }

    if (week.specialEvent.noMeetingWeekend) {
      const hasWeekend = Boolean(
        week.weekend.presidentId ||
        week.weekend.atalayaConductorId ||
        week.weekend.atalayaLectorId
      );
      if (hasWeekend) {
        alerts.push({
          id: `special-weekend-${weekId}`,
          weekId,
          weekStartDate,
          meetingType: 'weekend',
          severity: 'warning',
          publisherId: '',
          publisherName: 'Evento Especial',
          type: 'special_event_clash',
          description: `Hay asignaciones en el fin de semana, pero el evento "${week.specialEvent.title}" indica que no hay reunión.`,
          assignmentTitles: ['Reunión de fin de semana'],
        });
      }
    }
  }

  // --- ANALYZE MIDWEEK MEETING ---
  if (!week.specialEvent?.noMeetingMidweek) {
    const midweekDate = week.midweek.date;
    const midweekEntries: AssignmentEntry[] = [];

    // President and prayers
    if (week.midweek.presidentId) {
      midweekEntries.push({
        publisherId: week.midweek.presidentId,
        roleType: 'vym_presidente',
        title: 'Presidente de la reunión',
        isDuty: false,
        isPresident: true,
      });
    }
    if (week.midweek.initialPrayerId) {
      midweekEntries.push({
        publisherId: week.midweek.initialPrayerId,
        roleType: 'vym_oracion',
        title: 'Oración inicial',
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.midweek.finalPrayerId) {
      midweekEntries.push({
        publisherId: week.midweek.finalPrayerId,
        roleType: 'vym_oracion',
        title: 'Oración final',
        isDuty: false,
        isPresident: false,
      });
    }

    // Tesoros
    if (week.midweek.tesoros.discurso.publisherId) {
      midweekEntries.push({
        publisherId: week.midweek.tesoros.discurso.publisherId,
        roleType: 'vym_tesoros_discurso',
        title: `Tesoros: ${week.midweek.tesoros.discurso.title}`,
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.midweek.tesoros.perlas.publisherId) {
      midweekEntries.push({
        publisherId: week.midweek.tesoros.perlas.publisherId,
        roleType: 'vym_tesoros_perlas',
        title: `Perlas: ${week.midweek.tesoros.perlas.title}`,
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.midweek.tesoros.lecturaBiblia.publisherId) {
      midweekEntries.push({
        publisherId: week.midweek.tesoros.lecturaBiblia.publisherId,
        roleType: 'vym_tesoros_lectura',
        title: `Lectura Biblia (Principal)`,
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.midweek.tesoros.lecturaBibliaAux?.publisherId) {
      midweekEntries.push({
        publisherId: week.midweek.tesoros.lecturaBibliaAux.publisherId,
        roleType: 'vym_tesoros_lectura',
        title: `Lectura Biblia (Auxiliar)`,
        isDuty: false,
        isPresident: false,
      });
    }

    // Seamos mejores maestros
    week.midweek.maestros.items.forEach((item, idx) => {
      if (item.publisherId) {
        midweekEntries.push({
          publisherId: item.publisherId,
          roleType: 'vym_maestros_titular',
          title: `Maestros #${idx + 1}: ${item.title} (${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'})`,
          isDuty: false,
          isPresident: false,
        });

        // Sister demonstration assistant validation
        const titularPub = publishersMap.get(item.publisherId);
        if (item.assistantId && titularPub) {
          const assistantPub = publishersMap.get(item.assistantId);
          if (rules.enforceSisterDemonstrationRules && titularPub.gender === 'hermana' && assistantPub && assistantPub.gender === 'hermano') {
            alerts.push({
              id: `gender-helper-${weekId}-${item.id}`,
              weekId,
              weekStartDate,
              meetingType: 'midweek',
              severity: 'warning',
              publisherId: assistantPub.id,
              publisherName: assistantPub.name,
              type: 'gender_mismatch',
              description: `En la parte "${item.title}", la hermana titular (${titularPub.name}) tiene asignado como ayudante a un hermano (${assistantPub.name}). Salvo excepciones familiares, la ayudante debe ser otra hermana.`,
              assignmentTitles: [item.title],
            });
          }
        }
      }
      if (item.assistantId) {
        midweekEntries.push({
          publisherId: item.assistantId,
          roleType: 'vym_maestros_ayudante',
          title: `Ayudante en #${idx + 1}: ${item.title} (${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'})`,
          isDuty: false,
          isPresident: false,
        });
      }
    });

    // Vida Cristiana
    week.midweek.vidaCristiana.items.forEach((item, idx) => {
      if (item.publisherId) {
        midweekEntries.push({
          publisherId: item.publisherId,
          roleType: 'vym_vida_partes',
          title: `Vida Cristiana #${idx + 1}: ${item.title}`,
          isDuty: false,
          isPresident: false,
        });
      }
    });

    if (week.midweek.vidaCristiana.estudioBiblico.conductorId) {
      midweekEntries.push({
        publisherId: week.midweek.vidaCristiana.estudioBiblico.conductorId,
        roleType: 'vym_estudio_conductor',
        title: 'Conductor Estudio Bíblico de Congregación',
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.midweek.vidaCristiana.estudioBiblico.lectorId) {
      midweekEntries.push({
        publisherId: week.midweek.vidaCristiana.estudioBiblico.lectorId,
        roleType: 'vym_estudio_lector',
        title: 'Lector Estudio Bíblico de Congregación',
        isDuty: false,
        isPresident: false,
      });
    }

    // Midweek Duties
    Object.entries(week.midweek.duties).forEach(([dutyKey, pubIds]) => {
      pubIds.forEach((pid) => {
        if (pid) {
          midweekEntries.push({
            publisherId: pid,
            roleType: dutyKey,
            title: `Deber: ${dutyKey.replace('deber_', '').toUpperCase()}`,
            isDuty: true,
            isPresident: false,
          });
        }
      });
    });

    // Run rules on midweek entries
    analyzeMeetingEntries(midweekEntries, 'midweek', midweekDate, weekId, weekStartDate, publishersMap, rules, alerts);
  }

  // --- ANALYZE WEEKEND MEETING ---
  if (!week.specialEvent?.noMeetingWeekend) {
    const weekendDate = week.weekend.date;
    const weekendEntries: AssignmentEntry[] = [];

    if (week.weekend.presidentId) {
      weekendEntries.push({
        publisherId: week.weekend.presidentId,
        roleType: 'fds_presidente',
        title: 'Presidente fin de semana',
        isDuty: false,
        isPresident: true,
      });
    }
    if (week.weekend.atalayaConductorId) {
      weekendEntries.push({
        publisherId: week.weekend.atalayaConductorId,
        roleType: 'fds_presidente', // conductor acts as main role
        title: 'Conductor de La Atalaya',
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.weekend.atalayaLectorId) {
      weekendEntries.push({
        publisherId: week.weekend.atalayaLectorId,
        roleType: 'fds_atalaya_lector',
        title: 'Lector de La Atalaya',
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.weekend.initialPrayerId) {
      weekendEntries.push({
        publisherId: week.weekend.initialPrayerId,
        roleType: 'fds_oracion',
        title: 'Oración inicial (Fin de semana)',
        isDuty: false,
        isPresident: false,
      });
    }
    if (week.weekend.finalPrayerId) {
      weekendEntries.push({
        publisherId: week.weekend.finalPrayerId,
        roleType: 'fds_oracion',
        title: 'Oración final (Fin de semana)',
        isDuty: false,
        isPresident: false,
      });
    }

    // Local public talk speaker
    if (week.weekend.publicTalkSpeaker && publishersMap.has(week.weekend.publicTalkSpeaker)) {
      weekendEntries.push({
        publisherId: week.weekend.publicTalkSpeaker,
        roleType: 'fds_discurso_publico',
        title: `Discurso Público: #${week.weekend.publicTalkOutlineNumber || ''} ${week.weekend.publicTalkTheme || ''}`,
        isDuty: false,
        isPresident: false,
      });
    }

    // Hospitality publisher (caring for visiting speaker meals/accommodation)
    if (week.weekend.hospitalityPublisherId) {
      weekendEntries.push({
        publisherId: week.weekend.hospitalityPublisherId,
        roleType: 'hospitalidad',
        title: 'Hospitalidad / Comida para el orador visitante',
        isDuty: true,
        isPresident: false,
      });
    }

    // Weekend duties
    Object.entries(week.weekend.duties).forEach(([dutyKey, pubIds]) => {
      pubIds.forEach((pid) => {
        if (pid) {
          weekendEntries.push({
            publisherId: pid,
            roleType: dutyKey,
            title: `Deber fin de semana: ${dutyKey.replace('deber_', '').toUpperCase()}`,
            isDuty: true,
            isPresident: false,
          });
        }
      });
    });

    analyzeMeetingEntries(weekendEntries, 'weekend', weekendDate, weekId, weekStartDate, publishersMap, rules, alerts);
  }

  // --- OUTGOING SPEAKERS CONFLICT CHECK ---
  if (outgoingSpeakers && outgoingSpeakers.length > 0) {
    const outgoingThisWeek = outgoingSpeakers.filter((o) => {
      return o.date >= week.weekStartDate && o.date <= week.weekEndDate;
    });

    outgoingThisWeek.forEach((out) => {
      const pub = publishersMap.get(out.publisherId);
      const isAssignedWeekend = isPublisherAssignedInWeekend(week, out.publisherId);
      if (isAssignedWeekend) {
        alerts.push({
          id: `outgoing-clash-${weekId}-${out.publisherId}`,
          weekId,
          weekStartDate,
          meetingType: 'weekend',
          severity: 'error',
          publisherId: out.publisherId,
          publisherName: pub?.name || 'Orador',
          type: 'outgoing_speaker_clash',
          description: `${pub?.name || 'El hermano'} tiene asignado un discurso de salida en "${out.destinationCongregation}" el ${out.date} (Bosquejo #${out.outlineNumber}: ${out.outlineTitle}), pero también tiene asignaciones locales este fin de semana.`,
          assignmentTitles: ['Discurso de salida en otra congregación vs Asignación local'],
        });
      }
    });
  }

  // --- REPEATED OUTLINE CHECK ---
  if (week.weekend.publicTalkOutlineNumber) {
    const num = week.weekend.publicTalkOutlineNumber;
    const prevWeekWithSameOutline = allWeeks.find((w) => {
      if (w.id === week.id) return false;
      if (w.weekStartDate >= week.weekStartDate) return false;
      return w.weekend.publicTalkOutlineNumber === num;
    });

    if (prevWeekWithSameOutline) {
      alerts.push({
        id: `outline-repeat-${weekId}-${num}`,
        weekId,
        weekStartDate,
        meetingType: 'weekend',
        severity: 'warning',
        publisherId: week.weekend.publicTalkSpeaker || '',
        publisherName: 'Discurso Público',
        type: 'outline_repeated',
        description: `El bosquejo #${num} ("${week.weekend.publicTalkTheme || ''}") ya fue presentado en la congregación la semana del ${prevWeekWithSameOutline.weekStartDate}. Verifique que no se repita con demasiada frecuencia.`,
        assignmentTitles: [`Bosquejo #${num}`],
      });
    }
  }

  // --- CHECK CONSECUTIVE WEEKS FATIGUE ---
  checkConsecutiveWeeksFatigue(week, allWeeks, publishersMap, rules, alerts);

  return alerts;
}

function analyzeMeetingEntries(
  entries: AssignmentEntry[],
  meetingType: 'midweek' | 'weekend',
  meetingDate: string,
  weekId: string,
  weekStartDate: string,
  publishersMap: Map<string, Publisher>,
  rules: ConflictRuleSettings,
  alerts: ConflictAlert[]
) {
  // Group by publisher
  const byPub = new Map<string, AssignmentEntry[]>();
  for (const entry of entries) {
    if (!byPub.has(entry.publisherId)) {
      byPub.set(entry.publisherId, []);
    }
    byPub.get(entry.publisherId)!.push(entry);
  }

  byPub.forEach((pubEntries, pubId) => {
    const pub = publishersMap.get(pubId);
    if (!pub) return;

    // 1. INACTIVE CHECK
    if (!pub.active) {
      alerts.push({
        id: `inactive-${weekId}-${meetingType}-${pubId}`,
        weekId,
        weekStartDate,
        meetingType,
        severity: 'error',
        publisherId: pubId,
        publisherName: pub.name,
        type: 'inactive',
        description: `${pub.name} está marcado como INACTIVO en la congregación pero tiene asignaciones programadas.`,
        assignmentTitles: pubEntries.map(e => e.title),
      });
    }

    // 2. ABSENCE CHECK
    const activeAbsence = pub.absences.find(
      abs => abs.startDate <= meetingDate && abs.endDate >= meetingDate
    );
    if (activeAbsence) {
      alerts.push({
        id: `absence-${weekId}-${meetingType}-${pubId}`,
        weekId,
        weekStartDate,
        meetingType,
        severity: 'error',
        publisherId: pubId,
        publisherName: pub.name,
        type: 'absence',
        description: `${pub.name} tiene una AUSENCIA registrada del ${activeAbsence.startDate} al ${activeAbsence.endDate} (${activeAbsence.reason || 'Sin motivo especificado'}).`,
        assignmentTitles: pubEntries.map(e => e.title),
      });
    }

    // 3. ROLE ENABLED CHECK
    for (const e of pubEntries) {
      // If role key exists in pub.roles and is false
      if (pub.roles && e.roleType in pub.roles && !pub.roles[e.roleType]) {
        alerts.push({
          id: `disabled-role-${weekId}-${meetingType}-${pubId}-${e.roleType}`,
          weekId,
          weekStartDate,
          meetingType,
          severity: 'warning',
          publisherId: pubId,
          publisherName: pub.name,
          type: 'role_disabled',
          description: `${pub.name} tiene asignado "${e.title}", pero no tiene habilitada esa casilla de rol en su perfil.`,
          assignmentTitles: [e.title],
        });
      }

      // Gender safety check
      if (pub.gender === 'hermana') {
        const maleOnlyRoles = [
          'vym_presidente',
          'vym_oracion',
          'vym_tesoros_discurso',
          'vym_tesoros_perlas',
          'vym_estudio_conductor',
          'fds_presidente',
          'fds_oracion',
        ];
        if (maleOnlyRoles.includes(e.roleType)) {
          alerts.push({
            id: `gender-${weekId}-${meetingType}-${pubId}-${e.roleType}`,
            weekId,
            weekStartDate,
            meetingType,
            severity: 'error',
            publisherId: pubId,
            publisherName: pub.name,
            type: 'gender_mismatch',
            description: `La hermana ${pub.name} está asignada a "${e.title}", rol reservado según las pautas teocráticas.`,
            assignmentTitles: [e.title],
          });
        }
      }
    }

    // 4. MULTIPLE ASSIGNMENTS / CLASHES IN THE SAME MEETING
    if (pubEntries.length > 1) {
      const hasPart = pubEntries.some(e => !e.isDuty);
      const hasDuty = pubEntries.some(e => e.isDuty);
      const isPres = pubEntries.some(e => e.isPresident);
      const hasAudio = pubEntries.some(e => e.roleType === 'deber_audio' || e.roleType === 'deber_video');
      const hasMics = pubEntries.some(e => e.roleType === 'deber_microfonos' || e.roleType === 'deber_acomodador');

      // Rule: Can't have stage part + duty if disallowed
      if (!rules.allowPartAndDutySameMeeting && hasPart && hasDuty) {
        alerts.push({
          id: `part-duty-clash-${weekId}-${meetingType}-${pubId}`,
          weekId,
          weekStartDate,
          meetingType,
          severity: 'error',
          publisherId: pubId,
          publisherName: pub.name,
          type: 'double_assignment',
          description: `CRUCE CRÍTICO: ${pub.name} tiene una parte en el programa y a la vez un deber operativo en la misma reunión.`,
          assignmentTitles: pubEntries.map(e => e.title),
        });
      }

      // Rule: Can't do audio and microphones simultaneously
      if (!rules.allowAudioAndMicrophones && hasAudio && hasMics) {
        alerts.push({
          id: `audio-mic-clash-${weekId}-${meetingType}-${pubId}`,
          weekId,
          weekStartDate,
          meetingType,
          severity: 'error',
          publisherId: pubId,
          publisherName: pub.name,
          type: 'double_assignment',
          description: `CRUCE OPERATIVO: ${pub.name} está asignado al sonido/video y a los micrófonos/acomodador al mismo tiempo.`,
          assignmentTitles: pubEntries.map(e => e.title),
        });
      }

      // Rule: President cannot have another major part
      if (!rules.allowPresidentAndOtherPart && isPres && pubEntries.length > 1) {
        alerts.push({
          id: `pres-clash-${weekId}-${meetingType}-${pubId}`,
          weekId,
          weekStartDate,
          meetingType,
          severity: 'warning',
          publisherId: pubId,
          publisherName: pub.name,
          type: 'double_assignment',
          description: `${pub.name} es el Presidente de la reunión y además tiene otra responsabilidad asignada.`,
          assignmentTitles: pubEntries.map(e => e.title),
        });
      }

      // General double assignment warning if none of above triggered
      if (
        rules.allowPartAndDutySameMeeting &&
        rules.allowAudioAndMicrophones &&
        rules.allowPresidentAndOtherPart
      ) {
        alerts.push({
          id: `double-general-${weekId}-${meetingType}-${pubId}`,
          weekId,
          weekStartDate,
          meetingType,
          severity: 'warning',
          publisherId: pubId,
          publisherName: pub.name,
          type: 'double_assignment',
          description: `${pub.name} tiene ${pubEntries.length} asignaciones simultáneas en la reunión de ${meetingType === 'midweek' ? 'entre semana' : 'fin de semana'}.`,
          assignmentTitles: pubEntries.map(e => e.title),
        });
      }
    }
  });
}

function checkConsecutiveWeeksFatigue(
  currentWeek: WeekSchedule,
  allWeeks: WeekSchedule[],
  publishersMap: Map<string, Publisher>,
  rules: ConflictRuleSettings,
  alerts: ConflictAlert[]
) {
  // Sort all weeks chronologically
  const sortedWeeks = [...allWeeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  const currentIndex = sortedWeeks.findIndex(w => w.id === currentWeek.id);
  if (currentIndex < 0) return;

  const maxConsecutive = Math.max(rules.maxConsecutiveWeeksWithDuty, rules.maxConsecutiveWeeksWithPart, 1);
  if (currentIndex < maxConsecutive) return;

  // Check past N weeks up to current week
  const slice = sortedWeeks.slice(currentIndex - maxConsecutive, currentIndex + 1);

  publishersMap.forEach(pub => {
    let consecutiveCount = 0;
    for (const w of slice) {
      if (isPublisherAssignedInWeek(pub.id, w)) {
        consecutiveCount++;
      } else {
        consecutiveCount = 0;
      }
    }

    if (consecutiveCount > maxConsecutive) {
      alerts.push({
        id: `fatigue-${currentWeek.id}-${pub.id}`,
        weekId: currentWeek.id,
        weekStartDate: currentWeek.weekStartDate,
        meetingType: 'midweek',
        severity: 'warning',
        publisherId: pub.id,
        publisherName: pub.name,
        type: 'consecutive_weeks',
        description: `${pub.name} lleva ${consecutiveCount} semanas seguidas con asignaciones (el límite configurado es de ${maxConsecutive} semanas).`,
        assignmentTitles: [`Sobrecarga continua de asignaciones`],
      });
    }
  });
}

export function isPublisherAssignedInWeekend(week: WeekSchedule, pubId: string): boolean {
  if (
    week.weekend.presidentId === pubId ||
    week.weekend.publicTalkSpeaker === pubId ||
    week.weekend.hospitalityPublisherId === pubId ||
    week.weekend.atalayaConductorId === pubId ||
    week.weekend.atalayaLectorId === pubId ||
    week.weekend.initialPrayerId === pubId ||
    week.weekend.finalPrayerId === pubId
  ) {
    return true;
  }

  for (const ids of Object.values(week.weekend.duties)) {
    if (ids.includes(pubId)) return true;
  }

  return false;
}

export function isPublisherAssignedInWeek(pubId: string, week: WeekSchedule): boolean {
  // Midweek
  if (
    week.midweek.presidentId === pubId ||
    week.midweek.initialPrayerId === pubId ||
    week.midweek.finalPrayerId === pubId ||
    week.midweek.tesoros.discurso.publisherId === pubId ||
    week.midweek.tesoros.perlas.publisherId === pubId ||
    week.midweek.tesoros.lecturaBiblia.publisherId === pubId ||
    week.midweek.tesoros.lecturaBibliaAux?.publisherId === pubId ||
    week.midweek.vidaCristiana.estudioBiblico.conductorId === pubId ||
    week.midweek.vidaCristiana.estudioBiblico.lectorId === pubId ||
    week.midweek.maestros.items.some(m => m.publisherId === pubId || m.assistantId === pubId) ||
    week.midweek.vidaCristiana.items.some(v => v.publisherId === pubId)
  ) {
    return true;
  }

  // Midweek Duties
  for (const ids of Object.values(week.midweek.duties)) {
    if (ids.includes(pubId)) return true;
  }

  // Weekend
  if (
    week.weekend.presidentId === pubId ||
    week.weekend.atalayaConductorId === pubId ||
    week.weekend.atalayaLectorId === pubId ||
    week.weekend.initialPrayerId === pubId ||
    week.weekend.finalPrayerId === pubId
  ) {
    return true;
  }

  // Weekend Duties
  for (const ids of Object.values(week.weekend.duties)) {
    if (ids.includes(pubId)) return true;
  }

  return false;
}
