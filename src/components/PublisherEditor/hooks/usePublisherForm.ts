import { useState, useEffect, useCallback, useMemo } from 'react';
import { Publisher } from '../../../types';

const deterministicStringify = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(deterministicStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `"${k}":${deterministicStringify(obj[k])}`).join(',')}}`;
};

const mapRolesToAssignments = (roles: any = {}, existingAssignments: any = {}): Record<string, boolean> => {
  const assignments: Record<string, boolean> = { ...(existingAssignments || {}) };
  if (!roles || typeof roles !== 'object') return assignments;

  // Vida y Ministerio Cristianos (Entre semana)
  if (roles.vym_presidente && assignments.chairman === undefined) assignments.chairman = true;
  if (roles.vym_oracion && assignments.prayers === undefined) assignments.prayers = true;
  if (roles.vym_tesoros_discurso && assignments.talk === undefined) assignments.talk = true;
  if (roles.vym_tesoros_perlas && assignments.gems === undefined) assignments.gems = true;
  if (roles.vym_tesoros_lectura && assignments.reading === undefined) assignments.reading = true;
  if (roles.vym_maestros_titular && assignments.student === undefined) assignments.student = true;
  if (roles.vym_maestros_ayudante && assignments.assistant_student === undefined) assignments.assistant_student = true;
  if (roles.vym_vida_partes && assignments.living_parts === undefined) assignments.living_parts = true;
  if (roles.vym_estudio_conductor && assignments.bible_study === undefined) assignments.bible_study = true;
  if (roles.vym_estudio_lector && assignments.reader_living === undefined) assignments.reader_living = true;

  // Fin de semana
  if (roles.fds_presidente && assignments.weekend_chairman === undefined) assignments.weekend_chairman = true;
  if (roles.fds_atalaya_lector && assignments.watchtower_reader === undefined) assignments.watchtower_reader = true;
  if (roles.fds_oracion && assignments.final_prayer === undefined) assignments.final_prayer = true;

  // Deberes y tareas
  if (roles.deber_acomodador) {
    if (assignments.attendants_midweek === undefined) assignments.attendants_midweek = true;
    if (assignments.attendants_weekend === undefined) assignments.attendants_weekend = true;
  }
  if (roles.deber_audio) {
    if (assignments.audio_video_midweek === undefined) assignments.audio_video_midweek = true;
    if (assignments.audio_video_weekend === undefined) assignments.audio_video_weekend = true;
  }
  if (roles.deber_video) {
    if (assignments.audio_video_midweek === undefined) assignments.audio_video_midweek = true;
    if (assignments.audio_video_weekend === undefined) assignments.audio_video_weekend = true;
  }
  if (roles.deber_microfonos) {
    if (assignments.microphones_midweek === undefined) assignments.microphones_midweek = true;
    if (assignments.microphones_weekend === undefined) assignments.microphones_weekend = true;
  }
  if (roles.deber_plataforma) {
    if (assignments.platform_task_midweek === undefined) assignments.platform_task_midweek = true;
    if (assignments.platform_task_weekend === undefined) assignments.platform_task_weekend = true;
  }
  if (roles.deber_mantenimiento || roles.mantenimiento) {
    if (assignments.maintenance === undefined) assignments.maintenance = true;
  }
  if (roles.predicacion_publica || roles.carritos) {
    if (assignments.public_witnessing === undefined) assignments.public_witnessing = true;
  }

  return assignments;
};

const normalizePublisher = (initial: any): Publisher => {
  if (!initial || typeof initial !== 'object') initial = {};

  // 1. Resolver nombre completo
  const resolvedFullName = (
    initial.full_name ||
    initial.name ||
    [initial.first_name, initial.middle_name, initial.last_name, initial.second_last_name].filter(Boolean).join(' ') ||
    ''
  ).trim();

  // 2. Extraer primer y segundo nombre / apellidos si faltan
  let firstName = initial.first_name || '';
  let middleName = initial.middle_name || '';
  let lastName = initial.last_name || '';
  let secondLastName = initial.second_last_name || '';

  if (!firstName && !lastName && resolvedFullName) {
    const parts = resolvedFullName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      firstName = parts[0];
    } else if (parts.length === 2) {
      firstName = parts[0];
      lastName = parts[1];
    } else if (parts.length === 3) {
      firstName = parts[0];
      lastName = parts[1];
      secondLastName = parts[2];
    } else if (parts.length >= 4) {
      firstName = parts[0];
      middleName = parts[1];
      lastName = parts[2];
      secondLastName = parts.slice(3).join(' ');
    }
  }

  // 3. Normalizar Género ('hermano' / 'male' -> 'male', 'hermana' / 'female' -> 'female')
  const rawGender = String(initial.gender || '').toLowerCase();
  const normalizedGender: 'male' | 'female' = 
    (rawGender === 'female' || rawGender === 'hermana') ? 'female' : 'male';

  // 4. Normalizar Rol y Privilegio Teocrático
  const rawPriv = String(initial.privilege || '').toLowerCase();
  let resolvedRole = initial.role;
  if (!resolvedRole || resolvedRole === 'publisher') {
    if (rawPriv === 'anciano' || rawPriv === 'elder' || rawPriv === 'super_admin') {
      resolvedRole = 'elder';
    } else if (rawPriv === 'siervo_ministerial' || rawPriv === 'servant') {
      resolvedRole = 'servant';
    } else if (rawPriv === 'publicador_no_bautizado' || rawPriv === 'unbaptized') {
      resolvedRole = 'unbaptized';
    } else if (!resolvedRole) {
      resolvedRole = 'publisher';
    }
  }

  const resolvedPrivilege =
    resolvedRole === 'elder'
      ? 'anciano'
      : resolvedRole === 'servant'
      ? 'siervo_ministerial'
      : resolvedRole === 'unbaptized'
      ? 'publicador_no_bautizado'
      : (initial.privilege || 'publicador_bautizado');

  // 5. Precursorado
  let resolvedPioneerType = initial.pioneer_type || 'none';
  if (resolvedPioneerType === 'none' && initial.pioneerStatus) {
    const pStat = String(initial.pioneerStatus).toLowerCase();
    if (pStat === 'regular') resolvedPioneerType = 'regular';
    else if (pStat === 'auxiliar_continuo') resolvedPioneerType = 'auxiliary_continuous';
    else if (pStat === 'especial') resolvedPioneerType = 'special';
  }

  // 6. Fechas
  const resolvedBirthDate = initial.birth_date || initial.birthDate || '';
  const resolvedBaptismDate = initial.baptism_date || initial.baptismDate || '';

  // 7. Grupo
  const groupNum = initial.groupNumber !== undefined && initial.groupNumber !== null 
    ? initial.groupNumber 
    : (initial.id_grupo ? parseInt(initial.id_grupo, 10) : 1);
  const idGrupo = initial.id_grupo || String(groupNum);

  // 8. Asignaciones y Privilegios
  const resolvedAssignments = mapRolesToAssignments(initial.roles, initial.assignments);

  // 9. Contactos de emergencia
  let emergencyContacts = initial.emergency_contacts || [];
  if (emergencyContacts.length === 0 && (initial.emergencyContactName || initial.emergencyContactPhone)) {
    emergencyContacts = [{
      id: 'em-1',
      name: initial.emergencyContactName || 'Contacto Principal',
      relationship: 'Familiar',
      phone: initial.emergencyContactPhone || '',
      alt_phone: '',
      email: ''
    }];
  }

  // 10. Estados y actividad
  const isActive = initial.is_active !== undefined 
    ? initial.is_active 
    : (initial.active !== undefined ? initial.active : true);
  const status = initial.status || (isActive ? 'active' : 'inactive');

  return {
    ...initial,
    id: initial.id || '',
    nid: initial.nid || initial.id || '',
    name: initial.name || resolvedFullName,
    full_name: resolvedFullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    second_last_name: secondLastName,
    gender: normalizedGender,
    role: resolvedRole,
    privilege: resolvedPrivilege,
    status: status,
    active: isActive,
    is_active: isActive,
    is_regular: initial.is_regular !== undefined ? initial.is_regular : true,
    is_approved: initial.is_approved !== undefined ? initial.is_approved : true,
    groupNumber: groupNum,
    id_grupo: idGrupo,
    birth_date: resolvedBirthDate,
    birthDate: resolvedBirthDate,
    baptism_date: resolvedBaptismDate,
    baptismDate: resolvedBaptismDate,
    pioneer_type: resolvedPioneerType,
    pioneerStatus: initial.pioneerStatus || (resolvedPioneerType === 'regular' ? 'regular' : resolvedPioneerType === 'auxiliary_continuous' ? 'auxiliar_continuo' : 'ninguno'),
    group_responsibility: initial.group_responsibility || 'none',
    publisher_date: initial.publisher_date || '',
    last_visit_date: initial.last_visit_date || '',
    is_anointed: initial.is_anointed !== undefined ? !!initial.is_anointed : initial.hope === 'ungido',
    hope: initial.hope || (initial.is_anointed ? 'ungido' : 'otras_ovejas'),
    has_key: !!initial.has_key,
    reports_to_branch: !!initial.reports_to_branch,
    is_disfellowshipped: !!initial.is_disfellowshipped,
    is_reinstated: !!initial.is_reinstated,
    spiritual_notes: initial.spiritual_notes || initial.notes || '',
    notes: initial.notes || initial.spiritual_notes || '',
    marital_status: initial.marital_status || 'soltero',
    emergency_contacts: emergencyContacts,
    s21_records: initial.s21_records || {},
    ausencias: initial.ausencias || initial.absences || [],
    absences: initial.absences || initial.ausencias || [],
    assignments: resolvedAssignments,
  } as Publisher;
};

export const usePublisherForm = (initialPublisher: Partial<Publisher> = {}) => {
  const [formData, setFormData] = useState<Publisher>(() => normalizePublisher(initialPublisher));

  const [isDirty, setIsDirty] = useState(false);

  // Use stringified initialPublisher to avoid resetting the form on every parent re-render
  const initialPublisherString = JSON.stringify(initialPublisher);

  // Sync form data if initialPublisher prop changes (e.g. after a successful save)
  useEffect(() => {
    const initial = JSON.parse(initialPublisherString);
    setFormData(normalizePublisher(initial));
  }, [initialPublisherString]);

  // Track changes
  useEffect(() => {
    const initial = JSON.parse(initialPublisherString);
    const normalizedInitial = normalizePublisher(initial);

    const hasChanged = deterministicStringify(formData) !== deterministicStringify(normalizedInitial);
    setIsDirty(hasChanged);
  }, [formData, initialPublisherString]);

  const handleChange = useCallback((field: keyof Publisher, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'first_name' || field === 'middle_name' || field === 'last_name' || field === 'second_last_name') {
        const parts = [
          next.first_name || '',
          next.middle_name || '',
          next.last_name || '',
          next.second_last_name || ''
        ].filter(Boolean);
        const joined = parts.join(' ');
        next.full_name = joined;
        next.name = joined;
      }
      if (field === 'full_name') {
        next.name = value;
      }
      if (field === 'name') {
        next.full_name = value;
      }

      // Mutually exclusive flags for Active / Inactive
      if (field === 'is_active' && value === true) {
        next.is_regular = false;
        next.is_inactive = false;
      } else if ((field === 'is_regular' || field === 'is_inactive') && value === true) {
        next.is_active = false;
        if (field === 'is_regular') next.is_inactive = false;
        if (field === 'is_inactive') next.is_regular = false;
      }

      return next;
    });
  }, []);

  const handleAssignmentChange = useCallback((key: string, value: boolean) => {
    setFormData(prev => {
      const nextAssignments = {
        ...(prev.assignments || {}),
        [key]: value
      };

      if (key === 'student' && !value) {
        const teacherIds = ['conversations', 'return_visits', 'disciples', 'beliefs', 'assistant_student', 'talk_student', 'language_group_only'];
        teacherIds.forEach(id => {
          nextAssignments[id] = false;
        });
      }

      return {
        ...prev,
        assignments: nextAssignments
      };
    });
  }, []);

  const handleMetadataChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      assignment_metadata: {
        ...(prev.assignment_metadata || {}),
        [key]: value
      }
    }));
  }, []);

  const handleSectionToggle = useCallback((itemIds: string[], value: boolean) => {
    setFormData(prev => {
      const newAssignments = { ...(prev.assignments || {}) };
      itemIds.forEach(id => {
        newAssignments[id] = value;
      });
      return { ...prev, assignments: newAssignments };
    });
  }, []);

  const handleS21Change = useCallback((selectedServiceYear: string, monthIdx: number, field: string, value: any) => {
    const months = ['septiembre', 'octubre', 'noviembre', 'diciembre', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto'];
    
    setFormData(prev => {
      const currentRecords = prev.s21_records || {};
      const yearData = [...(currentRecords[selectedServiceYear] || Array(12).fill(null).map((_, i) => ({
        month: months[i],
        participated: false,
        bible_studies: 0,
        auxiliary_pioneer: false,
        hours: 0,
        credit: 0,
        late: false,
        comments: ''
      })))];

      yearData[monthIdx] = { ...yearData[monthIdx], [field]: value };

      return {
        ...prev,
        s21_records: {
          ...(prev.s21_records || {}),
          [selectedServiceYear]: yearData
        }
      };
    });
  }, []);

  const addEmergencyContact = useCallback((contact: any, editingId?: string) => {
    setFormData(prev => {
        const contacts = prev.emergency_contacts || [];
        const nextContacts = editingId 
            ? contacts.map(c => c.id === editingId ? contact : c)
            : [...contacts, contact];
            
        return { ...prev, emergency_contacts: nextContacts };
    });
  }, []);

  const deleteEmergencyContact = useCallback((id: string) => {
    setFormData(prev => ({
        ...prev,
        emergency_contacts: (prev.emergency_contacts || []).filter(c => c.id !== id)
    }));
  }, []);

  const handleEmergencyContactChange = useCallback((id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: (prev.emergency_contacts || []).map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  }, []);

  const addAbsence = useCallback((absence: any) => {
    setFormData(prev => ({
      ...prev,
      ausencias: [...(prev.ausencias || []), absence]
    }));
  }, []);

  const deleteAbsence = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      ausencias: (prev.ausencias || []).filter(a => a.id !== id)
    }));
  }, []);

  const togglePrivilege = useCallback((priv: string) => {
    setFormData(prev => {
      const current = prev.privileges || [];
      const next = current.includes(priv)
        ? current.filter(p => p !== priv)
        : [...current, priv];
      return { ...prev, privileges: next };
    });
  }, []);

  const setPrivilegeRole = useCallback((priv: string, role: 'titular' | 'auxiliar' | 'none') => {
    setFormData(prev => {
      const current = prev.privileges || [];
      const titularId = priv;
      const auxId = `${priv}_aux`;
      
      let next = current.filter(p => p !== titularId && p !== auxId);
      
      if (role === 'titular') {
        next.push(titularId);
      } else if (role === 'auxiliar') {
        next.push(auxId);
      }
      
      return { ...prev, privileges: next };
    });
  }, []);

  return {
    formData,
    setFormData,
    isDirty,
    handleChange,
    handleAssignmentChange,
    handleMetadataChange,
    handleSectionToggle,
    handleS21Change,
    addEmergencyContact,
    deleteEmergencyContact,
    handleEmergencyContactChange,
    addAbsence,
    deleteAbsence,
    togglePrivilege,
    setPrivilegeRole
  };
};
