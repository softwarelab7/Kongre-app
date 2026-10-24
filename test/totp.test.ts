// test/totp.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotpUri,
  generateTotpCode,
  verifyTotpCode,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
  hashBackupCode,
  isDeviceTrusted,
  markDeviceAsTrusted,
  revokeDeviceTrust,
} from '../src/utils/totp';

test('2FA TOTP: Codificación y decodificación Base32 (RFC 4648)', () => {
  const sample = new Uint8Array([75, 111, 110, 103, 114, 101]); // "Kongre"
  const encoded = base32Encode(sample);
  assert.equal(typeof encoded, 'string');
  assert.ok(encoded.length > 0);

  const decoded = base32Decode(encoded);
  assert.deepEqual(Array.from(decoded), Array.from(sample));
});

test('2FA TOTP: Generación de clave secreta aleatoria de 20 bytes en Base32', () => {
  const secret1 = generateTotpSecret();
  const secret2 = generateTotpSecret();

  assert.equal(typeof secret1, 'string');
  assert.equal(typeof secret2, 'string');
  assert.notEqual(secret1, secret2);
  assert.equal(secret1.length, 32); // 20 bytes * 8 / 5 = 32 chars base32
});

test('2FA TOTP: Construcción de URI oficial otpauth:// para Microsoft Authenticator', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const uri = generateTotpUri('Juan Perez', secret, 'Kongre');

  assert.ok(uri.startsWith('otpauth://totp/Kongre:Juan%20Perez?'));
  assert.ok(uri.includes(`secret=${secret}`));
  assert.ok(uri.includes('issuer=Kongre'));
  assert.ok(uri.includes('digits=6'));
  assert.ok(uri.includes('period=30'));
});

test('2FA TOTP: Generación y verificación de código de 6 dígitos en tiempo real', async () => {
  const secret = generateTotpSecret();
  const now = Date.now();
  const code = await generateTotpCode(secret, now);

  assert.match(code, /^\d{6}$/);

  // Verificación exitosa en el mismo instante
  const isValid = await verifyTotpCode(secret, code, 1, now);
  assert.equal(isValid, true);

  // Verificación con código incorrecto falla
  const invalidCode = code === '123456' ? '654321' : '123456';
  const isInvalid = await verifyTotpCode(secret, invalidCode, 1, now);
  assert.equal(isInvalid, false);

  // Verificación dentro de la ventana de tolerancia de ±30 segundos
  const isValidPast = await verifyTotpCode(secret, code, 1, now + 25 * 1000);
  assert.equal(isValidPast, true);

  // Fuera de la ventana de tolerancia (ej: 90 segundos después) falla
  const isExpired = await verifyTotpCode(secret, code, 1, now + 90 * 1000);
  assert.equal(isExpired, false);
});

test('2FA TOTP: Generación, verificación y consumo de códigos de respaldo de un solo uso', async () => {
  const { plainCodes, hashedCodes } = await generateBackupCodes(4);

  assert.equal(plainCodes.length, 4);
  assert.equal(hashedCodes.length, 4);
  plainCodes.forEach((c) => assert.match(c, /^[2-9A-Z]{4}-[2-9A-Z]{4}$/));

  // Verificar el primer código de respaldo
  const codeToUse = plainCodes[0];
  const result1 = await verifyAndConsumeBackupCode(codeToUse, hashedCodes);
  assert.equal(result1.isValid, true);
  assert.equal(result1.remainingHashedCodes.length, 3);

  // Reutilizar el mismo código de respaldo falla (consumo de un solo uso)
  const result2 = await verifyAndConsumeBackupCode(codeToUse, result1.remainingHashedCodes);
  assert.equal(result2.isValid, false);
  assert.equal(result2.remainingHashedCodes.length, 3);
});

test('2FA TOTP: Confiabilidad de dispositivo (Recordar por 30 días)', () => {
  // Mock localStorage in node environment if needed
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
  };

  const userId = 'pub_test_123';
  assert.equal(isDeviceTrusted(userId), false);

  markDeviceAsTrusted(userId, 30);
  assert.equal(isDeviceTrusted(userId), true);

  revokeDeviceTrust(userId);
  assert.equal(isDeviceTrusted(userId), false);
});
