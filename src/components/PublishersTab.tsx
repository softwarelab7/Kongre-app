// src/components/PublishersTab.tsx
import React, { useState, useMemo, useRef } from 'react';
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
  Download,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  MessageCircle,
  Shield,
  Award,
  Calendar,
  AlertCircle,
  Filter,
  CheckCircle2,
  XCircle,
  UserCheck,
  Plane,
  Sparkles,
} from 'lucide-react';
import { Select } from './Select';
import { PublisherEditor, ASSIGNMENT_GROUPS, Tab } from './PublisherEditor';
import { useCongregation } from '../context/CongregationContext';
import { usePermissions } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useModal } from '../context/ModalContext';
import { exportPublishersToCsv, parsePublishersCsv } from '../utils/publisherExportImport';
import {
  areNamesEquivalent,
  mergePublisherData,
  deduplicatePublishersList,
  ensureImmutablePublisherCode,
} from '../utils/publisherDeduplication';

type ViewMode = 'list' | 'editor';
type DisplayLayout = 'cards' | 'table';
type RoleFilter = 'all' | 'elder' | 'servant' | 'pioneer' | 'publisher' | 'unbaptized' | 'trash';
type GenderFilter = 'all' | 'brothers' | 'sisters';
type StatusFilter = 'all' | 'active' | 'inactive' | 'absent';

