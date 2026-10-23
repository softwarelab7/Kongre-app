import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, type SyncDb, type SyncRow, type SyncEnv } from '../supabase/functions/kongre-sync/core.ts';

// ---- Base de datos en memoria que imita la semántica de las funciones SQL ----
function makeDb(clock: { t: number }) {
  const rows = new Map<string, SyncRow>();
  const rl = new Map<string, { fails: number; windowStart: number; lockedUntil: number | null }>();
  const db: SyncDb = {
    async getRow(id) { const r = rows.get(id); return r ? { ...r } : null; },
    async insertRow(row) { if (rows.has(row.id_congregacion)) return false; rows.set(row.id_congregacion, { ...row }); return true; },
    async updateRow(id, patch) { rows.set(id, { ...rows.get(id)!, ...patch }); },
    async deleteRow(id) { rows.delete(id); },
    async lockedUntil(keys) {
      let m: number | null = null;
      for (const k of keys) { const e = rl.get(k); if (e?.lockedUntil && e.lockedUntil > clock.t) m = Math.max(m ?? 0, e.lockedUntil); }
      return m;
    },
    async registerFailure(key, limit, win, lock) {
      let e = rl.get(key);
      if (!e || e.windowStart < clock.t - win * 1000) e = { fails: 0, windowStart: clock.t, lockedUntil: e?.lockedUntil ?? null };
      e.fails++;
      rl.set(key, e);
      if (e.fails >= limit) { e.lockedUntil = clock.t + lock * 1000; e.fails = 0; e.windowStart = clock.t; return e.lockedUntil; }
      return null;
    },
    async clearFailures(key) { rl.delete(key); },
  };
  return { db, rows };
}

const hex = (c: string) => c.repeat(64);
const T = { masterA: hex('a'), publicA: hex('b'), masterNew: hex('c'), publicNew: hex('d'), wrong: hex('e') };
const PEPPER = 'p'.repeat(40);

