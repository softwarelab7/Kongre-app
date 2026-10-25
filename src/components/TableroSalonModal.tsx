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
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto"
    >
      {/* Top Bar with Clock and Controls */}
      <header className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shrink-0">
            <Building className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-extrabold tracking-tight truncate">
              {settings.congregationName}
            </h1>
            <p className="text-[11px] sm:text-xs text-indigo-300 capitalize truncate">{formattedDate}</p>
          </div>
        </div>

        {/* Real-time Clock & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="bg-slate-800/80 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 text-amber-400 font-mono text-sm sm:text-xl font-bold tracking-wider shadow-inner">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span>{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadIcs}
            aria-label="Descargar Calendario .ics del Salón"
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 px-3 font-semibold text-xs cursor-pointer"
            title="Descargar Calendario General del Salón (.ics)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Calendario (.ics)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintA4Board}
            aria-label="Imprimir Tablero Mural A4 para el Salón"
            className="p-2 sm:p-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 px-3 font-semibold text-xs cursor-pointer"
            title="Imprimir Cartelera A4 Todo-en-Uno (S-140 / S-28 / Deberes)"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Cartelera A4</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Tablero del Salón"
            className="p-2 sm:p-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            title="Cerrar Tablero"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Kiosk Content */}
      <main className="flex-1 w-full mx-auto p-4 sm:p-6 2xl:p-10 space-y-4 sm:space-y-6">
        {/* Meeting Switcher & Week Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="space-y-1">
            <div className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Tablero de Información del Salón del Reino
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black text-white">
                Semana del {w.weekStartDate} al {w.weekEndDate}
              </h2>
              <select
                value={w.id}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                aria-label="Cambiar semana en el Tablero del Salón"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-200 cursor-pointer"
              >
                {weeks.map((wk) => (
                  <option key={wk.id} value={wk.id}>
                    {wk.weekStartDate} al {wk.weekEndDate}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 w-full sm:w-auto rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setActiveMeetingView('midweek')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all text-center cursor-pointer ${
                isMidweek
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Entre Semana
            </button>
            <button
              onClick={() => setActiveMeetingView('weekend')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs transition-all text-center cursor-pointer ${
                !isMidweek
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fin de Semana
            </button>
          </div>
        </div>

        {/* Grid of Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Program of the Meeting */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
              <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                <Mic className="w-5 h-5 text-indigo-400" />
                <span>
                  {isMidweek
                    ? 'Reunión de Vida y Ministerio Cristianos'
                    : 'Reunión Pública y Estudio de La Atalaya'}
                </span>
              </h3>

              {isMidweek ? (
                <div className="space-y-4 text-sm">
                  {/* President & Prayers */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-2xs text-slate-400 block uppercase font-bold">
                        Presidente
                      </span>
                      <span className="font-bold text-indigo-200">
                        {getPubName(w.midweek.presidentId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block uppercase font-bold">
                        Oración Inicial
                      </span>
                      <span className="font-semibold text-slate-200">
                        {getPubName(w.midweek.initialPrayerId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block uppercase font-bold">
                        Oración Final
                      </span>
                      <span className="font-semibold text-slate-200">
                        {getPubName(w.midweek.finalPrayerId)}
                      </span>
                    </div>
                  </div>

                  {/* Tesoros */}
                  <div className="border-l-4 border-slate-400 pl-3 py-1 space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Tesoros de la Biblia
                    </span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {w.midweek.tesoros.discurso.title} (10 min)
                      </span>
                      <span className="font-bold text-white">
                        {getPubName(w.midweek.tesoros.discurso.publisherId)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {w.midweek.tesoros.perlas.title} (10 min)
                      </span>
                      <span className="font-bold text-white">
                        {getPubName(w.midweek.tesoros.perlas.publisherId)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {w.midweek.tesoros.lecturaBiblia.title} (4 min)
                      </span>
                      <span className="font-bold text-white">
                        {getPubName(w.midweek.tesoros.lecturaBiblia.publisherId)}
                      </span>
                    </div>
                  </div>

                  {/* Seamos Mejores Maestros */}
                  <div className="border-l-4 border-amber-500 pl-3 py-1 space-y-2">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Seamos Mejores Maestros
                    </span>
                    {w.midweek.maestros.items.map((item, idx) => {
                      const pubName = getPubName(item.publisherId);
                      const astName = item.assistantId ? getPubName(item.assistantId) : null;

                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-300">{item.title}</span>
                          <span className="font-bold text-white">
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
                  <div className="border-l-4 border-rose-500 pl-3 py-1 space-y-2">
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      Nuestra Vida Cristiana
                    </span>
                    {w.midweek.vidaCristiana.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">{item.title}</span>
                        <span className="font-bold text-white">
                          {getPubName(item.publisherId)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                      <span className="text-slate-300">Estudio Bíblico de Congregación</span>
                      <span className="font-bold text-white">
                        {getPubName(w.midweek.vidaCristiana.estudioBiblico.conductorId)}{' '}
                        <span className="text-slate-400 font-normal">
                          (Lector: {getPubName(w.midweek.vidaCristiana.estudioBiblico.lectorId)})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Weekend Program */
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-2xs text-slate-400 block uppercase font-bold">
                        Presidente
                      </span>
                      <span className="font-bold text-blue-200">
                        {getPubName(w.weekend.presidentId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block uppercase font-bold">
                        Oración Inicial
                      </span>
                      <span className="font-semibold text-slate-200">
                        {getPubName(w.weekend.initialPrayerId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-2xs text-slate-400 block uppercase font-bold">
                        Oración Final
                      </span>
                      <span className="font-semibold text-slate-200">
                        {getPubName(w.weekend.finalPrayerId)}
                      </span>
                    </div>
                  </div>

                  {/* Public Talk */}
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                      Discurso Público
                    </span>
                    <h4 className="text-base font-extrabold text-white">
                      #{w.weekend.publicTalkOutlineNumber || ''}{' '}
                      {w.weekend.publicTalkTheme || 'Tema pendiente'}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-slate-400">Orador:</span>
                      <span className="font-bold text-amber-300">
                        {w.weekend.publicTalkSpeaker || 'Pendiente'}
                      </span>
                      {w.weekend.visitingSpeakerCongregation && (
                        <span className="text-slate-400">
                          ({w.weekend.visitingSpeakerCongregation})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Watchtower Study */}
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      Estudio de La Atalaya
                    </span>
                    <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                      <div>
                        <span className="text-slate-400 block">Conductor:</span>
                        <span className="font-bold text-white text-sm">
                          {getPubName(w.weekend.atalayaConductorId)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lector:</span>
                        <span className="font-bold text-white text-sm">
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
          <div className="space-y-4">
            {/* Duties on Guard */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Deberes y Asistencia Técnica</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-indigo-400" /> Audio y Video:
                  </span>
                  <span className="font-bold text-white">
                    {(() => {
                      const audioPubs = (currentDuties['deber_audio'] || []).map(id => publishersMap.get(id)?.name).filter(Boolean);
                      const videoPubs = (currentDuties['deber_video'] || []).map(id => publishersMap.get(id)?.name).filter(Boolean);
                      const combined = Array.from(new Set([...audioPubs, ...videoPubs]));
                      return combined.length > 0 ? combined.join(', ') : '---';
                    })()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" /> Micrófonos:
                  </span>
                  <span className="font-bold text-white">
                    {getDutyPublishers('deber_microfonos')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400" /> Plataforma:
                  </span>
                  <span className="font-bold text-white">
                    {getDutyPublishers('deber_plataforma')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Acomodadores:
                  </span>
                  <span className="font-bold text-white">
                    {getDutyPublishers('deber_acomodador')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-rose-400" /> Seguridad:
                  </span>
                  <span className="font-bold text-white">
                    {getDutyPublishers('deber_seguridad')}
                  </span>
                </div>
              </div>
            </div>

            {/* Cleaning Group */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-2">
              <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Brush className="w-4 h-4 text-emerald-400" />
                <span>Limpieza del Salón del Reino</span>
              </h3>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">Grupo asignado esta semana:</span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-sm border border-emerald-500/30">
                  {cleaningGroup ? `Grupo #${cleaningGroup.number}` : `Grupo #${cleaningGroupNumber}`}
                </span>
              </div>
              {cleaningGroup?.name && (
                <p className="text-xs text-slate-400 italic">"{cleaningGroup.name}"</p>
              )}
            </div>

            {/* Field Service Next Meetings */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
              <h3 className="text-base font-bold text-blue-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Compass className="w-4 h-4 text-blue-400" />
                <span>Salidas de Predicación</span>
              </h3>

              <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                {fieldServiceMeetings.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {f.dayOfWeek} {f.time}
                      </span>
                      <span className="text-2xs text-slate-400">{f.location}</span>
                    </div>
                    {f.conductorId && (
                      <span className="text-2xs font-semibold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md">
                        {publishersMap.get(f.conductorId)?.name || 'Conductor'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Congregation Notices & Announcements */}
            {notices.length > 0 && (
              <div className="bg-slate-900 rounded-2xl border border-indigo-900/50 p-4 shadow-xl space-y-2.5">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>Anuncios de la Congregación</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-800">
                    Oficial
                  </span>
                </h3>
                <div className="space-y-2 text-xs max-h-44 overflow-y-auto">
                  {notices.slice(0, 3).map((notice) => (
                    <div
                      key={notice.id}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1"
                    >
                      <span className="font-bold text-white block line-clamp-1">
                        {notice.title}
                      </span>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
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
