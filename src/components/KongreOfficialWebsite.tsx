import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CloudOff,
  Download,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  Monitor,
  Moon,
  QrCode,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Building2,
  Clock,
  AlertCircle,
  RefreshCw,
  Home,
  Compass,
  FileCheck2,
  Timer,
  Laptop,
  Check,
  Info,
  ChevronsUpDown,
  FileText,
  X,
} from 'lucide-react';
import Logo from '../Logo';
import AnimatedLogo from '../AnimatedLogo';
import { useTheme } from '../context/ThemeContext';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { DesktopCompatibilityBanner } from './DesktopCompatibilityBanner';
import { DesktopDownloadModal } from './DesktopDownloadModal';
import { AppFooter } from './AppFooter';
import { motion, AnimatePresence } from 'motion/react';

interface KongreOfficialWebsiteProps {
  onGoToPortal: (initialPortalTab?: string) => void;
  onStartDemoMode: () => void;
  onOpenVersionModal: () => void;
  isSignedInOrRegistered?: boolean;
  onEnterAppDirectly?: () => void;
}

type WebsiteSection = 'about' | 'guide' | 'downloads';

type RolePersonaId = 'elders' | 'servants' | 'pioneers' | 'publishers';

type GuideSectionCategory =
  | 'welcome'
  | 'install'
  | 'onboarding'
  | 'how-to'
  | 'security-faq';

type DocArticleId =
  | 'app-overview'
  | 'elder-first-approach'
  | 'install-android'
  | 'install-ios'
  | 'install-desktop'
  | 'create-congregation'
  | 'join-congregation'
  | 'navigation-overview'
  | 'roles-permissions'
  | 'ministry-timer-studies'
  | 'monthly-delegated-reports'
  | 'meetings-jwor-s89'
  | 'weekend-public-talks'
  | 'attendance-counter-s88'
  | 'persons-groups-s21'
  | 'territories-carts-hall'
  | 'sync-offline-backups'
  | 'security-2fa-troubleshooting';

interface DocStep {
  id: string;
  title: string;
  detail: string;
  badge?: string;
}

interface DocArticle {
  id: DocArticleId;
  categoryKey: GuideSectionCategory;
  categoryLabel: string;
  audience: string;
  title: string;
  summary: string;
  readTime: string;
  menuPath: string;
  steps: DocStep[];
  note?: string;
  tip?: string;
  warning?: string;
}

const GUIDE_SIDEBAR_SECTIONS: {
  id: GuideSectionCategory;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'welcome', title: 'Bienvenida y Resumen', icon: Sparkles },
  { id: 'install', title: 'Abrir e Instalar la App', icon: Smartphone },
  { id: 'onboarding', title: 'Primeros Pasos y Acceso', icon: KeyRound },
  { id: 'how-to', title: 'Cómo Usar Kongre', icon: Layers },
  { id: 'security-faq', title: 'Seguridad y Soporte', icon: ShieldCheck },
];

const ROLE_PERSONAS: {
  id: RolePersonaId;
  label: string;
  badge: string;
  headline: string;
  description: string;
  features: { title: string; detail: string }[];
  guideTarget: DocArticleId;
}[] = [
  {
    id: 'elders',
    label: 'Para Ancianos',
    badge: 'ENFOQUE ELDER-FIRST · PASTOREO Y SUPERVISIÓN',
    headline: 'Menos tiempo en trámites administrativos, más tiempo para pastorear el rebaño.',
    description:
      'Diseñada bajo un enfoque «Elder-First», la congregación es configurada y supervisada por el cuerpo de ancianos. Automatiza los programas semanales, consolida los informes para la sucursal y facilita el cuidado espiritual de cada grupo.',
    features: [
      {
        title: 'Importación automática de programas (JW.ORG / EPUB)',
        detail:
          'Carga las partes de la Reunión Vida y Ministerio y La Atalaya sin copiar ni pegar textos ni calcular duraciones manualmente.',
      },
      {
        title: 'Tarjetas S-21 digitales e Informe a la Sucursal (S-1)',
        detail:
          'Recopila los informes de los grupos de servicio, detecta publicadores irregulares o inactivos y consolida los totales mensuales y anuales.',
      },
      {
        title: 'Grupos de Servicio y Visita del Superintendente de Circuito',
        detail:
          'Organiza a los publicadores por grupo, revisa solicitudes de precursor auxiliar y genera la carpeta digital de auditoría para la visita del SC.',
      },
      {
        title: 'Control de Roles (RBAC) y Seguridad Cero Conocimiento',
        detail:
          'Asigna privilegios específicos a cada hermano nombrado con códigos de invitación personales y revocación instantánea en caso de extravío.',
      },
    ],
    guideTarget: 'create-congregation',
  },
  {
    id: 'servants',
    label: 'Para Siervos Ministeriales',
    badge: 'DEPARTAMENTOS · TERRITORIOS, SALÓN Y ASISTENCIA',
    headline: 'Herramientas precisas para cada departamento del Salón del Reino.',
    description:
      'Simplifica el trabajo de los siervos de territorios, cuentas, literatura, acomodadores y audio/video con plantillas oficiales listas para imprimir o compartir.',
    features: [
      {
        title: 'Contador de Asistencia en Vivo (Presencial + Zoom / S-88)',
        detail:
          'Botones táctiles para acomodadores que suman en tiempo real la asistencia en el auditorio y por videoconferencia, calculando el promedio S-88.',
      },
      {
        title: 'Mapas de Territorios GPS y Registro S-13',
        detail:
          'Polígonos interactivos, tarjetas digitales con código QR para conductores, direcciones «No visitar» y control de fechas de asignación.',
      },
      {
        title: 'Acomodadores, Micrófonos, Audio/Video y Limpieza',
        detail:
          'Programa los turnos semanales sin choques de horario con las partes estudiantiles o discursos.',
      },
      {
        title: 'Cuentas, Literatura y Mantenimiento del Salón',
        detail:
          'Lleva el control mensual de ingresos/egresos, inventario de publicaciones y esquema de seguridad del panel eléctrico.',
      },
    ],
    guideTarget: 'attendance-counter-s88',
  },
  {
    id: 'pioneers',
    label: 'Para Precursores',
    badge: 'PRECURSORES REGULARES, AUXILIARES Y ESPECIALES',
    headline: 'Lleva el control de tu ministerio, horas y cursos bíblicos incluso sin internet.',
    description:
      'Todo lo que un precursor necesita en su teléfono para organizar su horario de servicio, registrar sus horas con precisión y atender a las personas interesadas.',
    features: [
      {
        title: 'Cronómetro de Ministerio Integrado',
        detail:
          'Inicia, pausa y reanuda tu tiempo de predicación desde el celular. Acumula sesiones automáticamente y redondea los minutos a fin de mes.',
      },
      {
        title: 'Seguimiento de Metas Mensuales y Anuales',
        detail:
          'Visualiza tu progreso de horas para precursores auxiliares (15 o 30 horas) y precursores regulares a lo largo del año de servicio.',
      },
      {
        title: 'Registro Privado de Revisitas y Estudios Bíblicos',
        detail:
          'Anota tus estudiantes, publicación de estudio, lección actual y recordatorios de próxima visita cifrados localmente en tu dispositivo.',
      },
      {
        title: 'Solicitud Digital de Precursor Auxiliar',
        detail:
          'Envía tu solicitud para servir como precursor auxiliar en un mes especial o de forma continua directamente al Comité de Servicio.',
      },
    ],
    guideTarget: 'ministry-timer-studies',
  },
  {
    id: 'publishers',
    label: 'Para Publicadores y Estudiantes',
    badge: 'VISTA PERSONAL · ASIGNACIONES S-89 E INFORMES',
    headline: 'Tus asignaciones, programas de reunión e informes siempre a la mano.',
    description:
      'Una interfaz clara y amigable para que todos los hermanos de la congregación —jóvenes y mayores— consulten el programa semanal y cumplan sus asignaciones.',
    features: [
      {
        title: 'Hojas de Asignación S-89 y Confirmación en 1 Clic',
        detail:
          'Consulta tu próxima lectura bíblica o demostración con la fecha, ayudante, sala asignada y botón para agregarla al calendario de tu teléfono.',
      },
      {
        title: 'Entrega del Informe Mensual en Segundos',
        detail:
          'Marca tu casilla de participación en el ministerio, indica tus cursos bíblicos y envíalo directamente a tu Superintendente de Grupo.',
      },
      {
        title: 'Informes Delegados para la Familia',
        detail:
          'Los cabezas de familia pueden enviar fácilmente el informe mensual de sus hijos o de hermanos mayores que no utilizan teléfono inteligente.',
      },
      {
        title: 'Tablero de Anuncios, Carritos y Territorios en Bolsillo',
        detail:
          'Revisa el programa completo S-140, tus turnos de limpieza o exhibidores móviles y abre el mapa GPS del territorio con tu código QR.',
      },
    ],
    guideTarget: 'monthly-delegated-reports',
  },
];

