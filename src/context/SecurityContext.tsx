import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  hashPasscode,
  verifyPasscode,
  generateSecureInvitationCode,
  encryptPinAtRest,
  decryptPinAtRest,
  hashInvitationCode,
  verifyInvitationCodeMatch,
  getPinLockoutRemainingSeconds,
  recordFailedPinAttempt,
  resetFailedPinAttempts,
} from '../utils/theocraticSecurity';
import { TheocraticRole } from '../utils/rbac';
import { CongregationInvitation, ActiveDeviceSession } from '../types';
import { insertAuditLog } from '../services/auditLogService';

interface SecurityContextType {
  isLocked: boolean;
  isPinEnabled: boolean;
  isPersonalPinSet: boolean;
  autoLockMinutes: number;
  privacyModeEnabled: boolean;
  isMasterPassphraseSet: boolean;
  congregationPinHash: string | null;
  isCongregationPinSet: boolean;
  invitations: CongregationInvitation[];
  activeSessions: ActiveDeviceSession[];
  lockSession: () => void;
  unlockSession: (pin: string) => Promise<boolean>;
  setPasscodePin: (newPin: string | null) => Promise<void>;
  setPersonalPin: (newPin: string | null) => Promise<void>;
  verifyPersonalPin: (pin: string) => Promise<boolean>;
  setCongregationPin: (newPin: string | null) => Promise<void>;
  verifyCongregationPin: (pin: string) => Promise<boolean>;
  setAutoLockMinutes: (mins: number) => void;
  setPrivacyModeEnabled: (val: boolean) => void;
  verifyCurrentPin: (pin: string) => Promise<boolean>;
  setMasterPassphrase: (passphrase: string | null) => Promise<void>;
  verifyMasterPassphrase: (passphrase: string) => Promise<boolean>;
  createInvitation: (role: TheocraticRole, targetName?: string, expiresInDays?: number) => Promise<CongregationInvitation>;
  revokeInvitation: (id: string) => void;
  redeemInvitationCode: (code: string, userEmail?: string, userName?: string, externalInvitations?: CongregationInvitation[]) => Promise<{ success: boolean; role?: TheocraticRole; message: string; targetName?: string }>;
  revokeSession: (sessionId: string) => void;
  // Reloj de Bloqueo Automático por Inactividad
  remainingSeconds: number;
  totalSeconds: number;
  autoLockFraction: number;
  autoLockState: 'ok' | 'warn' | 'crit';
  isAutoLockActive: boolean;
  isRefilling: boolean;
  resetInactivityTimer: () => void;
}

const PIN_STORAGE_KEY = 'kongre_security_pin_hash';
const CONGREGATION_PIN_STORAGE_KEY = 'kongre_security_congregation_pin_hash';
const AUTOLOCK_STORAGE_KEY = 'kongre_security_autolock_minutes';
const PRIVACY_STORAGE_KEY = 'kongre_security_privacy_mode';
const MASTER_KEY_STORAGE = 'kongre_security_master_key_hash';
const INVITATIONS_STORAGE_KEY = 'kongre_theocratic_invitations_v1';
const SESSIONS_STORAGE_KEY = 'kongre_device_sessions_v1';

