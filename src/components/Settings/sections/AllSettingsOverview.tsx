// src/components/Settings/sections/AllSettingsOverview.tsx
import React from 'react';
import {
  BellRing,
  BellOff,
  Sliders,
  CheckCircle2,
  X,
  Check,
  Clock,
  Calendar,
  ChevronRight,
  ShieldAlert,
  QrCode,
  Lock,
  Cloud,
  Database,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { SettingsCategoryTab } from '../types';
import { PushNotificationQuickGuideCard } from '../../PushNotificationQuickGuideCard';
import {
  NotificationPreferences,
  PushSubscriptionRecord,
  getNotificationPreferences,
  getNotificationPermission,
} from '../../../services/notificationService';
import { CURRENT_APP_VERSION, CURRENT_APP_STAGE, BUILD_DATE } from '../../../utils/versionLog';

export interface AllSettingsOverviewProps {
  setActiveTab: (tab: SettingsCategoryTab) => void;
  onOpenVersionModal?: () => void;
  notifPrefs: NotificationPreferences;
  handleUpdateNotifPrefs: (
    partial: Partial<NotificationPreferences>,
    feedbackText?: string
  ) => Promise<void>;
  notifFeedbackMsg: {
    type: 'success' | 'info' | 'error';
    text: string;
  } | null;
  setNotifFeedbackMsg: (
    msg: { type: 'success' | 'info' | 'error'; text: string } | null
  ) => void;
  activeNotifPublisher: any;
  selectedNotifPubId: string;
  pushSubRecord: PushSubscriptionRecord | null;
  settings: any;
  weeks: any[];
  cartShifts: any[];
  cartLocations: any[];
  publishersMap: any;
  setIsPushModalOpen: (open: boolean) => void;
  setPushSubRecord: (sub: any) => void;
  setNotifPermission: (p: any) => void;
  setNotifPrefs: (prefs: any) => void;
  congName: string;
  midDay: string;
  midTime: string;
  fdsDay: string;
  fdsTime: string;
  allowPartAndDuty: boolean;
  maxConsecutiveDuty: number;
  maxConsecutivePart: number;
  invitations: any[];
  isPinEnabled: boolean;
  autoLockMinutes: number;
  privacyModeEnabled: boolean;
  user: any;
}

export const AllSettingsOverview: React.FC<AllSettingsOverviewProps> = ({
  setActiveTab,
  onOpenVersionModal,
  notifPrefs,
  handleUpdateNotifPrefs,
  notifFeedbackMsg,
  setNotifFeedbackMsg,
  activeNotifPublisher,
  selectedNotifPubId,
  pushSubRecord,
  settings,
  weeks,
  cartShifts,
  cartLocations,
  publishersMap,
  setIsPushModalOpen,
  setPushSubRecord,
  setNotifPermission,
  setNotifPrefs,
  congName,
  midDay,
  midTime,
  fdsDay,
  fdsTime,
  allowPartAndDuty,
  maxConsecutiveDuty,
  maxConsecutivePart,
  invitations,
  isPinEnabled,
  autoLockMinutes,
  privacyModeEnabled,
  user,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* SECCIÓN DESTACADA: PREFERENCIAS DE NOTIFICACIÓN DE ASIGNACIONES */}
      <div className="bg-white dark:bg-[#121216] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-zinc-200/80 dark:border-[#27272A] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <BellRing size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Preferencias de Notificación
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    notifPrefs.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${notifPrefs.enabled ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                  {notifPrefs.enabled
                    ? `Activo · ${notifPrefs.notifyDaysBefore === 1 ? '1 día antes' : `${notifPrefs.notifyDaysBefore} días antes`}`
                    : 'Pausado'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Recordatorios automáticos de tus partes, asignaciones y privilegios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleUpdateNotifPrefs(
                  { enabled: !notifPrefs.enabled },
                  !notifPrefs.enabled
                    ? 'Recordatorios automáticos activados.'
                    : 'Recordatorios automáticos pausados.'
                )
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                notifPrefs.enabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {notifPrefs.enabled ? <BellRing size={13} /> : <BellOff size={13} />}
              <span>{notifPrefs.enabled ? 'Activado' : 'Pausado'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notificaciones')}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-200/80 dark:border-[#27272A]"
            >
              <Sliders size={13} />
              <span>Ajustes</span>
            </button>
          </div>
        </div>

        {notifFeedbackMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
              notifFeedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : notifFeedbackMsg.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notifFeedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotifFeedbackMsg(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Guía Visual Interactiva y Botón de Suscripción Push Rápida */}
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
          onOpenPushModal={() => setIsPushModalOpen(true)}
          onSubscribedChange={(sub: any) => {
            setPushSubRecord(sub);
            setNotifPermission(getNotificationPermission());
            setNotifPrefs(getNotificationPreferences());
          }}
          compact
        />

        {/* Selector principal de días de anticipación (1, 2, 3, 5 o 7 días antes) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 space-y-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              ¿Cuántos días antes deseas recibir el recordatorio automático?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { days: 1, label: '1 día antes', sub: '24 horas' },
                { days: 2, label: '2 días antes', sub: '48 horas' },
                { days: 3, label: '3 días antes', sub: '72 horas' },
                { days: 5, label: '5 días antes', sub: 'Preparación' },
                { days: 7, label: '7 días antes', sub: '1 semana' },
              ].map((opt) => {
                const isSelected = notifPrefs.notifyDaysBefore === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() =>
                      handleUpdateNotifPrefs(
                        { notifyDaysBefore: opt.days, enabled: true },
                        `Recordatorio automático configurado para ${opt.label} (${opt.sub}) a las ${notifPrefs.preferredHour}.`
                      )
                    }
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm ring-2 ring-violet-500/30'
                        : 'bg-zinc-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-200 border-zinc-200/80 dark:border-white/[0.08] hover:border-violet-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold">{opt.label}</span>
                      {isSelected && <Check size={13} className="text-white shrink-0" />}
                    </div>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-violet-100' : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06]">
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-violet-600 dark:text-violet-400" />
                <span>Hora del Recordatorio</span>
              </label>
              <select
                value={notifPrefs.preferredHour || '09:00'}
                onChange={(e) =>
                  handleUpdateNotifPrefs(
                    { preferredHour: e.target.value },
                    `Hora preferida actualizada a las ${e.target.value}.`
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] text-xs font-bold font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              >
                <option value="07:00">07:00 AM (Mañana temprano)</option>
                <option value="08:00">08:00 AM (Mañana)</option>
                <option value="09:00">09:00 AM (Recomendado)</option>
                <option value="12:00">12:00 PM (Mediodía)</option>
                <option value="18:00">06:00 PM (Tarde)</option>
                <option value="20:00">08:00 PM (Noche)</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/70 dark:border-white/[0.06] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                  Aviso el mismo día
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs.notifySameDay}
                  onChange={(e) =>
                    handleUpdateNotifPrefs(
                      { notifySameDay: e.target.checked },
                      e.target.checked
                        ? 'Recordatorio adicional el mismo día (3h antes) activado.'
                        : 'Recordatorio del mismo día desactivado.'
                    )
                  }
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                Envía una alerta extra 3 horas antes de iniciar la reunión.
              </span>
            </div>
          </div>
        </div>

        {/* Barra inferior de estado y prueba rápida */}
        <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1 rounded-xl border border-violet-200/60 dark:border-violet-800/40">
              <Calendar size={13} />
              <span>
                Anticipación actual:{' '}
                <strong>
                  {notifPrefs.notifyDaysBefore === 1
                    ? '1 día antes'
                    : `${notifPrefs.notifyDaysBefore} días antes`}
                </strong>{' '}
                a las <strong>{notifPrefs.preferredHour}</strong>
              </span>
            </span>
            {pushSubRecord?.active && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={13} />
                <span>
                  Push en segundo plano activo ({pushSubRecord.scheduledCount || 0} en cola)
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('notificaciones')}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Sliders size={13} className="text-zinc-400 dark:text-[#71717A]" />
              <span>Ver Opciones Avanzadas de Notificación</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Tarjeta 1: Información y Horarios */}
        <div
          onClick={() => setActiveTab('general')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <Calendar size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                {midDay} y {fdsDay}
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Información y Horarios
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Nombre oficial de la congregación, dirección física del Salón del Reino y horarios de reuniones semanales.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Congregación:</span>
                <span className="font-semibold truncate max-w-[170px] text-zinc-900 dark:text-[#F4F4F5]">
                  {congName || 'Sin asignar'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Horarios:</span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  {midDay} {midTime} • {fdsDay} {fdsTime}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Abrir ajustes de horarios</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 2: Reglas y Conflictos */}
        <div
          onClick={() => setActiveTab('reglas')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <ShieldAlert size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                Motor Anticolisión
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Reglas de Cruces y Conflictos
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Detección inteligente de asignaciones simultáneas, rotación de hermanos y prevención de bosquejos repetidos.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Parte y Deber:</span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  {!allowPartAndDuty ? 'Bloqueado (Recomendado)' : 'Permitido'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Rotación máxima:</span>
                <span className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {maxConsecutiveDuty} sem. deberes • {maxConsecutivePart} sem. partes
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Abrir reglas de asignación</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 3: Invitaciones y Acceso QR */}
        <div
          onClick={() => setActiveTab('invitaciones')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <QrCode size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A] font-mono tabular-nums">
                {invitations.filter((i) => i.status === 'active').length} vigentes
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Registro Teocrático e Invitaciones
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Códigos cerrados y códigos QR de un solo toque para vincular ancianos, siervos y publicadores con seguridad E2EE.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">ID Congregación:</span>
                <span className="font-semibold font-mono tabular-nums text-xs text-zinc-900 dark:text-[#F4F4F5]">
                  {settings.congregationNumber || settings.congregationId || 'Configurado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Seguridad:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Zero-Knowledge E2EE
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Gestionar invitaciones y QR</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 4: Seguridad y Bloqueo */}
        <div
          onClick={() => setActiveTab('seguridad')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <Lock size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                {isPinEnabled ? 'PIN Activo' : 'Sin PIN'}
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Seguridad y Bloqueo de Sesión
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Protección con PIN numérico para el Salón del Reino, bloqueo por inactividad y modo privacidad RGPD/PII.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Auto-Bloqueo:</span>
                <span className="font-semibold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {autoLockMinutes > 0 ? `${autoLockMinutes} min inactividad` : 'Manual'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Modo Privacidad:</span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  {privacyModeEnabled ? 'Activado (Protegido)' : 'Desactivado'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Configurar seguridad y PIN</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 5: Nube y Sincronización */}
        <div
          onClick={() => setActiveTab('nube')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <Cloud size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                {user ? 'Google Conectado' : 'Nube por ID'}
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Respaldo en la Nube
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Sincronización multi-dispositivo y respaldo en Google Firestore para todos los hermanos autorizados.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Cuenta:</span>
                <span className="font-semibold truncate max-w-[170px] text-zinc-900 dark:text-[#F4F4F5]">
                  {user ? user.email : 'Conexión por ID teocrático'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Guardado:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Automático en cada cambio
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Abrir sincronización en la nube</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 6: Copias de Respaldo y Cifrado */}
        <div
          onClick={() => setActiveTab('respaldos')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <Database size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                AES-256 Militar
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Copias y Respaldo Cifrado
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Descarga copias de seguridad de toda la congregación o restaura archivos protegidos por contraseña.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Formatos:</span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">.json y .orgenc.json</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Cifrado:</span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">AES-256-GCM + PBKDF2</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Abrir copias y archivos</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 7: Mantenimiento y Datos */}
        <div
          onClick={() => setActiveTab('mantenimiento')}
          className="bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl text-zinc-700 dark:text-[#F4F4F5] group-hover:scale-105 transition-transform">
                <Trash2 size={22} />
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                Herramientas
              </span>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Mantenimiento y Datos
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2">
              Eliminación de datos de demostración para iniciar en limpio, vaciado de publicadores o reinicio total.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Acciones:</span>
                <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">Limpieza y reseteo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 dark:text-[#71717A]">Protección:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Nombre y horarios seguros
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all">
            <span>Abrir herramientas de mantenimiento</span>
            <ChevronRight size={16} />
          </div>
        </div>

        {/* Tarjeta 8: Registro de Versiones y Changelog */}
        <div
          onClick={() => onOpenVersionModal?.()}
          className="bg-white dark:bg-[#121216] hover:bg-indigo-50/[0.3] dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <RefreshCw size={22} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {CURRENT_APP_STAGE}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 font-mono">
                  v{CURRENT_APP_VERSION}
                </span>
              </div>
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Registro de Versiones y Changelog
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
              Historial detallado de actualizaciones, verificación de despliegue y estado de compilación de la aplicación.
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">Compilación activa:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                  v{CURRENT_APP_VERSION} ({CURRENT_APP_STAGE} Preliminar)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fecha de actualización:</span>
                <span className="font-semibold">{BUILD_DATE}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>Ver registro de cambios completo</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};
