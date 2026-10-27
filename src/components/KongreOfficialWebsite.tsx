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
  FileText,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  Monitor,
  Moon,
  QrCode,
  ScrollText,
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
  Tv,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import Logo from '../Logo';
import { useTheme } from '../context/ThemeContext';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { DesktopCompatibilityBanner } from './DesktopCompatibilityBanner';
import { DesktopDownloadModal } from './DesktopDownloadModal';
import { AppFooter } from './AppFooter';

interface KongreOfficialWebsiteProps {
  onGoToPortal: (initialPortalTab?: string) => void;
  onStartDemoMode: () => void;
  onOpenVersionModal: () => void;
  isSignedInOrRegistered?: boolean;
  onEnterAppDirectly?: () => void;
}

type WebsiteSection = 'overview' | 'modules' | 'docs' | 'downloads';

type DocCategory =
  | 'all'
  | 'inicio'
  | 'reuniones'
  | 'predicacion'
  | 'secretaria'
  | 'publicadores'
  | 'seguridad';

type DocArticleId =
  | 'arquitectura'
  | 'primeros-pasos'
  | 'acceso-publicadores'
  | 'roles-rbac'
  | 'vmc-s89'
  | 'discursos-fin-semana'
  | 'territorios-carritos'
  | 'secretaria-s21'
  | 'salon-tablero-cuentas'
  | 'portal-publicador-movil'
  | 'sincronizacion-respaldos'
  | 'seguridad-2fa';

interface DocArticle {
  id: DocArticleId;
  categoryKey: Exclude<DocCategory, 'all'>;
  category: string;
  audience: string;
  title: string;
  summary: string;
  readTime: string;
  menuPath: string;
  steps: { title: string; detail: string; badge?: string }[];
  keyTakeaways?: string[];
  tip?: string;
  warning?: string;
}

const DOC_CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: 'all', label: 'Todos los capítulos (12)' },
  { id: 'inicio', label: 'Primeros Pasos' },
  { id: 'reuniones', label: 'Reuniones (VMC y Fin de Semana)' },
  { id: 'predicacion', label: 'Territorios y Carritos' },
  { id: 'secretaria', label: 'Secretaría y Salón' },
  { id: 'publicadores', label: 'App para Publicadores' },
  { id: 'seguridad', label: 'Seguridad, Nube y Respaldos' },
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

const FAQ_ITEMS = [
  {
    question: '¿Cómo funciona Kongre si en el Salón del Reino no hay conexión a internet?',
    answer:
      'Kongre utiliza una arquitectura Offline-First con base de datos local cifrada (IndexedDB). Puedes abrir la app en la computadora del Salón o en tu teléfono sin internet, consultar programas, registrar asistencia S-88 o marcar territorios. Los cambios se guardan en la "Cola Offline" y se sincronizan automáticamente en cuanto el dispositivo vuelve a conectarse.',
  },
  {
    question: '¿Qué hago si un publicador o anciano cambia de teléfono o extravía su celular?',
    answer:
      'El Coordinador o un Anciano autorizado puede ir al menú superior → "PINes de Acceso", buscar al hermano y pulsar "Regenerar PIN" o "Revocar". El Guardián de Sesión cerrará automáticamente la sesión en el teléfono extraviado en tiempo real y el hermano podrá ingresar en su teléfono nuevo con el nuevo PIN o código QR.',
  },
  {
    question: '¿Pueden varios ancianos programar partes desde sus casas al mismo tiempo?',
    answer:
      'Sí. Al estar conectada la congregación mediante su ID canónico (KGR-XXXX-XXXX), el Superintendente de Vida y Ministerio puede programar entre semana mientras el Siervo de Discursos actualiza el fin de semana y el Secretario revisa los informes S-21. Kongre sincroniza y fusiona los cambios automáticamente.',
  },
  {
    question: '¿Necesitan los publicadores tener cuenta de Google o correo electrónico para ver sus partes?',
    answer:
      'No. A diferencia de otros sistemas que obligan a crear cuentas de correo, en Kongre los publicadores pueden entrar directamente escaneando su código QR de invitación o escribiendo su PIN personal de 4 a 6 dígitos en kongre-app.com/#portal.',
  },
  {
    question: '¿Cómo se proyecta el Tablero de Anuncios en el monitor o TV del Salón del Reino?',
    answer:
      'Desde la barra superior de la aplicación (o en la pestaña "Tablero de Anuncios"), haz clic en el botón "Modo Tablero del Salón" (Quiosco). La pantalla mostrará en formato de alto contraste el programa semanal S-140, asignaciones de limpieza, acomodadores, discurso público y anuncios oficiales.',
  },
  {
    question: '¿Qué nivel de privacidad tienen los datos sensibles de los publicadores en la nube?',
    answer:
      'Todos los datos se cifran en tu propio dispositivo antes de enviarse a la nube mediante AES-256-GCM con derivación PBKDF2 de 600,000 iteraciones (arquitectura Zero-Knowledge). Ni siquiera el servidor de base de datos puede leer los nombres, teléfonos o tarjetas S-21 sin el PIN de tu congregación.',
  },
];

