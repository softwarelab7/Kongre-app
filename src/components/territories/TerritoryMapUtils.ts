// src/components/territories/TerritoryMapUtils.ts
import L from 'leaflet';
import { Territory, TerritoryStatus } from '../../types';

export type MapTileLayerKey = 'positron' | 'dark' | 'satellite' | 'osm';

export interface MapTileProvider {
  id: MapTileLayerKey;
  name: string;
  icon: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const MAP_TILE_PROVIDERS: Record<MapTileLayerKey, MapTileProvider> = {
  positron: {
    id: 'positron',
    name: 'Plano Claro',
    icon: '🗺️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  dark: {
    id: 'dark',
    name: 'Modo Noche',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  satellite: {
    id: 'satellite',
    name: 'Satélite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 19,
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    icon: '📌',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

/**
 * Paleta de colores temáticos y armónicos para estados de territorios
 */
export const getTerritoryStatusColor = (
  status: TerritoryStatus,
  dueDate?: string,
  customColor?: string
): { border: string; fill: string; badgeClass: string; label: string } => {
  if (customColor) {
    return {
      border: customColor,
      fill: customColor,
      badgeClass: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
      label: status === 'disponible' ? 'Disponible' : 'Asignado',
    };
  }

  const today = new Date();
  const fifteenDaysFromNow = new Date();
  fifteenDaysFromNow.setDate(today.getDate() + 15);

  const isExpired = dueDate && new Date(dueDate) < today && status === 'asignado';
  const isExpiringSoon =
    dueDate &&
    new Date(dueDate) >= today &&
    new Date(dueDate) <= fifteenDaysFromNow &&
    status === 'asignado';

  if (isExpired) {
    return {
      border: '#ef4444',
      fill: '#ef4444',
      badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      label: 'Vencido (> 4 meses)',
    };
  }

  if (isExpiringSoon) {
    return {
      border: '#f59e0b',
      fill: '#f59e0b',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      label: 'Por Vencer (< 15 días)',
    };
  }

  if (status === 'asignado') {
    return {
      border: '#3b82f6',
      fill: '#3b82f6',
      badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      label: 'Asignado',
    };
  }

  // disponible
  return {
    border: '#10b981',
    fill: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    label: 'Disponible',
  };
};

/**
 * Calcula el centroide geométrico de un polígono [lat, lng][]
 */
export const calculateCentroid = (coords: [number, number][]): [number, number] => {
  if (!coords || coords.length === 0) return [4.6097, -74.0817]; // Bogotá default fallback
  if (coords.length === 1) return coords[0];

  let sumLat = 0;
  let sumLng = 0;
  for (const [lat, lng] of coords) {
    sumLat += lat;
    sumLng += lng;
  }
  return [sumLat / coords.length, sumLng / coords.length];
};

/**
 * Calcula el perímetro aproximado en metros o kilómetros
 */
export const calculatePerimeterMeters = (coords: [number, number][]): number => {
  if (!coords || coords.length < 2) return 0;
  let totalMeters = 0;
  for (let i = 0; i < coords.length; i++) {
    const nextIdx = (i + 1) % coords.length;
    const p1 = L.latLng(coords[i][0], coords[i][1]);
    const p2 = L.latLng(coords[nextIdx][0], coords[nextIdx][1]);
    totalMeters += p1.distanceTo(p2);
  }
  return Math.round(totalMeters);
};

/**
 * Calcula el área superficial aproximada de un polígono en metros cuadrados
 */
export const calculateAreaSquareMeters = (coords: [number, number][]): number => {
  if (!coords || coords.length < 3) return 0;

  // Proyección esférica de Gauss / Shoelace adaptada para pequeñas áreas terrestres
  const earthRadius = 6378137; // metros
  let total = 0;
  const len = coords.length;

  for (let i = 0; i < len; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % len];

    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const radLngDiff = ((lng2 - lng1) * Math.PI) / 180;

    total += radLngDiff * (2 + Math.sin(radLat1) + Math.sin(radLat2));
  }

  const area = Math.abs((total * earthRadius * earthRadius) / 4);
  return Math.round(area);
};

/**
 * Formatea metros o kilómetros de forma amigable
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters} m`;
};

/**
 * Formatea metros cuadrados o hectáreas
 */
export const formatArea = (sqMeters: number): string => {
  if (sqMeters >= 10000) {
    return `${(sqMeters / 10000).toFixed(2)} ha`;
  }
  return `${sqMeters.toLocaleString()} m²`;
};

/**
 * Encuentra el centro y límites óptimos para todos los territorios con coordenadas
 */
export const getTerritoriesBounds = (
  territories: Territory[]
): L.LatLngBounds | null => {
  const allPoints: [number, number][] = [];

  territories.forEach((t) => {
    if (t.polygon && t.polygon.length > 0) {
      allPoints.push(...t.polygon);
    } else if (t.center) {
      allPoints.push(t.center);
    }
  });

  if (allPoints.length === 0) return null;
  return L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1])));
};

