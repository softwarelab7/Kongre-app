// utils/assignmentConflictChecker.ts
import type {
  ClmPrograma,
  WeekendPrograma,
  TurnoDeber,
  WeekSchedule,
  Publisher,
  OutgoingSpeakerAssignment,
} from '../types';

export interface AssignmentConflict {
  publisherIdentifier: string;
  semanaFecha: string;
  severity: 'STRICT_CONFLICT' | 'WARNING_SATURATION';
  module: 'VMC' | 'WEEKEND' | 'DUTIES' | 'ABSENCE';
  assignmentTitle: string;
  details: string;
}

export interface ConflictCheckContext {
  clmProgramas?: ClmPrograma[];
  weekendProgramas?: WeekendPrograma[];
  turnosDeberes?: TurnoDeber[];
  weeks?: WeekSchedule[];
  publishers?: Publisher[];
  outgoingSpeakers?: OutgoingSpeakerAssignment[];
}

/**
 * Analiza en tiempo real que ningún hermano tenga asignaciones incompatibles,
 * ausencias programadas o simultáneas en VMC, Fin de Semana, deberes de apoyo o salidas de orador.
 */
export function checkPublisherConflictsOnDate(
  publisherId: string,
  publisherName: string | undefined,
  semanaFecha: string,
  context: ConflictCheckContext,
  partIdToIgnore?: string
): { hasStrictConflict: boolean; conflicts: AssignmentConflict[] } {
  const conflicts: AssignmentConflict[] = [];
  const normalizedName = (publisherName || '').toLowerCase().trim();

  const isMatch = (idOrNid?: string | null, name?: string | null) => {
    if (idOrNid && (idOrNid === publisherId || idOrNid.trim() === publisherId.trim())) return true;
    if (name && normalizedName && name.toLowerCase().trim() === normalizedName) return true;
    return false;
  };

  // 0. VERIFICAR AUSENCIAS DEL PUBLICADOR (Vacaciones, Viajes, etc.)
  const pubObj = context.publishers?.find((p) => (p.nid || p.id) === publisherId || (normalizedName && (p.full_name || p.name).toLowerCase().trim() === normalizedName));
  if (pubObj?.absences && pubObj.absences.length > 0) {
    const monday = new Date(semanaFecha);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const activeAbsence = pubObj.absences.find((a) => {
      if (!a.startDate || !a.endDate) return false;
      const start = new Date(a.startDate);
      const end = new Date(a.endDate);
      return start <= sunday && end >= monday;
    });

    if (activeAbsence) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'STRICT_CONFLICT',
        module: 'ABSENCE',
        assignmentTitle: 'Ausencia Registrada',
        details: `Ausencia programada del ${activeAbsence.startDate} al ${activeAbsence.endDate}${activeAbsence.reason ? ` (${activeAbsence.reason})` : ''}.`,
      });
    }
  }

  // 1. VERIFICAR PARTES EN VMC (Reunión Entre Semana)
  const clm = context.clmProgramas?.find((p) => p.semana_fecha === semanaFecha);
  let tieneParteVmc = false;

  if (clm?.partes) {
    clm.partes.forEach((parte) => {
      if (partIdToIgnore && parte.id === partIdToIgnore) return;
      const isTitular = isMatch(parte.asignado_nid, parte.asignado_nombre);
      const isAyudante = isMatch(parte.asignado_auxiliar_nid, parte.asignado_auxiliar_nombre);

      if (isTitular || isAyudante) {
        tieneParteVmc = true;
        conflicts.push({
          publisherIdentifier: publisherId,
          semanaFecha,
          severity: 'STRICT_CONFLICT',
          module: 'VMC',
          assignmentTitle: parte.titulo,
          details: `Asignado en VMC como ${isTitular ? 'titular' : 'ayudante'} en "${parte.titulo}".`,
        });
      }
    });
  }

  // 2. VERIFICAR DEBERES DE APOYO (Sonido, Video, Micrófonos, Acomodadores)
  // A) Desde turnosDeberes explícitos
  const deberes = context.turnosDeberes?.filter(
    (t) => t.semana_fecha === semanaFecha && t.tipo_reunion === 'entre_semana'
  );
  if (deberes) {
    deberes.forEach((deber) => {
      if (isMatch(deber.asignado_nid, deber.asignado_nombre)) {
        if (tieneParteVmc) {
          conflicts.push({
            publisherIdentifier: publisherId,
            semanaFecha,
            severity: 'STRICT_CONFLICT',
            module: 'DUTIES',
            assignmentTitle: deber.titulo,
            details: `Cruce en misma reunión: Deber físico (${deber.titulo}) y parte en plataforma en VMC.`,
          });
        }
      }
    });
  }

  // B) Desde weeks de CongregationContext (Midweek Duties)
  const matchedWeek = context.weeks?.find((w) => w.weekStartDate === semanaFecha);
  if (matchedWeek?.midweek?.duties && tieneParteVmc) {
    Object.entries(matchedWeek.midweek.duties).forEach(([dutyKey, assignedIds]) => {
      if (Array.isArray(assignedIds) && assignedIds.some((id) => id === publisherId || (pubObj && id === pubObj.id))) {
        conflicts.push({
          publisherIdentifier: publisherId,
          semanaFecha,
          severity: 'STRICT_CONFLICT',
          module: 'DUTIES',
          assignmentTitle: `Deber: ${dutyKey}`,
          details: `Cruce en reunión: Asignado a deber (${dutyKey}) y parte en VMC al mismo tiempo.`,
        });
      }
    });
  }

  // 3. VERIFICAR REUNIÓN DE FIN DE SEMANA (Saturación y doble asignación semanal)
  // A) Desde weekendProgramas
  const weekendProg = context.weekendProgramas?.find((p) => p.semana_fecha === semanaFecha);
  if (weekendProg && tieneParteVmc) {
    const isPres = isMatch(weekendProg.presidente_nid, weekendProg.presidente_nombre);
    const isLec = isMatch(weekendProg.lector_atalaya_nid, weekendProg.lector_atalaya_nombre);
    const isOrador = weekendProg.orador_nombre && normalizedName && weekendProg.orador_nombre.toLowerCase() === normalizedName;

    if (isPres || isLec || isOrador) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: isPres ? 'Presidente FDS' : isLec ? 'Lector de La Atalaya' : 'Orador Público',
        details: `Saturación semanal: Intervención en VMC y también en el Fin de Semana.`,
      });
    }
  }

  // B) Desde weeks (MeetingWeekend)
  if (matchedWeek?.weekend && tieneParteVmc) {
    const wk = matchedWeek.weekend;
    if (isMatch(wk.presidentId)) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: 'Presidente Fin de Semana',
        details: 'Saturación semanal: Tiene parte en VMC y es Presidente del Fin de Semana.',
      });
    }
    if (isMatch(wk.atalayaConductorId)) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: 'Conductor de La Atalaya',
        details: 'Saturación semanal: Tiene parte en VMC y dirige el Estudio de La Atalaya.',
      });
    }
    if (isMatch(wk.atalayaLectorId)) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: 'Lector de La Atalaya',
        details: 'Saturación semanal: Tiene parte en VMC y es Lector de La Atalaya el domingo.',
      });
    }
    if (isMatch(wk.publicTalkSpeaker)) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: 'Discurso Público',
        details: 'Saturación semanal: Tiene parte en VMC y presenta el Discurso Público local.',
      });
    }
    if (isMatch(wk.hospitalityPublisherId)) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: 'Hospitalidad del Orador',
        details: 'El hermano atiende la hospitalidad del orador visitante este fin de semana.',
      });
    }
  }

  // 4. VERIFICAR SI SALE COMO ORADOR FUERA DE LA CONGREGACIÓN
  if (context.outgoingSpeakers && tieneParteVmc) {
    const monday = new Date(semanaFecha);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const outgoing = context.outgoingSpeakers.find((o) => {
      if (!isMatch(o.publisherId)) return false;
      const talkDate = new Date(o.date);
      return talkDate >= monday && talkDate <= sunday;
    });

    if (outgoing) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: `Orador en ${outgoing.destinationCongregation}`,
        details: `Saturación teocrática: Sale como Orador visitante a la congregación "${outgoing.destinationCongregation}".`,
      });
    }
  }

  return {
    hasStrictConflict: conflicts.some((c) => c.severity === 'STRICT_CONFLICT'),
    conflicts,
  };
}
