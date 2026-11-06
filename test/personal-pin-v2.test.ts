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
  const env: SyncEnv = { pepper: PEPPER, allowedOrigins: [], legacyClaim: false, now: () => clock.t, ...opts };
  const call = async (body: any, ip = '1.1.1.1') => {
    const res = await handleRequest(new Request('https://x/f', { method: 'POST', headers: { 'cf-connecting-ip': ip }, body: JSON.stringify(body) }), db, env);
    return { status: res.status, body: await res.json() };
  };
  return { clock, db, rows, env, call };
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

test('v2: acepta token v2 correcto y rechaza token heredado (sin degradación)', async () => {
  const { call } = setup();
  await mk(call, [{ id: 'p1', token: H('1'), v: 2, name: 'A', role: 'publico' }]);
  assert.equal((await verify(call, 'p1', { pin_token: H('1'), pin_token_v2: H('1') })).status, 200);
  const legacyOnly = await verify(call, 'p1', { pin_token: H('1') });
  assert.equal(legacyOnly.status, 400);
  const wrongV2 = await verify(call, 'p1', { pin_token: H('1'), pin_token_v2: H('2') }, '8.8.8.8');
  assert.equal(wrongV2.status, 401);
});

test('heredado: verificadores antiguos siguen funcionando hasta el próximo push maestro', async () => {
  const { call } = setup();
  await mk(call, [{ id: 'p1', token: H('1'), name: 'A', role: 'publico' }]); // sin v => heredado
  assert.equal((await verify(call, 'p1', { pin_token: H('1'), pin_token_v2: H('3') })).status, 200);
  await mk(call, [{ id: 'p1', token: H('3'), v: 2, name: 'A', role: 'publico' }]); // migra a v2
  assert.equal((await verify(call, 'p1', { pin_token: H('1'), pin_token_v2: H('3') }, '7.7.7.7')).status, 200);
  assert.equal((await verify(call, 'p1', { pin_token: H('1'), pin_token_v2: H('1') }, '6.6.6.6')).status, 401);
});
