// src/components/LiteraturaTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  LiteratureItem,
  LiteratureCategory,
  LiteratureSpecialOrder,
  SpecialOrderStatus,
  LiteratureGroupDistribution,
  LiteratureInventoryRecord,
} from '../types';
import {
  LITERATURE_CATEGORY_LABELS,
  SPECIAL_ORDER_STATUS_CONFIG,
  buildSpecialOrderArrivedWhatsApp,
  buildLowStockReportWhatsApp,
  buildGroupDistributionWhatsApp,
  computeLiteratureInventoryAnalysis,
  buildGroupSpecialOrdersWhatsApp,
  openSafeWhatsAppUrl,
  printLiteratureInventoryS28A4,
  printGroupLiteratureDispatchA4,
} from '../utils/literatureHelper';
import {
  BookOpen,
  Layers,
  Bookmark,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Printer,
  Share2,
  Send,
  Trash2,
  Edit3,
  Save,
  X,
  Truck,
  Inbox,
  Check,
  Building,
  Users,
  Flame,
  ArrowUpDown,
  Upload,
  MessageCircle,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';
import { LocalOfficialFormsModal } from './LocalOfficialFormsCenter';
import {
  getLocalOfficialFormBytes,
  fillOfficialS28Pdf,
  downloadPdfBytesLocally,
} from '../services/localOfficialFormsService';

export const LiteraturaTab: React.FC = () => {
  const {
    publishers,
    preachingGroups,
    literatureItems,
    specialOrders,
    groupDistributions,
    inventoryRecords,
    settings,
    addLiteratureItem,
    updateLiteratureItem,
    deleteLiteratureItem,
    addSpecialOrder,
    updateSpecialOrder,
    deleteSpecialOrder,
    updateGroupDistribution,
    recordPhysicalCount,
  } = useCongregation();

  // Active subtab
  const [activeSubTab, setActiveSubTab] = useState<
    'inventario' | 'pedidos' | 'grupos' | 'recuento_s14'
  >('inventario');

  // Filters for items & orders
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [orderGroupFilter, setOrderGroupFilter] = useState<string>('todos');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('todos');
  const [dispatchGroupFilter, setDispatchGroupFilter] = useState<number | 'todos'>('todos');
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<string>('recibido_en_salon');
  const [dispatchSearchQuery, setDispatchSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LiteratureItem | null>(null);
  const [isS28ModalOpen, setIsS28ModalOpen] = useState(false);

  const handleDownloadOfficialS28 = async () => {
    try {
      const stored = await getLocalOfficialFormBytes('S-28');
      if (!stored) {
        setIsS28ModalOpen(true);
        return;
      }
      const filledBytes = await fillOfficialS28Pdf(stored.bytes, literatureItems, settings);
      downloadPdfBytesLocally(
        filledBytes,
        `S-28_Oficial_Relleno_${settings.congregationName.replace(/\s+/g, '_')}.pdf`
      );
      showToast('PDF Oficial S-28 rellenado y descargado con las existencias de literatura.');
    } catch {
      setIsS28ModalOpen(true);
    }
  };

  // Form states
  const [newItem, setNewItem] = useState<{
    code: string;
    title: string;
    category: LiteratureCategory;
    language: string;
    currentStock: number;
    minimumStock: number;
    locationBox: string;
    notes: string;
  }>({
    code: '',
    title: '',
    category: 'libro',
    language: 'Español',
    currentStock: 0,
    minimumStock: 5,
    locationBox: 'Mostrador',
    notes: '',
  });

  const [newOrder, setNewOrder] = useState<{
    publisherId: string;
    itemId: string;
    itemTitle: string;
    language: string;
    quantity: number;
    notes: string;
  }>({
    publisherId: '',
    itemId: '',
    itemTitle: '',
    language: 'Español',
    quantity: 1,
    notes: '',
  });

  const [newCount, setNewCount] = useState<{
    serviceYear: string;
    servantPublisherId: string;
    overseerPublisherId: string;
    notes: string;
  }>({
    serviceYear: '2025-2026',
    servantPublisherId: '',
    overseerPublisherId: '',
    notes: 'Recuento físico anual verificado en el mostrador y almacén del Salón del Reino.',
  });

  // Filtered Publishers
  const activePublishers = useMemo(() => {
    return publishers.filter(p => p.active);
  }, [publishers]);

  const brothers = useMemo(() => {
    return publishers.filter(p => p.gender === 'hermano' && p.active);
  }, [publishers]);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = literatureItems.length;
    const totalUnits = literatureItems.reduce((acc, i) => acc + (i.currentStock || 0), 0);
    const lowStockCount = literatureItems.filter(i => i.currentStock <= i.minimumStock).length;
    const pendingOrdersCount = specialOrders.filter(
      o => o.status === 'solicitado' || o.status === 'pedido_a_betel' || o.status === 'recibido_en_salon'
    ).length;

    return {
      totalItems,
      totalUnits,
      lowStockCount,
      pendingOrdersCount,
    };
  }, [literatureItems, specialOrders]);

  // Filtered literature items list
  const filteredItems = useMemo(() => {
    return literatureItems.filter(item => {
      if (categoryFilter !== 'todos' && item.category !== categoryFilter) return false;
      if (onlyLowStock && item.currentStock > item.minimumStock) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchLang = item.language.toLowerCase().includes(q);
        const matchBox = item.locationBox?.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchLang && !matchBox) return false;
      }
      return true;
    });
  }, [literatureItems, categoryFilter, onlyLowStock, searchQuery]);

  // Comprehensive S-28 / S-14 Inventory Analysis
  const inventoryAnalysis = useMemo(() => {
    return computeLiteratureInventoryAnalysis(
      literatureItems,
      specialOrders,
      publishers,
      preachingGroups
    );
  }, [literatureItems, specialOrders, publishers, preachingGroups]);

  // Filtered Special Orders
  const filteredSpecialOrders = useMemo(() => {
    return specialOrders.filter(order => {
      if (orderStatusFilter !== 'todos' && order.status !== orderStatusFilter) return false;
      if (orderGroupFilter !== 'todos') {
        const gNum = Number(orderGroupFilter);
        const pub = publishers.find(p => p.id === order.publisherId);
        const groupObj = preachingGroups.find(g => g.number === gNum);
        const belongsToGroup =
          pub?.groupNumber === gNum || Boolean(groupObj?.memberIds.includes(order.publisherId));
        if (!belongsToGroup) return false;
      }
      return true;
    });
  }, [specialOrders, orderStatusFilter, orderGroupFilter, publishers, preachingGroups]);

  // WhatsApp helper (iframe-safe anchor dispatch)
  const handleOpenWhatsApp = (text: string, phone?: string) => {
    openSafeWhatsAppUrl(text, phone);
  };

  // Dispatch filtered orders by preaching group
  const dispatchOrders = useMemo(() => {
    return specialOrders.filter((order) => {
      if (order.status === 'cancelado') return false;
      if (dispatchStatusFilter !== 'todos' && order.status !== dispatchStatusFilter) {
        return false;
      }
      const pub = publishers.find((p) => p.id === order.publisherId);
      if (dispatchGroupFilter !== 'todos') {
        const belongs =
          pub?.groupNumber === dispatchGroupFilter ||
          Boolean(preachingGroups.find((g) => g.number === dispatchGroupFilter)?.memberIds.includes(order.publisherId));
        if (!belongs) return false;
      }
      if (dispatchSearchQuery.trim()) {
        const q = dispatchSearchQuery.toLowerCase();
        const matchesPub = (pub?.name || '').toLowerCase().includes(q);
        const matchesTitle = order.itemTitle.toLowerCase().includes(q);
        if (!matchesPub && !matchesTitle) return false;
      }
      return true;
    });
  }, [specialOrders, dispatchStatusFilter, dispatchGroupFilter, dispatchSearchQuery, publishers, preachingGroups]);

  // Quick dispatch KPIs
  const dispatchKpis = useMemo(() => {
    const readyCount = specialOrders.filter((o) => o.status === 'recibido_en_salon').length;
    const inTransitCount = specialOrders.filter(
      (o) => o.status === 'pedido_a_betel' || o.status === 'solicitado'
    ).length;
    const deliveredCount = specialOrders.filter((o) => o.status === 'entregado').length;
    return { readyCount, inTransitCount, deliveredCount };
  }, [specialOrders]);

  // Adjust stock
  const handleAdjustStock = (item: LiteratureItem, delta: number) => {
    const newStock = Math.max(0, (item.currentStock || 0) + delta);
    updateLiteratureItem({
      ...item,
      currentStock: newStock,
      lastCountDate: new Date().toISOString().split('T')[0],
    });
  };

  // Receive suggested restock for an item
  const handleReceiveSuggestedShipment = (item: LiteratureItem, qty: number) => {
    handleAdjustStock(item, qty);
    showToast(`Recibidos +${qty} ejemplares de "${item.title}" en inventario S-28`);
  };

  // Handle Add Item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.code.trim() || !newItem.title.trim()) return;

    addLiteratureItem({
      code: newItem.code.trim(),
      title: newItem.title.trim(),
      category: newItem.category,
      language: newItem.language.trim() || 'Español',
      currentStock: Number(newItem.currentStock) || 0,
      minimumStock: Number(newItem.minimumStock) || 0,
      locationBox: newItem.locationBox.trim() || undefined,
      lastCountDate: new Date().toISOString().split('T')[0],
      notes: newItem.notes.trim() || undefined,
    });

    setNewItem({
      code: '',
      title: '',
      category: 'libro',
      language: 'Español',
      currentStock: 0,
      minimumStock: 5,
      locationBox: 'Mostrador',
      notes: '',
    });
    setIsAddItemModalOpen(false);
  };

  // Handle Edit Item
  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateLiteratureItem(editingItem);
    setEditingItem(null);
  };

  // Handle Add Special Order
  const handleCreateSpecialOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.publisherId || !newOrder.itemTitle.trim()) return;

    addSpecialOrder({
      publisherId: newOrder.publisherId,
      itemId: newOrder.itemId || undefined,
      itemTitle: newOrder.itemTitle.trim(),
      language: newOrder.language.trim() || undefined,
      quantity: Number(newOrder.quantity) || 1,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'solicitado',
      notes: newOrder.notes.trim() || undefined,
    });

    setNewOrder({
      publisherId: '',
      itemId: '',
      itemTitle: '',
      language: 'Español',
      quantity: 1,
      notes: '',
    });
    setIsAddOrderModalOpen(false);
  };

  // Handle change status of special order
  const handleUpdateOrderStatus = (order: LiteratureSpecialOrder, newStatus: SpecialOrderStatus) => {
    const updated: LiteratureSpecialOrder = {
      ...order,
      status: newStatus,
      deliveredDate: newStatus === 'entregado' ? new Date().toISOString().split('T')[0] : order.deliveredDate,
    };
    updateSpecialOrder(updated);

    // If marked as received in kingdom hall, prompt user or offer instant notification
    if (newStatus === 'recibido_en_salon') {
      const pub = publishers.find(p => p.id === order.publisherId);
      if (pub) {
        const msg = buildSpecialOrderArrivedWhatsApp(order, pub.name);
        handleOpenWhatsApp(msg, pub.phone);
      }
    }
  };

  // Handle Complete Count S-14
  const handleSavePhysicalCount = (e: React.FormEvent) => {
    e.preventDefault();
    recordPhysicalCount({
      serviceYear: newCount.serviceYear,
      countDate: new Date().toISOString().split('T')[0],
      servantPublisherId: newCount.servantPublisherId || undefined,
      overseerPublisherId: newCount.overseerPublisherId || undefined,
      totalItemsCounted: stats.totalUnits,
      isCountCompleted: true,
      notes: newCount.notes.trim() || undefined,
    });
    setIsCountModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra Unificada de Sub-pestañas y Acciones de Literatura */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Sub-tab Navigation - 2-column grid on mobile so nothing clips */}
        <div className="grid grid-cols-2 sm:flex rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-zinc-100/90 dark:bg-zinc-900/80 p-1.5 gap-1">
          <button
            onClick={() => setActiveSubTab('inventario')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'inventario'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-[#F4F4F5] shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Catálogo S-14</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 ${
              activeSubTab === 'inventario'
                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200'
            }`}>
              {stats.totalItems}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('pedidos')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'pedidos'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-[#F4F4F5] shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Pedidos</span>
            {stats.pendingOrdersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                activeSubTab === 'pedidos'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
              }`}>
                {stats.pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('grupos')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'grupos'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-[#F4F4F5] shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Grupos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('recuento_s14')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'recuento_s14'
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-[#F4F4F5] shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Recuento Físico</span>
          </button>
        </div>

        {/* Action quick buttons */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button
            onClick={() => {
              const msg = buildLowStockReportWhatsApp(literatureItems);
              handleOpenWhatsApp(msg);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-[#F4F4F5] font-bold text-xs rounded-full border border-zinc-200/80 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
            title="Enviar solicitud sugerida de stock bajo por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">Pedido Sugerido</span>
          </button>

          <button
            onClick={handleDownloadOfficialS28}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Cargar el PDF oficial S-28 de JW Hub para que la app lo rellene y descargue"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">PDF S-28 Oficial</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in duration-200">
          <span>✓ {toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-zinc-500/10 blur-2xl" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider block relative">
            Títulos en Catálogo
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] mt-1 relative">{stats.totalItems}</div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block relative">Biblias, libros y revistas</span>
        </div>

        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider block relative">
            Unidades en Existencia
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1 relative">{stats.totalUnits}</div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block relative">En mostrador y almacén</span>
        </div>

        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider block relative">
            Stock Bajo / Agotado
          </span>
          <div
            className={`text-xl sm:text-2xl font-black font-mono tabular-nums mt-1 relative ${
              stats.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {stats.lowStockCount}
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block relative">
            {stats.lowStockCount > 0 ? 'Requiere pedido a Betel' : 'Existencias saludables'}
          </span>
        </div>

        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-purple-500/10 blur-2xl" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider block relative">
            Pedidos Pendientes
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1 relative">
            {stats.pendingOrdersCount}
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 block relative">Solicitudes de publicadores</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: INVENTARIO & CATÁLOGO S-14                      */}
      {/* ========================================================= */}
      {activeSubTab === 'inventario' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Category Filter, and Add Button */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, título o estante..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/40 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                {/* Category dropdown */}
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="text-xs px-3.5 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900 dark:text-[#F4F4F5] font-semibold focus:ring-2 focus:ring-indigo-500/40 focus:outline-hidden"
                >
                  <option value="todos">Todas las Categorías</option>
                  <option value="biblia">Biblias</option>
                  <option value="libro">Libros de Estudio</option>
                  <option value="folleto">Folletos</option>
                  <option value="tratado">Tratados</option>
                  <option value="revista">Revistas</option>
                  <option value="campana_especial">Campaña Especial</option>
                  <option value="otro">Otros Artículos</option>
                </select>

                {/* Low stock toggle */}
                <SplashCheckbox
                  size="sm"
                  checked={onlyLowStock}
                  onChange={e => setOnlyLowStock(e.target.checked)}
                  label={
                    <span className={onlyLowStock ? 'text-amber-800 dark:text-amber-400 font-bold text-xs' : 'text-xs text-zinc-700 dark:text-[#A1A1AA]'}>
                      Stock Bajo
                    </span>
                  }
                />
              </div>
            </div>

            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nueva Publicación</span>
            </button>
          </div>

          {/* Literature Inventory: Mobile Card List + Desktop Table */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            {/* Mobile Card List (No horizontal clipping on phones) */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-[#27272A]">
              {filteredItems.map(item => {
                const isOut = item.currentStock === 0;
                const isLow = item.currentStock <= item.minimumStock && !isOut;
                const catInfo = LITERATURE_CATEGORY_LABELS[item.category] || {
                  label: item.category,
                  color: 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272A]',
                };

                return (
                  <div key={item.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200/70 dark:border-[#27272A]">
                            {item.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.color}`}>
                            {catInfo.label}
                          </span>
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                              Agotado
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                              Óptimo
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                          Ubicación: <strong className="text-zinc-700 dark:text-zinc-300">{item.locationBox || 'Mostrador'}</strong> • Mínimo: <span className="font-mono tabular-nums">{item.minimumStock}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
                          title="Editar publicación"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLiteratureItem(item.id)}
                          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
                          title="Eliminar del catálogo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#27272A]">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA]">
                        Existencias en stock:
                      </span>
                      <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-[#18181F] px-2.5 py-1 rounded-xl border border-zinc-200/80 dark:border-[#27272A]">
                        <button
                          onClick={() => handleAdjustStock(item, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#323238] font-bold flex items-center justify-center shadow-2xs cursor-pointer"
                          title="Restar 1"
                        >
                          -
                        </button>
                        <span className="w-8 font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] text-sm text-center">
                          {item.currentStock}
                        </span>
                        <button
                          onClick={() => handleAdjustStock(item, 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#323238] font-bold flex items-center justify-center shadow-2xs cursor-pointer"
                          title="Sumar 1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#18181F] border-b border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Título de la Publicación</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4 text-center">Existencias</th>
                    <th className="py-3 px-4 text-center">Mínimo</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                  {filteredItems.map(item => {
                    const isOut = item.currentStock === 0;
                    const isLow = item.currentStock <= item.minimumStock && !isOut;
                    const catInfo = LITERATURE_CATEGORY_LABELS[item.category] || {
                      label: item.category,
                      color: 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-[#27272A]',
                    };

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#18181F]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold tabular-nums text-zinc-800 dark:text-[#F4F4F5]">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">{item.title}</span>
                          <span className="text-[11px] text-zinc-400 dark:text-[#71717A]">
                            Idioma: {item.language} {item.notes && `• ${item.notes}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.color}`}
                          >
                            {catInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-[#A1A1AA] font-medium">
                          {item.locationBox || 'Mostrador'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-[#18181F] px-2 py-1 rounded-lg border border-zinc-200/80 dark:border-[#27272A]">
                            <button
                              onClick={() => handleAdjustStock(item, -1)}
                              className="w-5 h-5 rounded bg-white dark:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#323238] font-bold flex items-center justify-center shadow-2xs cursor-pointer"
                              title="Restar 1"
                            >
                              -
                            </button>
                            <span className="w-8 font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5] text-sm text-center">
                              {item.currentStock}
                            </span>
                            <button
                              onClick={() => handleAdjustStock(item, 1)}
                              className="w-5 h-5 rounded bg-white dark:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#323238] font-bold flex items-center justify-center shadow-2xs cursor-pointer"
                              title="Sumar 1"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums font-semibold">
                          {item.minimumStock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                              Agotado
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                              Óptimo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
                              title="Editar publicación"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteLiteratureItem(item.id)}
                              className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-[#18181F] transition-colors cursor-pointer"
                              title="Eliminar del catálogo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                No se encontraron publicaciones con los filtros aplicados.
              </div>
            )}
          </div>

          {/* Asistente de Reposición S-14 / S-28 para Artículos con Stock Bajo */}
          {inventoryAnalysis.suggestedReorderList.length > 0 && (
            <div className="kg-card-bento kg-glass-surface kg-sheen-top bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/20 rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>
                      Asistente de Reposición a la Sucursal (S-14) •{' '}
                      <span className="font-mono tabular-nums">{inventoryAnalysis.suggestedReorderList.length}</span> Publicaciones por Debajo del Mínimo
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
                    Cantidades sugeridas para restablecer el inventario mensual (S-28) al doble del stock mínimo de seguridad.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const msg = buildLowStockReportWhatsApp(literatureItems);
                    handleOpenWhatsApp(msg);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-full shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compartir Lista de Pedido (WhatsApp)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {inventoryAnalysis.suggestedReorderList.map(({ item, suggestedOrderQty }) => (
                  <div
                    key={item.id}
                    className="kg-card-bento kg-glass-surface kg-sheen-top p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                        Actual: <strong className="text-rose-600 dark:text-rose-400 font-mono tabular-nums">{item.currentStock}</strong> / Mín:{' '}
                        <span className="font-mono tabular-nums">{item.minimumStock}</span> • Sugerido: <strong className="font-mono tabular-nums">+{suggestedOrderQty}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReceiveSuggestedShipment(item, suggestedOrderQty)}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold font-mono tabular-nums whitespace-nowrap cursor-pointer transition-colors"
                      title="Registrar recepción de este envío en el inventario S-28"
                    >
                      +{suggestedOrderQty} Recibir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: PEDIDOS ESPECIALES DE PUBLICADORES             */}
      {/* ========================================================= */}
      {activeSubTab === 'pedidos' && (
        <div className="space-y-4">
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Solicitudes Especiales de Literatura por Grupo (S-14)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                Control de Biblias de estudio, letra grande, publicaciones en otros idiomas y despacho por Grupo de Predicación.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={orderGroupFilter}
                onChange={e => setOrderGroupFilter(e.target.value)}
                className="text-xs px-3.5 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/70 font-semibold text-zinc-700 dark:text-[#F4F4F5]"
              >
                <option value="todos">Todos los Grupos</option>
                {preachingGroups.map(g => (
                  <option key={g.number} value={String(g.number)}>
                    Grupo {g.number} — {g.name}
                  </option>
                ))}
              </select>

              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="text-xs px-3.5 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/70 font-semibold text-zinc-700 dark:text-[#F4F4F5]"
              >
                <option value="todos">Todos los Estados</option>
                <option value="solicitado">1. Solicitado</option>
                <option value="pedido_a_betel">2. Pedido a Sucursal</option>
                <option value="recibido_en_salon">3. Recibido en el Salón</option>
                <option value="entregado">4. Entregado</option>
              </select>

              <button
                onClick={() => setIsAddOrderModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Pedido</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Despacho por Grupo de Predicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {inventoryAnalysis.ordersByGroup.map(gSummary => (
              <div
                key={gSummary.groupNumber}
                className="kg-card-bento kg-glass-surface kg-sheen-top p-4 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300">
                      Grupo {gSummary.groupNumber} • {gSummary.groupName}
                    </span>
                    <span className="text-[10px] font-mono font-bold tabular-nums px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900/70 text-zinc-700 dark:text-[#A1A1AA] border border-zinc-200/50 dark:border-white/10">
                      {gSummary.totalOrders} pedidos
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 truncate">
                    Sup.: <strong className="text-zinc-700 dark:text-zinc-300">{gSummary.overseerName}</strong>
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-mono font-bold tabular-nums">
                      En mostrador: {gSummary.readyToDeliverCount}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 font-mono font-semibold tabular-nums">
                      En trámite: {gSummary.pendingCount}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const msg = buildGroupSpecialOrdersWhatsApp(gSummary);
                    handleOpenWhatsApp(msg, gSummary.overseerPhone);
                  }}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Avisar a Sup. de Grupo</span>
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpecialOrders.map(order => {
              const pub = publishers.find(p => p.id === order.publisherId);
              const pubName = pub?.name || 'Publicador';
              const groupBadge = pub?.groupNumber ? `G${pub.groupNumber}` : null;
              const statusCfg = SPECIAL_ORDER_STATUS_CONFIG[order.status] || {
                label: order.status,
                badgeClass: 'bg-zinc-100 dark:bg-zinc-900/70 text-zinc-700 dark:text-[#A1A1AA] border-zinc-200 dark:border-white/10',
              };

              return (
                <div
                  key={order.id}
                  className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {groupBadge && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-mono font-black shrink-0">
                            {groupBadge}
                          </span>
                        )}
                        <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] truncate block">
                          {pubName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                        {order.itemTitle}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                        Cantidad: <strong className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">{order.quantity} ejemplar(es)</strong>{' '}
                        {order.language && `• Idioma: ${order.language}`}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-[#71717A] font-mono tabular-nums">
                        Fecha solicitud: {order.requestDate}
                        {order.deliveredDate ? ` • Entregado: ${order.deliveredDate}` : ''}
                      </p>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/10">
                        💡 {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-white/10 space-y-2">
                    {/* Status updater */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA]">Cambiar Estado:</span>
                      <select
                        value={order.status}
                        onChange={e =>
                          handleUpdateOrderStatus(order, e.target.value as SpecialOrderStatus)
                        }
                        className="text-xs px-2.5 py-1.5 rounded-full border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900 dark:text-[#F4F4F5]"
                      >
                        <option value="solicitado">1. Solicitado</option>
                        <option value="pedido_a_betel">2. Pedido a Sucursal</option>
                        <option value="recibido_en_salon">3. Recibido en el Salón</option>
                        <option value="entregado">4. Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    {/* WhatsApp action */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          const msg = buildSpecialOrderArrivedWhatsApp(order, pubName);
                          handleOpenWhatsApp(msg, pub?.phone);
                        }}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Avisar al publicador (WhatsApp)</span>
                      </button>

                      <button
                        onClick={() => deleteSpecialOrder(order.id)}
                        className="text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSpecialOrders.length === 0 && (
            <div className="kg-card-bento kg-glass-surface kg-sheen-top p-8 text-center text-zinc-400 dark:text-zinc-500 rounded-3xl border border-zinc-200/80 dark:border-white/10 text-xs">
              No hay pedidos especiales que coincidan con los filtros seleccionados.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: DESPACHO Y DISTRIBUCIÓN POR GRUPOS              */}
      {/* ========================================================= */}
      {activeSubTab === 'grupos' && (
        <div className="space-y-6 animate-fade-in">
          {/* SECCIÓN 1: DESPACHO DE PEDIDOS ESPECIALES POR GRUPO */}
          <div className="space-y-4">
            {/* KPI Ribbon de Despacho */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-emerald-500/25 bg-emerald-500/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Listos en Mostrador
                  </span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {dispatchKpis.readyCount}
                  </div>
                  <div className="text-[11px] text-zinc-500">Listos para entrega inmediata</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-indigo-500/25 bg-indigo-500/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    En Trámite / Sucursal
                  </span>
                  <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 tabular-nums">
                    {dispatchKpis.inTransitCount}
                  </div>
                  <div className="text-[11px] text-zinc-500">Pendientes de recibir en el salón</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Entregados con Éxito
                  </span>
                  <div className="text-2xl font-black text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {dispatchKpis.deliveredCount}
                  </div>
                  <div className="text-[11px] text-zinc-500">Historial de pedidos entregados</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-zinc-200/60 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter and Actions Bar */}
            <div className="p-4 rounded-3xl kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative min-w-[180px] flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={dispatchSearchQuery}
                    onChange={(e) => setDispatchSearchQuery(e.target.value)}
                    placeholder="Buscar publicador o publicación..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filter by Group */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-500">Grupo:</span>
                  <select
                    value={String(dispatchGroupFilter)}
                    onChange={(e) =>
                      setDispatchGroupFilter(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                    }
                    className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold text-xs cursor-pointer outline-hidden"
                  >
                    <option value="todos">Todos los Grupos</option>
                    {preachingGroups.map((g) => (
                      <option key={g.number} value={String(g.number)}>
                        Grupo {g.number} ({g.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter by Status */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-500">Estado:</span>
                  <select
                    value={dispatchStatusFilter}
                    onChange={(e) => setDispatchStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold text-xs cursor-pointer outline-hidden"
                  >
                    <option value="recibido_en_salon">🟢 Listos en Mostrador ({dispatchKpis.readyCount})</option>
                    <option value="todos">Todos los Estados</option>
                    <option value="pedido_a_betel">📦 Pedidos a Betel</option>
                    <option value="solicitado">⏳ Solicitados</option>
                    <option value="entregado">✓ Entregados</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printGroupLiteratureDispatchA4({
                      congregationName: settings.congregationName,
                      selectedGroup: dispatchGroupFilter,
                      specialOrders,
                      publishers,
                      preachingGroups,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                  title="Imprimir hoja de entrega física para firmas en el mostrador"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Imprimir Despacho A4</span>
                </button>

                {dispatchGroupFilter !== 'todos' && (
                  <button
                    type="button"
                    onClick={() => {
                      const grp = preachingGroups.find((g) => g.number === dispatchGroupFilter);
                      const overseer = publishers.find((p) => p.id === grp?.overseerId);
                      const groupSummary = inventoryAnalysis.ordersByGroup.find(
                        (g) => g.groupNumber === dispatchGroupFilter
                      );
                      if (groupSummary) {
                        const msg = buildGroupSpecialOrdersWhatsApp(groupSummary);
                        handleOpenWhatsApp(msg, overseer?.phone);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                    title="Enviar resumen completo de pedidos del grupo por WhatsApp al conductor"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Avisar al Conductor G{dispatchGroupFilter}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Special Orders Table for Dispatch */}
            <div className="kg-card-bento kg-glass-surface rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-100/80 dark:bg-white/5 border-b border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Publicador</th>
                      <th className="py-3 px-3">Grupo</th>
                      <th className="py-3 px-4">Publicación Solicitada</th>
                      <th className="py-3 px-3 text-center">Cant.</th>
                      <th className="py-3 px-4">Estado Actual</th>
                      <th className="py-3 px-4 text-right">Acciones de Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-white/5">
                    {dispatchOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400">
                          No hay pedidos especiales con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      dispatchOrders.map((order) => {
                        const pub = publishers.find((p) => p.id === order.publisherId);
                        const statusConf = SPECIAL_ORDER_STATUS_CONFIG[order.status];
                        const isReady = order.status === 'recibido_en_salon';
                        const isDelivered = order.status === 'entregado';

                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors"
                          >
                            {/* Publisher */}
                            <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-white">
                              <div className="font-bold">{pub?.name || 'Publicador'}</div>
                              {pub?.phone && (
                                <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                  {pub.phone}
                                </div>
                              )}
                            </td>

                            {/* Group */}
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-[11px]">
                                G{pub?.groupNumber || '—'}
                              </span>
                            </td>

                            {/* Item Title & Language */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-zinc-900 dark:text-white">
                                {order.itemTitle}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                {order.language || 'Español'}
                                {order.requestDate ? ` · Solicitado: ${order.requestDate}` : ''}
                              </div>
                            </td>

                            {/* Quantity */}
                            <td className="py-3.5 px-3 text-center font-bold text-zinc-900 dark:text-white font-mono text-sm">
                              {order.quantity}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  statusConf?.badgeClass || 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {statusConf?.label || order.status}
                              </span>
                              {order.deliveredDate && (
                                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                                  Entregado: {order.deliveredDate}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isReady && (
                                  <>
                                    {/* WhatsApp to publisher */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (pub) {
                                          const msg = buildSpecialOrderArrivedWhatsApp(order, pub.name);
                                          handleOpenWhatsApp(msg, pub.phone);
                                        }
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                                      title="Avisar al publicador por WhatsApp que ya llegó su libro/Biblia"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Avisar</span>
                                    </button>

                                    {/* Mark as delivered */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateOrderStatus(order, 'entregado');
                                        showToast(`Pedido entregado a ${pub?.name || 'publicador'}.`);
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Entregar ✓</span>
                                    </button>
                                  </>
                                )}

                                {!isReady && !isDelivered && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateOrderStatus(order, 'recibido_en_salon');
                                      showToast(`Marcado como recibido en salón.`);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                                  >
                                    Llegó al Salón
                                  </button>
                                )}

                                {isDelivered && (
                                  <span className="text-[11px] font-bold text-zinc-400">
                                    Entregado ✓
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DISTRIBUCIÓN PERIÓDICA DE REVISTAS Y TRATADOS A LOS GRUPOS */}
          <div className="space-y-4 pt-4 border-t border-zinc-200/80 dark:border-white/10">
            <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm">
              <h2 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Distribución Periódica de Revistas y Tratados a los Grupos</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                Paquetes de predicación preparados para cada grupo de servicio del campo para las salidas
                semanales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {preachingGroups.map((group) => {
                const dist = groupDistributions.find((d) => d.groupNumber === group.number) || {
                  groupNumber: group.number,
                  magazinesCount: 25,
                  tractsCount: 50,
                  brochuresCount: 10,
                  lastDistributedDate: '2026-09-20',
                };

                const overseer = publishers.find((p) => p.id === group.overseerId);

                return (
                  <div
                    key={group.number}
                    className="kg-card-bento kg-glass-surface kg-sheen-top p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-extrabold flex items-center justify-center text-sm">
                          G{group.number}
                        </span>
                        <span className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5]">
                          {group.name}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                        <span>Superintendente: </span>
                        <strong className="text-zinc-800 dark:text-zinc-200 block truncate">
                          {overseer?.name || 'Por designar'}
                        </strong>
                      </div>

                      <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-[#A1A1AA]">📰 Revistas:</span>
                          <input
                            type="number"
                            value={dist.magazinesCount}
                            onChange={(e) =>
                              updateGroupDistribution({
                                ...dist,
                                magazinesCount: Number(e.target.value),
                              })
                            }
                            className="w-16 text-center font-mono font-bold tabular-nums p-1 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-[#F4F4F5]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-[#A1A1AA]">📑 Tratados:</span>
                          <input
                            type="number"
                            value={dist.tractsCount}
                            onChange={(e) =>
                              updateGroupDistribution({
                                ...dist,
                                tractsCount: Number(e.target.value),
                              })
                            }
                            className="w-16 text-center font-mono font-bold tabular-nums p-1 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-[#F4F4F5]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-[#A1A1AA]">📖 Folletos:</span>
                          <input
                            type="number"
                            value={dist.brochuresCount}
                            onChange={(e) =>
                              updateGroupDistribution({
                                ...dist,
                                brochuresCount: Number(e.target.value),
                              })
                            }
                            className="w-16 text-center font-mono font-bold tabular-nums p-1 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-[#F4F4F5]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const msg = buildGroupDistributionWhatsApp(
                            group.number,
                            dist.magazinesCount,
                            dist.tractsCount,
                            overseer?.name
                          );
                          handleOpenWhatsApp(msg, overseer?.phone);
                        }}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Notificar por WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: RECUENTO FÍSICO OFICIAL S-14                    */}
      {/* ========================================================= */}
      {activeSubTab === 'recuento_s14' && (
        <div className="space-y-6">
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-6 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span>Actas de Recuento Físico Oficial de Literatura (S-14)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">
                Conteo físico anual de inventario para la visita del Superintendente de Circuito y
                cuadre con los registros de la sucursal.
              </p>
            </div>

            <button
              onClick={() => setIsCountModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nuevo Recuento S-14</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventoryRecords.map(rec => {
              const servant = publishers.find(p => p.id === rec.servantPublisherId);
              const overseer = publishers.find(p => p.id === rec.overseerPublisherId);

              return (
                <div
                  key={rec.id}
                  className="kg-card-bento kg-glass-surface kg-sheen-top p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-500/20 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tabular-nums text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                      Año de Servicio {rec.serviceYear}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-[#71717A] font-mono tabular-nums font-medium">Fecha: {rec.countDate}</span>
                  </div>

                  <div className="text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {rec.totalItemsCounted} Unidades Recontadas
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-white/10">
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-[#71717A] block">Siervo de Literatura</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{servant?.name || 'Designado'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 dark:text-[#71717A] block">Anciano Supervisor</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{overseer?.name || 'Designado'}</strong>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/70 p-2.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 italic">
                      "{rec.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AGREGAR PUBLICACIÓN AL CATÁLOGO                    */}
      {/* ========================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="kg-glass-surface kg-sheen-top rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Agregar Publicación al Fichero S-14</span>
              </h3>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Código Oficial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. bi12, lff, T-36"
                    value={newItem.code}
                    onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Categoría</label>
                  <select
                    value={newItem.category}
                    onChange={e =>
                      setNewItem({ ...newItem, category: e.target.value as LiteratureCategory })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="biblia">Biblia</option>
                    <option value="libro">Libro de Estudio</option>
                    <option value="folleto">Folleto</option>
                    <option value="tratado">Tratado</option>
                    <option value="revista">Revista</option>
                    <option value="campana_especial">Campaña Especial</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Título de la Publicación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ¡Disfrute de la vida para siempre!"
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Idioma</label>
                  <input
                    type="text"
                    value={newItem.language}
                    onChange={e => setNewItem({ ...newItem, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.currentStock}
                    onChange={e => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.minimumStock}
                    onChange={e => setNewItem({ ...newItem, minimumStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Ubicación / Estante</label>
                <input
                  type="text"
                  placeholder="Ej. Estante B1 (Mostrador)"
                  value={newItem.locationBox}
                  onChange={e => setNewItem({ ...newItem, locationBox: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Guardar Publicación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR PUBLICACIÓN                                 */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="kg-glass-surface kg-sheen-top rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Editar Publicación</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={editingItem.code}
                    onChange={e => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Categoría</label>
                  <select
                    value={editingItem.category}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as LiteratureCategory,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="biblia">Biblia</option>
                    <option value="libro">Libro de Estudio</option>
                    <option value="folleto">Folleto</option>
                    <option value="tratado">Tratado</option>
                    <option value="revista">Revista</option>
                    <option value="campana_especial">Campaña Especial</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Idioma</label>
                  <input
                    type="text"
                    value={editingItem.language}
                    onChange={e => setEditingItem({ ...editingItem, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.currentStock}
                    onChange={e =>
                      setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.minimumStock}
                    onChange={e =>
                      setEditingItem({ ...editingItem, minimumStock: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Ubicación</label>
                <input
                  type="text"
                  value={editingItem.locationBox || ''}
                  onChange={e => setEditingItem({ ...editingItem, locationBox: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR PEDIDO ESPECIAL                         */}
      {/* ========================================================= */}
      {isAddOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="kg-glass-surface kg-sheen-top rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Registrar Pedido Especial de Publicador</span>
              </h3>
              <button
                onClick={() => setIsAddOrderModalOpen(false)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpecialOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Publicador Solicitante</label>
                <select
                  required
                  value={newOrder.publisherId}
                  onChange={e => setNewOrder({ ...newOrder, publisherId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Seleccionar Publicador...</option>
                  {activePublishers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Publicación Solicitada
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Biblia Traducción del Nuevo Mundo (Letra Grande)"
                  value={newOrder.itemTitle}
                  onChange={e => setNewOrder({ ...newOrder, itemTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Idioma</label>
                  <input
                    type="text"
                    value={newOrder.language}
                    onChange={e => setNewOrder({ ...newOrder, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrder.quantity}
                    onChange={e => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Notas o Motivo</label>
                <input
                  type="text"
                  placeholder="Ej. Para estudiante de la Biblia que no tiene ejemplar propio"
                  value={newOrder.notes}
                  onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECUENTO FÍSICO S-14                               */}
      {/* ========================================================= */}
      {isCountModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="kg-glass-surface kg-sheen-top rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Registrar Recuento Físico S-14</span>
              </h3>
              <button
                onClick={() => setIsCountModalOpen(false)}
                className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhysicalCount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Año de Servicio</label>
                <input
                  type="text"
                  required
                  value={newCount.serviceYear}
                  onChange={e => setNewCount({ ...newCount, serviceYear: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Siervo de Literatura</label>
                <select
                  required
                  value={newCount.servantPublisherId}
                  onChange={e =>
                    setNewCount({ ...newCount, servantPublisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Seleccionar Hermano Nombrado...</option>
                  {brothers.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.privilege || 'publicador'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Anciano Supervisor</label>
                <select
                  required
                  value={newCount.overseerPublisherId}
                  onChange={e =>
                    setNewCount({ ...newCount, overseerPublisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">Seleccionar Anciano...</option>
                  {publishers
                    .filter(p => p.gender === 'hermano' && p.privilege === 'anciano')
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-950 dark:text-emerald-300 font-medium">
                Se registrará un conteo total de <strong className="font-mono tabular-nums">{stats.totalUnits} publicaciones</strong> en
                el Salón del Reino con fecha de hoy.
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#A1A1AA] mb-1">Notas de Verificación</label>
                <input
                  type="text"
                  value={newCount.notes}
                  onChange={e => setNewCount({ ...newCount, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Completar Recuento S-14
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LocalOfficialFormsModal
        isOpen={isS28ModalOpen}
        onClose={() => setIsS28ModalOpen(false)}
        initialFormCode="S-28"
      />
    </div>
  );
};
