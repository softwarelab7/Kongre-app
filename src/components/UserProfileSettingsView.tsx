import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { UserProfile, PreferredContactMethod, ContactTimePreference } from '../types';
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
  Info,
  Send,
  Sun,
  Sunset,
  Moon,
  Building2,
  LogOut,
  Lock,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  getNotificationPreferences,
  saveNotificationPreferences,
  subscribeToPushNotifications,
  getPushSubscriptionRecord,
} from '../services/notificationService';
import { PushSubscriptionModal } from './PushSubscriptionModal';
import { PushNotificationQuickGuideCard } from './PushNotificationQuickGuideCard';
import { isSafeDemoMode, setSecureLocalPin } from '../utils/theocraticSecurity';

// Preset avatar styles with clean SVG iconography and theocratic themes
const AVATAR_PRESETS = [
  {
    id: 'anciano',
    name: 'Anciano / Biblia',
    icon: '📖',
    bgColor: 'bg-indigo-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%234c3aed"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">📖</text></svg>',
  },
  {
    id: 'salon',
    name: 'Salón del Reino',
    icon: '🏛️',
    bgColor: 'bg-zinc-700',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23334155"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🏛️</text></svg>',
  },
  {
    id: 'ministerio',
    name: 'Predicación',
    icon: '💼',
    bgColor: 'bg-emerald-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23059669"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">💼</text></svg>',
  },
  {
    id: 'orador',
    name: 'Atril & Discursos',
    icon: '🎙️',
    bgColor: 'bg-blue-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%232563eb"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🎙️</text></svg>',
  },
  {
    id: 'cabina',
    name: 'Cabina Audio/Video',
    icon: '🎧',
    bgColor: 'bg-cyan-700',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%230e7490"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🎧</text></svg>',
  },
  {
    id: 'acomodador',
    name: 'Acomodador',
    icon: '🤝',
    bgColor: 'bg-amber-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23d97706"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🤝</text></svg>',
  },
  {
    id: 'campo',
    name: 'Precursor',
    icon: '🌿',
    bgColor: 'bg-teal-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%230d9488"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🌿</text></svg>',
  },
  {
    id: 'esperanza',
    name: 'Paz Teocrática',
    icon: '🕊️',
    bgColor: 'bg-violet-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%237c3aed"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">🕊️</text></svg>',
  },
];

