// src/utils/security/shareTokens.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { bufferToHex, hexToBuffer } from './bytes.ts';
import { formatCanonicalCongregationId } from './congregationCredentials.ts';
import { getSecureRandomBytes } from './random.ts';
import { sha256HexSync } from './sha256.ts';

/**
 * Genera un código de invitación teocrática con entropía criptográfica real (CSPRNG)
 * usando alfabeto Crockford Base32 (sin 0, O, 1, I) de 6 caracteres (más de mil millones de combinaciones).
 * Ejemplo: KONG-SEC-8X4M9-P2W7K
 */
export function generateSecureInvitationCode(rolePrefix: string = 'KONG'): string {
  const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = getSecureRandomBytes(10);
  const token = Array.from(randomBytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
  const p1 = token.slice(0, 5);
  const p2 = token.slice(5, 10);
  return `KONG-${rolePrefix.toUpperCase()}-${p1}-${p2}`;
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
    // SEGURIDAD: este token NO es confidencial. SHARE_TOKEN_CIPHER_KEY está en el bundle público, así que
    // cualquiera puede decodificar (y falsificar) un enlace/QR. Por eso NUNCA se incluyen en él credenciales
    // de larga duración: ni el PIN de congregación (`cpin`) ni el PIN personal (`pin`). Esos se entregan por
    // un canal aparte. Solo viajan datos no secretos (ID de congregación, publicador) y el código de
    // invitación, que es de un solo uso y caduca. Todo token caduca (7 días por defecto).
    const MAX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const compact: Record<string, any> = {};
    if (payload.cong) compact.c = formatCanonicalCongregationId(payload.cong);
    if (payload.pub) compact.u = payload.pub.trim();
    if (payload.invite) compact.i = payload.invite.trim();
    compact.e = Math.min(payload.exp || Date.now() + MAX_TTL_MS, Date.now() + MAX_TTL_MS);

    const json = JSON.stringify(compact);
    const plainBytes = new TextEncoder().encode(json);
    const nonceBytes = getSecureRandomBytes(4);
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
