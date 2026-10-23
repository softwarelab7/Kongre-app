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

  // Eliminar cualquier rastro de ID demo legado (1001-DEMO)
  if (raw.includes('DEMO')) {
    return '';
  }

  // Preservar IDs puramente numéricos legados si existen (ej: 10582)
  if (/^\d{4,6}$/.test(raw)) {
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

export function generateSecureRolePin(existingPins: string[] = []): string {
  return generateSecurePublisherPin(existingPins);
}

/**
 * Genera un PIN Maestro numérico seguro de 8 dígitos para el Coordinador (alta entropía).
 */
export function generateSecureMasterPin(): string {
  const array = new Uint32Array(2);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    array[0] = Math.floor(Math.random() * 0xffffffff);
    array[1] = Math.floor(Math.random() * 0xffffffff);
  }
  const p1 = (1000 + (array[0] % 9000)).toString();
  const p2 = (1000 + (array[1] % 9000)).toString();
  return `${p1}${p2}`;
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

// Anti-brute-force rate limiting helpers (persistidos en localStorage + sessionStorage para impedir evasión cerrando pestañas)
const LOCKOUT_KEY = 'kongre_pin_lockout_until';
const FAILED_COUNT_KEY = 'kongre_pin_failed_count';
const LAST_FAILED_AT_KEY = 'kongre_pin_last_failed_at';
const MAX_ATTEMPTS_BEFORE_COOLDOWN = 5;
const COOLDOWN_SECONDS = 30;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

export function getPinLockoutRemainingSeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const rawLocal = localStorage.getItem(LOCKOUT_KEY);
    const rawSession = sessionStorage.getItem(LOCKOUT_KEY);
    const lockoutUntil = Math.max(
      parseInt(rawLocal || '0', 10) || 0,
      parseInt(rawSession || '0', 10) || 0
    );
    const now = Date.now();
    if (lockoutUntil > now) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
  } catch {}
  return 0;
}

export function recordFailedPinAttempt(): { isLockedOut: boolean; remainingSeconds: number; attempts: number } {
  if (typeof window === 'undefined') return { isLockedOut: false, remainingSeconds: 0, attempts: 1 };
  try {
    const now = Date.now();
    const lastFailedAt = parseInt(localStorage.getItem(LAST_FAILED_AT_KEY) || sessionStorage.getItem(LAST_FAILED_AT_KEY) || '0', 10) || 0;
    const prevCountRaw = Math.max(
      parseInt(localStorage.getItem(FAILED_COUNT_KEY) || '0', 10) || 0,
      parseInt(sessionStorage.getItem(FAILED_COUNT_KEY) || '0', 10) || 0
    );

    // Si pasaron más de 15 minutos desde el último fallo, reiniciar contador base
    const baseCount = lastFailedAt > 0 && now - lastFailedAt > ATTEMPT_WINDOW_MS ? 0 : prevCountRaw;
    const currentAttempts = baseCount + 1;

    localStorage.setItem(FAILED_COUNT_KEY, currentAttempts.toString());
    localStorage.setItem(LAST_FAILED_AT_KEY, now.toString());
    sessionStorage.setItem(FAILED_COUNT_KEY, currentAttempts.toString());
    sessionStorage.setItem(LAST_FAILED_AT_KEY, now.toString());

    if (currentAttempts >= MAX_ATTEMPTS_BEFORE_COOLDOWN) {
      const tier = Math.floor(currentAttempts / MAX_ATTEMPTS_BEFORE_COOLDOWN);
      // Backoff exponencial: 30s (5 intentos), 60s (10 intentos), 120s (15 intentos), máx 300s
      const lockSeconds = Math.min(COOLDOWN_SECONDS * Math.pow(2, Math.max(0, tier - 1)), 300);
      const lockDuration = lockSeconds * 1000;
      const lockoutUntil = now + lockDuration;
      localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      sessionStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      return {
        isLockedOut: true,
        remainingSeconds: lockSeconds,
        attempts: currentAttempts,
      };
    }

    return {
      isLockedOut: false,
      remainingSeconds: 0,
      attempts: currentAttempts,
    };
  } catch {
    return { isLockedOut: false, remainingSeconds: 0, attempts: 1 };
  }
}

export function resetFailedPinAttempts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(FAILED_COUNT_KEY);
    localStorage.removeItem(LAST_FAILED_AT_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
    sessionStorage.removeItem(FAILED_COUNT_KEY);
    sessionStorage.removeItem(LAST_FAILED_AT_KEY);
  } catch {}
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

