// src/components/MantenimientoTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { MaintenanceSheet } from '../types';
import { SAMPLE_MAINTENANCE_SHEETS_TEMPLATE } from '../utils/sampleData';
import { MaintenanceSheetCard } from './maintenance/MaintenanceSheetCard';
import { MaintenanceSheetModal } from './maintenance/MaintenanceSheetModal';
import {
  SERVICE_YEAR_MONTHS,
  computeAnnualMaintenanceCalendar,
  computeEmergencyReadinessPlan,
  buildMaintenanceSheetWhatsApp,
  buildGroupEmergencyTreeWhatsApp,
  sendSafeMaintenanceWhatsApp,
  printAnnualMaintenanceProgramA4,
  printEmergencyPreparednessPlanA4,
} from '../utils/maintenanceEmergencyEngine';
import {
  Wrench,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  Layers,
  X,
  Trash2,
  Send,
  Phone,
  HeartPulse,
  Car,
  Key,
  Users,
  Zap,
  Flame,
} from 'lucide-react';

export const MantenimientoTab: React.FC = () => {
  const {
    maintenanceSheets,
    addMaintenanceSheet,
    updateMaintenanceSheet,
    deleteMaintenanceSheet,
    toggleMaintenanceSheetActive,
    markMaintenanceSheetCompleted,
    publishers,
    publishersMap,
    preachingGroups,
    breakers,
    settings,
  } = useCongregation();

  // Sub-navigation: 'fichas' | 'calendario_anual' | 'emergencias'
  const [activeSubView, setActiveSubView] = useState<
    'fichas' | 'calendario_anual' | 'emergencias'
  >('fichas');

  // Search & Filter state for Fichas
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Emergency Group filter
  const [selectedEmergencyGroup, setSelectedEmergencyGroup] = useState<string>('todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<MaintenanceSheet | null>(null);
  const [sheetToDelete, setSheetToDelete] = useState<MaintenanceSheet | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = maintenanceSheets.length;
    const alDia = maintenanceSheets.filter((s) => s.status === 'al_dia' && s.isActive).length;
    const proximas = maintenanceSheets.filter((s) => s.status === 'proximo' && s.isActive).length;
    const pendientes = maintenanceSheets.filter((s) => s.status === 'pendiente' && s.isActive).length;
    const vencidas = maintenanceSheets.filter((s) => s.status === 'vencido' && s.isActive).length;

    const assignedSet = new Set<string>();
    maintenanceSheets.forEach((s) => {
      (s.assignedPublisherIds || []).forEach((id) => assignedSet.add(id));
    });

    return {
      total,
      alDia,
      proximas,
      pendientes,
      vencidas,
      assignedCount: assignedSet.size,
    };
  }, [maintenanceSheets]);

  // 12-Month Annual Calendar Matrix
  const annualCalendar = useMemo(() => {
    return computeAnnualMaintenanceCalendar(maintenanceSheets, publishersMap);
  }, [maintenanceSheets, publishersMap]);

  // Emergency Readiness & Disaster Plan
  const emergencyPlan = useMemo(() => {
    return computeEmergencyReadinessPlan(publishers, preachingGroups, breakers);
  }, [publishers, preachingGroups, breakers]);

  const filteredEmergencyGroups = useMemo(() => {
    if (selectedEmergencyGroup === 'todos') return emergencyPlan.groupsTree;
    return emergencyPlan.groupsTree.filter(
      (g) => String(g.groupNumber) === selectedEmergencyGroup
    );
  }, [emergencyPlan.groupsTree, selectedEmergencyGroup]);

  // Filtered Sheets
  const filteredSheets = useMemo(() => {
    return maintenanceSheets.filter((s) => {
      if (showOnlyActive && !s.isActive) return false;
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesLabel = s.label.toLowerCase().includes(query);
        const matchesDesc = s.description?.toLowerCase().includes(query) || false;
        const matchesNotes = s.notes?.toLowerCase().includes(query) || false;
        if (!matchesLabel && !matchesDesc && !matchesNotes) return false;
      }
      return true;
    });
  }, [maintenanceSheets, showOnlyActive, selectedCategory, selectedStatus, searchQuery]);

  // Inline Checklist toggle
  const handleToggleChecklistItem = (sheetId: string, itemId: string) => {
    const targetSheet = maintenanceSheets.find((s) => s.id === sheetId);
    if (!targetSheet) return;

    const updatedChecklist = (targetSheet.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const allCompleted = updatedChecklist.every((i) => i.completed);
    const newStatus = allCompleted ? 'al_dia' : targetSheet.status;

    updateMaintenanceSheet({
      ...targetSheet,
      checklist: updatedChecklist,
      status: newStatus,
    });
  };

  const handleMarkCompleted = (sheetId: string) => {
    markMaintenanceSheetCompleted(sheetId, 'Mantenimiento ejecutado según checklist');
    showToast('Ficha registrada como completada hoy y próxima fecha calculada');
  };

  const handleSaveSheet = (sheetData: Partial<MaintenanceSheet>) => {
    if (editingSheet) {
      updateMaintenanceSheet({
        ...editingSheet,
        ...sheetData,
      } as MaintenanceSheet);
      showToast(`Ficha "${sheetData.label}" actualizada`);
    } else {
      addMaintenanceSheet({
        label: sheetData.label || 'Nueva Ficha',
        description: sheetData.description || '',
        category: sheetData.category || 'seguridad',
        frequency: sheetData.frequency || 'mensual',
        status: sheetData.status || 'pendiente',
        isActive: true,
        orderIndex: 999,
        assignedPublisherIds: sheetData.assignedPublisherIds || [],
        lastCompletedDate: sheetData.lastCompletedDate,
        nextDueDate: sheetData.nextDueDate,
        checklist: sheetData.checklist || [],
        estimatedMinutes: sheetData.estimatedMinutes || 60,
        safetyGear: sheetData.safetyGear || [],
        notes: sheetData.notes || '',
      });
      showToast(`Ficha "${sheetData.label}" agregada`);
    }
    setIsModalOpen(false);
    setEditingSheet(null);
  };

  const handleConfirmDelete = () => {
    if (sheetToDelete) {
      deleteMaintenanceSheet(sheetToDelete.id);
      showToast(`Ficha "${sheetToDelete.label}" eliminada`);
      setSheetToDelete(null);
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

      {/* Top Sub-Navigation & Action Bar (Unified Container) */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-3.5">
        {/* Subtabs in a 3-column non-clipping mobile grid */}
        <div className="grid grid-cols-3 gap-1 p-1.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-white/10">
          <button
            onClick={() => setActiveSubView('fichas')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubView === 'fichas'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-[#F4F4F5] shadow-xs font-bold ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fichas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold font-mono tabular-nums shrink-0">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('calendario_anual')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubView === 'calendario_anual'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-[#F4F4F5] shadow-xs font-bold ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Anual (12M)</span>
          </button>

          <button
            onClick={() => setActiveSubView('emergencias')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeSubView === 'emergencias'
                ? 'bg-white dark:bg-zinc-800 text-rose-700 dark:text-rose-300 shadow-xs font-bold ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Emergencias</span>
          </button>
        </div>

        {/* Action buttons in responsive grid */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2">
          <button
            onClick={() =>
              printAnnualMaintenanceProgramA4({
                settings,
                sheets: maintenanceSheets,
                publishersMap,
              })
            }
            title="Imprimir el Programa Anual de Mantenimiento Preventivo en formato A4"
            className="px-3.5 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-[#F4F4F5] transition-colors flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>Programa A4</span>
          </button>

          <button
            onClick={() =>
              printEmergencyPreparednessPlanA4({
                settings,
                publishers,
                preachingGroups,
                breakers,
              })
            }
            title="Imprimir Plan de Emergencias y Árbol de Contacto por Grupos en formato A4"
            className="px-3.5 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>Emergencias A4</span>
          </button>

          <button
            onClick={() => {
              setEditingSheet(null);
              setIsModalOpen(true);
            }}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Nueva Ficha</span>
          </button>
        </div>
      </div>

        {/* ========================================================= */}
        {/* SUBVIEW 1: FICHAS OPERATIVAS DE MANTENIMIENTO             */}
        {/* ========================================================= */}
        {activeSubView === 'fichas' && (
          <>
            {/* 5 KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-zinc-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-zinc-400 mb-2 relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                    Fichas Totales
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <Layers size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                    {stats.total}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">rutinas</span>
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1 font-mono tabular-nums relative">
                  {stats.assignedCount} hermanos asignados
                </div>
              </div>

              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-emerald-500 mb-2 relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Al Día
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {stats.alDia}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">al día</span>
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1 relative">Inspecciones vigentes</div>
              </div>

              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-indigo-500 mb-2 relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Próximas
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Calendar size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                    {stats.proximas}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">a vencer</span>
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1 relative">Próximos 15-30 días</div>
              </div>

              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-amber-500 mb-2 relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Pendientes
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Clock size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                    {stats.pendientes}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">por realizar</span>
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1 relative">Programadas este ciclo</div>
              </div>

              <div className="col-span-2 sm:col-span-1 kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-rose-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-rose-500 mb-2 relative">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Vencidas
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                    {stats.vencidas}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">requieren atención</span>
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1 relative">Prioridad inmediata</div>
              </div>
            </div>

            {/* Search & Filter Strip */}
            <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar ficha por tarea, descripción o notas..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-[#F4F4F5] placeholder:text-zinc-400 dark:placeholder:text-[#A1A1AA]/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline">
                    Estado:
                  </span>
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'al_dia', label: 'Al Día' },
                    { id: 'proximo', label: 'Próximas' },
                    { id: 'pendiente', label: 'Pendientes' },
                    { id: 'vencido', label: 'Vencidas' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        selectedStatus === st.id
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-900/70 text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-white/10'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowOnlyActive(!showOnlyActive)}
                    className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap cursor-pointer ${
                      showOnlyActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-zinc-100 dark:bg-zinc-900/70 text-zinc-500 dark:text-[#A1A1AA] border-zinc-200/80 dark:border-white/10'
                    }`}
                  >
                    {showOnlyActive ? 'Activas' : 'Todas'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-zinc-100 dark:border-white/10">
                {[
                  { id: 'all', label: 'Todas las Categorías' },
                  { id: 'seguridad', label: 'Seguridad' },
                  { id: 'climatizacion', label: 'Climatización' },
                  { id: 'electricidad', label: 'Electricidad' },
                  { id: 'plomeria', label: 'Plomería' },
                  { id: 'edificacion', label: 'Edificación & Techos' },
                  { id: 'jardineria', label: 'Jardinería' },
                  { id: 'audio_video', label: 'Audio & Video' },
                  { id: 'limpieza_profunda', label: 'Limpieza Profunda' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-900/70 text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Maintenance Sheets */}
            {filteredSheets.length === 0 ? (
              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-12 text-center rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900/70 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-200/50 dark:border-white/10">
                  <Wrench size={32} />
                </div>
                <h3 className="text-base font-bold text-zinc-800 dark:text-[#F4F4F5]">
                  No se encontraron fichas de mantenimiento
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                  Intenta cambiar los filtros de búsqueda o crea una nueva ficha para organizar el plan
                  del Salón.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => {
                      setEditingSheet(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
                  >
                    <Plus size={15} />
                    <span>Crear Nueva Ficha</span>
                  </button>
                  {maintenanceSheets.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        SAMPLE_MAINTENANCE_SHEETS_TEMPLATE.forEach((sheet) =>
                          addMaintenanceSheet(sheet)
                        );
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-[#F4F4F5] text-xs font-bold transition-all border border-zinc-200/80 dark:border-white/10 cursor-pointer"
                      title="Cargar fichas de mantenimiento recomendadas para Salones del Reino"
                    >
                      <Sparkles size={15} className="text-amber-500" />
                      <span>Cargar Plantilla Recomendada</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSheets.map((sheet) => (
                  <MaintenanceSheetCard
                    key={sheet.id}
                    sheet={sheet}
                    publishersMap={publishersMap}
                    onEdit={(s) => {
                      setEditingSheet(s);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => setSheetToDelete(sheet)}
                    onToggleActive={toggleMaintenanceSheetActive}
                    onMarkCompleted={handleMarkCompleted}
                    onToggleChecklistItem={handleToggleChecklistItem}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* SUBVIEW 2: CALENDARIO ANUAL DE MANTENIMIENTO (12 MESES)   */}
        {/* ========================================================= */}
        {activeSubView === 'calendario_anual' && (
          <div className="space-y-5">
            <div className="kg-card-bento kg-glass-surface kg-sheen-top p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Matriz Anual de Mantenimiento Preventivo (Año de Servicio Sep – Ago)</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                  Cronograma visual de los 12 meses para las inspecciones de seguridad, techos, plomería,
                  climatización e instalaciones eléctricas.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="px-3.5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-bold font-mono tabular-nums">
                  Cumplimiento: {annualCalendar.compliancePercent}% al día
                </div>
                <div className="px-3.5 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-[#F4F4F5] font-bold font-mono tabular-nums">
                  Carga est.: ~{annualCalendar.totalAnnualEstimatedHours} h/año
                </div>
              </div>
            </div>

            <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 dark:bg-zinc-900/90 text-zinc-300 dark:text-[#A1A1AA] border-b border-zinc-200 dark:border-white/10 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-3">Rutina / Procedimiento Preventivo</th>
                      <th className="py-3 px-2 text-center">Frecuencia</th>
                      <th className="py-3 px-3">Encargados</th>
                      {SERVICE_YEAR_MONTHS.map((m) => (
                        <th key={m.index} className="py-3 px-1.5 text-center w-8">
                          {m.shortLabel}
                        </th>
                      ))}
                      <th className="py-3 px-2 text-center">Estado</th>
                      <th className="py-3 px-2 text-right">Aviso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                    {annualCalendar.rows.map((row) => (
                      <tr
                        key={row.sheet.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">
                            {row.sheet.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                            {row.categoryLabel} • Próx.: {row.sheet.nextDueDate || 'Por programar'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center capitalize font-semibold text-zinc-600 dark:text-[#A1A1AA]">
                          {row.sheet.frequency}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-zinc-700 dark:text-[#F4F4F5]">
                          {row.assignedNames.length > 0
                            ? row.assignedNames.join(', ')
                            : 'Comité de Mantenimiento'}
                        </td>
                        {SERVICE_YEAR_MONTHS.map((m) => {
                          const isScheduled = row.scheduledMonthIndices.includes(m.index);
                          return (
                            <td key={m.index} className="py-2.5 px-1 text-center">
                              {isScheduled ? (
                                <span
                                  className="inline-flex w-5 h-5 rounded-md bg-indigo-600 text-white items-center justify-center text-[10px] font-black shadow-2xs"
                                  title={`Programado en ${m.fullLabel}`}
                                >
                                  ✓
                                </span>
                              ) : (
                                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.sheet.status === 'al_dia'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.sheet.status === 'vencido'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {row.sheet.status === 'al_dia'
                              ? 'Al Día'
                              : row.sheet.status === 'vencido'
                              ? 'Vencida'
                              : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => {
                              const msg = buildMaintenanceSheetWhatsApp(
                                row.sheet,
                                row.assignedNames,
                                settings.congregationName
                              );
                              sendSafeMaintenanceWhatsApp(msg, row.assignedPhones[0]);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                            title="Enviar recordatorio de ficha por WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
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
        {/* SUBVIEW 3: PLAN DE EMERGENCIAS Y SEGURIDAD DEL SALÓN      */}
        {/* ========================================================= */}
        {activeSubView === 'emergencias' && (
          <div className="space-y-6">
            {/* Emergency Readiness KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1 relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Teléfonos Activos
                  </span>
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums relative">
                  {emergencyPlan.withPhoneCount} / {emergencyPlan.totalActivePublishers}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] relative">Publicadores localizables</span>
              </div>

              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1 relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Contacto Emergencia
                  </span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums relative">
                  {emergencyPlan.withEmergencyContactCount}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] relative">Con familiar / contacto S-21</span>
              </div>

              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-rose-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1 relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Directriz Médica DPA
                  </span>
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums relative">
                  {emergencyPlan.withDpaCount}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] relative">Tarjeta médica verificada</span>
              </div>

              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1 relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Vehículos Apoyo
                  </span>
                  <Car className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums relative">
                  {emergencyPlan.withVehicleCount}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] relative">Disponibles ante evacuación</span>
              </div>

              <div className="col-span-2 sm:col-span-1 kg-card-bento kg-glass-surface kg-sheen-top p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl" />
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1 relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Llaves del Salón
                  </span>
                  <Key className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums relative">
                  {emergencyPlan.keyHolders.length}
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] relative">Ancianos y siervos autorizados</span>
              </div>
            </div>

            {/* Protocolo Operativo de Seguridad del Salón del Reino */}
            <div className="kg-card-bento kg-glass-surface kg-sheen-top p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-600" />
                    <span>Estaciones Críticas y Protocolo de Emergencia en el Salón del Reino</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                    Procedimientos inmediatos de evacuación, corte eléctrico/hidráulico y primeros auxilios
                    durante las reuniones.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto font-mono tabular-nums">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{emergencyPlan.criticalBreakers.length} Breakers Activos en Tablero</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyPlan.safetyStations.map((st) => (
                  <div
                    key={st.id}
                    className="kg-card-bento kg-sheen-top p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 font-mono text-[10px] font-bold">
                        {st.code}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                        📍 {st.location}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                      {st.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
                      {st.procedure}
                    </p>
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 space-y-1">
                      {st.verificationItems.map((item, i) => (
                        <div
                          key={i}
                          className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Árbol de Contacto de Emergencia por Grupo de Predicación */}
            <div className="space-y-4">
              <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Árbol de Contacto de Emergencia por Grupo de Predicación</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                    Directorio rápido para que cada Superintendente de Grupo verifique el bienestar de los
                    publicadores ante una emergencia o desastre natural.
                  </p>
                </div>

                <select
                  value={selectedEmergencyGroup}
                  onChange={(e) => setSelectedEmergencyGroup(e.target.value)}
                  className="text-xs px-3.5 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-zinc-900/70 text-zinc-800 dark:text-[#F4F4F5] font-semibold cursor-pointer"
                >
                  <option value="todos">Todos los Grupos ({emergencyPlan.groupsTree.length})</option>
                  {emergencyPlan.groupsTree.map((g) => (
                    <option key={g.groupNumber} value={String(g.groupNumber)}>
                      Grupo {g.groupNumber} — {g.groupName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredEmergencyGroups.map((group) => (
                  <div
                    key={group.groupNumber}
                    className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-4 bg-zinc-900 dark:bg-zinc-900/90 text-white flex items-center justify-between gap-2 border-b border-zinc-800 dark:border-white/10">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block">
                            Grupo {group.groupNumber} • {group.groupName}
                          </span>
                          <span className="text-xs font-semibold text-zinc-200">
                            Sup.: {group.overseerName} • Aux.: {group.assistantName}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const msg = buildGroupEmergencyTreeWhatsApp(
                              group,
                              settings.congregationName
                            );
                            sendSafeMaintenanceWhatsApp(msg, group.overseerPhone);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-95 transition-transform"
                          title="Enviar directorio de emergencia al Superintendente de Grupo por WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Árbol WhatsApp</span>
                        </button>
                      </div>

                      <div className="divide-y divide-zinc-100 dark:divide-white/10 max-h-80 overflow-y-auto">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="p-3 text-xs flex items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                                  {member.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-[#A1A1AA] font-semibold">
                                  {member.roleLabel}
                                </span>
                                {member.hasDpa && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                                    DPA✓
                                  </span>
                                )}
                                {member.hasVehicle && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                    🚗 Vehículo
                                  </span>
                                )}
                                {(member.isVulnerable || member.needsRide) && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                    ⚠️ Prioridad Apoyo
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 truncate">
                                📞 {member.phone || 'Sin teléfono'} • 📍 {member.address}
                              </div>
                              <div className="text-[10px] text-zinc-400 dark:text-[#A1A1AA]/80">
                                🆘 Contacto Emerg.:{' '}
                                <strong className="text-zinc-600 dark:text-[#F4F4F5]">
                                  {member.emergencyContactName}
                                </strong>{' '}
                                {member.emergencyContactPhone
                                  ? `(${member.emergencyContactPhone})`
                                  : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                      <span>Total grupo: {group.stats.totalMembers} publicadores</span>
                      <span>
                        DPA: {group.stats.withDpa} • Vehículos: {group.stats.withVehicle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety Guideline Card */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 flex items-start gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <Shield size={18} />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Pautas de Seguridad en Labores de Mantenimiento y Prevención
            </h4>
            <p className="text-zinc-600 dark:text-[#A1A1AA] leading-relaxed">
              Toda labor en alturas (techos, escaleras sobre 2 metros) requiere la presencia de al menos
              dos hermanos y el uso de arnés con línea de vida debidamente anclada. Antes de intervenir
              circuitos eléctricos, baje el breaker correspondiente y coloque la señal de advertencia.
              El Comité de Mantenimiento y el Cuerpo de Ancianos revisan semestralmente este programa
              anual y el árbol de contacto de emergencia.
            </p>
          </div>
        </div>

      {/* Sheet Add / Edit Modal */}
      <MaintenanceSheetModal
        isOpen={isModalOpen}
        sheet={editingSheet}
        publishers={publishers}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSheet(null);
        }}
        onSave={handleSaveSheet}
      />

      {/* Delete Confirmation Modal */}
      {sheetToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[280] flex items-center justify-center p-4">
          <div className="kg-glass-surface kg-sheen-top rounded-3xl p-6 max-w-md w-full border border-zinc-200/80 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-[#F4F4F5]">
                  ¿Eliminar ficha de mantenimiento?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Esta acción removerá la tarea del plan preventivo.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/70 p-3 rounded-2xl border border-zinc-200/80 dark:border-white/10">
              Ficha: <strong className="text-zinc-900 dark:text-[#F4F4F5]">{sheetToDelete.label}</strong>
              {sheetToDelete.description && (
                <span className="block text-zinc-400 dark:text-[#A1A1AA] mt-0.5">{sheetToDelete.description}</span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSheetToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
