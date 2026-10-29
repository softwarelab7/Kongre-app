// src/utils/clmBridge.ts
import type { ClmPrograma, ClmParte, WeekSchedule, Publisher, AssignmentItem } from '../types';
import { createDefaultPrograma } from './clmDefaultProgram';

/**
 * Busca un publicador por ID o NID
 */
function findPublisher(publishers: Publisher[], identifier?: string | null): Publisher | undefined {
  if (!identifier) return undefined;
  return publishers.find(p => (p.nid || p.id) === identifier || p.id === identifier || p.nid === identifier);
}

/**
 * Aplica los datos de una asignación CLM a un WeekSchedule oficial de Kongre,
 * permitiendo sincronización bidireccional total en tiempo real hacia Firestore.
 */
export function bridgeClmToWeek(
  clm: ClmPrograma,
  week: WeekSchedule,
  publishers: Publisher[]
): WeekSchedule {
  const updated: WeekSchedule = JSON.parse(JSON.stringify(week));

  // 1. Marco de la Reunión (Presidencia y Oraciones)
  const presPart = clm.partes.find(p => p.tipo === 'presidente' && !p.es_clase_auxiliar);
  if (presPart !== undefined) {
    updated.midweek.presidentId = presPart.asignado_nid || undefined;
  }

  const auxCounselorPart = clm.partes.find(p => p.tipo === 'conductor_auxiliar');
  if (auxCounselorPart !== undefined) {
    updated.midweek.auxiliaryCounselorId = auxCounselorPart.asignado_nid || undefined;
  }

  const initPrayerPart = clm.partes.find(p => p.tipo === 'oracion_apertura');
  if (initPrayerPart !== undefined) {
    updated.midweek.initialPrayerId = initPrayerPart.asignado_nid || undefined;
  }

  const finalPrayerPart = clm.partes.find(p => p.tipo === 'oracion_cierre');
  if (finalPrayerPart !== undefined) {
    updated.midweek.finalPrayerId = finalPrayerPart.asignado_nid || undefined;
  }

  // 2. Tesoros de la Biblia
  const discPart = clm.partes.find(p => p.tipo === 'discurso_tesoros');
  if (discPart && updated.midweek.tesoros?.discurso) {
    updated.midweek.tesoros.discurso.publisherId = discPart.asignado_nid || undefined;
  }

  const perlasPart = clm.partes.find(p => p.tipo === 'busquemos_perlas');
  if (perlasPart && updated.midweek.tesoros?.perlas) {
    updated.midweek.tesoros.perlas.publisherId = perlasPart.asignado_nid || undefined;
  }

  const lectMain = clm.partes.find(p => p.tipo === 'lectura_biblica' && !p.es_clase_auxiliar);
  if (lectMain && updated.midweek.tesoros?.lecturaBiblia) {
    updated.midweek.tesoros.lecturaBiblia.publisherId = lectMain.asignado_nid || undefined;
  }

  const lectAux = clm.partes.find(p => p.tipo === 'lectura_biblica' && p.es_clase_auxiliar);
  if (lectAux && updated.midweek.tesoros) {
    if (!updated.midweek.tesoros.lecturaBibliaAux) {
      updated.midweek.tesoros.lecturaBibliaAux = {
        id: `lect-aux-${week.id}`,
        title: 'Lectura de la Biblia (Sala Auxiliar)',
        type: 'vym_tesoros_lectura_aux',
        timeMinutes: 4,
        status: 'confirmada',
        room: 'auxiliar',
      };
    }
    if (updated.midweek.tesoros.lecturaBibliaAux) {
      updated.midweek.tesoros.lecturaBibliaAux.publisherId = lectAux.asignado_nid || undefined;
    }
  }

  // 3. Seamos Mejores Maestros
  const studentParts = clm.partes.filter(p => p.seccion === 'maestros');
  if (studentParts.length > 0 && updated.midweek.maestros) {
    const newItems: AssignmentItem[] = [];
    studentParts.forEach((sp, idx) => {
      const room = sp.es_clase_auxiliar ? 'auxiliar' : 'principal';
      // Intentar preservar item existente
      const existing = updated.midweek.maestros.items?.find(
        it => it.room === room && (it.type === sp.tipo || it.title === sp.titulo)
      ) || updated.midweek.maestros.items?.[idx];

      newItems.push({
        id: existing?.id || sp.id,
        title: sp.titulo,
        type: sp.tipo,
        timeMinutes: sp.duracion_min,
        publisherId: sp.asignado_nid || undefined,
        assistantId: sp.asignado_auxiliar_nid || undefined,
        room,
        lessonNumber: existing?.lessonNumber,
        status: sp.asignado_nid ? 'confirmada' : 'pendiente',
        notes: sp.notas || existing?.notes,
      });
    });
    updated.midweek.maestros.items = newItems;
  }

  // 4. Nuestra Vida Cristiana
  const estudioConductor = clm.partes.find(p => p.tipo === 'estudio_biblico_grupo');
  if (estudioConductor && updated.midweek.vidaCristiana?.estudioBiblico) {
    updated.midweek.vidaCristiana.estudioBiblico.conductorId = estudioConductor.asignado_nid || undefined;
  }

  const estudioLector = clm.partes.find(p => p.tipo === 'lector_estudio');
  if (estudioLector && updated.midweek.vidaCristiana?.estudioBiblico) {
    updated.midweek.vidaCristiana.estudioBiblico.lectorId = estudioLector.asignado_nid || undefined;
  }

  // Partes intermedias de Vida Cristiana
  const vidaItems = clm.partes.filter(
    p => p.seccion === 'vida_cristiana' &&
    p.tipo !== 'estudio_biblico_grupo' &&
    p.tipo !== 'lector_estudio'
  );

  if (vidaItems.length > 0 && updated.midweek.vidaCristiana?.items) {
    vidaItems.forEach((vp, idx) => {
      if (updated.midweek.vidaCristiana.items[idx]) {
        updated.midweek.vidaCristiana.items[idx].publisherId = vp.asignado_nid || undefined;
      }
    });
  }

  return updated;
}

