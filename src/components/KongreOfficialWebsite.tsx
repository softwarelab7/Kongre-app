import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CloudOff,
  Download,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  Monitor,
  Moon,
  QrCode,
  Scale,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Wifi,
  Zap,
  Building2,
  Clock,
  Check,
  Terminal,
  Laptop,
} from 'lucide-react';
import Logo from '../Logo';
import { useTheme } from '../context/ThemeContext';
import { CURRENT_APP_VERSION, BUILD_DATE } from '../utils/versionLog';
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

type DocArticleId =
  | 'arquitectura'
  | 'primeros-pasos'
  | 'roles-rbac'
  | 'acceso-publicadores'
  | 'vmc-s89'
  | 'territorios-carritos'
  | 'secretaria-s21'
  | 'seguridad-2fa';

interface DocArticle {
  id: DocArticleId;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  steps: { title: string; detail: string }[];
  tip?: string;
}

const DOC_ARTICLES: DocArticle[] = [
  {
    id: 'arquitectura',
    category: 'Introducción',
    title: '1. ¿Qué es Kongre y cómo funciona en la congregación?',
    summary:
      'Arquitectura híbrida inspirada en las mejores herramientas teocráticas: aplicación nativa de escritorio en Rust + Portal Web y App Móvil PWA.',
    readTime: '3 min',
    steps: [
      {
        title: 'Aplicación para PC y Mac (Cuerpo de Ancianos y Salón del Reino)',
        detail:
          'Los hermanos con privilegios de administración (Coordinador, Secretario, Superintendente de Vida y Ministerio, Siervos de Territorios, Cuentas y Discursos) pueden instalar Kongre en Windows, macOS o Linux, o acceder desde el navegador en kongre-app.com/#portal.',
      },
      {
        title: 'Portal Móvil "Mi Vista" para Publicadores',
        detail:
          'Cada publicador accede desde su teléfono celular mediante su PIN personal o código QR a su calendario de asignaciones S-89, turnos de carritos, territorios digitales asignados, tablero de anuncios y entrega de su informe mensual S-4.',
      },
      {
        title: 'Operación 100% Offline + Sincronización Cifrada',
        detail:
          'Todos los datos se almacenan localmente en una bóveda cifrada (IndexedDB) para trabajar sin internet en el Salón del Reino. Al detectar conexión, Kongre sincroniza automáticamente los cambios entre los ancianos y los publicadores.',
      },
    ],
    tip: 'No necesitas contratar servidores ni configurar bases de datos: al registrar tu congregación, la sincronización en la nube con cifrado de conocimiento cero queda activa al instante.',
  },
  {
    id: 'primeros-pasos',
    category: 'Configuración Inicial',
    title: '2. Primeros pasos: Cómo registrar tu congregación',
    summary:
      'Guía paso a paso para que el Coordinador o el Secretario configure la congregación en menos de 3 minutos.',
    readTime: '4 min',
    steps: [
      {
        title: 'Paso 1: Abre el Portal de Acceso (#portal)',
        detail:
          'Haz clic en el botón "Ir al Portal de Congregación" en la esquina superior derecha y selecciona "Registrar Nueva Congregación".',
      },
      {
        title: 'Paso 2: Datos básicos y horarios de reunión',
        detail:
          'Ingresa el nombre oficial de tu congregación, número o código identificador, circuito, ciudad y los días y horarios de la Reunión de Entre Semana y del Fin de Semana.',
      },
      {
        title: 'Paso 3: Establece el PIN de Congregación y el PIN Maestro',
        detail:
          'Define el PIN general de la congregación (para acceso de lectura a la cartelera) y el PIN Maestro del Coordinador. Guarda tu ID canónico (formato KGR-XXXX-XXXX) para compartirlo con el cuerpo de ancianos.',
      },
      {
        title: 'Paso 4: Importa o agrega el directorio de publicadores',
        detail:
          'En la pestaña "Publicadores", puedes agregar a los hermanos con su grupo de servicio, privilegio (anciano, siervo ministerial, precursor regular/auxiliar) o importar datos existentes desde archivos JSON/CSV compatibles.',
      },
    ],
    tip: 'Puedes probar todo el flujo antes de registrar tu congregación usando el botón "Modo Demo Interactivo", que carga una congregación de ejemplo completa.',
  },
  {
    id: 'roles-rbac',
    category: 'Administración y Seguridad',
    title: '3. Roles Teocráticos y Control de Acceso (RBAC)',
    summary:
      'Cada hermano visualiza y edita únicamente los departamentos correspondientes a su privilegio o asignación.',
    readTime: '5 min',
    steps: [
      {
        title: 'Coordinador del Cuerpo de Ancianos y Secretario',
        detail:
          'Acceso administrativo completo a todos los módulos, gestión de roles y permisos, rotación de claves de seguridad, aprobación de solicitudes de vinculación, tarjetas S-21, informe S-1 a la sucursal y registro de auditoría.',
      },
      {
        title: 'Superintendente de la Reunión Vida y Ministerio (VMC)',
        detail:
          'Acceso de edición a la programación semanal VMC, asignación de consejeros auxiliares, hojas estudiantiles S-89, historial S-38 y tablero de equidad de asignaciones.',
      },
      {
        title: 'Siervos de Departamentos (Territorios, Discursos, Cuentas, Literatura)',
        detail:
          'Permisos específicos por módulo: el Siervo de Territorios administra mapas GPS y registro S-13; el de Discursos coordina oradores y hospitalidad; el de Cuentas gestiona contabilidad mensual; el de Literatura administra el inventario.',
      },
      {
        title: 'Superintendentes de Grupo y Publicadores',
        detail:
          'Los superintendentes de grupo supervisan la asistencia e informes de su grupo de servicio. Los publicadores acceden a "Mi Portal Teocrático" (asignaciones personales, anuncios, cronómetro de predicación e informe mensual).',
      },
    ],
    tip: 'Desde la sección "Roles y Permisos", los ancianos pueden asignar múltiples responsabilidades a un mismo hermano (por ejemplo, Anciano + Superintendente VMC).',
  },
  {
    id: 'acceso-publicadores',
    category: 'Conexión de Hermanos',
    title: '4. Cómo conectar a ancianos, siervos y publicadores',
    summary:
      'Tres métodos de acceso diseñados para que cualquier hermano pueda entrar fácilmente desde su teléfono o PC.',
    readTime: '4 min',
    steps: [
      {
        title: 'Método 1: Código o Enlace QR de Invitación (Recomendado)',
        detail:
          'En la barra superior, abre el gestor de invitaciones o "PINes de Acceso". Genera un enlace directo o código QR para el hermano. Al escanearlo con su celular, Kongre configura su congregación y su perfil automáticamente en un solo toque.',
      },
      {
        title: 'Método 2: ID de Congregación + PIN Personal',
        detail:
          'Cada publicador tiene un PIN personal único de 4 a 6 dígitos en el directorio. En el portal (#portal), el hermano ingresa el ID de la congregación, el PIN de congregación y su PIN personal para abrir directamente sus asignaciones.',
      },
      {
        title: 'Método 3: Cuenta de Google verificada',
        detail:
          'Los ancianos y siervos autorizados pueden iniciar sesión con su correo de Google. Si el correo ya está registrado en el directorio o en la lista de roles, su sesión se vincula automáticamente.',
      },
    ],
    tip: 'Si un hermano pierde su teléfono, los ancianos pueden regenerar o revocar su PIN personal desde "PINes de Acceso", cerrando la sesión anterior de forma inmediata.',
  },
  {
    id: 'vmc-s89',
    category: 'Reuniones y Programación',
    title: '5. Programación Vida y Ministerio (S-140) y Hojas S-89',
    summary:
      'Importación del programa semanal, detección automática de conflictos, motor de equidad y envío de asignaciones S-89.',
    readTime: '5 min',
    steps: [
      {
        title: 'Importación de semanas y temas de la Guía de Actividades',
        detail:
          'En la vista "Vida y Ministerio (CLM)" puedes importar automáticamente las semanas del cuaderno de actividades o editar títulos, tiempos, canciones y sala auxiliar.',
      },
      {
        title: 'Asistente inteligente de asignación sin conflictos',
        detail:
          'Al elegir un estudiante o participante, Kongre muestra cuándo tuvo su última parte, su historial S-38 y alerta en tiempo real si ya tiene otra asignación, acomodador, audio/video o discurso en la misma fecha.',
      },
      {
        title: 'Hojas S-89 por WhatsApp con confirmación en 1 clic y PDF oficial',
        detail:
          'En la pestaña "Hojas S-89", genera el formato oficial S-89 (individual o 4 por página para imprimir) o envía la asignación por WhatsApp con un enlace seguro para que el estudiante confirme de recibido con un toque.',
      },
    ],
    tip: 'Cuando un estudiante confirma su asignación S-89 desde el enlace de WhatsApp, el estado cambia automáticamente a "Confirmado" en el programa del Superintendente VMC.',
  },
  {
    id: 'territorios-carritos',
    category: 'Predicación y Territorios',
    title: '6. Territorios Georreferenciados (S-13) y Carritos',
    summary:
      'Cartografía interactiva con OpenStreetMap/Leaflet, tarjetas digitales QR y turnos de predicación pública.',
    readTime: '4 min',
    steps: [
      {
        title: 'Trazado de polígonos y manzanas en el mapa',
        detail:
          'Dibuja o importa los límites de cada territorio sobre mapas callejeros o satelitales. Clasifica territorios por zona, dificultad y estado (Disponible, Asignado o Atrasado +4 meses).',
      },
      {
        title: 'Tarjeta Digital de Territorio por QR / WhatsApp',
        detail:
          'Comparte la tarjeta digital con el conductor de salida. Desde su teléfono podrá ver su ubicación GPS en tiempo real dentro del polígono del territorio y marcar las manzanas completadas.',
      },
      {
        title: 'Registro oficial S-13 y Turnos de Carritos',
        detail:
          'Todo movimiento de asignación y devolución queda registrado en el historial S-13 listo para exportar en PDF. Además, el módulo de Carritos permite organizar puntos de exhibidores, horarios y parejas de publicadores.',
      },
    ],
  },
  {
    id: 'secretaria-s21',
    category: 'Secretaría y Salón',
    title: '7. Secretaría: Informes S-1, Asistencia S-88 y Tarjetas S-21',
    summary:
      'Consolidación mensual para la sucursal, registro de asistencia a las reuniones y archivo digital S-21.',
    readTime: '4 min',
    steps: [
      {
        title: 'Recopilación de informes mensuales por grupo',
        detail:
          'Los publicadores pueden enviar su participación mensual (predicación, estudios bíblicos y horas de precursor) desde "Mi Portal", o los superintendentes de grupo pueden registrarlos directamente.',
      },
      {
        title: 'Totales para la Sucursal (S-1) y Tarjetas S-21',
        detail:
          'Kongre calcula automáticamente los totales de publicadores activos, precursores auxiliares y regulares para el informe mensual S-1, y actualiza las tarjetas de registro de publicador S-21 exportables en PDF.',
      },
      {
        title: 'Registro S-88 de Asistencia y Modo Tablero del Salón',
        detail:
          'Registra la asistencia semanal de entre semana y fin de semana con promedios automáticos del año de servicio. Activa el "Modo Tablero del Salón" para proyectar la cartelera oficial en el monitor del Salón del Reino.',
      },
    ],
  },
  {
    id: 'seguridad-2fa',
    category: 'Criptografía y Privacidad',
    title: '8. Cifrado Cero Conocimiento (AES-256-GCM) y 2FA TOTP',
    summary:
      'Protección criptográfica de nivel bancario para resguardar la confidencialidad de los datos de la congregación.',
    readTime: '4 min',
    steps: [
      {
        title: 'Cifrado en el dispositivo antes de sincronizar',
        detail:
          'Los datos sensibles se cifran en tu dispositivo usando AES-256-GCM con claves derivadas mediante PBKDF2 (600,000 iteraciones SHA-256) y claves no extraíbles en IndexedDB.',
      },
      {
        title: 'Verificación en Dos Pasos (2FA) con Microsoft / Google Authenticator',
        detail:
          'Desde "Mi Perfil", cualquier anciano o publicador puede activar 2FA TOTP estándar (RFC 6238) con 8 códigos de respaldo de emergencia y opción de recordar dispositivo de confianza por 30 días.',
      },
      {
        title: 'Bloqueo automático por inactividad con PIN',
        detail:
          'Configura el bloqueo automático de sesión (de 1 a 30 minutos) para proteger la pantalla si dejas la computadora o el teléfono desatendido en el Salón del Reino.',
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
  const [selectedDocId, setSelectedDocId] = useState<DocArticleId>('arquitectura');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  const filteredDocs = useMemo(() => {
    const q = docSearchQuery.trim().toLowerCase();
    if (!q) return DOC_ARTICLES;
    return DOC_ARTICLES.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
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
              { id: 'docs' as WebsiteSection, label: 'Documentación', icon: BookOpen },
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
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
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
            { id: 'docs' as WebsiteSection, label: 'Documentación', icon: BookOpen },
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
                      <span>Leer Documentación y Guía</span>
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
                              Manual y Documentación Oficial
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Guías de uso por departamento, seguridad y roles
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
                  onClick={() => setActiveSection('modules')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explorar los 25 módulos en detalle</span>
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

                    <ul className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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

                  <ul className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            SECTION 3: INTERACTIVE DOCUMENTATION & USER GUIDE
            ================================================================= */}
        {activeSection === 'docs' && (
          <section className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Centro de Documentación Oficial
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  Manual de Uso y Administración de Kongre
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Aprende cómo configurar tu congregación, asignar permisos por departamento y conectar a los publicadores.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Buscar en la documentación..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Sidebar: Documentation Topics */}
              <aside className="lg:col-span-4 space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Índice del Manual ({filteredDocs.length})
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
                <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{activeDoc.category}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Lectura de {activeDoc.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeDoc.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeDoc.summary}
                  </p>
                </div>

                <div className="space-y-4">
                  {activeDoc.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeDoc.tip && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-bold">Sugerencia práctica: </strong>
                      {activeDoc.tip}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onOpenVersionModal}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    <ScrollText className="w-4 h-4 text-amber-500" />
                    <span>Ver Registro de Versiones (v{CURRENT_APP_VERSION})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onGoToPortal()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <span>Ir al Portal de Acceso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
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
