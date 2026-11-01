import React, { useMemo, useState } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  History,
  Clock,
  Calendar,
  LogOut,
  CheckCircle2,
  MapPin,
  Cpu,
  Copy,
  Check,
  Navigation,
  ShieldCheck,
  Lock,
  EyeOff,
  KeyRound,
  Globe,
  Monitor,
  Wifi,
} from 'lucide-react';
import {
  useSecurity,
  detectBrowserDeviceDetails,
  formatDeviceHardwareId,
  detectApproximateLocation,
} from '../context/SecurityContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PinManagementModal } from './PinManagementModal';

interface ProfileDevicesAndCodesSectionProps {
  /** Optional publisher ID when rendered inside PersonalViewTab */
  targetPublisherId?: string;
  /** Optional publisher name when rendered inside PersonalViewTab */
  targetPublisherName?: string;
  /** Whether an elder/supervisor is currently previewing another publisher's portal */
  isSupervisorPreviewingOther?: boolean;
}

export function extractPlatformAndBrowser(session: {
  osName?: string;
  browserName?: string;
  deviceInfo?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}) {
  const rawInfo = session.deviceInfo || 'Escritorio · Navegador Web';
  const parts = rawInfo.split('·').map((s) => s.trim());

  const platform =
    session.osName && session.osName.trim() !== ''
      ? session.osName.trim()
      : parts[0] || 'Sistema Operativo';

  const browser =
    session.browserName && session.browserName.trim() !== ''
      ? session.browserName.trim()
      : parts[1] || 'Navegador Web';

  const deviceTypeLabel =
    session.deviceType === 'mobile'
      ? 'Teléfono Móvil'
      : session.deviceType === 'tablet'
      ? 'Tableta'
      : 'Computadora / Escritorio';

  return {
    platform,
    browser,
    deviceTypeLabel,
  };
}

