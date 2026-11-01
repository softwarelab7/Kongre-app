// src/components/PublisherEditor/sections/AccessCredentialsSection.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../../context/AuthContext';
import { useCongregation } from '../../../context/CongregationContext';
import { TheocraticRole, THEOCRATIC_ROLES } from '../../../utils/rbac';
import { evaluatePinStrength } from '../../../utils/theocraticSecurity';

// Mínimo para PINs personales NUEVOS (4 dígitos = solo 10.000 combinaciones). Los PINs existentes de 4 dígitos siguen funcionando.
const MIN_PERSONAL_PIN_LENGTH = 6;
import {
  KeyRound,
  Shield,
  RefreshCw,
  Copy,
  Check,
  Share2,
  QrCode,
  Eye,
  EyeOff,
  Printer,
  CheckCircle2,
  UserCheck,
  Trash2,
  X,
  Lock,
  Save,
  Smartphone,
  Calendar,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useSecurity } from '../../../context/SecurityContext';
import { CredentialRevocationModal, CredentialRevocationTarget } from '../../CredentialRevocationModal';
import { CredentialRevocationReasonId } from '../../../types';

interface AccessCredentialsSectionProps {
  formData: any;
  handleChange: (field: any, value: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSavePublisher?: () => void;
  isSaving?: boolean;
}

export const AccessCredentialsSection: React.FC<AccessCredentialsSectionProps> = ({
  formData,
  handleChange,
  showToast,
  onSavePublisher,
}) => {
  const {
    assignPersonalPinToPublisher,
    generateUniquePublisherPin,
    removePublisherPin,
    currentBrotherName,
    effectiveRoleInfo,
  } = useAuth();

  const { settings, updatePublisher, publishers } = useCongregation();
  const { credentialRedemptions, revocationHistory, revokeAndReplacePublisherCredential } = useSecurity();

  const [showPin, setShowPin] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [revocationTarget, setRevocationTarget] = useState<CredentialRevocationTarget | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const publisherId = formData.id || formData.nid || 'nuevo_publicador';
  const publisherName =
    formData.full_name?.trim() ||
    formData.name?.trim() ||
    [formData.first_name, formData.last_name].filter(Boolean).join(' ').trim() ||
    'Publicador';

  const currentPin = formData.personalPin || (formData as any).pin || '';
  const currentRole: TheocraticRole = formData.theocraticRole || 'publico';

  const handleSavePin = async () => {
    if (!currentPin || currentPin.trim().length < MIN_PERSONAL_PIN_LENGTH) {
      if (showToast) {
        showToast('El PIN debe tener al menos 6 dígitos para poder guardarlo', 'error');
      }
      return;
    }

    setIsSavingLocal(true);
    try {
      const cleanPin = currentPin.trim();

      assignPersonalPinToPublisher(
        publisherId,
        cleanPin,
        currentRole,
        publisherName,
        formData.email,
        formData.privilege || formData.role
      );

      handleChange('personalPin', cleanPin);
      handleChange('theocraticRole', currentRole);

      const existingPub = publishers.find(
        (p) => p.id === publisherId || (p as any).nid === publisherId
      );
      if (existingPub) {
        updatePublisher({
          ...existingPub,
          personalPin: cleanPin,
          theocraticRole: currentRole,
        });
      }

      if (onSavePublisher) {
        onSavePublisher();
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (showToast) {
        showToast(`PIN personal (${cleanPin}) guardado con éxito para ${publisherName}`, 'success');
      }
    } catch (err) {
      console.error('Error guardando PIN:', err);
      if (showToast) {
        showToast('Error al guardar el PIN. Inténtalo de nuevo.', 'error');
      }
    } finally {
      setIsSavingLocal(false);
    }
  };

  const pinEvaluation = useMemo(() => {
    return evaluatePinStrength(currentPin);
  }, [currentPin]);

  const activeRedemption = useMemo(() => {
    return credentialRedemptions.find(
      (red) =>
        red.status === 'active' &&
        (red.publisherId === publisherId ||
          red.publisherName.toLowerCase().trim() === publisherName.toLowerCase().trim())
    );
  }, [credentialRedemptions, publisherId, publisherName]);

  const personRevocations = useMemo(() => {
    return revocationHistory.filter(
      (rev) =>
        rev.publisherId === publisherId ||
        rev.publisherName.toLowerCase().trim() === publisherName.toLowerCase().trim()
    );
  }, [revocationHistory, publisherId, publisherName]);

  const handleGenerateNewPin = () => {
    // If publisher already has a PIN, require mandatory reason form to revoke the previous one
    if (currentPin && currentPin.trim().length >= 4) {
      setRevocationTarget({
        publisherId,
        publisherName,
        role: currentRole,
        currentPinOrCode: currentPin,
        redeemedDeviceInfo: activeRedemption?.deviceInfo,
        redeemedDeviceType: activeRedemption?.deviceType,
        redeemedAt: activeRedemption?.redeemedAt,
      });
      return;
    }

    const newUniquePin = generateUniquePublisherPin();
    handleChange('personalPin', newUniquePin);

    assignPersonalPinToPublisher(
      publisherId,
      newUniquePin,
      currentRole,
      publisherName,
      formData.email,
      formData.privilege || formData.role
    );

    if (showToast) {
      showToast(`PIN único ${newUniquePin} generado con éxito`, 'success');
    }
  };

  const handlePinInputChange = (val: string) => {
    const numericVal = val.replace(/\D/g, '').slice(0, 8);
    handleChange('personalPin', numericVal);

    if (numericVal.length >= MIN_PERSONAL_PIN_LENGTH) {
      assignPersonalPinToPublisher(
        publisherId,
        numericVal,
        currentRole,
        publisherName,
        formData.email,
        formData.privilege || formData.role
      );
    }
  };

  const handleRoleChange = (role: TheocraticRole) => {
    handleChange('theocraticRole', role);

    if (currentPin) {
      assignPersonalPinToPublisher(
        publisherId,
        currentPin,
        role,
        publisherName,
        formData.email,
        formData.privilege || formData.role
      );
    }

    if (showToast) {
      showToast(`Rol del sistema actualizado a: ${THEOCRATIC_ROLES[role]?.name}`, 'info');
    }
  };

  const handleRevokePin = () => {
    handleChange('personalPin', '');
    removePublisherPin(publisherId);
    if (showToast) {
      showToast('PIN personal revocado correctamente', 'info');
    }
  };

  const credentialsText = useMemo(() => {
    const congTitle = settings.congregationName?.trim() || 'Mi Congregación';
    const congId = settings.congregationNumber || settings.congregationId || 'Configurado';
    const roleTitle = THEOCRATIC_ROLES[currentRole]?.name || 'Publicador';

    return `CREDENCIALES DEL PORTAL CONGREGACIONAL
━━━━━━━━━━━━━━━━━━━━
Hermano(a): ${publisherName}
Congregación: ${congTitle} (ID: ${congId})
Rol asignado: ${roleTitle}
PIN Personal Único: ${currentPin || 'Sin asignar'}
━━━━━━━━━━━━━━━━━━━━
Usa este PIN personal para consultar tus asignaciones en vivo, confirmar asistencia y enviar tu informe mensual de predicación.`;
  }, [
    publisherName,
    settings.congregationName,
    settings.congregationNumber,
    settings.congregationId,
    currentRole,
    currentPin,
  ]);

  const handleCopyCredentials = () => {
    if (!currentPin) {
      if (showToast) showToast('Asigna o genera un PIN antes de copiar credenciales', 'error');
      return;
    }
    navigator.clipboard.writeText(credentialsText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    if (showToast) showToast('Credenciales copiadas al portapapeles', 'success');
  };

  const handleShareWhatsApp = () => {
    if (!currentPin) {
      if (showToast) showToast('Genera un PIN antes de compartir por WhatsApp', 'error');
      return;
    }

    const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(credentialsText);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (showSlipModal && qrCanvasRef.current && currentPin) {
      const congId = settings.congregationNumber || settings.congregationId || 'cong_default';
      const payload = JSON.stringify({
        app: 'kongre',
        type: 'publisher_access',
        congId: congId,
        pubId: publisherId,
        name: publisherName,
        pin: currentPin,
        role: currentRole,
      });

      QRCode.toCanvas(
        qrCanvasRef.current,
        payload,
        {
          width: 180,
          margin: 1,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generando QR:', error);
        }
      );
    }
  }, [showSlipModal, currentPin, settings, publisherId, publisherName, currentRole]);

  return (
    <section className="bg-white dark:bg-[#121216] p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-6 animate-in fade-in duration-300">
      {/* 1. Cabecera Unificada de Credenciales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-500/20">
            <KeyRound size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Credenciales de Acceso y PIN Personal
              </h3>
              <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                · {currentPin ? `PIN activo (${currentPin.length} dígitos)` : 'Sin PIN configurado'} ·{' '}
                {THEOCRATIC_ROLES[currentRole]?.shortName || 'Publicador'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Identificación individual segura para el portal móvil del publicador y control de permisos por rol
            </p>
          </div>
        </div>

        {/* Acciones de Compartir y Guardar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyCredentials}
            disabled={!currentPin}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/[0.06] text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
            title="Copiar credenciales"
          >
            {copiedText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedText ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={!currentPin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
            title="Enviar credenciales por WhatsApp"
          >
            <Share2 size={14} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSlipModal(true)}
            disabled={!currentPin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-2xs disabled:opacity-40 cursor-pointer"
            title="Generar papeleta con código QR"
          >
            <QrCode size={14} />
            <span>Papeleta QR</span>
          </button>

          <button
            type="button"
            onClick={handleSavePin}
            disabled={!currentPin || currentPin.length < MIN_PERSONAL_PIN_LENGTH || isSavingLocal}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 ${
              saveSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isSavingLocal ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            <span>{saveSuccess ? 'PIN Guardado' : 'Guardar PIN'}</span>
          </button>
        </div>
      </div>

      {/* 2. Espacio de Trabajo en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configuración del PIN (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-50/70 dark:bg-white/[0.02] p-5 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  PIN Personal (4 a 8 dígitos)
                </h4>
              </div>
              {currentPin && (
                <span className="text-xs font-mono tabular-nums font-bold text-purple-600 dark:text-purple-400">
                  {currentPin.length} dígitos
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={currentPin}
                onChange={(e) => handlePinInputChange(e.target.value)}
                placeholder="••••"
                className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono tabular-nums text-center tracking-[0.35em] text-xl font-bold focus:border-purple-500 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
                title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              >
                {showPin ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {currentPin ? (
              <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pinEvaluation.isWeak
                        ? 'bg-rose-500'
                        : pinEvaluation.score >= 3
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className={`font-semibold ${pinEvaluation.color}`}>
                    {pinEvaluation.label}
                  </span>
                </div>
                {pinEvaluation.message && (
                  <span className="text-[11px] text-zinc-400 text-right">
                    {pinEvaluation.message}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Genera o escribe un código numérico único para que {publisherName} pueda ingresar a su portal personal.
              </p>
            )}
            {activeRedemption && (
              <div className="p-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.06] space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
                  <Lock size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Historial de dispositivos y ubicación protegidos por privacidad</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Por privacidad, solo el publicador puede consultar sus propios dispositivos conectados y ubicaciones desde su perfil personal.
                </p>
              </div>
            )}

            {personRevocations.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 space-y-1 text-[11px]">
                <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <ShieldAlert size={12} />
                  <span>Códigos anteriores revocados ({personRevocations.length}):</span>
                </div>
                {personRevocations.slice(0, 2).map((rev) => (
                  <div key={rev.id} className="text-slate-600 dark:text-slate-400">
                    <span className="line-through font-mono text-rose-600">{rev.previousCodeMasked}</span> →{' '}
                    <strong className="font-mono">{rev.newCodeMasked}</strong> · {rev.reasonLabel}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateNewPin}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>{currentPin ? 'Cambiar / Revocar PIN' : 'Generar PIN Único'}</span>
            </button>

            {currentPin && (
              <button
                type="button"
                onClick={handleRevokePin}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-white/[0.08] text-xs font-bold transition-all cursor-pointer"
                title="Revocar PIN"
              >
                <Trash2 size={13} />
                <span>Revocar</span>
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Rol Operativo en el Sistema (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-50/70 dark:bg-white/[0.02] p-5 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Nivel de Acceso y Permisos en la Aplicación
              </h4>
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              {THEOCRATIC_ROLES[currentRole]?.shortName || 'Publicador'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(THEOCRATIC_ROLES) as TheocraticRole[]).map((rKey) => {
              const rInfo = THEOCRATIC_ROLES[rKey];
              const isSelected = currentRole === rKey;

              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => handleRoleChange(rKey)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 dark:border-purple-500/70 shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-white/[0.06] hover:border-zinc-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && <Check size={10} />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`font-bold text-xs ${
                        isSelected
                          ? 'text-purple-950 dark:text-purple-200'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {rInfo.shortName}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {rInfo.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate">
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {THEOCRATIC_ROLES[currentRole]?.shortName}:
                </strong>{' '}
                {THEOCRATIC_ROLES[currentRole]?.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL: PAPELETA DE ACCESO TEOCRÁTICO (SLIP / QR) */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                    Papeleta de Credencial Personal
                  </h4>
                  <p className="text-[11px] text-zinc-500">Acceso rápido por QR o PIN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div
              id="printable-theocratic-slip"
              className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] space-y-4 text-center"
            >
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.06] pb-2.5">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">
                    PORTAL CONGREGACIONAL
                  </span>
                  <h5 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {settings.congregationName || 'Congregación Local'}
                  </h5>
                </div>
                <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 font-bold">
                  ID: {settings.congregationNumber || settings.congregationId || 'Salón'}
                </span>
              </div>

              <div className="space-y-0.5 py-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Publicador
                </span>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{publisherName}</p>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  {THEOCRATIC_ROLES[currentRole]?.name || 'Publicador'}
                </p>
              </div>

              <div className="flex justify-center py-1">
                <div className="p-2.5 bg-white rounded-2xl shadow-2xs border border-zinc-200">
                  <canvas ref={qrCanvasRef} className="rounded-lg" />
                </div>
              </div>

              <div className="bg-zinc-900 dark:bg-purple-950/60 text-white rounded-2xl p-3 border border-purple-500/20">
                <span className="text-[10px] uppercase font-bold tracking-widest block text-zinc-400">
                  PIN Personal Único
                </span>
                <span className="text-2xl font-mono tabular-nums font-bold tracking-[0.25em]">
                  {currentPin || '••••'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CredentialRevocationModal
        isOpen={Boolean(revocationTarget)}
        onClose={() => setRevocationTarget(null)}
        target={revocationTarget}
        onGenerateRandomPin={generateUniquePublisherPin}
        onConfirmRevokeAndReplace={(params: {
          publisherId: string;
          publisherName: string;
          role: string;
          oldPinOrCode?: string;
          newPinOrCode: string;
          reasonId: CredentialRevocationReasonId;
          reasonDetails: string;
        }) => {
          revokeAndReplacePublisherCredential({
            publisherId: params.publisherId,
            publisherName: params.publisherName,
            role: params.role,
            oldPinOrCode: params.oldPinOrCode,
            newPinOrCode: params.newPinOrCode,
            reasonId: params.reasonId,
            reasonDetails: params.reasonDetails,
            revokedBy: currentBrotherName || effectiveRoleInfo.shortName || 'Anciano',
          });

          handleChange('personalPin', params.newPinOrCode);
          assignPersonalPinToPublisher(
            params.publisherId,
            params.newPinOrCode,
            currentRole,
            params.publisherName,
            formData.email,
            formData.privilege || formData.role
          );

          const existingPub = publishers.find(
            (p) => p.id === params.publisherId || (p as any).nid === params.publisherId
          );
          if (existingPub) {
            updatePublisher({
              ...existingPub,
              personalPin: params.newPinOrCode,
              theocraticRole: currentRole,
            });
          }

          if (showToast) {
            showToast(
              `PIN anterior revocado y nuevo PIN (${params.newPinOrCode}) asignado a ${params.publisherName}`,
              'success'
            );
          }
        }}
      />
    </section>
  );
};
