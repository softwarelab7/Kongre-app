// src/components/DigitalTerritoryModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { Territory, NoVisitAddress, Publisher } from '../types';
import { useCongregation } from '../context/CongregationContext';
import { TerritoryCardMap } from './territories/TerritoryCardMap';
import {
  X,
  MapPin,
  ExternalLink,
  QrCode,
  Share2,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  Home,
  CheckSquare,
  Square,
  Plus,
  Send,
  Calendar,
  User,
  Clock,
  Navigation,
  Download,
  Printer,
  Sparkles,
  Info,
  Phone,
} from 'lucide-react';

interface DigitalTerritoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  territory: Territory;
  standaloneMobile?: boolean;
}

export const DigitalTerritoryModal: React.FC<DigitalTerritoryModalProps> = ({
  isOpen,
  onClose,
  territory,
  standaloneMobile = false,
}) => {
  const { publishersMap, settings, addNoVisitAddress, returnTerritory } = useCongregation();

  const [activeTab, setActiveTab] = useState<'card' | 'qr' | 'novisits'>('card');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`kongre_terr_blocks_${territory.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  // New No-Visit Form
  const [showAddNoVisit, setShowAddNoVisit] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newResident, setNewResident] = useState('');
  const [newReason, setNewReason] = useState('Petición expresa de no tocar ni visitar.');

  const assignee = territory.currentAssigneeId
    ? publishersMap.get(territory.currentAssigneeId)
    : null;

  // Generate digital territory URL
  const territoryShareUrl = useMemo(() => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    return `${origin}${path}?territorio=${encodeURIComponent(territory.number)}`;
  }, [territory.number]);

  // Google Maps link
  const googleMapsUrl = useMemo(() => {
    if (territory.mapUrl && territory.mapUrl.trim()) {
      return territory.mapUrl;
    }
    const query = `${territory.name}, ${territory.zone}, ${settings.congregationName || ''} ${settings.hallAddress || ''}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
  }, [territory.mapUrl, territory.name, territory.zone, settings.congregationName, settings.hallAddress]);

  // Generate QR Code
  useEffect(() => {
    if (territoryShareUrl) {
      QRCode.toDataURL(territoryShareUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [territoryShareUrl]);

  // Save completed blocks to local storage
  const toggleBlock = (blockNum: number) => {
    const updated = new Set(completedBlocks);
    if (updated.has(blockNum)) {
      updated.delete(blockNum);
    } else {
      updated.add(blockNum);
    }
    setCompletedBlocks(updated);
    try {
      localStorage.setItem(`kongre_terr_blocks_${territory.id}`, JSON.stringify(Array.from(updated)));
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(territoryShareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  const handleShareWhatsApp = () => {
    const pubName = assignee ? assignee.name : 'Hermano/a';
    const noVisitsCount = territory.noVisits?.length || 0;
    const noVisitsText =
      noVisitsCount > 0
        ? `⚠️ *Atención:* Hay ${noVisitsCount} casa(s) con solicitud de NO VISITAR registradas en la tarjeta digital.`
        : '✅ No hay reportes de casas de no visitar en este momento.';

    const message = `📋 *TARJETA DIGITAL DE TERRITORIO*\n\n` +
      `Estimado(a) *${pubName}*:\n` +
      `Aquí tienes la tarjeta digital de tu asignación:\n\n` +
      `🗺️ *Territorio #${territory.number} - ${territory.name}*\n` +
      `📍 *Zona:* ${territory.zone} (~${territory.estimatedHomes} hogares)\n` +
      (territory.boundsDescription ? `📏 *Límites:* ${territory.boundsDescription}\n` : '') +
      `\n${noVisitsText}\n\n` +
      `🔗 *Abre tu mapa y notas en tu móvil:* \n${territoryShareUrl}\n\n` +
      `¡Mucho éxito en el ministerio de campo! 📖`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Territorio #${territory.number} - ${territory.name}`,
          text: `Tarjeta Digital de Territorio #${territory.number} (${territory.zone})`,
          url: territoryShareUrl,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Territorio_${territory.number}.png`;
    link.click();
  };

  const handleSaveNoVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;

    addNoVisitAddress(territory.id, {
      address: newAddress.trim(),
      residentName: newResident.trim() || undefined,
      dateAdded: new Date().toISOString().slice(0, 10),
      reason: newReason.trim() || 'Petición expresa de no visitar.',
    });

    setNewAddress('');
    setNewResident('');
    setNewReason('Petición expresa de no tocar ni visitar.');
    setShowAddNoVisit(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Tarjeta digital del territorio ${territory.number}`}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-indigo-800 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar tarjeta"
            aria-label="Cerrar tarjeta digital de territorio"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-14 h-14 rounded-2xl bg-white text-indigo-900 font-extrabold flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
              {territory.number}
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100 backdrop-blur-xs">
                Tarjeta Digital S-13
              </span>
              <h2 className="text-lg sm:text-xl font-bold truncate mt-1 text-white">
                {territory.name}
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-200" />
                <span>{territory.zone}</span>
                <span>•</span>
                <span>~{territory.estimatedHomes} hogares</span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 bg-white/15 p-1 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Mapa & Info</span>
            </button>
            <button
              onClick={() => setActiveTab('novisits')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'novisits'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>No Visitar ({territory.noVisits?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Código QR & Enlace</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'card' && (
            <div className="space-y-4">
              {/* FASE 5: MAPA INTERACTIVO OPENSTREETMAP / LEAFLET */}
              <TerritoryCardMap territory={territory} />

              {/* PRIMARY ACTION: OPEN IN GOOGLE MAPS */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Navegar en Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Abre el mapa satelital, calles y límites directamente en la app de tu móvil
                    </p>
                  </div>
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition shrink-0 active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Abrir Mapa</span>
                </a>
              </div>

              {/* No-Visits Critical Banner Alert */}
              {territory.noVisits && territory.noVisits.length > 0 ? (
                <div
                  onClick={() => setActiveTab('novisits')}
                  className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-100/70 transition"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        {territory.noVisits.length}{' '}
                        {territory.noVisits.length === 1
                          ? 'Casa registrada para NO VISITAR'
                          : 'Casas registradas para NO VISITAR'}
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Haz clic aquí para ver las direcciones exactas y observaciones
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60">
                    Ver
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No hay reportes de casas con petición de no visitar en este territorio.</span>
                </div>
              )}

              {/* Boundaries & Block Notes */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Límites y Notas de Manzana</span>
                </h4>

                {territory.boundsDescription ? (
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {territory.boundsDescription}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Sin descripción de límites registrada.
                  </p>
                )}

                {territory.notes && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Instrucciones especiales del territorio:
                    </span>
                    {territory.notes}
                  </div>
                )}
              </div>

              {/* Ministry Block Progress Checklist */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Control de Manzanas Trabajadas</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {completedBlocks.size} de 6 manzanas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pulsa las manzanas que vayas completando en la jornada de predicación:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const isChecked = completedBlocks.has(num);
                    return (
                      <button
                        key={num}
                        onClick={() => toggleBlock(num)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>Manzana {num}</span>
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-white" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Assignment Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Publicador asignado:</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    {assignee ? assignee.name : 'Disponible / Sin asignar'}
                  </span>
                </div>
                {territory.assignedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Fecha de entrega:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {territory.assignedDate}
                    </span>
                  </div>
                )}
                {territory.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Límite recomendado (4 meses):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {territory.dueDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NO VISITAR */}
          {activeTab === 'novisits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Registro Oficial de Casas «No Visitar»</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hogares donde los ocupantes han solicitado explícitamente no ser visitados
                  </p>
                </div>

                <button
                  onClick={() => setShowAddNoVisit((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reportar casa</span>
                </button>
              </div>

              {/* Add form */}
              {showAddNoVisit && (
                <form
                  onSubmit={handleSaveNoVisit}
                  className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3 animate-fade-in"
                >
                  <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Añadir Dirección de «No Visitar»
                  </h5>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Dirección exacta o manzana/lote *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Calle Los Robles #142 (casa con reja blanca)"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nombre de la persona (si se conoce)
                      </label>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={newResident}
                        onChange={(e) => setNewResident(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Motivo / Observación
                      </label>
                      <input
                        type="text"
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddNoVisit(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                    >
                      Guardar en Territorio
                    </button>
                  </div>
                </form>
              )}

              {/* List of No Visits */}
              {territory.noVisits && territory.noVisits.length > 0 ? (
                <div className="space-y-2.5">
                  {territory.noVisits.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/60 shadow-2xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center shrink-0">
                            !
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.address}
                          </span>
                        </div>
                        {item.residentName && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7">
                            Persona: <span className="font-medium">{item.residentName}</span>
                          </p>
                        )}
                        {item.reason && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pl-7">
                            «{item.reason}»
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 pl-7 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Registrado el: {item.dateAdded}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Territorio sin restricciones de No Visitar
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Todas las casas pueden ser visitadas amablemente siguiendo las pautas teocráticas.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE & SHARE */}
          {activeTab === 'qr' && (
            <div className="space-y-5 text-center">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block mx-auto shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Código QR Territorio ${territory.number}`}
                    className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-xl shadow-xs bg-white p-2"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                    Generando código QR...
                  </div>
                )}
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">
                  Escanear con la cámara del móvil
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Abre la tarjeta digital, el mapa y la lista de casas al instante
                </p>
              </div>

              {/* Direct share actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Enlace Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar QR (PNG)</span>
                </button>
              </div>

              {/* URL preview box */}
              <div className="p-3 bg-slate-100 dark:bg-slate-950/70 rounded-xl text-left border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  {territoryShareUrl}
                </span>
                <button
                  onClick={handleNativeShare}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] shrink-0"
                >
                  Compartir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="hidden sm:inline">Tarjeta compatible con cualquier teléfono móvil y modo sin conexión</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 transition text-xs shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
