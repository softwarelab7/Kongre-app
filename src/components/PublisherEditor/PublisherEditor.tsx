import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Publisher, PublisherAbsence } from '../../types';
import {
  LayoutGrid,
  Compass,
  ArrowLeft,
  Save, 
  User, 
  Shield, 
  FileText, 
  CheckCircle,
  Check,
  Stethoscope,
  Diamond,
  Users,
  Heart,
  Calendar,
  MapPin,
  Wrench,
  ListChecks,
  Plus,
  Plane,
  Search,
  Phone,
  Mail,
  Edit2,
  Trash2,
  History,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useModal } from '../../context/ModalContext';
import { usePublisherForm } from './hooks/usePublisherForm';
import { usePublisherActions } from './hooks/usePublisherActions';
import { PremiumDatePicker } from '../PremiumDatePicker';
import { usePermissions } from '../../context/AuthContext';

// Sections
import { BasicInfoSection } from './sections/BasicInfoSection';
import { ContactSection } from './sections/ContactSection';
// import { IdentitySection } from './sections/IdentitySection'; // REMOVED: obsolete
import { SpecialConditionsSection } from './sections/SpecialConditionsSection';
import { AbsenceAndNotesSection } from './sections/AbsenceAndNotesSection';
import { EmergencyContactsSection } from './sections/EmergencyContactsSection';
import { AssignmentsSection } from './sections/AssignmentsSection';
import { S21RecordsSection } from './sections/S21RecordsSection';
import { PrivilegesSection } from './sections/PrivilegesSection';
import { MedicalDpaSection } from './sections/MedicalDpaSection';
import { PublisherHistoryPanel } from './PublisherHistoryPanel';

export type Tab = 
  | 'all' 
  | 'personal' 
  | 'contact' 
  | 'medical' 
  | 'spiritual' 
  | 'assignments' 
  | 'record' 
  | 'emergency' 
  | 'conditions' 
  | 'absences' 
  | 'history';

