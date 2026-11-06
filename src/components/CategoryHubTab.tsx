// src/components/CategoryHubTab.tsx
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { ActiveTab } from './Navbar';
import { isTabAllowedForRole } from '../utils/rbac';
import { CURRENT_APP_VERSION, CURRENT_APP_STAGE } from '../utils/versionLog';
import { NAV_ICONS } from '../NavIcons';
import {
  ChevronRight,
  AlertTriangle,
  KeyRound,
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

export interface SubcategoryColorTheme {
  iconBg: string;
  iconText: string;
  iconHover: string;
  cardHover: string;
  titleHover: string;
  chevronHover: string;
  badgeStyle: string;
  accentDot: string;
}

export const SUBCATEGORY_COLOR_THEMES: Record<string, SubcategoryColorTheme> = {
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    iconHover: 'group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 dark:group-hover:bg-indigo-500 dark:group-hover:text-white',
    cardHover: 'hover:border-indigo-500/50 dark:hover:border-indigo-400/50',
    titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    chevronHover: 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400',
    badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
    accentDot: 'bg-indigo-500',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60',
    iconText: 'text-rose-600 dark:text-rose-400',
    iconHover: 'group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-500 dark:group-hover:bg-rose-500 dark:group-hover:text-white',
    cardHover: 'hover:border-rose-500/50 dark:hover:border-rose-400/50',
    titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    chevronHover: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
    badgeStyle: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    accentDot: 'bg-rose-500',
  },
  sky: {
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/60',
    iconText: 'text-sky-600 dark:text-sky-400',
    iconHover: 'group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-500 dark:group-hover:bg-sky-500 dark:group-hover:text-white',
    cardHover: 'hover:border-sky-500/50 dark:hover:border-sky-400/50',
    titleHover: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    chevronHover: 'group-hover:text-sky-500 dark:group-hover:text-sky-400',
    badgeStyle: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60',
    accentDot: 'bg-sky-500',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60',
    iconText: 'text-amber-600 dark:text-amber-400',
    iconHover: 'group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-500 dark:group-hover:bg-amber-500 dark:group-hover:text-white',
    cardHover: 'hover:border-amber-500/50 dark:hover:border-amber-400/50',
    titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    chevronHover: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
    badgeStyle: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    accentDot: 'bg-amber-500',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    iconHover: 'group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 dark:group-hover:bg-emerald-500 dark:group-hover:text-white',
    cardHover: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50',
    titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    chevronHover: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
    badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    accentDot: 'bg-emerald-500',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/60',
    iconText: 'text-violet-600 dark:text-violet-400',
    iconHover: 'group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-500 dark:group-hover:bg-violet-500 dark:group-hover:text-white',
    cardHover: 'hover:border-violet-500/50 dark:hover:border-violet-400/50',
    titleHover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    chevronHover: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
    badgeStyle: 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60',
    accentDot: 'bg-violet-500',
  },
  cyan: {
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800/60',
    iconText: 'text-cyan-600 dark:text-cyan-400',
    iconHover: 'group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500 dark:group-hover:bg-cyan-500 dark:group-hover:text-white',
    cardHover: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50',
    titleHover: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
    chevronHover: 'group-hover:text-cyan-500 dark:group-hover:text-cyan-400',
    badgeStyle: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60',
    accentDot: 'bg-cyan-500',
  },
  teal: {
    iconBg: 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60',
    iconText: 'text-teal-600 dark:text-teal-400',
    iconHover: 'group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 dark:group-hover:bg-teal-500 dark:group-hover:text-white',
    cardHover: 'hover:border-teal-500/50 dark:hover:border-teal-400/50',
    titleHover: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    chevronHover: 'group-hover:text-teal-500 dark:group-hover:text-teal-400',
    badgeStyle: 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60',
    accentDot: 'bg-teal-500',
  },
  orange: {
    iconBg: 'bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60',
    iconText: 'text-orange-600 dark:text-orange-400',
    iconHover: 'group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-500 dark:group-hover:bg-orange-500 dark:group-hover:text-white',
    cardHover: 'hover:border-orange-500/50 dark:hover:border-orange-400/50',
    titleHover: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
    chevronHover: 'group-hover:text-orange-500 dark:group-hover:text-orange-400',
    badgeStyle: 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60',
    accentDot: 'bg-orange-500',
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60',
    iconText: 'text-purple-600 dark:text-purple-400',
    iconHover: 'group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 dark:group-hover:bg-purple-500 dark:group-hover:text-white',
    cardHover: 'hover:border-purple-500/50 dark:hover:border-purple-400/50',
    titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    chevronHover: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
    badgeStyle: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
    accentDot: 'bg-purple-500',
  },
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60',
    iconText: 'text-blue-600 dark:text-blue-400',
    iconHover: 'group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 dark:group-hover:bg-blue-500 dark:group-hover:text-white',
    cardHover: 'hover:border-blue-500/50 dark:hover:border-blue-400/50',
    titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    chevronHover: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
    badgeStyle: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
    accentDot: 'bg-blue-500',
  },
  fuchsia: {
    iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200/80 dark:border-fuchsia-800/60',
    iconText: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconHover: 'group-hover:bg-fuchsia-600 group-hover:text-white group-hover:border-fuchsia-500 dark:group-hover:bg-fuchsia-500 dark:group-hover:text-white',
    cardHover: 'hover:border-fuchsia-500/50 dark:hover:border-fuchsia-400/50',
    titleHover: 'group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400',
    chevronHover: 'group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400',
    badgeStyle: 'bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800/60',
    accentDot: 'bg-fuchsia-500',
  },
};

