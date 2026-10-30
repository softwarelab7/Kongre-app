// src/types/jwDesignSystem.ts
/**
 * Modelo de datos del Sistema UI/UX inspirado en JW Library
 * Permite anotaciones, subrayados reactivos, selectores jerárquicos y referencias cruzadas.
 */

export type HighlightColor = 'yellow' | 'emerald' | 'blue' | 'rose' | 'violet';

export interface ReferenceItem {
  id: string;
  code: string;        // Ej: "DOC-104", "Prov. 27:17" o "S-89"
  title: string;
  extract: string;     // Texto que se despliega en el panel lateral sin salir de la vista
  url?: string;
}

export interface BlockItem {
  id: string;
  sectionId: string;
  orderIndex: number;
  title: string;
  durationMinutes?: number;
  content: string;
  references: ReferenceItem[];
}

export interface UserAnnotation {
  id: string;
  blockId: string;     // Vinculación directa al bloque o párrafo
  highlightColor?: HighlightColor;
  noteText: string;
  tags: string[];      // Ej: ["Prioridad", "Asignado", "Revisión", "Cabina"]
  updatedAt: string;
}

export interface DrillDownStep {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

export interface DrillDownLevel {
  levelTitle: string;
  items: DrillDownStep[];
}
