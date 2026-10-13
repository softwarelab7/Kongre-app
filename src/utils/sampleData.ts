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
  HospitalityHost,
  Breaker,
  MaintenanceSheet,
  AuxPioneerRequest,
  BranchReportS1,
  CongregationEvent,
} from '../types';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek } from './organizedSync';

export const INITIAL_CONGREGATION_EVENTS: CongregationEvent[] = [];

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
  { id: 'duty-audio', key: 'deber_audio', name: 'Audio y Video', description: 'Control de cabina, audio, video y pantallas en la reunión', midweek: true, weekend: true, maxPeople: 2 },
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
export const INITIAL_HOSPITALITY_HOSTS: HospitalityHost[] = [];

export const INITIAL_BREAKERS: Breaker[] = [];

export const SAMPLE_BREAKERS_TEMPLATE: Breaker[] = [
  // Columna Izquierda
  {
    id: 'brk-1',
    name: 'Alumbrado Auditorio Principal',
    descripcion: 'Luminarias LED centrales y perimetrales del auditorio',
    status: 'event',
    icon: 'lightbulb',
    color: 'blue',
    col: 'left',
    order_idx: 0,
    amperage: 20,
  },
  {
    id: 'brk-2',
    name: 'Iluminación Plataforma y Atril',
    descripcion: 'Focos de atril, texto del año y cuadro escénico',
    status: 'event',
    icon: 'sun',
    color: 'amber',
    col: 'left',
    order_idx: 1,
    amperage: 15,
  },
  {
    id: 'brk-3',
    name: 'Sistema de Audio y Cabina',
    descripcion: 'Consola Behringer X32, micrófonos inalámbricos y amplificador',
    status: 'event',
    icon: 'mic',
    color: 'indigo',
    col: 'left',
    order_idx: 2,
    amperage: 20,
  },
  {
    id: 'brk-4',
    name: 'Pantallas y Sistema de Video',
    descripcion: 'Monitores laterales de 75" y monitor de referencia en plataforma',
    status: 'event',
    icon: 'tv',
    color: 'sky',
    col: 'left',
    order_idx: 3,
    amperage: 20,
  },
  {
    id: 'brk-5',
    name: 'Aire Acondicionado 1 (Auditorio Norte)',
    descripcion: 'Inverter 36,000 BTU sector izquierdo del auditorio',
    status: 'event',
    icon: 'fan',
    color: 'teal',
    col: 'left',
    order_idx: 4,
    amperage: 30,
  },
  {
    id: 'brk-6',
    name: 'Aire Acondicionado 2 (Auditorio Sur)',
    descripcion: 'Inverter 36,000 BTU sector derecho del auditorio',
    status: 'event',
    icon: 'fan',
    color: 'teal',
    col: 'left',
    order_idx: 5,
    amperage: 30,
  },
  // Columna Derecha
  {
    id: 'brk-7',
    name: 'Internet, Wi-Fi y Servidor JW Stream',
    descripcion: 'Módem de fibra, switch Gigabit, router y transmisor Zoom',
    status: 'always',
    icon: 'wifi',
    color: 'cyan',
    col: 'right',
    order_idx: 0,
    amperage: 15,
  },
  {
    id: 'brk-8',
    name: 'Cámaras de Seguridad y DVR',
    descripcion: 'CCTV perimetral 8 canales y grabación ininterrumpida',
    status: 'always',
    icon: 'camera',
    color: 'purple',
    col: 'right',
    order_idx: 1,
    amperage: 15,
  },
  {
    id: 'brk-9',
    name: 'Sistema de Alarma y Sensores',
    descripcion: 'Panel DSC, detectores de humo y contacto magnético puertas',
    status: 'always',
    icon: 'bell',
    color: 'rose',
    col: 'right',
    order_idx: 2,
    amperage: 15,
  },
  {
    id: 'brk-10',
    name: 'Reflectores Exteriores y Fachada',
    descripcion: 'Luminarias del parqueo y letrero exterior JW.ORG con fotocelda',
    status: 'on',
    icon: 'sun',
    color: 'orange',
    col: 'right',
    order_idx: 3,
    amperage: 20,
  },
  {
    id: 'brk-11',
    name: 'Bomba de Agua y Presurizador',
    descripcion: 'Bomba hidroneumática sanitaria para baños y aseo',
    status: 'always',
    icon: 'pump',
    color: 'blue',
    col: 'right',
    order_idx: 4,
    amperage: 20,
  },
  {
    id: 'brk-12',
    name: 'Tomacorrientes Mostrador y Archivo',
    descripcion: 'Enchufes para literatura, sala auxiliar y limpieza',
    status: 'on',
    icon: 'outlet',
    color: 'emerald',
    col: 'right',
    order_idx: 5,
    amperage: 15,
  },
];

