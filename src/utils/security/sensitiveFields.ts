// src/utils/security/sensitiveFields.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { getVaultSessionEntropy } from '../atRestVault.ts';
import { gcm } from '@noble/ciphers/aes.js';
import { DEMO_PUBLISHERS } from '../demoData.ts';
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
  const deviceSalt = getDeviceEntropySalt();
  return sha256HexSync(`kgr_health_dpa_rest_v4:::${deviceSalt}:${vaultEntropy}`);
}

/**
 * Deriva las posibles claves candidatas de descifrado para kgr_sec4
 * probando variaciones de PIN y ID de congregación para evitar fallos si la sesión cambia.
 */
function getCandidateKeysV4(vaultEntropy: string): string[] {
  const deviceSalt = getDeviceEntropySalt();
  const candidates: string[] = [
    getSensitiveDataAtRestKeyV4(vaultEntropy),
    sha256HexSync(`kgr_health_dpa_rest_v4:${deviceSalt}:${vaultEntropy}`),
  ];

  const congIds = new Set<string>(['']);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const c1 = localStorage.getItem('kongre_congregation_number');
    const c2 = localStorage.getItem('kongre_canonical_cong_id');
    const c3 = localStorage.getItem('kongre_congregation_id');
    if (c1) congIds.add(c1.trim());
    if (c2) congIds.add(c2.trim());
    if (c3) congIds.add(c3.trim());
  }

  const pins = new Set<string>(['']);
  if (typeof window !== 'undefined') {
    const p1 = getSecureLocalPin('kongre_session_pin_v2');
    const p2 = getSecureLocalPin('kongre_coordinator_pin');
    const p3 = getSecureLocalPin('kongre_registered_cong_pin');
    const p4 = getSecureLocalPin('kongre_last_cong_pin');
    if (p1) pins.add(p1.trim());
    if (p2) pins.add(p2.trim());
    if (p3) pins.add(p3.trim());
    if (p4) pins.add(p4.trim());
  }

  for (const p of pins) {
    for (const c of congIds) {
      const k = sha256HexSync(`kgr_health_dpa_rest_v4:${p}:${c}:${deviceSalt}:${vaultEntropy}`);
      if (!candidates.includes(k)) {
        candidates.push(k);
      }
    }
  }

  return candidates;
}

/**
 * Deriva las posibles claves candidatas de descifrado para kgr_sec3
 * probando variaciones de PIN y ID de congregación para compatibilidad.
 */
function getCandidateKeysV3(): string[] {
  const deviceSalt = getDeviceEntropySalt();
  const congIds = new Set<string>(['']);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const c1 = localStorage.getItem('kongre_congregation_number');
    const c2 = localStorage.getItem('kongre_canonical_cong_id');
    const c3 = localStorage.getItem('kongre_congregation_id');
    if (c1) congIds.add(c1.trim());
    if (c2) congIds.add(c2.trim());
    if (c3) congIds.add(c3.trim());
  }

  const pins = new Set<string>(['']);
  if (typeof window !== 'undefined') {
    const p1 = getSecureLocalPin('kongre_session_pin_v2');
    const p2 = getSecureLocalPin('kongre_coordinator_pin');
    const p3 = getSecureLocalPin('kongre_registered_cong_pin');
    const p4 = getSecureLocalPin('kongre_last_cong_pin');
    if (p1) pins.add(p1.trim());
    if (p2) pins.add(p2.trim());
    if (p3) pins.add(p3.trim());
    if (p4) pins.add(p4.trim());
  }

  const candidates: string[] = [getSensitiveDataAtRestKey()];
  for (const p of pins) {
    for (const c of congIds) {
      const k = sha256HexSync(`kgr_health_contacts_rest_v2:${p}:${c}:${deviceSalt}`);
      if (!candidates.includes(k)) {
        candidates.push(k);
      }
    }
  }

  return candidates;
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// kgr_sec5: AES-256-GCM estándar (AEAD) con subclave por registro.
//
// Formato:  kgr_sec5:<salt 16 B hex>:<iv 12 B hex>:<texto cifrado + etiqueta GCM de 16 B, hex>
//
// - Clave maestra: SHA-256 de la entropía NO EXTRAÍBLE de la bóveda (IndexedDB, 256 bits) + salt del dispositivo.
//   El PIN ya no interviene: el secreto es de alta entropía, así que un hash con separación de dominio es un KDF
//   adecuado y no hay nada que adivinar por fuerza bruta.
// - Subclave por registro: SHA-256(clave maestra + salt aleatorio de 128 bits). Con una clave distinta para cada
//   valor, el límite de nonces aleatorios de 96 bits de GCM no es un riesgo aunque se re-cifre miles de veces.
// - AAD fija ('kgr_sec5'): liga el texto cifrado a este formato/propósito. No se liga al nombre del campo porque
//   hay lectores (formularios, recordatorios) que descifran sin conocer de qué campo viene el valor.
// - La implementación es @noble/ciphers (sin dependencias, síncrona), que permite conservar la API síncrona
//   que usan ~25 puntos de lectura/escritura (render, recordatorios, exportaciones) sin volverlos asíncronos.
// - Si la bóveda no está disponible (IndexedDB bloqueado) se mantiene el formato kgr_sec3 como único respaldo.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const SEC5_PREFIX = 'kgr_sec5:';
const SEC5_AAD = new TextEncoder().encode('kgr_sec5');

