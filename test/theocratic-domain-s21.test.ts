import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getServiceYearMonths,
  getCurrentServiceYear,
  getAvailableServiceYears,
  buildS21CardForPublisher,
} from '../src/utils/s21Helper.ts';
import type { Publisher, MonthlyServiceReport } from '../src/types.ts';

test('dominio teocrático S-21: orden y desglose oficial de los 12 meses del año de servicio', () => {
  const serviceYear = '2025-2026';
  const months = getServiceYearMonths(serviceYear);

  assert.equal(months.length, 12, 'El año de servicio debe contener exactamente 12 meses');
  assert.equal(months[0].monthKey, '2025-09', 'El año de servicio debe comenzar en Septiembre del año inicial');
  assert.equal(months[0].monthName, 'Septiembre');
  assert.equal(months[3].monthKey, '2025-12', 'El cuarto mes debe ser Diciembre del año inicial');
  assert.equal(months[4].monthKey, '2026-01', 'El quinto mes debe ser Enero del año final');
  assert.equal(months[11].monthKey, '2026-08', 'El último mes debe ser Agosto del año final');
  assert.equal(months[11].monthName, 'Agosto');
});

test('dominio teocrático S-21: opciones de años de servicio disponibles', () => {
  const current = getCurrentServiceYear();
  assert.match(current, /^\d{4}-\d{4}$/, 'El año de servicio debe tener formato AAAA-AAAA');
  const available = getAvailableServiceYears();
  assert.ok(available.includes(current), 'La lista de años disponibles debe incluir el año actual');
  assert.equal(available.length, 4, 'Debe ofrecer 4 años de servicio para consulta y archivo histórico');
});

test('dominio teocrático S-21: cálculo de tarjeta S-21 para publicador y precursor', () => {
  const mockPublisher: Publisher = {
    id: 'pub-101',
    name: 'Carlos Ruiz',
    theocraticRole: 'publisher',
    theocraticRoles: ['publisher'],
    spiritualStatus: 'active',
    baptismDate: '2015-05-15',
    privilege: 'publisher',
    isAuxiliaryPioneer: false,
    isRegularPioneer: false,
    group: '1',
    active: true,
  };

  const serviceYear = '2025-2026';
  const mockReports: MonthlyServiceReport[] = [
    {
      id: 'rep-1',
      publisherId: 'pub-101',
      month: '2025-09',
      participated: true,
      hours: 12,
      bibleStudies: 2,
      notes: 'Buen mes',
    },
    {
      id: 'rep-2',
      publisherId: 'pub-101',
      month: '2025-10',
      participated: true,
      hours: 15,
      bibleStudies: 2,
      isAuxiliaryPioneer: true,
      notes: 'Precursor auxiliar en campaña',
    },
    {
      id: 'rep-3',
      publisherId: 'pub-101',
      month: '2025-11',
      participated: true,
      hours: 0, // Publicador que participó con casilla sin horas obligatorias
      bibleStudies: 1,
    },
    {
      id: 'rep-4',
      publisherId: 'pub-101',
      month: '2025-12',
      participated: false,
      hours: 0,
      bibleStudies: 0,
      notes: 'Enfermedad',
    },
    // Enero a Agosto quedan sin informe
  ];

  const card = buildS21CardForPublisher(mockPublisher, serviceYear, mockReports);

  assert.equal(card.serviceYear, '2025-2026');
  assert.equal(card.totalMonthsActive, 3, 'Debe contar 3 meses activos (Septiembre, Octubre, Noviembre)');
  assert.equal(card.totalHours, 27, 'Total de horas debe ser 12 + 15 = 27');
  assert.equal(card.totalBibleStudies, 5, 'Total de cursos bíblicos acumulados debe ser 2 + 2 + 1 = 5');
  assert.equal(card.avgHoursPerMonth, 9, 'Promedio de horas: 27 / 3 = 9');
  assert.equal(card.avgStudiesPerMonth, 1.7, 'Promedio de cursos bíblicos: 5 / 3 = 1.7');
  assert.equal(card.auxiliaryPioneerMonthsCount, 1, 'Debe registrar 1 mes de precursor auxiliar (Octubre)');

  // Verificación de meses individuales
  const sep = card.months.find((m) => m.monthKey === '2025-09');
  assert.ok(sep?.hasReport);
  assert.ok(sep?.participated);
  assert.equal(sep?.hours, 12);

  const dec = card.months.find((m) => m.monthKey === '2025-12');
  assert.ok(dec?.hasReport);
  assert.equal(dec?.participated, false);
  assert.equal(dec?.notes, 'Enfermedad');

  const jan = card.months.find((m) => m.monthKey === '2026-01');
  assert.equal(jan?.hasReport, false, 'Enero no debe tener informe registrado aún');
  assert.equal(jan?.participated, false);
});
