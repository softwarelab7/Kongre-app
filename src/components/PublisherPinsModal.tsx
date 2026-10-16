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
import { TheocraticRole } from '../utils/rbac';

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
    isCoordinator,
  } = useAuth();

  const { settings, publishers, updatePublisher } = useCongregation();
  const { showToast } = useToast();

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
  const congId = settings.congregationNumber || settings.congregationId || '10582';
  const congName = settings.congregationName || 'Congregación';
  
  // Resolve congregation PIN from settings, localStorage or default fallback
  const congPin = useMemo(() => {
    return (
      (settings as any).congregationPin ||
      localStorage.getItem('kongre_registered_cong_pin') ||
      localStorage.getItem('kongre_last_cong_pin') ||
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
      return {
        publisher: pub,
        pin: effectivePin,
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

      if (filterPrivilege === 'sin_pin') return !item.pin;
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
  const withPinCount = publisherEntries.filter((p) => Boolean(p.pin)).length;
  const withoutPinCount = totalCount - withPinCount;

  if (!isOpen) return null;

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

  // Share via WhatsApp
  const handleShareWhatsApp = (pub: Publisher, pin: string) => {
    if (!pin) return;
    const text = `Hola estimado hermano *${pub.name}*,\n\nTe comparto tus credenciales oficiales para la aplicación de la congregación *${congName}*:\n\n🏛️ *ID de la Congregación:* ${congId}\n🔒 *PIN de la Congregación:* ${congPin !== '••••••••' ? congPin : '(el PIN general de la congregación)'}\n🔑 *Tu PIN Personal:* *${pin}*\n\nAl ingresar, tu rol y responsabilidades teocráticas se activarán de inmediato.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Directorio de PINs</span>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold px-2 py-0.5 rounded-full">
                  {congName}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consulta, copia y comparte las claves de acceso de los publicadores y la congregación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Congregation Access Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-indigo-50/30 to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-800 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Acceso General de la Congregación
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">ID / Número: </span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                    {congId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">PIN General: </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {showCongPin ? congPin : '••••••••'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Los hermanos usan este ID y PIN junto con su PIN Personal para conectarse.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCongPin(!showCongPin)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
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
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Datos</span>
              </button>
            </div>
          </div>

          {/* 2. Stats bar & Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Total: <strong>{totalCount}</strong></span>
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Con PIN: <strong>{withPinCount}</strong></span>
              </span>
              {withoutPinCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sin PIN: <strong>{withoutPinCount}</strong></span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {withoutPinCount > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateAllMissingPins}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Faltantes</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleShowAll}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {showAllPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showAllPins ? 'Ocultar Todos' : 'Mostrar Todos'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyFullDirectory}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por hermano o número de PIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterPrivilege('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterPrivilege('anciano')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'anciano'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Ancianos
              </button>
              <button
                type="button"
                onClick={() => setFilterPrivilege('siervo_ministerial')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'siervo_ministerial'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Siervos
              </button>
              <button
                type="button"
                onClick={() => setFilterPrivilege('precursor')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterPrivilege === 'precursor'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Precursores
              </button>
              {withoutPinCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterPrivilege('sin_pin')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterPrivilege === 'sin_pin'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-slate-200'
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
              <div className="py-12 text-center text-slate-400">
                <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="text-sm font-semibold">No se encontraron hermanos con ese criterio</p>
                <p className="text-xs mt-1">Prueba cambiando el término de búsqueda o el filtro</p>
              </div>
            ) : (
              filteredEntries.map(({ publisher: pub, pin, role }) => {
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : pub.privilege === 'siervo_ministerial'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                    : pub.privilege?.includes('precursor')
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                return (
                  <div
                    key={pub.id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    {/* Brother Name & Privilege */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                        {pub.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {pub.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${privilegeColor}`}>
                            {privilegeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {pub.theocraticRole ? `Rol: ${pub.theocraticRole}` : pub.email || 'Sin correo asociado'}
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
                            className="w-24 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg border border-amber-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const autoPin = generateUniquePublisherPin();
                              setEditingPinValue(autoPin);
                            }}
                            className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                            title="Generar PIN aleatorio"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditPin(pub, role)}
                            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            title="Guardar PIN"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPublisherId(null)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : pin ? (
                        <>
                          {/* PIN Badge */}
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-mono font-extrabold text-xs tracking-widest text-slate-800 dark:text-slate-100 min-w-[3.5rem] text-center">
                              {isRevealed ? pin : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePinReveal(pub.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer ml-1"
                              title={isRevealed ? 'Ocultar PIN' : 'Ver PIN'}
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>

                          {/* Copy button */}
                          <button
                            type="button"
                            onClick={() => handleCopyPin(pub.name, pin, pub.id)}
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer"
                            title="Copiar PIN"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Share via WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(pub, pin)}
                            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs cursor-pointer"
                            title="Compartir por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(pub.id, pin)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Editar o regenerar PIN"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900">
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
                            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
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
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Los PINs personales son confidenciales y aseguran la identidad teocrática</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
