// src/components/PushNotificationQuickGuideCard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  Bell,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  ShieldCheck,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Radio,
  HelpCircle,
  Sliders,
  Lock,
  Share,
  PlusSquare,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  getNotificationPreferences,
  getPushSubscriptionRecord,
  subscribeToPushNotifications,
  simulateBackgroundPushReminder,
  getCurrentDeviceLabel,
  PushSubscriptionRecord,
  NotificationPreferences,
} from '../services/notificationService';
import { WeekSchedule, CartShift, CartLocation, CongregationSettings } from '../types';

interface PushNotificationQuickGuideCardProps {
  publisherId: string;
  publisherName: string;
  congregationName?: string;
  weeks: WeekSchedule[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  settings?: CongregationSettings;
  publishersMap?: Map<string, any>;
  onOpenPushModal?: () => void;
  onSubscribedChange?: (sub: PushSubscriptionRecord | null) => void;
  compact?: boolean;
}

export const PushNotificationQuickGuideCard: React.FC<PushNotificationQuickGuideCardProps> = ({
  publisherId,
  publisherName,
  congregationName,
  weeks,
  cartShifts,
  cartLocations,
  settings,
  publishersMap,
  onOpenPushModal,
  onSubscribedChange,
  compact = false,
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
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  });
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const deviceLabel = useMemo(() => getCurrentDeviceLabel(), []);

  useEffect(() => {
    const syncState = () => {
      setPermission(getNotificationPermission());
      setPrefs(getNotificationPreferences());
      setSubscription(getPushSubscriptionRecord());
    };
    window.addEventListener('kongre_push_subscription_changed', syncState);
    window.addEventListener('storage', syncState);
    return () => {
      window.removeEventListener('kongre_push_subscription_changed', syncState);
      window.removeEventListener('storage', syncState);
    };
  }, []);

  const isSubscribed = Boolean(
    subscription && subscription.active && prefs.enabled
  );

