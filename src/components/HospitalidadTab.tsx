// src/components/HospitalidadTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { HospitalityHost, HospitalityMealType, WeekSchedule } from '../types';
import { SplashCheckbox } from './SplashCheckbox';
import {
  suggestBestHospitalityHosts,
  buildWhatsAppHostFamilyReminder,
  buildWhatsAppVisitingSpeakerInvite,
  MEAL_TYPE_LABELS,
} from '../utils/khsSpeakerExchangeEngine';
import {
  Coffee,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Users,
  Utensils,
  Phone,
  MapPin,
  AlertCircle,
  X,
  MessageCircle,
  Copy,
  Calendar,
  Sparkles,
  Filter,
  Building,
  Mic,
} from 'lucide-react';

export const HospitalidadTab: React.FC = () => {
  const {
    hospitalityHosts,
    addHospitalityHost,
    updateHospitalityHost,
    deleteHospitalityHost,
    publishers,
    publishersMap,
    weeks,
    updateWeek,
    settings,
  } = useCongregation();

  const [activeSubView, setActiveSubView] = useState<'cuadrante' | 'anfitriones'>('cuadrante');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'allergies'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<HospitalityHost | null>(null);

  // Form State
  const [selectedPublisherId, setSelectedPublisherId] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [alternateAddress, setAlternateAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Computed metrics
  const stats = useMemo(() => {
    const total = hospitalityHosts.length;
    const activeCount = hospitalityHosts.filter((h) => h.active).length;
    const totalCapacity = hospitalityHosts
      .filter((h) => h.active)
      .reduce((sum, h) => sum + (h.capacity || 0), 0);
    const withAllergies = hospitalityHosts.filter((h) => !!h.dietaryNotes?.trim()).length;
    const assignedWeeksCount = weeks.filter((w) => Boolean(w.weekend.hospitalityPublisherId)).length;
    return { total, activeCount, totalCapacity, withAllergies, assignedWeeksCount };
  }, [hospitalityHosts, weeks]);

  // Map of hosts to upcoming assigned weekend talks
  const hostAssignments = useMemo(() => {
    const map = new Map<string, Array<{ weekStartDate: string; date: string; speakerName: string }>>();
    weeks.forEach((w) => {
      const pubId = w.weekend.hospitalityPublisherId;
      if (pubId) {
        const list = map.get(pubId) || [];
        let spk = w.weekend.publicTalkSpeaker || 'Orador Visitante';
        if (!w.weekend.isVisitingSpeaker && spk && publishersMap.has(spk)) {
          spk = publishersMap.get(spk)!.name;
        }
        list.push({
          weekStartDate: w.weekStartDate,
          date: w.weekend.date || w.weekEndDate,
          speakerName: spk,
        });
        map.set(pubId, list);
      }
    });
    return map;
  }, [weeks, publishersMap]);

  // Filtered hosts
  const filteredHosts = useMemo(() => {
    return hospitalityHosts.filter((h) => {
      const pub = publishersMap.get(h.publisherId);
      const name = pub?.name || '';
      const phone = h.contactPhone || pub?.phone || '';
      const address = h.alternateAddress || pub?.address || '';
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(q) ||
        phone.includes(q) ||
        address.toLowerCase().includes(q) ||
        (h.dietaryNotes && h.dietaryNotes.toLowerCase().includes(q)) ||
        (h.notes && h.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterStatus === 'active') return h.active;
      if (filterStatus === 'inactive') return !h.active;
      if (filterStatus === 'allergies') return !!h.dietaryNotes?.trim();

      return true;
    });
  }, [hospitalityHosts, publishersMap, searchTerm, filterStatus]);

  // 1-Click Assign for a single week
  const handleOneClickAssignWeek = (week: WeekSchedule) => {
    const guests = 1 + (week.weekend.visitingSpeakerCompanions || 0);
    const ranked = suggestBestHospitalityHosts(
      week,
      weeks,
      hospitalityHosts,
      publishersMap,
      guests,
      week.weekend.visitingSpeakerDietaryNotes
    );
    const best = ranked.find((r) => r.isAvailable && r.meetsCapacity) || ranked[0];
    if (!best) {
      showToast('Primero registra familias disponibles en el Directorio de Anfitriones.');
      return;
    }

    updateWeek({
      ...week,
      weekend: {
        ...week.weekend,
        hospitalityPublisherId: best.host.publisherId,
        hospitalityMealType: week.weekend.hospitalityMealType || 'almuerzo',
        hospitalityStatus: 'pendiente',
      },
    });
    showToast(`Asignado en 1 clic: ${best.publisher.name}`);
  };

  // 1-Click Auto-Assign ALL unassigned weeks with equitable rotation
  const handleAutoAssignAllPendingWeeks = () => {
    const activeHosts = hospitalityHosts.filter((h) => h.active);
    if (activeHosts.length === 0) {
      showToast('No hay familias anfitrionas activas registradas.');
      return;
    }

    let assignedCount = 0;
    const simulatedWeeks: WeekSchedule[] = JSON.parse(JSON.stringify(weeks));

    simulatedWeeks.forEach((wk) => {
      if (wk.weekend.hospitalityPublisherId) return;
      const guests = 1 + (wk.weekend.visitingSpeakerCompanions || 0);
      const ranked = suggestBestHospitalityHosts(
        wk,
        simulatedWeeks,
        hospitalityHosts,
        publishersMap,
        guests,
        wk.weekend.visitingSpeakerDietaryNotes
      );
      const best = ranked.find((r) => r.isAvailable && r.meetsCapacity) || ranked[0];
      if (best) {
        wk.weekend.hospitalityPublisherId = best.host.publisherId;
        wk.weekend.hospitalityMealType = wk.weekend.hospitalityMealType || 'almuerzo';
        wk.weekend.hospitalityStatus = 'pendiente';
        updateWeek(wk);
        assignedCount++;
      }
    });

    if (assignedCount > 0) {
      showToast(`¡${assignedCount} semana(s) asignadas con rotación equitativa!`);
    } else {
      showToast('Todas las semanas ya cuentan con anfitrión asignado.');
    }
  };

  // Modal Handlers
  const openNewModal = () => {
    setEditingHost(null);
    setSelectedPublisherId('');
    setCapacity(2);
    setDietaryNotes('');
    setAlternateAddress('');
    setContactPhone('');
    setNotes('');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (host: HospitalityHost) => {
    setEditingHost(host);
    setSelectedPublisherId(host.publisherId);
    setCapacity(host.capacity || 2);
    setDietaryNotes(host.dietaryNotes || '');
    setAlternateAddress(host.alternateAddress || '');
    setContactPhone(host.contactPhone || '');
    setNotes(host.notes || '');
    setIsActive(host.active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublisherId) {
      setFormError('Por favor selecciona una familia o publicador.');
      return;
    }

    if (!editingHost && hospitalityHosts.some((h) => h.publisherId === selectedPublisherId)) {
      setFormError('Esta familia ya está registrada en el directorio de hospitalidad.');
      return;
    }

    if (editingHost) {
      updateHospitalityHost({
        ...editingHost,
        publisherId: selectedPublisherId,
        capacity: Math.max(1, capacity),
        dietaryNotes: dietaryNotes.trim() || undefined,
        alternateAddress: alternateAddress.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        active: isActive,
      });
    } else {
      addHospitalityHost({
        publisherId: selectedPublisherId,
        capacity: Math.max(1, capacity),
        dietaryNotes: dietaryNotes.trim() || undefined,
        alternateAddress: alternateAddress.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        active: isActive,
      });
    }

    setIsModalOpen(false);
    showToast('Familia anfitriona guardada correctamente.');
  };

  const handleDelete = (hostId: string) => {
    deleteHospitalityHost(hostId);
    showToast('Anfitrión eliminado del directorio.');
  };

  const handleToggleActive = (host: HospitalityHost) => {
    updateHospitalityHost({
      ...host,
      active: !host.active,
    });
  };

  // Copy WhatsApp Directory & Schedule
  const handleCopyWhatsAppList = () => {
    let msg = `*🍽️ PROGRAMA Y DIRECTORIO DE HOSPITALIDAD - ${
      settings.congregationName?.toUpperCase() || 'CONGREGACIÓN'
    }*\n\n`;

    msg += `*📅 PRÓXIMAS ATENCIONES A ORADORES:*\n`;
    weeks.forEach((w) => {
      const hostPub = w.weekend.hospitalityPublisherId
        ? publishersMap.get(w.weekend.hospitalityPublisherId)
        : null;
      let spk = w.weekend.publicTalkSpeaker || 'Por asignar';
      if (!w.weekend.isVisitingSpeaker && spk && publishersMap.has(spk)) {
        spk = publishersMap.get(spk)!.name;
      }
      msg += `• *${w.weekend.date}*: Orador: ${spk} ➔ Anfitrión: *${
        hostPub ? hostPub.name : 'Pendiente'
      }*\n`;
    });

    msg += `\n*🏡 FAMILIAS ANFITRIONAS DISPONIBLES:*\n`;
    const activeList = hospitalityHosts.filter((h) => h.active);
    if (activeList.length === 0) {
      msg += `(No hay familias activas registradas actualmente)\n`;
    } else {
      activeList.forEach((h, idx) => {
        const pub = publishersMap.get(h.publisherId);
        const name = pub?.name || 'Familia';
        const phone = h.contactPhone || pub?.phone || 'Sin teléfono';
        msg += `${idx + 1}. *${name}* (Cap: ${h.capacity} pers. | Tel: ${phone})\n`;
      });
    }

    navigator.clipboard.writeText(msg);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // WhatsApp individual family contact
  const handleSendFamilyMessage = (host: HospitalityHost) => {
    const pub = publishersMap.get(host.publisherId);
    const phone = host.contactPhone || pub?.phone;
    if (!phone) return;

    const clean = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hola querido hermano ${pub?.name || ''}, le saludamos con cariño desde la congregación ${
        settings.congregationName || ''
      } para coordinar la hospitalidad de un orador visitante. ¡Muchas gracias por su espíritu dispuesto!`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:inline-flex rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-slate-800/70 p-1 gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubView('cuadrante')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubView === 'cuadrante'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cuadrante Semanal</span>
            </button>

            <button
              onClick={() => setActiveSubView('anfitriones')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                activeSubView === 'anfitriones'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Anfitriones ({hospitalityHosts.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            {activeSubView === 'cuadrante' && (
              <button
                onClick={handleAutoAssignAllPendingWeeks}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer truncate"
                title="Asignar automáticamente familias anfitrionas a todas las semanas pendientes según rotación y capacidad"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Auto-Asignar (1-Clic)</span>
              </button>
            )}

            <button
              onClick={handleCopyWhatsAppList}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer truncate"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">Copiar WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={openNewModal}
              className={`${activeSubView === 'cuadrante' ? 'col-span-2 sm:col-span-1' : ''} flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 truncate`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Nuevo Anfitrión</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Familias Registradas
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.activeCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Disponibles / Activas
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalCapacity} pers.
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Capacidad Total
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.assignedWeeksCount} / {weeks.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Semanas Cubiertas
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          VIEW 1: CUADRANTE DE HOSPITALIDAD POR FIN DE SEMANA (1-CLIC)
      ========================================== */}
      {activeSubView === 'cuadrante' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeks.map((week) => {
            const w = week.weekend;
            const isVisiting = w.isVisitingSpeaker;
            let speakerName = w.publicTalkSpeaker || 'Orador por asignar';
            if (!isVisiting && w.publicTalkSpeaker && publishersMap.has(w.publicTalkSpeaker)) {
              speakerName = publishersMap.get(w.publicTalkSpeaker)!.name;
            }

            const guests = 1 + (w.visitingSpeakerCompanions || 0);
            const rankedSuggestions = suggestBestHospitalityHosts(
              week,
              weeks,
              hospitalityHosts,
              publishersMap,
              guests,
              w.visitingSpeakerDietaryNotes
            );

            const assignedHostPub = w.hospitalityPublisherId
              ? publishersMap.get(w.hospitalityPublisherId)
              : null;

            return (
              <div
                key={week.id}
                className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs">
                          {w.date}
                        </span>
                        {isVisiting ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            Orador Visitante
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Orador Local
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{speakerName}</span>
                      </h4>
                      {w.visitingSpeakerCongregation && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-emerald-600" />
                          <span>{w.visitingSpeakerCongregation}</span>
                          {guests > 1 && <span>• {guests} comensales</span>}
                        </p>
                      )}
                    </div>

                    {assignedHostPub ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateWeek({
                            ...week,
                            weekend: {
                              ...w,
                              hospitalityStatus:
                                w.hospitalityStatus === 'confirmada' ? 'pendiente' : 'confirmada',
                            },
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                          w.hospitalityStatus === 'confirmada'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}
                      >
                        {w.hospitalityStatus === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOneClickAssignWeek(week)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold text-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Asignar en 1 Clic</span>
                      </button>
                    )}
                  </div>

                  {/* Host Selector & Meal Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Familia Anfitriona Asignada
                      </label>
                      <select
                        value={w.hospitalityPublisherId || ''}
                        onChange={(e) =>
                          updateWeek({
                            ...week,
                            weekend: {
                              ...w,
                              hospitalityPublisherId: e.target.value || undefined,
                              hospitalityMealType: w.hospitalityMealType || 'almuerzo',
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-hidden"
                      >
                        <option value="">-- Sin asignar --</option>
                        {rankedSuggestions.length > 0 && (
                          <optgroup label="⭐ Sugeridos por Rotación y Capacidad">
                            {rankedSuggestions.map((s) => (
                              <option key={s.host.id} value={s.host.publisherId}>
                                {s.isAvailable && s.meetsCapacity ? '✅' : '⚠️'} {s.publisher.name} (Cap: {s.host.capacity}p) — {s.reasonBadge}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Todos los Publicadores">
                          {publishers
                            .filter((p) => p.active)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                        Modalidad de Atención
                      </label>
                      <select
                        value={w.hospitalityMealType || 'almuerzo'}
                        onChange={(e) =>
                          updateWeek({
                            ...week,
                            weekend: {
                              ...w,
                              hospitalityMealType: e.target.value as HospitalityMealType,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-hidden"
                      >
                        {Object.entries(MEAL_TYPE_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {w.visitingSpeakerDietaryNotes && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px]">
                      <strong>⚠️ Alergias / Dieta del Orador:</strong> {w.visitingSpeakerDietaryNotes}
                    </div>
                  )}
                </div>

                {/* 1-Click WhatsApp Reminders */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  {assignedHostPub && (
                    <button
                      onClick={() => {
                        const res = buildWhatsAppHostFamilyReminder(
                          week,
                          settings,
                          publishersMap,
                          hospitalityHosts
                        );
                        if (!res) return;
                        const url = res.phoneClean
                          ? `https://wa.me/${res.phoneClean}?text=${encodeURIComponent(res.message)}`
                          : `https://wa.me/?text=${encodeURIComponent(res.message)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-500/20 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5 text-amber-600" />
                      <span>WhatsApp Anfitrión</span>
                    </button>
                  )}

                  {isVisiting && (
                    <button
                      onClick={() => {
                        const { phoneClean, message } = buildWhatsAppVisitingSpeakerInvite(
                          week,
                          settings,
                          publishersMap,
                          hospitalityHosts
                        );
                        const url = phoneClean
                          ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
                          : `https://wa.me/?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Orador</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==========================================
          VIEW 2: DIRECTORIO DE FAMILIAS ANFITRIONAS
      ========================================== */}
      {activeSubView === 'anfitriones' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por familia, teléfono o notas..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtro:</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({hospitalityHosts.length})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'active'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Disponibles ({stats.activeCount})
                </button>
                <button
                  onClick={() => setFilterStatus('allergies')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    filterStatus === 'allergies'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Con Notas ({stats.withAllergies})
                </button>
              </div>
            </div>
          </div>

          {/* Host Families Grid */}
          {filteredHosts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No hay anfitriones registrados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Registra las familias de la congregación dispuestas a ofrecer comida u hospedaje a los discursantes visitantes.
              </p>
              <button
                onClick={openNewModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Primera Familia</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHosts.map((host) => {
                const pub = publishersMap.get(host.publisherId);
                const familyName = pub?.name || 'Familia';
                const phone = host.contactPhone || pub?.phone;
                const address = host.alternateAddress || pub?.address;
                const assignments = hostAssignments.get(host.publisherId) || [];

                return (
                  <div
                    key={host.id}
                    className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                            {familyName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                              {familyName}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                🍽️ Capacidad: {host.capacity} pers.
                              </span>
                              <span className="text-[11px] text-slate-400">
                                • {assignments.length} turno(s)
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleActive(host)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            host.active
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10'
                          }`}
                          title="Alternar disponibilidad"
                        >
                          {host.active ? 'Disponible' : 'En Pausa'}
                        </button>
                      </div>

                      <div className="space-y-2 py-2 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300">
                        {phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{phone}</span>
                          </div>
                        )}

                        {address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">{address}</span>
                          </div>
                        )}

                        {host.dietaryNotes && (
                          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
                            <div className="font-semibold text-[11px] flex items-center gap-1 mb-0.5">
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>Dietas / Alergias:</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">{host.dietaryNotes}</p>
                          </div>
                        )}

                        {host.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Nota: {host.notes}
                          </div>
                        )}

                        {assignments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                              📅 Turnos asignados:
                            </span>
                            {assignments.slice(0, 3).map((a, i) => (
                              <div key={i} className="text-[11px] text-slate-700 dark:text-slate-300">
                                • {a.date}: {a.speakerName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                      {phone ? (
                        <button
                          onClick={() => handleSendFamilyMessage(host)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(host)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Editar anfitrión"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(host.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar anfitrión"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal: Crear / Editar Anfitrión */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131d2e] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingHost ? 'Editar Anfitrión' : 'Nuevo Anfitrión de Hospitalidad'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro de hospitalidad para oradores visitantes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Familia / Publicador *
                </label>
                <select
                  value={selectedPublisherId}
                  onChange={(e) => setSelectedPublisherId(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    Selecciona un hermano o familia...
                  </option>
                  {publishers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.privilege ? `(${p.privilege.replace('_', ' ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Capacidad (Personas)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setCapacity((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-slate-900 dark:text-white text-sm">
                      {capacity} {capacity === 1 ? 'persona' : 'personas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCapacity((prev) => Math.min(20, prev + 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <SplashCheckbox
                      size="sm"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      label="Disponible para recibir oradores"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Dirección Alterna (Opcional)
                </label>
                <input
                  type="text"
                  value={alternateAddress}
                  onChange={(e) => setAlternateAddress(e.target.value)}
                  placeholder="Dejar vacío para usar la dirección del publicador..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Dejar vacío para usar el teléfono del directorio..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Alergias, Dietas y Restricciones
                </label>
                <textarea
                  rows={2}
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="Ej: Alergia a mariscos, solo almuerzos en domingo, hay mascota en casa..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Notas Internas
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cualquier indicación adicional..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md dark:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  Guardar Anfitrión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HospitalidadTab;
