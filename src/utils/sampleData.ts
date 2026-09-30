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
  MonthlyAccountsRecord,
  QuarterlyAudit,
  MemorialPlan,
  TheocraticAssembly,
  LiteratureItem,
  LiteratureSpecialOrder,
  LiteratureGroupDistribution,
  LiteratureInventoryRecord,
} from '../types';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek } from './organizedSync';

export const INITIAL_SETTINGS: CongregationSettings = {
  congregationName: 'Congregación El Olivar',
  midweekMeetingDay: 'Miércoles',
  midweekMeetingTime: '19:30',
  weekendMeetingDay: 'Domingo',
  weekendMeetingTime: '10:00',
  hallAddress: 'Av. Las Palmeras 450, Ciudad Central',
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

export const INITIAL_FIELD_SERVICE_MEETINGS: FieldServiceMeeting[] = [
  { id: 'fs-1', dayOfWeek: 'Martes', time: '10:00', location: 'Salón del Reino', conductorId: 'pub-3', groupNumber: 1, notes: 'Territorio de negocios y calles' },
  { id: 'fs-2', dayOfWeek: 'Miércoles', time: '10:00', location: 'Salón del Reino', conductorId: 'pub-1', groupNumber: 2, notes: 'Predicación matutina' },
  { id: 'fs-3', dayOfWeek: 'Jueves', time: '17:00', location: 'Plaza Central / Carritos', conductorId: 'pub-2', groupNumber: 3, notes: 'Testimonio público con carritos' },
  { id: 'fs-4', dayOfWeek: 'Sábado', time: '09:30', location: 'Salón del Reino', conductorId: 'pub-10', groupNumber: 4, notes: 'Salida general de congregación (De casa en casa)' },
  { id: 'fs-5', dayOfWeek: 'Domingo', time: '11:45', location: 'Salón del Reino', conductorId: 'pub-7', groupNumber: 1, notes: 'Predicación tras la reunión pública' },
];

export const INITIAL_OUTGOING_SPEAKERS: OutgoingSpeakerAssignment[] = [
  {
    id: 'out-1',
    publisherId: 'pub-1',
    date: '2026-10-18',
    destinationCongregation: 'Congregación Las Acacias',
    outlineNumber: 23,
    outlineTitle: 'La vida sí tiene propósito',
    notes: 'Salida de discurso confirmada con el coordinador visitante',
  },
  {
    id: 'out-2',
    publisherId: 'pub-10',
    date: '2026-11-01',
    destinationCongregation: 'Congregación Miraflores',
    outlineNumber: 1,
    outlineTitle: '¿Conoce usted bien a Dios?',
    notes: 'Reunión dominical a las 11:00',
  },
];

export const INITIAL_CART_LOCATIONS: CartLocation[] = [
  {
    id: 'cart-loc-1',
    name: 'Plaza de Armas / Entrada Metro',
    address: 'Plaza Principal, Esquina Norte con Calle Colón',
    notes: 'Punto de alto flujo peatonal. Solicitar llaves del carrito en el Salón.',
    active: true,
  },
  {
    id: 'cart-loc-2',
    name: 'Parque Central / Bulevar Comercial',
    address: 'Av. Libertador con Paseo de los Álamos',
    notes: 'Colocar sombrilla de protección en horarios de tarde.',
    active: true,
  },
  {
    id: 'cart-loc-3',
    name: 'Estación Central Intermodal',
    address: 'Terminal de Pasajeros y Trenes, Nivel 1',
    notes: 'Llevar folletos en diversos idiomas según disponibilidad.',
    active: true,
  },
];

export const INITIAL_CART_SHIFTS: CartShift[] = [
  {
    id: 'cshift-1',
    locationId: 'cart-loc-1',
    dayOfWeek: 'Martes',
    startTime: '09:30',
    endTime: '11:30',
    publisher1Id: 'pub-5', // Ana García
    publisher2Id: 'pub-6', // Elena Rojas
    notes: 'Turno matutino. Horas pico de transeúntes.',
  },
  {
    id: 'cshift-2',
    locationId: 'cart-loc-1',
    dayOfWeek: 'Jueves',
    startTime: '17:00',
    endTime: '19:00',
    publisher1Id: 'pub-2', // David Silva
    publisher2Id: 'pub-7', // Samuel Torres
    notes: 'Turno vespertino.',
  },
  {
    id: 'cshift-3',
    locationId: 'cart-loc-2',
    dayOfWeek: 'Sábado',
    startTime: '10:00',
    endTime: '12:00',
    publisher1Id: 'pub-6', // Elena Rojas
    publisher2Id: 'pub-11', // Sara Benítez
    notes: 'Fin de semana en el bulevar comercial.',
  },
  {
    id: 'cshift-4',
    locationId: 'cart-loc-3',
    dayOfWeek: 'Viernes',
    startTime: '16:00',
    endTime: '18:00',
    publisher1Id: 'pub-4', // Javier Méndez
    publisher2Id: 'pub-9', // Marcos Ortiz
    notes: 'Punto intermodal terminal.',
  },
];

export const INITIAL_NOTICES: CongregationNotice[] = [
  {
    id: 'not-1',
    title: 'Visita del Superintendente de Circuito',
    category: 'circuito',
    content: 'Nos alegra anunciar que la semana del 12 al 18 de octubre recibiremos la visita de nuestro Superintendente de Circuito, el Hno. Marcelo Vega y su esposa. Habrá reuniones para precursores y ancianos, y una intensa semana de predicación.',
    date: '2026-09-28',
    expiresDate: '2026-10-19',
    pinned: true,
    author: 'Cuerpo de Ancianos',
  },
  {
    id: 'not-2',
    title: 'Próxima Asamblea de Circuito: "Alabemos a Jehová"',
    category: 'asamblea',
    content: 'La Asamblea de Circuito se celebrará el sábado 7 de noviembre de 2026 en el Salón de Asambleas de Bellavista. El programa dará inicio a las 09:40 y concluirá a las 16:00.',
    date: '2026-09-20',
    expiresDate: '2026-11-08',
    pinned: true,
    author: 'Secretario',
  },
  {
    id: 'not-3',
    title: 'Campaña Especial de Distribución de La Atalaya',
    category: 'campana',
    content: 'Durante el próximo mes todos estamos invitados a participar activamente en la distribución del número especial al público en general, comercios y calles principales.',
    date: '2026-09-25',
    expiresDate: '2026-10-31',
    pinned: false,
    author: 'Superintendente de Servicio',
  },
  {
    id: 'not-4',
    title: 'Arreglos de Aseo Profundo del Salón del Reino',
    category: 'limpieza',
    content: 'El próximo sábado a las 14:00 corresponde el aseo profundo semestral a los Grupos 1 y 2. Se ruega traer material complementario si es posible.',
    date: '2026-09-27',
    expiresDate: '2026-10-15',
    pinned: false,
    author: 'Comité de Mantenimiento',
  },
];

// Generate 12 months of service year reports for sample publishers (Sep 2025 to Aug 2026 + Sep 2026)
function generateServiceYearReports(): MonthlyServiceReport[] {
  const reports: MonthlyServiceReport[] = [];
  const months = [
    '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04',
    '2026-05', '2026-06', '2026-07', '2026-08',
    '2026-09'
  ];

  // pub-1: Carlos Mendoza (Anciano regular)
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p1-${m}`,
      publisherId: 'pub-1',
      month: m,
      participated: true,
      hours: 12 + (idx % 4),
      bibleStudies: 2,
      notes: idx === 6 ? 'Precursor auxiliar en campaña' : '',
      isAuxiliaryPioneer: idx === 6,
    });
  });

  // pub-2: David Silva (Siervo ministerial)
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p2-${m}`,
      publisherId: 'pub-2',
      month: m,
      participated: true,
      hours: 14 + (idx % 3),
      bibleStudies: 1,
    });
  });

  // pub-3: Roberto Gómez (Anciano)
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p3-${m}`,
      publisherId: 'pub-3',
      month: m,
      participated: true,
      hours: 18 + (idx % 5),
      bibleStudies: 3,
    });
  });

  // pub-5: Ana Morales (Precursora Regular - 50 hrs/mes)
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p5-${m}`,
      publisherId: 'pub-5',
      month: m,
      participated: true,
      hours: 50 + (idx % 7),
      bibleStudies: 4 + (idx % 2),
      isPioneer: true,
      notes: 'Precursora regular',
    });
  });

  // pub-6: Elena Vega (Precursora Regular)
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p6-${m}`,
      publisherId: 'pub-6',
      month: m,
      participated: true,
      hours: 52 + (idx % 5),
      bibleStudies: 3,
      isPioneer: true,
      notes: 'Precursora regular',
    });
  });

  // pub-8: Lucía Fernández (Irregular: faltó informar en julio y agosto)
  months.forEach((m, idx) => {
    if (idx !== 10 && idx !== 11) {
      reports.push({
        id: `rep-p8-${m}`,
        publisherId: 'pub-8',
        month: m,
        participated: true,
        hours: 9,
        bibleStudies: 0,
      });
    }
  });

  // pub-10: Marcos Peña
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p10-${m}`,
      publisherId: 'pub-10',
      month: m,
      participated: true,
      hours: 15 + (idx % 4),
      bibleStudies: 2,
    });
  });

  // pub-11: Sofía Navarro
  months.forEach((m, idx) => {
    reports.push({
      id: `rep-p11-${m}`,
      publisherId: 'pub-11',
      month: m,
      participated: true,
      hours: 10 + (idx % 3),
      bibleStudies: 1,
    });
  });

  return reports;
}

