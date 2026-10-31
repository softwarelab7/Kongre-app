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

  // Rellenar y descargar el PDF oficial S-89 cargado por el usuario
  const handleDownloadOfficialS89Pdf = async () => {
    const stored = await getLocalOfficialFormBytes('S-89');
    if (!stored) {
      setPrintLayout('formato_local');
      showToast(
        'Carga primero tu archivo oficial S-89.pdf descargado de JW Hub para que la aplicación lo rellene y puedas descargarlo.',
        'info'
      );
      return;
    }

    if (filteredSlips.length === 0) {
      showToast('No hay asignaciones estudiantiles en la semana seleccionada para rellenar en el S-89.', 'error');
      return;
    }

    try {
      const filledBytes = await fillOfficialS89Pdf(stored.bytes, filteredSlips);
      const outFileName = `S-89_Semana_${activeWeek?.weekStartDate || 'VMC'}.pdf`;
      downloadPdfBytesLocally(filledBytes, outFileName);
      showToast(`Hojas oficiales "${outFileName}" rellenadas y descargadas.`, 'success');
    } catch (err) {
      console.error('Error rellenando S-89 oficial:', err);
      setPrintLayout('formato_local');
      showToast('Verifica o vuelve a cargar tu plantilla oficial S-89.pdf.', 'error');
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
    <div className="space-y-6">
      {/* Barra de Acciones de Hojas S-89 */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] space-y-3 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Toggle between Cards view and Local Official PDF Filler */}
          <div className="grid grid-cols-2 sm:inline-flex p-1 bg-zinc-100 dark:bg-[#18181F] rounded-xl text-xs font-semibold gap-1 w-full sm:w-auto border border-zinc-200/80 dark:border-[#27272A]">
            <button
              onClick={() => setPrintLayout('cards')}
              className={`px-3 py-2 rounded-lg transition-all cursor-pointer text-center truncate ${
                printLayout === 'cards'
                  ? 'bg-white dark:bg-[#121216] text-indigo-700 dark:text-[#F4F4F5] shadow-xs font-bold border border-zinc-200/80 dark:border-[#27272A]'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
              }`}
            >
              Tarjetas & Lecciones
            </button>
            <button
              onClick={() => setPrintLayout('formato_local')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                printLayout === 'formato_local'
                  ? 'bg-white dark:bg-[#121216] text-indigo-700 dark:text-[#F4F4F5] shadow-xs font-bold border border-zinc-200/80 dark:border-[#27272A]'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Plantilla PDF S-89</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={syncAllWeeksToIndexedDb}
              disabled={isSyncingOffline}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
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
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold transition-all cursor-pointer truncate"
                title="Abrir panel de envío masivo de WhatsApp para toda la semana"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Recordatorios WhatsApp</span>
              </button>
            )}

            <button
              onClick={handleDownloadOfficialS89Pdf}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer truncate"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">Descargar S-89 PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Selector Bar & Filters */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentWeekIndex > 0) {
                setCurrentWeekId(sortedWeeks[currentWeekIndex - 1].id);
              }
            }}
            disabled={currentWeekIndex <= 0}
            className="p-2 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-700 dark:text-[#F4F4F5] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center px-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Semana Seleccionada
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
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
            className="p-2 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-700 dark:text-[#F4F4F5] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Room & Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 dark:text-[#A1A1AA]" />
            <span className="text-zinc-500 dark:text-[#A1A1AA] font-medium">Sala:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs font-semibold text-zinc-700 dark:text-[#F4F4F5] focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="todos">Todas las salas</option>
              <option value="principal">Sala Principal</option>
              <option value="auxiliar">Sala Auxiliar</option>
            </select>
          </div>

          <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            <span className="font-bold text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{filteredSlips.length}</span> asignaciones S-89 generadas
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
        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-12 text-center transition-colors">
          <FileText className="w-12 h-12 text-zinc-300 dark:text-[#27272A] mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1">
            No hay asignaciones para estudiantes en esta semana
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-md mx-auto mb-4">
            Asigne estudiantes a la Lectura de la Biblia o a las partes de Seamos Mejores Maestros en el
            Programa de la Reunión para rellenar automáticamente el formato oficial S-89.
          </p>
        </div>
      ) : printLayout === 'sheet4' ? (
        /* PRINT-READY 4-UP SHEET (Standard S-89 Official Paper Layout) */
        <div className="bg-zinc-100 dark:bg-[#18181F] p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-[#27272A] overflow-x-auto transition-colors">
          <div className="text-center mb-4">
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Vista previa de impresión en hoja tamaño carta / A4 (4 formularios S-89 por página).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto print:grid-cols-2 print:gap-4 print:p-0">
            {filteredSlips.map((slip) => (
              <div
                key={slip.id}
                className="bg-white dark:bg-[#121216] border-2 border-dashed border-zinc-300 dark:border-[#27272A] p-4 rounded-xl text-zinc-900 dark:text-[#F4F4F5] relative print:border-black print:text-black print:bg-white"
              >
                {/* Official S-89 Title */}
                <div className="border-b-2 border-zinc-800 dark:border-[#27272A] pb-2 mb-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                    <span className="font-mono tabular-nums">S-89-S</span>
                    <span className="font-mono tabular-nums">11/23</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase text-center tracking-tight leading-tight">
                    ASIGNACIÓN PARA LA REUNIÓN
                    <br />
                    VIDA Y MINISTERIO CRISTIANOS
                  </h4>
                </div>

                {/* S-89 Form Fields */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-zinc-700 dark:text-[#A1A1AA]">Nombre: </span>
                    <span className="font-extrabold text-zinc-900 dark:text-[#F4F4F5] border-b border-dotted border-zinc-400 dark:border-[#27272A] pb-0.5 px-1 inline-block min-w-[120px] sm:min-w-[180px] break-words">
                      {slip.studentName}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-zinc-700 dark:text-[#A1A1AA]">Ayudante: </span>
                    <span className="text-zinc-800 dark:text-[#F4F4F5] border-b border-dotted border-zinc-400 dark:border-[#27272A] pb-0.5 px-1 inline-block min-w-[120px] sm:min-w-[180px] break-words">
                      {slip.assistantName || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-[#A1A1AA]">Fecha: </span>
                      <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{slip.date}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-700 dark:text-[#A1A1AA]">Parte núm.: </span>
                      <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{slip.partNumber}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-zinc-700 dark:text-[#A1A1AA]">Título de la parte:</span>
                    <p className="font-semibold text-zinc-900 dark:text-[#F4F4F5] bg-zinc-50 dark:bg-[#18181F] p-1.5 rounded border border-zinc-200 dark:border-[#27272A] text-[11px] mt-0.5">
                      {slip.partTitle}
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">Se presentará en:</span>
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
                    <div className="pt-2 border-t border-zinc-200 dark:border-[#27272A] text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
                      Punto de consejo: Lección <span className="font-mono tabular-nums">{slip.lessonNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* INDIVIDUAL CARDS VIEW WITH FAST SHARING & LESSON PROGRESS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlips.map((slip) => {
            const student = publishersMap.get(slip.studentId);
            const currentLessonNum = slip.lessonNumber || student?.currentLessonNumber || 1;
            const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === currentLessonNum);
            const isConfirmed = slip.deliveredStatus === 'confirmada';
            const feedback = feedbackNote && feedbackNote.id === slip.studentId ? feedbackNote.text : null;

            return (
              <div
                key={slip.id}
                className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-5 flex flex-col justify-between transition-colors"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-[#27272A] pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-400 font-mono tabular-nums">
                        Nº {slip.partNumber}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA]">
                          S-89 Oficial
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] line-clamp-1">
                          {slip.partTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSlipDelivered(slip)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]'
                        }`}
                        title="Cambiar estado de entrega/confirmación (persistido en IndexedDB Offline)"
                      >
                        {isConfirmed ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        <span>{isConfirmed ? 'Entregada' : 'Pendiente'}</span>
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
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
                  <div className="space-y-2 text-xs mb-3">
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-[#18181F] p-2.5 rounded-xl border border-zinc-100 dark:border-[#27272A]">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] block font-semibold">
                            Estudiante
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-xs">
                            {slip.studentName}
                          </span>
                        </div>
                      </div>
                      {student?.phone && (
                        <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                          {student.phone}
                        </span>
                      )}
                    </div>

                    {slip.assistantName && (
                      <div className="flex items-center justify-between bg-zinc-50 dark:bg-[#18181F] p-2.5 rounded-xl border border-zinc-100 dark:border-[#27272A]">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] block font-semibold">
                              Ayudante
                            </span>
                            <span className="font-bold text-zinc-800 dark:text-[#F4F4F5] text-xs">
                              {slip.assistantName}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-zinc-600 dark:text-[#A1A1AA] pt-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-[#A1A1AA] shrink-0" />
                      <span>
                        Fecha de la reunión: <strong className="text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{slip.date}</strong>
                      </span>
                    </div>
                  </div>

                  {/* SMART LESSON PROGRESS TRACKING BOX */}
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-[#18181F] border border-indigo-100 dark:border-[#27272A] mb-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>Lección <span className="font-mono tabular-nums">#{currentLessonNum}</span>:</span>
                      </div>
                      {student && (
                        <button
                          onClick={() => setHistoryStudent(student)}
                          className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <History className="w-3 h-3" /> Historial
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] leading-tight">
                      {lessonObj?.title || 'Lectura eficaz y enseñanza'}
                    </p>

                    {feedback && (
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold text-center animate-in fade-in">
                        {feedback}
                      </div>
                    )}

                    {/* Counselor Assessment Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleAdvanceLesson(slip.studentId, currentLessonNum)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Marcar lección como aprobada y avanzar a la siguiente lección del folleto Maestros"
                      >
                        <Check className="w-3 h-3" />
                        <span>Aprobar (<span className="font-mono tabular-nums">#{Math.min(20, currentLessonNum + 1)}</span>)</span>
                      </button>

                      <button
                        onClick={() => handleRepeatLesson(slip.studentId, currentLessonNum)}
                        className="py-1.5 px-2 rounded-xl bg-white dark:bg-[#121216] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        title="Indicar que el estudiante volverá a trabajar en esta misma lección en su próxima intervención"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Repetir</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: WhatsApp & Copy S-89 */}
                <div className="border-t border-zinc-100 dark:border-[#27272A] pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopySlip(slip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] text-xs font-semibold transition-colors cursor-pointer"
                    title="Copiar texto formal con enlace para WhatsApp"
                  >
                    {copiedId === slip.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-zinc-500 dark:text-[#A1A1AA]" />
                        <span>Copiar S-89</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(slip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121216] rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col border border-zinc-200 dark:border-[#27272A] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#18181F]">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  Historial de Lecciones Folleto Maestros
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">{historyStudent.name}</h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Lección actual asignada: <strong className="font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5]">#{historyStudent.currentLessonNumber || 1}</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 rounded-lg text-zinc-400 dark:text-[#A1A1AA] hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#27272A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {historyStudent.lessonsHistory && historyStudent.lessonsHistory.length > 0 ? (
                historyStudent.lessonsHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono tabular-nums">
                          Lección #{rec.lessonNumber}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5]">{rec.lessonTitle}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-1 font-mono tabular-nums">📅 {rec.date}</p>
                      {rec.notes && <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] mt-0.5 italic">{rec.notes}</p>}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
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
                <div className="text-center py-8 text-zinc-400 dark:text-[#A1A1AA] text-xs">
                  Aún no hay registros previos en el historial de este estudiante. Se iniciará en la Lección #1.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-100 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-right">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-[#27272A] text-white text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-[#323238] cursor-pointer"
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
