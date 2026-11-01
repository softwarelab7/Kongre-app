import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  hashPasscode,
  hashPasscodeSlow,
  isSlowHash,
  verifyPasscode,
  generateSecureInvitationCode,
  encryptPinAtRest,
  decryptPinAtRest,
  isEncryptedPinAtRest,
  hashInvitationCode,
  verifyInvitationCodeMatch,
  getPinLockoutRemainingSeconds,
  recordFailedPinAttempt,
  resetFailedPinAttempts,
  isSafeDemoMode,
} from '../utils/theocraticSecurity';
import { TheocraticRole } from '../utils/rbac';
import {
  CongregationInvitation,
  ActiveDeviceSession,
  CredentialRedemptionRecord,
  CredentialRevocationHistoryItem,
  CredentialRevocationReasonId,
} from '../types';
import { insertAuditLog } from '../services/auditLogService';

export const REVOCATION_REASON_OPTIONS: {
  id: CredentialRevocationReasonId;
  label: string;
  description: string;
}[] = [
  {
    id: 'olvido',
    label: 'Lo olvidó',
    description: 'El hermano olvidó su código o PIN personal y solicita uno nuevo.',
  },
  {
    id: 'perdida_telefono',
    label: 'Perdió o le robaron el teléfono',
    description: 'Extravío, pérdida o robo del dispositivo donde tenía la sesión abierta.',
  },
  {
    id: 'alguien_mas_lo_sabe',
    label: 'Alguien más conoce el código',
    description: 'Sospecha de que otra persona vio o conoce el código de acceso.',
  },
  {
    id: 'cambio_dispositivo',
    label: 'Cambio o renovación de dispositivo',
    description: 'El hermano cambió de teléfono, tableta o computadora.',
  },
  {
    id: 'otro_motivo',
    label: 'Otro motivo de seguridad / Reasignación',
    description: 'Mantenimiento preventivo de seguridad o actualización de privilegios.',
  },
];

export function detectBrowserDeviceDetails(): {
  deviceInfo: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osName: string;
  browserName: string;
} {
  if (typeof navigator === 'undefined') {
    return {
      deviceInfo: 'Navegador Web · Escritorio',
      deviceType: 'desktop',
      osName: 'Sistema Operativo',
      browserName: 'Navegador',
    };
  }
  const ua = navigator.userAgent || '';
  let osName = 'Escritorio';
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    osName = 'iPadOS (iPad)';
    deviceType = 'tablet';
  } else if (/iPhone|iPod/i.test(ua)) {
    osName = 'iOS (iPhone)';
    deviceType = 'mobile';
  } else if (/Android/i.test(ua)) {
    const isTablet = !/Mobile/i.test(ua);
    osName = isTablet ? 'Android Tablet' : 'Android Smartphone';
    deviceType = isTablet ? 'tablet' : 'mobile';
  } else if (/Windows/i.test(ua)) {
    osName = 'Windows PC';
    deviceType = 'desktop';
  } else if (/Mac OS X|Macintosh/i.test(ua)) {
    osName = 'macOS (Mac)';
    deviceType = 'desktop';
  } else if (/Linux/i.test(ua)) {
    osName = 'Linux PC';
    deviceType = 'desktop';
  }

  let browserName = 'Navegador Web';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browserName = 'Opera';
  else if (/Brave/i.test(ua)) browserName = 'Brave';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browserName = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browserName = 'Safari';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';

  return {
    deviceInfo: `${osName} · ${browserName}`,
    deviceType,
    osName,
    browserName,
  };
}

export function formatDeviceHardwareId(rawId?: string): string {
  const source = (rawId || 'dev_local_default').trim();
  if (/^DEV-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(source)) {
    return source;
  }
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const suffix = source
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(-4)
    .padStart(4, '0');
  return `DEV-${hex.slice(0, 4)}-${suffix}`;
}

