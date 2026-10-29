// src/components/Settings/sections/SecuritySection.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { useSecurity } from '../../../context/SecurityContext';
import { useCongregation } from '../../../context/CongregationContext';
import { AutoLockSettingsCard } from '../../AutoLockSettingsCard';

export interface SecuritySectionProps {
  onNavigateToRoles?: () => void;
  onOpenRotateModal: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  onNavigateToRoles,
  onOpenRotateModal,
}) => {
  const { isDemoMode } = useCongregation();
  const {
    isPinEnabled,
    lockSession,
    privacyModeEnabled,
    setPrivacyModeEnabled,
    setPasscodePin,
    verifyCurrentPin,
  } = useSecurity();

  // Pin Modal state
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pinCurrent, setPinCurrent] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const openPinModal = () => {
    setPinCurrent('');
    setPinNew('');
    setPinConfirm('');
    setPinModalError(null);
    setShowPinSetupModal(true);
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

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
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

      {/* Banner de acceso directo a Roles Teocráticos */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Roles Teocráticos y PINs de Acceso
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Vista Dedicada
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Asigna responsabilidades teocráticas, gestiona PINs individuales por hermano y administra solicitudes de cuentas vinculadas a pantalla completa.
            </p>
          </div>
        </div>
        {onNavigateToRoles && (
          <button
            type="button"
            onClick={onNavigateToRoles}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow whitespace-nowrap self-stretch sm:self-auto cursor-pointer"
          >
            <span>Abrir Gestor de Roles</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* PIN Security Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: PIN de Bloqueo */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                PIN de Bloqueo de Sesión
              </span>
              {isDemoMode ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  Desactivado en Modo Prueba
                </span>
              ) : isPinEnabled ? (
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
              {isDemoMode
                ? 'En modo prueba el bloqueo de sesión por PIN está desactivado para permitir una navegación fluida sin interrupciones.'
                : 'Bloquea la aplicación con un código numérico para proteger la confidencialidad en computadoras compartidas del Salón del Reino o cabina de audio.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            {!isDemoMode && isPinEnabled && (
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
              disabled={isDemoMode}
              onClick={openPinModal}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {isPinEnabled ? 'Cambiar o Quitar PIN' : 'Configurar PIN de Seguridad'}
            </button>
          </div>
        </div>

        {/* Card: Auto-Bloqueo por Inactividad */}
        <AutoLockSettingsCard onOpenPinModal={openPinModal} />
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

      {/* Rotación Cero Conocimiento de Credenciales */}
      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block mb-0.5">
              Rotación Cero Conocimiento de Credenciales en la Nube
            </span>
            <p className="text-xs text-amber-900/70 dark:text-amber-300/70">
              Cambia el PIN que conocen los publicadores o el PIN maestro del coordinador. Las credenciales anteriores quedan invalidadas de inmediato en Supabase.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isDemoMode}
          onClick={onOpenRotateModal}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow whitespace-nowrap self-stretch sm:self-auto cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Rotar Credenciales</span>
        </button>
      </div>

      {/* SETUP PIN MODAL */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
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
    </div>
  );
};
