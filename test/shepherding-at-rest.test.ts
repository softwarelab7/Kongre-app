import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeShepherdingVisitsForLocalStorage,
  restoreShepherdingVisitsFromLocalStorage,
} from '../src/utils/theocraticSecurity.ts';

const visit = {
  id: 'v1', publisherId: 'p1', scheduledDate: '2026-11-10', elder1Id: 'e1', status: 'scheduled',
  focus: 'duelo', notes: 'Perdió a su esposo; visitar con cuidado', scripturesOrPoints: 'Salmo 147:3',
  createdAt: '2026-11-01T00:00:00.000Z',
};

test('visitas de pastoreo: notas y enfoque se cifran en reposo y no aparecen en claro', () => {
  const stored = sanitizeShepherdingVisitsForLocalStorage([visit]);
  const raw = JSON.stringify(stored);
  assert.ok(!raw.includes('esposo'), 'las notas no deben quedar en texto plano');
  assert.ok(!raw.includes('duelo'), 'el enfoque no debe quedar en texto plano');
  assert.ok(!raw.includes('Salmo 147'), 'los puntos tampoco');
  assert.ok(stored[0].notes.startsWith('kgr_sec'), 'formato cifrado esperado');
  assert.equal(stored[0].publisherId, 'p1', 'los campos no sensibles se conservan');
});

test('visitas de pastoreo: ida y vuelta, idempotencia y compatibilidad con texto plano heredado', () => {
  const once = sanitizeShepherdingVisitsForLocalStorage([visit]);
  const twice = sanitizeShepherdingVisitsForLocalStorage(once);
  assert.deepEqual(restoreShepherdingVisitsFromLocalStorage(twice)[0], visit, 'no debe cifrarse dos veces');
  assert.deepEqual(restoreShepherdingVisitsFromLocalStorage([visit])[0], visit, 'texto plano heredado se acepta tal cual');
  assert.deepEqual(restoreShepherdingVisitsFromLocalStorage(null as any), []);
});