const TIMEZONE_LOCATION_MAP: Record<string, string> = {
  'America/Mexico_City': 'Ciudad de México, México',
  'America/Monterrey': 'Monterrey, Nuevo León, México',
  'America/Cancun': 'Cancún, Quintana Roo, México',
  'America/Tijuana': 'Tijuana, Baja California, México',
  'America/Hermosillo': 'Hermosillo, Sonora, México',
  'America/Chihuahua': 'Chihuahua, México',
  'America/Mazatlan': 'Mazatlán, Sinaloa, México',
  'America/Merida': 'Mérida, Yucatán, México',
  'America/Bogota': 'Bogotá, Colombia',
  'America/Lima': 'Lima, Perú',
  'America/Santiago': 'Santiago, Chile',
  'America/Argentina/Buenos_Aires': 'Buenos Aires, Argentina',
  'America/Buenos_Aires': 'Buenos Aires, Argentina',
  'America/Caracas': 'Caracas, Venezuela',
  'America/Guayaquil': 'Guayaquil, Ecuador',
  'America/La_Paz': 'La Paz, Bolivia',
  'America/Asuncion': 'Asunción, Paraguay',
  'America/Montevideo': 'Montevideo, Uruguay',
  'America/Panama': 'Ciudad de Panamá, Panamá',
  'America/Costa_Rica': 'San José, Costa Rica',
  'America/Guatemala': 'Ciudad de Guatemala, Guatemala',
  'America/El_Salvador': 'San Salvador, El Salvador',
  'America/Tegucigalpa': 'Tegucigalpa, Honduras',
  'America/Managua': 'Managua, Nicaragua',
  'America/Santo_Domingo': 'Santo Domingo, República Dominicana',
  'America/Puerto_Rico': 'San Juan, Puerto Rico',
  'America/Havana': 'La Habana, Cuba',
  'America/New_York': 'Nueva York, EE. UU. (Este)',
  'America/Chicago': 'Chicago / Texas, EE. UU. (Centro)',
  'America/Denver': 'Denver, EE. UU. (Montaña)',
  'America/Los_Angeles': 'Los Ángeles, California, EE. UU.',
  'America/Phoenix': 'Phoenix, Arizona, EE. UU.',
  'Europe/Madrid': 'Madrid, España',
  'Atlantic/Canary': 'Islas Canarias, España',
};

export function detectApproximateLocation(): string {
  try {
    if (typeof window !== 'undefined') {
      const savedLoc = localStorage.getItem('kongre_approx_location_v1');
      if (savedLoc && savedLoc.trim().length > 0) {
        return savedLoc.trim();
      }
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (TIMEZONE_LOCATION_MAP[tz]) {
        return `${TIMEZONE_LOCATION_MAP[tz]} (${tz.split('/').pop()?.replace(/_/g, ' ')})`;
      }
      const parts = tz.split('/');
      const city = parts[parts.length - 1]?.replace(/_/g, ' ') || tz;
      const region = parts[0]?.replace(/_/g, ' ') || '';
      return region ? `${city}, ${region}` : city;
    }
  } catch {}
  return 'Ciudad de México, México (Región local)';
}

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
  credentialRedemptions: CredentialRedemptionRecord[];
  revocationHistory: CredentialRevocationHistoryItem[];
  currentDeviceId: string;
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
  revokeSession: (sessionId: string, reasonLabel?: string, revokedBy?: string) => void;
  revokeAllOtherSessions: (revokedBy?: string) => void;
  updateCurrentDeviceLocation: (locationLabel: string) => void;
  recordCredentialRedemption: (params: {
    publisherId: string;
    publisherName: string;
    role: string;
    codeOrPin: string;
    deviceInfo?: string;
  }) => void;
  revokeAndReplacePublisherCredential: (params: {
    publisherId: string;
    publisherName: string;
    role: string;
    oldPinOrCode?: string;
    newPinOrCode: string;
    reasonId: CredentialRevocationReasonId;
    reasonDetails?: string;
    revokedBy: string;
  }) => void;
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
const SESSIONS_STORAGE_KEY = 'kongre_device_sessions_v3';
const REDEMPTIONS_STORAGE_KEY = 'kongre_credential_redemptions_v1';
const REVOCATIONS_STORAGE_KEY = 'kongre_credential_revocations_v1';
const CURRENT_DEVICE_ID_KEY = 'kongre_current_device_id_v1';

function maskCredentialCode(raw?: string): string {
  if (!raw) return '••••';
  const clean = raw.trim();
  if (clean.length <= 2) return '••••';
  if (clean.length <= 4) return `••${clean.slice(-2)}`;
  return `••••${clean.slice(-3)}`;
}

// Initial invitations and sessions for fresh congregation
const DEFAULT_INITIAL_INVITATIONS: CongregationInvitation[] = [];

