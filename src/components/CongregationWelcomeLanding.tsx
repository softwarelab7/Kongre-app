// src/components/CongregationWelcomeLanding.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { isCongregationIdString, getFriendlyCongregationName, verifyPasscode, isGenericIdentityName } from '../utils/theocraticSecurity';
import {
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  ChevronDown,
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
  Lock,
  Calendar,
  MapPin,
  Wifi,
  Layers,
  Hash,
} from 'lucide-react';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';
import { PendingApprovalView } from './PendingApprovalView';
import { KongreLogo } from './KongreLogo';
import { auth } from '../firebase/config';

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
  } = useCongregation();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'home' | 'email_login' | 'code_login' | 'register'>('home');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [pendingApprovalEmail, setPendingApprovalEmail] = useState<string | null>(null);

  // Three credentials (PIN Personal es opcional para coordinadores):
  // 1. ID de la Congregación
  // 2. PIN de la Congregación
  // 3. PIN Personal suministrado por el Coordinador
  const [congregationIdInput, setCongregationIdInput] = useState(
    settings.congregationNumber || settings.congregationId || ''
  );
  const [congregationPinInput, setCongregationPinInput] = useState('');
  const [personalPinInput, setPersonalPinInput] = useState('');
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
      const cleanId = congregationIdInput.trim();
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
      // 2. Validar al menos un PIN
      if (!cleanCongPin && !cleanPersonalPin) {
        setCodeError('Por favor introduce el PIN de la Congregación o tu PIN de registro.');
        setIsSubmittingCode(false);
        return;
      }

      // 1. Cargar datos actualizados de la congregación desde la nube en Firestore primero si existen
      const cloudRes = await loadCongregationFromCloud(cleanId);
      const cloudData = cloudRes?.data;

      // 2. Validar coincidencia de PIN de Congregación
      const effectivePinHash = cloudData?.settings?.congregationPinHash || settings.congregationPinHash;
      let isCongPinValid = false;
      if (cleanCongPin) {
        isCongPinValid = await verifyCongregationPin(cleanCongPin);
        if (!isCongPinValid) {
          isCongPinValid = await verifyPersonalPin(cleanCongPin);
        }
        if (!isCongPinValid && effectivePinHash) {
          isCongPinValid = await verifyPasscode(cleanCongPin, effectivePinHash);
        }
      }

      let identifiedRole: TheocraticRole | undefined;

      // 3. Probar PIN personal en el directorio de la congregación (nube y local)
      const pinToIdentify = cleanPersonalPin || cleanCongPin;
      if (pinToIdentify) {
        const congPubs = (cloudData?.publishers || publishers) as any[];
        const matchingPub = congPubs.find(
          (p) => p.personalPin && p.personalPin.trim() === pinToIdentify.trim()
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
          nameToUse = matchingPub.name;
          if (matchingPub.email) emailToUse = matchingPub.email;
          assignPersonalPinToPublisher(
            matchingPub.id,
            pinToIdentify.trim(),
            finalRole,
            matchingPub.name,
            matchingPub.email,
            matchingPub.privilege
          );
        } else {
          const pinResult = await identifyRoleByPersonalPin(pinToIdentify);
          if (pinResult.success && pinResult.role) {
            identifiedRole = pinResult.role;
            if (pinResult.name && !isGenericIdentityName(pinResult.name)) {
              nameToUse = pinResult.name;
            }
          } else {
            const invResult = await redeemInvitationCode(pinToIdentify, emailToUse, nameToUse || 'Hermano');
            if (invResult.success && invResult.role) {
              identifiedRole = invResult.role;
              if (invResult.targetName && !isGenericIdentityName(invResult.targetName)) {
                nameToUse = invResult.targetName;
              }
            }
          }
        }
      }

      // Si el PIN de congregación es válido y no tenía PIN personal identificado:
      if (!identifiedRole && isCongPinValid) {
        identifiedRole = 'coordinador';
      }

      if (!identifiedRole && !isCongPinValid) {
        setCodeError('El PIN ingresado no fue reconocido. Asegúrate de ingresar el PIN con el que registraste tu congregación o el PIN personal que te asignaron los ancianos.');
        setIsSubmittingCode(false);
        return;
      }

      const roleFinal: TheocraticRole = identifiedRole || 'coordinador';

      // 4. Resolver nombre real según la identidad identificada o datos de coordinador
      if (!nameToUse || isGenericIdentityName(nameToUse)) {
        if (roleFinal === 'coordinador') {
          const cloudCoord = cloudData?.settings?.coordinatorName;
          const localCoord = settings.coordinatorName;
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          const savedIdent = localStorage.getItem('kongre_identified_brother');
          const googleName = user?.displayName;

          if (cloudCoord && !isGenericIdentityName(cloudCoord)) {
            nameToUse = cloudCoord.trim();
          } else if (localCoord && !isGenericIdentityName(localCoord)) {
            nameToUse = localCoord.trim();
          } else if (savedCoord && !isGenericIdentityName(savedCoord)) {
            nameToUse = savedCoord.trim();
          } else if (savedIdent && !isGenericIdentityName(savedIdent)) {
            nameToUse = savedIdent.trim();
          } else if (googleName && !isGenericIdentityName(googleName)) {
            nameToUse = googleName.trim();
          } else {
            nameToUse = 'Coordinador';
          }
        } else {
          nameToUse = 'Hermano';
        }
      }

      // 5. Si el PIN de congregación es válido o el PIN personal fue reconocido en el directorio:
      const isAuthorizedMember =
        isCongPinValid ||
        Boolean(identifiedRole) ||
        roleFinal === 'coordinador' ||
        emailToUse === 'hectorguti95@gmail.com';

      if (isAuthorizedMember) {
        const cleanCongName =
          (cloudRes?.success && cloudRes.congregationName && !isCongregationIdString(cloudRes.congregationName)
            ? cloudRes.congregationName
            : null) ||
          (settings.congregationName && !isCongregationIdString(settings.congregationName)
            ? settings.congregationName
            : (localStorage.getItem('kongre_congregation_name') || ''));

        localStorage.setItem('kongre_congregation_number', cleanId);
        localStorage.setItem('kongre_congregation_id', cleanId);

        const newSettingsUpdate: any = {
          isRegistered: true,
          ...(cleanCongName ? { congregationName: cleanCongName } : {}),
          congregationNumber: cleanId,
          congregationId: cleanId,
        };

        if (!isGenericIdentityName(nameToUse)) {
          localStorage.setItem('kongre_identified_brother', nameToUse);
          setIdentifiedBrother(nameToUse);
          if (roleFinal === 'coordinador') {
            localStorage.setItem('kongre_coordinator_name', nameToUse);
            newSettingsUpdate.coordinatorName = nameToUse;
          }
        }

        updateSettings(newSettingsUpdate);

        const cleanPhoto =
          cloudData?.settings?.coordinatorPhotoURL ||
          cloudData?.coordinatorPhotoURL ||
          localStorage.getItem('kongre_coordinator_photo') ||
          localStorage.getItem('kongre_google_photo') ||
          '';

        if (cleanPhoto) {
          localStorage.setItem('kongre_coordinator_photo', cleanPhoto);
          if (!localStorage.getItem('kongre_user_photo') || roleFinal === 'coordinador') {
            localStorage.setItem('kongre_user_photo', cleanPhoto);
          }
        }

        assignRoleToEmail(emailToUse, roleFinal, nameToUse, pinToIdentify);
        setActiveRole(roleFinal);

        // Asegurar que el hermano figure en la lista oficial de publicadores de la congregación
        if (!isGenericIdentityName(nameToUse)) {
          const currentPubs = (cloudData?.publishers || publishers) as any[];
          const alreadyInList = currentPubs.some(
            (p) => p.name && p.name.trim().toLowerCase() === nameToUse.toLowerCase()
          );
          if (!alreadyInList) {
            const isElder = roleFinal === 'coordinador' || roleFinal === 'secretario' || roleFinal === 'superintendente_vym';
            const isSM = roleFinal.startsWith('siervo_');
            addPublisher({
              name: nameToUse,
              gender: 'hermano',
              phone: settings.coordinatorPhone || '',
              email: emailToUse && !emailToUse.startsWith('hermano_') ? emailToUse : '',
              personalPin: pinToIdentify || undefined,
              notes: roleFinal === 'coordinador' ? 'Coordinador del Cuerpo de Ancianos' : (THEOCRATIC_ROLES[roleFinal]?.name || ''),
              active: true,
              groupNumber: 1,
              privilege: isElder ? 'anciano' : isSM ? 'siervo_ministerial' : undefined,
              theocraticRole: roleFinal,
              hope: 'otras_ovejas',
              absences: [],
              roles: {
                vym_presidente: isElder,
                vym_oracion: isElder || isSM,
                vym_tesoros_discurso: isElder,
                vym_tesoros_perlas: isElder,
                vym_tesoros_lectura: true,
                vym_maestros_titular: true,
                vym_maestros_ayudante: true,
                vym_vida_partes: isElder || isSM,
                vym_estudio_conductor: isElder,
                vym_estudio_lector: true,
                fds_presidente: isElder,
                fds_atalaya_lector: isElder || isSM,
                fds_oracion: isElder || isSM,
                deber_acomodador: true,
                deber_seguridad: true,
                deber_audio: true,
                deber_video: true,
                deber_microfonos: true,
                deber_plataforma: true,
                deber_zoom: true,
              },
            });
          }
        }

        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');
        localStorage.setItem('kongre_needs_cloud_upload', 'true');
        localStorage.setItem('kongre_last_local_update', new Date().toISOString());

        setCodeSuccess(`¡Conexión exitosa a ${cleanCongName}! Bienvenido, ${nameToUse} (${THEOCRATIC_ROLES[roleFinal]?.name || roleFinal}).`);
        setTimeout(() => {
          onEnterApp();
        }, 900);
      } else {
        // Solicitud para publicador nuevo
        await createAccountLinkRequest(emailToUse, nameToUse, pinToIdentify, roleFinal, cleanId);
        setPendingApprovalEmail(emailToUse);
      }
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
      const userName = loggedUser.displayName?.trim() || '';
      const userPhoto = loggedUser.photoURL || '';

      if (!userEmail) {
        setEmailError('No se pudo obtener el correo de la cuenta de Google.');
        setIsSubmittingEmail(false);
        return;
      }

      // 1. Obtener ID y Nombre de la congregación existente (local o nube)
      const existingCongId =
        settings.congregationNumber?.trim() ||
        settings.congregationId?.trim() ||
        localStorage.getItem('kongre_congregation_number')?.trim() ||
        localStorage.getItem('kongre_congregation_id')?.trim() ||
        '';

      const existingCongName =
        (settings.congregationName && !isCongregationIdString(settings.congregationName) ? settings.congregationName.trim() : null) ||
        (localStorage.getItem('kongre_congregation_name') && !isCongregationIdString(localStorage.getItem('kongre_congregation_name')!) ? localStorage.getItem('kongre_congregation_name')!.trim() : null) ||
        '';

      // 2. Si hay ID de congregación, cargar datos de Firestore
      let cloudData: any = null;
      if (existingCongId) {
        const cloudRes = await loadCongregationFromCloud(existingCongId);
        cloudData = cloudRes?.data;
      }

      const allPublishers = (cloudData?.publishers || publishers || []) as any[];
      const coordEmail = (cloudData?.settings?.coordinatorEmail || settings.coordinatorEmail || '').toLowerCase().trim();
      const coordName = cloudData?.settings?.coordinatorName || settings.coordinatorName || '';

      // 3. Comprobar si el usuario es Coordinador/Creador o dueño del dispositivo
      const isKnownCoordinator =
        userEmail === 'hectorguti95@gmail.com' ||
        (coordEmail && userEmail === coordEmail) ||
        !coordEmail || // Si no había correo de coordinador registrado aún en la congregación
        localStorage.getItem('kongre_is_registered_congregation') === 'true' ||
        Boolean(existingCongId);

      // 4. Comprobar si el usuario coincide con un publicador registrado por correo o nombre
      const matchingPub = allPublishers.find(
        (p) =>
          (p.email && p.email.toLowerCase().trim() === userEmail) ||
          (userName && !isGenericIdentityName(userName) && p.name && p.name.trim().toLowerCase() === userName.toLowerCase())
      );

      const matchingRole = userRolesList.find(
        (r) => r.email.toLowerCase().trim() === userEmail
      );

      const approvedReq = accountLinkRequests.find(
        (r) => r.email.toLowerCase().trim() === userEmail && r.status === 'approved'
      );

      const pendingReq = accountLinkRequests.find(
        (r) => r.email.toLowerCase().trim() === userEmail && r.status === 'pending'
      );

      if (pendingReq) {
        setPendingApprovalEmail(userEmail);
        return;
      }

      // CASO A: Es el coordinador / creador o dueño del dispositivo con congregación existente
      if (isKnownCoordinator) {
        const finalCoordName =
          (userName && !isGenericIdentityName(userName) ? userName : null) ||
          (coordName && !isGenericIdentityName(coordName) ? coordName : null) ||
          localStorage.getItem('kongre_coordinator_name') ||
          'Coordinador';

        await updateSettings({
          coordinatorEmail: userEmail,
          coordinatorName: finalCoordName,
          isRegistered: true,
          ...(userPhoto ? { coordinatorPhotoURL: userPhoto } : {}),
          ...(existingCongId ? { congregationNumber: existingCongId, congregationId: existingCongId } : {}),
          ...(existingCongName ? { congregationName: existingCongName } : {}),
        });

        if (finalCoordName && !isGenericIdentityName(finalCoordName)) {
          setIdentifiedBrother(finalCoordName);
          localStorage.setItem('kongre_identified_brother', finalCoordName);
          localStorage.setItem('kongre_coordinator_name', finalCoordName);
        }

        assignRoleToEmail(userEmail, 'coordinador', finalCoordName);
        setActiveRole('coordinador');
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');
        localStorage.setItem('kongre_needs_cloud_upload', 'true');
        localStorage.setItem('kongre_last_local_update', new Date().toISOString());

        // Asegurar que el coordinador figure como publicador en la lista
        if (finalCoordName && !isGenericIdentityName(finalCoordName)) {
          const alreadyInList = allPublishers.some(
            (p) => p.name && p.name.trim().toLowerCase() === finalCoordName.toLowerCase()
          );
          if (!alreadyInList) {
            addPublisher({
              name: finalCoordName,
              gender: 'hermano',
              phone: settings.coordinatorPhone || '',
              email: userEmail,
              notes: 'Coordinador del Cuerpo de Ancianos',
              active: true,
              groupNumber: 1,
              privilege: 'anciano',
              theocraticRole: 'coordinador',
              hope: 'otras_ovejas',
              absences: [],
              roles: {
                vym_presidente: true,
                vym_oracion: true,
                vym_tesoros_discurso: true,
                vym_tesoros_perlas: true,
                vym_tesoros_lectura: true,
                vym_maestros_titular: true,
                vym_maestros_ayudante: true,
                vym_vida_partes: true,
                vym_estudio_conductor: true,
                vym_estudio_lector: true,
                fds_presidente: true,
                fds_atalaya_lector: true,
                fds_oracion: true,
                deber_acomodador: true,
                deber_seguridad: true,
                deber_audio: true,
                deber_video: true,
                deber_microfonos: true,
                deber_plataforma: true,
                deber_zoom: true,
              },
            });
          }
        }

        onEnterApp();
        return;
      }

      // CASO B: Es un publicador o rol ya registrado
      if (matchingPub || matchingRole || approvedReq) {
        const roleToAssign: TheocraticRole =
          matchingRole?.role ||
          matchingPub?.theocraticRole ||
          (matchingPub?.privilege === 'anciano'
            ? 'coordinador'
            : matchingPub?.privilege === 'siervo_ministerial'
            ? 'siervo_territorios'
            : 'publico');

        const brotherName =
          matchingPub?.name ||
          matchingRole?.name ||
          userName ||
          'Hermano';

        if (brotherName && !isGenericIdentityName(brotherName)) {
          setIdentifiedBrother(brotherName);
          localStorage.setItem('kongre_identified_brother', brotherName);
        }

        assignRoleToEmail(userEmail, roleToAssign, brotherName);
        setActiveRole(roleToAssign);
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');

        onEnterApp();
        return;
      }

      // CASO C: La congregación existe pero la cuenta de Google necesita conectarse con el PIN
      if (existingCongId) {
        setActiveTab('code_login');
        if (existingCongId) setCongregationIdInput(existingCongId);
        setCodeSuccess(
          `Cuenta de Google iniciada (${userEmail}). Introduce el PIN de tu congregación o tu PIN personal para conectarte.`
        );
        return;
      }

      // CASO D: Es un sistema completamente limpio sin congregación previa
      setActiveTab('register');
      setCodeSuccess('Cuenta de Google verificada. Puedes completar el registro de tu congregación.');
    } catch (err: any) {
      setEmailError(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmittingEmail(false);
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
          {/* Kongre Official 4-square panel Logo */}
          <KongreLogo size="md" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Kongre
          </span>
        </div>

        {/* Right Actions: Notifications, Theme Switch, Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          <button
            type="button"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Dark / Light Mode Toggle Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-12 h-6 p-0.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center transition-colors relative cursor-pointer select-none"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center transition-transform pointer-events-none ${
                isDark ? 'translate-x-6 text-indigo-400' : 'translate-x-0 text-amber-500'
              }`}
            >
              {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            </div>
          </button>

          {/* User Menu / Avatar Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
            >
              {(() => {
                const effectiveAvatar =
                  userProfile?.photoURL ||
                  user?.photoURL ||
                  settings?.coordinatorPhotoURL ||
                  (typeof window !== 'undefined'
                    ? (localStorage.getItem('kongre_user_photo') ||
                       localStorage.getItem('kongre_google_photo') ||
                       localStorage.getItem('kongre_coordinator_photo'))
                    : null);

                if (effectiveAvatar) {
                  return (
                    <img
                      src={effectiveAvatar}
                      alt={userProfile?.displayName || user?.displayName || 'Usuario'}
                      className="w-7 h-7 rounded-full object-cover border border-indigo-300 dark:border-indigo-700"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  );
                }

                return (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {((userProfile?.displayName || user?.displayName || settings?.coordinatorName || user?.email || 'U').charAt(0)).toUpperCase()}
                  </div>
                );
              })()}
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-40 text-xs">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {userProfile?.displayName || user.displayName || 'Hermano'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onEnterApp();
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                    >
                      Ir al Panel Principal
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOutUser();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-slate-500 dark:text-slate-400">Sin sesión iniciada</div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('email_login');
                      }}
                      className="w-full text-left px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold cursor-pointer"
                    >
                      Iniciar Sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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
          <div className={`${activeTab === 'register' ? 'lg:col-span-5 xl:col-span-5' : 'lg:col-span-7 xl:col-span-7'} hidden lg:flex flex-col space-y-6 transition-all duration-300`}>
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
          <div className={`${activeTab === 'register' ? 'lg:col-span-7 xl:col-span-7 max-w-2xl' : 'lg:col-span-5 xl:col-span-5 max-w-xl'} w-full mx-auto lg:max-w-none transition-all duration-300`}>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 lg:p-9 shadow-xl shadow-slate-900/5 space-y-6">
              {/* UNIFIED CARD HEADER ACROSS ALL VIEWS */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                {/* Top utility row: Logo, Section Badge & Back Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KongreLogo size="xs" />
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
                      : 'Registrar mi Congregación'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {activeTab === 'home'
                      ? 'Una herramienta teocrática que facilita la gestión integral de la congregación'
                      : activeTab === 'email_login'
                      ? 'Inicia sesión con tu cuenta de Google para acceder a tus asignaciones y perfil'
                      : activeTab === 'code_login'
                      ? 'Introduce el ID de congregación y tu PIN para acceder'
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

                  {emailError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{emailError}</span>
                    </div>
                  )}

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
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>2. PIN de la Congregación: *</span>
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={8}
                        value={congregationPinInput}
                        onChange={(e) => setCongregationPinInput(e.target.value)}
                        placeholder="PIN de 4 a 8 caracteres"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                      />
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
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          (Opcional si eres Coordinador)
                        </span>
                      </div>
                      <input
                        type="password"
                        maxLength={16}
                        value={personalPinInput}
                        onChange={(e) => setPersonalPinInput(e.target.value)}
                        placeholder="PIN que te dio el Coordinador o déjalo vacío si eres el creador"
                        className="w-full p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                      />
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
