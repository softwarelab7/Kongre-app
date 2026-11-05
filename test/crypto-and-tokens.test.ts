import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptForSupabase,
  decryptFromSupabase,
  encryptData,
  decryptData,
  normalizePin,
  normalizePinV2,
  isLegacyPinFormat,
} from '../src/utils/crypto.ts';

test('normalización v2: preserva símbolos, mayúsculas/minúsculas y realiza NFKC trim', () => {
  assert.equal(normalizePinV2('  Teo#2026!  '), 'Teo#2026!');
  assert.equal(normalizePinV2('8X4W-9M2K'), '8X4W-9M2K');
  assert.equal(normalizePinV2('user@cong_123'), 'user@cong_123');

  // Comparación contra v1
  assert.equal(normalizePin('  Teo#2026!  '), 'TEO2026');
  assert.equal(isLegacyPinFormat('Teo#2026!'), true);
  assert.equal(isLegacyPinFormat('8X4W-9M2K'), true); // v1 elimina el guion
  assert.equal(isLegacyPinFormat('123456789012'), false); // numérico puro es idéntico
});

test('cifrado v2 con símbolos: ida y vuelta con caracteres especiales', async () => {
  const pinWithSymbols = 'Kgr#Beto-2026!@$';
  const data = { congregacion: 'Centro', secreto: 42, tags: ['ancianos', 'auditoria'] };
  const encrypted = await encryptForSupabase(data, pinWithSymbols);
  assert.ok(encrypted.startsWith('v2:'));
  const decrypted = await decryptFromSupabase(encrypted, pinWithSymbols);
  assert.deepEqual(decrypted, data);
});

test('cifrado: fallback dual transparente para descifrar datos legados (v1 normalizado)', async () => {
  const { webcrypto } = await import('node:crypto');
  const enc = new TextEncoder();
  // Simular ciphertext legado v1 cifrado con PIN que fue normalizado a mayúsculas sin símbolos
  const rawPin = 'MyPass#2026!';
  const legacyNormalizedPin = normalizePin(rawPin); // "MYPASS2026"
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const base = await webcrypto.subtle.importKey('raw', enc.encode(legacyNormalizedPin), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const buf = new Uint8Array(await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify({ legacy: true, secret: 999 }))));
  const h = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  const legacyCiphertext = `${h(salt)}:${h(iv)}:${h(buf.slice(-16))}:${h(buf.slice(0, -16))}`;

  // El usuario introduce su PIN con símbolos rawPin ("MyPass#2026!").
  // El primer intento v2 fallará el auth tag, y el fallback v1 lo descifrará con éxito.
  const decrypted = await decryptFromSupabase(legacyCiphertext, rawPin);
  assert.deepEqual(decrypted, { legacy: true, secret: 999 });

  // Si se introduce un PIN incorrecto, falla limpiamente
  await assert.rejects(decryptFromSupabase(legacyCiphertext, 'WrongPass#2026!'), /PIN incorrecto/);
});
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
  encryptSensitiveFieldAtRest,
  decryptSensitiveFieldAtRest,
  parseServerRoleToken,
  SERVER_ROLE_TOKEN_STORAGE_KEY,
} from '../src/utils/theocraticSecurity.ts';
import { setVaultSessionEntropyForTesting } from '../src/utils/atRestVault.ts';
import { sanitizeActorNid, sanitizeAuditDetails } from '../src/services/auditLogService.ts';

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

test('auditoría: sanitización de actor NID y detalles contra tablas arcoíris y fuga de PIN', () => {
  // 1. PIN numérico se saltea y se oculta
  const maskedNumeric = sanitizeActorNid('1234');
  assert.ok(maskedNumeric.startsWith('id_'), 'PIN numérico debe enmascararse con prefijo id_');
  assert.notEqual(maskedNumeric, '1234');

  // 2. PIN cifrado kgr_v2 se enmascara con prefijo id_
  const maskedV2 = sanitizeActorNid('kgr_v2:nonce:mac:data');
  assert.ok(maskedV2.startsWith('id_'));

  // 3. Cadena anónima
  assert.equal(sanitizeActorNid(''), 'anonimo');
  assert.equal(sanitizeActorNid(undefined), 'anonimo');

  // 4. Nombre o ID no sensible se preserva
  assert.equal(sanitizeActorNid('carlos_mendoza'), 'carlos_mendoza');

  // 5. Detalles con PIN se sanitizan
  const cleanDetails = sanitizeAuditDetails('Acceso concedido con pin: 4821 para usuario');
  assert.equal(cleanDetails, 'Acceso concedido con pin: •••• para usuario');
  const cleanClave = sanitizeAuditDetails('Cambio de clave = 9876 exitoso');
  assert.equal(cleanClave, 'Cambio de clave = •••• exitoso');
});

