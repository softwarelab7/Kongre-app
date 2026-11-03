// src/components/InformesServicioTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { MonthlyServiceReport, Publisher } from '../types';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  BookOpen,
  Users,
  Send,
  Share2,
  Filter,
  Search,
  AlertCircle,
  Calendar,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';

export const InformesServicioTab: React.FC = () => {
  const {
    publishers,
    monthlyReports,
    updateMonthlyReport,
    batchUpdateMonthlyReports,
    preachingGroups,
    settings,
  } = useCongregation();

  // Selected Month (Default current month or previous month e.g. 2026-09)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [filterStatus, setFilterStatus] = useState<
    'todos' | 'pendientes' | 'informaron' | 'precursores'
  >('todos');
  const [filterGroup, setFilterGroup] = useState<number | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Active publishers only
  const activePublishers = useMemo(() => {
    return publishers.filter((p) => p.active);
  }, [publishers]);

  // Map of reports for the selected month: publisherId -> MonthlyServiceReport
  const reportsMap = useMemo(() => {
    const map = new Map<string, MonthlyServiceReport>();
    monthlyReports
      .filter((r) => r.month === selectedMonth)
      .forEach((r) => map.set(r.publisherId, r));
    return map;
  }, [monthlyReports, selectedMonth]);

  // Calculate congregation KPI summary for selected month (S-4 data)
  const summary = useMemo(() => {
    let reportedCount = 0;
    let totalHours = 0;
    let totalStudies = 0;
    let pioneerHours = 0;
    let pioneerCount = 0;

    activePublishers.forEach((p) => {
      const rep = reportsMap.get(p.id);
      const isPioneer =
        p.privilege === 'precursor_regular' || p.privilege === 'precursor_especial';

      if (rep && rep.participated) {
        reportedCount++;
        totalStudies += rep.bibleStudies || 0;
        if (rep.hours) {
          totalHours += rep.hours;
          if (isPioneer) {
            pioneerHours += rep.hours;
            pioneerCount++;
          }
        }
      }
    });

    const pendingCount = activePublishers.length - reportedCount;
    const completionPercent =
      activePublishers.length > 0
        ? Math.round((reportedCount / activePublishers.length) * 100)
        : 0;

    const avgPioneerHours = pioneerCount > 0 ? Math.round(pioneerHours / pioneerCount) : 0;

    return {
      totalPublishers: activePublishers.length,
      reportedCount,
      pendingCount,
      completionPercent,
      totalHours,
      totalStudies,
      pioneerCount,
      avgPioneerHours,
    };
  }, [activePublishers, reportsMap]);

  // Filtered publisher list
  const filteredPublishers = useMemo(() => {
    return activePublishers.filter((p) => {
      const rep = reportsMap.get(p.id);
      const hasReported = Boolean(rep && rep.participated);
      const isPioneer =
        p.privilege === 'precursor_regular' || p.privilege === 'precursor_especial';

      if (filterStatus === 'pendientes' && hasReported) return false;
      if (filterStatus === 'informaron' && !hasReported) return false;
      if (filterStatus === 'precursores' && !isPioneer) return false;

      if (filterGroup !== 'todos' && p.groupNumber !== filterGroup) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [activePublishers, reportsMap, filterStatus, filterGroup, searchQuery]);

  // Handle single publisher report update
  const handleToggleParticipated = (publisherId: string, currentVal: boolean) => {
    const existing = reportsMap.get(publisherId);
    const publisher = publishers.find((p) => p.id === publisherId);
    const isPioneer =
      publisher?.privilege === 'precursor_regular' ||
      publisher?.privilege === 'precursor_especial';

    updateMonthlyReport({
      id: existing?.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      publisherId,
      month: selectedMonth,
      participated: !currentVal,
      hours: !currentVal ? existing?.hours || (isPioneer ? 50 : 10) : 0,
      bibleStudies: existing?.bibleStudies || 0,
      notes: existing?.notes || '',
      reportedAt: !currentVal ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const handleUpdateHours = (publisherId: string, hours: number) => {
    const existing = reportsMap.get(publisherId);
    updateMonthlyReport({
      id: existing?.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      publisherId,
      month: selectedMonth,
      participated: true,
      hours: Math.max(0, hours),
      bibleStudies: existing?.bibleStudies || 0,
      notes: existing?.notes || '',
      reportedAt: existing?.reportedAt || new Date().toISOString().split('T')[0],
    });
  };

  const handleUpdateStudies = (publisherId: string, delta: number) => {
    const existing = reportsMap.get(publisherId);
    const current = existing?.bibleStudies || 0;
    const nextVal = Math.max(0, current + delta);

    updateMonthlyReport({
      id: existing?.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      publisherId,
      month: selectedMonth,
      participated: true,
      hours: existing?.hours || 0,
      bibleStudies: nextVal,
      notes: existing?.notes || '',
      reportedAt: existing?.reportedAt || new Date().toISOString().split('T')[0],
    });
  };

  // WhatsApp Reminder for missing reports
  const handleSendReminderWhatsApp = (publisher: Publisher) => {
    const cleanPhone = publisher.phone ? publisher.phone.replace(/[^0-9]/g, '') : '';
    const greeting = publisher.gender === 'hermana' ? 'Estimada hermana' : 'Estimado hermano';
    const monthName = formatMonthName(selectedMonth);

    const msg = encodeURIComponent(
      `¡Hola ${greeting} ${publisher.name}! Le enviamos un saludo cordial de parte de los ancianos de la Congregación ${settings.congregationName}.\n\n` +
      `Le recordamos con cariño entregar su *informe de predicación del mes de ${monthName}* para completar el registro de la congregación.\n\n` +
      `¿Pudo participar en el ministerio durante el mes? Por favor indíquenos para anotarlo. ¡Muchas gracias por su apoyo!`
    );

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  // Copy formal S-4 congregation summary
  const handleCopyCongregationSummary = () => {
    const monthName = formatMonthName(selectedMonth);
    let text = `*INFORME MENSUAL DE LA CONGREGACIÓN (S-4)*\n`;
    text += `Congregación: ${settings.congregationName}\n`;
    text += `Mes de servicio: ${monthName}\n\n`;
    text += `👥 *Total publicadores activos:* ${summary.totalPublishers}\n`;
    text += `✅ *Publicadores que informaron:* ${summary.reportedCount} (${summary.completionPercent}%)\n`;
    text += `⏳ *Pendientes de informar:* ${summary.pendingCount}\n`;
    text += `📖 *Cursos bíblicos conducidos:* ${summary.totalStudies}\n`;
    text += `⭐ *Precursores regulares activos:* ${summary.pioneerCount}\n`;
    text += `⏱️ *Promedio de horas precursores:* ${summary.avgPioneerHours} hrs\n`;
    text += `\n_Generado automáticamente desde la plataforma de gestión congregacional._`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  function formatMonthName(yyyyMm: string) {
    const [y, m] = yyyyMm.split('-');
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${months[parseInt(m, 10) - 1]} de ${y}`;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra Unificada de Mes de Servicio, Progreso y Acción S-4 */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500/8 dark:bg-indigo-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5]">Mes de Servicio:</span>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] bg-white/80 dark:bg-white/5 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono tabular-nums"
            />
            <span className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] hidden md:inline">
              ({formatMonthName(selectedMonth)})
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={handleCopyCongregationSummary}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/30 transition-all cursor-pointer active:scale-95"
          >
            {copiedSummary ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>¡Resumen S-4 Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar Resumen Sucursal (S-4)</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 flex items-center gap-3 w-full pt-3 border-t border-zinc-100/80 dark:border-white/6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] shrink-0">Recepción S-4:</span>
          <div className="flex-1 bg-zinc-200/70 dark:bg-white/6 rounded-full h-2.5 overflow-hidden border border-zinc-200/50 dark:border-white/6">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.completionPercent >= 90
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : summary.completionPercent >= 60
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${summary.completionPercent}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-zinc-800 dark:text-[#F4F4F5] shrink-0 font-mono tabular-nums bg-white/70 dark:bg-white/6 px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-white/8">
            {summary.completionPercent}% ({summary.reportedCount}/{summary.totalPublishers})
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            Publicadores Activos
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums block mt-1">
            {summary.totalPublishers}
          </span>
        </div>
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-emerald-500/8 blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Informaron
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap mt-1">
            <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
              {summary.reportedCount}
            </span>
            <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-semibold font-mono tabular-nums">
              ({summary.pendingCount} pend.)
            </span>
          </div>
        </div>
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-violet-500/8 blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            Cursos Bíblicos
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums block mt-1">
            {summary.totalStudies}
          </span>
        </div>
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            Promedio Precursores
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums block mt-1">
            {summary.avgPioneerHours} hrs
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="kg-glass-surface p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              filterStatus === 'todos'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-[#A1A1AA] hover:bg-white dark:hover:bg-white/10 border border-zinc-200/60 dark:border-white/8'
            }`}
          >
            Todos <span className="font-mono tabular-nums">({activePublishers.length})</span>
          </button>
          <button
            onClick={() => setFilterStatus('pendientes')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              filterStatus === 'pendientes'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-[#A1A1AA] hover:bg-white dark:hover:bg-white/10 border border-zinc-200/60 dark:border-white/8'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pendientes <span className="font-mono tabular-nums">({summary.pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('informaron')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              filterStatus === 'informaron'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-[#A1A1AA] hover:bg-white dark:hover:bg-white/10 border border-zinc-200/60 dark:border-white/8'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Informaron <span className="font-mono tabular-nums">({summary.reportedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('precursores')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              filterStatus === 'precursores'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-[#A1A1AA] hover:bg-white dark:hover:bg-white/10 border border-zinc-200/60 dark:border-white/8'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Precursores
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterGroup}
            onChange={(e) =>
              setFilterGroup(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
            }
            className="px-3 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 text-xs font-bold bg-white/80 dark:bg-white/5 text-zinc-700 dark:text-[#F4F4F5] cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="todos" className="bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5]">Todos los grupos</option>
            {preachingGroups.map((g) => (
              <option key={g.number} value={g.number} className="bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5]">
                {g.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar publicador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 text-xs bg-white/80 dark:bg-white/5 focus:bg-white dark:focus:bg-[#121216] text-zinc-800 dark:text-[#F4F4F5] placeholder:text-zinc-400 dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>
      </div>

      {/* Publisher Reports Table */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-[#E4E4E7]">
            <thead className="bg-zinc-50/90 dark:bg-[#18181F] border-b border-zinc-200/80 dark:border-white/8 text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Publicador</th>
                <th className="p-3.5 text-center">Grupo</th>
                <th className="p-3.5 text-center">¿Participó?</th>
                <th className="p-3.5 text-center">Horas</th>
                <th className="p-3.5 text-center">Cursos Bíblicos</th>
                <th className="p-3.5 text-right pr-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/80 dark:divide-white/5">
              {filteredPublishers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400 dark:text-[#A1A1AA] italic text-xs">
                    No se encontraron publicadores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPublishers.map((pub) => {
                  const rep = reportsMap.get(pub.id);
                  const participated = Boolean(rep?.participated);
                  const isPioneer =
                    pub.privilege === 'precursor_regular' ||
                    pub.privilege === 'precursor_especial';

                  return (
                    <tr
                      key={pub.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-white/4 transition-colors"
                    >
                      {/* Publisher name and privileges */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              participated ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">{pub.name}</span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {isPioneer && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">
                                  Precursor/a
                                </span>
                              )}
                              {pub.privilege === 'anciano' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20">
                                  Anciano
                                </span>
                              )}
                              {pub.privilege === 'siervo_ministerial' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20">
                                  Siervo min.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="p-3.5 text-center font-bold text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {pub.groupNumber ? `G-${pub.groupNumber}` : '—'}
                      </td>

                      {/* Participated Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleParticipated(pub.id, participated)}
                          className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer border ${
                            participated
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
                              : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-[#A1A1AA] border-zinc-200/60 dark:border-white/8 hover:bg-zinc-200 dark:hover:bg-white/10'
                          }`}
                        >
                          {participated ? '✓ Sí informó' : 'Pendiente'}
                        </button>
                      </td>

                      {/* Hours input */}
                      <td className="p-3.5 text-center">
                        {isPioneer || participated ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={rep?.hours ?? ''}
                              placeholder="0"
                              onChange={(e) =>
                                handleUpdateHours(pub.id, parseInt(e.target.value, 10) || 0)
                              }
                              className="w-16 p-1.5 text-center font-bold rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums text-xs focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
                            />
                            <span className="text-[11px] text-zinc-400 dark:text-[#A1A1AA]">hrs</span>
                          </div>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 italic">—</span>
                        )}
                      </td>

                      {/* Bible Studies Stepper */}
                      <td className="p-3.5 text-center">
                        {participated ? (
                          <div className="inline-flex items-center gap-1.5 bg-zinc-100/80 dark:bg-white/6 px-2 py-0.5 rounded-xl border border-zinc-200/60 dark:border-white/8">
                            <button
                              onClick={() => handleUpdateStudies(pub.id, -1)}
                              className="w-5 h-5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-[#F4F4F5] font-bold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] min-w-[18px] text-center font-mono tabular-nums">
                              {rep?.bibleStudies || 0}
                            </span>
                            <button
                              onClick={() => handleUpdateStudies(pub.id, 1)}
                              className="w-5 h-5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-zinc-600 dark:text-[#F4F4F5] font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 italic">—</span>
                        )}
                      </td>

                      {/* Action: WhatsApp Reminder if not reported */}
                      <td className="p-3.5 text-right pr-5">
                        {!participated && (
                          <button
                            onClick={() => handleSendReminderWhatsApp(pub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Enviar recordatorio amistoso para solicitar informe mensual"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Recordar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
