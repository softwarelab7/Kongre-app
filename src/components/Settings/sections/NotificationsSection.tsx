// src/components/Settings/sections/NotificationsSection.tsx
import React from 'react';
import {
  BellRing,
  CheckCircle2,
  X,
  User,
  Calendar,
  Clock,
  Save,
} from 'lucide-react';
import { PushNotificationQuickGuideCard } from '../../PushNotificationQuickGuideCard';
import { SplashCheckbox } from '../../SplashCheckbox';
import {
  NotificationPreferences,
  getNotificationPreferences,
  getNotificationPermission,
} from '../../../services/notificationService';

export interface NotificationsSectionProps {
  notifPermission: NotificationPermission;
  notifFeedbackMsg: {
    type: 'success' | 'info' | 'error';
    text: string;
  } | null;
  setNotifFeedbackMsg: (
    msg: { type: 'success' | 'info' | 'error'; text: string } | null
  ) => void;
  notifPrefs: NotificationPreferences;
  handleUpdateNotifPrefs: (
    partial: Partial<NotificationPreferences>,
    feedbackText?: string
  ) => Promise<void>;
  activeNotifPublisher: any;
  selectedNotifPubId: string;
  setSelectedNotifPubId: (id: string) => void;
  publishers: any[];
  settings: any;
  weeks: any[];
  cartShifts: any[];
  cartLocations: any[];
  publishersMap: any;
  onOpenPushModal: () => void;
  setPushSubRecord: (sub: any) => void;
  setNotifPermission: (perm: any) => void;
  setNotifPrefs: (prefs: any) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  notifPermission,
  notifFeedbackMsg,
  setNotifFeedbackMsg,
  notifPrefs,
  handleUpdateNotifPrefs,
  activeNotifPublisher,
  selectedNotifPubId,
  setSelectedNotifPubId,
  publishers,
  settings,
  weeks,
  cartShifts,
  cartLocations,
  publishersMap,
  onOpenPushModal,
  setPushSubRecord,
  setNotifPermission,
  setNotifPrefs,
}) => {
  return (
    <div className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 p-6 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-6">
      <div className="pb-4 border-b border-zinc-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="kg-glow-badge w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Preferencias de Notificación de Asignaciones
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Personaliza con cuántos días de anticipación deseas recibir los recordatorios automáticos en este dispositivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {notifPermission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Permiso del Navegador Activo</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
              <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Usa la guía inferior para suscribirte</span>
            </span>
          )}
        </div>
      </div>

      {notifFeedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
            notifFeedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : notifFeedbackMsg.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300'
              : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notifFeedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotifFeedbackMsg(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guía Visual Interactiva y Botón de Suscripción a Notificaciones Push */}
      <PushNotificationQuickGuideCard
        publisherId={activeNotifPublisher?.id || selectedNotifPubId || 'pub-local'}
        publisherName={
          activeNotifPublisher?.name ||
          (typeof window !== 'undefined' ? localStorage.getItem('kongre_my_publisher_name') : '') ||
          'Publicador'
        }
        congregationName={settings.congregationName}
        weeks={weeks}
        cartShifts={cartShifts}
        cartLocations={cartLocations}
        settings={settings}
        publishersMap={publishersMap}
        onOpenPushModal={onOpenPushModal}
        onSubscribedChange={(sub: any) => {
          setPushSubRecord(sub);
          setNotifPermission(getNotificationPermission());
          setNotifPrefs(getNotificationPreferences());
        }}
      />

      {/* Interruptor General + Selección de Publicador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] block mb-0.5">
              Recordatorios Automáticos de Asignaciones
            </span>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Recibe avisos automáticos antes de tus discursos, partes estudiantiles, lecturas, oraciones, deberes o turnos de predicación.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={notifPrefs.enabled}
              onChange={(e) =>
                handleUpdateNotifPrefs(
                  { enabled: e.target.checked },
                  e.target.checked
                    ? 'Recordatorios automáticos activados.'
                    : 'Recordatorios automáticos desactivados.'
                )
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-[#27272A] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 dark:after:border-[#27272A] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
          </label>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
          <label className="block text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Publicador asociado para los recordatorios:</span>
          </label>
          <select
            value={activeNotifPublisher?.id || ''}
            onChange={(e) => {
              const pubId = e.target.value;
              setSelectedNotifPubId(pubId);
              const pubObj = publishers.find((p) => p.id === pubId);
              if (typeof window !== 'undefined' && pubObj) {
                localStorage.setItem('kongre_my_publisher_id', pubObj.id);
                localStorage.setItem('kongre_my_publisher_name', pubObj.name);
              }
              handleUpdateNotifPrefs(
                {},
                pubObj
                  ? `Recordatorios sincronizados para ${pubObj.name}.`
                  : undefined
              );
            }}
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] text-xs font-semibold focus:outline-hidden"
          >
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Días de anticipación (1, 2, 3, 5 o 7 días antes) */}
      <div className="p-5 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Días de Anticipación del Recordatorio Automático</span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Elige cuántos días antes de la fecha de tu asignación quieres que el sistema envíe el recordatorio.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-violet-600 text-white text-xs font-bold font-mono tabular-nums self-start sm:self-auto">
            Seleccionado:{' '}
            {notifPrefs.notifyDaysBefore === 1
              ? '1 día antes'
              : `${notifPrefs.notifyDaysBefore} días antes`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              days: 1,
              title: '1 día antes',
              subtitle: '24 horas antes',
              desc: 'Ideal para repasar la noche o mañana previa a la reunión.',
            },
            {
              days: 2,
              title: '2 días antes',
              subtitle: '48 horas antes',
              desc: 'Aviso intermedio para coordinar con tu ayudante.',
            },
            {
              days: 3,
              title: '3 días antes',
              subtitle: '72 horas antes (Recomendado)',
              desc: 'Tiempo óptimo para preparar partes estudiantiles y discursos.',
            },
            {
              days: 5,
              title: '5 días antes',
              subtitle: 'Inicio de semana',
              desc: 'Para organizar tu semana teocrática con antelación.',
            },
            {
              days: 7,
              title: '7 días antes',
              subtitle: '1 semana antes',
              desc: 'Máxima anticipación para discursos públicos y conducciones.',
            },
          ].map((option) => {
            const isSelected = notifPrefs.notifyDaysBefore === option.days;
            return (
              <button
                key={option.days}
                type="button"
                onClick={() =>
                  handleUpdateNotifPrefs(
                    { notifyDaysBefore: option.days, enabled: true },
                    `Preferencia guardada: recibirás el recordatorio ${option.title} a las ${notifPrefs.preferredHour}.`
                  )
                }
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md ring-2 ring-violet-500/30'
                    : 'bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] border-zinc-200 dark:border-[#27272A] hover:border-violet-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-extrabold font-mono tabular-nums">{option.title}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                  </div>
                  <span
                    className={`text-[11px] font-bold block mb-1.5 ${
                      isSelected ? 'text-violet-100' : 'text-violet-600 dark:text-violet-400'
                    }`}
                  >
                    {option.subtitle}
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-snug ${
                    isSelected ? 'text-violet-100/90' : 'text-zinc-500 dark:text-[#A1A1AA]'
                  }`}
                >
                  {option.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Hora preferida y recordatorio del mismo día */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
            <label className="block text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Hora preferida para recibir el aviso anticipado:</span>
            </label>
            <select
              value={notifPrefs.preferredHour || '09:00'}
              onChange={(e) =>
                handleUpdateNotifPrefs(
                  { preferredHour: e.target.value },
                  `Hora del recordatorio actualizada a las ${e.target.value}.`
                )
              }
              className="w-full p-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums text-xs font-bold mt-1 focus:outline-hidden"
            >
              <option value="07:00">07:00 AM (Mañana temprano)</option>
              <option value="08:00">08:00 AM (Mañana)</option>
              <option value="09:00">09:00 AM (Recomendado)</option>
              <option value="12:00">12:00 PM (Mediodía)</option>
              <option value="18:00">06:00 PM (Tarde)</option>
              <option value="20:00">08:00 PM (Noche)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] block">
                Recordatorio adicional el mismo día de la reunión
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                Envía una segunda notificación 3 horas antes de que comience tu reunión o turno.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifPrefs.notifySameDay}
              onChange={(e) =>
                handleUpdateNotifPrefs(
                  { notifySameDay: e.target.checked },
                  e.target.checked
                    ? 'Recordatorio del mismo día activado.'
                    : 'Recordatorio del mismo día desactivado.'
                )
              }
              className="w-5 h-5 accent-violet-600 rounded cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Categorías de asignaciones incluidas */}
      <div className="space-y-3 text-xs">
        <h4 className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] uppercase tracking-wider">
          Tipos de Asignaciones a Notificar
        </h4>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
          <SplashCheckbox
            checked={notifPrefs.notifyDuties}
            onChange={(e: any) =>
              handleUpdateNotifPrefs(
                { notifyDuties: e.target.checked },
                e.target.checked
                  ? 'Notificaciones de Deberes y Aseo incluidas.'
                  : 'Notificaciones de Deberes y Aseo desactivadas.'
              )
            }
            label="Incluir Deberes del Salón (Acomodadores, Micrófonos, Audio/Video) y Aseo"
            description="Recibe recordatorios cuando tu grupo tenga limpieza del Salón del Reino o tengas turno técnico."
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
          <SplashCheckbox
            checked={notifPrefs.notifyCarts}
            onChange={(e: any) =>
              handleUpdateNotifPrefs(
                { notifyCarts: e.target.checked },
                e.target.checked
                  ? 'Notificaciones de Predicación Pública (Carritos) incluidas.'
                  : 'Notificaciones de Carritos desactivadas.'
              )
            }
            label="Incluir Turnos de Predicación Pública (Carritos / Exhibidores)"
            description="Te avisa con los días de anticipación configurados sobre tus turnos confirmados en puntos de predicación pública."
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
          <SplashCheckbox
            checked={notifPrefs.soundEnabled}
            onChange={(e: any) =>
              handleUpdateNotifPrefs(
                { soundEnabled: e.target.checked },
                e.target.checked
                  ? 'Sonido y vibración activados en las notificaciones.'
                  : 'Modo silencioso activado para las notificaciones.'
              )
            }
            label="Reproducir sonido y vibración al mostrar el recordatorio"
            description="Permite que el sistema operativo emita alerta sonora cuando llegue la notificación push."
          />
        </div>
      </div>

      {/* Pie de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-[#27272A]">
        <button
          type="button"
          onClick={() =>
            handleUpdateNotifPrefs(
              {},
              `¡Preferencias guardadas! Recibirás recordatorios ${
                notifPrefs.notifyDaysBefore === 1
                  ? '1 día antes'
                  : `${notifPrefs.notifyDaysBefore} días antes`
              } a las ${notifPrefs.preferredHour}.`
            )
          }
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Preferencias de Notificación</span>
        </button>
      </div>
    </div>
  );
};
