// src/components/electrical/BreakerCard.tsx
import React from 'react';
import { Breaker } from '../../types';
import {
  Lightbulb,
  Sun,
  Tv,
  Mic,
  Speaker,
  AlertTriangle,
  Fan,
  Wind,
  Wifi,
  Droplet,
  Bell,
  BookOpen,
  Archive,
  RectangleHorizontal,
  Wrench,
  Camera,
  Zap,
  BellRing,
  BatteryFull,
  KeyRound,
  ShieldAlert,
  Gauge,
  SquareParking,
  Plug,
  Power,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
} from 'lucide-react';

interface BreakerCardProps {
  breaker: Breaker;
  isReadOnly: boolean;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onToggle: (id: string) => void;
  onEdit: (breaker: Breaker) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onDragStart: (e: React.DragEvent, breaker: Breaker) => void;
  onDragEnd: () => void;
}

export const BreakerCard: React.FC<BreakerCardProps> = ({
  breaker,
  isReadOnly,
  index,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
}) => {
  const getStatusColor = (status: Breaker['status']) => {
    switch (status) {
      case 'on':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'off':
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
      case 'always':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'event':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500 shadow-blue-500/50';
      case 'sky':
        return 'bg-sky-500 shadow-sky-500/50';
      case 'cyan':
        return 'bg-cyan-500 shadow-cyan-500/50';
      case 'teal':
        return 'bg-teal-500 shadow-teal-500/50';
      case 'emerald':
        return 'bg-emerald-500 shadow-emerald-500/50';
      case 'green':
        return 'bg-green-500 shadow-green-500/50';
      case 'lime':
        return 'bg-lime-500 shadow-lime-500/50';
      case 'yellow':
        return 'bg-yellow-500 shadow-yellow-500/50';
      case 'amber':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'orange':
        return 'bg-orange-500 shadow-orange-500/50';
      case 'red':
        return 'bg-red-500 shadow-red-500/50';
      case 'rose':
        return 'bg-rose-500 shadow-rose-500/50';
      case 'pink':
        return 'bg-pink-500 shadow-pink-500/50';
      case 'fuchsia':
        return 'bg-fuchsia-500 shadow-fuchsia-500/50';
      case 'purple':
        return 'bg-purple-500 shadow-purple-500/50';
      case 'violet':
        return 'bg-violet-500 shadow-violet-500/50';
      case 'indigo':
        return 'bg-indigo-500 shadow-indigo-500/50';
      case 'slate':
        return 'bg-slate-500 shadow-slate-500/50';
      default:
        return 'bg-blue-500 shadow-blue-500/50';
    }
  };

  const renderIcon = () => {
    const props = { size: 20, className: 'shrink-0' };
    switch (breaker.icon) {
      case 'lightbulb':
        return <Lightbulb {...props} />;
      case 'sun':
        return <Sun {...props} />;
      case 'tv':
        return <Tv {...props} />;
      case 'mic':
        return <Mic {...props} />;
      case 'speaker':
        return <Speaker {...props} />;
      case 'alert':
        return <AlertTriangle {...props} />;
      case 'fan':
        return <Fan {...props} />;
      case 'wind':
        return <Wind {...props} />;
      case 'wifi':
        return <Wifi {...props} />;
      case 'pump':
        return <Droplet {...props} />;
      case 'bell':
        return <Bell {...props} />;
      case 'books':
        return <BookOpen {...props} />;
      case 'archive':
        return <Archive {...props} />;
      case 'sign':
        return <RectangleHorizontal {...props} />;
      case 'wrench':
        return <Wrench {...props} />;
      case 'camera':
        return <Camera {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'siren':
        return <BellRing {...props} />;
      case 'battery':
        return <BatteryFull {...props} />;
      case 'door':
        return <ShieldAlert {...props} />;
      case 'lock':
        return <KeyRound {...props} />;
      case 'thermometer':
        return <Gauge {...props} />;
      case 'parking':
        return <SquareParking {...props} />;
      case 'plug':
      case 'outlet':
      default:
        return <Plug {...props} />;
    }
  };

  const statusColor = getStatusColor(breaker.status);
  const isOff = breaker.status === 'off';
  const isLocked = breaker.status === 'always';

  return (
    <div
      draggable={!isReadOnly}
      onDragStart={(e) => onDragStart(e, breaker)}
      onDragEnd={onDragEnd}
      className={`relative flex flex-col sm:flex-row items-stretch justify-between rounded-2xl border transition-all duration-200 overflow-hidden group select-none ${
        isOff
          ? 'bg-zinc-100/70 dark:bg-[#121926]/70 border-zinc-200 dark:border-white/[0.04] opacity-75'
          : 'bg-white dark:bg-[#162032] border-zinc-200/90 dark:border-white/[0.08] shadow-sm hover:shadow-md dark:shadow-black/20'
      } ${
        !isReadOnly
          ? 'cursor-grab active:cursor-grabbing hover:border-indigo-400 dark:hover:border-indigo-500/50'
          : 'cursor-default'
      }`}
    >
      {/* Category Color Accent Strip */}
      <div className={`w-full sm:w-1.5 h-1.5 sm:h-auto shrink-0 ${getColorClass(breaker.color)}`} />

      {/* Main Content Info */}
      <div className="flex flex-1 items-start sm:items-center p-3.5 sm:p-4 gap-3.5 min-w-0">
        {/* Circuit Position Number & Icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-6 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500 font-mono">
            {index + 1}
          </span>
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-xl border ${statusColor} transition-all duration-300 shadow-sm`}
          >
            {renderIcon()}
          </div>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`font-bold text-[14px] sm:text-[15px] truncate leading-tight ${
                isOff
                  ? 'text-zinc-600 dark:text-zinc-400 line-through decoration-zinc-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {breaker.name}
            </h4>

            {breaker.amperage && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08]">
                {breaker.amperage}A
              </span>
            )}
          </div>

          {breaker.descripcion ? (
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 leading-snug">
              {breaker.descripcion}
            </p>
          ) : (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic mt-0.5">
              Circuito estándar del Salón
            </p>
          )}
        </div>
      </div>

      {/* Right Controls & Status Pill */}
      <div className="flex items-center justify-between sm:justify-end gap-3 px-4 py-2.5 sm:py-3 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01] shrink-0 sm:min-w-[200px]">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          {breaker.status === 'always' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Siempre ON
            </span>
          )}
          {breaker.status === 'event' && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20"
              title="Activo durante reuniones de congregación"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Reunión: ON
            </span>
          )}
          {breaker.status === 'on' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Normal ON
            </span>
          )}
          {breaker.status === 'off' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-zinc-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Apagado
            </span>
          )}
        </div>

        {/* Quick Power Toggle Button */}
        <button
          type="button"
          disabled={isLocked}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(breaker.id);
          }}
          title={
            isLocked
              ? 'Circuito crítico siempre conectado (no conmutable)'
              : isOff
              ? 'Encender circuito'
              : 'Desconectar circuito'
          }
          className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
            isLocked
              ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] text-zinc-400'
              : isOff
              ? 'bg-zinc-200/70 hover:bg-emerald-500 hover:text-white border-zinc-300 dark:bg-white/[0.05] dark:border-white/[0.1] text-zinc-500 hover:border-emerald-500'
              : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
          }`}
        >
          <Power size={15} />
        </button>

        {/* Reordering & Edit Controls */}
        {!isReadOnly && (
          <div className="flex items-center gap-1">
            {/* Reorder Buttons */}
            {onMoveUp && (
              <button
                type="button"
                disabled={isFirst}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(breaker.id);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                title="Subir de posición"
              >
                <ChevronUp size={15} />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                disabled={isLast}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(breaker.id);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                title="Bajar de posición"
              >
                <ChevronDown size={15} />
              </button>
            )}

            {/* Edit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(breaker);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              title="Editar circuito"
            >
              <Edit2 size={14} />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(breaker.id);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              title="Eliminar breaker"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
