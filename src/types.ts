// src/types.ts
// Define la estructura de una semana de reunión entre semana, sus secciones (tesoros, maestros, vida_cristiana, marco), partes y asignaciones.

export type ClmPartType =
  | 'canto'
  | 'presidente'
  | 'oracion_apertura'
  | 'oracion_cierre'
  | 'oracion_estudio'
  | 'discurso_tesoros'
  | 'busquemos_perlas'
  | 'lectura_biblica'
  | 'empiece_conversaciones'
  | 'empiece_conversaciones_aux'
  | 'haga_revisitas'
  | 'haga_revisitas_aux'
  | 'haga_discipulos'
  | 'explique_sus_creencias'
  | 'discurso_estudiante'
  | 'necesidades_congregacion'
  | 'estudio_biblico_grupo'
  | 'lector_estudio'
  | 'conductor_auxiliar'
  | 'demo_auxiliar';

export type ClmProgramaEstado = 'borrador' | 'publicado' | 'cancelado';

export interface ClmParte {
  id: string;
  tipo: ClmPartType;
  titulo: string;
  duracion_min: number;
  seccion: 'tesoros' | 'maestros' | 'vida_cristiana' | 'marco';
  asignado_nid?: string | null;
  asignado_nombre?: string;
  asignado_auxiliar_nid?: string | null;
  asignado_auxiliar_nombre?: string;
  requiere_hermano: boolean;
  requiere_privilegio: boolean;
  descripcion?: string;
  notas?: string;
  es_clase_auxiliar?: boolean;
  leccion_numero?: number;
  leccion_titulo?: string;
  leccion_estado?: 'completada' | 'continuar' | 'pendiente';
}

export interface ClmPrograma {
  id: string;
  semana_fecha: string; // Formato YYYY-MM-DD (lunes de la semana)
  anio: number;
  semana_num: number;
  estado: ClmProgramaEstado;
  partes: ClmParte[];
  notas?: string;
  generado_por?: 'manual' | 'ai';
  congregation_id?: string | null;
  lectura_semana?: string;
  rango_semana?: string;
  sala_auxiliar_habilitada?: boolean;
}

export interface WeekendParte {
  id: string;
  tipo: string;
  titulo: string;
  duracion_min?: number;
  asignado_nid?: string | null;
  asignado_nombre?: string;
}

export interface WeekendPrograma {
  id: string;
  semana_fecha: string; // Formato YYYY-MM-DD
  estado?: 'borrador' | 'publicado' | 'cancelado';
  orador_nombre?: string;
  discurso_titulo?: string;
  discurso_numero?: number;
  congregacion_orador?: string;
  presidente_nid?: string | null;
  presidente_nombre?: string;
  lector_atalaya_nid?: string | null;
  lector_atalaya_nombre?: string;
  oracion_cierre_nid?: string | null;
  oracion_cierre_nombre?: string;
  partes?: WeekendParte[];
}

export interface TurnoDeber {
  id: string;
  semana_fecha: string;
  tipo_reunion: 'entre_semana' | 'fin_de_semana';
  titulo: string;
  tipo_deber?: 'sonido' | 'microfonos' | 'plataforma' | 'acomodador' | 'seguridad' | 'video' | 'zoom' | string;
  asignado_nid?: string | null;
  asignado_nombre?: string;
}

export interface ClmHistorialItem {
  id?: string;
  publisher_nid: string;
  publisher_name?: string;
  semana_fecha: string;
  tipo_parte: ClmPartType | string;
  titulo_parte?: string;
  sala?: 'principal' | 'auxiliar';
  rol?: 'titular' | 'ayudante';
}

// Re-exportar tipos adicionales de Kongre
export * from './types/index';
