// test/p2p-transfer.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTheocraticTransferPackage,
  compressPackageToTransferString,
  decompressTransferStringToPackage,
  mergeTheocraticTransferPackage,
  CongregationTransferContext,
} from '../src/utils/p2pTransferEngine.ts';

const mockPublishers: any[] = [
  {
    id: 'pub-1',
    name: 'Carlos Ruiz',
    publisherCode: 'PUB-01',
    phone: '+52 55 1122 3344',
    address: 'Calle Olivo 12',
    privilege: 'anciano',
  },
  {
    id: 'pub-2',
    name: 'Mateo Fernández',
    publisherCode: 'PUB-02',
    phone: '+52 55 5566 7788',
    address: 'Av. Sol 45',
    privilege: 'siervo_ministerial',
  },
];

const mockWeeks: any[] = [
  {
    id: 'week-2026-11-09',
    weekStartDate: '2026-11-09',
    midweek: {
      date: '2026-11-10',
      presidentId: 'pub-1',
    },
    weekend: {
      date: '2026-11-14',
      presidentId: 'pub-1',
    },
  },
];

const mockReports: any[] = [
  {
    publisherId: 'pub-1',
    month: '2026-10',
    sharedInMinistry: true,
    hours: 15,
    bibleStudies: 2,
  },
];

const mockTerritories: any[] = [
  {
    id: 'terr-1',
    number: 1,
    name: 'Centro Histórico',
    status: 'assigned',
    assignedTo: 'pub-1',
  },
];

const baseContext: CongregationTransferContext = {
  publishers: mockPublishers,
  weeks: mockWeeks,
  monthlyReports: mockReports,
  territories: mockTerritories,
};

test('p2pTransferEngine: empaquetado por rol o tipo de contenido modular', () => {
  // 1. Empaquetar solo programa de reuniones
  const meetingsPkg = buildTheocraticTransferPackage('meetings', baseContext, 'Betel Norte');
  assert.equal(meetingsPkg.format, 'kongre_p2p_v1');
  assert.equal(meetingsPkg.contentType, 'meetings');
  assert.equal(meetingsPkg.payload.weeks.length, 1);
  assert.equal(meetingsPkg.payload.publishers, undefined, 'No debe filtrar publicadores si solo se comparte programa');
  assert.ok(meetingsPkg.integritySeal.startsWith('kgr_seal_v1_'));

  // 2. Empaquetar solo informes de servicio S-4
  const reportsPkg = buildTheocraticTransferPackage('field_service', baseContext, 'Betel Norte');
  assert.equal(reportsPkg.contentType, 'field_service');
  assert.equal(reportsPkg.payload.monthlyReports.length, 1);
  assert.equal(reportsPkg.payload.weeks, undefined);

  // 3. Empaquetar solo territorios S-13
  const terrPkg = buildTheocraticTransferPackage('territories', baseContext, 'Betel Norte');
  assert.equal(terrPkg.contentType, 'territories');
  assert.equal(terrPkg.payload.territories.length, 1);

  // 4. Copia completa
  const fullPkg = buildTheocraticTransferPackage('full', baseContext, 'Betel Norte');
  assert.equal(fullPkg.contentType, 'full');
  assert.ok(fullPkg.payload.publishers.length >= 2);
  assert.equal(fullPkg.payload.weeks.length, 1);
  assert.equal(fullPkg.payload.territories.length, 1);
  assert.equal(fullPkg.payload.monthlyReports.length, 1);
});

test('p2pTransferEngine: compresión y descompresión de datos para Código QR', async () => {
  const pkg = buildTheocraticTransferPackage('meetings', baseContext, 'Betel Norte');
  const qrString = await compressPackageToTransferString(pkg);

  assert.ok(
    qrString.startsWith('kgr_p2p_z:') || qrString.startsWith('kgr_p2p:'),
    'Debe contener prefijo de transferencia Kongre'
  );

  const result = await decompressTransferStringToPackage(qrString);
  assert.ok(result.package !== null, 'Debe descomprimir exitosamente');
  assert.equal(result.package?.format, 'kongre_p2p_v1');
  assert.equal(result.package?.contentType, 'meetings');
  assert.equal(result.package?.payload.weeks[0].id, 'week-2026-11-09');
});

test('p2pTransferEngine: fusión diferencial inteligente sin sobrescribir módulos no relacionados', () => {
  const incomingWeek = {
    id: 'week-2026-11-16',
    weekStartDate: '2026-11-16',
    midweek: { date: '2026-11-17', presidentId: 'pub-2' },
    weekend: { date: '2026-11-21', presidentId: 'pub-2' },
  };

  const incomingPkg = buildTheocraticTransferPackage(
    'meetings',
    {
      ...baseContext,
      weeks: [incomingWeek],
    },
    'Betel Norte'
  );

  const { mergedContext, changesSummary } = mergeTheocraticTransferPackage(
    incomingPkg,
    baseContext,
    'merge'
  );

  // Debe conservar la semana previa (week-2026-11-09) y haber incorporado la nueva (week-2026-11-16)
  assert.equal(mergedContext.weeks.length, 2);
  assert.ok(mergedContext.weeks.some((w) => w.id === 'week-2026-11-09'));
  assert.ok(mergedContext.weeks.some((w) => w.id === 'week-2026-11-16'));

  // Los publicadores y territorios deben permanecer intactos
  assert.equal(mergedContext.publishers.length, 2);
  assert.equal(mergedContext.territories.length, 1);
  assert.ok(changesSummary.length > 0);
});

test('p2pTransferEngine: rechazo de cadenas vacías o formato inválido', async () => {
  const resEmpty = await decompressTransferStringToPackage('');
  assert.equal(resEmpty.package, null);
  assert.ok(resEmpty.error);

  const resInvalid = await decompressTransferStringToPackage('kgr_p2p:randomGarbage');
  assert.equal(resInvalid.package, null);
  assert.ok(resInvalid.error);
});
