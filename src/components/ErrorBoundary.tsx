// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidMount() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityRecovery);
    }
  }

  public componentWillUnmount() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityRecovery);
    }
  }

  private handleVisibilityRecovery = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible' && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    if (confirm('¿Deseas reiniciar la memoria caché local para solucionar el error? Tus datos en la nube no se perderán.')) {
      try {
        sessionStorage.clear();
        const keepKeys = ['kongre_security_congregation_pin_hash', 'kongre_is_registered_congregation'];
        const saved: Record<string, string> = {};
        keepKeys.forEach((k) => {
          const v = localStorage.getItem(k);
          if (v) saved[k] = v;
        });
        localStorage.clear();
        Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      window.location.href = window.location.origin;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Se ha detectado un problema al cargar Kongre
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ha ocurrido un error inesperado en la interfaz. Puedes reiniciar la aplicación o limpiar la memoria caché temporal para restablecer la vista.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-rose-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recargar página</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Limpia datos en caché corruptos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer caché</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