function buildInitialSessions(currentDevId: string): ActiveDeviceSession[] {
  const dev = detectBrowserDeviceDetails();
  const approxLoc = detectApproximateLocation();
  const nowIso = new Date().toISOString();
  const twoHoursAgoIso = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const yesterdayIso = new Date(Date.now() - 26 * 3600 * 1000).toISOString();
  const twoDaysAgoIso = new Date(Date.now() - 50 * 3600 * 1000).toISOString();
  const fiveDaysAgoIso = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const twelveDaysAgoIso = new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString();
  const twentyDaysAgoIso = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString();

  return [
    {
      id: currentDevId,
      deviceId: formatDeviceHardwareId(currentDevId),
      publisherId: 'pub-1',
      email: 'carlos.mendoza@kongre.org',
      name: 'Carlos Mendoza',
      role: 'coordinador',
      deviceInfo: dev.deviceInfo,
      deviceType: dev.deviceType,
      osName: dev.osName,
      browserName: dev.browserName,
      startedAt: twoHoursAgoIso,
      lastActive: nowIso,
      approxLocation: approxLoc,
      ipPlaceholder: 'Este dispositivo · Sesión actual',
      isCurrentDevice: true,
      codeMasked: '••84',
      status: 'active',
    },
    {
      id: 'sess_other_tablet_01',
      deviceId: 'DEV-4B8E-21A9',
      publisherId: 'pub-1',
      email: 'carlos.mendoza@kongre.org',
      name: 'Carlos Mendoza',
      role: 'coordinador',
      deviceInfo: 'iPadOS (iPad Air) · Safari',
      deviceType: 'tablet',
      osName: 'iPadOS 17.4',
      browserName: 'Safari',
      startedAt: yesterdayIso,
      lastActive: yesterdayIso,
      approxLocation: 'Ciudad de México, México (Zona Centro)',
      ipPlaceholder: 'Tableta personal · Salón del Reino',
      isCurrentDevice: false,
      codeMasked: '••84',
      status: 'active',
    },
    {
      id: 'sess_other_pc_02',
      deviceId: 'DEV-9C2D-64F0',
      publisherId: 'pub-1',
      email: 'carlos.mendoza@kongre.org',
      name: 'Carlos Mendoza',
      role: 'coordinador',
      deviceInfo: 'Windows PC · Google Chrome',
      deviceType: 'desktop',
      osName: 'Windows 11',
      browserName: 'Google Chrome',
      startedAt: twoDaysAgoIso,
      lastActive: twoHoursAgoIso,
      approxLocation: 'Ciudad de México, México (Zona Sur)',
      ipPlaceholder: 'Computadora de casa',
      isCurrentDevice: false,
      codeMasked: '••84',
      status: 'active',
    },
    {
      id: 'sess_hist_revoked_01',
      deviceId: 'DEV-3E1F-78B4',
      publisherId: 'pub-1',
      email: 'carlos.mendoza@kongre.org',
      name: 'Carlos Mendoza',
      role: 'coordinador',
      deviceInfo: 'Android Smartphone (Galaxy S21) · Chrome',
      deviceType: 'mobile',
      osName: 'Android 13',
      browserName: 'Google Chrome',
      startedAt: twelveDaysAgoIso,
      lastActive: fiveDaysAgoIso,
      approxLocation: 'Guadalajara, Jalisco, México',
      ipPlaceholder: 'Teléfono móvil anterior',
      isCurrentDevice: false,
      codeMasked: '••19',
      status: 'revoked',
      revokedAt: fiveDaysAgoIso,
      revokedReasonId: 'cambio_dispositivo',
      revokedReasonLabel: 'Cambio o renovación de dispositivo',
      revokedReasonDetails: 'Renovación de equipo móvil personal.',
      revokedBy: 'Carlos Mendoza',
    },
    {
      id: 'sess_hist_revoked_02',
      deviceId: 'DEV-6A9C-10D5',
      publisherId: 'pub-1',
      email: 'carlos.mendoza@kongre.org',
      name: 'Carlos Mendoza',
      role: 'coordinador',
      deviceInfo: 'macOS (MacBook Air) · Safari',
      deviceType: 'desktop',
      osName: 'macOS Sonoma',
      browserName: 'Safari',
      startedAt: twentyDaysAgoIso,
      lastActive: twelveDaysAgoIso,
      approxLocation: 'Monterrey, Nuevo León, México',
      ipPlaceholder: 'Equipo portátil de viaje',
      isCurrentDevice: false,
      codeMasked: '••19',
      status: 'revoked',
      revokedAt: twelveDaysAgoIso,
      revokedReasonLabel: 'Sesión finalizada tras viaje de asamblea',
      revokedBy: 'Carlos Mendoza',
    },
  ];
}

