// src/components/S89SlipsTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { S89Slip, Publisher } from '../types';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import { generateConfirmationUrl } from '../utils/whatsapp';
import { BatchWhatsAppModal } from './BatchWhatsAppModal';
import { SplashCheckbox } from './SplashCheckbox';
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
} from 'lucide-react';
import { LocalOfficialFormsCenter } from './LocalOfficialFormsCenter';

export const S89SlipsTab: React.FC = () => {
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
  const rawSlips = useMemo(() => {
    if (!activeWeek) return [];
    return getS89SlipsForWeek(activeWeek);
  }, [activeWeek, getS89SlipsForWeek]);

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
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
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
      {/* Header and Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Formulario S-89 Oficial
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Seguimiento de Lecciones del Folleto Maestros
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hojas de Asignación para Estudiantes (S-89)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generación oficial para imprimir en 4x1 o enviar por WhatsApp con enlace de confirmación y registro de lecciones.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Batch WhatsApp modal button */}
          {activeWeek && (
            <button
              onClick={() => setIsBatchWhatsAppOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              title="Abrir panel de envío masivo de WhatsApp para toda la semana"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Recordatorios WhatsApp</span>
            </button>
          )}

          {/* Toggle between 4-per-page grid print, Cards view, and Local Official PDF Filler */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold flex-wrap">
            <button
              onClick={() => setPrintLayout('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                printLayout === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tarjetas & Lecciones
            </button>
            <button
              onClick={() => setPrintLayout('sheet4')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                printLayout === 'sheet4'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoja Impresión 4x1
            </button>
            <button
              onClick={() => setPrintLayout('formato_local')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                printLayout === 'formato_local'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PDF S-89 Oficial (Local)</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Week Selector Bar & Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentWeekIndex > 0) {
                setCurrentWeekId(sortedWeeks[currentWeekIndex - 1].id);
              }
            }}
            disabled={currentWeekIndex <= 0}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center px-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              Semana Seleccionada
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
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
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Room & Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sala:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <option value="todos">Todas las salas</option>
              <option value="principal">Sala Principal</option>
              <option value="auxiliar">Sala Auxiliar</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-800">{filteredSlips.length}</span> asignaciones S-89 generadas
          </div>
        </div>
      </div>

      {/* Main Content: Either Individual Cards View or Sheet 4x1 View */}
      {filteredSlips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No hay asignaciones para estudiantes en esta semana
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Asigne estudiantes a la Lectura de la Biblia o a las partes de Seamos Mejores Maestros en el
            Programa de la Reunión para generar automáticamente sus hojas S-89.
          </p>
        </div>
      ) : printLayout === 'formato_local' ? (
        <LocalOfficialFormsCenter
          initialFormCode="S-89"
          initialWeekId={activeWeek?.id}
          compactHeader={true}
        />
      ) : printLayout === 'sheet4' ? (
        /* PRINT-READY 4-UP SHEET (Standard S-89 Official Paper Layout) */
        <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 overflow-x-auto">
          <div className="text-center mb-4">
            <p className="text-xs text-slate-500">
              Vista previa de impresión en hoja tamaño carta / A4 (4 formularios S-89 por página).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto print:grid-cols-2 print:gap-4 print:p-0">
            {filteredSlips.map((slip) => (
              <div
                key={slip.id}
                className="bg-white border-2 border-dashed border-slate-400 p-4 rounded-xl shadow-xs text-slate-900 relative print:border-black print:shadow-none"
              >
                {/* Official S-89 Title */}
                <div className="border-b-2 border-slate-800 pb-2 mb-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span>S-89-S</span>
                    <span>11/23</span>
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
                    <span className="font-bold text-slate-700">Nombre: </span>
                    <span className="font-extrabold text-slate-900 border-b border-dotted border-slate-400 pb-0.5 px-1 inline-block min-w-[180px]">
                      {slip.studentName}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700">Ayudante: </span>
                    <span className="text-slate-800 border-b border-dotted border-slate-400 pb-0.5 px-1 inline-block min-w-[180px]">
                      {slip.assistantName || '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="font-bold text-slate-700">Fecha: </span>
                      <span className="font-semibold text-slate-900">{slip.date}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Parte núm.: </span>
                      <span className="font-semibold text-slate-900">{slip.partNumber}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-slate-700">Título de la parte:</span>
                    <p className="font-semibold text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px] mt-0.5">
                      {slip.partTitle}
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold text-slate-700 block mb-1">Se presentará en:</span>
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
                    <div className="pt-2 border-t border-slate-200 text-[11px] font-semibold text-indigo-900">
                      Punto de consejo: Lección {slip.lessonNumber}
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
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700">
                        Nº {slip.partNumber}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          S-89 Oficial
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {slip.partTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          slip.room === 'auxiliar'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {slip.room === 'auxiliar' ? 'Sala Aux' : 'Sala Ppal'}
                      </span>
                    </div>
                  </div>

                  {/* Student & Assistant details */}
                  <div className="space-y-2 text-xs mb-3">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">
                            Estudiante
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {slip.studentName}
                          </span>
                        </div>
                      </div>
                      {student?.phone && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {student.phone}
                        </span>
                      )}
                    </div>

                    {slip.assistantName && (
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Ayudante
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {slip.assistantName}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-600 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Fecha de la reunión: <strong className="text-slate-900">{slip.date}</strong>
                      </span>
                    </div>
                  </div>

                  {/* SMART LESSON PROGRESS TRACKING BOX */}
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 mb-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Lección #{currentLessonNum}:</span>
                      </div>
                      {student && (
                        <button
                          onClick={() => setHistoryStudent(student)}
                          className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          <History className="w-3 h-3" /> Historial
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {lessonObj?.title || 'Lectura eficaz y enseñanza'}
                    </p>

                    {feedback && (
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold text-center animate-in fade-in">
                        {feedback}
                      </div>
                    )}

                    {/* Counselor Assessment Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleAdvanceLesson(slip.studentId, currentLessonNum)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors flex items-center justify-center gap-1"
                        title="Marcar lección como aprobada y avanzar a la siguiente lección del folleto Maestros"
                      >
                        <Check className="w-3 h-3" />
                        <span>Aprobar (#{Math.min(20, currentLessonNum + 1)})</span>
                      </button>

                      <button
                        onClick={() => handleRepeatLesson(slip.studentId, currentLessonNum)}
                        className="py-1.5 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        title="Indicar que el estudiante volverá a trabajar en esta misma lección en su próxima intervención"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Repetir</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: WhatsApp & Copy S-89 */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopySlip(slip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                    title="Copiar texto formal con enlace para WhatsApp"
                  >
                    {copiedId === slip.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar S-89</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(slip)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600">
                  Historial de Lecciones Folleto Maestros
                </span>
                <h3 className="text-base font-bold text-slate-900">{historyStudent.name}</h3>
                <p className="text-xs text-slate-500">
                  Lección actual asignada: <strong>#{historyStudent.currentLessonNumber || 1}</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {historyStudent.lessonsHistory && historyStudent.lessonsHistory.length > 0 ? (
                historyStudent.lessonsHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                          Lección #{rec.lessonNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{rec.lessonTitle}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">📅 {rec.date}</p>
                      {rec.notes && <p className="text-xs text-slate-600 mt-0.5 italic">{rec.notes}</p>}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        rec.status === 'completada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status === 'completada' ? 'Aprobada' : 'Continuar'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aún no hay registros previos en el historial de este estudiante. Se iniciará en la Lección #1.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
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
