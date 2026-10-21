import { useState, useEffect, useCallback, useRef } from 'react';
import { Publisher, MonthlyServiceReport, PreachingGroup } from '../../../types';
import { ensureImmutablePublisherCode } from '../../../utils/publisherDeduplication';
import { useCongregation } from '../../../context/CongregationContext';

const deterministicStringify = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(deterministicStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `"${k}":${deterministicStringify(obj[k])}`).join(',')}}`;
};

const S21_MONTH_NAMES = [
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
];

/**
 * Construye o fusiona s21_records del publicador a partir de los informes mensuales reales (monthlyReports)
 * para que la pestaña Registro S-21 dentro del editor muestre los mismos datos que TarjetasS21Tab e InformesServicioTab.
 */
function hydrateS21RecordsFromMonthlyReports(
  publisherId: string | undefined,
  existingS21Records: Record<string, any[]> = {},
  monthlyReports: MonthlyServiceReport[] = []
): Record<string, any[]> {
  const result: Record<string, any[]> = { ...existingS21Records };
  if (!publisherId) return result;

  const pubReports = monthlyReports.filter(r => r.publisherId === publisherId);
  if (pubReports.length === 0) return result;

  const reportByMonth = new Map<string, MonthlyServiceReport>();
  pubReports.forEach(r => reportByMonth.set(r.month, r));

  // Años de servicio soportados en la vista ('2025' = 2024-2025, '2026' = 2025-2026, '2027' = 2026-2027)
  const serviceYearEndYears = ['2025', '2026', '2027'];

  for (const endYrStr of serviceYearEndYears) {
    const endYear = parseInt(endYrStr, 10);
    const startYear = endYear - 1;
    const monthKeys = [
      `${startYear}-09`,
      `${startYear}-10`,
      `${startYear}-11`,
      `${startYear}-12`,
      `${endYear}-01`,
      `${endYear}-02`,
      `${endYear}-03`,
      `${endYear}-04`,
      `${endYear}-05`,
      `${endYear}-06`,
      `${endYear}-07`,
      `${endYear}-08`,
    ];

    const baseYearArray = existingS21Records[endYrStr]
      ? [...existingS21Records[endYrStr]]
      : S21_MONTH_NAMES.map(m => ({
          month: m,
          participated: false,
          bible_studies: 0,
          auxiliary_pioneer: false,
          hours: 0,
          credit: 0,
          late: false,
          comments: '',
        }));

    let hasAnyUpdate = false;
    monthKeys.forEach((mKey, idx) => {
      const rep = reportByMonth.get(mKey);
      if (rep) {
        hasAnyUpdate = true;
        baseYearArray[idx] = {
          ...(baseYearArray[idx] || {}),
          month: S21_MONTH_NAMES[idx],
          participated: Boolean(rep.participated),
          bible_studies: rep.bibleStudies || 0,
          auxiliary_pioneer: Boolean(rep.isAuxiliaryPioneer),
          hours: rep.hours || 0,
          credit: baseYearArray[idx]?.credit || 0,
          late: Boolean(baseYearArray[idx]?.late),
          comments: rep.notes || baseYearArray[idx]?.comments || '',
        };
      }
    });

    if (hasAnyUpdate || existingS21Records[endYrStr]) {
      result[endYrStr] = baseYearArray;
    }
  }

  return result;
}

const mapRolesToAssignments = (
  roles: any = {},
  existingAssignments: any = {},
  isFemale = false,
  isCartApproved = false
): Record<string, boolean> => {
  const assignments: Record<string, boolean> = { ...(existingAssignments || {}) };
  if (!roles || typeof roles !== 'object') return assignments;

  // Vida y Ministerio Cristianos (Entre semana)
  if (roles.vym_presidente && assignments.chairman === undefined) assignments.chairman = true;
  if (roles.vym_consejero_aux && assignments.aux_counselor === undefined) assignments.aux_counselor = true;
  if (roles.vym_oracion && assignments.prayers === undefined) assignments.prayers = true;
  if (roles.vym_tesoros_discurso && assignments.talk === undefined) assignments.talk = true;
  if (roles.vym_tesoros_perlas && assignments.gems === undefined) assignments.gems = true;
  if (roles.vym_tesoros_lectura && assignments.reading === undefined) assignments.reading = true;
  if (roles.vym_maestros_titular) {
    if (assignments.student === undefined) assignments.student = true;
    if (assignments.conversations === undefined) assignments.conversations = true;
    if (assignments.return_visits === undefined) assignments.return_visits = true;
    if (assignments.disciples === undefined) assignments.disciples = true;
    if (assignments.beliefs === undefined) assignments.beliefs = true;
    if (!isFemale && assignments.talk_student === undefined) assignments.talk_student = true;
  }
  if (roles.vym_maestros_ayudante && assignments.assistant_student === undefined) {
    assignments.assistant_student = true;
  }
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
  if (roles.deber_audio || roles.deber_video) {
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
  if (roles.predicacion_publica || roles.carritos || isCartApproved) {
    if (assignments.public_witnessing === undefined) assignments.public_witnessing = true;
  }

  return assignments;
};

const normalizePublisher = (
  initial: any,
  fallbackCode?: string,
  monthlyReports: MonthlyServiceReport[] = [],
  preachingGroups: PreachingGroup[] = []
): Publisher => {
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
    rawGender === 'female' || rawGender === 'hermana' ? 'female' : 'male';

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

  // 5. Precursorado
  let resolvedPioneerType = initial.pioneer_type || 'none';
  if (resolvedPioneerType === 'none' && (initial.pioneerStatus || rawPriv.includes('precursor'))) {
    const pStat = String(initial.pioneerStatus || rawPriv).toLowerCase();
    if (pStat.includes('regular')) resolvedPioneerType = 'regular';
    else if (pStat.includes('auxiliar')) resolvedPioneerType = 'auxiliary';
    else if (pStat.includes('especial') || pStat.includes('special')) resolvedPioneerType = 'special';
  }

  const resolvedPrivilege =
    resolvedRole === 'elder'
      ? 'anciano'
      : resolvedRole === 'servant'
      ? 'siervo_ministerial'
      : resolvedRole === 'unbaptized'
      ? 'publicador_no_bautizado'
      : resolvedPioneerType === 'regular'
      ? 'precursor_regular'
      : resolvedPioneerType === 'auxiliary' || resolvedPioneerType === 'auxiliary_continuous'
      ? 'precursor_auxiliar'
      : initial.privilege || 'publicador_bautizado';

  // 6. Fechas
  const resolvedBirthDate = initial.birth_date || initial.birthDate || '';
  const resolvedBaptismDate = initial.baptism_date || initial.baptismDate || '';
  const resolvedLastVisit = initial.last_shepherding_visit || initial.last_visit_date || '';

  // 7. Grupo y Responsabilidad de Grupo sincronizada con preachingGroups
  const hasUnassignedGroup = initial.id_grupo === null || initial.groupNumber === 0;
  const groupNum = hasUnassignedGroup
    ? 0
    : initial.groupNumber !== undefined && initial.groupNumber !== null
    ? initial.groupNumber
    : initial.id_grupo
    ? parseInt(initial.id_grupo, 10)
    : 1;
  const idGrupo = hasUnassignedGroup ? null : initial.id_grupo || String(groupNum);

  let resolvedGroupResp = initial.group_responsibility || 'miembro';
  if (initial.id && preachingGroups.length > 0 && groupNum > 0) {
    const matchingGroup = preachingGroups.find(g => g.number === groupNum);
    if (matchingGroup) {
      if (matchingGroup.overseerId === initial.id) resolvedGroupResp = 'overseer';
      else if (matchingGroup.assistantId === initial.id) resolvedGroupResp = 'assistant';
    }
  }

  // 8. Asignaciones y Privilegios
  const resolvedAssignments = mapRolesToAssignments(
    initial.roles,
    initial.assignments,
    normalizedGender === 'female',
    Boolean(initial.is_cart_approved)
  );

  // 9. Contactos de emergencia
  let emergencyContacts = initial.emergency_contacts || [];
  if (emergencyContacts.length === 0 && (initial.emergencyContactName || initial.emergencyContactPhone)) {
    emergencyContacts = [
      {
        id: 'em-1',
        name: initial.emergencyContactName || 'Contacto Principal',
        relationship: 'Familiar',
        phone: initial.emergencyContactPhone || '',
        alt_phone: '',
        email: '',
      },
    ];
  }

  // 10. Estados y actividad
  const isExplicitlyInactive =
    initial.status === 'inactive' ||
    initial.status === 'deleted' ||
    initial.is_active === false ||
    initial.active === false;
  const isActive = !isExplicitlyInactive;
  const status = initial.status === 'deleted' ? 'deleted' : isActive ? 'active' : 'inactive';

  // 11. ID Único Inmutable del Publicador
  const immutableCode = ensureImmutablePublisherCode(
    initial.id || initial.nid || initial.publisherCode ? initial : { publisherCode: fallbackCode }
  );
  const resolvedId = initial.id || immutableCode;

  // 12. Ausencias normalizadas (ambos formatos start_date y startDate)
  const rawAbsences = initial.ausencias || initial.absences || [];
  const normalizedAbsences = rawAbsences.map((a: any) => ({
    ...a,
    id: a.id || `abs-${Date.now()}`,
    start_date: a.start_date || a.startDate || '',
    end_date: a.end_date || a.endDate || '',
    startDate: a.startDate || a.start_date || '',
    endDate: a.endDate || a.end_date || '',
    reason: a.reason || '',
  }));

  // 13. Registros S-21 hidratados desde monthlyReports
  const hydratedS21Records = hydrateS21RecordsFromMonthlyReports(
    resolvedId,
    initial.s21_records || {},
    monthlyReports
  );

  return {
    ...initial,
    id: resolvedId,
    nid: initial.nid || resolvedId,
    publisherCode: immutableCode,
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
    pioneerStatus:
      resolvedPioneerType === 'regular'
        ? 'regular'
        : resolvedPioneerType === 'auxiliary' || resolvedPioneerType === 'auxiliary_continuous'
        ? 'auxiliar_continuo'
        : 'ninguno',
    group_responsibility: resolvedGroupResp,
    publisher_date: initial.publisher_date || '',
    last_visit_date: resolvedLastVisit,
    last_shepherding_visit: resolvedLastVisit,
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
    s21_records: hydratedS21Records,
    ausencias: normalizedAbsences,
    absences: normalizedAbsences,
    assignments: resolvedAssignments,
  } as Publisher;
};

export const usePublisherForm = (initialPublisher: Partial<Publisher> = {}) => {
  const { monthlyReports, preachingGroups } = useCongregation();
  const newPublisherCodeRef = useRef<string>(ensureImmutablePublisherCode(initialPublisher));
  const [formData, setFormData] = useState<Publisher>(() =>
    normalizePublisher(initialPublisher, newPublisherCodeRef.current, monthlyReports, preachingGroups)
  );

  const [isDirty, setIsDirty] = useState(false);

  // Use stringified initialPublisher to avoid resetting the form on every parent re-render
  const initialPublisherString = JSON.stringify(initialPublisher);

  // Sync form data if initialPublisher prop changes (e.g. after a successful save)
  useEffect(() => {
    const initial = JSON.parse(initialPublisherString);
    setFormData(
      normalizePublisher(initial, newPublisherCodeRef.current, monthlyReports, preachingGroups)
    );
  }, [initialPublisherString]);

  // Track changes
  useEffect(() => {
    const initial = JSON.parse(initialPublisherString);
    const normalizedInitial = normalizePublisher(
      initial,
      newPublisherCodeRef.current,
      monthlyReports,
      preachingGroups
    );

    const hasChanged = deterministicStringify(formData) !== deterministicStringify(normalizedInitial);
    setIsDirty(hasChanged);
  }, [formData, initialPublisherString, monthlyReports, preachingGroups]);

  const handleChange = useCallback((field: keyof Publisher, value: any) => {
    // El ID único del publicador (id, nid, publisherCode) es inmutable y nunca puede modificarse
    if (field === 'id' || field === 'nid' || field === 'publisherCode') {
      return;
    }
    setFormData(prev => {
      const next: any = { ...prev, [field]: value };
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

      // Sincronizar banderas de Activo / Inactivo
      if (field === 'is_active') {
        const act = Boolean(value);
        next.active = act;
        next.is_active = act;
        next.status = act ? 'active' : 'inactive';
      } else if (field === 'status') {
        const act = value === 'active';
        next.active = act;
        next.is_active = act;
      }

      // Sincronizar tipo de precursor con pioneerStatus
      if (field === 'pioneer_type') {
        next.pioneerStatus =
          value === 'regular'
            ? 'regular'
            : value === 'auxiliary' || value === 'auxiliary_continuous'
            ? 'auxiliar_continuo'
            : 'ninguno';
      }

      // Sincronizar Ungido / Esperanza
      if (field === 'is_anointed') {
        next.hope = value ? 'ungido' : 'otras_ovejas';
      } else if (field === 'hope') {
        next.is_anointed = value === 'ungido';
      }

      // Sincronizar fechas en ambos formatos (snake_case y camelCase)
      if (field === 'baptism_date' || field === 'baptismDate') {
        next.baptism_date = value;
        next.baptismDate = value;
      }
      if (field === 'birth_date' || field === 'birthDate') {
        next.birth_date = value;
        next.birthDate = value;
      }
      if ((field as string) === 'last_shepherding_visit' || (field as string) === 'last_visit_date') {
        next.last_shepherding_visit = value;
        next.last_visit_date = value;
      }

      // Sincronizar id_grupo y groupNumber
      if (field === 'id_grupo') {
        next.groupNumber = value ? parseInt(String(value), 10) : 0;
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
    setFormData(prev => {
      const currentRecords = prev.s21_records || {};
      const yearData = [...(currentRecords[selectedServiceYear] || Array(12).fill(null).map((_, i) => ({
        month: S21_MONTH_NAMES[i],
        participated: false,
        bible_studies: 0,
        auxiliary_pioneer: false,
        hours: 0,
        credit: 0,
        late: false,
        comments: ''
      })))];

      const updatedMonth = { ...yearData[monthIdx], [field]: value };
      if (field === 'hours' && Number(value) > 0) {
        updatedMonth.participated = true;
      }
      yearData[monthIdx] = updatedMonth;

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

      return {
        ...prev,
        emergency_contacts: nextContacts,
        emergencyContactName: nextContacts[0]?.name || '',
        emergencyContactPhone: nextContacts[0]?.phone || '',
      };
    });
  }, []);

  const deleteEmergencyContact = useCallback((id: string) => {
    setFormData(prev => {
      const nextContacts = (prev.emergency_contacts || []).filter(c => c.id !== id);
      return {
        ...prev,
        emergency_contacts: nextContacts,
        emergencyContactName: nextContacts[0]?.name || '',
        emergencyContactPhone: nextContacts[0]?.phone || '',
      };
    });
  }, []);

  const handleEmergencyContactChange = useCallback((id: string, field: string, value: any) => {
    setFormData(prev => {
      const nextContacts = (prev.emergency_contacts || []).map(c =>
        c.id === id ? { ...c, [field]: value } : c
      );
      return {
        ...prev,
        emergency_contacts: nextContacts,
        emergencyContactName: nextContacts[0]?.name || '',
        emergencyContactPhone: nextContacts[0]?.phone || '',
      };
    });
  }, []);

  const addAbsence = useCallback((absence: any) => {
    const normalized = {
      ...absence,
      id: absence.id || `abs-${Date.now()}`,
      start_date: absence.start_date || absence.startDate || '',
      end_date: absence.end_date || absence.endDate || '',
      startDate: absence.startDate || absence.start_date || '',
      endDate: absence.endDate || absence.end_date || '',
      reason: absence.reason || '',
    };
    setFormData(prev => {
      const nextList = [...(prev.ausencias || []), normalized];
      return {
        ...prev,
        ausencias: nextList as any,
        absences: nextList as any,
      };
    });
  }, []);

  const deleteAbsence = useCallback((id: string) => {
    setFormData(prev => {
      const nextList = (prev.ausencias || []).filter(a => a.id !== id);
      return {
        ...prev,
        ausencias: nextList as any,
        absences: nextList as any,
      };
    });
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
