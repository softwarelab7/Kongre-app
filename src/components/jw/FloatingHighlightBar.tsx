import React from 'react';
import { HighlightColor } from '../../types/jwDesignSystem';
import { Eraser, FileText } from 'lucide-react';

interface FloatingHighlightBarProps {
  currentColor?: HighlightColor;
  onApplyHighlight: (color: HighlightColor) => void;
  onClearHighlight: () => void;
  onOpenQuickNote: () => void;
}

const HIGHLIGHT_OPTIONS: { id: HighlightColor; name: string; bgClass: string; hex: string }[] = [
  { id: 'yellow', name: 'Amarillo', bgClass: 'bg-amber-400 hover:ring-amber-300', hex: '#EAB308' },
  { id: 'emerald', name: 'Verde', bgClass: 'bg-emerald-500 hover:ring-emerald-300', hex: '#10B981' },
  { id: 'blue', name: 'Azul', bgClass: 'bg-blue-500 hover:ring-blue-300', hex: '#3B82F6' },
  { id: 'rose', name: 'Rosa', bgClass: 'bg-pink-500 hover:ring-pink-300', hex: '#EC4899' },
  { id: 'violet', name: 'Violeta', bgClass: 'bg-purple-500 hover:ring-purple-300', hex: '#8B5CF6' },
];

export const FloatingHighlightBar: React.FC<FloatingHighlightBarProps> = ({
  currentColor,
  onApplyHighlight,
  onClearHighlight,
  onOpenQuickNote,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Barra de subrayado y anotaciones"
      className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-zinc-900/95 dark:bg-[#121216]/95 text-white shadow-xl border border-zinc-700/80 dark:border-[#27272A] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-30 select-none"
    >
      {/* 5 Color Circles */}
      <div className="flex items-center gap-1 px-1 border-r border-zinc-700 dark:border-zinc-800 pr-1.5">
        {HIGHLIGHT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onApplyHighlight(opt.id)}
            title={`Subrayar ${opt.name}`}
            className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${opt.bgClass} ${
              currentColor === opt.id ? 'ring-2 ring-white scale-110 shadow-xs' : 'hover:scale-110 opacity-90 hover:opacity-100'
            }`}
          />
        ))}
      </div>

      {/* Clear format button */}
      <button
        type="button"
        onClick={onClearHighlight}
        title="Quitar subrayado"
        className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 dark:hover:bg-zinc-800 transition cursor-pointer"
      >
        <Eraser className="w-3.5 h-3.5" />
      </button>

      {/* Add Quick Note button */}
      <button
        type="button"
        onClick={onOpenQuickNote}
        title="Agregar nota vinculada"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-indigo-300 hover:text-white hover:bg-indigo-600/40 transition cursor-pointer"
      >
        <FileText className="w-3 h-3" />
        <span>Nota</span>
      </button>
    </div>
  );
};
