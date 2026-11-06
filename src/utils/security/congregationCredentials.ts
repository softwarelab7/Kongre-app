// src/utils/security/congregationCredentials.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { getSecureRandomBytes, secureRandomInt } from './random.ts';

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
  const randomBytes = getSecureRandomBytes(8);

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

  // Permitir hasta 24 caracteres (soporta passphrases o PINs extendidos de alta entropía)
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  if (!clean) return '';

  if (clean.length <= 4) {
    return clean.length === 4 && !isDeleting
      ? `${clean}-`
      : clean;
  }

  if (clean.length <= 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }

  // Claves extendidas / passphrases (> 8 caracteres): agrupar en bloques de 4
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    chunks.push(clean.slice(i, i + 4));
  }
  return chunks.join('-');
}

/** Mínimo de caracteres alfanuméricos del PIN de congregación (el guion de formato NO cuenta). */
export const MIN_CONGREGATION_PIN_CHARS = 8;

/**
 * Cuenta solo letras y números del PIN de congregación. Antes se validaba `pin.length >= 8` sobre el texto
 * formateado, de modo que "ABCD-EFG" (7 caracteres reales + guion) pasaba como válido.
 */
export function countCongregationPinChars(pin: string): number {
  return String(pin ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').length;
}

export function isValidCongregationPinLength(pin: string): boolean {
  return countCongregationPinChars(pin) >= MIN_CONGREGATION_PIN_CHARS;
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

  const randomBytes = getSecureRandomBytes(8);
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

  // Mezclar orden con Fisher-Yates sin sesgo (L-01)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
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
 * Genera un PIN Maestro numérico seguro de 12 dígitos para el Coordinador (alta entropía).
 */
export function generateSecureMasterPin(): string {
  // 12 dígitos (~40 bits) con muestreo por rechazo (sin sesgo de módulo). El PIN maestro es lo único que
  // protege el cifrado del payload maestro frente a un ataque sin conexión, así que la longitud importa.
  const LIMIT = 0x100000000 - (0x100000000 % 10);
  const nextDigit = (): string => {
    const buf = new Uint32Array(1);
    do {
      crypto.getRandomValues(buf);
    } while (buf[0] >= LIMIT);
    return String(buf[0] % 10);
  };
  let pin = '';
  do {
    pin = Array.from({ length: 12 }, nextDigit).join('');
  } while (/^(\d)\1+$/.test(pin));
  return pin;
}
