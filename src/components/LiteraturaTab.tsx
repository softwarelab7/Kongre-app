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
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';

export const LiteraturaTab: React.FC = () => {
  const {
    publishers,
    preachingGroups,
    literatureItems,
    specialOrders,
    groupDistributions,
    inventoryRecords,
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

  // Filters for items
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LiteratureItem | null>(null);

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

  // WhatsApp helper
  const handleOpenWhatsApp = (text: string, phone?: string) => {
    const encoded = encodeURIComponent(text);
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Adjust stock
  const handleAdjustStock = (item: LiteratureItem, delta: number) => {
    const newStock = Math.max(0, (item.currentStock || 0) + delta);
    updateLiteratureItem({
      ...item,
      currentStock: newStock,
      lastCountDate: new Date().toISOString().split('T')[0],
    });
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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide border border-blue-500/30">
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Formulario Oficial S-14 • Departamento de Literatura</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Literatura & Publicaciones (S-14)
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl">
              Fichero oficial de existencias de publicaciones, control de reservas mínimas, tramitación
              de pedidos especiales a Betel, distribución a grupos y recuento físico para la visita del
              Superintendente de Circuito.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const msg = buildLowStockReportWhatsApp(literatureItems);
                handleOpenWhatsApp(msg);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Reporte Stock Bajo WhatsApp</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl border border-white/20 transition-all backdrop-blur-xs active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha S-14</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab('inventario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'inventario'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Fichero S-14 (Catálogo)</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
              {stats.totalItems}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('pedidos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'pedidos'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Pedidos Especiales</span>
            {stats.pendingOrdersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900 font-bold">
                {stats.pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('grupos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'grupos'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Distribución a Grupos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('recuento_s14')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSubTab === 'recuento_s14'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Recuento Físico Oficial</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Títulos en Catálogo
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalItems}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">Biblias, libros y revistas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Unidades en Existencia
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.totalUnits}</div>
          <span className="text-xs text-slate-400 mt-0.5 block">En mostrador y almacén</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Stock Bajo / Agotado
          </span>
          <div
            className={`text-2xl font-black mt-1 ${
              stats.lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {stats.lowStockCount}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {stats.lowStockCount > 0 ? 'Requiere pedido a Betel' : 'Existencias saludables'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pedidos Pendientes
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {stats.pendingOrdersCount}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Solicitudes de publicadores</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: INVENTARIO & CATÁLOGO S-14                      */}
      {/* ========================================================= */}
      {activeSubTab === 'inventario' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Category Filter, and Add Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, título o estante..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category dropdown */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
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
                  <span className={onlyLowStock ? 'text-amber-800 dark:text-amber-400 font-bold' : ''}>
                    Solo Stock Bajo / Agotado
                  </span>
                }
              />
            </div>

            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Publicación</span>
            </button>
          </div>

          {/* Literature Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => {
                    const isOut = item.currentStock === 0;
                    const isLow = item.currentStock <= item.minimumStock && !isOut;
                    const catInfo = LITERATURE_CATEGORY_LABELS[item.category] || {
                      label: item.category,
                      color: 'bg-slate-100 text-slate-700',
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.title}</span>
                          <span className="text-[11px] text-slate-400">
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
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {item.locationBox || 'Mostrador'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                            <button
                              onClick={() => handleAdjustStock(item, -1)}
                              className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 font-bold flex items-center justify-center shadow-2xs"
                              title="Restar 1"
                            >
                              -
                            </button>
                            <span className="w-8 font-black text-slate-900 text-sm text-center">
                              {item.currentStock}
                            </span>
                            <button
                              onClick={() => handleAdjustStock(item, 1)}
                              className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 font-bold flex items-center justify-center shadow-2xs"
                              title="Sumar 1"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-semibold">
                          {item.minimumStock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Agotado
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Stock Bajo
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Óptimo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Editar publicación"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteLiteratureItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron publicaciones con los filtros aplicados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: PEDIDOS ESPECIALES DE PUBLICADORES             */}
      {/* ========================================================= */}
      {activeSubTab === 'pedidos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Pedidos Especiales de los Publicadores</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Seguimiento de Biblias en letra grande, publicaciones en idiomas foráneos y cancioneros
                solicitados personalmente.
              </p>
            </div>

            <button
              onClick={() => setIsAddOrderModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Pedido</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialOrders.map(order => {
              const pub = publishers.find(p => p.id === order.publisherId);
              const pubName = pub?.name || 'Publicador';
              const statusCfg = SPECIAL_ORDER_STATUS_CONFIG[order.status] || {
                label: order.status,
                badgeClass: 'bg-slate-100 text-slate-700',
              };

              return (
                <div
                  key={order.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        👤 {pubName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-indigo-950">
                        {order.itemTitle}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cantidad: <strong>{order.quantity} ejemplar(es)</strong>{' '}
                        {order.language && `• Idioma: ${order.language}`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Fecha pedido: {order.requestDate}
                      </p>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        💡 {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {/* Status updater */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500">Cambiar Estado:</span>
                      <select
                        value={order.status}
                        onChange={e =>
                          handleUpdateOrderStatus(order, e.target.value as SpecialOrderStatus)
                        }
                        className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="solicitado">1. Solicitado</option>
                        <option value="pedido_a_betel">2. Pedido a Betel</option>
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
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Avisar de llegada WhatsApp</span>
                      </button>

                      <button
                        onClick={() => deleteSpecialOrder(order.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
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

          {specialOrders.length === 0 && (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No hay pedidos especiales registrados actualmente.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: DISTRIBUCIÓN A GRUPOS DE PREDICACIÓN           */}
      {/* ========================================================= */}
      {activeSubTab === 'grupos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Distribución Periódica de Revistas y Tratados a los Grupos</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paquetes de predicación preparados para cada grupo de servicio del campo para las salidas
              semanales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {preachingGroups.map(group => {
              const dist = groupDistributions.find(d => d.groupNumber === group.number) || {
                groupNumber: group.number,
                magazinesCount: 25,
                tractsCount: 50,
                brochuresCount: 10,
                lastDistributedDate: '2026-09-20',
              };

              const overseer = publishers.find(p => p.id === group.overseerId);

              return (
                <div
                  key={group.number}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-sm">
                        G{group.number}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{group.name}</span>
                    </div>

                    <div className="text-xs text-slate-500">
                      <span>Superintendente: </span>
                      <strong className="text-slate-800 block truncate">
                        {overseer?.name || 'Por designar'}
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">📰 Revistas:</span>
                        <input
                          type="number"
                          value={dist.magazinesCount}
                          onChange={e =>
                            updateGroupDistribution({
                              ...dist,
                              magazinesCount: Number(e.target.value),
                            })
                          }
                          className="w-16 text-center font-bold p-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">📑 Tratados:</span>
                        <input
                          type="number"
                          value={dist.tractsCount}
                          onChange={e =>
                            updateGroupDistribution({
                              ...dist,
                              tractsCount: Number(e.target.value),
                            })
                          }
                          className="w-16 text-center font-bold p-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">📖 Folletos:</span>
                        <input
                          type="number"
                          value={dist.brochuresCount}
                          onChange={e =>
                            updateGroupDistribution({
                              ...dist,
                              brochuresCount: Number(e.target.value),
                            })
                          }
                          className="w-16 text-center font-bold p-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
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
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
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
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: RECUENTO FÍSICO OFICIAL S-14                    */}
      {/* ========================================================= */}
      {activeSubTab === 'recuento_s14' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Actas de Recuento Físico Oficial de Literatura (S-14)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Conteo físico anual de inventario para la visita del Superintendente de Circuito y
                cuadre con los registros de la sucursal.
              </p>
            </div>

            <button
              onClick={() => setIsCountModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
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
                  className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Año de Servicio {rec.serviceYear}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Fecha: {rec.countDate}</span>
                  </div>

                  <div className="text-2xl font-black text-slate-900">
                    {rec.totalItemsCounted} Unidades Recontadas
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Siervo de Literatura</span>
                      <strong className="text-slate-800">{servant?.name || 'Designado'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Anciano Supervisor</span>
                      <strong className="text-slate-800">{overseer?.name || 'Designado'}</strong>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Agregar Publicación al Fichero S-14</span>
              </h3>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Oficial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. bi12, lff, T-36"
                    value={newItem.code}
                    onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newItem.category}
                    onChange={e =>
                      setNewItem({ ...newItem, category: e.target.value as LiteratureCategory })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">Título de la Publicación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ¡Disfrute de la vida para siempre!"
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Idioma</label>
                  <input
                    type="text"
                    value={newItem.language}
                    onChange={e => setNewItem({ ...newItem, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.currentStock}
                    onChange={e => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.minimumStock}
                    onChange={e => setNewItem({ ...newItem, minimumStock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ubicación / Estante</label>
                <input
                  type="text"
                  placeholder="Ej. Estante B1 (Mostrador)"
                  value={newItem.locationBox}
                  onChange={e => setNewItem({ ...newItem, locationBox: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Editar Publicación</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={editingItem.code}
                    onChange={e => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={editingItem.category}
                    onChange={e =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as LiteratureCategory,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Idioma</label>
                  <input
                    type="text"
                    value={editingItem.language}
                    onChange={e => setEditingItem({ ...editingItem, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.currentStock}
                    onChange={e =>
                      setEditingItem({ ...editingItem, currentStock: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.minimumStock}
                    onChange={e =>
                      setEditingItem({ ...editingItem, minimumStock: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={editingItem.locationBox || ''}
                  onChange={e => setEditingItem({ ...editingItem, locationBox: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Registrar Pedido Especial de Publicador</span>
              </h3>
              <button
                onClick={() => setIsAddOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpecialOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Publicador Solicitante</label>
                <select
                  required
                  value={newOrder.publisherId}
                  onChange={e => setNewOrder({ ...newOrder, publisherId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Publicación Solicitada
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Biblia Traducción del Nuevo Mundo (Letra Grande)"
                  value={newOrder.itemTitle}
                  onChange={e => setNewOrder({ ...newOrder, itemTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Idioma</label>
                  <input
                    type="text"
                    value={newOrder.language}
                    onChange={e => setNewOrder({ ...newOrder, language: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrder.quantity}
                    onChange={e => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas o Motivo</label>
                <input
                  type="text"
                  placeholder="Ej. Para estudiante de la Biblia que no tiene ejemplar propio"
                  value={newOrder.notes}
                  onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Registrar Recuento Físico S-14</span>
              </h3>
              <button
                onClick={() => setIsCountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhysicalCount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Año de Servicio</label>
                <input
                  type="text"
                  required
                  value={newCount.serviceYear}
                  onChange={e => setNewCount({ ...newCount, serviceYear: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Siervo de Literatura</label>
                <select
                  required
                  value={newCount.servantPublisherId}
                  onChange={e =>
                    setNewCount({ ...newCount, servantPublisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">Anciano Supervisor</label>
                <select
                  required
                  value={newCount.overseerPublisherId}
                  onChange={e =>
                    setNewCount({ ...newCount, overseerPublisherId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
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

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-medium">
                Se registrará un conteo total de <strong>{stats.totalUnits} publicaciones</strong> en
                el Salón del Reino con fecha de hoy.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas de Verificación</label>
                <input
                  type="text"
                  value={newCount.notes}
                  onChange={e => setNewCount({ ...newCount, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  Completar Recuento S-14
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
