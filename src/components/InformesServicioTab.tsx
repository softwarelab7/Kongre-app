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
    <div className="space-y-6">
      {/* Barra de Acciones de Informes de Predicación (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Registro S-4 / S-21
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            Actividad mensual en el ministerio y horas de precursores
          </span>
        </div>

        {/* Action button */}
        <button
          onClick={handleCopyCongregationSummary}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
        >
          {copiedSummary ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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

      {/* Month Selector Bar & KPI Summary */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Mes de Servicio:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
          />
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            ({formatMonthName(selectedMonth)})
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 w-full sm:w-72">
          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.completionPercent >= 90
                  ? 'bg-emerald-500'
                  : summary.completionPercent >= 60
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${summary.completionPercent}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-slate-800 shrink-0">
            {summary.completionPercent}% ({summary.reportedCount}/{summary.totalPublishers})
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block uppercase">
            Publicadores Activos
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {summary.totalPublishers}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 block uppercase">
            Informaron
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-600">
              {summary.reportedCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              ({summary.pendingCount} pendientes)
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-blue-600 block uppercase">
            Cursos Bíblicos
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600">
            {summary.totalStudies}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-amber-600 block uppercase">
            Promedio Precursores
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600">
            {summary.avgPioneerHours} hrs
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({activePublishers.length})
          </button>
          <button
            onClick={() => setFilterStatus('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === 'pendientes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Pendientes ({summary.pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('informaron')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === 'informaron'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Informaron ({summary.reportedCount})
          </button>
          <button
            onClick={() => setFilterStatus('precursores')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === 'precursores'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            Precursores
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterGroup}
            onChange={(e) =>
              setFilterGroup(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
            }
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="todos">Todos los grupos</option>
            {preachingGroups.map((g) => (
              <option key={g.number} value={g.number}>
                {g.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar publicador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Publisher Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Publicador</th>
                <th className="p-3.5 text-center">Grupo</th>
                <th className="p-3.5 text-center">¿Participó?</th>
                <th className="p-3.5 text-center">Horas</th>
                <th className="p-3.5 text-center">Cursos Bíblicos</th>
                <th className="p-3.5 text-right pr-5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPublishers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 italic text-xs">
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
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !participated ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Publisher name and privileges */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              participated ? 'bg-emerald-500' : 'bg-amber-400'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{pub.name}</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isPioneer && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Precursor/a
                                </span>
                              )}
                              {pub.privilege === 'anciano' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                                  Anciano
                                </span>
                              )}
                              {pub.privilege === 'siervo_ministerial' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                  Siervo min.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="p-3.5 text-center font-bold text-slate-600">
                        {pub.groupNumber ? `G-${pub.groupNumber}` : '—'}
                      </td>

                      {/* Participated Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleParticipated(pub.id, participated)}
                          className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all ${
                            participated
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                              className="w-16 p-1 text-center font-bold rounded-lg border border-slate-200 bg-white text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-[11px] text-slate-400">hrs</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Bible Studies Stepper */}
                      <td className="p-3.5 text-center">
                        {participated ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg">
                            <button
                              onClick={() => handleUpdateStudies(pub.id, -1)}
                              className="w-5 h-5 rounded hover:bg-white text-slate-600 font-bold flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-900 min-w-[18px] text-center">
                              {rep?.bibleStudies || 0}
                            </span>
                            <button
                              onClick={() => handleUpdateStudies(pub.id, 1)}
                              className="w-5 h-5 rounded hover:bg-white text-slate-600 font-bold flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Action: WhatsApp Reminder if not reported */}
                      <td className="p-3.5 text-right pr-5">
                        {!participated && (
                          <button
                            onClick={() => handleSendReminderWhatsApp(pub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-colors"
                            title="Enviar recordatorio amistoso para solicitar informe mensual"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
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
