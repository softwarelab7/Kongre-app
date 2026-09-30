// src/components/MeetingTimerModal.tsx
import React, { useState, useEffect } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { X, Play, Pause, RotateCcw, Clock, Volume2, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';

interface MeetingTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingTimerModal: React.FC<MeetingTimerModalProps> = ({ isOpen, onClose }) => {
  const { currentWeek, publishersMap } = useCongregation();

  const [activeMeetingType, setActiveMeetingType] = useState<'midweek' | 'weekend'>('midweek');
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

  // Keep live time updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Assemble meeting parts list
  const parts = React.useMemo(() => {
    if (!currentWeek) return [];
    const list: Array<{ title: string; speaker: string; defaultMinutes: number }> = [];

    if (activeMeetingType === 'midweek') {
      const getPub = (id?: string) => (id ? publishersMap.get(id)?.name || 'Sin asignar' : 'Sin asignar');

      list.push({
        title: 'Palabras de introducción (Presidente)',
        speaker: getPub(currentWeek.midweek.presidentId),
        defaultMinutes: 3,
      });

      list.push({
        title: currentWeek.midweek.tesoros.discurso.title,
        speaker: getPub(currentWeek.midweek.tesoros.discurso.publisherId),
        defaultMinutes: 10,
      });

      list.push({
        title: currentWeek.midweek.tesoros.perlas.title,
        speaker: getPub(currentWeek.midweek.tesoros.perlas.publisherId),
        defaultMinutes: 10,
      });

      list.push({
        title: currentWeek.midweek.tesoros.lecturaBiblia.title,
        speaker: getPub(currentWeek.midweek.tesoros.lecturaBiblia.publisherId),
        defaultMinutes: 4,
      });

      currentWeek.midweek.maestros.items.forEach(m => {
        list.push({
          title: `Maestros: ${m.title}`,
          speaker: `${getPub(m.publisherId)} ${m.assistantId ? `(con ${getPub(m.assistantId)})` : ''}`,
          defaultMinutes: m.timeMinutes || 4,
        });
      });

      currentWeek.midweek.vidaCristiana.items.forEach(v => {
        list.push({
          title: `Vida Cristiana: ${v.title}`,
          speaker: getPub(v.publisherId),
          defaultMinutes: v.timeMinutes || 15,
        });
      });

      list.push({
        title: 'Estudio Bíblico de Congregación',
        speaker: `Cond: ${getPub(currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId)} | Lect: ${getPub(currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId)}`,
        defaultMinutes: 30,
      });
    } else {
      const getPub = (id?: string) => (id ? publishersMap.get(id)?.name || 'Sin asignar' : 'Sin asignar');

      list.push({
        title: 'Discurso Público',
        speaker: currentWeek.weekend.publicTalkSpeaker || 'Orador invitado',
        defaultMinutes: 30,
      });

      list.push({
        title: 'Estudio de La Atalaya',
        speaker: `Cond: ${getPub(currentWeek.weekend.atalayaConductorId)} | Lect: ${getPub(currentWeek.weekend.atalayaLectorId)}`,
        defaultMinutes: 60,
      });
    }

    return list;
  }, [currentWeek, activeMeetingType, publishersMap]);

  // Sync timer when part changes
  useEffect(() => {
    if (parts[selectedPartIndex]) {
      setSecondsLeft(parts[selectedPartIndex].defaultMinutes * 60);
      setIsRunning(false);
    }
  }, [selectedPartIndex, parts]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= -600) return prev; // Limit overtime to -10 min
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isOpen) return null;

  const currentPart = parts[selectedPartIndex];

  // Formatting mm:ss
  const isOvertime = secondsLeft < 0;
  const absSeconds = Math.abs(secondsLeft);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  const displayTimer = `${isOvertime ? '+' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const isWarning = secondsLeft <= 60 && secondsLeft > 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md ${
      isFullscreen ? 'p-0' : ''
    }`}>
      <div className={`bg-slate-900 rounded-3xl w-full flex flex-col shadow-2xl border border-slate-800 text-white transition-all ${
        isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-4xl max-h-[92vh]'
      }`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Modo Atril y Cronómetro de Presidencia</h3>
              <p className="text-xs text-slate-400">Control de tiempos en vivo para la reunión</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-slate-800 rounded-xl text-xs font-mono text-slate-300">
              🕒 Hora actual: <strong>{currentTime}</strong>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Pantalla completa"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meeting Type Selector */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveMeetingType('midweek');
                setSelectedPartIndex(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeMeetingType === 'midweek' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Entre Semana (Vida y Ministerio)
            </button>
            <button
              onClick={() => {
                setActiveMeetingType('weekend');
                setSelectedPartIndex(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeMeetingType === 'weekend' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fin de Semana
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Parte {selectedPartIndex + 1} de {parts.length}
          </span>
        </div>

        {/* Main interactive area: Big Timer & Parts list */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Timer Display (2 cols) */}
          <div className="md:col-span-2 flex flex-col items-center justify-center space-y-6 p-6 rounded-3xl bg-slate-950/40 border border-slate-800">
            {/* Current speaker and part title */}
            <div className="text-center space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800">
                Parte en curso
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                {currentPart?.title}
              </h2>
              <p className="text-sm font-semibold text-slate-300">
                👤 {currentPart?.speaker}
              </p>
            </div>

            {/* Huge Timer Screen */}
            <div
              className={`font-mono font-black text-5xl sm:text-7xl md:text-8xl tracking-tight px-4 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl transition-all shadow-inner text-center max-w-full truncate ${
                isOvertime
                  ? 'bg-rose-950/70 text-rose-400 border-2 border-rose-500 animate-pulse'
                  : isWarning
                  ? 'bg-amber-950/70 text-amber-400 border-2 border-amber-500'
                  : 'bg-slate-900 text-emerald-400 border border-slate-800'
              }`}
            >
              {displayTimer}
            </div>

            {isOvertime && (
              <span className="text-xs font-extrabold text-rose-400 uppercase tracking-widest bg-rose-950 px-3 py-1 rounded-full border border-rose-800">
                ⚠️ Tiempo cumplido
              </span>
            )}

            {/* Controls buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-3.5 rounded-2xl text-sm font-extrabold shadow-lg transition-all flex items-center gap-2 ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  if (currentPart) setSecondsLeft(currentPart.defaultMinutes * 60);
                }}
                className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-all flex items-center gap-2"
                title="Reiniciar tiempo"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar</span>
              </button>

              <button
                onClick={() => setSecondsLeft(s => s + 60)}
                className="px-3.5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                +1 min
              </button>

              <button
                onClick={() => setSecondsLeft(s => s - 60)}
                className="px-3.5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                -1 min
              </button>
            </div>
          </div>

          {/* Parts list (1 col) */}
          <div className="space-y-2 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Programa de la reunión:
            </span>

            <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
              {parts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPartIndex(i)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all text-xs ${
                    selectedPartIndex === i
                      ? 'border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500'
                      : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate">{p.title}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1 shrink-0">{p.defaultMinutes} min</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.speaker}</p>
                </button>
              ))}
            </div>

            {/* Quick next part trigger */}
            <div className="pt-2">
              <button
                disabled={selectedPartIndex >= parts.length - 1}
                onClick={() => setSelectedPartIndex(idx => Math.min(parts.length - 1, idx + 1))}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-30 transition-all"
              >
                Siguiente Parte &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
