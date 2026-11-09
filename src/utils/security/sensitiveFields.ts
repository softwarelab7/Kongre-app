// src/utils/security/sensitiveFields.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { getVaultSessionEntropy } from '../atRestVault.ts';
import { gcm } from '@noble/ciphers/aes.js';
import { DEMO_PUBLISHERS } from '../demoData.ts';
import { decryptPinAtRest, encryptPinAtRest, getDeviceEntropySalt, isEncryptedPinAtRest } from './atRestPin.ts';
import { bufferToHex, hexToBuffer } from './bytes.ts';
import { hashPersonalPin } from './personalPin.ts';
import { getSecureRandomBytes } from './random.ts';
import { sha256HexSync } from './sha256.ts';

// ───────────────────────────────────────────────────────────────────────────────────────────────
// Cifrado en reposo de campos sensibles: AES-256-GCM (AEAD) con subclave por registro.
//
// Formato:  <prefijo>:<salt 16 B hex>:<iv 12 B hex>:<texto cifrado + etiqueta GCM de 16 B, hex>
//   - kgr_sec5:   clave derivada de la entropía NO EXTRAÍBLE de la bóveda (IndexedDB, 256 bits) y del salt del dispositivo.
//                 El PIN no interviene: el secreto es de alta entropía, así que un hash con separación de dominio es
//                 un KDF adecuado y no hay nada que adivinar por fuerza bruta.
//   - kgr_sec5d:  respaldo SIN bóveda (IndexedDB bloqueado). La clave sale solo del salt del dispositivo, que está en
//                 el mismo localStorage: protege contra una lectura casual, NO contra quien copie el almacenamiento.
//                 Al volver a haber bóveda el valor se re-cifra solo a kgr_sec5 en el siguiente guardado.
//
// - Subclave por registro: SHA-256(clave maestra + salt aleatorio de 128 bits). Con una clave distinta para cada valor,
//   el límite de nonces aleatorios de 96 bits de GCM no es un riesgo aunque se re-cifre miles de veces.
// - AAD = nombre del formato: liga el texto cifrado a su propósito y separa kgr_sec5 de kgr_sec5d. No se liga al campo
//   porque hay lectores (formularios, recordatorios) que descifran sin conocer de qué campo viene el valor.
// - Implementación: @noble/ciphers (sin dependencias, síncrona). Mantiene la API síncrona que usan ~25 puntos de
//   lectura/escritura (render, recordatorios, exportaciones) sin volverlos asíncronos.
// - No hay lectores de formatos anteriores (kgr_sec2/3/4): un valor con ese prefijo se conserva tal cual, sin descifrar.
// ───────────────────────────────────────────────────────────────────────────────────────────────
const SEC5_PREFIX = 'kgr_sec5:';
const SEC5D_PREFIX = 'kgr_sec5d:';
const NO_VAULT_SECRET = 'kgr_sec5d_device_only';
/** Cualquier valor ya cifrado por esta app (incluidos formatos retirados): no se vuelve a cifrar ni se toca. */
const ANY_ENCRYPTED_RE = /^kgr_sec\d+d?:/;

// Memoriza la clave maestra (depende solo del secreto y del salt del dispositivo) para no recalcularla por campo.
let sec5MasterMemo: { id: string; hex: string } | null = null;

function getSec5MasterKeyHex(secret: string): string {
  const id = `${getDeviceEntropySalt()}:${secret}`;
  if (sec5MasterMemo && sec5MasterMemo.id === id) return sec5MasterMemo.hex;
  const hex = sha256HexSync(`kgr_sec5_master_v1:${id}`);
  sec5MasterMemo = { id, hex };
  return hex;
}

function getSec5RecordKey(secret: string, saltHex: string): Uint8Array {
  return hexToBuffer(sha256HexSync(`kgr_sec5_record_v1:${getSec5MasterKeyHex(secret)}:${saltHex}`));
}

const aadOf = (prefix: string) => new TextEncoder().encode(prefix.slice(0, -1));

function encryptSec5(rawStr: string, secret: string, prefix: string): string {
  const salt = getSecureRandomBytes(16);
  const iv = getSecureRandomBytes(12);
  const saltHex = bufferToHex(salt.buffer);
  const key = getSec5RecordKey(secret, saltHex);
  const ct = gcm(key, iv, aadOf(prefix)).encrypt(new TextEncoder().encode(rawStr));
  return `${prefix}${saltHex}:${bufferToHex(iv.buffer)}:${bufferToHex(ct.buffer)}`;
}

