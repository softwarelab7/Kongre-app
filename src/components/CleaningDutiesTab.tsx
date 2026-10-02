// src/components/CleaningDutiesTab.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { PreachingGroup, CustomDuty, FieldServiceMeeting } from '../types';
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
    updateWeek,
    publishersMap,
  } = useCongregation();

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

  const handleSaveGroup = (e: React.FormEvent) => {
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
      updatePreachingGroups(updated);
    } else {
      const newGroup: PreachingGroup = {
        number: groupNumber,
        name: groupName.trim(),
        overseerId: groupOverseer || undefined,
        assistantId: groupAssistant || undefined,
        memberIds: groupMembers,
      };
      updatePreachingGroups([...preachingGroups, newGroup]);
    }
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = (num: number) => {
    if (confirm(`¿Eliminar el Grupo #${num}?`)) {
      updatePreachingGroups(preachingGroups.filter(g => g.number !== num));
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

  return (
    <div className="space-y-8">
      {/* 1. SECCIÓN: LIMPIEZA DEL SALÓN DEL REINO */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
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

      {/* 2. SECCIÓN: GRUPOS DE PREDICACIÓN */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
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

      {/* 3. SECCIÓN: DEBERES Y PERSONALIZADOS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span>Deberes Operativos y Personalizados</span>
            </h3>
            <p className="text-xs text-slate-500">
              Crea responsabilidades personalizadas como audio, estacionamiento, acomodadores o deberes locales.
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

      {/* SECTION 4: SALIDAS PARA LA PREDICACIÓN (SERVICIO DEL CAMPO) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
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
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dutyMidweek}
                      onChange={e => setDutyMidweek(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Entre semana</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dutyWeekend}
                      onChange={e => setDutyWeekend(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Fin de semana</span>
                  </label>
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
    </div>
  );
};
