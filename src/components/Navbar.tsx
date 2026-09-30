// src/components/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
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
  Landmark,
  Flame,
  Package,
  Search,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

export type ActiveTab =
  | 'programacion'
  | 's89'
  | 'publicadores'
  | 'grupos_servicio'
  | 'territorios'
  | 'visita_sc'
  | 'memorial_asambleas'
  | 'discursos'
  | 'carritos'
  | 'asistencia'
  | 'informes_servicio'
  | 'tarjetas_s21'
  | 'cuentas'
  | 'literatura'
  | 'limpieza_deberes'
  | 'tablero_anuncios'
  | 'conflictos'
  | 'equidad'
  | 'exportar_pdf'
  | 'mi_vista'
  | 'ajustes';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenConflictsModal: () => void;
  onOpenQrModal?: () => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenSearchModal: () => void;
  onOpenRoleModal?: () => void;
  onOpenThemeModal?: () => void;
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
  onOpenConflictsModal,
  onOpenQrModal,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenSearchModal,
  onOpenRoleModal,
  onOpenThemeModal,
}) => {
  const { user, signInWithGoogle, signOutUser, activeRole, effectiveRoleInfo } = useAuth();
  const { settings, conflicts, syncStatus, notices, territories } = useCongregation();
  const { themeMode, toggleTheme, isDark, isCabinaMode } = useTheme();

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

  // Structured Theocratic Departments
  const departments: Department[] = [
    {
      id: 'reuniones',
      title: 'Reuniones',
      shortTitle: 'Reuniones',
      icon: Calendar,
      tabIds: ['programacion', 's89', 'discursos'],
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
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros',
      shortTitle: 'Secretaría',
      icon: FileText,
      tabIds: ['publicadores', 'tarjetas_s21', 'informes_servicio', 'asistencia', 'cuentas'],
      items: [
        {
          id: 'publicadores',
          label: 'Directorio de Publicadores',
          description: 'Privilegios, teléfonos y responsabilidades',
          icon: Users,
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
      tabIds: ['limpieza_deberes', 'visita_sc', 'memorial_asambleas', 'tablero_anuncios'],
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Deberes & Limpieza',
          description: 'Sonido, video, microfonistas, acomodadores y aseo',
          icon: Brush,
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

  // Determine which department is currently active
  const activeDepartment = departments.find((dept) => dept.tabIds.includes(activeTab));

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const toggleDropdown = (deptId: string) => {
    setOpenDropdown(openDropdown === deptId ? null : deptId);
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs" ref={dropdownRef}>
        <div className="w-full px-3 sm:px-6 lg:px-8 2xl:px-12">
          {/* Top Primary Bar */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="truncate">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                  <span className="truncate">{settings.congregationName || 'Gestor Teocrático'}</span>
                  <span className="hidden xl:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Kongre
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  {settings.midweekMeetingDay} {settings.midweekMeetingTime} • {settings.weekendMeetingDay} {settings.weekendMeetingTime}
                </p>
              </div>
            </div>

            {/* Global Search Bar (Cmd + K / Ctrl + K) */}
            <div className="flex-1 max-w-md mx-1 sm:mx-4">
              <button
                onClick={onOpenSearchModal}
                className="w-full flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal transition-all group cursor-pointer shadow-2xs hover:border-indigo-300"
                title="Buscador global rápido (Cmd + K / Ctrl + K)"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
                  <span className="truncate text-slate-500 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white">
                    Buscar publicador, territorio, discurso...
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 shrink-0 pl-2">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xs">
                    Ctrl K
                  </kbd>
                </div>
              </button>
            </div>

            {/* Quick Tools & Session Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Conflict quick alert button */}
              {conflicts.length > 0 ? (
                <button
                  onClick={onOpenConflictsModal}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors text-xs font-bold shadow-xs animate-pulse"
                  title="Ver conflictos detectados"
                >
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  <span>{conflicts.length}</span>
                  <span className="hidden md:inline">{conflicts.length === 1 ? 'conflicto' : 'cruces'}</span>
                </button>
              ) : (
                <div className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>0 cruces</span>
                </div>
              )}

              {/* Quick Hall Screen (Kiosk) */}
              {onOpenKioskModal && (
                <button
                  onClick={onOpenKioskModal}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-colors border border-indigo-200"
                  title="Abrir Pantalla Kiosco para monitores del Salón del Reino"
                >
                  <Tv className="w-4 h-4 text-indigo-600" />
                  <span className="hidden lg:inline">Pantalla Salón</span>
                </button>
              )}

              {/* Quick Stage Timer */}
              {onOpenTimerModal && (
                <button
                  onClick={onOpenTimerModal}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
                  title="Abrir Cronómetro oficial de Presidencia (Modo Atril)"
                >
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline">Modo Atril</span>
                </button>
              )}

              {/* Cloud Sync Indicator */}
              <div className="hidden xl:flex items-center text-xs font-medium">
                {syncStatus === 'synced' && (
                  <span className="flex items-center gap-1 text-slate-600" title="Sincronizado con Firebase Firestore">
                    <CloudCheck className="w-4 h-4 text-emerald-600" />
                  </span>
                )}
                {syncStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-indigo-600 animate-pulse" title="Guardando cambios...">
                    <CloudUpload className="w-4 h-4" />
                  </span>
                )}
                {syncStatus === 'offline' && (
                  <span className="flex items-center gap-1 text-slate-500" title="Guardado localmente en este dispositivo">
                    <WifiOff className="w-4 h-4 text-amber-500" />
                  </span>
                )}
              </div>

              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* Theme Toggle Button (Light / Dark / Cabina & Acomodadores) */}
              <button
                onClick={onOpenThemeModal || toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                title={`Tema actual: ${
                  themeMode === 'light'
                    ? 'Modo Claro (Día)'
                    : themeMode === 'dark'
                    ? 'Modo Oscuro (Noche)'
                    : 'Modo Cabina & Acomodadores (Auditorio)'
                }. Clic para cambiar.`}
              >
                {themeMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Tv className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              {/* Theocratic Role Pill Button */}
              {onOpenRoleModal && (
                <button
                  onClick={onOpenRoleModal}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:opacity-95 active:scale-95 ${effectiveRoleInfo.badgeColor}`}
                  title={`Rol activo: ${effectiveRoleInfo.name}. Clic para cambiar de rol o gestionar permisos.`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{effectiveRoleInfo.shortName}</span>
                  <ChevronDown className="w-3 h-3 opacity-80" />
                </button>
              )}

              {/* Google Login / Profile */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={signOutUser}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Google</span>
                </button>
              )}

              {/* Mobile Drawer Trigger (Hamburger) */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Abrir menú teocrático"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DESKTOP & TABLET DEPARTMENTAL NAVIGATION BAR */}
          <nav className="hidden md:flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1 pb-1 text-xs">
            <div className="flex items-center space-x-1 lg:space-x-1.5">
              {departments.map((dept) => {
                const Icon = dept.icon;
                const isDeptActive = dept.tabIds.includes(activeTab);
                const isDropdownOpen = openDropdown === dept.id;

                // Total badges inside department
                const deptBadgesCount = dept.items.reduce((acc, curr) => {
                  return acc + (typeof curr.badge === 'number' ? curr.badge : 0);
                }, 0);

                return (
                  <div key={dept.id} className="relative">
                    <button
                      onClick={() => toggleDropdown(dept.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        isDeptActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                          : isDropdownOpen
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isDeptActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{dept.title}</span>
                      {deptBadgesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {deptBadgesCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isDropdownOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Department Dropdown Menu Panel */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            {dept.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {dept.items.length} módulos
                          </span>
                        </div>

                        <div className="p-1 space-y-0.5">
                          {dept.items.map((item) => {
                            const SubIcon = item.icon;
                            const isItemActive = activeTab === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelectTab(item.id)}
                                className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                                  isItemActive
                                    ? 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-bold'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    isItemActive
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <SubIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-semibold truncate leading-tight">
                                      {item.label}
                                    </span>
                                    {item.badge !== undefined && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                          item.badgeColor || 'bg-amber-500 text-white'
                                        }`}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate leading-snug">
                                    {item.description}
                                  </p>
                                </div>
                                {isItemActive && (
                                  <Check className="w-4 h-4 text-indigo-600 shrink-0 self-center" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Extra departmental helper row */}
                        {dept.id === 'reuniones' && (
                          <div className="mt-1 pt-1.5 border-t border-slate-100 px-2 flex items-center justify-between text-[11px]">
                            {onOpenKioskModal && (
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  onOpenKioskModal();
                                }}
                                className="flex-1 py-1.5 text-center font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <Tv className="w-3.5 h-3.5" />
                                <span>Pantalla Salón</span>
                              </button>
                            )}
                            {onOpenTimerModal && (
                              <button
                                onClick={() => {
                                  setOpenDropdown(null);
                                  onOpenTimerModal();
                                }}
                                className="flex-1 py-1.5 text-center font-medium text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                <span>Cronómetro</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Active Tab Breadcrumb Badge */}
            <div className="hidden lg:flex items-center gap-2 pr-2 text-slate-500">
              <span className="text-[11px]">Módulo actual:</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                {activeDepartment?.shortTitle} ›{' '}
                <span className="text-indigo-600">
                  {departments
                    .flatMap((d) => d.items)
                    .find((i) => i.id === activeTab)?.label || activeTab}
                </span>
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden shadow-lg pb-safe">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {/* 1. Programa */}
          <button
            onClick={() => setActiveTab('programacion')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors min-h-[48px] ${
              activeTab === 'programacion' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'programacion' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] tracking-tight mt-1">Programa</span>
          </button>

          {/* 2. Discursos */}
          <button
            onClick={() => setActiveTab('discursos')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors min-h-[48px] ${
              activeTab === 'discursos' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mic className={`w-5 h-5 ${activeTab === 'discursos' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] tracking-tight mt-1">Discursos</span>
          </button>

          {/* 3. Publicadores */}
          <button
            onClick={() => setActiveTab('publicadores')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors min-h-[48px] ${
              activeTab === 'publicadores' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'publicadores' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] tracking-tight mt-1">Hermanos</span>
          </button>

          {/* 4. Asistencia */}
          <button
            onClick={() => setActiveTab('asistencia')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors min-h-[48px] ${
              activeTab === 'asistencia' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'asistencia' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="text-[10px] tracking-tight mt-1">Asistencia</span>
          </button>

          {/* 5. Menú Departamentos */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative min-h-[48px] cursor-pointer"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="text-[10px] tracking-tight mt-1">Menú</span>
            {conflicts.length > 0 && (
              <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>
        </div>
      </nav>

      {/* MOBILE BOTTOM SHEET / FULL DRAWER GROUPED BY DEPARTMENTS */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-bottom duration-200">
            {/* Grab handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

            {/* Header */}
            <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Menú Teocrático
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{settings.congregationName}</h3>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search Button in Drawer */}
            <div className="px-4 pt-3 pb-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSearchModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Buscar cualquier publicador, bosquejo o fecha...</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Buscar
                </span>
              </button>
            </div>

            {/* Quick Hall Tools Row with Theme */}
            <div className="px-4 pt-2">
              <div className="grid grid-cols-4 gap-2">
                {onOpenKioskModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenKioskModal();
                    }}
                    className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Tv className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200">Pantalla</span>
                  </button>
                )}

                {onOpenQrModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenQrModal();
                    }}
                    className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">QR</span>
                  </button>
                )}

                {onOpenTimerModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTimerModal();
                    }}
                    className="p-2 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold text-white">Atril</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenThemeModal) onOpenThemeModal();
                    else toggleTheme();
                  }}
                  className="p-2 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
                >
                  {themeMode === 'light' ? (
                    <Sun className="w-4 h-4 text-amber-600" />
                  ) : themeMode === 'dark' ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Tv className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-[10px] font-bold text-amber-900 dark:text-slate-200">
                    {themeMode === 'light' ? 'Claro' : themeMode === 'dark' ? 'Oscuro' : 'Cabina'}
                  </span>
                </button>
              </div>

              {/* Install PWA Button in Mobile Drawer */}
              <div className="pt-2 space-y-2">
                <PWAInstallButton variant="drawer" />

                {onOpenRoleModal && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenRoleModal();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${effectiveRoleInfo.badgeColor}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span className="truncate">Rol: {effectiveRoleInfo.name}</span>
                    </div>
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full shrink-0 ml-1">Cambiar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Department Accordion Sections */}
            <div className="overflow-y-auto p-4 space-y-4">
              {departments.map((dept) => {
                const DeptIcon = dept.icon;
                const isDeptActive = dept.tabIds.includes(activeTab);

                return (
                  <div key={dept.id} className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DeptIcon
                          className={`w-4 h-4 ${
                            isDeptActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          {dept.title}
                        </span>
                      </div>
                      {isDeptActive && (
                        <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                          Activo
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dept.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isItemActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center justify-between p-3 text-left transition-colors min-h-[44px] cursor-pointer ${
                              isItemActive
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-bold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isItemActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold truncate leading-tight">
                                  {item.label}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.badge !== undefined && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    item.badgeColor || 'bg-amber-500 text-white'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Status & Google Login in Drawer */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Estado de Guardado:</span>
                  {syncStatus === 'synced' && (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                      <CloudCheck className="w-4 h-4" /> En la nube (Firestore)
                    </span>
                  )}
                  {syncStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold animate-pulse">
                      <CloudUpload className="w-4 h-4" /> Guardando...
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                      <WifiOff className="w-4 h-4" /> Guardado localmente
                    </span>
                  )}
                </div>

                {user ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{user.displayName || 'Coordinador'}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[200px]">{user.email}</p>
                    </div>
                    <button
                      onClick={signOutUser}
                      className="px-2.5 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-semibold cursor-pointer"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Conectar cuenta de Google</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
