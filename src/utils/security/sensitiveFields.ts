// src/utils/security/sensitiveFields.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { getVaultSessionEntropy } from '../atRestVault.ts';
import { decryptPinAtRest, encryptPinAtRest, getDeviceEntropySalt, getSecureLocalPin, isEncryptedPinAtRest } from './atRestPin.ts';
import { bufferToHex, hexToBuffer } from './bytes.ts';
import { hashPersonalPin } from './personalPin.ts';
import { getSecureRandomBytes } from './random.ts';
import { sha256HexSync } from './sha256.ts';

/**
 * Deriva una clave única para cifrar datos sensibles en reposo (salud, contactos de emergencia, teléfonos)
 * combinando la sesión activa del usuario (PIN personal o congregación) con la entropía del dispositivo (v2).
 */
export function getSensitiveDataAtRestKey(): string {
  const sessionPin =
    (typeof window !== 'undefined'
      ? getSecureLocalPin('kongre_session_pin_v2') ||
        getSecureLocalPin('kongre_coordinator_pin') ||
        getSecureLocalPin('kongre_registered_cong_pin') ||
        getSecureLocalPin('kongre_last_cong_pin')
      : '') || '';
  const congId =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
      ? localStorage.getItem('kongre_congregation_number') || localStorage.getItem('kongre_canonical_cong_id') || ''
      : '';
  const deviceSalt = getDeviceEntropySalt();
  return sha256HexSync(`kgr_health_contacts_rest_v2:${sessionPin}:${congId}:${deviceSalt}`);
}

/** Clave para descifrar datos sensibles guardados con formato v1 legado (kgr_sec2:) */
function getSensitiveDataAtRestKeyV1(): string {
  const sessionPin =
    (typeof window !== 'undefined'
      ? getSecureLocalPin('kongre_session_pin_v2') ||
        getSecureLocalPin('kongre_coordinator_pin') ||
        getSecureLocalPin('kongre_registered_cong_pin') ||
        getSecureLocalPin('kongre_last_cong_pin')
      : '') || '';
  const congId =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
      ? localStorage.getItem('kongre_congregation_number') || localStorage.getItem('kongre_canonical_cong_id') || ''
      : '';
  const deviceSalt = getDeviceEntropySalt();
  return sha256HexSync(`kgr_health_contacts_rest_v1:${sessionPin}:${congId}:${deviceSalt}`);
}

/**
 * Clave para cifrar y descifrar datos sensibles (DPA, notas confidenciales, contactos)
 * respaldada por la Bóveda Local en IndexedDB (kgr_sec4:).
 * Incorpora la entropía no extraíble de la bóveda para hacer invulnerable la extracción aislada de localStorage.
 */
function getSensitiveDataAtRestKeyV4(vaultEntropy: string): string {
  const sessionPin =
    (typeof window !== 'undefined'
      ? getSecureLocalPin('kongre_session_pin_v2') ||
        getSecureLocalPin('kongre_coordinator_pin') ||
        getSecureLocalPin('kongre_registered_cong_pin') ||
        getSecureLocalPin('kongre_last_cong_pin')
      : '') || '';
  const congId =
    typeof window !== 'undefined' && typeof localStorage !== 'undefined'
      ? localStorage.getItem('kongre_congregation_number') || localStorage.getItem('kongre_canonical_cong_id') || ''
      : '';
  const deviceSalt = getDeviceEntropySalt();
  return sha256HexSync(`kgr_health_dpa_rest_v4:${sessionPin}:${congId}:${deviceSalt}:${vaultEntropy}`);
}

/**
 * Cifra en reposo un campo sensible (salud, directiva DPA, notas confidenciales, teléfono, contactos)
 * mediante Counter-Mode (CTR) con nonce CSPRNG de 128 bits y etiqueta de autenticación (kgr_sec4:...).
 * Cuando la Bóveda Local atRestVault está disponible, vincula la clave a la CryptoKey no extraíble de IndexedDB.
 */
