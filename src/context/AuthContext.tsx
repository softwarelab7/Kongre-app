// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { TheocraticRole, TheocraticRoleInfo, THEOCRATIC_ROLES } from '../utils/rbac';
import { generateSecurePublisherPin, verifyPasscode, sanitizeForFirestore } from '../utils/theocraticSecurity';
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
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  error: string | null;
  activeRole: TheocraticRole;
  effectiveRoleInfo: TheocraticRoleInfo;
  setActiveRole: (role: TheocraticRole) => void;
  currentBrotherName: string | null;
  userRolesList: UserRoleRecord[];
  rolePinsMap: Record<TheocraticRole, RolePinAssignment>;
  publisherPinsList: PublisherPinRecord[];
  identifyRoleByPersonalPin: (pin: string) => Promise<{ success: boolean; role?: TheocraticRole; name?: string; message: string }>;
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
}

const LOCAL_STORAGE_ROLES_KEY = 'kongre_user_roles_v1';
const LOCAL_STORAGE_ACTIVE_ROLE_KEY = 'kongre_active_role_v1';
const LOCAL_STORAGE_ROLE_PINS_KEY = 'kongre_role_personal_pins_v2';
const LOCAL_STORAGE_PUBLISHER_PINS_KEY = 'kongre_publisher_personal_pins_v4';
const LOCAL_STORAGE_BROTHER_NAME_KEY = 'kongre_current_brother_name_v1';

// Default initial role pin assignments (vacíos por defecto: los PINs pertenecen a publicadores)
const DEFAULT_ROLE_PINS: Record<TheocraticRole, RolePinAssignment> = {
  coordinador: { role: 'coordinador', pin: '', name: 'Coordinador del Cuerpo de Ancianos' },
  secretario: { role: 'secretario', pin: '', name: 'Secretario' },
  superintendente_vym: { role: 'superintendente_vym', pin: '', name: 'Superintendente de VyM' },
  siervo_territorios: { role: 'siervo_territorios', pin: '', name: 'Siervo de Territorios' },
  siervo_literatura: { role: 'siervo_literatura', pin: '', name: 'Siervo de Literatura' },
  siervo_cuentas: { role: 'siervo_cuentas', pin: '', name: 'Siervo de Cuentas' },
  siervo_discursos: { role: 'siervo_discursos', pin: '', name: 'Siervo de Discursos Públicos' },
  publico: { role: 'publico', pin: '', name: 'Publicador / Auditorio' },
};

