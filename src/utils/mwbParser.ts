// src/utils/mwbParser.ts

export interface ParsedMwbWeek {
  bibleReadingRange?: string;
  discursoTitle: string;
  perlasTitle: string;
  lecturaBibliaTitle: string;
  demonstrations: Array<{
    title: string;
    timeMinutes: number;
  }>;
  vidaPartes: Array<{
    title: string;
    timeMinutes: number;
  }>;
  estudioBiblicoTitle: string;
  atalayaTheme?: string;
}

export const PRESET_SAMPLE_MWB_WEEKS: Record<string, ParsedMwbWeek> = {
  'salmos_80': {
    bibleReadingRange: 'Salmos 80 a 82',
    discursoTitle: '“El Dios que escucha nuestras oraciones” (10 min.)',
    perlasTitle: 'Busquemos perlas escondidas (10 min.)',
    lecturaBibliaTitle: 'Lectura de la Biblia: Salmo 81:1-16 (4 min.)',
    demonstrations: [
      { title: 'Empiece conversaciones: De casa en casa (3 min.)', timeMinutes: 3 },
      { title: 'Haga revisitas: Responda a una objeción (4 min.)', timeMinutes: 4 },
      { title: 'Haga discípulos: Curso bíblico interactivo (5 min.)', timeMinutes: 5 },
    ],
    vidaPartes: [
      { title: 'Logros de la organización / Video mensual (15 min.)', timeMinutes: 15 },
    ],
    estudioBiblicoTitle: 'Estudio bíblico: libro "bt" cap. 15 párrs. 1-7',
    atalayaTheme: 'Confiemos en el cuidado amoroso de Jehová',
  },
  'proverbios_1': {
    bibleReadingRange: 'Proverbios 1 a 3',
    discursoTitle: '“La sabiduría clama en las calles” (10 min.)',
    perlasTitle: 'Busquemos perlas escondidas (10 min.)',
    lecturaBibliaTitle: 'Lectura de la Biblia: Proverbios 2:1-22 (4 min.)',
    demonstrations: [
      { title: 'Empiece conversaciones: Predicación informal (3 min.)', timeMinutes: 3 },
      { title: 'Haga revisitas: Interés anterior (4 min.)', timeMinutes: 4 },
      { title: 'Discurso de estudiante: "El temor de Jehová" (5 min.)', timeMinutes: 5 },
    ],
    vidaPartes: [
      { title: 'Necesidades de la congregación (15 min.)', timeMinutes: 15 },
    ],
    estudioBiblicoTitle: 'Estudio bíblico: libro "lff" lección 42 puntos 1-3',
    atalayaTheme: 'Jóvenes, sigan buscando la guía divina',
  },
  'mateo_5': {
    bibleReadingRange: 'Mateo 5 a 7',
    discursoTitle: '“El Sermón del Monte y la felicidad verdadera” (10 min.)',
    perlasTitle: 'Busquemos perlas escondidas (10 min.)',
    lecturaBibliaTitle: 'Lectura de la Biblia: Mateo 6:1-18 (4 min.)',
    demonstrations: [
      { title: 'Empiece conversaciones: Carritos o lugares públicos (3 min.)', timeMinutes: 3 },
      { title: 'Haga revisitas: Muestre un video de jw.org (4 min.)', timeMinutes: 4 },
      { title: 'Haga discípulos: Cómo prepararse para el bautismo (5 min.)', timeMinutes: 5 },
    ],
    vidaPartes: [
      { title: 'Informes de servicio de campo y metas para el nuevo año (15 min.)', timeMinutes: 15 },
    ],
    estudioBiblicoTitle: 'Estudio bíblico: libro "bt" cap. 18 párrs. 8-15',
    atalayaTheme: '¿Por qué debemos amar la verdad de Dios?',
  },
};

