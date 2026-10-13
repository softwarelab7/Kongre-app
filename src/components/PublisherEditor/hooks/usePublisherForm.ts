import { useState, useEffect, useCallback, useMemo } from 'react';
import { Publisher } from '../../../types';

const deterministicStringify = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(deterministicStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `"${k}":${deterministicStringify(obj[k])}`).join(',')}}`;
};

const normalizePublisher = (initial: any): Publisher => {
  return {
    id: initial.id || '',
    nid: initial.nid || '',
    full_name: initial.full_name || '',
    role: initial.role || 'publisher',
    gender: initial.gender || 'male',
    status: initial.status || 'active',
    is_approved: initial.is_approved !== undefined ? initial.is_approved : true,
    assignments: initial.assignments || {},
    ausencias: initial.ausencias || [],
    pioneer_type: initial.pioneer_type || 'none',
    group_responsibility: initial.group_responsibility || 'none',
    baptism_date: initial.baptism_date || '',
    publisher_date: initial.publisher_date || '',
    last_visit_date: initial.last_visit_date || '',
    is_active: initial.is_active !== undefined ? initial.is_active : true,
    is_regular: initial.is_regular !== undefined ? initial.is_regular : true,
    is_anointed: !!initial.is_anointed,
    has_key: !!initial.has_key,
    reports_to_branch: !!initial.reports_to_branch,
    is_disfellowshipped: !!initial.is_disfellowshipped,
    is_reinstated: !!initial.is_reinstated,
    spiritual_notes: initial.spiritual_notes || '',
    emergency_contacts: initial.emergency_contacts || [],
    s21_records: initial.s21_records || {},
    ...initial
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
        next.full_name = parts.join(' ');
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
