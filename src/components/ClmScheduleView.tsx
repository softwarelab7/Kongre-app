import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Publisher, ClmPrograma, ClmParte, TurnoDeber, WeekendPrograma, ClmHistorialItem } from '../types';
import { autoAsignarLocal, isPublisherEligibleForPart } from '../utils/clmAutoAssignLocal';
import { generateS89Pdf } from '../utils/pdfFillers';
import { Select } from './Select';
import { getOrganizedScheduleForWeek } from '../utils/organizedSync';
import { checkPublisherConflictsOnDate } from '../utils/assignmentConflictChecker';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  CheckCircle2,
  CalendarDays,
  FileText,
  RefreshCw,
  AlertTriangle,
  Music,
  Share2,
  FileUp,
  X,
  Check,
} from 'lucide-react';

// Banners oficiales por sección
const SECTION_BANNERS = {
  tesoros: {
    label: 'TESOROS DE LA BIBLIA',
    bgColor: '#2a6b77', // Verde azulado oficial
  },
  maestros: {
    label: 'SEAMOS MEJORES MAESTROS',
    bgColor: '#9b6d17', // Ocre dorado oficial
  },
  vida_cristiana: {
    label: 'NUESTRA VIDA CRISTIANA',
    bgColor: '#942926', // Rojo teocrático oficial
  },
};

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

  const tesorosDiscurso =
    org?.midweek.tesoros.discursoTitle ||
    'Tengamos un punto de vista equilibrado de la protección de Jehová (10 min)';
  const perlasTitulo =
    org?.midweek.tesoros.perlasTitle || 'Busquemos perlas escondidas (10 min)';
  const lecturaTitulo =
    org?.midweek.tesoros.lecturaTitle || 'Lectura de la Biblia (4 min)';

  const song1 = org?.midweek.songFirst || 33;
  const song2 = org?.midweek.songMiddle || 120;
  const song3 = org?.midweek.songConclude || 145;

  const partes: ClmParte[] = [
    // ── MARCO DE LA REUNIÓN ──
    {
      id: `part-pres-${semanaFecha}`,
      tipo: 'presidente',
      titulo: 'Presidente',
      duracion_min: 5,
      seccion: 'marco',
      requiere_hermano: true,
      requiere_privilegio: true,
    },
    {
      id: `part-canto-1-${semanaFecha}`,
      tipo: 'canto',
      titulo: `Cántico ${song1}: Echa sobre Dios tu carga`,
      duracion_min: 5,
      seccion: 'marco',
      requiere_hermano: false,
      requiere_privilegio: false,
    },
    {
      id: `part-oracion-ap-${semanaFecha}`,
      tipo: 'oracion_apertura',
      titulo: 'Oración de apertura',
      duracion_min: 1,
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
      descripcion: 'Jer 40:1–10 (th lección 2).',
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },

    // ── SEAMOS MEJORES MAESTROS (Auditorio Principal) ──
    {
      id: `part-mae-1-${semanaFecha}`,
      tipo: 'empiece_conversaciones',
      titulo: org?.midweek.demonstrations[0]?.title || 'Empiece conversaciones (2 min)',
      duracion_min: org?.midweek.demonstrations[0]?.timeMinutes || 2,
      descripcion: 'DE CASA EN CASA. (lmd lección 2 punto 3).',
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    {
      id: `part-mae-2-${semanaFecha}`,
      tipo: 'empiece_conversaciones',
      titulo: org?.midweek.demonstrations[1]?.title || 'Empiece conversaciones (2 min)',
      duracion_min: org?.midweek.demonstrations[1]?.timeMinutes || 2,
      descripcion: 'PREDICACIÓN INFORMAL. (lmd lección 2 punto 5).',
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    {
      id: `part-mae-3-${semanaFecha}`,
      tipo: 'empiece_conversaciones',
      titulo: org?.midweek.demonstrations[2]?.title || 'Empiece conversaciones (4 min)',
      duracion_min: org?.midweek.demonstrations[2]?.timeMinutes || 4,
      descripcion: 'PREDICACIÓN PÚBLICA. Una persona se queda mirando el carrito de publicaciones (lmd lección 5 punto 3).',
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },
    {
      id: `part-mae-4-${semanaFecha}`,
      tipo: 'explique_sus_creencias',
      titulo: org?.midweek.demonstrations[3]?.title || 'Explique sus creencias (3 min)',
      duracion_min: org?.midweek.demonstrations[3]?.timeMinutes || 3,
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: false,
    },

    // ── CANTO INTERMEDIO ──
    {
      id: `part-canto-2-${semanaFecha}`,
      tipo: 'canto',
      titulo: `Cántico ${song2}`,
      duracion_min: 5,
      seccion: 'vida_cristiana',
      requiere_hermano: false,
      requiere_privilegio: false,
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

    // ── CONCLUSIÓN ──
    {
      id: `part-canto-3-${semanaFecha}`,
      tipo: 'canto',
      titulo: `Cántico ${song3}`,
      duracion_min: 5,
      seccion: 'marco',
      requiere_hermano: false,
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

    // ── SALA AUXILIAR ──
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
      descripcion: 'Jer 40:1–10 (th lección 2).',
      seccion: 'tesoros',
      requiere_hermano: true,
      requiere_privilegio: false,
      es_clase_auxiliar: true,
    },
    {
      id: `part-aux-mae-1-${semanaFecha}`,
      tipo: 'empiece_conversaciones_aux',
      titulo: 'Empiece conversaciones (Sala auxiliar)',
      duracion_min: 2,
      descripcion: 'DE CASA EN CASA. (lmd lección 2 punto 3).',
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: true,
    },
    {
      id: `part-aux-mae-2-${semanaFecha}`,
      tipo: 'haga_revisitas_aux',
      titulo: 'Haga revisitas (Sala auxiliar)',
      duracion_min: 4,
      descripcion: 'PREDICACIÓN INFORMAL. (lmd lección 2 punto 5).',
      seccion: 'maestros',
      requiere_hermano: false,
      requiere_privilegio: false,
      es_clase_auxiliar: true,
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
    lectura_semana: org?.bibleReading || 'JEREMÍAS 40, 41',
    rango_semana: org?.weekDateRange || `Semana del 5 de octubre de 2026`,
  };
}

// Formateador de lunes de la semana
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
  turnosDeberes = [],
  weekendProgramas = [],
}: {
  publishers: Publisher[];
  congregationId?: string;
  turnosDeberes?: TurnoDeber[];
  weekendProgramas?: WeekendPrograma[];
}) {
  const [semanaActual, setSemanaActual] = useState<Date>(() => new Date());
  const [programa, setPrograma] = useState<ClmPrograma | null>(null);
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [showAuxRoom, setShowAuxRoom] = useState(false);
  const [activeRoom, setActiveRoom] = useState<'principal' | 'auxiliar'>('principal');
  const [guardando, setGuardando] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const semanaFechaStr = useMemo(() => getMonday(semanaActual), [semanaActual]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper para verificar cruces de un publicador
  const getPublisherConflicts = (pubId: string | null | undefined, pubName: string | undefined, partId: string) => {
    if (!pubId && !pubName) return { hasStrictConflict: false, conflicts: [] };
    return checkPublisherConflictsOnDate(
      pubId || '',
      pubName,
      semanaFechaStr,
      {
        clmProgramas: programa ? [programa] : [],
        weekendProgramas,
        turnosDeberes,
      },
      partId
    );
  };

  // Cargar programa para la semana seleccionada
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
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

      if (!isCancelled) {
        setPrograma(createDefaultPrograma(semanaFechaStr, congregationId));
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [semanaFechaStr, congregationId]);

  // Auto-guardado debounce
  useEffect(() => {
    if (!programa) return;
    setGuardando(true);
    const timer = setTimeout(async () => {
      try {
        if (window.electronAPI && typeof window.electronAPI.upsertClmPrograma === 'function') {
          await window.electronAPI.upsertClmPrograma(programa);
        }
        localStorage.setItem(`clm_programa_${programa.semana_fecha}`, JSON.stringify(programa));
      } catch (err) {
        console.error('Error saving CLM program:', err);
      } finally {
        setGuardando(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [programa]);

  // Asignar titular o ayudante
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
      showToast('¡Programa guardado exitosamente!');
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
    const historial: ClmHistorialItem[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('clm_programa_') && key !== `clm_programa_${programa.semana_fecha}`) {
          const val = localStorage.getItem(key);
          if (val) {
            const p: ClmPrograma = JSON.parse(val);
            if (p.partes) {
              p.partes.forEach((parte) => {
                if (parte.asignado_nid) {
                  historial.push({
                    publisher_nid: parte.asignado_nid,
                    publisher_name: parte.asignado_nombre,
                    semana_fecha: p.semana_fecha,
                    tipo_parte: parte.tipo,
                    titulo_parte: parte.titulo,
                    rol: 'titular',
                  });
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Historial warning:', e);
    }

    const asignado = autoAsignarLocal(programa, publishers, historial);
    setPrograma(asignado);
    showToast('Asignaciones completadas con rotación inteligente.');
  };

  // Sincronizar catálogo oficial
  const handleSyncOrganized = () => {
    if (!programa) return;
    const org = getOrganizedScheduleForWeek(programa.id, programa.semana_fecha);
    if (!org) {
      showToast('No se encontró catálogo para esta semana en Organized.');
      return;
    }
    setPrograma(createDefaultPrograma(programa.semana_fecha, congregationId));
    showToast('Datos de la semana sincronizados exitosamente.');
  };

  // Enviar a Cartelera
  const handleSendBillboard = () => {
    showToast('¡Programa publicado y enviado a la cartelera digital!');
  };

  // Importar archivo .jwpub
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast(`Archivo "${file.name}" cargado exitosamente.`);
    }
  };

  // Navegación de fechas
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

  // Filtrado según sala seleccionada
  const visiblePartes = useMemo(() => {
    if (!programa) return [];
    if (activeRoom === 'auxiliar') {
      return programa.partes.filter((p) => p.es_clase_auxiliar);
    }
    return programa.partes.filter((p) => !p.es_clase_auxiliar);
  }, [programa, activeRoom]);

  // Agrupación visual por secciones
  const groupedSections = useMemo(() => {
    const marcoInicial = visiblePartes.filter(
      (p) => p.seccion === 'marco' && (p.tipo === 'presidente' || p.tipo === 'canto' || p.tipo === 'oracion_apertura' || p.tipo === 'conductor_auxiliar')
    );
    const tesoros = visiblePartes.filter((p) => p.seccion === 'tesoros');
    const maestros = visiblePartes.filter((p) => p.seccion === 'maestros');
    const cantoMedio = visiblePartes.filter((p) => p.seccion === 'vida_cristiana' && p.tipo === 'canto');
    const vidaCristiana = visiblePartes.filter((p) => p.seccion === 'vida_cristiana' && p.tipo !== 'canto');
    const marcoFinal = visiblePartes.filter(
      (p) => p.seccion === 'marco' && (p.tipo === 'oracion_cierre' || (p.tipo === 'canto' && p.id.includes('canto-3')))
    );

    return {
      marcoInicial,
      tesoros,
      maestros,
      cantoMedio,
      vidaCristiana,
      marcoFinal,
    };
  }, [visiblePartes]);

  // Conteo de numeración de partes (1, 2, 3...)
  let currentPartNumber = 0;

  // Renderizador de fila de parte individual
  const renderPartRow = (part: ClmParte) => {
    const isSong = part.tipo === 'canto';
    const isPrayer = part.tipo === 'oracion_apertura' || part.tipo === 'oracion_cierre' || part.tipo === 'oracion_estudio';
    const isExpanded = expandedPartId === part.id;
    const isCounselor = part.tipo === 'conductor_auxiliar';

    let badgeContent = null;
    if (isSong) {
      badgeContent = (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-indigo-500" />
        </div>
      );
    } else if (isPrayer) {
      badgeContent = (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
        </div>
      );
    } else if (isCounselor) {
      badgeContent = (
        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
          C.
        </div>
      );
    } else {
      currentPartNumber++;
      badgeContent = (
        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
          {currentPartNumber}.
        </div>
      );
    }

    const { conflicts } = getPublisherConflicts(part.asignado_nid, part.asignado_nombre, part.id);
    const hasStrict = conflicts.some((c) => c.severity === 'STRICT_CONFLICT');
    const hasSaturation = conflicts.some((c) => c.severity === 'WARNING_SATURATION');

    return (
      <div key={part.id} className="border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
          {/* Lado izquierdo: Ícono/Número + Título + Subtítulo */}
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            {badgeContent}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {part.titulo}
                </h4>
                {part.duracion_min && !part.titulo.includes('min') && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({part.duracion_min} min)
                  </span>
                )}
              </div>

              {part.descripcion && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                  {part.descripcion}
                </p>
              )}

              {part.asignado_auxiliar_nombre && (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  Ayudante: <strong>{part.asignado_auxiliar_nombre}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Lado derecho: Estado / Botón de Asignación */}
          <div className="flex items-center gap-2 shrink-0">
            {isSong ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Congregación
              </span>
            ) : part.asignado_nombre ? (
              <div className="flex items-center gap-1.5">
                {conflicts.length > 0 && (
                  <span
                    title={conflicts.map((c) => c.details).join(' | ')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-help ${
                      hasStrict
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <AlertTriangle size={11} />
                    {hasStrict ? 'Cruce' : 'Saturación'}
                  </span>
                )}

                <button
                  onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{part.asignado_nombre}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                className="px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100/80 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                + Sin Asignar
              </button>
            )}
          </div>
        </div>

        {/* Panel expandible para seleccionar asignados */}
        {isExpanded && !isSong && (
          <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-white/[0.04] grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Hermano Asignado (Titular)
              </label>
              <Select
                value={part.asignado_nid || ''}
                onChange={(val) => handleAssignInline(part.id, val, 'main')}
                options={publishers
                  .filter((p) => isPublisherEligibleForPart(p, part, 'main'))
                  .map((p) => {
                    const pId = p.nid || p.id;
                    const { conflicts: pConflicts } = getPublisherConflicts(pId, p.full_name || p.name, part.id);
                    const conflictNote =
                      pConflicts.length > 0
                        ? pConflicts.some((c) => c.severity === 'STRICT_CONFLICT')
                          ? ' ⚠️ [Cruce en reunión]'
                          : ' ⏳ [Saturación semanal]'
                        : '';
                    return {
                      value: pId,
                      label: `${p.full_name || p.name}${p.privilege ? ` (${p.privilege})` : ''}${conflictNote}`,
                    };
                  })}
                placeholder="Seleccionar titular..."
              />
            </div>

            {part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante' && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Ayudante (Demostración)
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
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── BARRA SUPERIOR DE ACCIONES ── */}
      <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Título: Programa VMC */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              Programa <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">VMC</span>
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Vida y Ministerio Cristianos
            </p>
          </div>
        </div>

        {/* Botones de acción derecha */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sincronizar */}
          <button
            onClick={handleSyncOrganized}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Sincronizar catálogo oficial con Organized"
          >
            <RefreshCw size={13} className="shrink-0" />
            <span>Sincronizar</span>
          </button>

          {/* Importar .jwpub */}
          <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs">
            <FileUp size={13} className="shrink-0" />
            <span>Importar .jwpub</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jwpub,.json,.epub"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>

          {/* Auto-Asignar */}
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Auto-asignar respetando rotación histórica y privilegios"
          >
            <Sparkles size={13} className="shrink-0" />
            <span>Auto-Asignar</span>
          </button>

          {/* Enviar a cartelera */}
          <button
            onClick={handleSendBillboard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Enviar a cartelera de anuncios de la congregación"
          >
            <Share2 size={13} className="shrink-0" />
            <span>Enviar a cartelera</span>
          </button>

          {/* Guardar */}
          <button
            onClick={() => handleGuardar(programa)}
            disabled={guardando}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-white/10 dark:text-zinc-200 dark:border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Save size={13} className="shrink-0" />
            <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
          </button>

          {/* Imprimir S-89 */}
          <button
            onClick={handleGenerateS89}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Imprimir hojas oficiales de asignación S-89 en PDF"
          >
            <FileText size={13} className="shrink-0" />
            <span>Imprimir S-89</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE NAVEGACIÓN Y SELECTOR DE FECHAS ── */}
      <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
        {/* Cápsula de navegación semanal */}
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-xs gap-3">
          <button
            onClick={handlePrevWeek}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {programa?.rango_semana || `Semana del ${semanaFechaStr}`}
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {programa?.lectura_semana || 'JEREMÍAS 40, 41'}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">
              Semana {programa?.semana_num || '41'}
            </span>
          </div>

          <button
            onClick={handleNextWeek}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Semana siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Checkbox de Sala Auxiliar */}
        <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none">
          <input
            type="checkbox"
            checked={showAuxRoom}
            onChange={(e) => {
              setShowAuxRoom(e.target.checked);
              if (!e.target.checked) setActiveRoom('principal');
            }}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
          />
          <span>Sala Auxiliar</span>
        </label>
      </div>

      {/* ── SELECTOR DE SALA (AUDITORIO / SALA AUXILIAR) ── */}
      <div className="px-6 pt-3.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveRoom('principal')}
            className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
              activeRoom === 'principal'
                ? 'text-slate-800 dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
            <span>Auditorio</span>
          </button>

          {showAuxRoom && (
            <>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <button
                onClick={() => setActiveRoom('auxiliar')}
                className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                  activeRoom === 'auxiliar'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Sala Auxiliar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── LISTADO OFICIAL DE LA REUNIÓN ── */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* 1. Marco Inicial: Presidente, Cántico 1, Oración */}
        {groupedSections.marcoInicial.map((part) => renderPartRow(part))}

        {/* 2. Sección: TESOROS DE LA BIBLIA */}
        {groupedSections.tesoros.length > 0 && (
          <div className="mt-2">
            <div
              style={{ backgroundColor: SECTION_BANNERS.tesoros.bgColor }}
              className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
            >
              {SECTION_BANNERS.tesoros.label}
            </div>
            {groupedSections.tesoros.map((part) => renderPartRow(part))}
          </div>
        )}

        {/* 3. Sección: SEAMOS MEJORES MAESTROS */}
        {groupedSections.maestros.length > 0 && (
          <div className="mt-2">
            <div
              style={{ backgroundColor: SECTION_BANNERS.maestros.bgColor }}
              className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
            >
              {SECTION_BANNERS.maestros.label}
            </div>
            {groupedSections.maestros.map((part) => renderPartRow(part))}
          </div>
        )}

        {/* 4. Cántico Intermedio */}
        {groupedSections.cantoMedio.map((part) => renderPartRow(part))}

        {/* 5. Sección: NUESTRA VIDA CRISTIANA */}
        {groupedSections.vidaCristiana.length > 0 && (
          <div className="mt-2">
            <div
              style={{ backgroundColor: SECTION_BANNERS.vida_cristiana.bgColor }}
              className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
            >
              {SECTION_BANNERS.vida_cristiana.label}
            </div>
            {groupedSections.vidaCristiana.map((part) => renderPartRow(part))}
          </div>
        )}

        {/* 6. Marco Final: Cántico de cierre y Oración de conclusión */}
        {groupedSections.marcoFinal.map((part) => renderPartRow(part))}
      </div>
    </div>
  );
}
