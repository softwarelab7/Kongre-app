import React, { useMemo } from 'react';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { ActiveTab } from './Navbar';
import { useAuth } from '../context/AuthContext';
import { isTabAllowedForRole } from '../utils/rbac';
import { NAV_ICONS } from '../NavIcons';

interface QuickSectionItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ElementType;
}

interface QuickDepartmentGroup {
  id: string;
  title: string;
  shortTitle: string;
  items: QuickSectionItem[];
}

export const APP_DEPARTMENT_GROUPS: QuickDepartmentGroup[] = [
  {
    id: 'inicio',
    title: 'Mi Ministerio Personal',
    shortTitle: 'Ministerio',
    items: [
      {
        id: 'inicio',
        label: 'Mi Ministerio y Cronómetro',
        shortLabel: 'Cronómetro',
        subtitle: 'Control de predicación, horas y metas del mes',
        icon: NAV_ICONS.inicio,
      },
      {
        id: 'revisitas',
        label: 'Agenda de Revisitas',
        shortLabel: 'Revisitas',
        subtitle: 'Direcciones, temas conversados y próximas visitas',
        icon: NAV_ICONS.revisitas,
      },
      {
        id: 'estudios_biblicos',
        label: 'Estudios Bíblicos',
        shortLabel: 'Estudios',
        subtitle: 'Registro de estudiantes y progreso de lecciones',
        icon: NAV_ICONS.estudios_biblicos,
      },
      {
        id: 'mi_vista',
        label: 'Portal del Publicador (S-4 y Partes)',
        shortLabel: 'Mi Portal',
        subtitle: 'Asignaciones, informe mensual, ausencias y seguridad 2FA',
        icon: NAV_ICONS.mi_vista,
      },
    ],
  },
  {
    id: 'panorama_general',
    title: 'Mi Congregación',
    shortTitle: 'Congregación',
    items: [
      {
        id: 'panorama_general',
        label: 'Mi Congregación y Cartelera',
        shortLabel: 'Cartelera',
        subtitle: 'Panorama mensual, próximas asignaciones, avisos y asistencia',
        icon: NAV_ICONS.panorama_general,
      },
      {
        id: 'calendario',
        label: 'Calendario de la Congregación',
        shortLabel: 'Calendario',
        subtitle: 'Planificador teocrático mensual, visitas y asambleas',
        icon: NAV_ICONS.calendario,
      },
      {
        id: 'asistencia',
        label: 'Registro de Asistencia S-88',
        shortLabel: 'Asistencia S-88',
        subtitle: 'Control de asistencia a reuniones entre semana y fin de semana',
        icon: NAV_ICONS.asistencia,
      },
      {
        id: 'tablero_anuncios',
        label: 'Tablero de Anuncios',
        shortLabel: 'Anuncios',
        subtitle: 'Cartas, avisos oficiales y circulares de la congregación',
        icon: NAV_ICONS.tablero_anuncios,
      },
    ],
  },
  {
    id: 'reuniones',
    title: 'Reuniones de Congregación',
    shortTitle: 'Reuniones',
    items: [
      {
        id: 'programacion',
        label: 'Programa de Reuniones',
        shortLabel: 'Programa',
        subtitle: 'Vida y Ministerio Cristianos y Reunión de Fin de Semana',
        icon: NAV_ICONS.programacion,
      },
      {
        id: 's89',
        label: 'Hojas de Asignación S-89',
        shortLabel: 'Hojas S-89',
        subtitle: 'Generación, impresión y envío de asignaciones estudiantiles',
        icon: NAV_ICONS.s89,
      },
      {
        id: 'discursos',
        label: 'Discursos Públicos',
        shortLabel: 'Discursos',
        subtitle: 'Catálogo de bosquejos y programación de conferenciantes',
        icon: NAV_ICONS.discursos,
      },
      {
        id: 'hospitalidad',
        label: 'Hospitalidad de Oradores',
        shortLabel: 'Hospitalidad',
        subtitle: 'Familias anfitrionas, comidas y atención a oradores visitantes',
        icon: NAV_ICONS.hospitalidad,
      },
    ],
  },
  {
    id: 'secretaria',
    title: 'Secretaría y Registros Oficiales',
    shortTitle: 'Secretaría',
    items: [
      {
        id: 'estadisticas_secretaria',
        label: 'Resumen de Secretaría',
        shortLabel: 'Resumen',
        subtitle: 'Métricas generales, promedios y gráficas de la congregación',
        icon: NAV_ICONS.estadisticas_secretaria,
      },
      {
        id: 'publicadores',
        label: 'Directorio de Publicadores',
        shortLabel: 'Publicadores',
        subtitle: 'Directorio completo, teléfonos, grupos y privilegios',
        icon: NAV_ICONS.publicadores,
      },
      {
        id: 'precursores_auxiliares',
        label: 'Precursores Auxiliares (S-205)',
        shortLabel: 'Precursores',
        subtitle: 'Solicitudes mensuales y aprobación del comité de servicio',
        icon: NAV_ICONS.precursores_auxiliares,
      },
      {
        id: 'informe_s1',
        label: 'Informe S-1 Sucursal',
        shortLabel: 'Informe S-1',
        subtitle: 'Consolidación mensual de predicación y asistencia para sucursal',
        icon: NAV_ICONS.informe_s1,
      },
      {
        id: 'tarjetas_s21',
        label: 'Tarjetas de Publicador S-21',
        shortLabel: 'Tarjetas S-21',
        subtitle: 'Registro individual oficial por año de servicio',
        icon: NAV_ICONS.tarjetas_s21,
      },
      {
        id: 'informes_servicio',
        label: 'Informes de Predicación S-4',
        shortLabel: 'Informes S-4',
        subtitle: 'Recolección mensual por grupos de servicio',
        icon: NAV_ICONS.informes_servicio,
      },
      {
        id: 'asistencia',
        label: 'Asistencia a Reuniones S-88',
        shortLabel: 'Asistencia S-88',
        subtitle: 'Registro semanal y promedios mensuales de asistencia',
        icon: NAV_ICONS.asistencia,
      },
      {
        id: 'cuentas',
        label: 'Cuentas de la Congregación S-26',
        shortLabel: 'Cuentas S-26',
        subtitle: 'Registro contable, donaciones y resoluciones mensuales',
        icon: NAV_ICONS.cuentas,
      },
    ],
  },
  {
    id: 'predicacion',
    title: 'Predicación y Territorios',
    shortTitle: 'Predicación',
    items: [
      {
        id: 'territorios',
        label: 'Territorios S-13',
        shortLabel: 'Territorios',
        subtitle: 'Asignaciones digitales, mapas y control de vencimientos',
        icon: NAV_ICONS.territorios,
      },
      {
        id: 'grupos_servicio',
        label: 'Grupos de Servicio del Campo',
        shortLabel: 'Grupos',
        subtitle: 'Superintendentes, auxiliares y asignación de familias',
        icon: NAV_ICONS.grupos_servicio,
      },
      {
        id: 'carritos',
        label: 'Testimonio Público (Carritos)',
        shortLabel: 'Carritos',
        subtitle: 'Ubicaciones autorizadas, turnos, horarios y parejas',
        icon: NAV_ICONS.carritos,
      },
      {
        id: 'literatura',
        label: 'Literatura e Inventario S-14',
        shortLabel: 'Literatura',
        subtitle: 'Inventario mensual de publicaciones y solicitudes especiales',
        icon: NAV_ICONS.literatura,
      },
    ],
  },
  {
    id: 'salon',
    title: 'Salón del Reino y Servicios',
    shortTitle: 'Salón',
    items: [
      {
        id: 'limpieza_deberes',
        label: 'Servicios y Aseo del Salón',
        shortLabel: 'Servicios',
        subtitle: 'Acomodadores, audio/video, micrófonos y limpieza semanal',
        icon: NAV_ICONS.limpieza_deberes,
      },
      {
        id: 'tablero_anuncios',
        label: 'Tablero de Anuncios',
        shortLabel: 'Anuncios',
        subtitle: 'Avisos oficiales, cartas y circulares vigentes',
        icon: NAV_ICONS.tablero_anuncios,
      },
      {
        id: 'mantenimiento',
        label: 'Mantenimiento y Panel Eléctrico',
        shortLabel: 'Mantenimiento',
        subtitle: 'Programa anual de conservación, seguridad y tablero eléctrico del Salón',
        icon: NAV_ICONS.mantenimiento,
      },
      {
        id: 'visita_sc',
        label: 'Visita del Superintendente de Circuito',
        shortLabel: 'Visita SC',
        subtitle: 'Agenda de la semana especial, discursos y hospitalidad',
        icon: NAV_ICONS.visita_sc,
      },
      {
        id: 'memorial_asambleas',
        label: 'Conmemoración y Asambleas',
        shortLabel: 'Conmemoración',
        subtitle: 'Organización anual del Memorial y asambleas de circuito/regional',
        icon: NAV_ICONS.memorial_asambleas,
      },
    ],
  },
  {
    id: 'supervision',
    title: 'Supervisión, Ajustes y Seguridad',
    shortTitle: 'Supervisión',
    items: [
      {
        id: 'conflictos',
        label: 'Centro de Conflictos',
        shortLabel: 'Conflictos',
        subtitle: 'Detección de cruces de asignaciones en la misma reunión',
        icon: NAV_ICONS.conflictos,
      },
      {
        id: 'equidad',
        label: 'Panel de Equidad',
        shortLabel: 'Equidad',
        subtitle: 'Equilibrio en la distribución de partes y privilegios',
        icon: NAV_ICONS.equidad,
      },
      {
        id: 'exportar_pdf',
        label: 'Formatos Oficiales y PDF',
        shortLabel: 'Formatos PDF',
        subtitle: 'Exportación e impresión de plantillas S-89, S-140, S-21 y S-88',
        icon: NAV_ICONS.exportar_pdf,
      },
      {
        id: 'perfil',
        label: 'Mi Perfil y Cuenta',
        shortLabel: 'Mi Perfil',
        subtitle: 'Avatar, contacto, avisos push, seguridad 2FA y dispositivos',
        icon: NAV_ICONS.perfil,
      },
      {
        id: 'ajustes',
        label: 'Ajustes de Congregación',
        shortLabel: 'Ajustes',
        subtitle: 'Horarios, reglas de programación, nube y respaldos',
        icon: NAV_ICONS.ajustes,
      },
      {
        id: 'roles',
        label: 'Roles Teocráticos y PINs',
        shortLabel: 'Roles y PINs',
        subtitle: 'Directorio de credenciales, permisos por cargo y solicitudes de PIN',
        icon: NAV_ICONS.roles,
      },
    ],
  },
];

