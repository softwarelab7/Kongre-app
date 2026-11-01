// src/components/territories/TerritoryMapView.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Territory, TerritoryStatus, TerritoryType, Publisher } from '../../types';
import {
  MAP_TILE_PROVIDERS,
  MapTileLayerKey,
  getTerritoryStatusColor,
  calculateCentroid,
  formatDistance,
  formatArea,
  calculatePerimeterMeters,
  calculateAreaSquareMeters,
  createTerritoryNumberIcon,
  createNoVisitIcon,
  exportTerritoriesToGeoJSON,
} from './TerritoryMapUtils';
import {
  Search,
  Filter,
  Layers,
  Navigation,
  Maximize2,
  Download,
  Plus,
  MapPin,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Edit2,
  Share2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  Compass,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface TerritoryMapViewProps {
  territories: Territory[];
  publishersMap: Map<string, Publisher>;
  settings: any;
  onSelectTerritory: (territory: Territory) => void;
  onEditPolygon: (territory: Territory) => void;
  onOpenDigitalCard: (territory: Territory) => void;
  onAssignTerritory: (territory: Territory) => void;
  onReturnTerritory: (territory: Territory) => void;
  onCreateTerritory: () => void;
  onSeedSamplePolygons?: () => void;
}

export const TerritoryMapView: React.FC<TerritoryMapViewProps> = ({
  territories,
  publishersMap,
  settings,
  onSelectTerritory,
  onEditPolygon,
  onOpenDigitalCard,
  onAssignTerritory,
  onReturnTerritory,
  onCreateTerritory,
  onSeedSamplePolygons,
}) => {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonsGroupRef = useRef<L.FeatureGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Filters & State
  const [activeTile, setActiveTile] = useState<MapTileLayerKey>('positron');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponible' | 'asignado' | 'vencido' | 'por_vencer'>('todos');
  const [zoneFilter, setZoneFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Extract distinct zones
  const zones = useMemo(() => {
    const set = new Set<string>();
    territories.forEach((t) => {
      if (t.zone) set.add(t.zone);
    });
    return Array.from(set).sort();
  }, [territories]);

  // Territories with active polygon or center coordinates
  const territoriesWithCoords = useMemo(() => {
    return territories.filter((t) => (t.polygon && t.polygon.length >= 3) || t.center);
  }, [territories]);

  // Filtered territories based on search and filters
  const filteredTerritories = useMemo(() => {
    return territories.filter((t) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesNumber = t.number.toLowerCase().includes(query);
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesZone = t.zone.toLowerCase().includes(query);
        const assignee = t.currentAssigneeId ? publishersMap.get(t.currentAssigneeId)?.name?.toLowerCase() : '';
        const matchesAssignee = assignee?.includes(query);
        if (!matchesNumber && !matchesName && !matchesZone && !matchesAssignee) {
          return false;
        }
      }

      // Zone
      if (zoneFilter !== 'todos' && t.zone !== zoneFilter) return false;

      // Type
      if (typeFilter !== 'todos' && t.type !== typeFilter) return false;

      // Status
      if (statusFilter !== 'todos') {
        const today = new Date();
        const fifteenDaysFromNow = new Date();
        fifteenDaysFromNow.setDate(today.getDate() + 15);

        const isExpired = t.dueDate && new Date(t.dueDate) < today && t.status === 'asignado';
        const isExpiringSoon =
          t.dueDate &&
          new Date(t.dueDate) >= today &&
          new Date(t.dueDate) <= fifteenDaysFromNow &&
          t.status === 'asignado';

        if (statusFilter === 'disponible' && t.status !== 'disponible') return false;
        if (statusFilter === 'asignado' && (t.status !== 'asignado' || isExpired)) return false;
        if (statusFilter === 'vencido' && !isExpired) return false;
        if (statusFilter === 'por_vencer' && !isExpiringSoon) return false;
      }

      return true;
    });
  }, [territories, searchTerm, zoneFilter, typeFilter, statusFilter, publishersMap]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initial center fallback
      let initialCenter: [number, number] = [4.6097, -74.0817]; // Bogotá
      if (settings?.territoryMapCenter && Array.isArray(settings.territoryMapCenter)) {
        initialCenter = settings.territoryMapCenter;
      } else if (settings?.hallCoordinates && Array.isArray(settings.hallCoordinates)) {
        initialCenter = settings.hallCoordinates;
      } else if (territoriesWithCoords.length > 0) {
        const first = territoriesWithCoords[0];
        initialCenter = first.polygon && first.polygon.length > 0 ? calculateCentroid(first.polygon) : first.center || initialCenter;
      }

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: settings?.territoryMapZoom || 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile Layer
      const provider = MAP_TILE_PROVIDERS[activeTile];
      const tile = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tile;

      const group = L.featureGroup().addTo(map);
      polygonsGroupRef.current = group;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        polygonsGroupRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, []);

  // 2. Change Tile Layer
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

  // 3. Render Polygons, Markers & Tooltips
  const renderMapLayers = useCallback(() => {
    const map = mapInstanceRef.current;
    const group = polygonsGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Kingdom Hall pin if configured
    if (settings?.hallCoordinates && Array.isArray(settings.hallCoordinates)) {
      const [hLat, hLng] = settings.hallCoordinates;
      const hallMarker = L.marker([hLat, hLng], {
        icon: L.divIcon({
          className: 'hall-marker',
          html: `
            <div style="
              background: #4C3AED;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 4px;
              border: 2px solid white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              transform: translate(-50%, -50%);
              white-space: nowrap;
            ">
              <span>🏛️</span>
              <span>Salón del Reino</span>
            </div>
          `,
          iconSize: [120, 26],
          iconAnchor: [60, 13],
        }),
      });
      hallMarker.bindTooltip(settings.congregationName || 'Salón del Reino');
      group.addLayer(hallMarker);
    }

    // Render Territory Polygons
    filteredTerritories.forEach((t) => {
      const hasPolygon = t.polygon && t.polygon.length >= 3;
      const centerCoords = hasPolygon ? calculateCentroid(t.polygon!) : t.center;
      const colorInfo = getTerritoryStatusColor(t.status, t.dueDate, t.color);
      const isSelected = selectedTerritory?.id === t.id;

      // Draw Polygon
      if (hasPolygon) {
        const latLngs = t.polygon!.map((p) => L.latLng(p[0], p[1]));
        const polygon = L.polygon(latLngs, {
          color: colorInfo.border,
          weight: isSelected ? 4 : 2.5,
          opacity: 0.95,
          fillColor: colorInfo.fill,
          fillOpacity: isSelected ? 0.45 : 0.22,
          smoothFactor: 1,
        });

        // Hover effect
        polygon.on('mouseover', () => {
          if (selectedTerritory?.id !== t.id) {
            polygon.setStyle({
              weight: 4,
              fillOpacity: 0.38,
            });
          }
        });

        polygon.on('mouseout', () => {
          if (selectedTerritory?.id !== t.id) {
            polygon.setStyle({
              weight: 2.5,
              fillOpacity: 0.22,
            });
          }
        });

        // Click on polygon selects territory
        polygon.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setSelectedTerritory(t);
          map.fitBounds(polygon.getBounds(), { padding: [50, 50], maxZoom: 17 });
        });

        // Tooltip
        const assignee = t.currentAssigneeId ? publishersMap.get(t.currentAssigneeId)?.name : null;
        const tooltipHtml = `
          <div class="text-xs">
            <span class="font-bold">#${t.number} - ${t.name}</span>
            <div class="text-[10px] opacity-80">${t.zone} • ${colorInfo.label}</div>
            ${assignee ? `<div class="text-[10px] text-blue-300">👤 ${assignee}</div>` : ''}
          </div>
        `;
        polygon.bindTooltip(tooltipHtml, {
          sticky: true,
          direction: 'top',
          offset: [0, -10],
        });

        group.addLayer(polygon);
      }

      // Draw Number Marker at center
      if (centerCoords) {
        const marker = L.marker([centerCoords[0], centerCoords[1]], {
          icon: createTerritoryNumberIcon(t.number, colorInfo.fill, t.status),
        });

        marker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setSelectedTerritory(t);
          if (hasPolygon) {
            const bounds = L.latLngBounds(t.polygon!.map((p) => L.latLng(p[0], p[1])));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
          } else {
            map.setView([centerCoords[0], centerCoords[1]], 16);
          }
        });

        group.addLayer(marker);
      }

      // Draw "No Visitar" danger pins if coordinates exist
      if (t.noVisits && t.noVisits.length > 0) {
        t.noVisits.forEach((nv) => {
          if (nv.coordinates && Array.isArray(nv.coordinates)) {
            const nvMarker = L.marker([nv.coordinates[0], nv.coordinates[1]], {
              icon: createNoVisitIcon(),
            });
            nvMarker.bindTooltip(`
              <div class="text-xs text-rose-300 font-bold">
                ⚠️ No Visitar: ${nv.address}
                <div class="text-[10px] text-white opacity-80">${nv.reason || 'Petición expresa'}</div>
              </div>
            `);
            group.addLayer(nvMarker);
          }
        });
      }
    });
  }, [filteredTerritories, selectedTerritory, publishersMap, settings]);

  useEffect(() => {
    renderMapLayers();
  }, [renderMapLayers]);

  // Fit all territories bounds
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    const group = polygonsGroupRef.current;
    if (!map || !group) return;

    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  // Locate User (GPS)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador o dispositivo no soporta geolocalización.', 'warning');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const map = mapInstanceRef.current;
        if (!map) return;

        const { latitude, longitude } = pos.coords;

        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }

        const userMarker = L.marker([latitude, longitude], {
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

        userMarker.bindTooltip('Tu ubicación actual (GPS)').openTooltip();
        userMarkerRef.current = userMarker;

        map.setView([latitude, longitude], 17);
      },
      (err) => {
        setIsLocating(false);
        showToast(`No se pudo obtener la ubicación GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Export GeoJSON
  const handleExportGeoJson = () => {
    const geoJson = exportTerritoriesToGeoJSON(territories);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Territorios_Kongre_${new Date().toISOString().slice(0, 10)}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Selected Territory details
  const selectedAssignee = selectedTerritory?.currentAssigneeId
    ? publishersMap.get(selectedTerritory.currentAssigneeId)
    : null;

  const selectedPerimeter = selectedTerritory?.polygon
    ? calculatePerimeterMeters(selectedTerritory.polygon)
    : 0;

  const selectedArea = selectedTerritory?.polygon
    ? calculateAreaSquareMeters(selectedTerritory.polygon)
    : 0;

  const selectedStatusInfo = selectedTerritory
    ? getTerritoryStatusColor(selectedTerritory.status, selectedTerritory.dueDate, selectedTerritory.color)
    : null;

  return (
    <div className="relative w-full h-[76vh] min-h-[550px] rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col bg-zinc-950">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: Search & Quick Filters */}
        <div className="flex items-center gap-2 pointer-events-auto flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar #, nombre, zona o publicador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl kg-glass-surface border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white text-xs shadow-xl focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all placeholder:text-zinc-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter Chips */}
          <div className="hidden lg:flex items-center gap-1 kg-glass-surface p-1 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl text-xs">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Todos ({territories.length})
            </button>
            <button
              onClick={() => setStatusFilter('disponible')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                statusFilter === 'disponible'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Disponibles</span>
            </button>
            <button
              onClick={() => setStatusFilter('asignado')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                statusFilter === 'asignado'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Asignados</span>
            </button>
            <button
              onClick={() => setStatusFilter('vencido')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                statusFilter === 'vencido'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Vencidos</span>
            </button>
          </div>

          {/* Zones Dropdown */}
          {zones.length > 0 && (
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="kg-glass-surface border border-zinc-200/80 dark:border-white/10 text-zinc-800 dark:text-white px-3.5 py-2.5 rounded-2xl text-xs shadow-xl focus:ring-2 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todas las Zonas</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Side: Map Controls & Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Base Layer Switcher */}
          <div className="flex items-center kg-glass-surface p-1 rounded-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl">
            {(Object.keys(MAP_TILE_PROVIDERS) as MapTileLayerKey[]).map((key) => {
              const prov = MAP_TILE_PROVIDERS[key];
              const isActive = activeTile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChangeTile(key)}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  title={prov.name}
                >
                  <span>{prov.icon}</span>
                  <span className="hidden md:inline">{prov.name}</span>
                </button>
              );
            })}
          </div>

          {/* Fit All Button */}
          <button
            type="button"
            onClick={handleFitAll}
            className="p-2.5 rounded-2xl kg-glass-surface border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 shadow-xl hover:bg-zinc-100 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Centrar todos los territorios"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* GPS Location Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="p-2.5 rounded-2xl kg-glass-surface border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 shadow-xl hover:bg-zinc-100 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            title="Mi ubicación GPS en el mapa"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Export GeoJSON Button */}
          <button
            type="button"
            onClick={handleExportGeoJson}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl kg-glass-surface border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-200 shadow-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Descargar territorios en formato GeoJSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>

          {/* New Territory Button */}
          <button
            type="button"
            onClick={onCreateTerritory}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xl shadow-indigo-500/25 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Territorio</span>
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Banner when no territories have coordinates */}
      {territoriesWithCoords.length === 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] max-w-lg w-[90%] bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-2xl text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
              ¡Comienza a trazar los mapas de tu congregación!
            </h4>
            <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] mt-1">
              Tus territorios aún no tienen polígonos dibujados en OpenStreetMap. Puedes delimitar el perímetro de cualquier territorio en segundos haciendo clic en su botón de mapa.
            </p>
          </div>
          {onSeedSamplePolygons && (
            <button
              onClick={onSeedSamplePolygons}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cargar polígonos de muestra para probar</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Bottom Card: Selected Territory Details */}
      {selectedTerritory && selectedStatusInfo && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[400] kg-glass-surface kg-sheen-top p-5 rounded-3xl border border-zinc-200/80 dark:border-white/15 shadow-2xl space-y-3.5 animate-slide-up">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: selectedStatusInfo.fill }}
                className="w-10 h-10 rounded-2xl text-white font-mono font-black text-sm flex items-center justify-center shadow-md shrink-0"
              >
                #{selectedTerritory.number}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                  {selectedTerritory.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedTerritory.zone} • ~{selectedTerritory.estimatedHomes} hogares
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTerritory(null)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status & Metrics Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-bold border ${selectedStatusInfo.badgeClass}`}>
              {selectedStatusInfo.label}
            </span>
            {selectedPerimeter > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-mono font-medium">
                Perímetro: {formatDistance(selectedPerimeter)}
              </span>
            )}
            {selectedArea > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 font-mono font-medium">
                Área: {formatArea(selectedArea)}
              </span>
            )}
          </div>

          {/* Assignee / Dates */}
          {selectedTerritory.status === 'asignado' && (
            <div className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedAssignee ? selectedAssignee.name : 'Hermano asignado'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                <span>Asignado: {selectedTerritory.assignedDate || 'N/A'}</span>
                <span>Vence: {selectedTerritory.dueDate || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* No Visit Warning Indicator */}
          {selectedTerritory.noVisits && selectedTerritory.noVisits.length > 0 && (
            <div className="px-3 py-2 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{selectedTerritory.noVisits.length} casa(s) con solicitud de NO VISITAR</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <button
              onClick={() => onOpenDigitalCard(selectedTerritory)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tarjeta Digital</span>
            </button>
            <button
              onClick={() => onEditPolygon(selectedTerritory)}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-white font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Polígono</span>
            </button>
            {selectedTerritory.status === 'disponible' ? (
              <button
                onClick={() => onAssignTerritory(selectedTerritory)}
                className="col-span-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Asignar a un Publicador</span>
              </button>
            ) : (
              <button
                onClick={() => onReturnTerritory(selectedTerritory)}
                className="col-span-2 px-3.5 py-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-white font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Registrar Devolución</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
