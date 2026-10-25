// src/components/PublisherEditor/sections/PrivilegesSection.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Gem,
  UserCheck,
  UserMinus,
  Star,
  Key,
  Briefcase,
  UserX,
  UserPlus,
  ShieldAlert,
  Clock,
  Award,
  BookOpen,
  Heart,
  Droplets,
  ChevronDown,
  Headphones,
  DoorOpen,
  ClipboardList,
  Mic,
  MessageCircle,
  Wrench,
  DollarSign,
  Library,
  Newspaper,
  PenLine,
  Home,
  Map,
  CalendarDays,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PremiumDatePicker } from '../../PremiumDatePicker';

interface PrivilegesSectionProps {
  formData: any;
  groups: any[];
  handleChange: (field: any, value: any) => void;
  togglePrivilege: (id: string) => void;
  setPrivilegeRole: (id: string, role: 'none' | 'titular' | 'auxiliar') => void;
}

export const PrivilegesSection: React.FC<PrivilegesSectionProps> = ({
  formData,
  groups,
  handleChange,
  setPrivilegeRole,
}) => {
  const [showGroupsMenu, setShowGroupsMenu] = useState(false);
  const groupsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupsRef.current && !groupsRef.current.contains(event.target as Node)) {
        setShowGroupsMenu(false);
      }
    };
    if (showGroupsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGroupsMenu]);

  const calculateYearsAndMonths = (dateStr: string) => {
    if (!dateStr) return { years: 0, months: 0, totalMonths: 0 };
    try {
      const start = new Date(dateStr + 'T00:00:00');
      if (isNaN(start.getTime())) return { years: 0, months: 0, totalMonths: 0 };
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (now.getDate() < start.getDate()) {
        months--;
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      const totalMonths = Math.max(0, years * 12 + months);
      return { years: Math.max(0, years), months: Math.max(0, months), totalMonths };
    } catch {
      return { years: 0, months: 0, totalMonths: 0 };
    }
  };

  const baptismDuration = useMemo(
    () => calculateYearsAndMonths(formData.baptism_date || formData.baptismDate),
    [formData.baptism_date, formData.baptismDate]
  );

  const pioneerDuration = useMemo(
    () => calculateYearsAndMonths(formData.pioneerStartDate),
    [formData.pioneerStartDate]
  );

  const shepherdingAgo = useMemo(() => {
    const lastDate = formData.last_shepherding_visit || formData.last_visit_date;
    if (!lastDate) return null;
    return calculateYearsAndMonths(lastDate);
  }, [formData.last_shepherding_visit, formData.last_visit_date]);

  const isFemale = formData.gender === 'female' || formData.gender === 'hermana';

  const COLORS = {
    green: {
      bg: 'bg-[#10b981]',
      soft: 'bg-[#e6f6f0] dark:bg-emerald-500/15',
      text: 'text-[#10b981] dark:text-emerald-400',
      shadow: 'shadow-[#10b981]/30',
    },
    blue: {
      bg: 'bg-[#6556F0]',
      soft: 'bg-[#eef2ff] dark:bg-indigo-500/15',
      text: 'text-[#6556F0] dark:text-indigo-400',
      shadow: 'shadow-[#6556F0]/30',
    },
    sky: {
      bg: 'bg-[#0ea5e9]',
      soft: 'bg-[#e0f2fe] dark:bg-sky-500/15',
      text: 'text-[#0ea5e9] dark:text-sky-400',
      shadow: 'shadow-[#0ea5e9]/30',
    },
    orange: {
      bg: 'bg-[#ff9500]',
      soft: 'bg-[#fff4e6] dark:bg-amber-500/15',
      text: 'text-[#ff9500] dark:text-amber-400',
      shadow: 'shadow-[#ff9500]/30',
    },
    zinc: {
      bg: 'bg-[#71717a]',
      soft: 'bg-[#f4f4f5] dark:bg-zinc-800',
      text: 'text-[#71717a] dark:text-zinc-300',
      shadow: 'shadow-zinc-500/30',
    },
  };

  const roles = [
    ...(!isFemale
      ? [
          { id: 'elder', label: 'Anciano', color: COLORS.green },
          { id: 'servant', label: 'Siervo Ministerial', color: COLORS.blue },
        ]
      : []),
    { id: 'publisher', label: 'Publicador Bautizado', color: COLORS.sky },
    { id: 'unbaptized', label: 'No Bautizado', color: COLORS.zinc },
  ];

  const isAppointedMale = !isFemale && (formData.role === 'elder' || formData.role === 'servant');
  const isAnointed = Boolean(formData.is_anointed || formData.hope === 'ungido');
  const activeResponsibilitiesCount = (formData.privileges || []).length;

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-sm transition-all space-y-6">
      {/* CABECERA DE LA TARJETA */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold shrink-0 border border-emerald-200/50 dark:border-emerald-500/20">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Estado Espiritual y Privilegios
              </h3>
              <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                {baptismDuration.years > 0 && formData.role !== 'unbaptized'
                  ? `· ${baptismDuration.years} ${baptismDuration.years === 1 ? 'año' : 'años'} bautizado`
                  : ''}
                {formData.pioneer_type && formData.pioneer_type !== 'none'
                  ? ` · Precursor ${
                      formData.pioneer_type === 'regular'
                        ? 'Regular'
                        : formData.pioneer_type === 'auxiliary' ||
                          formData.pioneer_type === 'auxiliary_continuous'
                        ? 'Auxiliar'
                        : 'Especial'
                    }`
                  : ''}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Nombramiento teocrático, trayectoria de bautismo, esperanza S-21, precursorado, grupo y pastoreo
            </p>
          </div>
        </div>

        {/* SELECTOR DIRECTO DE ROL TEOCRÁTICO */}
        <div className="w-full xl:w-auto overflow-x-auto">
          <div className="inline-flex items-center bg-[#f4f4f7] dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/50 dark:border-white/[0.06] gap-1">
            {roles.map((role) => {
              const isActive = formData.role === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    handleChange('role', role.id);
                    if (role.id === 'unbaptized') {
                      handleChange('baptism_date', '');
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? `${role.color.bg} text-white shadow-md ${role.color.shadow}`
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FILA 1: TRAYECTORIA ESPIRITUAL, PRECURSORADO, GRUPO DE SERVICIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Trayectoria Espiritual y Esperanza S-21 */}
        <div className="bg-zinc-50/60 dark:bg-white/[0.02] p-5 rounded-3xl border border-zinc-200/60 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock size={17} className="text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Trayectoria y Esperanza
              </span>
            </div>
            {formData.role !== 'unbaptized' && (formData.baptism_date || formData.baptismDate) && (
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md">
                {baptismDuration.years}a {baptismDuration.months}m
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            {/* Bautismo */}
            <div
              className={`flex items-center gap-3 transition-all ${
                formData.role === 'unbaptized' ? 'opacity-35 pointer-events-none grayscale' : ''
              }`}
            >
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Droplets size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Fecha de Bautismo (S-21)
                </p>
                <PremiumDatePicker
                  value={formData.baptism_date || formData.baptismDate || ''}
                  onChange={(v) => handleChange('baptism_date', v)}
                  allowFutureYears={false}
                />
              </div>
            </div>

            {/* Inicio como Publicador */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Award size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Inicio como Publicador
                </p>
                <PremiumDatePicker
                  value={formData.publisher_date || ''}
                  onChange={(v) => handleChange('publisher_date', v)}
                  allowFutureYears={false}
                />
              </div>
            </div>

            {/* Fecha de Nombramiento (si es Anciano o Siervo Ministerial) */}
            {isAppointedMale && (
              <div className="flex items-center gap-3 pt-1 border-t border-zinc-200/50 dark:border-white/[0.04]">
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Fecha de Nombramiento ({formData.role === 'elder' ? 'Anciano' : 'Siervo Min.'})
                  </p>
                  <PremiumDatePicker
                    value={formData.appointment_date || ''}
                    onChange={(v) => handleChange('appointment_date', v)}
                    allowFutureYears={false}
                  />
                </div>
              </div>
            )}

            {/* Selector explícito de Esperanza (S-21: Otras ovejas / Ungido) */}
            <div className="pt-2 border-t border-zinc-200/50 dark:border-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Esperanza (Tarjeta S-21)
              </p>
              <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    handleChange('hope', 'otras_ovejas');
                    handleChange('is_anointed', false);
                  }}
                  className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    !isAnointed
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Otras ovejas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('hope', 'ungido');
                    handleChange('is_anointed', true);
                  }}
                  className={`py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isAnointed
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Star size={12} /> Ungido
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Servicio de Precursor */}
        <div className="bg-zinc-50/60 dark:bg-white/[0.02] p-5 rounded-3xl border border-zinc-200/60 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award size={17} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Servicio de Precursor
              </span>
            </div>
            {formData.pioneer_type && formData.pioneer_type !== 'none' && pioneerDuration.totalMonths > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                {pioneerDuration.years > 0 ? `${pioneerDuration.years}a ` : ''}
                {pioneerDuration.months}m
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'none', label: 'Ninguno' },
              { id: 'auxiliary', label: 'P. Auxiliar' },
              { id: 'regular', label: 'P. Regular' },
              { id: 'special', label: 'P. Especial' },
            ].map((type) => {
              const isSelected =
                formData.pioneer_type === type.id ||
                (type.id === 'auxiliary' && formData.pioneer_type === 'auxiliary_continuous');
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleChange('pioneer_type', type.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#ff9500] text-white border-transparent shadow-md shadow-amber-500/20'
                      : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:bg-zinc-100'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>

          {formData.pioneer_type && formData.pioneer_type !== 'none' ? (
            <div className="space-y-3 pt-2 border-t border-zinc-200/50 dark:border-white/[0.04] animate-in fade-in duration-200">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                  Fecha de Nombramiento / Inicio Precursorado
                </label>
                <PremiumDatePicker
                  value={formData.pioneerStartDate || ''}
                  onChange={(v) => handleChange('pioneerStartDate', v)}
                  allowFutureYears={false}
                />
              </div>

              {(formData.pioneer_type === 'regular' || formData.pioneer_type === 'special') && (
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-amber-500" />
                    Última Escuela del Servicio de Precursor
                  </label>
                  <PremiumDatePicker
                    value={formData.pioneer_school_date || ''}
                    onChange={(v) => handleChange('pioneer_school_date', v)}
                    allowFutureYears={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-white/[0.04] text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Selecciona <strong>P. Auxiliar</strong>, <strong>P. Regular</strong> o{' '}
              <strong>P. Especial</strong> para registrar su fecha de inicio y asistencia a la Escuela de Precursores.
            </div>
          )}
        </div>

        {/* 3. Grupo de Servicio del Campo */}
        <div className="bg-zinc-50/60 dark:bg-white/[0.02] p-5 rounded-3xl border border-zinc-200/60 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center gap-2.5">
            <Users size={17} className="text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Grupo de Servicio del Campo
            </span>
          </div>

          <div className="space-y-4">
            {/* Selector de Grupo */}
            <div className="relative" ref={groupsRef}>
              {(() => {
                const selectedGroup = groups.find(
                  (g) => String(g.id) === String(formData.id_grupo) || String(g.number) === String(formData.groupNumber)
                );
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowGroupsMenu(!showGroupsMenu)}
                      className="w-full flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.08] p-3.5 rounded-2xl text-xs font-bold transition-all hover:border-emerald-400 cursor-pointer"
                    >
                      <span
                        className={
                          selectedGroup ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
                        }
                      >
                        {selectedGroup ? selectedGroup.name : 'Sin grupo asignado'}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-zinc-400 transition-transform duration-300 ${
                          showGroupsMenu ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showGroupsMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-xl z-[60] py-1.5 max-h-52 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleChange('id_grupo', null);
                            setShowGroupsMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                            !formData.id_grupo
                              ? 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                              : 'text-zinc-400 italic'
                          }`}
                        >
                          Ninguno (Sin Grupo)
                        </button>
                        {groups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => {
                              handleChange('id_grupo', group.id);
                              setShowGroupsMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                              String(formData.id_grupo) === String(group.id)
                                ? 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {group.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Responsabilidad dentro del grupo */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Responsabilidad en el Grupo
              </p>
              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200/70 dark:border-white/[0.06]">
                {[
                  { id: 'miembro', label: 'Publicador' },
                  { id: 'overseer', label: 'Sup. Grupo' },
                  { id: 'assistant', label: 'Auxiliar' },
                ].map((resp) => {
                  const isActive = (formData.group_responsibility || 'miembro') === resp.id;
                  return (
                    <button
                      key={resp.id}
                      type="button"
                      onClick={() => handleChange('group_responsibility', resp.id)}
                      className={`py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {resp.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2: INDICADORES DE PERFIL Y PASTOREO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Indicadores de Perfil (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-50/60 dark:bg-white/[0.02] p-5 rounded-3xl border border-zinc-200/60 dark:border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Star size={17} className="text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Estado de Actividad e Indicadores Judiciales / Administrativos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'is_active', label: 'Activo', icon: <UserCheck size={15} />, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
              { id: 'is_inactive', label: 'Inactivo', icon: <UserMinus size={15} />, activeClass: 'bg-zinc-600 text-white border-zinc-600 shadow-sm' },
              { id: 'is_regular', label: 'Pub. Regular', icon: <CheckCircle2 size={15} />, activeClass: 'bg-sky-600 text-white border-sky-600 shadow-sm' },
              { id: 'has_key', label: 'Llave Salón', icon: <Key size={15} />, activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-sm' },
              { id: 'reports_to_branch', label: 'Sirve en Betel', icon: <Briefcase size={15} />, activeClass: 'bg-violet-600 text-white border-violet-600 shadow-sm' },
              { id: 'is_reproved', label: 'Censurado', icon: <ShieldAlert size={15} />, activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm' },
              { id: 'is_disfellowshipped', label: 'Sacado', icon: <UserX size={15} />, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm' },
              { id: 'is_reinstated', label: 'Readmitido', icon: <UserPlus size={15} />, activeClass: 'bg-teal-600 text-white border-teal-600 shadow-sm' },
            ].map((item) => {
              const isActive =
                item.id === 'is_inactive'
                  ? formData.is_active === false || formData.status === 'inactive'
                  : !!formData[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'is_inactive') {
                      handleChange('is_active', isActive ? true : false);
                    } else if (item.id === 'is_active') {
                      handleChange('is_active', !isActive);
                    } else {
                      handleChange(item.id, !isActive);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl transition-all border text-xs font-bold cursor-pointer ${
                    isActive
                      ? item.activeClass
                      : 'bg-white dark:bg-zinc-900 border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-zinc-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Notas Espirituales / Pastorales */}
          <div className="pt-2">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Notas de Progreso Espiritual y Metas Teocráticas
            </label>
            <textarea
              rows={2}
              value={formData.spiritual_notes || ''}
              onChange={(e) => handleChange('spiritual_notes', e.target.value)}
              placeholder="Ej. Progresando hacia el precursorado auxiliar, excelente comentador en las reuniones..."
              className="kf-input w-full resize-none bg-white dark:bg-zinc-900 text-xs"
            />
          </div>
        </div>

        {/* Pastoreo y Atención Espiritual (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-50/60 dark:bg-white/[0.02] p-5 rounded-3xl border border-zinc-200/60 dark:border-white/[0.06] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart size={17} className="text-purple-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Pastoreo y Seguimiento
              </span>
            </div>
            {shepherdingAgo ? (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  shepherdingAgo.totalMonths >= 12
                    ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                Hace {shepherdingAgo.years > 0 ? `${shepherdingAgo.years}a ` : ''}
                {shepherdingAgo.months}m
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/70 dark:bg-white/10 text-zinc-500">
                Sin visitas reg.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Última Visita de Pastoreo
              </label>
              <PremiumDatePicker
                value={formData.last_shepherding_visit || formData.last_visit_date || ''}
                onChange={(v) => {
                  handleChange('last_shepherding_visit', v);
                  handleChange('last_visit_date', v);
                }}
                allowFutureYears={false}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
                Prioridad de Atención
              </label>
              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06]">
                {[
                  { id: 'normal', label: 'Normal', active: 'bg-emerald-600 text-white' },
                  { id: 'pronto', label: 'Pronto', active: 'bg-amber-500 text-white' },
                  { id: 'urgente', label: 'Urgente', active: 'bg-rose-600 text-white' },
                ].map((prio) => {
                  const isCurrent = (formData.pastoral_priority || 'normal') === prio.id;
                  return (
                    <button
                      key={prio.id}
                      type="button"
                      onClick={() => handleChange('pastoral_priority', prio.id)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isCurrent ? prio.active : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {prio.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Ancianos que realizaron la última visita
            </label>
            <input
              type="text"
              value={formData.shepherding_elders || ''}
              onChange={(e) => handleChange('shepherding_elders', e.target.value)}
              placeholder="Ej. Hno. García y Hno. Martínez"
              className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
            />
          </div>
        </div>
      </div>

      {/* RESPONSABILIDADES DE CONGREGACIÓN */}
      <div className="bg-zinc-50/40 dark:bg-white/[0.01] p-5 rounded-3xl border border-zinc-200/60 dark:border-white/[0.06] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Gem size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Responsabilidades y Departamentos de Congregación
            </span>
            {activeResponsibilitiesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60">
                {activeResponsibilitiesCount} asignadas
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-semibold text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              Encargado / Titular
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" />
              Auxiliar
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'coordinator', label: 'Coordinador C.A.', icon: <Star size={16} />, color: COLORS.green },
            { id: 'secretary', label: 'Secretario', icon: <PenLine size={16} />, color: COLORS.blue },
            { id: 'service_overseer', label: 'Sup. de Servicio', icon: <Home size={16} />, color: COLORS.orange },
            { id: 'clm_overseer', label: 'Sup. Vida y Min.', icon: <CalendarDays size={16} />, color: COLORS.orange },
            { id: 'watchtower_conductor', label: 'Conductor Atalaya', icon: <BookOpen size={16} />, color: COLORS.blue },
            { id: 'auxiliary_counselor', label: 'Consejero Aux.', icon: <MessageCircle size={16} />, color: COLORS.blue },
            { id: 'public_talk_coordinator', label: 'Coord. Discursos', icon: <Mic size={16} />, color: COLORS.blue },
            { id: 'accounts_servant', label: 'Siervo de Cuentas', icon: <DollarSign size={16} />, color: COLORS.green },
            { id: 'territory_servant', label: 'Territorios', icon: <Map size={16} />, color: COLORS.green },
            { id: 'literature_servant', label: 'Literatura', icon: <Library size={16} />, color: COLORS.sky },
            { id: 'magazines_servant', label: 'Revistas', icon: <Newspaper size={16} />, color: COLORS.sky },
            { id: 'full_audio_video', label: 'Audio y Video', icon: <Headphones size={16} />, color: COLORS.blue },
            { id: 'attendant_overseer', label: 'Acomodadores', icon: <DoorOpen size={16} />, color: COLORS.blue },
            { id: 'maintenance_coordinator', label: 'Mantenimiento', icon: <Wrench size={16} />, color: COLORS.orange },
            { id: 'cleaning_overseer', label: 'Coord. de Aseo', icon: <CheckCircle2 size={16} />, color: COLORS.green },
            { id: 'billboard_manager', label: 'Tablero Anuncios', icon: <ClipboardList size={16} />, color: COLORS.blue },
          ].map((priv) => {
            const isTitular = (formData.privileges || []).includes(priv.id);
            const isAuxiliar = (formData.privileges || []).includes(`${priv.id}_aux`);
            const currentRole = isTitular ? 'titular' : isAuxiliar ? 'auxiliar' : 'none';

            return (
              <div
                key={priv.id}
                className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                  currentRole === 'titular'
                    ? 'bg-indigo-50/60 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 shadow-2xs'
                    : currentRole === 'auxiliar'
                    ? 'bg-zinc-100/80 dark:bg-zinc-800/50 border-zinc-300 dark:border-white/[0.08]'
                    : 'bg-white dark:bg-[#0f1623] border-zinc-200/70 dark:border-white/[0.05]'
                }`}
              >
                <div className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`shrink-0 ${
                          currentRole === 'titular'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : currentRole === 'auxiliar'
                            ? 'text-zinc-600 dark:text-zinc-300'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {priv.icon}
                      </div>
                      <span
                        className={`text-xs font-bold truncate ${
                          currentRole === 'titular'
                            ? 'text-indigo-900 dark:text-indigo-200'
                            : currentRole === 'auxiliar'
                            ? 'text-zinc-800 dark:text-zinc-200'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {priv.label}
                      </span>
                    </div>
                    {currentRole !== 'none' && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          currentRole === 'titular'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-500 text-white'
                        }`}
                      >
                        {currentRole === 'titular' ? 'Titular' : 'Aux.'}
                      </span>
                    )}
                  </div>

                  <div className="flex bg-zinc-100 dark:bg-white/[0.04] p-0.5 rounded-xl gap-0.5">
                    {[
                      { id: 'none', label: 'Ninguno', role: 'none' as const },
                      { id: 'overseer', label: 'Titular', role: 'titular' as const },
                      { id: 'assistant', label: 'Auxiliar', role: 'auxiliar' as const },
                    ].map((opt) => {
                      const active = currentRole === opt.role;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPrivilegeRole(priv.id, opt.role)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            active
                              ? opt.role === 'none'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-2xs'
                                : opt.role === 'titular'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-zinc-500 text-white shadow-2xs'
                              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