export const INITIAL_MONTHLY_REPORTS: MonthlyServiceReport[] = generateServiceYearReports();

export const INITIAL_TERRITORIES: Territory[] = [
  {
    id: 'terr-1',
    number: '01',
    name: 'Barrio San José - Calles 1 a 6',
    type: 'residencial',
    zone: 'Zona Norte',
    estimatedHomes: 120,
    status: 'asignado',
    currentAssigneeId: 'pub-3', // Carlos Mendoza
    assignedDate: '2026-08-10',
    dueDate: '2026-12-10',
    lastCompletedDate: '2026-04-15',
    mapUrl: 'https://maps.google.com/?q=Plaza+San+Jose',
    boundsDescription: 'Norte: Av. Los Andes | Sur: Calle 6 | Este: Av. Principal | Oeste: Quebrada San José',
    notes: 'Terreno llano, buena receptividad en horarios matutinos. Predicación de casa en casa ágil.',
    noVisits: [
      {
        id: 'nv-1',
        address: 'Calle 3 #45-12',
        residentName: 'Familia Ramírez',
        dateAdded: '2026-02-14',
        reason: 'Solicitó no ser visitado por motivos personales.',
      },
    ],
    history: [
      {
        id: 'th-1',
        territoryId: 'terr-1',
        publisherId: 'pub-3',
        publisherName: 'Carlos Mendoza',
        assignedDate: '2026-08-10',
        dueDate: '2026-12-10',
        notes: 'Asignación activa actual.',
      },
      {
        id: 'th-2',
        territoryId: 'terr-1',
        publisherId: 'pub-7',
        publisherName: 'Samuel Torres',
        assignedDate: '2025-12-10',
        dueDate: '2026-04-10',
        returnedDate: '2026-04-15',
        notes: 'Territorio cubierto en un 100%. Se actualizaron direcciones no visitar.',
      },
    ],
  },
  {
    id: 'terr-2',
    number: '02',
    name: 'Centro Comercial & Bulevar Las Palmas',
    type: 'negocios',
    zone: 'Sector Centro',
    estimatedHomes: 65,
    status: 'vencido', // Más de 4 meses sin ser devuelto (para alertar al encargado de territorios)
    currentAssigneeId: 'pub-1', // Mateo Morales
    assignedDate: '2026-05-10',
    dueDate: '2026-09-10',
    lastCompletedDate: '2025-11-20',
    mapUrl: 'https://maps.google.com/?q=Bulevar+Las+Palmas',
    boundsDescription: 'Norte: Calle Real | Sur: Av. Libertad | Este: Paseo Central | Oeste: Calle del Sol',
    notes: 'Comercios, oficinas de servicios y locales en planta baja. Conviene visitar en parejas de hermanos.',
    noVisits: [],
    history: [
      {
        id: 'th-3',
        territoryId: 'terr-2',
        publisherId: 'pub-1',
        publisherName: 'Mateo Morales',
        assignedDate: '2026-05-10',
        dueDate: '2026-09-10',
        notes: 'Plazo de 4 meses vencido. Se requiere contactar al publicador o extender el plazo.',
      },
    ],
  },
  {
    id: 'terr-3',
    number: '03',
    name: 'Urbanización Los Pinos (Bloques A-D)',
    type: 'edificios',
    zone: 'Zona Este',
    estimatedHomes: 180,
    status: 'disponible',
    lastCompletedDate: '2026-07-20',
    mapUrl: 'https://maps.google.com/?q=Urbanizacion+Los+Pinos',
    boundsDescription: 'Conjunto cerrado con 4 torres de 10 pisos. Acceso con conserjería y citófonos.',
    notes: 'Solicitar autorización en recepción con la credencial oficial. Predicación por citófono o buzón.',
    noVisits: [
      {
        id: 'nv-2',
        address: 'Torre B, Apto 402',
        residentName: 'Sra. Domínguez',
        dateAdded: '2026-01-10',
        reason: 'Petición expresa de no tocar citófono.',
      },
    ],
    history: [
      {
        id: 'th-4',
        territoryId: 'terr-3',
        publisherId: 'pub-4',
        publisherName: 'Javier Méndez',
        assignedDate: '2026-03-15',
        dueDate: '2026-07-15',
        returnedDate: '2026-07-20',
        notes: 'Completado con ayuda de precursores en campaña especial.',
      },
    ],
  },
  {
    id: 'terr-4',
    number: '04',
    name: 'Sector Campestre & Granjas del Valle',
    type: 'rural',
    zone: 'Sector Rural',
    estimatedHomes: 45,
    status: 'asignado',
    currentAssigneeId: 'pub-2', // David Silva
    assignedDate: '2026-09-01',
    dueDate: '2027-01-01',
    lastCompletedDate: '2026-02-18',
    mapUrl: 'https://maps.google.com/?q=Valle+Campestre',
    boundsDescription: 'Camino vecinal del Valle, desde el Km 2 hasta el puente colgante.',
    notes: 'Casas quintas y parcelas distanciadas. Recomendable vehículo y calzado adecuado.',
    noVisits: [],
    history: [
      {
        id: 'th-5',
        territoryId: 'terr-4',
        publisherId: 'pub-2',
        publisherName: 'David Silva',
        assignedDate: '2026-09-01',
        dueDate: '2027-01-01',
        notes: 'Asignado para cubrir en salidas grupales de fin de semana.',
      },
    ],
  },
  {
    id: 'terr-5',
    number: '05',
    name: 'Condominio Mirador y Ribera',
    type: 'residencial',
    zone: 'Zona Sur',
    estimatedHomes: 95,
    status: 'disponible',
    lastCompletedDate: '2026-06-15',
    mapUrl: 'https://maps.google.com/?q=Condominio+Mirador',
    boundsDescription: 'Norte: Calle del Río | Sur: Cuesta Mirador | Este: Carrera 10 | Oeste: Parque Ribera',
    notes: 'Sector residencial tranquilo. Mucha gente en casa por las mañanas.',
    noVisits: [],
    history: [
      {
        id: 'th-6',
        territoryId: 'terr-5',
        publisherId: 'pub-10',
        publisherName: 'Jorge Suárez',
        assignedDate: '2026-02-10',
        dueDate: '2026-06-10',
        returnedDate: '2026-06-15',
        notes: 'Territorio trabajado completamente.',
      },
    ],
  },
  {
    id: 'terr-6',
    number: '06',
    name: 'Avenida Independencia & Paseo del Sol',
    type: 'residencial',
    zone: 'Sector Centro',
    estimatedHomes: 110,
    status: 'asignado',
    currentAssigneeId: 'pub-5', // Ana García (Precursora)
    assignedDate: '2026-09-15',
    dueDate: '2027-01-15',
    lastCompletedDate: '2026-03-30',
    mapUrl: 'https://maps.google.com/?q=Avenida+Independencia',
    boundsDescription: 'Desde Av. Independencia #100 al #450, ambas aceras y pasajes interiores.',
    notes: 'Muchas familias jóvenes. Se han iniciado dos cursos bíblicos en este territorio.',
    noVisits: [
      {
        id: 'nv-3',
        address: 'Pasaje Los Laureles #12',
        residentName: 'Don Enrique',
        dateAdded: '2025-11-05',
        reason: 'No atender en horarios de siesta ni fines de semana temprano.',
      },
    ],
    history: [
      {
        id: 'th-7',
        territoryId: 'terr-6',
        publisherId: 'pub-5',
        publisherName: 'Ana García',
        assignedDate: '2026-09-15',
        dueDate: '2027-01-15',
        notes: 'Asignado para servicio de precursor regular.',
      },
    ],
  },
  {
    id: 'terr-7',
    number: '07',
    name: 'Sector Industrial y Talleres de Servicios',
    type: 'negocios',
    zone: 'Zona Industrial',
    estimatedHomes: 40,
    status: 'disponible',
    lastCompletedDate: '2025-10-10',
    mapUrl: 'https://maps.google.com/?q=Zona+Industrial+Sur',
    boundsDescription: 'Naves industriales y galpones comprendidos entre Av. Las Fábricas y Ferrocarril.',
    notes: 'Mejor horario: 10:30 a 12:30 de lunes a viernes. Presentaciones breves y directas.',
    noVisits: [],
    history: [],
  },
  {
    id: 'terr-8',
    number: '08',
    name: 'Lomas de la Colina - Manzanas 1 a 8',
    type: 'residencial',
    zone: 'Zona Norte',
    estimatedHomes: 135,
    status: 'asignado',
    currentAssigneeId: 'pub-7', // Samuel Torres
    assignedDate: '2026-06-01',
    dueDate: '2026-10-01', // Próximo a vencer (2 días)
    lastCompletedDate: '2025-09-12',
    mapUrl: 'https://maps.google.com/?q=Lomas+de+la+Colina',
    boundsDescription: 'Calles empinadas. Desde el Mirador de la Colina hasta el inicio del sendero.',
    notes: 'Casas familiares con patios. Cuidado con mascotas sueltas en callejón 4.',
    noVisits: [],
    history: [
      {
        id: 'th-8',
        territoryId: 'terr-8',
        publisherId: 'pub-7',
        publisherName: 'Samuel Torres',
        assignedDate: '2026-06-01',
        dueDate: '2026-10-01',
        notes: 'Casi concluido, falta manzana 7 y 8.',
      },
    ],
  },
];

