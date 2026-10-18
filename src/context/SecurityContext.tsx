// src/context/SecurityContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { hashPasscode, verifyPasscode } from '../utils/theocraticSecurity';
import { TheocraticRole } from '../utils/rbac';
import { CongregationInvitation, ActiveDeviceSession } from '../types';

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
  redeemInvitationCode: (code: string, userEmail?: string, userName?: string) => Promise<{ success: boolean; role?: TheocraticRole; message: string; targetName?: string }>;
  revokeSession: (sessionId: string) => void;
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
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_INVITATIONS;
  });

  const [activeSessions, setActiveSessions] = useState<ActiveDeviceSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_SESSIONS;
  });

  // Sync invitations to localStorage
  useEffect(() => {
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
  }, [invitations]);

  // Sync sessions to localStorage
  useEffect(() => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(activeSessions));
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
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const code = `KONG-${prefix}-${randomDigits}`;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);

      const newInv: CongregationInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        code,
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

      setInvitations((prev) => [newInv, ...prev]);
      return newInv;
    },
    []
  );

  // Revoke invitation
  const revokeInvitation = useCallback((id: string) => {
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'revoked' as const } : inv))
    );
  }, []);

  // Redeem invitation code
  const redeemInvitationCode = useCallback(
    async (
      code: string,
      userEmail?: string,
      userName?: string
    ): Promise<{ success: boolean; role?: TheocraticRole; message: string; targetName?: string }> => {
      const cleanCode = code.trim().toUpperCase();
      const found = invitations.find((inv) => inv.code.toUpperCase() === cleanCode);

      if (!found) {
        return {
          success: false,
          message: 'Código de invitación no encontrado. Verifique que esté bien escrito o solicite un nuevo código al Coordinador.',
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

      // Mark invitation as used
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === found.id
            ? {
                ...inv,
                status: 'used' as const,
                usedAt: new Date().toISOString(),
                usedByEmail: userEmail || 'invitado_local@kongre.org',
              }
            : inv
        )
      );

      // Register new active device session
      const newSession: ActiveDeviceSession = {
        id: `sess_${Date.now()}`,
        email: userEmail || `${found.code.toLowerCase()}@kongre.org`,
        name: userName || found.targetName || 'Hermano Autorizado',
        role: found.role,
        deviceInfo: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvil' : 'Navegador Web / PC',
        lastActive: 'Hace un momento',
        ipPlaceholder: 'Salón del Reino',
        status: 'active',
      };

      setActiveSessions((prev) => [newSession, ...prev]);

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
    setActiveSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'revoked' as const } : s))
    );
  }, []);

  // Inactivity detection for Auto-lock
  useEffect(() => {
    if (isDemoSession()) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (isLocked) setIsLocked(false);
      return;
    }

    if (!pinHash || autoLockMinutes <= 0) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (isLocked) return;

      inactivityTimerRef.current = setTimeout(() => {
        lockSession();
      }, autoLockMinutes * 60 * 1000);
    };

    resetTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [pinHash, autoLockMinutes, isLocked, lockSession]);

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
