// src/components/PWAInstallButton.tsx
import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Smartphone, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';

// Icono oficial de Kongre en PNG RGB de 24 bits (180x180, cuadrado completo sin transparencia para iOS SpringBoard)
export const KONGRE_OFFICIAL_IOS_ICON_DATA_URI =
  'data:image/png;base64,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';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'drawer' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInsideIframe, setIsInsideIframe] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    try {
      setIsInsideIframe(window.self !== window.top);
    } catch {
      setIsInsideIframe(true);
    }

    // Asegura que el DOM tenga siempre los enlaces apple-touch-icon con el PNG oficial en memoria (Base64)
    if (typeof document !== 'undefined') {
      const iconLinks = document.querySelectorAll<HTMLLinkElement>(
        'link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
      );
      iconLinks.forEach((link) => {
        if (!link.getAttribute('href')?.startsWith('data:image/png;base64,')) {
          link.setAttribute('href', KONGRE_OFFICIAL_IOS_ICON_DATA_URI);
        }
      });
    }
  }, [showIOSGuide]);

  // If already running as an installed standalone PWA, hide prompt
  if (isInstalled) {
    return null;
  }

  const directAppUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://kongre.ai.studio/';

  const handleCopyDirectUrl = async () => {
    try {
      await navigator.clipboard.writeText(directAppUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'drawer') {
      return (
        <button
          onClick={install}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs transition-all active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Instalar Kongre en este dispositivo</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 ${className}`}
        title="Instalar aplicación en tu pantalla de inicio para uso offline"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (or when inside AI Studio preview iframe on mobile)
  if (isIOS) {
    return (
      <>
        {variant === 'drawer' ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-900 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] text-xs font-bold transition-all ${className}`}
          >
            <Smartphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Instalar en iPhone / iPad (Icono Oficial)</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272A] text-xs font-semibold transition-colors shrink-0 ${className}`}
            title="Instrucciones para añadir a la pantalla de inicio de iPhone o iPad con el icono oficial de Kongre"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-[#27272A]">
                <div className="flex items-center gap-3">
                  <img
                    src={KONGRE_OFFICIAL_IOS_ICON_DATA_URI}
                    alt="Kongre"
                    className="w-11 h-11 rounded-[11px] shadow-md ring-1 ring-zinc-300 dark:ring-zinc-700 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                      Instalar Kongre en iPhone
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                      Icono oficial de pantalla de inicio (iOS)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isInsideIframe && (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] leading-snug text-zinc-700 dark:text-zinc-300">
                      <strong>¡Importante!</strong> Estás dentro del editor (<code>aistudio.google.com</code>). Si agregas esta pestaña directamente, iPhone usará el icono de Google AI Studio. Abre primero el enlace directo de Kongre en Safari:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={directAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir enlace directo</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyDirectUrl}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold"
                      title="Copiar URL directa de Kongre"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                      <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2.5 text-xs text-zinc-600 dark:text-[#D4D4D8]">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-100 dark:border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-[#27272A] text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <p className="leading-snug">
                    En la barra inferior de <strong className="text-zinc-900 dark:text-white">Safari</strong>, toca el botón <strong className="text-zinc-900 dark:text-white">Compartir</strong> (cuadro con flecha hacia arriba).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-100 dark:border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-[#27272A] text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <p className="leading-snug">
                    Desliza hacia abajo y selecciona <strong className="text-zinc-900 dark:text-white">Agregar a inicio</strong> (verás el icono oficial <strong className="text-zinc-900 dark:text-white">K</strong> de Kongre).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/60 border border-zinc-100 dark:border-[#27272A]">
                  <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-[#27272A] text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <p className="leading-snug">
                    Activa <strong className="text-zinc-900 dark:text-white">Abrir como app web</strong> y toca <strong className="text-zinc-900 dark:text-white">Agregar</strong> arriba a la derecha.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-2xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 py-2.5 text-xs font-bold transition-colors shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
