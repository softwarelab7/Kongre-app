// src/components/CleaningDutiesTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import {
  PreachingGroup,
  CustomDuty,
  FieldServiceMeeting,
  Gender,
  WeekSchedule,
  CleaningProgramType,
  CleaningSuppliesStatus,
} from '../types';
import { AssignmentSelectorModal } from './AssignmentSelectorModal';
import { SplashCheckbox } from './SplashCheckbox';
import { openWhatsAppLink } from '../utils/whatsapp';
import {
  KHS_CLEANING_CHECKLIST_ITEMS,
  CLEANING_TYPE_LABELS,
  CLEANING_SUPPLIES_LABELS,
  evaluateDutyAssignmentStatus,
  getWeekDutyConflicts,
  autoAssignWeekDutiesOnly,
  computeDutyEquitabilityMatrix,
  buildGroupOverseerCleaningWhatsApp,
} from '../utils/khsDutiesCleaningEngine';
import {
  Brush,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  X,
  UserCheck,
  Shield,
  Layers,
  Compass,
  MessageCircle,
  Copy,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  Video,
  Mic,
  Check,
  AlertTriangle,
  Printer,
  BarChart3,
  HeartHandshake,
  Wand2,
  CheckSquare,
  PackageCheck,
} from 'lucide-react';

