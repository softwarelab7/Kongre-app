// src/components/electrical/BreakerModal.tsx
import React, { useState, useEffect } from 'react';
import { Breaker } from '../../types';
import {
  X,
  Plug,
  Lightbulb,
  Sun,
  Tv,
  Mic,
  Speaker,
  AlertTriangle,
  Fan,
  Wind,
  Wifi,
  Droplet,
  Bell,
  BookOpen,
  Archive,
  RectangleHorizontal,
  Wrench,
  Camera,
  Zap,
  BellRing,
  BatteryFull,
  ShieldAlert,
  KeyRound,
  Gauge,
  SquareParking,
  Check,
} from 'lucide-react';

interface BreakerModalProps {
  isOpen: boolean;
  breaker: Breaker | null;
  defaultColumn?: 'left' | 'right';
  onClose: () => void;
  onSave: (breaker: Partial<Breaker>) => void;
}

const ICONS = [
  { id: 'outlet', label: 'Tomacorriente', icon: Plug },
  { id: 'lightbulb', label: 'Ilum. Interior', icon: Lightbulb },
  { id: 'sun', label: 'Ilum. Exterior', icon: Sun },
  { id: 'tv', label: 'Pantallas / Video', icon: Tv },
  { id: 'mic', label: 'Atril & Micrófonos', icon: Mic },
  { id: 'speaker', label: 'Cabina & Sonido', icon: Speaker },
  { id: 'fan', label: 'Aire Acondicionado', icon: Fan },
  { id: 'wind', label: 'Ventilación', icon: Wind },
  { id: 'wifi', label: 'Internet / Red', icon: Wifi },
  { id: 'pump', label: 'Bomba / Baños', icon: Droplet },
  { id: 'alert', label: 'Emergencia', icon: AlertTriangle },
  { id: 'bell', label: 'Alarma de Intrusión', icon: Bell },
  { id: 'camera', label: 'CCTV / Cámaras', icon: Camera },
  { id: 'zap', label: 'Acometida / General', icon: Zap },
  { id: 'siren', label: 'Incendio / Detector', icon: BellRing },
  { id: 'battery', label: 'UPS / Baterías', icon: BatteryFull },
  { id: 'sign', label: 'Rótulo JW.ORG', icon: RectangleHorizontal },
  { id: 'door', label: 'Puertas / Portón', icon: ShieldAlert },
  { id: 'lock', label: 'Cerraduras Eléctr.', icon: KeyRound },
  { id: 'books', label: 'Mostrador Literatura', icon: BookOpen },
  { id: 'archive', label: 'Archivo Teocrático', icon: Archive },
  { id: 'wrench', label: 'Taller Mantenimiento', icon: Wrench },
  { id: 'thermometer', label: 'Termostato', icon: Gauge },
  { id: 'parking', label: 'Parqueadero', icon: SquareParking },
];

