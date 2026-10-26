// src/components/MobileMenuTab.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { ActiveTab } from './Navbar';
import { isTabAllowedForRole } from '../utils/rbac';
import { getFriendlyCongregationName, isGenericIdentityName } from '../utils/theocraticSecurity';
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { insertAuditLog } from '../services/auditLogService';
import { NAV_ICONS } from '../NavIcons';
import {
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
  Wifi,
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
  shortLabel?: string;
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
  accentBg: string;
  accentText: string;
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
    auxPioneerRequests,
    isDemoMode,
    offlineQueueStats,
    isOnline,
  } = useCongregation();

  const { toggleTheme, isDark } = useTheme();
  const { lockSession } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const rawCongregationName = getFriendlyCongregationName(settings.congregationName, 'Congregación Central');
  const displayCongregationName = rawCongregationName
    .replace(/\s*\((?:Demostración|Demo|Prueba)\)/gi, '')
    .trim() || 'Congregación Central';

  const rawDisplayName = isDemoMode
    ? (userProfile?.displayName || settings?.coordinatorName || 'Carlos Mendoza')
    : currentBrotherName && !isGenericIdentityName(currentBrotherName)
    ? (currentBrotherName as string)
    : userProfile?.displayName && !isGenericIdentityName(userProfile.displayName)
    ? (userProfile!.displayName as string)
    : settings?.coordinatorName && !isGenericIdentityName(settings.coordinatorName)
    ? (settings.coordinatorName as string)
    : user?.displayName && !isGenericIdentityName(user.displayName)
    ? (user.displayName as string)
    : 'Hermano';

  const effectiveDisplayName = rawDisplayName.replace(/\s*\(Demo\)/gi, '').trim() || 'Hermano';

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
      accentBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      items: [
        {
          id: 'inicio',
          label: 'Mi Ministerio y Cronómetro',
          description: 'Tiempo, revisitas, estudios e informe S-4',
          icon: NAV_ICONS.inicio,
        },
        {
          id: 'mi_vista',
          label: 'Mis Asignaciones',
          description: 'Partes, ausencias y avisos personales',
          icon: NAV_ICONS.mi_vista,
        },
      ],
    },
    {
      id: 'reuniones',
      title: 'Reuniones y Programa',
      shortTitle: 'Reuniones',
      icon: NAV_ICONS.reuniones,
      accentBg: 'bg-violet-50 dark:bg-violet-950/60',
      accentText: 'text-violet-600 dark:text-violet-400',
      items: [
        {
          id: 'programacion',
          label: 'Programa de Reuniones',
          description: 'Vida y Ministerio y Fin de Semana',
          icon: NAV_ICONS.programacion,
        },
        {
          id: 's89',
          label: 'Hojas S-89',
          description: 'Asignaciones estudiantiles',
          icon: NAV_ICONS.s89,
        },
        {
          id: 'discursos',
          label: 'Discursos Públicos',
          description: 'Bosquejos y oradores',
          icon: NAV_ICONS.discursos,
        },
        {
          id: 'hospitalidad',
          label: 'Hospitalidad',
          description: 'Atención a conferenciantes',
          icon: NAV_ICONS.hospitalidad,
        },
        {
          id: 'calendario',
          label: 'Calendario',
          description: 'Eventos y fechas teocráticas',
          icon: NAV_ICONS.calendario,
        },
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros',
      shortTitle: 'Secretaría',
      icon: NAV_ICONS.secretaria,
      accentBg: 'bg-sky-50 dark:bg-sky-950/60',
      accentText: 'text-sky-600 dark:text-sky-400',
      items: [
        {
          id: 'publicadores',
          label: 'Publicadores',
          description: 'Directorio y privilegios',
          icon: NAV_ICONS.publicadores,
        },
        {
          id: 'tarjetas_s21',
          label: 'Tarjetas S-21',
          description: 'Registro oficial de publicador',
          icon: NAV_ICONS.tarjetas_s21,
        },
        {
          id: 'informes_servicio',
          label: 'Informes S-4',
          description: 'Recolección mensual',
          icon: NAV_ICONS.informes_servicio,
        },
        {
          id: 'informe_s1',
          label: 'Informe S-1 Sucursal',
          description: 'Totales para JW Hub',
          icon: NAV_ICONS.informe_s1,
        },
        {
          id: 'asistencia',
          label: 'Asistencia S-88',
          description: 'Promedios de reuniones',
          icon: NAV_ICONS.asistencia,
        },
        {
          id: 'precursores_auxiliares',
          label: 'Precursores Aux. (S-205)',
          description: 'Solicitudes mensuales',
          icon: NAV_ICONS.precursores_auxiliares,
          badge: pendingAuxPioneersCount || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'cuentas',
          label: 'Cuentas S-26',
          description: 'Contabilidad y donaciones',
          icon: NAV_ICONS.cuentas,
        },
        {
          id: 'estadisticas_secretaria',
          label: 'Estadísticas y Gráficos',
          description: 'Métricas de la congregación',
          icon: NAV_ICONS.estadisticas_secretaria,
        },
      ],
    },
    {
      id: 'predicacion',
      title: 'Predicación y Territorios',
      shortTitle: 'Predicación',
      icon: NAV_ICONS.predicacion,
      accentBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Mapas, asignaciones y alertas',
          icon: NAV_ICONS.territorios,
          badge: overdueTerritoriesCount || undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'grupos_servicio',
          label: 'Grupos de Servicio',
          description: 'Organización por grupos',
          icon: NAV_ICONS.grupos_servicio,
        },
        {
          id: 'carritos',
          label: 'Carritos Públicos',
          description: 'Turnos y ubicaciones',
          icon: NAV_ICONS.carritos,
        },
        {
          id: 'literatura',
          label: 'Literatura S-14',
          description: 'Inventario de publicaciones',
          icon: NAV_ICONS.literatura,
        },
      ],
    },
    {
      id: 'salon',
      title: 'Salón del Reino',
      shortTitle: 'Salón',
      icon: NAV_ICONS.salon,
      accentBg: 'bg-amber-50 dark:bg-amber-950/60',
      accentText: 'text-amber-600 dark:text-amber-400',
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Aseo y Deberes',
          description: 'Acomodadores, audio y limpieza',
          icon: NAV_ICONS.limpieza_deberes,
        },
        {
          id: 'tablero_anuncios',
          label: 'Tablero de Anuncios',
          description: 'Cartas y avisos oficiales',
          icon: NAV_ICONS.tablero_anuncios,
          badge: pinnedNoticesCount || undefined,
          badgeColor: 'bg-indigo-600 text-white',
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento',
          description: 'Inspecciones y reparaciones',
          icon: NAV_ICONS.mantenimiento,
        },
        {
          id: 'panel_electrico',
          label: 'Panel Eléctrico y Clima',
          description: 'Control de equipos del salón',
          icon: NAV_ICONS.panel_electrico,
        },
      ],
    },
    {
      id: 'supervision',
      title: 'Supervisión y Ajustes',
      shortTitle: 'Control',
      icon: NAV_ICONS.supervision,
      accentBg: 'bg-rose-50 dark:bg-rose-950/60',
      accentText: 'text-rose-600 dark:text-rose-400',
      items: [
        {
          id: 'panorama_general',
          label: 'Panorama Congregación',
          description: 'Resumen general de actividad',
          icon: NAV_ICONS.panorama_general,
        },
        {
          id: 'visita_sc',
          label: 'Visita del Supte. Circuito',
          description: 'Agenda e informes especiales',
          icon: NAV_ICONS.visita_sc,
        },
        {
          id: 'memorial_asambleas',
          label: 'Conmemoración y Asambleas',
          description: 'Eventos especiales del año',
          icon: NAV_ICONS.memorial_asambleas,
        },
        {
          id: 'conflictos',
          label: 'Centro de Conflictos',
          description: 'Cruces de partes y alertas',
          icon: NAV_ICONS.conflictos,
          badge: conflicts.length || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'equidad',
          label: 'Equidad de Partes',
          description: 'Balance de asignaciones',
          icon: NAV_ICONS.equidad,
        },
        {
          id: 'exportar_pdf',
          label: 'Formatos Oficiales PDF',
          description: 'Vista previa y descarga S-89/S-21',
          icon: NAV_ICONS.exportar_pdf,
        },
        {
          id: 'roles',
          label: 'Roles y PINs de Acceso',
          description: 'Permisos por departamento',
          icon: NAV_ICONS.roles,
        },
        {
          id: 'ajustes',
          label: 'Ajustes de Congregación',
          description: 'Horarios y copias de respaldo',
          icon: NAV_ICONS.ajustes,
        },
      ],
    },
  ], [conflicts.length, overdueTerritoriesCount, pinnedNoticesCount, pendingAuxPioneersCount]);

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return departments
      .map((dept) => {
        if (selectedCategory !== 'all' && dept.id !== selectedCategory) {
          return null;
        }

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

  const shortRoleLabel =
    activeRole === 'publico'
      ? 'Activar Rol (PIN)'
      : effectiveRoleInfo?.shortName || effectiveRoleInfo?.name || 'Publicador';

  return (
    <div className="pb-24 pt-1 max-w-3xl mx-auto px-1 sm:px-3 space-y-3 select-none animate-in fade-in duration-150">
      {/* =========================================================================
          1. QUICK TOOLS STRIP (Compact single-row scrollable / 6-col bar)
         ========================================================================= */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {onOpenPinsModal && (
            <button
              type="button"
              onClick={onOpenPinsModal}
              className="h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">PINs</span>
            </button>
          )}

          {onOpenTimerModal && (
            <button
              type="button"
              onClick={onOpenTimerModal}
              className="h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Atril</span>
            </button>
          )}

          {onOpenKioskModal && (
            <button
              type="button"
              onClick={onOpenKioskModal}
              className="h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Kiosko</span>
            </button>
          )}

          {onOpenQrModal && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="truncate">QR</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenConflictsModal}
            className="h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Cruces</span>
            {conflicts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {conflicts.length}
              </span>
            )}
          </button>

          {onOpenQueueModal && (
            <button
              type="button"
              onClick={onOpenQueueModal}
              className="h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 active:scale-95 transition cursor-pointer"
            >
              <Wifi className={`w-3.5 h-3.5 shrink-0 ${!isOnline ? 'text-amber-500' : 'text-sky-500'}`} />
              <span className="truncate">Sincronía</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  (offlineQueueStats?.pendingCount || 0) > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {offlineQueueStats?.pendingCount || 0}
              </span>
            </button>
          )}
      </div>

      {/* =========================================================================
          2. DEPARTMENTS & MODULES (Clean 2-Column Tactile Grid immediately visible!)
         ========================================================================= */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No se encontraron secciones para &quot;{searchQuery}&quot;
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
          >
            Ver todos los departamentos
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredDepartments.map((dept) => {
            const DeptIcon = dept.icon;
            return (
              <section key={dept.id} className="space-y-1.5">
                {/* Clean Department Section Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <DeptIcon className={`w-3.5 h-3.5 ${dept.accentText}`} />
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {dept.title}
                    </h3>
                  </div>
                </div>

                {/* 2-Column Compact Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        className={`min-h-[64px] p-2.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between border active:scale-[0.97] ${
                          isAllowed
                            ? 'bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                            : 'bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isAllowed ? `${dept.accentBg} ${dept.accentText}` : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {Boolean(item.badge) && (
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold leading-none ${
                                  item.badgeColor || 'bg-amber-500 text-white'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {!isAllowed ? (
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                          </div>
                        </div>

                        <div className="mt-1.5 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {item.description}
                          </p>
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
    </div>
  );
};
