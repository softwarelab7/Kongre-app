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
import { motion, AnimatePresence } from 'motion/react';
import { CURRENT_APP_VERSION } from '../utils/versionLog';

export type PlatformId = 'linux' | 'fedora' | 'appimage';

const DOWNLOAD_BASE_URL = 'https://github.com/softwarelab7/Kongre-app/releases/latest/download';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  osFamily: 'Linux';
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
  linux: {
    id: 'linux',
    name: 'Ubuntu / Debian',
    osFamily: 'Linux',
    badge: 'Paquete DEB Nativo',
    architecture: 'Ubuntu 20+, Debian 11+, Mint, Arch',
    icon: Monitor,
    compatibilityNote: 'Empaquetado oficial con dependencias WebKitGTK incluidas',
    primaryFile: {
      name: 'Paquete Debian (.deb)',
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
  fedora: {
    id: 'fedora',
    name: 'Fedora / Red Hat',
    osFamily: 'Linux',
    badge: 'Paquete RPM Nativo',
    architecture: 'Fedora 38+, RHEL, openSUSE (x86_64)',
    icon: Monitor,
    compatibilityNote: 'Integración nativa con GNOME / KDE y WebKitGTK',
    primaryFile: {
      name: 'Paquete Nativo (.rpm)',
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
  appimage: {
    id: 'appimage',
    name: 'Linux Portable',
    osFamily: 'Linux',
    badge: 'AppImage Universal',
    architecture: 'Cualquier distribución Linux (x86_64)',
    icon: HardDrive,
    compatibilityNote: 'Sin instalación ni dependencias; dale permisos de ejecución y abre al instante',
    primaryFile: {
      name: 'Kongre Portable (.AppImage)',
      ext: '.AppImage',
      size: '90.9 MB',
      url: `${DOWNLOAD_BASE_URL}/Kongre_${CURRENT_APP_VERSION}_amd64.AppImage`,
    },
    gradient: 'from-purple-600 via-indigo-600 to-zinc-800',
  },
};

export function detectUserPlatform(): {
  id: PlatformId;
  isMobile: boolean;
  osFamily: 'windows' | 'mac' | 'linux';
} {
  if (typeof window === 'undefined') {
    return { id: 'linux', isMobile: false, osFamily: 'linux' };
  }
  const ua = (navigator.userAgent || '').toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

  let osFamily: 'windows' | 'mac' | 'linux' = 'linux';
  if (ua.includes('win')) osFamily = 'windows';
  else if (ua.includes('mac') || ua.includes('darwin')) osFamily = 'mac';

  if (ua.includes('fedora') || ua.includes('red hat') || ua.includes('rhel')) {
    return { id: 'fedora', isMobile, osFamily };
  }
  return { id: 'linux', isMobile, osFamily };
}

interface DesktopCompatibilityBannerProps {
  variant?: 'hero-card' | 'mobile-banner' | 'compact';
  onOpenAllDownloads: () => void;
}

export const DesktopCompatibilityBanner: React.FC<DesktopCompatibilityBannerProps> = ({
  variant = 'hero-card',
  onOpenAllDownloads,
}) => {
  const [detectedPlatformId, setDetectedPlatformId] = useState<PlatformId>('linux');
  const [selectedPlatformId, setSelectedPlatformId] = useState<PlatformId>('linux');
  const [detectedOsFamily, setDetectedOsFamily] = useState<'windows' | 'mac' | 'linux'>('linux');
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    const { id, isMobile, osFamily } = detectUserPlatform();
    setDetectedPlatformId(id);
    setSelectedPlatformId(id);
    setDetectedOsFamily(osFamily);
    setIsMobileDevice(isMobile);
  }, []);

  const activeConfig = PLATFORMS_DATA[selectedPlatformId];
  const detectedConfig = PLATFORMS_DATA[detectedPlatformId];
  const ActiveIcon = activeConfig.icon;
  const isMobileVariant = variant === 'mobile-banner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`${
        isMobileVariant ? 'rounded-2xl p-4 sm:p-5' : 'mt-4 rounded-3xl p-4 sm:p-5'
      } bg-linear-to-br from-indigo-50/95 via-white to-violet-50/80 dark:from-zinc-900 dark:via-indigo-950/85 dark:to-zinc-900 text-zinc-900 dark:text-white border border-indigo-200/90 dark:border-indigo-800/70 shadow-md shadow-indigo-500/5 dark:shadow-indigo-950/30 relative overflow-hidden transition-all`}
    >
      {/* Top subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-600 via-violet-500 to-sky-500" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-indigo-100/90 dark:border-[#27272A]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/15"
          >
            <Monitor className="w-5 h-5" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span>Versión para PC</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Linux Nativo v{CURRENT_APP_VERSION}</span>
            </div>
            <h3 className="text-[15px] sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight leading-snug mt-0.5">
              Kongre App para Linux & PWA
            </h3>
            <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] leading-relaxed mt-0.5">
              Paquetes nativos ultraligeros para cabina y Salón del Reino con operación 100% offline.
            </p>
          </div>
        </div>

        {/* Status / Platform Detection */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 sm:self-start">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {detectedOsFamily !== 'linux'
              ? 'Windows / macOS: Recomendado PWA 1 Clic'
              : `Recomendado: ${detectedConfig?.name || 'Linux'}`}
          </span>
        </div>
      </div>

      {/* Interactive OS Selector Grid */}
      <div className="py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA]">
            Elige el paquete oficial para Linux:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(PLATFORMS_DATA) as PlatformId[]).map((pid) => {
            const p = PLATFORMS_DATA[pid];
            const isSelected = selectedPlatformId === pid;
            const PIcon = p.icon;

            return (
              <motion.button
                key={pid}
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlatformId(pid)}
                className={`px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-white/90 dark:bg-[#18181F]/70 border-zinc-200/80 dark:border-[#27272A]/80 text-zinc-700 dark:text-[#E4E4E7] hover:border-indigo-300 dark:hover:border-indigo-600'
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
                      isSelected ? 'text-indigo-100' : 'text-zinc-400 dark:text-[#A1A1AA]'
                    }`}
                  >
                    {p.primaryFile.ext} · {p.primaryFile.size}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Platform Details & Action Bar with Animated Switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlatformId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="pt-3 border-t border-indigo-100/90 dark:border-[#27272A] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-100">
              <ActiveIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">{activeConfig.architecture}</span>
              <span className="text-zinc-300 dark:text-[#71717A]" aria-hidden="true">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                {activeConfig.badge}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate mt-0.5">
              {activeConfig.compatibilityNote}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={activeConfig.primaryFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0 kg-download-bounce" />
              <span>Descargar {activeConfig.primaryFile.ext}</span>
              <span className="text-[10.5px] font-mono opacity-85">
                ({activeConfig.primaryFile.size})
              </span>
            </motion.a>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
