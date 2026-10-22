import React, { useState } from 'react';
import {
  X,
  ScrollText,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Shield,
  Wrench,
  AlertCircle,
  Cpu,
  Info,
} from 'lucide-react';
import {
  CURRENT_APP_VERSION,
  CURRENT_BUILD_CODE,
  BUILD_DATE,
  BUILD_ENVIRONMENT,
  VERSION_HISTORY,
  getSystemDiagnosticInfo,
  VersionRecord,
} from '../utils/versionLog';
import { useToast } from '../context/ToastContext';
import Logo from '../Logo';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDiagnostics = async () => {
    try {
      const info = getSystemDiagnosticInfo();
      await navigator.clipboard.writeText(info);
      setCopied(true);
      showToast('Información de versión copiada al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('No se pudo copiar automáticamente al portapapeles', 'warning');
    }
  };

  const getCategoryBadge = (category: 'feature' | 'improvement' | 'fix' | 'security') => {
    switch (category) {
      case 'feature':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <Sparkles className="w-2.5 h-2.5" /> Novedad
          </span>
        );
      case 'improvement':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5" /> Mejora
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shrink-0">
            <Shield className="w-2.5 h-2.5" /> Seguridad
          </span>
        );
      case 'fix':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <Wrench className="w-2.5 h-2.5" /> Corrección
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Registro de versiones y actualizaciones"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
              <ScrollText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Registro de Versiones y Actualizaciones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Control oficial de versiones y compilaciones de la aplicación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar modal"
            aria-label="Cerrar registro de versiones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Active Version Highlight Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-600/5 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="px-3 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs whitespace-nowrap">
                  v{CURRENT_APP_VERSION}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800/50">
                      ● Compilación Activa
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {BUILD_DATE}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    Kongre Gestor Teocrático v{CURRENT_APP_VERSION}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Entorno: <strong className="text-indigo-600 dark:text-indigo-400">{BUILD_ENVIRONMENT}</strong> • Compilación: #{CURRENT_BUILD_CODE}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyDiagnostics}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
                title="Copiar detalles de versión para verificar despliegue"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Copiar Diagnóstico</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clarity Notice for User & Developer */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Verificación de Actualizaciones:</strong> Cada vez que se compila una actualización, se incrementa el número de versión y se registran las novedades en el historial del sistema. Si el número de versión en el pie de página coincide con este registro, los cambios ya están activos y listos para usar.
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Historial Completo de Compilaciones
            </h4>

            {VERSION_HISTORY.map((rec: VersionRecord) => (
              <div
                key={rec.version}
                className={`p-4 rounded-2xl border transition-all ${
                  rec.isCurrent
                    ? 'bg-white dark:bg-slate-800/90 border-indigo-200 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/20'
                    : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      v{rec.version}
                    </span>
                    {rec.isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Actual
                      </span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {rec.date}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{rec.buildCode}
                  </span>
                </div>

                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                  {rec.title}
                </h5>

                {/* Changes List */}
                <ul className="space-y-2">
                  {rec.changes.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                    >
                      {getCategoryBadge(item.category)}
                      <span className="flex-1">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Documento de control: <code className="font-mono text-indigo-600 dark:text-indigo-400">/CHANGELOG.md</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
