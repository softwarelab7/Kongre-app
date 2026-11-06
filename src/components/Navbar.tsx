// src/components/Navbar.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
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
  RefreshCw,
  WifiOff,
  CloudCheck,
  ArrowLeftRight,
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
  selectedCategoryHub?: string;
  onSelectCategoryHub?: (category: string) => void;
  isSidebarVisible?: boolean;
  onToggleSidebar?: () => void;
  onOpenConflictsModal: () => void;
  onOpenQrModal?: () => void;
  onOpenP2PModal?: () => void;
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
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
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
  selectedCategoryHub = 'all',
  onSelectCategoryHub,
  isSidebarVisible = true,
  onToggleSidebar,
  onOpenConflictsModal,
  onOpenQrModal,
  onOpenP2PModal,
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
  onToggleInspector,
  isInspectorOpen,
}) => {
  const { user, userProfile, signInWithGoogle, signOutUser, activeRole, effectiveRoleInfo, currentBrotherName, isCoordinator, permissions } = useAuth();
  const canManageRoles = !effectiveRoleInfo.isReadOnly && activeRole !== 'publico' && (isCoordinator || activeRole === 'coordinador' || activeRole === 'anciano');
  const {
    settings,
    updateSettings,
    conflicts,
    theocraticReminders,
    notices,
    territories,
    accountLinkRequests,
    auxPioneerRequests,
    isOnline,
    syncStatus,
    isSupabaseSyncing,
    lastSupabaseSyncAt,
    offlineQueueStats,
    syncNowWithSupabase,
    syncOfflineQueueNow,
    isDemoMode,
    loadDemoData,
    exitDemoMode,
  } = useCongregation();

  const [isForcingSync, setIsForcingSync] = useState(false);
  const [syncFeedbackToast, setSyncFeedbackToast] = useState<{
    message: string;
    state: 'syncing' | 'online' | 'offline';
  } | null>(null);
  const syncToastTimeoutRef = useRef<number | null>(null);

  const pendingOfflineCount = offlineQueueStats?.pendingCount ?? 0;
  const totalNotificationsCount =
    (conflicts?.length || 0) + (theocraticReminders?.totalAttentionCount || 0);
  const isActivelySyncing =
    isForcingSync ||
    isSupabaseSyncing ||
    syncStatus === 'saving' ||
    (offlineQueueStats?.syncingCount ?? 0) > 0;

  const effectiveSyncState: 'syncing' | 'online' | 'offline' = isActivelySyncing
    ? 'syncing'
    : !isOnline || syncStatus === 'offline'
    ? 'offline'
    : 'online';

  const syncVisualConfig = useMemo(() => {
    if (effectiveSyncState === 'syncing') {
      return {
        label: 'Sincronizando',
        shortLabel: 'Sincronizando...',
        badgeBg: 'bg-amber-500 text-white',
        dotClass: 'bg-amber-500 animate-pulse',
        solidDotClass: 'bg-amber-500',
        description: 'Sincronizando cambios con la nube...',
      };
    }
    if (effectiveSyncState === 'offline') {
      return {
        label: 'Desconectado',
        shortLabel: pendingOfflineCount > 0 ? `Offline (${pendingOfflineCount})` : 'Desconectado',
        badgeBg: 'bg-rose-500 text-white',
        dotClass: 'bg-rose-500',
        solidDotClass: 'bg-rose-500',
        description:
          pendingOfflineCount > 0
            ? `Sin conexión · ${pendingOfflineCount} cambio(s) en cola local.`
            : 'Sin conexión a Internet · Datos respaldados localmente.',
      };
    }
    return {
      label: 'En línea',
      shortLabel: 'En línea',
      badgeBg: 'bg-emerald-500 text-white',
      dotClass: 'bg-emerald-500',
      solidDotClass: 'bg-emerald-500',
      description: 'En línea y sincronizado con Supabase.',
    };
  }, [effectiveSyncState, pendingOfflineCount]);

  const handleForceSync = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isForcingSync) return;

    if (syncToastTimeoutRef.current) {
      window.clearTimeout(syncToastTimeoutRef.current);
    }

    setIsForcingSync(true);
    setSyncFeedbackToast({
      message: 'Sincronizando datos con la nube...',
      state: 'syncing',
    });

    const minSpinPromise = new Promise((resolve) => window.setTimeout(resolve, 750));

    try {
      if (!navigator.onLine && !isOnline) {
        await minSpinPromise;
        setSyncFeedbackToast({
          message:
            pendingOfflineCount > 0
              ? `Modo desconectado · ${pendingOfflineCount} cambio(s) seguros en cola local`
              : 'Dispositivo desconectado · Tus datos están respaldados localmente',
          state: 'offline',
        });
      } else {
        const [queueRes, cloudRes] = await Promise.all([
          syncOfflineQueueNow ? syncOfflineQueueNow().catch(() => null) : Promise.resolve(null),
          syncNowWithSupabase ? syncNowWithSupabase(true).catch(() => null) : Promise.resolve(null),
          minSpinPromise,
        ]);

        const syncedItems = queueRes?.syncedCount ?? 0;
        if (cloudRes?.success || queueRes?.success || isDemoMode) {
          setSyncFeedbackToast({
            message:
              syncedItems > 0
                ? `¡Sincronización completada! (${syncedItems} cambio(s) subidos)`
                : '¡Sincronización forzada completada! Todo está al día',
            state: 'online',
          });
        } else {
          setSyncFeedbackToast({
            message: 'Sincronización verificada · Estado actualizado',
            state: isOnline ? 'online' : 'offline',
          });
        }
      }
    } catch {
      setSyncFeedbackToast({
        message: isOnline
          ? 'Sincronización local verificada'
          : 'Desconectado · Cambios guardados en este dispositivo',
        state: isOnline ? 'online' : 'offline',
      });
    } finally {
      setIsForcingSync(false);
      syncToastTimeoutRef.current = window.setTimeout(() => {
        setSyncFeedbackToast(null);
      }, 3600);
    }
  };

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
  const { themeMode, setThemeMode, toggleTheme, isDark, isSepia, isCabinaMode } = useTheme();
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
  const lastNonMenuTabRef = useRef<ActiveTab>('inicio');
  useEffect(() => {
    if (activeTab !== 'menu') {
      lastNonMenuTabRef.current = activeTab;
    }
  }, [activeTab]);

  const overdueTerritoriesCount = territories.filter(
    (t) =>
      t.status === 'vencido' ||
      (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
  ).length;

  const pinnedNoticesCount = notices.filter((n) => n.pinned).length;



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
      tabIds: ['estadisticas_secretaria', 'publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1'],
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
          id: 'mantenimiento',
          label: 'Mantenimiento y Panel Eléctrico',
          description: 'Fichas operativas, plan preventivo, extintores y tablero de breakers',
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

  // Categorías principales teocráticas integradas en la barra lateral con panel estilo JW Library
  const rawCategoriesList = [
    {
      id: 'inicio',
      title: 'Menú Principal • Publicador',
      shortTitle: 'Publicador',
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
      shortTitle: 'Congregación',
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
      shortTitle: 'Reuniones',
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
      shortTitle: 'Secretaría',
      icon: NAV_ICONS.secretaria,
      primaryTab: 'estadisticas_secretaria' as ActiveTab,
      tabIds: ['estadisticas_secretaria', 'publicadores', 'precursores_auxiliares', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'informe_s1'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400',
      items: allDepartments.find((d) => d.id === 'secretaria')?.items || [],
    },
    {
      id: 'predicacion',
      title: 'Predicación',
      shortTitle: 'Predicación',
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
      shortTitle: 'Salón',
      icon: NAV_ICONS.salon,
      primaryTab: 'limpieza_deberes' as ActiveTab,
      tabIds: ['limpieza_deberes', 'mantenimiento', 'panel_electrico', 'visita_sc', 'memorial_asambleas', 'tablero_anuncios'] as ActiveTab[],
      badge: pinnedNoticesCount || undefined,
      badgeColor: 'bg-indigo-600 text-white',
      colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400',
      items: allDepartments.find((d) => d.id === 'salon')?.items || [],
    },
    {
      id: 'supervision',
      title: 'Supervisión & Control',
      shortTitle: 'Supervisión',
      icon: NAV_ICONS.supervision,
      primaryTab: 'conflictos' as ActiveTab,
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'roles'] as ActiveTab[],
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
      case 'mantenimiento':
        return 'Mantenimiento y Panel Eléctrico';
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
      case 'menu': {
        if (selectedCategoryHub && selectedCategoryHub !== 'all') {
          const found = categoriesList.find((c) => c.id === selectedCategoryHub);
          return found ? found.title.split('•')[0].trim() : 'Departamentos';
        }
        return 'Departamentos y Módulos';
      }
      default:
        return 'Kongre';
    }
  };



  return (
    <>
      {/* =================================================================          ========================================================================= */}
      {isSidebarVisible && (
        <aside
          aria-label="Barra lateral de navegación por departamentos"
          className="hidden md:flex flex-col items-center fixed left-0 top-0 bottom-0 w-16 z-40 bg-white dark:bg-[#09090B] border-r border-zinc-200 dark:border-[#27272A] py-3 select-none transition-all duration-200 overflow-visible"
        >
          {/* Top Brand Squircle Logo Button - Fixed, firmly anchored at top */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            aria-label="Ir al inicio - Mi Ministerio"
            className="w-10 h-10 flex items-center justify-center cursor-pointer mb-3 shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            title="Kongre - Mi Ministerio"
          >
            <Logo variant="isotipo" className="w-10 h-10 object-contain shadow-xs" />
          </button>

          {/* Vertical Categories Stack */}
          <div className="flex-1 w-full flex flex-col items-center gap-1.5 overflow-visible py-1">
            {categoriesList.map((cat) => {
              const Icon = cat.icon;
              const isCatActive =
                (activeTab === 'menu' && selectedCategoryHub === cat.id) ||
                (activeTab !== 'menu' && cat.tabIds.includes(activeTab));

              return (
                <div key={cat.id} className="relative w-full flex justify-center">
                  {/* Indicador de pestaña activa acoplado al borde exterior de la barra */}
                  {isCatActive && (
                    <motion.span
                      layoutId="desktopSidebarActiveBar"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-500 pointer-events-none"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (cat.id === 'inicio') {
                        handleSelectTab('inicio');
                      } else if (cat.id === 'panorama_general') {
                        handleSelectTab('panorama_general');
                      } else {
                        onSelectCategoryHub?.(cat.id);
                        handleSelectTab('menu');
                      }
                    }}
                    aria-label={cat.title}
                    aria-current={isCatActive ? 'page' : undefined}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isCatActive
                        ? 'bg-indigo-50 dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/30 shadow-2xs font-bold'
                        : 'text-zinc-400 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F]'
                    }`}
                    title={cat.title}
                  >
                    <Icon className="w-4 h-4 stroke-[1.8]" />

                    {/* Badge count indicator */}
                    {cat.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#09090B] animate-pulse" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Quick Settings, Profile & Sidebar Collapse Button */}
          <div className="mt-auto pt-2 flex flex-col items-center gap-1.5 border-t border-zinc-200 dark:border-[#27272A] w-full shrink-0">
            {/* Perfil */}
            <div className="relative w-full flex justify-center">
              {activeTab === 'perfil' && (
                <motion.span
                  layoutId="desktopSidebarActiveBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-500 pointer-events-none"
                />
              )}
              <button
                type="button"
                onClick={() => handleSelectTab('perfil')}
                aria-label="Mi Perfil y Contacto"
                aria-current={activeTab === 'perfil' ? 'page' : undefined}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'perfil'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-[#18181F] dark:text-indigo-400 font-bold border border-indigo-200/60 dark:border-indigo-500/30 shadow-2xs'
                    : 'text-zinc-400 dark:text-[#A1A1AA] hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F]'
                }`}
                title="Mi Perfil y Contacto"
              >
                <User className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>

            {/* Ajustes */}
            {isTabAllowedForRole(effectiveRoleInfo.id, 'ajustes') && (
              <div className="relative w-full flex justify-center">
                {activeTab === 'ajustes' && (
                  <motion.span
                    layoutId="desktopSidebarActiveBar"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-500 pointer-events-none"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleSelectTab('ajustes')}
                  aria-label="Ajustes de la Congregación"
                  aria-current={activeTab === 'ajustes' ? 'page' : undefined}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === 'ajustes'
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-[#18181F] dark:text-indigo-400 font-bold border border-indigo-200/60 dark:border-indigo-500/30 shadow-2xs'
                      : 'text-zinc-400 dark:text-[#A1A1AA] hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F]'
                  }`}
                  title="Ajustes de la Congregación"
                >
                  <Settings className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            )}

            {/* Botón integrado directamente en la barra lateral para ocultarla */}
            {onToggleSidebar && (
              <div className="relative w-full flex justify-center">
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  aria-label="Ocultar barra lateral"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-[#18181F] transition-all cursor-pointer group"
                  title="Ocultar barra lateral (Ctrl+B / ⌘B)"
                >
                  <PanelLeftClose className="w-4 h-4 stroke-[1.8] group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* Versión compacta y elegante sin desbordamiento */}
            {onOpenVersionModal && (
              <button
                type="button"
                onClick={onOpenVersionModal}
                aria-label={`Versión Kongre v${CURRENT_APP_VERSION} (Alfa)`}
                className="w-11 py-1 rounded-lg flex flex-col items-center justify-center text-center text-[9px] font-mono tabular-nums text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181F] transition-all cursor-pointer group select-none mt-0.5"
                title={`Kongre v${CURRENT_APP_VERSION} (Alfa) - Clic para ver historial de cambios`}
              >
                <span className="text-[9.5px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  v{CURRENT_APP_VERSION.replace('-alpha.', 'α.')}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[7.5px] font-sans font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  <span>alfa</span>
                </span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* =========================================================================
          2. TOP HEADER BAR (EXACT REFERENCE DESIGN)
         ========================================================================= */}
      <header className={`sticky top-0 z-30 w-full ${isSidebarVisible ? 'md:pl-16' : 'pl-0'} pt-[env(safe-area-inset-top,0px)] bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl border-b border-zinc-200/70 dark:border-white/[0.08] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-200`}>
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 lg:px-8 2xl:px-12 gap-3">
          {/* 1. LEFT: Sidebar Toggle & Structured Breadcrumb Context */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Desktop: Botón Hamburguesa de Categorías (JW Library) */}
            {isSidebarVisible && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'menu') {
                    handleSelectTab(lastNonMenuTabRef.current || 'inicio');
                  } else {
                    onSelectCategoryHub?.('all');
                    handleSelectTab('menu');
                  }
                }}
                aria-label={activeTab === 'menu' ? 'Volver a la vista anterior' : 'Catálogo general de módulos (JW Library)'}
                aria-expanded={activeTab === 'menu'}
                className={`hidden md:flex w-9 h-9 rounded-xl items-center justify-center transition-all cursor-pointer shrink-0 ${
                  activeTab === 'menu'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-[#18181F]'
                }`}
                title={activeTab === 'menu' ? 'Volver a la vista anterior' : 'Catálogo general de módulos (JW Library)'}
              >
                {activeTab === 'menu' ? (
                  <X className="w-5 h-5 stroke-[2]" />
                ) : (
                  <Menu className="w-5 h-5 stroke-[2]" />
                )}
              </button>
            )}

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
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-[#F4F4F5] hover:text-indigo-600 dark:hover:text-indigo-400 bg-zinc-100 dark:bg-[#18181F] hover:bg-indigo-50 dark:hover:bg-[#121216] border border-zinc-200 dark:border-[#27272A] transition-all cursor-pointer shadow-2xs group"
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
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-sm font-medium sm:font-bold text-zinc-500 sm:text-zinc-800 dark:text-[#A1A1AA] sm:dark:text-[#F4F4F5] hover:text-indigo-600 dark:hover:text-indigo-400 leading-tight truncate transition-colors cursor-pointer text-left"
                  title="Ir a Mi Congregación"
                >
                  <Building2 className="hidden lg:inline-block w-3.5 h-3.5 text-zinc-400 dark:text-[#A1A1AA] shrink-0" />
                  <span className="truncate">{displayCongregationName}</span>
                </button>

                <ChevronRight className="hidden sm:inline-block w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />

                <div className="inline-flex items-center gap-1.5 min-w-0">
                  {(() => {
                    const selectedCatObj = activeTab === 'menu' && selectedCategoryHub && selectedCategoryHub !== 'all'
                      ? categoriesList.find((c) => c.id === selectedCategoryHub)
                      : null;
                    const ActiveModIcon = selectedCatObj ? selectedCatObj.icon : (NAV_ICONS[activeTab] || Compass);
                    return (
                      <span className="hidden md:inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-[#27272A] shrink-0">
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
              className="h-9 px-3 rounded-xl bg-zinc-100/80 dark:bg-[#121216] hover:bg-white dark:hover:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:border-indigo-300 dark:hover:border-indigo-500/40 text-zinc-500 dark:text-[#A1A1AA] flex items-center justify-between gap-3 w-48 lg:w-64 xl:w-72 transition-all cursor-pointer group shadow-2xs"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                <span className="text-xs font-medium truncate group-hover:text-zinc-700 dark:group-hover:text-[#F4F4F5] transition-colors">
                  Buscar en congregación...
                </span>
              </span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-400 dark:text-[#A1A1AA] bg-white dark:bg-[#18181F] rounded-md border border-zinc-200 dark:border-[#27272A] shrink-0">
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
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 dark:text-[#F4F4F5] hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#18181F] transition cursor-pointer"
              title="Buscar en la congregación"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Status indicator (AutoLock) */}
            <div className="hidden sm:flex items-center">
              <AutoLockTimerChip />
            </div>

            {/* Unified System Utility Dock (sm+): Todos solo icono (Calendario, Publicadores, QR, PINs, Alertas, Tema) */}
            <div className="hidden sm:flex items-center gap-0.5 p-1 h-9 rounded-xl bg-zinc-100/80 dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-2xs">
              {/* Calendario Quick Access (Solo icono) */}
              <button
                type="button"
                onClick={() => handleSelectTab('calendario')}
                aria-label="Calendario de la Congregación"
                aria-current={activeTab === 'calendario' ? 'page' : undefined}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'calendario'
                    ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#18181F]'
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
                      ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                      : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#18181F]'
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
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#18181F] transition-all cursor-pointer"
                  title="App Móvil y Código QR"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="flex items-center">
                  <PWAInstallButton />
                </div>
              )}

              {/* Transferencia Local Salón P2P / QR */}
              {onOpenP2PModal && (
                <button
                  type="button"
                  onClick={onOpenP2PModal}
                  aria-label="Transferencia Directa Local Salón (P2P y QR)"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#18181F] transition-all cursor-pointer"
                  title="Transferencia Directa Local Salón (P2P / QR sin internet)"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* PINs Directory Quick Access */}
              {onOpenPinsModal && (
                <button
                  type="button"
                  onClick={onOpenPinsModal}
                  aria-label="Directorio de PINs de los Publicadores y la Congregación"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 dark:text-[#A1A1AA] hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-[#18181F] transition-all cursor-pointer"
                  title="Directorio de PINs y Accesos"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Bell Notifications / Conflicts & Reminders */}
              <button
                type="button"
                onClick={onOpenConflictsModal}
                aria-label={`Centro de notificaciones y recordatorios${totalNotificationsCount > 0 ? ` (${totalNotificationsCount} alertas)` : ''}`}
                className={`relative w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'conflictos'
                    ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : totalNotificationsCount > 0
                    ? theocraticReminders?.hasUrgentItems
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-[#18181F]'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-[#18181F]'
                    : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#18181F]'
                }`}
                title={totalNotificationsCount > 0 ? `Centro de Notificaciones (${totalNotificationsCount} alertas)` : 'Centro de Notificaciones'}
              >
                <Bell className="w-3.5 h-3.5" />
                {totalNotificationsCount > 0 && (
                  <span
                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-[#121216] ${
                      theocraticReminders?.hasUrgentItems
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                )}
              </button>

              {/* Botón Notas de Estudio (Bloc de Notas) */}
              {onToggleInspector && (
                <button
                  type="button"
                  onClick={onToggleInspector}
                  aria-label="Notas de Estudio (Bloc de notas)"
                  aria-expanded={isInspectorOpen}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    isInspectorOpen
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#18181F]'
                  }`}
                  title="Notas de Estudio"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dark Mode Moon / Sun Toggle Integrated in Dock */}
              <div className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-[#18181F] transition-all">
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} size={26} />
              </div>
            </div>

            {/* Mobile-only Study & Theme Buttons (< sm) */}
            <div className="flex sm:hidden items-center gap-1">
              {onToggleInspector && (
                <button
                  type="button"
                  onClick={onToggleInspector}
                  aria-label="Notas de Estudio"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isInspectorOpen
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-500 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F]'
                  }`}
                  title="Notas de Estudio"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
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
                title={`${effectiveDisplayName || 'Usuario'} · ${syncVisualConfig.label}`}
                className={`flex items-center gap-1.5 sm:gap-2 h-9 pl-1 pr-2 sm:pr-2.5 rounded-full bg-zinc-100/90 dark:bg-[#121216] hover:bg-zinc-200/60 dark:hover:bg-[#18181F] border transition-all cursor-pointer shadow-2xs active:scale-[0.98] ${
                  effectiveSyncState === 'syncing'
                    ? 'border-amber-400/60 dark:border-amber-500/50'
                    : effectiveSyncState === 'offline'
                    ? 'border-rose-400/60 dark:border-rose-500/50'
                    : 'border-zinc-200/80 dark:border-[#27272A]'
                }`}
              >
                {/* 1. Avatar with subtle micro-status dot */}
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px] overflow-hidden shadow-2xs">
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
                            alt="Foto de perfil"
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

                  {/* Elegant micro status dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#121216] transition-colors ${
                      effectiveSyncState === 'syncing'
                        ? 'bg-amber-500 animate-pulse'
                        : effectiveSyncState === 'offline'
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Optional Status Pill ONLY when syncing or offline with pending */}
                {effectiveSyncState === 'syncing' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Sincronizando...</span>
                  </span>
                )}
                {effectiveSyncState === 'offline' && pendingOfflineCount > 0 && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-md text-[10.5px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                    Offline ({pendingOfflineCount})
                  </span>
                )}

                {/* User First Name */}
                <span className="hidden sm:inline-block max-w-[110px] truncate text-xs font-semibold text-zinc-700 dark:text-[#F4F4F5] text-left">
                  {effectiveDisplayName?.split(' ')[0] || 'Mi Cuenta'}
                </span>

                {/* Chevron */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 dark:text-[#A1A1AA] shrink-0 transition-transform duration-150 ${
                    openDropdown === 'user' ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                />
              </button>

              {/* Floating Sync Feedback Toast right under Profile Photo */}
              {syncFeedbackToast && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl p-3 shadow-xl border z-50 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md ${
                    syncFeedbackToast.state === 'syncing'
                      ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100'
                      : syncFeedbackToast.state === 'offline'
                      ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100'
                      : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        syncFeedbackToast.state === 'syncing'
                          ? 'bg-amber-500 text-white'
                          : syncFeedbackToast.state === 'offline'
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {syncFeedbackToast.state === 'syncing' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : syncFeedbackToast.state === 'offline' ? (
                        <WifiOff className="w-3.5 h-3.5" />
                      ) : (
                        <CloudCheck className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold leading-snug">
                        {syncFeedbackToast.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] font-bold">
                        {!isDemoMode && onOpenQueueModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setSyncFeedbackToast(null);
                              onOpenQueueModal();
                            }}
                            className="underline hover:opacity-80 cursor-pointer"
                          >
                            Ver cola ({pendingOfflineCount})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSyncFeedbackToast(null);
                            setOpenDropdown('user');
                          }}
                          className="underline hover:opacity-80 cursor-pointer"
                        >
                          Menú de perfil
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSyncFeedbackToast(null)}
                      className="text-current opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                      aria-label="Cerrar aviso"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Redesigned User Profile Panel Popover (Mobile & Desktop) */}
              {openDropdown === 'user' && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-[340px] sm:w-[350px] bg-white dark:bg-[#121216] rounded-2xl shadow-xl border border-zinc-200/90 dark:border-[#27272A] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* 1. Identity & Sync Card */}
                  <div className="rounded-xl p-3 bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] mb-2 space-y-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Status Dot */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-xs overflow-hidden">
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
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-[#18181F] ${
                            effectiveSyncState === 'syncing'
                              ? 'bg-amber-500 animate-pulse'
                              : effectiveSyncState === 'offline'
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] truncate tracking-tight">
                          {effectiveDisplayName || 'Usuario'}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{displayCongregationName}</span>
                        </p>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 max-w-full">
                          <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">{effectiveRoleInfo?.name || 'Publicador'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Sync Status & Actions Row */}
                    <div className="pt-2 border-t border-zinc-200/70 dark:border-[#27272A] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenQueueModal) {
                            setOpenDropdown(null);
                            onOpenQueueModal();
                          }
                        }}
                        className="flex items-center gap-1.5 min-w-0 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer text-left group"
                        title="Ver cola y estado de datos locales en OfflineDashboard"
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            effectiveSyncState === 'syncing'
                              ? 'bg-amber-500 animate-pulse'
                              : effectiveSyncState === 'offline'
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="truncate">
                          {effectiveSyncState === 'syncing'
                            ? 'Sincronizando...'
                            : effectiveSyncState === 'offline'
                            ? pendingOfflineCount > 0
                              ? `Sin conexión (${pendingOfflineCount})`
                              : 'Sin conexión'
                            : pendingOfflineCount > 0
                            ? `En línea (${pendingOfflineCount} pendientes)`
                            : 'En línea y sincronizado'}
                        </span>
                        {onOpenQueueModal && (
                          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleForceSync}
                        disabled={isForcingSync}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white dark:bg-[#121216] hover:bg-zinc-100 dark:hover:bg-[#22222A] text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-[#27272A] shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                        title="Forzar sincronización inmediata con Supabase"
                      >
                        <RefreshCw className={`w-3 h-3 ${isForcingSync ? 'animate-spin text-indigo-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        <span>Sincronizar</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Quick Access Cards: Mi Perfil & Mi Portal */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('perfil');
                      }}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        activeTab === 'perfil'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                          : 'bg-zinc-50 dark:bg-[#18181F] hover:bg-zinc-100/80 dark:hover:bg-[#22222A] border-zinc-200/80 dark:border-[#27272A] text-zinc-800 dark:text-[#F4F4F5]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold leading-tight truncate">Mi Perfil</span>
                        <span className="block text-[10.5px] text-zinc-500 dark:text-[#A1A1AA] truncate mt-0.5">Cuenta y PIN</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('mi_vista');
                      }}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                        activeTab === 'mi_vista'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-zinc-50 dark:bg-[#18181F] hover:bg-zinc-100/80 dark:hover:bg-[#22222A] border-zinc-200/80 dark:border-[#27272A] text-zinc-800 dark:text-[#F4F4F5]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold leading-tight truncate">Mi Portal</span>
                        <span className="block text-[10.5px] text-zinc-500 dark:text-[#A1A1AA] truncate mt-0.5">Asignaciones</span>
                      </div>
                    </button>
                  </div>

                  {/* 3. Navigation List Items */}
                  <div className="space-y-0.5 pt-1.5 border-t border-zinc-200/80 dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleSelectTab('roles');
                      }}
                      className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer text-left group"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{canManageRoles ? 'Roles y Permisos' : 'Cambiar Rol / PIN'}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>

                    {isTabAllowedForRole(effectiveRoleInfo.id, 'ajustes') && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          handleSelectTab('ajustes');
                        }}
                        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer text-left group"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">Ajustes de la Congregación</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    )}

                    {permissions.canViewAuditLog && onOpenAuditLog && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenAuditLog();
                        }}
                        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer text-left group"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <ClipboardList className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">Registro de Auditoría</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    )}

                    {onOpenP2PModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenP2PModal();
                        }}
                        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer text-left group"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">Transferencia Local Salón (P2P / QR)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    )}

                    {!isDemoMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          lockSession();
                        }}
                        className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer text-left group"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">Bloquear Sesión con PIN</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        setDesktopDownloadOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer text-left group"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <Monitor className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">Instalador para PC</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                        <span>Descargar</span>
                        <Download className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                      </span>
                    </button>
                  </div>

                  {/* 4. Theme Selector Inset */}
                  <div className="mt-2 pt-2 border-t border-zinc-200/80 dark:border-[#27272A]">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                        {themeMode === 'dark' ? (
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        ) : themeMode === 'sepia' ? (
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>Tema</span>
                      </span>
                      <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-200/70 dark:bg-[#09090B] border border-zinc-300/50 dark:border-[#27272A] gap-0.5">
                        <button
                          type="button"
                          onClick={() => setThemeMode('light')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            themeMode === 'light'
                              ? 'bg-white text-zinc-900 shadow-2xs'
                              : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
                          }`}
                          title="Modo Claro"
                        >
                          <Sun className="w-3 h-3 text-amber-500" />
                          <span>Claro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeMode('sepia')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            themeMode === 'sepia'
                              ? 'bg-[#EAE0C8] text-[#2C221E] shadow-2xs font-extrabold'
                              : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-amber-800'
                          }`}
                          title="Modo Sepia"
                        >
                          <BookOpen className="w-3 h-3 text-amber-700" />
                          <span>Sepia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeMode('dark')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            themeMode === 'dark'
                              ? 'bg-[#18181F] text-white border border-[#27272A] shadow-2xs'
                              : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-white'
                          }`}
                          title="Modo AMOLED"
                        >
                          <Moon className="w-3 h-3 text-indigo-400" />
                          <span>AMOLED</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5. Clean Footer with Version & Sign Out */}
                  <div className="border-t border-zinc-200/80 dark:border-[#27272A] mt-2 pt-2 flex items-center justify-between gap-2">
                    {onOpenVersionModal ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          onOpenVersionModal();
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-mono tabular-nums font-semibold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-[#18181F] transition cursor-pointer"
                        title="Ver historial de novedades y versiones"
                      >
                        <span>v{CURRENT_APP_VERSION}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-sans font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          Alfa
                        </span>
                      </button>
                    ) : (
                      <span className="px-2 text-[10.5px] font-mono tabular-nums text-zinc-400">
                        v{CURRENT_APP_VERSION} (Alfa)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        handleLogout();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer active:scale-95"
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-[#27272A] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[calc(env(safe-area-inset-bottom,0px)+4px)] pt-1.5 px-2 select-none"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto gap-1">
          {/* 1. Ministerio (Menú Principal del Publicador) */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            aria-label="Ir a Mi Ministerio"
            aria-current={activeTab === 'inicio' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'inicio' ||
              activeTab === 'cronometro_ministerio' ||
              activeTab === 'revisitas' ||
              activeTab === 'estudios_biblicos'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5]'
            }`}
          >
            {(activeTab === 'inicio' ||
              activeTab === 'cronometro_ministerio' ||
              activeTab === 'revisitas' ||
              activeTab === 'estudios_biblicos') && (
              <>
                <motion.span
                  layoutId="mobileBottomNavActivePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-[#18181F] border border-indigo-200/60 dark:border-indigo-500/25 pointer-events-none"
                />
                <motion.span
                  layoutId="mobileBottomNavTopBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400 pointer-events-none"
                />
              </>
            )}
            <Compass className="w-5 h-5 stroke-[2] relative z-10" />
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold relative z-10">Ministerio</span>
          </button>

          {/* 2. Mi Congregación (Informe, próximos privilegios, anuncios y eventos) */}
          <button
            type="button"
            onClick={() => handleSelectTab('panorama_general')}
            aria-label="Ir a Mi Congregación"
            aria-current={activeTab === 'panorama_general' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'panorama_general'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5]'
            }`}
          >
            {activeTab === 'panorama_general' && (
              <>
                <motion.span
                  layoutId="mobileBottomNavActivePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-[#18181F] border border-indigo-200/60 dark:border-indigo-500/25 pointer-events-none"
                />
                <motion.span
                  layoutId="mobileBottomNavTopBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400 pointer-events-none"
                />
              </>
            )}
            <div className="relative z-10">
              <LayoutDashboard className="w-5 h-5 stroke-[2]" />
              {conflicts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#09090B] animate-pulse" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold relative z-10">Congregación</span>
          </button>

          {/* 3. Reuniones (Programación) */}
          <button
            type="button"
            onClick={() => handleSelectTab('programacion')}
            aria-label="Ir a Programación de Reuniones"
            aria-current={activeTab === 'programacion' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'programacion' || activeTab === 'clm_vmc' || activeTab === 's89' || activeTab === 'discursos' || activeTab === 'hospitalidad'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5]'
            }`}
          >
            {(activeTab === 'programacion' ||
              activeTab === 'clm_vmc' ||
              activeTab === 's89' ||
              activeTab === 'discursos' ||
              activeTab === 'hospitalidad') && (
              <>
                <motion.span
                  layoutId="mobileBottomNavActivePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-[#18181F] border border-indigo-200/60 dark:border-indigo-500/25 pointer-events-none"
                />
                <motion.span
                  layoutId="mobileBottomNavTopBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400 pointer-events-none"
                />
              </>
            )}
            <ClipboardList className="w-5 h-5 stroke-[2] relative z-10" />
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold relative z-10">Reuniones</span>
          </button>

          {/* 4. Calendario */}
          <button
            type="button"
            onClick={() => handleSelectTab('calendario')}
            aria-label="Ir a Calendario de la Congregación"
            aria-current={activeTab === 'calendario' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'calendario'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5]'
            }`}
          >
            {activeTab === 'calendario' && (
              <>
                <motion.span
                  layoutId="mobileBottomNavActivePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-[#18181F] border border-indigo-200/60 dark:border-indigo-500/25 pointer-events-none"
                />
                <motion.span
                  layoutId="mobileBottomNavTopBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400 pointer-events-none"
                />
              </>
            )}
            <div className="relative z-10">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold relative z-10">Calendario</span>
          </button>

          {/* 5. Menú (Abre/Cierra Bottom Sheet ergonómico de una sola mano) */}
          <button
            type="button"
            onClick={() => handleSelectTab('menu')}
            aria-label="Ir al Menú completo de la congregación"
            aria-current={activeTab === 'menu' ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 cursor-pointer relative min-h-[46px] active:scale-95 ${
              activeTab === 'menu'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5]'
            }`}
          >
            {activeTab === 'menu' && (
              <>
                <motion.span
                  layoutId="mobileBottomNavActivePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-indigo-50/90 dark:bg-[#18181F] border border-indigo-200/60 dark:border-indigo-500/25 pointer-events-none"
                />
                <motion.span
                  layoutId="mobileBottomNavTopBar"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400 pointer-events-none"
                />
              </>
            )}
            <div className="relative z-10">
              <Menu className="w-5 h-5 stroke-[2]" />
              {activeTab !== 'menu' && (pendingRequestsCount > 0 || pinnedNoticesCount > 0 || overdueTerritoriesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-[#09090B]" />
              )}
            </div>
            <span className="text-[10.5px] mt-0.5 leading-tight font-semibold relative z-10">
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
