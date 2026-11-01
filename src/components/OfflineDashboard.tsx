import React, { useState, useEffect, useMemo } from 'react';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  CloudCheck,
  Trash2,
  X,
  FileText,
  Users,
  Calendar,
  MapPin,
  ShieldCheck,
  HardDrive,
  Bell,
  BookOpen,
  Landmark,
  ArrowUpRight,
  PlusCircle,
} from 'lucide-react';
import { useCongregation } from '../context/CongregationContext';
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
import { isSafeDemoMode } from '../utils/theocraticSecurity';

export interface OfflineDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export const OfflineDashboard: React.FC<OfflineDashboardProps> = ({
  isOpen = true,
  onClose,
  embedded = false,
}) => {
  const {
    publishers,
    weeks,
    monthlyReports,
    territories,
    notices,
    congregationEvents,
    transactions,
    literatureItems,
    settings,
    isOnline,
    syncStatus,
    isSupabaseSyncing,
    lastSupabaseSyncAt,
    offlineQueueStats,
    syncNowWithSupabase,
    syncOfflineQueueNow,
    isDemoMode,
  } = useCongregation();

  const [items, setItems] = useState<OfflineQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>(
    offlineQueueStats || {
      pendingCount: 0,
      syncingCount: 0,
      errorCount: 0,
      totalCount: 0,
      lastQueuedAt: null,
    }
  );
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const loadQueueData = async () => {
    try {
      const [allItems, queueSt] = await Promise.all([
        getAllOfflineOperations(),
        getOfflineQueueStats(),
      ]);
      setItems(allItems);
      setStats(queueSt);
    } catch (err) {
      console.warn('Error cargando datos de OfflineDashboard:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueueData();
    }
  }, [isOpen, offlineQueueStats]);

  useEffect(() => {
    const handleQueueChange = () => {
      loadQueueData();
    };
    window.addEventListener('kongre_indexeddb_queue_changed', handleQueueChange);
    window.addEventListener('kongre_offline_sync_queued', handleQueueChange);
    window.addEventListener('online', handleQueueChange);
    window.addEventListener('offline', handleQueueChange);
    return () => {
      window.removeEventListener('kongre_indexeddb_queue_changed', handleQueueChange);
      window.removeEventListener('kongre_offline_sync_queued', handleQueueChange);
      window.removeEventListener('online', handleQueueChange);
      window.removeEventListener('offline', handleQueueChange);
    };
  }, []);

  // Calculate approximate local storage footprint & synced entities
  const localDataSummary = useMemo(() => {
    const activePublishersCount = (publishers || []).filter(
      (p) => p.status !== 'deleted'
    ).length;
    const weeksCount = (weeks || []).length;
    const reportsCount = (monthlyReports || []).length;
    const territoriesCount = (territories || []).length;
    const noticesAndEventsCount =
      (notices || []).length + (congregationEvents || []).length;
    const accountsAndLitCount =
      (transactions || []).length + (literatureItems || []).length;

    const totalRecords =
      activePublishersCount +
      weeksCount +
      reportsCount +
      territoriesCount +
      noticesAndEventsCount +
      accountsAndLitCount;

    return {
      activePublishersCount,
      weeksCount,
      reportsCount,
      territoriesCount,
      noticesAndEventsCount,
      accountsAndLitCount,
      totalRecords,
    };
  }, [
    publishers,
    weeks,
    monthlyReports,
    territories,
    notices,
    congregationEvents,
    transactions,
    literatureItems,
  ]);

  if (!isOpen && !embedded) return null;

  const isBusySyncing =
    isSyncingNow ||
    isSupabaseSyncing ||
    syncStatus === 'saving' ||
    stats.syncingCount > 0;

  const pendingItems = items.filter(
    (i) => i.status === 'pending' || i.status === 'error' || i.status === 'syncing'
  );
  const syncedItems = items.filter((i) => i.status === 'synced');

  const handleSyncNow = async () => {
    if (isBusySyncing) return;
    setIsSyncingNow(true);
    setFeedback({
      type: 'info',
      message: 'Sincronizando datos locales y cola pendiente con el servidor...',
    });

    const minDelay = new Promise((r) => window.setTimeout(r, 700));

    try {
      if (
        typeof window !== 'undefined' &&
        (isDemoMode ||
          isSafeDemoMode() ||
          localStorage.getItem('kongre_is_guest') === 'true')
      ) {
        const res = await supabaseSyncService.flushOfflineQueue('DEMO', 'DEMO');
        await minDelay;
        await loadQueueData();
        setFeedback({
          type: 'success',
          message:
            res.syncedCount > 0
              ? `¡Sincronización completada! Se procesaron ${res.syncedCount} elemento(s) pendientes.`
              : '¡Todos los datos locales están sincronizados y al día!',
        });
        return;
      }

      if (!isOnline && !navigator.onLine) {
        await minDelay;
        setFeedback({
          type: 'error',
          message:
            'Sin conexión a internet. Tus datos están seguros en IndexedDB y se enviarán al recuperar la red.',
        });
        return;
      }

      const [queueRes, cloudRes] = await Promise.all([
        syncOfflineQueueNow ? syncOfflineQueueNow().catch(() => null) : Promise.resolve(null),
        syncNowWithSupabase ? syncNowWithSupabase(true).catch(() => null) : Promise.resolve(null),
        minDelay,
      ]);

      await loadQueueData();

      const syncedCount = queueRes?.syncedCount ?? 0;
      if (cloudRes?.success || queueRes?.success) {
        setFeedback({
          type: 'success',
          message:
            syncedCount > 0
              ? `¡Sincronización exitosa! ${syncedCount} cambio(s) pendientes fueron enviados al servidor.`
              : '¡Sincronización completada con el servidor! Todos los módulos están al día.',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Estado de sincronización verificado correctamente.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message:
          err?.message ||
          'No se pudo completar la sincronización con el servidor. Los datos siguen resguardados localmente.',
      });
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleEnqueueCheckpoint = async () => {
    try {
      const congId =
        settings?.congregationNumber ||
        settings?.congregationId ||
        (typeof window !== 'undefined' &&
          (localStorage.getItem('kongre_congregation_number') ||
            localStorage.getItem('kongre_congregation_id'))) ||
        'LOCAL';
      await enqueueOfflineOperation({
        congregationId: congId,
        actionType: 'FULL_SYNC',
        description: `Punto de sincronización manual (${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })})`,
      });
      await loadQueueData();
      setFeedback({
        type: 'success',
        message: 'Se registró una instantánea local en la cola pendiente de sincronización.',
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: e?.message || 'No se pudo registrar el punto de respaldo.',
      });
    }
  };

  const handleRemoveItem = async (id: string) => {
    await removeOfflineOperation(id);
    await loadQueueData();
  };

  const handleClearCompleted = async () => {
    await clearCompletedOfflineOperations();
    await loadQueueData();
  };

  const getActionMeta = (action: string) => {
    switch (action) {
      case 'UPDATE_ATTENDANCE':
        return {
          label: 'Asistencia S-88',
          icon: Users,
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
        };
      case 'UPDATE_SERVICE_REPORT':
        return {
          label: 'Informe S-21 / S-4',
          icon: FileText,
          color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
        };
      case 'UPDATE_PUBLISHER':
        return {
          label: 'Registro de Publicador',
          icon: Users,
          color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60',
        };
      case 'UPDATE_SCHEDULE':
        return {
          label: 'Programa de Reunión',
          icon: Calendar,
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
        };
      case 'UPDATE_TERRITORY':
        return {
          label: 'Territorios S-13',
          icon: MapPin,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
        };
      default:
        return {
          label: 'Sincronización Completa',
          icon: Database,
          color: 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800',
        };
    }
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Sincronizado en esta sesión';
    try {
      const d = new Date(iso);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' · ' +
        d.toLocaleDateString([], { day: '2-digit', month: 'short' })
      );
    } catch {
      return iso;
    }
  };

  const dashboardBody = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#121216]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isBusySyncing
                ? 'bg-amber-500 text-white'
                : !isOnline
                ? 'bg-rose-500 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {isBusySyncing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : !isOnline ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <HardDrive className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-zinc-900 dark:text-white text-base sm:text-lg truncate">
                Panel de Datos Locales y Sincronización (OfflineDashboard)
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isBusySyncing
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/50'
                    : !isOnline
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/50'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBusySyncing
                      ? 'bg-amber-500 animate-ping'
                      : !isOnline
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />
                {isBusySyncing ? 'Sincronizando' : !isOnline ? 'Desconectado' : 'En línea'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] truncate">
              {settings?.congregationName || 'Congregación Local'} • Última sincronización:{' '}
              {formatTimestamp(lastSupabaseSyncAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isBusySyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBusySyncing ? 'animate-spin' : ''}`} />
            <span>{isBusySyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
          </button>

          {onClose && !embedded && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de sincronización"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`px-5 py-2.5 text-xs font-bold flex items-center justify-between gap-2 border-b ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* SECTION 1: RESUMEN DE DATOS SINCRONIZADOS LOCALMENTE */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                <CloudCheck className="w-4 h-4 text-emerald-500" />
                <span>1. Resumen de Datos Sincronizados Localmente</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                Registros disponibles de forma inmediata en este dispositivo incluso sin conexión a internet.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-bold self-start sm:self-auto">
              <Database className="w-3.5 h-3.5" />
              <span>{localDataSummary.totalRecords} registros locales activos</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {localDataSummary.activePublishersCount}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Publicadores
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {localDataSummary.weeksCount}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Semanas Programadas
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {localDataSummary.reportsCount}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Informes S-4 / S-21
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {localDataSummary.territoriesCount}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Territorios S-13
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {localDataSummary.noticesAndEventsCount}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Anuncios y Eventos
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {localDataSummary.accountsAndLitCount}
                </p>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Cuentas y Literatura
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ELEMENTOS PENDIENTES DE SINCRONIZAR CON EL SERVIDOR */}
        <div className="space-y-3 pt-4 border-t border-zinc-200/80 dark:border-[#27272A]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                <RefreshCw
                  className={`w-4 h-4 text-indigo-500 ${isBusySyncing ? 'animate-spin' : ''}`}
                />
                <span>2. Elementos Pendientes de Sincronizar con el Servidor</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                Cola de operaciones almacenadas en IndexedDB listas para enviarse a Supabase.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  stats.pendingCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                {stats.pendingCount} pendiente(s)
              </span>

              <button
                type="button"
                onClick={handleEnqueueCheckpoint}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] text-[11px] font-bold transition cursor-pointer active:scale-95"
                title="Encolar un respaldo manual para probar la sincronización"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Crear respaldo en cola</span>
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 text-center space-y-2">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-zinc-900 dark:text-white">
                0 elementos pendientes · Todo sincronizado con el servidor
              </h5>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-md mx-auto">
                Cualquier cambio que realices en asistencia, programación, informes S-4/S-21 o territorios mientras estés sin conexión aparecerá listado aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA] px-1">
                <span>
                  Mostrando {pendingItems.length} pendiente(s) y {syncedItems.length} completada(s)
                </span>
                {syncedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Limpiar completadas
                  </button>
                )}
              </div>

              {items.map((item) => {
                const meta = getActionMeta(item.actionType);
                const ActionIcon = meta.icon;
                const isPending = item.status === 'pending' || item.status === 'error';
                const isItemSyncing = item.status === 'syncing';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}
                      >
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] mt-0.5 truncate">
                          {item.description}
                        </p>
                        {item.lastError && (
                          <p className="text-[11px] text-rose-500 mt-0.5">{item.lastError}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pendiente
                        </span>
                      )}
                      {isItemSyncing && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Sincronizando
                        </span>
                      )}
                      {item.status === 'synced' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Sincronizado
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                        title="Eliminar de la cola"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security & Offline Architecture Note */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A] flex items-start gap-3 text-xs text-zinc-600 dark:text-[#A1A1AA]">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Arquitectura Offline-First con Cifrado AES-256-GCM:</strong> Todos los datos locales se almacenan de forma segura en el dispositivo y se sincronizan automáticamente o al presionar <strong>«Sincronizar ahora»</strong>.
          </p>
        </div>
      </div>

      {/* Footer */}
      {!embedded && (
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121216] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span>Conectado al servidor de sincronización</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span>Trabajando en modo local sin conexión</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            )}
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isBusySyncing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBusySyncing ? 'animate-spin' : ''}`} />
              <span>{isBusySyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="w-full bg-white dark:bg-[#121216] rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-sm overflow-hidden">
        {dashboardBody}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Panel de Datos Locales y Sincronización Offline"
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {dashboardBody}
      </div>
    </div>
  );
};
