// src/utils/sampleData.ts
import {
  Publisher,
  PreachingGroup,
  CustomDuty,
  CongregationSettings,
  WeekSchedule,
  FieldServiceMeeting,
  OutgoingSpeakerAssignment,
  CartLocation,
  CartShift,
  MonthlyServiceReport,
  CongregationNotice,
  Territory,
  CircuitOverseerVisit,
  AccountTransaction,
  QuarterlyAudit,
  MemorialPlan,
  TheocraticAssembly,
  LiteratureItem,
  LiteratureSpecialOrder,
  LiteratureGroupDistribution,
  LiteratureInventoryRecord,
} from '../types';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek } from './organizedSync';

// Clean initial settings for a brand new congregation
export const INITIAL_SETTINGS: CongregationSettings = {
  congregationName: '',
  congregationNumber: '',
  congregationId: '',
  customCode: '',
  isCustomId: false,
  circuitNumber: '',
  language: 'Español',
  country: '',
  city: '',
  coordinatorName: '',
  coordinatorEmail: '',
  coordinatorPhone: '',
  isRegistered: false,
  midweekMeetingDay: 'Miércoles',
  midweekMeetingTime: '19:00',
  weekendMeetingDay: 'Domingo',
  weekendMeetingTime: '10:00',
  hallAddress: '',
  conflictRules: {
    allowPartAndDutySameMeeting: false,
    allowAudioAndMicrophones: false,
    allowPresidentAndOtherPart: false,
    maxConsecutiveWeeksWithDuty: 2,
    maxConsecutiveWeeksWithPart: 2,
    enforceSisterDemonstrationRules: true,
    warnOutlineRepeatedWithinMonths: 12,
  },
  pdfTemplate: 'color',
  pdfPageSize: 'letter',
  pdfSections: {
    midweek: true,
    weekend: true,
    duties: true,
    cleaning: true,
  },
};