export const INITIAL_CIRCUIT_VISIT: CircuitOverseerVisit = {
  id: 'visit-2026-10',
  circuitNumber: 'Circuito 04',
  overseerName: 'Marcelo Vega',
  overseerPhone: '+1 (555) 345-6789',
  wifeName: 'Raquel Vega',
  startDate: '2026-10-13',
  endDate: '2026-10-18',
  status: 'proxima',
  midweekTalkTheme: 'Sigamos edificándonos y fortaleciéndonos mutuamente',
  midweekSongNumber: 118,
  weekendPublicTalkTheme: '¿Quiénes están alcanzando la verdadera paz y seguridad?',
  weekendFinalTalkTheme: 'Permanezcamos unidos bajo la tierna compasión de Jehová',
  weekendSongNumber: 130,
  dietaryPreferences: 'Dieta balanceada. Evitar mariscos y lácteos enteros. Preferencia por frutas frescas, pollo o pescado a la plancha.',
  lodgingNotes: 'Alojamiento en el apartamento de hospitalidad del Salón del Reino. Llaves coordinadas con el Hno. Carlos Mendoza.',
  meals: [
    {
      id: 'meal-1',
      day: 'Martes',
      date: '2026-10-13',
      mealType: 'almuerzo',
      hostPublisherId: 'pub-1',
      hostName: 'Familia Morales',
      hostPhone: '+1 (555) 123-4567',
      location: 'Casa Fam. Morales - Calle 8 #23',
      notes: 'Almuerzo de bienvenida tras la llegada del SC.',
      isConfirmed: true,
    },
    {
      id: 'meal-2',
      day: 'Martes',
      date: '2026-10-13',
      mealType: 'cena',
      hostPublisherId: 'pub-3',
      hostName: 'Familia Mendoza',
      hostPhone: '+1 (555) 345-6789',
      location: 'Salón del Reino (antes de la reunión con ancianos)',
      notes: 'Cena ligera y refrigerio.',
      isConfirmed: true,
    },
    {
      id: 'meal-3',
      day: 'Miércoles',
      date: '2026-10-14',
      mealType: 'almuerzo',
      hostPublisherId: 'pub-2',
      hostName: 'Familia Silva',
      hostPhone: '+1 (555) 234-5678',
      location: 'Av. Primavera #104',
      notes: 'Después del servicio de la mañana con precursores.',
      isConfirmed: true,
    },
    {
      id: 'meal-4',
      day: 'Jueves',
      date: '2026-10-15',
      mealType: 'almuerzo',
      hostPublisherId: 'pub-4',
      hostName: 'Familia Méndez',
      hostPhone: '+1 (555) 456-7890',
      location: 'Calle Los Pinos #55',
      notes: 'Pechuga a la plancha y ensaladas variadas.',
      isConfirmed: true,
    },
    {
      id: 'meal-5',
      day: 'Viernes',
      date: '2026-10-16',
      mealType: 'almuerzo',
      hostPublisherId: 'pub-10',
      hostName: 'Familia Suárez',
      hostPhone: '+1 (555) 012-3456',
      location: 'Urb. El Parque #12',
      notes: 'Pescado blanco al vapor con verduras.',
      isConfirmed: false,
    },
    {
      id: 'meal-6',
      day: 'Sábado',
      date: '2026-10-17',
      mealType: 'almuerzo',
      hostPublisherId: 'pub-7',
      hostName: 'Familia Torres',
      hostPhone: '+1 (555) 789-0123',
      location: 'Condominio Mirador Torre A',
      notes: 'Almuerzo después de la predicación de toda la congregación.',
      isConfirmed: true,
    },
    {
      id: 'meal-7',
      day: 'Domingo',
      date: '2026-10-18',
      mealType: 'almuerzo',
      hostPublisherId: 'pub-1',
      hostName: 'Compartir con Ancianos y Esposas',
      hostPhone: '+1 (555) 123-4567',
      location: 'Salón del Reino (área de reuniones)',
      notes: 'Comida de despedida tras el discurso final del SC.',
      isConfirmed: true,
    },
  ],
  ministry: [
    {
      id: 'min-1',
      day: 'Martes',
      session: 'manana',
      date: '2026-10-13',
      time: '09:30',
      meetingPoint: 'Salón del Reino',
      territoryNumber: '01',
      coCompanionPublisherId: 'pub-1',
      wifeCompanionPublisherId: 'pub-8',
      groupNumber: 1,
      notes: 'Salida de apertura de la semana con el Grupo 1.',
    },
    {
      id: 'min-2',
      day: 'Miércoles',
      session: 'manana',
      date: '2026-10-14',
      time: '09:00',
      meetingPoint: 'Parque San José (Bulevar)',
      territoryNumber: '02',
      coCompanionPublisherId: 'pub-3',
      wifeCompanionPublisherId: 'pub-5',
      groupNumber: 2,
      notes: 'Predicación en comercios y con precursores regulares.',
    },
    {
      id: 'min-3',
      day: 'Jueves',
      session: 'manana',
      date: '2026-10-15',
      time: '09:30',
      meetingPoint: 'Salón del Reino',
      territoryNumber: '03',
      coCompanionPublisherId: 'pub-4',
      wifeCompanionPublisherId: 'pub-6',
      groupNumber: 3,
      notes: 'Trabajo en edificios con citófono.',
    },
    {
      id: 'min-4',
      day: 'Viernes',
      session: 'manana',
      date: '2026-10-16',
      time: '09:30',
      meetingPoint: 'Casa Fam. Silva',
      territoryNumber: '04',
      coCompanionPublisherId: 'pub-2',
      wifeCompanionPublisherId: 'pub-9',
      groupNumber: 4,
      notes: 'Territorio rural y revisitas.',
    },
    {
      id: 'min-5',
      day: 'Sábado',
      session: 'manana',
      date: '2026-10-17',
      time: '09:00',
      meetingPoint: 'Salón del Reino (Toda la congregación)',
      territoryNumber: '06',
      coCompanionPublisherId: 'pub-7',
      wifeCompanionPublisherId: 'pub-5',
      notes: 'Reunión general para el servicio del campo. Salida con toda la congregación.',
    },
  ],
  specialMeetings: [
    {
      id: 'sp-1',
      title: 'Reunión con los Precursores',
      date: '2026-10-14',
      time: '18:00 - 19:00',
      location: 'Salón del Reino (Sala B)',
      attendeesDescription: 'Todos los precursores regulares y especiales de la congregación.',
      notes: 'Traer la Biblia y notas para el análisis del ministerio.',
    },
    {
      id: 'sp-2',
      title: 'Reunión con Ancianos y Siervos Ministeriales',
      date: '2026-10-13',
      time: '18:15 - 19:15',
      location: 'Salón del Reino (Principal)',
      attendeesDescription: 'Cuerpo de ancianos y siervos ministeriales.',
      notes: 'Se evaluará el progreso espiritual y las metas teocráticas.',
    },
    {
      id: 'sp-3',
      title: 'Reunión exclusiva con el Cuerpo de Ancianos',
      date: '2026-10-17',
      time: '16:00 - 17:30',
      location: 'Salón del Reino (Sala de Ancianos)',
      attendeesDescription: 'Todos los ancianos de la congregación.',
      notes: 'Revisión de recomendaciones y necesidades locales.',
    },
  ],
  checklist: [
    {
      id: 'chk-1',
      category: 'secretaria',
      task: 'Tarjetas de registro de publicador (S-21) actualizadas hasta el último mes.',
      completed: true,
      assignedRole: 'Secretario',
      notes: 'Tarjetas completadas y archivadas alfabéticamente.',
    },
    {
      id: 'chk-2',
      category: 'secretaria',
      task: 'Registro de asistencia a las reuniones (S-88) de los últimos 6 meses.',
      completed: true,
      assignedRole: 'Secretario',
    },
    {
      id: 'chk-3',
      category: 'cuentas',
      task: 'Auditoría trimestral de cuentas (S-25) completada y firmada.',
      completed: true,
      assignedRole: 'Siervo de Cuentas / Coordinador',
    },
    {
      id: 'chk-4',
      category: 'servicio',
      task: 'Registro de asignación de territorio (S-13) con mapas actualizados.',
      completed: true,
      assignedRole: 'Siervo de Territorios',
    },
    {
      id: 'chk-5',
      category: 'servicio',
      task: 'Programa de predicación de la semana con acompañantes para el SC y su esposa.',
      completed: true,
      assignedRole: 'Superintendente de Servicio',
    },
    {
      id: 'chk-6',
      category: 'salon',
      task: 'Aseo profundo del Salón del Reino y revisión del apartamento de hospitalidad.',
      completed: false,
      assignedRole: 'Encargado de Mantenimiento',
      notes: 'Pendiente verificar ropa de cama y refrigerador.',
    },
    {
      id: 'chk-7',
      category: 'salon',
      task: 'Sistema de audio y micrófonos calibrados para la visita.',
      completed: true,
      assignedRole: 'Siervo de Audio',
    },
  ],
  notes: 'Semana de visita semestral correspondiente a la primera mitad del año de servicio.',
};

