// src/components/EquidadDashboardTab.tsx
import React, { useMemo, useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  KHS_ROLE_WEIGHT_DEFINITIONS,
  KHS_CATEGORY_META,
  KhsWeightCategory,
  KhsTimeRangeFilter,
  KhsLoadStatus,
  PublisherWorkloadReport,
  loadKhsWeights,
  saveKhsWeights,
  getDefaultKhsWeights,
  computeKhsCongregationAudit,
  buildKhsEquityWhatsAppSummary,
  printKhsEquityAuditReport,
} from '../utils/khsWorkloadWeighting';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  Scale,
  AlertTriangle,
  Sliders,
  Printer,
  Share2,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowRightLeft,
  Flame,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  PieChart as PieChartIcon,
  TrendingUp,
  Eye,
} from 'lucide-react';

const TIME_RANGE_OPTIONS: { value: KhsTimeRangeFilter; label: string }[] = [
  { value: 'all', label: 'Todo el Historial y Programa' },
  { value: 'last_30_days', label: 'Últimos 30 días (+ semana actual)' },
  { value: 'last_60_days', label: 'Últimos 60 días' },
  { value: 'last_90_days', label: 'Últimos 90 días (Trimestre)' },
  { value: 'current_month', label: 'Mes Actual' },
  { value: 'upcoming_30_days', label: 'Próximos 30 días' },
];

type ChartMode =
  | 'stacked_categories'
  | 'cohort_deviation'
  | 'cohort_distribution'
  | 'service_groups';
type ChartSliceMode = 'extremes' | 'top15' | 'bottom15' | 'all25';

const STATUS_COLORS: Record<KhsLoadStatus, string> = {
  sobrecargado: '#e11d48',
  optimo: '#10b981',
  subutilizado: '#f59e0b',
  en_descanso: '#94a3b8',
};

const STATUS_LABELS: Record<KhsLoadStatus, string> = {
  sobrecargado: 'Sobrecargado (>140%)',
  optimo: 'Carga Óptima (60%–140%)',
  subutilizado: 'Subutilizado (<60%)',
  en_descanso: 'En Descanso',
};

const CATEGORY_HEX_COLORS: Record<KhsWeightCategory, string> = {
  ensenanza: '#4f46e5',
  estudiantil_lectura: '#f59e0b',
  deberes_logistica: '#10b981',
  ministerio_campo: '#0ea5e9',
  oraciones: '#a855f7',
};

