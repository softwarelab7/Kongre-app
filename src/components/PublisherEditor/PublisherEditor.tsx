import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Publisher, PublisherAbsence } from '../../types';
import { 
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
  Trash2
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
import { PublisherHistoryPanel } from './PublisherHistoryPanel';

type Tab = 'personal' | 'spiritual' | 'assignments' | 'record' | 'emergency';

const TAB_CONFIG: Record<Tab, { label: string; icon: any; color: string; activeBg: string; activeDark: string }> = {
  personal:    { label: 'Información Personal', icon: User,        color: 'text-indigo-600 dark:text-indigo-400',   activeBg: 'bg-indigo-500/10 border-indigo-500/30',   activeDark: 'dark:bg-indigo-500/15 dark:border-indigo-500/30' },
  spiritual:   { label: 'Espiritual',   icon: Shield,      color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/30', activeDark: 'dark:bg-emerald-500/15 dark:border-emerald-500/30' },
  assignments: { label: 'Asignaciones', icon: CheckCircle, color: 'text-violet-600 dark:text-violet-400',   activeBg: 'bg-violet-500/10 border-violet-500/30',   activeDark: 'dark:bg-violet-500/15 dark:border-violet-500/30' },
  record:      { label: 'Registro Predicación', icon: FileText,    color: 'text-amber-600 dark:text-amber-400',     activeBg: 'bg-amber-500/10 border-amber-500/30',     activeDark: 'dark:bg-amber-500/15 dark:border-amber-500/30' },
  emergency:   { label: 'Contacto de Emergencia',   icon: Stethoscope, color: 'text-rose-600 dark:text-rose-400',       activeBg: 'bg-rose-500/10 border-rose-500/30',       activeDark: 'dark:bg-rose-500/15 dark:border-rose-500/30' }
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
  initialTab = 'personal',
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

  const handleSelectAllGroup = useCallback((groupId: string, items: any[], select: boolean) => {
    items.forEach(item => {
      handleAssignmentChange(item.id, select);
    });
  }, [handleAssignmentChange]);

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="sticky top-[-24px] z-20 bg-white/90 dark:bg-[#0d0d18]/90 backdrop-blur-xl pt-4 pb-2 -mt-6 -mx-4 px-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <header className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={handleBack} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/[0.06] rounded-lg transition-all group shrink-0">
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
            className="bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 dark:border dark:border-indigo-500/20 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? '...' : <><Save size={16} /> Guardar</>}
          </button>
        </header>

        <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {(Object.keys(TAB_CONFIG) as Tab[]).filter(tabKey => {
            if (tabKey === 'record' && !canViewS21) return false;
            return true;
          }).map(tabKey => {
            const config = TAB_CONFIG[tabKey];
            const isActive = activeTab === tabKey;
            
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap border ${
                  isActive
                    ? `${config.activeBg} ${config.activeDark} ${config.color} border-current/20`
                    : `text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border-transparent`
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
        {activeTab === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <BasicInfoSection formData={formData} handleChange={handleChange} />
            <ContactSection formData={formData} handleChange={handleChange} />
            {/* IdentitySection removed as it is obsolete */}
            <SpecialConditionsSection formData={formData} handleChange={handleChange} />
            <AbsenceAndNotesSection 
              formData={formData} 
              handleChange={handleChange}
              setShowAbsenceModal={setShowAbsenceModal}
              handleDeleteAbsence={deleteAbsence}
            />
            {/* Historial de cambios — solo para publicadores existentes */}
            <PublisherHistoryPanel
              publisherNid={formData.nid || formData.id}
              onRevertSuccess={() => {
                // Reload publishers list in the parent after a revert
                if (onCancel) onCancel();
              }}
            />
          </div>
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

        {activeTab === 'record' && (
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