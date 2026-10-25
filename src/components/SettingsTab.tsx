// src/components/SettingsTab.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import {
  encryptTheocraticData,
  decryptTheocraticData,
  isCongregationIdString,
} from '../utils/theocraticSecurity';
import { insertAuditLog } from '../services/auditLogService';
import {
  Settings,
  Shield,
  Cloud,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Save,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  FileKey,
  Clock,
  X,
  Eye,
  EyeOff,
  QrCode,
  User,
  UserPlus,
  Building2,
  Copy,
  Check,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Layers,
  ShieldAlert,
  LogOut,
  Sliders,
  Sparkles,
  Bot,
  Key,
  ExternalLink,
  Users,
  MapPin,
  Bell,
  BellRing,
  BellOff,
  Send,
  Volume2,
  VolumeX,
  Smartphone,
  CreditCard,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { JoinCongregationModal } from './JoinCongregationModal';
import { InvitationManagerModal } from './InvitationManagerModal';
import { RotateCredentialsModal } from './RotateCredentialsModal';
import { SplashCheckbox } from './SplashCheckbox';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';
import { AutoLockSettingsCard } from './AutoLockSettingsCard';
import { Select } from './Select';
import { IosTimePicker } from './IosTimePicker';
import { PushSubscriptionModal } from './PushSubscriptionModal';
import { PushNotificationQuickGuideCard } from './PushNotificationQuickGuideCard';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationPreferences,
  saveNotificationPreferences,
  getPushSubscriptionRecord,
  subscribeToPushNotifications,
  syncAssignmentsWithServiceWorker,
  sendTestNotification,
  NotificationPreferences,
  PushSubscriptionRecord,
} from '../services/notificationService';
import { CURRENT_APP_VERSION, BUILD_DATE } from '../utils/versionLog';

export type SettingsCategoryTab =
  | 'all'
  | 'notificaciones'
  | 'general'
  | 'reglas'
  | 'invitaciones'
  | 'seguridad'
  | 'nube'
  | 'respaldos'
  | 'mantenimiento';

interface SettingsTabProps {
  onNavigateToProfile?: () => void;
  onOpenVersionModal?: () => void;
  onNavigateToRoles?: () => void;
}

export const SETTINGS_TABS_CONFIG: Record<
  SettingsCategoryTab,
  {
    label: string;
    icon: any;
    desc: string;
    badge?: string;
    color: string;
    borderColor: string;
    hoverBorder: string;
    bgLight: string;
    bgHover: string;
    pillBg: string;
  }
> = {
  all: {
    label: 'Panel de Tarjetas',
    icon: Layers,
    desc: 'Centro principal con todas las áreas de configuración en tarjetas independientes',
    badge: 'HUB',
    color: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200/60 dark:border-indigo-800/40',
    hoverBorder: 'hover:border-indigo-500/50',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    bgHover: 'hover:bg-indigo-50/[0.3] dark:hover:bg-indigo-500/[0.04]',
    pillBg: 'bg-indigo-600 text-white',
  },
  notificaciones: {
    label: 'Preferencias de Notificación',
    icon: BellRing,
    desc: 'Configura cuántos días antes deseas recibir recordatorios automáticos de tus asignaciones (1, 3 o 7 días antes)',
    badge: 'Recordatorios',
    color: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200/60 dark:border-violet-800/40',
    hoverBorder: 'hover:border-violet-500/50',
    bgLight: 'bg-violet-50 dark:bg-violet-950/40',
    bgHover: 'hover:bg-violet-50/[0.3] dark:hover:bg-violet-500/[0.04]',
    pillBg: 'bg-violet-600 text-white',
  },
  general: {
    label: 'Horarios y Salón',
    icon: Calendar,
    desc: 'Nombre oficial de la congregación, Salón del Reino y horarios de Entre Semana y Fin de Semana',
    badge: 'Reuniones',
    color: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200/60 dark:border-blue-800/40',
    hoverBorder: 'hover:border-blue-500/50',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    bgHover: 'hover:bg-blue-50/[0.3] dark:hover:bg-blue-500/[0.04]',
    pillBg: 'bg-blue-600 text-white',
  },
  reglas: {
    label: 'Reglas y Conflictos',
    icon: ShieldAlert,
    desc: 'Motor anticolisión para evitar cruces entre partes y deberes, límites de semanas y bosquejos',
    badge: 'Anticolisión',
    color: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200/60 dark:border-amber-800/40',
    hoverBorder: 'hover:border-amber-500/50',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    bgHover: 'hover:bg-amber-50/[0.3] dark:hover:bg-amber-500/[0.04]',
    pillBg: 'bg-amber-600 text-white',
  },
  invitaciones: {
    label: 'Invitaciones y QR',
    icon: QrCode,
    desc: 'Códigos de acceso cerrado, escaneo QR y credenciales teocráticas de congregación',
    badge: 'Zero-Knowledge',
    color: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200/60 dark:border-purple-800/40',
    hoverBorder: 'hover:border-purple-500/50',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    bgHover: 'hover:bg-purple-50/[0.3] dark:hover:bg-purple-500/[0.04]',
    pillBg: 'bg-purple-600 text-white',
  },
  seguridad: {
    label: 'Seguridad y PINs',
    icon: Lock,
    desc: 'PIN de bloqueo de pantalla en el Salón, auto-bloqueo por inactividad y privacidad PII',
    badge: 'AES-256',
    color: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200/60 dark:border-emerald-800/40',
    hoverBorder: 'hover:border-emerald-500/50',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    bgHover: 'hover:bg-emerald-50/[0.3] dark:hover:bg-emerald-500/[0.04]',
    pillBg: 'bg-emerald-600 text-white',
  },
  nube: {
    label: 'Nube y Sincronización',
    icon: Cloud,
    desc: 'Sincronización multi-dispositivo y respaldo en Google Firestore para todos los hermanos',
    badge: 'Nube en vivo',
    color: 'text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-200/60 dark:border-sky-800/40',
    hoverBorder: 'hover:border-sky-500/50',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    bgHover: 'hover:bg-sky-50/[0.3] dark:hover:bg-sky-500/[0.04]',
    pillBg: 'bg-sky-600 text-white',
  },
  respaldos: {
    label: 'Copias y Cifrado',
    icon: Database,
    desc: 'Descargas JSON de la congregación, exportación cifrada grado militar y restauración',
    badge: 'Respaldos',
    color: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200/60 dark:border-indigo-800/40',
    hoverBorder: 'hover:border-indigo-500/50',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/40',
    bgHover: 'hover:bg-indigo-50/[0.3] dark:hover:bg-indigo-500/[0.04]',
    pillBg: 'bg-indigo-600 text-white',
  },
  mantenimiento: {
    label: 'Mantenimiento y Datos',
    icon: Trash2,
    desc: 'Limpieza de datos de prueba / demo, vaciado de publicadores o reinicio total teocrático',
    badge: 'Herramientas',
    color: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-200/60 dark:border-rose-800/40',
    hoverBorder: 'hover:border-rose-500/50',
    bgLight: 'bg-rose-50 dark:bg-rose-950/40',
    bgHover: 'hover:bg-rose-50/[0.3] dark:hover:bg-rose-500/[0.04]',
    pillBg: 'bg-rose-600 text-white',
  },
};

