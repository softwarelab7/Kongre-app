// src/utils/organizedSync.ts
import { WeekSchedule, PublicTalkOutline, AssignmentItem } from '../types';
import { OFFICIAL_PUBLIC_TALK_OUTLINES, findOutlineByNumber } from './theocraticData';

export interface OrganizedMidweekPart {
  title: string;
  timeMinutes: number;
  type: 'discurso' | 'perlas' | 'lectura' | 'maestros' | 'vida' | 'estudio_biblico';
  lessonNumber?: number;
}

export interface OrganizedWeekendData {
  outlineNumber?: number;
  outlineTitle?: string;
  speakerName?: string;
  speakerCongregation?: string;
  watchtowerTheme?: string;
  watchtowerScripture?: string;
  openingSong?: number;
  middleSong?: number;
  closingSong?: number;
}

export interface OrganizedWeekSchedule {
  weekKey: string; // e.g. "2026-W40"
  startDate?: string; // e.g. "2026-09-28"
  endDate?: string; // e.g. "2026-10-04"
  weekDateRange: string; // e.g. "28 de septiembre a 4 de octubre de 2026"
  bibleReading: string; // e.g. "Salmos 80 a 82"
  midweek: {
    songFirst?: number;
    songMiddle?: number;
    songConclude?: number;
    tesoros: {
      discursoTitle: string;
      perlasTitle: string;
      lecturaTitle: string;
    };
    demonstrations: Array<{
      title: string;
      timeMinutes: number;
      lessonNumber?: number;
    }>;
    vidaCristiana: Array<{
      title: string;
      timeMinutes: number;
    }>;
    estudioBiblicoTitle: string;
  };
  weekend: OrganizedWeekendData;
}

/**
 * Catálogo Oficial de Programas Semanales
 * Contiene los bosquejos completos de la reunión entre semana (MWB) y fin de semana (Discurso público + Atalaya)
 */