interface GlobalSectionQuickBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCategoryHub: string;
  onSelectCategoryHub: (cat: string) => void;
}

export const GlobalSectionQuickBar: React.FC<GlobalSectionQuickBarProps> = ({
  activeTab,
  setActiveTab,
  selectedCategoryHub,
  onSelectCategoryHub,
}) => {
  const { effectiveRoleInfo } = useAuth();

  // Normalize cronometro_ministerio to inicio and panel_electrico to mantenimiento for matching
  const normalizedTab: ActiveTab =
    activeTab === 'cronometro_ministerio'
      ? 'inicio'
      : activeTab === 'panel_electrico'
      ? 'mantenimiento'
      : activeTab;

  const { currentDept, currentItem, siblingItems } = useMemo(() => {
    // Prefer matching inside selectedCategoryHub first if applicable
    let matchedDept = APP_DEPARTMENT_GROUPS.find(
      (d) =>
        d.id === selectedCategoryHub &&
        d.items.some((item) => item.id === normalizedTab)
    );

    if (!matchedDept) {
      matchedDept =
        APP_DEPARTMENT_GROUPS.find((d) =>
          d.items.some((item) => item.id === normalizedTab)
        ) || APP_DEPARTMENT_GROUPS[0];
    }

    const item =
      matchedDept.items.find((i) => i.id === normalizedTab) ||
      matchedDept.items[0];

    const allowedSiblings = matchedDept.items.filter((i) =>
      isTabAllowedForRole(effectiveRoleInfo.id, i.id)
    );

    return {
      currentDept: matchedDept,
      currentItem: item,
      siblingItems: allowedSiblings,
    };
  }, [normalizedTab, selectedCategoryHub, effectiveRoleInfo.id]);

  // Do not show on the main cards hub itself ('menu') or on views that already have their own internal «← Todas las tarjetas» + quick switcher bar
  const tabsWithOwnInternalCardHub: ActiveTab[] = [
    'menu',
    'inicio',
    'cronometro_ministerio',
    'revisitas',
    'estudios_biblicos',
    'mi_vista',
    'perfil',
    'ajustes',
    'roles',
  ];
  if (tabsWithOwnInternalCardHub.includes(activeTab)) return null;

  const handleBackToCardsHub = () => {
    const targetCat =
      currentDept && currentDept.id !== 'inicio' ? currentDept.id : 'all';
    onSelectCategoryHub(targetCat);
    setActiveTab('menu');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const quickBarColorMap: Record<
    string,
    { active: string; inactiveIcon: string; inactiveBorder: string; headerText: string }
  > = {
    inicio: {
      active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
      inactiveBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
      headerText: 'text-indigo-600 dark:text-indigo-400',
    },
    revisitas: {
      active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      inactiveIcon: 'text-emerald-600 dark:text-emerald-400',
      inactiveBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
      headerText: 'text-emerald-600 dark:text-emerald-400',
    },
    estudios_biblicos: {
      active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      inactiveIcon: 'text-amber-600 dark:text-amber-400',
      inactiveBorder: 'hover:border-amber-300 dark:hover:border-amber-700/60',
      headerText: 'text-amber-600 dark:text-amber-400',
    },
    mi_vista: {
      active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      inactiveIcon: 'text-purple-600 dark:text-purple-400',
      inactiveBorder: 'hover:border-purple-300 dark:hover:border-purple-700/60',
      headerText: 'text-purple-600 dark:text-purple-400',
    },
    panorama_general: {
      active: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30',
      inactiveIcon: 'text-cyan-600 dark:text-cyan-400',
      inactiveBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700/60',
      headerText: 'text-cyan-600 dark:text-cyan-400',
    },
    calendario: {
      active: 'bg-violet-600 text-white shadow-md shadow-violet-600/30',
      inactiveIcon: 'text-violet-600 dark:text-violet-400',
      inactiveBorder: 'hover:border-violet-300 dark:hover:border-violet-700/60',
      headerText: 'text-violet-600 dark:text-violet-400',
    },
    programacion: {
      active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
      inactiveBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
      headerText: 'text-indigo-600 dark:text-indigo-400',
    },
    s89: {
      active: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      inactiveIcon: 'text-rose-600 dark:text-rose-400',
      inactiveBorder: 'hover:border-rose-300 dark:hover:border-rose-700/60',
      headerText: 'text-rose-600 dark:text-rose-400',
    },
    discursos: {
      active: 'bg-sky-600 text-white shadow-md shadow-sky-600/30',
      inactiveIcon: 'text-sky-600 dark:text-sky-400',
      inactiveBorder: 'hover:border-sky-300 dark:hover:border-sky-700/60',
      headerText: 'text-sky-600 dark:text-sky-400',
    },
    hospitalidad: {
      active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      inactiveIcon: 'text-amber-600 dark:text-amber-400',
      inactiveBorder: 'hover:border-amber-300 dark:hover:border-amber-700/60',
      headerText: 'text-amber-600 dark:text-amber-400',
    },
    estadisticas_secretaria: {
      active: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
      inactiveIcon: 'text-blue-600 dark:text-blue-400',
      inactiveBorder: 'hover:border-blue-300 dark:hover:border-blue-700/60',
      headerText: 'text-blue-600 dark:text-blue-400',
    },
    publicadores: {
      active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      inactiveIcon: 'text-emerald-600 dark:text-emerald-400',
      inactiveBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
      headerText: 'text-emerald-600 dark:text-emerald-400',
    },
    precursores_auxiliares: {
      active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      inactiveIcon: 'text-amber-600 dark:text-amber-400',
      inactiveBorder: 'hover:border-amber-300 dark:hover:border-amber-700/60',
      headerText: 'text-amber-600 dark:text-amber-400',
    },
    informe_s1: {
      active: 'bg-violet-600 text-white shadow-md shadow-violet-600/30',
      inactiveIcon: 'text-violet-600 dark:text-violet-400',
      inactiveBorder: 'hover:border-violet-300 dark:hover:border-violet-700/60',
      headerText: 'text-violet-600 dark:text-violet-400',
    },
    tarjetas_s21: {
      active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
      inactiveBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
      headerText: 'text-indigo-600 dark:text-indigo-400',
    },
    informes_servicio: {
      active: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30',
      inactiveIcon: 'text-cyan-600 dark:text-cyan-400',
      inactiveBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700/60',
      headerText: 'text-cyan-600 dark:text-cyan-400',
    },
    asistencia: {
      active: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      inactiveIcon: 'text-teal-600 dark:text-teal-400',
      inactiveBorder: 'hover:border-teal-300 dark:hover:border-teal-700/60',
      headerText: 'text-teal-600 dark:text-teal-400',
    },
    cuentas: {
      active: 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30',
      inactiveIcon: 'text-fuchsia-600 dark:text-fuchsia-400',
      inactiveBorder: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-700/60',
      headerText: 'text-fuchsia-600 dark:text-fuchsia-400',
    },
    territorios: {
      active: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      inactiveIcon: 'text-emerald-600 dark:text-emerald-400',
      inactiveBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
      headerText: 'text-emerald-600 dark:text-emerald-400',
    },
    grupos_servicio: {
      active: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
      inactiveIcon: 'text-blue-600 dark:text-blue-400',
      inactiveBorder: 'hover:border-blue-300 dark:hover:border-blue-700/60',
      headerText: 'text-blue-600 dark:text-blue-400',
    },
    carritos: {
      active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      inactiveIcon: 'text-purple-600 dark:text-purple-400',
      inactiveBorder: 'hover:border-purple-300 dark:hover:border-purple-700/60',
      headerText: 'text-purple-600 dark:text-purple-400',
    },
    literatura: {
      active: 'bg-orange-600 text-white shadow-md shadow-orange-600/30',
      inactiveIcon: 'text-orange-600 dark:text-orange-400',
      inactiveBorder: 'hover:border-orange-300 dark:hover:border-orange-700/60',
      headerText: 'text-orange-600 dark:text-orange-400',
    },
    limpieza_deberes: {
      active: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      inactiveIcon: 'text-teal-600 dark:text-teal-400',
      inactiveBorder: 'hover:border-teal-300 dark:hover:border-teal-700/60',
      headerText: 'text-teal-600 dark:text-teal-400',
    },
    tablero_anuncios: {
      active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
      inactiveBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
      headerText: 'text-indigo-600 dark:text-indigo-400',
    },
    mantenimiento: {
      active: 'bg-orange-600 text-white shadow-md shadow-orange-600/30',
      inactiveIcon: 'text-orange-600 dark:text-orange-400',
      inactiveBorder: 'hover:border-orange-300 dark:hover:border-orange-700/60',
      headerText: 'text-orange-600 dark:text-orange-400',
    },
    panel_electrico: {
      active: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      inactiveIcon: 'text-amber-600 dark:text-amber-400',
      inactiveBorder: 'hover:border-amber-300 dark:hover:border-amber-700/60',
      headerText: 'text-amber-600 dark:text-amber-400',
    },
    visita_sc: {
      active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      inactiveIcon: 'text-purple-600 dark:text-purple-400',
      inactiveBorder: 'hover:border-purple-300 dark:hover:border-purple-700/60',
      headerText: 'text-purple-600 dark:text-purple-400',
    },
    memorial_asambleas: {
      active: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      inactiveIcon: 'text-rose-600 dark:text-rose-400',
      inactiveBorder: 'hover:border-rose-300 dark:hover:border-rose-700/60',
      headerText: 'text-rose-600 dark:text-rose-400',
    },
    conflictos: {
      active: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      inactiveIcon: 'text-rose-600 dark:text-rose-400',
      inactiveBorder: 'hover:border-rose-300 dark:hover:border-rose-700/60',
      headerText: 'text-rose-600 dark:text-rose-400',
    },
    equidad: {
      active: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      inactiveIcon: 'text-teal-600 dark:text-teal-400',
      inactiveBorder: 'hover:border-teal-300 dark:hover:border-teal-700/60',
      headerText: 'text-teal-600 dark:text-teal-400',
    },
    exportar_pdf: {
      active: 'bg-orange-600 text-white shadow-md shadow-orange-600/30',
      inactiveIcon: 'text-orange-600 dark:text-orange-400',
      inactiveBorder: 'hover:border-orange-300 dark:hover:border-orange-700/60',
      headerText: 'text-orange-600 dark:text-orange-400',
    },
    perfil: {
      active: 'bg-sky-600 text-white shadow-md shadow-sky-600/30',
      inactiveIcon: 'text-sky-600 dark:text-sky-400',
      inactiveBorder: 'hover:border-sky-300 dark:hover:border-sky-700/60',
      headerText: 'text-sky-600 dark:text-sky-400',
    },
    ajustes: {
      active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
      inactiveBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
      headerText: 'text-indigo-600 dark:text-indigo-400',
    },
    roles: {
      active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      inactiveIcon: 'text-purple-600 dark:text-purple-400',
      inactiveBorder: 'hover:border-purple-300 dark:hover:border-purple-700/60',
      headerText: 'text-purple-600 dark:text-purple-400',
    },
  };

  const currColor =
    (currentItem && quickBarColorMap[currentItem.id]) || quickBarColorMap.inicio;

  return (
    <div className="mb-4 kg-glass-surface kg-sheen-top p-3 sm:p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
      {/* Left: Back to Cards Hub button + Current Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          data-mobile-back-btn="true"
          onClick={handleBackToCardsHub}
          className="px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] text-zinc-800 dark:text-[#F4F4F5] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 border border-zinc-200/70 dark:border-white/[0.08]"
          title="Volver al tablero de todas las tarjetas"
        >
          <ArrowLeft className={`w-4 h-4 ${currColor.inactiveIcon} shrink-0`} />
          <span>Todas las tarjetas</span>
        </button>

        {currentItem && (
          <div className="min-w-0">
            <div className={`flex items-center gap-1.5 text-[11px] font-bold ${currColor.headerText}`}>
              <LayoutGrid className="w-3 h-3 shrink-0" />
              <span className="truncate">{currentDept.title}</span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
              {currentItem.label}
            </h2>
          </div>
        )}
      </div>

      {/* Right: Quick Section Switcher for sibling sections in the same department */}
      {siblingItems.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0">
          {siblingItems.map((sib) => {
            const SibIcon = sib.icon;
            const isCurr = sib.id === normalizedTab;
            const sibTheme = quickBarColorMap[sib.id] || quickBarColorMap.inicio;
            return (
              <button
                key={sib.id}
                type="button"
                onClick={() => {
                  setActiveTab(sib.id);
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 ${
                  isCurr
                    ? `${sibTheme.active} font-black`
                    : `bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/60 dark:border-white/[0.06] ${sibTheme.inactiveBorder}`
                }`}
                title={sib.label}
              >
                <SibIcon className={`w-3.5 h-3.5 shrink-0 ${isCurr ? 'text-white' : sibTheme.inactiveIcon}`} />
                <span>{sib.shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
