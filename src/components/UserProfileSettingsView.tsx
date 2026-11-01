import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useSecurity } from '../context/SecurityContext';
import { supabase } from '../lib/supabase';
import { PreferredContactMethod, ContactTimePreference } from '../types';
import {
  User,
  Camera,
  Image as ImageIcon,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Cloud,
  CloudCheck,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Check,
  Send,
  Sun,
  Sunset,
  Moon,
  Building2,
  LogOut,
  Lock,
  KeyRound,
  Smartphone,
  ArrowLeft,
  ChevronRight,
  History,
  Eye,
  EyeOff,
  Laptop,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  sendTestNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  subscribeToPushNotifications,
  getPushSubscriptionRecord,
} from '../services/notificationService';
import { PushSubscriptionModal } from './PushSubscriptionModal';
import { PushNotificationQuickGuideCard } from './PushNotificationQuickGuideCard';
import {
  ProfileDevicesAndCodesSection,
  extractPlatformAndBrowser,
} from './ProfileDevicesAndCodesSection';
import { PinManagementModal } from './PinManagementModal';
import { TwoFactorSetupModal } from './TwoFactorSetupModal';
import { isSafeDemoMode, setSecureLocalPin } from '../utils/theocraticSecurity';

export type ProfileSectionId =
  | 'datos_contacto'
  | 'credenciales'
  | 'dispositivos'
  | 'seguridad'
  | 'avatar'
  | 'preferencias_contacto'
  | 'notificaciones';

// Preset avatar styles with clean SVG iconography and theocratic themes
const AVATAR_PRESETS = [
  {
    id: 'anciano',
    name: 'Anciano / Biblia',
    icon: '📖',
    bgColor: 'bg-indigo-600',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%234c3aed"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">📖</text></svg>',
  },
  {
    id: 'salon',
    name: 'Salón del Reino',
    icon: '🏛️',
    bgColor: 'bg-zinc-700',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23334155"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🏛️</text></svg>',
  },
  {
    id: 'ministerio',
    name: 'Predicación',
    icon: '💼',
    bgColor: 'bg-emerald-600',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23059669"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">💼</text></svg>',
  },
  {
    id: 'orador',
    name: 'Atril & Discursos',
    icon: '🎙️',
    bgColor: 'bg-blue-600',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%232563eb"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🎙️</text></svg>',
  },
  {
    id: 'cabina',
    name: 'Cabina Audio/Video',
    icon: '🎧',
    bgColor: 'bg-cyan-700',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%230e7490"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🎧</text></svg>',
  },
  {
    id: 'acomodador',
    name: 'Acomodador',
    icon: '🤝',
    bgColor: 'bg-amber-600',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23d97706"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🤝</text></svg>',
  },
  {
    id: 'campo',
    name: 'Precursor',
    icon: '🌿',
    bgColor: 'bg-teal-600',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%230d9488"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🌿</text></svg>',
  },
  {
    id: 'esperanza',
    name: 'Paz Teocrática',
    icon: '🕊️',
    bgColor: 'bg-violet-600',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%237c3aed"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🕊️</text></svg>',
  },
];

