import React, { useState } from 'react';
import { MaintenanceSheet, Publisher } from '../../types';
import { SplashCheckbox } from '../SplashCheckbox';
import {
  Wrench,
  ShieldAlert,
  Fan,
  Zap,
  Droplets,
  Building2,
  TreePine,
  Tv,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Printer,
  Shield,
  Check,
} from 'lucide-react';

interface MaintenanceSheetCardProps {
  sheet: MaintenanceSheet;
  publishersMap: Map<string, Publisher>;
  onEdit: (sheet: MaintenanceSheet) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onMarkCompleted: (id: string) => void;
  onToggleChecklistItem: (sheetId: string, itemId: string) => void;
  onPrintSheet?: (sheet: MaintenanceSheet) => void;
}

export const MaintenanceSheetCard: React.FC<MaintenanceSheetCardProps> = ({
  sheet,
  publishersMap,
  onEdit,
  onDelete,
  onToggleActive,
  onMarkCompleted,
  onToggleChecklistItem,
  onPrintSheet,
}) => {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

  const getCategoryDetails = (cat: MaintenanceSheet['category']) => {
    switch (cat) {
      case 'seguridad':
        return { label: 'Seguridad', icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
      case 'climatizacion':
        return { label: 'Climatización', icon: Fan, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
      case 'electricidad':
        return { label: 'Electricidad', icon: Zap, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 'plomeria':
        return { label: 'Plomería', icon: Droplets, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' };
      case 'edificacion':
        return { label: 'Edificación', icon: Building2, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
      case 'jardineria':
        return { label: 'Jardinería', icon: TreePine, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      case 'audio_video':
        return { label: 'Audio & Video', icon: Tv, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
      case 'limpieza_profunda':
      default:
        return { label: 'Limpieza Profunda', icon: Sparkles, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
    }
  };

  const getStatusBadge = (status: MaintenanceSheet['status']) => {
    switch (status) {
      case 'al_dia':
        return { label: 'Al Día', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'proximo':
        return { label: 'Próximo', cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
      case 'pendiente':
        return { label: 'Pendiente', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'vencido':
        return { label: 'Vencido', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
      default:
        return { label: 'Normal', cls: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
    }
  };

  const catDetails = getCategoryDetails(sheet.category);
  const CatIcon = catDetails.icon;
  const statusBadge = getStatusBadge(sheet.status);

  const completedChecklistCount = (sheet.checklist || []).filter((c) => c.completed).length;
  const totalChecklistCount = (sheet.checklist || []).length;
  const progressPercent = totalChecklistCount > 0
    ? Math.round((completedChecklistCount / totalChecklistCount) * 100)
    : 0;

  const assignedNames = (sheet.assignedPublisherIds || [])
    .map((id) => publishersMap.get(id)?.name)
    .filter(Boolean);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden group flex flex-col justify-between ${
        !sheet.isActive
          ? 'bg-zinc-100/70 dark:bg-[#121926]/70 border-zinc-200 dark:border-white/[0.04] opacity-70 grayscale-[40%]'
          : 'bg-white dark:bg-[#162032] border-zinc-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md dark:shadow-black/20 hover:border-indigo-400/50 dark:hover:border-indigo-500/40'
      }`}
    >
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Top Badges Strip */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${catDetails.color}`}
            >
              <CatIcon size={13} />
              {catDetails.label}
            </span>

            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08]">
              {sheet.frequency}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge.cls}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusBadge.label}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h4
            className={`text-base font-bold leading-snug line-clamp-2 ${
              !sheet.isActive
                ? 'text-zinc-500 line-through'
                : 'text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors'
            }`}
          >
            {sheet.label}
          </h4>
          {sheet.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {sheet.description}
            </p>
          )}
        </div>

        {/* Checklist Progress Bar */}
        {totalChecklistCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Lista de pasos ({completedChecklistCount}/{totalChecklistCount})</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : progressPercent > 0
                    ? 'bg-indigo-500'
                    : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Collapsible Checklist Items */}
        {totalChecklistCount > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
            >
              {isChecklistExpanded ? (
                <>
                  <ChevronUp size={14} /> Ocultar pasos
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Ver pasos de verificación
                </>
              )}
            </button>

            {isChecklistExpanded && (
              <div className="mt-2 space-y-1 bg-zinc-50 dark:bg-black/20 p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                {sheet.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="p-1 rounded hover:bg-white dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <SplashCheckbox
                      size="sm"
                      checked={item.completed}
                      onChange={() => onToggleChecklistItem(sheet.id, item.id)}
                      label={
                        <span
                          className={`leading-snug text-xs ${
                            item.completed
                              ? 'line-through text-zinc-400 dark:text-zinc-500'
                              : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {item.text}
                        </span>
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Safety Gear Badges */}
        {sheet.safetyGear && sheet.safetyGear.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            <Shield size={12} className="text-amber-500 shrink-0" />
            {sheet.safetyGear.slice(0, 3).map((gear, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
              >
                {gear}
              </span>
            ))}
            {sheet.safetyGear.length > 3 && (
              <span className="text-[10px] text-zinc-400">+{sheet.safetyGear.length - 3}</span>
            )}
          </div>
        )}

        {/* Dates & Assigned Brothers */}
        <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 flex-wrap gap-2">
          {sheet.nextDueDate && (
            <div className="flex items-center gap-1.5" title="Próxima fecha programada">
              <Calendar size={13} className="text-zinc-400" />
              <span>Vence: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{sheet.nextDueDate}</strong></span>
            </div>
          )}

          {sheet.estimatedMinutes && (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <Clock size={13} className="text-zinc-400" />
              <span>{sheet.estimatedMinutes} min</span>
            </div>
          )}
        </div>

        {/* Assigned Brothers Names */}
        {assignedNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 pt-0.5">
            <Users size={13} className="text-indigo-500 shrink-0" />
            <span className="truncate">Encargados: {assignedNames.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="px-4 py-3 bg-zinc-50/70 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
        {/* Toggle Active Button */}
        <button
          type="button"
          onClick={() => onToggleActive(sheet.id)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors border ${
            sheet.isActive
              ? 'bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
          }`}
          title={sheet.isActive ? 'Desactivar ficha' : 'Activar ficha'}
        >
          {sheet.isActive ? 'Activa' : 'Inactiva'}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Mark Done Today */}
          <button
            type="button"
            onClick={() => onMarkCompleted(sheet.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all"
            title="Marcar realizada hoy y actualizar próxima fecha"
          >
            <CheckCircle2 size={13} />
            <span>Realizada</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(sheet)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/[0.05] transition-colors"
            title="Editar ficha"
          >
            <Edit2 size={14} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(sheet.id)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-white/[0.05] transition-colors"
            title="Eliminar ficha"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