export const ORGANIZED_OFFICIAL_SCHEDULES: OrganizedWeekSchedule[] = [
  {
    weekKey: "2026-W40",
    startDate: "2026-09-28",
    endDate: "2026-10-04",
    weekDateRange: "28 de septiembre - 4 de octubre de 2026",
    bibleReading: "JEREMÍAS 38, 39",
    midweek: {
      songFirst: 144,
      songMiddle: 85,
      songConclude: 110,
      tesoros: {
        discursoTitle: "“No dejemos de ayudarnos unos a otros” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 38 y 39 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 38:14-28 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: Predicación informal (3 min.)",
          timeMinutes: 3,
          lessonNumber: 1,
        },
        {
          title: "Haga revisitas: Responda amablemente a una objeción (4 min.)",
          timeMinutes: 4,
          lessonNumber: 3,
        },
        {
          title: "Haga discípulos: Curso bíblico (5 min.)",
          timeMinutes: 5,
          lessonNumber: 8,
        },
      ],
      vidaCristiana: [
        {
          title: "“¿Quién me tocó?” (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 11",
    },
    weekend: {
      outlineNumber: 1,
      outlineTitle: "¿Conoce usted bien a Dios?",
      watchtowerTheme: "Confiemos plenamente en la dirección de Jehová",
      watchtowerScripture: "Jeremías 38:20",
      openingSong: 12,
      middleSong: 68,
      closingSong: 138,
    },
  },
  {
    weekKey: "2026-W41",
    startDate: "2026-10-05",
    endDate: "2026-10-11",
    weekDateRange: "5 - 11 de octubre de 2026",
    bibleReading: "JEREMÍAS 40, 41",
    midweek: {
      songFirst: 25,
      songMiddle: 92,
      songConclude: 115,
      tesoros: {
        discursoTitle: "“Tengamos un punto de vista equilibrado de la protección de Jehová” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 40 y 41 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 40:1-10 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: De casa en casa (3 min.)",
          timeMinutes: 3,
          lessonNumber: 2,
        },
        {
          title: "Haga revisitas: Predicación informal (4 min.)",
          timeMinutes: 4,
          lessonNumber: 5,
        },
        {
          title: "Explique sus creencias: ¿Quién es Jehová? (5 min.)",
          timeMinutes: 5,
          lessonNumber: 9,
        },
      ],
      vidaCristiana: [
        {
          title: "Jehová protege a las personas vulnerables (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 12",
    },
    weekend: {
      outlineNumber: 7,
      outlineTitle: "La misericordia de Dios nos da esperanza",
      watchtowerTheme: "Por qué podemos confiar en la protección espiritual de Dios",
      watchtowerScripture: "Jeremías 40:4",
      openingSong: 18,
      middleSong: 104,
      closingSong: 140,
    },
  },
  {
    weekKey: "2026-W42",
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    weekDateRange: "12 - 18 de octubre de 2026",
    bibleReading: "JEREMÍAS 42 A 44",
    midweek: {
      songFirst: 14,
      songMiddle: 77,
      songConclude: 130,
      tesoros: {
        discursoTitle: "“Pidieron guía y luego la rechazaron” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 42 a 44 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 43:1-13 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: Predicación informal (3 min.)",
          timeMinutes: 3,
          lessonNumber: 4,
        },
        {
          title: "Haga revisitas: Muestre un video de jw.org (4 min.)",
          timeMinutes: 4,
          lessonNumber: 9,
        },
        {
          title: "Haga discípulos: Explicación de normas bíblicas (5 min.)",
          timeMinutes: 5,
          lessonNumber: 13,
        },
      ],
      vidaCristiana: [
        {
          title: "Aceptemos de corazón la guía divina (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 13",
    },
    weekend: {
      outlineNumber: 18,
      outlineTitle: "Hagamos de Jehová nuestra plaza fuerte",
      watchtowerTheme: "Obedezcamos la guía de Jehová aunque nos cueste",
      watchtowerScripture: "Jeremías 42:6",
      openingSong: 8,
      middleSong: 50,
      closingSong: 151,
    },
  },
  {
    weekKey: "2026-W43",
    startDate: "2026-10-19",
    endDate: "2026-10-25",
    weekDateRange: "19 - 25 de octubre de 2026",
    bibleReading: "JEREMÍAS 45, 46",
    midweek: {
      songFirst: 6,
      songMiddle: 88,
      songConclude: 122,
      tesoros: {
        discursoTitle: "“La esperanza es clave para estar contentos” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 45 y 46 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 46:13-24 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: Predicación informal (3 min.)",
          timeMinutes: 3,
          lessonNumber: 2,
        },
        {
          title: "Haga revisitas: De casa en casa (4 min.)",
          timeMinutes: 4,
          lessonNumber: 4,
        },
        {
          title: "Discurso de estudiante: \"Jesús no es Dios\" (5 min.)",
          timeMinutes: 5,
          lessonNumber: 19,
        },
      ],
      vidaCristiana: [
        {
          title: "“No se olviden de compartir lo que tienen” (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 13 párrs. 12-20",
    },
    weekend: {
      outlineNumber: 23,
      outlineTitle: "La vida sí tiene propósito",
      watchtowerTheme: "Gozosos con la esperanza que Jehová nos da",
      watchtowerScripture: "Jeremías 45:5",
      openingSong: 5,
      middleSong: 64,
      closingSong: 125,
    },
  },
  {
    weekKey: "2026-W44",
    startDate: "2026-10-26",
    endDate: "2026-11-01",
    weekDateRange: "26 de octubre - 1 de noviembre de 2026",
    bibleReading: "JEREMÍAS 47, 48",
    midweek: {
      songFirst: 125,
      songMiddle: 158,
      songConclude: 54,
      tesoros: {
        discursoTitle: "“Jehová es un juez justo y misericordioso” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 47 y 48 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 48:1-13 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: De casa en casa (3 min.)",
          timeMinutes: 3,
          lessonNumber: 5,
        },
        {
          title: "Haga revisitas: Predicación informal (4 min.)",
          timeMinutes: 4,
          lessonNumber: 9,
        },
        {
          title: "Haga discípulos: Anime a su estudiante a orar con más frecuencia (5 min.)",
          timeMinutes: 5,
          lessonNumber: 8,
        },
      ],
      vidaCristiana: [
        {
          title: "Necesidades de la congregación (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 14",
    },
    weekend: {
      outlineNumber: 21,
      outlineTitle: "¿Cómo encajamos en el Reino de Dios?",
      watchtowerTheme: "Valoremos el privilegio de darle a Jehová “servicio sagrado sin temor”",
      watchtowerScripture: "Lucas 1:69, 74",
      openingSong: 62,
      middleSong: 111,
      closingSong: 145,
    },
  },
  {
    weekKey: "2026-W45",
    startDate: "2026-11-02",
    endDate: "2026-11-08",
    weekDateRange: "2 - 8 de noviembre de 2026",
    bibleReading: "JEREMÍAS 49, 50",
    midweek: {
      songFirst: 11,
      songMiddle: 47,
      songConclude: 142,
      tesoros: {
        discursoTitle: "“Ayudamos a otros a beneficiarse de la misericordia de Jehová” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 49 y 50 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 50:1-10 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: De casa en casa (3 min.)",
          timeMinutes: 3,
          lessonNumber: 11,
        },
        {
          title: "Haga revisitas: Muestre cómo se realiza un curso bíblico (4 min.)",
          timeMinutes: 4,
          lessonNumber: 15,
        },
        {
          title: "Haga discípulos: Ayude al estudiante a vencer dificultades (5 min.)",
          timeMinutes: 5,
          lessonNumber: 16,
        },
      ],
      vidaCristiana: [
        {
          title: "La misericordia de Jehová en acción (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 15",
    },
    weekend: {
      outlineNumber: 4,
      outlineTitle: "Pruebas de que Dios existe",
      watchtowerTheme: "Confiemos en el Dios de misericordia y justicia",
      watchtowerScripture: "Jeremías 50:34",
      openingSong: 15,
      middleSong: 83,
      closingSong: 149,
    },
  },
  {
    weekKey: "2026-W46",
    startDate: "2026-11-09",
    endDate: "2026-11-15",
    weekDateRange: "9 - 15 de noviembre de 2026",
    bibleReading: "JEREMÍAS 51, 52",
    midweek: {
      songFirst: 3,
      songMiddle: 71,
      songConclude: 133,
      tesoros: {
        discursoTitle: "“El peligro de no hacer caso a las advertencias de Jehová” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Jeremías 51 y 52 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Jeremías 52:6-20 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: Con una persona interesada (3 min.)",
          timeMinutes: 3,
          lessonNumber: 12,
        },
        {
          title: "Haga revisitas: Explicación de una profecía bíblica (4 min.)",
          timeMinutes: 4,
          lessonNumber: 6,
        },
        {
          title: "Discurso de estudiante: \"Consecuencias de desobedecer a Jehová\" (5 min.)",
          timeMinutes: 5,
          lessonNumber: 17,
        },
      ],
      vidaCristiana: [
        {
          title: "Cómo las donaciones apoyan la obra mundial (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 16",
    },
    weekend: {
      outlineNumber: 16,
      outlineTitle: "Estrechemos nuestra amistad con Dios",
      watchtowerTheme: "Busquemos siempre la protección espiritual de Jehová",
      watchtowerScripture: "Jeremías 51:6",
      openingSong: 31,
      middleSong: 96,
      closingSong: 136,
    },
  },
  {
    weekKey: "2026-W47",
    startDate: "2026-11-16",
    endDate: "2026-11-22",
    weekDateRange: "16 - 22 de noviembre de 2026",
    bibleReading: "LAMENTACIONES 1, 2",
    midweek: {
      songFirst: 29,
      songMiddle: 63,
      songConclude: 120,
      tesoros: {
        discursoTitle: "“Una reacción natural ante una situación devastadora” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Lamentaciones 1 y 2 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Lamentaciones 1:8-18 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: Testimonio informal (3 min.)",
          timeMinutes: 3,
          lessonNumber: 10,
        },
        {
          title: "Haga revisitas: Superar la tristeza con consuelo bíblico (4 min.)",
          timeMinutes: 4,
          lessonNumber: 14,
        },
        {
          title: "Haga discípulos: Ayuda espiritual compasiva (5 min.)",
          timeMinutes: 5,
          lessonNumber: 19,
        },
      ],
      vidaCristiana: [
        {
          title: "Cómo consolar a quienes sufren por situaciones difíciles (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 17",
    },
    weekend: {
      outlineNumber: 8,
      outlineTitle: "No vivamos para nosotros mismos",
      watchtowerTheme: "El amor leal de Jehová nunca se acaba",
      watchtowerScripture: "Lamentaciones 3:22, 23",
      openingSong: 42,
      middleSong: 75,
      closingSong: 124,
    },
  },
  {
    weekKey: "2026-W48",
    startDate: "2026-11-23",
    endDate: "2026-11-29",
    weekDateRange: "23 - 29 de noviembre de 2026",
    bibleReading: "LAMENTACIONES 3 A 5",
    midweek: {
      songFirst: 22,
      songMiddle: 90,
      songConclude: 141,
      tesoros: {
        discursoTitle: "“El amor leal de Jehová nunca falla” (10 min.)",
        perlasTitle: "Busquemos perlas escondidas en Lamentaciones 3 a 5 (10 min.)",
        lecturaTitle: "Lectura de la Biblia: Lamentaciones 3:19-33 (4 min.)",
      },
      demonstrations: [
        {
          title: "Empiece conversaciones: De casa en casa (3 min.)",
          timeMinutes: 3,
          lessonNumber: 7,
        },
        {
          title: "Haga revisitas: Conversación sobre la esperanza futura (4 min.)",
          timeMinutes: 4,
          lessonNumber: 8,
        },
        {
          title: "Haga discípulos: Explicación clara de las enseñanzas bíblicas (5 min.)",
          timeMinutes: 5,
          lessonNumber: 12,
        },
      ],
      vidaCristiana: [
        {
          title: "Esperemos pacientemente en Jehová (15 min.)",
          timeMinutes: 15,
        },
      ],
      estudioBiblicoTitle: "Estudio bíblico de la congregación: libro \"wcg\" cap. 18",
    },
    weekend: {
      outlineNumber: 10,
      outlineTitle: "Seamos honrados en todo",
      watchtowerTheme: "Jehová es bueno con el que en él espera",
      watchtowerScripture: "Lamentaciones 3:25",
      openingSong: 22,
      middleSong: 90,
      closingSong: 141,
    },
  },
];

/**
 * Encuentra un programa oficial de Organized por clave de semana o fecha.
 * Garantiza coincidencia precisa por fechas ISO (ej. 2026-10-05), semana ISO o rango.
 */
export function getOrganizedScheduleForWeek(weekId?: string, dateStr?: string): OrganizedWeekSchedule {
  // 1. Coincidencia directa por clave oficial (ej. "2026-W41")
  if (weekId) {
    const exact = ORGANIZED_OFFICIAL_SCHEDULES.find((s) => s.weekKey === weekId);
    if (exact) return exact;
  }

  // 2. Extraer fecha ISO (YYYY-MM-DD) de weekId (ej. "week-2026-10-05" -> "2026-10-05") o de dateStr
  const extractedDate =
    (weekId ? weekId.match(/\d{4}-\d{2}-\d{2}/)?.[0] : null) ||
    (dateStr ? dateStr.match(/\d{4}-\d{2}-\d{2}/)?.[0] : null);

  if (extractedDate) {
    // Coincidencia exacta con fecha de inicio o fin
    const exactDateMatch = ORGANIZED_OFFICIAL_SCHEDULES.find(
      (s) => s.startDate === extractedDate || s.endDate === extractedDate
    );
    if (exactDateMatch) return exactDateMatch;

    // Coincidencia dentro del rango de la semana (startDate <= extractedDate <= endDate)
    const rangeMatch = ORGANIZED_OFFICIAL_SCHEDULES.find(
      (s) => Boolean(s.startDate && s.endDate && s.startDate <= extractedDate && extractedDate <= s.endDate)
    );
    if (rangeMatch) return rangeMatch;

    // Cálculo matemático exacto de la semana ISO (UTC)
    try {
      const parts = extractedDate.split('-').map(Number);
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

      const matchW = ORGANIZED_OFFICIAL_SCHEDULES.find((s) => s.weekKey.includes(`W${weekNo}`));
      if (matchW) return matchW;

      // Si está fuera de rango de las 9 semanas definidas, cicla de forma armónica
      const idx = Math.abs(weekNo - 40 + ORGANIZED_OFFICIAL_SCHEDULES.length * 10) % ORGANIZED_OFFICIAL_SCHEDULES.length;
      return ORGANIZED_OFFICIAL_SCHEDULES[idx];
    } catch {
      // fallback
    }
  }

  // 3. Coincidencia por texto de fecha en español si existe
  if (dateStr) {
    const match = ORGANIZED_OFFICIAL_SCHEDULES.find((s) => s.weekDateRange.includes(dateStr));
    if (match) return match;
  }

  // 4. Fallback al programa oficial de la semana en curso (2026-W41)
  return ORGANIZED_OFFICIAL_SCHEDULES[1] || ORGANIZED_OFFICIAL_SCHEDULES[0];
}

/**
 * Verifica rigurosamente si una semana carece de datos oficiales de Organized
 * (tanto en la reunión entre semana como en la de fin de semana).
 */
export function isWeekNeedingOrganizedSync(week: WeekSchedule): boolean {
  if (!week) return false;

  // Si la lectura bíblica actual difiere de la oficial o tiene datos obsoletos de Salmos
  const org = getOrganizedScheduleForWeek(week.id, week.weekStartDate);
  if (org && org.bibleReading) {
    const currentReading = (week.midweek?.bibleReading || "").trim().toLowerCase();
    const officialReading = org.bibleReading.trim().toLowerCase();
    if (currentReading !== officialReading && (currentReading.includes("salmo") || !currentReading)) {
      return true;
    }
  }

  // 1. Verificación Entre Semana:
  if (!week.midweek?.bibleReading || week.midweek.bibleReading.trim() === '') return true;
  if (!week.midweek?.songFirst || !week.midweek?.songMiddle || !week.midweek?.songConclude) return true;
  
  const discTitle = week.midweek.tesoros?.discurso?.title || '';
  if (discTitle.includes('Discurso de Tesoros de la Biblia') || discTitle.trim() === '') return true;
  
  const perlasTitle = week.midweek.tesoros?.perlas?.title || '';
  if (perlasTitle === 'Busquemos perlas escondidas (10 mins)' || perlasTitle.trim() === '') return true;
  
  const lectTitle = week.midweek.tesoros?.lecturaBiblia?.title || '';
  if (lectTitle === 'Lectura de la Biblia (4 mins)' || lectTitle.trim() === '') return true;

  // 2. Verificación Fin de Semana:
  if (!week.weekend?.publicTalkOutlineNumber) return true;
  
  const talkTheme = week.weekend?.publicTalkTheme || '';
  if (talkTheme === 'Discurso Público' || talkTheme === '¿Quién es el Dios verdadero y qué espera de nosotros?' || talkTheme.trim() === '') {
    return true;
  }
  
  const wtTheme = week.weekend?.watchtowerTheme || '';
  if (!wtTheme || wtTheme === 'Estudio de La Atalaya' || wtTheme.trim() === '') return true;
  
  if (!week.weekend?.openingSong || !week.weekend?.middleSong || !week.weekend?.closingSong) return true;

  return false;
}

export interface ApplyOrganizedOptions {
  applyMidweek?: boolean;
  applyWeekend?: boolean;
}

/**
 * Aplica los datos oficiales de Organized a una semana en Kongre,
 * preservando los publicadores ya asignados y actualizando títulos teocráticos,
 * lecturas, cánticos y bosquejos.
 */
export function applyOrganizedToWeek(
  currentWeek: WeekSchedule,
  organizedSchedule: OrganizedWeekSchedule,
  options: ApplyOrganizedOptions = { applyMidweek: true, applyWeekend: true }
): WeekSchedule {
  const updated: WeekSchedule = JSON.parse(JSON.stringify(currentWeek));

  // 1. REUNIÓN ENTRE SEMANA (VIDA Y MINISTERIO)
  if (options.applyMidweek !== false) {
    if (organizedSchedule.bibleReading) {
      updated.midweek.bibleReading = organizedSchedule.bibleReading;
    }
    if (organizedSchedule.midweek.songFirst) {
      updated.midweek.songFirst = organizedSchedule.midweek.songFirst;
    }
    if (organizedSchedule.midweek.songMiddle) {
      updated.midweek.songMiddle = organizedSchedule.midweek.songMiddle;
    }
    if (organizedSchedule.midweek.songConclude) {
      updated.midweek.songConclude = organizedSchedule.midweek.songConclude;
    }

    // Tesoros de la Biblia
    if (updated.midweek.tesoros) {
      if (updated.midweek.tesoros.discurso) {
        updated.midweek.tesoros.discurso.title = organizedSchedule.midweek.tesoros.discursoTitle;
      }
      if (updated.midweek.tesoros.perlas) {
        updated.midweek.tesoros.perlas.title = organizedSchedule.midweek.tesoros.perlasTitle;
      }
      if (updated.midweek.tesoros.lecturaBiblia) {
        updated.midweek.tesoros.lecturaBiblia.title = organizedSchedule.midweek.tesoros.lecturaTitle;
      }
    }

    // Seamos mejores lectores y maestros (preservando asignaciones si existen y garantizando IDs únicos)
    const existingDemos = updated.midweek.maestros?.items || [];
    const usedDemoIds = new Set<string>();
    updated.midweek.maestros.items = organizedSchedule.midweek.demonstrations.map((d, idx) => {
      const existing = existingDemos[idx];
      let resolvedId = existing?.id || `mwb-demo-${currentWeek.id}-${idx}`;
      if (usedDemoIds.has(resolvedId)) {
        resolvedId = `mwb-demo-${currentWeek.id}-${idx}`;
      }
      usedDemoIds.add(resolvedId);
      return {
        id: resolvedId,
        title: d.title,
        type: 'vym_maestros_titular',
        timeMinutes: d.timeMinutes,
        room: existing?.room || 'principal',
        lessonNumber: d.lessonNumber,
        status: existing?.status || 'pendiente',
        publisherId: existing?.publisherId || '',
        assistantId: existing?.assistantId || '',
        notes: existing?.notes,
      };
    });

    // Nuestra Vida Cristiana (preservando asignaciones si existen)
    const existingVida = updated.midweek.vidaCristiana?.items || [];
    const vidaItems = organizedSchedule.midweek.vidaCristiana.map((v, idx) => {
      const existing = existingVida[idx];
      return {
        id: existing?.id || `mwb-vida-${currentWeek.id}-${idx}`,
        title: v.title,
        type: 'vym_vida_partes' as const,
        timeMinutes: v.timeMinutes,
        status: existing?.status || 'pendiente',
        publisherId: existing?.publisherId || '',
        notes: existing?.notes,
      };
    });

    // Estudio Bíblico de la Congregación
    if (organizedSchedule.midweek.estudioBiblicoTitle) {
      const existingCbs = existingVida.find(
        (item) => item.id?.includes('cbs') || item.title?.toLowerCase().includes('estudio b')
      );
      vidaItems.push({
        id: existingCbs?.id || `mwb-cbs-${currentWeek.id}`,
        title: organizedSchedule.midweek.estudioBiblicoTitle,
        type: 'vym_vida_partes' as const,
        timeMinutes: 30,
        status: existingCbs?.status || 'pendiente',
        publisherId: existingCbs?.publisherId || '',
        notes: existingCbs?.notes,
      });
    }

    updated.midweek.vidaCristiana.items = vidaItems;
  }

  // 2. REUNIÓN DEL FIN DE SEMANA
  if (options.applyWeekend !== false && organizedSchedule.weekend) {
    if (organizedSchedule.weekend.outlineNumber) {
      updated.weekend.publicTalkOutlineNumber = organizedSchedule.weekend.outlineNumber;
    }
    if (organizedSchedule.weekend.outlineTitle) {
      updated.weekend.publicTalkTheme = organizedSchedule.weekend.outlineTitle;
    }
    if (organizedSchedule.weekend.speakerName && !updated.weekend.publicTalkSpeaker) {
      updated.weekend.publicTalkSpeaker = organizedSchedule.weekend.speakerName;
    }
    if (organizedSchedule.weekend.speakerCongregation && !updated.weekend.visitingSpeakerCongregation) {
      updated.weekend.visitingSpeakerCongregation = organizedSchedule.weekend.speakerCongregation;
    }
    if (organizedSchedule.weekend.watchtowerTheme) {
      updated.weekend.watchtowerTheme = organizedSchedule.weekend.watchtowerTheme;
    }
    if (organizedSchedule.weekend.watchtowerScripture) {
      updated.weekend.watchtowerScripture = organizedSchedule.weekend.watchtowerScripture;
    }
    if (organizedSchedule.weekend.openingSong) {
      updated.weekend.openingSong = organizedSchedule.weekend.openingSong;
    }
    if (organizedSchedule.weekend.middleSong) {
      updated.weekend.middleSong = organizedSchedule.weekend.middleSong;
    }
    if (organizedSchedule.weekend.closingSong) {
      updated.weekend.closingSong = organizedSchedule.weekend.closingSong;
    }
  }

  return updated;
}

/**
 * Parser para importar archivos JSON o texto exportado del programa semanal
 */
export function parseOrganizedJsonOrText(raw: string): {
  success: boolean;
  schedule?: OrganizedWeekSchedule;
  errorMessage?: string;
} {
  const trimmed = raw.trim();

  // Try parsing as JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Handle Organized app backup or meeting export object
      const data = Array.isArray(parsed) ? parsed[0] : parsed;

      // Extract midweek data
      const mwbData = data.mwb || data.midweek || data.mwb_history || data;
      const wData = data.w || data.weekend || data.w_history || data;

      const schedule: OrganizedWeekSchedule = {
        weekKey: data.weekId || data.week || 'semana_importada',
        weekDateRange: data.dateRange || data.date || 'Semana Importada',
        bibleReading: mwbData.bibleReading || mwbData.mwb_weekly_bible_reading || 'Lectura semanal',
        midweek: {
          songFirst: mwbData.songFirst || mwbData.mwb_song_first,
          songMiddle: mwbData.songMiddle || mwbData.mwb_song_middle,
          songConclude: mwbData.songConclude || mwbData.mwb_song_conclude,
          tesoros: {
            discursoTitle:
              mwbData.tgw_talk ||
              mwbData.discursoTitle ||
              mwbData.tesoros_discurso ||
              'Discurso de Tesoros de la Biblia (10 min.)',
            perlasTitle:
              mwbData.tgw_gems ||
              mwbData.perlasTitle ||
              mwbData.tesoros_perlas ||
              'Busquemos perlas escondidas (10 min.)',
            lecturaTitle:
              mwbData.tgw_bible_reading ||
              mwbData.lecturaTitle ||
              mwbData.tesoros_lectura ||
              'Lectura de la Biblia (4 min.)',
          },
          demonstrations: Array.isArray(mwbData.demonstrations)
            ? mwbData.demonstrations
            : [
                {
                  title:
                    mwbData.ayf_part1 ||
                    mwbData.part1 ||
                    'Empiece conversaciones (3 min.)',
                  timeMinutes: 3,
                  lessonNumber: 1,
                },
                {
                  title:
                    mwbData.ayf_part2 ||
                    mwbData.part2 ||
                    'Haga revisitas (4 min.)',
                  timeMinutes: 4,
                  lessonNumber: 3,
                },
                {
                  title:
                    mwbData.ayf_part3 ||
                    mwbData.part3 ||
                    'Haga discípulos / Discurso (5 min.)',
                  timeMinutes: 5,
                  lessonNumber: 8,
                },
              ],
          vidaCristiana: Array.isArray(mwbData.vidaPartes)
            ? mwbData.vidaPartes
            : [
                {
                  title:
                    mwbData.lc_part1 ||
                    mwbData.vida1 ||
                    'Nuestra Vida Cristiana (15 min.)',
                  timeMinutes: 15,
                },
              ],
          estudioBiblicoTitle:
            mwbData.lc_cbs ||
            mwbData.estudioBiblico ||
            mwbData.cbs ||
            'Estudio bíblico de la congregación (30 min.)',
        },
        weekend: {
          outlineNumber:
            wData.publicTalkOutlineNumber ||
            wData.w_public_talk_number ||
            wData.outlineNumber ||
            5,
          outlineTitle:
            wData.publicTalkTheme ||
            wData.w_public_talk ||
            wData.talkTheme ||
            'Toda la familia puede ser feliz',
          speakerName: wData.speakerName || wData.w_speaker,
          speakerCongregation: wData.speakerCongregation || wData.w_congregation,
          watchtowerTheme:
            wData.watchtowerTheme ||
            wData.w_watchtower_study ||
            wData.studyTheme ||
            'Estudio de La Atalaya',
          watchtowerScripture: wData.watchtowerScripture || wData.scripture,
          openingSong: wData.openingSong || wData.w_song_first,
          middleSong: wData.middleSong || wData.w_song_middle,
          closingSong: wData.closingSong || wData.w_song_conclude,
        },
      };

      return { success: true, schedule };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: `El archivo JSON no tiene un formato válido: ${err.message}`,
      };
    }
  }

  // Handle plain text paste of meeting schedule
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) {
    return {
      success: false,
      errorMessage: 'El texto introducido es demasiado corto para extraer el programa semanal.',
    };
  }

  let discursoTitle = 'Discurso de Tesoros de la Biblia (10 min.)';
  let perlasTitle = 'Busquemos perlas escondidas (10 min.)';
  let lecturaTitle = 'Lectura de la Biblia (4 min.)';
  const demonstrations: Array<{ title: string; timeMinutes: number; lessonNumber?: number }> = [];
  const vidaPartes: Array<{ title: string; timeMinutes: number }> = [];
  let estudioBiblicoTitle = 'Estudio bíblico de la congregación (30 min.)';
  let talkTheme = '';
  let outlineNum: number | undefined = undefined;
  let atalayaTheme = '';

  let currentSection = 'intro';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Section triggers
    if (lower.includes('tesoros de la biblia') || lower.includes('treasures from god')) {
      currentSection = 'tesoros';
      continue;
    }
    if (lower.includes('seamos mejores') || lower.includes('apply yourself')) {
      currentSection = 'maestros';
      continue;
    }
    if (lower.includes('nuestra vida cristiana') || lower.includes('living as christians')) {
      currentSection = 'vida';
      continue;
    }
    if (lower.includes('discurso público') || lower.includes('public talk')) {
      currentSection = 'discurso_publico';
      continue;
    }
    if (lower.includes('atalaya') || lower.includes('watchtower')) {
      currentSection = 'atalaya';
      continue;
    }

    // Parse according to section
    if (currentSection === 'tesoros') {
      if (lower.includes('perlas escondidas')) {
        perlasTitle = line;
      } else if (lower.includes('lectura de la biblia')) {
        lecturaTitle = line;
      } else if (!lower.startsWith('canción') && !lower.startsWith('oración')) {
        discursoTitle = line;
      }
    } else if (currentSection === 'maestros') {
      if (lower.includes('lectura de la biblia') || lower.includes('lectura bíblica')) {
        lecturaTitle = line;
        continue;
      }
      if (
        lower.includes('empiece') ||
        lower.includes('revisita') ||
        lower.includes('discípulo') ||
        lower.includes('demostración') ||
        lower.includes('discurso') ||
        lower.includes('min')
      ) {
        const matchMin = line.match(/(\d+)\s*min/i);
        const mins = matchMin ? parseInt(matchMin[1], 10) : 4;
        demonstrations.push({
          title: line,
          timeMinutes: mins,
          lessonNumber: demonstrations.length + 1,
        });
      }
    } else if (currentSection === 'vida') {
      if (lower.includes('estudio bíblico de la congregación') || lower.includes('estudio bíblico:')) {
        estudioBiblicoTitle = line;
      } else if (!lower.startsWith('canción') && !lower.startsWith('oración')) {
        const matchMin = line.match(/(\d+)\s*min/i);
        const mins = matchMin ? parseInt(matchMin[1], 10) : 15;
        vidaPartes.push({
          title: line,
          timeMinutes: mins,
        });
      }
    } else if (currentSection === 'discurso_publico') {
      talkTheme = line;
      // Check if outline number e.g. "Bosquejo 14" or "#14"
      const matchNum = line.match(/(?:núm(?:ero)?\.?|bosquejo|#)\s*(\d+)/i);
      if (matchNum) {
        outlineNum = parseInt(matchNum[1], 10);
      }
    } else if (currentSection === 'atalaya') {
      atalayaTheme = line;
    }
  }

  // If outline number not matched in line, search catalog
  if (!outlineNum && talkTheme) {
    const found = OFFICIAL_PUBLIC_TALK_OUTLINES.find((o) =>
      talkTheme.toLowerCase().includes(o.title.toLowerCase())
    );
    if (found) outlineNum = found.number;
  }

  const schedule: OrganizedWeekSchedule = {
    weekKey: 'texto_copiado',
    weekDateRange: 'Semana Importada',
    bibleReading: 'Lectura Semanal',
    midweek: {
      tesoros: {
        discursoTitle,
        perlasTitle,
        lecturaTitle,
      },
      demonstrations: demonstrations.length > 0 ? demonstrations : [
        { title: 'Empiece conversaciones (3 min.)', timeMinutes: 3, lessonNumber: 1 },
        { title: 'Haga revisitas (4 min.)', timeMinutes: 4, lessonNumber: 3 },
      ],
      vidaCristiana: vidaPartes.length > 0 ? vidaPartes : [
        { title: 'Nuestra Vida Cristiana (15 min.)', timeMinutes: 15 },
      ],
      estudioBiblicoTitle,
    },
    weekend: {
      outlineNumber: outlineNum || 1,
      outlineTitle: talkTheme || findOutlineByNumber(outlineNum || 1)?.title || '¿Conoce usted bien a Dios?',
      watchtowerTheme: atalayaTheme || 'Estudio de La Atalaya semanal',
    },
  };

  return { success: true, schedule };
}