function decryptSec5(val: string, prefix: string): any {
  try {
    let secret: string;
    if (prefix === SEC5_PREFIX) {
      const vaultEntropy = getVaultSessionEntropy();
      if (!vaultEntropy) return val;
      secret = vaultEntropy;
    } else {
      secret = NO_VAULT_SECRET;
    }
    const parts = val.slice(prefix.length).split(':');
    if (parts.length !== 3) return val;
    const [saltHex, ivHex, ctHex] = parts;
    if (saltHex.length !== 32 || ivHex.length !== 24 || ctHex.length < 32 || ctHex.length % 2 !== 0) return val;
    if (!/^[0-9a-f]+$/i.test(saltHex + ivHex + ctHex)) return val;
    const key = getSec5RecordKey(secret, saltHex.toLowerCase());
    // decrypt lanza si la etiqueta no valida (manipulación, clave distinta): devolvemos el valor cifrado sin fugar nada.
    const plain = gcm(key, hexToBuffer(ivHex), aadOf(prefix)).decrypt(hexToBuffer(ctHex));
    const decoded = new TextDecoder().decode(plain);
    return decoded.startsWith('json:') ? JSON.parse(decoded.slice(5)) : decoded;
  } catch {
    return val;
  }
}

/**
 * Cifra en reposo un campo sensible (salud, directiva DPA, notas confidenciales, teléfono, contactos).
 * Con la Bóveda Local disponible usa kgr_sec5; sin ella, el respaldo kgr_sec5d (solo ofuscación, ver arriba).
 * Los valores ya cifrados se devuelven tal cual.
 */
export function encryptSensitiveFieldAtRest(val: any): any {
  if (val === null || val === undefined || val === '') return val;
  if (typeof val === 'string' && ANY_ENCRYPTED_RE.test(val)) return val;

  try {
    const rawStr = typeof val === 'object' ? `json:${JSON.stringify(val)}` : String(val);
    const vaultEntropy = getVaultSessionEntropy();
    if (vaultEntropy && vaultEntropy.length >= 32) {
      return encryptSec5(rawStr, vaultEntropy, SEC5_PREFIX);
    }
    return encryptSec5(rawStr, NO_VAULT_SECRET, SEC5D_PREFIX);
  } catch {
    return val;
  }
}

/**
 * Descifra en memoria un valor sensible leído desde localStorage.
 * Soporta kgr_sec5 y kgr_sec5d (AES-256-GCM) y texto plano. Cualquier otro valor cifrado se devuelve sin tocar.
 */
export function decryptSensitiveFieldAtRest(val: any): any {
  if (typeof val !== 'string') return val;
  if (val.startsWith(SEC5_PREFIX)) return decryptSec5(val, SEC5_PREFIX);
  if (val.startsWith(SEC5D_PREFIX)) return decryptSec5(val, SEC5D_PREFIX);
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
            restored[k].startsWith('kgr_sec5d:') ||
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

/**
 * Campos de una transacción contable que revelan identidad de donantes, comprobantes y notas financieras privadas.
 * CuentasTab y donaciones teocráticas.
 */
const SENSITIVE_TRANSACTION_KEYS = [
  'receiptNumber',
  'payerOrPayee',
  'description',
  'notes',
] as const;

/** Cifra en reposo los campos sensibles de las transacciones antes de escribir en localStorage (AES-256-GCM kgr_sec5:). */
export function sanitizeTransactionsForLocalStorage<T extends Record<string, any>>(transactions: T[]): T[] {
  if (!Array.isArray(transactions)) return [];
  return transactions.map((t) => {
    if (!t || typeof t !== 'object') return t;
    const clone: Record<string, any> = { ...t };
    for (const k of SENSITIVE_TRANSACTION_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = encryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}

/** Descifra en memoria las transacciones leídas de localStorage (acepta texto plano heredado). */
export function restoreTransactionsFromLocalStorage<T extends Record<string, any>>(transactions: T[]): T[] {
  if (!Array.isArray(transactions)) return [];
  return transactions.map((t) => {
    if (!t || typeof t !== 'object') return t;
    const clone: Record<string, any> = { ...t };
    for (const k of SENSITIVE_TRANSACTION_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = decryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}

/**
 * Campos de una auditoría trimestral que contienen notas y detalles confidenciales del revisor.
 */
const SENSITIVE_AUDIT_KEYS = ['findingsNotes', 'auditorName'] as const;

/** Cifra en reposo los campos de auditorías trimestrales antes de escribir en localStorage. */
export function sanitizeAuditsForLocalStorage<T extends Record<string, any>>(audits: T[]): T[] {
  if (!Array.isArray(audits)) return [];
  return audits.map((a) => {
    if (!a || typeof a !== 'object') return a;
    const clone: Record<string, any> = { ...a };
    for (const k of SENSITIVE_AUDIT_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = encryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}

/** Descifra en memoria las auditorías trimestrales leídas de localStorage. */
export function restoreAuditsFromLocalStorage<T extends Record<string, any>>(audits: T[]): T[] {
  if (!Array.isArray(audits)) return [];
  return audits.map((a) => {
    if (!a || typeof a !== 'object') return a;
    const clone: Record<string, any> = { ...a };
    for (const k of SENSITIVE_AUDIT_KEYS) {
      if (clone[k] !== undefined && clone[k] !== null && clone[k] !== '') {
        clone[k] = decryptSensitiveFieldAtRest(clone[k]);
      }
    }
    return clone as T;
  });
}
