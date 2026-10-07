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
} from '../types';
import { AssignmentSelectorModal } from './AssignmentSelectorModal';
import { ReplacementsModal } from './ReplacementsModal';
import { MwbImportModal } from './MwbImportModal';
import { OrganizedImportModal } from './OrganizedImportModal';
import { MeetingTimerModal } from './MeetingTimerModal';
import { BatchWhatsAppModal } from './BatchWhatsAppModal';
import ClmScheduleView from './ClmScheduleView';
import { createAssignmentWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek, isWeekNeedingOrganizedSync } from '../utils/organizedSync';
import { OFFICIAL_PUBLIC_TALK_OUTLINES, findOutlineByNumber } from '../utils/theocraticData';
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
    preachingGroups,
    customDuties,
    publishers,
    publishersMap,
    conflicts,
    settings,
  } = useCongregation();
  const { effectiveRoleInfo } = useAuth();
  const isReadOnly = effectiveRoleInfo.isReadOnly || !effectiveRoleInfo.canEditSchedule;

  const [viewMode, setViewMode] = useState<'week' | 'clm_vmc'>('week');
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

  // Guía de Actividades, Catálogo & Timer modals
  const [isMwbModalOpen, setIsMwbModalOpen] = useState(false);
  const [isOrganizedModalOpen, setIsOrganizedModalOpen] = useState(false);
  const [organizedModalTab, setOrganizedModalTab] = useState<'catalogo' | 'importar' | 'bosquejos'>('catalogo');
  const [organizedModalFocus, setOrganizedModalFocus] = useState<'all' | 'midweek' | 'weekend'>('all');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

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
      {/* Top control bar: Week navigation & Auto-assign */}
      <div className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
          <button
            onClick={goToPreviousWeek}
            disabled={currentIndex <= 0}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>

          <div className="text-center px-1 sm:px-2 min-w-0">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0 hidden sm:inline" />
              <h2 className="text-xs sm:text-base font-bold text-slate-900 truncate">
                {currentWeek.weekStartDate} al {currentWeek.weekEndDate}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Semana {currentIndex + 1} de {sortedWeeks.length}
            </p>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            title={currentIndex < sortedWeeks.length - 1 ? 'Semana siguiente' : 'Crear siguiente semana'}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>

          <button
            onClick={addNextWeek}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all min-h-[44px] shrink-0"
            title="Añadir una nueva semana al programa"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Semana</span>
          </button>
        </div>

        {/* Selector de modo de vista: Completa vs Programa VMC */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Reunión Completa
          </button>
          <button
            type="button"
            onClick={() => setViewMode('clm_vmc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'clm_vmc'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            Programa VMC
          </button>
        </div>

        {/* Action buttons: Auto-assign, Copy, Special Event, MWB, Organized, Timer */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {!isReadOnly && (
            <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
              <button
                type="button"
                onClick={() => handleQuickSyncOrganized('all')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all shadow-xs min-h-[42px] cursor-pointer"
                title="Traer datos oficiales de Organized para esta semana (Entre semana y Fin de semana)"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">Traer de Organized</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrganizedModalTab('catalogo');
                  setIsOrganizedModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all min-h-[42px] cursor-pointer"
                title="Abrir Catálogo de semanas y bosquejos oficiales de Organized"
              >
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>
            </div>
          )}

          {!isReadOnly && (
            <button
              onClick={() => setIsMwbModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-xs min-h-[42px]"
              title="Importar temas de la Guía de Actividades para esta semana"
            >
              <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">Importar Guía (MWB)</span>
            </button>
          )}

          <button
            onClick={() => setIsBatchWhatsAppOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs min-h-[42px]"
            title="Enviar recordatorios de la semana por WhatsApp con enlace de confirmación a todos los hermanos asignados"
          >
            <MessageCircle className="w-4 h-4 text-white shrink-0" />
            <span className="truncate">Recordatorios WhatsApp</span>
          </button>

          <button
            onClick={() => setIsTimerModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs min-h-[42px]"
            title="Abrir cronómetro y modo atril para el presidente / cabina"
          >
            <Timer className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Modo Atril / Reloj</span>
          </button>

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
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[42px] ${
                currentWeek.specialEvent?.isSpecial
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Sparkle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                {currentWeek.specialEvent?.isSpecial ? 'Evento Especial (Activo)' : 'Evento Especial'}
              </span>
            </button>
          )}

          {!isReadOnly && (
            <button
              onClick={() => {
                setSourceWeekId(sortedWeeks[0]?.id || '');
                setIsCopyModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all min-h-[42px]"
            >
              <Copy className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="truncate">Copiar Estructura</span>
            </button>
          )}

          {!isReadOnly ? (
            <button
              onClick={autoAssignCurrentWeek}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all min-h-[44px]"
              title="Autoasignar toda esta semana eligiendo a los publicadores con más tiempo sin participar y sin cruces"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Autoasignar Semana</span>
            </button>
          ) : (
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Solo Lectura ({effectiveRoleInfo.shortName})</span>
            </div>
          )}
        </div>
      </div>

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

      {viewMode === 'clm_vmc' ? (
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <ClmScheduleView
            publishers={publishers}
            congregationId={settings.congregationName || currentWeek.id}
          />
        </div>
      ) : (
        <>
          {/* REUNIÓN DE ENTRE SEMANA: VIDA Y MINISTERIO CRISTIANOS */}
          <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs transition-opacity ${
            currentWeek.specialEvent?.noMeetingMidweek ? 'opacity-60 pointer-events-none' : ''
          }`}>
        {/* Section Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                {settings.midweekMeetingDay} • {currentWeek.midweek.date} ({settings.midweekMeetingTime})
              </span>
              <h3 className="text-lg font-bold tracking-tight">Vida y Ministerio Cristianos</h3>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-300">Presidencia:</span>
            <button
              onClick={() =>
                openSelector(
                  'Presidente de la reunión entre semana',
                  'vym_presidente',
                  'hermano',
                  currentWeek.midweek.date,
                  'midweek',
                  currentWeek.midweek.presidentId,
                  pid => {
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.midweek.presidentId = pid;
                    updateWeek(u);
                  },
                  () => {
                    const u = JSON.parse(JSON.stringify(currentWeek));
                    u.midweek.presidentId = undefined;
                    updateWeek(u);
                  }
                )
              }
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 transition-all"
            >
              {publishersMap.get(currentWeek.midweek.presidentId || '')?.name || 'Seleccionar Presidente'}
            </button>
          </div>
        </div>

        {/* Midweek Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Midweek Info: Lectura Bíblica y Canciones */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-2xs">
                Oficial
              </span>
              <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200 font-bold">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Lectura Bíblica: {currentWeek.midweek.bibleReading || 'Salmos 80 a 84 (Guía de Actividades)'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Canciones:</span>
                <span>{currentWeek.midweek.songFirst || 44} (inicio) • {currentWeek.midweek.songMiddle || 85} (intermedia) • {currentWeek.midweek.songConclude || 110} (conclusión)</span>
              </span>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleQuickSyncOrganized('midweek')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px] transition shadow-2xs cursor-pointer ml-auto"
                  title="Traer de Organized temas, lectura y cánticos oficiales para la reunión entre semana"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Traer de Organized</span>
                </button>
              )}
            </div>
          </div>
          {/* Prayers row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Oración Inicial</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {publishersMap.get(currentWeek.midweek.initialPrayerId || '')?.name || 'Sin asignar'}
                </p>
              </div>
              <button
                onClick={() =>
                  openSelector(
                    'Oración inicial entre semana',
                    'vym_oracion',
                    'hermano',
                    currentWeek.midweek.date,
                    'midweek',
                    currentWeek.midweek.initialPrayerId,
                    pid => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.midweek.initialPrayerId = pid;
                      updateWeek(u);
                    },
                    () => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.midweek.initialPrayerId = undefined;
                      updateWeek(u);
                    }
                  )
                }
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Cambiar
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Oración Final</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {publishersMap.get(currentWeek.midweek.finalPrayerId || '')?.name || 'Sin asignar'}
                </p>
              </div>
              <button
                onClick={() =>
                  openSelector(
                    'Oración final entre semana',
                    'vym_oracion',
                    'hermano',
                    currentWeek.midweek.date,
                    'midweek',
                    currentWeek.midweek.finalPrayerId,
                    pid => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.midweek.finalPrayerId = pid;
                      updateWeek(u);
                    },
                    () => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.midweek.finalPrayerId = undefined;
                      updateWeek(u);
                    }
                  )
                }
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* 1. TESOROS DE LA BIBLIA (Gris / Azul Teocrático) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b-2 border-slate-300">
              <div className="w-3 h-3 rounded-full bg-slate-600" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Tesoros de la Biblia
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Discurso 10 mins */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Discurso (10 min)</span>
                    <button
                      onClick={() =>
                        handleSendWhatsApp(
                          currentWeek.midweek.tesoros.discurso.publisherId,
                          currentWeek.midweek.tesoros.discurso.title,
                          'midweek',
                          currentWeek.midweek.date,
                          { timeMinutes: 10 }
                        )
                      }
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={currentWeek.midweek.tesoros.discurso.title}
                    onChange={e => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.midweek.tesoros.discurso.title = e.target.value;
                      updateWeek(u);
                    }}
                    placeholder="Título del discurso de Tesoros"
                    className="mt-1 w-full text-xs font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-hidden py-0.5"
                  />
                  <p className="mt-2 text-xs font-bold text-slate-900">
                    {publishersMap.get(currentWeek.midweek.tesoros.discurso.publisherId || '')?.name || (
                      <span className="text-slate-400 font-normal italic">Sin asignar</span>
                    )}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() =>
                      openSelector(
                        'Tesoros: Discurso de 10 min',
                        'vym_tesoros_discurso',
                        'hermano',
                        currentWeek.midweek.date,
                        'midweek',
                        currentWeek.midweek.tesoros.discurso.publisherId,
                        pid => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.midweek.tesoros.discurso.publisherId = pid;
                          updateWeek(u);
                        },
                        () => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.midweek.tesoros.discurso.publisherId = undefined;
                          updateWeek(u);
                        }
                      )
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Asignar
                  </button>
                  {currentWeek.midweek.tesoros.discurso.publisherId && (
                    <button
                      onClick={() =>
                        setReplacementState({
                          isOpen: true,
                          weekId: currentWeek.id,
                          meetingType: 'midweek',
                          meetingDate: currentWeek.midweek.date,
                          assignmentTitle: currentWeek.midweek.tesoros.discurso.title,
                          assignmentPath: 'tesoros.discurso',
                          currentPublisherId: currentWeek.midweek.tesoros.discurso.publisherId,
                          currentStatus: currentWeek.midweek.tesoros.discurso.status,
                          roleKey: 'vym_tesoros_discurso',
                          targetGender: 'hermano',
                        })
                      }
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Reemplazo
                    </button>
                  )}
                </div>
              </div>

              {/* Perlas escondidas 10 mins */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Perlas Escondidas (10 min)</span>
                    <button
                      onClick={() =>
                        handleSendWhatsApp(
                          currentWeek.midweek.tesoros.perlas.publisherId,
                          'Busquemos perlas escondidas',
                          'midweek',
                          currentWeek.midweek.date,
                          { timeMinutes: 10 }
                        )
                      }
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={currentWeek.midweek.tesoros.perlas.title}
                    onChange={e => {
                      const u = JSON.parse(JSON.stringify(currentWeek));
                      u.midweek.tesoros.perlas.title = e.target.value;
                      updateWeek(u);
                    }}
                    className="mt-1 w-full text-xs font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-hidden py-0.5"
                  />
                  <p className="mt-2 text-xs font-bold text-slate-900">
                    {publishersMap.get(currentWeek.midweek.tesoros.perlas.publisherId || '')?.name || (
                      <span className="text-slate-400 font-normal italic">Sin asignar</span>
                    )}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() =>
                      openSelector(
                        'Tesoros: Perlas Escondidas',
                        'vym_tesoros_perlas',
                        'hermano',
                        currentWeek.midweek.date,
                        'midweek',
                        currentWeek.midweek.tesoros.perlas.publisherId,
                        pid => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.midweek.tesoros.perlas.publisherId = pid;
                          updateWeek(u);
                        },
                        () => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.midweek.tesoros.perlas.publisherId = undefined;
                          updateWeek(u);
                        }
                      )
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Asignar
                  </button>
                  {currentWeek.midweek.tesoros.perlas.publisherId && (
                    <button
                      onClick={() =>
                        setReplacementState({
                          isOpen: true,
                          weekId: currentWeek.id,
                          meetingType: 'midweek',
                          meetingDate: currentWeek.midweek.date,
                          assignmentTitle: currentWeek.midweek.tesoros.perlas.title,
                          assignmentPath: 'tesoros.perlas',
                          currentPublisherId: currentWeek.midweek.tesoros.perlas.publisherId,
                          currentStatus: currentWeek.midweek.tesoros.perlas.status,
                          roleKey: 'vym_tesoros_perlas',
                          targetGender: 'hermano',
                        })
                      }
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Reemplazo
                    </button>
                  )}
                </div>
              </div>

              {/* Lectura de la Biblia (Estudiante) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Lectura de la Biblia (4 min)</span>
                    <button
                      onClick={() =>
                        handleSendWhatsApp(
                          currentWeek.midweek.tesoros.lecturaBiblia.publisherId,
                          'Lectura de la Biblia',
                          'midweek',
                          currentWeek.midweek.date,
                          { timeMinutes: 4, room: 'principal' }
                        )
                      }
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">Sala Principal</p>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {publishersMap.get(currentWeek.midweek.tesoros.lecturaBiblia.publisherId || '')?.name || (
                      <span className="text-slate-400 font-normal italic">Sin estudiante asignado</span>
                    )}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() =>
                      openSelector(
                        'Lectura de la Biblia (Estudiante)',
                        'vym_tesoros_lectura',
                        'hermano',
                        currentWeek.midweek.date,
                        'midweek',
                        currentWeek.midweek.tesoros.lecturaBiblia.publisherId,
                        (pid, suggestedLesson) => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.midweek.tesoros.lecturaBiblia.publisherId = pid;
                          if (suggestedLesson) {
                            u.midweek.tesoros.lecturaBiblia.lessonNumber = suggestedLesson;
                          }
                          updateWeek(u);
                        },
                        () => {
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.midweek.tesoros.lecturaBiblia.publisherId = undefined;
                          updateWeek(u);
                        }
                      )
                    }
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Asignar
                  </button>
                  {currentWeek.midweek.tesoros.lecturaBiblia.publisherId && (
                    <button
                      onClick={() =>
                        setReplacementState({
                          isOpen: true,
                          weekId: currentWeek.id,
                          meetingType: 'midweek',
                          meetingDate: currentWeek.midweek.date,
                          assignmentTitle: 'Lectura de la Biblia',
                          assignmentPath: 'tesoros.lecturaBiblia',
                          currentPublisherId: currentWeek.midweek.tesoros.lecturaBiblia.publisherId,
                          currentStatus: currentWeek.midweek.tesoros.lecturaBiblia.status,
                          roleKey: 'vym_tesoros_lectura',
                          targetGender: 'hermano',
                        })
                      }
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Reemplazo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. SEAMOS MEJORES MAESTROS (Dorado / Amarillo Teocrático) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Seamos Mejores Maestros (Demostraciones)
                </h4>
              </div>
              <button
                onClick={handleAddDemonstration}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Asignación
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentWeek.midweek.maestros.items.map((item, idx) => {
                const titularPub = item.publisherId ? publishersMap.get(item.publisherId) : undefined;
                const assistantPub = item.assistantId ? publishersMap.get(item.assistantId) : undefined;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Title & Room switcher */}
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => {
                            const u = JSON.parse(JSON.stringify(currentWeek));
                            u.midweek.maestros.items[idx].title = e.target.value;
                            updateWeek(u);
                          }}
                          className="text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-amber-300 focus:border-amber-600 focus:outline-hidden py-0.5 w-full"
                        />
                        <button
                          onClick={() => {
                            const u = JSON.parse(JSON.stringify(currentWeek));
                            u.midweek.maestros.items[idx].room =
                              item.room === 'auxiliar' ? 'principal' : 'auxiliar';
                            updateWeek(u);
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.room === 'auxiliar'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                        </button>
                      </div>

                      {/* Titular and Assistant cards */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {/* Titular */}
                        <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Estudiante (Titular)
                          </span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {titularPub ? titularPub.name : <span className="text-slate-400 italic font-normal">Sin asignar</span>}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <button
                              onClick={() =>
                                openSelector(
                                  `Estudiante: ${item.title}`,
                                  'vym_maestros_titular',
                                  'any',
                                  currentWeek.midweek.date,
                                  'midweek',
                                  item.publisherId,
                                  (pid, suggestedLesson) => {
                                    const u = JSON.parse(JSON.stringify(currentWeek));
                                    u.midweek.maestros.items[idx].publisherId = pid;
                                    if (suggestedLesson) {
                                      u.midweek.maestros.items[idx].lessonNumber = suggestedLesson;
                                    }
                                    updateWeek(u);
                                  },
                                  () => {
                                    const u = JSON.parse(JSON.stringify(currentWeek));
                                    u.midweek.maestros.items[idx].publisherId = undefined;
                                    updateWeek(u);
                                  }
                                )
                              }
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Asignar
                            </button>
                            {item.publisherId && (
                              <button
                                onClick={() =>
                                  setReplacementState({
                                    isOpen: true,
                                    weekId: currentWeek.id,
                                    meetingType: 'midweek',
                                    meetingDate: currentWeek.midweek.date,
                                    assignmentTitle: item.title,
                                    assignmentPath: `maestros.${idx}`,
                                    currentPublisherId: item.publisherId,
                                    currentStatus: item.status,
                                    roleKey: 'vym_maestros_titular',
                                    targetGender: 'any',
                                  })
                                }
                                className="text-[10px] text-slate-500 hover:text-slate-700"
                              >
                                Reemplazo
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Assistant */}
                        <div className="p-2.5 rounded-xl bg-white border border-amber-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Ayudante
                          </span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {assistantPub ? assistantPub.name : <span className="text-slate-400 italic font-normal">Sin ayudante</span>}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <button
                              onClick={() =>
                                openSelector(
                                  `Ayudante para: ${item.title}`,
                                  'vym_maestros_ayudante',
                                  titularPub?.gender === 'hermana' ? 'hermana' : 'any',
                                  currentWeek.midweek.date,
                                  'midweek',
                                  item.assistantId,
                                  pid => {
                                    const u = JSON.parse(JSON.stringify(currentWeek));
                                    u.midweek.maestros.items[idx].assistantId = pid;
                                    updateWeek(u);
                                  },
                                  () => {
                                    const u = JSON.parse(JSON.stringify(currentWeek));
                                    u.midweek.maestros.items[idx].assistantId = undefined;
                                    updateWeek(u);
                                  }
                                )
                              }
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                            >
                              Asignar
                            </button>
                            {item.assistantId && (
                              <button
                                onClick={() => {
                                  const u = JSON.parse(JSON.stringify(currentWeek));
                                  u.midweek.maestros.items[idx].assistantId = undefined;
                                  updateWeek(u);
                                }}
                                className="text-[10px] text-rose-500 hover:text-rose-700"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: WhatsApp & Delete item */}
                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.publisherId && (
                          <button
                            onClick={() =>
                              handleSendWhatsApp(item.publisherId, item.title, 'midweek', currentWeek.midweek.date, {
                                assistantName: assistantPub?.name,
                                room: item.room,
                                timeMinutes: item.timeMinutes,
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            item.status === 'confirmada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'rechazada'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {currentWeek.midweek.maestros.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveDemonstration(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Eliminar asignación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. NUESTRA VIDA CRISTIANA (Guinda / Rojo Teocrático) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b-2 border-rose-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
                  Nuestra Vida Cristiana
                </h4>
              </div>
              <button
                onClick={handleAddVidaPart}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Parte
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Dynamic Vida Cristiana Parts */}
              {currentWeek.midweek.vidaCristiana.items.map((part, idx) => (
                <div
                  key={part.id}
                  className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Parte #{idx + 1}</span>
                      <button
                        onClick={() =>
                          handleSendWhatsApp(part.publisherId, part.title, 'midweek', currentWeek.midweek.date, {
                            timeMinutes: part.timeMinutes || 15,
                          })
                        }
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={part.title}
                      onChange={e => {
                        const u = JSON.parse(JSON.stringify(currentWeek));
                        u.midweek.vidaCristiana.items[idx].title = e.target.value;
                        updateWeek(u);
                      }}
                      className="mt-1 w-full text-xs font-semibold text-slate-800 bg-transparent border-b border-dashed border-rose-300 focus:border-rose-600 focus:outline-hidden py-0.5"
                    />
                    <p className="mt-2 text-xs font-bold text-slate-900">
                      {publishersMap.get(part.publisherId || '')?.name || (
                        <span className="text-slate-400 font-normal italic">Sin asignar</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-between">
                    <button
                      onClick={() =>
                        openSelector(
                          part.title,
                          'vym_vida_partes',
                          'hermano',
                          currentWeek.midweek.date,
                          'midweek',
                          part.publisherId,
                          pid => {
                            const u = JSON.parse(JSON.stringify(currentWeek));
                            u.midweek.vidaCristiana.items[idx].publisherId = pid;
                            updateWeek(u);
                          },
                          () => {
                            const u = JSON.parse(JSON.stringify(currentWeek));
                            u.midweek.vidaCristiana.items[idx].publisherId = undefined;
                            updateWeek(u);
                          }
                        )
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Asignar
                    </button>
                    {part.publisherId && (
                      <button
                        onClick={() =>
                          setReplacementState({
                            isOpen: true,
                            weekId: currentWeek.id,
                            meetingType: 'midweek',
                            meetingDate: currentWeek.midweek.date,
                            assignmentTitle: part.title,
                            assignmentPath: `vida.${idx}`,
                            currentPublisherId: part.publisherId,
                            currentStatus: part.status,
                            roleKey: 'vym_vida_partes',
                            targetGender: 'hermano',
                          })
                        }
                        className="text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        Reemplazo
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Estudio Bíblico de Congregación (Conductor y Lector) */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    Estudio Bíblico de Congregación (30 min)
                  </span>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {/* Conductor */}
                    <div className="p-2.5 rounded-xl bg-white border border-rose-200/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Conductor</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {publishersMap.get(currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId || '')?.name || (
                          <span className="text-slate-400 font-normal italic">Sin asignar</span>
                        )}
                      </p>
                      <button
                        onClick={() =>
                          openSelector(
                            'Conductor Estudio Bíblico de Congregación',
                            'vym_estudio_conductor',
                            'hermano',
                            currentWeek.midweek.date,
                            'midweek',
                            currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId,
                            pid => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.midweek.vidaCristiana.estudioBiblico.conductorId = pid;
                              updateWeek(u);
                            },
                            () => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.midweek.vidaCristiana.estudioBiblico.conductorId = undefined;
                              updateWeek(u);
                            }
                          )
                        }
                        className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 block"
                      >
                        Asignar
                      </button>
                    </div>

                    {/* Lector */}
                    <div className="p-2.5 rounded-xl bg-white border border-rose-200/70">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Lector</span>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {publishersMap.get(currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId || '')?.name || (
                          <span className="text-slate-400 font-normal italic">Sin asignar</span>
                        )}
                      </p>
                      <button
                        onClick={() =>
                          openSelector(
                            'Lector Estudio Bíblico de Congregación',
                            'vym_estudio_lector',
                            'hermano',
                            currentWeek.midweek.date,
                            'midweek',
                            currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId,
                            pid => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.midweek.vidaCristiana.estudioBiblico.lectorId = pid;
                              updateWeek(u);
                            },
                            () => {
                              const u = JSON.parse(JSON.stringify(currentWeek));
                              u.midweek.vidaCristiana.estudioBiblico.lectorId = undefined;
                              updateWeek(u);
                            }
                          )
                        }
                        className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 block"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DEBERES OPERATIVOS ENTRE SEMANA */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Deberes Operativos (Entre Semana)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
              {customDuties.filter(d => d.midweek).map(duty => {
                const assignedIds = currentWeek.midweek.duties[duty.key] || [];

                return (
                  <div
                    key={duty.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block truncate">
                        {duty.name}
                      </span>
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
                                onClick={() => handleToggleDutyPublisher('midweek', duty.key, pid)}
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
                          `Añadir a: ${duty.name}`,
                          duty.key,
                          'any',
                          currentWeek.midweek.date,
                          'midweek',
                          undefined,
                          pid => handleToggleDutyPublisher('midweek', duty.key, pid),
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

      {/* REUNIÓN DE FIN DE SEMANA */}
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
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 transition-all"
            >
              {publishersMap.get(currentWeek.weekend.presidentId || '')?.name || 'Seleccionar Presidente'}
            </button>
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

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Conductor */}
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Conductor</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {publishersMap.get(currentWeek.weekend.atalayaConductorId || '')?.name || (
                      <span className="text-slate-400 font-normal italic">Sin asignar</span>
                    )}
                  </p>
                  <button
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
                    className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 block"
                  >
                    Asignar
                  </button>
                </div>

                {/* Lector */}
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Lector</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {publishersMap.get(currentWeek.weekend.atalayaLectorId || '')?.name || (
                      <span className="text-slate-400 font-normal italic">Sin asignar</span>
                    )}
                  </p>
                  <button
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
                    className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 block"
                  >
                    Asignar
                  </button>
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
                      <span className="text-[10px] font-bold uppercase text-slate-500 block truncate">
                        {duty.name}
                      </span>
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
      </>
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