const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'arquitectura',
    categoryKey: 'inicio',
    category: '1. Introducción',
    audience: 'Cuerpo de Ancianos y Toda la Congregación',
    title: '1. ¿Qué es Kongre y cómo se organiza el ecosistema?',
    summary:
      'Comprende cómo interactúan la aplicación de escritorio del Salón del Reino, el panel administrativo web para ancianos y el portal móvil para publicadores.',
    readTime: '3 min',
    menuPath: 'www.kongre-app.com → #portal',
    steps: [
      {
        title: 'Aplicación de Escritorio (Windows, macOS y Linux en Rust)',
        badge: 'Salón del Reino y PC',
        detail:
          'Diseñada para instalarse en la computadora del Salón del Reino y en las computadoras personales del Cuerpo de Ancianos. Arranca en menos de un segundo, consume solo ~15 MB y opera 100% sin conexión.',
      },
      {
        title: 'Portal Web de Administración (kongre-app.com/#portal)',
        badge: 'Ancianos y Siervos',
        detail:
          'Permite a los hermanos nombrados programar reuniones, imprimir plantillas oficiales en PDF (S-140, S-89, S-21, S-13, S-88) y coordinar departamentos desde cualquier navegador moderno sin instalar nada.',
      },
      {
        title: 'App Móvil PWA "Mi Vista" para Publicadores (iOS y Android)',
        badge: 'Publicadores',
        detail:
          'Cada hermano instala el acceso directo en su celular para recibir sus hojas de asignación S-89, confirmar partes con un toque, ver el mapa GPS de su territorio, consultar la cartelera y entregar su informe mensual.',
      },
    ],
    keyTakeaways: [
      'Una sola base de datos cifrada sincroniza PC, Mac, teléfonos Android y iPhone.',
      'Compatible con modo Claro, modo Oscuro y modo Cabina de Audio/Video.',
      'Incluye entorno Demo interactivo para capacitar a hermanos sin alterar datos reales.',
    ],
    tip: 'Comparte www.kongre-app.com con el cuerpo de ancianos para que revisen esta guía antes de realizar la configuración inicial.',
  },
  {
    id: 'primeros-pasos',
    categoryKey: 'inicio',
    category: '2. Configuración Inicial',
    audience: 'Coordinador o Secretario',
    title: '2. Primeros pasos: Registro oficial de la congregación',
    summary:
      'Guía paso a paso para dar de alta tu congregación, generar el ID único (KGR-XXXX-XXXX) y configurar horarios y credenciales.',
    readTime: '4 min',
    menuPath: '#portal → Registrar Nueva Congregación',
    steps: [
      {
        title: 'Paso 1: Inicia el asistente de registro en #portal',
        badge: 'Paso 1',
        detail:
          'Entra en kongre-app.com/#portal y selecciona "Registrar Nueva Congregación". Solo una persona (generalmente el Coordinador o el Secretario) debe realizar este registro inicial.',
      },
      {
        title: 'Paso 2: Identificación y horarios de reunión',
        badge: 'Paso 2',
        detail:
          'Introduce el nombre de la congregación, número oficial, circuito, ciudad y los días y horas exactos de la Reunión de Entre Semana y la Reunión del Fin de Semana.',
      },
      {
        title: 'Paso 3: Configura los dos niveles de PIN de la congregación',
        badge: 'Seguridad',
        detail:
          'El asistente te pedirá crear: (1) el PIN de Congregación (para acceso general de miembros) y (2) el PIN Maestro del Coordinador (para administración de roles y seguridad). Al finalizar recibirás tu ID canónico, por ejemplo: KGR-4829-1042.',
      },
      {
        title: 'Paso 4: Carga o importa la lista de publicadores',
        badge: 'Directorio',
        detail:
          'Dirígete a la pestaña "Publicadores". Puedes registrar a cada hermano indicando su grupo de servicio, privilegios (Anciano, Siervo Ministerial, Precursor Regular/Auxiliar) y asignaciones habilitadas (lector, acomodador, micrófonos, audio/video, discursos).',
      },
    ],
    warning:
      'Guarda en un lugar seguro el ID de la congregación (KGR-XXXX-XXXX) y el PIN Maestro del Coordinador. Por seguridad de conocimiento cero, el PIN Maestro cifra las llaves de administración.',
    tip: 'Si ya tienes una lista de publicadores en otro programa (como KHS, NW Scheduler u Organized), puedes usar el importador en la pestaña Publicadores o Ajustes.',
  },
  {
    id: 'acceso-publicadores',
    categoryKey: 'inicio',
    category: '3. Conexión de Hermanos',
    audience: 'Ancianos y Publicadores',
    title: '3. Cómo conectar a ancianos, siervos y publicadores',
    summary:
      'Aprende los 3 métodos de ingreso para vincular los dispositivos de los ancianos y dar acceso rápido a cada publicador.',
    readTime: '4 min',
    menuPath: 'Barra Superior → PINes de Acceso / Invitaciones',
    steps: [
      {
        title: 'Opción A: Enlace Directo o Código QR de Invitación (La más rápida)',
        badge: 'Recomendado',
        detail:
          'Desde la barra superior, abre el botón de Invitaciones o "PINes de Acceso". Selecciona al hermano y pulsa "Compartir por WhatsApp" o muestra el código QR. Al abrir el enlace, su teléfono queda configurado automáticamente con su nombre y rol.',
      },
      {
        title: 'Opción B: Ingreso con ID de Congregación + PIN Personal',
        badge: 'Sin correo',
        detail:
          'En el directorio de "PINes de Acceso", cada hermano tiene un PIN personal de 4 a 6 dígitos. En kongre-app.com/#portal (pestaña ID y PIN), el hermano escribe el ID de congregación, el PIN de congregación y su PIN personal.',
      },
      {
        title: 'Opción C: Inicio de sesión con cuenta de Google',
        badge: 'OAuth Verificado',
        detail:
          'Si registras el correo Gmail de un anciano o siervo en su ficha o en "Roles y Permisos", ese hermano podrá entrar con un clic usando el botón "Continuar con Google". Si su correo aún no está autorizado, podrá enviar una "Solicitud de Aprobación" al Coordinador.',
      },
    ],
    keyTakeaways: [
      'Un mismo hermano puede entrar desde su PC y desde su celular simultáneamente.',
      'No es obligatorio tener cuenta de Google para usar Kongre.',
      'Las solicitudes de vinculación nuevas aparecen como notificación para el Coordinador.',
    ],
  },
  {
    id: 'roles-rbac',
    categoryKey: 'seguridad',
    category: '4. Roles y Permisos',
    audience: 'Cuerpo de Ancianos',
    title: '4. Matriz de Roles Teocráticos y Permisos (RBAC)',
    summary:
      'Cómo asignar responsabilidades por departamento asegurando que cada hermano solo acceda a la información que le corresponde.',
    readTime: '5 min',
    menuPath: 'Menú → Roles y Permisos (#roles)',
    steps: [
      {
        title: 'Principio de privilegio mínimo y confidencialidad',
        badge: 'Gobernanza',
        detail:
          'Kongre filtra automáticamente las pestañas visibles según el rol activo del usuario. Por ejemplo, un Siervo de Territorios ve el mapa y el registro S-13, pero no tiene acceso a las tarjetas S-21 de secretaría ni a la contabilidad.',
      },
      {
        title: 'Asignación de múltiples roles a un hermano',
        badge: 'Multirrol',
        detail:
          'En la vista "Roles y Permisos", el Coordinador puede asignar uno o varios roles a un hermano (ej. Anciano + Superintendente de Vida y Ministerio + Superintendente de Grupo). El hermano verá todas las herramientas combinadas de sus privilegios.',
      },
      {
        title: 'Alcance protegido en Tarjetas S-21 por Grupo de Servicio',
        badge: 'Privacidad S-21',
        detail:
          'El Coordinador, el Secretario y el Superintendente de Servicio pueden consultar todas las tarjetas S-21. En cambio, cada Superintendente de Grupo (y su auxiliar) solo puede visualizar las tarjetas S-21 de los publicadores pertenecientes a su propio grupo.',
      },
    ],
    tip: 'Revisa la tabla inferior en este mismo capítulo para consultar el detalle exacto de permisos de cada nombramiento.',
  },
  {
    id: 'vmc-s89',
    categoryKey: 'reuniones',
    category: '5. Vida y Ministerio (VMC)',
    audience: 'Superintendente VMC y Consejeros',
    title: '5. Programación Vida y Ministerio (S-140) y Hojas S-89',
    summary:
      'Cómo importar el cuaderno de actividades, asignar partes sin conflictos, llevar el historial S-38 y enviar hojas S-89 por WhatsApp.',
    readTime: '6 min',
    menuPath: 'Menú → Vida y Ministerio (CLM) / Hojas S-89',
    steps: [
      {
        title: 'Paso 1: Importar semanas de la Guía de Actividades (MWB)',
        badge: 'Importador',
        detail:
          'En la sección "Vida y Ministerio (CLM)", usa el botón "Importar Guía de Actividades" para cargar automáticamente las canciones, lecturas bíblicas, Perlas Escondidas, partes estudiantiles y Nuestra Vida Cristiana del mes.',
      },
      {
        title: 'Paso 2: Selector inteligente con Motor de Equidad e Historial S-38',
        badge: 'Sin Conflictos',
        detail:
          'Al hacer clic en cualquier asignación (presidente, oración, discurso, lectura de la Biblia, demostración o conductor del Estudio Bíblico), el selector ordena a los hermanos habilitados mostrando quién lleva más semanas sin participar y bloquea choques si ya tiene otra responsabilidad esa noche.',
      },
      {
        title: 'Paso 3: Generación de Hojas S-89 en PDF y envío por WhatsApp',
        badge: 'Formato S-89',
        detail:
          'Abre la pestaña "Hojas S-89". Puedes descargar el PDF oficial con 4 hojas S-89 por página listo para cortar, o pulsar "Enviar por WhatsApp". El mensaje incluye la fecha, tema, ayudante, sala y un enlace seguro de confirmación.',
      },
      {
        title: 'Paso 4: Confirmación en 1 clic y reemplazos rápidos',
        badge: 'Seguimiento',
        detail:
          'Cuando el estudiante pulsa "Confirmar asignación" desde su WhatsApp o desde "Mi Vista", la parte aparece marcada en verde como Confirmada. Si un hermano avisa que no podrá asistir, usa el botón "Sustitución Rápida" para reasignar la parte al instante.',
      },
    ],
    keyTakeaways: [
      'Impresión del programa mensual S-140 con diseño oficial para la cartelera.',
      'Soporte completo para Sala Principal y Sala Auxiliar 1 / 2.',
      'Registro automático en el historial estudiantil S-38.',
    ],
  },
  {
    id: 'discursos-fin-semana',
    categoryKey: 'reuniones',
    category: '6. Reunión de Fin de Semana',
    audience: 'Siervo de Discursos y Coordinador',
    title: '6. Discursos Públicos, Oradores Visitantes y Hospitalidad',
    summary:
      'Organiza el programa del fin de semana, catálogo de 194 bosquejos, intercambio de conferenciantes y turnos de hospitalidad.',
    readTime: '4 min',
    menuPath: 'Menú → Discursos Públicos / Hospitalidad',
    steps: [
      {
        title: 'Catálogo de bosquejos y control de repetición',
        badge: 'Bosquejos',
        detail:
          'Al programar el discurso público de la semana, selecciona el número de bosquejo oficial. Kongre te indica cuándo fue la última vez que se presentó ese tema en la congregación para evitar repetir discursos recientes.',
      },
      {
        title: 'Directorio de oradores locales y visitantes',
        badge: 'Conferenciantes',
        detail:
          'Registra los oradores de tu congregación que salen a visitar otras congregaciones y los oradores visitantes que recibes, incluyendo su congregación de origen, teléfono y temas preparados.',
      },
      {
        title: 'Coordinación de Hospitalidad y Presidente / Lector',
        badge: 'Hospitalidad',
        detail:
          'En la pestaña "Hospitalidad", asigna qué grupo de servicio o familia atenderá al orador visitante cada domingo, registrando arreglos de comida o alojamiento y enviando el recordatorio por WhatsApp.',
      },
    ],
  },
  {
    id: 'territorios-carritos',
    categoryKey: 'predicacion',
    category: '7. Territorios y Carritos',
    audience: 'Siervo de Territorios y Superintendente de Servicio',
    title: '7. Mapas de Territorios GPS (S-13) y Predicación Pública',
    summary:
      'Cartografía interactiva OpenStreetMap/Leaflet, tarjetas digitales con QR para conductores y turnos de exhibidores móviles.',
    readTime: '5 min',
    menuPath: 'Menú → Territorios / Carritos',
    steps: [
      {
        title: 'Creación y edición de polígonos en el mapa interactivo',
        badge: 'Cartografía GPS',
        detail:
          'En la pestaña "Territorios", dibuja los límites de cada territorio sobre el mapa callejero o vista satelital. Puedes agregar manzanas, notas de "No visitar" y clasificar el territorio por estado (Disponible, En curso o Atrasado).',
      },
      {
        title: 'Tarjeta Digital con Código QR y GPS en vivo',
        badge: 'Modo Bolsillo',
        detail:
          'Al asignar un territorio a un conductor o publicador, envíale su enlace o tarjeta QR. El hermano abrirá el mapa en su celular sin necesidad de permisos administrativos, verá su punto azul GPS en tiempo real dentro del territorio y marcará las manzanas predicadas.',
      },
      {
        title: 'Exportación del Registro Oficial S-13',
        badge: 'Formato S-13',
        detail:
          'Cada vez que asignas y marcas como completado un territorio, Kongre guarda el nombre del hermano, la fecha de asignación y la fecha de conclusión en el formulario S-13 exportable en PDF.',
      },
      {
        title: 'Turnos de Predicación Pública (Carritos)',
        badge: 'Exhibidores',
        detail:
          'En la pestaña "Carritos", configura las ubicaciones autorizadas de exhibidores móviles, horarios y asigna las parejas de publicadores para cada turno semanal.',
      },
    ],
  },
  {
    id: 'secretaria-s21',
    categoryKey: 'secretaria',
    category: '8. Secretaría e Informes',
    audience: 'Secretario, Sup. de Servicio y Sup. de Grupo',
    title: '8. Informes Mensuales (S-1), Tarjetas S-21 y Asistencia (S-88)',
    summary:
      'Flujo mensual para recopilar informes de predicación por grupo, consolidar totales para la sucursal y llevar el registro S-88.',
    readTime: '5 min',
    menuPath: 'Menú → Informes de Servicio / Tarjetas S-21 / Asistencia',
    steps: [
      {
        title: 'Paso 1: Recopilación de informes por Grupo de Servicio',
        badge: 'Días 1 al 6',
        detail:
          'Al finalizar el mes, los publicadores envían su informe desde "Mi Vista" (indicando si participaron en el ministerio, cursos bíblicos y horas si son precursores). Los Superintendentes de Grupo ven en tiempo real quién falta por entregar y pueden ingresarlo manualmente.',
      },
      {
        title: 'Paso 2: Resumen S-1 para la Sucursal',
        badge: 'Informe S-1',
        detail:
          'En la pestaña "Informe S-1", el Secretario obtiene el desglose exacto listo para transcribir a jw.org: total de publicadores activos, informes recibidos, precursores auxiliares y precursores regulares.',
      },
      {
        title: 'Paso 3: Archivo Digital de Tarjetas S-21',
        badge: 'Tarjetas S-21',
        detail:
          'Todos los informes mensuales se vuelcan automáticamente en la Tarjeta de Registro del Publicador (S-21) del año de servicio en curso, con opción de exportar en PDF individual o por grupo de servicio.',
      },
      {
        title: 'Paso 4: Registro S-88 de Asistencia a las Reuniones',
        badge: 'Asistencia S-88',
        detail:
          'Los acomodadores o el Secretario registran la asistencia de cada semana (presencial y conectada). Kongre calcula automáticamente los promedios mensuales, anuales y gráficos comparativos.',
      },
    ],
  },
  {
    id: 'salon-tablero-cuentas',
    categoryKey: 'secretaria',
    category: '9. Salón del Reino',
    audience: 'Encargados de Acomodadores, Audio/Video, Limpieza y Cuentas',
    title: '9. Tablero Digital, Limpieza, Acomodadores, Cuentas y Mantenimiento',
    summary:
      'Administra los deberes semanales de las reuniones, la pantalla de anuncios del Salón, contabilidad y seguridad eléctrica.',
    readTime: '4 min',
    menuPath: 'Menú → Limpieza y Deberes / Tablero / Cuentas',
    steps: [
      {
        title: 'Asignación de Acomodadores, Micrófonos, Plataforma y Audio/Video',
        badge: 'Deberes',
        detail:
          'En "Limpieza y Deberes", asigna por semana quiénes atenderán la entrada, el auditorio, los micrófonos, la consola de sonido/video y qué grupo de servicio tiene a su cargo el aseo semanal del Salón.',
      },
      {
        title: 'Modo Tablero del Salón (Cartelera Digital Quiosco)',
        badge: 'Monitor TV',
        detail:
          'Abre "Tablero del Salón" en la computadora conectada a la pantalla de anuncios del Salón del Reino. Muestra de forma rotativa o fija el programa Vida y Ministerio, discursos, deberes de limpieza y comunicados oficiales.',
      },
      {
        title: 'Cuentas, Literatura, Mantenimiento y Panel Eléctrico',
        badge: 'Operación',
        detail:
          'Incluye módulos dedicados para el libro mensual de cuentas, inventario de publicaciones, calendario de mantenimiento preventivo del edificio e identificación visual de pastillas/disyuntores del panel eléctrico.',
      },
    ],
  },
  {
    id: 'portal-publicador-movil',
    categoryKey: 'publicadores',
    category: '10. App del Publicador',
    audience: 'Todos los Publicadores y Precursores',
    title: '10. Guía del Publicador: Cómo usar "Mi Vista" en el celular',
    summary:
      'Todo lo que un publicador o precursor puede hacer desde su teléfono: ver partes, usar el cronómetro, anotar revisitas y enviar su informe.',
    readTime: '4 min',
    menuPath: 'Menú Inferior → Inicio / Mi Vista',
    steps: [
      {
        title: 'Consulta y confirmación de próximas asignaciones',
        badge: 'Mis Partes',
        detail:
          'Al abrir Kongre en el celular, el hermano ve una tarjeta clara con su próxima asignación estudiantil S-89, lectura, discurso o turno de micrófonos/acomodador, con botón para confirmar asistencia o agregarla a su calendario.',
      },
      {
        title: 'Cronómetro de Ministerio, Revisitas y Estudios Bíblicos',
        badge: 'Ministerio',
        detail:
          'Para los precursores y publicadores, la pestaña "Inicio / Ministerio" incluye un cronómetro integrado de predicación, libreta privada de revisitas y control de progreso de estudios bíblicos.',
      },
      {
        title: 'Entrega del informe mensual en 10 segundos',
        badge: 'Informe S-4',
        detail:
          'Al final de cada mes aparece la tarjeta de entrega de informe. El hermano marca su casilla de participación (o sus horas si es precursor), añade sus cursos bíblicos y pulsa "Enviar al Superintendente de Grupo".',
      },
    ],
    tip: 'Instala Kongre en la pantalla de inicio de tu teléfono (Safari → Compartir → Agregar a inicio en iPhone, o Chrome → Instalar aplicación en Android) para recibir recordatorios de tus partes.',
  },
  {
    id: 'sincronizacion-respaldos',
    categoryKey: 'seguridad',
    category: '11. Sincronización y Respaldos',
    audience: 'Coordinador y Secretario',
    title: '11. Sincronización en la Nube, Modo Offline y Copias de Seguridad',
    summary:
      'Cómo funciona la sincronización automática entre dispositivos, la cola offline y cómo exportar copias de seguridad locales.',
    readTime: '4 min',
    menuPath: 'Menú → Ajustes / Indicador de Sincronización',
    steps: [
      {
        title: 'Sincronización automática en tiempo real',
        badge: 'Nube Cifrada',
        detail:
          'Cada vez que un anciano guarda un cambio en la programación o un publicador confirma su parte, Kongre cifra el paquete de datos y lo sincroniza automáticamente con la nube de la congregación.',
      },
      {
        title: 'Cola de Sincronización Offline (Trabajo sin internet)',
        badge: 'Offline-First',
        detail:
          'Si trabajas sin conexión en el Salón del Reino, el indicador inferior mostrará "Modo Offline". Al recuperar la conexión, todas las operaciones pendientes se envían en orden sin perder ningún dato.',
      },
      {
        title: 'Exportación e importación de Copias de Seguridad (.json)',
        badge: 'Respaldo Local',
        detail:
          'Desde la pestaña "Ajustes", el Coordinador o Secretario puede descargar en cualquier momento un archivo de respaldo completo de la congregación para guardarlo en una memoria USB o restaurarlo en otro equipo.',
      },
    ],
  },
  {
    id: 'seguridad-2fa',
    categoryKey: 'seguridad',
    category: '12. Criptografía y 2FA',
    audience: 'Cuerpo de Ancianos y Todos los Usuarios',
    title: '12. Seguridad Cero Conocimiento (AES-256) y Autenticación 2FA',
    summary:
      'Configura la verificación en dos pasos con Microsoft/Google Authenticator, bloqueo automático por PIN y rotación de claves.',
    readTime: '4 min',
    menuPath: 'Menú → Mi Perfil / Roles y Permisos',
    steps: [
      {
        title: 'Arquitectura Cero Conocimiento (Zero-Knowledge AES-256-GCM)',
        badge: 'Cifrado Militar',
        detail:
          'Kongre deriva una llave criptográfica única a partir de las credenciales de tu congregación mediante PBKDF2 (600,000 iteraciones SHA-256). Los datos viajan y se almacenan cifrados de extremo a extremo.',
      },
      {
        title: 'Activar Verificación en Dos Pasos (2FA TOTP)',
        badge: 'Authenticator',
        detail:
          'Ve a "Mi Perfil" → "Autenticación en Dos Pasos (2FA)". Escanea el código QR con Microsoft Authenticator o Google Authenticator, ingresa el código de 6 dígitos y descarga tus 8 códigos de recuperación de emergencia.',
      },
      {
        title: 'Bloqueo de pantalla por inactividad y Rotación de Credenciales',
        badge: 'Protección Local',
        detail:
          'Activa el temporizador de auto-bloqueo para que la sesión pida tu PIN si te alejas de la computadora. Además, si cambia el Coordinador o deseas renovar los accesos, usa la herramienta "Rotar Credenciales de Congregación".',
      },
    ],
  },
];

