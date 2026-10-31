// src/components/TwoFactorSetupModal.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Download,
  AlertCircle,
  X,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpCode,
  generateBackupCodes,
} from '../utils/totp';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisherId: string;
  publisherName: string;
  onSuccess: (secret: string, hashedBackupCodes: string[]) => Promise<boolean>;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  publisherId,
  publisherName,
  onSuccess,
}) => {
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [secret, setSecret] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<{ plainCodes: string[]; hashedCodes: string[] } | null>(null);
  const [showManualSecret, setShowManualSecret] = useState(false);

  // Inicializar clave secreta y QR al abrir
  useEffect(() => {
    if (!isOpen) {
      setStep('qr');
      setVerificationCode('');
      setErrorMsg(null);
      setBackupCodes(null);
      return;
    }

    const newSecret = generateTotpSecret();
    setSecret(newSecret);

    const uri = generateTotpUri(publisherName || 'Publicador', newSecret, 'Kongre');
    QRCode.toDataURL(uri, {
      margin: 1.5,
      width: 240,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error('Error generando QR para 2FA:', err);
        setErrorMsg('No se pudo generar el código QR.');
      });
  }, [isOpen, publisherName]);

  if (!isOpen) return null;

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    } catch {}
  };

  const handleVerifyAndProceed = async () => {
    const clean = verificationCode.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setErrorMsg('Introduce el código completo de 6 dígitos.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const isValid = await verifyTotpCode(secret, clean, 1);
      if (!isValid) {
        setErrorMsg('El código de 6 dígitos no coincide o ha expirado. Asegúrate de que la hora de tu teléfono esté sincronizada.');
        setIsVerifying(false);
        return;
      }

      // Generar códigos de respaldo
      const generated = await generateBackupCodes(8);
      setBackupCodes(generated);

      // Guardar en el contexto de autenticación
      const saved = await onSuccess(secret, generated.hashedCodes);
      if (!saved) {
        setErrorMsg('Ocurrió un error al guardar la configuración de 2FA.');
        setIsVerifying(false);
        return;
      }

      // Avanzar al paso de códigos de respaldo
      setStep('backup');
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al validar el código.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (!backupCodes) return;
    try {
      const text = `KONGRE - Códigos de Respaldo de Emergencia (2FA)\nPublicador: ${publisherName}\nFecha: ${new Date().toLocaleDateString()}\n\n${backupCodes.plainCodes.join('\n')}\n\n* Cada código solo puede utilizarse una vez. Guárdalos en un lugar seguro.`;
      await navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2500);
    } catch {}
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes) return;
    const text = `KONGRE - Códigos de Respaldo de Emergencia (2FA)\nPublicador: ${publisherName}\nFecha: ${new Date().toLocaleDateString()}\n\n${backupCodes.plainCodes.join('\n')}\n\n* Cada código solo puede utilizarse una vez. Guárdalos en un lugar seguro.`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kongre-respaldo-2fa-${publisherName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121216] rounded-3xl shadow-2xl border border-zinc-200 dark:border-[#27272A] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-[#18181F] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272A] shadow-xs">
              <ShieldCheck className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg">
                Verificación en Dos Pasos (2FA)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Compatible con Microsoft Authenticator y Google Authenticator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de Pasos */}
        <div className="px-6 py-2.5 bg-zinc-50 dark:bg-[#18181F]/40 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between text-xs font-semibold">
          <span className={`flex items-center gap-1.5 ${step === 'qr' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400'}`}>
            <span>1. Escanear QR</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
          <span className={`flex items-center gap-1.5 ${step === 'verify' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400'}`}>
            <span>2. Validar Código</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
          <span className={`flex items-center gap-1.5 ${step === 'backup' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-400'}`}>
            <span>3. Códigos Respaldo</span>
          </span>
        </div>

        {/* Cuerpo del contenido según el paso */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-zinc-600 dark:text-[#D4D4D8]">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 text-xs flex items-start gap-2.5 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'qr' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-200/80 dark:border-[#27272A] text-xs space-y-1.5">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Instrucciones rápidas:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600 dark:text-[#D4D4D8]">
                  <li>Abre la app <strong>Microsoft Authenticator</strong> en tu teléfono.</li>
                  <li>Toca el botón <strong>«+»</strong> (Agregar cuenta) y elige <strong>«Otra cuenta (Google, etc.)»</strong>.</li>
                  <li>Apunta tu cámara a este código QR.</li>
                </ol>
              </div>

              {/* Contenedor del Código QR */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-zinc-200 dark:border-[#27272A] shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Código QR para Microsoft Authenticator"
                    className="w-52 h-52 object-contain rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
                <span className="mt-2 text-[11px] font-medium text-zinc-400">
                  Kongre: {publisherName}
                </span>
              </div>

              {/* Opción de Clave Manual */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowManualSecret(!showManualSecret)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{showManualSecret ? 'Ocultar clave manual' : '¿No puedes escanear el código? Escribir clave manual'}</span>
                </button>

                {showManualSecret && (
                  <div className="mt-2 p-3 bg-zinc-100 dark:bg-[#18181F] rounded-xl flex items-center justify-between gap-2 border border-zinc-200 dark:border-[#27272A]">
                    <code className="text-xs font-mono font-bold tracking-wider text-zinc-900 dark:text-white break-all">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-700 hover:bg-zinc-200 rounded-lg border border-zinc-300 dark:border-zinc-600 font-semibold flex items-center gap-1 shrink-0"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSecret ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto mb-2 border border-zinc-200 dark:border-[#27272A]">
                  <Lock className="w-6 h-6 text-zinc-500" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-base">
                  Introduce el código de verificación
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                  Abre Microsoft Authenticator y escribe el código de 6 dígitos que aparece para <strong>Kongre</strong>.
                </p>
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl font-mono tracking-[0.35em] font-extrabold py-3.5 px-4 rounded-2xl border-2 border-zinc-300 dark:border-[#27272A] focus:border-zinc-500 bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-zinc-500/10 shadow-xs"
                  autoFocus
                />
              </div>

              <p className="text-[11px] text-center text-zinc-400">
                El código cambia automáticamente cada 30 segundos.
              </p>
            </div>
          )}

          {step === 'backup' && backupCodes && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-zinc-200 text-xs flex items-start gap-2.5 shadow-xs">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <div>
                  <strong className="text-zinc-900 dark:text-[#F4F4F5]">¡Verificación en Dos Pasos activada con éxito!</strong>
                  <p className="mt-0.5 text-zinc-600 dark:text-[#A1A1AA]">
                    Guarda estos códigos de respaldo en un lugar seguro. Si alguna vez pierdes o cambias de teléfono, podrás utilizarlos para acceder a tu cuenta. Cada código es de un solo uso.
                  </p>
                </div>
              </div>

              {/* Grid de Códigos de Respaldo */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-[#18181F]/80 rounded-2xl border border-zinc-200 dark:border-[#27272A]">
                {backupCodes.plainCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200/80 dark:border-[#27272A] font-mono text-center text-xs font-bold tracking-wider text-zinc-800 dark:text-[#E4E4E7]"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCodes ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCodes ? 'Copiados al portapapeles' : 'Copiar códigos'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="py-2.5 px-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Descargar como archivo de texto"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar .txt</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción del pie */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-[#27272A] bg-zinc-50/60 dark:bg-zinc-850 flex items-center justify-end gap-2.5">
          {step === 'qr' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-zinc-600 dark:text-[#D4D4D8] text-xs font-semibold hover:bg-zinc-200/70 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Ya escaneé el código →</span>
              </button>
            </>
          )}

          {step === 'verify' && (
            <>
              <button
                type="button"
                onClick={() => setStep('qr')}
                disabled={isVerifying}
                className="py-2.5 px-4 rounded-xl text-zinc-600 dark:text-[#D4D4D8] text-xs font-semibold hover:bg-zinc-200/70 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                ← Volver al QR
              </button>
              <button
                type="button"
                onClick={handleVerifyAndProceed}
                disabled={isVerifying || verificationCode.length !== 6}
                className="py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Verificar y Activar 2FA</span>
                )}
              </button>
            </>
          )}

          {step === 'backup' && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Entendido, cerrar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