function buildInitialRedemptions(): CredentialRedemptionRecord[] {
  const dev = detectBrowserDeviceDetails();
  const d1 = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const d2 = new Date(Date.now() - 28 * 3600 * 1000).toISOString();
  const d3 = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const d4 = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
  const d5 = new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString();

  return [
    {
      id: 'red_01',
      publisherId: 'pub-1',
      publisherName: 'Carlos Mendoza',
      role: 'coordinador',
      codeMasked: '••84',
      deviceInfo: dev.deviceInfo,
      deviceType: dev.deviceType,
      osName: dev.osName,
      browserName: dev.browserName,
      redeemedAt: d1,
      lastActiveAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 'red_02',
      publisherId: 'pub-2',
      publisherName: 'Roberto Gómez',
      role: 'secretario',
      codeMasked: '••21',
      deviceInfo: 'Windows PC · Google Chrome',
      deviceType: 'desktop',
      osName: 'Windows 11',
      browserName: 'Google Chrome',
      redeemedAt: d2,
      lastActiveAt: d1,
      status: 'active',
    },
    {
      id: 'red_03',
      publisherId: 'pub-3',
      publisherName: 'Miguel Ángel Torres',
      role: 'superintendente_servicio',
      codeMasked: '••56',
      deviceInfo: 'iOS (iPhone 15) · Safari',
      deviceType: 'mobile',
      osName: 'iOS 17.5',
      browserName: 'Safari',
      redeemedAt: d3,
      lastActiveAt: d2,
      status: 'active',
    },
    {
      id: 'red_04',
      publisherId: 'pub-4',
      publisherName: 'David Herrera',
      role: 'siervo_territorios',
      codeMasked: '••73',
      deviceInfo: 'Android Smartphone (Xiaomi Redmi) · Chrome',
      deviceType: 'mobile',
      osName: 'Android 14',
      browserName: 'Google Chrome',
      redeemedAt: d4,
      lastActiveAt: d3,
      status: 'active',
    },
    {
      id: 'red_05_rev',
      publisherId: 'pub-4',
      publisherName: 'David Herrera',
      role: 'siervo_territorios',
      codeMasked: '••40',
      deviceInfo: 'Android Smartphone (Moto G) · Chrome',
      deviceType: 'mobile',
      osName: 'Android 12',
      browserName: 'Google Chrome',
      redeemedAt: d5,
      lastActiveAt: d4,
      status: 'revoked',
      revokedAt: d4,
      revokedBy: 'Carlos Mendoza (Coordinador)',
      revokedReasonId: 'perdida_telefono',
      revokedReasonLabel: 'Perdió o le robaron el teléfono',
      revokedReasonDetails: 'Extravió el teléfono anterior en el transporte público; se revocó de inmediato.',
    },
  ];
}

