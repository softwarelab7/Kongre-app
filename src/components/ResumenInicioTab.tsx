// src/components/ResumenInicioTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import { TheocraticRole } from '../utils/rbac';
import { ResponsiveServiceChart } from './charts/ResponsiveServiceChart';
import { ResponsiveAttendanceChart } from './charts/ResponsiveAttendanceChart';
import { PublisherPinsModal } from './PublisherPinsModal';
import {
  Calendar,
  Users,
  Award,
  Map,
  Landmark,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Printer,
  Tv,
  Timer,
  FileText,
  ShieldCheck,
  Shield,
  ChevronRight,
  Mic,
  Brush,
  BookOpen,
  LayoutGrid,
  Clock,
  TrendingUp,
  UserCheck,
  Heart,
  Zap,
  MapPin,
  Check,
  KeyRound,
  CreditCard,
  Package,
  Wrench,
  ClipboardList,
  Compass,
  ShoppingBag,
} from 'lucide-react';

export interface QuickAccessTool {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  iconBgClass: string;
  onClick: () => void;
}

export interface QuickAccessGridProps {
  roleId: TheocraticRole;
  roleName: string;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenPinsModal?: () => void;
  publisherPinsCount?: number;
}

export const QuickAccessGrid: React.FC<QuickAccessGridProps> = ({
  roleId,
  roleName,
  setActiveTab,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenPinsModal,
  publisherPinsCount = 0,
}) => {
  const tools = useMemo<QuickAccessTool[]>(() => {
    switch (roleId) {
      case 'secretario':
        return [
          {
            id: 'informes_s4',
            title: 'Informes S-4',
            subtitle: 'Recopilación mensual',
            badge: 'Prioritario',
            icon: FileText,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('informes_servicio'),
          },
          {
            id: 'tarjetas_s21',
            title: 'Tarjetas S-21',
            subtitle: 'Registro de publicador',
            badge: 'S-21',
            icon: ClipboardList,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('tarjetas_s21'),
          },
          {
            id: 'asistencia_s88',
            title: 'Asistencia S-88',
            subtitle: 'Conteo de reuniones',
            badge: 'Semanal',
            icon: TrendingUp,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('asistencia'),
          },
          {
            id: 'directorio_pub',
            title: 'Publicadores',
            subtitle: 'Censo y privilegios',
            badge: `${publisherPinsCount} PINs`,
            icon: Users,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('publicadores'),
          },
        ];

      case 'superintendente_servicio':
      case 'superintendente_grupo':
        return [
          {
            id: 'grupos_predicacion',
            title: 'Grupos de Servicio',
            subtitle: 'Organización y salidas',
            badge: 'Campo',
            icon: Users,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('grupos_servicio'),
          },
          {
            id: 'territorios_mapa',
            title: 'Territorios S-13',
            subtitle: 'Asignación y cobertura',
            badge: 'Mapas',
            icon: MapPin,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('territorios'),
          },
          {
            id: 'informes_campo',
            title: 'Informes S-4',
            subtitle: 'Seguimiento del grupo',
            badge: 'Mensual',
            icon: FileText,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('informes_servicio'),
          },
          {
            id: 'carritos_publico',
            title: 'Carritos Públicos',
            subtitle: 'Turnos y ubicaciones',
            badge: 'Turnos',
            icon: ShoppingBag,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('carritos'),
          },
        ];

      case 'superintendente_vym':
        return [
          {
            id: 'programa_vym',
            title: 'Programa VyM',
            subtitle: 'Asignaciones semanales',
            badge: 'S-140',
            icon: Calendar,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('programacion'),
          },
          {
            id: 'hojas_s89',
            title: 'Hojas S-89',
            subtitle: 'Vista previa y envío',
            badge: 'PDF',
            icon: Award,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('s89'),
          },
          {
            id: 'clm_estudiantes',
            title: 'Escuela VyM',
            subtitle: 'Historial y estudiantes',
            badge: 'CLM',
            icon: BookOpen,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('clm_vmc'),
          },
          {
            id: 'modo_atril_vym',
            title: 'Cronómetro Atril',
            subtitle: 'Control de tiempos',
            badge: 'En vivo',
            icon: Timer,
            accentClass: 'hover:border-sky-500/40 dark:hover:border-sky-400/40',
            iconBgClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
            onClick: () => (onOpenTimerModal ? onOpenTimerModal() : setActiveTab('programacion')),
          },
        ];

      case 'siervo_territorios':
        return [
          {
            id: 'mapa_territorios',
            title: 'Territorios S-13',
            subtitle: 'Control de tarjetas',
            badge: 'Principal',
            icon: MapPin,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('territorios'),
          },
          {
            id: 'grupos_salida',
            title: 'Grupos de Servicio',
            subtitle: 'Salidas de predicación',
            badge: 'Campo',
            icon: Users,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('grupos_servicio'),
          },
          {
            id: 'carritos_turnos',
            title: 'Predicación Pública',
            subtitle: 'Puntos de exhibidores',
            badge: 'Carritos',
            icon: ShoppingBag,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('carritos'),
          },
          {
            id: 'mi_ministerio_terr',
            title: 'Mi Ministerio',
            subtitle: 'Cronómetro y revisitas',
            badge: 'Personal',
            icon: Compass,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('inicio'),
          },
        ];

      case 'siervo_cuentas':
        return [
          {
            id: 'contabilidad_mensual',
            title: 'Cuentas S-26',
            subtitle: 'Ingresos y gastos',
            badge: 'Contable',
            icon: CreditCard,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('tablero_anuncios'),
          },
          {
            id: 'tablero_anuncios_cta',
            title: 'Tablero Anuncios',
            subtitle: 'Informes financieros',
            badge: 'Cartelera',
            icon: FileText,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('tablero_anuncios'),
          },
          {
            id: 'programa_cta',
            title: 'Programa Reunión',
            subtitle: 'Consultar semana',
            badge: 'Semana',
            icon: Calendar,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('programacion'),
          },
          {
            id: 'mi_ministerio_cta',
            title: 'Mi Ministerio',
            subtitle: 'Registro personal',
            badge: 'S-4',
            icon: Compass,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('inicio'),
          },
        ];

      case 'siervo_literatura':
        return [
          {
            id: 'inventario_lit',
            title: 'Literatura S-28',
            subtitle: 'Inventario y pedidos',
            badge: 'Stock',
            icon: Package,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('literatura'),
          },
          {
            id: 'carritos_lit',
            title: 'Exhibidores',
            subtitle: 'Publicaciones en carritos',
            badge: 'Público',
            icon: ShoppingBag,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('carritos'),
          },
          {
            id: 'grupos_lit',
            title: 'Grupos de Servicio',
            subtitle: 'Distribución por grupo',
            badge: 'Grupos',
            icon: Users,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('grupos_servicio'),
          },
          {
            id: 'mi_ministerio_lit',
            title: 'Mi Ministerio',
            subtitle: 'Cronómetro y cursos',
            badge: 'Personal',
            icon: Compass,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('inicio'),
          },
        ];

      case 'encargado_mantenimiento':
      case 'encargado_audiovideo':
      case 'encargado_acomodadores':
        return [
          {
            id: 'limpieza_deberes_op',
            title: 'Aseo y Deberes',
            subtitle: 'Acomodadores y audio',
            badge: 'Turnos',
            icon: Brush,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('limpieza_deberes'),
          },
          {
            id: 'mantenimiento_salon',
            title: 'Mantenimiento',
            subtitle: 'Seguridad del Salón',
            badge: 'Salón',
            icon: Wrench,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('mantenimiento'),
          },
          {
            id: 'asistencia_conteo',
            title: 'Asistencia S-88',
            subtitle: 'Registrar concurrentes',
            badge: 'Conteo',
            icon: TrendingUp,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('asistencia'),
          },
          {
            id: 'modo_atril_av',
            title: 'Modo Atril / TV',
            subtitle: 'Cronómetro de plataforma',
            badge: 'Cabina',
            icon: Tv,
            accentClass: 'hover:border-sky-500/40 dark:hover:border-sky-400/40',
            iconBgClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
            onClick: () => (onOpenKioskModal ? onOpenKioskModal() : setActiveTab('programacion')),
          },
        ];

      case 'publico':
        return [
          {
            id: 'pub_cronometro',
            title: 'Cronómetro S-4',
            subtitle: 'Registrar predicación',
            badge: 'Ministerio',
            icon: Timer,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('inicio'),
          },
          {
            id: 'pub_revisitas',
            title: 'Mis Revisitas',
            subtitle: 'Seguimiento de personas',
            badge: 'Notas',
            icon: MapPin,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => setActiveTab('revisitas'),
          },
          {
            id: 'pub_estudios',
            title: 'Cursos Bíblicos',
            subtitle: 'Progreso de estudiantes',
            badge: 'Cursos',
            icon: BookOpen,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('estudios_biblicos'),
          },
          {
            id: 'pub_programa',
            title: 'Cartelera y Reunión',
            subtitle: 'Asignaciones de la semana',
            badge: 'Semana',
            icon: Calendar,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('programacion'),
          },
        ];

      case 'coordinador':
      case 'anciano':
      default:
        return [
          {
            id: 'coord_programa',
            title: 'Programa Semanal',
            subtitle: 'Reunión entre semana y fin',
            badge: 'S-140',
            icon: Calendar,
            accentClass: 'hover:border-indigo-500/40 dark:hover:border-indigo-400/40',
            iconBgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            onClick: () => setActiveTab('programacion'),
          },
          {
            id: 'coord_asistencia',
            title: 'Asistencia S-88',
            subtitle: 'Estadísticas de reuniones',
            badge: 'S-88',
            icon: TrendingUp,
            accentClass: 'hover:border-teal-500/40 dark:hover:border-teal-400/40',
            iconBgClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
            onClick: () => setActiveTab('asistencia'),
          },
          {
            id: 'coord_s89',
            title: 'Hojas S-89',
            subtitle: 'Asignaciones estudiantiles',
            badge: 'PDF',
            icon: Award,
            accentClass: 'hover:border-amber-500/40 dark:hover:border-amber-400/40',
            iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            onClick: () => setActiveTab('s89'),
          },
          {
            id: 'coord_pins',
            title: 'Directorio y PINs',
            subtitle: 'Accesos de publicadores',
            badge: `${publisherPinsCount} PINs`,
            icon: KeyRound,
            accentClass: 'hover:border-emerald-500/40 dark:hover:border-emerald-400/40',
            iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            onClick: () => (onOpenPinsModal ? onOpenPinsModal() : setActiveTab('publicadores')),
          },
        ];
    }
  }, [roleId, setActiveTab, onOpenTimerModal, onOpenKioskModal, onOpenPinsModal, publisherPinsCount]);

  return (
    <div className="kg-card-bento kg-glass-surface kg-sheen-top relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm">
      <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-2 mb-3.5 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5] tracking-tight">
                Acceso Rápido Táctil
              </h3>
              <span className="kg-glow-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                <ShieldCheck className="w-3 h-3" />
                {roleName}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
              Las 4 herramientas principales más usadas según tu rol activo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenTimerModal && (
            <button
              type="button"
              onClick={onOpenTimerModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
              title="Abrir Cronómetro de Atril"
            >
              <Timer className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Modo Atril</span>
            </button>
          )}
          {onOpenKioskModal && (
            <button
              type="button"
              onClick={onOpenKioskModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
              title="Abrir Modo Pantalla del Salón"
            >
              <Tv className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Pantalla Salón</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={tool.onClick}
              className={`group relative flex flex-col justify-between text-left p-3.5 sm:p-4 min-h-[96px] rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] border border-zinc-200/80 dark:border-white/10 ${tool.accentClass} shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.97] touch-manipulation`}
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${tool.iconBgClass}`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {tool.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60 dark:border-white/10 font-mono">
                    {tool.badge}
                  </span>
                )}
              </div>

              <div className="mt-3 w-full">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {tool.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate mt-0.5">
                  {tool.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface ResumenInicioTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTimerModal?: () => void;
  onOpenKioskModal?: () => void;
  onOpenConflictsModal?: () => void;
  onOpenPinsModal?: () => void;
}

export const ResumenInicioTab: React.FC<ResumenInicioTabProps> = ({
  setActiveTab,
  onOpenTimerModal,
  onOpenKioskModal,
  onOpenConflictsModal,
  onOpenPinsModal,
}) => {
  const [internalPinsModalOpen, setInternalPinsModalOpen] = useState(false);
  const handleOpenPins = () => {
    if (onOpenPinsModal) {
      onOpenPinsModal();
    } else {
      setInternalPinsModalOpen(true);
    }
  };

  const {
    weeks,
    currentWeek,
    publishers,
    territories,
    monthlyReports,
  } = useCongregation();

  const { publisherPinsList, effectiveRoleInfo } = useAuth();
  const publisherPinsCount = useMemo(() => {
    return publishers.filter(
      (p) =>
        Boolean(p.personalPin) ||
        publisherPinsList.some(
          (rec) =>
            (rec.publisherId === p.id || rec.name.toLowerCase().trim() === p.name.toLowerCase().trim()) &&
            Boolean(rec.pin)
        )
    ).length;
  }, [publishers, publisherPinsList]);

  // Active week
  const activeWeek = currentWeek || weeks[0];

  // Publisher Statistics
  const publisherStats = useMemo(() => {
    let elders = 0;
    let servants = 0;
    let regularPioneers = 0;
    let auxPioneers = 0;
    let activePublishers = 0;

    publishers.forEach((p) => {
      if (p.privilege === 'anciano') elders++;
      if (p.privilege === 'siervo_ministerial') servants++;
      if (p.privilege === 'precursor_regular') regularPioneers++;
      if (p.privilege === 'precursor_auxiliar') auxPioneers++;
      if (p.active) activePublishers++;
    });

    const total = publishers.length > 0 ? publishers.length : 1;
    const active = activePublishers > 0 ? activePublishers : 1;
    const activityPct = total > 0 ? Math.round((active / total) * 100) : 100;

    return {
      total,
      active,
      activityPct,
      elders,
      servants,
      regularPioneers,
      auxPioneers,
    };
  }, [publishers]);

  // Attendance metrics from active or most recent week
  const attendanceStats = useMemo(() => {
    let recentMidweek = 0;
    let recentWeekend = 0;

    if (activeWeek?.attendance) {
      recentMidweek = activeWeek.attendance.midweek?.total || 0;
      recentWeekend = activeWeek.attendance.weekend?.total || 0;
    }

    return {
      midweek: recentMidweek,
      weekend: recentWeekend,
    };
  }, [activeWeek]);

  // Territories status
  const territoriesStats = useMemo(() => {
    const total = territories.length;
    const assigned = territories.filter((t) => t.status === 'asignado').length;
    const overdue = territories.filter(
      (t) =>
        t.status === 'vencido' ||
        (t.status === 'asignado' && t.dueDate && new Date(t.dueDate) < new Date())
    ).length;
    return { total, assigned, overdue };
  }, [territories]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in select-none">
      {/* =========================================================================
          1. HEADER TITLE (EXACT REFERENCE: Panorama General)
         ========================================================================= */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <p className="text-xs text-zinc-400 font-medium truncate">
          Sincronización activa • Datos en tiempo real
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('inicio')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Ir al Menú Principal del Publicador (Cronómetro, Revisitas y Estudios)"
          >
            <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Mi Ministerio</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPins}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/25 text-xs font-bold shadow-xs transition-all cursor-pointer group active:scale-95 shrink-0"
            title="Ver directorio de PINs de los publicadores y la congregación"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>PINs</span>
            <span className="bg-amber-500/20 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded-full">
              {publisherPinsCount}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1B. QUICK ACCESS GRID (4 MAIN TOOLS BY USER ROLE)
         ========================================================================= */}
      <QuickAccessGrid
        roleId={effectiveRoleInfo.id}
        roleName={effectiveRoleInfo.name}
        setActiveTab={setActiveTab}
        onOpenTimerModal={onOpenTimerModal}
        onOpenKioskModal={onOpenKioskModal}
        onOpenPinsModal={handleOpenPins}
        publisherPinsCount={publisherPinsCount}
      />

      {/* =========================================================================
          2. TOP 5 KPI SUMMARY CARDS (EXACT REFERENCE DESIGN)
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Card 1: TOTAL */}
        <div
          onClick={() => setActiveTab('publicadores')}
          className="kg-card-bento kg-glass-surface kg-sheen-top relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-sm hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-indigo-500/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider uppercase">
              TOTAL
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="relative text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-1.5">
            {publisherStats.total}
          </div>
          <div className="relative text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-mono tabular-nums">
            <span>{publisherStats.activityPct}% Actividad</span>
          </div>
        </div>

        {/* Card 2: ANCIANOS */}
        <div
          onClick={() => setActiveTab('publicadores')}
          className="kg-card-bento kg-glass-surface kg-sheen-top relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-violet-500/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider uppercase">
              ANCIANOS
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="relative text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-1.5">
            {publisherStats.elders}
          </div>
          <div className="relative text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] mt-2">
            Cuerpo
          </div>
        </div>

        {/* Card 3: PRECURSORES */}
        <div
          onClick={() => setActiveTab('publicadores')}
          className="kg-card-bento kg-glass-surface kg-sheen-top relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-400/40 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider uppercase">
              PRECURSORES
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="relative text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-1.5">
            {publisherStats.regularPioneers}
          </div>
          <div className="relative text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
            Regulares
          </div>
        </div>

        {/* Card 4: ASISTENCIA */}
        <div
          onClick={() => setActiveTab('asistencia')}
          className="kg-card-bento kg-glass-surface kg-sheen-top relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm hover:border-teal-500/40 dark:hover:border-teal-400/40 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-teal-500/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider uppercase">
              ASISTENCIA
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="relative text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-1.5">
            {attendanceStats.midweek}
          </div>
          <div className="relative text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] mt-2">
            Media
          </div>
        </div>

        {/* Card 5: INFORMES */}
        <div
          onClick={() => setActiveTab('informes_servicio')}
          className="col-span-2 sm:col-span-1 kg-card-bento kg-glass-surface kg-sheen-top relative overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider uppercase">
              INFORMES
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="relative text-2xl sm:text-3xl font-mono font-extrabold tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-1.5">
            {monthlyReports.length}
          </div>
          <div className="relative text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] mt-2">
            S-4 del Mes
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MIDDLE CHARTS SECTION (Responsive, Beautiful, Non-stretched)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Chart: Actividad de Servicio del Campo (Horas y Estudios) */}
        <div className="lg:col-span-8">
          <ResponsiveServiceChart
            publishers={publishers}
            monthlyReports={monthlyReports}
          />
        </div>

        {/* Right Chart: Asistencia a Reuniones */}
        <div className="lg:col-span-4">
          <ResponsiveAttendanceChart
            weeks={weeks}
          />
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM ROW (Resumen de Publicadores & Cobertura de Territorios)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Card 1: Resumen de Publicadores */}
        <div className="lg:col-span-8 kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5] tracking-tight">
                  Resumen de Publicadores
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                  Distribución teocrática de responsabilidades
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('publicadores')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Directorio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                Ancianos
              </span>
              <span className="text-lg font-mono font-black tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-0.5 block">
                {publisherStats.elders}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Cuerpo activo</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                Siervos
              </span>
              <span className="text-lg font-mono font-black tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-0.5 block">
                {publisherStats.servants}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Ministeriales</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                Precursores
              </span>
              <span className="text-lg font-mono font-black tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-0.5 block">
                {publisherStats.regularPioneers}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Regulares</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                Total
              </span>
              <span className="text-lg font-mono font-black tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-0.5 block">
                {publisherStats.total}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono tabular-nums">
                {publisherStats.activityPct}% actividad
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Estado de Territorios y Accesos Complementarios */}
        <div className="lg:col-span-4 kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5] tracking-tight">
                    Territorios S-13
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                    Estado de predicación
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('territorios')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 text-center">
                <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-[#A1A1AA] block">
                  Total
                </span>
                <span className="text-base font-mono font-black text-zinc-900 dark:text-[#F4F4F5]">
                  {territoriesStats.total}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 text-center">
                <span className="text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400 block">
                  Asignados
                </span>
                <span className="text-base font-mono font-black text-teal-600 dark:text-teal-400">
                  {territoriesStats.assigned}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                  Vencidos
                </span>
                <span className="text-base font-mono font-black text-amber-600 dark:text-amber-400">
                  {territoriesStats.overdue}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenPins}
            className="mt-3 w-full flex items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 hover:bg-amber-500/15 dark:hover:bg-amber-900/40 border border-amber-500/25 text-xs font-bold text-amber-800 dark:text-amber-300 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <span className="flex items-center gap-2 truncate">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Directorio de PINs de Publicadores</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-mono tabular-nums">
              {publisherPinsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Publisher PINs Modal */}
      <PublisherPinsModal
        isOpen={internalPinsModalOpen}
        onClose={() => setInternalPinsModalOpen(false)}
      />
    </div>
  );
};

