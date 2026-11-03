// src/components/InformeSucursalS1Tab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  calculateS1Metrics,
  generateS1TextSummary,
  openJwHubPortal,
  S1CalculatedMetrics,
} from '../utils/s1Helper';
import { getAvailableServiceYears, getServiceYearMonths } from '../utils/s21Helper';
import {
  FileBarChart,
  Printer,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  Users,
  Award,
  BookOpen,
  Send,
  Edit3,
  X,
  Save,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useToast } from '../context/ToastContext';

export const InformeSucursalS1Tab: React.FC = () => {
  const { confirm } = useModal();
  const { showToast } = useToast();
  const {
    weeks,
    publishers,
    monthlyReports,
    auxPioneerRequests,
    settings,
    branchReportsS1,
    updateBranchReportS1,
    markBranchReportS1Status,
  } = useCongregation();

  // Selected Month (default to current year-month, e.g. '2026-10')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'resumen' | 'asistencia' | 'predicacion' | 'pendientes'>('resumen');

  // Available service years and months
  const availableYears = useMemo(() => getAvailableServiceYears(), []);
  const allMonthsList = useMemo(() => {
    const list: Array<{ monthKey: string; label: string }> = [];
    availableYears.forEach((sy) => {
      const ms = getServiceYearMonths(sy);
      ms.forEach((m) => {
        list.push({
          monthKey: m.monthKey,
          label: `${m.monthName} ${m.year}`,
        });
      });
    });
    return list;
  }, [availableYears]);

  // Current S-1 record in store
  const currentS1Record = useMemo(() => {
    return branchReportsS1.find((r) => r.monthKey === selectedMonth);
  }, [branchReportsS1, selectedMonth]);

  // Calculated metrics
  const metrics: S1CalculatedMetrics = useMemo(() => {
    return calculateS1Metrics(
      selectedMonth,
      weeks,
      publishers,
      monthlyReports,
      auxPioneerRequests,
      settings,
      currentS1Record
    );
  }, [selectedMonth, weeks, publishers, monthlyReports, auxPioneerRequests, settings, currentS1Record]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const idx = allMonthsList.findIndex((m) => m.monthKey === selectedMonth);
    if (idx > 0) {
      setSelectedMonth(allMonthsList[idx - 1].monthKey);
    }
  };

  const handleNextMonth = () => {
    const idx = allMonthsList.findIndex((m) => m.monthKey === selectedMonth);
    if (idx >= 0 && idx < allMonthsList.length - 1) {
      setSelectedMonth(allMonthsList[idx + 1].monthKey);
    }
  };

  // Copy textual summary
  const handleCopySummary = async () => {
    const text = generateS1TextSummary(metrics);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    } catch {
      // Fallback
      showToast('Resumen copiado al portapapeles', 'success');
    }
  };

  // Submission modal state
  const [submitForm, setSubmitForm] = useState({
    submittedBy: settings.coordinatorName || 'Secretario de Congregación',
    confirmationNumber: currentS1Record?.confirmationNumber || '',
    notes: currentS1Record?.notes || '',
  });

  const handleOpenSubmitModal = () => {
    setSubmitForm({
      submittedBy: currentS1Record?.submittedBy || settings.coordinatorName || 'Secretario de Congregación',
      confirmationNumber: currentS1Record?.confirmationNumber || '',
      notes: currentS1Record?.notes || '',
    });
    setShowSubmissionModal(true);
  };

  const handleConfirmSubmission = () => {
    markBranchReportS1Status(
      selectedMonth,
      'enviado',
      submitForm.submittedBy,
      submitForm.confirmationNumber,
      submitForm.notes
    );
    setShowSubmissionModal(false);
  };

  const handleRevertSubmission = async () => {
    const confirmed = await confirm({
      title: 'Cambiar estado de informe',
      message: '¿Deseas cambiar el estado a "Pendiente de Envío" para este mes?',
      confirmText: 'Cambiar a pendiente',
      cancelText: 'Cancelar',
      type: 'warning',
    });
    if (confirmed) {
      markBranchReportS1Status(
        selectedMonth,
        'pendiente',
        submitForm.submittedBy,
        submitForm.confirmationNumber,
        submitForm.notes
      );
      setShowSubmissionModal(false);
      showToast('Estado cambiado a Pendiente de Envío', 'info');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* Barra Unificada de Sub-pestañas, Mes y Acciones S-1 */}
      <div className="print:hidden kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500/8 dark:bg-indigo-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* SUBTABS NAVIGATION - Apple Segmented Control */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1 bg-zinc-100/80 dark:bg-[#18181F] p-1.5 rounded-2xl border border-zinc-200/60 dark:border-white/6 backdrop-blur-sm">
            <button
              onClick={() => setActiveSubTab('resumen')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                activeSubTab === 'resumen'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <span className="truncate">Formulario S-1</span>
            </button>
            <button
              onClick={() => setActiveSubTab('asistencia')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                activeSubTab === 'asistencia'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <span className="truncate">Asistencia (S-88)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('predicacion')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                activeSubTab === 'predicacion'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <span className="truncate">Ministerio</span>
            </button>
            <button
              onClick={() => setActiveSubTab('pendientes')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'pendientes'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <span className="truncate">Pendientes</span>
              {metrics.missingPublishers.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 font-mono tabular-nums ${
                  activeSubTab === 'pendientes'
                    ? 'bg-white text-indigo-700'
                    : 'bg-amber-500 text-white'
                }`}>
                  {metrics.missingPublishers.length}
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold rounded-2xl bg-white/70 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-700 dark:text-[#F4F4F5] transition-all cursor-pointer active:scale-95"
              title="Copiar resumen para WhatsApp o Ancianos"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 truncate">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">Copiar</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold rounded-2xl bg-white/70 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-zinc-700 dark:text-[#F4F4F5] transition-all cursor-pointer active:scale-95"
              title="Imprimir Formulario S-1 Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Imprimir</span>
            </button>

            <button
              onClick={openJwHubPortal}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/30 transition-all cursor-pointer active:scale-95"
              title="Abrir portal oficial hub.jw.org en nueva pestaña"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">JW HUB</span>
            </button>
          </div>
        </div>

        {/* Month Picker & Submission Status Row */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-100/80 dark:border-white/6">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-[#F4F4F5] transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2 pr-8 text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono tabular-nums cursor-pointer"
              >
                {allMonthsList.map((m) => (
                  <option key={m.monthKey} value={m.monthKey} className="bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]">
                    {m.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-[#F4F4F5] transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] hidden md:inline ml-1">
              Año teocrático <strong className="text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.serviceYear}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {metrics.submissionStatus === 'enviado' ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Enviado a Sucursal</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Pendiente de Envío</span>
              </div>
            )}

            <button
              onClick={handleOpenSubmitModal}
              className="px-3.5 py-1.5 text-xs font-bold rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200/80 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{metrics.submissionStatus === 'enviado' ? 'Detalles' : 'Marcar Envío'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI RIBBON CARDS */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Publicadores que informaron */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] text-xs font-bold">
            <span>Publicadores</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] tracking-tight font-mono tabular-nums">
              {metrics.totalPublishersReporting}
              <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-normal font-mono tabular-nums"> / {metrics.totalActivePublishers}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-zinc-200/70 dark:bg-white/6 overflow-hidden border border-zinc-200/50 dark:border-white/6">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${Math.min(100, metrics.completionPercentage)}%` }}
                />
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono tabular-nums">{metrics.completionPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Promedio Entre Semana */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] text-xs font-bold">
            <span>Entre Semana</span>
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight font-mono tabular-nums">
              {metrics.midweekAverage}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
              <span className="font-mono tabular-nums">{metrics.midweekMeetingsCount}</span> reuniones • Prom. S-88
            </span>
          </div>
        </div>

        {/* Card 3: Promedio Fin de Semana */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-emerald-500/8 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] text-xs font-bold">
            <span>Fin de Semana</span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono tabular-nums">
              {metrics.weekendAverage}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
              <span className="font-mono tabular-nums">{metrics.weekendMeetingsCount}</span> reuniones • Prom. S-88
            </span>
          </div>
        </div>

        {/* Card 4: Promedio Combinado */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] text-xs font-bold">
            <span>Prom. General</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono tabular-nums">
              {metrics.combinedAverage}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
              Máx: <strong className="text-zinc-700 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.highestAttendance}</strong> asistentes
            </span>
          </div>
        </div>

        {/* Card 5: Horas Totales */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-purple-500/8 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] text-xs font-bold">
            <span>Horas Totales</span>
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight font-mono tabular-nums">
              {metrics.totalCongregationHours}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
              <span className="font-mono tabular-nums">{metrics.pioneersReporting + metrics.auxPioneersReporting}</span> precursores
            </span>
          </div>
        </div>

        {/* Card 6: Cursos Bíblicos */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-teal-500/8 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-500 dark:text-[#A1A1AA] text-xs font-bold">
            <span>Cursos Bíblicos</span>
            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 tracking-tight font-mono tabular-nums">
              {metrics.totalBibleStudies}
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Estudios informados</span>
          </div>
        </div>
      </div>

      {/* VIEW CONTENT: RESUMEN / OFICIAL */}
      {activeSubTab === 'resumen' && (
        <div className="space-y-6">
          {/* Main S-1 Official Preview Box */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-md">
            {/* JW Official Banner */}
            <div className="bg-white/60 dark:bg-white/4 border-b border-zinc-200/80 dark:border-white/8 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-sm">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold tracking-wider uppercase mb-1.5">
                  <FileBarChart className="w-3.5 h-3.5" />
                  Formulario Oficial S-1-S
                </div>
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-[#F4F4F5]">
                  Informe de la Congregación a la Sucursal
                </h2>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                  {metrics.congregationName} (#{metrics.congregationNumber}) • Circuito {metrics.circuitNumber} • {metrics.monthNameFull} <span className="font-mono tabular-nums">{metrics.year}</span>
                </p>
              </div>

              <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Coordinador / Secretario:</span>
                <span className="text-sm font-bold text-zinc-800 dark:text-[#F4F4F5]">{metrics.coordinatorName}</span>
                <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                  Año de servicio: <strong className="text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.serviceYear}</strong>
                </span>
              </div>
            </div>

            {/* TABLA 1: ASISTENCIA A LAS REUNIONES (S-88) */}
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-[#27272A] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  1. Asistencia a las Reuniones (Formulario S-88)
                </h3>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] hidden sm:inline">Datos consolidados del mes</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#27272A]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-[#18181F] border-b border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA] font-bold">
                      <th className="py-3 px-4">Tipo de Reunión</th>
                      <th className="py-3 px-4 text-center">Reuniones</th>
                      <th className="py-3 px-4 text-center">Total</th>
                      <th className="py-3 px-4 text-center">Presencial</th>
                      <th className="py-3 px-4 text-center">Zoom</th>
                      <th className="py-3 px-4 text-center font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40">
                        Promedio S-1
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A] text-zinc-700 dark:text-[#F4F4F5]">
                    <tr className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Reunión Entre Semana <span className="text-zinc-500 dark:text-[#A1A1AA] text-xs block font-normal">(Vida y Ministerio Cristianos)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                        {metrics.midweekMeetingsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                        {metrics.midweekTotalAttendance}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.midweekInPersonAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.midweekZoomAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-indigo-600 dark:text-indigo-400 text-base bg-indigo-50/40 dark:bg-indigo-950/20 font-mono tabular-nums">
                        {metrics.midweekAverage}
                      </td>
                    </tr>
                    <tr className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Reunión Fin de Semana <span className="text-zinc-500 dark:text-[#A1A1AA] text-xs block font-normal">(Discurso Público y La Atalaya)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                        {metrics.weekendMeetingsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                        {metrics.weekendTotalAttendance}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.weekendInPersonAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.weekendZoomAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-600 dark:text-emerald-400 text-base bg-emerald-50/40 dark:bg-emerald-950/20 font-mono tabular-nums">
                        {metrics.weekendAverage}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-50 dark:bg-[#18181F] font-bold text-zinc-700 dark:text-[#F4F4F5] border-t border-zinc-200 dark:border-[#27272A]">
                      <td className="py-3 px-4">Totales y Promedio General</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">{metrics.totalMeetingsHeld}</td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums">{metrics.totalAttendanceCumulative}</td>
                      <td className="py-3 px-4 text-center" colSpan={2}>
                        Máxima Asistencia: <strong className="text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.highestAttendance}</strong>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-zinc-900 dark:text-[#F4F4F5] text-base bg-zinc-100 dark:bg-[#121216] font-mono tabular-nums">
                        {metrics.combinedAverage}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TABLA 2: ACTIVIDAD EN EL MINISTERIO DEL CAMPO (S-4 / S-1) */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  2. Actividad en el Ministerio del Campo (S-4 / S-1)
                </h3>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  <strong className="text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.totalPublishersReporting}</strong> de{' '}
                  <strong className="text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.totalActivePublishers}</strong> publicadores informaron (
                  <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{metrics.completionPercentage}%</span>)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#27272A]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-[#18181F] border-b border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA] font-bold">
                      <th className="py-3 px-4">Clasificación Teocrática</th>
                      <th className="py-3 px-4 text-center">Informaron</th>
                      <th className="py-3 px-4 text-center">Horas</th>
                      <th className="py-3 px-4 text-center">Promedio</th>
                      <th className="py-3 px-4 text-center">Cursos Bíblicos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A] text-zinc-700 dark:text-[#F4F4F5]">
                    <tr className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Publicadores Regulares
                        <span className="text-zinc-500 dark:text-[#A1A1AA] text-xs block font-normal">Bautizados y no bautizados que participaron</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                        {metrics.regularPublishersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.regularPublishersHours > 0 ? `${metrics.regularPublishersHours} hrs` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">—</td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                        {metrics.regularPublishersStudies}
                      </td>
                    </tr>

                    <tr className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Precursores Auxiliares
                        <span className="text-zinc-500 dark:text-[#A1A1AA] text-xs block font-normal">
                          <span className="font-mono tabular-nums">{metrics.auxPioneerTarget30}</span> de 30 hrs •{' '}
                          <span className="font-mono tabular-nums">{metrics.auxPioneerTarget15}</span> de 15 hrs (aprobadas)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                        {metrics.auxPioneersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                        {metrics.auxPioneerHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.auxPioneerAvgHours} hrs/prec
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                        {metrics.auxPioneerStudies}
                      </td>
                    </tr>

                    <tr className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Precursores Regulares
                        <span className="text-zinc-500 dark:text-[#A1A1AA] text-xs block font-normal">Asignados formalmente en la congregación</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        {metrics.pioneersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                        {metrics.pioneerHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                        {metrics.pioneerAvgHours} hrs/prec
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                        {metrics.pioneerStudies}
                      </td>
                    </tr>

                    {metrics.specialPioneersReporting > 0 && (
                      <tr className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                          Precursores Especiales / Misioneros
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-purple-600 dark:text-purple-400 font-mono tabular-nums">
                          {metrics.specialPioneersReporting}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold font-mono tabular-nums">
                          {metrics.specialPioneerHours} hrs
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-400">—</td>
                        <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                          {metrics.specialPioneerStudies}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-50 dark:bg-[#18181F] font-bold text-zinc-800 dark:text-[#F4F4F5] border-t border-zinc-200 dark:border-[#27272A]">
                      <td className="py-3.5 px-4 text-zinc-900 dark:text-[#F4F4F5]">TOTAL CONSOLIDADO S-1</td>
                      <td className="py-3.5 px-4 text-center font-black text-base text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        {metrics.totalPublishersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-base text-purple-600 dark:text-purple-400 font-mono tabular-nums">
                        {metrics.totalCongregationHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">—</td>
                      <td className="py-3.5 px-4 text-center font-black text-base text-teal-600 dark:text-teal-400 font-mono tabular-nums">
                        {metrics.totalBibleStudies}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* OBSERVACIONES Y ESTADO DE ENVÍO */}
            <div className="p-4 sm:p-6 bg-zinc-50/80 dark:bg-[#18181F]/50 border-t border-zinc-200 dark:border-[#27272A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-600 dark:text-[#A1A1AA]">Estado en JW Hub:</span>
                  {metrics.submissionStatus === 'enviado' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Enviado Oficialmente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pendiente de Envío
                    </span>
                  )}
                </div>
                {currentS1Record?.submittedAt && (
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                    Fecha de envío: <span className="font-mono tabular-nums">{new Date(currentS1Record.submittedAt).toLocaleDateString()}</span> • Por: {currentS1Record.submittedBy || 'Secretario'}
                  </p>
                )}
                {currentS1Record?.notes && (
                  <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] italic">
                    "{currentS1Record.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={handleOpenSubmitModal}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  {metrics.submissionStatus === 'enviado' ? 'Editar Envío' : 'Registrar Envío en JW Hub'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CONTENT: ASISTENCIA A REUNIONES (S-88) */}
      {activeSubTab === 'asistencia' && (
        <div className="space-y-6">
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">Desglose Semanal de Asistencia • {metrics.monthNameFull} <span className="font-mono tabular-nums">{metrics.year}</span></h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Conteo por reunión, asistencia presencial en el salón y conexiones vía Zoom</p>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.meetingSessions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 dark:text-[#A1A1AA] bg-white/60 dark:bg-white/4 rounded-2xl border border-zinc-200/60 dark:border-white/8">
                  No hay semanas registradas para el mes seleccionado.
                </div>
              ) : (
                metrics.meetingSessions.map((session, idx) => (
                  <div
                    key={session.weekId || idx}
                    className="p-4 rounded-2xl bg-white/70 dark:bg-white/4 border border-zinc-200/70 dark:border-white/8 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm"
                  >
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block font-mono tabular-nums">Semana {idx + 1}</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Inicia: <span className="font-mono tabular-nums">{session.startDate}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-white dark:bg-[#121216] p-2.5 rounded-xl border border-zinc-200/70 dark:border-white/8 text-center">
                        <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">Entre Semana Salón</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{session.midweekInPerson}</span>
                      </div>
                      <div className="bg-white dark:bg-[#121216] p-2.5 rounded-xl border border-zinc-200/70 dark:border-white/8 text-center">
                        <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">Entre Semana Zoom</span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{session.midweekZoom}</span>
                      </div>
                      <div className="bg-white dark:bg-[#121216] p-2.5 rounded-xl border border-zinc-200/70 dark:border-white/8 text-center">
                        <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">Fin de Semana Salón</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{session.weekendInPerson}</span>
                      </div>
                      <div className="bg-white dark:bg-[#121216] p-2.5 rounded-xl border border-zinc-200/70 dark:border-white/8 text-center">
                        <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">Fin de Semana Zoom</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{session.weekendZoom}</span>
                      </div>
                    </div>

                    <div className="text-right flex sm:block items-center justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200/60 dark:border-white/8">
                      <span className="text-xs sm:text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">Total Semana</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                        {session.midweekTotal + session.weekendTotal}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW CONTENT: MINISTERIO Y PRECURSORES */}
      {activeSubTab === 'predicacion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Precursores Auxiliares */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100/80 dark:border-white/6 pb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Precursores Auxiliares (<span className="font-mono tabular-nums">{metrics.auxPioneersReporting}</span>)
                </h3>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Solicitudes aprobadas e informe del mes</span>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-1 rounded-full font-mono tabular-nums">
                {metrics.auxPioneerHours} hrs totales
              </span>
            </div>

            {metrics.auxPioneerList.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 dark:text-[#A1A1AA] text-xs bg-white/60 dark:bg-white/4 rounded-2xl border border-zinc-200/70 dark:border-white/8">
                No hay precursores auxiliares registrados para este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.auxPioneerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-white/70 dark:bg-white/4 border border-zinc-200/70 dark:border-white/8 flex items-center justify-between text-xs backdrop-blur-sm"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">{p.name}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Grupo {p.groupNumber || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm block font-mono tabular-nums">{p.hours} hrs</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold font-mono tabular-nums">{p.bibleStudies} cursos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Precursores Regulares */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100/80 dark:border-white/6 pb-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Precursores Regulares (<span className="font-mono tabular-nums">{metrics.pioneersReporting}</span>)
                </h3>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Asignados en la congregación</span>
              </div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 px-3 py-1 rounded-full font-mono tabular-nums">
                {metrics.pioneerHours} hrs totales
              </span>
            </div>

            {metrics.pioneerList.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 dark:text-[#A1A1AA] text-xs bg-white/60 dark:bg-white/4 rounded-2xl border border-zinc-200/70 dark:border-white/8">
                No hay precursores regulares registrados con informe este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.pioneerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-white/70 dark:bg-white/4 border border-zinc-200/70 dark:border-white/8 flex items-center justify-between text-xs backdrop-blur-sm"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">{p.name}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">Grupo {p.groupNumber || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm block font-mono tabular-nums">{p.hours} hrs</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold font-mono tabular-nums">{p.bibleStudies} cursos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW CONTENT: PENDIENTES DE INFORME */}
      {activeSubTab === 'pendientes' && (
        <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100/80 dark:border-white/6 pb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Publicadores Pendientes de Informe (<span className="font-mono tabular-nums">{metrics.missingPublishers.length}</span>)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Hermanos activos que aún no han entregado su informe de predicación para {metrics.monthNameFull} <span className="font-mono tabular-nums">{metrics.year}</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-1 rounded-full self-start sm:self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Faltan por informar antes de cerrar el S-1
            </span>
          </div>

          {metrics.missingPublishers.length === 0 ? (
            <div className="p-8 text-center text-zinc-800 dark:text-zinc-200 bg-white/60 dark:bg-white/4 rounded-2xl border border-zinc-200/70 dark:border-white/8 shadow-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">¡Todos los publicadores activos han informado!</p>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">El 100% de la congregación está contabilizado para el Formulario S-1.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.missingPublishers.map((pub) => (
                <div
                  key={pub.id}
                  className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/4 border border-zinc-200/70 dark:border-white/8 flex items-center justify-between text-xs backdrop-blur-sm"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">{pub.name}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                      Grupo {pub.groupNumber || '—'} • {pub.privilege || 'Publicador'}
                    </span>
                  </div>

                  {pub.phone && (
                    <a
                      href={`https://wa.me/${pub.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hola hermano(a) ${pub.name}, un saludo afectuoso. Recordamos enviar oportunamente su informe de servicio del mes de ${metrics.monthNameFull} para consolidar el reporte de la congregación a la sucursal (S-1). Muchas gracias.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUBMISSION DETAILS / REGISTRAR ENVÍO JW HUB */}
      {showSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200/80 dark:border-white/8 flex items-center justify-between bg-white/60 dark:bg-white/4 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">Registro de Envío a la Sucursal (JW Hub)</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Mes: {metrics.monthNameFull} <span className="font-mono tabular-nums">{metrics.year}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-white/10 text-zinc-500 dark:text-[#A1A1AA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-zinc-700 dark:text-[#F4F4F5] font-bold block mb-1">
                  Hermano responsable del envío (Secretario / Coordinador):
                </label>
                <input
                  type="text"
                  value={submitForm.submittedBy}
                  onChange={(e) => setSubmitForm({ ...submitForm, submittedBy: e.target.value })}
                  placeholder="Ej. Carlos Mendoza (Secretario)"
                  className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-zinc-700 dark:text-[#F4F4F5] font-bold block mb-1">
                  Código o Número de Recibo de JW Hub (opcional):
                </label>
                <input
                  type="text"
                  value={submitForm.confirmationNumber}
                  onChange={(e) => setSubmitForm({ ...submitForm, confirmationNumber: e.target.value })}
                  placeholder="Ej. JWHUB-202610-10582"
                  className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-xs font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-zinc-700 dark:text-[#F4F4F5] font-bold block mb-1">
                  Notas u Observaciones Teocráticas:
                </label>
                <textarea
                  rows={3}
                  value={submitForm.notes}
                  onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                  placeholder="Ej. Se incluyeron 2 publicadores que entregaron informe tardío..."
                  className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-3 text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-start gap-2 text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Al marcar como "Enviado", se registra la fecha y hora oficial. Podrás abrir JW HUB en cualquier momento para verificar o ingresar los datos.
                </span>
              </div>
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-[#18181F] border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-between">
              {metrics.submissionStatus === 'enviado' ? (
                <button
                  onClick={handleRevertSubmission}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                >
                  Revertir a Pendiente
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl hover:bg-zinc-200/70 dark:hover:bg-[#27272A] text-zinc-600 dark:text-[#A1A1AA] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSubmission}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar como Enviado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY OFFICIAL WATCHTOWER S-1 REPLICA FORM */}
      <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto font-serif">
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-xl font-bold tracking-wider uppercase">
            INFORME DE LA CONGREGACIÓN A LA SUCURSAL
          </h1>
          <p className="text-xs font-bold tracking-widest mt-1">FORMULARIO S-1-S</p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-black">
          <div>
            <p><strong>Congregación:</strong> {metrics.congregationName}</p>
            <p><strong>Número de Congregación:</strong> {metrics.congregationNumber}</p>
            <p><strong>Circuito:</strong> {metrics.circuitNumber}</p>
          </div>
          <div className="text-right">
            <p><strong>Mes de Servicio:</strong> {metrics.monthNameFull} {metrics.year}</p>
            <p><strong>Año de Servicio:</strong> {metrics.serviceYear}</p>
            <p><strong>Coordinador / Secretario:</strong> {metrics.coordinatorName}</p>
          </div>
        </div>

        {/* Print Table 1: Asistencia */}
        <div className="my-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2">
            1. ASISTENCIA A LAS REUNIONES (S-88)
          </h2>
          <table className="w-full text-xs border-collapse border border-black text-center">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-left">Reunión</th>
                <th className="border border-black p-2">Número de Reuniones</th>
                <th className="border border-black p-2">Asistencia Total</th>
                <th className="border border-black p-2">Promedio por Reunión</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 text-left font-medium">Reunión de entre semana</td>
                <td className="border border-black p-2">{metrics.midweekMeetingsCount}</td>
                <td className="border border-black p-2">{metrics.midweekTotalAttendance}</td>
                <td className="border border-black p-2 font-bold">{metrics.midweekAverage}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-left font-medium">Reunión de fin de semana</td>
                <td className="border border-black p-2">{metrics.weekendMeetingsCount}</td>
                <td className="border border-black p-2">{metrics.weekendTotalAttendance}</td>
                <td className="border border-black p-2 font-bold">{metrics.weekendAverage}</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="border border-black p-2 text-left">Promedio General Mensual</td>
                <td className="border border-black p-2">{metrics.totalMeetingsHeld}</td>
                <td className="border border-black p-2">{metrics.totalAttendanceCumulative}</td>
                <td className="border border-black p-2 text-base">{metrics.combinedAverage}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Table 2: Predicación */}
        <div className="my-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2">
            2. ACTIVIDAD EN EL MINISTERIO DEL CAMPO
          </h2>
          <table className="w-full text-xs border-collapse border border-black text-center">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-left">Clasificación</th>
                <th className="border border-black p-2">Número que Informó</th>
                <th className="border border-black p-2">Horas</th>
                <th className="border border-black p-2">Cursos Bíblicos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 text-left">Publicadores regulares</td>
                <td className="border border-black p-2">{metrics.regularPublishersReporting}</td>
                <td className="border border-black p-2">{metrics.regularPublishersHours || '—'}</td>
                <td className="border border-black p-2">{metrics.regularPublishersStudies}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-left">Precursores auxiliares</td>
                <td className="border border-black p-2">{metrics.auxPioneersReporting}</td>
                <td className="border border-black p-2">{metrics.auxPioneerHours}</td>
                <td className="border border-black p-2">{metrics.auxPioneerStudies}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-left">Precursores regulares</td>
                <td className="border border-black p-2">{metrics.pioneersReporting}</td>
                <td className="border border-black p-2">{metrics.pioneerHours}</td>
                <td className="border border-black p-2">{metrics.pioneerStudies}</td>
              </tr>
              {metrics.specialPioneersReporting > 0 && (
                <tr>
                  <td className="border border-black p-2 text-left">Precursores especiales</td>
                  <td className="border border-black p-2">{metrics.specialPioneersReporting}</td>
                  <td className="border border-black p-2">{metrics.specialPioneerHours}</td>
                  <td className="border border-black p-2">{metrics.specialPioneerStudies}</td>
                </tr>
              )}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-black p-2 text-left">TOTALES DE LA CONGREGACIÓN</td>
                <td className="border border-black p-2 text-sm">{metrics.totalPublishersReporting}</td>
                <td className="border border-black p-2 text-sm">{metrics.totalCongregationHours}</td>
                <td className="border border-black p-2 text-sm">{metrics.totalBibleStudies}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Signatures */}
        <div className="mt-12 pt-8 border-t border-black grid grid-cols-2 gap-8 text-xs text-center">
          <div>
            <div className="border-b border-black w-48 mx-auto mb-2" />
            <p className="font-bold">Secretario de la Congregación</p>
            <p className="text-gray-600 mt-1">Firma / Aprobación</p>
          </div>
          <div>
            <div className="border-b border-black w-48 mx-auto mb-2" />
            <p className="font-bold">Coordinador del Cuerpo de Ancianos</p>
            <p className="text-gray-600 mt-1">Firma / Aprobación</p>
          </div>
        </div>

        <div className="mt-8 text-[10px] text-gray-500 text-center">
          Generado automáticamente por Kongre • Archivo oficial teocrático de secretaría • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
