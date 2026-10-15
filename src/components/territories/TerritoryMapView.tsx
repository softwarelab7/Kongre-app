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
              background: #4f46e5;
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
      alert('Tu navegador o dispositivo no soporta geolocalización.');
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
        alert(`No se pudo obtener la ubicación GPS: ${err.message}`);
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
    <div className="relative w-full h-[76vh] min-h-[550px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col bg-slate-900">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Side: Search & Quick Filters */}
        <div className="flex items-center gap-2 pointer-events-auto flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar #, nombre, zona o publicador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs shadow-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter Chips */}
          <div className="hidden lg:flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'todos'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todos ({territories.length})
            </button>
            <button
              onClick={() => setStatusFilter('disponible')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                statusFilter === 'disponible'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Disponibles</span>
            </button>
            <button
              onClick={() => setStatusFilter('asignado')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                statusFilter === 'asignado'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Asignados</span>
            </button>
            <button
              onClick={() => setStatusFilter('vencido')}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                statusFilter === 'vencido'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Vencidos</span>
            </button>
          </div>

          {/* Zones Dropdown */}
          {zones.length > 0 && (
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs shadow-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
          <div className="flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
            {(Object.keys(MAP_TILE_PROVIDERS) as MapTileLayerKey[]).map((key) => {
              const prov = MAP_TILE_PROVIDERS[key];
              const isActive = activeTile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChangeTile(key)}
                  className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
            className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Centrar todos los territorios"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* GPS Location Button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Mi ubicación GPS en el mapa"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Export GeoJSON Button */}
          <button
            type="button"
            onClick={handleExportGeoJson}
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            title="Descargar territorios en formato GeoJSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>

          {/* New Territory Button */}
          <button
            type="button"
            onClick={onCreateTerritory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/20 text-xs font-semibold transition-all"
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] max-w-lg w-[90%] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-2xl text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              ¡Comienza a trazar los mapas de tu congregación!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
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
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 animate-slide-up">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: selectedStatusInfo.fill }}
                className="w-9 h-9 rounded-xl text-white font-black text-sm flex items-center justify-center shadow-md"
              >
                #{selectedTerritory.number}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                  {selectedTerritory.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedTerritory.zone} • ~{selectedTerritory.estimatedHomes} hogares
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTerritory(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status & Metrics Pills */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full font-medium border ${selectedStatusInfo.badgeClass}`}>
              {selectedStatusInfo.label}
            </span>
            {selectedPerimeter > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                Perímetro: {formatDistance(selectedPerimeter)}
              </span>
            )}
            {selectedArea > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                Área: {formatArea(selectedArea)}
              </span>
            )}
          </div>

          {/* Assignee / Dates */}
          {selectedTerritory.status === 'asignado' && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedAssignee ? selectedAssignee.name : 'Hermano asignado'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Asignado: {selectedTerritory.assignedDate || 'N/A'}</span>
                <span>Vence: {selectedTerritory.dueDate || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* No Visit Warning Indicator */}
          {selectedTerritory.noVisits && selectedTerritory.noVisits.length > 0 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{selectedTerritory.noVisits.length} casa(s) con solicitud de NO VISITAR</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <button
              onClick={() => onOpenDigitalCard(selectedTerritory)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tarjeta Digital</span>
            </button>
            <button
              onClick={() => onEditPolygon(selectedTerritory)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Polígono</span>
            </button>
            {selectedTerritory.status === 'disponible' ? (
              <button
                onClick={() => onAssignTerritory(selectedTerritory)}
                className="col-span-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Asignar a un Publicador</span>
              </button>
            ) : (
              <button
                onClick={() => onReturnTerritory(selectedTerritory)}
                className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
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
