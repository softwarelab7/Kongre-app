import React, { useState, useMemo, useRef } from 'react';
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
import { SplashCheckbox } from './SplashCheckbox';
import { createAssignmentWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek, isWeekNeedingOrganizedSync } from '../utils/organizedSync';
import { createDefaultPrograma } from '../utils/clmDefaultProgram';
import { autoAsignarLocal } from '../utils/clmAutoAssignLocal';
import { OFFICIAL_PUBLIC_TALK_OUTLINES, findOutlineByNumber } from '../utils/theocraticData';
import {
  getLocalOfficialFormBytes,
  fillOfficialS89Pdf,
  downloadPdfBytesLocally,
  OfficialFormCode,
} from '../services/localOfficialFormsService';
import { LocalOfficialFormsModal } from './LocalOfficialFormsCenter';
import {
  formatTheocraticWeekRange,
  formatTheocraticWeekRangeShort,
  formatTheocraticMeetingDate,
  getMondayFromDate,
  isCurrentCalendarWeek,
  formatMonthYearKey,
} from '../utils/dateUtils';
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
  ArrowLeft,
  ArrowRightLeft,
  RefreshCw,
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
    addWeekForDate,
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
    getS89SlipsForWeek,
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

  const [officialFormModalCode, setOfficialFormModalCode] = useState<OfficialFormCode | null>(null);

  const handlePrintS89 = async () => {
    if (!currentWeek) return;
    const stored = await getLocalOfficialFormBytes('S-89');
    if (!stored) {
      setOfficialFormModalCode('S-89');
      setToastNotification('Carga primero el archivo oficial S-89.pdf descargado de JW Hub para rellenarlo.');
      setTimeout(() => setToastNotification(null), 4000);
      return;
    }

    const slips = getS89SlipsForWeek(currentWeek);
    if (slips.length === 0) {
      setToastNotification('No hay partes estudiantiles asignadas en esta semana.');
      setTimeout(() => setToastNotification(null), 3500);
      return;
    }

    try {
      const filledBytes = await fillOfficialS89Pdf(stored.bytes, slips);
      const outName = `S-89_Semana_${currentWeek.weekStartDate}.pdf`;
      downloadPdfBytesLocally(filledBytes, outName);
      setToastNotification(`Formato oficial "${outName}" rellenado y descargado.`);
    } catch (err) {
      console.error('Error rellenando S-89 oficial:', err);
      setOfficialFormModalCode('S-89');
    }
    setTimeout(() => setToastNotification(null), 3500);
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

  // Autoasignación integral para Entre Semana (VMC) + Fin de Semana
  const handleAutoAssignAllMeetings = () => {
    if (!currentWeek) return;
    // 1. Autoasignar semana en CongregationContext (incluye Fin de Semana y estructura base)
    autoAssignCurrentWeek();

    // 2. Autoasignar también el programa detallado de Entre Semana (VMC)
    const existingClm =
      getClmPrograma(currentWeek.weekStartDate) ||
      createDefaultPrograma(
        currentWeek.weekStartDate,
        settings.congregationName || currentWeek.id,
        currentWeek,
        publishers
      );
    const assignedClm = autoAsignarLocal(existingClm, publishers, clmProgramas);
    updateClmPrograma(assignedClm);
    try {
      localStorage.setItem(`clm_programa_${currentWeek.weekStartDate}`, JSON.stringify(assignedClm));
    } catch {}

    setToastNotification('✨ Reunión Entre Semana y Fin de Semana autoasignadas inteligentemente.');
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Autoasignación específica para la Reunión del Fin de Semana
  const handleAutoAssignWeekendOnly = () => {
    if (!currentWeek) return;
    const updated = JSON.parse(JSON.stringify(currentWeek)) as WeekSchedule;
    const activeMalePublishers = publishers.filter(
      (p) => p.isActive !== false && p.gender === 'hermano'
    );
    const usedIds = new Set<string>();

    const pickBestCandidate = (roleCheck: (p: Publisher) => boolean): Publisher | undefined => {
      const pool = activeMalePublishers.filter(
        (p) => roleCheck(p) && !usedIds.has(p.id)
      );
      const fallbackPool =
        pool.length > 0
          ? pool
          : activeMalePublishers.filter((p) => !usedIds.has(p.id));
      if (fallbackPool.length === 0) return undefined;
      return fallbackPool[0];
    };

    if (!updated.weekend.presidentId) {
      const candidate = pickBestCandidate(
        (p) => Boolean(p.roles.fds_presidente || p.spiritualStatus === 'anciano')
      );
      if (candidate) {
        updated.weekend.presidentId = candidate.id;
        usedIds.add(candidate.id);
      }
    } else {
      usedIds.add(updated.weekend.presidentId);
    }

    if (!updated.weekend.atalayaConductorId) {
      const candidate = pickBestCandidate(
        (p) => Boolean(p.roles.fds_atalaya_conductor || p.spiritualStatus === 'anciano')
      );
      if (candidate) {
        updated.weekend.atalayaConductorId = candidate.id;
        usedIds.add(candidate.id);
      }
    } else {
      usedIds.add(updated.weekend.atalayaConductorId);
    }

    if (!updated.weekend.atalayaLectorId) {
      const candidate = pickBestCandidate(
        (p) => Boolean(p.roles.fds_atalaya_lector || p.roles.vym_vida_lector)
      );
      if (candidate) {
        updated.weekend.atalayaLectorId = candidate.id;
        usedIds.add(candidate.id);
      }
    } else {
      usedIds.add(updated.weekend.atalayaLectorId);
    }

    if (!updated.weekend.initialPrayerId) {
      const candidate = pickBestCandidate(
        (p) => Boolean(p.roles.vym_oracion || p.spiritualStatus === 'anciano' || p.spiritualStatus === 'siervo_ministerial')
      );
      if (candidate) {
        updated.weekend.initialPrayerId = candidate.id;
        usedIds.add(candidate.id);
      }
    } else {
      usedIds.add(updated.weekend.initialPrayerId);
    }

    if (!updated.weekend.finalPrayerId) {
      const candidate = pickBestCandidate(
        (p) => Boolean(p.roles.vym_oracion || p.spiritualStatus === 'anciano' || p.spiritualStatus === 'siervo_ministerial')
      );
      if (candidate) {
        updated.weekend.finalPrayerId = candidate.id;
        usedIds.add(candidate.id);
      }
    } else {
      usedIds.add(updated.weekend.finalPrayerId);
    }

    if (!updated.weekend.publicTalkSpeaker) {
      const speakerCandidate = pickBestCandidate(
        (p) => Boolean(p.roles.fds_orador || p.spiritualStatus === 'anciano')
      );
      if (speakerCandidate) {
        updated.weekend.publicTalkSpeaker = speakerCandidate.name;
        usedIds.add(speakerCandidate.id);
      }
    }

    updateWeek(updated);
    setToastNotification('✨ Reunión del Fin de Semana autoasignada sin cruces.');
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Progreso en vivo de asignaciones de Entre Semana y Fin de Semana
  const meetingProgress = useMemo(() => {
    if (!currentWeek) {
      return {
        midweekAssigned: 0,
        midweekTotal: 0,
        weekendAssigned: 0,
        weekendTotal: 6,
      };
    }

    const clmProg =
      getClmPrograma(currentWeek.weekStartDate) ||
      createDefaultPrograma(
        currentWeek.weekStartDate,
        settings.congregationName || currentWeek.id,
        currentWeek,
        publishers
      );
    const assignableClmParts = clmProg.partes.filter((p) => p.tipo !== 'cancion');
    const midweekTotal = 3 + assignableClmParts.length;
    const midweekAssigned =
      (clmProg.presidente_nid ? 1 : 0) +
      (clmProg.oracion_inicial_nid ? 1 : 0) +
      (clmProg.oracion_final_nid ? 1 : 0) +
      assignableClmParts.filter((p) => Boolean(p.asignado_nid)).length;

    const w = currentWeek.weekend;
    const weekendTotal = 6;
    const weekendAssigned =
      (w.presidentId ? 1 : 0) +
      (w.initialPrayerId ? 1 : 0) +
      (w.publicTalkSpeaker ? 1 : 0) +
      (w.atalayaConductorId ? 1 : 0) +
      (w.atalayaLectorId ? 1 : 0) +
      (w.finalPrayerId ? 1 : 0);

    return {
      midweekAssigned,
      midweekTotal,
      weekendAssigned,
      weekendTotal,
    };
  }, [currentWeek, clmProgramas, getClmPrograma, settings.congregationName, publishers]);

  // Detección de cruces internos en la Reunión del Fin de Semana
  const weekendDuplicateIds = useMemo(() => {
    if (!currentWeek) return new Set<string>();
    const counts = new Map<string, number>();
    const w = currentWeek.weekend;
    [w.presidentId, w.initialPrayerId, w.atalayaConductorId, w.atalayaLectorId, w.finalPrayerId]
      .filter(Boolean)
      .forEach((id) => {
        if (id) counts.set(id, (counts.get(id) || 0) + 1);
      });
    const dupes = new Set<string>();
    counts.forEach((count, id) => {
      if (count > 1) dupes.add(id);
    });
    return dupes;
  }, [currentWeek]);

  if (!currentWeek) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-[#A1A1AA] bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A]">
        <p>No hay semanas programadas.</p>
        <button
          onClick={addNextWeek}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-xs cursor-pointer"
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

  // Selector interactivo de semanas y calendario
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const [weekPickerMonthFilter, setWeekPickerMonthFilter] = useState<string>('all');
  const [customJumpDate, setCustomJumpDate] = useState<string>('');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    weeks.forEach((w) => {
      if (w.weekStartDate) {
        set.add(w.weekStartDate.substring(0, 7));
      }
    });
    return Array.from(set).sort();
  }, [weeks]);

  const filteredPickerWeeks = useMemo(() => {
    if (weekPickerMonthFilter === 'all') return sortedWeeks;
    return sortedWeeks.filter((w) => w.weekStartDate.startsWith(weekPickerMonthFilter));
  }, [sortedWeeks, weekPickerMonthFilter]);

  const isCurrentWeekToday = useMemo(() => {
    if (!currentWeek) return false;
    return isCurrentCalendarWeek(currentWeek.weekStartDate);
  }, [currentWeek]);

  const goToToday = () => {
    const todayMonday = getMondayFromDate(new Date());
    const existing = weeks.find((w) => w.weekStartDate === todayMonday);
    if (existing) {
      setCurrentWeekId(existing.id);
    } else {
      addWeekForDate(todayMonday);
    }
    setIsWeekPickerOpen(false);
    setToastNotification('📍 Mostrando la semana en curso (hoy).');
    setTimeout(() => setToastNotification(null), 3000);
  };

  const handleJumpToCustomDate = () => {
    if (!customJumpDate) return;
    const targetMonday = getMondayFromDate(customJumpDate);
    const existing = weeks.find((w) => w.weekStartDate === targetMonday);
    if (existing) {
      setCurrentWeekId(existing.id);
    } else {
      addWeekForDate(targetMonday);
    }
    setIsWeekPickerOpen(false);
    setToastNotification(`Mostrando semana del ${formatTheocraticWeekRange(targetMonday)}`);
    setTimeout(() => setToastNotification(null), 3000);
  };

  const touchStartXRef = useRef<number | null>(null);

  const handleWeekTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleWeekTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) >= 55) {
      if (deltaX > 0) {
        goToPreviousWeek();
      } else {
        goToNextWeek();
      }
    }
  };

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
    if (isReadOnly) return;
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
    <div className="space-y-4 sm:space-y-6">
      {/* Barra de Herramientas de Programa de Reuniones (Swipeable en Móvil, sin superposición) */}
      <div
        onTouchStart={handleWeekTouchStart}
        onTouchEnd={handleWeekTouchEnd}
        className="relative z-20 bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-3 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3"
      >
        {/* Fila 1: Navegación de Semana y Selector de Modalidad (Apilados limpiamente en móvil, en línea en desktop) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3">
          {/* Bloque 1A: Contador (desktop) + Cápsula de Semana + Botón Hoy */}
          <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto min-w-0">
            <span className="hidden lg:inline-block text-xs font-semibold font-mono tabular-nums text-zinc-500 dark:text-[#A1A1AA] mr-1 shrink-0">
              Semana {currentIndex + 1} de {sortedWeeks.length}
            </span>

            {/* Cápsula de navegación de semana interactiva con selector rápido */}
            <div className="relative flex items-center gap-1.5 flex-1 md:flex-initial min-w-0">
              <div className="flex items-center justify-between flex-1 md:flex-initial min-w-0 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  disabled={currentIndex <= 0}
                  className="min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 p-1.5 sm:p-1 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-[#121216] disabled:opacity-30 transition-colors text-zinc-700 dark:text-[#F4F4F5] cursor-pointer active:scale-95 shrink-0"
                  title="Semana anterior (o desliza a la derecha)"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsWeekPickerOpen((prev) => !prev)}
                  className="min-h-[36px] sm:min-h-0 flex-1 md:flex-initial min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5] hover:bg-white dark:hover:bg-[#121216] transition-all cursor-pointer select-none shadow-2xs"
                  title="Clic para abrir selector de semanas, meses y calendario"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {formatTheocraticWeekRangeShort(currentWeek.weekStartDate, currentWeek.weekEndDate)}
                  </span>
                  {isCurrentWeekToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" title="Semana en curso (Hoy)" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                      isWeekPickerOpen ? 'rotate-180 text-indigo-500' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={goToNextWeek}
                  className="min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 p-1.5 sm:p-1 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-[#121216] transition-colors text-zinc-700 dark:text-[#F4F4F5] cursor-pointer active:scale-95 shrink-0"
                  title={currentIndex < sortedWeeks.length - 1 ? 'Semana siguiente (o desliza a la izquierda)' : 'Crear siguiente semana'}
                  aria-label="Semana siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Botón rápido "Hoy" cuando el usuario navega a otra semana */}
              {!isCurrentWeekToday && (
                <button
                  type="button"
                  onClick={goToToday}
                  className="min-h-[38px] sm:min-h-0 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70 text-xs font-extrabold hover:bg-indigo-100 transition-all cursor-pointer shrink-0 active:scale-95"
                  title="Volver a la semana actual (Hoy)"
                >
                  Hoy
                </button>
              )}

              {/* Selector de semanas y fechas (Página completa en móvil, popover en desktop) */}
              {isWeekPickerOpen && (
                <>
                  <div
                    className="hidden sm:block fixed inset-0 z-40"
                    onClick={() => setIsWeekPickerOpen(false)}
                  />

                  <div className="fixed inset-0 sm:inset-auto sm:absolute sm:top-full sm:left-0 sm:mt-2 z-50 sm:w-[380px] bg-white dark:bg-[#121216] border-0 sm:border border-zinc-200 dark:border-[#27272A] rounded-none sm:rounded-2xl shadow-xl p-4 sm:p-3.5 space-y-3 overflow-y-auto animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2.5 sm:pb-2 border-b border-zinc-100 dark:border-[#27272A]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-mobile-back-btn="true"
                          onClick={() => setIsWeekPickerOpen(false)}
                          className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] cursor-pointer active:scale-95 shrink-0"
                          aria-label="Volver al programa"
                        >
                          <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </button>
                        <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm sm:text-xs font-bold text-zinc-900 dark:text-[#F4F4F5]">
                          Selector de Semanas
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={goToToday}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs border ${
                            isCurrentWeekToday
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                          }`}
                          title="Ir directamente a la semana en curso de hoy"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>{isCurrentWeekToday ? 'Semana de Hoy' : 'Ir a Hoy'}</span>
                        </button>
                      </div>
                    </div>

                    {availableMonths.length > 1 && (
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                        <button
                          type="button"
                          onClick={() => setWeekPickerMonthFilter('all')}
                          className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                            weekPickerMonthFilter === 'all'
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                              : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                          }`}
                        >
                          Todas
                        </button>
                        {availableMonths.map((mKey) => (
                          <button
                            key={mKey}
                            type="button"
                            onClick={() => setWeekPickerMonthFilter(mKey)}
                            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                              weekPickerMonthFilter === mKey
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold'
                                : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                            }`}
                          >
                            {formatMonthYearKey(mKey)}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {filteredPickerWeeks.map((w, idx) => {
                        const isSelected = w.id === currentWeek.id;
                        const isToday = isCurrentCalendarWeek(w.weekStartDate);
                        const hasEvent = Boolean(w.specialEvent?.isSpecial);

                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setCurrentWeekId(w.id);
                              setIsWeekPickerOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between gap-2 text-xs cursor-pointer border ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-2xs font-semibold'
                                : 'bg-white dark:bg-[#18181F] border-zinc-200/60 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-indigo-500/40 text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F]/80'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-bold font-mono tabular-nums ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-white'}`}>
                                  {formatTheocraticWeekRange(w.weekStartDate, w.weekEndDate)}
                                </span>
                                {isToday && (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                    Hoy
                                  </span>
                                )}
                                {hasEvent && (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                    Especial
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] truncate mt-0.5">
                                {w.midweek.bibleReading || w.specialEvent?.title || `Semana ${idx + 1}`}
                              </p>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A] space-y-2">
                      <label className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] block">
                        Saltar o crear fecha exacta:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={customJumpDate}
                          onChange={(e) => setCustomJumpDate(e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={handleJumpToCustomDate}
                          disabled={!customJumpDate}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          Ir a Fecha
                        </button>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            addNextWeek();
                            setIsWeekPickerOpen(false);
                            setToastNotification('Siguiente semana agregada al programa.');
                            setTimeout(() => setToastNotification(null), 3000);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-xs transition cursor-pointer border border-transparent dark:border-[#27272A]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Siguiente Semana (+7 días)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bloque 1B: Selector de tipo de reunión con indicadores de progreso */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="grid grid-cols-3 md:flex items-center w-full md:w-auto bg-zinc-100 dark:bg-[#18181F] p-1 rounded-xl border border-zinc-200 dark:border-[#27272A] gap-1">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`min-h-[36px] md:min-h-0 px-2 sm:px-3 py-1.5 md:py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 border border-zinc-200/80 dark:border-[#27272A] shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
                }`}
              >
                <span>Todo</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {meetingProgress.midweekAssigned + meetingProgress.weekendAssigned}/
                  {meetingProgress.midweekTotal + meetingProgress.weekendTotal}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('midweek')}
                className={`min-h-[36px] md:min-h-0 px-2 sm:px-3 py-1.5 md:py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                  viewMode === 'midweek'
                    ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 border border-zinc-200/80 dark:border-[#27272A] shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
                }`}
              >
                <span className="truncate">Entre Semana</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums shrink-0 ${
                    meetingProgress.midweekAssigned >= meetingProgress.midweekTotal && meetingProgress.midweekTotal > 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {meetingProgress.midweekAssigned}/{meetingProgress.midweekTotal}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekend')}
                className={`min-h-[36px] md:min-h-0 px-2 sm:px-3 py-1.5 md:py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
                  viewMode === 'weekend'
                    ? 'bg-white dark:bg-[#121216] text-emerald-600 dark:text-emerald-400 border border-zinc-200/80 dark:border-[#27272A] shadow-2xs font-bold'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
                }`}
              >
                <span className="truncate">Fin de Semana</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums shrink-0 ${
                    meetingProgress.weekendAssigned >= meetingProgress.weekendTotal
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {meetingProgress.weekendAssigned}/{meetingProgress.weekendTotal}
                </span>
              </button>
            </div>

            {/* Botón Nueva Semana sutil (solo en desktop md+) */}
            <button
              onClick={addNextWeek}
              className="hidden md:flex p-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] transition-all cursor-pointer shrink-0"
              title="Añadir nueva semana"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS DE ACCIONES ── */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 pt-2.5 border-t border-zinc-200 dark:border-[#27272A] w-full text-xs">
          {/* Lado izquierdo: Acciones clave con diseño limpio */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            {!isReadOnly ? (
              <button
                onClick={
                  viewMode === 'weekend'
                    ? handleAutoAssignWeekendOnly
                    : handleAutoAssignAllMeetings
                }
                className="min-h-[34px] sm:min-h-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                title="Autoasignar toda esta semana respetando rotación y sin cruces"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Autoasignar</span>
              </button>
            ) : (
              <span className="text-zinc-500 dark:text-[#A1A1AA] text-[11px] sm:text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/60 dark:border-[#27272A] rounded-lg truncate">
                Solo lectura ({effectiveRoleInfo.shortName})
              </span>
            )}

            <button
              onClick={() => setIsBatchWhatsAppOpen(true)}
              className="min-h-[34px] sm:min-h-0 flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 font-medium transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              title="Enviar recordatorios de la semana por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Lado derecho: Documentos, Cruces y Menú Más */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
            {/* S-89 oficial (en escritorio visible directo, en móvil dentro de Más Opciones) */}
            <button
              type="button"
              onClick={handlePrintS89}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] font-medium transition-all cursor-pointer"
              title="Descargar hojas oficiales de asignación S-89 en PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>S-89</span>
            </button>

            {/* Fichas S-38 */}
            <button
              type="button"
              onClick={handleOpenS38}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] font-medium transition-all cursor-pointer"
              title="Registros S-38 y folleto de oratoria"
            >
              <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>S-38</span>
            </button>

            {/* Modo Atril y Cronómetro de Presidencia */}
            <button
              type="button"
              onClick={() => setIsTimerModalOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-amber-800 dark:text-amber-300 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200/80 dark:border-amber-800/60 font-semibold transition-all cursor-pointer"
              title="Abrir Modo Atril y Cronómetro de Presidencia"
            >
              <Timer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Modo Atril</span>
            </button>

            {/* Cruces */}
            <button
              type="button"
              onClick={() => setIsConflictsModalOpen(true)}
              className={`min-h-[34px] sm:min-h-0 flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer border active:scale-95 whitespace-nowrap shrink-0 ${
                weekConflictsCount > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-mono tabular-nums'
                  : 'text-zinc-600 dark:text-[#A1A1AA] border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#18181F]'
              }`}
              title="Auditoría de cruces de esta semana"
            >
              {weekConflictsCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="font-mono tabular-nums">{weekConflictsCount > 0 ? `${weekConflictsCount} Cruces` : 'Sin Cruces'}</span>
            </button>

            {/* Menú Desplegable "Más Opciones" */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className="min-h-[34px] min-w-[34px] sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 p-1.5 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] transition-all cursor-pointer active:scale-95"
                title="Más herramientas, S-89, S-38 y opciones"
                aria-label="Más herramientas y opciones"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div
                    className="hidden sm:block fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className="fixed inset-0 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-1.5 sm:w-64 sm:max-h-[calc(100vh-140px)] overflow-y-auto bg-white dark:bg-[#121216] border-0 sm:border border-zinc-200 dark:border-[#27272A] rounded-none sm:rounded-2xl shadow-xl z-50 p-3 sm:py-1.5 sm:px-0 animate-in fade-in duration-100 flex flex-col justify-start">
                    <div className="flex sm:hidden items-center gap-3 px-3 py-2.5 mb-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] shadow-2xs shrink-0">
                      <button
                        type="button"
                        data-mobile-back-btn="true"
                        onClick={() => setIsMoreMenuOpen(false)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] cursor-pointer active:scale-95 shrink-0"
                        aria-label="Atrás"
                      >
                        <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      </button>
                      <span className="text-sm font-extrabold text-zinc-800 dark:text-[#F4F4F5] truncate">
                        Herramientas del Programa
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#121216] sm:bg-transparent sm:dark:bg-transparent rounded-2xl sm:rounded-none border border-zinc-200 dark:border-[#27272A] sm:border-0 divide-y divide-zinc-100 dark:divide-[#27272A] sm:divide-y-0 overflow-hidden shadow-2xs sm:shadow-none">
                      {/* Mobile quick access to S-89 and S-38 */}
                      <div className="sm:hidden divide-y divide-zinc-100 dark:divide-[#27272A]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            handlePrintS89();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
                        >
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>Descargar Hojas S-89 (PDF)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            handleOpenS38();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
                        >
                          <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Registro de Estudiantes (S-38)</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsMwbModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-zinc-800 sm:text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
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
                        className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-zinc-800 sm:text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
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
                        className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-zinc-800 sm:text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
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
                        className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-zinc-800 sm:text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
                      >
                        <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Modo Atril / Cronómetro</span>
                      </button>

                      {!isReadOnly && (
                        <>
                          <div className="hidden sm:block my-1 border-t border-zinc-100 dark:border-[#27272A]" />
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
                            className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-zinc-800 sm:text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
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
                            className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-zinc-800 sm:text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] cursor-pointer text-left"
                          >
                            <Copy className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span>Copiar Estructura de Semana</span>
                          </button>

                          <div className="hidden sm:block my-1 border-t border-zinc-100 dark:border-[#27272A]" />
                          <button
                            type="button"
                            onClick={() => {
                              setIsMoreMenuOpen(false);
                              setIsClearWeekAssignmentsModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3.5 sm:py-2 text-xs font-semibold sm:font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-left"
                          >
                            <UserMinus className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>Quitar Asignados de la Semana</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SPECIAL EVENT BANNER IF ACTIVE */}
      {currentWeek.specialEvent?.isSpecial && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border-2 border-amber-400/80 dark:border-amber-500/30 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded-full inline-block">
                Fecha Especial Programada
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] mt-1 truncate">
                {currentWeek.specialEvent.title}
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                {currentWeek.specialEvent.noMeetingMidweek && '⛔ Sin reunión de entre semana. '}
                {currentWeek.specialEvent.noMeetingWeekend && '⛔ Sin reunión de fin de semana. '}
                {currentWeek.specialEvent.notes && `Nota: ${currentWeek.specialEvent.notes}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEventTitle(currentWeek.specialEvent?.title || '');
              setEventType(currentWeek.specialEvent?.type || 'visita_superintendente');
              setNoMidweek(Boolean(currentWeek.specialEvent?.noMeetingMidweek));
              setNoWeekend(Boolean(currentWeek.specialEvent?.noMeetingWeekend));
              setEventNotes(currentWeek.specialEvent?.notes || '');
              setIsSpecialEventModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-amber-300 dark:border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-300 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
          >
            Modificar Evento
          </button>
        </div>
      )}

      {/* REUNIÓN DE ENTRE SEMANA (VMC - ASIGNADOR OFICIAL) */}
      {(viewMode === 'all' || viewMode === 'midweek') && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-[#27272A] overflow-hidden bg-white dark:bg-[#121216] shadow-xs">
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
            className={`rounded-2xl border border-zinc-200 dark:border-[#27272A] overflow-hidden bg-white dark:bg-[#121216] shadow-xs transition-opacity ${
              currentWeek.specialEvent?.noMeetingWeekend ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {/* ── ENCABEZADO FDS REDISEÑADO CON IDENTIDAD VISUAL, PROGRESO Y SALTO RÁPIDO ── */}
            <div className="border-t-4 border-t-emerald-600 dark:border-t-emerald-500 px-3.5 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-b from-emerald-50/50 via-zinc-50/70 to-white dark:from-emerald-950/25 dark:via-[#18181F] dark:to-[#121216] border-b border-zinc-200 dark:border-[#27272A] flex flex-col gap-3 text-xs">
              {/* Fila 1: Identidad visual, Fecha/Hora completa y Barra de Progreso */}
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-zinc-900 dark:text-[#F4F4F5] text-sm sm:text-base tracking-tight">
                        Reunión del Fin de Semana
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                        Pública y La Atalaya
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] sm:text-xs">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="capitalize">
                        {formatTheocraticMeetingDate(currentWeek.weekend.date, settings.weekendMeetingDay)}
                        {settings.weekendMeetingTime ? ` • ${settings.weekendMeetingTime}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indicador de progreso de 6 segmentos */}
                <div
                  className={`flex flex-col items-end px-2.5 py-1.5 rounded-xl border shrink-0 ${
                    meetingProgress.weekendAssigned >= meetingProgress.weekendTotal
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
                      : 'bg-white border-zinc-200 text-zinc-700 dark:bg-[#18181F] dark:border-[#27272A] dark:text-[#F4F4F5]'
                  }`}
                  title="Progreso de asignaciones de Fin de Semana"
                >
                  <div className="flex items-center gap-1.5 font-mono tabular-nums text-[11px] font-extrabold">
                    <CheckCircle2
                      size={12}
                      className={
                        meetingProgress.weekendAssigned >= meetingProgress.weekendTotal
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-emerald-500'
                      }
                    />
                    <span>
                      {meetingProgress.weekendAssigned}/{meetingProgress.weekendTotal} asignados
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-0.5 w-20 h-1.5 mt-1">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <span
                        key={step}
                        className={`h-full rounded-xs transition-colors ${
                          meetingProgress.weekendAssigned >= step
                            ? 'bg-emerald-500 dark:bg-emerald-400'
                            : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Fila 2: Resumen de Bosquejo y Cánticos + Botones de Acción Rápida */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-200/70 dark:border-[#27272A]">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setWeekendEditTab('discurso');
                      setIsWeekendEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#204d74]/10 hover:bg-[#204d74]/20 dark:bg-[#204d74]/30 text-[#204d74] dark:text-sky-300 border border-[#204d74]/20 text-[11px] font-bold transition cursor-pointer"
                    title="Clic para editar bosquejo u orador"
                  >
                    <Mic size={11} className="shrink-0" />
                    <span>
                      {currentWeek.weekend.publicTalkOutlineNumber
                        ? `Bosquejo #${currentWeek.weekend.publicTalkOutlineNumber}`
                        : 'Definir Bosquejo'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWeekendEditTab('canciones');
                      setIsWeekendEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200/80 dark:border-[#27272A] text-[11px] font-semibold text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums transition cursor-pointer"
                    title="Clic para editar los cánticos del fin de semana"
                  >
                    <Music size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Cánticos {currentWeek.weekend.openingSong || 12}, {currentWeek.weekend.middleSong || 68},{' '}
                      {currentWeek.weekend.closingSong || 138}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAutoAssignWeekendOnly}
                      className="min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
                      title="Autoasignar presidente, oraciones, conductor y lector del fin de semana"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                      <span>Autoasignar FDS</span>
                    </button>
                  )}

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleQuickSyncOrganized('weekend')}
                      className="min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] font-semibold text-xs transition shadow-2xs cursor-pointer active:scale-95"
                      title="Traer de Organized el bosquejo oficial y canciones del fin de semana"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Sincronizar Bosquejo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setOrganizedModalTab('bosquejos');
                      setIsOrganizedModalOpen(true);
                    }}
                    className="min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] font-semibold text-xs transition shadow-2xs cursor-pointer active:scale-95"
                    title="Ver catálogo oficial de 194 bosquejos"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Catálogo (#1-194)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTimerModalOpen(true)}
                    className="min-h-[32px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-[#18181F] dark:hover:bg-[#27272A] dark:text-[#F4F4F5] border border-transparent dark:border-[#27272A] font-semibold text-xs transition shadow-2xs cursor-pointer active:scale-95"
                    title="Abrir cronómetro de atril para Discurso Público y Estudio de La Atalaya"
                  >
                    <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Atril</span>
                  </button>
                </div>
              </div>

              {/* Fila 3: Barra de salto rápido a secciones de Fin de Semana */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-zinc-200/60 dark:border-[#27272A]">
                {[
                  {
                    id: 'fds-sec-apertura',
                    label: 'Apertura',
                    assigned:
                      (currentWeek.weekend.presidentId ? 1 : 0) + (currentWeek.weekend.initialPrayerId ? 1 : 0),
                    total: 2,
                    pillClass:
                      'bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300/60 dark:border-zinc-700',
                    dotClass: 'bg-emerald-500',
                  },
                  {
                    id: 'fds-sec-discurso',
                    label: 'Discurso Público',
                    assigned: currentWeek.weekend.publicTalkSpeaker ? 1 : 0,
                    total: 1,
                    pillClass:
                      'bg-[#204d74]/10 hover:bg-[#204d74]/20 dark:bg-[#204d74]/25 dark:hover:bg-[#204d74]/35 text-[#204d74] dark:text-sky-300 border-[#204d74]/25',
                    dotClass: 'bg-[#204d74] dark:bg-sky-400',
                  },
                  {
                    id: 'fds-sec-atalaya',
                    label: 'La Atalaya',
                    assigned:
                      (currentWeek.weekend.atalayaConductorId ? 1 : 0) +
                      (currentWeek.weekend.atalayaLectorId ? 1 : 0),
                    total: 2,
                    pillClass:
                      'bg-[#1d6349]/10 hover:bg-[#1d6349]/20 dark:bg-[#1d6349]/25 dark:hover:bg-[#1d6349]/35 text-[#1d6349] dark:text-emerald-300 border-[#1d6349]/25',
                    dotClass: 'bg-[#1d6349] dark:bg-emerald-400',
                  },
                  {
                    id: 'fds-sec-conclusion',
                    label: 'Conclusión',
                    assigned: currentWeek.weekend.finalPrayerId ? 1 : 0,
                    total: 1,
                    pillClass:
                      'bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300/60 dark:border-zinc-700',
                    dotClass: 'bg-teal-500',
                  },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(sec.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer shrink-0 shadow-2xs ${sec.pillClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${sec.dotClass}`} />
                    <span>{sec.label}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      ({sec.assigned}/{sec.total})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── LISTADO OFICIAL DE LA REUNIÓN DEL FIN DE SEMANA ── */}
            <div className="flex-1 overflow-y-auto">
              {/* 1. MARCO INICIAL: Presidente, Cántico 1, Oración Inicial */}
              {/* FILA: Presidente */}
              <div id="fds-sec-apertura" className="border-b border-zinc-100 dark:border-[#27272A]/70 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2.5 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                      P.
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                          Presidente de la reunión
                        </h4>
                        <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> (5 min)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight leading-relaxed">
                        Preside la reunión, presenta al orador visitante/local y da los anuncios finales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0 flex-wrap">
                    {currentWeek.weekend.presidentId &&
                      weekendDuplicateIds.has(currentWeek.weekend.presidentId) && (
                        <button
                          type="button"
                          onClick={() => setIsConflictsModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                          title="Este hermano tiene más de una asignación en esta reunión"
                        >
                          <AlertTriangle size={12} />
                          <span>Cruce</span>
                        </button>
                      )}
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
                          className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="Cambiar presidente"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{publishersMap.get(currentWeek.weekend.presidentId)?.name || 'Hno. Asignado'}</span>
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setReplacementState({
                                isOpen: true,
                                weekId: currentWeek.id,
                                meetingType: 'weekend',
                                meetingDate: currentWeek.weekend.date,
                                assignmentTitle: 'Presidente de la Reunión',
                                assignmentPath: 'weekend.presidentId',
                                currentPublisherId: currentWeek.weekend.presidentId,
                                roleKey: 'fds_presidente',
                                targetGender: 'hermano',
                              })
                            }
                            className="p-1.5 rounded-full text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Sustitución rápida de presidente"
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                        )}

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
                          className="p-1.5 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                            className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-dashed border-zinc-300 dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all cursor-pointer active:scale-95"
                      >
                        + Asignar Presidente
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FILA: Cántico Inicial */}
              <div className="border-b border-zinc-100 dark:border-[#27272A]/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                          Cántico <span className="font-mono tabular-nums">{currentWeek.weekend.openingSong || 12}</span>
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                        Cántico de apertura de la reunión del fin de semana
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-500 dark:text-[#A1A1AA] border border-transparent dark:border-[#27272A]">
                      Congregación
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('canciones');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
                        title="Cambiar número de cántico"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* FILA: Oración Inicial */}
              <div className="border-b border-zinc-100 dark:border-[#27272A]/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2.5 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                          Oración de apertura
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                        Petición y agradecimiento a Jehová antes de la conferencia pública
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0 flex-wrap">
                    {currentWeek.weekend.initialPrayerId &&
                      weekendDuplicateIds.has(currentWeek.weekend.initialPrayerId) && (
                        <button
                          type="button"
                          onClick={() => setIsConflictsModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                          title="Este hermano tiene más de una asignación en esta reunión"
                        >
                          <AlertTriangle size={12} />
                          <span>Cruce</span>
                        </button>
                      )}
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
                          className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="Cambiar hermano asignado"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{publishersMap.get(currentWeek.weekend.initialPrayerId)?.name || 'Hno. Asignado'}</span>
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setReplacementState({
                                isOpen: true,
                                weekId: currentWeek.id,
                                meetingType: 'weekend',
                                meetingDate: currentWeek.weekend.date,
                                assignmentTitle: 'Oración Inicial (Fin de Semana)',
                                assignmentPath: 'weekend.initialPrayerId',
                                currentPublisherId: currentWeek.weekend.initialPrayerId,
                                roleKey: 'vym_oracion',
                                targetGender: 'hermano',
                              })
                            }
                            className="p-1.5 rounded-full text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Sustitución rápida"
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                        )}

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
                          className="p-1.5 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                            className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-dashed border-zinc-300 dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all cursor-pointer active:scale-95"
                      >
                        + Asignar Oración
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. SECCIÓN: DISCURSO PÚBLICO (30 MIN) */}
              <div id="fds-sec-discurso" className="mt-2 scroll-mt-24">
                <div className="w-full bg-[#204d74] text-white py-2.5 px-4 sm:px-6 font-bold uppercase text-xs sm:text-sm tracking-wider flex items-center justify-between shadow-xs select-none">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-sky-200 shrink-0" />
                    <span>DISCURSO PÚBLICO (30 MIN)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-white/15 text-white/95">
                    {currentWeek.weekend.publicTalkSpeaker ? '1/1 asignado' : '0/1 asignado'}
                  </span>
                </div>

                <div className="border-b border-zinc-100 dark:border-[#27272A]/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3.5 sm:py-4 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-3">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {currentWeek.weekend.publicTalkOutlineNumber && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold font-mono tabular-nums text-[10px] tracking-wide shrink-0">
                              Bosquejo #{currentWeek.weekend.publicTalkOutlineNumber}
                            </span>
                          )}
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                            {currentWeek.weekend.publicTalkTheme || 'Tema del Discurso Público por definir'}
                          </h4>
                          <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-normal">
                            (30 min)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                          <span className="font-medium text-zinc-700 dark:text-[#F4F4F5]">
                            Orador: <strong>{currentWeek.weekend.publicTalkSpeaker || 'Sin especificar'}</strong>
                            {currentWeek.weekend.visitingSpeakerCongregation && (
                              <span className="text-zinc-500 dark:text-[#A1A1AA] ml-1">
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

                    <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0">
                      {currentWeek.weekend.publicTalkSpeaker ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setWeekendEditTab('discurso');
                              setIsWeekendEditModalOpen(true);
                            }}
                            className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                            title="Modificar orador o congregación"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                              className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-indigo-50 text-zinc-600 hover:text-indigo-700 border border-dashed border-zinc-300 dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-indigo-400 dark:hover:bg-indigo-950/30 transition-all cursor-pointer active:scale-95"
                        >
                          + Asignar Orador
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CÁNTICO INTERMEDIO */}
              <div className="border-b border-zinc-100 dark:border-[#27272A]/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                          Cántico <span className="font-mono tabular-nums">{currentWeek.weekend.middleSong || 68}</span>
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                        Cántico intermedio entre el discurso y el estudio de La Atalaya
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-500 dark:text-[#A1A1AA] border border-transparent dark:border-[#27272A]">
                      Congregación
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('canciones');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
                        title="Cambiar número de cántico intermedio"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. SECCIÓN: ESTUDIO DE LA ATALAYA (60 MIN) */}
              <div id="fds-sec-atalaya" className="mt-2 scroll-mt-24">
                <div className="w-full bg-[#1d6349] text-white py-2.5 px-4 sm:px-6 font-bold uppercase text-xs sm:text-sm tracking-wider flex items-center justify-between shadow-xs select-none">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-200 shrink-0" />
                    <span>ESTUDIO DE LA ATALAYA (60 MIN)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-white/15 text-white/95">
                    {(currentWeek.weekend.atalayaConductorId ? 1 : 0) + (currentWeek.weekend.atalayaLectorId ? 1 : 0)}/2 asignados
                  </span>
                </div>

                {/* Sub-fila: Tema del artículo de La Atalaya */}
                <div className="border-b border-zinc-100 dark:border-[#27272A]/70 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors gap-2">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px] tracking-wide shrink-0">
                            Artículo Oficial
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                            {currentWeek.weekend.watchtowerTheme || 'Tema de La Atalaya por definir'}
                          </h4>
                          <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-normal">
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
                <div className="border-b border-zinc-100 dark:border-[#27272A]/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2.5 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                            Quién dirige La Atalaya (Conductor)
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                          Dirige el estudio con la congregación formulando preguntas y comentarios
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0 flex-wrap">
                      {currentWeek.weekend.atalayaConductorId &&
                        weekendDuplicateIds.has(currentWeek.weekend.atalayaConductorId) && (
                          <button
                            type="button"
                            onClick={() => setIsConflictsModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                            title="Este hermano tiene más de una asignación en esta reunión"
                          >
                            <AlertTriangle size={12} />
                            <span>Cruce</span>
                          </button>
                        )}
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
                            className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                            title="Cambiar conductor"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{publishersMap.get(currentWeek.weekend.atalayaConductorId)?.name || 'Hno. Asignado'}</span>
                          </button>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setReplacementState({
                                  isOpen: true,
                                  weekId: currentWeek.id,
                                  meetingType: 'weekend',
                                  meetingDate: currentWeek.weekend.date,
                                  assignmentTitle: 'Conductor de La Atalaya',
                                  assignmentPath: 'weekend.atalayaConductorId',
                                  currentPublisherId: currentWeek.weekend.atalayaConductorId,
                                  roleKey: 'fds_atalaya_conductor',
                                  targetGender: 'hermano',
                                })
                              }
                              className="p-1.5 rounded-full text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Sustitución rápida"
                            >
                              <ArrowRightLeft size={13} />
                            </button>
                          )}

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
                            className="p-1.5 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                              className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-dashed border-zinc-300 dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all cursor-pointer active:scale-95"
                        >
                          + Asignar Conductor
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FILA: Lector de La Atalaya */}
                <div className="border-b border-zinc-100 dark:border-[#27272A]/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2.5 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                            Lector de La Atalaya
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                          Lectura clara y audible de los párrafos del artículo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0 flex-wrap">
                      {currentWeek.weekend.atalayaLectorId &&
                        weekendDuplicateIds.has(currentWeek.weekend.atalayaLectorId) && (
                          <button
                            type="button"
                            onClick={() => setIsConflictsModalOpen(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                            title="Este hermano tiene más de una asignación en esta reunión"
                          >
                            <AlertTriangle size={12} />
                            <span>Cruce</span>
                          </button>
                        )}
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
                            className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                            title="Cambiar lector"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{publishersMap.get(currentWeek.weekend.atalayaLectorId)?.name || 'Hno. Asignado'}</span>
                          </button>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setReplacementState({
                                  isOpen: true,
                                  weekId: currentWeek.id,
                                  meetingType: 'weekend',
                                  meetingDate: currentWeek.weekend.date,
                                  assignmentTitle: 'Lector de La Atalaya',
                                  assignmentPath: 'weekend.atalayaLectorId',
                                  currentPublisherId: currentWeek.weekend.atalayaLectorId,
                                  roleKey: 'fds_atalaya_lector',
                                  targetGender: 'hermano',
                                })
                              }
                              className="p-1.5 rounded-full text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Sustitución rápida"
                            >
                              <ArrowRightLeft size={13} />
                            </button>
                          )}

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
                            className="p-1.5 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                              className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-dashed border-zinc-300 dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all cursor-pointer active:scale-95"
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
              <div id="fds-sec-conclusion" className="border-b border-zinc-100 dark:border-[#27272A]/70 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                          Cántico <span className="font-mono tabular-nums">{currentWeek.weekend.closingSong || 138}</span>
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                        Cántico de conclusión de la reunión
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-500 dark:text-[#A1A1AA] border border-transparent dark:border-[#27272A]">
                      Congregación
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setWeekendEditTab('canciones');
                          setIsWeekendEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/40 transition-colors gap-2.5 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5 min-w-0 sm:pr-4 flex-1">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                          Oración de conclusión
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5 tracking-tight">
                        Oración final y bendición para concluir la reunión del fin de semana
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pl-8 sm:pl-0 flex-wrap">
                    {currentWeek.weekend.finalPrayerId &&
                      weekendDuplicateIds.has(currentWeek.weekend.finalPrayerId) && (
                        <button
                          type="button"
                          onClick={() => setIsConflictsModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 cursor-pointer"
                          title="Este hermano tiene más de una asignación en esta reunión"
                        >
                          <AlertTriangle size={12} />
                          <span>Cruce</span>
                        </button>
                      )}
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
                          className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                          title="Cambiar hermano asignado"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{publishersMap.get(currentWeek.weekend.finalPrayerId)?.name || 'Hno. Asignado'}</span>
                        </button>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setReplacementState({
                                isOpen: true,
                                weekId: currentWeek.id,
                                meetingType: 'weekend',
                                meetingDate: currentWeek.weekend.date,
                                assignmentTitle: 'Oración Final (Fin de Semana)',
                                assignmentPath: 'weekend.finalPrayerId',
                                currentPublisherId: currentWeek.weekend.finalPrayerId,
                                roleKey: 'vym_oracion',
                                targetGender: 'hermano',
                              })
                            }
                            className="p-1.5 rounded-full text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Sustitución rápida"
                          >
                            <ArrowRightLeft size={13} />
                          </button>
                        )}

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
                          className="p-1.5 rounded-full text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                            className="p-1.5 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs active:scale-95"
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
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-dashed border-zinc-300 dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all cursor-pointer active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-[#27272A]">
              <button
                type="button"
                data-mobile-back-btn="true"
                aria-label="Atrás"
                onClick={() => setIsCopyModalOpen(false)}
                className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] cursor-pointer active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
                Copiar estructura de otra semana
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Esto copiará los títulos y partes del programa de la semana seleccionada hacia la semana actual, dejando las asignaciones listas para asignar.
            </p>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                Semana de origen:
              </label>
              <select
                value={sourceWeekId}
                onChange={e => setSourceWeekId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] text-xs bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (sourceWeekId) copyWeekStructure(sourceWeekId, currentWeek.id);
                  setIsCopyModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Copiar Estructura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SPECIAL EVENT */}
      {isSpecialEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-[#27272A]">
              <button
                type="button"
                data-mobile-back-btn="true"
                aria-label="Atrás"
                onClick={() => setIsSpecialEventModalOpen(false)}
                className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] cursor-pointer active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </button>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-amber-500" />
                <span>Configurar Evento o Fecha Especial</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Registra asambleas, conmemoración o visitas especiales. Si marcas "Sin reunión", esa reunión quedará bloqueada en el programa.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Tipo de Evento:
                </label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="visita_superintendente">Visita del Superintendente de Circuito</option>
                  <option value="asamblea_circuito">Asamblea de Circuito</option>
                  <option value="asamblea_regional">Asamblea Regional</option>
                  <option value="conmemoracion">Conmemoración</option>
                  <option value="otro">Otro evento especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Título del Evento:
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="Ej. Visita del Superintendente de Circuito"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-2">
                <span className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5]">Bloqueo de reuniones ordinarias:</span>
                <div className="flex flex-col gap-2 pt-1">
                  <SplashCheckbox
                    size="sm"
                    checked={noMidweek}
                    onChange={e => setNoMidweek(e.target.checked)}
                    label="NO hay reunión de entre semana"
                  />
                  <SplashCheckbox
                    size="sm"
                    checked={noWeekend}
                    onChange={e => setNoWeekend(e.target.checked)}
                    label="NO hay reunión de fin de semana"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Notas / Detalles:
                </label>
                <input
                  type="text"
                  value={eventNotes}
                  onChange={e => setEventNotes(e.target.value)}
                  placeholder="Ej. Reunión con precursores el sábado a las 10:00"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Quitar Evento Especial
                </button>
              )}
              <div className="flex justify-end gap-2 ml-auto">
                <button
                  onClick={() => setIsSpecialEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSpecialEvent}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
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
        initialMeetingType={viewMode === 'weekend' ? 'weekend' : 'midweek'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-zinc-200 dark:border-[#27272A]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-mobile-back-btn="true"
                  aria-label="Atrás"
                  onClick={() => setIsClearWeekAssignmentsModalOpen(false)}
                  className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] cursor-pointer active:scale-95 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </button>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <UserMinus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-[#F4F4F5]">
                  Quitar Asignados de la Semana
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearWeekAssignmentsModalOpen(false)}
                className="hidden sm:flex p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
              Selecciona qué sección de la semana (<span className="font-mono tabular-nums">{currentWeek.weekStartDate}</span>) deseas dejar sin asignar:
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
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    clearScope === opt.id
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-400'
                      : 'border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F]/40'
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
                    <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] block">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] block mt-0.5 leading-snug">
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] leading-relaxed bg-zinc-50 dark:bg-[#18181F] p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
              ℹ️ Los temas oficiales, canciones, lecturas y números de bosquejo se conservan intactos. Solo se liberan las personas asignadas.
            </p>

            <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearWeekAssignmentsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAssignments}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
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
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl w-full max-w-xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50/80 dark:bg-[#18181F]">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  data-mobile-back-btn="true"
                  aria-label="Atrás"
                  onClick={() => setIsWeekendEditModalOpen(false)}
                  className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-200/80 dark:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] cursor-pointer active:scale-95 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </button>
                <div className="hidden sm:flex p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
                    Editar Programa del Fin de Semana
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                    {formatTheocraticMeetingDate(currentWeek.weekend.date, settings.weekendMeetingDay)} {settings.weekendMeetingTime ? `(${settings.weekendMeetingTime})` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWeekendEditModalOpen(false)}
                className="hidden sm:flex p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-500 hover:text-zinc-800 dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pestañas de Navegación del Modal */}
            <div className="px-6 pt-3 pb-2 border-b border-zinc-200 dark:border-[#27272A] flex items-center gap-2 bg-zinc-100/50 dark:bg-[#121216]">
              <button
                type="button"
                onClick={() => setWeekendEditTab('discurso')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekendEditTab === 'discurso'
                    ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-2xs border border-zinc-200/80 dark:border-indigo-500/30'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]'
                }`}
              >
                Discurso Público
              </button>
              <button
                type="button"
                onClick={() => setWeekendEditTab('atalaya')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekendEditTab === 'atalaya'
                    ? 'bg-white dark:bg-[#18181F] text-emerald-600 dark:text-emerald-400 shadow-2xs border border-zinc-200/80 dark:border-emerald-500/30'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]'
                }`}
              >
                La Atalaya
              </button>
              <button
                type="button"
                onClick={() => setWeekendEditTab('canciones')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  weekendEditTab === 'canciones'
                    ? 'bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] shadow-2xs border border-zinc-200/80 dark:border-[#27272A]'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]'
                }`}
              >
                Cánticos (3)
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {weekendEditTab === 'discurso' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                        Fecha exacta de esta reunión:
                      </label>
                      <input
                        type="date"
                        value={currentWeek.weekend.date}
                        min={currentWeek.weekStartDate}
                        max={currentWeek.weekEndDate}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          const u = JSON.parse(JSON.stringify(currentWeek));
                          u.weekend.date = e.target.value;
                          updateWeek(u);
                        }}
                        className="w-full text-xs font-mono tabular-nums font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                        Día y hora de la congregación:
                      </label>
                      <div className="text-xs font-mono tabular-nums font-semibold py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A]">
                        {settings.weekendMeetingDay} {settings.weekendMeetingTime ? `(${settings.weekendMeetingTime})` : ''}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                      className="w-full text-xs font-mono tabular-nums font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                    <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                      className="w-full text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                        className="w-full text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                        className="w-full text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {weekendEditTab === 'atalaya' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                      className="w-full text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                      className="w-full text-xs font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {weekendEditTab === 'canciones' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                        className="w-full text-xs font-mono tabular-nums font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                        className="w-full text-xs font-mono tabular-nums font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                        className="w-full text-xs font-mono tabular-nums font-semibold text-zinc-800 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3.5 bg-zinc-50 dark:bg-[#18181F] border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-end">
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
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 px-4 py-3 bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] rounded-2xl shadow-xl border border-indigo-500/30 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Modal para Cargar y Rellenar Formatos Oficiales (S-89 / S-140) */}
      <LocalOfficialFormsModal
        isOpen={Boolean(officialFormModalCode)}
        onClose={() => setOfficialFormModalCode(null)}
        initialFormCode={officialFormModalCode || 'S-89'}
        initialWeekId={currentWeek?.id}
      />
    </div>
  );
};
