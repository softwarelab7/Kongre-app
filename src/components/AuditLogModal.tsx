// src/components/AuditLogModal.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Clock, Filter, Trash2, X, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import { getAuditLog, pruneAuditLog, clearAuditLog } from '../services/auditLogService';
import { AuditLogEntry } from '../utils/rbac';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLog(300);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchLogs();
    };
    window.addEventListener('kongre_audit_log_updated', handleUpdate);
    return () => window.removeEventListener('kongre_audit_log_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handlePrune = async () => {
    if (confirm('¿Deseas purgar registros de auditoría anteriores a 30 días?')) {
      const count = await pruneAuditLog(30);
      alert(`Se eliminaron ${count} registros antiguos.`);
      fetchLogs();
    }
  };

  const handleClear = async () => {
    if (confirm('¿Estás seguro de que deseas vaciar todo el registro de auditoría? Esta acción no se puede deshacer.')) {
      await clearAuditLog();
      fetchLogs();
    }
  };

  const modules = Array.from(new Set(logs.map((l) => l.modulo).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm === '' ||
      (log.accion && log.accion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.hermano_nombre && log.hermano_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.hermano_nid && log.hermano_nid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.detalles && log.detalles.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchModule = selectedModule === 'all' || log.modulo === selectedModule;

    return matchSearch && matchModule;
  });

  const getModuleBadgeColor = (modulo: string) => {
    switch (modulo.toLowerCase()) {
      case 'auth':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'clm':
      case 'reuniones':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 's21':
      case 'publicadores':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'sync':
      case 'supabase':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registro de Auditoría Teocrática
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                  {logs.length} eventos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial de accesos, inicios de sesión y modificaciones de la congregación
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              title="Refrescar"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center flex-1 min-w-[200px] space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por hermano, acción o detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            >
              <option value="all">Todos los módulos</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  Módulo: {m}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrune}
              title="Purgar registros mayores a 30 días"
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Purgar &gt; 30d</span>
            </button>

            <button
              onClick={handleClear}
              title="Limpiar todo el registro"
              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">No hay registros de auditoría que coincidan con la búsqueda.</p>
              <p className="text-xs text-slate-500 mt-1">Los nuevos inicios de sesión y acciones quedarán registrados aquí automáticamente.</p>
            </div>
          ) : (
            filteredLogs.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-all gap-2"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.hermano_nombre || item.hermano_nid}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${getModuleBadgeColor(item.modulo)}`}>
                        {item.modulo}
                      </span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        • {item.accion}
                      </span>
                    </div>
                    {item.detalles && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                        {item.detalles}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center self-end sm:self-center text-xs text-slate-400 font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {item.fecha ? new Date(item.fecha).toLocaleString() : 'Reciente'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500">
          <span>Solo visible para ancianos y administradores de la congregación</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
