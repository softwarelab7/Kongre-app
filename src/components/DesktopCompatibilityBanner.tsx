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
  const isMobileVariant = variant === 'mobile-banner';

  return (
    <div
      className={`${
        isMobileVariant ? 'rounded-2xl p-4 sm:p-5' : 'mt-4 rounded-3xl p-4 sm:p-5'
      } bg-linear-to-br from-indigo-50/95 via-white to-violet-50/80 dark:from-slate-900 dark:via-indigo-950/85 dark:to-slate-900 text-slate-900 dark:text-white border border-indigo-200/90 dark:border-indigo-800/70 shadow-md shadow-indigo-500/5 dark:shadow-indigo-950/30 relative overflow-hidden transition-all`}
    >
      {/* Top subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-600 via-violet-500 to-sky-500" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-indigo-100/90 dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/15">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span>Versión para PC</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Rust v{CURRENT_APP_VERSION}</span>
            </div>
            <h3 className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mt-0.5">
              Kongre App para Escritorio
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
              Ideal para la computadora del Salón del Reino y estudio personal con operación 100% offline.
            </p>
          </div>
        </div>

        {/* Status / Platform Detection */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 sm:self-start">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {isMobileDevice
              ? 'Windows · macOS · Linux'
              : `Recomendado: ${detectedConfig.name}`}
          </span>
        </div>
      </div>

      {/* Interactive OS Selector Grid */}
      <div className="py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Elige el sistema operativo de tu PC:
          </span>
          <button
            type="button"
            onClick={onOpenAllDownloads}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span>Todos los instaladores</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(PLATFORMS_DATA) as PlatformId[]).map((pid) => {
            const p = PLATFORMS_DATA[pid];
            const isSelected = selectedPlatformId === pid;
            const PIcon = p.icon;

            return (
              <button
                key={pid}
                type="button"
                onClick={() => setSelectedPlatformId(pid)}
                className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-white/90 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <PIcon
                  className={`w-4 h-4 shrink-0 ${
                    isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-tight truncate">
                    {p.name}
                  </div>
                  <div
                    className={`text-[10px] font-mono truncate mt-0.5 ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {p.primaryFile.ext} · {p.primaryFile.size}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Platform Details & Action Bar */}
      <div className="pt-3 border-t border-indigo-100/90 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
            <ActiveIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">{activeConfig.architecture}</span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
              {activeConfig.badge}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {activeConfig.compatibilityNote}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={activeConfig.primaryFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Descargar {activeConfig.primaryFile.ext}</span>
            <span className="text-[10.5px] font-mono opacity-85">
              ({activeConfig.primaryFile.size})
            </span>
          </a>

          <button
            type="button"
            onClick={onOpenAllDownloads}
            className="px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 hover:bg-indigo-200/70 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 border border-indigo-200/80 dark:border-indigo-800/80 transition cursor-pointer shrink-0"
            title="Ver catálogo completo de instaladores de PC"
          >
            Más opciones
          </button>
        </div>
      </div>
    </div>
  );
};
