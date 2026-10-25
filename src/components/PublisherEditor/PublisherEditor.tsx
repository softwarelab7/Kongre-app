// src/components/PublisherEditor/PublisherEditor.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Publisher, PublisherAbsence } from '../../types';
import {
  ArrowLeft,
  Save,
  User,
  Shield,
  FileText,
  CheckCircle,
  Stethoscope,
  Diamond,
  Users,
  Heart,
  Calendar,
  MapPin,
  Wrench,
  ListChecks,
  Plane,
  Phone,
  Edit2,
  History,
  ChevronLeft,
  ChevronRight,
  Layers,
  KeyRound,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';
import { usePublisherForm } from './hooks/usePublisherForm';
import { usePublisherActions } from './hooks/usePublisherActions';
import { PremiumDatePicker } from '../PremiumDatePicker';
import { usePermissions, useAuth } from '../../context/AuthContext';
import { useCongregation } from '../../context/CongregationContext';
import { canViewS21Of } from '../../utils/rbac';

// Sections
import { BasicInfoSection } from './sections/BasicInfoSection';
import { ContactSection } from './sections/ContactSection';
import { SpecialConditionsSection } from './sections/SpecialConditionsSection';
import { AbsenceAndNotesSection } from './sections/AbsenceAndNotesSection';
import { EmergencyContactsSection } from './sections/EmergencyContactsSection';
import { AssignmentsSection } from './sections/AssignmentsSection';
import { S21RecordsSection } from './sections/S21RecordsSection';
import { PrivilegesSection } from './sections/PrivilegesSection';
import { MedicalDpaSection } from './sections/MedicalDpaSection';
import { AccessCredentialsSection } from './sections/AccessCredentialsSection';
import { PublisherHistoryPanel } from './PublisherHistoryPanel';

export type Tab =
  | 'all'
  | 'personal'
  | 'contact'
  | 'access'
  | 'medical'
  | 'spiritual'
  | 'assignments'
  | 'record'
  | 'emergency'
  | 'conditions'
  | 'absences'
  | 'history';

export const TAB_CONFIG: Record<
  Tab,
  {
    label: string;
    shortCode?: string;
    icon: any;
    color: string;
    gradient: string;
    shadow: string;
    badge?: string;
    desc: string;
  }
> = {
  all: {
    label: 'Panel de Tarjetas',
    icon: Layers,
    color: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-600 via-indigo-600 to-violet-600',
    shadow: 'shadow-indigo-600/30',
    badge: 'Hub',
    desc: 'Directorio integral de tarjetas del publicador',
  },
  personal: {
    label: 'Información Personal',
    shortCode: '01',
    icon: User,
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-600 to-indigo-600',
    shadow: 'shadow-blue-600/30',
    desc: 'Datos civiles, núcleo familiar, oficios e ID único',
  },
  contact: {
    label: 'Contacto y Ubicación',
    shortCode: '02',
    icon: MapPin,
    color: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-600 to-blue-600',
    shadow: 'shadow-cyan-600/30',
    desc: 'Teléfonos, WhatsApp, domicilio, GPS y movilidad',
  },
  access: {
    label: 'Acceso y PIN',
    shortCode: '03',
    icon: KeyRound,
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-600 to-indigo-600',
    shadow: 'shadow-purple-600/30',
    desc: 'PIN personal, rol operativo y papeleta QR',
  },
  medical: {
    label: 'DPA & Salud',
    shortCode: '04',
    icon: Stethoscope,
    color: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-600 to-pink-600',
    shadow: 'shadow-rose-600/30',
    desc: 'Directriz médica anticipada, representantes y alergias',
  },
  spiritual: {
    label: 'Estado Espiritual',
    shortCode: '05',
    icon: Shield,
    color: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 to-teal-600',
    shadow: 'shadow-emerald-600/30',
    desc: 'Bautismo, nombramiento, precursorado, grupo y pastoreo',
  },
  assignments: {
    label: 'Asignaciones',
    shortCode: '06',
    icon: CheckCircle,
    color: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-600 to-purple-600',
    shadow: 'shadow-violet-600/30',
    desc: 'Partes de reunión, lección actual, bosquejos y tareas',
  },
  record: {
    label: 'Registro S-21',
    shortCode: '07',
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-600 to-orange-600',
    shadow: 'shadow-amber-600/30',
    desc: 'Tarjeta oficial congregacional de informes mensuales',
  },
  emergency: {
    label: 'Contacto Emergencia',
    shortCode: '08',
    icon: Phone,
    color: 'text-red-600 dark:text-red-400',
    gradient: 'from-red-600 to-rose-600',
    shadow: 'shadow-red-600/30',
    desc: 'Familiares o hermanos para localización urgente',
  },
  conditions: {
    label: 'Condiciones Especiales',
    shortCode: '09',
    icon: Diamond,
    color: 'text-teal-600 dark:text-teal-400',
    gradient: 'from-teal-600 to-emerald-600',
    shadow: 'shadow-teal-600/30',
    desc: 'Edad avanzada, accesibilidad, Zoom y mudanzas',
  },
  absences: {
    label: 'Ausencias y Notas',
    shortCode: '10',
    icon: Calendar,
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-600 to-amber-600',
    shadow: 'shadow-orange-600/30',
    desc: 'Bloqueo de fechas no disponibles y notas internas',
  },
  history: {
    label: 'Historial',
    shortCode: '11',
    icon: History,
    color: 'text-slate-600 dark:text-slate-400',
    gradient: 'from-slate-700 to-zinc-800',
    shadow: 'shadow-slate-700/30',
    desc: 'Auditoría cronológica y reversión de cambios',
  },
};

export const ASSIGNMENT_GROUPS = [
  {
    id: 'treasures',
    label: 'Tesoros de la Biblia',
    color: 'emerald',
    icon: Diamond,
    items: [
      { id: 'chairman', label: 'Presidente' },
      { id: 'prayers', label: 'Oraciones' },
      { id: 'gems', label: 'Busquemos perlas escondidas' },
      { id: 'aux_counselor', label: 'Consejero de la sala auxiliar' },
      { id: 'talk', label: 'Discurso de Tesoros' },
      { id: 'reading', label: 'Lectura de la Biblia' },
    ],
  },
  {
    id: 'teachers',
    label: 'Seamos mejores maestros',
    color: 'amber',
    icon: Users,
    items: [
      { id: 'student', label: 'Estudiante de la reunión Vida y Ministerio' },
      { id: 'conversations', label: 'Empiece conversaciones' },
      { id: 'return_visits', label: 'Haga revisitas' },
      { id: 'disciples', label: 'Haga discípulos' },
      { id: 'beliefs', label: 'Explique sus creencias' },
      { id: 'assistant_student', label: 'Ayudante' },
      { id: 'talk_student', label: 'Discurso' },
      { id: 'language_group_only', label: 'Solo grupo de idiomas' },
    ],
  },
  {
    id: 'living',
    label: 'Nuestra vida cristiana',
    color: 'rose',
    icon: Heart,
    items: [
      { id: 'living_parts', label: 'Intervenciones' },
      { id: 'bible_study', label: 'Estudio bíblico' },
      { id: 'reader_living', label: 'Lector' },
    ],
  },
  {
    id: 'weekend',
    label: 'Reunión del fin de semana',
    color: 'blue',
    icon: Calendar,
    items: [
      { id: 'local_speaker', label: 'Orador local' },
      { id: 'outgoing_speaker', label: 'Orador saliente' },
      { id: 'weekend_chairman', label: 'Presidente' },
      { id: 'final_prayer', label: 'Oración final' },
      { id: 'watchtower_reader', label: 'Lector de La Atalaya' },
      { id: 'weekend_language_only', label: 'Solo grupo de idiomas' },
    ],
  },
  {
    id: 'field_service',
    label: 'Servicio del campo',
    color: 'violet',
    icon: MapPin,
    items: [
      { id: 'public_witnessing', label: 'Predicación pública' },
      { id: 'group_service_leader', label: 'Dirigir reuniones para el servicio del campo' },
      { id: 'field_service_prayer', label: 'Oración en reuniones para el servicio del campo' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tareas',
    color: 'zinc',
    icon: Wrench,
    items: [
      { id: 'maintenance', label: 'Mantenimiento' },
      { id: 'attendants_midweek', label: 'Acomodadores (Entre semana)', meeting: 'midweek', shortLabel: 'Acomodadores' },
      { id: 'microphones_midweek', label: 'Micrófonos (Entre semana)', meeting: 'midweek', shortLabel: 'Micrófonos' },
      { id: 'audio_video_midweek', label: 'Audio/video (Entre semana)', meeting: 'midweek', shortLabel: 'Audio/video' },
      { id: 'platform_task_midweek', label: 'Plataforma (Entre semana)', meeting: 'midweek', shortLabel: 'Plataforma' },
      { id: 'attendants_weekend', label: 'Acomodadores (Fin de semana)', meeting: 'weekend', shortLabel: 'Acomodadores' },
      { id: 'microphones_weekend', label: 'Micrófonos (Fin de semana)', meeting: 'weekend', shortLabel: 'Micrófonos' },
      { id: 'audio_video_weekend', label: 'Audio/video (Fin de semana)', meeting: 'weekend', shortLabel: 'Audio/video' },
      { id: 'platform_task_weekend', label: 'Plataforma (Fin de semana)', meeting: 'weekend', shortLabel: 'Plataforma' },
    ],
  },
  {
    id: 'cleaning',
    label: 'Fichas de mantenimiento',
    color: 'indigo',
    icon: ListChecks,
    items: [
      { id: 'pest_control', label: 'Control de plagas' },
      { id: 'structural_insp', label: 'Inspección estructural' },
      { id: 'external_insp', label: 'Inspección externa' },
      { id: 'internal_insp', label: 'Inspección interna' },
      { id: 'furniture', label: 'Mobiliario' },
      { id: 'doors_windows', label: 'Puertas y ventanas' },
      { id: 'roofs', label: 'Techos' },
      { id: 'alarm', label: 'Alarma' },
      { id: 'electricity', label: 'Electricidad' },
      { id: 'audio_video_sys', label: 'Sistema de audio y video' },
      { id: 'tools_equip', label: 'Equipos y herramientas' },
      { id: 'gardens', label: 'Jardines' },
      { id: 'emergency_care', label: 'Atención de emergencias' },
      { id: 'seismic_insp', label: 'Inspección (d. de sismos)' },
      { id: 'hvac', label: 'Ventilación y aire acondicionado' },
      { id: 'bathrooms', label: 'Baños y accesorios' },
      { id: 'wastewater', label: 'Sistema de aguas residuales' },
      { id: 'tanks', label: 'Tanques' },
    ],
  },
];

interface PublisherEditorProps {
  publisher?: Partial<Publisher>;
  onSave: (data: Publisher) => void;
  onCancel: () => void;
  loading?: boolean;
  initialTab?: Tab;
  user?: any;
}

export const PublisherEditor: React.FC<PublisherEditorProps> = ({
  publisher = {},
  onSave,
  onCancel,
  loading,
  initialTab = 'all',
}) => {
  const { canEditPublishers, canViewS21: canViewS21Base } = usePermissions();
  const {
    activeRole: s21ActiveRole,
    activeRoles: s21ActiveRoles,
    currentPublisherId: s21ActorId,
  } = useAuth();
  const { preachingGroups: s21Groups } = useCongregation();

  const canViewS21 =
    canViewS21Base &&
    canViewS21Of(
      s21ActiveRoles && s21ActiveRoles.length > 0 ? s21ActiveRoles : [s21ActiveRole],
      publisher?.id,
      { actorPublisherId: s21ActorId, groups: s21Groups || [] }
    );

  const { showToast } = useToast();
  const { confirm, prompt } = useModal();
  const {
    formData,
    handleChange,
    handleAssignmentChange,
    handleMetadataChange,
    handleSectionToggle,
    handleS21Change,
    addEmergencyContact,
    deleteEmergencyContact,
    addAbsence,
    deleteAbsence,
    togglePrivilege,
    setPrivilegeRole,
    isDirty,
  } = usePublisherForm(publisher);

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [newAbsence, setNewAbsence] = useState({ start_date: '', end_date: '', reason: '' });
  const [selectedServiceYear, setSelectedServiceYear] = useState('2026');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    alt_phone: '',
    email: '',
  });
  const [publisherSearch, setPublisherSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<'all' | 'midweek' | 'weekend'>('all');

  const { groups, allPublishers, handleBack } = usePublisherActions({
    showToast,
    confirm,
    prompt,
    onCancel,
    isDirty,
    handleChange,
  });

  const handleS21ChangeLocal = useCallback(
    (monthIdx: number, field: string, value: any) => {
      handleS21Change(selectedServiceYear, monthIdx, field, value);
    },
    [handleS21Change, selectedServiceYear]
  );

  const handleAddAbsenceLocal = useCallback(() => {
    if (!newAbsence.start_date || !newAbsence.end_date) return;
    const abs: PublisherAbsence = {
      id: window.crypto.randomUUID(),
      ...newAbsence,
    };
    addAbsence(abs);
    setNewAbsence({ start_date: '', end_date: '', reason: '' });
  }, [newAbsence, addAbsence]);

  const handleAddEmergencyContactLocal = useCallback(() => {
    if (!newContact.name) {
      showToast('El nombre del contacto es obligatorio');
      return;
    }

    const contact = {
      ...newContact,
      id: editingContact?.id || window.crypto.randomUUID(),
    };

    addEmergencyContact(contact, editingContact?.id);

    setShowEmergencyModal(false);
    setEditingContact(null);
    setNewContact({ name: '', relationship: '', phone: '', alt_phone: '', email: '' });
  }, [newContact, editingContact, addEmergencyContact, showToast]);

  const handleDeleteEmergencyContactLocal = useCallback(
    async (id: string) => {
      const confirmed = await confirm({
        title: '¿Eliminar contacto?',
        message: '¿Estás seguro de que deseas eliminar este contacto de emergencia?',
        type: 'danger',
      });
      if (confirmed) {
        deleteEmergencyContact(id);
      }
    },
    [confirm, deleteEmergencyContact]
  );

  const activeContacts = useMemo(() => {
    return (formData.emergency_contacts || []).filter((c) => c.id || c.name);
  }, [formData.emergency_contacts]);

  const activeAssignmentsCount = useMemo(() => {
    let count = 0;
    ASSIGNMENT_GROUPS.forEach((g) => {
      g.items.forEach((item: any) => {
        if (
          (formData.assignments as any)?.[item.id] ||
          ((formData as any).responsibilities as any)?.[item.id]
        ) {
          count++;
        }
      });
    });
    return count;
  }, [formData.assignments, (formData as any).responsibilities]);

  const conditionsCount = useMemo(() => {
    const condKeys = [
      'is_elderly',
      'is_infirm',
      'is_deaf',
      'is_blind',
      'is_imprisoned',
      'is_head_of_household',
      'is_child',
      'is_moved',
    ];
    return condKeys.filter((k) => !!(formData as any)[k]).length;
  }, [formData]);

  const publisherRoleLabel = useMemo(() => {
    if (formData.role === 'elder') return 'Anciano';
    if (formData.role === 'ministerial_servant' || formData.role === 'servant')
      return 'Siervo Ministerial';
    if (formData.role === 'unbaptized') return 'No bautizado';
    return 'Publicador';
  }, [formData.role]);

  const ageInfo = useMemo(() => {
    const rawBirthDate = formData.birth_date || (formData as any).birthDate;
    if (!rawBirthDate) return null;
    try {
      const birth = new Date(rawBirthDate + 'T00:00:00');
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const dayDiff = today.getDate() - birth.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
      return { age: age >= 0 ? age : null };
    } catch {
      return null;
    }
  }, [formData.birth_date, (formData as any).birthDate]);

  const handleSelectAllGroup = useCallback(
    (groupId: string, items: any[], select: boolean) => {
      items.forEach((item) => {
        handleAssignmentChange(item.id, select);
      });
    },
    [handleAssignmentChange]
  );

  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabsRef.current) {
      const activeEl = tabsRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  const filteredTabs = useMemo(() => {
    return (Object.keys(TAB_CONFIG) as Tab[]).filter((tabKey) => {
      if (tabKey === 'record' && !canViewS21) return false;
      return true;
    });
  }, [canViewS21]);

  const sectionTabsOnly: Tab[] = useMemo(
    () => filteredTabs.filter((t) => t !== 'all'),
    [filteredTabs]
  );

  const currentSectionIdx = useMemo(
    () => sectionTabsOnly.indexOf(activeTab),
    [sectionTabsOnly, activeTab]
  );

  const prevTab = currentSectionIdx > 0 ? sectionTabsOnly[currentSectionIdx - 1] : null;
  const nextTab =
    currentSectionIdx >= 0 && currentSectionIdx < sectionTabsOnly.length - 1
      ? sectionTabsOnly[currentSectionIdx + 1]
      : null;

  const publisherInitials = useMemo(() => {
    const name = formData.full_name || formData.name || '';
    if (!name.trim()) return 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [formData.full_name, formData.name]);

  const groupNumber = formData.id_grupo || formData.groupNumber;
  const groupObj = useMemo(() => {
    return groups.find(
      (g: any) =>
        String(g.number) === String(groupNumber) || String(g.id) === String(groupNumber)
    );
  }, [groups, groupNumber]);
  const groupName = groupObj
    ? groupObj.name
    : groupNumber
    ? `Grupo ${groupNumber}`
    : null;

  const profileCompleteness = useMemo(() => {
    const checks = [
      { label: 'Nombre completo', ok: Boolean(formData.full_name || formData.name) },
      { label: 'Fecha de nacimiento', ok: Boolean(formData.birth_date || formData.birthDate) },
      { label: 'Teléfono o móvil', ok: Boolean(formData.phone || formData.home_phone) },
      { label: 'Domicilio', ok: Boolean(formData.address) },
      { label: 'Grupo de servicio', ok: Boolean(formData.id_grupo || formData.groupNumber) },
      { label: 'Directriz médica DPA', ok: Boolean(formData.has_dpa) },
      {
        label: 'Contacto de emergencia',
        ok: Boolean(activeContacts.length > 0 || formData.healthcare_agent_name),
      },
      {
        label: 'Bautismo o inicio pub.',
        ok: Boolean(
          formData.baptism_date ||
            formData.publisher_date ||
            formData.role === 'unbaptized'
        ),
      },
    ];
    const completed = checks.filter((c) => c.ok).length;
    const pct = Math.round((completed / checks.length) * 100);
    const missing = checks.filter((c) => !c.ok).map((c) => c.label);
    return { completed, total: checks.length, pct, missing };
  }, [formData, activeContacts.length]);

  const handleSaveClick = useCallback(() => {
    const effectiveName = (
      formData.full_name ||
      formData.name ||
      [formData.first_name, formData.last_name].filter(Boolean).join(' ')
    )?.trim();

    if (!effectiveName) {
      showToast('Por favor, ingresa el nombre del publicador antes de guardar', 'error');
      setIsEditingName(true);
      return;
    }

    if (!canEditPublishers) {
      showToast('No tienes permisos para modificar publicadores', 'error');
      return;
    }

    onSave({
      ...formData,
      name: effectiveName,
      full_name: effectiveName,
    });
  }, [formData, canEditPublishers, onSave, showToast]);

  const hubCards = useMemo(() => {
    const pubCode = formData.publisherCode || formData.nid || formData.id || 'PUB';
    const hasPin = Boolean(formData.personalPin || (formData as any).pin);
    const s21YearRecords = (formData.s21_records || {})[selectedServiceYear] || [];
    const s21ActiveMonths = Array.isArray(s21YearRecords)
      ? s21YearRecords.filter((r: any) => r?.participated || (r?.hours || 0) > 0).length
      : 0;
    const historyCount = (formData.change_history || []).length;

    const list: Array<{
      id: Tab;
      code: string;
      title: string;
      desc: string;
      icon: any;
      accentText: string;
      accentBg: string;
      accentBorderHover: string;
      statusText: string;
      statusOk?: boolean;
      rows: Array<{ label: string; value: string; mono?: boolean }>;
    }> = [
      {
        id: 'personal',
        code: '01',
        title: 'Información Personal',
        desc: 'Identidad civil, edad cronológica, estado civil, núcleo familiar y oficios.',
        icon: User,
        accentText: 'text-blue-600 dark:text-blue-400',
        accentBg: 'bg-blue-50 dark:bg-blue-500/10',
        accentBorderHover: 'hover:border-blue-400/70 dark:hover:border-blue-500/50',
        statusText: formData.gender === 'female' ? 'Hermana' : 'Hermano',
        rows: [
          { label: 'ID Único', value: String(pubCode), mono: true },
          {
            label: 'Edad y Estado Civil',
            value: `${
              ageInfo?.age !== null && ageInfo?.age !== undefined
                ? `${ageInfo.age} años`
                : 'Sin fecha'
            } · ${(formData.marital_status || 'Soltero').replace(/^./, (c) =>
              c.toUpperCase()
            )}`,
          },
        ],
      },
      {
        id: 'contact',
        code: '02',
        title: 'Contacto y Ubicación',
        desc: 'Teléfonos, WhatsApp directo, domicilio, coordenadas GPS y transporte.',
        icon: MapPin,
        accentText: 'text-cyan-600 dark:text-cyan-400',
        accentBg: 'bg-cyan-50 dark:bg-cyan-500/10',
        accentBorderHover: 'hover:border-cyan-400/70 dark:hover:border-cyan-500/50',
        statusText: formData.phone ? 'Localizable ✓' : 'Sin teléfono',
        statusOk: Boolean(formData.phone),
        rows: [
          { label: 'Teléfono Móvil', value: formData.phone || 'No registrado', mono: true },
          { label: 'Domicilio', value: formData.address || 'Sin dirección registrada' },
        ],
      },
      {
        id: 'access',
        code: '03',
        title: 'Acceso y PIN Personal',
        desc: 'Credencial individual para el portal móvil, papeleta QR y rol del sistema.',
        icon: KeyRound,
        accentText: 'text-purple-600 dark:text-purple-400',
        accentBg: 'bg-purple-50 dark:bg-purple-500/10',
        accentBorderHover: 'hover:border-purple-400/70 dark:hover:border-purple-500/50',
        statusText: hasPin ? 'PIN Activo ✓' : 'Sin PIN',
        statusOk: hasPin,
        rows: [
          {
            label: 'PIN Personal',
            value: hasPin ? '•••• Configurado' : 'Pendiente de generar',
            mono: true,
          },
          {
            label: 'Nivel de Sistema',
            value: formData.theocraticRole
              ? formData.theocraticRole
                  .replace(/_/g, ' ')
                  .replace(/^./, (c) => c.toUpperCase())
              : 'Publicador general',
          },
        ],
      },
      {
        id: 'medical',
        code: '04',
        title: 'Directriz DPA & Salud',
        desc: 'Voluntad médica anticipada vigente, representantes legales y alergias.',
        icon: Stethoscope,
        accentText: 'text-rose-600 dark:text-rose-400',
        accentBg: 'bg-rose-50 dark:bg-rose-500/10',
        accentBorderHover: 'hover:border-rose-400/70 dark:hover:border-rose-500/50',
        statusText: formData.has_dpa ? 'DPA Vigente ✓' : 'Pendiente',
        statusOk: Boolean(formData.has_dpa),
        rows: [
          {
            label: 'Tarjeta DPA',
            value: formData.has_dpa
              ? `Firmada ${formData.dpa_date ? `(${formData.dpa_date})` : ''}`
              : 'No registrada',
          },
          {
            label: 'Representante 1°',
            value: formData.healthcare_agent_name || 'Sin asignar',
          },
        ],
      },
      {
        id: 'spiritual',
        code: '05',
        title: 'Estado Espiritual',
        desc: 'Bautismo, nombramiento, servicio de precursor, grupo y visitas de pastoreo.',
        icon: Shield,
        accentText: 'text-emerald-600 dark:text-emerald-400',
        accentBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        accentBorderHover: 'hover:border-emerald-400/70 dark:hover:border-emerald-500/50',
        statusText: publisherRoleLabel,
        statusOk: true,
        rows: [
          {
            label: 'Bautismo · Grupo',
            value: `${formData.baptism_date || 'No bautizado'} · ${
              groupName || 'Sin grupo'
            }`,
          },
          {
            label: 'Último Pastoreo',
            value:
              formData.last_shepherding_visit ||
              formData.last_visit_date ||
              'Sin visita registrada',
          },
        ],
      },
      {
        id: 'assignments',
        code: '06',
        title: 'Asignaciones y Tareas',
        desc: 'Partes de reunión entre semana y fin de semana, acomodación, A/V y mantenimiento.',
        icon: CheckCircle,
        accentText: 'text-violet-600 dark:text-violet-400',
        accentBg: 'bg-violet-50 dark:bg-violet-500/10',
        accentBorderHover: 'hover:border-violet-400/70 dark:hover:border-violet-500/50',
        statusText: `${activeAssignmentsCount} activas`,
        statusOk: activeAssignmentsCount > 0,
        rows: [
          {
            label: 'Habilitaciones',
            value: `${activeAssignmentsCount} partes y tareas activas`,
            mono: true,
          },
          {
            label: 'Reuniones',
            value: 'Vida y Ministerio · Fin de Semana',
          },
        ],
      },
    ];

    if (canViewS21) {
      list.push({
        id: 'record',
        code: '07',
        title: 'Registro S-21',
        desc: 'Tarjeta oficial con informes mensuales de predicación, cursos bíblicos y horas.',
        icon: FileText,
        accentText: 'text-amber-600 dark:text-amber-400',
        accentBg: 'bg-amber-50 dark:bg-amber-500/10',
        accentBorderHover: 'hover:border-amber-400/70 dark:hover:border-amber-500/50',
        statusText: `Año ${selectedServiceYear}`,
        rows: [
          {
            label: 'Participación',
            value: `${s21ActiveMonths} / 12 meses registrados`,
            mono: true,
          },
          {
            label: 'Año de Servicio',
            value: `Septiembre ${Number(selectedServiceYear) - 1} – Agosto ${selectedServiceYear}`,
          },
        ],
      });
    }

    list.push(
      {
        id: 'emergency',
        code: '08',
        title: 'Contactos de Emergencia',
        desc: 'Familiares directos o hermanos de confianza para avisos urgentes.',
        icon: Phone,
        accentText: 'text-red-600 dark:text-red-400',
        accentBg: 'bg-red-50 dark:bg-red-500/10',
        accentBorderHover: 'hover:border-red-400/70 dark:hover:border-red-500/50',
        statusText: `${activeContacts.length} reg.`,
        statusOk: activeContacts.length > 0,
        rows: [
          {
            label: 'Contacto Principal',
            value: activeContacts[0]?.name || 'Ninguno registrado',
          },
          {
            label: 'Teléfono Urgencia',
            value: activeContacts[0]?.phone || 'Sin número',
            mono: true,
          },
        ],
      },
      {
        id: 'conditions',
        code: '09',
        title: 'Condiciones Especiales',
        desc: 'Indicadores de edad avanzada, movilidad, Zoom regular y seguimiento de mudanza.',
        icon: Diamond,
        accentText: 'text-teal-600 dark:text-teal-400',
        accentBg: 'bg-teal-50 dark:bg-teal-500/10',
        accentBorderHover: 'hover:border-teal-400/70 dark:hover:border-teal-500/50',
        statusText: conditionsCount > 0 ? `${conditionsCount} activas` : 'Estándar',
        rows: [
          {
            label: 'Indicadores Activos',
            value:
              conditionsCount > 0
                ? `${conditionsCount} condición(es) especial(es)`
                : 'Sin condiciones especiales',
          },
          {
            label: 'Asistencia',
            value: formData.zoom_regular ? 'Zoom frecuente' : 'Presencial en Salón',
          },
        ],
      },
      {
        id: 'absences',
        code: '10',
        title: 'Ausencias y Notas',
        desc: 'Periodos de viaje o convalecencia para evitar choques de programación.',
        icon: Calendar,
        accentText: 'text-orange-600 dark:text-orange-400',
        accentBg: 'bg-orange-50 dark:bg-orange-500/10',
        accentBorderHover: 'hover:border-orange-400/70 dark:hover:border-orange-500/50',
        statusText: `${(formData.ausencias || []).length} periodos`,
        rows: [
          {
            label: 'Periodos Programados',
            value: `${(formData.ausencias || []).length} ausencia(s)`,
            mono: true,
          },
          {
            label: 'Notas Internas',
            value: (formData as any).notes ? 'Con observaciones' : 'Sin notas',
          },
        ],
      },
      {
        id: 'history',
        code: '11',
        title: 'Historial de Auditoría',
        desc: 'Bitácora cronológica de modificaciones en la ficha con opción de reversión.',
        icon: History,
        accentText: 'text-slate-600 dark:text-slate-400',
        accentBg: 'bg-slate-100 dark:bg-slate-500/10',
        accentBorderHover: 'hover:border-slate-400/70 dark:hover:border-slate-500/50',
        statusText: 'Auditoría',
        rows: [
          {
            label: 'Cambios Registrados',
            value: `${historyCount} evento(s) en ficha`,
            mono: true,
          },
          {
            label: 'Restauración',
            value: 'Reversión por campo habilitada',
          },
        ],
      }
    );

    return list;
  }, [
    formData,
    ageInfo,
    publisherRoleLabel,
    groupName,
    activeAssignmentsCount,
    canViewS21,
    selectedServiceYear,
    activeContacts,
    conditionsCount,
  ]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. CABECERA EJECUTIVA DEL PUBLICADOR */}
      <div className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'all') {
                setActiveTab('all');
              } else {
                handleBack();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100/80 dark:bg-white/[0.05] hover:bg-zinc-200/80 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.08] text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
            title={
              activeTab !== 'all'
                ? 'Volver al panel de tarjetas'
                : 'Volver al directorio de publicadores'
            }
          >
            <ArrowLeft size={15} />
            <span>{activeTab !== 'all' ? 'Tarjetas' : 'Directorio'}</span>
          </button>

          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-xs">
            {publisherInitials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg truncate">
                {formData.full_name || formData.name || 'Nuevo Publicador'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingName((prev) => !prev)}
                className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Renombrar publicador"
              >
                <Edit2 size={13} />
              </button>
            </div>

            {/* Línea de Metadatos Tipográficos con separador · */}
            <p className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              <span>{formData.publisherCode || formData.nid || formData.id}</span>
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
              <span className="font-sans font-semibold text-indigo-600 dark:text-indigo-400">
                {publisherRoleLabel}
              </span>
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
              <span className="font-sans">{groupName || 'Sin grupo'}</span>
              {ageInfo?.age !== null && ageInfo?.age !== undefined && (
                <>
                  <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                  <span>{ageInfo.age} años</span>
                </>
              )}
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
              <span
                className={`font-sans font-semibold ${
                  isDirty
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isDirty ? 'Cambios sin guardar' : 'Sincronizado ✓'}
              </span>
            </p>
          </div>
        </div>

        {/* Completitud + Acción Primaria Guardar */}
        <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-white/[0.05] shrink-0">
          <div
            className="flex items-center gap-2.5"
            title={
              profileCompleteness.missing.length > 0
                ? `Pendiente: ${profileCompleteness.missing.join(', ')}`
                : 'Ficha completa'
            }
          >
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Integridad Ficha
              </span>
              <span className="text-xs font-mono tabular-nums font-bold text-zinc-700 dark:text-zinc-200">
                {profileCompleteness.pct}% ({profileCompleteness.completed}/
                {profileCompleteness.total})
              </span>
            </div>
            <div className="w-20 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  profileCompleteness.pct >= 85
                    ? 'bg-emerald-500'
                    : profileCompleteness.pct >= 50
                    ? 'bg-indigo-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${profileCompleteness.pct}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Guardar todos los cambios del publicador"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Guardar Ficha</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor de nombre inline */}
      {isEditingName && (
        <div className="p-3.5 bg-white dark:bg-[#0f1623] border border-indigo-300 dark:border-indigo-500/40 rounded-2xl shadow-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-zinc-500 shrink-0">Nombre completo:</span>
          <input
            ref={nameInputRef}
            type="text"
            value={formData.full_name || formData.name || ''}
            onChange={(e) => handleChange('full_name', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setIsEditingName(false);
            }}
            className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
            placeholder="Nombre y apellidos"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsEditingName(false)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Listo
          </button>
        </div>
      )}

      {/* 2. BARRA DE NAVEGACIÓN DE TARJETAS */}
      <div
        ref={tabsRef}
        className="p-1.5 bg-zinc-100/90 dark:bg-[#0f1623] rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] flex items-center gap-1 overflow-x-auto no-scrollbar"
      >
        {filteredTabs.map((tabKey) => {
          const config = TAB_CONFIG[tabKey];
          const isActive = activeTab === tabKey;
          const Icon = config.icon;

          return (
            <React.Fragment key={tabKey}>
              <button
                type="button"
                data-active={isActive}
                onClick={() => setActiveTab(tabKey)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs font-bold border border-zinc-200/60 dark:border-transparent'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  size={14}
                  className={
                    isActive
                      ? 'text-indigo-600 dark:text-white'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }
                />
                {config.shortCode && (
                  <span
                    className={`font-mono tabular-nums text-[10px] ${
                      isActive ? 'opacity-80' : 'opacity-50'
                    }`}
                  >
                    {config.shortCode}
                  </span>
                )}
                <span>{config.label}</span>
              </button>
              {tabKey === 'all' && (
                <div
                  className="h-5 w-px bg-zinc-200 dark:bg-white/[0.08] mx-1 shrink-0"
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. CONTENIDO PRINCIPAL: HUB DE 11 TARJETAS O VISTA INDIVIDUAL */}
      <div className="flex-1 pb-12">
        {activeTab === 'all' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Mosaico Editorial de 11 Tarjetas (Sin cajas anidadas redundantes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hubCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveTab(card.id)}
                    className={`bg-white dark:bg-[#0f1623] rounded-3xl p-5 sm:p-6 border border-zinc-200/90 dark:border-white/[0.06] ${card.accentBorderHover} shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group`}
                  >
                    <div>
                      {/* Encabezado de Tarjeta */}
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 ${card.accentBg} ${card.accentText} rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}
                          >
                            <Icon size={19} />
                          </div>
                          <span className="font-mono tabular-nums text-xs font-bold text-zinc-300 dark:text-zinc-600">
                            {card.code}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-mono tabular-nums font-semibold ${
                            card.statusOk
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {card.statusText}
                        </span>
                      </div>

                      {/* Título y Descripción */}
                      <h4
                        className={`text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:${card.accentText.split(' ')[0]} transition-colors`}
                      >
                        {card.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {card.desc}
                      </p>

                      {/* Filas de Metadatos Limpias (Separadas por Hairlines, sin caja anidada) */}
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.05] divide-y divide-zinc-100 dark:divide-white/[0.04] text-xs">
                        {card.rows.map((r, rIdx) => (
                          <div
                            key={rIdx}
                            className="py-2 flex items-center justify-between gap-3"
                          >
                            <span className="text-zinc-400 dark:text-zinc-500 shrink-0">
                              {r.label}
                            </span>
                            <span
                              className={`font-semibold text-zinc-800 dark:text-zinc-200 truncate text-right ${
                                r.mono ? 'font-mono tabular-nums' : ''
                              }`}
                            >
                              {r.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pie Interactivo */}
                    <div
                      className={`mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.05] flex items-center justify-between text-xs font-bold ${card.accentText}`}
                    >
                      <span>Configurar tarjeta</span>
                      <ChevronRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTAS INDIVIDUALES DE CADA TARJETA */}
        {activeTab !== 'all' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {activeTab === 'personal' && (
              <BasicInfoSection formData={formData} handleChange={handleChange} />
            )}

            {activeTab === 'contact' && (
              <ContactSection formData={formData} handleChange={handleChange} />
            )}

            {activeTab === 'access' && (
              <AccessCredentialsSection
                formData={formData}
                handleChange={handleChange}
                showToast={showToast}
                onSavePublisher={handleSaveClick}
                isSaving={loading}
              />
            )}

            {activeTab === 'medical' && (
              <MedicalDpaSection formData={formData} handleChange={handleChange} />
            )}

            {activeTab === 'spiritual' && (
              <PrivilegesSection
                formData={formData}
                groups={groups}
                handleChange={handleChange}
                togglePrivilege={togglePrivilege}
                setPrivilegeRole={setPrivilegeRole}
              />
            )}

            {activeTab === 'assignments' && (
              <AssignmentsSection
                formData={formData}
                handleAssignmentChange={handleAssignmentChange}
                handleMetadataChange={handleMetadataChange}
                handleSectionToggle={handleSectionToggle}
                handleSelectAllGroup={handleSelectAllGroup}
                tasksFilter={tasksFilter}
                setTasksFilter={setTasksFilter}
                ASSIGNMENT_GROUPS={ASSIGNMENT_GROUPS}
              />
            )}

            {activeTab === 'record' && canViewS21 && (
              <S21RecordsSection
                formData={formData}
                selectedServiceYear={selectedServiceYear}
                setSelectedServiceYear={setSelectedServiceYear}
                handleS21ChangeLocal={handleS21ChangeLocal}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencyContactsSection
                formData={formData}
                allPublishers={allPublishers}
                publisherSearch={publisherSearch}
                setPublisherSearch={setPublisherSearch}
                showSearchResults={showSearchResults}
                setShowSearchResults={setShowSearchResults}
                setNewContact={setNewContact}
                setEditingContact={setEditingContact}
                setShowEmergencyModal={setShowEmergencyModal}
                handleDeleteEmergencyContactLocal={handleDeleteEmergencyContactLocal}
                showToast={showToast}
              />
            )}

            {activeTab === 'conditions' && (
              <SpecialConditionsSection formData={formData} handleChange={handleChange} />
            )}

            {activeTab === 'absences' && (
              <AbsenceAndNotesSection
                formData={formData}
                handleChange={handleChange}
                setShowAbsenceModal={setShowAbsenceModal}
                handleDeleteAbsence={deleteAbsence}
              />
            )}

            {activeTab === 'history' && (
              <PublisherHistoryPanel
                publisherNid={formData.nid || formData.id}
                formData={formData}
                handleChange={handleChange}
                onRevertSuccess={() => {
                  if (onCancel) onCancel();
                }}
              />
            )}

            {/* Barra Inferior de Navegación Secuencial entre Tarjetas */}
            <div className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {prevTab ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(prevTab)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>
                      {TAB_CONFIG[prevTab].shortCode} · {TAB_CONFIG[prevTab].label}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Layers size={14} />
                    <span>Panel de Tarjetas</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="text-xs font-semibold text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                Tarjeta {currentSectionIdx + 1} de {sectionTabsOnly.length} · Ver todas
              </button>

              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                {nextTab ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(nextTab)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>
                      {TAB_CONFIG[nextTab].shortCode} · {TAB_CONFIG[nextTab].label}
                    </span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Guardar Ficha</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR AUSENCIA */}
      {showAbsenceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1120]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.08] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <Plane size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Registrar Ausencia Programada
                </h3>
                <p className="text-xs text-zinc-500">
                  Evita asignar partes en las semanas seleccionadas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Fecha Inicio
                  </label>
                  <PremiumDatePicker
                    value={newAbsence.start_date}
                    onChange={(val) => setNewAbsence((prev) => ({ ...prev, start_date: val }))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Fecha Fin
                  </label>
                  <PremiumDatePicker
                    value={newAbsence.end_date}
                    onChange={(val) => setNewAbsence((prev) => ({ ...prev, end_date: val }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Motivo (Opcional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Viaje familiar',
                    'Salud / Convalecencia',
                    'Turno laboral',
                    'Asamblea / Visita',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewAbsence((prev) => ({ ...prev, reason: preset }))}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newAbsence.reason}
                  onChange={(e) =>
                    setNewAbsence((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  rows={2}
                  className="w-full kf-input resize-none"
                  placeholder="Ej: Vacaciones, cirugía, viaje laboral..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAbsenceModal(false)}
                className="flex-1 py-2.5 bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors hover:bg-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAddAbsenceLocal();
                  setShowAbsenceModal(false);
                  showToast('Ausencia registrada en la ficha');
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Guardar Periodo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTACTO DE EMERGENCIA */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1120]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.08] w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {editingContact ? 'Editar Contacto de Emergencia' : 'Nuevo Contacto de Emergencia'}
                </h3>
                <p className="text-xs text-zinc-500">
                  Información para aviso inmediato ante urgencias
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                  className="kf-input w-full"
                  placeholder="Nombre del familiar o hermano"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">
                  Parentesco o Relación
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Esposo(a)',
                    'Padre / Madre',
                    'Hijo(a)',
                    'Hermano(a) carnal',
                    'Hermano(a) de la congregación',
                    'Representante DPA',
                  ].map((rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setNewContact((prev) => ({ ...prev, relationship: rel }))}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        newContact.relationship === rel
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600'
                      }`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, relationship: e.target.value }))
                  }
                  className="kf-input w-full"
                  placeholder="Ej: Esposo, Madre, Hijo, Hermano espiritual..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Teléfono Principal (Móvil)
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="kf-input w-full font-mono"
                    placeholder="+54 9 11..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                    Teléfono Alternativo
                  </label>
                  <input
                    type="tel"
                    value={newContact.alt_phone}
                    onChange={(e) =>
                      setNewContact((prev) => ({ ...prev, alt_phone: e.target.value }))
                    }
                    className="kf-input w-full font-mono"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="kf-input w-full"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEmergencyModal(false);
                  setEditingContact(null);
                }}
                className="flex-1 py-2.5 bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors hover:bg-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddEmergencyContactLocal}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingContact ? 'Guardar Cambios' : 'Registrar Contacto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};