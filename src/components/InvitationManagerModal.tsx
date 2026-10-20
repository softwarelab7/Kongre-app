// src/components/InvitationManagerModal.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import {
  formatCanonicalCongregationId,
  getSecureLocalPin,
  encodeSecureShareToken,
  openSafeExternalUrl,
} from '../utils/theocraticSecurity';
import { CongregationInvitation } from '../types';
import { insertAuditLog } from '../services/auditLogService';
import {
  QrCode,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  Share2,
  Lock,
  Unlock,
  Smartphone,
  Laptop,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface InvitationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvitationManagerModal: React.FC<InvitationManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    invitations,
    createInvitation,
    revokeInvitation,
    activeSessions,
    revokeSession,
    isMasterPassphraseSet,
    setMasterPassphrase,
    verifyMasterPassphrase,
  } = useSecurity();
  const { user, isAdmin, isCoordinator, activeRole, currentBrotherName } = useAuth();
  const { settings, isDemoMode } = useCongregation();

  const canManageInvitations =
    isDemoMode ||
    isAdmin ||
    isCoordinator ||
    activeRole === 'coordinador' ||
    activeRole === 'secretario' ||
    activeRole === 'anciano';

  const [activeTab, setActiveTab] = useState<'generar' | 'invitaciones' | 'sesiones' | 'clave_maestra'>('generar');

  // Form state
  const [selectedRole, setSelectedRole] = useState<TheocraticRole>('secretario');
  const [targetBrotherName, setTargetBrotherName] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [generatedInvitation, setGeneratedInvitation] = useState<CongregationInvitation | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Master Passphrase state
  const [currentMasterPass, setCurrentMasterPass] = useState('');
  const [newMasterPass, setNewMasterPass] = useState('');
  const [confirmMasterPass, setConfirmMasterPass] = useState('');
  const [masterPassFeedback, setMasterPassFeedback] = useState<string | null>(null);
  const [masterPassError, setMasterPassError] = useState<string | null>(null);

  const getCongregationCredentials = () => {
    const congId = formatCanonicalCongregationId(
      settings.congregationNumber ||
        settings.congregationId ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('kongre_congregation_number') || localStorage.getItem('kongre_congregation_id') || ''
          : '')
    );
    const congPin =
      typeof window !== 'undefined'
        ? getSecureLocalPin('kongre_registered_cong_pin') ||
          getSecureLocalPin('kongre_last_cong_pin') ||
          ''
        : '';
    return { congId, congPin };
  };

  const buildEncryptedInviteUrl = (code: string) => {
    const { congId, congPin } = getCongregationCredentials();
    const token = encodeSecureShareToken({
      cong: congId || undefined,
      cpin: congPin || undefined,
      invite: code,
    });
    if (token) {
      return `${window.location.origin}/?tk=${encodeURIComponent(token)}#portal?view=invite_code_login`;
    }
    const params = new URLSearchParams();
    params.set('invite', code);
    if (congId) params.set('cong', congId);
    return `${window.location.origin}/?${params.toString()}#portal?view=invite_code_login`;
  };

  // Generate QR when an invitation is selected or created
  useEffect(() => {
    if (generatedInvitation) {
      const inviteUrl = buildEncryptedInviteUrl(generatedInvitation.code);
      QRCode.toDataURL(inviteUrl, {
        width: 200,
        margin: 1.5,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [generatedInvitation, settings.congregationNumber, settings.congregationId]);

  if (!isOpen || !canManageInvitations) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInv = await createInvitation(selectedRole, targetBrotherName, expiryDays);
    setGeneratedInvitation(newInv);
  };

  const getFullPortableInviteCode = (baseCode: string) => {
    const { congId, congPin } = getCongregationCredentials();
    const token = encodeSecureShareToken({
      cong: congId || undefined,
      cpin: congPin || undefined,
      invite: baseCode,
    });
    if (token) return token;
    if (congId && congPin) {
      return `${congId}::${congPin}::${baseCode}`;
    }
    return baseCode;
  };

  const handleCopy = (code: string, role?: TheocraticRole) => {
    const portableCode = getFullPortableInviteCode(code);
    const effectiveRole = role || (generatedInvitation?.role as TheocraticRole) || selectedRole;
    const directLink = buildEncryptedInviteUrl(code);
    const text = `Estimado hermano, aquí tienes tu invitación para unirte a ${settings.congregationName || 'la congregación'} en Kongre:\n\nRol asignado: ${THEOCRATIC_ROLES[effectiveRole]?.name || effectiveRole}\nCódigo de Invitación: ${portableCode}\n\nEnlace directo de activación:\n${directLink}`;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = (code: string, role?: TheocraticRole) => {
    const portableCode = getFullPortableInviteCode(code);
    const effectiveRole = role || (generatedInvitation?.role as TheocraticRole) || selectedRole;
    const directLink = buildEncryptedInviteUrl(code);
    const roleName = THEOCRATIC_ROLES[effectiveRole]?.name || effectiveRole;
    const msg = `Estimado hermano, se le ha otorgado acceso teocrático a *${settings.congregationName || 'la congregación'}* con el rol de *${roleName}*.\n\nCódigo de Invitación: *${portableCode}*\n\nToque el siguiente enlace para activar automáticamente la aplicación en su dispositivo:\n${directLink}`;
    openSafeExternalUrl(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const handleSaveMasterPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setMasterPassError(null);
    setMasterPassFeedback(null);

    if (isMasterPassphraseSet && currentMasterPass) {
      const valid = await verifyMasterPassphrase(currentMasterPass);
      if (!valid) {
        setMasterPassError('La clave maestra actual es incorrecta.');
        return;
      }
    }

    if (!newMasterPass) {
      await setMasterPassphrase(null);
      insertAuditLog({
        accion: 'DESACTIVAR_CLAVE_MAESTRA',
        hermano_nid: user?.email || activeRole,
        hermano_nombre: currentBrotherName || user?.displayName || 'Coordinador',
        modulo: 'seguridad',
        detalles: 'Clave Maestra Zero-Knowledge desactivada.',
      }).catch(() => {});
      setMasterPassFeedback('Clave Maestra desactivada correctamente.');
      setCurrentMasterPass('');
      setNewMasterPass('');
      setConfirmMasterPass('');
      return;
    }

    if (newMasterPass.length < 8) {
      setMasterPassError('La clave maestra debe tener al menos 8 caracteres para seguridad adecuada.');
      return;
    }

    if (newMasterPass !== confirmMasterPass) {
      setMasterPassError('Las dos contraseñas no coinciden.');
      return;
    }

    await setMasterPassphrase(newMasterPass);
    insertAuditLog({
      accion: 'ACTUALIZAR_CLAVE_MAESTRA',
      hermano_nid: user?.email || activeRole,
      hermano_nombre: currentBrotherName || user?.displayName || 'Coordinador',
      modulo: 'seguridad',
      detalles: 'Clave Maestra Zero-Knowledge configurada/actualizada.',
    }).catch(() => {});
    setMasterPassFeedback('¡Clave Maestra de la Congregación actualizada exitosamente!');
    setCurrentMasterPass('');
    setNewMasterPass('');
    setConfirmMasterPass('');
  };

  const roleList: TheocraticRole[] = [
    'coordinador',
    'anciano',
    'superintendente_vym',
    'superintendente_servicio',
    'secretario',
    'siervo_discursos',
    'siervo_territorios',
    'siervo_carritos',
    'siervo_literatura',
    'siervo_cuentas',
    'superintendente_grupo',
    'encargado_mantenimiento',
    'encargado_audiovideo',
    'encargado_acomodadores',
    'encargado_cartelera',
    'publico',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registro Teocrático e Invitaciones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sistema de acceso seguro de congregación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-2 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('generar')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'generar'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Generar Invitación y QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invitaciones')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'invitaciones'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Invitaciones Activas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {invitations.filter((i) => i.status === 'active').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sesiones')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sesiones'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>Dispositivos Autorizados</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {activeSessions.filter((s) => s.status === 'active').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clave_maestra')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clave_maestra'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Clave Maestra (Zero-Knowledge)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* TAB 1: GENERATE INVITATION */}
          {activeTab === 'generar' && (
            <div className="space-y-5">
              {!generatedInvitation ? (
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-slate-600 dark:text-slate-300">
                    <p>
                      Crea un código de invitación teocrático con el rol preasignado. Al compartirlo con el hermano, podrá escanear el código QR con su celular o ingresar el código alfanumérico para quedar registrado automáticamente sin necesidad de autoregistros públicos.
                    </p>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Rol teocrático a otorgar:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {roleList.map((r) => {
                        const info = THEOCRATIC_ROLES[r];
                        const isSelected = selectedRole === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRole(r)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-950 dark:text-white ring-1 ring-indigo-600'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="font-bold block text-xs">{info.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {info.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brother Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre del hermano (opcional):
                      </label>
                      <input
                        type="text"
                        value={targetBrotherName}
                        onChange={(e) => setTargetBrotherName(e.target.value)}
                        placeholder="Ej: Hno. Carlos Morales"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Vigencia de la invitación:
                      </label>
                      <select
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value={7}>7 días</option>
                        <option value={15}>15 días</option>
                        <option value={30}>30 días (Recomendado)</option>
                        <option value={90}>90 días</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Generar Código y QR de Invitación</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Generated Result View */
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Invitación Generada con Éxito
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {THEOCRATIC_ROLES[generatedInvitation.role as TheocraticRole]?.name}
                      </h4>
                      {generatedInvitation.targetName && (
                        <p className="text-xs text-slate-500">Destinada a: {generatedInvitation.targetName}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGeneratedInvitation(null)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100"
                    >
                      Crear Otra
                    </button>
                  </div>

                  {/* QR & Code Display */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                    {qrDataUrl && (
                      <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                        <img src={qrDataUrl} alt="QR de Invitación" className="w-40 h-40 object-contain" />
                        <span className="text-[9px] font-bold text-center block text-slate-400 mt-1">
                          Escanear con la cámara del celular
                        </span>
                      </div>
                    )}

                    <div className="space-y-3 text-center sm:text-left">
                      <div>
                        <span className="text-xs text-slate-400 block mb-1">Código Portátil de Invitación (Multidispositivo):</span>
                        <div className="inline-block px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-500 font-mono font-bold text-sm sm:text-base text-indigo-700 dark:text-indigo-400 tracking-wider shadow-xs break-all">
                          {getFullPortableInviteCode(generatedInvitation.code)}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Código corto local: <strong className="font-mono">{generatedInvitation.code}</strong>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedInvitation.code, generatedInvitation.role as TheocraticRole)}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedCode ? '¡Copiado!' : 'Copiar Invitación'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(generatedInvitation.code, generatedInvitation.role as TheocraticRole)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Enviar por WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE INVITATIONS LIST */}
          {activeTab === 'invitaciones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Invitaciones Registradas en el Sistema:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedInvitation(null);
                    setActiveTab('generar');
                  }}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold hover:bg-indigo-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Invitación</span>
                </button>
              </div>

              {invitations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No hay invitaciones registradas.
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                            {getFullPortableInviteCode(inv.code)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {THEOCRATIC_ROLES[inv.role as TheocraticRole]?.shortName || inv.role}
                          </span>
                          {inv.status === 'active' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                              Activa
                            </span>
                          )}
                          {inv.status === 'used' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                              Utilizada
                            </span>
                          )}
                          {inv.status === 'revoked' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200">
                              Revocada
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {inv.targetName ? `Destinada a: ${inv.targetName}` : 'Sin destinatario fijo'}
                          {inv.usedByEmail ? ` • Usada por: ${inv.usedByEmail}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {inv.status === 'active' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setGeneratedInvitation(inv);
                                setActiveTab('generar');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
                              title="Ver código QR para escanear"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(inv.code, inv.role as TheocraticRole)}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                              title="Copiar código portátil e invitación"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(inv.code, inv.role as TheocraticRole)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                              title="Compartir por WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => revokeInvitation(inv.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                              title="Revocar invitación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revocar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE DEVICE SESSIONS */}
          {activeTab === 'sesiones' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                  Control de Dispositivos y Cuentas Conectadas
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Si un hermano se muda de congregación o deja de servir como anciano o siervo ministerial, puedes revocar inmediatamente su sesión desde este panel.
                </p>
              </div>

              <div className="space-y-2">
                {activeSessions.map((sess) => {
                  const isRevoked = sess.status === 'revoked';
                  return (
                    <div
                      key={sess.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isRevoked
                          ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          {sess.deviceInfo.includes('Móvil') ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Laptop className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{sess.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {THEOCRATIC_ROLES[sess.role as TheocraticRole]?.shortName || sess.role}
                            </span>
                            {isRevoked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                Acceso Revocado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Conectado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {sess.email} • {sess.deviceInfo} • Activo: {sess.lastActive}
                          </p>
                        </div>
                      </div>

                      {!isRevoked && (
                        <button
                          type="button"
                          onClick={() => revokeSession(sess.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold self-end sm:self-auto cursor-pointer"
                        >
                          Revocar Acceso
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MASTER PASSPHRASE */}
          {activeTab === 'clave_maestra' && (
            <form onSubmit={handleSaveMasterPassphrase} className="space-y-4 max-w-lg">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                <span className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Cifrado de Conocimiento Cero (Zero-Knowledge E2EE)
                </span>
                <p className="text-amber-900/80 dark:text-amber-300/80">
                  La Clave Maestra es una contraseña secreta compartida únicamente entre los ancianos. Si la activas, todos los datos en la nube se cifran con AES-256 y nadie sin esta clave podrá leerlos.
                </p>
              </div>

              {masterPassFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 font-semibold">
                  {masterPassFeedback}
                </div>
              )}

              {masterPassError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 font-semibold">
                  {masterPassError}
                </div>
              )}

              {isMasterPassphraseSet && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clave Maestra Actual:
                  </label>
                  <input
                    type="password"
                    value={currentMasterPass}
                    onChange={(e) => setCurrentMasterPass(e.target.value)}
                    placeholder="Introduce la clave maestra actual"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Clave Maestra de Congregación:
                </label>
                <input
                  type="password"
                  value={newMasterPass}
                  onChange={(e) => setNewMasterPass(e.target.value)}
                  placeholder={isMasterPassphraseSet ? 'Dejar en blanco para desactivar' : 'Mínimo 8 caracteres'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {newMasterPass && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar Nueva Clave Maestra:
                  </label>
                  <input
                    type="password"
                    value={confirmMasterPass}
                    onChange={(e) => setConfirmMasterPass(e.target.value)}
                    placeholder="Repite la nueva clave"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                >
                  {isMasterPassphraseSet && !newMasterPass ? 'Desactivar Clave Maestra' : 'Guardar Clave Maestra'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
