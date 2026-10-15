// src/components/ClmAiSuggestionsModal.tsx
import React, { useState, useEffect } from 'react';
import { ClmPrograma, ClmParte, Publisher } from '../types';
import { suggestWeeklyAssignmentsWithGemini, isGeminiConfigured } from '../services/geminiService';
import {
  Sparkles,
  X,
  Check,
  Loader2,
  AlertCircle,
  UserCheck,
  Bot,
  HelpCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface ClmAiSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  programa: ClmPrograma | null;
  publishers: Publisher[];
  onApplySuggestions: (newPrograma: ClmPrograma) => void;
}

interface SuggestionItem {
  partId: string;
  partTitle: string;
  partType: string;
  partSection: string;
  publisherId: string;
  publisherName: string;
  publisherRole: string;
  reason: string;
  accepted: boolean;
}

export const ClmAiSuggestionsModal: React.FC<ClmAiSuggestionsModalProps> = ({
  isOpen,
  onClose,
  programa,
  publishers,
  onApplySuggestions,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  useEffect(() => {
    if (isOpen && programa) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setError(null);
    }
  }, [isOpen, programa]);

  if (!isOpen || !programa) return null;

  const loadSuggestions = async () => {
    if (!isGeminiConfigured()) {
      setError('Por favor configura tu clave de Gemini en Ajustes > Inteligencia Artificial para recibir sugerencias teocráticas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Filtrar partes que no tienen asignado titular
      const unassignedParts = programa.partes
        .filter((p) => !p.asignado_nid || p.asignado_nid.trim() === '')
        .map((p) => ({
          id: p.id,
          title: p.titulo,
          section: p.seccion,
          type: p.tipo,
          minTime: p.duracion_min,
        }));

      if (unassignedParts.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // 2. Calcular asignaciones recientes por publicador
      const assignmentCountMap: Record<string, number> = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('clm_programa_') && key !== `clm_programa_${programa.semana_fecha}`) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const prev: ClmPrograma = JSON.parse(raw);
              prev.partes?.forEach((part) => {
                if (part.asignado_nid) {
                  assignmentCountMap[part.asignado_nid] = (assignmentCountMap[part.asignado_nid] || 0) + 1;
                }
              });
            }
          }
        }
      } catch {}

      // 3. Preparar lista resumida de publicadores activos
      const activePubs = publishers
        .filter((p) => p.status === 'active' && !p.is_disfellowshipped && (p.id || p.nid))
        .map((p) => {
          const pubId = (p.id || p.nid)!;
          return {
            id: pubId,
            name: p.name || p.full_name || 'Hermano',
            privilege: p.privilege || p.theocraticRole || 'publicador',
            theocraticRole: p.theocraticRole,
            qualifications: Object.keys(p.roles || {}).filter((k) => p.roles[k as keyof typeof p.roles]),
            recentAssignmentsCount: assignmentCountMap[pubId] || 0,
          };
        });

      // 4. Llamar a Gemini
      const geminiResults = await suggestWeeklyAssignmentsWithGemini(
        {
          weekDate: programa.semana_fecha,
          unassignedParts,
        },
        activePubs
      );

      // 5. Cruzar resultados
      const items: SuggestionItem[] = [];
      geminiResults.forEach((res) => {
        const matchingPart = programa.partes.find((p) => p.id === res.partId);
        const matchingPub = publishers.find((p) => (p.id || p.nid) === res.publisherId);

        if (matchingPart && matchingPub) {
          const finalPubId = matchingPub.id || matchingPub.nid || '';
          if (finalPubId) {
            items.push({
              partId: matchingPart.id,
              partTitle: matchingPart.titulo,
              partType: matchingPart.tipo,
              partSection: matchingPart.seccion,
              publisherId: finalPubId,
              publisherName: matchingPub.name || matchingPub.full_name || 'Hermano',
              publisherRole: matchingPub.privilege || matchingPub.theocraticRole || 'Publicador',
              reason: res.reason || 'Recomendado por disponibilidad y rotación equitativa.',
              accepted: true,
            });
          }
        }
      });

      setSuggestions(items);
    } catch (err: any) {
      console.error('Error cargando sugerencias de Gemini:', err);
      setError(err?.message || 'Error al obtener sugerencias de Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccept = (index: number) => {
    setSuggestions((prev) => {
      const next = [...prev];
      next[index].accepted = !next[index].accepted;
      return next;
    });
  };

  const handleApplyAll = () => {
    const clone: ClmPrograma = JSON.parse(JSON.stringify(programa));

    suggestions.forEach((item) => {
      if (item.accepted) {
        const parte = clone.partes.find((p) => p.id === item.partId);
        if (parte) {
          parte.asignado_nid = item.publisherId;
          parte.asignado_nombre = item.publisherName;
        }
      }
    });

    onApplySuggestions(clone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-100 dark:bg-fuchsia-950/80 px-2 py-0.5 rounded-full">
                  Asistente Teocrático Gemini
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Semana: {programa.semana_fecha}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Sugerencias Inteligentes de Asignación
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center text-fuchsia-600 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Analizando historial, equidad y privilegios...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Gemini está evaluando los hermanos idóneos para cada parte respetando las directrices teocráticas.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>No se pudieron generar sugerencias</span>
              </div>
              <p className="font-normal text-[11px] leading-relaxed">{error}</p>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                ¡Todas las partes de esta semana ya están asignadas!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No hay partes pendientes sin titular para esta reunión.
              </p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Gemini sugiere las siguientes asignaciones. Puedes desmarcar cualquiera que desees omitir antes de aplicar:
              </p>

              <div className="space-y-2.5">
                {suggestions.map((item, idx) => (
                  <div
                    key={item.partId}
                    onClick={() => handleToggleAccept(idx)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      item.accepted
                        ? 'bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border-fuchsia-200 dark:border-fuchsia-800/60 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                        item.accepted
                          ? 'bg-fuchsia-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {item.accepted && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                          {item.partTitle}
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.partSection}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                        <span className="text-xs font-extrabold text-fuchsia-900 dark:text-fuchsia-200">
                          {item.publisherName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          ({item.publisherRole})
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-0.5">
                        💡 <strong>Motivo:</strong> {item.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 rounded-b-3xl">
          <button
            type="button"
            onClick={loadSuggestions}
            disabled={loading}
            className="text-xs text-fuchsia-600 dark:text-fuchsia-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Volver a calcular</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleApplyAll}
              disabled={loading || suggestions.filter((s) => s.accepted).length === 0}
              className="px-5 py-2 rounded-xl bg-linear-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar ({suggestions.filter((s) => s.accepted).length}) Asignaciones</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
