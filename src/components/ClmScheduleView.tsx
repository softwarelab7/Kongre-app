// components/ClmScheduleView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Publisher, ClmPrograma, ClmParte } from '../types';
import { autoAsignarLocal } from '../utils/clmAutoAssignLocal';
import { generateS89Pdf } from '../utils/pdfFillers';
import { Select } from './Select';
import { SectionHeader } from './SectionHeader';
import { getOrganizedScheduleForWeek } from '../utils/organizedSync';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  CheckCircle2,
  CalendarDays,
  FileText,
  DoorOpen,
  RefreshCw,
  SlidersHorizontal,
  BookmarkCheck,
  Check,
  X,
} from 'lucide-react';

// Paleta oficial de colores por sección
export const SECTION_COLORS: Record<string, string> = {
  tesoros: 'rgb(42, 107, 119)', // Verde azulado
  maestros: '#9b6d17', // Ocre dorado
  vida_cristiana: '#942926', // Rojo teocrático
  marco: '#8b5cf6', // Púrpura
};

export const SECTION_LABELS: Record<string, string> = {
  tesoros: 'Tesoros de la Biblia',
  maestros: 'Seamos Mejores Maestros',
  vida_cristiana: 'Nuestra Vida Cristiana',
  marco: 'Marco de la Reunión',
};

// ── Validación de Elegibilidad Teocrática ──
export function isPublisherEligibleForPart(
  p: Publisher,
  part: ClmParte,
  type: 'main' | 'assistant'
): boolean {
  // Soporte universal para modelo Publisher Kongre y modelo CLM
  const isActive = p.status ? p.status === 'active' : p.active !== false;
  if (!isActive) return false;

  const isMale = p.gender === 'male' || p.gender === 'hermano';
  const role =
    p.role ||
    (p.privilege === 'anciano'
      ? 'elder'
      : p.privilege === 'siervo_ministerial'
      ? 'servant'
      : 'publisher');

  // Mapeo seguro de asignaciones y privilegios
  const assignments = p.assignments || {
    chairman: p.roles?.vym_presidente,
    prayers: p.roles?.vym_oracion,
    talk: p.roles?.vym_tesoros_discurso,
    gems: p.roles?.vym_tesoros_perlas,
    reading: p.roles?.vym_tesoros_lectura,
    conversations: p.roles?.vym_maestros_titular,
    return_visits: p.roles?.vym_maestros_titular,
    disciples: p.roles?.vym_maestros_titular,
    bible_study: p.roles?.vym_estudio_conductor,
    reader_living: p.roles?.vym_estudio_lector,
    assistant_student: p.roles?.vym_maestros_ayudante,
  };

  if (type === 'main') {
    if (part.requiere_hermano && !isMale) return false;
    if (part.requiere_privilegio && !['elder', 'servant'].includes(role)) return false;

    switch (part.tipo) {
      case 'presidente':
        return assignments.chairman === true;
      case 'oracion_apertura':
      case 'oracion_cierre':
      case 'oracion_estudio':
        return assignments.prayers === true;
      case 'discurso_tesoros':
        return assignments.talk === true;
      case 'busquemos_perlas':
        return assignments.gems === true;
      case 'lectura_biblica':
        return assignments.reading === true;
      case 'empiece_conversaciones':
      case 'empiece_conversaciones_aux':
        return assignments.conversations === true;
      case 'haga_revisitas':
      case 'haga_revisitas_aux':
        return assignments.return_visits === true;
      case 'haga_discipulos':
        return assignments.disciples === true;
      case 'explique_sus_creencias':
      case 'discurso_estudiante':
        return true;
      case 'necesidades_congregacion':
      case 'estudio_biblico_grupo':
        return role === 'elder' && assignments.bible_study === true;
      case 'lector_estudio':
        return assignments.reader_living === true;
      case 'conductor_auxiliar':
        return role === 'elder';
      default:
        return true;
    }
  } else {
    // Ayudantes en demostraciones de estudiantes
    if (part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante') {
      return assignments.assistant_student === true;
    }
    return true;
  }
}