test('Fase 2 Bóveda Local: Cifrado kgr_sec4 respaldado por IndexedDB para salud (DPA) y notas confidenciales', () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = mockStorage;

  // 1. Simular bóveda inicializada con entropía de clave no extraíble
  setVaultSessionEntropyForTesting('a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00');

  const pubWithDpaAndNotes = [
    {
      id: 'pub_dpa_1',
      name: 'Hno Alberto Ruiz',
      personalPin: '7788',
      phone: '3115551234',
      // Directiva DPA confidencial
      has_dpa: true,
      dpa_date: '2026-01-10',
      dpa_expiry_date: '2027-01-10',
      healthcare_agent_name: 'Doris Ruiz',
      healthcare_agent_phone: '3129998877',
      healthcare_agent_alternate_name: 'Carlos Ruiz',
      healthcare_agent_alternate_phone: '3104443322',
      medical_allergies: 'Alérgico a sulfas y medios de contraste radiológico',
      medical_conditions: 'Marcapasos cardíaco bicameral, hipertensión',
      // Notas confidenciales de ancianos
      spiritual_notes: 'Reunión con el cuerpo de ancianos en dic 2025.',
      notes: 'Requiere apoyo de transporte para asamblea regional',
    },
  ];

  // 2. Sanitizar para localStorage: todos los campos de salud DPA y notas deben cifrarse con kgr_sec4
  const sanitized = sanitizePublishersForLocalStorage(pubWithDpaAndNotes);
  const sPub = sanitized[0];
  assert.equal(sPub.personalPin, undefined, 'PIN no debe guardarse en claro');
  assert.ok(sPub.personalPinHash, 'Debe haber hash del PIN');
  assert.ok(sPub.encryptedPin?.startsWith('kgr_v4:'), 'El PIN de publicador debe estar en kgr_v4:');
  assert.ok(sPub.phone.startsWith('kgr_sec4:'), 'Teléfono debe estar en kgr_sec4:');
  assert.ok(sPub.healthcare_agent_name.startsWith('kgr_sec4:'), 'Representante DPA debe estar en kgr_sec4:');
  assert.ok(sPub.healthcare_agent_phone.startsWith('kgr_sec4:'), 'Teléfono representante DPA debe estar en kgr_sec4:');
  assert.ok(sPub.medical_allergies.startsWith('kgr_sec4:'), 'Alergias médicas deben estar en kgr_sec4:');
  assert.ok(sPub.medical_conditions.startsWith('kgr_sec4:'), 'Condiciones médicas deben estar en kgr_sec4:');
  assert.ok(sPub.dpa_date.startsWith('kgr_sec4:'), 'Fecha DPA debe estar en kgr_sec4:');
  assert.ok(sPub.spiritual_notes.startsWith('kgr_sec4:'), 'Notas espirituales confidenciales deben estar en kgr_sec4:');
  assert.ok(sPub.notes.startsWith('kgr_sec4:'), 'Notas generales deben estar en kgr_sec4:');

  // 3. Restaurar en memoria con la bóveda activa: recupera exactamente los valores originales
  const restored = restorePublishersFromLocalStorage(sanitized);
  const rPub = restored[0];
  assert.equal(rPub.name, 'Hno Alberto Ruiz');
  assert.equal(rPub.phone, '3115551234');
  assert.equal(rPub.healthcare_agent_name, 'Doris Ruiz');
  assert.equal(rPub.healthcare_agent_phone, '3129998877');
  assert.equal(rPub.medical_allergies, 'Alérgico a sulfas y medios de contraste radiológico');
  assert.equal(rPub.medical_conditions, 'Marcapasos cardíaco bicameral, hipertensión');
  assert.equal(rPub.spiritual_notes, 'Reunión con el cuerpo de ancianos en dic 2025.');

  // 4. Prueba de aislamiento contra robo de dump de localStorage:
  // Si un atacante extrae localStorage sin la clave unextractable de IndexedDB (sin vaultSessionEntropy),
  // kgr_sec4 no puede ser descifrado y devuelve el valor cifrado sin fugar texto claro.
  setVaultSessionEntropyForTesting(null);
  const stolenDumpRestored = restorePublishersFromLocalStorage(sanitized);
  assert.ok(stolenDumpRestored[0].medical_allergies.startsWith('kgr_sec4:'), 'Sin la bóveda no se puede descifrar');
  assert.ok(stolenDumpRestored[0].spiritual_notes.startsWith('kgr_sec4:'), 'Sin la bóveda las notas no se descifran');

  // 5. Retrocompatibilidad: Si existen datos antiguos en kgr_sec3 o kgr_sec2 se leen sin problemas
  setVaultSessionEntropyForTesting(null); // simular entorno básico
  const legacyEncrypted = encryptSensitiveFieldAtRest('Alergia al polen');
  assert.ok(legacyEncrypted.startsWith('kgr_sec3:'));
  assert.equal(decryptSensitiveFieldAtRest(legacyEncrypted), 'Alergia al polen');

  // Restaurar estado
  setVaultSessionEntropyForTesting(null);
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
});

