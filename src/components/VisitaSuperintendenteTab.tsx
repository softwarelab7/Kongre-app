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

export const VisitaSuperintendenteTab: React.FC = () => {
  const {
    circuitVisit,
    publishers,
    publishersMap,
    settings,
    updateCircuitVisit,
    updateMealArrangement,
    updateMinistryArrangement,
    toggleVisitChecklistItem,
    addSpecialMeeting,
    removeSpecialMeeting,
  } = useCongregation();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'programa' | 'comidas' | 'predicacion' | 'checklist'>('programa');

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
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <p className="text-slate-600">No hay información configurada para la visita del Superintendente de Circuito.</p>
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {circuitVisit.circuitNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {circuitVisit.status === 'proxima' ? 'Próxima Visita' : circuitVisit.status === 'en_curso' ? 'En Curso' : 'Concluida'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Visita del Superintendente de Circuito
            </h1>
            <p className="text-sm text-blue-200/90 flex items-center gap-2 flex-wrap">
              <User className="w-4 h-4 text-blue-300" />
              <span>
                <strong>Hno. {circuitVisit.overseerName}</strong>
                {circuitVisit.wifeName ? ` y Hna. ${circuitVisit.wifeName}` : ''}
              </span>
              <span>•</span>
              <Calendar className="w-4 h-4 text-blue-300" />
              <span>Semana del {circuitVisit.startDate} al {circuitVisit.endDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleShareFullProgramWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Programa</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition border border-white/20"
              title="Imprimir programa oficial"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={openEditVisitModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition border border-white/20"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar Datos</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10">
            <div className="text-blue-200 font-medium mb-1">Discurso Entre Semana (30m)</div>
            <div className="font-semibold text-white truncate" title={circuitVisit.midweekTalkTheme}>
              {circuitVisit.midweekTalkTheme}
            </div>
            <div className="text-blue-300 text-[11px] mt-0.5">Cántico {circuitVisit.midweekSongNumber || '-'}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10">
            <div className="text-blue-200 font-medium mb-1">Discurso Público Fin de Semana</div>
            <div className="font-semibold text-white truncate" title={circuitVisit.weekendPublicTalkTheme}>
              {circuitVisit.weekendPublicTalkTheme}
            </div>
            <div className="text-blue-300 text-[11px] mt-0.5">Reunión pública de 30 min</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10">
            <div className="text-blue-200 font-medium mb-1">Hospitalidad & Comidas</div>
            <div className="font-semibold text-white">
              {mealsStats.confirmed} de {mealsStats.total} Confirmadas
            </div>
            <div className="text-blue-300 text-[11px] mt-0.5">Almuerzos y cenas organizadas</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10">
            <div className="text-blue-200 font-medium mb-1">Registros & Auditoría (Checklist)</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{checklistStats.percent}% completado</span>
              <span className="text-blue-300 text-[11px]">({checklistStats.completed}/{checklistStats.total})</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1 mt-1.5">
              <div
                className="bg-emerald-400 h-1 rounded-full"
                style={{ width: `${checklistStats.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('programa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${
            activeSubTab === 'programa'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Programa & Discursos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comidas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${
            activeSubTab === 'comidas'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Utensils className="w-4 h-4 text-emerald-600" />
          <span>Comidas & Hospitalidad ({mealsStats.confirmed}/{mealsStats.total})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('predicacion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${
            activeSubTab === 'predicacion'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-600" />
          <span>Plan de Predicación Semanal</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${
            activeSubTab === 'checklist'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          <span>Registros & Archivo ({checklistStats.percent}%)</span>
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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Reunión Entre Semana
                </span>
                <span className="text-xs text-slate-500 font-medium">30 Minutos</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {circuitVisit.midweekTalkTheme}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Discurso de servicio del Superintendente de Circuito tras las partes de Nuestra Vida Cristiana.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-blue-600" /> Cántico final:
                </span>
                <span className="font-bold text-slate-800">
                  {circuitVisit.midweekSongNumber ? `Cántico #${circuitVisit.midweekSongNumber}` : 'A elegir por el SC'}
                </span>
              </div>
            </div>

            {/* Weekend public talk */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Fin de Semana • Público
                </span>
                <span className="text-xs text-slate-500 font-medium">30 Minutos</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {circuitVisit.weekendPublicTalkTheme}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pronunciado por el Hno. {circuitVisit.overseerName} para toda la congregación e invitados.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Horario:
                </span>
                <span className="font-semibold text-slate-800">
                  {settings.weekendMeetingDay} {settings.weekendMeetingTime}
                </span>
              </div>
            </div>

            {/* Weekend concluding talk */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Fin de Semana • Conclusión
                </span>
                <span className="text-xs text-slate-500 font-medium">30 Minutos</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-snug">
                  {circuitVisit.weekendFinalTalkTheme}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Discurso final de estímulo y despedida tras el estudio de La Atalaya.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-emerald-600" /> Cántico de despedida:
                </span>
                <span className="font-bold text-slate-800">
                  {circuitVisit.weekendSongNumber ? `Cántico #${circuitVisit.weekendSongNumber}` : 'A elegir por el SC'}
                </span>
              </div>
            </div>
          </div>

          {/* Special Meetings Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Reuniones Especiales Convocadas</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Reuniones con precursores, siervos ministeriales y ancianos durante la semana.
                </p>
              </div>
              <button
                onClick={() => setIsAddMeetingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Reunión</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {circuitVisit.specialMeetings.map((sp) => (
                <div key={sp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative group">
                  <button
                    onClick={() => removeSpecialMeeting(sp.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition p-1"
                    title="Eliminar reunión"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <h4 className="font-bold text-slate-800 text-sm pr-6">{sp.title}</h4>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sp.date} • {sp.time}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{sp.location}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{sp.attendeesDescription}</span>
                    </p>
                  </div>
                  {sp.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200/60 mt-1">
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
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-1.5 text-amber-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>Preferencias Alimentarias & Alergias de los Hermanos Visitantes:</span>
              </div>
              <p className="leading-relaxed">
                {circuitVisit.dietaryPreferences || 'Sin requerimientos especiales registrados.'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-1.5 text-blue-900 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Home className="w-4 h-4 text-blue-600" />
                <span>Alojamiento & Hospedaje:</span>
              </div>
              <p className="leading-relaxed">
                {circuitVisit.lodgingNotes || 'Apartamento del Salón del Reino o familia anfitriona designada.'}
              </p>
            </div>
          </div>

          {/* Meals Table / Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  <span>Calendario de Comidas (Martes a Domingo)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Familias anfitrionas coordinadas para almorzar o cenar con el superintendente de circuito y su esposa.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {mealsStats.confirmed} de {mealsStats.total} confirmadas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Día & Comida</th>
                    <th className="py-3 px-4">Familia Anfitriona</th>
                    <th className="py-3 px-4">Lugar / Dirección</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Observaciones</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {circuitVisit.meals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {meal.day} {meal.date.slice(5)}
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          meal.mealType === 'almuerzo' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {meal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-blue-600" />
                          <span>{meal.hostName || 'Por asignar'}</span>
                        </div>
                        {meal.hostPhone && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{meal.hostPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {meal.location || 'Salón del Reino o casa anfitriona'}
                      </td>

                      <td className="py-3.5 px-4">
                        {meal.isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Pendiente
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate" title={meal.notes}>
                        {meal.notes || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleShareMealWhatsApp(meal)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                            title="Enviar itinerario a la familia por WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditMealModal(meal)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition"
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
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-600" />
                  <span>Salidas al Ministerio con el Superintendente y su Esposa</span>
                </h3>
                <p className="text-xs text-slate-500">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition self-start sm:self-auto"
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
                  <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {m.day} {m.date.slice(5)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {m.time}
                          </span>
                          {m.groupNumber && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                              Grupo {m.groupNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Punto: <strong>{m.meetingPoint}</strong></span>
                          {m.territoryNumber && (
                            <span>• Territorio #{m.territoryNumber}</span>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => openEditMinistryModal(m)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-md transition"
                        title="Editar acompañantes y punto de salida"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Acompaña al Hno. {circuitVisit.overseerName}:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          {coComp?.name || <span className="text-slate-400 italic">Sin asignar</span>}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Acompaña a la Hna. {circuitVisit.wifeName || 'Esposa'}:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          {wifeComp?.name || <span className="text-slate-400 italic">Sin asignar</span>}
                        </span>
                      </div>
                    </div>

                    {m.notes && (
                      <p className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded border border-amber-200/50">
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
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  <span>Lista de Verificación de Archivos y Registros de la Congregación</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Documentos oficiales que el superintendente de circuito revisará durante su visita (S-21, S-88, Cuentas, Territorios).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {item.task}
                      </p>
                      {item.assignedRole && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {item.assignedRole}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-500 italic">
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
      {/* MODAL: EDITAR INFORMACIÓN DE LA VISITA */}
      {/* ========================================================= */}
      {isEditVisitModalOpen && visitFormData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-slate-800 text-lg">Configuración de la Visita del SC</h3>
              <button
                onClick={() => setIsEditVisitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre del SC *</label>
                  <input
                    type="text"
                    required
                    value={visitFormData.overseerName}
                    onChange={e => setVisitFormData({ ...visitFormData, overseerName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre de la Esposa</label>
                  <input
                    type="text"
                    value={visitFormData.wifeName || ''}
                    onChange={e => setVisitFormData({ ...visitFormData, wifeName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Circuito</label>
                  <input
                    type="text"
                    value={visitFormData.circuitNumber}
                    onChange={e => setVisitFormData({ ...visitFormData, circuitNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Inicio (Martes)</label>
                  <input
                    type="date"
                    value={visitFormData.startDate}
                    onChange={e => setVisitFormData({ ...visitFormData, startDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Fin (Domingo)</label>
                  <input
                    type="date"
                    value={visitFormData.endDate}
                    onChange={e => setVisitFormData({ ...visitFormData, endDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tema del Discurso Entre Semana (30 min) *</label>
                <input
                  type="text"
                  required
                  value={visitFormData.midweekTalkTheme}
                  onChange={e => setVisitFormData({ ...visitFormData, midweekTalkTheme: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tema Discurso Público (Fin de semana) *</label>
                  <input
                    type="text"
                    required
                    value={visitFormData.weekendPublicTalkTheme}
                    onChange={e => setVisitFormData({ ...visitFormData, weekendPublicTalkTheme: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tema Discurso Final de Conclusión *</label>
                  <input
                    type="text"
                    required
                    value={visitFormData.weekendFinalTalkTheme}
                    onChange={e => setVisitFormData({ ...visitFormData, weekendFinalTalkTheme: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferencias Alimentarias / Alergias</label>
                <textarea
                  rows={2}
                  value={visitFormData.dietaryPreferences || ''}
                  onChange={e => setVisitFormData({ ...visitFormData, dietaryPreferences: e.target.value })}
                  placeholder="Ej. Evitar mariscos, poco condimento, preferencia por frutas y pollo..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas de Hospedaje / Alojamiento</label>
                <textarea
                  rows={2}
                  value={visitFormData.lodgingNotes || ''}
                  onChange={e => setVisitFormData({ ...visitFormData, lodgingNotes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditVisitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Arreglo de Hospitalidad: {editMealModal.day} ({editMealModal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'})
                </h3>
                <p className="text-xs text-slate-500">{editMealModal.date}</p>
              </div>
              <button onClick={() => setEditMealModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seleccionar Publicador / Familia Anfitriona</label>
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
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">Nombre Anfitrión / Familia *</label>
                <input
                  type="text"
                  required
                  value={mealFormData.hostName}
                  onChange={e => setMealFormData({ ...mealFormData, hostName: e.target.value })}
                  placeholder="Ej. Familia González"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={mealFormData.hostPhone}
                  onChange={e => setMealFormData({ ...mealFormData, hostPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lugar / Dirección</label>
                <input
                  type="text"
                  value={mealFormData.location}
                  onChange={e => setMealFormData({ ...mealFormData, location: e.target.value })}
                  placeholder="Ej. Casa Fam. González - Calle 5 #24 o Salón del Reino"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Menú / Notas</label>
                <input
                  type="text"
                  value={mealFormData.notes}
                  onChange={e => setMealFormData({ ...mealFormData, notes: e.target.value })}
                  placeholder="Ej. Pollo al horno con ensalada fresca"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="confirmCheck"
                  checked={mealFormData.isConfirmed}
                  onChange={e => setMealFormData({ ...mealFormData, isConfirmed: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="confirmCheck" className="text-slate-700 font-medium">
                  Comida confirmada con los anfitriones
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditMealModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Predicación: {editMinistryModal.day} ({editMinistryModal.date})
                </h3>
                <p className="text-xs text-slate-500">Asignar punto de reunión y acompañantes</p>
              </div>
              <button onClick={() => setEditMinistryModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMinistry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hora de salida</label>
                  <input
                    type="text"
                    value={minFormData.time}
                    onChange={e => setMinFormData({ ...minFormData, time: e.target.value })}
                    placeholder="09:30"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Territorio asignado</label>
                  <input
                    type="text"
                    value={minFormData.territoryNumber}
                    onChange={e => setMinFormData({ ...minFormData, territoryNumber: e.target.value })}
                    placeholder="Ej. 02, 05-A"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Punto de Reunión</label>
                <input
                  type="text"
                  required
                  value={minFormData.meetingPoint}
                  onChange={e => setMinFormData({ ...minFormData, meetingPoint: e.target.value })}
                  placeholder="Ej. Salón del Reino o Plaza Central"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Acompaña al Superintendente de Circuito
                </label>
                <select
                  value={minFormData.coCompanionPublisherId}
                  onChange={e => setMinFormData({ ...minFormData, coCompanionPublisherId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Acompaña a la Esposa del Superintendente
                </label>
                <select
                  value={minFormData.wifeCompanionPublisherId}
                  onChange={e => setMinFormData({ ...minFormData, wifeCompanionPublisherId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">Notas / Instrucciones</label>
                <input
                  type="text"
                  value={minFormData.notes}
                  onChange={e => setMinFormData({ ...minFormData, notes: e.target.value })}
                  placeholder="Ej. Salida especial con precursores o trabajo comercial"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditMinistryModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-slate-800 text-base">Agregar Reunión Especial</h3>
              <button onClick={() => setIsAddMeetingModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSpecialMeetingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título de la Reunión *</label>
                <input
                  type="text"
                  required
                  value={newMeetingData.title}
                  onChange={e => setNewMeetingData({ ...newMeetingData, title: e.target.value })}
                  placeholder="Ej. Reunión con los Jóvenes de la Congregación"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={newMeetingData.date}
                    onChange={e => setNewMeetingData({ ...newMeetingData, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horario</label>
                  <input
                    type="text"
                    value={newMeetingData.time}
                    onChange={e => setNewMeetingData({ ...newMeetingData, time: e.target.value })}
                    placeholder="18:00 - 19:00"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lugar</label>
                <input
                  type="text"
                  value={newMeetingData.location}
                  onChange={e => setNewMeetingData({ ...newMeetingData, location: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">¿Quiénes asisten? *</label>
                <input
                  type="text"
                  required
                  value={newMeetingData.attendeesDescription}
                  onChange={e => setNewMeetingData({ ...newMeetingData, attendeesDescription: e.target.value })}
                  placeholder="Ej. Jóvenes bautizados de 12 a 25 años"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddMeetingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
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
