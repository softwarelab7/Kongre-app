import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 left-3 right-3 sm:left-auto sm:right-8 z-[200] flex flex-col gap-2.5 sm:gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto w-full sm:min-w-[300px] sm:max-w-md bg-white dark:bg-[#121216] 
              border border-zinc-200 dark:border-[#27272A] rounded-2xl p-3.5 sm:p-4 
              flex items-center gap-3.5 sm:gap-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-right-8 fade-in duration-300
            `}
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
              ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''}
              ${toast.type === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : ''}
              ${toast.type === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : ''}
              ${toast.type === 'info' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' : ''}
            `}>
              {toast.type === 'success' && <Check size={20} strokeWidth={2.5} />}
              {toast.type === 'error' && <X size={20} strokeWidth={2.5} />}
              {toast.type === 'warning' && <AlertTriangle size={20} strokeWidth={2.5} />}
              {toast.type === 'info' && <Info size={20} strokeWidth={2.5} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] leading-tight">
                {toast.type === 'success' ? '¡Éxito!' : 
                 toast.type === 'error' ? 'Error' : 
                 toast.type === 'warning' ? 'Advertencia' : 'Información'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1 font-medium">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback no-op if used outside provider
    return {
      showToast: (msg: string) => { console.log('[Toast]', msg); }
    };
  }
  return context;
};
