import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, type SyncDb, type SyncRow } from '../../supabase/functions/kongre-sync/core.ts';
import { syncPull, syncMeta, syncPush, syncDelete, syncVerifyPersonalPin, describeSyncError } from './services/syncApi.ts';
import { encryptForSupabase, decryptFromSupabase } from './utils/crypto.ts';
import {
  generateSecureCongregationPin,
  generateSecureMasterPin,
  formatCongregationPinInput,
} from '../../src/utils/theocraticSecurity.ts';

const rows = new Map<string, SyncRow>();
const rl = new Map<string, { f: number; ws: number; lu: number | null }>();
const db: SyncDb = {
  async getRow(id) { const r = rows.get(id); return r ? { ...r } : null; },
  async insertRow(r) { if (rows.has(r.id_congregacion)) return false; rows.set(r.id_congregacion, { ...r }); return true; },
  async updateRow(id, p) { rows.set(id, { ...rows.get(id)!, ...p }); },
  async updateRowIfVersion(id, p, expected) { const cur = rows.get(id); if (!cur || Date.parse(cur.created_at) !== Date.parse(expected)) return false; rows.set(id, { ...cur, ...p }); return true; },
  async deleteRow(id) { rows.delete(id); },
  async lockedUntil(keys) { let m: number | null = null; for (const k of keys) { const e = rl.get(k); if (e?.lu && e.lu > Date.now()) m = Math.max(m ?? 0, e.lu); } return m; },
  async registerFailure(k, limit, win, lock) { let e = rl.get(k); if (!e || e.ws < Date.now() - win * 1000) e = { f: 0, ws: Date.now(), lu: e?.lu ?? null }; e.f++; rl.set(k, e); if (e.f >= limit) { e.lu = Date.now() + lock * 1000; e.f = 0; e.ws = Date.now(); return e.lu; } return null; },
  async clearFailures(k) { rl.delete(k); },
};
const env = { pepper: 'x'.repeat(48), allowedOrigins: [], legacyClaim: false };
let ip = 10;
(globalThis as any).fetch = async (url: string, init: any) => {
  assert.equal(url, 'https://proj.supabase.co/functions/v1/kongre-sync');
  return handleRequest(new Request(url, { ...init, headers: { ...init.headers, 'cf-connecting-ip': `10.0.0.${ip}` } }), db, env);
};

