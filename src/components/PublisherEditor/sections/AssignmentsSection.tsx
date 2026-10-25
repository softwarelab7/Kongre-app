// src/components/PublisherEditor/sections/AssignmentsSection.tsx
import React, { useState } from 'react';
import { Publisher } from '../../../types';
import {
  Check,
  CheckCircle,
  BookOpen,
  Mic,
  Plus,
  X,
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
  }
> = {
  emerald: {
    iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    selectAllBtn: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
    cardSelected: 'bg-emerald-500/5 border-emerald-500 dark:border-emerald-500/70 shadow-xs',
    textSelected: 'text-emerald-700 dark:text-emerald-300',
    checkSelected: 'bg-emerald-600 border-transparent text-white',
  },
  amber: {
    iconBox: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    selectAllBtn: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
    cardSelected: 'bg-amber-500/5 border-amber-500 dark:border-amber-500/70 shadow-xs',
    textSelected: 'text-amber-700 dark:text-amber-300',
    checkSelected: 'bg-amber-500 border-transparent text-white',
  },
  rose: {
    iconBox: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    selectAllBtn: 'bg-rose-600 text-white shadow-md shadow-rose-600/20',
    cardSelected: 'bg-rose-500/5 border-rose-500 dark:border-rose-500/70 shadow-xs',
    textSelected: 'text-rose-700 dark:text-rose-300',
    checkSelected: 'bg-rose-600 border-transparent text-white',
  },
  blue: {
    iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    selectAllBtn: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
    cardSelected: 'bg-blue-500/5 border-blue-500 dark:border-blue-500/70 shadow-xs',
    textSelected: 'text-blue-700 dark:text-blue-300',
    checkSelected: 'bg-blue-600 border-transparent text-white',
  },
  violet: {
    iconBox: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    selectAllBtn: 'bg-violet-600 text-white shadow-md shadow-violet-600/20',
    cardSelected: 'bg-violet-500/5 border-violet-500 dark:border-violet-500/70 shadow-xs',
    textSelected: 'text-violet-700 dark:text-violet-300',
    checkSelected: 'bg-violet-600 border-transparent text-white',
  },
  indigo: {
    iconBox: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    selectAllBtn: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
    cardSelected: 'bg-indigo-500/5 border-indigo-500 dark:border-indigo-500/70 shadow-xs',
    textSelected: 'text-indigo-700 dark:text-indigo-300',
    checkSelected: 'bg-indigo-600 border-transparent text-white',
  },
  zinc: {
    iconBox: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    selectAllBtn: 'bg-zinc-800 text-white shadow-md',
    cardSelected: 'bg-zinc-800/5 border-zinc-700 dark:border-zinc-400 shadow-xs',
    textSelected: 'text-zinc-800 dark:text-zinc-200',
    checkSelected: 'bg-zinc-800 border-transparent text-white',
  },
};