const RBAC_DOCUMENTATION_MATRIX = [
  {
    role: 'Coordinador',
    scope: 'Administración Total',
    permissions:
      'Configuración de congregación, asignación de todos los roles, rotación de credenciales, programación completa, S-21, S-1, S-88 y bitácora de auditoría.',
  },
  {
    role: 'Secretario',
    scope: 'Secretaría, Grupos y S-21',
    permissions:
      'Directorio de publicadores, recopilación mensual de informes, consolidación S-1 para la sucursal, tarjetas S-21 globales, asistencia S-88 y precursores.',
  },
  {
    role: 'Sup. Vida y Ministerio (VMC)',
    scope: 'Entre Semana y S-89',
    permissions:
      'Importación de Guía de Actividades (MWB), asignación de partes estudiantiles y sala auxiliar, envío de hojas S-89, historial S-38 y tablero de equidad.',
  },
  {
    role: 'Siervo de Discursos',
    scope: 'Fin de Semana y Oradores',
    permissions:
      'Programación de discursos públicos, catálogo de bosquejos, oradores visitantes y salientes, presidente, lector de La Atalaya y hospitalidad.',
  },
  {
    role: 'Siervo de Territorios',
    scope: 'Mapas GPS y S-13',
    permissions:
      'Edición de polígonos y manzanas en el mapa, asignación/devolución de territorios, tarjetas digitales QR y exportación del registro oficial S-13.',
  },
  {
    role: 'Siervo de Cuentas / Literatura',
    scope: 'Departamentos del Salón',
    permissions:
      'Registro de ingresos/egresos mensuales, hojas de cuentas y control de inventario físico de publicaciones y solicitudes.',
  },
  {
    role: 'Sup. de Grupo de Servicio',
    scope: 'Su Grupo Asignado',
    permissions:
      'Seguimiento de informes mensuales de predicación, asistencia y visualización de tarjetas S-21 exclusivamente de los miembros de su grupo.',
  },
  {
    role: 'Publicador / Precursor',
    scope: 'Mi Portal Personal',
    permissions:
      'Consulta de sus asignaciones S-89, turnos de acomodador/micrófonos/limpieza, territorios asignados, cronómetro de ministerio, revisitas y envío de informe mensual.',
  },
];