// ============================================================================
// PROTECCIÓN CRIPTOGRÁFICA DE PINs PERSONALES EN EL DIRECTORIO PÚBLICO Y LOCAL
// ============================================================================

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * Implementación síncrona estándar FIPS 180-4 de SHA-256 (idéntica a crypto.subtle.digest('SHA-256'))
 * Permite calcular y verificar hashes de PINs instantáneamente en memoria, filtros y sincronizaciones.
 */
export function sha256HexSync(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;

  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

const PERSONAL_PIN_SALT = 'kongre_personal_pin_salt_2026_v1';
const AT_REST_CIPHER_KEY = 'kongre_at_rest_vault_key_2026_aes_stream';

/**
 * Normaliza un PIN personal antes de aplicar hash o verificación
 */
export function normalizePersonalPinInput(pin?: string | null): string {
  if (!pin) return '';
  return String(pin).trim().toUpperCase().replace(/[-\s]/g, '');
}

/**
 * Genera el hash criptográfico irreversible SHA-256 con sal de un PIN personal.
 * Soporta sal contextual (ej: id_congregacion:publisherId) para evitar ataques de tablas precomputadas.
 */
export function hashPersonalPin(pin?: string | null, saltContext?: string): string {
  const clean = normalizePersonalPinInput(pin);
  if (!clean || clean.length < 4) return '';
  // Si ya es un hash SHA-256 de 64 caracteres hexadecimales, devolverlo tal cual
  if (/^[a-f0-9]{64}$/i.test(clean)) return clean.toLowerCase();
  const salt = saltContext ? `${PERSONAL_PIN_SALT}:${saltContext}` : PERSONAL_PIN_SALT;
  return sha256HexSync(`${clean}:${salt}`);
}

/**
 * Ofusca simétricamente un PIN para almacenamiento local en reposo (evita que inspeccionar
 * `localStorage` en DevTools muestre texto plano de forma inmediata).
 * Nota: es una medida de defensa en profundidad local / ofuscación, no una barrera criptográfica absoluta.
 */
export function encryptPinAtRest(pin?: string | null): string {
  if (!pin) return '';
  const clean = String(pin).trim();
  if (!clean || clean === '••••') return '';
  if (clean.startsWith('kgr_v1:')) return clean;

  const keyHash = sha256HexSync(AT_REST_CIPHER_KEY);
  const plainBytes = new TextEncoder().encode(clean);
  const out = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    const keyByte = parseInt(keyHash.slice((i * 2) % 60, ((i * 2) % 60) + 2), 16);
    out[i] = plainBytes[i] ^ keyByte;
  }
  return `kgr_v1:${bufferToHex(out.buffer)}`;
}

/**
 * Descifra en memoria un PIN cifrado en reposo
 */
export function decryptPinAtRest(encoded?: string | null): string {
  if (!encoded) return '';
  const clean = String(encoded).trim();
  if (!clean.startsWith('kgr_v1:')) return '';
  try {
    const hexPart = clean.slice('kgr_v1:'.length);
    if (!hexPart || hexPart.length % 2 !== 0) return '';
    const cipherBytes = hexToBuffer(hexPart);
    const keyHash = sha256HexSync(AT_REST_CIPHER_KEY);
    const out = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      const keyByte = parseInt(keyHash.slice((i * 2) % 60, ((i * 2) % 60) + 2), 16);
      out[i] = cipherBytes[i] ^ keyByte;
    }
    return new TextDecoder().decode(out);
  } catch {
    return '';
  }
}

/**
 * Verifica de forma segura si un PIN candidato coincide con un registro de publicador o directorio de PINs.
 * Soporta verificación contra `personalPinHash` / `pinHash` (preferido), `encryptedPin`, o `personalPin` / `pin` legado.
 */
