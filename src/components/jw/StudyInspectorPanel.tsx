import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  Tag,
  Check,
  Plus,
  Trash2,
  Copy,
  Download,
  Search,
  ChevronLeft,
  Pin,
  Clock,
  Sparkles,
  Calendar,
  CheckSquare,
  ListPlus,
  Quote,
  ChevronDown,
} from 'lucide-react';
import { ReferenceItem, UserAnnotation, HighlightColor } from '../../types/jwDesignSystem';
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../context/ToastContext';

export interface StudyInspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeReference?: ReferenceItem | null;
  references?: ReferenceItem[];
  activeAnnotation?: UserAnnotation | null;
  onSaveAnnotation?: (annotation: UserAnnotation) => void;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  color?: HighlightColor;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
}

const STORAGE_KEY = 'kongre_study_notes_list_v2';

const COLOR_OPTIONS: { id: HighlightColor; name: string; bg: string; dot: string; text: string }[] = [
  { id: 'yellow', name: 'Amarillo', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700', dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  { id: 'emerald', name: 'Verde', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { id: 'blue', name: 'Azul', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  { id: 'violet', name: 'Violeta', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
];

interface NoteTemplate {
  id: string;
  label: string;
  title: string;
  tag: string;
  color: HighlightColor;
  template: string;
}

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'vmc',
    label: 'Reunión Entre Semana',
    title: 'Reunión Vida y Ministerio Cristianos',
    tag: 'reunion',
    color: 'emerald',
    template: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n🏛️ TESOROS DE LA BIBLIA:\n• Lectura de la semana: \n• Puntos clave del discurso: \n• Perlas escondidas: \n\n🎯 SEAMOS MEJORES MAESTROS:\n• Asignación / Presentación: \n\n✝️ NUESTRA VIDA CRISTIANA:\n• Estudio Bíblico de la Congregación: \n• Ideas para aplicar: `,
  },
  {
    id: 'atalaya',
    label: 'Fin de Semana / La Atalaya',
    title: 'Discurso Público y Estudio de La Atalaya',
    tag: 'atalaya',
    color: 'yellow',
    template: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n🎤 DISCURSO PÚBLICO:\n• Título: \n• Orador: \n• Puntos principales: \n\n📖 ESTUDIO DE LA ATALAYA:\n• Artículo: \n• Puntos destacados y comentarios: \n• Meditación personal: `,
  },
  {
    id: 'predicacion',
    label: 'Ministerio / Predicación',
    title: 'Notas para la Predicación',
    tag: 'predicacion',
    color: 'blue',
    template: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n📍 Territorio: \n💬 Ideas para iniciar conversaciones: \n\n📝 Revisitas / Personas interesadas:\n• Nombre: \n  Tema tratado: \n  Próxima pregunta pendiente: `,
  },
  {
    id: 'personal',
    label: 'Estudio Personal',
    title: 'Estudio Personal y Meditación',
    tag: 'personal',
    color: 'violet',
    template: `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n📖 Texto o tema investigado: \n\n💡 ¿Qué aprendo sobre Jehová?: \n\n🌱 ¿Cómo puedo aplicarlo en mi vida?: `,
  },
];

function loadSavedNotes(): StudyNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  const initialNote: StudyNote = {
    id: 'nota_bienvenida_1',
    title: 'Mis Notas de Estudio',
    content:
      'Bienvenido a tu bloc personal de notas de estudio teocrático.\n\n' +
      '• Toma apuntes en vivo de la reunión Entre Semana (VMC) y Fin de Semana (Discurso Público y La Atalaya).\n' +
      '• Prepara comentarios, meditación sobre lecturas bíblicas e ideas para la predicación.\n' +
      '• Usa colores, etiquetas (#reunion, #personal, etc.) y plantillas teocráticas para clasificar tus apuntes.\n\n' +
      'Tus notas se guardan de forma segura y automática en este dispositivo.',
    color: 'emerald',
    tags: ['reunion', 'personal'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPinned: true,
  };
  return [initialNote];
}

function saveNotesToStorage(notes: StudyNote[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

export const StudyInspectorPanel: React.FC<StudyInspectorPanelProps> = ({
  isOpen,
  onClose,
  activeReference,
  activeAnnotation,
  onSaveAnnotation,
}) => {
  const { confirm } = useModal();
  const { showToast } = useToast();
  const [notes, setNotes] = useState<StudyNote[]>(() => loadSavedNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(() => notes[0]?.id || '');
  const [activeView, setActiveView] = useState<'editor' | 'list'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templatesMenuRef = useRef<HTMLDivElement>(null);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Persist notes list whenever updated
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Close templates dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templatesMenuRef.current && !templatesMenuRef.current.contains(e.target as Node)) {
        setShowTemplatesMenu(false);
      }
    };
    if (showTemplatesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplatesMenu]);

  // Handle activeReference incoming: create or switch to note
  useEffect(() => {
    if (!activeReference) return;
    const refTitle = `${activeReference.code}: ${activeReference.title}`;
    const existing = notes.find((n) => n.title.toLowerCase().includes(activeReference.code.toLowerCase()));
    if (existing) {
      setActiveNoteId(existing.id);
      setActiveView('editor');
    } else {
      const newRefNote: StudyNote = {
        id: `ref_note_${Date.now()}`,
        title: refTitle,
        content: `«${activeReference.extract}»\n\nMis apuntes: `,
        color: 'blue',
        tags: ['referencia'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [newRefNote, ...prev]);
      setActiveNoteId(newRefNote.id);
      setActiveView('editor');
    }
  }, [activeReference]);

  // Handle activeAnnotation incoming: switch or create note
  useEffect(() => {
    if (!activeAnnotation) return;
    const targetId = activeAnnotation.blockId || activeAnnotation.id;
    const existing = notes.find((n) => n.id === targetId);
    if (existing) {
      setActiveNoteId(existing.id);
      setActiveView('editor');
    } else {
      const newAnnNote: StudyNote = {
        id: targetId,
        title: activeAnnotation.noteText?.slice(0, 40) || 'Nota de asignación',
        content: activeAnnotation.noteText || '',
        color: activeAnnotation.highlightColor || 'yellow',
        tags: activeAnnotation.tags || ['asignacion'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [newAnnNote, ...prev]);
      setActiveNoteId(newAnnNote.id);
      setActiveView('editor');
    }
  }, [activeAnnotation]);

  // Quick create a new empty note
  const handleCreateNewNote = () => {
    const newNote: StudyNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: 'Nota sin título',
      content: '',
      color: 'yellow',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActiveView('editor');
    setShowTemplatesMenu(false);
    setSaveStatus('Nueva nota creada');
    setTimeout(() => setSaveStatus(null), 1800);
  };

  // Create note from template
  const handleCreateFromTemplate = (tpl: NoteTemplate) => {
    const newNote: StudyNote = {
      id: `note_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: tpl.title,
      content: tpl.template,
      color: tpl.color,
      tags: [tpl.tag],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActiveView('editor');
    setShowTemplatesMenu(false);
    setSaveStatus(`Creada con plantilla: ${tpl.label}`);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Update field of current active note
  const handleUpdateActiveNote = (updates: Partial<StudyNote>) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNote.id) {
          const updated = {
            ...n,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          if (onSaveAnnotation) {
            onSaveAnnotation({
              id: updated.id,
              blockId: updated.id,
              noteText: updated.content,
              highlightColor: updated.color,
              tags: updated.tags,
              updatedAt: updated.updatedAt,
            });
          }
          return updated;
        }
        return n;
      })
    );
    setSaveStatus('Guardado');
    setTimeout(() => setSaveStatus(null), 1400);
  };

  // Insert snippet in textarea at cursor position
  const handleInsertSnippet = (snippet: string) => {
    if (!activeNote) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      handleUpdateActiveNote({ content: (activeNote.content || '') + snippet });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeNote.content || '';
    const updated = current.substring(0, start) + snippet + current.substring(end);
    handleUpdateActiveNote({ content: updated });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + snippet.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 40);
  };

  // Delete note
  const handleDeleteNote = async (idToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = await confirm({
      title: 'Eliminar nota',
      message: '¿Deseas eliminar esta nota permanentemente?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (confirmed) {
      const remaining = notes.filter((n) => n.id !== idToDelete);
      setNotes(remaining);
      if (activeNoteId === idToDelete) {
        if (remaining.length > 0) {
          setActiveNoteId(remaining[0].id);
        } else {
          setActiveView('list');
        }
      }
      showToast('Nota eliminada permanentemente', 'info');
    }
  };

  // Toggle pin
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  // Tag helpers
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim() && activeNote) {
      e.preventDefault();
      const clean = newTagInput.trim().replace(/^#/, '');
      if (!activeNote.tags.includes(clean)) {
        handleUpdateActiveNote({ tags: [...activeNote.tags, clean] });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    handleUpdateActiveNote({
      tags: activeNote.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Copy note to clipboard
  const handleCopyNote = async () => {
    if (!activeNote) return;
    const textToCopy = `${activeNote.title}\n\n${activeNote.content}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {}
  };

  // Export note as text file
  const handleExportTxt = () => {
    if (!activeNote) return;
    const blob = new Blob([`${activeNote.title}\n\n${activeNote.content}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'nota'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // All unique tags across all notes
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Filtered notes for list view
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (selectedTagFilter && !n.tags.includes(selectedTagFilter)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTag = n.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchContent || matchTag;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchQuery, selectedTagFilter]);

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Panel de Notas de Estudio"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[380px] md:w-[420px] bg-white dark:bg-[#121216] border-l border-zinc-200 dark:border-[#27272A] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
    >
      {/* =========================================================================
          PANEL HEADER: TITULO, BOTON NUEVA NOTA Y CERRAR
         ========================================================================= */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200/80 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F]/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              Notas de Estudio
            </h2>
            <p className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] truncate">
              {notes.length} {notes.length === 1 ? 'nota guardada' : 'notas guardadas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* New Note & Templates Dropdown */}
          <div className="relative" ref={templatesMenuRef}>
            <div className="inline-flex rounded-lg shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all cursor-pointer"
                title="Crear nueva nota en blanco"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTemplatesMenu((v) => !v)}
                className="px-1.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white transition-all cursor-pointer border-l border-indigo-500"
                title="Plantillas teocráticas de notas"
                aria-label="Abrir plantillas de notas"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Templates Popover */}
            {showTemplatesMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 p-1.5 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Plantillas teocráticas
                </div>
                <div className="space-y-0.5">
                  {NOTE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleCreateFromTemplate(tpl)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{tpl.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-indigo-400 shrink-0">
                        #{tpl.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-[#27272A] transition cursor-pointer"
            title="Cerrar panel de notas"
            aria-label="Cerrar panel de notas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW SWITCHER BAR (Editor vs Lista de notas)
         ========================================================================= */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200/80 dark:border-[#27272A] bg-zinc-100/50 dark:bg-[#09090B]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            disabled={!activeNote}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'editor'
                ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 border border-zinc-200/80 dark:border-[#27272A] shadow-2xs'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Editor
          </button>

          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'list'
                ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 border border-zinc-200/80 dark:border-[#27272A] shadow-2xs'
                : 'text-zinc-500 dark:text-[#A1A1AA] hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Ver Todas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {notes.length}
            </span>
          </button>
        </div>

        {saveStatus && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[130px]">{saveStatus}</span>
          </span>
        )}
      </div>

      {/* =========================================================================
          PANEL BODY: LIST VIEW OR EDITOR VIEW
         ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar flex flex-col min-h-0">
        {activeView === 'list' ? (
          /* =====================================================================
             VISTA 1: LISTA Y BUSCADOR DE NOTAS
             ===================================================================== */
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en mis notas o #etiqueta..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Tag Filter Pills */}
            {allUniqueTags.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter(null)}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer shrink-0 ${
                    selectedTagFilter === null
                      ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                  }`}
                >
                  Todas ({notes.length})
                </button>
                {allUniqueTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer shrink-0 ${
                      selectedTagFilter === tag
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Notes List Cards */}
            <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => {
                  const isCurrent = activeNoteId === note.id;
                  const colorConfig = COLOR_OPTIONS.find((c) => c.id === note.color);
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setActiveNoteId(note.id);
                        setActiveView('editor');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                        isCurrent
                          ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs'
                          : 'border-zinc-200/80 dark:border-[#27272A] bg-zinc-50/60 dark:bg-[#18181F] hover:bg-white dark:hover:bg-[#22222A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {colorConfig && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${colorConfig.dot}`} />
                          )}
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {note.title || 'Nota sin título'}
                          </h4>
                          {note.isPinned && (
                            <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>

                        {/* Quick action: delete & pin */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(note.id, e)}
                            className="p-1 rounded-md text-zinc-400 hover:text-amber-500 transition"
                            title={note.isPinned ? 'Desfijar nota' : 'Fijar nota arriba'}
                          >
                            <Pin className={`w-3 h-3 ${note.isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="p-1 rounded-md text-zinc-400 hover:text-rose-500 transition"
                            title="Eliminar nota"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Snippet */}
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed whitespace-pre-line">
                        {note.content || 'Nota vacía...'}
                      </p>

                      {/* Footer: Date + Tags */}
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {new Date(note.updatedAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </span>
                        {note.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {note.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-[9.5px] font-semibold text-zinc-600 dark:text-zinc-300"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No se encontraron notas con ese criterio.</p>
                  <button
                    type="button"
                    onClick={handleCreateNewNote}
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white cursor-pointer"
                  >
                    Crear nueva nota
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =====================================================================
             VISTA 2: EDITOR COMPLETO DE LA NOTA SELECCIONADA
             ===================================================================== */
          activeNote && (
            <div className="flex-1 flex flex-col space-y-2.5 min-h-0">
              {/* Note Header & Title */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveView('list')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Ver lista de notas</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(activeNote.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        activeNote.isPinned
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                      title={activeNote.isPinned ? 'Desfijar de arriba' : 'Fijar arriba'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${activeNote.isPinned ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Eliminar esta nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  placeholder="Título de la nota..."
                  className="w-full text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 bg-transparent border-0 border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-indigo-500 focus:outline-none transition py-0.5"
                />
              </div>

              {/* Color Marker Selector Row */}
              <div className="flex items-center justify-between gap-2 shrink-0 py-1 border-y border-zinc-100 dark:border-[#27272A]/70">
                <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500">
                  Color
                </span>
                <div className="flex items-center gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleUpdateActiveNote({ color: activeNote.color === c.id ? undefined : c.id })}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${c.dot} flex items-center justify-center ${
                        activeNote.color === c.id
                          ? 'ring-2 ring-indigo-500 dark:ring-white scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {activeNote.color === c.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex flex-wrap gap-1 items-center">
                  {activeNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-500 cursor-pointer ml-0.5 font-normal"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="relative inline-flex items-center">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="+ #etiqueta (Enter)"
                      className="text-[10.5px] py-0.5 px-2 rounded-md border border-dashed border-zinc-300 dark:border-[#27272A] bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Format & Snippet Toolbar */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar shrink-0 text-zinc-500 dark:text-zinc-400">
                <button
                  type="button"
                  onClick={() => handleInsertSnippet(`\n📅 ${new Date().toLocaleDateString('es-ES')}: `)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1 transition cursor-pointer shrink-0"
                  title="Insertar fecha actual"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Fecha</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('\n• ')}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1 transition cursor-pointer shrink-0"
                  title="Insertar viñeta"
                >
                  <ListPlus className="w-3 h-3" />
                  <span>Viñeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('\n[ ] ')}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1 transition cursor-pointer shrink-0"
                  title="Insertar tarea pendiente"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Tarea</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('«»')}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1 transition cursor-pointer shrink-0"
                  title="Insertar comillas de cita bíblica"
                >
                  <Quote className="w-3 h-3" />
                  <span>Cita</span>
                </button>
              </div>

              {/* Note Content Textarea (Fills height) */}
              <div className="flex-1 flex flex-col min-h-[220px]">
                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                  placeholder="Escribe tus apuntes de la reunión, puntos para meditar, metas teocráticas o notas personales..."
                  className="w-full flex-1 p-3 rounded-2xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F] text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#121216] focus:outline-none transition resize-none font-sans"
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200/80 dark:border-[#27272A] shrink-0 text-xs">
                <span className="text-[10.5px] font-mono tabular-nums text-zinc-400">
                  {activeNote.content ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0} palabras · {activeNote.content.length} caracteres
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                    title="Copiar texto de la nota al portapapeles"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedToast ? '¡Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#22222A] text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                    title="Descargar nota en formato .txt"
                  >
                    <Download className="w-3 h-3" />
                    <span>Exportar</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </aside>
  );
};
