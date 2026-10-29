// src/utils/security/random.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).

/**
 * Obtiene bytes pseudoaleatorios criptográficamente seguros usando CSPRNG.
 * L-01: Evita degradación silenciosa a Math.random(). Lanza excepción si Web Crypto no está disponible.
 */
export function getSecureRandomBytes(len: number): Uint8Array {
  const bytes = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    return bytes;
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error('Entorno criptográficamente inseguro: Web Crypto API no disponible.');
}

/**
 * Genera un entero aleatorio en [0, maxExclusive) sin sesgo de módulo (rejection sampling).
 */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  const maxValid = Math.floor(256 / maxExclusive) * maxExclusive;
  while (true) {
    const byte = getSecureRandomBytes(1)[0];
    if (byte < maxValid) {
      return byte % maxExclusive;
    }
  }
}
