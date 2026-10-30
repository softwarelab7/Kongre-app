// src/components/CategoryHubTab.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { ActiveTab } from './Navbar';
import { isTabAllowedForRole } from '../utils/rbac';
import { getFriendlyCongregationName } from '../utils/theocraticSecurity';
import { CURRENT_APP_VERSION, CURRENT_APP_STAGE } from '../utils/versionLog';
import { NAV_ICONS } from '../NavIcons';
import {
  Search,
  X,
  Lock,
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  KeyRound,
  Timer,
  Tv,
  QrCode,
  Wifi,
} from 'lucide-react';

export interface CategoryHubTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onOpenConflictsModal?: () => void;
  onOpenQrModal?: () => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenPinsModal?: () => void;
  onOpenRoleModal?: () => void;
  onOpenVersionModal?: () => void;
  onOpenQueueModal?: () => void;
}

export interface MenuItemDef {
  id: ActiveTab;
  label: string;
  shortLabel?: string;
  description: string;
  icon: any;
  badge?: number | string;
  badgeColor?: string;
}

export interface DepartmentCategory {
  id: string;
  title: string;
  shortTitle: string;
  icon: any;
  accentBg: string;
  accentText: string;
  items: MenuItemDef[];
}

export const CategoryHubTab: React.FC<CategoryHubTabProps> = ({
  setActiveTab,
  selectedCategory: initialCategory = 'all',
  onSelectCategory,
  onOpenConflictsModal,
  onOpenQrModal,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenPinsModal,
  onOpenRoleModal,
  onOpenVersionModal,
  onOpenQueueModal,
}) => {
  const { effectiveRoleInfo } = useAuth();
  const {
    settings,
    conflicts,
    notices,
    territories,
    auxPioneerRequests,
    offlineQueueStats,
    isOnline,
  } = useCongregation();

  const [localCategory, setLocalCategory] = useState<string>(initialCategory);
  const activeCategory = onSelectCategory ? initialCategory : localCategory;

  const handleCategoryChange = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    } else {
      setLocalCategory(catId);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const rawCongregationName = getFriendlyCongregationName(settings.congregationName, 'Congregación Central');
  const displayCongregationName = rawCongregationName
    .replace(/\s*\((?:Demostración|Demo|Prueba)\)/gi, '')
    .trim() || 'Congregación Central';

  const overdueTerritoriesCount = territories.filter(
    (t) =>
      t.status === 'vencido' ||
      (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
  ).length;

  const pinnedNoticesCount = notices.filter((n) => n.pinned).length;
  const pendingAuxPioneersCount = (auxPioneerRequests || []).filter(
    (r) => (r.status || r.estado || 'pendiente') === 'pendiente'
  ).length;

  // Master departments catalogue
  const departments: DepartmentCategory[] = useMemo(() => [
    {
      id: 'inicio',
      title: 'Mi Ministerio Personal',
      shortTitle: 'Publicador',
      icon: NAV_ICONS.inicio,
      accentBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      items: [
        {
          id: 'inicio',
          label: 'Mi Ministerio (Panel Principal)',
          description: 'Control de predicación, cronómetro de horas, revisitas y estudios',
          icon: NAV_ICONS.inicio,
        },
        {
          id: 'cronometro_ministerio',
          label: 'Cronómetro de Predicación',
          description: 'Llevar el tiempo en vivo, sesiones diarias y metas del mes',
          icon: NAV_ICONS.cronometro_ministerio,
        },
        {
          id: 'revisitas',
          label: 'Agenda de Revisitas',
          description: 'Direcciones, temas conversados, preguntas pendientes y visitas',
          icon: NAV_ICONS.revisitas,
        },
        {
          id: 'estudios_biblicos',
          label: 'Estudios Bíblicos (Cursos)',
          description: 'Registro de estudiantes, lección actual y metas espirituales',
          icon: NAV_ICONS.estudios_biblicos,
        },
        {
          id: 'mi_vista',
          label: 'Mis Asignaciones y Portal S-4',
          description: 'Partes en reuniones, informe mensual y ausencias programadas',
          icon: NAV_ICONS.mi_vista,
        },
      ],
    },
    {
      id: 'panorama_general',
      title: 'Mi Congregación',
      shortTitle: 'Congregación',
      icon: NAV_ICONS.panorama_general,
      accentBg: 'bg-violet-50 dark:bg-violet-950/60',
      accentText: 'text-violet-600 dark:text-violet-400',
      items: [
        {
          id: 'panorama_general',
          label: 'Mi Congregación y Cartelera',
          description: 'Informe mensual, próximas asignaciones, avisos y eventos',
          icon: NAV_ICONS.panorama_general,
        },
        {
          id: 'calendario',
          label: 'Calendario de la Congregación',
          description: 'Planificador teocrático mensual, eventos y semanas de asamblea',
          icon: NAV_ICONS.calendario,
        },
      ],
    },
    {
      id: 'reuniones',
      title: 'Reuniones de Congregación',
      shortTitle: 'Reuniones',
      icon: NAV_ICONS.reuniones,
      accentBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      items: [
        {
          id: 'programacion',
          label: 'Programa de Reuniones',
          description: 'Vida y Ministerio Cristianos y Fin de Semana en un solo programa',
          icon: NAV_ICONS.programacion,
        },
        {
          id: 's89',
          label: 'Hojas de Asignación S-89',
          description: 'Generación, impresión y entrega de asignaciones estudiantiles',
          icon: NAV_ICONS.s89,
        },
        {
          id: 'discursos',
          label: 'Discursos Públicos',
          description: 'Catálogo de bosquejos oficiales y registro de oradores visitantes',
          icon: NAV_ICONS.discursos,
        },
        {
          id: 'hospitalidad',
          label: 'Hospitalidad de Oradores',
          description: 'Familias anfitrionas, transporte y refrigerio de conferenciantes',
          icon: NAV_ICONS.hospitalidad,
        },
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros Oficiales',
      shortTitle: 'Secretaría',
      icon: NAV_ICONS.secretaria,
      accentBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      items: [
        {
          id: 'estadisticas_secretaria',
          label: 'Resumen de Secretaría y Gráficos',
          description: 'Métricas generales, asistencia, publicadores y promedios',
          icon: NAV_ICONS.estadisticas_secretaria,
        },
        {
          id: 'publicadores',
          label: 'Directorio de Publicadores',
          description: 'Directorio completo, teléfonos, grupos y privilegios',
          icon: NAV_ICONS.publicadores,
        },
        {
          id: 'precursores_auxiliares',
          label: 'Precursores Auxiliares (S-205)',
          description: 'Solicitudes mensuales y aprobación oficial del comité',
          icon: NAV_ICONS.precursores_auxiliares,
          badge: pendingAuxPioneersCount || undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'informe_s1',
          label: 'Informe S-1 Sucursal',
          description: 'Consolidación mensual de predicación y asistencia para JW Hub',
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
          description: 'Recolección mensual y resumen para la sucursal',
          icon: NAV_ICONS.informes_servicio,
        },
        {
          id: 'asistencia',
          label: 'Asistencia S-88',
          description: 'Control de asistencia a reuniones entre semana y fin de semana',
          icon: NAV_ICONS.asistencia,
        },
        {
          id: 'cuentas',
          label: 'Cuentas S-26',
          description: 'Registro contable, donaciones, resolución y sucursal',
          icon: NAV_ICONS.cuentas,
        },
      ],
    },
    {
      id: 'predicacion',
      title: 'Predicación y Territorios',
      shortTitle: 'Predicación',
      icon: NAV_ICONS.predicacion,
      accentBg: 'bg-sky-50 dark:bg-sky-950/60',
      accentText: 'text-sky-600 dark:text-sky-400',
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Asignaciones digitales, mapas, alertas de vencimiento y manzanas',
          icon: NAV_ICONS.territorios,
          badge: overdueTerritoriesCount || undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'grupos_servicio',
          label: 'Grupos de Servicio',
          description: 'Superintendentes de grupo, capitanes y lista de familias',
          icon: NAV_ICONS.grupos_servicio,
        },
        {
          id: 'carritos',
          label: 'Testimonio Público (Carritos)',
          description: 'Puntos metropolitanos, turnos, horarios y parejas',
          icon: NAV_ICONS.carritos,
        },
        {
          id: 'literatura',
          label: 'Literatura S-14',
          description: 'Inventario de publicaciones, revistas, pedidos y entregas',
          icon: NAV_ICONS.literatura,
        },
      ],
    },
    {
      id: 'salon',
      title: 'Salón del Reino y Servicios',
      shortTitle: 'Salón',
      icon: NAV_ICONS.salon,
      accentBg: 'bg-amber-50 dark:bg-amber-950/60',
      accentText: 'text-amber-600 dark:text-amber-400',
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Servicios de la Congregación',
          description: 'Acomodadores, audio, video, micrófonos y cuadrillas de aseo',
          icon: NAV_ICONS.limpieza_deberes,
        },
        {
          id: 'tablero_anuncios',
          label: 'Tablero de Anuncios',
          description: 'Cartas, avisos de la congregación y circulares',
          icon: NAV_ICONS.tablero_anuncios,
          badge: pinnedNoticesCount || undefined,
          badgeColor: 'bg-indigo-600 text-white',
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento del Salón',
          description: 'Fichas operativas, plan preventivo y extintores',
          icon: NAV_ICONS.mantenimiento,
        },
        {
          id: 'panel_electrico',
          label: 'Panel Eléctrico y Clima',
          description: 'Tablero de breakers, circuitos y control de energía',
          icon: NAV_ICONS.panel_electrico,
        },
        {
          id: 'visita_sc',
          label: 'Visita del Supte. de Circuito',
          description: 'Semana de la visita, programa especial y comidas',
          icon: NAV_ICONS.visita_sc,
        },
        {
          id: 'memorial_asambleas',
          label: 'Memorial & Asambleas',
          description: 'Preparativos de Conmemoración, asambleas y comités',
          icon: NAV_ICONS.memorial_asambleas,
        },
      ],
    },
    {
      id: 'supervision',
      title: 'Supervisión, Ajustes & Control',
      shortTitle: 'Supervisión',
      icon: NAV_ICONS.supervision,
      accentBg: 'bg-rose-50 dark:bg-rose-950/60',
      accentText: 'text-rose-600 dark:text-rose-400',
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
          description: 'Rellenado local de S-21, S-89, S-140, S-88 y exportación',
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
  ], [conflicts.length, overdueTerritoriesCount, pinnedNoticesCount, pendingAuxPioneersCount]);

  // Filter allowed by role
  const roleAllowedDepartments = useMemo(() => {
    return departments
      .map((dept) => {
        const allowedItems = dept.items.filter((item) =>
          isTabAllowedForRole(effectiveRoleInfo.id, item.id)
        );
        return {
          ...dept,
          items: allowedItems,
        };
      })
      .filter((dept) => dept.items.length > 0);
  }, [departments, effectiveRoleInfo.id]);

  // Active department or all
  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return roleAllowedDepartments
      .map((dept) => {
        if (activeCategory !== 'all' && dept.id !== activeCategory) {
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
  }, [roleAllowedDepartments, searchQuery, activeCategory]);

  const activeCategoryTitle = useMemo(() => {
    if (activeCategory === 'all') return 'Todas las Secciones y Módulos';
    const found = roleAllowedDepartments.find((d) => d.id === activeCategory);
    return found?.title || 'Categoría';
  }, [activeCategory, roleAllowedDepartments]);

  const totalCardsCount = useMemo(() => {
    return filteredDepartments.reduce((acc, d) => acc + d.items.length, 0);
  }, [filteredDepartments]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 select-none">
      {/* =========================================================================
          1. HEADER ESTILO JW LIBRARY: Título, Subtítulo y Pestañas Horizontales
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Departamentos y Módulos
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {displayCongregationName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeCategoryTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {totalCardsCount} {totalCardsCount === 1 ? 'módulo disponible' : 'módulos disponibles'} en esta sección
            </p>
          </div>

          {/* Buscador Integrado estilo JW Library */}
          <div className="relative w-full md:w-72 lg:w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cualquier módulo o tarjeta..."
              className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pestañas Horizontales Estilo JW Library (PUBLICATIONS | VIDEO | AUDIO | DOWNLOADED) */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer relative ${
              activeCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos los Módulos
          </button>

          {roleAllowedDepartments.map((dept) => {
            const isCatSelected = activeCategory === dept.id;
            const DeptIcon = dept.icon;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => handleCategoryChange(dept.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isCatSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <DeptIcon className="w-4 h-4 stroke-[2]" />
                <span>{dept.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. CUADRÍCULA DE TARJETAS ESTILO JW LIBRARY INTEGRADA EN TODA LA PANTALLA
         ========================================================================= */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/90 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              No se encontraron tarjetas que coincidan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              No hay módulos que coincidan con &quot;{searchQuery}&quot;. Intenta con otro término o restablece los filtros.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              handleCategoryChange('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            Ver todos los módulos
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredDepartments.map((dept) => {
            const DeptIcon = dept.icon;
            return (
              <section key={dept.id} className="space-y-3.5">
                {/* Cabecera de Categoría (Visible en vista 'Todos') */}
                {activeCategory === 'all' && (
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${dept.accentBg} ${dept.accentText} flex items-center justify-center font-bold`}>
                        <DeptIcon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {dept.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(dept.id)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver solo {dept.shortTitle}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Cuadrícula de Tarjetas JW Library (3 columnas en PC de ancho completo) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                  {dept.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          if (typeof window !== 'undefined') {
                            window.location.hash = `#${item.id}`;
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="group relative p-5 rounded-2xl text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/80 dark:hover:bg-slate-850/80 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex items-center gap-4.5"
                      >
                        {/* Icono Outline Espacioso Estilo JW Library */}
                        <div
                          className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${dept.accentBg} ${dept.accentText} group-hover:bg-indigo-600 group-hover:text-white shadow-2xs`}
                        >
                          <ItemIcon className="w-6 h-6 stroke-[1.8]" />
                        </div>

                        {/* Texto y Título */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug truncate transition-colors">
                              {item.label}
                            </h3>
                            {item.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  item.badgeColor || 'bg-amber-500 text-white'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
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
          3. ACCESOS RÁPIDOS INFERIORES Y METADATOS
         ========================================================================= */}
      <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {onOpenPinsModal && (
            <button
              type="button"
              onClick={onOpenPinsModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Directorio de PINs</span>
            </button>
          )}

          {onOpenConflictsModal && (
            <button
              type="button"
              onClick={onOpenConflictsModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Centro de Conflictos ({conflicts.length})</span>
            </button>
          )}

          {onOpenQueueModal && (
            <button
              type="button"
              onClick={onOpenQueueModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Wifi className={`w-3.5 h-3.5 ${!isOnline ? 'text-amber-500' : 'text-sky-500'}`} />
              <span>Sincronía Offline ({offlineQueueStats?.pendingCount || 0})</span>
            </button>
          )}
        </div>

        {onOpenVersionModal && (
          <button
            type="button"
            onClick={onOpenVersionModal}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer shadow-2xs"
          >
            <span>Kongre</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">v{CURRENT_APP_VERSION}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
              {CURRENT_APP_STAGE}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
