// src/components/JoinCongregationModal.tsx
import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
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
  const { user, assignRoleToEmail, setActiveRole } = useAuth();
  const { settings, updateSettings } = useCongregation();

  // Fields: ID and Congregation / Invitation PIN
  const [congregationIdInput, setCongregationIdInput] = useState(settings.congregationNumber || '');
  const [congregationPinInput, setCongregationPinInput] = useState('');

  // Common fields: Brother name
  const [brotherName, setBrotherName] = useState(user?.displayName || '');
  const [brotherEmail, setBrotherEmail] = useState(user?.email || '');

  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ role: TheocraticRole; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const emailToUse = brotherEmail.trim() || (user?.email ?? 'hermano@kongre.org');
      const nameToUse = brotherName.trim() || (user?.displayName ?? 'Hermano de la Congregación');

      const cleanId = congregationIdInput.trim();
      const cleanPin = congregationPinInput.trim();

      if (!cleanId) {
        setError('Por favor introduce el ID de la Congregación.');
        setIsSubmitting(false);
        return;
      }
      if (!cleanPin) {
        setError('Por favor introduce el PIN o Código de Invitación.');
        setIsSubmitting(false);
        return;
      }

      // 1. Intentar validar primero si es un código / PIN de invitación
      const invResult = await redeemInvitationCode(cleanPin, emailToUse, nameToUse);
      if (invResult.success && invResult.role) {
        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');

        updateSettings({
          isRegistered: true,
          congregationName: settings.congregationName || `Congregación #${cleanId}`,
          congregationNumber: cleanId,
        });

        assignRoleToEmail(emailToUse, invResult.role, nameToUse);
        setActiveRole(invResult.role);

        setSuccessData({
          role: invResult.role,
          message: invResult.message || `¡Conexión exitosa a la congregación!`,
        });

        if (onSuccessRole) {
          onSuccessRole(invResult.role);
        }
        return;
      }

      // 2. Si no es un código de invitación, validar como PIN oficial de la congregación
      const isPinValid = await verifyCongregationPin(cleanPin);
      if (isPinValid) {
        const expectedId = settings.congregationNumber || settings.congregationId;
        if (expectedId && cleanId !== expectedId.trim()) {
          setError('El ID de Congregación no coincide con la congregación de este sistema.');
          setIsSubmitting(false);
          return;
        }

        localStorage.setItem('kongre_is_registered_congregation', 'true');
        localStorage.setItem('kongre_has_entered_app', 'true');

        updateSettings({
          isRegistered: true,
          congregationName: settings.congregationName || `Congregación #${cleanId}`,
          congregationNumber: cleanId,
        });

        assignRoleToEmail(emailToUse, 'coordinador', nameToUse);
        setActiveRole('coordinador');

        setSuccessData({
          role: 'coordinador',
          message: `¡Conexión exitosa a ${settings.congregationName || 'la congregación'}! Tu dispositivo ha sido verificado con el ID y PIN teocráticos.`,
        });

        if (onSuccessRole) {
          onSuccessRole('coordinador');
        }
        return;
      }

      // 3. Si ninguno de los dos fue válido
      setError('El PIN o Código de Invitación es incorrecto o ha expirado.');
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con la congregación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setSuccessData(null);
    setCongregationPinInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Conectar a la Congregación
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seguridad Teocrática
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {successData ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ¡Conexión Exitosa!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {successData.message}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-xs mx-auto">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600 text-white inline-block">
                {THEOCRATIC_ROLES[successData.role]?.name || successData.role}
              </span>
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
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                ID de la Congregación: *
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
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                PIN de la Congregación o PIN de Invitación: *
              </label>
              <input
                type="password"
                value={congregationPinInput}
                onChange={(e) => setCongregationPinInput(e.target.value)}
                placeholder="PIN o Código de Invitación"
                className="w-full p-2.5 font-mono font-bold tracking-widest text-center text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Introduce el PIN de la congregación o el PIN de invitación proporcionado por los ancianos.
              </span>
            </div>

            {/* Brother's Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tu Nombre de Publicador: *
              </label>
              <input
                type="text"
                value={brotherName}
                onChange={(e) => setBrotherName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
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
                <span>{isSubmitting ? 'Verificando...' : 'Conectar a la Congregación'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
