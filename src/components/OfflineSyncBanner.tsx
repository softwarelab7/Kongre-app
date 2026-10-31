import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, ShieldCheck, RefreshCw, ChevronRight, X } from 'lucide-react';
import { getOfflineQueueStats, QueueStats } from '../services/indexedDbQueue';
import { useCongregation } from '../context/CongregationContext';
import { isSafeDemoMode } from '../utils/theocraticSecurity';

interface OfflineSyncBannerProps {
  onOpenQueueModal?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onOpenQueueModal }) => {
  const { isDemoMode, settings } = useCongregation();
  const { isOnline, wasOffline } = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
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

  // Reset dismissal if connection drops again
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  // Auto-hide banner 4 seconds after reconnecting once queue is empty
  useEffect(() => {
    if (isOnline && stats.pendingCount === 0 && stats.syncingCount === 0) {
      const timer = window.setTimeout(() => setDismissed(true), 4000);
      return () => window.clearTimeout(timer);
    }
  }, [isOnline, stats.pendingCount, stats.syncingCount]);

  if (
    isDemoMode ||
    isSafeDemoMode(settings?.congregationNumber || settings?.congregationId, settings?.isRegistered)
  ) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  if (isOnline && !wasOffline && stats.pendingCount === 0 && stats.syncingCount === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="hidden md:block fixed bottom-4 left-6 z-40 max-w-md animate-in slide-in-from-bottom duration-200">
        <div
          onClick={onOpenQueueModal}
          className={`p-3 sm:p-3.5 rounded-2xl bg-zinc-900/95 text-white backdrop-blur-md shadow-xl border border-zinc-700/80 flex items-center justify-between gap-3 ${
            onOpenQueueModal ? 'cursor-pointer hover:bg-zinc-800 transition-colors' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Modo Local Offline</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {stats.pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold font-mono tabular-nums">
                    {stats.pendingCount} en cola
                  </span>
                )}
              </p>
              <p className="text-[11px] text-zinc-300 truncate">
                Tus cambios se guardan localmente y se sincronizarán al reconectar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOpenQueueModal && (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
              aria-label="Cerrar aviso offline"
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Just reconnected or syncing
  return (
    <div className="hidden md:block fixed bottom-4 left-6 z-40 max-w-md animate-in slide-in-from-bottom duration-200">
      <div
        onClick={onOpenQueueModal}
        className={`p-3 sm:p-3.5 rounded-2xl bg-zinc-900/95 text-white backdrop-blur-md shadow-xl border border-zinc-700/80 flex items-center justify-between gap-3 ${
          onOpenQueueModal ? 'cursor-pointer hover:bg-zinc-800 transition-colors' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0">
            {stats.syncingCount > 0 ? (
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{stats.syncingCount > 0 ? 'Sincronizando cola offline...' : 'Conexión restablecida'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {stats.pendingCount > 0
                ? `Procesando ${stats.pendingCount} cambio(s) pendiente(s)...`
                : 'Cola de sincronización al día.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onOpenQueueModal && (
            <ChevronRight className="w-4 h-4 text-emerald-300" />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            aria-label="Cerrar aviso de sincronización"
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