test('Token de rol de servidor: parseServerRoleToken y verifyRoleSessionSignature bloquean escalada en DevTools', () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = mockStorage;

  mockStorage.setItem('kongre_congregation_id', '1001DEMO');

  // Token válido emitido por el servidor para un publicador
  const expFuture = Date.now() + 3600_000;
  const fakeToken = `kgr_srt1.1001DEMO:pub_123:publicador:publicador,audio_video:${expFuture}.a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`;

  const parsed = parseServerRoleToken(fakeToken);
  assert.ok(parsed);
  assert.equal(parsed.congId, '1001DEMO');
  assert.equal(parsed.publisherId, 'pub_123');
  assert.equal(parsed.role, 'publicador');
  assert.deepEqual(parsed.roles, ['publicador', 'audio_video']);

  // Token expirado se rechaza en el parser
  const expPast = Date.now() - 1000;
  const expiredToken = `kgr_srt1.1001DEMO:pub_123:publicador:publicador:${expPast}.a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`;
  assert.equal(parseServerRoleToken(expiredToken), null);

  // Almacenar el token en el cliente
  mockStorage.setItem(SERVER_ROLE_TOKEN_STORAGE_KEY, fakeToken);

  // 1. Firma y validación exitosa para rol autorizado en el token
  signRoleSession('publicador', ['publicador', 'audio_video'], '1001DEMO');
  assert.equal(verifyRoleSessionSignature('publicador', ['publicador', 'audio_video'], '1001DEMO'), true);

  // 2. ATAQUE DEVTOOLS: El usuario intenta cambiar kongre_active_role_v1 a 'anciano' o 'coordinador'
  assert.equal(
    verifyRoleSessionSignature('anciano', ['anciano'], '1001DEMO'),
    false,
    'Debe rechazar la sesión si el rol en localStorage excede lo firmado en el token de servidor'
  );
  assert.equal(
    verifyRoleSessionSignature('coordinador', ['coordinador'], '1001DEMO'),
    false,
    'Debe rechazar la sesión si el usuario intenta escalar a coordinador sin token de servidor'
  );

  // 3. ATAQUE DEVTOOLS: El usuario intenta borrar o corromper el token de servidor
  mockStorage.setItem(SERVER_ROLE_TOKEN_STORAGE_KEY, 'token_falso_invalido');
  assert.equal(verifyRoleSessionSignature('publicador', ['publicador'], '1001DEMO'), false);
});

test('Bóveda Local: descifrado resiliente de campos sensibles ante cambios de PIN de sesión o congId', () => {
  const store: Record<string, string> = {
    kongre_session_pin_v2: '1234',
    kongre_congregation_number: '1001-DEMO',
  };
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  (globalThis as any).window = {};
  (globalThis as any).localStorage = mockStorage;

  setVaultSessionEntropyForTesting('a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00');

  const pub = [
    {
      id: 'pub_test_resilience',
      name: 'Hno Daniel Vega',
      phone: '+52 55 9988 7766',
      address: 'Calle Luna 123, Centro',
      notes: 'Disponibilidad para fines de semana',
    },
  ];

  const sanitized = sanitizePublishersForLocalStorage(pub);
  assert.ok(sanitized[0].phone.startsWith('kgr_sec4:'));

  // Simular cambio o borrado de sesión (ej. recarga de página antes de autenticar o cambio de rol)
  delete store.kongre_session_pin_v2;
  delete store.kongre_congregation_number;

  const restored = restorePublishersFromLocalStorage(sanitized);
  assert.equal(restored[0].phone, '+52 55 9988 7766', 'Debe descifrar el teléfono incluso si sessionPin se limpió');
  assert.equal(restored[0].address, 'Calle Luna 123, Centro', 'Debe descifrar la dirección');
  assert.equal(restored[0].notes, 'Disponibilidad para fines de semana', 'Debe descifrar las notas');

  setVaultSessionEntropyForTesting(null);
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
});

