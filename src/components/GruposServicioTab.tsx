// src/components/GruposServicioTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  PreachingGroup,
  Publisher,
  FieldServiceMeeting,
  FieldServiceModality,
} from '../types';
import {
  Users,
  Phone,
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  Search,
  ArrowRightLeft,
  MapPin,
  X,
  Compass,
  Sparkles,
  Printer,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  FieldServiceSlotTemplate,
  DEFAULT_KHS_SLOTS,
  DAYS_OF_WEEK_ORDER,
  MODALITY_LABELS,
  MODALITY_SHORT_LABELS,
  getPresetSlots,
  getEligibleFieldServiceConductors,
  rankTerritoriesForFieldService,
  generateFieldServiceScheduleKHS,
  formatFieldServiceScheduleWhatsApp,
  printFieldServiceScheduleKHS,
  isPublisherAbsentOnDate,
} from '../utils/fieldServiceGenerator';
import { openWhatsAppLink } from '../utils/whatsapp';

export const GruposServicioTab: React.FC = () => {
  const { showToast } = useToast();
  const {
    preachingGroups,
    updatePreachingGroups,
    publishers,
    updatePublisher,
    publishersMap,
    settings,
    fieldServiceMeetings,
    addFieldServiceMeeting,
    updateFieldServiceMeeting,
    deleteFieldServiceMeeting,
    replaceFieldServiceMeetings,
    territories,
    assignTerritory,
    weeks,
  } = useCongregation();

  // Sub-vista principal: 'grupos' | 'salidas_khs'
  const [activeSubTab, setActiveSubTab] = useState<'grupos' | 'salidas_khs'>('grupos');

  // =========================================================
  // ESTADO DE GRUPOS DE SERVICIO
  // =========================================================
  const [selectedGroupNumber, setSelectedGroupNumber] = useState<number | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedGroupNumber, setCopiedGroupNumber] = useState<number | null>(null);
  const [confirmDeleteGroupNum, setConfirmDeleteGroupNum] = useState<number | null>(null);

  // Group edit / create modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PreachingGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    number: 1,
    name: '',
    overseerId: '',
    assistantId: '',
  });

  // Moving publisher modal
  const [movingPublisher, setMovingPublisher] = useState<Publisher | null>(null);
  const [targetGroupNumber, setTargetGroupNumber] = useState<number>(1);

  // =========================================================
  // ESTADO DEL GENERADOR Y CUADRANTE DE SALIDAS AL CAMPO (KHS)
  // =========================================================
  const currentMonthDefault = useMemo(() => {
    if (weeks.length > 0 && weeks[0].weekStartDate) {
      return weeks[0].weekStartDate.slice(0, 7);
    }
    return new Date().toISOString().slice(0, 7);
  }, [weeks]);

  const [fsmMonthFilter, setFsmMonthFilter] = useState<string>('todos');
  const [fsmDayFilter, setFsmDayFilter] = useState<string>('todos');
  const [fsmGroupFilter, setFsmGroupFilter] = useState<string>('todos'); // 'todos' | 'general' | '1' | '2'...
  const [copiedFsmSchedule, setCopiedFsmSchedule] = useState(false);
  const [confirmClearAllFsm, setConfirmClearAllFsm] = useState(false);

  // Modal: Auto-Generador KHS
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [genMode, setGenMode] = useState<'week' | 'month'>('month');
  const [genWeekStart, setGenWeekStart] = useState<string>(
    () => weeks[0]?.weekStartDate || new Date().toISOString().slice(0, 10)
  );
  const [genMonthKey, setGenMonthKey] = useState<string>(currentMonthDefault);
  const [genSlots, setGenSlots] = useState<FieldServiceSlotTemplate[]>(() =>
    DEFAULT_KHS_SLOTS.map((s) => ({ ...s }))
  );
  const [genAutoSuggestTerritories, setGenAutoSuggestTerritories] = useState(true);
  const [genPreferGroupLeaders, setGenPreferGroupLeaders] = useState(true);
  const [genPreferFamilyAffinity, setGenPreferFamilyAffinity] = useState(true);
  const [genReplaceMode, setGenReplaceMode] = useState<'replace_period' | 'append'>('replace_period');

  // Modal: Crear / Editar Salida Individual
  const [isFsmModalOpen, setIsFsmModalOpen] = useState(false);
  const [editingFsm, setEditingFsm] = useState<FieldServiceMeeting | null>(null);
  const [fsmForm, setFsmForm] = useState<{
    date: string;
    dayOfWeek: FieldServiceSlotTemplate['dayOfWeek'];
    session: 'manana' | 'tarde' | 'noche';
    time: string;
    location: string;
    conductorId: string;
    groupNumber: string; // '' = General, '1' = Grupo 1...
    territoryId: string;
    territoryNumber: string;
    modality: FieldServiceModality;
    notes: string;
  }>({
    date: new Date().toISOString().slice(0, 10),
    dayOfWeek: 'Sábado',
    session: 'manana',
    time: '09:00',
    location: settings.hallAddress ? `Salón del Reino (${settings.hallAddress})` : 'Salón del Reino',
    conductorId: '',
    groupNumber: '',
    territoryId: '',
    territoryNumber: '',
    modality: 'casa_en_casa',
    notes: '',
  });

  // Active elders & ministerial servants for overseer dropdown
  const qualifiedBrothers = useMemo(() => {
    return publishers.filter(
      (p) =>
        p.active &&
        (p.gender === 'hermano' || p.gender === 'male') &&
        (p.privilege === 'anciano' ||
          p.privilege === 'siervo_ministerial' ||
          p.roles?.vym_presidente ||
          p.roles?.fds_presidente)
    );
  }, [publishers]);

  // Conductores elegibles para Salidas al Servicio del Campo
  const eligibleConductors = useMemo(() => {
    return getEligibleFieldServiceConductors(publishers, preachingGroups);
  }, [publishers, preachingGroups]);

  // Conteo de salidas por conductor para mostrar equidad en vivo
  const conductorOutingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    fieldServiceMeetings.forEach((m) => {
      if (m.conductorId) {
        counts.set(m.conductorId, (counts.get(m.conductorId) || 0) + 1);
      }
    });
    return counts;
  }, [fieldServiceMeetings]);

  // Sugerencias de territorios ordenadas por S-13 según la modalidad del formulario
  const rankedTerritoriesForModal = useMemo(() => {
    return rankTerritoriesForFieldService(territories, fsmForm.modality);
  }, [territories, fsmForm.modality]);

  // Meses disponibles para filtrar salidas
  const availableFsmMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthDefault);
    weeks.forEach((w) => {
      if (w.weekStartDate) set.add(w.weekStartDate.slice(0, 7));
    });
    fieldServiceMeetings.forEach((m) => {
      if (m.date && m.date.length >= 7) set.add(m.date.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [currentMonthDefault, weeks, fieldServiceMeetings]);

  // Salidas filtradas y ordenadas
  const filteredFieldServiceMeetings = useMemo(() => {
    const dayIndexMap: Record<string, number> = {
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 7,
    };

    return fieldServiceMeetings
      .filter((m) => {
        if (fsmMonthFilter !== 'todos') {
          if (m.date && !m.date.startsWith(fsmMonthFilter)) return false;
        }
        if (fsmDayFilter !== 'todos' && m.dayOfWeek !== fsmDayFilter) return false;
        if (fsmGroupFilter === 'general' && m.groupNumber) return false;
        if (
          fsmGroupFilter !== 'todos' &&
          fsmGroupFilter !== 'general' &&
          String(m.groupNumber || '') !== fsmGroupFilter
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date && b.date && a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        const da = dayIndexMap[a.dayOfWeek] || 99;
        const db = dayIndexMap[b.dayOfWeek] || 99;
        if (da !== db) return da - db;
        return a.time.localeCompare(b.time);
      });
  }, [fieldServiceMeetings, fsmMonthFilter, fsmDayFilter, fsmGroupFilter]);

  // Estadísticas del cuadrante de salidas
  const fsmStats = useMemo(() => {
    const total = filteredFieldServiceMeetings.length;
    const withConductor = filteredFieldServiceMeetings.filter((m) => Boolean(m.conductorId)).length;
    const withTerritory = filteredFieldServiceMeetings.filter((m) =>
      Boolean(m.territoryNumber || m.territoryId)
    ).length;
    const availableTerritoriesCount = territories.filter((t) => t.status === 'disponible').length;
    return {
      total,
      withConductor,
      withTerritory,
      availableTerritoriesCount,
      conductorsPoolCount: eligibleConductors.length,
    };
  }, [filteredFieldServiceMeetings, territories, eligibleConductors]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (selectedGroupNumber === 'todos') return preachingGroups;
    return preachingGroups.filter((g) => g.number === selectedGroupNumber);
  }, [preachingGroups, selectedGroupNumber]);

  // Calculate statistics per group
  const groupStats = useMemo(() => {
    const stats: Record<
      number,
      {
        total: number;
        pioneers: number;
        elders: number;
        servants: number;
      }
    > = {};

    preachingGroups.forEach((g) => {
      const members = publishers.filter((p) => p.groupNumber === g.number && p.active);
      const pioneers = members.filter(
        (p) => p.privilege === 'precursor_regular' || p.privilege === 'precursor_especial'
      ).length;
      const elders = members.filter((p) => p.privilege === 'anciano').length;
      const servants = members.filter((p) => p.privilege === 'siervo_ministerial').length;

      stats[g.number] = {
        total: members.length,
        pioneers,
        elders,
        servants,
      };
    });

    return stats;
  }, [preachingGroups, publishers]);

  // =========================================================
  // HANDLERS DE GRUPOS DE SERVICIO
  // =========================================================
  const handleOpenEditGroup = (group: PreachingGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      number: group.number,
      name: group.name,
      overseerId: group.overseerId || '',
      assistantId: group.assistantId || '',
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenNewGroup = () => {
    const nextNumber =
      preachingGroups.length > 0 ? Math.max(...preachingGroups.map((g) => g.number)) + 1 : 1;
    setEditingGroup(null);
    setGroupFormData({
      number: nextNumber,
      name: `Grupo ${nextNumber}`,
      overseerId: '',
      assistantId: '',
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const groupName = groupFormData.name.trim();
    if (!groupName || isSaving) return;

    const groupNum = editingGroup ? editingGroup.number : Number(groupFormData.number) || 1;
    const existingMembers = publishers
      .filter((p) => p.groupNumber === groupNum)
      .map((p) => p.id);

    setIsSaving(true);
    try {
      if (editingGroup) {
        const updated = preachingGroups.map((g) =>
          g.number === editingGroup.number
            ? {
                ...g,
                name: groupName,
                overseerId: groupFormData.overseerId || undefined,
                assistantId: groupFormData.assistantId || undefined,
                memberIds: existingMembers,
              }
            : g
        );
        await updatePreachingGroups(updated);
        showToast('¡Grupo actualizado y sincronizado en la nube!', 'success');
      } else {
        const newGroup: PreachingGroup = {
          number: groupNum,
          name: groupName,
          overseerId: groupFormData.overseerId || undefined,
          assistantId: groupFormData.assistantId || undefined,
          memberIds: existingMembers,
        };
        await updatePreachingGroups([...preachingGroups, newGroup]);
        showToast(`¡${groupName} creado y sincronizado en la nube!`, 'success');
      }
      setIsGroupModalOpen(false);
    } catch {
      showToast('Error al guardar el grupo en la nube. Se guardó localmente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteGroup = async (groupNumber: number) => {
    if (isSaving) return;
    const count = publishers.filter((p) => p.groupNumber === groupNumber).length;
    if (count > 0) {
      showToast(
        `No se puede eliminar el Grupo ${groupNumber} porque tiene ${count} publicadores asignados. Primero reasígnelos a otro grupo.`,
        'error'
      );
      setConfirmDeleteGroupNum(null);
      return;
    }
    setIsSaving(true);
    try {
      await updatePreachingGroups(preachingGroups.filter((g) => g.number !== groupNumber));
      showToast(`Grupo ${groupNumber} eliminado de la nube`, 'success');
    } finally {
      setIsSaving(false);
      setConfirmDeleteGroupNum(null);
    }
  };

  const handleMovePublisher = () => {
    if (!movingPublisher) return;
    updatePublisher({
      ...movingPublisher,
      groupNumber: targetGroupNumber,
    });
    showToast(`Se reasignó a ${movingPublisher.name} al Grupo ${targetGroupNumber}`, 'success');
    setMovingPublisher(null);
  };

  const handleShareGroupWhatsApp = (group: PreachingGroup) => {
    const overseer = group.overseerId ? publishersMap.get(group.overseerId) : null;
    const assistant = group.assistantId ? publishersMap.get(group.assistantId) : null;
    const members = publishers.filter((p) => p.groupNumber === group.number && p.active);

    let text = `*${group.name.toUpperCase()}*\n`;
    text += `Congregación: ${settings.congregationName}\n\n`;
    text += `👤 *Superintendente:* ${overseer ? overseer.name : 'Por asignar'}\n`;
    if (assistant) text += `🤝 *Auxiliar:* ${assistant.name}\n`;
    text += `📋 *Total de publicadores:* ${members.length}\n\n`;
    text += `*Lista de integrantes:*\n`;

    members.forEach((m, idx) => {
      const priv =
        m.privilege === 'anciano'
          ? ' (Anciano)'
          : m.privilege === 'siervo_ministerial'
          ? ' (Siervo ministerial)'
          : m.privilege === 'precursor_regular'
          ? ' (Precursor/a)'
          : '';
      const phone = m.phone ? ` - 📞 ${m.phone}` : '';
      text += `${idx + 1}. ${m.name}${priv}${phone}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedGroupNumber(group.number);
    setTimeout(() => setCopiedGroupNumber(null), 2500);
  };

  // =========================================================
  // HANDLERS DEL PROGRAMA DE SALIDAS AL CAMPO (KHS)
  // =========================================================
  const handleRunAutoGeneratorKHS = () => {
    const generated = generateFieldServiceScheduleKHS({
      mode: genMode,
      weekStartDateISO: genWeekStart,
      monthKey: genMonthKey,
      slots: genSlots,
      publishers,
      preachingGroups,
      territories,
      settings,
      existingMeetings: fieldServiceMeetings,
      autoSuggestTerritories: genAutoSuggestTerritories,
      preferGroupLeadersOnGroupDays: genPreferGroupLeaders,
      preferFamilyAffinity: genPreferFamilyAffinity,
    });

    if (generated.length === 0) {
      showToast('Activa al menos un horario en la plantilla para generar salidas.', 'error');
      return;
    }

    if (genReplaceMode === 'replace_period') {
      if (genMode === 'month') {
        const remaining = fieldServiceMeetings.filter(
          (m) => !m.date || !m.date.startsWith(genMonthKey)
        );
        replaceFieldServiceMeetings([...remaining, ...generated]);
        setFsmMonthFilter(genMonthKey);
      } else {
        const generatedDates = new Set(generated.map((g) => g.date));
        const remaining = fieldServiceMeetings.filter(
          (m) => !m.date || !generatedDates.has(m.date)
        );
        replaceFieldServiceMeetings([...remaining, ...generated]);
      }
    } else {
      replaceFieldServiceMeetings([...fieldServiceMeetings, ...generated]);
    }

    setIsGeneratorModalOpen(false);
    showToast(
      `¡Se generaron ${generated.length} salidas al servicio del campo con conductores y territorios sugeridos!`,
      'success'
    );
  };

  const handleOpenNewFsmModal = () => {
    setEditingFsm(null);
    const bestTerr = rankTerritoriesForFieldService(territories, 'casa_en_casa')[0]?.territory;
    const defaultConductor = eligibleConductors[0]?.id || '';
    setFsmForm({
      date: new Date().toISOString().slice(0, 10),
      dayOfWeek: 'Sábado',
      session: 'manana',
      time: '09:00',
      location: settings.hallAddress
        ? `Salón del Reino (${settings.hallAddress})`
        : 'Salón del Reino',
      conductorId: defaultConductor,
      groupNumber: '',
      territoryId: bestTerr?.id || '',
      territoryNumber: bestTerr ? `${bestTerr.number} - ${bestTerr.name}` : '',
      modality: 'casa_en_casa',
      notes: '',
    });
    setIsFsmModalOpen(true);
  };

  const handleOpenEditFsmModal = (fsm: FieldServiceMeeting) => {
    setEditingFsm(fsm);
    setFsmForm({
      date: fsm.date || '',
      dayOfWeek: (fsm.dayOfWeek as FieldServiceSlotTemplate['dayOfWeek']) || 'Sábado',
      session: fsm.session || 'manana',
      time: fsm.time || '09:00',
      location: fsm.location || 'Salón del Reino',
      conductorId: fsm.conductorId || '',
      groupNumber: fsm.groupNumber ? String(fsm.groupNumber) : '',
      territoryId: fsm.territoryId || '',
      territoryNumber: fsm.territoryNumber || '',
      modality: fsm.modality || 'casa_en_casa',
      notes: fsm.notes || '',
    });
    setIsFsmModalOpen(true);
  };

  const handleSaveFsmModal = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<FieldServiceMeeting, 'id'> = {
      date: fsmForm.date || undefined,
      dayOfWeek: fsmForm.dayOfWeek,
      session: fsmForm.session,
      time: fsmForm.time,
      location: fsmForm.location.trim() || 'Salón del Reino',
      conductorId: fsmForm.conductorId || undefined,
      groupNumber: fsmForm.groupNumber ? Number(fsmForm.groupNumber) : undefined,
      territoryId: fsmForm.territoryId || undefined,
      territoryNumber: fsmForm.territoryNumber.trim() || undefined,
      modality: fsmForm.modality,
      notes: fsmForm.notes.trim() || undefined,
    };

    if (editingFsm) {
      updateFieldServiceMeeting({
        ...editingFsm,
        ...payload,
      });
      showToast('Salida al servicio del campo actualizada.', 'success');
    } else {
      addFieldServiceMeeting(payload);
      showToast('Nueva salida al servicio del campo agregada.', 'success');
    }
    setIsFsmModalOpen(false);
  };

  const handleAssignSuggestedTerritoryS13 = (fsm: FieldServiceMeeting) => {
    if (!fsm.conductorId) {
      showToast('Primero asigna un conductor a esta salida para registrar el territorio S-13.', 'error');
      return;
    }
    const terr = fsm.territoryId
      ? territories.find((t) => t.id === fsm.territoryId)
      : fsm.territoryNumber
      ? territories.find((t) => fsm.territoryNumber?.startsWith(t.number))
      : undefined;

    if (!terr) {
      showToast('No se encontró el territorio vinculado en S-13.', 'error');
      return;
    }

    const assignedDate = fsm.date || new Date().toISOString().slice(0, 10);
    const due = new Date(assignedDate);
    due.setMonth(due.getMonth() + 4);
    const dueDate = due.toISOString().slice(0, 10);

    assignTerritory(
      terr.id,
      fsm.conductorId,
      assignedDate,
      dueDate,
      `Asignado desde Salida al Servicio del Campo (${fsm.dayOfWeek} ${fsm.time})`
    );
    showToast(
      `Territorio #${terr.number} asignado oficialmente en S-13 a ${publishersMap.get(fsm.conductorId)?.name || 'conductor'}.`,
      'success'
    );
  };

  const handleNotifyConductorWhatsApp = (fsm: FieldServiceMeeting) => {
    const conductor = fsm.conductorId ? publishersMap.get(fsm.conductorId) : undefined;
    if (!conductor) return;

    const grp = fsm.groupNumber
      ? preachingGroups.find((g) => g.number === fsm.groupNumber)
      : undefined;
    const groupLabel = grp
      ? grp.name
      : fsm.groupNumber
      ? `Grupo ${fsm.groupNumber}`
      : 'Congregación General';

    const terr = fsm.territoryId
      ? territories.find((t) => t.id === fsm.territoryId)
      : undefined;

    let msg = `Hola hermano *${conductor.name}* 👋\n\n`;
    msg += `Te recordamos tu asignación como *Conductor de Reunión para el Servicio del Campo*:\n\n`;
    msg += `📅 *Día:* ${fsm.dayOfWeek}${fsm.date ? ` (${fsm.date})` : ''}\n`;
    msg += `⏰ *Hora:* ${fsm.time}\n`;
    msg += `👥 *Alcance:* ${groupLabel}\n`;
    msg += `📍 *Punto de encuentro:* ${fsm.location}\n`;
    if (fsm.territoryNumber) {
      msg += `🗺 *Territorio sugerido (S-13):* #${fsm.territoryNumber}\n`;
      if (terr?.boundsDescription) {
        msg += `📐 *Límites:* ${terr.boundsDescription}\n`;
      }
      if (terr?.noVisits && terr.noVisits.length > 0) {
        msg += `⚠️ *Casas No Visitar (${terr.noVisits.length}):* ${terr.noVisits
          .map((nv) => nv.address)
          .join('; ')}\n`;
      }
    }
    if (fsm.modality) {
      msg += `💼 *Modalidad:* ${MODALITY_LABELS[fsm.modality]}\n`;
    }
    msg += `\n¡Muchas gracias por tu valioso apoyo en el ministerio!`;

    openWhatsAppLink(conductor.phone || '', msg);
  };

  const currentPeriodLabel = useMemo(() => {
    if (fsmMonthFilter === 'todos') return 'Programa General de Salidas';
    return `Mes ${fsmMonthFilter}`;
  }, [fsmMonthFilter]);

  const handleCopyFullFsmSchedule = () => {
    const text = formatFieldServiceScheduleWhatsApp(
      filteredFieldServiceMeetings,
      publishersMap,
      territories,
      preachingGroups,
      settings.congregationName,
      currentPeriodLabel
    );
    navigator.clipboard.writeText(text);
    setCopiedFsmSchedule(true);
    setTimeout(() => setCopiedFsmSchedule(false), 2500);
    showToast('Programa de salidas copiado al portapapeles para WhatsApp.', 'success');
  };

  const handleSendFullFsmWhatsApp = () => {
    const text = formatFieldServiceScheduleWhatsApp(
      filteredFieldServiceMeetings,
      publishersMap,
      territories,
      preachingGroups,
      settings.congregationName,
      currentPeriodLabel
    );
    openWhatsAppLink('', text);
  };

  const handlePrintFsmSchedule = () => {
    printFieldServiceScheduleKHS(
      filteredFieldServiceMeetings,
      publishersMap,
      territories,
      preachingGroups,
      settings,
      currentPeriodLabel
    );
  };

  return (
    <div className="space-y-6">
      {/* Conmutador Superior: Grupos de Servicio vs Programa de Salidas al Campo */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('grupos')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'grupos'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Grupos ({preachingGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('salidas_khs')}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'salidas_khs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="truncate">Salidas ({fieldServiceMeetings.length})</span>
          </button>
        </div>

        {activeSubTab === 'grupos' ? (
          <button
            type="button"
            onClick={handleOpenNewGroup}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Grupo</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsGeneratorModalOpen(true)}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto-Generar Salidas</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewFsmModal}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Salida</span>
            </button>

            <button
              type="button"
              onClick={handlePrintFsmSchedule}
              disabled={filteredFieldServiceMeetings.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="Imprimir Programa de Salidas para el Tablero del Salón"
            >
              <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleSendFullFsmWhatsApp}
              disabled={filteredFieldServiceMeetings.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer"
              title="Enviar cuadrante de salidas por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SUB-VISTA 1: GRUPOS DE SERVICIO                           */}
      {/* ========================================================= */}
      {activeSubTab === 'grupos' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedGroupNumber('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGroupNumber === 'todos'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({preachingGroups.length})
              </button>
              {preachingGroups.map((g) => (
                <button
                  key={g.number}
                  type="button"
                  onClick={() => setSelectedGroupNumber(g.number)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedGroupNumber === g.number
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g.name} ({groupStats[g.number]?.total || 0})
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {searchQuery
                    ? 'No se encontraron resultados'
                    : 'No hay grupos de servicio registrados'}
                </h3>
                <p className="text-xs text-slate-500">
                  {searchQuery
                    ? 'Intente buscar con otro nombre o borre el filtro de búsqueda.'
                    : 'Cree los grupos de predicación de su congregación para organizar a los publicadores, asignar superintendentes y coordinar las salidas a predicar.'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={handleOpenNewGroup}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer Grupo</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const overseer = group.overseerId ? publishersMap.get(group.overseerId) : null;
                const assistant = group.assistantId ? publishersMap.get(group.assistantId) : null;
                let members = publishers.filter((p) => p.groupNumber === group.number);

                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  members = members.filter(
                    (m) =>
                      m.name.toLowerCase().includes(q) ||
                      (m.phone && m.phone.toLowerCase().includes(q))
                  );
                }

                const stats = groupStats[group.number] || {
                  total: 0,
                  pioneers: 0,
                  elders: 0,
                  servants: 0,
                };

                return (
                  <div
                    key={group.number}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    {/* Group Card Header */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                              {group.number}
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                              {group.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleShareGroupWhatsApp(group)}
                            className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Copiar lista de miembros del grupo para WhatsApp"
                          >
                            {copiedGroupNumber === group.number ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditGroup(group)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar nombre y encargados del grupo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {confirmDeleteGroupNum === group.number ? (
                            <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-xl border border-rose-200">
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteGroup(group.number)}
                                className="text-[10px] font-bold text-rose-700 hover:underline px-1"
                              >
                                Eliminar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteGroupNum(null)}
                                className="text-[10px] text-slate-500 px-1"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGroupNum(group.number)}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar grupo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Overseer & Assistant Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                              Superintendente
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {overseer ? overseer.name : 'Sin asignar'}
                            </span>
                          </div>
                          {overseer?.phone && (
                            <a
                              href={`https://wa.me/${overseer.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Escribir al superintendente de grupo"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                              Auxiliar de Grupo
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {assistant ? assistant.name : 'Sin asignar'}
                            </span>
                          </div>
                          {assistant?.phone && (
                            <a
                              href={`https://wa.me/${assistant.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Escribir al auxiliar de grupo"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Quick stats pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                          Total: <strong className="text-slate-800">{stats.total}</strong>
                        </span>
                        {stats.pioneers > 0 && (
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                            ⭐ {stats.pioneers} precursores
                          </span>
                        )}
                        {stats.elders > 0 && (
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md">
                            {stats.elders} ancianos
                          </span>
                        )}
                        {stats.servants > 0 && (
                          <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md">
                            {stats.servants} siervos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="p-4 sm:p-5 flex-1 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                      {members.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-6 text-center">
                          No hay publicadores asignados a este grupo actualmente.
                        </p>
                      ) : (
                        members.map((member) => {
                          const isOverseer = member.id === group.overseerId;
                          const isAssistant = member.id === group.assistantId;

                          return (
                            <div
                              key={member.id}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    member.active ? 'bg-emerald-500' : 'bg-slate-300'
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 truncate">
                                      {member.name}
                                    </span>
                                    {isOverseer && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                        Superintendente
                                      </span>
                                    )}
                                    {isAssistant && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                        Auxiliar
                                      </span>
                                    )}
                                    {member.privilege === 'precursor_regular' && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                        Precursor/a
                                      </span>
                                    )}
                                  </div>
                                  {member.phone && (
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      {member.phone}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions for this member */}
                              <div className="flex items-center gap-1 shrink-0">
                                {member.phone && (
                                  <>
                                    <a
                                      href={`tel:${member.phone.replace(/[^0-9+]/g, '')}`}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                      title="Llamar"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </a>
                                    <a
                                      href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMovingPublisher(member);
                                    setTargetGroupNumber(member.groupNumber || 1);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Mover a otro grupo de servicio"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* SUB-VISTA 2: GENERADOR Y CUADRANTE DE SALIDAS AL CAMPO    */}
      {/* ========================================================= */}
      {activeSubTab === 'salidas_khs' && (
        <div className="space-y-5">
          {/* KPIs del Programa de Servicio del Campo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                Salidas Programadas
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">{fsmStats.total}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Puntos de encuentro en esta vista
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Conductores Asignados
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {fsmStats.withConductor}{' '}
                <span className="text-xs font-bold text-slate-400">/ {fsmStats.total}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {fsmStats.conductorsPoolCount} conductores habilitados
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                Territorios S-13 Vinculados
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {fsmStats.withTerritory}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {fsmStats.availableTerritoriesCount} territorios disponibles en S-13
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                Acción Rápida
              </span>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleCopyFullFsmSchedule}
                  disabled={filteredFieldServiceMeetings.length === 0}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedFsmSchedule ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copiar Resumen</span>
                    </>
                  )}
                </button>
                {fieldServiceMeetings.length > 0 && (
                  confirmClearAllFsm ? (
                    <div className="flex items-center gap-1 bg-rose-50 px-2 py-1.5 rounded-xl border border-rose-200">
                      <button
                        type="button"
                        onClick={() => {
                          replaceFieldServiceMeetings([]);
                          setConfirmClearAllFsm(false);
                          showToast('Se limpió el programa de salidas.', 'success');
                        }}
                        className="text-[10px] font-bold text-rose-700 hover:underline px-1"
                      >
                        Vaciar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAllFsm(false)}
                        className="text-[10px] text-slate-500 px-1"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAllFsm(true)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Vaciar todas las salidas"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Barra de Filtros del Cuadrante de Salidas */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Filtro por Día */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setFsmDayFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  fsmDayFilter === 'todos'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos los días
              </button>
              {DAYS_OF_WEEK_ORDER.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setFsmDayFilter(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    fsmDayFilter === day
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Selectores de Mes y Grupo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={fsmMonthFilter}
                  onChange={(e) => setFsmMonthFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="todos">Todos los meses</option>
                  {availableFsmMonths.map((mk) => (
                    <option key={mk} value={mk}>
                      Mes: {mk}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={fsmGroupFilter}
                  onChange={(e) => setFsmGroupFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  <option value="todos">Todos los grupos</option>
                  <option value="general">Solo Congregación General</option>
                  {preachingGroups.map((g) => (
                    <option key={g.number} value={String(g.number)}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista / Cuadrante de Salidas al Servicio del Campo */}
          {filteredFieldServiceMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  No hay salidas al servicio del campo en esta vista
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Utiliza el <strong>Generador Automático</strong> para crear el cuadrante semanal o mensual con rotación equitativa de conductores autorizados y sugerencia automática de territorios disponibles en S-13.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Generar Cuadrante de Salidas</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewFsmModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Salida Manual</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFieldServiceMeetings.map((fsm) => {
                const conductor = fsm.conductorId ? publishersMap.get(fsm.conductorId) : undefined;
                const grp = fsm.groupNumber
                  ? preachingGroups.find((g) => g.number === fsm.groupNumber)
                  : undefined;
                const groupLabel = grp
                  ? grp.name
                  : fsm.groupNumber
                  ? `Grupo ${fsm.groupNumber}`
                  : 'Congregación General';

                const linkedTerr = fsm.territoryId
                  ? territories.find((t) => t.id === fsm.territoryId)
                  : fsm.territoryNumber
                  ? territories.find((t) => fsm.territoryNumber?.startsWith(t.number))
                  : undefined;

                const isConductorAbsent =
                  conductor && fsm.date ? isPublisherAbsentOnDate(conductor, fsm.date) : false;

                return (
                  <div
                    key={fsm.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3.5"
                  >
                    {/* Cabecera de la tarjeta: Día, Fecha, Hora y Grupo */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-extrabold">
                            {fsm.dayOfWeek}
                          </span>
                          {fsm.date && (
                            <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                              {fsm.date}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                            <Clock className="w-3 h-3" />
                            {fsm.time}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFsmModal(fsm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar salida"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFieldServiceMeeting(fsm.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar salida"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Badges de Grupo y Modalidad */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            fsm.groupNumber
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          👥 {groupLabel}
                        </span>
                        {fsm.modality && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            {MODALITY_SHORT_LABELS[fsm.modality]}
                          </span>
                        )}
                      </div>

                      {/* Punto de encuentro */}
                      <div className="flex items-start gap-2 pt-1 text-xs text-slate-700">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Punto de Encuentro
                          </span>
                          <span className="font-bold text-slate-900">{fsm.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Conductor y Territorio Sugerido */}
                    <div className="space-y-2.5 pt-2.5 border-t border-slate-100 text-xs">
                      {/* Conductor */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Conductor Asignado
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">
                              {conductor ? conductor.name : 'Sin conductor asignado'}
                            </span>
                            {isConductorAbsent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                ⚠ Ausente
                              </span>
                            )}
                          </div>
                        </div>

                        {conductor && (
                          <button
                            type="button"
                            onClick={() => handleNotifyConductorWhatsApp(fsm)}
                            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 transition-colors cursor-pointer"
                            title="Enviar recordatorio de salida al conductor por WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Territorio Sugerido (S-13) */}
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase text-emerald-700">
                            Territorio Sugerido (S-13)
                          </span>
                          {linkedTerr && linkedTerr.status === 'disponible' && fsm.conductorId && (
                            <button
                              type="button"
                              onClick={() => handleAssignSuggestedTerritoryS13(fsm)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                              title="Registrar oficialmente este territorio a nombre del conductor en el registro S-13"
                            >
                              Asignar en S-13
                            </button>
                          )}
                        </div>

                        {fsm.territoryNumber ? (
                          <div>
                            <span className="font-bold text-slate-900 block">
                              📍 #{fsm.territoryNumber}
                            </span>
                            {linkedTerr?.boundsDescription && (
                              <span className="text-[11px] text-slate-500 line-clamp-1">
                                {linkedTerr.boundsDescription}
                              </span>
                            )}
                            {linkedTerr?.noVisits && linkedTerr.noVisits.length > 0 && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 mt-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {linkedTerr.noVisits.length} casa(s) «No Visitar» en este territorio
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic block">
                            Según necesidad del grupo / conductor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT / CREATE GROUP                              */}
      {/* ========================================================= */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>
                  {editingGroup ? 'Editar Grupo de Servicio' : 'Nuevo Grupo de Servicio'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
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
                    min="1"
                    disabled={Boolean(editingGroup)}
                    value={groupFormData.number}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, number: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Grupo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Grupo 1 - Los Olivos"
                    value={groupFormData.name}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Superintendente de Grupo (Anciano / Siervo)
                </label>
                <select
                  value={groupFormData.overseerId}
                  onChange={(e) =>
                    setGroupFormData({ ...groupFormData, overseerId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="">-- Sin asignar --</option>
                  {qualifiedBrothers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.privilege === 'anciano' ? 'Anciano' : 'Siervo min.'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auxiliar de Grupo
                </label>
                <select
                  value={groupFormData.assistantId}
                  onChange={(e) =>
                    setGroupFormData({ ...groupFormData, assistantId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="">-- Sin asignar --</option>
                  {publishers
                    .filter((p) => p.active && (p.gender === 'hermano' || p.gender === 'male'))
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      <span>Guardando en la nube...</span>
                    </>
                  ) : (
                    <span>Guardar Grupo</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: MOVE PUBLISHER BETWEEN GROUPS                    */}
      {/* ========================================================= */}
      {movingPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Reasignar de Grupo</span>
              </h3>
              <button
                type="button"
                onClick={() => setMovingPublisher(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Seleccione el nuevo grupo de servicio para{' '}
              <strong className="text-slate-900">{movingPublisher.name}</strong>:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grupo de Destino
              </label>
              <select
                value={targetGroupNumber}
                onChange={(e) => setTargetGroupNumber(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                {preachingGroups.map((g) => (
                  <option key={g.number} value={g.number}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMovingPublisher(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleMovePublisher}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Mover a {preachingGroups.find((g) => g.number === targetGroupNumber)?.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: GENERADOR AUTOMÁTICO DE SALIDAS AL CAMPO         */}
      {/* ========================================================= */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  MOTOR AUTOMÁTICO • SERVICIO DEL CAMPO
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>Generador Inteligente de Salidas de Predicación</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Programa los puntos de encuentro, rota equitativamente a los conductores autorizados y sugiere territorios disponibles en S-13.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneratorModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Paso 1: Período y Plantilla Rápida */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Alcance del Programa
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGenMode('month')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      genMode === 'month'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Mes Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenMode('week')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      genMode === 'week'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    1 Semana
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. {genMode === 'month' ? 'Mes a Programar' : 'Lunes de la Semana'}
                </label>
                {genMode === 'month' ? (
                  <input
                    type="month"
                    value={genMonthKey}
                    onChange={(e) => setGenMonthKey(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                  />
                ) : (
                  <input
                    type="date"
                    value={genWeekStart}
                    onChange={(e) => setGenWeekStart(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Plantilla Rápida de Horarios
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setGenSlots(getPresetSlots('estandar_semanal'))}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Estándar Semanal
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenSlots(getPresetSlots('compacto_congregacion'))}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Compacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenSlots(getPresetSlots('campana_especial'))}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-400 text-[11px] font-bold text-amber-800 cursor-pointer"
                  >
                    Campaña Especial
                  </button>
                </div>
              </div>
            </div>

            {/* Paso 2: Reglas Inteligentes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-300">
                <input
                  type="checkbox"
                  checked={genAutoSuggestTerritories}
                  onChange={(e) => setGenAutoSuggestTerritories(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Sugerir Territorios S-13
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Prioriza territorios disponibles y con mayor antigüedad sin predicar.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-300">
                <input
                  type="checkbox"
                  checked={genPreferGroupLeaders}
                  onChange={(e) => setGenPreferGroupLeaders(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Priorizar Encargados de Grupo
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Asigna al Superintendente o Auxiliar en las salidas por grupo.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-300">
                <input
                  type="checkbox"
                  checked={genPreferFamilyAffinity}
                  onChange={(e) => setGenPreferFamilyAffinity(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Agrupación Familiar
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Respeta ausencias y sincroniza conductores del mismo núcleo familiar.
                  </span>
                </div>
              </label>
            </div>

            {/* Paso 3: Tabla de Horarios Habituales de la Plantilla */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Horarios y Puntos de Encuentro Habituales ({genSlots.filter((s) => s.enabled).length} activos)
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setGenSlots([
                      ...genSlots,
                      {
                        id: `custom-slot-${Date.now()}`,
                        enabled: true,
                        dayOfWeek: 'Sábado',
                        session: 'tarde',
                        time: '16:00',
                        locationMode: 'salon',
                        scope: 'general',
                        modality: 'estudios_revisitas',
                      },
                    ])
                  }
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir horario a la plantilla</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Activo</th>
                      <th className="p-2.5">Día</th>
                      <th className="p-2.5">Hora</th>
                      <th className="p-2.5">Alcance</th>
                      <th className="p-2.5">Punto de Encuentro</th>
                      <th className="p-2.5">Modalidad</th>
                      <th className="p-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {genSlots.map((slot, idx) => (
                      <tr
                        key={slot.id}
                        className={slot.enabled ? 'bg-white' : 'bg-slate-50/70 opacity-60'}
                      >
                        <td className="p-2.5">
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={(e) => {
                              const next = [...genSlots];
                              next[idx] = { ...slot, enabled: e.target.checked };
                              setGenSlots(next);
                            }}
                            className="rounded text-indigo-600"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={slot.dayOfWeek}
                            onChange={(e) => {
                              const next = [...genSlots];
                              next[idx] = {
                                ...slot,
                                dayOfWeek: e.target.value as FieldServiceSlotTemplate['dayOfWeek'],
                              };
                              setGenSlots(next);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 font-bold bg-white"
                          >
                            {DAYS_OF_WEEK_ORDER.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="time"
                            value={slot.time}
                            onChange={(e) => {
                              const next = [...genSlots];
                              next[idx] = { ...slot, time: e.target.value };
                              setGenSlots(next);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 font-bold bg-white"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={slot.scope}
                            onChange={(e) => {
                              const next = [...genSlots];
                              next[idx] = {
                                ...slot,
                                scope: e.target.value as 'general' | 'por_grupos',
                              };
                              setGenSlots(next);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                          >
                            <option value="general">Congregación General</option>
                            <option value="por_grupos">Por Grupos ({preachingGroups.length})</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={slot.locationMode}
                            onChange={(e) => {
                              const next = [...genSlots];
                              next[idx] = {
                                ...slot,
                                locationMode: e.target.value as FieldServiceSlotTemplate['locationMode'],
                              };
                              setGenSlots(next);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="salon">Salón del Reino</option>
                            <option value="hogar_grupo">Hogar / Punto de cada Grupo</option>
                            <option value="zoom">Sala de Zoom</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={slot.modality}
                            onChange={(e) => {
                              const next = [...genSlots];
                              next[idx] = {
                                ...slot,
                                modality: e.target.value as FieldServiceModality,
                              };
                              setGenSlots(next);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white"
                          >
                            {Object.entries(MODALITY_SHORT_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setGenSlots(genSlots.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer del Generador */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="replaceMode"
                    checked={genReplaceMode === 'replace_period'}
                    onChange={() => setGenReplaceMode('replace_period')}
                  />
                  <span>Reemplazar salidas del período</span>
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="replaceMode"
                    checked={genReplaceMode === 'append'}
                    onChange={() => setGenReplaceMode('append')}
                  />
                  <span>Añadir a las existentes</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRunAutoGeneratorKHS}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Programa Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CREAR / EDITAR SALIDA INDIVIDUAL                 */}
      {/* ========================================================= */}
      {isFsmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <span>
                  {editingFsm
                    ? 'Editar Salida al Servicio del Campo'
                    : 'Nueva Salida al Servicio del Campo'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFsmModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFsmModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Día</label>
                  <select
                    value={fsmForm.dayOfWeek}
                    onChange={(e) =>
                      setFsmForm({
                        ...fsmForm,
                        dayOfWeek: e.target.value as FieldServiceSlotTemplate['dayOfWeek'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                  >
                    {DAYS_OF_WEEK_ORDER.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha (Opcional)
                  </label>
                  <input
                    type="date"
                    value={fsmForm.date}
                    onChange={(e) => setFsmForm({ ...fsmForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={fsmForm.time}
                    onChange={(e) => setFsmForm({ ...fsmForm, time: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alcance / Grupo
                  </label>
                  <select
                    value={fsmForm.groupNumber}
                    onChange={(e) => setFsmForm({ ...fsmForm, groupNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    <option value="">Congregación General</option>
                    {preachingGroups.map((g) => (
                      <option key={g.number} value={String(g.number)}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modalidad de Predicación
                  </label>
                  <select
                    value={fsmForm.modality}
                    onChange={(e) =>
                      setFsmForm({
                        ...fsmForm,
                        modality: e.target.value as FieldServiceModality,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    {Object.entries(MODALITY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Punto de Encuentro
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Salón del Reino, Hogar Fam. Pérez, Sala Zoom..."
                  value={fsmForm.location}
                  onChange={(e) => setFsmForm({ ...fsmForm, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Conductor Autorizado (con contador de equidad)
                </label>
                <select
                  value={fsmForm.conductorId}
                  onChange={(e) => setFsmForm({ ...fsmForm, conductorId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="">-- Seleccionar conductor --</option>
                  {eligibleConductors.map((c) => {
                    const count = conductorOutingCounts.get(c.id) || 0;
                    const absent = fsmForm.date
                      ? isPublisherAbsentOnDate(c, fsmForm.date)
                      : false;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({count} salidas){absent ? ' — ⚠ AUSENTE EN ESTA FECHA' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Territorio Sugerido (Recomendación Inteligente S-13)
                </label>
                <select
                  value={fsmForm.territoryId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    const found = territories.find((t) => t.id === tid);
                    setFsmForm({
                      ...fsmForm,
                      territoryId: tid,
                      territoryNumber: found
                        ? `${found.number} - ${found.name}`
                        : fsmForm.territoryNumber,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="">-- Sin territorio específico / Manual --</option>
                  {rankedTerritoriesForModal.map(({ territory, reason }) => (
                    <option key={territory.id} value={territory.id}>
                      #{territory.number} - {territory.name} ({reason})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Llevar tratados e invitaciones..."
                  value={fsmForm.notes}
                  onChange={(e) => setFsmForm({ ...fsmForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFsmModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  Guardar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
