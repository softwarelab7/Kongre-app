// src/components/MobileMenuTab.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { ActiveTab } from './Navbar';
import { isTabAllowedForRole, TheocraticRole } from '../utils/rbac';
import { getFriendlyCongregationName, isGenericIdentityName } from '../utils/theocraticSecurity';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { insertAuditLog } from '../services/auditLogService';
import { NAV_ICONS } from '../NavIcons';
import {
  Compass,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  User,
  Shield,
  KeyRound,
  Timer,
  Tv,
  QrCode,
  AlertTriangle,
  Sun,
  Moon,
  Search,
  X,
  Lock,
  LogOut,
  ChevronRight,
  Sparkles,
  Wifi,
  WifiOff,
  Building2,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
  FolderLock,
  Share2,
} from 'lucide-react';

interface MobileMenuTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenConflictsModal: () => void;
  onOpenQrModal?: () => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenPinsModal?: () => void;
  onOpenRoleModal?: () => void;
  onOpenVersionModal?: () => void;
  onOpenQueueModal?: () => void;
}

interface MenuItemDef {
  id: ActiveTab;
  label: string;
  description: string;
  icon: any;
  badge?: number | string;
  badgeColor?: string;
}

interface DepartmentCategory {
  id: string;
  title: string;
  shortTitle: string;
  icon: any;
  colorClass: string;
  items: MenuItemDef[];
}

