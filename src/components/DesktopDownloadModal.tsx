import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Monitor,
  Apple,
  ExternalLink,
  ShieldCheck,
  Zap,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { CURRENT_APP_VERSION } from '../utils/versionLog';

interface DesktopDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type OperatingSystem = 'windows' | 'mac' | 'fedora' | 'linux' | 'unknown';

const DOWNLOAD_BASE_URL = 'https://github.com/softwarelab7/Kongre-app/releases/latest/download';

export const DesktopDownloadModal: React.FC<DesktopDownloadModalProps> = ({ isOpen, onClose }) => {
  const [detectedOs, setDetectedOs] = useState<OperatingSystem>('windows');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) {
      setDetectedOs('windows');
    } else if (ua.includes('mac')) {
      setDetectedOs('mac');
    } else if (ua.includes('fedora') || ua.includes('red hat') || ua.includes('rhel')) {
      setDetectedOs('fedora');
    } else if (ua.includes('linux')) {
      setDetectedOs('linux');
    } else {
      setDetectedOs('windows');
    }
  }, []);

  if (!isOpen) return null;

  const platforms = [
    {
      id: 'windows',
      name: 'Windows',
      desc: 'Windows 10 / 11 (64 bits)',
      icon: Monitor,
      color: 'from-blue-600 to-cyan-500',
      badge: 'Instalador oficial',
      primaryFile: {
        name: 'Kongre Setup (.exe)',
        size: '15.3 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_2.12.35_x64-setup.exe`,
        recommended: true,
      },
      secondaryFile: {
        name: 'Paquete MSI (.msi)',
        size: '16.1 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_2.12.35_x64_en-US.msi`,
      },
    },
    {
      id: 'fedora',
      name: 'Fedora / Red Hat',
      desc: 'Fedora 38+, RHEL, CentOS, openSUSE',
      icon: Monitor,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Paquete Nativo RPM',
      primaryFile: {
        name: 'Kongre RPM (.rpm)',
        size: '16.1 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre-2.12.35-1.x86_64.rpm`,
        recommended: true,
      },
      secondaryFile: {
        name: 'Portable (.AppImage)',
        size: '90.9 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_2.12.35_amd64.AppImage`,
      },
    },
    {
      id: 'mac',
      name: 'macOS',
      desc: 'Apple Silicon (M1-M4) & Intel',
      icon: Apple,
      color: 'from-slate-700 to-slate-900',
      badge: 'Binario Universal',
      primaryFile: {
        name: 'Kongre para Mac (.dmg)',
        size: '32.2 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_2.12.35_universal.dmg`,
        recommended: true,
      },
      secondaryFile: {
        name: 'Paquete Tarball (.tar.gz)',
        size: '32.1 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_universal.app.tar.gz`,
      },
    },
    {
      id: 'linux',
      name: 'Ubuntu / Debian / Otros Linux',
      desc: 'Ubuntu, Debian, Mint, Arch, etc.',
      icon: Monitor,
      color: 'from-amber-600 to-orange-500',
      badge: 'Debian & Universal',
      primaryFile: {
        name: 'Paquete Debian (.deb)',
        size: '16.1 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_2.12.35_amd64.deb`,
        recommended: true,
      },
      secondaryFile: {
        name: 'Portable (.AppImage)',
        size: '90.9 MB',
        url: `${DOWNLOAD_BASE_URL}/Kongre_2.12.35_amd64.AppImage`,
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Kongre App
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                v{CURRENT_APP_VERSION}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Alfa (Pruebas)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Aplicación nativa en <strong>Rust</strong> en fase <strong>Alfa preliminar</strong>. Funciones teocráticas y de seguridad 100% operativas para pruebas de escritorio.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-200">Arranque instantáneo en ~15 MB</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <HardDrive className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-200">100% Offline garantizado</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-200">Cifrado local seguro en reposo</span>
          </div>
        </div>

        {/* Platforms List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Selecciona tu sistema operativo
          </h3>

          <div className="space-y-2.5">
            {platforms.map((p) => {
              const isDetected = detectedOs === p.id || (detectedOs === 'fedora' && p.id === 'fedora');
              const Icon = p.icon;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isDetected
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700/80 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Platform Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shrink-0 shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          {isDetected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Tu sistema
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {p.desc}
                        </p>
                      </div>
                    </div>

                    {/* Right: Download Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={p.primaryFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 ${
                          isDetected
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                            : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        <span>{p.primaryFile.name}</span>
                        <span className="text-[10px] opacity-75">({p.primaryFile.size})</span>
                      </a>

                      {p.secondaryFile && (
                        <a
                          href={p.secondaryFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                          title={`Alternativa: ${p.secondaryFile.name}`}
                        >
                          {p.secondaryFile.name.split(' ')[0]}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Public Repository Footer Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>Descargas seguras y verificadas con suma de verificación SHA-256.</span>
          <a
            href="https://github.com/softwarelab7/Kongre-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <span>Ver repositorio público de descargas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
