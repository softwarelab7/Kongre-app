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
  initialTab = 'bosquejos',
}) => {
  const {
    currentWeek,
    updateWeek,
    updateClmPrograma,
    publishers,
    settings,
  } = useCongregation();

  const [activeTab, setActiveTab] = useState<'importar' | 'bosquejos'>(
    initialTab === 'importar' ? 'importar' : 'bosquejos'
  );

  // Custom text / JSON input
  const [rawInput, setRawInput] = useState('');
  const [parseResult, setParseResult] = useState<OrganizedWeekSchedule | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Outline search
  const [outlineQuery, setOutlineQuery] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Reset tab when reopened with different initialTab
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'importar' ? 'importar' : 'bosquejos');
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !currentWeek) return null;

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

  // Filtered outlines
  const filteredOutlines = outlineQuery.trim()
    ? searchOutlines(outlineQuery)
    : OFFICIAL_PUBLIC_TALK_OUTLINES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Catálogo de bosquejos públicos"
    >
      <div
        className="w-full max-w-3xl kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-900 dark:bg-[#18181F] border-b border-zinc-800 dark:border-[#27272A] p-5 sm:p-6 text-white shrink-0 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-amber-500/15 blur-3xl" />
          <button
            onClick={onClose}
            aria-label="Cerrar catálogo de bosquejos"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 relative z-10">
            <div className="kg-glow-badge w-12 h-12 rounded-2xl bg-zinc-800 dark:bg-[#27272A] border border-zinc-700 dark:border-[#3E3E42] flex items-center justify-center text-zinc-200 shadow-md shrink-0">
              <Mic className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Bosquejos Públicos e Importación
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Selecciona uno de los 194 bosquejos de discursos públicos o importa un archivo de programa
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mt-4 bg-zinc-800/80 dark:bg-[#121216] border border-zinc-700 dark:border-[#27272A] p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('bosquejos')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'bosquejos'
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-[#27272A] dark:text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-4 h-4 text-indigo-500" />
              <span>194 Bosquejos Públicos</span>
            </button>
            <button
              onClick={() => setActiveTab('importar')}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'importar'
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-[#27272A] dark:text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4 text-zinc-400" />
              <span>Importar Archivo / Texto</span>
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
          {/* IMPORTAR ARCHIVO O TEXTO */}
          {activeTab === 'importar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">
                    Carga directa de programas semanales
                  </h4>
                  <p className="leading-relaxed text-indigo-800 dark:text-indigo-300">
                    Puedes cargar un archivo <code className="px-1.5 py-0.5 rounded bg-white dark:bg-[#121216] font-mono text-[11px]">.json</code> con el programa o pegar el texto de la reunión copiado directamente.
                  </p>
                </div>
              </div>

              {/* Upload file button */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold cursor-pointer hover:opacity-90 transition shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo JSON de Programa</span>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-zinc-400">o pega el texto abajo:</span>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  rows={6}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Pega aquí el contenido JSON del programa o el texto de la reunión..."
                  className="w-full p-3.5 rounded-2xl border border-zinc-300 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs font-mono text-zinc-800 dark:text-[#E4E4E7] focus:outline-indigo-500"
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
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-3 animate-fade-in text-xs shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Programa extraído con éxito</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplySchedule(parseResult, 'midweek')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#27272A] dark:hover:bg-[#323238] border border-zinc-200 dark:border-[#3E3E42] text-zinc-800 dark:text-zinc-200 text-[11px] font-medium transition cursor-pointer"
                        title="Aplicar solo reunión entre semana"
                      >
                        Solo Entre Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySchedule(parseResult, 'weekend')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#27272A] dark:hover:bg-[#323238] border border-zinc-200 dark:border-[#3E3E42] text-zinc-800 dark:text-zinc-200 text-[11px] font-medium transition cursor-pointer"
                        title="Aplicar solo fin de semana"
                      >
                        Solo Fin de Semana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySchedule(parseResult, 'all')}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 font-bold transition cursor-pointer shadow-xs text-xs"
                      >
                        Aplicar Todo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-700 dark:text-[#D4D4D8]">
                    <div className="bg-white dark:bg-[#121216] p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                      <span className="font-bold block text-zinc-900 dark:text-white">Entre Semana:</span>
                      <p>• {parseResult.midweek.tesoros.discursoTitle}</p>
                      <p>• {parseResult.midweek.tesoros.lecturaTitle}</p>
                      <p>• {parseResult.midweek.estudioBiblicoTitle}</p>
                    </div>
                    <div className="bg-white dark:bg-[#121216] p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                      <span className="font-bold block text-zinc-900 dark:text-white">Fin de Semana:</span>
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
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={outlineQuery}
                    onChange={(e) => setOutlineQuery(e.target.value)}
                    placeholder="Buscar por número (#1 al 194), tema o categoría..."
                    aria-label="Buscar bosquejo público por número, tema o categoría"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs text-zinc-800 dark:text-[#E4E4E7] focus:outline-indigo-500"
                  />
                </div>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] self-end sm:self-auto font-medium">
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
                          : 'bg-white dark:bg-[#18181F]/80 border-zinc-200 dark:border-[#27272A] hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-zinc-700 font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                          #{outline.number}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
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
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A1A1AA]">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">
              Los bosquejos oficiales se sincronizan directamente con la base de datos de la congregación.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold hover:opacity-90 transition text-xs shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
