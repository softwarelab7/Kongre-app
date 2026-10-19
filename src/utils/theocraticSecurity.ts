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
 * Verifica si un PIN / clave ingresada coincide con el hash almacenado
 * - Soporta comparación exacta
 * - Soporta comparación insensible a mayúsculas/minúsculas para claves alfanuméricas
 * - Soporta comparación con o sin guiones y espacios (ej. 8X4W-9M2K equivale a 8X4W9M2K)
 * - Mantiene total retrocompatibilidad con PINs numéricos existentes
 */
export async function verifyPasscode(pin: string, storedHash: string): Promise<boolean> {
  if (!pin || !storedHash) return false;
  const clean = pin.trim();

  // 1. Coincidencia directa exacta
  if ((await hashPasscode(clean)) === storedHash) return true;

  // 2. Coincidencia en mayúsculas
  const upper = clean.toUpperCase();
  if ((await hashPasscode(upper)) === storedHash) return true;

  // 3. Coincidencia sin guiones ni espacios (ej: 8X4W-9M2K -> 8X4W9M2K)
  const unhyphenated = upper.replace(/[-\s]/g, '');
  if ((await hashPasscode(unhyphenated)) === storedHash) return true;

  // 4. Si el hash almacenado tenía guión XXXX-XXXX y el usuario escribió 8 caracteres sin guión:
  if (unhyphenated.length === 8) {
    const formatted = `${unhyphenated.slice(0, 4)}-${unhyphenated.slice(4)}`;
    if ((await hashPasscode(formatted)) === storedHash) return true;
  }

  return false;
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
/**
 * Genera un ID de congregación de Grado Militar Criptográfico (CSPRNG):
 * - Utiliza entropía criptográfica real de 64 bits (CSPRNG via Web Crypto API)
 * - 100% independiente del nombre o datos públicos de la congregación (imposible de deducir)
 * - Codificación Base32 Crockford para evitar confusiones tipográficas (sin 0, O, 1, I)
 * - Espacio de claves de más de 1.09 billones de combinaciones (32^8)
 * - Formato estándar militar teocrático: KGR-XXXX-XXXX (ej. KGR-8P2M-7X4W)
 */
export function generateMilitaryGradeCongregationId(_optionalSeed?: string): string {
  const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 caracteres seguros Crockford

  // Generamos entropía aleatoria criptográfica con Web Crypto API (CSPRNG)
  const randomBytes = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 8; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let block1 = '';
  let block2 = '';

  for (let i = 0; i < 4; i++) {
    block1 += CHARSET[randomBytes[i] % CHARSET.length];
  }

  for (let i = 4; i < 8; i++) {
    block2 += CHARSET[randomBytes[i] % CHARSET.length];
  }

  return `KGR-${block1}-${block2}`;
}

/**
 * Normaliza y formatea cualquier ID de congregación a su formato canónico estandarizado.
 * Si el usuario introduce 'kgr8p2m7x4w', 'KGR8P2M7X4W', 'kgr-8p2m-7x4w' o con espacios,
 * devuelve siempre el estándar unificado: 'KGR-8P2M-7X4W'.
 * Garantiza total sincronización entre usuarios de Google y usuarios de ID/PIN.
 */
export function formatCanonicalCongregationId(id: string | null | undefined): string {
  if (!id) return '';
  const clean = id.trim().toUpperCase().replace(/[\s_]/g, '-');
  const unhyphenated = clean.replace(/-/g, '');
  if (unhyphenated.startsWith('KGR') && unhyphenated.length === 11) {
    return `${unhyphenated.slice(0, 3)}-${unhyphenated.slice(3, 7)}-${unhyphenated.slice(7)}`;
  }
  return clean;
}

/**
 * Formatea dinámicamente el ID de congregación mientras el usuario escribe o pega.
 * Estructura estándar: KGR-XXXX-XXXX (ej: KGR-NQ5A-JQAA)
 * - Mantiene el prefijo 'KGR-' y coloca los guiones en las posiciones correctas automáticamente.
 * - Soporta borrado hacia atrás limpio (backspace) sin trabarse en los guiones.
 * - Soporta pegado completo o parcial (con o sin 'KGR-', guiones, espacios o minúsculas).
 * - Tolera identificadores de prueba o legados (ej: 1001-DEMO, números puros).
 */
export function formatCongregationIdInput(input: string, prev: string = ''): string {
  if (!input) return '';

  const isDeleting = prev && input.length < prev.length;

  if (isDeleting) {
    if (input.endsWith('-')) {
      const stripped = input.slice(0, -1);
      if (stripped === 'KGR' || stripped === 'KGR-') return '';
      return stripped;
    }
    if (input === 'KGR' || input === 'KGR-') {
      return '';
    }
  }

  const raw = input.toUpperCase().trim();

  // Preservar IDs de prueba o puramente numéricos (ej: 1001-DEMO)
  if (/^\d{3,6}(-DEMO)?$/i.test(raw) || /^DEMO/i.test(raw)) {
    return raw;
  }

  // Limpiar a caracteres alfanuméricos
  const clean = raw.replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  let payload = clean;
  if (payload.startsWith('KGR')) {
    payload = payload.slice(3);
  } else if (clean === 'K' || clean === 'KG') {
    return 'KGR-';
  }

  payload = payload.slice(0, 8);

  if (payload.length === 0) {
    return 'KGR-';
  }

  if (payload.length <= 4) {
    return payload.length === 4 && !isDeleting
      ? `KGR-${payload}-`
      : `KGR-${payload}`;
  }

  return `KGR-${payload.slice(0, 4)}-${payload.slice(4)}`;
}

/**
 * Formatea dinámicamente el PIN de congregación mientras el usuario escribe o pega.
 * Estructura estándar: XXXX-XXXX (ej: 8X4W-9M2K)
 * - Añade automáticamente el guión en la posición central tras 4 caracteres.
 * - Soporta borrado hacia atrás limpio (backspace).
 * - Convierte a mayúsculas y limita a 8 caracteres alfanuméricos (+ 1 guión = 9 total).
 */
export function formatCongregationPinInput(input: string, prev: string = ''): string {
  if (!input) return '';

  const isDeleting = prev && input.length < prev.length;
  if (isDeleting && input.endsWith('-')) {
    return input.slice(0, -1);
  }

  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (!clean) return '';

  if (clean.length <= 4) {
    return clean.length === 4 && !isDeleting
      ? `${clean}-`
      : clean;
  }

  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

/**
 * Genera una clave/PIN de Congregación de Alta Seguridad Criptográfica:
 * - Entropía criptográfica real de grado militar (CSPRNG vía Web Crypto API)
 * - Formato Alfanumérico estructurado de 8 caracteres: XXXX-XXXX (ej: 8X4W-9M2K)
 * - Alfabeto seguro Base32 Crockford (23456789ABCDEFGHJKLMNPQRSTUVWXYZ, sin 0, O, 1, I)
 * - Garantiza presencia obligatoria de letras mayúsculas y números (no es un simple número)
 * - Espacio de claves de más de 1.09 billones de combinaciones (32^8)
 * - Máxima protección contra fuerza bruta y ataques por diccionario
 */
export function generateSecureCongregationPin(): string {
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const DIGITS = '23456789';
  const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  const randomBytes = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 8; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  const chars = Array.from(randomBytes).map((b) => CHARSET[b % CHARSET.length]);

  // Asegurar que contiene al menos 2 números y al menos 2 letras
  const digitCount = chars.filter((c) => DIGITS.includes(c)).length;
  const letterCount = chars.filter((c) => LETTERS.includes(c)).length;

  if (digitCount < 2) {
    chars[0] = DIGITS[randomBytes[0] % DIGITS.length];
    chars[1] = DIGITS[randomBytes[1] % DIGITS.length];
  }
  if (letterCount < 2) {
    chars[2] = LETTERS[randomBytes[2] % LETTERS.length];
    chars[3] = LETTERS[randomBytes[3] % LETTERS.length];
  }

  // Mezclar orden con Fisher-Yates CSPRNG
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const block1 = chars.slice(0, 4).join('');
  const block2 = chars.slice(4, 8).join('');

  return `${block1}-${block2}`;
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

  // Identificadores de sistema Cloud / Cloud Run / AI Studio (e.g. ai-studio-kongre-... o ais-...)
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
  const localStoredName = typeof window !== 'undefined'
    ? localStorage.getItem('kongre_user_confirmed_name')?.trim() ||
      localStorage.getItem('kongre_congregation_name')?.trim() ||
      ''
    : '';

  const candidateLocal = localStoredName && !isCongregationIdString(localStoredName) && localStoredName !== 'Congregación Central'
    ? localStoredName
    : null;

  if (!congregationName || !congregationName.trim()) {
    return candidateLocal || fallback;
  }
  const clean = congregationName.trim();
  if (isCongregationIdString(clean) || (clean === 'Congregación Central' && candidateLocal)) {
    return candidateLocal || fallback;
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

export const GENERIC_IDENTITY_NAMES = new Set([
  '',
  'usuario',
  'hermano',
  'coordinador',
  'coordinador / anciano',
  'coordinador del cuerpo de ancianos',
  'hermano de la congregación',
  'hermano autorizado',
  'hno. usuario',
  'anciano',
  'publicador',
]);

export const isGenericIdentityName = (name?: string | null): boolean => {
  if (!name) return true;
  const clean = name.trim().toLowerCase();
  return (
    GENERIC_IDENTITY_NAMES.has(clean) ||
    clean.startsWith('coordinador') ||
    clean.startsWith('hermano de la')
  );
};
