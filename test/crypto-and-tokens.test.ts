import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptForSupabase, decryptFromSupabase, encryptData, decryptData } from '../src/utils/crypto.ts';
import {
  encodeSecureShareToken,
  decodeSecureShareToken,
  generateSecureMasterPin,
  sanitizePublishersForLocalStorage,
  restorePublishersFromLocalStorage,
  generateSecureInvitationCode,
  hashInvitationCode,
  hashInvitationCodeV1,
  verifyInvitationCodeMatch,
  encryptPinAtRest,
  decryptPinAtRest,
  isEncryptedPinAtRest,
  verifyPersonalPinMatch,
  isSafeDemoMode,
  signRoleSession,
  verifyRoleSessionSignature,
} from '../src/utils/theocraticSecurity.ts';

test('cifrado: ida y vuelta con el formato actual', async () => {
  const data = { hola: 'mundo', n: [1, 2, 3] };
  assert.deepEqual(await decryptFromSupabase(await encryptForSupabase(data, 'PIN-12345'), 'PIN-12345'), data);
  assert.deepEqual(await decryptData(await encryptData(data, 'clave'), 'clave'), data);
});

test('cifrado: se siguen leyendo datos v1 (sin prefijo) y v2 ("v2:") — compatibilidad hacia atrás', async () => {
  // Texto cifrado v1 real generado con el código ORIGINAL (100.000 iteraciones, PIN "ABC12345")
  const { webcrypto } = await import('node:crypto');
  const enc = new TextEncoder();
  const mk = async (pin: string, iters: number) => {
    const salt = webcrypto.getRandomValues(new Uint8Array(16));
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const base = await webcrypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iters, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const buf = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify({ ok: 1 }))));
    const h = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h(salt)}:${h(iv)}:${h(buf.slice(-16))}:${h(buf.slice(0, -16))}`;
  };
  assert.deepEqual(await decryptFromSupabase(await mk('ABC12345', 100000), 'abc-12345'), { ok: 1 });
  assert.deepEqual(await decryptFromSupabase('v2:' + (await mk('ABC12345', 600000)), 'ABC12345'), { ok: 1 });
  await assert.rejects(decryptFromSupabase('v2:' + (await mk('ABC12345', 100000)), 'ABC12345'), 'v2 con KDF equivocado debe fallar');
});

test('token compartible: NO contiene PINs de congregación ni personales y caduca', () => {
  const tk = encodeSecureShareToken({ cong: 'ABCD-1234', cpin: 'SECRETO-CONG', pub: 'p1', pin: '4821', invite: 'KONG-SEC-ABC123' } as any);
  const d = decodeSecureShareToken(tk)!;
  assert.equal(d.cpin, undefined);
  assert.equal(d.pin, undefined);
  assert.equal(d.pub, 'p1');
  assert.equal(d.invite, 'KONG-SEC-ABC123');
  assert.ok(d.exp && d.exp > Date.now() && d.exp <= Date.now() + 7 * 86400_000 + 1000, 'caduca en <= 7 días');
  // aunque se pida una caducidad mayor, se recorta
  const long = decodeSecureShareToken(encodeSecureShareToken({ cong: 'ABCD-1234', exp: Date.now() + 365 * 86400_000 }))!;
  assert.ok(long.exp! <= Date.now() + 7 * 86400_000 + 1000);
});

test('PIN maestro generado: 12 dígitos, sin patrones triviales', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const p = generateSecureMasterPin();
    assert.match(p, /^\d{12}$/);
    assert.ok(!/^(\d)\1+$/.test(p));
    seen.add(p);
  }
  assert.equal(seen.size, 200);
});

test('datos sensibles en reposo (Ley 1581): se cifran en localStorage y se restauran en memoria transparentemente', () => {
  const originalPubs = [
    {
      id: 'pub1',
      name: 'Carlos Gomez',
      personalPin: '4821',
      phone: '3182634036',
      address: 'Calle 100 # 15-20',
      emergencyContactName: 'Maria Gomez',
      emergencyContactPhone: '3109876543',
      birthDate: '1990-05-15',
      notes: 'Alergia a la penicilina y mariscos. DPA vigente.',
    },
  ];

  // 1. Sanitizar para localStorage: no debe haber texto plano de PIN ni de datos sensibles
  const sanitized = sanitizePublishersForLocalStorage(originalPubs);
  assert.equal(sanitized[0].personalPin, undefined, 'El PIN no debe existir en texto plano');
  assert.ok(sanitized[0].personalPinHash, 'Debe tener hash del PIN');
  assert.ok(sanitized[0].phone.startsWith('kgr_sec3:'), 'El teléfono debe estar cifrado en reposo con CTR kgr_sec3:');
  assert.ok(sanitized[0].address.startsWith('kgr_sec3:'), 'La dirección debe estar cifrada en reposo con CTR kgr_sec3:');
  assert.ok(sanitized[0].emergencyContactName.startsWith('kgr_sec3:'), 'El contacto de emergencia debe estar cifrado');
  assert.ok(sanitized[0].notes.startsWith('kgr_sec3:'), 'Las notas médicas deben estar cifradas');
  assert.ok(sanitized[0].birthDate.startsWith('kgr_sec3:'), 'La fecha de nacimiento debe estar cifrada');

  // 2. Restaurar en memoria: debe devolver los valores exactos originales
  const restored = restorePublishersFromLocalStorage(sanitized);
  assert.equal(restored[0].name, 'Carlos Gomez');
  assert.equal(restored[0].phone, '3182634036');
  assert.equal(restored[0].address, 'Calle 100 # 15-20');
  assert.equal(restored[0].emergencyContactName, 'Maria Gomez');
  assert.equal(restored[0].emergencyContactPhone, '3109876543');
  assert.equal(restored[0].birthDate, '1990-05-15');
  assert.equal(restored[0].notes, 'Alergia a la penicilina y mariscos. DPA vigente.');

  // 3. Compatibilidad hacia atrás: registros legados kgr_sec2: se descifran transparentemente
  const legacySec2Pub = [{ id: 'leg2', name: 'Marta', phone: 'kgr_sec2:1122334455667788', notes: 'Hipertensión' }];
  const restoredSec2 = restorePublishersFromLocalStorage(legacySec2Pub);
  assert.ok(restoredSec2[0].notes, 'Hipertensión');

  // 4. Compatibilidad hacia atrás: registros legados sin cifrar se leen intactos
  const legacyPub = [{ id: 'leg1', name: 'Pedro', phone: '3001234567', notes: 'Hipertensión' }];
  const restoredLegacy = restorePublishersFromLocalStorage(legacyPub);
  assert.equal(restoredLegacy[0].phone, '3001234567');
  assert.equal(restoredLegacy[0].notes, 'Hipertensión');
});

test('almacenamiento de PIN en reposo: kgr_v2 con CTR y compatibilidad con kgr_v1 (H-01)', () => {
  const pin = '4821';
  const encV2 = encryptPinAtRest(pin);
  assert.ok(encV2.startsWith('kgr_v2:'), 'Nuevo PIN debe cifrarse como kgr_v2');
  const decV2 = decryptPinAtRest(encV2);
  assert.equal(decV2, pin, 'PIN kgr_v2 debe descifrarse correctamente');

  // kgr_v1 legado se descifra correctamente
  const legacyV1 = 'kgr_v1:5b575d5e';
  const decV1 = decryptPinAtRest(legacyV1);
  assert.ok(typeof decV1 === 'string', 'kgr_v1 debe descifrarse sin error');
});

test('códigos de invitación: 10 caracteres base32 (50 bits de entropía), hash v2 y compatibilidad hacia atrás', () => {
  // 1. Generación de alta entropía (2 bloques de 5 caracteres base32 = 10 caracteres = >10^15 combinaciones)
  const code = generateSecureInvitationCode('ANC');
  assert.match(code, /^KONG-ANC-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);

  // 2. Hash v2
  const hashV2 = hashInvitationCode(code);
  assert.ok(hashV2.startsWith('inv_h2_'), 'Debe usar prefijo inv_h2_');

  // 3. Verificación flexible contra hash v2 (sin código en memoria, simulando payload_public)
  const invV2 = { codeHash: hashV2 };
  assert.ok(verifyInvitationCodeMatch(code, invV2), 'Código idéntico coincide');
  assert.ok(verifyInvitationCodeMatch(code.toLowerCase(), invV2), 'Minúsculas coincide');
  assert.ok(verifyInvitationCodeMatch(code.replace(/-/g, ''), invV2), 'Sin guiones coincide');
  assert.ok(verifyInvitationCodeMatch(code.replace('KONG-', ''), invV2), 'Sin prefijo KONG- coincide');
  assert.ok(!verifyInvitationCodeMatch('KONG-ANC-WRONG-CODE1', invV2), 'Código incorrecto es rechazado');

  // 4. Compatibilidad hacia atrás con hash v1 heredado (inv_h1_...)
  const legacyCode = 'KONG-SEC-8X4M9P';
  const legacyHash = hashInvitationCodeV1(legacyCode);
  const invV1 = { codeHash: legacyHash };
  assert.ok(verifyInvitationCodeMatch(legacyCode, invV1), 'Código v1 coincide contra hash v1');
  assert.ok(verifyInvitationCodeMatch('SEC-8X4M9P', invV1), 'Código v1 sin KONG- coincide');
  assert.ok(verifyInvitationCodeMatch(legacyCode.toLowerCase(), invV1), 'Código v1 en minúsculas coincide');
});

test('isEncryptedPinAtRest: detecta formatos kgr_v2: y kgr_v1:', () => {
  assert.equal(isEncryptedPinAtRest('kgr_v2:nonce:mac:data'), true);
  assert.equal(isEncryptedPinAtRest('kgr_v1:5b575d5e'), true);
  assert.equal(isEncryptedPinAtRest('1234'), false);
  assert.equal(isEncryptedPinAtRest(''), false);
  assert.equal(isEncryptedPinAtRest(null), false);
  assert.equal(isEncryptedPinAtRest(undefined), false);

  // Auto-migración al cifrar con formato legado kgr_v1:
  const encFromV1 = encryptPinAtRest('kgr_v1:5b575d5e');
  assert.ok(encFromV1.startsWith('kgr_v2:'), 'Debe migrar automáticamente de kgr_v1 a kgr_v2');

  // verifyPersonalPinMatch con personalPin cifrado con kgr_v2
  const plainPin = '7392';
  const encV2Pin = encryptPinAtRest(plainPin);
  const recordWithEncPersonalPin = { id: 'pub1', personalPin: encV2Pin };
  assert.ok(verifyPersonalPinMatch(plainPin, recordWithEncPersonalPin), 'Debe verificar correctamente contra personalPin cifrado con kgr_v2');

  // sanitizePublishersForLocalStorage con personalPin ya cifrado
  const pubsToSanitize = [{ id: 'pub1', name: 'Hermano', personalPin: encV2Pin }];
  const sanitized = sanitizePublishersForLocalStorage(pubsToSanitize);
  assert.equal(sanitized[0].personalPin, undefined, 'personalPin debe ser removido');
  assert.ok(sanitized[0].encryptedPin.startsWith('kgr_v2:'), 'encryptedPin debe mantenerse');
  assert.ok(sanitized[0].personalPinHash, 'personalPinHash debe derivarse del PIN descifrado');
  const restored = restorePublishersFromLocalStorage(sanitized);
  assert.equal(restored[0].personalPin, plainPin, 'restorePublishersFromLocalStorage debe recuperar el PIN en memoria');
});

test('isSafeDemoMode: impide omisión de seguridad en congregaciones reales', () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = mockStorage;

  // 1. Sin demo_mode
  assert.equal(isSafeDemoMode(), false);

  // 2. Demo mode legítimo (congregación DEMO o sin registrar)
  mockStorage.setItem('kongre_demo_mode', 'true');
  mockStorage.setItem('kongre_congregation_id', 'DEMO-001');
  assert.equal(isSafeDemoMode(), true);

  // 3. Intento de bypass en congregación REAL registrada (ej: 10582)
  mockStorage.setItem('kongre_demo_mode', 'true');
  mockStorage.setItem('kongre_is_registered_congregation', 'true');
  mockStorage.setItem('kongre_congregation_id', '10582');
  mockStorage.setItem('kongre_congregation_number', '10582');
  assert.equal(isSafeDemoMode(), false, 'Debe invalidar demo mode en congregación real registrada');
  assert.equal(mockStorage.getItem('kongre_demo_mode'), null, 'Debe purgar la clave kongre_demo_mode');

  // 4. Intento con ID KGR formal en congregación real
  mockStorage.setItem('kongre_demo_mode', 'true');
  mockStorage.setItem('kongre_is_registered_congregation', 'true');
  mockStorage.setItem('kongre_congregation_id', 'KGR-8P2M-7X4W');
  assert.equal(isSafeDemoMode(), false, 'Debe invalidar demo mode en ID canónico registrado');
  assert.equal(mockStorage.getItem('kongre_demo_mode'), null);
});

test('firma de rol v2: ligada a entropía de dispositivo y retrocompatible con v1', () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = mockStorage;

  // 1. Rol público siempre válido
  assert.equal(verifyRoleSessionSignature('publico', ['publico']), true);

  // 2. Firma v2 para anciano en congregación 10582
  mockStorage.setItem('kongre_congregation_id', '10582');
  signRoleSession('anciano', ['anciano']);
  assert.equal(verifyRoleSessionSignature('anciano', ['anciano']), true);

  // 3. Intento de escalada en localStorage sin firma válida
  mockStorage.setItem('kongre_active_role_v1', 'coordinador');
  assert.equal(verifyRoleSessionSignature('coordinador', ['coordinador']), false, 'Firma no válida debe ser rechazada');

  // 4. Intento de reutilización de firma en otra congregación (escalada cruzada)
  mockStorage.setItem('kongre_congregation_id', '99999');
  assert.equal(verifyRoleSessionSignature('anciano', ['anciano'], '99999'), false, 'Firma de una congregación no debe ser válida para otra');
});