// Memoriza la clave maestra (depende solo de la bóveda y del salt del dispositivo) para no recalcularla por campo.
let sec5MasterMemo: { id: string; hex: string } | null = null;

function getSec5MasterKeyHex(vaultEntropy: string): string {
  const id = `${getDeviceEntropySalt()}:${vaultEntropy}`;
  if (sec5MasterMemo && sec5MasterMemo.id === id) return sec5MasterMemo.hex;
  const hex = sha256HexSync(`kgr_sec5_master_v1:${id}`);
  sec5MasterMemo = { id, hex };
  return hex;
}

function getSec5RecordKey(vaultEntropy: string, saltHex: string): Uint8Array {
  return hexToBuffer(sha256HexSync(`kgr_sec5_record_v1:${getSec5MasterKeyHex(vaultEntropy)}:${saltHex}`));
}

function encryptSec5(rawStr: string, vaultEntropy: string): string {
  const salt = getSecureRandomBytes(16);
  const iv = getSecureRandomBytes(12);
  const saltHex = bufferToHex(salt.buffer);
  const key = getSec5RecordKey(vaultEntropy, saltHex);
  const ct = gcm(key, iv, SEC5_AAD).encrypt(new TextEncoder().encode(rawStr));
  return `${SEC5_PREFIX}${saltHex}:${bufferToHex(iv.buffer)}:${bufferToHex(ct.buffer)}`;
}

function decryptSec5(val: string): any {
  try {
    const vaultEntropy = getVaultSessionEntropy();
    if (!vaultEntropy) return val;
    const parts = val.slice(SEC5_PREFIX.length).split(':');
    if (parts.length !== 3) return val;
    const [saltHex, ivHex, ctHex] = parts;
    if (saltHex.length !== 32 || ivHex.length !== 24 || ctHex.length < 32 || ctHex.length % 2 !== 0) return val;
    if (!/^[0-9a-f]+$/i.test(saltHex + ivHex + ctHex)) return val;
    const key = getSec5RecordKey(vaultEntropy, saltHex.toLowerCase());
    // decrypt lanza si la etiqueta no valida (manipulación, clave distinta): devolvemos el valor cifrado sin fugar nada.
    const plain = gcm(key, hexToBuffer(ivHex), SEC5_AAD).decrypt(hexToBuffer(ctHex));
    const decoded = new TextDecoder().decode(plain);
    return decoded.startsWith('json:') ? JSON.parse(decoded.slice(5)) : decoded;
  } catch {
    return val;
  }
}

/**
 * Cifra en reposo un campo sensible (salud, directiva DPA, notas confidenciales, teléfono, contactos)
 * Con la Bóveda Local disponible usa AES-256-GCM (kgr_sec5:), con la clave ligada a la CryptoKey no extraíble de
 * IndexedDB. Sin bóveda cae al formato legado kgr_sec3 (CTR + MAC propio). Los valores ya cifrados se devuelven tal cual.
 */
