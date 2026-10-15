// src/services/geminiService.ts
import { GoogleGenAI } from '@google/genai';

export interface ParsedMwbFromGemini {
  weekTitle?: string;
  bibleReading?: string;
  initialSong?: string;
  middleSong?: string;
  finalSong?: string;
  tesoros: {
    discursoTitle: string;
    discursoTimeMinutes: number;
    perlasTitle: string;
    perlasTimeMinutes: number;
    lecturaBibliaTitle: string;
    lecturaBibliaTimeMinutes: number;
  };
  demonstrations: Array<{
    title: string;
    timeMinutes: number;
    lessonNumber?: number;
    lessonTitle?: string;
    type: 'vym_maestros_titular' | 'vym_maestros_ayudante' | 'discurso_estudiante';
  }>;
  vidaPartes: Array<{
    title: string;
    timeMinutes: number;
  }>;
  estudioBiblicoTitle?: string;
  atalayaTheme?: string;
}

export interface NoticeDraftResult {
  title: string;
  category: 'general' | 'limpieza' | 'mantenimiento' | 'visita' | 'asamblea' | 'predicacion';
  content: string;
  priority: 'normal' | 'alta' | 'urgente';
}

const STORAGE_KEY_API_KEY = 'kongre_gemini_api_key';
const STORAGE_KEY_MODEL = 'kongre_gemini_model';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Obtener la API key de Gemini configurada (LocalStorage o variable de entorno)
 */
export const getGeminiApiKey = (): string => {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (fromStorage && fromStorage.trim().length > 0) {
      return fromStorage.trim();
    }
  } catch {}

  // Fallback a variable de entorno de Vite o global
  const fromEnv = (import.meta as any)?.env?.VITE_GEMINI_API_KEY || (import.meta as any)?.env?.GEMINI_API_KEY || '';
  return fromEnv.trim();
};

/**
 * Guardar o remover la API key de Gemini
 */
export const setGeminiApiKey = (key: string | null): void => {
  if (key && key.trim().length > 0) {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  }
};

/**
 * Verificar si la API key está presente
 */
export const isGeminiConfigured = (): boolean => {
  return getGeminiApiKey().length > 0;
};

/**
 * Obtener el modelo configurado
 */
export const getGeminiModel = (): string => {
  return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_GEMINI_MODEL;
};

/**
 * Guardar el modelo preferido
 */
export const setGeminiModel = (model: string): void => {
  localStorage.setItem(STORAGE_KEY_MODEL, model);
};

/**
 * Inicializar cliente GoogleGenAI
 */
