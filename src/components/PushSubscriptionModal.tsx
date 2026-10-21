// src/components/PushSubscriptionModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Clock,
  Calendar,
  Send,
  ShieldCheck,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Layers,
  Check,
  Radio,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  getPushSubscriptionRecord,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  syncAssignmentsWithServiceWorker,
  simulateBackgroundPushReminder,
  getCurrentDeviceLabel,
  NotificationPreferences,
  PushSubscriptionRecord,
  ScheduledPushReminder,
} from '../services/notificationService';
import { WeekSchedule, CartShift, CartLocation, CongregationSettings } from '../types';

interface PushSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisherId: string;
  publisherName: string;
  congregationName?: string;
  weeks: WeekSchedule[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  settings?: CongregationSettings;
  publishersMap?: Map<string, any>;
  onSubscriptionChange?: (sub: PushSubscriptionRecord | null) => void;
}

export const PushSubscriptionModal: React.FC<PushSubscriptionModalProps> = ({
  isOpen,
  onClose,
  publisherId,
  publisherName,
  congregationName,
  weeks,
  cartShifts,
  cartLocations,
  settings,
  publishersMap,
  onSubscriptionChange,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    getNotificationPreferences()
  );
  const [subscription, setSubscription] = useState<PushSubscriptionRecord | null>(() =>
    getPushSubscriptionRecord()
  );
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledPushReminder[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const deviceLabel = useMemo(() => getCurrentDeviceLabel(), []);

  const refreshQueue = useCallback(
    async (overridePrefs?: NotificationPreferences) => {
      if (!publisherName && !publisherId) return;
      setIsSyncing(true);
      try {
        const list = await syncAssignmentsWithServiceWorker({
          publisherId,
          publisherName,
          congregationName,
          weeks,
          cartShifts,
          cartLocations,
          settings,
          publishersMap,
          preferences: overridePrefs || prefs,
        });
        setScheduledReminders(list);
        const updatedSub = getPushSubscriptionRecord();
        setSubscription(updatedSub);
      } finally {
        setIsSyncing(false);
      }
    },
    [
      publisherId,
      publisherName,
      congregationName,
      weeks,
      cartShifts,
      cartLocations,
      settings,
      publishersMap,
      prefs,
    ]
  );

  useEffect(() => {
    if (!isOpen) return;
    setPermission(getNotificationPermission());
    setPrefs(getNotificationPreferences());
    setSubscription(getPushSubscriptionRecord());
    refreshQueue();
  }, [isOpen, refreshQueue]);

  // Temporizador para prueba de 5 segundos con app cerrada
  useEffect(() => {
    if (countdownSec === null) return;
    if (countdownSec <= 0) {
      setCountdownSec(null);
      setFeedback({
        type: 'success',
        text: '¡Notificación Push disparada por el Service Worker! Revisa tu bandeja de notificaciones del sistema.',
      });
      return;
    }
    const timer = setTimeout(() => {
      setCountdownSec((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdownSec]);

  if (!isOpen) return null;

  const isSubscribed = Boolean(
    permission === 'granted' && prefs.enabled && subscription && subscription.active
  );

  const nextReminder = scheduledReminders.length > 0 ? scheduledReminders[0] : null;

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setFeedback(null);
    try {
      const res = await subscribeToPushNotifications({
        publisherId,
        publisherName,
        congregationName,
        weeks,
        cartShifts,
        cartLocations,
        settings,
        publishersMap,
      });

      setPermission(res.permission);
      if (res.success && res.subscription) {
        setSubscription(res.subscription);
        const updatedPrefs = getNotificationPreferences();
        setPrefs(updatedPrefs);
        await refreshQueue(updatedPrefs);
        onSubscriptionChange?.(res.subscription);

        // Enviar notificación de confirmación inmediata desde el Service Worker
        await simulateBackgroundPushReminder({
          delayMs: 0,
          publisherName,
          nextReminder,
        });

        setFeedback({
          type: 'success',
          text: '¡Suscripción Web Push activada! Recibirás recordatorios automáticos en este dispositivo incluso cuando Kongre esté cerrado.',
        });
      } else {
        setFeedback({
          type: 'error',
          text:
            res.error ||
            'No se pudo completar la suscripción. Verifica los permisos del navegador.',
        });
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsUnsubscribing(true);
    setFeedback(null);
    try {
      await unsubscribeFromPushNotifications();
      setSubscription(null);
      setPrefs(getNotificationPreferences());
      onSubscriptionChange?.(null);
      setFeedback({
        type: 'info',
        text: 'Has pausado la suscripción a notificaciones push en este navegador.',
      });
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleUpdatePreference = async (patch: Partial<NotificationPreferences>) => {
    const updated = saveNotificationPreferences(patch);
    setPrefs(updated);
    await refreshQueue(updated);
  };

  const handleInstantTest = async () => {
    setFeedback(null);
    const ok = await simulateBackgroundPushReminder({
      delayMs: 0,
      publisherName,
      nextReminder,
    });
    if (ok) {
      setFeedback({
        type: 'success',
        text: nextReminder
          ? `Se envió una vista previa del recordatorio para: "${nextReminder.assignmentTitle}".`
          : 'Notificación Push enviada correctamente a tu navegador.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: 'No se pudo mostrar la notificación. Asegúrate de permitir las notificaciones en el navegador.',
      });
    }
  };

  const handleDelayedClosedAppTest = async () => {
    setFeedback({
      type: 'info',
      text: 'Minimiza el navegador o bloquea tu pantalla ahora: el Service Worker enviará la notificación en 5 segundos...',
    });
    setCountdownSec(5);
    await simulateBackgroundPushReminder({
      delayMs: 5000,
      publisherName,
      nextReminder,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
                isSubscribed
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-500/20'
              }`}
            >
              {isSubscribed ? <BellRing size={24} /> : <Bell size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                  Web Push • Service Worker
                </span>
                {isSubscribed ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                    <Radio size={10} className="animate-pulse" /> Suscripción Activa (App Cerrada)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                    Sin Suscripción Activa
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                Suscripción a Recordatorios Push Automáticos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Publicador vinculado: <strong className="text-slate-800 dark:text-slate-200">{publisherName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* FEEDBACK BANNER */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : feedback.type === 'error' ? (
                <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{feedback.text}</div>
            </div>
          )}

          {/* 1. TARJETA PRINCIPAL DE SUSCRIPCIÓN DEL NAVEGADOR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Smartphone size={15} className="text-purple-600 dark:text-purple-400" />
                  <span>Dispositivo: {subscription?.deviceLabel || deviceLabel}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Al suscribirte, el <strong>Service Worker de Kongre</strong> guarda tus próximas asignaciones en la memoria segura del navegador y dispara avisos nativos aunque cierres la pestaña o la aplicación.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {!isSubscribed ? (
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={isSubscribing || !isNotificationSupported()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <BellRing size={15} />
                    <span>{isSubscribing ? 'Suscribiendo...' : 'Suscribir este Navegador'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnsubscribe}
                    disabled={isUnsubscribing}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <BellOff size={14} />
                    <span>{isUnsubscribing ? 'Desactivando...' : 'Pausar Suscripción'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Indicadores técnicos del Service Worker */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    permission === 'granted'
                      ? 'bg-emerald-500'
                      : permission === 'denied'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Permiso Navegador</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {permission === 'granted'
                      ? 'Autorizado'
                      : permission === 'denied'
                      ? 'Bloqueado'
                      : 'Sin autorizar'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Motor Segundo Plano</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {subscription?.mode === 'web-push'
                      ? 'Web Push VAPID + SW'
                      : 'Service Worker + IndexedDB'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <Layers size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Cola Programada</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {scheduledReminders.length} recordatorio{scheduledReminders.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CONFIGURACIÓN DE ANTICIPACIÓN Y HORARIO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock size={14} className="text-indigo-500" />
              <span>Preferencias de Recordatorios Automáticos</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Anticipación del recordatorio principal:
                </label>
                <select
                  value={prefs.notifyDaysBefore}
                  onChange={(e) =>
                    handleUpdatePreference({ notifyDaysBefore: parseInt(e.target.value, 10) })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                >
                  <option value={1}>1 día antes de la reunión (24h)</option>
                  <option value={2}>2 días antes de la reunión (48h)</option>
                  <option value={3}>3 días antes de la reunión (72h)</option>
                  <option value={7}>1 semana antes de la reunión (7 días)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hora preferida para recibir el aviso:
                </label>
                <select
                  value={prefs.preferredHour || '09:00'}
                  onChange={(e) => handleUpdatePreference({ preferredHour: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                >
                  <option value="07:00">🌅 07:00 AM (Mañana temprano)</option>
                  <option value="08:00">🌅 08:00 AM (Mañana)</option>
                  <option value="09:00">☀️ 09:00 AM (Media mañana)</option>
                  <option value="12:00">☀️ 12:00 PM (Mediodía)</option>
                  <option value="18:00">🌇 06:00 PM (Tarde / Noche)</option>
                  <option value="20:00">🌙 08:00 PM (Noche)</option>
                </select>
              </div>
            </div>

            {/* Opciones tipo check */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleUpdatePreference({ notifySameDay: !prefs.notifySameDay })}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  prefs.notifySameDay
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Recordatorio el mismo día (3h antes)</div>
                  <div className="text-[10px] opacity-80">Segundo aviso horas antes de iniciar la reunión</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    prefs.notifySameDay
                      ? 'bg-purple-600 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {prefs.notifySameDay && <Check size={12} />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePreference({ notifyDuties: !prefs.notifyDuties })}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  prefs.notifyDuties
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Deberes y Aseo del Salón</div>
                  <div className="text-[10px] opacity-80">Audio, micrófonos, acomodador y limpieza</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    prefs.notifyDuties
                      ? 'bg-purple-600 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {prefs.notifyDuties && <Check size={12} />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePreference({ notifyCarts: !prefs.notifyCarts })}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  prefs.notifyCarts
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Turnos de Carritos</div>
                  <div className="text-[10px] opacity-80">Predicación pública metropolitana y local</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    prefs.notifyCarts
                      ? 'bg-purple-600 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {prefs.notifyCarts && <Check size={12} />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePreference({ soundEnabled: !prefs.soundEnabled })}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  prefs.soundEnabled
                    ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {prefs.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  <div>
                    <div className="text-xs font-bold">Sonido y Vibración</div>
                    <div className="text-[10px] opacity-80">Alerta sonora al recibir el push</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    prefs.soundEnabled
                      ? 'bg-purple-600 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {prefs.soundEnabled && <Check size={12} />}
                </div>
              </button>
            </div>
          </div>

          {/* 3. SIMULADOR DE PRUEBA EN SEGUNDO PLANO (CON APP CERRADA / MINIMIZADA) */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Verificar Funcionamiento en Segundo Plano
              </h4>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80">
                Usa <strong>"Probar con App Cerrada (5s)"</strong>, minimiza el navegador o bloquea tu teléfono y recibe el aviso real de tu próxima asignación.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleInstantTest}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Send size={13} />
                <span>Probar al Instante</span>
              </button>

              <button
                type="button"
                onClick={handleDelayedClosedAppTest}
                disabled={countdownSec !== null}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs disabled:opacity-60"
              >
                <Sparkles size={13} />
                <span>
                  {countdownSec !== null
                    ? `Disparando en ${countdownSec}s...`
                    : 'Probar con App Cerrada (5s)'}
                </span>
              </button>
            </div>
          </div>

          {/* 4. COLA DE RECORDATORIOS PROGRAMADOS EN EL SERVICE WORKER */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-500" />
                <span>Cola de Recordatorios en Segundo Plano ({scheduledReminders.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => refreshQueue()}
                disabled={isSyncing}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>Sincronizar cola</span>
              </button>
            </div>

            {scheduledReminders.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No hay asignaciones futuras pendientes en las próximas semanas
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  En cuanto se te programe una parte, discurso, deber o turno de carrito, se agendará aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {scheduledReminders.slice(0, 12).map((rem) => {
                  const triggerDate = new Date(rem.triggerTimestamp);
                  const triggerFormatted = triggerDate.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={rem.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              rem.isSameDayReminder
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                : 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300'
                            }`}
                          >
                            {rem.isSameDayReminder
                              ? 'Aviso Mismo Día'
                              : `Aviso ${prefs.notifyDaysBefore}d antes`}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {rem.assignmentTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {rem.meetingName} • Reunión: {rem.meetingDate} ({rem.meetingTime})
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Disparo Push
                        </div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {triggerFormatted}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Funciona mediante Web Push API y Service Worker local sin exponer datos personales.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
