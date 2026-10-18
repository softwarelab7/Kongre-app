/**
 * src/components/OfflineSyncBadge.tsx
 * Indicador visual interactivo de estado de conectividad y cola IndexedDB.
 * Permite abrir el modal de cola offline y visualizar de un vistazo si hay
 * cambios pendientes por enviar a Supabase.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CloudCheck, CloudUpload } from 'lucide-react';
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

  // En modo demo no hay conexión ni sincronización con Supabase
  const isDemo =
    typeof window !== 'undefined' &&
    (localStorage.getItem('kongre_demo_mode') === 'true' ||
      localStorage.getItem('kongre_is_guest') === 'true');

  if (isDemo) {
    return null;
  }

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
        title="Ver estado de conexión y cola de sincronización en la nube"
      >
        {!isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Sin Conexión</span>
            <span className="sm:hidden text-[10px]">Offline</span>
            {hasPending && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                {stats.pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
            <span className="hidden sm:inline">Sincronizando nube...</span>
            <span className="sm:hidden text-[10px]">Sincronizando</span>
          </>
        ) : (
          <>
            <CloudUpload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{stats.pendingCount} pend.</span>
            <span className="text-[10px] underline font-normal hidden sm:inline">Sincronizar</span>
          </>
        )}
      </button>
    );
  }

  // Si está online y al día, mostrar badge único de conexión a la nube
  return (
    <button
      type="button"
      onClick={onOpenQueueModal}
      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 ${className}`}
      title="Conexión en la nube activa y sincronizada (Supabase e IndexedDB). Clic para ver detalles."
    >
      <span className="relative flex items-center justify-center">
        <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
      </span>
      <span className="text-[11px] font-medium hidden sm:inline">Nube</span>
      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold hidden xs:inline">Al día</span>
    </button>
  );
};
