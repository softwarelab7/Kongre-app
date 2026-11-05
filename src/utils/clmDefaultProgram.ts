// src/utils/clmDefaultProgram.ts
import type { ClmPrograma, ClmParte, WeekSchedule, Publisher } from '../types';
import { getOrganizedScheduleForWeek } from './organizedSync';

/**
 * Obtiene la fecha del lunes (YYYY-MM-DD) para cualquier fecha o string
 */
export function getMonday(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d.length === 10 ? d + 'T12:00:00' : d) : new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

/**
 * Plantilla inicial para generar las partes de una semana de reunión Vida y Ministerio
 * Enriquece automáticamente con datos del catálogo oficial y/o WeekSchedule de Kongre si están disponibles.
 */
export function createDefaultPrograma(
  semanaFecha: string,
  congregationId?: string | null,
  week?: WeekSchedule | null,
  publishers: Publisher[] = []
): ClmPrograma {
  const dateObj = new Date(semanaFecha.length === 10 ? semanaFecha + 'T12:00:00' : semanaFecha);
  const year = dateObj.getFullYear();
  const weekNum = Math.ceil(
    ((dateObj.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
  );

  // Intentar cargar datos del catálogo oficial para esta fecha
  const org = getOrganizedScheduleForWeek(week?.id || `week-${year}-${weekNum}`, semanaFecha);

  const tesorosDiscurso =
    week?.midweek?.tesoros?.discurso?.title ||
    org?.midweek?.tesoros?.discursoTitle ||
    'Tengamos un punto de vista equilibrado de la protección de Jehová (10 min)';
  const perlasTitulo =
    week?.midweek?.tesoros?.perlas?.title ||
    org?.midweek?.tesoros?.perlasTitle ||
    'Busquemos perlas escondidas (10 min)';
  const lecturaTitulo =
    week?.midweek?.tesoros?.lecturaBiblia?.title ||
    org?.midweek?.tesoros?.lecturaTitle ||
    'Lectura de la Biblia (4 min)';

  const song1 = week?.midweek?.songFirst || org?.midweek?.songFirst || 33;
  const song2 = week?.midweek?.songMiddle || org?.midweek?.songMiddle || 120;
  const song3 = week?.midweek?.songConclude || org?.midweek?.songConclude || 145;

  const pubMap = new Map<string, string>();
  publishers.forEach((p) => {
    pubMap.set(p.id, p.full_name || p.name);
    if (p.nid) pubMap.set(p.nid, p.full_name || p.name);
  });

  const getPubName = (id?: string | null) => (id ? pubMap.get(id) || '' : '');

  const partes: ClmParte[] = [
    // ── MARCO DE LA REUNIÓN ──
    {
      id: `part-pres-${semanaFecha}`,
      tipo: 'presidente',
      titulo: 'Presidente',
      duracion_min: 5,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
      asignado_nid: week?.midweek?.presidentId || null,
      asignado_nombre: getPubName(week?.midweek?.presidentId),
    },
    {
      id: `part-canto-1-${semanaFecha}`,
      tipo: 'canto',
      titulo: `Cántico ${song1}`,
      duracion_min: 5,
      seccion: 'marco',
      requiere_hermano: false,
      requiere_privilegio: false,
    },
    {
      id: `part-oracion-ap-${semanaFecha}`,
      tipo: 'oracion_apertura',
      titulo: 'Oración de apertura',
      duracion_min: 1,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
      asignado_nid: week?.midweek?.initialPrayerId || null,
      asignado_nombre: getPubName(week?.midweek?.initialPrayerId),
    },

    // ── TESOROS DE LA BIBLIA ──
    {
      id: `part-tes-disc-${semanaFecha}`,
      tipo: 'discurso_tesoros',
      titulo: tesorosDiscurso,
      duracion_min: 10,
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: true,
      asignado_nid: week?.midweek?.tesoros?.discurso?.publisherId || null,
      asignado_nombre: getPubName(week?.midweek?.tesoros?.discurso?.publisherId),
    },
    {
      id: `part-tes-perlas-${semanaFecha}`,
      tipo: 'busquemos_perlas',
      titulo: perlasTitulo,
      duracion_min: 10,
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: true,
      asignado_nid: week?.midweek?.tesoros?.perlas?.publisherId || null,
      asignado_nombre: getPubName(week?.midweek?.tesoros?.perlas?.publisherId),
    },
    {
      id: `part-tes-lectura-${semanaFecha}`,
      tipo: 'lectura_biblica',
      titulo: lecturaTitulo,
      duracion_min: 4,
      descripcion: week?.midweek?.bibleReading || org?.bibleReading || 'Lectura de la Biblia (th lección 2).',
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
      asignado_nid: week?.midweek?.tesoros?.lecturaBiblia?.publisherId || null,
      asignado_nombre: getPubName(week?.midweek?.tesoros?.lecturaBiblia?.publisherId),
      leccion_numero: week?.midweek?.tesoros?.lecturaBiblia?.lessonNumber || 2,
    },
  ];

  // ── SEAMOS MEJORES MAESTROS (Auditorio Principal) ──
  const studentItems = (week?.midweek?.maestros?.items || []).filter(
    (item) => item.type !== 'lectura_biblica' && !item.title.toLowerCase().includes('lectura de la biblia')
  );

  if (studentItems.length > 0) {
    const usedIds = new Set<string>(partes.map((p) => p.id));
    studentItems.forEach((item, index) => {
      const isAux = item.room === 'auxiliar';
      const fallbackId = `part-mae-${index + 1}-${semanaFecha}${isAux ? '-aux' : ''}`;
      const candidateId = item.id && !usedIds.has(item.id) ? item.id : fallbackId;
      usedIds.add(candidateId);
      partes.push({
        id: candidateId,
        tipo: (item.type as any) || 'empiece_conversaciones',
        titulo: item.title || `Asignación ${index + 1} (${item.timeMinutes || 3} min)`,
        duracion_min: item.timeMinutes || 3,
        descripcion: item.notes || `(th lección ${item.lessonNumber || index + 1})`,
        seccion: 'maestros',
        requiere_hermano: false,
        requiere_privilegio: false,
        es_clase_auxiliar: isAux,
        asignado_nid: item.publisherId || null,
        asignado_nombre: getPubName(item.publisherId),
        asignado_auxiliar_nid: item.assistantId || null,
        asignado_auxiliar_nombre: getPubName(item.assistantId),
        leccion_numero: item.lessonNumber || index + 1,
      });
    });
  } else {
    // Demostraciones predeterminadas del catálogo oficial
    const demos = org?.midweek?.demonstrations || [
      { title: 'Empiece conversaciones (2 min)', timeMinutes: 2 },
      { title: 'Haga revisitas (3 min)', timeMinutes: 3 },
      { title: 'Haga discípulos (5 min)', timeMinutes: 5 },
      { title: 'Explique sus creencias (3 min)', timeMinutes: 3 },
    ];

    demos.forEach((d, index) => {
      partes.push({
        id: `part-mae-${index + 1}-${semanaFecha}`,
        tipo: 'empiece_conversaciones',
        titulo: d.title,
        duracion_min: d.timeMinutes,
        descripcion: `(th lección ${index + 1}).`,
        seccion: 'maestros',
        requiere_hermano: false,
        requiere_privilegio: false,
        es_clase_auxiliar: false,
        leccion_numero: index + 1,
      });
    });
  }

  // ── CANTO INTERMEDIO ──
  partes.push({
    id: `part-canto-2-${semanaFecha}`,
    tipo: 'canto',
    titulo: `Cántico ${song2}`,
    duracion_min: 5,
    seccion: 'vida_cristiana',
    requiere_hermano: false,
    requiere_privilegio: false,
  });

  // ── NUESTRA VIDA CRISTIANA ──
  const rawVidaItems = week?.midweek?.vidaCristiana?.items || [];
  // Excluir cualquier estudio bíblico duplicado en los items regulares ya que tiene su bloque propio abajo
  const vidaItems = rawVidaItems.filter(
    (vi) =>
      vi.type !== 'estudio_biblico_grupo' &&
      vi.type !== 'lector_estudio' &&
      !vi.id?.includes('cbs') &&
      !vi.title?.toLowerCase().includes('estudio bíblico') &&
      !vi.title?.toLowerCase().includes('estudio biblico')
  );

  if (vidaItems.length > 0) {
    vidaItems.forEach((vi, idx) => {
      partes.push({
        id: vi.id || `part-vida-${idx + 1}-${semanaFecha}`,
        tipo: 'necesidades_congregacion',
        titulo: vi.title || `Nuestra Vida Cristiana (${vi.timeMinutes || 15} min)`,
        duracion_min: vi.timeMinutes || 15,
        seccion: 'vida_cristiana',
        requiere_hermano: true,
        requiere_privilegio: true,
        asignado_nid: vi.publisherId || null,
        asignado_nombre: getPubName(vi.publisherId),
      });
    });
  } else {
    partes.push({
      id: `part-vida-1-${semanaFecha}`,
      tipo: 'necesidades_congregacion',
      titulo: org?.midweek?.vidaCristiana?.[0]?.title || 'Nuestra Vida Cristiana (15 min)',
      duracion_min: org?.midweek?.vidaCristiana?.[0]?.timeMinutes || 15,
      seccion: 'vida_cristiana',
      requiere_hermano: true,
      requiere_privilegio: true,
    });
  }

  // Estudio bíblico de la congregación (conductor + lector)
  const cbsConductor = week?.midweek?.vidaCristiana?.estudioBiblico?.conductorId;
  const cbsLector = week?.midweek?.vidaCristiana?.estudioBiblico?.lectorId;

  partes.push({
    id: `part-vida-cbs-${semanaFecha}`,
    tipo: 'estudio_biblico_grupo',
    titulo: org?.midweek?.estudioBiblicoTitle || 'Estudio bíblico de la congregación (30 min)',
    duracion_min: 30,
    seccion: 'vida_cristiana',
    requiere_hermano: true,
    requiere_privilegio: true,
    asignado_nid: cbsConductor || null,
    asignado_nombre: getPubName(cbsConductor),
  });

  partes.push({
    id: `part-vida-lector-${semanaFecha}`,
    tipo: 'lector_estudio',
    titulo: 'Lector del estudio bíblico',
    duracion_min: 30,
    seccion: 'vida_cristiana',
    requiere_hermano: true,
    requiere_privilegio: false,
    asignado_nid: cbsLector || null,
    asignado_nombre: getPubName(cbsLector),
  });

  // ── CONCLUSIÓN ──
  partes.push({
    id: `part-canto-3-${semanaFecha}`,
    tipo: 'canto',
    titulo: `Cántico ${song3}`,
    duracion_min: 5,
    seccion: 'marco',
    requiere_hermano: false,
    requiere_privilegio: false,
  });
  partes.push({
    id: `part-oracion-cierre-${semanaFecha}`,
    tipo: 'oracion_cierre',
    titulo: 'Oración de conclusión',
    duracion_min: 3,
    seccion: 'marco',
    requiere_hermano: true,
    requiere_privilegio: true,
    asignado_nid: week?.midweek?.finalPrayerId || null,
    asignado_nombre: getPubName(week?.midweek?.finalPrayerId),
  });

  // ── SALA AUXILIAR (Solo si está explícitamente habilitada o tiene estudiantes/consejero) ──
  const hasAuxiliaryExplicit = Boolean(
    week?.midweek?.auxiliaryCounselorId ||
    week?.midweek?.tesoros?.lecturaBibliaAux?.publisherId ||
    week?.midweek?.maestros?.items?.some((i) => i.room === 'auxiliar')
  );

  if (hasAuxiliaryExplicit) {
    partes.push({
      id: `part-aux-cond-${semanaFecha}`,
      tipo: 'conductor_auxiliar',
      titulo: 'Consejero de la Sala Auxiliar',
      duracion_min: 30,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
      es_clase_auxiliar: true,
      asignado_nid: week?.midweek?.auxiliaryCounselorId || null,
      asignado_nombre: getPubName(week?.midweek?.auxiliaryCounselorId),
    });

    const auxLecturaPub = week?.midweek?.tesoros?.lecturaBibliaAux?.publisherId;
    if (auxLecturaPub) {
      partes.push({
        id: `part-aux-lect-${semanaFecha}`,
        tipo: 'lectura_biblica',
        titulo: `${lecturaTitulo} (Sala auxiliar)`,
        duracion_min: 4,
        descripcion: week?.midweek?.bibleReading || org?.bibleReading || 'Lectura de la Biblia (th lección 2).',
        seccion: 'tesoros',
        requiere_hermano: true,
        requiere_privilegio: false,
        es_clase_auxiliar: true,
        asignado_nid: auxLecturaPub,
        asignado_nombre: getPubName(auxLecturaPub),
        leccion_numero: 2,
      });
    }
  }

  return {
    id: `clm-${semanaFecha}`,
    semana_fecha: semanaFecha,
    anio: year,
    semana_num: weekNum,
    estado: 'borrador',
    partes,
    congregation_id: congregationId || null,
    lectura_semana: week?.midweek?.bibleReading || org?.bibleReading || 'JEREMÍAS 47, 48',
    rango_semana:
      org?.weekDateRange ||
      (week ? `Semana del ${week.weekStartDate} al ${week.weekEndDate}` : `Semana del ${semanaFecha}`),
    sala_auxiliar_habilitada: hasAuxiliaryExplicit,
  };
}
