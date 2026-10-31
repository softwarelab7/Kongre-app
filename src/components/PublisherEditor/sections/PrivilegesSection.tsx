// src/components/PublisherEditor/sections/PrivilegesSection.tsx
import React, { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  Star,
  Key,
  Briefcase,
  ShieldAlert,
  Clock,
  Award,
  BookOpen,
  Heart,
  Droplets,
  Headphones,
  DoorOpen,
  ClipboardList,
  Mic,
  MessageCircle,
  Wrench,
  DollarSign,
  Library,
  Newspaper,
  PenLine,
  Home,
  Map,
  CalendarDays,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  AlertTriangle,
  Compass,
  Building2,
} from 'lucide-react';
import { PremiumDatePicker } from '../../PremiumDatePicker';

interface PrivilegesSectionProps {
  formData: any;
  groups: any[];
  handleChange: (field: any, value: any) => void;
  togglePrivilege: (id: string) => void;
  setPrivilegeRole: (id: string, role: 'none' | 'titular' | 'auxiliar') => void;
}

interface ResponsibilityDef {
  id: string;
  label: string;
  sub: string;
  category: 'teaching' | 'admin' | 'hall';
  icon: React.ReactNode;
}

const RESPONSIBILITIES_CATALOG: ResponsibilityDef[] = [
  // Enseñanza y Comité de Servicio
  {
    id: 'coordinator',
    label: 'Coordinador del Cuerpo de Ancianos',
    sub: 'Presidencia y coordinación general',
    category: 'teaching',
    icon: <Star size={15} />,
  },
  {
    id: 'secretary',
    label: 'Secretario de la Congregación',
    sub: 'Registros S-21, informes S-1 y correspondencia',
    category: 'teaching',
    icon: <PenLine size={15} />,
  },
  {
    id: 'service_overseer',
    label: 'Superintendente de Servicio',
    sub: 'Predicación, grupos y precursores',
    category: 'teaching',
    icon: <Compass size={15} />,
  },
  {
    id: 'clm_overseer',
    label: 'Sup. Reunión Vida y Ministerio',
    sub: 'Programa S-140 y asignaciones estudiantiles',
    category: 'teaching',
    icon: <CalendarDays size={15} />,
  },
  {
    id: 'watchtower_conductor',
    label: 'Conductor de Estudio de La Atalaya',
    sub: 'Enseñanza dominical en reunión pública',
    category: 'teaching',
    icon: <BookOpen size={15} />,
  },
  {
    id: 'auxiliary_counselor',
    label: 'Consejero de la Sala Auxiliar',
    sub: 'Consejo y estímulo a estudiantes',
    category: 'teaching',
    icon: <MessageCircle size={15} />,
  },
  {
    id: 'public_talk_coordinator',
    label: 'Coordinador de Discursos Públicos',
    sub: 'Programación de oradores locales y visitantes',
    category: 'teaching',
    icon: <Mic size={15} />,
  },

  // Administración, Territorios y Publicaciones
  {
    id: 'accounts_servant',
    label: 'Siervo de Cuentas',
    sub: 'Registro mensual S-26, S-30 y donaciones',
    category: 'admin',
    icon: <DollarSign size={15} />,
  },
  {
    id: 'territory_servant',
    label: 'Siervo de Territorios',
    sub: 'Control de mapas y registro S-13',
    category: 'admin',
    icon: <Map size={15} />,
  },
  {
    id: 'literature_servant',
    label: 'Siervo de Literatura',
    sub: 'Inventario S-28 y solicitudes especiales S-14',
    category: 'admin',
    icon: <Library size={15} />,
  },
  {
    id: 'magazines_servant',
    label: 'Siervo de Publicaciones Periódicas',
    sub: 'Distribución mensual de ejemplares impresos',
    category: 'admin',
    icon: <Newspaper size={15} />,
  },
  {
    id: 'billboard_manager',
    label: 'Encargado del Tablero de Anuncios',
    sub: 'Actualización de programas y cartas vigentes',
    category: 'admin',
    icon: <ClipboardList size={15} />,
  },

  // Operación del Salón y Audio/Video
  {
    id: 'full_audio_video',
    label: 'Superintendente / Siervo de Audio y Video',
    sub: 'Consola, micrófonos, transmisión y multimedia',
    category: 'hall',
    icon: <Headphones size={15} />,
  },
  {
    id: 'attendant_overseer',
    label: 'Encargado de Acomodadores',
    sub: 'Orden, bienvenida, asistencia S-88 y seguridad',
    category: 'hall',
    icon: <DoorOpen size={15} />,
  },
  {
    id: 'maintenance_coordinator',
    label: 'Coordinador de Mantenimiento',
    sub: 'Inspecciones preventivas del Salón del Reino',
    category: 'hall',
    icon: <Wrench size={15} />,
  },
  {
    id: 'cleaning_overseer',
    label: 'Coordinador de Aseo y Limpieza',
    sub: 'Organización semanal de limpieza por grupos',
    category: 'hall',
    icon: <CheckCircle2 size={15} />,
  },
];

