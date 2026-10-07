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
}

// Re-exportar tipos adicionales de Kongre
export * from './types/index';
