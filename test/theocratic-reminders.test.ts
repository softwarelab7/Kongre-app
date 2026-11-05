import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTheocraticReminders,
  getCleanPublisherPhone,
  createReportReminderWhatsAppMessage,
  createCartShiftInviteWhatsAppMessage,
} from '../src/utils/theocraticReminders.ts';
import type {
  Publisher,
  WeekSchedule,
  CartShift,
  CartLocation,
  MonthlyServiceReport,
  AccountTransaction,
} from '../src/types.ts';

test('theocraticReminders: detecta asignaciones no confirmadas y marca urgencia < 48h', () => {
  const mockPub: Publisher = {
    id: 'pub-reminder-1',
    name: 'Hno Juan Pérez',
    phone: '+52 55 1234 5678',
    theocraticRole: 'publisher',
    active: true,
  };

  const meetingDate = '2026-11-05'; // Jueves
  const mockWeek: WeekSchedule = {
    id: 'week-2026-11-02',
    weekStartDate: '2026-11-02',
    weekEndDate: '2026-11-08',
    midweek: {
      date: meetingDate,
      tesoros: {
        discurso: {
          publisherId: 'pub-reminder-1',
          title: 'Tesoros de la Biblia',
          status: 'pendiente', // Asignación sin confirmar
        },
        perlas: { publisherId: '', status: 'pendiente' },
        lecturaBiblia: { publisherId: '', status: 'pendiente' },
      },
      maestros: { items: [] },
      vidaCristiana: { items: [] },
      duties: {},
    },
    weekend: {
      date: '2026-11-08',
      duties: {},
    },
  };

  // Simular fecha de referencia: Miércoles 4 de Noviembre (menos de 48h de la reunión del 5 de Noviembre)
  const refDate = new Date('2026-11-04T12:00:00');

  const summary = computeTheocraticReminders({
    weeks: [mockWeek],
    currentWeekId: 'week-2026-11-02',
    publishers: [mockPub],
    referenceDate: refDate,
  });

  assert.equal(summary.unconfirmedAssignments.length, 1);
  const item = summary.unconfirmedAssignments[0];
  assert.equal(item.publisherName, 'Hno Juan Pérez');
  assert.equal(item.status, 'pendiente');
  assert.equal(item.isUrgent, true, 'Debe marcarse urgente porque la reunión es en menos de 48 horas');
  assert.ok(item.whatsappMessage.includes('Recordatorio de Asignación'));
  assert.ok(item.whatsappMessage.includes('Hno Juan Pérez'));
});

test('theocraticReminders: detecta turnos de carritos con vacantes (crítico vs advertencia)', () => {
  const locations: CartLocation[] = [
    { id: 'loc-1', name: 'Parque Central', address: 'Av. Principal', active: true },
  ];

  const shifts: CartShift[] = [
    {
      id: 'shift-empty',
      locationId: 'loc-1',
      dayOfWeek: 'Sábado',
      startTime: '09:00',
      endTime: '11:00',
      // Sin publicadores = 2 vacantes (crítico)
    },
    {
      id: 'shift-half',
      locationId: 'loc-1',
      dayOfWeek: 'Domingo',
      startTime: '10:00',
      endTime: '12:00',
      publisher1Id: 'pub-1', // Solo 1 asignado = 1 vacante
    },
  ];

  const summary = computeTheocraticReminders({
    weeks: [],
    publishers: [{ id: 'pub-1', name: 'Hna Maria', active: true }],
    cartShifts: shifts,
    cartLocations: locations,
  });

  assert.equal(summary.uncoveredCartShifts.length, 2);
  const emptyShift = summary.uncoveredCartShifts.find((s) => s.shiftId === 'shift-empty');
  assert.ok(emptyShift);
  assert.equal(emptyShift.vacanciesCount, 2);
  assert.equal(emptyShift.isCritical, true);

  const halfShift = summary.uncoveredCartShifts.find((s) => s.shiftId === 'shift-half');
  assert.ok(halfShift);
  assert.equal(halfShift.vacanciesCount, 1);
  assert.equal(halfShift.isCritical, false);
});

test('theocraticReminders: genera recordatorio de informes mensuales en ventana de cierre de mes', () => {
  const pub1: Publisher = { id: 'pub-active-1', name: 'Pedro Morales', active: true };
  const pub2: Publisher = { id: 'pub-active-2', name: 'Luisa Fernández', active: true };

  // El 4 de Noviembre de 2026 está en la ventana del día 1-12, por lo que se debe recolectar el informe de Octubre (2026-10)
  const refDate = new Date('2026-11-04T10:00:00');

  // Solo Pedro ya entregó su informe de Octubre
  const reports: MonthlyServiceReport[] = [
    {
      id: 'rep-1',
      publisherId: 'pub-active-1',
      month: '2026-10',
      participated: true,
      bibleStudies: 1,
    },
  ];

  const summary = computeTheocraticReminders({
    weeks: [],
    publishers: [pub1, pub2],
    monthlyReports: reports,
    referenceDate: refDate,
  });

  assert.equal(summary.pendingReports.length, 1);
  assert.equal(summary.pendingReports[0].publisherName, 'Luisa Fernández');
  assert.equal(summary.pendingReports[0].reportMonth, '2026-10');
  assert.ok(summary.pendingReports[0].whatsappMessage.includes('Octubre 2026'));
});

test('theocraticReminders: limpia números de teléfono con o sin prefijo de seguridad', () => {
  assert.equal(getCleanPublisherPhone('+52 (55) 1234-5678'), '525512345678');
  assert.equal(getCleanPublisherPhone(''), '');
  assert.equal(getCleanPublisherPhone(null), '');
});

test('theocraticReminders: formatea mensajes amistosos de invitación a carritos', () => {
  const pub: Publisher = { id: 'p1', name: 'Carlos Santos', gender: 'hermano', active: true };
  const msg = createCartShiftInviteWhatsAppMessage(pub, {
    locationName: 'Estación Metro',
    dayOfWeek: 'Viernes',
    timeSlot: '16:00 - 18:00',
  });
  assert.ok(msg.includes('Carlos Santos'));
  assert.ok(msg.includes('Estación Metro'));
  assert.ok(msg.includes('16:00 - 18:00'));
});
