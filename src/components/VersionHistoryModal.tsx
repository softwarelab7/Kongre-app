import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ScrollText,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Shield,
  Wrench,
  Info,
} from 'lucide-react';
import {
  CURRENT_APP_VERSION,
  CURRENT_APP_STAGE,
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

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [isOpen]);

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <Sparkles className="w-3 h-3" /> Novedad
          </span>
        );
      case 'improvement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Mejora
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shrink-0">
            <Shield className="w-3 h-3" /> Seguridad
          </span>
        );
      case 'fix':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <Wrench className="w-3 h-3" /> Corrección
          </span>
        );
    }
  };

  const pageContent = (
    <div
      className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] block sm:py-6 sm:px-6 lg:px-8 transition-colors duration-200 animate-fade-in"
      role="region"
      aria-label="Registro de versiones y actualizaciones"
    >
      <div className="w-full max-w-4xl xl:max-w-5xl mx-auto pb-10">
        {/* Full-Page Main Card */}
        <div className="w-full bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-3xl sm:shadow-xl">
          {/* Sticky Page Header with single back button */}
          <div className="sticky top-0 z-20 px-4 sm:px-7 py-3.5 sm:py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sm:rounded-t-3xl">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-mobile-back-btn="true"
                onClick={onClose}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0 active:scale-95"
                title="Volver"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </button>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  Registro de Versiones
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  Control oficial de versiones y novedades de Kongre
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <Logo variant="isotipo" className="w-4 h-4 object-contain" />
              <span className="hidden sm:inline">Kongre • Changelog</span>
            </div>
          </div>

          {/* Page Body */}
          <div className="px-4 sm:px-7 py-4 sm:py-6 space-y-5 sm:space-y-6">
            {/* Active Version Highlight Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-600/5 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="px-3.5 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm font-mono shrink-0 shadow-xs whitespace-nowrap">
                    v{CURRENT_APP_VERSION}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800/50">
                        ● Compilación Activa
                      </span>
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                        Fase {CURRENT_APP_STAGE}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {BUILD_DATE}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-1">
                      Kongre App v{CURRENT_APP_VERSION} ({CURRENT_APP_STAGE} Preliminar)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Entorno: <strong className="text-indigo-600 dark:text-indigo-400">{BUILD_ENVIRONMENT}</strong> • Compilación: #{CURRENT_BUILD_CODE}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
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
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-xs sm:text-[13px] text-amber-900 dark:text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block text-amber-950 dark:text-amber-200 font-bold mb-0.5">
                  Fase Alfa Preliminar — Camino a la Versión 1.0.0 Definitiva
                </strong>
                Kongre se encuentra en ciclo de desarrollo <strong>Alfa (v0.1.0)</strong> en Web y Escritorio. Siguiendo el estándar internacional SemVer (Versionado Semántico), el sistema mantendrá la serie <code>v0.x.y</code> durante las pruebas de compatibilidad, ajustes de rendimiento y corrección de incidencias, hasta consolidar todas las funciones requeridas para el lanzamiento oficial de la <strong>Versión 1.0.0 Definitiva</strong>.
              </div>
            </div>

            {/* History List */}
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Historial Completo de Compilaciones ({VERSION_HISTORY.length})
              </h3>

              {VERSION_HISTORY.map((rec: VersionRecord) => (
                <div
                  key={rec.version}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    rec.isCurrent
                      ? 'bg-white dark:bg-slate-800/90 border-indigo-200 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/20'
                      : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm sm:text-base text-indigo-600 dark:text-indigo-400">
                        v{rec.version}
                      </span>
                      {rec.isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Actual
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {rec.date}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      #{rec.buildCode}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3">
                    {rec.title}
                  </h4>

                  {/* Changes List */}
                  <ul className="space-y-2.5">
                    {rec.changes.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed"
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

          {/* Page Footer */}
          <div className="px-4 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 sm:rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Documento de control: <code className="font-mono text-indigo-600 dark:text-indigo-400">/CHANGELOG.md</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(pageContent, document.body);
  }
  return pageContent;
};

