// src/components/PrecursoresAuxiliaresTab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { AuxPioneerRequest, Publisher } from '../types';
import { AuxPioneerModal } from './pioneers/AuxPioneerModal';
import {
  Target,
  Plus,
  Printer,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  Award,
  Sparkles,
  MessageCircle,
  X,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Send,
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const PrecursoresAuxiliaresTab: React.FC = () => {
  const {
    auxPioneerRequests,
    addAuxPioneerRequest,
    updateAuxPioneerRequest,
    deleteAuxPioneerRequest,
    setAuxPioneerRequestStatus,
    publishers,
    publishersMap,
    settings,
  } = useCongregation();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'aprobada' | 'rechazada'>('all');
  const [hoursFilter, setHoursFilter] = useState<'all' | '15' | '30'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<AuxPioneerRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<AuxPioneerRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getPublisherName = (pubId?: string, nid?: string) => {
    const id = pubId || nid;
    if (!id) return 'Publicador no asignado';
    const pub = publishersMap.get(id) || publishers.find((p) => p.nid === id || p.id === id);
    return pub ? pub.name : 'Publicador Desconocido';
  };

  const getPublisherPhone = (pubId?: string, nid?: string) => {
    const id = pubId || nid;
    if (!id) return undefined;
    const pub = publishersMap.get(id) || publishers.find((p) => p.nid === id || p.id === id);
    return pub?.phone;
  };

  // KPIs
  const stats = useMemo(() => {
    const total = auxPioneerRequests.length;
    const pending = auxPioneerRequests.filter((r) => r.status === 'pendiente' || r.estado === 'pendiente').length;
    const approved = auxPioneerRequests.filter((r) => r.status === 'aprobada' || r.estado === 'aprobada').length;
    const target30 = auxPioneerRequests.filter((r) => (r.targetHours || r.meta_horas) === 30).length;
    const target15 = auxPioneerRequests.filter((r) => (r.targetHours || r.meta_horas) === 15).length;

    return {
      total,
      pending,
      approved,
      target30,
      target15,
    };
  }, [auxPioneerRequests]);

  // Filtered lists
  const filteredRequests = useMemo(() => {
    return auxPioneerRequests.filter((r) => {
      const currentStatus = r.status || r.estado || 'pendiente';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;

      const currentHours = String(r.targetHours || r.meta_horas || 30);
      if (hoursFilter !== 'all' && currentHours !== hoursFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pubName = getPublisherName(r.publisherId, r.publisher_nid).toLowerCase();
        const monthName = MONTH_NAMES[r.month !== undefined ? r.month : (r.mes ?? 0)]?.toLowerCase() || '';
        const notes = (r.notes || r.nota_opcional || '').toLowerCase();
        if (!pubName.includes(query) && !monthName.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [auxPioneerRequests, statusFilter, hoursFilter, searchQuery, publishersMap]);

  const pendingRequests = useMemo(() => {
    return auxPioneerRequests.filter((r) => (r.status || r.estado || 'pendiente') === 'pendiente');
  }, [auxPioneerRequests]);

  const historyRequests = useMemo(() => {
    return filteredRequests.filter((r) => (r.status || r.estado || 'pendiente') !== 'pendiente');
  }, [filteredRequests]);

  // Handlers
  const handleUpdateStatus = (req: AuxPioneerRequest, newStatus: 'aprobada' | 'rechazada') => {
    setAuxPioneerRequestStatus(
      req.id,
      newStatus,
      'Comité de Servicio de la Congregación'
    );
    showToast(`Solicitud ${newStatus === 'aprobada' ? 'APROBADA' : 'RECHAZADA'} con éxito`);
  };

  const handleSaveRequest = (reqData: Partial<AuxPioneerRequest>) => {
    if (editingRequest) {
      updateAuxPioneerRequest({
        ...editingRequest,
        ...reqData,
      } as AuxPioneerRequest);
      showToast('Solicitud actualizada con éxito');
    } else {
      addAuxPioneerRequest({
        publisherId: reqData.publisherId || '',
        publisher_nid: reqData.publisherId || '',
        month: reqData.month !== undefined ? reqData.month : (reqData.mes ?? 0),
        mes: reqData.month !== undefined ? reqData.month : (reqData.mes ?? 0),
        year: reqData.year || reqData.anio || new Date().getFullYear(),
        anio: reqData.year || reqData.anio || new Date().getFullYear(),
        targetHours: reqData.targetHours || reqData.meta_horas || 30,
        meta_horas: reqData.targetHours || reqData.meta_horas || 30,
        isContinuous: reqData.isContinuous || false,
        status: 'pendiente',
        estado: 'pendiente',
        requestDate: reqData.requestDate || new Date().toISOString().split('T')[0],
        fecha_solicitud: reqData.requestDate || new Date().toISOString(),
        notes: reqData.notes || reqData.nota_opcional || '',
        nota_opcional: reqData.notes || reqData.nota_opcional || '',
      });
      showToast('Nueva solicitud registrada');
    }
    setIsModalOpen(false);
    setEditingRequest(null);
  };

  const handleConfirmDelete = () => {
    if (requestToDelete) {
      deleteAuxPioneerRequest(requestToDelete.id);
      showToast('Solicitud eliminada');
      setRequestToDelete(null);
    }
  };

  const handleSendApprovalWhatsApp = (req: AuxPioneerRequest) => {
    const pubName = getPublisherName(req.publisherId, req.publisher_nid);
    const phone = getPublisherPhone(req.publisherId, req.publisher_nid);
    const monthName = MONTH_NAMES[req.month !== undefined ? req.month : (req.mes ?? 0)];
    const year = req.year || req.anio || new Date().getFullYear();
    const hours = req.targetHours || req.meta_horas || 30;

    const message = `Estimado(a) ${pubName}, nos da mucha alegría informarle que el Comité de Servicio de la Congregación ha APROBADO su solicitud para servir como Precursor(a) Auxiliar durante el mes de ${monthName} de ${year} (meta: ${hours} horas). Confiamos en que Jehová bendecirá en gran manera sus esfuerzos en el ministerio del campo. ¡Muchos éxitos!`;

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col text-zinc-900 dark:text-[#F4F4F5] transition-colors">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles size={18} className="animate-spin text-amber-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Barra de Acciones de Precursores Auxiliares */}
        <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-indigo-500/8 dark:bg-indigo-400/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 hidden sm:flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono tabular-nums">
              Formulario S-205b
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-[#A1A1AA]">
              Gestión y aprobación de solicitudes del Comité de Servicio
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {/* Print Register */}
            <button
              onClick={() => window.print()}
              title="Imprimir el registro de solicitudes aprobadas para el comité"
              className="px-3.5 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-zinc-700 dark:text-[#F4F4F5] hover:bg-white dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
            >
              <Printer size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Imprimir Registro</span>
            </button>

            {/* New Request Button */}
            <button
              onClick={() => {
                setEditingRequest(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} className="shrink-0" />
              <span className="truncate">Nueva Solicitud</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Solicitudes */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-zinc-400 dark:text-[#A1A1AA] mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                Total Solicitudes
              </span>
              <Award size={18} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                {stats.total}
              </span>
              <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-medium">registradas</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1">Año de servicio activo</div>
          </div>

          {/* Pendientes de Revisión */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-amber-500/8 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-amber-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pendientes
              </span>
              <Clock size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {stats.pending}
              </span>
              <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-medium">por revisar</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1">
              {stats.pending > 0 ? 'Requieren acción del comité' : 'Al día, sin pendientes'}
            </div>
          </div>

          {/* Aprobadas */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-emerald-500/8 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-emerald-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Aprobadas
              </span>
              <CheckCircle size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {stats.approved}
              </span>
              <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-medium">aprobadas</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1">Comité de servicio conforme</div>
          </div>

          {/* Meta 30 Horas */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-indigo-500 dark:text-indigo-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Meta 30 Horas
              </span>
              <Target size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                {stats.target30}
              </span>
              <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-medium">estándar</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1">Requisito regular</div>
          </div>

          {/* Meta 15 Horas */}
          <div className="col-span-2 sm:col-span-1 kg-card-bento kg-glass-surface kg-sheen-top p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-sky-500/8 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-sky-500 dark:text-sky-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Meta 15 Horas
              </span>
              <Sparkles size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                {stats.target15}
              </span>
              <span className="text-xs text-zinc-400 dark:text-[#A1A1AA] font-medium">especiales</span>
            </div>
            <div className="text-[11px] text-zinc-400 dark:text-[#A1A1AA] mt-1">Campaña / Visita SC</div>
          </div>
        </div>

        {/* SECTION 1: PENDING APPROVAL REQUESTS (Interactive Cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-[#F4F4F5]">
                Pendientes de Revisión por el Comité ({pendingRequests.length})
              </h3>
            </div>
            {pendingRequests.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                Acción Requerida
              </span>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-8 text-center text-zinc-500 dark:text-[#A1A1AA] shadow-sm">
              <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-[#F4F4F5]">
                ¡Todas las solicitudes están al día!
              </h4>
              <p className="text-xs text-zinc-400 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
                No hay solicitudes de precursor auxiliar pendientes de resolución por el Comité de
                Servicio.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((req) => {
                const pubName = getPublisherName(req.publisherId, req.publisher_nid);
                const monthName = MONTH_NAMES[req.month !== undefined ? req.month : (req.mes ?? 0)];
                const year = req.year || req.anio || new Date().getFullYear();
                const hours = req.targetHours || req.meta_horas || 30;
                const note = req.notes || req.nota_opcional;

                return (
                  <div
                    key={req.id}
                    className="kg-card-bento kg-glass-surface kg-sheen-top border-2 border-amber-400/50 dark:border-amber-500/35 rounded-3xl p-5 transition-all flex flex-col justify-between gap-4 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-bold text-base text-zinc-900 dark:text-[#F4F4F5] leading-tight">
                            {pubName}
                          </h4>
                          <p className="text-xs text-zinc-400 dark:text-[#A1A1AA] mt-0.5 font-mono tabular-nums">
                            Solicitado el {req.requestDate || (req.fecha_solicitud ? new Date(req.fecha_solicitud).toLocaleDateString() : 'Recientemente')}
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase rounded-full border border-amber-500/30 shrink-0">
                          Pendiente
                        </span>
                      </div>

                      {/* Details Box */}
                      <div className="bg-white/70 dark:bg-white/4 rounded-2xl p-3 space-y-2 border border-zinc-200/60 dark:border-white/6 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-[#A1A1AA]">Mes de Servicio:</span>
                          <span className="font-bold text-zinc-800 dark:text-[#F4F4F5]">
                            {monthName} <span className="font-mono tabular-nums">{year}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-[#A1A1AA]">Meta Requerida:</span>
                          <span className="font-bold font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/25">
                            {hours} Horas
                          </span>
                        </div>
                        {req.isContinuous && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 pt-0.5">
                            <Sparkles size={12} />
                            <span>Solicitud Continua (hasta nuevo aviso)</span>
                          </div>
                        )}
                        {note && (
                          <div className="mt-2 text-xs italic text-zinc-600 dark:text-[#A1A1AA] border-l-2 border-indigo-400 pl-2 pt-0.5">
                            "{note}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Approve / Reject / Edit */}
                    <div className="relative z-10 space-y-2 pt-2 border-t border-zinc-100/80 dark:border-white/6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(req, 'aprobada')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
                        >
                          <CheckCircle size={15} /> Aprobar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req, 'rechazada')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold transition-all border border-rose-200/70 dark:border-rose-500/30 cursor-pointer"
                        >
                          <XCircle size={15} /> Rechazar
                        </button>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingRequest(req);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={13} /> Editar datos
                        </button>
                        <button
                          onClick={() => setRequestToDelete(req)}
                          className="p-1.5 text-zinc-400 dark:text-[#A1A1AA] hover:text-rose-600 dark:hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: SEARCH & FILTER + HISTORICAL DIRECTORY TABLE */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
              <Award size={18} className="text-indigo-500 dark:text-indigo-400" />
              Directorio e Historial de Solicitudes ({filteredRequests.length})
            </h3>
          </div>

          {/* Filter Bar */}
          <div className="kg-glass-surface p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#A1A1AA] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por hermano, mes u observaciones..."
                className="w-full bg-white/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-[#F4F4F5] placeholder:text-zinc-400 dark:placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-zinc-400 dark:text-[#A1A1AA] mr-1 hidden sm:inline">Estado:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'aprobada', label: 'Aprobadas' },
                { id: 'pendiente', label: 'Pendientes' },
                { id: 'rechazada', label: 'Rechazadas' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                      : 'bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/60 dark:border-white/8 hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  {st.label}
                </button>
              ))}

              {/* Hours Filter */}
              <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-white/10 pl-2 ml-1">
                {[
                  { id: 'all', label: 'Horas' },
                  { id: '30', label: '30h' },
                  { id: '15', label: '15h' },
                ].map((hf) => (
                  <button
                    key={hf.id}
                    onClick={() => setHoursFilter(hf.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer font-mono tabular-nums ${
                      hoursFilter === hf.id
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-white/60 dark:bg-white/5 text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/60 dark:border-white/8 hover:bg-white dark:hover:bg-white/10'
                    }`}
                  >
                    {hf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Directory Table */}
          {filteredRequests.length === 0 ? (
            <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl p-8 text-center text-zinc-500 dark:text-[#A1A1AA] shadow-sm">
              No se encontraron solicitudes con los filtros aplicados.
            </div>
          ) : (
            <div className="kg-card-bento kg-glass-surface kg-sheen-top border border-zinc-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-600 dark:text-[#A1A1AA]">
                  <thead className="bg-zinc-50/90 dark:bg-[#18181F] text-[11px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] border-b border-zinc-200/80 dark:border-white/8">
                    <tr>
                      <th className="px-5 py-3.5">Publicador</th>
                      <th className="px-5 py-3.5">Mes / Año</th>
                      <th className="px-5 py-3.5 text-center">Horas</th>
                      <th className="px-5 py-3.5 text-center">Continua</th>
                      <th className="px-5 py-3.5">Fecha Solicitud</th>
                      <th className="px-5 py-3.5 text-center">Estado</th>
                      <th className="px-5 py-3.5">Respuesta / Comité</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100/80 dark:divide-white/5">
                    {filteredRequests.map((req) => {
                      const pubName = getPublisherName(req.publisherId, req.publisher_nid);
                      const monthName = MONTH_NAMES[req.month !== undefined ? req.month : (req.mes ?? 0)];
                      const year = req.year || req.anio || new Date().getFullYear();
                      const hours = req.targetHours || req.meta_horas || 30;
                      const status = req.status || req.estado || 'pendiente';

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-zinc-50/60 dark:hover:bg-white/4 transition-colors"
                        >
                          {/* Publicador */}
                          <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-[#F4F4F5]">
                            {pubName}
                          </td>

                          {/* Mes / Año */}
                          <td className="px-5 py-3.5 font-medium text-zinc-700 dark:text-[#F4F4F5]">
                            {monthName} <span className="font-mono tabular-nums">{year}</span>
                          </td>

                          {/* Horas */}
                          <td className="px-5 py-3.5 text-center">
                            <span className="font-mono tabular-nums font-bold px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20">
                              {hours}h
                            </span>
                          </td>

                          {/* Continua */}
                          <td className="px-5 py-3.5 text-center">
                            {req.isContinuous ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                Sí
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Fecha Solicitud */}
                          <td className="px-5 py-3.5 text-xs text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                            {req.requestDate || (req.fecha_solicitud ? new Date(req.fecha_solicitud).toLocaleDateString() : '—')}
                          </td>

                          {/* Estado Badge */}
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                                status === 'aprobada'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : status === 'rechazada'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          {/* Respuesta / Comité */}
                          <td className="px-5 py-3.5 text-xs">
                            {req.responseDate || req.fecha_respuesta ? (
                              <span className="text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                                {req.responseDate || new Date(req.fecha_respuesta!).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic">Pendiente de firma</span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Send WhatsApp if approved */}
                              {status === 'aprobada' && (
                                <button
                                  type="button"
                                  onClick={() => handleSendApprovalWhatsApp(req)}
                                  className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                  title="Enviar felicitación / notificación por WhatsApp"
                                >
                                  <MessageCircle size={15} />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRequest(req);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl text-zinc-400 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
                                title="Editar solicitud"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setRequestToDelete(req)}
                                className="p-1.5 rounded-xl text-zinc-400 dark:text-[#A1A1AA] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                                title="Eliminar solicitud"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Request Modal */}
      <AuxPioneerModal
        isOpen={isModalOpen}
        request={editingRequest}
        publishers={publishers}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRequest(null);
        }}
        onSave={handleSaveRequest}
      />

      {/* Delete Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[280] flex items-center justify-center p-4">
          <div className="kg-card-bento kg-glass-surface kg-sheen-top rounded-3xl p-6 max-w-md w-full border border-zinc-200/80 dark:border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-[#F4F4F5]">
                  ¿Eliminar esta solicitud?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">Esta acción removerá el registro del archivo.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] bg-white/70 dark:bg-white/4 p-3 rounded-2xl border border-zinc-200/60 dark:border-white/8">
              Hermano:{' '}
              <strong className="text-zinc-900 dark:text-[#F4F4F5]">
                {getPublisherName(requestToDelete.publisherId, requestToDelete.publisher_nid)}
              </strong>
              <span className="block text-zinc-400 dark:text-[#A1A1AA] mt-0.5">
                Mes: {MONTH_NAMES[requestToDelete.month !== undefined ? requestToDelete.month : (requestToDelete.mes ?? 0)]}{' '}
                <span className="font-mono tabular-nums">{requestToDelete.year || requestToDelete.anio}</span> (
                <span className="font-mono tabular-nums">{requestToDelete.targetHours || requestToDelete.meta_horas}</span> horas)
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-white/8 border border-zinc-200/80 dark:border-white/10 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-500/30 transition-all cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY Official Aux Pioneer Register Template */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
        <div className="border-4 border-black p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">
              REGISTRO DE PRECURSORES AUXILIARES (S-205)
            </h1>
            <h2 className="text-lg font-bold">
              CONGREGACIÓN DE LOS TESTIGOS DE JEHOVÁ •{' '}
              {settings.congregationName || 'CONGREGACIÓN LOCAL'}
            </h2>
            <p className="text-xs text-zinc-600 mt-1">
              COMITÉ DE SERVICIO DE LA CONGREGACIÓN • FECHA DE IMPRESIÓN:{' '}
              {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>

          {/* Table */}
          <table className="w-full text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-zinc-100 border-b border-black">
                <th className="border border-black p-2 text-center w-8">#</th>
                <th className="border border-black p-2 text-left">Nombre del Publicador</th>
                <th className="border border-black p-2 text-center w-28">Mes / Año</th>
                <th className="border border-black p-2 text-center w-16">Meta</th>
                <th className="border border-black p-2 text-center w-20">Continua</th>
                <th className="border border-black p-2 text-center w-24">Fecha Solicitud</th>
                <th className="border border-black p-2 text-center w-20">Estado</th>
                <th className="border border-black p-2 text-center w-24">Fecha Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {auxPioneerRequests.map((req, idx) => {
                const pubName = getPublisherName(req.publisherId, req.publisher_nid);
                const monthName = MONTH_NAMES[req.month !== undefined ? req.month : (req.mes ?? 0)];
                const year = req.year || req.anio || new Date().getFullYear();
                const hours = req.targetHours || req.meta_horas || 30;
                const status = req.status || req.estado || 'pendiente';

                return (
                  <tr key={req.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-black p-2 font-semibold">{pubName}</td>
                    <td className="border border-black p-2 text-center">
                      {monthName} {year}
                    </td>
                    <td className="border border-black p-2 text-center font-mono">{hours}h</td>
                    <td className="border border-black p-2 text-center">
                      {req.isContinuous ? 'SÍ' : 'NO'}
                    </td>
                    <td className="border border-black p-2 text-center font-mono text-[10px]">
                      {req.requestDate || (req.fecha_solicitud ? new Date(req.fecha_solicitud).toLocaleDateString() : '—')}
                    </td>
                    <td className="border border-black p-2 text-center font-bold text-[10px] uppercase">
                      {status}
                    </td>
                    <td className="border border-black p-2 text-center font-mono text-[10px]">
                      {req.responseDate || (req.fecha_respuesta ? new Date(req.fecha_respuesta).toLocaleDateString() : '—')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Committee Signatures */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-black pt-2">
              <p className="font-bold">Coordinador del Cuerpo de Ancianos</p>
              <p className="text-[10px] text-zinc-500">Firma y Fecha</p>
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">Secretario de la Congregación</p>
              <p className="text-[10px] text-zinc-500">Firma y Fecha</p>
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">Superintendente de Servicio</p>
              <p className="text-[10px] text-zinc-500">Firma y Fecha</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
