/**
 * REGISTRO OFICIAL DE VERSIONES Y ACTUALIZACIONES DE KONGRE
 * 
 * ⚠️ INSTRUCCIONES PARA DESARROLLADORES / ANTI-GRAVITY (GOOGLE AI STUDIO):
 * Cada vez que se implemente una actualización o cambio en Google AI Studio (Anti-Gravity):
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

export const CURRENT_APP_VERSION = '2.6.0';
export const CURRENT_BUILD_CODE = '2026.10.17.260';
export const BUILD_DATE = '17 de Octubre, 2026';
export const BUILD_ENVIRONMENT = 'Google AI Studio (Anti-Gravity)';

export const VERSION_HISTORY: VersionRecord[] = [
  {
    version: '2.6.0',
    buildCode: '2026.10.17.260',
    date: '17 de Octubre, 2026',
    title: 'Sincronización en Cola Offline con IndexedDB y Supabase',
    isCurrent: true,
    highlight: 'Última versión compilada y activa en Google AI Studio',
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'feature',
        text: 'Cola de sincronización persistente en IndexedDB: las modificaciones realizadas sin internet (asistencia, informes de servicio, publicadores) se almacenan localmente en el dispositivo de forma garantizada.',
      },
      {
        category: 'feature',
        text: 'Sincronización automática con Supabase: al recuperar conexión WiFi o datos móviles, la cola de IndexedDB se vacía y transmite los datos cifrados con AES-256-GCM (Cero Conocimiento).',
      },
      {
        category: 'feature',
        text: 'Modal interactivo de Cola Offline: accesible desde el pie de página y la barra superior para inspeccionar cada cambio pendiente y forzar sincronización manual.',
      },
      {
        category: 'improvement',
        text: 'Consolidación de la arquitectura de base de datos en Supabase (eliminando cualquier remanente hacia Firebase).',
      },
      {
        category: 'improvement',
        text: 'Banner inteligente de conectividad que indica la cantidad exacta de operaciones en cola esperando red.',
      },
    ],
  },
  {
    version: '2.5.0',
    buildCode: '2026.10.17.250',
    date: '17 de Octubre, 2026',
    title: 'Registro de Versión en Pie de Página y Navegación Histórica',
    isCurrent: false,
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'feature',
        text: 'Registro de versión visible en la parte inferior (pie de página) con botón interactivo para consultar el historial completo.',
      },
      {
        category: 'feature',
        text: 'Modal detallado de Historial de Versiones y Actualizaciones con copia de diagnóstico del sistema.',
      },
      {
        category: 'feature',
        text: 'Documento oficial CHANGELOG.md para registrar metódicamente cada actualización realizada en Anti-Gravity.',
      },
      {
        category: 'feature',
        text: 'Soporte completo para los botones Atrás y Adelante del navegador web y gestos móviles en toda la app (#pestaña).',
      },
      {
        category: 'improvement',
        text: 'Cierre automático de modales y asistentes al presionar el botón Atrás del navegador sin salir de la pestaña.',
      },
      {
        category: 'improvement',
        text: 'Botones táctiles de Atrás y Adelante añadidos en la barra superior al lado del menú para tablets y PWA.',
      },
    ],
  },
  {
    version: '2.4.0',
    buildCode: '2026.10.16.240',
    date: '16 de Octubre, 2026',
    title: 'Autenticación Simplificada por ID de Congregación y PIN Personal',
    isCurrent: false,
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'security',
        text: 'Ingreso directo para publicadores utilizando únicamente el ID canónico de Congregación y su PIN Personal emitido por los ancianos.',
      },
      {
        category: 'security',
        text: 'Guardián de sesión reactivo en tiempo real: cierre de sesión automático si el PIN es revocado o modificado en la nube.',
      },
      {
        category: 'fix',
        text: 'Protección estricta de la sesión de Coordinador para evitar revocaciones accidentales en búsquedas del directorio.',
      },
      {
        category: 'improvement',
        text: 'Directorio de PINs unificado con búsqueda rápida y generación aleatoria de PINs de 4 dígitos.',
      },
    ],
  },
  {
    version: '2.3.0',
    buildCode: '2026.10.15.230',
    date: '15 de Octubre, 2026',
    title: 'Pocket Mode Teocrático, Códigos QR y Enlaces Directos',
    isCurrent: false,
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'feature',
        text: 'Modo Bolsillo ("Pocket Mode") con enlace directo parametrizado para publicadores (?cong=...&pub=...&pin=...).',
      },
      {
        category: 'feature',
        text: 'Confirmación instantánea de asignaciones teocráticas en 1-clic con enlace de WhatsApp.',
      },
      {
        category: 'feature',
        text: 'Tarjetas digitales de territorio individuales accesibles mediante código QR o enlace corto (?territorio=01).',
      },
      {
        category: 'improvement',
        text: 'Limpieza automática de credenciales sensibles en la barra de URL tras inicio de sesión exitoso.',
      },
    ],
  },
  {
    version: '2.2.0',
    buildCode: '2026.10.14.220',
    date: '14 de Octubre, 2026',
    title: 'Sincronización en la Nube y Respaldo Híbrido',
    isCurrent: false,
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'feature',
        text: 'Conexión y sincronización en la nube mediante Supabase y Firebase para respaldar datos de congregaciones.',
      },
      {
        category: 'feature',
        text: 'Descarga y restauración manual de copias de seguridad en formato JSON cifrado/estructurado.',
      },
      {
        category: 'improvement',
        text: 'Banner interactivo de estado de conexión con soporte y sincronización offline.',
      },
    ],
  },
  {
    version: '2.1.0',
    buildCode: '2026.10.12.210',
    date: '12 de Octubre, 2026',
    title: 'Formularios Oficiales S-21, S-88, S-89 e Informes S-1',
    isCurrent: false,
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'feature',
        text: 'Módulo de Tarjetas de Registro de Publicador (S-21) con historial anual y cálculo de promedios.',
      },
      {
        category: 'feature',
        text: 'Generación e impresión en PDF de hojas de asignación S-89 para la reunión Vida y Ministerio.',
      },
      {
        category: 'feature',
        text: 'Generación del informe consolidado a la Sucursal S-1 para secretarios de congregación.',
      },
      {
        category: 'feature',
        text: 'Registro de Asistencia S-88 con promedios y visualización estadística gráfica.',
      },
    ],
  },
  {
    version: '2.0.0',
    buildCode: '2026.10.10.200',
    date: '10 de Octubre, 2026',
    title: 'Rediseño Integral Kongre, Tema Oscuro y PWA',
    isCurrent: false,
    environment: 'Google AI Studio (Anti-Gravity)',
    changes: [
      {
        category: 'feature',
        text: 'Lanzamiento de Kongre como Progressive Web App (PWA) instalable en teléfonos, tablets y computadoras.',
      },
      {
        category: 'feature',
        text: 'Sistema de Control de Acceso Basado en Roles (RBAC) para proteger la privacidad teocrática.',
      },
      {
        category: 'improvement',
        text: 'Tema oscuro de alto contraste y modo especial para la cabina de audio y acomodadores.',
      },
    ],
  },
];

/**
 * Retorna los detalles de diagnóstico del sistema para verificar que los cambios están desplegados
 */
export function getSystemDiagnosticInfo(): string {
  return [
    `Aplicación: Kongre`,
    `Versión: v${CURRENT_APP_VERSION}`,
    `Código de Compilación: ${CURRENT_BUILD_CODE}`,
    `Fecha de Publicación: ${BUILD_DATE}`,
    `Plataforma: ${BUILD_ENVIRONMENT}`,
    `URL: ${typeof window !== 'undefined' ? window.location.origin : ''}`,
    `Pestaña Activa: ${typeof window !== 'undefined' ? window.location.hash || '#inicio' : ''}`,
    `Navegador: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido'}`,
  ].join('\n');
}
