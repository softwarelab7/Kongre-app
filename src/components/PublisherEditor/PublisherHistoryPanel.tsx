// src/components/PublisherEditor/PublisherHistoryPanel.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Publisher, PublisherChangeLog } from '../../types';
import { History, RotateCcw, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

const FIELD_LABELS: Record<string, string> = {
  rol: 'Rol Teocrático',
  role: 'Rol Teocrático',
  estado: 'Estado',
  status: 'Estado',
  pioneer_type: 'Precursorado',
  is_disfellowshipped: 'Sacado',
  is_reinstated: 'Readmitido',
  is_reproved: 'Censurado',
  is_inactive: 'Inactivo',
  is_active: 'Activo',
  is_imprisoned: 'Encarcelado',
  is_moved: 'Se mudó',
  group_responsibility: 'Resp. en Grupo',
  id_grupo: 'Grupo de Servicio',
  baptism_date: 'Fecha de Bautismo',
  publisher_date: 'Inicio Publicador',
  privilegios: 'Responsabilidades',
  privileges: 'Responsabilidades',
  nombre: 'Nombre completo',
  full_name: 'Nombre completo',
  phone: 'Teléfono',
  address: 'Dirección',
  has_dpa: 'Directriz DPA',
  spiritual_notes: 'Notas espirituales',
};

const FIELD_BADGE: Record<string, string> = {
  rol: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  role: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  estado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  status: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  is_disfellowshipped: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  is_reinstated: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  privilegios: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  privileges: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  spiritual_notes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

function fieldBadge(campo: string): string {
  return (
    FIELD_BADGE[campo] ??
    'bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]'
  );
}

function formatValue(campo: string, val: string | null): string {
  if (val === null || val === undefined || val === '') return '(vacío)';

  const boolFields = [
    'is_disfellowshipped',
    'is_reinstated',
    'is_reproved',
    'is_inactive',
    'is_active',
    'is_imprisoned',
    'is_moved',
    'has_dpa',
    'aprobado',
  ];
  if (boolFields.includes(campo)) {
    return val === '1' || val === 'true' ? 'Sí' : 'No';
  }

  if (campo === 'pioneer_type') {
    const map: Record<string, string> = {
      none: 'Ninguno',
      auxiliary: 'P. Auxiliar',
      auxiliary_continuous: 'P. Auxiliar continuo',
      regular: 'P. Regular',
      special: 'P. Especial',
      missionary: 'Misionero',
    };
    return map[val] ?? val;
  }

  if (campo === 'rol' || campo === 'role') {
    const map: Record<string, string> = {
      super_admin: 'Admin',
      elder: 'Anciano',
      servant: 'Siervo Ministerial',
      publisher: 'Publicador Bautizado',
      unbaptized: 'No bautizado',
    };
    return map[val] ?? val;
  }

  if (campo === 'group_responsibility') {
    const map: Record<string, string> = {
      miembro: 'Publicador',
      none: 'Ninguna',
      overseer: 'Sup. de Grupo',
      assistant: 'Auxiliar de Grupo',
    };
    return map[val] ?? val;
  }

  if (campo === 'privilegios' || campo === 'privileges') {
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr) && arr.length === 0) return '(ninguno)';
      return Array.isArray(arr) ? arr.join(', ') : val;
    } catch {
      return val;
    }
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

export const getBrowserPublisherHistory = (nid: string): PublisherChangeLog[] => {
  if (!nid) return [];
  try {
    const raw = localStorage.getItem(`kongre_pub_history_${nid}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveBrowserPublisherHistory = (nid: string, logs: PublisherChangeLog[]) => {
  if (!nid) return;
  try {
    localStorage.setItem(`kongre_pub_history_${nid}`, JSON.stringify(logs.slice(0, 100)));
  } catch {
    // ignore storage quota errors
  }
};

interface PublisherHistoryPanelProps {
  publisherNid: string | undefined;
  formData?: Publisher;
  handleChange?: (field: keyof Publisher, value: any) => void;
  onRevertSuccess?: () => void;
}

export const PublisherHistoryPanel: React.FC<PublisherHistoryPanelProps> = ({
  publisherNid,
  formData,
  handleChange,
  onRevertSuccess,
}) => {
  const [history, setHistory] = useState<PublisherChangeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useModal();
  const { showToast } = useToast();

  const loadHistory = useCallback(async () => {
    if (!publisherNid) return;
    setLoading(true);
    setError(null);
    try {
      if ((window as any)?.electronAPI?.getHistorialPublicador) {
        const data = await (window as any).electronAPI.getHistorialPublicador(publisherNid);
        setHistory(data);
      } else {
        const stored = getBrowserPublisherHistory(publisherNid);
        const fromRecord = formData?.change_history || [];
        const mergedMap = new Map<string, PublisherChangeLog>();
        [...fromRecord, ...stored].forEach((item) => {
          if (item && item.id) mergedMap.set(String(item.id), item);
        });
        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        setHistory(sorted);
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [publisherNid, formData?.change_history]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRevert = useCallback(
    async (row: PublisherChangeLog) => {
      const label = FIELD_LABELS[row.campo] ?? row.campo;
      const confirmed = await confirm({
        title: `Revertir "${label}"`,
        message: `¿Restaurar el campo "${label}" al valor anterior?\n\nAnterior: ${formatValue(
          row.campo,
          row.valor_ant
        )}\nActual: ${formatValue(row.campo, row.valor_new)}`,
        confirmText: 'Revertir cambio',
        type: 'danger',
      });
      if (!confirmed) return;

      try {
        if ((window as any)?.electronAPI?.revertirCambioPublicador) {
          await (window as any).electronAPI.revertirCambioPublicador(row.id);
          showToast(`"${label}" restaurado correctamente`, 'success');
          await loadHistory();
          onRevertSuccess?.();
        } else if (handleChange && publisherNid) {
          let restoredVal: any = row.valor_ant;
          if (restoredVal === 'true' || restoredVal === '1') restoredVal = true;
          else if (restoredVal === 'false' || restoredVal === '0') restoredVal = false;
          else if (row.campo === 'privileges' || row.campo === 'privilegios') {
            try {
              restoredVal = JSON.parse(row.valor_ant || '[]');
            } catch {
              restoredVal = [];
            }
          }

          const targetField = (row.campo === 'rol' ? 'role' : row.campo) as keyof Publisher;
          handleChange(targetField, restoredVal);

          const revertEntry: PublisherChangeLog = {
            id: String(Date.now()),
            nid: publisherNid,
            campo: row.campo,
            valor_ant: row.valor_new,
            valor_new: row.valor_ant,
            cambiado_por: `revert:${row.id}`,
            fecha: new Date().toISOString(),
          };
          const nextHistory = [revertEntry, ...history];
          saveBrowserPublisherHistory(publisherNid, nextHistory);
          handleChange('change_history', nextHistory);
          setHistory(nextHistory);
          showToast(`"${label}" restaurado en la ficha (recuerda presionar Guardar)`, 'success');
        }
      } catch (err: any) {
        showToast(`Error al revertir: ${err.message}`, 'error');
      }
    },
    [confirm, loadHistory, onRevertSuccess, showToast, handleChange, publisherNid, history]
  );

  if (!publisherNid) return null;

  return (
    <div className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 border border-zinc-200/80 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-zinc-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="kg-glow-badge p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
                Historial de Auditoría y Cambios
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                {history.length} {history.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
              Registro cronológico de modificaciones en la ficha del publicador con opción de reversión
            </p>
          </div>
        </div>
      </div>

      <div>
        {loading && (
          <div className="flex items-center justify-center py-10 gap-3 text-zinc-400 dark:text-[#A1A1AA]">
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
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400 dark:text-[#A1A1AA]">
            <CheckCircle2 size={28} strokeWidth={1.5} className="text-emerald-500/70" />
            <p className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5]">
              Sin cambios registrados todavía
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] max-w-md text-center">
              Cada vez que guardes cambios en el rol, grupo, bautismo, DPA o estado del publicador, aparecerán aquí para futura referencia o reversión.
            </p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-[#18181F]/70 border-b border-zinc-100 dark:border-[#27272A]">
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA]">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA]">
                    Campo Modificado
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA]">
                    Valor Anterior
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA]">
                    Valor Nuevo
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA] text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                {history.map((row) => {
                  const label = FIELD_LABELS[row.campo] ?? row.campo;
                  const reverted = isRevert(row);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-zinc-50/60 dark:hover:bg-[#18181F]/60 ${
                        reverted ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono tabular-nums font-semibold text-zinc-800 dark:text-[#F4F4F5]">
                            {formatDate(row.fecha)}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-400 dark:text-[#A1A1AA] mt-0.5">
                            {reverted ? '↩ Restauración' : row.cambiado_por ?? 'Secretaría'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${fieldBadge(
                            row.campo
                          )}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 max-w-[180px]">
                        <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] line-clamp-2 break-words">
                          {formatValue(row.campo, row.valor_ant)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 max-w-[180px]">
                        <span className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] line-clamp-2 break-words">
                          {formatValue(row.campo, row.valor_new)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {!reverted && row.valor_ant !== null && (
                          <button
                            type="button"
                            onClick={() => handleRevert(row)}
                            title={`Revertir "${label}" al valor anterior`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A] hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            <RotateCcw size={12} />
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
    </div>
  );
};