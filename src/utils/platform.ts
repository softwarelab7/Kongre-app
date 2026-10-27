/**
 * Utilidades para detección del entorno de ejecución (Web vs Escritorio Nativo)
 */

/**
 * Retorna true si la aplicación se está ejecutando dentro del contenedor nativo de escritorio (Tauri / Rust).
 * Retorna false si se está ejecutando en la web (navegador / PWA / Vercel).
 */
export const isDesktopApp = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};
