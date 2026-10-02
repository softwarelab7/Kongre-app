// src/utils/theocraticSecurity.ts
/**
 * Utilidades de Seguridad Teocrática y Cifrado de Grado Militar
 * - Cifrado AES-GCM de 256 bits del lado del cliente
 * - Derivación de claves PBKDF2 (100.000 iteraciones SHA-256)
 * - Bloqueo de sesión con PIN / Código de protección para el Salón del Reino
 * - Enmascaramiento de datos personales (PII / RGPD Teocrático)
 */

export interface EncryptedPayload {
  version: 'kongre_v1';
  salt: string; // Hex
  iv: string; // Hex
  ciphertext: string; // Base64
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir de una contraseña y un salt usando PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra una cadena de texto plano con AES-GCM de 256 bits
 */
export async function encryptTheocraticData(plainText: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plainText);

  // Generate random salt (16 bytes) and IV (12 bytes for AES-GCM)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const payload: EncryptedPayload = {
    version: 'kongre_v1',
    salt: bufferToHex(salt.buffer),
    iv: bufferToHex(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Descifra una carga cifrada con AES-GCM de 256 bits
 */
export async function decryptTheocraticData(encryptedJson: string, passphrase: string): Promise<string> {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(encryptedJson);
  } catch {
    throw new Error('El archivo no tiene el formato de cifrado correcto.');
  }

  if (payload.version !== 'kongre_v1' || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error('Versión de cifrado incompatible o archivo corrupto.');
  }

  const salt = hexToBuffer(payload.salt);
  const iv = hexToBuffer(payload.iv);
  const ciphertextBytes = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertextBytes as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error('Contraseña o clave de cifrado incorrecta.');
  }
}

/**
 * Genera un hash seguro con sal para el PIN de bloqueo de pantalla
 */
export async function hashPasscode(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = 'kongre_theocratic_salt_2026';
  const data = enc.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Verifica si un PIN ingresado coincide con el hash almacenado
 */
export async function verifyPasscode(pin: string, storedHash: string): Promise<boolean> {
  const computed = await hashPasscode(pin);
  return computed === storedHash;
}

/**
 * Enmascaramiento de datos personales para proteger la privacidad en vistas públicas
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone || phone.trim() === '') return '—';
  const clean = phone.trim();
  if (clean.length <= 4) return '••••';
  const visibleLast = clean.slice(-4);
  return `••••-••-${visibleLast}`;
}

export function maskHomeAddress(address?: string): string {
  if (!address || address.trim() === '') return '—';
  const words = address.trim().split(' ');
  if (words.length <= 1) return '••••••••';
  return `${words[0]} ••••••`;
}

export function maskPrivateNotes(notes?: string): string {
  if (!notes || notes.trim() === '') return '';
  return '🔒 [Información reservada para ancianos]';
}