export interface MenuItemDef {
  id: ActiveTab;
  label: string;
  shortLabel?: string;
  description: string;
  icon: any;
  colorKey: keyof typeof SUBCATEGORY_COLOR_THEMES;
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
  onOpenConflictsModal,
  onOpenPinsModal,
  onOpenVersionModal,
  onOpenQueueModal,
}) => {
  const { effectiveRoleInfo } = useAuth();
  const {
    conflicts,
    notices,
    territories,
    auxPioneerRequests,
    offlineQueueStats,
  } = useCongregation();

  const overdueTerritoriesCount = territories.filter(
    (t) =>
      t.status === 'vencido' ||
      (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
  ).length;

  const pinnedNoticesCount = notices.filter((n) => n.pinned).length;
  const pendingAuxPioneersCount = (auxPioneerRequests || []).filter(
    (r) => (r.status || r.estado || 'pendiente') === 'pendiente'
  ).length;

  // Master departments catalogue with distinctive color per subcategory
  const departments: DepartmentCategory[] = useMemo(() => [
    {
      id: 'inicio',
      title: 'Mi Ministerio Personal',
      shortTitle: 'Publicador',
      icon: NAV_ICONS.inicio,
      accentBg: 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      items: [
        {
          id: 'inicio',
          label: 'Mi Ministerio (Panel Principal)',
          description: 'Control de predicación, cronómetro de horas, revisitas y estudios',
          icon: NAV_ICONS.inicio,
          colorKey: 'indigo',
        },
        {
          id: 'cronometro_ministerio',
          label: 'Cronómetro de Predicación',
          description: 'Llevar el tiempo en vivo, sesiones diarias y metas del mes',
          icon: NAV_ICONS.cronometro_ministerio,
          colorKey: 'sky',
        },
        {
          id: 'revisitas',
          label: 'Agenda de Revisitas',
          description: 'Direcciones, temas conversados, preguntas pendientes y visitas',
          icon: NAV_ICONS.revisitas,
          colorKey: 'emerald',
        },
        {
          id: 'estudios_biblicos',
          label: 'Estudios Bíblicos (Cursos)',
          description: 'Registro de estudiantes, lección actual y metas espirituales',
          icon: NAV_ICONS.estudios_biblicos,
          colorKey: 'amber',
        },
        {
          id: 'mi_vista',
          label: 'Mis Asignaciones y Portal S-4',
          description: 'Partes en reuniones, informe mensual y ausencias programadas',
          icon: NAV_ICONS.mi_vista,
          colorKey: 'purple',
        },
      ],
    },
    {
      id: 'panorama_general',
      title: 'Mi Congregación',
      shortTitle: 'Congregación',
      icon: NAV_ICONS.panorama_general,
      accentBg: 'bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800/60',
      accentText: 'text-cyan-600 dark:text-cyan-400',
      items: [
        {
          id: 'panorama_general',
          label: 'Mi Congregación y Cartelera',
          description: 'Informe mensual, próximas asignaciones, avisos y eventos',
          icon: NAV_ICONS.panorama_general,
          colorKey: 'cyan',
        },
        {
          id: 'calendario',
          label: 'Calendario de la Congregación',
          description: 'Planificador teocrático mensual, eventos y semanas de asamblea',
          icon: NAV_ICONS.calendario,
          colorKey: 'violet',
        },
      ],
    },
    {
      id: 'reuniones',
      title: 'Reuniones de Congregación',
      shortTitle: 'Reuniones',
      icon: NAV_ICONS.reuniones,
      accentBg: 'bg-violet-50 dark:bg-violet-950/60 border border-violet-200/80 dark:border-violet-800/60',
      accentText: 'text-violet-600 dark:text-violet-400',
      items: [
        {
          id: 'programacion',
          label: 'Programa de Reuniones',
          description: 'Vida y Ministerio Cristianos y Fin de Semana en un solo programa',
          icon: NAV_ICONS.programacion,
          colorKey: 'indigo',
        },
        {
          id: 's89',
          label: 'Hojas de Asignación S-89',
          description: 'Generación, impresión y entrega de asignaciones estudiantiles',
          icon: NAV_ICONS.s89,
          colorKey: 'rose',
        },
        {
          id: 'discursos',
          label: 'Discursos Públicos',
          description: 'Catálogo de bosquejos oficiales y registro de oradores visitantes',
          icon: NAV_ICONS.discursos,
          colorKey: 'sky',
        },
        {
          id: 'hospitalidad',
          label: 'Hospitalidad de Oradores',
          description: 'Familias anfitrionas, transporte y refrigerio de conferenciantes',
          icon: NAV_ICONS.hospitalidad,
          colorKey: 'amber',
        },
      ],
    },
    {
      id: 'secretaria',
      title: 'Secretaría y Registros Oficiales',
      shortTitle: 'Secretaría',
      icon: NAV_ICONS.secretaria,
      accentBg: 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60',
      accentText: 'text-blue-600 dark:text-blue-400',
      items: [
        {
          id: 'estadisticas_secretaria',
          label: 'Resumen de Secretaría y Gráficos',
          description: 'Métricas generales, asistencia, publicadores y promedios',
          icon: NAV_ICONS.estadisticas_secretaria,
          colorKey: 'blue',
        },
        {
          id: 'publicadores',
          label: 'Directorio de Publicadores',
          description: 'Directorio completo, teléfonos, grupos y privilegios',
          icon: NAV_ICONS.publicadores,
          colorKey: 'emerald',
        },
        {
          id: 'precursores_auxiliares',
          label: 'Precursores Auxiliares (S-205)',
          description: 'Solicitudes mensuales y aprobación oficial del comité',
          icon: NAV_ICONS.precursores_auxiliares,
          colorKey: 'amber',
          badge: pendingAuxPioneersCount || undefined,
        },
        {
          id: 'informe_s1',
          label: 'Informe S-1 Sucursal',
          description: 'Consolidación mensual de predicación y asistencia para JW Hub',
          icon: NAV_ICONS.informe_s1,
          colorKey: 'violet',
        },
        {
          id: 'tarjetas_s21',
          label: 'Tarjetas S-21',
          description: 'Registro oficial de publicador de la congregación',
          icon: NAV_ICONS.tarjetas_s21,
          colorKey: 'indigo',
        },
        {
          id: 'informes_servicio',
          label: 'Informes S-4',
          description: 'Recolección mensual y resumen para la sucursal',
          icon: NAV_ICONS.informes_servicio,
          colorKey: 'cyan',
        },
        {
          id: 'asistencia',
          label: 'Asistencia S-88',
          description: 'Control de asistencia a reuniones entre semana y fin de semana',
          icon: NAV_ICONS.asistencia,
          colorKey: 'teal',
        },
      ],
    },
    {
      id: 'predicacion',
      title: 'Predicación y Territorios',
      shortTitle: 'Predicación',
      icon: NAV_ICONS.predicacion,
      accentBg: 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      items: [
        {
          id: 'territorios',
          label: 'Territorios S-13',
          description: 'Asignaciones digitales, mapas, alertas de vencimiento y manzanas',
          icon: NAV_ICONS.territorios,
          colorKey: 'emerald',
          badge: overdueTerritoriesCount || undefined,
        },
        {
          id: 'grupos_servicio',
          label: 'Grupos de Servicio',
          description: 'Superintendentes de grupo, capitanes y lista de familias',
          icon: NAV_ICONS.grupos_servicio,
          colorKey: 'blue',
        },
        {
          id: 'carritos',
          label: 'Testimonio Público (Carritos)',
          description: 'Puntos metropolitanos, turnos, horarios y parejas',
          icon: NAV_ICONS.carritos,
          colorKey: 'purple',
        },
        {
          id: 'literatura',
          label: 'Literatura S-14',
          description: 'Inventario de publicaciones, revistas, pedidos y entregas',
          icon: NAV_ICONS.literatura,
          colorKey: 'orange',
        },
      ],
    },
    {
      id: 'salon',
      title: 'Salón del Reino y Servicios',
      shortTitle: 'Salón',
      icon: NAV_ICONS.salon,
      accentBg: 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/60',
      accentText: 'text-teal-600 dark:text-teal-400',
      items: [
        {
          id: 'limpieza_deberes',
          label: 'Servicios de la Congregación',
          description: 'Acomodadores, audio, video, micrófonos y cuadrillas de aseo',
          icon: NAV_ICONS.limpieza_deberes,
          colorKey: 'teal',
        },
        {
          id: 'tablero_anuncios',
          label: 'Tablero de Anuncios',
          description: 'Cartas, avisos de la congregación y circulares',
          icon: NAV_ICONS.tablero_anuncios,
          colorKey: 'indigo',
          badge: pinnedNoticesCount || undefined,
        },
        {
          id: 'mantenimiento',
          label: 'Mantenimiento y Panel Eléctrico',
          description: 'Fichas operativas, plan preventivo, extintores y tablero eléctrico',
          icon: NAV_ICONS.mantenimiento,
          colorKey: 'orange',
        },
        {
          id: 'visita_sc',
          label: 'Visita del Supte. de Circuito',
          description: 'Semana de la visita, programa especial y comidas',
          icon: NAV_ICONS.visita_sc,
          colorKey: 'purple',
        },
        {
          id: 'memorial_asambleas',
          label: 'Memorial & Asambleas',
          description: 'Preparativos de Conmemoración, asambleas y comités',
          icon: NAV_ICONS.memorial_asambleas,
          colorKey: 'rose',
        },
      ],
    },
    {
      id: 'supervision',
      title: 'Supervisión, Ajustes & Control',
      shortTitle: 'Supervisión',
      icon: NAV_ICONS.supervision,
      accentBg: 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60',
      accentText: 'text-rose-600 dark:text-rose-400',
      items: [
        {
          id: 'conflictos',
          label: 'Centro de Conflictos',
          description: 'Cruces de hermanos, dobles partes o no asignados',
          icon: NAV_ICONS.conflictos,
          colorKey: 'rose',
          badge: conflicts.length || undefined,
        },
        {
          id: 'equidad',
          label: 'Panel de Equidad',
          description: 'Distribución justa de asignaciones y estadísticas',
          icon: NAV_ICONS.equidad,
          colorKey: 'teal',
        },
        {
          id: 'exportar_pdf',
          label: 'Formatos Oficiales (Local) y PDF',
          description: 'Rellenado local de S-21, S-89, S-140, S-88 y exportación',
          icon: NAV_ICONS.exportar_pdf,
          colorKey: 'orange',
        },
        {
          id: 'perfil',
          label: 'Mi Perfil de Usuario',
          description: 'Foto de perfil, nombre visible y canales de contacto',
          icon: NAV_ICONS.perfil,
          colorKey: 'sky',
        },
        {
          id: 'ajustes',
          label: 'Ajustes de Congregación',
          description: 'Horarios, respaldo y configuración general',
          icon: NAV_ICONS.ajustes,
          colorKey: 'indigo',
        },
        {
          id: 'roles',
          label: 'Roles Teocráticos y PINs',
          description: 'Asignación de cargos, PINs personales y acceso por departamentos',
          icon: NAV_ICONS.roles,
          colorKey: 'purple',
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
          CUADRÍCULA DE TARJETAS CON COLOR DISTINTIVO POR SUBCATEGORÍA
         ========================================================================= */}
      <div className="space-y-8">
        {displayedDepartments.map((dept) => {
          const DeptIcon = dept.icon;
          return (
            <section key={dept.id} className="space-y-3.5">
              {/* Cabecera de Categoría */}
              <div className="flex items-center px-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${dept.accentBg} ${dept.accentText} flex items-center justify-center font-bold shadow-2xs`}>
                    <DeptIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                    {dept.title}
                  </h2>
                </div>
              </div>

              {/* Cuadrícula de Tarjetas JW Library (3 columnas en PC de ancho completo) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {dept.items.map((item) => {
                  const ItemIcon = item.icon;
                  const theme = SUBCATEGORY_COLOR_THEMES[item.colorKey] || SUBCATEGORY_COLOR_THEMES.indigo;
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
                      className={`kg-card-bento kg-glass-surface kg-sheen-top group relative p-5 rounded-3xl text-left border border-zinc-200/80 dark:border-white/10 ${theme.cardHover} shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer flex items-center gap-4.5 active:scale-[0.98] overflow-hidden`}
                    >
                      {/* Acento lateral de color distintivo */}
                      <span
                        className={`w-1 h-10 rounded-r-full ${theme.accentDot} opacity-80 group-hover:h-14 group-hover:opacity-100 transition-all duration-200 shrink-0 -ml-2`}
                      />

                      {/* Icono Outline Espacioso con Color Distintivo */}
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-150 group-hover:scale-105 ${theme.iconBg} ${theme.iconText} ${theme.iconHover} shadow-2xs`}
                      >
                        <ItemIcon className="w-6 h-6 stroke-[1.9]" />
                      </div>

                      {/* Texto y Título */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className={`text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-100 ${theme.titleHover} leading-snug truncate transition-colors tracking-tight`}>
                            {item.label}
                          </h3>
                          {item.badge && (
                            <span
                              className={`kg-glow-badge px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums shrink-0 ${
                                item.badgeColor || theme.badgeStyle
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

                      <ChevronRight className={`w-4 h-4 text-zinc-300 dark:text-zinc-600 ${theme.chevronHover} group-hover:translate-x-0.5 transition-all shrink-0`} />
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
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] border border-purple-200/80 dark:border-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Directorio de PINs</span>
            </button>
          )}

          {onOpenConflictsModal && (
            <button
              type="button"
              onClick={onOpenConflictsModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] border border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400 dark:hover:border-rose-600 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Centro de Conflictos ({conflicts.length})</span>
            </button>
          )}

          {onOpenQueueModal && (
            <button
              type="button"
              onClick={onOpenQueueModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] border border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">v{CURRENT_APP_VERSION}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              {CURRENT_APP_STAGE}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
