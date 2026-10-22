// src/components/maintenance/MaintenanceSheetModal.tsx
import React, { useState, useEffect } from 'react';
import { MaintenanceSheet, MaintenanceCategory, MaintenanceFrequency, MaintenanceStatus, Publisher } from '../../types';
import {
  X,
  Wrench,
  Shield,
  Clock,
  Calendar,
  Users,
  CheckSquare,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface MaintenanceSheetModalProps {
  isOpen: boolean;
  sheet: MaintenanceSheet | null;
  publishers: Publisher[];
  onClose: () => void;
  onSave: (sheetData: Partial<MaintenanceSheet>) => void;
}

const CATEGORIES: { id: MaintenanceCategory; label: string }[] = [
  { id: 'seguridad', label: 'Seguridad & Extintores' },
  { id: 'climatizacion', label: 'Climatización & Aires' },
  { id: 'electricidad', label: 'Electricidad & Iluminación' },
  { id: 'plomeria', label: 'Plomería & Hidráulica' },
  { id: 'edificacion', label: 'Edificación, Techo & Estructura' },
  { id: 'jardineria', label: 'Áreas Verdes & Exteriores' },
  { id: 'audio_video', label: 'Cabina, Audio & Video' },
  { id: 'limpieza_profunda', label: 'Limpieza Profunda & Tapicería' },
];

const FREQUENCIES: { id: MaintenanceFrequency; label: string }[] = [
  { id: 'semanal', label: 'Semanal' },
  { id: 'mensual', label: 'Mensual' },
  { id: 'bimestral', label: 'Bimestral (cada 2 meses)' },
  { id: 'trimestral', label: 'Trimestral (cada 3 meses)' },
  { id: 'semestral', label: 'Semestral (cada 6 meses)' },
  { id: 'anual', label: 'Anual' },
  { id: 'segun_necesidad', label: 'Según Necesidad / Correctivo' },
];

const STATUSES: { id: MaintenanceStatus; label: string; color: string }[] = [
  { id: 'al_dia', label: 'Al Día (Completado)', color: 'text-emerald-600 bg-emerald-500/10' },
  { id: 'proximo', label: 'Próximo a Vencer', color: 'text-indigo-600 bg-indigo-500/10' },
  { id: 'pendiente', label: 'Pendiente de Ejecución', color: 'text-amber-600 bg-amber-500/10' },
  { id: 'vencido', label: 'Vencido / Requiere Atención', color: 'text-rose-600 bg-rose-500/10' },
];

const COMMON_SAFETY_GEAR = [
  'Gafas de seguridad',
  'Guantes de trabajo',
  'Arnés y línea de vida',
  'Calzado antideslizante',
  'Protección auditiva',
  'Mascarilla antipolvo',
  'Escalera certificada',
  'Casco de protección',
];

export const MaintenanceSheetModal: React.FC<MaintenanceSheetModalProps> = ({
  isOpen,
  sheet,
  publishers,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<MaintenanceSheet>>({
    label: '',
    description: '',
    category: 'seguridad',
    frequency: 'trimestral',
    status: 'al_dia',
    isActive: true,
    assignedPublisherIds: [],
    estimatedMinutes: 60,
    checklist: [],
    safetyGear: [],
    notes: '',
    nextDueDate: '',
    lastCompletedDate: '',
  });

  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    if (sheet) {
      setFormData(sheet);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        label: '',
        description: '',
        category: 'seguridad',
        frequency: 'mensual',
        status: 'pendiente',
        isActive: true,
        assignedPublisherIds: [],
        estimatedMinutes: 60,
        checklist: [
          { id: 'c1', text: 'Inspeccionar visualmente el estado del equipo/área', completed: false },
          { id: 'c2', text: 'Ejecutar limpieza o ajuste correspondiente', completed: false },
          { id: 'c3', text: 'Verificar funcionamiento correcto', completed: false },
        ],
        safetyGear: ['Guantes de trabajo'],
        lastCompletedDate: today,
        nextDueDate: today,
        notes: '',
      });
    }
  }, [sheet, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `check-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    setFormData((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), newItem],
    }));
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklist: (prev.checklist || []).filter((item) => item.id !== id),
    }));
  };

  const handleToggleSafetyGear = (gear: string) => {
    const current = formData.safetyGear || [];
    const updated = current.includes(gear)
      ? current.filter((g) => g !== gear)
      : [...current, gear];
    setFormData((prev) => ({ ...prev, safetyGear: updated }));
  };

  const handleTogglePublisher = (pubId: string) => {
    const current = formData.assignedPublisherIds || [];
    const updated = current.includes(pubId)
      ? current.filter((id) => id !== pubId)
      : [...current, pubId];
    setFormData((prev) => ({ ...prev, assignedPublisherIds: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label?.trim()) return;
    onSave(formData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={sheet ? 'Editar ficha de mantenimiento' : 'Nueva ficha de mantenimiento'}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#131d2e] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] border border-zinc-200 dark:border-white/[0.08] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {sheet ? 'Editar Ficha de Mantenimiento' : 'Nueva Ficha de Mantenimiento'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Plan preventivo del Salón del Reino y lista de tareas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de ficha de mantenimiento"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Información General */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nombre de la Tarea / Ficha *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={formData.label || ''}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ej. Revisión Trimestral de Extintores"
                  className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Descripción del Procedimiento
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles sobre lo que se debe inspeccionar o limpiar..."
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formData.category || 'seguridad'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MaintenanceCategory })}
                    className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Frecuencia
                  </label>
                  <select
                    value={formData.frequency || 'mensual'}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as MaintenanceFrequency })}
                    className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Estado Actual
                  </label>
                  <select
                    value={formData.status || 'pendiente'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                    className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tiempo Estimado (minutos)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={formData.estimatedMinutes || 60}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Última Realización
                  </label>
                  <input
                    type="date"
                    value={formData.lastCompletedDate || ''}
                    onChange={(e) => setFormData({ ...formData, lastCompletedDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Próxima Fecha Programada
                  </label>
                  <input
                    type="date"
                    value={formData.nextDueDate || ''}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
                  />
                </div>
              </div>

              {/* Publicadores Asignados */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Publicadores / Colaboradores Asignados
                </label>
                <div className="max-h-36 overflow-y-auto border border-zinc-200 dark:border-white/[0.08] rounded-xl p-2 bg-zinc-50/50 dark:bg-black/20 space-y-1">
                  {publishers.length === 0 ? (
                    <div className="text-xs text-zinc-400 p-2 text-center">No hay publicadores registrados</div>
                  ) : (
                    publishers.map((pub) => {
                      const isSelected = (formData.assignedPublisherIds || []).includes(pub.id);
                      return (
                        <button
                          key={pub.id}
                          type="button"
                          onClick={() => handleTogglePublisher(pub.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <span>{pub.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Lista de Tareas (Checklist) y Equipo de Seguridad */}
            <div className="space-y-4">
              {/* Checklist Section */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Lista de Verificación / Pasos ({formData.checklist?.length || 0})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Escribe un paso y presiona Añadir..."
                    className="flex-1 bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-2 bg-zinc-50/50 dark:bg-black/20">
                  {(!formData.checklist || formData.checklist.length === 0) ? (
                    <div className="text-xs text-zinc-400 p-3 text-center italic">
                      Sin pasos de verificación. Agrega uno arriba.
                    </div>
                  ) : (
                    formData.checklist.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#162032] border border-zinc-200/80 dark:border-white/[0.05] text-xs"
                      >
                        <span className="text-zinc-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                        <span className="flex-1 text-zinc-800 dark:text-zinc-200">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          aria-label={`Quitar paso: ${item.text}`}
                          className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                          title="Quitar paso"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Equipo de Protección Personal (EPP) */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Equipo de Protección y Seguridad Recomendado
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SAFETY_GEAR.map((gear) => {
                    const isSelected = (formData.safetyGear || []).includes(gear);
                    return (
                      <button
                        key={gear}
                        type="button"
                        onClick={() => handleToggleSafetyGear(gear)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 ring-1 ring-amber-500/30'
                            : 'bg-zinc-100 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06] hover:bg-zinc-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {gear}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones y Notas */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Notas Técnicas / Historial
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles sobre herramientas necesarias, repuestos, marcas de filtros..."
                  rows={3}
                  className="w-full bg-zinc-50 dark:bg-black/25 border border-zinc-200 dark:border-white/[0.1] rounded-xl px-4 py-2 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/[0.1] text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              {sheet ? 'Guardar Cambios' : 'Crear Ficha de Mantenimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
