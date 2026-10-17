// src/components/CongregationWelcomeLanding.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { isCongregationIdString, getFriendlyCongregationName, verifyPasscode, isGenericIdentityName, formatCanonicalCongregationId } from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';
import {
  Sun,
  Moon,
  User as UserIcon,
  Mail,
  Home,
  Sparkles,
  KeyRound,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Users,
  LogOut,
  Lock,
  Calendar,
  MapPin,
  Wifi,
  Layers,
  Hash,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';
import { PendingApprovalView } from './PendingApprovalView';
import { KongreLogo } from './KongreLogo';
import Logo from '../Logo';
import ThemeToggle from './ThemeToggle';

interface CongregationWelcomeLandingProps {
  onEnterApp: () => void;
  onOpenJoinModal?: () => void;
}

export const CongregationWelcomeLanding: React.FC<CongregationWelcomeLandingProps> = ({
  onEnterApp,
  onOpenJoinModal,
}) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    setActiveRole,
    setIdentifiedBrother,
    setIdentifiedPublisher,
    assignRoleToEmail,
    identifyRoleByPersonalPin,
    userRolesList,
    userProfile,
    assignPersonalPinToPublisher,
  } = useAuth();
  const {
    redeemInvitationCode,
    verifyCongregationPin,
    verifyPersonalPin,
  } = useSecurity();
  const {
    settings,
    updateSettings,
    publishers,
    addPublisher,
    accountLinkRequests,
    createAccountLinkRequest,
    restorePreviousRegistration,
    uploadLocalDataToGoogle,
    loadCongregationFromCloud,
    hydrateCongregation,
    findUserCongregationId,
  } = useCongregation();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'home' | 'email_login' | 'code_login' | 'register' | 'unauthorized'>('home');
  const [pendingApprovalEmail, setPendingApprovalEmail] = useState<string | null>(null);
  const [unauthorizedGoogleAccount, setUnauthorizedGoogleAccount] = useState<{
    email: string;
    name: string;
    congregationId: string;
    congregationName: string;
  } | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Three credentials (PIN Personal es opcional para coordinadores):
  // 1. ID de la Congregación
  // 2. PIN de la Congregación
  // 3. PIN Personal suministrado por el Coordinador
  const [congregationIdInput, setCongregationIdInput] = useState(
    settings.congregationNumber || settings.congregationId || ''
  );
  const [congregationPinInput, setCongregationPinInput] = useState('');
  const [personalPinInput, setPersonalPinInput] = useState('');
  const [showCongPin, setShowCongPin] = useState(false);
  const [showPersPin, setShowPersPin] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  // Email login state
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleConnectWithIdPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);
    setIsSubmittingCode(true);

    try {
      const rawInput = congregationIdInput.trim();
      const cleanId = formatCanonicalCongregationId(rawInput);
      const cleanCongPin = congregationPinInput.trim();
      const cleanPersonalPin = personalPinInput.trim();
      let nameToUse = '';
      let emailToUse = user?.email || `hermano_${cleanId || 'cong'}@kongre.org`;

      // 1. Validar ID
      if (!cleanId) {
        setCodeError('Por favor introduce el ID o Nombre de la Congregación.');
        setIsSubmittingCode(false);
        return;
      }
      // 2. Validar PIN de congregación
      if (!cleanCongPin) {
        setCodeError('Por favor introduce el PIN de la Congregación.');
        setIsSubmittingCode(false);
        return;
      }

      // 1. Cargar datos actualizados de la congregación desde la nube en Firestore (sin hidratar aún)
      const cloudRes = await loadCongregationFromCloud(cleanId, { skipHydrate: true });
      const cloudData = cloudRes?.data;
      const effectiveId = formatCanonicalCongregationId(cloudData?.congregationId || cloudData?.settings?.congregationId || cleanId);

      if (!cloudRes?.success || !cloudData) {
        setCodeError(`No se encontró ninguna congregación registrada con el ID "${cleanId}". Verifica el ID o pulsa "Registrar mi Congregación".`);
        setIsSubmittingCode(false);
        return;
      }

      // 2. Validar coincidencia de PIN de Congregación (OBLIGATORIO)
      const effectivePinHash =
        cloudData?.settings?.congregationPinHash ||
        cloudData?.congregationPinHash;

      let isCongPinValid = false;
      if (effectivePinHash) {
        isCongPinValid = await verifyPasscode(cleanCongPin, effectivePinHash);
      } else {
        isCongPinValid = await verifyCongregationPin(cleanCongPin);
      }

      if (!isCongPinValid) {
        setCodeError('El PIN de Congregación ingresado es incorrecto.');
        setIsSubmittingCode(false);
        return;
      }

      let identifiedRole: TheocraticRole | undefined;

      // 3. Probar PIN personal en el directorio de la congregación ÚNICAMENTE si el usuario lo ingresó
      let matchingPub: any = null;
      if (cleanPersonalPin) {
        const congPubs = (cloudData?.publishers || publishers) as any[];
        matchingPub = congPubs.find(
          (p) => p.personalPin && String(p.personalPin).trim().length >= 4 && String(p.personalPin).trim() === cleanPersonalPin
        );

        if (matchingPub) {
          const finalRole: TheocraticRole =
            matchingPub.theocraticRole ||
            (matchingPub.privilege === 'anciano'
              ? 'anciano'
              : matchingPub.privilege === 'siervo_ministerial'
              ? 'siervo_territorios'
              : 'publico');
          identifiedRole = finalRole;
          nameToUse = matchingPub.name && !isGenericIdentityName(matchingPub.name) ? matchingPub.name.trim() : 'Hermano';
          if (matchingPub.email) emailToUse = matchingPub.email;
          setIdentifiedPublisher(matchingPub.id, nameToUse);
          setIdentifiedBrother(nameToUse);
        } else {
          // Probar código de invitación generado por los ancianos
          const invResult = await redeemInvitationCode(cleanPersonalPin, emailToUse, nameToUse || 'Hermano');
          if (invResult.success && invResult.role) {
            identifiedRole = invResult.role;
            if (invResult.targetName && !isGenericIdentityName(invResult.targetName)) {
              nameToUse = invResult.targetName;
            }
          } else {
            setCodeError('El PIN Personal ingresado no coincide con ningún publicador en esta congregación. Verifica el PIN asignado por los ancianos o déjalo vacío para entrar en Modo Cartelera/Público.');
            setIsSubmittingCode(false);
            return;
          }
        }
      }

      // Si solo ingresó PIN de congregación sin PIN personal, el rol es ESTRICTAMENTE 'publico' (nunca 'coordinador')
      const roleFinal: TheocraticRole = identifiedRole || 'publico';

      // 4. Resolver nombre real según la identidad identificada
      if (!nameToUse || isGenericIdentityName(nameToUse)) {
        if (roleFinal === 'coordinador') {
          const cloudCoord = cloudData?.settings?.coordinatorName;
          const localCoord = settings.coordinatorName;
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          const googleName = user?.displayName;

          if (cloudCoord && !isGenericIdentityName(cloudCoord)) {
            nameToUse = cloudCoord.trim();
          } else if (localCoord && !isGenericIdentityName(localCoord)) {
            nameToUse = localCoord.trim();
          } else if (savedCoord && !isGenericIdentityName(savedCoord)) {
            nameToUse = savedCoord.trim();
          } else if (googleName && !isGenericIdentityName(googleName)) {
            nameToUse = googleName.trim();
          } else {
            nameToUse = 'Coordinador';
          }
        } else {
          nameToUse = user?.displayName && !isGenericIdentityName(user.displayName) ? user.displayName.trim() : 'Publicador';
        }
      }

      // 5. El usuario ha sido validado correctamente con el PIN de la congregación
      const cleanCongName =
        (cloudRes?.success && cloudRes.congregationName && !isCongregationIdString(cloudRes.congregationName)
          ? cloudRes.congregationName
          : null) ||
        (settings.congregationName && !isCongregationIdString(settings.congregationName)
          ? settings.congregationName
          : (localStorage.getItem('kongre_congregation_name') || ''));

      // Hidratar datos de la congregación de manera segura y controlada tras validar el PIN
      if (cloudData) {
        hydrateCongregation(cloudData);
      }

      localStorage.setItem('kongre_congregation_number', effectiveId);
      localStorage.setItem('kongre_congregation_id', effectiveId);

      const newSettingsUpdate: any = {
        isRegistered: true,
        ...(cleanCongName ? { congregationName: cleanCongName } : {}),
        congregationNumber: effectiveId,
        congregationId: effectiveId,
      };

      if (!isGenericIdentityName(nameToUse)) {
        localStorage.setItem('kongre_identified_brother', nameToUse);
        setIdentifiedBrother(nameToUse);
        if (roleFinal === 'coordinador') {
          localStorage.setItem('kongre_coordinator_name', nameToUse);
          newSettingsUpdate.coordinatorName = nameToUse;
        }
      }

      if (cloudData) {
        hydrateCongregation(cloudData);
      }

      // Actualizar configuración local sin sobreescribir la nube recién descargada
      updateSettings(newSettingsUpdate, { skipCloudWrite: true });

      const cleanPhoto =
        cloudData?.settings?.coordinatorPhotoURL ||
        cloudData?.coordinatorPhotoURL ||
        localStorage.getItem('kongre_coordinator_photo') ||
        localStorage.getItem('kongre_google_photo') ||
        '';

      if (cleanPhoto) {
        localStorage.setItem('kongre_coordinator_photo', cleanPhoto);
        if (roleFinal === 'coordinador') {
          localStorage.setItem('kongre_user_photo', cleanPhoto);
        }
      }

      assignRoleToEmail(emailToUse, roleFinal, nameToUse, cleanPersonalPin || undefined);
      setActiveRole(roleFinal);

      if (cleanPersonalPin) {
        localStorage.setItem('kongre_session_pin_v2', cleanPersonalPin);
      }

      // Si se identificó un publicador coincidente en la lista, asegurar la vinculación exacta
      if (matchingPub && matchingPub.id) {
        setIdentifiedPublisher(matchingPub.id, nameToUse);
      }

      localStorage.setItem('kongre_is_registered_congregation', 'true');
      localStorage.setItem('kongre_has_entered_app', 'true');
      localStorage.removeItem('kongre_needs_cloud_upload');
      localStorage.setItem('kongre_last_local_update', cloudData?.updatedAt || new Date().toISOString());

      // Vincular de forma persistente si el usuario tiene sesión activa
      const uidToLink = user?.uid;
      if (uidToLink) {
        try {
          localStorage.setItem('kongre_user_cong_id', effectiveId);
        } catch {}
      }

      setCodeSuccess(`¡Conexión exitosa a ${cleanCongName}! Bienvenido, ${nameToUse} (${THEOCRATIC_ROLES[roleFinal]?.name || roleFinal}).`);
      setTimeout(() => {
        onEnterApp();
      }, 900);
    } catch (err: any) {
      setCodeError(err?.message || 'Error al conectar con la congregación.');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Si tiene una solicitud en espera de aprobación, mostrar pantalla dedicada
  const currentPendingReq = user?.email
    ? accountLinkRequests.find(
        (r) => r.email.toLowerCase().trim() === user.email?.toLowerCase().trim() && r.status === 'pending'
      )
    : null;

  if (pendingApprovalEmail || currentPendingReq) {
    return (
      <PendingApprovalView
        email={pendingApprovalEmail || user?.email || ''}
        onEnterApp={() => {
          setPendingApprovalEmail(null);
          localStorage.setItem('kongre_has_entered_app', 'true');
          onEnterApp();
        }}
        onSignOut={async () => {
          await signOutUser();
          setPendingApprovalEmail(null);
          setActiveTab('home');
        }}
      />
    );
  }

  const handleGoogleLogin = async () => {
    setEmailError(null);
    setIsSubmittingEmail(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (!loggedUser) {
        setIsSubmittingEmail(false);
        return;
      }
      const userEmail = loggedUser.email?.toLowerCase().trim() || '';

      if (!userEmail) {
        setEmailError('No se pudo obtener el correo de la cuenta de Google.');
        setIsSubmittingEmail(false);
        return;
      }

      // Pre-llenar el ID de congregación si el usuario ya tenía uno registrado en su perfil
      try {
        const foundId = await findUserCongregationId(userEmail, loggedUser.uid);
        if (foundId) {
          setCongregationIdInput(foundId);
        }
      } catch (err) {
        console.warn('Aviso buscando ID de congregación:', err);
      }

      // Permanecer en la pantalla de inicio de sesión con Google para mostrar el enunciado y solicitar el ID de congregación
      setActiveTab('email_login');
    } catch (err: any) {
      setEmailError(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleEnterAsGuest = () => {
    setActiveRole('publico');
    setIdentifiedBrother('Invitado');
    localStorage.setItem('kongre_is_registered_congregation', 'true');
    localStorage.setItem('kongre_has_entered_app', 'true');
    localStorage.setItem('kongre_identified_brother', 'Invitado');
    onEnterApp();
  };

  const handleRequestAccessFromCoordinator = async () => {
    if (!unauthorizedGoogleAccount) return;
    setIsSubmittingRequest(true);
    try {
      await createAccountLinkRequest(
        unauthorizedGoogleAccount.email,
        unauthorizedGoogleAccount.name,
        '',
        'publico',
        unauthorizedGoogleAccount.congregationId
      );
      setPendingApprovalEmail(unauthorizedGoogleAccount.email);
    } catch (err: any) {
      setEmailError(err?.message || 'Error al enviar la solicitud al Coordinador.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* ========================================================= */}
      {/* 1. TOP HEADER                                            */}
      {/* ========================================================= */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          <Logo variant="horizontal" className="h-7 w-auto object-contain" />
        </div>

        {/* Right Actions: Theme Switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} size={36} />
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE / RESPONSIVE HERO & ACTIONS            */}
      {/* ========================================================= */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* ========================================================= */}
          {/* LEFT COLUMN: DESKTOP HERO & THEOCRATIC FEATURES          */}
          {/* ========================================================= */}
          <div className={`${activeTab === 'register' ? 'hidden' : 'lg:col-span-7 xl:col-span-7 hidden lg:flex'} flex-col space-y-6 transition-all duration-300`}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold w-fit shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Gestor Teocrático Integral • Seguro y Eficiente</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Toda la gestión teocrática de tu congregación, <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">en un solo lugar</span>.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Plataforma digital especializada para coordinadores, secretarios, superintendentes de servicio y publicadores. Organiza programas semanales, hojas S-89, asignaciones de limpieza y territorios con soporte offline PWA.
              </p>
            </div>

            {/* Feature Cards Grid (2x2 on Desktop) */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reuniones & Guía S-89
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Programación Vida y Ministerio, Fin de Semana, generación automática e impresión de hojas S-89 oficiales.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Territorios & Carritos
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Manzanas georreferenciadas, enlaces digitales por QR para publicadores y control de turnos en carritos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Seguridad por Roles & PIN
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Autenticación con ID de congregación, PIN de congregación y PIN personal bajo estrictas directrices.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  PWA & Modo Offline
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Úsala en el Salón sin conexión a internet; tus datos se sincronizan al volver a tener red.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: INTERACTIVE ACCESS CARD                    */}
          {/* ========================================================= */}
          <div className={`${activeTab === 'register' ? 'lg:col-span-12 max-w-3xl' : 'lg:col-span-5 xl:col-span-5 max-w-xl'} w-full mx-auto transition-all duration-300`}>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 lg:p-9 shadow-xl shadow-slate-900/5 space-y-6">
              {/* UNIFIED CARD HEADER ACROSS ALL VIEWS */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                {/* Top utility row: Logo, Section Badge & Back Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Logo variant="isotipo" className="w-5 h-5 object-contain" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Kongre • {
                        activeTab === 'home'
                          ? 'Portal de Acceso'
                          : activeTab === 'email_login'
                          ? 'Acceso con Google'
                          : activeTab === 'code_login'
                          ? 'Conexión con PIN'
                          : 'Registro de Congregación'
                      }
                    </span>
                  </div>

                  {activeTab !== 'home' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('home');
                        setCodeError(null);
                        setCodeSuccess(null);
                        setEmailError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-2xs hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver al inicio</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Gestor Teocrático
                    </span>
                  )}
                </div>

                {/* Main Title & Subtitle */}
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {activeTab === 'home'
                      ? '¡Bienvenido a Kongre!'
                      : activeTab === 'email_login'
                      ? 'Acceso con Google'
                      : activeTab === 'code_login'
                      ? 'Conectar con ID y PIN'
                      : activeTab === 'unauthorized'
                      ? 'Acceso Restringido'
                      : 'Registrar mi Congregación'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {activeTab === 'home'
                      ? 'Una herramienta teocrática que facilita la gestión integral de la congregación'
                      : activeTab === 'email_login'
                      ? 'Inicia sesión con tu cuenta de Google para acceder a tus asignaciones y perfil'
                      : activeTab === 'code_login'
                      ? 'Introduce el ID de congregación y tu PIN para acceder'
                      : activeTab === 'unauthorized'
                      ? 'Esta cuenta requiere autorización previa del Cuerpo de Ancianos'
                      : 'Configura los datos oficiales de tu congregación paso a paso'}
                  </p>
                </div>
              </div>

              {/* VIEW: MAIN HOME OPTIONS */}
              {activeTab === 'home' && (
                <div className="space-y-4 pt-1">
                  {/* Option 1: Registrar una Nueva Congregación */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="w-full p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-600 dark:hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Registrar mi Congregación
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 shrink-0">
                          Oficial
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Configura tu congregación desde cero (ID, PIN de Congregación, PIN Personal, circuito y horarios).
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-indigo-500 group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Option 2: Iniciar sesión con correo electrónico */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('email_login')}
                    className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all text-left flex items-start gap-4 group cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <div className="relative">
                        <UserIcon className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          @
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Iniciar sesión con Google
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Accede con tu cuenta verificada para sincronizar asignaciones y acceder a tu perfil.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Option 3: Iniciar sesión con ID & PIN o código de invitación */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('code_login');
                      setCodeError(null);
                      setCodeSuccess(null);
                    }}
                    className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all text-left flex items-start gap-4 group cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <div className="relative">
                        <Home className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          *
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Conectar con ID y PIN de Congregación
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Accede a una congregación existente con su ID y PIN o código de invitación.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Option 4: Entrar como Invitado / Cartelera */}
                  <button
                    type="button"
                    onClick={handleEnterAsGuest}
                    className="w-full p-4 sm:p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs transition-all text-left flex items-start gap-4 group cursor-pointer bg-white/60 dark:bg-slate-900/60"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Entrar como Invitado / Cartelera
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 shrink-0">
                          Solo Lectura
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Accede al programa de reuniones y anuncios públicos sin necesidad de cuenta ni PIN.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              )}

              {/* VIEW: EMAIL LOGIN (Google) */}
              {activeTab === 'email_login' && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  {/* Tarjeta explicativa con los 3 requisitos y aprobación obligatoria */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>¿Cómo funciona el acceso con Google? (Lee antes de iniciar)</span>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p>
                        Para proteger los registros privados de la congregación, iniciar con Google <strong>no da acceso inmediato por sí solo</strong>:
                      </p>
                      <ul className="space-y-1.5 pl-3 list-disc marker:text-indigo-500">
                        <li>
                          <strong>Si tu correo fue precargado por el Coordinador:</strong> Entrarás de inmediato a tu perfil y asignaciones.
                        </li>
                        <li>
                          <strong>Si tu correo no está registrado aún:</strong> Deberás ingresar el <strong>ID de Congregación</strong>, el <strong>PIN de Congregación</strong> y tu <strong>PIN Personal</strong> que te entregan los ancianos.
                        </li>
                        <li>
                          <strong>Aprobación obligatoria:</strong> Una vez enviados los PINs, se creará una solicitud. <em>Hasta que un anciano no apruebe la vinculación de tu cuenta, no podrás usar la app.</em>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-start gap-1.5 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                      <span className="shrink-0 text-sm">⚠️</span>
                      <span>
                        <strong>Consejo:</strong> Si no tienes los PINs que te proporcionan los ancianos, te sugerimos pedírselos antes de continuar para no perder tiempo.
                      </span>
                    </div>
                  </div>

                  {typeof window !== 'undefined' &&
                    window.location.hostname !== 'localhost' &&
                    (window.location.hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)) && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">Aviso importante de dominio local:</p>
                          <p>
                            Estás accediendo mediante <span className="font-mono font-bold">{window.location.hostname}</span>. La autenticación con Google autoriza <span className="font-mono font-bold">localhost</span> para entornos locales.
                          </p>
                          <a
                            href={`http://localhost:${window.location.port || '3050'}/`}
                            className="inline-block font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700"
                          >
                            Abrir en http://localhost:{window.location.port || '3050'}/ →
                          </a>
                        </div>
                      </div>
                    )}

                  {emailError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  {!user ? (
                    <>
                      {/* Google One-Click Button */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isSubmittingEmail}
                        className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 bg-white dark:bg-slate-900"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>{isSubmittingEmail ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                      </button>

                      {/* Acceso alternativo con ID y PIN */}
                      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ¿Prefieres ingresar sin cuenta de Google?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('code_login');
                              setCodeError(null);
                              setCodeSuccess(null);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                          >
                            Usa ID y PIN de Congregación →
                          </button>
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Tarjeta de cuenta de Google verificada */}
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'Google'}
                              className="w-10 h-10 rounded-full border-2 border-indigo-300 dark:border-indigo-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                              {(user.displayName || user.email || 'G')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Sesión de Google iniciada</span>
                            </div>
                            <p className="text-xs text-slate-900 dark:text-white font-bold truncate">
                              {user.displayName || user.email}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await signOutUser();
                            setEmailError(null);
                            setCodeError(null);
                          }}
                          className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline shrink-0 cursor-pointer"
                        >
                          Cambiar cuenta
                        </button>
                      </div>

                      {/* ENUNCIADO PARA PONER ID DE CONGREGACIÓN */}
                      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>¿A qué congregación perteneces?</span>
                        </div>
                        <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                          Kongre necesita saber a qué congregación enlazar tu cuenta. Introduce el <strong>ID y el PIN de tu congregación</strong> para conectarte, o regístrala como una nueva congregación.
                        </p>
                      </div>

                      {/* Formulario para ingresar ID y PIN de congregación */}
                      <form onSubmit={handleConnectWithIdPin} className="space-y-3.5">
                        {/* DATO 1: ID DE LA CONGREGACIÓN */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>1. ID de la Congregación: *</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={congregationIdInput}
                            onChange={(e) => setCongregationIdInput(e.target.value)}
                            placeholder="Ej: 10582"
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                          />
                        </div>

                        {/* DATO 2: PIN DE LA CONGREGACIÓN */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>2. PIN de la Congregación: *</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowCongPin(!showCongPin)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                            >
                              {showCongPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showCongPin ? 'Ocultar' : 'Ver PIN'}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showCongPin ? 'text' : 'password'}
                              required
                              maxLength={8}
                              value={congregationPinInput}
                              onChange={(e) => setCongregationPinInput(e.target.value)}
                              placeholder="PIN de 4 a 8 caracteres"
                              className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCongPin(!showCongPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showCongPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* DATO 3: PIN PERSONAL */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>3. PIN Personal Único:</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowPersPin(!showPersPin)}
                              className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              {showPersPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              <span>{showPersPin ? 'Ocultar' : 'Ver PIN'}</span>
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showPersPin ? 'text' : 'password'}
                              maxLength={16}
                              value={personalPinInput}
                              onChange={(e) => setPersonalPinInput(e.target.value)}
                              placeholder="PIN asignado o déjalo vacío si eres el creador"
                              className="w-full p-2.5 pr-10 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPersPin(!showPersPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/70 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showPersPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Si eres el Coordinador registrado en la congregación, puedes dejar este campo vacío.
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingCode || !congregationIdInput.trim() || !congregationPinInput.trim()}
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isSubmittingCode ? 'Verificando y vinculando...' : 'Vincular cuenta de Google y Entrar'}</span>
                        </button>
                      </form>

                      {/* Opción de Registrar Nueva Congregación */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('register');
                          }}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          ¿Tu congregación aún no está registrada? Regístrala aquí →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: CONEXIÓN UNIFICADA CON ID Y PIN DE CONGREGACIÓN / INVITACIÓN */}
              {activeTab === 'code_login' && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  {codeError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{codeError}</span>
                    </div>
                  )}

                  {codeSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>{codeSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleConnectWithIdPin} className="space-y-3.5">
                    {/* DATO 1: ID DE LA CONGREGACIÓN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>1. ID de la Congregación: *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={congregationIdInput}
                        onChange={(e) => setCongregationIdInput(e.target.value)}
                        placeholder="Ej: 10582"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Número oficial asignado a tu congregación.
                      </span>
                    </div>

                    {/* DATO 2: PIN DE LA CONGREGACIÓN */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>2. PIN de la Congregación: *</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCongPin(!showCongPin)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          {showCongPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showCongPin ? 'Ocultar' : 'Ver PIN'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showCongPin ? 'text' : 'password'}
                          required
                          maxLength={8}
                          value={congregationPinInput}
                          onChange={(e) => setCongregationPinInput(e.target.value)}
                          placeholder="PIN de 4 a 8 caracteres"
                          className="w-full p-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCongPin(!showCongPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showCongPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Clave de seguridad general de la congregación establecida al registrarla.
                      </span>
                    </div>

                    {/* DATO 3: PIN PERSONAL SUMINISTRADO POR EL COORDINADOR (Opcional si es coordinador) */}
                    <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>3. PIN Personal Único:</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPersPin(!showPersPin)}
                          className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          {showPersPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPersPin ? 'Ocultar' : 'Ver PIN'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPersPin ? 'text' : 'password'}
                          maxLength={16}
                          value={personalPinInput}
                          onChange={(e) => setPersonalPinInput(e.target.value)}
                          placeholder="PIN que te dio el Coordinador o déjalo vacío si eres el creador"
                          className="w-full p-2.5 pr-10 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPersPin(!showPersPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/70 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPersPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 block">
                        Si ya te habías registrado previamente antes de los cambios de PINs, puedes dejar este campo vacío o ingresar tu PIN anterior.
                      </span>
                    </div>

                    {/* Nota teocrática sobre la vinculación de cuentas */}
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Aprobación de Ancianos:</strong> Los coordinadores entran directamente sin aprobación. Si eres un publicador nuevo, se enviará una solicitud para que los ancianos la aprueben.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingCode || !congregationIdInput.trim() || (!congregationPinInput.trim() && !personalPinInput.trim())}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSubmittingCode ? 'Verificando datos...' : 'Conectar a la Congregación'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW: REGISTRO DE CONGREGACIÓN (Unificado en la misma tarjeta) */}
              {activeTab === 'register' && (
                <RegisterCongregationWizard
                  key={activeTab}
                  embedded={true}
                  isMandatory={!settings.isRegistered}
                  onOpenJoinWithCode={() => {
                    setActiveTab('code_login');
                  }}
                  onClose={() => setActiveTab('home')}
                  onRegisteredSuccess={() => {
                    localStorage.setItem('kongre_has_entered_app', 'true');
                    onEnterApp();
                  }}
                />
              )}

              {/* VIEW: CUENTA NO AUTORIZADA (Estilo Organized Unauthorized Role) */}
              {activeTab === 'unauthorized' && unauthorizedGoogleAccount && (
                <div className="space-y-5 pt-1 animate-in fade-in zoom-in-95 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <ShieldAlert className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                      Privacidad Teocrática • Cero Confianza
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                      Acceso Restringido a la Congregación
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                      La cuenta de Google <strong className="text-slate-800 dark:text-slate-200">({unauthorizedGoogleAccount.email})</strong> no figura en la lista de ancianos ni de hermanos autorizados de <strong className="text-slate-800 dark:text-slate-200">{unauthorizedGoogleAccount.congregationName}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 text-left space-y-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">¿Cómo deseas proceder?</p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
                      <li><strong>Solicitar Aprobación:</strong> El Coordinador recibirá tu solicitud y podrá autorizar tu cuenta con tu rol correspondiente.</li>
                      <li><strong>PIN Personal:</strong> Si los ancianos ya te dieron un PIN de publicador, ingrésalo para conectarte directamente.</li>
                      <li><strong>Entrar como Invitado:</strong> Verás el programa y los anuncios de solo lectura sin datos personales.</li>
                    </ul>
                  </div>

                  {emailError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleRequestAccessFromCoordinator}
                      disabled={isSubmittingRequest}
                      className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isSubmittingRequest ? 'Enviando solicitud...' : 'Solicitar Aprobación al Coordinador'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCongregationIdInput(unauthorizedGoogleAccount.congregationId);
                        setActiveTab('code_login');
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-indigo-500" />
                      <span>Conectar con ID y PIN de Congregación</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEnterAsGuest}
                      className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>Entrar como Invitado / Cartelera</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await signOutUser();
                        setUnauthorizedGoogleAccount(null);
                        setActiveTab('home');
                      }}
                      className="w-full py-2 px-4 text-rose-500 hover:text-rose-600 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión Google</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Policy & Terms Notice */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8 leading-relaxed">
          Más información sobre nuestros{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Términos de Uso
          </a>{' '}
          y{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Política de Privacidad
          </a>
          .
        </p>
      </main>

      {/* Subtle bottom note */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-400 dark:text-slate-600">
        Kongre • Gestor Teocrático Integral para Congregaciones
      </footer>
    </div>
  );
};