export const ProfileDevicesAndCodesSection: React.FC<ProfileDevicesAndCodesSectionProps> = ({
  targetPublisherId,
  targetPublisherName,
  isSupervisorPreviewingOther = false,
}) => {
  const {
    activeSessions,
    currentDeviceId,
    revokeSession,
    revokeAllOtherSessions,
    updateCurrentDeviceLocation,
  } = useSecurity();

  const {
    effectiveRoleInfo,
    currentBrotherName,
    currentPublisherId,
  } = useAuth();

  const { showToast } = useToast();

  const [copiedDeviceId, setCopiedDeviceId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [confirmingRemoteSessionId, setConfirmingRemoteSessionId] = useState<string | null>(null);

  const currentDeviceMeta = useMemo(() => detectBrowserDeviceDetails(), []);
  const defaultApproxLocation = useMemo(() => detectApproximateLocation(), []);

  // Determine if someone (like an elder in supervisor mode) is viewing another publisher's profile
  const isViewingOtherPublisher = useMemo(() => {
    if (isSupervisorPreviewingOther) return true;
    if (
      targetPublisherId &&
      currentPublisherId &&
      targetPublisherId.trim() !== '' &&
      currentPublisherId.trim() !== '' &&
      targetPublisherId !== currentPublisherId
    ) {
      return true;
    }
    if (
      targetPublisherName &&
      currentBrotherName &&
      targetPublisherName.trim() !== '' &&
      currentBrotherName.trim() !== '' &&
      targetPublisherName.toLowerCase().trim() !== currentBrotherName.toLowerCase().trim()
    ) {
      return true;
    }
    return false;
  }, [
    isSupervisorPreviewingOther,
    targetPublisherId,
    currentPublisherId,
    targetPublisherName,
    currentBrotherName,
  ]);

  // Filter sessions so they belong strictly to the current logged-in publisher
  const mySessions = useMemo(() => {
    if (isViewingOtherPublisher) return [];
    const myName = (targetPublisherName || currentBrotherName || '').toLowerCase().trim();
    const myPubId = (targetPublisherId || currentPublisherId || '').trim();

    return activeSessions.filter((s) => {
      if (s.id === currentDeviceId || s.isCurrentDevice) return true;
      if (s.publisherId === 'pub-1') return true;
      if (myPubId && s.publisherId && s.publisherId === myPubId) return true;
      if (myName && s.name && s.name.toLowerCase().trim() === myName) return true;
      return false;
    });
  }, [
    activeSessions,
    currentDeviceId,
    currentBrotherName,
    currentPublisherId,
    targetPublisherId,
    targetPublisherName,
    isViewingOtherPublisher,
  ]);

  const currentSession = useMemo(() => {
    const found = mySessions.find(
      (s) => s.status === 'active' && (s.id === currentDeviceId || s.isCurrentDevice)
    );
    if (found) {
      return {
        ...found,
        deviceId: found.deviceId || formatDeviceHardwareId(found.id || currentDeviceId),
        approxLocation: found.approxLocation || defaultApproxLocation,
      };
    }
    return {
      id: currentDeviceId,
      deviceId: formatDeviceHardwareId(currentDeviceId),
      name: targetPublisherName || currentBrotherName || 'Mi Sesión',
      email: 'sesion.actual@kongre.org',
      role: effectiveRoleInfo.id,
      deviceInfo: currentDeviceMeta.deviceInfo,
      deviceType: currentDeviceMeta.deviceType,
      osName: currentDeviceMeta.osName,
      browserName: currentDeviceMeta.browserName,
      startedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      approxLocation: defaultApproxLocation,
      ipPlaceholder: 'Este dispositivo · Activo ahora',
      isCurrentDevice: true,
      status: 'active' as const,
    };
  }, [
    mySessions,
    currentDeviceId,
    targetPublisherName,
    currentBrotherName,
    effectiveRoleInfo.id,
    currentDeviceMeta,
    defaultApproxLocation,
  ]);

  const otherOpenSessions = useMemo(() => {
    return mySessions
      .filter((s) => s.status === 'active' && s.id !== currentSession.id && !s.isCurrentDevice)
      .map((s) => ({
        ...s,
        deviceId: s.deviceId || formatDeviceHardwareId(s.id),
        approxLocation: s.approxLocation || s.ipPlaceholder || defaultApproxLocation,
      }));
  }, [mySessions, currentSession.id, defaultApproxLocation]);

  // All currently active sessions (current device first, then remote active sessions)
  const allActiveSessions = useMemo(() => {
    return [currentSession, ...otherOpenSessions];
  }, [currentSession, otherOpenSessions]);

  // Complete list of all successful connections for the Device History log
  const allSuccessfulConnections = useMemo(() => {
    const normalized = mySessions.map((s) => ({
      ...s,
      deviceId: s.deviceId || formatDeviceHardwareId(s.id),
      approxLocation: s.approxLocation || s.ipPlaceholder || defaultApproxLocation,
    }));

    const hasCurrent = normalized.some((s) => s.id === currentSession.id || s.isCurrentDevice);
    const list = hasCurrent ? normalized : [currentSession, ...normalized];

    return list.sort((a, b) => {
      if (a.isCurrentDevice) return -1;
      if (b.isCurrentDevice) return 1;
      const dateA = new Date(a.startedAt || a.lastActive || 0).getTime();
      const dateB = new Date(b.startedAt || b.lastActive || 0).getTime();
      return dateB - dateA;
    });
  }, [mySessions, currentSession, defaultApproxLocation]);

  const filteredConnections = useMemo(() => {
    if (historyFilter === 'active') {
      return allSuccessfulConnections.filter((c) => c.status === 'active');
    }
    if (historyFilter === 'revoked') {
      return allSuccessfulConnections.filter((c) => c.status === 'revoked');
    }
    return allSuccessfulConnections;
  }, [allSuccessfulConnections, historyFilter]);

  // Privacy guard: If an elder or supervisor is viewing another publisher, block visibility of their devices & location
  if (isViewingOtherPublisher) {
    return (
      <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm">
        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Historial de Dispositivos Privado del Publicador</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Protegido por Privacidad
              </span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
              Por privacidad, las sesiones activas, el navegador, la plataforma, el ID de cada equipo y la ubicación geográfica aproximada son visibles <strong>únicamente para cada publicador</strong> desde su propia sesión personal y no están disponibles para consulta por parte de los ancianos ni de otros usuarios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDayAndHour = (isoOrText?: string) => {
    if (!isoOrText) return { day: 'Hoy', hour: 'Reciente', full: 'Hoy · Reciente' };
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) {
      return { day: isoOrText, hour: '', full: isoOrText };
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
    return { day, hour, full: `${day}, ${hour}` };
  };

  const getDeviceIcon = (deviceType?: 'mobile' | 'tablet' | 'desktop', deviceInfo?: string) => {
    if (deviceType === 'mobile') return Smartphone;
    if (deviceType === 'tablet') return Tablet;
    if (deviceType === 'desktop') return Laptop;
    const info = (deviceInfo || '').toLowerCase();
    if (info.includes('ipad') || info.includes('tablet')) return Tablet;
    if (
      info.includes('iphone') ||
      info.includes('android') ||
      info.includes('móvil') ||
      info.includes('mobile')
    ) {
      return Smartphone;
    }
    return Laptop;
  };

  const handleCopyDeviceId = (devId: string) => {
    try {
      navigator.clipboard.writeText(devId);
      setCopiedDeviceId(devId);
      showToast(`ID de dispositivo copiado: ${devId}`, 'info');
      setTimeout(() => setCopiedDeviceId(null), 2000);
    } catch {}
  };

  const handleRemoteLogoutSession = (session: typeof currentSession) => {
    const { browser, platform } = extractPlatformAndBrowser(session);
    revokeSession(
      session.id,
      `Sesión cerrada remotamente (${browser} en ${platform})`,
      currentBrotherName || 'Usuario'
    );
    setConfirmingRemoteSessionId(null);
    showToast(`Sesión remota cerrada en ${browser} (${platform})`, 'info');
  };

  const handleRefineCurrentLocation = () => {
    const baseTzLoc = detectApproximateLocation();
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      updateCurrentDeviceLocation(baseTzLoc);
      showToast(`Ubicación aproximada registrada: ${baseTzLoc}`, 'info');
      return;
    }

    setIsDetectingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGeo(false);
        const lat = pos.coords.latitude.toFixed(2);
        const lon = pos.coords.longitude.toFixed(2);
        const tzPart = baseTzLoc.split('(')[0].trim();
        const updatedLabel = `${tzPart} (${lat}°, ${lon}°)`;
        updateCurrentDeviceLocation(updatedLabel);
        showToast('Ubicación geográfica aproximada actualizada con éxito', 'success');
      },
      () => {
        setIsDetectingGeo(false);
        updateCurrentDeviceLocation(baseTzLoc);
        showToast(`Ubicación aproximada por zona horaria: ${baseTzLoc}`, 'info');
      },
      { timeout: 6000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SECCIÓN DE SESIONES ACTIVAS (NAVEGADORES Y PLATAFORMAS)                */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-[#27272A]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Sesiones Activas por Navegador y Plataforma ({allActiveSessions.length})
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                <Lock className="w-3 h-3" />
                <span>Control Remoto Personal</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Revisa qué navegadores web y sistemas operativos tienen tu sesión iniciada actualmente y cierra sesión de forma remota en cualquier equipo que no reconozcas o ya no utilices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleRefineCurrentLocation}
              disabled={isDetectingGeo}
              className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              title="Actualizar la ubicación geográfica aproximada de este dispositivo"
            >
              <Navigation
                className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${
                  isDetectingGeo ? 'animate-spin' : ''
                }`}
              />
              <span>{isDetectingGeo ? 'Detectando...' : 'Actualizar ubicación'}</span>
            </button>

            {otherOpenSessions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  revokeAllOtherSessions(currentBrotherName || 'Usuario');
                  showToast(
                    'Se cerraron remotamente todas las sesiones en tus demás navegadores y dispositivos',
                    'info'
                  );
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar todas las sesiones remotas ({otherOpenSessions.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid of Active Sessions Cards (Browser + Platform + Remote Logout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allActiveSessions.map((sess) => {
            const isCurrent = sess.id === currentSession.id || sess.isCurrentDevice;
            const DevIcon = getDeviceIcon(sess.deviceType, sess.deviceInfo);
            const { platform, browser, deviceTypeLabel } = extractPlatformAndBrowser(sess);
            const loginTime = formatDayAndHour(sess.startedAt || sess.lastActive);
            const lastActiveTime = formatDayAndHour(sess.lastActive);
            const devHardwareId = sess.deviceId || formatDeviceHardwareId(sess.id);
            const approxLoc = sess.approxLocation || sess.ipPlaceholder || defaultApproxLocation;
            const isConfirming = confirmingRemoteSessionId === sess.id;

            return (
              <div
                key={sess.id}
                className={`rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/70 shadow-xs'
                    : 'bg-zinc-50/70 dark:bg-[#18181F]/80 border-zinc-200/90 dark:border-[#27272A] hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Device Icon + Title + Active Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        <DevIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
                          {browser} en {platform}
                        </h4>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] block truncate">
                          {deviceTypeLabel} · ID: <span className="font-mono">{devHardwareId}</span>
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Este dispositivo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Sesión activa</span>
                      </span>
                    )}
                  </div>

                  {/* Browser & Platform Highlight Pills */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A]">
                          Navegador
                        </span>
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white truncate block">
                          {browser}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A]">
                          Plataforma / SO
                        </span>
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white truncate block">
                          {platform}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Session Details Box (Location, Login Date, Last Activity) */}
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#121216]/80 border border-zinc-200/70 dark:border-[#27272A] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 dark:text-[#A1A1AA] inline-flex items-center gap-1.5 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Ubicación aprox.:</span>
                      </span>
                      <span
                        className="font-bold text-zinc-900 dark:text-white truncate text-right"
                        title={approxLoc}
                      >
                        {approxLoc}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 dark:text-[#A1A1AA] inline-flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Inicio de sesión:</span>
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-[#E4E4E7]">
                        {loginTime.day} · {loginTime.hour || 'Reciente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 dark:text-[#A1A1AA] inline-flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Última actividad:</span>
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-[#E4E4E7]">
                        {isCurrent
                          ? 'Activo ahora mismo'
                          : `${lastActiveTime.day} · ${lastActiveTime.hour}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Remote Logout Action or Current Session Badge */}
                <div className="pt-3 border-t border-zinc-200/70 dark:border-[#27272A] flex items-center justify-between gap-2">
                  {isCurrent ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Sesión actual verificada</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyDeviceId(devHardwareId)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121216] hover:bg-zinc-100 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedDeviceId === devHardwareId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>ID Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Copiar ID</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : isConfirming ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        ¿Cerrar sesión en {browser}?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmingRemoteSessionId(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-200/80 dark:bg-[#27272A] text-zinc-700 dark:text-[#D4D4D8] text-[11px] font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoteLogoutSession(sess)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Confirmar cierre</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPinModalOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        ¿No reconoces este equipo?
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoteLogoutSession(sess)}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121216] hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar sesión remota</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HISTORIAL COMPLETO DE DISPOSITIVOS Y REGISTRO DE CONEXIONES            */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#121216] p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-[#27272A]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Historial de Dispositivos y Conexiones Registradas
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                <Lock className="w-3 h-3" />
                <span>Privado · Solo visible para ti</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Registro cronológico con el ID del dispositivo, navegador, plataforma, fecha de inicio de sesión y ubicación geográfica aproximada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Solicitar un cambio de PIN a los ancianos (por pérdida de dispositivo, olvido o sospecha de acceso)"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Solicitar Cambio de PIN</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                ID de Este Dispositivo
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white truncate block">
                {currentSession.deviceId}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Ubicación Aproximada Actual
              </span>
              <span
                className="text-xs font-extrabold text-zinc-900 dark:text-white truncate block"
                title={currentSession.approxLocation}
              >
                {currentSession.approxLocation}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                Mis Conexiones Registradas
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white block">
                {allSuccessfulConnections.length} conexiones ({allActiveSessions.length} activas)
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs for Connection History */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Registro Personal de Conexiones Exitosas ({filteredConnections.length})</span>
          </span>

          <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] self-start sm:self-auto">
            {[
              { id: 'all' as const, label: `Todas (${allSuccessfulConnections.length})` },
              { id: 'active' as const, label: `Activas (${allActiveSessions.length})` },
              {
                id: 'revoked' as const,
                label: `Cerradas (${
                  allSuccessfulConnections.filter((c) => c.status === 'revoked').length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHistoryFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  historyFilter === tab.id
                    ? 'bg-white dark:bg-[#27272A] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Connection History Cards / Rows */}
        <div className="space-y-3">
          {filteredConnections.map((conn) => {
            const DevIcon = getDeviceIcon(conn.deviceType, conn.deviceInfo);
            const isCurrent = conn.id === currentSession.id || conn.isCurrentDevice;
            const isActive = conn.status === 'active';
            const loginDate = formatDayAndHour(conn.startedAt || conn.lastActive);
            const lastSeenDate = formatDayAndHour(conn.lastActive);
            const devHardwareId = conn.deviceId || formatDeviceHardwareId(conn.id);
            const approxLoc = conn.approxLocation || conn.ipPlaceholder || defaultApproxLocation;
            const { platform, browser } = extractPlatformAndBrowser(conn);

            return (
              <div
                key={conn.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/90 dark:border-emerald-800/60'
                    : isActive
                    ? 'bg-zinc-50/70 dark:bg-[#18181F]/70 border-zinc-200/90 dark:border-[#27272A]'
                    : 'bg-zinc-50/40 dark:bg-[#18181F]/35 border-zinc-200/60 dark:border-[#27272A]/60 opacity-90'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Device Identity + Status */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                          : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      <DevIcon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                          {browser} · {platform}
                        </span>

                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Este dispositivo · Conexión actual
                          </span>
                        ) : isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Sesión abierta · Conexión exitosa
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                            Sesión cerrada · Finalizada
                          </span>
                        )}
                      </div>

                      {/* 3 Required Pillar Badges: ID del dispositivo, Fecha de inicio de sesión, Ubicación geográfica aproximada */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                        {/* 1. ID del Dispositivo */}
                        <div className="px-3 py-2 rounded-xl bg-white/90 dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A]">
                              ID del Dispositivo
                            </span>
                            <span className="font-mono text-xs font-extrabold text-zinc-800 dark:text-[#E4E4E7] truncate block">
                              {devHardwareId}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyDeviceId(devHardwareId)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                            title="Copiar ID del dispositivo"
                          >
                            {copiedDeviceId === devHardwareId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* 2. Fecha de Inicio de Sesión */}
                        <div className="px-3 py-2 rounded-xl bg-white/90 dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A]">
                              Fecha de Inicio de Sesión
                            </span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] truncate block">
                              {loginDate.day} · {loginDate.hour || 'Reciente'}
                            </span>
                          </div>
                        </div>

                        {/* 3. Ubicación Geográfica Aproximada */}
                        <div className="px-3 py-2 rounded-xl bg-white/90 dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#71717A]">
                              Ubicación Geográfica Aprox.
                            </span>
                            <span
                              className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] truncate block"
                              title={approxLoc}
                            >
                              {approxLoc}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional contextual info (Last active or revocation reason) */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>
                            Última actividad:{' '}
                            <strong>
                              {isCurrent ? 'Ahora mismo' : `${lastSeenDate.day} ${lastSeenDate.hour}`}
                            </strong>
                          </span>
                        </span>
                        {conn.status === 'revoked' && conn.revokedReasonLabel && (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            · Motivo de cierre: {conn.revokedReasonLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action button for other active sessions */}
                  {!isCurrent && isActive && (
                    <button
                      type="button"
                      onClick={() => handleRemoteLogoutSession(conn)}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121216] hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-end lg:self-center cursor-pointer shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar sesión remota</span>
                    </button>
                  )}

                  {isCurrent && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0 self-end lg:self-center">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verificado</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <PinManagementModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          publisherId={targetPublisherId || currentPublisherId || 'publicador'}
          publisherName={targetPublisherName || currentBrotherName || 'Publicador'}
          role={effectiveRoleInfo?.id}
        />
      </div>
    </div>
  );
};
