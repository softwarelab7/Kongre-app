/**
 * src/utils/atRestVault.ts
 * Bóveda criptográfica de claves no extraíbles en IndexedDB (AES-256-GCM).
 *
 * Características de seguridad:
 * 1. Clave no extraíble (extractable: false): reside en el almacén seguro de IndexedDB
 *    del navegador. No puede ser extraída vía crypto.subtle.exportKey.
 *    Copiar únicamente el contenido de localStorage ya no compromete el PIN.
 * 2. Autenticación y vinculación criptográfica (AAD): cada valor guardado (kgr_v3:...)
 *    utiliza AES-GCM autenticado donde el nombre de la clave se pasa como Additional Authenticated
 *    Data (AAD). Si el texto cifrado es trasladado a otra clave o manipulado, la autenticación falla.
 * 3. API síncrona en memoria para lectura y escritura transparente (~140 llamadas a getSecureLocalPin).
 * 4. Inicialización una sola vez en main.tsx antes de renderizar la UI con timeout de 2.5s.
 * 5. Migración fluida y automática desde formatos legados (kgr_v2, kgr_v1, texto plano).
 * 6. Eliminación de hashes débiles en localStorage (${key}_hash) y textos en claro en sessionStorage.
 */

import { decryptPinAtRest, encryptPinAtRest, isEncryptedPinAtRest } from './theocraticSecurity.ts';

const DB_NAME = 'kongre_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'vault_keys';
const MASTER_KEY_ID = 'kongre_at_rest_aes_key';

export const VAULT_CIPHER_PREFIX = 'kgr_v3:';

export const KNOWN_SECURE_PIN_KEYS = [
  'kongre_coordinator_pin',
  'kongre_session_pin_v2',
  'kongre_registered_cong_pin',
  'kongre_last_cong_pin',
] as const;

// Estado en memoria de la bóveda
const vaultCache = new Map<string, string>();
// Contador monótono por clave para que escrituras/borrados consecutivos nunca queden pisados
// por un cifrado asíncrono anterior que termine más tarde.
const writeSeq = new Map<string, number>();
let vaultCryptoKey: CryptoKey | null = null;
let isVaultInitialized = false;
let vaultSessionEntropy: string | null = null;

function bumpSeq(key: string): number {
  const next = (writeSeq.get(key) || 0) + 1;
  writeSeq.set(key, next);
  return next;
}

/**
 * Deriva determinísticamente un bloque de entropía de 256 bits a partir de la CryptoKey no extraíble
 * de IndexedDB. Este bloque solo puede calcularse si la clave reside en el navegador actual,
 * garantizando que una extracción aislada de localStorage no pueda descifrar los datos sensibles.
 */
export async function deriveVaultSessionEntropy(key: CryptoKey): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return '';
  try {
    const fixedIv = new Uint8Array(12);
    const seed = new TextEncoder().encode('kongre_vault_session_entropy_v2_at_rest');
    const encrypted = await subtle.encrypt(
      { name: 'AES-GCM', iv: fixedIv },
      key,
      seed
    );
    return bufferToHex(encrypted).slice(0, 64);
  } catch {
    return '';
  }
}

/**
 * Retorna la entropía de sesión derivada de la bóveda no extraíble (IndexedDB).
 * Permite que utilidades síncronas (como encryptSensitiveFieldAtRest) incorporen
 * la seguridad de la bóveda sin requerir Promesas en cada llamada de renderizado.
 */
export function getVaultSessionEntropy(): string | null {
  return vaultSessionEntropy;
}

export function setVaultSessionEntropyForTesting(entropy: string | null): void {
  vaultSessionEntropy = entropy;
}

// Helpers de conversión Hex
export function bufferToHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const len = cleanHex.length;
  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Abre o crea la base de datos de IndexedDB donde residirá la CryptoKey no extraíble
 */
function openVaultIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB no está disponible en este entorno'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error al abrir IndexedDB'));
    request.onblocked = () => reject(new Error('Apertura de IndexedDB bloqueada'));
  });
}

/**
 * Genera una clave AES-GCM de 256 bits NO extraíble (extractable: false)
 */
async function generateNonExtractableKey(): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API (subtle) no está disponible');
  }
  return await subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // extractable: false — no puede exportarse vía exportKey
    ['encrypt', 'decrypt']
  );
}

