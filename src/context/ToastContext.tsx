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
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto min-w-[300px] max-w-md bg-white dark:bg-[#131d2e] 
              border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-4 shadow-2xl 
              flex items-center gap-4 animate-in slide-in-from-right-8 fade-in duration-500
            `}
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : ''}
              ${toast.type === 'error' ? 'bg-red-500/10 text-red-500' : ''}
              ${toast.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/10 text-blue-500' : ''}
            `}>
              {toast.type === 'success' && <Check size={20} strokeWidth={3} />}
              {toast.type === 'error' && <X size={20} strokeWidth={3} />}
              {toast.type === 'warning' && <AlertTriangle size={20} strokeWidth={3} />}
              {toast.type === 'info' && <Info size={20} strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                {toast.type === 'success' ? '¡Éxito!' : 
                 toast.type === 'error' ? 'Error' : 
                 toast.type === 'warning' ? 'Advertencia' : 'Información'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-300 hover:text-zinc-500 transition-colors"
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