function shortenPublisherName(fullName: string): string {
  const clean = fullName.trim();
  if (clean.length <= 14) return clean;
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return clean.slice(0, 13) + '…';
  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

export const EquidadDashboardTab: React.FC = () => {
  const {
    publishers,
    weeks,
    preachingGroups,
    fieldServiceMeetings,
    cartShifts,
    outgoingSpeakers,
    circuitVisit,
    settings,
  } = useCongregation();

  const [timeRange, setTimeRange] = useState<KhsTimeRangeFilter>('all');
  const [weights, setWeights] = useState<Record<string, number>>(() => loadKhsWeights());
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Filters (selectedGroups: empty array = Todos los Grupos; 1 or more numbers = specific service groups)
  const [searchTerm, setSearchTerm] = useState('');
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'weighted' | 'raw' | 'rest' | 'streak'>('weighted');
  const [expandedPublisherId, setExpandedPublisherId] = useState<string | null>(null);

  // Recharts Visualization controls
  const [chartMode, setChartMode] = useState<ChartMode>('stacked_categories');
  const [chartSliceMode, setChartSliceMode] = useState<ChartSliceMode>('extremes');
  const [selectedChartPubId, setSelectedChartPubId] = useState<string | null>(null);

  // Value for single-select dropdowns ('all', '1', '2', ..., or 'multi' when 2+ groups are active)
  const groupSelectValue = useMemo(() => {
    if (selectedGroups.length === 0) return 'all';
    if (selectedGroups.length === 1) return String(selectedGroups[0]);
    return 'multi';
  }, [selectedGroups]);

  const handleGroupDropdownChange = (val: string) => {
    if (val === 'all') {
      setSelectedGroups([]);
    } else if (val !== 'multi') {
      const num = Number(val);
      if (!Number.isNaN(num)) {
        setSelectedGroups([num]);
      }
    }
  };

  const handleToggleServiceGroup = (groupNumber: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupNumber)
        ? prev.filter((g) => g !== groupNumber)
        : [...prev, groupNumber].sort((a, b) => a - b)
    );
  };

  const selectedGroupsLabel = useMemo(() => {
    if (selectedGroups.length === 0) return 'Todos los Grupos de Servicio';
    if (selectedGroups.length === 1) {
      const found = preachingGroups.find((g) => g.number === selectedGroups[0]);
      return found?.name || `Grupo #${selectedGroups[0]}`;
    }
    return `Grupos ${selectedGroups.map((n) => `#${n}`).join(', ')}`;
  }, [selectedGroups, preachingGroups]);

  const timeRangeLabel = useMemo(() => {
    return TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label || 'Todo el Programa';
  }, [timeRange]);

  // Run Cross-Module Workload Audit
  const audit = useMemo(() => {
    return computeKhsCongregationAudit({
      publishers,
      weeks,
      fieldServiceMeetings,
      cartShifts,
      outgoingSpeakers,
      circuitVisit,
      preachingGroups,
      weights,
      timeRange,
    });
  }, [
    publishers,
    weeks,
    fieldServiceMeetings,
    cartShifts,
    outgoingSpeakers,
    circuitVisit,
    preachingGroups,
    weights,
    timeRange,
  ]);

  // Overall Confirmation status ratio
  const statusCounts = useMemo(() => {
    let confirmadas = 0;
    let pendientes = 0;
    let rechazadas = 0;

    weeks.forEach((w) => {
      w.midweek.maestros.items.forEach((m) => {
        if (m.status === 'confirmada') confirmadas++;
        else if (m.status === 'rechazada') rechazadas++;
        else pendientes++;
      });
      w.midweek.vidaCristiana.items.forEach((v) => {
        if (v.status === 'confirmada') confirmadas++;
        else if (v.status === 'rechazada') rechazadas++;
        else pendientes++;
      });
    });

    const total = confirmadas + pendientes + rechazadas || 1;
    return {
      confirmadas,
      pendientes,
      rechazadas,
      total,
      confirmRate: Math.round((confirmadas / total) * 100),
    };
  }, [weeks]);

  // Max weighted points among all publishers (for proportional stacked bars)
  const maxWeightedPoints = useMemo(() => {
    let m = 1;
    audit.reports.forEach((r) => {
      if (r.totalWeightedPoints > m) m = r.totalWeightedPoints;
    });
    return m;
  }, [audit.reports]);

  // Reports filtered by selected service groups
  const groupFilteredReports = useMemo(() => {
    if (selectedGroups.length === 0) return audit.reports;
    return audit.reports.filter((r) =>
      selectedGroups.includes(r.publisher.groupNumber || 1)
    );
  }, [audit.reports, selectedGroups]);

  // Filtered and sorted publisher reports
  const filteredReports = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = groupFilteredReports.filter((r) => {
      if (q && !r.displayName.toLowerCase().includes(q)) return false;
      if (cohortFilter !== 'all' && r.cohort !== cohortFilter) return false;
      if (statusFilter === 'fatigue') return r.hasFatigueAlert;
      if (statusFilter === 'unused_roles') return r.unusedRoleLabels.length > 0;
      if (statusFilter !== 'all' && r.loadStatus !== statusFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'raw') return b.totalRawAssignments - a.totalRawAssignments;
      if (sortBy === 'rest') return b.daysSinceLastAssignment - a.daysSinceLastAssignment;
      if (sortBy === 'streak') return b.maxConsecutiveWeeks - a.maxConsecutiveWeeks;
      return b.totalWeightedPoints - a.totalWeightedPoints;
    });

    return list;
  }, [groupFilteredReports, searchTerm, cohortFilter, statusFilter, sortBy]);

  // Slice of publisher reports for Recharts comparison chart
  const chartPublisherData = useMemo(() => {
    const sortedByLoad = [...filteredReports].sort(
      (a, b) => b.totalWeightedPoints - a.totalWeightedPoints
    );

    let selectedSlice: PublisherWorkloadReport[] = [];
    if (chartSliceMode === 'top15') {
      selectedSlice = sortedByLoad.slice(0, 15);
    } else if (chartSliceMode === 'bottom15') {
      selectedSlice = [...sortedByLoad].reverse().slice(0, 15);
    } else if (chartSliceMode === 'extremes') {
      if (sortedByLoad.length <= 16) {
        selectedSlice = sortedByLoad;
      } else {
        const top8 = sortedByLoad.slice(0, 8);
        const bottom8 = sortedByLoad.slice(-8);
        const seen = new Set(top8.map((r) => r.publisher.id));
        selectedSlice = [...top8, ...bottom8.filter((r) => !seen.has(r.publisher.id))];
      }
    } else {
      selectedSlice = sortedByLoad.slice(0, 25);
    }

    const showGroupSuffix = selectedGroups.length !== 1;

    return selectedSlice.map((r) => {
      const grpNum = r.publisher.groupNumber || 1;
      const baseShort = shortenPublisherName(r.displayName);
      return {
        publisherId: r.publisher.id,
        shortName: showGroupSuffix ? `${baseShort} (G${grpNum})` : baseShort,
        fullName: r.displayName,
        cohortLabel: r.cohortLabel,
        groupNumber: grpNum,
        totalPoints: r.totalWeightedPoints,
        rawAssignments: r.totalRawAssignments,
        cohortAvg: r.cohortAveragePoints,
        relativeLoadPercent: r.relativeLoadPercent,
        loadStatus: r.loadStatus,
        statusColor: STATUS_COLORS[r.loadStatus],
        daysRest: r.daysSinceLastAssignment >= 900 ? null : r.daysSinceLastAssignment,
        maxStreak: r.maxConsecutiveWeeks,
        hasFatigue: r.hasFatigueAlert,
        ensenanza: r.pointsByCategory.ensenanza,
        estudiantil_lectura: r.pointsByCategory.estudiantil_lectura,
        deberes_logistica: r.pointsByCategory.deberes_logistica,
        ministerio_campo: r.pointsByCategory.ministerio_campo,
        oraciones: r.pointsByCategory.oraciones,
        report: r,
      };
    });
  }, [filteredReports, chartSliceMode, selectedGroups]);

  // Average points for the currently filtered set (for ReferenceLine in chart)
  const filteredAveragePoints = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, r) => acc + r.totalWeightedPoints, 0);
    return Math.round((sum / filteredReports.length) * 10) / 10;
  }, [filteredReports]);

  // Cohort comparison data (respects selected service groups)
  const cohortChartData = useMemo(() => {
    const cohorts: {
      key: PublisherWorkloadReport['cohort'];
      label: string;
    }[] = [
      { key: 'anciano', label: 'Ancianos' },
      { key: 'siervo_ministerial', label: 'Siervos Min.' },
      { key: 'hermano_bautizado', label: 'Hermanos' },
      { key: 'hermana_estudiante', label: 'Hermanas' },
    ];

    return cohorts.map((c) => {
      const members = groupFilteredReports.filter((r) => r.cohort === c.key);
      if (members.length === 0) {
        return {
          cohort: c.label,
          miembros: 0,
          promedio: 0,
          maximo: 0,
          minimo: 0,
          sobrecargados: 0,
          subutilizados: 0,
        };
      }
      const pts = members.map((m) => m.totalWeightedPoints);
      const sum = pts.reduce((a, b) => a + b, 0);
      return {
        cohort: c.label,
        miembros: members.length,
        promedio: Math.round((sum / members.length) * 10) / 10,
        maximo: Math.round(Math.max(...pts) * 10) / 10,
        minimo: Math.round(Math.min(...pts) * 10) / 10,
        sobrecargados: members.filter((m) => m.loadStatus === 'sobrecargado').length,
        subutilizados: members.filter(
          (m) => m.loadStatus === 'subutilizado' || m.loadStatus === 'en_descanso'
        ).length,
      };
    });
  }, [groupFilteredReports]);

  // Load status donut distribution data
  const statusPieData = useMemo(() => {
    const counts: Record<KhsLoadStatus, number> = {
      sobrecargado: 0,
      optimo: 0,
      subutilizado: 0,
      en_descanso: 0,
    };
    filteredReports.forEach((r) => {
      counts[r.loadStatus] = (counts[r.loadStatus] || 0) + 1;
    });
    return (Object.keys(counts) as KhsLoadStatus[])
      .map((st) => ({
        status: st,
        name: STATUS_LABELS[st],
        value: counts[st],
        color: STATUS_COLORS[st],
      }))
      .filter((item) => item.value > 0);
  }, [filteredReports]);

  // Selected publisher from chart click
  const selectedChartReport = useMemo(() => {
    if (!selectedChartPubId) return null;
    return audit.reports.find((r) => r.publisher.id === selectedChartPubId) || null;
  }, [selectedChartPubId, audit.reports]);

  // Preaching group weighted stats (with category breakdown for Recharts comparison)
  const groupStats = useMemo(() => {
    return preachingGroups.map((g) => {
      const groupReports = audit.reports.filter(
        (r) => (r.publisher.groupNumber || 1) === g.number
      );
      const totalPoints =
        Math.round(
          groupReports.reduce((acc, r) => acc + r.totalWeightedPoints, 0) * 10
        ) / 10;
      const totalPart = groupReports.reduce((acc, r) => acc + r.totalRawAssignments, 0);
      const avgPoints =
        groupReports.length > 0
          ? Math.round((totalPoints / groupReports.length) * 10) / 10
          : 0;
      const maxPoints =
        groupReports.length > 0
          ? Math.round(
              Math.max(...groupReports.map((r) => r.totalWeightedPoints)) * 10
            ) / 10
          : 0;
      const sobrecargados = groupReports.filter(
        (r) => r.loadStatus === 'sobrecargado'
      ).length;
      const subutilizados = groupReports.filter(
        (r) => r.loadStatus === 'subutilizado' || r.loadStatus === 'en_descanso'
      ).length;

      return {
        group: g,
        groupNumber: g.number,
        shortLabel: `G#${g.number}`,
        groupName: g.name || `Grupo #${g.number}`,
        memberCount: groupReports.length,
        totalPart,
        totalPoints,
        avgPoints,
        maxPoints,
        sobrecargados,
        subutilizados,
        ensenanza:
          Math.round(
            groupReports.reduce((a, r) => a + r.pointsByCategory.ensenanza, 0) * 10
          ) / 10,
        estudiantil_lectura:
          Math.round(
            groupReports.reduce(
              (a, r) => a + r.pointsByCategory.estudiantil_lectura,
              0
            ) * 10
          ) / 10,
        deberes_logistica:
          Math.round(
            groupReports.reduce((a, r) => a + r.pointsByCategory.deberes_logistica, 0) *
              10
          ) / 10,
        ministerio_campo:
          Math.round(
            groupReports.reduce((a, r) => a + r.pointsByCategory.ministerio_campo, 0) *
              10
          ) / 10,
        oraciones:
          Math.round(
            groupReports.reduce((a, r) => a + r.pointsByCategory.oraciones, 0) * 10
          ) / 10,
      };
    });
  }, [preachingGroups, audit.reports]);

  // Filtered group stats for the "Por Grupos" chart mode
  const chartGroupData = useMemo(() => {
    if (selectedGroups.length === 0) return groupStats;
    return groupStats.filter((item) => selectedGroups.includes(item.groupNumber));
  }, [groupStats, selectedGroups]);

  const handleUpdateWeight = (roleKey: string, val: number) => {
    const sanitized = Math.max(0.5, Math.min(10, Math.round(val * 2) / 2));
    const next = { ...weights, [roleKey]: sanitized };
    setWeights(next);
    saveKhsWeights(next);
  };

  const handleResetWeights = () => {
    const defaults = getDefaultKhsWeights();
    setWeights(defaults);
    saveKhsWeights(defaults);
  };

  const handleShareWhatsApp = () => {
    const text = buildKhsEquityWhatsAppSummary(
      audit,
      settings.congregationName || 'Congregación',
      timeRangeLabel
    );
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const renderStatusBadge = (status: KhsLoadStatus, hasFatigue: boolean) => {
    if (status === 'sobrecargado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          Sobrecargado
        </span>
      );
    }
    if (status === 'subutilizado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Subutilizado
        </span>
      );
    }
    if (status === 'en_descanso') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <Clock className="w-3 h-3" />
          En Descanso
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        Carga Óptima
        {hasFatigue ? ' • Racha Alta' : ''}
      </span>
    );
  };

  const handleBarClick = (data: any) => {
    const pubId = data?.publisherId || data?.payload?.publisherId;
    if (!pubId) return;
    setSelectedChartPubId((prev) => (prev === pubId ? null : pubId));
    setExpandedPublisherId(pubId);
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Control y Acciones */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-indigo-600 text-white">
              Ponderación de Carga
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Tablero de Equidad y Peso de Carga por Publicador
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Pondera el esfuerzo real de cada parte (Discursos 4–5 pts, Lecturas 2.5–3 pts, Salidas al Campo 2.5 pts, Audio/Acomodadores 2 pts, Oraciones 1 pt) en toda la congregación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Período */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as KhsTimeRangeFilter)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Configurar Pesos */}
          <button
            type="button"
            onClick={() => setShowWeightsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Configurar Pesos</span>
          </button>

          {/* Copiar Resumen WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors"
          >
            {copiedWhatsApp ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resumen Copiado</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resumen Ancianos</span>
              </>
            )}
          </button>

          {/* Imprimir Auditoría */}
          <button
            type="button"
            onClick={() => printKhsEquityAuditReport(audit, settings, timeRangeLabel)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Auditoría</span>
          </button>
        </div>
      </div>

      {/* KPIs Ejecutivos de Equidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Índice de Equidad */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Índice de Equidad
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600">
                {audit.equityIndexScore}%
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                {statusCounts.confirmRate}% confirm.
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {audit.optimalCount} de {audit.totalActivePublishers} en rango óptimo
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Peso de Carga Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Peso de Carga Total
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {audit.totalWeightedPoints}
              </span>
              <span className="text-xs font-bold text-slate-500">pts</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {audit.totalAssignmentsCount} asignaciones • Promedio:{' '}
              <strong>{audit.averagePointsPerPublisher} pts</strong>
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Sobrecarga y Fatiga */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter(statusFilter === 'sobrecargado' ? 'all' : 'sobrecargado')
          }
          className={`text-left p-5 rounded-3xl border transition-all flex items-start justify-between ${
            statusFilter === 'sobrecargado'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Sobrecarga y Fatiga
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600">
                {audit.overloadedCount}
              </span>
              <span className="text-xs font-bold text-rose-700">
                ({audit.fatigueAlertCount} con racha 3+ sem.)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Clic para filtrar hermanos con carga &gt;140%
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
        </button>

        {/* KPI 4: Subutilizados y En Descanso */}
        <button
          type="button"
          onClick={() =>
            setStatusFilter(statusFilter === 'unused_roles' ? 'all' : 'unused_roles')
          }
          className={`text-left p-5 rounded-3xl border transition-all flex items-start justify-between ${
            statusFilter === 'unused_roles'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Capacidad Subutilizada
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">
                {audit.underutilizedCount + audit.restingCount}
              </span>
              <span className="text-xs font-bold text-amber-700">
                ({audit.unusedQualifiedPublishersCount} con rol sin uso)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Clic para ver hermanos habilitados sin usar
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Desglose Global por Categorías de Esfuerzo */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Distribución Congregacional por Área de Responsabilidad (Puntos)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Incluye VMC, Fin de Semana, Audio/Acomodadores, Limpieza, Carritos y Salidas al Campo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(KHS_CATEGORY_META) as KhsWeightCategory[]).map((cat) => {
            const meta = KHS_CATEGORY_META[cat];
            const stat = audit.categoryTotals[cat];
            const pct =
              audit.totalWeightedPoints > 0
                ? Math.round((stat.points / audit.totalWeightedPoints) * 100)
                : 0;
            return (
              <div
                key={cat}
                className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badgeClass}`}
                  >
                    {meta.shortLabel}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">{pct}%</span>
                </div>
                <div className="text-base font-black text-slate-900">
                  {stat.points} <span className="text-xs font-semibold text-slate-500">pts</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {stat.count} asignaciones registradas
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sugerencias Inteligentes de Rebalanceo */}
      {audit.rebalanceSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/90 via-white to-amber-50/60 p-5 rounded-3xl border border-indigo-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              <span>Sugerencias de Rebalanceo Teocrático (Asistente de Alivio)</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              {audit.rebalanceSuggestions.length} recomendaciones
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Estos pares de hermanos comparten el mismo privilegio habilitado en su ficha, pero presentan una brecha importante de Peso de Carga:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {audit.rebalanceSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Rol: {sug.roleLabel}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Relevo sugerido
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex-1 p-2 rounded-xl bg-rose-50/70 border border-rose-200/70">
                    <div className="text-[10px] font-bold text-rose-700 uppercase">
                      Dar alivio a:
                    </div>
                    <div className="font-bold text-slate-900 truncate">
                      {sug.overloadedPublisher.displayName}
                    </div>
                    <div className="text-[11px] text-rose-700 font-semibold">
                      {sug.overloadedPublisher.totalWeightedPoints} pts ({sug.overloadedPublisher.totalRawAssignments} asig.)
                    </div>
                  </div>

                  <ArrowRightLeft className="w-4 h-4 text-slate-400 shrink-0" />

                  <div className="flex-1 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">
                      Priorizar a:
                    </div>
                    <div className="font-bold text-slate-900 truncate">
                      {sug.underutilizedPublisher.displayName}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      {sug.underutilizedPublisher.totalWeightedPoints} pts ({sug.underutilizedPublisher.totalRawAssignments} asig.)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visualización Comparativa con Recharts: Análisis Gráfico de Carga y Desequilibrios */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Comparativa Gráfica de Carga y Detección de Desequilibrios
              </h3>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-500">
                Promedio filtrado: <strong className="text-indigo-700 font-mono">{filteredAveragePoints} pts</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {selectedGroupsLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Filtra y compara el esfuerzo acumulado por grupos de servicio específicos, publicadores y privilegios. Haz clic en cualquier barra para inspeccionar al publicador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector Rápido de Grupo de Servicio en la Comparativa */}
            <select
              value={groupSelectValue}
              onChange={(e) => handleGroupDropdownChange(e.target.value)}
              aria-label="Filtrar comparativa por grupo de servicio"
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs font-bold text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los Grupos ({preachingGroups.length})</option>
              {selectedGroups.length > 1 && (
                <option value="multi">
                  Comparando {selectedGroups.length} grupos ({selectedGroups.map((n) => `#${n}`).join(', ')})
                </option>
              )}
              {preachingGroups.map((g) => (
                <option key={g.number} value={String(g.number)}>
                  {g.name || `Grupo #${g.number}`} (G#{g.number})
                </option>
              ))}
            </select>

            {/* Selector segmentado de modo de gráfico */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setChartMode('stacked_categories')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  chartMode === 'stacked_categories'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Áreas (Apilado)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cohort_deviation')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  chartMode === 'cohort_deviation'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Brecha vs. Privilegio
              </button>
              <button
                type="button"
                onClick={() => setChartMode('cohort_distribution')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 ${
                  chartMode === 'cohort_distribution'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Cuerpos y Estados</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('service_groups')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 ${
                  chartMode === 'service_groups'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Por Grupos</span>
              </button>
            </div>

            {/* Selector de muestra cuando se comparan publicadores */}
            {(chartMode === 'stacked_categories' || chartMode === 'cohort_deviation') && (
              <select
                value={chartSliceMode}
                onChange={(e) => setChartSliceMode(e.target.value as ChartSliceMode)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="extremes">Contraste: 8 Más vs. 8 Menos Cargados</option>
                <option value="top15">Top 15 Mayor Carga</option>
                <option value="bottom15">Top 15 Menor Carga</option>
                <option value="all25">Vista General (hasta 25)</option>
              </select>
            )}
          </div>
        </div>

        {/* Barra Multi-Selector de Grupos de Servicio Específicos */}
        {preachingGroups.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1.5 mr-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Grupos de Servicio:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedGroups([])}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                  selectedGroups.length === 0
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos ({audit.reports.length})
              </button>

              {groupStats.map((gStat) => {
                const isSelected = selectedGroups.includes(gStat.groupNumber);
                return (
                  <button
                    key={gStat.groupNumber}
                    type="button"
                    onClick={() => handleToggleServiceGroup(gStat.groupNumber)}
                    title={`${gStat.groupName}: ${gStat.memberCount} publicadores · Promedio ${gStat.avgPoints} pts (${gStat.totalPoints} pts totales)`}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border inline-flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <span>{gStat.group.name || `Grupo #${gStat.groupNumber}`}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        isSelected
                          ? 'bg-indigo-500/80 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {gStat.avgPoints} pts prom.
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedGroups.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-[11px] font-semibold text-indigo-700">
                  {filteredReports.length} pub. en selección
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGroups([])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-600"
                >
                  <X className="w-3 h-3" />
                  <span>Limpiar filtro</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Gráfico 1: Comparativa Apilada por Áreas de Esfuerzo */}
        {chartMode === 'stacked_categories' && (
          <div className="space-y-3">
            {chartPublisherData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No hay publicadores que coincidan con los filtros actuales para graficar.
              </div>
            ) : (
              <>
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartPublisherData}
                      margin={{ top: 12, right: 20, left: 0, bottom: 48 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                        angle={-32}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: '#475569' }}
                        label={{
                          value: 'Puntos de Carga',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        label={{
                          value: 'N° Asignaciones',
                          angle: 90,
                          position: 'insideRight',
                          style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const row = payload[0]?.payload;
                          if (!row) return null;
                          return (
                            <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[230px]">
                              <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-1.5">
                                <span className="font-bold text-sm text-white">
                                  {row.fullName}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                  style={{
                                    backgroundColor: `${row.statusColor}25`,
                                    color: row.statusColor,
                                    border: `1px solid ${row.statusColor}60`,
                                  }}
                                >
                                  {row.relativeLoadPercent}% de su cohorte
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                                <span>
                                  {row.cohortLabel} · Grupo #{row.groupNumber}
                                </span>
                                <span className="font-mono font-bold text-indigo-300">
                                  {row.totalPoints} pts ({row.rawAssignments} asig.)
                                </span>
                              </div>
                              <div className="space-y-1 pt-1 border-t border-slate-800">
                                {(Object.keys(KHS_CATEGORY_META) as KhsWeightCategory[]).map(
                                  (cat) => {
                                    const val = row[cat] || 0;
                                    if (val <= 0) return null;
                                    return (
                                      <div
                                        key={cat}
                                        className="flex items-center justify-between text-[11px]"
                                      >
                                        <span className="flex items-center gap-1.5 text-slate-300">
                                          <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: CATEGORY_HEX_COLORS[cat] }}
                                          />
                                          {KHS_CATEGORY_META[cat].shortLabel}
                                        </span>
                                        <span className="font-mono font-bold text-white">
                                          {val} pts
                                        </span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
                                <span>Prom. {row.cohortLabel}: {row.cohortAvg} pts</span>
                                <span>
                                  {row.daysRest === null
                                    ? 'Sin asignar'
                                    : `Descanso: ${row.daysRest}d`}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                      />
                      {filteredAveragePoints > 0 && (
                        <ReferenceLine
                          yAxisId="left"
                          y={filteredAveragePoints}
                          stroke="#6366f1"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: `Promedio (${filteredAveragePoints} pts)`,
                            position: 'insideTopRight',
                            fill: '#4f46e5',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      {filteredAveragePoints > 0 && (
                        <ReferenceLine
                          yAxisId="left"
                          y={Math.round(filteredAveragePoints * 1.4 * 10) / 10}
                          stroke="#e11d48"
                          strokeDasharray="3 3"
                          strokeWidth={1}
                          label={{
                            value: 'Umbral Sobrecarga (140%)',
                            position: 'insideTopLeft',
                            fill: '#e11d48',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <Bar
                        yAxisId="left"
                        dataKey="ensenanza"
                        name="Enseñanza"
                        stackId="workload"
                        fill={CATEGORY_HEX_COLORS.ensenanza}
                        cursor="pointer"
                        onClick={handleBarClick}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="estudiantil_lectura"
                        name="Estudiantil/Lectura"
                        stackId="workload"
                        fill={CATEGORY_HEX_COLORS.estudiantil_lectura}
                        cursor="pointer"
                        onClick={handleBarClick}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="deberes_logistica"
                        name="Deberes/Audio"
                        stackId="workload"
                        fill={CATEGORY_HEX_COLORS.deberes_logistica}
                        cursor="pointer"
                        onClick={handleBarClick}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="ministerio_campo"
                        name="Campo/Carritos"
                        stackId="workload"
                        fill={CATEGORY_HEX_COLORS.ministerio_campo}
                        cursor="pointer"
                        onClick={handleBarClick}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="oraciones"
                        name="Oraciones"
                        stackId="workload"
                        fill={CATEGORY_HEX_COLORS.oraciones}
                        radius={[6, 6, 0, 0]}
                        cursor="pointer"
                        onClick={handleBarClick}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rawAssignments"
                        name="N° Asignaciones"
                        stroke="#0f172a"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#0f172a' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* Gráfico 2: Brecha de Desequilibrio vs. Promedio de su Privilegio */}
        {chartMode === 'cohort_deviation' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70">
              <span className="font-bold text-slate-800">Estado de Carga frente a su Privilegio:</span>
              {(Object.keys(STATUS_LABELS) as KhsLoadStatus[]).map((st) => (
                <span key={st} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[st] }}
                  />
                  <span>{STATUS_LABELS[st]}</span>
                </span>
              ))}
            </div>

            {chartPublisherData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No hay publicadores que coincidan con los filtros actuales para graficar.
              </div>
            ) : (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartPublisherData}
                    margin={{ top: 12, right: 20, left: 0, bottom: 48 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      angle={-32}
                      textAnchor="end"
                      interval={0}
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#475569' }}
                      label={{
                        value: 'Puntos Ponderados',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0]?.payload;
                        if (!row) return null;
                        const diff = Math.round((row.totalPoints - row.cohortAvg) * 10) / 10;
                        return (
                          <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[220px]">
                            <div className="font-bold text-sm">{row.fullName}</div>
                            <div className="text-[11px] text-slate-300">
                              {row.cohortLabel} · Grupo #{row.groupNumber}
                            </div>
                            <div className="pt-1 border-t border-slate-800 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Peso acumulado:</span>
                                <span className="font-mono font-bold text-white">
                                  {row.totalPoints} pts ({row.rawAssignments} asig.)
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Promedio {row.cohortLabel}:</span>
                                <span className="font-mono font-bold text-indigo-300">
                                  {row.cohortAvg} pts
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Brecha vs. cohorte:</span>
                                <span
                                  className={`font-mono font-bold ${
                                    diff > 0 ? 'text-rose-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : diff} pts ({row.relativeLoadPercent}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Bar
                      dataKey="totalPoints"
                      name="Carga del Publicador (pts)"
                      radius={[6, 6, 0, 0]}
                      cursor="pointer"
                      onClick={handleBarClick}
                    >
                      {chartPublisherData.map((entry) => (
                        <Cell key={entry.publisherId} fill={entry.statusColor} />
                      ))}
                    </Bar>
                    <Line
                      type="stepAfter"
                      dataKey="cohortAvg"
                      name="Promedio de su Privilegio (pts)"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#4f46e5' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Gráfico 3: Comparativa por Cuerpo/Privilegio y Distribución de Estados */}
        {chartMode === 'cohort_distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Rango de Carga por Privilegio en {selectedGroupsLabel} (Mínimo, Promedio y Máximo)
              </div>
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cohortChartData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="cohort"
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0]?.payload;
                        if (!row) return null;
                        return (
                          <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                            <div className="font-bold text-sm">
                              {row.cohort} ({row.miembros} integrantes)
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-300">Carga Máxima:</span>
                              <span className="font-mono font-bold text-rose-400">{row.maximo} pts</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-300">Promedio del Cuerpo:</span>
                              <span className="font-mono font-bold text-indigo-300">{row.promedio} pts</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-300">Carga Mínima:</span>
                              <span className="font-mono font-bold text-emerald-400">{row.minimo} pts</span>
                            </div>
                            <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                              Sobrecargados: {row.sobrecargados} · Subutilizados/Descanso: {row.subutilizados}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="maximo"
                      name="Máximo del Cuerpo (pts)"
                      fill="#e11d48"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="promedio"
                      name="Promedio (pts)"
                      fill="#4f46e5"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="minimo"
                      name="Mínimo del Cuerpo (pts)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
              <div className="text-xs font-bold text-slate-700">
                Proporción de Equilibrio ({filteredReports.length} publicadores)
              </div>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {statusPieData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} publicadores`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {statusPieData.map((item) => (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(statusFilter === item.status ? 'all' : item.status)
                    }
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-colors ${
                      statusFilter === item.status
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-semibold">
                        {item.status === 'sobrecargado'
                          ? 'Sobrecargados'
                          : item.status === 'optimo'
                          ? 'Óptimos'
                          : item.status === 'subutilizado'
                          ? 'Subutilizados'
                          : 'En Descanso'}
                      </span>
                    </span>
                    <span className="font-mono font-bold ml-1">{item.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gráfico 4: Comparativa Directa entre Grupos de Servicio */}
        {chartMode === 'service_groups' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70">
              <span>
                Comparando el volumen de puntos por área y el <strong>promedio por publicador</strong> entre{' '}
                <strong className="text-indigo-700">{selectedGroupsLabel}</strong>. Haz clic en una barra de grupo para aislar o alternar ese grupo.
              </span>
            </div>

            {chartGroupData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No hay grupos de servicio configurados para mostrar.
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartGroupData}
                    margin={{ top: 12, right: 20, left: 0, bottom: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="groupName"
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      label={{
                        value: 'Puntos Totales del Grupo',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11, fill: '#64748b', fontWeight: 600 },
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#4f46e5' }}
                      label={{
                        value: 'Prom. por Publicador (pts)',
                        angle: 90,
                        position: 'insideRight',
                        style: { fontSize: 11, fill: '#4f46e5', fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const row = payload[0]?.payload;
                        if (!row) return null;
                        return (
                          <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[230px]">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                              <span className="font-bold text-sm">{row.groupName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-mono text-[10px] font-bold">
                                {row.memberCount} integrantes
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Carga total del grupo:</span>
                              <span className="font-mono font-bold text-white">
                                {row.totalPoints} pts ({row.totalPart} asig.)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Promedio por publicador:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {row.avgPoints} pts
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Máximo en el grupo:</span>
                              <span className="font-mono font-bold text-rose-400">
                                {row.maxPoints} pts
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                              Sobrecargados: {row.sobrecargados} · Subutilizados/Descanso: {row.subutilizados}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Bar
                      yAxisId="left"
                      dataKey="ensenanza"
                      name="Enseñanza"
                      stackId="grp"
                      fill={CATEGORY_HEX_COLORS.ensenanza}
                      cursor="pointer"
                      onClick={(d: any) => {
                        const gNum = d?.groupNumber || d?.payload?.groupNumber;
                        if (gNum) handleToggleServiceGroup(gNum);
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="estudiantil_lectura"
                      name="Estudiantil/Lectura"
                      stackId="grp"
                      fill={CATEGORY_HEX_COLORS.estudiantil_lectura}
                      cursor="pointer"
                      onClick={(d: any) => {
                        const gNum = d?.groupNumber || d?.payload?.groupNumber;
                        if (gNum) handleToggleServiceGroup(gNum);
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="deberes_logistica"
                      name="Deberes/Audio"
                      stackId="grp"
                      fill={CATEGORY_HEX_COLORS.deberes_logistica}
                      cursor="pointer"
                      onClick={(d: any) => {
                        const gNum = d?.groupNumber || d?.payload?.groupNumber;
                        if (gNum) handleToggleServiceGroup(gNum);
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="ministerio_campo"
                      name="Campo/Carritos"
                      stackId="grp"
                      fill={CATEGORY_HEX_COLORS.ministerio_campo}
                      cursor="pointer"
                      onClick={(d: any) => {
                        const gNum = d?.groupNumber || d?.payload?.groupNumber;
                        if (gNum) handleToggleServiceGroup(gNum);
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="oraciones"
                      name="Oraciones"
                      stackId="grp"
                      fill={CATEGORY_HEX_COLORS.oraciones}
                      radius={[6, 6, 0, 0]}
                      cursor="pointer"
                      onClick={(d: any) => {
                        const gNum = d?.groupNumber || d?.payload?.groupNumber;
                        if (gNum) handleToggleServiceGroup(gNum);
                      }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgPoints"
                      name="Promedio por Publicador (pts)"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#4f46e5' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Inspector Rápido al hacer clic en una barra del gráfico */}
        {selectedChartReport && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-slate-900 text-sm">
                  {selectedChartReport.displayName}
                </span>
                <span className="text-slate-500">
                  {selectedChartReport.cohortLabel} · Grupo #{selectedChartReport.publisher.groupNumber || 1}
                </span>
                {renderStatusBadge(
                  selectedChartReport.loadStatus,
                  selectedChartReport.hasFatigueAlert
                )}
              </div>
              <p className="text-slate-600">
                Acumula <strong className="font-mono text-indigo-700">{selectedChartReport.totalWeightedPoints} pts</strong> en{' '}
                <strong>{selectedChartReport.totalRawAssignments} asignaciones</strong> (promedio de su privilegio:{' '}
                <strong className="font-mono">{selectedChartReport.cohortAveragePoints} pts</strong> ·{' '}
                <strong>{selectedChartReport.relativeLoadPercent}%</strong>).
                {selectedChartReport.unusedRoleLabels.length > 0 &&
                  ` Tiene ${selectedChartReport.unusedRoleLabels.length} privilegio(s) habilitado(s) sin utilizar.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedChartPubId(null)}
              className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 shrink-0"
            >
              Cerrar inspección
            </button>
          </div>
        )}
      </div>

      {/* Matriz Principal de Peso de Carga por Publicador */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Radiografía de Peso de Carga por Publicador ({filteredReports.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier publicador para inspeccionar su historial ponderado y sus privilegios habilitados sin uso.
            </p>
          </div>

          {/* Controles de Filtro */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar publicador..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
              />
            </div>

            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <option value="all">Todos los Privilegios</option>
              <option value="anciano">Ancianos</option>
              <option value="siervo_ministerial">Siervos Ministeriales</option>
              <option value="hermano_bautizado">Hermanos / Estudiantes</option>
              <option value="hermana_estudiante">Hermanas</option>
            </select>

            <select
              value={groupSelectValue}
              onChange={(e) => handleGroupDropdownChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <option value="all">Todos los Grupos</option>
              {selectedGroups.length > 1 && (
                <option value="multi">
                  Grupos ({selectedGroups.map((n) => `#${n}`).join(', ')})
                </option>
              )}
              {preachingGroups.map((g) => (
                <option key={g.number} value={String(g.number)}>
                  {g.name || `Grupo #${g.number}`}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <option value="all">Todos los Estados</option>
              <option value="sobrecargado">Sobrecargados (&gt;140%)</option>
              <option value="fatigue">Con Alerta de Fatiga (3+ sem.)</option>
              <option value="optimo">Carga Óptima</option>
              <option value="subutilizado">Subutilizados (&lt;60%)</option>
              <option value="en_descanso">En Descanso (+35 días o 0 pts)</option>
              <option value="unused_roles">Con Roles Habilitados Sin Uso</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-700 bg-indigo-50/60"
            >
              <option value="weighted">Ordenar: Peso Ponderado (Mayor)</option>
              <option value="raw">Ordenar: N° Asignaciones</option>
              <option value="rest">Ordenar: Más Días en Descanso</option>
              <option value="streak">Ordenar: Mayor Racha Semanal</option>
            </select>
          </div>
        </div>

        {/* Leyenda de Colores de la Barra Apilada */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70">
          <span className="font-bold text-slate-700">Leyenda de Peso:</span>
          {(Object.keys(KHS_CATEGORY_META) as KhsWeightCategory[]).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-xs ${KHS_CATEGORY_META[cat].barClass}`} />
              <span>{KHS_CATEGORY_META[cat].shortLabel}</span>
            </div>
          ))}
        </div>

        {/* Lista de Publicadores con Barra Apilada */}
        <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
          {filteredReports.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No se encontraron publicadores con los filtros seleccionados.
            </div>
          ) : (
            filteredReports.map((rep) => {
              const isExpanded = expandedPublisherId === rep.publisher.id;
              const totalBarWidthPct =
                maxWeightedPoints > 0
                  ? Math.max(
                      rep.totalWeightedPoints > 0 ? 4 : 0,
                      Math.round((rep.totalWeightedPoints / maxWeightedPoints) * 100)
                    )
                  : 0;

              return (
                <div
                  key={rep.publisher.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-indigo-300 bg-indigo-50/20 shadow-xs'
                      : 'border-slate-200/90 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPublisherId(isExpanded ? null : rep.publisher.id)
                    }
                    className="w-full text-left p-3.5 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {rep.displayName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {rep.cohortLabel} • G#{rep.publisher.groupNumber || 1}
                        </span>
                        {renderStatusBadge(rep.loadStatus, rep.hasFatigueAlert)}
                        {rep.hasFatigueAlert && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            <Flame className="w-3 h-3" />
                            {rep.maxConsecutiveWeeks} sem. seguidas
                          </span>
                        )}
                        {rep.unusedRoleLabels.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldAlert className="w-3 h-3" />
                            {rep.unusedRoleLabels.length} rol(es) sin usar
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-sm font-black text-indigo-700">
                            {rep.totalWeightedPoints} pts
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1.5">
                            ({rep.totalRawAssignments} asig. •{' '}
                            {rep.daysSinceLastAssignment >= 900
                              ? 'Sin asignar'
                              : `hace ${rep.daysSinceLastAssignment}d`}
                            )
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Barra Horizontal Multicolor Apilada */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                      {rep.totalWeightedPoints > 0 && (
                        <div
                          className="h-full flex rounded-full overflow-hidden transition-all duration-500"
                          style={{ width: `${totalBarWidthPct}%` }}
                        >
                          {(Object.keys(KHS_CATEGORY_META) as KhsWeightCategory[]).map(
                            (cat) => {
                              const catPts = rep.pointsByCategory[cat];
                              if (catPts <= 0) return null;
                              const segPct =
                                (catPts / rep.totalWeightedPoints) * 100;
                              return (
                                <div
                                  key={cat}
                                  className={`h-full ${KHS_CATEGORY_META[cat].barClass}`}
                                  style={{ width: `${segPct}%` }}
                                  title={`${KHS_CATEGORY_META[cat].label}: ${catPts} pts`}
                                />
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Panel Expandido: Auditoría Individual */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-200/70 space-y-3 text-xs bg-slate-50/60 rounded-b-2xl">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {(Object.keys(KHS_CATEGORY_META) as KhsWeightCategory[]).map(
                          (cat) => (
                            <div
                              key={cat}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/80"
                            >
                              <div className="text-[10px] font-bold text-slate-500">
                                {KHS_CATEGORY_META[cat].shortLabel}
                              </div>
                              <div className="text-sm font-black text-slate-900 mt-0.5">
                                {rep.pointsByCategory[cat]} pts{' '}
                                <span className="text-[11px] font-normal text-slate-500">
                                  ({rep.countsByCategory[cat]}x)
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* Roles Habilitados Sin Uso */}
                      {rep.unusedRoleLabels.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-amber-900 mr-1">
                            Privilegios habilitados en su ficha con 0 asignaciones en este período:
                          </span>
                          {rep.unusedRoleLabels.map((lbl) => (
                            <span
                              key={lbl}
                              className="px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 font-semibold text-[11px]"
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Historial de Asignaciones Ponderadas */}
                      <div className="space-y-1.5">
                        <div className="font-bold text-slate-700">
                          Desglose de Participaciones Registradas ({rep.events.length}):
                        </div>
                        {rep.events.length === 0 ? (
                          <p className="text-slate-400 italic">
                            Sin asignaciones registradas en el período seleccionado.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                            {rep.events.map((ev, i) => (
                              <span
                                key={`${ev.date}-${ev.roleKey}-${i}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px]"
                              >
                                <span className="font-semibold text-slate-500">
                                  {ev.date}
                                </span>
                                <span className="font-bold text-slate-800">
                                  {ev.roleLabel}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-sm bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                                  +{ev.points} pts
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comparativa de Peso de Carga por Grupos de Predicación */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Equidad y Peso de Carga por Grupos de Predicación</span>
          </h3>
          <span className="text-xs text-slate-500">
            Haz clic en cualquier tarjeta de grupo para filtrar o comparar su carga en los gráficos.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {groupStats.map((item) => {
            const isSelected = selectedGroups.includes(item.groupNumber);
            return (
              <button
                key={item.group.number}
                type="button"
                onClick={() => handleToggleServiceGroup(item.groupNumber)}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 text-xs ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {item.group.name || `Grupo #${item.group.number}`}
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    #{item.group.number}
                  </span>
                </div>

                <div className="space-y-1 text-slate-600">
                  <p>
                    Integrantes activos: <strong>{item.memberCount}</strong>
                  </p>
                  <p>
                    Peso de Carga:{' '}
                    <strong className="text-indigo-700">{item.totalPoints} pts</strong>{' '}
                    <span className="text-[11px] text-slate-400">
                      ({item.totalPart} asig.)
                    </span>
                  </p>
                  <p>
                    Promedio por publicador:{' '}
                    <strong className="text-emerald-700">{item.avgPoints} pts</strong>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Configurador de Pesos de Carga */}
      {showWeightsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <span>Configurador de Puntos de Peso de Carga</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajusta cuántos puntos de esfuerzo suma cada tipo de privilegio en la congregación y en el asignador automático.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWeightsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {(Object.keys(KHS_CATEGORY_META) as KhsWeightCategory[]).map((cat) => {
                const items = KHS_ROLE_WEIGHT_DEFINITIONS.filter(
                  (d) => d.category === cat
                );
                return (
                  <div key={cat} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${KHS_CATEGORY_META[cat].badgeClass}`}
                      >
                        {KHS_CATEGORY_META[cat].label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {items.map((def) => {
                        const currentVal =
                          weights[def.key] !== undefined
                            ? weights[def.key]
                            : def.defaultPoints;
                        return (
                          <div
                            key={def.key}
                            className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {def.shortLabel}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {def.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="10"
                                value={currentVal}
                                onChange={(e) =>
                                  handleUpdateWeight(
                                    def.key,
                                    parseFloat(e.target.value) || def.defaultPoints
                                  )
                                }
                                className="w-16 px-2 py-1 rounded-xl border border-slate-300 bg-white text-center text-xs font-extrabold text-indigo-700"
                              />
                              <span className="text-[11px] font-bold text-slate-500">
                                pts
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetWeights}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Oficiales</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWeightsModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white"
              >
                Listo y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
