import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  packageDepartmentCompartment,
  unpackageDepartmentCompartment,
  packagePersonalCompartment,
  unpackagePersonalCompartment,
} from '../src/utils/theocraticSecurity.ts';

test('compartimento departamental: anciano (PIN maestro) puede empaquetar y desempaquetar', async () => {
  const accountsData = {
    transactions: [
      { id: 'tx-1', date: '2026-10-01', amount: 150000, type: 'ingreso', concept: 'Donaciones caja' },
      { id: 'tx-2', date: '2026-10-05', amount: 45000, type: 'gasto', concept: 'Servicios salón' },
    ],
    audits: [{ id: 'aud-1', period: '2026-Q3', auditor: 'Hno. Martínez', status: 'conforme' }],
  };

  const masterPin = '9876-5432-1098';

  const envelope = await packageDepartmentCompartment({
    data: accountsData,
    masterPin,
    authorizedPublishers: [
      { publisherId: 'pub_servant_accounts', personalPin: '123456' },
    ],
  });

  assert.equal(envelope.version, 'kgr_dept_v1');
  assert.equal(envelope.algorithm, 'AES-GCM-256');
  assert.ok(envelope.ciphertext.length > 20);
  assert.ok(envelope.wrappedKeys.master.wrappedKey);
  assert.ok(envelope.wrappedKeys.publishers['pub_servant_accounts']);

  // Desempaquetado con PIN Maestro
  const decrypted = await unpackageDepartmentCompartment<typeof accountsData>(envelope, {
    masterPin,
  });

  assert.deepEqual(decrypted, accountsData);
});

test('compartimento departamental: siervo ministerial autorizado abre con su PIN personal', async () => {
  const territoryData = {
    detailedTerritories: [
      { id: 'terr-04', name: 'Barrio Central', blocks: ['Mz 1', 'Mz 2'], notes: 'Perro bravo en casa 14' },
    ],
  };

  const masterPin = '1122-3344-5566';
  const servantId = 'pub_servant_terr';
  const servantPin = '789012';

  const envelope = await packageDepartmentCompartment({
    data: territoryData,
    masterPin,
    authorizedPublishers: [
      { publisherId: servantId, personalPin: servantPin },
    ],
  });

  // El siervo desempaqueta usando SOLO su publisherId y su PIN personal (sin conocer el PIN maestro)
  const decrypted = await unpackageDepartmentCompartment<typeof territoryData>(envelope, {
    publisherId: servantId,
    personalPin: servantPin,
  });

  assert.deepEqual(decrypted, territoryData);
});

test('compartimento departamental: publicador no autorizado es rechazado', async () => {
  const confidentialData = { secret: 'auditoria_confidencial' };

  const envelope = await packageDepartmentCompartment({
    data: confidentialData,
    masterPin: '1234-5678-9012',
    authorizedPublishers: [
      { publisherId: 'pub_autorizado', personalPin: '654321' },
    ],
  });

  // Intento de publicador no incluido en la lista autorizada
  await assert.rejects(
    async () => {
      await unpackageDepartmentCompartment(envelope, {
        publisherId: 'pub_espia_o_general',
        personalPin: '654321',
      });
    },
    /Acceso no autorizado/
  );
});

test('compartimento departamental: PIN personal incorrecto falla autenticación AES-GCM', async () => {
  const envelope = await packageDepartmentCompartment({
    data: { data: 123 },
    masterPin: '1234-5678-9012',
    authorizedPublishers: [
      { publisherId: 'pub_cuentas', personalPin: '111222' },
    ],
  });

  await assert.rejects(
    async () => {
      await unpackageDepartmentCompartment(envelope, {
        publisherId: 'pub_cuentas',
        personalPin: '999999', // PIN equivocado
      });
    },
    /Acceso no autorizado/
  );
});

test('compartimento departamental: alteración de ciphertext (tampering) detectada', async () => {
  const envelope = await packageDepartmentCompartment({
    data: { items: ['Libro A', 'Folleto B'] },
    masterPin: '1234-5678-9012',
  });

  // Mutación en el texto cifrado
  const tampered = {
    ...envelope,
    ciphertext: envelope.ciphertext.slice(0, -4) + 'AAAA',
  };

  await assert.rejects(async () => {
    await unpackageDepartmentCompartment(tampered, { masterPin: '1234-5678-9012' });
  });
});

test('compartimento personal: publicador y anciano pueden abrir informe S-21, pero otro publicador no', async () => {
  const s21Report = {
    publisherId: 'pub_juan_perez',
    monthlyReports: [
      { month: '2026-09', hours: 14, placements: 5, returnVisits: 3, videoShowings: 2 },
      { month: '2026-10', hours: 16, placements: 8, returnVisits: 6, videoShowings: 4 },
    ],
    notes: 'Precursor auxiliar en octubre',
  };

  const masterPin = '9999-8888-7777';
  const ownerPin = '334455';

  const envelope = await packagePersonalCompartment({
    data: s21Report,
    publisherId: 'pub_juan_perez',
    masterPin,
    publisherPersonalPin: ownerPin,
  });

  assert.equal(envelope.version, 'kgr_personal_v1');
  assert.equal(envelope.publisherId, 'pub_juan_perez');

  // 1. El dueño abre su tarjeta con su PIN personal
  const byOwner = await unpackagePersonalCompartment<typeof s21Report>(envelope, {
    personalPin: ownerPin,
  });
  assert.deepEqual(byOwner, s21Report);

  // 2. Un anciano abre la tarjeta con el PIN Maestro para consolidar informe general S-1
  const byElder = await unpackagePersonalCompartment<typeof s21Report>(envelope, {
    masterPin,
  });
  assert.deepEqual(byElder, s21Report);

  // 3. Otro publicador con PIN distinto falla
  await assert.rejects(
    async () => {
      await unpackagePersonalCompartment(envelope, {
        personalPin: '000000',
      });
    },
    /Acceso no autorizado/
  );
});

test('compartimentos con símbolos y caracteres especiales en credenciales', async () => {
  const data = { notes: 'Clave con caracteres @#$%!' };
  const masterPin = 'M@ster#2026!Key';
  const personalPin = 'Símbolo_P@ss99';

  const envelope = await packageDepartmentCompartment({
    data,
    masterPin,
    authorizedPublishers: [
      { publisherId: 'pub_special', personalPin },
    ],
  });

  const resMaster = await unpackageDepartmentCompartment(envelope, { masterPin });
  assert.deepEqual(resMaster, data);

  const resServant = await unpackageDepartmentCompartment(envelope, {
    publisherId: 'pub_special',
    personalPin,
  });
  assert.deepEqual(resServant, data);
});