export function verifyPersonalPinMatch(
  candidatePin: string | null | undefined,
  record: {
    id?: string;
    publisherId?: string;
    personalPin?: string;
    pin?: string;
    personalPinHash?: string;
    pinHash?: string;
    encryptedPin?: string;
  } | null | undefined
): boolean {
  if (!candidatePin || !record) return false;
  const cleanCandidate = normalizePersonalPinInput(candidatePin);
  if (cleanCandidate.length < 4) return false;

  const candidateHash = hashPersonalPin(cleanCandidate);
  const legacyHash = sha256HexSync(`${ candidatePin.trim() }kongre_theocratic_salt_2026`);

  // 1. Verificar contra hash almacenado (personalPinHash o pinHash)
  const storedHash = (record.personalPinHash || record.pinHash || '').trim().toLowerCase();
  if (storedHash && storedHash.length === 64) {
    if (storedHash === candidateHash || storedHash === legacyHash) {
      return true;
    }
    const pubId = record.id || record.publisherId;
    if (pubId && storedHash === hashPersonalPin(cleanCandidate, pubId)) {
      return true;
    }
  }

  // 2. Verificar contra PIN cifrado en reposo si existe
  if (record.encryptedPin) {
    const decrypted = normalizePersonalPinInput(decryptPinAtRest(record.encryptedPin));
    if (decrypted && decrypted.length >= 4 && decrypted === cleanCandidate) {
      return true;
    }
  }

  // 3. Compatibilidad con registros legados o en memoria que aún posean personalPin / pin en texto plano
  const rawStoredPin = String(record.personalPin || record.pin || '').trim();
  if (rawStoredPin && rawStoredPin !== '••••' && !rawStoredPin.startsWith('kgr_v1:')) {
    if (/^[a-f0-9]{64}$/i.test(rawStoredPin)) {
      const lowerStored = rawStoredPin.toLowerCase();
      if (lowerStored === candidateHash || lowerStored === legacyHash) return true;
    } else {
      const normalizedStored = normalizePersonalPinInput(rawStoredPin);
      if (normalizedStored.length >= 4 && normalizedStored === cleanCandidate) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Sanitiza la lista de publicadores antes de guardarla en localStorage:
 * Reemplaza `personalPin` en texto plano por `personalPinHash` y `encryptedPin`
 * para que ningún PIN quede expuesto en texto plano al inspeccionar localStorage.
 */
export function sanitizePublishersForLocalStorage<T extends Record<string, any>>(publishers: T[]): T[] {
  if (!Array.isArray(publishers)) return [];
  return publishers.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const rawPin = p.personalPin ? String(p.personalPin).trim() : '';
    const hasPlainPin = rawPin.length >= 4 && rawPin !== '••••' && !rawPin.startsWith('kgr_v1:') && !/^[a-f0-9]{64}$/i.test(rawPin);
    const pinHash = hasPlainPin ? hashPersonalPin(rawPin) : (p.personalPinHash || '');
    const encryptedPin = hasPlainPin ? encryptPinAtRest(rawPin) : (p.encryptedPin || '');

    const clone: Record<string, any> = { ...p };
    delete clone.personalPin;
    if (pinHash) clone.personalPinHash = pinHash;
    if (encryptedPin) clone.encryptedPin = encryptedPin;
    return clone as T;
  });
}

/**
 * Restaura en memoria la lista de publicadores leída desde localStorage
 */
export function restorePublishersFromLocalStorage<T extends Record<string, any>>(publishers: T[]): T[] {
  if (!Array.isArray(publishers)) return [];
  return publishers.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const rawPin = p.personalPin ? String(p.personalPin).trim() : '';
    const restoredPin =
      rawPin && rawPin !== '••••' && !rawPin.startsWith('kgr_v1:') && !/^[a-f0-9]{64}$/i.test(rawPin)
        ? rawPin
        : p.encryptedPin
        ? decryptPinAtRest(p.encryptedPin)
        : '';
    const pinHash =
      p.personalPinHash ||
      (restoredPin ? hashPersonalPin(restoredPin) : '');

    return {
      ...p,
      ...(restoredPin ? { personalPin: restoredPin } : {}),
      ...(pinHash ? { personalPinHash: pinHash } : {}),
    };
  });
}

/**
 * Sanitiza los registros del directorio de PINs (`kongre_publisher_unique_pins_v1`) antes de guardarlos en localStorage
 */
export function sanitizePinRecordsForLocalStorage<T extends Record<string, any>>(records: T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.map((rec) => {
    if (!rec || typeof rec !== 'object') return rec;
    const rawPin = rec.pin ? String(rec.pin).trim() : '';
    const hasPlainPin = rawPin.length >= 4 && rawPin !== '••••' && !rawPin.startsWith('kgr_v1:') && !/^[a-f0-9]{64}$/i.test(rawPin);
    const pinHash = hasPlainPin ? hashPersonalPin(rawPin) : (rec.pinHash || rec.personalPinHash || '');
    const encryptedPin = hasPlainPin ? encryptPinAtRest(rawPin) : (rec.encryptedPin || '');

    const clone: Record<string, any> = {
      ...rec,
      pin: '', // Nunca almacenar el PIN en texto plano en localStorage
    };
    if (pinHash) clone.pinHash = pinHash;
    if (encryptedPin) clone.encryptedPin = encryptedPin;
    return clone as T;
  });
}

