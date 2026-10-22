// src/components/GruposServicioTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { PreachingGroup, Publisher } from '../types';
import {
  Users,
  UserCheck,
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
  Shield,
  Star,
  X,
  Compass,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const GruposServicioTab: React.FC = () => {
  const { showToast } = useToast();
  const {
    preachingGroups,
    updatePreachingGroups,
    publishers,
    updatePublisher,
    publishersMap,
    settings,
  } = useCongregation();

  const [selectedGroupNumber, setSelectedGroupNumber] = useState<number | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedGroupNumber, setCopiedGroupNumber] = useState<number | null>(null);

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

  // Active elders & ministerial servants for overseer dropdown
  const qualifiedBrothers = useMemo(() => {
    return publishers.filter(
      (p) =>
        p.active &&
        p.gender === 'hermano' &&
        (p.privilege === 'anciano' ||
          p.privilege === 'siervo_ministerial' ||
          p.roles.vym_presidente ||
          p.roles.fds_presidente)
    );
  }, [publishers]);

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
      preachingGroups.length > 0
        ? Math.max(...preachingGroups.map((g) => g.number)) + 1
        : 1;
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

    const groupNum = editingGroup ? editingGroup.number : (Number(groupFormData.number) || 1);
    const existingMembers = publishers.filter((p) => p.groupNumber === groupNum).map((p) => p.id);

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
    } catch (err: any) {
      showToast('Error al guardar el grupo en la nube. Se guardó localmente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoCreateFirstGroup = async () => {
    if (isSaving) return;
    const coord = publishers.find((p) => p.theocraticRole === 'coordinador' || p.privilege === 'anciano');
    const existingMembers = publishers.filter((p) => !p.groupNumber || p.groupNumber === 1).map((p) => p.id);
    const g1: PreachingGroup = {
      number: 1,
      name: 'Grupo 1',
      overseerId: coord?.id,
      memberIds: existingMembers,
    };
    setIsSaving(true);
    try {
      await updatePreachingGroups([g1]);
      showToast('¡Grupo 1 inicial creado y sincronizado en la nube!', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (groupNumber: number) => {
    if (isSaving) return;
    const count = publishers.filter((p) => p.groupNumber === groupNumber).length;
    if (count > 0) {
      showToast(
        `No se puede eliminar el Grupo ${groupNumber} porque tiene ${count} publicadores asignados. Primero reasígnelos a otro grupo.`,
        'error'
      );
      return;
    }
    if (confirm(`¿Está seguro de eliminar el Grupo ${groupNumber}?`)) {
      setIsSaving(true);
      try {
        await updatePreachingGroups(preachingGroups.filter((g) => g.number !== groupNumber));
        showToast(`Grupo ${groupNumber} eliminado de la nube`, 'success');
      } finally {
        setIsSaving(false);
      }
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

  return (
    <div className="space-y-6">
      {/* Barra de Acciones de Grupos de Servicio (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            Grupos de Servicio
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            Superintendentes, auxiliares e integrantes por grupo
          </span>
        </div>

        <button
          onClick={handleOpenNewGroup}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Grupo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
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
              {searchQuery ? 'No se encontraron resultados' : 'No hay grupos de servicio registrados'}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? 'Intente buscar con otro nombre o borre el filtro de búsqueda.'
                : 'Cree los grupos de predicación de su congregación para organizar a los publicadores, asignar superintendentes y coordinar las salidas a predicar.'}
            </p>
          </div>
          {!searchQuery && (
            <button
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
                        onClick={() => handleOpenEditGroup(group)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar nombre y encargados del grupo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.number)}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar grupo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                          rel="noreferrer"
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
                          rel="noreferrer"
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
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              </>
                            )}
                            <button
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

      {/* MODAL 1: EDIT / CREATE GROUP */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{editingGroup ? 'Editar Grupo de Servicio' : 'Nuevo Grupo de Servicio'}</span>
              </h3>
              <button
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
                    .filter((p) => p.active && p.gender === 'hermano')
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

      {/* MODAL 2: MOVE PUBLISHER BETWEEN GROUPS */}
      {movingPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Reasignar de Grupo</span>
              </h3>
              <button
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
    </div>
  );
};
