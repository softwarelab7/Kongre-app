// src/components/territories/TerritoryCardMap.tsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Territory } from '../../types';
import {
  MAP_TILE_PROVIDERS,
  MapTileLayerKey,
  calculateCentroid,
  createNoVisitIcon,
  getTerritoryStatusColor,
  calculatePerimeterMeters,
  calculateAreaSquareMeters,
  formatDistance,
  formatArea,
} from './TerritoryMapUtils';
import { Navigation, Maximize2, Layers, ExternalLink, Compass } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface TerritoryCardMapProps {
  territory: Territory;
  heightClass?: string;
}

export const TerritoryCardMap: React.FC<TerritoryCardMapProps> = ({
  territory,
  heightClass = 'h-[320px] sm:h-[380px]',
}) => {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);

  const [activeTile, setActiveTile] = useState<MapTileLayerKey>('positron');
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const hasPolygon = territory.polygon && territory.polygon.length >= 3;
  const centerCoords = hasPolygon
    ? calculateCentroid(territory.polygon!)
    : territory.center || [4.6097, -74.0817];

  const colorInfo = getTerritoryStatusColor(territory.status, territory.dueDate, territory.color);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: centerCoords,
        zoom: territory.zoom || 16,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Base tile
      const provider = MAP_TILE_PROVIDERS[activeTile];
      const tile = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tile;

      // Draw Polygon if available
      if (hasPolygon) {
        const latLngs = territory.polygon!.map((p) => L.latLng(p[0], p[1]));
        const polygon = L.polygon(latLngs, {
          color: colorInfo.border,
          weight: 3,
          opacity: 0.95,
          fillColor: colorInfo.fill,
          fillOpacity: 0.25,
        }).addTo(map);

        // Fit bounds
        const bounds = polygon.getBounds();
        map.fitBounds(bounds, { padding: [30, 30] });
      } else {
        // Marker for center
        L.marker(centerCoords, {
          icon: L.divIcon({
            className: 'center-pin',
            html: `
              <div style="
                background: ${colorInfo.fill};
                color: white;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 9999px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                border: 2px solid white;
                white-space: nowrap;
                transform: translate(-50%, -50%);
              ">
                #${territory.number} - ${territory.name}
              </div>
            `,
          }),
        }).addTo(map);
      }

      // Draw No-Visit addresses pins
      if (territory.noVisits && territory.noVisits.length > 0) {
        territory.noVisits.forEach((nv) => {
          if (nv.coordinates && Array.isArray(nv.coordinates)) {
            const marker = L.marker([nv.coordinates[0], nv.coordinates[1]], {
              icon: createNoVisitIcon(),
            }).addTo(map);

            marker.bindTooltip(`
              <div class="text-xs font-bold text-rose-300">
                ⚠️ NO VISITAR: ${nv.address}
                <div class="text-[10px] text-white opacity-80">${nv.reason || 'Petición expresa'}</div>
              </div>
            `);
          }
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        userGpsMarkerRef.current = null;
      }
    };
  }, [territory]);

  // Switch Base Tile
  const handleChangeTile = (key: MapTileLayerKey) => {
    setActiveTile(key);
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const provider = MAP_TILE_PROVIDERS[key];
    const newTile = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  };

  // Re-center
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (hasPolygon) {
      const bounds = L.latLngBounds(territory.polygon!.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView(centerCoords, 16);
    }
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Tu dispositivo no soporta geolocalización.', 'warning');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const map = mapInstanceRef.current;
        if (!map) return;

        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);

        if (userGpsMarkerRef.current) {
          map.removeLayer(userGpsMarkerRef.current);
        }

        const marker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'user-gps-pulse-marker',
            html: `
              <div class="pulse-ring"></div>
              <div class="core-dot"></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);

        marker.bindTooltip('Tu ubicación (GPS)').openTooltip();
        userGpsMarkerRef.current = marker;

        map.setView([latitude, longitude], 17);
      },
      (err) => {
        setIsLocating(false);
        showToast(`No se pudo obtener la señal GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Open Navigation in Google Maps app
  const handleOpenTurnByTurn = () => {
    const [lat, lng] = centerCoords;
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(navUrl, '_blank');
  };

  const perimeter = hasPolygon ? calculatePerimeterMeters(territory.polygon!) : 0;
  const area = hasPolygon ? calculateAreaSquareMeters(territory.polygon!) : 0;

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-zinc-200 dark:border-[#27272A] shadow-md bg-zinc-100 dark:bg-[#121216]`}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        {/* Layer Switcher */}
        <div className="flex flex-col bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => handleChangeTile(activeTile === 'satellite' ? 'positron' : 'satellite')}
            className="p-2 text-zinc-700 dark:text-[#E4E4E7] hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
            title={activeTile === 'satellite' ? 'Cambiar a plano urbano' : 'Cambiar a vista satelital'}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Locate Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-2 rounded-xl bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] shadow-md hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors disabled:opacity-50"
          title="Ver mi ubicación en el territorio (GPS)"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-500' : ''}`} />
        </button>

        {/* Recenter Territory */}
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 rounded-xl bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] shadow-md hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
          title="Centrar en el territorio"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Turn-by-Turn Navigation */}
        <button
          type="button"
          onClick={handleOpenTurnByTurn}
          className="p-2 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors"
          title="Abrir indicaciones de cómo llegar (Google Maps)"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Bottom Info Pill */}
      {hasPolygon && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-[#121216]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-md text-[11px] text-zinc-600 dark:text-[#D4D4D8] flex items-center gap-2 pointer-events-none">
          <span>📏 Perímetro: <strong>{formatDistance(perimeter)}</strong></span>
          <span>•</span>
          <span>📐 Área: <strong>{formatArea(area)}</strong></span>
        </div>
      )}
    </div>
  );
};
