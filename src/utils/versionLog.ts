/**
 * REGISTRO OFICIAL DE VERSIONES Y ACTUALIZACIONES DE KONGRE
 * 
 * ⚠️ INSTRUCCIONES PARA DESARROLLADORES:
 * Cada vez que se implemente una actualización o cambio en el sistema:
 * 1. Incrementa CURRENT_APP_VERSION (ej. de '2.5.0' a '2.5.1' o '2.6.0').
 * 2. Actualiza BUILD_DATE y CURRENT_BUILD_CODE.
 * 3. Agrega la nueva versión al inicio de VERSION_HISTORY.
 * 4. Actualiza package.json y CHANGELOG.md.
 */

export interface VersionChangeItem {
  category: 'feature' | 'improvement' | 'fix' | 'security';
  text: string;
}

export interface VersionRecord {
  version: string;
  buildCode: string;
  date: string;
  title: string;
  isCurrent?: boolean;
  highlight?: string;
  environment: string;
  changes: VersionChangeItem[];
}

export const CURRENT_APP_VERSION = '0.1.0-alpha.45';
export const CURRENT_APP_STAGE = 'Alfa';
export const CURRENT_BUILD_CODE = '2026.11.05.8045';
export const BUILD_DATE = '5 de Noviembre, 2026';
export const BUILD_ENVIRONMENT = 'Fase Alfa Preliminar (Web & Desktop)';

export function getSystemDiagnosticInfo(): string {
  return [
    `Aplicación: Kongre App`,
    `Versión: v${CURRENT_APP_VERSION} (${CURRENT_APP_STAGE} Preliminar)`,
    `Código de Compilación: ${CURRENT_BUILD_CODE}`,
    `Fecha de Publicación: ${BUILD_DATE}`,
    `Plataforma: ${BUILD_ENVIRONMENT}`,
    `URL: ${typeof window !== 'undefined' ? window.location.origin : ''}`,
    `Pestaña Activa: ${typeof window !== 'undefined' ? window.location.hash || '#inicio' : ''}`,
    `Navegador: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido'}`,
  ].join('\n');
}
