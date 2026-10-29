// src/components/SettingsTab.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { isCongregationIdString } from '../utils/theocraticSecurity';
import {
  CheckCircle2,
  Save,
  User,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { JoinCongregationModal } from './JoinCongregationModal';
import { InvitationManagerModal } from './InvitationManagerModal';
import { RotateCredentialsModal } from './RotateCredentialsModal';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';
import { PushSubscriptionModal } from './PushSubscriptionModal';
import {
  getNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  getPushSubscriptionRecord,
  subscribeToPushNotifications,
  syncAssignmentsWithServiceWorker,
  sendTestNotification,
  requestNotificationPermission,
  NotificationPreferences,
  PushSubscriptionRecord,
} from '../services/notificationService';

// Modular Settings Architecture
import {
  SettingsCategoryTab,
  SettingsTabProps,
  SETTINGS_TABS_CONFIG,
  AllSettingsOverview,
  NotificationsSection,
  GeneralSettingsSection,
  RulesSettingsSection,
  InvitacionesSection,
  SecuritySection,
  CloudSettingsSection,
  BackupsSection,
  MaintenanceSection,
} from './Settings';

// Re-export types and configs for backward compatibility
export type { SettingsCategoryTab, SettingsTabProps };
export { SETTINGS_TABS_CONFIG };

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onNavigateToProfile,
  onOpenVersionModal,
  onNavigateToRoles,
}) => {
  const {
    settings,
    updateSettings,
    publishers,
    publishersMap,
    cartShifts,
    cartLocations,
    weeks,
    rotateCredentials,
  } = useCongregation();

  const { user } = useAuth();
  const { invitations, isCongregationPinSet, isPinEnabled } = useSecurity();

  const [activeTab, setActiveTab] = useState<SettingsCategoryTab>('all');
  const [isRotateCredentialsModalOpen, setIsRotateCredentialsModalOpen] = useState(false);

  // Preferencias de Notificación de Asignaciones
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() =>
    getNotificationPreferences()
  );
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [pushSubRecord, setPushSubRecord] = useState<PushSubscriptionRecord | null>(() =>
    getPushSubscriptionRecord()
  );
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [, setIsSubscribingPush] = useState(false);
  const [notifFeedbackMsg, setNotifFeedbackMsg] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const [selectedNotifPubId, setSelectedNotifPubId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('kongre_my_publisher_id') || '';
  });

  const activeNotifPublisher = React.useMemo(() => {
    if (selectedNotifPubId) {
      const found = publishers.find((p) => p.id === selectedNotifPubId);
      if (found) return found;
    }
    return publishers[0] || null;
  }, [publishers, selectedNotifPubId]);

  const handleUpdateNotifPrefs = useCallback(
    async (partial: Partial<NotificationPreferences>, feedbackText?: string) => {
      const updated = saveNotificationPreferences(partial);
      setNotifPrefs(updated);

      const pubId = activeNotifPublisher?.id || selectedNotifPubId || 'pub-local';
      const pubName =
        activeNotifPublisher?.name ||
        (typeof window !== 'undefined' ? localStorage.getItem('kongre_my_publisher_name') : '') ||
        'Publicador';

      try {
        await syncAssignmentsWithServiceWorker({
          publisherId: pubId,
          publisherName: pubName,
          congregationName: settings.congregationName,
          weeks,
          cartShifts,
          cartLocations,
          settings,
          publishersMap,
          preferences: updated,
        });
        setPushSubRecord(getPushSubscriptionRecord());
      } catch {}

      if (feedbackText) {
        setNotifFeedbackMsg({ type: 'success', text: feedbackText });
        setTimeout(() => setNotifFeedbackMsg(null), 3500);
      }
    },
    [
      activeNotifPublisher,
      selectedNotifPubId,
      settings,
      weeks,
      cartShifts,
      cartLocations,
      publishersMap,
    ]
  );

  const handleEnablePushFromSettings = async () => {
    setIsSubscribingPush(true);
    setNotifFeedbackMsg(null);
    const pubId = activeNotifPublisher?.id || selectedNotifPubId || 'pub-local';
    const pubName =
      activeNotifPublisher?.name ||
      (typeof window !== 'undefined' ? localStorage.getItem('kongre_my_publisher_name') : '') ||
      'Publicador';
    try {
      const res = await subscribeToPushNotifications({
        publisherId: pubId,
        publisherName: pubName,
        congregationName: settings.congregationName,
        weeks,
        cartShifts,
        cartLocations,
        settings,
        publishersMap,
      });
      setNotifPermission(res.permission);
      setPushSubRecord(res.subscription);
      setNotifPrefs(getNotificationPreferences());
      if (res.success) {
        setNotifFeedbackMsg({
          type: 'success',
          text: `¡Recordatorios automáticos activados (${notifPrefs.notifyDaysBefore === 1 ? '1 día antes' : `${notifPrefs.notifyDaysBefore} días antes`})!`,
        });
      } else {
        setNotifFeedbackMsg({
          type: 'error',
          text: res.error || 'No se pudo activar el permiso de notificaciones en el navegador.',
        });
      }
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleTestNotifFromSettings = async () => {
    const pubName =
      activeNotifPublisher?.name ||
      (typeof window !== 'undefined' ? localStorage.getItem('kongre_my_publisher_name') : '') ||
      'Publicador';
    if (notifPermission !== 'granted') {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm !== 'granted') {
        setNotifFeedbackMsg({
          type: 'error',
          text: 'Debes permitir las notificaciones en tu navegador para probar el recordatorio.',
        });
        return;
      }
    }
    const ok = await sendTestNotification(pubName);
    if (ok) {
      setNotifFeedbackMsg({
        type: 'info',
        text: `Recordatorio de prueba enviado (${notifPrefs.notifyDaysBefore === 1 ? '1 día antes' : `${notifPrefs.notifyDaysBefore} días antes`} a las ${notifPrefs.preferredHour}).`,
      });
      setTimeout(() => setNotifFeedbackMsg(null), 3500);
    }
  };

  const [isSettingsInviteModalOpen, setIsSettingsInviteModalOpen] = useState(false);
  const [isSettingsJoinModalOpen, setIsSettingsJoinModalOpen] = useState(false);
  const [isSettingsWizardOpen, setIsSettingsWizardOpen] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);

  const [congName, setCongName] = useState(() => {
    const raw =
      settings.congregationName?.trim() ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_name')?.trim() ||
          localStorage.getItem('kongre_congregation_name')?.trim()
        : null) ||
      '';
    if (raw && !isCongregationIdString(raw) && raw !== 'Congregación Central') return raw;
    return raw && !isCongregationIdString(raw) ? raw : '';
  });

  const [midDay, setMidDay] = useState(
    () =>
      settings.midweekMeetingDay ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_midweek_day') ||
          localStorage.getItem('kongre_midweek_day')
        : null) ||
      'Miércoles'
  );
  const [midTime, setMidTime] = useState(
    () =>
      settings.midweekMeetingTime ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_midweek_time') ||
          localStorage.getItem('kongre_midweek_time')
        : null) ||
      '19:00'
  );
  const [fdsDay, setFdsDay] = useState(
    () =>
      settings.weekendMeetingDay ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_weekend_day') ||
          localStorage.getItem('kongre_weekend_day')
        : null) ||
      'Domingo'
  );
  const [fdsTime, setFdsTime] = useState(
    () =>
      settings.weekendMeetingTime ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_weekend_time') ||
          localStorage.getItem('kongre_weekend_time')
        : null) ||
      '10:00'
  );
  const [hallAddress, setHallAddress] = useState(
    () =>
      settings.hallAddress ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_address') ||
          localStorage.getItem('kongre_hall_address')
        : null) ||
      ''
  );

  const userHasEditedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setSaveSuccessMsg] = useState<string | null>(null);

  // Rules state with safe defaults
  const rules = settings.conflictRules || {
    allowPartAndDutySameMeeting: false,
    allowAudioAndMicrophones: false,
    allowPresidentAndOtherPart: false,
    maxConsecutiveWeeksWithDuty: 2,
    maxConsecutiveWeeksWithPart: 2,
    enforceSisterDemonstrationRules: true,
    warnOutlineRepeatedWithinMonths: 12,
  };

  const [allowPartAndDuty, setAllowPartAndDuty] = useState(rules.allowPartAndDutySameMeeting);
  const [allowAudioAndMics, setAllowAudioAndMics] = useState(rules.allowAudioAndMicrophones);
  const [allowPresAndPart, setAllowPresAndPart] = useState(rules.allowPresidentAndOtherPart);
  const [maxConsecutiveDuty, setMaxConsecutiveDuty] = useState(rules.maxConsecutiveWeeksWithDuty);
  const [maxConsecutivePart, setMaxConsecutivePart] = useState(rules.maxConsecutiveWeeksWithPart);
  const [enforceSisters, setEnforceSisters] = useState(rules.enforceSisterDemonstrationRules);
  const [warnOutlineMonths, setWarnOutlineMonths] = useState(rules.warnOutlineRepeatedWithinMonths || 12);

  const isFormDirty = Boolean(
    congName.trim() !== (settings.congregationName || '').trim() ||
      midDay !== (settings.midweekMeetingDay || 'Miércoles') ||
      midTime !== (settings.midweekMeetingTime || '19:00') ||
      fdsDay !== (settings.weekendMeetingDay || 'Domingo') ||
      fdsTime !== (settings.weekendMeetingTime || '10:00') ||
      hallAddress.trim() !== (settings.hallAddress || '').trim() ||
      allowPartAndDuty !== Boolean(settings.conflictRules?.allowPartAndDutySameMeeting) ||
      allowAudioAndMics !== Boolean(settings.conflictRules?.allowAudioAndMicrophones) ||
      allowPresAndPart !== Boolean(settings.conflictRules?.allowPresidentAndOtherPart) ||
      maxConsecutiveDuty !== (settings.conflictRules?.maxConsecutiveWeeksWithDuty ?? 2) ||
      maxConsecutivePart !== (settings.conflictRules?.maxConsecutiveWeeksWithPart ?? 2) ||
      enforceSisters !== (settings.conflictRules?.enforceSisterDemonstrationRules ?? true) ||
      warnOutlineMonths !== (settings.conflictRules?.warnOutlineRepeatedWithinMonths ?? 12)
  );

  // Sync state if settings update remotely
  useEffect(() => {
    if (userHasEditedRef.current) return;

    if (settings) {
      const storedName =
        typeof window !== 'undefined'
          ? localStorage.getItem('kongre_user_confirmed_name')?.trim() ||
            localStorage.getItem('kongre_congregation_name')?.trim()
          : '';
      const cleanName =
        settings.congregationName &&
        !isCongregationIdString(settings.congregationName) &&
        settings.congregationName !== 'Congregación Central'
          ? settings.congregationName.trim()
          : storedName &&
            !isCongregationIdString(storedName) &&
            storedName !== 'Congregación Central'
          ? storedName
          : settings.congregationName?.trim() || '';

      if (cleanName) {
        setCongName(cleanName);
      }
      const resolvedMidDay =
        settings.midweekMeetingDay ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('kongre_user_confirmed_midweek_day') ||
            localStorage.getItem('kongre_midweek_day')
          : null);
      if (resolvedMidDay) setMidDay(resolvedMidDay);

      const resolvedMidTime =
        settings.midweekMeetingTime ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('kongre_user_confirmed_midweek_time') ||
            localStorage.getItem('kongre_midweek_time')
          : null);
      if (resolvedMidTime) setMidTime(resolvedMidTime);

      const resolvedFdsDay =
        settings.weekendMeetingDay ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('kongre_user_confirmed_weekend_day') ||
            localStorage.getItem('kongre_weekend_day')
          : null);
      if (resolvedFdsDay) setFdsDay(resolvedFdsDay);

      const resolvedFdsTime =
        settings.weekendMeetingTime ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('kongre_user_confirmed_weekend_time') ||
            localStorage.getItem('kongre_weekend_time')
          : null);
      if (resolvedFdsTime) setFdsTime(resolvedFdsTime);

      const resolvedAddress =
        settings.hallAddress ??
        (typeof window !== 'undefined'
          ? localStorage.getItem('kongre_user_confirmed_address') ||
            localStorage.getItem('kongre_hall_address') ||
            ''
          : '');
      if (resolvedAddress !== undefined) setHallAddress(resolvedAddress);

      if (settings.conflictRules) {
        setAllowPartAndDuty(Boolean(settings.conflictRules.allowPartAndDutySameMeeting));
        setAllowAudioAndMics(Boolean(settings.conflictRules.allowAudioAndMicrophones));
        setAllowPresAndPart(Boolean(settings.conflictRules.allowPresidentAndOtherPart));
        setMaxConsecutiveDuty(settings.conflictRules.maxConsecutiveWeeksWithDuty ?? 2);
        setMaxConsecutivePart(settings.conflictRules.maxConsecutiveWeeksWithPart ?? 2);
        setEnforceSisters(settings.conflictRules.enforceSisterDemonstrationRules ?? true);
        setWarnOutlineMonths(settings.conflictRules.warnOutlineRepeatedWithinMonths ?? 12);
      }
    }
  }, [
    settings.congregationName,
    settings.midweekMeetingDay,
    settings.midweekMeetingTime,
    settings.weekendMeetingDay,
    settings.weekendMeetingTime,
    settings.hallAddress,
  ]);

  // Tab auto-scroll
  useEffect(() => {
    if (tabsRef.current) {
      const activeEl = tabsRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);
    userHasEditedRef.current = false;

    const trimmedName = congName.trim();
    const trimmedAddress = hallAddress.trim();

    try {
      if (trimmedName && !isCongregationIdString(trimmedName)) {
        localStorage.setItem('kongre_congregation_name', trimmedName);
        localStorage.setItem('kongre_user_confirmed_name', trimmedName);
      }
      localStorage.setItem('kongre_midweek_day', midDay);
      localStorage.setItem('kongre_user_confirmed_midweek_day', midDay);
      localStorage.setItem('kongre_midweek_time', midTime);
      localStorage.setItem('kongre_user_confirmed_midweek_time', midTime);
      localStorage.setItem('kongre_weekend_day', fdsDay);
      localStorage.setItem('kongre_user_confirmed_weekend_day', fdsDay);
      localStorage.setItem('kongre_weekend_time', fdsTime);
      localStorage.setItem('kongre_user_confirmed_weekend_time', fdsTime);
      localStorage.setItem('kongre_hall_address', trimmedAddress);
      localStorage.setItem('kongre_user_confirmed_address', trimmedAddress);
      localStorage.setItem('kongre_settings_user_saved', 'true');
      localStorage.setItem('kongre_is_registered_congregation', 'true');
      localStorage.setItem('kongre_has_entered_app', 'true');
    } catch (storageErr) {
      console.warn('Error escribiendo en localStorage:', storageErr);
    }

    const preservedCongId = (
      settings.congregationNumber ||
      settings.congregationId ||
      (typeof window !== 'undefined' ? localStorage.getItem('kongre_congregation_number') : null) ||
      (typeof window !== 'undefined' ? localStorage.getItem('kongre_congregation_id') : null) ||
      ''
    )
      .trim()
      .toUpperCase();

    if (preservedCongId) {
      try {
        localStorage.setItem('kongre_congregation_number', preservedCongId);
        localStorage.setItem('kongre_congregation_id', preservedCongId);
      } catch {}
    }

    try {
      await updateSettings({
        congregationName: trimmedName,
        ...(preservedCongId ? { congregationNumber: preservedCongId, congregationId: preservedCongId } : {}),
        midweekMeetingDay: midDay,
        midweekMeetingTime: midTime,
        weekendMeetingDay: fdsDay,
        weekendMeetingTime: fdsTime,
        hallAddress: trimmedAddress,
        isRegistered: true,
        conflictRules: {
          allowPartAndDutySameMeeting: allowPartAndDuty,
          allowAudioAndMicrophones: allowAudioAndMics,
          allowPresidentAndOtherPart: allowPresAndPart,
          maxConsecutiveWeeksWithDuty: Number(maxConsecutiveDuty),
          maxConsecutiveWeeksWithPart: Number(maxConsecutivePart),
          enforceSisterDemonstrationRules: enforceSisters,
          warnOutlineRepeatedWithinMonths: Number(warnOutlineMonths) || 12,
        },
      });

      setSavedFeedback(true);
      setSaveSuccessMsg('¡Ajustes guardados correctamente y sincronizados!');
      setTimeout(() => {
        setSavedFeedback(false);
        setSaveSuccessMsg(null);
      }, 3500);
    } catch (saveErr) {
      console.error('Error al guardar ajustes:', saveErr);
      setSavedFeedback(true);
      setSaveSuccessMsg('¡Ajustes guardados en el almacenamiento local!');
      setTimeout(() => {
        setSavedFeedback(false);
        setSaveSuccessMsg(null);
      }, 3500);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSettingsWizardOpen) {
    return (
      <RegisterCongregationWizard
        onClose={() => setIsSettingsWizardOpen(false)}
        onRegisteredSuccess={() => setIsSettingsWizardOpen(false)}
      />
    );
  }

  const tabKeys = Object.keys(SETTINGS_TABS_CONFIG) as SettingsCategoryTab[];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Barra de Herramientas y Pestañas Unificada */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Pestañas de categorías con diseño Pill Container */}
        <div
          ref={tabsRef}
          className="p-1.5 bg-slate-100/90 dark:bg-slate-900/60 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] backdrop-blur-md flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xs flex-1 min-w-0"
        >
          {tabKeys.map((tabKey) => {
            const config = SETTINGS_TABS_CONFIG[tabKey];
            const isActive = activeTab === tabKey;
            const Icon = config.icon;

            return (
              <button
                key={tabKey}
                type="button"
                data-active={isActive}
                onClick={() => setActiveTab(tabKey)}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold border border-slate-200/60 dark:border-transparent'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  size={14}
                  className={isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}
                />
                <span>{config.label}</span>
                {tabKey === 'all' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-white/20 dark:text-white'
                        : 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                    }`}
                  >
                    HUB
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Acciones principales de Ajustes en barra limpia y compacta */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          {/* Indicador de cambios sin guardar o sincronizado */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border ${
              isFormDirty
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                : 'bg-slate-100/90 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-zinc-200/80 dark:border-white/[0.08]'
            }`}
            title={isFormDirty ? 'Hay cambios sin guardar' : 'Ajustes sincronizados'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFormDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="hidden md:inline">
              {isFormDirty ? 'Cambios pendientes' : user ? 'Google Sincronizado' : 'Modo Seguro'}
            </span>
          </div>

          {onNavigateToProfile && (
            <button
              type="button"
              onClick={onNavigateToProfile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.08] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Configurar foto, teléfono y contacto personal"
            >
              <User size={14} className="text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer ${
              savedFeedback
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
            title="Guardar todos los cambios de configuración"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : savedFeedback ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Ajustes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. VISTA PRINCIPAL: PANEL DE TARJETAS (HUB) */}
      {activeTab === 'all' && (
        <AllSettingsOverview
          setActiveTab={setActiveTab}
          onOpenVersionModal={onOpenVersionModal}
          notifPrefs={notifPrefs}
          handleUpdateNotifPrefs={handleUpdateNotifPrefs}
          notifFeedbackMsg={notifFeedbackMsg}
          setNotifFeedbackMsg={setNotifFeedbackMsg}
          activeNotifPublisher={activeNotifPublisher}
          selectedNotifPubId={selectedNotifPubId}
          pushSubRecord={pushSubRecord}
          settings={settings}
          weeks={weeks}
          cartShifts={cartShifts}
          cartLocations={cartLocations}
          publishersMap={publishersMap}
          setIsPushModalOpen={setIsPushModalOpen}
          setPushSubRecord={setPushSubRecord}
          setNotifPermission={setNotifPermission}
          setNotifPrefs={setNotifPrefs}
          congName={congName}
          midDay={midDay}
          midTime={midTime}
          fdsDay={fdsDay}
          fdsTime={fdsTime}
          allowPartAndDuty={allowPartAndDuty}
          maxConsecutiveDuty={maxConsecutiveDuty}
          maxConsecutivePart={maxConsecutivePart}
          invitations={invitations}
          isPinEnabled={isPinEnabled}
          autoLockMinutes={0}
          privacyModeEnabled={false}
          user={user}
        />
      )}

      {/* 3. VISTAS EXCLUSIVAS: CADA CATEGORÍA DENTRO DE SU PROPIO CONTENEDOR */}
      {activeTab !== 'all' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Navegación sutil y directa al Panel de Tarjetas */}
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Volver al Panel de Tarjetas"
                aria-label="Volver al Panel de Tarjetas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Ajustes • {SETTINGS_TABS_CONFIG[activeTab]?.label}
              </span>
            </div>
          </div>

          {/* CONTENEDOR: PREFERENCIAS DE NOTIFICACIÓN */}
          {activeTab === 'notificaciones' && (
            <NotificationsSection
              notifPermission={notifPermission}
              notifFeedbackMsg={notifFeedbackMsg}
              setNotifFeedbackMsg={setNotifFeedbackMsg}
              notifPrefs={notifPrefs}
              handleUpdateNotifPrefs={handleUpdateNotifPrefs}
              activeNotifPublisher={activeNotifPublisher}
              selectedNotifPubId={selectedNotifPubId}
              setSelectedNotifPubId={setSelectedNotifPubId}
              publishers={publishers}
              settings={settings}
              weeks={weeks}
              cartShifts={cartShifts}
              cartLocations={cartLocations}
              publishersMap={publishersMap}
              onOpenPushModal={() => setIsPushModalOpen(true)}
              setPushSubRecord={setPushSubRecord}
              setNotifPermission={setNotifPermission}
              setNotifPrefs={setNotifPrefs}
            />
          )}

          {/* CONTENEDOR: HORARIOS Y SALÓN */}
          {activeTab === 'general' && (
            <GeneralSettingsSection
              congName={congName}
              setCongName={setCongName}
              hallAddress={hallAddress}
              setHallAddress={setHallAddress}
              midDay={midDay}
              setMidDay={setMidDay}
              midTime={midTime}
              setMidTime={setMidTime}
              fdsDay={fdsDay}
              setFdsDay={setFdsDay}
              fdsTime={fdsTime}
              setFdsTime={setFdsTime}
              onUserEdit={() => {
                userHasEditedRef.current = true;
              }}
              onSave={handleSaveSettings}
              isSaving={isSaving}
            />
          )}

          {/* CONTENEDOR: REGLAS Y CONFLICTOS */}
          {activeTab === 'reglas' && (
            <RulesSettingsSection
              allowPartAndDuty={allowPartAndDuty}
              setAllowPartAndDuty={setAllowPartAndDuty}
              allowAudioAndMics={allowAudioAndMics}
              setAllowAudioAndMics={setAllowAudioAndMics}
              allowPresAndPart={allowPresAndPart}
              setAllowPresAndPart={setAllowPresAndPart}
              enforceSisters={enforceSisters}
              setEnforceSisters={setEnforceSisters}
              maxConsecutiveDuty={maxConsecutiveDuty}
              setMaxConsecutiveDuty={setMaxConsecutiveDuty}
              maxConsecutivePart={maxConsecutivePart}
              setMaxConsecutivePart={setMaxConsecutivePart}
              warnOutlineMonths={warnOutlineMonths}
              setWarnOutlineMonths={setWarnOutlineMonths}
              onSave={handleSaveSettings}
              isSaving={isSaving}
            />
          )}

          {/* CONTENEDOR: INVITACIONES Y ACCESO QR */}
          {activeTab === 'invitaciones' && (
            <InvitacionesSection
              invitations={invitations}
              isCongregationPinSet={isCongregationPinSet}
              isPinEnabled={isPinEnabled}
              settings={settings}
              onOpenWizard={() => setIsSettingsWizardOpen(true)}
              onOpenInviteModal={() => setIsSettingsInviteModalOpen(true)}
              onOpenJoinModal={() => setIsSettingsJoinModalOpen(true)}
            />
          )}

          {/* CONTENEDOR: SEGURIDAD Y PINS */}
          {activeTab === 'seguridad' && (
            <SecuritySection
              onNavigateToRoles={onNavigateToRoles}
              onOpenRotateModal={() => setIsRotateCredentialsModalOpen(true)}
            />
          )}

          {/* CONTENEDOR: NUBE Y SINCRONIZACIÓN */}
          {activeTab === 'nube' && (
            <CloudSettingsSection
              onOpenRotateModal={() => setIsRotateCredentialsModalOpen(true)}
            />
          )}

          {/* CONTENEDOR: COPIAS Y RESGUARDOS CIFRADOS */}
          {activeTab === 'respaldos' && <BackupsSection />}

          {/* CONTENEDOR: MANTENIMIENTO Y DATOS */}
          {activeTab === 'mantenimiento' && <MaintenanceSection />}
        </div>
      )}

      {/* Theocratic Invitations & QR Manager Modal */}
      <InvitationManagerModal
        isOpen={isSettingsInviteModalOpen}
        onClose={() => setIsSettingsInviteModalOpen(false)}
      />

      {/* Join Congregation Modal */}
      <JoinCongregationModal
        isOpen={isSettingsJoinModalOpen}
        onClose={() => setIsSettingsJoinModalOpen(false)}
      />

      {/* Push Subscription & Background Reminders Modal */}
      <PushSubscriptionModal
        isOpen={isPushModalOpen}
        onClose={() => {
          setIsPushModalOpen(false);
          setNotifPrefs(getNotificationPreferences());
          setNotifPermission(getNotificationPermission());
          setPushSubRecord(getPushSubscriptionRecord());
        }}
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
        onSubscriptionChange={(sub) => {
          setPushSubRecord(sub);
          setNotifPrefs(getNotificationPreferences());
          setNotifPermission(getNotificationPermission());
        }}
      />

      {/* Modal de Rotación Segura de Credenciales */}
      <RotateCredentialsModal
        isOpen={isRotateCredentialsModalOpen}
        onClose={() => setIsRotateCredentialsModalOpen(false)}
        onRotate={rotateCredentials}
        congregationId={settings?.congregationId || settings?.congregationNumber}
        congregationName={settings?.congregationName}
      />
    </div>
  );
};
