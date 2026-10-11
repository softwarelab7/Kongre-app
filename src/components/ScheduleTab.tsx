// src/components/ScheduleTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import {
  WeekSchedule,
  AssignmentItem,
  AssignmentStatus,
  SpecialEvent,
  Gender,
  Publisher,
} from '../types';
import { AssignmentSelectorModal } from './AssignmentSelectorModal';
import { ReplacementsModal } from './ReplacementsModal';
import { MwbImportModal } from './MwbImportModal';
import { OrganizedImportModal } from './OrganizedImportModal';
import { MeetingTimerModal } from './MeetingTimerModal';
import { BatchWhatsAppModal } from './BatchWhatsAppModal';
import { ClmMonthlyBillboardModal } from './ClmMonthlyBillboardModal';
import { StudentS38HistoryModal } from './StudentS38HistoryModal';
import { ConflictsModal } from './ConflictsModal';
import ClmScheduleView from './ClmScheduleView';
import { SectionHeader } from './SectionHeader';
import { createAssignmentWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek, isWeekNeedingOrganizedSync } from '../utils/organizedSync';
import { createDefaultPrograma } from '../utils/clmDefaultProgram';
import { OFFICIAL_PUBLIC_TALK_OUTLINES, findOutlineByNumber } from '../utils/theocraticData';
import { generateS89Pdf as generateS89PdfFillers } from '../utils/pdfFillers';
import { generateS89Pdf as generateS89PdfLegacy } from '../utils/pdfGenerator';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  Shield,
  Layers,
  Volume2,
  Video,
  Mic,
  Home,
  BookmarkCheck,
  Send,
  Trash2,
  Edit3,
  CalendarCheck,
  AlertOctagon,
  Sparkle,
  BookOpen,
  Timer,
  Music,
  Search,
  Check,
  FileText,
  Award,
  CalendarDays,
  ShieldCheck,
  UserMinus,
  MoreHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';

