import React, { useState, useEffect } from 'react';
import { X, BookOpen, FileText, Tag, Check, Sparkles } from 'lucide-react';
import { ReferenceItem, UserAnnotation, HighlightColor } from '../../types/jwDesignSystem';

interface StudyInspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeReference?: ReferenceItem | null;
  references?: ReferenceItem[];
  activeAnnotation?: UserAnnotation | null;
  onSaveAnnotation?: (annotation: UserAnnotation) => void;
}

const HIGHLIGHT_DOTS: { id: HighlightColor; name: string; bg: string }[] = [
  { id: 'yellow', name: 'Amarillo', bg: 'bg-[#EAB308]' },
  { id: 'emerald', name: 'Verde', bg: 'bg-[#10B981]' },
  { id: 'blue', name: 'Azul', bg: 'bg-[#3B82F6]' },
  { id: 'rose', name: 'Rosa', bg: 'bg-[#EC4899]' },
  { id: 'violet', name: 'Violeta', bg: 'bg-[#8B5CF6]' },
];

export const StudyInspectorPanel: React.FC<StudyInspectorPanelProps> = ({
  isOpen,
  onClose,
  activeReference,
  references = [],
  activeAnnotation,
  onSaveAnnotation,
}) => {
  const [activeTab, setActiveTab] = useState<'refs' | 'notes'>('refs');
  const [noteText, setNoteText] = useState(activeAnnotation?.noteText || '');
  const [highlightColor, setHighlightColor] = useState<HighlightColor | undefined>(
    activeAnnotation?.highlightColor
  );
  const [tags, setTags] = useState<string[]>(activeAnnotation?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync annotation state when selected block/annotation changes
  useEffect(() => {
    setNoteText(activeAnnotation?.noteText || '');
    setHighlightColor(activeAnnotation?.highlightColor);
    setTags(activeAnnotation?.tags || []);
  }, [activeAnnotation]);

  // When activeReference changes, switch to 'refs' tab
  useEffect(() => {
    if (activeReference) {
      setActiveTab('refs');
    }
  }, [activeReference]);

  // Auto-save debounced note
  useEffect(() => {
    if (!onSaveAnnotation || !activeAnnotation) return;
    const timer = setTimeout(() => {
      onSaveAnnotation({
        ...activeAnnotation,
        noteText,
        highlightColor,
        tags,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus('Guardado');
      const clearTimer = setTimeout(() => setSaveStatus(null), 2000);
      return () => clearTimeout(clearTimer);
    }, 600);

    return () => clearTimeout(timer);
  }, [noteText, highlightColor, tags, activeAnnotation, onSaveAnnotation]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const clean = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <aside
      aria-label="Panel de Estudio e Inspector"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[360px] md:w-[380px] bg-white dark:bg-[#121216] border-l border-zinc-200 dark:border-[#27272A] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100 dark:border-[#27272A]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
            Panel de Estudio
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          title="Cerrar panel de estudio"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Selector: [Referencias] [Notas] */}
      <div className="flex items-center p-2 border-b border-zinc-100 dark:border-[#27272A] bg-zinc-50 dark:bg-[#09090B]">
        <button
          type="button"
          onClick={() => setActiveTab('refs')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'refs'
              ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-2xs border border-zinc-200/80 dark:border-[#27272A]'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Referencias {references.length > 0 ? `(${references.length})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-2xs border border-zinc-200/80 dark:border-[#27272A]'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notas Personales</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {activeTab === 'refs' ? (
          /* TAB 1: REFERENCIAS CRUZADAS */
          <div className="space-y-3">
            {activeReference ? (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-[#18181F] border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-indigo-600 text-white">
                    {activeReference.code}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Referencia activa
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {activeReference.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-serif">
                  «{activeReference.extract}»
                </p>
              </div>
            ) : null}

            {references.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Todas las Referencias del Documento
                </h4>
                {references.map((ref) => {
                  const isCurrent = activeReference?.id === ref.id;
                  return (
                    <div
                      key={ref.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                          : 'border-zinc-200/80 dark:border-[#27272A] bg-white dark:bg-[#18181F]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {ref.code}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {ref.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {ref.extract}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              !activeReference && (
                <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Toca un token de referencia [Ref] dentro del texto para inspeccionar su contenido aquí.</p>
                </div>
              )
            )}
          </div>
        ) : (
          /* TAB 2: NOTAS Y SUBRAYADOS VINCULADOS */
          <div className="space-y-4">
            {/* Color Marker Selector */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Color de Marcador
              </label>
              <div className="flex items-center gap-2">
                {HIGHLIGHT_DOTS.map((dot) => (
                  <button
                    key={dot.id}
                    type="button"
                    onClick={() => setHighlightColor(highlightColor === dot.id ? undefined : dot.id)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${dot.bg} flex items-center justify-center ${
                      highlightColor === dot.id ? 'ring-2 ring-indigo-500 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={dot.name}
                  >
                    {highlightColor === dot.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Textarea with AutoSave */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Nota Vinculada
                </label>
                {saveStatus && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    {saveStatus}
                  </span>
                )}
              </div>
              <textarea
                rows={6}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Escribe tus notas personales, observaciones para la reunión o comentarios teocráticos..."
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F] text-zinc-900 dark:text-zinc-100 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden transition"
              />
            </div>

            {/* Tags Pills [#Tag1] [#Tag2] */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Etiquetas (#Tags)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Escribe una etiqueta y presiona Enter..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