  const handleQuickSubscribe = async () => {
    setIsSubscribing(true);
    setFeedback(null);
    try {
      const res = await subscribeToPushNotifications({
        publisherId: publisherId || 'pub-local',
        publisherName: publisherName || 'Hermano',
        congregationName: congregationName || settings?.congregationName,
        weeks,
        cartShifts,
        cartLocations,
        settings,
        publishersMap,
      });

      setPermission(res.permission);
      if (res.success && res.subscription) {
        setSubscription(res.subscription);
        setPrefs(getNotificationPreferences());
        onSubscribedChange?.(res.subscription);

        await simulateBackgroundPushReminder({
          delayMs: 0,
          publisherName: publisherName || 'Hermano',
        });

        setFeedback({
          type: 'success',
          text: `¡Listo, ${publisherName || 'hermano'}! Este dispositivo quedó suscrito a las notificaciones Push en segundo plano (${res.subscription.scheduledCount || 0} recordatorios sincronizados).`,
        });
      } else {
        setShowVisualGuide(true);
        setFeedback({
          type: 'error',
          text:
            res.error ||
            'No se pudo completar la suscripción automáticamente. Sigue los pasos de la guía visual inferior.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Error al suscribirse a las notificaciones Push.',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendQuickTest = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const ok = await simulateBackgroundPushReminder({
        delayMs: 0,
        publisherName: publisherName || 'Hermano',
      });
      setFeedback({
        type: ok ? 'success' : 'info',
        text: ok
          ? '¡Notificación Push de prueba enviada! Revisa la bandeja de alertas de tu dispositivo.'
          : 'Recordatorio verificado en la cola local del Service Worker.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const step1Done = Boolean(publisherName);
  const step2Done = permission === 'granted' || isSubscribed;
  const step3Done = isSubscribed;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isSubscribed
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
          : 'bg-zinc-50/70 dark:bg-[#18181F]/60 border-zinc-200/80 dark:border-[#27272A]'
      } p-3.5 sm:p-4 space-y-3`}
    >
      {/* CABECERA PRINCIPAL Y BOTÓN DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSubscribed
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {isSubscribed ? (
              <BellRing className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {isSubscribed
                  ? 'Alertas Push activadas'
                  : 'Alertas Push en este dispositivo'}
              </h4>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isSubscribed
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSubscribed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{isSubscribed ? 'Activo' : 'Pendiente'}</span>
              </span>

              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                {publisherName ? `${publisherName} · ` : ''}{subscription?.deviceLabel || deviceLabel}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed truncate">
              {isSubscribed
                ? `${subscription?.scheduledCount || 0} recordatorio(s) en segundo plano. Te avisará con la app cerrada.`
                : 'Recibe avisos automáticos de tus partes, lecturas y carritos con la app cerrada.'}
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSubscribed ? (
            <button
              type="button"
              onClick={handleQuickSubscribe}
              disabled={isSubscribing || !isNotificationSupported()}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition disabled:opacity-50"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isSubscribing ? 'Activando...' : 'Activar Push'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendQuickTest}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Enviando...' : 'Probar Alerta'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowVisualGuide((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            title="Ver guía o pasos para activar notificaciones"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showVisualGuide ? 'Ocultar guía' : 'Guía'}</span>
            {showVisualGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onOpenPushModal && (
            <button
              type="button"
              onClick={onOpenPushModal}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Cola y Ajustes Push"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* MENSAJE DE RETROALIMENTACIÓN */}
      {feedback && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* GUÍA PASO A PASO (Solo visible al desplegar 'Guía') */}
      {showVisualGuide && (
        <div className="pt-2 border-t border-zinc-200/80 dark:border-[#27272A] space-y-3 animate-in fade-in duration-200">
          {/* 3 PASOS DE ACTIVACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Paso 1 */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                step1Done
                  ? 'bg-white/80 dark:bg-[#121216]/60 border-emerald-300/80 dark:border-emerald-800/60'
                  : 'bg-white/50 dark:bg-[#121216]/40 border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  step1Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {step1Done ? '✓' : '1'}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                  1. Nombre
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {publisherName || 'Sin asignar'}
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                step2Done
                  ? 'bg-white/80 dark:bg-[#121216]/60 border-emerald-300/80 dark:border-emerald-800/60'
                  : permission === 'denied'
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                  : 'bg-white/50 dark:bg-[#121216]/40 border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  step2Done
                    ? 'bg-emerald-600 text-white'
                    : permission === 'denied'
                    ? 'bg-rose-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {step2Done ? '✓' : '2'}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                  2. Permiso
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {step2Done ? 'Permiso concedido' : 'Pulsa "Activar Push"'}
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                step3Done
                  ? 'bg-white/80 dark:bg-[#121216]/60 border-emerald-300/80 dark:border-emerald-800/60'
                  : 'bg-white/50 dark:bg-[#121216]/40 border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  step3Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {step3Done ? '✓' : '3'}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                  3. Segundo Plano
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {step3Done ? `${subscription?.scheduledCount || 0} en cola` : 'Sincronización'}
                </p>
              </div>
            </div>
          </div>

          {/* GUÍA VISUAL DETALLADA POR PLATAFORMA (ANDROID / IPHONE / PC) */}
          {showVisualGuide && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>Guía Visual según tu Dispositivo:</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'android' as const, label: 'Android / Chrome', icon: Smartphone },
                    { id: 'ios' as const, label: 'iPhone / iPad (iOS)', icon: Share },
                    { id: 'desktop' as const, label: 'Computadora', icon: Laptop },
                  ].map((plat) => {
                    const PlatIcon = plat.icon;
                    const active = selectedPlatform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setSelectedPlatform(plat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          active
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200'
                        }`}
                      >
                        <PlatIcon className="w-3 h-3" />
                        <span>{plat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPlatform === 'android' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5">
                      Paso A • Toca Suscribirme
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Pulsa el botón morado <strong>&quot;Suscribirme a Notificaciones Push&quot;</strong> de esta tarjeta.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5">
                      Paso B • Confirma en Chrome
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Cuando aparezca el cuadro del navegador, toca <strong>&quot;Permitir&quot;</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5">
                      Paso C • Instala la App (Opcional)
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Para máxima fiabilidad en Android, instala Kongre en tu pantalla de inicio desde el menú del navegador.
                    </p>
                  </div>
                </div>
              )}

              {selectedPlatform === 'ios' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5 flex items-center gap-1">
                      <Share className="w-3.5 h-3.5" />
                      <span>Paso A • Botón Compartir</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      En Safari (iOS 16.4+), toca el icono <strong>Compartir</strong> en la barra inferior.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5 flex items-center gap-1">
                      <PlusSquare className="w-3.5 h-3.5" />
                      <span>Paso B • Pantalla de Inicio</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Selecciona <strong>&quot;Agregar a la pantalla de inicio&quot;</strong> y abre Kongre desde el nuevo icono.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5 flex items-center gap-1">
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Paso C • Activa el Push</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Vuelve aquí en Ajustes y pulsa <strong>&quot;Suscribirme a Notificaciones Push&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}

              {selectedPlatform === 'desktop' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5">
                      Paso A • Haz clic en Suscribirme
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Haz clic en <strong>&quot;Suscribirme a Notificaciones Push&quot;</strong> arriba a la derecha.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Paso B • Si estaba bloqueado</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Haz clic en el icono de ajustes/candado junto a la barra de direcciones URL y cambia Notificaciones a <strong>&quot;Permitir&quot;</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/70 dark:border-[#27272A]/70">
                    <div className="font-bold text-violet-700 dark:text-violet-300 mb-0.5">
                      Paso C • Prueba en 5 segundos
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                      Usa <strong>&quot;Cola y Ajustes Push&quot;</strong> para probar una alerta real con la ventana minimizada.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
