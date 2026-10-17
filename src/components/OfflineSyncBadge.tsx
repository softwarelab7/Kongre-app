/**
 * src/components/OfflineSyncBadge.tsx
 * Indicador visual interactivo de estado de conectividad y cola IndexedDB.
 * Permite abrir el modal de cola offline y visualizar de un vistazo si hay
 * cambios pendientes por enviar a Supabase.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle2 } from 'lucide-react';
import { getOfflineQueueStats, QueueStats } from '../services/indexedDbQueue';

interface OfflineSyncBadgeProps {
  isOnline: boolean;
  onOpenQueueModal: () => void;
  className?: string;
}

export const OfflineSyncBadge: React.FC<OfflineSyncBadgeProps> = ({
  isOnline,
  onOpenQueueModal,
  className = '',
}) => {
  const [stats, setStats] = useState<QueueStats>({
    pendingCount: 0,
    syncingCount: 0,
    errorCount: 0,
    totalCount: 0,
    lastQueuedAt: null,
  });

  const loadStats = async () => {
    try {
      const st = await getOfflineQueueStats();
      setStats(st);
    } catch {}
  };

  useEffect(() => {
    loadStats();
    const handleUpdate = () => loadStats();
    window.addEventListener('kongre_indexeddb_queue_changed', handleUpdate);
    window.addEventListener('kongre_offline_sync_queued', handleUpdate);
    return () => {
      window.removeEventListener('kongre_indexeddb_queue_changed', handleUpdate);
      window.removeEventListener('kongre_offline_sync_queued', handleUpdate);
    };
  }, []);

  const hasPending = stats.pendingCount > 0;
  const isSyncing = stats.syncingCount > 0;

  if (!isOnline || hasPending || isSyncing) {
    return (
      <button
        type="button"
        onClick={onOpenQueueModal}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-2xs border ${
          !isOnline
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-100'
            : isSyncing
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border-indigo-300/80 dark:border-indigo-700/80 hover:bg-indigo-100'
            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300/80 dark:border-blue-700/80 hover:bg-blue-100'
        } ${className}`}
        title="Ver cola de sincronización offline en IndexedDB para Supabase"
      >
        {!isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Sin Conexión</span>
            {hasPending && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                {stats.pendingCount} en cola
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
            <span>Sincronizando con Supabase...</span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{stats.pendingCount} pendiente(s)</span>
            <span className="text-[10px] underline font-normal">Sincronizar</span>
          </>
        )}
      </button>
    );
  }

  // Si está online y al día, mostrar badge sutil de Supabase al día
  return (
    <button
      type="button"
      onClick={onOpenQueueModal}
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer ${className}`}
      title="Supabase y cola IndexedDB al día. Clic para ver detalles."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
      <span className="text-[11px] font-medium hidden sm:inline">Supabase</span>
      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Al día</span>
    </button>
  );
};