function setup(opts: Partial<SyncEnv> = {}) {
  const clock = { t: 1_800_000_000_000 };
  const { db, rows } = makeDb(clock);
  const env: SyncEnv = { pepper: PEPPER, allowedOrigins: [], legacyClaim: false, now: () => clock.t, ...opts };
  const call = async (body: any, ip = '1.1.1.1') => {
    const res = await handleRequest(new Request('https://x/f', { method: 'POST', headers: { 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), db, env);
    return { status: res.status, body: await res.json() };
  };
  return { clock, db, rows, env, call };
}

const create = (call: any, id = 'CONG1') =>
  call({ action: 'push', id, tokens: { master: T.masterA, public: T.publicA }, payload: 'ADMIN1', payload_public: 'PUB1' });

test('crear y leer según nivel', async () => {
  const { call } = setup();
  assert.equal((await create(call)).status, 200);
  const m = await call({ action: 'pull', id: 'CONG1', tokens: { master: T.masterA, public: T.publicA } });
  assert.equal(m.body.tier, 'master'); assert.equal(m.body.payload, 'ADMIN1'); assert.equal(m.body.payload_public, 'PUB1');
  const p = await call({ action: 'pull', id: 'CONG1', tokens: { master: T.wrong, public: T.publicA } });
  assert.equal(p.status, 200); assert.equal(p.body.tier, 'public');
  assert.equal(p.body.payload, null, 'el PIN de congregación NO debe recibir el payload maestro');
  assert.equal(p.body.payload_public, 'PUB1');
});

test('credenciales incorrectas e inexistente dan la misma respuesta (sin enumeración)', async () => {
  const { call } = setup();
  await create(call);
  const wrong = await call({ action: 'pull', id: 'CONG1', tokens: { master: T.wrong, public: T.wrong } }, '2.2.2.2');
  const none = await call({ action: 'pull', id: 'NOEXISTE', tokens: { master: T.wrong, public: T.wrong } }, '3.3.3.3');
  assert.equal(wrong.status, 401); assert.deepEqual(wrong.body, none.body); assert.equal(none.status, 401);
});

test('nivel público NO puede escribir (403): protege payload_public contra reescritura', async () => {
  const { call, rows } = setup();
  await create(call);
  const r = await call({ action: 'push', id: 'CONG1', tokens: { master: T.wrong, public: T.publicA }, payload: 'HACK', payload_public: 'PUB2',
    rotate_to: { master: T.masterNew } });
  assert.equal(r.status, 403);
  assert.equal(r.body.error, 'push_requires_master_tier');
  assert.equal(rows.get('CONG1')!.payload, 'ADMIN1', 'payload maestro intacto');
  assert.equal(rows.get('CONG1')!.payload_public, 'PUB1', 'payload público intacto');
});

test('maestro escribe ambos y preserve_master protege el payload', async () => {
  const { call, rows } = setup();
  await create(call);
  await call({ action: 'push', id: 'CONG1', tokens: { master: T.masterA, public: T.publicA }, payload: 'ADMIN2', payload_public: 'PUB2' });
  assert.equal(rows.get('CONG1')!.payload, 'ADMIN2');
  await call({ action: 'push', id: 'CONG1', tokens: { master: T.masterA, public: T.publicA }, payload: 'VACIO', payload_public: 'PUB3', preserve_master: true });
  assert.equal(rows.get('CONG1')!.payload, 'ADMIN2'); assert.equal(rows.get('CONG1')!.payload_public, 'PUB3');
});

test('rotación de credenciales: las viejas dejan de funcionar', async () => {
  const { call } = setup();
  await create(call);
  const r = await call({ action: 'push', id: 'CONG1', tokens: { master: T.masterA, public: T.publicA }, payload: 'A', payload_public: 'B',
    rotate_to: { master: T.masterNew, public: T.publicNew } });
  assert.equal(r.status, 200);
  assert.equal((await call({ action: 'meta', id: 'CONG1', tokens: { master: T.masterA, public: T.publicA } }, '4.4.4.4')).status, 401);
  assert.equal((await call({ action: 'meta', id: 'CONG1', tokens: { master: T.masterNew } })).body.tier, 'master');
  assert.equal((await call({ action: 'meta', id: 'CONG1', tokens: { public: T.publicNew } })).body.tier, 'public');
});

test('borrar: público 403, maestro ok', async () => {
  const { call, rows } = setup();
  await create(call);
  assert.equal((await call({ action: 'delete', id: 'CONG1', tokens: { public: T.publicA } })).status, 403);
  assert.ok(rows.has('CONG1'));
  assert.equal((await call({ action: 'delete', id: 'CONG1', tokens: { master: T.masterA } })).status, 200);
  assert.ok(!rows.has('CONG1'));
});

test('límite de intentos: bloquea y luego libera', async () => {
  const { call, clock } = setup();
  await create(call);
  const codes: number[] = [];
  for (let i = 0; i < 9; i++) codes.push((await call({ action: 'pull', id: 'CONG1', tokens: { master: T.wrong } }, '7.7.7.7')).status);
  assert.deepEqual(codes.slice(0, 7), Array(7).fill(401));
  assert.equal(codes[7], 429, 'el intento 8 activa el bloqueo');
  // incluso con credenciales correctas, desde esa IP sigue bloqueado
  assert.equal((await call({ action: 'pull', id: 'CONG1', tokens: { master: T.masterA } }, '7.7.7.7')).status, 429);
  // otra IP legítima, para esa congregación, no queda bloqueada por el límite congregación+IP
  assert.equal((await call({ action: 'pull', id: 'CONG1', tokens: { master: T.masterA } }, '8.8.8.8')).status, 200);
  clock.t += 16 * 60 * 1000;
  assert.equal((await call({ action: 'pull', id: 'CONG1', tokens: { master: T.masterA } }, '7.7.7.7')).status, 200);
});

test('límite por IP entre congregaciones distintas', async () => {
  const { call } = setup();
  let last = 0;
  for (let i = 0; i < 41; i++) last = (await call({ action: 'pull', id: `ID${1000 + i}`, tokens: { master: T.wrong } }, '5.5.5.5')).status;
  assert.equal(last, 429);
});

test('filas antiguas: no se leen y solo se reclaman con LEGACY_CLAIM', async () => {
  for (const legacyClaim of [false, true]) {
    const { call, rows } = setup({ legacyClaim });
    rows.set('OLD1', { id_congregacion: 'OLD1', payload: 'X', payload_public: 'Y', created_at: new Date(0).toISOString(), type: 'full_sync', master_verifier: null, public_verifier: null });
    assert.equal((await call({ action: 'pull', id: 'OLD1', tokens: { master: T.masterA } })).status, 401);
    const claim = await call({ action: 'push', id: 'OLD1', tokens: { master: T.masterA, public: T.publicA }, payload: 'NEW', payload_public: 'NEWP' });
    if (!legacyClaim) { assert.equal(claim.status, 401); assert.equal(rows.get('OLD1')!.payload, 'X'); }
    else {
      assert.equal(claim.status, 200); assert.equal(claim.body.claimed, true);
      assert.equal((await call({ action: 'pull', id: 'OLD1', tokens: { master: T.masterA } })).body.payload, 'NEW');
    }
  }
});

test('validaciones de entrada', async () => {
  const { call } = setup();
  assert.equal((await call({ action: 'pull', id: 'a', tokens: { master: T.masterA } })).status, 400);
  assert.equal((await call({ action: 'pull', id: 'CONG1', tokens: { master: 'corto' } })).status, 400);
  assert.equal((await call({ action: 'pull', id: 'CONG1' })).status, 400);
  assert.equal((await call({ action: 'hack', id: 'CONG1', tokens: { master: T.masterA } })).status, 400);
  assert.equal((await call({ action: 'push', id: 'NEW1', tokens: { master: T.masterA }, payload: 'x', payload_public: 'y' })).status, 400, 'crear exige ambos tokens');
  const res = await handleRequest(new Request('https://x/f', { method: 'GET' }), setup().db, setup().env);
  assert.equal(res.status, 405);
});

test('límite de creaciones por IP', async () => {
  const { call } = setup();
  const codes: number[] = [];
  for (let i = 0; i < 12; i++) codes.push((await create(call, `NEW${100 + i}`)).status);
  assert.equal(codes.filter((c) => c === 200).length, 9);
  assert.ok(codes.includes(429));
});

test('verificación segura de PIN personal con límite de intentos', async () => {
  const { call, rows } = setup();
  const CONG = 'CONGPIN';
  const pinToken1 = hex('1');
  const pinTokenWrong = hex('2');

  // 1. Crear congregación con personal_pins
  const created = await call({
    action: 'push',
    id: CONG,
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN',
    payload_public: 'PUB',
    personal_pins: [
      { id: 'pub_anciano', token: pinToken1, name: 'Hermano Anciano', role: 'anciano', privilege: 'anciano' },
    ],
  });
  assert.equal(created.status, 200);

  // 2. Verificar que personal_verifiers se guardó con HMAC
  const stored = rows.get(CONG)!;
  assert.ok(Array.isArray(stored.personal_verifiers));
  assert.equal(stored.personal_verifiers.length, 1);
  assert.notEqual(stored.personal_verifiers[0].verifier, pinToken1);
  assert.match(stored.personal_verifiers[0].verifier, /^[a-f0-9]{64}$/);

  // 3. Intento sin publisher_id: rechazo 400 (publisher_id_required)
  const noPubRes = await call({
    action: 'verify_personal_pin',
    id: CONG,
    tokens: { public: T.publicA },
    pin_token: pinToken1,
  });
  assert.equal(noPubRes.status, 400);
  assert.equal(noPubRes.body.error, 'publisher_id_required');

  // 4. Verificación exitosa con token correcto, token público y publisher_id
  const okRes = await call({
    action: 'verify_personal_pin',
    id: CONG,
    tokens: { public: T.publicA },
    pin_token: pinToken1,
    publisher_id: 'pub_anciano',
  });
  assert.equal(okRes.status, 200);
  assert.equal(okRes.body.ok, true);
  assert.equal(okRes.body.publisher.id, 'pub_anciano');
  assert.equal(okRes.body.publisher.role, 'anciano');

  // 5. Verificación con token de congregación incorrecto: 401
  const badCong = await call({
    action: 'verify_personal_pin',
    id: CONG,
    tokens: { public: T.wrong },
    pin_token: pinToken1,
    publisher_id: 'pub_anciano',
  });
  assert.equal(badCong.status, 401);

  // 6. PIN personal incorrecto para ese publicador: 401 y dispara límite de intentos tras fallos repetidos
  for (let i = 0; i < 7; i++) {
    const fail = await call({
      action: 'verify_personal_pin',
      id: CONG,
      tokens: { public: T.publicA },
      pin_token: pinTokenWrong,
      publisher_id: 'pub_anciano',
    }, '9.9.9.9');
    assert.equal(fail.status, 401);
  }
  const blocked = await call({
    action: 'verify_personal_pin',
    id: CONG,
    tokens: { public: T.publicA },
    pin_token: pinTokenWrong,
    publisher_id: 'pub_anciano',
  }, '9.9.9.9');
  assert.equal(blocked.status, 429);
});

