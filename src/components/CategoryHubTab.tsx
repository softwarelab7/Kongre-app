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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
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
          badgeColor: 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]',
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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Asignaciones digitales, mapas, alertas de vencimiento y manzanas',
          icon: NAV_ICONS.territorios,
          badge: overdueTerritoriesCount || undefined,
          badgeColor: 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]',
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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
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
          badgeColor: 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]',
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
      accentBg: 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]',
      accentText: 'text-zinc-700 dark:text-zinc-300',
      items: [
        {
          id: 'conflictos',
          label: 'Centro de Conflictos',
          description: 'Cruces de hermanos, dobles partes o no asignados',
          icon: NAV_ICONS.conflictos,
          badge: conflicts.length || undefined,
          badgeColor: 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]',
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

  // Si se seleccionó una categoría específica (ej. 'reuniones'), se muestra únicamente ese departamento.
  // En vista general ('all'), se muestran los departamentos congregacionales sin mezclar el ministerio personal.
  const displayedDepartments = useMemo(() => {
    if (initialCategory && initialCategory !== 'all') {
      const match = roleAllowedDepartments.filter((dept) => dept.id === initialCategory);
      if (match.length > 0) return match;
    }
    return roleAllowedDepartments.filter((dept) => dept.id !== 'inicio');
  }, [roleAllowedDepartments, initialCategory]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 pb-12 select-none">
      {/* =========================================================================
          CUADRÍCULA DE TARJETAS ESTILO JW LIBRARY INTEGRADA EN TODA LA PANTALLA
         ========================================================================= */}
      <div className="space-y-8">
        {displayedDepartments.map((dept) => {
          const DeptIcon = dept.icon;
          return (
            <section key={dept.id} className="space-y-3.5">
              {/* Cabecera de Categoría */}
              <div className="flex items-center px-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${dept.accentBg} ${dept.accentText} flex items-center justify-center font-bold`}>
                    <DeptIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {dept.title}
                  </h2>
                </div>
              </div>

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
                      className="group relative p-5 rounded-2xl text-left bg-white dark:bg-[#121216] border border-zinc-200/90 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-[#18181F] shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-4.5"
                    >
                      {/* Icono Outline Espacioso Estilo JW Library */}
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${dept.accentBg} ${dept.accentText} group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 shadow-2xs`}
                      >
                        <ItemIcon className="w-6 h-6 stroke-[1.8]" />
                      </div>

                      {/* Texto y Título */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white leading-snug truncate transition-colors">
                            {item.label}
                          </h3>
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums shrink-0 ${
                                item.badgeColor || 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* =========================================================================
          ACCESOS RÁPIDOS INFERIORES Y METADATOS
         ========================================================================= */}
      <div className="pt-8 border-t border-zinc-200/80 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          {onOpenPinsModal && (
            <button
              type="button"
              onClick={onOpenPinsModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span>Directorio de PINs</span>
            </button>
          )}

          {onOpenConflictsModal && (
            <button
              type="button"
              onClick={onOpenConflictsModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Centro de Conflictos ({conflicts.length})</span>
            </button>
          )}

          {onOpenQueueModal && (
            <button
              type="button"
              onClick={onOpenQueueModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Wifi className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sincronía Offline ({offlineQueueStats?.pendingCount || 0})</span>
            </button>
          )}
        </div>

        {onOpenVersionModal && (
          <button
            type="button"
            onClick={onOpenVersionModal}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer shadow-2xs"
          >
            <span>Kongre</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">v{CURRENT_APP_VERSION}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-zinc-200 dark:bg-[#27272A] text-zinc-700 dark:text-zinc-300">
              {CURRENT_APP_STAGE}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
