// src/components/RoleSwitcherModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TheocraticRole, THEOCRATIC_ROLES } from '../utils/rbac';
import { ActiveTab } from './Navbar';
import {
  Shield,
  Check,
  UserCheck,
  Users,
  Plus,
  Trash2,
  X,
  Lock,
  Eye,
  Sparkles,
  Info,
  Key,
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  const {
    activeRole,
    setActiveRole,
    effectiveRoleInfo,
    userRolesList,
    assignRoleToEmail,
    removeRoleFromEmail,
    user,
  } = useAuth();

  const [activeTabMode, setActiveTabMode] = useState<'cambiar_rol' | 'asignar_cuentas'>('cambiar_rol');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedRoleForNew, setSelectedRoleForNew] = useState<TheocraticRole>('secretario');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectRole = (role: TheocraticRole) => {
    setActiveRole(role);
    const roleInfo = THEOCRATIC_ROLES[role];

    // If current active tab is not allowed in new role, redirect to first allowed tab
    if (!roleInfo.allowedTabs.includes(activeTab)) {
      setActiveTab(roleInfo.allowedTabs[0] || 'programacion');
    }

    setFeedback(`Has cambiado al rol: ${roleInfo.name}`);
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 900);
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Por favor ingrese un correo electrónico válido');
      return;
    }

    assignRoleToEmail(newEmail.trim(), selectedRoleForNew, newName.trim());
    setNewEmail('');
    setNewName('');
    setFeedback('Rol asignado correctamente a la cuenta Google.');
    setTimeout(() => setFeedback(null), 2500);
  };

  const roleList: TheocraticRole[] = [
    'coordinador',
    'superintendente_vym',
    'secretario',
    'siervo_discursos',
    'siervo_territorios',
    'siervo_literatura',
    'siervo_cuentas',
    'publico',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Seguridad Teocrática
                </span>
                <span className="text-xs text-indigo-200">Control de Acceso</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Roles y Permisos de Congregación
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Cambiar mi rol vs Gestionar correos */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTabMode('cambiar_rol')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTabMode === 'cambiar_rol'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cambiar Rol Activo
            </button>
            <button
              onClick={() => setActiveTabMode('asignar_cuentas')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTabMode === 'asignar_cuentas'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuentas Google Asignadas ({userRolesList.length})
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Sesión: <strong>{user?.email || 'Sin iniciar'}</strong>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="px-6 py-2 bg-emerald-500 text-white text-xs font-bold text-center animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {activeTabMode === 'cambiar_rol' ? (
            /* TAB 1: SELECT ACTIVE ROLE */
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Cambiar el rol activo te permite verificar cómo visualiza la aplicación cada hermano según su nombramiento, o activar el <strong>Modo Público / Cartelera</strong> para pantallas del Salón del Reino o dispositivos compartidos.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {roleList.map((rKey) => {
                  const r = THEOCRATIC_ROLES[rKey];
                  const isSelected = activeRole === rKey;

                  return (
                    <button
                      key={rKey}
                      onClick={() => handleSelectRole(rKey)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white ${
                            rKey === 'coordinador'
                              ? 'bg-indigo-600'
                              : rKey === 'superintendente_vym'
                              ? 'bg-emerald-600'
                              : rKey === 'secretario'
                              ? 'bg-blue-600'
                              : rKey === 'siervo_discursos'
                              ? 'bg-amber-600'
                              : rKey === 'siervo_territorios'
                              ? 'bg-teal-600'
                              : rKey === 'siervo_literatura'
                              ? 'bg-orange-600'
                              : rKey === 'siervo_cuentas'
                              ? 'bg-rose-600'
                              : 'bg-slate-700'
                          }`}
                        >
                          {rKey === 'publico' ? <Eye className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">
                              {r.name}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badgeColor}`}>
                              {r.shortName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                            {r.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-700">
                            Activar
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB 2: ASSIGN GOOGLE EMAILS */
            <div className="space-y-5">
              {/* Form to add new assignment */}
              <form onSubmit={handleAddAssignment} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  Asignar Rol a Cuenta de Google
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Correo Electrónico de Google:
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="hermano@gmail.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Nombre del Hermano (Opcional):
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej. Roberto Flores"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Responsabilidad Teocrática:
                    </label>
                    <select
                      value={selectedRoleForNew}
                      onChange={(e) => setSelectedRoleForNew(e.target.value as TheocraticRole)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden"
                    >
                      <option value="coordinador">Coordinador del Cuerpo de Ancianos (Acceso Total)</option>
                      <option value="superintendente_vym">Superintendente de Vida y Ministerio</option>
                      <option value="secretario">Secretario (S-21, S-4, S-88)</option>
                      <option value="siervo_discursos">Siervo de Discursos Públicos</option>
                      <option value="siervo_territorios">Siervo de Territorios (S-13)</option>
                      <option value="siervo_literatura">Siervo de Literatura (S-14)</option>
                      <option value="siervo_cuentas">Siervo de Cuentas (S-26)</option>
                      <option value="publico">Modo Público / Cartelera (Solo lectura)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="self-end px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                  >
                    Guardar Asignación
                  </button>
                </div>
              </form>

              {/* List of current assignments */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Cuentas con Permiso Asignado ({userRolesList.length})
                </h4>

                <div className="space-y-2">
                  {userRolesList.map((item) => {
                    const r = THEOCRATIC_ROLES[item.role] || THEOCRATIC_ROLES.publico;
                    const isSuperAdmin = item.email.toLowerCase() === 'hectorguti95@gmail.com';

                    return (
                      <div
                        key={item.email}
                        className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                            {item.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.name || item.email}
                              </p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badgeColor}`}>
                                {r.shortName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {item.email}
                            </p>
                          </div>
                        </div>

                        <div>
                          {!isSuperAdmin && (
                            <button
                              onClick={() => removeRoleFromEmail(item.email)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Remover permiso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Rol en uso: <strong>{effectiveRoleInfo.name}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
