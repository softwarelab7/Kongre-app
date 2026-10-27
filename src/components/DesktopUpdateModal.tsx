import React from 'react';
import {
  Download,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Monitor,
} from 'lucide-react';
import { DesktopUpdateInfo } from '../services/desktopUpdateService';

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
  if (!isOpen || !updateInfo || !updateInfo.hasUpdate) return null;

  const handleDownload = () => {
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Cerrar aviso de actualización"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
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
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              ¡Actualización Disponible para PC!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hay una nueva compilación de <strong>Kongre App</strong> con mejoras teocráticas y correcciones.
            </p>
          </div>
        </div>

        {/* Version Comparison Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Tu versión instalada:</span>
            <span className="font-mono font-bold text-slate-500 line-through">v{updateInfo.currentVersion}</span>
          </div>
          <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Nueva versión disponible:
            </span>
            <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">v{updateInfo.latestVersion}</span>
          </div>
          {updateInfo.fileName && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate pr-2">Paquete: {updateInfo.fileName}</span>
              {updateInfo.fileSize && <span className="shrink-0 font-medium font-mono">{updateInfo.fileSize}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar e Instalar Actualización
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center"
          >
            Recordarme más tarde
          </button>
        </div>
      </div>
    </div>
  );
};
