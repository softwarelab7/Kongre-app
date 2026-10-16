// src/components/CleaningDutiesTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { PreachingGroup, CustomDuty, FieldServiceMeeting, Gender, WeekSchedule } from '../types';
import { AssignmentSelectorModal } from './AssignmentSelectorModal';
import { SplashCheckbox } from './SplashCheckbox';
import { openWhatsAppLink } from '../utils/whatsapp';
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
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

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

  // Auto-rotate cleaning groups across all weeks
  const handleAutoRotateCleaning = () => {
    if (preachingGroups.length === 0) return;
    const sorted = [...weeks].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
    sorted.forEach((w, idx) => {
      const groupNum = preachingGroups[idx % preachingGroups.length].number;
      updateWeek({
        ...w,
        cleaningGroupNumbers: [groupNum],
      });
    });
  };

  // Sub-section navigation
  const [activeSection, setActiveSection] = useState<'turnos' | 'limpieza' | 'catalogo' | 'grupos' | 'salidas'>('turnos');

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

  // Toggle Duty Publisher in Selected Week
  const handleToggleDutyPublisher = (
    meetingType: 'midweek' | 'weekend',
    dutyKey: string,
    publisherId: string
  ) => {
    if (!selectedWeek) return;
    const updated = JSON.parse(JSON.stringify(selectedWeek)) as WeekSchedule;
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

    text += `📍 *DEBERES DE ENTRE SEMANA:*\n`;
    customDuties.filter((d) => d.midweek).forEach((duty) => {
      const ids = selectedWeek.midweek?.duties?.[duty.key] || [];
      const names = ids.map((id) => publishersMap.get(id)?.name).filter(Boolean).join(', ') || 'Sin asignar';
      text += `• ${duty.name}: ${names}\n`;
    });

    text += `\n📍 *DEBERES DE FIN DE SEMANA:*\n`;
    customDuties.filter((d) => d.weekend).forEach((duty) => {
      const ids = selectedWeek.weekend?.duties?.[duty.key] || [];
      const names = ids.map((id) => publishersMap.get(id)?.name).filter(Boolean).join(', ') || 'Sin asignar';
      text += `• ${duty.name}: ${names}\n`;
    });

    const cleaningGroup = selectedWeek.cleaningGroupNumbers?.[0];
    if (cleaningGroup) {
      text += `\n🧹 *Aseo y Limpieza:* Grupo #${cleaningGroup}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedDutiesSuccess(true);
    setTimeout(() => setCopiedDutiesSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* SectionHeader Kongre 1 Style */}
      <SectionHeader
        icon={ShieldCheck}
        title="Servicios de la"
        highlightWord="Congregación"
        subtitle="Deberes y turnos de entre semana y fin de semana (Audio y Video, Micrófonos, Acomodadores) y aseo"
        colorTheme="indigo"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyWeeklyDutiesSummary}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/80 border border-slate-200/60 dark:border-white/[0.06] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
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
        }
      />

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-white/10 w-fit overflow-x-auto max-w-full">
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
        </button>

        <button
          onClick={() => setActiveSection('limpieza')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'limpieza'
              ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brush className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Rotación de Limpieza ({weeks.length} sem.)</span>
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
          <span>Grupos de Predicación ({preachingGroups.length})</span>
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
          <span>Salidas al Campo ({fieldServiceMeetings.length})</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{preachingGroups.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Grupos de Predicación</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Brush className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{weeks.length} Semanas</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cronograma de Limpieza</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{customDuties.length} Activos</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Privilegios Especiales</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{fieldServiceMeetings.length} Puntos</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Salidas a la Predicación</div>
          </div>
        </div>
      </div>
      {/* ── SECCIÓN PRINCIPAL: DEBERES Y TURNOS SEMANALES (CATEGORÍA APARTE) ── */}
      {activeSection === 'turnos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Barra de navegación de semanas y acciones rápidas */}
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
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyWeeklyDutiesSummary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold transition-all cursor-pointer"
                title="Copiar asignaciones de turnos de esta semana para WhatsApp"
              >
                {copiedDutiesSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Turnos</span>
                  </>
                )}
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

                            {duty.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {duty.description}
                              </p>
                            )}

                            {/* Assigned brothers list */}
                            <div className="mt-3 space-y-1.5">
                              {assignedIds.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                                  Sin asignar
                                </p>
                              ) : (
                                assignedIds.map((pid) => {
                                  const pub = publishersMap.get(pid);
                                  return (
                                    <div
                                      key={pid}
                                      className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-xs"
                                    >
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

                            {duty.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {duty.description}
                              </p>
                            )}

                            {/* Assigned brothers list */}
                            <div className="mt-3 space-y-1.5">
                              {assignedIds.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                                  Sin asignar
                                </p>
                              ) : (
                                assignedIds.map((pid) => {
                                  const pub = publishersMap.get(pid);
                                  return (
                                    <div
                                      key={pid}
                                      className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-xs"
                                    >
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

              {/* BLOQUE 3: LIMPIEZA DEL SALÓN PARA ESTA SEMANA */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Brush className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Aseo y Limpieza del Salón (Esta Semana)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Grupo de predicación asignado para la limpieza antes y después de las reuniones
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection('limpieza')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Ver cronograma completo →
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold mr-2">
                    Grupo(s) a cargo:
                  </span>
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
            </>
          )}
        </div>
      )}

      {/* 1. SECCIÓN: LIMPIEZA DEL SALÓN DEL REINO */}
      {activeSection === 'limpieza' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brush className="w-5 h-5 text-indigo-600" />
              <span>Limpieza del Salón del Reino (Rotación)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Rotación secuencial de grupos de predicación semana a semana para el mantenimiento teocrático.
            </p>
          </div>
          <button
            onClick={handleAutoRotateCleaning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all"
          >
            <Brush className="w-4 h-4" />
            <span>Rotar Grupos Automáticamente</span>
          </button>
        </div>

        {/* Cleaning weeks timeline view */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weeks.map(w => {
            const assignedGroupNums = w.cleaningGroupNumbers;
            return (
              <div
                key={w.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {w.weekStartDate}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">al {w.weekEndDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">
                    {assignedGroupNums.length === 0
                      ? 'Sin grupo asignado'
                      : `Grupo(s): #${assignedGroupNums.join(', #')}`}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                  {preachingGroups.map(g => {
                    const isSelected = assignedGroupNums.includes(g.number);
                    return (
                      <button
                        key={g.number}
                        onClick={() => {
                          const list = [...assignedGroupNums];
                          const idx = list.indexOf(g.number);
                          if (idx >= 0) {
                            if (list.length > 1) list.splice(idx, 1);
                          } else {
                            list.push(g.number);
                          }
                          updateWeek({ ...w, cleaningGroupNumbers: list });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        G#{g.number}
                      </button>
                    );
                  })}
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
