// src/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel, disableNetwork, enableNetwork } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Silence Firestore internal log noise and backoff warnings
try {
  setLogLevel('silent');
} catch {
  // ignore
}

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore using the configured database ID
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const pauseFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
  } catch {
    // ignore
  }
};

export const resumeFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
  } catch {
    // ignore
  }
};

export const isQuotaError = (err: any): boolean => {
  if (!err) return false;
  const code = err.code || err?.name || '';
  const message = typeof err.message === 'string' ? err.message : '';
  const stringified = String(err);
  return (
    code === 'resource-exhausted' ||
    message.includes('resource-exhausted') ||
    message.includes('Quota limit exceeded') ||
    message.includes('quota metric') ||
    message.includes('Quota exceeded') ||
    message.includes('Free daily write units') ||
    stringified.includes('resource-exhausted') ||
    stringified.includes('Quota limit exceeded')
  );
};

export const isFirestoreQuotaExceeded = (): boolean => {
  try {
    const saved = localStorage.getItem('kongre_firestore_quota_cooldown');
    if (!saved) return false;
    const until = parseInt(saved, 10);
    const isExceeded = !isNaN(until) && Date.now() < until;
    if (!isExceeded) {
      localStorage.removeItem('kongre_firestore_quota_cooldown');
    }
    return isExceeded;
  } catch {
    return false;
  }
};

export const clearFirestoreQuotaCooldown = async (): Promise<void> => {
  try {
    localStorage.removeItem('kongre_firestore_quota_cooldown');
    await resumeFirestoreNetwork();
  } catch {
    // ignore
  }
};

export const markFirestoreQuotaExceeded = async (durationMinutes = 5): Promise<void> => {
  try {
    const until = Date.now() + durationMinutes * 60 * 1000;
    localStorage.setItem('kongre_firestore_quota_cooldown', String(until));
    await pauseFirestoreNetwork();
  } catch {
    // ignore
  }
};

// Check on boot: if previous quota was stored, reset it to give fresh network attempt
if (typeof window !== 'undefined') {
  try {
    // Clear legacy stale 12-hour cooldowns to ensure real-time sync is always active
    localStorage.removeItem('kongre_firestore_quota_cooldown');
    resumeFirestoreNetwork();
  } catch {
    // ignore
  }

  // Intercept unhandled Firestore quota rejections from background workers (brief 3 minute backoff only)
  window.addEventListener('unhandledrejection', (event) => {
    if (isQuotaError(event.reason)) {
      event.preventDefault();
      markFirestoreQuotaExceeded(3);
    }
  });
}

export default app;
