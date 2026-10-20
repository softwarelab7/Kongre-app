// src/components/AccountLinkRequestsModal.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { insertAuditLog } from '../services/auditLogService';
import {
  X,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Mail,
  User,
  Hash,
  Search,
  Check,
} from 'lucide-react';

interface AccountLinkRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountLinkRequestsModal: React.FC<AccountLinkRequestsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { accountLinkRequests, approveAccountLinkRequest, rejectAccountLinkRequest, isDemoMode } = useCongregation();
  const { user, isAdmin, isCoordinator, activeRole, currentBrotherName } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canManageLinks =
    isDemoMode ||
    isAdmin ||
    isCoordinator ||
    activeRole === 'coordinador' ||
    activeRole === 'secretario' ||
    activeRole === 'anciano';

  if (!isOpen || !canManageLinks) return null;

  const reviewerEmail = user?.email || currentBrotherName || 'anciano_autorizado@kongre.org';

  const pendingRequests = accountLinkRequests.filter((r) => r.status === 'pending');
  const historyRequests = accountLinkRequests.filter((r) => r.status !== 'pending');

  const filteredList = (activeTab === 'pending' ? pendingRequests : historyRequests).filter((req) => {
    const q = searchQuery.toLowerCase();
    return (
      req.brotherName.toLowerCase().includes(q) ||
      req.email.toLowerCase().includes(q) ||
      req.role.toLowerCase().includes(q)
    );
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const target = accountLinkRequests.find((r) => r.id === id);
      await approveAccountLinkRequest(id, reviewerEmail);
      insertAuditLog({
        accion: 'APROBAR_VINCULACION_GOOGLE',
        hermano_nid: reviewerEmail,
        hermano_nombre: currentBrotherName || reviewerEmail,
        modulo: 'auth',
        detalles: `Vinculación aprobada para ${target?.brotherName || id} (${target?.email || ''}, rol: ${target?.role || ''}).`,
      }).catch(() => {});
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    setProcessingId(rejectingId);
    try {
      const target = accountLinkRequests.find((r) => r.id === rejectingId);
      const reason = rejectionReason.trim() || 'No aprobado por el cuerpo de ancianos';
      await rejectAccountLinkRequest(rejectingId, reviewerEmail, reason);
      insertAuditLog({
        accion: 'RECHAZAR_VINCULACION_GOOGLE',
        hermano_nid: reviewerEmail,
        hermano_nombre: currentBrotherName || reviewerEmail,
        modulo: 'auth',
        detalles: `Vinculación rechazada para ${target?.brotherName || rejectingId} (${target?.email || ''}). Motivo: ${reason}`,
      }).catch(() => {});
      setRejectingId(null);
      setRejectionReason('');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-700 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Vinculación de Cuentas Google
                </h3>
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">
                    {pendingRequests.length} pendiente{pendingRequests.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprobación teocrática requerida para que los publicadores accedan con su correo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher and search bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({pendingRequests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Historial ({historyRequests.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                {activeTab === 'pending' ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <Clock className="w-7 h-7" />}
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {activeTab === 'pending'
                  ? 'No hay solicitudes pendientes de aprobación'
                  : 'No hay solicitudes en el historial'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'pending'
                  ? 'Cuando un publicador intente vincular un correo de Google usando su PIN personal, aparecerá aquí para que los ancianos lo aprueben.'
                  : 'Aquí aparecerán las vinculaciones que hayan sido aprobadas o rechazadas.'}
              </p>
            </div>
          ) : (
            filteredList.map((req) => {
              const roleInfo = THEOCRATIC_ROLES[req.role as TheocraticRole] || {
                name: req.role,
                badgeColor: 'bg-slate-100 text-slate-700',
              };

              const formattedDate = new Date(req.requestedAt).toLocaleString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    req.status === 'pending'
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : req.status === 'approved'
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {req.brotherName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.badgeColor}`}>
                            {roleInfo.name}
                          </span>
                          {req.status === 'pending' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Esperando Aprobación
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Aprobado
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 flex items-center gap-1">
                              <XCircle className="w-2.5 h-2.5" />
                              Rechazado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-800 dark:text-slate-200">{req.email}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                          </span>
                        </div>

                        {req.status === 'rejected' && req.rejectionReason && (
                          <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2 rounded-lg border border-red-200 dark:border-red-900">
                            Motivo: {req.rejectionReason}
                          </p>
                        )}
                        {req.status === 'approved' && req.reviewedBy && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            Aprobado por: {req.reviewedBy} ({new Date(req.reviewedAt || '').toLocaleDateString()})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions (only for pending) */}
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleApprove(req.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar Vinculación</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => setRejectingId(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/60 dark:text-slate-300 dark:hover:text-red-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Los hermanos aprobados podrán ingresar directamente con su cuenta de Google.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Submodal for Rejection Reason */}
      {rejectingId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Rechazar Solicitud de Vinculación
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Indica el motivo por el cual no se aprueba la vinculación de este correo:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: El correo no corresponde al publicador / PIN incorrecto..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-500/20 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