export const UserProfileSettingsView: React.FC = () => {
  const {
    user,
    userProfile,
    updateUserProfile,
    effectiveRoleInfo,
    signInWithGoogle,
    signOutUser,
    currentPublisherId,
    currentBrotherName,
    publisherPinsList,
    enableTwoFactorForPublisher,
    disableTwoFactorForPublisher,
  } = useAuth();
  const {
    settings,
    updateSettings,
    isDemoMode,
    exitDemoMode,
    weeks,
    cartShifts,
    cartLocations,
    publishersMap,
    publishers,
    isOnline,
    syncStatus,
    isSupabaseSyncing,
    offlineQueueStats,
    syncNowWithSupabase,
    syncOfflineQueueNow,
  } = useCongregation();
  const { activeSessions, currentDeviceId, revokeSession, revokeAllOtherSessions } =
    useSecurity();

  // Active drill-down section (null = main Cards Hub)
  const [activeSection, setActiveSection] = useState<ProfileSectionId | null>(null);
  const [isForcingProfileSync, setIsForcingProfileSync] = useState(false);
  const [profileSyncFeedback, setProfileSyncFeedback] = useState<string | null>(null);

  const isProfileActivelySyncing =
    isForcingProfileSync ||
    isSupabaseSyncing ||
    syncStatus === 'saving' ||
    (offlineQueueStats?.syncingCount ?? 0) > 0;

  const profileSyncState: 'syncing' | 'online' | 'offline' = isProfileActivelySyncing
    ? 'syncing'
    : !isOnline || syncStatus === 'offline'
    ? 'offline'
    : 'online';

  const handleForceProfileSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isForcingProfileSync) return;
    setIsForcingProfileSync(true);
    setProfileSyncFeedback('Sincronizando...');
    const minSpin = new Promise((r) => window.setTimeout(r, 700));
    try {
      await Promise.all([
        syncOfflineQueueNow ? syncOfflineQueueNow().catch(() => null) : Promise.resolve(null),
        syncNowWithSupabase ? syncNowWithSupabase(true).catch(() => null) : Promise.resolve(null),
        minSpin,
      ]);
      setProfileSyncFeedback(isOnline ? '¡Sincronizado ahora!' : 'Guardado en modo local');
    } catch {
      setProfileSyncFeedback(isOnline ? 'Sincronización verificada' : 'Sin conexión');
    } finally {
      setIsForcingProfileSync(false);
      window.setTimeout(() => setProfileSyncFeedback(null), 3000);
    }
  };

  const handleProfileLogout = async () => {
    try {
      await signOutUser();
    } catch {}
    try {
      if (isDemoMode && exitDemoMode) exitDemoMode();
      localStorage.removeItem('kongre_has_entered_app');
      localStorage.removeItem('kongre_is_registered_congregation');
      localStorage.removeItem('kongre_is_guest');
      localStorage.removeItem('kongre_demo_mode');
      localStorage.removeItem('kongre_user_profile_guest');
      localStorage.removeItem('kongre_user_profile_active');
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem('kongre_current_publisher_id_v2');
      setSecureLocalPin('kongre_session_pin_v2', null);
      localStorage.removeItem('kongre_active_role_v1');
      localStorage.removeItem('kongre_active_roles_v1');
      localStorage.removeItem('kongre_role_session_sig_v1');
      sessionStorage.removeItem('kongre_session_locked');
      sessionStorage.setItem('kongre_show_landing', 'true');
    } catch {}
    window.location.hash = '#portal';
    window.location.reload();
  };

  const handleLockSession = () => {
    sessionStorage.setItem('kongre_session_locked', 'true');
    window.location.hash = '#bloqueo';
    window.location.reload();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<PreferredContactMethod>('whatsapp');
  const [contactTimePreference, setContactTimePreference] =
    useState<ContactTimePreference>('anytime');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  // Password Change Interactive Card State
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Web Push Notification State
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [notifPrefs, setNotifPrefs] = useState(() => getNotificationPreferences());
  const [pushSubRecord, setPushSubRecord] = useState(() => getPushSubscriptionRecord());
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);

  const resolvedPublisherIdFor2FA =
    currentPublisherId ||
    publishers.find(
      (p) =>
        p.name.toLowerCase().trim() ===
        (displayName || currentBrotherName || user?.displayName || '').toLowerCase().trim()
    )?.id ||
    publishers[0]?.id ||
    '';

  const currentPinRecord = publisherPinsList.find(
    (p) => p.publisherId === resolvedPublisherIdFor2FA
  );
  const is2FAEnabled = Boolean(currentPinRecord?.twoFactorEnabled);
  const [testNotifResult, setTestNotifResult] = useState<{
    success: boolean;
    msg: string;
  } | null>(null);

  // Calculate my active sessions (browsers & platforms) for the Hub Card summary and remote logout
  const myActiveSessions = useMemo(() => {
    const myName = (displayName || currentBrotherName || '').toLowerCase().trim();
    const myPubId = (currentPublisherId || '').trim();
    return activeSessions.filter((s) => {
      if (s.status !== 'active') return false;
      if (s.id === currentDeviceId || s.isCurrentDevice) return true;
      if (s.publisherId === 'pub-1') return true;
      if (myPubId && s.publisherId && s.publisherId === myPubId) return true;
      if (myName && s.name && s.name.toLowerCase().trim() === myName) return true;
      return false;
    });
  }, [activeSessions, currentDeviceId, displayName, currentBrotherName, currentPublisherId]);

  const myActiveSessionsCount = Math.max(1, myActiveSessions.length);

  const myRemoteActiveSessions = useMemo(
    () => myActiveSessions.filter((s) => s.id !== currentDeviceId && !s.isCurrentDevice),
    [myActiveSessions, currentDeviceId]
  );

  const activeBrowsersSummary = useMemo(() => {
    const browsers = Array.from(
      new Set(myActiveSessions.map((s) => extractPlatformAndBrowser(s).browser))
    );
    return browsers.length > 0 ? browsers.join(', ') : 'Navegador actual';
  }, [myActiveSessions]);

  const activePlatformsSummary = useMemo(() => {
    const platforms = Array.from(
      new Set(myActiveSessions.map((s) => extractPlatformAndBrowser(s).platform))
    );
    return platforms.length > 0 ? platforms.join(', ') : 'Plataforma actual';
  }, [myActiveSessions]);

  const handleSendTestNotification = async () => {
    setIsSendingTestNotif(true);
    setTestNotifResult(null);
    try {
      const ok = await sendTestNotification();
      setTestNotifResult({
        success: ok,
        msg: ok
          ? '¡Notificación de prueba enviada con éxito! Revisa la esquina de tu pantalla o barra de avisos.'
          : 'No se pudo enviar la notificación. Verifica que los permisos estén habilitados en tu navegador.',
      });
    } catch (e: any) {
      setTestNotifResult({
        success: false,
        msg: e?.message || 'Error al enviar notificación de prueba.',
      });
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.trim().length < 6) {
      setPasswordStatus({
        type: 'error',
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'La confirmación de contraseña no coincide.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });
        if (error) {
          throw error;
        }
        setPasswordStatus({
          type: 'success',
          message: '¡Contraseña de cuenta actualizada y sincronizada correctamente!',
        });
      } else {
        // Local / Demo profile password update acknowledgment
        localStorage.setItem('kongre_profile_pwd_updated_at', new Date().toISOString());
        setPasswordStatus({
          type: 'success',
          message:
            'Contraseña de acceso actualizada en este perfil. Recuerda que para cambiar tu PIN teocrático debes usar la tarjeta «Solicitar Cambio de PIN».',
        });
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setIsPasswordFormOpen(false);
      }, 2200);
    } catch (err: any) {
      setPasswordStatus({
        type: 'error',
        message:
          err?.message || 'No se pudo actualizar la contraseña. Verifica tu sesión activa.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlTemp, setCustomUrlTemp] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Initialize form when userProfile changes
  useEffect(() => {
    const activeIsDemo =
      isDemoMode ||
      settings?.congregationId?.includes('DEMO') ||
      settings?.congregationNumber?.includes('DEMO') ||
      isSafeDemoMode(
        settings?.congregationNumber || settings?.congregationId,
        settings?.isRegistered
      );

    if (activeIsDemo) {
      setDisplayName(userProfile?.displayName || settings?.coordinatorName || 'Carlos Mendoza');
      setPhotoURL(userProfile?.photoURL || '');
      setPhone(userProfile?.phone || settings?.coordinatorPhone || '+52 55 1234 5678');
      setSecondaryEmail(userProfile?.secondaryEmail || 'carlos.mendoza@kongre-demo.org');
      setPreferredContactMethod(userProfile?.preferredContactMethod || 'whatsapp');
      setContactTimePreference(userProfile?.contactTimePreference || 'anytime');
      setNotificationsEnabled(userProfile?.notificationsEnabled ?? true);
      setNotes(userProfile?.notes || 'Coordinador en Modo Demostración');
      return;
    }

    const fallbackPhoto =
      userProfile?.photoURL ||
      user?.photoURL ||
      settings?.coordinatorPhotoURL ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_photo') ||
          localStorage.getItem('kongre_google_photo') ||
          localStorage.getItem('kongre_coordinator_photo')
        : '') ||
      '';

    const fallbackName =
      userProfile?.displayName ||
      user?.displayName ||
      settings?.coordinatorName ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_user_confirmed_name') ||
          localStorage.getItem('kongre_google_display_name') ||
          localStorage.getItem('kongre_current_brother_name')
        : '') ||
      '';

    if (userProfile) {
      setDisplayName(userProfile.displayName || fallbackName);
      setPhotoURL(userProfile.photoURL || fallbackPhoto);
      setPhone(userProfile.phone || settings?.coordinatorPhone || '');
      setSecondaryEmail(userProfile.secondaryEmail || '');
      setPreferredContactMethod(userProfile.preferredContactMethod || 'whatsapp');
      setContactTimePreference(userProfile.contactTimePreference || 'anytime');
      setNotificationsEnabled(userProfile.notificationsEnabled ?? true);
      setNotes(userProfile.notes || '');
    } else if (user) {
      setDisplayName(
        user.displayName || fallbackName || (user.email ? user.email.split('@')[0] : '')
      );
      setPhotoURL(user.photoURL || fallbackPhoto);
      setSecondaryEmail(user.email || '');
    } else {
      if (fallbackPhoto) setPhotoURL(fallbackPhoto);
      if (fallbackName) setDisplayName(fallbackName);
    }
  }, [
    userProfile,
    user,
    settings?.coordinatorPhotoURL,
    settings?.coordinatorName,
    settings?.coordinatorPhone,
    isDemoMode,
  ]);

  // Handle image upload from disk, compress to max 256x256 WebP/JPEG dataURL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Por favor seleccione un archivo de imagen válido (JPG, PNG o WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoURL(compressedDataUrl);
        setSelectedPresetId(null);
        setShowUrlInput(false);
        setSaveError(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Select a preset avatar
  const handleSelectPreset = (preset: (typeof AVATAR_PRESETS)[0]) => {
    setPhotoURL(preset.dataUrl);
    setSelectedPresetId(preset.id);
    setShowUrlInput(false);
    setSaveError(null);
  };

  // Restore Google photo
  const handleRestoreGooglePhoto = () => {
    const googlePhoto =
      user?.photoURL ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('kongre_google_photo') ||
          localStorage.getItem('kongre_user_photo') ||
          localStorage.getItem('kongre_coordinator_photo')
        : null);

    if (googlePhoto) {
      setPhotoURL(googlePhoto);
      setSelectedPresetId(null);
      setShowUrlInput(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoURL('');
    setSelectedPresetId(null);
    setShowUrlInput(false);
    try {
      localStorage.removeItem('kongre_user_photo');
      localStorage.removeItem('kongre_google_photo');
      localStorage.removeItem('kongre_coordinator_photo');
      localStorage.removeItem('kongre_demo_user_photo');
      updateSettings({ coordinatorPhotoURL: '' });
      updateUserProfile({ photoURL: '' });
    } catch {}
  };

  // Handle custom URL input
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrlTemp.trim()) {
      setPhotoURL(customUrlTemp.trim());
      setSelectedPresetId(null);
      setShowUrlInput(false);
      setCustomUrlTemp('');
    }
  };

  // Clean phone number for WhatsApp test link
  const cleanPhoneForWa = phone.replace(/[^0-9]/g, '');

  // Save changes to profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const cleanPhoto = photoURL.trim();
    const result = await updateUserProfile({
      displayName: displayName.trim(),
      photoURL: cleanPhoto,
      phone: phone.trim(),
      secondaryEmail: secondaryEmail.trim().toLowerCase(),
      preferredContactMethod,
      contactTimePreference,
      notificationsEnabled,
      notes: notes.trim(),
    });

    const activeIsDemo =
      isDemoMode ||
      isSafeDemoMode(
        settings?.congregationNumber || settings?.congregationId,
        settings?.isRegistered
      );

    if (cleanPhoto) {
      try {
        if (!activeIsDemo) {
          localStorage.setItem('kongre_user_photo', cleanPhoto);
          localStorage.setItem('kongre_coordinator_photo', cleanPhoto);
        }
        updateSettings({ coordinatorPhotoURL: cleanPhoto });
      } catch {}
    } else {
      try {
        localStorage.removeItem('kongre_user_photo');
        localStorage.removeItem('kongre_google_photo');
        localStorage.removeItem('kongre_coordinator_photo');
        localStorage.removeItem('kongre_demo_user_photo');
        updateSettings({ coordinatorPhotoURL: '' });
      } catch {}
    }

    setIsSaving(false);

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(result.error || 'Ocurrió un error al guardar los cambios del perfil.');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const activeIsDemo =
    isDemoMode ||
    isSafeDemoMode(
      settings?.congregationNumber || settings?.congregationId,
      settings?.isRegistered
    );

  const contactMethodLabels: Record<PreferredContactMethod, string> = {
    whatsapp: 'WhatsApp',
    email: 'Correo Electrónico',
    phone: 'Llamada Telefónica',
    sms: 'Mensaje SMS',
  };

  const contactTimeLabels: Record<ContactTimePreference, string> = {
    morning: 'Mañanas (8:00 - 12:00)',
    afternoon: 'Tardes (12:00 - 18:00)',
    evening: 'Noches (18:00 - 21:30)',
    anytime: 'Cualquier horario',
  };

  const activePreset = AVATAR_PRESETS.find(
    (p) => p.id === selectedPresetId || p.dataUrl === photoURL
  );

  // Configuration Cards definition for the Interactive Cards Hub View
  const sectionCards: {
    id: ProfileSectionId;
    title: string;
    shortLabel: string;
    badgeText: string;
    subtitle: string;
    summary: string;
    details: { label: string; value: string }[];
    statusText: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      id: 'datos_contacto',
      title: 'Identidad y Datos de Contacto',
      shortLabel: 'Contacto',
      badgeText: user ? 'Nube Verificada' : 'Perfil Local',
      subtitle:
        'Nombre visible en tableros, cuenta principal, teléfono WhatsApp y correo alternativo.',
      summary: `${displayName || 'Sin nombre'} · ${phone || 'Sin teléfono registrado'}`,
      details: [
        { label: 'Nombre visible:', value: displayName || 'Sin definir' },
        { label: 'Teléfono WhatsApp:', value: phone || 'Sin registrar' },
      ],
      statusText: 'Abrir datos de contacto',
      icon: User,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'credenciales',
      title: 'Cambio de Contraseña y PIN',
      shortLabel: 'Contraseña y PIN',
      badgeText: 'Claves Protegidas',
      subtitle:
        'Actualiza la contraseña de tu cuenta o envía una solicitud de cambio de PIN personal a los ancianos.',
      summary: user
        ? `Cuenta verificada (${user.email || 'Activa'}) · PIN protegido`
        : 'Credenciales de acceso y solicitud de cambio de PIN',
      details: [
        { label: 'Contraseña de cuenta:', value: user ? 'Sincronizada' : 'Acceso local' },
        { label: 'Cambio de PIN:', value: 'Solicitud a ancianos' },
      ],
      statusText: 'Gestionar contraseña y PIN',
      icon: KeyRound,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'dispositivos',
      title: 'Sesiones Activas y Dispositivos',
      shortLabel: 'Sesiones',
      badgeText: `${myActiveSessionsCount} activa(s)`,
      subtitle:
        'Consulta qué navegadores y plataformas tienen tu sesión iniciada y cierra sesión de forma remota en cualquiera de ellos.',
      summary: `${myActiveSessionsCount} sesión(es) activa(s) · ${activeBrowsersSummary}`,
      details: [
        { label: 'Navegadores activos:', value: activeBrowsersSummary },
        { label: 'Plataformas / SO:', value: activePlatformsSummary },
      ],
      statusText: 'Gestionar sesiones activas',
      icon: History,
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60',
      iconColor: 'text-cyan-700 dark:text-cyan-400',
    },
    {
      id: 'seguridad',
      title: 'Seguridad y Verificación 2FA',
      shortLabel: 'Seguridad 2FA',
      badgeText: is2FAEnabled ? '2FA Activo' : '2FA Opcional',
      subtitle:
        'Configura Microsoft Authenticator (2FA), gestiona códigos de respaldo y controla el bloqueo de tu sesión.',
      summary: is2FAEnabled
        ? 'Microsoft Authenticator (2FA Activo) · Sesión protegida'
        : '2FA disponible para activar · Control de bloqueo y cierre',
      details: [
        {
          label: 'Microsoft Authenticator:',
          value: is2FAEnabled ? 'Activo (6 dígitos)' : 'Disponible para activar',
        },
        { label: 'Control de sesión:', value: 'Bloqueo PIN y cierre remoto' },
      ],
      statusText: 'Abrir opciones de seguridad',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'avatar',
      title: 'Foto e Insignia Teocrática',
      shortLabel: 'Foto / Avatar',
      badgeText: activePreset ? activePreset.name : photoURL ? 'Foto activa' : 'Iniciales',
      subtitle:
        'Personaliza tu fotografía de perfil o selecciona uno de los 8 avatares teocráticos predefinidos.',
      summary: activePreset
        ? `Insignia activa: ${activePreset.name}`
        : photoURL
        ? 'Fotografía personalizada activa'
        : 'Iniciales de perfil por defecto',
      details: [
        {
          label: 'Estilo actual:',
          value: activePreset ? activePreset.name : photoURL ? 'Imagen subida' : 'Iniciales',
        },
        { label: 'Insignias disponibles:', value: '8 iconos teocráticos' },
      ],
      statusText: 'Cambiar foto o insignia',
      icon: Camera,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'preferencias_contacto',
      title: 'Canales y Horarios de Contacto',
      shortLabel: 'Canales',
      badgeText: contactMethodLabels[preferredContactMethod],
      subtitle:
        'Elige por qué medio (WhatsApp, correo, llamada, SMS) y en qué horario prefieres recibir avisos.',
      summary: `${contactMethodLabels[preferredContactMethod]} · ${contactTimeLabels[contactTimePreference]}`,
      details: [
        { label: 'Canal preferido:', value: contactMethodLabels[preferredContactMethod] },
        { label: 'Horario preferido:', value: contactTimeLabels[contactTimePreference] },
      ],
      statusText: 'Configurar canal y horario',
      icon: Sliders,
      iconBg: 'bg-violet-50 dark:bg-violet-950/60',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      id: 'notificaciones',
      title: 'Avisos Push y Recordatorios',
      shortLabel: 'Alertas Push',
      badgeText: notificationsEnabled ? `${notifPrefs.notifyDaysBefore}d antes` : 'Pausadas',
      subtitle:
        'Alertas automáticas en este dispositivo antes de tus discursos, partes de reunión o turnos.',
      summary: notificationsEnabled
        ? `Activadas · Aviso ${notifPrefs.notifyDaysBefore} día(s) antes`
        : 'Notificaciones desactivadas',
      details: [
        {
          label: 'Estado en este equipo:',
          value: notificationsEnabled ? 'Alertas activas' : 'Desactivadas',
        },
        {
          label: 'Anticipación:',
          value: `${notifPrefs.notifyDaysBefore} día(s) antes`,
        },
      ],
      statusText: 'Ajustar recordatorios Push',
      icon: Bell,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const currentSectionMeta = sectionCards.find((c) => c.id === activeSection);

  return (
    <form
      onSubmit={handleSave}
      className="w-full space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200"
    >
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. COMPACT IDENTITY HEADER                                                */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-500/10 via-zinc-50/60 to-white dark:from-indigo-950/30 dark:via-zinc-900/60 dark:to-zinc-900 border border-zinc-200/80 dark:border-[#27272A] p-5 sm:p-7 shadow-sm">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Avatar + Identity Summary */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative group shrink-0">
              <div
                onClick={handleForceProfileSync}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden ring-4 shadow-lg bg-zinc-100 dark:bg-[#18181F] flex items-center justify-center transition-all group-hover:scale-[1.02] cursor-pointer ${
                  profileSyncState === 'syncing'
                    ? 'ring-amber-500 dark:ring-amber-400'
                    : profileSyncState === 'offline'
                    ? 'ring-rose-500 dark:ring-rose-400'
                    : 'ring-emerald-500 dark:ring-emerald-400'
                }`}
                title={
                  profileSyncState === 'syncing'
                    ? 'Sincronizando datos...'
                    : profileSyncState === 'offline'
                    ? 'Desconectado · Haz clic en la foto para reintentar sincronización'
                    : 'En línea · Haz clic en la foto de perfil para forzar sincronización'
                }
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName || 'Perfil'}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setPhotoURL('');
                      setSaveError('No se pudo cargar la imagen de la URL proporcionada.');
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-black tracking-wider select-none">
                    {getInitials(displayName || user?.displayName || user?.email || '')}
                  </div>
                )}
              </div>

              {/* Top-Right Sync Status & Force Sync Badge on Profile Photo */}
              <button
                type="button"
                onClick={handleForceProfileSync}
                className={`absolute -top-1.5 -right-1.5 w-8 h-8 rounded-2xl text-white shadow-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer ring-3 ring-white dark:ring-[#121216] ${
                  profileSyncState === 'syncing'
                    ? 'bg-amber-500'
                    : profileSyncState === 'offline'
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                title="Estado de sincronización · Clic para forzar sincronización"
              >
                {profileSyncState === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : profileSyncState === 'offline' ? (
                  <WifiOff className="w-3.5 h-3.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Bottom-Right Avatar Edit Button */}
              <button
                type="button"
                onClick={() => setActiveSection('avatar')}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer ring-3 ring-white dark:ring-[#121216]"
                title="Configurar foto o avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight truncate">
                {displayName || 'Tu Nombre'}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{effectiveRoleInfo.name}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>{settings?.congregationName || 'Congregación Local'}</span>
                </span>
                {profileSyncFeedback && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <CloudCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{profileSyncFeedback}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Quick status pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveSection('credenciales')}
                  className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#18181F] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-zinc-200/80 dark:border-[#27272A] text-[11px] font-bold text-zinc-700 dark:text-[#D4D4D8] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <KeyRound className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Contraseña y PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('dispositivos')}
                  className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#18181F] hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-zinc-200/80 dark:border-[#27272A] text-[11px] font-bold text-zinc-700 dark:text-[#D4D4D8] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Laptop className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span>{myActiveSessionsCount} sesión(es) activa(s)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('seguridad')}
                  className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-[#18181F] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-zinc-200/80 dark:border-[#27272A] text-[11px] font-bold text-zinc-700 dark:text-[#D4D4D8] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{is2FAEnabled ? '2FA Activo' : 'Configurar 2FA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex flex-col items-center md:items-end justify-center gap-1.5 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200/70 dark:border-[#27272A]">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
            {userProfile?.updatedAt && (
              <span className="text-[11px] text-zinc-400 dark:text-[#71717A]">
                Última sincronización:{' '}
                {new Date(userProfile.updatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-[#F4F4F5] shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-[#27272A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>Tu perfil y tus preferencias se actualizaron y sincronizaron con éxito.</span>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] flex items-center gap-3 text-xs font-semibold text-zinc-900 dark:text-[#F4F4F5] shadow-xs animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-rose-500 border border-zinc-200 dark:border-[#27272A] flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span>{saveError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE CARDS HUB VIEW (WHEN NO SPECIFIC SECTION IS OPEN)          */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait" initial={false}>
      {activeSection === null && (
        <motion.div
          key="profile-cards-hub"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Tarjetas de Configuración de Mi Perfil y Cuenta
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Selecciona cualquier tarjeta para abrir sus opciones (contraseña, PIN, sesiones activas, seguridad 2FA y preferencias).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {sectionCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveSection(card.id)}
                  className="group text-left bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#18181F] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-[#27272A] hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`p-3 rounded-2xl ${card.iconBg} ${card.iconColor} group-hover:scale-105 transition-transform flex items-center justify-center`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A]">
                        {card.badgeText}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 line-clamp-2 leading-relaxed">
                      {card.subtitle}
                    </p>

                    <div className="mt-4 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-1.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
                      {card.details.map((item, idx) => (
                        <div key={idx} className="flex justify-between gap-2">
                          <span className="text-zinc-400 dark:text-[#71717A] shrink-0">
                            {item.label}
                          </span>
                          <span className="font-semibold truncate text-zinc-900 dark:text-[#F4F4F5]">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-all">
                    <span>{card.statusText}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 3. DRILL-DOWN SECTION VIEW (WHEN USER OPENS A SPECIFIC CARD)              */}
      {/* ========================================================================= */}
      {activeSection !== null && (
        <motion.div
          key={`profile-section-${activeSection}`}
          initial={{ opacity: 0, x: 14, y: 4 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -10, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {/* Navigation Bar to return to Cards Hub or switch sections quickly */}
          <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-[#27272A] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-mobile-back-btn="true"
                onClick={() => setActiveSection(null)}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Todas las tarjetas</span>
              </button>

              {currentSectionMeta && (
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
                    {currentSectionMeta.title}
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate hidden sm:block">
                    {currentSectionMeta.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Section Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0">
              {sectionCards.map((sc) => {
                const ScIcon = sc.icon;
                const isCurr = sc.id === activeSection;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setActiveSection(sc.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isCurr
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title={sc.title}
                  >
                    <ScIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{sc.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: IDENTIDAD Y DATOS DE CONTACTO */}
          {activeSection === 'datos_contacto' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta: Identidad Personal y Cuenta */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                          Identidad en la Congregación
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                          Nombre mostrado en asignaciones y tableros.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1.5">
                        Nombre Visible *
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ej. Carlos Mendoza"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#18181F]/60 text-zinc-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-hidden transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1.5">
                        Cuenta Principal Vinculada
                      </label>
                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F]/40 text-zinc-600 dark:text-[#D4D4D8] text-xs">
                        <span className="font-mono truncate">
                          {user?.email ||
                            (activeIsDemo ? 'modo.prueba@kongre.org' : 'Sesión local activa')}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                          {user ? 'Verificada' : 'Local'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta: Medios Directos de Contacto */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                          Teléfono y Correo de Respaldo
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                          Para avisos rápidos por WhatsApp o correo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                          Teléfono / WhatsApp
                        </label>
                        {cleanPhoneForWa && (
                          <a
                            href={`https://wa.me/${cleanPhoneForWa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Probar chat</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+52 55 1234 5678"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#18181F]/60 text-zinc-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-hidden transition"
                        />
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1.5">
                        Correo Alternativo (Opcional)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={secondaryEmail}
                          onChange={(e) => setSecondaryEmail(e.target.value)}
                          placeholder="correo.alternativo@ejemplo.com"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#18181F]/60 text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-hidden transition"
                        />
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CAMBIO DE CONTRASEÑA Y SOLICITUD DE PIN */}
          {activeSection === 'credenciales' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta Interactiva 1: Cambio de Contraseña de Cuenta */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        Cuenta de Acceso
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                        Cambiar Contraseña de Acceso
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 leading-relaxed">
                        Actualiza la contraseña de tu cuenta sincronizada para proteger el inicio de sesión en tus dispositivos.
                      </p>
                    </div>

                    {passwordStatus && (
                      <div
                        className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                          passwordStatus.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        {passwordStatus.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        )}
                        <span>{passwordStatus.message}</span>
                      </div>
                    )}

                    {isPasswordFormOpen && (
                      <div className="pt-2 space-y-3 border-t border-zinc-100 dark:border-[#27272A]">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                            Contraseña actual (opcional si iniciaste con Google)
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswordText ? 'text' : 'password'}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordText((v) => !v)}
                              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              {showPasswordText ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                              Nueva contraseña *
                            </label>
                            <input
                              type={showPasswordText ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                              Confirmar nueva contraseña *
                            </label>
                            <input
                              type={showPasswordText ? 'text' : 'password'}
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              placeholder="Repite la contraseña"
                              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsPasswordFormOpen(false);
                              setPasswordStatus(null);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] text-xs font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingPassword}
                            onClick={handlePasswordChangeSubmit}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                              {isUpdatingPassword ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isPasswordFormOpen && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                        Protección mediante cifrado de sesión
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasswordFormOpen(true);
                          setPasswordStatus(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Cambiar Contraseña</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tarjeta Interactiva 2: Solicitud de Cambio de PIN a los Ancianos */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        Notifica a los Ancianos
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                        Solicitar Cambio de PIN Personal
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 leading-relaxed">
                        Por seguridad teocrática, el PIN personal no se cambia directamente desde el perfil. Si perdiste tu dispositivo, olvidaste tu clave o sospechas de acceso no autorizado, envía una solicitud formal para que los ancianos revoquen el PIN anterior y te asignen uno nuevo.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                      Revoca automáticamente el PIN anterior al aprobarse
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPinModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Solicitar Cambio de PIN</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SESIONES ACTIVAS E HISTORIAL DE DISPOSITIVOS */}
          {activeSection === 'dispositivos' && <ProfileDevicesAndCodesSection />}

          {/* SECTION 4: SEGURIDAD, 2FA Y CONTROL DE SESIÓN */}
          {activeSection === 'seguridad' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tarjeta Interactiva 1: Microsoft Authenticator (2FA) */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          is2FAEnabled
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA]'
                        }`}
                      >
                        {is2FAEnabled ? '2FA Activo' : 'Recomendado'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                        Microsoft Authenticator (2FA)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 leading-relaxed">
                        Protege tu acceso con códigos temporales de 6 dígitos (TOTP) y genera 8 claves de respaldo de emergencia.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShow2FASetupModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>
                        {is2FAEnabled
                          ? 'Reconfigurar Código QR / Claves'
                          : 'Vincular Microsoft Authenticator'}
                      </span>
                    </button>

                    {is2FAEnabled && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!resolvedPublisherIdFor2FA) return;
                          await disableTwoFactorForPublisher(resolvedPublisherIdFor2FA);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition cursor-pointer"
                      >
                        Desactivar verificación en 2 pasos
                      </button>
                    )}
                  </div>
                </div>

                {/* Tarjeta Interactiva 2: Bloqueo Rápido de Pantalla con PIN */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        Protección Local
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                        Bloquear Sesión con PIN
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 leading-relaxed">
                        Si compartes este equipo o vas a dejarlo desatendido unos minutos, bloquea la pantalla sin perder tus datos sincronizados.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={handleLockSession}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-900 dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200/80 dark:border-[#27272A]"
                    >
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Bloquear Pantalla Ahora</span>
                    </button>
                  </div>
                </div>

                {/* Tarjeta Interactiva 3: Cerrar Sesión y Revocación Rápida */}
                <div className="bg-white dark:bg-[#121216] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        Control de Acceso
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                        Cerrar Sesión en Dispositivos
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 leading-relaxed">
                        Cierra tu sesión actual en este navegador o cierra sesión remotamente en otras plataformas activas.
                      </p>
                    </div>

                    {myRemoteActiveSessions.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A]">
                          Otras sesiones remotas ({myRemoteActiveSessions.length}):
                        </span>
                        {myRemoteActiveSessions.map((rem) => {
                          const { browser, platform } = extractPlatformAndBrowser(rem);
                          return (
                            <div
                              key={rem.id}
                              className="p-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="font-bold text-zinc-800 dark:text-[#E4E4E7] truncate">
                                {browser} · {platform}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  revokeSession(
                                    rem.id,
                                    `Sesión cerrada remotamente (${browser} en ${platform})`,
                                    displayName || currentBrotherName || 'Usuario'
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/50 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
                              >
                                Cerrar remota
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection('dispositivos')}
                      className="w-full py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold transition cursor-pointer border border-cyan-200/60 dark:border-cyan-800/50"
                    >
                      Ver todos los navegadores y plataformas ({myActiveSessionsCount})
                    </button>
                    {myRemoteActiveSessions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => revokeAllOtherSessions(displayName || currentBrotherName || 'Usuario')}
                        className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer border border-amber-200/60 dark:border-amber-800/50"
                      >
                        Cerrar todas las demás sesiones ({myRemoteActiveSessions.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleProfileLogout}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión en este Dispositivo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: FOTO E INSIGNIA TEOCRÁTICA */}
          {activeSection === 'avatar' && (
            <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-6">
              <div className="pb-4 border-b border-zinc-100 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Fotografía Personal o Enlace Web</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                    Sube una imagen desde tu dispositivo, pega un enlace o selecciona una insignia teocrática.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Subir Foto</span>
                  </button>

                  {!activeIsDemo &&
                    (() => {
                      const googlePhoto =
                        user?.photoURL ||
                        (typeof window !== 'undefined'
                          ? localStorage.getItem('kongre_google_photo') ||
                            localStorage.getItem('kongre_user_photo')
                          : null);

                      if (googlePhoto && googlePhoto !== photoURL) {
                        return (
                          <button
                            type="button"
                            onClick={handleRestoreGooglePhoto}
                            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-[#27272A]"
                          >
                            <span>Usar Foto de Google</span>
                          </button>
                        );
                      }
                      return null;
                    })()}

                  <button
                    type="button"
                    onClick={() => setShowUrlInput((prev) => !prev)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-[#27272A]"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Enlace URL</span>
                  </button>

                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>
              </div>

              {showUrlInput && (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/80 border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    value={customUrlTemp}
                    onChange={(e) => setCustomUrlTemp(e.target.value)}
                    placeholder="Pegar enlace directo de imagen (https://ejemplo.com/mi-foto.jpg)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Aplicar Imagen
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Avatares e insignias teocráticas predefinidas</span>
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Pulsa una tarjeta para elegir y luego guarda cambios
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected =
                      selectedPresetId === preset.id || photoURL === preset.dataUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`group relative p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold ring-2 ring-indigo-500/20'
                            : 'bg-zinc-50/70 dark:bg-[#18181F]/50 border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-white dark:hover:bg-[#27272A] hover:border-zinc-300'
                        }`}
                        title={preset.name}
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${preset.bgColor} text-white shadow-xs transition-transform group-hover:scale-105`}
                        >
                          {preset.icon}
                        </div>
                        <span className="text-[11px] truncate w-full text-center leading-tight">
                          {preset.name.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: CANALES DE CONTACTO Y HORARIOS */}
          {activeSection === 'preferencias_contacto' && (
            <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-5">
              <div className="pb-4 border-b border-zinc-100 dark:border-[#27272A]">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <span>Canales de Contacto y Horarios</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                  Elige cómo y cuándo prefieres recibir confirmaciones y asignaciones.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                  Canal Preferido de Contacto
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'whatsapp' as PreferredContactMethod,
                      title: 'WhatsApp',
                      desc: 'Avisos directos',
                      icon: MessageSquare,
                      color: 'text-emerald-600 dark:text-emerald-400',
                      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
                    },
                    {
                      id: 'email' as PreferredContactMethod,
                      title: 'Correo',
                      desc: 'Hojas S-89 PDF',
                      icon: Mail,
                      color: 'text-indigo-600 dark:text-indigo-400',
                      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
                    },
                    {
                      id: 'phone' as PreferredContactMethod,
                      title: 'Llamada',
                      desc: 'Avisos urgentes',
                      icon: Phone,
                      color: 'text-amber-600 dark:text-amber-400',
                      bg: 'bg-amber-50 dark:bg-amber-950/60',
                    },
                    {
                      id: 'sms' as PreferredContactMethod,
                      title: 'SMS',
                      desc: 'Sin datos móviles',
                      icon: Send,
                      color: 'text-violet-600 dark:text-violet-400',
                      bg: 'bg-violet-50 dark:bg-violet-950/60',
                    },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = preferredContactMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPreferredContactMethod(method.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-zinc-50/60 dark:bg-[#18181F]/40 border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-white dark:hover:bg-[#27272A]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 rounded-lg ${method.bg} ${method.color} flex items-center justify-center`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="block text-xs font-bold leading-tight">
                            {method.title}
                          </span>
                          <span className="block text-[10.5px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                            {method.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                  Franja Horaria Preferida
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'morning' as ContactTimePreference,
                      label: 'Mañanas',
                      sub: '8:00 – 12:00',
                      icon: Sun,
                      color: 'text-amber-500',
                    },
                    {
                      id: 'afternoon' as ContactTimePreference,
                      label: 'Tardes',
                      sub: '12:00 – 18:00',
                      icon: Sunset,
                      color: 'text-orange-500',
                    },
                    {
                      id: 'evening' as ContactTimePreference,
                      label: 'Noches',
                      sub: '18:00 – 21:30',
                      icon: Moon,
                      color: 'text-indigo-400',
                    },
                    {
                      id: 'anytime' as ContactTimePreference,
                      label: 'Cualquier hora',
                      sub: 'Disponible',
                      icon: Clock,
                      color: 'text-emerald-500',
                    },
                  ].map((time) => {
                    const TimeIcon = time.icon;
                    const isSelected = contactTimePreference === time.id;
                    return (
                      <button
                        key={time.id}
                        type="button"
                        onClick={() => setContactTimePreference(time.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-zinc-50/60 dark:bg-[#18181F]/40 border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-white dark:hover:bg-[#27272A]'
                        }`}
                      >
                        <TimeIcon
                          className={`w-4 h-4 mb-2 ${isSelected ? 'text-white' : time.color}`}
                        />
                        <div>
                          <span className="block text-xs font-bold leading-tight">
                            {time.label}
                          </span>
                          <span
                            className={`block text-[10.5px] mt-0.5 ${
                              isSelected ? 'text-indigo-100' : 'text-zinc-400'
                            }`}
                          >
                            {time.sub}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1.5">
                  Notas de Disponibilidad o Circunstancias (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Disponible fines de semana sin restricción. Jueves en turno laboral vespertino."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/50 dark:bg-[#18181F]/60 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-800 focus:outline-hidden transition"
                />
              </div>
            </div>
          )}

          {/* SECTION 7: AVISOS PUSH Y RECORDATORIOS */}
          {activeSection === 'notificaciones' && (
            <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-5">
              <div className="pb-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span>Avisos Push y Recordatorios</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                    Alertas antes de tus asignaciones en este equipo.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => {
                      setNotificationsEnabled(e.target.checked);
                      saveNotificationPreferences({ enabled: e.target.checked });
                      setNotifPrefs((prev) => ({ ...prev, enabled: e.target.checked }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <PushNotificationQuickGuideCard
                publisherId={currentPublisherId || user?.uid || 'usuario'}
                publisherName={
                  displayName || currentBrotherName || user?.displayName || 'Hermano'
                }
                congregationName={settings?.congregationName}
                weeks={weeks}
                cartShifts={cartShifts}
                cartLocations={cartLocations}
                settings={settings}
                publishersMap={publishersMap}
                onOpenPushModal={() => setIsPushModalOpen(true)}
                onSubscribedChange={(sub) => {
                  setPushSubRecord(sub);
                  setBrowserPermission(getNotificationPermission());
                  setNotifPrefs(getNotificationPreferences());
                  if (sub?.active) setNotificationsEnabled(true);
                }}
                compact
              />

              <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] space-y-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-[#D4D4D8] font-semibold">
                    Anticipación de aviso:
                  </span>
                  <select
                    value={notifPrefs.notifyDaysBefore}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      saveNotificationPreferences({ notifyDaysBefore: days });
                      setNotifPrefs((prev) => ({ ...prev, notifyDaysBefore: days }));
                    }}
                    className="py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] font-bold text-zinc-800 dark:text-[#E4E4E7] cursor-pointer"
                  >
                    <option value={1}>1 día antes (24h)</option>
                    <option value={2}>2 días antes (48h)</option>
                    <option value={3}>3 días antes (72h)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-[#D4D4D8] font-semibold">
                    Incluir turnos (audio, micro, aseo):
                  </span>
                  <input
                    type="checkbox"
                    checked={notifPrefs.notifyDuties}
                    onChange={(e) => {
                      saveNotificationPreferences({ notifyDuties: e.target.checked });
                      setNotifPrefs((prev) => ({ ...prev, notifyDuties: e.target.checked }));
                    }}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>

                {isNotificationSupported() && browserPermission === 'granted' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSendingTestNotif}
                      onClick={handleSendTestNotification}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#E4E4E7] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {isSendingTestNotif
                          ? 'Enviando prueba...'
                          : 'Enviar Notificación de Prueba'}
                      </span>
                    </button>
                    {testNotifResult && (
                      <p
                        className={`mt-2 text-[11px] font-semibold text-center ${
                          testNotifResult.success
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {testNotifResult.msg}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* MODALS */}
      <TwoFactorSetupModal
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        publisherId={resolvedPublisherIdFor2FA}
        publisherName={
          displayName || currentBrotherName || user?.displayName || 'Publicador'
        }
        onSuccess={async (secret, backupCodes) => {
          if (!resolvedPublisherIdFor2FA) return false;
          const res = await enableTwoFactorForPublisher(
            resolvedPublisherIdFor2FA,
            secret,
            backupCodes
          );
          return res.success;
        }}
      />

      <PinManagementModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        publisherId={currentPublisherId || user?.uid || 'publicador'}
        publisherName={
          displayName || currentBrotherName || user?.displayName || 'Publicador'
        }
        publisherEmail={user?.email || secondaryEmail}
        role={effectiveRoleInfo?.id}
      />

      <PushSubscriptionModal
        isOpen={isPushModalOpen}
        onClose={() => {
          setIsPushModalOpen(false);
          setBrowserPermission(getNotificationPermission());
          setNotifPrefs(getNotificationPreferences());
          setPushSubRecord(getPushSubscriptionRecord());
        }}
        publisherId={currentPublisherId || user?.uid || 'usuario'}
        publisherName={displayName || currentBrotherName || user?.displayName || 'Hermano'}
        congregationName={settings?.congregationName}
        weeks={weeks}
        cartShifts={cartShifts}
        cartLocations={cartLocations}
        settings={settings}
        publishersMap={publishersMap}
        onSubscriptionChange={(sub) => {
          setPushSubRecord(sub);
          setBrowserPermission(getNotificationPermission());
          setNotifPrefs(getNotificationPreferences());
        }}
      />
    </form>
  );
};
