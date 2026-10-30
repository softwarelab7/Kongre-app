// src/utils/security/compartments.ts
/**
 * Zero-Trust Role Compartments & Envelope Encryption Engine (Kongre Criptografía Estricta 1.3).
 *
 * Principio:
 *  - En lugar de depender de que la interfaz de usuario oculte un botón, los datos confidenciales
 *    están protegidos por compartimentos criptográficos independientes en la red y base de datos.
 *
 * Arquitectura de Compartimentos:
 *  1. Compartimento Público (payload_public):
 *     Cifrado con K_pub (PIN de congregación). Accesible por cualquier publicador o pantalla de salón.
 *  2. Compartimento Departamental (payload_dept):
 *     Cuentas (S-26), Territorios detallados (S-13) y Almacén de Literatura (S-14).
 *     Cifrado mediante Envelope Encryption:
 *     - Se genera una Clave de Cifrado de Datos (DEK) simétrica AES-GCM-256 única y aleatoria.
 *     - La DEK se envuelve (cifra) para el Cuerpo de Ancianos (K_master).
 *     - La DEK se envuelve individualmente para cada siervo ministerial / publicador autorizado (K_personal_${id}).
 *     - Un publicador no autorizado no puede descifrar la DEK ni los datos departamentales.
 *  3. Compartimento Personal (payload_personal_${id}):
 *     Informes mensuales de predicación (tarjetas S-21) y notas personales.
 *     Cifrado con envoltorio dual para el publicador dueño y para supervisión pastoral de los ancianos.
 */

import { base64ToBuffer, bufferToBase64, bufferToHex, hexToBuffer } from './bytes.ts';
import { normalizePinV2 } from '../crypto.ts';

export interface WrappedKey {
  salt: string; // Hex (16 bytes)
  iv: string; // Hex (12 bytes)
  authTag: string; // Hex (16 bytes)
  wrappedKey: string; // Base64 (clave DEK cifrada)
}

export interface EncryptedCompartmentEnvelope {
  version: 'kgr_dept_v1';
  algorithm: 'AES-GCM-256';
  iv: string; // Hex (12 bytes)
  authTag: string; // Hex (16 bytes)
  ciphertext: string; // Base64 (contenido departamental cifrado con DEK)
  wrappedKeys: {
    master: WrappedKey;
    publishers: Record<string, WrappedKey>; // publisherId -> WrappedKey
  };
}

export interface EncryptedPersonalEnvelope {
  version: 'kgr_personal_v1';
  algorithm: 'AES-GCM-256';
  publisherId: string;
  iv: string; // Hex (12 bytes)
  authTag: string; // Hex (16 bytes)
  ciphertext: string; // Base64 (S-21 / notas cifradas con DEK)
  wrappedKeys: {
    master: WrappedKey;
    publisher: WrappedKey;
  };
}

const ENVELOPE_KDF_ITERATIONS = 100_000;
const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH_BITS = 256;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Deriva una Key Encryption Key (KEK) a partir de un PIN y un contexto de rol con PBKDF2-SHA256
 */
