// src/utils/security/passphraseCrypto.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { base64ToBuffer, bufferToBase64, bufferToHex, hexToBuffer } from './bytes.ts';

export interface EncryptedPayload {
  version: 'kongre_v1';
  salt: string; // Hex
  iv: string; // Hex
  ciphertext: string; // Base64
}

/**
 * Deriva una clave AES-GCM de 256 bits a partir de una contraseña y un salt usando PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra una cadena de texto plano con AES-GCM de 256 bits
 */
export async function encryptTheocraticData(plainText: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plainText);

  // Generate random salt (16 bytes) and IV (12 bytes for AES-GCM)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const payload: EncryptedPayload = {
    version: 'kongre_v1',
    salt: bufferToHex(salt.buffer),
    iv: bufferToHex(iv.buffer),
    ciphertext: bufferToBase64(encryptedBuffer),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Descifra una carga cifrada con AES-GCM de 256 bits
 */
export async function decryptTheocraticData(encryptedJson: string, passphrase: string): Promise<string> {
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(encryptedJson);
  } catch {
    throw new Error('El archivo no tiene el formato de cifrado correcto.');
  }

  if (payload.version !== 'kongre_v1' || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error('Versión de cifrado incompatible o archivo corrupto.');
  }

  const salt = hexToBuffer(payload.salt);
  const iv = hexToBuffer(payload.iv);
  const ciphertextBytes = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertextBytes as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error('Contraseña o clave de cifrado incorrecta.');
  }
}
