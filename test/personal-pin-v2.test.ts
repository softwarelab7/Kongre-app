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
    async updateRowIfVersion(id, patch, expected) {
      const cur = rows.get(id);
      if (!cur || Date.parse(cur.created_at) !== Date.parse(expected)) return false;
      rows.set(id, { ...cur, ...patch });
      return true;
    },
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
  const env: SyncEnv = { pepper: PEPPER, allowedOrigins: [], now: () => clock.t, ...opts };
  const callRaw = async (body: any, ip = '1.1.1.1') => {
    const res = await handleRequest(new Request('https://x/f', { method: 'POST', headers: { 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), db, env);
    return { status: res.status, body: await res.json() };
  };
  // Como el cliente real: todo push sobre una fila existente declara la versión en la que se basa (el servidor la exige).
  const call = async (body: any, ip = '1.1.1.1') => {
    const base = body?.action === 'push' && body.expected_version === undefined ? rows.get(body.id)?.created_at : undefined;
    return callRaw(base ? { ...body, expected_version: base } : body, ip);
  };
  return { clock, db, rows, env, call, callRaw };
}

const CONG = 'CONGV2';
const H = (c: string) => c.repeat(64);
const mk = (call: any, pins: any[]) =>
  call({ action: 'push', id: CONG, tokens: { master: T.masterA, public: T.publicA }, payload: 'A', payload_public: 'P', personal_pins: pins });
const verify = (call: any, pub: string, extra: any, ip = '9.9.9.9') =>
  call({ action: 'verify_personal_pin', id: CONG, tokens: { public: T.publicA }, publisher_id: pub, ...extra }, ip);

test('v2: mismo PIN en dos publicadores => verificadores distintos', async () => {
  const { call, rows } = setup();
  await mk(call, [
    { id: 'p1', token: H('1'), v: 2, name: 'A', role: 'publico' },
    { id: 'p2', token: H('1'), v: 2, name: 'B', role: 'publico' },
  ]);
  const [a, b] = rows.get(CONG)!.personal_verifiers!;
  assert.equal(a.v, 2);
  assert.notEqual(a.verifier, b.verifier);
});

test('v2: acepta el token v2 correcto y rechaza el incorrecto o el heredado', async () => {
  const { call } = setup();
  await mk(call, [{ id: 'p1', token: H('1'), v: 2, name: 'A', role: 'publico' }]);
  assert.equal((await verify(call, 'p1', { pin_token_v2: H('1') })).status, 200);
  // El esquema v1 (pin_token) ya no existe: sin pin_token_v2 la petición es inválida.
  const legacyOnly = await verify(call, 'p1', { pin_token: H('1') });
  assert.equal(legacyOnly.status, 400);
  const wrongV2 = await verify(call, 'p1', { pin_token: H('1'), pin_token_v2: H('2') }, '8.8.8.8');
  assert.equal(wrongV2.status, 401);
});

test('v2: un verificador enviado sin v:2 se descarta (no hay esquema heredado)', async () => {
  const { call, rows } = setup();
  await mk(call, [
    { id: 'p1', token: H('1'), name: 'sin v', role: 'publico' },
    { id: 'p2', token: H('2'), v: 2, name: 'con v2', role: 'publico' },
  ]);
  const stored = rows.get(CONG)!.personal_verifiers!;
  assert.deepEqual(stored.map((x) => x.id), ['p2'], 'solo se guarda el publicador con esquema v2');
  assert.equal((await verify(call, 'p1', { pin_token_v2: H('1') }, '5.5.5.5')).status, 401);
});

test('v2: cambiar el PIN de un publicador invalida el anterior tras el siguiente push maestro', async () => {
  const { call } = setup();
  await mk(call, [{ id: 'p1', token: H('1'), v: 2, name: 'A', role: 'publico' }]);
  await mk(call, [{ id: 'p1', token: H('3'), v: 2, name: 'A', role: 'publico' }]);
  assert.equal((await verify(call, 'p1', { pin_token_v2: H('3') }, '7.7.7.7')).status, 200);
  assert.equal((await verify(call, 'p1', { pin_token_v2: H('1') }, '6.6.6.6')).status, 401);
});
