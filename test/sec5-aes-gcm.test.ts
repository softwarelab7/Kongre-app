import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSensitiveFieldAtRest,
  decryptSensitiveFieldAtRest,
  sanitizePublishersForLocalStorage,
  restorePublishersFromLocalStorage,
} from '../src/utils/theocraticSecurity.ts';
import { setVaultSessionEntropyForTesting } from '../src/utils/atRestVault.ts';

const ENTROPY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00';

// Vectores generados con el código ANTERIOR (alpha.45), salt de dispositivo y congregación fijos.
// Garantizan que los datos ya guardados en dispositivos reales siguen siendo legibles tras la migración.
const LEGACY_SEC4 = 'kgr_sec4:6ce73c4856df44ada90072caa51d1b40:66fa19653eb7af9c:9a507a8f9540ec3e0a03ebe5aa1279ae15b8';
const LEGACY_SEC3 = 'kgr_sec3:850e1bbeb6cd4ee16a66f261ac6b05e9:0f1bde3ad822e63b:1aea9c461f40b0cdda0365d88348a739a156';
const LEGACY_PLAIN = 'Alérgico a sulfas';

function useStorage() {
  const store: Record<string, string> = {
    kongre_device_entropy_salt_v1: '00112233445566778899aabbccddeeff',
    kongre_congregation_number: 'CONG1',
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  return store;
}

function flipHexChar(hex: string, idx: number): string {
  const c = hex[idx] === '0' ? '1' : '0';
  return hex.slice(0, idx) + c + hex.slice(idx + 1);
}

test('kgr_sec5: AES-256-GCM, formato y ida y vuelta (texto, unicode y objetos)', () => {
  useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  const enc = encryptSensitiveFieldAtRest('Pérdida de su esposa — visitar con cuidado 🙏');
  assert.ok(enc.startsWith('kgr_sec5:'));
  const [salt, iv, ct] = enc.slice('kgr_sec5:'.length).split(':');
  assert.equal(salt.length, 32, 'salt de 16 bytes');
  assert.equal(iv.length, 24, 'iv de 12 bytes');
  assert.ok(ct.length >= 32, 'incluye etiqueta GCM de 16 bytes');
  assert.ok(!enc.includes('esposa'));
  assert.equal(decryptSensitiveFieldAtRest(enc), 'Pérdida de su esposa — visitar con cuidado 🙏');

  const obj = { a: 1, lista: ['x', 'y'], nested: { ok: true } };
  assert.deepEqual(decryptSensitiveFieldAtRest(encryptSensitiveFieldAtRest(obj)), obj);
});

test('kgr_sec5: cada cifrado es distinto (salt e iv aleatorios) y es idempotente', () => {
  useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  const a = encryptSensitiveFieldAtRest('3115551234');
  const b = encryptSensitiveFieldAtRest('3115551234');
  assert.notEqual(a, b);
  assert.equal(encryptSensitiveFieldAtRest(a), a, 'no se cifra dos veces');
  assert.equal(encryptSensitiveFieldAtRest(''), '');
  assert.equal(encryptSensitiveFieldAtRest(null), null);
});

test('kgr_sec5: cualquier manipulación invalida la etiqueta y no filtra texto claro', () => {
  useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  const enc: string = encryptSensitiveFieldAtRest('Marcapasos cardíaco');
  const body = enc.slice('kgr_sec5:'.length);
  const [salt, iv, ct] = body.split(':');
  const tampered = [
    `kgr_sec5:${salt}:${iv}:${flipHexChar(ct, 0)}`,                    // texto cifrado
    `kgr_sec5:${salt}:${iv}:${flipHexChar(ct, ct.length - 1)}`,        // etiqueta
    `kgr_sec5:${salt}:${flipHexChar(iv, 3)}:${ct}`,                    // iv
    `kgr_sec5:${flipHexChar(salt, 5)}:${iv}:${ct}`,                    // salt (otra subclave)
    `kgr_sec5:${salt}:${iv}:${ct.slice(0, -2)}`,                       // truncado
    'kgr_sec5:zz:zz:zz',
    'kgr_sec5:',
  ];
  for (const t of tampered) {
    assert.equal(decryptSensitiveFieldAtRest(t), t, 'devuelve el valor cifrado sin descifrar');
  }
});

test('kgr_sec5: sin la entropía de la bóveda (o con otra) no se puede descifrar', () => {
  useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  const enc = encryptSensitiveFieldAtRest('Alergia al polen');
  setVaultSessionEntropyForTesting(null);
  assert.equal(decryptSensitiveFieldAtRest(enc), enc, 'volcado de localStorage sin bóveda');
  setVaultSessionEntropyForTesting('f'.repeat(64));
  assert.equal(decryptSensitiveFieldAtRest(enc), enc, 'bóveda distinta (otro navegador/dispositivo)');
});

test('kgr_sec5: ligado al dispositivo — otro salt de dispositivo no descifra', () => {
  const store = useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  const enc = encryptSensitiveFieldAtRest('Dato');
  store.kongre_device_entropy_salt_v1 = 'ffeeddccbbaa99887766554433221100';
  assert.equal(decryptSensitiveFieldAtRest(enc), enc);
});

test('migración: valores kgr_sec4 y kgr_sec3 antiguos siguen siendo legibles', () => {
  useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  assert.equal(decryptSensitiveFieldAtRest(LEGACY_SEC4), LEGACY_PLAIN);
  setVaultSessionEntropyForTesting(null);
  assert.equal(decryptSensitiveFieldAtRest(LEGACY_SEC3), LEGACY_PLAIN);
});

test('migración: un publicador con datos kgr_sec4 se re-cifra a kgr_sec5 al guardar', () => {
  useStorage();
  setVaultSessionEntropyForTesting(ENTROPY);
  const stored = [{ id: 'p1', name: 'Hno Test', medical_allergies: LEGACY_SEC4, notes: 'texto plano heredado' }];
  const inMemory = restorePublishersFromLocalStorage(stored as any);
  assert.equal(inMemory[0].medical_allergies, LEGACY_PLAIN);
  const persisted = sanitizePublishersForLocalStorage(inMemory as any);
  assert.ok(persisted[0].medical_allergies.startsWith('kgr_sec5:'), 'alergias migradas');
  assert.ok(persisted[0].notes.startsWith('kgr_sec5:'), 'texto plano heredado también se cifra');
  assert.ok(!JSON.stringify(persisted).includes('sulfas'));
  assert.equal(restorePublishersFromLocalStorage(persisted as any)[0].medical_allergies, LEGACY_PLAIN);
});

test('migración: un valor legado que no se pudo descifrar se conserva intacto (no se pierde)', () => {
  useStorage();
  setVaultSessionEntropyForTesting(null); // bóveda aún no lista
  const stored = [{ id: 'p1', name: 'Hno Test', medical_allergies: LEGACY_SEC4 }];
  const inMemory = restorePublishersFromLocalStorage(stored as any);
  assert.equal(inMemory[0].medical_allergies, LEGACY_SEC4);
  const persisted = sanitizePublishersForLocalStorage(inMemory as any);
  assert.equal(persisted[0].medical_allergies, LEGACY_SEC4, 'idempotente: no se re-cifra ni se borra');
});

test('sin bóveda se mantiene el respaldo kgr_sec3 (comportamiento previo)', () => {
  useStorage();
  setVaultSessionEntropyForTesting(null);
  const enc = encryptSensitiveFieldAtRest('Alergia al polen');
  assert.ok(enc.startsWith('kgr_sec3:'));
  assert.equal(decryptSensitiveFieldAtRest(enc), 'Alergia al polen');
});
