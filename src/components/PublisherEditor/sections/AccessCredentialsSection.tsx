// src/components/PublisherEditor/sections/AccessCredentialsSection.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../../context/AuthContext';
import { useCongregation } from '../../../context/CongregationContext';
import { TheocraticRole, THEOCRATIC_ROLES } from '../../../utils/rbac';
import { evaluatePinStrength } from '../../../utils/theocraticSecurity';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Share2,
  QrCode,
  Eye,
  EyeOff,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  ExternalLink,
  Trash2,
  X,
  Smartphone,
  Lock,
} from 'lucide-react';

interface AccessCredentialsSectionProps {
  formData: any;
  handleChange: (field: any, value: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccessCredentialsSection: React.FC<AccessCredentialsSectionProps> = ({
  formData,
  handleChange,
  showToast,
}) => {
  const {
    assignPersonalPinToPublisher,
    generateUniquePublisherPin,
    removePublisherPin,
    publisherPinsList,
  } = useAuth();

  const { settings } = useCongregation();

  const [showPin, setShowPin] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const publisherId = formData.id || formData.nid || 'nuevo_publicador';
  const publisherName =
    formData.full_name?.trim() ||
    formData.name?.trim() ||
    [formData.first_name, formData.last_name].filter(Boolean).join(' ').trim() ||
    'Publicador';

  const currentPin = formData.personalPin || (formData as any).pin || '';
  const currentRole: TheocraticRole = formData.theocraticRole || 'publico';

  const pinEvaluation = useMemo(() => {
    return evaluatePinStrength(currentPin);
  }, [currentPin]);

  // Generate unique PIN handler
  const handleGenerateNewPin = () => {
    const newUniquePin = generateUniquePublisherPin();
    handleChange('personalPin', newUniquePin);

    // Sync to auth context
    assignPersonalPinToPublisher(
      publisherId,
      newUniquePin,
      currentRole,
      publisherName,
      formData.email,
      formData.privilege || formData.role
    );

    if (showToast) {
      showToast(`¡PIN único ${newUniquePin} generado con éxito!`, 'success');
    }
  };

  // Change PIN manually handler
  const handlePinInputChange = (val: string) => {
    const numericVal = val.replace(/\D/g, '').slice(0, 8);
    handleChange('personalPin', numericVal);

    if (numericVal.length >= 4) {
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

  // Change system role handler
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

  // Revoke PIN handler
  const handleRevokePin = () => {
    if (window.confirm(`¿Estás seguro de que deseas revocar el PIN personal de ${publisherName}?`)) {
      handleChange('personalPin', '');
      removePublisherPin(publisherId);
      if (showToast) {
        showToast('PIN personal revocado correctamente', 'info');
      }
    }
  };

  // Credentials text for copy and WhatsApp
  const credentialsText = useMemo(() => {
    const congTitle = settings.congregationName?.trim() || 'Mi Congregación';
    const congId = settings.congregationNumber || settings.congregationId || 'Configurado';
    const roleTitle = THEOCRATIC_ROLES[currentRole]?.name || 'Publicador';

    return `🔐 CREDENCIALES TEOCRÁTICAS KONGRE (ESTILO NW SCHEDULER)
━━━━━━━━━━━━━━━━━━━━
👤 Hermano(a): ${publisherName}
🏛️ Congregación: ${congTitle}
📋 ID de Congregación: ${congId}
👔 Rol Asignado: ${roleTitle}
🔑 Tu PIN Personal Único: ${currentPin || 'Sin asignar'}
━━━━━━━━━━━━━━━━━━━━
📲 Usa este PIN personal para identificarte en la aplicación de la congregación, consultar tus asignaciones en vivo, confirmar asistencia y registrar tu informe mensual de predicación.`;
  }, [publisherName, settings.congregationName, settings.congregationNumber, settings.congregationId, currentRole, currentPin]);

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

    window.open(url, '_blank');
  };

  // Generate QR code when slip modal opens
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
          if (error) console.error('Error generando QR teocrático:', error);
        }
      );
    }
  }, [showSlipModal, currentPin, settings, publisherId, publisherName, currentRole]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header con Resumen de Acceso estilo NW Scheduler */}
      <div className="bg-white dark:bg-[#0f1623] p-6 rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-2xl text-purple-600 dark:text-purple-400 font-bold shadow-xs shrink-0 ring-4 ring-purple-500/5">
            <KeyRound size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Acceso Teocrático y PIN Personal
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  currentPin
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {currentPin ? '✓ PIN Asignado' : 'Sin PIN Asignado'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Identificación individual al estilo NW Scheduler para la aplicación móvil y portal del publicador.
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyCredentials}
            disabled={!currentPin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-200 border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            title="Copiar credenciales teocráticas"
          >
            {copiedText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedText ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={!currentPin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Enviar credenciales por WhatsApp"
          >
            <Share2 size={14} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSlipModal(true)}
            disabled={!currentPin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Ver papeleta de acceso teocrático para imprimir o escanear QR"
          >
            <QrCode size={14} />
            <span>Papeleta QR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Tarjeta: Configuración del PIN Personal */}
        <div className="bg-white dark:bg-[#0f1623] p-6 rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                PIN Personal del Publicador
              </h4>
            </div>
            {currentPin && (
              <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                {currentPin.length} dígitos
              </span>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Código PIN Personal (4 a 8 dígitos)
            </label>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={currentPin}
                onChange={(e) => handlePinInputChange(e.target.value)}
                placeholder="Ej. 5832"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center tracking-widest text-xl font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Indicador de Fortaleza del PIN */}
            {currentPin ? (
              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
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
                  <span className="text-[11px] text-slate-400 text-right">
                    {pinEvaluation.message}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                El publicador usará este PIN para ingresar a su vista personal desde cualquier dispositivo en el Salón del Reino o desde su teléfono.
              </p>
            )}

            {/* Botones de Acción de PIN */}
            <div className="flex items-center gap-2 pt-3 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateNewPin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Generar PIN Seguro Aleatorio</span>
              </button>

              {currentPin && (
                <button
                  type="button"
                  onClick={handleRevokePin}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  title="Revocar PIN"
                >
                  <Trash2 size={14} />
                  <span>Revocar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Tarjeta: Rol Operativo en el Sistema (Permisos de Aplicación) */}
        <div className="bg-white dark:bg-[#0f1623] p-6 rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Rol del Sistema (Permisos de Aplicación)
              </h4>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                THEOCRATIC_ROLES[currentRole]?.badgeColor || 'bg-slate-100 text-slate-700'
              }`}
            >
              {THEOCRATIC_ROLES[currentRole]?.shortName || 'Publicador'}
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Nivel de Acceso Teocrático
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(Object.keys(THEOCRATIC_ROLES) as TheocraticRole[]).map((rKey) => {
                const rInfo = THEOCRATIC_ROLES[rKey];
                const isSelected = currentRole === rKey;

                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleRoleChange(rKey)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500/80 ring-2 ring-purple-500/20'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-bold text-xs ${
                          isSelected
                            ? 'text-purple-900 dark:text-purple-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {rInfo.shortName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {rInfo.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserCheck size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Permisos actuales de {THEOCRATIC_ROLES[currentRole]?.shortName}:</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {THEOCRATIC_ROLES[currentRole]?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL: PAPELETA DE ACCESO TEOCRÁTICO (SLIP / QR NW SCHEDULER) */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Papeleta de Acceso Teocrático
                  </h4>
                  <p className="text-[11px] text-slate-500">Credencial personal estilo NW Scheduler</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ficha Imprimible / Credencial */}
            <div
              id="printable-theocratic-slip"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-800/80 dark:via-slate-900 dark:to-purple-950/20 border-2 border-dashed border-purple-300 dark:border-purple-800/60 space-y-4 text-center shadow-xs"
            >
              {/* Header de la papeleta */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2.5">
                <div className="text-left">
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">
                    KONGRE TEOCRÁTICO
                  </span>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    {settings.congregationName || 'Congregación Central'}
                  </h5>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold">
                  ID: {settings.congregationNumber || settings.congregationId || 'Salón'}
                </span>
              </div>

              {/* Nombre y Rol */}
              <div className="space-y-0.5 py-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Publicador Autorizado
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {publisherName}
                </p>
                <span className="inline-block text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                  {THEOCRATIC_ROLES[currentRole]?.name || 'Publicador'}
                </span>
              </div>

              {/* Código QR */}
              <div className="flex justify-center py-1">
                <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <canvas ref={qrCanvasRef} className="rounded-lg" />
                </div>
              </div>

              {/* PIN Destacado */}
              <div className="bg-purple-600 text-white rounded-2xl p-3 shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-widest block opacity-90">
                  Tu PIN Personal Único
                </span>
                <span className="text-2xl font-mono font-bold tracking-widest">
                  {currentPin || '••••'}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-tight">
                * Guarda esta papeleta en privado. Escanea el código con tu celular o introduce tu PIN para activar tu vista personal.
              </p>
            </div>

            {/* Acciones de la Papeleta */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Papeleta</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Share2 size={14} />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