export const INITIAL_MAINTENANCE_SHEETS: MaintenanceSheet[] = [];

export const SAMPLE_MAINTENANCE_SHEETS_TEMPLATE: MaintenanceSheet[] = [
  {
    id: 'maint-1',
    label: 'Revisión Trimestral de Extintores y Señalización',
    description: 'Inspección de presión de manómetros, precintos, pasadores y señalética de emergencia fotoluminiscente',
    category: 'seguridad',
    frequency: 'trimestral',
    status: 'pendiente',
    isActive: true,
    orderIndex: 0,
    assignedPublisherIds: [],
    estimatedMinutes: 45,
    safetyGear: ['Guantes de trabajo ligero', 'Gafas de seguridad'],
    checklist: [
      { id: 'c1', text: 'Verificar presión en aguja verde de los 4 extintores', completed: false },
      { id: 'c2', text: 'Comprobar precinto plástico y pasador metálico sin alteraciones', completed: false },
      { id: 'c3', text: 'Asegurar que la señalética esté visible y libre de obstrucciones', completed: false },
      { id: 'c4', text: 'Firmar y colocar fecha en las tarjetas de inspección física', completed: false },
    ],
  },
  {
    id: 'maint-2',
    label: 'Mantenimiento Preventivo de Aires Acondicionados',
    description: 'Lavado de filtros antipolvo, revisión de drenajes y limpieza de unidades condensadoras exteriores',
    category: 'climatizacion',
    frequency: 'mensual',
    status: 'pendiente',
    isActive: true,
    orderIndex: 1,
    assignedPublisherIds: [],
    estimatedMinutes: 90,
    safetyGear: ['Mascarilla antipolvo', 'Guantes de nitrilo', 'Escalera certificada'],
    checklist: [
      { id: 'c1', text: 'Retirar y lavar con agua a presión los filtros de nylon', completed: false },
      { id: 'c2', text: 'Desinfectar bandejas y purgar mangueras de condensado', completed: false },
      { id: 'c3', text: 'Comprobar que no existan vibraciones o ruidos anómalos', completed: false },
      { id: 'c4', text: 'Revisar carga de pilas de controles remotos en cabina', completed: false },
    ],
  },
  {
    id: 'maint-3',
    label: 'Inspección de Cubierta, Techo y Canaletas de Agua',
    description: 'Despeje de hojas en canaletas, bajantes de lluvia y sellado de posibles goteras antes de temporada de lluvias',
    category: 'edificacion',
    frequency: 'semestral',
    status: 'pendiente',
    isActive: true,
    orderIndex: 2,
    assignedPublisherIds: [],
    estimatedMinutes: 120,
    safetyGear: ['Arnés de seguridad con línea de vida', 'Calzado antideslizante', 'Casco'],
    checklist: [
      { id: 'c1', text: 'Barrer hojas y tierra acumulada en cumbreras y canaletas', completed: false },
      { id: 'c2', text: 'Comprobar que bajantes fluviales descarguen con flujo libre', completed: false },
      { id: 'c3', text: 'Revisar tornillos y sellos de silicona en traslapes de láminas', completed: false },
      { id: 'c4', text: 'Inspeccionar cielo falso del auditorio por manchas de humedad', completed: false },
    ],
  },
  {
    id: 'maint-4',
    label: 'Prueba Mensual de Alumbrado de Emergencia',
    description: 'Simulación de corte de energía para verificar encendido autónomo y ángulo de cobertura de lámparas autónomas',
    category: 'electricidad',
    frequency: 'mensual',
    status: 'pendiente',
    isActive: true,
    orderIndex: 3,
    assignedPublisherIds: [],
    estimatedMinutes: 30,
    checklist: [
      { id: 'c1', text: 'Desconectar circuito de prueba en el tablero eléctrico', completed: false },
      { id: 'c2', text: 'Verificar encendido simultáneo de las 6 lámparas de emergencia', completed: false },
      { id: 'c3', text: 'Dejar encendidas durante 20 minutos para comprobar batería', completed: false },
      { id: 'c4', text: 'Reconectar breaker y certificar LED verde de carga activa', completed: false },
    ],
  },
  {
    id: 'maint-5',
    label: 'Inspección de Presurizador y Cisterna Sanitaria',
    description: 'Comprobación de ciclos de encendido de la bomba hidroneumática, presión del tanque y calidad de agua',
    category: 'plomeria',
    frequency: 'bimestral',
    status: 'pendiente',
    isActive: true,
    orderIndex: 4,
    assignedPublisherIds: [],
    estimatedMinutes: 40,
    checklist: [
      { id: 'c1', text: 'Comprobar rango de presión del manómetro (20 a 40 PSI)', completed: false },
      { id: 'c2', text: 'Verificar hermeticidad en llaves de corte y fluxómetros de baños', completed: false },
      { id: 'c3', text: 'Inspeccionar flotador de cisterna y ausencia de rebose continuo', completed: false },
    ],
  },
  {
    id: 'maint-6',
    label: 'Poda y Mantenimiento de Jardinería y Parqueo',
    description: 'Corte de césped, poda de ramas que interfieran con alumbrado o cámaras, y retiro de maleza en adoquines',
    category: 'jardineria',
    frequency: 'mensual',
    status: 'pendiente',
    isActive: true,
    orderIndex: 5,
    assignedPublisherIds: [],
    estimatedMinutes: 120,
    safetyGear: ['Gafas de seguridad', 'Protección auditiva', 'Guantes de carnaza'],
    checklist: [
      { id: 'c1', text: 'Cortar pasto y orillar banquetas de acceso al Salón', completed: false },
      { id: 'c2', text: 'Retirar ramas bajas sobre rejas perimetrales', completed: false },
      { id: 'c3', text: 'Barrer y recoger residuos en bolsas para compost o basura', completed: false },
      { id: 'c4', text: 'Inspeccionar que no haya hormigueros cerca de los cimientos', completed: false },
    ],
  },
  {
    id: 'maint-7',
    label: 'Limpieza y Ajuste de Equipos de Cabina y Audio',
    description: 'Desinfección de rejillas de micrófonos, soplado de rack de amplificación y revisión de cables de plataforma',
    category: 'audio_video',
    frequency: 'trimestral',
    status: 'pendiente',
    isActive: true,
    orderIndex: 6,
    assignedPublisherIds: [],
    estimatedMinutes: 60,
    checklist: [
      { id: 'c1', text: 'Desmontar y lavar con solución alcohólica las rejillas metálicas de micrófonos', completed: false },
      { id: 'c2', text: 'Soplar con aire comprimido las rejillas de ventilación del rack', completed: false },
      { id: 'c3', text: 'Probar continuidad y ausencia de ruidos en cables de atril y micrófonos de mano', completed: false },
      { id: 'c4', text: 'Limpiar lentes ópticos de proyector / pantallas LED', completed: false },
    ],
  },
  {
    id: 'maint-8',
    label: 'Lavado y Desinfección de Butacas del Auditorio',
    description: 'Aspirado a fondo y extracción de manchas en silletería tapizada de tela del auditorio principal',
    category: 'limpieza_profunda',
    frequency: 'semestral',
    status: 'pendiente',
    isActive: true,
    orderIndex: 7,
    assignedPublisherIds: [],
    estimatedMinutes: 180,
    checklist: [
      { id: 'c1', text: 'Aspirado minucioso de respaldos y asientos', completed: false },
      { id: 'c2', text: 'Aplicación de espuma limpiadora para telas y cepillado suave', completed: false },
      { id: 'c3', text: 'Verificar reapriete de tornillos en patas y bancas', completed: false },
      { id: 'c4', text: 'Dejar ventiladores y aire encendidos para secado completo', completed: false },
    ],
  },
];

export const INITIAL_AUX_PIONEER_REQUESTS: AuxPioneerRequest[] = [];

export const INITIAL_BRANCH_REPORTS_S1: BranchReportS1[] = [];

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