export const TAB_CONFIG: Record<Tab, { label: string; icon: any; color: string; activeBg: string; activeDark: string; badge?: string; desc: string }> = {
  all:         { label: 'Panel de Tarjetas',   icon: Layers,      color: 'text-indigo-600 dark:text-indigo-400',   activeBg: 'bg-indigo-500/10 border-indigo-500/30',   activeDark: 'dark:bg-indigo-500/15 dark:border-indigo-500/30', badge: 'Hub', desc: 'Panel de categorías teocráticas independientes' },
  personal:    { label: 'Información Personal', icon: User,        color: 'text-blue-600 dark:text-blue-400',       activeBg: 'bg-blue-500/10 border-blue-500/30',       activeDark: 'dark:bg-blue-500/15 dark:border-blue-500/30', desc: 'Datos civiles, filiación y registro básico' },
  contact:     { label: 'Contacto y Ubicación', icon: MapPin,     color: 'text-cyan-600 dark:text-cyan-400',       activeBg: 'bg-cyan-500/10 border-cyan-500/30',       activeDark: 'dark:bg-cyan-500/15 dark:border-cyan-500/30', desc: 'Teléfono, móvil, dirección y mapas' },
  medical:     { label: 'DPA & Salud',        icon: Stethoscope, color: 'text-rose-600 dark:text-rose-400',       activeBg: 'bg-rose-500/10 border-rose-500/30',       activeDark: 'dark:bg-rose-500/15 dark:border-rose-500/30', desc: 'Directriz médica anticipada y salud' },
  spiritual:   { label: 'Estado Espiritual',   icon: Shield,      color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/30', activeDark: 'dark:bg-emerald-500/15 dark:border-emerald-500/30', desc: 'Bautismo, privilegios y rol eclesiástico' },
  assignments: { label: 'Asignaciones',       icon: CheckCircle, color: 'text-violet-600 dark:text-violet-400',   activeBg: 'bg-violet-500/10 border-violet-500/30',   activeDark: 'dark:bg-violet-500/15 dark:border-violet-500/30', desc: 'Partes de reunión, tareas y servicio' },
  record:      { label: 'Registro S-21',       icon: FileText,    color: 'text-amber-600 dark:text-amber-400',     activeBg: 'bg-amber-500/10 border-amber-500/30',     activeDark: 'dark:bg-amber-500/15 dark:border-amber-500/30', desc: 'Tarjeta de registro de publicador' },
  emergency:   { label: 'Contacto Emergencia', icon: Phone,       color: 'text-red-600 dark:text-red-400',         activeBg: 'bg-red-500/10 border-red-500/30',         activeDark: 'dark:bg-red-500/15 dark:border-red-500/30', desc: 'Familiares o hermanos para emergencias' },
  conditions:  { label: 'Condiciones Especiales', icon: Diamond,  color: 'text-teal-600 dark:text-teal-400',       activeBg: 'bg-teal-500/10 border-teal-500/30',       activeDark: 'dark:bg-teal-500/15 dark:border-teal-500/30', desc: 'Edad avanzada, salud y movilidad' },
  absences:    { label: 'Ausencias y Notas',   icon: Calendar,    color: 'text-orange-600 dark:text-orange-400',   activeBg: 'bg-orange-500/10 border-orange-500/30',   activeDark: 'dark:bg-orange-500/15 dark:border-orange-500/30', desc: 'Seguimiento de ausencias y notas pastorales' },
  history:     { label: 'Historial',          icon: History,     color: 'text-slate-600 dark:text-slate-400',     activeBg: 'bg-slate-500/10 border-slate-500/30',     activeDark: 'dark:bg-slate-500/15 dark:border-slate-500/30', desc: 'Auditoría y reversión de cambios' }
};

export const ASSIGNMENT_GROUPS = [
  { id: 'treasures', label: 'Tesoros de la Biblia', color: 'emerald', icon: Diamond, items: [
    { id: 'chairman', label: 'Presidente' }, { id: 'prayers', label: 'Oraciones' }, { id: 'gems', label: 'Busquemos perlas escondidas' }, { id: 'aux_counselor', label: 'Consejero de la sala auxiliar' }, { id: 'talk', label: 'Discurso de Tesoros' }, { id: 'reading', label: 'Lectura de la Biblia' }
  ]},
  { id: 'teachers', label: 'Seamos mejores maestros', color: 'amber', icon: Users, items: [
    { id: 'student', label: 'Estudiante de la reunión Vida y Ministerio' }, { id: 'conversations', label: 'Empiece conversaciones' }, { id: 'return_visits', label: 'Haga revisitas' }, { id: 'disciples', label: 'Haga discípulos' }, { id: 'beliefs', label: 'Explique sus creencias' }, { id: 'assistant_student', label: 'Ayudante' }, { id: 'talk_student', label: 'Discurso' }, { id: 'language_group_only', label: 'Solo grupo de idiomas' }
  ]},
  { id: 'living', label: 'Nuestra vida cristiana', color: 'rose', icon: Heart, items: [
    { id: 'living_parts', label: 'Intervenciones' }, { id: 'bible_study', label: 'Estudio bíblico' }, { id: 'reader_living', label: 'Lector' }
  ]},
  { id: 'weekend', label: 'Reunión del fin de semana', color: 'blue', icon: Calendar, items: [
    { id: 'local_speaker', label: 'Orador local' }, { id: 'outgoing_speaker', label: 'Orador saliente' }, { id: 'weekend_chairman', label: 'Presidente' }, { id: 'final_prayer', label: 'Oración final' }, { id: 'watchtower_reader', label: 'Lector de La Atalaya' }, { id: 'weekend_language_only', label: 'Solo grupo de idiomas' }
  ]},
  { id: 'field_service', label: 'Servicio del campo', color: 'violet', icon: MapPin, items: [
    { id: 'public_witnessing', label: 'Predicación pública' }, { id: 'group_service_leader', label: 'Dirigir reuniones para el servicio del campo' }, { id: 'field_service_prayer', label: 'Oración en reuniones para el servicio del campo' }
  ]},
  { id: 'tasks', label: 'Tareas', color: 'zinc', icon: Wrench, items: [
    { id: 'maintenance', label: 'Mantenimiento' },
    // Midweek
    { id: 'attendants_midweek', label: 'Acomodadores (Entre semana)', meeting: 'midweek', shortLabel: 'Acomodadores' },
    { id: 'microphones_midweek', label: 'Micrófonos (Entre semana)', meeting: 'midweek', shortLabel: 'Micrófonos' },
    { id: 'audio_video_midweek', label: 'Audio/video (Entre semana)', meeting: 'midweek', shortLabel: 'Audio/video' },
    { id: 'platform_task_midweek', label: 'Plataforma (Entre semana)', meeting: 'midweek', shortLabel: 'Plataforma' },
    // Weekend
    { id: 'attendants_weekend', label: 'Acomodadores (Fin de semana)', meeting: 'weekend', shortLabel: 'Acomodadores' },
    { id: 'microphones_weekend', label: 'Micrófonos (Fin de semana)', meeting: 'weekend', shortLabel: 'Micrófonos' },
    { id: 'audio_video_weekend', label: 'Audio/video (Fin de semana)', meeting: 'weekend', shortLabel: 'Audio/video' },
    { id: 'platform_task_weekend', label: 'Plataforma (Fin de semana)', meeting: 'weekend', shortLabel: 'Plataforma' }
  ]},
  { id: 'cleaning', label: 'Fichas de mantenimiento', color: 'indigo', icon: ListChecks, items: [
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
    { id: 'tanks', label: 'Tanques' }
  ]}
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
  user
}) => {
  const { canEditPublishers, canViewS21 } = usePermissions();
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
    isDirty
  } = usePublisherForm(publisher);
  
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-indigo-500/50', 'ring-offset-2', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-indigo-500/50', 'ring-offset-2');
      }, 1200);
    }
  }, []);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [newAbsence, setNewAbsence] = useState({ start_date: '', end_date: '', reason: '' });
  const [selectedServiceYear, setSelectedServiceYear] = useState('2026');
  // const [showNip, setShowNip] = useState(false); // REMOVED: obsolete
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    alt_phone: '',
    email: ''
  });
  const [publisherSearch, setPublisherSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<'all' | 'midweek' | 'weekend'>('all');

  const {
    groups,
    allPublishers,
    handleBack,
    // handleRegenerateNip // REMOVED: obsolete
  } = usePublisherActions({
    showToast,
    confirm,
    prompt,
    onCancel,
    isDirty,
    handleChange,
    // setShowNip // REMOVED: obsolete
  });

  const handleS21ChangeLocal = useCallback((monthIdx: number, field: string, value: any) => {
    handleS21Change(selectedServiceYear, monthIdx, field, value);
  }, [handleS21Change, selectedServiceYear]);

  const handleAddAbsenceLocal = useCallback(() => {
    if (!newAbsence.start_date || !newAbsence.end_date) return;
    const abs: PublisherAbsence = {
      id: window.crypto.randomUUID(),
      ...newAbsence
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
        id: editingContact?.id || window.crypto.randomUUID()
    };
    
    addEmergencyContact(contact, editingContact?.id);
    
    setShowEmergencyModal(false);
    setEditingContact(null);
    setNewContact({ name: '', relationship: '', phone: '', alt_phone: '', email: '' });
  }, [newContact, editingContact, addEmergencyContact, showToast]);

  const handleDeleteEmergencyContactLocal = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: '¿Eliminar contacto?',
      message: '¿Estás seguro de que deseas eliminar este contacto de emergencia?',
      type: 'danger'
    });
    if (confirmed) {
        deleteEmergencyContact(id);
    }
  }, [confirm, deleteEmergencyContact]);

  const activeContacts = useMemo(() => {
    return (formData.emergency_contacts || []).filter(c => c.id);
  }, [formData.emergency_contacts]);

  const activeAssignmentsCount = useMemo(() => {
    let count = 0;
    ASSIGNMENT_GROUPS.forEach(g => {
      g.items.forEach((item: any) => {
        if ((formData.assignments as any)?.[item.id] || ((formData as any).responsibilities as any)?.[item.id]) {
          count++;
        }
      });
    });
    return count;
  }, [formData.assignments, (formData as any).responsibilities]);

  const conditionsCount = useMemo(() => {
    const condKeys = ['is_elderly', 'is_infirm', 'is_deaf', 'is_blind', 'is_imprisoned', 'is_head_of_household', 'is_child', 'is_moved'];
    return condKeys.filter(k => !!(formData as any)[k]).length;
  }, [formData]);

  const publisherRoleLabel = useMemo(() => {
    if (formData.role === 'elder') return 'Anciano';
    if (formData.role === 'ministerial_servant') return 'Siervo Ministerial';
    if (formData.role === 'unbaptized') return 'Publicador no bautizado';
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

  const cleanPhone = useMemo(() => {
    return (formData.phone || '').replace(/[^0-9]/g, '');
  }, [formData.phone]);

  const handleSelectAllGroup = useCallback((groupId: string, items: any[], select: boolean) => {
    items.forEach(item => {
      handleAssignmentChange(item.id, select);
    });
  }, [handleAssignmentChange]);

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="sticky top-[-16px] sm:top-[-24px] z-20 bg-white/95 dark:bg-[#0d0d18]/95 backdrop-blur-xl pt-3 sm:pt-4 pb-2 -mt-4 sm:-mt-6 -mx-2 sm:-mx-4 px-3 sm:px-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <header className="mb-2 sm:mb-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={handleBack} className="p-2 sm:p-1.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-all shrink-0 active:scale-95">
              <ArrowLeft size={18} className="text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200" />
            </button>
            <div className="flex-1 min-w-0 flex flex-col relative group">
              {isEditingName ? (
                <div className="flex items-center gap-2 max-w-md animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative w-full flex items-center">
                    <input 
                      ref={nameInputRef}
                      type="text"
                      value={formData.full_name || ''}
                      onChange={e => handleChange('full_name', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') setIsEditingName(false);
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      onBlur={() => setIsEditingName(false)}
                      className="bg-white dark:bg-[#1a1a24] border border-indigo-500/50 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] focus:outline-none px-3 py-1.5 text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 w-full transition-all truncate rounded-xl cursor-text"
                      placeholder="Nombre del Publicador"
                      autoFocus
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setIsEditingName(false); }}
                      className="absolute right-2 p-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors"
                      title="Confirmar"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 max-w-md cursor-pointer animate-in fade-in duration-200 group/title"
                  onClick={() => setIsEditingName(true)}
                >
                  <h2 className="px-3 py-1.5 -ml-3 text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 w-full truncate rounded-xl transition-all group-hover/title:bg-zinc-100/80 dark:group-hover/title:bg-white/[0.04]">
                    {formData.full_name || 'Nuevo Publicador'}
                  </h2>
                  <div className="absolute right-2 opacity-0 group-hover/title:opacity-100 transition-opacity flex items-center">
                    <div className="p-1.5 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Edit2 size={12} />
                    </div>
                  </div>
                </div>
              )}
              {!isEditingName && (
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1 absolute -bottom-5 left-0">
                  Haz clic para editar el nombre
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={() => onSave(formData)}
            disabled={loading || !formData.full_name || !canEditPublishers}
            className="bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 dark:border dark:border-indigo-500/20 text-white px-3.5 sm:px-5 py-2 min-h-[38px] rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? '...' : <><Save size={16} /> Guardar</>}
          </button>
        </header>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-0.5 py-1 -mx-0.5 touch-pan-x">
          {(Object.keys(TAB_CONFIG) as Tab[]).filter(tabKey => {
            if (tabKey === 'record' && !canViewS21) return false;
            return true;
          }).map(tabKey => {
            const config = TAB_CONFIG[tabKey];
            const isActive = activeTab === tabKey;
            
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
                  isActive
                    ? `${config.activeBg} ${config.activeDark} ${config.color} border-current/20 shadow-xs ring-1 ring-black/5 dark:ring-white/10`
                    : `text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border-transparent`
                }`}
              >
                <config.icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 pt-6 pb-12 px-2">
        {/* VISTA 1: PANEL / HUB DE TARJETAS (Cada categoría en su propio contenedor) */}
        {activeTab === 'all' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner de Resumen del Publicador */}
            <div className="bg-gradient-to-br from-indigo-500/5 via-white to-indigo-500/10 dark:from-indigo-500/10 dark:via-[#0f1623] dark:to-indigo-500/5 rounded-3xl p-6 border border-indigo-200/50 dark:border-white/[0.08] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-xl relative shrink-0 ring-4 ring-white dark:ring-[#0f1623]"
                    style={{
                      background: formData.gender === 'female'
                        ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                        : 'linear-gradient(135deg, #6366f1, #3b82f6)'
                    }}
                  >
                    {formData.gender === 'female' ? '♀' : '♂'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {formData.full_name || 'Nuevo Publicador'}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {publisherRoleLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Selecciona una categoría a continuación para abrir y editar su contenedor exclusivo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  {formData.has_dpa ? (
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      DPA Vigente ✓
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                      Sin DPA / Pendiente
                    </span>
                  )}
                  {ageInfo?.age !== null && ageInfo?.age !== undefined && (
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/[0.06]">
                      {ageInfo.age} años
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/[0.06]">
                    {activeAssignmentsCount} asignaciones
                  </span>
                </div>
              </div>
            </div>

            {/* Mosaico de Contenedores de Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Contenedor 1: Información Personal */}
              <div 
                onClick={() => setActiveTab('personal')}
                className="bg-white dark:bg-[#0f1623] hover:bg-blue-50/[0.3] dark:hover:bg-blue-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-blue-400/50 dark:hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <User size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                      {formData.gender === 'female' ? 'Hermana' : 'Hermano'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Información Personal
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Datos civiles, fecha de nacimiento, edad exacta, estado civil y cabeza de familia.
                  </p>
                  
                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Edad:</span>
                      <span className="font-semibold">{ageInfo?.age !== null && ageInfo?.age !== undefined ? `${ageInfo.age} años` : 'Sin fecha registrada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Estado civil:</span>
                      <span className="font-semibold capitalize">{formData.marital_status || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta personal</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 2: Contacto y Ubicación */}
              <div 
                onClick={() => setActiveTab('contact')}
                className="bg-white dark:bg-[#0f1623] hover:bg-cyan-50/[0.3] dark:hover:bg-cyan-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-cyan-400/50 dark:hover:border-cyan-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <MapPin size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40">
                      {formData.phone ? 'Teléfono reg.' : 'Sin teléfono'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Contacto y Ubicación
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Teléfonos, WhatsApp directo, correo electrónico, domicilio y enlace a mapas.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between truncate">
                      <span className="text-zinc-400">Teléfono:</span>
                      <span className="font-semibold truncate ml-2">{formData.phone || 'No registrado'}</span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span className="text-zinc-400">Domicilio:</span>
                      <span className="font-semibold truncate ml-2">{formData.address || 'No registrado'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta de contacto</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 3: Directiva DPA & Salud */}
              <div 
                onClick={() => setActiveTab('medical')}
                className="bg-white dark:bg-[#0f1623] hover:bg-rose-50/[0.3] dark:hover:bg-rose-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-rose-400/50 dark:hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                      <Stethoscope size={22} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                      formData.has_dpa 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {formData.has_dpa ? 'Vigente ✓' : 'Pendiente'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Directiva Médica DPA & Salud
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Documento de voluntad anticipada, fecha de emisión y representantes de atención médica.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Estado DPA:</span>
                      <span className="font-semibold">{formData.has_dpa ? 'Firmado y al día' : 'Pendiente de registrar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Representante:</span>
                      <span className="font-semibold truncate ml-2">{(formData as any).health_proxy_1_name || 'Sin asignar'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta médica DPA</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 4: Estado Espiritual */}
              <div 
                onClick={() => setActiveTab('spiritual')}
                className="bg-white dark:bg-[#0f1623] hover:bg-emerald-50/[0.3] dark:hover:bg-emerald-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-emerald-400/50 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Shield size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      {publisherRoleLabel}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Estado Espiritual & Privilegios
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Bautismo, años en la verdad, rol teocrático, precursores y grupo de predicación asignado.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Bautismo:</span>
                      <span className="font-semibold">{formData.baptism_date || 'No bautizado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Grupo:</span>
                      <span className="font-semibold">{formData.id_grupo ? `Grupo ${formData.id_grupo}` : 'Sin grupo'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta espiritual</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 5: Asignaciones Teocráticas */}
              <div 
                onClick={() => setActiveTab('assignments')}
                className="bg-white dark:bg-[#0f1623] hover:bg-violet-50/[0.3] dark:hover:bg-violet-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-violet-400/50 dark:hover:border-violet-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-2xl text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      <CheckCircle size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40">
                      {activeAssignmentsCount} activas
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    Asignaciones Teocráticas
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Partes de reunión entre semana y fin de semana, acomodadores, audio/video y tareas.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total asignaciones:</span>
                      <span className="font-semibold">{activeAssignmentsCount} habilitadas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Fichas técnicas:</span>
                      <span className="font-semibold">Mantenimiento y salón</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta de asignaciones</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 6: Registro S-21 (si tiene permisos) */}
              {canViewS21 && (
                <div 
                  onClick={() => setActiveTab('record')}
                  className="bg-white dark:bg-[#0f1623] hover:bg-amber-50/[0.3] dark:hover:bg-amber-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-amber-400/50 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                        <FileText size={22} />
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                        Año {selectedServiceYear}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Registro de Publicador S-21
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      Ficha oficial congregacional con informes mensuales de predicación, cursos bíblicos y notas.
                    </p>

                    <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Año de servicio:</span>
                        <span className="font-semibold">{selectedServiceYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Ficha:</span>
                        <span className="font-semibold">Registro histórico S-21</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Abrir tarjeta S-21</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              )}

              {/* Contenedor 7: Contactos de Emergencia */}
              <div 
                onClick={() => setActiveTab('emergency')}
                className="bg-white dark:bg-[#0f1623] hover:bg-red-50/[0.3] dark:hover:bg-red-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-red-400/50 dark:hover:border-red-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                      <Phone size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
                      {activeContacts.length} contactos
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    Contactos de Emergencia
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Familiares, hermanos de confianza o tutores para contacto urgente y avisos prioritarios.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Contactos reg.:</span>
                      <span className="font-semibold">{activeContacts.length} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Prioridad:</span>
                      <span className="font-semibold">Avisos urgentes</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta de emergencia</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 8: Condiciones Especiales */}
              <div 
                onClick={() => setActiveTab('conditions')}
                className="bg-white dark:bg-[#0f1623] hover:bg-teal-50/[0.3] dark:hover:bg-teal-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-teal-400/50 dark:hover:border-teal-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-teal-50 dark:bg-teal-500/10 rounded-2xl text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                      <Diamond size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40">
                      {conditionsCount > 0 ? `${conditionsCount} esp.` : 'Estándar'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Condiciones Especiales
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Edad avanzada, movilidad, atención especial en salud y necesidades particulares.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Condiciones:</span>
                      <span className="font-semibold">{conditionsCount > 0 ? `${conditionsCount} activas` : 'Ninguna registrada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Seguimiento:</span>
                      <span className="font-semibold">Supervisión pastoral</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta de condiciones</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 9: Ausencias y Notas */}
              <div 
                onClick={() => setActiveTab('absences')}
                className="bg-white dark:bg-[#0f1623] hover:bg-orange-50/[0.3] dark:hover:bg-orange-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-orange-400/50 dark:hover:border-orange-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                      <Calendar size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/40">
                      {(formData.ausencias || []).length} periodos
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Ausencias y Notas
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Periodos de ausencia programada, viajes, convalecencia y notas de pastoreo.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ausencias:</span>
                      <span className="font-semibold">{(formData.ausencias || []).length} registradas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Notas:</span>
                      <span className="font-semibold">Seguimiento interno</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir tarjeta de ausencias</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              {/* Contenedor 10: Historial de Cambios */}
              <div 
                onClick={() => setActiveTab('history')}
                className="bg-white dark:bg-[#0f1623] hover:bg-slate-50/[0.3] dark:hover:bg-slate-500/[0.04] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-slate-400/50 dark:hover:border-slate-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-3 bg-slate-100 dark:bg-slate-500/10 rounded-2xl text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                      <History size={22} />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/40">
                      Auditoría
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                    Historial de Auditoría
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    Registro de cambios realizados en la ficha del publicador con opción de restauración.
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Versiones:</span>
                      <span className="font-semibold">Historial teocrático</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Reversión:</span>
                      <span className="font-semibold">Disponible</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:translate-x-1 transition-transform">
                  <span>Abrir historial de cambios</span>
                  <ChevronRight size={16} />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VISTAS EXCLUSIVAS: CADA CATEGORÍA DENTRO DE SU PROPIO CONTENEDOR */}
        {activeTab !== 'all' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Barra Superior del Contenedor de la Tarjeta */}
            <div className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft size={15} /> Volver al Panel de Tarjetas
                </button>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${TAB_CONFIG[activeTab].activeBg} ${TAB_CONFIG[activeTab].color}`}>
                    {React.createElement(TAB_CONFIG[activeTab].icon, { size: 18 })}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {TAB_CONFIG[activeTab].label}
                    </h3>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {TAB_CONFIG[activeTab].desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector Rápido de Categorías */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 touch-pan-x w-full sm:w-auto">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pr-1 shrink-0 hidden lg:inline">
                  Cambiar a:
                </span>
                {(Object.keys(TAB_CONFIG) as Tab[]).filter(k => k !== 'all' && (k !== 'record' || canViewS21)).map(tabKey => {
                  const cfg = TAB_CONFIG[tabKey];
                  const isCurrent = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                        isCurrent 
                          ? `${cfg.activeBg} ${cfg.activeDark} ${cfg.color} ring-1 ring-current/20`
                          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      {cfg.label.replace('Información ', '').replace('Directiva ', '').replace('Registro ', '').replace('Contactos ', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Renderizado Exclusivo del Contenedor de la Tarjeta Seleccionada */}
            {activeTab === 'personal' && (
              <BasicInfoSection formData={formData} handleChange={handleChange} />
            )}

            {activeTab === 'contact' && (
              <ContactSection formData={formData} handleChange={handleChange} />
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
                onRevertSuccess={() => {
                  if (onCancel) onCancel();
                }}
              />
            )}
          </div>
        )}
      </div>

      {showAbsenceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1120]/70 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-[#1a1a2e] border border-black/[0.06] dark:border-white/[0.06] w-full max-w-md rounded-[2rem] p-6 shadow-2xl border border-zinc-100 dark:border-white/[0.06] animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                    <Plane size={20} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Registrar Ausencia</h3>
                    <p className="text-xs font-semibold text-zinc-500">Define las fechas no disponibles.</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Fecha Inicio</label>
                       <PremiumDatePicker 
                          value={newAbsence.start_date}
                          onChange={val => setNewAbsence(prev => ({ ...prev, start_date: val }))}
                       />
                    </div>
                    <div>
                       <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Fecha Fin</label>
                       <PremiumDatePicker 
                          value={newAbsence.end_date}
                          onChange={val => setNewAbsence(prev => ({ ...prev, end_date: val }))}
                       />
                    </div>
                 </div>
                 <div>
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Motivo (Opcional)</label>
                    <textarea 
                       value={newAbsence.reason}
                       onChange={e => setNewAbsence(prev => ({ ...prev, reason: e.target.value }))}
                       rows={2}
                       className="w-full kf-input resize-none"
                       placeholder="Ej: Vacaciones, enfermedad, etc."
                    />
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button 
                    onClick={() => setShowAbsenceModal(false)}
                    className="flex-1 py-2.5 bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 rounded-xl text-xs font-bold transition-colors hover:bg-zinc-200 dark:hover:bg-white/[0.08]"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={() => {
                       handleAddAbsenceLocal();
                       setShowAbsenceModal(false);
                       showToast('Ausencia registrada localmente');
                    }}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
                 >
                    Guardar Periodo
                 </button>
              </div>
           </div>
        </div>
      )}

      {showEmergencyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a1120]/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1a1a2e] border border-black/[0.06] dark:border-white/[0.06] w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-zinc-100 dark:border-white/[0.06] animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Heart size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500">Completa la información de contacto para emergencias.</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Nombre Completo</label>
                    <input 
                      type="text"
                      value={newContact.name}
                      onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      className="kf-input"
                      placeholder="Nombre del familiar o amigo"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Parentesco</label>
                       <input 
                        type="text"
                        value={newContact.relationship}
                        onChange={e => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                        className="kf-input"
                        placeholder="Ej: Esposo, Madre, Hijo"
                      />
                    </div>
                    <div>
                       <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Teléfono Principal</label>
                       <input 
                        type="text"
                        value={newContact.phone}
                        onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="kf-input"
                        placeholder="Número de contacto"
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Teléfono Alternativo</label>
                       <input 
                        type="text"
                        value={newContact.alt_phone}
                        onChange={e => setNewContact(prev => ({ ...prev, alt_phone: e.target.value }))}
                        className="kf-input"
                        placeholder="Otro número (opcional)"
                      />
                    </div>
                    <div>
                       <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block ml-1">Correo Electrónico</label>
                       <input 
                        type="email"
                        value={newContact.email}
                        onChange={e => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        className="kf-input"
                        placeholder="Email (opcional)"
                      />
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button 
                    onClick={() => {
                      setShowEmergencyModal(false);
                      setEditingContact(null);
                    }}
                    className="flex-1 py-3 bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors hover:bg-zinc-200 dark:hover:bg-white/[0.08]"
                 >
                    Cancelar
                 </button>
                 <button 
                    onClick={handleAddEmergencyContactLocal}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                 >
                    {editingContact ? 'Guardar Cambios' : 'Crear Contacto'}
                 </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};