/**
 * Crea un icono HTML personalizado para el número del territorio
 */
export const createTerritoryNumberIcon = (
  number: string,
  color: string,
  status: TerritoryStatus
): L.DivIcon => {
  return L.divIcon({
    className: 'custom-territory-marker',
    html: `
      <div style="
        background: ${color};
        color: #ffffff;
        font-weight: 800;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 9999px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2px solid #ffffff;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transform: translate(-50%, -50%);
      ">
        <span>#${number}</span>
      </div>
    `,
    iconSize: [40, 20],
    iconAnchor: [20, 10],
  });
};

/**
 * Crea un icono de advertencia para casas de "No Visitar"
 */
export const createNoVisitIcon = (): L.DivIcon => {
  return L.divIcon({
    className: 'custom-novisit-marker',
    html: `
      <div style="
        background: #ef4444;
        color: #ffffff;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(239, 68, 68, 0.45);
        border: 2px solid #ffffff;
        transform: translate(-50%, -50%);
        font-size: 13px;
      ">
        ⚠️
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

/**
 * Exporta territorios en formato GeoJSON FeatureCollection estándar
 */
export const exportTerritoriesToGeoJSON = (territories: Territory[]) => {
  const features = territories
    .filter((t) => (t.polygon && t.polygon.length >= 3) || t.center)
    .map((t) => {
      if (t.polygon && t.polygon.length >= 3) {
        // GeoJSON requiere formato [lng, lat]
        const ring = t.polygon.map(([lat, lng]) => [lng, lat]);
        // Cerrar el polígono si no está cerrado
        if (
          ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1]
        ) {
          ring.push(ring[0]);
        }
        return {
          type: 'Feature' as const,
          properties: {
            id: t.id,
            number: t.number,
            name: t.name,
            zone: t.zone,
            type: t.type,
            status: t.status,
            estimatedHomes: t.estimatedHomes,
            assignedDate: t.assignedDate,
            dueDate: t.dueDate,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [ring],
          },
        };
      }

      return {
        type: 'Feature' as const,
        properties: {
          id: t.id,
          number: t.number,
          name: t.name,
          zone: t.zone,
          type: t.type,
          status: t.status,
          estimatedHomes: t.estimatedHomes,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [t.center![1], t.center![0]],
        },
      };
    });

  return {
    type: 'FeatureCollection',
    name: 'Kongre_Territorios',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features,
  };
};

/**
 * Parsea un archivo o texto GeoJSON y extrae polígonos perimetrales
 */
export const parseGeoJSONToCoordinates = (
  geoJson: any
): [number, number][] | null => {
  try {
    if (!geoJson) return null;

    let coords: any[] = [];
    if (geoJson.type === 'FeatureCollection' && geoJson.features?.length > 0) {
      const feat = geoJson.features[0];
      if (feat.geometry?.type === 'Polygon') {
        coords = feat.geometry.coordinates[0];
      }
    } else if (geoJson.type === 'Feature' && geoJson.geometry?.type === 'Polygon') {
      coords = geoJson.geometry.coordinates[0];
    } else if (geoJson.type === 'Polygon' && geoJson.coordinates?.length > 0) {
      coords = geoJson.coordinates[0];
    }

    if (Array.isArray(coords) && coords.length >= 3) {
      // Convertir de [lng, lat] GeoJSON a [lat, lng] Leaflet
      return coords.map((c) => [Number(c[1]), Number(c[0])]);
    }
    return null;
  } catch {
    return null;
  }
};
