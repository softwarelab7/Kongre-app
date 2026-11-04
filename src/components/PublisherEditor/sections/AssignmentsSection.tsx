// src/components/PublisherEditor/sections/AssignmentsSection.tsx
import React, { useState, useMemo } from 'react';
import { Publisher } from '../../../types';
import {
  Check,
  CheckCircle,
  BookOpen,
  Mic,
  Plus,
  X,
  Filter,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface AssignmentsSectionProps {
  formData: Publisher;
  handleAssignmentChange: (key: string, value: boolean) => void;
  handleMetadataChange: (key: string, value: any) => void;
  handleSectionToggle: (itemIds: string[], value: boolean) => void;
  handleSelectAllGroup: (groupId: string, items: { id: string }[], allChecked: boolean) => void;
  tasksFilter: 'all' | 'midweek' | 'weekend';
  setTasksFilter: (val: 'all' | 'midweek' | 'weekend') => void;
  ASSIGNMENT_GROUPS: any[];
}

// Mapa estático de clases Tailwind v4 para evitar clases dinámicas rotas
const COLOR_STYLES: Record<
  string,
  {
    iconBox: string;
    selectAllBtn: string;
    cardSelected: string;
    textSelected: string;
    checkSelected: string;
    accentBar: string;
  }
> = {
  emerald: {
    iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    selectAllBtn: 'bg-emerald-600 text-white',
    cardSelected: 'bg-emerald-500/[0.06] border-emerald-500/70 dark:border-emerald-500/60',
    textSelected: 'text-emerald-700 dark:text-emerald-300',
    checkSelected: 'bg-emerald-600 border-transparent text-white',
    accentBar: 'bg-emerald-500',
  },
  amber: {
    iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    selectAllBtn: 'bg-amber-500 text-white',
    cardSelected: 'bg-amber-500/[0.06] border-amber-500/70 dark:border-amber-500/60',
    textSelected: 'text-amber-700 dark:text-amber-300',
    checkSelected: 'bg-amber-500 border-transparent text-white',
    accentBar: 'bg-amber-500',
  },
  rose: {
    iconBox: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    selectAllBtn: 'bg-rose-600 text-white',
    cardSelected: 'bg-rose-500/[0.06] border-rose-500/70 dark:border-rose-500/60',
    textSelected: 'text-rose-700 dark:text-rose-300',
    checkSelected: 'bg-rose-600 border-transparent text-white',
    accentBar: 'bg-rose-500',
  },
  blue: {
    iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    selectAllBtn: 'bg-blue-600 text-white',
    cardSelected: 'bg-blue-500/[0.06] border-blue-500/70 dark:border-blue-500/60',
    textSelected: 'text-blue-700 dark:text-blue-300',
    checkSelected: 'bg-blue-600 border-transparent text-white',
    accentBar: 'bg-blue-500',
  },
  violet: {
    iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    selectAllBtn: 'bg-violet-600 text-white',
    cardSelected: 'bg-violet-500/[0.06] border-violet-500/70 dark:border-violet-500/60',
    textSelected: 'text-violet-700 dark:text-violet-300',
    checkSelected: 'bg-violet-600 border-transparent text-white',
    accentBar: 'bg-violet-500',
  },
  indigo: {
    iconBox: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    selectAllBtn: 'bg-indigo-600 text-white',
    cardSelected: 'bg-indigo-500/[0.06] border-indigo-500/70 dark:border-indigo-500/60',
    textSelected: 'text-indigo-700 dark:text-indigo-300',
    checkSelected: 'bg-indigo-600 border-transparent text-white',
    accentBar: 'bg-indigo-500',
  },
  zinc: {
    iconBox: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    selectAllBtn: 'bg-zinc-800 text-white',
    cardSelected: 'bg-zinc-800/[0.06] border-zinc-700 dark:border-zinc-400',
    textSelected: 'text-zinc-800 dark:text-zinc-200',
    checkSelected: 'bg-zinc-800 border-transparent text-white',
    accentBar: 'bg-zinc-600',
  },
};

export const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({
  formData,
  handleAssignmentChange,
  handleMetadataChange,
  handleSectionToggle,
  handleSelectAllGroup,
  tasksFilter,
  setTasksFilter,
  ASSIGNMENT_GROUPS,
}) => {
  const [outlineInput, setOutlineInput] = useState('');
  const [areaFilter, setAreaFilter] = useState<
    'all' | 'active_only' | 'vmc' | 'weekend_field' | 'tasks_cleaning'
  >('all');

  const isFemale = formData.gender === 'female' || formData.gender === 'hermana';

  const filteredGroups = useMemo(() => {
    return ASSIGNMENT_GROUPS.map((group) => {
      if (isFemale) {
        if (group.id === 'treasures' || group.id === 'living' || group.id === 'weekend') {
          return null;
        }
        if (group.id === 'teachers') {
          return {
            ...group,
            items: group.items.filter((i: any) => i.id !== 'talk_student'),
          };
        }
        if (group.id === 'field_service') {
          return {
            ...group,
            items: group.items.filter(
              (i: any) => i.id === 'public_witnessing' || i.id === 'field_service_prayer'
            ),
          };
        }
        if (group.id === 'tasks') {
          return {
            ...group,
            items: group.items.filter(
              (i: any) => i.id === 'maintenance' || i.id.includes('audio_video')
            ),
          };
        }
      }
      return group;
    }).filter(Boolean);
  }, [ASSIGNMENT_GROUPS, isFemale]);

  // KPI Metrics Calculation
  const allAvailableIds = useMemo(() => {
    const ids: string[] = [];
    filteredGroups.forEach((g: any) => {
      g.items.forEach((item: any) => ids.push(item.id));
    });
    return ids;
  }, [filteredGroups]);

  const totalAssignmentsActive = allAvailableIds.filter(
    (id) => !!(formData.assignments || {})[id]
  ).length;

  const vmcCount = useMemo(() => {
    const vmcGroups = filteredGroups.filter(
      (g: any) => g.id === 'treasures' || g.id === 'teachers' || g.id === 'living'
    );
    let active = 0;
    let total = 0;
    vmcGroups.forEach((g: any) => {
      total += g.items.length;
      active += g.items.filter((i: any) => !!(formData.assignments || {})[i.id]).length;
    });
    return { active, total };
  }, [filteredGroups, formData.assignments]);

  const weekendFieldCount = useMemo(() => {
    const groups = filteredGroups.filter(
      (g: any) => g.id === 'weekend' || g.id === 'field_service'
    );
    let active = 0;
    let total = 0;
    groups.forEach((g: any) => {
      total += g.items.length;
      active += g.items.filter((i: any) => !!(formData.assignments || {})[i.id]).length;
    });
    return { active, total };
  }, [filteredGroups, formData.assignments]);

  const tasksCleaningCount = useMemo(() => {
    const groups = filteredGroups.filter((g: any) => g.id === 'tasks' || g.id === 'cleaning');
    let active = 0;
    let total = 0;
    groups.forEach((g: any) => {
      total += g.items.length;
      active += g.items.filter((i: any) => !!(formData.assignments || {})[i.id]).length;
    });
    return { active, total };
  }, [filteredGroups, formData.assignments]);

  const isSpeaker = Boolean(
    formData.assignments?.local_speaker || formData.assignments?.outgoing_speaker
  );
  const isStudent = Boolean(
    formData.assignments?.student ||
      formData.assignments?.conversations ||
      formData.assignments?.return_visits ||
      formData.assignments?.disciples ||
      formData.assignments?.beliefs ||
      formData.assignments?.talk_student
  );

  const currentLesson =
    (formData.assignment_metadata as any)?.currentLessonNumber ??
    formData.currentLessonNumber ??
    1;
  const preparedOutlines: number[] =
    (formData.assignment_metadata as any)?.preparedOutlines ??
    formData.preparedOutlines ??
    [];

  const handleAddOutline = () => {
    const num = parseInt(outlineInput.trim(), 10);
    if (isNaN(num) || num < 1 || num > 194) return;
    if (!preparedOutlines.includes(num)) {
      const next = [...preparedOutlines, num].sort((a, b) => a - b);
      handleMetadataChange('preparedOutlines', next);
    }
    setOutlineInput('');
  };

  const handleRemoveOutline = (num: number) => {
    const next = preparedOutlines.filter((n) => n !== num);
    handleMetadataChange('preparedOutlines', next);
  };

  const visibleGroups = useMemo(() => {
    return filteredGroups.filter((g: any) => {
      if (areaFilter === 'vmc') {
        return g.id === 'treasures' || g.id === 'teachers' || g.id === 'living';
      }
      if (areaFilter === 'weekend_field') {
        return g.id === 'weekend' || g.id === 'field_service';
      }
      if (areaFilter === 'tasks_cleaning') {
        return g.id === 'tasks' || g.id === 'cleaning';
      }
      if (areaFilter === 'active_only') {
        return g.items.some((i: any) => !!(formData.assignments || {})[i.id]);
      }
      return true;
    });
  }, [filteredGroups, areaFilter, formData.assignments]);

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* BLOQUE 1: CABECERA EJECUTIVA + CINTA DE KPIs DE HABILITACIÓN          */}
      {/* ===================================================================== */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm kg-glow-badge">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/20">
                  06 · Matriz S-89 & Tareas
                </span>
                <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                  Asignaciones Teocráticas y Tareas Operativas
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Habilitación de partes para Vida y Ministerio Cristianos, Reunión Pública, Predicación, Acomodación, Audio/Video y Limpieza
              </p>
            </div>
          </div>

          {/* Botones Rápidos Globales */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => handleSectionToggle(allAvailableIds, true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/20 hover:bg-violet-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={13} /> Habilitar disponibles
            </button>
            {totalAssignmentsActive > 0 && (
              <button
                type="button"
                onClick={() => handleSectionToggle(allAvailableIds, false)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-rose-600 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Limpiar todas las asignaciones"
              >
                <RotateCcw size={13} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* CINTA DE 4 INDICADORES (KPI STRIP) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/60 dark:bg-white/[0.01]">
          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Total Habilitadas
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-zinc-900 dark:text-white mt-1">
              {totalAssignmentsActive}{' '}
              <span className="text-xs font-semibold text-zinc-400">
                / {allAvailableIds.length}
              </span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {totalAssignmentsActive === 0
                ? 'Sin partes asignables'
                : `${Math.round((totalAssignmentsActive / Math.max(1, allAvailableIds.length)) * 100)}% del catálogo`}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Vida y Ministerio (VMC)
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {vmcCount.active}{' '}
              <span className="text-xs font-semibold text-zinc-400">/ {vmcCount.total}</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isStudent ? `Folleto Maestros: Lección ${currentLesson}` : 'Tesoros, Maestros y Vida'}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Fin de Semana y Campo
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
              {weekendFieldCount.active}{' '}
              <span className="text-xs font-semibold text-zinc-400">
                / {weekendFieldCount.total}
              </span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isSpeaker && !isFemale
                ? `${preparedOutlines.length} bosquejos preparados`
                : 'Reunión Pública y Salidas'}
            </p>
          </div>

          <div className="p-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Acomodación, A/V y Limpieza
            </p>
            <p className="text-xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {tasksCleaningCount.active}{' '}
              <span className="text-xs font-semibold text-zinc-400">
                / {tasksCleaningCount.total}
              </span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Operación y cuidado del Salón
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* BLOQUE 2: PARÁMETROS DE ESTUDIANTE S-38 Y ORADOR PÚBLICO              */}
      {/* ===================================================================== */}
      {(isStudent || (isSpeaker && !isFemale)) && (
        <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 md:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.05] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-black flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Parámetros de Enseñanza, Lección S-38 y Bosquejos de Discursos Públicos
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Seguimiento pedagógico para hojas de asignación S-89 y catálogo de bosquejos del orador
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {isStudent && (
              <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Folleto «Una obra de amor» / «Maestros» (S-38)
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Punto o lección sugerida al programar su próxima asignación estudiantil (1 al 20)
                    </p>
                  </div>
                </div>
                <select
                  value={currentLesson}
                  onChange={(e) =>
                    handleMetadataChange('currentLessonNumber', parseInt(e.target.value, 10))
                  }
                  className="kf-input w-full sm:w-32 text-xs font-bold bg-white dark:bg-zinc-900 shrink-0"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Lección {num}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSpeaker && !isFemale && (
              <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Mic size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Bosquejos de Discursos Públicos Preparados (1–194)
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {preparedOutlines.length} bosquejo(s) en repertorio activo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={194}
                      value={outlineInput}
                      onChange={(e) => setOutlineInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOutline();
                        }
                      }}
                      placeholder="N° (1-194)"
                      className="kf-input w-28 py-1.5 px-2.5 text-xs bg-white dark:bg-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddOutline}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Añadir
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preparedOutlines.length === 0 ? (
                    <span className="text-[11px] text-zinc-400 italic">
                      Sin bosquejos registrados aún. Ingresa un número del 1 al 194 y presiona Añadir.
                    </span>
                  ) : (
                    preparedOutlines.map((num) => (
                      <span
                        key={num}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/40"
                      >
                        #{num}
                        <button
                          type="button"
                          onClick={() => handleRemoveOutline(num)}
                          className="hover:text-rose-500 cursor-pointer"
                          title={`Quitar bosquejo #${num}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* BLOQUE 3: MATRIZ DE HABILITACIÓN POR ÁREAS Y REUNIONES                */}
      {/* ===================================================================== */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono text-xs font-black flex items-center justify-center">
              {isStudent || (isSpeaker && !isFemale) ? '2' : '1'}
            </span>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Catálogo de Asignaciones y Responsabilidades Operativas
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Filtra por sección o marca bloques completos según las aptitudes aprobadas del publicador
              </p>
            </div>
          </div>

          {/* Barra de Filtros por Área */}
          <div className="flex items-center gap-1.5 flex-wrap bg-zinc-100/80 dark:bg-white/[0.03] p-1 rounded-xl border border-zinc-200/60 dark:border-white/[0.05]">
            <Filter size={13} className="text-zinc-400 ml-2 mr-1 hidden sm:inline" />
            {(
              [
                { id: 'all', label: `Todas (${allAvailableIds.length})` },
                { id: 'active_only', label: `Activas (${totalAssignmentsActive})` },
                { id: 'vmc', label: 'Vida y Ministerio' },
                { id: 'weekend_field', label: 'Fin de Semana y Campo' },
                { id: 'tasks_cleaning', label: 'Acomodación, A/V y Salón' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAreaFilter(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  areaFilter === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Bloques de Asignaciones */}
        {visibleGroups.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              No hay grupos de asignaciones que coincidan con el filtro seleccionado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {visibleGroups.map((group: any) => {
              const style = COLOR_STYLES[group.color] || COLOR_STYLES.indigo;
              const isTasksGroup = group.id === 'tasks';
              const itemsToRender = isTasksGroup
                ? group.items.filter(
                    (i: any) =>
                      tasksFilter === 'all' || !i.meeting || i.meeting === tasksFilter
                  )
                : group.items;

              const activeInGroup = group.items.filter(
                (i: any) => !!(formData.assignments || {})[i.id]
              ).length;
              const allChecked =
                group.items.length > 0 &&
                group.items.every((i: any) => !!(formData.assignments || {})[i.id]);

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50/40 dark:bg-white/[0.015] overflow-hidden flex flex-col"
                >
                  {/* Barra de color superior */}
                  <div className={`h-1 w-full ${style.accentBar}`} />

                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${style.iconBox} rounded-xl flex items-center justify-center shrink-0`}
                        >
                          <group.icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {group.label}
                            </h5>
                            <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300">
                              {activeInGroup}/{group.items.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {group.id === 'cleaning'
                              ? 'Mantenimiento preventivo y aseo del Salón del Reino'
                              : group.id === 'tasks'
                                ? 'Operación técnica, micrófonos y acomodación'
                                : 'Habilitación para programación automática y manual'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTasksGroup && (
                          <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-800 p-0.5 rounded-lg">
                            {(['all', 'midweek', 'weekend'] as const).map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setTasksFilter(f)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  tasksFilter === f
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                                    : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                              >
                                {f === 'all' ? 'Todo' : f === 'midweek' ? 'Entre sem.' : 'Fin sem.'}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleSelectAllGroup(group.id, group.items, !allChecked)
                          }
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            allChecked
                              ? style.selectAllBtn
                              : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300/70'
                          }`}
                        >
                          {allChecked ? 'Quitar todo' : 'Marcar todo'}
                        </button>
                      </div>
                    </div>

                    {/* Lista de Partes del Grupo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {itemsToRender.map((item: any) => {
                        const isSelected = !!(formData.assignments || {})[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleAssignmentChange(item.id, !isSelected)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                              isSelected
                                ? style.cardSelected
                                : 'bg-white dark:bg-zinc-900/60 border-zinc-200/70 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span
                                className={`text-xs font-bold block truncate ${
                                  isSelected
                                    ? style.textSelected
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {item.shortLabel || item.label}
                              </span>
                              {item.meeting && (
                                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">
                                  {item.meeting === 'midweek'
                                    ? 'Reunión de entre semana'
                                    : 'Reunión de fin de semana'}
                                </span>
                              )}
                            </div>

                            <div
                              className={`w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                                isSelected
                                  ? style.checkSelected
                                  : 'bg-zinc-50 dark:bg-[#18181F] border-zinc-300 dark:border-[#27272A]'
                              }`}
                            >
                              {isSelected && <Check size={10} strokeWidth={4} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