/**
 * Obtiene o crea la clave no extraíble en IndexedDB en una única transacción `readwrite`
 * para evitar que dos pestañas que abran a la vez se pisen la clave mutuamente.
 * (Nota: no se permite hacer `await` de WebCrypto dentro de una transacción IDB porque se
 * cierra por inactividad; por eso se pre-genera una candidata antes de abrir la transacción
 * y solo se persiste si el almacén sigue vacío).
 */
export async function getOrCreateVaultKey(): Promise<CryptoKey> {
  if (vaultCryptoKey) return vaultCryptoKey;

  const fresh = await generateNonExtractableKey();
  const db = await openVaultIndexedDB();
  try {
    const key = await new Promise<CryptoKey>((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(MASTER_KEY_ID);
        let chosen: CryptoKey = fresh;

        getReq.onsuccess = () => {
          const existing = (getReq.result as CryptoKey) || null;
          if (existing) {
            chosen = existing;
            resolve(chosen);
            return;
          }
          const putReq = store.put(fresh, MASTER_KEY_ID);
          putReq.onsuccess = () => resolve(chosen);
          putReq.onerror = () => reject(putReq.error || new Error('Error al guardar clave en IndexedDB'));
        };
        getReq.onerror = () => reject(getReq.error || new Error('Error al leer clave de IndexedDB'));
        tx.onerror = () => reject(tx.error || new Error('Transacción IndexedDB fallida'));
      } catch (err) {
        reject(err);
      }
    });
    return key;
  } finally {
    try {
      db.close();
    } catch {}
  }
}

/**
 * Cifra un texto plano utilizando la clave no extraíble de la bóveda.
 * Vincula criptográficamente el texto con el nombre de la clave (AAD).
 */
export async function encryptWithVaultKey(
  keyName: string,
  plainText: string,
  explicitKey?: CryptoKey
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  const key = explicitKey || vaultCryptoKey;
  if (!subtle || !key) {
    throw new Error('La bóveda criptográfica no está lista para cifrar');
  }

  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encodedPlain = new TextEncoder().encode(plainText);
  const aad = new TextEncoder().encode(keyName);

  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad,
    },
    key,
    encodedPlain
  );

  const ivHex = bufferToHex(iv);
  const cipherHex = bufferToHex(cipherBuffer);
  return `${VAULT_CIPHER_PREFIX}${ivHex}:${cipherHex}`;
}

/**
 * Descifra un valor almacenado en formato kgr_v3.
 * Falla si los datos fueron manipulados o si no corresponden a la clave especificada (AAD).
 */
export async function decryptWithVaultKey(
  keyName: string,
  cipherString: string,
  explicitKey?: CryptoKey
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  const key = explicitKey || vaultCryptoKey;
  if (!subtle || !key) {
    throw new Error('La bóveda criptográfica no está lista para descifrar');
  }

  if (!cipherString.startsWith(VAULT_CIPHER_PREFIX)) {
    throw new Error(`Prefijo inválido, se esperaba ${VAULT_CIPHER_PREFIX}`);
  }

  const payload = cipherString.slice(VAULT_CIPHER_PREFIX.length);
  const colonIdx = payload.indexOf(':');
  if (colonIdx === -1) {
    throw new Error('Formato de texto cifrado corrupto (falta delimitador de IV)');
  }

  const ivHex = payload.slice(0, colonIdx);
  const cipherHex = payload.slice(colonIdx + 1);

  if (!ivHex || !cipherHex || cipherHex.length % 2 !== 0) {
    throw new Error('Formato hexadecimal de IV o ciphertext no válido');
  }

  const iv = hexToBuffer(ivHex);
  const cipherBytes = hexToBuffer(cipherHex);
  const aad = new TextEncoder().encode(keyName);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
      additionalData: aad,
    },
    key,
    new Uint8Array(cipherBytes)
  );

  return new TextDecoder().decode(decryptedBuffer);
}

interface HydrationEntry {
  key: string;
  plain: string | null;
  needsRecipher: boolean;
}

