// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseSyncService } from '../services/supabaseSyncService';

export interface User {
  uid: string;
  id?: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}
import {
  TheocraticRole,
  TheocraticRoleInfo,
  THEOCRATIC_ROLES,
  Permission,
  NO_PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRoles,
  normalizeTheocraticRole,
} from '../utils/rbac';
import { insertAuditLog } from '../services/auditLogService';
import { generateSecurePublisherPin, verifyPasscode, sanitizeForFirestore, isGenericIdentityName, formatCanonicalCongregationId } from '../utils/theocraticSecurity';
import { UserProfile, PreferredContactMethod, ContactTimePreference } from '../types';

export interface UserRoleRecord {
  email: string;
  name?: string;
  role: TheocraticRole;
  personalPin?: string;
  assignedAt?: string;
}

export interface RolePinAssignment {
  role: TheocraticRole;
  pin: string;
  name: string;
  email?: string;
}

export interface PublisherPinRecord {
  publisherId: string;
  name: string;
  role: TheocraticRole;
  pin: string;
  email?: string;
  privilege?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  error: string | null;
  activeRole: TheocraticRole;
  activeRoles: TheocraticRole[];
  effectiveRoleInfo: TheocraticRoleInfo;
  permissions: Permission;
  isAdmin: boolean;
  setActiveRole: (role: TheocraticRole) => void;
  setActiveRoles: (roles: TheocraticRole[]) => void;
  currentBrotherName: string | null;
  setIdentifiedBrother: (name: string) => void;
  userRolesList: UserRoleRecord[];
  rolePinsMap: Record<TheocraticRole, RolePinAssignment>;
  publisherPinsList: PublisherPinRecord[];
  currentPublisherId: string | null;
  setIdentifiedPublisher: (publisherId: string | null, name?: string) => void;
  identifyRoleByPersonalPin: (pin: string) => Promise<{ success: boolean; role?: TheocraticRole; roles?: TheocraticRole[]; name?: string; publisherId?: string; message: string }>;
  assignPersonalPinToPublisher: (
    publisherId: string,
    pin: string,
    role: TheocraticRole,
    name: string,
    email?: string,
    privilege?: string
  ) => { success: boolean; message: string };
  removePublisherPin: (publisherId: string) => void;
  generateUniquePublisherPin: () => string;
  assignPersonalPinToRole: (role: TheocraticRole, pin: string, brotherName?: string, email?: string) => void;
  assignRoleToEmail: (email: string, role: TheocraticRole, name?: string, personalPin?: string) => void;
  removeRoleFromEmail: (email: string) => void;
  isCoordinator: boolean;
  userProfile: UserProfile | null;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  logAction: (accion: string, modulo: string, detalles?: string) => Promise<void>;
}

const LOCAL_STORAGE_ROLES_KEY = 'kongre_user_roles_v1';
const LOCAL_STORAGE_ACTIVE_ROLE_KEY = 'kongre_active_role_v1';
const LOCAL_STORAGE_ACTIVE_ROLES_KEY = 'kongre_active_roles_v1';
const LOCAL_STORAGE_ROLE_PINS_KEY = 'kongre_role_personal_pins_v2';
const LOCAL_STORAGE_PUBLISHER_PINS_KEY = 'kongre_publisher_personal_pins_v4';
const LOCAL_STORAGE_BROTHER_NAME_KEY = 'kongre_current_brother_name_v1';
const LOCAL_STORAGE_PUBLISHER_ID_KEY = 'kongre_current_publisher_id_v2';

// Default initial role pin assignments (vacíos por defecto: los PINs pertenecen a publicadores)
const DEFAULT_ROLE_PINS: Record<TheocraticRole, RolePinAssignment> = {
  coordinador: { role: 'coordinador', pin: '', name: 'Coordinador del Cuerpo de Ancianos' },
  anciano: { role: 'anciano', pin: '', name: 'Anciano de Congregación' },
  secretario: { role: 'secretario', pin: '', name: 'Secretario' },
  superintendente_vym: { role: 'superintendente_vym', pin: '', name: 'Superintendente de VyM' },
  superintendente_servicio: { role: 'superintendente_servicio', pin: '', name: 'Superintendente de Servicio' },
  siervo_territorios: { role: 'siervo_territorios', pin: '', name: 'Siervo de Territorios' },
  siervo_carritos: { role: 'siervo_carritos', pin: '', name: 'Encargado de Carritos' },
  siervo_literatura: { role: 'siervo_literatura', pin: '', name: 'Siervo de Literatura' },
  siervo_cuentas: { role: 'siervo_cuentas', pin: '', name: 'Siervo de Cuentas' },
  siervo_discursos: { role: 'siervo_discursos', pin: '', name: 'Siervo de Discursos Públicos' },
  superintendente_grupo: { role: 'superintendente_grupo', pin: '', name: 'Superintendente de Grupo' },
  encargado_mantenimiento: { role: 'encargado_mantenimiento', pin: '', name: 'Mantenimiento y Aseo' },
  encargado_audiovideo: { role: 'encargado_audiovideo', pin: '', name: 'Audio y Video' },
  encargado_acomodadores: { role: 'encargado_acomodadores', pin: '', name: 'Acomodadores' },
  encargado_cartelera: { role: 'encargado_cartelera', pin: '', name: 'Cartelera / Anuncios' },
  publico: { role: 'publico', pin: '', name: 'Publicador / Cartelera' },
};

