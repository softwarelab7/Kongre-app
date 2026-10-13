// src/components/PublishersTab.tsx
import React, { useState, useMemo } from 'react';
import { Publisher } from '../types';
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Users,
  RefreshCcw,
  ChevronUp,
  ChevronDown,
  Upload,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { Select } from './Select';
import { PublisherEditor, ASSIGNMENT_GROUPS } from './PublisherEditor';
import { useCongregation } from '../context/CongregationContext';
import { usePermissions } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';

type ViewMode = 'list' | 'editor';

export const PublishersTab: React.FC = () => {
  const { canEditPublishers } = usePermissions();
  const {
    publishers,
    addPublisher,
    updatePublisher,
    deletePublisher,
    preachingGroups,
  } = useCongregation();

  const { showToast } = useToast();
  const { confirm } = useModal();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'elder' | 'servant' | 'publisher' | 'trash'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'group' | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);

  // Normalizar grupos de predicación
  const groups = useMemo(() => {
    return (preachingGroups || []).map((g) => ({
      id: String(g.number),
      name: g.name || `Grupo ${g.number}`,
      number: g.number,
    }));
  }, [preachingGroups]);

  const groupOptions = useMemo(() => {
    return [
      { label: 'Todos los grupos', value: 'all' },
      ...groups.map((g) => ({ label: g.name, value: g.id })),
      { label: 'Sin asignar', value: 'unassigned' },
    ];
  }, [groups]);

  const getBadgeLabel = (roleOrPrivilege?: string) => {
    if (!roleOrPrivilege) return 'Publicador';
    const labels: Record<string, string> = {
      super_admin: 'Administrador',
      elder: 'Anciano',
      anciano: 'Anciano',
      servant: 'Siervo Ministerial',
      siervo_ministerial: 'Siervo Ministerial',
      publisher: 'Publicador',
      publicador_bautizado: 'Publicador Bautizado',
      publicador_no_bautizado: 'No Bautizado',
      unbaptized: 'No Bautizado',
      special_pioneer: 'Precursor Especial',
      precursor_especial: 'Precursor Especial',
      regular_pioneer: 'Precursor Regular',
      precursor_regular: 'Precursor Regular',
      auxiliary_pioneer: 'Precursor Auxiliar',
      precursor_auxiliar: 'Precursor Auxiliar',
    };
    return labels[roleOrPrivilege] || roleOrPrivilege;
  };

  const getBadgeColor = (roleOrPrivilege?: string) => {
    const key = (roleOrPrivilege || '').toLowerCase();
    if (key.includes('admin')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (key === 'elder' || key === 'anciano') {
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    if (key === 'servant' || key === 'siervo_ministerial') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (key.includes('regular') || key.includes('especial')) {
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    }
    if (key === 'publisher' || key === 'publicador_bautizado') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    return 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400 border-zinc-200 dark:border-white/10';
  };

  // Helper para nombre y estado de publicador
  const getPublisherDisplayName = (p: Publisher) => {
    return p.full_name || p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sin nombre';
  };

  const isPublisherFemale = (p: Publisher) => {
    return p.gender === 'female' || p.gender === 'hermana';
  };

  const getPublisherGroupId = (p: Publisher) => {
    if (p.id_grupo) return String(p.id_grupo);
    if (p.groupNumber !== undefined && p.groupNumber !== null) return String(p.groupNumber);
    return null;
  };

  const getPublisherGroupName = (p: Publisher) => {
    const gid = getPublisherGroupId(p);
    if (!gid) return '—';
    const found = groups.find((g) => g.id === gid || String(g.number) === gid);
    return found ? found.name : `Grupo ${gid}`;
  };

  // Filtrado y orden
  const sortedAndFilteredPublishers = useMemo(() => {
    return publishers
      .filter((p) => {
        const displayName = getPublisherDisplayName(p).toLowerCase();
        const matchesSearch =
          displayName.includes(searchTerm.toLowerCase()) ||
          (p.phone && p.phone.includes(searchTerm)) ||
          (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));

        // Manejo de papelera
        const isDeleted = p.status === 'deleted';
        if (roleFilter === 'trash') {
          return isDeleted && matchesSearch;
        }
        if (isDeleted) return false;

        // Rol filter
        const roleKey = (p.role || p.privilege || '').toLowerCase();
        let matchesRole = true;
        if (roleFilter === 'elder') {
          matchesRole = roleKey === 'elder' || roleKey === 'anciano' || roleKey === 'super_admin';
        } else if (roleFilter === 'servant') {
          matchesRole = roleKey === 'servant' || roleKey === 'siervo_ministerial';
        } else if (roleFilter === 'publisher') {
          matchesRole =
            roleKey === 'publisher' ||
            roleKey === 'publicador_bautizado' ||
            roleKey === 'publicador_no_bautizado' ||
            roleKey === 'unbaptized' ||
            !roleKey;
        }

        // Grupo filter
        const pGid = getPublisherGroupId(p);
        let matchesGroup = true;
        if (groupFilter === 'unassigned') {
          matchesGroup = !pGid;
        } else if (groupFilter !== 'all') {
          matchesGroup = pGid === groupFilter;
        }

        return matchesSearch && matchesRole && matchesGroup;
      })
      .sort((a, b) => {
        if (!sortField) return 0;
        let aVal = '';
        let bVal = '';

        if (sortField === 'name') {
          aVal = getPublisherDisplayName(a).toLowerCase();
          bVal = getPublisherDisplayName(b).toLowerCase();
        } else if (sortField === 'group') {
          aVal = getPublisherGroupName(a).toLowerCase();
          bVal = getPublisherGroupName(b).toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [publishers, searchTerm, roleFilter, groupFilter, sortField, sortDirection, groups]);

  const handleSort = (field: 'name' | 'group') => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortField(null);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSave = async (data: Partial<Publisher>) => {
    const fullName = data.full_name || [data.first_name, data.last_name].filter(Boolean).join(' ') || data.name || '';
    const nid = data.nid || data.id || `pub-${Date.now()}`;
    const groupNum = data.id_grupo ? parseInt(data.id_grupo, 10) : (data.groupNumber || 1);

    const isFemale = data.gender === 'female' || data.gender === 'hermana';

    // Mapeo sincronizado de roles booleano para compatibilidad con las demás pestañas de Kongre 2
    const currentAssignments = data.assignments || {};
    const rolesSynced = {
      vym_presidente: !!currentAssignments.chairman,
      vym_oracion: !!currentAssignments.prayers,
      vym_tesoros_discurso: !!currentAssignments.talk,
      vym_tesoros_perlas: !!currentAssignments.gems,
      vym_tesoros_lectura: !!currentAssignments.reading,
      vym_maestros_titular: !!currentAssignments.student,
      vym_maestros_ayudante: !!currentAssignments.assistant_student,
      vym_vida_partes: !!currentAssignments.living_parts,
      vym_estudio_conductor: !!currentAssignments.bible_study,
      vym_estudio_lector: !!currentAssignments.reader_living,
      fds_presidente: !!currentAssignments.weekend_chairman,
      fds_atalaya_lector: !!currentAssignments.watchtower_reader,
      fds_oracion: !!currentAssignments.final_prayer,
      deber_acomodador: !!currentAssignments.attendants_midweek || !!currentAssignments.attendants_weekend,
      deber_seguridad: false,
      deber_audio: !!currentAssignments.audio_video_midweek || !!currentAssignments.audio_video_weekend,
      deber_video: !!currentAssignments.audio_video_midweek || !!currentAssignments.audio_video_weekend,
      deber_microfonos: !!currentAssignments.microphones_midweek || !!currentAssignments.microphones_weekend,
      deber_plataforma: !!currentAssignments.platform_task_midweek || !!currentAssignments.platform_task_weekend,
      deber_zoom: false,
      ...(data.roles || {}),
    };

    const targetPayload: Publisher = {
      id: data.id || nid,
      name: fullName,
      full_name: fullName,
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      second_last_name: data.second_last_name,
      nid: nid,
      gender: isFemale ? 'hermana' : 'hermano',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      birth_date: data.birth_date || data.birthDate || '',
      birthDate: data.birth_date || data.birthDate || '',
      baptism_date: data.baptism_date || data.baptismDate || '',
      baptismDate: data.baptism_date || data.baptismDate || '',
      role: data.role || 'publisher',
      privilege: (data.privilege as any) || (data.role === 'elder' ? 'anciano' : data.role === 'servant' ? 'siervo_ministerial' : 'publicador_bautizado'),
      groupNumber: groupNum,
      id_grupo: data.id_grupo || String(groupNum),
      active: data.status !== 'inactive' && data.status !== 'deleted' && data.is_active !== false,
      status: data.status || 'active',
      is_active: data.status !== 'inactive' && data.status !== 'deleted' && data.is_active !== false,
      notes: data.notes || '',
      spiritual_notes: data.spiritual_notes || '',
      absences: (data.absences || []),
      ausencias: (data.ausencias || []),
      assignments: currentAssignments,
      assignment_metadata: data.assignment_metadata || {},
      s21_records: data.s21_records || {},
      emergency_contacts: data.emergency_contacts || [],
      roles: rolesSynced,
      is_elderly: !!data.is_elderly,
      is_infirm: !!data.is_infirm,
      is_deaf: !!data.is_deaf,
      is_blind: !!data.is_blind,
      is_imprisoned: !!data.is_imprisoned,
      is_head_of_household: !!data.is_head_of_household,
      is_child: !!data.is_child,
      is_moved: !!data.is_moved,
      pioneer_type: data.pioneer_type || 'none',
      has_key: !!data.has_key,
      reports_to_branch: !!data.reports_to_branch,
      is_disfellowshipped: !!data.is_disfellowshipped,
      is_reinstated: !!data.is_reinstated,
      group_responsibility: data.group_responsibility || 'none',
      printed_guide: !!data.printed_guide,
    };

    try {
      const existing = publishers.find((p) => p.id === targetPayload.id);
      if (existing) {
        updatePublisher(targetPayload);
        showToast('¡Cambios guardados con éxito!', 'success');
      } else {
        addPublisher(targetPayload);
        showToast('¡Nuevo publicador creado con éxito!', 'success');
      }
      setViewMode('list');
      setEditingPublisher(null);
    } catch (err: any) {
      showToast(`Error al guardar: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const pub = publishers.find((p) => p.id === id);
    if (!pub) return;

    if (roleFilter === 'trash') {
      const confirmed = await confirm({
        title: 'Eliminar Permanentemente',
        message: `¿Borrar definitivamente a ${getPublisherDisplayName(pub)}? Esta acción no se puede deshacer.`,
        confirmText: 'Borrar Definitivamente',
        type: 'danger',
      });
      if (confirmed) {
        await deletePublisher(id);
        showToast('Publicador eliminado definitivamente', 'success');
      }
    } else {
      const confirmed = await confirm({
        title: 'Mover a Papelera',
        message: `¿Mover a ${getPublisherDisplayName(pub)} a la papelera? Podrás restaurarlo en cualquier momento.`,
        confirmText: 'Mover a Papelera',
        type: 'danger',
      });
      if (confirmed) {
        updatePublisher({
          ...pub,
          status: 'deleted',
          active: false,
          is_active: false,
        });
        showToast('Publicador movido a la papelera', 'success');
      }
    }
  };

  const handleRestore = (id: string) => {
    const pub = publishers.find((p) => p.id === id);
    if (!pub) return;
    updatePublisher({
      ...pub,
      status: 'active',
      active: true,
      is_active: true,
    });
    showToast('Publicador restaurado correctamente', 'success');
  };

  // Render Editor Mode
  if (viewMode === 'editor') {
    return (
      <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 custom-scrollbar relative">
          <PublisherEditor
            key={editingPublisher?.id || 'new'}
            publisher={editingPublisher || {}}
            onSave={handleSave}
            onCancel={() => {
              setViewMode('list');
              setEditingPublisher(null);
            }}
          />
        </div>
      </div>
    );
  }

  const activePublishersCount = publishers.filter((p) => p.status === 'active' || (p.active && p.status !== 'deleted')).length;
  const trashCount = publishers.filter((p) => p.status === 'deleted').length;

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <SectionHeader
        icon={Users}
        title="Directorio de"
        highlightWord="Publicadores"
        subtitle={`${activePublishersCount} miembros activos`}
        colorTheme="indigo"
        actions={
          <button
            disabled={!canEditPublishers}
            onClick={() => {
              setEditingPublisher(null);
              setViewMode('editor');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/90 hover:bg-indigo-500 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 text-white rounded-xl text-sm font-semibold transition-colors shadow-md dark:shadow-indigo-500/10 dark:border dark:border-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <UserPlus size={16} /> Nuevo Publicador
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 custom-scrollbar">
        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
            <input
              className="kf-input kf-input-icon"
              placeholder="Buscar publicadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-56 shrink-0">
            <Select
              options={groupOptions}
              value={groupFilter}
              onChange={setGroupFilter}
              buttonClassName="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-black/[0.04] text-black/60 hover:bg-black/[0.07] dark:bg-white/[0.05] dark:text-white/60 dark:hover:bg-white/[0.08] outline-none border-none cursor-pointer transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0 items-center">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-black/[0.04] text-black/50 hover:bg-black/[0.07] dark:bg-white/[0.05] dark:text-white/50 dark:hover:bg-white/[0.08]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setRoleFilter('elder')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'elder'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-black/[0.04] text-black/50 hover:bg-black/[0.07] dark:bg-white/[0.05] dark:text-white/50 dark:hover:bg-white/[0.08]'
              }`}
            >
              Anciano
            </button>
            <button
              onClick={() => setRoleFilter('servant')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'servant'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-black/[0.04] text-black/50 hover:bg-black/[0.07] dark:bg-white/[0.05] dark:text-white/50 dark:hover:bg-white/[0.08]'
              }`}
            >
              Siervos Min.
            </button>
            <button
              onClick={() => setRoleFilter('publisher')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === 'publisher'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-black/[0.04] text-black/50 hover:bg-black/[0.07] dark:bg-white/[0.05] dark:text-white/50 dark:hover:bg-white/[0.08]'
              }`}
            >
              Publicador
            </button>

            <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1 self-center" />

            <button
              onClick={() => setRoleFilter('trash')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'trash'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20'
              }`}
            >
              <Trash2 size={12} />
              Papelera {trashCount > 0 && `(${trashCount})`}
            </button>
          </div>
        </div>

        {/* Tabla de Publicadores estilo Kongre */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-white/[0.03] shadow-sm shadow-indigo-100/50 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        Publicador
                        {sortField === 'name' &&
                          (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                    </th>
                    <th>Privilegio</th>
                    <th>Contacto</th>
                    <th
                      onClick={() => handleSort('group')}
                      className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        Grupo
                        {sortField === 'group' &&
                          (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                    </th>
                    <th>Asignaciones</th>
                    <th>Estado</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredPublishers.map((p) => {
                    const isFemale = isPublisherFemale(p);
                    const displayName = getPublisherDisplayName(p);
                    const privilegeOrRole = p.role || p.privilege;
                    const groupName = getPublisherGroupName(p);
                    const isDeleted = p.status === 'deleted';
                    const isActive = p.status === 'active' || (p.active && !isDeleted);

                    // Mapeo de asignaciones para preview rápido
                    const assignmentKeys = Object.entries(p.assignments || {})
                      .filter(([_, val]) => !!val)
                      .map(([k]) => k);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-indigo-50/20 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => {
                          if (canEditPublishers) {
                            setEditingPublisher(p);
                            setViewMode('editor');
                          }
                        }}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 shadow-sm"
                              style={{
                                background: isFemale
                                  ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                                  : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                              }}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-black/90 dark:text-white/90">
                                {displayName}
                              </div>
                              {p.email && (
                                <div className="text-[10px] text-black/40 dark:text-white/40">{p.email}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeColor(
                              privilegeOrRole
                            )}`}
                          >
                            {getBadgeLabel(privilegeOrRole)}
                          </span>
                        </td>

                        <td>
                          <div className="text-xs text-black/60 dark:text-white/60">
                            {p.phone || '—'}
                          </div>
                        </td>

                        <td>
                          <div className="text-xs font-medium text-black/70 dark:text-white/70">
                            {groupName}
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-wrap gap-1">
                            {assignmentKeys.length > 0 ? (
                              <>
                                {assignmentKeys.slice(0, 2).map((a) => {
                                  let label = a;
                                  for (const group of ASSIGNMENT_GROUPS) {
                                    const item = group.items.find((i) => i.id === a);
                                    if (item) {
                                      label = (item as any).shortLabel || item.label;
                                      break;
                                    }
                                  }
                                  // Legacy fallbacks
                                  if (label === 'chairman') label = 'Presidente';
                                  if (label === 'prayers') label = 'Oraciones';
                                  if (label === 'talk') label = 'Tesoros';
                                  if (label === 'reading') label = 'Lectura';
                                  if (label === 'student') label = 'Estudiante';
                                  if (label === 'attendants_midweek' || label === 'attendants_weekend') label = 'Acomodador';
                                  if (label === 'audio_video_midweek' || label === 'audio_video_weekend') label = 'Audio/Video';
                                  if (label === 'microphones_midweek' || label === 'microphones_weekend') label = 'Micrófonos';

                                  return (
                                    <span
                                      key={a}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/[0.04] text-black/60 dark:bg-white/[0.06] dark:text-white/60"
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                                {assignmentKeys.length > 2 && (
                                  <span className="text-[10px] font-semibold text-black/40 dark:text-white/40 self-center">
                                    +{assignmentKeys.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-black/30 dark:text-white/30">—</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              isActive ? 'badge-active' : 'badge-inactive'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {isDeleted ? (
                              <>
                                <button
                                  disabled={!canEditPublishers}
                                  onClick={() => handleRestore(p.id)}
                                  title="Restaurar publicador"
                                  className="p-1.5 rounded-lg transition-colors hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-500/10 dark:text-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <RefreshCcw size={14} />
                                </button>
                                <button
                                  disabled={!canEditPublishers}
                                  onClick={() => handleDelete(p.id)}
                                  title="Eliminar definitivamente"
                                  className="p-1.5 rounded-lg transition-colors hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-500/10 dark:text-rose-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  disabled={!canEditPublishers}
                                  onClick={() => {
                                    setEditingPublisher(p);
                                    setViewMode('editor');
                                  }}
                                  title="Editar publicador"
                                  className="p-1.5 rounded-lg transition-colors hover:bg-black/[0.06] text-black/40 hover:text-indigo-600 dark:hover:bg-white/[0.08] dark:text-white/40 dark:hover:text-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  disabled={!canEditPublishers}
                                  onClick={() => handleDelete(p.id)}
                                  title="Mover a papelera"
                                  className="p-1.5 rounded-lg transition-colors hover:bg-rose-50 text-black/40 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:text-white/40 dark:hover:text-rose-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {sortedAndFilteredPublishers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-black/40 dark:text-white/40">
                          <Users size={32} className="mb-2 opacity-50" />
                          <p className="text-sm font-semibold">No se encontraron publicadores</p>
                          <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">
                            {searchTerm ? 'Prueba con otro término de búsqueda' : 'Comienza creando un nuevo publicador'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
