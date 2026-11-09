import type { VersionRecord } from '../utils/versionLog';

export const VERSION_HISTORY: VersionRecord[] = [
  {
    version: '0.1.0-alpha.46',
    buildCode: '2026.11.09.8046',
    date: '9 de Noviembre, 2026',
    title: 'Criptografía V2 Estricta, Concurrencia Optimista CAS, Cifrado en Cuentas y Optimización Radical de Carga (170 kB)',
    isCurrent: true,
    highlight: 'Eliminación completa de esquemas criptográficos legados y unificación en PBKDF2 600k (v2:); compare-and-swap atómico obligatorio (expected_version) en sincronización; blindaje AES-256-GCM (kgr_sec5:) de transacciones y auditorías contables; reducción del bundle inicial de 4.4 MB a 170 kB mediante code-splitting con React.lazy; y fallback de ofuscación local kgr_sec5d.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'security',
        text: 'Limpieza de Compatibilidad Heredada y Unificación V2 (crypto.ts, syncApi.ts, core.ts): Eliminación total de tokens legados a 100k iteraciones, unificación de normalización de PIN con preservación de símbolos (normalizePinV2), rechazo estricto de textos sin prefijo "v2:" y eliminación de lectores antiguos kgr_sec2/3/4.',
      },
      {
        category: 'security',
        text: 'Concurrencia Optimista Estricta (HTTP 428 y CAS): El servidor exige siempre expected_version en sincronizaciones push (updateRowIfVersion) eliminando condiciones de carrera y sobrescrituras involuntarias entre dispositivos.',
      },
      {
        category: 'security',
        text: 'Blindaje en Reposo de Cuentas y Donaciones (sensitiveFields.ts, CuentasTab.tsx): Cifrado automático con AES-256-GCM (kgr_sec5:) de comprobantes, donantes, notas de transacciones y observaciones de auditorías trimestrales.',
      },
      {
        category: 'security',
        text: 'Fallback Resiliente kgr_sec5d: En caso de bloqueo de IndexedDB, se aplica cifrado AES-256-GCM con sal de dispositivo en lugar de esquemas propietarios, re-cifrando automáticamente a kgr_sec5 al recuperar la bóveda.',
      },
      {
        category: 'improvement',
        text: 'Rendimiento y Code-Splitting Modular (App.tsx): Reducción drástica del tamaño del bundle JavaScript inicial de 4.4 MB a solo 170 kB (41 kB gzip) mediante carga diferida dinámica (React.lazy + Suspense) de pantallas y modales pesados.',
      },
      {
        category: 'improvement',
        text: 'Desacople Arquitectónico del Historial de Versiones: Aislamiento del catálogo histórico de cambios en un módulo diferido (versionHistory.ts), eliminando 2.400 líneas de texto estático del bundle crítico.',
      },
      {
        category: 'improvement',
        text: 'Alineación de Versiones Multiplataforma: Sincronización oficial del número de versión a v0.1.0-alpha.46 en Web (package.json) y Desktop Tauri (Cargo.toml y tauri.conf.json).',
      },
    ],
  },
  {
    version: '0.1.0-alpha.45',
    buildCode: '2026.11.05.8045',
    date: '5 de Noviembre, 2026',
    title: 'Blindaje de Autenticación a 600k PBKDF2, Concurrencia Optimista (Anti-Conflictos) y Protección de Datos Sensibles',
    isCurrent: false,
    highlight: 'Paridad criptográfica completa elevando tokens de autenticación de PIN a 600.000 iteraciones PBKDF2; migración transparente automática de congregaciones existentes; detección de colisiones y conflictos concurrentes en push (HTTP 409) con ETag/versión; soporte de passphrases de hasta 24 caracteres; sanitización rigurosa de publicadores en todo el almacenamiento local y CSPRNG criptoseguro.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'security',
        text: 'Blindaje de Tokens de Autenticación a 600.000 iteraciones (syncApi.ts): Elevación de las iteraciones PBKDF2 de tokens de autenticación para eliminar asimetrías de fuerza bruta frente al cifrado AES-256-GCM, con derivación dual que soporta migración transparente e inmediata desde las 100.000 iteraciones heredadas.',
      },
      {
        category: 'security',
        text: 'Concurrencia Optimista, Compare-and-Swap y Auto-Reconciliación (core.ts, index.ts, supabaseSyncService.ts): Implementación de Compare-and-Swap atómico en servidor (updateRowIfVersion) con normalización semántica de timestamps (versionsEqual) y auto-fusión transparente en cliente ante HTTP 409.',
      },
      {
        category: 'security',
        text: 'Cifrado en Reposo de Visitas de Pastoreo (sensitiveFields.ts, CongregationContext.tsx, shepherding-at-rest.test.ts): Cifrado granular en reposo de notas confidenciales, escrituras sugeridas y motivo/enfoque de pastoreo en localStorage, con aceptación transparente de datos heredados.',
      },
      {
        category: 'security',
        text: 'Soporte de Passphrases y PINs Extendidos de Alta Entropía (congregationCredentials.ts): Ampliación del formateador de PIN de congregación hasta 24 caracteres en bloques cuádruples (XXXX-XXXX-XXXX...), facilitando el uso de frases de paso inmunes a ataques offline por GPU.',
      },
      {
        category: 'security',
        text: 'Sanitización Estricta de Almacenamiento Local (CongregationContext.tsx, sensitiveFields.ts): Aseguramiento de que todas las rutas de persistencia en localStorage ejecuten sanitizePublishersForLocalStorage, suprimiendo PINs en claro y cifrando campos médicos y de emergencia.',
      },
      {
        category: 'fix',
        text: 'CSPRNG Criptográfico en Deduplicación (publisherDeduplication.ts): Sustitución de Math.random() por crypto.getRandomValues() / CSPRNG de alta entropía para códigos inmutables de publicador.',
      },
      {
        category: 'improvement',
        text: 'Transparencia Normativa y Privacidad (SEGURIDAD.md, TermsAndPrivacyModal.tsx, public/privacy.html): Clarificación explícita del modelo E2EE a nivel de congregación, RBAC en cliente con tokens firmados (kgr_srt1), roadmap de sobres departamentales y salvaguardas reforzadas para datos de especial sensibilidad (RGPD Art. 9 / Ley 1581).',
      },
    ],
  },
  {
    version: '0.1.0-alpha.44',
    buildCode: '2026.11.04.8044',
    date: '4 de Noviembre, 2026',
    title: 'Territorios y Cartografía S-13: Geocerca GPS en Tiempo Real, Control Dinámico de Manzanas, Registro Georreferenciado y Radar de Cobertura',
    isCurrent: false,
    highlight: 'Detección de geocerca en vivo mediante GPS con algoritmo Ray-Casting que indica si el publicador está dentro del polígono o su distancia exacta al límite; control dinámico de manzanas en 3 estados (pendiente, en curso, completada) con notas de campo para casas No en Casa (NH) y reporte por WhatsApp en 1-clic; captura satelital directa para domicilios de No Visitar y Radar S-13 con detección de territorios desatendidos (> 1 año sin predicar).',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'feature',
        text: 'Geocerca Satelital GPS en Vivo (TerritoryCardMap.tsx, TerritoryMapUtils.ts): Algoritmo geométrico Ray-Casting y cálculo de distancia euclidiana esferoide en metros que evalúa en tiempo real si el publicador se encuentra dentro del territorio asignado o a qué distancia está de la acera/calle perimetral.',
      },
      {
        category: 'feature',
        text: 'Gestor Dinámico de Manzanas y Modo Campo (DigitalTerritoryModal.tsx): Reemplazo de la cuadrícula estática por un sistema dinámico configurable (1 a 30 manzanas) con estados progresivos (Pendiente, En curso hoy, Completada), barra porcentual de avance e integración de notas para casas "No en casa" (NH) y revisitas con persistencia local.',
      },
      {
        category: 'improvement',
        text: 'Informe de Avance de Ministerio en 1-Clic por WhatsApp (DigitalTerritoryModal.tsx): Botón directo para que el publicador envíe un resumen estructurado y amable de su predicación al Siervo de Territorios o conductor de grupo con desglose de manzanas y domicilios de No Visitar respetados.',
      },
      {
        category: 'feature',
        text: 'Georreferenciación GPS Directa para Casas «No Visitar» (DigitalTerritoryModal.tsx, TerritoriosTab.tsx): Botón "Capturar mi ubicación GPS actual" al reportar un hogar que solicitó no ser visitado, fijando coordenadas exactas en el mapa y permitiendo abrir la ubicación en Google Maps.',
      },
      {
        category: 'improvement',
        text: 'Radar S-13 y Filtro de Territorios Desatendidos (TerritoriosTab.tsx, khsPublicWitnessingEngine.ts): Detección proactiva de territorios con más de 12 meses sin ser cubiertos en el año de servicio con botón de asignación inmediata, y recordatorio amistoso por WhatsApp para territorios con más de 4 meses de tenencia.',
      },
      {
        category: 'improvement',
        text: 'Configuración de Manzanas en Creación y Edición (TerritoriosTab.tsx): Campo dedicado para especificar la cantidad estimada de manzanas al crear o editar territorios, con visor resumido en la ficha técnica S-13.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.43',
    buildCode: '2026.11.04.8043',
    date: '4 de Noviembre, 2026',
    title: 'Optimización de Agenda Teocrática, Deduplicación de Asignaciones, Cifrado en Reposo Resiliente y Blindaje del Directorio',
    isCurrent: false,
    highlight: 'Barra de herramientas despejada y simplificada en Agenda y Asignaciones con controladores de clic exterior, deduplicación estricta de IDs en partes de reunión para evitar colisiones en React, catálogo enfocado de bosquejos y programas oficiales, clave de cifrado en reposo V4 desacoplada de tokens volátiles de sesión y blindaje total contra fugas de texto cifrado en tarjetas del directorio.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'improvement',
        text: 'Optimización de la Barra de Herramientas de Agenda Teocrática (ScheduleTab.tsx, ClmScheduleView.tsx): Interfaz despejada y fluida para alternar reuniones, modos y filtros con controladores de cierre al hacer clic fuera (click-outside handlers).',
      },
      {
        category: 'security',
        text: 'Cifrado en Reposo Resiliente V4 (sensitiveFields.ts, CongregationContext.tsx): Derivación de la clave de reposo basada en la sal del dispositivo y entropía no extraíble de IndexedDB, evaluador multi-clave retrocompatible y descifrado garantizado independientemente del estado de inicio de sesión.',
      },
      {
        category: 'fix',
        text: 'Blindaje Visual del Directorio de Publicadores (PublishersTab.tsx, usePublisherForm.ts): Erradicación de cadenas crudas de cifrado (kgr_sec4:...) en pantalla, protección contra desbordamientos con truncamiento estricto y descifrado automático en el formulario de edición.',
      },
      {
        category: 'improvement',
        text: 'Deduplicación de Partes y Sanitización de Datos (clmBridge.ts, clmDefaultProgram.ts, CongregationContext.tsx): Eliminación de IDs duplicados en partes de reunión y prevención de advertencias de claves repetidas en React al sincronizar reuniones.',
      },
      {
        category: 'improvement',
        text: 'Aislamiento del Catálogo de Bosquejos y Programas (OrganizedImportModal.tsx, organizedSync.ts): Pestañas reorganizadas y aislamiento CSS para garantizar una visualización impecable sin interferencias de superposición.',
      },
      {
        category: 'feature',
        text: 'Generación Resiliente Dual de Documentos Oficiales en 1-Clic (TarjetasS21Tab.tsx, S89SlipsTab.tsx, ClmScheduleView.tsx, ScheduleTab.tsx, pdfGenerator.ts): Descarga inmediata y sin bloqueo de tarjetas S-21 y hojas S-89; si el usuario no tiene cargada la plantilla oficial de JW Hub, el sistema genera automáticamente el PDF vectorial nativo de alta resolución en un solo clic.',
      },
      {
        category: 'feature',
        text: 'Centro Inteligente de Avisos y Recordatorios Teocráticos Automatizados (ConflictsModal.tsx, Navbar.tsx, theocraticReminders.ts): Detección en tiempo real de asignaciones sin confirmar (<48h), turnos de carritos sin cubrir, recordatorios de informes S-4 al cierre de mes y comprobantes de cuentas pendientes con acciones en 1-clic por WhatsApp y notificaciones de escritorio del sistema.',
      },
      {
        category: 'feature',
        text: 'Centro de Transferencia Directa Local Salón P2P & QR Offline-First (LocalP2PTransferModal.tsx, p2pTransferEngine.ts): Intercambio instantáneo de datos sin conexión a internet entre dispositivos en el Salón del Reino mediante compresión Deflate para Código QR de alta densidad, canal P2P WebRTC local, emisión inmediata entre ventanas y fusión diferencial inteligente.',
      },
      {
        category: 'fix',
        text: 'Sanitización Defensiva Universal en Directorio (PublishersTab.tsx): Blindaje de correo, domicilio, municipio y colonia contra cadenas crudas de cifrado en reposo para prevenir solapamientos visuales y anomalías en tarjetas Bento.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.42',
    buildCode: '2026.10.31.8042',
    date: '31 de Octubre, 2026',
    title: 'Revocación Inmediata de Credenciales, Panel de Auditoría para Ancianos, Panel Offline con IndexedDB, Visor PDF y Autoasignación de Fin de Semana',
    isCurrent: false,
    highlight: 'Modal teocrático de revocación y reemplazo asistido de credenciales con trazabilidad, panel de auditoría de canjes y hardware para ancianos, centro OfflineDashboard sobre IndexedDB, previsualizador interactivo PDF con react-pdf, autoasignación integral de reuniones y anillo reactivo de sincronización en cabecera.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'improvement',
        text: 'Erradicación Total de Diálogos Nativos del Navegador (ModalContext.tsx, StudyInspectorPanel.tsx, etc.): Reemplazo de todos los avisos de "localhost dice..." (window.confirm / window.alert) por modales estilizados con diseño Kongre y notificaciones toast no invasivas.',
      },
      {
        category: 'feature',
        text: 'Botón Flotante Reactivo de Retorno al Inicio (ScrollToTopButton.tsx, App.tsx): Botón interactivo con anillo SVG de progreso de desplazamiento, micro-animaciones fluidas con motion/react y posicionamiento adaptativo para móvil y panel de estudio acoplado.',
      },
      {
        category: 'improvement',
        text: 'Rediseño del Panel de Estudio y Notas Teocráticas JW (StudyInspectorPanel.tsx): Optimización visual táctil neutra enfocada en notas personales, anotaciones de estudio y referencias bíblicas sin saturación visual.',
      },
      {
        category: 'security',
        text: 'Revocación y Sustitución de Credenciales Teocráticas (CredentialRevocationModal.tsx, SecurityContext.tsx): Modal teocrático para invalidar de inmediato credenciales y PINs comprometidos u olvidados, con motivos justificados (olvido, extravío/robo, rotación, sospecha de compromiso, desasociación) y generación instantánea de nuevo PIN seguro.',
      },
      {
        category: 'feature',
        text: 'Panel de Auditoría de Códigos y Canjes para Ancianos (ElderCodeRedemptionsPanel.tsx, AccessCredentialsSection.tsx): Visualización de dispositivos vinculados (móvil, tablet, PC), navegadores, sistemas operativos y fecha/hora de canje para cada publicador, con historial de revocaciones y rotación asistida.',
      },
      {
        category: 'feature',
        text: 'Gestión de Dispositivos y Solicitud de Cambio de PIN (ProfileDevicesAndCodesSection.tsx, PinManagementModal.tsx, pinChangeRequestsService.ts): Panel en el perfil del publicador con sesiones activas, ubicación estimada segura, cierre remoto de sesión y solicitudes teocráticas de cambio de PIN con respaldo en Supabase.',
      },
      {
        category: 'feature',
        text: 'Centro de Diagnóstico y Estado Offline (OfflineDashboard.tsx): Monitor integral de la base de datos local en IndexedDB con recuento de registros en caché, inspección de la cola de sincronización y sincronización manual inmediata.',
      },
      {
        category: 'feature',
        text: 'Visor Interactivo de Documentos PDF (ExportPdfTab.tsx): Integración de react-pdf con controles de paginación, zoom multinivel, rotación y modo pantalla completa.',
      },
      {
        category: 'improvement',
        text: 'Indicador Reactivo de Sincronización en Tiempo Real (Navbar.tsx): Anillo dinámico y badge en el avatar con estados En Línea, Sincronizando y Desconectado, contador de elementos pendientes y forzado manual con feedback táctil.',
      },
      {
        category: 'feature',
        text: 'Autoasignación Inteligente para Fin de Semana y Programa Completo (ScheduleTab.tsx, ClmScheduleView.tsx): Asignación coordinada de Entre Semana y Fin de Semana con filtro por hermanos idóneos y persistencia local inmediata.',
      },
      {
        category: 'improvement',
        text: 'Barra Rápida Departamental y Matriz por Rol (GlobalSectionQuickBar.tsx, ResumenInicioTab.tsx): Navegación rápida entre departamentos en cabecera y cuadrícula adaptativa QuickAccessGrid según el rol teocrático.',
      },
      {
        category: 'improvement',
        text: 'Persistencia en Asignaciones VMC y Entorno con Bun (ClmScheduleView.tsx, bun.lock): Almacenamiento local inmediato para autoasignaciones y optimización del entorno de dependencias mediante Bun.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.41',
    buildCode: '2026.10.31.8041',
    date: '31 de Octubre, 2026',
    title: 'Estandarización Visual Táctil Neutra JW Library, Erradicación de Paneles Saturados y Aislamiento de Reuniones',
    isCurrent: false,
    highlight: 'Estandarización estética integral en toda la aplicación adoptando la paleta táctil neutra de JW Library (superficies AMOLED oscuras, bordes sutiles y botones monocromáticos), eliminación de la barra de pestañas en el catálogo y desacoplamiento estricto del ministerio personal dentro de la sección de reuniones.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'improvement',
        text: 'Estandarización Visual Estilo JW Library en Toda la Aplicación (index.css, CleaningDutiesTab.tsx, CarritosTab.tsx, CategoryHubTab.tsx): Eliminación completa de paneles inundados de color saturado (rojos oscuros, púrpuras, ámbar y esmeraldas invasivos). Sustitución por superficies táctiles neutras AMOLED (#121216 y #18181F), bordes sutiles de zinc (#27272A), botones de acción principal en blanco/negro y micropuntos semánticos para alertas de choques e indicadores de estado.',
      },
      {
        category: 'improvement',
        text: 'Depuración y Simplificación del Catálogo de Módulos (CategoryHubTab.tsx): Eliminación de la barra superior horizontal de categorías y búsqueda. Presentación directa y limpia de los módulos organizados por departamentos teocráticos oficiales.',
      },
      {
        category: 'fix',
        text: 'Aislamiento Estricto del Departamento de Reuniones (CategoryHubTab.tsx, Navbar.tsx): Desacople total del ministerio personal de las reuniones de congregación. La vista de Reuniones muestra exclusivamente los 4 módulos correspondientes (Programa de Reuniones, Hojas S-89, Discursos Públicos y Hospitalidad de Oradores), manteniendo el ministerio personal de forma privada en el portal del publicador.',
      },
      {
        category: 'improvement',
        text: 'Neutralización del Detector de Choques y Módulos de Predicación Pública (CleaningDutiesTab.tsx, CarritosTab.tsx): Rediseño del panel de choques de deberes a estética ejecutiva limpia con botones táctiles de reemplazo; estandarización de tarjetas de turnos de carritos, matriz de equidad, tarjetas de métricas e indicadores de horario.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.40',
    buildCode: '2026.10.29.8040',
    date: '29 de Octubre, 2026',
    title: 'PINs Personales v2 con Sal por Publicador, CSP Estricto en PC, Resiliencia de Contexto y Actualización CLM',
    isCurrent: false,
    highlight: 'Fortalecimiento de la seguridad con derivación de PIN personal v2 (sal única por publicador con PBKDF2), política CSP estricta en la app de escritorio Tauri, prevención de fallos de montaje mediante hooks opcionales y sincronización de lecturas bíblicas con Jeremías 38-48.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'security',
        text: 'PINs Personales v2 con Sal Única por Publicador (core.ts, syncApi.ts, AccessCredentialsSection.tsx): Incorporada derivación PBKDF2 v2 combinando congregationId y publisherId en la sal criptográfica. Evita colisiones de verificación entre publicadores con el mismo PIN, migra automáticamente de forma transparente en el siguiente guardado maestro y exige un mínimo de 6 dígitos para nuevos PINs.',
      },
      {
        category: 'security',
        text: 'Política CSP Rigurosa en la Aplicación de Escritorio (tauri.conf.json): Sustituida la directiva abierta ("csp": null) por una política restrictiva sin scripts inline, bloqueando conexiones a orígenes no autorizados y limitando accesos a Supabase, servidores de mapas (OSM, Carto, Esri), Google Fonts y GitHub Releases.',
      },
      {
        category: 'fix',
        text: 'Resiliencia de Contexto y Prevención de Excepciones de Montaje (CongregationContext.tsx, LoadingSpinner.tsx, OfflineSyncBadge.tsx, ErrorBoundary.tsx): Creado hook useOptionalCongregation() y estado de reserva FALLBACK_CONGREGATION_CONTEXT para salvaguardar componentes globales contra excepciones de evaluación temprana fuera del proveedor, incorporando además diagnóstico ampliado de trazas en ErrorBoundary.',
      },
      {
        category: 'fix',
        text: 'Esquema de Validación de Capacidades Tauri (desktop-schema.json, .gitignore): Generado el esquema JSON local requerido por default.json en src-tauri/capabilities y ajustado .gitignore para mantenerlo rastreado y sin advertencias en el IDE.',
      },
      {
        category: 'improvement',
        text: 'Actualización de Cronograma Teocrático y Lectura Bíblica CLM/VMC (organizedSync.ts, clmBridge.ts, mwbParser.ts, ClmScheduleView.tsx): Sincronizadas las semanas y lecturas bíblicas correspondientes a Jeremías 38 a 48, vinculando temas de reunión de entre semana, estudio bíblico de congregación y cánticos.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.39',
    buildCode: '2026.10.28.8039',
    date: '28 de Octubre, 2026',
    title: 'Empaquetado Nativo RPM para Fedora y Corrección de Conflicto en Filesystem',
    isCurrent: false,
    highlight: 'Generación directa de paquetes RPM nativos con el motor de empaquetado de Tauri v2 y rpmbuild, eliminando la conversión alien y erradicando el conflicto con el paquete base filesystem (/usr/bin).',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'fix',
        text: 'Empaquetado Nativo RPM sin Alien (.github/workflows/desktop-release.yml, tauri.conf.json): Sustituida la conversión mediante alien por compilación nativa directa con Tauri v2 (--bundles deb,appimage,rpm), asegurando que el RPM solo reclame los binarios de la aplicación y respete la propiedad estricta de /usr/bin en Fedora 40+.',
      },
      {
        category: 'improvement',
        text: 'Dependencias Oficiales RPM (tauri.conf.json): Declaración explícita de webkit2gtk4.1 y libsoup3 como dependencias del sistema en el manifiesto RPM para resolución limpia en DNF.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.38',
    buildCode: '2026.10.28.8038',
    date: '28 de Octubre, 2026',
    title: 'Actualizador Nativo de Escritorio en 1 Clic y Aviso Inteligente para Fedora / Ubuntu',
    isCurrent: false,
    highlight: 'Integración completa del plugin Tauri Updater para actualizaciones directas en 1 clic (Windows, macOS y AppImage) y aviso inteligente con botón de descarga y comando terminal para paquetes RPM (Fedora) y DEB (Ubuntu).',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'feature',
        text: 'Actualizador Nativo en 1 Clic (Tauri Updater & Process): Soporte de actualización automática sin salir de la app para Windows (.exe), macOS (.dmg) y Linux (.AppImage) con barra de progreso reactiva y reinicio automático seguro.',
      },
      {
        category: 'feature',
        text: 'Detección Inteligente de Tipo de Instalación (install_kind): Comando nativo IPC en Rust que detecta si el sistema corre bajo AppImage, Linux RPM (Fedora/RHEL), Linux DEB (Ubuntu/Debian), Windows o macOS mediante /etc/os-release y variables de entorno.',
      },
      {
        category: 'improvement',
        text: 'Modal Global de Actualización (DesktopUpdateModal.tsx): Integración permanente en pantalla de bienvenida, portal oficial y vistas autenticadas; muestra botón de descarga directa y comando terminal (sudo dnf install ./...) con copiado en 1 clic para Fedora y Debian.',
      },
      {
        category: 'improvement',
        text: 'Insignia de Actualización Reactiva en Cabecera y Pie (CongregationWelcomeLanding.tsx, AppFooter.tsx): Muestra notificación visual en la cabecera («¡Actualizar PC! vX.Y.Z») y botón pulsante en el pie de página junto a la píldora de versión cuando hay una versión más reciente disponible.',
      },
      {
        category: 'fix',
        text: 'Verificación Inmediata en Arranque de PC: Eliminada la limitación de 4 horas en el chequeo de versión en aplicaciones de escritorio y añadida comparación SemVer estricta para evitar falsas alarmas.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.37',
    buildCode: '2026.10.28.8037',
    date: '28 de Octubre, 2026',
    title: 'Navegación Directa a Instaladores PC/Móvil e Historial Reactivo',
    isCurrent: false,
    highlight: 'Transición directa desde el botón «Versión PC» en la cabecera de bienvenida hacia la pestaña 3 (Instalar en PC / Móvil) sin popup modal, con enrutamiento hash e integración de historial.',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'improvement',
        text: 'Navegación Directa a «Instalar App (PC / Móvil)» desde la Pantalla de Bienvenida (CongregationWelcomeLanding.tsx, KongreOfficialWebsite.tsx, App.tsx): Al pulsar el botón «Versión PC» en la cabecera superior, la aplicación abre directamente la pestaña 3 (Instalar App) con las opciones de Celular y Computadora en lugar de mostrar un pop-up modal.',
      },
      {
        category: 'feature',
        text: 'Enrutamiento Hash y Sincronización de Historial (App.tsx): Reconocimiento nativo de rutas #descargas, #downloads e #instalar para activar de inmediato la sección de instaladores, permitiendo volver a la pantalla de bienvenida con el botón del navegador o con el botón «Usar Kongre».',
      },
      {
        category: 'improvement',
        text: 'Sincronización de Botones Móviles y Banners (CongregationWelcomeLanding.tsx): Unificación del botón de PC móvil y el banner de compatibilidad para navegar directamente a la pestaña de descargas oficiales.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.36',
    buildCode: '2026.10.28.8036',
    date: '28 de Octubre, 2026',
    title: 'Optimización Móvil Integral, Select Portaled Bottom-Sheet y Empaquetado Rust Multiplataforma',
    isCurrent: false,
    highlight: 'Optimización responsiva integral para móviles con menú Bottom-Sheet portaled para Select, ajustes en selector iOS, purga de will-change en animaciones y pipeline de empaquetado Rust multiplataforma (.exe, .dmg, .deb, .rpm, .AppImage)',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'improvement',
        text: 'Selector Desplegable Select con Bottom-Sheet Portaled para Móviles (Select.tsx): Renderizado reactivo con createPortal en el document.body cuando se detecta un móvil (< 640px), desplegando un modal inferior con fondo difuminado, animación fluida y soporte para safe-area.',
      },
      {
        category: 'improvement',
        text: 'Selector de Tiempo iOS Responsivo (IosTimePicker.tsx): Adaptabilidad para gestos táctiles y pantallas pequeñas en la selección de horarios de reuniones y eventos.',
      },
      {
        category: 'improvement',
        text: 'Optimización Gráfica y Purga de will-change (kongre-welcome.css): Eliminación de will-change innecesarios y simplificación de transforms para transiciones ligeras a 60 fps y menor consumo de memoria GPU y batería.',
      },
      {
        category: 'improvement',
        text: 'Navegación Móvil Adaptable con Safe-Area (KongreOfficialWebsite.tsx, Navbar.tsx): Margen superior de seguridad para dispositivos con notch (safe-area-inset-top) y barra secundaria en 3 columnas full-width con etiquetas truncables.',
      },
      {
        category: 'feature',
        text: 'Empaquetado Multiplataforma de Escritorio Rust + Tauri v2: Versionado oficial en Cargo.toml y tauri.conf.json a 0.1.0-alpha.36, instalador oficial NSIS (.exe) para Windows y conversión de DEB a RPM con alien en Linux.',
      },
      {
        category: 'feature',
        text: 'Cockpit Teocrático en Vivo (KongreOfficialWebsite.tsx): Maqueta interactiva con 4 vistas reactivas (Reunión Vida y Ministerio, Asistencia S-88, Territorios S-13 e Informes de Servicio) que simula el entorno real de una congregación.',
      },
      {
        category: 'improvement',
        text: 'Bento Grid Asimétrico con Iconografía Vectorial Oficial (KongreOfficialWebsite.tsx): Cuadrícula moderna con ritmo visual y los SVGs originales de la aplicación (clm_vmc, predicacion, supervision, discursos, secretaria, informes_servicio) con accesos directos a la Guía de Usuario.',
      },
      {
        category: 'feature',
        text: 'Flujo Teocrático en 3 Pasos (KongreOfficialWebsite.tsx): Franja secuencial clara que desglosa el proceso de adopción teocrática: 1. Inicialización e Importación local, 2. Asignación y Programación Inteligente, 3. Coordinación y Consulta Segura por portal o PDF/WhatsApp.',
      },
      {
        category: 'improvement',
        text: 'Componente Unificado DemoModeButton (DemoModeButton.tsx): Nuevo botón estándar y minimalista en tonos neutros slate (bg-slate-100 dark:bg-slate-800, border-slate-200 dark:border-slate-700), idéntico en barra superior, cockpit y portal de bienvenida.',
      },
      {
        category: 'improvement',
        text: 'Purga Total de Iconos de Estrella (Sparkles): Erradicación completa de destellos/estrellas en botones, insignias teocráticas y cabeceras en favor de iconos sobrios institucionales (Building2, CheckCircle2, Download, BookOpen) o tipografía limpia.',
      },
      {
        category: 'improvement',
        text: 'Portal de Bienvenida 100% Zero-Scroll en Escritorio (CongregationWelcomeLanding.tsx): Optimización del contenedor a pantalla completa (lg:h-screen lg:max-h-screen lg:overflow-hidden) con centrado automático y eliminación de botones duplicados, permitiendo ver las 4 opciones de acceso simultáneamente sin ningún desplazamiento vertical.',
      },
      {
        category: 'fix',
        text: 'Corrección de Identidad Institucional (KongreOfficialWebsite.tsx): Corrección del encabezado de previsualización en la maqueta de la web oficial, eliminando el texto erróneo "Kongre Studio" y restableciendo la identidad oficial: "Kongre · Congregación Central".',
      },
      {
        category: 'improvement',
        text: 'Estandarización de Encabezados y Selector de Tema (AnimatedLogo.tsx, ThemeToggle.tsx): Logotipo unificado AnimatedLogo y botón de apariencia ThemeToggle consistentes en todas las pantallas.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.35',
    buildCode: '2026.10.26.8035',
    date: '26 de Octubre, 2026',
    title: 'Lanzamiento Multiplataforma para PC (Rust), Reconocimiento de SO y Diseño Fluido',
    isCurrent: false,
    highlight: 'Lanzamiento oficial de Kongre App nativa para PC con instaladores para Windows, macOS y Linux en Rust, banner con detección inteligente de SO en la bienvenida y diseño fluido de ancho completo',
    environment: 'Fase Alfa Preliminar (Web & Desktop)',
    changes: [
      {
        category: 'feature',
        text: 'Lanzamiento de Kongre App para Escritorio: Núcleo nativo ultraligero desarrollado con Rust (Tauri v2) con instaladores oficiales para Windows (.exe / .msi), macOS (.dmg Universal), Fedora (.rpm), Ubuntu (.deb) y Linux Portable (.AppImage).',
      },
      {
        category: 'feature',
        text: 'Reconocimiento Inteligente de Sistema Operativo y Descargas Directas: La pantalla de bienvenida detecta automáticamente el SO del usuario (Windows, Mac, Fedora o Ubuntu) y ofrece la descarga directa y pestañas interactivas de compatibilidad.',
      },
      {
        category: 'feature',
        text: 'Centro de Descargas en la Web (DesktopDownloadModal.tsx): Modal interactivo con selector de sistemas operativos y enlaces directos a las Releases oficiales.',
      },
      {
        category: 'improvement',
        text: 'Aprovechamiento Completo del Ancho de Pantalla (App.tsx, UserProfileSettingsView.tsx, PanoramaGeneralTab.tsx, RolesManagerTab.tsx, MantenimientoTab.tsx, PanelElectricoTab.tsx, PersonalViewTab.tsx, MinisterioPublicadorTab.tsx): Se eliminaron los topes de ancho fijo para que los paneles se expandan de forma responsiva ocupando todo el espacio del monitor.',
      },
      {
        category: 'fix',
        text: 'Corrección de Desbordamiento en Tarjeta Push (PushNotificationQuickGuideCard.tsx): Se ajustó la disposición de botones para evitar desbordamientos en vistas de dos columnas.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.34',
    buildCode: '2026.10.26.7680',
    date: '26 de Octubre, 2026',
    title: 'Rediseño Integral del Panel y Vista de Perfil de Usuario',
    isCurrent: false,
    highlight: 'Renovación completa del menú desplegable de cuenta en la barra superior y de la vista de Mi Perfil con diseño en dos columnas, tarjeta de identidad unificada y selectores con iconos vectoriales',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Panel Desplegable de Cuenta Rediseñado (Navbar.tsx): Nueva cabecera de identidad con estado en línea, rol y congregación, cuadrícula rápida de 2 columnas (Mi Perfil y Mi Portal), accesos administrativos con indicadores laterales, selector integrado de tema (Claro / Oscuro) y pie de sesión con versión.',
      },
      {
        category: 'improvement',
        text: 'Vista Completa de Perfil en 2 Columnas (UserProfileSettingsView.tsx): Reestructuración del módulo Mi Perfil en una tarjeta superior de identidad y foto con barra compacta de avatares predeterminados, columna izquierda para canales de contacto y preferencias de horario con iconos Lucide, y columna derecha con ficha resumen en vivo y avisos Push.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.33',
    buildCode: '2026.10.26.7670',
    date: '26 de Octubre, 2026',
    title: 'Rediseño de Barra Superior en PC: Buscador Central y Dock Minimalista de Solo Iconos',
    isCurrent: false,
    highlight: 'Reestructuración de la cabecera de escritorio: eliminación del botón de Cronómetro superior, conversión de Calendario a botón de solo icono e integración de todas las utilidades dentro de un único dock uniforme',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Miga de Pan Estructurada con Icono de Módulo (Navbar.tsx, DemoBanner.tsx): Se integró el icono de congregación, separador chevron, insignia visual del módulo activo e indicador de Modo Prueba con proporciones alineadas.',
      },
      {
        category: 'feature',
        text: 'Barra de Búsqueda Rápida Central en PC (Navbar.tsx): Se reemplazó la lupa suelta por una barra de búsqueda interactiva central con indicador de teclado (Ctrl K).',
      },
      {
        category: 'improvement',
        text: 'Dock Unificado de Solo Iconos sin Cronómetro (Navbar.tsx): Se retiró el chip de Cronómetro de la barra superior y se convirtió Calendario en botón de solo icono integrado dentro del dock uniforme (Calendario, Publicadores, QR Móvil, PINs, Alertas y Tema) junto a la tarjeta de perfil.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.32',
    buildCode: '2026.10.26.7669',
    date: '26 de Octubre, 2026',
    title: 'Unificación Integral de Cabecera Móvil y Contenedores Cohesivos de Control',
    isCurrent: false,
    highlight: 'Eliminación de la barra flotante aislada de retroceso mediante barra fija adhesiva superior y empaquetado de todos los controles desparramados en tarjetas contenedoras estructuradas con cuadrículas adaptativas sin recortes de texto',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Barra de Retroceso Móvil Adhesiva Unificada (App.tsx): Se reemplazó la burbuja flotante aislada por una barra superior fija de borde a borde (sticky top-0 con backdrop blur) que actúa como cabecera nativa limpia de la aplicación.',
      },
      {
        category: 'improvement',
        text: 'Contenedores Cohesivos para Controles de Módulo (MantenimientoTab.tsx, PublishersTab.tsx, GruposServicioTab.tsx, MemorialAsambleasTab.tsx, VisitaSuperintendenteTab.tsx, PanelElectricoTab.tsx, TableroAnunciosTab.tsx, EquidadDashboardTab.tsx, ExportPdfTab.tsx, ConflictCenterTab.tsx, PersonalViewTab.tsx, RolesManagerTab.tsx): Todos los botones, filtros y sub-pestañas que quedaban dispersos sobre el fondo se integraron dentro de tarjetas unificadas con fondo blanco/slate-900 y bordes sutiles.',
      },
      {
        category: 'improvement',
        text: 'Eliminación Definitiva de Textos Cortados y Tiras Desbordadas: Reemplazo de franjas con scroll horizontal estrecho por cuadrículas adaptativas simétricas (2 y 3 columnas) con etiquetas claras y concisas en todos los módulos de gestión.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.31',
    buildCode: '2026.10.26.7668',
    date: '26 de Octubre, 2026',
    title: 'Unificación Visual Móvil: Colores Consistentes, Cuadrículas sin Cortes y Tablas Adaptativas',
    isCurrent: false,
    highlight: 'Corrección integral de inconsistencias de diseño en móvil: eliminación de secciones con modo oscuro forzado, botones y pestañas alineados en cuadrícula sin recortes y tarjetas móviles para literatura y territorios',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Eliminación de Hueco en Blanco en Herramientas del Programa (index.css, ScheduleTab.tsx): Se corrigió la regla CSS global que forzaba min-height: 100dvh sobre la cabecera móvil, integrando el listado de herramientas inmediatamente debajo del título.',
      },
      {
        category: 'improvement',
        text: 'Consistencia de Tema Claro/Oscuro (InformeSucursalS1Tab.tsx, AttendanceTrendsDashboard.tsx): Se corrigieron las secciones con fondo oscuro fijo en modo claro para que todos los módulos mantengan una paleta uniforme blanca/slate en modo claro y slate-900 en modo oscuro.',
      },
      {
        category: 'improvement',
        text: 'Pestañas, Botones y Tablas sin Información Cortada (CleaningDutiesTab.tsx, S89SlipsTab.tsx, DiscursosPublicosTab.tsx, HospitalidadTab.tsx, TarjetasS21Tab.tsx, InformesServicioTab.tsx, PrecursoresAuxiliaresTab.tsx, CuentasTab.tsx, TerritoriosTab.tsx, CarritosTab.tsx, LiteraturaTab.tsx): Reorganización de sub-pestañas y botones en cuadrículas móviles de 2 y 3 columnas con colores unificados y vista de tarjetas móviles para el inventario de literatura.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.30',
    buildCode: '2026.10.26.7667',
    date: '26 de Octubre, 2026',
    title: 'Botones Atrás Móviles Minimalistas (Solo Icono sin Texto)',
    isCurrent: false,
    highlight: 'Diseño limpio de los botones de retorno en páginas móviles mostrando únicamente el icono de flecha sin etiqueta de texto',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Botón Atrás Solo Icono (App.tsx, ScheduleTab.tsx, AssignmentSelectorModal.tsx, CongregationCalendar.tsx, ConflictsModal.tsx, QrCodeModal.tsx): Se eliminó el texto de los botones de retroceso en todas las páginas móviles para mostrar únicamente el icono de flecha izquierda con estética minimalista.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.29',
    buildCode: '2026.10.26.7666',
    date: '26 de Octubre, 2026',
    title: 'Botón Atrás en Todas las Nuevas Páginas Móviles (Antiguos Pop-ups)',
    isCurrent: false,
    highlight: 'Incorporación de botón "Atrás" nativo en la esquina superior izquierda de todas las páginas móviles que anteriormente eran pop-ups, selectores o menús flotantes',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Barra Superior "Atrás" en Páginas Secundarias Móviles (App.tsx): Todas las páginas secundarias abiertas en móvil (Mi Perfil, Roles y Permisos, Centro de Conflictos, Ajustes y módulos del menú) cuentan ahora con un botón "← Atrás" que regresa directamente a la vista anterior.',
      },
      {
        category: 'improvement',
        text: 'Botón "Atrás" en Selectores, Formularios y Herramientas a Pantalla Completa (ScheduleTab.tsx, AssignmentSelectorModal.tsx, CongregationCalendar.tsx, ConflictsModal.tsx, QrCodeModal.tsx): Se integró el botón "← Atrás" en el Selector de Semanas, Herramientas del Programa, Selector de Participantes, Eventos del Calendario y vistas completas en móvil.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.28',
    buildCode: '2026.10.26.7665',
    date: '26 de Octubre, 2026',
    title: 'Experiencia Móvil 100% Nativa sin Pop-ups (Vistas a Pantalla Completa)',
    isCurrent: false,
    highlight: 'Eliminación de todos los pop-ups flotantes en la versión móvil: navegación directa a vistas de página completa y transformación automática de formularios/diálogos en pantallas nativas en móvil',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Cero Pop-ups Automáticos en Móvil (App.tsx, LoadingSpinner.tsx, OfflineSyncBanner.tsx, AutoLockToastWarning.tsx): Se desactivaron los avisos emergentes automáticos en móvil y se reemplazó la tarjeta flotante de sincronización por una línea de progreso superior no intrusiva.',
      },
      {
        category: 'improvement',
        text: 'Navegación Directa a Páginas Completas (Navbar.tsx, DemoBanner.tsx, MobileMenuTab.tsx, App.tsx): En móvil, tocar el avatar de usuario abre directamente la página de Mi Perfil, el botón de tema alterna modo claro/oscuro en 1 toque, y los botones de Cruces y Roles llevan directamente a sus páginas dedicadas sin menús ni modales flotantes.',
      },
      {
        category: 'improvement',
        text: 'Transformación de Diálogos y Selectores en Pantallas Nativas Móviles (index.css, ScheduleTab.tsx): Todos los formularios, selectores de semanas, herramientas y diálogos se presentan como páginas a pantalla completa (100% ancho y alto sin bordes flotantes ni fondos oscurecidos) en dispositivos móviles (< 768px).',
      },
    ],
  },
  {
    version: '0.1.0-alpha.27',
    buildCode: '2026.10.26.7660',
    date: '26 de Octubre, 2026',
    title: 'Optimización de Interfaz Móvil: Menú Limpio, Calendario Integrado, Mi Ministerio y Programa de Reuniones',
    isCurrent: false,
    highlight: 'Eliminación de banners y buscadores redundantes en Menú, Calendario y Mi Congregación; integración del botón + dentro del calendario; y alineación compacta de cabeceras y controles en móvil',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Menú Móvil Limpio y Directo (MobileMenuTab.tsx): Se eliminaron el banner superior de perfil y la barra de búsqueda/filtros por categorías para mostrar de inmediato los accesos rápidos y tarjetas de departamentos.',
      },
      {
        category: 'improvement',
        text: 'Calendario con Botón + Integrado (CongregationCalendar.tsx): Se eliminó el banner superior con el buscador y se integró el botón "+ Crear Evento" directamente dentro de la barra de herramientas del contenedor del calendario.',
      },
      {
        category: 'fix',
        text: 'Alineación Móvil en Mi Ministerio (MinisterioPublicadorTab.tsx, MinistryStopwatchDial.tsx): Se corrigió el desbordamiento del selector de meta mensual, la envoltura vertical de los botones en Mis Revisitas y Mis Estudios Bíblicos, y se dispuso el selector de modalidades del cronómetro en una tira horizontal compacta.',
      },
      {
        category: 'improvement',
        text: 'Simplificación en Mi Congregación y Programa de Reuniones (PanoramaGeneralTab.tsx, ScheduleTab.tsx, ClmScheduleView.tsx): Se eliminó el banner superior redundante en Mi Congregación, se unificó en una sola fila la barra de acciones del programa y se integró el selector de Sala Auxiliar en la cabecera VMC.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.26',
    buildCode: '2026.10.26.7650',
    date: '26 de Octubre, 2026',
    title: 'Estabilidad en Reposo de Pestaña, Prevención de Pantalla en Blanco y Optimización de Sincronización en Segundo Plano',
    isCurrent: false,
    highlight: 'Eliminación del bucle de re-renderizado en reposo, pausa inteligente de sondeos en pestañas ocultas, pre-chequeo ligero de metadatos sin PBKDF2 redundante y recuperación automática BFCache/visibilitychange',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Corrección de Pantalla en Blanco tras Reposo en el Navegador: Se eliminó el bucle infinito de verificación en la nube en App.tsx y se protegió la sesión local para que nunca se borre ante errores transitorios de red, límites 429 o suspensión de la pestaña.',
      },
      {
        category: 'improvement',
        text: 'Sincronización Inteligente sin Bloqueo de CPU (PBKDF2): syncNowWithSupabase y syncBidirectional ahora comprueban primero metadatos ligeros y omiten la lectura/cifrado de todo el almacenamiento local si no hay cambios pendientes, pausando todos los temporizadores cuando la pestaña está oculta (visibilityState === hidden).',
      },
      {
        category: 'fix',
        text: 'Recuperación Automática al Despertar (visibilitychange / pageshow) y Auto-Bloqueo: Rehidratación automática de la bóveda IndexedDB tras hibernación del navegador, ajuste del temporizador de bloqueo por inactividad y corrección de capa z-[100] en SessionLockModal.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.25',
    buildCode: '2026.10.26.7600',
    date: '26 de Octubre, 2026',
    title: 'Blindaje de Concurrencia en Bóveda Local, Rotación Segura de Credenciales, Revalidación de Tokens y Cronómetro iOS',
    isCurrent: false,
    highlight: 'Secuenciador monótono e hidratación en 2 fases en atRestVault, validación estricta de payloads re-cifrados en rotate_to, revocación inmediata en verify_role_token y cronómetro nativo estilo iOS sincronizado entre Móvil y PC',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Concurrencia y Atomicidad en atRestVault: Se incorporó un secuenciador monótono por clave (writeSeq) para evitar que cifrados asíncronos previos pisen escrituras nuevas o resuciten claves borradas, transacción única readwrite en getOrCreateVaultKey y arquitectura de hidratación en 2 fases (planVaultHydration / commitVaultHydration) con cancelación limpia por timeout.',
      },
      {
        category: 'security',
        text: 'Endurecimiento de Rotación de Credenciales (rotate_to): La Edge Function kongre-sync exige el envío simultáneo del payload re-cifrado correspondiente (rotation_requires_master_payload / rotation_requires_public_payload), solicita explícitamente el PIN de congregación vigente cuando no reside en el dispositivo (needs_current_congregation_pin), sincroniza settings.congregationPinHash, preserva kongre_security_master_key_hash y limpia automáticamente el portapapeles a los 30 segundos.',
      },
      {
        category: 'security',
        text: 'Revalidación en Tiempo Real de Tokens de Rol (verify_role_token y tokenSafe): El servidor sanitiza delimitadores internos con tokenSafe y contrasta cada token contra personal_verifiers en la base de datos para revocar de inmediato sesiones de publicadores dados de baja o cuyos privilegios hayan cambiado (401 role_changed).',
      },
      {
        category: 'feature',
        text: 'Cronómetro de Predicación Estilo iOS Sincronizado entre Móvil y PC: Rediseño integral con carátula negra OLED estilo Reloj de iOS (escala de 60 segundos, sub-esfera superior de 30 minutos, manecilla naranja #FF9F0A, botones circulares de doble anillo Iniciar/Detener/Vuelta y vista Analógica/Digital), atajo global Ctrl+Shift+T y sincronización en la nube del cronómetro en curso.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.24',
    buildCode: '2026.10.25.7500',
    date: '25 de Octubre, 2026',
    title: 'Token de Rol Firmado por Servidor y Fase 2 de Bóveda Local para Salud (DPA) y Notas Confidenciales',
    isCurrent: false,
    highlight: 'Sesión protegida contra manipulación en DevTools mediante tokens HMAC firmados en la Edge Function y migración de datos médicos DPA y notas de ancianos a la Bóveda Local atRestVault respaldada por CryptoKey no extraíble en IndexedDB',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Token Firmado por el Servidor para PIN Personal: La Edge Function kongre-sync genera ahora un token criptográfico HMAC-SHA256 (kgr_srt1) con el secreto interno del servidor (pepper) que vincula congregación, publicador, rol activo y roles teocráticos. Cualquier intento de alterar el rol en localStorage o DevTools resulta en la invalidación inmediata de la sesión.',
      },
      {
        category: 'security',
        text: 'Nuevo Endpoint de Verificación en Servidor (verify_role_token): Validación directa en la nube de la autenticidad y vigencia del token de rol emitido.',
      },
      {
        category: 'security',
        text: 'Fase 2 de la Bóveda Local (kgr_sec4 respaldado por IndexedDB): Migración de datos sensibles de salud (directiva médica anticipada DPA, representantes médicos, alergias a fármacos, condiciones crónicas) y notas confidenciales para que su clave derive de la CryptoKey no extraíble (extractable: false) de IndexedDB. Un volcado de localStorage sin la clave de IndexedDB no puede descifrar estos registros.',
      },
      {
        category: 'security',
        text: 'Retrocompatibilidad Total Garantizada: Lectura fluida y transparente de registros existentes en formatos previos (kgr_sec3, kgr_sec2 y texto plano) con actualización automática en memoria.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.23',
    buildCode: '2026.10.25.7400',
    date: '25 de Octubre, 2026',
    title: 'Rediseño Arquitectónico desde Cero de Estado Espiritual y las 11 Tarjetas del Publicador con Bloques Numerados y Cintas de KPIs',
    isCurrent: false,
    highlight: 'Nueva arquitectura multi-bloque desde cero en Estado Espiritual (PrivilegesSection) con línea de tiempo de hitos S-21, tarjetas de rol, matriz filtrable de 16 departamentos y cintas superiores de indicadores tabulares en todas las secciones del publicador',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Rediseño Total desde Cero de Estado Espiritual y Privilegios (PrivilegesSection): Arquitectura en 4 bloques independientes con selector S-21 de Esperanza («Otras ovejas» / «Ungido»), 4 tarjetas arquitectónicas de rol teocrático, cinta de KPIs en vivo (Tiempo de Bautismo, Modalidad de Servicio, Grupo y Cuidado Pastoral), Línea de Tiempo de 4 Hitos Espirituales con cálculo automático de antigüedad, espacio operativo de Precursorado/Grupo/Pastoreo, cajón discreto de Registro Confidencial del Comité y matriz filtrable de 16 Departamentos con controles segmentados (No | Titular | Auxiliar).',
      },
      {
        category: 'feature',
        text: 'Rediseño Multi-Bloque de Información Personal (BasicInfoSection), Contacto y Ubicación (ContactSection) y Directriz DPA (MedicalDpaSection): Cintas superiores de 4 indicadores demográficos, de movilidad y de vigencia médica, bloques funcionales numerados (1., 2., 3...) para identidad S-21, separación automática de nombre, geolocalización GPS con enlaces a Google Maps/Waze, plazas de vehículo y buscador de representantes médicos en el directorio.',
      },
      {
        category: 'improvement',
        text: 'Rediseño Multi-Bloque de Asignaciones (AssignmentsSection), Condiciones Especiales (SpecialConditionsSection) y Ausencias y Notas (AbsenceAndNotesSection): Cintas de KPIs de habilitación por reunión, filtro interactivo por áreas (Todas, Activas, Vida y Ministerio, Fin de Semana y Campo, Acomodación y Salón), panel pedagógico S-38 y bosquejos (1–194), matriz de accesibilidad/traslados y calendario de ausencias con conteo automático de días.',
      },
      {
        category: 'security',
        text: 'Hardening Cero Conocimiento y Bóveda Criptográfica en Reposo (atRestVault): Bóveda con clave AES-256-GCM no extraíble en IndexedDB con autenticación de datos asociados (AAD), migración automática de hashes locales a PBKDF2 (200.000 iteraciones), eliminación total de claves en texto claro en sessionStorage y nuevo modal de rotación segura de credenciales (RotateCredentialsModal) en Supabase.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.22',
    buildCode: '2026.10.25.7300',
    date: '25 de Octubre, 2026',
    title: 'Rediseño Editorial Completo de las 11 Tarjetas del Publicador, el Hub de Categorías, Registro S-21, Contactos de Emergencia y Credenciales PIN/QR',
    isCurrent: false,
    highlight: 'Arquitectura visual unificada con cabecera ejecutiva, pestañas numeradas (01–11), navegación secuencial entre tarjetas, nuevo libro S-21 multi-año con exportación CSV, directorio de contactos de emergencia con llamada/WhatsApp y espacio de credenciales PIN/QR',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Cabecera Ejecutiva y Hub Editorial de 11 Tarjetas (PublisherEditor): Nueva cabecera de perfil con avatar de iniciales, edición rápida de nombre, línea tipográfica limpia (ID · Rol · Grupo · Edad · Estado de sincronización), medidor de integridad de ficha, barra de pestañas numeradas (01 a 11), tarjetas del Hub con filas limpias sin cajas anidadas redundantes y pie de navegación secuencial («Anterior / Siguiente tarjeta»).',
      },
      {
        category: 'feature',
        text: 'Rediseño del Registro Oficial S-21 (S21RecordsSection): Selector dinámico de años de servicio (2024 a 2027), cinta superior de métricas anuales en tipografía tabular (meses activos, horas totales con crédito, promedio mensual, cursos bíblicos y meses de precursor auxiliar), botón rápido «Año activo», botón por fila para copiar valores del mes anterior, exportación directa a CSV y curva anual de actividad.',
      },
      {
        category: 'feature',
        text: 'Rediseño de Contactos de Emergencia (EmergencyContactsSection): Contenedor editorial unificado con buscador para vincular cualquier hermano del directorio de la congregación en un clic, sugerencia de importación rápida desde el representante médico DPA, botones rápidos de parentesco en el modal y tarjetas de contacto con acciones siempre visibles de Llamada, WhatsApp, Correo y Copiar teléfono.',
      },
      {
        category: 'improvement',
        text: 'Unificación Visual de Credenciales PIN/QR (AccessCredentialsSection) y todas las Secciones del Publicador: Espacio de trabajo en dos columnas para PIN personal y nivel de acceso, papeleta QR imprimible renovada y cabeceras limpias con metadatos en línea en Información Personal, Contacto, DPA, Estado Espiritual, Asignaciones, Condiciones Especiales, Ausencias e Historial.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.21',
    buildCode: '2026.10.25.7200',
    date: '25 de Octubre, 2026',
    title: 'Renovación Integral de las Tarjetas del Publicador: Información Personal, Contacto y GPS, Estado Espiritual, DPA, Asignaciones e Historial',
    isCurrent: false,
    highlight: 'Tarjetas modulares enriquecidas con filiación familiar, idiomas/oficios, geolocalización GPS, trayectoria espiritual S-21, seguimiento de pastoreo, representantes DPA del directorio y auditoría en navegador',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Tarjeta de Información Personal (BasicInfoSection): Auto-separación de nombre completo en 4 campos, cálculo automático de etapa de vida con sugerencia de indicadores (Menor / Edad Avanzada 65+), selector de padre/madre o tutor para menores, vinculación conyugal y núcleo familiar, y etiquetas interactivas de Idiomas (incluyendo LSM) y Oficios/Habilidades Prácticas para mantenimiento y apoyo.',
      },
      {
        category: 'feature',
        text: 'Tarjeta de Contacto, Ubicación y Movilidad (ContactSection): Botones directos para copiar, llamar, enviar WhatsApp o correo, selector de medio preferido de contacto, referencias de llegada al domicilio, captura de coordenadas GPS en vivo con enlaces directos a Google Maps y Waze, selector de plazas disponibles en vehículo (2 a 7 asientos) y preferencia de publicaciones en Letra Grande.',
      },
      {
        category: 'feature',
        text: 'Tarjeta de Estado Espiritual y Privilegios (PrivilegesSection): Selector directo de los 4 roles teocráticos (Anciano, Siervo Ministerial, Publicador Bautizado y No Bautizado), selector explícito de Esperanza S-21 (Otras ovejas / Ungido), fecha de nombramiento, fecha de inicio de precursorado y última Escuela de Precursores, terminología teocrática en grupos (Sup. Grupo / Auxiliar) y panel de pastoreo con prioridad de atención y ancianos visitadores.',
      },
      {
        category: 'improvement',
        text: 'Tarjetas de Directriz Médica DPA, Asignaciones, Condiciones Especiales e Historial: Búsqueda de representantes médicos en el directorio de la congregación con llamada/WhatsApp directo y alerta de revisión anual (+1 año), selector de lección actual S-38 y bosquejos de discursos públicos (1–194) con estilos estáticos Tailwind v4, seguimiento de traslado de congregación (envío de S-21 y carta de presentación), indicador de integridad de ficha en el Hub y auditoría de cambios con reversión en navegador.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.20',
    buildCode: '2026.10.25.7100',
    date: '25 de Octubre, 2026',
    title: 'Analítica Gráfica con Recharts y Selector Multi-Grupo de Servicio en el Tablero de Equidad (EquidadDashboardTab)',
    isCurrent: false,
    highlight: 'Nuevos gráficos interactivos con Recharts para comparar la carga ponderada entre publicadores, privilegios y grupos de servicio específicos, con detección visual de desequilibrios e inspección rápida',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Visualización Comparativa con Recharts en el Tablero de Equidad (EquidadDashboardTab): Incorporación de 4 modos gráficos interactivos («Por Áreas Apilado», «Brecha vs. Privilegio», «Cuerpos y Estados» y «Por Grupos») con líneas de referencia de promedio y umbral de sobrecarga (140%), selector de muestra (Contraste 8 Más vs. 8 Menos Cargados, Top 15 Mayor Carga, Top 15 Menor Carga y Vista General) e inspector rápido al hacer clic en cualquier barra.',
      },
      {
        category: 'feature',
        text: 'Selector y Filtro Multi-Grupo de Servicio en Comparativa de Carga: Nuevo selector desplegable rápido y barra interactiva de chips multi-grupo que permiten aislar un grupo de servicio o comparar simultáneamente varios grupos específicos en todos los gráficos, tablas y métricas de equidad.',
      },
      {
        category: 'improvement',
        text: 'Tarjetas de Grupos de Predicación Interactivas y Etiquetas Contextuales: Las tarjetas inferiores de grupos de servicio ahora funcionan como filtros directos al hacer clic, mostrando en tiempo real el promedio de puntos por publicador y añadiendo el identificador de grupo (G#N) en las gráficas cuando se comparan múltiples grupos.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.19',
    buildCode: '2026.10.25.7000',
    date: '25 de Octubre, 2026',
    title: 'Centro Local y Motor Universal de Carga y Relleno Automático de Plantillas PDF Oficiales (S-21, S-89, S-140, S-88, S-13, S-26, S-30, S-25, S-28 y S-1)',
    isCurrent: false,
    highlight: 'Cumplimiento estricto de derechos de autor: la aplicación nunca genera formularios oficiales desde cero; el usuario carga su archivo PDF oficial en blanco desde su dispositivo y el sistema detecta y rellena automáticamente sus campos interactivos AcroForm en el navegador (100% local)',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Motor Universal y Servicio Local de Formatos Oficiales (localOfficialFormsService.ts & officialFormFiller.ts): Integración completa con pdf-lib para cargar plantillas oficiales en blanco provistas por el usuario y rellenarlas automáticamente con datos reales de la congregación sin alterar su diseño original ni recrear formularios desde cero.',
      },
      {
        category: 'feature',
        text: 'Ordenamiento Visual Inteligente de Campos AcroForm (sortPdfFieldsVisually): Detección y ordenamiento espacial de cuadros de texto, casillas de verificación, listas desplegables y grupos de opción por coordenadas visuales (página, fila superior a inferior y columna izquierda a derecha), garantizando compatibilidad universal con cualquier idioma o revisión oficial de los formularios.',
      },
      {
        category: 'feature',
        text: 'Soporte Integral para los 10 Formularios Teocráticos Oficiales: Relleno automático especializado para Tarjetas de Publicador S-21 (individual, por grupo de servicio o congregación completa en lote multipágina), Hojas de Asignación S-89 (1 por página o 4 por página), Programa VMC S-140, Asistencia a las Reuniones S-88, Registro de Territorios S-13, Cuentas S-26, S-30 y S-25, Inventario de Literatura S-28 e Informe Mensual S-1.',
      },
      {
        category: 'improvement',
        text: 'Centro Local de Formatos Oficiales (LocalOfficialFormsCenter y OfficialPdfModal): Almacenamiento local de plantillas PDF en el navegador (IndexedDB persistente o modo exclusivo en memoria RAM por sesión), inspector interactivo de campos AcroForm detectados y botones directos de «PDF Oficial» en cada módulo.',
      },
      {
        category: 'security',
        text: 'Eliminación de Generadores de Réplicas desde Cero: Se reemplazaron los antiguos trazadores manuales de tarjetas S-21 y hojas S-89 para asegurar que todo documento oficial descargado provenga exclusivamente de la plantilla PDF oficial cargada por el usuario.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.18',
    buildCode: '2026.10.25.6900',
    date: '25 de Octubre, 2026',
    title: 'Auditoría de Secretaría, Carpeta Ejecutiva de Visita del Sup. de Circuito, Literatura (S-28/S-14), Mantenimiento/Emergencias y Contabilidad (S-26/S-30/S-25)',
    isCurrent: false,
    highlight: 'Nuevos motores administrativos para seguimiento anual de precursores (meta 600 h), Dossier Ejecutivo para el Superintendente de Circuito, inventario de literatura y pedidos especiales por grupo, calendario anual de mantenimiento con plan de desastres y contabilidad congregacional completa',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Auditoría de Secretaría y Meta Anual de Precursores (secretaryAuditEngine.ts & TarjetasS21Tab): Seguimiento del ritmo anual de precursores regulares (meta de 600 horas y créditos de horas con semáforo En Meta / Atención / Rezagado) y auditoría pastoral de publicadores irregulares o en riesgo de inactividad.',
      },
      {
        category: 'feature',
        text: 'Carpeta Ejecutiva para la Visita del Superintendente de Circuito (VisitaSuperintendenteTab): Generador automático del Dossier Ejecutivo imprimible A4 y resumen por WhatsApp con métricas consolidadas de publicadores, precursores, cursos bíblicos, asistencia S-88, cobertura de territorios S-13 y radiografía por grupo de servicio.',
      },
      {
        category: 'feature',
        text: 'Gestión Integral de Literatura, Pedidos Especiales y Recuento S-14 (literatureHelper.ts & LiteraturaTab): Análisis de stock crítico y agotado, cálculo automático de pedido sugerido de reposición, control de pedidos especiales agrupados por grupo de servicio con aviso por WhatsApp al llegar al Salón, distribución a superintendentes de grupo y recuento físico.',
      },
      {
        category: 'feature',
        text: 'Calendario Anual de Mantenimiento Preventivo y Plan de Preparación ante Emergencias (maintenanceEmergencyEngine.ts & MantenimientoTab): Matriz de 12 meses del año de servicio (Septiembre a Agosto) con cálculo de cumplimiento y horas anuales, junto con el Plan de Emergencias y Desastres (árbol de contacto por grupo, hermanos con formación médica/primeros auxilios, vehículos de apoyo, custodia de llaves y mapa de cortacircuitos eléctricos).',
      },
      {
        category: 'feature',
        text: 'Contabilidad Congregacional S-26, Informe Mensual S-30 y Auditoría Trimestral S-25 (accountsHelper.ts & CuentasTab): Libro mensual S-26 con saldo acumulado línea por línea, conciliación interactiva de extracto bancario y efectivo en caja, cálculo de reserva operativa recomendada (2 meses de gastos locales), generador del anuncio mensual S-30 para plataforma y panel de Auditoría Trimestral S-25 con verificación de comprobantes.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.17',
    buildCode: '2026.10.25.6800',
    date: '25 de Octubre, 2026',
    title: 'Suite Integral de Gestión Congregacional: Intercambio de Oradores, Deberes y Aseo, Carritos, Agrupación Familiar, Salidas al Campo, Cartelera Digital y Equidad Ponderada',
    isCurrent: false,
    highlight: 'Siete motores teocráticos interconectados para gestionar congregaciones vecinas y hospitalidad, deberes logísticos e insumos de aseo, emparejamiento en carritos, sincronización de núcleos familiares, resumen mensual unificado por hermano, cuadrante de predicación y auditoría ponderada de carga',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Motor de Intercambio de Oradores, Congregaciones Vecinas y Hospitalidad Inteligente (DiscursosPublicosTab & HospitalidadTab): Directorio unificado de congregaciones vecinas y oradores visitantes, detector de repetición de bosquejos públicos, validación cruzada de choques para oradores salientes y sugeridor inteligente de familias anfitrionas según equidad histórica, capacidad y alergias/dieta.',
      },
      {
        category: 'feature',
        text: 'Motor de Deberes Logísticos y Programa de Aseo con Control de Insumos (CleaningDutiesTab): Auto-asignador de Audio, Video, Micrófonos, Acomodadores, Plataforma, Seguridad y Zoom sin conflictos intra-reunión; matriz de equidad y programación de aseo semanal, limpieza profunda (S-28) y eventos especiales con lista de verificación por áreas y semáforo de insumos.',
      },
      {
        category: 'feature',
        text: 'Motor de Predicación Pública con Carritos y Emparejamiento Teocrático (CarritosTab): Validación automática de turnos de exhibidores públicos (matrimonios/familiares, compañeros fijos, alerta de parejas mixtas sin parentesco, choques de horario y ausencias), auto-asignación equitativa e impresión A4 del cuadrante.',
      },
      {
        category: 'feature',
        text: 'Agrupación Familiar Inteligente y Despacho Mensual Unificado en 8 Módulos (familyGrouping.ts, BasicInfoSection, ClmReplacementModal, unifiedMonthlyAssignments.ts, BatchWhatsAppModal & PersonalViewTab): Vinculación de núcleo familiar con sugerencias por apellido/dirección, priorización de familiares asignados en la misma reunión y consolidación mensual de todas las asignaciones de cada hermano (VMC, Fin de Semana, Deberes, Limpieza, Carritos, Salidas al Campo, Orador Saliente y Hospitalidad) en un solo mensaje de WhatsApp, hoja imprimible y calendario .ics.',
      },
      {
        category: 'feature',
        text: 'Cartelera Digital del Salón del Reino y Generador de Salidas al Campo (TableroAnunciosTab, fieldServiceGenerator.ts & GruposServicioTab): Cartelera unificada lista para vitrina A4 y boletín semanal consolidado por WhatsApp; generador automático de salidas al servicio del campo por bloques horarios y modalidades con rotación de conductores y sugerencia de territorios rezagados.',
      },
      {
        category: 'feature',
        text: 'Auditoría Ponderada de Carga Teocrática y Equidad Transversal (EquidadDashboardTab): Puntuación ponderada personalizable por rol (Enseñanza Principal, Partes Estudiantiles, Deberes/Logística, Ministerio del Campo y Oraciones) que mide el esfuerzo real acumulado por hermano, detecta sobrecarga o subutilización y genera reportes imprimibles de equidad.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.16',
    buildCode: '2026.10.23.6700',
    date: '23 de Octubre, 2026',
    title: 'Optimización Integral de Experiencia Móvil (Auditoría UI/UX, Gestos Táctiles y Ergonomía)',
    isCurrent: false,
    highlight: 'Cabecera móvil despejada, barra de semanas fija con navegación por gestos swipe, KPIs interactivos deslizables en Territorios y Publicadores, modales estilo Bottom Sheet y alertas posicionadas sobre la barra inferior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Cabecera Superior y Pie de Página Móvil Simplificados: Se redujo la densidad de iconos secundarios en la cabecera móvil (< 640px) trasladándolos al menú de cuenta y hoja inferior, y se compactó el pie de página interno a una sola línea discreta.',
      },
      {
        category: 'feature',
        text: 'Navegación Táctil en Programa de Reuniones: Sub-cabecera de semanas fija (sticky) con soporte para deslizar horizontalmente (swipe izquierda/derecha) entre semanas, botón directo "Hoy" y agrupación de herramientas secundarias.',
      },
      {
        category: 'improvement',
        text: 'Cintas de KPIs Interactivas, Tablas con Primera Columna Fija y Modales Bottom Sheet: Los KPIs de Territorios y Publicadores ahora funcionan como filtros rápidos deslizables en una sola fila móvil, las tablas fijan su primera columna al desplazar y los modales clave abren como hoja inferior.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.15',
    buildCode: '2026.10.23.6600',
    date: '23 de Octubre, 2026',
    title: 'Indicador de Carga Global (LoadingSpinner) durante la Sincronización con Supabase',
    isCurrent: false,
    highlight: 'Nuevo componente LoadingSpinner con animación orbital concéntrica y velo translúcido sobre el contenido de cada pestaña mientras se sincronizan y cifran los datos con Supabase',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Componente Global LoadingSpinner: Nuevo indicador visual con anillos orbitales en rotación inversa, barra luminosa superior y estado contextual de la pestaña activa durante operaciones de sincronización.',
      },
      {
        category: 'improvement',
        text: 'Superposición en Pestañas Activas: El indicador se despliega de forma elegante sobre el área de contenido de cada pestaña mientras se realiza la descarga, descifrado o subida cifrada AES-256-GCM con Supabase.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.14',
    buildCode: '2026.10.23.6500',
    date: '23 de Octubre, 2026',
    title: 'Redacción Institucional y Profesional de Términos de Uso y Política de Privacidad',
    isCurrent: false,
    highlight: 'Actualización integral de los Términos de Uso y la Política de Privacidad con estructura normativa profesional, cláusulas técnicas de cifrado (AES-256-GCM / PBKDF2), gobernanza de roles (RBAC), declaración de independencia institucional y derechos ARCO+',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Marco Normativo de Términos de Uso: Redacción estructurada por cláusulas profesionales que detallan el alcance operativo teocrático (S-140, S-89, S-13, S-88), la declaración explícita de independencia institucional respecto a jw.org, el modelo de custodia de credenciales en tres niveles (PIN de Congregación, PIN Maestro de Ancianos y PIN Personal + 2FA TOTP) y la responsabilidad sobre copias de respaldo locales.',
      },
      {
        category: 'security',
        text: 'Política de Privacidad, Cifrado y Protección de Datos: Especificación técnica y jurídica del modelo de Conocimiento Cero (Zero-Knowledge), cifrado en cliente AES-256-GCM con derivación PBKDF2-HMAC-SHA256 (hasta 600.000 iteraciones), minimización de datos, cumplimiento de Uso Limitado (Limited Use) de Google OAuth 2.0 y ejercicio de derechos ARCO+.',
      },
      {
        category: 'improvement',
        text: 'Sincronización con Páginas Oficiales Estáticas: Actualización de los documentos públicos (/terms y /privacy) en español e inglés para mantener total coherencia entre las vistas internas de la aplicación y la verificación oficial de Google Trust & Safety.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.13',
    buildCode: '2026.10.23.6400',
    date: '23 de Octubre, 2026',
    title: 'Vistas Dedicadas de Página Completa para Registro de Versiones (Changelog) y Términos y Privacidad',
    isCurrent: false,
    highlight: 'Conversión del Registro de Versiones (Changelog) y de los Términos de Uso y Política de Privacidad de ventanas emergentes (pop-ups) a vistas limpias de página completa con navegación de regreso',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Registro de Versiones (Changelog) en Página Completa: Se eliminó el contenedor flotante tipo pop-up para presentar el historial completo de versiones en una vista amplia de pantalla completa con barra superior de retorno («Volver atrás»).',
      },
      {
        category: 'improvement',
        text: 'Términos de Uso y Política de Privacidad en Página Completa: Tanto la consulta de documentos legales desde el pie de página y casillas de consentimiento como la pantalla de primer ingreso se muestran ahora como páginas completas sin ventanas emergentes recortadas.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.12',
    buildCode: '2026.10.23.6300',
    date: '23 de Octubre, 2026',
    title: 'Aceptación Obligatoria de Términos de Uso y Política de Privacidad en Registro y Primer Ingreso',
    isCurrent: false,
    highlight: 'Casilla interactiva y modal de consentimiento obligatorio de Términos de Uso y Política de Privacidad al registrar una congregación o ingresar por primera vez a la aplicación',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Consentimiento en Registro de Congregación: En el paso final del Asistente de Registro de Congregación se exige aceptar expresamente los Términos de Uso y la Política de Privacidad antes de crear y activar la congregación.',
      },
      {
        category: 'security',
        text: 'Consentimiento en Primer Inicio de Sesión: Se incorporó la casilla interactiva de aceptación legal con lectura directa de los Términos de Uso y la Política de Privacidad en todos los métodos de acceso (Google Sign-In, ID y PIN de Congregación, Código de Invitación y Modal de Conexión).',
      },
      {
        category: 'improvement',
        text: 'Guardia de Primer Ingreso Directo: Si un usuario accede por primera vez mediante un enlace directo o código QR sin haber aceptado previamente los términos en su dispositivo, se muestra una ventana de bienvenida legal para su lectura y aceptación antes de continuar.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.11',
    buildCode: '2026.10.23.6200',
    date: '23 de Octubre, 2026',
    title: 'Autenticación de Dos Pasos (2FA) con Microsoft Authenticator y Códigos de Respaldo',
    isCurrent: false,
    highlight: 'Verificación en dos factores opcional (TOTP RFC 6238) compatible con Microsoft Authenticator y Google Authenticator, 100% offline, códigos de recuperación y dispositivos de confianza',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Motor criptográfico TOTP nativo (RFC 6238): Implementación en cliente con Web Crypto API (HMAC-SHA1, 30s de intervalo, 6 dígitos y tolerancia de desfase de ±30s) sin librerías externas.',
      },
      {
        category: 'feature',
        text: 'Compatibilidad con Microsoft Authenticator: Generador de códigos QR otpauth:// y wizard paso a paso con opción de ingreso de clave secreta manual.',
      },
      {
        category: 'security',
        text: 'Códigos de respaldo de emergencia: 8 códigos únicos de un solo uso con almacenamiento seguro mediante hashes criptográficos SHA-256 en reposo.',
      },
      {
        category: 'feature',
        text: 'Dispositivos de confianza ("Recordar por 30 días"): Opción para recordar el navegador de uso personal y solicitar el código de 6 dígitos únicamente en dispositivos nuevos o tras 30 días de inactividad.',
      },
      {
        category: 'feature',
        text: 'Gestión teocrática y portal de publicadores: Pestaña "Seguridad 2FA" en Mi Portal, activación/desactivación voluntaria, e insignia de 2FA activo y botón de restablecimiento en Directorio para ancianos.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.10',
    buildCode: '2026.10.23.6100',
    date: '23 de Octubre, 2026',
    title: 'Páginas Legales Oficiales y Rutas Directas de Privacidad y Términos para Verificación de Google',
    isCurrent: false,
    highlight: 'Rutas directas #privacy, #terms, /privacy, /terms y páginas estáticas dedicadas en cumplimiento estricto con la Google API Services User Data Policy',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Rutas públicas directas de Privacidad y Términos: Detección y despliegue automático del documento legal correspondiente ante enlaces directos #privacy, #terms, #privacidad, #terminos, /privacy y /terms.',
      },
      {
        category: 'feature',
        text: 'Páginas estáticas autónomas (privacy.html y terms.html): Creación de documentos HTML completos e independientes con diseño adaptativo y reglas de rewrite en vercel.json para acceso universal de evaluadores y crawlers de Google.',
      },
      {
        category: 'security',
        text: 'Cláusula formal de cumplimiento Google OAuth (Limited Use): Inclusión detallada del tratamiento exclusivo de datos de perfil de Google, no comercialización, retención mínima y apego a la Google API User Data Policy.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.9',
    buildCode: '2026.10.23.6000',
    date: '23 de Octubre, 2026',
    title: 'Corrección de Re-autenticación y Selector de Cuentas con Google',
    isCurrent: false,
    highlight: 'URL de retorno OAuth canónica sin fragmentos hash, activación de prompt=select_account y preservación de parámetros de autorización en montaje',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'URL canónica de retorno OAuth: Corrección en AuthContext eliminando fragmentos hash en redirectTo, permitiendo a Supabase Auth detectar e intercambiar correctamente el código de autorización (?code=) sin parámetros truncados.',
      },
      {
        category: 'fix',
        text: 'Selector explícito de cuentas Google (prompt=select_account): Al pulsar "Cambiar cuenta" y re-ingresar con Google, la interfaz solicita siempre al usuario qué cuenta desea conectar.',
      },
      {
        category: 'fix',
        text: 'Protección contra sobreescritura de parámetros OAuth: En App.tsx, se inhabilita el reemplazo de URL mientras existan parámetros de retorno de autorización (?code= o access_token), garantizando la creación ininterrumpida de sesión.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.8',
    buildCode: '2026.10.23.5900',
    date: '23 de Octubre, 2026',
    title: 'Sincronización Precisa de Historial y Vistas en Portal de Bienvenida',
    isCurrent: false,
    highlight: 'Corrección de persistencia de sub-vista de Google al recargar #portal y preservación de parámetros de vista en el hash de navegación',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Prioridad de URL sobre sessionStorage: En CongregationWelcomeLanding, el parámetro explícito ?view= en el hash o search params tiene prioridad estricta sobre kongre_pending_oauth_view. Al refrescar o navegar en #portal sin sub-vista, se purgan vistas temporales obsoletas y se muestra siempre la vista de inicio.',
      },
      {
        category: 'fix',
        text: 'Preservación de sub-vistas en historial: En App.tsx, la sincronización inicial de historial no sobreescribe ciegamente sub-vistas legítimas (como #portal?view=email_login) con #portal, manteniendo la URL y la interfaz perfectamente alineadas.',
      },
      {
        category: 'improvement',
        text: 'Higiene de sesión OAuth: Limpieza inmediata de kongre_pending_oauth_view al volver al inicio del portal o al retroceder con el botón Atrás del navegador.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.7',
    buildCode: '2026.10.23.5800',
    date: '23 de Octubre, 2026',
    title: 'Auditoría Profunda de Seguridad: Mitigación de DoS en Rate Limits, Purga de PIN en Texto Plano y Blindaje Anti-Bypass',
    isCurrent: false,
    highlight: 'Prevención de fuga de PIN de sesión en vista personal, anti-agotamiento en tabla sync_rate_limits, sincronización segura kgr_v2 y blindaje de firmas de rol con entropía de dispositivo',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Almacenamiento seguro de PIN en Vista Personal: Eliminación de almacenamiento en texto plano en localStorage dentro de PersonalViewTab mediante setSecureLocalPin (cifrado kgr_v2 y memoria volátil) y purga en cascada en Navbar y AuthContext.',
      },
      {
        category: 'security',
        text: 'Prevención de DoS y agotamiento en sync_rate_limits: La Edge Function valida la existencia previa del publicador en row.personal_verifiers antes de registrar contadores de tasa, impidiendo la saturación maliciosa de la base de datos con identificadores arbitrarios.',
      },
      {
        category: 'fix',
        text: 'Sincronización robusta kgr_v2 con isEncryptedPinAtRest: Unificación del reconocimiento de formatos de cifrado en reposo (kgr_v2 y kgr_v1) en AuthContext, App, SecurityContext, supabaseSyncService y CongregationContext, resolviendo desincronizaciones de estado.',
      },
      {
        category: 'security',
        text: 'Blindaje contra bypass de pantalla de bloqueo y firmas de rol (isSafeDemoMode): La bandera kongre_demo_mode es invalidada y purgada automáticamente si la sesión corresponde a una congregación real registrada, impidiendo eludir la pantalla de bloqueo o falsificar firmas.',
      },
      {
        category: 'security',
        text: 'Firma de rol v2 ligada a entropía de dispositivo: Actualización de la firma criptográfica de rol en localStorage para incluir el salt de entropía único de la máquina, impidiendo la falsificación de privilegios en consola.',
      },
      {
        category: 'security',
        text: 'Protección contra tablas arcoíris en registro de auditoría: Salteado con entropía del dispositivo en el enmascaramiento de PINs de hermanos en el log de auditoría (sanitizeActorNid), impidiendo la inversión de PINs de 4 dígitos.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.6',
    buildCode: '2026.10.23.5700',
    date: '23 de Octubre, 2026',
    title: 'Remediación Integral de Seguridad: Cifrado en Reposo CTR con Tag MAC, CSP Estricta sin Unsafe-Inline y Claves Ligadas a Entropía',
    isCurrent: false,
    highlight: 'Cifrado local de salud/PINs en modo CTR no repetitivo, sesión activa en memoria y eliminación de inline scripts en CSP',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Cifrado en reposo no repetitivo (H-02): Migración de datos sensibles de salud, contactos de emergencia y teléfonos a Counter-Mode (CTR) con nonce CSPRNG de 128 bits y etiqueta de integridad MAC (kgr_sec3:...), eliminando la repetición de keystream cada 30 bytes.',
      },
      {
        category: 'security',
        text: 'Almacenamiento de PIN en memoria y dispositivo (H-01): El PIN activo se mantiene en memoria (sessionStorage) y se cifra en localStorage con clave ligada a la sal de entropía del dispositivo (kgr_v2:...), eliminando claves de cifrado fijas en el bundle público.',
      },
      {
        category: 'security',
        text: 'CSP Estricto sin scripts inline (H-03): Externalización del script de inicialización de tema a /theme-init.js y eliminación de unsafe-inline en script-src en la política Content-Security-Policy en vercel.json.',
      },
      {
        category: 'security',
        text: 'KDF v2 a 600.000 iteraciones (M-07): Activación de WRITE_KDF_V2 = true en el motor criptográfico PBKDF2-SHA256 según estándares OWASP, preservando lectura transparente de versiones legadas.',
      },
      {
        category: 'security',
        text: 'CSPRNG Obligatorio sin degradación (L-01): Eliminación de respaldos silenciosos a Math.random(), reemplazados por getSecureRandomBytes() con excepciones explícitas y Fisher-Yates sin sesgo de módulo.',
      },
      {
        category: 'security',
        text: 'Validación de esquema HTTPS en mapas (L-02): Enlaces a mapas digitales y Google Maps restringidos estrictamente al protocolo https://.',
      },
      {
        category: 'security',
        text: 'Manejo seguro de enlaces de notificación (L-03): El Service Worker push-sw.js valida que cualquier URL de apertura pertenezca al origen de la aplicación.',
      },
      {
        category: 'security',
        text: 'Rechazo de credenciales en URL directa (L-04): Bloqueo total de parámetros cpin o pin en texto plano en la barra de direcciones y limpieza automática del historial de navegación.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.5',
    buildCode: '2026.10.23.5600',
    date: '23 de Octubre, 2026',
    title: 'CSP Activo en Producción, Higiene de PWA Caching y Orígenes Restringidos en Errores 500',
    isCurrent: false,
    highlight: 'Content-Security-Policy activo bloqueador y limpieza total de runtime caching',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'CSP Activo en Producción (enforce): Activación de Content-Security-Policy como cabecera HTTP activa de bloqueo en vercel.json, impidiendo clickjacking, inserción de scripts externos no autorizados y ataques XSS.',
      },
      {
        category: 'improvement',
        text: 'Higiene de Service Worker: Eliminación de la regla obsoleta de runtime caching para *.supabase.co/rest/v1/* en vite.config.ts, optimizando el almacenamiento offline tras la migración a Edge Functions.',
      },
      {
        category: 'security',
        text: 'CORS seguro en excepciones 500: La Edge Function kongre-sync ahora aplica la lista estricta de ALLOWED_ORIGINS incluso en respuestas de error 500, eliminando el comodín (*).',
      },
    ],
  },
  {
    version: '0.1.0-alpha.4',
    buildCode: '2026.10.23.5500',
    date: '23 de Octubre, 2026',
    title: 'Fortalecimiento de Invitaciones: 50 Bits de Entropía Criptográfica y Hash v2 Normalizado',
    isCurrent: false,
    highlight: 'Códigos de invitación de alta entropía inmunes a fuerza bruta offline',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Entropía de 10 caracteres base32 (50 bits): Los códigos de invitación generados adoptan el formato KONG-[ROL]-XXXXX-XXXXX (>1.1 billones de combinaciones), eliminando la viabilidad de ataques de fuerza bruta offline con GPU.',
      },
      {
        category: 'security',
        text: 'Hash v2 canónico (inv_h2_): Normalización alfanumérica de invitaciones con sal criptográfica y compatibilidad total hacia atrás con hashes v1 existentes.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.3',
    buildCode: '2026.10.23.5400',
    date: '23 de Octubre, 2026',
    title: 'Minimización de Datos en Nube (Ley 1581) e Higiene de Dependencias (0 Vulnerabilidades)',
    isCurrent: false,
    highlight: 'Payload público minimizado y dependencias auditadas al 100%',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Minimización de datos en payload_public (Ley 1581 / Privacidad): Se retiraron los informes mensuales de predicación (monthlyReports) y los correos electrónicos de publicadores del payload público, restringiéndolos exclusivamente al payload maestro del cuerpo de ancianos.',
      },
      {
        category: 'security',
        text: 'Higiene total de dependencias: Desinstalación de paquetes residuales express, @types/express y dotenv. Corrección y auditoría completa vía npm audit alcanzando 0 vulnerabilidades.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.2',
    buildCode: '2026.10.23.5300',
    date: '23 de Octubre, 2026',
    title: 'Blindaje de Seguridad Integral: Cifrado en Reposo (Ley 1581), Cabeceras HTTP y Dominio Oficial',
    isCurrent: false,
    highlight: 'Última versión compilada y activa con suite completa de seguridad',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Cifrado de datos sensibles en reposo (Ley 1581 / Salud y Contactos): Notas médicas, alergias, teléfonos, direcciones y contactos de emergencia ahora se almacenan cifrados con AES-256-GCM en el almacenamiento local y se descifran en memoria transparentemente.',
      },
      {
        category: 'security',
        text: 'Cabeceras HTTP de seguridad en producción: Despliegue de Content-Security-Policy (Report-Only), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security y Permissions-Policy en vercel.json.',
      },
      {
        category: 'security',
        text: 'Validación de bloqueo RLS en base de datos: Confirmación de restricción 42501 en tablas públicas directas de Supabase y enrutamiento exclusivo a través de la Edge Function kongre-sync.',
      },
      {
        category: 'improvement',
        text: 'Dominio Oficial y Analíticas: Despliegue en kongre-app.com con integración de Vercel Analytics y Speed Insights.',
      },
      {
        category: 'fix',
        text: 'Higiene web y dependencias: Atributo rel="noopener noreferrer" en todos los enlaces externos de la interfaz y resolución de conflictos peer-dependencies en esbuild.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.1',
    buildCode: '2026.10.23.5200',
    date: '23 de Octubre, 2026',
    title: 'Transición Fluida de OAuth con Google y Diseño Full-Width en Portal de Acceso',
    isCurrent: false,
    highlight: 'Última versión compilada y activa',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Navegación automática post-Google OAuth: Al autorizar con Google, el usuario regresa directamente al menú de vinculación de congregación sin tener que pulsar nuevamente el botón de acceso.',
      },
      {
        category: 'improvement',
        text: 'Diseño Full-Width para vistas de acción: El menú de inicio con Google y de conexión por ID/PIN ahora se expanden al ancho completo de pantalla (como el registro), con cuadrícula equilibrada de 2 columnas para ID y PIN.',
      },
      {
        category: 'fix',
        text: 'Pre-llenado de ID canónico: Recuperación y formato automático del ID de congregación para cuentas con historial en la nube al ingresar con Google.',
      },
    ],
  },
  {
    version: '0.1.0-alpha.0',
    buildCode: '2026.10.23.5100',
    date: '23 de Octubre, 2026',
    title: 'Sincronización Segura vía Supabase Edge Function y Blindaje Criptográfico de PINs y Roles',
    isCurrent: false,
    highlight: 'Versión estable',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Sincronización Segura Cero Conocimiento: Se reemplazó el acceso directo a tablas por la Edge Function kongre-sync con validación de credenciales en servidor y tokens derivados por PBKDF2.',
      },
      {
        category: 'security',
        text: 'Eliminación de Hashes de PIN del Payload Público: Se removieron los hashes de PIN personal de payload_public, impidiendo ataques de fuerza bruta offline contra PINs de 4 dígitos.',
      },
      {
        category: 'security',
        text: 'Verificación en Servidor con Rate Limiting: Verificación de PIN personal en Edge Function con publisher_id obligatorio y bloqueo por fuerza bruta (8 intentos fallidos por congregación e IP).',
      },
      {
        category: 'security',
        text: 'Protección de Integridad del Payload Público: La acción push ahora requiere nivel maestro exclusivamente (403 para solicitudes públicas), impidiendo manipulación de roles o configuraciones.',
      },
      {
        category: 'security',
        text: 'PIN Maestro de 8+ Dígitos: El asistente de registro ahora exige un PIN Maestro mínimo de 8 dígitos para el Coordinador (100 millones de combinaciones).',
      },
      {
        category: 'security',
        text: 'Saneamiento de Sesión Local: Se eliminó el bypass permisivo de re-firma de rol en verifyRoleSessionSignature.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.8',
    buildCode: '2026.10.22.4501',
    date: '22 de Octubre, 2026',
    title: 'Eliminación del Menú Lateral en Dispositivos Móviles y Navegación Exclusiva Inferior',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Eliminación del Botón y Cajón Lateral en Móvil (Navbar.tsx): Se retiró por completo el botón de menú hamburguesa en la cabecera móvil (< md), el sensor táctil del borde izquierdo y los gestos de deslizamiento lateral (swipe-to-open).',
      },
      {
        category: 'improvement',
        text: 'Cabecera Móvil Unificada con Icono de Congregación: En dispositivos móviles ahora se muestra directamente el distintivo limpio de la congregación (Building2) junto al título y migas de pan.',
      },
      {
        category: 'improvement',
        text: 'Hoja Inferior Nativa (Bottom Sheet) desde Barra Inferior: Al abrir el catálogo completo de departamentos desde la barra de navegación inferior en móvil, ahora se despliega como una hoja inferior (slide-in-from-bottom) sin menús ni tiradores laterales.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.7',
    buildCode: '2026.10.22.4401',
    date: '22 de Octubre, 2026',
    title: 'Control de Barra Lateral Oculto Detrás del Icono de Congregación con Revelación al Pasar el Cursor',
    isCurrent: false,
    highlight: 'Versión estable anterior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Revelación Dinámica al Pasar el Cursor (Hover) (Navbar.tsx): El control para ocultar la barra lateral ahora reside elegantemente detrás del icono de congregación (Building2). Por defecto se presenta como el avatar o distintivo visual de la congregación, y al pasar el cursor (hover) se transforma con una microanimación fluida en el botón PanelLeftClose ([|<]) para colapsar la barra lateral con un clic.',
      },
      {
        category: 'improvement',
        text: 'Cabecera Limpia y Armoniosa: Sin botones desnudos o estáticos que interfieran con el nombre de la congregación cuando no se interactúa con ellos, manteniendo además el botón en el pie de la barra lateral y el atajo de teclado Ctrl+B / ⌘B.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.6',
    buildCode: '2026.10.22.4301',
    date: '22 de Octubre, 2026',
    title: 'Corrección Definitiva de Ubicación del Control de Barra Lateral en Cabecera',
    isCurrent: false,
    highlight: 'Versión estable anterior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'fix',
        text: 'Eliminación del Icono Colisionante en Migas de Pan (Navbar.tsx): Se removió por completo el botón residual PanelLeftClose que aparecía flotando delante del nombre de la congregación en la cabecera cuando la barra lateral estaba abierta.',
      },
      {
        category: 'improvement',
        text: 'Ubicación Canónica en Barra de Herramientas Superior: El control de alternancia de la barra lateral ahora se ubica en el área derecha de utilidades de la cabecera (junto al selector de tema oscuro/claro) y en el pie de la barra lateral vertical, manteniendo la cabecera izquierda 100% limpia para el título y la navegación.',
      },
      {
        category: 'improvement',
        text: 'Persistencia de Accesibilidad con Atajo Ctrl+B / ⌘B: Se mantiene la capacidad de alternar la barra lateral al instante mediante teclado o botones no invasivos.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.5',
    buildCode: '2026.10.22.4201',
    date: '22 de Octubre, 2026',
    title: 'Optimización Ergonómica del Control para Ocultar Barra Lateral y Atajo Global Ctrl+B',
    isCurrent: false,
    highlight: 'Versión estable anterior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Ubicación Natural en Barra Lateral (Navbar.tsx): Se integró el botón para ocultar la barra lateral (PanelLeftClose) directamente en el pie de la barra vertical junto a Mi Perfil y Ajustes, donde reside la interacción del menú.',
      },
      {
        category: 'improvement',
        text: 'Cabecera Despejada y Diferenciación Móvil/Desktop (Navbar.tsx): En pantallas móviles el botón de cabecera ahora muestra el icono y etiqueta de "Menú" (hamburguesa). En escritorio, cuando la barra lateral está oculta, se muestra un botón destacado (PanelLeftOpen) para restaurarla junto al isotipo de Kongre.',
      },
      {
        category: 'feature',
        text: 'Atajo de Teclado Global Ctrl+B / ⌘B (App.tsx): Ahora es posible alternar (ocultar o mostrar) la barra lateral al instante desde cualquier sección del sistema presionando Ctrl+B o ⌘B.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.4',
    buildCode: '2026.10.22.4101',
    date: '22 de Octubre, 2026',
    title: 'Eliminación de Barra de Cabecera Redundante en Mi Ministerio y Limpieza de Repeticiones en Navegación',
    isCurrent: false,
    highlight: 'Versión estable anterior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Eliminación de Barra de Cabecera Redundante (MinisterioPublicadorTab.tsx): Se retiró la tarjeta/banner superior que duplicaba el título de la vista y contenía accesos repetidos hacia "Mis Asignaciones" y "Mi Congregación", completando el estándar global de arranque directo (Opción 1) y ahorrando hasta 90px de espacio vertical.',
      },
      {
        category: 'fix',
        text: 'Depuración de Secciones Duplicadas (Navbar.tsx): Se eliminó la repetición de "Portal del Publicador (mi_vista)" dentro de la categoría Supervisión & Control, consolidándola exclusivamente dentro del menú de Publicador.',
      },
      {
        category: 'improvement',
        text: 'Sincronización Bidireccional de Subpestañas (MinisterioPublicadorTab.tsx): Los botones de Panel Principal, Cronómetro, Revisitas y Estudios ahora actualizan directamente la pestaña activa de navegación global (setActiveTab), manteniendo la barra superior y migajas de pan perfectamente alineadas.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.3',
    buildCode: '2026.10.22.4001',
    date: '22 de Octubre, 2026',
    title: 'Autoguardado Instantáneo de Tiempo de Ministerio (+15m) y Sincronización Multidispositivo en Tiempo Real',
    isCurrent: false,
    highlight: 'Versión estable anterior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Autoguardado Instantáneo del Ministerio y Meta Mensual (MinisterioPublicadorTab.tsx): Cualquier ajuste de tiempo (+15m, +30m, +1h, -5m), cronómetro activo, cambio de meta mensual, revisitas o estudios bíblicos se guarda y sincroniza automáticamente en la nube sin necesidad de presionar manualmente "Guardar en mi Informe S-4".',
      },
      {
        category: 'fix',
        text: 'Sincronización de Fracciones de Hora (15 min) entre PC y Móvil (types/index.ts, supabaseSyncService.ts, CongregationContext.tsx): Inclusión de monthlyReports en payload_public con resolución inteligente por marca de tiempo (mergeMonthlyReports) y soporte para minutes, totalMinutes, hourGoal y timeLogs, evitando que las fracciones menores a 1 hora se redondeen a 0h en el dispositivo móvil.',
      },
      {
        category: 'improvement',
        text: 'Controles Rápidos en "Mi Meta y Registro Mensual" y Panorama General (MinisterioPublicadorTab.tsx, PanoramaGeneralTab.tsx): Botones directos (-5m, +15m, +30m, +1h) en la tarjeta de meta mensual y visualización exacta de horas y minutos (ej. 15m o 1h 15m) tanto en Mi Ministerio como en la tarjeta de Informe de Panorama General.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.2',
    buildCode: '2026.10.22.3901',
    date: '22 de Octubre, 2026',
    title: 'Estrategia Avanzada de Caché en Service Worker y Persistencia Offline de Formularios S-89 con IndexedDB',
    isCurrent: false,
    highlight: 'Versión estable anterior',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Almacenamiento Persistente de Formularios S-89 en IndexedDB (s89IndexedDbService.ts): Nuevo motor Offline-First que solicita almacenamiento persistente (StorageManager.persist) y guarda todas las boletas S-89 por semana con cifrado AES-GCM en reposo, estados de entrega/confirmación y archivos PDF rellenados.',
      },
      {
        category: 'improvement',
        text: 'Estrategia de Caché Optimizada en Service Worker (vite.config.ts): Incorporación de reglas Workbox runtimeCaching específicas para formularios S-89 (StaleWhileRevalidate), plantillas PDF oficiales (CacheFirst) y datos de programación en Supabase (NetworkFirst con timeout de 4s), además de precaching extendido para archivos PDF y JSON.',
      },
      {
        category: 'feature',
        text: 'Sincronización Bidireccional con Service Worker (push-sw.js): Almacén s89_offline_forms integrado dentro del propio Service Worker con intercepción de rutas virtuales /__offline__/s89/* y soporte Background Sync (kongre-sync-s89-forms) para servir asignaciones estudiantiles incluso sin conexión.',
      },
      {
        category: 'improvement',
        text: 'Control de Entrega S-89 Offline (S89SlipsTab.tsx): Indicador de respaldo IndexedDB en la barra de acciones y botón interactivo en cada boleta S-89 para alternar entre "Pendiente" y "Entregada" con persistencia inmediata sin conexión.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.1',
    buildCode: '2026.10.22.3801',
    date: '22 de Octubre, 2026',
    title: 'Blindaje de Invitaciones por QR y PIN, Asignación Inmediata de Rol Teocrático y Aislamiento de Modo Demo',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'security',
        text: 'Verificación y Canje Multidispositivo de Invitaciones por QR y PIN: Reconocimiento flexible de códigos completos (KONG-ROL-...), códigos cortos, tokens cifrados (kgr_tk1_...) y formato portátil compuesto (CONG::CPIN::INVITE) tanto en memoria local como sincronizados con Supabase.',
      },
      {
        category: 'fix',
        text: 'Activación Inmediata del Rol Teocrático Asignado: Al canjear una invitación válida generada por los ancianos o escanear su código QR, el rol otorgado (Secretario, Superintendente de Servicio, Siervo de Discursos, etc.) se activa y firma criptográficamente al instante sin bloquear a usuarios con cuenta de Google en solicitudes pendientes.',
      },
      {
        category: 'security',
        text: 'Control Anti-Reutilización y Sincronización Cloud: Las invitaciones canjeadas se marcan automáticamente como utilizadas (used), se cifran en reposo con AES-GCM y disparan sincronización automática con la nube.',
      },
      {
        category: 'fix',
        text: 'Aislamiento Estricto de Datos de Demostración: Las congregaciones recién registradas inician completamente limpias en el menú "Mi Congregación" y módulos asociados, reservando los datos de muestra exclusivamente para el Modo Demo activo.',
      },
    ],
  },
  {
    version: '0.0.11-alpha.0',
    buildCode: '2026.10.22.3701',
    date: '22 de Octubre, 2026',
    title: 'Nuevo Panel "Mi Congregación", Estadísticas de Secretaría y Auditoría de Accesibilidad ARIA',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Nuevo Panel "Mi Congregación" (PanoramaGeneralTab): Vista centralizada con tarjetas de Informe mensual (con registro rápido S-4), Próximos privilegios (partes de Vida y Ministerio, Reunión Pública, S-89, deberes, aseo por grupo y turnos de carritos), Tablero de anuncios, Eventos teocráticos y Directorio rápido de secciones.',
      },
      {
        category: 'improvement',
        text: 'Integridad Estricta de Datos vs Modo Demo Interactivo: En modo real se muestran únicamente registros, anuncios y eventos existentes de la congregación (sin datos inventados ni fechas predeterminadas), mientras que en Modo Demo se despliegan ejemplos interactivos que navegan directamente a cada módulo.',
      },
      {
        category: 'improvement',
        text: 'Reubicación de "Estadísticas de Secretaría": La vista analítica de congregación se trasladó dentro de la categoría Secretaría y Registros con denominación única, eliminando cualquier duplicidad de nombres en la barra de navegación y buscador global.',
      },
      {
        category: 'improvement',
        text: 'Auditoría Integral de Accesibilidad (ARIA): Incorporación de atributos aria-label, aria-expanded, aria-current="page", role="dialog" y aria-modal="true" en la barra lateral (Navbar), barra móvil inferior y modales de acción para lectores de pantalla.',
      },
    ],
  },
  {
    version: '0.0.10-alpha.9',
    buildCode: '2026.10.21.3601',
    date: '21 de Octubre, 2026',
    title: 'Nuevo Cronómetro de Predicación Circular de Precisión y Chip Navbar',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Esfera Circular de Precisión con Gradiente Dinámico: Nuevo cuadrante de cronómetro inspirado en la mecánica del reloj de bloqueo, con dial SVG de 220px, marcas perimetrales graduadas a 6° y 30°, arco de progreso animado, micro-halo ambiental y satélite de luz orbitante.',
      },
      {
        category: 'feature',
        text: 'Chip Activo en Barra Superior (Navbar): Cápsula viva sincronizada en tiempo real con anillo de progreso SVG de 22px que acompaña al publicador por toda la aplicación, permitiendo ver el tiempo acumulado desde cualquier sección y volver al ministerio con un clic.',
      },
      {
        category: 'improvement',
        text: 'Micro-Etiquetas y Tipografía de Alta Legibilidad: Formato monoespaciado HH:MM:SS con sub-rótulos (HRS, MIN, SEG) y cápsula de estado dinámico (● EN VIVO verde esmeralda, ❚❚ EN PAUSA ámbar, LISTO).',
      },
      {
        category: 'improvement',
        text: 'Controles Ergonómicos Táctiles: Píldoras de ajuste rápido (-5m, +15m, +30m, +1h), botones de incremento táctil circular para revisitas y publicaciones, y selector de modalidad contextual con iconos estilizados.',
      },
    ],
  },
  {
    version: '0.0.10-alpha.8',
    buildCode: '2026.10.21.3501',
    date: '21 de Octubre, 2026',
    title: 'Optimización Global de Interfaz: Arranque Directo con Contenido (Opción 1) en Toda la App',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Eliminación Integral de Banners Redundantes: Se auditaron y refactorizaron las 27 vistas y módulos de la aplicación, retirando los títulos y tarjetas interiores duplicadas (SectionHeader y hero banners) para consolidar la barra superior fija (Navbar) como la única fuente fidedigna de navegación.',
      },
      {
        category: 'improvement',
        text: 'Ahorro de Espacio Vertical (60-90px por vista): Cada sección inicia de forma inmediata con su contenido interactivo, barras de píldoras horizontales de subpestañas o barras de herramientas de acción directa (diseño ergonómico estilo Notion, Linear y Stripe).',
      },
      {
        category: 'feature',
        text: 'Barras de Herramientas Directas y Píldoras de Navegación: Estandarización de toolbars de acción compactos con badges contextuales en Ajustes, Publicadores, Territorios, Asistencia, Carritos, Hospitalidad, Precursores Auxiliares, Panel Eléctrico, Mantenimiento, Informe S-1, Editor de Publicador, Programa, Cuentas, Literatura, Discursos Públicos, Memorial/Asambleas, Visita Superintendente, Tarjetas S-21, Informes S-4, Grupos, Tablero, S-89, Conflictos, Equidad, Exportar y Roles.',
      },
      {
        category: 'security',
        text: 'Consistencia Estructural y DOM Optimizado: Reducción del anidamiento innecesario del DOM y unificación de la ergonomía de navegación táctil y de escritorio en toda la plataforma.',
      },
    ],
  },
  {
    version: '0.0.10-alpha.7',
    buildCode: '2026.10.21.3412',
    date: '21 de Octubre, 2026',
    title: 'Reloj Animado de Bloqueo por Inactividad, Anillos SVG y Aviso Flotante',
    isCurrent: false,
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'feature',
        text: 'Chip Contador en Barra Superior (Navbar): Muestra una cápsula animada con anillo de progreso SVG de 22px y cuenta regresiva mm:ss en tiempo real junto al botón de tema. Cambia a color ámbar con pulso suave en los últimos 60 segundos y a rojo con pulso acelerado en los últimos 30 segundos.',
      },
      {
        category: 'feature',
        text: 'Aviso Flotante (Toast) en los Últimos 60 Segundos: Notificación emergente inferior con anillo SVG de 46px, segundero en vivo e icono de candado. Tocar la pantalla, hacer clic o presionar cualquier tecla restablece el tiempo instantáneamente con animación refill fluida.',
      },
      {
        category: 'improvement',
        text: 'Nueva Tarjeta Interactiva en Ajustes de Seguridad: Anillo de 60px con indicador de minutos, switch on/off, control deslizante continuo de 5 a 15 minutos con marcas numéricas y acceso directo a presets (5 min recomendado, 10 min, 15 min).',
      },
      {
        category: 'security',
        text: 'Cálculo de Inactividad por Fecha Límite (Deadline): El tiempo se evalúa contra marcas de tiempo absolutas y eventos de visibilidad de pestaña (visibilitychange/focus), bloqueando de forma segura la sesión incluso al reabrir la app tras suspender el dispositivo.',
      },
    ],
  },
  {
    version: '0.0.10-alpha.6',
    buildCode: '2026.10.21.3411',
    date: '21 de Octubre, 2026',
    title: 'Optimización de Interfaz: Eliminación de Banner Redundante en Ajustes (Opción 1)',
    environment: 'Producción Cloud (Kongre)',
    changes: [
      {
        category: 'improvement',
        text: 'Eliminación del Banner Redundante en Ajustes: Se retiró la tarjeta interior que duplicaba el título de la congregación y ajustes bajo la barra superior fija, ganando hasta 90px verticales de espacio útil.',
      },
      {
        category: 'improvement',
        text: 'Arranque Directo con Contenido y Pestañas: La sección de Ajustes inicia directamente con la barra de navegación de categorías (Panel de Tarjetas, Notificaciones, General, Reglas, Seguridad, etc.).',
      },
      {
        category: 'feature',
        text: 'Barra de Herramientas Unificada y Limpia: Botones de Guardar Ajustes, Mi Perfil e indicador dinámico de sincronización/cambios pendientes integrados directamente en la fila de navegación estilo Notion / Linear.',
      },
    ],
  },
  {
    version: '0.0.10-alpha.5',
    buildCode: '2026.10.21.3410',
    date: '21 de Octubre, 2026',
    title: 'Botón de Modo Oscuro Sin Contenedor, Animación Fluida y Luna Blanca Nítida',
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
    version: '0.0.10-alpha.4',
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
    version: '0.0.10-alpha.3',
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
    version: '0.0.10-alpha.2',
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
    version: '0.0.10-alpha.1',
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
    version: '0.0.10-alpha.0',
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
    version: '0.0.9-alpha.2',
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
    version: '0.0.9-alpha.1',
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
    version: '0.0.9-alpha.0',
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
    version: '0.0.8-alpha.12',
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
    version: '0.0.8-alpha.11',
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
    version: '0.0.8-alpha.10',
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
    version: '0.0.8-alpha.9',
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
    version: '0.0.8-alpha.8',
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
    version: '0.0.8-alpha.7',
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
    version: '0.0.8-alpha.6',
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
    version: '0.0.8-alpha.5',
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
    version: '0.0.8-alpha.4',
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
    version: '0.0.8-alpha.3',
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
    version: '0.0.8-alpha.2',
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
    version: '0.0.8-alpha.1',
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
    version: '0.0.8-alpha.0',
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
    version: '0.0.7-alpha.0',
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
    version: '0.0.6-alpha.0',
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
    version: '0.0.5-alpha.0',
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
    version: '0.0.4-alpha.0',
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
    version: '0.0.3-alpha.0',
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
    version: '0.0.2-alpha.0',
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
    version: '0.0.1-alpha.0',
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
    version: '0.0.0-alpha.0',
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
