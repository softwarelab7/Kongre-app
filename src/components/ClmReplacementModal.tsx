import React, { useState, useMemo } from 'react';
import type { Publisher, ClmParte, ClmPrograma, WeekSchedule, OutgoingSpeakerAssignment } from '../types';
import { isPublisherEligibleForPart } from '../utils/clmAutoAssignLocal';
import { checkPublisherConflictsOnDate } from '../utils/assignmentConflictChecker';
import {
  arePublishersFamily,
  getAssignedFamilyMembersInMeeting,
  getPubDisplayName,
  isValidDemonstrationPair,
} from '../utils/familyGrouping';
import {
  X,
  ArrowRightLeft,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageCircle,
  Copy,
  Check,
  User,
  Shield,
  Award,
} from 'lucide-react';

export interface ClmReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: ClmParte;
  programa: ClmPrograma;
  publishers: Publisher[];
  weeks?: WeekSchedule[];
  outgoingSpeakers?: OutgoingSpeakerAssignment[];
  onConfirmReplacement: (partId: string, newPublisherId: string, target: 'main' | 'assistant') => void;
  congregationName?: string;
}

export const ClmReplacementModal: React.FC<ClmReplacementModalProps> = ({
  isOpen,
  onClose,
  part,
  programa,
  publishers,
  weeks = [],
  outgoingSpeakers = [],
  onConfirmReplacement,
  congregationName = 'la congregación',
}) => {
  const [targetType, setTargetType] = useState<'main' | 'assistant'>('main');
  const [searchTerm, setSearchTerm] = useState('');
  const [replacedPublisher, setReplacedPublisher] = useState<{
    pub: Publisher;
    part: ClmParte;
  } | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const currentPubId = targetType === 'main' ? part.asignado_nid : part.asignado_auxiliar_nid;
  const currentPubName = targetType === 'main' ? part.asignado_nombre : part.asignado_auxiliar_nombre;
  const currentPub = publishers.find((p) => (p.nid || p.id) === currentPubId);

  // Conflicto actual del publicador saliente
  const currentConflicts = useMemo(() => {
    if (!currentPubId && !currentPubName) return [];
    return checkPublisherConflictsOnDate(
      currentPubId || '',
      currentPubName,
      programa.semana_fecha,
      {
        clmProgramas: [programa],
        weeks,
        publishers,
        outgoingSpeakers,
      },
      part.id
    ).conflicts;
  }, [currentPubId, currentPubName, programa, weeks, publishers, outgoingSpeakers, part.id]);

  // Historial de rotación rápida
  const publisherRotationMap = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();

    publishers.forEach((p) => {
      // Valor por defecto alto para los que nunca han salido
      map.set(p.nid || p.id, 99);
    });

    return map;
  }, [publishers]);

  // Candidatos elegibles ordenados por conveniencia
  const eligibleCandidates = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const assignedInMeetingSet = new Set<string>();
    for (const pItem of programa.partes) {
      if (pItem.asignado_nid) assignedInMeetingSet.add(pItem.asignado_nid);
      if (pItem.asignado_auxiliar_nid) assignedInMeetingSet.add(pItem.asignado_auxiliar_nid);
    }

    const companionId =
      part.seccion === 'maestros' &&
      part.tipo !== 'discurso_estudiante' &&
      part.tipo !== 'lectura_biblica'
        ? targetType === 'assistant'
          ? part.asignado_nid
          : part.asignado_auxiliar_nid
        : undefined;
    const companionPub = companionId
      ? publishers.find((p) => (p.nid || p.id) === companionId)
      : undefined;

    return publishers
      .filter((p) => {
        const pId = p.nid || p.id;
        // No puede ser el mismo hermano ya asignado
        if (pId === currentPubId) return false;
        // Si buscamos titular, no puede ser el ayudante actual
        if (targetType === 'main' && pId === part.asignado_auxiliar_nid) return false;
        // Si buscamos ayudante, no puede ser el titular actual
        if (targetType === 'assistant' && pId === part.asignado_nid) return false;

        // Comprobar elegibilidad teocrática (género, privilegio, etc.)
        if (!isPublisherEligibleForPart(p, part, targetType)) return false;

        // Validar pauta S-38 en demostraciones: mismo género o familiar directo
        if (companionPub && !isValidDemonstrationPair(companionPub, p, true)) {
          return false;
        }

        // Filtro de búsqueda
        if (term) {
          const name = (p.full_name || p.name).toLowerCase();
          return name.includes(term);
        }
        return true;
      })
      .map((p) => {
        const pId = p.nid || p.id;
        const conflictRes = checkPublisherConflictsOnDate(
          pId,
          p.full_name || p.name,
          programa.semana_fecha,
          {
            clmProgramas: [programa],
            weeks,
            publishers,
            outgoingSpeakers,
          },
          part.id
        );

        const assignedFamily = getAssignedFamilyMembersInMeeting(
          p,
          assignedInMeetingSet,
          publishers
        );
        const familyNames = assignedFamily.map((f) => getPubDisplayName(f));
        const isCompanionFamily = companionPub
          ? arePublishersFamily(companionPub, p)
          : false;

        return {
          publisher: p,
          hasStrictConflict: conflictRes.hasStrictConflict,
          conflicts: conflictRes.conflicts,
          weeksAgo: publisherRotationMap.get(pId) || 0,
          familyNames,
          isCompanionFamily,
        };
      })
      .sort((a, b) => {
        // 1. Los que NO tienen conflicto estricto van primero
        if (a.hasStrictConflict !== b.hasStrictConflict) {
          return a.hasStrictConflict ? 1 : -1;
        }
        // 2. Los que tienen menos advertencias van primero
        if (a.conflicts.length !== b.conflicts.length) {
          return a.conflicts.length - b.conflicts.length;
        }
        // 3. Si es familiar del compañero de demostración, priorizar
        if (a.isCompanionFamily !== b.isCompanionFamily) {
          return a.isCompanionFamily ? -1 : 1;
        }
        // 4. Agrupación Familiar (familiar ya asignado esta misma noche)
        const hasFamA =
          a.publisher.groupWithFamilyInMeetings !== false && a.familyNames.length > 0;
        const hasFamB =
          b.publisher.groupWithFamilyInMeetings !== false && b.familyNames.length > 0;
        if (hasFamA !== hasFamB) {
          return hasFamA ? -1 : 1;
        }
        // 5. Orden alfabético
        return (a.publisher.full_name || a.publisher.name).localeCompare(
          b.publisher.full_name || b.publisher.name
        );
      });
  }, [
    publishers,
    searchTerm,
    currentPubId,
    targetType,
    part,
    programa,
    weeks,
    outgoingSpeakers,
    publisherRotationMap,
  ]);

  if (!isOpen) return null;

  // Generar texto de WhatsApp para el sustituto
  const getSubstituteWhatsAppMessage = (sub: Publisher) => {
    const greeting = sub.gender === 'hermana' ? 'Apreciada hermana' : 'Apreciado hermano';
    const subName = sub.full_name || sub.name;
    const roomStr = part.es_clase_auxiliar ? 'Sala Auxiliar' : 'Sala Principal';

    let msg = `✨ *Sustitución de Última Hora - Reunión VMC*\n\n`;
    msg += `¡Hola, ${greeting} *${subName}*!\n\n`;
    msg += `Te escribimos con aprecio desde ${congregationName}. Se presentó una necesidad de sustitución para la *Reunión Vida y Ministerio Cristianos* de esta semana:\n\n`;
    msg += `📅 *Semana:* ${programa.rango_semana || programa.semana_fecha}\n`;
    msg += `📌 *Asignación:* ${part.titulo}\n`;
    msg += `🏛 *Sala:* ${roomStr}\n`;
    if (part.duracion_min) {
      msg += `⏱ *Tiempo:* ${part.duracion_min} minutos\n`;
    }
    if (part.descripcion) {
      msg += `📖 *Detalle:* ${part.descripcion}\n`;
    }
    if (targetType === 'main' && part.asignado_auxiliar_nombre) {
      msg += `👥 *Ayudante:* ${part.asignado_auxiliar_nombre}\n`;
    }
    if (targetType === 'assistant' && part.asignado_nombre) {
      msg += `👤 *Titular:* ${part.asignado_nombre}\n`;
    }
    msg += `\n¿Tendrías la posibilidad y el tiempo para ayudarnos cubriendo esta asignación? 🙏\n`;
    msg += `Muchas gracias por tu excelente disposición y apoyo espiritual.`;
    return msg;
  };

  const handleApplyReplacement = (candidate: Publisher) => {
    onConfirmReplacement(part.id, candidate.nid || candidate.id, targetType);
    setReplacedPublisher({ pub: candidate, part });
  };

  const handleSendWhatsApp = (sub: Publisher) => {
    const text = getSubstituteWhatsAppMessage(sub);
    const cleanPhone = (sub.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsApp = (sub: Publisher) => {
    const text = getSubstituteWhatsAppMessage(sub);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Sustitución de última hora VMC"
    >
      <div className="bg-white dark:bg-[#121216] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181F]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                Asistente de Reemplazos VMC
              </span>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                Sustitución de Última Hora
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar asistente de reemplazos VMC"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Detalle de la parte a sustituir */}
        <div className="p-4 sm:px-6 bg-zinc-100/60 dark:bg-[#18181F]/40 border-b border-zinc-200 dark:border-white/[0.06] space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {part.seccion.replace('_', ' ')} • {part.es_clase_auxiliar ? 'Sala Auxiliar' : 'Sala Principal'}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                {part.titulo} {part.duracion_min ? `(${part.duracion_min} min)` : ''}
              </h4>
            </div>

            {/* Selector de rol si aplica (Titular o Ayudante) */}
            {part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante' && (
              <div className="flex bg-white dark:bg-[#18181F] p-1 rounded-xl border border-zinc-200 dark:border-white/10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTargetType('main')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    targetType === 'main'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-[#A1A1AA]'
                  }`}
                >
                  Titular
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('assistant')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    targetType === 'assistant'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-[#A1A1AA]'
                  }`}
                >
                  Ayudante
                </button>
              </div>
            )}
          </div>

          {/* Información del hermano que se sustituye */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-zinc-500 dark:text-[#A1A1AA]">Hermano a sustituir:</span>
            <strong className="text-zinc-900 dark:text-white">
              {currentPubName || 'Sin asignar'}
            </strong>
            {currentConflicts.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                <AlertTriangle size={11} />
                {currentConflicts[0].assignmentTitle} ({currentConflicts[0].details})
              </span>
            )}
          </div>
        </div>

        {/* Si ya se aplicó el reemplazo con éxito, mostrar panel de WhatsApp */}
        {replacedPublisher ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                ¡Sustitución Asignada con Éxito!
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#D4D4D8] mt-1 max-w-md mx-auto">
                <strong>{replacedPublisher.pub.full_name || replacedPublisher.pub.name}</strong> ha sido
                asignado como sustituto para esta parte.
              </p>
            </div>

            {/* Acciones de WhatsApp */}
            <div className="bg-zinc-50 dark:bg-[#18181F]/60 p-4 rounded-2xl border border-zinc-200 dark:border-white/10 max-w-md mx-auto text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                Avisar al nuevo hermano por WhatsApp:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(replacedPublisher.pub)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Send size={13} />
                  <span>Enviar Mensaje de WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyWhatsApp(replacedPublisher.pub)}
                  className="p-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:text-zinc-200 transition-colors cursor-pointer"
                  title="Copiar texto del mensaje"
                  aria-label="Copiar texto del mensaje de WhatsApp"
                >
                  {copiedWhatsApp ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar Asistente
            </button>
          </div>
        ) : (
          <>
            {/* Buscador de candidatos */}
            <div className="p-4 sm:px-6 border-b border-zinc-100 dark:border-white/[0.04]">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar hermano disponible..."
                  aria-label="Buscar hermano disponible para reemplazo"
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-white/10 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Lista de candidatos elegibles */}
            <div className="flex-1 overflow-y-auto p-4 sm:px-6 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-[#A1A1AA]">
                <span className="font-semibold flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  Candidatos Recomendados ({eligibleCandidates.length})
                </span>
                <span className="text-[11px]">Ordenados por disponibilidad y equidad</span>
              </div>

              {eligibleCandidates.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 dark:text-[#71717A] text-xs">
                  No se encontraron candidatos elegibles libres para esta parte con ese filtro.
                </div>
              ) : (
                eligibleCandidates.map(({ publisher: cand, hasStrictConflict, conflicts, familyNames, isCompanionFamily }) => (
                  <div
                    key={cand.id || cand.nid}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      hasStrictConflict
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 opacity-60'
                        : conflicts.length > 0
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
                        : 'bg-white dark:bg-[#18181F]/80 border-zinc-200 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                          {cand.full_name || cand.name}
                        </span>
                        {cand.privilege && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                            {cand.privilege}
                          </span>
                        )}
                        {isCompanionFamily && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                            Familiar del compañero(a)
                          </span>
                        )}
                        {familyNames && familyNames.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
                            Familiar hoy: {familyNames[0]}
                          </span>
                        )}
                        {cand.groupNumber && (
                          <span className="text-[10px] text-zinc-400">
                            Gr. {cand.groupNumber}
                          </span>
                        )}
                      </div>

                      {/* Conflictos o estado de saturación */}
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                        {hasStrictConflict ? (
                          <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {conflicts[0]?.details || 'Conflicto estricto en esta reunión'}
                          </span>
                        ) : conflicts.length > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <Clock size={12} />
                            {conflicts[0]?.details}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            100% disponible esta semana
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón de Asignar */}
                    <button
                      type="button"
                      disabled={hasStrictConflict}
                      onClick={() => handleApplyReplacement(cand)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        hasStrictConflict
                          ? 'bg-zinc-200 text-zinc-400 dark:bg-white/5 dark:text-[#71717A] cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      Asignar Sustituto
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181F]/80 flex items-center justify-between text-xs text-zinc-500">
              <span>Se sincronizará en tiempo real con Firestore.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