export function parseMwbText(rawText: string): ParsedMwbWeek {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let bibleReadingRange = '';
  let discursoTitle = 'Discurso de Tesoros de la Biblia (10 min.)';
  let perlasTitle = 'Busquemos perlas escondidas (10 min.)';
  let lecturaBibliaTitle = 'Lectura de la Biblia (4 min.)';
  const demonstrations: Array<{ title: string; timeMinutes: number }> = [];
  const vidaPartes: Array<{ title: string; timeMinutes: number }> = [];
  let estudioBiblicoTitle = 'Estudio bíblico de la congregación (30 min.)';
  let atalayaTheme = '';

  let currentSection = 'unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Section triggers
    if (lower.includes('tesoros de la biblia') || lower.includes('treasures from god')) {
      currentSection = 'tesoros';
      continue;
    } else if (lower.includes('seamos mejores maestros') || lower.includes('apply yourself')) {
      currentSection = 'maestros';
      continue;
    } else if (lower.includes('nuestra vida cristiana') || lower.includes('living as christians')) {
      currentSection = 'vida';
      continue;
    } else if (lower.includes('estudio de la atalaya') || lower.includes('watchtower study')) {
      currentSection = 'atalaya';
      continue;
    }

    // Bible reading range in title or header (e.g. "Salmos 79 a 81")
    if (lower.startsWith('lectura semanal') || lower.startsWith('semana:')) {
      bibleReadingRange = line.replace(/^(lectura semanal( de la biblia)?:?|semana:?)/i, '').trim();
      continue;
    }

    // Tesoros section lines
    if (currentSection === 'tesoros') {
      if (lower.includes('perlas escondidas')) {
        perlasTitle = line;
      } else if (lower.includes('lectura de la biblia')) {
        lecturaBibliaTitle = line;
      } else if (!lower.startsWith('canción') && !lower.startsWith('oración')) {
        // Discurso title
        discursoTitle = line;
      }
    }

    // Seamos mejores maestros lines
    if (currentSection === 'maestros') {
      if (
        lower.includes('empiece') ||
        lower.includes('haga revisitas') ||
        lower.includes('haga discípulos') ||
        lower.includes('discurso') ||
        lower.includes('conversaciones') ||
        lower.includes('min')
      ) {
        // Extract minutes if present, e.g. (3 min.)
        const matchMin = line.match(/(\d+)\s*min/i);
        const mins = matchMin ? parseInt(matchMin[1], 10) : 4;
        demonstrations.push({
          title: line,
          timeMinutes: mins,
        });
      }
    }

    // Nuestra vida cristiana lines
    if (currentSection === 'vida') {
      if (lower.includes('estudio bíblico') || lower.includes('estudio biblico')) {
        estudioBiblicoTitle = line;
      } else if (!lower.startsWith('canción') && !lower.startsWith('oración')) {
        const matchMin = line.match(/(\d+)\s*min/i);
        const mins = matchMin ? parseInt(matchMin[1], 10) : 15;
        vidaPartes.push({
          title: line,
          timeMinutes: mins,
        });
      }
    }

    if (currentSection === 'atalaya') {
      if (!lower.startsWith('canción') && !lower.startsWith('oración')) {
        atalayaTheme = line;
      }
    }
  }

  // Fallbacks if nothing matched
  if (demonstrations.length === 0) {
    demonstrations.push(
      { title: 'Empiece conversaciones (3 min.)', timeMinutes: 3 },
      { title: 'Haga revisitas (4 min.)', timeMinutes: 4 },
      { title: 'Haga discípulos (5 min.)', timeMinutes: 5 }
    );
  }

  if (vidaPartes.length === 0) {
    vidaPartes.push({ title: 'Necesidades de la congregación (15 min.)', timeMinutes: 15 });
  }

  return {
    bibleReadingRange,
    discursoTitle,
    perlasTitle,
    lecturaBibliaTitle,
    demonstrations,
    vidaPartes,
    estudioBiblicoTitle,
    atalayaTheme,
  };
}
