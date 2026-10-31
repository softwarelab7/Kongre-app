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
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
          : 'bg-gradient-to-br from-violet-50/90 via-indigo-50/60 to-purple-50/80 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-zinc-900 border-violet-300/80 dark:border-violet-700/60 shadow-xs'
      } ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} space-y-3.5`}
    >
      {/* CABECERA PRINCIPAL Y BOTÓN DE ACCIÓN */}
      <div className={`flex flex-col ${compact ? '' : 'xl:flex-row xl:items-center'} justify-between gap-3.5`}>
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isSubscribed
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
            }`}
          >
            {isSubscribed ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5 animate-bounce" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  isSubscribed
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-700/60'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    <span>Suscripción Push Activa</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Suscripción Pendiente en este Dispositivo</span>
                  </>
                )}
              </span>

              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#A1A1AA] truncate">
                {subscription?.deviceLabel || deviceLabel}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-1">
              {isSubscribed
                ? `Notificaciones Push activadas para ${publisherName}`
                : '¿Aún no recibes alertas Push en tu móvil o computadora?'}
            </h4>

            <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] mt-0.5 leading-relaxed">
              {isSubscribed
                ? `El Service Worker de Kongre mantiene ${
                    subscription?.scheduledCount || 0
                  } recordatorio(s) programado(s) en segundo plano y te avisará incluso con la aplicación cerrada.`
                : 'Activa en un solo toque el servicio de Notificaciones Web Push para recibir avisos automáticos de tus partes, discursos, lecturas, aseo y carritos sin necesidad de tener la aplicación abierta.'}
            </p>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto">
          {!isSubscribed ? (
            <button
              type="button"
              onClick={handleQuickSubscribe}
              disabled={isSubscribing || !isNotificationSupported()}
              className={`${compact ? 'flex-1 sm:flex-initial' : 'w-full sm:w-auto'} px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50`}
            >
              <BellRing className="w-4 h-4 shrink-0" />
              <span>
                {isSubscribing
                  ? 'Activando Suscripción Push...'
                  : 'Suscribirme a Notificaciones Push'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendQuickTest}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Enviando...' : 'Probar Push Ahora'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowVisualGuide((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] border border-zinc-200/90 dark:border-[#27272A] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>{showVisualGuide ? 'Ocultar Guía' : 'Guía Visual'}</span>
            {showVisualGuide ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {onOpenPushModal && (
            <button
              type="button"
              onClick={onOpenPushModal}
              className="px-3 py-2 rounded-xl bg-violet-100/80 hover:bg-violet-200/70 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-800 dark:text-violet-200 border border-violet-200/80 dark:border-violet-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Abrir panel completo de cola en segundo plano y simulador con app cerrada"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cola y Ajustes Push</span>
            </button>
          )}
        </div>
      </div>

      {/* MENSAJE DE RETROALIMENTACIÓN */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-100/80 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-100/80 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-indigo-100/80 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
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

      {/* PASO A PASO VISUAL EN TIEMPO REAL (Visible siempre si no está suscrito, o al abrir Guía Visual) */}
      {(!isSubscribed || showVisualGuide) && (
        <div className="pt-2 border-t border-violet-200/60 dark:border-[#27272A] space-y-3 animate-in fade-in duration-200">
          {/* 3 PASOS DE ACTIVACIÓN */}
          <div className={`grid grid-cols-1 ${compact ? 'xl:grid-cols-3' : 'sm:grid-cols-3'} gap-2.5`}>
            {/* Paso 1 */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                step1Done
                  ? 'bg-white/90 dark:bg-[#121216]/80 border-emerald-300/80 dark:border-emerald-800/60'
                  : 'bg-white/70 dark:bg-[#121216]/50 border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                  step1Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                }`}
              >
                {step1Done ? '✓' : '1'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  1. Vincula tu Nombre
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] leading-snug mt-0.5">
                  Publicador activo:{' '}
                  <strong className="text-zinc-800 dark:text-[#E4E4E7]">
                    {publisherName || 'Seleccionar'}
                  </strong>
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                step2Done
                  ? 'bg-white/90 dark:bg-[#121216]/80 border-emerald-300/80 dark:border-emerald-800/60'
                  : permission === 'denied'
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                  : 'bg-white/70 dark:bg-[#121216]/50 border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                  step2Done
                    ? 'bg-emerald-600 text-white'
                    : permission === 'denied'
                    ? 'bg-rose-600 text-white'
                    : 'bg-violet-600 text-white'
                }`}
              >
                {step2Done ? '✓' : '2'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  2. Permiso del Dispositivo
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] leading-snug mt-0.5">
                  {step2Done
                    ? 'Permiso concedido correctamente.'
                    : permission === 'denied'
                    ? 'Bloqueado: pulsa el candado de la barra de dirección y elige "Permitir".'
                    : 'Pulsa "Suscribirme" y acepta el aviso del navegador.'}
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                step3Done
                  ? 'bg-white/90 dark:bg-[#121216]/80 border-emerald-300/80 dark:border-emerald-800/60'
                  : 'bg-white/70 dark:bg-[#121216]/50 border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                  step3Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                }`}
              >
                {step3Done ? '✓' : '3'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  3. Cola en Segundo Plano
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] leading-snug mt-0.5">
                  {step3Done
                    ? `Service Worker activo (${subscription?.scheduledCount || 0} recordatorios).`
                    : 'Sincroniza tus asignaciones para avisarte con la app cerrada.'}
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