/**
 * Fase 1 (solo lectura): descifra e inspecciona las entradas actuales de localStorage sin mutar
 * ni `vaultCache` ni `localStorage`. Si el tiempo límite vence durante esta fase, se puede abortar
 * sin dejar ningún estado a medias.
 */
async function planVaultHydration(key: CryptoKey, isCancelled: () => boolean): Promise<HydrationEntry[]> {
  if (typeof localStorage === 'undefined') return [];

  const keysToProcess = new Set<string>();
  for (const k of KNOWN_SECURE_PIN_KEYS) {
    keysToProcess.add(k);
  }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith('kongre_') && !k.endsWith('_hash')) {
      keysToProcess.add(k);
    }
  }

  const plan: HydrationEntry[] = [];
  for (const k of keysToProcess) {
    if (isCancelled()) return [];
    const rawVal = localStorage.getItem(k);
    if (!rawVal) continue;
    const trimmed = rawVal.trim();
    if (!trimmed || trimmed === '••••' || trimmed === '••••••••') continue;

    if (trimmed.startsWith(VAULT_CIPHER_PREFIX)) {
      let plain: string | null = null;
      try {
        plain = (await decryptWithVaultKey(k, trimmed, key)) || null;
      } catch {
        plain = null;
      }
      plan.push({ key: k, plain, needsRecipher: false });
      continue;
    }

    if (isEncryptedPinAtRest(trimmed)) {
      const plain = decryptPinAtRest(trimmed) || null;
      plan.push({ key: k, plain, needsRecipher: Boolean(plain) });
      continue;
    }

    if (KNOWN_SECURE_PIN_KEYS.includes(k as any) && !/^[a-f0-9]{64}$/i.test(trimmed)) {
      plan.push({ key: k, plain: trimmed, needsRecipher: true });
    }
  }
  return plan;
}

/**
 * Fase 2 (compromiso): una vez decidido que la inicialización NO venció por tiempo límite,
 * vuelca los valores leídos a `vaultCache` (respetando escrituras que hayan ocurrido entre medias)
 * y promueve en segundo plano los formatos antiguos a `kgr_v3:`.
 */
async function commitVaultHydration(key: CryptoKey, plan: HydrationEntry[]): Promise<void> {
  if (typeof localStorage === 'undefined') return;

  for (const entry of plan) {
    // Si el usuario escribió/borró esta clave mientras la bóveda arrancaba, no pisar su valor.
    const touchedSinceStart = (writeSeq.get(entry.key) || 0) > 0;
    if (!touchedSinceStart && entry.plain) {
      vaultCache.set(entry.key, entry.plain);
    }
    try {
      localStorage.removeItem(`${entry.key}_hash`);
    } catch {}
    if (!touchedSinceStart && entry.needsRecipher && entry.plain) {
      const seqAtMigrate = writeSeq.get(entry.key) || 0;
      try {
        const newCipher = await encryptWithVaultKey(entry.key, entry.plain, key);
        if ((writeSeq.get(entry.key) || 0) === seqAtMigrate) {
          localStorage.setItem(entry.key, newCipher);
        }
      } catch {}
    }
  }

  if (typeof sessionStorage !== 'undefined') {
    for (const k of KNOWN_SECURE_PIN_KEYS) {
      try {
        sessionStorage.removeItem(k);
      } catch {}
    }
  }
}

/**
 * Inicializa la bóveda criptográfica con timeout máximo (por defecto 2500ms).
 * Se invoca en main.tsx antes de renderizar la aplicación React.
 * Si el timeout vence antes del punto de compromiso, la inicialización se cancela de verdad:
 * no deja `vaultCryptoKey`, `vaultSessionEntropy` ni `localStorage` modificados a espaldas del llamador.
 */
