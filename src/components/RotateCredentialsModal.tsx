/**
 * src/components/RotateCredentialsModal.tsx
 * Modal interactivo para la rotación segura de credenciales de la congregación:
 * - Rotación del PIN de Congregación (el que conocen los publicadores)
 * - Rotación del PIN Maestro del Coordinador (cifrado administrativo completo)
 * 
 * Re-cifra los payloads en el cliente, actualiza los verificadores HMAC en la Edge Function
 * kongre-sync y revoca inmediatamente el acceso a las credenciales anteriores.
 */

import React, { useState } from 'react';
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Users,
  ShieldAlert,
} from 'lucide-react';
import {
  formatCongregationPinInput,
  generateSecureCongregationPin,
  generateSecureMasterPin,
} from '../utils/theocraticSecurity';

interface RotateCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRotate: (params: {
    currentMasterPin: string;
    newCongregationPin?: string;
    newMasterPin?: string;
  }) => Promise<{ success: boolean; message: string }>;
  congregationId?: string;
  congregationName?: string;
}

export const RotateCredentialsModal: React.FC<RotateCredentialsModalProps> = ({
  isOpen,
  onClose,
  onRotate,
  congregationId,
  congregationName,
}) => {
  // Estado del formulario
  const [currentMasterPin, setCurrentMasterPin] = useState('');
  const [showCurrentMaster, setShowCurrentMaster] = useState(false);

  // Opciones de rotación
  const [rotateCongPin, setRotateCongPin] = useState(true);
  const [newCongPin, setNewCongPin] = useState('');
  const [confirmCongPin, setConfirmCongPin] = useState('');
  const [showNewCongPin, setShowNewCongPin] = useState(false);

  const [rotateMasterPin, setRotateMasterPin] = useState(false);
  const [newMasterPin, setNewMasterPin] = useState('');
  const [confirmMasterPin, setConfirmMasterPin] = useState('');
  const [showNewMasterPin, setShowNewMasterPin] = useState(false);

  // Estados de proceso y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    congPin?: string;
    masterPin?: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handlers para generación asistida
  const handleGenerateCongPin = () => {
    const pin = generateSecureCongregationPin();
    setNewCongPin(pin);
    setConfirmCongPin(pin);
    setErrorMsg(null);
  };

  const handleGenerateMasterPin = () => {
    const pin = generateSecureMasterPin();
    setNewMasterPin(pin);
    setConfirmMasterPin(pin);
    setErrorMsg(null);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // Fallback
    }
  };

  const resetForm = () => {
    setCurrentMasterPin('');
    setNewCongPin('');
    setConfirmCongPin('');
    setNewMasterPin('');
    setConfirmMasterPin('');
    setErrorMsg(null);
    setSuccessInfo(null);
    setRotateCongPin(true);
    setRotateMasterPin(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCurrentMaster = currentMasterPin.trim();
    if (!cleanCurrentMaster) {
      setErrorMsg('Debes ingresar tu PIN Maestro actual para autorizar la rotación en el servidor.');
      return;
    }

    if (!rotateCongPin && !rotateMasterPin) {
      setErrorMsg('Selecciona al menos una credencial para rotar (PIN de Congregación o PIN Maestro).');
      return;
    }

    const cleanNewCong = newCongPin.trim().toUpperCase().replace(/\s/g, '');
    const cleanConfirmCong = confirmCongPin.trim().toUpperCase().replace(/\s/g, '');

    if (rotateCongPin) {
      if (!cleanNewCong) {
        setErrorMsg('Ingresa o genera el nuevo PIN de la congregación.');
        return;
      }
      if (cleanNewCong.length < 4) {
        setErrorMsg('El PIN de congregación debe tener al menos 4 caracteres.');
        return;
      }
      if (cleanNewCong !== cleanConfirmCong) {
        setErrorMsg('La confirmación del PIN de congregación no coincide.');
        return;
      }
    }

    const cleanNewMaster = newMasterPin.trim();
    const cleanConfirmMaster = confirmMasterPin.trim();

    if (rotateMasterPin) {
      if (!cleanNewMaster) {
        setErrorMsg('Ingresa o genera el nuevo PIN Maestro del coordinador.');
        return;
      }
      if (cleanNewMaster.length < 8) {
        setErrorMsg('El PIN Maestro debe tener un mínimo de 8 caracteres (se recomiendan 12 dígitos).');
        return;
      }
      if (cleanNewMaster !== cleanConfirmMaster) {
        setErrorMsg('La confirmación del PIN Maestro no coincide.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await onRotate({
        currentMasterPin: cleanCurrentMaster,
        newCongregationPin: rotateCongPin ? cleanNewCong : undefined,
        newMasterPin: rotateMasterPin ? cleanNewMaster : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      setSuccessInfo({
        message: res.message,
        congPin: rotateCongPin ? cleanNewCong : undefined,
        masterPin: rotateMasterPin ? cleanNewMaster : undefined,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inesperado al conectar con el servidor de sincronización.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className={`w-6 h-6 ${isSubmitting ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Rotación Segura de Credenciales
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Cero Conocimiento
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {congregationName ? `${congregationName} · ` : ''}
                ID: {congregationId || 'Congregación Activa'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successInfo ? (
            /* Pantalla de Éxito */
            <div className="space-y-6 animate-fade-in py-2">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¡Rotación Aplicada Exitosamente!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {successInfo.message}
                </p>
              </div>

              {/* Tarjetas de Nuevas Credenciales */}
              <div className="space-y-3">
                {successInfo.congPin && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Nuevo PIN de Congregación (Publicadores):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(successInfo.congPin!, 'cong')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {copiedKey === 'cong' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar PIN</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 font-mono text-base font-black text-center text-indigo-700 dark:text-indigo-300 tracking-wider">
                      {successInfo.congPin}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Comparte este nuevo PIN con los publicadores para que puedan sincronizar la cartelera y programas en sus dispositivos.
                    </p>
                  </div>
                )}

                {successInfo.masterPin && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Nuevo PIN Maestro (Coordinador):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(successInfo.masterPin!, 'master')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {copiedKey === 'master' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/60 font-mono text-base font-black text-center text-amber-700 dark:text-amber-300 tracking-widest">
                      {successInfo.masterPin}
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                      Guarda este PIN en un gestor de contraseñas seguro. Es indispensable para la administración total de los ancianos.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Entendido y Finalizar
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Rotación */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Notificación informativa */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Revocación instantánea en la nube</p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    Al confirmar, el servidor invalidará de inmediato las credenciales anteriores. Los dispositivos que tenían el PIN anterior ya no podrán sincronizar hasta ingresar el nuevo.
                  </p>
                </div>
              </div>

              {/* Campo: PIN Maestro Actual */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                    PIN Maestro Actual del Coordinador:
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Requerido para autorizar</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentMaster ? 'text' : 'password'}
                    value={currentMasterPin}
                    onChange={(e) => setCurrentMasterPin(e.target.value)}
                    placeholder="Ingresa el PIN Maestro actual..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentMaster(!showCurrentMaster)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showCurrentMaster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Selector de qué rotar */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Selecciona qué credencial deseas rotar:
                </p>

                {/* Opción 1: PIN de Congregación */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    rotateCongPin
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Rotar PIN de la Congregación
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Acceso de publicadores, cartelera y programas
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={rotateCongPin}
                        onChange={(e) => setRotateCongPin(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>

                  {rotateCongPin && (
                    <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/50 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200">
                          Nuevo PIN de Congregación (Formato XXXX-XXXX):
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateCongPin}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generar PIN Seguro</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewCongPin ? 'text' : 'password'}
                          value={newCongPin}
                          onChange={(e) =>
                            setNewCongPin(formatCongregationPinInput(e.target.value, newCongPin))
                          }
                          placeholder="Ej: 8X4W-9M2K"
                          maxLength={9}
                          className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-sm font-mono font-bold text-indigo-950 dark:text-indigo-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewCongPin(!showNewCongPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        >
                          {showNewCongPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 block mb-1">
                          Confirmar Nuevo PIN:
                        </label>
                        <input
                          type="password"
                          value={confirmCongPin}
                          onChange={(e) =>
                            setConfirmCongPin(formatCongregationPinInput(e.target.value, confirmCongPin))
                          }
                          placeholder="Repite el nuevo PIN..."
                          maxLength={9}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-sm font-mono font-bold text-indigo-950 dark:text-indigo-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Opción 2: PIN Maestro del Coordinador */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    rotateMasterPin
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Rotar PIN Maestro (Coordinador)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Cifrado completo de datos de ancianos y administración
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={rotateMasterPin}
                        onChange={(e) => setRotateMasterPin(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                    </label>
                  </div>

                  {rotateMasterPin && (
                    <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/50 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                          Nuevo PIN Maestro (Mínimo 8 dígitos, recomendado 12):
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateMasterPin}
                          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generar 12 Dígitos</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewMasterPin ? 'text' : 'password'}
                          value={newMasterPin}
                          onChange={(e) => setNewMasterPin(e.target.value)}
                          placeholder="Nuevo PIN Maestro de 12 dígitos..."
                          className="w-full px-3.5 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-sm font-mono font-bold text-amber-950 dark:text-amber-200 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewMasterPin(!showNewMasterPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                        >
                          {showNewMasterPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200 block mb-1">
                          Confirmar Nuevo PIN Maestro:
                        </label>
                        <input
                          type="password"
                          value={confirmMasterPin}
                          onChange={(e) => setConfirmMasterPin(e.target.value)}
                          placeholder="Repite el nuevo PIN Maestro..."
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-sm font-mono font-bold text-amber-950 dark:text-amber-200 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 tracking-wider"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mensaje de error si existe */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !currentMasterPin}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Re-cifrando y Rotando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Aplicar Rotación en la Nube</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