export const ScheduleTab: React.FC = () => {
  const {
    weeks,
    currentWeek,
    currentWeekId,
    setCurrentWeekId,
    updateWeek,
    addNextWeek,
    copyWeekStructure,
    syncAllWeeksWithOrganized,
    autoAssignCurrentWeek,
    autoAssignAllWeeksInMonth,
    clearWeekAssignments,
    preachingGroups,
    customDuties,
    publishers,
    publishersMap,
    conflicts,
    settings,
    clmProgramas,
    getClmPrograma,
    updateClmPrograma,
    advancePublisherLesson,
    repeatPublisherLesson,
    updatePublisher,
  } = useCongregation();
  const { effectiveRoleInfo } = useAuth();
  const isReadOnly = effectiveRoleInfo.isReadOnly || !effectiveRoleInfo.canEditSchedule;

  const [viewMode, setViewMode] = useState<'all' | 'midweek' | 'weekend'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return (currentWeek?.weekStartDate || new Date().toISOString()).substring(0, 7);
  });

  // Selector modal state
  const [selectorState, setSelectorState] = useState<{
    isOpen: boolean;
    title: string;
    roleKey: string;
    targetGender: Gender | 'any';
    meetingDate: string;
    meetingType: 'midweek' | 'weekend';
    currentAssignedId?: string;
    onSelect: (pid: string, suggestedLessonNumber?: number) => void;
    onClear: () => void;
  }>({
    isOpen: false,
    title: '',
    roleKey: '',
    targetGender: 'any',
    meetingDate: '',
    meetingType: 'midweek',
    onSelect: () => {},
    onClear: () => {},
  });

  const [isBatchWhatsAppOpen, setIsBatchWhatsAppOpen] = useState(false);

  // Replacement modal state
  const [replacementState, setReplacementState] = useState<{
    isOpen: boolean;
    weekId: string;
    meetingType: 'midweek' | 'weekend';
    meetingDate: string;
    assignmentTitle: string;
    assignmentPath: string;
    currentPublisherId?: string;
    currentStatus?: AssignmentStatus;
    roleKey: string;
    targetGender?: Gender | 'any';
  }>({
    isOpen: false,
    weekId: '',
    meetingType: 'midweek',
    meetingDate: '',
    assignmentTitle: '',
    assignmentPath: '',
    roleKey: '',
  });

  // Copy week modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [sourceWeekId, setSourceWeekId] = useState('');

  // Special event modal
  const [isSpecialEventModalOpen, setIsSpecialEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<SpecialEvent['type']>('visita_superintendente');
  const [noMidweek, setNoMidweek] = useState(false);
  const [noWeekend, setNoWeekend] = useState(false);
  const [eventNotes, setEventNotes] = useState('');

  // Guía de Actividades, Catálogo, Timer & Herramientas Unificadas
  const [isMwbModalOpen, setIsMwbModalOpen] = useState(false);
  const [isOrganizedModalOpen, setIsOrganizedModalOpen] = useState(false);
  const [organizedModalTab, setOrganizedModalTab] = useState<'catalogo' | 'importar' | 'bosquejos'>('catalogo');
  const [organizedModalFocus, setOrganizedModalFocus] = useState<'all' | 'midweek' | 'weekend'>('all');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [selectedStudentForS38, setSelectedStudentForS38] = useState<Publisher | null>(null);
  const [isMonthlyBillboardModalOpen, setIsMonthlyBillboardModalOpen] = useState(false);
  const [isConflictsModalOpen, setIsConflictsModalOpen] = useState(false);
  const [isClearWeekAssignmentsModalOpen, setIsClearWeekAssignmentsModalOpen] = useState(false);
  const [clearScope, setClearScope] = useState<'all' | 'midweek' | 'weekend'>('all');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isWeekendEditModalOpen, setIsWeekendEditModalOpen] = useState(false);
  const [weekendEditTab, setWeekendEditTab] = useState<'discurso' | 'atalaya' | 'canciones'>('discurso');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const handleConfirmClearAssignments = async () => {
    if (!currentWeek) return;
    setIsClearWeekAssignmentsModalOpen(false);
    try {
      await clearWeekAssignments(currentWeek.id, clearScope);
      const scopeLabels: Record<string, string> = {
        all: 'todas las asignaciones de las reuniones de la semana',
        midweek: 'los asignados de la reunión de entre semana',
        weekend: 'los asignados de la reunión del fin de semana',
      };
      setToastNotification(`Se quitaron ${scopeLabels[clearScope] || 'las asignaciones'}.`);
      setTimeout(() => setToastNotification(null), 3500);
    } catch {
      setToastNotification('Error al quitar las asignaciones.');
      setTimeout(() => setToastNotification(null), 3500);
    }
  };

  const weekConflictsCount = useMemo(() => {
    if (!currentWeek) return 0;
    const weekPrefix = currentWeek.weekStartDate.substring(0, 7);
    return conflicts.filter((c) => c.weekId === currentWeek.id || c.weekStartDate?.startsWith(weekPrefix)).length;
  }, [conflicts, currentWeek]);

  const handleOpenS38 = () => {
    if (!currentWeek) return;
    const clmProg = getClmPrograma(currentWeek.weekStartDate);
    const studentPart = clmProg?.partes.find(
      (p) => (p.seccion === 'maestros' || p.tipo === 'lectura_biblica') && p.asignado_nid
    );
    const pub = studentPart
      ? publishers.find((p) => (p.nid || p.id) === studentPart.asignado_nid)
      : publishers.find((p) => p.roles.vym_maestros_titular || p.roles.vym_maestros_ayudante) || publishers[0];
    if (pub) {
      setSelectedStudentForS38(pub);
    } else {
      setToastNotification('No hay estudiantes disponibles.');
      setTimeout(() => setToastNotification(null), 3000);
    }
  };

  const handlePrintS89 = () => {
    if (!currentWeek) return;
    const clmProg = getClmPrograma(currentWeek.weekStartDate);
    if (clmProg && clmProg.partes && clmProg.partes.length > 0) {
      generateS89PdfFillers(clmProg, publishers);
      setToastNotification('Hojas oficiales S-89 generadas en PDF.');
    } else {
      generateS89PdfLegacy(currentWeek, publishersMap, settings?.congregationName || 'Congregación');
      setToastNotification('Hojas oficiales S-89 generadas en PDF.');
    }
    setTimeout(() => setToastNotification(null), 3000);
  };

  const handleQuickSyncOrganized = (scope: 'all' | 'midweek' | 'weekend' = 'all') => {
    if (!currentWeek) return;
    const schedule = getOrganizedScheduleForWeek(currentWeek.id, currentWeek.midweek.date);
    if (!schedule) return;
    const updated = applyOrganizedToWeek(currentWeek, schedule, {
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

    const msg =
      scope === 'all'
        ? `⚡ Bosquejos de Entre Semana y Fin de Semana actualizados (${schedule.bibleReading})`
        : scope === 'midweek'
        ? `⚡ Bosquejos Entre Semana actualizados (${schedule.bibleReading})`
        : `⚡ Bosquejo FDS actualizado (#${schedule.weekend.outlineNumber}: ${schedule.weekend.outlineTitle})`;

    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  if (!currentWeek) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <p>No hay semanas programadas.</p>
        <button
          onClick={addNextWeek}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
        >
          Crear Primera Semana
        </button>
      </div>
    );
  }

  // Traer automáticamente bosquejos oficiales al ver la semana si aún no los tiene
  React.useEffect(() => {
    if (!currentWeek) return;
    if (isWeekNeedingOrganizedSync(currentWeek)) {
      const schedule = getOrganizedScheduleForWeek(currentWeek.id, currentWeek.midweek.date);
      if (schedule) {
        const updated = applyOrganizedToWeek(currentWeek, schedule);
        updateWeek(updated);
      }
    }
  }, [currentWeek?.id]);

  // Sorted weeks
  const sortedWeeks = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  const currentIndex = sortedWeeks.findIndex(w => w.id === currentWeekId);

  const goToPreviousWeek = () => {
    if (currentIndex > 0) {
      setCurrentWeekId(sortedWeeks[currentIndex - 1].id);
    }
  };

  const goToNextWeek = () => {
    if (currentIndex < sortedWeeks.length - 1) {
      setCurrentWeekId(sortedWeeks[currentIndex + 1].id);
    } else {
      addNextWeek();
    }
  };

  // Helper to open selector
  const openSelector = (
    title: string,
    roleKey: string,
    targetGender: Gender | 'any',
    meetingDate: string,
    meetingType: 'midweek' | 'weekend',
    currentAssignedId: string | undefined,
    onSelect: (pid: string, suggestedLessonNumber?: number) => void,
    onClear: () => void
  ) => {
    setSelectorState({
      isOpen: true,
      title,
      roleKey,
      targetGender,
      meetingDate,
      meetingType,
      currentAssignedId,
      onSelect,
      onClear,
    });
  };

  // Helper for WhatsApp
  const handleSendWhatsApp = (
    publisherId: string | undefined,
    roleTitle: string,
    meetingType: 'midweek' | 'weekend',
    date: string,
    options?: { assistantName?: string; room?: 'principal' | 'auxiliar'; timeMinutes?: number; isReminder?: boolean }
  ) => {
    if (!publisherId) return;
    const pub = publishersMap.get(publisherId);
    if (!pub) return;

    const message = createAssignmentWhatsAppMessage(pub, currentWeek, roleTitle, meetingType, date, {
      ...options,
      congregationName: settings.congregationName,
    });
    openWhatsAppLink(pub.phone || '', message);
  };

  // Special event save
  const handleSaveSpecialEvent = () => {
    if (!eventTitle.trim()) {
      // Clear special event
      updateWeek({
        ...currentWeek,
        specialEvent: undefined,
      });
    } else {
      updateWeek({
        ...currentWeek,
        specialEvent: {
          isSpecial: true,
          type: eventType,
          title: eventTitle.trim(),
          noMeetingMidweek: noMidweek,
          noMeetingWeekend: noWeekend,
          notes: eventNotes.trim(),
        },
      });
    }
    setIsSpecialEventModalOpen(false);
  };

  // Add Demonstration item in Midweek
  const handleAddDemonstration = () => {
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    const count = updated.midweek.maestros.items.length + 1;
    updated.midweek.maestros.items.push({
      id: `maes-${Date.now()}`,
      title: `Demostración #${count} (3-5 mins)`,
      type: 'vym_maestros_titular',
      timeMinutes: 4,
      room: 'principal',
      status: 'pendiente',
    });
    updateWeek(updated);
  };

  // Remove Demonstration item
  const handleRemoveDemonstration = (index: number) => {
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    updated.midweek.maestros.items.splice(index, 1);
    updateWeek(updated);
  };

  // Add Vida Cristiana part
  const handleAddVidaPart = () => {
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    const count = updated.midweek.vidaCristiana.items.length + 1;
    updated.midweek.vidaCristiana.items.push({
      id: `vida-${Date.now()}`,
      title: `Parte de Vida Cristiana #${count} (15 mins)`,
      type: 'vym_vida_partes',
      timeMinutes: 15,
      status: 'pendiente',
    });
    updateWeek(updated);
  };

  // Remove Vida Cristiana part
  const handleRemoveVidaPart = (index: number) => {
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    updated.midweek.vidaCristiana.items.splice(index, 1);
    updateWeek(updated);
  };


  return (
    <div className="space-y-6">
      {/* SectionHeader Kongre 1 Style con BARRA DE HERRAMIENTAS Y ACCIONES UNIFICADA */}
      <SectionHeader
        icon={Calendar}
        title="Programa de"
        highlightWord="Reuniones"
        subtitle={`Semana: ${currentWeek.weekStartDate} al ${currentWeek.weekEndDate} • Semana ${currentIndex + 1} de ${sortedWeeks.length}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Cápsula de navegación de semana minimalista */}
            <div className="flex items-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={goToPreviousWeek}
                disabled={currentIndex <= 0}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2.5 text-slate-800 dark:text-white select-none whitespace-nowrap">
                {currentWeek.weekStartDate} al {currentWeek.weekEndDate}
              </span>
              <button
                onClick={goToNextWeek}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                title={currentIndex < sortedWeeks.length - 1 ? 'Semana siguiente' : 'Crear siguiente semana'}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de tipo de reunión compacto */}
            <div className="flex items-center bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('midweek')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'midweek'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Entre Semana
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekend')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'weekend'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Fin de Semana
              </button>
            </div>

            {/* Botón Nueva Semana sutil */}
            <button
              onClick={addNextWeek}
              className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
              title="Añadir nueva semana"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {/* ── BARRA DE HERRAMIENTAS ULTRA MINIMALISTA ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06] w-full text-xs">
          {/* Lado izquierdo: Acciones clave con diseño limpio */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isReadOnly ? (
              <button
                onClick={autoAssignCurrentWeek}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-2xs cursor-pointer"
                title="Autoasignar toda esta semana respetando rotación y sin cruces"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Autoasignar</span>
              </button>
            ) : (
              <span className="text-slate-500 text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                Solo lectura ({effectiveRoleInfo.shortName})
              </span>
            )}

            <button
              onClick={() => setIsBatchWhatsAppOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 font-medium transition-all cursor-pointer"
              title="Enviar recordatorios de la semana por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Lado derecho: Documentos, Cruces y Menú Más */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* S-89 oficial */}
            <button
              type="button"
              onClick={handlePrintS89}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 font-medium transition-all cursor-pointer"
              title="Descargar hojas oficiales de asignación S-89 en PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>S-89</span>
            </button>

            {/* Fichas S-38 */}
            <button
              type="button"
              onClick={handleOpenS38}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 font-medium transition-all cursor-pointer"
              title="Registros S-38 y folleto de oratoria"
            >
              <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>S-38</span>
            </button>

            {/* Cruces */}
            <button
              type="button"
              onClick={() => setIsConflictsModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer border ${
                weekConflictsCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : 'text-slate-600 dark:text-zinc-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
              title="Auditoría de cruces de esta semana"
            >
              {weekConflictsCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span>{weekConflictsCount > 0 ? `${weekConflictsCount} Cruces` : 'Sin Cruces'}</span>
            </button>

            {/* Menú Desplegable "Más Opciones" */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 p-1.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer"
                title="Más herramientas y opciones"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-60 max-h-[calc(100vh-140px)] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsMwbModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-left"
                    >
                      <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Importar Guía de Actividades (MWB)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setOrganizedModalTab('catalogo');
                        setIsOrganizedModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-left"
                    >
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Catálogo de Semanas Organized</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsMonthlyBillboardModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-left"
                    >
                      <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Cartelera Mensual del Salón</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsTimerModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-left"
                    >
                      <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Modo Atril / Cronómetro</span>
                    </button>

                    {!isReadOnly && (
                      <>
                        <div className="my-1 border-t border-slate-100 dark:border-white/5" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setEventTitle(currentWeek.specialEvent?.title || '');
                            setEventType(currentWeek.specialEvent?.type || 'visita_superintendente');
                            setNoMidweek(Boolean(currentWeek.specialEvent?.noMeetingMidweek));
                            setNoWeekend(Boolean(currentWeek.specialEvent?.noMeetingWeekend));
                            setEventNotes(currentWeek.specialEvent?.notes || '');
                            setIsSpecialEventModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-left"
                        >
                          <Sparkle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            {currentWeek.specialEvent?.isSpecial ? 'Evento Especial (Activo)' : 'Configurar Evento Especial'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setSourceWeekId(sortedWeeks[0]?.id || '');
                            setIsCopyModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-left"
                        >
                          <Copy className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Copiar Estructura de Semana</span>
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-white/5" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsClearWeekAssignmentsModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-left"
                        >
                          <UserMinus className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>Quitar Asignados de la Semana</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </SectionHeader>

      {/* SPECIAL EVENT BANNER IF ACTIVE */}
      {currentWeek.specialEvent?.isSpecial && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Fecha Especial Programada
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {currentWeek.specialEvent.title}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {currentWeek.specialEvent.noMeetingMidweek && '⛔ Sin reunión de entre semana. '}
                {currentWeek.specialEvent.noMeetingWeekend && '⛔ Sin reunión de fin de semana. '}
                {currentWeek.specialEvent.notes && `Nota: ${currentWeek.specialEvent.notes}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEventTitle(currentWeek.specialEvent?.title || '');
              setEventType(currentWeek.specialEvent?.type || 'visita_superintendente');
              setNoMidweek(Boolean(currentWeek.specialEvent?.noMeetingMidweek));
              setNoWeekend(Boolean(currentWeek.specialEvent?.noMeetingWeekend));
              setEventNotes(currentWeek.specialEvent?.notes || '');
              setIsSpecialEventModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 transition-all shrink-0"
          >
            Modificar Evento
          </button>
        </div>
      )}

      {/* REUNIÓN DE ENTRE SEMANA (VMC - ASIGNADOR OFICIAL) */}
      {(viewMode === 'all' || viewMode === 'midweek') && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <ClmScheduleView
              key={currentWeek.weekStartDate}
              publishers={publishers}
              congregationId={settings.congregationName || currentWeek.id}
              selectedWeekDate={currentWeek.weekStartDate}
              hideHeaderToolbar={true}
              onWeekChange={(mondayDate) => {
                const matchedWeek = weeks.find((w) => w.weekStartDate === mondayDate);
                if (matchedWeek) {
                  setCurrentWeekId(matchedWeek.id);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* REUNIÓN DEL FIN DE SEMANA (DISEÑO UNIFICADO CON VIDA Y MINISTERIO) */}
      {(viewMode === 'all' || viewMode === 'weekend') && (
        <div className="space-y-4">
          <div
            className={`rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-xs transition-opacity ${
              currentWeek.specialEvent?.noMeetingWeekend ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {/* ── ENCABEZADO FDS SUPER MINIMALISTA (MODO EMBEBIDO / UNIFICADO) ── */}
            <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200/70 dark:border-white/[0.05] flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Reunión del Fin de Semana
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  {settings.weekendMeetingDay} • {currentWeek.weekend.date} ({settings.weekendMeetingTime})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleQuickSyncOrganized('weekend')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-medium text-xs transition shadow-2xs cursor-pointer"
                    title="Traer de Organized el bosquejo oficial y canciones del fin de semana"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sincronizar Bosquejo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOrganizedModalTab('bosquejos');
                    setIsOrganizedModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 font-medium text-xs transition shadow-2xs cursor-pointer"
                  title="Ver catálogo oficial de 194 bosquejos"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Catálogo (#1-194)</span>
                </button>
              </div>
            </div>

            {/* ── LISTADO OFICIAL DE LA REUNIÓN DEL FIN DE SEMANA ── */}
            <div className="flex-1 overflow-y-auto">
              {/* 1. MARCO INICIAL: Presidente, Cántico 1, Oración Inicial */}
              {/* FILA: Presidente */}
              <div className="border-b border-slate-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                      P.
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          Presidente de la reunión
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                        Preside la reunión, presenta al orador visitante/local y da los anuncios finales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentWeek.weekend.presidentId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openSelector(
                              'Presidente reunión fin de semana',
                              'fds_presidente',
                              'hermano',
                              currentWeek.weekend.date,
                              'weekend',
                              currentWeek.weekend.presidentId,
                              (pid) => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.presidentId = pid;
                                updateWeek(u);
                              },
                              () => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.presidentId = undefined;
                                updateWeek(u);
                              }
                            )
                          }
                          className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Cambiar presidente"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{publishersMap.get(currentWeek.weekend.presidentId)?.name || 'Hno. Asignado'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendWhatsApp(
                              currentWeek.weekend.presidentId,
                              'Presidente de la Reunión',
                              'weekend',
                              currentWeek.weekend.date
                            )
                          }
                          className="p-1 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.weekend.presidentId = undefined;
                              updateWeek(u);
                            }}
                            className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                            title="Quitar presidente asignado"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openSelector(
                            'Presidente reunión fin de semana',
                            'fds_presidente',
                            'hermano',
                            currentWeek.weekend.date,
                            'weekend',
                            undefined,
                            (pid) => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.weekend.presidentId = pid;
                              updateWeek(u);
                            },
                            () => {}
                          )
                        }
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-dashed border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                      >
                        + Asignar Presidente
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FILA: Cántico Inicial */}
              <div className="border-b border-slate-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          Cántico {currentWeek.weekend.openingSong || 12}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                        Cántico de apertura de la reunión del fin de semana
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Congregación
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('canciones');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Cambiar número de cántico"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FILA: Oración Inicial */}
              <div className="border-b border-slate-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          Oración de apertura
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                        Petición y agradecimiento a Jehová antes de la conferencia pública
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentWeek.weekend.initialPrayerId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openSelector(
                              'Oración inicial reunión fin de semana',
                              'fds_presidente',
                              'hermano',
                              currentWeek.weekend.date,
                              'weekend',
                              currentWeek.weekend.initialPrayerId,
                              (pid) => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.initialPrayerId = pid;
                                updateWeek(u);
                              },
                              () => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.initialPrayerId = undefined;
                                updateWeek(u);
                              }
                            )
                          }
                          className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Cambiar hermano asignado"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{publishersMap.get(currentWeek.weekend.initialPrayerId)?.name || 'Hno. Asignado'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendWhatsApp(
                              currentWeek.weekend.initialPrayerId,
                              'Oración Inicial',
                              'weekend',
                              currentWeek.weekend.date
                            )
                          }
                          className="p-1 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.weekend.initialPrayerId = undefined;
                              updateWeek(u);
                            }}
                            className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                            title="Quitar asignación"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openSelector(
                            'Oración inicial reunión fin de semana',
                            'fds_presidente',
                            'hermano',
                            currentWeek.weekend.date,
                            'weekend',
                            undefined,
                            (pid) => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.weekend.initialPrayerId = pid;
                              updateWeek(u);
                            },
                            () => {}
                          )
                        }
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-dashed border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                      >
                        + Asignar Oración
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. SECCIÓN: DISCURSO PÚBLICO (30 MIN) */}
              <div className="mt-2">
                <div
                  style={{ backgroundColor: '#204d74' }}
                  className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
                >
                  DISCURSO PÚBLICO (30 MIN)
                </div>

                <div className="border-b border-slate-100 dark:border-white/[0.04]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors gap-3">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {currentWeek.weekend.publicTalkOutlineNumber && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold text-[10px] tracking-wide shrink-0">
                              Bosquejo #{currentWeek.weekend.publicTalkOutlineNumber}
                            </span>
                          )}
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                            {currentWeek.weekend.publicTalkTheme || 'Tema del Discurso Público por definir'}
                          </h4>
                          <span className="text-xs text-slate-400 font-normal">
                            (30 min)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-zinc-300">
                            Orador: <strong>{currentWeek.weekend.publicTalkSpeaker || 'Sin especificar'}</strong>
                            {currentWeek.weekend.visitingSpeakerCongregation && (
                              <span className="text-slate-500 ml-1">
                                ({currentWeek.weekend.visitingSpeakerCongregation})
                              </span>
                            )}
                          </span>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                setWeekendEditTab('discurso');
                                setIsWeekendEditModalOpen(true);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer ml-1 inline-flex items-center gap-1"
                            >
                              <Edit3 size={11} />
                              <span>Editar tema u orador</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {currentWeek.weekend.publicTalkSpeaker ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setWeekendEditTab('discurso');
                              setIsWeekendEditModalOpen(true);
                            }}
                            className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Modificar orador o congregación"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{currentWeek.weekend.publicTalkSpeaker}</span>
                          </button>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.publicTalkSpeaker = '';
                                u.weekend.visitingSpeakerCongregation = '';
                                updateWeek(u);
                              }}
                              className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                              title="Limpiar orador"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setWeekendEditTab('discurso');
                            setIsWeekendEditModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-dashed border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                        >
                          + Asignar Orador
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CÁNTICO INTERMEDIO */}
              <div className="border-b border-slate-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          Cántico {currentWeek.weekend.middleSong || 68}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                        Cántico intermedio entre el discurso y el estudio de La Atalaya
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Congregación
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('canciones');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Cambiar número de cántico intermedio"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. SECCIÓN: ESTUDIO DE LA ATALAYA (60 MIN) */}
              <div className="mt-2">
                <div
                  style={{ backgroundColor: '#1d6349' }}
                  className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
                >
                  ESTUDIO DE LA ATALAYA (60 MIN)
                </div>

                {/* Sub-fila: Tema del artículo de La Atalaya */}
                <div className="border-b border-slate-100 dark:border-white/[0.04] bg-emerald-50/20 dark:bg-emerald-950/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors gap-2">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px] tracking-wide shrink-0">
                            Artículo Oficial
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                            {currentWeek.weekend.watchtowerTheme || 'Tema de La Atalaya por definir'}
                          </h4>
                          <span className="text-xs text-slate-400 font-normal">
                            (60 min)
                          </span>
                        </div>
                        {currentWeek.weekend.watchtowerScripture && (
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 mt-0.5 font-medium">
                            Texto temático: {currentWeek.weekend.watchtowerScripture}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('atalaya');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 self-end sm:self-center"
                        title="Modificar artículo y texto de La Atalaya"
                      >
                        <Edit3 size={12} />
                        <span>Editar artículo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* FILA: Conductor de La Atalaya */}
                <div className="border-b border-slate-100 dark:border-white/[0.04]">
                  <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                            Quién dirige La Atalaya (Conductor)
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                          Dirige el estudio con la congregación formulando preguntas y comentarios
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {currentWeek.weekend.atalayaConductorId ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openSelector(
                                'Conductor de La Atalaya',
                                'fds_presidente',
                                'hermano',
                                currentWeek.weekend.date,
                                'weekend',
                                currentWeek.weekend.atalayaConductorId,
                                (pid) => {
                                  const u = JSON.parse(JSON.stringify(currentWeek));
                                  u.weekend.atalayaConductorId = pid;
                                  updateWeek(u);
                                },
                                () => {
                                  const u = JSON.parse(JSON.stringify(currentWeek));
                                  u.weekend.atalayaConductorId = undefined;
                                  updateWeek(u);
                                }
                              )
                            }
                            className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Cambiar conductor"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{publishersMap.get(currentWeek.weekend.atalayaConductorId)?.name || 'Hno. Asignado'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSendWhatsApp(
                                currentWeek.weekend.atalayaConductorId,
                                'Conductor de La Atalaya',
                                'weekend',
                                currentWeek.weekend.date
                              )
                            }
                            className="p-1 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                            title="Enviar recordatorio por WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </button>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.atalayaConductorId = undefined;
                                updateWeek(u);
                              }}
                              className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                              title="Quitar conductor"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openSelector(
                              'Conductor de La Atalaya',
                              'fds_presidente',
                              'hermano',
                              currentWeek.weekend.date,
                              'weekend',
                              undefined,
                              (pid) => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.atalayaConductorId = pid;
                                updateWeek(u);
                              },
                              () => {}
                            )
                          }
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-dashed border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                        >
                          + Asignar Conductor
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FILA: Lector de La Atalaya */}
                <div className="border-b border-slate-100 dark:border-white/[0.04]">
                  <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                            Lector de La Atalaya
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                          Lectura clara y audible de los párrafos del artículo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {currentWeek.weekend.atalayaLectorId ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              openSelector(
                                'Lector de La Atalaya',
                                'fds_atalaya_lector',
                                'hermano',
                                currentWeek.weekend.date,
                                'weekend',
                                currentWeek.weekend.atalayaLectorId,
                                (pid) => {
                                  const u = JSON.parse(JSON.stringify(currentWeek));
                                  u.weekend.atalayaLectorId = pid;
                                  updateWeek(u);
                                },
                                () => {
                                  const u = JSON.parse(JSON.stringify(currentWeek));
                                  u.weekend.atalayaLectorId = undefined;
                                  updateWeek(u);
                                }
                              )
                            }
                            className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            title="Cambiar lector"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{publishersMap.get(currentWeek.weekend.atalayaLectorId)?.name || 'Hno. Asignado'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSendWhatsApp(
                                currentWeek.weekend.atalayaLectorId,
                                'Lector de La Atalaya',
                                'weekend',
                                currentWeek.weekend.date
                              )
                            }
                            className="p-1 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                            title="Enviar recordatorio por WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </button>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.atalayaLectorId = undefined;
                                updateWeek(u);
                              }}
                              className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                              title="Quitar lector"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            openSelector(
                              'Lector de La Atalaya',
                              'fds_atalaya_lector',
                              'hermano',
                              currentWeek.weekend.date,
                              'weekend',
                              undefined,
                              (pid) => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.atalayaLectorId = pid;
                                updateWeek(u);
                              },
                              () => {}
                            )
                          }
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-dashed border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                        >
                          + Asignar Lector
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. MARCO FINAL: Cántico Final, Oración Final */}
              {/* FILA: Cántico Final */}
              <div className="border-b border-slate-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          Cántico {currentWeek.weekend.closingSong || 138}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                        Cántico de conclusión de la reunión
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Congregación
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('canciones');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Cambiar número de cántico de conclusión"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FILA: Oración Final */}
              <div>
                <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                          Oración de conclusión
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                        Oración final y bendición para concluir la reunión del fin de semana
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentWeek.weekend.finalPrayerId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openSelector(
                              'Oración final reunión fin de semana',
                              'fds_presidente',
                              'hermano',
                              currentWeek.weekend.date,
                              'weekend',
                              currentWeek.weekend.finalPrayerId,
                              (pid) => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.finalPrayerId = pid;
                                updateWeek(u);
                              },
                              () => {
                                const u = JSON.parse(JSON.stringify(currentWeek));
                                u.weekend.finalPrayerId = undefined;
                                updateWeek(u);
                              }
                            )
                          }
                          className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Cambiar hermano asignado"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{publishersMap.get(currentWeek.weekend.finalPrayerId)?.name || 'Hno. Asignado'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendWhatsApp(
                              currentWeek.weekend.finalPrayerId,
                              'Oración Final',
                              'weekend',
                              currentWeek.weekend.date
                            )
                          }
                          className="p-1 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.weekend.finalPrayerId = undefined;
                              updateWeek(u);
                            }}
                            className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                            title="Quitar asignación"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openSelector(
                            'Oración final reunión fin de semana',
                            'fds_presidente',
                            'hermano',
                            currentWeek.weekend.date,
                            'weekend',
                            undefined,
                            (pid) => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.weekend.finalPrayerId = pid;
                              updateWeek(u);
                            },
                            () => {}
                          )
                        }
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-dashed border-slate-300 dark:border-white/20 transition-all cursor-pointer"
                      >
                        + Asignar Oración
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}


      {/* MODAL: ASSIGNMENT SELECTOR */}
      {selectorState.isOpen && (
        <AssignmentSelectorModal
          isOpen={selectorState.isOpen}
          onClose={() => setSelectorState(prev => ({ ...prev, isOpen: false }))}
          title={selectorState.title}
          roleKey={selectorState.roleKey}
          targetGender={selectorState.targetGender}
          meetingDate={selectorState.meetingDate}
          meetingType={selectorState.meetingType}
          currentAssignedId={selectorState.currentAssignedId}
          onSelectPublisher={selectorState.onSelect}
          onClearAssignment={selectorState.onClear}
        />
      )}

      {/* MODAL: REPLACEMENTS */}
      {replacementState.isOpen && (
        <ReplacementsModal
          isOpen={replacementState.isOpen}
          onClose={() => setReplacementState(prev => ({ ...prev, isOpen: false }))}
          weekId={replacementState.weekId}
          meetingType={replacementState.meetingType}
          meetingDate={replacementState.meetingDate}
          assignmentTitle={replacementState.assignmentTitle}
          assignmentPath={replacementState.assignmentPath}
          currentPublisherId={replacementState.currentPublisherId}
          currentStatus={replacementState.currentStatus}
          roleKey={replacementState.roleKey}
          targetGender={replacementState.targetGender}
        />
      )}

      {/* MODAL: COPY WEEK STRUCTURE */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Copiar estructura de otra semana
            </h3>
            <p className="text-xs text-slate-500">
              Esto copiará los títulos y partes del programa de la semana seleccionada hacia la semana actual, dejando las asignaciones listas para asignar.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semana de origen:
              </label>
              <select
                value={sourceWeekId}
                onChange={e => setSourceWeekId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              >
                {sortedWeeks.filter(w => w.id !== currentWeek.id).map(w => (
                  <option key={w.id} value={w.id}>
                    Semana {w.weekStartDate} al {w.weekEndDate}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (sourceWeekId) copyWeekStructure(sourceWeekId, currentWeek.id);
                  setIsCopyModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Copiar Estructura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SPECIAL EVENT */}
      {isSpecialEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-amber-500" />
              <span>Configurar Evento o Fecha Especial</span>
            </h3>
            <p className="text-xs text-slate-500">
              Registra asambleas, conmemoración o visitas especiales. Si marcas "Sin reunión", esa reunión quedará bloqueada en el programa.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Evento:
                </label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="visita_superintendente">Visita del Superintendente de Circuito</option>
                  <option value="asamblea_circuito">Asamblea de Circuito</option>
                  <option value="asamblea_regional">Asamblea Regional</option>
                  <option value="conmemoracion">Conmemoración</option>
                  <option value="otro">Otro evento especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Evento:
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="Ej. Visita del Superintendente de Circuito"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">Bloqueo de reuniones ordinarias:</span>
                <div className="space-y-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noMidweek}
                      onChange={e => setNoMidweek(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>NO hay reunión de entre semana</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noWeekend}
                      onChange={e => setNoWeekend(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>NO hay reunión de fin de semana</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas / Detalles:
                </label>
                <input
                  type="text"
                  value={eventNotes}
                  onChange={e => setEventNotes(e.target.value)}
                  placeholder="Ej. Reunión con precursores el sábado a las 10:00"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {currentWeek.specialEvent?.isSpecial && (
                <button
                  type="button"
                  onClick={() => {
                    updateWeek({ ...currentWeek, specialEvent: undefined });
                    setIsSpecialEventModalOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Quitar Evento Especial
                </button>
              )}
              <div className="flex justify-end gap-2 ml-auto">
                <button
                  onClick={() => setIsSpecialEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSpecialEvent}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Guardar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MWB IMPORT */}
      <MwbImportModal
        isOpen={isMwbModalOpen}
        onClose={() => setIsMwbModalOpen(false)}
      />

      {/* MODAL: MEETING TIMER / LECTERN MODE */}
      <MeetingTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />

      {/* MODAL: BATCH WHATSAPP REMINDERS */}
      {currentWeek && (
        <BatchWhatsAppModal
          isOpen={isBatchWhatsAppOpen}
          onClose={() => setIsBatchWhatsAppOpen(false)}
          week={currentWeek}
        />
      )}

      {/* MODAL: CATÁLOGO OFICIAL & OUTLINES (Entre Semana y Fin de Semana) */}
      <OrganizedImportModal
        isOpen={isOrganizedModalOpen}
        onClose={() => setIsOrganizedModalOpen(false)}
        initialTab={organizedModalTab}
        initialFocus={organizedModalFocus}
      />

      {/* MODAL: S-38 REGISTRO DE ESTUDIANTES */}
      {selectedStudentForS38 && (
        <StudentS38HistoryModal
          publisher={selectedStudentForS38}
          isOpen={Boolean(selectedStudentForS38)}
          onClose={() => setSelectedStudentForS38(null)}
          allWeeks={weeks}
          clmProgramas={clmProgramas}
          onAdvanceLesson={advancePublisherLesson}
          onRepeatLesson={repeatPublisherLesson}
          onUpdatePublisher={updatePublisher}
        />
      )}

      {/* MODAL: CARTELERA MENSUAL */}
      {isMonthlyBillboardModalOpen && (
        <ClmMonthlyBillboardModal
          isOpen={isMonthlyBillboardModalOpen}
          onClose={() => setIsMonthlyBillboardModalOpen(false)}
          congregationName={settings?.congregationName || 'la congregación'}
          clmProgramas={clmProgramas}
          publishers={publishers}
          currentDate={new Date(currentWeek.weekStartDate)}
        />
      )}

      {/* MODAL: AUDITORÍA DE CONFLICTOS / CRUCES */}
      {isConflictsModalOpen && (
        <ConflictsModal
          isOpen={isConflictsModalOpen}
          onClose={() => setIsConflictsModalOpen(false)}
          onNavigateToWeek={(wId) => {
            setCurrentWeekId(wId);
            setIsConflictsModalOpen(false);
          }}
        />
      )}

      {/* MODAL: QUITAR ASIGNADOS DE LA SEMANA */}
      {isClearWeekAssignmentsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <UserMinus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Quitar Asignados de la Semana
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearWeekAssignmentsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Selecciona qué sección de la semana ({currentWeek.weekStartDate}) deseas dejar sin asignar:
            </p>

            <div className="space-y-2">
              {[
                {
                  id: 'all',
                  label: 'Ambas reuniones (Semana completa)',
                  desc: 'Entre Semana (VMC) y Fin de Semana (Discurso Público y La Atalaya)',
                },
                {
                  id: 'midweek',
                  label: 'Solo Reunión Entre Semana (VMC)',
                  desc: 'Presidente, lecturas, demostraciones, perlas y estudio bíblico',
                },
                {
                  id: 'weekend',
                  label: 'Solo Reunión Fin de Semana',
                  desc: 'Presidente, orador, conductor/lector de La Atalaya y oraciones',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    clearScope === opt.id
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-400'
                      : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearScopeOption"
                    value={opt.id}
                    checked={clearScope === opt.id}
                    onChange={() => setClearScope(opt.id as any)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5 leading-snug">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
              ℹ️ Los temas oficiales, canciones, lecturas y números de bosquejo se conservan intactos. Solo se liberan las personas asignadas.
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearWeekAssignmentsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAssignments}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Confirmar y Quitar Asignados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR PROGRAMA DEL FIN DE SEMANA (TEMA, ORADOR, ATALAYA, CÁNTICOS) ── */}
      {isWeekendEditModalOpen && currentWeek && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Editar Programa del Fin de Semana
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.weekendMeetingDay} {currentWeek.weekend.date} ({settings.weekendMeetingTime})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWeekendEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas de Navegación del Modal */}
            <div className="px-6 pt-3 pb-1 border-b border-slate-200 dark:border-white/[0.06] flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setWeekendEditTab('discurso')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekendEditTab === 'discurso'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-white/10'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Discurso Público
              </button>
              <button
                type="button"
                onClick={() => setWeekendEditTab('atalaya')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekendEditTab === 'atalaya'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs border border-slate-200/80 dark:border-white/10'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                La Atalaya
              </button>
              <button
                type="button"
                onClick={() => setWeekendEditTab('canciones')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekendEditTab === 'canciones'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-2xs border border-slate-200/80 dark:border-white/10'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Cánticos (3)
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {weekendEditTab === 'discurso' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Catálogo Oficial de Bosquejos (#1 al 194):
                    </label>
                    <select
                      value={currentWeek.weekend.publicTalkOutlineNumber || ''}
                      onChange={(e) => {
                        const num = parseInt(e.target.value, 10);
                        const found = findOutlineByNumber(num);
                        const u = JSON.parse(JSON.stringify(currentWeek));
                        u.weekend.publicTalkOutlineNumber = isNaN(num) ? undefined : num;
                        if (found) {
                          u.weekend.publicTalkTheme = found.title;
                        }
                        updateWeek(u);
                      }}
                      className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Seleccionar bosquejo del catálogo oficial --</option>
                      {OFFICIAL_PUBLIC_TALK_OUTLINES.map((o) => (
                        <option key={o.number} value={o.number}>
                          #{o.number}: {o.title} {o.category ? `(${o.category})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tema del Discurso Público:
                    </label>
                    <input
                      type="text"
                      value={currentWeek.weekend.publicTalkTheme || ''}
                      onChange={(e) => {
                        const u = JSON.parse(JSON.stringify(currentWeek));
                        u.weekend.publicTalkTheme = e.target.value;
                        updateWeek(u);
                      }}
                      placeholder="Ej. ¿Quién es el Dios verdadero?"
                      className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Nombre del Orador:
                      </label>
                      <input
                        type="text"
                        value={currentWeek.weekend.publicTalkSpeaker || ''}
                        onChange={(e) => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.publicTalkSpeaker = e.target.value;
                          updateWeek(u);
                        }}
                        placeholder="Ej. Hno. Carlos Martínez"
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Congregación de Origen:
                      </label>
                      <input
                        type="text"
                        value={currentWeek.weekend.visitingSpeakerCongregation || ''}
                        onChange={(e) => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.visitingSpeakerCongregation = e.target.value;
                          updateWeek(u);
                        }}
                        placeholder="Ej. Los Pinos / Local"
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {weekendEditTab === 'atalaya' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tema / Artículo de La Atalaya:
                    </label>
                    <input
                      type="text"
                      value={currentWeek.weekend.watchtowerTheme || ''}
                      onChange={(e) => {
                        const u = JSON.parse(JSON.stringify(currentWeek));
                        u.weekend.watchtowerTheme = e.target.value;
                        updateWeek(u);
                      }}
                      placeholder="Ej. Confiemos plenamente en el cuidado amoroso de Jehová"
                      className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Texto Temático del Artículo:
                    </label>
                    <input
                      type="text"
                      value={currentWeek.weekend.watchtowerScripture || ''}
                      onChange={(e) => {
                        const u = JSON.parse(JSON.stringify(currentWeek));
                        u.weekend.watchtowerScripture = e.target.value;
                        updateWeek(u);
                      }}
                      placeholder="Ej. Salmo 84:11"
                      className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {weekendEditTab === 'canciones' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Cántico Inicial:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="158"
                        value={currentWeek.weekend.openingSong || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.openingSong = isNaN(val) ? undefined : val;
                          updateWeek(u);
                        }}
                        placeholder="Ej. 12"
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Cántico Intermedio:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="158"
                        value={currentWeek.weekend.middleSong || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.middleSong = isNaN(val) ? undefined : val;
                          updateWeek(u);
                        }}
                        placeholder="Ej. 68"
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Cántico de Conclusión:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="158"
                        value={currentWeek.weekend.closingSong || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.closingSong = isNaN(val) ? undefined : val;
                          updateWeek(u);
                        }}
                        placeholder="Ej. 138"
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsWeekendEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Listo y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastNotification && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-indigo-500/40 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}
    </div>
  );
};
