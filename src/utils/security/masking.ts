// src/utils/security/masking.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).

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
