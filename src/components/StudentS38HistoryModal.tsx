import React, { useState, useMemo } from 'react';
import type { Publisher, ClmPrograma, WeekSchedule, StudentLessonRecord } from '../types';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import {
  X,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  User,
  History,
  Printer,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';

export interface StudentHistoryModalProps {
  publisher: Publisher;
  isOpen: boolean;
  onClose: () => void;
  allWeeks?: WeekSchedule[];
  clmProgramas?: Record<string, ClmPrograma>;
  onAdvanceLesson?: (publisherId: string, nextLessonNumber?: number, notes?: string) => void;
  onRepeatLesson?: (publisherId: string, notes?: string) => void;
  onUpdatePublisher?: (updated: Publisher) => void;
}

export interface StudentAssignmentHistoryEntry {
  id: string;
  date: string;
  title: string;
  type: string;
  role: 'titular' | 'ayudante';
  room: 'principal' | 'auxiliar';
  partnerName?: string;
  lessonNumber?: number;
  lessonTitle?: string;
  lessonStatus?: 'completada' | 'continuar' | 'pendiente';
}

export const StudentS38HistoryModal: React.FC<StudentHistoryModalProps> = ({
  publisher,
  isOpen,
  onClose,
  allWeeks = [],
  clmProgramas = {},
  onAdvanceLesson,
  onRepeatLesson,
  onUpdatePublisher,
}) => {
  const [activeTab, setActiveTab] = useState<'s38' | 'history' | 'print'>('s38');
  const [selectedLessonForDetail, setSelectedLessonForDetail] = useState<number | null>(null);
  const [customNote, setCustomNote] = useState('');

  const currentLessonNum = publisher.currentLessonNumber || 1;
  const currentLessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === currentLessonNum);

  // Recopilar todo el historial de participaciones del estudiante
  const assignmentHistory = useMemo(() => {
    const list: StudentAssignmentHistoryEntry[] = [];
    const pubId = publisher.id;
    const pubNid = publisher.nid || '';
    const pubName = (publisher.full_name || publisher.name || '').toLowerCase().trim();

    const matchesPub = (idOrNid?: string | null, name?: string | null) => {
      if (idOrNid && (idOrNid === pubId || (pubNid && idOrNid === pubNid))) return true;
      if (name && name.toLowerCase().trim() === pubName) return true;
      return false;
    };

    // 1. Explorar clmProgramas
    Object.values(clmProgramas).forEach((prog) => {
      if (!prog || !prog.partes) return;
      prog.partes.forEach((parte) => {
        // Es titular
        if (matchesPub(parte.asignado_nid, parte.asignado_nombre)) {
          list.push({
            id: `${prog.semana_fecha}_${parte.id}_main`,
            date: prog.semana_fecha,
            title: parte.titulo,
            type: parte.tipo,
            role: 'titular',
            room: parte.es_clase_auxiliar ? 'auxiliar' : 'principal',
            partnerName: parte.asignado_auxiliar_nombre || undefined,
            lessonNumber: parte.leccion_numero,
            lessonTitle: parte.leccion_titulo,
            lessonStatus: parte.leccion_estado || 'pendiente',
          });
        }
        // Es ayudante
        else if (matchesPub(parte.asignado_auxiliar_nid, parte.asignado_auxiliar_nombre)) {
          list.push({
            id: `${prog.semana_fecha}_${parte.id}_aux`,
            date: prog.semana_fecha,
            title: parte.titulo,
            type: parte.tipo,
            role: 'ayudante',
            room: parte.es_clase_auxiliar ? 'auxiliar' : 'principal',
            partnerName: parte.asignado_nombre || undefined,
            lessonNumber: parte.leccion_numero,
            lessonTitle: parte.leccion_titulo,
            lessonStatus: 'pendiente',
          });
        }
      });
    });

    // 2. Explorar allWeeks (para compatibilidad completa con el resto del sistema)
    allWeeks.forEach((week) => {
      const mw = week.midweek;
      if (!mw) return;

      // Lectura biblica Principal
      if (matchesPub(mw.tesoros?.lecturaBiblia?.publisherId)) {
        const existingKey = `${week.weekStartDate}_lectura_main`;
        if (!list.some((l) => l.date === week.weekStartDate && l.type.includes('lectura') && l.room === 'principal')) {
          list.push({
            id: existingKey,
            date: week.weekStartDate,
            title: mw.tesoros?.lecturaBiblia?.title || 'Lectura de la Biblia',
            type: 'lectura_biblica',
            role: 'titular',
            room: 'principal',
            lessonNumber: mw.tesoros?.lecturaBiblia?.lessonNumber,
            lessonStatus: 'pendiente',
          });
        }
      }

      // Lectura biblica Sala Auxiliar
      if (matchesPub(mw.tesoros?.lecturaBibliaAux?.publisherId)) {
        const existingKey = `${week.weekStartDate}_lectura_aux`;
        if (!list.some((l) => l.date === week.weekStartDate && l.type.includes('lectura') && l.room === 'auxiliar')) {
          list.push({
            id: existingKey,
            date: week.weekStartDate,
            title: mw.tesoros?.lecturaBibliaAux?.title || 'Lectura de la Biblia (Sala Auxiliar)',
            type: 'lectura_biblica',
            role: 'titular',
            room: 'auxiliar',
            lessonNumber: mw.tesoros?.lecturaBibliaAux?.lessonNumber,
            lessonStatus: 'pendiente',
          });
        }
      }

      // Demostraciones de Seamos Mejores Maestros
      mw.maestros?.items?.forEach((demo, idx) => {
        if (matchesPub(demo.publisherId)) {
          if (!list.some((l) => l.date === week.weekStartDate && l.title === demo.title && l.role === 'titular')) {
            list.push({
              id: `${week.weekStartDate}_demo_${idx}_tit`,
              date: week.weekStartDate,
              title: demo.title,
              type: 'demostracion',
              role: 'titular',
              room: demo.room === 'auxiliar' ? 'auxiliar' : 'principal',
              partnerName: demo.assistantId ? 'Hermano asignado' : undefined,
              lessonNumber: demo.lessonNumber,
              lessonStatus: 'pendiente',
            });
          }
        } else if (matchesPub(demo.assistantId)) {
          if (!list.some((l) => l.date === week.weekStartDate && l.title === demo.title && l.role === 'ayudante')) {
            list.push({
              id: `${week.weekStartDate}_demo_${idx}_aux`,
              date: week.weekStartDate,
              title: demo.title,
              type: 'demostracion',
              role: 'ayudante',
              room: demo.room === 'auxiliar' ? 'auxiliar' : 'principal',
              partnerName: 'Titular',
              lessonNumber: demo.lessonNumber,
              lessonStatus: 'pendiente',
            });
          }
        }
      });
    });

    // Ordenar de más reciente a más antiguo
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [publisher, clmProgramas, allWeeks]);

  // Estadísticas del estudiante
  const stats = useMemo(() => {
    const totalMain = assignmentHistory.filter((a) => a.role === 'titular').length;
    const totalAssistant = assignmentHistory.filter((a) => a.role === 'ayudante').length;
    const lastAssignment = assignmentHistory[0];

    let weeksAgoText = 'Sin intervenciones recientes';
    if (lastAssignment) {
      const today = new Date();
      const lastDate = new Date(lastAssignment.date);
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks <= 0) {
        weeksAgoText = 'Esta semana o reciente';
      } else if (diffWeeks === 1) {
        weeksAgoText = 'Hace 1 semana';
      } else {
        weeksAgoText = `Hace ${diffWeeks} semanas`;
      }
    }

    const completedLessons = (publisher.lessonsHistory || []).filter(
      (l) => l.status === 'completada'
    );
    const uniqueCompletedNumbers = new Set(completedLessons.map((l) => l.lessonNumber));

    return {
      totalMain,
      totalAssistant,
      totalAll: assignmentHistory.length,
      lastAssignment,
      weeksAgoText,
      completedCount: uniqueCompletedNumbers.size,
      progressPercent: Math.round((uniqueCompletedNumbers.size / 20) * 100),
    };
  }, [assignmentHistory, publisher]);

  // Manejo de cambio manual de lección actual
  const handleSelectCurrentLesson = (num: number) => {
    if (!onUpdatePublisher) return;
    const updated: Publisher = {
      ...publisher,
      currentLessonNumber: num,
    };
    onUpdatePublisher(updated);
  };

  // Manejo de marcar lección completada desde el modal
  const handleMarkLessonComplete = (num: number) => {
    if (onAdvanceLesson) {
      const nextNum = Math.min(20, num + 1);
      onAdvanceLesson(
        publisher.id,
        nextNum,
        customNote.trim() || `Aprobada lección #${num} en registro S-38`
      );
      setCustomNote('');
      setSelectedLessonForDetail(null);
    } else if (onUpdatePublisher) {
      const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === num);
      const newRecord: StudentLessonRecord = {
        id: `s38-${Date.now()}`,
        lessonNumber: num,
        lessonTitle: lessonObj?.title || `Lección ${num}`,
        date: new Date().toISOString().split('T')[0],
        status: 'completada',
        notes: customNote.trim() || 'Aprobada en registro S-38',
      };
      const existing = publisher.lessonsHistory || [];
      const updated: Publisher = {
        ...publisher,
        currentLessonNumber: Math.min(20, num + 1),
        lessonsHistory: [newRecord, ...existing],
      };
      onUpdatePublisher(updated);
      setCustomNote('');
      setSelectedLessonForDetail(null);
    }
  };

  // Manejo de marcar lección para continuar practicando
  const handleMarkLessonRepeat = (num: number) => {
    if (onRepeatLesson) {
      onRepeatLesson(
        publisher.id,
        customNote.trim() || `Continuar practicando lección #${num}`
      );
      setCustomNote('');
      setSelectedLessonForDetail(null);
    } else if (onUpdatePublisher) {
      const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === num);
      const newRecord: StudentLessonRecord = {
        id: `s38-${Date.now()}`,
        lessonNumber: num,
        lessonTitle: lessonObj?.title || `Lección ${num}`,
        date: new Date().toISOString().split('T')[0],
        status: 'continuar',
        notes: customNote.trim() || 'Continuar practicando en la próxima asignación',
      };
      const existing = publisher.lessonsHistory || [];
      const updated: Publisher = {
        ...publisher,
        lessonsHistory: [newRecord, ...existing],
      };
      onUpdatePublisher(updated);
      setCustomNote('');
      setSelectedLessonForDetail(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Registro oficial S-38 e historial de ${publisher.full_name || publisher.name}`}
    >
      <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* CABECERA BENTO */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-[#18181F]/60 backdrop-blur-md flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/20 dark:border-indigo-500/30 shadow-xs shrink-0 font-mono">
              {publisher.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/20">
                  Registro Oficial S-38 • Folleto Maestros
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {publisher.gender === 'hermana' ? 'Hermana' : 'Hermano'} • {publisher.privilege || 'Publicador'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {publisher.full_name || publisher.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2.5 flex-wrap">
                {publisher.phone && (
                  <span className="font-mono tabular-nums">📞 {publisher.phone}</span>
                )}
                {publisher.groupNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 font-mono tabular-nums">
                    👥 Grupo {publisher.groupNumber}
                  </span>
                )}
                <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  Lección Activa: <strong className="font-mono tabular-nums">#{currentLessonNum}</strong> — {currentLessonObj?.title}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* TARJETAS DE ESTADÍSTICAS RÁPIDAS (BENTO MINI-KPIS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-zinc-100/50 dark:bg-[#18181F]/30 border-b border-zinc-200/60 dark:border-white/[0.06]">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181F]/80 border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20">
                <BookOpen size={12} />
              </span>
              Lección Activa
            </span>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5">
              #{currentLessonNum} <span className="text-xs font-normal text-zinc-400">/ 20</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {currentLessonObj?.title}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181F]/80 border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                <Award size={12} />
              </span>
              Aprobadas (S-38)
            </span>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5">
              {stats.completedCount} <span className="text-xs font-normal text-zinc-400">({stats.progressPercent}%)</span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {20 - stats.completedCount} lecciones pendientes
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181F]/80 border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                <History size={12} />
              </span>
              Intervenciones
            </span>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5">
              {stats.totalAll}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-mono tabular-nums">
              {stats.totalMain} titular • {stats.totalAssistant} ayudante
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181F]/80 border border-zinc-200/80 dark:border-white/[0.08] shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
                <Clock size={12} />
              </span>
              Rotación / Última
            </span>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-2 truncate">
              {stats.weeksAgoText}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-mono tabular-nums">
              {stats.lastAssignment ? `📅 ${stats.lastAssignment.date}` : 'Sin datos'}
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN EN CÁPSULAS SEGMENTADAS (APPLE STYLE) */}
        <div className="px-6 py-3 border-b border-zinc-200/60 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#141418] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="bg-zinc-200/60 dark:bg-white/[0.06] p-1 rounded-2xl border border-zinc-300/40 dark:border-white/[0.08] inline-flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('s38')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 's38'
                  ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Award size={14} />
              <span>Tarjeta S-38 (20 Lecciones)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <History size={14} />
              <span>Historial ({assignmentHistory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('print')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'print'
                  ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Printer size={14} />
              <span>Ficha Imprimible S-38</span>
            </button>
          </div>

          <div className="text-xs text-zinc-400 hidden sm:block font-mono tabular-nums">
            Progreso: {stats.progressPercent}%
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ═══════════ PESTAÑA 1: TARJETA S-38 (20 LECCIONES) ═══════════ */}
          {activeTab === 's38' && (
            <div className="space-y-6">
              {/* Barra de progreso visual con gradiente Apple */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Progreso general del folleto
                  </span>
                  <span className="font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                    {stats.completedCount} de 20 lecciones completadas ({stats.progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${stats.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Matriz interactiva de las 20 Lecciones Oficiales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OFFICIAL_STUDENT_LESSONS.map((lesson) => {
                  const isCurrent = currentLessonNum === lesson.number;
                  const completedRecord = (publisher.lessonsHistory || []).find(
                    (h) => h.lessonNumber === lesson.number && h.status === 'completada'
                  );
                  const isCompleted = !!completedRecord;
                  const repeatRecord = (publisher.lessonsHistory || []).find(
                    (h) => h.lessonNumber === lesson.number && h.status === 'continuar'
                  );

                  return (
                    <div
                      key={lesson.number}
                      className={`kg-card-bento p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/40 dark:border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/30'
                          : isCompleted
                          ? 'bg-emerald-500/[0.07] dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/30'
                          : 'bg-white/80 dark:bg-[#18181F]/70 border-zinc-200/80 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-7 h-7 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0 border ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                  : isCompleted
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
                              }`}
                            >
                              {lesson.number}
                            </span>
                            <h4
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isCurrent
                                  ? 'text-indigo-950 dark:text-indigo-200'
                                  : isCompleted
                                  ? 'text-emerald-950 dark:text-emerald-200'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {lesson.title}
                            </h4>
                          </div>

                          {/* Estado y fechas */}
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px]">
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 font-bold flex items-center gap-1 border border-indigo-500/30">
                                <Sparkles size={11} /> Lección Activa
                              </span>
                            )}

                            {isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30 font-mono tabular-nums">
                                <CheckCircle2 size={11} /> Aprobada ({completedRecord.date})
                              </span>
                            ) : repeatRecord ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 border border-amber-500/30">
                                <RotateCcw size={11} /> Practicar de nuevo
                              </span>
                            ) : !isCurrent ? (
                              <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">
                                Pendiente
                              </span>
                            ) : null}

                            {completedRecord?.notes && (
                              <span className="text-zinc-500 dark:text-zinc-400 italic text-[10px] truncate max-w-[200px]">
                                «{completedRecord.notes}»
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción para esta lección */}
                        <div className="flex flex-col gap-1 shrink-0">
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleSelectCurrentLesson(lesson.number)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                              title="Fijar como lección activa"
                            >
                              Fijar activa
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedLessonForDetail(
                                selectedLessonForDetail === lesson.number ? null : lesson.number
                              )
                            }
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80 transition-colors cursor-pointer"
                          >
                            {selectedLessonForDetail === lesson.number ? 'Ocultar' : 'Evaluar'}
                          </button>
                        </div>
                      </div>

                      {/* Panel de evaluación inline si está seleccionado */}
                      {selectedLessonForDetail === lesson.number && (
                        <div className="w-full mt-2 pt-3 border-t border-zinc-200/80 dark:border-white/10 animate-fade-in">
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                            Comentario del Consejero (opcional):
                          </label>
                          <input
                            type="text"
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            placeholder="Ej. Buen contacto visual y lectura clara..."
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121216] text-zinc-900 dark:text-white mb-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMarkLessonComplete(lesson.number)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <Check size={13} />
                              <span>Aprobar Lección</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkLessonRepeat(lesson.number)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <RotateCcw size={13} />
                              <span>Repetir (Practicar)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ PESTAÑA 2: HISTORIAL DE ASIGNACIONES ═══════════ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Todas las participaciones registradas en el programa de Vida y Ministerio Cristianos.
                </p>
                <span className="text-xs font-bold font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                  Total: {assignmentHistory.length}
                </span>
              </div>

              {assignmentHistory.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
                  <BookOpen size={36} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                  <p className="text-sm font-semibold">No hay intervenciones registradas todavía</p>
                  <p className="text-xs mt-1">
                    Las asignaciones futuras y pasadas se recopilan automáticamente de las semanas guardadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {assignmentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="kg-card-bento p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#18181F]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold font-mono tabular-nums text-zinc-900 dark:text-white flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                            <Calendar size={12} className="text-indigo-500" />
                            {item.date}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.role === 'titular'
                                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                                : 'bg-zinc-200/70 text-zinc-700 dark:bg-white/10 dark:text-zinc-300 border border-zinc-300/40 dark:border-white/10'
                            }`}
                          >
                            {item.role === 'titular' ? '👤 Titular' : '🤝 Ayudante'}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.room === 'auxiliar'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                            }`}
                          >
                            {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1.5">
                          {item.title}
                        </h4>

                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                          {item.partnerName && (
                            <span>
                              {item.role === 'titular' ? 'Ayudante: ' : 'Titular: '}
                              <strong className="text-zinc-700 dark:text-zinc-200">{item.partnerName}</strong>
                            </span>
                          )}

                          {item.lessonNumber && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono tabular-nums">
                              📖 Lección #{item.lessonNumber}: {item.lessonTitle || ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {item.lessonStatus === 'completada' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                            <CheckCircle2 size={12} /> Aprobada
                          </span>
                        ) : item.lessonStatus === 'continuar' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <RotateCcw size={12} /> Continuar
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
                            Realizada
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ PESTAÑA 3: FICHA IMPRIMIBLE S-38 ═══════════ */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Formato oficial S-38 para archivo teocrático del superintendente de reunión.
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Printer size={14} />
                  <span>Imprimir Registro S-38</span>
                </button>
              </div>

              {/* Contenedor imprimible */}
              <div className="p-6 rounded-2xl border border-zinc-300 bg-white text-zinc-900 font-sans shadow-xs printable-s38-card">
                <div className="border-b-2 border-zinc-900 pb-3 mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-extrabold uppercase tracking-wide">
                      REGISTRO DE ASIGNACIONES DE LA REUNIÓN VIDA Y MINISTERIO CRISTIANOS (S-38)
                    </h2>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Folleto: <em>Seamos mejores lectores y maestros</em> (th) / <em>Una guía para nuestro ministerio</em> (lmd)
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">Estudiante: {publisher.full_name || publisher.name}</p>
                    <p className="text-zinc-600">
                      {publisher.gender === 'hermana' ? 'Hermana' : 'Hermano'} • {publisher.privilege || 'Publicador'}
                    </p>
                  </div>
                </div>

                {/* Tabla de 20 Lecciones */}
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-300">
                      <th className="p-2 text-left w-12 font-bold font-mono">Nº</th>
                      <th className="p-2 text-left font-bold">Punto de Consejo (Lección)</th>
                      <th className="p-2 text-center w-28 font-bold">Fecha Asignada</th>
                      <th className="p-2 text-center w-28 font-bold">Fecha Aprobada</th>
                      <th className="p-2 text-left font-bold">Notas / Consejero</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OFFICIAL_STUDENT_LESSONS.map((l) => {
                      const completed = (publisher.lessonsHistory || []).find(
                        (h) => h.lessonNumber === l.number && h.status === 'completada'
                      );
                      const isCur = currentLessonNum === l.number;

                      return (
                        <tr key={l.number} className="border-b border-zinc-200 hover:bg-zinc-50">
                          <td className="p-2 font-bold font-mono">{l.number}</td>
                          <td className="p-2">
                            <span className="font-medium">{l.title}</span>
                            {isCur && (
                              <span className="ml-2 font-bold text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                [ACTUAL]
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center text-zinc-600 font-mono text-[11px]">
                            {/* Buscar si hay asignación asignada */}
                            {assignmentHistory.find((a) => a.lessonNumber === l.number)?.date || '-'}
                          </td>
                          <td className="p-2 text-center font-bold font-mono text-[11px] text-emerald-700">
                            {completed ? completed.date : '-'}
                          </td>
                          <td className="p-2 text-zinc-600 italic text-[11px]">
                            {completed?.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500 font-mono tabular-nums">
                  <span>S-38-S (Registro Teocrático)</span>
                  <span>Generado el: {new Date().toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA DEL MODAL */}
        <div className="px-6 py-3.5 border-t border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-[#18181F]/80 backdrop-blur-md flex items-center justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
            {stats.completedCount} de 20 lecciones completadas • {stats.weeksAgoText}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