const MODULE_SHOWCASE = [
  {
    id: 'vmc',
    kicker: 'VIDA Y MINISTERIO · S-140 & S-89',
    title: 'Programación Semanal y Hojas S-89',
    description:
      'Programa las reuniones de entre semana con detección instantánea de conflictos, historial estudiantil S-38, sala auxiliar y envío de hojas S-89 por WhatsApp con confirmación en 1 clic.',
    iconPath: '/assets/icons/svg-indigo/clm_vmc.svg',
    docTarget: 'vmc-s89' as DocArticleId,
    highlights: [
      'Plantillas oficiales S-140 y S-89 (4 por hoja) en PDF',
      'Confirmación de asignación por WhatsApp sin iniciar sesión',
      'Motor de equidad y rotación equilibrada de participantes',
    ],
  },
  {
    id: 'discursos',
    kicker: 'FIN DE SEMANA · ORADORES Y HOSPITALIDAD',
    title: 'Discursos Públicos y Arreglos de Oradores',
    description:
      'Coordina oradores locales y visitantes, catálogo de bosquejos oficiales, asignación de presidente, lector de La Atalaya y turnos de hospitalidad por grupo de servicio.',
    iconPath: '/assets/icons/svg-indigo/discursos.svg',
    docTarget: 'discursos-fin-semana' as DocArticleId,
    highlights: [
      'Control de bosquejos presentados recientemente en la congregación',
      'Calendario de oradores que salen a otras congregaciones',
      'Programación de hospitalidad y recordatorios para anfitriones',
    ],
  },
  {
    id: 'territorios',
    kicker: 'PREDICACIÓN · MAPAS GPS Y S-13',
    title: 'Territorios Interactivos y Exhibidores (Carritos)',
    description:
      'Mapas callejeros y satelitales con polígonos editables, tarjetas digitales con código QR para trabajar desde el móvil, control de manzanas y registro oficial S-13.',
    iconPath: '/assets/icons/svg-indigo/predicacion.svg',
    docTarget: 'territorios-carritos' as DocArticleId,
    highlights: [
      'Geolocalización GPS en vivo para publicadores en el territorio',
      'Alertas automáticas de territorios sin trabajar por más de 4 meses',
      'Gestión de turnos de predicación pública en carritos',
    ],
  },
  {
    id: 'secretaria',
    kicker: 'SECRETARÍA · S-21, S-88 Y S-1',
    title: 'Informes de Servicio, Tarjetas S-21 y Asistencia',
    description:
      'Recibe los informes mensuales de los grupos de servicio, consolida el informe S-1 para la sucursal, genera tarjetas S-21 en PDF y analiza las estadísticas de asistencia S-88.',
    iconPath: '/assets/icons/svg-indigo/secretaria.svg',
    docTarget: 'secretaria-s21' as DocArticleId,
    highlights: [
      'Entrega de informe mensual desde el portal del publicador',
      'Control de precursores regulares, auxiliares y metas de horas',
      'Registro S-88 presencial/Zoom con promedios del año de servicio',
    ],
  },
  {
    id: 'salon',
    kicker: 'SALÓN DEL REINO · OPERACIÓN Y TABLERO',
    title: 'Tablero Digital, Limpieza, Cuentas y Mantenimiento',
    description:
      'Todo lo necesario para el cuidado del Salón del Reino: cartelera digital en pantalla completa, programa de limpieza y acomodadores, contabilidad mensual e inventario.',
    iconPath: '/assets/icons/svg-indigo/salon.svg',
    docTarget: 'salon-tablero-cuentas' as DocArticleId,
    highlights: [
      'Modo Quiosco / Tablero de Anuncios para TV o monitor del Salón',
      'Asignación automática de acomodadores, micrófonos y audio/video',
      'Hojas de cuentas, literatura y esquema del panel eléctrico',
    ],
  },
  {
    id: 'portal-publicador',
    kicker: 'APP MÓVIL · MI VISTA TEOCRÁTICA',
    title: 'Portal Personal del Publicador (iOS, Android y Web)',
    description:
      'Al igual que las plataformas teocráticas modernas, cada hermano cuenta con su vista personal para consultar sus próximas partes, anuncios, territorios y cronómetro de ministerio.',
    iconPath: '/assets/icons/svg-indigo/mi_vista.svg',
    docTarget: 'portal-publicador-movil' as DocArticleId,
    highlights: [
      'Ingreso instantáneo con PIN personal o código QR de invitación',
      'Funciona sin conexión a internet (PWA Offline-First)',
      'Notificaciones y recordatorios de próximas asignaciones',
    ],
  },
];

