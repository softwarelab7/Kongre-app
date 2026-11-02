// src/components/TableroSalonModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  Maximize2,
  Minimize2,
  X,
  Clock,
  Calendar,
  Mic,
  Users,
  Brush,
  Radio,
  Tv,
  Shield,
  Volume2,
  Compass,
  Building,
  Printer,
  Download,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Pin,
} from 'lucide-react';
import {
  printUnifiedKingdomHallBoardA4,
  downloadCongregationMasterCalendarIcs,
} from '../utils/khsInformationBoardEngine';

interface TableroSalonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TableroSalonModal: React.FC<TableroSalonModalProps> = ({ isOpen, onClose }) => {
  const {
    weeks,
    currentWeek,
    publishersMap,
    settings,
    preachingGroups,
    fieldServiceMeetings,
    notices,
    customDuties,
    cartShifts,
    cartLocations,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
  } = useCongregation();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMeetingView, setActiveMeetingView] = useState<'midweek' | 'weekend'>('midweek');
  const [selectedWeekId, setSelectedWeekId] = useState<string>(() => currentWeek?.id || weeks[0]?.id || '');

  // Real-time clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const w = useMemo(() => {
    return weeks.find((wk) => wk.id === selectedWeekId) || currentWeek || weeks[0];
  }, [weeks, selectedWeekId, currentWeek]);

  const currentWeekIndex = useMemo(() => {
    return weeks.findIndex((wk) => wk.id === (w?.id || ''));
  }, [weeks, w]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (!isOpen || !w) return null;

  const isMidweek = activeMeetingView === 'midweek';

  // Cleaning group
  const cleaningGroupNumber = w.cleaningGroupNumbers?.[0] || 1;
  const cleaningGroup = preachingGroups.find((g) => g.number === cleaningGroupNumber);

  // Duties for current view
  const currentDuties = isMidweek ? w.midweek.duties : w.weekend.duties;

  const getPubName = (id?: string) => {
    if (!id) return 'Sin asignar';
    return publishersMap.get(id)?.name || 'Sin asignar';
  };

  const getDutyPublishers = (key: string) => {
    const ids = currentDuties[key] || [];
    if (ids.length === 0) return 'Sin asignar';
    return ids.map((id) => publishersMap.get(id)?.name || id).join(', ');
  };

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrintA4Board = () => {
    printUnifiedKingdomHallBoardA4({
      week: w,
      weeks,
      publishersMap,
      settings,
      preachingGroups,
      fieldServiceMeetings,
      notices,
      customDuties,
      cartShifts,
      cartLocations,
      circuitVisit,
      memorialPlans,
      theocraticAssemblies,
    });
  };

  const handleDownloadIcs = () => {
    downloadCongregationMasterCalendarIcs({
      week: w,
      weeks,
      publishersMap,
      settings,
      preachingGroups,
      fieldServiceMeetings,
      notices,
      customDuties,
      cartShifts,
      cartLocations,
      circuitVisit,
      memorialPlans,
      theocraticAssemblies,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tablero Mural Digital del Salón del Reino"
      className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col overflow-y-auto kg-ambient-mesh"
    >
      {/* Top Bar with Realtime Clock and Controls */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 bg-[#121216]/90 border-b border-white/10 flex items-center justify-between gap-3 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 border border-indigo-400/30">
            <Building className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-extrabold tracking-tight truncate text-white">
              {settings.congregationName}
            </h1>
            <p className="text-[11px] sm:text-xs text-indigo-300 capitalize truncate font-medium">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Real-time Clock & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Studio Clock */}
          <div className="bg-[#18181F]/90 px-3 sm:px-4 py-1.5 rounded-2xl border border-amber-500/30 flex items-center gap-2 text-amber-400 font-mono text-sm sm:text-xl font-black tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
            <span className="tabular-nums">{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadIcs}
            aria-label="Descargar Calendario .ics del Salón"
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 px-3 font-bold text-xs cursor-pointer active:scale-95 shadow-xs"
            title="Descargar Calendario General del Salón (.ics)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Calendario (.ics)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintA4Board}
            aria-label="Imprimir Tablero Mural A4 para el Salón"
            className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 px-3 font-bold text-xs cursor-pointer active:scale-95 shadow-xs"
            title="Imprimir Cartelera A4 Todo-en-Uno (S-140 / S-28 / Deberes)"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Cartelera A4</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Tablero del Salón"
            className="p-2 sm:p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
            title="Cerrar Tablero"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Kiosk Content */}
      <main className="flex-1 w-full mx-auto p-4 sm:p-6 2xl:p-10 space-y-5 sm:space-y-6">
        {/* Meeting Switcher & Week Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#121216]/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-md">
          <div className="space-y-1">
            <div className="text-[10px] sm:text-xs font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)] animate-pulse" />
              <span>Tablero de Información del Salón del Reino</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-white font-mono tabular-nums">
                Semana del {w.weekStartDate} al {w.weekEndDate}
              </h2>
              <select
                value={w.id}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                aria-label="Cambiar semana en el Tablero del Salón"
                className="px-3.5 py-1.5 rounded-xl bg-[#18181F] border border-white/10 text-xs font-bold text-indigo-200 cursor-pointer shadow-xs focus:outline-none"
              >
                {weeks.map((wk) => (
                  <option key={wk.id} value={wk.id}>
                    {wk.weekStartDate} al {wk.weekEndDate}
                    {wk.specialEvent?.title ? ` ★ ${wk.specialEvent.title}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segmented Meeting View Switcher */}
          <div className="grid grid-cols-2 w-full sm:w-auto rounded-2xl bg-black/40 p-1 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveMeetingView('midweek')}
              className={`px-4 sm:px-6 py-2 rounded-xl font-extrabold text-xs transition-all text-center cursor-pointer active:scale-95 ${
                isMidweek
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entre Semana (VMC)
            </button>
            <button
              onClick={() => setActiveMeetingView('weekend')}
              className={`px-4 sm:px-6 py-2 rounded-xl font-extrabold text-xs transition-all text-center cursor-pointer active:scale-95 ${
                !isMidweek
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Fin de Semana
            </button>
          </div>
        </div>

        {/* Grid of Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Program of the Meeting */}
          <div className="lg:col-span-2 space-y-5">
            <div className="kg-card-bento bg-[#121216]/90 rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-base sm:text-lg font-black text-indigo-300 flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <Mic className="w-4 h-4" />
                  </div>
                  <span>
                    {isMidweek
                      ? 'Reunión de Vida y Ministerio Cristianos (S-140)'
                      : 'Reunión Pública y Estudio de La Atalaya'}
                  </span>
                </div>
                <span className="text-xs font-mono tabular-nums text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                  {isMidweek
                    ? `${w.midweek.date || w.weekStartDate} • ${settings.midweekMeetingTime || '19:00'}`
                    : `${w.weekend.date || w.weekEndDate} • ${settings.weekendMeetingTime || '10:00'}`}
                </span>
              </h3>

              {isMidweek ? (
                <div className="space-y-4 text-xs sm:text-sm">
                  {/* President & Prayers */}
                  <div className="grid grid-cols-3 gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-extrabold tracking-wider">
                        Presidente
                      </span>
                      <span className="font-extrabold text-indigo-200 text-sm">
                        {getPubName(w.midweek.presidentId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-extrabold tracking-wider">
                        Oración Inicial
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {getPubName(w.midweek.initialPrayerId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-extrabold tracking-wider">
                        Oración Final
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {getPubName(w.midweek.finalPrayerId)}
                      </span>
                    </div>
                  </div>

                  {/* Tesoros */}
                  <div className="border-l-4 border-slate-500 pl-3.5 py-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        Tesoros de la Biblia
                      </span>
                      {w.midweek.bibleReading && (
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                          📖 {w.midweek.bibleReading}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-zinc-300">
                        {w.midweek.tesoros.discurso.title} (10 min)
                      </span>
                      <span className="font-bold text-white">
                        {getPubName(w.midweek.tesoros.discurso.publisherId)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-zinc-300">
                        {w.midweek.tesoros.perlas.title} (10 min)
                      </span>
                      <span className="font-bold text-white">
                        {getPubName(w.midweek.tesoros.perlas.publisherId)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-zinc-300">
                        {w.midweek.tesoros.lecturaBiblia.title} (4 min)
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-white block">
                          {getPubName(w.midweek.tesoros.lecturaBiblia.publisherId)}
                        </span>
                        {w.midweek.tesoros.lecturaBibliaAux?.publisherId && (
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Sala Aux: {getPubName(w.midweek.tesoros.lecturaBibliaAux.publisherId)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seamos Mejores Maestros */}
                  <div className="border-l-4 border-amber-500 pl-3.5 py-1 space-y-2.5">
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                      Seamos Mejores Maestros
                    </span>
                    {w.midweek.maestros.items.map((item, idx) => {
                      const pubName = getPubName(item.publisherId);
                      const astName = item.assistantId ? getPubName(item.assistantId) : null;

                      return (
                        <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-zinc-300">
                            {item.title} {item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
                          </span>
                          <span className="font-bold text-white text-right">
                            {pubName}
                            {astName && (
                              <span className="text-amber-300 font-normal"> / {astName}</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vida Cristiana */}
                  <div className="border-l-4 border-rose-500 pl-3.5 py-1 space-y-2.5">
                    <span className="text-xs font-extrabold text-rose-300 uppercase tracking-wider">
                      Nuestra Vida Cristiana
                    </span>
                    {w.midweek.vidaCristiana.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-zinc-300">
                          {item.title} {item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
                        </span>
                        <span className="font-bold text-white">
                          {getPubName(item.publisherId)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs sm:text-sm pt-2 border-t border-white/10">
                      <span className="text-zinc-300">Estudio Bíblico de Congregación (30 min)</span>
                      <span className="font-bold text-white text-right">
                        {getPubName(w.midweek.vidaCristiana.estudioBiblico.conductorId)}{' '}
                        <span className="text-zinc-400 font-normal">
                          (Lector: {getPubName(w.midweek.vidaCristiana.estudioBiblico.lectorId)})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Weekend Program */
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-extrabold tracking-wider">
                        Presidente
                      </span>
                      <span className="font-extrabold text-blue-200 text-sm">
                        {getPubName(w.weekend.presidentId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-extrabold tracking-wider">
                        Oración Inicial
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {getPubName(w.weekend.initialPrayerId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block uppercase font-extrabold tracking-wider">
                        Oración Final
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {getPubName(w.weekend.finalPrayerId)}
                      </span>
                    </div>
                  </div>

                  {/* Public Talk */}
                  <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent p-4 sm:p-5 rounded-2xl border border-blue-500/30 space-y-2">
                    <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest block">
                      Discurso Público (30 min)
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                      {w.weekend.publicTalkOutlineNumber ? `#${w.weekend.publicTalkOutlineNumber} ` : ''}
                      “{w.weekend.publicTalkTheme || 'Tema pendiente'}”
                    </h4>
                    <div className="flex items-center gap-2 pt-1 text-xs sm:text-sm">
                      <span className="text-zinc-400">Orador:</span>
                      <span className="font-bold text-amber-300">
                        {w.weekend.publicTalkSpeaker || 'Pendiente'}
                      </span>
                      {w.weekend.visitingSpeakerCongregation && (
                        <span className="text-zinc-400">
                          (Congregación {w.weekend.visitingSpeakerCongregation})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Watchtower Study */}
                  <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-2">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block">
                      Estudio de La Atalaya (60 min)
                    </span>
                    <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm pt-1">
                      <div>
                        <span className="text-zinc-400 block text-xs">Conductor:</span>
                        <span className="font-extrabold text-white text-sm sm:text-base">
                          {getPubName(w.weekend.atalayaConductorId)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-xs">Lector:</span>
                        <span className="font-extrabold text-white text-sm sm:text-base">
                          {getPubName(w.weekend.atalayaLectorId)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Duties, Cleaning & Field Service */}
          <div className="space-y-5">
            {/* Duties on Guard */}
            <div className="kg-card-bento bg-[#121216]/90 rounded-2xl sm:rounded-3xl border border-white/10 p-5 shadow-xl backdrop-blur-xl space-y-3.5">
              <h3 className="text-sm sm:text-base font-extrabold text-teal-300 flex items-center gap-2 border-b border-white/10 pb-3">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Deberes y Asistencia Técnica</span>
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Tv className="w-3.5 h-3.5 text-indigo-400" /> Audio y Video:
                  </span>
                  <span className="font-bold text-white text-right">
                    {(() => {
                      const audioPubs = (currentDuties['deber_audio'] || []).map((id) => publishersMap.get(id)?.name).filter(Boolean);
                      const videoPubs = (currentDuties['deber_video'] || []).map((id) => publishersMap.get(id)?.name).filter(Boolean);
                      const combined = Array.from(new Set([...audioPubs, ...videoPubs]));
                      return combined.length > 0 ? combined.join(', ') : '---';
                    })()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" /> Micrófonos:
                  </span>
                  <span className="font-bold text-white text-right">
                    {getDutyPublishers('deber_microfonos')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-blue-400" /> Plataforma:
                  </span>
                  <span className="font-bold text-white text-right">
                    {getDutyPublishers('deber_plataforma')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Acomodadores:
                  </span>
                  <span className="font-bold text-white text-right">
                    {getDutyPublishers('deber_acomodador')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-rose-400" /> Seguridad:
                  </span>
                  <span className="font-bold text-white text-right">
                    {getDutyPublishers('deber_seguridad')}
                  </span>
                </div>
              </div>
            </div>

            {/* Cleaning Group */}
            <div className="kg-card-bento bg-[#121216]/90 rounded-2xl sm:rounded-3xl border border-white/10 p-5 shadow-xl backdrop-blur-xl space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-300 flex items-center gap-2 border-b border-white/10 pb-3">
                <Brush className="w-4 h-4 text-emerald-400" />
                <span>Limpieza del Salón del Reino (S-28)</span>
              </h3>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-400">Grupo asignado esta semana:</span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 font-black text-xs sm:text-sm border border-emerald-500/30">
                  {cleaningGroup ? `Grupo #${cleaningGroup.number}` : `Grupo #${cleaningGroupNumber}`}
                </span>
              </div>
              {cleaningGroup?.name && (
                <p className="text-xs text-zinc-400 italic">“{cleaningGroup.name}”</p>
              )}
            </div>

            {/* Field Service Next Meetings */}
            <div className="kg-card-bento bg-[#121216]/90 rounded-2xl sm:rounded-3xl border border-white/10 p-5 shadow-xl backdrop-blur-xl space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-blue-300 flex items-center gap-2 border-b border-white/10 pb-3">
                <Compass className="w-4 h-4 text-blue-400" />
                <span>Salidas de Predicación</span>
              </h3>

              <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                {fieldServiceMeetings.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-white block font-mono tabular-nums">
                        {f.dayOfWeek} {f.time}
                      </span>
                      <span className="text-[11px] text-zinc-400">{f.location}</span>
                    </div>
                    {f.conductorId && (
                      <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-800/50">
                        {publishersMap.get(f.conductorId)?.name || 'Conductor'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Congregation Notices & Announcements */}
            {notices.length > 0 && (
              <div className="kg-card-bento bg-[#121216]/90 rounded-2xl sm:rounded-3xl border border-indigo-500/30 p-5 shadow-xl backdrop-blur-xl space-y-3">
                <h3 className="text-sm font-extrabold text-indigo-300 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Pin className="w-4 h-4 text-amber-400" />
                    <span>Anuncios y Avisos Oficiales</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                    Cartelera
                  </span>
                </h3>
                <div className="space-y-2 text-xs max-h-44 overflow-y-auto">
                  {notices.slice(0, 3).map((notice) => (
                    <div
                      key={notice.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1"
                    >
                      <span className="font-bold text-white block line-clamp-1">
                        {notice.title}
                      </span>
                      <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
