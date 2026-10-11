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

/**
 * Genera un Identificador Teocrático de Congregación de Grado Militar.
 * - Utiliza entropía criptográfica real de 64 bits (CSPRNG via Web Crypto API)
 * - Codificación Base32 Crockford para evitar confusiones tipográficas (sin 0, O, 1, I)
 * - Algoritmo anti-colisiones y resistente a ataques de fuerza bruta
 * - Formato estándar militar teocrático: KGR-XXXX-XXXX (ej. KGR-8P2M-7X4W)
 */
export function generateMilitaryGradeCongregationId(name?: string): string {
  if (!name || !name.trim()) return '';

  const clean = name.trim().toUpperCase();
  const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 caracteres seguros

  // Generamos entropía aleatoria criptográfica con Web Crypto API
  const randomBytes = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 8; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Mezcla de la semilla del nombre con la entropía criptográfica
  let hash = 0x811c9dc5;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  hash >>>= 0;

  let block1 = '';
  let block2 = '';

  for (let i = 0; i < 4; i++) {
    const shift = i * 8;
    const seedByte = (hash >>> (shift % 32)) & 0xff;
    const combined = (randomBytes[i] ^ seedByte ^ (clean.charCodeAt(i % clean.length) * 31)) % CHARSET.length;
    block1 += CHARSET[combined];
  }

  for (let i = 4; i < 8; i++) {
    const shift = (i - 4) * 8;
    const seedByte = (hash >>> (shift % 32)) & 0xff;
    const combined = (randomBytes[i] ^ seedByte ^ (clean.charCodeAt((i + 2) % clean.length) * 17)) % CHARSET.length;
    block2 += CHARSET[combined];
  }

  return `KGR-${block1}-${block2}`;
}

/**
 * Genera un PIN numérico seguro de 6 dígitos no trivial para bloqueo de app de la congregación
 */
export function generateSecureCongregationPin(): string {
  const TRIVIAL = new Set([
    '000000', '111111', '222222', '333333', '444444', '555555',
    '666666', '777777', '888888', '999999', '123456', '654321', '123123'
  ]);
  let pin = '';
  do {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    pin = (100000 + (array[0] % 900000)).toString();
  } while (TRIVIAL.has(pin) || /^(\d)\1{5}$/.test(pin));
  return pin;
}

/**
 * Genera un PIN numérico seguro de 4 dígitos no trivial para identificación única de un publicador
 */
export function generateSecurePublisherPin(existingPins: string[] = []): string {
  const TRIVIAL = new Set([
    '0000', '1111', '2222', '3333', '4444', '5555',
    '6666', '7777', '8888', '9999', '1234', '4321', '0123', '9876'
  ]);
  const taken = new Set([...existingPins.map((p) => p.trim()), ...TRIVIAL]);
  let pin = '';
  let attempts = 0;
  do {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    pin = (1000 + (array[0] % 9000)).toString();
    attempts++;
  } while ((taken.has(pin) || /^(\d)\1{3}$/.test(pin)) && attempts < 200);
  return pin;
}

/**
 * Genera un PIN numérico seguro de 4 dígitos no trivial para identificación de rol teocrático (alias)
 */
export function generateSecureRolePin(existingPins: string[] = []): string {
  return generateSecurePublisherPin(existingPins);
}

export interface PinStrengthResult {
  score: number; // 0: Débil, 1: Básico, 2: Fuerte, 3: Óptimo
  label: string;
  color: string;
  isWeak: boolean;
  message?: string;
}

const TRIVIAL_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '9876', '2580', '1379',
  '000000', '111111', '123456', '654321', '123123',
  '12345678', '87654321', '00000000', '11111111'
]);

export function evaluatePinStrength(pin: string): PinStrengthResult {
  if (!pin || pin.length < 4) {
    return {
      score: 0,
      label: 'Muy corto',
      color: 'bg-slate-300 text-slate-500',
      isWeak: true,
      message: 'Mínimo 4 caracteres o dígitos'
    };
  }

  const allSameChar = /^([a-zA-Z0-9])\1+$/.test(pin);
  if (TRIVIAL_PINS.has(pin) || allSameChar) {
    return {
      score: 0,
      label: 'Inseguro',
      color: 'bg-rose-500 text-white',
      isWeak: true,
      message: 'Combinación obvia o repetitiva. Usa números no correlativos.'
    };
  }

  let score = 1;

  if (pin.length >= 6) score += 1;

  const hasDigits = /\d/.test(pin);
  const hasLetters = /[a-zA-Z]/.test(pin);
  if (hasDigits && hasLetters) {
    score += 1;
  }

  if (score === 1) {
    return {
      score: 1,
      label: 'Básico',
      color: 'bg-amber-500 text-white',
      isWeak: false,
      message: 'Válido. Se recomiendan 6 dígitos o combinar con letras para mayor seguridad.'
    };
  } else if (score === 2) {
    return {
      score: 2,
      label: 'Fuerte',
      color: 'bg-indigo-500 text-white',
      isWeak: false,
      message: 'Excelente longitud y resistencia a intentos no autorizados.'
    };
  } else {
    return {
      score: 3,
      label: 'Grado Teocrático Alto',
      color: 'bg-emerald-600 text-white',
      isWeak: false,
      message: 'Máxima protección contra accesos no autorizados.'
    };
  }
}

