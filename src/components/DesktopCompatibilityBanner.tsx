import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  Apple,
  CheckCircle2,
  Sparkles,
  Zap,
  HardDrive,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { CURRENT_APP_VERSION } from '../utils/versionLog';

export type PlatformId = 'windows' | 'mac' | 'fedora' | 'linux';

const DOWNLOAD_BASE_URL = 'https://github.com/softwarelab7/Kongre-app/releases/latest/download';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  osFamily: 'Windows' | 'macOS' | 'Linux';
  badge: string;
  architecture: string;
  icon: React.ComponentType<{ className?: string }>;
  compatibilityNote: string;
  primaryFile: {
    name: string;
    ext: string;
    size: string;
    url: string;
  };
  secondaryFile?: {
    name: string;
    ext: string;
    size: string;
    url: string;
  };
  gradient: string;
}

export const PLATFORMS_DATA: Record<PlatformId, PlatformConfig> = {
  windows: {
    id: 'windows',
    name: 'Windows',
    osFamily: 'Windows',
    badge: 'Instalador Oficial .exe',
    architecture: 'Windows 10 / 11 (64-bit)',
    icon: Monitor,
    compatibilityNote: 'Compatible con Windows 10, Windows 11 y Windows Server',
    primaryFile: {
      name: 'Instalador Kongre Setup (.exe)',
      ext: '.exe',
      size: '15.3 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_x64-setup.exe`,
    },
    secondaryFile: {
      name: 'Paquete MSI (.msi)',
      ext: '.msi',
      size: '16.1 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_x64_en-US.msi`,
    },
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
  },
  mac: {
    id: 'mac',
    name: 'macOS',
    osFamily: 'macOS',
    badge: 'Binario Universal .dmg',
    architecture: 'Apple Silicon (M1-M4) & Intel',
    icon: Apple,
    compatibilityNote: 'Universal: Optimizado nativamente para chips M1, M2, M3, M4 e Intel',
    primaryFile: {
      name: 'Imagen de Disco Kongre (.dmg)',
      ext: '.dmg',
      size: '32.2 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_universal.dmg`,
    },
    secondaryFile: {
      name: 'Paquete Tarball (.tar.gz)',
      ext: '.tar.gz',
      size: '32.1 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_universal.app.tar.gz`,
    },
    gradient: 'from-slate-800 via-slate-700 to-zinc-900',
  },
  fedora: {
    id: 'fedora',
    name: 'Fedora / Red Hat',
    osFamily: 'Linux',
    badge: 'Paquete RPM Nativo',
    architecture: 'Fedora 38+, RHEL, openSUSE (x86_64)',
    icon: Monitor,
    compatibilityNote: 'Integración nativa con GNOME / KDE y WebKitGTK',
    primaryFile: {
      name: 'Paquete Nativo Kongre (.rpm)',
      ext: '.rpm',
      size: '16.1 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre-${CURRENT_APP_VERSION}-1.x86_64.rpm`,
    },
    secondaryFile: {
      name: 'Portable (.AppImage)',
      ext: '.AppImage',
      size: '90.9 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_amd64.AppImage`,
    },
    gradient: 'from-blue-500 via-indigo-700 to-indigo-900',
  },
  linux: {
    id: 'linux',
    name: 'Ubuntu / Debian',
    osFamily: 'Linux',
    badge: 'Paquete DEB Nativo',
    architecture: 'Ubuntu 20+, Debian 11+, Mint, Arch',
    icon: Monitor,
    compatibilityNote: 'Empaquetado oficial con dependencias WebKitGTK incluidas',
    primaryFile: {
      name: 'Paquete Debian Kongre (.deb)',
      ext: '.deb',
      size: '16.1 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_amd64.deb`,
    },
    secondaryFile: {
      name: 'Portable (.AppImage)',
      ext: '.AppImage',
      size: '90.9 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_amd64.AppImage`,
    },
    gradient: 'from-amber-600 via-orange-600 to-red-600',
  },
};

export function detectUserPlatform(): { id: PlatformId; isMobile: boolean } {
  if (typeof window === 'undefined') {
    return { id: 'windows', isMobile: false };
  }
  const ua = (navigator.userAgent || '').toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

  if (ua.includes('fedora') || ua.includes('red hat') || ua.includes('rhel')) {
    return { id: 'fedora', isMobile };
  }
  if (ua.includes('mac') || ua.includes('darwin')) {
    return { id: 'mac', isMobile };
  }
  if (ua.includes('linux')) {
    return { id: 'linux', isMobile };
  }
  return { id: 'windows', isMobile };
}