test('flujo completo cliente real ↔ servidor real', async () => {
  const ID = 'KGR8P2M7X4W';
  const MASTER = 'Coord-9X2K-77', PUB = '8X4W-9M2K';
  const secretAdmin = { publishers: [{ name: 'Hermano Prueba', s21: 'confidencial' }] };
  const secretPublic = { weeks: ['semana 1'] };

  // alta (como RegisterCongregationWizard): el cliente cifra y el servidor solo guarda blobs + verificadores
  const created = await syncPush({
    id: ID, masterPin: MASTER, publicPin: PUB,
    payload: await encryptForSupabase(secretAdmin, MASTER),
    payloadPublic: await encryptForSupabase(secretPublic, PUB),
    personalPins: [
      { id: 'pub-anciano', pin: '4321', name: 'Hermano Anciano', role: 'anciano', privilege: 'anciano' },
    ],
  });
  assert.ok(created.ok && created.created);
  const stored = rows.get(ID)!;
  assert.ok(!JSON.stringify(stored).includes('Coord') && !JSON.stringify(stored).includes('8X4W'), 'el PIN nunca llega al servidor');
  assert.match(stored.master_verifier!, /^[a-f0-9]{64}$/);
  assert.ok(Array.isArray(stored.personal_verifiers) && stored.personal_verifiers.length === 1);
  assert.notEqual(stored.personal_verifiers[0].verifier, '4321', 'el PIN personal no se almacena en claro');

  // verificación segura de PIN personal en Edge Function (requiere publisherId)
  const vOk = await syncVerifyPersonalPin(ID, PUB, '4321', 'pub-anciano');
  assert.ok(vOk.ok && vOk.publisher.id === 'pub-anciano' && vOk.publisher.role === 'anciano');
  const vFail = await syncVerifyPersonalPin(ID, PUB, '9999', 'pub-anciano');
  assert.equal(vFail.ok, false);
  const vMissingPub = await syncVerifyPersonalPin(ID, PUB, '4321', '');
  assert.equal(vMissingPub.ok, false);

  // lectura con PIN maestro: ve ambos y descifra
  const m = await syncPull(ID, MASTER);
  assert.ok(m.ok && m.tier === 'master' && m.payload);
  assert.deepEqual(await decryptFromSupabase(m.payload!, MASTER), secretAdmin);

  // lectura con PIN de congregación (el formato XXXX-XXXX se normaliza igual con o sin guion/minúsculas)
  for (const pin of [PUB, '8x4w9m2k']) {
    const p = await syncPull(ID, pin);
    assert.ok(p.ok && p.tier === 'public' && p.payload === null, 'el nivel público no recibe el payload maestro');
    assert.deepEqual(await decryptFromSupabase(p.payload_public!, PUB), secretPublic);
  }

  // PIN equivocado -> 401 con mensaje en español
  ip++;
  const bad = await syncPull(ID, '0000-0000');
  assert.ok(!bad.ok && bad.status === 401);
  assert.equal(describeSyncError(bad as any), 'El ID de congregación o el PIN no son correctos.');

  // un publicador (PIN de congregación) intenta escribir: RECHAZADO (403) para proteger payload_public contra manipulación
  const hack = await syncPush({ id: ID, masterPin: PUB, publicPin: PUB, payload: 'HACK', payloadPublic: await encryptForSupabase({ weeks: ['x'] }, PUB) });
  assert.equal(hack.ok, false);
  assert.equal(hack.status, 403);
  assert.deepEqual(await decryptFromSupabase(rows.get(ID)!.payload!, MASTER), secretAdmin, 'payload maestro intacto');
  assert.deepEqual(await decryptFromSupabase(rows.get(ID)!.payload_public!, PUB), secretPublic, 'payload público intacto');

  // meta y borrado
  assert.ok((await syncMeta(ID, PUB)).ok);
  ip++;
  const delPub = await syncDelete(ID, PUB);
  assert.ok(!delPub.ok && delPub.status === 401, 'el PIN de congregación no puede borrar (su token maestro no coincide)');
  assert.ok(rows.has(ID));

  // rotación del PIN maestro (con PIN anterior para autenticar)
  const NEW = 'NuevoCoord-5588';
  const rot = await syncPush({ id: ID, masterPin: MASTER, publicPin: PUB, payload: await encryptForSupabase(secretAdmin, NEW),
    payloadPublic: rows.get(ID)!.payload_public!, rotateTo: { masterPin: NEW } });
  assert.ok(rot.ok);
  ip++;
  assert.ok(!(await syncPull(ID, MASTER)).ok, 'el PIN maestro anterior deja de funcionar');
  const after = await syncPull(ID, NEW);
  assert.ok(after.ok && after.tier === 'master');

  assert.ok((await syncDelete(ID, NEW)).ok);
  assert.ok(!rows.has(ID));
});

