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

export const InformeSucursalS1Tab: React.FC = () => {
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
      alert('Resumen copiado al portapapeles');
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

  const handleRevertSubmission = () => {
    if (window.confirm('¿Deseas cambiar el estado a "Pendiente de Envío" para este mes?')) {
      markBranchReportS1Status(
        selectedMonth,
        'pendiente',
        submitForm.submittedBy,
        submitForm.confirmationNumber,
        submitForm.notes
      );
      setShowSubmissionModal(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* Barra Unificada de Sub-pestañas, Mes y Acciones S-1 */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* SUBTABS NAVIGATION - 2-column grid on mobile so nothing clips */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <button
              onClick={() => setActiveSubTab('resumen')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                activeSubTab === 'resumen'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="truncate">Formulario S-1</span>
            </button>
            <button
              onClick={() => setActiveSubTab('asistencia')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                activeSubTab === 'asistencia'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="truncate">Asistencia (S-88)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('predicacion')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                activeSubTab === 'predicacion'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="truncate">Ministerio</span>
            </button>
            <button
              onClick={() => setActiveSubTab('pendientes')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'pendientes'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="truncate">Pendientes</span>
              {metrics.missingPublishers.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
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
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
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
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
              title="Imprimir Formulario S-1 Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Imprimir</span>
            </button>

            <button
              onClick={openJwHubPortal}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Abrir portal oficial hub.jw.org en nueva pestaña"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">JW HUB</span>
            </button>
          </div>
        </div>

        {/* Month Picker & Submission Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 pr-8 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {allMonthsList.map((m) => (
                  <option key={m.monthKey} value={m.monthKey} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {m.label}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline ml-1">
              Año teocrático <strong className="text-slate-800 dark:text-slate-200">{metrics.serviceYear}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {metrics.submissionStatus === 'enviado' ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Enviado a Sucursal</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Pendiente de Envío</span>
              </div>
            )}

            <button
              onClick={handleOpenSubmitModal}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{metrics.submissionStatus === 'enviado' ? 'Detalles' : 'Marcar Envío'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI RIBBON CARDS */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Publicadores que informaron */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Publicadores</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalPublishersReporting}
              <span className="text-xs text-slate-400 font-normal"> / {metrics.totalActivePublishers}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${Math.min(100, metrics.completionPercentage)}%` }}
                />
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{metrics.completionPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Promedio Entre Semana */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Entre Semana</span>
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {metrics.midweekAverage}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {metrics.midweekMeetingsCount} reuniones • Prom. S-88
            </span>
          </div>
        </div>

        {/* Card 3: Promedio Fin de Semana */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Fin de Semana</span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {metrics.weekendAverage}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {metrics.weekendMeetingsCount} reuniones • Prom. S-88
            </span>
          </div>
        </div>

        {/* Card 4: Promedio Combinado */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Prom. General</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {metrics.combinedAverage}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Máx: <strong className="text-slate-700 dark:text-slate-200">{metrics.highestAttendance}</strong> asistentes
            </span>
          </div>
        </div>

        {/* Card 5: Horas Totales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Horas Totales</span>
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {metrics.totalCongregationHours}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {metrics.pioneersReporting + metrics.auxPioneersReporting} precursores
            </span>
          </div>
        </div>

        {/* Card 6: Cursos Bíblicos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>Cursos Bíblicos</span>
            <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
              {metrics.totalBibleStudies}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Estudios informados</span>
          </div>
        </div>
      </div>

      {/* VIEW CONTENT: RESUMEN / OFICIAL */}
      {activeSubTab === 'resumen' && (
        <div className="space-y-6">
          {/* Main S-1 Official Preview Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            {/* JW Official Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold tracking-wider uppercase mb-1.5">
                  <FileBarChart className="w-3.5 h-3.5" />
                  Formulario Oficial S-1-S
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Informe de la Congregación a la Sucursal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {metrics.congregationName} (#{metrics.congregationNumber}) • Circuito {metrics.circuitNumber} • {metrics.monthNameFull} {metrics.year}
                </p>
              </div>

              <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                <span className="text-xs text-slate-500 dark:text-slate-400">Coordinador / Secretario:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{metrics.coordinatorName}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Año de servicio: <strong className="text-slate-800 dark:text-slate-200">{metrics.serviceYear}</strong>
                </span>
              </div>
            </div>

            {/* TABLA 1: ASISTENCIA A LAS REUNIONES (S-88) */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  1. Asistencia a las Reuniones (Formulario S-88)
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Datos consolidados del mes</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        Reunión Entre Semana <span className="text-slate-500 dark:text-slate-400 text-xs block font-normal">(Vida y Ministerio Cristianos)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {metrics.midweekMeetingsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {metrics.midweekTotalAttendance}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.midweekInPersonAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.midweekZoomAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-indigo-600 dark:text-indigo-400 text-base bg-indigo-50/40 dark:bg-indigo-950/20">
                        {metrics.midweekAverage}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        Reunión Fin de Semana <span className="text-slate-500 dark:text-slate-400 text-xs block font-normal">(Discurso Público y La Atalaya)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {metrics.weekendMeetingsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {metrics.weekendTotalAttendance}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.weekendInPersonAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.weekendZoomAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-600 dark:text-emerald-400 text-base bg-emerald-50/40 dark:bg-emerald-950/20">
                        {metrics.weekendAverage}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 font-bold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 px-4">Totales y Promedio General</td>
                      <td className="py-3 px-4 text-center">{metrics.totalMeetingsHeld}</td>
                      <td className="py-3 px-4 text-center">{metrics.totalAttendanceCumulative}</td>
                      <td className="py-3 px-4 text-center" colSpan={2}>
                        Máxima Asistencia: <strong className="text-slate-900 dark:text-white">{metrics.highestAttendance}</strong>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-amber-600 dark:text-amber-400 text-base bg-amber-50/60 dark:bg-amber-950/30">
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
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {metrics.totalPublishersReporting} de {metrics.totalActivePublishers} publicadores informaron ({metrics.completionPercentage}%)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <th className="py-3 px-4">Clasificación Teocrática</th>
                      <th className="py-3 px-4 text-center">Informaron</th>
                      <th className="py-3 px-4 text-center">Horas</th>
                      <th className="py-3 px-4 text-center">Promedio</th>
                      <th className="py-3 px-4 text-center">Cursos Bíblicos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        Publicadores Regulares
                        <span className="text-slate-500 dark:text-slate-400 text-xs block font-normal">Bautizados y no bautizados que participaron</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {metrics.regularPublishersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.regularPublishersHours > 0 ? `${metrics.regularPublishersHours} hrs` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400">
                        {metrics.regularPublishersStudies}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        Precursores Auxiliares
                        <span className="text-slate-500 dark:text-slate-400 text-xs block font-normal">
                          {metrics.auxPioneerTarget30} de 30 hrs • {metrics.auxPioneerTarget15} de 15 hrs (aprobadas)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                        {metrics.auxPioneersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {metrics.auxPioneerHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.auxPioneerAvgHours} hrs/prec
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400">
                        {metrics.auxPioneerStudies}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        Precursores Regulares
                        <span className="text-slate-500 dark:text-slate-400 text-xs block font-normal">Asignados formalmente en la congregación</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {metrics.pioneersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold">
                        {metrics.pioneerHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400">
                        {metrics.pioneerAvgHours} hrs/prec
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400">
                        {metrics.pioneerStudies}
                      </td>
                    </tr>

                    {metrics.specialPioneersReporting > 0 && (
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          Precursores Especiales / Misioneros
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                          {metrics.specialPioneersReporting}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold">
                          {metrics.specialPioneerHours} hrs
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                        <td className="py-3.5 px-4 text-center font-bold text-teal-600 dark:text-teal-400">
                          {metrics.specialPioneerStudies}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3.5 px-4 text-slate-900 dark:text-white">TOTAL CONSOLIDADO S-1</td>
                      <td className="py-3.5 px-4 text-center font-black text-base text-indigo-600 dark:text-indigo-400">
                        {metrics.totalPublishersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-base text-purple-600 dark:text-purple-400">
                        {metrics.totalCongregationHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                      <td className="py-3.5 px-4 text-center font-black text-base text-teal-600 dark:text-teal-400">
                        {metrics.totalBibleStudies}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* OBSERVACIONES Y ESTADO DE ENVÍO */}
            <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Estado en JW Hub:</span>
                  {metrics.submissionStatus === 'enviado' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Enviado Oficialmente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Clock className="w-3 h-3" /> Pendiente de Envío
                    </span>
                  )}
                </div>
                {currentS1Record?.submittedAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fecha de envío: {new Date(currentS1Record.submittedAt).toLocaleDateString()} • Por: {currentS1Record.submittedBy || 'Secretario'}
                  </p>
                )}
                {currentS1Record?.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Desglose Semanal de Asistencia • {metrics.monthNameFull} {metrics.year}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Conteo por reunión, asistencia presencial en el salón y conexiones vía Zoom</p>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.meetingSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  No hay semanas registradas para el mes seleccionado.
                </div>
              ) : (
                metrics.meetingSessions.map((session, idx) => (
                  <div
                    key={session.weekId || idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">Semana {idx + 1}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Inicia: {session.startDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Entre Semana Salón</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{session.midweekInPerson}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Entre Semana Zoom</span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{session.midweekZoom}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Fin de Semana Salón</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{session.weekendInPerson}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Fin de Semana Zoom</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{session.weekendZoom}</span>
                      </div>
                    </div>

                    <div className="text-right flex sm:block items-center justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                      <span className="text-xs sm:text-[10px] text-slate-500 dark:text-slate-400 block">Total Semana</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Precursores Auxiliares ({metrics.auxPioneersReporting})
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Solicitudes aprobadas e informe del mes</span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                {metrics.auxPioneerHours} hrs totales
              </span>
            </div>

            {metrics.auxPioneerList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
                No hay precursores auxiliares registrados para este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.auxPioneerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Grupo {p.groupNumber || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm block">{p.hours} hrs</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">{p.bibleStudies} cursos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Precursores Regulares */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Precursores Regulares ({metrics.pioneersReporting})
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Asignados en la congregación</span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                {metrics.pioneerHours} hrs totales
              </span>
            </div>

            {metrics.pioneerList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
                No hay precursores regulares registrados con informe este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.pioneerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Grupo {p.groupNumber || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm block">{p.hours} hrs</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">{p.bibleStudies} cursos</span>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Publicadores Pendientes de Informe ({metrics.missingPublishers.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hermanos activos que aún no han entregado su informe de predicación para {metrics.monthNameFull} {metrics.year}
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-xl self-start sm:self-center">
              Faltan por informar antes de cerrar el S-1
            </span>
          </div>

          {metrics.missingPublishers.length === 0 ? (
            <div className="p-8 text-center text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-bold">¡Todos los publicadores activos han informado!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">El 100% de la congregación está contabilizado para el Formulario S-1.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.missingPublishers.map((pub) => (
                <div
                  key={pub.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{pub.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
                      className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Registro de Envío a la Sucursal (JW Hub)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mes: {metrics.monthNameFull} {metrics.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Hermano responsable del envío (Secretario / Coordinador):
                </label>
                <input
                  type="text"
                  value={submitForm.submittedBy}
                  onChange={(e) => setSubmitForm({ ...submitForm, submittedBy: e.target.value })}
                  placeholder="Ej. Carlos Mendoza (Secretario)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Código o Número de Recibo de JW Hub (opcional):
                </label>
                <input
                  type="text"
                  value={submitForm.confirmationNumber}
                  onChange={(e) => setSubmitForm({ ...submitForm, confirmationNumber: e.target.value })}
                  placeholder="Ej. JWHUB-202610-10582"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Notas u Observaciones Teocráticas:
                </label>
                <textarea
                  rows={3}
                  value={submitForm.notes}
                  onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                  placeholder="Ej. Se incluyeron 2 publicadores que entregaron informe tardío..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-start gap-2 text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Al marcar como "Enviado", se registra la fecha y hora oficial. Podrás abrir JW HUB en cualquier momento para verificar o ingresar los datos.
                </span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {metrics.submissionStatus === 'enviado' ? (
                <button
                  onClick={handleRevertSubmission}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors"
                >
                  Revertir a Pendiente
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSubmission}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors flex items-center gap-1.5"
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
