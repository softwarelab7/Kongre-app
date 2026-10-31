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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCancel} />
          <div className="bg-white dark:bg-[#121216] w-full max-w-sm rounded-3xl relative z-10 overflow-hidden border border-zinc-200 dark:border-[#27272A] animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  options.type === 'danger' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                  options.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                  'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <button onClick={handleCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-[#F4F4F5] mb-2">{options.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-[#A1A1AA] leading-relaxed mb-6">{options.message}</p>

              {options.showInput && (
                <div className="mb-6 animate-in slide-in-from-bottom-2 duration-300">
                  <input 
                    type={options.inputType || 'text'}
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={options.placeholder || 'Escribe aquí...'}
                    className="w-full bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-2xl py-4 px-5 text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all text-zinc-900 dark:text-[#F4F4F5]"
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
                  className="flex-1 py-3.5 px-4 bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] transition-all active:scale-95 text-sm cursor-pointer"
                >
                  {options.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl transition-all active:scale-95 text-sm cursor-pointer ${
                    options.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 
                    options.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 
                    'bg-indigo-600 hover:bg-indigo-700'
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
