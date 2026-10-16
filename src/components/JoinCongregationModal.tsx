// src/components/JoinCongregationModal.tsx
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { verifyPasscode, isCongregationIdString, isGenericIdentityName } from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';
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
} from 'lucide-react';

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
  const { user, assignRoleToEmail, setActiveRole, identifyRoleByPersonalPin, setIdentifiedBrother } = useAuth();
  const {
    settings,
    updateSettings,
    publishers,
    addPublisher,
    accountLinkRequests,
    createAccountLinkRequest,
    loadCongregationFromCloud,
  } = useCongregation();

  // Exactly three required theocratic credentials:
  // 1. ID de la Congregación
  // 2. PIN de la Congregación
  // 3. PIN Personal suministrado por el Coordinador u otro anciano
  const [congregationIdInput, setCongregationIdInput] = useState(settings.congregationNumber || '');
  const [congregationPinInput, setCongregationPinInput] = useState('');
  const [personalPinInput, setPersonalPinInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    role: TheocraticRole;
    message: string;
    identifiedBrother: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
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

      // 1. Cargar datos actualizados de la congregación desde la nube en Firestore primero si existen
      const cloudRes = await loadCongregationFromCloud(cleanId);
      const effectiveSettings = cloudRes?.data?.settings || settings;
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
      const effectivePinHash = cloudRes?.data?.settings?.congregationPinHash || effectiveSettings.congregationPinHash;
      let isCongPinValid = await verifyCongregationPin(cleanCongPin);
      if (!isCongPinValid && effectivePinHash) {
        isCongPinValid = await verifyPasscode(cleanCongPin, effectivePinHash);
      }

      if (!isCongPinValid) {
        setError('El PIN de la Congregación es incorrecto.');
        setIsSubmitting(false);
        return;
      }

      // Verificar PIN Personal (Código de Identificación de Rol otorgado por el Coordinador)
      let identifiedRole: TheocraticRole | undefined;
      let finalBrotherName = '';

      // A) Buscar en la lista de publicadores de la congregación por PIN personal
      const congPubs = (cloudRes?.data?.publishers || publishers) as any[];
      const matchingPub = congPubs.find(
        (p) => p.personalPin && p.personalPin.trim() === cleanPersonalPin
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
        finalBrotherName = matchingPub.name;
        if (matchingPub.email) emailToUse = matchingPub.email;
        if (matchingPub.id) {
          try {
            localStorage.setItem('kongre_current_publisher_id_v2', matchingPub.id);
          } catch {}
        }
      } else {
        // B) Buscar en el directorio de PINs de roles de la congregación
        const pinResult = await identifyRoleByPersonalPin(cleanPersonalPin);
        if (pinResult.success && pinResult.role) {
          identifiedRole = pinResult.role;
          if (pinResult.name && !isGenericIdentityName(pinResult.name)) {
            finalBrotherName = pinResult.name;
          }
          if (pinResult.publisherId) {
            try {
              localStorage.setItem('kongre_current_publisher_id_v2', pinResult.publisherId);
            } catch {}
          }
        } else {
          // C) Verificar si es un código de invitación generado por los ancianos
          const invResult = await redeemInvitationCode(cleanPersonalPin, emailToUse, 'Hermano');
          if (invResult.success && invResult.role) {
            identifiedRole = invResult.role;
            if (invResult.targetName && !isGenericIdentityName(invResult.targetName)) {
              finalBrotherName = invResult.targetName;
            }
          }
        }
      }

      if (!identifiedRole) {
        setError('El PIN Personal no fue reconocido. Asegúrate de ingresar el PIN de rol que te suministró el Coordinador u otro anciano.');
        setIsSubmitting(false);
        return;
      }

      // Resolver nombre no genérico con prioridad
      if (!finalBrotherName || isGenericIdentityName(finalBrotherName)) {
        const cloudCoord = cloudRes?.data?.settings?.coordinatorName;
        const localCoord = settings.coordinatorName;
        const savedCoord = localStorage.getItem('kongre_coordinator_name');
        const savedIdent = localStorage.getItem('kongre_identified_brother');
        const googleName = user?.displayName;

        if (cloudCoord && !isGenericIdentityName(cloudCoord)) {
          finalBrotherName = cloudCoord.trim();
        } else if (localCoord && !isGenericIdentityName(localCoord)) {
          finalBrotherName = localCoord.trim();
        } else if (savedCoord && !isGenericIdentityName(savedCoord)) {
          finalBrotherName = savedCoord.trim();
        } else if (savedIdent && !isGenericIdentityName(savedIdent)) {
          finalBrotherName = savedIdent.trim();
        } else if (googleName && !isGenericIdentityName(googleName)) {
          finalBrotherName = googleName.trim();
        } else {
          finalBrotherName = identifiedRole === 'coordinador' ? 'Coordinador' : 'Hermano';
        }
      }

      // Verificar si el correo ya fue registrado por el coordinador o ya está aprobado
      const isCoordinator =
        settings.coordinatorEmail &&
        settings.coordinatorEmail.toLowerCase().trim() === emailToUse.toLowerCase().trim();
      const isPreRegisteredPublisher = publishers.some(
        (p) => p.email && p.email.toLowerCase().trim() === emailToUse.toLowerCase().trim()
      );
      const isAlreadyApproved = accountLinkRequests.some(
        (r) => r.email.toLowerCase().trim() === emailToUse.toLowerCase().trim() && r.status === 'approved'
      );

      if (isCoordinator || isPreRegisteredPublisher || isAlreadyApproved || !user?.email) {
        // Los 3 datos teocráticos son válidos y reconocidos
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');
        localStorage.removeItem('kongre_needs_cloud_upload');
        localStorage.setItem('kongre_last_local_update', cloudRes?.data?.updatedAt || new Date().toISOString());

        const cleanCongName =
          settings.congregationName && !isCongregationIdString(settings.congregationName)
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

        // Si hay una cuenta de Google conectada, vincular en Firestore en /users/{uid}
        if (user && user.uid) {
          try {
            setDoc(doc(db, 'users', user.uid), {
              congregationId: cleanId,
              congregationNumber: cleanId,
              congregationName: cleanCongName,
              theocraticRole: identifiedRole,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
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

        assignRoleToEmail(emailToUse, identifiedRole, finalBrotherName, cleanPersonalPin);
        setActiveRole(identifiedRole);

        // Asegurar que el hermano figure en la lista oficial de publicadores SOLO si no existía ya
        if (!matchingPub && !isGenericIdentityName(finalBrotherName)) {
          const currentPubs = (cloudRes?.data?.publishers || publishers) as any[];
          const alreadyInList = currentPubs.some(
            (p) =>
              (p.personalPin && cleanPersonalPin && String(p.personalPin).trim() === cleanPersonalPin.trim()) ||
              (p.name && areNamesEquivalent(p.name, finalBrotherName))
          );
          if (!alreadyInList) {
            const isElder = identifiedRole === 'coordinador' || identifiedRole === 'secretario' || identifiedRole === 'superintendente_vym' || identifiedRole === 'anciano';
            const isSM = identifiedRole.startsWith('siervo_');
            addPublisher({
              name: finalBrotherName,
              gender: 'hermano',
              phone: settings.coordinatorPhone || '',
              email: emailToUse && !emailToUse.startsWith('hermano_') ? emailToUse : '',
              personalPin: cleanPersonalPin || undefined,
              notes: identifiedRole === 'coordinador' ? 'Coordinador del Cuerpo de Ancianos' : (THEOCRATIC_ROLES[identifiedRole]?.name || ''),
              active: true,
              groupNumber: 1,
              privilege: isElder ? 'anciano' : isSM ? 'siervo_ministerial' : undefined,
              theocraticRole: identifiedRole,
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

        setSuccessData({
          role: identifiedRole,
          identifiedBrother: finalBrotherName,
          message: `¡Conexión exitosa a ${settings.congregationName || 'la congregación'}! Tu identidad y nombramiento teocrático han sido verificados.`,
        });

        if (onSuccessRole) {
          onSuccessRole(identifiedRole);
        }
      } else {
        // El publicador NO tiene el correo registrado por el coordinador:
        // Se genera la solicitud para que los ancianos la aprueben
        await createAccountLinkRequest(emailToUse, finalBrotherName, cleanPersonalPin, identifiedRole, cleanId);
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
    setSuccessData(null);
    setCongregationPinInput('');
    setPersonalPinInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unirse a la Congregación
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingresa los 3 datos teocráticos de acceso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          <div className="space-y-4 py-4 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                ¡Conexión Exitosa!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {successData.message}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Identificación de Rol Asignada
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {successData.identifiedBrother}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${THEOCRATIC_ROLES[successData.role]?.badgeColor}`}>
                  {THEOCRATIC_ROLES[successData.role]?.name || successData.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {THEOCRATIC_ROLES[successData.role]?.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              Comenzar a usar la aplicación
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Friendly Instructions Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-slate-700 dark:text-slate-300 space-y-1">
              <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Acceso Teocrático con 3 Datos
              </span>
              <p className="text-[11px] leading-relaxed text-indigo-900/90 dark:text-indigo-300/90">
                Coloca los <strong>tres datos</strong>: el ID y PIN de la congregación, y tu PIN Personal que te dio el Coordinador u otro anciano.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* DATO 1: ID DE LA CONGREGACIÓN */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>1. ID de la Congregación: *</span>
              </label>
              <input
                type="text"
                value={congregationIdInput}
                onChange={(e) => setCongregationIdInput(e.target.value)}
                placeholder="Ej: 10582"
                className="w-full p-2.5 font-mono font-bold text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
                autoFocus
              />
              <span className="text-[10px] text-slate-400 block">
                Número oficial asignado a tu congregación.
              </span>
            </div>

            {/* DATO 2: PIN DE LA CONGREGACIÓN */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>2. PIN de la Congregación: *</span>
              </label>
              <input
                type="password"
                maxLength={8}
                value={congregationPinInput}
                onChange={(e) => setCongregationPinInput(e.target.value)}
                placeholder="PIN de la congregación (4 a 8 caracteres)"
                className="w-full p-2.5 font-mono font-bold tracking-widest text-center text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
              <span className="text-[10px] text-slate-400 block">
                Clave de acceso general de la congregación establecida al registrarla.
              </span>
            </div>

            {/* DATO 3: PIN PERSONAL SUMINISTRADO POR EL COORDINADOR */}
            <div className="space-y-1 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
              <label className="block font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>3. Tu PIN Personal (Suministrado por el Coordinador o anciano): *</span>
              </label>
              <input
                type="password"
                maxLength={16}
                value={personalPinInput}
                onChange={(e) => setPersonalPinInput(e.target.value)}
                placeholder="PIN que te dio el Coordinador"
                className="w-full p-2.5 font-mono font-bold tracking-widest text-center text-sm rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
              <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 block">
                Identifica tu identidad teocrática y activa tus roles y responsabilidades automáticamente.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
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