// Initial invitations and sessions for fresh congregation
const DEFAULT_INITIAL_INVITATIONS: CongregationInvitation[] = [];
const DEFAULT_INITIAL_SESSIONS: ActiveDeviceSession[] = [];

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pinHash, setPinHash] = useState<string | null>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY);
  });

  const [congregationPinHash, setCongregationPinHash] = useState<string | null>(() => {
    return localStorage.getItem(CONGREGATION_PIN_STORAGE_KEY);
  });

  const [masterPassphraseHash, setMasterPassphraseHash] = useState<string | null>(() => {
    return localStorage.getItem(MASTER_KEY_STORAGE);
  });

  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(() => {
    const saved = localStorage.getItem(AUTOLOCK_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 5; // default 5 minutes
  });

  const [privacyModeEnabled, setPrivacyModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(PRIVACY_STORAGE_KEY);
    return saved === 'true';
  });

  const [invitations, setInvitations] = useState<CongregationInvitation[]>(() => {
    try {
      const saved = localStorage.getItem(INVITATIONS_STORAGE_KEY);
      if (saved) {
        const rawJson = saved.startsWith('kgr_v1:') ? decryptPinAtRest(saved) : saved;
        const parsed = JSON.parse(rawJson || '[]');
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((inv: CongregationInvitation) => ({
            ...inv,
            codeHash: inv.codeHash || (inv.code && !inv.code.includes('••••') ? hashInvitationCode(inv.code) : undefined),
          }));
          if (!saved.startsWith('kgr_v1:')) {
            localStorage.setItem(INVITATIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(normalized)));
          }
          return normalized;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_INVITATIONS;
  });

  const [activeSessions, setActiveSessions] = useState<ActiveDeviceSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const rawJson = saved.startsWith('kgr_v1:') ? decryptPinAtRest(saved) : saved;
        const parsed = JSON.parse(rawJson || '[]');
        if (Array.isArray(parsed)) {
          if (!saved.startsWith('kgr_v1:')) {
            localStorage.setItem(SESSIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(parsed)));
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_SESSIONS;
  });

  // Sync invitations to localStorage (encrypted at rest) and listen for cloud updates
  useEffect(() => {
    try {
      localStorage.setItem(INVITATIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(invitations)));
    } catch {}
  }, [invitations]);

  useEffect(() => {
    const handleInvitationsSynced = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (Array.isArray(detail)) {
          setInvitations((prev) => {
            // Preserve local plaintext code if local device created the invitation and remote public payload masked it
            const localMap = new Map(prev.map((i) => [i.id, i]));
            return detail.map((remoteInv: CongregationInvitation) => {
              const localInv = localMap.get(remoteInv.id);
              const effectiveCode =
                remoteInv.code && !remoteInv.code.includes('••••')
                  ? remoteInv.code
                  : localInv?.code || remoteInv.code || '';
              return {
                ...remoteInv,
                code: effectiveCode,
                codeHash:
                  remoteInv.codeHash ||
                  localInv?.codeHash ||
                  (effectiveCode && !effectiveCode.includes('••••') ? hashInvitationCode(effectiveCode) : undefined),
              };
            });
          });
        }
      } catch {}
    };
    window.addEventListener('kongre_invitations_updated', handleInvitationsSynced);
    return () => window.removeEventListener('kongre_invitations_updated', handleInvitationsSynced);
  }, []);

  // Sync sessions to localStorage (encrypted at rest)
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(activeSessions)));
    } catch {}
  }, [activeSessions]);

  // Helper to check if demo mode is active
  const isDemoSession = (): boolean => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('kongre_demo_mode') === 'true' ||
      localStorage.getItem('kongre_congregation_number')?.includes('DEMO') === true ||
      localStorage.getItem('kongre_congregation_id')?.includes('DEMO') === true
    );
  };

  // Start unlocked unless a PIN is configured and was previously locked in this session (and not demo mode)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isDemo =
        localStorage.getItem('kongre_demo_mode') === 'true' ||
        localStorage.getItem('kongre_congregation_number')?.includes('DEMO') ||
        localStorage.getItem('kongre_congregation_id')?.includes('DEMO');
      if (isDemo) {
        sessionStorage.removeItem('kongre_session_locked');
        return false;
      }
    }
    const hadPin = !!localStorage.getItem(PIN_STORAGE_KEY);
    const wasLocked = sessionStorage.getItem('kongre_session_locked') === 'true';
    return hadPin && wasLocked;
  });

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lockSession = useCallback(() => {
    if (isDemoSession()) return;
    if (!pinHash) return;
    setIsLocked(true);
    sessionStorage.setItem('kongre_session_locked', 'true');
  }, [pinHash]);

  const unlockSession = useCallback(
    async (enteredPin: string): Promise<boolean> => {
      // Verify against user's private App Lock PIN
      if (pinHash) {
        const valid = await verifyPasscode(enteredPin, pinHash);
        if (valid) {
          setIsLocked(false);
          sessionStorage.removeItem('kongre_session_locked');
          return true;
        }
        return false;
      }

      // If no lock PIN is set, unlock
      setIsLocked(false);
      sessionStorage.removeItem('kongre_session_locked');
      return true;
    },
    [pinHash]
  );

  const verifyPersonalPin = useCallback(
    async (enteredPin: string): Promise<boolean> => {
      if (!enteredPin || !enteredPin.trim() || !pinHash) return false;
      return await verifyPasscode(enteredPin.trim(), pinHash);
    },
    [pinHash]
  );

  const verifyCurrentPin = verifyPersonalPin;

  const setPersonalPin = useCallback(async (newPin: string | null) => {
    if (!newPin || newPin.trim() === '') {
      localStorage.removeItem(PIN_STORAGE_KEY);
      sessionStorage.removeItem('kongre_session_locked');
      setPinHash(null);
      if (!congregationPinHash) {
        setIsLocked(false);
      }
    } else {
      const hashed = await hashPasscode(newPin.trim());
      localStorage.setItem(PIN_STORAGE_KEY, hashed);
      setPinHash(hashed);
    }
  }, [congregationPinHash]);

  const setPasscodePin = setPersonalPin;

  const setCongregationPin = useCallback(async (newPin: string | null) => {
    if (!newPin || newPin.trim() === '') {
      localStorage.removeItem(CONGREGATION_PIN_STORAGE_KEY);
      setCongregationPinHash(null);
    } else {
      const hashed = await hashPasscode(newPin.trim());
      localStorage.setItem(CONGREGATION_PIN_STORAGE_KEY, hashed);
      setCongregationPinHash(hashed);
    }
  }, []);

  const verifyCongregationPin = useCallback(
    async (enteredPin: string): Promise<boolean> => {
      if (!enteredPin || !enteredPin.trim() || !congregationPinHash) return false;
      return await verifyPasscode(enteredPin.trim(), congregationPinHash);
    },
    [congregationPinHash]
  );

  const setMasterPassphrase = useCallback(async (passphrase: string | null) => {
    if (!passphrase || passphrase.trim() === '') {
      localStorage.removeItem(MASTER_KEY_STORAGE);
      setMasterPassphraseHash(null);
    } else {
      const hashed = await hashPasscode(passphrase.trim());
      localStorage.setItem(MASTER_KEY_STORAGE, hashed);
      setMasterPassphraseHash(hashed);
    }
  }, []);

  const verifyMasterPassphrase = useCallback(
    async (passphrase: string): Promise<boolean> => {
      if (!passphrase || !passphrase.trim() || !masterPassphraseHash) return false;
      return await verifyPasscode(passphrase.trim(), masterPassphraseHash);
    },
    [masterPassphraseHash]
  );

  const setAutoLockMinutes = useCallback((mins: number) => {
    setAutoLockMinutesState(mins);
    localStorage.setItem(AUTOLOCK_STORAGE_KEY, mins.toString());
    if (mins > 0) {
      deadlineRef.current = Date.now() + mins * 60 * 1000;
      setRemainingSeconds(mins * 60);
    } else {
      setRemainingSeconds(0);
    }
  }, []);

  const setPrivacyModeEnabled = useCallback((val: boolean) => {
    setPrivacyModeState(val);
    localStorage.setItem(PRIVACY_STORAGE_KEY, val.toString());
  }, []);

  // Create new theocratic invitation
  const createInvitation = useCallback(
    async (role: TheocraticRole, targetName?: string, expiresInDays: number = 30): Promise<CongregationInvitation> => {
      // Role code prefix
      const rolePrefixMap: Record<TheocraticRole, string> = {
        coordinador: 'COORD',
        anciano: 'ANC',
        superintendente_vym: 'VYM',
        superintendente_servicio: 'SRV',
        secretario: 'SEC',
        siervo_discursos: 'DIS',
        siervo_territorios: 'TER',
        siervo_carritos: 'CRT',
        siervo_literatura: 'LIT',
        siervo_cuentas: 'CTA',
        superintendente_grupo: 'GRP',
        encargado_mantenimiento: 'MNT',
        encargado_audiovideo: 'AV',
        encargado_acomodadores: 'ACO',
        encargado_cartelera: 'CAR',
        publico: 'PUB',
      };

      const prefix = rolePrefixMap[role] || 'KONG';
      const code = generateSecureInvitationCode(prefix);

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);

      const newInv: CongregationInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        code,
        codeHash: hashInvitationCode(code),
        role,
        targetName: targetName?.trim() || undefined,
        createdByEmail:
          (typeof window !== 'undefined'
            ? localStorage.getItem('kongre_user_email') ||
              localStorage.getItem('kongre_coordinator_email')
            : null) || 'coordinador@kongre.org',
        createdAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        status: 'active',
      };

      setInvitations((prev) => {
        const next = [newInv, ...prev];
        try {
          localStorage.setItem(INVITATIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(next)));
          window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
        } catch {}
        return next;
      });

      insertAuditLog({
        accion: 'CREAR_INVITACION_TEOCRATICA',
        hermano_nid: newInv.createdByEmail,
        hermano_nombre: newInv.createdByEmail,
        modulo: 'auth',
        detalles: `Invitación generada para rol ${role}${targetName ? ` (${targetName.trim()})` : ''}.`,
      }).catch(() => {});

      return newInv;
    },
    []
  );

  // Revoke invitation
  const revokeInvitation = useCallback((id: string) => {
    setInvitations((prev) => {
      const target = prev.find((inv) => inv.id === id);
      const next = prev.map((inv) => (inv.id === id ? { ...inv, status: 'revoked' as const } : inv));
      try {
        localStorage.setItem(INVITATIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(next)));
        window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
      } catch {}
      if (target) {
        insertAuditLog({
          accion: 'REVOCAR_INVITACION_TEOCRATICA',
          hermano_nid: 'admin',
          modulo: 'auth',
          detalles: `Invitación revocada (rol: ${target.role}${target.targetName ? `, destinatario: ${target.targetName}` : ''}).`,
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  // Redeem invitation code
  const redeemInvitationCode = useCallback(
    async (
      code: string,
      userEmail?: string,
      userName?: string,
      externalInvitations?: CongregationInvitation[]
    ): Promise<{ success: boolean; role?: TheocraticRole; message: string; targetName?: string }> => {
      const lockoutRem = getPinLockoutRemainingSeconds();
      if (lockoutRem > 0) {
        return {
          success: false,
          message: `Por seguridad contra fuerza bruta, espera ${lockoutRem} segundos antes de volver a intentar.`,
        };
      }

      const cleanCode = code.trim().toUpperCase();
      let currentList = invitations;
      try {
        const stored = localStorage.getItem(INVITATIONS_STORAGE_KEY);
        if (stored) {
          const rawJson = stored.startsWith('kgr_v1:') ? decryptPinAtRest(stored) : stored;
          const parsed = JSON.parse(rawJson || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentList = parsed;
          }
        }
      } catch {}

      // Combinar con invitaciones remotas/externas provistas directamente (ej: desde Supabase)
      if (Array.isArray(externalInvitations) && externalInvitations.length > 0) {
        const map = new Map(currentList.map((i) => [i.id, i]));
        for (const ext of externalInvitations) {
          if (ext && ext.id) {
            const existing = map.get(ext.id);
            map.set(ext.id, {
              ...ext,
              code: (ext.code && !ext.code.includes('••••')) ? ext.code : (existing?.code || ext.code || ''),
              codeHash: ext.codeHash || existing?.codeHash || (ext.code && !ext.code.includes('••••') ? hashInvitationCode(ext.code) : undefined),
            });
          }
        }
        currentList = Array.from(map.values());
      }

      const found = currentList.find((inv) => verifyInvitationCodeMatch(cleanCode, inv));

      if (!found) {
        const lockState = recordFailedPinAttempt();
        insertAuditLog({
          accion: 'CANJE_INVITACION_FALLIDO',
          hermano_nid: userEmail || userName || 'anonimo',
          hermano_nombre: userName || userEmail || 'Desconocido',
          modulo: 'auth',
          detalles: `Intento fallido de canje de código de invitación (${lockState.attempts}/5).`,
        }).catch(() => {});
        return {
          success: false,
          message: lockState.isLockedOut
            ? `Demasiados intentos fallidos. Bloqueado temporalmente por ${lockState.remainingSeconds} segundos.`
            : 'Código de invitación no encontrado. Verifique que esté bien escrito o solicite un nuevo código al Coordinador.',
        };
      }

      if (found.status === 'revoked') {
        return {
          success: false,
          message: 'Esta invitación ha sido revocada por el cuerpo de ancianos.',
        };
      }

      if (found.status === 'used') {
        return {
          success: false,
          message: 'Este código de invitación ya ha sido utilizado.',
        };
      }

      if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
        return {
          success: false,
          message: 'Este código de invitación ha expirado.',
        };
      }

      resetFailedPinAttempts();

      // Mark invitation as used and immediately trigger cloud sync to prevent replay across devices
      setInvitations((prev) => {
        const exists = prev.some((i) => i.id === found.id);
        const updatedFound = {
          ...found,
          status: 'used' as const,
          usedAt: new Date().toISOString(),
          usedByEmail: userEmail || 'invitado_local@kongre.org',
        };
        const next = exists
          ? prev.map((inv) => (inv.id === found.id ? updatedFound : inv))
          : [updatedFound, ...prev];
        try {
          localStorage.setItem(INVITATIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(next)));
          window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
        } catch {}
        return next;
      });

      // Register new active device session
      const newSession: ActiveDeviceSession = {
        id: `sess_${Date.now()}`,
        email: userEmail || `${found.id.toLowerCase()}@kongre.org`,
        name: userName || found.targetName || 'Hermano Autorizado',
        role: found.role,
        deviceInfo: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvil' : 'Navegador Web / PC',
        lastActive: 'Hace un momento',
        ipPlaceholder: 'Salón del Reino',
        status: 'active',
      };

      setActiveSessions((prev) => [newSession, ...prev]);

      insertAuditLog({
        accion: 'CANJEAR_INVITACION_EXITOSO',
        hermano_nid: userEmail || newSession.name,
        hermano_nombre: newSession.name,
        modulo: 'auth',
        detalles: `Invitación canjeada con éxito para el rol: ${found.role}.`,
      }).catch(() => {});

      return {
        success: true,
        role: found.role as TheocraticRole,
        targetName: found.targetName,
        message: `¡Bienvenido a la congregación! Se te ha asignado el rol de: ${found.role}.`,
      };
    },
    [invitations]
  );

  // Revoke device session
  const revokeSession = useCallback((sessionId: string) => {
    setActiveSessions((prev) => {
      const target = prev.find((s) => s.id === sessionId);
      if (target) {
        insertAuditLog({
          accion: 'REVOCAR_SESION_DISPOSITIVO',
          hermano_nid: target.email || target.id,
          hermano_nombre: target.name,
          modulo: 'auth',
          detalles: `Sesión revocada para dispositivo (${target.deviceInfo}) con rol ${target.role}.`,
        }).catch(() => {});
      }
      return prev.map((s) => (s.id === sessionId ? { ...s, status: 'revoked' as const } : s));
    });
  }, []);

  // Inactivity countdown & automatic session locking
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(AUTOLOCK_STORAGE_KEY);
    const mins = saved ? parseInt(saved, 10) : 5;
    return mins > 0 ? mins * 60 : 0;
  });
  const [isRefilling, setIsRefilling] = useState<boolean>(false);

  const deadlineRef = useRef<number>(Date.now() + (autoLockMinutes > 0 ? autoLockMinutes * 60 * 1000 : 0));
  const lastResetRef = useRef<number>(Date.now());

  const isAutoLockActive = !isDemoSession() && (!!pinHash || !!congregationPinHash) && autoLockMinutes > 0 && !isLocked;
  const totalSeconds = autoLockMinutes > 0 ? autoLockMinutes * 60 : 0;
  const autoLockFraction = totalSeconds > 0 ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds)) : 0;

  const autoLockState: 'ok' | 'warn' | 'crit' = useMemo(() => {
    if (!isAutoLockActive) return 'ok';
    if (remainingSeconds <= 30) return 'crit';
    if (remainingSeconds <= 60) return 'warn';
    return 'ok';
  }, [isAutoLockActive, remainingSeconds]);

  const resetInactivityTimer = useCallback(() => {
    if (isDemoSession() || isLocked || autoLockMinutes <= 0) return;
    const now = Date.now();
    deadlineRef.current = now + autoLockMinutes * 60 * 1000;
    lastResetRef.current = now;
    setRemainingSeconds(autoLockMinutes * 60);
    setIsRefilling(true);
    setTimeout(() => setIsRefilling(false), 600);
  }, [isLocked, autoLockMinutes]);

  useEffect(() => {
    if (!isAutoLockActive) {
      setRemainingSeconds(0);
      return;
    }

    deadlineRef.current = Date.now() + autoLockMinutes * 60 * 1000;
    setRemainingSeconds(autoLockMinutes * 60);

    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = deadlineRef.current - now;
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(secs);
      if (secs <= 0) {
        lockSession();
      }
    };

    const interval = setInterval(updateCountdown, 250);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateCountdown();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastResetRef.current > 500) {
        lastResetRef.current = now;
        deadlineRef.current = now + autoLockMinutes * 60 * 1000;
        setRemainingSeconds(autoLockMinutes * 60);
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [isAutoLockActive, autoLockMinutes, lockSession]);

  return (
    <SecurityContext.Provider
      value={{
        isLocked: isDemoSession() ? false : isLocked,
        isPinEnabled: isDemoSession() ? false : !!pinHash || !!congregationPinHash,
        isPersonalPinSet: !!pinHash,
        autoLockMinutes,
        privacyModeEnabled,
        isMasterPassphraseSet: !!masterPassphraseHash,
        congregationPinHash,
        isCongregationPinSet: !!congregationPinHash,
        invitations,
        activeSessions,
        lockSession,
        unlockSession,
        setPasscodePin,
        setPersonalPin,
        verifyPersonalPin,
        setCongregationPin,
        verifyCongregationPin,
        setAutoLockMinutes,
        setPrivacyModeEnabled,
        verifyCurrentPin,
        setMasterPassphrase,
        verifyMasterPassphrase,
        createInvitation,
        revokeInvitation,
        redeemInvitationCode,
        revokeSession,
        remainingSeconds,
        totalSeconds,
        autoLockFraction,
        autoLockState,
        isAutoLockActive,
        isRefilling,
        resetInactivityTimer,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
  return context;
};
