// src/utils/security/personalPin.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { sha256HexSync } from './sha256.ts';

const PERSONAL_PIN_SALT = 'kongre_personal_pin_salt_2026_v1';

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
