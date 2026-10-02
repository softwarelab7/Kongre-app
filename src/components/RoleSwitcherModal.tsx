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
  QrCode,
  Copy,
  Share2,
  KeyRound,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

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
    currentBrotherName,
    rolePinsMap,
    identifyRoleByPersonalPin,
    assignPersonalPinToRole,
    isCoordinator,
  } = useAuth();

  const { invitations, createInvitation, revokeInvitation } = useSecurity();

  const [activeTabMode, setActiveTabMode] = useState<'identificar_pin' | 'directorio_pins' | 'cambiar_rol' | 'asignar_cuentas' | 'invitaciones_qr'>('identificar_pin');
  
  // Personal PIN identification state
  const [enteredPersonalPin, setEnteredPersonalPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Edit role PIN state
  const [editingRole, setEditingRole] = useState<TheocraticRole | null>(null);
  const [editingPin, setEditingPin] = useState('');
  const [editingName, setEditingName] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedRoleForNew, setSelectedRoleForNew] = useState<TheocraticRole>('secretario');

  // Quick invitation state
  const [invRole, setInvRole] = useState<TheocraticRole>('secretario');
  const [invBrotherName, setInvBrotherName] = useState('');
  const [copiedInvId, setCopiedInvId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyPersonalPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!enteredPersonalPin.trim()) {
      setPinError('Introduce tu PIN Personal.');
      return;
    }

    const result = await identifyRoleByPersonalPin(enteredPersonalPin.trim());
    if (result.success && result.role) {
      setPinSuccess(result.message);
      const roleInfo = THEOCRATIC_ROLES[result.role];
      if (!roleInfo.allowedTabs.includes(activeTab)) {
        setActiveTab(roleInfo.allowedTabs[0] || 'programacion');
      }
      setTimeout(() => {
        setPinSuccess(null);
        setEnteredPersonalPin('');
        onClose();
      }, 1200);
    } else {
      setPinError(result.message);
    }
  };

  const handleSaveRolePin = (role: TheocraticRole) => {
    if (!editingPin.trim() || editingPin.trim().length < 4) {
      alert('El PIN debe tener al menos 4 dígitos.');
      return;
    }
    assignPersonalPinToRole(role, editingPin.trim(), editingName.trim());
    setEditingRole(null);
    setFeedback(`PIN actualizado para el rol de ${THEOCRATIC_ROLES[role].name}.`);
    setTimeout(() => setFeedback(null), 2500);
  };

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

  const handleCreateQuickInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createInvitation(invRole, invBrotherName);
    setInvBrotherName('');
    setFeedback(`¡Código generado con éxito: ${created.code}!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopyCode = (id: string, code: string, role: string) => {
    const roleName = THEOCRATIC_ROLES[role as TheocraticRole]?.name || role;
    const msg = `Estimado hermano, aquí tienes tu código de invitación teocrático:\n\nCódigo: ${code}\nRol asignado: ${roleName}\n\nIngresa en la app y selecciona "Unirse a la Congregación" para activar tu acceso.`;
    navigator.clipboard.writeText(msg);
    setCopiedInvId(id);
    setTimeout(() => setCopiedInvId(null), 2000);
  };

  const handleShareWhatsApp = (code: string, role: string) => {
    const roleName = THEOCRATIC_ROLES[role as TheocraticRole]?.name || role;
    const msg = `Estimado hermano, se le ha otorgado acceso teocrático con el rol de *${roleName}*.\n\nCódigo de Invitación: *${code}*\n\nAbra la aplicación y seleccione "Unirse a la Congregación" con este código.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
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

        {/* Tab switcher: Identificar por PIN, Directorio, Manual, Cuentas, QR */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between overflow-x-auto">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold gap-1 shrink-0">
            <button
              onClick={() => setActiveTabMode('identificar_pin')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabMode === 'identificar_pin'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Identificar por PIN Personal</span>
            </button>
            <button
              onClick={() => setActiveTabMode('directorio_pins')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabMode === 'directorio_pins'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Directorio de PINs</span>
            </button>
            <button
              onClick={() => setActiveTabMode('cambiar_rol')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabMode === 'cambiar_rol'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cambio Manual
            </button>
            <button
              onClick={() => setActiveTabMode('asignar_cuentas')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabMode === 'asignar_cuentas'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuentas Google ({userRolesList.length})
            </button>
            <button
              onClick={() => setActiveTabMode('invitaciones_qr')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabMode === 'invitaciones_qr'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>QR ({invitations.filter((i) => i.status === 'active').length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block pl-2">
            Rol actual: <strong>{effectiveRoleInfo.shortName}</strong>
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
          {/* TAB 1: IDENTIFICACIÓN POR PIN PERSONAL */}
          {activeTabMode === 'identificar_pin' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Código de Identificación de Roles
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Introduce tu <strong>PIN Personal</strong> (4 a 6 dígitos). El sistema te identificará automáticamente y activará tus permisos y departamentos correspondientes.
                </p>
                {currentBrotherName && (
                  <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    ✓ Identificado: {currentBrotherName} ({effectiveRoleInfo.name})
                  </div>
                )}
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center animate-shake">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-fade-in">
                  {pinSuccess}
                </div>
              )}

              <form onSubmit={handleVerifyPersonalPin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                    PIN Personal del Hermano:
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={enteredPersonalPin}
                    onChange={(e) => {
                      setEnteredPersonalPin(e.target.value.replace(/\D/g, ''));
                      setPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full p-3 rounded-xl border border-slate-300 font-mono font-bold text-center tracking-widest text-lg bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Identificar y Activar Rol</span>
                </button>
              </form>

              {/* Suggestions / PIN Reference */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider text-center">
                  Códigos de acceso de demostración rápida:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Object.values(rolePinsMap).slice(0, 6).map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setEnteredPersonalPin(item.pin)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-left transition-colors cursor-pointer"
                    >
                      <span className="font-bold block text-slate-800 truncate">{THEOCRATIC_ROLES[item.role]?.shortName}</span>
                      <span className="text-[10px] text-indigo-600 font-mono font-bold">PIN: {item.pin}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIRECTORIO DE PINS DE ROLES */}
          {activeTabMode === 'directorio_pins' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Directorio de PINs Personales por Rol
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cada hermano asignado utiliza su propio PIN Personal como clave de identificación en la congregación.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(rolePinsMap).map((item) => {
                  const roleDef = THEOCRATIC_ROLES[item.role];
                  const isEditingThis = editingRole === item.role;

                  return (
                    <div
                      key={item.role}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleDef?.badgeColor}`}>
                          {roleDef?.shortName || item.role}
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          PIN: {item.pin}
                        </span>
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Nombre del Hermano:</label>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full p-1.5 text-xs rounded-lg border border-slate-300"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">Nuevo PIN Personal:</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={editingPin}
                              onChange={(e) => setEditingPin(e.target.value.replace(/\D/g, ''))}
                              className="w-full p-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveRolePin(item.role)}
                              className="flex-1 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRole(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{roleDef?.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRole(item.role);
                              setEditingPin(item.pin);
                              setEditingName(item.name);
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Modificar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTabMode === 'cambiar_rol' ? (
            /* TAB 3: SELECT ACTIVE ROLE MANUALLY */
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
          ) : activeTabMode === 'asignar_cuentas' ? (
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
          ) : (
            /* TAB 3: INVITACIONES TEOCRÁTICAS Y QR */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <QrCode className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 leading-relaxed">
                  Genera códigos de invitación teocráticos para los ancianos y siervos. Los hermanos pueden ingresar con el código o escanear el código QR desde su celular, sin necesidad de cuentas Google obligatorias ni registros públicos.
                </p>
              </div>

              {/* Form to generate invitation */}
              <form onSubmit={handleCreateQuickInvitation} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Crear Nuevo Código de Invitación</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rol teocrático a asignar:
                    </label>
                    <select
                      value={invRole}
                      onChange={(e) => setInvRole(e.target.value as TheocraticRole)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      {roleList.map((r) => (
                        <option key={r} value={r}>
                          {THEOCRATIC_ROLES[r].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nombre del hermano (opcional):
                    </label>
                    <input
                      type="text"
                      value={invBrotherName}
                      onChange={(e) => setInvBrotherName(e.target.value)}
                      placeholder="Ej: Hno. Mateo Rivas"
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generar Código</span>
                  </button>
                </div>
              </form>

              {/* Invitations List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Invitaciones Vigentes ({invitations.filter((i) => i.status === 'active').length}):
                </span>

                {invitations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No hay códigos de invitación generados aún.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 text-xs px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100">
                              {inv.code}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {THEOCRATIC_ROLES[inv.role as TheocraticRole]?.shortName || inv.role}
                            </span>
                            {inv.status === 'active' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                Activa
                              </span>
                            )}
                            {inv.status === 'used' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                                Usada
                              </span>
                            )}
                            {inv.status === 'revoked' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                                Revocada
                              </span>
                            )}
                          </div>
                          {inv.targetName && (
                            <p className="text-[11px] text-slate-500">Destinada a: {inv.targetName}</p>
                          )}
                        </div>

                        {inv.status === 'active' && (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(inv.id, inv.code, inv.role)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Copiar texto con instrucciones"
                            >
                              {copiedInvId === inv.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedInvId === inv.id ? 'Copiado' : 'Copiar'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(inv.code, inv.role)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Enviar por WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => revokeInvitation(inv.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Revocar invitación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
