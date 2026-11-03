// src/components/BatchWhatsAppModal.tsx
import React, { useState, useMemo } from 'react';
import { WeekSchedule, Publisher } from '../types';
import { useCongregation } from '../context/CongregationContext';
import {
  extractWeekAssignments,
  createAssignmentWhatsAppMessage,
  openWhatsAppLink,
  WeeklyAssignmentEntry,
} from '../utils/whatsapp';
import {
  extractAllPublishersMonthlyBundles,
  formatUnifiedMonthlyWhatsAppMessage,
  downloadPublisherUnifiedIcs,
  printPublisherUnifiedMonthlySheet,
  formatSpanishMonthLabel,
  formatShortSpanishDate,
  PublisherMonthlyBundle,
} from '../utils/unifiedMonthlyAssignments';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import {
  X,
  MessageCircle,
  Send,
  Copy,
  Check,
  Calendar,
  Users,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
} from 'lucide-react';

interface BatchWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: WeekSchedule;
}

export const BatchWhatsAppModal: React.FC<BatchWhatsAppModalProps> = ({
  isOpen,
  onClose,
  week,
}) => {
  const {
    publishers,
    weeks,
    settings,
    preachingGroups,
    customDuties,
    cartShifts,
    cartLocations,
    outgoingSpeakers,
    fieldServiceMeetings,
    circuitVisit,
  } = useCongregation();

  // Tab principal: 'semanal' (parte por parte) vs 'mensual_unificado' (1 resumen por hermano)
  const [dispatchMode, setDispatchMode] = useState<'semanal' | 'mensual_unificado'>('mensual_unificado');

  // Estado modo semanal
  const [meetingFilter, setMeetingFilter] = useState<'todas' | 'midweek' | 'weekend'>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'confirmadas' | 'rechazadas'>('todos');
  const [isReminderMode, setIsReminderMode] = useState(false);
  const [sentItemIds, setSentItemIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  // Estado modo mensual unificado
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() =>
    (week?.weekStartDate || new Date().toISOString()).slice(0, 7)
  );
  const [publisherSearch, setPublisherSearch] = useState('');
  const [expandedPublisherId, setExpandedPublisherId] = useState<string | null>(null);
  const [sentMonthlyPubIds, setSentMonthlyPubIds] = useState<Set<string>>(new Set());

  // Map publishers
  const publishersMap = useMemo(() => {
    const map = new Map<string, Publisher>();
    publishers.forEach((p) => map.set(p.id, p));
    return map;
  }, [publishers]);

  // Meses disponibles en las semanas cargadas
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    weeks.forEach((w) => {
      if (w.weekStartDate) set.add(w.weekStartDate.slice(0, 7));
      if (w.midweek?.date) set.add(w.midweek.date.slice(0, 7));
      if (w.weekend?.date) set.add(w.weekend.date.slice(0, 7));
    });
    if (selectedMonthKey) set.add(selectedMonthKey);
    return Array.from(set).sort();
  }, [weeks, selectedMonthKey]);

  // Extract all assignments for this week (Modo Semanal)
  const allAssignments = useMemo(() => {
    return extractWeekAssignments(week, publishersMap);
  }, [week, publishersMap]);

  // Filtered assignments (Modo Semanal)
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter((item) => {
      if (meetingFilter !== 'todas' && item.meetingType !== meetingFilter) return false;
      if (statusFilter === 'pendientes' && item.status !== 'pendiente') return false;
      if (statusFilter === 'confirmadas' && item.status !== 'confirmada') return false;
      if (statusFilter === 'rechazadas' && item.status !== 'rechazada') return false;
      return true;
    });
  }, [allAssignments, meetingFilter, statusFilter]);

  // Extract unified monthly bundles per publisher (Modo Mensual Unificado)
  const monthlyBundles = useMemo(() => {
    return extractAllPublishersMonthlyBundles(
      {
        publishers,
        publishersMap,
        weeks,
        settings,
        preachingGroups,
        customDuties,
        cartShifts,
        cartLocations,
        outgoingSpeakers,
        fieldServiceMeetings,
        circuitVisit,
      },
      selectedMonthKey
    );
  }, [
    publishers,
    publishersMap,
    weeks,
    settings,
    preachingGroups,
    customDuties,
    cartShifts,
    cartLocations,
    outgoingSpeakers,
    fieldServiceMeetings,
    circuitVisit,
    selectedMonthKey,
  ]);

  const filteredMonthlyBundles = useMemo(() => {
    const q = publisherSearch.trim().toLowerCase();
    if (!q) return monthlyBundles;
    return monthlyBundles.filter((b) =>
      b.publisher.name.toLowerCase().includes(q)
    );
  }, [monthlyBundles, publisherSearch]);

  // Helper to get lesson title
  const getLessonTitle = (lessonNum?: number) => {
    if (!lessonNum) return undefined;
    const lesson = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum);
    return lesson?.title;
  };

  // Build message for an entry
  const getMessageForEntry = (entry: WeeklyAssignmentEntry) => {
    return createAssignmentWhatsAppMessage(
      entry.publisher,
      week,
      entry.roleTitle,
      entry.meetingType,
      entry.meetingDate,
      {
        isReminder: isReminderMode,
        assistantName: entry.assistant?.name,
        room: entry.room,
        timeMinutes: entry.timeMinutes,
        lessonNumber: entry.lessonNumber,
        lessonTitle: getLessonTitle(entry.lessonNumber),
        congregationName: settings.congregationName,
        assignmentPath: entry.assignmentPath,
      }
    );
  };

  const handleSendSingle = (entry: WeeklyAssignmentEntry) => {
    const message = getMessageForEntry(entry);
    openWhatsAppLink(entry.publisher.phone || '', message);
    setSentItemIds((prev) => new Set(prev).add(entry.id));
  };

  const handleCopySingle = (entry: WeeklyAssignmentEntry) => {
    const message = getMessageForEntry(entry);
    navigator.clipboard.writeText(message);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    if (dispatchMode === 'mensual_unificado') {
      const combined = filteredMonthlyBundles
        .map((bundle, idx) => {
          const msg = formatUnifiedMonthlyWhatsAppMessage(
            bundle.publisher,
            selectedMonthKey,
            bundle.assignments,
            settings.congregationName
          );
          return `══════ Hermano(a) ${idx + 1}: ${bundle.publisher.name} (${bundle.assignments.length} asignaciones) ══════\n${msg}\n`;
        })
        .join('\n\n');
      navigator.clipboard.writeText(combined);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2500);
      return;
    }

    const combined = filteredAssignments
      .map((entry, idx) => {
        const msg = getMessageForEntry(entry);
        return `══════ Asignación ${idx + 1}: ${entry.publisher.name} (${entry.roleTitle}) ══════\n${msg}\n`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(combined);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  const handleSendUnifiedBundle = (bundle: PublisherMonthlyBundle) => {
    const msg = formatUnifiedMonthlyWhatsAppMessage(
      bundle.publisher,
      selectedMonthKey,
      bundle.assignments,
      settings.congregationName
    );
    openWhatsAppLink(bundle.publisher.phone || '', msg);
    setSentMonthlyPubIds((prev) => new Set(prev).add(bundle.publisher.id));
  };

  const handleCopyUnifiedBundle = (bundle: PublisherMonthlyBundle) => {
    const msg = formatUnifiedMonthlyWhatsAppMessage(
      bundle.publisher,
      selectedMonthKey,
      bundle.assignments,
      settings.congregationName
    );
    navigator.clipboard.writeText(msg);
    setCopiedId(`bundle-${bundle.publisher.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const totalCount = allAssignments.length;
  const sentCount = sentItemIds.size;
  const confirmedCount = allAssignments.filter((a) => a.status === 'confirmada').length;
  const pendingCount = allAssignments.filter((a) => a.status === 'pendiente').length;
  const rejectedCount = allAssignments.filter((a) => a.status === 'rechazada').length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Centro de Notificaciones y Hoja Unificada por WhatsApp"
        className="relative w-full max-w-4xl kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[92dvh] pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Bottom Sheet Handle */}
        <div
          onClick={onClose}
          className="sm:hidden w-full pt-2.5 pb-0.5 flex justify-center items-center cursor-pointer shrink-0 bg-emerald-50/70 dark:bg-[#18181F]"
        >
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-zinc-200 dark:border-[#27272A] bg-linear-to-r from-emerald-50 via-teal-50 to-white dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="kg-glow-badge w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Hoja Unificada + WhatsApp
                </span>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium">
                  {dispatchMode === 'mensual_unificado'
                    ? `Mes: ${formatSpanishMonthLabel(selectedMonthKey)}`
                    : `Semana ${week.weekStartDate} al ${week.weekEndDate}`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                Envío de Asignaciones, Resumen Mensual y Calendario (.ics)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar recordatorios de WhatsApp"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo Principal: Resumen Mensual Unificado vs Por Asignación Individual */}
        <div className="px-4 sm:px-5 py-2.5 bg-zinc-100/80 dark:bg-[#18181F]/70 border-b border-zinc-200 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-2xs">
            <button
              type="button"
              onClick={() => setDispatchMode('mensual_unificado')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dispatchMode === 'mensual_unificado'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-[#D4D4D8] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Resumen Único del Mes por Hermano</span>
            </button>
            <button
              type="button"
              onClick={() => setDispatchMode('semanal')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dispatchMode === 'semanal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-[#D4D4D8] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Parte Individual (Semana Actual)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-colors cursor-pointer"
          >
            {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{allCopied ? '¡Todos Copiados!' : 'Copiar Todos'}</span>
          </button>
        </div>

        {/* MODO 1: RESUMEN MENSUAL UNIFICADO POR HERMANO */}
        {dispatchMode === 'mensual_unificado' ? (
          <>
            {/* Barra de Filtros del Mes */}
            <div className="px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/60 dark:bg-[#121216]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="font-bold text-zinc-700 dark:text-[#D4D4D8]">Mes:</label>
                <select
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] font-bold text-zinc-800 dark:text-white focus:outline-hidden"
                >
                  {availableMonths.map((mKey) => (
                    <option key={mKey} value={mKey}>
                      {formatSpanishMonthLabel(mKey)}
                    </option>
                  ))}
                </select>

                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                  {filteredMonthlyBundles.length} hermanos con asignaciones este mes
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold">
                  {sentMonthlyPubIds.size} resúmenes enviados
                </span>
              </div>

              <div className="relative min-w-[210px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={publisherSearch}
                  onChange={(e) => setPublisherSearch(e.target.value)}
                  placeholder="Buscar hermano o hermana..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-xs text-zinc-800 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Lista de Hermanos con su Hoja Unificada del Mes */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40">
              {filteredMonthlyBundles.length > 0 ? (
                filteredMonthlyBundles.map((bundle) => {
                  const isSent = sentMonthlyPubIds.has(bundle.publisher.id);
                  const isCopied = copiedId === `bundle-${bundle.publisher.id}`;
                  const isExpanded = expandedPublisherId === bundle.publisher.id;
                  const hasPhone = Boolean(bundle.publisher.phone);

                  return (
                    <div
                      key={bundle.publisher.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isSent
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] shadow-2xs'
                      }`}
                    >
                      <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                              {bundle.publisher.name}
                            </h4>
                            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                              {hasPhone ? bundle.publisher.phone : '⚠️ Sin teléfono'}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                              {bundle.assignments.length}{' '}
                              {bundle.assignments.length === 1 ? 'asignación' : 'asignaciones'} en el mes
                            </span>
                            {bundle.familySharedDaysCount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Coincide con familiar ({bundle.familySharedDaysCount}x)
                              </span>
                            )}
                            {isSent && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Resumen Enviado
                              </span>
                            )}
                          </div>

                          {/* Desglose rápido por categoría */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                            {bundle.countsByCategory.vym > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 font-semibold">
                                📖 {bundle.countsByCategory.vym} Vida y Min.
                              </span>
                            )}
                            {bundle.countsByCategory.fin_de_semana > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-semibold">
                                🏛️ {bundle.countsByCategory.fin_de_semana} Fin de Semana
                              </span>
                            )}
                            {bundle.countsByCategory.deberes > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] font-semibold">
                                🎧 {bundle.countsByCategory.deberes} Deberes/Audio/Acomodador
                              </span>
                            )}
                            {bundle.countsByCategory.limpieza > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold">
                                🧹 {bundle.countsByCategory.limpieza} Limpieza
                              </span>
                            )}
                            {bundle.countsByCategory.carritos > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                                🛒 {bundle.countsByCategory.carritos} Carritos
                              </span>
                            )}
                            {bundle.countsByCategory.hospitalidad > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold">
                                🍽️ {bundle.countsByCategory.hospitalidad} Hospitalidad
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de Acción Unificados */}
                        <div className="flex items-center gap-1.5 flex-wrap self-end lg:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPublisherId(isExpanded ? null : bundle.publisher.id)
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ver lista detallada del mes"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span>{isExpanded ? 'Ocultar' : 'Ver Hoja'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              downloadPublisherUnifiedIcs(
                                bundle.publisher,
                                selectedMonthKey,
                                bundle.assignments,
                                settings
                              )
                            }
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] transition-colors cursor-pointer"
                            title="Descargar Calendario .ics del mes para este hermano"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              printPublisherUnifiedMonthlySheet(
                                bundle.publisher,
                                selectedMonthKey,
                                bundle.assignments,
                                settings
                              )
                            }
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] transition-colors cursor-pointer"
                            title="Imprimir Hoja Personal del Mes"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyUnifiedBundle(bundle)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Copiar el resumen mensual para WhatsApp"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendUnifiedBundle(bundle)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            title="Enviar un único mensaje de WhatsApp con todas sus asignaciones del mes"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSent ? 'Reenviar Mes' : 'Enviar 1 WhatsApp Unificado'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Vista previa desplegable de todas las asignaciones del hermano en el mes */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#18181F]/50 border-t border-zinc-100 dark:border-[#27272A] space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {bundle.assignments.map((asig) => (
                              <div
                                key={asig.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200/80 dark:border-[#27272A]/80 text-xs space-y-0.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                    📅 {formatShortSpanishDate(asig.date)} • {asig.time}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-md bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8]">
                                    {asig.categoryLabel}
                                  </span>
                                </div>
                                <p className="font-bold text-zinc-900 dark:text-white">
                                  {asig.title}
                                </p>
                                {(asig.partnerName || asig.room || asig.subtitle) && (
                                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                                    {[
                                      asig.room
                                        ? asig.room === 'auxiliar'
                                          ? 'Sala Auxiliar'
                                          : 'Sala Principal'
                                        : null,
                                      asig.partnerName,
                                      asig.subtitle,
                                    ]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </p>
                                )}
                                {asig.familyAssignedSameDay &&
                                  asig.familyAssignedSameDay.length > 0 && (
                                    <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                                      👨‍👩‍👧‍👦 Familiar hoy: {asig.familyAssignedSameDay.join(', ')}
                                    </p>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-[#E4E4E7]">
                    No se encontraron asignaciones para este mes
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Selecciona otro mes o asigna partes en el programa mensual.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* MODO 2: POR ASIGNACIÓN INDIVIDUAL (SEMANA ACTUAL) */
          <>
            {/* Toolbar: Stats & Mode toggle */}
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-[#27272A] bg-zinc-50/60 dark:bg-[#121216]/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] font-bold text-zinc-800 dark:text-[#E4E4E7] shadow-2xs">
                  {totalCount} partes totales
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {sentCount} enviados en sesión
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">
                  {confirmedCount} confirmadas
                </span>
                {rejectedCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold animate-pulse">
                    {rejectedCount} reemplazo solicitado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-[#A1A1AA] font-semibold">
                  Tipo de mensaje:
                </span>
                <div className="inline-flex p-0.5 bg-zinc-200/80 dark:bg-[#18181F] rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsReminderMode(false)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      !isReminderMode
                        ? 'bg-white dark:bg-[#121216] text-zinc-900 dark:text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900'
                    }`}
                  >
                    Nueva Asignación
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReminderMode(true)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      isReminderMode
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900'
                    }`}
                  >
                    Recordatorio
                  </button>
                </div>
              </div>
            </div>

            {/* Filters row */}
            <div className="px-5 py-2.5 border-b border-zinc-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <select
                  value={meetingFilter}
                  onChange={(e) => setMeetingFilter(e.target.value as any)}
                  aria-label="Filtrar por tipo de reunión"
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] font-medium text-zinc-700 dark:text-[#E4E4E7] focus:outline-hidden"
                >
                  <option value="todas">Todas las reuniones</option>
                  <option value="midweek">Entre semana (Vida y Min.)</option>
                  <option value="weekend">Fin de semana (Pública / Atalaya)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  aria-label="Filtrar por estado de confirmación"
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] font-medium text-zinc-700 dark:text-[#E4E4E7] focus:outline-hidden"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendientes">Pendientes ({pendingCount})</option>
                  <option value="confirmadas">Confirmadas ({confirmedCount})</option>
                  <option value="rechazadas">Reemplazo solicitado ({rejectedCount})</option>
                </select>
              </div>
            </div>

            {/* Assignments List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-950/40">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((entry) => {
                  const isSent = sentItemIds.has(entry.id);
                  const isCopied = copiedId === entry.id;
                  const hasPhone = Boolean(entry.publisher.phone);

                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isSent
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : entry.status === 'rechazada'
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8]">
                              {entry.section}
                            </span>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                entry.status === 'confirmada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.status === 'rechazada'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {entry.status === 'confirmada'
                                ? 'Confirmada'
                                : entry.status === 'rechazada'
                                ? 'Reemplazo solicitado'
                                : 'Pendiente'}
                            </span>

                            {isSent && (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" /> Enviado
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {entry.publisher.name}
                            </h4>
                            <span className="text-xs text-zinc-500 font-medium">
                              {hasPhone ? entry.publisher.phone : '⚠️ Sin número de teléfono'}
                            </span>
                          </div>

                          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold mt-0.5">
                            {entry.roleTitle}
                            {entry.room === 'auxiliar' && ' (Sala Auxiliar)'}
                            {entry.assistant && ` • Ayudante: ${entry.assistant.name}`}
                            {entry.lessonNumber && ` • Lección #${entry.lessonNumber}`}
                          </p>

                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            📅 {entry.meetingDate} •{' '}
                            {entry.meetingType === 'midweek' ? 'Entre semana' : 'Fin de semana'}
                            {entry.timeMinutes ? ` • ${entry.timeMinutes} minutos` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleCopySingle(entry)}
                            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{isCopied ? 'Copiado' : 'Copiar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendSingle(entry)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                              isSent
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSent ? 'Reenviar' : 'Enviar WhatsApp'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-[#E4E4E7]">
                    No hay asignaciones para los filtros seleccionados
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Cambia el filtro de reunión o estado para ver a los hermanos participantes.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer info notice */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-[#121216] border-t border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              El <strong>Resumen Único del Mes</strong> combina Vida y Ministerio, Fin de Semana, Audio/Micrófonos, Limpieza y Carritos en 1 solo envío.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 transition-colors ml-auto cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
