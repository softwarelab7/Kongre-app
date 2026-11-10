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
  showResetConfirm: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showResetConfirm: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showResetConfirm: false };
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
      this.setState({ hasError: false, error: null, errorInfo: null, showResetConfirm: false });
    }
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Detección y auto-recuperación de fallos de carga dinámica de módulos (Vite rebuild / cache)
    const errorMsg = error?.message || String(error);
    const isChunkLoadFailed =
      error?.name === 'ChunkLoadError' ||
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('dynamically imported module') ||
      errorMsg.includes('error loading dynamically imported module');

    if (isChunkLoadFailed && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('kongre_chunk_reload_ts');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 8000) {
        sessionStorage.setItem('kongre_chunk_reload_ts', String(now));
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private executeResetCache = () => {
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
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-zinc-900 text-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-800 border border-zinc-700 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Se ha detectado un problema al cargar Kongre
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ha ocurrido un error inesperado en la interfaz. Puedes reiniciar la aplicación o limpiar la memoria caché temporal para restablecer la vista.
              </p>
            </div>

            {this.state.error && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-left overflow-x-auto text-[11px] font-mono text-rose-300">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <details className="text-left text-[10px] text-zinc-400 font-mono bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-2.5 cursor-pointer">
                    <summary className="hover:text-zinc-300 select-none">Detalles técnicos del fallo</summary>
                    <pre className="mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto text-zinc-400">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
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
                onClick={() => this.setState({ showResetConfirm: true })}
                className="py-2.5 px-4 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Limpia datos en caché corruptos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer caché</span>
              </button>
            </div>

            {/* In-app custom confirmation modal (no native browser popups) */}
            {this.state.showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-zinc-800 border border-zinc-700 max-w-sm w-full rounded-2xl p-5 text-left space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-sm text-white">¿Restablecer memoria caché?</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Esta acción reiniciará la memoria caché local para solucionar el error. Tus datos sincronizados en la nube no se perderán.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => this.setState({ showResetConfirm: false })}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-700 text-zinc-200 hover:bg-zinc-600 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={this.executeResetCache}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors"
                    >
                      Sí, restablecer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
