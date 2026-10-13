import React from 'react';
import { Publisher } from '../../../types';
import { 
  Diamond, 
  Users, 
  Heart, 
  Calendar, 
  MapPin, 
  Wrench, 
  ListChecks,
  Check,
  Layout,
  Clock,
  Mic,
  Monitor,
  CheckCircle,
  Copy,
  Plus
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

export const AssignmentsSection: React.FC<AssignmentsSectionProps> = ({
  formData,
  handleAssignmentChange,
  handleMetadataChange,
  handleSectionToggle,
  handleSelectAllGroup,
  tasksFilter,
  setTasksFilter,
  ASSIGNMENT_GROUPS
}) => {
  // Filtrar grupos y asignaciones según el género
  const isFemale = formData.gender === 'female';

  const filteredGroups = ASSIGNMENT_GROUPS.map(group => {
    if (isFemale) {
      // Ocultar completamente grupos exclusivos de varones
      if (group.id === 'treasures' || group.id === 'living' || group.id === 'weekend') {
        return null;
      }
      // Filtrar items específicos dentro de grupos permitidos
      if (group.id === 'teachers') {
        return {
          ...group,
          items: group.items.filter((i: any) => i.id !== 'talk_student')
        };
      }
      if (group.id === 'field_service') {
        return {
          ...group,
          items: group.items.filter((i: any) => i.id === 'public_witnessing' || i.id === 'field_service_prayer')
        };
      }
      if (group.id === 'tasks') {
        return {
          ...group,
          items: group.items.filter((i: any) => i.id === 'maintenance' || i.id.includes('audio_video'))
        };
      }
    }
    return group;
  }).filter(Boolean);

  const totalAssignmentsActive = Object.values(formData.assignments || {}).filter(Boolean).length;

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-sm transition-all space-y-6">
      {/* CABECERA DE LA TARJETA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-base shadow-xs shrink-0 ring-4 ring-violet-500/5">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Asignaciones Teocráticas y Tareas
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200/50">
                {totalAssignmentsActive} {totalAssignmentsActive === 1 ? 'asignación activa' : 'asignaciones activas'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Habilitación para partes de la reunión de entre semana, fin de semana, predicación y tareas
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {filteredGroups.filter((g: any) => g.id !== 'tasks' && g.id !== 'cleaning').map((group: any) => (
          <section key={group.id} className="bg-white dark:bg-[#0f1623] border border-zinc-100 dark:border-white/[0.06] rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-${group.color}-500/10 text-${group.color}-600 rounded-2xl flex items-center justify-center shadow-inner`}>
                  <group.icon size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{group.label}</h4>
                  <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1">Gestión de privilegios</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const allChecked = group.items.every((i: any) => !!(formData.assignments || {})[i.id]);
                  handleSelectAllGroup(group.id, group.items, !allChecked);
                }}
                className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${group.items.every((i: any) => !!(formData.assignments || {})[i.id]) ? `bg-${group.color}-500 text-white shadow-lg shadow-${group.color}-500/20` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
              >
                {group.items.every((i: any) => !!(formData.assignments || {})[i.id]) ? 'Desmarcar todo' : 'Marcar todo'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((item: any) => {
                const isSelected = !!(formData.assignments || {})[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAssignmentChange(item.id, !isSelected)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 transition-all group ${isSelected ? `bg-${group.color}-500/5 border-${group.color}-500 shadow-sm` : 'bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-white/[0.04] hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'}`}
                  >
                    <span className={`text-[12px] font-bold ${isSelected ? `text-${group.color}-600` : 'text-zinc-500'}`}>{item.label}</span>
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? `bg-${group.color}-500 border-transparent text-white scale-110 shadow-md shadow-${group.color}-500/20` : 'bg-zinc-50 dark:bg-[#0f1623] border-zinc-200 dark:border-white/[0.08]'}`}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="space-y-6">
        {/* Tasks Section */}
        {filteredGroups.filter((g: any) => g.id === 'tasks').map((group: any) => (
          <section key={group.id} className="bg-white dark:bg-[#0f1623] border border-zinc-100 dark:border-white/[0.06] rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-500/10 text-zinc-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <group.icon size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{group.label}</h4>
                  <div className="flex gap-2 mt-2">
                    {(['all', 'midweek', 'weekend'] as const).map(f => (
                      <button 
                        key={f}
                        onClick={() => setTasksFilter(f)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${tasksFilter === f ? 'bg-zinc-800 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'}`}
                      >
                        {f === 'all' ? 'Todo' : f === 'midweek' ? 'Entre semana' : 'Fin de semana'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.filter((i: any) => tasksFilter === 'all' || !i.meeting || i.meeting === tasksFilter).map((item: any) => {
                const isSelected = !!(formData.assignments || {})[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAssignmentChange(item.id, !isSelected)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 transition-all group ${isSelected ? 'bg-zinc-800 text-white border-transparent shadow-md scale-[1.02]' : 'bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-white/[0.04] hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'}`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-zinc-500'}`}>{item.shortLabel || item.label}</span>
                      {item.meeting && <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}>{item.meeting === 'midweek' ? 'Entre semana' : 'Fin de semana'}</span>}
                    </div>
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white text-zinc-800 border-transparent scale-110 shadow-sm' : 'bg-zinc-50 dark:bg-[#0f1623] border-zinc-200 dark:border-white/[0.08]'}`}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Cleaning/Maintenance Section */}
        {filteredGroups.filter((g: any) => g.id === 'cleaning').map((group: any) => (
          <section key={group.id} className="bg-white dark:bg-[#0f1623] border border-zinc-100 dark:border-white/[0.06] rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-${group.color}-500/10 text-${group.color}-600 rounded-2xl flex items-center justify-center shadow-inner`}>
                  <group.icon size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{group.label}</h4>
                  <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-1">Mantenimiento de Salón</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const allChecked = group.items.every((i: any) => !!(formData.assignments || {})[i.id]);
                  handleSelectAllGroup(group.id, group.items, !allChecked);
                }}
                className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${group.items.every((i: any) => !!(formData.assignments || {})[i.id]) ? `bg-${group.color}-500 text-white shadow-lg shadow-${group.color}-500/20` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
              >
                {group.items.every((i: any) => !!(formData.assignments || {})[i.id]) ? 'Desmarcar todo' : 'Marcar todo'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((item: any) => {
                const isSelected = !!(formData.assignments || {})[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAssignmentChange(item.id, !isSelected)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 transition-all group ${isSelected ? `bg-${group.color}-500/5 border-${group.color}-500 shadow-sm` : 'bg-white dark:bg-zinc-800/30 border-zinc-100 dark:border-white/[0.04] hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm'}`}
                  >
                    <span className={`text-[12px] font-bold ${isSelected ? `text-${group.color}-600` : 'text-zinc-500'}`}>{item.label}</span>
                    <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? `bg-${group.color}-500 border-transparent text-white scale-110 shadow-md shadow-${group.color}-500/20` : 'bg-zinc-50 dark:bg-[#0f1623] border-zinc-200 dark:border-white/[0.08]'}`}>
                      {isSelected && <Check size={10} strokeWidth={4} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      </div>
    </section>
  );
};
