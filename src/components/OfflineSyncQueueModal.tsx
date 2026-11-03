/**
 * src/components/OfflineSyncQueueModal.tsx
 * Modal interactivo para visualizar y gestionar la cola de sincronización
 * offline en IndexedDB y su sincronización automática con Supabase.
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Cloud,
  CloudOff,
  Trash2,
  X,
  FileText,
  Users,
  Calendar,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  getAllOfflineOperations,
  removeOfflineOperation,
  clearCompletedOfflineOperations,
  enqueueOfflineOperation,
  OfflineQueueItem,
  QueueStats,
  getOfflineQueueStats,
} from '../services/indexedDbQueue';
import { supabaseSyncService } from '../services/supabaseSyncService';
import { getSecureLocalPin, isSafeDemoMode } from '../utils/theocraticSecurity';

interface OfflineSyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onSyncNow?: () => Promise<any>;
}

export const OfflineSyncQueueModal: React.FC<OfflineSyncQueueModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  onSyncNow,
}) => {
  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    pendingCount: 0,
    syncingCount: 0,
    errorCount: 0,
    totalCount: 0,
    lastQueuedAt: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadQueue = async () => {
    try {
      const all = await getAllOfflineOperations();
      setItems(all);
      const st = await getOfflineQueueStats();
      setStats(st);
    } catch (e) {
      console.warn('Error cargando cola de IndexedDB:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
      setSyncFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleQueueChange = () => {
      loadQueue();
    };
    window.addEventListener('kongre_indexeddb_queue_changed', handleQueueChange);
    window.addEventListener('kongre_offline_sync_queued', handleQueueChange);
    return () => {
      window.removeEventListener('kongre_indexeddb_queue_changed', handleQueueChange);
      window.removeEventListener('kongre_offline_sync_queued', handleQueueChange);
    };
  }, []);

  if (!isOpen) return null;

  const handleEnqueueCheckpoint = async () => {
    try {
      const congId =
        (typeof window !== 'undefined' &&
          (localStorage.getItem('kongre_congregation_number') ||
            localStorage.getItem('kongre_congregation_id'))) ||
        'LOCAL';
      await enqueueOfflineOperation({
        congregationId: congId,
        actionType: 'FULL_SYNC',
        description: `Punto de respaldo manual (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      });
      await loadQueue();
      setSyncFeedback({
        type: 'success',
        message: 'Se agregó un nuevo elemento a la cola offline. Observa el contador en tiempo real en la barra superior.',
      });
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: e?.message || 'No se pudo agregar a la cola offline.',
      });
    }
  };

  const handleManualSync = async () => {
    if (
      typeof window !== 'undefined' &&
      (isSafeDemoMode() ||
        localStorage.getItem('kongre_is_guest') === 'true')
    ) {
      setIsProcessing(true);
      try {
        const res = await supabaseSyncService.flushOfflineQueue('DEMO', 'DEMO');
        await loadQueue();
        setSyncFeedback({
          type: 'success',
          message:
            res.syncedCount > 0
              ? `¡Cola offline procesada localmente! (${res.syncedCount} elemento(s) sincronizado(s)).`
              : 'La cola offline está al día (0 elementos pendientes).',
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!isOnline) {
      setSyncFeedback({
        type: 'error',
        message: 'No hay conexión a internet disponible en este momento. Los cambios permanecen resguardados en IndexedDB.',
      });
      return;
    }

    setIsProcessing(true);
    setSyncFeedback(null);

    try {
      if (onSyncNow) {
        await onSyncNow();
      } else {
        const pinMaestro =
          getSecureLocalPin('kongre_session_pin_v2') ||
          getSecureLocalPin('kongre_coordinator_pin') ||
          getSecureLocalPin('kongre_registered_cong_pin') ||
          getSecureLocalPin('kongre_last_cong_pin') ||
          '';
        const pinCong =
          getSecureLocalPin('kongre_registered_cong_pin') ||
          getSecureLocalPin('kongre_last_cong_pin') ||
          pinMaestro;

        const res = await supabaseSyncService.flushOfflineQueue(pinMaestro, pinCong);
        if (res.success) {
          setSyncFeedback({
            type: 'success',
            message: `¡Sincronización completada con Supabase! (${res.syncedCount} cambios procesados).`,
          });
        }
      }
      await loadQueue();
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Error al conectar con Supabase para sincronizar.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id: string) => {
    await removeOfflineOperation(id);
    await loadQueue();
  };

  const handleClearCompleted = async () => {
    await clearCompletedOfflineOperations();
    await loadQueue();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPDATE_ATTENDANCE':
        return {
          label: 'Asistencia S-88',
          icon: Users,
          dotColor: 'bg-emerald-500',
        };
      case 'UPDATE_SERVICE_REPORT':
        return {
          label: 'Informe S-21',
          icon: FileText,
          dotColor: 'bg-blue-500',
        };
      case 'UPDATE_SCHEDULE':
        return {
          label: 'Programación',
          icon: Calendar,
          dotColor: 'bg-indigo-500',
        };
      case 'UPDATE_TERRITORY':
        return {
          label: 'Territorio',
          icon: MapPin,
          dotColor: 'bg-amber-500',
        };
      default:
        return {
          label: 'Congregación',
          icon: Database,
          dotColor: 'bg-zinc-500',
        };
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' +
        d.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Cola de sincronización offline"
    >
      <div
        className="relative w-full max-w-2xl kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#121216]/50">
          <div className="flex items-center gap-3">
            <div className="kg-glow-badge w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
                  Cola de Sincronización Offline (IndexedDB)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Supabase
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Almacenamiento persistente en el dispositivo para uso sin conexión
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cola de sincronización offline"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Connectivity Status */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-600 dark:text-[#A1A1AA]">Estado de Red:</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                Sin Conexión (Offline)
              </span>
            )}
          </div>

          {/* Pending counter & quick checkpoint action */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-[#A1A1AA]">Pendientes en cola:</span>
            <span
              className={`font-mono tabular-nums font-bold px-2 py-0.5 rounded-md border text-xs ${
                stats.pendingCount > 0
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#E4E4E7] border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              {stats.pendingCount}
            </span>
            <button
              type="button"
              onClick={handleEnqueueCheckpoint}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] font-medium text-[11px] transition cursor-pointer active:scale-95"
              title="Encolar un respaldo manual para verificar la cola en tiempo real"
            >
              + Encolar respaldo
            </button>
          </div>
        </div>

        {/* Feedback message if any */}
        {syncFeedback && (
          <div className="px-5 py-2.5 text-xs flex items-center gap-2 bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-[#27272A]">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-[#E4E4E7] text-sm mb-1">
                Cola al día y sincronizada
              </h4>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                No hay modificaciones pendientes en cola. Cuando realices cambios en modo fuera de línea (marcar asistencia, editar informes, etc.), se guardarán automáticamente aquí en IndexedDB.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-[#71717A] px-1">
                <span>Modificaciones registradas ({items.length})</span>
                {items.some((i) => i.status === 'synced') && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Limpiar completadas
                  </button>
                )}
              </div>

              {items.map((item) => {
                const badge = getActionBadge(item.actionType);
                const BadgeIcon = badge.icon;
                const isPending = item.status === 'pending' || item.status === 'error';
                const isSyncing = item.status === 'syncing';
                const isSynced = item.status === 'synced';

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-zinc-200/90 dark:border-[#27272A]/90 bg-white dark:bg-[#18181F]/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700/60 flex items-center justify-center text-zinc-600 dark:text-[#D4D4D8] shrink-0 mt-0.5">
                        <BadgeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A]">
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} shrink-0`} />
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 dark:text-[#71717A] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7]">
                          {item.description}
                        </p>
                        {item.lastError && (
                          <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">
                            Nota: {item.lastError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#27272A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#3E3E42] text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          En cola (IndexedDB)
                        </span>
                      )}
                      {isSyncing && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#27272A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#3E3E42] text-[11px] font-medium">
                          <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                          Sincronizando...
                        </span>
                      )}
                      {isSynced && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#27272A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#3E3E42] text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Sincronizado
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
                        title="Descartar de la cola"
                        aria-label={`Descartar de la cola: ${item.description}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Informational Callout */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-200/80 dark:border-[#27272A] text-xs text-zinc-600 dark:text-[#A1A1AA] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-[#E4E4E7] text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Garantía de Cero Pérdida de Datos con Supabase</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-[#A1A1AA]">
              Tus modificaciones de asistencia a reuniones, conteos, e informes de predicación quedan resguardadas de inmediato en la base de datos <strong>IndexedDB</strong> de tu navegador o dispositivo móvil. En cuanto vuelvas a tener señal WiFi o red celular, el motor de sincronización transmitirá automáticamente los datos cifrados con <strong>AES-256-GCM</strong> hacia <strong>Supabase</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#121216]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 dark:text-[#71717A] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>IndexedDB: kongre_offline_sync_db (v1)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isProcessing || !isOnline}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Sincronizando...' : 'Sincronizar ahora con Supabase'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