export const CleaningDutiesTab: React.FC = () => {
  const {
    preachingGroups,
    updatePreachingGroups,
    customDuties,
    addCustomDuty,
    updateCustomDuty,
    deleteCustomDuty,
    fieldServiceMeetings,
    addFieldServiceMeeting,
    updateFieldServiceMeeting,
    deleteFieldServiceMeeting,
    settings,
    publishers,
    weeks,
    currentWeek,
    currentWeekId,
    setCurrentWeekId,
    updateWeek,
    publishersMap,
    clearWeekAssignments,
    outgoingSpeakers,
  } = useCongregation();
  const { effectiveRoleInfo } = useAuth();
  const isReadOnly = effectiveRoleInfo.isReadOnly || !effectiveRoleInfo.canEditSchedule;

  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PreachingGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupNumber, setGroupNumber] = useState(1);
  const [groupOverseer, setGroupOverseer] = useState('');
  const [groupAssistant, setGroupAssistant] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  // Duty modal state
  const [isDutyModalOpen, setIsDutyModalOpen] = useState(false);
  const [editingDuty, setEditingDuty] = useState<CustomDuty | null>(null);
  const [dutyName, setDutyName] = useState('');
  const [dutyDesc, setDutyDesc] = useState('');
  const [dutyMidweek, setDutyMidweek] = useState(true);
  const [dutyWeekend, setDutyWeekend] = useState(true);
  const [dutyMaxPeople, setDutyMaxPeople] = useState(1);

  // Field Service state & handlers
  const [isFsModalOpen, setIsFsModalOpen] = useState(false);
  const [editingFs, setEditingFs] = useState<FieldServiceMeeting | null>(null);
  const [fsForm, setFsForm] = useState({
    dayOfWeek: 'Sábado',
    time: '09:30',
    location: 'Salón del Reino',
    conductorId: '',
    groupNumber: 1,
    territoryNumber: '',
    notes: '',
  });

  const [copiedFsSuccess, setCopiedFsSuccess] = useState(false);
  const [autoAssignToast, setAutoAssignToast] = useState<string | null>(null);
  const [showEquityPanel, setShowEquityPanel] = useState(false);

  const showToast = (msg: string) => {
    setAutoAssignToast(msg);
    setTimeout(() => setAutoAssignToast(null), 3500);
  };

  const handleOpenAddFs = () => {
    setEditingFs(null);
    setFsForm({
      dayOfWeek: 'Sábado',
      time: '09:30',
      location: 'Salón del Reino',
      conductorId: publishers.find(p => p.active && p.gender === 'hermano')?.id || '',
      groupNumber: 1,
      territoryNumber: '',
      notes: '',
    });
    setIsFsModalOpen(true);
  };

  const handleOpenEditFs = (item: FieldServiceMeeting) => {
    setEditingFs(item);
    setFsForm({
      dayOfWeek: item.dayOfWeek,
      time: item.time,
      location: item.location,
      conductorId: item.conductorId || '',
      groupNumber: item.groupNumber || 1,
      territoryNumber: item.territoryNumber || '',
      notes: item.notes || '',
    });
    setIsFsModalOpen(true);
  };

  const handleSaveFs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fsForm.dayOfWeek || !fsForm.time || !fsForm.location) return;

    if (editingFs) {
      updateFieldServiceMeeting({
        ...editingFs,
        dayOfWeek: fsForm.dayOfWeek,
        time: fsForm.time,
        location: fsForm.location,
        conductorId: fsForm.conductorId || undefined,
        groupNumber: fsForm.groupNumber || undefined,
        territoryNumber: fsForm.territoryNumber || undefined,
        notes: fsForm.notes || undefined,
      });
    } else {
      addFieldServiceMeeting({
        dayOfWeek: fsForm.dayOfWeek,
        time: fsForm.time,
        location: fsForm.location,
        conductorId: fsForm.conductorId || undefined,
        groupNumber: fsForm.groupNumber || undefined,
        territoryNumber: fsForm.territoryNumber || undefined,
        notes: fsForm.notes || undefined,
      });
    }
    setIsFsModalOpen(false);
  };

  const handleCopyFsSchedule = () => {
    let text = `📢 *SALIDAS PARA LA PREDICACIÓN - ${settings.congregationName.toUpperCase()}*\n`;
    text += `Programa semanal de reuniones para el servicio del campo:\n\n`;

    fieldServiceMeetings.forEach(f => {
      const conductor = f.conductorId ? publishersMap.get(f.conductorId)?.name : 'Por definir';
      text += `📅 *${f.dayOfWeek} a las ${f.time}*\n`;
      text += `  📍 Lugar: ${f.location}\n`;
      if (f.conductorId) text += `  👤 Conductor: ${conductor}\n`;
      if (f.groupNumber) text += `  👥 Grupo: #${f.groupNumber}\n`;
      if (f.notes) text += `  📝 ${f.notes}\n`;
      text += `\n`;
    });

    text += `¡Todos están cordialmente invitados a participar en el ministerio!`;
    navigator.clipboard.writeText(text);
    setCopiedFsSuccess(true);
    setTimeout(() => setCopiedFsSuccess(false), 3000);
  };

  // Group handlers
  const openNewGroupModal = () => {
    setEditingGroup(null);
    const nextNum = preachingGroups.length > 0 ? Math.max(...preachingGroups.map(g => g.number)) + 1 : 1;
    setGroupNumber(nextNum);
    setGroupName(`Grupo ${nextNum}`);
    setGroupOverseer('');
    setGroupAssistant('');
    setGroupMembers([]);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (g: PreachingGroup) => {
    setEditingGroup(g);
    setGroupNumber(g.number);
    setGroupName(g.name);
    setGroupOverseer(g.overseerId || '');
    setGroupAssistant(g.assistantId || '');
    setGroupMembers([...g.memberIds]);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    if (editingGroup) {
      const updated = preachingGroups.map(g =>
        g.number === editingGroup.number
          ? {
              ...g,
              name: groupName.trim(),
              overseerId: groupOverseer || undefined,
              assistantId: groupAssistant || undefined,
              memberIds: groupMembers,
            }
          : g
      );
      await updatePreachingGroups(updated);
    } else {
      const newGroup: PreachingGroup = {
        number: groupNumber,
        name: groupName.trim(),
        overseerId: groupOverseer || undefined,
        assistantId: groupAssistant || undefined,
        memberIds: groupMembers,
      };
      await updatePreachingGroups([...preachingGroups, newGroup]);
    }
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = async (num: number) => {
    if (confirm(`¿Eliminar el Grupo #${num}?`)) {
      await updatePreachingGroups(preachingGroups.filter(g => g.number !== num));
    }
  };

  const toggleGroupMember = (pubId: string) => {
    if (groupMembers.includes(pubId)) {
      setGroupMembers(groupMembers.filter(id => id !== pubId));
    } else {
      setGroupMembers([...groupMembers, pubId]);
    }
  };

  // Duty handlers
  const openNewDutyModal = () => {
    setEditingDuty(null);
    setDutyName('');
    setDutyDesc('');
    setDutyMidweek(true);
    setDutyWeekend(true);
    setDutyMaxPeople(1);
    setIsDutyModalOpen(true);
  };

  const openEditDutyModal = (d: CustomDuty) => {
    setEditingDuty(d);
    setDutyName(d.name);
    setDutyDesc(d.description || '');
    setDutyMidweek(d.midweek);
    setDutyWeekend(d.weekend);
    setDutyMaxPeople(d.maxPeople || 1);
    setIsDutyModalOpen(true);
  };

  const handleSaveDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyName.trim()) return;

    if (editingDuty) {
      updateCustomDuty({
        ...editingDuty,
        name: dutyName.trim(),
        description: dutyDesc.trim(),
        midweek: dutyMidweek,
        weekend: dutyWeekend,
        maxPeople: dutyMaxPeople,
      });
    } else {
      const key = `deber_custom_${Date.now()}`;
      addCustomDuty({
        key,
        name: dutyName.trim(),
        description: dutyDesc.trim(),
        midweek: dutyMidweek,
        weekend: dutyWeekend,
        maxPeople: dutyMaxPeople,
      });
    }
    setIsDutyModalOpen(false);
  };

  // Auto-rotate cleaning groups across all weeks (with automatic monthly deep cleaning on 1st week of each month)
  const handleAutoRotateCleaning = () => {
    if (preachingGroups.length === 0) return;
    const sorted = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
    let lastMonth = '';
    sorted.forEach((w, idx) => {
      const groupNum = preachingGroups[idx % preachingGroups.length].number;
      const monthKey = w.weekStartDate.slice(0, 7);
      const isFirstWeekOfMonth = monthKey !== lastMonth;
      lastMonth = monthKey;
      updateWeek({
        ...w,
        cleaningGroupNumbers: [groupNum],
        cleaningType: w.cleaningType || (isFirstWeekOfMonth && idx > 0 ? 'profunda' : 'semanal'),
        cleaningSuppliesStatus: w.cleaningSuppliesStatus || 'abastecido',
      });
    });
    showToast('Rotación de grupos de limpieza actualizada en todas las semanas.');
  };

  // Sub-section navigation
  const [activeSection, setActiveSection] = useState<
    'turnos' | 'matriz_khs' | 'limpieza' | 'catalogo' | 'grupos' | 'salidas'
  >('turnos');

  // Sorted weeks & selected week for Duty Assignment Board
  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  }, [weeks]);

  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => {
    return currentWeekId || sortedWeeks[0]?.id || '';
  });

  const selectedWeek = useMemo(() => {
    return (
      weeks.find((w) => w.id === selectedWeekId) ||
      weeks.find((w) => w.id === currentWeekId) ||
      sortedWeeks[0]
    );
  }, [weeks, selectedWeekId, currentWeekId, sortedWeeks]);

  const currentIndex = useMemo(() => {
    return sortedWeeks.findIndex((w) => w.id === selectedWeek?.id);
  }, [sortedWeeks, selectedWeek]);

  const goToPreviousWeek = () => {
    if (currentIndex > 0) {
      setSelectedWeekId(sortedWeeks[currentIndex - 1].id);
    }
  };

  const goToNextWeek = () => {
    if (currentIndex < sortedWeeks.length - 1) {
      setSelectedWeekId(sortedWeeks[currentIndex + 1].id);
    }
  };

  // Live conflicts in selected week duties
  const activeWeekDutyConflicts = useMemo(() => {
    if (!selectedWeek) return [];
    return getWeekDutyConflicts(
      selectedWeek,
      publishers,
      publishersMap,
      customDuties,
      outgoingSpeakers
    );
  }, [selectedWeek, publishers, publishersMap, customDuties, outgoingSpeakers]);

  // Equitability Matrix across all weeks
  const dutyEquityRows = useMemo(() => {
    return computeDutyEquitabilityMatrix(weeks, publishers, customDuties);
  }, [weeks, publishers, customDuties]);

  // 1-Click Smart Auto-Assign Duties for Selected Week
  const handleAutoAssignSelectedWeekDuties = (scope: 'both' | 'midweek' | 'weekend' = 'both') => {
    if (!selectedWeek || isReadOnly) return;
    const updated = autoAssignWeekDutiesOnly(
      selectedWeek,
      weeks,
      publishers,
      customDuties,
      outgoingSpeakers,
      scope,
      false
    );
    updateWeek(updated);
    const scopeLabel =
      scope === 'midweek'
        ? 'Entre Semana'
        : scope === 'weekend'
        ? 'Fin de Semana'
        : 'toda la semana';
    showToast(`Turnos de ${scopeLabel} auto-asignados con equidad y agrupación familiar.`);
  };

  // 1-Click Smart Auto-Rotate Duties across ALL weeks
  const handleAutoAssignAllWeeksDuties = () => {
    if (isReadOnly || sortedWeeks.length === 0) return;
    const simulatedWeeks: WeekSchedule[] = JSON.parse(JSON.stringify(sortedWeeks));
    for (let i = 0; i < simulatedWeeks.length; i++) {
      const updatedW = autoAssignWeekDutiesOnly(
        simulatedWeeks[i],
        simulatedWeeks,
        publishers,
        customDuties,
        outgoingSpeakers,
        'both',
        false
      );
      simulatedWeeks[i] = updatedW;
      updateWeek(updatedW);
    }
    showToast(`Rotación completada en ${simulatedWeeks.length} semanas sin choques de plataforma.`);
  };

  // Toggle S-28 Cleaning Checklist item for a week
  const handleToggleCleaningChecklist = (weekObj: WeekSchedule, areaId: string) => {
    if (isReadOnly) return;
    const current = new Set(weekObj.cleaningChecklistCompleted || []);
    if (current.has(areaId)) {
      current.delete(areaId);
    } else {
      current.add(areaId);
    }
    updateWeek({
      ...weekObj,
      cleaningChecklistCompleted: Array.from(current),
    });
  };

  // Send 1-click WhatsApp S-28 Cleaning Reminder to Group Overseer or Assistant
  const handleSendGroupCleaningWhatsApp = (
    weekObj: WeekSchedule,
    group: PreachingGroup,
    roleTarget: 'overseer' | 'assistant'
  ) => {
    const leaderId = roleTarget === 'overseer' ? group.overseerId : group.assistantId;
    const leader = leaderId ? publishersMap.get(leaderId) : undefined;
    const members = publishers.filter(
      (p) => p.active && (p.groupNumber === group.number || group.memberIds.includes(p.id))
    );
    const msg = buildGroupOverseerCleaningWhatsApp({
      week: weekObj,
      group,
      recipientName: leader?.name || `Encargado ${group.name}`,
      recipientRoleLabel:
        roleTarget === 'overseer' ? 'Superintendente de Grupo' : 'Auxiliar de Grupo',
      members,
      settings,
    });
    openWhatsAppLink(leader?.phone || '', msg);
  };

  // Assignment Selector Modal State
  const [selectorState, setSelectorState] = useState<{
    isOpen: boolean;
    title: string;
    roleKey: string;
    targetGender: Gender | 'any';
    meetingDate: string;
    meetingType: 'midweek' | 'weekend';
    currentAssignedId?: string;
    onSelect: (pid: string) => void;
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

  const openSelector = (
    title: string,
    roleKey: string,
    targetGender: Gender | 'any',
    meetingDate: string,
    meetingType: 'midweek' | 'weekend',
    currentAssignedId: string | undefined,
    onSelect: (pid: string) => void,
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

  // Toggle Duty Publisher in Selected Week (or any target week)
  const handleToggleDutyPublisher = (
    meetingType: 'midweek' | 'weekend',
    dutyKey: string,
    publisherId: string,
    targetWeek: WeekSchedule | undefined = selectedWeek
  ) => {
    if (!targetWeek) return;
    const updated = JSON.parse(JSON.stringify(targetWeek)) as WeekSchedule;
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

  // Replace a conflicted publisher in a duty slot
  const handleReplaceDutyPublisher = (
    meetingType: 'midweek' | 'weekend',
    dutyKey: string,
    oldPublisherId: string,
    newPublisherId: string
  ) => {
    if (!selectedWeek) return;
    const updated = JSON.parse(JSON.stringify(selectedWeek)) as WeekSchedule;
    const dutiesObj = meetingType === 'midweek' ? updated.midweek.duties : updated.weekend.duties;
    if (!dutiesObj[dutyKey]) dutiesObj[dutyKey] = [];
    const list = dutiesObj[dutyKey];
    const idx = list.indexOf(oldPublisherId);
    if (idx >= 0) {
      if (!list.includes(newPublisherId)) {
        list[idx] = newPublisherId;
      } else {
        list.splice(idx, 1);
      }
    } else if (!list.includes(newPublisherId)) {
      list.push(newPublisherId);
    }
    updateWeek(updated);
  };

  // Clear Duty for entire role
  const handleClearDuty = (
    meetingType: 'midweek' | 'weekend',
    dutyKey: string
  ) => {
    if (!selectedWeek) return;
    const updated = JSON.parse(JSON.stringify(selectedWeek)) as WeekSchedule;
    const dutiesObj = meetingType === 'midweek' ? updated.midweek.duties : updated.weekend.duties;
    if (dutiesObj) {
      dutiesObj[dutyKey] = [];
      updateWeek(updated);
    }
  };

  // Clear all duties for the week
  const handleClearAllWeekDuties = () => {
    if (!selectedWeek) return;
    if (confirm('¿Deseas quitar a todas las personas asignadas a turnos de esta semana?')) {
      clearWeekAssignments(selectedWeek.id, 'duties');
    }
  };

  // WhatsApp notification for individual duty
  const handleSendDutyWhatsApp = (
    publisherId: string,
    dutyName: string,
    meetingType: 'midweek' | 'weekend'
  ) => {
    const pub = publishersMap.get(publisherId);
    if (!pub || !selectedWeek) return;
    const date =
      meetingType === 'midweek'
        ? selectedWeek.midweek?.date || selectedWeek.weekStartDate
        : selectedWeek.weekend?.date || selectedWeek.weekEndDate;
    const typeLabel = meetingType === 'midweek' ? 'Reunión de Entre Semana' : 'Reunión del Fin de Semana';
    const msg = `Hola hno(a). *${pub.name}*,\nTe informamos que en los *Servicios de la Congregación* (${settings.congregationName || 'Salón del Reino'}) estás asignado(a) en:\n\n📋 *${dutyName}*\n📅 *${typeLabel}* (${date})\n\n¡Muchas gracias por tu valioso apoyo en el buen orden de las reuniones!`;
    openWhatsAppLink(pub.phone || '', msg);
  };

  // WhatsApp full week summary copy
  const [copiedDutiesSuccess, setCopiedDutiesSuccess] = useState(false);
  const handleCopyWeeklyDutiesSummary = () => {
    if (!selectedWeek) return;
    let text = `🛡️ *SERVICIOS DE LA CONGREGACIÓN - ${settings.congregationName?.toUpperCase() || 'SALÓN DEL REINO'}*\n`;
    text += `Programa de Deberes y Turnos: ${selectedWeek.weekStartDate} al ${selectedWeek.weekEndDate}\n\n`;

    text += `📍 *DEBERES DE ENTRE SEMANA (${selectedWeek.midweek?.date || selectedWeek.weekStartDate}):*\n`;
    customDuties.filter((d) => d.midweek).forEach((duty) => {
      const ids = selectedWeek.midweek?.duties?.[duty.key] || [];
      const names = ids.map((id) => publishersMap.get(id)?.name).filter(Boolean).join(', ') || 'Sin asignar';
      text += `• ${duty.name}: ${names}\n`;
    });

    text += `\n📍 *DEBERES DE FIN DE SEMANA (${selectedWeek.weekend?.date || selectedWeek.weekEndDate}):*\n`;
    customDuties.filter((d) => d.weekend).forEach((duty) => {
      const ids = selectedWeek.weekend?.duties?.[duty.key] || [];
      const names = ids.map((id) => publishersMap.get(id)?.name).filter(Boolean).join(', ') || 'Sin asignar';
      text += `• ${duty.name}: ${names}\n`;
    });

    const cleaningGroups = selectedWeek.cleaningGroupNumbers || [];
    if (cleaningGroups.length > 0) {
      const typeLabel = CLEANING_TYPE_LABELS[selectedWeek.cleaningType || 'semanal'];
      text += `\n🧹 *Aseo y Limpieza (${typeLabel}):* Grupo(s) #${cleaningGroups.join(', #')}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedDutiesSuccess(true);
    setTimeout(() => setCopiedDutiesSuccess(false), 3000);
  };

  // Printable KHS Duties & Cleaning Matrix Window
  const handlePrintKhsDutiesMatrix = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {autoAssignToast && (
        <div className="p-3.5 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{autoAssignToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutoAssignToast(null)}
            className="text-white/80 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra Unificada de Pestañas y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Subtab Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 w-fit overflow-x-auto max-w-full shadow-2xs">
          <button
            onClick={() => setActiveSection('turnos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'turnos'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Deberes y Turnos Semanales</span>
            {activeWeekDutyConflicts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                {activeWeekDutyConflicts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('matriz_khs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'matriz_khs'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Matriz Mensual (Tablero)</span>
          </button>

          <button
            onClick={() => setActiveSection('limpieza')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'limpieza'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Brush className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Programa de Aseo S-28 ({weeks.length} sem.)</span>
          </button>

          <button
            onClick={() => setActiveSection('catalogo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'catalogo'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Configurar Deberes ({customDuties.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('grupos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'grupos'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Grupos ({preachingGroups.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('salidas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'salidas'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Salidas ({fieldServiceMeetings.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => handleAutoAssignSelectedWeekDuties('both')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
              title="Auto-asignar turnos de esta semana evitando choques de plataforma y agrupando familias"
            >
              <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Auto-Asignar Deberes (1-Clic)</span>
            </button>
          )}

          <button
            onClick={handleCopyWeeklyDutiesSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            title="Copiar lista de turnos de la semana para WhatsApp"
          >
            {copiedDutiesSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Copiar Turnos WhatsApp</span>
              </>
            )}
          </button>

          <button
            onClick={handleAutoRotateCleaning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white/80 border border-slate-200/80 dark:border-white/[0.08] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            title="Rotar automáticamente los grupos de aseo semana a semana"
          >
            <Brush className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Rotar Limpieza</span>
          </button>

          <button
            onClick={openNewDutyModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md dark:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Privilegio</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{preachingGroups.length} Grupos</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aseo y Servicio del Campo</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {dutyEquityRows.length} Hermanos
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Habilitados en Deberes</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              activeWeekDutyConflicts.length > 0
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {activeWeekDutyConflicts.length > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {activeWeekDutyConflicts.length === 0
                ? '0 Choques'
                : `${activeWeekDutyConflicts.length} Alerta(s)`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Radar Plataforma vs Deberes
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Brush className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedWeek?.cleaningGroupNumbers?.length
                ? `Grupo #${selectedWeek.cleaningGroupNumbers.join(', #')}`
                : 'Sin asignar'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {CLEANING_TYPE_LABELS[selectedWeek?.cleaningType || 'semanal']}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN PRINCIPAL: DEBERES Y TURNOS SEMANALES ── */}
      {activeSection === 'turnos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra de navegación de semanas y acciones rápidas KHS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Flechas de navegación semanal */}
              <div className="flex items-center bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold px-2.5 text-slate-800 dark:text-white select-none whitespace-nowrap">
                  {selectedWeek ? `${selectedWeek.weekStartDate} al ${selectedWeek.weekEndDate}` : 'Seleccionar semana'}
                </span>
                <button
                  type="button"
                  onClick={goToNextWeek}
                  disabled={currentIndex >= sortedWeeks.length - 1}
                  className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Semana siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de salto rápido */}
              <select
                value={selectedWeek?.id || ''}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white cursor-pointer"
              >
                {sortedWeeks.map((w, idx) => (
                  <option key={w.id} value={w.id}>
                    Semana #{idx + 1}: {w.weekStartDate} al {w.weekEndDate}
                  </option>
                ))}
              </select>

              {settings.conflictRules?.prioritizeFamilySameMeeting !== false && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50 text-[11px] font-bold">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Agrupación Familiar Activa</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isReadOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAutoAssignSelectedWeekDuties('both')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Auto-asignar los deberes vacíos de esta semana sin chocar con partes de plataforma"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Asignar Semana</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoAssignAllWeeksDuties}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 text-xs font-bold transition-all cursor-pointer"
                    title="Auto-rotar deberes en todas las semanas programadas con equidad histórica"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rotar Todas ({weeks.length} sem.)</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowEquityPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showEquityPanel
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Equidad</span>
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleClearAllWeekDuties}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs font-bold transition-all cursor-pointer"
                  title="Quitar todos los asignados a turnos en esta semana"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Turnos</span>
                </button>
              )}
            </div>
          </div>

          {/* RADAR DE CHOQUES EN VIVO (PLATAFORMA / SALIENTES / AUSENCIAS VS DEBERES) */}
          {activeWeekDutyConflicts.length > 0 && selectedWeek && (
            <div className="bg-rose-50/90 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-800/60 p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-900 dark:text-rose-200">
                      Detector de Choques en Deberes ({activeWeekDutyConflicts.length} alerta{activeWeekDutyConflicts.length > 1 ? 's' : ''})
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Hermanos asignados a Audio/Video, Micrófonos o Acomodadores que tienen parte en plataforma, discurso saliente o ausencia en la misma reunión:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeWeekDutyConflicts.map((c, idx) => {
                  const mDate =
                    c.meetingType === 'midweek'
                      ? selectedWeek.midweek?.date || selectedWeek.weekStartDate
                      : selectedWeek.weekend?.date || selectedWeek.weekEndDate;
                  return (
                    <div
                      key={`${c.meetingType}-${c.dutyKey}-${c.publisherId}-${idx}`}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/90 dark:border-rose-800/60 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {c.publisherName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                            {c.dutyName} ({c.meetingType === 'midweek' ? 'Entre Semana' : 'Fin de Semana'})
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                          {c.platformClashes.length > 0 && (
                            <div>• Parte en plataforma: {c.platformClashes.join(', ')}</div>
                          )}
                          {c.otherDutyClashes.length > 0 && (
                            <div>• Otro deber simultáneo: {c.otherDutyClashes.join(', ')}</div>
                          )}
                          {c.outgoingSpeakerClash && <div>• {c.outgoingSpeakerClash}</div>}
                          {c.absenceClash && <div>• {c.absenceClash}</div>}
                        </div>
                      </div>

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            openSelector(
                              `Reemplazar a ${c.publisherName} en ${c.dutyName}`,
                              c.dutyKey,
                              'any',
                              mDate,
                              c.meetingType,
                              c.publisherId,
                              (newPid) =>
                                handleReplaceDutyPublisher(
                                  c.meetingType,
                                  c.dutyKey,
                                  c.publisherId,
                                  newPid
                                ),
                              () => handleToggleDutyPublisher(c.meetingType, c.dutyKey, c.publisherId)
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                        >
                          Reemplazar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PANEL DESPLEGABLE DE EQUIDAD Y ROTACIÓN DE DEBERES */}
          {showEquityPanel && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Distribución y Equidad de Turnos Mecánicos</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conteo acumulado de turnos asignados en las {weeks.length} semanas del programa actual
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEquityPanel(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cerrar ✕
                </button>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-3 font-bold">Hermano</th>
                      <th className="py-2 px-2 font-bold text-center">Total Turnos</th>
                      <th className="py-2 px-2 font-bold text-center">Entre Sem.</th>
                      <th className="py-2 px-2 font-bold text-center">Fin Sem.</th>
                      {customDuties.slice(0, 5).map((d) => (
                        <th key={d.key} className="py-2 px-2 font-bold text-center truncate max-w-[100px]">
                          {d.name}
                        </th>
                      ))}
                      <th className="py-2 pl-2 font-bold text-right">Último Turno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {dutyEquityRows.map((row) => (
                      <tr key={row.publisher.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white">
                          {row.publisher.name}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold">
                            {row.totalDuties}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300">
                          {row.midweekDuties}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300">
                          {row.weekendDuties}
                        </td>
                        {customDuties.slice(0, 5).map((d) => (
                          <td key={d.key} className="py-2 px-2 text-center text-slate-500 dark:text-slate-400">
                            {row.byDutyKey[d.key] || 0}
                          </td>
                        ))}
                        <td className="py-2 pl-2 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {row.lastDutyDate || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedWeek && (
            <>
              {/* BLOQUE 1: DEBERES Y TURNOS DE ENTRE SEMANA */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Deberes y Turnos de Entre Semana</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                          {selectedWeek.midweek?.date || selectedWeek.weekStartDate}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Audio y Video, Micrófonos de pasillo, Plataforma, Acomodadores y deberes locales
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleAutoAssignSelectedWeekDuties('midweek')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Completar Entre Semana</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {customDuties
                    .filter((d) => d.midweek)
                    .map((duty) => {
                      const assignedIds = selectedWeek.midweek?.duties?.[duty.key] || [];
                      return (
                        <div
                          key={duty.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col justify-between shadow-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                                {duty.name}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {assignedIds.length}/{duty.maxPeople || 1}
                                </span>
                                {assignedIds.length > 0 && !isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearDuty('midweek', duty.key)}
                                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                    title={`Quitar a todos los asignados a ${duty.name}`}
                                  >
                                    Limpiar
                                  </button>
                                )}
                              </div>
                            </div>

                            {duty.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {duty.description}
                              </p>
                            )}

                            {/* Assigned brothers list with KHS live conflict & family badges */}
                            <div className="mt-3 space-y-1.5">
                              {assignedIds.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                                  Sin asignar
                                </p>
                              ) : (
                                assignedIds.map((pid) => {
                                  const pub = publishersMap.get(pid);
                                  const liveStatus = evaluateDutyAssignmentStatus(
                                    selectedWeek,
                                    'midweek',
                                    duty.key,
                                    duty.name,
                                    pid,
                                    publishers,
                                    publishersMap,
                                    customDuties,
                                    outgoingSpeakers
                                  );
                                  return (
                                    <div
                                      key={pid}
                                      className={`p-2 rounded-xl border text-xs transition-all ${
                                        liveStatus.hasConflict
                                          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-1">
                                          {pub?.name || 'Hno.'}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {pub?.phone && (
                                            <button
                                              type="button"
                                              onClick={() => handleSendDutyWhatsApp(pid, duty.name, 'midweek')}
                                              className="text-emerald-600 hover:text-emerald-700 p-0.5 transition-colors cursor-pointer"
                                              title="Enviar recordatorio por WhatsApp"
                                            >
                                              <MessageCircle className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {!isReadOnly && (
                                            <button
                                              type="button"
                                              onClick={() => handleToggleDutyPublisher('midweek', duty.key, pid)}
                                              className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                                              title="Quitar"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Live Conflict Alert Pill */}
                                      {liveStatus.hasConflict && (
                                        <div className="mt-1 flex items-start gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                          <span>
                                            {[
                                              ...liveStatus.platformClashes,
                                              ...liveStatus.otherDutyClashes.map((d) => `Doble deber: ${d}`),
                                              liveStatus.absenceClash,
                                            ]
                                              .filter(Boolean)
                                              .join(' • ')}
                                          </span>
                                        </div>
                                      )}

                                      {/* Live KHS Family Grouping Pill */}
                                      {!liveStatus.hasConflict &&
                                        liveStatus.familyMembersInMeeting.length > 0 && (
                                          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                            <HeartHandshake className="w-3 h-3 shrink-0" />
                                            <span className="truncate">
                                              Familia hoy: {liveStatus.familyMembersInMeeting.join(', ')}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                openSelector(
                                  `Asignar a: ${duty.name} (Entre Semana)`,
                                  duty.key,
                                  'any',
                                  selectedWeek.midweek?.date || selectedWeek.weekStartDate,
                                  'midweek',
                                  undefined,
                                  (pid) => handleToggleDutyPublisher('midweek', duty.key, pid),
                                  () => {}
                                )
                              }
                              className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-left cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Asignar persona</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* BLOQUE 2: DEBERES Y TURNOS DE FIN DE SEMANA */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Deberes y Turnos de Fin de Semana</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          {selectedWeek.weekend?.date || selectedWeek.weekEndDate}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Audio y Video, Micrófonos de pasillo, Plataforma y Acomodadores del fin de semana
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleAutoAssignSelectedWeekDuties('weekend')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Completar Fin de Semana</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {customDuties
                    .filter((d) => d.weekend)
                    .map((duty) => {
                      const assignedIds = selectedWeek.weekend?.duties?.[duty.key] || [];
                      return (
                        <div
                          key={duty.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col justify-between shadow-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                                {duty.name}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {assignedIds.length}/{duty.maxPeople || 1}
                                </span>
                                {assignedIds.length > 0 && !isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearDuty('weekend', duty.key)}
                                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                                    title={`Quitar a todos los asignados a ${duty.name}`}
                                  >
                                    Limpiar
                                  </button>
                                )}
                              </div>
                            </div>

                            {duty.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {duty.description}
                              </p>
                            )}

                            {/* Assigned brothers list with KHS live conflict & family badges */}
                            <div className="mt-3 space-y-1.5">
                              {assignedIds.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                                  Sin asignar
                                </p>
                              ) : (
                                assignedIds.map((pid) => {
                                  const pub = publishersMap.get(pid);
                                  const liveStatus = evaluateDutyAssignmentStatus(
                                    selectedWeek,
                                    'weekend',
                                    duty.key,
                                    duty.name,
                                    pid,
                                    publishers,
                                    publishersMap,
                                    customDuties,
                                    outgoingSpeakers
                                  );
                                  return (
                                    <div
                                      key={pid}
                                      className={`p-2 rounded-xl border text-xs transition-all ${
                                        liveStatus.hasConflict
                                          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-1">
                                          {pub?.name || 'Hno.'}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {pub?.phone && (
                                            <button
                                              type="button"
                                              onClick={() => handleSendDutyWhatsApp(pid, duty.name, 'weekend')}
                                              className="text-emerald-600 hover:text-emerald-700 p-0.5 transition-colors cursor-pointer"
                                              title="Enviar recordatorio por WhatsApp"
                                            >
                                              <MessageCircle className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {!isReadOnly && (
                                            <button
                                              type="button"
                                              onClick={() => handleToggleDutyPublisher('weekend', duty.key, pid)}
                                              className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer"
                                              title="Quitar"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Live Conflict Alert Pill */}
                                      {liveStatus.hasConflict && (
                                        <div className="mt-1 flex items-start gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                          <span>
                                            {[
                                              ...liveStatus.platformClashes,
                                              ...liveStatus.otherDutyClashes.map((d) => `Doble deber: ${d}`),
                                              liveStatus.outgoingSpeakerClash,
                                              liveStatus.absenceClash,
                                            ]
                                              .filter(Boolean)
                                              .join(' • ')}
                                          </span>
                                        </div>
                                      )}

                                      {/* Live KHS Family Grouping Pill */}
                                      {!liveStatus.hasConflict &&
                                        liveStatus.familyMembersInMeeting.length > 0 && (
                                          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            <HeartHandshake className="w-3 h-3 shrink-0" />
                                            <span className="truncate">
                                              Familia hoy: {liveStatus.familyMembersInMeeting.join(', ')}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                openSelector(
                                  `Asignar a: ${duty.name} (Fin de Semana)`,
                                  duty.key,
                                  'any',
                                  selectedWeek.weekend?.date || selectedWeek.weekEndDate,
                                  'weekend',
                                  undefined,
                                  (pid) => handleToggleDutyPublisher('weekend', duty.key, pid),
                                  () => {}
                                )
                              }
                              className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 text-left cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Asignar persona</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* BLOQUE 3: ASEO DEL SALÓN DEL REINO S-28 + RECORDATORIO 1-CLIC AL SUPERINTENDENTE DE GRUPO */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Brush className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>Aseo y Mantenimiento del Salón del Reino (S-28)</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                          {CLEANING_TYPE_LABELS[selectedWeek.cleaningType || 'semanal']}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Grupo de predicación encargado, lista de verificación S-28 y aviso directo por WhatsApp al Superintendente de Grupo
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection('limpieza')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Ver cronograma anual S-28 →
                  </button>
                </div>

                {/* Selector de Grupo(s), Modalidad y Estado de Insumos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-bold block">
                      Grupo(s) de Predicación a cargo esta semana:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {preachingGroups.map((g) => {
                        const isSelected = selectedWeek.cleaningGroupNumbers.includes(g.number);
                        return (
                          <button
                            key={g.number}
                            type="button"
                            onClick={() => {
                              if (isReadOnly) return;
                              const list = [...selectedWeek.cleaningGroupNumbers];
                              const idx = list.indexOf(g.number);
                              if (idx >= 0) {
                                if (list.length > 1) list.splice(idx, 1);
                              } else {
                                list.push(g.number);
                              }
                              updateWeek({ ...selectedWeek, cleaningGroupNumbers: list });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}Grupo #{g.number}: {g.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Modalidad de Aseo
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={selectedWeek.cleaningType || 'semanal'}
                        onChange={(e) =>
                          updateWeek({
                            ...selectedWeek,
                            cleaningType: e.target.value as CleaningProgramType,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                      >
                        <option value="semanal">Semanal Regular</option>
                        <option value="profunda">Limpieza Profunda (S-28)</option>
                        <option value="visita_sc">Visita Sup. Circuito</option>
                        <option value="evento_especial">Pre-Asamblea / Conmem.</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Insumos de Aseo
                      </label>
                      <select
                        disabled={isReadOnly}
                        value={selectedWeek.cleaningSuppliesStatus || 'abastecido'}
                        onChange={(e) =>
                          updateWeek({
                            ...selectedWeek,
                            cleaningSuppliesStatus: e.target.value as CleaningSuppliesStatus,
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                      >
                        <option value="abastecido">✓ Insumos Completos</option>
                        <option value="reponer_pronto">⚠ Reponer Pronto</option>
                        <option value="urgente">🚨 Urgente Comprar</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tarjetas de Aviso 1-Clic al Superintendente y Auxiliar del Grupo Asignado */}
                {selectedWeek.cleaningGroupNumbers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {selectedWeek.cleaningGroupNumbers.map((gNum) => {
                      const grp = preachingGroups.find((g) => g.number === gNum);
                      if (!grp) return null;
                      const overseer = grp.overseerId ? publishersMap.get(grp.overseerId) : undefined;
                      const assistant = grp.assistantId ? publishersMap.get(grp.assistantId) : undefined;
                      const grpMembers = publishers.filter(
                        (p) => p.active && (p.groupNumber === grp.number || grp.memberIds.includes(p.id))
                      );

                      return (
                        <div
                          key={grp.number}
                          className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>Grupo #{grp.number}: {grp.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                {grpMembers.length} integrantes
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                              <span>Sup: <strong>{overseer?.name || 'Sin designar'}</strong></span>
                              {' • '}
                              <span>Aux: <strong>{assistant?.name || 'Sin designar'}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSendGroupCleaningWhatsApp(selectedWeek, grp, 'overseer')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Enviar recordatorio y lista S-28 por WhatsApp al Superintendente de Grupo"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Sup.</span>
                            </button>
                            {assistant && (
                              <button
                                type="button"
                                onClick={() => handleSendGroupCleaningWhatsApp(selectedWeek, grp, 'assistant')}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold transition-colors cursor-pointer"
                                title="Enviar recordatorio por WhatsApp al Auxiliar de Grupo"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Aux.</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Lista de Verificación Interactiva S-28 */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Lista de Verificación S-28 para esta semana:</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {(selectedWeek.cleaningChecklistCompleted || []).length} completadas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {KHS_CLEANING_CHECKLIST_ITEMS.filter(
                      (item) =>
                        (selectedWeek.cleaningType &&
                          selectedWeek.cleaningType !== 'semanal') ||
                        item.scope === 'semanal'
                    ).map((item) => {
                      const isDone = (selectedWeek.cleaningChecklistCompleted || []).includes(
                        item.id
                      );
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleCleaningChecklist(selectedWeek, item.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                            isDone
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70'
                              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-bold leading-tight ${
                                isDone
                                  ? 'line-through text-emerald-900 dark:text-emerald-200'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {item.detail}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SECCIÓN NUEVA: MATRIZ MENSUAL (TABLERO DE ANUNCIOS IMPRIMIBLE) ── */}
      {activeSection === 'matriz_khs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Matriz Mensual de Deberes y Aseo (Tablero del Salón)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vista consolidada multicolumna para el Tablero de Anuncios del Salón del Reino (Audio/Video, Micrófonos, Acomodadores y Limpieza)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAutoAssignAllWeeksDuties}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Auto-Completar Matriz ({sortedWeeks.length} sem.)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrintKhsDutiesMatrix}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Tablero A4</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-white/10">
                  <th className="py-3 px-3 font-extrabold">Semana</th>
                  <th className="py-3 px-2 font-extrabold">Reunión</th>
                  {customDuties.map((d) => (
                    <th key={d.key} className="py-3 px-2.5 font-extrabold">
                      {d.name}
                    </th>
                  ))}
                  <th className="py-3 px-3 font-extrabold text-amber-700 dark:text-amber-300">
                    Aseo S-28
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                {sortedWeeks.map((w) => {
                  const cleaningLabel =
                    w.cleaningGroupNumbers?.length > 0
                      ? `Grupo #${w.cleaningGroupNumbers.join(', #')}`
                      : 'Sin asignar';
                  const cType = CLEANING_TYPE_LABELS[w.cleaningType || 'semanal'];
                  return (
                    <React.Fragment key={w.id}>
                      {/* Fila Entre Semana */}
                      <tr className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20">
                        <td
                          rowSpan={2}
                          className="py-3 px-3 font-bold text-slate-900 dark:text-white align-top border-r border-slate-200/60 dark:border-white/10 whitespace-nowrap"
                        >
                          <div>{w.weekStartDate}</div>
                          <div className="text-[10px] font-medium text-slate-400">
                            al {w.weekEndDate}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWeekId(w.id);
                              setActiveSection('turnos');
                            }}
                            className="mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Editar semana →
                          </button>
                        </td>
                        <td className="py-2.5 px-2 font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                          Entre Semana
                          <div className="text-[10px] font-normal text-slate-400">
                            {w.midweek?.date || w.weekStartDate}
                          </div>
                        </td>
                        {customDuties.map((d) => {
                          if (!d.midweek) {
                            return (
                              <td key={d.key} className="py-2.5 px-2.5 text-slate-300 dark:text-slate-600">
                                —
                              </td>
                            );
                          }
                          const ids = w.midweek?.duties?.[d.key] || [];
                          return (
                            <td key={d.key} className="py-2.5 px-2.5">
                              {ids.length === 0 ? (
                                <span className="text-slate-400 italic">Sin asignar</span>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  {ids.map((id) => {
                                    const p = publishersMap.get(id);
                                    const st = evaluateDutyAssignmentStatus(
                                      w,
                                      'midweek',
                                      d.key,
                                      d.name,
                                      id,
                                      publishers,
                                      publishersMap,
                                      customDuties,
                                      outgoingSpeakers
                                    );
                                    return (
                                      <span
                                        key={id}
                                        className={`font-semibold ${
                                          st.hasConflict
                                            ? 'text-rose-600 dark:text-rose-400 underline decoration-wavy'
                                            : 'text-slate-800 dark:text-slate-200'
                                        }`}
                                        title={
                                          st.hasConflict
                                            ? `Choque: ${[...st.platformClashes, ...st.otherDutyClashes, st.absenceClash].filter(Boolean).join(', ')}`
                                            : undefined
                                        }
                                      >
                                        {p?.name || 'Hno.'}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td
                          rowSpan={2}
                          className="py-3 px-3 align-middle border-l border-slate-200/60 dark:border-white/10 bg-amber-50/30 dark:bg-amber-950/10"
                        >
                          <div className="font-extrabold text-amber-800 dark:text-amber-300">
                            {cleaningLabel}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {cType}
                          </div>
                        </td>
                      </tr>

                      {/* Fila Fin de Semana */}
                      <tr className="bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20">
                        <td className="py-2.5 px-2 font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                          Fin de Semana
                          <div className="text-[10px] font-normal text-slate-400">
                            {w.weekend?.date || w.weekEndDate}
                          </div>
                        </td>
                        {customDuties.map((d) => {
                          if (!d.weekend) {
                            return (
                              <td key={d.key} className="py-2.5 px-2.5 text-slate-300 dark:text-slate-600">
                                —
                              </td>
                            );
                          }
                          const ids = w.weekend?.duties?.[d.key] || [];
                          return (
                            <td key={d.key} className="py-2.5 px-2.5">
                              {ids.length === 0 ? (
                                <span className="text-slate-400 italic">Sin asignar</span>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  {ids.map((id) => {
                                    const p = publishersMap.get(id);
                                    const st = evaluateDutyAssignmentStatus(
                                      w,
                                      'weekend',
                                      d.key,
                                      d.name,
                                      id,
                                      publishers,
                                      publishersMap,
                                      customDuties,
                                      outgoingSpeakers
                                    );
                                    return (
                                      <span
                                        key={id}
                                        className={`font-semibold ${
                                          st.hasConflict
                                            ? 'text-rose-600 dark:text-rose-400 underline decoration-wavy'
                                            : 'text-slate-800 dark:text-slate-200'
                                        }`}
                                        title={
                                          st.hasConflict
                                            ? `Choque: ${[...st.platformClashes, ...st.otherDutyClashes, st.outgoingSpeakerClash, st.absenceClash].filter(Boolean).join(', ')}`
                                            : undefined
                                        }
                                      >
                                        {p?.name || 'Hno.'}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. SECCIÓN: LIMPIEZA DEL SALÓN DEL REINO S-28 */}
      {activeSection === 'limpieza' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brush className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Programa de Aseo del Salón del Reino (Estándar S-28)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rotación de grupos de predicación, control de limpieza profunda e insumos, y aviso en 1 clic al Superintendente de Grupo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoRotateCleaning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Brush className="w-4 h-4" />
              <span>Auto-Rotar Grupos y Limpieza Profunda</span>
            </button>
          </div>
        </div>

        {/* Cleaning weeks timeline view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWeeks.map((w) => {
            const assignedGroupNums = w.cleaningGroupNumbers || [];
            const cType: CleaningProgramType = w.cleaningType || 'semanal';
            const sStatus: CleaningSuppliesStatus = w.cleaningSuppliesStatus || 'abastecido';
            const completedCount = (w.cleaningChecklistCompleted || []).length;
            const firstGroup =
              assignedGroupNums.length > 0
                ? preachingGroups.find((g) => g.number === assignedGroupNums[0])
                : undefined;
            const overseer = firstGroup?.overseerId
              ? publishersMap.get(firstGroup.overseerId)
              : undefined;

            return (
              <div
                key={w.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      {w.weekStartDate} al {w.weekEndDate}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CLEANING_SUPPLIES_LABELS[sStatus].badgeClass}`}
                    >
                      {CLEANING_SUPPLIES_LABELS[sStatus].label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {assignedGroupNums.length === 0
                        ? 'Sin grupo asignado'
                        : `Grupo(s): #${assignedGroupNums.join(', #')}`}
                    </h4>
                    <select
                      disabled={isReadOnly}
                      value={cType}
                      onChange={(e) =>
                        updateWeek({
                          ...w,
                          cleaningType: e.target.value as CleaningProgramType,
                        })
                      }
                      className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-indigo-700 dark:text-indigo-300"
                    >
                      <option value="semanal">Aseo Semanal</option>
                      <option value="profunda">Limpieza Profunda</option>
                      <option value="visita_sc">Visita Sup. Circuito</option>
                      <option value="evento_especial">Pre-Asamblea</option>
                    </select>
                  </div>

                  {firstGroup && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sup. Grupo: <strong className="text-slate-700 dark:text-slate-200">{overseer?.name || 'Sin designar'}</strong>
                      {' • '}Checklist S-28: <strong>{completedCount} áreas</strong>
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {preachingGroups.map((g) => {
                      const isSelected = assignedGroupNums.includes(g.number);
                      return (
                        <button
                          key={g.number}
                          type="button"
                          onClick={() => {
                            if (isReadOnly) return;
                            const list = [...assignedGroupNums];
                            const idx = list.indexOf(g.number);
                            if (idx >= 0) {
                              if (list.length > 1) list.splice(idx, 1);
                            } else {
                              list.push(g.number);
                            }
                            updateWeek({ ...w, cleaningGroupNumbers: list });
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          G#{g.number}
                        </button>
                      );
                    })}
                  </div>

                  {firstGroup && (
                    <button
                      type="button"
                      onClick={() => handleSendGroupCleaningWhatsApp(w, firstGroup, 'overseer')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold transition-colors cursor-pointer"
                      title="Enviar recordatorio S-28 por WhatsApp al Superintendente de Grupo"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp Sup.</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 2. SECCIÓN: GRUPOS DE PREDICACIÓN */}
      {activeSection === 'grupos' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Grupos de Predicación y Servicio</span>
            </h3>
            <p className="text-xs text-slate-500">
              Superintendentes, auxiliares e integrantes de cada grupo.
            </p>
          </div>
          <button
            onClick={openNewGroupModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Grupo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {preachingGroups.map(group => {
            const overseer = group.overseerId ? publishersMap.get(group.overseerId) : null;
            const assistant = group.assistantId ? publishersMap.get(group.assistantId) : null;
            const members = publishers.filter(p => p.groupNumber === group.number);

            return (
              <div
                key={group.number}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        #{group.number}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{group.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGroupModal(group)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.number)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Leaders */}
                  <div className="mt-3 space-y-1 text-xs">
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Superintendente:</strong>{' '}
                      {overseer ? overseer.name : <span className="text-slate-400 italic">Sin designar</span>}
                    </p>
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Auxiliar:</strong>{' '}
                      {assistant ? assistant.name : <span className="text-slate-400 italic">Sin designar</span>}
                    </p>
                  </div>

                  {/* Members count & list */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Publicadores asignados ({members.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {members.map(m => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-medium"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 3. SECCIÓN: DEBERES Y PERSONALIZADOS */}
      {activeSection === 'catalogo' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span>Deberes Operativos y Personalizados</span>
            </h3>
            <p className="text-xs text-slate-500">
              Crea responsabilidades personalizadas como estacionamiento, acomodadores o deberes locales.
            </p>
          </div>
          <button
            onClick={openNewDutyModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Deber Personalizado</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customDuties.map(duty => (
            <div
              key={duty.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{duty.name}</h4>
                    {duty.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{duty.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDutyModal(duty)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!duty.key.startsWith('deber_audio') &&
                      !duty.key.startsWith('deber_video') &&
                      !duty.key.startsWith('deber_microfonos') &&
                      !duty.key.startsWith('deber_acomodador') && (
                        <button
                          onClick={() => deleteCustomDuty(duty.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1 text-[10px] font-semibold text-slate-600">
                  {duty.midweek && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Entre semana
                    </span>
                  )}
                  {duty.weekend && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Fin de semana
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Máx: {duty.maxPeople || 1} personas
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* SECTION 4: SALIDAS PARA LA PREDICACIÓN (SERVICIO DEL CAMPO) */}
      {activeSection === 'salidas' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>Salidas para la Predicación (Servicio del Campo)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Horarios, puntos de encuentro y conductores para las salidas entre semana y fines de semana.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleCopyFsSchedule}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-xs min-h-[42px]"
              title="Copiar programa completo listo para enviar por WhatsApp"
            >
              {copiedFsSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">¡Copiado!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenAddFs}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs min-h-[42px]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Nueva Salida</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fieldServiceMeetings.map((fs) => {
            const conductor = fs.conductorId ? publishersMap.get(fs.conductorId) : null;

            return (
              <div
                key={fs.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-white transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs">
                      {fs.dayOfWeek} • {fs.time}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditFs(fs)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
                        title="Editar salida"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFieldServiceMeeting(fs.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
                        title="Eliminar salida"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1">{fs.location}</h4>

                  {fs.notes && (
                    <p className="text-xs text-slate-500 mb-2 italic">"{fs.notes}"</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/70 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Conductor:</span>
                    <span className="font-bold text-slate-900">
                      {conductor ? conductor.name : 'Sin asignar'}
                    </span>
                  </div>
                  {fs.groupNumber && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Grupo a cargo:</span>
                      <span className="font-semibold text-blue-700">Grupo #{fs.groupNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* MODAL: GROUP EDIT / CREATE */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingGroup ? 'Editar Grupo de Predicación' : 'Nuevo Grupo de Predicación'}
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
                  <input
                    type="number"
                    value={groupNumber}
                    onChange={e => setGroupNumber(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Grupo</label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Ej. Grupo 1 - Los Olivos"
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Superintendente de Grupo (Anciano / Siervo):
                </label>
                <select
                  value={groupOverseer}
                  onChange={e => setGroupOverseer(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Sin designar --</option>
                  {publishers.filter(p => p.gender === 'hermano').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auxiliar de Grupo:
                </label>
                <select
                  value={groupAssistant}
                  onChange={e => setGroupAssistant(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Sin designar --</option>
                  {publishers.filter(p => p.gender === 'hermano').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Guardar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM DUTY EDIT / CREATE */}
      {isDutyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingDuty ? 'Editar Deber Operativo' : 'Nuevo Deber Operativo'}
              </h3>
              <button
                onClick={() => setIsDutyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDuty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Deber *</label>
                <input
                  type="text"
                  required
                  value={dutyName}
                  onChange={e => setDutyName(e.target.value)}
                  placeholder="Ej. Hospitalidad de oradores"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={dutyDesc}
                  onChange={e => setDutyDesc(e.target.value)}
                  placeholder="Ej. Recibir y atender al orador visitante"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Aplica en:</span>
                  <div className="flex flex-col gap-2 pt-1">
                    <SplashCheckbox
                      size="sm"
                      checked={dutyMidweek}
                      onChange={e => setDutyMidweek(e.target.checked)}
                      label="Entre semana"
                    />
                    <SplashCheckbox
                      size="sm"
                      checked={dutyWeekend}
                      onChange={e => setDutyWeekend(e.target.checked)}
                      label="Fin de semana"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Personas requeridas</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={dutyMaxPeople}
                    onChange={e => setDutyMaxPeople(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDutyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Guardar Deber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FIELD SERVICE MEETING EDIT / CREATE */}
      {isFsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="truncate">
                  {editingFs ? 'Editar Salida' : 'Nueva Salida a la Predicación'}
                </span>
              </h3>
              <button
                onClick={() => setIsFsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFs} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Día</label>
                  <select
                    value={fsForm.dayOfWeek}
                    onChange={(e) => setFsForm({ ...fsForm, dayOfWeek: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={fsForm.time}
                    onChange={(e) => setFsForm({ ...fsForm, time: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lugar / Punto de Encuentro
                </label>
                <input
                  type="text"
                  required
                  value={fsForm.location}
                  onChange={(e) => setFsForm({ ...fsForm, location: e.target.value })}
                  placeholder="Ej: Salón del Reino, Casa Hno. X, Parque Central"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conductor</label>
                  <select
                    value={fsForm.conductorId}
                    onChange={(e) => setFsForm({ ...fsForm, conductorId: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- Por definir --</option>
                    {publishers
                      .filter((p) => p.active && p.gender === 'hermano')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grupo a cargo
                  </label>
                  <select
                    value={fsForm.groupNumber}
                    onChange={(e) =>
                      setFsForm({ ...fsForm, groupNumber: parseInt(e.target.value, 10) })
                    }
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {preachingGroups.map((g) => (
                      <option key={g.number} value={g.number}>
                        Grupo #{g.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas / Modalidad
                </label>
                <input
                  type="text"
                  value={fsForm.notes}
                  onChange={(e) => setFsForm({ ...fsForm, notes: e.target.value })}
                  placeholder="Ej: Carritos, De casa en casa, Territorio comercial"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Guardar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGNMENT SELECTOR FOR OPERATIONAL DUTIES */}
      {selectorState.isOpen && (
        <AssignmentSelectorModal
          isOpen={selectorState.isOpen}
          onClose={() => setSelectorState((prev) => ({ ...prev, isOpen: false }))}
          title={selectorState.title}
          roleKey={selectorState.roleKey}
          targetGender={selectorState.targetGender}
          meetingDate={selectorState.meetingDate}
          meetingType={selectorState.meetingType}
          currentAssignedId={selectorState.currentAssignedId}
          onSelectPublisher={(pid) => {
            selectorState.onSelect(pid);
            setSelectorState((prev) => ({ ...prev, isOpen: false }));
          }}
          onClearAssignment={() => {
            selectorState.onClear();
            setSelectorState((prev) => ({ ...prev, isOpen: false }));
          }}
        />
      )}
    </div>
  );
};