// Default initial publisher pins: Los PINs son estrictamente ÚNICOS por cada publicador/hermano
const DEFAULT_PUBLISHER_PINS: PublisherPinRecord[] = [];

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
  publisherPinsList: DEFAULT_PUBLISHER_PINS,
  identifyRoleByPersonalPin: async () => ({ success: false, message: '' }),
  assignPersonalPinToPublisher: () => ({ success: false, message: '' }),
  removePublisherPin: () => {},
  generateUniquePublisherPin: () => '1000',
  assignPersonalPinToRole: () => {},
  assignRoleToEmail: () => {},
  removeRoleFromEmail: () => {},
  isCoordinator: true,
  userProfile: null,
  updateUserProfile: async () => ({ success: true }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Profile state (almacenado en Firestore: /users/{userId})
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('kongre_user_profile_active');
      if (cached) return JSON.parse(cached);
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
  }, [publisherPinsList]);

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
    setPublisherPinsList((prev) => prev.filter((p) => p.publisherId !== publisherId));
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
  ): Promise<{ success: boolean; role?: TheocraticRole; name?: string; message: string }> => {
    const cleanPin = pin.trim();
    if (!cleanPin) {
      return { success: false, message: 'Ingresa tu PIN Personal.' };
    }

    // 1. Search in unique publisher PINs directory (Principal: Por Publicador)
    const foundPublisher = publisherPinsList.find(
      (entry) => entry.pin.trim() === cleanPin
    );

    if (foundPublisher) {
      setActiveRole(foundPublisher.role);
      setCurrentBrotherName(foundPublisher.name);
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, foundPublisher.name);

      return {
        success: true,
        role: foundPublisher.role,
        name: foundPublisher.name,
        message: `¡Identificación exitosa! Bienvenido, ${foundPublisher.name}. Rol activo: ${THEOCRATIC_ROLES[foundPublisher.role]?.name}.`,
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
        message: `¡Identificación exitosa! Bienvenido, ${brotherName} (${THEOCRATIC_ROLES[foundUserEntry.role]?.name}).`,
      };
    }

    // 3. Fallback to rolePinsMap
    const foundRoleEntry = Object.values(rolePinsMap).find(
      (entry) => entry.pin && entry.pin.trim() === cleanPin
    );

    if (foundRoleEntry) {
      setActiveRole(foundRoleEntry.role);
      setCurrentBrotherName(foundRoleEntry.name);
      localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, foundRoleEntry.name);

      return {
        success: true,
        role: foundRoleEntry.role,
        name: foundRoleEntry.name,
        message: `¡Identificación exitosa! Bienvenido, ${foundRoleEntry.name} (${THEOCRATIC_ROLES[foundRoleEntry.role]?.name}).`,
      };
    }

    // 4. Backward-compatibility: Check if PIN matches previously registered Coordinator App Lock PIN
    const coordLockPinHash = localStorage.getItem('kongre_security_pin_hash');
    if (coordLockPinHash) {
      try {
        const isValid = await verifyPasscode(cleanPin, coordLockPinHash);
        if (isValid) {
          setActiveRole('coordinador');
          const name = 'Coordinador del Cuerpo de Ancianos';
          setCurrentBrotherName(name);
          localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, name);
          return {
            success: true,
            role: 'coordinador',
            name,
            message: '¡Identificación exitosa con tu PIN de Coordinador registrado previamente!',
          };
        }
      } catch {
        // ignore hash error
      }
    }

    // 5. Backward-compatibility: Check if PIN matches previously registered Congregation PIN
    const congPinHash = localStorage.getItem('kongre_security_congregation_pin_hash');
    if (congPinHash) {
      try {
        const isValid = await verifyPasscode(cleanPin, congPinHash);
        if (isValid) {
          setActiveRole('coordinador');
          const name = 'Coordinador / Anciano';
          setCurrentBrotherName(name);
          localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, name);
          return {
            success: true,
            role: 'coordinador',
            name,
            message: '¡Identificación exitosa con PIN de Congregación registrado previamente!',
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser?.email) {
        const email = currentUser.email.toLowerCase().trim();
        const found = userRolesList.find((r) => r.email.toLowerCase().trim() === email);
        if (found) {
          setActiveRole(found.role);
          if (found.name) setCurrentBrotherName(found.name);
        } else if (email === 'hectorguti95@gmail.com') {
          // Automatic owner/coordinator recognition for registered user
          setActiveRole('coordinador');
          const broName = currentUser.displayName || 'Coordinador';
          setCurrentBrotherName(broName);
        }
      }
    });
    return () => unsubscribe();
  }, [userRolesList]);

  // Firestore Sync: Escuchar y cargar el documento de perfil del usuario en /users/{userId}
  useEffect(() => {
    if (!user) {
      try {
        const cached = localStorage.getItem('kongre_user_profile_guest');
        if (cached) setUserProfile(JSON.parse(cached));
      } catch {}
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const loaded: UserProfile = {
            uid: user.uid,
            email: data.email || user.email || '',
            displayName: data.displayName || user.displayName || (currentBrotherName || 'Hno. ' + (user.email ? user.email.split('@')[0] : 'Usuario')),
            photoURL: data.photoURL || user.photoURL || '',
            phone: data.phone || '',
            secondaryEmail: data.secondaryEmail || '',
            preferredContactMethod: data.preferredContactMethod || 'whatsapp',
            contactTimePreference: data.contactTimePreference || 'anytime',
            notificationsEnabled: data.notificationsEnabled ?? true,
            notes: data.notes || '',
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          setUserProfile(loaded);
          localStorage.setItem('kongre_user_profile_active', JSON.stringify(loaded));
          localStorage.setItem(`kongre_user_profile_${user.uid}`, JSON.stringify(loaded));
          if (loaded.displayName) {
            setCurrentBrotherName(loaded.displayName);
            localStorage.setItem(LOCAL_STORAGE_BROTHER_NAME_KEY, loaded.displayName);
          }
        } else {
          // Si el documento en Firestore no existe todavía, crear objeto inicial predeterminado
          const initial: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || (currentBrotherName || (user.email?.toLowerCase() === 'hectorguti95@gmail.com' ? 'Hno. Héctor Gutiérrez' : 'Hno. ' + (user.email ? user.email.split('@')[0] : 'Usuario'))),
            photoURL: user.photoURL || '',
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
        }
      },
      (err) => {
        console.warn('Aviso de sincronización de perfil Firestore:', err);
      }
    );

    return () => unsubscribeProfile();
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
        updatedAt: now,
      };

      // 1. Guardar en Firestore en el documento /users/{userId}
      if (user && user.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, sanitizeForFirestore(merged), { merge: true });

        // Actualizar datos del objeto nativo de Firebase Auth si es posible
        try {
          await updateProfile(user, {
            displayName: merged.displayName || undefined,
            photoURL: merged.photoURL || undefined,
          });
        } catch (authErr) {
          console.warn('Aviso al actualizar perfil en Auth:', authErr);
        }
      }

      // 2. Persistir localmente en memoria y almacenamiento local
      localStorage.setItem('kongre_user_profile_active', JSON.stringify(merged));
      localStorage.setItem(`kongre_user_profile_${targetUid}`, JSON.stringify(merged));
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
      setUserProfile(null);
      localStorage.removeItem(LOCAL_STORAGE_BROTHER_NAME_KEY);
      localStorage.removeItem('kongre_user_profile_active');
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
        publisherPinsList,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