export const INITIAL_CUSTOM_DUTIES: CustomDuty[] = [
  { id: 'duty-audio', key: 'deber_audio', name: 'Audio', description: 'Control de sonido de la reunión', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-video', key: 'deber_video', name: 'Video / Multimedia', description: 'Transmisión de videos y pantallas', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-mics', key: 'deber_microfonos', name: 'Micrófonos', description: 'Pase de micrófonos en el auditorio', midweek: true, weekend: true, maxPeople: 2 },
  { id: 'duty-plat', key: 'deber_plataforma', name: 'Plataforma', description: 'Ajuste de micrófonos e iluminación del escenario', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-acom', key: 'deber_acomodador', name: 'Acomodador Auditorio / Puerta', description: 'Bienvenida y orden en el salón', midweek: true, weekend: true, maxPeople: 2 },
  { id: 'duty-seg', key: 'deber_seguridad', name: 'Seguridad / Estacionamiento', description: 'Vigilancia exterior y estacionamiento', midweek: true, weekend: true, maxPeople: 1 },
  { id: 'duty-zoom', key: 'deber_zoom', name: 'Anfitrión de Zoom', description: 'Gestión de participantes conectados por videoconferencia', midweek: true, weekend: true, maxPeople: 1 },
];

export const INITIAL_PUBLISHERS: Publisher[] = [
  {
    id: 'pub-1',
    name: 'Carlos Mendoza',
    gender: 'hermano',
    phone: '+34 612 345 678',
    notes: 'Anciano. Coordinador del cuerpo de ancianos.',
    active: true,
    groupNumber: 1,
    privilege: 'anciano',
    birthDate: '1978-04-12',
    baptismDate: '1996-07-20',
    hope: 'otras_ovejas',
    address: 'Calle Los Pinos 142, Dpto 3B',
    emergencyContactName: 'Marta Mendoza (Esposa)',
    emergencyContactPhone: '+34 612 345 679',
    absences: [],
    roles: {
      vym_presidente: true,
      vym_oracion: true,
      vym_tesoros_discurso: true,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: true,
      vym_estudio_conductor: true,
      vym_estudio_lector: true,
      fds_presidente: true,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-2',
    name: 'David Silva',
    gender: 'hermano',
    phone: '+34 622 987 654',
    notes: 'Siervo ministerial. Encargado de sonido y video.',
    active: true,
    groupNumber: 2,
    privilege: 'siervo_ministerial',
    birthDate: '1992-09-05',
    baptismDate: '2008-08-15',
    hope: 'otras_ovejas',
    address: 'Av. Primavera 58',
    emergencyContactName: 'Laura Silva (Hermana)',
    emergencyContactPhone: '+34 622 987 655',
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: true,
      vym_tesoros_discurso: true,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: true,
      vym_estudio_conductor: false,
      vym_estudio_lector: true,
      fds_presidente: false,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: true,
      deber_audio: true,
      deber_video: true,
      deber_microfonos: true,
      deber_plataforma: true,
      deber_zoom: true,
    },
  },
  {
    id: 'pub-3',
    name: 'Javier Morales',
    gender: 'hermano',
    phone: '+34 633 112 233',
    notes: 'Anciano. Superintendente de servicio.',
    active: true,
    groupNumber: 3,
    absences: [],
    roles: {
      vym_presidente: true,
      vym_oracion: true,
      vym_tesoros_discurso: true,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: true,
      vym_estudio_conductor: true,
      vym_estudio_lector: true,
      fds_presidente: true,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: true,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-4',
    name: 'Mateo Gómez',
    gender: 'hermano',
    phone: '+34 644 556 677',
    notes: 'Joven bautizado, excelente dicción y manejo técnico.',
    active: true,
    groupNumber: 1,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: true,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: false,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: true,
      fds_presidente: false,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: true,
      deber_audio: true,
      deber_video: true,
      deber_microfonos: true,
      deber_plataforma: true,
      deber_zoom: true,
    },
  },
  {
    id: 'pub-5',
    name: 'Ana García',
    gender: 'hermana',
    phone: '+34 655 778 899',
    notes: 'Precursora regular.',
    active: true,
    groupNumber: 1,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: false,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: false,
      vym_tesoros_lectura: false,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: false,
      fds_presidente: false,
      fds_atalaya_lector: false,
      fds_oracion: false,
      deber_acomodador: false,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-6',
    name: 'Elena Rojas',
    gender: 'hermana',
    phone: '+34 666 443 322',
    notes: 'Precursora regular activa.',
    active: true,
    groupNumber: 2,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: false,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: false,
      vym_tesoros_lectura: false,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: false,
      fds_presidente: false,
      fds_atalaya_lector: false,
      fds_oracion: false,
      deber_acomodador: false,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-7',
    name: 'Samuel Torres',
    gender: 'hermano',
    phone: '+34 677 223 344',
    notes: 'Siervo ministerial. Acomodador y cuentas.',
    active: true,
    groupNumber: 4,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: true,
      vym_tesoros_discurso: true,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: true,
      vym_estudio_conductor: false,
      vym_estudio_lector: true,
      fds_presidente: false,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: true,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: true,
      deber_plataforma: true,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-8',
    name: 'Lucía Fernández',
    gender: 'hermana',
    phone: '+34 688 889 900',
    notes: 'Publicadora ejemplar.',
    active: true,
    groupNumber: 3,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: false,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: false,
      vym_tesoros_lectura: false,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: false,
      fds_presidente: false,
      fds_atalaya_lector: false,
      fds_oracion: false,
      deber_acomodador: false,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-9',
    name: 'Andrés Castro',
    gender: 'hermano',
    phone: '+34 699 123 789',
    notes: 'Ausencia programada en octubre.',
    active: true,
    groupNumber: 2,
    absences: [
      {
        id: 'abs-1',
        startDate: '2026-10-05',
        endDate: '2026-10-18',
        reason: 'Viaje familiar y vacaciones',
      },
    ],
    roles: {
      vym_presidente: false,
      vym_oracion: true,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: true,
      fds_presidente: false,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: true,
      deber_audio: true,
      deber_video: true,
      deber_microfonos: true,
      deber_plataforma: true,
      deber_zoom: true,
    },
  },
  {
    id: 'pub-10',
    name: 'Roberto Valdés',
    gender: 'hermano',
    phone: '+34 611 765 432',
    notes: 'Anciano experimentado.',
    active: true,
    groupNumber: 4,
    absences: [],
    roles: {
      vym_presidente: true,
      vym_oracion: true,
      vym_tesoros_discurso: true,
      vym_tesoros_perlas: true,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: true,
      vym_estudio_conductor: true,
      vym_estudio_lector: true,
      fds_presidente: true,
      fds_atalaya_lector: true,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-11',
    name: 'Sara Benítez',
    gender: 'hermana',
    phone: '+34 622 334 455',
    notes: 'Estudiante aplicada.',
    active: true,
    groupNumber: 4,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: false,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: false,
      vym_tesoros_lectura: false,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: false,
      fds_presidente: false,
      fds_atalaya_lector: false,
      fds_oracion: false,
      deber_acomodador: false,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
  {
    id: 'pub-12',
    name: 'Hugo Paredes',
    gender: 'hermano',
    phone: '+34 633 887 766',
    notes: 'Temporalmente inactivo por salud.',
    active: false,
    groupNumber: 1,
    absences: [],
    roles: {
      vym_presidente: false,
      vym_oracion: true,
      vym_tesoros_discurso: false,
      vym_tesoros_perlas: false,
      vym_tesoros_lectura: true,
      vym_maestros_titular: true,
      vym_maestros_ayudante: true,
      vym_vida_partes: false,
      vym_estudio_conductor: false,
      vym_estudio_lector: true,
      fds_presidente: false,
      fds_atalaya_lector: false,
      fds_oracion: true,
      deber_acomodador: true,
      deber_seguridad: false,
      deber_audio: false,
      deber_video: false,
      deber_microfonos: false,
      deber_plataforma: false,
      deber_zoom: false,
    },
  },
];

export const INITIAL_PREACHING_GROUPS: PreachingGroup[] = [
  {
    number: 1,
    name: 'Grupo 1 - Los Olivos',
    overseerId: 'pub-1',
    assistantId: 'pub-4',
    memberIds: ['pub-1', 'pub-4', 'pub-5', 'pub-12'],
  },
  {
    number: 2,
    name: 'Grupo 2 - El Prado',
    overseerId: 'pub-2',
    assistantId: 'pub-9',
    memberIds: ['pub-2', 'pub-6', 'pub-9'],
  },
  {
    number: 3,
    name: 'Grupo 3 - Las Flores',
    overseerId: 'pub-3',
    assistantId: undefined,
    memberIds: ['pub-3', 'pub-8'],
  },
  {
    number: 4,
    name: 'Grupo 4 - San Gabriel',
    overseerId: 'pub-10',
    assistantId: 'pub-7',
    memberIds: ['pub-7', 'pub-10', 'pub-11'],
  },
];

// Helper to format Date to YYYY-MM-DD
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate Monday of a given week offset from today (or target date)
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
          title: 'Tema del discurso de Tesoros (10 mins)',
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
            title: 'Necesidades de la congregación / Tema local (15 mins)',
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
      publicTalkSpeaker: 'Hermano asignado / Orador invitado',
      publicTalkTheme: '¿Quién es el Dios verdadero y qué espera de nosotros?',
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

  // Automatically bring outlines from Organized for this week (Entre Semana y Fin de Semana)
  const orgSchedule = getOrganizedScheduleForWeek(weekId, mondayISO);
  if (orgSchedule) {
    return applyOrganizedToWeek(emptyWeek, orgSchedule);
  }

  return emptyWeek;
}

export function generateInitialWeeks(): WeekSchedule[] {
  const weeks: WeekSchedule[] = [];
  // Generate 4 weeks (current week + 3 next weeks)
  for (let i = 0; i < 4; i++) {
    const monday = getMondayOfOffsetWeek(i);
    const week = createEmptyWeek(monday, i);

    // Pre-populate week 0 with sample assignments so the user immediately sees a working schedule
    if (i === 0) {
      week.midweek.presidentId = 'pub-1';
      week.midweek.initialPrayerId = 'pub-2';
      week.midweek.finalPrayerId = 'pub-7';
      week.midweek.tesoros.discurso.publisherId = 'pub-3';
      week.midweek.tesoros.discurso.status = 'confirmada';
      week.midweek.tesoros.perlas.publisherId = 'pub-10';
      week.midweek.tesoros.perlas.status = 'confirmada';
      week.midweek.tesoros.lecturaBiblia.publisherId = 'pub-4';
      week.midweek.tesoros.lecturaBiblia.status = 'confirmada';

      // Demonstrations with students and assistants
      week.midweek.maestros.items[0].publisherId = 'pub-5';
      week.midweek.maestros.items[0].assistantId = 'pub-6';
      week.midweek.maestros.items[0].status = 'confirmada';

      week.midweek.maestros.items[1].publisherId = 'pub-8';
      week.midweek.maestros.items[1].assistantId = 'pub-11';
      week.midweek.maestros.items[1].status = 'confirmada';

      week.midweek.maestros.items[2].publisherId = 'pub-2';
      week.midweek.maestros.items[2].assistantId = 'pub-4';
      week.midweek.maestros.items[2].status = 'confirmada';

      week.midweek.vidaCristiana.items[0].publisherId = 'pub-1';
      week.midweek.vidaCristiana.items[0].status = 'confirmada';
      week.midweek.vidaCristiana.estudioBiblico.conductorId = 'pub-3';
      week.midweek.vidaCristiana.estudioBiblico.lectorId = 'pub-7';

      week.midweek.duties.deber_audio = ['pub-9']; // pub-9 has an absence coming up in week 1 to test detection!
      week.midweek.duties.deber_video = ['pub-4'];
      week.midweek.duties.deber_microfonos = ['pub-7', 'pub-2'];
      week.midweek.duties.deber_acomodador = ['pub-10'];

      // Weekend
      week.weekend.presidentId = 'pub-3';
      week.weekend.atalayaConductorId = 'pub-1';
      week.weekend.atalayaLectorId = 'pub-2';
      week.weekend.initialPrayerId = 'pub-10';
      week.weekend.finalPrayerId = 'pub-4';
      week.weekend.duties.deber_audio = ['pub-9'];
      week.weekend.duties.deber_video = ['pub-4'];
      week.weekend.duties.deber_microfonos = ['pub-7'];
      week.weekend.duties.deber_acomodador = ['pub-2', 'pub-10'];
    }

    // Week 1: Normal week with a few assignments
    if (i === 1) {
      week.midweek.presidentId = 'pub-10';
      week.midweek.initialPrayerId = 'pub-4';
      week.midweek.tesoros.discurso.publisherId = 'pub-1';
      week.midweek.tesoros.perlas.publisherId = 'pub-3';
      week.midweek.tesoros.lecturaBiblia.publisherId = 'pub-2';
      week.midweek.maestros.items[0].publisherId = 'pub-6';
      week.midweek.maestros.items[0].assistantId = 'pub-5';
      week.midweek.vidaCristiana.estudioBiblico.conductorId = 'pub-1';
      week.midweek.vidaCristiana.estudioBiblico.lectorId = 'pub-4';
      week.midweek.duties.deber_audio = ['pub-2'];
      week.midweek.duties.deber_microfonos = ['pub-7'];

      week.weekend.presidentId = 'pub-1';
      week.weekend.atalayaConductorId = 'pub-3';
      week.weekend.atalayaLectorId = 'pub-7';
      week.weekend.duties.deber_audio = ['pub-4'];
      week.weekend.duties.deber_microfonos = ['pub-2'];
    }

    // Week 2: Special Event sample: Visita del Superintendente de Circuito
    if (i === 2) {
      week.specialEvent = {
        isSpecial: true,
        type: 'visita_superintendente',
        title: 'Visita del Superintendente de Circuito (Hno. Marcelo Vega)',
        noMeetingMidweek: false,
        noMeetingWeekend: false,
        notes: 'Reunión de servicio de campo especial el martes y reunión con precursores y ancianos.',
      };
      week.midweek.presidentId = 'pub-1';
      week.midweek.initialPrayerId = 'pub-3';
      week.weekend.presidentId = 'pub-10';
      week.weekend.publicTalkSpeaker = 'Marcelo Vega (Superintendente de Circuito)';
      week.weekend.publicTalkTheme = 'Mantengámonos firmes y vigilantes';
    }

    weeks.push(week);
  }
  return weeks;
}

// ==========================================
// DATOS INICIALES DE CUENTAS (S-26, S-30, S-25)
// ==========================================

export const INITIAL_TRANSACTIONS: AccountTransaction[] = [
  // Septiembre 2026
  {
    id: 'tx-2026-09-01',
    date: '2026-09-06',
    month: '2026-09',
    type: 'ingreso',
    fund: 'gastos_locales',
    category: 'donaciones_cajas',
    description: 'Contribuciones caja de gastos de la congregación local (Semana 1)',
    amount: 460.0,
    paymentMethod: 'efectivo',
    verified: true,
  },
  {
    id: 'tx-2026-09-02',
    date: '2026-09-06',
    month: '2026-09',
    type: 'ingreso',
    fund: 'obra_mundial',
    category: 'donaciones_cajas',
    description: 'Contribuciones caja de la obra mundial (Semana 1)',
    amount: 310.0,
    paymentMethod: 'efectivo',
    verified: true,
  },
  {
    id: 'tx-2026-09-03',
    date: '2026-09-10',
    month: '2026-09',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'servicios_electricidad',
    description: 'Suministro eléctrico del Salón del Reino (Compañía Eléctrica)',
    amount: 148.6,
    receiptNumber: 'FAC-2026-E09',
    payerOrPayee: 'Iberdrola S.A.',
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-09-04',
    date: '2026-09-12',
    month: '2026-09',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'servicios_agua_gas',
    description: 'Agua potable y servicios municipales',
    amount: 34.2,
    receiptNumber: 'FAC-AGUA-88',
    payerOrPayee: 'Canal de Aguas',
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-09-05',
    date: '2026-09-13',
    month: '2026-09',
    type: 'ingreso',
    fund: 'gastos_locales',
    category: 'donaciones_linea',
    description: 'Donaciones digitales recibidas mediante donate.jw.org',
    amount: 295.0,
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-09-06',
    date: '2026-09-16',
    month: '2026-09',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'articulos_limpieza',
    description: 'Artículos de aseo, bolsas y papel higiénico para baños',
    amount: 52.8,
    receiptNumber: 'TCK-5521',
    payerOrPayee: 'Supermercado Central',
    paymentMethod: 'efectivo',
    verified: true,
  },
  {
    id: 'tx-2026-09-07',
    date: '2026-09-19',
    month: '2026-09',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'mantenimiento_reparaciones',
    description: 'Sustitución de balastro LED y filtros de aire acondicionado',
    amount: 78.5,
    receiptNumber: 'FAC-MANT-12',
    payerOrPayee: 'Climatizaciones del Norte',
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-09-08',
    date: '2026-09-20',
    month: '2026-09',
    type: 'ingreso',
    fund: 'gastos_locales',
    category: 'donaciones_cajas',
    description: 'Contribuciones caja de gastos de la congregación local (Semana 3)',
    amount: 415.0,
    paymentMethod: 'efectivo',
    verified: true,
  },
  {
    id: 'tx-2026-09-09',
    date: '2026-09-23',
    month: '2026-09',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'resolucion_apoyo_circuito',
    description: 'Resolución aprobada de apoyo a los gastos del circuito',
    amount: 100.0,
    payerOrPayee: 'Fondo de Circuito 04',
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-09-10',
    date: '2026-09-28',
    month: '2026-09',
    type: 'gasto',
    fund: 'obra_mundial',
    category: 'fondos_transferidos_sucursal',
    description: 'Transferencia mensual a la sucursal de donaciones para la Obra Mundial',
    amount: 310.0,
    receiptNumber: 'TRANSF-SUC-892',
    payerOrPayee: 'Sucursal de los Testigos de Jehová',
    paymentMethod: 'transferencia',
    verified: true,
  },

  // Agosto 2026 (Mes anterior cerrado)
  {
    id: 'tx-2026-08-01',
    date: '2026-08-02',
    month: '2026-08',
    type: 'ingreso',
    fund: 'gastos_locales',
    category: 'donaciones_cajas',
    description: 'Contribuciones caja local (Agosto)',
    amount: 1150.0,
    paymentMethod: 'efectivo',
    verified: true,
  },
  {
    id: 'tx-2026-08-02',
    date: '2026-08-10',
    month: '2026-08',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'servicios_electricidad',
    description: 'Electricidad Salón del Reino (Agosto)',
    amount: 162.0,
    receiptNumber: 'FAC-2026-E08',
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-08-03',
    date: '2026-08-15',
    month: '2026-08',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'servicios_internet',
    description: 'Servicio de Internet y línea telefónica para transmisión',
    amount: 45.0,
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-08-04',
    date: '2026-08-20',
    month: '2026-08',
    type: 'ingreso',
    fund: 'gastos_locales',
    category: 'donaciones_linea',
    description: 'Donaciones digitales donate.jw.org',
    amount: 320.0,
    paymentMethod: 'transferencia',
    verified: true,
  },
  {
    id: 'tx-2026-08-05',
    date: '2026-08-25',
    month: '2026-08',
    type: 'gasto',
    fund: 'gastos_locales',
    category: 'seguro_salon',
    description: 'Cuota de seguro de responsabilidad civil del Salón',
    amount: 90.0,
    paymentMethod: 'transferencia',
    verified: true,
  },
];

export const INITIAL_QUARTERLY_AUDITS: QuarterlyAudit[] = [
  {
    id: 'audit-2025-2026-Q1',
    quarter: 'Q1',
    serviceYear: '2025-2026',
    monthsCovered: ['2025-09', '2025-10', '2025-11'],
    auditorName: 'Marcos Peña (Anciano)',
    auditDate: '2025-12-08',
    isCompleted: true,
    reviewedReceipts: true,
    verifiedBankStatements: true,
    checkedS30Announcements: true,
    findingsNotes: 'Cuentas en perfecto orden. Todos los comprobantes de gastos cuentan con factura o recibo firmado.',
  },
  {
    id: 'audit-2025-2026-Q2',
    quarter: 'Q2',
    serviceYear: '2025-2026',
    monthsCovered: ['2025-12', '2026-01', '2026-02'],
    auditorName: 'David Silva (Siervo Ministerial)',
    auditDate: '2026-03-05',
    isCompleted: true,
    reviewedReceipts: true,
    verifiedBankStatements: true,
    checkedS30Announcements: true,
    findingsNotes: 'Conciliación bancaria exacta con el extracto de cuenta al cierre de febrero.',
  },
  {
    id: 'audit-2025-2026-Q3',
    quarter: 'Q3',
    serviceYear: '2025-2026',
    monthsCovered: ['2026-03', '2026-04', '2026-05'],
    auditorName: 'Carlos Mendoza (Anciano)',
    auditDate: '2026-06-09',
    isCompleted: true,
    reviewedReceipts: true,
    verifiedBankStatements: true,
    checkedS30Announcements: true,
    findingsNotes: 'Se revisaron los envíos a la sucursal de las contribuciones para la obra mundial. Todo conciliado.',
  },
  {
    id: 'audit-2025-2026-Q4',
    quarter: 'Q4',
    serviceYear: '2025-2026',
    monthsCovered: ['2026-06', '2026-07', '2026-08'],
    auditorName: 'Samuel Torres (Siervo Ministerial)',
    auditDate: '2026-09-12',
    isCompleted: true,
    reviewedReceipts: true,
    verifiedBankStatements: true,
    checkedS30Announcements: true,
    findingsNotes: 'Auditoría de cierre del año de servicio teocrático completada satisfactoriamente para la visita del SC.',
  },
];

// ==========================================
// DATOS INICIALES DE CONMEMORACIÓN Y ASAMBLEAS
// ==========================================

export const INITIAL_MEMORIAL_PLANS: MemorialPlan[] = [
  {
    id: 'memorial-2026',
    serviceYear: 2026,
    date: '2026-04-02',
    time: '19:30',
    sunsetTime: '20:15',
    location: 'Salón del Reino El Olivar (Auditorio Principal)',
    chairmanPublisherId: 'pub-1', // Carlos Mendoza
    speakerPublisherId: 'pub-3', // Marcos Ruiz
    speakerTheme: 'Demuestre gratitud por lo que Dios y Cristo han hecho por usted',
    breadPrayerPublisherId: 'pub-2', // David Silva
    winePrayerPublisherId: 'pub-4', // Javier Lopez
    initialSongNumber: 107,
    finalSongNumber: 144,
    closingPrayerPublisherId: 'pub-1',
    emblemServers: [
      {
        id: 'es-1',
        sectionName: 'Pasillo Central Izquierdo (Filas 1 a 10)',
        breadServerPublisherId: 'pub-7', // Roberto Gomez
        wineServerPublisherId: 'pub-8', // Samuel Castro
        notes: 'Coordinar con la fila central al pasar los platos',
      },
      {
        id: 'es-2',
        sectionName: 'Pasillo Central Derecho (Filas 1 a 10)',
        breadServerPublisherId: 'pub-9', // Fernando Morales
        wineServerPublisherId: 'pub-10', // Luis Gutierrez
        notes: 'Asegurar que todas las personas alcancen a ver los emblemas',
      },
      {
        id: 'es-3',
        sectionName: 'Pasillo Lateral y Auditorio Auxiliar / Salón B',
        breadServerPublisherId: 'pub-4', // Javier Lopez
        wineServerPublisherId: 'pub-2', // David Silva
        notes: 'Pasar primero a los hermanos de edad avanzada con movilidad reducida',
      },
      {
        id: 'es-4',
        sectionName: 'Plataforma, Orador y Mesa de la Presidencia',
        breadServerPublisherId: 'pub-1', // Carlos Mendoza
        wineServerPublisherId: 'pub-1',
        notes: 'Servir al orador y al presidente al concluir la oración respectiva',
      },
    ],
    attendants: [
      {
        id: 'att-1',
        role: 'entrada_principal',
        publisherId: 'pub-7',
        notes: 'Dar bienvenida cordial, entregar hojas de cánticos a visitantes e invitar a pasar',
      },
      {
        id: 'att-2',
        role: 'pasillo_interior',
        publisherId: 'pub-9',
        notes: 'Ayudar a encontrar asientos disponibles y mantener pasillos despejados',
      },
      {
        id: 'att-3',
        role: 'estacionamiento',
        publisherId: 'pub-8',
        notes: 'Orientar vehículos, reservar lugares para discapacitados y entrada de la congregación vecina',
      },
      {
        id: 'att-4',
        role: 'audio_video_zoom',
        publisherId: 'pub-10',
        notes: 'Supervisar transmisión Zoom para publicadores enfermos y ajuste de volumen de micrófonos',
      },
      {
        id: 'att-5',
        role: 'conteo_asistencia',
        publisherId: 'pub-2',
        notes: 'Realizar el conteo a mitad del discurso (presencial + conexiones Zoom activas)',
      },
    ],
    preparation: {
      breadPreparationPublisherId: 'pub-5', // Ana Morales
      wineProviderPublisherId: 'pub-1', // Carlos Mendoza
      tableArrangementPublisherId: 'pub-6', // Elena Vega
      cleaningPublisherId: 'pub-2',
      emblemBreadType: 'Pan ácimo preparado con harina de trigo y agua, horneado sin sal ni levadura.',
      emblemWineType: 'Vino tinto puro sin azúcares agregados ni licores fortificados (tipo Cabernet / Rioja sin adulterar).',
      specialNotes: 'Mesa con mantel blanco impecable, 4 bandejas limpias para el pan y 4 copas de cristal transparente.',
    },
    campaign: {
      startDate: '2026-03-14',
      endDate: '2026-04-02',
      totalInvitationsReceived: 3500,
      invitationsPerPublisher: 50,
      territoriesCoveredCount: 22,
      totalCongregationTerritories: 24,
      notes: 'Campaña especial con invitación impresa y en formato digital jw.org compartida por WhatsApp.',
    },
    report: {
      inPersonAttendance: 142,
      streamingAttendance: 36,
      totalAttendance: 178,
      partakersCount: 0,
      partakerNames: '',
      reportedToBranch: true,
      reportedDate: '2026-04-03',
      notes: 'Asistencia extraordinaria con 38 personas interesadas no bautizadas. Informe remitido a Betel.',
    },
  },
];

export const INITIAL_ASSEMBLIES: TheocraticAssembly[] = [
  {
    id: 'assembly-circuito-2026-1',
    serviceYear: 2026,
    type: 'circuito_con_sc',
    theme: 'Alabemos a Jehová con constancia',
    dates: 'Sábado 7 de Noviembre de 2026',
    venue: 'Salón de Asambleas Bellavista (Circuito 04-B)',
    circuitNumber: 'Circuito 04-B',
    assignedCleaningDepartment: 'Sector Graderías Norte y Pasillos Exteriores',
    cleaningCoordinatorPublisherId: 'pub-2', // David Silva
    volunteers: [
      {
        id: 'vol-1',
        publisherId: 'pub-7',
        department: 'limpieza',
        roleOrShift: 'Limpieza intermedia tras el programa de la mañana',
        shiftDate: '2026-11-07',
        shiftTime: '12:45 - 13:20',
      },
      {
        id: 'vol-2',
        publisherId: 'pub-8',
        department: 'acomodadores',
        roleOrShift: 'Acomodador Pasillo 3 (Sector Norte)',
        shiftDate: '2026-11-07',
        shiftTime: '08:45 - 12:30',
      },
      {
        id: 'vol-3',
        publisherId: 'pub-10',
        department: 'audio_video',
        roleOrShift: 'Operador de cámara secundaria y pantallas',
        shiftDate: '2026-11-07',
        shiftTime: 'Jornada completa',
      },
      {
        id: 'vol-4',
        publisherId: 'pub-9',
        department: 'estacionamiento',
        roleOrShift: 'Recepción y ordenamiento de autobuses',
        shiftDate: '2026-11-07',
        shiftTime: '08:00 - 09:30',
      },
    ],
    baptismCandidates: [
      {
        id: 'bapt-1',
        publisherId: 'pub-8',
        questionsCompleted: true,
        reviewedByElders: 'Carlos Mendoza y Marcos Ruiz',
        notes: 'Preguntas del libro Organizados concluidas satisfactoriamente.',
      },
    ],
    busArrangement: {
      hasBus: true,
      busCompany: 'Autocares Turísticos Central',
      departureTime: '07:30',
      departureLocation: 'Frente al Salón del Reino El Olivar',
      returnTime: '17:00',
      seatsTotal: 55,
      seatsBooked: 48,
      farePerSeat: 12,
      coordinatorPublisherId: 'pub-4', // Javier Lopez
      notes: 'Llegada programada a las 08:30 con tiempo para acomodarse antes del preludio musical.',
    },
    congregationAttendance: {
      saturday: 86,
    },
    notes: 'Recordar a los publicadores llevar almuerzo ligero y el cancionero digital.',
  },
  {
    id: 'assembly-regional-2026',
    serviceYear: 2026,
    type: 'regional',
    theme: '¡Declarad las buenas nuevas con valor!',
    dates: '10 al 12 de Julio de 2026 (3 días)',
    venue: 'Palacio Metropolitano de Deportes y Exposiciones',
    circuitNumber: 'Región Centro',
    assignedCleaningDepartment: 'Sector Platea Baja y Servicios Higiénicos Zona Oeste',
    cleaningCoordinatorPublisherId: 'pub-1', // Carlos Mendoza
    volunteers: [
      {
        id: 'vol-reg-1',
        publisherId: 'pub-2',
        department: 'limpieza',
        roleOrShift: 'Coordinación limpieza general del viernes tarde',
        shiftDate: '2026-07-10',
      },
      {
        id: 'vol-reg-2',
        publisherId: 'pub-4',
        department: 'bautismo',
        roleOrShift: 'Asistencia y toallas a candidatos al bautismo',
        shiftDate: '2026-07-11',
        shiftTime: '11:30 - 13:00',
      },
      {
        id: 'vol-reg-3',
        publisherId: 'pub-7',
        department: 'acomodadores',
        roleOrShift: 'Acomodador Sector Puerta 4',
        shiftDate: '2026-07-12',
      },
    ],
    baptismCandidates: [],
    busArrangement: {
      hasBus: true,
      busCompany: 'Trans-Express Autopistas',
      departureTime: '07:15',
      departureLocation: 'Aparcamiento Municipal El Olivar',
      returnTime: '17:45',
      seatsTotal: 60,
      seatsBooked: 58,
      farePerSeat: 15,
      coordinatorPublisherId: 'pub-4',
      notes: 'Transporte contratado para los 3 días de la asamblea regional.',
    },
    congregationAttendance: {
      friday: 82,
      saturday: 88,
      sunday: 94,
    },
    notes: 'Asamblea Regional presencial completa. Gran gozo espiritual.',
  },
];

// ==========================================
// DATOS INICIALES DE LITERATURA (FORMULARIO S-14)
// ==========================================

export const INITIAL_LITERATURE_ITEMS: LiteratureItem[] = [
  // Biblias
  {
    id: 'lit-1',
    code: 'nwt-S',
    title: 'La Biblia. Traducción del Nuevo Mundo (Español)',
    category: 'biblia',
    language: 'Español',
    currentStock: 18,
    minimumStock: 10,
    locationBox: 'Estante A1 (Mostrador)',
    lastCountDate: '2026-09-15',
    notes: 'Edición de tapa flexible en gris oscuro estándar',
  },
  {
    id: 'lit-2',
    code: 'nwt-L',
    title: 'La Biblia. Traducción del Nuevo Mundo (Letra Grande)',
    category: 'biblia',
    language: 'Español',
    currentStock: 4,
    minimumStock: 5,
    locationBox: 'Estante A2 (Almacén)',
    lastCountDate: '2026-09-15',
    notes: 'Stock bajo - solicitar 5 ejemplares adicionales a Betel',
  },
  {
    id: 'lit-3',
    code: 'nwt-EN',
    title: 'New World Translation of the Holy Scriptures',
    category: 'biblia',
    language: 'Inglés',
    currentStock: 6,
    minimumStock: 3,
    locationBox: 'Estante A3',
    lastCountDate: '2026-09-15',
    notes: 'Para territorio y personas interesadas de habla inglesa',
  },
  // Libros de Estudio
  {
    id: 'lit-4',
    code: 'lff-S',
    title: '¡Disfrute de la vida para siempre! (Libro de estudio bíblico)',
    category: 'libro',
    language: 'Español',
    currentStock: 32,
    minimumStock: 15,
    locationBox: 'Estante B1',
    lastCountDate: '2026-09-15',
    notes: 'Publicación principal utilizada para impartir cursos bíblicos',
  },
  {
    id: 'lit-5',
    code: 'rr-S',
    title: 'La adoración pura de Jehová: ¡por fin restaurada!',
    category: 'libro',
    language: 'Español',
    currentStock: 12,
    minimumStock: 5,
    locationBox: 'Estante B2',
    lastCountDate: '2026-09-15',
    notes: 'Comentarios de las profecías del libro de Ezequiel',
  },
  {
    id: 'lit-6',
    code: 'bt-S',
    title: 'Demos testimonio del Reino de Dios',
    category: 'libro',
    language: 'Español',
    currentStock: 8,
    minimumStock: 4,
    locationBox: 'Estante B3',
    lastCountDate: '2026-09-15',
    notes: 'Estudio de los Hechos de los Apóstoles',
  },
  {
    id: 'lit-7',
    code: 'sjj-S',
    title: '«Cantemos con gozo a Jehová» (Cancionero estándar)',
    category: 'libro',
    language: 'Español',
    currentStock: 14,
    minimumStock: 8,
    locationBox: 'Estante B4',
    lastCountDate: '2026-09-15',
  },
  // Folletos
  {
    id: 'lit-8',
    code: 'lffi-S',
    title: '¡Disfrute de la vida para siempre! (Folleto introductorio)',
    category: 'folleto',
    language: 'Español',
    currentStock: 45,
    minimumStock: 20,
    locationBox: 'Estante C1',
    lastCountDate: '2026-09-15',
    notes: 'Lecciones 1 a 3 para iniciar cursos bíblicos',
  },
  {
    id: 'lit-9',
    code: 'th-S',
    title: 'Seamos mejores lectores y maestros',
    category: 'folleto',
    language: 'Español',
    currentStock: 15,
    minimumStock: 6,
    locationBox: 'Estante C2',
    lastCountDate: '2026-09-15',
    notes: 'Guía práctica para la reunión de entre semana',
  },
  // Tratados de Predicación
  {
    id: 'lit-10',
    code: 'T-30',
    title: 'Tratado Nº 30: ¿Cómo ve el futuro?',
    category: 'tratado',
    language: 'Español',
    currentStock: 120,
    minimumStock: 50,
    locationBox: 'Gaveta T1',
    lastCountDate: '2026-09-15',
    notes: 'Tratado de contacto inicial para predicación de casa en casa',
  },
  {
    id: 'lit-11',
    code: 'T-31',
    title: 'Tratado Nº 31: ¿Qué es para usted la familia?',
    category: 'tratado',
    language: 'Español',
    currentStock: 95,
    minimumStock: 50,
    locationBox: 'Gaveta T2',
    lastCountDate: '2026-09-15',
  },
  {
    id: 'lit-12',
    code: 'T-36',
    title: 'Tratado Nº 36: ¿Hará Dios que se acabe el sufrimiento?',
    category: 'tratado',
    language: 'Español',
    currentStock: 140,
    minimumStock: 50,
    locationBox: 'Gaveta T3',
    lastCountDate: '2026-09-15',
  },
  // Revistas
  {
    id: 'lit-13',
    code: 'wp26-1',
    title: 'La Atalaya Nº 1 2026: ¿Qué esperanza hay para los muertos?',
    category: 'revista',
    language: 'Español',
    currentStock: 65,
    minimumStock: 30,
    locationBox: 'Expositor Revistas 1',
    lastCountDate: '2026-09-15',
    notes: 'Edición para el público con código QR a artículos de jw.org',
  },
  {
    id: 'lit-14',
    code: 'g26-1',
    title: '¡Despertad! Nº 1 2026: ¿Cómo afrontar el estrés y la ansiedad?',
    category: 'revista',
    language: 'Español',
    currentStock: 50,
    minimumStock: 25,
    locationBox: 'Expositor Revistas 2',
    lastCountDate: '2026-09-15',
  },
  {
    id: 'lit-15',
    code: 'w26-09',
    title: 'La Atalaya de Estudio (Septiembre 2026)',
    category: 'revista',
    language: 'Español',
    currentStock: 28,
    minimumStock: 15,
    locationBox: 'Expositor Estudio',
    lastCountDate: '2026-09-15',
  },
];

export const INITIAL_SPECIAL_ORDERS: LiteratureSpecialOrder[] = [
  {
    id: 'order-1',
    publisherId: 'pub-5', // Ana Morales
    itemId: 'lit-2',
    itemTitle: 'Biblia Traducción del Nuevo Mundo (Letra Grande)',
    language: 'Español',
    quantity: 1,
    requestDate: '2026-09-18',
    status: 'recibido_en_salon',
    notes: 'Solicitada para persona mayor con problemas visuales. Ya en mostrador.',
  },
  {
    id: 'order-2',
    publisherId: 'pub-6', // Elena Vega
    itemId: 'lit-4',
    itemTitle: '¡Disfrute de la vida para siempre! (Ucraniano)',
    language: 'Ucraniano',
    quantity: 2,
    requestDate: '2026-09-22',
    status: 'pedido_a_betel',
    notes: 'Para curso bíblico con familia de refugiados en el territorio 4.',
  },
  {
    id: 'order-3',
    publisherId: 'pub-1', // Carlos Mendoza
    itemId: 'lit-7',
    itemTitle: '«Cantemos con gozo a Jehová» (Cancionero Letra Grande)',
    language: 'Español',
    quantity: 1,
    requestDate: '2026-08-30',
    status: 'entregado',
    deliveredDate: '2026-09-14',
    notes: 'Entregado al coordinador.',
  },
  {
    id: 'order-4',
    publisherId: 'pub-2', // David Silva
    itemId: 'lit-3',
    itemTitle: 'New World Translation (English Pocket Edition)',
    language: 'Inglés',
    quantity: 1,
    requestDate: '2026-09-25',
    status: 'solicitado',
    notes: 'Pendiente de tramitar en el próximo pedido mensual a Betel.',
  },
];

export const INITIAL_GROUP_DISTRIBUTIONS: LiteratureGroupDistribution[] = [
  {
    groupNumber: 1,
    magazinesCount: 30,
    tractsCount: 60,
    brochuresCount: 12,
    lastDistributedDate: '2026-09-20',
    notes: 'Entregado al Superintendente del Grupo 1 (Carlos Mendoza)',
  },
  {
    groupNumber: 2,
    magazinesCount: 25,
    tractsCount: 50,
    brochuresCount: 10,
    lastDistributedDate: '2026-09-20',
    notes: 'Entregado al Grupo 2',
  },
  {
    groupNumber: 3,
    magazinesCount: 25,
    tractsCount: 50,
    brochuresCount: 10,
    lastDistributedDate: '2026-09-20',
    notes: 'Entregado al Grupo 3',
  },
  {
    groupNumber: 4,
    magazinesCount: 20,
    tractsCount: 40,
    brochuresCount: 8,
    lastDistributedDate: '2026-09-20',
    notes: 'Entregado al Grupo 4',
  },
];

export const INITIAL_LITERATURE_INVENTORY_RECORDS: LiteratureInventoryRecord[] = [
  {
    id: 'inv-rec-2026',
    serviceYear: '2025-2026',
    countDate: '2026-09-15',
    servantPublisherId: 'pub-4', // Javier Lopez (Siervo Ministerial)
    overseerPublisherId: 'pub-3', // Marcos Ruiz (Anciano)
    totalItemsCounted: 602,
    isCountCompleted: true,
    notes: 'Recuento físico anual completo previo a la visita del Superintendente de Circuito. Cuadre exacto con existencias.',
  },
];


