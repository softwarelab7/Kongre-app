// src/components/AccessRestrictedView.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { THEOCRATIC_ROLES } from '../utils/rbac';
import { ActiveTab } from './Navbar';
import { Lock, ShieldAlert, ArrowLeft, Key } from 'lucide-react';

interface AccessRestrictedViewProps {
  requiredRoleName?: string;
  onNavigateHome: () => void;
  onOpenRoleSwitcher: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  requiredRoleName = 'un hermano autorizado',
  onNavigateHome,
  onOpenRoleSwitcher,
}) => {
  const { activeRole, effectiveRoleInfo, isCoordinator } = useAuth();
  const canManageRoles = isCoordinator || activeRole === 'coordinador' || activeRole === 'anciano';

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
        <Lock className="w-8 h-8" />
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
          Acceso Restringido • Privacidad Teocrática
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
          Sección Protegida por Nombramiento
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          Esta información contiene datos confidenciales de la congregación y está reservada para{' '}
          <strong className="text-slate-800 dark:text-slate-200">{requiredRoleName}</strong>.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
        Tu rol activo en este dispositivo:{' '}
        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${effectiveRoleInfo.badgeColor}`}>
          {effectiveRoleInfo.name}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={onNavigateHome}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </button>

        {canManageRoles ? (
          <button
            type="button"
            onClick={onOpenRoleSwitcher}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>Gestionar Roles</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
