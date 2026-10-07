// src/components/MantenimientoTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { MaintenanceSheet, MaintenanceCategory, MaintenanceStatus } from '../types';
import { SectionHeader } from './SectionHeader';
import { MaintenanceSheetCard } from './maintenance/MaintenanceSheetCard';
import { MaintenanceSheetModal } from './maintenance/MaintenanceSheetModal';
import {
  Wrench,
  Plus,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  Layers,
  X,
  Trash2,
  Info,
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
    settings,
  } = useCongregation();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

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

    // Distinct assigned brothers
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

    // If all items are completed, can advance status
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b1329] text-zinc-900 dark:text-zinc-100 transition-colors">
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

      {/* Main Container */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Section Header */}
        <SectionHeader
          icon={Wrench}
          title="Fichas de Mantenimiento"
          highlight="del Salón"
          subtitle="PLAN PREVENTIVO, LISTAS DE VERIFICACIÓN Y TAREAS OPERATIVAS"
          badgeText="MANTENIMIENTO TEOCRÁTICO"
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Print Annual Register */}
              <button
                onClick={() => window.print()}
                title="Imprimir el registro de fichas para el libro de mantenimiento del Salón"
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors flex items-center gap-2 text-xs font-semibold"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Imprimir Registro</span>
              </button>

              {/* New Sheet Button */}
              <button
                onClick={() => {
                  setEditingSheet(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-500/25 transition-all"
              >
                <Plus size={16} />
                <span>Nueva Ficha</span>
              </button>
            </div>
          }
        />

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Fichas */}
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

          {/* Al Día */}
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

          {/* Próximas */}
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

          {/* Pendientes */}
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

          {/* Vencidas */}
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
            {/* Search Input */}
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

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline">Estado:</span>
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

              {/* Show only active toggle */}
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

          {/* Category Pills Strip */}
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
              Intenta cambiar los filtros de búsqueda o crea una nueva ficha para organizar el plan del
              Salón.
            </p>
            <button
              onClick={() => {
                setEditingSheet(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              <Plus size={15} />
              <span>Crear Nueva Ficha</span>
            </button>
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

        {/* Safety Guideline Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Shield size={18} />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-zinc-900 dark:text-white">
              Pautas de Seguridad Teocrática en Labores de Mantenimiento
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Toda labor en alturas (techos, escaleras sobre 2 metros) requiere la presencia de al menos
              dos hermanos y el uso de arnés con línea de vida debidamente anclada. Antes de intervenir
              circuitos eléctricos, baje el breaker correspondiente y coloque la señal de advertencia.
              El Comité de Mantenimiento debe revisar semestralmente este registro y archivarlo en la
              carpeta de la congregación.
            </p>
          </div>
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

      {/* PRINT-ONLY Official Maintenance Register Template */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
        <div className="border-4 border-black p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">
              REGISTRO OFICIAL DE MANTENIMIENTO PREVENTIVO
            </h1>
            <h2 className="text-lg font-bold">
              SALÓN DEL REINO DE LOS TESTIGOS DE JEHOVÁ •{' '}
              {settings.congregationName || 'CONGREGACIÓN LOCAL'}
            </h2>
            <p className="text-xs text-zinc-600 mt-1">
              COMITÉ DE MANTENIMIENTO • FECHA DE IMPRESIÓN: {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>

          {/* Table */}
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-zinc-100 border-b border-black">
                <th className="border border-black p-2 text-center w-8">#</th>
                <th className="border border-black p-2 text-left">Ficha / Procedimiento</th>
                <th className="border border-black p-2 text-center w-24">Categoría</th>
                <th className="border border-black p-2 text-center w-20">Frecuencia</th>
                <th className="border border-black p-2 text-center w-24">Última Fecha</th>
                <th className="border border-black p-2 text-center w-24">Próxima Fecha</th>
                <th className="border border-black p-2 text-left w-36">Encargados</th>
                <th className="border border-black p-2 text-center w-20">Estado</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceSheets
                .filter((s) => s.isActive)
                .map((s, idx) => {
                  const assigned = (s.assignedPublisherIds || [])
                    .map((id) => publishersMap.get(id)?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={s.id} className="border-b border-black">
                      <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-2">
                        <strong className="block">{s.label}</strong>
                        {s.description && (
                          <span className="text-[10px] text-zinc-600 block">{s.description}</span>
                        )}
                      </td>
                      <td className="border border-black p-2 text-center uppercase text-[10px]">
                        {s.category}
                      </td>
                      <td className="border border-black p-2 text-center capitalize">{s.frequency}</td>
                      <td className="border border-black p-2 text-center font-mono">
                        {s.lastCompletedDate || '—'}
                      </td>
                      <td className="border border-black p-2 text-center font-mono">
                        {s.nextDueDate || '—'}
                      </td>
                      <td className="border border-black p-2 text-[10px]">{assigned || 'Por asignar'}</td>
                      <td className="border border-black p-2 text-center font-bold text-[10px] uppercase">
                        {s.status === 'al_dia'
                          ? 'Al Día'
                          : s.status === 'proximo'
                          ? 'Próximo'
                          : s.status === 'pendiente'
                          ? 'Pendiente'
                          : 'Vencido'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* Footer Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-black pt-2">
              <p className="font-bold">Superintendente de Servicio / Coordinador</p>
              <p className="text-[10px] text-zinc-500">Firma y Fecha de Revisión</p>
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">Encargado del Comité de Mantenimiento</p>
              <p className="text-[10px] text-zinc-500">Firma y Fecha de Conformidad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
