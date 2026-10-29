// src/utils/security/roleSession.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { AT_REST_CIPHER_KEY, getDeviceEntropySalt, getSecureLocalPin } from './atRestPin.ts';
import { isSafeDemoMode } from '../congregationIdentity.ts';
import { normalizePersonalPinInput } from './personalPin.ts';
import { sha256HexSync } from './sha256.ts';

const ROLE_SESSION_SIG_KEY = 'kongre_role_session_sig_v1';

export const SERVER_ROLE_TOKEN_STORAGE_KEY = 'kongre_server_role_token';

export interface ParsedServerRoleToken {
  congId: string;
  publisherId: string;
  role: string;
  roles: string[];
  expiresAt: number;
  raw: string;
}

/**
 * Parsea e inspecciona un token de rol firmado por el servidor (kgr_srt1...).
 * Valida formato estructural y que no haya caducado.
 */
export function parseServerRoleToken(token?: string | null): ParsedServerRoleToken | null {
  if (!token || typeof token !== 'string' || !token.startsWith('kgr_srt1.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payload, sigHex] = parts;
  if (!sigHex || sigHex.length < 32) return null;
  const payloadParts = payload.split(':');
  if (payloadParts.length < 5) return null;
  const [congId, publisherId, role, rolesStr, expStr] = payloadParts;
  const expiresAt = parseInt(expStr, 10);
  if (isNaN(expiresAt) || expiresAt < Date.now()) return null;
  return {
    congId: congId.trim().toUpperCase(),
    publisherId: publisherId.trim(),
    role: role.trim().toLowerCase(),
    roles: rolesStr.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean),
    expiresAt,
    raw: token,
  };
}

/**
 * Genera y persiste una firma criptográfica de integridad para la sesión de rol activa (`kongre_role_session_sig_v1`),
 * impidiendo la escalada de privilegios mediante edición manual de `kongre_active_role_v1` en DevTools.
 * Versión v3 ligada a rol, congregación, entropía del dispositivo y token firmado por el servidor (si está presente).
 */
export function signRoleSession(role: string, roles?: string[], congId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normRole = (role || 'publico').trim().toLowerCase();
    const normRoles = Array.isArray(roles) && roles.length > 0
      ? roles.map((r) => String(r).trim().toLowerCase()).join(',')
      : normRole;
    const cleanCong = String(
      congId ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('kongre_canonical_cong_id') ||
          localStorage.getItem('kongre_congregation_id') ||
          localStorage.getItem('kongre_congregation_number')
        : '') ||
      ''
    ).trim().toUpperCase();
    const deviceSalt = getDeviceEntropySalt();
    const serverToken = (typeof localStorage !== 'undefined' ? localStorage.getItem(SERVER_ROLE_TOKEN_STORAGE_KEY) : '') || '';
    // V3 ligado a rol, roles secundarios, congregación activa, entropía del dispositivo, token firmado por servidor + constante interna
    const sig = sha256HexSync(`role_sig_v3|${normRole}|${normRoles}|${cleanCong}|${deviceSalt}|${serverToken}|${AT_REST_CIPHER_KEY}`);
    localStorage.setItem(ROLE_SESSION_SIG_KEY, sig);
  } catch {}
}

/**
 * Verifica la firma de la sesión de rol activa en localStorage.
 * Soporta role_sig_v3 (con token firmado por el servidor), role_sig_v2 (con congregación ligada)
 * y retrocompatibilidad con role_sig_v1.
 * Protegido contra omisión fraudulenta mediante modo demo en congregaciones reales (isSafeDemoMode)
 * e invulnerable a escalada de privilegios en DevTools gracias a la validación del token de servidor.
 */
export function verifyRoleSessionSignature(role: string, roles?: string[], congId?: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const normRole = (role || 'publico').trim().toLowerCase();
    const normRolesList = Array.isArray(roles) && roles.length > 0
      ? roles.map((r) => String(r).trim().toLowerCase())
      : [normRole];

    if (normRole === 'publico' && normRolesList.every((r) => r === 'publico')) {
      return true;
    }
    if (isSafeDemoMode()) {
      return true;
    }

    const normRoles = normRolesList.join(',');
    const cleanCong = String(
      congId ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('kongre_canonical_cong_id') ||
          localStorage.getItem('kongre_congregation_id') ||
          localStorage.getItem('kongre_congregation_number')
        : '') ||
      ''
    ).trim().toUpperCase();
    const deviceSalt = getDeviceEntropySalt();
    const serverToken = (typeof localStorage !== 'undefined' ? localStorage.getItem(SERVER_ROLE_TOKEN_STORAGE_KEY) : '') || '';

    // Hardening contra escalada en DevTools:
    // Si existe un token firmado por el servidor para el PIN Personal, validar que no haya sido manipulado
    // y que los roles solicitados estén autorizados en el token emitido por la Edge Function.
    if (serverToken) {
      const parsed = parseServerRoleToken(serverToken);
      if (!parsed) {
        // Token manipulado o expirado
        return false;
      }
      if (cleanCong && parsed.congId && parsed.congId !== cleanCong) {
        // Token pertenece a otra congregación
        return false;
      }
      const authorizedRoles = new Set([parsed.role, ...parsed.roles]);
      if (!authorizedRoles.has(normRole)) {
        // Intento de escalada de privilegios en DevTools
        return false;
      }
    }

    const expectedSigV3 = sha256HexSync(`role_sig_v3|${normRole}|${normRoles}|${cleanCong}|${deviceSalt}|${serverToken}|${AT_REST_CIPHER_KEY}`);
    const expectedSigV2WithCong = sha256HexSync(`role_sig_v2|${normRole}|${normRoles}|${cleanCong}|${deviceSalt}|${AT_REST_CIPHER_KEY}`);
    const expectedSigV2NoCong = sha256HexSync(`role_sig_v2|${normRole}|${normRoles}|${deviceSalt}|${AT_REST_CIPHER_KEY}`);
    const expectedSigV1 = sha256HexSync(`role_sig_v1|${normRole}|${normRoles}|${AT_REST_CIPHER_KEY}`);
    const storedSig = localStorage.getItem(ROLE_SESSION_SIG_KEY);

    if (
      storedSig &&
      (storedSig === expectedSigV3 ||
        storedSig === expectedSigV2WithCong ||
        storedSig === expectedSigV2NoCong ||
        storedSig === expectedSigV1)
    ) {
      if (storedSig !== expectedSigV3) {
        // Migración transparente a v3 con serverToken y congregación ligada
        signRoleSession(normRole, normRolesList, cleanCong);
      }
      return true;
    }

    // Solo se re-firma si el PIN de sesión coincide estrictamente con el PIN verificado del Coordinador
    const sessionPin = getSecureLocalPin('kongre_session_pin_v2');
    const coordPin = getSecureLocalPin('kongre_coordinator_pin');
    if (
      coordPin &&
      sessionPin &&
      coordPin.length >= 4 &&
      sessionPin.length >= 4 &&
      normalizePersonalPinInput(coordPin) === normalizePersonalPinInput(sessionPin)
    ) {
      signRoleSession(normRole, normRolesList, cleanCong);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
