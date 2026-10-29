// src/utils/security/slowHash.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { bufferToHex, hexToBuffer } from './bytes.ts';

export const SLOW_HASH_PREFIX = 'pbkdf2:';

export const DEFAULT_SLOW_HASH_ITERATIONS = 200000;

/**
 * Genera un hash seguro con sal fija para el PIN de congregación (mantiene compatibilidad de red y sincronización).
 */
export async function hashPasscode(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = 'kongre_theocratic_salt_2026';
  const data = enc.encode(pin + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Genera un hash lento con PBKDF2 (200.000 iteraciones SHA-256) y sal aleatoria única de 128 bits.
 * Protege contra fuerza bruta offline por GPU en caso de robo o copia de localStorage.
 */
export async function hashPasscodeSlow(
  pin: string,
  iterations: number = DEFAULT_SLOW_HASH_ITERATIONS
): Promise<string> {
  const clean = pin.trim();
  const enc = new TextEncoder();
  const saltBytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(clean),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );
  const saltHex = bufferToHex(saltBytes);
  const hashHex = bufferToHex(derivedBits);
  return `${SLOW_HASH_PREFIX}${iterations}:${saltHex}:${hashHex}`;
}

/**
 * Determina si una cadena es un hash lento PBKDF2
 */
export function isSlowHash(hash?: string | null): boolean {
  return typeof hash === 'string' && hash.startsWith(SLOW_HASH_PREFIX);
}

/**
 * Verifica si un PIN / clave ingresada coincide con el hash almacenado:
 * - Soporta el formato lento PBKDF2 (pbkdf2:200000:salt:hash)
 * - Mantiene total retrocompatibilidad con hashes SHA-256 existentes
 * - Soporta comparación exacta, insensible a mayúsculas y sin guiones
 */
export async function verifyPasscode(pin: string, storedHash: string): Promise<boolean> {
  if (!pin || !storedHash) return false;
  const clean = pin.trim();

  // 1. Si el hash almacenado es PBKDF2
  if (storedHash.startsWith(SLOW_HASH_PREFIX)) {
    try {
      const parts = storedHash.slice(SLOW_HASH_PREFIX.length).split(':');
      if (parts.length !== 3) return false;
      const iters = parseInt(parts[0], 10);
      const saltHex = parts[1];
      const expectedHashHex = parts[2];
      if (!iters || isNaN(iters) || !saltHex || !expectedHashHex) return false;

      const saltBytes = hexToBuffer(saltHex);
      const enc = new TextEncoder();

      // Variantes candidatas (directa, mayúsculas, sin guiones, con guión 4-4)
      const candidates: string[] = [clean];
      const upper = clean.toUpperCase();
      if (!candidates.includes(upper)) candidates.push(upper);
      const unhyphenated = upper.replace(/[-\s]/g, '');
      if (!candidates.includes(unhyphenated)) candidates.push(unhyphenated);
      if (unhyphenated.length === 8) {
        const formatted = `${unhyphenated.slice(0, 4)}-${unhyphenated.slice(4)}`;
        if (!candidates.includes(formatted)) candidates.push(formatted);
      }

      for (const cand of candidates) {
        const baseKey = await globalThis.crypto.subtle.importKey(
          'raw',
          enc.encode(cand),
          'PBKDF2',
          false,
          ['deriveBits']
        );
        const derivedBits = await globalThis.crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: new Uint8Array(saltBytes),
            iterations: iters,
            hash: 'SHA-256',
          },
          baseKey,
          256
        );
        const derivedHex = bufferToHex(derivedBits);
        if (derivedHex.toLowerCase() === expectedHashHex.toLowerCase()) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // 2. Formato legado SHA-256 rápido con sal fija
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
