// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { PWAInstallButton } from './PWAInstallButton';
import Logo from '../Logo';
import ThemeToggle from './ThemeToggle';
import { AutoLockTimerChip } from './AutoLockTimerChip';
import { getFriendlyCongregationName, isGenericIdentityName, setSecureLocalPin } from '../utils/theocraticSecurity';
import { isTabAllowedForRole } from '../utils/rbac';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { OfflineSyncBadge } from './OfflineSyncBadge';
import { DemoBanner } from './DemoBanner';
import { insertAuditLog } from '../services/auditLogService';
import { NAV_ICONS } from '../NavIcons';
import { DesktopDownloadModal } from './DesktopDownloadModal';
import {
  Calendar,
  Users,
  User,
  AlertTriangle,
  FileText,
  UserCheck,
  Settings,
  Sparkles,
  LogIn,
  LogOut,
  ShieldCheck,
  Shield,
  Brush,
  BarChart3,
  QrCode,
  Timer,
  Mic,
  Tv,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Award,
  Compass,
  MapPin,
  Map,
  FileCheck,
  ClipboardList,
  Bell,
  Briefcase,
  Flame,
  Package,
  Search,
  Check,
  Sun,
  Moon,
  LayoutDashboard,
  Lock,
  KeyRound,
  Building2,
  LayoutGrid,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  Table,
  CreditCard,
  ShoppingBag,
  Coffee,
  Heart,
  BookOpen,
  Landmark,
  Zap,
  Wrench,
  Target,
  FileBarChart,
  Download,
  Monitor,
} from 'lucide-react';

export type ActiveTab =
  | 'inicio'
  | 'panorama_general'
  | 'cronometro_ministerio'
  | 'revisitas'
  | 'estudios_biblicos'
  | 'calendario'
  | 'programacion'
  | 'clm_vmc'
  | 's89'
  | 'publicadores'
  | 'precursores_auxiliares'
  | 'grupos_servicio'
  | 'territorios'
  | 'visita_sc'
  | 'memorial_asambleas'
  | 'discursos'
  | 'hospitalidad'
  | 'carritos'
  | 'asistencia'
  | 'estadisticas_secretaria'
  | 'informe_s1'
  | 'informes_servicio'
  | 'tarjetas_s21'
  | 'cuentas'
  | 'literatura'
  | 'limpieza_deberes'
  | 'panel_electrico'
  | 'mantenimiento'
  | 'tablero_anuncios'
  | 'conflictos'
  | 'equidad'
  | 'exportar_pdf'
  | 'mi_vista'
  | 'perfil'
  | 'ajustes'
  | 'roles'
  | 'menu';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  onOpenConflictsModal: () => void;
  onOpenQrModal?: () => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenSearchModal: () => void;
  onOpenRoleModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenJoinModal?: () => void;
  onOpenInviteManager?: () => void;
  onOpenLinkRequestsModal?: () => void;
  onOpenWelcomeLanding?: () => void;
  onOpenPinsModal?: () => void;
  onOpenAuditLog?: () => void;
  onOpenVersionModal?: () => void;
  onOpenQueueModal?: () => void;
  onOpenRegisterModal?: () => void;
}

interface NavSubItem {
  id: ActiveTab;
  label: string;
  description: string;
  icon: any;
  badge?: number | string;
  badgeColor?: string;
  isQuickTool?: boolean;
}