export function encryptSensitiveFieldAtRest(val: any): any {
  if (val === null || val === undefined || val === '') return val;
  if (
    typeof val === 'string' &&
    (val.startsWith('kgr_sec4:') ||
      val.startsWith('kgr_sec3:') ||
      val.startsWith('kgr_sec2:'))
  ) {
    return val;
  }

  try {
    const rawStr = typeof val === 'object' ? `json:${JSON.stringify(val)}` : String(val);
    const vaultEntropy = getVaultSessionEntropy();
    const isVaultAvailable = Boolean(vaultEntropy && vaultEntropy.length >= 32);
    const key = isVaultAvailable
      ? getSensitiveDataAtRestKeyV4(vaultEntropy!)
      : getSensitiveDataAtRestKey();
    const versionPrefix = isVaultAvailable ? 'kgr_sec4:' : 'kgr_sec3:';

    const plainBytes = new TextEncoder().encode(rawStr);
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
        currentKeyHex = sha256HexSync(`${key}:${nonceHex}:${blockIdx}:ctr`);
      }
      const kByte = parseInt(currentKeyHex.slice(byteInBlock * 2, byteInBlock * 2 + 2), 16);
      out[i] = plainBytes[i] ^ kByte;
    }
    const cipherHex = bufferToHex(out.buffer);
    const authTag = sha256HexSync(`${key}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
    return `${versionPrefix}${nonceHex}:${authTag}:${cipherHex}`;
  } catch {
    return val;
  }
}

/**
 * Descifra en memoria un valor sensible leído desde localStorage.
 * Soporta kgr_sec4 (respaldado por la Bóveda Local atRestVault), kgr_sec3 (CTR autenticado),
 * kgr_sec2 (legado) y texto plano (compatibilidad garantizada).
 */
export function decryptSensitiveFieldAtRest(val: any): any {
  if (typeof val !== 'string') return val;

  // 1. Formato kgr_sec4: Respaldado por la Bóveda Local atRestVault en IndexedDB (AES-256 no extraíble) + CTR + MAC
  if (val.startsWith('kgr_sec4:')) {
    try {
      const parts = val.slice('kgr_sec4:'.length).split(':');
      if (parts.length !== 3) return val;
      const [nonceHex, authTag, cipherHex] = parts;
      if (!nonceHex || !authTag || !cipherHex || cipherHex.length % 2 !== 0) return val;

      const vaultEntropy = getVaultSessionEntropy();
      if (!vaultEntropy) {
        return val;
      }

      const key = getSensitiveDataAtRestKeyV4(vaultEntropy);
      const expectedTag = sha256HexSync(`${key}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
      if (authTag.toLowerCase() !== expectedTag.toLowerCase()) {
        return val;
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
          currentKeyHex = sha256HexSync(`${key}:${nonceHex}:${blockIdx}:ctr`);
        }
        const kByte = parseInt(currentKeyHex.slice(byteInBlock * 2, byteInBlock * 2 + 2), 16);
        out[i] = cipherBytes[i] ^ kByte;
      }
      const decoded = new TextDecoder().decode(out);
      if (decoded.startsWith('json:')) {
        return JSON.parse(decoded.slice(5));
      }
      return decoded;
    } catch {
      return val;
    }
  }

  // 2. Formato kgr_sec3: Counter-Mode autenticado con nonce de 128 bits (H-02)
  if (val.startsWith('kgr_sec3:')) {
    try {
      const parts = val.slice('kgr_sec3:'.length).split(':');
      if (parts.length !== 3) return val;
      const [nonceHex, authTag, cipherHex] = parts;
      if (!nonceHex || !authTag || !cipherHex || cipherHex.length % 2 !== 0) return val;

      const key = getSensitiveDataAtRestKey();
      const expectedTag = sha256HexSync(`${key}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
      if (authTag.toLowerCase() !== expectedTag.toLowerCase()) {
        return val;
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
          currentKeyHex = sha256HexSync(`${key}:${nonceHex}:${blockIdx}:ctr`);
        }
        const kByte = parseInt(currentKeyHex.slice(byteInBlock * 2, byteInBlock * 2 + 2), 16);
        out[i] = cipherBytes[i] ^ kByte;
      }
      const decoded = new TextDecoder().decode(out);
      if (decoded.startsWith('json:')) {
        return JSON.parse(decoded.slice(5));
      }
      return decoded;
    } catch {
      return val;
    }
  }

  // 3. Formato kgr_sec2: compatibilidad con datos cifrados en versiones anteriores
  if (val.startsWith('kgr_sec2:')) {
    try {
      const payloadHex = val.slice('kgr_sec2:'.length);
      if (payloadHex.length < 8) return val;
      const nonceHex = payloadHex.slice(0, 8);
      const cipherHex = payloadHex.slice(8);
      const cipherBytes = hexToBuffer(cipherHex);
      const key = getSensitiveDataAtRestKeyV1();
      const stream = sha256HexSync(`${key}:${nonceHex}:stream`);
      const out = new Uint8Array(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i++) {
        const kByte = parseInt(stream.slice((i * 2) % 60, ((i * 2) % 60) + 2), 16);
        out[i] = cipherBytes[i] ^ kByte;
      }
      const decoded = new TextDecoder().decode(out);
      if (decoded.startsWith('json:')) {
        return JSON.parse(decoded.slice(5));
      }
      return decoded;
    } catch {
      return val;
    }
  }

  return val;
}

const SENSITIVE_HEALTH_AND_CONTACT_KEYS = [
  'phone',
  'home_phone',
  'address',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergency_contacts',
  'spiritual_notes',
  'notes',
  'birthDate',
  'birth_date',
  // Directiva Médica Anticipada (DPA / Asuntos Médicos confidenciales - Fase 2 Bóveda Local)
  'healthcare_agent_name',
  'healthcare_agent_phone',
  'healthcare_agent_alternate_name',
  'healthcare_agent_alternate_phone',
  'medical_allergies',
  'medical_conditions',
  'dpa_date',
  'dpa_expiry_date',
] as const;

/**
 * Sanitiza la lista de publicadores antes de guardarla en localStorage:
 * 1. Reemplaza `personalPin` en texto plano por `personalPinHash` y `encryptedPin`.
 * 2. Cifra los datos sensibles de salud, contactos de emergencia y teléfonos (Ley 1581 de 2012 / Hallazgos 4 y 6).
 */
export function sanitizePublishersForLocalStorage<T extends Record<string, any>>(publishers: T[]): T[] {
  if (!Array.isArray(publishers)) return [];
  return publishers.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const rawPin = p.personalPin ? String(p.personalPin).trim() : '';
    const hasPlainPin = rawPin.length >= 4 && rawPin !== '••••' && !isEncryptedPinAtRest(rawPin) && !/^[a-f0-9]{64}$/i.test(rawPin);
    const pinHash = hasPlainPin
      ? hashPersonalPin(rawPin)
      : isEncryptedPinAtRest(rawPin)
      ? hashPersonalPin(decryptPinAtRest(rawPin))
      : (p.personalPinHash || '');
    const encryptedPin = hasPlainPin
      ? encryptPinAtRest(rawPin)
      : isEncryptedPinAtRest(rawPin)
      ? rawPin
      : (p.encryptedPin || '');

    const clone: Record<string, any> = { ...p };
    delete clone.personalPin;
    if (pinHash) clone.personalPinHash = pinHash;
    if (encryptedPin) clone.encryptedPin = encryptedPin;

    // Cifrado de datos sensibles en reposo (Salud y Contactos - Ley 1581 / Hallazgos 4 y 6)
    for (const k of SENSITIVE_HEALTH_AND_CONTACT_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = encryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}

/**
 * Restaura en memoria la lista de publicadores leída desde localStorage:
 * Descifra transparentemente los datos de salud y contactos de emergencia.
 */
export function restorePublishersFromLocalStorage<T extends Record<string, any>>(publishers: T[]): T[] {
  if (!Array.isArray(publishers)) return [];
  return publishers.map((p) => {
    if (!p || typeof p !== 'object') return p;
    const rawPin = p.personalPin ? String(p.personalPin).trim() : '';
    const restoredPin =
      rawPin && rawPin !== '••••' && !isEncryptedPinAtRest(rawPin) && !/^[a-f0-9]{64}$/i.test(rawPin)
        ? rawPin
        : p.encryptedPin
        ? decryptPinAtRest(p.encryptedPin)
        : isEncryptedPinAtRest(rawPin)
        ? decryptPinAtRest(rawPin)
        : '';
    const pinHash =
      p.personalPinHash ||
      (restoredPin ? hashPersonalPin(restoredPin) : '');

    const restored: Record<string, any> = {
      ...p,
      ...(restoredPin ? { personalPin: restoredPin } : {}),
      ...(pinHash ? { personalPinHash: pinHash } : {}),
    };

    // Descifrado transparente en memoria de datos de salud y contactos
    for (const k of SENSITIVE_HEALTH_AND_CONTACT_KEYS) {
      if (restored[k] !== undefined && restored[k] !== null) {
        restored[k] = decryptSensitiveFieldAtRest(restored[k]);
      }
    }

    return restored as T;
  });
}

/**
 * Sanitiza los registros del directorio de PINs (`kongre_publisher_unique_pins_v1`) antes de guardarlos en localStorage
 */
export function sanitizePinRecordsForLocalStorage<T extends Record<string, any>>(records: T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.map((rec) => {
    if (!rec || typeof rec !== 'object') return rec;
    const rawPin = rec.pin ? String(rec.pin).trim() : '';
    const hasPlainPin = rawPin.length >= 4 && rawPin !== '••••' && !isEncryptedPinAtRest(rawPin) && !/^[a-f0-9]{64}$/i.test(rawPin);
    const pinHash = hasPlainPin
      ? hashPersonalPin(rawPin)
      : isEncryptedPinAtRest(rawPin)
      ? hashPersonalPin(decryptPinAtRest(rawPin))
      : (rec.pinHash || rec.personalPinHash || '');
    const encryptedPin = hasPlainPin
      ? encryptPinAtRest(rawPin)
      : isEncryptedPinAtRest(rawPin)
      ? rawPin
      : (rec.encryptedPin || '');

    const clone: Record<string, any> = {
      ...rec,
      pin: '', // Nunca almacenar el PIN en texto plano en localStorage
    };
    if (pinHash) clone.pinHash = pinHash;
    if (encryptedPin) clone.encryptedPin = encryptedPin;
    return clone as T;
  });
}

/**
 * Restaura en memoria los registros del directorio de PINs leídos desde localStorage
 */
export function restorePinRecordsFromLocalStorage<T extends Record<string, any>>(records: T[]): T[] {
  if (!Array.isArray(records)) return [];
  return records.map((rec) => {
    if (!rec || typeof rec !== 'object') return rec;
    const rawPin = rec.pin ? String(rec.pin).trim() : '';
    const restoredPin =
      rawPin && rawPin !== '••••' && !isEncryptedPinAtRest(rawPin) && !/^[a-f0-9]{64}$/i.test(rawPin)
        ? rawPin
        : rec.encryptedPin
        ? decryptPinAtRest(rec.encryptedPin)
        : isEncryptedPinAtRest(rawPin)
        ? decryptPinAtRest(rawPin)
        : '';
    const pinHash =
      rec.pinHash ||
      rec.personalPinHash ||
      (restoredPin ? hashPersonalPin(restoredPin) : '');

    return {
      ...rec,
      pin: restoredPin,
      ...(pinHash ? { pinHash } : {}),
    };
  });
}