export const UserProfileSettingsView: React.FC = () => {
  const { user, userProfile, updateUserProfile, effectiveRoleInfo, signInWithGoogle, signOutUser, currentPublisherId, currentBrotherName } = useAuth();
  const { settings, updateSettings, isDemoMode, exitDemoMode, weeks, cartShifts, cartLocations, publishersMap } = useCongregation();

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
  const [preferredContactMethod, setPreferredContactMethod] = useState<PreferredContactMethod>('whatsapp');
  const [contactTimePreference, setContactTimePreference] = useState<ContactTimePreference>('anytime');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  // Web Push Notification State
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => getNotificationPermission());
  const [notifPrefs, setNotifPrefs] = useState(() => getNotificationPreferences());
  const [pushSubRecord, setPushSubRecord] = useState(() => getPushSubscriptionRecord());
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
  const [testNotifResult, setTestNotifResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleRequestBrowserPermission = async () => {
    const res = await subscribeToPushNotifications({
      publisherId: currentPublisherId || user?.uid || 'usuario',
      publisherName: displayName || currentBrotherName || user?.displayName || 'Hermano',
      congregationName: settings?.congregationName,
      weeks,
      cartShifts,
      cartLocations,
      settings,
      publishersMap,
    });
    setBrowserPermission(res.permission);
    if (res.success && res.subscription) {
      setPushSubRecord(res.subscription);
      setNotifPrefs(getNotificationPreferences());
      setNotificationsEnabled(true);
    }
  };

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
      isSafeDemoMode(settings?.congregationNumber || settings?.congregationId, settings?.isRegistered);

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
        ? (localStorage.getItem('kongre_user_photo') ||
           localStorage.getItem('kongre_google_photo') ||
           localStorage.getItem('kongre_coordinator_photo'))
        : '') ||
      '';

    const fallbackName =
      userProfile?.displayName ||
      user?.displayName ||
      settings?.coordinatorName ||
      (typeof window !== 'undefined'
        ? (localStorage.getItem('kongre_user_confirmed_name') ||
           localStorage.getItem('kongre_google_display_name') ||
           localStorage.getItem('kongre_current_brother_name'))
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
      setDisplayName(user.displayName || fallbackName || (user.email ? user.email.split('@')[0] : ''));
      setPhotoURL(user.photoURL || fallbackPhoto);
      setSecondaryEmail(user.email || '');
    } else {
      if (fallbackPhoto) setPhotoURL(fallbackPhoto);
      if (fallbackName) setDisplayName(fallbackName);
    }
  }, [userProfile, user, settings?.coordinatorPhotoURL, settings?.coordinatorName, settings?.coordinatorPhone, isDemoMode]);

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
        // Create canvas to scale & compress to square 256x256
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crop square from center
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

        // Convert to lightweight dataURL
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
  const handleSelectPreset = (preset: typeof AVATAR_PRESETS[0]) => {
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
        ? (localStorage.getItem('kongre_google_photo') ||
           localStorage.getItem('kongre_user_photo') ||
           localStorage.getItem('kongre_coordinator_photo'))
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

  // Save changes to Firestore
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
      isSafeDemoMode(settings?.congregationNumber || settings?.congregationId, settings?.isRegistered);

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
      setSaveError(result.error || 'Ocurrió un error al guardar en Firestore.');
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
    isSafeDemoMode(settings?.congregationNumber || settings?.congregationId, settings?.isRegistered);

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

  return (
    <form onSubmit={handleSave} className="w-full space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HERO IDENTITY & AVATAR BANNER                                          */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-500/10 via-zinc-50/60 to-white dark:from-indigo-950/30 dark:via-zinc-900/60 dark:to-zinc-900 border border-zinc-200/80 dark:border-[#27272A] p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative ambient lights */}
        <div className="absolute -right-12 -top-12 w-52 h-52 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-52 h-52 bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar + Info Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-[#18181F] shadow-xl bg-zinc-100 dark:bg-[#18181F] flex items-center justify-center transition-transform group-hover:scale-[1.02]">
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
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-black tracking-wider select-none">
                    {getInitials(displayName || user?.displayName || user?.email || '')}
                  </div>
                )}
              </div>

              {/* Upload button on avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer ring-3 ring-white dark:ring-[#121216]"
                title="Subir o cambiar foto de perfil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight truncate">
                {displayName || 'Tu Nombre'}
              </h1>

              {/* Verified Theocratic Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>{effectiveRoleInfo.name}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-zinc-100 dark:bg-[#18181F]/80 text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200/70 dark:border-[#27272A]/70">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>{settings?.congregationName || 'Congregación Local'}</span>
                </span>

                {user ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
                    <CloudCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>Nube Sincronizada</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70">
                    <Cloud className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>Modo Local</span>
                    {!activeIsDemo && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await signInWithGoogle();
                          } catch {}
                        }}
                        className="underline hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer ml-1"
                      >
                        (Vincular Google)
                      </button>
                    )}
                  </span>
                )}
              </div>

              {/* Photo Management Pill Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200/90 dark:border-[#27272A] shadow-2xs"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Subir Foto</span>
                </button>

                {!activeIsDemo && (() => {
                  const googlePhoto =
                    user?.photoURL ||
                    (typeof window !== 'undefined'
                      ? (localStorage.getItem('kongre_google_photo') ||
                         localStorage.getItem('kongre_user_photo'))
                      : null);

                  if (googlePhoto && googlePhoto !== photoURL) {
                    return (
                      <button
                        type="button"
                        onClick={handleRestoreGooglePhoto}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200/90 dark:border-[#27272A] shadow-2xs"
                      >
                        <span>Foto Google</span>
                      </button>
                    );
                  }
                  return null;
                })()}

                <button
                  type="button"
                  onClick={() => setShowUrlInput((prev) => !prev)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200/90 dark:border-[#27272A] shadow-2xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Enlace Web</span>
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-[#27272A] shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Save Changes Hero Button */}
          <div className="flex flex-col items-center md:items-end justify-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200/70 dark:border-[#27272A]">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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
              <span className="text-[11px] text-zinc-400 dark:text-[#71717A] text-center md:text-right">
                Última sincronización: {new Date(userProfile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Collapsible Direct URL input */}
        {showUrlInput && (
          <div className="mt-4 p-3.5 rounded-2xl bg-white dark:bg-[#18181F]/80 border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xs">
            <input
              type="url"
              value={customUrlTemp}
              onChange={(e) => setCustomUrlTemp(e.target.value)}
              placeholder="Pegar enlace directo de imagen (https://ejemplo.com/mi-foto.jpg)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121216] text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
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

        {/* Theocratic Avatar Selector */}
        <div className="mt-6 pt-5 border-t border-zinc-200/70 dark:border-[#27272A]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Avatares e insignias teocráticas recomendadas</span>
            </span>
            <span className="text-[11px] text-zinc-400">Selección rápida</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id || photoURL === preset.dataUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold ring-2 ring-indigo-500/20'
                      : 'bg-white/80 dark:bg-[#18181F]/50 border-zinc-200/80 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-50 dark:hover:bg-[#27272A] hover:border-zinc-300'
                  }`}
                  title={preset.name}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${preset.bgColor} text-white shadow-xs transition-transform group-hover:scale-105`}>
                    {preset.icon}
                  </div>
                  <span className="text-[10.5px] truncate w-full text-center leading-tight">
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
      {/* 2. MAIN SETTINGS WORKSPACE (2-COLUMN BALANCED GRID)                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Personal Info & Communication Preferences (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Datos Personales y Canales de Contacto */}
          <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-5">
            <div className="pb-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Identidad y Datos de Contacto</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                  Visible en tableros de asignaciones y listado de publicadores.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Visible */}
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

              {/* Cuenta Vinculada */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1.5">
                  Cuenta Principal
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F]/40 text-zinc-600 dark:text-[#D4D4D8] text-xs">
                  <span className="font-mono truncate">
                    {user?.email || (activeIsDemo ? 'modo.prueba@kongre.org' : 'Sesión local')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-[#D4D4D8] shrink-0 ml-2">
                    {user ? 'Verificada' : 'Local'}
                  </span>
                </div>
              </div>

              {/* Teléfono / WhatsApp */}
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

              {/* Correo Alternativo */}
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

          {/* Card B: Preferencias de Comunicación y Disponibilidad */}
          <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-5">
            <div className="pb-4 border-b border-zinc-100 dark:border-[#27272A]">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <span>Canales de Contacto y Horarios</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                Elige cómo y cuándo prefieres recibir confirmaciones y asignaciones.
              </p>
            </div>

            {/* Método de Contacto Preferido */}
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
                        <div className={`w-7 h-7 rounded-lg ${method.bg} ${method.color} flex items-center justify-center`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block text-xs font-bold leading-tight">{method.title}</span>
                        <span className="block text-[10.5px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">{method.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Franja Horaria Preferida */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                Franja Horaria Preferida
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'morning' as ContactTimePreference, label: 'Mañanas', sub: '8:00 – 12:00', icon: Sun, color: 'text-amber-500' },
                  { id: 'afternoon' as ContactTimePreference, label: 'Tardes', sub: '12:00 – 18:00', icon: Sunset, color: 'text-orange-500' },
                  { id: 'evening' as ContactTimePreference, label: 'Noches', sub: '18:00 – 21:30', icon: Moon, color: 'text-indigo-400' },
                  { id: 'anytime' as ContactTimePreference, label: 'Cualquier hora', sub: 'Disponible', icon: Clock, color: 'text-emerald-500' },
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
                      <TimeIcon className={`w-4 h-4 mb-2 ${isSelected ? 'text-white' : time.color}`} />
                      <div>
                        <span className="block text-xs font-bold leading-tight">{time.label}</span>
                        <span className={`block text-[10.5px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                          {time.sub}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notas de Disponibilidad */}
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
        </div>

        {/* RIGHT COLUMN: Push Notifications & Session Security (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card C: Notificaciones Web Push y Recordatorios */}
          <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-5">
            <div className="pb-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
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
              publisherName={displayName || currentBrotherName || user?.displayName || 'Hermano'}
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
                <span className="text-zinc-600 dark:text-[#D4D4D8] font-semibold">Anticipación de aviso:</span>
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
                <span className="text-zinc-600 dark:text-[#D4D4D8] font-semibold">Incluir turnos (audio, micro, aseo):</span>
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
                    <span>{isSendingTestNotif ? 'Enviando prueba...' : 'Enviar Notificación de Prueba'}</span>
                  </button>
                  {testNotifResult && (
                    <p className={`mt-2 text-[11px] font-semibold text-center ${testNotifResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {testNotifResult.msg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card D: Seguridad de la Sesión en este Dispositivo */}
          <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-4">
            <div className="pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Seguridad de Sesión</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                Controles de acceso local y cierre de cuenta en este equipo.
              </p>
            </div>

            <div className="space-y-2.5">
              {!isDemoMode && (
                <button
                  type="button"
                  onClick={handleLockSession}
                  className="w-full py-2.5 px-4 rounded-2xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#E4E4E7] font-bold text-xs transition flex items-center justify-between cursor-pointer border border-zinc-200/70 dark:border-[#27272A]/70"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Bloquear Sesión con PIN</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-normal">Inmediato</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleProfileLogout}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-[#F4F4F5] hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4 shrink-0 text-zinc-400 dark:text-[#71717A]" />
                <span>Cerrar Sesión en este Dispositivo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