async function deriveKEK(pin: string, salt: Uint8Array, contextInfo: string): Promise<CryptoKey> {
  const cleanPin = normalizePinV2(pin);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(`${cleanPin}|${contextInfo}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ENVELOPE_KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Genera una Data Encryption Key (DEK) aleatoria AES-GCM de 256 bits con CSPRNG
 */
async function generateDEK(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    true, // extractable para permitir key wrapping
    ['encrypt', 'decrypt']
  );
}

/**
 * Envuelve (cifra) una DEK con una KEK derivada del PIN y contexto
 */
async function wrapDEK(dek: CryptoKey, pin: string, contextInfo: string): Promise<WrappedKey> {
  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const kek = await deriveKEK(pin, salt, contextInfo);

  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    kek,
    rawDek
  );

  const encryptedBytes = new Uint8Array(encryptedBuf);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - AUTH_TAG_LENGTH);
  const authTag = encryptedBytes.slice(encryptedBytes.length - AUTH_TAG_LENGTH);

  return {
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    authTag: bufferToHex(authTag),
    wrappedKey: bufferToBase64(ciphertext.buffer),
  };
}

/**
 * Desenvuelve (descifra) una DEK usando una KEK derivada del PIN y contexto
 */
async function unwrapDEK(wrapped: WrappedKey, pin: string, contextInfo: string): Promise<CryptoKey> {
  const salt = hexToBuffer(wrapped.salt);
  const iv = hexToBuffer(wrapped.iv);
  const authTag = hexToBuffer(wrapped.authTag);
  const ciphertext = new Uint8Array(base64ToBuffer(wrapped.wrappedKey));

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const kek = await deriveKEK(pin, salt, contextInfo);

  const decryptedRaw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    kek,
    combined as BufferSource
  );

  return await crypto.subtle.importKey(
    'raw',
    decryptedRaw,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra datos arbitrarios con la DEK
 */
async function encryptWithDEK<T>(data: T, dek: CryptoKey): Promise<{ ciphertext: string; iv: string; authTag: string }> {
  const payloadBytes = textEncoder.encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encryptedBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    dek,
    payloadBytes
  );

  const encryptedBytes = new Uint8Array(encryptedBuf);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - AUTH_TAG_LENGTH);
  const authTag = encryptedBytes.slice(encryptedBytes.length - AUTH_TAG_LENGTH);

  return {
    ciphertext: bufferToBase64(ciphertext.buffer),
    iv: bufferToHex(iv),
    authTag: bufferToHex(authTag),
  };
}

/**
 * Descifra datos arbitrarios con la DEK
 */
async function decryptWithDEK<T>(ciphertextB64: string, ivHex: string, authTagHex: string, dek: CryptoKey): Promise<T> {
  const iv = hexToBuffer(ivHex);
  const authTag = hexToBuffer(authTagHex);
  const ciphertext = new Uint8Array(base64ToBuffer(ciphertextB64));

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    dek,
    combined as BufferSource
  );

  return JSON.parse(textDecoder.decode(decryptedBuf));
}

// ============================================================================
// API PÚBLICA DE COMPARTIMENTOS
// ============================================================================

/**
 * Empaqueta y cifra el compartimento departamental con Envelope Encryption.
 * La clave DEK se envuelve para el PIN maestro y para los publicadores autorizados.
 */
export async function packageDepartmentCompartment<T>(params: {
  data: T;
  masterPin: string;
  authorizedPublishers?: Array<{ publisherId: string; personalPin: string }>;
}): Promise<EncryptedCompartmentEnvelope> {
  const dek = await generateDEK();
  const encryptedPayload = await encryptWithDEK(params.data, dek);

  // Envolver DEK para el cuerpo de ancianos (PIN Maestro)
  const masterWrapped = await wrapDEK(dek, params.masterPin, 'kgr_envelope_master');

  // Envolver DEK para cada publicador/siervo ministerial autorizado
  const publishersWrapped: Record<string, WrappedKey> = {};
  for (const pub of params.authorizedPublishers || []) {
    if (pub.publisherId && pub.personalPin) {
      publishersWrapped[pub.publisherId] = await wrapDEK(
        dek,
        pub.personalPin,
        `kgr_envelope_dept|${pub.publisherId}`
      );
    }
  }

  return {
    version: 'kgr_dept_v1',
    algorithm: 'AES-GCM-256',
    iv: encryptedPayload.iv,
    authTag: encryptedPayload.authTag,
    ciphertext: encryptedPayload.ciphertext,
    wrappedKeys: {
      master: masterWrapped,
      publishers: publishersWrapped,
    },
  };
}

/**
 * Desempaqueta y descifra un compartimento departamental.
 * Puede ser abierto con el PIN Maestro (ancianos) o con el PIN Personal de un publicador autorizado.
 */
export async function unpackageDepartmentCompartment<T>(
  envelope: EncryptedCompartmentEnvelope,
  credentials: {
    masterPin?: string;
    publisherId?: string;
    personalPin?: string;
  }
): Promise<T> {
  if (!envelope || envelope.version !== 'kgr_dept_v1') {
    throw new Error('Formato de compartimento departamental no reconocido o corrupto.');
  }

  let dek: CryptoKey | null = null;

  // Intento 1: Desempaquetar con PIN Maestro
  if (credentials.masterPin) {
    try {
      dek = await unwrapDEK(envelope.wrappedKeys.master, credentials.masterPin, 'kgr_envelope_master');
    } catch {
      // PIN maestro no válido para este envoltorio
    }
  }

  // Intento 2: Desempaquetar con PIN Personal autorizado
  if (!dek && credentials.publisherId && credentials.personalPin) {
    const pubWrapped = envelope.wrappedKeys.publishers[credentials.publisherId];
    if (pubWrapped) {
      try {
        dek = await unwrapDEK(
          pubWrapped,
          credentials.personalPin,
          `kgr_envelope_dept|${credentials.publisherId}`
        );
      } catch {
        // PIN personal incorrecto
      }
    }
  }

  if (!dek) {
    throw new Error('Acceso no autorizado: no tienes credenciales para descifrar este compartimento departamental.');
  }

  return await decryptWithDEK<T>(envelope.ciphertext, envelope.iv, envelope.authTag, dek);
}

/**
 * Empaqueta y cifra el compartimento personal de un publicador (ej. informe mensual S-21).
 * La clave DEK se envuelve para el publicador dueño y para el PIN Maestro de los ancianos.
 */
export async function packagePersonalCompartment<T>(params: {
  data: T;
  publisherId: string;
  masterPin: string;
  publisherPersonalPin: string;
}): Promise<EncryptedPersonalEnvelope> {
  const dek = await generateDEK();
  const encryptedPayload = await encryptWithDEK(params.data, dek);

  // Envolver para el maestro (ancianos)
  const masterWrapped = await wrapDEK(dek, params.masterPin, `kgr_envelope_personal_master|${params.publisherId}`);

  // Envolver para el publicador dueño
  const pubWrapped = await wrapDEK(dek, params.publisherPersonalPin, `kgr_envelope_personal_owner|${params.publisherId}`);

  return {
    version: 'kgr_personal_v1',
    algorithm: 'AES-GCM-256',
    publisherId: params.publisherId,
    iv: encryptedPayload.iv,
    authTag: encryptedPayload.authTag,
    ciphertext: encryptedPayload.ciphertext,
    wrappedKeys: {
      master: masterWrapped,
      publisher: pubWrapped,
    },
  };
}

/**
 * Desempaqueta y descifra un compartimento personal.
 * Puede ser abierto por el publicador dueño o por un anciano con el PIN Maestro.
 */
export async function unpackagePersonalCompartment<T>(
  envelope: EncryptedPersonalEnvelope,
  credentials: {
    masterPin?: string;
    personalPin?: string;
  }
): Promise<T> {
  if (!envelope || envelope.version !== 'kgr_personal_v1') {
    throw new Error('Formato de compartimento personal no reconocido o corrupto.');
  }

  let dek: CryptoKey | null = null;

  // Intento 1: Desempaquetar con PIN Maestro (ancianos)
  if (credentials.masterPin) {
    try {
      dek = await unwrapDEK(
        envelope.wrappedKeys.master,
        credentials.masterPin,
        `kgr_envelope_personal_master|${envelope.publisherId}`
      );
    } catch {}
  }

  // Intento 2: Desempaquetar con PIN Personal (dueño)
  if (!dek && credentials.personalPin) {
    try {
      dek = await unwrapDEK(
        envelope.wrappedKeys.publisher,
        credentials.personalPin,
        `kgr_envelope_personal_owner|${envelope.publisherId}`
      );
    } catch {}
  }

  if (!dek) {
    throw new Error('Acceso no autorizado: credencial inválida para el compartimento personal.');
  }

  return await decryptWithDEK<T>(envelope.ciphertext, envelope.iv, envelope.authTag, dek);
}
