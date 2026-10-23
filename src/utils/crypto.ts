/**
 * src/utils/crypto.ts
 * Motor criptográfico de Cero Conocimiento (Zero-Knowledge) para Kongre2.
 * Implementa cifrado AES-256-GCM y derivación de claves PBKDF2 (100,000 iteraciones)
 * mediante la API nativa del navegador (Web Crypto API).
 *
 * Compatible tanto con formato Base64 como con el formato Hex de Supabase sync_queue:
 * saltHex:ivHex:authTagHex:ciphertextHex
 */

// Iteraciones PBKDF2. v1 (heredado) = 100.000; v2 = 600.000 (recomendación OWASP para PBKDF2-SHA256).
// El formato v2 antepone "v2:" al texto cifrado. Siempre se pueden LEER ambos formatos.
//
// DESPLIEGUE EN DOS FASES (importante): los clientes antiguos NO entienden "v2:".
//   Fase 1: publicar esta versión con WRITE_KDF_V2 = false (todos los dispositivos aprenden a leer v2).
//   Fase 2: cuando todos los dispositivos se hayan actualizado, cambiar a true y publicar.
export const WRITE_KDF_V2 = false;
const ITERATIONS_V1 = 100000;
const ITERATIONS_V2 = 600000;
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

export function normalizePin(pin: string): string {
  return String(pin || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir de un PIN y un salt usando PBKDF2-SHA-256
 */
async function deriveKey(pin: string, salt: Uint8Array, iterations: number = ITERATIONS_V1): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const cleanPin = normalizePin(pin);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(cleanPin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
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

  const iterations = WRITE_KDF_V2 ? ITERATIONS_V2 : ITERATIONS_V1;
  const key = await deriveKey(pin, salt, iterations);
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
  return WRITE_KDF_V2 ? `${V2_PREFIX}${body}` : body;
}

/**
 * Descifra datos provenientes de Supabase sync_queue (o formato Base64)
 */
export async function decryptFromSupabase(encryptedString: string, pin: string): Promise<any> {
  if (!encryptedString || typeof encryptedString !== 'string') {
    throw new Error('Payload cifrado inválido o vacío.');
  }

  const decoder = new TextDecoder();
  const cleanPin = normalizePin(pin);

  // Versión del KDF según prefijo (sin prefijo = v1 heredado)
  let iterations = ITERATIONS_V1;
  if (encryptedString.startsWith(V2_PREFIX)) {
    iterations = ITERATIONS_V2;
    encryptedString = encryptedString.slice(V2_PREFIX.length);
  }

  // Formato Hex delimitado por ':' (saltHex:ivHex:authTagHex:ciphertextHex)
  if (encryptedString.includes(':')) {
    const parts = encryptedString.split(':');
    if (parts.length === 4) {
      const [saltHex, ivHex, authTagHex, ciphertextHex] = parts;
      const salt = hexToBytes(saltHex);
      const iv = hexToBytes(ivHex);
      const authTag = hexToBytes(authTagHex);
      const ciphertext = hexToBytes(ciphertextHex);

      const combinedCiphertext = new Uint8Array(ciphertext.length + authTag.length);
      combinedCiphertext.set(ciphertext, 0);
      combinedCiphertext.set(authTag, ciphertext.length);

      const key = await deriveKey(cleanPin, salt, iterations);
      const decryptedBuf = await crypto.subtle.decrypt(
        { name: ALGO, iv: iv as unknown as BufferSource },
        key,
        combinedCiphertext as unknown as BufferSource
      );
      return JSON.parse(decoder.decode(decryptedBuf));
    }
  }

  // Fallback: Formato Base64 combinado (salt 16 + iv 12 + ciphertext)
  try {
    const combined = base64ToBytes(encryptedString);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const key = await deriveKey(cleanPin, salt, iterations);
    const decryptedBuf = await crypto.subtle.decrypt(
      { name: ALGO, iv: iv as unknown as BufferSource },
      key,
      data as unknown as BufferSource
    );
    return JSON.parse(decoder.decode(decryptedBuf));
  } catch (err) {
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

  const iterations = WRITE_KDF_V2 ? ITERATIONS_V2 : ITERATIONS_V1;
  const key = await deriveKey(password, salt, iterations);
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: ALGO, iv: iv as unknown as BufferSource },
    key,
    encoder.encode(jsonStr)
  );

  const combined = new Uint8Array(salt.length + iv.length + encryptedBuf.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedBuf), salt.length + iv.length);

  const b64 = bytesToBase64(combined);
  return WRITE_KDF_V2 ? `${V2_PREFIX}${b64}` : b64;
}

/**
 * Función genérica de descifrado (Base64)
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<any> {
  const decoder = new TextDecoder();
  let iterations = ITERATIONS_V1;
  if (encryptedBase64.startsWith(V2_PREFIX)) {
    iterations = ITERATIONS_V2;
    encryptedBase64 = encryptedBase64.slice(V2_PREFIX.length);
  }
  const combined = base64ToBytes(encryptedBase64);

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const key = await deriveKey(password, salt, iterations);
  const decryptedBuf = await crypto.subtle.decrypt(
    { name: ALGO, iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource
  );
  return JSON.parse(decoder.decode(decryptedBuf));
}