// Standard duties for kingdom hall meetings (with no pre-assigned publishers)
export const INITIAL_CUSTOM_DUTIES: CustomDuty[] = [
  { id: 'duty-audio', key: 'deber_audio', name: 'Audio / Sonido', description: 'Control de sonido y cabina en la reunión', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-video', key: 'deber_video', name: 'Video / Multimedia', description: 'Transmisión de videos y pantallas del auditorio', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-mics', key: 'deber_microfonos', name: 'Micrófonos', description: 'Pase de micrófonos en el auditorio', midweek: true, weekend: true, maxPeople: 2 },
  { id: 'duty-plat', key: 'deber_plataforma', name: 'Plataforma', description: 'Ajuste de atriles, micrófonos y escenario', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-acom', key: 'deber_acomodador', name: 'Acomodador Auditorio / Puerta', description: 'Bienvenida, acomodación y conteo de asistencia', midweek: true, weekend: true, maxPeople: 2 },
  { id: 'duty-seg', key: 'deber_seguridad', name: 'Seguridad / Estacionamiento', description: 'Vigilancia exterior y estacionamiento', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-zoom', key: 'deber_zoom', name: 'Anfitrión de Zoom', description: 'Gestión de participantes conectados por videoconferencia', midweek: true, weekend: true, maxPeople: 1 },
];

// All clean empty initial collections for a fresh congregation setup
export const INITIAL_PUBLISHERS: Publisher[] = [];
export const INITIAL_PREACHING_GROUPS: PreachingGroup[] = [];
export const INITIAL_FIELD_SERVICE_MEETINGS: FieldServiceMeeting[] = [];
export const INITIAL_OUTGOING_SPEAKERS: OutgoingSpeakerAssignment[] = [];
export const INITIAL_CART_LOCATIONS: CartLocation[] = [];
export const INITIAL_CART_SHIFTS: CartShift[] = [];
export const INITIAL_NOTICES: CongregationNotice[] = [];
export const INITIAL_MONTHLY_REPORTS: MonthlyServiceReport[] = [];
export const INITIAL_TERRITORIES: Territory[] = [];
export const INITIAL_CIRCUIT_VISIT: CircuitOverseerVisit | null = null;
export const INITIAL_TRANSACTIONS: AccountTransaction[] = [];
export const INITIAL_QUARTERLY_AUDITS: QuarterlyAudit[] = [];
export const INITIAL_MEMORIAL_PLANS: MemorialPlan[] = [];
export const INITIAL_ASSEMBLIES: TheocraticAssembly[] = [];
export const INITIAL_LITERATURE_ITEMS: LiteratureItem[] = [];
export const INITIAL_SPECIAL_ORDERS: LiteratureSpecialOrder[] = [];
export const INITIAL_GROUP_DISTRIBUTIONS: LiteratureGroupDistribution[] = [];
export const INITIAL_LITERATURE_INVENTORY_RECORDS: LiteratureInventoryRecord[] = [];

// Helper to format Date to YYYY-MM-DD
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate Monday of a given week offset from today
export function getMondayOfOffsetWeek(offsetWeeks: number = 0): Date {
  const d = new Date();
  const day = d.getDay();
  // In JS, 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (offsetWeeks * 7);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function createEmptyWeek(mondayDate: Date, index: number = 0): WeekSchedule {
  const mondayISO = formatDateISO(mondayDate);
  const sunday = new Date(mondayDate);
  sunday.setDate(sunday.getDate() + 6);
  const sundayISO = formatDateISO(sunday);

  const midweekDate = new Date(mondayDate);
  midweekDate.setDate(midweekDate.getDate() + 2); // Wednesday
  const weekendDate = new Date(mondayDate);
  weekendDate.setDate(weekendDate.getDate() + 6); // Sunday

  const weekId = `week-${mondayISO}`;
  const emptyWeek: WeekSchedule = {
    id: weekId,
    weekStartDate: mondayISO,
    weekEndDate: sundayISO,
    cleaningGroupNumbers: [(index % 4) + 1],
    midweek: {
      date: formatDateISO(midweekDate),
      presidentId: '',
      initialPrayerId: '',
      finalPrayerId: '',
      tesoros: {
        discurso: {
          id: `tes-disc-${mondayISO}`,
          title: 'Discurso de Tesoros de la Biblia (10 mins)',
          type: 'vym_tesoros_discurso',
          timeMinutes: 10,
          status: 'pendiente',
        },
        perlas: {
          id: `tes-perl-${mondayISO}`,
          title: 'Busquemos perlas escondidas (10 mins)',
          type: 'vym_tesoros_perlas',
          timeMinutes: 10,
          status: 'pendiente',
        },
        lecturaBiblia: {
          id: `tes-lect-${mondayISO}`,
          title: 'Lectura de la Biblia (4 mins)',
          type: 'vym_tesoros_lectura',
          timeMinutes: 4,
          room: 'principal',
          status: 'pendiente',
        },
        lecturaBibliaAux: {
          id: `tes-lect-aux-${mondayISO}`,
          title: 'Lectura de la Biblia - Sala Auxiliar (4 mins)',
          type: 'vym_tesoros_lectura',
          timeMinutes: 4,
          room: 'auxiliar',
          status: 'pendiente',
        },
      },
      maestros: {
        items: [
          {
            id: `maes-1-${mondayISO}`,
            title: 'Empiece conversaciones (3 mins)',
            type: 'vym_maestros_titular',
            timeMinutes: 3,
            room: 'principal',
            status: 'pendiente',
          },
          {
            id: `maes-2-${mondayISO}`,
            title: 'Haga revisitas (4 mins)',
            type: 'vym_maestros_titular',
            timeMinutes: 4,
            room: 'principal',
            status: 'pendiente',
          },
          {
            id: `maes-3-${mondayISO}`,
            title: 'Haga discípulos (5 mins)',
            type: 'vym_maestros_titular',
            timeMinutes: 5,
            room: 'principal',
            status: 'pendiente',
          },
        ],
      },
      vidaCristiana: {
        items: [
          {
            id: `vida-1-${mondayISO}`,
            title: 'Nuestra Vida Cristiana - Parte local (15 mins)',
            type: 'vym_vida_partes',
            timeMinutes: 15,
            status: 'pendiente',
          },
        ],
        estudioBiblico: {
          conductorId: '',
          lectorId: '',
        },
      },
      duties: {
        deber_audio: [],
        deber_video: [],
        deber_microfonos: [],
        deber_plataforma: [],
        deber_acomodador: [],
        deber_seguridad: [],
        deber_zoom: [],
      },
    },
    weekend: {
      date: formatDateISO(weekendDate),
      presidentId: '',
      publicTalkSpeaker: '',
      publicTalkTheme: 'Discurso Público',
      atalayaConductorId: '',
      atalayaLectorId: '',
      initialPrayerId: '',
      finalPrayerId: '',
      duties: {
        deber_audio: [],
        deber_video: [],
        deber_microfonos: [],
        deber_plataforma: [],
        deber_acomodador: [],
        deber_seguridad: [],
        deber_zoom: [],
      },
    },
  };

  // Synchronize scheduled theocratic program outlines if available
  const orgSchedule = getOrganizedScheduleForWeek(weekId, mondayISO);
  if (orgSchedule) {
    return applyOrganizedToWeek(emptyWeek, orgSchedule);
  }

  return emptyWeek;
}

// Generate 4 clean upcoming weeks with empty assignments
export function generateInitialWeeks(): WeekSchedule[] {
  const weeks: WeekSchedule[] = [];
  for (let i = 0; i < 4; i++) {
    const monday = getMondayOfOffsetWeek(i);
    const week = createEmptyWeek(monday, i);
    weeks.push(week);
  }
  return weeks;
}