export const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({
  formData,
  handleAssignmentChange,
  handleMetadataChange,
  handleSelectAllGroup,
  tasksFilter,
  setTasksFilter,
  ASSIGNMENT_GROUPS,
}) => {
  const [outlineInput, setOutlineInput] = useState('');
  const isFemale = formData.gender === 'female' || formData.gender === 'hermana';

  const filteredGroups = ASSIGNMENT_GROUPS.map((group) => {
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

  const totalAssignmentsActive = Object.values(formData.assignments || {}).filter(Boolean).length;

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

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xs transition-all space-y-6">
      {/* CABECERA DE LA TARJETA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-base shrink-0 border border-violet-200/50 dark:border-violet-500/20">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Asignaciones Teocráticas y Tareas
              </h3>
              <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                · {totalAssignmentsActive}{' '}
                {totalAssignmentsActive === 1 ? 'asignación activa' : 'asignaciones activas'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Habilitación para partes de la reunión de entre semana, fin de semana, predicación y tareas
            </p>
          </div>
        </div>
      </div>

      {/* METADATOS DE ESTUDIANTE VMC (Folletos Maestros) Y ORADOR PÚBLICO */}
      {(isStudent || isSpeaker) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isStudent && (
            <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Folleto Una Obra de Amor / Maestros (S-38)
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Lección o punto de estudio actual sugerido (1 al 20)
                  </p>
                </div>
              </div>
              <select
                value={currentLesson}
                onChange={(e) =>
                  handleMetadataChange('currentLessonNumber', parseInt(e.target.value, 10))
                }
                className="kf-input w-24 text-xs font-bold bg-white dark:bg-zinc-900"
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
            <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <Mic size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Bosquejos de Discursos Públicos Preparados (1–194)</span>
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
                    placeholder="# Bosquejo"
                    className="kf-input w-24 py-1 px-2 text-xs bg-white dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddOutline}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
                    title="Agregar número de bosquejo"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preparedOutlines.length === 0 ? (
                  <span className="text-[11px] text-zinc-400 italic">
                    Ningún bosquejo registrado todavía
                  </span>
                ) : (
                  preparedOutlines.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    >
                      #{num}
                      <button
                        type="button"
                        onClick={() => handleRemoveOutline(num)}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {filteredGroups
            .filter((g: any) => g.id !== 'tasks' && g.id !== 'cleaning')
            .map((group: any) => {
              const style = COLOR_STYLES[group.color] || COLOR_STYLES.indigo;
              const allChecked = group.items.every(
                (i: any) => !!(formData.assignments || {})[i.id]
              );

              return (
                <section
                  key={group.id}
                  className="bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] rounded-3xl p-6 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 ${style.iconBox} rounded-2xl flex items-center justify-center`}
                      >
                        <group.icon size={24} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {group.label}
                        </h4>
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                          {group.items.filter((i: any) => !!(formData.assignments || {})[i.id]).length}{' '}
                          de {group.items.length} habilitadas
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAllGroup(group.id, group.items, !allChecked)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        allChecked
                          ? style.selectAllBtn
                          : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300/70'
                      }`}
                    >
                      {allChecked ? 'Desmarcar todo' : 'Marcar todo'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.items.map((item: any) => {
                      const isSelected = !!(formData.assignments || {})[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAssignmentChange(item.id, !isSelected)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                            isSelected
                              ? style.cardSelected
                              : 'bg-white dark:bg-zinc-900/60 border-zinc-200/70 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span
                            className={`text-xs font-bold pr-2 ${
                              isSelected ? style.textSelected : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {item.label}
                          </span>
                          <div
                            className={`w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? style.checkSelected
                                : 'bg-zinc-50 dark:bg-[#0f1623] border-zinc-300 dark:border-white/[0.12]'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={4} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>

        <div className="space-y-6">
          {/* Tasks Section */}
          {filteredGroups
            .filter((g: any) => g.id === 'tasks')
            .map((group: any) => (
              <section
                key={group.id}
                className="bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] rounded-3xl p-6 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl flex items-center justify-center">
                      <group.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {group.label} de Acomodación y A/V
                      </h4>
                      <div className="flex gap-1.5 mt-1.5">
                        {(['all', 'midweek', 'weekend'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setTasksFilter(f)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              tasksFilter === f
                                ? 'bg-zinc-800 dark:bg-indigo-600 text-white shadow-xs'
                                : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/70'
                            }`}
                          >
                            {f === 'all' ? 'Todo' : f === 'midweek' ? 'Entre semana' : 'Fin de semana'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.items
                    .filter(
                      (i: any) => tasksFilter === 'all' || !i.meeting || i.meeting === tasksFilter
                    )
                    .map((item: any) => {
                      const isSelected = !!(formData.assignments || {})[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAssignmentChange(item.id, !isSelected)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-800 dark:bg-indigo-600 text-white border-transparent shadow-sm'
                              : 'bg-white dark:bg-zinc-900/60 border-zinc-200/70 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex flex-col items-start text-left">
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'
                              }`}
                            >
                              {item.shortLabel || item.label}
                            </span>
                            {item.meeting && (
                              <span
                                className={`text-[10px] font-semibold mt-0.5 ${
                                  isSelected
                                    ? 'text-zinc-200'
                                    : 'text-zinc-400 dark:text-zinc-500'
                                }`}
                              >
                                {item.meeting === 'midweek' ? 'Entre semana' : 'Fin de semana'}
                              </span>
                            )}
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-white text-zinc-900 border-transparent'
                                : 'bg-zinc-50 dark:bg-[#0f1623] border-zinc-300 dark:border-white/[0.12]'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={4} />}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </section>
            ))}

          {/* Cleaning/Maintenance Section */}
          {filteredGroups
            .filter((g: any) => g.id === 'cleaning')
            .map((group: any) => {
              const style = COLOR_STYLES[group.color] || COLOR_STYLES.indigo;
              const allChecked = group.items.every(
                (i: any) => !!(formData.assignments || {})[i.id]
              );

              return (
                <section
                  key={group.id}
                  className="bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] rounded-3xl p-6 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 ${style.iconBox} rounded-2xl flex items-center justify-center`}
                      >
                        <group.icon size={24} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {group.label}
                        </h4>
                        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                          Mantenimiento preventivo del Salón del Reino
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAllGroup(group.id, group.items, !allChecked)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        allChecked
                          ? style.selectAllBtn
                          : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300/70'
                      }`}
                    >
                      {allChecked ? 'Desmarcar todo' : 'Marcar todo'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {group.items.map((item: any) => {
                      const isSelected = !!(formData.assignments || {})[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAssignmentChange(item.id, !isSelected)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                            isSelected
                              ? style.cardSelected
                              : 'bg-white dark:bg-zinc-900/60 border-zinc-200/70 dark:border-white/[0.05] hover:border-zinc-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span
                            className={`text-xs font-bold pr-2 ${
                              isSelected ? style.textSelected : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {item.label}
                          </span>
                          <div
                            className={`w-4 h-4 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? style.checkSelected
                                : 'bg-zinc-50 dark:bg-[#0f1623] border-zinc-300 dark:border-white/[0.12]'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={4} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    </section>
  );
};
