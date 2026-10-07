// utils/assignmentConflictChecker.ts
import type { ClmPrograma, WeekendPrograma, TurnoDeber } from '../types';

export interface AssignmentConflict {
  publisherIdentifier: string;
  semanaFecha: string;
  severity: 'STRICT_CONFLICT' | 'WARNING_SATURATION';
  module: 'VMC' | 'WEEKEND' | 'DUTIES';
  assignmentTitle: string;
  details: string;
}

/**
 * Conforme a la regla del proyecto, el sistema analiza en tiempo real que ningún
 * hermano tenga asignaciones incompatibles o simultáneas en VMC, el Fin de Semana
 * o en los deberes de apoyo (sonido, micrófonos, acomodadores).
 */
export function checkPublisherConflictsOnDate(
  publisherId: string,
  publisherName: string | undefined,
  semanaFecha: string,
  context: {
    clmProgramas?: ClmPrograma[];
    weekendProgramas?: WeekendPrograma[];
    turnosDeberes?: TurnoDeber[];
  },
  partIdToIgnore?: string
): { hasStrictConflict: boolean; conflicts: AssignmentConflict[] } {
  const conflicts: AssignmentConflict[] = [];

  // 1. Verificar partes de VMC (Reunión Entre Semana)
  const clm = context.clmProgramas?.find((p) => p.semana_fecha === semanaFecha);
  let tieneParteVmc = false;

  if (clm?.partes) {
    clm.partes.forEach((parte) => {
      if (partIdToIgnore && parte.id === partIdToIgnore) return;
      const match =
        parte.asignado_nid === publisherId ||
        (publisherName && parte.asignado_nombre === publisherName);
      if (match) {
        tieneParteVmc = true;
        conflicts.push({
          publisherIdentifier: publisherId,
          semanaFecha,
          severity: 'STRICT_CONFLICT',
          module: 'VMC',
          assignmentTitle: parte.titulo,
          details: `Asignado en VMC: "${parte.titulo}"`,
        });
      }
    });
  }

  // 2. Verificar Deberes de la Reunión Entre Semana (Acomodadores / Sonido / Video)
  const deberes = context.turnosDeberes?.filter(
    (t) => t.semana_fecha === semanaFecha && t.tipo_reunion === 'entre_semana'
  );
  if (deberes) {
    deberes.forEach((deber) => {
      const matchDeber =
        deber.asignado_nid === publisherId ||
        (publisherName && deber.asignado_nombre === publisherName);
      if (matchDeber) {
        // Cruce crítico: estar en plataforma y en sonido/micrófono al mismo tiempo
        if (tieneParteVmc) {
          conflicts.push({
            publisherIdentifier: publisherId,
            semanaFecha,
            severity: 'STRICT_CONFLICT',
            module: 'DUTIES',
            assignmentTitle: deber.titulo,
            details: `Cruce crítico: Asignado en deber físico (${deber.titulo}) y parte en plataforma en la misma reunión.`,
          });
        }
      }
    });
  }

  // 3. Verificar Reunión Fin de Semana (Saturación)
  const weekend = context.weekendProgramas?.find((p) => p.semana_fecha === semanaFecha);
  if (weekend && tieneParteVmc) {
    const isPresidentWeekend =
      weekend.presidente_nid === publisherId ||
      (publisherName && weekend.presidente_nombre === publisherName);
    const isLectorWeekend =
      weekend.lector_atalaya_nid === publisherId ||
      (publisherName && weekend.lector_atalaya_nombre === publisherName);
    const isOradorWeekend =
      weekend.orador_nombre &&
      publisherName &&
      weekend.orador_nombre.toLowerCase() === publisherName.toLowerCase();

    if (isPresidentWeekend || isLectorWeekend || isOradorWeekend) {
      conflicts.push({
        publisherIdentifier: publisherId,
        semanaFecha,
        severity: 'WARNING_SATURATION',
        module: 'WEEKEND',
        assignmentTitle: isPresidentWeekend
          ? 'Presidente FDS'
          : isLectorWeekend
          ? 'Lector de La Atalaya'
          : 'Discurso Público',
        details: `Sobrecarga semanal: El hermano tiene intervención en VMC y también en el Fin de Semana.`,
      });
    }
  }

  return {
    hasStrictConflict: conflicts.some((c) => c.severity === 'STRICT_CONFLICT'),
    conflicts,
  };
}
