import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, CloudCheck, ShieldCheck } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-3 right-3 sm:left-6 sm:right-auto z-40 max-w-md animate-in slide-in-from-bottom duration-200">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md shadow-xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Modo Local Offline</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                Tus cambios están protegidos localmente y se cifrarán a Supabase al reconectar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Just reconnected
  return (
    <div className="fixed bottom-20 md:bottom-4 left-3 right-3 sm:left-6 sm:right-auto z-40 max-w-md animate-in slide-in-from-bottom duration-200">
      <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/95 text-white backdrop-blur-md shadow-xl border border-emerald-700/80 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Wifi className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <span>Conexión restablecida</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
          </p>
          <p className="text-[11px] text-emerald-100 truncate">
            Sincronizando registros cifrados con Supabase (Cero Conocimiento AES-256)...
          </p>
        </div>
      </div>
    </div>
  );
};
