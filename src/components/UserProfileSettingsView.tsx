// src/components/UserProfileSettingsView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

// Preset avatar styles with clean SVG iconography and theocratic themes
const AVATAR_PRESETS = [
  {
    id: 'anciano',
    name: 'Anciano / Biblia',
    icon: '📖',
    bgColor: 'bg-indigo-600',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%234f46e5"/><text x="50%" y="54%" font-size="44" text-anchor="middle" dominant-baseline="middle">📖</text></svg>',
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
  const { user, userProfile, updateUserProfile, effectiveRoleInfo, signInWithGoogle } = useAuth();

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

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlTemp, setCustomUrlTemp] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Initialize form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || '');
      setPhotoURL(userProfile.photoURL || user?.photoURL || '');
      setPhone(userProfile.phone || '');
      setSecondaryEmail(userProfile.secondaryEmail || '');
      setPreferredContactMethod(userProfile.preferredContactMethod || 'whatsapp');
      setContactTimePreference(userProfile.contactTimePreference || 'anytime');
      setNotificationsEnabled(userProfile.notificationsEnabled ?? true);
      setNotes(userProfile.notes || '');
    } else if (user) {
      setDisplayName(user.displayName || (user.email ? user.email.split('@')[0] : ''));
      setPhotoURL(user.photoURL || '');
    }
  }, [userProfile, user]);

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
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
      setSelectedPresetId(null);
      setShowUrlInput(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoURL('');
    setSelectedPresetId(null);
    setShowUrlInput(false);
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

    const result = await updateUserProfile({
      displayName: displayName.trim(),
      photoURL: photoURL.trim(),
      phone: phone.trim(),
      secondaryEmail: secondaryEmail.trim().toLowerCase(),
      preferredContactMethod,
      contactTimePreference,
      notificationsEnabled,
      notes: notes.trim(),
    });

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

  return (
    <div className="space-y-6">
      {/* 1. Header with Firestore Cloud Sync Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Mi Perfil y Preferencias de Contacto
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestiona tu foto, nombre visible y canales de comunicación teocrática. Se sincronizan en tu documento personal en Firestore.
          </p>
        </div>

        {/* Cloud Sync Status Badge */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {user ? (
            <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="block font-bold">Firestore Sincronizado</span>
                <span className="text-[10px] opacity-75 font-mono">/users/{user.uid.slice(0, 8)}...</span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <Cloud className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="block font-bold">Almacenamiento Local</span>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="underline hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"
                >
                  Conectar Google para Nube
                </button>
              </div>
            </div>
          )}

          {userProfile?.updatedAt && (
            <span className="hidden lg:inline text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Act: {new Date(userProfile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">¡Datos guardados exitosamente en Firestore!</p>
              <p className="text-[11px] opacity-80">
                Tu foto, nombre visible y preferencias de contacto han sido actualizados en tu documento de usuario.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
            OK
          </span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs font-semibold text-rose-900 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* CARD 1: FOTO DE PERFIL & AVATAR TEOCRÁTICO                                 */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Foto de Perfil y Avatar
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Personalización
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Live Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-indigo-500/20 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-md">
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
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-3xl font-extrabold tracking-wider select-none">
                    {getInitials(displayName || user?.displayName || user?.email || '')}
                  </div>
                )}
              </div>

              {/* Quick camera trigger button on avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Subir foto desde tu dispositivo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Avatar Actions & Presets */}
            <div className="flex-1 space-y-4 text-center sm:text-left w-full">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {displayName || 'Tu Nombre'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Esta foto se mostrará en la barra superior, en tu portal de inicio y en tus asignaciones.
                </p>
              </div>

              {/* Upload buttons row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Subir Foto</span>
                </button>

                {user?.photoURL && user.photoURL !== photoURL && (
                  <button
                    type="button"
                    onClick={handleRestoreGooglePhoto}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <span>Usar foto de Google</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowUrlInput((prev) => !prev)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Enlace URL</span>
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800"
                    title="Quitar foto y usar iniciales"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                )}
              </div>

              {/* URL Input collapse */}
              {showUrlInput && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Pegar enlace directo de imagen (HTTPS):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlTemp}
                      onChange={(e) => setCustomUrlTemp(e.target.value)}
                      placeholder="https://ejemplo.com/mi-foto.jpg"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {/* Presets Gallery */}
              <div className="pt-2">
                <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                  O elige un avatar temático teocrático:
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id || photoURL === preset.dataUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                        title={preset.name}
                      >
                        <span className="text-xl mb-1">{preset.icon}</span>
                        <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full">
                          {preset.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: NOMBRE VISIBLE E IDENTIDAD TEOCRÁTICA                              */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nombre Visible e Identidad
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {effectiveRoleInfo.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre Visible */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Visible en la Aplicación: *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Hno. Héctor Gutiérrez"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Este es el nombre con el que aparecerás identificado en la barra superior, asignaciones y programas.
              </span>
            </div>

            {/* Correo Electrónico Principal (Google Auth) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico de la Cuenta (Google):
              </label>
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-sm">
                <span className="font-mono text-xs truncate">
                  {user?.email || 'Sin sesión activa de Google'}
                </span>
                {user ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Verificado
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600">
                    Local
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                El correo está vinculado a tu autenticación y no puede modificarse desde aquí.
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3: CANALES Y PREFERENCIAS DE CONTACTO                                 */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Canales y Preferencias de Contacto
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Notificaciones
            </span>
          </div>

          {/* Teléfono & Correo Secundario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono Principal / WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Teléfono Principal / WhatsApp:</span>
                {cleanPhoneForWa && (
                  <a
                    href={`https://wa.me/${cleanPhoneForWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Probar enlace WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000 o 55 1234 5678"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Incluye el prefijo internacional para facilitar el envío de asignaciones por WhatsApp.
              </span>
            </div>

            {/* Correo Alternativo / Ministerial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Alternativo o Ministerial (Opcional):
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  placeholder="ejemplo.ministerio@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Útil si prefieres recibir avisos y copias de hojas S-89 en una cuenta secundaria.
              </span>
            </div>
          </div>

          {/* Método de Contacto Preferido */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Método de Contacto Preferido:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'whatsapp' as PreferredContactMethod,
                  title: 'WhatsApp',
                  subtitle: 'Avisos directos y confirmaciones de asignación',
                  icon: MessageSquare,
                  activeColor: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300',
                },
                {
                  id: 'email' as PreferredContactMethod,
                  title: 'Correo Electrónico',
                  subtitle: 'Hojas S-89 en PDF y programas mensuales',
                  icon: Mail,
                  activeColor: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300',
                },
                {
                  id: 'phone' as PreferredContactMethod,
                  title: 'Llamada Telefónica',
                  subtitle: 'Para asuntos urgentes o cambios de última hora',
                  icon: Phone,
                  activeColor: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300',
                },
                {
                  id: 'sms' as PreferredContactMethod,
                  title: 'Mensaje de Texto (SMS)',
                  subtitle: 'Recordatorios breves sin conexión de datos',
                  icon: Bell,
                  activeColor: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
                },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = preferredContactMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPreferredContactMethod(method.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? `${method.activeColor} ring-2 ring-indigo-500/20 shadow-xs font-semibold`
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-4 h-4" />
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {method.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {method.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horario de Contacto Preferido */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Franja Horaria Preferida para Recibir Comunicaciones:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'morning' as ContactTimePreference, label: '🌅 Mañanas (8:00 - 12:00)' },
                { id: 'afternoon' as ContactTimePreference, label: '☀️ Tardes (12:00 - 18:00)' },
                { id: 'evening' as ContactTimePreference, label: '🌙 Noches (18:00 - 21:30)' },
                { id: 'anytime' as ContactTimePreference, label: '🕒 Cualquier hora' },
              ].map((time) => {
                const isSelected = contactTimePreference === time.id;
                return (
                  <button
                    key={time.id}
                    type="button"
                    onClick={() => setContactTimePreference(time.id)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {time.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notificaciones y Avisos Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Avisos de Asignaciones y Recordatorios Semanales</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Permitir que los hermanos organizadores te envíen recordatorios de tus partes y deberes por tu canal preferido.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Notas de Disponibilidad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notas Adicionales de Disponibilidad o Circunstancias (Opcional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. 'Fines de semana disponibles sin restricción. Los jueves trabajo en horario nocturno.'"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBMIT BUTTON BAR                                                         */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Los cambios se guardan de forma instantánea y persistente en Firestore.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando en Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Mi Perfil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
