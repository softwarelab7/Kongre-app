// src/components/OrganizedImportModal.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  ORGANIZED_OFFICIAL_SCHEDULES,
  OrganizedWeekSchedule,
  getOrganizedScheduleForWeek,
  applyOrganizedToWeek,
  parseOrganizedJsonOrText,
} from '../utils/organizedSync';
import {
  OFFICIAL_PUBLIC_TALK_OUTLINES,
  findOutlineByNumber,
  searchOutlines,
} from '../utils/theocraticData';
import { createDefaultPrograma } from '../utils/clmDefaultProgram';
import { PublicTalkOutline, WeekSchedule } from '../types';
import {
  X,
  Sparkles,
  BookOpen,
  Mic,
  Calendar,
  Check,
  Upload,
  FileText,
  Search,
  ArrowRight,
  Layers,
  Music,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface OrganizedImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'catalogo' | 'importar' | 'bosquejos';
  initialFocus?: 'all' | 'midweek' | 'weekend';
}

export const OrganizedImportModal: React.FC<OrganizedImportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'catalogo',
  initialFocus = 'all',
}) => {
  const {
    currentWeek,
    updateWeek,
    syncAllWeeksWithOrganized,
    updateClmPrograma,
    publishers,
    settings,
  } = useCongregation();

  const [activeTab, setActiveTab] = useState<'catalogo' | 'importar' | 'bosquejos'>(initialTab);
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string>(() => {
    const matched = getOrganizedScheduleForWeek(currentWeek?.id, currentWeek?.midweek.date);
    return matched?.weekKey || ORGANIZED_OFFICIAL_SCHEDULES[1]?.weekKey || '2026-W41';
  });

  // Custom text / JSON input
  const [rawInput, setRawInput] = useState('');
  const [parseResult, setParseResult] = useState<OrganizedWeekSchedule | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Outline search
  const [outlineQuery, setOutlineQuery] = useState('');
  const [selectedOutline, setSelectedOutline] = useState<PublicTalkOutline | null>(() => {
    if (currentWeek?.weekend.publicTalkOutlineNumber) {
      return findOutlineByNumber(currentWeek.weekend.publicTalkOutlineNumber) || null;
    }
    return null;
  });

  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Reset tab when reopened with different initialTab
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      // Auto select matching schedule for current week if found
      const match = getOrganizedScheduleForWeek(currentWeek?.id, currentWeek?.midweek.date);
      if (match) {
        setSelectedScheduleKey(match.weekKey);
      }
    }
  }, [isOpen, initialTab, currentWeek?.id, currentWeek?.midweek.date]);

  if (!isOpen || !currentWeek) return null;

  const handleApplyToAllWeeks = () => {
    syncAllWeeksWithOrganized();
    setFeedbackSuccess('¡Todas las semanas de la congregación han sido sincronizadas con Organized!');
    setTimeout(() => {
      setFeedbackSuccess(null);
      onClose();
    }, 1500);
  };

  // Selected schedule from catalog
  const selectedSchedule =
    ORGANIZED_OFFICIAL_SCHEDULES.find((s) => s.weekKey === selectedScheduleKey) ||
    ORGANIZED_OFFICIAL_SCHEDULES[0];

  const handleApplySchedule = (
    scheduleToApply: OrganizedWeekSchedule,
    scope: 'all' | 'midweek' | 'weekend' = 'all'
  ) => {
    const updated = applyOrganizedToWeek(currentWeek, scheduleToApply, {
      applyMidweek: scope === 'all' || scope === 'midweek',
      applyWeekend: scope === 'all' || scope === 'weekend',
    });
    updateWeek(updated);

    if (scope === 'all' || scope === 'midweek') {
      const freshClm = createDefaultPrograma(currentWeek.weekStartDate, settings.congregationName || currentWeek.id, updated, publishers);
      updateClmPrograma(freshClm);
      try {
        localStorage.setItem(`clm_programa_${currentWeek.weekStartDate}`, JSON.stringify(freshClm));
      } catch {}
    }

    const scopeMsg =
      scope === 'all'
        ? '¡Bosquejos de Entre Semana y Fin de Semana aplicados a la semana!'
        : scope === 'midweek'
        ? '¡Bosquejos de la Reunión Entre Semana (MWB) aplicados!'
        : '¡Bosquejos del Fin de Semana (Discurso + Atalaya) aplicados!';

    setFeedbackSuccess(scopeMsg);
    setTimeout(() => {
      setFeedbackSuccess(null);
      onClose();
    }, 1300);
  };

  const handleParseRawInput = () => {
    if (!rawInput.trim()) return;
    const res = parseOrganizedJsonOrText(rawInput);
    if (res.success && res.schedule) {
      setParseResult(res.schedule);
      setParseError(null);
    } else {
      setParseError(res.errorMessage || 'No se pudo interpretar el formato del archivo.');
      setParseResult(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawInput(content);
      const res = parseOrganizedJsonOrText(content);
      if (res.success && res.schedule) {
        setParseResult(res.schedule);
        setParseError(null);
      } else {
        setParseError(res.errorMessage || 'No se pudo leer el archivo de programa.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyOutlineOnly = (outline: PublicTalkOutline) => {
    const updated: WeekSchedule = JSON.parse(JSON.stringify(currentWeek));
    updated.weekend.publicTalkOutlineNumber = outline.number;
    updated.weekend.publicTalkTheme = outline.title;
    updateWeek(updated);

    setFeedbackSuccess(`Bosquejo #${outline.number} asignado a la reunión del fin de semana.`);
    setTimeout(() => {
      setFeedbackSuccess(null);
      onClose();
    }, 1200);
  };

  // Filtered outlines for tab 3
  const filteredOutlines = outlineQuery.trim()
    ? searchOutlines(outlineQuery)
    : OFFICIAL_PUBLIC_TALK_OUTLINES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-700 via-indigo-800 to-slate-900 p-5 sm:p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Catálogo Teocrático
                </span>
                <span className="text-xs text-indigo-200">Sincronizador Oficial</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                Traer Bosquejos y Programa Semanal
              </h2>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Carga los temas oficiales para la Reunión Entre Semana (MWB) y Fin de Semana (Discurso Público + Atalaya)
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mt-5 bg-white/10 p-1 rounded-2xl backdrop-blur-md text-xs font-bold">
            <button
              onClick={() => setActiveTab('catalogo')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'catalogo'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Catálogo Semanal</span>
            </button>
            <button
              onClick={() => setActiveTab('importar')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'importar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Importar Archivo / Texto</span>
            </button>
            <button
              onClick={() => setActiveTab('bosquejos')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'bosquejos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mic className="w-4 h-4 text-indigo-600" />
              <span>194 Bosquejos Públicos</span>
            </button>
          </div>
        </div>

        {/* Feedback Success Notification */}
        {feedbackSuccess && (
          <div className="bg-emerald-600 text-white px-5 py-3 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: CATÁLOGO SEMANAL DE ORGANIZED */}
          {activeTab === 'catalogo' && (
            <div className="space-y-5">
              {/* Week selector carousel / select */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  Selecciona la semana del programa oficial:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ORGANIZED_OFFICIAL_SCHEDULES.map((s) => {
                    const isSelected = s.weekKey === selectedScheduleKey;
                    return (
                      <button
                        key={s.weekKey}
                        onClick={() => setSelectedScheduleKey(s.weekKey)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                          Semana {s.weekKey}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {s.bibleReading}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {s.weekDateRange}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview of the Selected Week from Organized */}
              <div className="space-y-4">
                {/* 1. Reunión Entre Semana (MWB) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Entre Semana: Guía de Actividades ({selectedSchedule.bibleReading})</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Canciones: {selectedSchedule.midweek.songFirst}, {selectedSchedule.midweek.songMiddle}, {selectedSchedule.midweek.songConclude}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Tesoros */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
                        Tesoros de la Biblia
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSchedule.midweek.tesoros.discursoTitle}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {selectedSchedule.midweek.tesoros.perlasTitle}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {selectedSchedule.midweek.tesoros.lecturaTitle}
                      </p>
                    </div>

                    {/* Maestros */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
                        Seamos Mejores Lectores y Maestros
                      </span>
                      {selectedSchedule.midweek.demonstrations.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span className="truncate">{d.title}</span>
                          {d.lessonNumber && (
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">
                              Lección #{d.lessonNumber}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Vida Cristiana */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 md:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">
                        Nuestra Vida Cristiana & Estudio Bíblico
                      </span>
                      {selectedSchedule.midweek.vidaCristiana.map((v, i) => (
                        <p key={i} className="text-slate-700 dark:text-slate-300">
                          • {v.title}
                        </p>
                      ))}
                      <p className="font-semibold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-800">
                        📖 {selectedSchedule.midweek.estudioBiblicoTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Reunión Fin de Semana */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Fin de Semana: Discurso Público & Estudio de La Atalaya</span>
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Canciones: {selectedSchedule.weekend.openingSong}, {selectedSchedule.weekend.middleSong}, {selectedSchedule.weekend.closingSong}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Discurso */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                        Bosquejo Oficial de Discurso Público
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        Bosquejo #{selectedSchedule.weekend.outlineNumber}: {selectedSchedule.weekend.outlineTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Sugerido en el catálogo oficial para este ciclo
                      </p>
                    </div>

                    {/* Atalaya */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 block">
                        Estudio de La Atalaya
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        «{selectedSchedule.weekend.watchtowerTheme}»
                      </p>
                      {selectedSchedule.weekend.watchtowerScripture && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Texto temático: {selectedSchedule.weekend.watchtowerScripture}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Apply Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer order-last sm:order-first"
                >
                  Cancelar
                </button>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleApplySchedule(selectedSchedule, 'midweek')}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Aplica solo los bosquejos de la reunión entre semana (Tesoros, Maestros, Vida Cristiana)"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Solo Entre Semana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplySchedule(selectedSchedule, 'weekend')}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Aplica solo el bosquejo público y estudio de La Atalaya para el fin de semana"
                  >
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Solo Fin de Semana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplySchedule(selectedSchedule, 'all')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Aplica todo el programa a esta semana"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aplicar a esta semana (Ambas reuniones)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyToAllWeeks}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-slate-700"
                    title="Aplica automáticamente los programas oficiales de Organized a todas las semanas de la congregación"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Sincronizar Todas las Semanas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORTAR ARCHIVO O TEXTO DE ORGANIZED */}
          {activeTab === 'importar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">
                    Carga directa de programas semanales
                  </h4>
                  <p className="leading-relaxed text-indigo-800 dark:text-indigo-300">
                    Puedes cargar un archivo <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-[11px]">.json</code> con el programa o pegar el texto de la reunión copiado directamente.
                  </p>
                </div>
              </div>

              {/* Upload file button */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90 transition shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo JSON de Programa</span>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">o pega el texto abajo:</span>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  rows={6}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Pega aquí el contenido JSON del programa o el texto de la reunión..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParseRawInput}
                  disabled={!rawInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                >
                  Interpretar Contenido
                </button>

                {parseError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{parseError}</span>
                  </p>
                )}
              </div>

              {/* Parse Preview */}
              {parseResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Programa extraído con éxito</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplySchedule(parseResult, 'midweek')}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-bold hover:bg-amber-500/30 transition cursor-pointer"
                        title="Aplicar solo reunión entre semana"
                      >
                        Solo Entre Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySchedule(parseResult, 'weekend')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                        title="Aplicar solo fin de semana"
                      >
                        Solo Fin de Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySchedule(parseResult, 'all')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs text-xs"
                      >
                        Aplicar Todo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold block text-slate-900 dark:text-white">Entre Semana:</span>
                      <p>• {parseResult.midweek.tesoros.discursoTitle}</p>
                      <p>• {parseResult.midweek.tesoros.lecturaTitle}</p>
                      <p>• {parseResult.midweek.estudioBiblicoTitle}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold block text-slate-900 dark:text-white">Fin de Semana:</span>
                      <p>• Discurso: {parseResult.weekend.outlineTitle}</p>
                      <p>• Atalaya: {parseResult.weekend.watchtowerTheme}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 194 BOSQUEJOS PÚBLICOS DE ORGANIZED */}
          {activeTab === 'bosquejos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={outlineQuery}
                    onChange={(e) => setOutlineQuery(e.target.value)}
                    placeholder="Buscar por número (#1 al 194), tema o categoría..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto font-medium">
                  {filteredOutlines.length} bosquejos disponibles
                </span>
              </div>

              {/* Outlines List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredOutlines.map((outline) => {
                  const isCurrentOnWeek =
                    currentWeek.weekend.publicTalkOutlineNumber === outline.number;

                  return (
                    <div
                      key={outline.number}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrentOnWeek
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white dark:bg-slate-700 font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                          #{outline.number}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {outline.title}
                          </h4>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 inline-block mt-1">
                            {outline.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrentOnWeek ? (
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300">
                            Asignado esta semana
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyOutlineOnly(outline)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
                          >
                            Asignar a esta semana
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">
              Los bosquejos oficiales se sincronizan directamente con la base de datos de la congregación.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 transition text-xs shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
