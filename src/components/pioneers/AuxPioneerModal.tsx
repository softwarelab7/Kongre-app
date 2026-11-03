// src/components/pioneers/AuxPioneerModal.tsx
import React, { useState, useEffect } from 'react';
import { AuxPioneerRequest, Publisher } from '../../types';
import {
  X,
  Target,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { SplashCheckbox } from '../SplashCheckbox';

interface AuxPioneerModalProps {
  isOpen: boolean;
  request: AuxPioneerRequest | null;
  publishers: Publisher[];
  onClose: () => void;
  onSave: (reqData: Partial<AuxPioneerRequest>) => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const AuxPioneerModal: React.FC<AuxPioneerModalProps> = ({
  isOpen,
  request,
  publishers,
  onClose,
  onSave,
}) => {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [publisherId, setPublisherId] = useState('');
  const [month, setMonth] = useState(nextMonthDate.getMonth());
  const [year, setYear] = useState(nextMonthDate.getFullYear());
  const [targetHours, setTargetHours] = useState<15 | 30>(30);
  const [isContinuous, setIsContinuous] = useState(false);
  const [notes, setNotes] = useState('');

  // Eligibility verification checks
  const [checkBaptized, setCheckBaptized] = useState(true);
  const [checkMoralStanding, setCheckMoralStanding] = useState(true);
  const [checkCircumstances, setCheckCircumstances] = useState(true);

  useEffect(() => {
    if (request) {
      setPublisherId(request.publisherId || request.publisher_nid || '');
      setMonth(request.month !== undefined ? request.month : (request.mes ?? nextMonthDate.getMonth()));
      setYear(request.year !== undefined ? request.year : (request.anio ?? nextMonthDate.getFullYear()));
      setTargetHours((request.targetHours || request.meta_horas || 30) as 15 | 30);
      setIsContinuous(request.isContinuous || false);
      setNotes(request.notes || request.nota_opcional || '');
      setCheckBaptized(true);
      setCheckMoralStanding(true);
      setCheckCircumstances(true);
    } else {
      setPublisherId(publishers[0]?.id || '');
      setMonth(nextMonthDate.getMonth());
      setYear(nextMonthDate.getFullYear());
      setTargetHours(30);
      setIsContinuous(false);
      setNotes('');
      setCheckBaptized(true);
      setCheckMoralStanding(true);
      setCheckCircumstances(true);
    }
  }, [request, isOpen, publishers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherId) return;

    onSave({
      publisherId,
      publisher_nid: publisherId,
      month,
      mes: month,
      year,
      anio: year,
      targetHours,
      meta_horas: targetHours,
      isContinuous,
      notes,
      nota_opcional: notes,
      status: request?.status || 'pendiente',
      estado: request?.estado || 'pendiente',
      requestDate: request?.requestDate || new Date().toISOString().split('T')[0],
      fecha_solicitud: request?.fecha_solicitud || new Date().toISOString(),
    });
  };

  const getUpcomingMonths = () => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    return list;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={request ? 'Editar solicitud de precursorado auxiliar' : 'Nueva solicitud de precursor auxiliar S-205'}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[250] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl w-full max-w-2xl max-h-[92vh] border border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-white/8 bg-white/60 dark:bg-white/4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-[#F4F4F5]">
                {request ? 'Editar Solicitud de Precursorado' : 'Nueva Solicitud de Precursor Auxiliar (S-205b)'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Formulario oficial para el Comité de Servicio de la Congregación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de solicitud de precursor auxiliar"
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Publicador */}
          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
              Publicador Solicitante *
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#A1A1AA] pointer-events-none" />
              <select
                required
                value={publisherId}
                onChange={(e) => setPublisherId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl pl-10 pr-4 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Selecciona un publicador...</option>
                {publishers
                  .filter((p) => p.status === 'active' || !p.status)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((pub) => (
                    <option key={pub.id} value={pub.id} className="dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]">
                      {pub.name} {pub.role ? `(${pub.role})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Mes y Año de Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                Mes de Servicio
              </label>
              <select
                value={`${month}-${year}`}
                onChange={(e) => {
                  const [m, y] = e.target.value.split('-').map(Number);
                  setMonth(m);
                  setYear(y);
                }}
                className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-4 py-2.5 text-zinc-900 dark:text-[#F4F4F5] text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {getUpcomingMonths().map((opt) => (
                  <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`} className="dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Meta de Horas */}
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                Meta de Horas Requerida
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetHours(30)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetHours === 30
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500 font-bold'
                      : 'border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5]'
                  }`}
                >
                  <div className="text-sm font-bold font-mono tabular-nums">30 Horas</div>
                  <div className="text-[10px] text-zinc-400 dark:text-[#A1A1AA]">Requisito estándar</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetHours(15)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetHours === 15
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500 font-bold'
                      : 'border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5]'
                  }`}
                >
                  <div className="text-sm font-bold font-mono tabular-nums">15 Horas</div>
                  <div className="text-[10px] text-zinc-400 dark:text-[#A1A1AA]">Mes especial / SC</div>
                </button>
              </div>
            </div>
          </div>

          {/* Solicitud Continua */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5]">
                Solicitud Continua de Precursorado Auxiliar
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                El publicador continuará sirviendo como precursor auxiliar mes a mes hasta nuevo aviso.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isContinuous}
                onChange={(e) => setIsContinuous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-hidden rounded-full peer dark:bg-[#27272A] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Requisitos y Declaración Teocrática (S-205) */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider">
              Requisitos Teocráticos de Elegibilidad (Formulario S-205)
            </label>
            <div className="space-y-3 p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-[#18181F] border border-indigo-200/60 dark:border-[#27272A] text-xs">
              <SplashCheckbox
                checked={checkBaptized}
                onChange={(e) => setCheckBaptized(e.target.checked)}
                label="He estado bautizado por al menos 6 meses y soy publicador ejemplar en la congregación."
              />
              <SplashCheckbox
                checked={checkMoralStanding}
                onChange={(e) => setCheckMoralStanding(e.target.checked)}
                label="Mi conducta moral y reputación en la congregación y la comunidad son intachables."
              />
              <SplashCheckbox
                checked={checkCircumstances}
                onChange={(e) => setCheckCircumstances(e.target.checked)}
                label={`He organizado mis circunstancias personales para dedicar las ${targetHours} horas requeridas.`}
              />
            </div>
          </div>

          {/* Notas u Observaciones */}
          <div>
            <label className="block text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] uppercase tracking-wider mb-1.5">
              Notas u Observaciones del Publicador
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Apoyaré en el grupo de carritos de los sábados, vacaciones de trabajo..."
              rows={2}
              className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-4 py-2 text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] text-sm font-semibold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!checkBaptized || !checkMoralStanding || !checkCircumstances}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold transition-all cursor-pointer"
            >
              {request ? 'Guardar Cambios' : 'Registrar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
