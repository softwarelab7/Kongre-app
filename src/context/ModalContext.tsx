import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  showInput?: boolean;
  placeholder?: string;
  inputType?: string;
  defaultValue?: string;
  isAlert?: boolean;
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: Omit<ConfirmOptions, 'showInput'>) => Promise<string | null>;
  alert: (options: string | AlertOptions) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolver, setResolver] = useState<((value: any) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions({ ...opts, isAlert: false });
    setInputValue('');
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const prompt = (opts: Omit<ConfirmOptions, 'showInput'>): Promise<string | null> => {
    setOptions({ ...opts, showInput: true, isAlert: false });
    setInputValue('');
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const alert = (opts: string | AlertOptions): Promise<void> => {
    const normalized: ConfirmOptions =
      typeof opts === 'string'
        ? {
            title: 'Aviso',
            message: opts,
            confirmText: 'Entendido',
            type: 'info',
            isAlert: true,
          }
        : {
            title: opts.title || 'Aviso',
            message: opts.message,
            confirmText: opts.confirmText || 'Entendido',
            type: opts.type || 'info',
            isAlert: true,
          };
    setOptions(normalized);
    setInputValue('');
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => () => resolve());
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (options?.showInput) {
      resolver?.(inputValue);
    } else {
      resolver?.(true);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.(options?.showInput ? null : false);
  };

  return (
    <ModalContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCancel} />
          <div className="bg-white dark:bg-[#121216] w-full max-w-sm rounded-3xl relative z-10 overflow-hidden border border-zinc-200 dark:border-[#27272A] shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200 ease-out">
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    options.type === 'danger'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : options.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                  }`}
                >
                  <AlertTriangle size={24} />
                </div>
                <button
                  onClick={handleCancel}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] transition-colors cursor-pointer p-1 rounded-xl active:scale-[0.98] select-none"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-[#F4F4F5] mb-2">
                {options.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-[#A1A1AA] leading-relaxed mb-6">
                {options.message}
              </p>

              {options.showInput && (
                <div className="mb-6 animate-in slide-in-from-bottom-2 duration-200">
                  <input
                    type={options.inputType || 'text'}
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={options.placeholder || 'Escribe aquí...'}
                    className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl py-3 px-4 text-base sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-colors text-zinc-900 dark:text-[#F4F4F5]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirm();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                {!options.isAlert && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#A1A1AA] font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] transition-all active:scale-[0.98] select-none text-sm cursor-pointer"
                  >
                    {options.cancelText || 'Cancelar'}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3 px-4 text-white font-bold rounded-2xl transition-all active:scale-[0.98] select-none text-sm cursor-pointer shadow-sm ${
                    options.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : options.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {options.confirmText || 'Aceptar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    return {
      confirm: async () => false,
      prompt: async () => null,
      alert: async () => {},
    };
  }
  return context;
};
