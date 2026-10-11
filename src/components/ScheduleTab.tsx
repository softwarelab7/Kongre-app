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
  const [clearScope, setClearScope] = useState<'all' | 'midweek' | 'weekend' | 'duties'>('all');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const handleConfirmClearAssignments = async () => {
    if (!currentWeek) return;
    setIsClearWeekAssignmentsModalOpen(false);
    try {
      await clearWeekAssignments(currentWeek.id, clearScope);
      const scopeLabels: Record<string, string> = {
        all: 'todas las asignaciones de la semana',
        midweek: 'los asignados de la reunión de entre semana',
        weekend: 'los asignados de la reunión del fin de semana',
        duties: 'los asignados a turnos y deberes operativos',
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

  // Toggle duty assignment in week
  const handleToggleDutyPublisher = (
    meetingType: 'midweek' | 'weekend',
    dutyKey: string,
    publisherId: string
  ) => {
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    const dutiesObj = meetingType === 'midweek' ? updated.midweek.duties : updated.weekend.duties;
    if (!dutiesObj[dutyKey]) dutiesObj[dutyKey] = [];

    const list = dutiesObj[dutyKey];
    const idx = list.indexOf(publisherId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(publisherId);
    }
    updateWeek(updated);
  };

  // Cleaning group toggle
  const handleToggleCleaningGroup = (groupNumber: number) => {
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    const list = updated.cleaningGroupNumbers;
    const idx = list.indexOf(groupNumber);
    if (idx >= 0) {
      if (list.length > 1) list.splice(idx, 1);
    } else {
      list.push(groupNumber);
    }
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
          <div className="flex flex-wrap items-center gap-2">
            {/* Week navigation capsule */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] p-1 rounded-xl">
              <button
                onClick={goToPreviousWeek}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 text-slate-800 dark:text-white">
                {currentWeek.weekStartDate} al {currentWeek.weekEndDate}
              </span>
              <button
                onClick={goToNextWeek}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                title={currentIndex < sortedWeeks.length - 1 ? 'Semana siguiente' : 'Crear siguiente semana'}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de visualización de reunión */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] overflow-x-auto">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Entre Semana y Fin de Semana
              </button>
              <button
                type="button"
                onClick={() => setViewMode('midweek')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'midweek'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Reunión Entre Semana (Asignador Oficial)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekend')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'weekend'
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Reunión Fin de Semana
              </button>
            </div>

            {/* Botón Nueva Semana */}
            <button
              onClick={addNextWeek}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md dark:shadow-indigo-500/20 active:scale-95 cursor-pointer"
              title="Añadir una nueva semana al programa"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Semana</span>
            </button>
          </div>
        }
      >
        {/* ── BARRA DE HERRAMIENTAS INTEGRADA EN EL ENCABEZADO (ÚNICA Y UNIFICADA) ── */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] w-full">
          {!isReadOnly ? (
            <>
              <button
                onClick={autoAssignCurrentWeek}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all min-h-[36px] cursor-pointer"
                title="Autoasignar toda esta semana eligiendo a los publicadores con más tiempo sin participar y sin cruces"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Autoasignar Semana</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClearWeekAssignmentsModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all shadow-2xs min-h-[36px] cursor-pointer"
                title="Quitar de forma rápida a los publicadores asignados en esta semana"
              >
                <UserMinus className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Quitar Asignados</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Solo Lectura ({effectiveRoleInfo.shortName})</span>
            </div>
          )}

          {!isReadOnly && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickSyncOrganized('all')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all shadow-2xs min-h-[36px] cursor-pointer"
                title="Traer datos oficiales de Organized para esta semana"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">Traer de Organized</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrganizedModalTab('catalogo');
                  setIsOrganizedModalOpen(true);
                }}
                className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all min-h-[36px] cursor-pointer"
                title="Abrir Catálogo de semanas y bosquejos oficiales de Organized"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>
            </div>
          )}

          {!isReadOnly && (
            <button
              onClick={() => setIsMwbModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-xs font-bold transition-all shadow-2xs min-h-[36px] cursor-pointer"
              title="Importar temas de la Guía de Actividades (MWB) para esta semana"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="truncate">Importar Guía (MWB)</span>
            </button>
          )}

          <button
            onClick={() => setIsBatchWhatsAppOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs min-h-[36px] cursor-pointer"
            title="Enviar recordatorios de la semana por WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>

          {/* Imprimir S-89 */}
          <button
            type="button"
            onClick={handlePrintS89}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold transition-all shadow-2xs min-h-[36px] cursor-pointer"
            title="Imprimir hojas oficiales de asignación S-89 en PDF para esta semana"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">Imprimir S-89</span>
          </button>

          {/* Fichas S-38 */}
          <button
            type="button"
            onClick={handleOpenS38}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold transition-all shadow-2xs min-h-[36px] cursor-pointer"
            title="Ver registros oficiales S-38 de progreso de estudiantes"
          >
            <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Fichas S-38</span>
          </button>

          {/* Cartelera Mensual */}
          <button
            type="button"
            onClick={() => setIsMonthlyBillboardModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all shadow-2xs min-h-[36px] cursor-pointer"
            title="Abrir programa apaisado para la cartelera de anuncios del Salón"
          >
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Cartelera Mensual</span>
          </button>

          {/* Modo Atril / Reloj */}
          <button
            onClick={() => setIsTimerModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs min-h-[36px] cursor-pointer"
            title="Abrir cronómetro y modo atril para la cabina y presidente"
          >
            <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Modo Atril</span>
          </button>

          {/* Evento Especial */}
          {!isReadOnly && (
            <button
              onClick={() => {
                setEventTitle(currentWeek.specialEvent?.title || '');
                setEventType(currentWeek.specialEvent?.type || 'visita_superintendente');
                setNoMidweek(Boolean(currentWeek.specialEvent?.noMeetingMidweek));
                setNoWeekend(Boolean(currentWeek.specialEvent?.noMeetingWeekend));
                setEventNotes(currentWeek.specialEvent?.notes || '');
                setIsSpecialEventModalOpen(true);
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                currentWeek.specialEvent?.isSpecial
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-zinc-300 dark:border dark:border-white/10'
              }`}
            >
              <Sparkle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">
                {currentWeek.specialEvent?.isSpecial ? 'Evento Especial (Activo)' : 'Evento Especial'}
              </span>
            </button>
          )}

          {/* Copiar Estructura */}
          {!isReadOnly && (
            <button
              onClick={() => {
                setSourceWeekId(sortedWeeks[0]?.id || '');
                setIsCopyModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-zinc-300 text-xs font-semibold transition-all min-h-[36px] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">Copiar Estructura</span>
            </button>
          )}

          {/* Auditoría / Cruces */}
          <button
            type="button"
            onClick={() => setIsConflictsModalOpen(true)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px] cursor-pointer border ${
              weekConflictsCount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}
            title="Verificar auditoría de cruces de esta semana"
          >
            {weekConflictsCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="truncate">
              {weekConflictsCount > 0 ? `${weekConflictsCount} Cruces` : 'Sin Cruces'}
            </span>
          </button>
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

          {/* TURNOS Y DEBERES DE ENTRE SEMANA (Sonido, Micrófonos, Acomodadores) */}
          {customDuties.some((d) => d.midweek) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Servicios de la Congregación
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Deberes y Turnos de Entre Semana (Audio y Video, Micrófonos y Acomodadores)
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {customDuties
                  .filter((d) => d.midweek)
                  .map((duty) => {
                    const assignedIds = currentWeek.midweek?.duties?.[duty.key] || [];
                    return (
                      <div
                        key={duty.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block truncate">
                              {duty.name}
                            </span>
                            {assignedIds.length > 0 && !isReadOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  const u = JSON.parse(JSON.stringify(currentWeek));
                                  if (!u.midweek.duties) u.midweek.duties = {};
                                  u.midweek.duties[duty.key] = [];
                                  updateWeek(u);
                                }}
                                className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                                title={`Quitar a todos los asignados a ${duty.name}`}
                              >
                                Limpiar
                              </button>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            {assignedIds.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Sin asignar</p>
                            ) : (
                              assignedIds.map((pid) => (
                                <div key={pid} className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {publishersMap.get(pid)?.name || 'Hno.'}
                                  </span>
                                  <button
                                    onClick={() => handleToggleDutyPublisher('midweek', duty.key, pid)}
                                    className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                                    title="Quitar asignación"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            openSelector(
                              `Añadir a: ${duty.name} (Entre Semana)`,
                              duty.key,
                              'any',
                              currentWeek.midweek?.date || currentWeek.weekStartDate,
                              'midweek',
                              undefined,
                              (pid) => handleToggleDutyPublisher('midweek', duty.key, pid),
                              () => {}
                            )
                          }
                          className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-left cursor-pointer"
                        >
                          + Asignar persona
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

          {(viewMode === 'all' || viewMode === 'weekend') && (
            /* REUNIÓN DE FIN DE SEMANA */
            <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs transition-opacity ${
              currentWeek.specialEvent?.noMeetingWeekend ? 'opacity-60 pointer-events-none' : ''
            }`}>
        <div className="p-4 sm:p-5 bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                {settings.weekendMeetingDay} • {currentWeek.weekend.date} ({settings.weekendMeetingTime})
              </span>
              <h3 className="text-lg font-bold tracking-tight">Reunión del Fin de Semana</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-300">Presidencia:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  openSelector(
                    'Presidente reunión fin de semana',
                    'fds_presidente',
                    'hermano',
                    currentWeek.weekend.date,
                    'weekend',
                    currentWeek.weekend.presidentId,
                    pid => {
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
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 transition-all cursor-pointer"
              >
                {publishersMap.get(currentWeek.weekend.presidentId || '')?.name || 'Seleccionar Presidente'}
              </button>
              {currentWeek.weekend.presidentId && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.weekend.presidentId = undefined;
                    updateWeek(u);
                  }}
                  className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/40 transition cursor-pointer"
                  title="Quitar presidente asignado (dejar libre)"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Weekend Info: Bosquejo y Canciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                Oficial
              </span>
              <div className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-200 font-bold">
                <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Bosquejo Oficial #{currentWeek.weekend.publicTalkOutlineNumber || 1}: {currentWeek.weekend.publicTalkTheme || '¿Conoce usted bien a Dios?'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Canciones FDS:</span>
                <span>{currentWeek.weekend.openingSong || 12} (apertura) • {currentWeek.weekend.middleSong || 68} (intermedia) • {currentWeek.weekend.closingSong || 138} (conclusión)</span>
              </span>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleQuickSyncOrganized('weekend')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-100 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] transition shadow-2xs cursor-pointer ml-auto"
                  title="Traer de Organized el bosquejo oficial de discurso público, estudio de La Atalaya y canciones del fin de semana"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Traer de Organized</span>
                </button>
              )}
            </div>
          </div>

          {/* Public talk & Watchtower row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discurso público */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Discurso Público (30 min)</span>
                  {currentWeek.weekend.publicTalkOutlineNumber && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold text-[10px]">
                      Bosquejo #{currentWeek.weekend.publicTalkOutlineNumber}
                    </span>
                  )}
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setOrganizedModalTab('bosquejos');
                      setIsOrganizedModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition cursor-pointer"
                    title="Ver catálogo de 194 bosquejos oficiales"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Catálogo de Bosquejos (1-194)</span>
                  </button>
                )}
              </div>

              {/* Selector de Bosquejo Oficial */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Seleccionar Bosquejo Oficial (#1 al 194):
                </span>
                <select
                  value={currentWeek.weekend.publicTalkOutlineNumber || ''}
                  onChange={e => {
                    const num = parseInt(e.target.value, 10);
                    const found = findOutlineByNumber(num);
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.weekend.publicTalkOutlineNumber = isNaN(num) ? undefined : num;
                    if (found) {
                      u.weekend.publicTalkTheme = found.title;
                    }
                    updateWeek(u);
                  }}
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Seleccionar bosquejo del catálogo oficial --</option>
                  {OFFICIAL_PUBLIC_TALK_OUTLINES.map(o => (
                    <option key={o.number} value={o.number}>
                      #{o.number}: {o.title} {o.category ? `(${o.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400">Tema del discurso:</span>
                <input
                  type="text"
                  value={currentWeek.weekend.publicTalkTheme || ''}
                  onChange={e => {
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.weekend.publicTalkTheme = e.target.value;
                    updateWeek(u);
                  }}
                  placeholder="Ej. ¿Quién es el Dios verdadero?"
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Orador (local o visitante):</span>
                  <input
                    type="text"
                    value={currentWeek.weekend.publicTalkSpeaker || ''}
                    onChange={e => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.weekend.publicTalkSpeaker = e.target.value;
                      updateWeek(u);
                    }}
                    placeholder="Ej. Hno. Juan Pérez"
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Congregación del orador:</span>
                  <input
                    type="text"
                    value={currentWeek.weekend.visitingSpeakerCongregation || ''}
                    onChange={e => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.weekend.visitingSpeakerCongregation = e.target.value;
                      updateWeek(u);
                    }}
                    placeholder="Ej. Los Pinos / Local"
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Estudio de La Atalaya */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-200/80">
                <span className="text-[10px] font-bold uppercase text-emerald-800">
                  Estudio de La Atalaya (60 min)
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Oficial
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-medium">Tema / Artículo de La Atalaya:</span>
                <input
                  type="text"
                  value={currentWeek.weekend.watchtowerTheme || ''}
                  onChange={e => {
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.weekend.watchtowerTheme = e.target.value;
                    updateWeek(u);
                  }}
                  placeholder="Ej. Confiemos plenamente en el cuidado amoroso de Jehová"
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-emerald-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 mt-0.5"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-medium">Texto temático:</span>
                <input
                  type="text"
                  value={currentWeek.weekend.watchtowerScripture || ''}
                  onChange={e => {
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.weekend.watchtowerScripture = e.target.value;
                    updateWeek(u);
                  }}
                  placeholder="Ej. Salmo 84:11"
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-emerald-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 mt-0.5"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Conductor */}
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Conductor</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">
                      {publishersMap.get(currentWeek.weekend.atalayaConductorId || '')?.name || (
                        <span className="text-slate-400 font-normal italic">Sin asignar</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-emerald-100">
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
                          pid => {
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
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      {currentWeek.weekend.atalayaConductorId ? 'Cambiar' : 'Asignar'}
                    </button>
                    {currentWeek.weekend.atalayaConductorId && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.atalayaConductorId = undefined;
                          updateWeek(u);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                        title="Quitar conductor asignado"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lector */}
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Lector</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">
                      {publishersMap.get(currentWeek.weekend.atalayaLectorId || '')?.name || (
                        <span className="text-slate-400 font-normal italic">Sin asignar</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-emerald-100">
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
                          pid => {
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
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      {currentWeek.weekend.atalayaLectorId ? 'Cambiar' : 'Asignar'}
                    </button>
                    {currentWeek.weekend.atalayaLectorId && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.atalayaLectorId = undefined;
                          updateWeek(u);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                        title="Quitar lector asignado"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Oración Inicial Fin de Semana */}
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Oración Inicial</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">
                      {publishersMap.get(currentWeek.weekend.initialPrayerId || '')?.name || (
                        <span className="text-slate-400 font-normal italic">Sin asignar</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-emerald-100">
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
                          pid => {
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
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      {currentWeek.weekend.initialPrayerId ? 'Cambiar' : 'Asignar'}
                    </button>
                    {currentWeek.weekend.initialPrayerId && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.initialPrayerId = undefined;
                          updateWeek(u);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                        title="Quitar oración inicial asignada"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Oración Final Fin de Semana */}
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Oración Final</span>
                    <p className="font-bold text-slate-900 mt-0.5 truncate">
                      {publishersMap.get(currentWeek.weekend.finalPrayerId || '')?.name || (
                        <span className="text-slate-400 font-normal italic">Sin asignar</span>
                      )}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-emerald-100">
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
                          pid => {
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
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      {currentWeek.weekend.finalPrayerId ? 'Cambiar' : 'Asignar'}
                    </button>
                    {currentWeek.weekend.finalPrayerId && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.finalPrayerId = undefined;
                          updateWeek(u);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                        title="Quitar oración final asignada"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekend duties */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Deberes Operativos (Fin de Semana)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
              {customDuties.filter(d => d.weekend).map(duty => {
                const assignedIds = currentWeek.weekend.duties[duty.key] || [];

                return (
                  <div
                    key={duty.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block truncate">
                          {duty.name}
                        </span>
                        {assignedIds.length > 0 && !isReadOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              if (!u.weekend.duties) u.weekend.duties = {};
                              u.weekend.duties[duty.key] = [];
                              updateWeek(u);
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                            title={`Quitar a todos los asignados a ${duty.name}`}
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {assignedIds.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Sin asignar</p>
                        ) : (
                          assignedIds.map(pid => (
                            <div key={pid} className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800 truncate">
                                {publishersMap.get(pid)?.name || 'Hno.'}
                              </span>
                              <button
                                onClick={() => handleToggleDutyPublisher('weekend', duty.key, pid)}
                                className="text-rose-500 hover:text-rose-700 ml-1"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        openSelector(
                          `Añadir a: ${duty.name} (Fin de Semana)`,
                          duty.key,
                          'any',
                          currentWeek.weekend.date,
                          'weekend',
                          undefined,
                          pid => handleToggleDutyPublisher('weekend', duty.key, pid),
                          () => {}
                        )
                      }
                      className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 text-left"
                    >
                      + Asignar persona
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
          )}

      {/* LIMPIEZA DEL SALÓN DEL REINO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Mantenimiento Teocrático
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-0.5">
            Limpieza del Salón del Reino esta semana:
          </h4>
          <p className="text-xs text-slate-500">
            Rotación automática entre grupos de predicación. Puedes seleccionar uno o más grupos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {preachingGroups.map(group => {
            const isAssigned = currentWeek.cleaningGroupNumbers.includes(group.number);
            return (
              <button
                key={group.number}
                onClick={() => handleToggleCleaningGroup(group.number)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isAssigned
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Grupo #{group.number} {group.name ? `(${group.name})` : ''}
              </button>
            );
          })}
        </div>
      </div>

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
                  label: 'Toda la semana completa',
                  desc: 'Entre Semana (VMC), Fin de Semana y Servicios/Deberes operativos',
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
                {
                  id: 'duties',
                  label: 'Solo Deberes y Turnos Operativos',
                  desc: 'Audio/Video, micrófonos, plataforma, acomodadores y seguridad',
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
