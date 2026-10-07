// src/components/PendingApprovalView.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { KongreLogo } from './KongreLogo';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Building2,
  Mail,
  User,
  AlertCircle,
} from 'lucide-react';

interface PendingApprovalViewProps {
  email: string;
  onEnterApp: () => void;
  onSignOut: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  email,
  onEnterApp,
  onSignOut,
}) => {
  const { accountLinkRequests, settings } = useCongregation();
  const { userRolesList, setActiveRole } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const cleanEmail = email.toLowerCase().trim();
  const myRequest = accountLinkRequests.find(
    (r) => r.email.toLowerCase().trim() === cleanEmail
  );

  const roleInfo = myRequest
    ? THEOCRATIC_ROLES[myRequest.role as TheocraticRole] || {
        name: myRequest.role,
        badgeColor: 'bg-indigo-100 text-indigo-700',
      }
    : null;

  const handleCheckStatus = () => {
    setIsChecking(true);
    setCheckMessage(null);

    setTimeout(() => {
      // Check if role has been assigned or request is approved
      const matchingRole = userRolesList.find(
        (r) => r.email.toLowerCase().trim() === cleanEmail
      );
      const updatedReq = accountLinkRequests.find(
        (r) => r.email.toLowerCase().trim() === cleanEmail
      );

      if (updatedReq?.status === 'approved' || matchingRole) {
        if (matchingRole) {
          setActiveRole(matchingRole.role);
        }
        setCheckMessage('¡Tu vinculación ha sido aprobada! Ingresando...');
        setTimeout(() => {
          localStorage.setItem('kongre_has_entered_app', 'true');
          onEnterApp();
        }, 800);
      } else if (updatedReq?.status === 'rejected') {
        setCheckMessage(
          `Tu solicitud fue rechazada: ${
            updatedReq.rejectionReason || 'Consulta con los ancianos de tu congregación.'
          }`
        );
      } else {
        setCheckMessage('Tu solicitud sigue en espera de aprobación por los ancianos.');
      }
      setIsChecking(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
        {/* Brand Emblem */}
        <div className="flex items-center gap-2 mb-6">
          <KongreLogo size="lg" />
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Kongre
          </span>
        </div>

        {/* Status Icon */}
        {myRequest?.status === 'rejected' ? (
          <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 border border-red-200 dark:border-red-800">
            <XCircle className="w-9 h-9" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-9 h-9" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
          {myRequest?.status === 'rejected'
            ? 'Solicitud No Aprobada'
            : 'En Espera de Aprobación'}
        </h2>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          {myRequest?.status === 'rejected'
            ? 'Los ancianos revisaron tu solicitud pero no fue aprobada para vincularse a esta congregación.'
            : 'Tu cuenta de Google y tus credenciales teocráticas fueron recibidas. Por seguridad teocrática, los ancianos o hermanos autorizados deben aprobar la vinculación de tu correo antes de que puedas acceder a la app.'}
        </p>

        {/* Details Card */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 text-left mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Congregación:</span>
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {settings.congregationName || 'Congregación Local'}
            </span>
          </div>

          {myRequest?.brotherName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Publicador:</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {myRequest.brotherName}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>Correo de Google:</span>
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {cleanEmail}
            </span>
          </div>

          {roleInfo && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Privilegio / Rol:</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.badgeColor}`}>
                {roleInfo.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Estado de vinculación:</span>
            <span
              className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                myRequest?.status === 'rejected'
                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
              }`}
            >
              {myRequest?.status === 'rejected' ? 'Rechazado' : 'Pendiente de los Ancianos'}
            </span>
          </div>
        </div>

        {/* Check Message Feedback */}
        {checkMessage && (
          <div className="w-full mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{checkMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            type="button"
            disabled={isChecking}
            onClick={handleCheckStatus}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Comprobando estado...' : 'Comprobar Estado de Aprobación'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión / Salir</span>
          </button>
        </div>

        <p className="mt-6 text-[11px] text-slate-400 dark:text-slate-500">
          Tip: Puedes avisar personalmente al Coordinador o al Secretario para que aprueben tu acceso.
        </p>
      </div>
    </div>
  );
};
