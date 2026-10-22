// src/components/territories/TerritoryPolygonEditorModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Territory } from '../../types';
import {
  MAP_TILE_PROVIDERS,
  MapTileLayerKey,
  calculateCentroid,
  calculatePerimeterMeters,
  calculateAreaSquareMeters,
  formatDistance,
  formatArea,
  parseGeoJSONToCoordinates,
} from './TerritoryMapUtils';
import {
  X,
  Save,
  Trash2,
  Undo2,
  Navigation,
  Search,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  HelpCircle,
  Download,
  Upload,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TerritoryPolygonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  territory: Territory;
  onSave: (polygon: [number, number][], center: [number, number], color?: string) => void;
  defaultCenter?: [number, number];
}

const PRESET_COLORS = [
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Violeta', value: '#8b5cf6' },
  { label: 'Ámbar', value: '#f59e0b' },
  { label: 'Rubí', value: '#ec4899' },
  { label: 'Cian', value: '#06b6d4' },
  { label: 'Naranja', value: '#f97316' },
];

export const TerritoryPolygonEditorModal: React.FC<TerritoryPolygonEditorModalProps> = ({
  isOpen,
  onClose,
  territory,
  onSave,
  defaultCenter = [4.6097, -74.0817], // Bogotá default
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);

  // Local state for vertices: [lat, lng][]
  const [vertices, setVertices] = useState<[number, number][]>(() => {
    return territory.polygon && territory.polygon.length > 0 ? [...territory.polygon] : [];
  });

  const [selectedColor, setSelectedColor] = useState<string>(
    territory.color || PRESET_COLORS[0].value
  );

  const [activeTile, setActiveTile] = useState<MapTileLayerKey>('positron');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showGeoJsonModal, setShowGeoJsonModal] = useState(false);
  const [geoJsonInput, setGeoJsonInput] = useState('');

  // Keep a ref to vertices to avoid stale closures in Leaflet event listeners
  const verticesRef = useRef<[number, number][]>(vertices);
  useEffect(() => {
    verticesRef.current = vertices;
  }, [vertices]);

  const selectedColorRef = useRef<string>(selectedColor);
  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  // Synchronize state when territory changes
  useEffect(() => {
    if (isOpen) {
      const initial = territory.polygon && territory.polygon.length > 0 ? [...territory.polygon] : [];
      setVertices(initial);
      setSelectedColor(territory.color || PRESET_COLORS[0].value);
    }
  }, [isOpen, territory]);

  // Initialize or update Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Determine initial center
      let initialCenter: [number, number] = defaultCenter;
      let initialZoom = 15;

      if (territory.polygon && territory.polygon.length > 0) {
        initialCenter = calculateCentroid(territory.polygon);
      } else if (territory.center) {
        initialCenter = territory.center;
      }

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add Base Tile Layer
      const provider = MAP_TILE_PROVIDERS[activeTile];
      const tile = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tile;

      // Click on map to add vertex
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newCoord: [number, number] = [Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))];
        setVertices((prev) => [...prev, newCoord]);
      });

      mapInstanceRef.current = map;

      // Fit bounds if polygon exists
      if (territory.polygon && territory.polygon.length >= 3) {
        const bounds = L.latLngBounds(territory.polygon.map((p) => L.latLng(p[0], p[1])));
        setTimeout(() => {
          map.fitBounds(bounds, { padding: [40, 40] });
        }, 150);
      }
    }

    return () => {
      // Do not destroy map on every rerender, only on modal unmount
    };
  }, [isOpen, defaultCenter, territory]);

  // Clean up map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      polygonLayerRef.current = null;
      vertexMarkersRef.current = [];
    }
  }, [isOpen]);

  // Update Base Tile Layer
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

  // Re-render polygon and draggable vertex handles whenever vertices or color change
  const renderPolygonAndHandles = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Remove old vertex markers
    vertexMarkersRef.current.forEach((m) => map.removeLayer(m));
    vertexMarkersRef.current = [];

    // 2. Remove old polygon
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    const currentPts = verticesRef.current;
    const currentColor = selectedColorRef.current;

    // 3. Draw polygon if at least 2 points exist
    if (currentPts.length >= 2) {
      const latLngs = currentPts.map((p) => L.latLng(p[0], p[1]));
      const poly = L.polygon(latLngs, {
        color: currentColor,
        weight: 3,
        opacity: 0.9,
        fillColor: currentColor,
        fillOpacity: 0.25,
        smoothFactor: 1,
      }).addTo(map);
      polygonLayerRef.current = poly;
    }

    // 4. Create draggable handles for each vertex
    currentPts.forEach((pt, index) => {
      const isStart = index === 0;
      const handleHtml = `
        <div style="
          width: 16px;
          height: 16px;
          background: ${isStart ? '#10b981' : '#ffffff'};
          border: 3px solid ${currentColor};
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          cursor: move;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 800;
          color: ${isStart ? '#ffffff' : '#334155'};
        ">
          ${isStart ? '★' : index + 1}
        </div>
      `;

      const marker = L.marker([pt[0], pt[1]], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-polygon-vertex',
          html: handleHtml,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map);

      // Drag listener
      marker.on('drag', (e: any) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        const updated = [...verticesRef.current];
        updated[index] = [newLat, newLng];
        verticesRef.current = updated;

        // Update polygon path live during drag
        if (polygonLayerRef.current) {
          polygonLayerRef.current.setLatLngs(updated.map((p) => L.latLng(p[0], p[1])));
        }
      });

      marker.on('dragend', () => {
        setVertices([...verticesRef.current]);
      });

      // Right click or click to delete vertex
      marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        const updated = verticesRef.current.filter((_, i) => i !== index);
        setVertices(updated);
      });

      vertexMarkersRef.current.push(marker);
    });
  }, []);

  // Trigger render whenever vertices or color state change
  useEffect(() => {
    renderPolygonAndHandles();
  }, [vertices, selectedColor, renderPolygonAndHandles]);

  // Actions
  const handleUndo = () => {
    setVertices((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    if (vertices.length > 0) {
      if (window.confirm('¿Deseas borrar todos los puntos del polígono de este territorio?')) {
        setVertices([]);
      }
    }
  };

  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || vertices.length === 0) return;
    const bounds = L.latLngBounds(vertices.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40] });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([pos.coords.latitude, pos.coords.longitude], 17);
        }
      },
      (err) => {
        setIsLocating(false);
        alert(`No se pudo obtener la ubicación: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.trim()
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'es',
        },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([lat, lon], 17);
        }
      } else {
        setSearchError('No se encontraron resultados para esta búsqueda.');
      }
    } catch {
      setSearchError('Error al contactar el servicio de geocodificación.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (vertices.length > 0 && vertices.length < 3) {
      alert('Un territorio debe tener al menos 3 puntos para formar un polígono perimetral cerrado.');
      return;
    }

    const center = calculateCentroid(vertices);
    onSave(vertices, center, selectedColor);
    onClose();
  };

  // GeoJSON Import Handler
  const handleImportGeoJson = () => {
    try {
      const parsed = JSON.parse(geoJsonInput);
      const coords = parseGeoJSONToCoordinates(parsed);
      if (coords && coords.length >= 3) {
        setVertices(coords);
        setShowGeoJsonModal(false);
        setGeoJsonInput('');
        if (mapInstanceRef.current) {
          const bounds = L.latLngBounds(coords.map((p) => L.latLng(p[0], p[1])));
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      } else {
        alert('No se encontró un polígono válido con al menos 3 coordenadas en el GeoJSON.');
      }
    } catch {
      alert('El formato no es un JSON válido. Asegúrate de pegar un GeoJSON correcto.');
    }
  };

  // Calculations
  const perimeter = calculatePerimeterMeters(vertices);
  const area = calculateAreaSquareMeters(vertices);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Delimitar polígono del territorio ${territory.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              #{territory.number}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Delimitar Polígono: {territory.name}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {territory.zone}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en el mapa para añadir vértices. Arrastra los puntos para ajustar manzanas o calles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              aria-label="Instrucciones y ayuda para delimitar territorio"
              aria-expanded={showHelp}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Instrucciones y ayuda"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar editor de polígono de territorio"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Help Banner (Collapsible) */}
        {showHelp && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-900/50 px-4 py-2.5 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">¿Cómo trazar los límites del territorio?</p>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-800 dark:text-indigo-300">
                <li>Haz clic en cada esquina de la manzana o límite natural (avenida, río, sendero).</li>
                <li>Arrastra cualquier punto circular blanco para corregir la posición con precisión.</li>
                <li>Haz clic derecho sobre un punto para eliminarlo.</li>
                <li>Se recomiendan al menos 4 puntos para un perímetro cerrado.</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label="Ocultar instrucciones de ayuda"
              className="text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar & Search */}
        <div className="p-3 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search box */}
          <form onSubmit={handleSearchAddress} className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                aria-label="Buscar calle, barrio o ciudad en el mapa"
                placeholder="Buscar calle, barrio o ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Buscando...' : 'Ir'}
            </button>
          </form>

          {/* Color Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">Color:</span>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                title={c.label}
                aria-label={`Seleccionar color ${c.label}`}
                style={{ backgroundColor: c.value }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedColor === c.value ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          {/* Map Layer Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(Object.keys(MAP_TILE_PROVIDERS) as MapTileLayerKey[]).map((key) => {
              const prov = MAP_TILE_PROVIDERS[key];
              const isActive = activeTile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChangeTile(key)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{prov.icon}</span>
                  <span className="hidden sm:inline">{prov.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tools & GeoJSON */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGeoJsonModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium transition-colors"
              title="Importar o exportar coordenadas GeoJSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>GeoJSON</span>
            </button>
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
              title="Centrar en mi ubicación GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS</span>
            </button>
          </div>
        </div>

        {searchError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs px-4 py-1.5 border-b border-rose-200 dark:border-rose-900/50">
            {searchError}
          </div>
        )}

        {/* Map Canvas (Flex-1) */}
        <div className="flex-1 relative w-full h-full min-h-[300px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Action Controls on Top-Right of Map */}
          <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={vertices.length === 0}
              aria-label="Deshacer último punto del polígono"
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Deshacer último punto"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFitBounds}
              disabled={vertices.length === 0}
              aria-label="Centrar mapa en el polígono"
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Centrar en polígono"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={vertices.length === 0}
              aria-label="Limpiar todo el polígono"
              className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-rose-600 dark:text-rose-400 shadow-md backdrop-blur-md border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-40"
              title="Limpiar todo el polígono"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Statistics & Save Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {/* Live Metrics */}
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-slate-400 mr-1.5">Vértices:</span>
              <strong className="text-slate-800 dark:text-slate-100 font-bold">{vertices.length}</strong>
            </div>
            <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-slate-400 mr-1.5">Perímetro:</span>
              <strong className="text-slate-800 dark:text-slate-100 font-bold">{formatDistance(perimeter)}</strong>
            </div>
            <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-slate-400 mr-1.5">Área aprox:</span>
              <strong className="text-slate-800 dark:text-slate-100 font-bold">{formatArea(area)}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Límites</span>
            </button>
          </div>
        </div>

        {/* Modal GeoJSON Import/Export */}
        {showGeoJsonModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Importar o exportar coordenadas GeoJSON"
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Importar o Exportar GeoJSON
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGeoJsonModal(false)}
                  aria-label="Cerrar ventana de GeoJSON"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pega aquí las coordenadas o un objeto GeoJSON de Google Earth, QGIS o tu congregación para cargar el polígono:
              </p>

              <textarea
                value={geoJsonInput}
                onChange={(e) => setGeoJsonInput(e.target.value)}
                placeholder='{"type": "Polygon", "coordinates": [[[...]]]}'
                rows={6}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const sample = JSON.stringify(
                      {
                        type: 'Polygon',
                        coordinates: [
                          vertices.map(([lat, lng]) => [lng, lat]),
                        ],
                      },
                      null,
                      2
                    );
                    setGeoJsonInput(sample);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Generar GeoJSON de puntos actuales
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGeoJsonModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportGeoJson}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Importar al Mapa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
