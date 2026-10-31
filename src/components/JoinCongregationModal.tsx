// src/components/JoinCongregationModal.tsx
import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { verifyPasscode, isCongregationIdString, isGenericIdentityName, formatCanonicalCongregationId, formatCongregationIdInput, formatCongregationPinInput, verifyPersonalPinMatch, verifySecureLocalPin, setSecureLocalPin, getPinLockoutRemainingSeconds, recordFailedPinAttempt, resetFailedPinAttempts, decodeSecureShareToken } from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';
import { supabaseSyncService } from '../services/supabaseSyncService';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  KeyRound,
  Lock,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  LegalConsentCheckbox,
  hasAcceptedLegalTerms,
  recordLegalTermsAcceptance,
} from './TermsAndPrivacyModal';

interface JoinCongregationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (role: TheocraticRole) => void;
}

export const JoinCongregationModal: React.FC<JoinCongregationModalProps> = ({
  isOpen,
  onClose,
  onSuccessRole,
}) => {
  const { redeemInvitationCode, verifyCongregationPin } = useSecurity();
  const { user, assignRoleToEmail, setActiveRole, setActiveRoles, identifyRoleByPersonalPin, setIdentifiedBrother, setIdentifiedPublisher } = useAuth();
  const {
    settings,
    updateSettings,
    publishers,
    addPublisher,
    accountLinkRequests,
    createAccountLinkRequest,
    loadCongregationFromCloud,
    hydrateCongregation,
    exitDemoMode,
  } = useCongregation();

  // Exactly three required theocratic credentials:
  // 1. ID de la Congregación
  // 2. PIN de la Congregación
  // 3. PIN Personal suministrado por el Coordinador u otro anciano
  const [congregationIdInput, setCongregationIdInput] = useState(() => {
    const defaultId = settings.congregationNumber || settings.congregationId || '';
    if (!defaultId || defaultId.toUpperCase().includes('DEMO')) return '';
    return formatCanonicalCongregationId(defaultId);
  });

  // Garantizar que '1001-DEMO' nunca persista en el modal
  React.useEffect(() => {
    if (congregationIdInput && congregationIdInput.toUpperCase().includes('DEMO')) {
      setCongregationIdInput('');
    }
  }, [congregationIdInput]);
  const [congregationPinInput, setCongregationPinInput] = useState('');
  const [personalPinInput, setPersonalPinInput] = useState('');
  const [showCongPin, setShowCongPin] = useState(false);
  const [showPersPin, setShowPersPin] = useState(false);

  // Precargar credenciales si el modal se abrió desde un enlace cifrado (?tk=...) o invitación (?invite=...) y limpiar URL
  React.useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const decodedTk = decodeSecureShareToken(urlParams.get('tk'));
    const tkCong = decodedTk?.cong || urlParams.get('cong');
    const tkCpin = decodedTk?.cpin; // L-04: Solo aceptar cpin desde token cifrado tk, nunca en texto plano
    const tkInvite = decodedTk?.invite || urlParams.get('invite');

    if (tkCong && !tkCong.toUpperCase().includes('DEMO')) {
      setCongregationIdInput(formatCanonicalCongregationId(tkCong));
    }
    if (tkCpin) {
      setCongregationPinInput(tkCpin);
    }
    if (tkInvite) {
      setPersonalPinInput(tkInvite);
    }

    if (
      urlParams.has('tk') ||
      urlParams.has('invite') ||
      urlParams.has('cpin') ||
      urlParams.has('pin') ||
      window.location.hash.includes('cpin=') ||
      window.location.hash.includes('pin=')
    ) {
      const cleanHash = (window.location.hash || '').split('?')[0];
      const cleanUrl = window.location.pathname + cleanHash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [isOpen]);

  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    role: TheocraticRole;
    message: string;
    identifiedBrother: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState<boolean>(() =>
    hasAcceptedLegalTerms()
  );

  React.useEffect(() => {
    const syncConsent = () => setAcceptedLegalTerms(hasAcceptedLegalTerms());
    window.addEventListener('kongre_legal_terms_accepted', syncConsent);
    return () => window.removeEventListener('kongre_legal_terms_accepted', syncConsent);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!acceptedLegalTerms) {
      setError('Debes aceptar los Términos de Uso y la Política de Privacidad para conectarte a la congregación.');
      return;
    }
    setIsSubmitting(true);

    try {
      const lockoutRem = getPinLockoutRemainingSeconds();
      if (lockoutRem > 0) {
        setError(`Demasiados intentos fallidos. Por seguridad, espera ${lockoutRem} segundos antes de volver a intentar.`);
        setIsSubmitting(false);
        return;
      }

      const cleanId = congregationIdInput.trim();
      const cleanCongPin = congregationPinInput.trim();
      const cleanPersonalPin = personalPinInput.trim();
      let emailToUse = user?.email || `hermano_${cleanId || 'cong'}@kongre.org`;

      // Validación 1: ID de la Congregación
      if (!cleanId) {
        setError('Por favor introduce el ID de la Congregación.');
        setIsSubmitting(false);
        return;
      }

      // Validación 2: PIN de la Congregación
      if (!cleanCongPin) {
        setError('Por favor introduce el PIN de la Congregación.');
        setIsSubmitting(false);
        return;
      }

      // Validación 3: PIN Personal suministrado por el Coordinador
      if (!cleanPersonalPin) {
        setError('Por favor introduce el PIN Personal suministrado por el Coordinador u otro anciano.');
        setIsSubmitting(false);
        return;
      }

      recordLegalTermsAcceptance();

      // Si el ID ingresado no es de demostración, desactivar banderas previas de modo demo
      const isInputDemo = cleanId.toUpperCase().includes('DEMO') || cleanId === '1001';
      if (!isInputDemo) {
        try {
          localStorage.removeItem('kongre_demo_mode');
          localStorage.removeItem('kongre_is_guest');
        } catch {}
        if (exitDemoMode) exitDemoMode();
      }

      // 1. Cargar datos actualizados de la congregación desde Supabase pasando los PINs provistos (sin hidratar aún)
      const cloudRes = await loadCongregationFromCloud(cleanId, {
        skipHydrate: true,
        pin: cleanCongPin,
        personalPin: cleanPersonalPin,
      });
      let cloudData = cloudRes?.data;

      // Si no se encontró en el primer intento, intentar descargar y descifrar directamente desde Supabase
      let isSupabaseDecrypted = Boolean(cloudRes?.isDecryptedFromCloud);
      if (!cloudData) {
        try {
          const sbRes = await supabaseSyncService.fetchAndDecryptCongregation(cleanId, cleanCongPin);
          if (sbRes.success && sbRes.data) {
            cloudData = sbRes.data;
            isSupabaseDecrypted = true;
          }
        } catch {}
      }

      const effectiveSettings = cloudData?.settings || settings;
      const expectedId = effectiveSettings.congregationNumber || effectiveSettings.congregationId;
      const customCode = effectiveSettings.customCode;
      const isIdMatch =
        !expectedId ||
        (expectedId && cleanId.toLowerCase() === expectedId.trim().toLowerCase()) ||
        (customCode && cleanId.toLowerCase() === customCode.trim().toLowerCase());
      if (expectedId && !isIdMatch) {
        setError('El ID o Código de la Congregación no coincide con la congregación de este sistema.');
        setIsSubmitting(false);
        return;
      }

      // Verificar PIN de la Congregación
      const effectivePinHash = cloudData?.settings?.congregationPinHash || effectiveSettings.congregationPinHash;
      let isCongPinValid = isSupabaseDecrypted;
      if (!isCongPinValid) {
        if (effectivePinHash) {
          isCongPinValid = await verifyPasscode(cleanCongPin, effectivePinHash);
        } else {
          isCongPinValid = await verifyCongregationPin(cleanCongPin);
        }
      }

      if (!isCongPinValid) {
        const failInfo = recordFailedPinAttempt();
        setError(
          failInfo.isLockedOut
            ? `El PIN de la Congregación es incorrecto. Acceso bloqueado temporalmente por ${failInfo.remainingSeconds} segundos.`
            : 'El PIN de la Congregación es incorrecto.'
        );
        setIsSubmitting(false);
        return;
      }

      setSecureLocalPin('kongre_registered_cong_pin', cleanCongPin);
      setSecureLocalPin('kongre_last_cong_pin', cleanCongPin);

      // Verificar PIN Personal (Código de Identificación de Rol otorgado por el Coordinador o código de invitación)
      let identifiedRole: TheocraticRole | undefined;
      let identifiedRolesList: TheocraticRole[] = [];
      let finalBrotherName = '';

      let codeToRedeem = cleanPersonalPin;
      if (cleanPersonalPin.startsWith('kgr_tk1_')) {
        const decoded = decodeSecureShareToken(cleanPersonalPin);
        if (decoded?.invite) codeToRedeem = decoded.invite.trim();
        else if (decoded?.pin) codeToRedeem = decoded.pin.trim();
      } else if (cleanPersonalPin.includes('::')) {
        const parts = cleanPersonalPin.split('::').map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 3) codeToRedeem = parts.slice(2).join('::');
      }

      // A) Buscar en la lista local o verificar de forma segura contra la Edge Function (sin hashes públicos)
      const congPubs = (cloudData?.publishers || publishers) as any[];
      let matchingPub = congPubs.find((p) => verifyPersonalPinMatch(codeToRedeem, p));

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const decodedTk = decodeSecureShareToken(urlParams?.get('tk'));
      const candidatePub =
        (decodedTk?.pub ? congPubs.find((p) => p.id === decodedTk.pub) : null) ||
        congPubs.find((p) => p.email && emailToUse && p.email.toLowerCase() === emailToUse.toLowerCase()) ||
        congPubs.find((p) => p.name && user?.displayName && p.name.toLowerCase() === user.displayName.toLowerCase());
      const targetPubId = candidatePub?.id || '';

      if (!matchingPub && codeToRedeem.length >= 4 && cleanCongPin && targetPubId) {
        try {
          const verifyRes = await supabaseSyncService.verifyPersonalPin(cleanId, cleanCongPin, codeToRedeem, targetPubId);
          if (verifyRes.success && verifyRes.publisher) {
            matchingPub = {
              id: verifyRes.publisher.id,
              name: verifyRes.publisher.name,
              theocraticRole: verifyRes.publisher.role,
              privilege: verifyRes.publisher.privilege,
              theocraticRoles: verifyRes.publisher.theocraticRoles,
            };
          }
        } catch {}
      }
      let isInvitationApproved = false;

      if (matchingPub) {
        let finalRole: TheocraticRole =
          matchingPub.theocraticRole ||
          (matchingPub.privilege === 'anciano'
            ? 'anciano'
            : 'publico');
        if (finalRole === 'coordinador') {
          const isVerifiedCoord = verifySecureLocalPin('kongre_coordinator_pin', codeToRedeem);
          if (!isVerifiedCoord) {
            finalRole = matchingPub.privilege === 'anciano' ? 'anciano' : 'publico';
          }
        }
        identifiedRole = finalRole;
        const rolesSet = new Set<TheocraticRole>([finalRole]);
        if (matchingPub.privilege === 'anciano') rolesSet.add('anciano');
        if (Array.isArray(matchingPub.theocraticRoles)) {
          matchingPub.theocraticRoles.forEach((r: string) => {
            if (r && THEOCRATIC_ROLES[r as TheocraticRole]) {
              rolesSet.add(r as TheocraticRole);
            }
          });
        }
        identifiedRolesList = Array.from(rolesSet);

        finalBrotherName = matchingPub.name && !isGenericIdentityName(matchingPub.name) ? matchingPub.name.trim() : 'Hermano';
        if (matchingPub.email) emailToUse = matchingPub.email;
        if (matchingPub.id) {
          setIdentifiedPublisher(matchingPub.id, finalBrotherName);
          setSecureLocalPin('kongre_session_pin_v2', codeToRedeem);
        }
      } else {
        if (cloudData?.invitations && Array.isArray(cloudData.invitations)) {
          try {
            localStorage.setItem('kongre_theocratic_invitations_v1', JSON.stringify(cloudData.invitations));
            window.dispatchEvent(new CustomEvent('kongre_invitations_updated', { detail: cloudData.invitations }));
          } catch {}
        }
        // B) Verificar si es un código de invitación generado por los ancianos
        const invResult = await redeemInvitationCode(codeToRedeem, emailToUse, 'Hermano', cloudData?.invitations);
        if (invResult.success && invResult.role) {
          identifiedRole = invResult.role;
          identifiedRolesList = [invResult.role];
          isInvitationApproved = true;
          if (invResult.targetName && !isGenericIdentityName(invResult.targetName)) {
            finalBrotherName = invResult.targetName;
          }
        }
      }

      if (!identifiedRole) {
        const failInfo = recordFailedPinAttempt();
        setError(
          failInfo.isLockedOut
            ? `El PIN Personal no coincide con ningún publicador. Acceso bloqueado temporalmente por ${failInfo.remainingSeconds} segundos.`
            : 'El PIN Personal o Código de Invitación no coincide con ningún registro en esta congregación. Verifica los datos provistos por los ancianos.'
        );
        setIsSubmitting(false);
        return;
      }

      resetFailedPinAttempts();

      // Resolver nombre no genérico con prioridad
      if (!finalBrotherName || isGenericIdentityName(finalBrotherName)) {
        if (identifiedRole === 'coordinador') {
          const cloudCoord = cloudData?.settings?.coordinatorName;
          const localCoord = settings.coordinatorName;
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          const googleName = user?.displayName;

          if (cloudCoord && !isGenericIdentityName(cloudCoord)) {
            finalBrotherName = cloudCoord.trim();
          } else if (localCoord && !isGenericIdentityName(localCoord)) {
            finalBrotherName = localCoord.trim();
          } else if (savedCoord && !isGenericIdentityName(savedCoord)) {
            finalBrotherName = savedCoord.trim();
          } else if (googleName && !isGenericIdentityName(googleName)) {
            finalBrotherName = googleName.trim();
          } else {
            finalBrotherName = 'Coordinador';
          }
        } else {
          finalBrotherName = user?.displayName && !isGenericIdentityName(user.displayName) ? user.displayName.trim() : 'Hermano';
        }
      }

      // Verificar si el correo ya fue registrado por el coordinador, ya está aprobado o es una invitación oficial
      const effectiveCoordEmail = (cloudData?.settings?.coordinatorEmail || settings.coordinatorEmail || '').toLowerCase().trim();
      const effectiveRequests = (cloudData?.accountLinkRequests || accountLinkRequests) as any[];
      const isCoordinator =
        Boolean(effectiveCoordEmail) &&
        effectiveCoordEmail === emailToUse.toLowerCase().trim();
      const isPreRegisteredPublisher = congPubs.some(
        (p) => p.email && p.email.toLowerCase().trim() === emailToUse.toLowerCase().trim()
      );
      const isAlreadyApproved = effectiveRequests.some(
        (r) => r.email && r.email.toLowerCase().trim() === emailToUse.toLowerCase().trim() && r.status === 'approved'
      );

      // Una invitación oficial canjeada exitosamente o credenciales reconocidas otorgan acceso inmediato con el rol asignado
      if (isInvitationApproved || isCoordinator || isPreRegisteredPublisher || isAlreadyApproved || !user?.email) {
        // Los 3 datos teocráticos son válidos y reconocidos
        if (cloudData) {
          hydrateCongregation(cloudData);
        }
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');
        localStorage.removeItem('kongre_is_guest');
        setSecureLocalPin('kongre_session_pin_v2', codeToRedeem);
        localStorage.removeItem('kongre_needs_cloud_upload');
        localStorage.setItem('kongre_last_local_update', cloudData?.updatedAt || new Date().toISOString());

        const cloudCongName = cloudData?.settings?.congregationName;
        const cleanCongName =
          cloudCongName && !isCongregationIdString(cloudCongName)
            ? cloudCongName
            : settings.congregationName && !isCongregationIdString(settings.congregationName)
            ? settings.congregationName
            : (localStorage.getItem('kongre_congregation_name') || '');

        localStorage.setItem('kongre_congregation_number', cleanId);
        localStorage.setItem('kongre_congregation_id', cleanId);

        const newSettingsUpdate: any = {
          isRegistered: true,
          ...(cleanCongName ? { congregationName: cleanCongName } : {}),
          congregationNumber: cleanId,
          congregationId: cleanId,
        };

        if (!isGenericIdentityName(finalBrotherName)) {
          setIdentifiedBrother(finalBrotherName);
          localStorage.setItem('kongre_identified_brother', finalBrotherName);
          if (identifiedRole === 'coordinador') {
            localStorage.setItem('kongre_coordinator_name', finalBrotherName);
            newSettingsUpdate.coordinatorName = finalBrotherName;
          }
        }

        updateSettings(newSettingsUpdate, { skipCloudWrite: true });

        // Si hay una cuenta conectada, registrar la congregación en localStorage
        if (user && user.uid) {
          try {
            localStorage.setItem('kongre_user_cong_id', cleanId);
          } catch {}
        }

        const cleanPhoto =
          effectiveSettings.coordinatorPhotoURL ||
          cloudRes?.data?.coordinatorPhotoURL ||
          localStorage.getItem('kongre_coordinator_photo') ||
          localStorage.getItem('kongre_google_photo') ||
          '';

        if (cleanPhoto) {
          localStorage.setItem('kongre_coordinator_photo', cleanPhoto);
          if (!localStorage.getItem('kongre_user_photo') || identifiedRole === 'coordinador') {
            localStorage.setItem('kongre_user_photo', cleanPhoto);
          }
        }

        assignRoleToEmail(emailToUse, identifiedRole, finalBrotherName, codeToRedeem);
        if (user?.email && user.email.toLowerCase().trim() !== emailToUse.toLowerCase().trim()) {
          assignRoleToEmail(user.email, identifiedRole, finalBrotherName, codeToRedeem);
        }

        if (identifiedRolesList.length > 0) {
          setActiveRoles(identifiedRolesList);
        } else {
          setActiveRole(identifiedRole);
        }

        // Si se identificó un publicador coincidente, vincularlo
        if (matchingPub && matchingPub.id) {
          try {
            localStorage.setItem('kongre_current_publisher_id_v2', matchingPub.id);
          } catch {}
        }

        setSuccessData({
          role: identifiedRole,
          identifiedBrother: finalBrotherName,
          message: `¡Conexión exitosa a ${cleanCongName || 'la congregación'}! Tu nombramiento como ${THEOCRATIC_ROLES[identifiedRole]?.name || identifiedRole} ha sido verificado y activado.`,
        });
      } else {
        // El publicador NO tiene el correo registrado por el coordinador ni invitación activa:
        // Se genera la solicitud para que los ancianos la aprueben
        await createAccountLinkRequest(emailToUse, finalBrotherName, codeToRedeem, identifiedRole, cleanId);
        setSuccessData({
          role: identifiedRole,
          identifiedBrother: finalBrotherName,
          message: `¡Credenciales válidas! Al no tener tu correo registrado previamente por el Coordinador, se ha enviado una solicitud a los ancianos para su aprobación. No podrás acceder hasta que sea aprobada por ellos.`,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con la congregación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    const role = successData?.role;
    setSuccessData(null);
    setCongregationPinInput('');
    setPersonalPinInput('');
    if (role && onSuccessRole) {
      onSuccessRole(role);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Unirse a la congregación"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl shadow-xl p-6 sm:p-7 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#27272A] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
                Unirse a la Congregación
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Ingresa los 3 datos teocráticos de acceso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana para unirse a la congregación"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          <div className="space-y-4 py-4 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-[#F4F4F5]">
                ¡Conexión Exitosa!
              </h4>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                {successData.message}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Identificación de Rol Asignada
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                  {successData.identifiedBrother}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${THEOCRATIC_ROLES[successData.role]?.badgeColor}`}>
                  {THEOCRATIC_ROLES[successData.role]?.name || successData.role}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-2">
                {THEOCRATIC_ROLES[successData.role]?.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              Comenzar a usar la aplicación
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Friendly Instructions Banner */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20 text-zinc-700 dark:text-[#F4F4F5] space-y-1">
              <span className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Acceso Teocrático con 3 Datos
              </span>
              <p className="text-[11px] leading-relaxed text-indigo-900/90 dark:text-indigo-300/90">
                Coloca los <strong>tres datos</strong>: el ID y PIN de la congregación, y tu PIN Personal que te dio el Coordinador u otro anciano.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* DATO 1: ID DE LA CONGREGACIÓN */}
            <div className="space-y-1">
              <label className="block font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5 text-xs">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>1. ID de la Congregación: *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={13}
                  value={congregationIdInput}
                  onFocus={() => {
                    if (!congregationIdInput) setCongregationIdInput('KGR-');
                  }}
                  onBlur={() => {
                    if (congregationIdInput === 'KGR-' || congregationIdInput === 'KGR') {
                      setCongregationIdInput('');
                    }
                  }}
                  onChange={(e) => setCongregationIdInput(formatCongregationIdInput(e.target.value, congregationIdInput))}
                  placeholder="KGR-XXXX-XXXX (ej: KGR-NQ5A-JQAA)"
                  className="w-full p-2.5 pr-9 font-mono font-bold tabular-nums tracking-widest text-center text-sm rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  required
                  autoFocus
                />
                {congregationIdInput && (
                  <button
                    type="button"
                    onClick={() => setCongregationIdInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] rounded-md transition-colors cursor-pointer"
                    title="Borrar ID"
                    aria-label="Borrar ID de la congregación"
                    tabIndex={-1}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">
                Identificador oficial asignado a tu congregación (formato KGR-XXXX-XXXX).
              </span>
            </div>

            {/* DATO 2: PIN DE LA CONGREGACIÓN */}
            <div className="space-y-1">
              <label className="block font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5 text-xs">
                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>2. PIN de la Congregación: *</span>
              </label>
              <div className="relative">
                <input
                  type={showCongPin ? 'text' : 'password'}
                  maxLength={9}
                  value={congregationPinInput}
                  onChange={(e) => setCongregationPinInput(formatCongregationPinInput(e.target.value, congregationPinInput))}
                  placeholder="XXXX-XXXX (ej: 8X4W-9M2K)"
                  className="w-full p-2.5 pr-10 font-mono font-bold tabular-nums tracking-widest text-center text-sm rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCongPin(!showCongPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
                  tabIndex={-1}
                  title={showCongPin ? 'Ocultar PIN' : 'Ver PIN'}
                  aria-label={showCongPin ? 'Ocultar PIN de la congregación' : 'Ver PIN de la congregación'}
                >
                  {showCongPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] block">
                Clave de acceso general de 8 caracteres con guión (ej: 8X4W-9M2K).
              </span>
            </div>

            {/* DATO 3: PIN PERSONAL SUMINISTRADO POR EL COORDINADOR */}
            <div className="space-y-1 p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20">
              <label className="block font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>3. Tu PIN Personal (Suministrado por el Coordinador o anciano): *</span>
              </label>
              <div className="relative">
                <input
                  type={showPersPin ? 'text' : 'password'}
                  maxLength={16}
                  value={personalPinInput}
                  onChange={(e) => setPersonalPinInput(e.target.value)}
                  placeholder="PIN que te dio el Coordinador"
                  className="w-full p-2.5 pr-10 font-mono font-bold tabular-nums tracking-widest text-center text-sm rounded-lg border border-emerald-500/30 dark:border-emerald-700/50 bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPersPin(!showPersPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPersPin ? 'Ocultar PIN personal' : 'Ver PIN personal'}
                >
                  {showPersPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 block">
                Identifica tu identidad teocrática y activa tus roles y responsabilidades automáticamente.
              </span>
            </div>

            <LegalConsentCheckbox
              checked={acceptedLegalTerms}
              onChange={(val) => {
                setAcceptedLegalTerms(val);
                if (val) setError(null);
              }}
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-bold cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !acceptedLegalTerms}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs"
              >
                <span>{isSubmitting ? 'Verificando datos...' : 'Conectar a la Congregación'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
