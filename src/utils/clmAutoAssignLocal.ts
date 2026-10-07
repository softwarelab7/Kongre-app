// src/utils/clmAutoAssignLocal.ts
import type { Publisher, ClmPrograma, ClmParte, ClmHistorialItem } from '../types';

/**
 * Validación de Elegibilidad Teocrática conforme a las pautas oficiales
 * para asignaciones de la reunión Vida y Ministerio Cristianos (VMC).
 */
export function isPublisherEligibleForPart(
  p: Publisher,
  part: ClmParte,
  type: 'main' | 'assistant'
): boolean {
  // Soporte universal para modelo Publisher Kongre y modelo CLM
  const isActive = p.status ? p.status === 'active' : p.active !== false;
  if (!isActive) return false;

  const isMale = (p.gender as string) === 'male' || p.gender === 'hermano';
  const role =
    p.role ||
    (p.privilege === 'anciano'
      ? 'elder'
      : p.privilege === 'siervo_ministerial'
      ? 'servant'
      : 'publisher');

  // Mapeo seguro de asignaciones y privilegios
  const assignments = p.assignments || {
    chairman: p.roles?.vym_presidente,
    prayers: p.roles?.vym_oracion,
    talk: p.roles?.vym_tesoros_discurso,
    gems: p.roles?.vym_tesoros_perlas,
    reading: p.roles?.vym_tesoros_lectura,
    conversations: p.roles?.vym_maestros_titular,
    return_visits: p.roles?.vym_maestros_titular,
    disciples: p.roles?.vym_maestros_titular,
    bible_study: p.roles?.vym_estudio_conductor,
    reader_living: p.roles?.vym_estudio_lector,
    assistant_student: p.roles?.vym_maestros_ayudante,
  };

  if (type === 'main') {
    if (part.requiere_hermano && !isMale) return false;
    if (part.requiere_privilegio && !['elder', 'servant'].includes(role)) return false;

    switch (part.tipo) {
      case 'presidente':
        return assignments.chairman === true;
      case 'oracion_apertura':
      case 'oracion_cierre':
      case 'oracion_estudio':
        return assignments.prayers === true;
      case 'discurso_tesoros':
        return assignments.talk === true;
      case 'busquemos_perlas':
        return assignments.gems === true;
      case 'lectura_biblica':
        return assignments.reading === true;
      case 'empiece_conversaciones':
      case 'empiece_conversaciones_aux':
        return assignments.conversations === true;
      case 'haga_revisitas':
      case 'haga_revisitas_aux':
        return assignments.return_visits === true;
      case 'haga_discipulos':
        return assignments.disciples === true;
      case 'explique_sus_creencias':
      case 'discurso_estudiante':
        return true;
      case 'necesidades_congregacion':
      case 'estudio_biblico_grupo':
        return role === 'elder' && assignments.bible_study === true;
      case 'lector_estudio':
        return assignments.reader_living === true;
      case 'conductor_auxiliar':
        return role === 'elder';
      default:
        return true;
    }
  } else {
    // Ayudantes en demostraciones de estudiantes
    if (part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante') {
      return assignments.assistant_student === true;
    }
    return true;
  }
}

export interface AutoAsignarParams {
  plantillas: any[];
  publishers: Publisher[];
  historial: ClmHistorialItem[];
  semanaFecha: string;
  ocupadosEstaSemana?: string[];
}

export interface AutoAsignarResult {
  asignaciones: Array<{
    parte_id: string;
    tipo: string;
    asignado_nid: string;
    asignado_nombre: string;
  }>;
}

/**
 * Algoritmo 100% offline que distribuye las asignaciones evaluando historial
 * de semanas, estado activo, roles e incompatibilidades.
 * Soporta invocación por parámetros estructurados o pasando el objeto ClmPrograma directamente.
 */
