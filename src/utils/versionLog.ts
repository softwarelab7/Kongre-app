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

export const CURRENT_APP_VERSION = '2.10.5';
export const CURRENT_BUILD_CODE = '2026.10.21.3410';
export const BUILD_DATE = '21 de Octubre, 2026';
export const BUILD_ENVIRONMENT = 'Producción Cloud (Kongre)';

export const VERSION_HISTORY: VersionRecord[] = [
  {
    version: '2.10.5',
    buildCode: '2026.10.21.3410',
    date: '21 de Octubre, 2026',
    title: 'Botón de Modo Oscuro Sin Contenedor, Animación Fluida y Luna Blanca Nítida',
    isCurrent: true,
    highlight: 'Última versión compilada y activa',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Luna Blanca Brillante y Clara en Modo Oscuro: Se cambió el color de la luna y las estrellas en modo nocturno a blanco nítido (#FFFFFF), logrando alto contraste y visibilidad perfecta sobre la barra de navegación y páginas oscuras.',
      },
      {
        category: 'improvement',
        text: 'Eliminación del Contenedor de Modo Oscuro: Se retiró el fondo fijo, la cápsula, el borde y las sombras del botón, integrándolo limpiamente como icono de acción directa.',
      },
      {
        category: 'feature',
        text: 'Animación Original Preservada al 100%: Transiciones con física bezier completa, expansión del disco solar a lunar, desvanecimiento angular de rayos y aparición sutil de estrellas.',
      },
    ],
  },
  {
    version: '2.10.4',
    buildCode: '2026.10.21.3400',
    date: '21 de Octubre, 2026',
    title: 'Auditoría Integral y Persistencia Total de Configuraciones y Datos en Supabase',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Persistencia Completa de Configuración en Supabase: Se corrigió el proceso de guardado para enviar siempre la configuración resuelta y validada completa (resolvedSettings), evitando pérdida de parámetros como días, horarios, PIN hash, dirección o preferencias de PDF.',
      },
      {
        category: 'improvement',
        text: 'Sincronización Total de Todos los Módulos Teocráticos: Se integraron en el payload cifrado AES-256-GCM y en la sincronización bidireccional de Supabase todos los datos de grupos de predicación, deberes, discursantes salientes, salidas al servicio, turnos de carritos, informes mensuales, visita del superintendente, memorial, asambleas, eventos, programas CLM, panel eléctrico (breakers), fichas de mantenimiento, solicitudes de precursores e informes S-1 a la sucursal.',
      },
      {
        category: 'improvement',
        text: 'Guardado Automático en Tiempo Real: Las acciones de Mantenimiento del Salón, Panel Eléctrico, Hospitalidad, Precursores Auxiliares e Informes Sucursal ahora disparan inmediatamente persistencia sincronizada a Supabase con debounce inteligente.',
      },
      {
        category: 'security',
        text: 'Cola Offline Robusta con Respaldo Fidedigno: Las modificaciones encoladas sin internet ahora capturan el estado completo consolidado de la congregación, garantizando que al reconectar se transfieran fielmente a Supabase.',
      },
    ],
  },
  {
    version: '2.10.3',
    buildCode: '2026.10.21.3300',
    date: '21 de Octubre, 2026',
    title: 'Eliminación del Diálogo "¿Quién eres?" al Acceder con PIN',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Eliminación del Modal "¿Quién eres?": Se removió por completo el diálogo emergente que solicitaba el nombre tras iniciar sesión con PIN personal o genérico, permitiendo un acceso directo, ágil y sin interrupciones.',
      },
    ],
  },
  {
    version: '2.10.2',
    buildCode: '2026.10.21.3200',
    date: '21 de Octubre, 2026',
    title: 'Corrección Definitiva del Icono Oficial de Kongre en Pantalla de Inicio de iPhone (iOS Safari)',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Icono Oficial en iPhone / iPad (iOS SpringBoard): Regeneración de todos los iconos de inicio (apple-touch-icon, 180x180, 192x192, 512x512) en formato PNG RGB de 24 bits (colorType 2, sin canal alfa ni paleta indexada) con las proporciones exactas del isotipo oficial de la Guía de Marca.',
      },
      {
        category: 'fix',
        text: 'Incrustación Base64 en Memoria (Zero-Network Fetch): Los enlaces <link rel="apple-touch-icon"> y el manifiesto PWA incluyen ahora el PNG oficial en formato data:image/png;base64 y useCredentials: true, evitando que el proxy de autenticación bloquee la descarga del icono cuando iOS Safari crea el acceso directo.',
      },
      {
        category: 'improvement',
        text: 'Asistente de Instalación iOS Inteligente (PWAInstallButton): Detección automática cuando la app se abre dentro del iframe de vista previa (aistudio.google.com) con botón directo para abrir Kongre en Safari a pantalla completa antes de agregar a inicio.',
      },
    ],
  },
  {
    version: '2.10.1',
    buildCode: '2026.10.21.3100',
    date: '21 de Octubre, 2026',
    title: 'Iconos PWA, Pantallas de Carga iOS y Nuevo Selector de Tema Animado (2 Modos: Claro y Oscuro)',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Conmutador de Tema Animado Sol ⇄ Luna: Transición SVG dinámica y fluida entre sol y luna creciente con estrellas, enfocado exclusivamente en dos modos óptimos (Claro y Oscuro).',
      },
      {
        category: 'feature',
        text: 'Accesos Directos Nativos PWA (App Shortcuts): Atajos en icono instalado para Programación, Territorios, Asistencia y Anuncios.',
      },
      {
        category: 'improvement',
        text: 'Pantallas de Carga para iOS (Splash Screens): Cobertura completa para todos los modelos de iPhone y iPad con iconos monocromáticos y safari-pinned-tab.',
      },
      {
        category: 'improvement',
        text: 'Badges monocromáticos optimizados para notificaciones Web Push y Service Worker en segundo plano.',
      },
    ],
  },
  {
    version: '2.10.0',
    buildCode: '2026.10.21.3000',
    date: '21 de Octubre, 2026',
    title: 'Suite de Funciones para Publicadores, Gestos Táctiles (Swipe) y Menú Independiente de Panorama General',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Suite de Funciones para Publicadores en el Menú Principal (Mi Ministerio): Nuevo cronómetro de predicación persistente en vivo (sigue contando con la pantalla apagada o pestaña cerrada), registro de horas y minutos, meta mensual configurable (10h, 15h, 30h, 50h, 100h) y registro manual de salidas.',
      },
      {
        category: 'feature',
        text: 'Agenda de Revisitas y Personas Interesadas: Tarjetas de seguimiento con ubicación directa a Google Maps, enlace a WhatsApp, tema conversado, preguntas pendientes, publicaciones dejadas, botón de registro rápido de visitas hoy y conversión a Estudio Bíblico en 1 clic.',
      },
      {
        category: 'feature',
        text: 'Control de Cursos Bíblicos: Registro detallado de estudiantes, publicación de estudio (¡Disfrute de la vida para siempre!), control de lección actual con barra de avance, horario fijo, registro de sesiones del mes y metas espirituales.',
      },
      {
        category: 'feature',
        text: 'Gestos Táctiles (Swipe) en Dispositivos Móviles: Deslizamiento desde el borde izquierdo (<= 45px) hacia la derecha para abrir el menú lateral (swipe-to-open) y deslizamiento hacia la izquierda para cerrarlo (swipe-to-close), con sensor táctil de borde y tirador visual con icono de flecha.',
      },
      {
        category: 'improvement',
        text: 'Menú Aparte para Panorama General: La vista estadística de la congregación (ResumenInicioTab) ahora cuenta con su propio apartado independiente en la barra lateral, cajón móvil y barra inferior, separando las estadísticas congregacionales del ministerio personal del publicador.',
      },
      {
        category: 'feature',
        text: 'Modo Atril con API de Pantalla Completa: Integración nativa con Fullscreen API del navegador con botón dedicado de "Pantalla completa" y sincronización automática de estado al salir con la tecla Esc o gestos del sistema.',
      },
      {
        category: 'improvement',
        text: 'Ergonomía Móvil en Pantallas Clave: Navegación inferior táctil por secciones en el cronómetro de presidencia, mini-cronómetro sticky al consultar notas o el programa, selectores con bottom-sheet táctil y limpieza de elementos redundantes en las filas del programa.',
      },
    ],
  },
  {
    version: '2.9.2',
    buildCode: '2026.10.21.2902',
    date: '21 de Octubre, 2026',
    title: 'Suscripción a Notificaciones Web Push en Segundo Plano (Con App Cerrada)',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Nuevo Service Worker dedicado (/push-sw.js) con soporte para Web Push API (PushManager + VAPID), Periodic Background Sync, Notification Triggers del sistema operativo y almacenamiento autónomo en IndexedDB para enviar recordatorios incluso cuando la aplicación o pestaña está cerrada.',
      },
      {
        category: 'feature',
        text: 'Nuevo Centro de Suscripción Push (PushSubscriptionModal) en el Portal del Publicador y en Mi Perfil: permite suscribir o pausar el navegador actual, personalizar días de anticipación (24h, 48h, 72h, 7 días), elegir la hora exacta de aviso, activar recordatorio adicional el mismo día (3h antes) y visualizar la cola de disparos programados.',
      },
      {
        category: 'feature',
        text: 'Simulador interactivo "Probar con App Cerrada (5s)" con cuenta regresiva para que el publicador minimice el navegador o bloquee su pantalla y verifique la recepción en segundo plano con botones de acción ("Ver mis asignaciones" y "Enterado").',
      },
      {
        category: 'improvement',
        text: 'Cobertura integral de recordatorios automáticos: ahora abarca partes de Entre Semana (titular, ayudante, sala auxiliar, presidente y oraciones), Fin de Semana (presidente, discurso público, conductor y lector de La Atalaya), deberes/aseo del Salón y turnos de predicación pública con carritos.',
      },
    ],
  },
  {
    version: '2.9.1',
    buildCode: '2026.10.21.2901',
    date: '21 de Octubre, 2026',
    title: 'Bóveda y Rellenador 100% Local de Formatos Oficiales (S-21, S-89, S-140, S-88) y Conexión Integral de Publicadores',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Nuevo Centro de Formatos Oficiales 100% en Local (LocalOfficialFormsCenter): en cumplimiento con la directriz de la sucursal, ningún formato oficial se guarda ni sincroniza en servidores privados ni en la nube; se cargan desde el dispositivo del hermano y se rellenan exclusivamente en memoria local.',
      },
      {
        category: 'feature',
        text: 'Rellenado automático local (pdf-lib) de tarjetas S-21 (por publicador individual, por grupo de servicio o toda la congregación en lote), hojas de asignación S-89 (1x1 y 4x1), programa S-140, asistencia S-88 y territorios S-13 con vista previa integrada.',
      },
      {
        category: 'feature',
        text: 'Inspector y Editor Universal de Campos AcroForm en tiempo real para revisar o personalizar cualquier campo de texto o casilla de verificación de cualquier formulario PDF oficial cargado.',
      },
      {
        category: 'improvement',
        text: 'Sincronización bidireccional integral de la ficha del publicador (PublisherEditor) con el resto de la app: tarjetas S-21 (s21_records ↔ monthlyReports), responsabilidades en Grupos de Servicio (Capitán/Auxiliar ↔ preachingGroups), estados de precursorado en S-1/S-21, ausencias y contactos de emergencia.',
      },
    ],
  },
  {
    version: '2.9.0',
    buildCode: '2026.10.20.2900',
    date: '20 de Octubre, 2026',
    title: 'Gestor Dedicado de Roles Teocráticos a Pantalla Completa y Nuevo Sistema de Íconos',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Transformación del Gestor de Roles de ventana emergente (modal) a una vista dedicada de página completa (#roles), eliminando bordes limitados y barras de desplazamiento internas.',
      },
      {
        category: 'feature',
        text: 'Incorporación de 5 tarjetas interactivas de estadísticas KPI que funcionan como filtros inmediatos por categoría (Total Hermanos, Ancianos, Siervos Ministeriales, Con PIN y Sin PIN).',
      },
      {
        category: 'improvement',
        text: 'Selectores de los 16 roles teocráticos sin recorte de texto, píldoras de PIN con alternador de visibilidad (••••), regeneración de 4-6 dígitos y copiado de credenciales portátiles.',
      },
      {
        category: 'feature',
        text: 'Nuevo submódulo de Cambio Rápido de Sesión (Mi Sesión) con teclado numérico para entrega ágil de turnos durante reuniones presenciales en el Salón.',
      },
      {
        category: 'feature',
        text: 'Panel de Cuentas Nube & QR con gestión de aprobaciones de cuentas vinculadas y Matriz interactiva de permisos departamentales teocráticos.',
      },
      {
        category: 'improvement',
        text: 'Integración del nuevo catálogo de íconos SVG temáticos y animados para departamentos y secciones (modo claro, oscuro e índigo).',
      },
      {
        category: 'fix',
        text: 'Corrección del selector de día de reunión entre semana y fin de semana en el asistente de bienvenida y registro de congregación.',
      },
      {
        category: 'fix',
        text: 'Ajuste del servicio de sincronización offline con Supabase en Modo Demo para evitar alertas intrusivas.',
      },
    ],
  },
  {
    version: '2.8.12',
    buildCode: '2026.10.20.2812',
    date: '20 de Octubre, 2026',
    title: 'Rediseño del Menú Móvil y Optimización Integral de Interfaz para Teléfonos',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Rediseño completo del panel lateral de Menú en móvil: cabecera unificada en una sola fila, eliminación de bloques fijos redundantes y más del 80% de la pantalla dedicada a las secciones y departamentos.',
      },
      {
        category: 'improvement',
        text: 'Reubicación de Utilidades Rápidas (QR, PIN, Invitaciones, Auditoría) al final de la lista desplazable y compactación del pie del menú en una única barra inferior.',
      },
      {
        category: 'improvement',
        text: 'Optimización móvil de la barra superior (Navbar), franja de Modo Demo (DemoBanner) y barra de navegación inferior con soporte para área segura (safe-area-inset-bottom).',
      },
      {
        category: 'improvement',
        text: 'Adaptación responsiva del Programa VMC (ClmScheduleView), Calendario General (CalendarScheduleView y React Big Calendar), Panorama General y Directorio de Publicadores para pantallas de 360px–430px.',
      },
    ],
  },
  {
    version: '2.8.11',
    buildCode: '2026.10.20.2811',
    date: '20 de Octubre, 2026',
    title: 'Eliminación Completa de Funciones de IA Externa y Operación 100% Local Determinista',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Eliminación completa de la integración con Gemini AI (servicio, clave API y llamadas externas) para garantizar privacidad total sin envío de datos a modelos de IA externos.',
      },
      {
        category: 'improvement',
        text: 'Simplificación de Ajustes de la Congregación, Tablero de Anuncios, Programa VMC e Importador de Guía de Actividades (MWB) utilizando exclusivamente algoritmos deterministas locales.',
      },
    ],
  },
  {
    version: '2.8.10',
    buildCode: '2026.10.20.2810',
    date: '20 de Octubre, 2026',
    title: 'Capa 6 de Seguridad: Invitaciones Hasheadas en Nube, Protección Anti-Formula-Injection CSV, Guardia RBAC de Modales y Enlaces Firmados',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Cifrado en reposo (kgr_v1:) de invitaciones y sesiones de dispositivos en localStorage, y enmascaramiento con hash SHA-256 (codeHash) de invitaciones en payload_public de Supabase.',
      },
      {
        category: 'security',
        text: 'Guardia de control de acceso (RBAC) en rutas hash (#?modal=...) y dentro de PublisherPinsModal, InvitationManagerModal, AccountLinkRequestsModal y AuditLogModal.',
      },
      {
        category: 'security',
        text: 'Protección contra Inyección de Fórmulas CSV / Excel (CWE-1236) al exportar directorios y programas, y sanitización anti-XSS al importar archivos CSV.',
      },
      {
        category: 'security',
        text: 'Firma criptográfica SHA-256 (sig) y limpieza automática de URL en enlaces de confirmación de asignaciones en 1 clic, más limpieza integral de tokens al cerrar sesión.',
      },
    ],
  },
  {
    version: '2.8.9',
    buildCode: '2026.10.20.289',
    date: '20 de Octubre, 2026',
    title: 'Blindaje Integral de Seguridad Criptográfica en 5 Capas (Zero-Knowledge, Anti-Brute-Force, Tokens QR, Auditoría SHA-256 y Respaldos Firmados)',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Capa 1 y 2: Hashing criptográfico SHA-256/PBKDF2 de PINs personales, cifrado en reposo en localStorage (kgr_v1:) y protección anti-fuerza bruta con bloqueo exponencial.',
      },
      {
        category: 'security',
        text: 'Capa 3: Códigos de invitación con entropía CSPRNG, tokens de enlace/QR cifrados y autenticados (kgr_tk1_) con limpieza inmediata de URL, y firma criptográfica de sesiones de rol.',
      },
      {
        category: 'security',
        text: 'Capa 4: Verificación criptográfica de propiedad antes de sobrescribir o borrar registros en Supabase, cifrado en reposo de la cola offline IndexedDB, y cadena de integridad SHA-256 en el registro de auditoría.',
      },
      {
        category: 'security',
        text: 'Capa 5: Sello de integridad SHA-256 en copias de seguridad exportadas, sanitización anti-Prototype-Pollution/XSS al restaurar respaldos, y protección en reposo de directorios de roles y sesiones.',
      },
    ],
  },
  {
    version: '2.8.8',
    buildCode: '2026.10.19.288',
    date: '19 de Octubre, 2026',
    title: 'Optimización de Roles Teocráticos, Ingreso por ID/PIN entre Dispositivos y Códigos de Invitación QR',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Conexión Multidispositivo con ID y PIN de Congregación: transferencia directa del PIN hacia loadCongregationFromCloud para permitir el descifrado inmediato desde teléfonos o navegadores nuevos.',
      },
      {
        category: 'improvement',
        text: 'Verificación de PIN Personal y Roles en Payload Público: enriquecido el payload público cifrado con el PIN de Congregación para incluir de forma segura los hashes de PINs personales, roles e invitaciones activas.',
      },
      {
        category: 'feature',
        text: 'Códigos de Invitación Portátiles y Autodetección por Código QR: sincronización automática de invitaciones con Supabase y detección automática al escanear el código QR.',
      },
      {
        category: 'fix',
        text: 'Asignación Exacta de Roles para Siervos Ministeriales: corregida la inferencia de rol por defecto para siervos ministeriales sin departamento asignado.',
      },
    ],
  },
  {
    version: '2.8.7',
    buildCode: '2026.10.19.287',
    date: '19 de Octubre, 2026',
    title: 'Vista Previa de Documentos PDF antes de Descargar y Orientación de Página',
    isCurrent: false,
    highlight: 'Última versión compilada y activa',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Selector de orientación de página (Vertical / Retrato y Horizontal / Paisaje) tanto para el Programa Mensual como para las Hojas de Asignación S-89, con dimensiones exactas en milímetros.',
      },
      {
        category: 'feature',
        text: 'Generación de vista previa real del documento PDF antes de la descarga mediante visor PDF integrado y modal de previsualización a pantalla completa con cambio rápido de orientación y tamaño (Carta / A4).',
      },
      {
        category: 'improvement',
        text: 'Maqueta de hoja interactiva con proporciones dinámicas según orientación, controles de zoom (75% a 120%) y soporte completo de modo oscuro.',
      },
      {
        category: 'improvement',
        text: 'Motor pdfGenerator actualizado con ajuste automático de líneas (splitTextToSize), numeración de páginas y estilos adaptados por plantilla y orientación.',
      },
    ],
  },
  {
    version: '2.8.6',
    buildCode: '2026.10.19.286',
    date: '19 de Octubre, 2026',
    title: 'Unificación de Barra Inferior, Términos Legales, Botón de Tema y Mejoras Móviles',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Redacción e integración del modal legal interactivo (TermsAndPrivacyModal) con los Términos de Uso Teocrático y la Política de Privacidad y Seguridad (arquitectura Zero-Knowledge AES-256-GCM).',
      },
      {
        category: 'improvement',
        text: 'Mejora y unificación del pie de página (AppFooter) tanto en la pantalla de bienvenida como dentro de la aplicación para PC y móvil, con estado de conexión en vivo, enlaces legales y acceso a Novedades.',
      },
      {
        category: 'improvement',
        text: 'Unificación del diseño del botón de modo oscuro (ThemeToggle) en cabecera móvil, bienvenida PC y barra de navegación principal con soporte para los 3 modos (Claro, Oscuro y Cabina A/V).',
      },
      {
        category: 'improvement',
        text: 'Pantalla de bienvenida móvil: incorporación de las Funciones de la App debajo de las opciones de inicio (ocultándose al entrar en subvistas) y eliminación del doble scroll en el registro de congregación.',
      },
    ],
  },
  {
    version: '2.8.5',
    buildCode: '2026.10.19.285',
    date: '19 de Octubre, 2026',
    title: 'Soporte Completo de Icono PWA en iPhone (iOS Apple Touch Icon)',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Corrección del icono en iPhone: generación de apple-touch-icon.png (180x180) con fondo 100% opaco índigo (#4C3AED) y sin canal alfa transparente, evitando que Safari muestre un cuadro negro o captura genérica.',
      },
      {
        category: 'improvement',
        text: 'Inclusión de todas las resoluciones oficiales de iOS: apple-touch-icon-180x180, apple-touch-icon-152x152, apple-touch-icon-167x167 y apple-touch-icon-precomposed en el HTML.',
      },
      {
        category: 'improvement',
        text: 'Creación de public/manifest.webmanifest y enlace explícito en index.html para compatibilidad PWA moderna con Safari en iOS 15, 16, 17 y 18.',
      },
      {
        category: 'improvement',
        text: 'Actualización de la guía paso a paso de instalación en iOS con previsualización del icono oficial de la app.',
      },
    ],
  },
  {
    version: '2.8.4',
    buildCode: '2026.10.18.284',
    date: '18 de Octubre, 2026',
    title: 'Estandarización de Marca Oficial Índigo #4C3AED y Optimización de Activos',
    isCurrent: false,
    highlight: 'Última versión compilada y activa',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Redefinición completa de la escala indigo de TailwindCSS con la paleta de marca (#4C3AED) mediante kongre-indigo.css.',
      },
      {
        category: 'improvement',
        text: 'Actualización del manifiesto PWA en vite.config.ts con tema oficial (#4C3AED) e iconos limpios (icon-192, icon-512, icon-maskable-512).',
      },
      {
        category: 'improvement',
        text: 'Estandarización de URLs absolutas en metadatos OpenGraph y Twitter Card para previsualización correcta en WhatsApp y redes.',
      },
      {
        category: 'fix',
        text: 'Depuración exhaustiva de colores hexadecimales residuales y remoción de archivos obsoletos en public/ (pwa-*, icon.svg, etc.).',
      },
      {
        category: 'improvement',
        text: 'Alineación de KongreLogo a la variante plana oficial para máxima fidelidad gráfica y consistencia.',
      },
    ],
  },
  {
    version: '2.8.3',
    buildCode: '2026.10.18.283',
    date: '18 de Octubre, 2026',
    title: 'Eliminación Total de Iconos v4 y Estandarización Teocrática',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Eliminación total del paquete de iconos v4 y archivos duplicados en /public/icons/ y /public/anim/, liberando más de 8 MB de precaché PWA.',
      },
      {
        category: 'improvement',
        text: 'Estandarización directa y nativa de iconografía con Lucide React en la pantalla de bienvenida y componentes del sistema.',
      },
      {
        category: 'fix',
        text: 'Remoción de componentes y utilidades redundantes (SectionIconsLinea, AnimIcon, Bienvenida) y depuración de animaciones CSS innecesarias.',
      },
    ],
  },
  {
    version: '2.8.2',
    buildCode: '2026.10.18.282',
    date: '18 de Octubre, 2026',
    title: 'Optimización de Espaciados en Bienvenida PC y Modo Demo Sin Bloqueos',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Optimización del diseño responsive en la pantalla de bienvenida de PC (hero compacto, tipografía fluida y tarjetas ajustadas para visibilidad sin scroll vertical).',
      },
      {
        category: 'fix',
        text: 'Aislamiento estricto de perfiles en Modo Demo: avatar limpio y predeterminado sin filtraciones de avatares de sesiones previas en localStorage.',
      },
      {
        category: 'security',
        text: 'Desactivación del bloqueo de sesión por PIN y del temporizador de inactividad mientras se use el Modo Demo para una navegación fluida.',
      },
      {
        category: 'improvement',
        text: 'Actualización y optimización de logotipos e isotipos vectoriales de alta definición en el directorio público.',
      },
    ],
  },
  {
    version: '2.8.1',
    buildCode: '2026.10.18.281',
    date: '18 de Octubre, 2026',
    title: 'Aislamiento Local del Modo Demo (Sin Conexión a Supabase)',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Desactivación total de peticiones de subida, descarga y suscripción en tiempo real a Supabase durante el Modo Demo para garantizar operación 100% local.',
      },
      {
        category: 'improvement',
        text: 'Ocultación del indicador de sincronización en la nube (OfflineSyncBadge) y de sincronizaciones periódicas automáticas cuando el Modo Demo está activo.',
      },
      {
        category: 'improvement',
        text: 'Inclusión de aviso informativo en Ajustes > Nube y en el modal de cola offline indicando que el modo demostración opera en memoria local sin conexión a Supabase.',
      },
    ],
  },
  {
    version: '2.8.0',
    buildCode: '2026.10.18.280',
    date: '18 de Octubre, 2026',
    title: 'Diseño Oficial de Bienvenida para PC / Escritorio (Kongre v3)',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Implementación del diseño de bienvenida para PC según la plantilla teocrática oficial con AnimatedLogo, selector de Modo Demo y botón de tema circular de 3 modos (Claro, Oscuro, Cabina A/V).',
      },
      {
        category: 'improvement',
        text: 'Columna de presentación con badge interactivo de destellos, titular con gradiente de marca y cuadrícula 2x2 de características con divisores sutiles y microanimaciones de trazo SVG.',
      },
      {
        category: 'improvement',
        text: 'Tarjeta de acceso rediseñada con estilos .card y .opt, asignación del icono del ojo a "Iniciar sesión con código de invitación" y retiro del acceso público de invitado.',
      },
      {
        category: 'improvement',
        text: 'Pie de página con enlaces a Términos de Uso, Política de Privacidad, estado de conectividad en línea y acceso al historial de cambios.',
      },
    ],
  },
  {
    version: '2.7.0',
    buildCode: '2026.10.18.270',
    date: '18 de Octubre, 2026',
    title: 'Dashboard Visual de Tendencias de Asistencia con Recharts',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Dashboard interactivo de tendencias históricas de asistencia a reuniones usando la librería Recharts (gráficos compuestos de barras y áreas continuas).',
      },
      {
        category: 'feature',
        text: 'Agrupación y análisis teocrático por Año de Servicio (Septiembre a Agosto) con comparativa entre reunión Entre Semana y Fin de Semana.',
      },
      {
        category: 'feature',
        text: 'Desglose detallado de canales: Asistencia Presencial vs. Zoom con porcentaje de distribución mensual y anual.',
      },
      {
        category: 'feature',
        text: 'Líneas de referencia de promedio histórico, métricas de pico máximo de asistencia y vista de tabla analítica con exportación a formato CSV.',
      },
      {
        category: 'improvement',
        text: 'Navegación fluida entre la vista de dashboard analítico y el registro mensual de asistencia (S-88) con selector rápido de meses.',
      },
    ],
  },
  {
    version: '2.6.0',
    buildCode: '2026.10.17.260',
    date: '17 de Octubre, 2026',
    title: 'Sincronización en Cola Offline con IndexedDB y Supabase',
    isCurrent: false,
    highlight: 'Versión previa estable',
    environment: 'Producción Cloud (Kongre)',
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
    environment: 'Producción Cloud (Kongre)',
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
        text: 'Documento oficial CHANGELOG.md para registrar metódicamente cada actualización realizada en el sistema.',
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
    environment: 'Producción Cloud (Kongre)',
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
    environment: 'Producción Cloud (Kongre)',
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
    environment: 'Producción Cloud (Kongre)',
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
    environment: 'Producción Cloud (Kongre)',
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
    environment: 'Producción Cloud (Kongre)',
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
