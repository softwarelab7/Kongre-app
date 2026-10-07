// src/components/CarritosTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { CartShift, CartLocation, Publisher } from '../types';
import {
  Compass,
  MapPin,
  Clock,
  Users,
  Plus,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Send,
  UserCheck,
  X,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export const CarritosTab: React.FC = () => {
  const {
    cartLocations,
    cartShifts,
    addCartLocation,
    updateCartLocation,
    deleteCartLocation,
    addCartShift,
    updateCartShift,
    deleteCartShift,
    publishers,
    publishersMap,
    settings,
  } = useCongregation();

  const [selectedDay, setSelectedDay] = useState<string>('todos');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('todos');
  const [copiedSchedule, setCopiedSchedule] = useState(false);

  // Shift Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<CartShift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    locationId: '',
    dayOfWeek: 'Lunes',
    startTime: '09:30',
    endTime: '11:30',
    publisher1Id: '',
    publisher2Id: '',
    notes: '',
  });

  // Location Modal State
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<CartLocation | null>(null);
  const [locForm, setLocForm] = useState({
    name: '',
    address: '',
    notes: '',
    active: true,
  });

  // Active publishers list for assignment
  const activePublishers = useMemo(() => {
    return publishers.filter((p) => p.active);
  }, [publishers]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return cartShifts.filter((s) => {
      if (selectedDay !== 'todos' && s.dayOfWeek !== selectedDay) return false;
      if (selectedLocationId !== 'todos' && s.locationId !== selectedLocationId) return false;
      return true;
    });
  }, [cartShifts, selectedDay, selectedLocationId]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = cartShifts.length;
    const covered = cartShifts.filter((s) => s.publisher1Id && s.publisher2Id).length;
    const partial = cartShifts.filter(
      (s) => (s.publisher1Id && !s.publisher2Id) || (!s.publisher1Id && s.publisher2Id)
    ).length;
    const empty = cartShifts.filter((s) => !s.publisher1Id && !s.publisher2Id).length;
    return { total, covered, partial, empty };
  }, [cartShifts]);

  // Open Shift Create / Edit
  const handleOpenNewShift = () => {
    setEditingShift(null);
    setShiftForm({
      locationId: cartLocations[0]?.id || '',
      dayOfWeek: 'Lunes',
      startTime: '09:30',
      endTime: '11:30',
      publisher1Id: '',
      publisher2Id: '',
      notes: '',
    });
    setIsShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: CartShift) => {
    setEditingShift(shift);
    setShiftForm({
      locationId: shift.locationId,
      dayOfWeek: shift.dayOfWeek,
      startTime: shift.startTime,
      endTime: shift.endTime,
      publisher1Id: shift.publisher1Id || '',
      publisher2Id: shift.publisher2Id || '',
      notes: shift.notes || '',
    });
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.locationId) return;

    if (editingShift) {
      updateCartShift({
        ...editingShift,
        locationId: shiftForm.locationId,
        dayOfWeek: shiftForm.dayOfWeek,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        publisher1Id: shiftForm.publisher1Id || undefined,
        publisher2Id: shiftForm.publisher2Id || undefined,
        notes: shiftForm.notes || undefined,
      });
    } else {
      addCartShift({
        locationId: shiftForm.locationId,
        dayOfWeek: shiftForm.dayOfWeek,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        publisher1Id: shiftForm.publisher1Id || undefined,
        publisher2Id: shiftForm.publisher2Id || undefined,
        notes: shiftForm.notes || undefined,
      });
    }
    setIsShiftModalOpen(false);
  };

  // Open Location Create / Edit
  const handleOpenNewLoc = () => {
    setEditingLoc(null);
    setLocForm({ name: '', address: '', notes: '', active: true });
    setIsLocModalOpen(true);
  };

  const handleOpenEditLoc = (loc: CartLocation) => {
    setEditingLoc(loc);
    setLocForm({
      name: loc.name,
      address: loc.address,
      notes: loc.notes || '',
      active: loc.active,
    });
    setIsLocModalOpen(true);
  };

  const handleSaveLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locForm.name.trim()) return;

    if (editingLoc) {
      updateCartLocation({
        ...editingLoc,
        name: locForm.name.trim(),
        address: locForm.address.trim(),
        notes: locForm.notes.trim() || undefined,
        active: locForm.active,
      });
    } else {
      addCartLocation({
        name: locForm.name.trim(),
        address: locForm.address.trim(),
        notes: locForm.notes.trim() || undefined,
        active: locForm.active,
      });
    }
    setIsLocModalOpen(false);
  };

  // Copy full cart schedule for WhatsApp
  const handleCopyScheduleWhatsApp = () => {
    let msg = `*HORARIO DE TESTIMONIO PÚBLICO CON CARRITOS*\n`;
    msg += `Congregación: ${settings.congregationName}\n\n`;

    cartLocations.forEach((loc) => {
      const locShifts = cartShifts.filter((s) => s.locationId === loc.id);
      if (locShifts.length === 0) return;

      msg += `📍 *PUNTO: ${loc.name.toUpperCase()}*\n`;
      if (loc.address) msg += `   Dirección: ${loc.address}\n`;

      locShifts.forEach((s) => {
        const p1 = s.publisher1Id ? publishersMap.get(s.publisher1Id)?.name : 'Vacante';
        const p2 = s.publisher2Id ? publishersMap.get(s.publisher2Id)?.name : 'Vacante';
        msg += `   • ${s.dayOfWeek} ${s.startTime}-${s.endTime}: ${p1} & ${p2}\n`;
      });
      msg += `\n`;
    });

    msg += `_Por favor llegue 10 minutos antes para la instalación del carrito. En caso de no poder asistir, coordine un reemplazo con antelación._`;

    navigator.clipboard.writeText(msg);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* SectionHeader Kongre 1 Style */}
      <SectionHeader
        icon={Compass}
        title="Predicación con"
        highlightWord="Carritos"
        subtitle="Puntos autorizados, turnos semanales y asignación de parejas teocráticas"
        colorTheme="amber"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyScheduleWhatsApp}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/80 border border-slate-200/60 dark:border-white/[0.06] text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              {copiedSchedule ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">¡Horario Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Copiar para WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenNewLoc}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/80 border border-slate-200/60 dark:border-white/[0.06] text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Puntos de Carrito</span>
            </button>

            <button
              onClick={handleOpenNewShift}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-md dark:shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Turno</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Turnos</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.covered}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cubiertos (2 pub.)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.partial}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Incompletos (1 pub.)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.empty}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vacantes (0 pub.)</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['todos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(
            (day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDay === day
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day === 'todos' ? 'Todos los días' : day}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold whitespace-nowrap">Punto:</span>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            <option value="todos">Todos los puntos ({cartLocations.length})</option>
            {cartLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shifts Grid */}
      {filteredShifts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No hay turnos configurados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Presione &ldquo;Nuevo Turno&rdquo; para programar salidas de testimonio con carritos y
            asignar a los publicadores.
          </p>
          <button
            onClick={handleOpenNewShift}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl"
          >
            Crear Turno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredShifts.map((shift) => {
            const loc = cartLocations.find((l) => l.id === shift.locationId);
            const pub1 = shift.publisher1Id ? publishersMap.get(shift.publisher1Id) : null;
            const pub2 = shift.publisher2Id ? publishersMap.get(shift.publisher2Id) : null;
            const isFull = pub1 && pub2;
            const isPartial = (pub1 && !pub2) || (!pub1 && pub2);

            return (
              <div
                key={shift.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Day & Time */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700">
                        <Calendar className="w-4 h-4" />
                        <span>{shift.dayOfWeek}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isFull
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPartial
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isFull ? 'Cubierto' : isPartial ? '1 vacante' : 'Sin asignar'}
                    </span>
                  </div>

                  {/* Location badge */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {loc?.name || 'Punto no asignado'}
                      </span>
                      {loc?.address && (
                        <span className="text-[11px] text-slate-400">{loc.address}</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Publishers */}
                  <div className="space-y-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Pareja Asignada
                    </span>

                    {/* Publisher 1 */}
                    <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            pub1 ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            pub1 ? 'text-slate-900' : 'text-slate-400 italic'
                          }`}
                        >
                          {pub1 ? pub1.name : 'Publicador 1 por asignar'}
                        </span>
                      </div>
                      {pub1?.phone && (
                        <a
                          href={`https://wa.me/${pub1.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Publisher 2 */}
                    <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            pub2 ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            pub2 ? 'text-slate-900' : 'text-slate-400 italic'
                          }`}
                        >
                          {pub2 ? pub2.name : 'Publicador 2 por asignar'}
                        </span>
                      </div>
                      {pub2?.phone && (
                        <a
                          href={`https://wa.me/${pub2.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {shift.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                      {shift.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEditShift(shift)}
                    className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                    title="Editar asignación del turno"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este turno de carritos?')) deleteCartShift(shift.id);
                    }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar turno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT SHIFT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-600" />
                <span>{editingShift ? 'Editar Turno de Carrito' : 'Nuevo Turno de Carrito'}</span>
              </h3>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Punto de Carrito
                </label>
                <select
                  required
                  value={shiftForm.locationId}
                  onChange={(e) => setShiftForm({ ...shiftForm, locationId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">-- Seleccione un punto --</option>
                  {cartLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Día</label>
                  <select
                    value={shiftForm.dayOfWeek}
                    onChange={(e) => setShiftForm({ ...shiftForm, dayOfWeek: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inicio</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fin</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primer Publicador/a
                </label>
                <select
                  value={shiftForm.publisher1Id}
                  onChange={(e) => setShiftForm({ ...shiftForm, publisher1Id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="">-- Sin asignar --</option>
                  {activePublishers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === 'hermana' ? 'Hna' : 'Hno'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Segundo Publicador/a (Compañero/a)
                </label>
                <select
                  value={shiftForm.publisher2Id}
                  onChange={(e) => setShiftForm({ ...shiftForm, publisher2Id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="">-- Sin asignar --</option>
                  {activePublishers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.gender === 'hermana' ? 'Hna' : 'Hno'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Llevar sombrilla, pedir llaves en el salón..."
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Guardar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE LOCATIONS */}
      {isLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span>{editingLoc ? 'Editar Punto de Carrito' : 'Nuevo Punto de Carrito'}</span>
              </h3>
              <button
                onClick={() => setIsLocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoc} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Punto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Plaza de Armas / Entrada Metro"
                  value={locForm.name}
                  onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección o Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Esquina Norte con Calle Colón"
                  value={locForm.address}
                  onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones o Llaves (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Solicitar llaves del carrito en conserjería..."
                  value={locForm.notes}
                  onChange={(e) => setLocForm({ ...locForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Guardar Punto
                </button>
              </div>
            </form>

            {/* List of existing locations with edit/delete */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Puntos Registrados
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cartLocations.map((l) => (
                  <div
                    key={l.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{l.name}</span>
                      {l.address && <span className="text-[10px] text-slate-400">{l.address}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditLoc(l)}
                        className="p-1 text-slate-400 hover:text-amber-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar el punto ${l.name}?`)) deleteCartLocation(l.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
