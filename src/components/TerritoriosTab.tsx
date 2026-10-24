// src/components/TerritoriosTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { Territory, TerritoryType, TerritoryStatus, NoVisitAddress, TerritoryAssignmentRecord } from '../types';
import {
  Map,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Plus,
  Search,
  Filter,
  Share2,
  Printer,
  Eye,
  Edit2,
  Trash2,
  Home,
  Building2,
  TreePine,
  Phone,
  ShieldAlert,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  Compass,
  ArrowRight,
  RotateCcw,
  CalendarPlus,
  X,
  Check,
  Info,
  QrCode,
} from 'lucide-react';
import { DigitalTerritoryModal } from './DigitalTerritoryModal';
import { TerritoryMapView } from './territories/TerritoryMapView';
import { TerritoryPolygonEditorModal } from './territories/TerritoryPolygonEditorModal';
import { TerritoryCardMap } from './territories/TerritoryCardMap';
import { SAMPLE_TERRITORIES_WITH_POLYGONS } from './territories/sampleTerritoriesWithMaps';

export const TerritoriosTab: React.FC = () => {
  const {
    territories,
    publishers,
    publishersMap,
    settings,
    addTerritory,
    updateTerritory,
    deleteTerritory,
    assignTerritory,
    returnTerritory,
    extendTerritoryDueDate,
    addNoVisitAddress,
    removeNoVisitAddress,
  } = useCongregation();

  // View state
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'map' | 's13'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponible' | 'asignado' | 'vencido' | 'por_vencer'>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [zoneFilter, setZoneFilter] = useState<string>('todos');

  // Modals state
  const [assignModalTerritory, setAssignModalTerritory] = useState<Territory | null>(null);
  const [selectedPublisherId, setSelectedPublisherId] = useState('');
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assignDueDate, setAssignDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    return d.toISOString().slice(0, 10);
  });
  const [assignNotes, setAssignNotes] = useState('');

  const [returnModalTerritory, setReturnModalTerritory] = useState<Territory | null>(null);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState('');

  const [extendModalTerritory, setExtendModalTerritory] = useState<Territory | null>(null);
  const [extendNewDueDate, setExtendNewDueDate] = useState('');

  const [detailModalTerritory, setDetailModalTerritory] = useState<Territory | null>(null);
  const [digitalCardTerritory, setDigitalCardTerritory] = useState<Territory | null>(null);
  const [polygonEditorTerritory, setPolygonEditorTerritory] = useState<Territory | null>(null);

  const [editTerritoryModal, setEditTerritoryModal] = useState<Territory | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state for Create / Edit Territory
  const [formData, setFormData] = useState<{
    number: string;
    name: string;
    type: TerritoryType;
    zone: string;
    estimatedHomes: number;
    boundsDescription: string;
    mapUrl: string;
    notes: string;
  }>({
    number: '',
    name: '',
    type: 'residencial',
    zone: 'Zona Central',
    estimatedHomes: 80,
    boundsDescription: '',
    mapUrl: '',
    notes: '',
  });

  // No Visit form inside detail modal
  const [newNoVisitAddress, setNewNoVisitAddress] = useState('');
  const [newNoVisitName, setNewNoVisitName] = useState('');
  const [newNoVisitReason, setNewNoVisitReason] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Seed handler for demo map polygons
  const handleSeedSamplePolygons = () => {
    if (window.confirm('¿Deseas cargar 4 territorios de muestra con mapas y polígonos delimitados para probar el mapa interactivo?')) {
      SAMPLE_TERRITORIES_WITH_POLYGONS.forEach((sample) => {
        const exists = territories.find(t => t.number === sample.number);
        if (exists) {
          updateTerritory({
            ...exists,
            polygon: sample.polygon,
            center: sample.center,
            color: sample.color,
            zoom: sample.zoom,
            noVisits: sample.noVisits,
          });
        } else {
          addTerritory(sample);
        }
      });
      showToast('Territorios de muestra con polígonos cargados exitosamente.');
    }
  };

  // Distinct Zones
  const zones = useMemo(() => {
    const set = new Set<string>();
    territories.forEach(t => {
      if (t.zone) set.add(t.zone);
    });
    return Array.from(set).sort();
  }, [territories]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = territories.length;
    let disponibles = 0;
    let asignados = 0;
    let vencidos = 0;
    let porVencer = 0;

    const today = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);

    territories.forEach(t => {
      if (t.status === 'disponible') {
        disponibles++;
      } else {
        asignados++;
        if (t.dueDate) {
          const dueDateObj = new Date(t.dueDate);
          if (dueDateObj < today || t.status === 'vencido') {
            vencidos++;
          } else if (dueDateObj <= fifteenDaysFromNow) {
            porVencer++;
          }
        }
      }
    });

    // Coverage in last 12 months
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const completedLastYear = territories.filter(t => {
      if (!t.lastCompletedDate) return false;
      return new Date(t.lastCompletedDate) >= oneYearAgo;
    }).length;
    const coveragePercentage = total > 0 ? Math.round((completedLastYear / total) * 100) : 0;

    return {
      total,
      disponibles,
      asignados,
      vencidos,
      porVencer,
      coveragePercentage,
      completedLastYear,
    };
  }, [territories]);

  // Filtered territories
  const filteredTerritories = useMemo(() => {
    const today = new Date();
    const fifteenDays = new Date();
    fifteenDays.setDate(today.getDate() + 15);

    return territories.filter(t => {
      // Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNumber = t.number.toLowerCase().includes(term);
        const matchesName = t.name.toLowerCase().includes(term);
        const matchesZone = t.zone.toLowerCase().includes(term);
        const matchesBounds = t.boundsDescription?.toLowerCase().includes(term) || false;
        const assignee = t.currentAssigneeId ? publishersMap.get(t.currentAssigneeId) : null;
        const matchesAssignee = assignee?.name.toLowerCase().includes(term) || false;

        if (!matchesNumber && !matchesName && !matchesZone && !matchesBounds && !matchesAssignee) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'disponible' && t.status !== 'disponible') return false;
      if (statusFilter === 'asignado' && t.status === 'disponible') return false;
      if (statusFilter === 'vencido') {
        if (t.status === 'disponible') return false;
        const isOverdue = t.status === 'vencido' || (t.dueDate && new Date(t.dueDate) < today);
        if (!isOverdue) return false;
      }
      if (statusFilter === 'por_vencer') {
        if (t.status === 'disponible' || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        if (d < today || d > fifteenDays) return false;
      }

      // Type filter
      if (typeFilter !== 'todos' && t.type !== typeFilter) return false;

      // Zone filter
      if (zoneFilter !== 'todos' && t.zone !== zoneFilter) return false;

      return true;
    }).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' }));
  }, [territories, searchTerm, statusFilter, typeFilter, zoneFilter, publishersMap]);

  // Helper type badge
  const getTypeBadge = (type: TerritoryType) => {
    switch (type) {
      case 'residencial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <Home className="w-3 h-3" /> Residencial
          </span>
        );
      case 'negocios':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Building2 className="w-3 h-3" /> Negocios
          </span>
        );
      case 'edificios':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <Layers className="w-3 h-3" /> Edificios
          </span>
        );
      case 'rural':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <TreePine className="w-3 h-3" /> Rural
          </span>
        );
      case 'telefonico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Phone className="w-3 h-3" /> Telefónico
          </span>
        );
      case 'campana':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
            <Compass className="w-3 h-3" /> Campaña
          </span>
        );
      default:
        return null;
    }
  };

  // Helper status badge
  const getStatusBadge = (territory: Territory) => {
    const today = new Date();
    if (territory.status === 'disponible') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disponible
        </span>
      );
    }

    const isOverdue = territory.status === 'vencido' || (territory.dueDate && new Date(territory.dueDate) < today);
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> Vencido (+4 meses)
        </span>
      );
    }

    if (territory.dueDate) {
      const d = new Date(territory.dueDate);
      const fifteenDays = new Date();
      fifteenDays.setDate(today.getDate() + 15);
      if (d <= fifteenDays) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Por vencer pronto
          </span>
        );
      }
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3 h-3 text-blue-600" /> Asignado
      </span>
    );
  };

  // WhatsApp share generator
  const handleShareWhatsApp = (t: Territory) => {
    const assignee = t.currentAssigneeId ? publishersMap.get(t.currentAssigneeId) : null;
    const assigneeName = assignee?.name || 'Publicador';
    const mapLink = (t.mapUrl && /^https:\/\//i.test(t.mapUrl.trim()))
      ? t.mapUrl.trim()
      : `https://maps.google.com/?q=${encodeURIComponent(`${t.name} ${settings.congregationName}`)}`;

    let noVisitsText = '';
    if (t.noVisits && t.noVisits.length > 0) {
      noVisitsText = '\n\n⚠️ *CASAS NO VISITAR:*\n' + t.noVisits.map(nv => `• ${nv.address}${nv.residentName ? ` (${nv.residentName})` : ''}`).join('\n');
    }

    const message = `📋 *ASIGNACIÓN DE TERRITORIO S-13*
🏛 *${settings.congregationName}*

📍 *Territorio:* #${t.number} - ${t.name}
🏘 *Tipo:* ${t.type.toUpperCase()} | *Zona:* ${t.zone}
👤 *Asignado a:* ${assigneeName}
📅 *Fecha de asignación:* ${t.assignedDate || 'Reciente'}
⏰ *Fecha límite sugerida (4 meses):* ${t.dueDate || 'En 4 meses'}

🗺 *Límites:*
${t.boundsDescription || 'Ver croquis adjunto'}

🔗 *Mapa digital:*
${mapLink}${noVisitsText}

💡 *Recordatorio:* De acuerdo con las pautas de la congregación, favor de trabajar el territorio con esmero y devolverlo dentro del plazo estipulado. ¡Que Jehová bendiga tu ministerio!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Open Assign Modal
  const openAssignModal = (t: Territory) => {
    setAssignModalTerritory(t);
    setSelectedPublisherId(publishers[0]?.id || '');
    const today = new Date().toISOString().slice(0, 10);
    setAssignDate(today);
    const d = new Date(today);
    d.setMonth(d.getMonth() + 4);
    setAssignDueDate(d.toISOString().slice(0, 10));
    setAssignNotes('');
  };

  // Confirm Assign
  const handleConfirmAssign = () => {
    if (!assignModalTerritory || !selectedPublisherId) return;
    assignTerritory(assignModalTerritory.id, selectedPublisherId, assignDate, assignDueDate, assignNotes);
    showToast(`Territorio #${assignModalTerritory.number} asignado correctamente.`);
    setAssignModalTerritory(null);
  };

  // Open Return Modal
  const openReturnModal = (t: Territory) => {
    setReturnModalTerritory(t);
    setReturnDate(new Date().toISOString().slice(0, 10));
    setReturnNotes('');
  };

  // Confirm Return
  const handleConfirmReturn = () => {
    if (!returnModalTerritory) return;
    returnTerritory(returnModalTerritory.id, returnDate, returnNotes);
    showToast(`Territorio #${returnModalTerritory.number} devuelto y registrado en el historial S-13.`);
    setReturnModalTerritory(null);
  };

  // Open Extend Modal
  const openExtendModal = (t: Territory) => {
    setExtendModalTerritory(t);
    const current = t.dueDate ? new Date(t.dueDate) : new Date();
    current.setMonth(current.getMonth() + 1);
    setExtendNewDueDate(current.toISOString().slice(0, 10));
  };

  // Confirm Extend
  const handleConfirmExtend = () => {
    if (!extendModalTerritory || !extendNewDueDate) return;
    extendTerritoryDueDate(extendModalTerritory.id, extendNewDueDate);
    showToast(`Plazo de entrega ampliado al ${extendNewDueDate}.`);
    setExtendModalTerritory(null);
  };

  // Handle Add No Visit
  const handleAddNoVisit = () => {
    if (!detailModalTerritory || !newNoVisitAddress.trim()) return;
    addNoVisitAddress(detailModalTerritory.id, {
      address: newNoVisitAddress.trim(),
      residentName: newNoVisitName.trim() || undefined,
      dateAdded: new Date().toISOString().slice(0, 10),
      reason: newNoVisitReason.trim() || 'Petición expresa de no tocar o visitar.',
    });
    setNewNoVisitAddress('');
    setNewNoVisitName('');
    setNewNoVisitReason('');
    showToast('Dirección "No Visitar" registrada.');
  };

  // Handle Open Create Territory
  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditTerritoryModal(null);
    setFormData({
      number: `${territories.length + 1}`.padStart(2, '0'),
      name: '',
      type: 'residencial',
      zone: zones[0] || 'Zona Central',
      estimatedHomes: 80,
      boundsDescription: '',
      mapUrl: '',
      notes: '',
    });
  };

  // Handle Open Edit Territory
  const openEditModal = (t: Territory) => {
    setIsCreatingNew(false);
    setEditTerritoryModal(t);
    setFormData({
      number: t.number,
      name: t.name,
      type: t.type,
      zone: t.zone,
      estimatedHomes: t.estimatedHomes,
      boundsDescription: t.boundsDescription || '',
      mapUrl: t.mapUrl || '',
      notes: t.notes || '',
    });
  };

  // Save Territory (Create or Edit)
  const handleSaveTerritory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number.trim() || !formData.name.trim()) return;

    if (isCreatingNew) {
      addTerritory({
        number: formData.number.trim(),
        name: formData.name.trim(),
        type: formData.type,
        zone: formData.zone.trim() || 'General',
        estimatedHomes: Number(formData.estimatedHomes) || 0,
        status: 'disponible',
        boundsDescription: formData.boundsDescription.trim() || undefined,
        mapUrl: formData.mapUrl.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        noVisits: [],
      });
      showToast(`Territorio #${formData.number} creado con éxito.`);
    } else if (editTerritoryModal) {
      updateTerritory({
        ...editTerritoryModal,
        number: formData.number.trim(),
        name: formData.name.trim(),
        type: formData.type,
        zone: formData.zone.trim(),
        estimatedHomes: Number(formData.estimatedHomes) || 0,
        boundsDescription: formData.boundsDescription.trim() || undefined,
        mapUrl: formData.mapUrl.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      showToast(`Territorio #${formData.number} actualizado.`);
    }

    setEditTerritoryModal(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Barra de Navegación de Vistas y Acciones de Territorio (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Mode Toggle Pill */}
        <div className="flex rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-slate-900/60 p-1 shadow-2xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'table'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'map'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
            <span>Mapa Interactivo</span>
          </button>
          <button
            onClick={() => setViewMode('s13')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 's13'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fichero S-13
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/[0.08] rounded-xl transition cursor-pointer shadow-2xs"
            title="Imprimir listado"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md dark:shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Territorio</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon (Horizontal Swipeable Interactive Filter Ribbon on Mobile) */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`bg-white dark:bg-[#131d2e] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[138px] sm:min-w-0 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'todos'
              ? 'border-indigo-500 ring-2 ring-indigo-500/15 dark:border-indigo-400'
              : 'border-slate-200/80 dark:border-white/[0.06] hover:border-indigo-300'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Map className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">{stats.total}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Total Territorios</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('disponible')}
          className={`bg-white dark:bg-[#131d2e] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[132px] sm:min-w-0 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'disponible'
              ? 'border-emerald-500 ring-2 ring-emerald-500/15 dark:border-emerald-400'
              : 'border-slate-200/80 dark:border-white/[0.06] hover:border-emerald-300'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{stats.disponibles}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Disponibles</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('asignado')}
          className={`bg-white dark:bg-[#131d2e] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[132px] sm:min-w-0 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'asignado'
              ? 'border-blue-500 ring-2 ring-blue-500/15 dark:border-blue-400'
              : 'border-slate-200/80 dark:border-white/[0.06] hover:border-blue-300'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 leading-tight">{stats.asignados}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">En Trabajo</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('vencido')}
          className={`bg-white dark:bg-[#131d2e] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[136px] sm:min-w-0 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'vencido'
              ? 'border-rose-500 ring-2 ring-rose-500/15 dark:border-rose-400'
              : 'border-slate-200/80 dark:border-white/[0.06] hover:border-rose-300'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 leading-tight">{stats.vencidos}</div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Vencidos (&gt;4m)</div>
          </div>
        </button>

        <div className="bg-white dark:bg-[#131d2e] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs shrink-0 min-w-[175px] sm:min-w-0">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
            <span>Cobertura Anual</span>
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">{stats.coveragePercentage}%</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">({stats.completedLastYear}/{stats.total})</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(stats.coveragePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-[#131d2e] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número, nombre, calle o publicador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'todos'
                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({territories.length})
          </button>
          <button
            onClick={() => setStatusFilter('disponible')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'disponible'
                ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Disponibles ({stats.disponibles})
          </button>
          <button
            onClick={() => setStatusFilter('asignado')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'asignado'
                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Asignados ({stats.asignados})
          </button>
          <button
            onClick={() => setStatusFilter('vencido')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'vencido'
                ? 'bg-rose-600 text-white border-rose-600 font-medium'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            Vencidos ({stats.vencidos})
          </button>

          {/* Type Select */}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="py-1 px-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="residencial">Residencial</option>
              <option value="negocios">Negocios</option>
              <option value="edificios">Edificios</option>
              <option value="rural">Rural</option>
              <option value="telefonico">Telefónico</option>
              <option value="campana">Campaña</option>
            </select>

            {zones.length > 0 && (
              <select
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value)}
                className="py-1 px-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todos">Todas las Zonas</option>
                {zones.map(z => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredTerritories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No se encontraron territorios</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            No hay ningún territorio que coincida con los filtros seleccionados o el término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('todos');
              setTypeFilter('todos');
              setZoneFilter('todos');
            }}
            className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            Restablecer filtros
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredTerritories.map(terr => {
            const assignee = terr.currentAssigneeId ? publishersMap.get(terr.currentAssigneeId) : null;
            const isAssigned = terr.status !== 'disponible';
            const isOverdue = terr.status === 'vencido' || (terr.dueDate && new Date(terr.dueDate) < new Date());

            return (
              <div
                key={terr.id}
                className={`bg-white rounded-xl border transition-all hover:shadow-md flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isAssigned
                    ? 'border-blue-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-base shadow-sm">
                        {terr.number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1" title={terr.name}>
                          {terr.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{terr.zone}</span>
                          <span>•</span>
                          <span>~{terr.estimatedHomes} hogares</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(terr)}
                      {getTypeBadge(terr.type)}
                    </div>
                  </div>

                  {/* Boundaries description */}
                  {terr.boundsDescription && (
                    <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-600 border border-slate-100 leading-relaxed">
                      <span className="font-medium text-slate-700">Límites: </span>
                      {terr.boundsDescription}
                    </div>
                  )}

                  {/* No-visit warning badge */}
                  {terr.noVisits && terr.noVisits.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium">
                        {terr.noVisits.length} {terr.noVisits.length === 1 ? 'casa NO visitar' : 'casas NO visitar'}
                      </span>
                    </div>
                  )}

                  {/* Assignment Status details */}
                  {isAssigned && assignee ? (
                    <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Asignado a:</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-600" />
                          {assignee.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Fecha asignado:</span>
                        <span className="text-slate-700">{terr.assignedDate || 'Reciente'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Límite (4 meses):</span>
                        <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {terr.dueDate || 'Sin definir'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-medium">Disponible para entrega</span>
                      {terr.lastCompletedDate && (
                        <span className="text-slate-500">Completado: {terr.lastCompletedDate}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailModalTerritory(terr)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition"
                      title="Ver Ficha S-13 y No Visitar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(terr)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/70 rounded-md transition"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPolygonEditorTerritory(terr)}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        terr.polygon && terr.polygon.length >= 3
                          ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/70 bg-indigo-50'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={terr.polygon && terr.polygon.length >= 3 ? "Editar polígono perimetral en el mapa" : "Delimitar polígono en el mapa"}
                    >
                      <Map className="w-4 h-4" />
                    </button>
                    {terr.mapUrl && /^https:\/\//i.test(terr.mapUrl.trim()) ? (
                      <a
                        href={terr.mapUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100/70 rounded-md transition"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${terr.name} ${settings.congregationName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100/70 rounded-md transition"
                        title="Buscar en Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(terr)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition"
                      title="Editar datos del territorio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDigitalCardTerritory(terr)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition border border-indigo-200 cursor-pointer"
                      title="Generar Tarjeta Digital y Código QR para el publicador"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden sm:inline">Tarjeta</span>
                    </button>
                  </div>

                  {/* Primary status action */}
                  <div>
                    {isAssigned ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openExtendModal(terr)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition"
                          title="Ampliar plazo de entrega"
                        >
                          Ampliar
                        </button>
                        <button
                          onClick={() => openReturnModal(terr)}
                          className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Devolver
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignModal(terr)}
                        className="px-3.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center gap-1 shadow-sm"
                      >
                        <User className="w-3.5 h-3.5" /> Asignar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nº</th>
                  <th className="py-3 px-4">Territorio y Zona</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Hogares</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Publicador Asignado</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTerritories.map(terr => {
                  const assignee = terr.currentAssigneeId ? publishersMap.get(terr.currentAssigneeId) : null;
                  const isAssigned = terr.status !== 'disponible';
                  const isOverdue = terr.status === 'vencido' || (terr.dueDate && new Date(terr.dueDate) < new Date());

                  return (
                    <tr key={terr.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">#{terr.number}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{terr.name}</div>
                        <div className="text-xs text-slate-500">{terr.zone}</div>
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(terr.type)}</td>
                      <td className="py-3 px-4 text-slate-600">~{terr.estimatedHomes}</td>
                      <td className="py-3 px-4">{getStatusBadge(terr)}</td>
                      <td className="py-3 px-4">
                        {isAssigned && assignee ? (
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {assignee.name.charAt(0)}
                            </div>
                            <span>{assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isAssigned && terr.dueDate ? (
                          <span className={`text-xs ${isOverdue ? 'font-bold text-rose-600' : 'text-slate-600'}`}>
                            {terr.dueDate}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPolygonEditorTerritory(terr)}
                            className={`p-1 rounded cursor-pointer ${
                              terr.polygon && terr.polygon.length >= 3
                                ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title="Delimitar Polígono en Mapa"
                          >
                            <Map className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(terr)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            title="WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailModalTerritory(terr)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Ver Ficha S-13"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAssigned ? (
                            <button
                              onClick={() => openReturnModal(terr)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                            >
                              Devolver
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(terr)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                            >
                              Asignar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        /* FASE 5: MAPA INTERACTIVO OPENSTREETMAP / LEAFLET */
        <TerritoryMapView
          territories={territories}
          publishersMap={publishersMap}
          settings={settings}
          onSelectTerritory={(t) => setDetailModalTerritory(t)}
          onEditPolygon={(t) => setPolygonEditorTerritory(t)}
          onOpenDigitalCard={(t) => setDigitalCardTerritory(t)}
          onAssignTerritory={(t) => openAssignModal(t)}
          onReturnTerritory={(t) => openReturnModal(t)}
          onCreateTerritory={() => openCreateModal()}
          onSeedSamplePolygons={handleSeedSamplePolygons}
        />
      ) : (
        /* OFFICIAL S-13 BATCH FICHERO VIEW */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900 text-sm">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Registro Oficial de Asignación de Territorio (Formulario S-13)</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Esta vista replica el formato físico oficial archivado por el siervo de territorios. Cada tarjeta registra el historial de rotación, fechas de asignación y devolución reglamentarias.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTerritories.map(terr => (
              <div key={terr.id} className="bg-white rounded-xl border border-slate-300 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b pb-3">
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                      S-13 • REGISTRO DE ASIGNACIÓN
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Territorio Nº {terr.number}: {terr.name}
                    </h3>
                    <p className="text-xs text-slate-500">{terr.zone} • {terr.type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      ~{terr.estimatedHomes} Hogares
                    </span>
                  </div>
                </div>

                {/* S-13 Table of Assignments */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Asignado a</th>
                        <th className="p-2">Fecha Asign.</th>
                        <th className="p-2">Fecha Devol.</th>
                        <th className="p-2">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {terr.history && terr.history.length > 0 ? (
                        terr.history.map((rec, i) => (
                          <tr key={rec.id || i} className={!rec.returnedDate ? 'bg-blue-50/50 font-medium' : ''}>
                            <td className="p-2 text-slate-800">{rec.publisherName}</td>
                            <td className="p-2 text-slate-600">{rec.assignedDate}</td>
                            <td className="p-2 text-slate-600">
                              {rec.returnedDate || <span className="text-blue-600 font-semibold">En curso</span>}
                            </td>
                            <td className="p-2 text-slate-500 italic max-w-xs truncate" title={rec.notes}>
                              {rec.notes || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400 italic">
                            Sin historial previo registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* No visit addresses summary */}
                {terr.noVisits && terr.noVisits.length > 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-rose-800 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Domicilios No Visitar:
                    </span>
                    <ul className="list-disc list-inside text-rose-700 pl-1">
                      {terr.noVisits.map(nv => (
                        <li key={nv.id}>
                          <span className="font-medium">{nv.address}</span>
                          {nv.residentName ? ` (${nv.residentName})` : ''} - {nv.reason || 'Sin detalles'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                  <button
                    onClick={() => handleShareWhatsApp(terr)}
                    className="px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md font-medium transition"
                  >
                    Enviar por WhatsApp
                  </button>
                  <button
                    onClick={() => setDetailModalTerritory(terr)}
                    className="px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md font-medium transition"
                  >
                    Ver Ficha Completa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASIGNAR TERRITORIO */}
      {/* ========================================================= */}
      {assignModalTerritory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Asignar Territorio</h3>
                  <p className="text-xs text-slate-500">
                    Nº {assignModalTerritory.number}: {assignModalTerritory.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalTerritory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Publicador Responsable *
                </label>
                <select
                  value={selectedPublisherId}
                  onChange={e => setSelectedPublisherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar Publicador --</option>
                  {publishers
                    .filter(p => p.active)
                    .map(pub => (
                      <option key={pub.id} value={pub.id}>
                        {pub.name} {pub.privilege ? `(${pub.privilege.replace('_', ' ')})` : ''} - Grupo {pub.groupNumber || 'Sin grupo'}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Asignación *
                  </label>
                  <input
                    type="date"
                    value={assignDate}
                    onChange={e => {
                      setAssignDate(e.target.value);
                      const d = new Date(e.target.value);
                      d.setMonth(d.getMonth() + 4);
                      setAssignDueDate(d.toISOString().slice(0, 10));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vencimiento (4 meses) *
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={e => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Recomendaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Asignado para la campaña o fin de semana..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Las pautas teocráticas de la sucursal recomiendan devolver los territorios en un plazo máximo de <strong>4 meses</strong> para mantener la cobertura continua.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <button
                type="button"
                onClick={() => setAssignModalTerritory(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedPublisherId}
                onClick={handleConfirmAssign}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DEVOLVER TERRITORIO */}
      {/* ========================================================= */}
      {returnModalTerritory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Devolver Territorio</h3>
                  <p className="text-xs text-slate-500">
                    Nº {returnModalTerritory.number}: {returnModalTerritory.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalTerritory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Devolución *
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas de finalización
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Territorio completado al 100%. Se actualizaron direcciones 'no visitar'..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                Esta acción registrará la fecha de devolución en la tarjeta histórica S-13 y cambiará el estado del territorio a <strong>Disponible</strong> para que otro publicador pueda solicitarlo.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <button
                type="button"
                onClick={() => setReturnModalTerritory(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Registrar Devolución
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXTENDER PLAZO */}
      {/* ========================================================= */}
      {extendModalTerritory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-slate-800 text-base">Extender Plazo de Entrega</h3>
              <button
                onClick={() => setExtendModalTerritory(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-600">
                Territorio #{extendModalTerritory.number}: <strong>{extendModalTerritory.name}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nueva Fecha Límite
                </label>
                <input
                  type="date"
                  value={extendNewDueDate}
                  onChange={e => setExtendNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
              <button
                type="button"
                onClick={() => setExtendModalTerritory(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 font-medium rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExtend}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Guardar Ampliación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FICHA DETALLADA S-13 & GESTOR NO VISITAR */}
      {/* ========================================================= */}
      {detailModalTerritory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xl shadow-md">
                  {detailModalTerritory.number}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">
                    {detailModalTerritory.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(detailModalTerritory.type)}
                    <span className="text-xs text-slate-500 font-medium">{detailModalTerritory.zone}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">~{detailModalTerritory.estimatedHomes} hogares</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailModalTerritory(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">Estado actual:</span>
                {getStatusBadge(detailModalTerritory)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const t = detailModalTerritory;
                    setDetailModalTerritory(null);
                    setDigitalCardTerritory(t);
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> Tarjeta Digital & QR
                </button>
                <button
                  onClick={() => handleShareWhatsApp(detailModalTerritory)}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" /> Enviar por WhatsApp
                </button>
                <button
                  onClick={() => setPolygonEditorTerritory(detailModalTerritory)}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Map className="w-3.5 h-3.5" /> Delimitar Polígono
                </button>
                {detailModalTerritory.mapUrl && /^https:\/\//i.test(detailModalTerritory.mapUrl.trim()) ? (
                  <a
                    href={detailModalTerritory.mapUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir Mapa
                  </a>
                ) : (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${detailModalTerritory.name} ${settings.congregationName}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buscar Mapa
                  </a>
                )}
              </div>
            </div>

            {/* Boundaries & Notes */}
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1">
                  Límites y Geografía del Territorio
                </h4>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-700 text-xs border border-slate-200/80 leading-relaxed">
                  {detailModalTerritory.boundsDescription || 'No se han especificado límites exactos.'}
                </p>
              </div>

              {/* Vista Previa de Mapa Interactivo Leaflet */}
              <div className="pt-1">
                <TerritoryCardMap territory={detailModalTerritory} heightClass="h-56" />
              </div>

              {detailModalTerritory.notes && (
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1">
                    Instrucciones &amp; Notas de Predicación
                  </h4>
                  <p className="bg-slate-50 p-3 rounded-lg text-slate-700 text-xs border border-slate-200/80 leading-relaxed">
                    {detailModalTerritory.notes}
                  </p>
                </div>
              )}
            </div>

            {/* No Visit Section (Do-Not-Call) */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Domicilios "No Visitar" ({detailModalTerritory.noVisits?.length || 0})
                </h4>
              </div>

              {detailModalTerritory.noVisits && detailModalTerritory.noVisits.length > 0 ? (
                <div className="space-y-2">
                  {detailModalTerritory.noVisits.map(nv => (
                    <div
                      key={nv.id}
                      className="flex items-start justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs"
                    >
                      <div>
                        <div className="font-bold text-rose-900">{nv.address}</div>
                        {nv.residentName && <div className="text-rose-800">Residente: {nv.residentName}</div>}
                        <div className="text-rose-700/80 mt-0.5 italic">
                          {nv.reason || 'Petición expresa'} (Registrado: {nv.dateAdded})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          removeNoVisitAddress(detailModalTerritory.id, nv.id);
                          showToast('Dirección eliminada.');
                        }}
                        className="text-rose-500 hover:text-rose-800 p-1"
                        title="Quitar de la lista de no visitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No hay direcciones marcadas como "No Visitar" en este territorio.</p>
              )}

              {/* Add No Visit Form */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  + Agregar nuevo domicilio "No Visitar"
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Dirección exacta (ej: Calle 4 #12-30)*"
                    value={newNoVisitAddress}
                    onChange={e => setNewNoVisitAddress(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="Nombre residente (opcional)"
                    value={newNoVisitName}
                    onChange={e => setNewNoVisitName(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Motivo o fecha de solicitud (ej: Petición verbal formal)"
                    value={newNoVisitReason}
                    onChange={e => setNewNoVisitReason(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleAddNoVisit}
                    disabled={!newNoVisitAddress.trim()}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-md text-xs transition shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {/* S-13 History Table */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Historial S-13 de Asignaciones Pasadas
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Publicador</th>
                      <th className="p-2.5">Asignado</th>
                      <th className="p-2.5">Devuelto</th>
                      <th className="p-2.5">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailModalTerritory.history && detailModalTerritory.history.length > 0 ? (
                      detailModalTerritory.history.map((h, i) => (
                        <tr key={h.id || i} className={!h.returnedDate ? 'bg-blue-50/40 font-medium' : ''}>
                          <td className="p-2.5 font-medium text-slate-800">{h.publisherName}</td>
                          <td className="p-2.5 text-slate-600">{h.assignedDate}</td>
                          <td className="p-2.5 text-slate-600">
                            {h.returnedDate || <span className="text-blue-600 font-semibold">En curso</span>}
                          </td>
                          <td className="p-2.5 text-slate-500 italic">{h.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          Aún no hay historial de asignaciones registrado para este territorio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom */}
            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar el territorio #${detailModalTerritory.number}?`)) {
                    deleteTerritory(detailModalTerritory.id);
                    setDetailModalTerritory(null);
                    showToast('Territorio eliminado.');
                  }
                }}
                className="text-rose-600 hover:text-rose-800 text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar territorio
              </button>

              <button
                onClick={() => setDetailModalTerritory(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR TERRITORIO */}
      {/* ========================================================= */}
      {(isCreatingNew || editTerritoryModal) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">
                  {isCreatingNew ? 'Nuevo Territorio de Congregación' : `Editar Territorio #${editTerritoryModal?.number}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditTerritoryModal(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTerritory} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01, 14, R-02..."
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre o Barrio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Barrio San José, Bulevar Central..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Territorio
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as TerritoryType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="negocios">Negocios / Comercial</option>
                    <option value="edificios">Edificios / Condominios</option>
                    <option value="rural">Rural / Parcelas</option>
                    <option value="telefonico">Telefónico</option>
                    <option value="campana">Campaña Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zona o Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Zona Norte, Centro, Sector Este..."
                    value={formData.zone}
                    onChange={e => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cantidad Estimada de Hogares / Puertas
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={formData.estimatedHomes}
                  onChange={e => setFormData({ ...formData, estimatedHomes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Límites del Territorio (Calles / Avenidas que lo delimitan)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Norte: Calle 4 | Sur: Av. Libertad | Este: Quebrada | Oeste: Carrera 10"
                  value={formData.boundsDescription}
                  onChange={e => setFormData({ ...formData, boundsDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enlace de Mapa Digital (Google Maps o similar)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={formData.mapUrl}
                  onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones Generales
                </label>
                <textarea
                  rows={2}
                  placeholder="Recomendaciones de horario, estacionamiento, precauciones..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditTerritoryModal(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isCreatingNew ? 'Guardar Territorio' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TARJETA DIGITAL DE TERRITORIO (QR & GOOGLE MAPS)   */}
      {/* ========================================================= */}
      {digitalCardTerritory && (
        <DigitalTerritoryModal
          isOpen={true}
          onClose={() => setDigitalCardTerritory(null)}
          territory={digitalCardTerritory}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITOR DE POLÍGONOS DE TERRITORIOS (FASE 5)        */}
      {/* ========================================================= */}
      {polygonEditorTerritory && (
        <TerritoryPolygonEditorModal
          isOpen={true}
          onClose={() => setPolygonEditorTerritory(null)}
          territory={polygonEditorTerritory}
          defaultCenter={settings.hallCoordinates || settings.territoryMapCenter}
          onSave={(polygon, center, color) => {
            const updated: Territory = {
              ...polygonEditorTerritory,
              polygon,
              center,
              color,
            };
            updateTerritory(updated);
            showToast(`Límites y polígono del Territorio #${updated.number} guardados con éxito.`);
            setPolygonEditorTerritory(null);
            if (detailModalTerritory && detailModalTerritory.id === updated.id) {
              setDetailModalTerritory(updated);
            }
          }}
        />
      )}
    </div>
  );
};