const COLORS = [
  { id: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { id: 'sky', label: 'Cielo', bg: 'bg-sky-500' },
  { id: 'cyan', label: 'Cian', bg: 'bg-cyan-500' },
  { id: 'teal', label: 'Turquesa', bg: 'bg-teal-500' },
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500' },
  { id: 'green', label: 'Verde', bg: 'bg-green-500' },
  { id: 'lime', label: 'Lima', bg: 'bg-lime-500' },
  { id: 'yellow', label: 'Amarillo', bg: 'bg-yellow-500' },
  { id: 'amber', label: 'Ámbar', bg: 'bg-amber-500' },
  { id: 'orange', label: 'Naranja', bg: 'bg-orange-500' },
  { id: 'red', label: 'Rojo', bg: 'bg-red-500' },
  { id: 'rose', label: 'Rosa', bg: 'bg-rose-500' },
  { id: 'pink', label: 'Fucsia Suave', bg: 'bg-pink-500' },
  { id: 'purple', label: 'Púrpura', bg: 'bg-purple-500' },
  { id: 'violet', label: 'Violeta', bg: 'bg-violet-500' },
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-500' },
  { id: 'slate', label: 'Pizarra', bg: 'bg-zinc-500' },
];

export const BreakerModal: React.FC<BreakerModalProps> = ({
  isOpen,
  breaker,
  defaultColumn = 'left',
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Breaker>>({
    name: '',
    descripcion: '',
    status: 'on',
    icon: 'outlet',
    color: 'blue',
    col: defaultColumn,
    amperage: 20,
  });

  useEffect(() => {
    if (breaker) {
      setFormData(breaker);
    } else {
      setFormData({
        name: '',
        descripcion: '',
        status: 'event',
        icon: 'outlet',
        color: 'blue',
        col: defaultColumn,
        amperage: 20,
      });
    }
  }, [breaker, defaultColumn, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={breaker ? 'Editar circuito o breaker eléctrico' : 'Nuevo circuito del tablero eléctrico'}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="kg-glass-surface kg-sheen-top rounded-3xl w-full max-w-4xl max-h-[92vh] border border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-[#18181F]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#F4F4F5]">
                {breaker ? 'Editar Circuito / Breaker' : 'Nuevo Circuito del Tablero'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Configuración eléctrica, amperaje y modo de operación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de configuración de circuito"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Circuit Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                  Nombre del Circuito *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Alumbrado Auditorio, Sonido, Clima..."
                  className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                  Descripción / Tomas Controladas
                </label>
                <textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles de aparatos, tomas o áreas que alimenta..."
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                    Columna / Barra
                  </label>
                  <select
                    value={formData.col || 'left'}
                    onChange={(e) => setFormData({ ...formData, col: e.target.value as 'left' | 'right' })}
                    className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="left">Lado Izquierdo (Barra 1)</option>
                    <option value="right">Lado Derecho (Barra 2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                    Capacidad (Amperaje)
                  </label>
                  <select
                    value={formData.amperage || 20}
                    onChange={(e) => setFormData({ ...formData, amperage: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono tabular-nums"
                  >
                    <option value={10}>10 A</option>
                    <option value={15}>15 A (Iluminación estándar)</option>
                    <option value={20}>20 A (Tomas / Audio)</option>
                    <option value={30}>30 A (Aire Acondicionado)</option>
                    <option value={40}>40 A (Cargas Pesadas)</option>
                    <option value={50}>50 A (Acometida)</option>
                    <option value={60}>60 A (Principal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                  Modo Operativo del Circuito
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'event' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.status === 'event'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                        : 'border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5]'
                    }`}
                  >
                    <div className="text-xs font-bold">Modo Reunión</div>
                    <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5">ON durante reunión / OFF al cerrar</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'always' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.status === 'always'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
                        : 'border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5]'
                    }`}
                  >
                    <div className="text-xs font-bold">Siempre ON (Crítico)</div>
                    <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5">Alarma, CCTV, Internet, Bombas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'on' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.status === 'on'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                        : 'border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5]'
                    }`}
                  >
                    <div className="text-xs font-bold">Normal ON</div>
                    <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5">Energizado habitualmente</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'off' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.status === 'off'
                        ? 'border-zinc-500 bg-zinc-500/10 text-zinc-700 dark:text-[#F4F4F5] ring-1 ring-zinc-500'
                        : 'border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5]'
                    }`}
                  >
                    <div className="text-xs font-bold">Normal OFF</div>
                    <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-0.5">Desconectado habitualmente</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Icon & Color Selectors */}
            <div className="space-y-4">
              {/* Category Color */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Color de Categoría / Fase
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.id })}
                      aria-label={`Seleccionar color ${c.label}`}
                      className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-all cursor-pointer ${
                        formData.color === c.id
                          ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-[#121216] scale-110 shadow-sm'
                          : 'opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                      title={c.label}
                    >
                      {formData.color === c.id && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Grid */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Ícono Representativo
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = formData.icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.id })}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold ring-1 ring-indigo-500'
                            : 'border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
                        }`}
                      >
                        <IconComp size={18} className="mb-1 shrink-0" />
                        <span className="text-[10px] leading-tight line-clamp-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              {breaker ? 'Guardar Cambios' : 'Crear Circuito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