test('rotación de PIN de congregación y rotación simultánea de ambos PINs', async () => {
  const ID = 'KGR99ROTATEX';
  const MASTER_INIT = generateSecureMasterPin();
  const PUB_INIT = generateSecureCongregationPin();
  const secretAdmin = { sensitive: 'ancianos_data_top_secret', version: 1 };
  const secretPublic = { notice: 'reunion_anual_2026', version: 1 };

  // 1. Alta inicial
  const created = await syncPush({
    id: ID,
    masterPin: MASTER_INIT,
    publicPin: PUB_INIT,
    payload: await encryptForSupabase(secretAdmin, MASTER_INIT),
    payloadPublic: await encryptForSupabase(secretPublic, PUB_INIT),
  });
  assert.ok(created.ok && created.created);

  // 2. Rotación del PIN de congregación únicamente
  // Se genera un nuevo PIN y se formatea
  const rawNewPub = generateSecureCongregationPin();
  const formattedNewPub = formatCongregationPinInput(rawNewPub);
  assert.match(formattedNewPub, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  const updatedSecretPublic = { notice: 'reunion_actualizada', version: 2 };
  ip++;
  const rotPub = await syncPush({
    id: ID,
    masterPin: MASTER_INIT,
    publicPin: PUB_INIT,
    payload: await encryptForSupabase(secretAdmin, MASTER_INIT),
    payloadPublic: await encryptForSupabase(updatedSecretPublic, formattedNewPub),
    rotateTo: { publicPin: formattedNewPub },
  });
  assert.ok(rotPub.ok, 'rotación de PIN público exitosa');

  // El PIN de congregación viejo deja de funcionar de inmediato
  ip++;
  const pullOldPub = await syncPull(ID, PUB_INIT);
  assert.equal(pullOldPub.ok, false);
  assert.equal(pullOldPub.status, 401, 'viejo PIN de congregación revocado');

  // El nuevo PIN de congregación funciona y descifra el payload público
  ip++;
  const pullNewPub = await syncPull(ID, formattedNewPub);
  assert.ok(pullNewPub.ok && pullNewPub.tier === 'public');
  assert.deepEqual(await decryptFromSupabase(pullNewPub.payload_public!, formattedNewPub), updatedSecretPublic);

  // El PIN maestro previo sigue intacto y funcionando
  ip++;
  const pullMasterStillOk = await syncPull(ID, MASTER_INIT);
  assert.ok(pullMasterStillOk.ok && pullMasterStillOk.tier === 'master');
  assert.deepEqual(await decryptFromSupabase(pullMasterStillOk.payload!, MASTER_INIT), secretAdmin);

  // 3. Rotación simultánea de ambos PINs (Maestro + Congregación)
  const DUAL_NEW_MASTER = generateSecureMasterPin();
  const DUAL_NEW_PUB = generateSecureCongregationPin();
  const dualSecretAdmin = { sensitive: 'nuevo_payload_ancianos', rotated: true };
  const dualSecretPublic = { notice: 'nuevo_payload_publico', rotated: true };

  ip++;
  const rotBoth = await syncPush({
    id: ID,
    masterPin: MASTER_INIT,
    publicPin: formattedNewPub,
    payload: await encryptForSupabase(dualSecretAdmin, DUAL_NEW_MASTER),
    payloadPublic: await encryptForSupabase(dualSecretPublic, DUAL_NEW_PUB),
    rotateTo: { masterPin: DUAL_NEW_MASTER, publicPin: DUAL_NEW_PUB },
  });
  assert.ok(rotBoth.ok, 'rotación dual exitosa');

  // Ambas credenciales anteriores quedan invalidadas
  ip++;
  assert.equal((await syncPull(ID, MASTER_INIT)).ok, false, 'viejo maestro revocado');
  assert.equal((await syncPull(ID, formattedNewPub)).ok, false, 'viejo público revocado');

  // Ambas credenciales nuevas funcionan
  ip++;
  const pullBothMaster = await syncPull(ID, DUAL_NEW_MASTER);
  assert.ok(pullBothMaster.ok && pullBothMaster.tier === 'master');
  assert.deepEqual(await decryptFromSupabase(pullBothMaster.payload!, DUAL_NEW_MASTER), dualSecretAdmin);

  const pullBothPublic = await syncPull(ID, DUAL_NEW_PUB);
  assert.ok(pullBothPublic.ok && pullBothPublic.tier === 'public');
  assert.deepEqual(await decryptFromSupabase(pullBothPublic.payload_public!, DUAL_NEW_PUB), dualSecretPublic);

  // Borrado con el nuevo PIN maestro
  ip++;
  assert.ok((await syncDelete(ID, DUAL_NEW_MASTER)).ok);
  assert.ok(!rows.has(ID));
});