export const MobileMenuTab: React.FC<MobileMenuTabProps> = ({
  setActiveTab,
  onOpenConflictsModal,
  onOpenQrModal,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenPinsModal,
  onOpenRoleModal,
  onOpenVersionModal,
  onOpenQueueModal,
}) => {
  const {
    user,
    userProfile,
    activeRole,
    effectiveRoleInfo,
    currentBrotherName,
    signOutUser,
  } = useAuth();

  const {
    settings,
    conflicts,
    notices,
    territories,
    accountLinkRequests,
    auxPioneerRequests,
    isOnline,
    isDemoMode,
  } = useCongregation();

  const { toggleTheme, isDark } = useTheme();
  const { lockSession } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const rawCongregationName = getFriendlyCongregationName(settings.congregationName, 'Congregación Central');
  const displayCongregationName = rawCongregationName
    .replace(/\s*\((?:Demostración|Demo|Prueba)\)/gi, '')
    .trim() || 'Congregación Central';

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
  const overdueTerritoriesCount = territories.filter(
    (t) =>
      t.status === 'vencido' ||
      (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
  ).length;
  const pinnedNoticesCount = notices.filter((n) => n.pinned).length;
  const pendingAuxPioneersCount = (auxPioneerRequests || []).filter(
    (r) => (r.status || r.estado || 'pendiente') === 'pendiente'
  ).length;

  const handleLogout = async () => {
    try {
      await insertAuditLog({
        accion: 'CIERRE_SESION',
        hermano_nid: user?.email || activeRole || 'usuario',
        hermano_nombre: effectiveDisplayName || user?.displayName || 'Hermano',
        modulo: 'auth',
        detalles: 'Sesión cerrada explícitamente desde la página de menú.',
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
      localStorage.removeItem('kongre_active_role_v1');
      localStorage.removeItem('kongre_active_roles_v1');
      localStorage.removeItem('kongre_role_session_sig_v1');
      sessionStorage.removeItem('kongre_session_locked');
      sessionStorage.setItem('kongre_show_landing', 'true');
    } catch {}
    window.location.reload();
  };

  const departments: DepartmentCategory[] = useMemo(() => [
    {
      id: 'ministerio',
      title: 'Mi Ministerio Personal',
      shortTitle: 'Ministerio',
      icon: NAV_ICONS.inicio,
      colorClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60',
      items: [
        {
          id: 'inicio',
          label: 'Mi Ministerio • Resumen',
          description: 'Registro de horas, informe mensual y metas de predicación',
          icon: NAV_ICONS.inicio,
        },
        {
          id: 'cronometro_ministerio',
          label: 'Cronómetro de Predicación',
          description: 'Temporizador en vivo con registro automático de horas y notas',
          icon: NAV_ICONS.cronometro_ministerio,
        },
        {
          id: 'revisitas',
          label: 'Agenda de Revisitas',
          description: 'Personas interesadas, notas de conversación y recordatorios',
          icon: NAV_ICONS.revisitas,
        },
        {
          id: 'estudios_biblicos',
          label: 'Estudios Bíblicos',
          description: 'Seguimiento pedagógico, lecciones del libro y progreso',
          icon: NAV_ICONS.estudios_biblicos,
        },
        {
          id: 'mi_vista',
          label: 'Mis Asignaciones Personales',
          description: 'Vista directa de tus partes, discursos y deberes en el salón',
          icon: NAV_ICONS.mi_vista,
        },
      ],
    },
    {
      id: 'reuniones',
      title: 'Reuniones y Programación',
      shortTitle: 'Reuniones',
      icon: NAV_ICONS.reuniones,
      colorClass: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/60',
      items: [
        {
          id: 'programacion',
          label: 'Programa de Reuniones',
          description: 'Vida y Ministerio Cristianos y Fin de Semana en un solo programa',
          icon: NAV_ICONS.programacion,
        },
        {
          id: 's89',
          label: 'Hojas S-89 (Asignaciones)',
          description: 'Generación, vista previa en vivo y descarga de hojas estudiantiles',
          icon: NAV_ICONS.s89,
        },
        {
          id: 'discursos',
          label: 'Discursos Públicos',
          description: 'Catálogo de bosquejos, oradores visitantes y coordinación',
          icon: NAV_ICONS.discursos,
        },
        {
          id: 'hospitalidad',
          label: 'Hospitalidad de Oradores',
          description: 'Familias anfitrionas, comidas y acogida de conferenciantes',
          icon: NAV_ICONS.hospitalidad,
        },
        {
          id: 'calendario',
          label: 'Calendario de la Congregación',
          description: 'Cronograma mensual de reuniones, asambleas y eventos',
          icon: NAV_ICONS.calendario,
        },
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros Teocráticos',
      shortTitle: 'Secretaría',
      icon: NAV_ICONS.secretaria,
      colorClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/60',
      items: [
        {
          id: 'estadisticas_secretaria',
          label: 'Resumen de Secretaría',
          description: 'Métricas generales, asistencia, publicadores y gráficos',
          icon: NAV_ICONS.estadisticas_secretaria,
        },
        {
          id: 'publicadores',
          label: 'Directorio de Publicadores',
          description: 'Catálogo oficial, privilegios, teléfonos y responsabilidades',
          icon: NAV_ICONS.publicadores,
        },
        {
          id: 'precursores_auxiliares',
          label: 'Precursores Auxiliares (S-205)',
          description: 'Solicitudes mensuales y aprobación del comité de servicio',
          icon: NAV_ICONS.precursores_auxiliares,
          badge: pendingAuxPioneersCount || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'tarjetas_s21',
          label: 'Tarjetas S-21',
          description: 'Registro de publicador de la congregación oficial',
          icon: NAV_ICONS.tarjetas_s21,
        },
        {
          id: 'informe_s1',
          label: 'Informe S-1 Sucursal',
          description: 'Consolidación mensual de asistencia y predicación para JW Hub',
          icon: NAV_ICONS.informe_s1,
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
          description: 'Registro de asistencia semanal a reuniones y promedios',
          icon: NAV_ICONS.asistencia,
        },
        {
          id: 'cuentas',
          label: 'Cuentas S-26',
          description: 'Libro de contabilidad teocrático, donaciones y sucursal',
          icon: NAV_ICONS.cuentas,
        },
      ],
    },
    {
      id: 'predicacion',
      title: 'Predicación y Territorios',
      shortTitle: 'Predicación',
      icon: NAV_ICONS.predicacion,
      colorClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Asignaciones de territorio, mapas, vencimientos y no visitas',
          icon: NAV_ICONS.territorios,
          badge: overdueTerritoriesCount || undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'grupos_servicio',
          label: 'Grupos de Servicio del Campo',
          description: 'Superintendentes de grupo, asignaciones de publicadores y apoyo',
          icon: NAV_ICONS.grupos_servicio,
        },
        {
          id: 'carritos',
          label: 'Carritos de Predicación Pública',
          description: 'Horarios de turnos, puntos estratégicos y parejas asignadas',
          icon: NAV_ICONS.carritos,
        },
        {
          id: 'literatura',
          label: 'Literatura y Existencias (S-14)',
          description: 'Control de inventario de biblias, libros y revistas',
          icon: NAV_ICONS.literatura,
        },
      ],
    },
    {
      id: 'salon',
      title: 'Salón del Reino y Operaciones',
      shortTitle: 'Salón',
      icon: NAV_ICONS.salon,
      colorClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60',
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Servicios y Limpieza del Salón',
          description: 'Turnos semanales de aseo por grupo y lista de tareas',
          icon: NAV_ICONS.limpieza_deberes,
        },
        {
          id: 'panel_electrico',
          label: 'Panel Eléctrico y Climatización',
          description: 'Horarios de encendido, aire acondicionado e interruptores',
          icon: NAV_ICONS.panel_electrico,
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento Preventivo',
          description: 'Inspecciones periódicas, reparaciones e infraestructura',
          icon: NAV_ICONS.mantenimiento,
        },
        {
          id: 'tablero_anuncios',
          label: 'Tablero de Anuncios y Cartas',
          description: 'Cartas oficiales de sucursal, anuncios de asamblea y avisos',
          icon: NAV_ICONS.tablero_anuncios,
          badge: pinnedNoticesCount || undefined,
          badgeColor: 'bg-indigo-600 text-white',
        },
      ],
    },
    {
      id: 'supervision',
      title: 'Supervisión, Teocracia y Ajustes',
      shortTitle: 'Supervisión',
      icon: NAV_ICONS.supervision,
      colorClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60',
      items: [
        {
          id: 'panorama_general',
          label: 'Mi Congregación • Panorama',
          description: 'Vista global del estado espiritual, anuncios y avisos activos',
          icon: NAV_ICONS.panorama_general,
        },
        {
          id: 'visita_sc',
          label: 'Visita del Superintendente de Circuito',
          description: 'Cronograma, informe para la visita, reuniones especiales',
          icon: NAV_ICONS.visita_sc,
        },
        {
          id: 'memorial_asambleas',
          label: 'Conmemoración y Asambleas',
          description: 'Preparativos para la Conmemoración y asignaciones de asamblea',
          icon: NAV_ICONS.memorial_asambleas,
        },
        {
          id: 'conflictos',
          label: 'Centro de Conflictos Teocráticos',
          description: 'Doble asignación de hermanos o partes no cubiertas',
          icon: NAV_ICONS.conflictos,
          badge: conflicts.length || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'equidad',
          label: 'Panel de Equidad de Asignaciones',
          description: 'Gráficas de rotación justa de partes y discursos',
          icon: NAV_ICONS.equidad,
        },
        {
          id: 'exportar_pdf',
          label: 'Formatos Oficiales (Local) y PDF',
          description: 'Visualización y descarga local de S-21, S-89, S-140 y S-88',
          icon: NAV_ICONS.exportar_pdf,
        },
        {
          id: 'roles',
          label: 'Roles Teocráticos y PINs',
          description: 'Asignación de cargos, PINs personales y acceso por departamentos',
          icon: NAV_ICONS.roles,
        },
        {
          id: 'ajustes',
          label: 'Ajustes de la Congregación',
          description: 'Horarios de reuniones, datos de sucursal y copias de seguridad',
          icon: NAV_ICONS.ajustes,
        },
        {
          id: 'perfil',
          label: 'Mi Perfil de Usuario',
          description: 'Foto de perfil, nombre visible y canales de contacto personal',
          icon: NAV_ICONS.perfil,
        },
      ],
    },
  ], [conflicts.length, overdueTerritoriesCount, pinnedNoticesCount, pendingAuxPioneersCount]);

  // Filtered list based on search or category
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return departments
      .map((dept) => {
        // Filter by category selection if not 'all'
        if (selectedCategory !== 'all' && dept.id !== selectedCategory) {
          return null;
        }

        // Filter items by search query
        const matchingItems = dept.items.filter((item) => {
          if (!q) return true;
          return (
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q)
          );
        });

        if (matchingItems.length === 0) return null;

        return {
          ...dept,
          items: matchingItems,
        };
      })
      .filter((dept): dept is DepartmentCategory => dept !== null);
  }, [departments, searchQuery, selectedCategory]);

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-[85vh] pb-28 pt-1 max-w-4xl mx-auto px-3 sm:px-4 space-y-4 select-none animate-in fade-in duration-200">
      
      {/* =========================================================================
          1. IDENTITY & SPIRITUAL PROFILE BANNER (Tactile Mobile Hero)
         ========================================================================= */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 pointer-events-none blur-2xl" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          
          {/* User Avatar + Identity details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => handleNavigate('perfil')}
              aria-label="Ver perfil completo de usuario"
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0 overflow-hidden ring-4 ring-indigo-500/15 cursor-pointer active:scale-95 transition-transform"
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
                      alt="Avatar del usuario"
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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {effectiveDisplayName || (isDemoMode ? 'Carlos Mendoza' : 'Hermano')}
                </h2>
                {isDemoMode && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                    Demo
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {displayCongregationName}
              </p>

              {/* Role badge */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleNavigate('roles')}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    activeRole === 'publico'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70'
                  }`}
                  title="Cambiar rol teocrático o PIN"
                >
                  <Shield className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {activeRole === 'publico' ? 'Activar Rol con PIN' : effectiveRoleInfo?.name || 'Publicador'}
                  </span>
                </button>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {isOnline ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Wifi className="w-3 h-3" />
                      <span>Conectado</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <WifiOff className="w-3 h-3" />
                      <span>Modo Local</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Top Actions: Profile, Lock PIN, Dark Mode, LogOut */}
          <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-slate-800 justify-end">
            <button
              type="button"
              onClick={() => handleNavigate('perfil')}
              className="min-h-[38px] px-3 rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Mi Perfil"
            >
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Perfil</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
              title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {!isDemoMode && (
              <button
                type="button"
                onClick={lockSession}
                aria-label="Bloquear sesión con PIN"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-800/60 transition cursor-pointer active:scale-95"
                title="Bloquear sesión con PIN"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-800/60 transition cursor-pointer active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. LIVE SEARCH BAR (Instant Access to any module)
         ========================================================================= */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar sección o herramienta (S-21, S-89, Cuentas, Territorios, PINs)..."
          aria-label="Buscar en el menú de la congregación"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white shadow-2xs placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* =========================================================================
          3. HERRAMIENTAS RÁPIDAS (Quick Theocratic Action Tiles)
         ========================================================================= */}
      {!searchQuery && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Atajos Rápidos Teocráticos
            </h3>
            {onOpenVersionModal && (
              <button
                type="button"
                onClick={onOpenVersionModal}
                className="text-[10.5px] font-mono font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                v{CURRENT_APP_VERSION}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {onOpenPinsModal && (
              <button
                type="button"
                onClick={onOpenPinsModal}
                className="min-h-[58px] p-2 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-amber-300"
              >
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-center leading-tight">PINs</span>
              </button>
            )}

            {onOpenTimerModal && (
              <button
                type="button"
                onClick={onOpenTimerModal}
                className="min-h-[58px] p-2 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-indigo-300"
              >
                <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-[11px] font-bold text-center leading-tight">Atril</span>
              </button>
            )}

            {onOpenKioskModal && (
              <button
                type="button"
                onClick={onOpenKioskModal}
                className="min-h-[58px] p-2 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-emerald-300"
              >
                <Tv className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-center leading-tight">Kiosko</span>
              </button>
            )}

            {onOpenQrModal && (
              <button
                type="button"
                onClick={onOpenQrModal}
                className="min-h-[58px] p-2 rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/60 text-violet-900 dark:text-violet-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-violet-300"
              >
                <QrCode className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="text-[11px] font-bold text-center leading-tight">QR Móvil</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenConflictsModal}
              className="min-h-[58px] p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs relative hover:border-indigo-300"
            >
              <div className="relative">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                {conflicts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] font-bold text-center leading-tight">
                Cruces {conflicts.length > 0 ? `(${conflicts.length})` : ''}
              </span>
            </button>

            {onOpenQueueModal && (
              <button
                type="button"
                onClick={onOpenQueueModal}
                className="min-h-[58px] p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs hover:border-indigo-300"
              >
                <Wifi className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="text-[11px] font-bold text-center leading-tight">Sincronía</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          4. DEPARTMENT CATEGORY FILTER CHIPS
         ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'Todos los Departamentos' },
          { id: 'ministerio', label: 'Ministerio' },
          { id: 'reuniones', label: 'Reuniones' },
          { id: 'secretaria', label: 'Secretaría' },
          { id: 'predicacion', label: 'Predicación' },
          { id: 'salon', label: 'Salón del Reino' },
          { id: 'supervision', label: 'Supervisión' },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          5. COMPLETE CATEGORIZED DEPARTMENTS & MODULES DIRECTORY
         ========================================================================= */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            No se encontraron secciones para &quot;{searchQuery}&quot;
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Mostrar todos los departamentos
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDepartments.map((dept) => {
            const DeptIcon = dept.icon;
            return (
              <section
                key={dept.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
              >
                {/* Department Header */}
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${dept.colorClass}`}>
                    <DeptIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {dept.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                    {dept.items.length} {dept.items.length === 1 ? 'módulo' : 'módulos'}
                  </span>
                </div>

                {/* Sub-item module cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {dept.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isAllowed = isTabAllowedForRole(effectiveRoleInfo.id, item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isAllowed) {
                            handleNavigate(item.id);
                          } else if (onOpenRoleModal) {
                            onOpenRoleModal();
                          } else {
                            handleNavigate('roles');
                          }
                        }}
                        className={`w-full min-h-[64px] p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between gap-3 border active:scale-[0.98] ${
                          isAllowed
                            ? 'bg-slate-50/80 dark:bg-slate-850 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60'
                            : 'bg-slate-50/40 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                              isAllowed
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-slate-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.label}
                              </p>
                              {!isAllowed && (
                                <span title="Requiere PIN / Rol autorizado" className="shrink-0 inline-flex">
                                  <Lock className="w-3 h-3 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {Boolean(item.badge) && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.badgeColor || 'bg-amber-500 text-white'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          6. FOOTER JUMP & THEOCRATIC INTEGRITY BADGE
         ========================================================================= */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-400 dark:text-slate-500 px-1">
        <button
          type="button"
          onClick={() => handleNavigate('inicio')}
          className="min-h-[44px] w-full sm:w-auto px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>Volver a Mi Ministerio</span>
        </button>

        <p className="text-[11px]">
          Kongre • Organización Teocrática Local &copy; {new Date().getFullYear()}
        </p>
      </div>

    </div>
  );
};