/**
 * Plantilla inicial para generar las partes de una semana de reunión Vida y Ministerio
 */
function createDefaultPrograma(semanaFecha: string, congregationId?: string | null): ClmPrograma {
  const dateObj = new Date(semanaFecha);
  const year = dateObj.getFullYear();
  const weekNum = Math.ceil(
    ((dateObj.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
  );

  // Intentar cargar datos oficiales de Organized para esta fecha
  const org = getOrganizedScheduleForWeek(`week-${year}-${weekNum}`, semanaFecha);

  const tesorosDiscurso = org?.midweek.tesoros.discursoTitle || 'Discurso de Tesoros de la Biblia (10 min)';
  const perlasTitulo = org?.midweek.tesoros.perlasTitle || 'Busquemos perlas escondidas (10 min)';
  const lecturaTitulo = org?.midweek.tesoros.lecturaTitle || 'Lectura de la Biblia (4 min)';

  const partes: ClmParte[] = [
    // ── MARCO DE LA REUNIÓN ──
    {
      id: `part-pres-${semanaFecha}`,
      tipo: 'presidente',
      titulo: 'Presidente de la reunión',
      duracion_min: 5,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    {
      id: `part-oracion-ap-${semanaFecha}`,
      tipo: 'oracion_apertura',
      titulo: 'Oración de apertura',
      duracion_min: 3,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    // ── TESOROS DE LA BIBLIA ──
    {
      id: `part-tes-disc-${semanaFecha}`,
      tipo: 'discurso_tesoros',
      titulo: tesorosDiscurso,
      duracion_min: 10,
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    {
      id: `part-tes-perlas-${semanaFecha}`,
      tipo: 'busquemos_perlas',
      titulo: perlasTitulo,
      duracion_min: 10,
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    {
      id: `part-tes-lectura-${semanaFecha}`,
      tipo: 'lectura_biblica',
      titulo: lecturaTitulo,
      duracion_min: 4,
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    // ── SEAMOS MEJORES MAESTROS (Auditorio Principal) ──
    {
      id: `part-mae-1-${semanaFecha}`,
      tipo: 'empiece_conversaciones',
      titulo: org?.midweek.demonstrations[0]?.title || 'Empiece conversaciones (3 min)',
      duracion_min: org?.midweek.demonstrations[0]?.timeMinutes || 3,
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    {
      id: `part-mae-2-${semanaFecha}`,
      tipo: 'haga_revisitas',
      titulo: org?.midweek.demonstrations[1]?.title || 'Haga revisitas (4 min)',
      duracion_min: org?.midweek.demonstrations[1]?.timeMinutes || 4,
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    {
      id: `part-mae-3-${semanaFecha}`,
      tipo: 'haga_discipulos',
      titulo: org?.midweek.demonstrations[2]?.title || 'Haga discípulos (5 min)',
      duracion_min: org?.midweek.demonstrations[2]?.timeMinutes || 5,
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    // ── SALA AUXILIAR (si se requiere) ──
    {
      id: `part-aux-cond-${semanaFecha}`,
      tipo: 'conductor_auxiliar',
      titulo: 'Consejero de la Sala Auxiliar',
      duracion_min: 30,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
      es_clase_auxiliar: true,
    },
    {
      id: `part-aux-lect-${semanaFecha}`,
      tipo: 'lectura_biblica',
      titulo: `${lecturaTitulo} (Sala auxiliar)`,
      duracion_min: 4,
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: false,
      es_clase_auxiliar: true,
    },
    {
      id: `part-aux-mae-1-${semanaFecha}`,
      tipo: 'empiece_conversaciones_aux',
      titulo: `${org?.midweek.demonstrations[0]?.title || 'Empiece conversaciones'} (Sala auxiliar)`,
      duracion_min: org?.midweek.demonstrations[0]?.timeMinutes || 3,
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: true,
    },
    {
      id: `part-aux-mae-2-${semanaFecha}`,
      tipo: 'haga_revisitas_aux',
      titulo: `${org?.midweek.demonstrations[1]?.title || 'Haga revisitas'} (Sala auxiliar)`,
      duracion_min: org?.midweek.demonstrations[1]?.timeMinutes || 4,
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: true,
    },
    // ── NUESTRA VIDA CRISTIANA ──
    {
      id: `part-vida-1-${semanaFecha}`,
      tipo: 'necesidades_congregacion',
      titulo: org?.midweek.vidaCristiana[0]?.title || 'Nuestra Vida Cristiana (15 min)',
      duracion_min: org?.midweek.vidaCristiana[0]?.timeMinutes || 15,
      seccion: 'vida_cristiana',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    {
      id: `part-vida-cbs-${semanaFecha}`,
      tipo: 'estudio_biblico_grupo',
      titulo: org?.midweek.estudioBiblicoTitle || 'Estudio bíblico de la congregación (30 min)',
      duracion_min: 30,
      seccion: 'vida_cristiana',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    {
      id: `part-vida-lector-${semanaFecha}`,
      tipo: 'lector_estudio',
      titulo: 'Lector del estudio bíblico',
      duracion_min: 30,
      seccion: 'vida_cristiana',
      requiere_hermano: true,
      requiere_privilegio: false,
    },
    {
      id: `part-oracion-cierre-${semanaFecha}`,
      tipo: 'oracion_cierre',
      titulo: 'Oración de conclusión',
      duracion_min: 3,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
  ];

  return {
    id: `clm-${semanaFecha}`,
    semana_fecha: semanaFecha,
    anio: year,
    semana_num: weekNum,
    estado: 'borrador',
    partes,
    congregation_id: congregationId || null,
    lectura_semana: org?.bibleReading || 'Lectura de la semana',
    rango_semana: org?.weekDateRange || `Semana del ${semanaFecha}`,
  };
}

// Formateador de lunes de la semana actual
function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

export default function ClmScheduleView({
  publishers,
  congregationId,
}: {
  publishers: Publisher[];
  congregationId?: string;
}) {
  const [semanaActual, setSemanaActual] = useState<Date>(() => new Date());
  const [programa, setPrograma] = useState<ClmPrograma | null>(null);
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [showAuxRoom, setShowAuxRoom] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const semanaFechaStr = useMemo(() => getMonday(semanaActual), [semanaActual]);

  // Cargar programa para la semana seleccionada (SQLite / localStorage / defecto)
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      // 1. Intentar cargar desde SQLite local vía Electron API
      if (window.electronAPI && typeof window.electronAPI.getClmPrograma === 'function') {
        try {
          const res = await window.electronAPI.getClmPrograma(semanaFechaStr);
          if (res && !isCancelled) {
            setPrograma(res);
            return;
          }
        } catch (e) {
          console.warn('Error loading CLM program from Electron SQLite:', e);
        }
      }

      // 2. Intentar cargar desde localStorage
      const localStored = localStorage.getItem(`clm_programa_${semanaFechaStr}`);
      if (localStored) {
        try {
          const parsed = JSON.parse(localStored);
          if (parsed && !isCancelled) {
            setPrograma(parsed);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }

      // 3. Crear programa por defecto
      if (!isCancelled) {
        setPrograma(createDefaultPrograma(semanaFechaStr, congregationId));
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [semanaFechaStr, congregationId]);

  // Auto-guardado debounce a SQLite local vía Electron y localStorage
  useEffect(() => {
    if (!programa) return;
    setGuardando(true);
    const timer = setTimeout(async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.upsertClmPrograma === 'function') {
          await window.electronAPI.upsertClmPrograma(programa);
        }
        localStorage.setItem(`clm_programa_${programa.semana_fecha}`, JSON.stringify(programa));
        setSavedNotification(true);
        setTimeout(() => setSavedNotification(false), 2000);
      } catch (err) {
        console.error('Error saving CLM program:', err);
      } finally {
        setGuardando(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [programa]);

  // Asignar en línea titular o ayudante
  function handleAssignInline(partId: string, value: string, type: 'main' | 'assistant') {
    if (!programa) return;
    const pub = publishers.find((p) => (p.nid || p.id) === value);
    setPrograma({
      ...programa,
      partes: programa.partes.map((p) => {
        if (p.id !== partId) return p;
        return type === 'main'
          ? {
              ...p,
              asignado_nid: value || null,
              asignado_nombre: pub ? pub.full_name || pub.name : '',
            }
          : {
              ...p,
              asignado_auxiliar_nid: value || null,
              asignado_auxiliar_nombre: pub ? pub.full_name || pub.name : '',
            };
      }),
    });
    setExpandedPartId(null);
  }

  // Guardar manualmente
  const handleGuardar = async (prog: ClmPrograma | null) => {
    if (!prog) return;
    setGuardando(true);
    try {
      if (window.electronAPI && typeof window.electronAPI.upsertClmPrograma === 'function') {
        await window.electronAPI.upsertClmPrograma(prog);
      }
      localStorage.setItem(`clm_programa_${prog.semana_fecha}`, JSON.stringify(prog));
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    } catch (e) {
      console.error('Error en guardado:', e);
    } finally {
      setGuardando(false);
    }
  };

  // Generar comprobantes oficiales S-89
  const handleGenerateS89 = () => {
    if (!programa) return;
    generateS89Pdf(programa, publishers);
  };

  // Auto-asignación inteligente
  const handleAutoAssign = () => {
    if (!programa) return;
    const asignado = autoAsignarLocal(programa, publishers);
    setPrograma(asignado);
  };

  // Sincronizar con datos oficiales de Organized
  const handleSyncOrganized = () => {
    if (!programa) return;
    const org = getOrganizedScheduleForWeek(programa.id, programa.semana_fecha);
    if (!org) {
      alert('No hay catálogo oficial disponible para esta fecha en Organized.');
      return;
    }

    setPrograma((prev) => {
      if (!prev) return prev;
      const updatedPartes = prev.partes.map((part) => {
        if (part.tipo === 'discurso_tesoros' && org.midweek.tesoros.discursoTitle) {
          return { ...part, titulo: org.midweek.tesoros.discursoTitle };
        }
        if (part.tipo === 'busquemos_perlas' && org.midweek.tesoros.perlasTitle) {
          return { ...part, titulo: org.midweek.tesoros.perlasTitle };
        }
        if (part.tipo === 'lectura_biblica' && org.midweek.tesoros.lecturaTitle) {
          return {
            ...part,
            titulo: part.es_clase_auxiliar
              ? `${org.midweek.tesoros.lecturaTitle} (Sala auxiliar)`
              : org.midweek.tesoros.lecturaTitle,
          };
        }
        if (part.tipo === 'estudio_biblico_grupo' && org.midweek.estudioBiblicoTitle) {
          return { ...part, titulo: org.midweek.estudioBiblicoTitle };
        }
        return part;
      });

      return {
        ...prev,
        lectura_semana: org.bibleReading || prev.lectura_semana,
        rango_semana: org.weekDateRange || prev.rango_semana,
        partes: updatedPartes,
      };
    });
  };

  // Navegación de semanas
  const handlePrevWeek = () => {
    const nextDate = new Date(semanaActual);
    nextDate.setDate(nextDate.getDate() - 7);
    setSemanaActual(nextDate);
  };

  const handleNextWeek = () => {
    const nextDate = new Date(semanaActual);
    nextDate.setDate(nextDate.getDate() + 7);
    setSemanaActual(nextDate);
  };

  // Métricas y progreso por sección
  const stats = useMemo(() => {
    if (!programa) return {};
    const sections = ['marco', 'tesoros', 'maestros', 'vida_cristiana'] as const;
    const result: Record<string, { total: number; assigned: number; pct: number }> = {};

    for (const sec of sections) {
      const parts = programa.partes.filter(
        (p) => p.seccion === sec && (showAuxRoom || !p.es_clase_auxiliar)
      );
      const total = parts.length;
      const assigned = parts.filter((p) => p.asignado_nombre).length;
      const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
      result[sec] = { total, assigned, pct };
    }

    return result;
  }, [programa, showAuxRoom]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      {/* Cabecera con acciones */}
      <SectionHeader
        icon={CalendarDays}
        title="Programa"
        highlightWord="VMC"
        subtitle="Reunión Vida y Ministerio Cristianos • Planificación Teocrática"
        colorTheme="indigo"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {savedNotification && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 animate-fade-in">
                <BookmarkCheck size={14} /> Guardado
              </span>
            )}
            <button
              onClick={handleSyncOrganized}
              title="Traer bosquejos, temas y lecturas oficiales de Organized"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 transition-colors"
            >
              <RefreshCw size={14} /> Organized
            </button>
            <button
              onClick={handleAutoAssign}
              title="Auto-asignar publicadores respetando privilegios y rotación"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-semibold border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 transition-colors"
            >
              <Sparkles size={14} /> Auto-asignar
            </button>
            <button
              onClick={() => handleGuardar(programa)}
              disabled={guardando}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-white/10 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-100 transition-colors"
            >
              <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleGenerateS89}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 transition-colors"
            >
              <FileText size={14} /> Imprimir S-89
            </button>
          </div>
        }
      />

      {/* Selector de semana y Controles de vista */}
      <div className="px-6 py-3 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navegación por fechas */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              {programa?.rango_semana || `Semana del ${semanaFechaStr}`}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Lectura bíblica: <strong className="text-indigo-600 dark:text-indigo-400">{programa?.lectura_semana || 'Salmos'}</strong>
            </span>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            title="Semana siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Sala Auxiliar toggle y estado */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuxRoom(!showAuxRoom)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showAuxRoom
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <DoorOpen size={14} />
            <span>Sala Auxiliar {showAuxRoom ? 'Activada' : 'Oculta'}</span>
          </button>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              programa?.estado === 'publicado'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400'
            }`}
          >
            {programa?.estado || 'borrador'}
          </span>
        </div>
      </div>

      {/* Barras de progreso por sección */}
      <div className="px-6 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/20 dark:bg-slate-900/20 border-b border-zinc-200/60 dark:border-white/[0.04]">
        {Object.entries(SECTION_LABELS).map(([secKey, secLabel]) => {
          const secStat = stats[secKey] || { total: 0, assigned: 0, pct: 0 };
          const color = SECTION_COLORS[secKey] || '#6366f1';
          return (
            <div
              key={secKey}
              className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-slate-900/40"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold truncate" style={{ color }}>
                  {secLabel}
                </span>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  {secStat.assigned}/{secStat.total} ({secStat.pct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${secStat.pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid del Programa VMC */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Auditorio Principal */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <SlidersHorizontal size={14} />
            Auditorio Principal
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {programa?.partes
              .filter((p) => !p.es_clase_auxiliar)
              .map((part) => {
                const sectionColor = SECTION_COLORS[part.seccion] || '#8b5cf6';
                const isExpanded = expandedPartId === part.id;

                return (
                  <div
                    key={part.id}
                    className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xs hover:border-zinc-300 dark:hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1"
                          style={{
                            color: sectionColor,
                            backgroundColor: `${sectionColor}15`,
                          }}
                        >
                          {SECTION_LABELS[part.seccion]}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {part.titulo} <span className="text-zinc-400 font-normal">({part.duracion_min} min)</span>
                        </h4>
                        {part.asignado_auxiliar_nombre && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Ayudante: <strong className="text-zinc-700 dark:text-zinc-200">{part.asignado_auxiliar_nombre}</strong>
                          </p>
                        )}
                      </div>

                      {/* Desplegable o asignado actual */}
                      <div className="flex items-center gap-2">
                        {part.asignado_nombre ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle2 size={13} /> {part.asignado_nombre}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-lg">
                            Sin Asignar
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                          className="px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-500/30"
                        >
                          {isExpanded ? 'Cerrar' : 'Asignar'}
                        </button>
                      </div>
                    </div>

                    {/* Panel expandible para seleccionar hermano y ayudante */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                            Titular
                          </label>
                          <Select
                            value={part.asignado_nid || ''}
                            onChange={(val) => handleAssignInline(part.id, val, 'main')}
                            options={publishers
                              .filter((p) => isPublisherEligibleForPart(p, part, 'main'))
                              .map((p) => ({
                                value: p.nid || p.id,
                                label: `${p.full_name || p.name}${p.privilege ? ` (${p.privilege})` : ''}`,
                              }))}
                            placeholder="Seleccionar titular..."
                          />
                        </div>

                        {part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante' && (
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                              Ayudante
                            </label>
                            <Select
                              value={part.asignado_auxiliar_nid || ''}
                              onChange={(val) => handleAssignInline(part.id, val, 'assistant')}
                              options={publishers
                                .filter(
                                  (p) =>
                                    (p.nid || p.id) !== part.asignado_nid &&
                                    isPublisherEligibleForPart(p, part, 'assistant')
                                )
                                .map((p) => ({
                                  value: p.nid || p.id,
                                  label: p.full_name || p.name,
                                }))}
                              placeholder="Seleccionar ayudante..."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Sala Auxiliar (si está habilitada) */}
        {showAuxRoom && (
          <div className="space-y-4 pt-4 border-t border-dashed border-zinc-200 dark:border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <DoorOpen size={14} />
              Sala Auxiliar
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {programa?.partes
                .filter((p) => p.es_clase_auxiliar)
                .map((part) => {
                  const sectionColor = SECTION_COLORS[part.seccion] || '#8b5cf6';
                  const isExpanded = expandedPartId === part.id;

                  return (
                    <div
                      key={part.id}
                      className="rounded-2xl border border-amber-200/70 dark:border-amber-500/20 p-4 bg-amber-50/20 dark:bg-amber-950/10 backdrop-blur-md shadow-xs hover:border-amber-300 dark:hover:border-amber-500/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1"
                            style={{
                              color: sectionColor,
                              backgroundColor: `${sectionColor}15`,
                            }}
                          >
                            {SECTION_LABELS[part.seccion]} • Sala Auxiliar
                          </span>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {part.titulo} <span className="text-zinc-400 font-normal">({part.duracion_min} min)</span>
                          </h4>
                          {part.asignado_auxiliar_nombre && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Ayudante: <strong className="text-zinc-700 dark:text-zinc-200">{part.asignado_auxiliar_nombre}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {part.asignado_nombre ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle2 size={13} /> {part.asignado_nombre}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-lg">
                              Sin Asignar
                            </span>
                          )}
                          <button
                            onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                            className="px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-200 dark:border-amber-500/30"
                          >
                            {isExpanded ? 'Cerrar' : 'Asignar'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-500/10 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                              Titular Sala Auxiliar
                            </label>
                            <Select
                              value={part.asignado_nid || ''}
                              onChange={(val) => handleAssignInline(part.id, val, 'main')}
                              options={publishers
                                .filter((p) => isPublisherEligibleForPart(p, part, 'main'))
                                .map((p) => ({
                                  value: p.nid || p.id,
                                  label: `${p.full_name || p.name}${p.privilege ? ` (${p.privilege})` : ''}`,
                                }))}
                              placeholder="Seleccionar titular..."
                            />
                          </div>

                          {part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante' && (
                            <div>
                              <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                                Ayudante Sala Auxiliar
                              </label>
                              <Select
                                value={part.asignado_auxiliar_nid || ''}
                                onChange={(val) => handleAssignInline(part.id, val, 'assistant')}
                                options={publishers
                                  .filter(
                                    (p) =>
                                      (p.nid || p.id) !== part.asignado_nid &&
                                      isPublisherEligibleForPart(p, part, 'assistant')
                                  )
                                  .map((p) => ({
                                    value: p.nid || p.id,
                                    label: p.full_name || p.name,
                                  }))}
                                placeholder="Seleccionar ayudante..."
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
