// src/components/S89SlipsTab.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { S89Slip, Publisher } from '../types';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import { generateConfirmationUrl } from '../utils/whatsapp';
import { BatchWhatsAppModal } from './BatchWhatsAppModal';
import { SplashCheckbox } from './SplashCheckbox';
import {
  ensureS89PersistentStorage,
  saveS89WeekSlipsToIndexedDb,
  getS89WeekSlipsFromIndexedDb,
  saveS89SlipOverrideToIndexedDb,
  getS89SlipOverridesForWeek,
  getS89OfflineStorageStats,
  S89OfflineStorageStats,
  S89SlipOverrideRecord,
} from '../services/s89IndexedDbService';
import {
  FileText,
  Printer,
  Share2,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Upload,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  RotateCcw,
  History,
  MessageCircle,
  X,
  Check,
  ShieldCheck,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { LocalOfficialFormsCenter } from './LocalOfficialFormsCenter';
import {
  getLocalOfficialFormBytes,
  fillOfficialS89Pdf,
  downloadPdfBytesLocally,
} from '../services/localOfficialFormsService';
import { generateS89PdfFromSlips } from '../utils/pdfGenerator';
import { useToast } from '../context/ToastContext';

export const S89SlipsTab: React.FC = () => {
  const { showToast } = useToast();
  const {
    weeks,
    currentWeek,
    currentWeekId,
    setCurrentWeekId,
    getS89SlipsForWeek,
    publishersMap,
    settings,
    advancePublisherLesson,
    repeatPublisherLesson,
    publishers,
  } = useCongregation();

  const [selectedRoom, setSelectedRoom] = useState<'todos' | 'principal' | 'auxiliar'>('todos');
  const [filterDelivered, setFilterDelivered] = useState<'todos' | 'pendiente' | 'confirmada'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printLayout, setPrintLayout] = useState<'cards' | 'sheet4' | 'formato_local'>('cards');
  const [isBatchWhatsAppOpen, setIsBatchWhatsAppOpen] = useState(false);

  // Student history modal
  const [historyStudent, setHistoryStudent] = useState<Publisher | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<{ id: string; text: string } | null>(null);

  // IndexedDB persistent offline storage state for S-89 forms
  const [idbFallbackSlips, setIdbFallbackSlips] = useState<S89Slip[]>([]);
  const [idbOverrides, setIdbOverrides] = useState<Record<string, S89SlipOverrideRecord>>({});
  const [offlineStats, setOfflineStats] = useState<S89OfflineStorageStats | null>(null);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Sorted weeks
  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  }, [weeks]);

  const activeWeek = useMemo(() => {
    return weeks.find((w) => w.id === currentWeekId) || currentWeek || sortedWeeks[0];
  }, [weeks, currentWeekId, currentWeek, sortedWeeks]);

  const currentWeekIndex = useMemo(() => {
    return sortedWeeks.findIndex((w) => w.id === activeWeek?.id);
  }, [sortedWeeks, activeWeek]);

  // Extract S-89 slips for the active week
  const computedSlips = useMemo(() => {
    if (!activeWeek) return [];
    return getS89SlipsForWeek(activeWeek);
  }, [activeWeek, getS89SlipsForWeek]);

  // Request persistent storage & sync all weeks' S-89 slips into IndexedDB + Service Worker
  const syncAllWeeksToIndexedDb = useCallback(async () => {
    setIsSyncingOffline(true);
    try {
      await ensureS89PersistentStorage();
      for (const w of sortedWeeks) {
        const wSlips = getS89SlipsForWeek(w);
        if (wSlips.length > 0) {
          await saveS89WeekSlipsToIndexedDb(w.id, wSlips, {
            congregationId: settings.congregationNumber || settings.congregationId,
            weekStartDate: w.weekStartDate,
            weekEndDate: w.weekEndDate,
          });
        }
      }
      const stats = await getS89OfflineStorageStats();
      setOfflineStats(stats);
    } catch {} finally {
      setIsSyncingOffline(false);
    }
  }, [sortedWeeks, getS89SlipsForWeek, settings.congregationNumber, settings.congregationId]);

  useEffect(() => {
    syncAllWeeksToIndexedDb();
  }, [syncAllWeeksToIndexedDb]);

  // Load IndexedDB cached slips & overrides for activeWeek
  useEffect(() => {
    if (!activeWeek?.id) return;
    let mounted = true;
    (async () => {
      try {
        const [cachedSlips, overrides, stats] = await Promise.all([
          getS89WeekSlipsFromIndexedDb(activeWeek.id),
          getS89SlipOverridesForWeek(activeWeek.id),
          getS89OfflineStorageStats(),
        ]);
        if (!mounted) return;
        setIdbFallbackSlips(cachedSlips);
        setIdbOverrides(overrides);
        setOfflineStats(stats);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [activeWeek?.id, computedSlips]);

  // Merge live slips (or IndexedDB offline fallback) with IndexedDB delivery status overrides
  const rawSlips = useMemo(() => {
    const base = computedSlips.length > 0 ? computedSlips : idbFallbackSlips;
    return base.map((slip) => {
      const ov = idbOverrides[slip.id];
      if (!ov) return slip;
      return {
        ...slip,
        deliveredStatus: ov.deliveredStatus || slip.deliveredStatus,
      };
    });
  }, [computedSlips, idbFallbackSlips, idbOverrides]);

  const handleToggleSlipDelivered = async (slip: S89Slip) => {
    if (!activeWeek) return;
    const nextStatus = slip.deliveredStatus === 'confirmada' ? 'pendiente' : 'confirmada';
    await saveS89SlipOverrideToIndexedDb(slip.id, activeWeek.id, slip.studentId, nextStatus);
    const updatedOverrides = await getS89SlipOverridesForWeek(activeWeek.id);
    setIdbOverrides(updatedOverrides);
  };

  // Filtered slips
  const filteredSlips = useMemo(() => {
    return rawSlips.filter((s) => {
      if (selectedRoom !== 'todos' && s.room !== selectedRoom) return false;
      if (filterDelivered !== 'todos' && s.deliveredStatus !== filterDelivered) return false;
      return true;
    });
  }, [rawSlips, selectedRoom, filterDelivered]);

  // Generate polite WhatsApp message for an S-89 slip
  const getWhatsAppMessage = (slip: S89Slip) => {
    const student = publishersMap.get(slip.studentId);
    const greeting = student?.gender === 'hermana' ? 'Estimada hna.' : 'Estimado hno.';
    const roomText = slip.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal';
    const assistantText = slip.assistantName ? `\n• Ayudante: ${slip.assistantName}` : '';
    const lessonTitle = slip.lessonNumber
      ? OFFICIAL_STUDENT_LESSONS.find((l) => l.number === slip.lessonNumber)?.title
      : undefined;
    const lessonText = slip.lessonNumber
      ? `\n• Punto de consejo: Lección ${slip.lessonNumber}${lessonTitle ? ` (${lessonTitle})` : ''}`
      : '';

    const assignmentPath = slip.partNumber === 1 ? 'tesoros.lecturaBiblia' : `maestros.${slip.partNumber - 2}`;
    const directConfirmUrl = activeWeek
      ? generateConfirmationUrl(activeWeek.id, 'midweek', assignmentPath, slip.studentId)
      : '';

    let msg = `*ASIGNACIÓN PARA LA REUNIÓN VIDA Y MINISTERIO CRISTIANOS (S-89)*\n`;
    msg += `Congregación: ${settings.congregationName}\n\n`;
    msg += `¡Hola ${greeting} ${slip.studentName}! Le compartimos los detalles de su próxima asignación estudiantil:\n\n`;
    msg += `📅 *Fecha:* ${slip.date}\n`;
    msg += `📖 *Parte Nº ${slip.partNumber}:* ${slip.partTitle}\n`;
    msg += `🏛️ *Sala:* ${roomText}`;
    msg += `${assistantText}`;
    msg += `${lessonText}\n`;

    if (directConfirmUrl) {
      msg += `\n📲 *Por favor confirme o solicite reemplazo aquí:*\n${directConfirmUrl}\n`;
    }

    msg += `\n¡Que Jehová bendiga su preparación! 🙏`;
    return msg;
  };

  const handleCopySlip = (slip: S89Slip) => {
    const msg = getWhatsAppMessage(slip);
    navigator.clipboard.writeText(msg);
    setCopiedId(slip.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWhatsApp = (slip: S89Slip) => {
    const student = publishersMap.get(slip.studentId);
    const cleanPhone = student?.phone ? student.phone.replace(/[^0-9]/g, '') : '';
    const msg = encodeURIComponent(getWhatsAppMessage(slip));
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Rellenar y descargar el PDF oficial S-89 cargado por el usuario (o generar instantáneamente si no tiene plantilla)
  const handleDownloadOfficialS89Pdf = async () => {
    if (filteredSlips.length === 0) {
      showToast('No hay asignaciones estudiantiles en la semana seleccionada para generar las hojas S-89.', 'error');
      return;
    }

    try {
      const stored = await getLocalOfficialFormBytes('S-89');
      if (stored) {
        const filledBytes = await fillOfficialS89Pdf(stored.bytes, filteredSlips);
        const outFileName = `S-89_Semana_${activeWeek?.weekStartDate || 'VMC'}.pdf`;
        downloadPdfBytesLocally(filledBytes, outFileName);
        showToast(`Hojas oficiales "${outFileName}" rellenadas con plantilla oficial y descargadas.`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Plantilla S-89 oficial no disponible o incompatible, usando generador nativo:', err);
    }

    // Fallback instantáneo 1-clic: genera las hojas S-89 con formato idéntico de alta fidelidad sin bloquear al usuario
    try {
      generateS89PdfFromSlips(
        filteredSlips,
        settings.congregationName || 'Congregación',
        activeWeek?.weekStartDate || activeWeek?.midweek?.date || 'VMC',
        settings.pdfPageSize || 'letter',
        settings.pdfOrientation || 'portrait'
      );
      showToast('Hojas S-89 generadas y descargadas con éxito. (Tip: Puedes cargar tu plantilla oficial S-89 en Formatos).', 'success');
    } catch (genErr) {
      console.error('Error generando S-89 en PDF:', genErr);
      showToast('Ocurrió un error al generar las hojas S-89 en PDF.', 'error');
    }
  };

  const handleAdvanceLesson = (studentId: string, currentLessonNum: number) => {
    const nextNum = Math.min(20, currentLessonNum + 1);
    advancePublisherLesson(studentId, nextNum, 'Lección completada con éxito en la reunión');
    setFeedbackNote({
      id: studentId,
      text: `¡Aprobada! Avanzó a Lección #${nextNum}`,
    });
    setTimeout(() => setFeedbackNote(null), 3000);
  };

  const handleRepeatLesson = (studentId: string, currentLessonNum: number) => {
    repeatPublisherLesson(studentId, `Continuar trabajando en Lección #${currentLessonNum}`);
    setFeedbackNote({
      id: studentId,
      text: `Registrado: Continuar en Lección #${currentLessonNum}`,
    });
    setTimeout(() => setFeedbackNote(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Barra de Acciones de Hojas S-89 (Bento Container) */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 space-y-3.5 shadow-sm relative overflow-hidden transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Toggle between Cards view and Local Official PDF Filler */}
          <div className="grid grid-cols-2 sm:inline-flex p-1.5 bg-zinc-100/90 dark:bg-zinc-800/70 rounded-2xl text-xs font-bold gap-1.5 w-full sm:w-auto border border-zinc-200/80 dark:border-white/10 backdrop-blur-md">
            <button
              onClick={() => setPrintLayout('cards')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer text-center truncate ${
                printLayout === 'cards'
                  ? 'bg-white dark:bg-indigo-600 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-black'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Tarjetas & Lecciones
            </button>
            <button
              onClick={() => setPrintLayout('formato_local')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                printLayout === 'formato_local'
                  ? 'bg-white dark:bg-indigo-600 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-black'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Plantilla PDF S-89</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={syncAllWeeksToIndexedDb}
              disabled={isSyncingOffline}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Sincronizar y respaldar todas las asignaciones S-89 en IndexedDB para uso sin conexión"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-mono tabular-nums">
                {isSyncingOffline
                  ? 'Sincronizando...'
                  : `Offline (${offlineStats?.totalCachedSlips || rawSlips.length})`}
              </span>
              <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
            </button>

            {activeWeek && (
              <button
                onClick={() => setIsBatchWhatsAppOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold transition-all cursor-pointer truncate shadow-xs active:scale-95"
                title="Abrir panel de envío masivo de WhatsApp para toda la semana"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Recordatorios WhatsApp</span>
              </button>
            )}

            <button
              onClick={handleDownloadOfficialS89Pdf}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black transition-all shadow-sm shadow-indigo-600/20 cursor-pointer truncate active:scale-95"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">Descargar S-89 PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Selector Bar & Filters (Bento Container) */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 shadow-sm transition-all">
        {/* Navigation */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (currentWeekIndex > 0) {
                setCurrentWeekId(sortedWeeks[currentWeekIndex - 1].id);
              }
            }}
            disabled={currentWeekIndex <= 0}
            className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center px-3 py-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-white/5">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Semana Seleccionada
            </span>
            <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white font-mono tabular-nums">
              {activeWeek ? `${activeWeek.weekStartDate} al ${activeWeek.weekEndDate}` : '—'}
            </span>
          </div>

          <button
            onClick={() => {
              if (currentWeekIndex < sortedWeeks.length - 1) {
                setCurrentWeekId(sortedWeeks[currentWeekIndex + 1].id);
              }
            }}
            disabled={currentWeekIndex >= sortedWeeks.length - 1}
            className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Room & Status Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-zinc-500 dark:text-zinc-400 font-bold">Sala:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 text-xs font-bold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="todos">Todas las salas</option>
              <option value="principal">Sala Principal</option>
              <option value="auxiliar">Sala Auxiliar</option>
            </select>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-mono tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>{filteredSlips.length}</span> asignaciones S-89 generadas
          </div>
        </div>
      </div>

      {/* Main Content: Either Local Official Form Filler or Individual Cards View */}
      {printLayout === 'formato_local' ? (
        <LocalOfficialFormsCenter
          initialFormCode="S-89"
          initialWeekId={activeWeek?.id}
          compactHeader={true}
        />
      ) : filteredSlips.length === 0 ? (
        <div className="kg-card-bento kg-glass-surface rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-12 text-center transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-zinc-900 dark:text-white mb-1.5">
            No hay asignaciones para estudiantes en esta semana
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-4 leading-relaxed">
            Asigne estudiantes a la Lectura de la Biblia o a las partes de Seamos Mejores Maestros en el
            Programa de la Reunión para rellenar automáticamente el formato oficial S-89.
          </p>
        </div>
      ) : printLayout === 'sheet4' ? (
        /* PRINT-READY 4-UP SHEET (Standard S-89 Official Paper Layout) */
        <div className="kg-card-bento kg-glass-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-x-auto transition-colors">
          <div className="text-center mb-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Vista previa de impresión en hoja tamaño carta / A4 (4 formularios S-89 por página).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto print:grid-cols-2 print:gap-4 print:p-0">
            {filteredSlips.map((slip) => (
              <div
                key={slip.id}
                className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-white/20 p-5 rounded-2xl text-zinc-900 dark:text-white relative print:border-black print:text-black print:bg-white shadow-xs"
              >
                {/* Official S-89 Title */}
                <div className="border-b-2 border-zinc-800 dark:border-white/20 pb-2.5 mb-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <span className="font-mono tabular-nums">S-89-S</span>
                    <span className="font-mono tabular-nums">11/23</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black uppercase text-center tracking-tight leading-tight mt-1">
                    ASIGNACIÓN PARA LA REUNIÓN
                    <br />
                    VIDA Y MINISTERIO CRISTIANOS
                  </h4>
                </div>

                {/* S-89 Form Fields */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Nombre: </span>
                    <span className="font-black text-zinc-900 dark:text-white border-b border-dotted border-zinc-400 dark:border-zinc-600 pb-0.5 px-1 inline-block min-w-[120px] sm:min-w-[180px] break-words">
                      {slip.studentName}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Ayudante: </span>
                    <span className="text-zinc-800 dark:text-zinc-200 border-b border-dotted border-zinc-400 dark:border-zinc-600 pb-0.5 px-1 inline-block min-w-[120px] sm:min-w-[180px] break-words">
                      {slip.assistantName || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">Fecha: </span>
                      <span className="font-semibold text-zinc-900 dark:text-white font-mono tabular-nums">{slip.date}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">Parte núm.: </span>
                      <span className="font-semibold text-zinc-900 dark:text-white font-mono tabular-nums">{slip.partNumber}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Título de la parte:</span>
                    <p className="font-semibold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl border border-zinc-200/80 dark:border-white/10 text-[11px] mt-1">
                      {slip.partTitle}
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Se presentará en:</span>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <SplashCheckbox
                        size="sm"
                        readOnly
                        checked={slip.room === 'principal'}
                        label="Sala Principal"
                      />
                      <SplashCheckbox
                        size="sm"
                        readOnly
                        checked={slip.room === 'auxiliar'}
                        label="Sala Auxiliar"
                      />
                    </div>
                  </div>

                  {slip.lessonNumber && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-white/10 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                      <span>Punto de consejo:</span>
                      <span className="font-mono tabular-nums">Lección {slip.lessonNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* INDIVIDUAL CARDS VIEW WITH FAST SHARING & LESSON PROGRESS (Bento Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSlips.map((slip) => {
            const student = publishersMap.get(slip.studentId);
            const currentLessonNum = slip.lessonNumber || student?.currentLessonNumber || 1;
            const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === currentLessonNum);
            const isConfirmed = slip.deliveredStatus === 'confirmada';
            const feedback = feedbackNote && feedbackNote.id === slip.studentId ? feedbackNote.text : null;

            return (
              <div
                key={slip.id}
                className="kg-card-bento kg-glass-surface kg-sheen-top rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/60 p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-white/10 pb-3 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-xs text-indigo-600 dark:text-indigo-400 font-mono tabular-nums shrink-0 shadow-xs">
                        Nº {slip.partNumber}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          S-89 Oficial
                        </span>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white line-clamp-1">
                          {slip.partTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSlipDelivered(slip)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-white/10'
                        }`}
                        title="Cambiar estado de entrega/confirmación (persistido en IndexedDB Offline)"
                      >
                        {isConfirmed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                        <span>{isConfirmed ? 'Entregada' : 'Pendiente'}</span>
                      </button>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          slip.room === 'auxiliar'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {slip.room === 'auxiliar' ? 'Sala Aux' : 'Sala Ppal'}
                      </span>
                    </div>
                  </div>

                  {/* Student & Assistant details */}
                  <div className="space-y-2 text-xs mb-3.5">
                    <div className="flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/60 dark:border-white/5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase tracking-wider">
                            Estudiante
                          </span>
                          <span className="font-black text-zinc-900 dark:text-white text-xs truncate block">
                            {slip.studentName}
                          </span>
                        </div>
                      </div>
                      {student?.phone && (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums shrink-0 font-medium">
                          {student.phone}
                        </span>
                      )}
                    </div>

                    {slip.assistantName && (
                      <div className="flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase tracking-wider">
                              Ayudante
                            </span>
                            <span className="font-black text-zinc-900 dark:text-white text-xs truncate block">
                              {slip.assistantName}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 pt-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                      <span>
                        Fecha de la reunión: <strong className="text-zinc-900 dark:text-white font-mono tabular-nums">{slip.date}</strong>
                      </span>
                    </div>
                  </div>

                  {/* SMART LESSON PROGRESS TRACKING BOX */}
                  <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50 mb-3.5 space-y-2.5 shadow-xs">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-300 font-black text-xs">
                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Lección <span className="font-mono tabular-nums">#{currentLessonNum}</span>:</span>
                      </div>
                      {student && (
                        <button
                          onClick={() => setHistoryStudent(student)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <History className="w-3 h-3" /> Historial
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                      {lessonObj?.title || 'Lectura eficaz y enseñanza'}
                    </p>

                    {feedback && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black text-center animate-in fade-in">
                        {feedback}
                      </div>
                    )}

                    {/* Counselor Assessment Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleAdvanceLesson(slip.studentId, currentLessonNum)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Marcar lección como aprobada y avanzar a la siguiente lección del folleto Maestros"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar (<span className="font-mono tabular-nums">#{Math.min(20, currentLessonNum + 1)}</span>)</span>
                      </button>

                      <button
                        onClick={() => handleRepeatLesson(slip.studentId, currentLessonNum)}
                        className="py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="Indicar que el estudiante volverá a trabajar en esta misma lección en su próxima intervención"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Repetir</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: WhatsApp & Copy S-89 */}
                <div className="border-t border-zinc-100 dark:border-white/10 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopySlip(slip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="Copiar texto formal con enlace para WhatsApp"
                  >
                    {copiedId === slip.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copiar S-89</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(slip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black transition-all cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-95"
                    title="Abrir WhatsApp para enviar hoja de asignación con enlace de confirmación directo"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batch WhatsApp Modal */}
      {activeWeek && (
        <BatchWhatsAppModal
          isOpen={isBatchWhatsAppOpen}
          onClose={() => setIsBatchWhatsAppOpen(false)}
          week={activeWeek}
        />
      )}

      {/* Student Lesson History Modal */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setHistoryStudent(null)} />
          <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur-md">
              <div>
                <span className="text-[10px] uppercase font-black text-indigo-600 dark:text-indigo-400 tracking-wider block">
                  Historial de Lecciones Folleto Maestros
                </span>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">{historyStudent.name}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Lección actual asignada: <strong className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">#{historyStudent.currentLessonNumber || 1}</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {historyStudent.lessonsHistory && historyStudent.lessonsHistory.length > 0 ? (
                historyStudent.lessonsHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/80 flex items-start justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black font-mono tabular-nums border border-indigo-200/60 dark:border-indigo-800/50">
                          Lección #{rec.lessonNumber}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{rec.lessonTitle}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono tabular-nums">📅 {rec.date}</p>
                      {rec.notes && <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 italic bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-xl">“{rec.notes}”</p>}
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 border ${
                        rec.status === 'completada'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {rec.status === 'completada' ? 'Aprobada' : 'Continuar'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs leading-relaxed">
                  Aún no hay registros previos en el historial de este estudiante. Se iniciará en la Lección #1.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/60 text-right backdrop-blur-md">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