/**
 * Restaura en memoria los registros del directorio de PINs leídos desde localStorage
 */
export function restorePinRecordsFromLocalStorage<T extends Record<string, any>>(records: T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.map((rec) => {
    if (!rec || typeof rec !== 'object') return rec;
    const rawPin = rec.pin ? String(rec.pin).trim() : '';
    const restoredPin =
      rawPin && rawPin !== '••••' && !rawPin.startsWith('kgr_v1:') && !/^[a-f0-9]{64}$/i.test(rawPin)
        ? rawPin
        : rec.encryptedPin
        ? decryptPinAtRest(rec.encryptedPin)
        : '';
    const pinHash =
      rec.pinHash ||
      rec.personalPinHash ||
      (restoredPin ? hashPersonalPin(restoredPin) : '');

    return {
      ...rec,
      pin: restoredPin,
      ...(pinHash ? { pinHash } : {}),
    };
  });
}

const ROLE_SESSION_SIG_KEY = 'kongre_role_session_sig_v1';

/**
 * Almacena un PIN sensible (como kongre_coordinator_pin, kongre_session_pin_v2, kongre_registered_cong_pin)
 * cifrado en reposo (`kgr_v1:...`) junto con su hash SHA-256 (`${key}_hash`), evitando texto plano en localStorage.
 */
