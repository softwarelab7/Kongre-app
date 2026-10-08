// src/components/SettingsTab.tsx
import React, { useState, useRef } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { encryptTheocraticData, decryptTheocraticData, getFriendlyCongregationName } from '../utils/theocraticSecurity';
import {
  Settings,
  Shield,
  Cloud,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  LogOut,
  Save,
  Sliders,
  Calendar,
  Sun,
  Moon,
  Tv,
  Sparkles,
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
} from 'lucide-react';
import { JoinCongregationModal } from './JoinCongregationModal';
import { InvitationManagerModal } from './InvitationManagerModal';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';
import { UserProfileSettingsView } from './UserProfileSettingsView';

export const SettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackupJSON,
    getBackupJSON,
    importBackupJSON,
    uploadLocalDataToGoogle,
    downloadDataFromGoogle,
    syncStatus,
  } = useCongregation();
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudActionStatus, setCloudActionStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleUploadToGoogle = async () => {
    setIsSyncingCloud(true);
    setCloudActionStatus(null);
    try {
      const res = await uploadLocalDataToGoogle();
      setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
    } catch (e: any) {
      setCloudActionStatus({ type: 'error', msg: e?.message || 'Error al guardar en la nube de Google.' });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleDownloadFromGoogle = async () => {
    if (!window.confirm('¿Deseas descargar y reemplazar los datos locales con la copia guardada en tu cuenta de Google?')) {
      return;
    }
    setIsSyncingCloud(true);
    setCloudActionStatus(null);
    try {
      const res = await downloadDataFromGoogle();
      setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
    } catch (e: any) {
      setCloudActionStatus({ type: 'error', msg: e?.message || 'Error al descargar datos desde Google.' });
    } finally {
      setIsSyncingCloud(false);
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
    activeSessions,
    isMasterPassphraseSet,
    isCongregationPinSet,
  } = useSecurity();

  const [isSettingsInviteModalOpen, setIsSettingsInviteModalOpen] = useState(false);
  const [isSettingsJoinModalOpen, setIsSettingsJoinModalOpen] = useState(false);
  const [isSettingsWizardOpen, setIsSettingsWizardOpen] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<'perfil' | 'general' | 'seguridad' | 'respaldos'>('perfil');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [congName, setCongName] = useState(() =>
    getFriendlyCongregationName(settings.congregationName, 'Congregación Central')
  );
  const [midDay, setMidDay] = useState(settings.midweekMeetingDay);
  const [midTime, setMidTime] = useState(settings.midweekMeetingTime);
  const [fdsDay, setFdsDay] = useState(settings.weekendMeetingDay);
  const [fdsTime, setFdsTime] = useState(settings.weekendMeetingTime);
  const [hallAddress, setHallAddress] = useState(settings.hallAddress || '');

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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      congregationName: congName.trim(),
      midweekMeetingDay: midDay,
      midweekMeetingTime: midTime,
      weekendMeetingDay: fdsDay,
      weekendMeetingTime: fdsTime,
      hallAddress: hallAddress.trim(),
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
    setTimeout(() => setSavedFeedback(false), 2000);
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
      // Remove PIN
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
          // Encrypted backup detected!
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

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Configuración y Preferencias del Sistema</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personaliza tu perfil de usuario, preferencias de contacto, datos de la congregación y respaldos.
          </p>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSettingsSubView('perfil')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            settingsSubView === 'perfil'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Mi Perfil y Contacto</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
            Firestore
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsSubView('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            settingsSubView === 'general'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Congregación y Horarios</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsSubView('seguridad')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            settingsSubView === 'seguridad'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Seguridad y PINs</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsSubView('respaldos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            settingsSubView === 'respaldos'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200/50 dark:ring-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Respaldos y Nube</span>
        </button>
      </div>

      {/* VISTA 1: MI PERFIL Y PREFERENCIAS DE CONTACTO (FIRESTORE) */}
      {settingsSubView === 'perfil' && <UserProfileSettingsView />}

      {/* VISTA 2: CONGREGACIÓN Y HORARIOS */}
      {settingsSubView === 'general' && (
        <div className="space-y-8 animate-fade-in">

      {/* AMBIENTACIÓN Y MODO OSCURO (CABINA & SALÓN DEL REINO) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Ambientación y Modo Oscuro (Cabina & Salón)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Optimizado para la cabina de audio y video, consola de Zoom y acomodadores en el fondo del auditorio.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
            Activo: {themeMode === 'light' ? '☀️ Modo Claro' : themeMode === 'dark' ? '🌙 Modo Oscuro' : '🎛️ Modo Cabina'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Modo Claro */}
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              themeMode === 'light'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Sun className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Claro (Día)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fondo blanco estándar. Óptimo para lectura diurna, secretaría y preparación de asignaciones en casa.
            </p>
          </button>

          {/* 2. Modo Oscuro */}
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              themeMode === 'dark'
                ? 'bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-800">
              <Moon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Oscuro (Noche)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tonos carbón y pizarra. Descansa la vista y ahorra batería en dispositivos portátiles.
            </p>
          </button>

          {/* 3. Modo Cabina & Acomodadores */}
          <button
            type="button"
            onClick={() => setThemeMode('cabina')}
            className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
              themeMode === 'cabina'
                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-800">
              <Tv className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Cabina & Salón</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Negro OLED ultra-profundo con atenuación de destellos para no iluminar el auditorio durante la reunión.
            </p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* 1. INFORMACIÓN DE LA CONGREGACIÓN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Información y Horarios de Reunión</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre de la Congregación
              </label>
              <input
                type="text"
                required
                value={congName}
                onChange={e => setCongName(e.target.value)}
                placeholder="Ej. Congregación Central"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Este nombre oficial es el que se mostrará en el banner superior, programas y hojas S-89 (el ID de conexión es independiente).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dirección del Salón del Reino
              </label>
              <input
                type="text"
                value={hallAddress}
                onChange={e => setHallAddress(e.target.value)}
                placeholder="Ej. Av. Las Palmeras 450"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Midweek meeting day & time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Día Entre Semana
                </label>
                <select
                  value={midDay}
                  onChange={e => setMidDay(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={midTime}
                  onChange={e => setMidTime(e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* Weekend meeting day & time */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Día Fin de Semana
                </label>
                <select
                  value={fdsDay}
                  onChange={e => setFdsDay(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={fdsTime}
                  onChange={e => setFdsTime(e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. REGLAS DE DETECCIÓN DE CONFLICTOS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Reglas de Detección de Cruces y Conflictos</span>
          </h3>

          <p className="text-xs text-slate-500">
            Define qué asignaciones simultáneas están prohibidas para que el sistema emita alertas en tiempo real y el autoasignador evite cometer errores.
          </p>

          <div className="space-y-3 text-xs">
            {/* Rule 1: Part + Duty clash */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={allowPartAndDuty}
                onChange={e => setAllowPartAndDuty(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Permitir que quien tenga una parte en el programa tenga también un deber
                </p>
                <p className="text-slate-500 mt-0.5">
                  Si se desmarca (recomendado), el sistema generará un error crítico si alguien con parte en plataforma es asignado simultáneamente a Audio, Video, Micrófonos o Acomodador.
                </p>
              </div>
            </label>

            {/* Rule 2: Audio + Mic clash */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={allowAudioAndMics}
                onChange={e => setAllowAudioAndMics(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Permitir que el operador de Audio/Video haga micrófonos al mismo tiempo
                </p>
                <p className="text-slate-500 mt-0.5">
                  Si se desmarca, evitará que una persona que debe estar en cabina técnica sea asignada a correr micrófonos o estar en la puerta.
                </p>
              </div>
            </label>

            {/* Rule 3: President clash */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={allowPresAndPart}
                onChange={e => setAllowPresAndPart(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Permitir que el Presidente de la reunión tenga otra parte o deber
                </p>
                <p className="text-slate-500 mt-0.5">
                  Si se desmarca, alertará para que el presidente se enfoque exclusivamente en dirigir la reunión.
                </p>
              </div>
            </label>

            {/* Rule 4: Sister demonstrations */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={enforceSisters}
                onChange={e => setEnforceSisters(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Exigir que la ayudante de una hermana titular sea siempre otra hermana
                </p>
                <p className="text-slate-500 mt-0.5">
                  Alineado con las directrices de la Escuela del Ministerio Teocrático / Vida y Ministerio.
                </p>
              </div>
            </label>

            {/* Consecutive weeks control */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Límite de semanas seguidas con deberes:
                </label>
                <select
                  value={maxConsecutiveDuty}
                  onChange={e => setMaxConsecutiveDuty(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>1 semana (Rotación semanal estricta)</option>
                  <option value={2}>2 semanas seguidas (Recomendado)</option>
                  <option value={3}>3 semanas seguidas</option>
                  <option value={4}>4 semanas seguidas</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Límite de semanas seguidas con partes:
                </label>
                <select
                  value={maxConsecutivePart}
                  onChange={e => setMaxConsecutivePart(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={1}>1 semana</option>
                  <option value={2}>2 semanas seguidas (Recomendado)</option>
                  <option value={3}>3 semanas seguidas</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-800 mb-1">
                  Alerta de repetición de Bosquejos Públicos:
                </label>
                <select
                  value={warnOutlineMonths}
                  onChange={e => setWarnOutlineMonths(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={6}>No repetir el mismo bosquejo antes de 6 meses</option>
                  <option value={9}>No repetir el mismo bosquejo antes de 9 meses</option>
                  <option value={12}>No repetir antes de 12 meses (Recomendación Teocrática)</option>
                  <option value={18}>No repetir antes de 18 meses</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex items-center justify-end gap-3">
          {savedFeedback && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              ¡Configuración guardada correctamente!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  )}

  {/* VISTA 3: SEGURIDAD Y PINS */}
  {settingsSubView === 'seguridad' && (
    <div className="space-y-8 animate-fade-in">
      {/* 4. REGISTRO TEOCRÁTICO E INVITACIONES CON QR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
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

          <div className="flex items-center gap-2">
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
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Invitaciones Activas
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
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
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Canjear Código de Invitación</span>
            </button>
          </div>

          {/* Card 3: Credenciales Teocráticas */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Credenciales de la Congregación
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  {isCongregationPinSet ? 'Protegido' : 'Activo'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">ID de la Congregación:</span>
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
                  <span className="text-slate-500 dark:text-slate-400">PIN de la Congregación:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">•••• (Configurado)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tu PIN Personal:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{isPinEnabled ? '•••• (Activo)' : 'Sin configurar'}</span>
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

      {/* 5. SEGURIDAD TEOCRÁTICA Y BLOQUEO DE SESIÓN */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
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

        {/* PIN Security Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: PIN de Bloqueo */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  PIN de Bloqueo de Sesión
                </span>
                {isPinEnabled ? (
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
                Bloquea la aplicación con un código numérico para proteger la confidencialidad en computadoras compartidas del Salón del Reino o cabina de audio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              {isPinEnabled && (
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
                onClick={() => {
                  setPinCurrent('');
                  setPinNew('');
                  setPinConfirm('');
                  setPinModalError(null);
                  setShowPinSetupModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {isPinEnabled ? 'Cambiar o Quitar PIN' : 'Configurar PIN de Seguridad'}
              </button>
            </div>
          </div>

          {/* Card: Auto-Bloqueo por Inactividad */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Bloqueo Automático por Inactividad
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bloquea la pantalla automáticamente si no se detecta actividad del mouse o teclado durante el tiempo seleccionado.
              </p>
            </div>

            <div>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                disabled={!isPinEnabled}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold disabled:opacity-50"
              >
                <option value={2}>Bloquear tras 2 minutos de inactividad</option>
                <option value={5}>Bloquear tras 5 minutos de inactividad (Recomendado)</option>
                <option value={10}>Bloquear tras 10 minutos de inactividad</option>
                <option value={15}>Bloquear tras 15 minutos de inactividad</option>
                <option value={0}>Desactivado (Solo bloqueo manual)</option>
              </select>
              {!isPinEnabled && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Requiere configurar un PIN primero
                </span>
              )}
            </div>
          </div>
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
      </div>
    </div>
  )}

  {/* VISTA 4: RESPALDOS Y NUBE */}
  {settingsSubView === 'respaldos' && (
    <div className="space-y-8 animate-fade-in">
      {/* SINCRONIZACIÓN EN LA NUBE Y GOOGLE AUTH */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Sincronización en la Nube con tu Cuenta de Google</span>
          </h3>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            user
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {user ? 'Google Conectado' : 'Modo Datos de Aplicación (Local)'}
          </span>
        </div>

        {/* Sync message alert if any */}
        {cloudActionStatus && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 animate-fade-in ${
            cloudActionStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}>
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
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{user.email}</span>
                </>
              ) : (
                <span>Modo Local / Credenciales de Aplicación</span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              {user
                ? 'Tus datos teocráticos (publicadores, reuniones, programas CLM, asignaciones y ajustes) se sincronizan en tiempo real con Firestore en la nube de Google. Puedes forzar la subida de datos locales o descargar la copia de la nube en cualquier momento.'
                : 'Estás conectado con los datos de tu congregación (ID y PIN). Toda tu información y cambios se guardan localmente en este dispositivo. Para que tus datos se guarden en la nube y estén siempre disponibles cuando te conectes con Google, pulsa "Conectar con Google y Respaldar".'}
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
                  title="Descargar y restaurar datos teocráticos desde tu cuenta de Google Firestore"
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
                onClick={async () => {
                  setIsSyncingCloud(true);
                  setCloudActionStatus(null);
                  try {
                    await signInWithGoogle();
                    const res = await uploadLocalDataToGoogle();
                    setCloudActionStatus({ type: res.success ? 'success' : 'error', msg: res.message });
                  } catch (e: any) {
                    setCloudActionStatus({ type: 'error', msg: e?.message || 'Error al conectar con Google.' });
                  } finally {
                    setIsSyncingCloud(false);
                  }
                }}
                disabled={isSyncingCloud}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Conectar con Google y Respaldar Datos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COPIAS DE SEGURIDAD Y CIFRADO MILITAR E2EE */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Copias de Seguridad y Respaldo Cifrado</span>
        </h3>

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
            <span>Exportar Respaldo Cifrado (.orgenc.json)</span>
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
            accept=".json,.orgenc.json"
            className="hidden"
          />

          {/* Restore Button (Auto-detects plain or encrypted) */}
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
    </div>
  )}

      {/* MODAL 1: SETUP PIN MODAL */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
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
    </div>
  );
};
