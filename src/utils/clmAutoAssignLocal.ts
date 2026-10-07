// src/utils/clmAutoAssignLocal.ts
import type { Publisher, ClmPrograma, ClmParte } from '../types';
import { isPublisherEligibleForPart } from '../components/ClmScheduleView';

/**
 * Algoritmo de auto-asignación local para el programa de la reunión Vida y Ministerio Cristianos (VMC).
 * Respeta la elegibilidad teocrática, balancea la carga entre publicadores activos
 * y evita sobreasignar a un mismo hermano en múltiples partes de la misma reunión cuando es posible.
 */
export function autoAsignarLocal(programa: ClmPrograma, publishers: Publisher[]): ClmPrograma {
  const updatedPartes: ClmParte[] = JSON.parse(JSON.stringify(programa.partes));

  // Mapa de conteo de asignaciones en esta misma reunión para balancear la carga
  const assignmentCounts = new Map<string, number>();

  // Contar asignaciones previas existentes
  for (const parte of updatedPartes) {
    if (parte.asignado_nid) {
      assignmentCounts.set(parte.asignado_nid, (assignmentCounts.get(parte.asignado_nid) || 0) + 1);
    }
    if (parte.asignado_auxiliar_nid) {
      assignmentCounts.set(
        parte.asignado_auxiliar_nid,
        (assignmentCounts.get(parte.asignado_auxiliar_nid) || 0) + 1
      );
    }
  }

  // 1. Asignar titulares para partes no asignadas
  for (const parte of updatedPartes) {
    if (!parte.asignado_nid) {
      const eligible = publishers.filter((p) => isPublisherEligibleForPart(p, parte, 'main'));

      if (eligible.length > 0) {
        // Ordenar por menor cantidad de asignaciones en esta reunión
        eligible.sort((a, b) => {
          const idA = a.nid || a.id;
          const idB = b.nid || b.id;
          const countA = assignmentCounts.get(idA) || 0;
          const countB = assignmentCounts.get(idB) || 0;
          return countA - countB;
        });

        const chosen = eligible[0];
        const chosenId = chosen.nid || chosen.id;
        const chosenName = chosen.full_name || chosen.name;

        parte.asignado_nid = chosenId;
        parte.asignado_nombre = chosenName;
        assignmentCounts.set(chosenId, (assignmentCounts.get(chosenId) || 0) + 1);
      }
    }

    // 2. Asignar ayudantes para demostraciones de estudiantes
    const needsAssistant =
      parte.seccion === 'maestros' &&
      parte.tipo !== 'discurso_estudiante' &&
      parte.tipo !== 'lectura_biblica';

    if (needsAssistant && !parte.asignado_auxiliar_nid) {
      const eligibleAssistants = publishers.filter((p) => {
        const pId = p.nid || p.id;
        if (pId === parte.asignado_nid) return false; // No puede ser ayudante de sí mismo
        return isPublisherEligibleForPart(p, parte, 'assistant');
      });

      if (eligibleAssistants.length > 0) {
        eligibleAssistants.sort((a, b) => {
          const idA = a.nid || a.id;
          const idB = b.nid || b.id;
          const countA = assignmentCounts.get(idA) || 0;
          const countB = assignmentCounts.get(idB) || 0;
          return countA - countB;
        });

        const chosenAss = eligibleAssistants[0];
        const chosenAssId = chosenAss.nid || chosenAss.id;
        const chosenAssName = chosenAss.full_name || chosenAss.name;

        parte.asignado_auxiliar_nid = chosenAssId;
        parte.asignado_auxiliar_nombre = chosenAssName;
        assignmentCounts.set(chosenAssId, (assignmentCounts.get(chosenAssId) || 0) + 1);
      }
    }
  }

  return {
    ...programa,
    partes: updatedPartes,
    generado_por: 'manual',
  };
}
