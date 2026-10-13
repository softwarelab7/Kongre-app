import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  showInput?: boolean;
  placeholder?: string;
  inputType?: string;
  defaultValue?: string;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: Omit<ConfirmOptions, 'showInput'>) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolver, setResolver] = useState<((value: any) => void) | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setInputValue('');
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  };

  const prompt = (opts: Omit<ConfirmOptions, 'showInput'>): Promise<string | null> => {
    setOptions({ ...opts, showInput: true });
    setInputValue('');
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
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
    <ModalContext.Provider value={{ confirm, prompt }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={handleCancel} />
          <div className="bg-white dark:bg-[#131d2e] w-full max-w-sm rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  options.type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                  options.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <button onClick={handleCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{options.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">{options.message}</p>

              {options.showInput && (
                <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
                  <input 
                    type={options.inputType || 'text'}
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={options.placeholder || 'Escribe aquí...'}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirm();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3.5 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 text-sm"
                >
                  {options.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-sm ${
                    options.type === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 
                    options.type === 'warning' ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600' : 
                    'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'
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
      confirm: async ({ message }: ConfirmOptions) => window.confirm(message),
      prompt: async ({ message }: any) => window.prompt(message)
    };
  }
  return context;
};