export const SettingsTab: React.FC<SettingsTabProps> = ({ onNavigateToProfile, onOpenVersionModal, onNavigateToRoles }) => {
  const {
    settings,
    updateSettings,
    exportBackupJSON,
    getBackupJSON,
    importBackupJSON,
    uploadLocalDataToGoogle,
    downloadDataFromGoogle,
    cleanSampleData,
    clearAllPublishers,
    resetAllCongregationData,
    deleteAllRegisteredCongregations,
    publishers,
    publishersMap,
    cartShifts,
    cartLocations,
    weeks,
    territories,
    notices,
    transactions,
    quarterlyAudits,
    literatureItems,
    isGranularSyncActive,
    granularSyncStats,
    checkGranularStatus,
    forceSubcollectionsMigration,
    syncNowWithSupabase,
    rotateCredentials,
    lastSupabaseSyncAt,
    isSupabaseSyncing,
    isDemoMode,
  } = useCongregation();

  const { user, signOutUser } = useAuth();

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
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
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

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudActionStatus, setCloudActionStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Fase 4: Estados y acciones de subcolecciones granulares
  const [isCheckingGranular, setIsCheckingGranular] = useState(false);
  const [isMigratingSubcollections, setIsMigratingSubcollections] = useState(false);
  const [granularStatusMessage, setGranularStatusMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const handleCheckGranular = async () => {
    setIsCheckingGranular(true);
    setGranularStatusMessage(null);
    try {
      const stats = await checkGranularStatus();
      setGranularStatusMessage({
        type: 'success',
        text: `Verificación completada: ${stats.publishersCount} publicadores, ${stats.weeksCount} semanas, ${stats.territoriesCount} territorios y ${stats.noticesCount} anuncios activos en subcolecciones de Firestore.`,
      });
    } catch (err: any) {
      setGranularStatusMessage({
        type: 'error',
        text: 'Error diagnosticando subcolecciones: ' + (err?.message || 'Error de conexión'),
      });
    } finally {
      setIsCheckingGranular(false);
    }
  };

  const handleMigrateSubcollections = async () => {
    setIsMigratingSubcollections(true);
    setGranularStatusMessage(null);
    try {
      const res = await forceSubcollectionsMigration();
      if (res.success) {
        setGranularStatusMessage({
          type: 'success',
          text: `¡Migración a subcolecciones completada con éxito! ${res.message}`,
        });
      } else {
        setGranularStatusMessage({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err: any) {
      setGranularStatusMessage({
        type: 'error',
        text: 'Error durante la migración: ' + (err?.message || 'Error desconocido'),
      });
    } finally {
      setIsMigratingSubcollections(false);
    }
  };

  const [cleanActionStatus, setCleanActionStatus] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [showCleanSampleModal, setShowCleanSampleModal] = useState(false);
  const [showClearPublishersModal, setShowClearPublishersModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);

  const handleUploadToGoogle = async () => {
    setIsSyncingCloud(true);
    setCloudActionStatus(null);
    try {
      const res = await uploadLocalDataToGoogle();
      setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
    } catch (e: any) {
      setCloudActionStatus({
        type: 'error',
        msg: e?.message || 'Error al guardar en la nube de Google.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleDownloadFromGoogle = async () => {
    setIsSyncingCloud(true);
    setCloudActionStatus(null);
    try {
      const res = await downloadDataFromGoogle();
      setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
    } catch (e: any) {
      setCloudActionStatus({
        type: 'error',
        msg: e?.message || 'Error al descargar datos desde Google.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const [supabaseSyncFeedback, setSupabaseSyncFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    msg: string;
  } | null>(null);

  const handleSyncSupabase = async (forceUpload: boolean = false) => {
    setSupabaseSyncFeedback(null);
    if (isDemoMode) {
      setSupabaseSyncFeedback({
        type: 'info',
        msg: 'El modo de demostración opera de manera 100% local sin conexión a Supabase.',
      });
      return;
    }
    try {
      const res = await syncNowWithSupabase(forceUpload);
      setSupabaseSyncFeedback({
        type: res.success ? 'success' : 'error',
        msg: res.message,
      });
    } catch (err: any) {
      setSupabaseSyncFeedback({
        type: 'error',
        msg: err?.message || 'Error al conectar con Supabase.',
      });
    }
  };

  const {
    isPinEnabled,
    lockSession,
    autoLockMinutes,
    setAutoLockMinutes,
    privacyModeEnabled,
    setPrivacyModeEnabled,
    setPasscodePin,
    verifyCurrentPin,
    invitations,
    isCongregationPinSet,
  } = useSecurity();

  const [isSettingsInviteModalOpen, setIsSettingsInviteModalOpen] = useState(false);
  const [isSettingsJoinModalOpen, setIsSettingsJoinModalOpen] = useState(false);
  const [isSettingsWizardOpen, setIsSettingsWizardOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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
  const [copiedCongId, setCopiedCongId] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Security PIN Modal States
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pinCurrent, setPinCurrent] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);

  // Encrypted Backup Export Modal States
  const [showEncryptExportModal, setShowEncryptExportModal] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [confirmExportPassphrase, setConfirmExportPassphrase] = useState('');
  const [showExportPassphrase, setShowExportPassphrase] = useState(false);
  const [encryptExportError, setEncryptExportError] = useState<string | null>(null);
  const [isExportingEncrypted, setIsExportingEncrypted] = useState(false);

  // Encrypted Backup Restore Modal States
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [pendingEncryptedJson, setPendingEncryptedJson] = useState<string | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [showDecryptPassphrase, setShowDecryptPassphrase] = useState(false);
  const [decryptModalError, setDecryptModalError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

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

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError(null);

    if (isPinEnabled && pinCurrent) {
      const isCurrentValid = await verifyCurrentPin(pinCurrent);
      if (!isCurrentValid) {
        setPinModalError('El PIN actual no es correcto.');
        return;
      }
    }

    if (!pinNew) {
      await setPasscodePin(null);
      setShowPinSetupModal(false);
      setPinCurrent('');
      setPinNew('');
      setPinConfirm('');
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      return;
    }

    if (pinNew.length < 4 || pinNew.length > 8) {
      setPinModalError('El PIN debe tener entre 4 y 8 dígitos numéricos.');
      return;
    }

    if (pinNew !== pinConfirm) {
      setPinModalError('Los dos PIN ingresados no coinciden.');
      return;
    }

    await setPasscodePin(pinNew);
    setShowPinSetupModal(false);
    setPinCurrent('');
    setPinNew('');
    setPinConfirm('');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.version === 'kongre_v1' && parsed.ciphertext) {
          setPendingEncryptedJson(content);
          setDecryptPassphrase('');
          setDecryptModalError(null);
          setShowDecryptModal(true);
          return;
        }

        const success = importBackupJSON(content);
        if (success) {
          setImportStatus('¡Respaldo JSON restaurado exitosamente!');
        } else {
          setImportStatus('Error: El archivo no tiene un formato válido.');
        }
      } catch {
        setImportStatus('Error: Archivo corrupto o no compatible.');
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportEncryptedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassphrase) {
      setEncryptExportError('Ingrese una contraseña para proteger la copia.');
      return;
    }
    if (exportPassphrase !== confirmExportPassphrase) {
      setEncryptExportError('Las contraseñas no coinciden.');
      return;
    }
    if (exportPassphrase.length < 6) {
      setEncryptExportError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsExportingEncrypted(true);
    setEncryptExportError(null);

    try {
      const plainJson = getBackupJSON();
      const encrypted = await encryptTheocraticData(plainJson, exportPassphrase);
      const blob = new Blob([encrypted], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Respaldo_Cifrado_${settings.congregationName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.enc.json`;
      link.click();
      URL.revokeObjectURL(url);

      setShowEncryptExportModal(false);
      setExportPassphrase('');
      setConfirmExportPassphrase('');
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);

      insertAuditLog({
        accion: 'EXPORTAR_RESPALDO_CIFRADO',
        modulo: 'respaldos',
        hermano_nid: user?.email || 'sistema',
        detalles: 'Descarga de copia de seguridad cifrada con AES-256-GCM (.enc.json)',
      }).catch(() => {});
    } catch {
      setEncryptExportError('Error al cifrar el archivo de respaldo.');
    } finally {
      setIsExportingEncrypted(false);
    }
  };

  const handleDecryptRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEncryptedJson || !decryptPassphrase) return;

    setIsDecrypting(true);
    setDecryptModalError(null);

    try {
      const decryptedPlain = await decryptTheocraticData(pendingEncryptedJson, decryptPassphrase);
      const success = importBackupJSON(decryptedPlain);
      if (success) {
        setShowDecryptModal(false);
        setPendingEncryptedJson(null);
        setDecryptPassphrase('');
        setImportStatus('¡Respaldo cifrado descifrado y restaurado con éxito!');
        setTimeout(() => setImportStatus(null), 3500);

        insertAuditLog({
          accion: 'RESTAURAR_RESPALDO_CIFRADO',
          modulo: 'respaldos',
          hermano_nid: user?.email || 'sistema',
          detalles: 'Restauración exitosa de copia de seguridad cifrada AES-256-GCM',
        }).catch(() => {});
      } else {
        setDecryptModalError('El archivo descifrado no tiene el formato de congregación esperado.');
      }
    } catch (err: any) {
      setDecryptModalError(err.message || 'Contraseña incorrecta.');
    } finally {
      setIsDecrypting(false);
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
      {/* 1. Barra de Herramientas y Pestañas Unificada (Opción 1: sin tarjeta redundante, estilo Linear / Stripe) */}
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

      {/* 3. VISTA PRINCIPAL: PANEL DE TARJETAS (HUB) */}
      {activeTab === 'all' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* SECCIÓN DESTACADA: PREFERENCIAS DE NOTIFICACIÓN DE ASIGNACIONES */}
          <div className="bg-white dark:bg-[#0f1623] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-violet-200/80 dark:border-violet-500/30 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-white/[0.06]">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-3 bg-violet-50 dark:bg-violet-500/15 rounded-2xl text-violet-600 dark:text-violet-400 shrink-0">
                  <BellRing size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                      Preferencias de Notificación
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        notifPrefs.enabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {notifPrefs.enabled
                        ? `Activo • ${notifPrefs.notifyDaysBefore === 1 ? '1 día antes' : `${notifPrefs.notifyDaysBefore} días antes`}`
                        : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Configura cuántos días antes deseas recibir el recordatorio automático de tus asignaciones (ej. 1, 3 o 7 días antes), hora del aviso y alertas en segundo plano.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    notifPrefs.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {notifPrefs.enabled ? <BellRing size={14} /> : <BellOff size={14} />}
                  <span>{notifPrefs.enabled ? 'Recordatorios Activos' : 'Activar Recordatorios'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notificaciones')}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Sliders size={14} />
                  <span>Opciones Avanzadas</span>
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
              onSubscribedChange={(sub) => {
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
                    className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-violet-500"
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
                  className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800/50 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders size={13} />
                  <span>Ver Opciones Avanzadas de Notificación</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Tarjeta 1: Información y Horarios */}
            <div
              onClick={() => setActiveTab('general')}
              className="bg-white dark:bg-[#0f1623] hover:bg-blue-50/[0.3] dark:hover:bg-blue-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-blue-400/50 dark:hover:border-blue-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Calendar size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    {midDay} y {fdsDay}
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Información y Horarios
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Nombre oficial de la congregación, dirección física del Salón del Reino y horarios de reuniones semanales.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Congregación:</span>
                    <span className="font-semibold truncate max-w-[170px]">
                      {congName || 'Sin asignar'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Horarios:</span>
                    <span className="font-semibold">
                      {midDay} {midTime} • {fdsDay} {fdsTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Abrir ajustes de horarios</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 2: Reglas y Conflictos */}
            <div
              onClick={() => setActiveTab('reglas')}
              className="bg-white dark:bg-[#0f1623] hover:bg-amber-50/[0.3] dark:hover:bg-amber-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-amber-400/50 dark:hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <ShieldAlert size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    Motor Anticolisión
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Reglas de Cruces y Conflictos
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Detección inteligente de asignaciones simultáneas, rotación de hermanos y prevención de bosquejos repetidos.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Parte y Deber:</span>
                    <span className="font-semibold">
                      {!allowPartAndDuty ? 'Bloqueado (Recomendado)' : 'Permitido'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Rotación máxima:</span>
                    <span className="font-semibold">
                      {maxConsecutiveDuty} sem. deberes • {maxConsecutivePart} sem. partes
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Abrir reglas de asignación</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 3: Invitaciones y Acceso QR */}
            <div
              onClick={() => setActiveTab('invitaciones')}
              className="bg-white dark:bg-[#0f1623] hover:bg-purple-50/[0.3] dark:hover:bg-purple-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-purple-400/50 dark:hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <QrCode size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    {invitations.filter((i) => i.status === 'active').length} vigentes
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Registro Teocrático e Invitaciones
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Códigos cerrados y códigos QR de un solo toque para vincular ancianos, siervos y publicadores con seguridad E2EE.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">ID Congregación:</span>
                    <span className="font-semibold font-mono text-xs">
                      {settings.congregationNumber || settings.congregationId || 'Configurado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Seguridad:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Zero-Knowledge E2EE
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                <span>Gestionar invitaciones y QR</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 4: Seguridad y Bloqueo */}
            <div
              onClick={() => setActiveTab('seguridad')}
              className="bg-white dark:bg-[#0f1623] hover:bg-emerald-50/[0.3] dark:hover:bg-emerald-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-emerald-400/50 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Lock size={22} />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                      isPinEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isPinEnabled ? 'PIN Activo' : 'Sin PIN'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Seguridad y Bloqueo de Sesión
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Protección con PIN numérico para el Salón del Reino, bloqueo por inactividad y modo privacidad RGPD/PII.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Auto-Bloqueo:</span>
                    <span className="font-semibold">
                      {autoLockMinutes > 0 ? `${autoLockMinutes} min inactividad` : 'Manual'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Modo Privacidad:</span>
                    <span className="font-semibold">
                      {privacyModeEnabled ? 'Activado (Protegido)' : 'Desactivado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Configurar seguridad y PIN</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 5: Nube y Sincronización */}
            <div
              onClick={() => setActiveTab('nube')}
              className="bg-white dark:bg-[#0f1623] hover:bg-sky-50/[0.3] dark:hover:bg-sky-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-sky-400/50 dark:hover:border-sky-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-sky-50 dark:bg-sky-500/10 rounded-2xl text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                    <Cloud size={22} />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                      user
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                        : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40'
                    }`}
                  >
                    {user ? 'Google Conectado' : 'Nube por ID'}
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Respaldo en la Nube
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Sincronización multi-dispositivo y respaldo en Google Firestore para todos los hermanos autorizados.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cuenta:</span>
                    <span className="font-semibold truncate max-w-[170px]">
                      {user ? user.email : 'Conexión por ID teocrático'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Guardado:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Automático en cada cambio
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                <span>Abrir sincronización en la nube</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 6: Copias de Respaldo y Cifrado */}
            <div
              onClick={() => setActiveTab('respaldos')}
              className="bg-white dark:bg-[#0f1623] hover:bg-indigo-50/[0.3] dark:hover:bg-indigo-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Database size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                    AES-256 Militar
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Copias y Respaldo Cifrado
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Descarga copias de seguridad de toda la congregación o restaura archivos protegidos por contraseña.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Formatos:</span>
                    <span className="font-semibold">.json y .orgenc.json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cifrado:</span>
                    <span className="font-semibold">AES-256-GCM + PBKDF2</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Abrir copias y archivos</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 7: Mantenimiento y Datos */}
            <div
              onClick={() => setActiveTab('mantenimiento')}
              className="bg-white dark:bg-[#0f1623] hover:bg-rose-50/[0.3] dark:hover:bg-rose-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-rose-400/50 dark:hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                    <Trash2 size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                    Herramientas
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Mantenimiento y Datos
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Eliminación de datos de demostración para iniciar en limpio, vaciado de publicadores o reinicio total.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Acciones:</span>
                    <span className="font-semibold">Limpieza y reseteo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Protección:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Nombre y horarios seguros
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                <span>Abrir herramientas de mantenimiento</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Tarjeta 8: Registro de Versiones y Changelog */}
            <div
              onClick={() => onOpenVersionModal?.()}
              className="bg-white dark:bg-[#0f1623] hover:bg-indigo-50/[0.3] dark:hover:bg-indigo-500/[0.04] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-white/[0.06] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <RefreshCw size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    v{CURRENT_APP_VERSION}
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Registro de Versiones y Changelog
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  Historial detallado de actualizaciones, verificación de despliegue y estado de compilación de la aplicación.
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04] space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Compilación:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">v{CURRENT_APP_VERSION}</span>
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
      )}

      {/* 4. VISTAS EXCLUSIVAS: CADA CATEGORÍA DENTRO DE SU PROPIO CONTENEDOR */}
      {activeTab !== 'all' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Navegación sutil y directa al Panel de Tarjetas (Único botón, sin duplicados) */}
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

          {/* CONTENEDOR 0: PREFERENCIAS DE NOTIFICACIÓN */}
          {activeTab === 'notificaciones' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shrink-0">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Preferencias de Notificación de Asignaciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personaliza con cuántos días de anticipación deseas recibir los recordatorios automáticos en este dispositivo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {notifPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Permiso del Navegador Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <BellRing className="w-4 h-4 text-amber-600" />
                      <span>Usa la guía inferior para suscribirte</span>
                    </span>
                  )}
                </div>
              </div>

              {notifFeedbackMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
                    notifFeedbackMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : notifFeedbackMsg.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{notifFeedbackMsg.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifFeedbackMsg(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                onOpenPushModal={() => setIsPushModalOpen(true)}
                onSubscribedChange={(sub) => {
                  setPushSubRecord(sub);
                  setNotifPermission(getNotificationPermission());
                  setNotifPrefs(getNotificationPreferences());
                }}
              />

              {/* Interruptor General + Selección de Publicador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mb-0.5">
                      Recordatorios Automáticos de Asignaciones
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
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
              <div className="p-5 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>Días de Anticipación del Recordatorio Automático</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Elige cuántos días antes de la fecha de tu asignación quieres que el sistema envíe el recordatorio.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-violet-600 text-white text-xs font-extrabold self-start sm:self-auto">
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
                            : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-extrabold">{option.title}</span>
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
                            isSelected ? 'text-violet-100/90' : 'text-slate-500 dark:text-slate-400'
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
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
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
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold mt-1"
                    >
                      <option value="07:00">07:00 AM (Mañana temprano)</option>
                      <option value="08:00">08:00 AM (Mañana)</option>
                      <option value="09:00">09:00 AM (Recomendado)</option>
                      <option value="12:00">12:00 PM (Mediodía)</option>
                      <option value="18:00">06:00 PM (Tarde)</option>
                      <option value="20:00">08:00 PM (Noche)</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Recordatorio adicional el mismo día de la reunión
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Tipos de Asignaciones a Notificar
                </h4>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <SplashCheckbox
                    checked={notifPrefs.notifyDuties}
                    onChange={(e) =>
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

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <SplashCheckbox
                    checked={notifPrefs.notifyCarts}
                    onChange={(e) =>
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

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <SplashCheckbox
                    checked={notifPrefs.soundEnabled}
                    onChange={(e) =>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
          )}

          {/* CONTENEDOR 1: HORARIOS Y SALÓN */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Información y Horarios de Reunión
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Parámetros oficiales del Salón del Reino y agenda semanal
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nombre de la Congregación
                  </label>
                  <input
                    type="text"
                    required
                    value={congName}
                    onChange={(e) => {
                      setCongName(e.target.value);
                      userHasEditedRef.current = true;
                    }}
                    placeholder="Ej. Congregación Central"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Este nombre oficial es el que se mostrará en el banner superior, programas y hojas S-89.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Dirección del Salón del Reino
                  </label>
                  <input
                    type="text"
                    value={hallAddress}
                    onChange={(e) => {
                      setHallAddress(e.target.value);
                      userHasEditedRef.current = true;
                    }}
                    placeholder="Ej. Av. Las Palmeras 450"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Reunión Entre Semana */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Día Entre Semana
                    </label>
                    <Select
                      value={midDay}
                      onChange={(val) => {
                        setMidDay(val);
                        userHasEditedRef.current = true;
                      }}
                      options={[
                        { value: 'Lunes', label: 'Lunes' },
                        { value: 'Martes', label: 'Martes' },
                        { value: 'Miércoles', label: 'Miércoles' },
                        { value: 'Jueves', label: 'Jueves' },
                        { value: 'Viernes', label: 'Viernes' },
                      ]}
                      placeholder="Selecciona un día..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Hora de Inicio
                    </label>
                    <IosTimePicker
                      value={midTime}
                      onChange={(val) => {
                        setMidTime(val);
                        userHasEditedRef.current = true;
                      }}
                      placeholder="Hora (ej. 19:00)"
                      accentColor="indigo"
                      presets={['18:30', '19:00', '19:30', '20:00']}
                    />
                  </div>
                </div>

                {/* Reunión Fin de Semana */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Día Fin de Semana
                    </label>
                    <Select
                      value={fdsDay}
                      onChange={(val) => {
                        setFdsDay(val);
                        userHasEditedRef.current = true;
                      }}
                      options={[
                        { value: 'Sábado', label: 'Sábado' },
                        { value: 'Domingo', label: 'Domingo' },
                      ]}
                      placeholder="Selecciona un día..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Hora de Inicio
                    </label>
                    <IosTimePicker
                      value={fdsTime}
                      onChange={(val) => {
                        setFdsTime(val);
                        userHasEditedRef.current = true;
                      }}
                      placeholder="Hora (ej. 10:00)"
                      accentColor="emerald"
                      presets={['09:00', '09:30', '10:00', '16:00', '17:00']}
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Guardado dentro del contenedor */}
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Horarios'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENEDOR 2: REGLAS Y CONFLICTOS */}
          {activeTab === 'reglas' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Reglas de Detección de Cruces y Conflictos
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Define qué asignaciones simultáneas están prohibidas para que el sistema emita alertas en tiempo real
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Rule 1: Part + Duty clash */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                  <SplashCheckbox
                    checked={allowPartAndDuty}
                    onChange={(e) => setAllowPartAndDuty(e.target.checked)}
                    label="Permitir que quien tenga una parte en el programa tenga también un deber"
                    description="Si se desmarca (recomendado), el sistema generará un error crítico si alguien con parte en plataforma es asignado simultáneamente a Audio, Video, Micrófonos o Acomodador."
                  />
                </div>

                {/* Rule 2: Audio + Mic clash */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                  <SplashCheckbox
                    checked={allowAudioAndMics}
                    onChange={(e) => setAllowAudioAndMics(e.target.checked)}
                    label="Permitir que el operador de Audio/Video haga micrófonos al mismo tiempo"
                    description="Si se desmarca, evitará que una persona que debe estar en cabina técnica sea asignada a correr micrófonos o estar en la puerta."
                  />
                </div>

                {/* Rule 3: President clash */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                  <SplashCheckbox
                    checked={allowPresAndPart}
                    onChange={(e) => setAllowPresAndPart(e.target.checked)}
                    label="Permitir que el Presidente de la reunión tenga otra parte o deber"
                    description="Si se desmarca, alertará para que el presidente se enfoque exclusivamente en dirigir la reunión."
                  />
                </div>

                {/* Rule 4: Sister demonstrations */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                  <SplashCheckbox
                    checked={enforceSisters}
                    onChange={(e) => setEnforceSisters(e.target.checked)}
                    label="Exigir que la ayudante de una hermana titular sea siempre otra hermana"
                    description="Alineado con las directrices de la Escuela del Ministerio Teocrático / Vida y Ministerio."
                  />
                </div>

                {/* Consecutive weeks control */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Límite de semanas seguidas con deberes:
                    </label>
                    <select
                      value={maxConsecutiveDuty}
                      onChange={(e) => setMaxConsecutiveDuty(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={1}>1 semana (Rotación semanal estricta)</option>
                      <option value={2}>2 semanas seguidas (Recomendado)</option>
                      <option value={3}>3 semanas seguidas</option>
                      <option value={4}>4 semanas seguidas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Límite de semanas seguidas con partes:
                    </label>
                    <select
                      value={maxConsecutivePart}
                      onChange={(e) => setMaxConsecutivePart(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={1}>1 semana</option>
                      <option value={2}>2 semanas seguidas (Recomendado)</option>
                      <option value={3}>3 semanas seguidas</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Alerta de repetición de Bosquejos Públicos:
                    </label>
                    <select
                      value={warnOutlineMonths}
                      onChange={(e) => setWarnOutlineMonths(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={6}>No repetir el mismo bosquejo antes de 6 meses</option>
                      <option value={9}>No repetir el mismo bosquejo antes de 9 meses</option>
                      <option value={12}>No repetir antes de 12 meses (Recomendación Teocrática)</option>
                      <option value={18}>No repetir antes de 18 meses</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Reglas'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENEDOR 3: INVITACIONES Y ACCESO QR */}
          {activeTab === 'invitaciones' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Registro Teocrático e Invitaciones con QR
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Acceso cerrado por invitación y clave de congregación
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsSettingsWizardOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Asistente de Registro</span>
                  </button>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero-Knowledge E2EE</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Invitaciones Activas */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Invitaciones Activas
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                        {invitations.filter((i) => i.status === 'active').length} vigentes
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Genera códigos alfanuméricos o códigos QR para invitar a ancianos, siervos y publicadores sin registros públicos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSettingsInviteModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Gestionar Invitaciones y QR</span>
                  </button>
                </div>

                {/* Card 2: Unirse a la Congregación */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Unirse con Código
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        Hermano o Dispositivo
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Introduce un código de invitación recibido para vincular este dispositivo con el rol correspondiente en la congregación.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSettingsJoinModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span>Canjear Código de Invitación</span>
                  </button>
                </div>

                {/* Card 3: Credenciales Teocráticas */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Credenciales de Congregación
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                        {isCongregationPinSet ? 'Protegido' : 'Activo'}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">ID Congregación:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {settings.congregationNumber || settings.congregationId || 'No asignado'}
                          </span>
                          {(settings.congregationNumber || settings.congregationId) && (
                            <button
                              type="button"
                              onClick={() => {
                                const id = settings.congregationNumber || settings.congregationId || '';
                                navigator.clipboard.writeText(id);
                                setCopiedCongId(true);
                                setTimeout(() => setCopiedCongId(false), 2000);
                              }}
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                              title="Copiar ID de la Congregación"
                            >
                              {copiedCongId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">PIN Congregación:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">•••• (Configurado)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Tu PIN Personal:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {isPinEnabled ? '•••• (Activo)' : 'Sin configurar'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSettingsWizardOpen(true)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ver Asistente de Registro</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENEDOR 4: SEGURIDAD Y PINS */}
          {activeTab === 'seguridad' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Seguridad y Privacidad Teocrática
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Protección de datos y bloqueo de pantalla teocrática
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cifrado Local AES-256</span>
                </span>
              </div>

              {/* Banner de acceso directo a Roles Teocráticos */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Roles Teocráticos y PINs de Acceso
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        Vista Dedicada
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Asigna responsabilidades teocráticas, gestiona PINs individuales por hermano y administra solicitudes de cuentas vinculadas a pantalla completa.
                    </p>
                  </div>
                </div>
                {onNavigateToRoles && (
                  <button
                    type="button"
                    onClick={onNavigateToRoles}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow whitespace-nowrap self-stretch sm:self-auto cursor-pointer"
                  >
                    <span>Abrir Gestor de Roles</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* PIN Security Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card: PIN de Bloqueo */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        PIN de Bloqueo de Sesión
                      </span>
                      {isDemoMode ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                          Desactivado en Modo Prueba
                        </span>
                      ) : isPinEnabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                          PIN Activado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          Sin PIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isDemoMode
                        ? 'En modo prueba el bloqueo de sesión por PIN está desactivado para permitir una navegación fluida sin interrupciones.'
                        : 'Bloquea la aplicación con un código numérico para proteger la confidencialidad en computadoras compartidas del Salón del Reino o cabina de audio.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    {!isDemoMode && isPinEnabled && (
                      <button
                        type="button"
                        onClick={lockSession}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bloquear Ahora</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isDemoMode}
                      onClick={() => {
                        setPinCurrent('');
                        setPinNew('');
                        setPinConfirm('');
                        setPinModalError(null);
                        setShowPinSetupModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isPinEnabled ? 'Cambiar o Quitar PIN' : 'Configurar PIN de Seguridad'}
                    </button>
                  </div>
                </div>

                {/* Card: Auto-Bloqueo por Inactividad con Reloj y Controles Interactivos */}
                <AutoLockSettingsCard
                  onOpenPinModal={() => {
                    setPinCurrent('');
                    setPinNew('');
                    setPinConfirm('');
                    setPinModalError(null);
                    setShowPinSetupModal(true);
                  }}
                />
              </div>

              {/* Privacy Mode (PII Masking) */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block mb-0.5">
                    Modo Privacidad Teocrática de Publicadores (RGPD / PII)
                  </span>
                  <p className="text-xs text-indigo-900/70 dark:text-indigo-300/70">
                    Enmascara los números de teléfono, direcciones y notas de publicadores para evitar que queden expuestos en pantallas públicas o proyectores.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={privacyModeEnabled}
                    onChange={(e) => setPrivacyModeEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rotación Cero Conocimiento de Credenciales */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block mb-0.5">
                      Rotación Cero Conocimiento de Credenciales en la Nube
                    </span>
                    <p className="text-xs text-amber-900/70 dark:text-amber-300/70">
                      Cambia el PIN que conocen los publicadores o el PIN maestro del coordinador. Las credenciales anteriores quedan invalidadas de inmediato en Supabase.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDemoMode}
                  onClick={() => setIsRotateCredentialsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow whitespace-nowrap self-stretch sm:self-auto cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Rotar Credenciales</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENEDOR 5: NUBE Y SINCRONIZACIÓN */}
          {activeTab === 'nube' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Respaldo Automático en la Nube
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sincronización segura de la congregación con Supabase (Cifrado AES-256)
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    user
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`}
                  />
                  {user ? 'Google Conectado' : 'Respaldo automático por ID'}
                </span>
              </div>

              {cloudActionStatus && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
                    cloudActionStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {cloudActionStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{cloudActionStatus.msg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCloudActionStatus(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {user ? (
                      <>
                        <span>Conectado como:</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                          {user.email}
                        </span>
                      </>
                    ) : (
                      <span>Modo Local / Sincronización por ID de Congregación</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                    {user
                      ? 'Tus datos de la congregación (publicadores, reuniones, programas CLM, asignaciones y ajustes) se respaldan automáticamente en la nube bajo el ID de tu congregación, sin importar la cuenta con la que entres.'
                      : 'Tus datos de la congregación (ID y PIN) se respaldan automáticamente en la nube bajo el ID de la congregación en cada cambio guardado.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={handleUploadToGoogle}
                        disabled={isSyncingCloud}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-60"
                        title="Subir y guardar todos los datos locales actuales en tu cuenta de Google Firestore"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isSyncingCloud ? 'Guardando...' : 'Subir datos a Google'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadFromGoogle}
                        disabled={isSyncingCloud}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-60"
                        title="Descargar y restaurar datos teocráticos desde Google Firestore"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Restaurar de Google</span>
                      </button>
                      <button
                        type="button"
                        onClick={signOutUser}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Desconectar cuenta de Google"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Desconectar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUploadToGoogle}
                      disabled={isSyncingCloud}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>{isSyncingCloud ? 'Guardando...' : 'Guardar ahora en la nube'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* PANEL FASE 4: SINCRONIZACIÓN GRANULAR COLABORATIVA POR SUBCOLECCIONES */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Fase 4: Sincronización Granular Colaborativa
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Subcolecciones en Vivo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cada departamento teocrático sincroniza su propia subcolección en Firestore sin sobreescribir el trabajo de otros hermanos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleCheckGranular}
                      disabled={isCheckingGranular || isMigratingSubcollections}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Verifica el número de documentos reales sincronizados en cada subcolección de Firestore"
                    >
                      {isCheckingGranular ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Diagnosticar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMigrateSubcollections}
                      disabled={isCheckingGranular || isMigratingSubcollections}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Migra o verifica todos los registros hacia subcolecciones granulares en Firestore"
                    >
                      {isMigratingSubcollections ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isMigratingSubcollections ? 'Sincronizando...' : 'Migrar a Subcolecciones'}</span>
                    </button>
                  </div>
                </div>

                {granularStatusMessage && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
                      granularStatusMessage.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : granularStatusMessage.type === 'info'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {granularStatusMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{granularStatusMessage.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGranularStatusMessage(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Grid con las 6 subcolecciones modulares */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Subcolección 1: Publicadores */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        <Users className="w-4 h-4" />
                        <span>/publishers</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {granularSyncStats?.publishersCount ?? publishers.length} docs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Publicadores y Tarjetas S-21
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Coordinador & Secretario • Escucha y guarda independientemente.
                    </p>
                  </div>

                  {/* Subcolección 2: Semanas VyM */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <Calendar className="w-4 h-4" />
                        <span>/weeks</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {granularSyncStats?.weeksCount ?? weeks.length} semanas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Vida y Ministerio & Deberes
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supt. VyM & Coordinador • Cada semana es un documento aislado.
                    </p>
                  </div>

                  {/* Subcolección 3: Territorios */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <MapPin className="w-4 h-4" />
                        <span>/territories</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {granularSyncStats?.territoriesCount ?? territories.length} territorios
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Territorios y Manzanas S-13
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Siervo de Territorios • Actualizaciones sin bloqueo concurrente.
                    </p>
                  </div>

                  {/* Subcolección 4: Tablero de Anuncios */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
                        <Bell className="w-4 h-4" />
                        <span>/notices</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                        {granularSyncStats?.noticesCount ?? notices.length} anuncios
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Tablero de Anuncios Oficial
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Lectura congregacional y redacción exclusiva de ancianos.
                    </p>
                  </div>

                  {/* Subcolección 5: Cuentas */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                        <CreditCard className="w-4 h-4" />
                        <span>/accounts</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                        {transactions.length} txs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Libro de Cuentas S-26 y Auditorías
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Siervo de Cuentas • Privacidad garantizada por reglas de seguridad.
                    </p>
                  </div>

                  {/* Subcolección 6: Literatura */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs">
                        <BookOpen className="w-4 h-4" />
                        <span>/literature</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                        {literatureItems.length} items
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Almacén de Literatura e Inventario
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Siervo de Literatura • Pedidos y recuentos físicos aislados.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Colaboración Concurrente Segura:</span> Gracias a la Fase 4, si varios hermanos (coordinador, secretario, siervos) editan el sistema simultáneamente desde distintas computadoras o teléfonos, no hay riesgo de sobreescribir el trabajo ajeno.
                  </div>
                </div>
              </div>

              {/* PANEL SUPABASE: SINCRONIZACIÓN CIFRADA DE CERO CONOCIMIENTO (AES-256-GCM) */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Cero Conocimiento: Supabase (AES-256-GCM)
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Cifrado Militar en Dispositivo
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Los datos se cifran con tu PIN antes de enviarse a Supabase. Nadie en internet ni en los servidores puede leer tus registros teocráticos.
                      </p>
                    </div>
                  </div>

                  {isDemoMode ? (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>Modo Demostración Activo:</strong> La conexión con Supabase está deshabilitada. Los datos son locales para proteger la nube.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSyncSupabase(false)}
                        disabled={isSupabaseSyncing}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Sincroniza y combina bidireccionalmente los datos con Supabase"
                      >
                        {isSupabaseSyncing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>{isSupabaseSyncing ? 'Sincronizando...' : 'Sincronizar con Supabase'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSyncSupabase(true)}
                        disabled={isSupabaseSyncing}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Fuerza la subida del snapshot local cifrado a Supabase"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Forzar Subida</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRotateCredentialsModalOpen(true)}
                        disabled={isSupabaseSyncing}
                        className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Rotar PIN de congregación o PIN maestro con revocación inmediata en la nube"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Rotar Credenciales</span>
                      </button>
                    </div>
                  )}
                </div>

                {supabaseSyncFeedback && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
                      supabaseSyncFeedback.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {supabaseSyncFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{supabaseSyncFeedback.msg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSupabaseSyncFeedback(null)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Sincronización</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {lastSupabaseSyncAt
                          ? new Date(lastSupabaseSyncAt).toLocaleString('es-MX', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Pendiente de sincronizar'}
                      </span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cifrado de Payload</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                      <span>AES-256-GCM (100k PBKDF2)</span>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolución de Conflictos</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-500" />
                      <span>Fusión Inteligente No Destructiva</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENEDOR 6: COPIAS Y RESGUARDOS CIFRADOS */}
          {activeTab === 'respaldos' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Copias de Seguridad y Respaldo Cifrado
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Descargas locales y protección con cifrado militar AES-256
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exporta todos los datos teocráticos de la congregación. Puedes proteger tu copia con una clave de cifrado militar AES-256 para que nadie sin la contraseña pueda leer el archivo ni acceder a los registros.
              </p>

              {importStatus && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold animate-fade-in">
                  {importStatus}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Encrypted Export Button */}
                <button
                  type="button"
                  onClick={() => {
                    setExportPassphrase('');
                    setConfirmExportPassphrase('');
                    setEncryptExportError(null);
                    setShowEncryptExportModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-indigo-200" />
                  <span>Exportar Respaldo Cifrado (.enc.json)</span>
                </button>

                {/* Standard JSON Export */}
                <button
                  type="button"
                  onClick={exportBackupJSON}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar JSON Estándar</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,.orgenc.json,.enc.json"
                  className="hidden"
                />

                {/* Restore Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Restaurar Copia de Seguridad</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENEDOR 7: MANTENIMIENTO Y DATOS */}
          {activeTab === 'mantenimiento' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Gestión de Datos y Limpieza de Pruebas
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Herramientas administrativas para restablecer la información de la congregación
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Herramientas para eliminar los datos de prueba o demostración cargados en la aplicación, o reiniciar la información para comenzar desde cero con tu congregación real.
              </p>

              {cleanActionStatus && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
                    cleanActionStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {cleanActionStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{cleanActionStatus.msg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCleanActionStatus(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Opción 1: Eliminar datos de prueba del Salón */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-1">
                      <Trash2 className="w-4 h-4 text-amber-600" />
                      <span>Eliminar Datos de Prueba</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Limpia los circuitos de muestra del tablero eléctrico, fichas de mantenimiento de prueba, registros y asignaciones ficticias. <strong>Conserva el nombre de tu congregación y los horarios de reunión intactos.</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCleanSampleModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Datos de Prueba</span>
                  </button>
                </div>

                {/* Opción 2: Vaciar publicadores de prueba */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Vaciar Publicadores de Prueba</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Elimina todos los publicadores de prueba agregados previamente si necesitas importar o escribir tu lista de hermanos real desde cero.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClearPublishersModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Vaciar Lista de Publicadores</span>
                  </button>
                </div>
              </div>

              {/* Zona de peligro */}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Zona de Peligro: Restablecer a Valores de Fábrica</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Borra absolutamente todos los datos locales y en la nube y vuelve a la pantalla inicial de bienvenida.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetConfirmationText('');
                    setShowResetAllModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Restablecer Todo a Cero
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: SETUP PIN MODAL */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {isPinEnabled ? 'Modificar PIN de Seguridad' : 'Configurar PIN de Seguridad'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPinSetupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3.5 text-xs">
              {pinModalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold">
                  {pinModalError}
                </div>
              )}

              {isPinEnabled && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PIN Actual:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pinCurrent}
                    onChange={(e) => setPinCurrent(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ingrese su PIN actual"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center tracking-widest text-base"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo PIN (4 a 8 dígitos numéricos):
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinNew}
                  onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                  placeholder={isPinEnabled ? 'Dejar en blanco para desactivar PIN' : 'Ej: 1234'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center tracking-widest text-base"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isPinEnabled
                    ? 'Si deja el campo vacío, se eliminará el PIN y la aplicación no se bloqueará.'
                    : 'Use un PIN fácil de recordar para los hermanos autorizados en el Salón.'}
                </span>
              </div>

              {pinNew && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar Nuevo PIN:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repita el nuevo PIN"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center tracking-widest text-base"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPinSetupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                >
                  {isPinEnabled && !pinNew ? 'Desactivar PIN' : 'Guardar PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPORT ENCRYPTED BACKUP MODAL */}
      {showEncryptExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileKey className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Exportar Respaldo con Cifrado Militar
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEncryptExportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExportEncryptedSubmit} className="space-y-3.5 text-xs">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se aplicará cifrado <strong>AES-256-GCM</strong> con 100.000 iteraciones de derivación PBKDF2. El archivo descargado no podrá ser abierto por nadie que no conozca esta contraseña.
              </p>

              {encryptExportError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold">
                  {encryptExportError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Cifrado:
                </label>
                <div className="relative">
                  <input
                    type={showExportPassphrase ? 'text' : 'password'}
                    value={exportPassphrase}
                    onChange={(e) => setExportPassphrase(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPassphrase(!showExportPassphrase)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showExportPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Contraseña:
                </label>
                <input
                  type={showExportPassphrase ? 'text' : 'password'}
                  value={confirmExportPassphrase}
                  onChange={(e) => setConfirmExportPassphrase(e.target.value)}
                  placeholder="Repita la contraseña"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEncryptExportModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isExportingEncrypted}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isExportingEncrypted ? 'Cifrando...' : 'Descargar Archivo Cifrado'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DECRYPT AND RESTORE MODAL */}
      {showDecryptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Archivo Cifrado Detectado
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDecryptModal(false);
                  setPendingEncryptedJson(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDecryptRestore} className="space-y-3.5 text-xs">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El archivo seleccionado está protegido con cifrado AES-256. Ingrese la contraseña con la que fue creado para descifrarlo en su navegador y restaurar los datos:
              </p>

              {decryptModalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold">
                  {decryptModalError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Descifrado:
                </label>
                <div className="relative">
                  <input
                    type={showDecryptPassphrase ? 'text' : 'password'}
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    placeholder="Ingrese la contraseña del respaldo"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowDecryptPassphrase(!showDecryptPassphrase)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showDecryptPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowDecryptModal(false);
                    setPendingEncryptedJson(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDecrypting || !decryptPassphrase}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isDecrypting ? 'Descifrando...' : 'Descifrar y Restaurar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR DATOS DE PRUEBA */}
      {showCleanSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Eliminar Datos de Prueba
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCleanSampleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar los datos de prueba? Esta acción limpiará:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-5">
              <li>Circuitos de demostración del cuadro eléctrico.</li>
              <li>Fichas de mantenimiento de muestra.</li>
              <li>Asignaciones y registros de demostración en las semanas.</li>
              <li>Avisos y transacciones de prueba.</li>
            </ul>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              ✓ El nombre de tu congregación (<strong>{settings.congregationName || 'Tu congregación'}</strong>) y los horarios de tus reuniones se mantendrán guardados.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCleanSampleModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCleaning}
                onClick={async () => {
                  setIsCleaning(true);
                  try {
                    await cleanSampleData();
                    setShowCleanSampleModal(false);
                    setCleanActionStatus({
                      type: 'success',
                      msg: '¡Datos de prueba eliminados exitosamente! Tu congregación y horarios están protegidos.',
                    });
                  } catch (e: any) {
                    setCleanActionStatus({
                      type: 'error',
                      msg: e?.message || 'Error al eliminar datos de prueba.',
                    });
                  } finally {
                    setIsCleaning(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCleaning ? 'Eliminando...' : 'Sí, Eliminar Datos de Prueba'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VACIAR PUBLICADORES */}
      {showClearPublishersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Vaciar Publicadores de Prueba
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowClearPublishersModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Deseas vaciar la lista de publicadores? Si agregaste nombres de prueba para ensayos, esto te permitirá comenzar con una lista completamente limpia para agregar o importar a los publicadores reales de tu congregación.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearPublishersModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCleaning}
                onClick={async () => {
                  setIsCleaning(true);
                  try {
                    await clearAllPublishers();
                    setShowClearPublishersModal(false);
                    setCleanActionStatus({
                      type: 'success',
                      msg: 'Directorio de publicadores vaciado con éxito.',
                    });
                  } catch (e: any) {
                    setCleanActionStatus({
                      type: 'error',
                      msg: e?.message || 'Error al vaciar publicadores.',
                    });
                  } finally {
                    setIsCleaning(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isCleaning ? 'Vaciando...' : 'Sí, Vaciar Publicadores'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET TOTAL */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-950 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm">
                  Restablecer Toda la Aplicación
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta acción borrará <strong>toda la congregación</strong>, configuración, contraseñas y registros almacenados. Volverás al asistente inicial de registro.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Escribe <strong>RESETEAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="RESETEAR"
                className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-mono text-center text-sm font-bold tracking-widest uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resetConfirmationText.trim().toUpperCase() !== 'RESETEAR'}
                onClick={async () => {
                  setShowResetAllModal(false);
                  await deleteAllRegisteredCongregations();
                  window.location.reload();
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-40 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirmar Restablecimiento Total</span>
              </button>
            </div>
          </div>
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
