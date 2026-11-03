// src/utils/totp.ts
/**
 * Motor criptográfico de Verificación en Dos Pasos (2FA / TOTP - RFC 6238)
 * Compatible con Microsoft Authenticator, Google Authenticator y apps estándar.
 *
 * Características:
 * - Algoritmo estándar RFC 6238 (HMAC-SHA1, intervalo de 30s, 6 dígitos).
 * - Cero dependencias externas: utiliza Web Crypto API nativa (window.crypto.subtle).
 * - Funciona 100% sin conexión a internet (offline teocrático).
 * - Generación de códigos QR mediante otpauth://totp/...
 * - Códigos de respaldo de un solo uso protegidos con hash SHA-256.
 * - Gestión de dispositivos confiables ("Recordar por 30 días").
 */

import { encryptPinAtRest, decryptPinAtRest, isEncryptedPinAtRest } from './theocraticSecurity';

// Alfabeto estándar Base32 (RFC 4648 sin padding)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Codifica un arreglo de bytes en Base32 (RFC 4648)
 */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodifica una cadena Base32 a Uint8Array
 */
export function base32Decode(input: string): Uint8Array {
  // Limpiar espacios, guiones y convertir a mayúsculas
  const clean = input.toUpperCase().replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) {
      continue; // Ignorar caracteres inválidos
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

function getWebCrypto(): any {
  return (typeof window !== 'undefined' && window.crypto) ? window.crypto : (globalThis as any).crypto;
}

/**
 * Genera un secreto criptográficamente seguro de 20 bytes (160 bits) en formato Base32.
 * Recomendado por RFC 6238 para HMAC-SHA1.
 */
export function generateTotpSecret(): string {
  const cryptoObj = getWebCrypto();
  const randomBytes = new Uint8Array(20);
  cryptoObj.getRandomValues(randomBytes);
  return base32Encode(randomBytes);
}

/**
 * Construye la URI oficial otpauth:// para que Microsoft Authenticator
 * reconozca automáticamente el emisor, la cuenta y la clave secreta al escanear el QR.
 */
export function generateTotpUri(accountName: string, secret: string, issuer = 'Kongre'): string {
  const cleanAccount = accountName.trim() || 'Publicador';
  const cleanSecret = secret.trim().toUpperCase().replace(/[\s-]/g, '');
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(cleanAccount);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Calcula el código TOTP de 6 dígitos para un momento dado según RFC 6238 / RFC 4226.
 */
export async function generateTotpCode(secret: string, timestampMs = Date.now()): Promise<string> {
  const cryptoObj = getWebCrypto();
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }

  const secretBytes = base32Decode(secret);
  if (secretBytes.length === 0) {
    throw new Error('La clave secreta Base32 es inválida o está vacía.');
  }

  // Intervalo de tiempo estándar de 30 segundos
  const step = Math.floor(timestampMs / 1000 / 30);

  // Convertir el contador de 64 bits en 8 bytes Big-Endian
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // En JS, números enteros estándar son de 53 bits; dividimos en partes alta y baja
  counterView.setUint32(0, Math.floor(step / 0x100000000), false);
  counterView.setUint32(4, step >>> 0, false);

  // Importar clave HMAC-SHA1
  const cryptoKey = await cryptoObj.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  // Calcular HMAC-SHA1
  const signature = await cryptoObj.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);

  // Truncamiento dinámico (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifica si un código de 6 dígitos ingresado por el usuario es válido contra la clave secreta.
 * Soporta una ventana de tolerancia de ±1 paso (±30 segundos) para mitigar desviaciones en los relojes.
 */
export async function verifyTotpCode(
  secret: string,
  userCode: string,
  windowTolerance = 1,
  currentTimestampMs = Date.now()
): Promise<boolean> {
  const cleanCode = userCode.trim().replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    return false;
  }

  // Probar T-1, T, T+1 (por defecto ventana de 1 intervalo = ±30 segundos)
  for (let offset = -windowTolerance; offset <= windowTolerance; offset++) {
    const testTime = currentTimestampMs + offset * 30 * 1000;
    try {
      const expectedCode = await generateTotpCode(secret, testTime);
      if (expectedCode === cleanCode) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Genera un conjunto de códigos de respaldo de emergencia (ej: 8 códigos tipo XXXX-XXXX).
 * Devuelve tanto los códigos en texto plano (para mostrar al usuario una sola vez)
 * como los hashes SHA-256 para almacenamiento seguro.
 */
export async function generateBackupCodes(count = 8): Promise<{
  plainCodes: string[];
  hashedCodes: string[];
}> {
  const cryptoObj = getWebCrypto();
  const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 Crockford para evitar confusiones
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(8);
    cryptoObj.getRandomValues(bytes);
    let codeStr = '';
    for (let j = 0; j < 8; j++) {
      codeStr += CHARSET[bytes[j] % CHARSET.length];
    }
    const formatted = `${codeStr.slice(0, 4)}-${codeStr.slice(4)}`;
    plainCodes.push(formatted);

    // Calcular hash SHA-256 del código normalizado
    const hashed = await hashBackupCode(formatted);
    hashedCodes.push(hashed);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Calcula el hash SHA-256 de un código de respaldo para almacenamiento seguro
 */
export async function hashBackupCode(code: string): Promise<string> {
  const cryptoObj = getWebCrypto();
  const clean = code.toUpperCase().replace(/[\s-]/g, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(`kgr_backup_code_salt_v1:${clean}`);
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica si un código de respaldo ingresado es válido y lo consume (un solo uso).
 */
export async function verifyAndConsumeBackupCode(
  inputCode: string,
  storedHashedCodes: string[]
): Promise<{ isValid: boolean; remainingHashedCodes: string[] }> {
  if (!Array.isArray(storedHashedCodes) || storedHashedCodes.length === 0) {
    return { isValid: false, remainingHashedCodes: storedHashedCodes || [] };
  }

  const clean = inputCode.trim();
  if (clean.length < 6) {
    return { isValid: false, remainingHashedCodes: storedHashedCodes };
  }

  const inputHash = await hashBackupCode(clean);
  const matchIndex = storedHashedCodes.findIndex((h) => h === inputHash);

  if (matchIndex === -1) {
    return { isValid: false, remainingHashedCodes: storedHashedCodes };
  }

  // Código válido: eliminarlo para que no pueda reutilizarse
  const remaining = [...storedHashedCodes];
  remaining.splice(matchIndex, 1);

  return { isValid: true, remainingHashedCodes: remaining };
}

// ── Gestión de Dispositivos Confiables ("Recordar por 30 días") ──

const TRUSTED_DEVICE_PREFIX = 'kongre_trusted_device_';
const DEFAULT_TRUST_DURATION_DAYS = 30;

/**
 * Helper para obtener el almacenamiento local seguro en navegador o entorno de pruebas
 */
function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

/**
 * Comprueba si el dispositivo actual está marcado como confiable para este publicador / usuario.
 */
export function isDeviceTrusted(identityId: string): boolean {
  const storage = getStorage();
  if (!storage || !identityId) return false;
  try {
    const key = `${TRUSTED_DEVICE_PREFIX}${identityId}`;
    const raw = storage.getItem(key);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (!data || typeof data.expiresAt !== 'number') return false;

    // Verificar si no ha caducado
    if (Date.now() > data.expiresAt) {
      storage.removeItem(key);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Marca el dispositivo actual como confiable para un publicador por X días.
 */
export function markDeviceAsTrusted(identityId: string, durationDays = DEFAULT_TRUST_DURATION_DAYS): void {
  const storage = getStorage();
  if (!storage || !identityId) return;
  try {
    const key = `${TRUSTED_DEVICE_PREFIX}${identityId}`;
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const data = {
      identityId,
      expiresAt,
      trustedAt: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : '',
    };
    storage.setItem(key, JSON.stringify(data));
  } catch {}
}

/**
 * Revoca la confianza de este dispositivo (ej: al cerrar sesión explícitamente o desactivar 2FA).
 */
export function revokeDeviceTrust(identityId: string): void {
  const storage = getStorage();
  if (!storage || !identityId) return;
  try {
    const key = `${TRUSTED_DEVICE_PREFIX}${identityId}`;
    storage.removeItem(key);
  } catch {}
}

/**
 * Cifra la clave secreta de 2FA para resguardarla en reposo con la clave de la congregación.
 */
export function encryptTotpSecret(secret: string): string {
  return encryptPinAtRest(secret);
}

/**
 * Descifra la clave secreta de 2FA desde el almacenamiento seguro.
 */
export function decryptTotpSecret(encryptedSecret: string): string {
  if (!isEncryptedPinAtRest(encryptedSecret)) {
    return encryptedSecret;
  }
  return decryptPinAtRest(encryptedSecret);
}
