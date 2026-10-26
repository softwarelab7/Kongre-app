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
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        {/* Subtabs in a 3-column non-clipping mobile grid */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setActiveSubView('fichas')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubView === 'fichas'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fichas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-bold shrink-0">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('calendario_anual')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubView === 'calendario_anual'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Anual (12M)</span>
          </button>

          <button
            onClick={() => setActiveSubView('emergencias')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubView === 'emergencias'
                ? 'bg-white dark:bg-rose-600 text-rose-700 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
            className="px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-2 text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
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
            className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center justify-center gap-2 text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>Emergencias A4</span>
          </button>

          <button
            onClick={() => {
              setEditingSheet(null);
              setIsModalOpen(true);
            }}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
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
              <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Fichas Totales
                  </span>
                  <Layers size={18} className="text-zinc-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                    {stats.total}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">rutinas</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  {stats.assignedCount} hermanos asignados
                </div>
              </div>

              <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Al Día
                  </span>
                  <CheckCircle2 size={18} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {stats.alDia}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">al día</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Inspecciones vigentes</div>
              </div>

              <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Próximas
                  </span>
                  <Calendar size={18} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {stats.proximas}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">a vencer</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Próximos 15-30 días</div>
              </div>

              <div className="bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Pendientes
                  </span>
                  <Clock size={18} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {stats.pendientes}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">por realizar</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Programadas este ciclo</div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#131d2e] p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-500 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Vencidas
                  </span>
                  <AlertTriangle size={18} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                    {stats.vencidas}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">requieren atención</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">Prioridad inmediata</div>
              </div>
            </div>

            {/* Search & Filter Strip */}
            <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm space-y-3">
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        selectedStatus === st.id
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                          : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}

                  <button
                    onClick={() => setShowOnlyActive(!showOnlyActive)}
                    className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                      showOnlyActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 border-zinc-200 dark:border-white/[0.08]'
                    }`}
                  >
                    {showOnlyActive ? 'Activas' : 'Todas'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-zinc-100 dark:border-white/[0.06]">
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
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-zinc-100/70 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Maintenance Sheets */}
            {filteredSheets.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#131d2e] rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] text-zinc-400 flex items-center justify-center mx-auto">
                  <Wrench size={32} />
                </div>
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                  No se encontraron fichas de mantenimiento
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Intenta cambiar los filtros de búsqueda o crea una nueva ficha para organizar el plan
                  del Salón.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => {
                      setEditingSheet(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer"
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
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
            <div className="bg-white dark:bg-[#131d2e] p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>Matriz Anual de Mantenimiento Preventivo (Año de Servicio Sep – Ago)</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Cronograma visual de los 12 meses para las inspecciones de seguridad, techos, plomería,
                  climatización e instalaciones eléctricas.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-bold">
                  Cumplimiento: {annualCalendar.compliancePercent}% al día
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                  Carga est.: ~{annualCalendar.totalAnnualEstimatedHours} h/año
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
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
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                    {annualCalendar.rows.map((row) => (
                      <tr
                        key={row.sheet.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-zinc-900 dark:text-white block">
                            {row.sheet.label}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {row.categoryLabel} • Próx.: {row.sheet.nextDueDate || 'Por programar'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center capitalize font-semibold text-zinc-600 dark:text-zinc-300">
                          {row.sheet.frequency}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-zinc-700 dark:text-zinc-300">
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
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
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
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center justify-center cursor-pointer"
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
              <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center justify-between text-indigo-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Teléfonos Activos
                  </span>
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                  {emergencyPlan.withPhoneCount} / {emergencyPlan.totalActivePublishers}
                </div>
                <span className="text-[11px] text-zinc-400">Publicadores localizables</span>
              </div>

              <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center justify-between text-emerald-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Contacto Emergencia
                  </span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {emergencyPlan.withEmergencyContactCount}
                </div>
                <span className="text-[11px] text-zinc-400">Con familiar / contacto S-21</span>
              </div>

              <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center justify-between text-rose-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Directriz Médica DPA
                  </span>
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-rose-600">
                  {emergencyPlan.withDpaCount}
                </div>
                <span className="text-[11px] text-zinc-400">Tarjeta médica verificada</span>
              </div>

              <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center justify-between text-blue-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Vehículos Apoyo
                  </span>
                  <Car className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-blue-600">
                  {emergencyPlan.withVehicleCount}
                </div>
                <span className="text-[11px] text-zinc-400">Disponibles ante evacuación</span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
                <div className="flex items-center justify-between text-amber-600 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Llaves del Salón
                  </span>
                  <Key className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {emergencyPlan.keyHolders.length}
                </div>
                <span className="text-[11px] text-zinc-400">Ancianos y siervos autorizados</span>
              </div>
            </div>

            {/* Protocolo Operativo de Seguridad del Salón del Reino */}
            <div className="bg-white dark:bg-[#131d2e] p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-600" />
                    <span>Estaciones Críticas y Protocolo de Emergencia en el Salón del Reino</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Procedimientos inmediatos de evacuación, corte eléctrico/hidráulico y primeros auxilios
                    durante las reuniones.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{emergencyPlan.criticalBreakers.length} Breakers Activos en Tablero</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyPlan.safetyStations.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-black/20 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px] font-black">
                        {st.code}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500 truncate">
                        📍 {st.location}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                      {st.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {st.procedure}
                    </p>
                    <div className="pt-2 border-t border-zinc-200/70 dark:border-white/[0.06] space-y-1">
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
              <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Árbol de Contacto de Emergencia por Grupo de Predicación</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Directorio rápido para que cada Superintendente de Grupo verifique el bienestar de los
                    publicadores ante una emergencia o desastre natural.
                  </p>
                </div>

                <select
                  value={selectedEmergencyGroup}
                  onChange={(e) => setSelectedEmergencyGroup(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-zinc-300 dark:border-white/[0.1] bg-white dark:bg-slate-900 font-semibold"
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
                    className="bg-white dark:bg-[#131d2e] rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-2">
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
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                          title="Enviar directorio de emergencia al Superintendente de Grupo por WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Árbol WhatsApp</span>
                        </button>
                      </div>

                      <div className="divide-y divide-zinc-100 dark:divide-white/[0.06] max-h-80 overflow-y-auto">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="p-3 text-xs flex items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-900 dark:text-white">
                                  {member.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-semibold">
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
                              <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                                📞 {member.phone || 'Sin teléfono'} • 📍 {member.address}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                🆘 Contacto Emerg.:{' '}
                                <strong className="text-zinc-600 dark:text-zinc-300">
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

                    <div className="p-3 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
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
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Shield size={18} />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-zinc-900 dark:text-white">
              Pautas de Seguridad en Labores de Mantenimiento y Prevención
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[280] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  ¿Eliminar ficha de mantenimiento?
                </h3>
                <p className="text-xs text-zinc-500">Esta acción removerá la tarea del plan preventivo.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-black/20 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
              Ficha: <strong className="text-zinc-900 dark:text-white">{sheetToDelete.label}</strong>
              {sheetToDelete.description && (
                <span className="block text-zinc-400 mt-0.5">{sheetToDelete.description}</span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSheetToDelete(null)}
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
    </div>
  );
};