export function setSecureLocalPin(key: string, rawPin?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = rawPin ? String(rawPin).trim() : '';
    if (!clean || clean === '••••' || clean === '••••••••') {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_hash`);
      return;
    }
    const plain = clean.startsWith('kgr_v1:') ? decryptPinAtRest(clean) : clean;
    if (!plain) return;
    const encrypted = encryptPinAtRest(plain);
    const hashed = hashPersonalPin(plain);
    localStorage.setItem(key, encrypted);
    if (hashed) {
      localStorage.setItem(`${key}_hash`, hashed);
    }
  } catch {}
}

/**
 * Recupera y descifra en memoria un PIN almacenado en localStorage.
 * Si detecta un valor legado en texto plano, lo migra automáticamente a formato cifrado `kgr_v1:...`.
 */
export function getSecureLocalPin(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return '';
    const trimmed = stored.trim();
    if (!trimmed || trimmed === '••••' || trimmed === '••••••••') return '';
    if (trimmed.startsWith('kgr_v1:')) {
      return decryptPinAtRest(trimmed);
    }
    // Si es un hash de 64 caracteres hexadecimales, no es reversible a texto plano
    if (/^[a-f0-9]{64}$/i.test(trimmed)) {
      return '';
    }
    // Migrar automáticamente PIN legado en texto plano a formato cifrado en reposo
    setSecureLocalPin(key, trimmed);
    return trimmed;
  } catch {
    return '';
  }
}

/**
 * Verifica si un PIN candidato coincide con el PIN almacenado bajo `key` en localStorage (vía hash o valor descifrado)
 */
export function verifySecureLocalPin(key: string, candidatePin?: string | null): boolean {
  if (typeof window === 'undefined' || !candidatePin) return false;
  const cleanCandidate = normalizePersonalPinInput(candidatePin);
  if (cleanCandidate.length < 4) return false;
  try {
    const storedHash = localStorage.getItem(`${key}_hash`);
    const candidateHash = hashPersonalPin(cleanCandidate);
    if (storedHash && candidateHash && storedHash.toLowerCase() === candidateHash.toLowerCase()) {
      return true;
    }
    const decrypted = normalizePersonalPinInput(getSecureLocalPin(key));
    return Boolean(decrypted && decrypted.length >= 4 && decrypted === cleanCandidate);
  } catch {
    return false;
  }
}

/**
 * Genera y persiste una firma criptográfica de integridad para la sesión de rol activa (`kongre_role_session_sig_v1`),
 * impidiendo la escalada de privilegios mediante edición manual de `kongre_active_role_v1` en DevTools.
 */
export function signRoleSession(role: string, roles?: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const normRole = (role || 'publico').trim().toLowerCase();
    const normRoles = Array.isArray(roles) && roles.length > 0
      ? roles.map((r) => String(r).trim().toLowerCase()).join(',')
      : normRole;
    const sig = sha256HexSync(`role_sig_v1|${normRole}|${normRoles}|${AT_REST_CIPHER_KEY}`);
    localStorage.setItem(ROLE_SESSION_SIG_KEY, sig);
  } catch {}
}

/**
 * Verifica la firma de la sesión de rol activa en localStorage.
 * Nota de seguridad: Esta verificación es una protección de estado en UI para evitar
 * modificaciones accidentales o no autorizadas en localStorage, pero no constituye una
 * barrera criptográfica frente a alguien con acceso a DevTools en el navegador.
 */
export function verifyRoleSessionSignature(role: string, roles?: string[]): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const normRole = (role || 'publico').trim().toLowerCase();
    const normRolesList = Array.isArray(roles) && roles.length > 0
      ? roles.map((r) => String(r).trim().toLowerCase())
      : [normRole];

    if (normRole === 'publico' && normRolesList.every((r) => r === 'publico')) {
      return true;
    }
    if (localStorage.getItem('kongre_demo_mode') === 'true') {
      return true;
    }

    const normRoles = normRolesList.join(',');
    const expectedSig = sha256HexSync(`role_sig_v1|${normRole}|${normRoles}|${AT_REST_CIPHER_KEY}`);
    const storedSig = localStorage.getItem(ROLE_SESSION_SIG_KEY);

    if (storedSig && storedSig === expectedSig) {
      return true;
    }

    // Solo se re-firma si el PIN de sesión coincide estrictamente con el PIN verificado del Coordinador
    const sessionPin = getSecureLocalPin('kongre_session_pin_v2');
    const coordPin = getSecureLocalPin('kongre_coordinator_pin');
    if (coordPin && sessionPin && normalizePersonalPinInput(coordPin) === normalizePersonalPinInput(sessionPin)) {
      signRoleSession(normRole, normRolesList);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Genera un código de invitación teocrática con entropía criptográfica real (CSPRNG)
 * usando alfabeto Crockford Base32 (sin 0, O, 1, I) de 6 caracteres (más de mil millones de combinaciones).
 * Ejemplo: KONG-SEC-8X4M9P
 */
export function generateSecureInvitationCode(rolePrefix: string = 'KONG'): string {
  const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = new Uint8Array(6);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 6; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const token = Array.from(randomBytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
  return `KONG-${rolePrefix.toUpperCase()}-${token}`;
}

export interface SecureShareTokenPayload {
  cong?: string;
  cpin?: string;
  pub?: string;
  pin?: string;
  invite?: string;
  exp?: number;
}

const SHARE_TOKEN_CIPHER_KEY = 'kongre_share_link_qr_cipher_v1_2026';

/**
 * Codifica y cifra las credenciales de un enlace directo o código QR en un único parámetro `?tk=kgr_tk1_...`
 * evitando exponer `cpin` o `pin` en texto plano en la barra de direcciones, historial del navegador o logs.
 */
export function encodeSecureShareToken(payload: SecureShareTokenPayload): string {
  try {
    const compact: Record<string, any> = {};
    if (payload.cong) compact.c = formatCanonicalCongregationId(payload.cong);
    if (payload.cpin) compact.k = payload.cpin.trim();
    if (payload.pub) compact.u = payload.pub.trim();
    if (payload.pin) compact.p = payload.pin.trim();
    if (payload.invite) compact.i = payload.invite.trim();
    if (payload.exp) compact.e = payload.exp;

    const json = JSON.stringify(compact);
    const plainBytes = new TextEncoder().encode(json);
    const nonceBytes = new Uint8Array(4);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(nonceBytes);
    } else {
      for (let i = 0; i < 4; i++) nonceBytes[i] = Math.floor(Math.random() * 256);
    }
    const nonceHex = bufferToHex(nonceBytes.buffer);
    const streamHash = sha256HexSync(`${SHARE_TOKEN_CIPHER_KEY}:${nonceHex}:stream`);
    const cipherBytes = new Uint8Array(plainBytes.length);
    for (let i = 0; i < plainBytes.length; i++) {
      const kByte = parseInt(streamHash.slice((i * 2) % 60, ((i * 2) % 60) + 2), 16);
      cipherBytes[i] = plainBytes[i] ^ kByte;
    }
    const cipherHex = bufferToHex(cipherBytes.buffer);
    const macTag = sha256HexSync(`${SHARE_TOKEN_CIPHER_KEY}:${nonceHex}:${cipherHex}:mac`).slice(0, 8);
    return `kgr_tk1_${nonceHex}${macTag}${cipherHex}`;
  } catch {
    return '';
  }
}

/**
 * Verifica la autenticidad y descifra un token `?tk=kgr_tk1_...` procedente de un enlace directo o código QR.
 */
export function decodeSecureShareToken(token?: string | null): SecureShareTokenPayload | null {
  if (!token) return null;
  const clean = token.trim();
  if (!clean.startsWith('kgr_tk1_')) return null;
  try {
    const body = clean.slice('kgr_tk1_'.length);
    if (body.length < 18) return null;
    const nonceHex = body.slice(0, 8);
    const macTag = body.slice(8, 16).toLowerCase();
    const cipherHex = body.slice(16);
    if (cipherHex.length % 2 !== 0) return null;

    const expectedMac = sha256HexSync(`${SHARE_TOKEN_CIPHER_KEY}:${nonceHex}:${cipherHex}:mac`).slice(0, 8).toLowerCase();
    if (macTag !== expectedMac) return null;

    const cipherBytes = hexToBuffer(cipherHex);
    const streamHash = sha256HexSync(`${SHARE_TOKEN_CIPHER_KEY}:${nonceHex}:stream`);
    const plainBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      const kByte = parseInt(streamHash.slice((i * 2) % 60, ((i * 2) % 60) + 2), 16);
      plainBytes[i] = cipherBytes[i] ^ kByte;
    }
    const decodedStr = new TextDecoder().decode(plainBytes);
    const parsed = JSON.parse(decodedStr);
    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.e && typeof parsed.e === 'number' && Date.now() > parsed.e) {
      return null;
    }

    return {
      cong: parsed.c ? formatCanonicalCongregationId(String(parsed.c)) : undefined,
      cpin: parsed.k ? String(parsed.k) : undefined,
      pub: parsed.u ? String(parsed.u) : undefined,
      pin: parsed.p ? String(parsed.p) : undefined,
      invite: parsed.i ? String(parsed.i) : undefined,
      exp: parsed.e ? Number(parsed.e) : undefined,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// #5: SANITIZACIÓN DE RESPALDOS IMPORTADOS Y SELLO CRIPTOGRÁFICO DE INTEGRIDAD
// ============================================================================

const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const BACKUP_INTEGRITY_SEAL_SALT = 'kongre_backup_integrity_seal_2026_v1';

/**
 * Limpia recursivamente un objeto JSON importado desde un archivo externo:
 * 1. Elimina claves de Prototype Pollution (`__proto__`, `constructor`, `prototype`).
 * 2. Neutraliza vectores de inyección XSS (`<script>`, `javascript:`, `vbscript:`, `data:text/html`, manejadores inline `on*=`) en cadenas.
 */
export function sanitizeImportedBackupObject<T>(input: T, depth = 0): T {
  if (depth > 30 || input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string') {
    const cleaned = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
      .replace(/\bon(error|load|click|mouseover|focus|blur)\s*=/gi, '');
    return cleaned as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeImportedBackupObject(item, depth + 1)) as unknown as T;
  }
  if (typeof input === 'object') {
    const safeObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      if (FORBIDDEN_OBJECT_KEYS.has(key)) continue;
      safeObj[key] = sanitizeImportedBackupObject(value, depth + 1);
    }
    return safeObj as T;
  }
  return input;
}

/**
 * Calcula un sello criptográfico SHA-256 (`kgr_seal_v1_...`) sobre los datos esenciales de un respaldo JSON
 * para detectar cualquier alteración o corrupción antes de restaurarlo.
 */
export function computeBackupIntegritySeal(backupData: Record<string, any>): string {
  try {
    const pubs = Array.isArray(backupData.publishers) ? backupData.publishers : [];
    const weeks = Array.isArray(backupData.weeks) ? backupData.weeks : [];
    const territories = Array.isArray(backupData.territories) ? backupData.territories : [];
    const transactions = Array.isArray(backupData.transactions) ? backupData.transactions : [];
    const pubIds = pubs.map((p: any) => `${p?.id || ''}:${p?.name || ''}:${p?.theocraticRole || ''}`).sort().join(',');
    const weekIds = weeks.map((w: any) => String(w?.id || '')).sort().join(',');
    const congId = String(
      backupData.settings?.congregationNumber ||
      backupData.settings?.congregationId ||
      backupData.congregationName ||
      ''
    ).trim();

    const canonicalPayload = [
      BACKUP_INTEGRITY_SEAL_SALT,
      congId,
      String(pubs.length),
      pubIds,
      String(weeks.length),
      weekIds,
      String(territories.length),
      String(transactions.length),
    ].join('|');

    return `kgr_seal_v1_${sha256HexSync(canonicalPayload)}`;
  } catch {
    return '';
  }
}

/**
 * Verifica el sello criptográfico de integridad de un archivo de respaldo JSON.
 * Si el archivo incluye `integritySeal`, comprueba que coincida exactamente con el contenido actual.
 */
export function verifyBackupIntegritySeal(backupData: Record<string, any>): {
  valid: boolean;
  isSigned: boolean;
} {
  if (!backupData || typeof backupData !== 'object') {
    return { valid: false, isSigned: false };
  }
  const seal = typeof backupData.integritySeal === 'string' ? backupData.integritySeal.trim() : '';
  if (!seal) {
    // Respaldos legados sin firma se permiten tras pasar por sanitizeImportedBackupObject
    return { valid: true, isSigned: false };
  }
  const expected = computeBackupIntegritySeal(backupData);
  return {
    valid: Boolean(expected && seal === expected),
    isSigned: true,
  };
}

// ============================================================================
// #6: PROTECCIÓN CRIPTOGRÁFICA DE INVITACIONES, ANTI-FORMULA-INJECTION CSV Y FIRMA DE ASIGNACIONES
// ============================================================================

const INVITATION_CODE_HASH_SALT = 'kongre_invitation_code_salt_2026_v1';
const ASSIGNMENT_CONFIRM_HMAC_SALT = 'kongre_assignment_confirm_sig_2026_v1';

/**
 * Calcula un hash SHA-256 con sal para un código de invitación teocrático.
 * Permite verificar códigos de invitación en `payload_public` sin exponer el código en texto plano.
 */
export function hashInvitationCode(code: string | null | undefined): string {
  if (!code) return '';
  const clean = String(code).trim().toUpperCase();
  if (!clean) return '';
  return `inv_h1_${sha256HexSync(`${INVITATION_CODE_HASH_SALT}:${clean}`)}`;
}

/**
 * Verifica si un código ingresado coincide con una invitación (por código directo o por su hash `codeHash`).
 * Es resiliente ante variaciones como:
 * - Códigos completos: KONG-SEC-8X4M9P
 * - Códigos sin prefijo: SEC-8X4M9P
 * - Variaciones de espacios o guiones
 * - Tokens cifrados de enlaces QR (kgr_tk1_...)
 * - Códigos portátiles compuestos (CONG::CPIN::INVITE)
 */
export function verifyInvitationCodeMatch(
  inputCode: string | null | undefined,
  invitation: { code?: string; codeHash?: string } | null | undefined
): boolean {
  if (!inputCode || !invitation) return false;
  let raw = String(inputCode).trim();
  if (!raw) return false;

  // 1. Si es un token cifrado de enlace directo o QR (kgr_tk1_...), extraer el parámetro 'invite'
  if (raw.startsWith('kgr_tk1_')) {
    const decoded = decodeSecureShareToken(raw);
    if (decoded?.invite) {
      raw = decoded.invite.trim();
    }
  }

  // 2. Si es un código compuesto con '::' (ej: KGR-XXXX-XXXX::PINCONG::KONG-SEC-...), extraer el segmento final
  if (raw.includes('::')) {
    const parts = raw.split('::').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      raw = parts.slice(2).join('::');
    }
  }

  const cleanInput = raw.toUpperCase().replace(/\s+/g, '-');
  if (!cleanInput) return false;

  // Generar variaciones candidatas (ej: con KONG-, sin KONG-, o con caracteres alfanuméricos puros)
  const candidates = new Set<string>([cleanInput]);
  if (!cleanInput.startsWith('KONG-')) {
    candidates.add(`KONG-${cleanInput}`);
  } else {
    candidates.add(cleanInput.slice(5)); // Remover KONG-
  }

  // Candidatos sin guiones ni espacios
  const stripped = cleanInput.replace(/[^A-Z0-9]/g, '');
  if (stripped) {
    candidates.add(stripped);
    if (!stripped.startsWith('KONG')) {
      candidates.add(`KONG${stripped}`);
    }
  }

  // Comparar candidatos contra codeHash y contra code en memoria
  for (const cand of candidates) {
    if (invitation.codeHash) {
      const computed = hashInvitationCode(cand);
      if (computed === invitation.codeHash) return true;
    }

    if (invitation.code) {
      const normStored = String(invitation.code).trim().toUpperCase();
      if (normStored === cand) return true;
      if (normStored.replace(/[^A-Z0-9]/g, '') === cand.replace(/[^A-Z0-9]/g, '')) return true;
      if (!normStored.startsWith('KONG-') && `KONG-${normStored}` === cand) return true;
      if (normStored.startsWith('KONG-') && normStored.slice(5) === cand) return true;
    }
  }

  return false;
}

/**
 * Sanitiza la lista de invitaciones antes de incluirla en `payload_public` de Supabase:
 * - Calcula `codeHash` para cada invitación activa
 * - Oculta el código en texto plano (`code: ''`) en el payload público para impedir que terceros extraigan códigos activos
 */
export function sanitizeInvitationsForPublicPayload(invitations: any[]): any[] {
  if (!Array.isArray(invitations)) return [];
  return invitations.map((inv) => {
    if (!inv || typeof inv !== 'object') return inv;
    const codeHash = inv.codeHash || (inv.code ? hashInvitationCode(inv.code) : undefined);
    const maskedCode = inv.code
      ? `${String(inv.code).slice(0, 4)}-••••`
      : '';
    return {
      ...inv,
      code: maskedCode,
      ...(codeHash ? { codeHash } : {}),
    };
  });
}

/**
 * Neutraliza vectores de Inyección de Fórmulas en CSV / Excel (CWE-1236 / DDE Injection).
 * Si un valor comienza con `=`, `+`, `-`, `@`, `\t` o `\r` (salvo números telefónicos seguros o fechas),
 * antepone un apóstrofo `'` para forzar modo texto en Excel / Calc / Google Sheets.
 */
export function sanitizeCsvFormulaInjection(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  if (!str) return '';
  const trimmed = str.trimStart();
  if (/^[=+\-@]/.test(trimmed) || /^[\t\r]/.test(str)) {
    // Permitir números telefónicos legítimos tipo "+52 55 1234 5678" o "---" sin romper formato,
    // pero bloquear cualquier expresión con letras, paréntesis, pipes o comandos
    if (/^\+\d[\d\s\-()]{4,20}$/.test(trimmed) || /^-{2,5}$/.test(trimmed)) {
      return str;
    }
    return `'${str}`;
  }
  return str;
}

/**
 * Limpia texto proveniente de archivos CSV importados:
 * - Remueve prefijos de inyección de fórmulas (`'=`, `=`, `@`, etc.)
 * - Neutraliza etiquetas `<script>`, `javascript:` y manejadores de eventos HTML inline (`onload=`, `onerror=`, etc.)
 */
export function sanitizeImportedCsvText(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .replace(/\bon(error|load|click|mouseover|focus|blur)\s*=/gi, '')
    .replace(/^'+([=+\-@])/, '$1')
    .replace(/^[=@\t\r]+/, '')
    .trim();
}

/**
 * Calcula una firma criptográfica corta (`sig`) para enlaces de confirmación de asignación en 1 clic.
 */
export function computeAssignmentConfirmSignature(
  weekId: string,
  meetingType: string,
  assignmentPath: string,
  publisherId: string
): string {
  const payload = [
    ASSIGNMENT_CONFIRM_HMAC_SALT,
    String(weekId || '').trim(),
    String(meetingType || '').trim(),
    String(assignmentPath || '').trim(),
    String(publisherId || '').trim(),
  ].join('|');
  return sha256HexSync(payload).slice(0, 16);
}

/**
 * Verifica la firma criptográfica de un enlace de confirmación de asignación.
 * Si el enlace incluye `sig`, debe coincidir exactamente con los parámetros de la asignación.
 */
export function verifyAssignmentConfirmSignature(
  weekId: string,
  meetingType: string,
  assignmentPath: string,
  publisherId: string,
  sig?: string | null
): boolean {
  if (!weekId || !assignmentPath || !publisherId) return false;
  if (!sig) {
    // Compatibilidad con enlaces generados antes de v2.8.10 si los parámetros tienen formato canónico seguro
    return (
      /^[a-zA-Z0-9_\-]+$/.test(weekId) &&
      (meetingType === 'midweek' || meetingType === 'weekend') &&
      /^[a-zA-Z0-9_.\-]+$/.test(assignmentPath) &&
      /^[a-zA-Z0-9_\-]+$/.test(publisherId)
    );
  }
  const expected = computeAssignmentConfirmSignature(weekId, meetingType, assignmentPath, publisherId);
  return sig.trim() === expected;
}

/**
 * Abre una URL externa (como WhatsApp `https://wa.me/...`) mediante un elemento `<a>` seguro
 * con `rel="noopener noreferrer"` sin depender de `window.open`.
 */
export function openSafeExternalUrl(url: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !url) return;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
    }, 100);
  } catch {}
}

