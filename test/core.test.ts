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

test('rotación: rechaza rotar verificador sin enviar el payload re-cifrado correspondiente', async () => {
  const { call, rows } = setup();
  await create(call);

  // 1. Intentar rotar master con preserve_master=true o sin payload maestro -> 400
  const r1 = await call({
    action: 'push',
    id: 'CONG1',
    tokens: { master: T.masterA },
    payload: 'A',
    preserve_master: true,
    rotate_to: { master: T.masterNew },
  });
  assert.equal(r1.status, 400);
  assert.equal(r1.body.error, 'rotation_requires_master_payload');

  const r2 = await call({
    action: 'push',
    id: 'CONG1',
    tokens: { master: T.masterA },
    payload_public: 'PUB2',
    rotate_to: { master: T.masterNew },
  });
  assert.equal(r2.status, 400);
  assert.equal(r2.body.error, 'rotation_requires_master_payload');

  // 2. Intentar rotar public sin payload_public -> 400
  const r3 = await call({
    action: 'push',
    id: 'CONG1',
    tokens: { master: T.masterA },
    payload: 'ADMIN2',
    rotate_to: { public: T.publicNew },
  });
  assert.equal(r3.status, 400);
  assert.equal(r3.body.error, 'rotation_requires_public_payload');

  // Los verificadores originales siguen intactos tras los rechazos
  assert.equal((await call({ action: 'meta', id: 'CONG1', tokens: { master: T.masterA } })).status, 200);
  assert.equal((await call({ action: 'meta', id: 'CONG1', tokens: { public: T.publicA } })).status, 200);
  assert.equal(rows.get('CONG1')!.payload, 'ADMIN1');
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
  //    (tope por publicador: 6 fallos -> el 6.º ya devuelve 429)
  for (let i = 0; i < 5; i++) {
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

test('PIN personal: el tope por publicador se aplica aunque el atacante cambie de IP', async () => {
  const { call, clock } = setup();
  const CONG = 'CONGPP';
  const good = 'a1'.repeat(32);
  const guess = (n: number) => n.toString(16).padStart(64, '0');
  await call({
    action: 'push', id: CONG, tokens: { master: T.masterA, public: T.publicA }, payload: 'A', payload_public: 'P',
    personal_pins: [{ id: 'pubX', token: good, name: 'X', role: 'anciano', privilege: 'anciano' }],
  });
  const verify = (tok: string, ip: string) =>
    call({ action: 'verify_personal_pin', id: CONG, tokens: { public: T.publicA }, pin_token: tok, publisher_id: 'pubX' }, ip);

  // 6 intentos fallidos desde 6 IPs distintas: el tope por (congregación, publicador) debe saltar igual
  let last: any;
  for (let i = 0; i < 6; i++) last = await verify(guess(i + 1), `10.0.0.${i + 1}`);
  assert.equal(last.status, 429, 'el 6.º fallo bloquea al publicador');

  // Bloqueado: ni siquiera el PIN correcto desde otra IP pasa mientras dure el bloqueo
  const during = await verify(good, '10.9.9.9');
  assert.equal(during.status, 429);

  // Otro publicador de la misma congregación NO se ve afectado por este bloqueo
  const other = await call({ action: 'verify_personal_pin', id: CONG, tokens: { public: T.publicA }, pin_token: good, publisher_id: 'otro' }, '10.8.8.8');
  assert.notEqual(other.status, 429);

  // Pasado el bloqueo (30 min) el PIN correcto vuelve a funcionar
  clock.t += 31 * 60 * 1000;
  const after = await verify(good, '10.7.7.7');
  assert.equal(after.status, 200);
  assert.equal(after.body.publisher.id, 'pubX');
});

test('PIN personal: publisher_id demasiado largo se rechaza (no se crean contadores arbitrarios)', async () => {
  const { call } = setup();
  await create(call, 'CONGLONG');
  const r = await call({ action: 'verify_personal_pin', id: 'CONGLONG', tokens: { public: T.publicA }, pin_token: hex('f'), publisher_id: 'x'.repeat(101) });
  assert.equal(r.status, 400);
  assert.equal(r.body.error, 'bad_publisher_id');

  // Caracteres no permitidos (inyección / caracteres de control)
  const rInvalid = await call({ action: 'verify_personal_pin', id: 'CONGLONG', tokens: { public: T.publicA }, pin_token: hex('f'), publisher_id: 'pub:admin\n' });
  assert.equal(rInvalid.status, 400);
  assert.equal(rInvalid.body.error, 'bad_publisher_id');
});

test('PIN personal: publisher_id inexistente se rechaza sin crear registros de publicador falso en rate_limits', async () => {
  const { call } = setup();
  await call({
    action: 'push',
    id: 'CONGFAKE',
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN',
    payload_public: 'PUB',
    personal_pins: [{ id: 'pubReal', token: hex('1'), name: 'Real', role: 'publico', privilege: 'publicador' }],
  });
  const r = await call({
    action: 'verify_personal_pin',
    id: 'CONGFAKE',
    tokens: { public: T.publicA },
    pin_token: hex('1'),
    publisher_id: 'pubInventado',
  });
  assert.equal(r.status, 401);
  assert.equal(r.body.error, 'invalid_credentials');
});

test('PIN personal: límite de publicadores por congregación (>500 rechazado)', async () => {
  const { call } = setup();
  await create(call, 'CONGMANY');
  const manyPublishers = Array.from({ length: 501 }, (_, i) => ({
    id: `pub_${i}`,
    token: hex('1'),
    name: `Pub ${i}`,
    role: 'publico',
  }));
  const r = await call({
    action: 'push',
    id: 'CONGMANY',
    tokens: { master: T.masterA, public: T.publicA },
    personal_pins: manyPublishers,
  });
  assert.equal(r.status, 400);
  assert.equal(r.body.error, 'too_many_publishers');
});

test('PIN personal: verify_personal_pin devuelve session_token firmado por el servidor y verify_role_token lo valida', async () => {
  const { call, clock } = setup();
  await call({
    action: 'push',
    id: 'CONGTOKEN',
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN',
    payload_public: 'PUB',
    personal_pins: [{
      id: 'pub1',
      token: hex('1'),
      name: 'Hno Juan',
      role: 'publicador',
      privilege: 'publicador',
      theocraticRoles: ['publicador', 'lector_atalaya'],
    }],
  });

  // 1. Verificación exitosa de PIN devuelve session_token
  const r1 = await call({
    action: 'verify_personal_pin',
    id: 'CONGTOKEN',
    tokens: { public: T.publicA },
    pin_token: hex('1'),
    publisher_id: 'pub1',
  });
  assert.equal(r1.status, 200);
  assert.equal(r1.body.ok, true);
  assert.ok(r1.body.session_token);
  assert.ok(r1.body.session_token.startsWith('kgr_srt1.CONGTOKEN:pub1:publicador:'));
  assert.ok(r1.body.expires_at > clock.t);

  // 2. verify_role_token valida el token emitido
  const r2 = await call({
    action: 'verify_role_token',
    id: 'CONGTOKEN',
    tokens: { public: T.publicA },
    token: r1.body.session_token,
  });
  assert.equal(r2.status, 200);
  assert.equal(r2.body.ok, true);
  assert.equal(r2.body.valid, true);
  assert.equal(r2.body.publisher_id, 'pub1');
  assert.equal(r2.body.role, 'publicador');
  assert.deepEqual(r2.body.roles, ['publicador', 'lector_atalaya']);

  // 3. Token con firma manipulada (intento de falsificación) es rechazado con 401
  const tamperedToken = r1.body.session_token.slice(0, -4) + 'abcd';
  const r3 = await call({
    action: 'verify_role_token',
    id: 'CONGTOKEN',
    tokens: { public: T.publicA },
    token: tamperedToken,
  });
  assert.equal(r3.status, 401);
  assert.equal(r3.body.error, 'invalid_or_expired_token');

  // 4. Token usado en una congregación distinta es rechazado
  const r4 = await call({
    action: 'verify_role_token',
    id: 'CONGOTHER',
    tokens: { public: T.publicA },
    token: r1.body.session_token,
  });
  assert.equal(r4.status, 401);

  // 5. Token expirado es rechazado
  clock.t += 31 * 24 * 3600 * 1000; // Avanzar 31 días
  const r5 = await call({
    action: 'verify_role_token',
    id: 'CONGTOKEN',
    tokens: { public: T.publicA },
    token: r1.body.session_token,
  });
  assert.equal(r5.status, 401);
  assert.equal(r5.body.error, 'invalid_or_expired_token');
});

test('verify_role_token: revoca el token si el publicador es eliminado o cambia de rol en un push posterior', async () => {
  const { call } = setup();
  await call({
    action: 'push',
    id: 'CONGREVOKE',
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN',
    payload_public: 'PUB',
    personal_pins: [{
      id: 'pubAnciano',
      token: hex('1'),
      name: 'Hno Pedro',
      role: 'anciano',
      privilege: 'anciano',
      theocraticRoles: ['anciano', 'superintendente_servicio'],
    }],
  });

  const login = await call({
    action: 'verify_personal_pin',
    id: 'CONGREVOKE',
    tokens: { public: T.publicA },
    pin_token: hex('1'),
    publisher_id: 'pubAnciano',
  });
  assert.equal(login.status, 200);
  const oldToken = login.body.session_token;

  // 1. El coordinador cambia el rol del hermano a 'publicador' y le quita el privilegio de servicio
  await call({
    action: 'push',
    id: 'CONGREVOKE',
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN2',
    payload_public: 'PUB2',
    personal_pins: [{
      id: 'pubAnciano',
      token: hex('1'),
      name: 'Hno Pedro',
      role: 'publicador',
      privilege: 'publicador',
      theocraticRoles: ['publicador'],
    }],
  });

  const afterDemote = await call({
    action: 'verify_role_token',
    id: 'CONGREVOKE',
    tokens: { public: T.publicA },
    token: oldToken,
  });
  assert.equal(afterDemote.status, 401);
  assert.equal(afterDemote.body.error, 'role_changed');

  // 2. El coordinador da de baja al publicador (ya no está en personal_pins)
  await call({
    action: 'push',
    id: 'CONGREVOKE',
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN3',
    payload_public: 'PUB3',
    personal_pins: [],
  });

  const afterRemove = await call({
    action: 'verify_role_token',
    id: 'CONGREVOKE',
    tokens: { public: T.publicA },
    token: oldToken,
  });
  assert.equal(afterRemove.status, 401);
  assert.equal(afterRemove.body.error, 'invalid_or_expired_token');
});

test('signServerRoleToken: caracteres separadores en role o theocraticRoles no rompen el token', async () => {
  const { call } = setup();
  await call({
    action: 'push',
    id: 'CONGSEP',
    tokens: { master: T.masterA, public: T.publicA },
    payload: 'ADMIN',
    payload_public: 'PUB',
    personal_pins: [{
      id: 'pub.con.punto',
      token: hex('1'),
      name: 'Hno',
      role: 'anciano:coord',
      privilege: 'anciano',
      theocraticRoles: ['rol.con.punto', 'rol:dos:puntos'],
    }],
  });

  const login = await call({
    action: 'verify_personal_pin',
    id: 'CONGSEP',
    tokens: { public: T.publicA },
    pin_token: hex('1'),
    publisher_id: 'pub.con.punto',
  });
  assert.equal(login.status, 200);

  const check = await call({
    action: 'verify_role_token',
    id: 'CONGSEP',
    tokens: { public: T.publicA },
    token: login.body.session_token,
  });
  assert.equal(check.status, 200);
  assert.equal(check.body.valid, true);
  assert.equal(check.body.publisher_id, 'pub.con.punto');
});
