// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { TheocraticRole, TheocraticRoleInfo, THEOCRATIC_ROLES } from '../utils/rbac';

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  error: string | null;
  activeRole: TheocraticRole;
  effectiveRoleInfo: TheocraticRoleInfo;
  setActiveRole: (role: TheocraticRole) => void;
  currentBrotherName: string | null;
  userRolesList: UserRoleRecord[];
  rolePinsMap: Record<TheocraticRole, RolePinAssignment>;
  identifyRoleByPersonalPin: (pin: string) => Promise<{ success: boolean; role?: TheocraticRole; name?: string; message: string }>;
  assignPersonalPinToRole: (role: TheocraticRole, pin: string, brotherName?: string, email?: string) => void;
  assignRoleToEmail: (email: string, role: TheocraticRole, name?: string, personalPin?: string) => void;
  removeRoleFromEmail: (email: string) => void;
  isCoordinator: boolean;
}

const LOCAL_STORAGE_ROLES_KEY = 'kongre_user_roles_v1';
const LOCAL_STORAGE_ACTIVE_ROLE_KEY = 'kongre_active_role_v1';
const LOCAL_STORAGE_ROLE_PINS_KEY = 'kongre_role_personal_pins_v2';
const LOCAL_STORAGE_BROTHER_NAME_KEY = 'kongre_current_brother_name_v1';

// Default initial role pin assignments
const DEFAULT_ROLE_PINS: Record<TheocraticRole, RolePinAssignment> = {
  coordinador: { role: 'coordinador', pin: '1234', name: 'Coordinador del Cuerpo de Ancianos' },
  secretario: { role: 'secretario', pin: '2021', name: 'Secretario' },
  superintendente_vym: { role: 'superintendente_vym', pin: '2022', name: 'Superintendente de VyM' },
  siervo_territorios: { role: 'siervo_territorios', pin: '2023', name: 'Siervo de Territorios' },
  siervo_literatura: { role: 'siervo_literatura', pin: '2024', name: 'Siervo de Literatura' },
  siervo_cuentas: { role: 'siervo_cuentas', pin: '2025', name: 'Siervo de Cuentas' },
  siervo_discursos: { role: 'siervo_discursos', pin: '2026', name: 'Siervo de Discursos Públicos' },
  publico: { role: 'publico', pin: '0000', name: 'Publicador / Auditorio' },
};

const DEFAULT_INITIAL_ROLES: UserRoleRecord[] = [];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  error: null,
  activeRole: 'coordinador',
  effectiveRoleInfo: THEOCRATIC_ROLES.coordinador,
  setActiveRole: () => {},
  currentBrotherName: null,
  userRolesList: [],
  rolePinsMap: DEFAULT_ROLE_PINS,
  identifyRoleByPersonalPin: async () => ({ success: false, message: '' }),
  assignPersonalPinToRole: () => {},
  assignRoleToEmail: () => {},
  removeRoleFromEmail: () => {},
  isCoordinator: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role Personal PINs directory (Identificación de Roles por PIN Personal)
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

  // Active role state
  const [activeRole, setActiveRoleState] = useState<TheocraticRole>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY) as TheocraticRole;
      if (saved && THEOCRATIC_ROLES[saved]) return saved;
    } catch {
      // fallback
    }
    return 'coordinador';
  });

  const setActiveRole = (role: TheocraticRole) => {
    setActiveRoleState(role);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_ROLE_KEY, role);
  };

  /**
   * Identify brother and activate role using their PIN Personal
   * (El PIN personal funciona como código de identificación de roles dentro de la congregación)
   */
  const identifyRoleByPersonalPin = async (
    pin: string
  ): Promise<{ success: boolean; role?: TheocraticRole; name?: string; message: string }> => {
    const cleanPin = pin.trim();
    if (!cleanPin) {
      return { success: false, message: 'Ingresa tu PIN Personal.' };
    }

    // 1. Search in rolePinsMap
    const foundRoleEntry = Object.values(rolePinsMap).find(
      (entry) => entry.pin.trim() === cleanPin
    );

    if (foundRoleEntry) {
      setActiveRole(foundRoleEntry.role);
      setCurrentBrotherName(foundRoleEntry.name);
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, foundRoleEntry.name);

      return {
        success: true,
        role: foundRoleEntry.role,
        name: foundRoleEntry.name,
        message: `¡Identificación exitosa! Bienvenido, ${foundRoleEntry.name} (${THEOCRATIC_ROLES[foundRoleEntry.role].name}).`,
      };
    }

    // 2. Search in userRolesList
    const foundUserEntry = userRolesList.find(
      (entry) => entry.personalPin && entry.personalPin.trim() === cleanPin
    );

    if (foundUserEntry) {
      setActiveRole(foundUserEntry.role);
      const brotherName = foundUserEntry.name || 'Hermano Autorizado';
      setCurrentBrotherName(brotherName);
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, brotherName);

      return {
        success: true,
        role: foundUserEntry.role,
        name: brotherName,
        message: `¡Identificación exitosa! Bienvenido, ${brotherName} (${THEOCRATIC_ROLES[foundUserEntry.role].name}).`,
      };
    }

    return {
      success: false,
      message: 'PIN Personal no reconocido. Verifica el código con el Coordinador.',
    };
  };

  /**
   * Assign or update a brother's Personal PIN for a theocratic role
   */
  const assignPersonalPinToRole = (
    role: TheocraticRole,
    pin: string,
    brotherName?: string,
    email?: string
  ) => {
    const cleanPin = pin.trim();
    const finalName = brotherName?.trim() || THEOCRATIC_ROLES[role]?.name || role;

    setRolePinsMap((prev) => ({
      ...prev,
      [role]: {
        role,
        pin: cleanPin,
        name: finalName,
        email: email?.trim(),
      },
    }));

    if (email) {
      assignRoleToEmail(email, role, finalName, cleanPin);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser?.email) {
        const email = currentUser.email.toLowerCase();
        const found = userRolesList.find((r) => r.email.toLowerCase() === email);
        if (found) {
          setActiveRole(found.role);
        }
      }
    });
    return () => unsubscribe();
  }, [userRolesList]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor, habilite las ventanas emergentes para iniciar sesión con Google.');
        return;
      }
      console.warn('Google sign-in status:', err?.code, err?.message);
      setError(err?.message || 'Error al iniciar sesión con Google.');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setActiveRole('publico');
      setCurrentBrotherName(null);
      localStorage.removeItem(LOCAL_STORAGE_BROTHER_NAME_KEY);
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err?.message || 'Error al cerrar sesión.');
    }
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

  const effectiveRoleInfo = THEOCRATIC_ROLES[activeRole] || THEOCRATIC_ROLES.coordinador;
  const isCoordinator = activeRole === 'coordinador';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        error,
        activeRole,
        effectiveRoleInfo,
        setActiveRole,
        currentBrotherName,
        userRolesList,
        rolePinsMap,
        identifyRoleByPersonalPin,
        assignPersonalPinToRole,
        assignRoleToEmail,
        removeRoleFromEmail,
        isCoordinator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
