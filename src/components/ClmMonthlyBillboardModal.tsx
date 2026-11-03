import React, { useState, useMemo } from 'react';
import type { ClmPrograma, Publisher } from '../types';
import {
  getMondaysInMonth,
  generateMonthlyBillboardPdf,
} from '../utils/clmBillboardPdf';
import {
  X,
  Printer,
  Download,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Music,
  Users,
  Award,
} from 'lucide-react';

export interface ClmMonthlyBillboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  congregationName: string;
  clmProgramas: Record<string, ClmPrograma>;
  publishers: Publisher[];
  currentDate?: Date;
  onPublishToBillboard?: () => void;
}

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const ClmMonthlyBillboardModal: React.FC<ClmMonthlyBillboardModalProps> = ({
  isOpen,
  onClose,
  congregationName,
  clmProgramas,
  publishers,
  currentDate = new Date(),
  onPublishToBillboard,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => currentDate.getMonth());
  const [publishedToast, setPublishedToast] = useState(false);

  // Semanas correspondientes al mes seleccionado
  const monthWeeks = useMemo(() => {
    const mondays = getMondaysInMonth(selectedYear, selectedMonth);

    return mondays.map((mondayStr) => {
      // Buscar en el diccionario de programas guardados
      const existing = clmProgramas[mondayStr];
      if (existing) return existing;

      // Si no existe, crear un objeto básico de vista
      const d = new Date(mondayStr);
      const yr = d.getFullYear();
      const wkNum = Math.ceil(((d.getTime() - new Date(yr, 0, 1).getTime()) / 86400000 + 1) / 7);
      return {
        id: `prog-${mondayStr}`,
        semana_fecha: mondayStr,
        anio: yr,
        semana_num: wkNum,
        rango_semana: `Semana del ${mondayStr}`,
        texto_año: '',
        lectura_semanal: '',
        partes: [],
        estado: 'borrador' as const,
      };
    });
  }, [selectedYear, selectedMonth, clmProgramas]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleDownloadPdf = () => {
    generateMonthlyBillboardPdf({
      congregationName,
      year: selectedYear,
      month: selectedMonth,
      programas: monthWeeks,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePublish = () => {
    if (onPublishToBillboard) {
      onPublishToBillboard();
    }
    setPublishedToast(true);
    setTimeout(() => setPublishedToast(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Programa mensual para la cartelera"
    >
      <div className="kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-[#18181F]/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="kg-glow-badge w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                Tablero de Anuncios Oficial
              </span>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                Programa Mensual para la Cartelera (VMC)
              </h3>
            </div>
          </div>

          {/* Acciones principales de descarga e impresión */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Descargar documento PDF oficial apaisado para imprimir"
              aria-label="Descargar PDF apaisado del programa mensual"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Descargar PDF Apaisado</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
              title="Imprimir directamente"
              aria-label="Imprimir programa mensual"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Publicar en el tablero digital de la congregación"
              aria-label="Publicar programa mensual en cartelera digital"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Publicar en Cartelera</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar programa mensual para la cartelera"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra selectora de mes */}
        <div className="px-6 py-2.5 bg-zinc-100/60 dark:bg-[#18181F]/40 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 cursor-pointer"
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-bold text-zinc-900 dark:text-white min-w-[140px] text-center">
              {MONTHS_ES[selectedMonth]} {selectedYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 cursor-pointer"
              title="Mes siguiente"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            {monthWeeks.length} semanas en este mes • Orientación apaisada (A4 Horizontal)
          </div>
        </div>

        {publishedToast && (
          <div className="bg-emerald-500 text-white text-xs font-bold py-2 px-6 flex items-center justify-between">
            <span>¡Programa mensual publicado exitosamente en la Cartelera Digital!</span>
            <CheckCircle2 size={14} />
          </div>
        )}

        {/* ── VISTA PREVIA DEL CARTEL EN PANTALLA ── */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-zinc-100 dark:bg-zinc-950">
          <div className="printable-billboard max-w-5xl mx-auto bg-white text-zinc-900 rounded-2xl shadow-xl border border-zinc-300 p-5 font-sans min-w-[760px]">
            {/* Cabecera del cartel estilo Salón del Reino */}
            <div className="bg-zinc-900 text-white p-3.5 rounded-xl text-center mb-4">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
                PROGRAMA DE LA REUNIÓN VIDA Y MINISTERIO CRISTIANOS
              </h2>
              <p className="text-xs font-medium text-zinc-300 mt-0.5">
                CONGREGACIÓN {congregationName.toUpperCase()} — {MONTHS_ES[selectedMonth].toUpperCase()} DE {selectedYear}
              </p>
            </div>

            {/* Columnas de Semanas */}
            <div className="grid grid-cols-4 lg:grid-cols-5 gap-3 items-start">
              {monthWeeks.map((prog, idx) => {
                const presPart = prog.partes.find((p) => p.tipo === 'presidente');
                const tesoros = prog.partes.filter((p) => p.seccion === 'tesoros');
                const maestros = prog.partes.filter((p) => p.seccion === 'maestros');
                const vida = prog.partes.filter(
                  (p) => p.seccion === 'vida_cristiana' && p.tipo !== 'canto'
                );
                const auxCounselor = prog.partes.find((p) => p.tipo === 'conductor_auxiliar');

                return (
                  <div
                    key={prog.id || idx}
                    className="border border-zinc-300 rounded-xl overflow-hidden bg-white flex flex-col text-xs shadow-2xs"
                  >
                    {/* Título de la semana */}
                    <div className="bg-zinc-100 p-2 text-center border-b border-zinc-200">
                      <span className="font-extrabold text-[11px] text-zinc-900 block leading-tight">
                        {prog.rango_semana || `Semana ${prog.semana_fecha}`}
                      </span>
                      <span className="text-[10px] text-zinc-600 block mt-0.5">
                        Pres: <strong>{presPart?.asignado_nombre || '---'}</strong>
                      </span>
                    </div>

                    <div className="p-2 space-y-2.5 flex-1">
                      {/* 1. Tesoros de la Biblia */}
                      <div>
                        <div className="bg-[#2a6b77] text-white text-[9px] font-bold uppercase py-0.5 px-1.5 rounded-sm text-center mb-1">
                          Tesoros de la Biblia
                        </div>
                        {tesoros.length === 0 ? (
                          <p className="text-[10px] text-zinc-400 italic">Sin datos</p>
                        ) : (
                          tesoros.map((tp) => (
                            <div key={tp.id} className="mb-1 text-[10px] leading-tight">
                              <span className="font-semibold text-zinc-800 block">
                                {tp.tipo === 'discurso_tesoros'
                                  ? 'Discurso (10 min)'
                                  : tp.tipo === 'busquemos_perlas'
                                  ? 'Perlas (10 min)'
                                  : 'Lectura de la Biblia'}
                              </span>
                              <span className="text-zinc-900 font-medium pl-1 block">
                                • {tp.asignado_nombre || '(Sin asignar)'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* 2. Seamos Mejores Maestros */}
                      <div>
                        <div className="bg-[#9b6d17] text-white text-[9px] font-bold uppercase py-0.5 px-1.5 rounded-sm text-center mb-1">
                          Seamos Mejores Maestros
                        </div>
                        {maestros.length === 0 ? (
                          <p className="text-[10px] text-zinc-400 italic">Sin datos</p>
                        ) : (
                          maestros.map((mp) => (
                            <div key={mp.id} className="mb-1 text-[10px] leading-tight">
                              <span className="font-semibold text-zinc-800 block truncate" title={mp.titulo}>
                                {mp.es_clase_auxiliar ? '[Aux] ' : ''}{mp.titulo}
                              </span>
                              <span className="text-zinc-900 font-medium pl-1 block">
                                • {mp.asignado_nombre || '(Sin asignar)'}
                                {mp.asignado_auxiliar_nombre ? ` / ${mp.asignado_auxiliar_nombre}` : ''}
                              </span>
                              {mp.leccion_numero && (
                                <span className="text-[9px] text-zinc-500 pl-1 block">
                                  Lección #{mp.leccion_numero}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* 3. Nuestra Vida Cristiana */}
                      <div>
                        <div className="bg-[#942926] text-white text-[9px] font-bold uppercase py-0.5 px-1.5 rounded-sm text-center mb-1">
                          Nuestra Vida Cristiana
                        </div>
                        {vida.length === 0 ? (
                          <p className="text-[10px] text-zinc-400 italic">Sin datos</p>
                        ) : (
                          vida.map((vp) => (
                            <div key={vp.id} className="mb-1 text-[10px] leading-tight">
                              <span className="font-semibold text-zinc-800 block truncate" title={vp.titulo}>
                                {vp.titulo}
                              </span>
                              <span className="text-zinc-900 font-medium pl-1 block">
                                • {vp.asignado_nombre || '(Sin asignar)'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Consejero Sala Auxiliar */}
                      {auxCounselor?.asignado_nombre && (
                        <div className="bg-amber-50 border border-amber-200 p-1 rounded text-[9px] text-amber-900">
                          <span className="font-bold block">Consejero Sala Aux.:</span>
                          <span>{auxCounselor.asignado_nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pie de cartelera */}
            <div className="mt-4 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500">
              <span>Cartelera Oficial del Salón del Reino • Vida y Ministerio Cristianos</span>
              <span>Generado con Kongre el {new Date().toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181F]/80 flex items-center justify-between text-xs text-zinc-500">
          <span>El PDF se adapta automáticamente a 4 o 5 semanas en formato horizontal A4.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
