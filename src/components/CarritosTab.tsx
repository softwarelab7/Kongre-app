// src/components/CarritosTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { CartShift, CartLocation } from '../types';
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
  X,
  MessageCircle,
  Sparkles,
  Printer,
  BarChart3,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { openWhatsAppLink } from '../utils/whatsapp';
import {
  evaluateCartShiftPair,
  autoAssignCartShiftsKHS,
  computeCartEquityMatrix,
  buildCartShiftWhatsAppSlip,
  printCartScheduleA4KHS,
  isCompatibleCartPair,
} from '../utils/khsPublicWitnessingEngine';
import { arePublishersFamily } from '../utils/familyGrouping';

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
  const [showEquityPanel, setShowEquityPanel] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteShiftId, setConfirmDeleteShiftId] = useState<string | null>(null);
  const [confirmDeleteLocId, setConfirmDeleteLocId] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3800);
  };

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
    return publishers.filter((p) => p.active !== false);
  }, [publishers]);

  // Evaluations map for all shifts
  const shiftEvaluationsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateCartShiftPair>>();
    cartShifts.forEach((s) => {
      map.set(s.id, evaluateCartShiftPair(s, cartShifts, publishersMap));
    });
    return map;
  }, [cartShifts, publishersMap]);

  // Equity matrix
  const equityRows = useMemo(() => {
    return computeCartEquityMatrix(cartShifts, publishers, publishersMap);
  }, [cartShifts, publishers, publishersMap]);

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
    let familyPairs = 0;
    let warningsCount = 0;
    shiftEvaluationsMap.forEach((ev) => {
      if (ev.isFamilyPair || ev.isFixedPartnerPair) familyPairs++;
      if (ev.warnings.length > 0) warningsCount++;
    });
    return { total, covered, partial, empty, familyPairs, warningsCount };
  }, [cartShifts, shiftEvaluationsMap]);

  // Smart Auto-Assign Handler
  const handleAutoAssignCarts = (mode: 'fill_vacant' | 'reassign_all') => {
    if (cartShifts.length === 0) {
      triggerToast('Primero crea al menos un turno de carrito.');
      return;
    }
    const { updatedShifts, assignedCount, familyPairsCount } = autoAssignCartShiftsKHS(
      cartShifts,
      publishers,
      mode
    );
    updatedShifts.forEach((s) => {
      updateCartShift(s);
    });
    triggerToast(
      mode === 'fill_vacant'
        ? `Se completaron ${assignedCount} lugares vacantes (${familyPairsCount} turnos en pareja familiar/fija).`
        : `Se rotaron todos los turnos equitativamente (${familyPairsCount} parejas familiares/fijas).`
    );
  };

  // Fix a single shift with a compatible partner
  const handleQuickFillCompatiblePartner = (shift: CartShift) => {
    const { updatedShifts } = autoAssignCartShiftsKHS(
      [{ ...shift, publisher2Id: shift.publisher1Id ? undefined : shift.publisher2Id }],
      publishers,
      'fill_vacant'
    );
    if (updatedShifts[0]) {
      updateCartShift(updatedShifts[0]);
      triggerToast('Compañero compatible asignado automáticamente.');
    }
  };

  // Generate standard shifts for a location
  const handleGenerateStandardShiftsForLoc = (locId: string, locName: string) => {
    const templateDays = ['Lunes', 'Miércoles', 'Viernes', 'Sábado'];
    templateDays.forEach((day) => {
      const exists = cartShifts.some(
        (s) => s.locationId === locId && s.dayOfWeek === day && s.startTime === '09:00'
      );
      if (!exists) {
        addCartShift({
          locationId: locId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '11:00',
          notes: 'Turno matutino',
        });
      }
    });
    triggerToast(`Se generaron turnos matutinos estándar para ${locName}.`);
  };

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
      triggerToast('Turno de exhibidor actualizado.');
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
      triggerToast('Nuevo turno de exhibidor creado.');
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
      triggerToast('Punto de exhibidor actualizado.');
    } else {
      addCartLocation({
        name: locForm.name.trim(),
        address: locForm.address.trim(),
        notes: locForm.notes.trim() || undefined,
        active: locForm.active,
      });
      triggerToast('Nuevo punto de exhibidor registrado.');
    }
    setIsLocModalOpen(false);
  };

  // Copy full cart schedule for WhatsApp
  const handleCopyScheduleWhatsApp = () => {
    let msg = `*🛒 HORARIO DE TESTIMONIO PÚBLICO CON EXHIBIDORES (CARRITOS)*\n`;
    msg += `🏛 *Congregación:* ${settings.congregationName}\n\n`;

    cartLocations.forEach((loc) => {
      const locShifts = cartShifts.filter((s) => s.locationId === loc.id);
      if (locShifts.length === 0) return;

      msg += `📍 *PUNTO: ${loc.name.toUpperCase()}*\n`;
      if (loc.address) msg += `   Dirección: ${loc.address}\n`;

      locShifts.forEach((s) => {
        const p1 = s.publisher1Id ? publishersMap.get(s.publisher1Id)?.name : 'Vacante';
        const p2 = s.publisher2Id ? publishersMap.get(s.publisher2Id)?.name : 'Vacante';
        msg += `   • ${s.dayOfWeek} ${s.startTime}-${s.endTime}: *${p1}* & *${p2}*\n`;
      });
      msg += `\n`;
    });

    msg += `_Por favor llegue 10 minutos antes para la instalación del exhibidor. En caso de no poder asistir, coordine un reemplazo con antelación._`;

    navigator.clipboard.writeText(msg);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2500);
  };

  // Sort publishers in modal so family/compatible partners appear highlighted when P1 is selected
  const sortedPublishersForP2 = useMemo(() => {
    if (!shiftForm.publisher1Id) return activePublishers;
    const p1 = publishersMap.get(shiftForm.publisher1Id);
    if (!p1) return activePublishers;
    return [...activePublishers]
      .filter((p) => p.id !== p1.id)
      .sort((a, b) => {
        const aFam = arePublishersFamily(p1, a) ? 0 : 1;
        const bFam = arePublishersFamily(p1, b) ? 0 : 1;
        if (aFam !== bFam) return aFam - bFam;
        const aComp = isCompatibleCartPair(p1, a) ? 0 : 1;
        const bComp = isCompatibleCartPair(p1, b) ? 0 : 1;
        if (aComp !== bComp) return aComp - bComp;
        return a.name.localeCompare(b.name);
      });
  }, [activePublishers, shiftForm.publisher1Id, publishersMap]);

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Acciones de Carritos */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Testimonio Público S-148 • Emparejamiento Inteligente
          </span>
          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
            {cartLocations.length} puntos autorizados • {cartShifts.length} turnos semanales •{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {stats.familyPairs} parejas familiares/fijas
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAutoAssignCarts('fill_vacant')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Completa automáticamente lugares vacantes emparejando matrimonios/familiares o hermanos del mismo género"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Emparejar Vacantes</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoAssignCarts('reassign_all')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            title="Rota equitativamente todos los turnos entre los publicadores aprobados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rotar Turnos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEquityPanel(!showEquityPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showEquityPanel
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Equidad</span>
          </button>

          <button
            type="button"
            onClick={() =>
              printCartScheduleA4KHS(cartLocations, cartShifts, publishersMap, settings)
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Imprimir Cuadrante A4 para el Tablero del Salón"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir A4</span>
          </button>

          <button
            type="button"
            onClick={handleCopyScheduleWhatsApp}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            {copiedSchedule ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>WhatsApp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenNewLoc}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Puntos ({cartLocations.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewShift}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Turno</span>
          </button>
        </div>
      </div>

      {/* Panel Desplegable de Equidad de Turnos */}
      {showEquityPanel && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 p-4 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>Matriz de Equidad en Predicación Pública con Exhibidores</span>
              </h3>
              <p className="text-xs text-slate-500">
                Distribución acumulada de turnos semanales y coincidencias familiares por publicador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEquityPanel(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-3">Publicador/a</th>
                  <th className="py-2 px-3">Estado / Precursorado</th>
                  <th className="py-2 px-3 text-center">Total Turnos</th>
                  <th className="py-2 px-3 text-center">En Familia</th>
                  <th className="py-2 px-3">Horarios Asignados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {equityRows.slice(0, 25).map((r) => (
                  <tr key={r.publisher.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                      {r.publisher.name}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {r.publisher.pioneerStatus === 'regular'
                        ? 'Precursor Regular'
                        : r.publisher.pioneerStatus === 'especial'
                        ? 'Precursor Especial'
                        : 'Publicador Aprobado'}
                    </td>
                    <td className="py-2 px-3 text-center font-extrabold text-amber-700 dark:text-amber-400">
                      {r.shiftsCount}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-600">
                      {r.familyShiftsCount > 0 ? `👨‍👩‍👧‍👦 ${r.familyShiftsCount}` : '—'}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-500">
                      {r.daysAssigned.join(', ') || 'Disponible'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Turnos
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.covered}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Cubiertos (2 pub.)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.partial}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Incompletos (1 pub.)
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.empty}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Vacantes (0 pub.)
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['todos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(
            (day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDay === day
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No hay turnos configurados
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Presione &ldquo;Nuevo Turno&rdquo; para programar salidas de testimonio con carritos y
            asignar a los publicadores.
          </p>
          <button
            type="button"
            onClick={handleOpenNewShift}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Crear Turno
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredShifts.map((shift) => {
            const loc = cartLocations.find((l) => l.id === shift.locationId);
            const pub1 = shift.publisher1Id ? publishersMap.get(shift.publisher1Id) : null;
            const pub2 = shift.publisher2Id ? publishersMap.get(shift.publisher2Id) : null;
            const evaluation = shiftEvaluationsMap.get(shift.id);
            const isFull = Boolean(pub1 && pub2);
            const isPartial = Boolean((pub1 && !pub2) || (!pub1 && pub2));

            return (
              <div
                key={shift.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between ${
                  evaluation?.warnings.length
                    ? 'border-amber-300 dark:border-amber-700'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Day & Time */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                        <Calendar className="w-4 h-4" />
                        <span>{shift.dayOfWeek}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isFull
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {isFull ? 'Cubierto' : isPartial ? '1 vacante' : 'Sin asignar'}
                      </span>

                      {evaluation?.isFamilyPair && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">
                          👨‍👩‍👧‍👦 Pareja Familiar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location badge */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {loc?.name || 'Punto no asignado'}
                      </span>
                      {loc?.address && (
                        <span className="text-[11px] text-slate-400">{loc.address}</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Publishers */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pareja Asignada
                      </span>
                      {!isFull && (
                        <button
                          type="button"
                          onClick={() => handleQuickFillCompatiblePartner(shift)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Autocompletar</span>
                        </button>
                      )}
                    </div>

                    {/* Publisher 1 */}
                    <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            pub1 ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold truncate ${
                            pub1 ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'
                          }`}
                        >
                          {pub1 ? pub1.name : 'Publicador 1 por asignar'}
                        </span>
                      </div>
                      {pub1?.phone && (
                        <a
                          href={`https://wa.me/${pub1.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Publisher 2 */}
                    <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            pub2 ? 'bg-emerald-500' : 'bg-red-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold truncate ${
                            pub2 ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'
                          }`}
                        >
                          {pub2 ? pub2.name : 'Publicador 2 por asignar'}
                        </span>
                      </div>
                      {pub2?.phone && (
                        <a
                          href={`https://wa.me/${pub2.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-600"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Avisos del Radar Teocrático de Pareja */}
                  {evaluation && evaluation.warnings.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                      {evaluation.warnings.map((wText, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-200"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{wText}</span>
                        </div>
                      ))}
                      {evaluation.hasMixedGenderWarning && (
                        <button
                          type="button"
                          onClick={() => handleQuickFillCompatiblePartner(shift)}
                          className="w-full py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Reemplazar por Compañero Compatible
                        </button>
                      )}
                    </div>
                  )}

                  {shift.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 dark:bg-slate-800/50 p-2 rounded-lg border border-amber-100/50 dark:border-slate-700">
                      {shift.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const slip = buildCartShiftWhatsAppSlip(
                        shift,
                        loc,
                        publishersMap,
                        settings.congregationName
                      );
                      openWhatsAppLink(pub1?.phone || pub2?.phone || '', slip);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                    title="Enviar recordatorio del turno por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Aviso Turno</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditShift(shift)}
                      className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      title="Editar asignación del turno"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {confirmDeleteShiftId === shift.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteCartShift(shift.id);
                          setConfirmDeleteShiftId(null);
                          triggerToast('Turno de exhibidor eliminado.');
                        }}
                        className="px-2 py-1 text-[10px] font-bold bg-rose-600 text-white rounded-lg cursor-pointer"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteShiftId(shift.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar turno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT SHIFT */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-600" />
                <span>{editingShift ? 'Editar Turno de Carrito' : 'Nuevo Turno de Carrito'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Punto de Carrito
                </label>
                <select
                  required
                  value={shiftForm.locationId}
                  onChange={(e) => setShiftForm({ ...shiftForm, locationId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Día
                  </label>
                  <select
                    value={shiftForm.dayOfWeek}
                    onChange={(e) => setShiftForm({ ...shiftForm, dayOfWeek: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inicio
                  </label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fin
                  </label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primer Publicador/a
                </label>
                <select
                  value={shiftForm.publisher1Id}
                  onChange={(e) => setShiftForm({ ...shiftForm, publisher1Id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Segundo Publicador/a (Prioriza Familia o Mismo Género)
                </label>
                <select
                  value={shiftForm.publisher2Id}
                  onChange={(e) => setShiftForm({ ...shiftForm, publisher2Id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                >
                  <option value="">-- Sin asignar --</option>
                  {sortedPublishersForP2.map((p) => {
                    const p1 = shiftForm.publisher1Id
                      ? publishersMap.get(shiftForm.publisher1Id)
                      : undefined;
                    const isFam = p1 ? arePublishersFamily(p1, p) : false;
                    return (
                      <option key={p.id} value={p.id}>
                        {isFam ? '👨‍👩‍👧‍👦 [Familia] ' : ''}
                        {p.name} ({p.gender === 'hermana' ? 'Hna' : 'Hno'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Llevar sombrilla, pedir llaves en el salón..."
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span>{editingLoc ? 'Editar Punto de Carrito' : 'Nuevo Punto de Carrito'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsLocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoc} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Punto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Plaza de Armas / Entrada Metro"
                  value={locForm.name}
                  onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección o Referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Esquina Norte con Calle Colón"
                  value={locForm.address}
                  onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones o Llaves (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Solicitar llaves del carrito en conserjería..."
                  value={locForm.notes}
                  onChange={(e) => setLocForm({ ...locForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                >
                  Guardar Punto
                </button>
              </div>
            </form>

            {/* List of existing locations with edit/delete + 1-click shift generator */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Puntos Registrados
              </span>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {cartLocations.map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {l.name}
                      </span>
                      {l.address && (
                        <span className="text-[10px] text-slate-400 block truncate">{l.address}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleGenerateStandardShiftsForLoc(l.id, l.name)}
                        className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer"
                        title="Generar turnos base (Lun/Mié/Vie/Sáb)"
                      >
                        +Turnos Base
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditLoc(l)}
                        className="p-1 text-slate-400 hover:text-amber-700 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteLocId === l.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteCartLocation(l.id);
                            setConfirmDeleteLocId(null);
                          }}
                          className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded cursor-pointer"
                        >
                          Sí
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteLocId(l.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
