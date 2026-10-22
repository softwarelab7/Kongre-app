// src/components/MemorialAsambleasTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  MemorialPlan,
  TheocraticAssembly,
  AssemblyType,
  EmblemServerAssignment,
  MemorialAttendant,
  AssemblyVolunteer,
  AssemblyBaptismCandidate,
} from '../types';
import {
  getPublisherName,
  getPublisherPhone,
  getMemorialChecklist,
  buildMemorialProgramWhatsApp,
  buildPersonalMemorialReminder,
  buildMemorialReportWhatsApp,
  buildAssemblyWhatsApp,
} from '../utils/memorialHelper';
import {
  Flame,
  Calendar,
  Clock,
  MapPin,
  Users,
  Wine,
  Share2,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Save,
  Building,
  Bus,
  Award,
  Sparkles,
  Send,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Droplets,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';

export const MemorialAsambleasTab: React.FC = () => {
  const {
    publishers,
    memorialPlans,
    theocraticAssemblies,
    updateMemorialPlan,
    addTheocraticAssembly,
    updateTheocraticAssembly,
    deleteTheocraticAssembly,
    settings,
  } = useCongregation();

  // Active top-level subtab
  const [activeSubTab, setActiveSubTab] = useState<
    'memorial' | 'asambleas' | 'checklist' | 'informe_sucursal'
  >('memorial');

  // Selected Memorial Plan (by year or id)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    memorialPlans[0]?.id || 'memorial-2026'
  );

  const currentPlan = useMemo(() => {
    return memorialPlans.find(p => p.id === selectedPlanId) || memorialPlans[0];
  }, [memorialPlans, selectedPlanId]);

  // Assembly view state
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>(
    theocraticAssemblies[0]?.id || ''
  );
  const [assemblyFilter, setAssemblyFilter] = useState<'todos' | AssemblyType>('todos');

  // Modals state
  const [isEditingPlanDetails, setIsEditingPlanDetails] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddAttendantModalOpen, setIsAddAttendantModalOpen] = useState(false);
  const [isAddAssemblyModalOpen, setIsAddAssemblyModalOpen] = useState(false);
  const [isAddVolunteerModalOpen, setIsAddVolunteerModalOpen] = useState(false);
  const [isAddBaptismCandidateModalOpen, setIsAddBaptismCandidateModalOpen] = useState(false);
  const [isPrintingProgram, setIsPrintingProgram] = useState(false);

  // Form states for modals
  const [newSection, setNewSection] = useState<{
    sectionName: string;
    breadServerPublisherId: string;
    wineServerPublisherId: string;
    notes: string;
  }>({
    sectionName: '',
    breadServerPublisherId: '',
    wineServerPublisherId: '',
    notes: '',
  });

  const [newAttendant, setNewAttendant] = useState<{
    role: MemorialAttendant['role'];
    publisherId: string;
    notes: string;
  }>({
    role: 'entrada_principal',
    publisherId: '',
    notes: '',
  });

  const [newAssembly, setNewAssembly] = useState<{
    serviceYear: number;
    type: AssemblyType;
    theme: string;
    dates: string;
    venue: string;
    circuitNumber: string;
    assignedCleaningDepartment: string;
    cleaningCoordinatorPublisherId: string;
    hasBus: boolean;
    busCompany: string;
    departureTime: string;
    departureLocation: string;
    returnTime: string;
    seatsTotal: number;
    seatsBooked: number;
    farePerSeat: number;
    busCoordinatorPublisherId: string;
    notes: string;
  }>({
    serviceYear: new Date().getFullYear(),
    type: 'circuito_con_sc',
    theme: '',
    dates: '',
    venue: '',
    circuitNumber: '',
    assignedCleaningDepartment: '',
    cleaningCoordinatorPublisherId: '',
    hasBus: false,
    busCompany: '',
    departureTime: '07:30',
    departureLocation: settings.hallAddress || 'Salón del Reino',
    returnTime: '17:00',
    seatsTotal: 55,
    seatsBooked: 0,
    farePerSeat: 10,
    busCoordinatorPublisherId: '',
    notes: '',
  });

  const [newVolunteer, setNewVolunteer] = useState<{
    publisherId: string;
    department: AssemblyVolunteer['department'];
    roleOrShift: string;
    shiftDate: string;
    shiftTime: string;
    notes: string;
  }>({
    publisherId: '',
    department: 'limpieza',
    roleOrShift: '',
    shiftDate: '',
    shiftTime: '',
    notes: '',
  });

  const [newBaptismCandidate, setNewBaptismCandidate] = useState<{
    publisherId: string;
    questionsCompleted: boolean;
    reviewedByElders: string;
    notes: string;
  }>({
    publisherId: '',
    questionsCompleted: true,
    reviewedByElders: '',
    notes: '',
  });

  // Filtered publishers (Brothers only for prayers/emblem servers)
  const brothers = useMemo(() => {
    return publishers.filter(p => p.gender === 'hermano' && p.active);
  }, [publishers]);

  const elders = useMemo(() => {
    return publishers.filter(
      p => p.gender === 'hermano' && p.privilege === 'anciano' && p.active
    );
  }, [publishers]);

  const activePublishers = useMemo(() => {
    return publishers.filter(p => p.active);
  }, [publishers]);

  // Checklist computation
  const checklist = useMemo(() => {
    if (!currentPlan) return [];
    return getMemorialChecklist(currentPlan, publishers);
  }, [currentPlan, publishers]);

  const checklistReadyCount = checklist.filter(c => c.isReady).length;

  // Filtered Assemblies
  const filteredAssemblies = useMemo(() => {
    return theocraticAssemblies.filter(a => {
      if (assemblyFilter === 'todos') return true;
      return a.type === assemblyFilter;
    });
  }, [theocraticAssemblies, assemblyFilter]);

  const selectedAssembly = useMemo(() => {
    return (
      theocraticAssemblies.find(a => a.id === selectedAssemblyId) ||
      filteredAssemblies[0] ||
      theocraticAssemblies[0]
    );
  }, [theocraticAssemblies, selectedAssemblyId, filteredAssemblies]);

  // Handler to open WhatsApp
  const handleOpenWhatsApp = (text: string, phone?: string) => {
    const encoded = encodeURIComponent(text);
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Handler to update plan fields
  const handleUpdatePlanField = (path: string, value: any) => {
    if (!currentPlan) return;
    const parts = path.split('.');
    const updated: any = { ...currentPlan };

    if (parts.length === 1) {
      updated[parts[0]] = value;
    } else if (parts.length === 2) {
      updated[parts[0]] = {
        ...updated[parts[0]],
        [parts[1]]: value,
      };
    } else if (parts.length === 3) {
      updated[parts[0]] = {
        ...updated[parts[0]],
        [parts[1]]: {
          ...updated[parts[0]][parts[1]],
          [parts[2]]: value,
        },
      };
    }

    updateMemorialPlan(updated);
  };

  // Add section for emblem servers
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan || !newSection.sectionName.trim()) return;

    const newAssignment: EmblemServerAssignment = {
      id: `es-${Date.now()}`,
      sectionName: newSection.sectionName.trim(),
      breadServerPublisherId: newSection.breadServerPublisherId,
      wineServerPublisherId: newSection.wineServerPublisherId,
      notes: newSection.notes.trim() || undefined,
    };

    const updated: MemorialPlan = {
      ...currentPlan,
      emblemServers: [...currentPlan.emblemServers, newAssignment],
    };
    updateMemorialPlan(updated);
    setNewSection({
      sectionName: '',
      breadServerPublisherId: '',
      wineServerPublisherId: '',
      notes: '',
    });
    setIsAddSectionModalOpen(false);
  };

  // Remove section
  const handleRemoveSection = (sectionId: string) => {
    if (!currentPlan) return;
    const updated: MemorialPlan = {
      ...currentPlan,
      emblemServers: currentPlan.emblemServers.filter(s => s.id !== sectionId),
    };
    updateMemorialPlan(updated);
  };

  // Add attendant
  const handleAddAttendant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan || !newAttendant.publisherId) return;

    const attendant: MemorialAttendant = {
      id: `att-${Date.now()}`,
      role: newAttendant.role,
      publisherId: newAttendant.publisherId,
      notes: newAttendant.notes.trim() || undefined,
    };

    const updated: MemorialPlan = {
      ...currentPlan,
      attendants: [...currentPlan.attendants, attendant],
    };
    updateMemorialPlan(updated);
    setNewAttendant({
      role: 'entrada_principal',
      publisherId: '',
      notes: '',
    });
    setIsAddAttendantModalOpen(false);
  };

  // Remove attendant
  const handleRemoveAttendant = (attendantId: string) => {
    if (!currentPlan) return;
    const updated: MemorialPlan = {
      ...currentPlan,
      attendants: currentPlan.attendants.filter(a => a.id !== attendantId),
    };
    updateMemorialPlan(updated);
  };

  // Save new assembly
  const handleCreateAssembly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssembly.theme.trim() || !newAssembly.dates.trim()) return;

    addTheocraticAssembly({
      serviceYear: Number(newAssembly.serviceYear),
      type: newAssembly.type,
      theme: newAssembly.theme.trim(),
      dates: newAssembly.dates.trim(),
      venue: newAssembly.venue.trim() || 'Salón de Asambleas',
      circuitNumber: newAssembly.circuitNumber.trim() || undefined,
      assignedCleaningDepartment: newAssembly.assignedCleaningDepartment.trim() || undefined,
      cleaningCoordinatorPublisherId: newAssembly.cleaningCoordinatorPublisherId || undefined,
      volunteers: [],
      baptismCandidates: [],
      busArrangement: {
        hasBus: newAssembly.hasBus,
        busCompany: newAssembly.busCompany.trim() || undefined,
        departureTime: newAssembly.departureTime || undefined,
        departureLocation: newAssembly.departureLocation || undefined,
        returnTime: newAssembly.returnTime || undefined,
        seatsTotal: Number(newAssembly.seatsTotal) || undefined,
        seatsBooked: Number(newAssembly.seatsBooked) || 0,
        farePerSeat: Number(newAssembly.farePerSeat) || undefined,
        coordinatorPublisherId: newAssembly.busCoordinatorPublisherId || undefined,
      },
      notes: newAssembly.notes.trim() || undefined,
    });

    setIsAddAssemblyModalOpen(false);
  };

  // Add volunteer to assembly
  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssembly || !newVolunteer.publisherId) return;

    const volunteer: AssemblyVolunteer = {
      id: `vol-${Date.now()}`,
      publisherId: newVolunteer.publisherId,
      department: newVolunteer.department,
      roleOrShift: newVolunteer.roleOrShift.trim() || 'Voluntario de departamento',
      shiftDate: newVolunteer.shiftDate || undefined,
      shiftTime: newVolunteer.shiftTime || undefined,
      notes: newVolunteer.notes.trim() || undefined,
    };

    const updated: TheocraticAssembly = {
      ...selectedAssembly,
      volunteers: [...selectedAssembly.volunteers, volunteer],
    };
    updateTheocraticAssembly(updated);
    setNewVolunteer({
      publisherId: '',
      department: 'limpieza',
      roleOrShift: '',
      shiftDate: '',
      shiftTime: '',
      notes: '',
    });
    setIsAddVolunteerModalOpen(false);
  };

  // Remove volunteer
  const handleRemoveVolunteer = (volunteerId: string) => {
    if (!selectedAssembly) return;
    const updated: TheocraticAssembly = {
      ...selectedAssembly,
      volunteers: selectedAssembly.volunteers.filter(v => v.id !== volunteerId),
    };
    updateTheocraticAssembly(updated);
  };

  // Add candidate to baptism
  const handleAddBaptismCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssembly || !newBaptismCandidate.publisherId) return;

    const candidate: AssemblyBaptismCandidate = {
      id: `bapt-${Date.now()}`,
      publisherId: newBaptismCandidate.publisherId,
      questionsCompleted: newBaptismCandidate.questionsCompleted,
      reviewedByElders: newBaptismCandidate.reviewedByElders.trim() || undefined,
      notes: newBaptismCandidate.notes.trim() || undefined,
    };

    const updated: TheocraticAssembly = {
      ...selectedAssembly,
      baptismCandidates: [...selectedAssembly.baptismCandidates, candidate],
    };
    updateTheocraticAssembly(updated);
    setNewBaptismCandidate({
      publisherId: '',
      questionsCompleted: true,
      reviewedByElders: '',
      notes: '',
    });
    setIsAddBaptismCandidateModalOpen(false);
  };

  // Remove baptism candidate
  const handleRemoveBaptismCandidate = (candidateId: string) => {
    if (!selectedAssembly) return;
    const updated: TheocraticAssembly = {
      ...selectedAssembly,
      baptismCandidates: selectedAssembly.baptismCandidates.filter(c => c.id !== candidateId),
    };
    updateTheocraticAssembly(updated);
  };

  // Update attendance of Memorial report
  const handleSaveReportNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan) return;
    const inPerson = Number(currentPlan.report.inPersonAttendance) || 0;
    const streaming = Number(currentPlan.report.streamingAttendance) || 0;
    const total = inPerson + streaming;

    handleUpdatePlanField('report.totalAttendance', total);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones y Navegación de Memorial & Asambleas (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sub-tab Navigation Pills */}
        <div className="flex rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-slate-900/60 p-1 shadow-2xs overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveSubTab('memorial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'memorial'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wine className="w-3.5 h-3.5 text-red-500" />
            <span>Memorial (14 Nisán)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('asambleas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'asambleas'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Asambleas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-bold">
              {theocraticAssemblies.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('checklist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'checklist'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Checklist</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              checklistReadyCount === checklist.length
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
            }`}>
              {checklistReadyCount}/{checklist.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('informe_sucursal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'informe_sucursal'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Informe Sucursal</span>
            {currentPlan?.report.reportedToBranch && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold">
                ✓
              </span>
            )}
          </button>
        </div>

        {/* Action quick buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (currentPlan) {
                const msg = buildMemorialProgramWhatsApp(currentPlan, publishers);
                handleOpenWhatsApp(msg);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-900/30 active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Programa WhatsApp</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Cuadro</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: MEMORIAL DEL 14 DE NISÁN                         */}
      {/* ========================================================= */}
      {activeSubTab === 'memorial' && currentPlan && (
        <div className="space-y-6">
          {/* Header Card with Year, Date and Sunset Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    Conmemoración del Año {currentPlan.serviceYear}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    14 de Nisán
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  Fecha sagrada bíblica tras la puesta de sol. Reunión más importante del año teocrático.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Fecha
                </span>
                <span className="text-sm font-bold text-slate-800">{currentPlan.date}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Puesta de Sol
                </span>
                <span className="text-sm font-bold text-amber-700">
                  {currentPlan.sunsetTime} hrs
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Hora Inicio
                </span>
                <span className="text-sm font-bold text-slate-800">{currentPlan.time} hrs</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Cánticos
                </span>
                <span className="text-sm font-bold text-indigo-700">
                  {currentPlan.initialSongNumber} y {currentPlan.finalSongNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Edit Details Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>
                <strong>Lugar:</strong> {currentPlan.location}
              </span>
              <span className="mx-2 text-slate-300">•</span>
              <span>
                <strong>Tema del Discurso:</strong> "{currentPlan.speakerTheme}"
              </span>
            </div>
            <button
              onClick={() => setIsEditingPlanDetails(!isEditingPlanDetails)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingPlanDetails ? 'Ocultar Edición' : 'Editar Datos del Evento'}</span>
            </button>
          </div>

          {/* Form to Edit Details if opened */}
          {isEditingPlanDetails && (
            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Configurar Detalles de la Conmemoración</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={currentPlan.date}
                    onChange={e => handleUpdatePlanField('date', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={currentPlan.time}
                    onChange={e => handleUpdatePlanField('time', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Hora Puesta del Sol
                  </label>
                  <input
                    type="time"
                    value={currentPlan.sunsetTime}
                    onChange={e => handleUpdatePlanField('sunsetTime', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Lugar / Salón
                  </label>
                  <input
                    type="text"
                    value={currentPlan.location}
                    onChange={e => handleUpdatePlanField('location', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cánticos (Inicial / Final)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Inicial"
                      value={currentPlan.initialSongNumber}
                      onChange={e => handleUpdatePlanField('initialSongNumber', Number(e.target.value))}
                      className="w-1/2 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Final"
                      value={currentPlan.finalSongNumber}
                      onChange={e => handleUpdatePlanField('finalSongNumber', Number(e.target.value))}
                      className="w-1/2 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tema Oficial del Discurso
                  </label>
                  <input
                    type="text"
                    value={currentPlan.speakerTheme}
                    onChange={e => handleUpdatePlanField('speakerTheme', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Cuadro de Asignaciones Principales (Honor Roll) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Cuadro Principal de Asignaciones Espirituales</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hermanos nombrados responsables de presidir, pronunciar el discurso y elevar las
                  oraciones de agradecimiento por los emblemas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Presidente */}
              <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-b from-slate-50 to-white hover:border-slate-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Presidente
                    </span>
                    <Sparkles className="w-4 h-4 text-slate-400" />
                  </div>
                  <select
                    value={currentPlan.chairmanPublisherId}
                    onChange={e => handleUpdatePlanField('chairmanPublisherId', e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar Anciano...</option>
                    {elders.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Presidencia & Bienvenida</span>
                  {currentPlan.chairmanPublisherId && (
                    <button
                      onClick={() => {
                        const name = getPublisherName(publishers, currentPlan.chairmanPublisherId);
                        const phone = getPublisherPhone(publishers, currentPlan.chairmanPublisherId);
                        const msg = buildPersonalMemorialReminder(
                          name,
                          'Presidente de la reunión de la Conmemoración',
                          currentPlan
                        );
                        handleOpenWhatsApp(msg, phone);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Orador */}
              <div className="p-4 rounded-xl border border-red-200 bg-linear-to-b from-red-50/50 to-white hover:border-red-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                      Orador del Discurso
                    </span>
                    <Flame className="w-4 h-4 text-red-500" />
                  </div>
                  <select
                    value={currentPlan.speakerPublisherId}
                    onChange={e => handleUpdatePlanField('speakerPublisherId', e.target.value)}
                    className="w-full text-xs font-bold text-red-950 px-2.5 py-2 rounded-lg border border-red-300 bg-white focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleccionar Orador (Anciano)...</option>
                    {elders.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 pt-2 border-t border-red-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                    {currentPlan.speakerTheme}
                  </span>
                  {currentPlan.speakerPublisherId && (
                    <button
                      onClick={() => {
                        const name = getPublisherName(publishers, currentPlan.speakerPublisherId);
                        const phone = getPublisherPhone(publishers, currentPlan.speakerPublisherId);
                        const msg = buildPersonalMemorialReminder(
                          name,
                          `Orador del Discurso del Memorial: "${currentPlan.speakerTheme}"`,
                          currentPlan
                        );
                        handleOpenWhatsApp(msg, phone);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Oración Pan */}
              <div className="p-4 rounded-xl border border-amber-200 bg-linear-to-b from-amber-50/50 to-white hover:border-amber-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Oración por el Pan
                    </span>
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <select
                    value={currentPlan.breadPrayerPublisherId}
                    onChange={e => handleUpdatePlanField('breadPrayerPublisherId', e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar Hermano Nombrado...</option>
                    {brothers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.privilege || 'publicador'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Cuerpo de Cristo</span>
                  {currentPlan.breadPrayerPublisherId && (
                    <button
                      onClick={() => {
                        const name = getPublisherName(publishers, currentPlan.breadPrayerPublisherId);
                        const phone = getPublisherPhone(publishers, currentPlan.breadPrayerPublisherId);
                        const msg = buildPersonalMemorialReminder(
                          name,
                          'Oración de bendición por el Pan sin Levadura',
                          currentPlan
                        );
                        handleOpenWhatsApp(msg, phone);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Oración Vino */}
              <div className="p-4 rounded-xl border border-rose-200 bg-linear-to-b from-rose-50/50 to-white hover:border-rose-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      Oración por el Vino
                    </span>
                    <Wine className="w-4 h-4 text-rose-600" />
                  </div>
                  <select
                    value={currentPlan.winePrayerPublisherId}
                    onChange={e => handleUpdatePlanField('winePrayerPublisherId', e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 rounded-lg border border-rose-300 bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Seleccionar Hermano Nombrado...</option>
                    {brothers.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.privilege || 'publicador'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 pt-2 border-t border-rose-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Sangre del Pacto</span>
                  {currentPlan.winePrayerPublisherId && (
                    <button
                      onClick={() => {
                        const name = getPublisherName(publishers, currentPlan.winePrayerPublisherId);
                        const phone = getPublisherPhone(publishers, currentPlan.winePrayerPublisherId);
                        const msg = buildPersonalMemorialReminder(
                          name,
                          'Oración de bendición por el Vino Tinto',
                          currentPlan
                        );
                        handleOpenWhatsApp(msg, phone);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Servidores de los Emblemas (Pan y Vino) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wine className="w-5 h-5 text-red-600" />
                  <span>Servidores de los Emblemas (Pan y Vino)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parejas de hermanos ejemplares asignados a pasar las bandejas del pan ácimo y las copas
                  de vino tinto de manera ordenada, respetuosa y sincrónica.
                </p>
              </div>

              <button
                onClick={() => setIsAddSectionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Sección</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPlan.emblemServers.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-800 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{sec.sectionName}</h4>
                    </div>

                    <button
                      onClick={() => handleRemoveSection(sec.id)}
                      className="text-slate-400 hover:text-red-600 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-semibold text-amber-700 block mb-1">
                        🥖 Servidor del Pan
                      </span>
                      <span className="font-bold text-slate-800 block truncate">
                        {getPublisherName(publishers, sec.breadServerPublisherId)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-semibold text-rose-700 block mb-1">
                        🍷 Servidor del Vino
                      </span>
                      <span className="font-bold text-slate-800 block truncate">
                        {getPublisherName(publishers, sec.wineServerPublisherId)}
                      </span>
                    </div>
                  </div>

                  {sec.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                      💡 {sec.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        const breadName = getPublisherName(publishers, sec.breadServerPublisherId);
                        const phone = getPublisherPhone(publishers, sec.breadServerPublisherId);
                        const msg = buildPersonalMemorialReminder(
                          breadName,
                          `Servidor del Pan Ácimo en: ${sec.sectionName}`,
                          currentPlan
                        );
                        handleOpenWhatsApp(msg, phone);
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp Pan</span>
                    </button>

                    <span className="text-slate-300">•</span>

                    <button
                      onClick={() => {
                        const wineName = getPublisherName(publishers, sec.wineServerPublisherId);
                        const phone = getPublisherPhone(publishers, sec.wineServerPublisherId);
                        const msg = buildPersonalMemorialReminder(
                          wineName,
                          `Servidor del Vino Tinto en: ${sec.sectionName}`,
                          currentPlan
                        );
                        handleOpenWhatsApp(msg, phone);
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp Vino</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Acomodadores del Memorial */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Equipo de Acomodadores del Memorial</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recepción cálida de visitas, distribución de hojas de cánticos, conteo de asistencia y
                  control de pasillos y estacionamiento.
                </p>
              </div>

              <button
                onClick={() => setIsAddAttendantModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Acomodador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentPlan.attendants.map(att => {
                const pubName = getPublisherName(publishers, att.publisherId);
                const roleLabels: Record<MemorialAttendant['role'], { label: string; icon: any }> = {
                  entrada_principal: { label: 'Entrada y Bienvenida', icon: Users },
                  pasillo_interior: { label: 'Pasillos y Asientos', icon: CheckCircle2 },
                  estacionamiento: { label: 'Estacionamiento y Accesos', icon: Bus },
                  audio_video_zoom: { label: 'Audio / Zoom Streaming', icon: Volume2 },
                  conteo_asistencia: { label: 'Conteo de Asistencia', icon: FileText },
                };
                const config = roleLabels[att.role] || {
                  label: 'Acomodador',
                  icon: Users,
                };
                const Icon = config.icon;

                return (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <span>{config.label}</span>
                        </span>
                        <button
                          onClick={() => handleRemoveAttendant(att.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {pubName}
                      </span>
                      {att.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {att.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => {
                          const phone = getPublisherPhone(publishers, att.publisherId);
                          const msg = buildPersonalMemorialReminder(
                            pubName,
                            `Acomodador (${config.label})`,
                            currentPlan
                          );
                          handleOpenWhatsApp(msg, phone);
                        }}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                      >
                        <Send className="w-3 h-3" />
                        <span>Notificar WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Preparación de Emblemas & Arreglos Físicos */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Preparación de Emblemas & Arreglos del Salón</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-700 block">🥖 Preparación del Pan Ácimo</span>
                <select
                  value={currentPlan.preparation.breadPreparationPublisherId || ''}
                  onChange={e =>
                    handleUpdatePlanField('preparation.breadPreparationPublisherId', e.target.value)
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Hermano/Familia...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  {currentPlan.preparation.emblemBreadType}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-700 block">🍷 Vino Tinto Puro</span>
                <select
                  value={currentPlan.preparation.wineProviderPublisherId || ''}
                  onChange={e =>
                    handleUpdatePlanField('preparation.wineProviderPublisherId', e.target.value)
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Encargado...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  {currentPlan.preparation.emblemWineType}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-700 block">🌸 Mesa y Flores</span>
                <select
                  value={currentPlan.preparation.tableArrangementPublisherId || ''}
                  onChange={e =>
                    handleUpdatePlanField('preparation.tableArrangementPublisherId', e.target.value)
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Encargado...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Mantel blanco limpio, copas transparentes y flores sencillas sin obstaculizar la vista.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-700 block">🧹 Limpieza General Previa</span>
                <select
                  value={currentPlan.preparation.cleaningPublisherId || ''}
                  onChange={e =>
                    handleUpdatePlanField('preparation.cleaningPublisherId', e.target.value)
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Encargado / Grupo...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Limpieza y ventilación profunda del Salón del Reino previa a la llegada de visitas.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Campaña de Invitación al Memorial */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  <span>Campaña Mundial de Invitación al Memorial</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribución masiva de invitaciones impresas y jw.org durante las 3 semanas previas.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Período de Campaña
                  </span>
                  <span className="font-bold text-slate-800">
                    {currentPlan.campaign.startDate} al {currentPlan.campaign.endDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                <span className="text-[11px] font-semibold text-indigo-700 block mb-1">
                  Invitaciones Recibidas
                </span>
                <span className="text-2xl font-extrabold text-indigo-900">
                  {currentPlan.campaign.totalInvitationsReceived}
                </span>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <span className="text-[11px] font-semibold text-amber-700 block mb-1">
                  Por Publicador
                </span>
                <span className="text-2xl font-extrabold text-amber-900">
                  {currentPlan.campaign.invitationsPerPublisher}
                </span>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 block mb-1">
                  Territorios Cubiertos
                </span>
                <span className="text-2xl font-extrabold text-emerald-900">
                  {currentPlan.campaign.territoriesCoveredCount} /{' '}
                  {currentPlan.campaign.totalCongregationTerritories}
                </span>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
                <span className="text-[11px] font-semibold text-purple-700 block mb-1">
                  Porcentaje de Cobertura
                </span>
                <span className="text-2xl font-extrabold text-purple-900">
                  {Math.round(
                    (currentPlan.campaign.territoriesCoveredCount /
                      (currentPlan.campaign.totalCongregationTerritories || 1)) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Progreso de Cobertura de Territorios de la Congregación</span>
                <span>
                  {currentPlan.campaign.territoriesCoveredCount} de{' '}
                  {currentPlan.campaign.totalCongregationTerritories} Manzanas / Zonas
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-linear-to-r from-indigo-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (currentPlan.campaign.territoriesCoveredCount /
                        (currentPlan.campaign.totalCongregationTerritories || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: ASAMBLEAS TEOCRÁTICAS (CIRCUITO Y REGIONALES)    */}
      {/* ========================================================= */}
      {activeSubTab === 'asambleas' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-6 h-6 text-indigo-600" />
                <span>Asambleas de Circuito & Asambleas Regionales</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Coordinación del departamento de limpieza asignado a la congregación, voluntarios,
                candidatos al bautismo y autobús compartido.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                {(['todos', 'circuito_con_sc', 'circuito_sin_sc', 'regional'] as const).map(
                  f => (
                    <button
                      key={f}
                      onClick={() => setAssemblyFilter(f)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        assemblyFilter === f
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f === 'todos'
                        ? 'Todas'
                        : f === 'circuito_con_sc'
                        ? 'Circuito c/ SC'
                        : f === 'circuito_sin_sc'
                        ? 'Circuito c/ Sucursal'
                        : 'Regional'}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setIsAddAssemblyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Asamblea</span>
              </button>
            </div>
          </div>

          {/* Assemblies Grid / Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar list of Assemblies */}
            <div className="space-y-3">
              {filteredAssemblies.map(ass => {
                const isSelected = ass.id === selectedAssembly?.id;
                return (
                  <div
                    key={ass.id}
                    onClick={() => setSelectedAssemblyId(ass.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ass.type === 'regional'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ass.type === 'regional'
                          ? 'Asamblea Regional'
                          : ass.type === 'circuito_con_sc'
                          ? 'Circuito con SC'
                          : 'Circuito con Sucursal'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Año {ass.serviceYear}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{ass.theme}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{ass.dates}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{ass.venue}</span>
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{ass.volunteers.length} Voluntarios</span>
                      <span>{ass.baptismCandidates.length} Bautismos</span>
                      {ass.busArrangement.hasBus && (
                        <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                          <Bus className="w-3 h-3" />
                          <span>Autobús</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Assembly Detail Panel */}
            {selectedAssembly && (
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                          {selectedAssembly.circuitNumber || 'Programa Oficial'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{selectedAssembly.dates}</span>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                        {selectedAssembly.theme}
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedAssembly.venue}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const msg = buildAssemblyWhatsApp(selectedAssembly, publishers);
                          handleOpenWhatsApp(msg);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Avisar WhatsApp</span>
                      </button>

                      <button
                        onClick={() => deleteTheocraticAssembly(selectedAssembly.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar asamblea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cleaning Department Assigned */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        🧹 Departamento Asignado para Limpieza del Salón de Asambleas
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {selectedAssembly.assignedCleaningDepartment ||
                          'Sector de la asamblea por asignar'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Coordinador de la congregación:{' '}
                        <strong>
                          {getPublisherName(
                            publishers,
                            selectedAssembly.cleaningCoordinatorPublisherId
                          )}
                        </strong>
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs inline-block">
                        {
                          selectedAssembly.volunteers.filter(v => v.department === 'limpieza')
                            .length
                        }{' '}
                        Hermanos asignados
                      </span>
                    </div>
                  </div>

                  {/* Bus Arrangement Card */}
                  {selectedAssembly.busArrangement.hasBus && (
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bus className="w-5 h-5 text-indigo-700" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Arreglos de Autobús de la Congregación
                          </h4>
                        </div>
                        <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                          {selectedAssembly.busArrangement.seatsBooked} /{' '}
                          {selectedAssembly.busArrangement.seatsTotal} Asientos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Compañía</span>
                          <span className="font-semibold text-slate-800">
                            {selectedAssembly.busArrangement.busCompany || 'Contratado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Salida</span>
                          <span className="font-semibold text-slate-800">
                            {selectedAssembly.busArrangement.departureTime} hrs
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Punto</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {selectedAssembly.busArrangement.departureLocation}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Aporte / Asiento</span>
                          <span className="font-bold text-emerald-700">
                            {selectedAssembly.busArrangement.farePerSeat} €
                          </span>
                        </div>
                      </div>

                      {/* Seats Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((selectedAssembly.busArrangement.seatsBooked || 0) /
                                (selectedAssembly.busArrangement.seatsTotal || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Candidates for Baptism */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-600" />
                        <span>Candidatos al Bautismo de la Congregación</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-100 text-cyan-800 font-bold">
                          {selectedAssembly.baptismCandidates.length}
                        </span>
                      </h4>

                      <button
                        onClick={() => setIsAddBaptismCandidateModalOpen(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Candidato</span>
                      </button>
                    </div>

                    {selectedAssembly.baptismCandidates.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No hay candidatos registrados aún para esta asamblea.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedAssembly.baptismCandidates.map(cand => (
                          <div
                            key={cand.id}
                            className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/40 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {getPublisherName(publishers, cand.publisherId)}
                              </span>
                              <span className="text-[11px] text-cyan-800 flex items-center gap-1 mt-0.5">
                                <Check className="w-3 h-3 text-cyan-600" />
                                <span>Preguntas repasadas por ancianos</span>
                              </span>
                            </div>

                            <button
                              onClick={() => handleRemoveBaptismCandidate(cand.id)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Volunteers Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-700" />
                        <span>Voluntarios de la Congregación en Departamentos</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800 font-bold">
                          {selectedAssembly.volunteers.length}
                        </span>
                      </h4>

                      <button
                        onClick={() => setIsAddVolunteerModalOpen(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Voluntario</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Hermano</th>
                            <th className="py-2.5 px-3">Departamento</th>
                            <th className="py-2.5 px-3">Turno / Asignación</th>
                            <th className="py-2.5 px-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedAssembly.volunteers.map(vol => (
                            <tr key={vol.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {getPublisherName(publishers, vol.publisherId)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {vol.department}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{vol.roleOrShift}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveVolunteer(vol.id)}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: CHECKLIST TEOCRÁTICO                             */}
      {/* ========================================================= */}
      {activeSubTab === 'checklist' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Lista de Verificación (Checklist Teocrático) del Memorial</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Supervisión minuciosa para los ancianos antes de la noche del Memorial para que
                "todas las cosas se hagan de forma digna y ordenada" (1 Cor. 14:40).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                Estado General: {checklistReadyCount} de {checklist.length} Aspectos Listos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklist.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                  item.isReady
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.isReady ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.isReady
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.isReady ? 'Listo' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  {item.assignedTo && (
                    <span className="text-[11px] font-semibold text-slate-500 block mt-1">
                      Asignado: {item.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: INFORME OFICIAL A LA SUCURSAL                    */}
      {/* ========================================================= */}
      {activeSubTab === 'informe_sucursal' && currentPlan && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                <span>Informe Oficial de la Conmemoración para la Sucursal (Betel)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Conteo final de asistencia presencial y conexiones, número de participantes ungidos de
                los emblemas y fecha de remisión a la sucursal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const msg = buildMemorialReportWhatsApp(currentPlan);
                  handleOpenWhatsApp(msg);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Notificar Ancianos WhatsApp</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveReportNumbers} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Presencial */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  1. Asistencia Presencial (Salón)
                </span>
                <input
                  type="number"
                  min="0"
                  value={currentPlan.report.inPersonAttendance}
                  onChange={e =>
                    handleUpdatePlanField('report.inPersonAttendance', Number(e.target.value))
                  }
                  className="w-full text-2xl font-extrabold text-slate-900 p-2.5 rounded-xl border border-slate-300 bg-white"
                />
                <p className="text-[11px] text-slate-400">Personas físicas presentes en el auditorio</p>
              </div>

              {/* Streaming */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  2. Conexiones Zoom / Streaming
                </span>
                <input
                  type="number"
                  min="0"
                  value={currentPlan.report.streamingAttendance}
                  onChange={e =>
                    handleUpdatePlanField('report.streamingAttendance', Number(e.target.value))
                  }
                  className="w-full text-2xl font-extrabold text-slate-900 p-2.5 rounded-xl border border-slate-300 bg-white"
                />
                <p className="text-[11px] text-slate-400">
                  Total de personas conectadas en línea por enfermedad
                </p>
              </div>

              {/* Total Calculado */}
              <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  ⭐ ASISTENCIA TOTAL
                </span>
                <div className="text-3xl font-black text-indigo-950 pt-1">
                  {Number(currentPlan.report.inPersonAttendance || 0) +
                    Number(currentPlan.report.streamingAttendance || 0)}
                </div>
                <p className="text-[11px] text-indigo-700">
                  Suma oficial para remitir en el informe anual a Betel
                </p>
              </div>
            </div>

            {/* Participantes Ungidos */}
            <div className="p-5 rounded-2xl bg-red-50/60 border border-red-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-red-950 flex items-center gap-2">
                    <Wine className="w-4 h-4 text-red-600" />
                    <span>Participantes de los Emblemas (Ungidos)</span>
                  </h4>
                  <p className="text-xs text-red-800">
                    Número exacto de personas que comieron del pan ácimo y bebieron del vino tinto.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-900">Número de participantes:</span>
                  <input
                    type="number"
                    min="0"
                    value={currentPlan.report.partakersCount}
                    onChange={e =>
                      handleUpdatePlanField('report.partakersCount', Number(e.target.value))
                    }
                    className="w-20 text-center font-extrabold text-base p-1.5 rounded-lg border border-red-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Observaciones Confidenciales de los Participantes (Opcional para el Secretario)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sin participantes ungidos en la congregación local."
                  value={currentPlan.report.partakerNames || ''}
                  onChange={e => handleUpdatePlanField('report.partakerNames', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Reported Checkbox */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <SplashCheckbox
                size="sm"
                checked={currentPlan.report.reportedToBranch}
                onChange={e =>
                  handleUpdatePlanField('report.reportedToBranch', e.target.checked)
                }
                label="Marcar como Enviado a la Sucursal (jw.org / Hub Betel)"
              />

              {currentPlan.report.reportedToBranch && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Fecha de Envío:</span>
                  <input
                    type="date"
                    value={currentPlan.report.reportedDate || ''}
                    onChange={e => handleUpdatePlanField('report.reportedDate', e.target.value)}
                    className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Informe Oficial</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR SECCIÓN SERVIDORES EMBLEMAS                */}
      {/* ========================================================= */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wine className="w-5 h-5 text-red-600" />
                <span>Agregar Sección para Emblemas</span>
              </h3>
              <button
                onClick={() => setIsAddSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre de la Sección / Pasillo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pasillo Central Derecho (Filas 11 a 20)"
                  value={newSection.sectionName}
                  onChange={e => setNewSection({ ...newSection, sectionName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  🥖 Hermano para Servir el Pan
                </label>
                <select
                  required
                  value={newSection.breadServerPublisherId}
                  onChange={e =>
                    setNewSection({ ...newSection, breadServerPublisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">Seleccionar Hermano Nombrado...</option>
                  {brothers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.privilege || 'publicador'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  🍷 Hermano para Servir el Vino
                </label>
                <select
                  required
                  value={newSection.wineServerPublisherId}
                  onChange={e =>
                    setNewSection({ ...newSection, wineServerPublisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="">Seleccionar Hermano Nombrado...</option>
                  {brothers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.privilege || 'publicador'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instrucciones o Notas Especiales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Iniciar por la primera fila hacia atrás de forma continua"
                  value={newSection.notes}
                  onChange={e => setNewSection({ ...newSection, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
                >
                  Guardar Sección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR ACOMODADOR MEMORIAL                        */}
      {/* ========================================================= */}
      {isAddAttendantModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Agregar Acomodador del Memorial</span>
              </h3>
              <button
                onClick={() => setIsAddAttendantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAttendant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Puesto o Rol</label>
                <select
                  value={newAttendant.role}
                  onChange={e =>
                    setNewAttendant({
                      ...newAttendant,
                      role: e.target.value as MemorialAttendant['role'],
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="entrada_principal">Entrada Principal y Recepción</option>
                  <option value="pasillo_interior">Pasillo Interior y Búsqueda de Asientos</option>
                  <option value="estacionamiento">Estacionamiento y Accesos Vehiculares</option>
                  <option value="audio_video_zoom">Audio, Micrófonos y Streaming Zoom</option>
                  <option value="conteo_asistencia">Conteo Oficial de Asistencia</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hermano Asignado</label>
                <select
                  required
                  value={newAttendant.publisherId}
                  onChange={e =>
                    setNewAttendant({ ...newAttendant, publisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Seleccionar Hermano...</option>
                  {brothers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.privilege || 'publicador'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas o Pautas</label>
                <input
                  type="text"
                  placeholder="Ej. Estar en la puerta 40 minutos antes del inicio"
                  value={newAttendant.notes}
                  onChange={e => setNewAttendant({ ...newAttendant, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAttendantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Agregar Acomodador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVA ASAMBLEA                                     */}
      {/* ========================================================= */}
      {isAddAssemblyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>Programar Nueva Asamblea Teocrática</span>
              </h3>
              <button
                onClick={() => setIsAddAssemblyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssembly} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Asamblea</label>
                  <select
                    value={newAssembly.type}
                    onChange={e =>
                      setNewAssembly({ ...newAssembly, type: e.target.value as AssemblyType })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="circuito_con_sc">Circuito con SC (1 día)</option>
                    <option value="circuito_sin_sc">Circuito c/ Representante Sucursal (1 día)</option>
                    <option value="regional">Asamblea Regional (3 días)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Año de Servicio</label>
                  <input
                    type="number"
                    value={newAssembly.serviceYear}
                    onChange={e =>
                      setNewAssembly({ ...newAssembly, serviceYear: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lema Oficial</label>
                <input
                  type="text"
                  required
                  placeholder='Ej. "¡Prediquemos las buenas noticias con valor!"'
                  value={newAssembly.theme}
                  onChange={e => setNewAssembly({ ...newAssembly, theme: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fechas</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sábado 7 de Noviembre de 2026"
                    value={newAssembly.dates}
                    onChange={e => setNewAssembly({ ...newAssembly, dates: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sede / Local</label>
                  <input
                    type="text"
                    placeholder="Ej. Salón de Asambleas de Bellavista"
                    value={newAssembly.venue}
                    onChange={e => setNewAssembly({ ...newAssembly, venue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  🧹 Departamento de Limpieza Asignado a Nuestra Congregación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pasillos Este y Graderías Sector B"
                  value={newAssembly.assignedCleaningDepartment}
                  onChange={e =>
                    setNewAssembly({ ...newAssembly, assignedCleaningDepartment: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Coordinador de Limpieza de la Congregación
                </label>
                <select
                  value={newAssembly.cleaningCoordinatorPublisherId}
                  onChange={e =>
                    setNewAssembly({
                      ...newAssembly,
                      cleaningCoordinatorPublisherId: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Hermano...</option>
                  {brothers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.privilege || 'publicador'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bus toggle */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <SplashCheckbox
                  size="sm"
                  checked={newAssembly.hasBus}
                  onChange={e => setNewAssembly({ ...newAssembly, hasBus: e.target.checked })}
                  label="Contratar Autobús de la Congregación"
                />

                {newAssembly.hasBus && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Plazas Totales
                      </label>
                      <input
                        type="number"
                        value={newAssembly.seatsTotal}
                        onChange={e =>
                          setNewAssembly({ ...newAssembly, seatsTotal: Number(e.target.value) })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Aporte por Asiento (€)
                      </label>
                      <input
                        type="number"
                        value={newAssembly.farePerSeat}
                        onChange={e =>
                          setNewAssembly({ ...newAssembly, farePerSeat: Number(e.target.value) })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAssemblyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Crear Asamblea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR VOLUNTARIO ASAMBLEA                        */}
      {/* ========================================================= */}
      {isAddVolunteerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Agregar Voluntario de la Congregación</span>
              </h3>
              <button
                onClick={() => setIsAddVolunteerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVolunteer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Publicador / Hermano</label>
                <select
                  required
                  value={newVolunteer.publisherId}
                  onChange={e =>
                    setNewVolunteer({ ...newVolunteer, publisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Publicador...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                <select
                  value={newVolunteer.department}
                  onChange={e =>
                    setNewVolunteer({
                      ...newVolunteer,
                      department: e.target.value as AssemblyVolunteer['department'],
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="limpieza">Limpieza</option>
                  <option value="acomodadores">Acomodadores</option>
                  <option value="audio_video">Audio y Video</option>
                  <option value="primeros_auxilios">Primeros Auxilios</option>
                  <option value="bautismo">Bautismo</option>
                  <option value="estacionamiento">Estacionamiento</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rol o Turno Específico
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Limpieza intermedia tras el programa matutino"
                  value={newVolunteer.roleOrShift}
                  onChange={e => setNewVolunteer({ ...newVolunteer, roleOrShift: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddVolunteerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  Guardar Voluntario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR CANDIDATO BAUTISMO                         */}
      {/* ========================================================= */}
      {isAddBaptismCandidateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-600" />
                <span>Registrar Candidato al Bautismo</span>
              </h3>
              <button
                onClick={() => setIsAddBaptismCandidateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBaptismCandidate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidato</label>
                <select
                  required
                  value={newBaptismCandidate.publisherId}
                  onChange={e =>
                    setNewBaptismCandidate({ ...newBaptismCandidate, publisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">Seleccionar Publicador...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ancianos que Repasaron las Preguntas del Libro Organizados
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Mendoza y David Silva"
                  value={newBaptismCandidate.reviewedByElders}
                  onChange={e =>
                    setNewBaptismCandidate({
                      ...newBaptismCandidate,
                      reviewedByElders: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBaptismCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md"
                >
                  Confirmar Candidato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
