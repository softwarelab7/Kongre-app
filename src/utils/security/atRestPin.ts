// src/utils/security/atRestPin.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { getVaultValue, setVaultValue, getVaultSessionEntropy } from '../atRestVault.ts';
import { bufferToHex, hexToBuffer } from './bytes.ts';
import { hashPersonalPin, normalizePersonalPinInput } from './personalPin.ts';
import { getSecureRandomBytes } from './random.ts';
import { sha256HexSync } from './sha256.ts';

export const AT_REST_CIPHER_KEY = 'kongre_at_rest_vault_key_2026_aes_stream';

/**
 * Obtiene o genera una sal aleatoria única por dispositivo en localStorage.
 * Garantiza que el cifrado local en reposo varíe entre navegadores y no dependa únicamente de claves fijas.
 */
export function getDeviceEntropySalt(): string {
  if (typeof window === 'undefined') return 'server_side_device_entropy_salt_2026';
  try {
    let salt = typeof localStorage !== 'undefined' ? localStorage.getItem('kongre_device_entropy_salt_v1') : null;
    if (!salt || salt.length < 32) {
      const bytes = getSecureRandomBytes(16);
      salt = bufferToHex(bytes.buffer);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kongre_device_entropy_salt_v1', salt);
      }
    }
    return salt;
  } catch {
    return 'fallback_device_entropy_salt_2026';
  }
}

/**
 * Cifra un PIN en reposo para almacenamiento local (H-01).
 * Usa una clave derivada de la entropía única del dispositivo (kongre_device_entropy_salt_v1),
 * con nonce CSPRNG de 128 bits y modo CTR autenticado (kgr_v2:...).
 * Evita el uso de constantes estáticas del código (AT_REST_CIPHER_KEY) que permitían reversión inmediata.
 */
