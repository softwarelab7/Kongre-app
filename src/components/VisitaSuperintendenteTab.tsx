// src/components/VisitaSuperintendenteTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  CircuitOverseerVisit,
  MealArrangement,
  MinistryArrangement,
  SpecialMeeting,
  VisitChecklistItem,
} from '../types';
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Utensils,
  Share2,
  Printer,
  Edit2,
  CheckCircle2,
  AlertCircle,
  User,
  Users,
  Music,
  HeartHandshake,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Phone,
  Home,
  Compass,
  FileCheck,
  Building,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';
import {
  computeCircuitVisitExecutiveReport,
  printCircuitOverseerExecutiveDossierA4,
  buildCircuitVisitExecutiveWhatsAppSummary,
} from '../utils/secretaryAuditEngine';

export const VisitaSuperintendenteTab: React.FC = () => {
  const {
    circuitVisit,
    publishers,
    publishersMap,
    settings,
    weeks,
    monthlyReports,
    territories,
    preachingGroups,
    auxPioneerRequests,
    updateCircuitVisit,
    updateMealArrangement,
    updateMinistryArrangement,
    toggleVisitChecklistItem,
    addSpecialMeeting,
    removeSpecialMeeting,
  } = useCongregation();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    'programa' | 'comidas' | 'predicacion' | 'checklist' | 'carpeta_ejecutiva'
  >('programa');
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>('2025-2026');

  // Modals
  const [isEditVisitModalOpen, setIsEditVisitModalOpen] = useState(false);
  const [editMealModal, setEditMealModal] = useState<MealArrangement | null>(null);
  const [editMinistryModal, setEditMinistryModal] = useState<MinistryArrangement | null>(null);
  const [isAddMeetingModalOpen, setIsAddMeetingModalOpen] = useState(false);

  // Form states for Editing Visit details
  const [visitFormData, setVisitFormData] = useState<CircuitOverseerVisit | null>(null);

  // Form state for Meal Edit
  const [mealFormData, setMealFormData] = useState<{
    hostPublisherId: string;
    hostName: string;
    hostPhone: string;
    location: string;
    notes: string;
    isConfirmed: boolean;
  }>({
    hostPublisherId: '',
    hostName: '',
    hostPhone: '',
    location: '',
    notes: '',
    isConfirmed: true,
  });

  // Form state for Ministry Edit
  const [minFormData, setMinFormData] = useState<{
    time: string;
    meetingPoint: string;
    territoryNumber: string;
    coCompanionPublisherId: string;
    wifeCompanionPublisherId: string;
    groupNumber: number;
    notes: string;
  }>({
    time: '09:30',
    meetingPoint: '',
    territoryNumber: '',
    coCompanionPublisherId: '',
    wifeCompanionPublisherId: '',
    groupNumber: 1,
    notes: '',
  });

  // Form state for New Special Meeting
  const [newMeetingData, setNewMeetingData] = useState<{
    title: string;
    date: string;
    time: string;
    location: string;
    attendeesDescription: string;
    notes: string;
  }>({
    title: '',
    date: circuitVisit?.startDate || new Date().toISOString().slice(0, 10),
    time: '18:00 - 19:00',
    location: 'Salón del Reino',
    attendeesDescription: '',
    notes: '',
  });

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!circuitVisit) {
    return (
      <div className="bg-white dark:bg-[#121216] p-8 rounded-2xl border border-zinc-200 dark:border-[#27272A] text-center shadow-xs">
        <p className="text-zinc-600 dark:text-[#A1A1AA]">No hay información configurada para la visita del Superintendente de Circuito.</p>
      </div>
    );
  }

  // Checklist calculations
  const checklistStats = useMemo(() => {
    const total = circuitVisit.checklist.length;
    const completed = circuitVisit.checklist.filter(c => c.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [circuitVisit.checklist]);

  // Meals confirmed calculations
  const mealsStats = useMemo(() => {
    const total = circuitVisit.meals.length;
    const confirmed = circuitVisit.meals.filter(m => m.isConfirmed).length;
    return { total, confirmed };
  }, [circuitVisit.meals]);

  // Executive Report (S-1, S-21, S-88, S-13) for Circuit Overseer Visit
  const executiveReport = useMemo(() => {
    return computeCircuitVisitExecutiveReport({
      publishers,
      weeks,
      monthlyReports,
      territories,
      preachingGroups,
      auxPioneerRequests,
      circuitVisit,
      settings,
      serviceYear: selectedServiceYear,
    });
  }, [
    publishers,
    weeks,
    monthlyReports,
    territories,
    preachingGroups,
    auxPioneerRequests,
    circuitVisit,
    settings,
    selectedServiceYear,
  ]);

  // WhatsApp Share: Full Program
  const handleShareFullProgramWhatsApp = () => {
    const v = circuitVisit;
    const specialMeetingsList = v.specialMeetings
      .map(m => `• *${m.title}*: ${m.date} a las ${m.time} (${m.attendeesDescription})`)
      .join('\n');

    const ministryList = v.ministry
      .map(m => {
        const coComp = m.coCompanionPublisherId ? publishersMap.get(m.coCompanionPublisherId)?.name : 'Por asignar';
        const wifeComp = m.wifeCompanionPublisherId ? publishersMap.get(m.wifeCompanionPublisherId)?.name : 'Por asignar';
        return `• *${m.day} ${m.time}*: ${m.meetingPoint} (Territorio: ${m.territoryNumber || 'S/N'})\n   - Acompañante SC: ${coComp}\n   - Acompañante Hna. ${v.wifeName || 'Esposa'}: ${wifeComp}`;
      })
      .join('\n\n');

    const message = `🏛 *VISITA DEL SUPERINTENDENTE DE CIRCUITO*
*${settings.congregationName} • ${v.circuitNumber}*
📅 *Semana del ${v.startDate} al ${v.endDate}*
👤 *Hno. ${v.overseerName} y Hna. ${v.wifeName || 'Esposa'}*

🎤 *DISCURSOS ESPECIALES:*
• *Reunión entre semana:* "${v.midweekTalkTheme}" (Cántico ${v.midweekSongNumber || 'a elegir'})
• *Discurso Público:* "${v.weekendPublicTalkTheme}"
• *Discurso de Conclusión:* "${v.weekendFinalTalkTheme}" (Cántico final ${v.weekendSongNumber || 'a elegir'})

👥 *REUNIONES ESPECIALES:*
${specialMeetingsList || 'Ninguna registrada.'}

🚶‍♂️ *SALIDAS AL MINISTERIO:*
${ministryList || 'Ver detalles en el Salón.'}

🍽 *HOSPITALIDAD & COMIDAS:*
Las familias asignadas cuentan con el itinerario de hospitalidad coordinado con el cuerpo de ancianos.

¡Animamos a toda la congregación a brindar su pleno apoyo a esta semana de estímulo espiritual! (Rom. 1:11, 12)`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  // WhatsApp Share: Individual Host Family
  const handleShareMealWhatsApp = (meal: MealArrangement) => {
    const v = circuitVisit;
    const message = `Estimada ${meal.hostName || 'Familia'}:

Reciban un afectuoso saludo teocrático. Les confirmamos con aprecio el arreglo de hospitalidad para la visita del Superintendente de Circuito:

🍽 *Comida:* ${meal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'} del *${meal.day} ${meal.date}*
📍 *Lugar:* ${meal.location || 'Su hogar'}
👥 *Invitados:* Hno. ${v.overseerName} y su esposa Hna. ${v.wifeName || 'su esposa'}
${v.dietaryPreferences ? `\n⚠️ *Preferencias / Sugerencias alimentarias:*\n${v.dietaryPreferences}` : ''}
${meal.notes ? `\n📝 *Notas:* ${meal.notes}` : ''}

¡Agradecemos mucho su espíritu dispuesto y hospitalidad hacia nuestros hermanos siervos viajantes! (Heb. 13:2)`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Open Edit Visit Modal
  const openEditVisitModal = () => {
    setVisitFormData({ ...circuitVisit });
    setIsEditVisitModalOpen(true);
  };

  // Save Visit Details
  const handleSaveVisitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitFormData) return;
    updateCircuitVisit(visitFormData);
    setIsEditVisitModalOpen(false);
    showToast('Datos de la visita del Superintendente de Circuito actualizados.');
  };

  // Open Edit Meal Modal
  const openEditMealModal = (meal: MealArrangement) => {
    setEditMealModal(meal);
    setMealFormData({
      hostPublisherId: meal.hostPublisherId || '',
      hostName: meal.hostName || '',
      hostPhone: meal.hostPhone || '',
      location: meal.location || '',
      notes: meal.notes || '',
      isConfirmed: meal.isConfirmed,
    });
  };

  // Save Meal
  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMealModal) return;

    let hostName = mealFormData.hostName;
    if (mealFormData.hostPublisherId) {
      const pub = publishersMap.get(mealFormData.hostPublisherId);
      if (pub) hostName = `Familia ${pub.name}`;
    }

    updateMealArrangement({
      ...editMealModal,
      hostPublisherId: mealFormData.hostPublisherId || undefined,
      hostName: hostName.trim() || 'Familia por asignar',
      hostPhone: mealFormData.hostPhone.trim() || undefined,
      location: mealFormData.location.trim() || undefined,
      notes: mealFormData.notes.trim() || undefined,
      isConfirmed: mealFormData.isConfirmed,
    });

    setEditMealModal(null);
    showToast('Arreglo de hospitalidad actualizado.');
  };

  // Open Edit Ministry Modal
  const openEditMinistryModal = (min: MinistryArrangement) => {
    setEditMinistryModal(min);
    setMinFormData({
      time: min.time || '09:30',
      meetingPoint: min.meetingPoint || '',
      territoryNumber: min.territoryNumber || '',
      coCompanionPublisherId: min.coCompanionPublisherId || '',
      wifeCompanionPublisherId: min.wifeCompanionPublisherId || '',
      groupNumber: min.groupNumber || 1,
      notes: min.notes || '',
    });
  };

  // Save Ministry
  const handleSaveMinistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMinistryModal) return;

    updateMinistryArrangement({
      ...editMinistryModal,
      time: minFormData.time.trim(),
      meetingPoint: minFormData.meetingPoint.trim() || 'Salón del Reino',
      territoryNumber: minFormData.territoryNumber.trim() || undefined,
      coCompanionPublisherId: minFormData.coCompanionPublisherId || undefined,
      wifeCompanionPublisherId: minFormData.wifeCompanionPublisherId || undefined,
      groupNumber: Number(minFormData.groupNumber) || 1,
      notes: minFormData.notes.trim() || undefined,
    });

    setEditMinistryModal(null);
    showToast('Salida de predicación actualizada.');
  };

  // Save New Special Meeting
  const handleAddSpecialMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingData.title.trim()) return;

    addSpecialMeeting({
      title: newMeetingData.title.trim(),
      date: newMeetingData.date,
      time: newMeetingData.time.trim(),
      location: newMeetingData.location.trim() || 'Salón del Reino',
      attendeesDescription: newMeetingData.attendeesDescription.trim() || 'Hermanos convocados',
      notes: newMeetingData.notes.trim() || undefined,
    });

    setIsAddMeetingModalOpen(false);
    setNewMeetingData({
      title: '',
      date: circuitVisit.startDate,
      time: '18:00 - 19:00',
      location: 'Salón del Reino',
      attendeesDescription: '',
      notes: '',
    });
    showToast('Reunión especial agregada.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181F] text-[#F4F4F5] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-[#27272A] animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Barra de Acciones de la Visita del SC (Unified Container) */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase font-mono tabular-nums bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
            {circuitVisit.circuitNumber || 'Circuito'}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {circuitVisit.status === 'proxima' ? 'Próxima Visita' : circuitVisit.status === 'en_curso' ? 'En Curso' : 'Concluida'}
          </span>
          <span className="text-xs font-semibold text-zinc-700 dark:text-[#F4F4F5]">
            Hno. {circuitVisit.overseerName}{circuitVisit.wifeName ? ` y Hna. ${circuitVisit.wifeName}` : ''}
          </span>
          <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] hidden md:inline font-mono tabular-nums">
            • Semana del {circuitVisit.startDate} al {circuitVisit.endDate}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleShareFullProgramWhatsApp}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Programa</span>
          </button>

          <button
            onClick={() => printCircuitOverseerExecutiveDossierA4(executiveReport, settings, circuitVisit)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            title="Imprimir Carpeta Ejecutiva A4 para el Superintendente de Circuito"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Carpeta Ejecutiva A4</span>
          </button>

          <button
            onClick={openEditVisitModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-bold rounded-xl transition border border-zinc-200/80 dark:border-[#27272A] shadow-xs active:scale-95 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Datos</span>
          </button>
        </div>
      </div>

      {/* Quick Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-[#121216] p-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
          <div className="text-zinc-500 dark:text-[#A1A1AA] font-medium mb-1">Discurso Entre Semana (30m)</div>
          <div className="font-semibold text-zinc-900 dark:text-[#F4F4F5] truncate" title={circuitVisit.midweekTalkTheme}>
            {circuitVisit.midweekTalkTheme}
          </div>
          <div className="text-indigo-600 dark:text-indigo-400 text-[11px] mt-0.5 font-bold font-mono tabular-nums">Cántico {circuitVisit.midweekSongNumber || '-'}</div>
        </div>

        <div className="bg-white dark:bg-[#121216] p-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
          <div className="text-zinc-500 dark:text-[#A1A1AA] font-medium mb-1">Discurso Público Fin de Semana</div>
          <div className="font-semibold text-zinc-900 dark:text-[#F4F4F5] truncate" title={circuitVisit.weekendPublicTalkTheme}>
            {circuitVisit.weekendPublicTalkTheme}
          </div>
          <div className="text-zinc-400 dark:text-zinc-500 text-[11px] mt-0.5">Reunión pública de 30 min</div>
        </div>

        <div className="bg-white dark:bg-[#121216] p-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
          <div className="text-zinc-500 dark:text-[#A1A1AA] font-medium mb-1">Hospitalidad & Comidas</div>
          <div className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
            {mealsStats.confirmed} de {mealsStats.total} Confirmadas
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-0.5 font-bold">Almuerzos y cenas organizadas</div>
        </div>

        <div className="bg-white dark:bg-[#121216] p-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
          <div className="text-zinc-500 dark:text-[#A1A1AA] font-medium mb-1">Registros & Auditoría (Checklist)</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{checklistStats.percent}% completado</span>
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-mono tabular-nums">({checklistStats.completed}/{checklistStats.total})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-[#18181F] rounded-full h-1 mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${checklistStats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white dark:bg-[#121216] p-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('programa')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
            activeSubTab === 'programa'
              ? 'bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-bold border border-zinc-200 dark:border-[#27272A] shadow-xs'
              : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F]/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span>Programa & Discursos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comidas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
            activeSubTab === 'comidas'
              ? 'bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-bold border border-zinc-200 dark:border-[#27272A] shadow-xs'
              : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F]/50'
          }`}
        >
          <Utensils className="w-4 h-4 text-zinc-500" />
          <span>Comidas & Hospitalidad <span className="font-mono tabular-nums">({mealsStats.confirmed}/{mealsStats.total})</span></span>
        </button>

        <button
          onClick={() => setActiveSubTab('predicacion')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
            activeSubTab === 'predicacion'
              ? 'bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-bold border border-zinc-200 dark:border-[#27272A] shadow-xs'
              : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F]/50'
          }`}
        >
          <Compass className="w-4 h-4 text-zinc-500" />
          <span>Plan de Predicación Semanal</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
            activeSubTab === 'checklist'
              ? 'bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-bold border border-zinc-200 dark:border-[#27272A] shadow-xs'
              : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F]/50'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-zinc-500" />
          <span>Registros & Archivo <span className="font-mono tabular-nums">({checklistStats.percent}%)</span></span>
        </button>

        <button
          onClick={() => setActiveSubTab('carpeta_ejecutiva')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
            activeSubTab === 'carpeta_ejecutiva'
              ? 'bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-bold border border-zinc-200 dark:border-[#27272A] shadow-xs'
              : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-50 dark:hover:bg-[#18181F]/50'
          }`}
        >
          <FileCheck className="w-4 h-4 text-zinc-500" />
          <span>Carpeta Ejecutiva (S-1 / S-21 / S-88 / S-13)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: PROGRAMA & DISCURSOS */}
      {/* ========================================================= */}
      {activeSubTab === 'programa' && (
        <div className="space-y-6">
          {/* Talk Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Midweek service talk */}
            <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                  Reunión Entre Semana
                </span>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">30 Minutos</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] leading-snug">
                  {circuitVisit.midweekTalkTheme}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                  Discurso de servicio del Superintendente de Circuito tras las partes de Nuestra Vida Cristiana.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-zinc-500" /> Cántico final:
                </span>
                <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                  {circuitVisit.midweekSongNumber ? `Cántico #${circuitVisit.midweekSongNumber}` : 'A elegir por el SC'}
                </span>
              </div>
            </div>

            {/* Weekend public talk */}
            <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                  Fin de Semana • Público
                </span>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">30 Minutos</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] leading-snug">
                  {circuitVisit.weekendPublicTalkTheme}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                  Pronunciado por el Hno. {circuitVisit.overseerName} para toda la congregación e invitados.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" /> Horario:
                </span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                  {settings.weekendMeetingDay} {settings.weekendMeetingTime}
                </span>
              </div>
            </div>

            {/* Weekend concluding talk */}
            <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                  Fin de Semana • Conclusión
                </span>
                <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">30 Minutos</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] leading-snug">
                  {circuitVisit.weekendFinalTalkTheme}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                  Discurso final de estímulo y despedida tras el estudio de La Atalaya.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cántico de despedida:
                </span>
                <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                  {circuitVisit.weekendSongNumber ? `Cántico #${circuitVisit.weekendSongNumber}` : 'A elegir por el SC'}
                </span>
              </div>
            </div>
          </div>

          {/* Special Meetings Section */}
          <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Reuniones Especiales Convocadas</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Reuniones con precursores, siervos ministeriales y ancianos durante la semana.
                </p>
              </div>
              <button
                onClick={() => setIsAddMeetingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Reunión</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {circuitVisit.specialMeetings.map((sp) => (
                <div key={sp.id} className="p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F]/40 space-y-2 relative group">
                  <button
                    onClick={() => removeSpecialMeeting(sp.id)}
                    className="absolute top-3 right-3 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer"
                    title="Eliminar reunión"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm pr-6">{sp.title}</h4>
                  <div className="space-y-1 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                    <p className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{sp.date} • {sp.time}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{sp.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-zinc-700 dark:text-[#F4F4F5] font-medium">
                      <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{sp.attendeesDescription}</span>
                    </p>
                  </div>
                  {sp.notes && (
                    <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] italic bg-white dark:bg-[#121216] p-2 rounded border border-zinc-200/60 dark:border-[#27272A] mt-1">
                      {sp.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: COMIDAS & HOSPITALIDAD */}
      {/* ========================================================= */}
      {activeSubTab === 'comidas' && (
        <div className="space-y-6">
          {/* Preferences Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] p-4 rounded-xl space-y-1.5 text-zinc-700 dark:text-zinc-300 text-xs shadow-xs">
              <div className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-[#F4F4F5]">
                <Utensils className="w-4 h-4 text-amber-500" />
                <span>Preferencias Alimentarias & Alergias de los Hermanos Visitantes:</span>
              </div>
              <p className="leading-relaxed">
                {circuitVisit.dietaryPreferences || 'Sin requerimientos especiales registrados.'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] p-4 rounded-xl space-y-1.5 text-zinc-700 dark:text-zinc-300 text-xs shadow-xs">
              <div className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-[#F4F4F5]">
                <Home className="w-4 h-4 text-zinc-500" />
                <span>Alojamiento & Hospedaje:</span>
              </div>
              <p className="leading-relaxed">
                {circuitVisit.lodgingNotes || 'Apartamento del Salón del Reino o familia anfitriona designada.'}
              </p>
            </div>
          </div>

          {/* Meals Table / Grid */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Calendario de Comidas (Martes a Domingo)</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Familias anfitrionas coordinadas para almorzar o cenar con el superintendente de circuito y su esposa.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full font-mono tabular-nums bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                {mealsStats.confirmed} de {mealsStats.total} confirmadas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4">Día & Comida</th>
                    <th className="py-3 px-4">Familia Anfitriona</th>
                    <th className="py-3 px-4">Lugar / Dirección</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Observaciones</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                  {circuitVisit.meals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                          {meal.day} {meal.date.slice(5)}
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                          {meal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>{meal.hostName || 'Por asignar'}</span>
                        </div>
                        {meal.hostPhone && (
                          <div className="text-xs text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5 font-mono tabular-nums">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{meal.hostPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                        {meal.location || 'Salón del Reino o casa anfitriona'}
                      </td>

                      <td className="py-3.5 px-4">
                        {meal.isConfirmed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Confirmada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pendiente
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-xs truncate" title={meal.notes}>
                        {meal.notes || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleShareMealWhatsApp(meal)}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition cursor-pointer"
                            title="Enviar itinerario a la familia por WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditMealModal(meal)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition cursor-pointer"
                            title="Editar asignación de comida"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: PLAN DE PREDICACIÓN SEMANAL */}
      {/* ========================================================= */}
      {activeSubTab === 'predicacion' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Salidas al Ministerio con el Superintendente y su Esposa</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Coordinación de los grupos de predicación, puntos de reunión y parejas asignadas para acompañarlos.
                </p>
              </div>

              <button
                onClick={() => {
                  const v = circuitVisit;
                  const ministryList = v.ministry
                    .map(m => {
                      const coComp = m.coCompanionPublisherId ? publishersMap.get(m.coCompanionPublisherId)?.name : 'Por asignar';
                      const wifeComp = m.wifeCompanionPublisherId ? publishersMap.get(m.wifeCompanionPublisherId)?.name : 'Por asignar';
                      return `📍 *${m.day} ${m.time}* (${m.meetingPoint})
• Territorio: #${m.territoryNumber || 'S/N'} (Grupo ${m.groupNumber || '1'})
• Acompañante SC: ${coComp}
• Acompañante Hna. ${v.wifeName || 'Esposa'}: ${wifeComp}
${m.notes ? `• Nota: ${m.notes}` : ''}`;
                    })
                    .join('\n\n');

                  const msg = `🚶‍♂️ *PLAN DE PREDICACIÓN DE LA SEMANA DE LA VISITA*
🏛 *${settings.congregationName}*

${ministryList}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir Salidas por WhatsApp</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circuitVisit.ministry.map((m) => {
                const coComp = m.coCompanionPublisherId ? publishersMap.get(m.coCompanionPublisherId) : null;
                const wifeComp = m.wifeCompanionPublisherId ? publishersMap.get(m.wifeCompanionPublisherId) : null;

                return (
                  <div key={m.id} className="p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F]/40 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm font-mono tabular-nums">
                            {m.day} {m.date.slice(5)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded font-mono tabular-nums bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                            {m.time}
                          </span>
                          {m.groupNumber && (
                            <span className="text-xs px-2 py-0.5 rounded font-mono tabular-nums bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium">
                              Grupo {m.groupNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Punto: <strong className="text-zinc-800 dark:text-[#F4F4F5]">{m.meetingPoint}</strong></span>
                          {m.territoryNumber && (
                            <span className="font-mono tabular-nums">• Territorio #{m.territoryNumber}</span>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => openEditMinistryModal(m)}
                        className="p-1.5 text-zinc-500 dark:text-[#A1A1AA] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-200/60 dark:hover:bg-[#27272A] rounded-md transition cursor-pointer"
                        title="Editar acompañantes y punto de salida"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white dark:bg-[#121216] p-3 rounded-lg border border-zinc-200 dark:border-[#27272A] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">Acompaña al Hno. {circuitVisit.overseerName}:</span>
                        <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {coComp?.name || <span className="text-zinc-400 italic">Sin asignar</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">Acompaña a la Hna. {circuitVisit.wifeName || 'Esposa'}:</span>
                        <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          {wifeComp?.name || <span className="text-zinc-400 italic">Sin asignar</span>}
                        </span>
                      </div>
                    </div>

                    {m.notes && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-[#18181F] p-2 rounded border border-zinc-200 dark:border-[#27272A]">
                        {m.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: LISTA DE VERIFICACIÓN (CHECKLIST) */}
      {/* ========================================================= */}
      {activeSubTab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Lista de Verificación de Archivos y Registros de la Congregación</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Documentos oficiales que el superintendente de circuito revisará durante su visita (S-21, S-88, Cuentas, Territorios).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full font-mono tabular-nums bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                  {checklistStats.completed} de {checklistStats.total} listos ({checklistStats.percent}%)
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {circuitVisit.checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleVisitChecklistItem(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    item.completed
                      ? 'bg-zinc-50/70 dark:bg-[#18181F]/40 border-zinc-200 dark:border-[#27272A] opacity-75'
                      : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-[#F4F4F5]'
                  }`}
                >
                  <div className="mt-0.5 pointer-events-none">
                    <SplashCheckbox
                      size="sm"
                      checked={item.completed}
                      readOnly
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${item.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-900 dark:text-[#F4F4F5]'}`}>
                        {item.task}
                      </p>
                      {item.assignedRole && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A] shrink-0">
                          {item.assignedRole}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 5: CARPETA EJECUTIVA DE SECRETARÍA Y SERVICIO     */}
      {/* ========================================================= */}
      {activeSubTab === 'carpeta_ejecutiva' && (
        <div className="space-y-6">
          {/* Header & Actions */}
          <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Dossier Ejecutivo de Auditoría para la Visita del Superintendente de Circuito</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                Consolidado automático de Tarjetas S-21, Asistencia S-88, Precursores Regulares (600 h), Grupos de Servicio y Territorios S-13.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <select
                value={selectedServiceYear}
                onChange={(e) => setSelectedServiceYear(e.target.value)}
                className="px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-xs font-bold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5] bg-zinc-50 dark:bg-[#18181F] outline-hidden cursor-pointer"
              >
                <option value="2025-2026">Año de Servicio 2025-2026</option>
                <option value="2026-2027">Año de Servicio 2026-2027</option>
                <option value="2024-2025">Año de Servicio 2024-2025</option>
              </select>

              <button
                onClick={() => {
                  const text = buildCircuitVisitExecutiveWhatsAppSummary(
                    executiveReport,
                    settings,
                    circuitVisit
                  );
                  const a = document.createElement('a');
                  a.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                  a.target = '_blank';
                  a.rel = 'noopener noreferrer';
                  a.click();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Enviar Resumen WhatsApp</span>
              </button>

              <button
                onClick={() =>
                  printCircuitOverseerExecutiveDossierA4(executiveReport, settings, circuitVisit)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-white rounded-xl text-xs font-bold border border-transparent dark:border-[#27272A] shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Dossier A4</span>
              </button>
            </div>
          </div>

          {/* 4 Executive Summary Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Roster Block */}
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase text-zinc-500 dark:text-[#A1A1AA]">
                1. Publicadores y Nombramientos
              </div>
              <div className="text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {executiveReport.roster.totalPublishers}{' '}
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ({executiveReport.roster.activeCount} activos)
                </span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-[#A1A1AA] space-y-0.5 pt-1 border-t border-zinc-100 dark:border-[#27272A]">
                <div className="flex justify-between">
                  <span>Ancianos / Siervos Min.:</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {executiveReport.roster.eldersCount} / {executiveReport.roster.ministerialServantsCount}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Precursores Regulares:</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{executiveReport.roster.regularPioneersCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Irregulares / Inactivos:</span>
                  <strong className="text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                    {executiveReport.roster.irregularCount} / {executiveReport.roster.inactiveCount}
                  </strong>
                </div>
              </div>
            </div>

            {/* S-88 Attendance Block */}
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase text-zinc-500 dark:text-[#A1A1AA]">
                2. Asistencia S-88 (Promedios)
              </div>
              <div className="text-2xl font-black font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
                {executiveReport.attendanceS88.avgWeekendTotal}{' '}
                <span className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA]">fin de semana</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-[#A1A1AA] space-y-0.5 pt-1 border-t border-zinc-100 dark:border-[#27272A]">
                <div className="flex justify-between">
                  <span>Entre Semana (Salón/Zoom):</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {executiveReport.attendanceS88.avgMidweekTotal} (
                    {executiveReport.attendanceS88.avgMidweekInPerson}+
                    {executiveReport.attendanceS88.avgMidweekZoom})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Fin de Semana (Salón/Zoom):</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {executiveReport.attendanceS88.avgWeekendTotal} (
                    {executiveReport.attendanceS88.avgWeekendInPerson}+
                    {executiveReport.attendanceS88.avgWeekendZoom})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Proporción vs Activos:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                    {executiveReport.attendanceS88.weekendToPublisherRatioPercent}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Pioneer 600h Audit Block */}
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase text-zinc-500 dark:text-[#A1A1AA]">
                3. Auditoría Precursores (600h)
              </div>
              <div className="text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {executiveReport.ministryS1.pioneerAudit.summary.onTrackCount} /{' '}
                {executiveReport.ministryS1.pioneerAudit.summary.totalRegularPioneers}{' '}
                <span className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA]">en meta</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-[#A1A1AA] space-y-0.5 pt-1 border-t border-zinc-100 dark:border-[#27272A]">
                <div className="flex justify-between">
                  <span>Promedio mensual PR:</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {executiveReport.ministryS1.pioneerAudit.summary.avgRegularPioneerMonthlyHours} h/mes
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>En observación / Déficit:</span>
                  <strong className="text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                    {executiveReport.ministryS1.pioneerAudit.summary.warningCount} /{' '}
                    {executiveReport.ministryS1.pioneerAudit.summary.behindCount}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Cursos Bíblicos (Prom. Mes):</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{executiveReport.ministryS1.totalBibleStudiesPerMonthAvg}</strong>
                </div>
              </div>
            </div>

            {/* S-13 Territories Block */}
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-2">
              <div className="text-[11px] font-bold uppercase text-zinc-500 dark:text-[#A1A1AA]">
                4. Territorios S-13 (Cobertura)
              </div>
              <div className="text-2xl font-black font-mono tabular-nums text-blue-700 dark:text-blue-400">
                {executiveReport.territoriesS13.coveragePercent}%{' '}
                <span className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA]">anual</span>
              </div>
              <div className="text-xs text-zinc-600 dark:text-[#A1A1AA] space-y-0.5 pt-1 border-t border-zinc-100 dark:border-[#27272A]">
                <div className="flex justify-between">
                  <span>Disponibles / Asignados:</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {executiveReport.territoriesS13.availableCount} /{' '}
                    {executiveReport.territoriesS13.assignedCount}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Vencidos (&gt; 4 meses):</span>
                  <strong
                    className={`font-mono tabular-nums ${
                      executiveReport.territoriesS13.overdueCount > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {executiveReport.territoriesS13.overdueCount}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Direcciones "No Visitar":</span>
                  <strong className="font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{executiveReport.territoriesS13.totalNoVisitAddresses}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Groups Breakdown Table */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-[#27272A]">
              <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                Estado por Grupos de Servicio del Campo (Revisión con el Superintendente de Servicio)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4">Grupo</th>
                    <th className="py-3 px-4">Superintendente / Auxiliar</th>
                    <th className="py-3 px-3 text-center">Publicadores</th>
                    <th className="py-3 px-3 text-center">Activos</th>
                    <th className="py-3 px-3 text-center">Irregulares</th>
                    <th className="py-3 px-3 text-center">Inactivos</th>
                    <th className="py-3 px-3 text-center">Prec. Regulares</th>
                    <th className="py-3 px-3 text-right">Horas Año</th>
                    <th className="py-3 px-4 text-right">Cursos Bíblicos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                  {executiveReport.ministryS1.groupsSummary.map((g) => (
                    <tr key={g.groupNumber} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/50">
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Grupo {g.groupNumber}: {g.groupName}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-[#A1A1AA]">
                        {g.overseerName} <span className="text-zinc-400">/</span> {g.assistantName}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                        {g.totalMembers}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {g.activeMembers}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {g.irregularMembers}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                        {g.inactiveMembers}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {g.regularPioneers}
                      </td>
                      <td className="py-3 px-3 text-right font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                        {g.totalHoursYear} h
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                        {g.avgBibleStudies}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pioneer Audit Table inside Circuit Visit */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-[#27272A]">
              <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                Revisión de Tarjetas S-21 de Precursores Regulares (Meta Anual: 600 h / 50 h mensuales)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4">Precursor</th>
                    <th className="py-3 px-3 text-center">Grupo</th>
                    <th className="py-3 px-3 text-center">Meses Inf.</th>
                    <th className="py-3 px-3 text-right">Horas Pred.</th>
                    <th className="py-3 px-3 text-right">Crédito</th>
                    <th className="py-3 px-3 text-right">Total Efectivo</th>
                    <th className="py-3 px-3 text-right">Promedio / Mes</th>
                    <th className="py-3 px-3 text-right">Balance Pro-Rata</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                  {executiveReport.ministryS1.pioneerAudit.regularPioneers.map((p) => (
                    <tr key={p.publisher.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/50">
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-[#F4F4F5]">{p.publisher.name}</td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                        G-{p.publisher.groupNumber || '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                        {p.monthsReported} / 12
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{p.totalHours} h</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                        {p.totalCreditHours > 0 ? `+${p.totalCreditHours} h` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                        {p.effectiveHours} h
                      </td>
                      <td className="py-3 px-3 text-right font-semibold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">{p.avgMonthlyHours} h</td>
                      <td
                        className={`py-3 px-3 text-right font-bold font-mono tabular-nums ${
                          p.hoursDelta >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : p.hoursDelta >= -20
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {p.hoursDelta >= 0 ? `+${p.hoursDelta} h` : `${p.hoursDelta} h`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.paceStatus === 'en_meta' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> En Meta
                          </span>
                        ) : p.paceStatus === 'atencion' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Observación
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Déficit
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR INFORMACIÓN DE LA VISITA */}
      {/* ========================================================= */}
      {isEditVisitModalOpen && visitFormData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-xl max-w-xl w-full p-5 sm:p-6 shadow-xl border border-zinc-200 dark:border-[#27272A] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base sm:text-lg">Configuración de la Visita del SC</h3>
              <button
                onClick={() => setIsEditVisitModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitDetails} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Nombre del SC *</label>
                  <input
                    type="text"
                    required
                    value={visitFormData.overseerName}
                    onChange={e => setVisitFormData({ ...visitFormData, overseerName: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Nombre de la Esposa</label>
                  <input
                    type="text"
                    value={visitFormData.wifeName || ''}
                    onChange={e => setVisitFormData({ ...visitFormData, wifeName: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Circuito</label>
                  <input
                    type="text"
                    value={visitFormData.circuitNumber}
                    onChange={e => setVisitFormData({ ...visitFormData, circuitNumber: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Fecha Inicio (Martes)</label>
                  <input
                    type="date"
                    value={visitFormData.startDate}
                    onChange={e => setVisitFormData({ ...visitFormData, startDate: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Fecha Fin (Domingo)</label>
                  <input
                    type="date"
                    value={visitFormData.endDate}
                    onChange={e => setVisitFormData({ ...visitFormData, endDate: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Tema del Discurso Entre Semana (30 min) *</label>
                <input
                  type="text"
                  required
                  value={visitFormData.midweekTalkTheme}
                  onChange={e => setVisitFormData({ ...visitFormData, midweekTalkTheme: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Tema Discurso Público (Fin de semana) *</label>
                  <input
                    type="text"
                    required
                    value={visitFormData.weekendPublicTalkTheme}
                    onChange={e => setVisitFormData({ ...visitFormData, weekendPublicTalkTheme: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Tema Discurso Final de Conclusión *</label>
                  <input
                    type="text"
                    required
                    value={visitFormData.weekendFinalTalkTheme}
                    onChange={e => setVisitFormData({ ...visitFormData, weekendFinalTalkTheme: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Preferencias Alimentarias / Alergias</label>
                <textarea
                  rows={2}
                  value={visitFormData.dietaryPreferences || ''}
                  onChange={e => setVisitFormData({ ...visitFormData, dietaryPreferences: e.target.value })}
                  placeholder="Ej. Evitar mariscos, poco condimento, preferencia por frutas y pollo..."
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Notas de Hospedaje / Alojamiento</label>
                <textarea
                  rows={2}
                  value={visitFormData.lodgingNotes || ''}
                  onChange={e => setVisitFormData({ ...visitFormData, lodgingNotes: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsEditVisitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR ARREGLO DE COMIDA */}
      {/* ========================================================= */}
      {editMealModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-zinc-200 dark:border-[#27272A] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base">
                  Arreglo de Hospitalidad: {editMealModal.day} ({editMealModal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">{editMealModal.date}</p>
              </div>
              <button onClick={() => setEditMealModal(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Seleccionar Publicador / Familia Anfitriona</label>
                <select
                  value={mealFormData.hostPublisherId}
                  onChange={e => {
                    const pubId = e.target.value;
                    const pub = publishersMap.get(pubId);
                    setMealFormData({
                      ...mealFormData,
                      hostPublisherId: pubId,
                      hostName: pub ? `Familia ${pub.name}` : mealFormData.hostName,
                      hostPhone: pub?.phone || mealFormData.hostPhone,
                    });
                  }}
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden cursor-pointer"
                >
                  <option value="">-- Ingreso manual o seleccionar publicador --</option>
                  {publishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.privilege === 'anciano' ? '(Anciano)' : p.privilege === 'siervo_ministerial' ? '(Siervo)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Nombre Anfitrión / Familia *</label>
                <input
                  type="text"
                  required
                  value={mealFormData.hostName}
                  onChange={e => setMealFormData({ ...mealFormData, hostName: e.target.value })}
                  placeholder="Ej. Familia González"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={mealFormData.hostPhone}
                  onChange={e => setMealFormData({ ...mealFormData, hostPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Lugar / Dirección</label>
                <input
                  type="text"
                  value={mealFormData.location}
                  onChange={e => setMealFormData({ ...mealFormData, location: e.target.value })}
                  placeholder="Ej. Casa Fam. González - Calle 5 #24 o Salón del Reino"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Menú / Notas</label>
                <input
                  type="text"
                  value={mealFormData.notes}
                  onChange={e => setMealFormData({ ...mealFormData, notes: e.target.value })}
                  placeholder="Ej. Pollo al horno con ensalada fresca"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="pt-2">
                <SplashCheckbox
                  size="sm"
                  checked={mealFormData.isConfirmed}
                  onChange={e => setMealFormData({ ...mealFormData, isConfirmed: e.target.checked })}
                  label="Comida confirmada con los anfitriones"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setEditMealModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Guardar Arreglo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR SALIDA DE PREDICACIÓN */}
      {/* ========================================================= */}
      {editMinistryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-zinc-200 dark:border-[#27272A] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base">
                  Predicación: {editMinistryModal.day} ({editMinistryModal.date})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Asignar punto de reunión y acompañantes</p>
              </div>
              <button onClick={() => setEditMinistryModal(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMinistry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Hora de salida</label>
                  <input
                    type="text"
                    value={minFormData.time}
                    onChange={e => setMinFormData({ ...minFormData, time: e.target.value })}
                    placeholder="09:30"
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Territorio asignado</label>
                  <input
                    type="text"
                    value={minFormData.territoryNumber}
                    onChange={e => setMinFormData({ ...minFormData, territoryNumber: e.target.value })}
                    placeholder="Ej. 02, 05-A"
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Punto de Reunión</label>
                <input
                  type="text"
                  required
                  value={minFormData.meetingPoint}
                  onChange={e => setMinFormData({ ...minFormData, meetingPoint: e.target.value })}
                  placeholder="Ej. Salón del Reino o Plaza Central"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">
                  Acompaña al Superintendente de Circuito
                </label>
                <select
                  value={minFormData.coCompanionPublisherId}
                  onChange={e => setMinFormData({ ...minFormData, coCompanionPublisherId: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden cursor-pointer"
                >
                  <option value="">-- Seleccionar hermano --</option>
                  {publishers
                    .filter(p => p.gender === 'hermano')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.privilege === 'anciano' ? '(Anciano)' : p.privilege === 'siervo_ministerial' ? '(Siervo)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">
                  Acompaña a la Esposa del Superintendente
                </label>
                <select
                  value={minFormData.wifeCompanionPublisherId}
                  onChange={e => setMinFormData({ ...minFormData, wifeCompanionPublisherId: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden cursor-pointer"
                >
                  <option value="">-- Seleccionar hermana --</option>
                  {publishers
                    .filter(p => p.gender === 'hermana')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.privilege === 'precursor_regular' ? '(Precursora Regular)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Notas / Instrucciones</label>
                <input
                  type="text"
                  value={minFormData.notes}
                  onChange={e => setMinFormData({ ...minFormData, notes: e.target.value })}
                  placeholder="Ej. Salida especial con precursores o trabajo comercial"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setEditMinistryModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Guardar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR REUNIÓN ESPECIAL */}
      {/* ========================================================= */}
      {isAddMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-zinc-200 dark:border-[#27272A] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base">Agregar Reunión Especial</h3>
              <button onClick={() => setIsAddMeetingModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSpecialMeetingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Título de la Reunión *</label>
                <input
                  type="text"
                  required
                  value={newMeetingData.title}
                  onChange={e => setNewMeetingData({ ...newMeetingData, title: e.target.value })}
                  placeholder="Ej. Reunión con los Jóvenes de la Congregación"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={newMeetingData.date}
                    onChange={e => setNewMeetingData({ ...newMeetingData, date: e.target.value })}
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Horario</label>
                  <input
                    type="text"
                    value={newMeetingData.time}
                    onChange={e => setNewMeetingData({ ...newMeetingData, time: e.target.value })}
                    placeholder="18:00 - 19:00"
                    className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">Lugar</label>
                <input
                  type="text"
                  value={newMeetingData.location}
                  onChange={e => setNewMeetingData({ ...newMeetingData, location: e.target.value })}
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#F4F4F5] mb-1">¿Quiénes asisten? *</label>
                <input
                  type="text"
                  required
                  value={newMeetingData.attendeesDescription}
                  onChange={e => setNewMeetingData({ ...newMeetingData, attendeesDescription: e.target.value })}
                  placeholder="Ej. Jóvenes bautizados de 12 a 25 años"
                  className="w-full p-2.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setIsAddMeetingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Guardar Reunión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
