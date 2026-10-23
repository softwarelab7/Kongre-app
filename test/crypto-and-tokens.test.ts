import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptForSupabase, decryptFromSupabase, encryptData, decryptData } from '../src/utils/crypto.ts';
import { encodeSecureShareToken, decodeSecureShareToken, generateSecureMasterPin } from '../src/utils/theocraticSecurity.ts';

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