export const PublishersTab: React.FC = () => {
  const { canEditPublishers } = usePermissions();
  const {
    publishers,
    addPublisher,
    updatePublisher,
    deletePublisher,
    preachingGroups,
    updatePreachingGroups,
    monthlyReports,
    updateMonthlyReport,
    settings,
    importPublishersBatch,
    cleanDuplicatePublishers,
  } = useCongregation();

  const updatePreachingGroup = (group: any) => {
    if (updatePreachingGroups) {
      updatePreachingGroups(preachingGroups.map((g) => (g.number === group.number ? group : g)));
    }
  };

  const { showToast } = useToast();
  const { confirm } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [displayLayout, setDisplayLayout] = useState<DisplayLayout>('cards');
  const [sortField, setSortField] = useState<'name' | 'group' | 'privilege' | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [editorInitialTab, setEditorInitialTab] = useState<Tab>('all');

  // Detección automática de publicadores duplicados
  const duplicateInfo = useMemo(() => deduplicatePublishersList(publishers), [publishers]);
  const duplicateCount = duplicateInfo.mergedCount;

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

  const groupMap = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [groups]);

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

  // Helper para determinar si un publicador está ausente actualmente
  const isPublisherCurrentlyAbsent = (p: Publisher): boolean => {
    const today = new Date().toISOString().slice(0, 10);
    const absences = (p.ausencias || p.absences || []);
    return absences.some((a: any) => {
      const start = a.start_date || a.startDate;
      const end = a.end_date || a.endDate;
      if (!start || !end) return false;
      return today >= start && today <= end;
    });
  };

  // Badges y etiquetas
  const getBadgeLabel = (roleOrPrivilege?: string, p?: Publisher) => {
    if (p?.pioneer_type && p.pioneer_type !== 'none') {
      if (p.pioneer_type === 'regular') return 'Precursor Regular';
      if (p.pioneer_type === 'special' || p.pioneer_type === 'missionary') return 'Precursor Especial';
      if (p.pioneer_type === 'auxiliary_continuous' || p.pioneer_type === 'auxiliary') return 'Precursor Auxiliar';
    }
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

  const getBadgeColor = (roleOrPrivilege?: string, p?: Publisher) => {
    if (p?.pioneer_type === 'auxiliar') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (p?.pioneer_type && p.pioneer_type !== 'none') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    const key = (roleOrPrivilege || '').toLowerCase();
    if (key.includes('admin')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (key === 'elder' || key === 'anciano') {
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    if (key === 'servant' || key === 'siervo_ministerial') {
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    }
    if (key.includes('auxiliar')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (key.includes('regular') || key.includes('especial')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (key === 'unbaptized' || key === 'publicador_no_bautizado') {
      return 'bg-zinc-100 text-zinc-600 dark:bg-[#18181F] dark:text-[#A1A1AA] border-zinc-200 dark:border-[#27272A]';
    }
    return 'bg-zinc-100 text-zinc-700 dark:bg-[#18181F] dark:text-[#F4F4F5] border-zinc-200 dark:border-[#27272A]';
  };

  // Estadísticas teocráticas de la congregación
  const stats = useMemo(() => {
    let active = 0;
    let elders = 0;
    let servants = 0;
    let pioneers = 0;
    let brothers = 0;
    let sisters = 0;
    let unassigned = 0;
    let absentToday = 0;
    let trash = 0;

    publishers.forEach((p) => {
      const isDel = p.status === 'deleted';
      if (isDel) {
        trash++;
        return;
      }

      const isAct = p.status === 'active' || (p.active && p.status !== 'deleted');
      if (isAct) active++;

      const r = (p.role || p.privilege || '').toLowerCase();
      if (r === 'elder' || r === 'anciano' || r === 'super_admin') elders++;
      else if (r === 'servant' || r === 'siervo_ministerial') servants++;

      const pType = (p.pioneer_type || p.pioneerStatus || '').toLowerCase();
      if (pType === 'regular' || pType === 'special' || pType === 'auxiliary_continuous' || r.includes('precursor')) {
        pioneers++;
      }

      if (isPublisherFemale(p)) {
        sisters++;
      } else {
        brothers++;
      }

      const gid = getPublisherGroupId(p);
      if (!gid) unassigned++;

      if (isPublisherCurrentlyAbsent(p)) {
        absentToday++;
      }
    });

    return {
      active,
      elders,
      servants,
      pioneers,
      brothers,
      sisters,
      unassigned,
      absentToday,
      trash,
      total: publishers.length - trash,
    };
  }, [publishers]);

  // Lista de asignaciones comunes para filtrar
  const assignmentFilterOptions = [
    { label: 'Cualquier asignación', value: 'all' },
    { label: 'Presidente (Fin de semana/CLM)', value: 'chairman' },
    { label: 'Oraciones', value: 'prayers' },
    { label: 'Lectura de La Atalaya', value: 'watchtower_reader' },
    { label: 'Discurso de Tesoros', value: 'talk' },
    { label: 'Lectura de la Biblia', value: 'reading' },
    { label: 'Estudiantes CLM', value: 'student' },
    { label: 'Acomodadores', value: 'attendants' },
    { label: 'Audio / Video', value: 'audio_video' },
    { label: 'Micrófonos', value: 'microphones' },
    { label: 'Plataforma', value: 'platform' },
    { label: 'Predicación pública (Carritos)', value: 'public_witnessing' },
  ];

  // Filtrado y orden
  const sortedAndFilteredPublishers = useMemo(() => {
    return publishers
      .filter((p) => {
        const displayName = getPublisherDisplayName(p).toLowerCase();
        const pubCode = ensureImmutablePublisherCode(p).toLowerCase();
        const matchesSearch =
          displayName.includes(searchTerm.toLowerCase()) ||
          pubCode.includes(searchTerm.toLowerCase()) ||
          (p.phone && p.phone.includes(searchTerm)) ||
          (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.nid && p.nid.toLowerCase().includes(searchTerm.toLowerCase()));

        // Manejo de papelera
        const isDeleted = p.status === 'deleted';
        if (roleFilter === 'trash') {
          return isDeleted && matchesSearch;
        }
        if (isDeleted) return false;

        // Filtro de Género
        if (genderFilter === 'brothers' && isPublisherFemale(p)) return false;
        if (genderFilter === 'sisters' && !isPublisherFemale(p)) return false;

        // Filtro de Estado
        const isActive = p.status === 'active' || (p.active && !isDeleted);
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
        if (statusFilter === 'absent' && !isPublisherCurrentlyAbsent(p)) return false;

        // Rol filter
        const roleKey = (p.role || p.privilege || '').toLowerCase();
        const pType = (p.pioneer_type || p.pioneerStatus || '').toLowerCase();
        let matchesRole = true;
        if (roleFilter === 'elder') {
          matchesRole = roleKey === 'elder' || roleKey === 'anciano' || roleKey === 'super_admin';
        } else if (roleFilter === 'servant') {
          matchesRole = roleKey === 'servant' || roleKey === 'siervo_ministerial';
        } else if (roleFilter === 'pioneer') {
          matchesRole = pType === 'regular' || pType === 'special' || pType.includes('precursor') || roleKey.includes('precursor');
        } else if (roleFilter === 'unbaptized') {
          matchesRole = roleKey === 'unbaptized' || roleKey === 'publicador_no_bautizado';
        } else if (roleFilter === 'publisher') {
          matchesRole =
            roleKey === 'publisher' ||
            roleKey === 'publicador_bautizado' ||
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

        // Asignación filter
        let matchesAssignment = true;
        if (assignmentFilter !== 'all') {
          const asg = p.assignments || {};
          const roles = p.roles || ({} as any);
          if (assignmentFilter === 'chairman') {
            matchesAssignment = !!(asg.chairman || asg.weekend_chairman || roles.fds_presidente || roles.vym_presidente);
          } else if (assignmentFilter === 'prayers') {
            matchesAssignment = !!(asg.prayers || asg.final_prayer || roles.fds_oracion || roles.vym_oracion);
          } else if (assignmentFilter === 'watchtower_reader') {
            matchesAssignment = !!(asg.watchtower_reader || roles.fds_atalaya_lector);
          } else if (assignmentFilter === 'talk') {
            matchesAssignment = !!(asg.talk || roles.vym_tesoros_discurso);
          } else if (assignmentFilter === 'reading') {
            matchesAssignment = !!(asg.reading || roles.vym_tesoros_lectura);
          } else if (assignmentFilter === 'student') {
            matchesAssignment = !!(asg.student || roles.vym_maestros_titular);
          } else if (assignmentFilter === 'attendants') {
            matchesAssignment = !!(asg.attendants_midweek || asg.attendants_weekend || roles.deber_acomodador);
          } else if (assignmentFilter === 'audio_video') {
            matchesAssignment = !!(asg.audio_video_midweek || asg.audio_video_weekend || roles.deber_audio || roles.deber_video);
          } else if (assignmentFilter === 'microphones') {
            matchesAssignment = !!(asg.microphones_midweek || asg.microphones_weekend || roles.deber_microfonos);
          } else if (assignmentFilter === 'platform') {
            matchesAssignment = !!(asg.platform_task_midweek || asg.platform_task_weekend || roles.deber_plataforma);
          } else if (assignmentFilter === 'public_witnessing') {
            matchesAssignment = !!(asg.public_witnessing || p.is_cart_approved);
          }
        }

        return matchesSearch && matchesRole && matchesGroup && matchesAssignment;
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
        } else if (sortField === 'privilege') {
          aVal = (a.role || a.privilege || '').toLowerCase();
          bVal = (b.role || b.privilege || '').toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    publishers,
    searchTerm,
    roleFilter,
    genderFilter,
    statusFilter,
    groupFilter,
    assignmentFilter,
    sortField,
    sortDirection,
    groups,
  ]);

  const handleSort = (field: 'name' | 'group' | 'privilege') => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortField(null);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Cambio de grupo rápido desde la interfaz
  const handleQuickGroupChange = (pub: Publisher, newGroupId: string) => {
    const updated = {
      ...pub,
      id_grupo: newGroupId === 'unassigned' ? null : newGroupId,
      groupNumber: newGroupId === 'unassigned' ? undefined : parseInt(newGroupId, 10),
    };
    updatePublisher(updated);
    showToast(`Grupo de ${getPublisherDisplayName(pub)} actualizado`, 'success');
  };

  // Cambio de estado activo/inactivo rápido
  const handleQuickToggleActive = (pub: Publisher) => {
    const currentActive = pub.status === 'active' || (pub.active && pub.status !== 'deleted');
    const updated: Publisher = {
      ...pub,
      status: currentActive ? 'inactive' : 'active',
      active: !currentActive,
      is_active: !currentActive,
    };
    updatePublisher(updated);
    showToast(`${getPublisherDisplayName(pub)} marcado como ${!currentActive ? 'Activo' : 'Inactivo'}`, 'success');
  };

  // Exportar publicadores a CSV
  const handleExportCsv = () => {
    try {
      exportPublishersToCsv(publishers.filter((p) => p.status !== 'deleted'), {
        congregationName: settings.congregationName || 'Congregacion',
        groupNameMap: groupMap,
      });
      showToast('Directorio de publicadores exportado a CSV exitosamente', 'success');
    } catch (err: any) {
      showToast(`Error al exportar: ${err.message}`, 'error');
    }
  };

  // Importar archivo CSV
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parsePublishersCsv(text);
      if (parsed.length === 0) {
        showToast('No se encontraron registros válidos en el archivo CSV', 'error');
        return;
      }

      const confirmed = await confirm({
        title: 'Importar Publicadores',
        message: `Se encontraron ${parsed.length} publicadores en el archivo. ¿Deseas agregarlos al catálogo de la congregación?`,
        confirmText: `Importar ${parsed.length} Publicadores`,
        type: 'info',
      });

      if (confirmed) {
        const count = importPublishersBatch(parsed);
        showToast(`¡Se procesaron ${count} publicadores sin duplicados!`, 'success');
      }
    } catch (err: any) {
      showToast(`Error al procesar el archivo: ${err.message}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (data: Partial<Publisher>) => {
    const fullName =
      data.full_name ||
      [data.first_name, data.middle_name, data.last_name, data.second_last_name]
        .filter(Boolean)
        .join(' ') ||
      data.name ||
      '';
    const existingById = publishers.find(
      (p) => (data.id && p.id === data.id) || (data.nid && p.nid && p.nid === data.nid)
    );
    const immutableCode = ensureImmutablePublisherCode(existingById || data);
    const resolvedId = existingById?.id || data.id || immutableCode;
    const resolvedNid = existingById?.nid || existingById?.id || data.nid || resolvedId;

    const isUnassignedGroup = data.id_grupo === null || data.groupNumber === 0;
    const groupNum = isUnassignedGroup
      ? 0
      : data.id_grupo
      ? parseInt(String(data.id_grupo), 10)
      : data.groupNumber || 1;
    const isFemale = data.gender === 'female' || data.gender === 'hermana';

    const currentAssignments = data.assignments || {};
    const hasStudentAssignment = Boolean(
      currentAssignments.student ||
        currentAssignments.conversations ||
        currentAssignments.return_visits ||
        currentAssignments.disciples ||
        currentAssignments.beliefs ||
        currentAssignments.talk_student
    );

    const rolesSynced = {
      ...(data.roles || {}),
      vym_presidente: !!currentAssignments.chairman,
      vym_consejero_aux: !!currentAssignments.aux_counselor,
      vym_oracion: !!currentAssignments.prayers,
      vym_tesoros_discurso: !!currentAssignments.talk,
      vym_tesoros_perlas: !!currentAssignments.gems,
      vym_tesoros_lectura: !!currentAssignments.reading,
      vym_maestros_titular: hasStudentAssignment,
      vym_maestros_ayudante: !!currentAssignments.assistant_student,
      vym_vida_partes: !!currentAssignments.living_parts,
      vym_estudio_conductor: !!currentAssignments.bible_study,
      vym_estudio_lector: !!currentAssignments.reader_living,
      fds_presidente: !!currentAssignments.weekend_chairman,
      fds_atalaya_lector: !!currentAssignments.watchtower_reader,
      fds_oracion: !!currentAssignments.final_prayer,
      deber_acomodador: !!currentAssignments.attendants_midweek || !!currentAssignments.attendants_weekend,
      deber_seguridad: !!(data.roles as any)?.deber_seguridad,
      deber_audio: !!currentAssignments.audio_video_midweek || !!currentAssignments.audio_video_weekend,
      deber_video: !!currentAssignments.audio_video_midweek || !!currentAssignments.audio_video_weekend,
      deber_microfonos: !!currentAssignments.microphones_midweek || !!currentAssignments.microphones_weekend,
      deber_plataforma: !!currentAssignments.platform_task_midweek || !!currentAssignments.platform_task_weekend,
      deber_zoom: !!(data.roles as any)?.deber_zoom,
    };

    const isPubActive =
      data.status === 'deleted'
        ? false
        : data.is_active !== undefined
        ? Boolean(data.is_active)
        : data.status !== 'inactive' && data.active !== false;
    const resolvedStatus =
      data.status === 'deleted' ? 'deleted' : isPubActive ? 'active' : 'inactive';

    const resolvedPioneerType = data.pioneer_type || 'none';
    const resolvedPioneerStatus =
      resolvedPioneerType === 'regular'
        ? 'regular'
        : resolvedPioneerType === 'auxiliary' || resolvedPioneerType === 'auxiliary_continuous'
        ? 'auxiliar_continuo'
        : 'ninguno';

    const rawAbsences = data.ausencias || data.absences || [];
    const normalizedAbsences = rawAbsences.map((a: any) => ({
      ...a,
      id: a.id || `abs-${Date.now()}`,
      start_date: a.start_date || a.startDate || '',
      end_date: a.end_date || a.endDate || '',
      startDate: a.startDate || a.start_date || '',
      endDate: a.endDate || a.end_date || '',
      reason: a.reason || '',
    }));

    const emergencyList = data.emergency_contacts || [];
    const primaryEmName = emergencyList[0]?.name || data.emergencyContactName || '';
    const primaryEmPhone = emergencyList[0]?.phone || data.emergencyContactPhone || '';
    const lastVisit = (data as any).last_shepherding_visit || data.last_visit_date || '';

    const targetPayload: Publisher = {
      ...(data as any),
      id: resolvedId,
      nid: resolvedNid,
      publisherCode: immutableCode,
      name: fullName,
      full_name: fullName,
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      second_last_name: data.second_last_name,
      gender: isFemale ? 'hermana' : 'hermano',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      birth_date: data.birth_date || data.birthDate || '',
      birthDate: data.birth_date || data.birthDate || '',
      baptism_date: data.baptism_date || data.baptismDate || '',
      baptismDate: data.baptism_date || data.baptismDate || '',
      role: data.role || 'publisher',
      privilege:
        data.role === 'elder'
          ? 'anciano'
          : data.role === 'servant'
          ? 'siervo_ministerial'
          : data.role === 'unbaptized'
          ? 'publicador_no_bautizado'
          : resolvedPioneerType === 'regular'
          ? 'precursor_regular'
          : resolvedPioneerType === 'auxiliary' || resolvedPioneerType === 'auxiliary_continuous'
          ? 'precursor_auxiliar'
          : (data.privilege as any) || 'publicador_bautizado',
      groupNumber: groupNum,
      id_grupo: isUnassignedGroup ? null : String(groupNum),
      active: isPubActive,
      status: resolvedStatus,
      is_active: isPubActive,
      notes: data.notes || data.spiritual_notes || '',
      spiritual_notes: data.spiritual_notes || data.notes || '',
      absences: normalizedAbsences,
      ausencias: normalizedAbsences,
      assignments: currentAssignments,
      assignment_metadata: data.assignment_metadata || {},
      s21_records: data.s21_records || {},
      emergency_contacts: emergencyList,
      emergencyContactName: primaryEmName,
      emergencyContactPhone: primaryEmPhone,
      roles: rolesSynced,
      is_cart_approved: Boolean(currentAssignments.public_witnessing || data.is_cart_approved),
      is_elderly: !!data.is_elderly,
      is_infirm: !!data.is_infirm,
      is_deaf: !!data.is_deaf,
      is_blind: !!data.is_blind,
      is_imprisoned: !!data.is_imprisoned,
      is_head_of_household: !!data.is_head_of_household,
      is_child: !!data.is_child,
      is_moved: !!data.is_moved,
      pioneer_type: resolvedPioneerType,
      pioneerStatus: resolvedPioneerStatus,
      is_anointed: Boolean(data.is_anointed || data.hope === 'ungido'),
      hope: data.is_anointed || data.hope === 'ungido' ? 'ungido' : 'otras_ovejas',
      has_key: !!data.has_key,
      reports_to_branch: !!data.reports_to_branch,
      is_disfellowshipped: !!data.is_disfellowshipped,
      is_reinstated: !!data.is_reinstated,
      group_responsibility: data.group_responsibility || 'miembro',
      last_visit_date: lastVisit,
      last_shepherding_visit: lastVisit,
      printed_guide: !!data.printed_guide,
      large_print: !!(data as any).large_print,
      languages: Array.isArray(data.languages) ? data.languages : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      address_reference: (data as any).address_reference || '',
      maps_url: (data as any).maps_url || '',
      vehicle_seats: (data as any).vehicle_seats ?? (data.has_vehicle ? 4 : 0),
      appointment_date: (data as any).appointment_date || '',
      pioneer_school_date: (data as any).pioneer_school_date || '',
      shepherding_elders: (data as any).shepherding_elders || '',
      pastoral_priority: (data as any).pastoral_priority || 'normal',
      is_reproved: !!(data as any).is_reproved,
      dpa_copy_on_file: !!(data as any).dpa_copy_on_file,
      zoom_regular: !!(data as any).zoom_regular,
      special_seating: !!(data as any).special_seating,
      moved_congregation_name: (data as any).moved_congregation_name || '',
      moved_date: (data as any).moved_date || '',
      letter_of_introduction_sent: !!(data as any).letter_of_introduction_sent,
    };

    try {
      const existing = publishers.find((p) => p.id === targetPayload.id);
      if (existing) {
        // Registrar auditoría de cambios en navegador
        const trackedFields: (keyof Publisher)[] = [
          'full_name',
          'role',
          'pioneer_type',
          'id_grupo',
          'group_responsibility',
          'baptism_date',
          'publisher_date',
          'is_active',
          'has_dpa',
          'phone',
          'address',
          'is_disfellowshipped',
          'is_reinstated',
          'is_reproved',
          'is_moved',
        ];
        const newLogs: any[] = [];
        const nowIso = new Date().toISOString();
        trackedFields.forEach((f, idx) => {
          const oldVal = existing[f] !== undefined && existing[f] !== null ? String(existing[f]) : '';
          const newVal =
            targetPayload[f] !== undefined && targetPayload[f] !== null
              ? String(targetPayload[f])
              : '';
          if (oldVal !== newVal) {
            newLogs.push({
              id: String(Date.now() + idx),
              nid: resolvedNid,
              campo: String(f),
              valor_ant: oldVal,
              valor_new: newVal,
              cambiado_por: 'Secretaría',
              fecha: nowIso,
            });
          }
        });
        if (newLogs.length > 0) {
          const prevHistory = Array.isArray(targetPayload.change_history)
            ? targetPayload.change_history
            : Array.isArray(existing.change_history)
            ? existing.change_history
            : [];
          const combinedHistory = [...newLogs, ...prevHistory].slice(0, 100);
          targetPayload.change_history = combinedHistory;
          try {
            localStorage.setItem(
              `kongre_pub_history_${resolvedNid}`,
              JSON.stringify(combinedHistory)
            );
          } catch {
            // ignore storage errors
          }
        }
        updatePublisher(targetPayload);
        showToast('¡Cambios guardados con éxito!', 'success');
      } else {
        const nameMatch = publishers.find((p) =>
          areNamesEquivalent(p.name || (p as any).full_name, targetPayload.name)
        );
        if (nameMatch) {
          updatePublisher(mergePublisherData(nameMatch, targetPayload));
          showToast(
            `¡Se actualizaron los datos existentes de ${targetPayload.name || 'publicador'}!`,
            'success'
          );
        } else {
          addPublisher(targetPayload);
          showToast('¡Nuevo publicador creado con éxito!', 'success');
        }
      }

      // 1. Sincronizar responsabilidad de grupo (Capitán / Auxiliar) con preachingGroups
      if (groupNum > 0 && preachingGroups.length > 0 && updatePreachingGroup) {
        const targetGroup = preachingGroups.find((g) => g.number === groupNum);
        if (targetGroup) {
          if (
            targetPayload.group_responsibility === 'overseer' &&
            targetGroup.overseerId !== targetPayload.id
          ) {
            updatePreachingGroup({ ...targetGroup, overseerId: targetPayload.id });
          } else if (
            targetPayload.group_responsibility === 'assistant' &&
            targetGroup.assistantId !== targetPayload.id
          ) {
            updatePreachingGroup({ ...targetGroup, assistantId: targetPayload.id });
          }
        }
      }

      // 2. Sincronizar s21_records editados en el editor con monthlyReports de la congregación
      if (targetPayload.s21_records && updateMonthlyReport) {
        for (const [yrKey, monthsArr] of Object.entries(targetPayload.s21_records)) {
          if (!Array.isArray(monthsArr) || monthsArr.length !== 12) continue;
          const parsedEndYear = parseInt(yrKey.split('-').pop() || yrKey, 10);
          if (isNaN(parsedEndYear)) continue;
          const startYear = parsedEndYear - 1;
          const monthIsoKeys = [
            `${startYear}-09`,
            `${startYear}-10`,
            `${startYear}-11`,
            `${startYear}-12`,
            `${parsedEndYear}-01`,
            `${parsedEndYear}-02`,
            `${parsedEndYear}-03`,
            `${parsedEndYear}-04`,
            `${parsedEndYear}-05`,
            `${parsedEndYear}-06`,
            `${parsedEndYear}-07`,
            `${parsedEndYear}-08`,
          ];

          monthsArr.forEach((mRec: any, idx: number) => {
            if (!mRec) return;
            const mKey = monthIsoKeys[idx];
            const existingRep = monthlyReports.find(
              (r) => r.publisherId === targetPayload.id && r.month === mKey
            );
            const hasActivity = Boolean(
              mRec.participated || mRec.hours > 0 || mRec.bible_studies > 0 || mRec.comments
            );
            if (hasActivity || existingRep) {
              updateMonthlyReport({
                id: existingRep?.id || `rep-${targetPayload.id}-${mKey}`,
                publisherId: targetPayload.id,
                month: mKey,
                participated: Boolean(mRec.participated || mRec.hours > 0),
                hours: Number(mRec.hours || 0),
                bibleStudies: Number(mRec.bible_studies || 0),
                isAuxiliaryPioneer: Boolean(mRec.auxiliary_pioneer),
                isPioneer: resolvedPioneerStatus === 'regular',
                notes: mRec.comments || '',
                reportedAt: existingRep?.reportedAt || new Date().toISOString().slice(0, 10),
              });
            }
          });
        }
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
      <div className="animate-in fade-in duration-300">
        <PublisherEditor
          key={editingPublisher?.id || 'new'}
          initialTab={editorInitialTab}
          publisher={editingPublisher || {}}
          onSave={handleSave}
          onCancel={() => {
            setViewMode('list');
            setEditingPublisher(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Barra de Acciones de Publicadores */}
      <div className="kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Input oculto para subir archivo CSV */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".csv"
          className="hidden"
        />

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!canEditPublishers}
            title="Importar publicadores desde archivo CSV"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-all border border-zinc-200/80 dark:border-white/10 cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
          >
            <Upload size={14} /> <span>Importar CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            title="Exportar catálogo completo a formato Excel CSV"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-all border border-zinc-200/80 dark:border-white/10 cursor-pointer active:scale-95 shadow-xs"
          >
            <Download size={14} /> <span>Exportar Excel</span>
          </button>

          {duplicateCount > 0 && canEditPublishers && (
            <button
              onClick={() => {
                const { mergedCount } = cleanDuplicatePublishers();
                showToast(`¡Se fusionaron ${mergedCount} publicador(es) duplicado(s) exitosamente!`, 'success');
              }}
              title="Fusionar publicadores duplicados detectados"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold transition-all border border-amber-500/30 cursor-pointer active:scale-95 shadow-xs"
            >
              <Sparkles size={14} /> <span>Fusionar <span className="font-mono tabular-nums">({duplicateCount})</span></span>
            </button>
          )}
        </div>

        <button
          disabled={!canEditPublishers}
          onClick={() => {
            setEditingPublisher(null);
            setViewMode('editor');
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-95"
        >
          <UserPlus size={15} /> <span>Nuevo Publicador</span>
        </button>
      </div>

      {/* Banner de alerta de duplicados detectados */}
      {duplicateCount > 0 && canEditPublishers && (
        <div className="kg-glass-surface rounded-2xl p-4 border border-amber-500/30 dark:border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">
                Se {duplicateCount === 1 ? 'ha detectado 1 publicador duplicado' : `han detectado ${duplicateCount} publicadores duplicados`} o con variantes de tildes
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Puedes fusionar y unificar los registros sin perder las asignaciones de reuniones ni privilegios.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const { mergedCount } = cleanDuplicatePublishers();
              showToast(`¡Se fusionaron ${mergedCount} registro(s) duplicado(s) exitosamente!`, 'success');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
          >
            <Sparkles size={14} /> Unificar Duplicados Ahora
          </button>
        </div>
      )}

      {/* Panel de Métricas Rápidas Teocráticas (Compacto y Deslizable en Móvil) */}
      <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
          <div
            onClick={() => {
              setRoleFilter('all');
              setGenderFilter('all');
              setStatusFilter('active');
            }}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              roleFilter === 'all' && genderFilter === 'all' && statusFilter === 'active'
                ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Activos</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <UserCheck size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.active}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">de <span className="font-mono tabular-nums">{stats.total}</span> reg.</div>
          </div>

          <div
            onClick={() => setRoleFilter(roleFilter === 'elder' ? 'all' : 'elder')}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              roleFilter === 'elder'
                ? 'border-indigo-500/60 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-indigo-400/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ancianos</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                <Shield size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.elders}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">cuerpo ancianos</div>
          </div>

          <div
            onClick={() => setRoleFilter(roleFilter === 'servant' ? 'all' : 'servant')}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              roleFilter === 'servant'
                ? 'border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-amber-400/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Siervos</span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <Award size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.servants}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">ministeriales</div>
          </div>

          <div
            onClick={() => setRoleFilter(roleFilter === 'pioneer' ? 'all' : 'pioneer')}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              roleFilter === 'pioneer'
                ? 'border-teal-500/60 ring-2 ring-teal-500/20 bg-teal-50/30 dark:bg-teal-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-teal-400/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Precursores</span>
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center">
                <Sparkles size={14} className="text-teal-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.pioneers}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">regulares/aux.</div>
          </div>

          <div
            onClick={() => setGenderFilter(genderFilter === 'brothers' ? 'all' : 'brothers')}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              genderFilter === 'brothers'
                ? 'border-blue-500/60 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-blue-400/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hermanos</span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <Users size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.brothers}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">varones</div>
          </div>

          <div
            onClick={() => setGenderFilter(genderFilter === 'sisters' ? 'all' : 'sisters')}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              genderFilter === 'sisters'
                ? 'border-pink-500/60 ring-2 ring-pink-500/20 bg-pink-50/30 dark:bg-pink-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-pink-400/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hermanas</span>
              <div className="w-6 h-6 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center">
                <Users size={14} className="text-pink-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.sisters}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">mujeres</div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            className={`kg-card-bento kg-sheen-top p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all group shrink-0 min-w-[115px] sm:min-w-0 flex-1 active:scale-[0.98] ${
              statusFilter === 'absent'
                ? 'border-rose-500/60 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/30'
                : 'border-zinc-200/80 dark:border-white/10 hover:border-rose-400/40 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ausencias</span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center">
                <Plane size={14} className="text-rose-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1.5 leading-tight">{stats.absentToday}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-0.5 truncate">fuera hoy</div>
          </div>
        </div>

        {/* Barra de Filtros, Búsqueda y Modos de Vista */}
        <div className="kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Input de Búsqueda */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400" />
              <input
                className="w-full pl-10 pr-16 py-2.5 rounded-2xl bg-zinc-100/70 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                placeholder="Buscar por nombre, ID único, teléfono o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de Grupo */}
            <div className="w-full sm:w-52 shrink-0">
              <Select
                options={groupOptions}
                value={groupFilter}
                onChange={setGroupFilter}
                buttonClassName="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-zinc-100/70 text-zinc-700 hover:bg-zinc-200/80 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 cursor-pointer transition-all"
              />
            </div>

            {/* Selector de Asignaciones */}
            <div className="w-full sm:w-56 shrink-0">
              <Select
                options={assignmentFilterOptions}
                value={assignmentFilter}
                onChange={setAssignmentFilter}
                buttonClassName="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-zinc-100/70 text-zinc-700 hover:bg-zinc-200/80 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10 cursor-pointer transition-all"
              />
            </div>

            {/* Switch de Modo Tarjetas / Modo Tabla */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-2xl shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setDisplayLayout('cards')}
                title="Vista en Tarjetas"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  displayLayout === 'cards'
                    ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-zinc-200/80 dark:border-white/10 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
              <button
                onClick={() => setDisplayLayout('table')}
                title="Vista en Tabla"
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  displayLayout === 'table'
                    ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-zinc-200/80 dark:border-white/10 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                <TableIcon size={15} />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>

          {/* Filtros secundarios: Privilegio, Género, Estado */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pt-3 border-t border-zinc-200/60 dark:border-white/10 text-xs touch-pan-x">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter size={12} /> Rol:
            </span>

            {[
              { id: 'all', label: 'Todos' },
              { id: 'elder', label: 'Ancianos' },
              { id: 'servant', label: 'Siervos' },
              { id: 'pioneer', label: 'Precursores' },
              { id: 'publisher', label: 'Publicadores' },
              { id: 'unbaptized', label: 'No Bautizados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as RoleFilter)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-zinc-100/70 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 mx-1 hidden sm:block" />

            {/* Filtro género */}
            {[
              { id: 'all', label: 'Todos' },
              { id: 'brothers', label: 'Hermanos' },
              { id: 'sisters', label: 'Hermanas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGenderFilter(tab.id as GenderFilter)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  genderFilter === tab.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 mx-1 hidden sm:block" />

            {/* Papelera */}
            <button
              onClick={() => setRoleFilter(roleFilter === 'trash' ? 'all' : 'trash')}
              className={`ml-auto px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                roleFilter === 'trash'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
              }`}
            >
              <Trash2 size={13} />
              Papelera {stats.trash > 0 && <span className="font-mono tabular-nums">({stats.trash})</span>}
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: VISTA DE TARJETAS O TABLA */}
        {displayLayout === 'cards' ? (
          /* VISTA DE TARJETAS (Visual Cards Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAndFilteredPublishers.map((p) => {
              const isFemale = isPublisherFemale(p);
              const displayName = getPublisherDisplayName(p);
              const privilegeOrRole = p.role || p.privilege;
              const groupName = getPublisherGroupName(p);
              const isDeleted = p.status === 'deleted';
              const isActive = p.status === 'active' || (p.active && !isDeleted);
              const isAbsent = isPublisherCurrentlyAbsent(p);
              const gid = getPublisherGroupId(p);

              // Asignaciones
              const assignmentKeys = Object.entries(p.assignments || {})
                .filter(([_, val]) => !!val)
                .map(([k]) => k);

              const cleanPhone = (p.phone || '').replace(/\D/g, '');

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setEditingPublisher(p);
                    setEditorInitialTab('all');
                    setViewMode('editor');
                  }}
                  className="kg-card-bento kg-sheen-top rounded-3xl p-4 sm:p-5 border border-zinc-200/80 dark:border-white/10 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col justify-between group relative"
                >
                  {/* Cabecera de la tarjeta: Avatar degradado, Nombre, Privilegio */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Apple-style Gradient Avatar */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md border relative transition-transform duration-200 group-hover:scale-105 ${
                            isFemale
                              ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white border-white/20 shadow-rose-500/25'
                              : 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-500 text-white border-white/20 shadow-indigo-500/25'
                          }`}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                          </svg>

                          {/* Indicador de activo / inactivo con halo */}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#121216] ${
                              isActive ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-zinc-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {displayName}
                            </h4>
                            <span
                              title="ID Único Inmutable del Publicador"
                              className="shrink-0 px-1.5 py-0.5 rounded-lg text-[9px] font-mono tabular-nums font-bold bg-zinc-100/80 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10"
                            >
                              {ensureImmutablePublisherCode(p)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPublisher(p);
                                setEditorInitialTab('spiritual');
                                setViewMode('editor');
                              }}
                              title="Abrir tarjeta de Estado Espiritual"
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:opacity-85 transition-opacity ${getBadgeColor(
                                privilegeOrRole,
                                p
                              )}`}
                            >
                              {getBadgeLabel(privilegeOrRole, p)}
                            </span>

                            {/* Insignia de DPA */}
                            {p.has_dpa !== undefined && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPublisher(p);
                                  setEditorInitialTab('medical');
                                  setViewMode('editor');
                                }}
                                title={p.has_dpa ? 'DPA Vigente firmado • Clic para ver tarjeta' : 'Sin DPA o no registrado • Clic para ver tarjeta'}
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border cursor-pointer hover:opacity-85 transition-opacity ${
                                  p.has_dpa
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                                }`}
                              >
                                {p.has_dpa ? 'DPA ✓' : 'Sin DPA'}
                              </span>
                            )}

                            {/* Edad */}
                            {(() => {
                              const rawB = p.birth_date || p.birthDate;
                              if (!rawB) return null;
                              try {
                                const b = new Date(rawB + 'T00:00:00');
                                if (isNaN(b.getTime())) return null;
                                const today = new Date();
                                let a = today.getFullYear() - b.getFullYear();
                                const mDiff = today.getMonth() - b.getMonth();
                                if (mDiff < 0 || (mDiff === 0 && today.getDate() < b.getDate())) a--;
                                if (a >= 0) {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono tabular-nums font-semibold bg-zinc-100/80 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10">
                                      {a} años
                                    </span>
                                  );
                                }
                              } catch {}
                              return null;
                            })()}

                            {p.marital_status && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30 capitalize">
                                {p.marital_status}
                              </span>
                            )}

                            {isAbsent && (
                              <span
                                title="Ausencia programada vigente"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              >
                                <Plane size={9} /> Fuera
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selector de Grupo Rápido y Datos de Contacto */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPublisher(p);
                        setEditorInitialTab('contact');
                        setViewMode('editor');
                      }}
                      title="Abrir tarjeta de Contacto y Ubicación"
                      className="space-y-2 p-3 my-2 text-xs rounded-2xl bg-zinc-100/60 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400">Grupo:</span>
                        <div onClick={(e) => e.stopPropagation()} className="w-36">
                          <Select
                            options={groupOptions.filter((o) => o.value !== 'all')}
                            value={gid || 'unassigned'}
                            onChange={(val) => handleQuickGroupChange(p, val)}
                            disabled={!canEditPublishers}
                            buttonClassName="w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white dark:bg-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/15 border border-zinc-200/80 dark:border-white/10 transition-all"
                          />
                        </div>
                      </div>

                      {p.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400">Teléfono:</span>
                          <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">{p.phone}</span>
                        </div>
                      )}

                      {p.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400">Correo:</span>
                          <span className="truncate max-w-[170px] text-zinc-600 dark:text-zinc-300 font-medium">{p.email}</span>
                        </div>
                      )}

                      {(p.address || p.city) && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400">Domicilio:</span>
                          <span className="truncate max-w-[170px] text-zinc-600 dark:text-zinc-300 text-[11px]">
                            {[p.address, p.neighborhood, p.city].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resumen de Asignaciones Teocráticas */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPublisher(p);
                        setEditorInitialTab('assignments');
                        setViewMode('editor');
                      }}
                      title="Abrir tarjeta de Asignaciones"
                      className="pt-2 cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Habilitado para:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {assignmentKeys.length > 0 ? (
                          <>
                            {assignmentKeys.slice(0, 3).map((a) => {
                              let label = a;
                              for (const group of ASSIGNMENT_GROUPS) {
                                const item = group.items.find((i) => i.id === a);
                                if (item) {
                                  label = (item as any).shortLabel || item.label;
                                  break;
                                }
                              }
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
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-zinc-100/80 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10"
                                >
                                  {label}
                                </span>
                              );
                            })}
                            {assignmentKeys.length > 3 && (
                              <span className="text-[10px] font-mono tabular-nums font-bold text-zinc-400 dark:text-zinc-400 self-center">
                                +{assignmentKeys.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-400 italic">Sin asignaciones configuradas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas Inferiores (Llamada, WhatsApp, Editar, Activo, Eliminar) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between gap-1 pt-3.5 mt-3.5 border-t border-zinc-200/60 dark:border-white/10"
                  >
                    <div className="flex items-center gap-1.5">
                      {cleanPhone && (
                        <>
                          <a
                            href={`tel:${cleanPhone}`}
                            title={`Llamar a ${displayName}`}
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:text-zinc-400 dark:hover:text-indigo-400 transition-all hover:scale-110 active:scale-90"
                          >
                            <Phone size={14} />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Enviar WhatsApp a ${displayName}`}
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:text-zinc-400 dark:hover:text-emerald-400 transition-all hover:scale-110 active:scale-90"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </>
                      )}

                      <button
                        onClick={() => handleQuickToggleActive(p)}
                        disabled={!canEditPublishers}
                        title={isActive ? 'Marcar como inactivo' : 'Marcar como activo'}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10'
                        }`}
                      >
                        {isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {isDeleted ? (
                        <>
                          <button
                            disabled={!canEditPublishers}
                            onClick={() => handleRestore(p.id)}
                            title="Restaurar publicador"
                            className="p-2 rounded-xl transition-all hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-500/10 dark:text-emerald-400 cursor-pointer hover:scale-110 active:scale-90"
                          >
                            <RefreshCcw size={14} />
                          </button>
                          <button
                            disabled={!canEditPublishers}
                            onClick={() => handleDelete(p.id)}
                            title="Eliminar definitivamente"
                            className="p-2 rounded-xl transition-all hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-500/10 dark:text-rose-400 cursor-pointer hover:scale-110 active:scale-90"
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
                              setEditorInitialTab('all');
                              setViewMode('editor');
                            }}
                            title="Editar ficha teocrática"
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl transition-all hover:bg-indigo-50 text-zinc-500 hover:text-indigo-600 dark:hover:bg-white/10 dark:text-zinc-400 dark:hover:text-indigo-400 cursor-pointer hover:scale-110 active:scale-90"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            disabled={!canEditPublishers}
                            onClick={() => handleDelete(p.id)}
                            title="Mover a papelera"
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl transition-all hover:bg-rose-50 text-zinc-400 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:text-zinc-400 dark:hover:text-rose-400 cursor-pointer hover:scale-110 active:scale-90"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedAndFilteredPublishers.length === 0 && (
              <div className="col-span-full py-16 text-center kg-card-bento kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl shadow-sm">
                <Users size={36} className="mx-auto mb-2 text-zinc-400 opacity-60" />
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white">No se encontraron publicadores</h4>
                <p className="text-xs text-zinc-400 dark:text-zinc-400 mt-1">
                  Ajusta los filtros de búsqueda o agrega un nuevo publicador a la lista.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* VISTA DE TABLA DETALLADA (Detailed Data Table) */
          <div className="kg-glass-surface kg-sheen-top rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-white/10 shadow-sm">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#18181F] transition-colors select-none text-zinc-600 dark:text-[#A1A1AA]"
                    >
                      <div className="flex items-center gap-1">
                        Publicador
                        {sortField === 'name' &&
                          (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('privilege')}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#18181F] transition-colors select-none text-zinc-600 dark:text-[#A1A1AA]"
                    >
                      <div className="flex items-center gap-1">
                        Privilegio
                        {sortField === 'privilege' &&
                          (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                    </th>
                    <th className="text-zinc-600 dark:text-[#A1A1AA]">Contacto</th>
                    <th
                      onClick={() => handleSort('group')}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#18181F] transition-colors select-none text-zinc-600 dark:text-[#A1A1AA]"
                    >
                      <div className="flex items-center gap-1">
                        Grupo
                        {sortField === 'group' &&
                          (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </div>
                    </th>
                    <th className="text-zinc-600 dark:text-[#A1A1AA]">Asignaciones Habilitadas</th>
                    <th className="text-zinc-600 dark:text-[#A1A1AA]">Estado</th>
                    <th style={{ width: 110, textAlign: 'center' }} className="text-zinc-600 dark:text-[#A1A1AA]">Acciones</th>
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
                    const isAbsent = isPublisherCurrentlyAbsent(p);
                    const gid = getPublisherGroupId(p);
                    const cleanPhone = (p.phone || '').replace(/\D/g, '');

                    const assignmentKeys = Object.entries(p.assignments || {})
                      .filter(([_, val]) => !!val)
                      .map(([k]) => k);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/70 transition-colors cursor-pointer border-b border-zinc-100 dark:border-[#27272A]"
                        onClick={() => {
                          setEditingPublisher(p);
                          setEditorInitialTab('all');
                          setViewMode('editor');
                        }}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 shadow-xs relative"
                              style={{
                                background: isFemale
                                  ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                                  : 'linear-gradient(135deg, #6556F0, #3b82f6)',
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

                              {isAbsent && (
                                <span
                                  title="Ausencia programada"
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                                >
                                  <Plane size={8} />
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                                {displayName}
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums font-bold bg-zinc-100 dark:bg-[#18181F] text-zinc-500 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A]">
                                  {ensureImmutablePublisherCode(p)}
                                </span>
                                {isAbsent && (
                                  <span className="text-[10px] text-rose-500 font-semibold">(Ausente)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {p.email && (
                                  <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA]">{p.email}</span>
                                )}
                                {p.has_dpa !== undefined && (
                                  <span
                                    title={p.has_dpa ? 'DPA Vigente' : 'Sin DPA'}
                                    className={`px-1 rounded text-[8px] font-bold ${
                                      p.has_dpa
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    }`}
                                  >
                                    {p.has_dpa ? 'DPA ✓' : 'Sin DPA'}
                                  </span>
                                )}
                                {(() => {
                                  const rawB = p.birth_date || p.birthDate;
                                  if (!rawB) return null;
                                  try {
                                    const b = new Date(rawB + 'T00:00:00');
                                    if (isNaN(b.getTime())) return null;
                                    const today = new Date();
                                    let a = today.getFullYear() - b.getFullYear();
                                    const mDiff = today.getMonth() - b.getMonth();
                                    if (mDiff < 0 || (mDiff === 0 && today.getDate() < b.getDate())) a--;
                                    if (a >= 0) {
                                      return (
                                        <span className="text-[9px] font-mono tabular-nums text-zinc-400 dark:text-[#A1A1AA]">
                                          • {a} años
                                        </span>
                                      );
                                    }
                                  } catch {}
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeColor(
                              privilegeOrRole,
                              p
                            )}`}
                          >
                            {getBadgeLabel(privilegeOrRole, p)}
                          </span>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono tabular-nums text-zinc-700 dark:text-[#F4F4F5]">{p.phone || '—'}</span>
                            {cleanPhone && (
                              <div className="flex items-center gap-1">
                                <a
                                  href={`tel:${cleanPhone}`}
                                  title="Llamar"
                                  className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                                >
                                  <Phone size={13} />
                                </a>
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp"
                                  className="p-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                                >
                                  <MessageCircle size={13} />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="w-32">
                            <Select
                              options={groupOptions.filter((o) => o.value !== 'all')}
                              value={gid || 'unassigned'}
                              onChange={(val) => handleQuickGroupChange(p, val)}
                              disabled={!canEditPublishers}
                              buttonClassName="w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200/60 dark:border-[#27272A]"
                            />
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-wrap gap-1 max-w-xs">
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
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200/60 dark:border-[#27272A]"
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                                {assignmentKeys.length > 2 && (
                                  <span className="text-[10px] font-mono tabular-nums font-semibold text-zinc-400 dark:text-[#A1A1AA] self-center">
                                    +{assignmentKeys.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] italic">—</span>
                            )}
                          </div>
                        </td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleQuickToggleActive(p)}
                            disabled={!canEditPublishers}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer ${
                              isActive ? 'badge-active' : 'badge-inactive'
                            }`}
                          >
                            {isActive ? 'Activo' : 'Inactivo'}
                          </button>
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
                                  className="p-1.5 rounded-lg transition-colors hover:bg-indigo-50 text-zinc-400 hover:text-indigo-600 dark:hover:bg-[#27272A] dark:text-[#A1A1AA] dark:hover:text-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  disabled={!canEditPublishers}
                                  onClick={() => handleDelete(p.id)}
                                  title="Mover a papelera"
                                  className="p-1.5 rounded-lg transition-colors hover:bg-rose-50 text-zinc-400 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:text-[#A1A1AA] dark:hover:text-rose-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
                        <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-[#A1A1AA]">
                          <Users size={32} className="mb-2 opacity-50" />
                          <p className="text-sm font-semibold">No se encontraron publicadores</p>
                          <p className="text-xs text-zinc-400 dark:text-[#A1A1AA] mt-0.5">
                            {searchTerm
                              ? 'Prueba con otro término de búsqueda'
                              : 'Comienza creando un nuevo publicador o ajusta los filtros'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
};