export function encryptPinAtRest(pin?: string | null): string {
  if (!pin) return '';
  const clean = String(pin).trim();
  if (!clean || clean === '••••' || clean === '••••••••') return '';
  if (clean.startsWith('kgr_v4:') || clean.startsWith('kgr_v3:') || clean.startsWith('kgr_v2:')) return clean;
  if (clean.startsWith('kgr_v1:')) {
    const migrated = decryptPinAtRest(clean);
    if (!migrated) return '';
    return encryptPinAtRest(migrated);
  }

  try {
    const vaultEntropy = getVaultSessionEntropy();
    const isVaultAvailable = Boolean(vaultEntropy && vaultEntropy.length >= 32);
    const deviceKey = isVaultAvailable
      ? sha256HexSync(`kgr_pin_rest_v4:${getDeviceEntropySalt()}:${vaultEntropy}`)
      : sha256HexSync(`kgr_pin_rest_v2:${getDeviceEntropySalt()}`);
    const versionPrefix = isVaultAvailable ? 'kgr_v4:' : 'kgr_v2:';

    const plainBytes = new TextEncoder().encode(clean);
    const nonce = getSecureRandomBytes(16);
    const nonceHex = bufferToHex(nonce.buffer);

    const out = new Uint8Array(plainBytes.length);
    let currentBlock = -1;
    let currentKeyHex = '';
    for (let i = 0; i < plainBytes.length; i++) {
      const blockIdx = Math.floor(i / 32);
      const byteInBlock = i % 32;
      if (blockIdx !== currentBlock) {
        currentBlock = blockIdx;
        currentKeyHex = sha256HexSync(`${deviceKey}:${nonceHex}:${blockIdx}:ctr`);
      }
      const kByte = parseInt(currentKeyHex.slice(byteInBlock * 2, byteInBlock * 2 + 2), 16);
      out[i] = plainBytes[i] ^ kByte;
    }
    const cipherHex = bufferToHex(out.buffer);
    const macTag = sha256HexSync(`${deviceKey}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
    return `${versionPrefix}${nonceHex}:${macTag}:${cipherHex}`;
  } catch {
    return '';
  }
}

/**
 * Determina si una cadena almacenada está cifrada en reposo (formato kgr_v4, kgr_v3, kgr_v2 o kgr_v1)
 */
export function isEncryptedPinAtRest(val?: string | null): boolean {
  if (!val) return false;
  const str = String(val).trim();
  return (
    str.startsWith('kgr_v4:') ||
    str.startsWith('kgr_v3:') ||
    str.startsWith('kgr_v2:') ||
    str.startsWith('kgr_v1:')
  );
}

/**
 * Descifra en memoria un PIN cifrado en reposo.
 * Soporta kgr_v4 (respaldado por la Bóveda Local atRestVault), kgr_v2 (entropía de dispositivo)
 * y retrocompatibilidad con kgr_v1 (legado).
 */
export function decryptPinAtRest(encoded?: string | null): string {
  if (!encoded) return '';
  const clean = String(encoded).trim();
  if (!clean) return '';

  // 1. Formato kgr_v4 (respaldado por la Bóveda Local atRestVault en IndexedDB + nonce 128 bits + CTR + MAC)
  if (clean.startsWith('kgr_v4:')) {
    try {
      const parts = clean.slice('kgr_v4:'.length).split(':');
      if (parts.length !== 3) return '';
      const [nonceHex, macTag, cipherHex] = parts;
      if (!nonceHex || !macTag || !cipherHex || cipherHex.length % 2 !== 0) return '';

      const vaultEntropy = getVaultSessionEntropy();
      if (!vaultEntropy) return '';
      const deviceKey = sha256HexSync(`kgr_pin_rest_v4:${getDeviceEntropySalt()}:${vaultEntropy}`);
      const expectedMac = sha256HexSync(`${deviceKey}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
      if (macTag.toLowerCase() !== expectedMac.toLowerCase()) {
        return '';
      }

      const cipherBytes = hexToBuffer(cipherHex);
      const out = new Uint8Array(cipherBytes.length);
      let currentBlock = -1;
      let currentKeyHex = '';
      for (let i = 0; i < cipherBytes.length; i++) {
        const blockIdx = Math.floor(i / 32);
        const byteInBlock = i % 32;
        if (blockIdx !== currentBlock) {
          currentBlock = blockIdx;
          currentKeyHex = sha256HexSync(`${deviceKey}:${nonceHex}:${blockIdx}:ctr`);
        }
        const kByte = parseInt(currentKeyHex.slice(byteInBlock * 2, byteInBlock * 2 + 2), 16);
        out[i] = cipherBytes[i] ^ kByte;
      }
      return new TextDecoder().decode(out);
    } catch {
      return '';
    }
  }

  // 2. Formato kgr_v2 (entropía de dispositivo + nonce 128 bits + CTR + MAC)
  if (clean.startsWith('kgr_v2:')) {
    try {
      const parts = clean.slice('kgr_v2:'.length).split(':');
      if (parts.length !== 3) return '';
      const [nonceHex, macTag, cipherHex] = parts;
      if (!nonceHex || !macTag || !cipherHex || cipherHex.length % 2 !== 0) return '';

      const deviceKey = sha256HexSync(`kgr_pin_rest_v2:${getDeviceEntropySalt()}`);
      const expectedMac = sha256HexSync(`${deviceKey}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
      if (macTag.toLowerCase() !== expectedMac.toLowerCase()) {
        return '';
      }

      const cipherBytes = hexToBuffer(cipherHex);
      const out = new Uint8Array(cipherBytes.length);
      let currentBlock = -1;
      let currentKeyHex = '';
      for (let i = 0; i < cipherBytes.length; i++) {
        const blockIdx = Math.floor(i / 32);
        const byteInBlock = i % 32;
        if (blockIdx !== currentBlock) {
          currentBlock = blockIdx;
          currentKeyHex = sha256HexSync(`${deviceKey}:${nonceHex}:${blockIdx}:ctr`);
        }
        const kByte = parseInt(currentKeyHex.slice(byteInBlock * 2, byteInBlock * 2 + 2), 16);
        out[i] = cipherBytes[i] ^ kByte;
      }
      return new TextDecoder().decode(out);
    } catch {
      return '';
    }
  }

  // 3. Formato kgr_v1 (legado con AT_REST_CIPHER_KEY para migración fluida)
  if (clean.startsWith('kgr_v1:')) {
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

  return '';
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

  // 2. Verificar contra PIN cifrado en reposo si existe (encryptedPin o personalPin cifrado)
  const encCandidate = record.encryptedPin || (isEncryptedPinAtRest(record.personalPin) ? record.personalPin : undefined);
  if (encCandidate) {
    const decrypted = normalizePersonalPinInput(decryptPinAtRest(encCandidate));
    if (decrypted && decrypted.length >= 4 && decrypted === cleanCandidate) {
      return true;
    }
  }

  // 3. Compatibilidad con registros legados o en memoria que aún posean personalPin / pin en texto plano
  const rawStoredPin = String(record.personalPin || record.pin || '').trim();
  if (rawStoredPin && rawStoredPin !== '••••' && !isEncryptedPinAtRest(rawStoredPin)) {
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
 * Almacena un PIN sensible (como kongre_coordinator_pin, kongre_session_pin_v2, kongre_registered_cong_pin)
 * utilizando la bóveda criptográfica no extraíble en IndexedDB (kgr_v3:...) y su caché en memoria.
 * Ya no almacena hashes débiles (${key}_hash) en localStorage ni copias en texto claro en sessionStorage.
 */
export function setSecureLocalPin(key: string, rawPin?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = rawPin ? String(rawPin).trim() : '';
    if (!clean || clean === '••••' || clean === '••••••••') {
      setVaultValue(key, null);
      return;
    }
    const plain = isEncryptedPinAtRest(clean)
      ? decryptPinAtRest(clean)
      : clean;
    if (!plain) return;

    setVaultValue(key, plain);
  } catch {}
}

/**
 * Recupera y descifra en memoria un PIN almacenado.
 * Prioriza lectura desde la bóveda de claves no extraíbles (atRestVault) y migra automáticamente formatos legados.
 */
export function getSecureLocalPin(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    // 1. Priorizar lectura desde la bóveda criptográfica en memoria
    const vaultVal = getVaultValue(key);
    if (vaultVal && vaultVal.trim() && vaultVal !== '••••' && vaultVal !== '••••••••') {
      return vaultVal.trim();
    }

    // 2. Si no está en la bóveda, fallback a localStorage para datos aún no hidratados
    if (typeof localStorage === 'undefined') return '';
    const stored = localStorage.getItem(key);
    if (!stored) return '';
    const trimmed = stored.trim();
    if (!trimmed || trimmed === '••••' || trimmed === '••••••••') return '';

    let plain = '';
    if (trimmed.startsWith('kgr_v3:')) {
      // Valor de bóveda no hidratado aún en caché
      return '';
    } else if (isEncryptedPinAtRest(trimmed)) {
      plain = decryptPinAtRest(trimmed);
      if (plain) {
        setSecureLocalPin(key, plain);
      }
    } else if (!/^[a-f0-9]{64}$/i.test(trimmed)) {
      plain = trimmed;
      setSecureLocalPin(key, plain);
    }

    return plain;
  } catch {
    return '';
  }
}

/**
 * Verifica si un PIN candidato coincide con el PIN almacenado bajo `key` en la bóveda o localStorage
 */
export function verifySecureLocalPin(key: string, candidatePin?: string | null): boolean {
  if (typeof window === 'undefined' || !candidatePin) return false;
  const cleanCandidate = normalizePersonalPinInput(candidatePin);
  if (cleanCandidate.length < 4) return false;
  try {
    const decrypted = normalizePersonalPinInput(getSecureLocalPin(key));
    if (decrypted && decrypted.length >= 4 && decrypted === cleanCandidate) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`${key}_hash`);
      }
      return true;
    }
    if (typeof localStorage !== 'undefined') {
      const storedHash = localStorage.getItem(`${key}_hash`);
      const candidateHash = hashPersonalPin(cleanCandidate);
      if (storedHash && candidateHash && storedHash.toLowerCase() === candidateHash.toLowerCase()) {
        localStorage.removeItem(`${key}_hash`);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
