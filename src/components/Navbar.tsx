// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { PWAInstallButton } from './PWAInstallButton';
import { getFriendlyCongregationName } from '../utils/theocraticSecurity';
import {
  Calendar,
  Users,
  AlertTriangle,
  FileText,
  UserCheck,
  Settings,
  Sparkles,
  CloudCheck,
  CloudUpload,
  WifiOff,
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
  ChevronRight,
  ChevronDown,
  Award,
  Compass,
  MapPin,
  Map,
  FileCheck,
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
  | 'programacion'
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
}) => {
  const { user, userProfile, signInWithGoogle, signOutUser, activeRole, effectiveRoleInfo } = useAuth();
  const { settings, updateSettings, conflicts, syncStatus, notices, territories, accountLinkRequests, auxPioneerRequests } = useCongregation();
  const pendingRequestsCount = accountLinkRequests.filter((r) => r.status === 'pending').length;
  const pendingAuxPioneersCount = (auxPioneerRequests || []).filter((r) => (r.status || r.estado || 'pendiente') === 'pendiente').length;
  const { themeMode, toggleTheme, isDark, isCabinaMode } = useTheme();
  const { isPinEnabled, lockSession } = useSecurity();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterCategory = (catId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
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

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Full departments for the mobile drawer
  const departments: Department[] = [
    {
      id: 'reuniones',
      title: 'Reuniones',
      shortTitle: 'Reuniones',
      icon: Calendar,
      tabIds: ['programacion', 's89', 'discursos', 'hospitalidad'],
      items: [
        {
          id: 'programacion',
          label: 'Programa Semanal',
          description: 'Vida y Ministerio Cristianos y Fin de Semana',
          icon: Calendar,
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
          label: 'Deberes & Limpieza',
          description: 'Sonido, video, microfonistas, acomodadores y aseo',
          icon: Brush,
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
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'ajustes'],
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
          label: 'Mi Portal de Publicador',
          description: 'Ver mis próximas asignaciones y tareas asignadas',
          icon: UserCheck,
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

  // Categorías principales teocráticas integradas en la barra lateral con flyout al pasar el puntero
  const categoriesList = [
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
      icon: Calendar,
      primaryTab: 'programacion' as ActiveTab,
      tabIds: ['programacion', 's89', 'discursos'] as ActiveTab[],
      badge: undefined,
      badgeColor: undefined,
      colorClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400',
      items: departments[0].items,
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
      items: departments[1].items,
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
      items: departments[2].items,
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
      items: departments[3].items,
    },
    {
      id: 'supervision',
      title: 'Supervisión & Control',
      icon: AlertTriangle,
      primaryTab: 'conflictos' as ActiveTab,
      tabIds: ['conflictos', 'equidad', 'exportar_pdf', 'mi_vista', 'ajustes'] as ActiveTab[],
      badge: conflicts.length || undefined,
      badgeColor: 'bg-amber-500 text-white',
      colorClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400',
      items: departments[4].items,
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const displayCongregationName = getFriendlyCongregationName(settings.congregationName, 'Usme');

  // Friendly title for the active tab under the congregation name
  const getCurrentTabSubtitle = (tab: ActiveTab): string => {
    switch (tab) {
      case 'inicio':
        return 'Resumen';
      case 'programacion':
        return 'Calendario';
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
        return 'Deberes & Limpieza';
      case 'visita_sc':
        return 'Visita del SC';
      case 'ajustes':
        return 'Ajustes';
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
        <aside className="hidden md:flex flex-col items-center fixed left-0 top-0 bottom-0 w-16 lg:w-18 z-40 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 py-3 select-none transition-all duration-200 overflow-visible">
          {/* Top Purple Squircle Button */}
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-95 mb-4 shrink-0"
            title="Kongre - Panorama General"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {/* Vertical Categories Stack */}
          <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-visible py-1">
            {categoriesList.map((cat, idx) => {
              const Icon = cat.icon;
              const isCatActive = cat.tabIds.includes(activeTab);
              const isHovered = hoveredCategory === cat.id;
              const hasSubItems = cat.items && cat.items.length > 0;
              const isNearBottom = idx >= 4;

              return (
                <div
                  key={cat.id}
                  className="relative w-full flex justify-center"
                  onMouseEnter={() => handleMouseEnterCategory(cat.id)}
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
                      onMouseEnter={() => handleMouseEnterCategory(cat.id)}
                      onMouseLeave={handleMouseLeaveCategory}
                      className={`absolute left-full ml-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                        isNearBottom ? 'bottom-0' : 'top-0'
                      }`}
                    >
                      {/* Invisible hover bridge to prevent pointer exit */}
                      <div className="absolute -left-3 top-0 bottom-0 w-3 bg-transparent" />

                      {/* Header */}
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${cat.colorClass} flex items-center justify-center font-bold`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              {cat.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {cat.items.length} módulos
                            </span>
                          </div>
                        </div>
                        {cat.badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeColor || 'bg-amber-500 text-white'} animate-pulse`}>
                            {cat.badge}
                          </span>
                        )}
                      </div>

                      {/* Modules list */}
                      <div className="p-1 space-y-1 mt-1 max-h-[70vh] overflow-y-auto scrollbar-none">
                        {cat.items.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                handleSelectTab(sub.id);
                                setHoveredCategory(null);
                              }}
                              className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isSubActive
                                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSubActive
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                <SubIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold truncate">{sub.label}</span>
                                  {sub.badge && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                                        sub.badgeColor || 'bg-indigo-600 text-white'
                                      }`}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
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

          {/* Bottom Quick Settings & Role Indicator */}
          <div className="mt-auto pt-2 flex flex-col items-center gap-2 border-t border-slate-100 dark:border-slate-800 w-full shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('ajustes')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'ajustes'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Ajustes de la Congregación"
            >
              <Settings className="w-4 h-4 stroke-[1.8]" />
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================================
          2. TOP HEADER BAR (EXACT REFERENCE DESIGN)
         ========================================================================= */}
      <header className={`sticky top-0 z-30 w-full ${isSidebarVisible ? 'md:pl-16 lg:pl-18' : 'pl-0'} bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-all duration-200`}>
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
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

            {/* Congregation title & current view */}
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                {displayCongregationName}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium leading-none capitalize truncate mt-0.5">
                {getCurrentTabSubtitle(activeTab)}
              </p>
            </div>
          </div>

          {/* Center: Segmented Capsule Switcher ([ Resumen ] [ Calendario ] [ Estadísticas ]) */}
          <div className="hidden sm:inline-flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSelectTab('inicio')}
              className={`px-4 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'inicio'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Resumen
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab('programacion')}
              className={`px-4 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'programacion'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Calendario
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab('asistencia')}
              className={`px-4 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'asistencia'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Estadísticas
            </button>
          </div>

          {/* Right: Quick Utility Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Icon */}
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Buscar (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Settings Icon */}
            <button
              type="button"
              onClick={() => handleSelectTab('ajustes')}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Ajustes de la Congregación"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Bell Notifications with orange dot */}
            <button
              type="button"
              onClick={onOpenConflictsModal}
              className="relative p-1.5 sm:p-2 rounded-xl text-amber-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Notificaciones & Cruces"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </button>

            {/* Session Lock Button (Green Lock) */}
            <button
              type="button"
              onClick={lockSession}
              className="p-1.5 sm:p-2 rounded-xl text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
              title="Bloquear sesión del Salón"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Cloud Sync Status (Green Cloud) */}
            <div className="p-1.5 sm:p-2 text-emerald-500" title="Sincronizado con Firebase Firestore">
              <CloudCheck className="w-4 h-4" />
            </div>

            {/* App Móvil Capsule Pill Button */}
            {onOpenQrModal ? (
              <button
                type="button"
                onClick={onOpenQrModal}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition cursor-pointer"
                title="Abrir código QR y acceso App Móvil"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>App Móvil</span>
              </button>
            ) : (
              <div className="hidden lg:flex items-center">
                <PWAInstallButton />
              </div>
            )}

            {/* Dark Mode Moon / Sun Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            {user && (
              <button
                type="button"
                onClick={signOutUser}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* User Purple Avatar Circle (with Initial H or user name) */}
            <button
              type="button"
              onClick={() => handleSelectTab('ajustes')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer hover:ring-2 hover:ring-indigo-400/50 transition shrink-0 ml-1"
              title={userProfile?.displayName || user?.displayName || user?.email || 'Héctor'}
            >
              {(userProfile?.photoURL || user?.photoURL) ? (
                <img
                  src={(userProfile?.photoURL || user?.photoURL) || undefined}
                  alt="Usuario"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {((userProfile?.displayName || user?.displayName || user?.email || 'H').charAt(0)).toUpperCase()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. FULL SLIDE-OVER DRAWER (STRICTLY MOBILE ONLY: md:hidden)
         ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {displayCongregationName}
                  </h3>
                  <p className="text-[11px] text-slate-400">Menú Teocrático de Navegación</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Department Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

              {departments.map((dept) => {
                const DeptIcon = dept.icon;
                return (
                  <div key={dept.id} className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                      <DeptIcon className="w-3.5 h-3.5 text-indigo-500" />
                      {dept.title}
                    </span>
                    <div className="space-y-1 pt-1">
                      {dept.items.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSelectTab(sub.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition cursor-pointer ${
                              isSubActive
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <SubIcon className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {Boolean(sub.badge) && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Kongre Teocrático</span>
              <button
                type="button"
                onClick={() => handleSelectTab('ajustes')}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Ajustes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