interface DesktopCompatibilityBannerProps {
  variant?: 'hero-card' | 'mobile-banner' | 'compact';
  onOpenAllDownloads: () => void;
}

export const DesktopCompatibilityBanner: React.FC<DesktopCompatibilityBannerProps> = ({
  variant = 'hero-card',
  onOpenAllDownloads,
}) => {
  const [detectedPlatformId, setDetectedPlatformId] = useState<PlatformId>('windows');
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId>('windows');
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    const { id, isMobile } = detectUserPlatform();
    setDetectedPlatformId(id);
    setSelectedPlatformId(id);
    setIsMobileDevice(isMobile);
  }, []);

  const activeConfig = PLATFORMS_DATA[selectedPlatformId];
  const detectedConfig = PLATFORMS_DATA[detectedPlatformId];
  const ActiveIcon = activeConfig.icon;

  // COMPACT / MOBILE BANNER
  if (variant === 'mobile-banner') {
    return (
      <div className="rounded-2xl p-4 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-lg shadow-indigo-950/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
            <Monitor className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-extrabold text-white tracking-tight">
                Kongre App para Escritorio
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Rust v{CURRENT_APP_VERSION}
              </span>
            </div>

            <p className="text-[11.5px] text-slate-300 mt-1 leading-snug">
              Disponible nativamente para <strong>Windows, macOS y Linux</strong>. Ideal para la computadora del Salón del Reino con operación 100% offline.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAllDownloads}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ver instaladores de PC</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HERO CARD (Desktop view)
  return (
    <div className="mt-4 rounded-3xl p-4 sm:p-5 bg-linear-to-br from-slate-900 via-indigo-950/95 to-slate-900 text-white border border-indigo-500/30 shadow-xl shadow-indigo-950/30 relative overflow-hidden group">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-indigo-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-[15px] font-black text-white tracking-tight truncate">
                Kongre App Nativa para PC
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/25 text-indigo-300 border border-indigo-400/30">
                Rust Core • v{CURRENT_APP_VERSION}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              Arranque instantáneo (~15 MB), 100% offline y cifrado local en reposo
            </p>
          </div>
        </div>

        {/* Operating System Detection pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold self-start sm:self-auto shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {isMobileDevice
              ? 'Multiplataforma PC lista'
              : `Detectado: ${detectedConfig.name}`}
          </span>
        </div>
      </div>

      {/* Quick Platform Switcher Tabs */}
      <div className="pt-3 pb-2.5">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Selecciona tu sistema operativo:
          </span>
          <button
            type="button"
            onClick={onOpenAllDownloads}
            className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <span>Ver todos los formatos</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {(Object.keys(PLATFORMS_DATA) as PlatformId[]).map((pid) => {
            const p = PLATFORMS_DATA[pid];
            const isSelected = selectedPlatformId === pid;
            const isDetected = detectedPlatformId === pid && !isMobileDevice;
            const PIcon = p.icon;

            return (
              <button
                key={pid}
                type="button"
                onClick={() => setSelectedPlatformId(pid)}
                className={`relative px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-white/15 border-indigo-400 text-white shadow-xs'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <PIcon className="w-4 h-4 shrink-0 text-indigo-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold leading-tight truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {p.primaryFile.ext}
                  </div>
                </div>

                {isDetected && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900"
                    title="Tu sistema actual"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Download Action Area */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/20 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-4 rounded-b-3xl border-t border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <ActiveIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{activeConfig.architecture}</span>
            <span className="text-white/40">•</span>
            <span className="text-indigo-300 font-semibold text-[11px] shrink-0">
              {activeConfig.badge}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {activeConfig.compatibilityNote}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={activeConfig.primaryFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar {activeConfig.primaryFile.ext}</span>
            <span className="text-[10.5px] font-normal opacity-80">
              ({activeConfig.primaryFile.size})
            </span>
          </a>

          {activeConfig.secondaryFile && (
            <a
              href={activeConfig.secondaryFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition text-center"
              title={`Alternativa: ${activeConfig.secondaryFile.name}`}
            >
              {activeConfig.secondaryFile.ext}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
