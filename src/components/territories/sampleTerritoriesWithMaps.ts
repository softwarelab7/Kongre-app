// src/components/territories/sampleTerritoriesWithMaps.ts
import { Territory } from '../../types';

/**
 * Territorios de muestra con polígonos perimetrales georreferenciados para demostración y pruebas inmediatas
 */
export const SAMPLE_TERRITORIES_WITH_POLYGONS: Territory[] = [
  {
    id: 'terr-map-01',
    number: '01',
    name: 'Sector La Floresta Central',
    type: 'residencial',
    zone: 'Zona Norte',
    estimatedHomes: 120,
    status: 'disponible',
    color: '#10b981', // Verde esmeralda
    boundsDescription: 'Entre Calle 98 y Calle 102, de Carrera 68 a Carrera 72.',
    notes: 'Zona residencial de casas y conjuntos cerrados de 4 pisos.',
    polygon: [
      [4.6865, -74.0750],
      [4.6895, -74.0720],
      [4.6930, -74.0760],
      [4.6900, -74.0790],
    ],
    center: [4.6897, -74.0755],
    zoom: 16,
    noVisits: [
      {
        id: 'nv-01',
        address: 'Cra 70 # 100-24, Casa 3',
        residentName: 'Familia Morales',
        dateAdded: '2026-02-10',
        reason: 'Petición expresa de no tocar el timbre.',
        coordinates: [4.6898, -74.0752],
      },
    ],
    history: [],
  },
  {
    id: 'terr-map-02',
    number: '02',
    name: 'Sector Metrópolis y Parque',
    type: 'residencial',
    zone: 'Zona Norte',
    estimatedHomes: 95,
    status: 'asignado',
    color: '#3b82f6', // Azul real
    assignedDate: '2026-09-01',
    dueDate: '2027-01-01',
    boundsDescription: 'Avenida 68 hacia el este hasta Transversal 60.',
    notes: 'Edificios con citófono. Buen momento para predicar los sábados en la mañana.',
    polygon: [
      [4.6830, -74.0780],
      [4.6860, -74.0745],
      [4.6825, -74.0710],
      [4.6795, -74.0745],
    ],
    center: [4.6827, -74.0745],
    zoom: 16,
    noVisits: [],
    history: [],
  },
  {
    id: 'terr-map-03',
    number: '03',
    name: 'Centro Comercial y Negocios',
    type: 'negocios',
    zone: 'Zona Centro',
    estimatedHomes: 65,
    status: 'asignado',
    color: '#f59e0b', // Ámbar por vencer
    assignedDate: '2026-06-15',
    dueDate: '2026-10-25', // Por vencer
    boundsDescription: 'Costado occidental de Calle 95.',
    notes: 'Predicación en comercios de 10:00 a 12:00.',
    polygon: [
      [4.6780, -74.0730],
      [4.6815, -74.0695],
      [4.6785, -74.0665],
      [4.6750, -74.0700],
    ],
    center: [4.6782, -74.0697],
    zoom: 16,
    noVisits: [],
    history: [],
  },
  {
    id: 'terr-map-04',
    number: '04',
    name: 'Colinas de Santa Rosa',
    type: 'edificios',
    zone: 'Zona Alta',
    estimatedHomes: 150,
    status: 'asignado',
    color: '#ef4444', // Vencido
    assignedDate: '2026-04-10',
    dueDate: '2026-08-10', // Vencido
    boundsDescription: 'Sector oriental entre Calle 104 y Calle 108.',
    notes: 'Conjuntos cerrados residenciales.',
    polygon: [
      [4.6940, -74.0740],
      [4.6975, -74.0705],
      [4.6945, -74.0670],
      [4.6910, -74.0705],
    ],
    center: [4.6942, -74.0705],
    zoom: 16,
    noVisits: [
      {
        id: 'nv-02',
        address: 'Torre 4 Apto 302',
        residentName: 'Residente solicita no contacto',
        dateAdded: '2026-05-18',
        reason: 'No atender testigos de Jehová.',
        coordinates: [4.6943, -74.0702],
      },
    ],
    history: [],
  },
];