const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'app-overview',
    categoryKey: 'welcome',
    categoryLabel: 'Bienvenida y Resumen',
    audience: 'Toda la Congregación',
    title: 'Descripción general de Kongre',
    summary:
      'Conoce qué es Kongre, cómo simplifica las tareas de la congregación y cómo combina aplicación web progresiva (PWA) y aplicación nativa de escritorio.',
    readTime: '3 min',
    menuPath: 'www.kongre-app.com',
    steps: [
      {
        id: 'que-es-kongre',
        title: 'Una herramienta todo en uno para la vida congregacional',
        badge: 'Propósito',
        detail:
          'Kongre es una aplicación gratuita y moderna diseñada para ayudar a las congregaciones de los Testigos de Jehová a organizar programas de reuniones, asignaciones estudiantiles, territorios, informes de servicio y deberes del Salón del Reino.',
      },
      {
        id: 'arquitectura-hibrida',
        title: 'Web PWA + Escritorio Nativo (Rust)',
        badge: 'Multiplataforma',
        detail:
          'Puede abrirse directamente desde cualquier navegador o instalarse en teléfonos (iOS y Android), tabletas y computadoras (Windows, macOS y Linux). Todos los dispositivos de la congregación se sincronizan de forma segura.',
      },
      {
        id: 'local-first-offline',
        title: 'Funcionamiento Local-First (100% sin conexión)',
        badge: 'Offline',
        detail:
          'Los datos se guardan primero en la memoria segura de tu dispositivo. Puedes consultar programas, usar el cronómetro de predicación o registrar la asistencia en el Salón aunque no haya internet.',
      },
    ],
    note: 'Kongre es una herramienta independiente desarrollada para apoyar las labores organizativas y no reemplaza las plataformas oficiales de jw.org.',
    tip: 'Usa las pestañas de la barra lateral izquierda para navegar entre las guías de instalación, configuración inicial y uso diario.',
  },
  {
    id: 'elder-first-approach',
    categoryKey: 'welcome',
    categoryLabel: 'Bienvenida y Resumen',
    audience: 'Cuerpo de Ancianos',
    title: 'Enfoque «Elder-First» y Privacidad de Datos',
    summary:
      'Por qué Kongre requiere la aprobación inicial del cuerpo de ancianos y cómo protege la confidencialidad de los registros de la congregación.',
    readTime: '4 min',
    menuPath: 'Seguridad y Gobernanza Teocrática',
    steps: [
      {
        id: 'aprobacion-ancianos',
        title: 'Configuración iniciada por el Cuerpo de Ancianos',
        badge: 'Elder-First',
        detail:
          'Para mantener el buen orden teocrático, una congregación en Kongre solo debe ser registrada tras contar con el acuerdo del cuerpo de ancianos local. El Coordinador o el Secretario crean el espacio de la congregación y administran los accesos.',
      },
      {
        id: 'cifrado-extremo-a-extremo',
        title: 'Cifrado de Extremo a Extremo (AES-256 Zero-Knowledge)',
        badge: 'Cifrado',
        detail:
          'Toda la información sensible (nombres, teléfonos, tarjetas S-21 e informes) se cifra en el dispositivo mediante AES-256-GCM antes de sincronizarse. Nadie externo a tu congregación puede leer los datos.',
      },
      {
        id: 'acceso-por-invitacion',
        title: 'Acceso controlado por Códigos de Invitación y Roles',
        badge: 'Privacidad',
        detail:
          'No existen perfiles públicos ni búsquedas abiertas de congregaciones. Cada publicador o siervo ingresa únicamente mediante su código de invitación o PIN asignado por los ancianos.',
      },
    ],
    warning:
      'Antes de cargar datos reales de los publicadores, asegúrate de que el cuerpo de ancianos haya aprobado el uso de la aplicación y designado a los hermanos administradores.',
  },
  {
    id: 'install-android',
    categoryKey: 'install',
    categoryLabel: 'Abrir e Instalar la App',
    audience: 'Usuarios de Teléfonos y Tabletas Android',
    title: 'Instalar Kongre en Android',
    summary:
      'Cómo instalar la aplicación web progresiva (PWA) en cualquier teléfono o tableta Android para abrirla desde tu pantalla de inicio sin usar la tienda.',
    readTime: '2 min',
    menuPath: 'Google Chrome → Instalar aplicación',
    steps: [
      {
        id: 'android-paso-1',
        title: 'Paso 1: Abre el portal en Google Chrome',
        badge: 'Paso 1',
        detail:
          'En tu teléfono o tableta Android, abre el navegador Google Chrome (o Brave / Samsung Internet) y entra en kongre-app.com/#portal.',
      },
      {
        id: 'android-paso-2',
        title: 'Paso 2: Toca «Instalar aplicación» en el menú',
        badge: 'Paso 2',
        detail:
          'Toca el botón de menú de tres puntos (⋮) en la esquina superior derecha del navegador y selecciona la opción "Instalar aplicación" o "Añadir a la pantalla de inicio".',
      },
      {
        id: 'android-paso-3',
        title: 'Paso 3: Abre Kongre desde tu cajón de aplicaciones',
        badge: 'Paso 3',
        detail:
          'Confirma pulsando "Instalar". En unos segundos aparecerá el ícono oficial de Kongre junto a tus demás aplicaciones y se abrirá a pantalla completa sin barras del navegador.',
      },
    ],
    tip: 'Una vez instalada en Android, la aplicación se actualiza sola automáticamente cada vez que se publica una mejora.',
  },
  {
    id: 'install-ios',
    categoryKey: 'install',
    categoryLabel: 'Abrir e Instalar la App',
    audience: 'Usuarios de iPhone y iPad (iOS / iPadOS)',
    title: 'Instalar Kongre en iOS / iPadOS (iPhone y iPad)',
    summary:
      'Pasos exactos para añadir Kongre a la pantalla de inicio en iPhone o iPad usando Safari y disfrutar de pantalla completa y modo sin conexión.',
    readTime: '2 min',
    menuPath: 'Safari → Compartir → Añadir a pantalla de inicio',
    steps: [
      {
        id: 'ios-paso-1',
        title: 'Paso 1: Abre kongre-app.com/#portal en Safari',
        badge: 'Safari',
        detail:
          'En tu iPhone o iPad, abre el navegador oficial Safari y dirígete a kongre-app.com/#portal.',
      },
      {
        id: 'ios-paso-2',
        title: 'Paso 2: Pulsa el botón «Compartir»',
        badge: 'Compartir',
        detail:
          'En la barra inferior de Safari (o superior en iPad), toca el ícono de Compartir (el cuadrado con una flecha apuntando hacia arriba).',
      },
      {
        id: 'ios-paso-3',
        title: 'Paso 3: Selecciona «Añadir a pantalla de inicio»',
        badge: 'Pantalla de Inicio',
        detail:
          'Desliza la lista de opciones hacia arriba hasta encontrar "Añadir a pantalla de inicio" (con el símbolo +) y pulsa "Añadir" en la esquina superior derecha.',
      },
    ],
    note: 'En dispositivos Apple es importante realizar este paso desde Safari para que iOS habilite las notificaciones y el modo de aplicación independiente.',
  },
  {
    id: 'install-desktop',
    categoryKey: 'install',
    categoryLabel: 'Abrir e Instalar la App',
    audience: 'Ancianos, Siervos y Computadora del Salón del Reino',
    title: 'Instalar en Windows, macOS y Linux (Escritorio)',
    summary:
      'Elige entre instalar el ejecutable nativo ultraligero en Rust (Tauri) para la PC del Salón del Reino o instalar la aplicación desde Chrome/Edge.',
    readTime: '3 min',
    menuPath: 'Descargas PC / Navegador de Escritorio',
    steps: [
      {
        id: 'desktop-opcion-1',
        title: 'Opción A: Instalador Nativo de Escritorio en Rust (Recomendado para el Salón)',
        badge: 'App Nativa PC/Mac',
        detail:
          'Ve a la pestaña "Descargas PC / Móvil" de este sitio y descarga el instalador correspondiente a tu sistema: Windows (.exe / .msi), macOS (.dmg para Apple Silicon o Intel) o Linux (.deb / .AppImage). Pesa menos de 15 MB y arranca al instante.',
      },
      {
        id: 'desktop-opcion-2',
        title: 'Opción B: Instalación rápida como PWA desde Chrome o Microsoft Edge',
        badge: 'Desde Navegador',
        detail:
          'Si estás en Windows, Mac o Chromebook, abre kongre-app.com/#portal en Chrome o Edge. Haz clic en el ícono de computadora con una flecha situado en el extremo derecho de la barra de direcciones y pulsa "Instalar".',
      },
    ],
    tip: 'En la computadora del Salón del Reino puedes anclar Kongre a la barra de tareas para abrir rápidamente el «Modo Tablero del Salón» antes de cada reunión.',
  },
  {
    id: 'create-congregation',
    categoryKey: 'onboarding',
    categoryLabel: 'Primeros Pasos y Acceso',
    audience: 'Coordinador o Secretario',
    title: 'Crear y configurar una Congregación',
    summary:
      'Cómo registrar por primera vez tu congregación, obtener el código único KGR y configurar los días de reunión.',
    readTime: '4 min',
    menuPath: '#portal → Registrar Nueva Congregación',
    steps: [
      {
        id: 'registro-paso-1',
        title: 'Paso 1: Completa los datos básicos de la congregación',
        badge: 'Identidad',
        detail:
          'Abre kongre-app.com/#portal, elige "Registrar Nueva Congregación" e ingresa el nombre oficial, número de congregación, circuito y los horarios de la reunión de entre semana y de fin de semana.',
      },
      {
        id: 'registro-paso-2',
        title: 'Paso 2: Define el PIN de Congregación y el PIN Maestro del Coordinador',
        badge: 'Credenciales',
        detail:
          'Establece el PIN general de la congregación y el PIN Maestro de administración. Al finalizar, el sistema generará el identificador único de tu congregación (ejemplo: KGR-4829-1042).',
      },
      {
        id: 'registro-paso-3',
        title: 'Paso 3: Crea los Grupos de Servicio y agrega a los Publicadores',
        badge: 'Directorio',
        detail:
          'En la sección "Grupos de Servicio" y "Publicadores", registra a los hermanos indicando su grupo, nombramiento (Anciano, Siervo Ministerial), precursorado y privilegios aprobados (lectura, demostraciones, acomodador, audio/video, discursos).',
      },
    ],
    warning:
      'Anota y resguarda el ID de la congregación (KGR-XXXX-XXXX) y el PIN Maestro del Coordinador. Se utilizan para derivar la llave de cifrado de la congregación.',
  },
  {
    id: 'join-congregation',
    categoryKey: 'onboarding',
    categoryLabel: 'Primeros Pasos y Acceso',
    audience: 'Ancianos, Siervos y Publicadores',
    title: 'Unirse a una Congregación existente',
    summary:
      'Cómo invitar y conectar a otros ancianos, siervos ministeriales y publicadores mediante códigos de invitación QR, PIN personal o cuenta de Google.',
    readTime: '3 min',
    menuPath: 'Barra Superior → PINes de Acceso / Invitaciones',
    steps: [
      {
        id: 'unirse-codigo-qr',
        title: 'Método 1: Enlace o Código QR de Invitación (Recomendado)',
        badge: '1 Clic',
        detail:
          'El administrador abre "PINes de Acceso" en la barra superior, selecciona al hermano y pulsa "Enviar invitación por WhatsApp" o muestra el código QR en pantalla. Al abrirlo, el hermano entra directamente a su perfil.',
      },
      {
        id: 'unirse-pin',
        title: 'Método 2: Ingreso con ID de Congregación + PIN Personal',
        badge: 'Sin Correo',
        detail:
          'El hermano entra en kongre-app.com/#portal, selecciona la pestaña "ID y PIN" e introduce el ID de su congregación, el PIN de congregación y su PIN personal de 4 a 6 dígitos.',
      },
      {
        id: 'unirse-google',
        title: 'Método 3: Acceso con Cuenta de Google autorizada',
        badge: 'Google OAuth',
        detail:
          'Los ancianos y siervos cuyo correo haya sido vinculado en "Roles y Permisos" pueden iniciar sesión pulsando "Continuar con Google". Si un hermano nuevo intenta entrar con Google, su solicitud quedará pendiente hasta que el Coordinador la apruebe.',
      },
    ],
  },
  {
    id: 'navigation-overview',
    categoryKey: 'onboarding',
    categoryLabel: 'Primeros Pasos y Acceso',
    audience: 'Todos los Usuarios',
    title: 'Navegación por la App y «Mi Vista»',
    summary:
      'Recorrido por la barra superior, el selector de semanas, el buscador global y el panel personal para móviles.',
    readTime: '3 min',
    menuPath: 'Barra de Navegación Principal',
    steps: [
      {
        id: 'nav-mi-vista',
        title: 'Panel «Mi Vista» (Inicio para Publicadores)',
        badge: 'Móvil y PC',
        detail:
          'Muestra de un vistazo tus próximas asignaciones estudiantiles o de fin de semana, turnos de limpieza o acomodador, el cronómetro de predicación y la tarjeta para enviar tu informe mensual.',
      },
      {
        id: 'nav-departamentos',
        title: 'Menú por Departamentos Teocráticos',
        badge: 'Organización',
        detail:
          'Los hermanos nombrados ven pestañas organizadas por área: Reuniones (Vida y Ministerio, Hojas S-89, Discursos), Predicación (Territorios, Carritos), Secretaría (Informes, Tarjetas S-21, Asistencia S-88) y Salón del Reino.',
      },
      {
        id: 'nav-buscador-y-temas',
        title: 'Buscador Global (Ctrl+K) y Modos Visuales',
        badge: 'Productividad',
        detail:
          'Usa la lupa superior para buscar cualquier publicador, bosquejo o territorio al instante. También puedes alternar entre Modo Claro, Modo Oscuro y Modo Cabina de Audio/Video.',
      },
    ],
  },
  {
    id: 'roles-permissions',
    categoryKey: 'onboarding',
    categoryLabel: 'Primeros Pasos y Acceso',
    audience: 'Cuerpo de Ancianos',
    title: 'Roles y Permisos Teocráticos (RBAC)',
    summary:
      'Consulta qué secciones puede ver y editar cada hermano según sus responsabilidades asignadas en la congregación.',
    readTime: '4 min',
    menuPath: 'Menú → Roles y Permisos (#roles)',
    steps: [
      {
        id: 'rbac-separacion',
        title: 'Visibilidad adaptada a cada nombramiento',
        badge: 'Confidencialidad',
        detail:
          'Cada usuario ve únicamente las herramientas de su asignación. Un hermano puede tener múltiples roles simultáneos (por ejemplo, Anciano + Superintendente VMC + Superintendente de Grupo).',
      },
      {
        id: 'rbac-grupos-s21',
        title: 'Protección de Tarjetas S-21 por Grupo de Servicio',
        badge: 'Privacidad S-21',
        detail:
          'El Coordinador, el Secretario y el Superintendente de Servicio tienen vista global de las tarjetas S-21. Los Superintendentes de Grupo solo acceden a las tarjetas S-21 de los miembros de su propio grupo.',
      },
    ],
    tip: 'Consulta la Matriz Oficial de Roles debajo de estos pasos para ver el detalle completo de permisos.',
  },
  {
    id: 'ministry-timer-studies',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Publicadores y Precursores',
    title: 'Ministerio: Cronómetro, Estudios Bíblicos y Solicitud de Precursor',
    summary:
      'Cómo registrar tus horas de servicio con el cronómetro integrado, anotar revisitas y enviar una solicitud de precursor auxiliar.',
    readTime: '4 min',
    menuPath: 'Mi Vista → Ministerio Personal',
    steps: [
      {
        id: 'min-cronometro',
        title: 'Usar el Cronómetro de Predicación',
        badge: 'Cronómetro',
        detail:
          'Pulsa "Iniciar" al comenzar tu predicación. Puedes pausarlo o cerrar la pantalla; el temporizador seguirá calculando el tiempo con exactitud y lo sumará a tu registro mensual.',
      },
      {
        id: 'min-revisitas',
        title: 'Gestionar Revisitas y Cursos Bíblicos',
        badge: 'Estudios',
        detail:
          'Agrega tus estudiantes bíblicos indicando la publicación de estudio y la próxima fecha de visita. A fin de mes, el total de cursos activos se sugiere automáticamente en tu informe.',
      },
      {
        id: 'min-precursor-auxiliar',
        title: 'Enviar Solicitud de Precursor Auxiliar (15 o 30 horas)',
        badge: 'Precursorado',
        detail:
          'Abre la tarjeta "Precursorado Auxiliar", elige el mes (o marca "De continuo"), selecciona el requisito de 15 o 30 horas y envíala para revisión del Comité de Servicio.',
      },
    ],
  },
  {
    id: 'monthly-delegated-reports',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Publicadores, Cabezas de Familia y Sup. de Grupo',
    title: 'Informes Mensuales (S-4) e Informes Delegados de Familia',
    summary:
      'Cómo entregar tu informe de servicio mensual y cómo enviar el informe en nombre de familiares o hermanos mayores.',
    readTime: '4 min',
    menuPath: 'Mi Vista → Informe Mensual / Informes de Servicio',
    steps: [
      {
        id: 'inf-personal',
        title: 'Paso 1: Enviar tu informe mensual personal',
        badge: 'Publicadores',
        detail:
          'Al concluir el mes, marca la casilla "Participé en alguna faceta del ministerio", anota tus estudios bíblicos (y tus horas si eres precursor) y pulsa "Enviar Informe".',
      },
      {
        id: 'inf-delegado',
        title: 'Paso 2: Enviar Informes Delegados (Familiares o Adultos Mayores)',
        badge: 'Delegación',
        detail:
          'Si eres cabeza de familia o tienes asignado apoyar a un hermano mayor sin smartphone, selecciona su nombre en la sección "Informes de mi familia / Delegados" y envía su actividad mensual desde tu propio dispositivo.',
      },
      {
        id: 'inf-grupo',
        title: 'Paso 3: Revisión por el Superintendente de Grupo',
        badge: 'Grupos',
        detail:
          'El Superintendente de Grupo verifica en la pestaña "Informes de Servicio" quiénes ya informaron entre los días 1 y 6 del mes y puede registrar manualmente el informe de cualquier hermano que se lo entregue por escrito o teléfono.',
      },
    ],
  },
  {
    id: 'meetings-jwor-s89',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Superintendente de Vida y Ministerio y Presidente',
    title: 'Reunión Entre Semana: Importación JW.ORG, S-140 y Hojas S-89',
    summary:
      'Cómo importar automáticamente la Guía de Actividades, asignar estudiantes sin conflictos y enviar hojas S-89 por WhatsApp.',
    readTime: '5 min',
    menuPath: 'Menú → Vida y Ministerio (CLM) / Hojas S-89',
    steps: [
      {
        id: 'vmc-importar',
        title: 'Paso 1: Importar el programa semanal desde el Catálogo o archivo EPUB',
        badge: 'Automatización',
        detail:
          'Haz clic en "Importar Guía de Actividades" o "Sincronizar Semana". Kongre carga canciones, capítulos de lectura bíblica, Perlas Escondidas, partes estudiantiles y temas de Nuestra Vida Cristiana con sus tiempos exactos.',
      },
      {
        id: 'vmc-asignar',
        title: 'Paso 2: Asignar partes con el Motor de Equidad e Historial S-38',
        badge: 'Sin Choques',
        detail:
          'Al hacer clic en cada parte, el selector muestra a los hermanos calificados ordenados según el tiempo transcurrido desde su última asignación y avisa si el hermano ya tiene otra tarea o turno de acomodador esa misma noche.',
      },
      {
        id: 'vmc-s89',
        title: 'Paso 3: Imprimir Hojas S-89 (4 por página) o enviar por WhatsApp',
        badge: 'Hojas S-89',
        detail:
          'En la pestaña "Hojas S-89", descarga el PDF con el formato oficial listo para imprimir o envía cada asignación por WhatsApp con un enlace para que el estudiante confirme su participación en 1 clic.',
      },
      {
        id: 'vmc-s140',
        title: 'Paso 4: Exportar el Programa Mensual S-140 para la Cartelera',
        badge: 'Programa S-140',
        detail:
          'Genera el PDF limpio del programa S-140 para fijarlo en el tablero de anuncios del Salón del Reino o publicarlo en el tablero digital.',
      },
    ],
  },
  {
    id: 'weekend-public-talks',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Coordinador y Siervo de Discursos',
    title: 'Reunión de Fin de Semana: Discursos Públicos y Hospitalidad',
    summary:
      'Coordina los bosquejos de discursos públicos, oradores locales y visitantes, presidente, lector de La Atalaya y hospitalidad.',
    readTime: '4 min',
    menuPath: 'Menú → Discursos Públicos / Hospitalidad',
    steps: [
      {
        id: 'disc-bosquejos',
        title: 'Selección de bosquejos con historial de fechas',
        badge: '194 Bosquejos',
        detail:
          'Elige el bosquejo del discurso público entre el catálogo oficial. Kongre muestra cuándo se presentó por última vez cada tema en tu congregación para mantener variedad.',
      },
      {
        id: 'disc-oradores',
        title: 'Control de oradores visitantes y conferenciantes salientes',
        badge: 'Intercambio',
        detail:
          'Registra los discursantes que visitan tu congregación y lleva el calendario de los ancianos y siervos locales que salen a dar discursos a otras congregaciones.',
      },
      {
        id: 'disc-hospitalidad',
        title: 'Turnos de Hospitalidad por Grupo de Servicio',
        badge: 'Hospitalidad',
        detail:
          'Asigna la familia o grupo encargado de brindar hospitalidad al orador visitante y envía los detalles de contacto y recordatorio por WhatsApp.',
      },
    ],
  },
  {
    id: 'attendance-counter-s88',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Acomodadores y Secretario',
    title: 'Contador de Asistencia a las Reuniones y Registro S-88',
    summary:
      'Usa el contador táctil integrado durante la reunión y obtén automáticamente los totales y promedios mensuales del formulario S-88.',
    readTime: '3 min',
    menuPath: 'Menú → Asistencia a Reuniones (S-88)',
    steps: [
      {
        id: 'asist-contador',
        title: 'Paso 1: Contar asistentes con el Contador Táctil en Vivo',
        badge: 'En Vivo',
        detail:
          'Durante la reunión, el acomodador abre "Contador en Vivo". Puede incrementar o disminuir con botones grandes la asistencia presencial en el Salón y los conectados por videoconferencia (Zoom).',
      },
      {
        id: 'asist-promedios',
        title: 'Paso 2: Cálculo automático del Registro S-88',
        badge: 'Promedios S-88',
        detail:
          'Kongre guarda la asistencia de cada semana, calcula el promedio mensual de las reuniones de entre semana y fin de semana, y genera las tablas comparativas del año de servicio.',
      },
    ],
  },
  {
    id: 'persons-groups-s21',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Secretario, Sup. de Servicio y Sup. de Grupo',
    title: 'Personas, Grupos de Servicio, Tarjetas S-21 e Informe S-1',
    summary:
      'Administra el directorio de publicadores, organiza los grupos de predicación, genera las tarjetas S-21 y prepara el informe mensual a la sucursal.',
    readTime: '5 min',
    menuPath: 'Menú → Publicadores / Tarjetas S-21 / Informe S-1',
    steps: [
      {
        id: 'pers-directorio',
        title: 'Directorio de Publicadores y Familias',
        badge: 'Personas',
        detail:
          'Mantén actualizados los datos teocráticos de cada publicador (fecha de bautismo, grupo de servicio, privilegios, contacto de emergencia y períodos de ausencia).',
      },
      {
        id: 'pers-s21',
        title: 'Tarjetas de Registro del Publicador (S-21) y Año de Servicio',
        badge: 'Tarjetas S-21',
        detail:
          'Consulta o exporta en PDF las tarjetas S-21 individuales o por grupo de servicio (de septiembre a agosto), con alertas automáticas de publicadores irregulares o inactivos.',
      },
      {
        id: 'pers-s1',
        title: 'Resumen Mensual S-1 para jw.org',
        badge: 'Sucursal S-1',
        detail:
          'Una vez cerrados los informes del mes, la vista "Informe S-1" presenta los casilleros exactos de publicadores, precursores auxiliares y precursores regulares listos para enviarse a la sucursal.',
      },
    ],
  },
  {
    id: 'territories-carts-hall',
    categoryKey: 'how-to',
    categoryLabel: 'Cómo Usar Kongre',
    audience: 'Siervo de Territorios y Encargados del Salón',
    title: 'Territorios GPS (S-13), Carritos y Tablero Digital del Salón',
    summary:
      'Gestiona los mapas de territorios con códigos QR, turnos de predicación pública y la pantalla de anuncios del Salón del Reino.',
    readTime: '4 min',
    menuPath: 'Menú → Territorios / Carritos / Tablero del Salón',
    steps: [
      {
        id: 'terr-gps',
        title: 'Mapas GPS Interactivos y Tarjeta Digital con QR',
        badge: 'Territorios S-13',
        detail:
          'Traza los polígonos de tus territorios, marca direcciones "No visitar" y comparte el código QR con el conductor. Todos los movimientos quedan asentados en el registro oficial S-13.',
      },
      {
        id: 'terr-carritos',
        title: 'Turnos de Predicación Pública (Exhibidores / Carritos)',
        badge: 'Carritos PPE',
        detail:
          'Configura los puntos de exhibidores móviles y asigna a los hermanos por horario, enviando recordatorios automáticos.',
      },
      {
        id: 'terr-tablero',
        title: 'Modo Tablero Digital (Quiosco TV para el Salón del Reino)',
        badge: 'Pantalla TV',
        detail:
          'Proyecta en el monitor del Salón del Reino el programa semanal S-140, asignaciones de limpieza, acomodadores, discurso público y anuncios en diseño de alta legibilidad.',
      },
    ],
  },
  {
    id: 'sync-offline-backups',
    categoryKey: 'security-faq',
    categoryLabel: 'Seguridad y Solución de Problemas',
    audience: 'Coordinador y Secretario',
    title: 'Sincronización, Modo Offline y Copias de Seguridad (.json)',
    summary:
      'Cómo funciona la cola de sincronización cuando no hay internet y cómo guardar respaldos locales de la congregación.',
    readTime: '3 min',
    menuPath: 'Menú → Ajustes → Respaldos y Sincronización',
    steps: [
      {
        id: 'sync-cola',
        title: 'Sincronización automática y Cola Offline',
        badge: 'Offline-First',
        detail:
          'Si realizas cambios en el Salón del Reino sin internet, Kongre los almacena en la cola local y los sincroniza cifrados tan pronto como el dispositivo detecta conexión.',
      },
      {
        id: 'sync-backup',
        title: 'Exportar e Importar Copias de Seguridad (.json)',
        badge: 'Respaldo Local',
        detail:
          'En "Ajustes", pulsa "Descargar Copia de Seguridad" para guardar un archivo .json completo en tu computadora o memoria USB, o para restaurar la información en un equipo nuevo.',
      },
    ],
  },
  {
    id: 'security-2fa-troubleshooting',
    categoryKey: 'security-faq',
    categoryLabel: 'Seguridad y Solución de Problemas',
    audience: 'Todos los Usuarios',
    title: 'Autenticación 2FA, Bloqueo por PIN y Solución de Problemas',
    summary:
      'Cómo proteger tu cuenta con verificación en dos pasos, bloquear la pantalla por inactividad y resolver dudas frecuentes.',
    readTime: '4 min',
    menuPath: 'Mi Perfil → Seguridad y 2FA',
    steps: [
      {
        id: 'sec-2fa',
        title: 'Activar Autenticación en Dos Pasos (2FA TOTP)',
        badge: '2FA',
        detail:
          'En "Mi Perfil", vincula Google Authenticator o Microsoft Authenticator escaneando el código QR y guarda tus 8 códigos de recuperación.',
      },
      {
        id: 'sec-pin-lock',
        title: 'Auto-bloqueo por inactividad y Revocación de dispositivos',
        badge: 'Protección',
        detail:
          'Activa el bloqueo automático por PIN si compartes la computadora. Si un hermano pierde su teléfono, el Coordinador puede regenerar su PIN en "PINes de Acceso" para cerrar la sesión remota de inmediato.',
      },
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: '¿Es Kongre una aplicación gratuita para toda la congregación?',
    answer:
      'Sí. Kongre es 100% gratuita para ancianos, siervos ministeriales, precursores y publicadores. No incluye anuncios ni suscripciones comerciales.',
  },
  {
    question: '¿Quién debe registrar inicialmente a la congregación?',
    answer:
      'Siguiendo el orden teocrático, la congregación debe ser registrada por un anciano autorizado (como el Coordinador del Cuerpo de Ancianos o el Secretario) tras el acuerdo del cuerpo de ancianos.',
  },
  {
    question: '¿Funciona si en el Salón del Reino no tenemos conexión a internet?',
    answer:
      'Sí. Kongre tiene arquitectura Local-First. Todos los programas, tarjetas y herramientas funcionan sin conexión. Los cambios realizados sin internet se sincronizan automáticamente al recuperar la señal.',
  },
  {
    question: '¿Pueden los publicadores usar Kongre sin tener correo electrónico ni cuenta de Google?',
    answer:
      'Por supuesto. Los publicadores pueden entrar con su enlace/código QR de invitación o con su PIN personal de 4 a 6 dígitos directamente desde el navegador de su celular.',
  },
  {
    question: '¿Cómo se protegen los datos personales de los hermanos?',
    answer:
      'Los datos se almacenan localmente en tu dispositivo y, cuando se sincronizan entre los miembros de la congregación, se cifran de extremo a extremo con AES-256-GCM (arquitectura de conocimiento cero) cumpliendo con los estándares internacionales de privacidad (RGPD).',
  },
  {
    question: '¿Cómo se realizan copias de seguridad locales de la congregación?',
    answer:
      'Desde la pestaña Ajustes, el Coordinador o el Secretario pueden descargar en cualquier momento un archivo de respaldo cifrado (.json) para resguardarlo en una memoria USB o restaurarlo en otra computadora.',
  },
];

