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
  Minus,
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
  FileText,
  RotateCcw,
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

  // Dynamic block count
  const initialBlockCount = useMemo(() => {
    if (territory.blocks && territory.blocks.length > 0) {
      return territory.blocks.length;
    }
    try {
      const savedCount = localStorage.getItem(`kongre_terr_count_${territory.id}`);
      if (savedCount) {
        const parsed = parseInt(savedCount, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return Math.max(4, Math.min(16, Math.ceil((territory.estimatedHomes || 100) / 25))) || 6;
  }, [territory.blocks, territory.estimatedHomes, territory.id]);

  const [blockCount, setBlockCount] = useState<number>(initialBlockCount);

  // Three-state block tracker: 'pendiente' | 'trabajando' | 'completado'
  const [blockStatuses, setBlockStatuses] = useState<Record<number, 'pendiente' | 'trabajando' | 'completado'>>(() => {
    try {
      const saved = localStorage.getItem(`kongre_terr_blocks_v2_${territory.id}`);
      if (saved) return JSON.parse(saved);
      // Fallback migration from old boolean set
      const oldSaved = localStorage.getItem(`kongre_terr_blocks_${territory.id}`);
      if (oldSaved) {
        const oldArray: number[] = JSON.parse(oldSaved);
        const res: Record<number, 'pendiente' | 'trabajando' | 'completado'> = {};
        oldArray.forEach((num) => {
          res[num] = 'completado';
        });
        return res;
      }
    } catch {}
    if (territory.blocks && territory.blocks.length > 0) {
      const res: Record<number, 'pendiente' | 'trabajando' | 'completado'> = {};
      territory.blocks.forEach((b) => {
        res[b.number] = b.status;
      });
      return res;
    }
    return {};
  });

  // Ministry NH / Field Notes (Casas no en casa, revisitas)
  const [nhNotes, setNhNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(`kongre_terr_nh_${territory.id}`) || '';
    } catch {
      return '';
    }
  });
  const [showNhNotesEditor, setShowNhNotesEditor] = useState(false);

  // New No-Visit Form
  const [showAddNoVisit, setShowAddNoVisit] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newResident, setNewResident] = useState('');
  const [newReason, setNewReason] = useState('Petición expresa de no tocar ni visitar.');
  const [newCoordinates, setNewCoordinates] = useState<[number, number] | undefined>(undefined);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

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
      const cleanMap = territory.mapUrl.trim();
      if (/^https:\/\//i.test(cleanMap)) {
        return cleanMap;
      }
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

  // Cycle Block status: pendiente -> trabajando -> completado -> pendiente
  const cycleBlockStatus = (blockNum: number) => {
    setBlockStatuses((prev) => {
      const current = prev[blockNum] || 'pendiente';
      let next: 'pendiente' | 'trabajando' | 'completado' = 'trabajando';
      if (current === 'pendiente') next = 'trabajando';
      else if (current === 'trabajando') next = 'completado';
      else next = 'pendiente';

      const updated = { ...prev, [blockNum]: next };
      try {
        localStorage.setItem(`kongre_terr_blocks_v2_${territory.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateBlockCount = (delta: number) => {
    setBlockCount((prev) => {
      const next = Math.max(1, Math.min(30, prev + delta));
      try {
        localStorage.setItem(`kongre_terr_count_${territory.id}`, next.toString());
      } catch {}
      return next;
    });
  };

  const handleSaveNhNotes = (notes: string) => {
    setNhNotes(notes);
    try {
      localStorage.setItem(`kongre_terr_nh_${territory.id}`, notes);
    } catch {}
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

  // Share Progress Report to Overseer or Territory Servant
  const handleShareProgressWhatsApp = () => {
    const total = blockCount;
    let completedCount = 0;
    let workingCount = 0;
    for (let i = 1; i <= total; i++) {
      if (blockStatuses[i] === 'completado') completedCount++;
      if (blockStatuses[i] === 'trabajando') workingCount++;
    }
    const percent = Math.round((completedCount / total) * 100);
    const pubName = assignee ? assignee.name : 'Publicador';

    let message =
      `📋 *INFORME DE AVANCE DE PREDICACIÓN*\n` +
      `🏛 *Territorio #${territory.number} - ${territory.name}*\n` +
      `📍 *Zona:* ${territory.zone}\n` +
      `👤 *Publicador:* ${pubName}\n\n` +
      `📊 *Progreso de Manzanas:* ${completedCount} de ${total} completadas (${percent}%)\n` +
      (workingCount > 0 ? `⏳ *En curso hoy:* ${workingCount} manzana(s)\n` : '') +
      `⚪ *Pendientes:* ${total - completedCount - workingCount} manzana(s)\n`;

    if (nhNotes.trim()) {
      message += `\n🚪 *Casas No en Casa (NH) / Revisitas:*\n${nhNotes.trim()}\n`;
    }

    const nvCount = territory.noVisits?.length || 0;
    message += `\n⚠️ *Casas No Visitar:* ${nvCount} respetadas.\n\n` +
      `🔗 *Tarjeta digital móvil:* ${territoryShareUrl}\n` +
      `¡Muchas gracias por la asignación! 🙏📖`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCaptureGpsForNoVisit = () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no soporta geolocalización GPS.');
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCapturingGps(false);
        setNewCoordinates([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        setIsCapturingGps(false);
        alert(`No se pudo obtener la posición GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      coordinates: newCoordinates,
    });

    setNewAddress('');
    setNewResident('');
    setNewReason('Petición expresa de no tocar ni visitar.');
    setNewCoordinates(undefined);
    setShowAddNoVisit(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-900/75 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Tarjeta digital del territorio ${territory.number}`}
    >
      <div
        className="kg-glass-surface kg-sheen-top w-full max-w-xl bg-white/95 dark:bg-[#121216]/95 rounded-3xl shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="bg-zinc-900 dark:bg-[#18181F] border-b border-zinc-800 dark:border-white/10 p-5 sm:p-6 text-white relative shrink-0 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-500/15 blur-3xl"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar tarjeta"
            aria-label="Cerrar tarjeta digital de territorio"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-14 h-14 rounded-xl bg-white/10 dark:bg-[#121216] text-white border border-white/20 dark:border-[#27272A] font-mono font-extrabold tabular-nums flex items-center justify-center text-xl sm:text-2xl shadow-xs shrink-0">
              {territory.number}
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                Tarjeta Digital S-13
              </span>
              <h2 className="text-lg sm:text-xl font-bold truncate mt-1 text-white">
                {territory.name}
              </h2>
              <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{territory.zone}</span>
                <span>•</span>
                <span className="font-mono tabular-nums">~{territory.estimatedHomes} hogares</span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-5 bg-white/10 dark:bg-[#121216]/60 border border-white/10 dark:border-[#27272A] p-1 rounded-xl backdrop-blur-xs">
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'card'
                  ? 'bg-white text-zinc-900 dark:bg-[#18181F] dark:text-[#F4F4F5] dark:border dark:border-[#27272A] shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Mapa & Info</span>
            </button>
            <button
              onClick={() => setActiveTab('novisits')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'novisits'
                  ? 'bg-white text-zinc-900 dark:bg-[#18181F] dark:text-[#F4F4F5] dark:border dark:border-[#27272A] shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>No Visitar ({territory.noVisits?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-white text-zinc-900 dark:bg-[#18181F] dark:text-[#F4F4F5] dark:border dark:border-[#27272A] shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10 dark:hover:bg-white/5'
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
              <div className="p-4 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#27272A] text-zinc-700 dark:text-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                      <span>Navegar en Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                      Abre el mapa satelital, calles y límites directamente en la app de tu móvil
                    </p>
                  </div>
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition shrink-0 active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Abrir Mapa</span>
                </a>
              </div>

              {/* No-Visits Critical Banner Alert */}
              {territory.noVisits && territory.noVisits.length > 0 ? (
                <div
                  onClick={() => setActiveTab('novisits')}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#27272A] flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {territory.noVisits.length}{' '}
                        {territory.noVisits.length === 1
                          ? 'Casa registrada para NO VISITAR'
                          : 'Casas registradas para NO VISITAR'}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                        Haz clic aquí para ver las direcciones exactas y observaciones
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-[#27272A] border border-zinc-200/60 dark:border-[#3E3E42] font-mono tabular-nums">
                    Ver ({territory.noVisits.length})
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center gap-2.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No hay reportes de casas con petición de no visitar en este territorio.</span>
                </div>
              )}

              {/* Boundaries & Block Notes */}
              <div className="bg-zinc-50 dark:bg-[#18181F] rounded-xl p-4 border border-zinc-200 dark:border-[#27272A] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Límites y Notas de Manzana</span>
                </h4>

                {territory.boundsDescription ? (
                  <p className="text-xs text-zinc-700 dark:text-[#F4F4F5] leading-relaxed font-medium">
                    {territory.boundsDescription}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    Sin descripción de límites registrada.
                  </p>
                )}

                {territory.notes && (
                  <div className="p-3 bg-white dark:bg-[#121216] rounded-lg border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-600 dark:text-[#A1A1AA]">
                    <span className="font-bold text-zinc-800 dark:text-[#F4F4F5] block mb-1">
                      Instrucciones especiales del territorio:
                    </span>
                    {territory.notes}
                  </div>
                )}
              </div>

              {/* Ministry Dynamic Block Progress Checklist */}
              {(() => {
                const total = blockCount;
                let completedCount = 0;
                let workingCount = 0;
                for (let i = 1; i <= total; i++) {
                  if (blockStatuses[i] === 'completado') completedCount++;
                  if (blockStatuses[i] === 'trabajando') workingCount++;
                }
                const percent = Math.round((completedCount / total) * 100);

                return (
                  <div className="bg-zinc-50 dark:bg-[#18181F] rounded-2xl p-4 border border-zinc-200 dark:border-[#27272A] space-y-3.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#F4F4F5] flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Control de Manzanas / Cuadras</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                          Toca una manzana para alternar: <strong>Pendiente</strong> → <strong>En curso</strong> (azul) → <strong>Completada</strong> (verde)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          {completedCount}/{total} ({percent}%)
                        </span>

                        {/* Adjust block count buttons */}
                        <div className="flex items-center gap-1 border border-zinc-200 dark:border-[#27272A] rounded-lg p-0.5 bg-white dark:bg-[#121216]">
                          <button
                            type="button"
                            onClick={() => handleUpdateBlockCount(-1)}
                            disabled={blockCount <= 1}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-[#27272A] rounded text-zinc-600 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                            title="Disminuir total de manzanas"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-mono font-bold px-1 text-zinc-700 dark:text-zinc-300">
                            {blockCount} Mz
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateBlockCount(1)}
                            disabled={blockCount >= 30}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-[#27272A] rounded text-zinc-600 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                            title="Aumentar total de manzanas"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272A] overflow-hidden flex">
                      <div
                        style={{ width: `${(completedCount / total) * 100}%` }}
                        className="h-full bg-emerald-500 transition-all duration-300"
                        title={`${completedCount} completadas`}
                      />
                      <div
                        style={{ width: `${(workingCount / total) * 100}%` }}
                        className="h-full bg-blue-500 transition-all duration-300"
                        title={`${workingCount} en curso`}
                      />
                    </div>

                    {/* Blocks Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Array.from({ length: total }, (_, i) => i + 1).map((num) => {
                        const status = blockStatuses[num] || 'pendiente';
                        const isDone = status === 'completado';
                        const isWorking = status === 'trabajando';

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => cycleBlockStatus(num)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition active:scale-95 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : isWorking
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/40'
                                : 'bg-white dark:bg-[#121216] text-zinc-700 dark:text-[#F4F4F5] border-zinc-200 dark:border-[#27272A] hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono tabular-nums font-bold">Manzana {num}</span>
                            </div>

                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-white shrink-0" />
                            ) : isWorking ? (
                              <Clock className="w-4 h-4 text-white shrink-0 animate-pulse" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Field Notes: Casas no en casa (NH) y revisitas */}
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-[#27272A]/80">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowNhNotesEditor((prev) => !prev)}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {showNhNotesEditor ? 'Ocultar notas de campo (NH)' : 'Notas de campo y casas «No en casa» (NH)'}
                          </span>
                        </button>
                        {nhNotes.trim() && !showNhNotesEditor && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {nhNotes.trim().length} car. guardados
                          </span>
                        )}
                      </div>

                      {showNhNotesEditor && (
                        <div className="mt-2 space-y-2 animate-fade-in">
                          <textarea
                            rows={3}
                            placeholder="Anota aquí casas no en casa (NH) o notas de revisitas. Ej: Mz 1: #14, #28 (volver en la tarde) | Mz 3: #08 (interés en revista)"
                            value={nhNotes}
                            onChange={(e) => handleSaveNhNotes(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-indigo-500 resize-none shadow-2xs"
                          />
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                            Guardado automáticamente en tu dispositivo para la próxima jornada.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Progress Report Button */}
                    <button
                      type="button"
                      onClick={handleShareProgressWhatsApp}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Enviar informe de avance por WhatsApp al Siervo de Territorios</span>
                    </button>
                  </div>
                );
              })()}

              {/* Assignment Details */}
              <div className="bg-zinc-50 dark:bg-[#18181F] rounded-xl p-4 border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-600 dark:text-[#A1A1AA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-[#A1A1AA]">Publicador asignado:</span>
                  <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    {assignee ? assignee.name : 'Disponible / Sin asignar'}
                  </span>
                </div>
                {territory.assignedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-[#A1A1AA]">Fecha de entrega:</span>
                    <span className="font-medium text-zinc-700 dark:text-[#F4F4F5] font-mono tabular-nums">
                      {territory.assignedDate}
                    </span>
                  </div>
                )}
                {territory.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-[#A1A1AA]">Límite recomendado (4 meses):</span>
                    <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
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
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Registro Oficial de Casas «No Visitar»</span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Hogares donde los ocupantes han solicitado explícitamente no ser visitados
                  </p>
                </div>

                <button
                  onClick={() => setShowAddNoVisit((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Reportar casa</span>
                </button>
              </div>

              {/* Add form */}
              {showAddNoVisit && (
                <form
                  onSubmit={handleSaveNoVisit}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-3 animate-fade-in"
                >
                  <h5 className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    Añadir Dirección de «No Visitar»
                  </h5>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                      Dirección exacta o manzana/lote *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Calle Los Robles #142 (casa con reja blanca)"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                        Nombre de la persona (si se conoce)
                      </label>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={newResident}
                        onChange={(e) => setNewResident(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                        Motivo / Observación
                      </label>
                      <input
                        type="text"
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  {/* GPS Pin Button */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={handleCaptureGpsForNoVisit}
                      disabled={isCapturingGps}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Navigation className={`w-3.5 h-3.5 text-blue-500 ${isCapturingGps ? 'animate-spin' : ''}`} />
                      <span>
                        {newCoordinates
                          ? `📍 GPS Fijado (${newCoordinates[0].toFixed(5)}, ${newCoordinates[1].toFixed(5)})`
                          : 'Capturar ubicación GPS actual'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddNoVisit(false);
                          setNewCoordinates(undefined);
                        }}
                        className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] text-xs font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Guardar en Territorio
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* List of No Visits */}
              {territory.noVisits && territory.noVisits.length > 0 ? (
                <div className="space-y-2.5">
                  {territory.noVisits.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] shadow-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                            !
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5]">
                            {item.address}
                          </span>
                        </div>
                        {item.residentName && (
                          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] pl-7">
                            Persona: <span className="font-medium text-zinc-700 dark:text-[#D4D4D8]">{item.residentName}</span>
                          </p>
                        )}
                        {item.reason && (
                          <p className="text-[11px] text-zinc-600 dark:text-[#D4D4D8] italic pl-7">
                            «{item.reason}»
                          </p>
                        )}
                        <div className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] pl-7 flex flex-wrap items-center gap-2.5 pt-0.5">
                          <span className="flex items-center gap-1 font-mono tabular-nums">
                            <Calendar className="w-3 h-3" />
                            <span>Registrado: {item.dateAdded}</span>
                          </span>

                          {item.coordinates && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${item.coordinates[0]},${item.coordinates[1]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1"
                              title="Abrir punto GPS en Google Maps"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>GPS ({item.coordinates[0].toFixed(4)}, {item.coordinates[1].toFixed(4)})</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-zinc-50 dark:bg-[#18181F] rounded-xl border border-zinc-200 dark:border-[#27272A]">
                  <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5]">
                    Territorio sin restricciones de No Visitar
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-1 max-w-sm mx-auto">
                    Todas las casas pueden ser visitadas amablemente siguiendo las pautas teocráticas.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE & SHARE */}
          {activeTab === 'qr' && (
            <div className="space-y-5 text-center">
              <div className="p-4 bg-zinc-50 dark:bg-[#18181F] rounded-xl border border-zinc-200 dark:border-[#27272A] inline-block mx-auto">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Código QR Territorio ${territory.number}`}
                    className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white p-2"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-zinc-400">
                    Generando código QR...
                  </div>
                )}
                <p className="text-[11px] font-bold text-zinc-700 dark:text-[#F4F4F5] mt-2">
                  Escanear con la cámara del móvil
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                  Abre la tarjeta digital, el mapa y la lista de casas al instante
                </p>
              </div>

              {/* Direct share actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4 text-emerald-500" />
                  <span>Enviar por WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-lg bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">¡Enlace Copiado!</span>
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
                  className="py-2.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-[#27272A] dark:hover:bg-[#323238] dark:border dark:border-[#383842] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar QR (PNG)</span>
                </button>
              </div>

              {/* URL preview box */}
              <div className="p-3 bg-zinc-50 dark:bg-[#18181F] rounded-lg text-left border border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-zinc-600 dark:text-[#A1A1AA] font-mono tabular-nums text-[11px]">
                  {territoryShareUrl}
                </span>
                <button
                  onClick={handleNativeShare}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Compartir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-[#18181F] border-t border-zinc-200 dark:border-[#27272A] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-[#A1A1AA]">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="hidden sm:inline">Tarjeta compatible con cualquier teléfono móvil y modo sin conexión</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-[#27272A] dark:text-[#F4F4F5] dark:border dark:border-[#383842] hover:bg-zinc-800 dark:hover:bg-[#323238] font-bold transition text-xs shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