/**
 * Genera o enriquece un ClmPrograma a partir del WeekSchedule oficial de la congregación,
 * asegurando que si ya existen asignaciones en Kongre, aparezcan de inmediato en la vista CLM.
 */
export function bridgeWeekToClm(
  week: WeekSchedule,
  existingClm: ClmPrograma | null,
  publishers: Publisher[]
): ClmPrograma {
  const semanaFecha = week.weekStartDate;
  const d = new Date(semanaFecha);
  const year = d.getFullYear();
  const weekNum = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);

  // Si no hay programa previo o sus partes están vacías, generamos la plantilla completa
  const basePrograma = (!existingClm?.partes || existingClm.partes.length === 0)
    ? createDefaultPrograma(semanaFecha, existingClm?.congregation_id || null, week, publishers)
    : null;

  // Copia del programa existente o de la plantilla base recién generada
  const partes: ClmParte[] = existingClm?.partes && existingClm.partes.length > 0
    ? JSON.parse(JSON.stringify(existingClm.partes))
    : (basePrograma?.partes ? JSON.parse(JSON.stringify(basePrograma.partes)) : []);

  const helperSet = (tipo: string, pubId?: string | null, esAuxiliar: boolean = false) => {
    if (!pubId) return;
    const pub = findPublisher(publishers, pubId);
    const pubName = pub?.full_name || pub?.name || '';
    const part = partes.find(p => p.tipo === tipo && (esAuxiliar ? p.es_clase_auxiliar : !p.es_clase_auxiliar));
    if (part) {
      part.asignado_nid = pubId;
      part.asignado_nombre = pubName;
    }
  };

  // Sincronizar títulos, cánticos y lectura oficial de la semana desde week
  if (week.midweek) {
    // 1. Cánticos oficiales
    const c1 = partes.find(p => p.id?.includes('canto-1') || (p.tipo === 'canto' && p.seccion === 'marco' && !p.id?.includes('canto-3')));
    if (c1 && week.midweek.songFirst) {
      c1.titulo = `Cántico ${week.midweek.songFirst}`;
    }

    const c2 = partes.find(p => p.id?.includes('canto-2') || (p.tipo === 'canto' && p.seccion === 'vida_cristiana'));
    if (c2 && week.midweek.songMiddle) {
      c2.titulo = `Cántico ${week.midweek.songMiddle}`;
    }

    const c3 = partes.find(p => p.id?.includes('canto-3') || (p.tipo === 'canto' && p.seccion === 'marco' && p !== c1));
    if (c3 && week.midweek.songConclude) {
      c3.titulo = `Cántico ${week.midweek.songConclude}`;
    }

    // 2. Tesoros de la Biblia
    if (week.midweek.tesoros) {
      const disc = partes.find(p => p.tipo === 'discurso_tesoros');
      if (disc && week.midweek.tesoros.discurso?.title) {
        disc.titulo = week.midweek.tesoros.discurso.title;
      }
      const perl = partes.find(p => p.tipo === 'busquemos_perlas');
      if (perl && week.midweek.tesoros.perlas?.title) {
        perl.titulo = week.midweek.tesoros.perlas.title;
      }
      const lect = partes.find(p => p.tipo === 'lectura_biblica' && !p.es_clase_auxiliar);
      if (lect && week.midweek.tesoros.lecturaBiblia?.title) {
        lect.titulo = week.midweek.tesoros.lecturaBiblia.title;
        if (week.midweek.bibleReading) {
          lect.descripcion = week.midweek.bibleReading;
        }
      }
    }
  }

  // Deduplicación estricta de partes (evita doble lectura de la biblia y doble estudio bíblico)
  let foundMainReading = false;
  let foundCbsGroup = false;
  const deduplicatedPartes = partes.filter(p => {
    // Excluir cualquier lectura de la biblia colocada por error en maestros
    if (p.seccion === 'maestros' && (p.tipo === 'lectura_biblica' || p.titulo.toLowerCase().includes('lectura de la biblia'))) {
      return false;
    }
    // Asegurar exactamente una sola lectura principal
    if (!p.es_clase_auxiliar && (p.tipo === 'lectura_biblica' || (p.seccion === 'tesoros' && p.titulo.toLowerCase().includes('lectura de la biblia')))) {
      if (foundMainReading) return false;
      foundMainReading = true;
    }
    // Deduplicar estudio bíblico de la congregación
    if (p.seccion === 'vida_cristiana' && (p.tipo === 'estudio_biblico_grupo' || p.id.includes('cbs') || p.titulo.toLowerCase().includes('estudio bíblico') || p.titulo.toLowerCase().includes('estudio biblico'))) {
      if (p.tipo !== 'lector_estudio') {
        if (foundCbsGroup) return false;
        foundCbsGroup = true;
      }
    }
    return true;
  });

  // Marco
  helperSet('presidente', week.midweek.presidentId, false);
  helperSet('conductor_auxiliar', week.midweek.auxiliaryCounselorId, false);
  helperSet('oracion_apertura', week.midweek.initialPrayerId, false);
  helperSet('oracion_cierre', week.midweek.finalPrayerId, false);

  // Tesoros
  helperSet('discurso_tesoros', week.midweek.tesoros.discurso.publisherId, false);
  helperSet('busquemos_perlas', week.midweek.tesoros.perlas.publisherId, false);
  helperSet('lectura_biblica', week.midweek.tesoros.lecturaBiblia.publisherId, false);
  if (week.midweek.tesoros.lecturaBibliaAux?.publisherId) {
    helperSet('lectura_biblica', week.midweek.tesoros.lecturaBibliaAux.publisherId, true);
  }

  // Maestros
  week.midweek.maestros.items.forEach((item, idx) => {
    const isAux = item.room === 'auxiliar';
    const pub = findPublisher(publishers, item.publisherId);
    const auxPub = findPublisher(publishers, item.assistantId);

    // Buscar parte correspondiente en CLM
    let target = deduplicatedPartes.filter(p => p.seccion === 'maestros' && (isAux ? p.es_clase_auxiliar : !p.es_clase_auxiliar))[idx];
    if (target) {
      if (item.title) {
        target.titulo = item.title;
      }
      if (item.publisherId) {
        target.asignado_nid = item.publisherId;
        target.asignado_nombre = pub?.full_name || pub?.name || '';
      }
      if (item.assistantId) {
        target.asignado_auxiliar_nid = item.assistantId;
        target.asignado_auxiliar_nombre = auxPub?.full_name || auxPub?.name || '';
      }
    }
  });

  // Vida Cristiana
  if (week.midweek.vidaCristiana?.items) {
    const regularVidaItems = week.midweek.vidaCristiana.items.filter(
      item => !item.id?.includes("cbs") && !item.title?.toLowerCase().includes("estudio b")
    );
    const clmVidaPartes = deduplicatedPartes.filter(
      p => p.seccion === "vida_cristiana" && p.tipo !== "canto" && p.tipo !== "estudio_biblico_grupo" && p.tipo !== "lector_estudio"
    );
    regularVidaItems.forEach((item, idx) => {
      const target = clmVidaPartes[idx];
      if (target && item.title) {
        target.titulo = item.title;
        if (item.publisherId) {
          target.asignado_nid = item.publisherId;
          const pub = findPublisher(publishers, item.publisherId);
          target.asignado_nombre = pub?.full_name || pub?.name || "";
        }
      }
    });

    const cbsItem = week.midweek.vidaCristiana.items.find(
      item => item.id?.includes("cbs") || item.title?.toLowerCase().includes("estudio b")
    );
    if (cbsItem && cbsItem.title) {
      const cbsPart = deduplicatedPartes.find(p => p.tipo === "estudio_biblico_grupo");
      if (cbsPart) {
        cbsPart.titulo = cbsItem.title;
      }
    }
  }

  helperSet('estudio_biblico_grupo', week.midweek.vidaCristiana.estudioBiblico.conductorId, false);
  helperSet('lector_estudio', week.midweek.vidaCristiana.estudioBiblico.lectorId, false);

  return {
    id: existingClm?.id || `clm-${semanaFecha}`,
    semana_fecha: semanaFecha,
    anio: year,
    semana_num: weekNum,
    estado: existingClm?.estado || 'borrador',
    partes: deduplicatedPartes.length > 0 ? deduplicatedPartes : (existingClm?.partes || []),
    congregation_id: existingClm?.congregation_id || null,
    lectura_semana: week.midweek.bibleReading || existingClm?.lectura_semana || '',
    rango_semana: existingClm?.rango_semana || `Semana del ${week.weekStartDate} al ${week.weekEndDate}`,
    sala_auxiliar_habilitada: existingClm?.sala_auxiliar_habilitada ?? basePrograma?.sala_auxiliar_habilitada ?? false,
  };
}