export function encryptSensitiveFieldAtRest(val: any): any {
  if (val === null || val === undefined || val === '') return val;
  if (
    typeof val === 'string' &&
    (val.startsWith('kgr_sec5:') ||
      val.startsWith('kgr_sec4:') ||
      val.startsWith('kgr_sec3:') ||
      val.startsWith('kgr_sec2:'))
  ) {
    return val;
  }

  try {
    const rawStr = typeof val === 'object' ? `json:${JSON.stringify(val)}` : String(val);
    const vaultEntropy = getVaultSessionEntropy();
    if (vaultEntropy && vaultEntropy.length >= 32) {
      return encryptSec5(rawStr, vaultEntropy);
    }

    // Respaldo sin bóveda: formato legado kgr_sec3.
    const key = getSensitiveDataAtRestKey();
    const versionPrefix = 'kgr_sec3:';

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
 * Soporta kgr_sec5 (AES-256-GCM), y por compatibilidad kgr_sec4 (bóveda + CTR/MAC), kgr_sec3 (CTR autenticado),
 * kgr_sec2 (legado) y texto plano. Los formatos antiguos se re-cifran a kgr_sec5 en el siguiente guardado.
 */
export function decryptSensitiveFieldAtRest(val: any): any {
  if (typeof val !== 'string') return val;

  // 0. Formato kgr_sec5: AES-256-GCM (formato actual)
  if (val.startsWith(SEC5_PREFIX)) return decryptSec5(val);

  // 1. Formato kgr_sec4 (legado): Respaldado por la Bóveda Local atRestVault en IndexedDB (AES-256 no extraíble) + CTR + MAC
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

      const candidateKeys = getCandidateKeysV4(vaultEntropy);
      let matchedKey: string | null = null;
      for (const k of candidateKeys) {
        const expectedTag = sha256HexSync(`${k}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
        if (authTag.toLowerCase() === expectedTag.toLowerCase()) {
          matchedKey = k;
          break;
        }
      }

      if (!matchedKey) {
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
          currentKeyHex = sha256HexSync(`${matchedKey}:${nonceHex}:${blockIdx}:ctr`);
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

      const candidateKeys = getCandidateKeysV3();
      let matchedKey: string | null = null;
      for (const k of candidateKeys) {
        const expectedTag = sha256HexSync(`${k}:${nonceHex}:${cipherHex}:mac`).slice(0, 16);
        if (authTag.toLowerCase() === expectedTag.toLowerCase()) {
          matchedKey = k;
          break;
        }
      }

      if (!matchedKey) {
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
          currentKeyHex = sha256HexSync(`${matchedKey}:${nonceHex}:${blockIdx}:ctr`);
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

        // Autocorrección de datos de demostración si por alguna razón no se pudo descifrar (ej. sesión no inicializada)
        if (
          typeof restored[k] === 'string' &&
          (restored[k].startsWith('kgr_sec5:') ||
            restored[k].startsWith('kgr_sec4:') ||
            restored[k].startsWith('kgr_sec3:') ||
            restored[k].startsWith('kgr_sec2:'))
        ) {
          const demoPub = DEMO_PUBLISHERS.find(
            (dp) =>
              dp.id === p.id ||
              dp.publisherCode === p.publisherCode ||
              (dp.name && p.name && dp.name.trim().toLowerCase() === String(p.name).trim().toLowerCase())
          );
          if (demoPub && (demoPub as any)[k] !== undefined) {
            restored[k] = (demoPub as any)[k];
          }
        }
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

/**
 * Campos de una visita de pastoreo que revelan situación personal (salud, duelo, inactividad, notas de los ancianos).
 * `focus` se cifra porque por sí solo ya delata el motivo de la visita.
 */
const SENSITIVE_SHEPHERDING_KEYS = ['notes', 'scripturesOrPoints', 'focus'] as const;

/** Cifra en reposo los campos sensibles de las visitas de pastoreo antes de escribir en localStorage. */
export function sanitizeShepherdingVisitsForLocalStorage<T extends Record<string, any>>(visits: T[]): T[] {
  if (!Array.isArray(visits)) return [];
  return visits.map((v) => {
    if (!v || typeof v !== 'object') return v;
    const clone: Record<string, any> = { ...v };
    for (const k of SENSITIVE_SHEPHERDING_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = encryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}

/** Descifra en memoria las visitas leídas de localStorage (acepta texto plano heredado y se re-cifra al siguiente guardado). */
export function restoreShepherdingVisitsFromLocalStorage<T extends Record<string, any>>(visits: T[]): T[] {
  if (!Array.isArray(visits)) return [];
  return visits.map((v) => {
    if (!v || typeof v !== 'object') return v;
    const clone: Record<string, any> = { ...v };
    for (const k of SENSITIVE_SHEPHERDING_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = decryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}