function buildInitialRevocationHistory(): CredentialRevocationHistoryItem[] {
  const d4 = new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
  const d5 = new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString();
  return [
    {
      id: 'rev_hist_01',
      publisherId: 'pub-4',
      publisherName: 'David Herrera',
      previousCodeMasked: '••40',
      previousDeviceInfo: 'Android Smartphone (Moto G) · Chrome',
      previousRedeemedAt: d5,
      revokedAt: d4,
      revokedBy: 'Carlos Mendoza (Coordinador)',
      reasonId: 'perdida_telefono',
      reasonLabel: 'Perdió o le robaron el teléfono',
      reasonDetails: 'Extravió el teléfono anterior en el transporte público; se revocó de inmediato.',
      newCodeMasked: '••73',
    },
  ];
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDeviceId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem(CURRENT_DEVICE_ID_KEY);
      if (existing) return existing;
      const created = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(CURRENT_DEVICE_ID_KEY, created);
      return created;
    } catch {
      return 'dev_current_local';
    }
  });

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
        const rawJson = isEncryptedPinAtRest(saved) ? decryptPinAtRest(saved) : saved;
        const parsed = JSON.parse(rawJson || '[]');
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((inv: CongregationInvitation) => ({
            ...inv,
            codeHash: inv.codeHash || (inv.code && !inv.code.includes('••••') ? hashInvitationCode(inv.code) : undefined),
          }));
          if (!isEncryptedPinAtRest(saved)) {
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
        const rawJson = isEncryptedPinAtRest(saved) ? decryptPinAtRest(saved) : saved;
        const parsed = JSON.parse(rawJson || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!isEncryptedPinAtRest(saved)) {
            localStorage.setItem(SESSIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(parsed)));
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return buildInitialSessions(currentDeviceId);
  });

  const [credentialRedemptions, setCredentialRedemptions] = useState<CredentialRedemptionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(REDEMPTIONS_STORAGE_KEY);
      if (saved) {
        const rawJson = isEncryptedPinAtRest(saved) ? decryptPinAtRest(saved) : saved;
        const parsed = JSON.parse(rawJson || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return buildInitialRedemptions();
  });

  const [revocationHistory, setRevocationHistory] = useState<CredentialRevocationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(REVOCATIONS_STORAGE_KEY);
      if (saved) {
        const rawJson = isEncryptedPinAtRest(saved) ? decryptPinAtRest(saved) : saved;
        const parsed = JSON.parse(rawJson || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return buildInitialRevocationHistory();
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

  // Sync sessions, redemptions and revocations to localStorage (encrypted at rest)
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(activeSessions)));
    } catch {}
  }, [activeSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(REDEMPTIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(credentialRedemptions)));
    } catch {}
  }, [credentialRedemptions]);

  useEffect(() => {
    try {
      localStorage.setItem(REVOCATIONS_STORAGE_KEY, encryptPinAtRest(JSON.stringify(revocationHistory)));
    } catch {}
  }, [revocationHistory]);

  // Ensure current browser device session is registered and kept up to date
  useEffect(() => {
    const dev = detectBrowserDeviceDetails();
    const activeBrother =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('kongre_current_brother_name') ||
          localStorage.getItem('kongre_user_confirmed_name') ||
          localStorage.getItem('kongre_google_display_name'))) ||
      'Carlos Mendoza';
    const activeEmail =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('kongre_user_email') ||
          localStorage.getItem('kongre_coordinator_email'))) ||
      'sesion.local@kongre.org';
    const activeRole =
      (typeof window !== 'undefined' && localStorage.getItem('kongre_active_role_v1')) ||
      'coordinador';
    const activePubId =
      (typeof window !== 'undefined' && localStorage.getItem('kongre_current_publisher_id_v2')) ||
      'pub-1';

    setActiveSessions((prev) => {
      const approxLoc = detectApproximateLocation();
      const formattedDevId = formatDeviceHardwareId(currentDeviceId);
      const hasCurrent = prev.some((s) => s.id === currentDeviceId || s.isCurrentDevice);
      if (hasCurrent) {
        return prev.map((s) =>
          s.id === currentDeviceId || s.isCurrentDevice
            ? {
                ...s,
                id: currentDeviceId,
                deviceId: s.deviceId || formattedDevId,
                isCurrentDevice: true,
                deviceInfo: dev.deviceInfo,
                deviceType: dev.deviceType,
                osName: dev.osName,
                browserName: dev.browserName,
                startedAt: s.startedAt || new Date().toISOString(),
                lastActive: new Date().toISOString(),
                approxLocation: s.approxLocation || approxLoc,
                status: 'active',
              }
            : {
                ...s,
                deviceId: s.deviceId || formatDeviceHardwareId(s.id),
                approxLocation: s.approxLocation || approxLoc,
              }
        );
      }
      const currentSession: ActiveDeviceSession = {
        id: currentDeviceId,
        deviceId: formattedDevId,
        publisherId: activePubId,
        email: activeEmail,
        name: activeBrother,
        role: activeRole,
        deviceInfo: dev.deviceInfo,
        deviceType: dev.deviceType,
        osName: dev.osName,
        browserName: dev.browserName,
        startedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        approxLocation: approxLoc,
        ipPlaceholder: 'Este dispositivo · Sesión actual',
        isCurrentDevice: true,
        status: 'active',
      };
      return [currentSession, ...prev];
    });
  }, [currentDeviceId]);

  // Helper to check if demo mode is active and safe
  const isDemoSession = (): boolean => {
    if (typeof window === 'undefined') return false;
    const cleanCong = String(
      localStorage.getItem('kongre_congregation_id') ||
      localStorage.getItem('kongre_congregation_number') ||
      ''
    ).trim().toUpperCase();
    if (cleanCong.includes('DEMO') || cleanCong === '1001') return true;
    return isSafeDemoMode();
  };

  // Start unlocked unless a PIN is configured and was previously locked in this session (and not demo mode)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cleanCong = String(
        localStorage.getItem('kongre_congregation_id') ||
        localStorage.getItem('kongre_congregation_number') ||
        ''
      ).trim().toUpperCase();
      const isDemo = cleanCong.includes('DEMO') || cleanCong === '1001' || isSafeDemoMode();
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
          // Auto-migración a PBKDF2 si estaba en formato legado
          if (!isSlowHash(pinHash)) {
            try {
              const newHash = await hashPasscodeSlow(enteredPin.trim());
              localStorage.setItem(PIN_STORAGE_KEY, newHash);
              setPinHash(newHash);
            } catch {}
          }
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
      const valid = await verifyPasscode(enteredPin.trim(), pinHash);
      if (valid && !isSlowHash(pinHash)) {
        try {
          const newHash = await hashPasscodeSlow(enteredPin.trim());
          localStorage.setItem(PIN_STORAGE_KEY, newHash);
          setPinHash(newHash);
        } catch {}
      }
      return valid;
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
      const hashed = await hashPasscodeSlow(newPin.trim());
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
      const hashed = await hashPasscodeSlow(passphrase.trim());
      localStorage.setItem(MASTER_KEY_STORAGE, hashed);
      setMasterPassphraseHash(hashed);
    }
  }, []);

  const verifyMasterPassphrase = useCallback(
    async (passphrase: string): Promise<boolean> => {
      if (!passphrase || !passphrase.trim() || !masterPassphraseHash) return false;
      const valid = await verifyPasscode(passphrase.trim(), masterPassphraseHash);
      if (valid && !isSlowHash(masterPassphraseHash)) {
        try {
          const newHash = await hashPasscodeSlow(passphrase.trim());
          localStorage.setItem(MASTER_KEY_STORAGE, newHash);
          setMasterPassphraseHash(newHash);
        } catch {}
      }
      return valid;
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
          const rawJson = isEncryptedPinAtRest(stored) ? decryptPinAtRest(stored) : stored;
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

      // Register new active device session with full device details
      const dev = detectBrowserDeviceDetails();
      const approxLoc = detectApproximateLocation();
      const nowIso = new Date().toISOString();
      const effectiveName = userName || found.targetName || 'Hermano Autorizado';
      const newSessId = `sess_${Date.now()}`;
      const newSession: ActiveDeviceSession = {
        id: newSessId,
        deviceId: formatDeviceHardwareId(currentDeviceId || newSessId),
        email: userEmail || `${found.id.toLowerCase()}@kongre.org`,
        name: effectiveName,
        role: found.role,
        deviceInfo: dev.deviceInfo,
        deviceType: dev.deviceType,
        osName: dev.osName,
        browserName: dev.browserName,
        startedAt: nowIso,
        lastActive: nowIso,
        approxLocation: approxLoc,
        ipPlaceholder: 'Salón del Reino',
        isCurrentDevice: true,
        codeMasked: maskCredentialCode(cleanCode),
        status: 'active',
      };

      setActiveSessions((prev) => [newSession, ...prev]);

      // Also record in credentialRedemptions
      const newRedemption: CredentialRedemptionRecord = {
        id: `red_${Date.now()}`,
        publisherId: found.id,
        publisherName: effectiveName,
        role: found.role,
        codeMasked: maskCredentialCode(cleanCode),
        deviceInfo: dev.deviceInfo,
        deviceType: dev.deviceType,
        osName: dev.osName,
        browserName: dev.browserName,
        redeemedAt: nowIso,
        lastActiveAt: nowIso,
        status: 'active',
      };
      setCredentialRedemptions((prev) => [newRedemption, ...prev]);

      insertAuditLog({
        accion: 'CANJEAR_INVITACION_EXITOSO',
        hermano_nid: userEmail || newSession.name,
        hermano_nombre: newSession.name,
        modulo: 'auth',
        detalles: `Invitación (${maskCredentialCode(cleanCode)}) canjeada en ${dev.deviceInfo} para el rol: ${found.role}.`,
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

  // Revoke single device session
  const revokeSession = useCallback(
    (sessionId: string, reasonLabel?: string, revokedBy?: string) => {
      const nowIso = new Date().toISOString();
      setActiveSessions((prev) => {
        const target = prev.find((s) => s.id === sessionId);
        if (target) {
          insertAuditLog({
            accion: 'REVOCAR_SESION_DISPOSITIVO',
            hermano_nid: target.email || target.id,
            hermano_nombre: target.name,
            modulo: 'auth',
            detalles: `Sesión cerrada/revocada en dispositivo (${target.deviceInfo}) con rol ${target.role}${reasonLabel ? `. Motivo: ${reasonLabel}` : ''}.`,
          }).catch(() => {});
        }
        return prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: 'revoked' as const,
                revokedAt: nowIso,
                revokedReasonLabel: reasonLabel || 'Sesión cerrada manualmente desde Mi Perfil',
                revokedBy: revokedBy || target?.name || 'Usuario',
              }
            : s
        );
      });
    },
    []
  );

  // Revoke all other active device sessions except current device
  const revokeAllOtherSessions = useCallback(
    (revokedBy?: string) => {
      const nowIso = new Date().toISOString();
      setActiveSessions((prev) => {
        const othersCount = prev.filter(
          (s) => s.status === 'active' && s.id !== currentDeviceId && !s.isCurrentDevice
        ).length;
        if (othersCount > 0) {
          insertAuditLog({
            accion: 'CERRAR_OTRAS_SESIONES_DISPOSITIVOS',
            hermano_nid: revokedBy || 'usuario',
            hermano_nombre: revokedBy || 'Usuario',
            modulo: 'auth',
            detalles: `Se cerraron ${othersCount} sesiones activas en otros dispositivos.`,
          }).catch(() => {});
        }
        return prev.map((s) =>
          s.status === 'active' && s.id !== currentDeviceId && !s.isCurrentDevice
            ? {
                ...s,
                status: 'revoked' as const,
                revokedAt: nowIso,
                revokedReasonLabel: 'Cierre de todas las demás sesiones abiertas',
                revokedBy: revokedBy || s.name || 'Usuario',
              }
            : s
        );
      });
    },
    [currentDeviceId]
  );

  const updateCurrentDeviceLocation = useCallback(
    (locationLabel: string) => {
      const clean = locationLabel.trim();
      if (!clean) return;
      try {
        localStorage.setItem('kongre_approx_location_v1', clean);
      } catch {}
      setActiveSessions((prev) =>
        prev.map((s) =>
          s.id === currentDeviceId || s.isCurrentDevice
            ? { ...s, approxLocation: clean, lastActive: new Date().toISOString() }
            : s
        )
      );
    },
    [currentDeviceId]
  );

  // Record a PIN or code redemption on current device
  const recordCredentialRedemption = useCallback(
    (params: {
      publisherId: string;
      publisherName: string;
      role: string;
      codeOrPin: string;
      deviceInfo?: string;
    }) => {
      const dev = detectBrowserDeviceDetails();
      const approxLoc = detectApproximateLocation();
      const nowIso = new Date().toISOString();
      const masked = maskCredentialCode(params.codeOrPin);

      // Update or register the current device connection in activeSessions with deviceId, login date, and approxLocation
      setActiveSessions((prev) => {
        const formattedDevId = formatDeviceHardwareId(currentDeviceId);
        const hasCurrent = prev.some((s) => s.id === currentDeviceId || s.isCurrentDevice);
        if (hasCurrent) {
          return prev.map((s) =>
            s.id === currentDeviceId || s.isCurrentDevice
              ? {
                  ...s,
                  id: currentDeviceId,
                  deviceId: s.deviceId || formattedDevId,
                  publisherId: params.publisherId,
                  name: params.publisherName,
                  role: params.role,
                  deviceInfo: params.deviceInfo || dev.deviceInfo,
                  deviceType: dev.deviceType,
                  osName: dev.osName,
                  browserName: dev.browserName,
                  startedAt: nowIso,
                  lastActive: nowIso,
                  approxLocation: s.approxLocation || approxLoc,
                  codeMasked: masked,
                  isCurrentDevice: true,
                  status: 'active',
                }
              : s
          );
        }
        const newCurrentSession: ActiveDeviceSession = {
          id: currentDeviceId,
          deviceId: formattedDevId,
          publisherId: params.publisherId,
          email: `${params.publisherId}@kongre.org`,
          name: params.publisherName,
          role: params.role,
          deviceInfo: params.deviceInfo || dev.deviceInfo,
          deviceType: dev.deviceType,
          osName: dev.osName,
          browserName: dev.browserName,
          startedAt: nowIso,
          lastActive: nowIso,
          approxLocation: approxLoc,
          ipPlaceholder: 'Este dispositivo · Sesión actual',
          isCurrentDevice: true,
          codeMasked: masked,
          status: 'active',
        };
        return [newCurrentSession, ...prev];
      });

      setCredentialRedemptions((prev) => {
        const existingIdx = prev.findIndex(
          (r) =>
            r.status === 'active' &&
            (r.publisherId === params.publisherId ||
              r.publisherName.toLowerCase().trim() === params.publisherName.toLowerCase().trim())
        );
        const updatedRecord: CredentialRedemptionRecord = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `red_${Date.now()}`,
          publisherId: params.publisherId,
          publisherName: params.publisherName,
          role: params.role,
          codeMasked: masked,
          deviceInfo: params.deviceInfo || dev.deviceInfo,
          deviceType: dev.deviceType,
          osName: dev.osName,
          browserName: dev.browserName,
          redeemedAt: existingIdx >= 0 ? prev[existingIdx].redeemedAt : nowIso,
          lastActiveAt: nowIso,
          status: 'active',
        };
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = updatedRecord;
          return copy;
        }
        return [updatedRecord, ...prev];
      });
    },
    [currentDeviceId]
  );

  // Listen for custom 'kongre_pin_redeemed' events dispatched from AuthContext
  useEffect(() => {
    const handlePinRedeemed = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (detail && detail.publisherName) {
          recordCredentialRedemption({
            publisherId: detail.publisherId || `pub_${Date.now()}`,
            publisherName: detail.publisherName,
            role: detail.role || 'publico',
            codeOrPin: detail.pin || '••••',
          });
        }
      } catch {}
    };
    window.addEventListener('kongre_pin_redeemed', handlePinRedeemed);
    return () => window.removeEventListener('kongre_pin_redeemed', handlePinRedeemed);
  }, [recordCredentialRedemption]);

  // Mandatory elder workflow: revoke previous code/PIN + device sessions with reason and issue new credential
  const revokeAndReplacePublisherCredential = useCallback(
    (params: {
      publisherId: string;
      publisherName: string;
      role: string;
      oldPinOrCode?: string;
      newPinOrCode: string;
      reasonId: CredentialRevocationReasonId;
      reasonDetails?: string;
      revokedBy: string;
    }) => {
      const nowIso = new Date().toISOString();
      const reasonObj = REVOCATION_REASON_OPTIONS.find((r) => r.id === params.reasonId);
      const reasonLabel = reasonObj ? reasonObj.label : 'Cambio de código por seguridad';
      const oldMasked = maskCredentialCode(params.oldPinOrCode);
      const newMasked = maskCredentialCode(params.newPinOrCode);

      let prevDeviceUsed = 'Dispositivo no registrado (Sin canje previo)';
      let prevRedeemedAt: string | undefined = undefined;

      // 1. Mark previous active credentialRedemptions for this person as 'revoked'
      setCredentialRedemptions((prev) => {
        const activeExisting = prev.find(
          (r) =>
            r.status === 'active' &&
            (r.publisherId === params.publisherId ||
              r.publisherName.toLowerCase().trim() === params.publisherName.toLowerCase().trim())
        );
        if (activeExisting) {
          prevDeviceUsed = activeExisting.deviceInfo;
          prevRedeemedAt = activeExisting.redeemedAt;
        }

        return prev.map((r) => {
          const isTarget =
            r.status === 'active' &&
            (r.publisherId === params.publisherId ||
              r.publisherName.toLowerCase().trim() === params.publisherName.toLowerCase().trim());
          if (!isTarget) return r;
          return {
            ...r,
            status: 'revoked' as const,
            revokedAt: nowIso,
            revokedBy: params.revokedBy,
            revokedReasonId: params.reasonId,
            revokedReasonLabel: reasonLabel,
            revokedReasonDetails: params.reasonDetails?.trim() || undefined,
          };
        });
      });

      // 2. Mark any active device sessions belonging to this brother (except current elder device if different) as 'revoked'
      setActiveSessions((prev) =>
        prev.map((s) => {
          const isTarget =
            s.status === 'active' &&
            !s.isCurrentDevice &&
            (s.publisherId === params.publisherId ||
              s.name.toLowerCase().trim() === params.publisherName.toLowerCase().trim());
          if (!isTarget) return s;
          return {
            ...s,
            status: 'revoked' as const,
            revokedAt: nowIso,
            revokedBy: params.revokedBy,
            revokedReasonId: params.reasonId,
            revokedReasonLabel: `${reasonLabel}${params.reasonDetails ? ` — ${params.reasonDetails.trim()}` : ''}`,
            revokedReasonDetails: params.reasonDetails?.trim() || undefined,
          };
        })
      );

      // 3. Append to revocationHistory
      const historyItem: CredentialRevocationHistoryItem = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        publisherId: params.publisherId,
        publisherName: params.publisherName,
        previousCodeMasked: oldMasked,
        previousDeviceInfo: prevDeviceUsed,
        previousRedeemedAt: prevRedeemedAt,
        revokedAt: nowIso,
        revokedBy: params.revokedBy,
        reasonId: params.reasonId,
        reasonLabel,
        reasonDetails: params.reasonDetails?.trim() || undefined,
        newCodeMasked: newMasked,
      };

      setRevocationHistory((prev) => [historyItem, ...prev]);

      // 4. Audit Log
      insertAuditLog({
        accion: 'REVOCAR_Y_CAMBIAR_CODIGO_PERSONA',
        hermano_nid: params.revokedBy,
        hermano_nombre: params.revokedBy,
        modulo: 'auth',
        detalles: `Código anterior (${oldMasked}) de ${params.publisherName} REVOCADO y reemplazado por (${newMasked}). Motivo: ${reasonLabel}${params.reasonDetails ? ` (${params.reasonDetails.trim()})` : ''}.`,
      }).catch(() => {});
    },
    []
  );

  // Inactivity countdown & automatic session locking
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(AUTOLOCK_STORAGE_KEY);
    const mins = saved ? parseInt(saved, 10) : 5;
    return mins > 0 ? mins * 60 : 0;
  });
  const [isRefilling, setIsRefilling] = useState<boolean>(false);

  const deadlineRef = useRef<number>(Date.now() + (autoLockMinutes > 0 ? autoLockMinutes * 60 * 1000 : 0));
  const lastResetRef = useRef<number>(Date.now());

  const isAutoLockActive = !isDemoSession() && !!pinHash && autoLockMinutes > 0 && !isLocked;
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
    const fullSecs = autoLockMinutes * 60;
    setRemainingSeconds((prev) => (prev === fullSecs ? prev : fullSecs));
    setIsRefilling(true);
    setTimeout(() => setIsRefilling(false), 600);
  }, [isLocked, autoLockMinutes]);

  useEffect(() => {
    if (!isAutoLockActive) {
      setRemainingSeconds((prev) => (prev === 0 ? prev : 0));
      return;
    }

    const fullSecs = autoLockMinutes * 60;
    deadlineRef.current = Date.now() + fullSecs * 1000;
    setRemainingSeconds((prev) => (prev === fullSecs ? prev : fullSecs));

    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = deadlineRef.current - now;
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds((prev) => (prev === secs ? prev : secs));
      if (secs <= 0) {
        lockSession();
      }
    };

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      updateCountdown();
    }, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateCountdown();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastResetRef.current > 1000) {
        lastResetRef.current = now;
        deadlineRef.current = now + fullSecs * 1000;
        setRemainingSeconds((prev) => (prev === fullSecs ? prev : fullSecs));
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
        credentialRedemptions,
        revocationHistory,
        currentDeviceId,
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
        revokeAllOtherSessions,
        updateCurrentDeviceLocation,
        recordCredentialRedemption,
        revokeAndReplacePublisherCredential,
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