// Default initial publisher pins: Los PINs son estrictamente ÚNICOS por cada publicador/hermano
const DEFAULT_PUBLISHER_PINS: PublisherPinRecord[] = [];

const DEFAULT_INITIAL_ROLES: UserRoleRecord[] = [];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => null,
  signOutUser: async () => {},
  error: null,
  activeRole: 'publico',
  activeRoles: [],
  effectiveRoleInfo: THEOCRATIC_ROLES.publico,
  permissions: NO_PERMISSIONS,
  isAdmin: false,
  setActiveRole: () => {},
  setActiveRoles: () => {},
  currentBrotherName: null,
  setIdentifiedBrother: () => {},
  userRolesList: [],
  rolePinsMap: DEFAULT_ROLE_PINS,
  publisherPinsList: DEFAULT_PUBLISHER_PINS,
  currentPublisherId: null,
  setIdentifiedPublisher: () => {},
  identifyRoleByPersonalPin: async () => ({ success: false, message: '' }),
  assignPersonalPinToPublisher: () => ({ success: false, message: '' }),
  removePublisherPin: () => {},
  generateUniquePublisherPin: () => '1000',
  assignPersonalPinToRole: () => {},
  assignRoleToEmail: () => {},
  removeRoleFromEmail: () => {},
  isCoordinator: false,
  userProfile: null,
  updateUserProfile: async () => ({ success: true }),
  logAction: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Profile state (almacenado en Firestore: /users/{userId})
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const isDemo =
        typeof window !== 'undefined' && localStorage.getItem('kongre_demo_mode') === 'true';

      if (isDemo) {
        const demoCached = localStorage.getItem('kongre_demo_user_profile');
        if (demoCached) {
          try {
            return JSON.parse(demoCached);
          } catch {}
        }
        return {
          uid: 'demo-user',
          email: 'carlos.mendoza@kongre-demo.org',
          displayName: 'Carlos Mendoza',
          photoURL: '',
          phone: '+52 55 1234 5678',
          secondaryEmail: '',
          preferredContactMethod: 'whatsapp',
          contactTimePreference: 'anytime',
          notificationsEnabled: true,
          notes: 'Coordinador en Modo Demostración',
          updatedAt: new Date().toISOString(),
        };
      }

      const activeCached = localStorage.getItem('kongre_user_profile_active');
      const fallbackPhoto =
        localStorage.getItem('kongre_user_photo') ||
        localStorage.getItem('kongre_google_photo') ||
        localStorage.getItem('kongre_coordinator_photo') ||
        '';

      if (activeCached) {
        const parsed = JSON.parse(activeCached);
        if (!parsed.photoURL && fallbackPhoto) parsed.photoURL = fallbackPhoto;
        return parsed;
      }
      const guestCached = localStorage.getItem('kongre_user_profile_guest');
      if (guestCached) {
        const parsed = JSON.parse(guestCached);
        if (!parsed.photoURL && fallbackPhoto) parsed.photoURL = fallbackPhoto;
        return parsed;
      }
      if (fallbackPhoto) {
        return {
          uid: 'guest',
          email: localStorage.getItem('kongre_user_email') || '',
          displayName: localStorage.getItem(LOCAL_STORAGE_BROTHER_NAME_KEY) || 'Usuario',
          photoURL: fallbackPhoto,
          phone: '',
          secondaryEmail: '',
          preferredContactMethod: 'whatsapp',
          contactTimePreference: 'anytime',
          notificationsEnabled: true,
          notes: '',
          updatedAt: new Date().toISOString(),
        };
      }
    } catch {}
    return null;
  });

  // Publisher Unique PINs Directory (Los PINs son únicos por hermano/publicador)
  const [publisherPinsList, setPublisherPinsList] = useState<PublisherPinRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PUBLISHER_PINS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar registros dummy anteriores que asignaban un pin por cada rol
          const cleaned = parsed.filter(
            (p) =>
              !p.publisherId?.startsWith('pub_sec') &&
              !p.publisherId?.startsWith('pub_vym') &&
              !p.publisherId?.startsWith('pub_terr') &&
              !p.publisherId?.startsWith('pub_lit') &&
              !p.publisherId?.startsWith('pub_cuen') &&
              !p.publisherId?.startsWith('pub_disc')
          );
          return cleaned;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_PUBLISHER_PINS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PUBLISHER_PINS_KEY, JSON.stringify(publisherPinsList));
    localStorage.setItem('kongre_publisher_unique_pins_v1', JSON.stringify(publisherPinsList));
  }, [publisherPinsList]);

  // Sincronización en tiempo real de PINs de publicadores entre ventanas, pestañas y Firestore
  useEffect(() => {
    const handlePinsUpdated = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          setPublisherPinsList(detail);
          return;
        }
        const saved =
          localStorage.getItem(LOCAL_STORAGE_PUBLISHER_PINS_KEY) ||
          localStorage.getItem('kongre_publisher_unique_pins_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPublisherPinsList(parsed);
          }
        }
      } catch {}
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === LOCAL_STORAGE_PUBLISHER_PINS_KEY ||
        e.key === 'kongre_publisher_unique_pins_v1' ||
        e.key === 'teocratic_app_data_v1_publishers'
      ) {
        handlePinsUpdated(e as any);
      }
    };

    window.addEventListener('kongre_publisher_pins_updated', handlePinsUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('kongre_publisher_pins_updated', handlePinsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Role Personal PINs directory (legacy fallback)
  const [rolePinsMap, setRolePinsMap] = useState<Record<TheocraticRole, RolePinAssignment>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ROLE_PINS_KEY);
      if (saved) return { ...DEFAULT_ROLE_PINS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_ROLE_PINS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ROLE_PINS_KEY, JSON.stringify(rolePinsMap));
  }, [rolePinsMap]);

  // Current identified brother name
  const [currentBrotherName, setCurrentBrotherName] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_BROTHER_NAME_KEY);
  });

  // Current identified publisher ID (personal portal access)
  const [currentPublisherId, setCurrentPublisherId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_PUBLISHER_ID_KEY);
  });

  const setIdentifiedPublisher = (publisherId: string | null, name?: string) => {
    setCurrentPublisherId(publisherId);
    if (publisherId) {
      localStorage.setItem(LOCAL_STORAGE_PUBLISHER_ID_KEY, publisherId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_PUBLISHER_ID_KEY);
      localStorage.removeItem('kongre_session_pin_v2');
      localStorage.removeItem('kongre_identified_brother');
    }
    if (name && !isGenericIdentityName(name)) {
      setCurrentBrotherName(name);
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, name);
    }
  };

  // User roles directory
  const [userRolesList, setUserRolesList] = useState<UserRoleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ROLES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_ROLES;
  });

  // Save roles directory
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ROLES_KEY, JSON.stringify(userRolesList));
  }, [userRolesList]);

  // Active roles state (soporta asignación de múltiples roles teocráticos simultáneos)
  const [activeRoles, setActiveRolesState] = useState<TheocraticRole[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ROLES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: any) => normalizeTheocraticRole(r));
        }
      }
    } catch {}
    return [];
  });

  // Active role state
  const [activeRole, setActiveRoleState] = useState<TheocraticRole>(() => {
    try {
      const savedCoordPin = localStorage.getItem('kongre_coordinator_pin');
      const sessionPin = localStorage.getItem('kongre_session_pin_v2');
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY) as TheocraticRole;
      if (savedCoordPin && (sessionPin === savedCoordPin || saved === 'coordinador')) {
        return 'coordinador';
      }
      if (saved && THEOCRATIC_ROLES[saved]) return saved;
    } catch {
      // fallback
    }
    return 'publico';
  });

  const setActiveRoles = (roles: TheocraticRole[]) => {
    const normalized = roles.map((r) => normalizeTheocraticRole(r));
    setActiveRolesState(normalized);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLES_KEY, JSON.stringify(normalized));
    if (normalized.length > 0) {
      setActiveRoleState(normalized[0]);
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY, normalized[0]);
    } else {
      setActiveRoleState('publico');
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY, 'publico');
    }
  };

  const setActiveRole = (role: TheocraticRole) => {
    const norm = normalizeTheocraticRole(role);
    setActiveRoleState(norm);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY, norm);
    setActiveRolesState([norm]);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLES_KEY, JSON.stringify([norm]));
  };

  /**
   * Genera un PIN numérico de 4 dígitos seguro y único para un publicador
   */
  const generateUniquePublisherPin = (): string => {
    const existingPins = publisherPinsList.map((p) => p.pin.trim()).filter(Boolean);
    return generateSecurePublisherPin(existingPins);
  };

  /**
   * Asignar o actualizar el PIN personal único de un publicador y su rol teocrático
   * Valida estrictamente que ningún otro publicador tenga el mismo PIN
   */
  const assignPersonalPinToPublisher = (
    publisherId: string,
    pin: string,
    role: TheocraticRole,
    name: string,
    email?: string,
    privilege?: string
  ): { success: boolean; message: string } => {
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, message: 'El PIN debe tener al menos 4 dígitos.' };
    }

    // Validación de unicidad: Verificar si otro publicador ya usa este PIN
    const duplicate = publisherPinsList.find(
      (p) => p.pin.trim() === cleanPin && p.publisherId !== publisherId
    );

    if (duplicate) {
      return {
        success: false,
        message: `El PIN ${cleanPin} ya pertenece al hermano "${duplicate.name}". Los PINs deben ser únicos por cada publicador.`,
      };
    }

    setPublisherPinsList((prev) => {
      const existingIndex = prev.findIndex((p) => p.publisherId === publisherId);
      const newRecord: PublisherPinRecord = {
        publisherId,
        name: name.trim(),
        role,
        pin: cleanPin,
        email: email?.trim(),
        privilege: privilege?.trim(),
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newRecord;
        return updated;
      }
      return [...prev, newRecord];
    });

    // Sincronizar también con rolePinsMap para compatibilidad
    setRolePinsMap((prev) => ({
      ...prev,
      [role]: {
        role,
        pin: cleanPin,
        name: name.trim(),
        email: email?.trim(),
      },
    }));

    if (email) {
      assignRoleToEmail(email, role, name.trim(), cleanPin);
    }

    return {
      success: true,
      message: `PIN único ${cleanPin} asignado con éxito a ${name} con el rol de ${THEOCRATIC_ROLES[role]?.name}.`,
    };
  };

  const removePublisherPin = (publisherId: string) => {
    setPublisherPinsList((prev) => {
      const nextList = prev.filter((p) => p.publisherId !== publisherId);
      try {
        localStorage.setItem(LOCAL_STORAGE_PUBLISHER_PINS_KEY, JSON.stringify(nextList));
        localStorage.setItem('kongre_publisher_unique_pins_v1', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    // Si la sesión activa de publicador en este dispositivo es la que se revoca, cerrarla de inmediato
    if (currentPublisherId === publisherId) {
      setIdentifiedPublisher(null);
      setActiveRole('publico');
    }

    // Emitir evento para sincronización reactiva inmediata
    window.dispatchEvent(new CustomEvent('kongre_publisher_pins_updated'));
  };

  /**
   * Alias de compatibilidad para asignar PIN a rol/hermano
   */
  const assignPersonalPinToRole = (
    role: TheocraticRole,
    pin: string,
    brotherName?: string,
    email?: string
  ) => {
    const finalName = brotherName?.trim() || THEOCRATIC_ROLES[role]?.name || role;
    assignPersonalPinToPublisher(`pub_${role}`, pin, role, finalName, email);
  };

  /**
   * Identify brother and activate role using their PIN Personal
   * (El PIN personal es ÚNICO por publicador)
   */
  const identifyRoleByPersonalPin = async (
    pin: string
  ): Promise<{ success: boolean; role?: TheocraticRole; name?: string; publisherId?: string; message: string }> => {
    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, message: 'El PIN Personal debe tener al menos 4 dígitos.' };
    }

    const resolveNonGenericName = (candidate?: string | null, targetRole?: TheocraticRole): string => {
      if (candidate && !isGenericIdentityName(candidate)) return candidate.trim();
      // Only for coordinator role may we consider saved coordinator name
      if (targetRole === 'coordinador') {
        const savedCoord = localStorage.getItem('kongre_coordinator_name');
        if (savedCoord && !isGenericIdentityName(savedCoord)) return savedCoord.trim();
        const googleName = localStorage.getItem('kongre_google_display_name');
        if (googleName && !isGenericIdentityName(googleName)) return googleName.trim();
        try {
          const rawSettings = localStorage.getItem('kongre_saved_settings_backup') || localStorage.getItem('kongre_gestor_settings');
          if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            if (parsed.coordinatorName && !isGenericIdentityName(parsed.coordinatorName)) {
              return parsed.coordinatorName.trim();
            }
          }
        } catch {}
      }
      return candidate && !isGenericIdentityName(candidate) ? candidate.trim() : '';
    };

    // 0. Comprobar directamente contra el PIN de Coordinador guardado en este dispositivo (o PIN maestro)
    const savedCoordPin = localStorage.getItem('kongre_coordinator_pin');
    if (savedCoordPin && savedCoordPin.trim() === cleanPin) {
      setActiveRole('coordinador');
      const savedCoord = localStorage.getItem('kongre_coordinator_name');
      const resolvedName = savedCoord || resolveNonGenericName(null, 'coordinador') || 'Coordinador';
      setCurrentBrotherName(resolvedName);
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, resolvedName);
      localStorage.setItem('kongre_identified_brother', resolvedName);
      localStorage.setItem('kongre_session_pin_v2', cleanPin);

      await insertAuditLog({
        accion: 'login',
        hermano_nid: 'coordinador-pin',
        hermano_nombre: resolvedName,
        modulo: 'auth',
        detalles: 'Inicio de sesión exitoso con PIN de Coordinador',
      });

      return {
        success: true,
        role: 'coordinador',
        name: resolvedName,
        message: `¡Identificación exitosa! Bienvenido, ${resolvedName} (Coordinador).`,
      };
    }

    // Helper para resolver lista de roles de un publicador (incluyendo anciano + departamentos múltiples)
    const resolveAllRoles = (primary: TheocraticRole, privilege?: string, extraRoles?: string[]): TheocraticRole[] => {
      const set = new Set<TheocraticRole>([primary]);
      if (privilege === 'anciano') set.add('anciano');
      if (Array.isArray(extraRoles)) {
        extraRoles.forEach((r) => {
          if (r && THEOCRATIC_ROLES[r as TheocraticRole]) {
            set.add(r as TheocraticRole);
          }
        });
      }
      return Array.from(set);
    };

    // 1. Search in unique publisher PINs directory (Principal: Por Publicador)
    const foundPublisher = publisherPinsList.find(
      (entry) => entry.pin && entry.pin.trim().length >= 4 && entry.pin.trim() === cleanPin
    );

    if (foundPublisher) {
      const rolesList = resolveAllRoles(foundPublisher.role, foundPublisher.privilege, foundPublisher.roles);
      setActiveRoles(rolesList);
      const brotherName =
        foundPublisher.name && !isGenericIdentityName(foundPublisher.name)
          ? foundPublisher.name.trim()
          : resolveNonGenericName(foundPublisher.name, foundPublisher.role) || 'Hermano';
      if (!isGenericIdentityName(brotherName)) {
        setCurrentBrotherName(brotherName);
        localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, brotherName);
        localStorage.setItem('kongre_identified_brother', brotherName);
      }
      localStorage.setItem('kongre_session_pin_v2', cleanPin);
      if (foundPublisher.publisherId) {
        setIdentifiedPublisher(foundPublisher.publisherId, brotherName);
      }

      await insertAuditLog({
        accion: 'login',
        hermano_nid: foundPublisher.publisherId || 'personal',
        hermano_nombre: brotherName,
        modulo: 'auth',
        detalles: `Inicio de sesión con PIN único (${THEOCRATIC_ROLES[foundPublisher.role]?.name || foundPublisher.role})`,
      });

      return {
        success: true,
        role: foundPublisher.role,
        roles: rolesList,
        name: brotherName,
        publisherId: foundPublisher.publisherId,
        message: `¡Identificación exitosa! Bienvenido, ${brotherName}. Rol activo: ${THEOCRATIC_ROLES[foundPublisher.role]?.name}.`,
      };
    }

    // 2. Search in userRolesList
    const foundUserEntry = userRolesList.find(
      (entry) => entry.personalPin && entry.personalPin.trim().length >= 4 && entry.personalPin.trim() === cleanPin
    );

    if (foundUserEntry) {
      setActiveRole(foundUserEntry.role);
      const brotherName =
        foundUserEntry.name && !isGenericIdentityName(foundUserEntry.name)
          ? foundUserEntry.name.trim()
          : resolveNonGenericName(foundUserEntry.name, foundUserEntry.role) || 'Hermano';
      if (!isGenericIdentityName(brotherName)) {
        setCurrentBrotherName(brotherName);
        localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, brotherName);
        localStorage.setItem('kongre_identified_brother', brotherName);
      }
      localStorage.setItem('kongre_session_pin_v2', cleanPin);

      await insertAuditLog({
        accion: 'login',
        hermano_nid: foundUserEntry.email,
        hermano_nombre: brotherName,
        modulo: 'auth',
        detalles: `Inicio de sesión con PIN de usuario (${THEOCRATIC_ROLES[foundUserEntry.role]?.name || foundUserEntry.role})`,
      });

      return {
        success: true,
        role: foundUserEntry.role,
        name: brotherName || undefined,
        message: `¡Identificación exitosa! Bienvenido${brotherName ? `, ${brotherName}` : ''} (${THEOCRATIC_ROLES[foundUserEntry.role]?.name}).`,
      };
    }

    // 3b. Search directly in localStorage publishers or Firestore if this browser doesn't have the PIN yet (e.g. Browser 2)
    try {
      const rawPubs = localStorage.getItem('teocratic_app_data_v1_publishers');
      if (rawPubs) {
        const parsedPubs = JSON.parse(rawPubs);
        if (Array.isArray(parsedPubs)) {
          const matchPub = parsedPubs.find((p: any) => p.personalPin && String(p.personalPin).trim() === cleanPin);
          if (matchPub) {
            const role: TheocraticRole = (matchPub.theocraticRole || (matchPub.privilege === 'anciano' ? 'anciano' : 'publico')) as TheocraticRole;
            const rolesList = resolveAllRoles(role, matchPub.privilege, matchPub.theocraticRoles);
            const brotherName =
              matchPub.name && !isGenericIdentityName(matchPub.name)
                ? matchPub.name.trim()
                : resolveNonGenericName(matchPub.name, role) || 'Hermano';
            setActiveRoles(rolesList);
            if (!isGenericIdentityName(brotherName)) {
              setCurrentBrotherName(brotherName);
              localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, brotherName);
              localStorage.setItem('kongre_identified_brother', brotherName);
            }
            if (matchPub.id) {
              setIdentifiedPublisher(matchPub.id, brotherName);
            }
            assignPersonalPinToPublisher(matchPub.id, cleanPin, role, brotherName, matchPub.email, matchPub.privilege);

            await insertAuditLog({
              accion: 'login',
              hermano_nid: matchPub.id || 'publisher',
              hermano_nombre: brotherName,
              modulo: 'auth',
              detalles: `Inicio de sesión detectado en datos locales (${THEOCRATIC_ROLES[role]?.name || role})`,
            });

            return {
              success: true,
              role,
              roles: rolesList,
              name: brotherName,
              publisherId: matchPub.id,
              message: `¡Identificación exitosa! Bienvenido, ${brotherName}. Rol activo: ${THEOCRATIC_ROLES[role]?.name || role}.`,
            };
          }
        }
      }

      // Consultar en Supabase mediante descifrado si no se encuentra localmente
      const congId = (
        localStorage.getItem('kongre_congregation_number') ||
        localStorage.getItem('kongre_congregation_id') ||
        ''
      ).trim().toUpperCase();

      if (congId && congId.length >= 3 && !['1001', 'CENTRAL', 'MAIN', 'ID'].includes(congId)) {
        try {
          const congPinSaved = localStorage.getItem('kongre_registered_cong_pin') || localStorage.getItem('kongre_last_cong_pin') || cleanPin;
          const cloudRes = await supabaseSyncService.fetchAndDecryptCongregation(congId, congPinSaved);
          if (cloudRes.success && cloudRes.data) {
            const cloudPubs = cloudRes.data.publishers;
            if (Array.isArray(cloudPubs)) {
              const matchPub = cloudPubs.find((p: any) => p.personalPin && String(p.personalPin).trim() === cleanPin);
              if (matchPub) {
                const role: TheocraticRole = (matchPub.theocraticRole || (matchPub.privilege === 'anciano' ? 'anciano' : 'publico')) as TheocraticRole;
                const rolesList = resolveAllRoles(role, matchPub.privilege, matchPub.theocraticRoles);
                const brotherName =
                  matchPub.name && !isGenericIdentityName(matchPub.name)
                    ? matchPub.name.trim()
                    : resolveNonGenericName(matchPub.name, role) || 'Hermano';
                setActiveRoles(rolesList);
                if (!isGenericIdentityName(brotherName)) {
                  setCurrentBrotherName(brotherName);
                  localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, brotherName);
                  localStorage.setItem('kongre_identified_brother', brotherName);
                }
                if (matchPub.id) {
                  setIdentifiedPublisher(matchPub.id, brotherName);
                }
                assignPersonalPinToPublisher(matchPub.id, cleanPin, role, brotherName, matchPub.email, matchPub.privilege);
                localStorage.setItem('kongre_is_registered_congregation', 'true');
                localStorage.setItem('kongre_has_entered_app', 'true');

                await insertAuditLog({
                  accion: 'login',
                  hermano_nid: matchPub.id || 'cloud-publisher',
                  hermano_nombre: brotherName,
                  modulo: 'auth',
                  detalles: `Inicio de sesión sincronizado con Supabase (${THEOCRATIC_ROLES[role]?.name || role})`,
                });

                return {
                  success: true,
                  role,
                  roles: rolesList,
                  name: brotherName,
                  publisherId: matchPub.id,
                  message: `¡Identificación exitosa! Bienvenido, ${brotherName}. Rol activo: ${THEOCRATIC_ROLES[role]?.name || role}.`,
                };
              }
            }
          }
        } catch (searchErr) {
          console.warn('Aviso buscando PIN en Supabase:', searchErr);
        }
      }
    } catch (searchErr) {
      console.warn('Aviso en búsqueda de PIN:', searchErr);
    }

    // 4. Backward-compatibility: Check if PIN matches previously registered Coordinator App Lock PIN
    const coordLockPinHash = localStorage.getItem('kongre_security_pin_hash');
    if (coordLockPinHash) {
      try {
        const isValid = await verifyPasscode(cleanPin, coordLockPinHash);
        if (isValid) {
          setActiveRole('coordinador');
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          const resolvedName = savedCoord || resolveNonGenericName(null, 'coordinador');
          if (resolvedName) {
            setCurrentBrotherName(resolvedName);
            localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, resolvedName);
            localStorage.setItem('kongre_identified_brother', resolvedName);
          }

          await insertAuditLog({
            accion: 'login',
            hermano_nid: 'coordinador-pin',
            hermano_nombre: resolvedName || 'Coordinador',
            modulo: 'auth',
            detalles: 'Acceso autorizado con PIN de bloqueo de Coordinador',
          });

          return {
            success: true,
            role: 'coordinador',
            name: resolvedName || undefined,
            message: '¡Identificación exitosa con tu PIN de Coordinador!',
          };
        }
      } catch {
        // ignore hash error
      }
    }

    return {
      success: false,
      message: 'PIN Personal no reconocido. Introduce el PIN con el que registraste tu congregación o el asignado por los ancianos.',
    };
  };

  useEffect(() => {
    // 1. Obtener sesión actual de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const mapped: User = {
          uid: u.id,
          id: u.id,
          email: u.email || null,
          displayName: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : null),
          photoURL: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        };
        setUser(mapped);
      }
      setLoading(false);
    });

    // 2. Escuchar cambios de estado en Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      if (currentUser) {
        const mappedUser: User = {
          uid: currentUser.id,
          id: currentUser.id,
          email: currentUser.email || null,
          displayName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || (currentUser.email ? currentUser.email.split('@')[0] : null),
          photoURL: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
        };
        setUser(mappedUser);
        setLoading(false);
        if (mappedUser.photoURL) {
          localStorage.setItem('kongre_google_photo', mappedUser.photoURL);
          localStorage.setItem('kongre_user_photo', mappedUser.photoURL);
          localStorage.setItem('kongre_coordinator_photo', mappedUser.photoURL);
        }
        if (mappedUser.displayName) {
          localStorage.setItem('kongre_google_display_name', mappedUser.displayName);
        }
        if (mappedUser.email) {
          localStorage.setItem('kongre_user_email', mappedUser.email);
        }

        const email = (mappedUser.email || '').toLowerCase().trim();
        const found = userRolesList.find((r) => r.email.toLowerCase().trim() === email);
        const registeredCoordEmail = (
          localStorage.getItem('kongre_coordinator_email') || ''
        ).toLowerCase().trim();

        if (found) {
          setActiveRole(found.role);
          if (found.name) setCurrentBrotherName(found.name);
        } else if (registeredCoordEmail && email === registeredCoordEmail) {
          setActiveRole('coordinador');
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          const broName = savedCoord || mappedUser.displayName || 'Coordinador';
          setCurrentBrotherName(broName);
        } else {
          setActiveRole('publico');
        }
      } else {
        setUser(null);
        setLoading(false);
        // NO sobreescribir el rol si el usuario tiene una sesión local activa de Coordinador o de PIN
        const savedRole = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY) as TheocraticRole;
        const savedCoordPin = localStorage.getItem('kongre_coordinator_pin');
        const sessionPin = localStorage.getItem('kongre_session_pin_v2');
        if (savedCoordPin && (sessionPin === savedCoordPin || savedRole === 'coordinador')) {
          setActiveRole('coordinador');
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          if (savedCoord) setCurrentBrotherName(savedCoord);
        } else if (savedRole && savedRole !== 'publico') {
          setActiveRole(savedRole);
        } else {
          setActiveRole('publico');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userRolesList]);

  // Cargar el documento de perfil del usuario desde almacenamiento local y caché
  useEffect(() => {
    const isDemo =
      typeof window !== 'undefined' && localStorage.getItem('kongre_demo_mode') === 'true';

    if (isDemo) {
      const demoCached = localStorage.getItem('kongre_demo_user_profile');
      if (demoCached) {
        try {
          setUserProfile(JSON.parse(demoCached));
          return;
        } catch {}
      }
      setUserProfile({
        uid: 'demo-user',
        email: 'carlos.mendoza@kongre-demo.org',
        displayName: 'Carlos Mendoza',
        photoURL: '',
        phone: '+52 55 1234 5678',
        secondaryEmail: '',
        preferredContactMethod: 'whatsapp',
        contactTimePreference: 'anytime',
        notificationsEnabled: true,
        notes: 'Coordinador en Modo Demostración',
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (!user) {
      try {
        const fallbackPhoto =
          localStorage.getItem('kongre_user_photo') ||
          localStorage.getItem('kongre_google_photo') ||
          localStorage.getItem('kongre_coordinator_photo') ||
          '';

        const activeCached = localStorage.getItem('kongre_user_profile_active');
        if (activeCached) {
          const parsed = JSON.parse(activeCached);
          if (!parsed.photoURL && fallbackPhoto) parsed.photoURL = fallbackPhoto;
          setUserProfile(parsed);
          return;
        }

        const guestCached = localStorage.getItem('kongre_user_profile_guest');
        if (guestCached) {
          const parsed = JSON.parse(guestCached);
          if (!parsed.photoURL && fallbackPhoto) parsed.photoURL = fallbackPhoto;
          setUserProfile(parsed);
          return;
        }

        if (fallbackPhoto) {
          setUserProfile({
            uid: 'guest',
            email: localStorage.getItem('kongre_user_email') || '',
            displayName: currentBrotherName || 'Hermano',
            photoURL: fallbackPhoto,
            phone: '',
            secondaryEmail: '',
            preferredContactMethod: 'whatsapp',
            contactTimePreference: 'anytime',
            notificationsEnabled: true,
            notes: '',
            updatedAt: new Date().toISOString(),
          });
        }
      } catch {}
      return;
    }

    const fallbackPhoto = user.photoURL || localStorage.getItem('kongre_google_photo') || localStorage.getItem('kongre_user_photo') || '';
    const cached = localStorage.getItem(`kongre_user_profile_${user.uid}`) || localStorage.getItem('kongre_user_profile_active');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (!parsed.photoURL && fallbackPhoto) parsed.photoURL = fallbackPhoto;
        setUserProfile(parsed);
        return;
      } catch {}
    }

    const initial: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || currentBrotherName || (user.email ? 'Hno. ' + user.email.split('@')[0] : 'Usuario'),
      photoURL: fallbackPhoto,
      phone: '',
      secondaryEmail: '',
      preferredContactMethod: 'whatsapp',
      contactTimePreference: 'anytime',
      notificationsEnabled: true,
      notes: '',
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(initial);
    localStorage.setItem('kongre_user_profile_active', JSON.stringify(initial));
    localStorage.setItem(`kongre_user_profile_${user.uid}`, JSON.stringify(initial));
  }, [user]);

  /**
   * Actualiza los datos del perfil (foto, nombre visible, contacto) y los persiste en /users/{userId}
   */
  const updateUserProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const targetUid = user ? user.uid : 'guest';
      const targetEmail = user ? user.email || '' : '';
      const now = new Date().toISOString();

      const merged: UserProfile = {
        uid: targetUid,
        email: targetEmail || (userProfile?.email || ''),
        displayName: data.displayName !== undefined ? data.displayName.trim() : (userProfile?.displayName || user?.displayName || ''),
        photoURL: data.photoURL !== undefined ? data.photoURL.trim() : (userProfile?.photoURL || user?.photoURL || ''),
        phone: data.phone !== undefined ? data.phone.trim() : (userProfile?.phone || ''),
        secondaryEmail: data.secondaryEmail !== undefined ? data.secondaryEmail.trim() : (userProfile?.secondaryEmail || ''),
        preferredContactMethod: data.preferredContactMethod || userProfile?.preferredContactMethod || 'whatsapp',
        contactTimePreference: data.contactTimePreference || userProfile?.contactTimePreference || 'anytime',
        notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : (userProfile?.notificationsEnabled ?? true),
        notes: data.notes !== undefined ? data.notes.trim() : (userProfile?.notes || ''),
        congregationId: data.congregationId !== undefined ? data.congregationId : (userProfile?.congregationId || ''),
        congregationNumber: data.congregationNumber !== undefined ? data.congregationNumber : (userProfile?.congregationNumber || ''),
        congregationName: data.congregationName !== undefined ? data.congregationName : (userProfile?.congregationName || ''),
        updatedAt: now,
      };

      const isDemo =
        typeof window !== 'undefined' && localStorage.getItem('kongre_demo_mode') === 'true';

      if (isDemo) {
        localStorage.setItem('kongre_demo_user_profile', JSON.stringify(merged));
        setUserProfile(merged);
        if (merged.displayName) {
          setCurrentBrotherName(merged.displayName);
        }
        return { success: true };
      }

      // Guardar en almacenamiento local
      if (user && user.uid) {
        localStorage.setItem(`kongre_user_profile_${user.uid}`, JSON.stringify(merged));
      }

      // 2. Persistir localmente en memoria y almacenamiento local
      localStorage.setItem('kongre_user_profile_active', JSON.stringify(merged));
      localStorage.setItem(`kongre_user_profile_${targetUid}`, JSON.stringify(merged));
      if (merged.photoURL) {
        localStorage.setItem('kongre_user_photo', merged.photoURL);
        localStorage.setItem('kongre_coordinator_photo', merged.photoURL);
      } else {
        localStorage.removeItem('kongre_user_photo');
        localStorage.removeItem('kongre_google_photo');
        localStorage.removeItem('kongre_coordinator_photo');
      }
      setUserProfile(merged);

      // 3. Sincronizar el nombre activo en la sesión
      if (merged.displayName) {
        setCurrentBrotherName(merged.displayName);
        localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, merged.displayName);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error al guardar el perfil del usuario en Firestore:', err);
      return { success: false, error: err?.message || 'Error al guardar el perfil en Firestore.' };
    }
  };

  const signInWithGoogle = async (): Promise<User | null> => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      return null;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al iniciar sesión con Google mediante Supabase.';
      console.warn('Google sign-in error:', err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const signOutUser = async () => {
    try {
      if (currentBrotherName || currentPublisherId || user) {
        await insertAuditLog({
          accion: 'logout',
          hermano_nid: currentPublisherId || user?.uid || 'anonimo',
          hermano_nombre: currentBrotherName || user?.displayName || undefined,
          modulo: 'auth',
          detalles: `Cierre de sesión de ${currentBrotherName || 'usuario'}`,
        });
      }
      await supabase.auth.signOut();
      setUser(null);
      setActiveRole('publico');
      setActiveRolesState([]);
      setCurrentBrotherName(null);
      setIdentifiedPublisher(null);
      setUserProfile(null);
      localStorage.removeItem(LOCAL_STORAGE_BROTHER_NAME_KEY);
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem(LOCAL_STORAGE_PUBLISHER_ID_KEY);
      localStorage.removeItem('kongre_user_profile_active');
      localStorage.removeItem('kongre_user_profile_guest');
      localStorage.removeItem('kongre_has_entered_app');
      localStorage.removeItem('kongre_active_role_v1');
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ROLES_KEY);
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err?.message || 'Error al cerrar sesión.');
    }
  };

  const setIdentifiedBrother = (name: string) => {
    const clean = (name || '').trim();
    if (!clean) return;
    setCurrentBrotherName(clean);
    try {
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, clean);
    } catch {}
  };

  const assignRoleToEmail = (email: string, role: TheocraticRole, name?: string, personalPin?: string) => {
    const cleanEmail = email.toLowerCase().trim();
    setUserRolesList((prev) => {
      const filtered = prev.filter((r) => r.email.toLowerCase() !== cleanEmail);
      return [
        ...filtered,
        {
          email: cleanEmail,
          name: name?.trim() || cleanEmail.split('@')[0],
          role,
          personalPin: personalPin?.trim(),
          assignedAt: new Date().toISOString().split('T')[0],
        },
      ];
    });
  };

  const removeRoleFromEmail = (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    setUserRolesList((prev) => prev.filter((r) => r.email.toLowerCase() !== cleanEmail));
  };

  const effectiveRolesList = useMemo(() => {
    return activeRoles.length > 0 ? activeRoles : [activeRole];
  }, [activeRoles, activeRole]);

  const effectiveRoleInfo = THEOCRATIC_ROLES[activeRole] || THEOCRATIC_ROLES.publico;

  const permissions = useMemo(() => {
    return getPermissionsForRoles(effectiveRolesList);
  }, [effectiveRolesList]);

  const isAdmin = useMemo(() => {
    return (
      activeRole === 'coordinador' ||
      activeRoles.includes('coordinador') ||
      (userProfile as any)?.role === 'admin'
    );
  }, [activeRole, activeRoles, userProfile]);

  const isCoordinator =
    activeRole === 'coordinador' ||
    activeRoles.includes('coordinador') ||
    (typeof window !== 'undefined' &&
      !!localStorage.getItem('kongre_coordinator_pin') &&
      localStorage.getItem('kongre_session_pin_v2') === localStorage.getItem('kongre_coordinator_pin'));

  const logAction = useCallback(
    async (accion: string, modulo: string, detalles?: string) => {
      try {
        await insertAuditLog({
          accion,
          hermano_nid: currentPublisherId || user?.uid || 'anonimo',
          hermano_nombre: currentBrotherName || user?.displayName || undefined,
          modulo,
          detalles,
        });
      } catch (err) {
        console.warn('Aviso en logAction:', err);
      }
    },
    [currentPublisherId, user, currentBrotherName]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        error,
        activeRole,
        activeRoles,
        effectiveRoleInfo,
        permissions,
        isAdmin,
        setActiveRole,
        setActiveRoles,
        currentBrotherName,
        setIdentifiedBrother,
        userRolesList,
        rolePinsMap,
        publisherPinsList,
        currentPublisherId,
        setIdentifiedPublisher,
        identifyRoleByPersonalPin,
        assignPersonalPinToPublisher,
        removePublisherPin,
        generateUniquePublisherPin,
        assignPersonalPinToRole,
        assignRoleToEmail,
        removeRoleFromEmail,
        isCoordinator,
        userProfile,
        updateUserProfile,
        logAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const usePermissions = (): Permission => {
  const { permissions } = useAuth();
  return permissions;
};
