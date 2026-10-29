// src/utils/security/assignmentSignature.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { sha256HexSync } from './sha256.ts';

const ASSIGNMENT_CONFIRM_HMAC_SALT = 'kongre_assignment_confirm_sig_2026_v1';

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