const getClient = (overrideKey?: string): GoogleGenAI => {
  const apiKey = overrideKey?.trim() || getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la clave de API de Gemini. Ve a Ajustes > Inteligencia Artificial para configurarla.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Probar conexión con Gemini API
 */
export const testGeminiConnection = async (overrideKey?: string): Promise<{ success: boolean; message: string; model: string }> => {
  const model = getGeminiModel();
  try {
    const ai = getClient(overrideKey);
    const response = await ai.models.generateContent({
      model,
      contents: 'Responde únicamente con la palabra "CONECTADO" si puedes procesar este mensaje teocrático.',
    });

    const text = response.text || '';
    if (text.includes('CONECTADO') || text.length > 0) {
      return {
        success: true,
        message: `¡Conexión exitosa con Gemini AI (${model})!`,
        model,
      };
    }
    return {
      success: true,
      message: 'Conexión completada con respuesta del modelo.',
      model,
    };
  } catch (error: any) {
    console.error('Error probando Gemini:', error);
    return {
      success: false,
      message: error?.message || 'Error al conectar con la API de Gemini. Revisa que la clave sea válida.',
      model,
    };
  }
};

/**
 * Extraer estructura completa de la Guía de Actividades (MWB) desde texto usando Gemini
 */
export const parseMwbWithGemini = async (rawText: string, overrideKey?: string): Promise<ParsedMwbFromGemini> => {
  if (!rawText.trim()) {
    throw new Error('Por favor ingresa o pega el texto del programa de la reunión.');
  }

  const ai = getClient(overrideKey);
  const model = getGeminiModel();

  const prompt = `
Actúa como un experto en la organización del programa semanal de las reuniones de los Testigos de Jehová ("Vida y Ministerio Cristianos" - Guía de Actividades MWB).
Analiza el siguiente texto (copiado de JW.ORG, documento, notas o transcripción) y extrae de manera estructurada y precisa todas las partes de la reunión.

TEXTO A ANALIZAR:
"""
${rawText}
"""

INSTRUCCIONES DE EXTRACCIÓN:
1. Identifica el título de la semana o fecha (ej: "3 a 9 de noviembre" o lectura bíblica ej: "SALMOS 80 A 82").
2. Identifica la lectura semanal de la Biblia (ej: "Salmos 80-82").
3. Identifica números de canción si aparecen (canción inicial, intermedia y final).
4. Sección "TESOROS DE LA BIBLIA":
   - Discurso temático inicial (usualmente 10 min).
   - "Busquemos perlas escondidas" (usualmente 10 min).
   - "Lectura de la Biblia" (asignación de estudiante, usualmente 4 min).
5. Sección "SEAMOS MEJORES MAESTROS" (asignaciones de estudiantes):
   - Extrae cada intervención: título (ej: "Empiece conversaciones", "Haga revisitas", "Explique sus creencias", "Discurso"), minutos asignados y lección del folleto/libro si se menciona (número de lección).
6. Sección "NUESTRA VIDA CRISTIANA":
   - Extrae cada parte (excluyendo el Estudio Bíblico de la Congregación), con su título y minutos.
   - Extrae el Estudio Bíblico de la Congregación ("EBC" o título del libro y capítulo/párrafos).
7. Fin de semana (si está presente):
   - Tema del Discurso Público o tema de La Atalaya.

Devuelve estrictamente un objeto JSON con esta estructura exacta:
{
  "weekTitle": "string",
  "bibleReading": "string",
  "initialSong": "string opcional o vacio",
  "middleSong": "string opcional o vacio",
  "finalSong": "string opcional o vacio",
  "tesoros": {
    "discursoTitle": "string",
    "discursoTimeMinutes": 10,
    "perlasTitle": "Busquemos perlas escondidas",
    "perlasTimeMinutes": 10,
    "lecturaBibliaTitle": "Lectura de la Biblia (pasaje)",
    "lecturaBibliaTimeMinutes": 4
  },
  "demonstrations": [
    {
      "title": "string",
      "timeMinutes": 3,
      "lessonNumber": 1,
      "lessonTitle": "string opcional",
      "type": "vym_maestros_titular"
    }
  ],
  "vidaPartes": [
    {
      "title": "string",
      "timeMinutes": 15
    }
  ],
  "estudioBiblicoTitle": "string opcional con el tema del libro",
  "atalayaTheme": "string opcional con tema de atalaya"
}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Gemini no devolvió ninguna respuesta.');
  }

  try {
    const parsed = JSON.parse(responseText) as ParsedMwbFromGemini;
    return parsed;
  } catch (err: any) {
    console.error('Error parseando JSON de Gemini:', responseText);
    throw new Error('No se pudo interpretar la respuesta estructurada de Gemini.');
  }
};

/**
 * Generador inteligente de anuncios teocráticos para el Tablero de Anuncios
 */
export const generateNoticeWithGemini = async (
  topic: string,
  category: NoticeDraftResult['category'] = 'general',
  congregationName?: string,
  overrideKey?: string
): Promise<NoticeDraftResult> => {
  const ai = getClient(overrideKey);
  const model = getGeminiModel();

  const prompt = `
Eres un asistente que redacta avisos teocráticos oficiales y edificantes para el Tablero de Anuncios del Salón del Reino.
La congregación se llama: "${congregationName || 'de la localidad'}".
Categoría del anuncio: ${category}.
Tema o instrucciones clave dadas por los ancianos:
"${topic}"

REGLAS DE REDACCIÓN TEOCRÁTICA:
- Tono respetuoso, amoroso, claro y ordenado, digno del pueblo de Jehová.
- Incluye un saludo inicial afectuoso (ej: "A todos los publicadores", "A los hermanos...").
- Explica los detalles de forma clara (fechas, horas, lugar, recomendaciones prácticas si aplican).
- Si es de limpieza o mantenimiento, anima a valorar el cuidado de la casa de adoración a Jehová.
- Si es de predicación o visita del superintendente, destaca el privilegio y gozo de participar.
- Cierra con una frase cálida (ej: "Con amor fraternal, El Cuerpo de Ancianos" o "Los hermanos de la comisión de servicio").

Devuelve estrictamente un JSON con esta estructura:
{
  "title": "Título conciso y formal en mayúsculas/minúsculas",
  "category": "${category}",
  "content": "Cuerpo del anuncio en párrafos claros y ordenados",
  "priority": "normal"
}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) throw new Error('No se recibió texto del modelo.');

  return JSON.parse(text) as NoticeDraftResult;
};

/**
 * Sugeridor inteligente de asignaciones para una semana
 */
export const suggestWeeklyAssignmentsWithGemini = async (
  weekSummary: {
    weekDate: string;
    unassignedParts: Array<{ id: string; title: string; section: string; type: string; minTime?: number }>;
  },
  availablePublishers: Array<{
    id: string;
    name: string;
    privilege: string;
    theocraticRole?: string;
    qualifications: string[];
    recentAssignmentsCount: number;
  }>,
  overrideKey?: string
): Promise<Array<{ partId: string; publisherId: string; reason: string }>> => {
  const ai = getClient(overrideKey);
  const model = getGeminiModel();

  const prompt = `
Eres un asistente teocrático para el Superintendente de la Reunión Vida y Ministerio Cristianos y el Coordinador.
Tu objetivo es sugerir asignaciones de manera equilibrada, justa y respetuosa, evitando sobrecargar a los hermanos.

REUNIÓN / PARTES SIN ASIGNAR:
${JSON.stringify(weekSummary.unassignedParts, null, 2)}

PUBLICADORES DISPONIBLES Y CONDICIONES:
${JSON.stringify(availablePublishers, null, 2)}

REGLAS TEOCRÁTICAS:
1. Las oraciones, lectura de la Atalaya, estudio de libro y discursos de Tesoros solo pueden asignarse a ancianos o siervos ministeriales bautizados calificados.
2. La Lectura de la Biblia de estudiantes la realizan hermanos (varones).
3. Las demostraciones de estudiantes pueden ser de hermanas (con ayudante hermana) o hermanos.
4. Prioriza hermanos con 'recentAssignmentsCount' más bajo para fomentar la equidad en la congregación.
5. Brinda una breve razón amorosa y teocrática para cada sugerencia.

Devuelve estrictamente un JSON con este formato:
[
  {
    "partId": "id_de_la_parte",
    "publisherId": "id_del_publicador",
    "reason": "Explicación breve de por qué es la persona ideal"
  }
]
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) return [];

  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
};
