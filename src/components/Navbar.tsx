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
  | 'ajustes';

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
  const effectiveDisplayName =
    currentBrotherName && !isGenericIdentityName(currentBrotherName)
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
      await signOutUser();
    } catch {}
    try {
      localStorage.removeItem('kongre_has_entered_app');
      localStorage.removeItem('kongre_is_registered_congregation');
      localStorage.removeItem('kongre_is_guest');
      localStorage.removeItem('kongre_user_profile_guest');
      localStorage.removeItem('kongre_user_profile_active');
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem('kongre_active_role_v1');
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
      id: 'reuniones',
      title: 'Reuniones',
      shortTitle: 'Reuniones',
      icon: ClipboardList,
      tabIds: ['programacion', 's89', 'discursos', 'hospitalidad'],
      items: [
        {
          id: 'programacion',
          label: 'Reunión Entre Semana y Fin de Semana',
          description: 'Vida y Ministerio Cristianos y Fin de Semana en un solo programa',
          icon: ClipboardList,
        },
        {
          id: 's89',
          label: 'Hojas S-89',
          description: 'Hojas de asignación para estudiantes',
          icon: Award,
        },
        {
          id: 'discursos',
          label: 'Discursos Públicos',
          description: 'Catálogo de bosquejos y oradores visitantes',
          icon: Mic,
        },
        {
          id: 'hospitalidad',
          label: 'Hospitalidad de Oradores',
          description: 'Familias anfitrionas y comidas para oradores',
          icon: Coffee,
        },
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros',
      shortTitle: 'Secretaría',
      icon: FileText,
      tabIds: ['publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1', 'cuentas'],
      items: [
        {
          id: 'publicadores',
          label: 'Directorio de Publicadores',
          description: 'Privilegios, teléfonos y responsabilidades',
          icon: Users,
        },
        {
          id: 'precursores_auxiliares',
          label: 'Precursores Auxiliares',
          description: 'Solicitudes S-205 y aprobación del comité',
          icon: Target,
          badge: pendingAuxPioneersCount || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'informe_s1',
          label: 'Informe S-1 Sucursal',
          description: 'Consolidación mensual de asistencia y predicación para JW Hub',
          icon: FileBarChart,
        },
        {
          id: 'tarjetas_s21',
          label: 'Tarjetas S-21',
          description: 'Registro oficial de publicador de la congregación',
          icon: FileText,
        },
        {
          id: 'informes_servicio',
          label: 'Informes S-4',
          description: 'Recolección mensual y resumen para sucursal',
          icon: FileCheck,
        },
        {
          id: 'asistencia',
          label: 'Asistencia S-88',
          description: 'Registro de asistencia a reuniones y promedios',
          icon: BarChart3,
        },
        {
          id: 'cuentas',
          label: 'Cuentas S-26',
          description: 'Registro financiero, donaciones y sucursal',
          icon: Landmark,
        },
      ],
    },
    {
      id: 'predicacion',
      title: 'Predicación',
      shortTitle: 'Predicación',
      icon: Map,
      tabIds: ['territorios', 'grupos_servicio', 'carritos', 'literatura'],
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Asignaciones, mapas, vencimientos y no visitas',
          icon: Map,
          badge: overdueTerritoriesCount || undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'grupos_servicio',
          label: 'Grupos de Servicio',
          description: 'Superintendentes de grupo y lista de familias',
          icon: Compass,
        },
        {
          id: 'carritos',
          label: 'Carritos de Testimonio',
          description: 'Puntos metropolitanos, turnos y parejas',
          icon: MapPin,
        },
        {
          id: 'literatura',
          label: 'Literatura S-14',
          description: 'Inventario de publicaciones, revistas y pedidos',
          icon: Package,
        },
      ],
    },
    {
      id: 'salon',
      title: 'Salón y Organización',
      shortTitle: 'Salón',
      icon: Brush,
      tabIds: ['limpieza_deberes', 'panel_electrico', 'mantenimiento', 'visita_sc', 'memorial_asambleas', 'tablero_anuncios'],
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Servicios de la Congregación',
          description: 'Deberes y turnos (audio, video, micrófonos, acomodadores) y limpieza',
          icon: ShieldCheck,
        },
        {
          id: 'panel_electrico',
          label: 'Panel Eléctrico',
          description: 'Tablero de breakers, circuitos y control de energía',
          icon: Zap,
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento del Salón',
          description: 'Fichas operativas, plan preventivo y extintores',
          icon: Wrench,
        },
        {
          id: 'visita_sc',
          label: 'Visita del SC',
          description: 'Semana del superintendente de circuito y comidas',
          icon: Briefcase,
        },
        {
          id: 'memorial_asambleas',
          label: 'Memorial & Asambleas',
          description: 'Preparativos de Conmemoración y comités',
          icon: Flame,
        },
        {
          id: 'tablero_anuncios',
          label: 'Tablero de Anuncios',
          description: 'Cartas, avisos de la congregación y circulares',
          icon: Bell,
          badge: pinnedNoticesCount || undefined,
          badgeColor: 'bg-indigo-600 text-white',
        },
      ],
    },
    {
      id: 'supervision',
      title: 'Supervisión & Control',
      shortTitle: 'Supervisión',
      icon: AlertTriangle,
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'perfil', 'ajustes'],
      items: [
        {
          id: 'conflictos',
          label: 'Centro de Conflictos',
          description: 'Cruces de hermanos, dobles partes o no asignados',
          icon: AlertTriangle,
          badge: conflicts.length || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'equidad',
          label: 'Panel de Equidad',
          description: 'Distribución justa de asignaciones y estadísticas',
          icon: BarChart3,
        },
        {
          id: 'exportar_pdf',
          label: 'Exportar a PDF',
          description: 'Generación de programas imprimibles en A4/Carta',
          icon: FileText,
        },
        {
          id: 'mi_vista',
          label: 'Portal del Publicador',
          description: 'Asignaciones, informe mensual S-4 y ausencias con PIN personal',
          icon: UserCheck,
        },
        {
          id: 'perfil',
          label: 'Mi Perfil de Usuario',
          description: 'Foto de perfil, nombre visible y canales de contacto',
          icon: User,
        },
        {
          id: 'ajustes',
          label: 'Ajustes de Congregación',
          description: 'Horarios, respaldo y configuración general',
          icon: Settings,
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
      title: 'Panorama General',
      icon: LayoutGrid,
      primaryTab: 'inicio' as ActiveTab,
      tabIds: ['inicio'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
      items: [] as NavSubItem[],
    },
    {
      id: 'reuniones',
      title: 'Reuniones',
      icon: ClipboardList,
      primaryTab: 'programacion' as ActiveTab,
      tabIds: ['programacion', 's89', 'discursos', 'hospitalidad'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
      items: allDepartments[0]?.items || [],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros',
      icon: FileText,
      primaryTab: 'publicadores' as ActiveTab,
      tabIds: ['publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1', 'cuentas'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400',
      items: allDepartments[1]?.items || [],
    },
    {
      id: 'predicacion',
      title: 'Predicación',
      icon: Map,
      primaryTab: 'territorios' as ActiveTab,
      tabIds: ['territorios', 'grupos_servicio', 'carritos', 'literatura'] as ActiveTab[],
      badge: overdueTerritoriesCount || undefined,
      badgeColor: 'bg-rose-500 text-white',
      colorClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400',
      items: allDepartments[2]?.items || [],
    },
    {
      id: 'salon',
      title: 'Salón y Organización',
      icon: Brush,
      primaryTab: 'limpieza_deberes' as ActiveTab,
      tabIds: ['limpieza_deberes', 'visita_sc', 'memorial_asambleas', 'tablero_anuncios'] as ActiveTab[],
      badge: pinnedNoticesCount || undefined,
      badgeColor: 'bg-indigo-600 text-white',
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400',
      items: allDepartments[3]?.items || [],
    },
    {
      id: 'supervision',
      title: 'Supervisión & Control',
      icon: AlertTriangle,
      primaryTab: 'conflictos' as ActiveTab,
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'perfil', 'ajustes'] as ActiveTab[],
      badge: conflicts.length || undefined,
      badgeColor: 'bg-amber-500 text-white',
      colorClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400',
      items: allDepartments[4]?.items || [],
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
    .filter((cat) => cat.id === 'inicio' || cat.items.length > 0);

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
        return 'Resumen';
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
      <header className={`sticky top-0 z-30 w-full ${isSidebarVisible ? 'md:pl-16' : 'pl-0'} bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-all duration-200`}>
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 lg:px-8 2xl:px-12">
          {/* Left: Panel Toggle & Congregation Name */}
          <div className="flex items-center gap-3 min-w-0">
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

            {/* Browser Back / Forward Controls */}
            <div className="flex items-center gap-0.5 shrink-0">
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
            <div className="truncate">
              <div className="flex items-center gap-2 text-xs">
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
              <p className="text-[10px] text-slate-400 font-medium sm:hidden truncate mt-0.5">
                {getCurrentTabSubtitle(activeTab)}
              </p>
            </div>
          </div>

          {/* Right: Clean, Organized Utility Icons & User Menu */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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

            {/* Dark Mode Moon / Sun Toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} size={28} />

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
                    const effectiveAvatar =
                      userProfile?.photoURL ||
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

                    {onOpenRoleModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenRoleModal();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer text-left ${
                          activeRole === 'publico'
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100'
                            : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                        }`}
                      >
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{canManageRoles ? 'Directorio de Roles y PINs' : '🔑 Activar Rol / Ingresar PIN'}</span>
                      </button>
                    )}

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

          {/* Drawer content */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <Logo variant="isotipo" className="w-8 h-8 object-contain shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {displayCongregationName}
                    </h3>
                    {isDemoMode && (
                      <DemoBanner
                        onOpenRoleModal={onOpenRoleModal}
                        onOpenRegisterModal={onOpenRegisterModal}
                        onExitDemo={handleExitDemo}
                        onResetDemo={handleResetDemo}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Menú de Navegación Teocrático</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setDrawerSearch('');
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 overflow-hidden ring-2 ring-indigo-500/20">
                  {(() => {
                    const effectiveAvatar =
                      userProfile?.photoURL ||
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
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {effectiveDisplayName || 'Hermano'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {onOpenRoleModal ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenRoleModal();
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 truncate ${
                          activeRole === 'publico'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold hover:bg-amber-200'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                        }`}
                        title="Toca para ingresar tu PIN y activar tu rol"
                      >
                        <Shield className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {activeRole === 'publico' ? '🔑 Ingresar PIN (Activar Rol)' : effectiveRoleInfo?.name || 'Publicador'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 truncate flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{effectiveRoleInfo?.name || 'Publicador'}</span>
                      </span>
                    )}
                    {user?.email && (
                      <span className="text-[10px] text-slate-400 truncate">
                        • {user.email.split('@')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectTab('perfil')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                Ver Perfil
              </button>
            </div>

            {/* Quick Theocratic Tools Strip */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 shrink-0 space-y-2.5">
              {/* Acceso Directo al Calendario en Móvil */}
              <button
                type="button"
                onClick={() => {
                  handleSelectTab('calendario');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'calendario'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeTab === 'calendario' ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span>Calendario de la Congregación</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'calendario' ? 'text-white/80' : 'text-slate-400'}`} />
              </button>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Herramientas Rápidas
              </span>
              <div className="grid grid-cols-6 gap-1 text-center">
                {onOpenPinsModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenPinsModal();
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 hover:text-amber-600 shadow-2xs transition cursor-pointer"
                    title="Directorio de PINs"
                  >
                    <KeyRound className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-[9px] font-bold leading-tight truncate w-full">PINs</span>
                  </button>
                )}

                {onOpenTimerModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTimerModal();
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-2xs transition cursor-pointer"
                    title="Temporizador de Reunión"
                  >
                    <Timer className="w-4 h-4 text-indigo-500 mb-1" />
                    <span className="text-[9px] font-semibold leading-tight truncate w-full">Tiempo</span>
                  </button>
                )}

                {onOpenKioskModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenKioskModal();
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-2xs transition cursor-pointer"
                    title="Tablero Salón (Kiosko TV)"
                  >
                    <Tv className="w-4 h-4 text-emerald-500 mb-1" />
                    <span className="text-[9px] font-semibold leading-tight truncate w-full">Kiosko</span>
                  </button>
                )}

                {onOpenQrModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenQrModal();
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-2xs transition cursor-pointer"
                    title="App Móvil & Código QR"
                  >
                    <QrCode className="w-4 h-4 text-violet-500 mb-1" />
                    <span className="text-[9px] font-semibold leading-tight truncate w-full">QR</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenConflictsModal();
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-2xs transition cursor-pointer relative"
                  title="Cruces & Conflictos"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
                  {conflicts.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-800" />
                  )}
                  <span className="text-[9px] font-semibold leading-tight truncate w-full">Cruces</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-2xs transition cursor-pointer"
                  title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400 mb-1" /> : <Moon className="w-4 h-4 text-slate-500 mb-1" />}
                  <span className="text-[9px] font-semibold leading-tight truncate w-full">{isDark ? 'Claro' : 'Oscuro'}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter / Search inside Drawer */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar módulo (ej. Cuentas, S-89, Territorios...)"
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
            </div>

            {/* Quick Department Filter Pills */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
              {[
                { id: 'all', label: 'Todos' },
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
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Department Navigation List / Live Search Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                          No se encontraron módulos para &quot;{drawerSearch}&quot;
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
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition cursor-pointer ${
                            isSubActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <SubIcon className="w-4 h-4" />
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
                  <button
                    type="button"
                    onClick={() => handleSelectTab('inicio')}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'inicio'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Panorama General (Resumen)</span>
                  </button>

                  {(drawerCategory === 'all'
                    ? departments
                    : departments.filter((d) => d.id === drawerCategory)
                  ).map((dept) => {
                    const DeptIcon = dept.icon;
                    const isCollapsed = collapsedDepts[dept.id] && drawerCategory === 'all';
                    return (
                      <div key={dept.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleDeptCollapse(dept.id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-1.5 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <DeptIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {dept.title}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-normal lowercase">
                              {dept.items.length} módulos
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                                isCollapsed ? '-rotate-90' : 'rotate-0'
                              }`}
                            />
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-1 pt-0.5">
                            {dept.items.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = activeTab === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => handleSelectTab(sub.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer min-h-[42px] ${
                                    isSubActive
                                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <SubIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {Boolean(sub.badge) && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0 ml-1">
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
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 bg-slate-50/60 dark:bg-slate-800/30 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    lockSession();
                  }}
                  className="font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Bloquear PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

              {onOpenVersionModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenVersionModal();
                  }}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Kongre v{CURRENT_APP_VERSION}</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    Changelog
                  </span>
                </button>
              )}
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
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* 1. Inicio */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
              activeTab === 'inicio'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5 stroke-[2]" />
              {conflicts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight font-semibold">Inicio</span>
          </button>

          {/* 2. Reuniones (Programación) */}
          <button
            type="button"
            onClick={() => handleSelectTab('programacion')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
              activeTab === 'programacion' || activeTab === 'clm_vmc' || activeTab === 's89' || activeTab === 'discursos' || activeTab === 'hospitalidad'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] mt-0.5 leading-tight font-semibold">Reuniones</span>
          </button>

          {/* 3. Calendario (Ubicación fija en móvil en barra inferior) */}
          <button
            type="button"
            onClick={() => handleSelectTab('calendario')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
              activeTab === 'calendario'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Calendar className="w-5 h-5 stroke-[2]" />
              {activeTab === 'calendario' && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight font-semibold">Calendario</span>
          </button>

          {/* 4. Hermanos o Mi Portal según rol */}
          {isTabAllowedForRole(effectiveRoleInfo.id, 'publicadores') ? (
            <button
              type="button"
              onClick={() => handleSelectTab('publicadores')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
                activeTab === 'publicadores' || activeTab === 'grupos_servicio' || activeTab === 'precursores_auxiliares'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-0.5 leading-tight font-semibold">Hermanos</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectTab('mi_vista')}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
                activeTab === 'mi_vista'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-0.5 leading-tight font-semibold">Mi Portal</span>
            </button>
          )}

          {/* 5. Menú (Abre Drawer completo de departamentos) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
              isMobileMenuOpen
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5 stroke-[2]" />
              {(pendingRequestsCount > 0 || pinnedNoticesCount > 0 || overdueTerritoriesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight font-semibold">Menú</span>
          </button>
        </div>
      </nav>
    </>
  );
};