interface Department {
  id: string;
  title: string;
  shortTitle: string;
  icon: any;
  tabIds: ActiveTab[];
  items: NavSubItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarVisible = true,
  onToggleSidebar,
  onOpenConflictsModal,
  onOpenQrModal,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenSearchModal,
  onOpenRoleModal,
  onOpenThemeModal,
  onOpenJoinModal,
  onOpenInviteManager,
  onOpenLinkRequestsModal,
  onOpenWelcomeLanding,
  onOpenPinsModal,
  onOpenAuditLog,
  onOpenVersionModal,
  onOpenQueueModal,
  onOpenRegisterModal,
}) => {
  const { user, userProfile, signInWithGoogle, signOutUser, activeRole, effectiveRoleInfo, currentBrotherName, isCoordinator, permissions } = useAuth();
  const canManageRoles = !effectiveRoleInfo.isReadOnly && activeRole !== 'publico' && (isCoordinator || activeRole === 'coordinador' || activeRole === 'anciano');
  const {
    settings,
    updateSettings,
    conflicts,
    notices,
    territories,
    accountLinkRequests,
    auxPioneerRequests,
    isOnline,
    isDemoMode,
    loadDemoData,
    exitDemoMode,
  } = useCongregation();

  const handleExitDemo = () => {
    exitDemoMode();
    if (onOpenWelcomeLanding) {
      onOpenWelcomeLanding();
    } else {
      window.location.reload();
    }
  };

  const handleResetDemo = () => {
    loadDemoData();
    window.location.reload();
  };
  const effectiveDisplayName = isDemoMode
    ? (userProfile?.displayName || settings?.coordinatorName || 'Carlos Mendoza (Demo)')
    : currentBrotherName && !isGenericIdentityName(currentBrotherName)
      ? (currentBrotherName as string)
      : userProfile?.displayName && !isGenericIdentityName(userProfile.displayName)
      ? (userProfile!.displayName as string)
      : settings?.coordinatorName && !isGenericIdentityName(settings.coordinatorName)
      ? (settings.coordinatorName as string)
      : user?.displayName && !isGenericIdentityName(user.displayName)
      ? (user.displayName as string)
      : '';
  const pendingRequestsCount = accountLinkRequests.filter((r) => r.status === 'pending').length;
  const handleLogout = async () => {
    try {
      await insertAuditLog({
        accion: 'CIERRE_SESION',
        hermano_nid: user?.email || activeRole || 'usuario',
        hermano_nombre: effectiveDisplayName || user?.displayName || 'Hermano',
        modulo: 'auth',
        detalles: 'Sesión cerrada explícitamente por el usuario; tokens y PIN de sesión limpiados.',
      });
    } catch {}
    try {
      await signOutUser();
    } catch {}
    try {
      localStorage.removeItem('kongre_has_entered_app');
      localStorage.removeItem('kongre_is_registered_congregation');
      localStorage.removeItem('kongre_is_guest');
      localStorage.removeItem('kongre_demo_mode');
      localStorage.removeItem('kongre_user_profile_guest');
      localStorage.removeItem('kongre_user_profile_active');
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem('kongre_current_publisher_id_v2');
      setSecureLocalPin('kongre_session_pin_v2', null);
      localStorage.removeItem('kongre_active_role_v1');
      localStorage.removeItem('kongre_active_roles_v1');
      localStorage.removeItem('kongre_role_session_sig_v1');
      sessionStorage.removeItem('kongre_session_locked');
      sessionStorage.setItem('kongre_show_landing', 'true');
    } catch {}
    if (onOpenWelcomeLanding) {
      onOpenWelcomeLanding();
    } else {
      window.location.reload();
    }
  };
  const pendingAuxPioneersCount = (auxPioneerRequests || []).filter((r) => (r.status || r.estado || 'pendiente') === 'pendiente').length;
  const { themeMode, toggleTheme, isDark, isCabinaMode } = useTheme();
  const { isPinEnabled, lockSession } = useSecurity();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [desktopDownloadOpen, setDesktopDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const overdueTerritoriesCount = territories.filter(
    (t) =>
      t.status === 'vencido' ||
      (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
  ).length;

  const pinnedNoticesCount = notices.filter((n) => n.pinned).length;

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [flyoutStyle, setFlyoutStyle] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTriggerRef = useRef<HTMLElement | null>(null);
  const flyoutRef = useRef<HTMLDivElement | null>(null);

  const calculateFlyoutPos = (triggerEl: HTMLElement, itemCount: number = 4) => {
    const rect = triggerEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const padding = 16;
    // Estimated height: header ~64px, cards in 2 columns ~95px per row, margins ~24px
    const rowCount = Math.ceil(itemCount / 2);
    const estimatedHeight = 64 + rowCount * 95;

    let top = rect.top;
    if (top + estimatedHeight > vh - padding) {
      top = vh - estimatedHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    return {
      top: Math.round(top),
      left: Math.round(rect.right + 10),
    };
  };

  const handleMouseEnterCategory = (catId: string, triggerEl?: HTMLElement | null, itemCount?: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (triggerEl) {
      activeTriggerRef.current = triggerEl;
      setFlyoutStyle(calculateFlyoutPos(triggerEl, itemCount));
    }
    setHoveredCategory(catId);
  };

  const handleMouseLeaveCategory = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 180);
  };

  // Adjust exact measured height once mounted to ensure pixel perfection
  useEffect(() => {
    if (!hoveredCategory || !flyoutRef.current || !activeTriggerRef.current) return;
    const rect = activeTriggerRef.current.getBoundingClientRect();
    const menuHeight = flyoutRef.current.offsetHeight;
    const vh = window.innerHeight;
    const padding = 16;

    let top = rect.top;
    if (top + menuHeight > vh - padding) {
      top = vh - menuHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    setFlyoutStyle({
      top: Math.round(top),
      left: Math.round(rect.right + 10),
    });
  }, [hoveredCategory]);

  useEffect(() => {
    if (!hoveredCategory) return;
    const handleReposition = () => {
      if (!flyoutRef.current || !activeTriggerRef.current) return;
      const rect = activeTriggerRef.current.getBoundingClientRect();
      const menuHeight = flyoutRef.current.offsetHeight;
      const vh = window.innerHeight;
      const padding = 16;

      let top = rect.top;
      if (top + menuHeight > vh - padding) {
        top = vh - menuHeight - padding;
      }
      if (top < padding) {
        top = padding;
      }

      setFlyoutStyle({
        top: Math.round(top),
        left: Math.round(rect.right + 10),
      });
    };

    window.addEventListener('resize', handleReposition);
    return () => window.removeEventListener('resize', handleReposition);
  }, [hoveredCategory]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Full raw departments catalogue
  const allDepartments: Department[] = [
    {
      id: 'ministerio_publicador',
      title: 'Menú Principal • Publicador',
      shortTitle: 'Publicador',
      icon: NAV_ICONS.inicio,
      tabIds: ['inicio', 'cronometro_ministerio', 'revisitas', 'estudios_biblicos', 'mi_vista'],
      items: [
        {
          id: 'inicio',
          label: 'Mi Ministerio (Panel Principal)',
          description: 'Vista principal del publicador con cronómetro, horas, revisitas y estudios',
          icon: NAV_ICONS.inicio,
        },
        {
          id: 'cronometro_ministerio',
          label: 'Cronómetro de Predicación',
          description: 'Llevar el tiempo en vivo, sesiones diarias y meta mensual de horas',
          icon: NAV_ICONS.cronometro_ministerio,
        },
        {
          id: 'revisitas',
          label: 'Revisitas y Personas Interesadas',
          description: 'Agenda de direcciones, temas conversados, preguntas y visitas',
          icon: NAV_ICONS.revisitas,
        },
        {
          id: 'estudios_biblicos',
          label: 'Estudios Bíblicos (Cursos)',
          description: 'Control de estudiantes, lección actual, sesiones del mes y metas',
          icon: NAV_ICONS.estudios_biblicos,
        },
        {
          id: 'mi_vista',
          label: 'Mis Asignaciones y Portal',
          description: 'Confirmar partes en reuniones, informe mensual S-4 y ausencias',
          icon: NAV_ICONS.mi_vista,
        },
      ],
    },
    {
      id: 'panorama',
      title: 'Mi Congregación',
      shortTitle: 'Congregación',
      icon: NAV_ICONS.panorama_general,
      tabIds: ['panorama_general'],
      items: [
        {
          id: 'panorama_general',
          label: 'Mi Congregación y Cartelera',
          description: 'Informe mensual, próximas asignaciones, tablero de anuncios y eventos',
          icon: NAV_ICONS.panorama_general,
        },
      ],
    },
    {
      id: 'reuniones',
      title: 'Reuniones',
      shortTitle: 'Reuniones',
      icon: NAV_ICONS.reuniones,
      tabIds: ['programacion', 's89', 'discursos', 'hospitalidad'],
      items: [
        {
          id: 'programacion',
          label: 'Reunión Entre Semana y Fin de Semana',
          description: 'Vida y Ministerio Cristianos y Fin de Semana en un solo programa',
          icon: NAV_ICONS.programacion,
        },
        {
          id: 's89',
          label: 'Hojas S-89',
          description: 'Hojas de asignación para estudiantes',
          icon: NAV_ICONS.s89,
        },
        {
          id: 'discursos',
          label: 'Discursos Públicos',
          description: 'Catálogo de bosquejos y oradores visitantes',
          icon: NAV_ICONS.discursos,
        },
        {
          id: 'hospitalidad',
          label: 'Hospitalidad de Oradores',
          description: 'Familias anfitrionas y comidas para oradores',
          icon: NAV_ICONS.hospitalidad,
        },
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros',
      shortTitle: 'Secretaría',
      icon: NAV_ICONS.secretaria,
      tabIds: ['estadisticas_secretaria', 'publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1', 'cuentas'],
      items: [
        {
          id: 'estadisticas_secretaria',
          label: 'Resumen de Secretaría y Gráficos',
          description: 'Métricas generales, asistencia, publicadores, precursores y gráficos',
          icon: NAV_ICONS.estadisticas_secretaria,
        },
        {
          id: 'publicadores',
          label: 'Directorio de Publicadores',
          description: 'Privilegios, teléfonos y responsabilidades',
          icon: NAV_ICONS.publicadores,
        },
        {
          id: 'precursores_auxiliares',
          label: 'Precursores Auxiliares',
          description: 'Solicitudes S-205 y aprobación del comité',
          icon: NAV_ICONS.precursores_auxiliares,
          badge: pendingAuxPioneersCount || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'informe_s1',
          label: 'Informe S-1 Sucursal',
          description: 'Consolidación mensual de asistencia y predicación para JW Hub',
          icon: NAV_ICONS.informe_s1,
        },
        {
          id: 'tarjetas_s21',
          label: 'Tarjetas S-21',
          description: 'Registro oficial de publicador de la congregación',
          icon: NAV_ICONS.tarjetas_s21,
        },
        {
          id: 'informes_servicio',
          label: 'Informes S-4',
          description: 'Recolección mensual y resumen para sucursal',
          icon: NAV_ICONS.informes_servicio,
        },
        {
          id: 'asistencia',
          label: 'Asistencia S-88',
          description: 'Registro de asistencia a reuniones y promedios',
          icon: NAV_ICONS.asistencia,
        },
        {
          id: 'cuentas',
          label: 'Cuentas S-26',
          description: 'Registro financiero, donaciones y sucursal',
          icon: NAV_ICONS.cuentas,
        },
      ],
    },
    {
      id: 'predicacion',
      title: 'Predicación',
      shortTitle: 'Predicación',
      icon: NAV_ICONS.predicacion,
      tabIds: ['territorios', 'grupos_servicio', 'carritos', 'literatura'],
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Asignaciones, mapas, vencimientos y no visitas',
          icon: NAV_ICONS.territorios,
          badge: overdueTerritoriesCount || undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'grupos_servicio',
          label: 'Grupos de Servicio',
          description: 'Superintendentes de grupo y lista de familias',
          icon: NAV_ICONS.grupos_servicio,
        },
        {
          id: 'carritos',
          label: 'Carritos de Testimonio',
          description: 'Puntos metropolitanos, turnos y parejas',
          icon: NAV_ICONS.carritos,
        },
        {
          id: 'literatura',
          label: 'Literatura S-14',
          description: 'Inventario de publicaciones, revistas y pedidos',
          icon: NAV_ICONS.literatura,
        },
      ],
    },
    {
      id: 'salon',
      title: 'Salón y Organización',
      shortTitle: 'Salón',
      icon: NAV_ICONS.salon,
      tabIds: ['limpieza_deberes', 'panel_electrico', 'mantenimiento', 'visita_sc', 'memorial_asambleas', 'tablero_anuncios'],
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Servicios de la Congregación',
          description: 'Deberes y turnos (audio, video, micrófonos, acomodadores) y limpieza',
          icon: NAV_ICONS.limpieza_deberes,
        },
        {
          id: 'panel_electrico',
          label: 'Panel Eléctrico',
          description: 'Tablero de breakers, circuitos y control de energía',
          icon: NAV_ICONS.panel_electrico,
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento del Salón',
          description: 'Fichas operativas, plan preventivo y extintores',
          icon: NAV_ICONS.mantenimiento,
        },
        {
          id: 'visita_sc',
          label: 'Visita del SC',
          description: 'Semana del superintendente de circuito y comidas',
          icon: NAV_ICONS.visita_sc,
        },
        {
          id: 'memorial_asambleas',
          label: 'Memorial & Asambleas',
          description: 'Preparativos de Conmemoración y comités',
          icon: NAV_ICONS.memorial_asambleas,
        },
        {
          id: 'tablero_anuncios',
          label: 'Tablero de Anuncios',
          description: 'Cartas, avisos de la congregación y circulares',
          icon: NAV_ICONS.tablero_anuncios,
          badge: pinnedNoticesCount || undefined,
          badgeColor: 'bg-indigo-600 text-white',
        },
      ],
    },
    {
      id: 'supervision',
      title: 'Supervisión & Control',
      shortTitle: 'Supervisión',
      icon: NAV_ICONS.supervision,
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'perfil', 'ajustes', 'roles'],
      items: [
        {
          id: 'conflictos',
          label: 'Centro de Conflictos',
          description: 'Cruces de hermanos, dobles partes o no asignados',
          icon: NAV_ICONS.conflictos,
          badge: conflicts.length || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'equidad',
          label: 'Panel de Equidad',
          description: 'Distribución justa de asignaciones y estadísticas',
          icon: NAV_ICONS.equidad,
        },
        {
          id: 'exportar_pdf',
          label: 'Formatos Oficiales (Local) y PDF',
          description: 'Carga y rellenado 100% local de S-21, S-89, S-140, S-88 y exportación',
          icon: NAV_ICONS.exportar_pdf,
        },
        {
          id: 'perfil',
          label: 'Mi Perfil de Usuario',
          description: 'Foto de perfil, nombre visible y canales de contacto',
          icon: NAV_ICONS.perfil,
        },
        {
          id: 'ajustes',
          label: 'Ajustes de Congregación',
          description: 'Horarios, respaldo y configuración general',
          icon: NAV_ICONS.ajustes,
        },
        {
          id: 'roles',
          label: 'Roles Teocráticos y PINs',
          description: 'Asignación de cargos, PINs personales y acceso por departamentos',
          icon: NAV_ICONS.roles,
        },
      ],
    },
  ];

  // Dynamic role-filtered departments (hide unauthorized tabs and empty departments)
  const departments: Department[] = allDepartments
    .map((dept) => {
      const allowedItems = dept.items.filter((item) =>
        isTabAllowedForRole(effectiveRoleInfo.id, item.id)
      );
      const allowedTabIds = dept.tabIds.filter((tid) =>
        isTabAllowedForRole(effectiveRoleInfo.id, tid)
      );
      return {
        ...dept,
        tabIds: allowedTabIds,
        items: allowedItems,
      };
    })
    .filter((dept) => dept.items.length > 0);

  // Categorías principales teocráticas integradas en la barra lateral con flyout al pasar el puntero
  const rawCategoriesList = [
    {
      id: 'inicio',
      title: 'Menú Principal • Publicador',
      icon: NAV_ICONS.inicio,
      primaryTab: 'inicio' as ActiveTab,
      tabIds: ['inicio', 'cronometro_ministerio', 'revisitas', 'estudios_biblicos'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
      items: allDepartments.find((d) => d.id === 'ministerio_publicador')?.items || [],
    },
    {
      id: 'panorama_general',
      title: 'Mi Congregación',
      icon: NAV_ICONS.panorama_general,
      primaryTab: 'panorama_general' as ActiveTab,
      tabIds: ['panorama_general'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/80 dark:text-violet-400',
      items: allDepartments.find((d) => d.id === 'panorama')?.items || [],
    },
    {
      id: 'reuniones',
      title: 'Reuniones',
      icon: NAV_ICONS.reuniones,
      primaryTab: 'programacion' as ActiveTab,
      tabIds: ['programacion', 's89', 'discursos', 'hospitalidad'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
      items: allDepartments.find((d) => d.id === 'reuniones')?.items || [],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros',
      icon: NAV_ICONS.secretaria,
      primaryTab: 'estadisticas_secretaria' as ActiveTab,
      tabIds: ['estadisticas_secretaria', 'publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1', 'cuentas'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400',
      items: allDepartments.find((d) => d.id === 'secretaria')?.items || [],
    },
    {
      id: 'predicacion',
      title: 'Predicación',
      icon: NAV_ICONS.predicacion,
      primaryTab: 'territorios' as ActiveTab,
      tabIds: ['territorios', 'grupos_servicio', 'carritos', 'literatura'] as ActiveTab[],
      badge: overdueTerritoriesCount || undefined,
      badgeColor: 'bg-rose-500 text-white',
      colorClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400',
      items: allDepartments.find((d) => d.id === 'predicacion')?.items || [],
    },
    {
      id: 'salon',
      title: 'Salón y Organización',
      icon: NAV_ICONS.salon,
      primaryTab: 'limpieza_deberes' as ActiveTab,
      tabIds: ['limpieza_deberes', 'visita_sc', 'memorial_asambleas', 'tablero_anuncios'] as ActiveTab[],
      badge: pinnedNoticesCount || undefined,
      badgeColor: 'bg-indigo-600 text-white',
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400',
      items: allDepartments.find((d) => d.id === 'salon')?.items || [],
    },
    {
      id: 'supervision',
      title: 'Supervisión & Control',
      icon: NAV_ICONS.supervision,
      primaryTab: 'conflictos' as ActiveTab,
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'perfil', 'ajustes', 'roles'] as ActiveTab[],
      badge: conflicts.length || undefined,
      badgeColor: 'bg-amber-500 text-white',
      colorClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400',
      items: allDepartments.find((d) => d.id === 'supervision')?.items || [],
    },
  ];

  const categoriesList = rawCategoriesList
    .map((cat) => {
      const allowedItems = (cat.items || []).filter((item) =>
        isTabAllowedForRole(effectiveRoleInfo.id, item.id)
      );
      const allowedTabIds = cat.tabIds.filter((tid) =>
        isTabAllowedForRole(effectiveRoleInfo.id, tid)
      );
      const primaryTab = isTabAllowedForRole(effectiveRoleInfo.id, cat.primaryTab)
        ? cat.primaryTab
        : (allowedItems[0]?.id || allowedTabIds[0] || 'inicio');
      return {
        ...cat,
        primaryTab,
        tabIds: allowedTabIds,
        items: allowedItems,
      };
    })
    .filter((cat) => cat.id === 'inicio' || cat.id === 'panorama_general' || cat.items.length > 0);

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setOpenDropdown(null);
  };

  const rawCongregationName = getFriendlyCongregationName(settings.congregationName, 'Congregación Central');
  const displayCongregationName = rawCongregationName
    .replace(/\s*\((?:Demostración|Demo|Prueba)\)/gi, '')
    .trim() || 'Congregación Central';

  // Friendly title for the active tab under the congregation name
  const getCurrentTabSubtitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'inicio':
        return 'Mi Ministerio (Publicador)';
      case 'panorama_general':
        return 'Mi Congregación';
      case 'cronometro_ministerio':
        return 'Cronómetro de Predicación';
      case 'revisitas':
        return 'Agenda de Revisitas';
      case 'estudios_biblicos':
        return 'Estudios Bíblicos';
      case 'calendario':
        return 'Calendario de la Congregación';
      case 'programacion':
        return 'Programa de Reuniones';
      case 'asistencia':
        return 'Estadísticas de Asistencia';
      case 'estadisticas_secretaria':
        return 'Resumen de Secretaría y Gráficos';
      case 'informe_s1':
        return 'Informe S-1 Sucursal';
      case 'publicadores':
        return 'Publicadores';
      case 's89':
        return 'Hojas S-89';
      case 'discursos':
        return 'Discursos Públicos';
      case 'territorios':
        return 'Territorios S-13';
      case 'literatura':
        return 'Literatura S-14';
      case 'tablero_anuncios':
        return 'Tablero de Anuncios';
      case 'tarjetas_s21':
        return 'Tarjetas S-21';
      case 'cuentas':
        return 'Cuentas S-26';
      case 'grupos_servicio':
        return 'Grupos de Servicio';
      case 'carritos':
        return 'Predicación Pública (Carritos)';
      case 'limpieza_deberes':
        return 'Servicios de la Congregación';
      case 'panel_electrico':
        return 'Panel Eléctrico y Seguridad';
      case 'mantenimiento':
        return 'Mantenimiento del Salón';
      case 'visita_sc':
        return 'Visita del Superintendente';
      case 'memorial_asambleas':
        return 'Memorial y Asambleas';
      case 'hospitalidad':
        return 'Hospitalidad de Oradores';
      case 'precursores_auxiliares':
        return 'Precursores Auxiliares';
      case 'informes_servicio':
        return 'Informes S-4';
      case 'conflictos':
        return 'Centro de Conflictos';
      case 'equidad':
        return 'Panel de Equidad';
      case 'exportar_pdf':
        return 'Formatos Oficiales y PDF';
      case 'mi_vista':
        return 'Mis Asignaciones y Portal';
      case 'clm_vmc':
        return 'Vida y Ministerio Cristianos';
      case 'perfil':
        return 'Mi Perfil';
      case 'ajustes':
        return 'Ajustes de la Congregación';
      case 'roles':
        return 'Roles Teocráticos y PINs';
      case 'menu':
        return 'Menú y Departamentos';
      default:
        return 'Kongre';
    }
  };

  return (
    <>
      {/* =========================================================================
          1. SLIM LEFT VERTICAL SIDEBAR (DESKTOP / TABLET - CATEGORIES & FLYOUT)
         ========================================================================= */}
      {isSidebarVisible && (
        <aside
          aria-label="Barra lateral de navegación por departamentos"
          className="hidden md:flex flex-col items-center fixed left-0 top-0 bottom-0 w-16 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 py-3 select-none transition-all duration-200 overflow-visible"
        >
          {/* Top Brand Squircle Logo Button */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            aria-label="Ir al inicio - Mi Ministerio"
            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 mb-4 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 rounded-2xl"
            title="Kongre - Mi Ministerio"
          >
            <Logo variant="isotipo" className="w-10 h-10 object-contain shadow-xs hover:shadow-md transition-shadow" />
          </button>

          {/* Vertical Categories Stack */}
          <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-visible py-1">
            {categoriesList.map((cat, idx) => {
              const Icon = cat.icon;
              const isCatActive = cat.tabIds.includes(activeTab);
              const isHovered = hoveredCategory === cat.id;
              const hasSubItems = cat.items && cat.items.length > 0;
              return (
                <div
                  key={cat.id}
                  className="relative w-full flex justify-center"
                  onMouseEnter={(e) => handleMouseEnterCategory(cat.id, e.currentTarget, cat.items.length)}
                  onMouseLeave={handleMouseLeaveCategory}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectTab(cat.primaryTab);
                      setHoveredCategory(null);
                    }}
                    aria-label={cat.title}
                    aria-current={isCatActive ? 'page' : undefined}
                    aria-expanded={hasSubItems ? isHovered : undefined}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isCatActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-2xs'
                        : isHovered
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                        : 'text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                    title={cat.title}
                  >
                    <Icon className="w-4 h-4 stroke-[1.8]" />

                    {/* Badge count indicator */}
                    {cat.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                    )}

                    {/* Active Accent Indicator */}
                    {isCatActive && (
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-400 pointer-events-none" />
                    )}
                  </button>

                  {/* Flyout Submenu Panel (Opens when pointer hovers over category) */}
                  {isHovered && hasSubItems && (
                    <div
                      ref={flyoutRef}
                      onMouseEnter={() => handleMouseEnterCategory(cat.id)}
                      onMouseLeave={handleMouseLeaveCategory}
                      style={{
                        top: flyoutStyle ? `${flyoutStyle.top}px` : '12px',
                        left: flyoutStyle ? `${flyoutStyle.left}px` : '74px',
                        maxHeight: 'calc(100vh - 24px)',
                      }}
                      className="fixed w-[520px] max-w-[calc(100vw-88px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
                    >
                      {/* Invisible hover bridge to prevent pointer exit */}
                      <div className="absolute -left-4 top-0 bottom-0 w-4 bg-transparent" />

                      {/* Header */}
                      <div className="px-3.5 py-2.5 mb-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${cat.colorClass} flex items-center justify-center font-bold shadow-2xs`}>
                            <Icon className="w-4 h-4 stroke-[2]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                              {cat.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {cat.items.length} módulos disponibles
                            </span>
                          </div>
                        </div>
                        {cat.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeColor || 'bg-amber-500 text-white'} animate-pulse`}>
                            {cat.badge}
                          </span>
                        )}
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-2 gap-2.5 p-0.5 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
                        {cat.items.map((sub, itemIdx) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeTab === sub.id;
                          const isLastOdd = cat.items.length % 2 !== 0 && itemIdx === cat.items.length - 1;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                handleSelectTab(sub.id);
                                setHoveredCategory(null);
                              }}
                              aria-label={`${sub.label}: ${sub.description}`}
                              aria-current={isSubActive ? 'page' : undefined}
                              className={`group relative p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                                isLastOdd ? 'col-span-2' : ''
                              } ${
                                isSubActive
                                  ? 'bg-gradient-to-br from-indigo-50/90 to-violet-50/60 dark:from-indigo-950/70 dark:to-violet-950/40 border-indigo-500/80 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                                  : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 w-full">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 ${
                                    isSubActive
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/70 dark:group-hover:text-indigo-400 border border-slate-200/60 dark:border-slate-600/40 shadow-2xs'
                                  }`}
                                >
                                  <SubIcon className="w-4 h-4 stroke-[2]" />
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isSubActive && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-600 text-white shadow-2xs">
                                      Activo
                                    </span>
                                  )}
                                  {Boolean(sub.badge) && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                        sub.badgeColor || 'bg-amber-500 text-white'
                                      }`}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${
                                      isSubActive
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-300 dark:text-slate-600 group-hover:text-indigo-500'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="mt-2.5 w-full">
                                <h5
                                  className={`text-xs font-bold leading-snug line-clamp-1 transition-colors ${
                                    isSubActive
                                      ? 'text-indigo-950 dark:text-indigo-200'
                                      : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                  }`}
                                >
                                  {sub.label}
                                </h5>
                                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                  {sub.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fallback Tooltip for items without submenu */}
                  {isHovered && !hasSubItems && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium whitespace-nowrap z-50 shadow-lg pointer-events-none">
                      {cat.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Quick Settings, Profile & Sidebar Collapse Button */}
          <div className="mt-auto pt-2 flex flex-col items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 w-full shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('perfil')}
              aria-label="Mi Perfil y Contacto"
              aria-current={activeTab === 'perfil' ? 'page' : undefined}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/60 shadow-2xs'
                  : 'text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Mi Perfil y Contacto"
            >
              <User className="w-4 h-4 stroke-[1.8]" />
            </button>
            {isTabAllowedForRole(effectiveRoleInfo.id, 'ajustes') && (
              <button
                type="button"
                onClick={() => handleSelectTab('ajustes')}
                aria-label="Ajustes de la Congregación"
                aria-current={activeTab === 'ajustes' ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'ajustes'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/60 shadow-2xs'
                    : 'text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                title="Ajustes de la Congregación"
              >
                <Settings className="w-4 h-4 stroke-[1.8]" />
              </button>
            )}

            {/* Botón integrado directamente en la barra lateral para ocultarla */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Ocultar barra lateral"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer group"
                title="Ocultar barra lateral (Ctrl+B / ⌘B)"
              >
                <PanelLeftClose className="w-4 h-4 stroke-[1.8] group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {onOpenVersionModal && (
              <button
                type="button"
                onClick={onOpenVersionModal}
                aria-label={`Versión actual Kongre v${CURRENT_APP_VERSION} (Alfa), ver historial de versiones`}
                className="flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-mono font-bold text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer select-none"
                title={`Kongre v${CURRENT_APP_VERSION} (Alfa) - Clic para ver historial de versiones y cambios`}
              >
                <span>v{CURRENT_APP_VERSION}</span>
                <span className="px-1 py-0.2 rounded text-[8px] font-sans font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                  Alfa
                </span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* =========================================================================
          2. TOP HEADER BAR (EXACT REFERENCE DESIGN)
         ========================================================================= */}
      <header className={`sticky top-0 z-30 w-full ${isSidebarVisible ? 'md:pl-16' : 'pl-0'} pt-[env(safe-area-inset-top,0px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-200`}>
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 lg:px-8 2xl:px-12 gap-3">
          {/* 1. LEFT: Sidebar Toggle & Structured Breadcrumb Context */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Móvil (< md): Botón Volver cuando está en Menú, o Logo directo al Inicio */}
            <button
              type="button"
              onClick={() => handleSelectTab('inicio')}
              aria-label={activeTab === 'menu' ? 'Volver a Mi Ministerio' : 'Ir a Mi Ministerio'}
              title={activeTab === 'menu' ? 'Volver a Mi Ministerio' : 'Kongre - Mi Ministerio'}
              className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-indigo-600 text-white border border-indigo-600 shadow-2xs'
                  : 'bg-transparent'
              }`}
            >
              {activeTab === 'menu' ? (
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Logo variant="isotipo" className="w-8 h-8 object-contain" />
              )}
            </button>

            {/* Desktop cuando la barra lateral está oculta (!isSidebarVisible): Botón destacado para mostrarla + Logo */}
            {!isSidebarVisible && (
              <div className="hidden md:flex items-center gap-2 shrink-0">
                {onToggleSidebar && (
                  <button
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label="Mostrar barra lateral"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs group"
                    title="Mostrar barra lateral (Ctrl+B / ⌘B)"
                  >
                    <PanelLeftOpen className="w-4 h-4 stroke-[2] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSelectTab('inicio')}
                  aria-label="Ir al inicio - Mi Ministerio"
                  className="shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  title="Kongre - Mi Ministerio"
                >
                  <Logo variant="isotipo" className="w-7 h-7 object-contain" />
                </button>
              </div>
            )}

            {/* Congregation title & active module breadcrumb */}
            <div className="min-w-0 flex items-center gap-1.5 sm:gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => handleSelectTab('panorama_general')}
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-sm font-medium sm:font-bold text-slate-500 sm:text-slate-800 dark:text-slate-400 sm:dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 leading-tight truncate transition-colors cursor-pointer text-left"
                  title="Ir a Mi Congregación"
                >
                  <Building2 className="hidden lg:inline-block w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{displayCongregationName}</span>
                </button>

                <ChevronRight className="hidden sm:inline-block w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />

                <div className="inline-flex items-center gap-1.5 min-w-0">
                  {(() => {
                    const ActiveModIcon = NAV_ICONS[activeTab] || Compass;
                    return (
                      <span className="hidden md:inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shrink-0">
                        <ActiveModIcon className="w-3.5 h-3.5 stroke-[2]" />
                      </span>
                    );
                  })()}
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-[13px] leading-tight truncate">
                    {getCurrentTabSubtitle(activeTab)}
                  </span>
                </div>
              </div>

              {/* Demo Mode Badge placed cleanly after the breadcrumb */}
              {isDemoMode && (
                <div className="shrink-0 inline-flex">
                  <DemoBanner
                    onOpenRoleModal={onOpenRoleModal}
                    onOpenRegisterModal={onOpenRegisterModal}
                    onExitDemo={handleExitDemo}
                    onResetDemo={handleResetDemo}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. CENTER: Desktop Command Search Bar (md+) */}
          <div className="hidden md:flex items-center justify-center shrink-0">
            <button
              type="button"
              onClick={onOpenSearchModal}
              aria-label="Buscar en la congregación (Ctrl+K)"
              title="Buscar publicador, semana o módulo (Ctrl+K / ⌘K)"
              className="h-9 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-500/50 text-slate-500 dark:text-slate-400 flex items-center justify-between gap-3 w-48 lg:w-64 xl:w-72 transition-all cursor-pointer group shadow-2xs"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                <span className="text-xs font-medium truncate group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  Buscar en congregación...
                </span>
              </span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-700 shrink-0">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* 3. RIGHT: Harmonized Quick Actions, Unified Utility Dock & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile-only Search Button (< md) */}
            <button
              type="button"
              onClick={onOpenSearchModal}
              aria-label="Buscar en la congregación"
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Buscar en la congregación"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Status indicators (AutoLock & Offline Sync Queue) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <AutoLockTimerChip />
              {!isDemoMode && onOpenQueueModal && (
                <OfflineSyncBadge
                  isOnline={isOnline}
                  onOpenQueueModal={onOpenQueueModal}
                />
              )}
            </div>

            {/* Unified System Utility Dock (sm+): Todos solo icono (Calendario, Publicadores, QR, PINs, Alertas, Tema) */}
            <div className="hidden sm:flex items-center gap-0.5 p-1 h-9 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 shadow-2xs">
              {/* Calendario Quick Access (Solo icono) */}
              <button
                type="button"
                onClick={() => handleSelectTab('calendario')}
                aria-label="Calendario de la Congregación"
                aria-current={activeTab === 'calendario' ? 'page' : undefined}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'calendario'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                }`}
                title="Calendario de la Congregación"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>

              {/* Publicadores Quick Access */}
              {isTabAllowedForRole(effectiveRoleInfo.id, 'publicadores') && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('publicadores')}
                  aria-label="Catálogo y Directorio de Publicadores"
                  aria-current={activeTab === 'publicadores' ? 'page' : undefined}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === 'publicadores'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                      : 'text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                  }`}
                  title="Directorio de Publicadores"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
              )}

              {/* App Móvil / QR Icon */}
              {onOpenQrModal ? (
                <button
                  type="button"
                  onClick={onOpenQrModal}
                  aria-label="App Móvil y Código QR"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition-all cursor-pointer"
                  title="App Móvil y Código QR"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center">
                  <PWAInstallButton />
                </div>
              )}

              {/* PINs Directory Quick Access */}
              {onOpenPinsModal && (
                <button
                  type="button"
                  onClick={onOpenPinsModal}
                  aria-label="Directorio de PINs de los Publicadores y la Congregación"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition-all cursor-pointer"
                  title="Directorio de PINs y Accesos"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Bell Notifications / Conflicts */}
              <button
                type="button"
                onClick={onOpenConflictsModal}
                aria-label={`Notificaciones y cruces de horario${conflicts.length > 0 ? ` (${conflicts.length} alertas)` : ''}`}
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'conflictos'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : conflicts.length > 0
                    ? 'text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                    : 'text-slate-500 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                }`}
                title={conflicts.length > 0 ? `Notificaciones y Cruces (${conflicts.length} alertas)` : 'Notificaciones y Cruces'}
              >
                <Bell className="w-3.5 h-3.5" />
                {conflicts.length > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-white dark:ring-slate-800 animate-pulse" />
                )}
              </button>

              {/* Dark Mode Moon / Sun Toggle Integrated in Dock */}
              <div className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition-all">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} size={26} />
              </div>
            </div>

            {/* Mobile-only Theme Toggle (< sm) */}
            <div className="flex sm:hidden items-center">
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} size={30} />
            </div>

            {/* Cluster C: User Profile Capsule & Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown((prev) => (prev === 'user' ? null : 'user'));
                }}
                aria-label="Menú de cuenta, perfil y cerrar sesión"
                aria-expanded={openDropdown === 'user'}
                className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 pl-1 pr-1.5 sm:pl-1.5 sm:pr-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all cursor-pointer shadow-2xs"
                title="Mi Perfil, Cuenta y Cerrar Sesión"
              >
                <div className="w-6 h-6 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-[11px] shadow-2xs overflow-hidden shrink-0">
                  {(() => {
                    const effectiveAvatar = isDemoMode
                      ? userProfile?.photoURL || null
                      : userProfile?.photoURL ||
                        user?.photoURL ||
                        settings?.coordinatorPhotoURL ||
                        (typeof window !== 'undefined'
                          ? localStorage.getItem('kongre_user_photo') ||
                            localStorage.getItem('kongre_google_photo') ||
                            localStorage.getItem('kongre_coordinator_photo')
                          : null);

                    if (effectiveAvatar) {
                      return (
                        <img
                          src={effectiveAvatar}
                          alt="Usuario"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      );
                    }

                    return (
                      <span>
                        {(effectiveDisplayName || user?.email || 'H').charAt(0).toUpperCase()}
                      </span>
                    );
                  })()}
                </div>
                <span className="hidden md:inline-block max-w-[110px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200 text-left">
                  {effectiveDisplayName?.split(' ')[0] || 'Mi Cuenta'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-300 shrink-0 transition-transform duration-150 ${
                    openDropdown === 'user' ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                />
              </button>

              {/* Redesigned User Profile Panel Popover (Mobile & Desktop) */}
              {openDropdown === 'user' && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Identity Header Card */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden shrink-0">
                      {(() => {
                        const effectiveAvatar = isDemoMode
                          ? userProfile?.photoURL || null
                          : userProfile?.photoURL ||
                            user?.photoURL ||
                            settings?.coordinatorPhotoURL ||
                            (typeof window !== 'undefined'
                              ? localStorage.getItem('kongre_user_photo') ||
                                localStorage.getItem('kongre_google_photo') ||
                                localStorage.getItem('kongre_coordinator_photo')
                              : null);

                        if (effectiveAvatar) {
                          return (
                            <img
                              src={effectiveAvatar}
                              alt="Usuario"
                              className="w-full h-full object-cover"
                            />
                          );
                        }

                        return (
                          <span>
                            {(effectiveDisplayName || user?.email || 'H').charAt(0).toUpperCase()}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {effectiveDisplayName || 'Usuario'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user?.email || displayCongregationName}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span className="truncate">{effectiveRoleInfo?.name || 'Publicador'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column Quick Access Cards */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('perfil');
                      }}
                      className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        activeTab === 'perfil'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <span className="block text-xs font-bold leading-tight">Mi Perfil</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Cuenta y avisos</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('mi_vista');
                      }}
                      className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        activeTab === 'mi_vista'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="block text-xs font-bold leading-tight">Mi Portal</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">Partes e informe</span>
                      </div>
                    </button>
                  </div>

                  {/* Management & Security Links */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('roles');
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{canManageRoles ? 'Roles y Permisos' : 'Cambiar Rol / PIN'}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {isTabAllowedForRole(effectiveRoleInfo.id, 'ajustes') && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleSelectTab('ajustes');
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="truncate">Ajustes de la Congregación</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {permissions.canViewAuditLog && onOpenAuditLog && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenAuditLog();
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="truncate">Registro de Auditoría</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {!isDemoMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          lockSession();
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">Bloquear Sesión con PIN</span>
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        setDesktopDownloadOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 rounded-xl transition cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Monitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">Descargar Kongre App</span>
                      </span>
                      <Download className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    </button>

                    {/* Theme Selector Row */}
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                        {isDark ? (
                          <Moon className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Tema</span>
                      </span>
                      <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDark) toggleTheme();
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            !isDark
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-200'
                          }`}
                        >
                          Claro
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isDark) toggleTheme();
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-700 text-white shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Oscuro
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Version & Sign Out */}
                  <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 flex items-center justify-between gap-2">
                    {onOpenVersionModal ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenVersionModal();
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <span>Kongre App v{CURRENT_APP_VERSION}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          Alfa
                        </span>
                      </button>
                    ) : (
                      <span className="px-2 text-[10px] font-mono text-slate-400">
                        v{CURRENT_APP_VERSION} (Alfa)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleLogout();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          4. ERGONOMIC MOBILE BOTTOM NAVIGATION BAR (< md)
         ========================================================================= */}
      <nav
        aria-label="Navegación Móvil Principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[calc(env(safe-area-inset-bottom,0px)+4px)] pt-1.5 px-2 select-none"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto gap-1">
          {/* 1. Ministerio (Menú Principal del Publicador) */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            aria-label="Ir a Mi Ministerio"
            aria-current={activeTab === 'inicio' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'inicio' ||
              activeTab === 'cronometro_ministerio' ||
              activeTab === 'revisitas' ||
              activeTab === 'estudios_biblicos'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5 stroke-[2]" />
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Ministerio</span>
          </button>

          {/* 2. Mi Congregación (Informe, próximos privilegios, anuncios y eventos) */}
          <button
            type="button"
            onClick={() => handleSelectTab('panorama_general')}
            aria-label="Ir a Mi Congregación"
            aria-current={activeTab === 'panorama_general' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'panorama_general'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5 stroke-[2]" />
              {conflicts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Congregación</span>
          </button>

          {/* 3. Reuniones (Programación) */}
          <button
            type="button"
            onClick={() => handleSelectTab('programacion')}
            aria-label="Ir a Programación de Reuniones"
            aria-current={activeTab === 'programacion' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'programacion' || activeTab === 'clm_vmc' || activeTab === 's89' || activeTab === 'discursos' || activeTab === 'hospitalidad'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5 stroke-[2]" />
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Reuniones</span>
          </button>

          {/* 4. Calendario */}
          <button
            type="button"
            onClick={() => handleSelectTab('calendario')}
            aria-label="Ir a Calendario de la Congregación"
            aria-current={activeTab === 'calendario' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'calendario'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Calendar className="w-5 h-5 stroke-[2]" />
              {activeTab === 'calendario' && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Calendario</span>
          </button>

          {/* 5. Menú (Abre/Cierra Bottom Sheet ergonómico de una sola mano) */}
          <button
            type="button"
            onClick={() => handleSelectTab('menu')}
            aria-label="Ir al Menú completo de la congregación"
            aria-current={activeTab === 'menu' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'menu'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5 stroke-[2]" />
              {activeTab !== 'menu' && (pendingRequestsCount > 0 || pinnedNoticesCount > 0 || overdueTerritoriesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">
              Menú
            </span>
          </button>
        </div>
      </nav>

      <DesktopDownloadModal
        isOpen={desktopDownloadOpen}
        onClose={() => setDesktopDownloadOpen(false)}
      />
    </>
  );
};