export async function initAtRestVault(timeoutMs = 2500): Promise<boolean> {
  if (typeof indexedDB === 'undefined') {
    return false;
  }

  let timerId: any;
  let cancelled = false;
  let committed = false;

  const initPromise = (async () => {
    try {
      const key = await getOrCreateVaultKey();
      if (cancelled) return false;
      const entropy = await deriveVaultSessionEntropy(key);
      if (cancelled) return false;
      const plan = await planVaultHydration(key, () => cancelled);
      if (cancelled) return false;

      // Punto de no retorno: a partir de aquí ya no se puede cancelar por timeout.
      committed = true;
      vaultCryptoKey = key;
      vaultSessionEntropy = entropy;
      isVaultInitialized = true;
      await commitVaultHydration(key, plan);
      return true;
    } catch (err) {
      if (!cancelled) {
        console.warn('[atRestVault] No se pudo inicializar la bóveda con IndexedDB:', err);
      }
      return false;
    }
  })();

  const timeoutPromise = new Promise<boolean>((resolve) => {
    timerId = setTimeout(() => {
      if (committed) return; // ya comprometida; dejar que initPromise resuelva true
      cancelled = true;
      console.warn(`[atRestVault] Inicialización excedió el tiempo límite de ${timeoutMs}ms; usando fallback.`);
      resolve(false);
    }, timeoutMs);
  });

  try {
    return await Promise.race([initPromise, timeoutPromise]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

/**
 * Consulta síncrona de un valor guardado en la bóveda
 */
export function getVaultValue(key: string): string | null {
  if (vaultCache.has(key)) {
    return vaultCache.get(key) || null;
  }

  if (typeof localStorage === 'undefined') return null;

  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '••••' || trimmed === '••••••••') return null;

  // Fallback si la bóveda no está inicializada o son datos legados
  if (trimmed.startsWith(VAULT_CIPHER_PREFIX)) {
    // Si la clave ya está cargada pero aún no en caché, no podemos descifrar síncronamente aquí,
    // pero si vaultCache ya fue hidratado al inicio, no caerá aquí.
    return null;
  }

  if (isEncryptedPinAtRest(trimmed)) {
    const plain = decryptPinAtRest(trimmed);
    if (plain) {
      vaultCache.set(key, plain);
      return plain;
    }
    return null;
  }

  if (!/^[a-f0-9]{64}$/i.test(trimmed)) {
    vaultCache.set(key, trimmed);
    return trimmed;
  }

  return null;
}

/**
 * Almacena o elimina síncronamente un valor en la bóveda y lo persiste de forma segura.
 */
export function setVaultValue(key: string, plainValue: string | null | undefined): void {
  const clean = plainValue ? String(plainValue).trim() : '';
  const seq = bumpSeq(key);

  if (!clean || clean === '••••' || clean === '••••••••') {
    vaultCache.delete(key);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_hash`);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch {}
    return;
  }

  // 1. Inmediatamente actualizar la memoria síncrona
  vaultCache.set(key, clean);

  // 2. Limpiar hashes y textos en claro de almacenamientos expuestos
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${key}_hash`);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch {}

  // 3. Persistir cifrado con clave no extraíble
  if (vaultCryptoKey) {
    void encryptWithVaultKey(key, clean, vaultCryptoKey).then((cipher) => {
      // Si hubo otra escritura o un borrado después de iniciar este cifrado, descartar el resultado viejo.
      if (writeSeq.get(key) !== seq) return;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, cipher);
        }
      } catch {}
    });
  } else {
    // Fallback seguro con kgr_v2 si la bóveda aún no cargó
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, encryptPinAtRest(clean));
      }
    } catch {}
  }
}

/**
 * Limpia el estado de la bóveda (útil para pruebas unitarias)
 */
export function resetVaultForTesting(): void {
  vaultCache.clear();
  writeSeq.clear();
  vaultCryptoKey = null;
  vaultSessionEntropy = null;
  isVaultInitialized = false;
}

/**
 * Establece directamente la clave de la bóveda para pruebas
 */
export function setVaultKeyForTesting(key: CryptoKey | null): void {
  vaultCryptoKey = key;
  if (key) {
    isVaultInitialized = true;
    void deriveVaultSessionEntropy(key).then((ent) => {
      vaultSessionEntropy = ent;
    });
  } else {
    vaultSessionEntropy = null;
  }
}

/**
 * Determina si la bóveda está lista con su clave no extraíble
 */
export function isVaultReady(): boolean {
  return isVaultInitialized && vaultCryptoKey !== null;
}

/**
 * Comprueba si una cadena tiene el formato de la bóveda v3
 */
export function isVaultCiphertext(val: unknown): boolean {
  return typeof val === 'string' && val.trim().startsWith(VAULT_CIPHER_PREFIX);
}
