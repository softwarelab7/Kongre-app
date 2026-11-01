import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  ShieldAlert,
  KeyRound,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useToast } from '../context/ToastContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { CredentialRevocationModal, CredentialRevocationTarget } from './CredentialRevocationModal';
import { CredentialRevocationReasonId } from '../types';

export const ElderCodeRedemptionsPanel: React.FC = () => {
  const {
    credentialRedemptions,
    revocationHistory,
    revokeAndReplacePublisherCredential,
    recordCredentialRedemption,
  } = useSecurity();

  const {
    effectiveRoleInfo,
    currentBrotherName,
    publisherPinsList,
    assignPersonalPinToPublisher,
    generateUniquePublisherPin,
  } = useAuth();

  const { publishers, updatePublisher } = useCongregation();
  const { showToast } = useToast();

  const [searchPerson, setSearchPerson] = useState('');
  const [elderFilter, setElderFilter] = useState<'all' | 'redeemed' | 'revoked_history'>('all');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [revocationTarget, setRevocationTarget] = useState<CredentialRevocationTarget | null>(null);

  const formatDayAndHour = (isoOrText?: string) => {
    if (!isoOrText) return { day: 'Hoy', hour: 'Reciente' };
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) {
      return { day: isoOrText, hour: '' };
    }
    const day = d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const hour = d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { day, hour };
  };

  const getDeviceIcon = (deviceType?: 'mobile' | 'tablet' | 'desktop', deviceInfo?: string) => {
    if (deviceType === 'mobile') return Smartphone;
    if (deviceType === 'tablet') return Tablet;
    if (deviceType === 'desktop') return Laptop;
    const info = (deviceInfo || '').toLowerCase();
    if (info.includes('ipad') || info.includes('tablet')) return Tablet;
    if (info.includes('iphone') || info.includes('android') || info.includes('móvil') || info.includes('mobile')) {
      return Smartphone;
    }
    return Laptop;
  };

  const elderPublisherRecords = useMemo(() => {
    return publishers.map((pub) => {
      const pinRec = publisherPinsList.find(
        (r) =>
          r.publisherId === pub.id ||
          r.name.toLowerCase().trim() === pub.name.toLowerCase().trim()
      );
      const effectivePin = pub.personalPin || pinRec?.pin || '';
      const effectiveRole =
        pub.theocraticRole ||
        pinRec?.role ||
        (pub.privilege === 'anciano' ? 'anciano' : 'publico');

      const activeRedemption = credentialRedemptions.find(
        (red) =>
          red.status === 'active' &&
          (red.publisherId === pub.id ||
            red.publisherName.toLowerCase().trim() === pub.name.toLowerCase().trim())
      );

      const personRevocations = revocationHistory.filter(
        (rev) =>
          rev.publisherId === pub.id ||
          rev.publisherName.toLowerCase().trim() === pub.name.toLowerCase().trim()
      );

      return {
        publisher: pub,
        pin: effectivePin,
        role: effectiveRole,
        activeRedemption,
        personRevocations,
      };
    });
  }, [publishers, publisherPinsList, credentialRedemptions, revocationHistory]);

  const filteredElderRecords = useMemo(() => {
    return elderPublisherRecords.filter((item) => {
      const q = searchPerson.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.publisher.name.toLowerCase().includes(q) ||
        (item.activeRedemption?.deviceInfo || '').toLowerCase().includes(q) ||
        (item.pin && item.pin.includes(q));

      if (!matchesSearch) return false;
      if (elderFilter === 'redeemed') return Boolean(item.activeRedemption);
      if (elderFilter === 'revoked_history') return item.personRevocations.length > 0;
      return true;
    });
  }, [elderPublisherRecords, searchPerson, elderFilter]);

  const handleConfirmRevokeAndReplace = (params: {
    publisherId: string;
    publisherName: string;
    role: string;
    oldPinOrCode?: string;
    newPinOrCode: string;
    reasonId: CredentialRevocationReasonId;
    reasonDetails: string;
  }) => {
    const elderName = currentBrotherName || effectiveRoleInfo.name || 'Anciano';

    revokeAndReplacePublisherCredential({
      publisherId: params.publisherId,
      publisherName: params.publisherName,
      role: params.role,
      oldPinOrCode: params.oldPinOrCode,
      newPinOrCode: params.newPinOrCode,
      reasonId: params.reasonId,
      reasonDetails: params.reasonDetails,
      revokedBy: elderName,
    });

    const targetPub = publishers.find((p) => p.id === params.publisherId);
    assignPersonalPinToPublisher(
      params.publisherId,
      params.newPinOrCode,
      params.role as TheocraticRole,
      params.publisherName,
      targetPub?.email,
      targetPub?.privilege
    );

    if (targetPub) {
      updatePublisher({
        ...targetPub,
        personalPin: params.newPinOrCode,
      });
    }

    showToast(
      `Código anterior revocado y nuevo PIN (${params.newPinOrCode}) asignado a ${params.publisherName}`,
      'success'
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Gestión y Revocación de Códigos de Acceso por Publicador
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-800">
              Control de Ancianos
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Si un hermano necesita cambiar su código (lo olvidó, perdió el teléfono, alguien más lo sabe, etc.), llena el formulario especificando la razón para que el código anterior quede revocado. Por privacidad, el historial de dispositivos y ubicaciones solo es visible para cada publicador en su perfil personal.
          </p>
        </div>

        {/* Search & Quick Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPerson}
              onChange={(e) => setSearchPerson(e.target.value)}
              placeholder="Buscar hermano o dispositivo..."
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'all' as const, label: 'Todos' },
              { id: 'redeemed' as const, label: 'Canjeados' },
              { id: 'revoked_history' as const, label: `Revocados (${revocationHistory.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setElderFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  elderFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List of Brothers with Redemption Device, Day, Hour & Change/Revoke Button */}
      <div className="space-y-3">
        {filteredElderRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <KeyRound className="w-7 h-7 mx-auto opacity-40 text-amber-500" />
            <p className="text-xs font-bold">No se encontraron registros con ese filtro</p>
          </div>
        ) : (
          filteredElderRecords.map(({ publisher: pub, pin, role, activeRedemption, personRevocations }) => {
            const isRevealed = Boolean(revealedPins[pub.id]);
            const roleLabel = THEOCRATIC_ROLES[role as TheocraticRole]?.name || role;
            const RedDeviceIcon = getDeviceIcon(
              activeRedemption?.deviceType,
              activeRedemption?.deviceInfo
            );
            const redeemedTime = activeRedemption
              ? formatDayAndHour(activeRedemption.redeemedAt)
              : null;

            return (
              <div
                key={pub.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col gap-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Person Identity + Role + Current PIN */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-extrabold text-xs text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                      {pub.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                          {pub.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
                          {roleLabel}
                        </span>
                        {pin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            <KeyRound className="w-3 h-3 text-amber-500" />
                            <span>{isRevealed ? pin : `••${pin.slice(-2)}`}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedPins((prev) => ({ ...prev, [pub.id]: !prev[pub.id] }))
                              }
                              className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title={isRevealed ? 'Ocultar código' : 'Mostrar código'}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            Sin código asignado
                          </span>
                        )}
                      </div>

                      {/* Middle info: Privacy-preserving redemption status */}
                      {activeRedemption && redeemedTime ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            <span>Código activo · Dispositivos privados (solo visibles para el publicador)</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Activado: <strong>{redeemedTime.day}</strong></span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                          <span>Dispositivos e historial de conexión privados del publicador</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button to Change & Revoke with Mandatory Reason Form */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() =>
                        setRevocationTarget({
                          publisherId: pub.id,
                          publisherName: pub.name,
                          role,
                          currentPinOrCode: pin || activeRedemption?.codeMasked,
                          redeemedDeviceInfo: activeRedemption?.deviceInfo,
                          redeemedDeviceType: activeRedemption?.deviceType,
                          redeemedAt: activeRedemption?.redeemedAt,
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{pin ? 'Cambiar / Revocar Código' : 'Asignar Código'}</span>
                    </button>
                  </div>
                </div>

                {/* Historical Revocations for this specific Brother */}
                {personRevocations.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Códigos anteriores revocados de {pub.name} ({personRevocations.length}):</span>
                    </span>
                    <div className="space-y-1.5">
                      {personRevocations.map((rev) => {
                        const revDt = formatDayAndHour(rev.revokedAt);
                        return (
                          <div
                            key={rev.id}
                            className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[9.5px] uppercase">
                                  Revocado
                               </span>
                                <span className="font-mono line-through text-rose-700 dark:text-rose-300 font-bold">
                                  Código ant.: {rev.previousCodeMasked}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                  → Nuevo: <strong className="font-mono">{rev.newCodeMasked}</strong>
                                </span>
                                <span className="font-bold text-rose-900 dark:text-rose-200">
                                  · Razón: {rev.reasonLabel}
                                </span>
                              </div>
                              {rev.reasonDetails && (
                                <p className="text-slate-600 dark:text-slate-400 italic">
                                  “{rev.reasonDetails}”
                                </p>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0">
                              <div>{revDt.day} · {revDt.hour}</div>
                              <div>Por: {rev.revokedBy}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Formulario Obligatorio de Razón de Cambio y Revocación */}
      <CredentialRevocationModal
        isOpen={Boolean(revocationTarget)}
        onClose={() => setRevocationTarget(null)}
        target={revocationTarget}
        onGenerateRandomPin={generateUniquePublisherPin}
        onConfirmRevokeAndReplace={handleConfirmRevokeAndReplace}
      />
    </div>
  );
};
