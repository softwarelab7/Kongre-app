import React, { useState, useMemo } from 'react';
import type { ClmPrograma, ClmParte, Publisher, WeekSchedule } from '../types';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import { generateCounselorSheetPdf } from '../utils/clmCounselorPdf';
import {
  X,
  UserCheck,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Copy,
  Printer,
  FileDown,
  ArrowRightLeft,
  Users,
  Check,
  ChevronRight,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface ClmAuxiliaryCounselorModalProps {
  isOpen: boolean;
  onClose: () => void;
  programa: ClmPrograma | null;
  publishers: Publisher[];
  allWeeks?: WeekSchedule[];
  clmProgramas?: ClmPrograma[];
  congregationName?: string;
  onUpdatePrograma: (prog: ClmPrograma) => void;
  onOpenS38Modal: (publisher: Publisher) => void;
  onCompleteLesson?: (part: ClmParte) => void;
  onRepeatLesson?: (part: ClmParte) => void;
  onToast: (msg: string) => void;
}

export const ClmAuxiliaryCounselorModal: React.FC<ClmAuxiliaryCounselorModalProps> = ({
  isOpen,
  onClose,
  programa,
  publishers,
  allWeeks = [],
  clmProgramas = [],
  congregationName = 'Congregación',
  onUpdatePrograma,
  onOpenS38Modal,
  onCompleteLesson,
  onRepeatLesson,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'counselor' | 'worksheet' | 'balance'>('counselor');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [counselorNotes, setCounselorNotes] = useState<Record<string, string>>({});

  // Filtrar partes de sala auxiliar vs sala principal
  const auxParts = (programa?.partes || []).filter((p) => p.es_clase_auxiliar);
  const mainParts = (programa?.partes || []).filter((p) => !p.es_clase_auxiliar);

  // Parte del Consejero de la Sala Auxiliar
  let counselorPart = auxParts.find((p) => p.tipo === 'conductor_auxiliar');

  // Si no existe la parte en auxParts, verificar si existe en el programa en general
  if (!counselorPart) {
    counselorPart = (programa?.partes || []).find((p) => p.tipo === 'conductor_auxiliar');
  }

  // Estudiantes en Sala Auxiliar
  const auxStudentParts = auxParts.filter(
    (p) => p.seccion === 'maestros' || p.tipo === 'lectura_biblica'
  );

  // Estudiantes en Auditorio Principal
  const mainStudentParts = mainParts.filter(
    (p) => p.seccion === 'maestros' || p.tipo === 'lectura_biblica'
  );

  // Consejero actual
  const currentCounselor = counselorPart?.asignado_nid
    ? publishers.find((p) => (p.nid || p.id) === counselorPart?.asignado_nid)
    : null;

  // Candidatos elegibles a Consejero de la Sala Auxiliar (ancianos y siervos calificados)
  const eligibleCounselors = useMemo(() => {
    return publishers
      .filter((p) => {
        const isActive = p.status ? p.status === 'active' : p.active !== false;
        if (!isActive) return false;
        const isMale = (p.gender as string) === 'male' || p.gender === 'hermano';
        if (!isMale) return false;
        const role =
          p.role ||
          (p.privilege === 'anciano'
            ? 'elder'
            : p.privilege === 'siervo_ministerial'
            ? 'servant'
            : 'publisher');
        return role === 'elder' || role === 'servant';
      })
      .map((p) => {
        const pId = p.nid || p.id;
        // Calcular cuántas veces ha sido consejero auxiliar en el historial
        let timesAsCounselor = 0;
        let lastDate: string | undefined = undefined;

        (clmProgramas || []).forEach((prog) => {
          (prog.partes || []).forEach((pt) => {
            if (pt.tipo === 'conductor_auxiliar' && pt.asignado_nid === pId) {
              timesAsCounselor++;
              if (!lastDate || prog.semana_fecha > lastDate) {
                lastDate = prog.semana_fecha;
              }
            }
          });
        });

        // Verificar si tiene otra asignación esta semana
        const otherAssignmentsThisWeek = (programa?.partes || []).filter(
          (pt) =>
            pt.id !== counselorPart?.id &&
            (pt.asignado_nid === pId || pt.asignado_auxiliar_nid === pId)
        );

        return {
          publisher: p,
          timesAsCounselor,
          lastDate,
          hasConflict: otherAssignmentsThisWeek.length > 0,
          otherAssignmentsCount: otherAssignmentsThisWeek.length,
          isElder: p.role === 'elder' || p.privilege === 'anciano',
        };
      })
      .sort((a, b) => {
        // Ancianos primero, luego menor historial de veces como consejero
        if (a.isElder && !b.isElder) return -1;
        if (!a.isElder && b.isElder) return 1;
        return a.timesAsCounselor - b.timesAsCounselor;
      });
  }, [publishers, clmProgramas, programa, counselorPart]);

  // Manejador para asignar consejero
  const handleAssignCounselor = (publisherId: string) => {
    if (!programa) return;
    const selectedPub = publishers.find((p) => (p.nid || p.id) === publisherId);
    const pubName = selectedPub ? selectedPub.full_name || selectedPub.name : '';

    let updatedPartes = [...(programa.partes || [])];

    if (counselorPart) {
      updatedPartes = updatedPartes.map((p) => {
        if (p.id === counselorPart!.id) {
          return {
            ...p,
            asignado_nid: publisherId || null,
            asignado_nombre: pubName,
          };
        }
        return p;
      });
    } else {
      // Crear la parte de consejero auxiliar si no existe
      const newPart: ClmParte = {
        id: `part-aux-cond-${programa.semana_fecha}`,
        tipo: 'conductor_auxiliar',
        titulo: 'Consejero de la Sala Auxiliar',
        duracion_min: 30,
        seccion: 'marco',
        requiere_hermano: true,
        requiere_privilegio: true,
        es_clase_auxiliar: true,
        asignado_nid: publisherId || null,
        asignado_nombre: pubName,
      };
      updatedPartes.push(newPart);
    }

    onUpdatePrograma({
      ...programa,
      partes: updatedPartes,
    });

    onToast(
      publisherId
        ? `Consejero asignado: ${pubName}`
        : 'Consejero de sala auxiliar desasignado.'
    );
  };

  // Auto-asignación inteligente del Consejero
  const handleAutoAssignCounselor = () => {
    // Buscar el primer anciano sin conflictos esta semana con menor rotación
    const candidate =
      eligibleCounselors.find((c) => c.isElder && !c.hasConflict) ||
      eligibleCounselors.find((c) => !c.hasConflict) ||
      eligibleCounselors[0];

    if (candidate) {
      const pId = candidate.publisher.nid || candidate.publisher.id;
      if (pId) handleAssignCounselor(pId);
    } else {
      onToast('No hay hermanos elegibles disponibles para Consejero Auxiliar.');
    }
  };

  // Clonar partes de estudiantes a Sala Auxiliar si no tiene ninguna
  const handleCloneStudentPartsToAux = () => {
    if (!programa) return;
    const mainStudents = (programa.partes || []).filter(
      (p) => !p.es_clase_auxiliar && (p.seccion === 'maestros' || p.tipo === 'lectura_biblica')
    );

    if (mainStudents.length === 0) {
      onToast('No hay asignaciones de estudiantes en el auditorio para replicar.');
      return;
    }

    const cloned: ClmParte[] = mainStudents.map((mp, idx) => ({
      ...mp,
      id: `part-aux-clone-${idx}-${programa.semana_fecha}`,
      titulo: `${mp.titulo} (Sala auxiliar)`,
      es_clase_auxiliar: true,
      asignado_nid: null,
      asignado_nombre: '',
      asignado_auxiliar_nid: null,
      asignado_auxiliar_nombre: '',
      leccion_estado: 'pendiente',
    }));

    // Asegurar también que exista el conductor_auxiliar
    const hasCond = (programa.partes || []).some((p) => p.tipo === 'conductor_auxiliar');
    const extra: ClmParte[] = [];
    if (!hasCond) {
      extra.push({
        id: `part-aux-cond-${programa.semana_fecha}`,
        tipo: 'conductor_auxiliar',
        titulo: 'Consejero de la Sala Auxiliar',
        duracion_min: 30,
        seccion: 'marco',
        requiere_hermano: true,
        requiere_privilegio: true,
        es_clase_auxiliar: true,
      });
    }

    onUpdatePrograma({
      ...programa,
      partes: [...(programa.partes || []), ...extra, ...cloned],
    });

    onToast('¡Se crearon las asignaciones de estudiantes para la Sala Auxiliar!');
  };

  // Mover una parte entre salas
  const handleToggleRoom = (partId: string) => {
    if (!programa) return;
    const updated = (programa.partes || []).map((p) => {
      if (p.id === partId) {
        const toAux = !p.es_clase_auxiliar;
        let newTitle = p.titulo;
        if (toAux && !newTitle.includes('(Sala auxiliar)')) {
          newTitle = `${newTitle} (Sala auxiliar)`;
        } else if (!toAux && newTitle.includes('(Sala auxiliar)')) {
          newTitle = newTitle.replace(' (Sala auxiliar)', '').trim();
        }
        return {
          ...p,
          es_clase_auxiliar: toAux,
          titulo: newTitle,
        };
      }
      return p;
    });

    onUpdatePrograma({
      ...programa,
      partes: updated,
    });

    onToast('Asignación transferida de sala correctamente.');
  };

  // Actualizar lección de una parte en sala auxiliar
  const handleUpdateLesson = (partId: string, lessonNum: number) => {
    if (!programa) return;
    const lesson = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum);
    const updated = (programa.partes || []).map((p) => {
      if (p.id === partId) {
        return {
          ...p,
          leccion_numero: lessonNum,
          leccion_titulo: lesson ? lesson.title : `Lección ${lessonNum}`,
          leccion_estado: 'pendiente' as const,
        };
      }
      return p;
    });

    onUpdatePrograma({
      ...programa,
      partes: updated,
    });
    onToast(`Lección ${lessonNum} asignada.`);
  };

  // Texto del mensaje de WhatsApp para el consejero
  const whatsAppMessage = useMemo(() => {
    if (!programa) return '';
    const name = counselorPart?.asignado_nombre || 'Hermano';
    let msg = `🏛️ *REUNIÓN VIDA Y MINISTERIO CRISTIANOS*\n`;
    msg += `📍 *Sala Auxiliar — Consejero Designado*\n\n`;
    msg += `Estimado hermano *${name}*,\n`;
    msg += `Te saludamos con aprecio cristiano. Te recordamos tu asignación como *Consejero de la Sala Auxiliar* para la semana del *${programa.rango_semana || programa.semana_fecha}* (Lectura: *${programa.lectura_semana || 'Biblia'}*).\n\n`;
    msg += `📋 *Asignaciones en tu sala:*\n`;

    if (auxStudentParts.length === 0) {
      msg += `_(Aún no hay estudiantes asignados en la sala auxiliar)_\n`;
    } else {
      auxStudentParts.forEach((sp, i) => {
        msg += `\n*${i + 1}. ${sp.titulo}* (${sp.duracion_min} min)\n`;
        msg += `   👤 Estudiante: *${sp.asignado_nombre || 'Por asignar'}*\n`;
        if (sp.asignado_auxiliar_nombre) {
          msg += `   👥 Ayudante: *${sp.asignado_auxiliar_nombre}*\n`;
        }
        if (sp.leccion_numero) {
          msg += `   📖 Punto de consejo: *Lección ${sp.leccion_numero}* (${sp.leccion_titulo || ''})\n`;
        }
      });
    }

    msg += `\nGracias por tu valiosa ayuda al aconsejar y edificar a los estudiantes (1 Tes. 5:11).\n`;
    msg += `_Comité de Servicio de la Congregación_`;
    return msg;
  }, [counselorPart, programa, auxStudentParts]);

  // Enviar mensaje de WhatsApp
  const handleSendWhatsApp = () => {
    if (!currentCounselor || !currentCounselor.phone) {
      onToast('El consejero no tiene teléfono registrado. Copiando texto...');
      navigator.clipboard.writeText(whatsAppMessage);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
      return;
    }

    const cleanPhone = currentCounselor.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(whatsAppMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Copiar mensaje
  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
    onToast('Mensaje de WhatsApp copiado al portapapeles.');
  };

  // Descargar PDF del Consejero
  const handleDownloadPdf = () => {
    if (!programa) return;
    generateCounselorSheetPdf({
      congregationName,
      programa,
      counselorName: counselorPart?.asignado_nombre,
      publishers,
    });
    onToast('¡Hoja de trabajo del Consejero generada con éxito!');
  };

  // Imprimir Hoja de Trabajo
  const handlePrintWorksheet = () => {
    window.print();
  };

  if (!isOpen || !programa) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* ── HEADER DEL MODAL ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Consejero de la Sala Auxiliar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Sala Auxiliar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {programa.rango_semana || programa.semana_fecha} • Lectura:{' '}
                <span className="font-semibold text-slate-700 dark:text-zinc-200">
                  {programa.lectura_semana || 'Jeremías'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── PESTAÑAS INTERNAS ── */}
        <div className="flex items-center border-b border-slate-200 dark:border-white/[0.08] px-6 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('counselor')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'counselor'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            <span>Consejero y Estudiantes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-[10px]">
              {auxStudentParts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('worksheet')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'worksheet'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Hoja de Trabajo y Notas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balance')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'balance'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft size={14} />
            <span>Distribución de Salas (Auditorio ↔ Auxiliar)</span>
          </button>
        </div>

        {/* ── CONTENIDO PRINCIPAL SEGÚN PESTAÑA ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'counselor' && (
            <>
              {/* 1. TARJETA DEL CONSEJERO DESIGNADO */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <ShieldCheck size={26} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Consejero de la Sala Auxiliar (Esta Semana)
                      </span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {counselorPart?.asignado_nombre || 'Ningún consejero asignado todavía'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentCounselor ? (
                          <>
                            {currentCounselor.role === 'elder' || currentCounselor.privilege === 'anciano'
                              ? 'Anciano'
                              : 'Siervo Ministerial'}
                            {currentCounselor.phone && ` • Tel: ${currentCounselor.phone}`}
                          </>
                        ) : (
                          'Seleccione un anciano o siervo capacitado de la lista para asignar el rol.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Acciones para el Consejero */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAutoAssignCounselor}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                      title="Asignar automáticamente al anciano con menor rotación reciente"
                    >
                      <Sparkles size={13} />
                      <span>Auto-Asignar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                      title="Enviar resumen del programa y lecciones al Consejero por WhatsApp"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyWhatsApp}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 transition-all cursor-pointer"
                      title="Copiar texto del mensaje para el consejero"
                    >
                      <Copy size={13} />
                      <span>{copiedWhatsApp ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                      title="Descargar hoja de trabajo imprimible en PDF con apuntes para el consejo"
                    >
                      <FileDown size={13} />
                      <span>Hoja PDF</span>
                    </button>
                  </div>
                </div>

                {/* Selector de Consejero con rotación */}
                <div className="mt-4 pt-4 border-t border-amber-200/80 dark:border-amber-900/30">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cambiar Consejero Auxiliar (Lista filtrada por privilegios y rotación):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10">
                    {eligibleCounselors.map(({ publisher, timesAsCounselor, isElder, hasConflict }) => {
                      const pId = publisher.nid || publisher.id;
                      const isSelected = counselorPart?.asignado_nid === pId;

                      return (
                        <button
                          key={pId}
                          type="button"
                          onClick={() => handleAssignCounselor(pId || '')}
                          className={`p-2 rounded-lg text-left text-xs transition-all flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-zinc-200'
                          }`}
                        >
                          <div className="truncate pr-1">
                            <span className="truncate block font-medium">
                              {publisher.full_name || publisher.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {isElder ? 'Anciano' : 'Siervo'} • {timesAsCounselor} veces consejero
                            </span>
                          </div>
                          {hasConflict && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0"
                              title="Tiene otra asignación esta semana"
                            >
                              Ocupado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. LISTADO DE ESTUDIANTES EN SALA AUXILIAR */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Asignaciones de Estudiantes en Sala Auxiliar</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {auxStudentParts.length} partes
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Evaluación teocrática del folleto <em>Seamos mejores maestros</em> (20 lecciones).
                    </p>
                  </div>

                  {auxStudentParts.length === 0 && (
                    <button
                      type="button"
                      onClick={handleCloneStudentPartsToAux}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <PlusCircle size={13} />
                      <span>Clonar partes de Auditorio a Sala Auxiliar</span>
                    </button>
                  )}
                </div>

                {auxStudentParts.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30">
                    <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                      No hay estudiantes asignados a la Sala Auxiliar esta semana
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Puedes crear réplicas automáticas de las partes del auditorio o transferir estudiantes usando el botón de abajo.
                    </p>
                    <button
                      type="button"
                      onClick={handleCloneStudentPartsToAux}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>Crear partes para Sala Auxiliar</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auxStudentParts.map((part, index) => {
                      const studentPub = publishers.find(
                        (p) => (p.nid || p.id) === part.asignado_nid
                      );
                      const currentLessonNumber =
                        part.leccion_numero || studentPub?.currentLessonNumber || 1;
                      const lessonObj = OFFICIAL_STUDENT_LESSONS.find(
                        (l) => l.number === currentLessonNumber
                      );
                      const isCompleted = part.leccion_estado === 'completada';
                      const isRepeated = part.leccion_estado === 'continuar';

                      return (
                        <div
                          key={part.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-850 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <div>
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                  {part.titulo} ({part.duracion_min} min)
                                </h5>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                                  <span>
                                    Estudiante:{' '}
                                    <strong className="text-slate-800 dark:text-zinc-200">
                                      {part.asignado_nombre || 'Sin asignar'}
                                    </strong>
                                  </span>
                                  {part.asignado_auxiliar_nombre && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        Ayudante:{' '}
                                        <strong className="text-slate-800 dark:text-zinc-200">
                                          {part.asignado_auxiliar_nombre}
                                        </strong>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Badge de estado de lección */}
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300">
                                  <CheckCircle2 size={12} />
                                  <span>Lección Aprobada</span>
                                </span>
                              ) : isRepeated ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300">
                                  <RotateCcw size={12} />
                                  <span>Repetir Lección</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                                  <Clock size={12} />
                                  <span>Pendiente</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selector de lección y botones de evaluación para el Consejero */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                            {/* Selector de Lección */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 shrink-0">
                                Lección:
                              </span>
                              <select
                                value={currentLessonNumber}
                                onChange={(e) =>
                                  handleUpdateLesson(part.id, Number(e.target.value))
                                }
                                className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-medium max-w-[260px] truncate"
                              >
                                {OFFICIAL_STUDENT_LESSONS.map((l) => (
                                  <option key={l.number} value={l.number}>
                                    Lección {l.number}: {l.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Botones de acción del Consejero */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Aprobar Lección */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onCompleteLesson) onCompleteLesson(part);
                                  else {
                                    const updated = (programa.partes || []).map((p) =>
                                      p.id === part.id ? { ...p, leccion_estado: 'completada' as const } : p
                                    );
                                    onUpdatePrograma({ ...programa, partes: updated });
                                  }
                                  onToast('Lección aprobada por el Consejero.');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
                                title="Marcar lección como aprobada y avanzar en la ficha S-38"
                              >
                                <Check size={13} />
                                <span>Aprobar</span>
                              </button>

                              {/* Repetir Lección */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onRepeatLesson) onRepeatLesson(part);
                                  else {
                                    const updated = (programa.partes || []).map((p) =>
                                      p.id === part.id ? { ...p, leccion_estado: 'continuar' as const } : p
                                    );
                                    onUpdatePrograma({ ...programa, partes: updated });
                                  }
                                  onToast('Lección marcada para repetir.');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold transition-all cursor-pointer border border-amber-200 dark:border-amber-800"
                                title="Indicar que el estudiante volverá a practicar este punto"
                              >
                                <RotateCcw size={13} />
                                <span>Repetir</span>
                              </button>

                              {/* Ver Ficha S-38 */}
                              {studentPub && (
                                <button
                                  type="button"
                                  onClick={() => onOpenS38Modal(studentPub)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-semibold transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
                                  title="Ver tarjeta oficial S-38 con las 20 lecciones"
                                >
                                  <Award size={13} />
                                  <span>Ficha S-38</span>
                                </button>
                              )}

                              {/* Mover a Auditorio */}
                              <button
                                type="button"
                                onClick={() => handleToggleRoom(part.id)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium transition-all cursor-pointer"
                                title="Transferir esta parte al Auditorio Principal"
                              >
                                <ArrowRightLeft size={13} />
                                <span>A Auditorio</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'worksheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hoja de Observaciones del Consejero
                  </h4>
                  <p className="text-xs text-slate-400">
                    Anotaciones privadas para preparar el consejo constructivo individual.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <FileDown size={13} />
                    <span>Descargar PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintWorksheet}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {auxStudentParts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No hay estudiantes en la sala auxiliar para evaluar.
                </p>
              ) : (
                <div className="space-y-4">
                  {auxStudentParts.map((sp, idx) => (
                    <div
                      key={sp.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-white">
                          {idx + 1}. {sp.titulo}
                        </span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {sp.asignado_nombre || 'Sin nombre'} • Lección {sp.leccion_numero || 1}
                        </span>
                      </div>
                      <textarea
                        value={counselorNotes[sp.id] || ''}
                        onChange={(e) =>
                          setCounselorNotes({
                            ...counselorNotes,
                            [sp.id]: e.target.value,
                          })
                        }
                        placeholder={`Escriba notas para felicitar y aconsejar a ${sp.asignado_nombre || 'el estudiante'} sobre el punto de oratoria...`}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-850 text-slate-800 dark:text-white resize-y min-h-[75px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'balance' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Distribución de Partes entre Salas
                </h4>
                <p className="text-xs text-slate-400">
                  Transfiere asignaciones de estudiantes entre el Auditorio Principal y la Sala Auxiliar según las necesidades teocráticas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna Auditorio Principal */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                      Auditorio Principal ({mainStudentParts.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {mainStudentParts.map((mp) => (
                      <div
                        key={mp.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-800 dark:text-white truncate">
                            {mp.titulo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {mp.asignado_nombre || 'Sin asignar'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRoom(mp.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[11px] shrink-0 cursor-pointer"
                          title="Enviar a la Sala Auxiliar"
                        >
                          <span>A Sala Auxiliar</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna Sala Auxiliar */}
                <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/80 dark:border-amber-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Sala Auxiliar ({auxStudentParts.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {auxStudentParts.map((ap) => (
                      <div
                        key={ap.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-800 dark:text-white truncate">
                            {ap.titulo}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {ap.asignado_nombre || 'Sin asignar'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRoom(ap.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold text-[11px] shrink-0 cursor-pointer"
                          title="Enviar al Auditorio Principal"
                        >
                          <ChevronRight size={13} className="rotate-180" />
                          <span>A Auditorio</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER DEL MODAL ── */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            {counselorPart?.asignado_nombre
              ? `Consejero asignado: ${counselorPart.asignado_nombre}`
              : 'Se recomienda nombrar un anciano o siervo ministerial idóneo.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold text-slate-800 dark:text-white transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
