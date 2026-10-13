import React, { useEffect, useState, useCallback } from 'react';
import { PublisherChangeLog } from '../../types';
import { History, RotateCcw, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

// ---------------------------------------------------------------------------
// Campo labels & badge colors
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  rol: 'Rol',
  estado: 'Estado',
  pioneer_type: 'Tipo de Pionero',
  is_disfellowshipped: 'Excluido',
  is_reinstated: 'Reinstalado',
  is_inactive: 'Inactivo',
  is_active: 'Activo',
  is_imprisoned: 'Encarcelado',
  is_moved: 'Se mudó',
  group_responsibility: 'Resp. en Grupo',
  id_grupo: 'Grupo asignado',
  baptism_date: 'Fecha de Bautismo',
  publisher_date: 'Fecha como Publicador',
  privilegios: 'Privilegios',
  aprobado: 'Aprobado',
  nombre: 'Nombre completo',
  spiritual_notes: 'Notas espirituales',
};

const FIELD_BADGE: Record<string, string> = {
  rol: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  estado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  is_disfellowshipped: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  is_reinstated: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  privilegios: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  spiritual_notes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

function fieldBadge(campo: string): string {
  return FIELD_BADGE[campo] ?? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]';
}

function formatValue(campo: string, val: string | null): string {
  if (val === null || val === '') return '(vacío)';

  // Boolean fields stored as '0'/'1'
  const boolFields = ['is_disfellowshipped', 'is_reinstated', 'is_inactive', 'is_active',
    'is_imprisoned', 'is_moved', 'aprobado'];
  if (boolFields.includes(campo)) return val === '1' ? 'Sí' : 'No';

  // Pioneer type map
  if (campo === 'pioneer_type') {
    const map: Record<string, string> = {
      none: 'Ninguno', auxiliary_continuous: 'P. Auxiliar continuo',
      regular: 'P. Regular', special: 'P. Especial', missionary: 'Misionero',
    };
    return map[val] ?? val;
  }

  // Role map
  if (campo === 'rol') {
    const map: Record<string, string> = {
      super_admin: 'Admin', elder: 'Anciano', servant: 'Siervo',
      publisher: 'Publicador', unbaptized: 'No bautizado',
    };
    return map[val] ?? val;
  }

  // Group responsibility
  if (campo === 'group_responsibility') {
    const map: Record<string, string> = { none: 'Ninguna', overseer: 'Encargado', assistant: 'Auxiliar' };
    return map[val] ?? val;
  }

  // Privilege JSON arrays — pretty print
  if (campo === 'privilegios') {
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr) && arr.length === 0) return '(ninguno)';
      return Array.isArray(arr) ? arr.join(', ') : val;
    } catch { return val; }
  }

  return val;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isRevert(row: PublisherChangeLog): boolean {
  return row.cambiado_por?.startsWith('revert:') ?? false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PublisherHistoryPanelProps {
  publisherNid: string | undefined;
  /** Called after a successful revert so the parent can reload publisher data */
  onRevertSuccess?: () => void;
}

export const PublisherHistoryPanel: React.FC<PublisherHistoryPanelProps> = ({
  publisherNid,
  onRevertSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<PublisherChangeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useModal();
  const { showToast } = useToast();

  const loadHistory = useCallback(async () => {
    if (!publisherNid || !(window as any)?.electronAPI?.getHistorialPublicador) return;
    setLoading(true);
    setError(null);
    try {
      const data = await (window as any).electronAPI.getHistorialPublicador(publisherNid);
      setHistory(data);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [publisherNid]);

  // Load when panel opens
  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  const handleRevert = useCallback(async (row: PublisherChangeLog) => {
    const label = FIELD_LABELS[row.campo] ?? row.campo;
    const confirmed = await confirm({
      title: `Revertir "${label}"`,
      message: `¿Restaurar el campo "${label}" al valor anterior?\n\nAnterior: ${formatValue(row.campo, row.valor_ant)}\nActual:    ${formatValue(row.campo, row.valor_new)}`,
      confirmText: 'Revertir',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      if ((window as any)?.electronAPI?.revertirCambioPublicador) {
        await (window as any).electronAPI.revertirCambioPublicador(row.id);
        showToast(`"${label}" restaurado correctamente`, 'success');
        await loadHistory();
        onRevertSuccess?.();
      } else {
        showToast('Acción de revertir no disponible en navegador', 'info');
      }
    } catch (err: any) {
      showToast(`Error al revertir: ${err.message}`, 'error');
    }
  }, [confirm, loadHistory, onRevertSuccess, showToast]);

  // Don't render if no NID (new publisher)
  if (!publisherNid) return null;

  return (
    <div className="mt-6 bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl shadow-sm overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 md:px-8 py-5 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">
              Historial de cambios
            </h3>
            {!open && history.length > 0 && (
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {history.length} {history.length === 1 ? 'registro' : 'registros'}
              </p>
            )}
          </div>
        </div>
        <div className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-zinc-100 dark:border-white/[0.06]">
          {loading && (
            <div className="flex items-center justify-center py-10 gap-3 text-zinc-400">
              <Clock size={18} className="animate-spin" />
              <span className="text-sm font-semibold">Cargando historial…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 px-5 py-4 text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} />
              <span className="text-xs font-semibold">{error}</span>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400 dark:text-zinc-600">
              <History size={28} strokeWidth={1.5} />
              <p className="text-xs font-semibold">Sin cambios registrados aún</p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-white/[0.01]">
                    <th className="px-6 md:px-8 py-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Fecha</th>
                    <th className="px-6 md:px-8 py-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Campo</th>
                    <th className="px-6 md:px-8 py-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Antes</th>
                    <th className="px-6 md:px-8 py-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Después</th>
                    <th className="px-6 md:px-8 py-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                  {history.map(row => {
                    const label = FIELD_LABELS[row.campo] ?? row.campo;
                    const reverted = isRevert(row);
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] ${reverted ? 'opacity-60' : ''}`}
                      >
                        <td className="px-6 md:px-8 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                              {formatDate(row.fecha)}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                              {reverted ? '↩ Revert' : (row.cambiado_por ?? 'ADMIN')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 md:px-8 py-3">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${fieldBadge(row.campo)}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-3 max-w-[140px]">
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2 break-words">
                            {formatValue(row.campo, row.valor_ant)}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-3 max-w-[140px]">
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 break-words">
                            {formatValue(row.campo, row.valor_new)}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-3 text-right">
                          {!reverted && row.valor_ant !== null && (
                            <button
                              onClick={() => handleRevert(row)}
                              title={`Revertir "${label}" al valor anterior`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08] hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95"
                            >
                              <RotateCcw size={11} />
                              Revertir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};