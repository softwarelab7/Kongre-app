// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { PWAInstallButton } from './PWAInstallButton';
import { KongreLogo } from './KongreLogo';
import Logo from '../Logo';
import ThemeToggle from './ThemeToggle';
import { getFriendlyCongregationName, isGenericIdentityName } from '../utils/theocraticSecurity';
import { isTabAllowedForRole } from '../utils/rbac';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { OfflineSyncBadge } from './OfflineSyncBadge';
import { DemoBanner } from './DemoBanner';
import { insertAuditLog } from '../services/auditLogService';
import { NAV_ICONS } from '../NavIcons';
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
  | 'roles';

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
      localStorage.removeItem('kongre_session_pin_v2');
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [drawerCategory, setDrawerCategory] = useState<string>('all');
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDeptCollapse = (deptId: string) => {
    setCollapsedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

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

  // Gestos táctiles (Swipe) para abrir y cerrar el menú lateral en dispositivos móviles
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let isTrackingSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth >= 768) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      if (!isMobileMenuOpen) {
        // Solo iniciar gesto de apertura si el toque se origina en el borde izquierdo (<= 45px)
        if (touchStartX <= 45) {
          isTrackingSwipe = true;
        } else {
          isTrackingSwipe = false;
        }
      } else {
        // Menú abierto: rastrear swipe hacia la izquierda en el panel o backdrop
        isTrackingSwipe = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingSwipe || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (!isMobileMenuOpen) {
        // Deslizar desde el borde izquierdo hacia la derecha para abrir (> 45px)
        if (deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          setIsMobileMenuOpen(true);
          isTrackingSwipe = false;
        }
      } else {
        // Deslizar hacia la izquierda para cerrar (<-45px)
        if (deltaX < -45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          setIsMobileMenuOpen(false);
          setDrawerSearch('');
          isTrackingSwipe = false;
        }
      }
    };

    const handleTouchEnd = () => {
      isTrackingSwipe = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobileMenuOpen]);

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
      title: 'Panorama General',
      shortTitle: 'Panorama',
      icon: NAV_ICONS.panorama_general,
      tabIds: ['panorama_general'],
      items: [
        {
          id: 'panorama_general',
          label: 'Panorama General de la Congregación',
          description: 'Estadísticas generales, asistencia, publicadores, precursores y gráficos',
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
      tabIds: ['publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1', 'cuentas'],
      items: [
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
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'perfil', 'ajustes', 'roles'],
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
          id: 'mi_vista',
          label: 'Portal del Publicador',
          description: 'Asignaciones, informe mensual S-4 y ausencias con PIN personal',
          icon: NAV_ICONS.mi_vista,
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
      title: 'Panorama General',
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
      primaryTab: 'publicadores' as ActiveTab,
      tabIds: ['publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1', 'cuentas'] as ActiveTab[],
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
    setIsMobileMenuOpen(false);
  };

  const displayCongregationName = getFriendlyCongregationName(settings.congregationName, 'Congregación Central');

  // Friendly title for the active tab under the congregation name
  const getCurrentTabSubtitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'inicio':
        return 'Mi Ministerio (Publicador)';
      case 'panorama_general':
        return 'Panorama General';
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
        return 'Estadísticas';
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
        return 'Carritos';
      case 'limpieza_deberes':
        return 'Servicios de la Congregación';
      case 'visita_sc':
        return 'Visita del SC';
      case 'perfil':
        return 'Mi Perfil';
      case 'ajustes':
        return 'Ajustes de la Congregación';
      case 'roles':
        return 'Roles Teocráticos y PINs';
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
        <aside className="hidden md:flex flex-col items-center fixed left-0 top-0 bottom-0 w-16 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 py-3 select-none transition-all duration-200 overflow-visible">
          {/* Top Brand Squircle Logo Button */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 mb-4 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 rounded-2xl"
            title="Kongre - Panorama General"
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isCatActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 shadow-2xs'
                        : isHovered
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                    title={cat.title}
                  >
                    <Icon className="w-4 h-4 stroke-[1.8]" />

                    {/* Badge count indicator */}
                    {cat.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                    )}

                    {/* Active Chevron Indicator Badge (matching reference design) */}
                    {isCatActive && (
                      <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 shadow-xs z-20 pointer-events-none">
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
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

          {/* Bottom Quick Settings & Profile */}
          <div className="mt-auto pt-2 flex flex-col items-center gap-2 border-t border-slate-100 dark:border-slate-800 w-full shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('perfil')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/60 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Mi Perfil y Contacto"
            >
              <User className="w-4 h-4 stroke-[1.8]" />
            </button>
            {isTabAllowedForRole(effectiveRoleInfo.id, 'ajustes') && (
              <button
                type="button"
                onClick={() => handleSelectTab('ajustes')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'ajustes'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/60 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                title="Ajustes de la Congregación"
              >
                <Settings className="w-4 h-4 stroke-[1.8]" />
              </button>
            )}

            {onOpenVersionModal && (
              <button
                type="button"
                onClick={onOpenVersionModal}
                className="px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-mono font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer select-none"
                title={`Kongre v${CURRENT_APP_VERSION} - Clic para ver historial de versiones y cambios`}
              >
                v{CURRENT_APP_VERSION}
              </button>
            )}
          </div>
        </aside>
      )}

      {/* =========================================================================
          2. TOP HEADER BAR (EXACT REFERENCE DESIGN)
         ========================================================================= */}
      <header className={`sticky top-0 z-30 w-full ${isSidebarVisible ? 'md:pl-16' : 'pl-0'} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-all duration-200`}>
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 lg:px-8 2xl:px-12 gap-2">
          {/* Left: Panel Toggle & Congregation Name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Sidebar toggle button (collapses/expands on desktop, opens drawer on mobile) */}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileMenuOpen((prev) => !prev);
                } else if (onToggleSidebar) {
                  onToggleSidebar();
                }
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0 active:scale-95"
              title={isSidebarVisible ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* If desktop sidebar is collapsed: show brand logo button */}
            {!isSidebarVisible && (
              <button
                type="button"
                onClick={() => handleSelectTab('inicio')}
                className="shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 hidden md:block"
                title="Kongre - Panorama General"
              >
                <Logo variant="isotipo" className="w-7 h-7 object-contain" />
              </button>
            )}

            {/* Browser Back / Forward Controls (hidden on mobile where native swipe gestures apply) */}
            <div className="hidden sm:flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Atrás (Navegador)"
                aria-label="Atrás"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => window.history.forward()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Adelante (Navegador)"
                aria-label="Adelante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Congregation title & breadcrumb navigation */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {displayCongregationName}
                </h1>
                {isDemoMode && (
                  <div className="shrink-0">
                    <DemoBanner
                      onOpenRoleModal={onOpenRoleModal}
                      onOpenRegisterModal={onOpenRegisterModal}
                      onExitDemo={handleExitDemo}
                      onResetDemo={handleResetDemo}
                    />
                  </div>
                )}
                <span className="text-slate-300 dark:text-slate-600 font-normal hidden sm:inline">/</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate hidden sm:inline text-xs">
                  {getCurrentTabSubtitle(activeTab)}
                </span>
              </div>
              <p className="text-[10.5px] text-indigo-600/90 dark:text-indigo-400/90 font-semibold sm:hidden truncate mt-0.5 leading-tight">
                {getCurrentTabSubtitle(activeTab)}
              </p>
            </div>
          </div>

          {/* Right: Clean, Organized Utility Icons & User Menu */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            {/* Search Icon */}
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Buscar en la congregación (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Publicadores Quick Access (desktop / tablet) */}
            {isTabAllowedForRole(effectiveRoleInfo.id, 'publicadores') && (
              <button
                type="button"
                onClick={() => handleSelectTab('publicadores')}
                className={`w-9 h-9 rounded-xl hidden sm:flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'publicadores'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Catálogo y Directorio de Publicadores"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

            {/* Calendario Fijo en Barra Superior (PC / Desktop) */}
            <button
              type="button"
              onClick={() => handleSelectTab('calendario')}
              className={`h-9 px-2.5 rounded-xl hidden md:flex items-center gap-1.5 transition-all cursor-pointer text-xs font-semibold ${
                activeTab === 'calendario'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200/60 dark:border-slate-700/60'
              }`}
              title="Calendario de la Congregación (Fijo)"
            >
              <Calendar className="w-4 h-4" />
              <span>Calendario</span>
            </button>

            {/* App Móvil / QR Icon (desktop / tablet) */}
            {onOpenQrModal ? (
              <button
                type="button"
                onClick={onOpenQrModal}
                className="w-9 h-9 rounded-xl hidden sm:flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="App Móvil y Código QR"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            ) : (
              <div className="hidden lg:flex items-center">
                <PWAInstallButton />
              </div>
            )}

            {/* PINs Directory Quick Access (desktop / tablet) */}
            {onOpenPinsModal && (
              <button
                type="button"
                onClick={onOpenPinsModal}
                className="w-9 h-9 rounded-xl hidden sm:flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 transition cursor-pointer"
                title="Directorio de PINs de los Publicadores y la Congregación"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}

            {/* Bell Notifications with amber dot */}
            <button
              type="button"
              onClick={onOpenConflictsModal}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-amber-500 hover:text-amber-600 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 transition cursor-pointer"
              title="Notificaciones & Cruces"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </button>

            {/* Unified Cloud & Offline Sync Badge (Supabase & IndexedDB) */}
            {onOpenQueueModal && !isDemoMode && (
              <OfflineSyncBadge
                isOnline={isOnline}
                onOpenQueueModal={onOpenQueueModal}
              />
            )}

            {/* Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Dark Mode Moon / Sun / Cabina Toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} size={34} />

            {/* Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* User Profile Capsule & Dropdown Menu */}
            <div className="relative ml-0.5" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'user' ? null : 'user'))}
                className="flex items-center gap-2 p-1 pl-1 pr-1.5 sm:pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition cursor-pointer"
                title="Menú de cuenta y perfil"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-xs overflow-hidden ring-2 ring-indigo-500/20">
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
                <span className="hidden xl:inline-block max-w-[100px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200 text-left">
                  {effectiveDisplayName?.split(' ')[0] || 'Mi Cuenta'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
              </button>

              {/* Dropdown Menu Modal */}
              {openDropdown === 'user' && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {effectiveDisplayName || 'Usuario'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {user?.email || (settings?.coordinatorName ? 'Coordinador' : 'Usuario')}
                    </p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('perfil');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>Mi Perfil</span>
                    </button>

                    {isTabAllowedForRole(effectiveRoleInfo.id, 'ajustes') && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleSelectTab('ajustes');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                      >
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <span>Ajustes de la Congregación</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('roles');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer text-left ${
                        activeRole === 'publico'
                          ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100'
                          : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{canManageRoles ? 'Roles Teocráticos y PINs' : '🔑 Activar Rol / Ingresar PIN'}</span>
                    </button>

                    {permissions.canViewAuditLog && onOpenAuditLog && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenAuditLog();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition cursor-pointer text-left"
                      >
                        <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Registro de Auditoría</span>
                      </button>
                    )}

                    {!isDemoMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          lockSession();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer text-left"
                      >
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Bloquear Sesión con PIN</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sensor táctil del borde izquierdo en móvil para facilitar el gesto de apertura (swipe-to-open) */}
      {!isMobileMenuOpen && (
        <div
          aria-hidden="true"
          className="md:hidden fixed left-0 top-14 bottom-16 w-5 z-20 pointer-events-auto touch-pan-y"
          title="Desliza desde el borde izquierdo para abrir el menú"
        />
      )}

      {/* =========================================================================
          3. FULL SLIDE-OVER DRAWER (STRICTLY MOBILE ONLY: md:hidden)
         ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setDrawerSearch('');
            }}
          />

          {/* Drawer content with slide-in animation */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-left duration-200 ease-out">
            {/* Tirador visual para deslizar o tocar hacia la izquierda para cerrar */}
            <div
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-14 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 rounded-r-2xl flex items-center justify-center shadow-lg cursor-pointer text-slate-400 active:scale-95 transition-transform"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setDrawerSearch('');
              }}
              title="Desliza a la izquierda o toca aquí para cerrar el menú"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300 animate-pulse" />
            </div>

            {/* 1. Compact Single-Row Header: User Profile + Theme + Close */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleSelectTab('perfil')}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 overflow-hidden ring-2 ring-indigo-500/20 cursor-pointer"
                  title="Ver Mi Perfil"
                >
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
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {effectiveDisplayName || (isDemoMode ? 'Carlos Mendoza' : 'Hermano')}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('perfil')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                    >
                      Perfil
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSelectTab('roles');
                      }}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 truncate max-w-[190px] ${
                        activeRole === 'publico'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                      }`}
                    >
                      <Shield className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">
                        {activeRole === 'publico' ? 'Activar Rol (PIN)' : effectiveRoleInfo?.name || 'Publicador'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setDrawerSearch('');
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Compact Search & Category Filter Bar */}
            <div className="px-3.5 pt-2 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0 space-y-2 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar sección (ej. Cuentas, S-89, Territorios...)"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
                {drawerSearch && (
                  <button
                    type="button"
                    onClick={() => setDrawerSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'ministerio_publicador', label: 'Publicador' },
                  { id: 'panorama', label: 'Panorama General' },
                  { id: 'reuniones', label: 'Reuniones' },
                  { id: 'secretaria', label: 'Secretaría' },
                  { id: 'predicacion', label: 'Predicación' },
                  { id: 'salon', label: 'Salón' },
                  { id: 'supervision', label: 'Control' },
                ].map((cat) => {
                  const isSel = drawerCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDrawerCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSel
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Main Scrollable Navigation List (Occupies ~80% of Drawer Height) */}
            <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3">
              {drawerSearch.trim() ? (
                /* Live Search Results View */
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                    Resultados de búsqueda
                  </span>
                  {(() => {
                    const q = drawerSearch.trim().toLowerCase();
                    const results: NavSubItem[] = [];
                    departments.forEach((dept) => {
                      dept.items.forEach((item) => {
                        if (
                          item.label.toLowerCase().includes(q) ||
                          item.description.toLowerCase().includes(q) ||
                          item.id.toLowerCase().includes(q)
                        ) {
                          results.push(item);
                        }
                      });
                    });

                    if (results.length === 0) {
                      return (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                          No se encontraron secciones para &quot;{drawerSearch}&quot;
                        </div>
                      );
                    }

                    return results.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            handleSelectTab(sub.id);
                            setDrawerSearch('');
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                            isSubActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <SubIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold truncate">{sub.label}</p>
                              <p className="text-[10px] text-slate-400 truncate">{sub.description}</p>
                            </div>
                          </div>
                          {Boolean(sub.badge) && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0 ml-1">
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Standard Categorized View */
                <>
                  {(drawerCategory === 'all'
                    ? departments
                    : departments.filter((d) => d.id === drawerCategory)
                  ).map((dept) => {
                    const DeptIcon = dept.icon;
                    const isCollapsed = collapsedDepts[dept.id] && drawerCategory === 'all';
                    return (
                      <div key={dept.id} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleDeptCollapse(dept.id)}
                          className="w-full flex items-center justify-between text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-1 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <DeptIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {dept.title}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-normal lowercase">
                              {dept.items.length}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                isCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                            />
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-0.5 pt-0.5">
                            {dept.items.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = activeTab === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => handleSelectTab(sub.id)}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                                    isSubActive
                                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <SubIcon
                                      className={`w-4 h-4 shrink-0 ${
                                        isSubActive ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
                                      }`}
                                    />
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {Boolean(sub.badge) && (
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-1 ${
                                        isSubActive
                                          ? 'bg-white text-indigo-700'
                                          : 'bg-amber-500 text-white'
                                      }`}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Secondary Utilities at the bottom of scroll area so they never block sections */}
                  {drawerCategory === 'all' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-1.5">
                        Herramientas Rápidas
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {onOpenPinsModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onOpenPinsModal();
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-[11px] font-semibold cursor-pointer active:scale-95"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">PINs</span>
                          </button>
                        )}
                        {onOpenTimerModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onOpenTimerModal();
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer active:scale-95"
                          >
                            <Timer className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">Atril</span>
                          </button>
                        )}
                        {onOpenKioskModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onOpenKioskModal();
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer active:scale-95"
                          >
                            <Tv className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">Kiosko</span>
                          </button>
                        )}
                        {onOpenQrModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onOpenQrModal();
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                            <span className="truncate">Código QR</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onOpenConflictsModal();
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer relative active:scale-95"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">Cruces</span>
                          {conflicts.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 ml-auto" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 4. Compact Single-Row Footer */}
            <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-800/30 shrink-0 text-xs">
              {onOpenVersionModal ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenVersionModal();
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>v{CURRENT_APP_VERSION}</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">v{CURRENT_APP_VERSION}</span>
              )}

              <div className="flex items-center gap-3">
                {!isDemoMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      lockSession();
                    }}
                    className="font-semibold text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>Bloquear</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="font-semibold text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'inicio' ||
              activeTab === 'cronometro_ministerio' ||
              activeTab === 'revisitas' ||
              activeTab === 'estudios_biblicos'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-5 h-5 stroke-[2]" />
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Ministerio</span>
          </button>

          {/* 2. Panorama General (Vista general aparte) */}
          <button
            type="button"
            onClick={() => handleSelectTab('panorama_general')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'panorama_general'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5 stroke-[2]" />
              {conflicts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Panorama</span>
          </button>

          {/* 3. Reuniones (Programación) */}
          <button
            type="button"
            onClick={() => handleSelectTab('programacion')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'programacion' || activeTab === 'clm_vmc' || activeTab === 's89' || activeTab === 'discursos' || activeTab === 'hospitalidad'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-5 h-5 stroke-[2]" />
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Reuniones</span>
          </button>

          {/* 4. Calendario */}
          <button
            type="button"
            onClick={() => handleSelectTab('calendario')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'calendario'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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

          {/* 5. Menú (Abre Drawer completo de departamentos) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[46px] active:scale-95 ${
              isMobileMenuOpen
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5 stroke-[2]" />
              {(pendingRequestsCount > 0 || pinnedNoticesCount > 0 || overdueTerritoriesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold">Menú</span>
          </button>
        </div>
      </nav>
    </>
  );
};