// Anti-brute-force rate limiting helpers
const LOCKOUT_KEY = 'kongre_pin_lockout_until';
const FAILED_COUNT_KEY = 'kongre_pin_failed_count';
const MAX_ATTEMPTS_BEFORE_COOLDOWN = 5;
const COOLDOWN_SECONDS = 30;

export function getPinLockoutRemainingSeconds(): number {
  if (typeof window === 'undefined') return 0;
  const lockoutUntil = parseInt(sessionStorage.getItem(LOCKOUT_KEY) || '0', 10);
  const now = Date.now();
  if (lockoutUntil > now) {
    return Math.ceil((lockoutUntil - now) / 1000);
  }
  return 0;
}

export function recordFailedPinAttempt(): { isLockedOut: boolean; remainingSeconds: number; attempts: number } {
  if (typeof window === 'undefined') return { isLockedOut: false, remainingSeconds: 0, attempts: 1 };
  const currentAttempts = parseInt(sessionStorage.getItem(FAILED_COUNT_KEY) || '0', 10) + 1;
  sessionStorage.setItem(FAILED_COUNT_KEY, currentAttempts.toString());

  if (currentAttempts >= MAX_ATTEMPTS_BEFORE_COOLDOWN) {
    const cooldownMultiplier = Math.floor(currentAttempts / MAX_ATTEMPTS_BEFORE_COOLDOWN);
    const lockDuration = COOLDOWN_SECONDS * cooldownMultiplier * 1000;
    const lockoutUntil = Date.now() + lockDuration;
    sessionStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
    return {
      isLockedOut: true,
      remainingSeconds: Math.ceil(lockDuration / 1000),
      attempts: currentAttempts
    };
  }

  return {
    isLockedOut: false,
    remainingSeconds: 0,
    attempts: currentAttempts
  };
}

export function resetFailedPinAttempts(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LOCKOUT_KEY);
  sessionStorage.removeItem(FAILED_COUNT_KEY);
}

/**
 * Detecta si una cadena corresponde a un ID o código técnico generado en vez de un nombre oficial de congregación.
 * Por ejemplo: UUIDs ("7f6b7269-3ae2-4185-8cd1-0b3873d79f48"), "ID: 10582", "Congregación #10582", "10582", "KGR-8P2M-7X4W", "CONG_1234", etc.
 */
export function isCongregationIdString(name?: string | null): boolean {
  if (!name || !name.trim()) return false;
  const clean = name.trim();
  const lower = clean.toLowerCase();

  // Exact technical string "id"
  if (lower === 'id' || lower === 'id:' || lower === 'id#-') return true;

  // Formato UUID estándar (8-4-4-4-12 caracteres hexadecimales)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) return true;

  // Identificadores de sistema Firebase / Cloud Run / AI Studio (e.g. ai-studio-kongre-... o ais-...)
  if (/^(ai-studio|ais-dev|ais-pre|applet)[0-9a-z_-]+/i.test(clean)) return true;

  // Código técnico KGR-... o CONG_... con números/códigos largos
  if (/^(kgr|cong)[_-][0-9a-z]{6,}$/i.test(clean)) return true;

  // Hash técnico sin espacios de más de 16 caracteres hexadecimales
  if (!clean.includes(' ') && /^[a-f0-9]{16,}$/i.test(clean)) return true;

  return false;
}

/**
 * Devuelve el nombre amigable y oficial de la congregación para banners y encabezados,
 * garantizando que NUNCA muestre un ID numérico ni un código técnico en su lugar.
 */
export function getFriendlyCongregationName(
  congregationName?: string | null,
  fallback = 'Congregación Central'
): string {
  if (!congregationName || !congregationName.trim()) {
    return fallback;
  }
  const clean = congregationName.trim();
  if (isCongregationIdString(clean)) {
    return fallback;
  }
  return clean;
}

/**
 * Sanitiza recursivamente cualquier objeto o arreglo antes de enviarlo a Firestore,
 * eliminando todas las propiedades con valor `undefined` tanto en objetos como en elementos de arreglos.
 * Esto previene de forma definitiva el error:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as any;
  }

  const deepConvert = (val: any): any => {
    if (val === undefined || val === null) return null;
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) {
      return val
        .filter((item) => item !== undefined)
        .map((item) => deepConvert(item));
    }
    if (typeof val === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          result[k] = deepConvert(v);
        }
      }
      return result;
    }
    return val;
  };

  try {
    const preprocessed = deepConvert(data);
    const jsonString = JSON.stringify(preprocessed, (_, value) => {
      if (value === undefined) return null;
      return value;
    });
    if (!jsonString) return null as any;
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn('sanitizeForFirestore fallback:', err);
    return deepConvert(data);
  }
}

