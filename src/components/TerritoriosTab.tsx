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
import {
  evaluateTerritoryS13Radar,
  buildOverdueTerritoryWhatsAppReminder,
} from '../utils/khsPublicWitnessingEngine';
import { openWhatsAppLink } from '../utils/whatsapp';
import { MessageCircle, Upload } from 'lucide-react';
import { LocalOfficialFormsModal } from './LocalOfficialFormsCenter';
import {
  getLocalOfficialFormBytes,
  fillOfficialS13Pdf,
  downloadPdfBytesLocally,
} from '../services/localOfficialFormsService';
import { useModal } from '../context/ModalContext';

export const TerritoriosTab: React.FC = () => {
  const { confirm } = useModal();
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
  const [isS13ModalOpen, setIsS13ModalOpen] = useState(false);

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
  const handleSeedSamplePolygons = async () => {
    const confirmed = await confirm({
      title: 'Territorios de muestra',
      message: '¿Deseas cargar 4 territorios de muestra con mapas y polígonos delimitados para probar el mapa interactivo?',
      confirmText: 'Cargar territorios',
      cancelText: 'Cancelar',
      type: 'info',
    });
    if (!confirmed) return;
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

  const s13Radar = useMemo(() => {
    return evaluateTerritoryS13Radar(territories);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A]">
            <Home className="w-3 h-3 text-zinc-500 dark:text-[#A1A1AA]" /> Residencial
          </span>
        );
      case 'negocios':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
            <Building2 className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Negocios
          </span>
        );
      case 'edificios':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <Layers className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Edificios
          </span>
        );
      case 'rural':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <TreePine className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Rural
          </span>
        );
      case 'telefonico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <Phone className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Telefónico
          </span>
        );
      case 'campana':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <Compass className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Campaña
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Disponible
        </span>
      );
    }

    const isOverdue = territory.status === 'vencido' || (territory.dueDate && new Date(territory.dueDate) < today);
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Vencido (+4m)
        </span>
      );
    }

    if (territory.dueDate) {
      const d = new Date(territory.dueDate);
      const fifteenDays = new Date();
      fifteenDays.setDate(today.getDate() + 15);
      if (d <= fifteenDays) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Por vencer
          </span>
        );
      }
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
        <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Asignado
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

    openWhatsAppLink('', message);
  };

  const handleDownloadOfficialS13 = async () => {
    try {
      const stored = await getLocalOfficialFormBytes('S-13');
      if (!stored) {
        setIsS13ModalOpen(true);
        return;
      }
      const filledBytes = await fillOfficialS13Pdf(stored.bytes, territories, '2025-2026');
      downloadPdfBytesLocally(
        filledBytes,
        `S-13_Oficial_Relleno_${settings.congregationName.replace(/\s+/g, '_')}.pdf`
      );
      showToast('PDF Oficial S-13 rellenado y descargado con tus datos de territorios.');
    } catch {
      setIsS13ModalOpen(true);
    }
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
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-zinc-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Barra Unificada de Vistas y Acciones de Territorio */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* View Mode Toggle - 2-column grid on mobile so nothing clips */}
        <div className="grid grid-cols-2 sm:flex rounded-xl border border-zinc-200/70 dark:border-[#27272A] bg-zinc-100 dark:bg-[#18181F] p-1.5 gap-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <span className="truncate">Tarjetas</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <span className="truncate">Tabla</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Map className={`w-3.5 h-3.5 shrink-0 ${viewMode === 'map' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
            <span className="truncate">Mapa</span>
          </button>
          <button
            onClick={() => setViewMode('s13')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
              viewMode === 's13'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <span className="truncate">Fichero S-13</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadOfficialS13}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200/80 dark:border-[#27272A] rounded-xl transition cursor-pointer active:scale-95"
            title="Cargar el PDF oficial S-13 de JW Hub para que la app lo rellene y descargue"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">PDF S-13 Oficial</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Nuevo Territorio</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon (2-column non-clipping grid on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`bg-white dark:bg-[#121216] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'todos'
              ? 'border-indigo-500 ring-2 ring-indigo-500/15 dark:border-indigo-400'
              : 'border-zinc-200 dark:border-[#27272A] hover:border-indigo-300 dark:hover:border-indigo-500/50'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Map className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] leading-tight">{stats.total}</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium truncate">Total Territorios</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('disponible')}
          className={`bg-white dark:bg-[#121216] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'disponible'
              ? 'border-emerald-500 ring-2 ring-emerald-500/15 dark:border-emerald-400'
              : 'border-zinc-200 dark:border-[#27272A] hover:border-emerald-300 dark:hover:border-emerald-500/50'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight">{stats.disponibles}</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium truncate">Disponibles</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('asignado')}
          className={`bg-white dark:bg-[#121216] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'asignado'
              ? 'border-teal-500 ring-2 ring-teal-500/15 dark:border-teal-400'
              : 'border-zinc-200 dark:border-[#27272A] hover:border-teal-300 dark:hover:border-teal-500/50'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 leading-tight">{stats.asignados}</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium truncate">En Trabajo</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('vencido')}
          className={`bg-white dark:bg-[#121216] p-3 sm:p-4 rounded-2xl border shadow-xs flex items-center gap-2.5 sm:gap-3 text-left transition-all cursor-pointer active:scale-95 ${
            statusFilter === 'vencido'
              ? 'border-rose-500 ring-2 ring-rose-500/15 dark:border-rose-400'
              : 'border-zinc-200 dark:border-[#27272A] hover:border-rose-300 dark:hover:border-rose-500/50'
          }`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 leading-tight">{stats.vencidos}</div>
            <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium truncate">Vencidos (&gt;4m)</div>
          </div>
        </button>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#121216] p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
            <span>Cobertura Anual</span>
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] leading-tight">{stats.coveragePercentage}%</span>
            <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-[#A1A1AA]">({stats.completedLastYear}/{stats.total})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-[#18181F] rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(stats.coveragePercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Radar S-13: Alertas de Territorios Vencidos (>4 meses) o Por Vencer */}
      {(s13Radar.overdue.length > 0 || s13Radar.expiringSoon.length > 0) && (
        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-amber-500/30 dark:border-amber-500/20 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                Radar S-13: Control de Plazo de 4 Meses ({s13Radar.overdue.length} vencidos •{' '}
                {s13Radar.expiringSoon.length} por vencer)
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
              Envía recordatorio amigable por WhatsApp o registra la devolución en 1 clic
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[...s13Radar.overdue, ...s13Radar.expiringSoon].slice(0, 6).map((terr) => {
              const assignee = terr.currentAssigneeId
                ? publishersMap.get(terr.currentAssigneeId)
                : undefined;
              const isOver = s13Radar.overdue.some((o) => o.id === terr.id);
              return (
                <div
                  key={terr.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] flex flex-col justify-between gap-2 text-xs shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                        Territorio #{terr.number} — {terr.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A] inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOver ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {isOver ? 'Vencido (+4m)' : 'Por vencer'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA] mt-1">
                      Tenencia: <strong className="text-zinc-800 dark:text-[#F4F4F5]">{assignee?.name || 'Por verificar'}</strong> • Vence:{' '}
                      <strong className="font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5]">{terr.dueDate || '—'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = buildOverdueTerritoryWhatsAppReminder(
                          terr,
                          assignee,
                          settings.congregationName
                        );
                        openWhatsAppLink(assignee?.phone || '', msg);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Recordar S-13</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openReturnModal(terr)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-[#27272A] cursor-pointer"
                      >
                        Recibir
                      </button>
                      <button
                        type="button"
                        onClick={() => openExtendModal(terr)}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-[10px] font-bold hover:bg-zinc-50 dark:hover:bg-[#27272A] cursor-pointer"
                      >
                        Prorrogar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white dark:bg-[#121216] p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por número, nombre, calle o publicador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/80 dark:border-[#27272A] text-xs">
          <span className="text-zinc-400 dark:text-[#A1A1AA] flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'todos'
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'bg-white dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#27272A]'
            }`}
          >
            Todos ({territories.length})
          </button>
          <button
            onClick={() => setStatusFilter('disponible')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'disponible'
                ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                : 'bg-white dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#27272A]'
            }`}
          >
            Disponibles ({stats.disponibles})
          </button>
          <button
            onClick={() => setStatusFilter('asignado')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'asignado'
                ? 'bg-teal-600 text-white border-teal-600 font-medium'
                : 'bg-white dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#27272A]'
            }`}
          >
            Asignados ({stats.asignados})
          </button>
          <button
            onClick={() => setStatusFilter('vencido')}
            className={`px-2.5 py-1 rounded-full border transition ${
              statusFilter === 'vencido'
                ? 'bg-rose-600 text-white border-rose-600 font-medium'
                : 'bg-white dark:bg-[#18181F] text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20'
            }`}
          >
            Vencidos ({stats.vencidos})
          </button>

          {/* Type Select */}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="py-1 px-2.5 border border-zinc-200 dark:border-[#27272A] rounded-lg text-xs bg-white dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                className="py-1 px-2.5 border border-zinc-200 dark:border-[#27272A] rounded-lg text-xs bg-white dark:bg-[#18181F] text-zinc-700 dark:text-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-12 text-center shadow-xs">
          <Map className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-[#F4F4F5] mb-1">No se encontraron territorios</h3>
          <p className="text-sm text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto mb-4">
            No hay ningún territorio que coincida con los filtros seleccionados o el término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('todos');
              setTypeFilter('todos');
              setZoneFilter('todos');
            }}
            className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition font-medium cursor-pointer"
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
                className={`bg-white dark:bg-[#18181F] rounded-2xl border transition-all hover:border-zinc-300 dark:hover:border-zinc-600 flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-500/50 ring-1 ring-rose-500/20'
                    : isAssigned
                    ? 'border-teal-500/30'
                    : 'border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                {/* Card Top */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-[#121216] text-white font-mono font-bold tabular-nums flex items-center justify-center text-base border border-zinc-700/50 dark:border-[#27272A] shadow-xs">
                        {terr.number}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-800 dark:text-[#F4F4F5] text-sm leading-tight line-clamp-1" title={terr.name}>
                          {terr.name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400 dark:text-[#A1A1AA]" />
                          <span>{terr.zone}</span>
                          <span>•</span>
                          <span className="font-mono tabular-nums">~{terr.estimatedHomes} hogares</span>
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
                    <div className="bg-zinc-50 dark:bg-[#121216] p-2.5 rounded-xl text-xs text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/70 dark:border-[#27272A] leading-relaxed">
                      <span className="font-medium text-zinc-700 dark:text-[#F4F4F5]">Límites: </span>
                      {terr.boundsDescription}
                    </div>
                  )}

                  {/* No-visit warning badge */}
                  {terr.noVisits && terr.noVisits.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="font-medium font-mono tabular-nums">
                        {terr.noVisits.length} {terr.noVisits.length === 1 ? 'casa NO visitar' : 'casas NO visitar'}
                      </span>
                    </div>
                  )}

                  {/* Assignment Status details */}
                  {isAssigned && assignee ? (
                    <div className="bg-teal-500/5 dark:bg-teal-950/20 p-3 rounded-xl border border-teal-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">Asignado a:</span>
                        <span className="font-semibold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {assignee.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">Fecha asignado:</span>
                        <span className="text-zinc-700 dark:text-[#F4F4F5] font-mono tabular-nums">{terr.assignedDate || 'Reciente'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-[#A1A1AA]">Límite (4 meses):</span>
                        <span className={`font-mono tabular-nums font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-700 dark:text-[#F4F4F5]'}`}>
                          {terr.dueDate || 'Sin definir'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Disponible para entrega</span>
                      {terr.lastCompletedDate && (
                        <span className="text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">Completado: {terr.lastCompletedDate}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-zinc-50/70 dark:bg-[#121216] border-t border-zinc-100 dark:border-[#27272A] rounded-b-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailModalTerritory(terr)}
                      className="p-1.5 text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-200/70 dark:hover:bg-[#27272A] rounded-lg transition cursor-pointer"
                      title="Ver Ficha S-13 y No Visitar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(terr)}
                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition cursor-pointer"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPolygonEditorTerritory(terr)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        terr.polygon && terr.polygon.length >= 3
                          ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30'
                          : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
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
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${terr.name} ${settings.congregationName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition"
                        title="Buscar en Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(terr)}
                      className="p-1.5 text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-200/70 dark:hover:bg-[#27272A] rounded-lg transition cursor-pointer"
                      title="Editar datos del territorio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDigitalCardTerritory(terr)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition border border-indigo-200 dark:border-indigo-800/40 cursor-pointer"
                      title="Generar Tarjeta Digital y Código QR para el publicador"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="hidden sm:inline">Tarjeta</span>
                    </button>
                  </div>

                  {/* Primary status action */}
                  <div>
                    {isAssigned ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openExtendModal(terr)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-[#F4F4F5] bg-white dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A] rounded-lg transition cursor-pointer"
                          title="Ampliar plazo de entrega"
                        >
                          Ampliar
                        </button>
                        <button
                          onClick={() => openReturnModal(terr)}
                          className="px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Devolver
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignModal(terr)}
                        className="px-3.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
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
        <div className="bg-white dark:bg-[#121216] rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-[#27272A]">
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
              <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                {filteredTerritories.map(terr => {
                  const assignee = terr.currentAssigneeId ? publishersMap.get(terr.currentAssigneeId) : null;
                  const isAssigned = terr.status !== 'disponible';
                  const isOverdue = terr.status === 'vencido' || (terr.dueDate && new Date(terr.dueDate) < new Date());

                  return (
                    <tr key={terr.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/60 transition">
                      <td className="py-3 px-4 font-bold font-mono tabular-nums text-zinc-800 dark:text-[#F4F4F5]">#{terr.number}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-800 dark:text-[#F4F4F5]">{terr.name}</div>
                        <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">{terr.zone}</div>
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(terr.type)}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-zinc-600 dark:text-[#A1A1AA]">~{terr.estimatedHomes}</td>
                      <td className="py-3 px-4">{getStatusBadge(terr)}</td>
                      <td className="py-3 px-4">
                        {isAssigned && assignee ? (
                          <div className="font-medium text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                              {assignee.name.charAt(0)}
                            </div>
                            <span>{assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isAssigned && terr.dueDate ? (
                          <span className={`text-xs font-mono tabular-nums ${isOverdue ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-zinc-600 dark:text-[#A1A1AA]'}`}>
                            {terr.dueDate}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPolygonEditorTerritory(terr)}
                            className={`p-1 rounded-lg cursor-pointer ${
                              terr.polygon && terr.polygon.length >= 3
                                ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/30'
                                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#27272A]'
                            }`}
                            title="Delimitar Polígono en Mapa"
                          >
                            <Map className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(terr)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg cursor-pointer"
                            title="WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailModalTerritory(terr)}
                            className="p-1 text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#27272A] rounded-lg cursor-pointer"
                            title="Ver Ficha S-13"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAssigned ? (
                            <button
                              onClick={() => openReturnModal(terr)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 cursor-pointer"
                            >
                              Devolver
                            </button>
                          ) : (
                            <button
                              onClick={() => openAssignModal(terr)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs cursor-pointer"
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
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-[#F4F4F5]">Registro de Asignación de Territorio (Formulario S-13)</p>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5 leading-relaxed">
                  Para descargar el formato oficial S-13 de JW, carga tu PDF oficial en blanco y la aplicación lo rellenará automáticamente con este historial de rotación.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsS13ModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] text-xs font-semibold shadow-2xs shrink-0 cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717A]" />
              <span>Cargar y Rellenar S-13 Oficial (PDF)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTerritories.map(terr => (
              <div key={terr.id} className="bg-white dark:bg-[#18181F] rounded-2xl border border-zinc-200 dark:border-[#27272A] p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between border-b border-zinc-200 dark:border-[#27272A] pb-3">
                  <div>
                    <div className="text-xs uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] tracking-wider">
                      S-13 • REGISTRO DE ASIGNACIÓN
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-[#F4F4F5]">
                      Territorio Nº {terr.number}: {terr.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">{terr.zone} • {terr.type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-[#121216] text-zinc-700 dark:text-[#A1A1AA] border border-zinc-200/80 dark:border-[#27272A]">
                      ~{terr.estimatedHomes} Hogares
                    </span>
                  </div>
                </div>

                {/* S-13 Table of Assignments */}
                <div className="overflow-x-auto border border-zinc-200 dark:border-[#27272A] rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-100 dark:bg-[#121216] font-semibold text-zinc-700 dark:text-[#A1A1AA] border-b border-zinc-200 dark:border-[#27272A]">
                      <tr>
                        <th className="p-2.5">Asignado a</th>
                        <th className="p-2.5">Fecha Asign.</th>
                        <th className="p-2.5">Fecha Devol.</th>
                        <th className="p-2.5">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                      {terr.history && terr.history.length > 0 ? (
                        terr.history.map((rec, i) => (
                          <tr key={rec.id || i} className={!rec.returnedDate ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-medium' : ''}>
                            <td className="p-2.5 text-zinc-800 dark:text-[#F4F4F5]">{rec.publisherName}</td>
                            <td className="p-2.5 text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums">{rec.assignedDate}</td>
                            <td className="p-2.5 text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums">
                              {rec.returnedDate || <span className="text-indigo-600 dark:text-indigo-400 font-semibold">En curso</span>}
                            </td>
                            <td className="p-2.5 text-zinc-500 dark:text-[#A1A1AA] italic max-w-xs truncate" title={rec.notes}>
                              {rec.notes || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-zinc-400 dark:text-zinc-500 italic">
                            Sin historial previo registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* No visit addresses summary */}
                {terr.noVisits && terr.noVisits.length > 0 && (
                  <div className="p-2.5 bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Domicilios No Visitar:
                    </span>
                    <ul className="list-disc list-inside text-zinc-600 dark:text-[#A1A1AA] pl-1">
                      {terr.noVisits.map(nv => (
                        <li key={nv.id}>
                          <span className="font-medium text-zinc-900 dark:text-[#F4F4F5]">{nv.address}</span>
                          {nv.residentName ? ` (${nv.residentName})` : ''} - {nv.reason || 'Sin detalles'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-[#27272A] text-xs">
                  <button
                    onClick={() => handleShareWhatsApp(terr)}
                    className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg font-medium transition cursor-pointer"
                  >
                    Enviar por WhatsApp
                  </button>
                  <button
                    onClick={() => setDetailModalTerritory(terr)}
                    className="px-3 py-1.5 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/40 rounded-lg font-medium transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-lg">Asignar Territorio</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Nº {assignModalTerritory.number}: {assignModalTerritory.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalTerritory(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Publicador Responsable *
                </label>
                <select
                  value={selectedPublisherId}
                  onChange={e => setSelectedPublisherId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
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
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Vencimiento (4 meses) *
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={e => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Observaciones / Recomendaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Asignado para la campaña o fin de semana..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-zinc-700 dark:text-[#A1A1AA] border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Las pautas teocráticas recomiendan devolver los territorios en un plazo máximo de <strong>4 meses</strong> para mantener la rotación continua.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setAssignModalTerritory(null)}
                className="px-4 py-2 text-sm text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5] font-medium rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedPublisherId}
                onClick={handleConfirmAssign}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272A]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-lg">Devolver Territorio</h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Nº {returnModalTerritory.number}: {returnModalTerritory.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalTerritory(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Fecha de Devolución *
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Notas de finalización
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Territorio completado al 100%. Se actualizaron direcciones 'no visitar'..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs">
                Esta acción registrará la fecha de devolución en la tarjeta histórica S-13 y cambiará el estado del territorio a <strong>Disponible</strong> para que otro publicador pueda solicitarlo.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setReturnModalTerritory(null)}
                className="px-4 py-2 text-sm text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5] font-medium rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272A]">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-base">Extender Plazo de Entrega</h3>
              <button
                onClick={() => setExtendModalTerritory(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                Territorio #{extendModalTerritory.number}: <strong className="text-zinc-900 dark:text-[#F4F4F5]">{extendModalTerritory.name}</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Nueva Fecha Límite
                </label>
                <input
                  type="date"
                  value={extendNewDueDate}
                  onChange={e => setExtendNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <button
                type="button"
                onClick={() => setExtendModalTerritory(null)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] font-medium rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmExtend}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-[#27272A]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-[#18181F] text-white font-mono font-extrabold tabular-nums flex items-center justify-center text-xl border border-zinc-700/50 dark:border-[#27272A] shadow-xs">
                  {detailModalTerritory.number}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-lg leading-tight">
                    {detailModalTerritory.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(detailModalTerritory.type)}
                    <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-medium">{detailModalTerritory.zone}</span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">~{detailModalTerritory.estimatedHomes} hogares</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailModalTerritory(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-2 p-3 bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-600 dark:text-[#A1A1AA]">Estado actual:</span>
                {getStatusBadge(detailModalTerritory)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const t = detailModalTerritory;
                    setDetailModalTerritory(null);
                    setDigitalCardTerritory(t);
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> Tarjeta Digital & QR
                </button>
                <button
                  onClick={() => handleShareWhatsApp(detailModalTerritory)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={() => setPolygonEditorTerritory(detailModalTerritory)}
                  className="px-3 py-1 bg-zinc-900 dark:bg-[#27272A] text-white rounded-lg font-medium hover:bg-zinc-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <Map className="w-3.5 h-3.5" /> Polígono
                </button>
                {detailModalTerritory.mapUrl && /^https:\/\//i.test(detailModalTerritory.mapUrl.trim()) ? (
                  <a
                    href={detailModalTerritory.mapUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Mapa
                  </a>
                ) : (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${detailModalTerritory.name} ${settings.congregationName}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Buscar Mapa
                  </a>
                )}
              </div>
            </div>

            {/* Boundaries & Notes */}
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-zinc-800 dark:text-[#F4F4F5] text-xs uppercase tracking-wider mb-1">
                  Límites y Geografía del Territorio
                </h4>
                <p className="bg-zinc-50 dark:bg-[#18181F] p-3 rounded-xl text-zinc-700 dark:text-[#A1A1AA] text-xs border border-zinc-200/80 dark:border-[#27272A] leading-relaxed">
                  {detailModalTerritory.boundsDescription || 'No se han especificado límites exactos.'}
                </p>
              </div>

              {/* Vista Previa de Mapa Interactivo Leaflet */}
              <div className="pt-1">
                <TerritoryCardMap territory={detailModalTerritory} heightClass="h-56" />
              </div>

              {detailModalTerritory.notes && (
                <div>
                  <h4 className="font-semibold text-zinc-800 dark:text-[#F4F4F5] text-xs uppercase tracking-wider mb-1">
                    Instrucciones &amp; Notas de Predicación
                  </h4>
                  <p className="bg-zinc-50 dark:bg-[#18181F] p-3 rounded-xl text-zinc-700 dark:text-[#A1A1AA] text-xs border border-zinc-200/80 dark:border-[#27272A] leading-relaxed">
                    {detailModalTerritory.notes}
                  </p>
                </div>
              )}
            </div>

            {/* No Visit Section (Do-Not-Call) */}
            <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-800 dark:text-[#F4F4F5] text-sm flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Domicilios "No Visitar" ({detailModalTerritory.noVisits?.length || 0})
                </h4>
              </div>

              {detailModalTerritory.noVisits && detailModalTerritory.noVisits.length > 0 ? (
                <div className="space-y-2">
                  {detailModalTerritory.noVisits.map(nv => (
                    <div
                      key={nv.id}
                      className="flex items-start justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-xs shadow-2xs"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-[#F4F4F5]">{nv.address}</div>
                        {nv.residentName && <div className="text-zinc-700 dark:text-[#A1A1AA]">Residente: {nv.residentName}</div>}
                        <div className="text-zinc-500 dark:text-[#A1A1AA] mt-0.5 italic">
                          {nv.reason || 'Petición expresa'} (Registrado: {nv.dateAdded})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          removeNoVisitAddress(detailModalTerritory.id, nv.id);
                          showToast('Dirección eliminada.');
                        }}
                        className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 p-1 cursor-pointer"
                        title="Quitar de la lista de no visitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No hay direcciones marcadas como "No Visitar" en este territorio.</p>
              )}

              {/* Add No Visit Form */}
              <div className="bg-zinc-50 dark:bg-[#18181F] p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] space-y-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-[#F4F4F5] block">
                  + Agregar nuevo domicilio "No Visitar"
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Dirección exacta (ej: Calle 4 #12-30)*"
                    value={newNoVisitAddress}
                    onChange={e => setNewNoVisitAddress(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="Nombre residente (opcional)"
                    value={newNoVisitName}
                    onChange={e => setNewNoVisitName(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-200 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Motivo o fecha de solicitud (ej: Petición verbal formal)"
                    value={newNoVisitReason}
                    onChange={e => setNewNoVisitReason(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-zinc-200 dark:border-[#27272A] rounded-lg bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleAddNoVisit}
                    disabled={!newNoVisitAddress.trim()}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shrink-0 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            {/* S-13 History Table */}
            <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <h4 className="font-bold text-zinc-800 dark:text-[#F4F4F5] text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Historial S-13 de Asignaciones Pasadas
              </h4>

              <div className="overflow-x-auto border border-zinc-200 dark:border-[#27272A] rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-100 dark:bg-[#18181F] font-semibold text-zinc-700 dark:text-[#A1A1AA] border-b border-zinc-200 dark:border-[#27272A]">
                    <tr>
                      <th className="p-2.5">Publicador</th>
                      <th className="p-2.5">Asignado</th>
                      <th className="p-2.5">Devuelto</th>
                      <th className="p-2.5">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                    {detailModalTerritory.history && detailModalTerritory.history.length > 0 ? (
                      detailModalTerritory.history.map((h, i) => (
                        <tr key={h.id || i} className={!h.returnedDate ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-medium' : ''}>
                          <td className="p-2.5 font-medium text-zinc-800 dark:text-[#F4F4F5]">{h.publisherName}</td>
                          <td className="p-2.5 text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums">{h.assignedDate}</td>
                          <td className="p-2.5 text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums">
                            {h.returnedDate || <span className="text-indigo-600 dark:text-indigo-400 font-semibold">En curso</span>}
                          </td>
                          <td className="p-2.5 text-zinc-500 dark:text-[#A1A1AA] italic">{h.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-zinc-400 dark:text-zinc-500 italic">
                          Aún no hay historial de asignaciones registrado para este territorio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-[#27272A]">
              <button
                onClick={async () => {
                  const confirmed = await confirm({
                    title: 'Eliminar territorio',
                    message: `¿Estás seguro de eliminar el territorio #${detailModalTerritory.number}?`,
                    confirmText: 'Eliminar',
                    cancelText: 'Cancelar',
                    type: 'danger',
                  });
                  if (confirmed) {
                    deleteTerritory(detailModalTerritory.id);
                    setDetailModalTerritory(null);
                    showToast('Territorio eliminado.');
                  }
                }}
                className="text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar territorio
              </button>

              <button
                onClick={() => setDetailModalTerritory(null)}
                className="px-4 py-2 bg-zinc-900 dark:bg-[#18181F] text-white border border-zinc-800 dark:border-[#27272A] hover:bg-zinc-800 dark:hover:bg-[#27272A] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-[#27272A] space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-lg">
                  {isCreatingNew ? 'Nuevo Territorio de Congregación' : `Editar Territorio #${editTerritoryModal?.number}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditTerritoryModal(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTerritory} className="space-y-3.5 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="01, 14, R-02..."
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Nombre o Barrio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Barrio San José, Bulevar Central..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Tipo de Territorio
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as TerritoryType })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Zona o Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Zona Norte, Centro, Sector Este..."
                    value={formData.zone}
                    onChange={e => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Cantidad Estimada de Hogares / Puertas
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={formData.estimatedHomes}
                  onChange={e => setFormData({ ...formData, estimatedHomes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Límites del Territorio (Calles / Avenidas que lo delimitan)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Norte: Calle 4 | Sur: Av. Libertad | Este: Quebrada | Oeste: Carrera 10"
                  value={formData.boundsDescription}
                  onChange={e => setFormData({ ...formData, boundsDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Enlace de Mapa Digital (Google Maps o similar)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={formData.mapUrl}
                  onChange={e => setFormData({ ...formData, mapUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Observaciones Generales
                </label>
                <textarea
                  rows={2}
                  placeholder="Recomendaciones de horario, estacionamiento, precauciones..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-[#27272A] rounded-xl text-sm bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditTerritoryModal(null);
                  }}
                  className="px-4 py-2 text-sm text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-[#F4F4F5] font-medium rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs cursor-pointer"
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

      <LocalOfficialFormsModal
        isOpen={isS13ModalOpen}
        onClose={() => setIsS13ModalOpen(false)}
        initialFormCode="S-13"
      />
    </div>
  );
};
