// test/territories-s13.test.ts
// Mock DOM environment for Leaflet when running in Node/Bun tests
if (!('window' in globalThis)) {
  Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true, writable: true });
}
(globalThis as any).window.devicePixelRatio = 1;
(globalThis as any).window.screen = { deviceXDPI: 1, logicalXDPI: 1 };

if (!('document' in globalThis)) {
  Object.defineProperty(globalThis, 'document', {
    value: {
      documentElement: { style: {} },
      createElement: () => ({ style: {} }),
      getElementsByTagName: () => [],
    },
    configurable: true,
    writable: true,
  });
}

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Node',
      platform: 'Linux x86_64',
    },
    configurable: true,
    writable: true,
  });
} catch {
  // If navigator cannot be redefined, mutate existing properties
  try {
    (globalThis.navigator as any).platform = 'Linux x86_64';
  } catch {}
}

import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  isPointInPolygon,
  getDistanceToPolygonMeters,
  evaluateTerritoryGeoFence,
  exportTerritoriesToGeoJSON,
} = await import('../src/components/territories/TerritoryMapUtils');

import {
  evaluateTerritoryS13Radar,
  buildOverdueTerritoryWhatsAppReminder,
} from '../src/utils/khsPublicWitnessingEngine';
import { Territory, Publisher } from '../src/types';

// Cuadrilátero de prueba centrado en Bogotá (~4.6097, -74.0817)
const samplePolygon: [number, number][] = [
  [4.6100, -74.0850],
  [4.6150, -74.0850],
  [4.6150, -74.0800],
  [4.6100, -74.0800],
];

test('territorios: geocerca isPointInPolygon detecta puntos interiores y exteriores', () => {
  // Centro del polígono
  const insidePoint: [number, number] = [4.6125, -74.0825];
  assert.equal(isPointInPolygon(insidePoint, samplePolygon), true);

  // Punto claramente al norte fuera del polígono
  const outsidePoint: [number, number] = [4.6200, -74.0825];
  assert.equal(isPointInPolygon(outsidePoint, samplePolygon), false);

  // Polígono degenerado o vacío
  assert.equal(isPointInPolygon(insidePoint, []), false);
});

test('territorios: getDistanceToPolygonMeters y evaluateTerritoryGeoFence proporcionan feedback de proximidad', () => {
  const insidePoint: [number, number] = [4.6125, -74.0825];
  const evalInside = evaluateTerritoryGeoFence(insidePoint, samplePolygon, '05');
  assert.equal(evalInside.isInside, true);
  assert.ok(evalInside.label.includes('Dentro del Territorio #05'));

  // Punto exterior a ~300 metros
  const outsidePoint: [number, number] = [4.6180, -74.0825];
  const distance = getDistanceToPolygonMeters(outsidePoint, samplePolygon);
  assert.ok(distance > 100);

  const evalOutside = evaluateTerritoryGeoFence(outsidePoint, samplePolygon, '05');
  assert.equal(evalOutside.isInside, false);
  assert.ok(evalOutside.label.includes('Fuera del Territorio'));
});

test('territorios: radar S-13 clasifica correctamente vencidos (>4m), por vencer y desatendidos (>1 año)', () => {
  const today = new Date();

  const pastDate = new Date();
  pastDate.setMonth(today.getMonth() - 5); // 5 meses atrás (vencido)

  const expiringDate = new Date();
  expiringDate.setDate(today.getDate() + 7); // en 7 días (por vencer)

  const futureDate = new Date();
  futureDate.setMonth(today.getMonth() + 3); // en 3 meses (vigente)

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  const mockTerritories: Territory[] = [
    {
      id: 't-1',
      number: '01',
      name: 'Centro Histórico',
      type: 'residencial',
      zone: 'Centro',
      estimatedHomes: 100,
      status: 'asignado',
      dueDate: pastDate.toISOString().slice(0, 10),
      lastCompletedDate: pastDate.toISOString().slice(0, 10),
      noVisits: [],
      history: [],
    },
    {
      id: 't-2',
      number: '02',
      name: 'Barrio Obrero',
      type: 'residencial',
      zone: 'Norte',
      estimatedHomes: 80,
      status: 'asignado',
      dueDate: expiringDate.toISOString().slice(0, 10),
      lastCompletedDate: pastDate.toISOString().slice(0, 10),
      noVisits: [],
      history: [],
    },
    {
      id: 't-3',
      number: '03',
      name: 'Sector Campiña',
      type: 'residencial',
      zone: 'Sur',
      estimatedHomes: 120,
      status: 'disponible',
      lastCompletedDate: twoYearsAgo.toISOString().slice(0, 10), // > 1 año desatendido
      noVisits: [],
      history: [],
    },
    {
      id: 't-4',
      number: '04',
      name: 'Altamira',
      type: 'residencial',
      zone: 'Este',
      estimatedHomes: 90,
      status: 'asignado',
      dueDate: futureDate.toISOString().slice(0, 10),
      lastCompletedDate: today.toISOString().slice(0, 10),
      noVisits: [],
      history: [],
    },
  ];

  const radar = evaluateTerritoryS13Radar(mockTerritories);

  assert.equal(radar.overdue.some((t) => t.id === 't-1'), true);
  assert.equal(radar.expiringSoon.some((t) => t.id === 't-2'), true);
  assert.equal(radar.unworkedOverYear.some((t) => t.id === 't-3'), true);
  assert.equal(radar.overdue.some((t) => t.id === 't-4'), false);
});

test('territorios: recordatorio WhatsApp S-13 genera mensaje respetuoso sin menciones indebidas', () => {
  const mockTerritory: Territory = {
    id: 't-1',
    number: '14',
    name: 'Residencial Los Álamos',
    type: 'residencial',
    zone: 'Zona Norte',
    estimatedHomes: 110,
    status: 'asignado',
    assignedDate: '2026-06-01',
    dueDate: '2026-10-01',
    noVisits: [],
    history: [],
  };

  const mockPublisher: Publisher = {
    id: 'pub-1',
    name: 'Carlos Ruiz',
    gender: 'hermano',
    phone: '3001234567',
    active: true,
  };

  const reminder = buildOverdueTerritoryWhatsAppReminder(mockTerritory, mockPublisher, 'Betel Norte');

  assert.ok(reminder.includes('Carlos Ruiz'));
  assert.ok(reminder.includes('Territorio #14'));
  assert.ok(reminder.includes('Residencial Los Álamos'));
  assert.ok(reminder.includes('Betel Norte'));
  assert.ok(reminder.includes('S-13'));
  // Verificación de marca cerrada: nunca Organized
  assert.equal(reminder.toLowerCase().includes('organized'), false);
});

test('territorios: exportación GeoJSON genera FeatureCollection estándar válido', () => {
  const mockTerritories: Territory[] = [
    {
      id: 't-1',
      number: '01',
      name: 'Sector A',
      type: 'residencial',
      zone: 'Centro',
      estimatedHomes: 60,
      status: 'disponible',
      polygon: samplePolygon,
      noVisits: [],
      history: [],
    },
  ];

  const geoJson = exportTerritoriesToGeoJSON(mockTerritories);
  assert.equal(geoJson.type, 'FeatureCollection');
  assert.equal(geoJson.features.length, 1);
  assert.equal(geoJson.features[0].geometry.type, 'Polygon');
  assert.equal(geoJson.features[0].properties.number, '01');
});
