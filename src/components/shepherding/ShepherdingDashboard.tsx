// src/components/shepherding/ShepherdingDashboard.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../../context/CongregationContext';
import { Publisher, ShepherdingVisit, ShepherdingUrgency } from '../../types';
import {
  evaluatePublisherPastoralStatus,
  computeCongregationShepherdingMetrics,
  printShepherdingPlanA4,
  SHEPHERDING_FOCUS_CONFIG,
  buildShepherdingFamilyInviteWhatsApp,
  buildShepherdingCompanionReminderWhatsApp,
} from '../../utils/shepherdingEngine';
import { openWhatsAppLink } from '../../utils/whatsapp';
import { ShepherdingVisitModal } from './ShepherdingVisitModal';
import {
  HeartHandshake,
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Printer,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  MapPin,
  MessageCircle,
  Edit2,
  Trash2,
  Check,
  ChevronRight,
  Shield,
  Layers,
  Award,
  BookOpen,
  ArrowRight,
  X,
} from 'lucide-react';

export const ShepherdingDashboard: React.FC = () => {
  const {
    publishers,
    preachingGroups,
    shepherdingVisits,
    addShepherdingVisit,
    updateShepherdingVisit,
    deleteShepherdingVisit,
    completeShepherdingVisit,
    settings,
  } = useCongregation();

  // Sub-vista activa
  const [activeSubView, setActiveSubView] = useState<'semaforo' | 'agenda' | 'historial'>('semaforo');

  // Filtros
  const [selectedGroup, setSelectedGroup] = useState<string>('todos'); // 'todos' | '1' | '2'...
  const [selectedUrgency, setSelectedUrgency] = useState<string>('todos'); // 'todos' | 'urgente' | 'atencion' | 'al_dia'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<ShepherdingVisit | null>(null);
  const [selectedPublisherForNewVisit, setSelectedPublisherForNewVisit] = useState<string | undefined>(undefined);

  // Quick completion modal state
  const [completingVisit, setCompletingVisit] = useState<ShepherdingVisit | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Elders list for assignment
  const elders = useMemo(() => {
    return publishers.filter((p) => {
      if (p.status === 'deleted') return false;
      const r = (p.role || p.privilege || '').toLowerCase();
      return r === 'elder' || r === 'anciano' || r === 'super_admin';
    });
  }, [publishers]);

  // Overall metrics
  const metrics = useMemo(() => {
    return computeCongregationShepherdingMetrics(publishers, shepherdingVisits);
  }, [publishers, shepherdingVisits]);

  // Filtered publisher evaluations for Semáforo
  const filteredEvaluations = useMemo(() => {
    return metrics.evaluated
      .filter((e) => {
        // Group filter
        if (selectedGroup !== 'todos') {
          const gNum = e.publisher.groupNumber !== undefined ? String(e.publisher.groupNumber) : '';
          if (gNum !== selectedGroup) return false;
        }
        // Urgency filter
        if (selectedUrgency !== 'todos' && e.urgency !== selectedUrgency) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = e.publisher.name.toLowerCase().includes(q);
          const eldersMatch = (e.publisher.shepherding_elders || '').toLowerCase().includes(q);
          if (!nameMatch && !eldersMatch) return false;
        }
        return true;
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [metrics.evaluated, selectedGroup, selectedUrgency, searchQuery]);

  // Scheduled pending visits
  const scheduledVisits = useMemo(() => {
    return shepherdingVisits
      .filter((v) => v.status === 'programada')
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [shepherdingVisits]);

  // Completed visits history
  const completedVisits = useMemo(() => {
    return shepherdingVisits
      .filter((v) => v.status === 'completada')
      .sort((a, b) => (b.completedDate || b.scheduledDate).localeCompare(a.completedDate || a.scheduledDate));
  }, [shepherdingVisits]);

  // Handle Complete Visit
  const handleConfirmComplete = () => {
    if (!completingVisit) return;
    completeShepherdingVisit(completingVisit.id, completionDate, completionNotes.trim() || undefined);
    setCompletingVisit(null);
    setCompletionNotes('');
  };

  // Open WhatsApp to family
  const handleSendFamilyWhatsApp = (v: ShepherdingVisit) => {
    const pub = publishers.find((p) => p.id === v.publisherId);
    const msg = buildShepherdingFamilyInviteWhatsApp({
      publisherName: v.publisherName || pub?.name || 'Publicador',
      date: v.scheduledDate,
      time: v.scheduledTime,
      elder1Name: v.elder1Name || 'Anciano',
      elder2Name: v.elder2Name,
      focus: v.focus,
      scriptures: v.scripturesOrPoints,
    });
    openWhatsAppLink(pub?.phone || '', msg);
  };

  // Open WhatsApp to companion
  const handleSendCompanionWhatsApp = (v: ShepherdingVisit) => {
    const pub = publishers.find((p) => p.id === v.publisherId);
    const companion = elders.find((e) => e.id === v.elder2Id);
    const msg = buildShepherdingCompanionReminderWhatsApp({
      companionName: v.elder2Name || companion?.name || 'Compañero',
      publisherName: v.publisherName || pub?.name || 'Publicador',
      date: v.scheduledDate,
      time: v.scheduledTime,
      phone: pub?.phone,
      address: pub?.address,
      focus: v.focus,
      scriptures: v.scripturesOrPoints,
      notes: v.notes,
    });
    openWhatsAppLink(companion?.phone || '', msg);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP BENTO KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Cobertura Anual */}
        <div className="col-span-2 lg:col-span-1 p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Cobertura Pastoral
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tight">
              {metrics.coveragePercentage}%
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {metrics.completedThisServiceYearCount} de {metrics.totalPublishers} publicadores
            </div>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.coveragePercentage}%` }}
            />
          </div>
        </div>

        {/* Prioridad Alta / Urgentes */}
        <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-rose-500/25 bg-rose-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Prioridad Alta
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400 tabular-nums">
              {metrics.urgentCount}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              &gt; 12 meses o inactivos
            </div>
          </div>
          <button
            onClick={() => {
              setActiveSubView('semaforo');
              setSelectedUrgency('urgente');
            }}
            className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer mt-1"
          >
            <span>Ver lista urgente</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Por Atender (6-12 meses) */}
        <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-amber-500/25 bg-amber-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Por Atender
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 tabular-nums">
              {metrics.attentionCount}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Entre 6 y 12 meses</div>
          </div>
          <button
            onClick={() => {
              setActiveSubView('semaforo');
              setSelectedUrgency('atencion');
            }}
            className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer mt-1"
          >
            <span>Ver próximos</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Al Día (< 6 meses) */}
        <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Al Día
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-200 tabular-nums">
              {metrics.upToDateCount}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Visita reciente (&lt; 6 m)</div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            Atención al corriente ✓
          </span>
        </div>

        {/* Visitas Programadas */}
        <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-indigo-500/25 bg-indigo-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Agendadas
            </span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 tabular-nums">
              {metrics.scheduledCount}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Citas pendientes</div>
          </div>
          <button
            onClick={() => setActiveSubView('agenda')}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer mt-1"
          >
            <span>Ver agenda</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. SUB-VIEW TABS & ACTION BAR */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sub-view switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-white/5 rounded-2xl border border-zinc-200/80 dark:border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveSubView('semaforo')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'semaforo'
                ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Semáforo Pastoral ({metrics.totalPublishers})</span>
          </button>

          <button
            onClick={() => setActiveSubView('agenda')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'agenda'
                ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Agenda Programada ({metrics.scheduledCount})</span>
          </button>

          <button
            onClick={() => setActiveSubView('historial')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeSubView === 'historial'
                ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
            <span>Historial ({completedVisits.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              printShepherdingPlanA4(settings.congregationName, metrics.evaluated, shepherdingVisits)
            }
            className="px-3.5 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
            title="Imprimir informe confidencial para la reunión de ancianos"
          >
            <Printer className="w-4 h-4 text-zinc-500" />
            <span>Imprimir Plan A4</span>
          </button>

          <button
            onClick={() => {
              setVisitToEdit(null);
              setSelectedPublisherForNewVisit(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Visita</span>
          </button>
        </div>
      </div>

      {/* 3. VIEW 1: SEMÁFORO PASTORAL */}
      {activeSubView === 'semaforo' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar publicador o ancianos..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter by Group */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-500 dark:text-zinc-400">Grupo:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold text-xs cursor-pointer outline-hidden"
              >
                <option value="todos">Todos los Grupos</option>
                {preachingGroups.map((g) => (
                  <option key={g.number} value={String(g.number)}>
                    Grupo {g.number} ({g.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Urgency */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-500 dark:text-zinc-400">Estado:</span>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold text-xs cursor-pointer outline-hidden"
              >
                <option value="todos">Todos los Estados</option>
                <option value="urgente">🔴 Prioridad Alta (&gt; 12 m)</option>
                <option value="atencion">🟡 Por Atender (6-12 m)</option>
                <option value="al_dia">🟢 Al Día (&lt; 6 m)</option>
              </select>
            </div>
          </div>

          {/* Publishers Table */}
          <div className="kg-card-bento kg-glass-surface rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100/80 dark:bg-white/5 border-b border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Publicador</th>
                    <th className="py-3 px-3">Grupo</th>
                    <th className="py-3 px-4">Última Visita</th>
                    <th className="py-3 px-4">Ancianos</th>
                    <th className="py-3 px-4">Estado Pastoral</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        No se encontraron publicadores con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredEvaluations.map((item) => {
                      const pub = item.publisher;
                      return (
                        <tr
                          key={pub.id}
                          className="hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors"
                        >
                          {/* Name & Phone */}
                          <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-white">
                            <div className="font-bold">{pub.name}</div>
                            {pub.phone && (
                              <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-500" />
                                <span>{pub.phone}</span>
                              </div>
                            )}
                          </td>

                          {/* Group */}
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-zinc-200/60 dark:bg-white/10 font-bold text-[11px]">
                              G{pub.groupNumber || '—'}
                            </span>
                          </td>

                          {/* Last Visit */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-zinc-800 dark:text-zinc-200">
                              {item.lastVisitDateText}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {item.monthsSinceLastVisit !== null
                                ? `Hace ${item.monthsSinceLastVisit} meses`
                                : 'Nunca pastoreado'}
                            </div>
                          </td>

                          {/* Elders */}
                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-[11px] max-w-[180px] truncate">
                            {pub.shepherding_elders || '—'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeStyle}`}
                              >
                                {item.label}
                              </span>
                              {item.hasPendingScheduledVisit && (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3" />
                                  <span>Cita: {item.scheduledVisit?.scheduledDate}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4 text-right">
                            {item.hasPendingScheduledVisit ? (
                              <button
                                onClick={() => setActiveSubView('agenda')}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 transition cursor-pointer"
                              >
                                Ver Cita
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setVisitToEdit(null);
                                  setSelectedPublisherForNewVisit(pub.id);
                                  setIsModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 transition cursor-pointer active:scale-95 flex items-center gap-1 ml-auto"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Agendar</span>
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
      )}

      {/* 4. VIEW 2: AGENDA PROGRAMADA */}
      {activeSubView === 'agenda' && (
        <div className="space-y-4">
          {scheduledVisits.length === 0 ? (
            <div className="p-12 text-center kg-card-bento kg-glass-surface rounded-3xl border border-zinc-200/80 dark:border-white/10 space-y-3">
              <Calendar className="w-12 h-12 text-zinc-400 mx-auto" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                No hay visitas de pastoreo programadas
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Coordina una visita con el cuerpo de ancianos seleccionando un publicador desde el
                Semáforo Pastoral o haciendo clic en «Programar Visita».
              </p>
              <button
                onClick={() => {
                  setVisitToEdit(null);
                  setSelectedPublisherForNewVisit(undefined);
                  setIsModalOpen(true);
                }}
                className="mt-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                + Programar Primera Visita
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledVisits.map((v) => {
                const pub = publishers.find((p) => p.id === v.publisherId);
                const focusConf = SHEPHERDING_FOCUS_CONFIG[v.focus];

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-indigo-500/20 dark:border-indigo-400/20 shadow-sm space-y-3.5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                              {focusConf?.label || v.focus}
                            </span>
                            {v.groupNumber && (
                              <span className="text-[10px] font-bold text-zinc-500">
                                Grupo {v.groupNumber}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                            {v.publisherName || pub?.name || 'Publicador'}
                          </h3>
                        </div>

                        {/* Edit / Delete actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setVisitToEdit(v);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 transition cursor-pointer"
                            title="Editar visita"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteShepherdingVisit(v.id)}
                            className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
                            title="Cancelar / Eliminar cita"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Date, Time & Ancianos */}
                      <div className="mt-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span>{v.scheduledDate}</span>
                          </span>
                          {v.scheduledTime && (
                            <span className="flex items-center gap-1 text-zinc-500 font-mono">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{v.scheduledTime}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-white/5">
                          <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            Ancianos: <strong>{v.elder1Name || 'Anciano'}</strong>
                            {v.elder2Name ? ` y ${v.elder2Name}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Scripture & Notes */}
                      {v.scripturesOrPoints && (
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-2 flex items-start gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span className="italic">{v.scripturesOrPoints}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendFamilyWhatsApp(v)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                          title="Enviar mensaje cordial a la familia por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Familia</span>
                        </button>

                        {v.elder2Id && (
                          <button
                            onClick={() => handleSendCompanionWhatsApp(v)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="Enviar recordatorio al anciano acompañante por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Acompañante</span>
                          </button>
                        )}
                      </div>

                      {/* Mark Completed Button */}
                      <button
                        onClick={() => {
                          setCompletingVisit(v);
                          setCompletionDate(new Date().toISOString().slice(0, 10));
                          setCompletionNotes('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Completada ✓</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW 3: HISTORIAL DE VISITAS REALIZADAS */}
      {activeSubView === 'historial' && (
        <div className="space-y-4">
          <div className="kg-card-bento kg-glass-surface rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100/80 dark:bg-white/5 border-b border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Fecha Realizada</th>
                    <th className="py-3 px-4">Publicador</th>
                    <th className="py-3 px-4">Ancianos</th>
                    <th className="py-3 px-4">Enfoque / Textos</th>
                    <th className="py-3 px-4">Notas de Seguimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                  {completedVisits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        Aún no se han registrado visitas completadas en este periodo.
                      </td>
                    </tr>
                  ) : (
                    completedVisits.map((v) => (
                      <tr key={v.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {v.completedDate || v.scheduledDate}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                          {v.publisherName || 'Publicador'}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-[11px]">
                          {v.elder1Name}
                          {v.elder2Name ? ` y ${v.elder2Name}` : ''}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                          <div className="font-semibold">{SHEPHERDING_FOCUS_CONFIG[v.focus]?.label || v.focus}</div>
                          {v.scripturesOrPoints && (
                            <div className="text-[10px] text-zinc-500 italic mt-0.5">
                              {v.scripturesOrPoints}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 text-[11px] max-w-[200px] truncate">
                          {v.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROGRAMAR / EDITAR VISITA */}
      <ShepherdingVisitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        visitToEdit={visitToEdit}
        initialPublisherId={selectedPublisherForNewVisit}
        publishers={publishers}
        elders={elders}
        onSave={(data, id) => {
          if (id) {
            updateShepherdingVisit({ ...data, id, createdAt: new Date().toISOString() });
          } else {
            addShepherdingVisit(data);
          }
        }}
      />

      {/* QUICK COMPLETE MODAL */}
      {completingVisit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Confirmar Visita Realizada</span>
              </h3>
              <button
                onClick={() => setCompletingVisit(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Registrar visita completada para <strong>{completingVisit.publisherName}</strong>. Esto
              actualizará automáticamente su fecha de último pastoreo al día de hoy.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Fecha de Realización
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Notas Confidenciales de Seguimiento (Opcional)
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Puntos tratados, compromisos o necesidad de seguimiento posterior..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompletingVisit(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-600 dark:text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition"
              >
                Marcar como Realizada ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
