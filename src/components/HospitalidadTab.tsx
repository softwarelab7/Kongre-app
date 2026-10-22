// src/components/HospitalidadTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { HospitalityHost, Publisher } from '../types';
import { SplashCheckbox } from './SplashCheckbox';
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
    settings,
  } = useCongregation();

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

  // Computed metrics
  const stats = useMemo(() => {
    const total = hospitalityHosts.length;
    const activeCount = hospitalityHosts.filter(h => h.active).length;
    const totalCapacity = hospitalityHosts
      .filter(h => h.active)
      .reduce((sum, h) => sum + (h.capacity || 0), 0);
    const withAllergies = hospitalityHosts.filter(h => !!h.dietaryNotes?.trim()).length;
    return { total, activeCount, totalCapacity, withAllergies };
  }, [hospitalityHosts]);

  // Map of hosts to upcoming assigned weekend talks
  const hostAssignments = useMemo(() => {
    const map = new Map<string, Array<{ weekStartDate: string; speakerName: string }>>();
    weeks.forEach(w => {
      const pubId = w.weekend.hospitalityPublisherId;
      if (pubId) {
        const list = map.get(pubId) || [];
        list.push({
          weekStartDate: w.weekStartDate,
          speakerName: w.weekend.publicTalkSpeaker || 'Orador Visitante',
        });
        map.set(pubId, list);
      }
    });
    return map;
  }, [weeks]);

  // Filtered hosts
  const filteredHosts = useMemo(() => {
    return hospitalityHosts.filter(h => {
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

    if (!editingHost && hospitalityHosts.some(h => h.publisherId === selectedPublisherId)) {
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
  };

  const handleDelete = (hostId: string) => {
    if (confirm('¿Eliminar esta familia del directorio de hospitalidad?')) {
      deleteHospitalityHost(hostId);
    }
  };

  const handleToggleActive = (host: HospitalityHost) => {
    updateHospitalityHost({
      ...host,
      active: !host.active,
    });
  };

  // Copy WhatsApp Directory
  const handleCopyWhatsAppList = () => {
    let msg = `*🍽️ DIRECTORIO DE HOSPITALIDAD - ${settings.congregationName?.toUpperCase() || 'CONGREGACIÓN'}*\n`;
    msg += `Familias dispuestas a recibir oradores visitantes:\n\n`;

    const activeList = hospitalityHosts.filter(h => h.active);
    if (activeList.length === 0) {
      msg += `(No hay familias activas registradas actualmente)\n`;
    } else {
      activeList.forEach((h, idx) => {
        const pub = publishersMap.get(h.publisherId);
        const name = pub?.name || 'Familia';
        const phone = h.contactPhone || pub?.phone || 'Sin teléfono';
        const addr = h.alternateAddress || pub?.address || '';

        msg += `${idx + 1}. *${name}*\n`;
        msg += `   • Capacidad: ${h.capacity} comensales\n`;
        msg += `   • Teléfono: ${phone}\n`;
        if (addr) msg += `   • Dirección: ${addr}\n`;
        if (h.dietaryNotes) msg += `   • Notas/Dietas: ${h.dietaryNotes}\n`;
        msg += `\n`;
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
      `Hola querido hermano ${pub?.name || ''}, le saludamos con cariño desde la congregación ${settings.congregationName || ''} para coordinar la hospitalidad de un orador visitante. ¡Muchas gracias por su espíritu dispuesto!`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones de Hospitalidad (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {hospitalityHosts.length} familias registradas • {stats.totalCapacity} comensales en total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyWhatsAppList}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-white/[0.08] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Copiar lista completa formateada para WhatsApp"
          >
            {copiedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Copiar para WhatsApp</span>
              </>
            )}
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md dark:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Anfitrión</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Familias Registradas</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Disponibles / Activas</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCapacity} pers.</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capacidad Total</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stats.withAllergies}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Con Notas / Alergias</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay anfitriones registrados</h3>
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
          {filteredHosts.map(host => {
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
                  {/* Top line: name & active pill */}
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

                  {/* Details section */}
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

                    {/* Assigned talk meetings */}
                    {assignments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                          📅 Próximas asignaciones:
                        </span>
                        {assignments.slice(0, 2).map((a, i) => (
                          <div key={i} className="text-[11px] text-slate-700 dark:text-slate-300">
                            • {a.weekStartDate}: {a.speakerName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card actions */}
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

      {/* Modal: Crear / Editar Anfitrión */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131d2e] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
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

            {/* Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Publisher Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Familia / Publicador *
                </label>
                <select
                  value={selectedPublisherId}
                  onChange={e => setSelectedPublisherId(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>Selecciona un hermano o familia...</option>
                  {publishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.privilege ? `(${p.privilege.replace('_', ' ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity Counter & Active Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Capacidad (Personas)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => setCapacity(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-slate-900 dark:text-white text-sm">
                      {capacity} {capacity === 1 ? 'persona' : 'personas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCapacity(prev => Math.min(20, prev + 1))}
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
                      onChange={e => setIsActive(e.target.checked)}
                      label="Disponible para recibir oradores"
                    />
                  </div>
                </div>
              </div>

              {/* Alternate Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Dirección Alterna (Opcional)
                </label>
                <input
                  type="text"
                  value={alternateAddress}
                  onChange={e => setAlternateAddress(e.target.value)}
                  placeholder="Dejar vacío para usar la dirección del publicador..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="Dejar vacío para usar el teléfono del directorio..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dietary notes & Allergies */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Alergias, Dietas y Restricciones
                </label>
                <textarea
                  rows={2}
                  value={dietaryNotes}
                  onChange={e => setDietaryNotes(e.target.value)}
                  placeholder="Ej: Alergia a mariscos, solo almuerzos en domingo, hay mascota en casa..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* General notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Notas Internas
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Cualquier indicación adicional..."
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Footer */}
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