export const KongreOfficialWebsite: React.FC<KongreOfficialWebsiteProps> = ({
  onGoToPortal,
  onStartDemoMode,
  onOpenVersionModal,
  isSignedInOrRegistered = false,
  onEnterAppDirectly,
}) => {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<WebsiteSection>('overview');
  const [selectedDocCategory, setSelectedDocCategory] = useState<DocCategory>('all');
  const [selectedDocId, setSelectedDocId] = useState<DocArticleId>('arquitectura');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  const filteredDocs = useMemo(() => {
    const q = docSearchQuery.trim().toLowerCase();
    return DOC_ARTICLES.filter((doc) => {
      if (selectedDocCategory !== 'all' && doc.categoryKey !== selectedDocCategory) {
        return false;
      }
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.audience.toLowerCase().includes(q) ||
        doc.steps.some(
          (s) => s.title.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q)
        )
      );
    });
  }, [docSearchQuery, selectedDocCategory]);

  const activeDoc = useMemo(() => {
    return (
      filteredDocs.find((d) => d.id === selectedDocId) ||
      filteredDocs[0] ||
      DOC_ARTICLES[0]
    );
  }, [filteredDocs, selectedDocId]);

  const currentDocIndex = useMemo(() => {
    return DOC_ARTICLES.findIndex((d) => d.id === activeDoc.id);
  }, [activeDoc.id]);

  const prevDoc = currentDocIndex > 0 ? DOC_ARTICLES[currentDocIndex - 1] : null;
  const nextDoc =
    currentDocIndex >= 0 && currentDocIndex < DOC_ARTICLES.length - 1
      ? DOC_ARTICLES[currentDocIndex + 1]
      : null;

  const handleOpenSpecificDoc = (docId: DocArticleId) => {
    setSelectedDocCategory('all');
    setSelectedDocId(docId);
    setActiveSection('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Top Official Website Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setActiveSection('overview');
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
                    v{CURRENT_APP_VERSION}
                  </span>
                </div>
                <span className="block text-[10.5px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                  Gestor Teocrático Integral
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            {[
              { id: 'overview' as WebsiteSection, label: 'Presentación', icon: Sparkles },
              { id: 'modules' as WebsiteSection, label: 'Módulos', icon: Layers },
              { id: 'docs' as WebsiteSection, label: 'Guía y Documentación', icon: BookOpen },
              { id: 'downloads' as WebsiteSection, label: 'Descargas PC / Móvil', icon: Download },
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

          {/* Right Actions: Theme, Demo & Go to Portal */}
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
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              type="button"
              onClick={onStartDemoMode}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/70 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Demo</span>
            </button>

            {isSignedInOrRegistered && onEnterAppDirectly ? (
              <button
                type="button"
                onClick={onEnterAppDirectly}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
              >
                <span>Entrar a mi Congregación</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onGoToPortal()}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ir al Portal</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </div>
        </div>

        {/* Mobile Section Switcher Bar */}
        <div className="md:hidden flex items-center gap-1 px-3 py-2 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200/70 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview' as WebsiteSection, label: 'Presentación', icon: Sparkles },
            { id: 'modules' as WebsiteSection, label: 'Módulos', icon: Layers },
            { id: 'docs' as WebsiteSection, label: 'Guía y Docs', icon: BookOpen },
            { id: 'downloads' as WebsiteSection, label: 'Descargas PC', icon: Download },
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
        {/* =================================================================
            SECTION 1: OVERVIEW (HERO + QUICK ARCHITECTURE + MODULES PREVIEW)
            ================================================================= */}
        {activeSection === 'overview' && (
          <>
            {/* Hero Banner */}
            <section className="relative rounded-3xl bg-linear-to-br from-indigo-50/90 via-white to-violet-50/70 dark:from-slate-900 dark:via-indigo-950/50 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/70 p-6 sm:p-10 lg:p-12 shadow-lg shadow-indigo-500/5 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Left Column: Value Proposition & CTAs */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <span>Plataforma Teocrática para Congregaciones</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      Web, Móvil y Escritorio (Rust)
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                    Organización ordenada, segura y 100% offline para tu congregación.
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    <strong>Kongre</strong> reúne en una sola herramienta la programación de la{' '}
                    <strong>Reunión Vida y Ministerio (S-140 y S-89)</strong>,{' '}
                    <strong>Discursos Públicos</strong>, <strong>Territorios GPS (S-13)</strong>,{' '}
                    <strong>Secretaría (S-21, S-88 y S-1)</strong>, <strong>Tablero del Salón</strong> y el{' '}
                    <strong>Portal Móvil del Publicador</strong> con cifrado de conocimiento cero.
                  </p>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onGoToPortal()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Abrir Portal de Congregación</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('docs')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold text-sm shadow-2xs transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Leer Guía de Documentación</span>
                    </button>

                    <button
                      type="button"
                      onClick={onStartDemoMode}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-violet-100/80 dark:bg-violet-950/60 hover:bg-violet-200/70 dark:hover:bg-violet-900/70 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800 font-bold text-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>Probar Demo en Vivo</span>
                    </button>
                  </div>

                  {/* Unboxed Key Trust Metadata */}
                  <div className="pt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border-t border-indigo-100/90 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Cifrado AES-256-GCM Zero-Knowledge
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CloudOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      100% Funcional sin Internet
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      Sincronización PC ↔ Móvil
                    </span>
                  </div>
                </div>

                {/* Right Column: Interactive Quick Access & Architecture Preview Card */}
                <div className="lg:col-span-5">
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                      <div>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Acceso Rápido
                        </span>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                          ¿Cómo deseas ingresar hoy?
                        </h2>
                      </div>
                      <Logo variant="isotipo" className="w-7 h-7 object-contain" />
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => onGoToPortal('home')}
                        className="w-full p-3.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                              Portal de Acceso de Congregación
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Ingresar con Google, ID + PIN o Código de Invitación
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onGoToPortal('register')}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                              Registrar Nueva Congregación
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Configuración inicial para el Cuerpo de Ancianos
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveSection('docs')}
                        className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3 text-left transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300">
                              Manual y Documentación Oficial (12 Guías)
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Paso a paso para ancianos, siervos y publicadores
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Ruta directa del portal:</span>
                      <button
                        type="button"
                        onClick={() => onGoToPortal()}
                        className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        kongre-app.com/#portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How Kongre Connects the Congregation (3 Pillars like NW Scheduler / KHS) */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Ecosistema Unificado
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    Diseñado para Ancianos, Siervos Ministeriales y Publicadores
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('docs')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Ir al Centro de Documentación</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    1. Administración en PC y Web
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Programación de Reuniones y Secretaría
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    El Cuerpo de Ancianos y los siervos designados preparan el programa Vida y Ministerio, discursos públicos, acomodadores, limpieza, territorios y tarjetas S-21 desde la aplicación de escritorio o navegador.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    2. App para Publicadores ("Mi Vista")
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Asignaciones S-89, Turnos e Informes en el Bolsillo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Los hermanos consultan desde su celular sus próximas asignaciones estudiantiles, turnos de micrófonos o acomodadores, mapas de territorios, cartelera de anuncios y entregan su informe de predicación.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-indigo-400">
                    3. Tablero del Salón & Seguridad
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cartelera Digital + Cifrado Cero Conocimiento
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Incluye modo Quiosco para la pantalla de anuncios del Salón del Reino y tema especial para la Cabina de Audio/Video, respaldado por cifrado local AES-256-GCM y autenticación 2FA opcional.
                  </p>
                </div>
              </div>
            </section>

            {/* Modules Grid Preview */}
            <section className="space-y-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Módulos Integrados
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Todos los departamentos de la congregación en un mismo lugar
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {MODULE_SHOWCASE.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                          <img
                            src={mod.iconPath}
                            alt={mod.title}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {mod.kicker}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <ul className="space-y-1.5">
                        {mod.highlights.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => handleOpenSpecificDoc(mod.docTarget)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/70 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold inline-flex items-center justify-between transition cursor-pointer"
                      >
                        <span>Ver guía paso a paso</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Desktop Version Download Banner */}
            <section className="space-y-3">
              <DesktopCompatibilityBanner
                variant="hero-card"
                onOpenAllDownloads={() => setDesktopModalOpen(true)}
              />
            </section>
          </>
        )}

        {/* =================================================================
            SECTION 2: DETAILED MODULES BREAKDOWN
            ================================================================= */}
        {activeSection === 'modules' && (
          <section className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Catálogo de Funciones Teocráticas
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  Módulos y Formatos Soportados por Kongre
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                  Cada departamento cuenta con herramientas especializadas y plantillas listas para exportar en PDF o compartir digitalmente con los hermanos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGoToPortal()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
              >
                <KeyRound className="w-4 h-4" />
                <span>Abrir Portal Web</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MODULE_SHOWCASE.map((mod) => (
                <div
                  key={mod.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                        <img
                          src={mod.iconPath}
                          alt={mod.title}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {mod.kicker}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <ul className="space-y-2">
                      {mod.highlights.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleOpenSpecificDoc(mod.docTarget)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/70 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold inline-flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Leer documentación de este módulo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Forms Compatibility Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Compatibilidad de Plantillas e Informes Teocráticos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {[
                  { code: 'Programa S-140', desc: 'Programa semanal de la Reunión Vida y Ministerio Cristiano para cartelera.' },
                  { code: 'Hojas S-89', desc: 'Asignaciones estudiantiles en PDF (4 por página o individuales) y envío por WhatsApp.' },
                  { code: 'Historial S-38', desc: 'Registro histórico de partes estudiantiles, ayudantes y salas por publicador.' },
                  { code: 'Tarjetas S-21', desc: 'Registro individual de publicador por año de servicio con totales automáticos.' },
                  { code: 'Asistencia S-88', desc: 'Control mensual y promedios de asistencia a las reuniones de congregación.' },
                  { code: 'Registro S-13', desc: 'Control de asignación y fechas de finalización de territorios de la congregación.' },
                ].map((f) => (
                  <div
                    key={f.code}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1"
                  >
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {f.code}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-snug">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =================================================================
            SECTION 3: ENHANCED INTERACTIVE DOCUMENTATION & USER GUIDE
            ================================================================= */}
        {activeSection === 'docs' && (
          <section className="space-y-8 animate-fade-in">
            {/* Documentation Header Banner */}
            <div className="rounded-3xl bg-linear-to-br from-indigo-50/90 via-white to-violet-50/60 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/70 p-5 sm:p-8 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Centro Oficial de Documentación · Kongre v{CURRENT_APP_VERSION}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Guía Completa de Uso, Administración y Seguridad
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    Manual estructurado en 12 capítulos prácticos para el Cuerpo de Ancianos, Siervos Ministeriales y Publicadores. Selecciona un departamento o busca cualquier procedimiento.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full lg:w-80 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={docSearchQuery}
                    onChange={(e) => setDocSearchQuery(e.target.value)}
                    placeholder="Buscar tema (ej. S-89, PIN, S-21, QR, 2FA)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Category Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                {DOC_CATEGORIES.map((cat) => {
                  const isActive = selectedDocCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedDocCategory(cat.id);
                        const firstInCat = DOC_ARTICLES.find(
                          (a) => cat.id === 'all' || a.categoryKey === cat.id
                        );
                        if (firstInCat) setSelectedDocId(firstInCat.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Quick Chapter Selector Dropdown */}
            <div className="lg:hidden bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label
                htmlFor="mobile-doc-selector"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"
              >
                Capítulo seleccionado ({filteredDocs.length} disponibles):
              </label>
              <select
                id="mobile-doc-selector"
                value={activeDoc.id}
                onChange={(e) => setSelectedDocId(e.target.value as DocArticleId)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {filteredDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Sidebar: Documentation Topics (Desktop) */}
              <aside className="hidden lg:block lg:col-span-4 space-y-1.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Índice del Manual</span>
                  <span className="font-mono">{filteredDocs.length} guías</span>
                </div>
                {filteredDocs.map((doc) => {
                  const isSelected = activeDoc.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] font-bold uppercase tracking-wider ${
                            isSelected ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {doc.category}
                        </span>
                        <span className="block text-xs font-bold leading-snug mt-0.5">
                          {doc.title}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-1 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </aside>

              {/* Right Content: Selected Documentation Article */}
              <article className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 space-y-6 shadow-xs">
                {/* Article Header & Metadata */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {activeDoc.category}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      Para: {activeDoc.audience}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {activeDoc.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeDoc.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeDoc.summary}
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[11.5px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-sans font-bold text-slate-700 dark:text-slate-200">
                      Ubicación en la app:
                    </span>
                    <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold">
                      {activeDoc.menuPath}
                    </code>
                  </div>
                </div>

                {/* Step-by-Step Procedure */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Procedimiento Paso a Paso
                  </h3>

                  {activeDoc.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {index + 1}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {step.title}
                          </h4>
                          {step.badge && (
                            <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">
                              {step.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Embedded RBAC Role Matrix when viewing 'roles-rbac' */}
                {activeDoc.id === 'roles-rbac' && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Tabla Oficial de Roles y Alcance de Acceso
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                            <th className="py-3 px-4 font-extrabold">Nombramiento / Rol</th>
                            <th className="py-3 px-4 font-extrabold">Alcance</th>
                            <th className="py-3 px-4 font-extrabold">Módulos y Permisos Habilitados</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {RBAC_DOCUMENTATION_MATRIX.map((row) => (
                            <tr
                              key={row.role}
                              className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                            >
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {row.role}
                              </td>
                              <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                {row.scope}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                                {row.permissions}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Key Takeaways */}
                {activeDoc.keyTakeaways && activeDoc.keyTakeaways.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-800/60 space-y-2.5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Puntos clave para recordar
                    </div>
                    <ul className="space-y-1.5">
                      {activeDoc.keyTakeaways.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warning Box */}
                {activeDoc.warning && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-bold">Importante: </strong>
                      {activeDoc.warning}
                    </div>
                  </div>
                )}

                {/* Practical Tip */}
                {activeDoc.tip && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-bold">Sugerencia práctica: </strong>
                      {activeDoc.tip}
                    </div>
                  </div>
                )}

                {/* Previous / Next Chapter Pagination */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prevDoc ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocId(prevDoc.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-left transition cursor-pointer flex items-center gap-3 group"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Capítulo anterior
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {prevDoc.title}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextDoc ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocId(nextDoc.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-right transition cursor-pointer flex items-center justify-end gap-3 group"
                    >
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Siguiente capítulo
                        </span>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {nextDoc.title}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    </button>
                  ) : null}
                </div>
              </article>
            </div>

            {/* Frequently Asked Questions (FAQ) Accordion Section */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Preguntas Frecuentes y Solución de Dudas
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    Respuestas rápidas para el Cuerpo de Ancianos y Publicadores
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onOpenVersionModal}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                >
                  <ScrollText className="w-4 h-4 text-amber-500" />
                  <span>Historial de Versiones (v{CURRENT_APP_VERSION})</span>
                </button>
              </div>

              <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {FAQ_ITEMS.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 text-left py-1 cursor-pointer group"
                      >
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pr-6">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* =================================================================
            SECTION 4: DOWNLOADS (PC / MAC / LINUX + MOBILE PWA GUIDE)
            ================================================================= */}
        {activeSection === 'downloads' && (
          <section className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Instaladores Oficiales
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Descarga Kongre para Escritorio y Dispositivos Móviles
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                Instala la aplicación nativa compilada en Rust para la computadora del Salón del Reino o instala la Web App en tu teléfono iOS o Android.
              </p>
            </div>

            <DesktopCompatibilityBanner
              variant="hero-card"
              onOpenAllDownloads={() => setDesktopModalOpen(true)}
            />

            {/* Mobile Installation Guide (iOS & Android) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      iPhone y iPad (iOS / iPadOS)
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Cómo instalar Kongre en iOS
                    </h3>
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    Abre <strong>kongre-app.com/#portal</strong> desde el navegador <strong>Safari</strong>.
                  </li>
                  <li>
                    Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  </li>
                  <li>
                    Selecciona <strong>«Agregar a la pantalla de inicio»</strong> para usar Kongre en pantalla completa y con soporte offline.
                  </li>
                </ol>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Teléfonos y Tabletas Android
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Cómo instalar Kongre en Android
                    </h3>
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    Abre <strong>kongre-app.com/#portal</strong> en Google Chrome, Brave o Edge.
                  </li>
                  <li>
                    Toca el menú del navegador (tres puntos) y selecciona <strong>«Instalar aplicación»</strong>.
                  </li>
                  <li>
                    El ícono oficial de Kongre aparecerá en tus aplicaciones con acceso sin conexión y notificaciones de asignaciones.
                  </li>
                </ol>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Official Footer */}
      <AppFooter
        variant="landing"
        onOpenVersionModal={onOpenVersionModal}
      />

      <DesktopDownloadModal
        isOpen={desktopModalOpen}
        onClose={() => setDesktopModalOpen(false)}
      />
    </div>
  );
};
