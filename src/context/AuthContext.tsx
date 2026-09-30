// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { TheocraticRole, TheocraticRoleInfo, THEOCRATIC_ROLES } from '../utils/rbac';

export interface UserRoleRecord {
  email: string;
  name?: string;
  role: TheocraticRole;
  assignedAt?: string;
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
  userRolesList: UserRoleRecord[];
  assignRoleToEmail: (email: string, role: TheocraticRole, name?: string) => void;
  removeRoleFromEmail: (email: string) => void;
  isCoordinator: boolean;
}

const LOCAL_STORAGE_ROLES_KEY = 'kongre_user_roles_v1';
const LOCAL_STORAGE_ACTIVE_ROLE_KEY = 'kongre_active_role_v1';

// Seed initial administrator
const DEFAULT_INITIAL_ROLES: UserRoleRecord[] = [
  {
    email: 'hectorguti95@gmail.com',
    name: 'Héctor Gutiérrez',
    role: 'coordinador',
    assignedAt: '2026-01-01',
  },
  {
    email: 'secretario@kongre.org',
    name: 'Secretario Local',
    role: 'secretario',
    assignedAt: '2026-01-01',
  },
  {
    email: 'vym@kongre.org',
    name: 'Supt. Vida y Ministerio',
    role: 'superintendente_vym',
    assignedAt: '2026-01-01',
  },
  {
    email: 'discursos@kongre.org',
    name: 'Siervo de Discursos',
    role: 'siervo_discursos',
    assignedAt: '2026-01-01',
  },
  {
    email: 'territorios@kongre.org',
    name: 'Siervo de Territorios',
    role: 'siervo_territorios',
    assignedAt: '2026-01-01',
  },
  {
    email: 'literatura@kongre.org',
    name: 'Siervo de Literatura',
    role: 'siervo_literatura',
    assignedAt: '2026-01-01',
  },
  {
    email: 'cuentas@kongre.org',
    name: 'Siervo de Cuentas',
    role: 'siervo_cuentas',
    assignedAt: '2026-01-01',
  },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  error: null,
  activeRole: 'coordinador',
  effectiveRoleInfo: THEOCRATIC_ROLES.coordinador,
  setActiveRole: () => {},
  userRolesList: [],
  assignRoleToEmail: () => {},
  removeRoleFromEmail: () => {},
  isCoordinator: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Determine user's assigned role based on their Google account
  const defaultRoleForUser = useMemo<TheocraticRole>(() => {
    if (!user || !user.email) {
      // Not logged in: defaults to public reader mode or coordinator for preview
      return 'coordinador';
    }

    const email = user.email.toLowerCase().trim();
    // Primary app owner is always coordinator
    if (email === 'hectorguti95@gmail.com') {
      return 'coordinador';
    }

    const found = userRolesList.find((r) => r.email.toLowerCase() === email);
    if (found) {
      return found.role;
    }

    // Default for any authenticated brother: coordinador or publico
    return 'coordinador';
  }, [user, userRolesList]);

  // Active role can be toggled by the user (e.g. previewing "Modo Cartelera" or testing as "Secretario")
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
      console.error('Error signing in with Google:', err);
      setError(err?.message || 'Error al iniciar sesión con Google.');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setActiveRole('publico');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err?.message || 'Error al cerrar sesión.');
    }
  };

  const assignRoleToEmail = (email: string, role: TheocraticRole, name?: string) => {
    const cleanEmail = email.toLowerCase().trim();
    setUserRolesList((prev) => {
      const filtered = prev.filter((r) => r.email.toLowerCase() !== cleanEmail);
      return [
        ...filtered,
        {
          email: cleanEmail,
          name: name?.trim() || cleanEmail.split('@')[0],
          role,
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
        userRolesList,
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
