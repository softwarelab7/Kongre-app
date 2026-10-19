import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Calendar, Users, Gem, 
  UserCheck, UserMinus, Star, Key, Briefcase, 
  UserX, UserPlus, ShieldAlert,
  Clock, Award, BookOpen, Heart, Droplets,
  Plus, UserCircle, ChevronDown, Check, ShieldCheck, KeyRound, RefreshCcw,
  Sparkles, Headphones, DoorOpen, ClipboardList, Mic, MessageCircle,
  Wrench, DollarSign, Library, Newspaper, PenLine, Home, Map, CalendarDays
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
  togglePrivilege, 
  setPrivilegeRole 
}) => {
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showGroupsMenu, setShowGroupsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
      if (groupsRef.current && !groupsRef.current.contains(event.target as Node)) {
        setShowGroupsMenu(false);
      }
    };
    if (showPlusMenu || showGroupsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu, showGroupsMenu]);
  
  const calculateYears = (dateStr: string) => {
    if (!dateStr) return 0;
    const birth = new Date(dateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0 ? years : 0;
  };

  const yearsBaptized = calculateYears(formData.baptism_date);

  const handleSetUnbaptized = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleChange('role', 'unbaptized');
    handleChange('baptism_date', '');
    setShowPlusMenu(false);
  };

  const COLORS = {
    green: { bg: 'bg-[#10b981]', soft: 'bg-[#e6f6f0]', text: 'text-[#10b981]', shadow: 'shadow-[#10b981]/30' },
    blue: { bg: 'bg-[#6556F0]', soft: 'bg-[#eef2ff]', text: 'text-[#6556F0]', shadow: 'shadow-[#6556F0]/30' },
    sky: { bg: 'bg-[#0ea5e9]', soft: 'bg-[#e0f2fe]', text: 'text-[#0ea5e9]', shadow: 'shadow-[#0ea5e9]/30' },
    orange: { bg: 'bg-[#ff9500]', soft: 'bg-[#fff4e6]', text: 'text-[#ff9500]', shadow: 'shadow-[#ff9500]/30' },
    zinc: { bg: 'bg-[#71717a]', soft: 'bg-[#f4f4f5]', text: 'text-[#71717a]', shadow: 'shadow-zinc-500/30' }
  };

  const roles = [
    { id: 'elder', label: 'Anciano', color: COLORS.green },
    { id: 'servant', label: 'Siervo Ministerial', color: COLORS.blue },
    { id: 'publisher', label: 'Publicador', color: COLORS.sky }
  ];

  const activeRoles = [...roles];
  if (formData.role === 'unbaptized') {
    activeRoles.push({ id: 'unbaptized', label: 'Publicador No Bautizado', color: COLORS.zinc });
  }

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-sm transition-all space-y-6">
      {/* CABECERA DE LA TARJETA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold shadow-xs shrink-0 ring-4 ring-emerald-500/5">
            <Shield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Estado Espiritual y Privilegios
              </h3>
              {yearsBaptized > 0 && formData.role !== 'unbaptized' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50">
                  {yearsBaptized} años bautizado
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Rol eclesiástico, trayectoria de bautismo, precursorado, grupo de servicio y pastoreo
            </p>
          </div>
        </div>
          
          <div className="flex items-center gap-3">
             {formData.role === 'unbaptized' && (
               <span className={`px-4 py-2 rounded-xl text-[11px] font-bold ${COLORS.zinc.soft} ${COLORS.zinc.text} border border-zinc-200 shadow-sm animate-in zoom-in-95`}>Publicador No Bautizado</span>
             )}
             {formData.role === 'publisher' && (
               <span className={`px-4 py-2 rounded-xl text-[11px] font-bold ${COLORS.sky.soft} ${COLORS.sky.text} border border-[#0ea5e9]/10 shadow-sm animate-in zoom-in-95`}>Publicador Bautizado</span>
             )}
             {formData.role === 'servant' && (
               <span className={`px-4 py-2 rounded-xl text-[11px] font-bold ${COLORS.blue.soft} ${COLORS.blue.text} border border-[#6556F0]/10 shadow-sm animate-in zoom-in-95`}>Siervo Ministerial</span>
             )}
             {formData.role === 'elder' && (
               <span className={`px-4 py-2 rounded-xl text-[11px] font-bold ${COLORS.green.soft} ${COLORS.green.text} border border-[#10b981]/10 shadow-sm animate-in zoom-in-95`}>Anciano de Congregación</span>
             )}
             {formData.pioneer_type !== 'none' && (
               <span className={`px-4 py-2 rounded-xl text-[11px] font-bold ${COLORS.orange.soft} ${COLORS.orange.text} border border-[#ff9500]/10 shadow-sm animate-in zoom-in-95`}>
                 Precursor {formData.pioneer_type === 'regular' ? 'Regular' : formData.pioneer_type === 'auxiliary' ? 'Auxiliar' : 'Especial'}
               </span>
             )}
             {yearsBaptized > 0 && formData.role !== 'unbaptized' && (
               <span className={`px-4 py-2 rounded-xl text-[11px] font-bold ${COLORS.blue.soft} ${COLORS.blue.text} border border-[#6556F0]/10 shadow-sm animate-in zoom-in-95`}>
                 {yearsBaptized} Años Bautizado
               </span>
             )}
          </div>
        <div className="relative" ref={menuRef}>
          <div className="flex items-center bg-[#f4f4f7] dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/50 dark:border-white/[0.06]">
            {activeRoles.map(role => {
              const isActive = formData.role === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleChange('role', role.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-widest transition-all ${
                    isActive ? `${role.color.bg} text-white shadow-xl ${role.color.shadow} scale-105` : 'text-zinc-400 hover:text-zinc-500'
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowPlusMenu(!showPlusMenu);
              }}
              className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl ml-1 ${
                showPlusMenu ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-700'
              }`}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          {/* MENÚ DESPLEGABLE */}
          {showPlusMenu && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-[#0f1623] border border-zinc-100 dark:border-white/[0.06] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-2 z-[100] animate-in slide-in-from-top-2 duration-200">
               <button
                 onMouseDown={handleSetUnbaptized}
                 className="w-full flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-all group text-left"
               >
                 <div className={`w-10 h-10 rounded-xl ${COLORS.zinc.soft} flex items-center justify-center ${COLORS.zinc.text} group-hover:scale-110 transition-transform`}>
                    <UserCircle size={20} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200">Publicador No Bautizado</span>
                   <span className="text-[10px] font-semibold text-zinc-500">Cambiar estado del registro</span>
                 </div>
               </button>
            </div>
          )}
        </div>
      </div>

      {/* FILA 1: TRAYECTORIA, PRECURSOR, GRUPO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trayectoria */}
        <div className="bg-white dark:bg-[#0f1623] p-5 rounded-3xl border border-zinc-100 dark:border-white/[0.04] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-zinc-300" />
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Trayectoria</span>
          </div>
          <div className="flex flex-col gap-5 mt-4">
            <div className={`flex items-center gap-4 transition-all duration-500 ${formData.role === 'unbaptized' ? 'opacity-20 scale-95 grayscale pointer-events-none' : ''}`}>
              <div className={`w-12 h-12 shrink-0 rounded-full ${COLORS.sky.soft} flex items-center justify-center border border-[#0ea5e9]/10 ${COLORS.sky.text}`}>
                <Droplets size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Bautismo</p>
                <div className="w-full">
                  <PremiumDatePicker value={formData.baptism_date} onChange={v => handleChange('baptism_date', v)} allowFutureYears={false} />
                </div>
              </div>
            </div>
            
            <div className="h-px bg-zinc-100 dark:bg-white/[0.04] w-full" />
            
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 shrink-0 rounded-full ${COLORS.green.soft} flex items-center justify-center border border-[#10b981]/10 ${COLORS.green.text}`}>
                <Award size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Publicador</p>
                <div className="w-full">
                  <PremiumDatePicker value={formData.publisher_date} onChange={v => handleChange('publisher_date', v)} allowFutureYears={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Precursor */}
        <div className="bg-white dark:bg-[#0f1623] p-5 rounded-3xl border border-zinc-100 dark:border-white/[0.04] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Award size={18} className={`${COLORS.orange.text}`} />
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Precursor</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'none', label: 'Ninguno' },
              { id: 'auxiliary', label: 'Auxiliar' },
              { id: 'regular', label: 'Regular' },
              { id: 'special', label: 'Especial' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => handleChange('pioneer_type', type.id)}
                className={`py-4 rounded-xl text-[12px] font-bold mb-1 transition-all ${
                  formData.pioneer_type === type.id ? `${COLORS.orange.bg} text-white shadow-lg` : 'bg-[#f8f8fa] dark:bg-zinc-800 text-zinc-400'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grupo de Servicio */}
        <div className="bg-white dark:bg-[#0f1623] p-5 rounded-3xl border border-zinc-100 dark:border-white/[0.04] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Users size={18} className={`${COLORS.green.text}`} />
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Grupo de Servicio</span>
          </div>
          <div className="space-y-4">
            {/* SELECTOR DE GRUPO DINÁMICO */}
            <div className="relative" ref={groupsRef}>
              {(() => {
                const selectedGroup = groups.find(g => g.id === formData.id_grupo);
                return (
                  <>
                    <button
                      onClick={() => setShowGroupsMenu(!showGroupsMenu)}
                      className="w-full flex items-center justify-between bg-[#f8f8fa] dark:bg-zinc-800 p-4 rounded-xl text-[12px] font-black transition-all hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                    >
                      <span className={formData.id_grupo ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-400'}>
                        {selectedGroup ? selectedGroup.name : 'Seleccionar Grupo'}
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${showGroupsMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showGroupsMenu && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0f1623] border border-zinc-100 dark:border-white/[0.06] rounded-2xl shadow-2xl z-[60] py-2 animate-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto custom-scrollbar">
                        {groups.length > 0 ? (
                          <>
                            {/* Opción para quitar el grupo */}
                            <button
                              onClick={() => {
                                handleChange('id_grupo', null);
                                setShowGroupsMenu(false);
                              }}
                              className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                !formData.id_grupo ? 'text-[#10b981] bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-zinc-400 italic'
                              }`}
                            >
                              Ninguno (Sin Grupo)
                            </button>
                            {groups.map((group) => (
                              <button
                                key={group.id}
                                onClick={() => {
                                  handleChange('id_grupo', group.id);
                                  setShowGroupsMenu(false);
                                }}
                                className={`w-full text-left px-5 py-3 text-[13px] font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                  formData.id_grupo === group.id ? 'text-[#10b981] bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-zinc-500'
                                }`}
                              >
                                {group.name}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="px-5 py-3 text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 italic">No hay grupos configurados</div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex bg-[#f8f8fa] dark:bg-[#0f1623] p-1 rounded-full border border-zinc-100 dark:border-white/[0.04]">
              {['miembro', 'overseer', 'assistant'].map(resp => (
                <button
                  key={resp} onClick={() => handleChange('group_responsibility', resp)}
                  className={`flex-1 py-3 rounded-full text-[11px] font-bold transition-all ${
                    formData.group_responsibility === resp ? `${COLORS.green.bg} text-white shadow-lg` : 'text-zinc-400'
                  }`}
                >
                  {resp === 'miembro' ? 'Miembro' : resp === 'overseer' ? 'Capitán' : 'Auxiliar'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2: INDICADORES Y PASTOREO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Indicadores */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1623] p-5 rounded-3xl border border-zinc-100 dark:border-white/[0.04] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Star size={18} className={`${COLORS.green.text}`} />
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Indicadores de Perfil</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'is_active', label: 'Activo', icon: <UserCheck size={16} />, color: COLORS.green },
              { id: 'is_regular', label: 'Inactivo', icon: <UserMinus size={16} />, color: COLORS.zinc },
              { id: 'is_anointed', label: 'Ungido', icon: <Star size={16} />, color: COLORS.orange },
              { id: 'has_key', label: 'Llave del Salón', icon: <Key size={16} />, color: COLORS.blue },
              { id: 'reports_to_branch', label: 'Betel', icon: <Briefcase size={16} />, color: COLORS.blue },
              { id: 'is_disfellowshipped', label: 'Sacado', icon: <UserX size={16} />, color: { bg: 'bg-red-500', shadow: 'shadow-red-500/30' } },
              { id: 'is_reinstated', label: 'Readmitido', icon: <UserPlus size={16} />, color: { bg: 'bg-teal-500', shadow: 'shadow-teal-500/30' } },
              { id: 'is_reproved', label: 'Censurado', icon: <ShieldAlert size={16} />, color: { bg: 'bg-orange-600', shadow: 'shadow-orange-600/30' } }
            ].map(item => {
              const isActive = !!formData[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleChange(item.id, !isActive);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                    isActive ? `${item.color.bg} text-white border-transparent shadow-lg scale-105` : 'bg-[#fcfcfd] dark:bg-zinc-800/40 border-zinc-100 dark:border-white/[0.06] text-zinc-400'
                  }`}
                >
                  <div className={isActive ? 'text-white' : 'text-zinc-300'}>{item.icon}</div>
                  <span className="text-[12px] font-bold mb-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Último Pastoreo */}
        <div className="bg-white dark:bg-[#0f1623] p-5 rounded-3xl border border-zinc-100 dark:border-white/[0.04] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Heart size={18} className="text-[#a855f7]" />
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Último Pastoreo</span>
          </div>
          <div className="space-y-4">

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 px-1">Fecha de Registro</label>
              <div className="flex-1">
                <PremiumDatePicker value={formData.last_shepherding_visit} onChange={v => handleChange('last_shepherding_visit', v)} allowFutureYears={false} />
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium px-1">
              Mantener un registro actualizado ayuda a asegurar que todos reciban la atención necesaria.
            </p>
          </div>
        </div>
      </div>

      {/* RESPONSABILIDADES DE CONGREGACIÓN */}
      <div className="bg-white dark:bg-[#0f1623] p-5 rounded-3xl border border-zinc-100 dark:border-white/[0.04] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gem size={18} className={`${COLORS.blue.text}`} />
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400">Responsabilidades de Congregación</span>
          </div>
          {/* Leyenda */}
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-semibold text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>Titular</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block"></span>Aux.</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'cleaning_overseer',       label: 'Aseo',               icon: <Sparkles size={16} />,       color: COLORS.green },
            { id: 'watchtower_conductor',     label: 'Atalaya',            icon: <BookOpen size={16} />,       color: COLORS.blue },
            { id: 'full_audio_video',         label: 'Audio y Video',      icon: <Headphones size={16} />,     color: COLORS.blue },
            { id: 'attendant_overseer',       label: 'Acomodadores',       icon: <DoorOpen size={16} />,       color: COLORS.blue },
            { id: 'billboard_manager',        label: 'Cartelera',          icon: <ClipboardList size={16} />,  color: COLORS.blue },
            { id: 'public_talk_coordinator',  label: 'Conferencias',       icon: <Mic size={16} />,            color: COLORS.blue },
            { id: 'auxiliary_counselor',      label: 'Consejero Aux.',     icon: <MessageCircle size={16} />,  color: COLORS.blue },
            { id: 'coordinator',              label: 'Coordinador',        icon: <Star size={16} />,           color: COLORS.green },
            { id: 'maintenance_coordinator',  label: 'Mantenimiento',      icon: <Wrench size={16} />,         color: COLORS.orange },
            { id: 'accounts_servant',         label: 'Cuentas',            icon: <DollarSign size={16} />,     color: { bg: 'bg-red-500', shadow: 'shadow-red-500/30', text: 'text-red-500', soft: 'bg-red-50 dark:bg-red-500/10' } },
            { id: 'literature_servant',       label: 'Literatura',         icon: <Library size={16} />,        color: { bg: 'bg-teal-500', shadow: 'shadow-teal-500/30', text: 'text-teal-500', soft: 'bg-teal-50 dark:bg-teal-500/10' } },
            { id: 'magazines_servant',        label: 'Revistas',           icon: <Newspaper size={16} />,      color: { bg: 'bg-cyan-500', shadow: 'shadow-cyan-500/30', text: 'text-cyan-500', soft: 'bg-cyan-50 dark:bg-cyan-500/10' } },
            { id: 'secretary',                label: 'Secretario',         icon: <PenLine size={16} />,        color: { bg: 'bg-purple-500', shadow: 'shadow-purple-500/30', text: 'text-purple-500', soft: 'bg-purple-50 dark:bg-purple-500/10' } },
            { id: 'service_overseer',         label: 'Servicio',           icon: <Home size={16} />,           color: COLORS.orange },
            { id: 'clm_overseer',             label: 'Superint. VMC',      icon: <CalendarDays size={16} />,   color: COLORS.orange },
            { id: 'territory_servant',        label: 'Territorios',        icon: <Map size={16} />,            color: COLORS.green }
          ].map(priv => {
            const isTitular = (formData.privileges || []).includes(priv.id);
            const isAuxiliar = (formData.privileges || []).includes(`${priv.id}_aux`);
            const currentRole = isTitular ? 'titular' : isAuxiliar ? 'auxiliar' : 'none';

            return (
              <div
                key={priv.id}
                className={`relative group rounded-2xl border transition-all duration-300 overflow-hidden ${
                  currentRole === 'titular'
                    ? `${priv.color.soft || 'bg-indigo-50 dark:bg-indigo-500/10'} border-transparent ring-1 ring-inset ${
                        priv.color.bg === 'bg-indigo-600' || priv.color.bg === 'bg-[#6556F0]'
                          ? 'ring-indigo-200 dark:ring-indigo-500/30'
                          : 'ring-zinc-200 dark:ring-zinc-500/20'
                      }`
                    : currentRole === 'auxiliar'
                    ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-white/[0.06]'
                    : 'bg-white dark:bg-[#0f1623] border-zinc-100 dark:border-white/[0.04] hover:border-zinc-200 dark:hover:border-white/[0.08]'
                }`}
              >
                {/* Glow de fondo cuando está activo */}
                {currentRole !== 'none' && (
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    currentRole === 'titular' ? priv.color.soft : 'bg-zinc-100/50 dark:bg-zinc-700/20'
                  }`} />
                )}

                <div className="relative p-4 flex flex-col gap-3">
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`shrink-0 ${
                        currentRole === 'titular' ? priv.color.text || 'text-indigo-600 dark:text-indigo-400'
                        : currentRole === 'auxiliar' ? 'text-zinc-400 dark:text-zinc-500'
                        : 'text-zinc-300 dark:text-zinc-600'
                      }`}>{priv.icon}</div>
                      <span className={`text-[12px] font-bold ${
                        currentRole === 'titular' ? priv.color.text || 'text-indigo-600 dark:text-indigo-400'
                        : currentRole === 'auxiliar' ? 'text-zinc-600 dark:text-zinc-300'
                        : 'text-zinc-500 dark:text-zinc-400'
                      }`}>{priv.label}</span>
                    </div>
                    {/* Badge de estado */}
                    {currentRole !== 'none' && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        currentRole === 'titular'
                          ? `${priv.color.bg} text-white`
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                      }`}>
                        {currentRole === 'titular' ? 'Titular' : 'Aux.'}
                      </span>
                    )}
                  </div>

                  {/* Selector de rol */}
                  <div className="flex bg-black/[0.04] dark:bg-white/[0.04] p-0.5 rounded-xl gap-0.5">
                    {[
                      { id: 'none',      label: 'Ninguno',  role: 'none' as const },
                      { id: 'overseer',  label: 'Titular',  role: 'titular' as const },
                      { id: 'assistant', label: 'Auxiliar', role: 'auxiliar' as const }
                    ].map(opt => {
                      const active = currentRole === opt.role;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPrivilegeRole(priv.id, opt.role)}
                          className={`flex-1 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${
                            active
                              ? opt.role === 'none'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-sm'
                                : opt.role === 'titular'
                                ? `${priv.color.bg} text-white shadow-sm`
                                : 'bg-zinc-400 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                          }`}
                        >
                          {opt.role === 'none' ? 'Ning.' : opt.role === 'titular' ? 'Cap.' : 'Aux.'}
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
