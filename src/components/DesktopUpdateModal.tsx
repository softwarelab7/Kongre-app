import React, { useState } from 'react';
import {
  Download,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { DesktopUpdateInfo, applyOneClickUpdate } from '../services/desktopUpdateService';

interface DesktopUpdateModalProps {
  updateInfo: DesktopUpdateInfo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopUpdateModal: React.FC<DesktopUpdateModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  if (!isOpen || !updateInfo || !updateInfo.hasUpdate) return null;

  const handleManualDownload = () => {
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStartAutoUpdate = async () => {
    try {
      setIsUpdating(true);
      setErrorMessage(null);
      setProgressPercent(5);
      setProgressStatus('Iniciando proceso...');
      await applyOneClickUpdate((percent, text) => {
        setProgressPercent(percent);
        setProgressStatus(text);
      });
    } catch (err: any) {
      setIsUpdating(false);
      setErrorMessage(
        err?.message || 'No se pudo completar la actualización automática. Puedes descargarla manualmente.'
      );
    }
  };

  const isRpm = updateInfo.installKind === 'linux-rpm' || updateInfo.fileName.endsWith('.rpm');
  const isDeb = updateInfo.installKind === 'linux-deb' || updateInfo.fileName.endsWith('.deb');
  const terminalCommand = isRpm
    ? `sudo dnf install ./${updateInfo.fileName}`
    : isDeb
    ? `sudo dpkg -i ./${updateInfo.fileName}`
    : '';

  const handleCopyCommand = async () => {
    if (!terminalCommand) return;
    try {
      await navigator.clipboard.writeText(terminalCommand);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2500);
    } catch {}
  };

  // Buscar el asset AppImage si el usuario en Linux RPM/DEB desea cambiar al formato con 1 clic
  const appImageAsset = updateInfo.allAssets.find((a) => a.name.toLowerCase().endsWith('.appimage'));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={isUpdating ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (deshabilitado mientras se instala) */}
        {!isUpdating && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition cursor-pointer"
            aria-label="Cerrar aviso de actualización"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
            {isUpdating ? (
              <RefreshCw className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <div className="min-w-0 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                Nueva Versión Alfa
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v{updateInfo.latestVersion}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight mt-1">
              ¡Actualización Disponible para PC!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
              Hay una nueva compilación de <strong>Kongre App</strong> con mejoras teocráticas y correcciones.
            </p>
          </div>
        </div>

        {/* Version Comparison Box */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A] space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-600 dark:text-[#D4D4D8]">
            <span>Tu versión instalada:</span>
            <span className="font-mono font-bold text-zinc-500 line-through">v{updateInfo.currentVersion}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-900 dark:text-white font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Nueva versión disponible:
            </span>
            <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">v{updateInfo.latestVersion}</span>
          </div>
          {updateInfo.fileName && (
            <div className="pt-2 border-t border-zinc-200 dark:border-[#27272A]/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
              <span className="truncate pr-2">Paquete oficial: <strong>{updateInfo.fileName}</strong></span>
              {updateInfo.fileSize && <span className="shrink-0 font-medium font-mono">{updateInfo.fileSize}</span>}
            </div>
          )}
        </div>

        {/* Mensaje de error si falla la auto-actualización */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Barra de progreso interactiva si está actualizándose con 1 clic */}
        {isUpdating && (
          <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs">
            <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                {progressStatus || 'Actualizando...'}
              </span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300/80">
              La app se reiniciará sola al completar la instalación.
            </p>
          </div>
        )}

        {/* Instrucciones de terminal para paquetes de sistema Linux (.rpm / .deb) */}
        {!isUpdating && terminalCommand && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-zinc-600 dark:text-[#D4D4D8] font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                Comando rápido de instalación para tu sistema:
              </span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {copiedCommand ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCommand ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <code className="block p-2 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-[11px] overflow-x-auto select-all">
              {terminalCommand}
            </code>
          </div>
        )}

        {/* Acciones */}
        {!isUpdating && (
          <div className="space-y-2.5 pt-1">
            {updateInfo.canAutoUpdate ? (
              <button
                type="button"
                onClick={handleStartAutoUpdate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Actualizar Ahora (1 Clic)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Paquete {isRpm ? 'RPM (.rpm)' : isDeb ? 'DEB (.deb)' : 'Oficial'}
              </button>
            )}

            {/* Si es RPM/DEB y existe AppImage, ofrecer enlace para pasar al formato con 1 clic */}
            {!updateInfo.canAutoUpdate && appImageAsset && (
              <button
                type="button"
                onClick={() => window.open(appImageAsset.downloadUrl, '_blank', 'noopener,noreferrer')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>O descarga la versión portable AppImage (con actualización en 1 clic)</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition cursor-pointer text-center"
            >
              Recordarme más tarde
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
