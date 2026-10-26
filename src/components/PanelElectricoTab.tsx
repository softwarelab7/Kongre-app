// src/components/PanelElectricoTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { Breaker } from '../types';
import { SAMPLE_BREAKERS_TEMPLATE } from '../utils/sampleData';
import { BreakerCard } from './electrical/BreakerCard';
import { BreakerModal } from './electrical/BreakerModal';
import {
  Zap,
  Plus,
  Printer,
  ShieldAlert,
  Edit3,
  Power,
  PowerOff,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Trash2,
} from 'lucide-react';

export const PanelElectricoTab: React.FC = () => {
  const {
    breakers,
    addBreaker,
    updateBreaker,
    deleteBreaker,
    toggleBreakerStatus,
    setMeetingBreakersPower,
    reorderBreakers,
    settings,
  } = useCongregation();

  // Mode & filters
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on' | 'event' | 'always' | 'off'>('all');
  const [columnFilter, setColumnFilter] = useState<'all' | 'left' | 'right'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBreaker, setEditingBreaker] = useState<Breaker | null>(null);
  const [targetColumnForNew, setTargetColumnForNew] = useState<'left' | 'right'>('left');
  const [breakerToDelete, setBreakerToDelete] = useState<Breaker | null>(null);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<Breaker | null>(null);
  const [dragOverCol, setDragOverCol] = useState<'left' | 'right' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = breakers.length;
    const on = breakers.filter((b) => b.status === 'on').length;
    const event = breakers.filter((b) => b.status === 'event').length;
    const critical = breakers.filter((b) => b.status === 'always').length;
    const off = breakers.filter((b) => b.status === 'off').length;

    const leftBreakers = breakers.filter((b) => b.col === 'left');
    const rightBreakers = breakers.filter((b) => b.col === 'right');

    const leftAmps = leftBreakers.reduce((sum, b) => sum + (b.amperage || 20), 0);
    const rightAmps = rightBreakers.reduce((sum, b) => sum + (b.amperage || 20), 0);

    return {
      total,
      on,
      event,
      critical,
      off,
      activeTotal: on + event + critical,
      leftCount: leftBreakers.length,
      rightCount: rightBreakers.length,
      leftAmps,
      rightAmps,
    };
  }, [breakers]);

  // Filtered breakers
  const filteredBreakers = useMemo(() => {
    return breakers.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (columnFilter !== 'all' && b.col !== columnFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(query);
        const matchesDesc = b.descripcion?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [breakers, statusFilter, columnFilter, searchQuery]);

  const leftColumnBreakers = useMemo(() => {
    return filteredBreakers
      .filter((b) => b.col === 'left')
      .sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
  }, [filteredBreakers]);

  const rightColumnBreakers = useMemo(() => {
    return filteredBreakers
      .filter((b) => b.col === 'right')
      .sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));
  }, [filteredBreakers]);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, breaker: Breaker) => {
    if (isReadOnly) {
      e.preventDefault();
      return;
    }
    setDraggedItem(breaker);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', breaker.id);
  };

  const handleDragOver = (e: React.DragEvent, col: 'left' | 'right') => {
    e.preventDefault();
    if (!draggedItem || isReadOnly) return;
    setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, targetCol: 'left' | 'right') => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedItem || isReadOnly) return;

    if (draggedItem.col !== targetCol) {
      const colBreakers = breakers.filter((b) => b.col === targetCol);
      const updatedItem: Breaker = {
        ...draggedItem,
        col: targetCol,
        order_idx: colBreakers.length,
      };
      const newBreakers = breakers.map((b) => (b.id === draggedItem.id ? updatedItem : b));
      reorderBreakers(newBreakers);
      showToast(`Circuito trasladado a la barra ${targetCol === 'left' ? 'izquierda' : 'derecha'}`);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverCol(null);
  };

  // Reorder buttons (up / down)
  const handleMove = (id: string, col: 'left' | 'right', direction: 'up' | 'down') => {
    const colList = breakers
      .filter((b) => b.col === col)
      .sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0));

    const currentIndex = colList.findIndex((b) => b.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= colList.length) return;

    // Swap items
    const reorderedCol = [...colList];
    const [moved] = reorderedCol.splice(currentIndex, 1);
    reorderedCol.splice(targetIndex, 0, moved);

    // Re-index
    const otherColBreakers = breakers.filter((b) => b.col !== col);
    const updatedCol = reorderedCol.map((b, idx) => ({ ...b, order_idx: idx }));

    reorderBreakers([...otherColBreakers, ...updatedCol]);
  };

  // Quick Action: Meeting Power Mode
  const handleToggleMeetingMode = (turnOn: boolean) => {
    setMeetingBreakersPower(turnOn);
    showToast(
      turnOn
        ? 'Modo Reunión ACTIVADO: Circuitos de auditorio, audio y video energizados'
        : 'Modo Reunión DESCONECTADO: Circuitos de reunión apagados para ahorro de energía'
    );
  };

  // Save Breaker (create / edit)
  const handleSaveBreaker = (breakerData: Partial<Breaker>) => {
    if (editingBreaker) {
      updateBreaker({
        ...editingBreaker,
        ...breakerData,
      } as Breaker);
      showToast(`Circuito "${breakerData.name}" actualizado`);
    } else {
      addBreaker({
        name: breakerData.name || 'Nuevo Circuito',
        descripcion: breakerData.descripcion || '',
        status: breakerData.status || 'event',
        icon: breakerData.icon || 'outlet',
        color: breakerData.color || 'blue',
        col: breakerData.col || targetColumnForNew,
        order_idx: 999,
        amperage: breakerData.amperage || 20,
      });
      showToast(`Circuito "${breakerData.name}" agregado al tablero`);
    }
    setIsModalOpen(false);
    setEditingBreaker(null);
  };

  const handleConfirmDelete = () => {
    if (breakerToDelete) {
      deleteBreaker(breakerToDelete.id);
      showToast(`Circuito "${breakerToDelete.name}" eliminado`);
      setBreakerToDelete(null);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={18} className="animate-spin text-amber-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barra de Herramientas de Panel Eléctrico (Unified Container) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Sistema Eléctrico
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            Diagrama unifilar y control de circuitos del Salón del Reino
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          {/* Toggle Mode Button */}
          <button
            onClick={() => setIsReadOnly(!isReadOnly)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer active:scale-95 ${
              isReadOnly
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 shadow-2xs'
            }`}
          >
            {isReadOnly ? <ShieldAlert size={15} /> : <Edit3 size={15} />}
            <span>{isReadOnly ? 'Solo Lectura' : 'Modo Edición'}</span>
          </button>

          {/* Quick Meeting Mode Switch */}
          <button
            onClick={() => handleToggleMeetingMode(true)}
            title="Energizar todos los circuitos configurados en Modo Reunión"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 transition-all cursor-pointer active:scale-95"
          >
            <Power size={14} />
            <span>Reunión ON</span>
          </button>

          <button
            onClick={() => handleToggleMeetingMode(false)}
            title="Apagar circuitos de reunión para ahorro de energía"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
          >
            <PowerOff size={14} />
            <span>Reunión OFF</span>
          </button>

          {/* Print Cabinet Door Roster */}
          <button
            onClick={() => window.print()}
            title="Imprimir rótulo reglamentario para la puerta interior del tablero"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 transition-colors text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>Rótulo A4</span>
          </button>

          {/* New Breaker Button */}
          {!isReadOnly && (
            <button
              onClick={() => {
                setEditingBreaker(null);
                setTargetColumnForNew('left');
                setIsModalOpen(true);
              }}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} />
              <span>Nuevo Circuito</span>
            </button>
          )}
        </div>
      </div>

        {/* Banner cuando no hay circuitos configurados */}
        {breakers.length === 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                  Tablero eléctrico limpio (sin datos de prueba)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Agrega los circuitos reales de tu Salón del Reino con el botón "Nuevo Circuito" o carga una plantilla recomendada de ejemplo.
                </p>
              </div>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  reorderBreakers(SAMPLE_BREAKERS_TEMPLATE);
                  showToast('Plantilla sugerida de breakers cargada.');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>Cargar Plantilla Recomendada</span>
              </button>
            )}
          </div>
        )}

        {/* 5 KPI Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Breakers */}
          <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Breakers
              </span>
              <Layers size={18} className="text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                {stats.total}
              </span>
              <span className="text-xs text-zinc-400 font-medium">circuitos</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {stats.leftAmps + stats.rightAmps}A carga instalada
            </div>
          </div>

          {/* Normal ON */}
          <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Normal ON
              </span>
              <CheckCircle2 size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.on}
              </span>
              <span className="text-xs text-zinc-400 font-medium">activos</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">En servicio cotidiano</div>
          </div>

          {/* Modo Reunión */}
          <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Modo Reunión
              </span>
              <Calendar size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {stats.event}
              </span>
              <span className="text-xs text-zinc-400 font-medium">programados</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Auditorio, audio y video</div>
          </div>

          {/* Críticos / Siempre ON */}
          <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Críticos / Siempre ON
              </span>
              <ShieldAlert size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {stats.critical}
              </span>
              <span className="text-xs text-zinc-400 font-medium">ininterrumpidos</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Alarma, CCTV, Internet, Bombas</div>
          </div>

          {/* Apagados (OFF) */}
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Desconectados
              </span>
              <PowerOff size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-zinc-500 dark:text-zinc-400 font-mono">
                {stats.off}
              </span>
              <span className="text-xs text-zinc-400 font-medium">en reposo</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Ahorro de energía activo</div>
          </div>
        </div>

        {/* Search, Filter & Quick Options Strip */}
        <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar circuito por nombre, función o tomas..."
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/[0.1] rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline">Estado:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'on', label: 'Normal ON' },
              { id: 'event', label: 'Reunión' },
              { id: 'always', label: 'Siempre ON' },
              { id: 'off', label: 'Apagados' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Column selector filter */}
          <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-white/[0.08] pl-3">
            <span className="text-xs font-semibold text-zinc-400 mr-1 hidden lg:inline">Barra:</span>
            {[
              { id: 'all', label: 'Ambas' },
              { id: 'left', label: 'Izq (A)' },
              { id: 'right', label: 'Der (B)' },
            ].map((col) => (
              <button
                key={col.id}
                onClick={() => setColumnFilter(col.id as any)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  columnFilter === col.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Electrical Panel Enclosure (Dual Column Board) */}
        <div className="bg-gradient-to-b from-zinc-100 to-zinc-200/80 dark:from-[#0d1627] dark:to-[#0a101d] p-3 sm:p-6 rounded-3xl border-2 border-zinc-300 dark:border-white/[0.1] shadow-2xl relative">
          {/* Metallic Top Header Strip */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-300/80 dark:border-white/[0.08] px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-200 font-mono">
                  TABLERO DE DISTRIBUCIÓN PRINCIPAL (TDP)
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {settings.congregationName || 'Salón del Reino'} • 120V / 240V Bifásico
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Peligro: Alta Tensión
              </span>
            </div>
          </div>

          {/* Grid Layout of the Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {/* Center Busbar Graphic Line (Visible on Large Screens) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-zinc-300 dark:bg-white/[0.08] pointer-events-none" />

            {/* LEFT COLUMN: Fase A / Barra 1 */}
            {(columnFilter === 'all' || columnFilter === 'left') && (
              <div className="flex flex-col gap-3">
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-[#131d2e]/90 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Barra 1 • Lado Izquierdo
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                      {stats.leftCount} ctos. ({stats.leftAmps}A)
                    </span>
                    {!isReadOnly && (
                      <button
                        onClick={() => {
                          setEditingBreaker(null);
                          setTargetColumnForNew('left');
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-indigo-600 dark:text-indigo-400"
                        title="Agregar cto a lado izquierdo"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={(e) => handleDragOver(e, 'left')}
                  onDrop={(e) => handleDrop(e, 'left')}
                  className={`flex flex-col gap-3 min-h-[140px] p-2 rounded-2xl transition-all ${
                    dragOverCol === 'left'
                      ? 'bg-indigo-500/10 border-2 border-dashed border-indigo-500'
                      : 'border border-transparent'
                  }`}
                >
                  {leftColumnBreakers.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/[0.1] bg-white/40 dark:bg-white/[0.01]">
                      <Info size={24} className="mx-auto text-zinc-400 mb-1" />
                      <p className="text-xs text-zinc-400 font-medium">
                        No hay circuitos en la barra izquierda
                      </p>
                    </div>
                  ) : (
                    leftColumnBreakers.map((breaker, idx) => (
                      <BreakerCard
                        key={breaker.id}
                        breaker={breaker}
                        isReadOnly={isReadOnly}
                        index={idx}
                        isFirst={idx === 0}
                        isLast={idx === leftColumnBreakers.length - 1}
                        onToggle={toggleBreakerStatus}
                        onEdit={(b) => {
                          setEditingBreaker(b);
                          setIsModalOpen(true);
                        }}
                        onDelete={() => setBreakerToDelete(breaker)}
                        onMoveUp={(id) => handleMove(id, 'left', 'up')}
                        onMoveDown={(id) => handleMove(id, 'left', 'down')}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: Fase B / Barra 2 */}
            {(columnFilter === 'all' || columnFilter === 'right') && (
              <div className="flex flex-col gap-3">
                {/* Column Header */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/90 dark:bg-[#131d2e]/90 border border-zinc-200 dark:border-white/[0.08] shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Barra 2 • Lado Derecho
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                      {stats.rightCount} ctos. ({stats.rightAmps}A)
                    </span>
                    {!isReadOnly && (
                      <button
                        onClick={() => {
                          setEditingBreaker(null);
                          setTargetColumnForNew('right');
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.05] text-indigo-600 dark:text-indigo-400"
                        title="Agregar cto a lado derecho"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={(e) => handleDragOver(e, 'right')}
                  onDrop={(e) => handleDrop(e, 'right')}
                  className={`flex flex-col gap-3 min-h-[140px] p-2 rounded-2xl transition-all ${
                    dragOverCol === 'right'
                      ? 'bg-indigo-500/10 border-2 border-dashed border-indigo-500'
                      : 'border border-transparent'
                  }`}
                >
                  {rightColumnBreakers.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-white/[0.1] bg-white/40 dark:bg-white/[0.01]">
                      <Info size={24} className="mx-auto text-zinc-400 mb-1" />
                      <p className="text-xs text-zinc-400 font-medium">
                        No hay circuitos en la barra derecha
                      </p>
                    </div>
                  ) : (
                    rightColumnBreakers.map((breaker, idx) => (
                      <BreakerCard
                        key={breaker.id}
                        breaker={breaker}
                        isReadOnly={isReadOnly}
                        index={idx}
                        isFirst={idx === 0}
                        isLast={idx === rightColumnBreakers.length - 1}
                        onToggle={toggleBreakerStatus}
                        onEdit={(b) => {
                          setEditingBreaker(b);
                          setIsModalOpen(true);
                        }}
                        onDelete={() => setBreakerToDelete(breaker)}
                        onMoveUp={(id) => handleMove(id, 'right', 'up')}
                        onMoveDown={(id) => handleMove(id, 'right', 'down')}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance / Safety Guideline Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-zinc-900 dark:text-white">
              Pautas de Mantenimiento y Seguridad Teocrática
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Mantenga despejado el acceso frontal al tablero (mínimo 1 metro de distancia libre). No
              altere los valores de amperaje de los interruptores automáticos sin la aprobación del
              Comité de Mantenimiento del Salón. Para emergencias o conatos de incendio, desconecte el
              interruptor general exterior.
            </p>
          </div>
        </div>

      {/* Add / Edit Breaker Modal */}
      <BreakerModal
        isOpen={isModalOpen}
        breaker={editingBreaker}
        defaultColumn={targetColumnForNew}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBreaker(null);
        }}
        onSave={handleSaveBreaker}
      />

      {/* Delete Confirmation Modal */}
      {breakerToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[280] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  ¿Eliminar este circuito?
                </h3>
                <p className="text-xs text-zinc-500">Esta acción removerá el registro del tablero.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-black/20 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
              Circuito: <strong className="text-zinc-900 dark:text-white">{breakerToDelete.name}</strong>
              {breakerToDelete.descripcion && (
                <span className="block text-zinc-400 mt-0.5">{breakerToDelete.descripcion}</span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBreakerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY Official Door Template (hidden on screen, formatted for standard print/laminating) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
        <div className="border-4 border-black p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">
              TABLERO DE CONTROL ELÉCTRICO (TDP)
            </h1>
            <h2 className="text-lg font-bold">
              SALÓN DEL REINO DE LOS TESTIGOS DE JEHOVÁ •{' '}
              {settings.congregationName || 'CONGREGACIÓN LOCAL'}
            </h2>
            <p className="text-xs text-zinc-600 mt-1">
              DIRECTORIO OFICIAL DE CIRCUITOS • FECHA DE ACTUALIZACIÓN:{' '}
              {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>

          {/* 2-Column Tables */}
          <div className="grid grid-cols-2 gap-6">
            {/* Lado Izquierdo */}
            <div>
              <h3 className="font-bold text-sm bg-black text-white px-2 py-1 uppercase text-center mb-2">
                BARRA 1 (LADO IZQUIERDO)
              </h3>
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-zinc-100 border-b border-black">
                    <th className="border border-black p-1 text-center w-8">#</th>
                    <th className="border border-black p-1 text-left">Circuito / Carga</th>
                    <th className="border border-black p-1 text-center w-12">Amp</th>
                    <th className="border border-black p-1 text-center w-24">Operación</th>
                  </tr>
                </thead>
                <tbody>
                  {breakers
                    .filter((b) => b.col === 'left')
                    .sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0))
                    .map((b, idx) => (
                      <tr key={b.id} className="border-b border-black">
                        <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                        <td className="border border-black p-1 font-semibold">
                          {b.name}
                          {b.descripcion && (
                            <span className="block text-[10px] text-zinc-600 font-normal">
                              {b.descripcion}
                            </span>
                          )}
                        </td>
                        <td className="border border-black p-1 text-center font-mono">
                          {b.amperage || 20}A
                        </td>
                        <td className="border border-black p-1 text-center font-bold text-[10px]">
                          {b.status === 'always'
                            ? 'SIEMPRE ON'
                            : b.status === 'event'
                            ? 'REUNIÓN ON'
                            : b.status === 'on'
                            ? 'NORMAL ON'
                            : 'OFF'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Lado Derecho */}
            <div>
              <h3 className="font-bold text-sm bg-black text-white px-2 py-1 uppercase text-center mb-2">
                BARRA 2 (LADO DERECHO)
              </h3>
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="bg-zinc-100 border-b border-black">
                    <th className="border border-black p-1 text-center w-8">#</th>
                    <th className="border border-black p-1 text-left">Circuito / Carga</th>
                    <th className="border border-black p-1 text-center w-12">Amp</th>
                    <th className="border border-black p-1 text-center w-24">Operación</th>
                  </tr>
                </thead>
                <tbody>
                  {breakers
                    .filter((b) => b.col === 'right')
                    .sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0))
                    .map((b, idx) => (
                      <tr key={b.id} className="border-b border-black">
                        <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>
                        <td className="border border-black p-1 font-semibold">
                          {b.name}
                          {b.descripcion && (
                            <span className="block text-[10px] text-zinc-600 font-normal">
                              {b.descripcion}
                            </span>
                          )}
                        </td>
                        <td className="border border-black p-1 text-center font-mono">
                          {b.amperage || 20}A
                        </td>
                        <td className="border border-black p-1 text-center font-bold text-[10px]">
                          {b.status === 'always'
                            ? 'SIEMPRE ON'
                            : b.status === 'event'
                            ? 'REUNIÓN ON'
                            : b.status === 'on'
                            ? 'NORMAL ON'
                            : 'OFF'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Safety Notice */}
          <div className="border-t-2 border-black pt-3 text-[10px] text-center text-zinc-700 space-y-1">
            <p className="font-bold">
              ATENCIÓN: NO MODIFICAR ESTE TABLERO SIN AUTORIZACIÓN DEL COMITÉ DE MANTENIMIENTO DEL
              SALÓN.
            </p>
            <p>
              EN CASO DE CORTE O EMERGENCIA: Notificar de inmediato al encargado del auditorio o
              superintendente de grupo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
