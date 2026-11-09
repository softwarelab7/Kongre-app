/**
 * src/utils/crypto.ts
 * Motor criptográfico de Cero Conocimiento (Zero-Knowledge) para Kongre2.
 * Implementa cifrado AES-256-GCM y derivación de claves PBKDF2-SHA256 (600.000 iteraciones, recomendación OWASP)
 * mediante la API nativa del navegador (Web Crypto API).
 *
 * Formato único (el texto cifrado empieza por "v2:"):
 *   - Supabase sync_queue:  v2:saltHex:ivHex:authTagHex:ciphertextHex
 *   - Almacenamiento local / respaldos (Base64):  v2:base64(salt 16 + iv 12 + ciphertext + tag)
 * Un texto sin el prefijo "v2:" se rechaza: no existen formatos anteriores que leer.
 */

const ITERATIONS = 600000;
const V2_PREFIX = 'v2:';
const KEY_LEN = 256;
const ALGO = 'AES-GCM';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Normalización canónica del PIN: NFKC + recorte. Conserva símbolos y mayúsculas/minúsculas, de modo que una frase
 * de paso mantiene toda su entropía. Solo el PIN estándar de congregación (XXXX-XXXX) se unifica a mayúsculas con guion.
 */
export function normalizePinV2(pin: string): string {
  const clean = String(pin || '').normalize('NFKC').trim();
  // Formato canónico para PIN estándar de congregación (XXXX-XXXX o 8 caracteres Crockford alfanuméricos)
  if (/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(clean)) {
    const raw = clean.toUpperCase().replace(/-/g, '');
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  return clean;
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir de un PIN y un salt usando PBKDF2-SHA-256
 */
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(normalizePinV2(pin)), 'PBKDF2', false, ['deriveKey']);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGO, length: KEY_LEN },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra datos en formato Hex estándar de Supabase sync_queue:
 * ${saltHex}:${ivHex}:${authTagHex}:${ciphertextHex}
 */
export async function encryptForSupabase(data: any, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const jsonStr = JSON.stringify(data);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(pin, salt);
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: ALGO, iv: iv as unknown as BufferSource },
    key,
    encoder.encode(jsonStr)
  );

  const encryptedBytes = new Uint8Array(encryptedBuf);
  // En Web Crypto, los últimos 16 bytes de AES-GCM son el Auth Tag
  const authTagLength = 16;
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - authTagLength);
  const authTag = encryptedBytes.slice(encryptedBytes.length - authTagLength);

  const body = `${bytesToHex(salt)}:${bytesToHex(iv)}:${bytesToHex(authTag)}:${bytesToHex(ciphertext)}`;
  return `${V2_PREFIX}${body}`;
}

/**
 * Descifra datos provenientes de Supabase sync_queue (hex "v2:salt:iv:tag:ciphertext") o Base64 con prefijo "v2:".
 */
export async function decryptFromSupabase(encryptedString: string, pin: string): Promise<any> {
  if (!encryptedString || typeof encryptedString !== 'string') {
    throw new Error('Payload cifrado inválido o vacío.');
  }
  if (!encryptedString.startsWith(V2_PREFIX)) {
    throw new Error('PIN incorrecto o payload cifrado dañado.');
  }
  try {
    const str = encryptedString.slice(V2_PREFIX.length);
    const decoder = new TextDecoder();

    // Formato Hex delimitado por ':' (saltHex:ivHex:authTagHex:ciphertextHex)
    const parts = str.split(':');
    if (parts.length === 4) {
      const [saltHex, ivHex, authTagHex, ciphertextHex] = parts;
      const ciphertext = hexToBytes(ciphertextHex);
      const authTag = hexToBytes(authTagHex);
      const combined = new Uint8Array(ciphertext.length + authTag.length);
      combined.set(ciphertext, 0);
      combined.set(authTag, ciphertext.length);
      const key = await deriveKey(pin, hexToBytes(saltHex));
      const buf = await crypto.subtle.decrypt(
        { name: ALGO, iv: hexToBytes(ivHex) as unknown as BufferSource },
        key,
        combined as unknown as BufferSource
      );
      return JSON.parse(decoder.decode(buf));
    }

    // Base64 combinado (salt 16 + iv 12 + ciphertext)
    const combined = base64ToBytes(str);
    const key = await deriveKey(pin, combined.slice(0, 16));
    const buf = await crypto.subtle.decrypt(
      { name: ALGO, iv: combined.slice(16, 28) as unknown as BufferSource },
      key,
      combined.slice(28) as unknown as BufferSource
    );
    return JSON.parse(decoder.decode(buf));
  } catch {
    throw new Error('PIN incorrecto o payload cifrado dañado.');
  }
}

/**
 * Función genérica de cifrado para almacenamiento local y backups (Base64)
 */
export async function encryptData(data: any, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const jsonStr = JSON.stringify(data);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: ALGO, iv: iv as unknown as BufferSource },
    key,
    encoder.encode(jsonStr)
  );

  const combined = new Uint8Array(salt.length + iv.length + encryptedBuf.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBuf), salt.length + iv.length);

  return `${V2_PREFIX}${bytesToBase64(combined)}`;
}

/**
 * Función genérica de descifrado (Base64 con prefijo "v2:").
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<any> {
  if (typeof encryptedBase64 !== 'string' || !encryptedBase64.startsWith(V2_PREFIX)) {
    throw new Error('PIN incorrecto o datos cifrados dañados.');
  }
  try {
    const combined = base64ToBytes(encryptedBase64.slice(V2_PREFIX.length));
    const key = await deriveKey(password, combined.slice(0, 16));
    const buf = await crypto.subtle.decrypt(
      { name: ALGO, iv: combined.slice(16, 28) as unknown as BufferSource },
      key,
      combined.slice(28) as unknown as BufferSource
    );
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    throw new Error('PIN incorrecto o datos cifrados dañados.');
  }
}