export const PrivilegesSection: React.FC<PrivilegesSectionProps> = ({
  formData,
  groups,
  handleChange,
  setPrivilegeRole,
}) => {
  const [respFilter, setRespFilter] = useState<'all' | 'active' | 'teaching' | 'admin' | 'hall'>(
    'all'
  );
  const [showJudicialPanel, setShowJudicialPanel] = useState<boolean>(
    Boolean(formData.is_reproved || formData.is_disfellowshipped || formData.is_reinstated)
  );

  const calculateDuration = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const start = new Date(dateStr + 'T00:00:00');
      if (isNaN(start.getTime())) return null;
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (now.getDate() < start.getDate()) months--;
      if (months < 0) {
        years--;
        months += 12;
      }
      const totalMonths = Math.max(0, years * 12 + months);
      return {
        years: Math.max(0, years),
        months: Math.max(0, months),
        totalMonths,
        formatted:
          years > 0
            ? `${years} ${years === 1 ? 'año' : 'años'}${months > 0 ? ` · ${months}m` : ''}`
            : `${Math.max(0, months)} ${months === 1 ? 'mes' : 'meses'}`,
      };
    } catch {
      return null;
    }
  };

  const baptismDuration = useMemo(
    () => calculateDuration(formData.baptism_date || formData.baptismDate),
    [formData.baptism_date, formData.baptismDate]
  );

  const publisherDuration = useMemo(
    () => calculateDuration(formData.publisher_date),
    [formData.publisher_date]
  );

  const appointmentDuration = useMemo(
    () => calculateDuration(formData.appointment_date),
    [formData.appointment_date]
  );

  const pioneerDuration = useMemo(
    () => calculateDuration(formData.pioneerStartDate),
    [formData.pioneerStartDate]
  );

  const shepherdingAgo = useMemo(
    () => calculateDuration(formData.last_shepherding_visit || formData.last_visit_date),
    [formData.last_shepherding_visit, formData.last_visit_date]
  );

  const isFemale = formData.gender === 'female' || formData.gender === 'hermana';
  const isAppointedMale = !isFemale && (formData.role === 'elder' || formData.role === 'servant');
  const isAnointed = Boolean(formData.is_anointed || formData.hope === 'ungido');
  const isBaptized = formData.role !== 'unbaptized';

  const roleCards = useMemo(() => {
    const base = [
      ...(!isFemale
        ? [
            {
              id: 'elder',
              title: 'Anciano',
              sub: 'Pastoreo, enseñanza y supervisión',
              badge: 'Cuerpo de Ancianos',
              activeBorder: 'border-emerald-500 dark:border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/25',
              activeIcon: 'bg-emerald-600 text-white',
              activeText: 'text-emerald-900 dark:text-emerald-200',
            },
            {
              id: 'servant',
              title: 'Siervo Ministerial',
              sub: 'Apoyo ministerial y departamentos',
              badge: 'Nombrado',
              activeBorder: 'border-indigo-500 dark:border-indigo-500/80 bg-indigo-50/50 dark:bg-indigo-950/25',
              activeIcon: 'bg-indigo-600 text-white',
              activeText: 'text-indigo-900 dark:text-indigo-200',
            },
          ]
        : []),
      {
        id: 'publisher',
        title: isFemale ? 'Publicadora Bautizada' : 'Publicador Bautizado',
        sub: 'Miembro bautizado de la congregación',
        badge: 'Bautizado(a)',
        activeBorder: 'border-sky-500 dark:border-sky-500/80 bg-sky-50/50 dark:bg-sky-950/25',
        activeIcon: 'bg-sky-600 text-white',
        activeText: 'text-sky-900 dark:text-sky-200',
      },
      {
        id: 'unbaptized',
        title: isFemale ? 'Publicadora No Bautizada' : 'Publicador No Bautizado',
        sub: 'Participa en el ministerio público',
        badge: 'En progreso',
        activeBorder: 'border-zinc-500 dark:border-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/40',
        activeIcon: 'bg-zinc-700 text-white',
        activeText: 'text-zinc-900 dark:text-zinc-100',
      },
    ];
    return base;
  }, [isFemale]);

  const pioneerOptions = [
    {
      id: 'none',
      label: 'Publicador de Congregación',
      quota: 'Sin meta fija de horas',
      short: 'Congregación',
    },
    {
      id: 'auxiliary',
      label: 'Precursor Auxiliar',
      quota: 'Meta mensual: 30 h (o 15 h en campaña)',
      short: 'P. Auxiliar',
    },
    {
      id: 'regular',
      label: 'Precursor Regular',
      quota: 'Meta: 50 h/mes · 600 h anuales',
      short: 'P. Regular',
    },
    {
      id: 'special',
      label: 'Precursor Especial / Misionero',
      quota: 'Meta: 100 h/mes',
      short: 'P. Especial',
    },
  ];

  const currentPioneerId =
    formData.pioneer_type === 'auxiliary_continuous'
      ? 'auxiliary'
      : formData.pioneer_type || 'none';

  const selectedGroup = useMemo(
    () =>
      groups.find(
        (g) =>
          String(g.id) === String(formData.id_grupo) ||
          String(g.number) === String(formData.groupNumber)
      ),
    [groups, formData.id_grupo, formData.groupNumber]
  );

  const activePrivilegesList: string[] = Array.isArray(formData.privileges)
    ? formData.privileges
    : [];

  const filteredResponsibilities = useMemo(() => {
    return RESPONSIBILITIES_CATALOG.filter((item) => {
      const isAssigned =
        activePrivilegesList.includes(item.id) ||
        activePrivilegesList.includes(`${item.id}_aux`);
      if (respFilter === 'active') return isAssigned;
      if (respFilter === 'teaching') return item.category === 'teaching';
      if (respFilter === 'admin') return item.category === 'admin';
      if (respFilter === 'hall') return item.category === 'hall';
      return true;
    });
  }, [respFilter, activePrivilegesList]);

  const titularCount = RESPONSIBILITIES_CATALOG.filter((r) =>
    activePrivilegesList.includes(r.id)
  ).length;
  const auxCount = RESPONSIBILITIES_CATALOG.filter((r) =>
    activePrivilegesList.includes(`${r.id}_aux`)
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-6">
      {/* BLOQUE 1: MATRIZ DE NOMBRAMIENTO TEOCRÁTICO Y RESUMEN S-21 */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
        {/* Cabecera Ejecutiva */}
        <div className="p-6 md:px-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-500/20">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Estado Espiritual, Nombramiento y Cuidado Pastoral
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                  · {isAnointed ? 'Ungido' : 'Otras ovejas'} ·{' '}
                  {formData.is_active === false ? 'Inactivo' : 'Activo'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Clasificación eclesiástica S-21, línea de tiempo espiritual, grupo de predicación, pastoreo y cargos
              </p>
            </div>
          </div>

          {/* Selector de Esperanza S-21 (Otras ovejas / Ungido) */}
          <div className="flex items-center gap-2 self-start lg:self-auto bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pl-2.5 pr-1">
              Esperanza S-21:
            </span>
            <button
              type="button"
              onClick={() => {
                handleChange('hope', 'otras_ovejas');
                handleChange('is_anointed', false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isAnointed
                  ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Otras ovejas
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange('hope', 'ungido');
                handleChange('is_anointed', true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isAnointed
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Star size={12} />
              <span>Ungido</span>
            </button>
          </div>
        </div>

        {/* Selector Arquitectónico de Rol Teocrático */}
        <div className="p-6 md:px-8 bg-zinc-50/40 dark:bg-white/[0.01] border-b border-zinc-100 dark:border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              1. Nombramiento / Posición en la Congregación
            </span>
            <span className="text-[11px] text-zinc-400">
              {isFemale
                ? 'Opciones adaptadas para hermana'
                : 'Selecciona el nombramiento actual del hermano'}
            </span>
          </div>

          <div
            className={`grid grid-cols-1 ${
              isFemale ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'
            } gap-3`}
          >
            {roleCards.map((rc) => {
              const isSelected =
                formData.role === rc.id ||
                (rc.id === 'servant' && formData.role === 'ministerial_servant');
              return (
                <button
                  key={rc.id}
                  type="button"
                  onClick={() => {
                    handleChange('role', rc.id);
                    if (rc.id === 'unbaptized') {
                      handleChange('baptism_date', '');
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? `${rc.activeBorder} shadow-2xs`
                      : 'bg-white dark:bg-zinc-900/70 border-zinc-200/80 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isSelected
                          ? rc.activeIcon
                          : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {rc.badge}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? rc.activeIcon + ' border-transparent'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? rc.activeText : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {rc.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {rc.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cinta de Indicadores Clave (KPI Strip con Tabular Nums) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-white/[0.05]">
          <div className="px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Tiempo de Bautismo
            </span>
            <p className="text-base font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
              {!isBaptized
                ? 'No bautizado'
                : baptismDuration
                ? baptismDuration.formatted
                : 'Sin fecha reg.'}
            </p>
          </div>
          <div className="px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Modalidad de Servicio
            </span>
            <p className="text-base font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
              {pioneerOptions.find((p) => p.id === currentPioneerId)?.short || 'Congregación'}
              {pioneerDuration && currentPioneerId !== 'none' && (
                <span className="text-xs font-normal text-zinc-400 ml-1.5">
                  ({pioneerDuration.formatted})
                </span>
              )}
            </p>
          </div>
          <div className="px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Grupo de Servicio
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
              {selectedGroup ? selectedGroup.name : 'Sin grupo asignado'}
            </p>
          </div>
          <div className="px-6 py-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Cuidado Pastoral
            </span>
            <p
              className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                !shepherdingAgo || shepherdingAgo.totalMonths >= 12
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {shepherdingAgo ? `Hace ${shepherdingAgo.formatted}` : 'Sin visita reg.'}
            </p>
          </div>
        </div>
      </section>

      {/* BLOQUE 2: LÍNEA DE TIEMPO TEOCRÁTICA (HITOS CRONOLÓGICOS) */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-sky-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              2. Línea de Tiempo de Hitos Espirituales (Registro S-21)
            </h4>
          </div>
          <span className="text-xs text-zinc-400">
            Fechas históricas oficiales de progreso espiritual
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Hito A: Inicio como Publicador */}
          <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                  01
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Inicio Publicador
                </span>
              </div>
              {publisherDuration && (
                <span className="text-[11px] font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                  {publisherDuration.formatted}
                </span>
              )}
            </div>
            <div>
              <PremiumDatePicker
                value={formData.publisher_date || ''}
                onChange={(v) => handleChange('publisher_date', v)}
                allowFutureYears={false}
              />
              <p className="text-[10px] text-zinc-400 mt-1.5">
                Primer informe de predicación entregado
              </p>
            </div>
          </div>

          {/* Hito B: Fecha de Bautismo */}
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-opacity ${
              !isBaptized
                ? 'bg-zinc-100/50 dark:bg-white/[0.01] border-zinc-200/40 dark:border-white/[0.03] opacity-45 pointer-events-none'
                : 'bg-sky-50/40 dark:bg-sky-950/15 border-sky-200/70 dark:border-sky-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold flex items-center justify-center">
                  02
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Bautismo (S-21)
                </span>
              </div>
              {baptismDuration && isBaptized && (
                <span className="text-[11px] font-mono tabular-nums font-semibold text-sky-600 dark:text-sky-400">
                  {baptismDuration.formatted}
                </span>
              )}
            </div>
            <div>
              <PremiumDatePicker
                value={formData.baptism_date || formData.baptismDate || ''}
                onChange={(v) => {
                  handleChange('baptism_date', v);
                  handleChange('baptismDate', v);
                }}
                allowFutureYears={false}
              />
              <p className="text-[10px] text-zinc-400 mt-1.5">
                {isBaptized
                  ? 'Fecha oficial impresa en la tarjeta S-21'
                  : 'Cambia a Publicador Bautizado para habilitar'}
              </p>
            </div>
          </div>

          {/* Hito C: Fecha de Nombramiento (Anciano / Siervo) o Inicio Precursorado */}
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              isAppointedMale
                ? 'bg-indigo-50/40 dark:bg-indigo-950/15 border-indigo-200/70 dark:border-indigo-800/40'
                : 'bg-zinc-50/70 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">
                  03
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {isAppointedMale
                    ? `Nombramiento (${formData.role === 'elder' ? 'Anciano' : 'S.M.'})`
                    : 'Inicio Precursorado'}
                </span>
              </div>
              {isAppointedMale && appointmentDuration && (
                <span className="text-[11px] font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                  {appointmentDuration.formatted}
                </span>
              )}
            </div>
            <div>
              <PremiumDatePicker
                value={
                  isAppointedMale
                    ? formData.appointment_date || ''
                    : formData.pioneerStartDate || ''
                }
                onChange={(v) =>
                  handleChange(
                    isAppointedMale ? 'appointment_date' : 'pioneerStartDate',
                    v
                  )
                }
                allowFutureYears={false}
              />
              <p className="text-[10px] text-zinc-400 mt-1.5">
                {isAppointedMale
                  ? 'Fecha de carta de nombramiento actual'
                  : 'Fecha de nombramiento como precursor'}
              </p>
            </div>
          </div>

          {/* Hito D: Escuela de Precursores / Inicio Precursorado */}
          <div className="p-4 rounded-2xl bg-amber-50/35 dark:bg-amber-950/15 border border-amber-200/70 dark:border-amber-800/40 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold flex items-center justify-center">
                  04
                </span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Escuela Precursores
                </span>
              </div>
              <GraduationCap size={14} className="text-amber-500" />
            </div>
            <div>
              <PremiumDatePicker
                value={formData.pioneer_school_date || ''}
                onChange={(v) => handleChange('pioneer_school_date', v)}
                allowFutureYears={false}
              />
              <p className="text-[10px] text-zinc-400 mt-1.5">
                Última asistencia a la Escuela de Precursores
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE 3: DOS COLUMNAS OPERATIVAS (MINISTERIO Y GRUPO vs PASTOREO Y ESTADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (6 cols): Precursorado y Grupo de Servicio del Campo */}
        <section className="lg:col-span-6 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-7 shadow-xs flex flex-col justify-between space-y-6">
          {/* Sub-bloque: Modalidad de Precursorado */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={17} className="text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  3. Servicio de Precursor (S-21)
                </h4>
              </div>
              {currentPioneerId !== 'none' && (
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      'pioneer_type',
                      formData.pioneer_type === 'auxiliary_continuous'
                        ? 'auxiliary'
                        : 'auxiliary_continuous'
                    )
                  }
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    formData.pioneer_type === 'auxiliary_continuous'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {formData.pioneer_type === 'auxiliary_continuous'
                    ? '✓ Auxiliar Continuo'
                    : 'Marcar Aux. Continuo'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pioneerOptions.map((opt) => {
                const isSelected = currentPioneerId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChange('pioneer_type', opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 dark:border-amber-500/80 shadow-2xs'
                        : 'bg-zinc-50/60 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-amber-900 dark:text-amber-200'
                            : 'text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </div>
                    </div>
                    <p className="text-[10px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400 mt-1">
                      {opt.quota}
                    </p>
                  </button>
                );
              })}
            </div>

            {currentPioneerId !== 'none' && isAppointedMale && (
              <div className="pt-2">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Fecha de Inicio del Precursorado
                </label>
                <PremiumDatePicker
                  value={formData.pioneerStartDate || ''}
                  onChange={(v) => handleChange('pioneerStartDate', v)}
                  allowFutureYears={false}
                />
              </div>
            )}
          </div>

          {/* Sub-bloque: Grupo de Servicio del Campo */}
          <div className="pt-5 border-t border-zinc-100 dark:border-white/[0.05] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={17} className="text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  4. Grupo de Servicio del Campo
                </h4>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {selectedGroup ? selectedGroup.name : 'Sin asignar'}
              </span>
            </div>

            {/* Selector directo de grupo en cuadrícula limpia */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleChange('id_grupo', null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !formData.id_grupo && !formData.groupNumber
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 border-transparent'
                    : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 border-zinc-200/70 dark:border-white/[0.06] hover:border-zinc-300'
                }`}
              >
                Sin grupo
              </button>
              {groups.map((g) => {
                const isSel =
                  String(formData.id_grupo) === String(g.id) ||
                  String(formData.groupNumber) === String(g.number);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleChange('id_grupo', g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06] hover:border-emerald-400'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>

            {/* Cargo dentro del grupo */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Responsabilidad dentro del Grupo de Predicación
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/60 dark:border-white/[0.06]">
                {[
                  { id: 'miembro', label: 'Integrante' },
                  { id: 'assistant', label: 'Auxiliar de Grupo' },
                  { id: 'overseer', label: 'Sup. de Grupo' },
                ].map((resp) => {
                  const isActive = (formData.group_responsibility || 'miembro') === resp.id;
                  return (
                    <button
                      key={resp.id}
                      type="button"
                      onClick={() => handleChange('group_responsibility', resp.id)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {resp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Llave del Salón y Servicio en Betel/LDC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleChange('has_key', !formData.has_key)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  formData.has_key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Key size={14} /> Llave del Salón del Reino
                </span>
                <CheckCircle2 size={14} className={formData.has_key ? 'opacity-100' : 'opacity-25'} />
              </button>

              <button
                type="button"
                onClick={() => handleChange('reports_to_branch', !formData.reports_to_branch)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  formData.reports_to_branch
                    ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 size={14} /> Sirve en Betel / LDC
                </span>
                <CheckCircle2
                  size={14}
                  className={formData.reports_to_branch ? 'opacity-100' : 'opacity-25'}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Columna Derecha (6 cols): Pastoreo, Estado de Actividad y Registro Confidencial */}
        <section className="lg:col-span-6 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-7 shadow-xs flex flex-col justify-between space-y-6">
          {/* Sub-bloque: Seguimiento de Visitas de Pastoreo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={17} className="text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  5. Visitas de Pastoreo y Progreso Espiritual
                </h4>
              </div>
              {shepherdingAgo ? (
                <span
                  className={`text-xs font-mono tabular-nums font-bold ${
                    shepherdingAgo.totalMonths >= 12
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  Última: hace {shepherdingAgo.formatted}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">Sin visitas registradas</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Fecha de Última Visita de Pastoreo
                </label>
                <PremiumDatePicker
                  value={formData.last_shepherding_visit || formData.last_visit_date || ''}
                  onChange={(v) => {
                    handleChange('last_shepherding_visit', v);
                    handleChange('last_visit_date', v);
                  }}
                  allowFutureYears={false}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Prioridad de Atención Pastoral
                </label>
                <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06] h-[42px]">
                  {[
                    { id: 'normal', label: 'Normal', active: 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-2xs' },
                    { id: 'pronto', label: 'Pronto', active: 'bg-amber-500 text-white shadow-2xs' },
                    { id: 'urgente', label: 'Urgente', active: 'bg-rose-600 text-white shadow-2xs' },
                  ].map((prio) => {
                    const isCurrent = (formData.pastoral_priority || 'normal') === prio.id;
                    return (
                      <button
                        key={prio.id}
                        type="button"
                        onClick={() => handleChange('pastoral_priority', prio.id)}
                        className={`rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? prio.active
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        {prio.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Ancianos que realizaron la última visita
              </label>
              <input
                type="text"
                value={formData.shepherding_elders || ''}
                onChange={(e) => handleChange('shepherding_elders', e.target.value)}
                placeholder="Ej. Hno. García y Hno. Martínez"
                className="kf-input w-full text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Notas de Progreso Espiritual y Metas Teocráticas
              </label>
              <textarea
                rows={2}
                value={formData.spiritual_notes || ''}
                onChange={(e) => handleChange('spiritual_notes', e.target.value)}
                placeholder="Ej. Excelente comentador en las reuniones, se prepara para precursor auxiliar..."
                className="kf-input w-full resize-none text-xs"
              />
            </div>
          </div>

          {/* Sub-bloque: Estado de Actividad + Panel Judicial Discreto */}
          <div className="pt-5 border-t border-zinc-100 dark:border-white/[0.05] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Estado de Actividad Mensual
              </span>
              <div className="inline-flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06] gap-1">
                <button
                  type="button"
                  onClick={() => {
                    handleChange('is_active', true);
                    handleChange('is_regular', true);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    formData.is_active !== false && formData.is_regular
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Activo Regular
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('is_active', true);
                    handleChange('is_regular', false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    formData.is_active !== false && !formData.is_regular
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Activo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('is_active', false);
                    handleChange('is_regular', false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    formData.is_active === false
                      ? 'bg-zinc-700 text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Inactivo
                </button>
              </div>
            </div>

            {/* Cajón desplegable discreto para Indicadores Judiciales / Comité */}
            <div className="rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowJudicialPanel((p) => !p)}
                className="w-full px-4 py-2.5 bg-zinc-50/80 dark:bg-white/[0.02] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span>Registro Confidencial del Comité (Restricciones / Readmisión)</span>
                </span>
                <div className="flex items-center gap-2">
                  {(formData.is_reproved ||
                    formData.is_disfellowshipped ||
                    formData.is_reinstated) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                  {showJudicialPanel ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>

              {showJudicialPanel && (
                <div className="p-3.5 bg-white dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-white/[0.05] grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'is_reproved',
                      label: 'Censurado',
                      activeClass: 'bg-amber-600 text-white border-amber-600',
                    },
                    {
                      id: 'is_disfellowshipped',
                      label: 'Sacado',
                      activeClass: 'bg-rose-600 text-white border-rose-600',
                    },
                    {
                      id: 'is_reinstated',
                      label: 'Readmitido',
                      activeClass: 'bg-teal-600 text-white border-teal-600',
                    },
                  ].map((jItem) => {
                    const active = Boolean(formData[jItem.id]);
                    return (
                      <button
                        key={jItem.id}
                        type="button"
                        onClick={() => handleChange(jItem.id, !active)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? jItem.activeClass
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {active ? `✓ ${jItem.label}` : jItem.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* BLOQUE 4: MATRIZ DE RESPONSABILIDADES Y DEPARTAMENTOS DE LA CONGREGACIÓN */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                6. Departamentos y Responsabilidades de Congregación
              </h4>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                · {titularCount} como Titular · {auxCount} como Auxiliar
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Define los cargos operativos o de supervisión asignados como encargado titular o siervo auxiliar
            </p>
          </div>

          {/* Filtros de Departamento */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06] overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Todos (16)' },
              { id: 'active', label: `Asignados (${titularCount + auxCount})` },
              { id: 'teaching', label: 'Enseñanza y Comité' },
              { id: 'admin', label: 'Cuentas y Territorios' },
              { id: 'hall', label: 'Salón y Audio/Video' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRespFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  respFilter === tab.id
                    ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Responsabilidades en 2 Columnas Tipo Ledger */}
        {filteredResponsibilities.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No hay responsabilidades asignadas en este filtro. Cambia a «Todos» para asignar un departamento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredResponsibilities.map((priv) => {
              const isTitular = activePrivilegesList.includes(priv.id);
              const isAuxiliar = activePrivilegesList.includes(`${priv.id}_aux`);
              const currentRole = isTitular ? 'titular' : isAuxiliar ? 'auxiliar' : 'none';

              return (
                <div
                  key={priv.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    currentRole === 'titular'
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/25 border-indigo-400 dark:border-indigo-500/60 shadow-2xs'
                      : currentRole === 'auxiliar'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-400/70 dark:border-emerald-500/50'
                      : 'bg-zinc-50/50 dark:bg-white/[0.015] border-zinc-200/70 dark:border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        currentRole === 'titular'
                          ? 'bg-indigo-600 text-white'
                          : currentRole === 'auxiliar'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200/70 dark:border-white/[0.06]'
                      }`}
                    >
                      {priv.icon}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          currentRole !== 'none'
                            ? 'text-zinc-900 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {priv.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {priv.sub}
                      </p>
                    </div>
                  </div>

                  {/* Selector segmentado de 3 estados */}
                  <div className="inline-flex bg-white dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] shrink-0 self-end sm:self-center">
                    {[
                      { role: 'none' as const, label: 'No' },
                      { role: 'titular' as const, label: 'Titular' },
                      { role: 'auxiliar' as const, label: 'Auxiliar' },
                    ].map((opt) => {
                      const active = currentRole === opt.role;
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => setPrivilegeRole(priv.id, opt.role)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            active
                              ? opt.role === 'titular'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : opt.role === 'auxiliar'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
