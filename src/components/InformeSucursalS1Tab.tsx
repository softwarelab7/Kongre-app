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
import { SectionHeader } from './SectionHeader';

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
    <div className="space-y-6 pb-16">
      {/* SECTION HEADER */}
      <div className="print:hidden">
        <SectionHeader
          icon={FileBarChart}
          highlightWord="Informe Oficial"
          title="S-1 Sucursal"
          subtitle="CONSOLIDACIÓN MENSUAL DE ASISTENCIA Y PREDICACIÓN PARA JW HUB"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
              title="Copiar resumen para WhatsApp o Ancianos"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
              title="Imprimir Formulario S-1 Oficial"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Imprimir S-1</span>
            </button>

            <button
              onClick={openJwHubPortal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-colors"
              title="Abrir portal oficial hub.jw.org en nueva pestaña"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir JW HUB</span>
            </button>
          </div>
        </SectionHeader>
      </div>

      {/* MONTH SELECTOR & ACTION RIBBON */}
      <div className="print:hidden bg-slate-900/90 backdrop-blur border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Month Picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 pr-9 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {allMonthsList.map((m) => (
                <option key={m.monthKey} value={m.monthKey} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-400 hidden md:inline ml-2">
            Año teocrático <strong className="text-slate-200">{metrics.serviceYear}</strong>
          </span>
        </div>

        {/* Status indicator & toggle button */}
        <div className="flex items-center gap-3">
          {metrics.submissionStatus === 'enviado' ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-300 block">Enviado a la Sucursal</span>
                {currentS1Record?.confirmationNumber && (
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Ref: {currentS1Record.confirmationNumber}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-amber-300 block">Pendiente de Envío</span>
                <span className="text-[10px] text-amber-400/80">Plazo oficial JW Hub</span>
              </div>
            </div>
          )}

          <button
            onClick={handleOpenSubmitModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-300" />
            <span>{metrics.submissionStatus === 'enviado' ? 'Detalles de Envío' : 'Marcar Envío'}</span>
          </button>
        </div>
      </div>

      {/* KPI RIBBON CARDS */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Publicadores que informaron */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Publicadores</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.totalPublishersReporting}
              <span className="text-xs text-slate-400 font-normal"> / {metrics.totalActivePublishers}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${Math.min(100, metrics.completionPercentage)}%` }}
                />
              </div>
              <span className="text-[10px] text-sky-400 font-semibold">{metrics.completionPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Promedio Entre Semana */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Entre Semana</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-indigo-300 tracking-tight">
              {metrics.midweekAverage}
            </div>
            <span className="text-[10px] text-slate-400">
              {metrics.midweekMeetingsCount} reuniones • Promedio S-88
            </span>
          </div>
        </div>

        {/* Card 3: Promedio Fin de Semana */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Fin de Semana</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-300 tracking-tight">
              {metrics.weekendAverage}
            </div>
            <span className="text-[10px] text-slate-400">
              {metrics.weekendMeetingsCount} reuniones • Promedio S-88
            </span>
          </div>
        </div>

        {/* Card 4: Promedio Combinado */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Prom. General</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-300 tracking-tight">
              {metrics.combinedAverage}
            </div>
            <span className="text-[10px] text-slate-400">
              Máx: <strong className="text-slate-200">{metrics.highestAttendance}</strong> asistentes
            </span>
          </div>
        </div>

        {/* Card 5: Horas Totales */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Horas Totales</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-purple-300 tracking-tight">
              {metrics.totalCongregationHours}
            </div>
            <span className="text-[10px] text-slate-400">
              {metrics.pioneersReporting + metrics.auxPioneersReporting} precursores
            </span>
          </div>
        </div>

        {/* Card 6: Cursos Bíblicos */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cursos Bíblicos</span>
            <BookOpen className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-teal-300 tracking-tight">
              {metrics.totalBibleStudies}
            </div>
            <span className="text-[10px] text-slate-400">Estudios informados</span>
          </div>
        </div>
      </div>

      {/* SUBTABS NAVIGATION */}
      <div className="print:hidden flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('resumen')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeSubTab === 'resumen'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Formulario S-1 Oficial
        </button>
        <button
          onClick={() => setActiveSubTab('asistencia')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeSubTab === 'asistencia'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Asistencia a Reuniones (S-88)
        </button>
        <button
          onClick={() => setActiveSubTab('predicacion')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeSubTab === 'predicacion'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Ministerio y Precursores
        </button>
        <button
          onClick={() => setActiveSubTab('pendientes')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all relative ${
            activeSubTab === 'pendientes'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Pendientes de Informe</span>
          {metrics.missingPublishers.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-900">
              {metrics.missingPublishers.length}
            </span>
          )}
        </button>
      </div>

      {/* VIEW CONTENT: RESUMEN / OFICIAL */}
      {activeSubTab === 'resumen' && (
        <div className="space-y-6">
          {/* Main S-1 Official Preview Box */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {/* JW Official Banner */}
            <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold tracking-wider uppercase mb-2">
                  <FileBarChart className="w-3.5 h-3.5" />
                  Formulario Oficial S-1-S
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Informe de la Congregación a la Sucursal
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {metrics.congregationName} (#{metrics.congregationNumber}) • Circuito {metrics.circuitNumber} • {metrics.monthNameFull} {metrics.year}
                </p>
              </div>

              <div className="text-right flex flex-col items-start sm:items-end">
                <span className="text-xs text-slate-400">Coordinador / Secretario:</span>
                <span className="text-sm font-semibold text-slate-200">{metrics.coordinatorName}</span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Año de servicio: <strong className="text-slate-200">{metrics.serviceYear}</strong>
                </span>
              </div>
            </div>

            {/* TABLA 1: ASISTENCIA A LAS REUNIONES (S-88) */}
            <div className="p-5 sm:p-6 border-b border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  1. Asistencia a las Reuniones (Formulario S-88)
                </h3>
                <span className="text-xs text-slate-400">Datos consolidados del mes</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold">
                      <th className="py-3 px-4">Tipo de Reunión</th>
                      <th className="py-3 px-4 text-center">Reuniones Celebradas</th>
                      <th className="py-3 px-4 text-center">Asistencia Total</th>
                      <th className="py-3 px-4 text-center">Prom. Presencial</th>
                      <th className="py-3 px-4 text-center">Prom. Zoom</th>
                      <th className="py-3 px-4 text-center font-bold text-sky-300 bg-sky-500/10">
                        Promedio Oficial S-1
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-medium text-white">
                        Reunión Entre Semana <span className="text-slate-400 text-xs block font-normal">(Vida y Ministerio Cristianos)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {metrics.midweekMeetingsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {metrics.midweekTotalAttendance}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.midweekInPersonAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.midweekZoomAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sky-400 text-base bg-sky-500/5">
                        {metrics.midweekAverage}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-medium text-white">
                        Reunión Fin de Semana <span className="text-slate-400 text-xs block font-normal">(Discurso Público y La Atalaya)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {metrics.weekendMeetingsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {metrics.weekendTotalAttendance}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.weekendInPersonAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.weekendZoomAvg}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400 text-base bg-emerald-500/5">
                        {metrics.weekendAverage}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/5 font-semibold text-slate-300">
                      <td className="py-3 px-4">Totales y Promedio General</td>
                      <td className="py-3 px-4 text-center">{metrics.totalMeetingsHeld}</td>
                      <td className="py-3 px-4 text-center">{metrics.totalAttendanceCumulative}</td>
                      <td className="py-3 px-4 text-center" colSpan={2}>
                        Máxima Asistencia: <strong className="text-white">{metrics.highestAttendance}</strong>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-300 text-base bg-amber-500/10">
                        {metrics.combinedAverage}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TABLA 2: ACTIVIDAD EN EL MINISTERIO DEL CAMPO (S-4 / S-1) */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  2. Actividad en el Ministerio del Campo (S-4 / S-1)
                </h3>
                <span className="text-xs text-slate-400">
                  {metrics.totalPublishersReporting} de {metrics.totalActivePublishers} publicadores informaron ({metrics.completionPercentage}%)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-300 font-semibold">
                      <th className="py-3 px-4">Clasificación Teocrática</th>
                      <th className="py-3 px-4 text-center">Número que Informó</th>
                      <th className="py-3 px-4 text-center">Horas Informadas</th>
                      <th className="py-3 px-4 text-center">Promedio Horas</th>
                      <th className="py-3 px-4 text-center">Cursos Bíblicos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-medium text-white">
                        Publicadores Regulares
                        <span className="text-slate-400 text-xs block font-normal">Bautizados y no bautizados que participaron</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                        {metrics.regularPublishersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.regularPublishersHours > 0 ? `${metrics.regularPublishersHours} hrs` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-teal-300">
                        {metrics.regularPublishersStudies}
                      </td>
                    </tr>

                    <tr className="hover:bg-white/[0.02] bg-amber-500/[0.02]">
                      <td className="py-3.5 px-4 font-medium text-white">
                        Precursores Auxiliares
                        <span className="text-slate-400 text-xs block font-normal">
                          {metrics.auxPioneerTarget30} de 30 hrs • {metrics.auxPioneerTarget15} de 15 hrs (aprobadas)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-300">
                        {metrics.auxPioneersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {metrics.auxPioneerHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.auxPioneerAvgHours} hrs/prec
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-teal-300">
                        {metrics.auxPioneerStudies}
                      </td>
                    </tr>

                    <tr className="hover:bg-white/[0.02] bg-sky-500/[0.02]">
                      <td className="py-3.5 px-4 font-medium text-white">
                        Precursores Regulares
                        <span className="text-slate-400 text-xs block font-normal">Asignados formalmente en la congregación</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sky-300">
                        {metrics.pioneersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {metrics.pioneerHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {metrics.pioneerAvgHours} hrs/prec
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-teal-300">
                        {metrics.pioneerStudies}
                      </td>
                    </tr>

                    {metrics.specialPioneersReporting > 0 && (
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-medium text-white">
                          Precursores Especiales / Misioneros
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-purple-300">
                          {metrics.specialPioneersReporting}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                          {metrics.specialPioneerHours} hrs
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-teal-300">
                          {metrics.specialPioneerStudies}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/5 font-semibold text-slate-200">
                      <td className="py-3.5 px-4 text-white">TOTAL CONSOLIDADO S-1</td>
                      <td className="py-3.5 px-4 text-center font-bold text-base text-sky-400">
                        {metrics.totalPublishersReporting}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-base text-purple-400">
                        {metrics.totalCongregationHours} hrs
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400">—</td>
                      <td className="py-3.5 px-4 text-center font-bold text-base text-teal-400">
                        {metrics.totalBibleStudies}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* OBSERVACIONES Y ESTADO DE ENVÍO */}
            <div className="p-5 sm:p-6 bg-white/[0.02] border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Estado en JW Hub:</span>
                  {metrics.submissionStatus === 'enviado' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Enviado Oficialmente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3 h-3" /> Pendiente de Envío
                    </span>
                  )}
                </div>
                {currentS1Record?.submittedAt && (
                  <p className="text-[11px] text-slate-400">
                    Fecha de envío: {new Date(currentS1Record.submittedAt).toLocaleDateString()} • Por: {currentS1Record.submittedBy || 'Secretario'}
                  </p>
                )}
                {currentS1Record?.notes && (
                  <p className="text-xs text-slate-300 italic">
                    "{currentS1Record.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={handleOpenSubmitModal}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-colors"
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
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Desglose Semanal de Asistencia • {metrics.monthNameFull} {metrics.year}</h3>
                <p className="text-xs text-slate-400">Conteo por reunión, asistencia presencial en el salón y conexiones vía Zoom</p>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.meetingSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white/[0.02] rounded-xl border border-white/5">
                  No hay semanas registradas para el mes seleccionado.
                </div>
              ) : (
                metrics.meetingSessions.map((session, idx) => (
                  <div
                    key={session.weekId || idx}
                    className="p-4 rounded-xl bg-slate-800/50 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-sky-400 block">Semana {idx + 1}</span>
                      <span className="text-sm font-semibold text-slate-200">
                        Inicia: {session.startDate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white/5 p-2.5 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 block">Entre Semana Salón</span>
                        <span className="text-sm font-bold text-white">{session.midweekInPerson}</span>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 block">Entre Semana Zoom</span>
                        <span className="text-sm font-bold text-indigo-300">{session.midweekZoom}</span>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 block">Fin de Semana Salón</span>
                        <span className="text-sm font-bold text-white">{session.weekendInPerson}</span>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg text-center">
                        <span className="text-[10px] text-slate-400 block">Fin de Semana Zoom</span>
                        <span className="text-sm font-bold text-emerald-300">{session.weekendZoom}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Semana</span>
                      <span className="text-base font-bold text-amber-300">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Precursores Auxiliares */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Precursores Auxiliares ({metrics.auxPioneersReporting})
                </h3>
                <span className="text-xs text-slate-400">Solicitudes aprobadas e informe del mes</span>
              </div>
              <span className="text-xs font-semibold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg">
                {metrics.auxPioneerHours} hrs totales
              </span>
            </div>

            {metrics.auxPioneerList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white/[0.02] rounded-xl border border-white/5">
                No hay precursores auxiliares registrados para este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.auxPioneerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{p.name}</span>
                      <span className="text-[11px] text-slate-400">Grupo {p.groupNumber || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-300 text-sm block">{p.hours} hrs</span>
                      <span className="text-[10px] text-teal-400">{p.bibleStudies} cursos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Precursores Regulares */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  Precursores Regulares ({metrics.pioneersReporting})
                </h3>
                <span className="text-xs text-slate-400">Asignados en la congregación</span>
              </div>
              <span className="text-xs font-semibold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg">
                {metrics.pioneerHours} hrs totales
              </span>
            </div>

            {metrics.pioneerList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white/[0.02] rounded-xl border border-white/5">
                No hay precursores regulares registrados con informe este mes.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.pioneerList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{p.name}</span>
                      <span className="text-[11px] text-slate-400">Grupo {p.groupNumber || '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sky-300 text-sm block">{p.hours} hrs</span>
                      <span className="text-[10px] text-teal-400">{p.bibleStudies} cursos</span>
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
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Publicadores Pendientes de Informe ({metrics.missingPublishers.length})
              </h3>
              <p className="text-xs text-slate-400">
                Hermanos activos que aún no han entregado su informe de predicación para {metrics.monthNameFull} {metrics.year}
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl self-start sm:self-center">
              Faltan por informar antes de cerrar el S-1
            </span>
          </div>

          {metrics.missingPublishers.length === 0 ? (
            <div className="p-8 text-center text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <p className="text-sm font-bold">¡Todos los publicadores activos han informado!</p>
              <p className="text-xs text-emerald-400/80">El 100% de la congregación está contabilizado para el Formulario S-1.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.missingPublishers.map((pub) => (
                <div
                  key={pub.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{pub.name}</span>
                    <span className="text-[11px] text-slate-400">
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
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registro de Envío a la Sucursal (JW Hub)</h3>
                  <p className="text-xs text-slate-400">
                    Mes: {metrics.monthNameFull} {metrics.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Hermano responsable del envío (Secretario / Coordinador):
                </label>
                <input
                  type="text"
                  value={submitForm.submittedBy}
                  onChange={(e) => setSubmitForm({ ...submitForm, submittedBy: e.target.value })}
                  placeholder="Ej. Héctor Gutiérrez (Secretario)"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Código o Número de Recibo de JW Hub (opcional):
                </label>
                <input
                  type="text"
                  value={submitForm.confirmationNumber}
                  onChange={(e) => setSubmitForm({ ...submitForm, confirmationNumber: e.target.value })}
                  placeholder="Ej. JWHUB-202610-10582"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Notas u Observaciones Teocráticas:
                </label>
                <textarea
                  rows={3}
                  value={submitForm.notes}
                  onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
                  placeholder="Ej. Se incluyeron 2 publicadores que entregaron informe tardío..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-start gap-2 text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Al marcar como "Enviado", se registra la fecha y hora oficial. Podrás abrir JW HUB en cualquier momento para verificar o ingresar los datos.
                </span>
              </div>
            </div>

            <div className="p-5 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
              {metrics.submissionStatus === 'enviado' ? (
                <button
                  onClick={handleRevertSubmission}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                >
                  Revertir a Pendiente
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-white/10 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSubmission}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1.5"
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
