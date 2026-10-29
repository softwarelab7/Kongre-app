// src/utils/security/invitations.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { sha256HexSync } from './sha256.ts';
import { decodeSecureShareToken } from './shareTokens.ts';

const INVITATION_CODE_HASH_SALT = 'kongre_invitation_code_salt_2026_v1';

/**
 * Calcula un hash SHA-256 seguro para un código de invitación teocrático.
 * Permite verificar códigos de invitación en `payload_public` sin exponer el código en texto plano.
 * Formato v2 (inv_h2_...): Normaliza a caracteres alfanuméricos canónicos para soportar
 * cualquier variación de formato (con o sin guiones, con o sin KONG-).
 */
export function hashInvitationCode(code: string | null | undefined): string {
  if (!code) return '';
  const clean = String(code).trim().toUpperCase();
  if (!clean) return '';
  const stripped = clean.replace(/[^A-Z0-9]/g, '');
  return `inv_h2_${sha256HexSync(`${INVITATION_CODE_HASH_SALT}:v2:${stripped}`)}`;
}

/**
 * Hash v1 heredado (para verificar invitaciones previas emitidas con formato v1)
 */
export function hashInvitationCodeV1(code: string | null | undefined): string {
  if (!code) return '';
  const clean = String(code).trim().toUpperCase();
  if (!clean) return '';
  return `inv_h1_${sha256HexSync(`${INVITATION_CODE_HASH_SALT}:${clean}`)}`;
}

/**
 * Verifica si un código ingresado coincide con una invitación (por código directo o por su hash `codeHash`).
 * Es resiliente ante variaciones como:
 * - Códigos completos: KONG-SEC-8X4M9-P2W7K
 * - Códigos sin prefijo: SEC-8X4M9-P2W7K
 * - Variaciones de espacios o guiones
 * - Tokens cifrados de enlaces QR (kgr_tk1_...)
 * - Códigos portátiles compuestos (CONG::CPIN::INVITE)
 * - Compatibilidad total con invitaciones previas v1 (inv_h1_) y nuevas v2 (inv_h2_)
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
      if (invitation.codeHash.startsWith('inv_h2_')) {
        const computed = hashInvitationCode(cand);
        if (computed === invitation.codeHash) return true;
      } else {
        // Hash v1 heredado
        const computedV1 = hashInvitationCodeV1(cand);
        if (computedV1 === invitation.codeHash) return true;
        const computedDirect = `inv_h1_${sha256HexSync(`${INVITATION_CODE_HASH_SALT}:${cand}`)}`;
        if (computedDirect === invitation.codeHash) return true;
      }
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