export function autoAsignarLocal(params: AutoAsignarParams): AutoAsignarResult;
export function autoAsignarLocal(
  programa: ClmPrograma,
  publishers: Publisher[],
  historial?: ClmHistorialItem[],
  ocupadosEstaSemana?: string[]
): ClmPrograma;
export function autoAsignarLocal(
  arg1: AutoAsignarParams | ClmPrograma,
  arg2?: Publisher[],
  arg3?: ClmHistorialItem[],
  arg4?: string[]
): AutoAsignarResult | ClmPrograma {
  if (arg1 && 'plantillas' in arg1) {
    const { plantillas, publishers, historial = [], semanaFecha, ocupadosEstaSemana = [] } = arg1;
    const asignadosEstaSemana = new Set<string>(ocupadosEstaSemana);
    const asignaciones: Array<{
      parte_id: string;
      tipo: string;
      asignado_nid: string;
      asignado_nombre: string;
    }> = [];

    for (const plantilla of plantillas) {
      // 1. Filtrar candidatos aptos
      const candidatos = publishers.filter((p) => {
        const isActive = p.status ? p.status === 'active' : p.active !== false;
        if (!isActive) return false;
        const pId = p.id || p.nid;
        if (pId && asignadosEstaSemana.has(pId)) return false; // Evitar saturación

        const isMale = (p.gender as string) === 'male' || p.gender === 'hermano';
        if (plantilla.requiere_hermano && !isMale) return false;

        const role =
          p.role ||
          (p.privilege === 'anciano'
            ? 'elder'
            : p.privilege === 'siervo_ministerial'
            ? 'servant'
            : 'publisher');
        if (plantilla.requiere_privilegio && !['elder', 'servant'].includes(role)) return false;

        return true;
      });

      // 2. Ordenar por menor carga reciente (quien hace más semanas que no participa)
      candidatos.sort((a, b) => {
        const idA = a.id || a.nid;
        const idB = b.id || b.nid;
        const histA = (historial || []).filter((h) => h.publisher_nid === idA).length;
        const histB = (historial || []).filter((h) => h.publisher_nid === idB).length;
        return histA - histB;
      });

      const elegido = candidatos[0] || null;
      if (elegido) {
        const elegidoId = (elegido.id || elegido.nid)!;
        asignadosEstaSemana.add(elegidoId);
        const uuid =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        asignaciones.push({
          parte_id: uuid,
          tipo: plantilla.tipo,
          asignado_nid: elegidoId,
          asignado_nombre: elegido.full_name || elegido.name || '',
        });
      }
    }

    return { asignaciones };
  } else {
    // Modo ClmPrograma completo
    const programa = arg1 as ClmPrograma;
    const publishers = (arg2 || []) as Publisher[];
    const historial = (arg3 || []) as ClmHistorialItem[];
    const ocupadosEstaSemana = (arg4 || []) as string[];

    const updatedPartes: ClmParte[] = JSON.parse(JSON.stringify(programa.partes));
    const asignadosEstaSemana = new Set<string>(ocupadosEstaSemana);

    // Contar asignaciones previas existentes en el programa
    for (const parte of updatedPartes) {
      if (parte.asignado_nid) asignadosEstaSemana.add(parte.asignado_nid);
      if (parte.asignado_auxiliar_nid) asignadosEstaSemana.add(parte.asignado_auxiliar_nid);
    }

    // 1. Asignar titulares para partes no asignadas
    for (const parte of updatedPartes) {
      if (!parte.asignado_nid) {
        const eligible = publishers.filter((p) => {
          const pId = p.nid || p.id;
          if (pId && asignadosEstaSemana.has(pId)) return false;
          return isPublisherEligibleForPart(p, parte, 'main');
        });

        if (eligible.length > 0) {
          // Ordenar por menor historial reciente
          eligible.sort((a, b) => {
            const idA = a.nid || a.id;
            const idB = b.nid || b.id;
            const histA = historial.filter((h) => h.publisher_nid === idA).length;
            const histB = historial.filter((h) => h.publisher_nid === idB).length;
            return histA - histB;
          });

          const chosen = eligible[0];
          const chosenId = chosen.nid || chosen.id;
          const chosenName = chosen.full_name || chosen.name;

          parte.asignado_nid = chosenId;
          parte.asignado_nombre = chosenName;
          if (chosenId) asignadosEstaSemana.add(chosenId);
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
          if (pId && asignadosEstaSemana.has(pId)) return false;
          return isPublisherEligibleForPart(p, parte, 'assistant');
        });

        if (eligibleAssistants.length > 0) {
          eligibleAssistants.sort((a, b) => {
            const idA = a.nid || a.id;
            const idB = b.nid || b.id;
            const histA = historial.filter((h) => h.publisher_nid === idA).length;
            const histB = historial.filter((h) => h.publisher_nid === idB).length;
            return histA - histB;
          });

          const chosenAss = eligibleAssistants[0];
          const chosenAssId = chosenAss.nid || chosenAss.id;
          const chosenAssName = chosenAss.full_name || chosenAss.name;

          parte.asignado_auxiliar_nid = chosenAssId;
          parte.asignado_auxiliar_nombre = chosenAssName;
          if (chosenAssId) asignadosEstaSemana.add(chosenAssId);
        }
      }
    }

    return {
      ...programa,
      partes: updatedPartes,
      generado_por: 'manual',
    };
  }
}
