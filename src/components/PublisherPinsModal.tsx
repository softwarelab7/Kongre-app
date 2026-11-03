// src/components/PublisherPinsModal.tsx
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useToast } from '../context/ToastContext';
import {
  X,
  KeyRound,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Share2,
  Sparkles,
  Users,
  Shield,
  Heart,
  Lock,
  Building2,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { Publisher } from '../types';
import { TheocraticRole, THEOCRATIC_ROLES } from '../utils/rbac';
import {
  formatCanonicalCongregationId,
  getSecureLocalPin,
  encodeSecureShareToken,
  openSafeExternalUrl,
} from '../utils/theocraticSecurity';
import { insertAuditLog } from '../services/auditLogService';

interface PublisherPinsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublisherPinsModal: React.FC<PublisherPinsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    publisherPinsList,
    assignPersonalPinToPublisher,
    generateUniquePublisherPin,
    removePublisherPin,
    activeRole,
    isAdmin,
    isCoordinator,
    currentBrotherName,
  } = useAuth();

  const { settings, publishers, updatePublisher, isDemoMode } = useCongregation();
  const { showToast } = useToast();

  const canManagePins =
    isDemoMode ||
    isAdmin ||
    isCoordinator ||
    activeRole === 'coordinador' ||
    activeRole === 'secretario' ||
    activeRole === 'anciano';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrivilege, setFilterPrivilege] = useState<'all' | 'anciano' | 'siervo_ministerial' | 'precursor' | 'sin_pin'>('all');
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [showAllPins, setShowAllPins] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingPublisherId, setEditingPublisherId] = useState<string | null>(null);
  const [editingPinValue, setEditingPinValue] = useState('');

  // Congregation PIN display state
  const [showCongPin, setShowCongPin] = useState(false);

  // Determine Congregation credentials
  const congId = formatCanonicalCongregationId(settings.congregationNumber || settings.congregationId || '10582');
  const congName = settings.congregationName || 'Congregación';
  
  // Resolve congregation PIN from settings, secure localStorage or default fallback
  const congPin = useMemo(() => {
    return (
      (settings as any).congregationPin ||
      getSecureLocalPin('kongre_registered_cong_pin') ||
      getSecureLocalPin('kongre_last_cong_pin') ||
      '••••••••'
    );
  }, [settings]);

  // Combine publishers with pins
  const publisherEntries = useMemo(() => {
    return publishers.map((pub) => {
      const pinRec = publisherPinsList.find(
        (rec) =>
          rec.publisherId === pub.id ||
          rec.name.toLowerCase().trim() === pub.name.toLowerCase().trim()
      );
      const effectivePin = pub.personalPin || pinRec?.pin || '';
      const effectivePinHash = pub.personalPinHash || pinRec?.pinHash || '';
      return {
        publisher: pub,
        pin: effectivePin,
        pinHash: effectivePinHash,
        hasPin: Boolean(effectivePin || effectivePinHash),
        role: pub.theocraticRole || pinRec?.role || (pub.privilege === 'anciano' ? 'anciano' : 'publico'),
      };
    });
  }, [publishers, publisherPinsList]);

  // Filtered publishers
  const filteredEntries = useMemo(() => {
    return publisherEntries.filter((item) => {
      const nameMatch = item.publisher.name.toLowerCase().includes(searchTerm.toLowerCase());
      const pinMatch = item.pin.includes(searchTerm);
      const matchesSearch = nameMatch || pinMatch;

      if (!matchesSearch) return false;

      if (filterPrivilege === 'sin_pin') return !item.hasPin;
      if (filterPrivilege === 'anciano') return item.publisher.privilege === 'anciano';
      if (filterPrivilege === 'siervo_ministerial') return item.publisher.privilege === 'siervo_ministerial';
      if (filterPrivilege === 'precursor') {
        return (
          item.publisher.privilege === 'precursor_regular' ||
          item.publisher.privilege === 'precursor_auxiliar' ||
          item.publisher.privilege === 'precursor_especial'
        );
      }
      return true;
    });
  }, [publisherEntries, searchTerm, filterPrivilege]);

  // Stats
  const totalCount = publisherEntries.length;
  const withPinCount = publisherEntries.filter((p) => p.hasPin).length;
  const withoutPinCount = totalCount - withPinCount;

  if (!isOpen || !canManagePins) return null;

  // Toggle individual reveal
  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle show all
  const handleToggleShowAll = () => {
    const nextVal = !showAllPins;
    setShowAllPins(nextVal);
    const updated: Record<string, boolean> = {};
    publisherEntries.forEach((p) => {
      updated[p.publisher.id] = nextVal;
    });
    setRevealedPins(updated);
  };

  // Copy single PIN
  const handleCopyPin = (pubName: string, pin: string, id: string) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedId(id);
    showToast(`PIN (${pin}) copiado para ${pubName}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Share via WhatsApp with 1-click Direct Link and Portable Composite Code
  const handleShareWhatsApp = (pub: Publisher, pin: string) => {
    if (!pin) return;
    const realCongPin = congPin !== '••••••••' ? congPin : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const token = encodeSecureShareToken({
      cong: congId || undefined,
      pub: pub.id || undefined,
    });
    const directLink = congId
      ? token
        ? `${origin}/?tk=${encodeURIComponent(token)}`
        : `${origin}/?cong=${encodeURIComponent(congId)}&pub=${encodeURIComponent(pub.id)}`
      : '';
    const compositeCode = token;

    const text =
      `Hola estimado hermano *${pub.name}*,\n\n` +
      `Te comparto tus credenciales oficiales para la aplicación de la congregación *${congName}*:\n\n` +
      `🏛️ *ID de la Congregación:* *${congId}*\n` +
      `🔒 Tu PIN personal y el PIN de la congregación te los entrega un anciano por separado (en persona o por llamada). No se envían por mensaje.\n` +
      `📋 *Código Portátil Cifrado:* *${compositeCode}*\n` +
      (directLink ? `\n📲 *Enlace de Acceso Directo (un solo toque):*\n${directLink}\n` : '') +
      `\nAl tocar el enlace o ingresar tus credenciales, tu rol y responsabilidades teocráticas se activarán de inmediato.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    openSafeExternalUrl(url);
  };

  // Auto-generate missing PINs for all publishers without one
  const handleGenerateAllMissingPins = async () => {
    const missing = publisherEntries.filter((p) => !p.pin);
    if (missing.length === 0) {
      showToast('Todos los publicadores ya tienen un PIN asignado', 'info');
      return;
    }

    let generatedCount = 0;
    for (const item of missing) {
      const newPin = generateUniquePublisherPin();
      assignPersonalPinToPublisher(
        item.publisher.id,
        newPin,
        item.role as TheocraticRole,
        item.publisher.name,
        item.publisher.email,
        item.publisher.privilege
      );
      updatePublisher({
        ...item.publisher,
        personalPin: newPin,
      });
      generatedCount++;
    }

    insertAuditLog({
      accion: 'GENERAR_PINS_FALTANTES_MASIVO',
      hermano_nid: activeRole,
      hermano_nombre: currentBrotherName || 'Coordinador / Secretario',
      modulo: 'auth',
      detalles: `Se generaron automáticamente ${generatedCount} PINs únicos para publicadores sin PIN.`,
    }).catch(() => {});

    showToast(`¡Se han generado y asignado ${generatedCount} PINs únicos con éxito!`, 'success');
  };

  // Start editing single PIN
  const handleStartEdit = (pubId: string, currentPin: string) => {
    setEditingPublisherId(pubId);
    setEditingPinValue(currentPin || '');
  };

  // Save edited PIN
  const handleSaveEditPin = (pub: Publisher, currentRole: string) => {
    const cleanPin = editingPinValue.trim();
    if (cleanPin && cleanPin.length < 4) {
      showToast('El PIN debe tener al menos 4 dígitos', 'error');
      return;
    }

    if (!cleanPin) {
      removePublisherPin(pub.id);
      updatePublisher({
        ...pub,
        personalPin: undefined,
      });
      insertAuditLog({
        accion: 'REVOCAR_PIN_PUBLICADOR',
        hermano_nid: activeRole,
        hermano_nombre: currentBrotherName || 'Coordinador',
        modulo: 'auth',
        detalles: `PIN personal revocado para el publicador ${pub.name}.`,
      }).catch(() => {});
      showToast(`PIN revocado para ${pub.name}`, 'info');
    } else {
      assignPersonalPinToPublisher(
        pub.id,
        cleanPin,
        (pub.theocraticRole || currentRole || 'publico') as TheocraticRole,
        pub.name,
        pub.email,
        pub.privilege
      );
      updatePublisher({
        ...pub,
        personalPin: cleanPin,
      });
      insertAuditLog({
        accion: 'ACTUALIZAR_PIN_PUBLICADOR',
        hermano_nid: activeRole,
        hermano_nombre: currentBrotherName || 'Coordinador',
        modulo: 'auth',
        detalles: `PIN personal actualizado para el publicador ${pub.name}.`,
      }).catch(() => {});
      showToast(`PIN guardado para ${pub.name}`, 'success');
    }

    setEditingPublisherId(null);
    setEditingPinValue('');
  };

  // Copy full directory text to clipboard
  const handleCopyFullDirectory = () => {
    let output = `=========================================\n`;
    output += `DIRECTORIO DE PINES - ${congName.toUpperCase()}\n`;
    output += `ID Congregación: ${congId}\n`;
    if (congPin !== '••••••••') output += `PIN Congregación: ${congPin}\n`;
    output += `=========================================\n\n`;

    publisherEntries.forEach((p, index) => {
      const priv = p.publisher.privilege ? `[${p.publisher.privilege}]` : '';
      output += `${index + 1}. ${p.publisher.name} ${priv}: ${p.pin || 'SIN PIN'}\n`;
    });

    navigator.clipboard.writeText(output);
    showToast('Directorio completo de PINs copiado al portapapeles', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Directorio de PINs de la congregación"
    >
      <div className="kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl max-w-3xl w-full shadow-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-amber-500/10 dark:bg-[#18181F]">
          <div className="flex items-center gap-3">
            <div className="kg-glow-badge w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <span>Directorio de PINs</span>
                <span className="text-xs bg-amber-500/20 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold px-2 py-0.5 rounded-full font-mono">
                  {congName}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Consulta, copia y comparte las claves de acceso de los publicadores y la congregación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar directorio de PINs"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#121216] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Congregation Access Card */}
          <div className="p-4 rounded-xl bg-indigo-500/10 dark:bg-[#18181F] border border-indigo-500/20 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] uppercase tracking-wider">
                  Acceso General de la Congregación
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-[#A1A1AA]">ID / Número: </span>
                  <span className="font-mono font-bold tabular-nums text-indigo-700 dark:text-indigo-400">
                    {congId}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-[#A1A1AA]">PIN General: </span>
                  <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {showCongPin ? congPin : '••••••••'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                Los hermanos usan este ID y PIN junto con su PIN Personal para conectarse.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCongPin(!showCongPin)}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-medium hover:bg-zinc-50 dark:hover:bg-[#27272A] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {showCongPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showCongPin ? 'Ocultar' : 'Ver'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`ID Congregación: ${congId}\nPIN: ${congPin}`);
                  showToast('Datos de la congregación copiados al portapapeles', 'success');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Datos</span>
              </button>
            </div>
          </div>

          {/* 2. Stats bar & Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5]">
                <Users className="w-3.5 h-3.5 text-zinc-500 dark:text-[#A1A1AA]" />
                <span>Total: <strong className="font-mono tabular-nums">{totalCount}</strong></span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Con PIN: <strong className="font-mono tabular-nums">{withPinCount}</strong></span>
              </span>
              {withoutPinCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sin PIN: <strong className="font-mono tabular-nums">{withoutPinCount}</strong></span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {withoutPinCount > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateAllMissingPins}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Faltantes</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleShowAll}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {showAllPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAllPins ? 'Ocultar Todos' : 'Mostrar Todos'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyFullDirectory}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar lista de texto para registro"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copiar Lista</span>
              </button>
            </div>
          </div>

          {/* 3. Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por hermano o número de PIN..."
                aria-label="Buscar por hermano o número de PIN"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterPrivilege('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterPrivilege('anciano')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'anciano'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Ancianos
              </button>
              <button
                type="button"
                onClick={() => setFilterPrivilege('siervo_ministerial')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'siervo_ministerial'
                    ? 'bg-teal-600 text-white'
                    : 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Siervos
              </button>
              <button
                type="button"
                onClick={() => setFilterPrivilege('precursor')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'precursor'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Precursores
              </button>
              {withoutPinCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterPrivilege('sin_pin')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterPrivilege === 'sin_pin'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-rose-600 dark:text-rose-400 hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                  }`}
                >
                  Sin PIN ({withoutPinCount})
                </button>
              )}
            </div>
          </div>

          {/* 4. Publishers List */}
          <div className="space-y-2">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-zinc-400">
                <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-[#F4F4F5]">No se encontraron hermanos con ese criterio</p>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-1">Prueba cambiando el término de búsqueda o el filtro</p>
              </div>
            ) : (
              filteredEntries.map(({ publisher: pub, pin, hasPin, role }) => {
                const isRevealed = showAllPins || revealedPins[pub.id];
                const isEditing = editingPublisherId === pub.id;
                const isCopied = copiedId === pub.id;

                const privilegeLabel =
                  pub.privilege === 'anciano'
                    ? 'Anciano'
                    : pub.privilege === 'siervo_ministerial'
                    ? 'Siervo Min.'
                    : pub.privilege === 'precursor_regular'
                    ? 'Precursor Reg.'
                    : pub.privilege === 'precursor_auxiliar'
                    ? 'Precursor Aux.'
                    : 'Publicador';

                const privilegeColor =
                  pub.privilege === 'anciano'
                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
                    : pub.privilege === 'siervo_ministerial'
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20'
                    : pub.privilege?.includes('precursor')
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-[#121216] text-zinc-600 dark:text-[#A1A1AA] border-zinc-200 dark:border-[#27272A]';

                return (
                  <div
                    key={pub.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-zinc-50/70 dark:bg-[#18181F] hover:bg-zinc-100/70 dark:hover:bg-[#1f1f28] border border-zinc-200/80 dark:border-[#27272A] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    {/* Brother Name & Privilege */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-[#F4F4F5] shrink-0 shadow-xs">
                        {pub.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-[#F4F4F5] truncate">
                            {pub.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${privilegeColor}`}>
                            {privilegeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate mt-0.5">
                          {pub.theocraticRole
                            ? `Rol: ${THEOCRATIC_ROLES[pub.theocraticRole as TheocraticRole]?.name || pub.theocraticRole}`
                            : pub.email || 'Sin correo asociado'}
                        </p>
                      </div>
                    </div>

                    {/* PIN & Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            maxLength={8}
                            value={editingPinValue}
                            onChange={(e) => setEditingPinValue(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nuevo PIN"
                            aria-label={`Nuevo PIN para ${pub.name}`}
                            className="w-24 px-2 py-1 text-xs font-mono font-bold tabular-nums text-center rounded-lg border border-amber-500 bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const autoPin = generateUniquePublisherPin();
                              setEditingPinValue(autoPin);
                            }}
                            className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer"
                            title="Generar PIN aleatorio"
                            aria-label={`Generar PIN aleatorio para ${pub.name}`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditPin(pub, role)}
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                            title="Guardar PIN"
                            aria-label={`Guardar PIN de ${pub.name}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPublisherId(null)}
                            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#121216] cursor-pointer"
                            title="Cancelar"
                            aria-label="Cancelar edición de PIN"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : hasPin ? (
                        <>
                          {/* PIN Badge */}
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-xs">
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-mono font-extrabold tabular-nums text-xs tracking-widest text-zinc-900 dark:text-[#F4F4F5] min-w-[3.5rem] text-center">
                              {pin ? (isRevealed ? pin : '••••') : '🔒 Hash'}
                            </span>
                            {pin && (
                              <button
                                type="button"
                                onClick={() => togglePinReveal(pub.id)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] p-0.5 cursor-pointer ml-1"
                                title={isRevealed ? 'Ocultar PIN' : 'Ver PIN'}
                                aria-label={isRevealed ? `Ocultar PIN de ${pub.name}` : `Ver PIN de ${pub.name}`}
                              >
                                {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          {/* Copy button */}
                          {pin && (
                            <button
                              type="button"
                              onClick={() => handleCopyPin(pub.name, pin, pub.id)}
                              className="p-1.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-zinc-600 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs cursor-pointer"
                              title="Copiar PIN"
                              aria-label={`Copiar PIN de ${pub.name}`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Share via WhatsApp */}
                          {pin && (
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(pub, pin)}
                              className="p-1.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-zinc-600 dark:text-[#A1A1AA] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-xs cursor-pointer"
                              title="Compartir por WhatsApp"
                              aria-label={`Compartir PIN de ${pub.name} por WhatsApp`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(pub.id, pin)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#121216] transition-colors cursor-pointer"
                            title="Editar o regenerar PIN"
                            aria-label={`Editar o regenerar PIN de ${pub.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            Sin PIN
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newPin = generateUniquePublisherPin();
                              assignPersonalPinToPublisher(
                                pub.id,
                                newPin,
                                role as TheocraticRole,
                                pub.name,
                                pub.email,
                                pub.privilege
                              );
                              updatePublisher({
                                ...pub,
                                personalPin: newPin,
                              });
                              showToast(`¡PIN (${newPin}) asignado a ${pub.name}!`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Asignar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] flex items-center justify-between">
          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Los PINs personales son confidenciales y aseguran la identidad teocrática</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-[#27272A] dark:text-[#F4F4F5] dark:border dark:border-[#383842] hover:bg-zinc-800 dark:hover:bg-[#323238] text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