export const KongreOfficialWebsite: React.FC<KongreOfficialWebsiteProps> = ({
  onGoToPortal,
  onStartDemoMode,
  onOpenVersionModal,
  isSignedInOrRegistered = false,
  onEnterAppDirectly,
}) => {
  const { themeMode: theme, toggleTheme: handleToggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<WebsiteSection>('about');
  const [selectedRolePersona, setSelectedRolePersona] = useState<RolePersonaId>('elders');
  const [selectedDocId, setSelectedDocId] = useState<DocArticleId>('app-overview');
  const [expandedCategories, setExpandedCategories] = useState<Record<GuideSectionCategory, boolean>>({
    welcome: true,
    install: true,
    onboarding: true,
    'how-to': true,
    'security-faq': true,
  });
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  const activePersona = useMemo(
    () => ROLE_PERSONAS.find((p) => p.id === selectedRolePersona) || ROLE_PERSONAS[0],
    [selectedRolePersona]
  );

  const filteredDocs = useMemo(() => {
    const q = docSearchQuery.trim().toLowerCase();
    if (!q) return DOC_ARTICLES;
    return DOC_ARTICLES.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.categoryLabel.toLowerCase().includes(q) ||
        doc.audience.toLowerCase().includes(q) ||
        doc.steps.some(
          (s) => s.title.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
        )
    );
  }, [docSearchQuery]);

  const activeDoc = useMemo(() => {
    return (
      filteredDocs.find((d) => d.id === selectedDocId) ||
      filteredDocs[0] ||
      DOC_ARTICLES[0]
    );
  }, [filteredDocs, selectedDocId]);

  const currentDocIndex = useMemo(
    () => DOC_ARTICLES.findIndex((d) => d.id === activeDoc.id),
    [activeDoc.id]
  );

  const prevDoc = currentDocIndex > 0 ? DOC_ARTICLES[currentDocIndex - 1] : null;
  const nextDoc =
    currentDocIndex >= 0 && currentDocIndex < DOC_ARTICLES.length - 1
      ? DOC_ARTICLES[currentDocIndex + 1]
      : null;

  const handleOpenGuideArticle = (docId: DocArticleId) => {
    setSelectedDocId(docId);
    setActiveSection('guide');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCategoryAccordion = (catId: GuideSectionCategory) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const allCategoriesExpanded = useMemo(() => {
    return Object.values(expandedCategories).every(Boolean);
  }, [expandedCategories]);

  const handleToggleAllCategories = () => {
    const nextState = !allCategoriesExpanded;
    setExpandedCategories({
      welcome: nextState,
      install: nextState,
      onboarding: nextState,
      'how-to': nextState,
      'security-faq': nextState,
    });
  };


  return (
    <div className="min-h-dvh w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* =====================================================================
          TOP NAVIGATION BAR (Inspired by about.organized-app.com & guide.organized-app.com)
          ===================================================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-3">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setActiveSection('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Logo variant="isotipo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    Kongre
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/90 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80">
                    {activeSection === 'guide' ? 'Guía de Usuario' : `v${CURRENT_APP_VERSION}`}
                  </span>
                </div>
                <span className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                  {activeSection === 'guide'
                    ? 'Documentación Oficial Paso a Paso'
                    : 'Todo en uno para Congregaciones'}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Switch between About (about.organized-app.com style) & Guide (guide.organized-app.com style) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            {[
              { id: 'about' as WebsiteSection, label: 'Acerca de Kongre', icon: Compass },
              { id: 'guide' as WebsiteSection, label: 'Guía de Usuario (Docs)', icon: BookOpen },
              { id: 'downloads' as WebsiteSection, label: 'Instalar en PC / Móvil', icon: Download },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Theme, Demo & "Usar Kongre" (Open App Portal) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              type="button"
              onClick={onStartDemoMode}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/70 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/70 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Demo</span>
            </button>

            {isSignedInOrRegistered && onEnterAppDirectly ? (
              <button
                type="button"
                onClick={onEnterAppDirectly}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Volver a mi Congregación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onGoToPortal()}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Usar Kongre</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Secondary Tab Bar */}
        <div className="md:hidden border-t border-slate-200/70 dark:border-slate-800/70 px-3 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-50/80 dark:bg-slate-900/80">
          {[
            { id: 'about' as WebsiteSection, label: 'Acerca de Kongre', icon: Compass },
            { id: 'guide' as WebsiteSection, label: 'Guía de Usuario', icon: BookOpen },
            { id: 'downloads' as WebsiteSection, label: 'Instalar App', icon: Download },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT CONTAINER
          ===================================================================== */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
        {/* ===================================================================
            VIEW 1: ABOUT KONGRE (Modeled after https://about.organized-app.com/)
            =================================================================== */}
        {activeSection === 'about' && (
          <div className="space-y-12 w-full">
            {/* 1. HERO SECTION WITH MOTION ENTRANCE & AMBIENT GLOW */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full rounded-3xl bg-linear-to-br from-indigo-50/90 via-white to-violet-50/70 dark:from-slate-900 dark:via-indigo-950/50 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/70 p-6 sm:p-10 lg:p-12 shadow-lg shadow-indigo-500/5 overflow-hidden"
            >
              {/* Floating ambient glow orbs */}
              <motion.div
                animate={{
                  x: [0, 24, 0],
                  y: [0, -20, 0],
                  scale: [1, 1.08, 1],
                }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/15 dark:bg-indigo-600/20 blur-3xl pointer-events-none"
              />
              <motion.div
                animate={{
                  x: [0, -22, 0],
                  y: [0, 20, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/15 dark:bg-violet-600/20 blur-3xl pointer-events-none"
              />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                <div className="lg:col-span-7 xl:col-span-8 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: -14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/90 dark:bg-indigo-950/90 border border-indigo-200 dark:border-indigo-800 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Aplicación Todo en Uno para Congregaciones</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]"
                  >
                    Simplifica y organiza toda la vida de tu congregación en un solo lugar.
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl"
                  >
                    <strong>Kongre</strong> une a ancianos, siervos ministeriales, precursores y publicadores en una plataforma moderna, gratuita y 100% funcional sin internet. Automatiza la programación de reuniones, el seguimiento del ministerio, la asistencia, las tarjetas S-21 y los mapas de territorios bajo cifrado de extremo a extremo.
                  </motion.p>

                  {/* Primary Action Buttons with Motion Physics */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-wrap items-center gap-3 pt-2"
                  >
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => onGoToPortal()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 cursor-pointer group"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Usar Kongre en el Navegador</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setActiveSection('guide')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold text-sm shadow-2xs cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Explorar Guía de Usuario</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={onStartDemoMode}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-violet-100/80 dark:bg-violet-950/60 hover:bg-violet-200/70 dark:hover:bg-violet-900/70 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800 font-bold text-sm cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>Probar Demo Interactiva</span>
                    </motion.button>
                  </motion.div>

                  {/* Key Trust Highlights */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="pt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-t border-indigo-100/90 dark:border-slate-800"
                  >
                    <span className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Enfoque «Elder-First» y Cifrado E2EE
                    </span>
                    <span className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <CloudOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Local-First (Funciona sin Internet)
                    </span>
                    <span className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Smartphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      PWA Móvil + Escritorio Nativo
                    </span>
                  </motion.div>
                </div>

                {/* Right Column: Quick Portal Card with Motion & Interactive Animated Logo */}
                <motion.div
                  initial={{ opacity: 0, x: 28, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-5 xl:col-span-4"
                >
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4 hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                      <div>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Centro de Acceso Rápido
                        </span>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Comienza en menos de 1 minuto
                        </h2>
                      </div>
                      <div className="p-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xs hover:scale-105 active:scale-95 transition-transform" title="Toca para animar el logo de Kongre">
                        <AnimatedLogo height={28} iconOnly />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <motion.button
                        type="button"
                        whileHover={{ x: 5, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => onGoToPortal('home')}
                        className="w-full p-3.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                              Unirse a mi Congregación
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Entrar con Código de Invitación, PIN o Google
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ x: 5, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => onGoToPortal('register')}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                              Configurar Nueva Congregación
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Enfoque «Elder-First» para el Cuerpo de Ancianos
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ x: 5, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => handleOpenGuideArticle('install-android')}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                              Cómo instalar en Android, iOS y PC
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Guía paso a paso para añadir a la pantalla de inicio
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>

            {/* 2. WHO IS IT FOR? INTERACTIVE ROLE SWITCHER WITH MOTION TABS & ANIMATED CONTENT */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Herramientas para Cada Hermano
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    ¿Para quién está diseñada Kongre?
                  </h2>
                </div>

                {/* Animated Role Tabs with Sliding Pill */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-200/70 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-300/60 dark:border-slate-800">
                  {ROLE_PERSONAS.map((role) => {
                    const isSelected = role.id === selectedRolePersona;
                    return (
                      <motion.button
                        key={role.id}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedRolePersona(role.id)}
                        className={`relative px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-colors cursor-pointer shrink-0 z-10 ${
                          isSelected
                            ? 'text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activeRoleTab"
                            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs -z-10"
                          />
                        )}
                        <span>{role.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Active Persona Showcase Card with Motion AnimatePresence & Staggered Features */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRolePersona}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 lg:p-10 shadow-sm"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 space-y-4">
                      <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {activePersona.badge}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                        {activePersona.headline}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {activePersona.description}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleOpenGuideArticle(activePersona.guideTarget)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors cursor-pointer group"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Ver guía para este rol</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onGoToPortal()}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer group"
                        >
                          <span>Ingresar ahora</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activePersona.features.map((feat, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          whileHover={{ y: -3, scale: 1.015 }}
                          className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: idx * 0.08 + 0.15, type: 'spring', stiffness: 500, damping: 20 }}
                              className="w-6 h-6 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </motion.div>
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                              {feat.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                            {feat.detail}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.section>

            {/* 3. CORE FEATURES BENTO GRID WITH STAGGERED MOTION HOVER */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55 }}
              className="space-y-6"
            >
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Módulos de la Aplicación
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Funciones diseñadas para ahorrar horas de trabajo semanal
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: '/assets/icons/svg-indigo/clm_vmc.svg',
                    kicker: 'REUNIONES Y AUTOMATIZACIÓN',
                    title: 'Programación Semanal y Hojas S-89',
                    desc: 'Importa los datos de las reuniones desde jw.org o archivos EPUB sin copiar y pegar. Asigna partes estudiantiles con historial S-38 y envía hojas S-89 por WhatsApp.',
                    docId: 'meetings-jwor-s89' as DocArticleId,
                  },
                  {
                    icon: '/assets/icons/svg-indigo/informes_servicio.svg',
                    kicker: 'MINISTERIO Y PRECURSORES',
                    title: 'Cronómetro, Informes y Delegados',
                    desc: 'Cronómetro de predicación integrado, registro de estudios bíblicos, solicitud de precursor auxiliar y entrega de informes mensuales (incluyendo informes delegados de familia).',
                    docId: 'ministry-timer-studies' as DocArticleId,
                  },
                  {
                    icon: '/assets/icons/svg-indigo/secretaria.svg',
                    kicker: 'SECRETARÍA Y REGISTROS',
                    title: 'Grupos de Servicio, Tarjetas S-21 y S-1',
                    desc: 'Organiza a los publicadores por grupo de servicio, genera automáticamente las tarjetas S-21 del año de servicio y consolida el informe mensual para la sucursal.',
                    docId: 'persons-groups-s21' as DocArticleId,
                  },
                  {
                    icon: '/assets/icons/svg-indigo/supervision.svg',
                    kicker: 'CONTADOR DE ASISTENCIA S-88',
                    title: 'Contador de Asistencia en Tiempo Real',
                    desc: 'Herramienta táctil para acomodadores que suma los asistentes en el auditorio y por Zoom, calculando los promedios mensuales y anuales del formulario S-88.',
                    docId: 'attendance-counter-s88' as DocArticleId,
                  },
                  {
                    icon: '/assets/icons/svg-indigo/predicacion.svg',
                    kicker: 'TERRITORIOS GPS Y CARRITOS',
                    title: 'Mapas Interactivos (S-13) y Exhibidores',
                    desc: 'Traza polígonos de territorios, comparte tarjetas digitales con código QR para trabajar desde el móvil y organiza los turnos de predicación pública.',
                    docId: 'territories-carts-hall' as DocArticleId,
                  },
                  {
                    icon: '/assets/icons/svg-indigo/discursos.svg',
                    kicker: 'FIN DE SEMANA Y SALÓN',
                    title: 'Discursos Públicos, Hospitalidad y Tablero TV',
                    desc: 'Coordina oradores locales y visitantes, turnos de hospitalidad, limpieza, acomodadores y proyecta el Tablero Digital en el monitor del Salón del Reino.',
                    docId: 'weekend-public-talks' as DocArticleId,
                  },
                ].map((card, idx) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: (idx % 3) * 0.09, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.22 } }}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-colors shadow-xs flex flex-col justify-between gap-4 group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: 4 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                          className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0"
                        >
                          <img src={card.icon} alt={card.title} className="w-6 h-6 object-contain" />
                        </motion.div>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {card.kicker}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenGuideArticle(card.docId)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/70 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold inline-flex items-center justify-between transition-colors cursor-pointer group/btn"
                    >
                      <span>Cómo usar esta función</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* 4. SECURITY & PRIVACY BY DESIGN SECTION WITH MOTION GLOW */}
            <motion.section
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(16, 185, 129, 0.35)',
                        '0 0 0 8px rgba(16, 185, 129, 0)',
                        '0 0 0 0 rgba(16, 185, 129, 0)',
                      ],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                  <span>Seguridad, Privacidad y Confidencialidad</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Tus datos pertenecen únicamente a tu congregación
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sabemos lo importante que es proteger la información personal de los hermanos. Por eso Kongre ha sido construida desde cero con estándares de seguridad criptográfica y almacenamiento local prioritario.
                </p>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {[
                  {
                    icon: Lock,
                    color: 'text-emerald-400',
                    title: 'Cifrado de Extremo a Extremo',
                    desc: 'Los registros se cifran en tu dispositivo con AES-256-GCM antes de sincronizarse. Nadie externo puede leerlos.',
                  },
                  {
                    icon: CloudOff,
                    color: 'text-indigo-400',
                    title: 'Arquitectura Local-First',
                    desc: 'La base de datos vive directamente en tu dispositivo para que trabajes con rapidez y sin depender de internet.',
                  },
                  {
                    icon: Users,
                    color: 'text-amber-400',
                    title: 'Enfoque «Elder-First»',
                    desc: 'El acceso requiere un código de invitación personal y roles asignados por los ancianos de la congregación.',
                  },
                  {
                    icon: Shield,
                    color: 'text-violet-400',
                    title: 'Protección 2FA y PIN Local',
                    desc: 'Soporta verificación en dos pasos (Authenticator), auto-bloqueo por inactividad y revocación remota.',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      whileHover={{ y: -4, scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 transition-colors cursor-pointer"
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* 5. USE ON ANY DEVICE BANNER */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              <DesktopCompatibilityBanner
                variant="hero-card"
                onOpenAllDownloads={() => setDesktopModalOpen(true)}
              />
            </motion.section>

            {/* 6. FREQUENTLY ASKED QUESTIONS (FAQ) WITH SMOOTH MOTION ACCORDION */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Respuestas Rápidas
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Preguntas Frecuentes (FAQ)
                  </h2>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ x: 3 }}
                  onClick={() => setActiveSection('guide')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Guía Completa de Usuario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {FAQ_ITEMS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                      <motion.button
                        type="button"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 text-left py-1 cursor-pointer group"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {faq.question}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.24, ease: 'easeInOut' }}
                          className="shrink-0"
                        >
                          <ChevronDown
                            className={`w-4 h-4 ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                          />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: USER GUIDE (Modeled after https://guide.organized-app.com/ - Docusaurus 3-Column Layout)
            =================================================================== */}
        {activeSection === 'guide' && (
          <div className="space-y-6">
            {/* Top Search & Mobile Navigation Bar for Guide with Motion */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl bg-linear-to-r from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25"
                >
                  <BookOpen className="w-5 h-5" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Guía Oficial de Usuario de Kongre
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-indigo-100/90 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                      {DOC_ARTICLES.length} artículos
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Documentación oficial paso a paso sobre instalación, roles teocráticos y uso diario.
                  </p>
                </div>
              </div>

              {/* Search Input + Clear button + Mobile Quick Jump */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder="Buscar en la guía (ej. iOS, S-89, PIN, roles)..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
                  />
                  {docSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDocSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mobile Quick Jump Dropdown */}
                <div className="lg:hidden">
                  <select
                    aria-label="Seleccionar artículo de la guía"
                    value={activeDoc.id}
                    onChange={(e) => {
                      setSelectedDocId(e.target.value as DocArticleId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-950 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {GUIDE_SIDEBAR_SECTIONS.map((sec) => (
                      <optgroup key={sec.id} label={sec.title}>
                        {filteredDocs
                          .filter((d) => d.categoryKey === sec.id)
                          .map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* 3-Column Balanced Docusaurus Layout (Left Sidebar + Center Article + Right TOC) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              {/* LEFT SIDEBAR: Redesigned and Animated Navigation Menu */}
              <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-3.5 shadow-xs">
                {/* Sidebar Header & Controls */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Contenido
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {filteredDocs.length}
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleAllCategories}
                    className="px-2 py-1 rounded-lg text-[10.5px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition cursor-pointer"
                    title={allCategoriesExpanded ? 'Colapsar todas las carpetas' : 'Expandir todas las carpetas'}
                  >
                    <ChevronsUpDown className="w-3 h-3" />
                    <span>{allCategoriesExpanded ? 'Colapsar' : 'Expandir'}</span>
                  </motion.button>
                </div>

                {/* Search Filter feedback bar if searching */}
                {docSearchQuery && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between text-[11px] text-indigo-950 dark:text-indigo-200">
                    <span className="truncate">
                      Filtro: <strong>"{docSearchQuery}"</strong> ({filteredDocs.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocSearchQuery('')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-1.5 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                )}

                {/* Sidebar Categories List */}
                <div className="space-y-1.5">
                  {GUIDE_SIDEBAR_SECTIONS.map((section) => {
                    const sectionArticles = filteredDocs.filter((d) => d.categoryKey === section.id);
                    if (sectionArticles.length === 0) return null;
                    const isExpanded = expandedCategories[section.id];
                    const SectionIcon = section.icon;
                    const hasActiveDoc = sectionArticles.some((d) => d.id === activeDoc.id);

                    return (
                      <div key={section.id} className="space-y-1">
                        <motion.button
                          type="button"
                          whileHover={{ x: 2 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => toggleCategoryAccordion(section.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer group ${
                            hasActiveDoc
                              ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                hasActiveDoc
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                              }`}
                            >
                              <SectionIcon className="w-3 h-3" />
                            </div>
                            <span className="truncate text-xs font-bold">{section.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {sectionArticles.length}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 0 : -90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                            </motion.div>
                          </div>
                        </motion.button>

                        {/* Animated Collapsible Articles Container */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden space-y-0.5 pl-2.5 border-l-2 border-indigo-100 dark:border-slate-800 ml-4 py-0.5"
                            >
                              {sectionArticles.map((doc) => {
                                const isSelected = activeDoc.id === doc.id;
                                return (
                                  <motion.button
                                    key={doc.id}
                                    type="button"
                                    whileHover={{ x: 3 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => {
                                      setSelectedDocId(doc.id);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white font-extrabold shadow-xs shadow-indigo-600/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          isSelected ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'
                                        }`}
                                      />
                                      <span className="truncate leading-tight">{doc.title}</span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono shrink-0 ${
                                        isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                                      }`}
                                    >
                                      {doc.readTime}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </aside>

              {/* CENTER ARTICLE CONTENT WITH ANIMATEPRESENCE */}
              <div className="lg:col-span-6 xl:col-span-6">
                <AnimatePresence mode="wait">
                  <motion.article
                    key={activeDoc.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-9 shadow-xs space-y-6"
                  >
                    {/* Breadcrumbs (Docusaurus style: 🏠 > Category > Article) */}
                    <nav
                      aria-label="Breadcrumb"
                      className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDocId('app-overview')}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                        title="Inicio de la Guía"
                      >
                        <Home className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {activeDoc.categoryLabel}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[220px] sm:max-w-none">
                        {activeDoc.title}
                      </span>
                    </nav>

                    {/* Article Title & Metadata */}
                    <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {activeDoc.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {activeDoc.summary}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Para: {activeDoc.audience}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{activeDoc.menuPath}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{activeDoc.readTime}</span>
                        </span>
                      </div>
                    </div>

                    {/* Docusaurus Admonition: Note */}
                    {activeDoc.note && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-500 text-xs text-blue-950 dark:text-blue-200 space-y-1 shadow-2xs"
                      >
                        <div className="font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                          <Info className="w-4 h-4" />
                          <span>Nota</span>
                        </div>
                        <p className="leading-relaxed">{activeDoc.note}</p>
                      </motion.div>
                    )}

                    {/* Step-by-Step Sections with Motion Hover Lift */}
                    <div className="space-y-4">
                      {activeDoc.steps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          id={step.id}
                          whileHover={{ y: -2, scale: 1.006 }}
                          transition={{ duration: 0.2 }}
                          className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2 scroll-mt-24 transition-shadow hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                                {index + 1}
                              </span>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {step.title}
                              </h3>
                            </div>
                            {step.badge && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100/80 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                                {step.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                            {step.detail}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Embedded RBAC Matrix Table when on roles-permissions */}
                    {activeDoc.id === 'roles-permissions' && (
                      <div className="space-y-2 pt-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Tabla de Permisos por Nombramiento
                        </h3>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                                <th className="py-2.5 px-3 font-extrabold">Rol</th>
                                <th className="py-2.5 px-3 font-extrabold">Alcance</th>
                                <th className="py-2.5 px-3 font-extrabold">Permisos en Kongre</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                              {RBAC_DOCUMENTATION_MATRIX.map((row) => (
                                <tr
                                  key={row.role}
                                  className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors"
                                >
                                  <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                    {row.role}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {row.scope}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {row.permissions}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Docusaurus Admonition: Tip */}
                    {activeDoc.tip && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-emerald-500 text-xs text-emerald-950 dark:text-emerald-200 space-y-1 shadow-2xs"
                      >
                        <div className="font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                          <Sparkles className="w-4 h-4" />
                          <span>Consejo Práctico</span>
                        </div>
                        <p className="leading-relaxed">{activeDoc.tip}</p>
                      </motion.div>
                    )}

                    {/* Docusaurus Admonition: Warning */}
                    {activeDoc.warning && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-l-4 border-amber-500 text-xs text-amber-950 dark:text-amber-200 space-y-1 shadow-2xs"
                      >
                        <div className="font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <AlertCircle className="w-4 h-4" />
                          <span>Importante</span>
                        </div>
                        <p className="leading-relaxed">{activeDoc.warning}</p>
                      </motion.div>
                    )}

                    {/* Previous / Next Article Pagination with Motion Spring Physics */}
                    <div className="pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prevDoc ? (
                        <motion.button
                          type="button"
                          whileHover={{ x: -4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={() => {
                            setSelectedDocId(prevDoc.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-left transition cursor-pointer flex items-center gap-3 group bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm"
                        >
                          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 group-hover:-translate-x-1 transition-transform" />
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Anterior
                            </span>
                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {prevDoc.title}
                            </span>
                          </div>
                        </motion.button>
                      ) : (
                        <div />
                      )}

                      {nextDoc ? (
                        <motion.button
                          type="button"
                          whileHover={{ x: 4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={() => {
                            setSelectedDocId(nextDoc.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-right transition cursor-pointer flex items-center justify-end gap-3 group bg-white dark:bg-slate-900 shadow-2xs hover:shadow-sm"
                        >
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              Siguiente
                            </span>
                            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {nextDoc.title}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </motion.article>
                </AnimatePresence>
              </div>

              {/* RIGHT SIDEBAR: "En esta página" Table of Contents (Docusaurus style) */}
              <motion.aside
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-4 sticky top-20"
              >
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>En esta página</span>
                  </div>
                  <ul className="space-y-2 text-xs border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                    {activeDoc.steps.map((step, i) => (
                      <li key={step.id}>
                        <a
                          href={`#${step.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(step.id);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium block leading-snug transition hover:translate-x-1"
                        >
                          {i + 1}. {step.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick Action Box in Sidebar with Motion button */}
                <div className="rounded-3xl bg-linear-to-br from-indigo-50/90 via-white to-violet-50/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/70 p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>¿Listo para abrir la app?</span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                    Accede al portal de tu congregación con tu código personal o explora la demo interactiva.
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => onGoToPortal()}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs shadow-indigo-600/25 transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Ir al Portal (#portal)</span>
                  </motion.button>
                </div>
              </motion.aside>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 3: DOWNLOADS & PWA INSTALLATION
            =================================================================== */}
        {activeSection === 'downloads' && (
          <section className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Multiplataforma
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Instala Kongre en cualquier dispositivo
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                Úsala en el navegador, instálala como aplicación web progresiva (PWA) en tu celular o descarga el ejecutable nativo para la computadora del Salón del Reino.
              </p>
            </div>

            <DesktopCompatibilityBanner
              variant="hero-card"
              onOpenAllDownloads={() => setDesktopModalOpen(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Android (Chrome)
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Teléfonos y Tabletas Android
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Abre <strong>kongre-app.com/#portal</strong> en Chrome, toca el menú de tres puntos (⋮) y selecciona <strong>«Instalar aplicación»</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenGuideArticle('install-android')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver guía para Android</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    iOS / iPadOS (Safari)
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    iPhone y iPad
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Abre <strong>kongre-app.com/#portal</strong> en Safari, toca el botón <strong>Compartir</strong> y elige <strong>«Añadir a pantalla de inicio»</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenGuideArticle('install-ios')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver guía para iPhone / iPad</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Windows, macOS y Linux
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Computadora del Salón y PC Personal
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Descarga el instalador nativo en Rust (.exe, .dmg, .deb) o instálala desde la barra de direcciones de Chrome o Edge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDesktopModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir instaladores de escritorio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Official Footer */}
      <AppFooter
        onOpenVersionModal={onOpenVersionModal}
        variant="landing"
      />

      {/* Desktop Installer Modal */}
      <DesktopDownloadModal
        isOpen={desktopModalOpen}
        onClose={() => setDesktopModalOpen(false)}
      />
    </div>
  );
};
