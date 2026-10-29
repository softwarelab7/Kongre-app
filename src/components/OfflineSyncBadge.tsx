/**
 * src/components/OfflineSyncBadge.tsx
 * Indicador visual en tiempo real en la barra de herramientas que muestra
 * cuántos elementos están pendientes de sincronización en la cola offline (IndexedDB / Supabase).
 */

import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, RefreshCw, CloudCheck, CloudUpload, AlertCircle } from 'lucide-react';
import { getOfflineQueueStats, QueueStats } from '../services/indexedDbQueue';
import { useOptionalCongregation } from '../context/CongregationContext';
import { isSafeDemoMode } from '../utils/theocraticSecurity';

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
  const congregation = useOptionalCongregation();
  const offlineQueueStats = congregation?.offlineQueueStats;
  const isSupabaseSyncing = congregation?.isSupabaseSyncing ?? false;
  const isDemoMode = congregation?.isDemoMode ?? false;
  const settings = congregation?.settings;

  const [stats, setStats] = useState<QueueStats>({
    pendingCount: 0,
    syncingCount: 0,
    errorCount: 0,
    totalCount: 0,
    lastQueuedAt: null,
  });
  const [liveOnline, setLiveOnline] = useState<boolean>(isOnline);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    setLiveOnline(isOnline);
  }, [isOnline]);

  const loadStats = async () => {
    try {
      const st = await getOfflineQueueStats();
      setStats(st);
    } catch {}
  };

  // Mantener sincronizado con el contexto global en tiempo real
  useEffect(() => {
    if (offlineQueueStats) {
      setStats(offlineQueueStats);
    }
  }, [offlineQueueStats]);

  // Escuchar eventos en tiempo real de la cola IndexedDB, localStorage y estado de red
  useEffect(() => {
    loadStats();

    const handleUpdate = () => {
      loadStats();
    };
    const handleOnline = () => {
      setLiveOnline(true);
      loadStats();
    };
    const handleOffline = () => {
      setLiveOnline(false);
      loadStats();
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadStats();
      }
    };

    window.addEventListener('kongre_indexeddb_queue_changed', handleUpdate);
    window.addEventListener('kongre_offline_sync_queued', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    const pollInterval = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      loadStats();
    }, 4000);

    return () => {
      window.removeEventListener('kongre_indexeddb_queue_changed', handleUpdate);
      window.removeEventListener('kongre_offline_sync_queued', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(pollInterval);
    };
  }, []);

  const pendingCount = stats.pendingCount;
  const hasErrors = stats.errorCount > 0;
  const isSyncing = stats.syncingCount > 0 || isSupabaseSyncing;

  // Efecto visual de pulso cuando cambia el número de elementos en la cola
  useEffect(() => {
    if (prevCountRef.current !== pendingCount) {
      prevCountRef.current = pendingCount;
      setIsPulsing(true);
      const timer = window.setTimeout(() => setIsPulsing(false), 900);
      return () => window.clearTimeout(timer);
    }
  }, [pendingCount]);

  if (
    isDemoMode ||
    isSafeDemoMode(settings?.congregationNumber || settings?.congregationId, settings?.isRegistered)
  ) {
    return null;
  }

  if (!liveOnline || pendingCount > 0 || isSyncing) {
    const badgeTone = !liveOnline
      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300/90 dark:border-amber-700/80 hover:bg-amber-100/80'
      : isSyncing
      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border-indigo-300/90 dark:border-indigo-700/80 hover:bg-indigo-100/80'
      : hasErrors
      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300/90 dark:border-rose-700/80 hover:bg-rose-100/80'
      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300/90 dark:border-blue-700/80 hover:bg-blue-100/80';

    return (
      <button
        type="button"
        onClick={onOpenQueueModal}
        aria-label={`Cola de sincronización offline: ${pendingCount} elementos pendientes`}
        className={`group inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-2xs border ${badgeTone} ${
          isPulsing ? 'ring-2 ring-indigo-500/50 scale-105' : ''
        } ${className}`}
        title={`Cola de sincronización offline: ${pendingCount} elemento(s) pendiente(s). Clic para gestionar.`}
      >
        {!liveOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden md:inline">Offline</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none transition-transform ${
                pendingCount > 0
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
              }`}
            >
              {pendingCount} <span className="hidden sm:inline">pend.</span>
            </span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
            <span className="hidden md:inline">Sincronizando</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none bg-indigo-600 text-white">
              {pendingCount || stats.syncingCount} <span className="hidden sm:inline">pend.</span>
            </span>
          </>
        ) : (
          <>
            <span className="relative flex items-center justify-center shrink-0">
              {hasErrors ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              )}
              <span
                className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-ping ${
                  hasErrors ? 'bg-rose-500' : 'bg-blue-500'
                }`}
              />
            </span>
            <span className="hidden lg:inline text-[11px] font-semibold">Cola Offline</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none text-white shadow-2xs ${
                hasErrors ? 'bg-rose-600' : 'bg-blue-600'
              }`}
            >
              {pendingCount} <span className="hidden sm:inline">pend.</span>
            </span>
          </>
        )}
      </button>
    );
  }

  // Estado online con 0 elementos pendientes: muestra indicador en tiempo real con contador en 0
  return (
    <button
      type="button"
      onClick={onOpenQueueModal}
      aria-label="Cola de sincronización offline: 0 elementos pendientes (Al día)"
      className={`group inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 ${
        isPulsing ? 'ring-2 ring-emerald-500/40 scale-105' : ''
      } ${className}`}
      title="Cola de sincronización offline en tiempo real: 0 elementos pendientes (Al día). Clic para ver detalles."
    >
      <span className="relative flex items-center justify-center shrink-0">
        <CloudCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
      </span>
      <span className="text-[11px] font-semibold hidden md:inline">Cola</span>
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
        0 <span className="hidden sm:inline">pend.</span>
      </span>
    </button>
  );
};
