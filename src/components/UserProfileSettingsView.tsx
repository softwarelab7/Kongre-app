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
import { isSafeDemoMode } from '../utils/theocraticSecurity';

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
    bgColor: 'bg-slate-700',
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
  const { user, userProfile, updateUserProfile, effectiveRoleInfo, signInWithGoogle, currentPublisherId, currentBrotherName } = useAuth();
  const { settings, updateSettings, isDemoMode, weeks, cartShifts, cartLocations, publishersMap } = useCongregation();

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
    <form onSubmit={handleSave} className="w-full space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP IDENTITY & CONTROL CARD                                            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Avatar + Identity Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
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
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold tracking-wider select-none">
                    {getInitials(displayName || user?.displayName || user?.email || '')}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center justify-center transition-transform active:scale-95 cursor-pointer border-2 border-white dark:border-slate-900"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {displayName || 'Tu Nombre Visible'}
                </h2>
              </div>

              {/* Clean unboxed metadata row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{effectiveRoleInfo.name}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{settings?.congregationName || 'Congregación Local'}</span>
                </span>
                <span aria-hidden="true">·</span>
                {user ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CloudCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Sincronizado en Nube</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Cloud className="w-3.5 h-3.5 shrink-0" />
                    <span>Modo Local</span>
                    {!activeIsDemo && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await signInWithGoogle();
                          } catch {}
                        }}
                        className="ml-1 underline hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
                      >
                        (Conectar Google)
                      </button>
                    )}
                  </span>
                )}
              </div>

              {/* Photo Actions Row */}
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
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-slate-700"
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
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-slate-700"
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
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/80 dark:border-slate-700"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Enlace URL</span>
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Primary Save Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-right">
                Última actualización: {new Date(userProfile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* URL Input collapse */}
        {showUrlInput && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={customUrlTemp}
              onChange={(e) => setCustomUrlTemp(e.target.value)}
              placeholder="Pegar enlace directo de imagen (https://ejemplo.com/mi-foto.jpg)"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Aplicar URL
            </button>
          </div>
        )}

        {/* Compact Avatar Presets Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Avatares predefinidos:
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 w-full flex-1">
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id || photoURL === preset.dataUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1.5 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                  title={preset.name}
                >
                  <span className="text-sm">{preset.icon}</span>
                  <span className="text-[10px] truncate">{preset.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Perfil y preferencias actualizados correctamente.</span>
          </div>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-xs font-semibold text-rose-900 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TWO-COLUMN DESKTOP WORKSPACE GRID                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Identity, Contact Channels & Schedule Preferences */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card A: Datos Personales y Canales de Contacto */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Identidad y Canales de Contacto</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Información visible en los tableros de asignaciones y directorio de la congregación.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Visible */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Visible *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Correo de Cuenta (Solo lectura) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cuenta Vinculada
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs">
                  <span className="font-mono truncate">
                    {user?.email || (activeIsDemo ? 'modo.prueba@kongre.org' : 'Sesión local activa')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-2">
                    {user ? 'Verificada' : 'Local'}
                  </span>
                </div>
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Teléfono / WhatsApp
                  </label>
                  {cleanPhoneForWa && (
                    <a
                      href={`https://wa.me/${cleanPhoneForWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
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
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Correo Alternativo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Alternativo (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    placeholder="correo.alternativo@ejemplo.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Preferencias de Comunicación y Disponibilidad */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Preferencias de Comunicación y Horario</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Elige cómo y cuándo prefieres recibir confirmaciones de partes y avisos de la congregación.
              </p>
            </div>

            {/* Método de Contacto Preferido */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Canal de Contacto Preferido
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'whatsapp' as PreferredContactMethod,
                    title: 'WhatsApp',
                    desc: 'Mensajes directos',
                    icon: MessageSquare,
                  },
                  {
                    id: 'email' as PreferredContactMethod,
                    title: 'Correo',
                    desc: 'Hojas S-89 y PDF',
                    icon: Mail,
                  },
                  {
                    id: 'phone' as PreferredContactMethod,
                    title: 'Llamada',
                    desc: 'Avisos urgentes',
                    icon: Phone,
                  },
                  {
                    id: 'sms' as PreferredContactMethod,
                    title: 'SMS',
                    desc: 'Sin datos móviles',
                    icon: Send,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = preferredContactMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPreferredContactMethod(method.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/15 shadow-2xs'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <div>
                        <span className="block text-xs font-bold leading-tight">{method.title}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{method.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Franja Horaria Preferida */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Franja Horaria Preferida
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'morning' as ContactTimePreference, label: 'Mañanas', sub: '8:00 – 12:00', icon: Sun },
                  { id: 'afternoon' as ContactTimePreference, label: 'Tardes', sub: '12:00 – 18:00', icon: Sunset },
                  { id: 'evening' as ContactTimePreference, label: 'Noches', sub: '18:00 – 21:30', icon: Moon },
                  { id: 'anytime' as ContactTimePreference, label: 'Cualquier hora', sub: 'Disponible', icon: Clock },
                ].map((time) => {
                  const TimeIcon = time.icon;
                  const isSelected = contactTimePreference === time.id;
                  return (
                    <button
                      key={time.id}
                      type="button"
                      onClick={() => setContactTimePreference(time.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <TimeIcon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <div>
                        <span className="block text-xs font-bold leading-tight">{time.label}</span>
                        <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Notas de Disponibilidad o Circunstancias (Opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Disponible fines de semana sin restricción. Jueves en turno laboral vespertino."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Account Summary & Web Push Notifications */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card C: Ficha Resumen de Cuenta */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Resumen de Ficha Personal</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Así se muestra tu perfil en las asignaciones y listas de contacto.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Rol activo</span>
                <span className="font-bold text-slate-900 dark:text-white">{effectiveRoleInfo.name}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Canal preferido</span>
                <span className="font-bold text-slate-900 dark:text-white">{contactMethodLabels[preferredContactMethod]}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Horario de contacto</span>
                <span className="font-bold text-slate-900 dark:text-white">{contactTimeLabels[contactTimePreference]}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Teléfono registrado</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {phone || 'No especificado'}
                </span>
              </div>
            </div>
          </div>

          {/* Card D: Notificaciones Web Push y Recordatorios */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Avisos Push y Recordatorios</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Alertas automáticas en tu dispositivo antes de tus asignaciones.
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
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

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Anticipación de aviso:</span>
                <select
                  value={notifPrefs.notifyDaysBefore}
                  onChange={(e) => {
                    const days = parseInt(e.target.value, 10);
                    saveNotificationPreferences({ notifyDaysBefore: days });
                    setNotifPrefs((prev) => ({ ...prev, notifyDaysBefore: days }));
                  }}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value={1}>1 día antes (24h)</option>
                  <option value={2}>2 días antes (48h)</option>
                  <option value={3}>3 días antes (72h)</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Incluir turnos de audio, micro y aseo:</span>
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
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isSendingTestNotif}
                    onClick={handleSendTestNotification}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{isSendingTestNotif ? 'Enviando prueba...' : 'Enviar Notificación de Prueba'}</span>
                  </button>
                  {testNotifResult && (
                    <p className={`mt-1.5 text-[11px] font-medium ${testNotifResult.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {testNotifResult.msg}
                    </p>
                  )}
                </div>
              )}
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
