// src/components/PublisherEditor/sections/S21RecordsSection.tsx
import React, { useMemo } from 'react';
import { Publisher } from '../../../types';
import {
  Check,
  Clock,
  FileSpreadsheet,
  CalendarDays,
  Award,
  Lock,
  CheckCheck,
  Copy,
  BarChart3,
  Download,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/AuthContext';

interface S21RecordsSectionProps {
  formData: Publisher;
  selectedServiceYear: string;
  setSelectedServiceYear: (val: string) => void;
  handleS21ChangeLocal: (monthIdx: number, field: string, value: any) => void;
}

const SERVICE_YEARS = ['2024', '2025', '2026', '2027'];

const MONTHS = [
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
];

export const S21RecordsSection: React.FC<S21RecordsSectionProps> = ({
  formData,
  selectedServiceYear,
  setSelectedServiceYear,
  handleS21ChangeLocal,
}) => {
  const { showToast } = useToast();
  const { canEditS21 } = usePermissions();

  const currentRecords = useMemo(() => {
    const existing = (formData.s21_records || {})[selectedServiceYear];
    if (Array.isArray(existing) && existing.length === 12) {
      return existing;
    }
    return MONTHS.map((m, i) => ({
      month: m,
      participated: existing?.[i]?.participated ?? false,
      bible_studies: existing?.[i]?.bible_studies ?? 0,
      auxiliary_pioneer: existing?.[i]?.auxiliary_pioneer ?? false,
      hours: existing?.[i]?.hours ?? 0,
      credit: existing?.[i]?.credit ?? 0,
      late: existing?.[i]?.late ?? false,
      comments: existing?.[i]?.comments ?? '',
    }));
  }, [formData.s21_records, selectedServiceYear]);

  const metrics = useMemo(() => {
    const activeMonths = currentRecords.filter(
      (r: any) => r.participated || (r.hours || 0) > 0
    ).length;
    const totalHours = currentRecords.reduce(
      (acc: number, r: any) => acc + (Number(r.hours) || 0),
      0
    );
    const totalCredit = currentRecords.reduce(
      (acc: number, r: any) => acc + (Number(r.credit) || 0),
      0
    );
    const combinedHours = totalHours + totalCredit;
    const avgHours = activeMonths > 0 ? (totalHours / activeMonths).toFixed(1) : '0.0';
    const maxStudies = Math.max(
      0,
      ...currentRecords.map((r: any) => Number(r.bible_studies) || 0)
    );
    const avgStudies =
      activeMonths > 0
        ? (
            currentRecords.reduce(
              (acc: number, r: any) => acc + (Number(r.bible_studies) || 0),
              0
            ) / activeMonths
          ).toFixed(1)
        : '0.0';
    const auxMonths = currentRecords.filter((r: any) => r.auxiliary_pioneer).length;

    return {
      activeMonths,
      totalHours,
      totalCredit,
      combinedHours,
      avgHours,
      maxStudies,
      avgStudies,
      auxMonths,
    };
  }, [currentRecords]);

  const chartData = useMemo(
    () =>
      currentRecords.map((record: any) => ({
        name: record.month.substring(0, 3).toUpperCase(),
        horas: (Number(record.hours) || 0) + (Number(record.credit) || 0),
        estudios: Number(record.bible_studies) || 0,
        participated: Boolean(record.participated || (Number(record.hours) || 0) > 0),
      })),
    [currentRecords]
  );

  const handleMarkAllActive = () => {
    if (!canEditS21) return;
    currentRecords.forEach((_: any, idx: number) => {
      handleS21ChangeLocal(idx, 'participated', true);
    });
    showToast(`Los 12 meses de ${selectedServiceYear} fueron marcados con participación`);
  };

  const handleCopyPreviousMonth = (idx: number) => {
    if (!canEditS21 || idx <= 0) return;
    const prev = currentRecords[idx - 1];
    handleS21ChangeLocal(idx, 'participated', Boolean(prev.participated));
    handleS21ChangeLocal(idx, 'bible_studies', Number(prev.bible_studies) || 0);
    handleS21ChangeLocal(idx, 'auxiliary_pioneer', Boolean(prev.auxiliary_pioneer));
    handleS21ChangeLocal(idx, 'hours', Number(prev.hours) || 0);
    handleS21ChangeLocal(idx, 'credit', Number(prev.credit) || 0);
    showToast(`Datos copiados de ${prev.month} a ${currentRecords[idx].month}`);
  };

  const handleExportCsv = () => {
    const pubName = (formData.full_name || formData.name || 'Publicador').replace(/,/g, ' ');
    const headers = [
      'Mes',
      'Participo',
      'Cursos Biblicos',
      'Precursor Auxiliar',
      'Horas',
      'Credito',
      'Entregado Tarde',
      'Observaciones',
    ];
    const rows = currentRecords.map((r: any) => [
      r.month,
      r.participated ? 'Si' : 'No',
      r.bible_studies || 0,
      r.auxiliary_pioneer ? 'Si' : 'No',
      r.hours || 0,
      r.credit || 0,
      r.late ? 'Si' : 'No',
      `"${(r.comments || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `S21_${pubName.replace(/\s+/g, '_')}_${selectedServiceYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Registro S-21 (${selectedServiceYear}) exportado en CSV`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-8">
      {!canEditS21 && (
        <div className="flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
          <Lock size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Modo consulta:</strong> El registro oficial S-21 solo puede ser modificado por el Secretario o el Coordinador.
          </span>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL S-21 */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {/* Cabecera Editorial */}
        <div className="p-6 md:px-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-500/20 kg-glow-badge shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Registro de Publicador de la Congregación (S-21)
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                  · Año de servicio {selectedServiceYear}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Control mensual de participación en el ministerio, cursos bíblicos, precursorado auxiliar y horas acreditadas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Año de Servicio */}
            <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200/70 dark:border-white/[0.06]">
              {SERVICE_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedServiceYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tabular-nums transition-all cursor-pointer ${
                    selectedServiceYear === year
                      ? 'bg-white dark:bg-amber-500 text-amber-700 dark:text-white shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {canEditS21 && (
              <button
                type="button"
                onClick={handleMarkAllActive}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 text-xs font-semibold transition-colors cursor-pointer"
                title="Marcar participación en los 12 meses del año seleccionado"
              >
                <CheckCheck size={14} />
                <span>Año activo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 border border-zinc-200/60 dark:border-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
              title="Descargar tarjeta S-21 en formato CSV"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Cinta de Métricas Anuales (Tabular Nums) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/60 dark:bg-white/[0.01] border-b border-zinc-100 dark:border-white/[0.05]">
          <div className="px-5 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Meses Activos
            </span>
            <p className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
              {metrics.activeMonths}{' '}
              <span className="text-xs font-normal text-zinc-400">/ 12</span>
            </p>
          </div>
          <div className="px-5 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Total Horas
            </span>
            <p className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.totalHours}
              {metrics.totalCredit > 0 && (
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 ml-1">
                  (+{metrics.totalCredit} cr.)
                </span>
              )}
            </p>
          </div>
          <div className="px-5 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Promedio Horas
            </span>
            <p className="text-lg font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
              {metrics.avgHours} <span className="text-xs font-normal text-zinc-400">h/mes</span>
            </p>
          </div>
          <div className="px-5 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Cursos Bíblicos
            </span>
            <p className="text-lg font-bold font-mono tabular-nums text-violet-600 dark:text-violet-400 mt-0.5">
              {metrics.avgStudies}{' '}
              <span className="text-xs font-normal text-zinc-400">
                prom. (máx {metrics.maxStudies})
              </span>
            </p>
          </div>
          <div className="px-5 py-3.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              P. Auxiliar
            </span>
            <p className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.auxMonths}{' '}
              <span className="text-xs font-normal text-zinc-400">
                {metrics.auxMonths === 1 ? 'mes' : 'meses'}
              </span>
            </p>
          </div>
        </div>

        {/* Tabla Oficial de 12 Meses */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-white/[0.05] text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-50/30 dark:bg-white/[0.01]">
                <th className="py-3 pl-6 pr-3">Mes</th>
                <th className="py-3 px-2 text-center">Participó</th>
                <th className="py-3 px-2 text-center">Cursos B.</th>
                <th className="py-3 px-2 text-center">P. Aux.</th>
                <th className="py-3 px-2 text-center">Horas</th>
                <th className="py-3 px-2 text-center">Crédito</th>
                <th className="py-3 px-2 text-center">Tarde</th>
                <th className="py-3 pl-3 pr-6 min-w-[200px]">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
              {currentRecords.map((record: any, idx: number) => {
                const displayMonth =
                  record.month.charAt(0).toUpperCase() + record.month.slice(1);
                const isActive = Boolean(record.participated || (record.hours || 0) > 0);

                return (
                  <tr
                    key={record.month}
                    className={`group transition-colors ${
                      isActive
                        ? 'bg-amber-50/30 dark:bg-amber-500/[0.04]'
                        : 'hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-2.5 pl-6 pr-3 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive
                                ? 'bg-amber-500'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              isActive
                                ? 'text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {displayMonth}
                          </span>
                        </div>
                        {canEditS21 && idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCopyPreviousMonth(idx)}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-all cursor-pointer"
                            title={`Copiar valores del mes anterior (${currentRecords[idx - 1].month})`}
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Participó */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        disabled={!canEditS21}
                        onClick={() =>
                          handleS21ChangeLocal(idx, 'participated', !record.participated)
                        }
                        className={`w-7 h-7 mx-auto rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          record.participated
                            ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.1] hover:border-amber-400'
                        }`}
                        aria-label={`Participó en ${displayMonth}`}
                      >
                        {record.participated && <Check size={14} strokeWidth={3.5} />}
                      </button>
                    </td>

                    {/* Cursos Bíblicos */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        disabled={!canEditS21}
                        value={record.bible_studies || ''}
                        onChange={(e) =>
                          handleS21ChangeLocal(
                            idx,
                            'bible_studies',
                            Math.max(0, parseInt(e.target.value, 10) || 0)
                          )
                        }
                        placeholder="0"
                        className={`w-14 h-8 mx-auto bg-white dark:bg-zinc-900 border rounded-lg text-center text-xs font-mono tabular-nums font-bold focus:outline-none transition-all ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          record.bible_studies > 0
                            ? 'border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/30'
                            : 'border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 focus:border-amber-500'
                        }`}
                      />
                    </td>

                    {/* Precursor Auxiliar */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        disabled={!canEditS21}
                        onClick={() =>
                          handleS21ChangeLocal(
                            idx,
                            'auxiliary_pioneer',
                            !record.auxiliary_pioneer
                          )
                        }
                        className={`w-7 h-7 mx-auto rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          record.auxiliary_pioneer
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.1] hover:border-emerald-400'
                        }`}
                        aria-label={`Precursor auxiliar en ${displayMonth}`}
                      >
                        {record.auxiliary_pioneer && <Award size={13} strokeWidth={2.5} />}
                      </button>
                    </td>

                    {/* Horas */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        disabled={!canEditS21}
                        value={record.hours || ''}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          handleS21ChangeLocal(idx, 'hours', val);
                          if (val > 0 && !record.participated) {
                            handleS21ChangeLocal(idx, 'participated', true);
                          }
                        }}
                        placeholder="0"
                        className={`w-16 h-8 mx-auto bg-white dark:bg-zinc-900 border rounded-lg text-center text-xs font-mono tabular-nums font-bold focus:outline-none transition-all ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          record.hours > 0
                            ? 'border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30'
                            : 'border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 focus:border-amber-500'
                        }`}
                      />
                    </td>

                    {/* Crédito */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        disabled={!canEditS21}
                        value={record.credit || ''}
                        onChange={(e) =>
                          handleS21ChangeLocal(
                            idx,
                            'credit',
                            Math.max(0, parseInt(e.target.value, 10) || 0)
                          )
                        }
                        placeholder="0"
                        className={`w-14 h-8 mx-auto bg-white dark:bg-zinc-900 border rounded-lg text-center text-xs font-mono tabular-nums font-bold focus:outline-none transition-all ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          record.credit > 0
                            ? 'border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/30'
                            : 'border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 focus:border-sky-500'
                        }`}
                      />
                    </td>

                    {/* Entregado Tarde */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        disabled={!canEditS21}
                        onClick={() => handleS21ChangeLocal(idx, 'late', !record.late)}
                        className={`w-7 h-7 mx-auto rounded-lg border transition-all flex items-center justify-center cursor-pointer ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        } ${
                          record.late
                            ? 'bg-rose-500 border-rose-500 text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.1] hover:border-rose-400'
                        }`}
                        title="Informe entregado después del cierre mensual"
                      >
                        {record.late && <Clock size={13} strokeWidth={2.5} />}
                      </button>
                    </td>

                    {/* Observaciones */}
                    <td className="py-2 pl-3 pr-6">
                      <input
                        type="text"
                        disabled={!canEditS21}
                        value={record.comments || ''}
                        onChange={(e) => handleS21ChangeLocal(idx, 'comments', e.target.value)}
                        placeholder="Nota mensual (ej. P. Aux. 15h, salud...)"
                        className={`w-full h-8 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 ${
                          !canEditS21 ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* GRÁFICO DE TENDENCIA ANUAL */}
      <section className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 p-6 md:p-8 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2.5">
            <BarChart3 size={18} className="text-amber-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Curva de Actividad del Año de Servicio {selectedServiceYear}
            </h4>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Horas (con crédito)
            </span>
            <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
              <span className="w-3 h-0.5 bg-violet-500 inline-block rounded-full" /> Cursos bíblicos
            </span>
          </div>
        </div>

        <div className="h-52 w-full relative">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
          >
            {[20, 65, 110, 155].map((y, idx) => (
              <line
                key={idx}
                x1="10"
                y1={y}
                x2="590"
                y2={y}
                stroke="currentColor"
                className="text-zinc-100 dark:text-white/[0.05]"
                strokeDasharray="3 3"
              />
            ))}

            {chartData.map((d: any, idx: number) => {
              const maxHours = Math.max(30, ...chartData.map((c: any) => c.horas));
              const height = maxHours > 0 ? (d.horas / maxHours) * 130 : 0;
              const x = idx * 48 + 22;
              const y = 155 - height;
              return (
                <g key={idx} className="group">
                  <rect
                    x={x}
                    y={d.horas > 0 ? y : 151}
                    width={22}
                    height={d.horas > 0 ? Math.max(4, height) : 4}
                    rx={4}
                    className={
                      d.horas > 0
                        ? 'fill-amber-500 hover:fill-amber-400 transition-colors'
                        : d.participated
                        ? 'fill-amber-500/35'
                        : 'fill-zinc-200 dark:fill-zinc-800'
                    }
                  />
                  <text
                    x={x + 11}
                    y={175}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-zinc-400 select-none"
                  >
                    {d.name}
                  </text>
                  {d.horas > 0 && (
                    <text
                      x={x + 11}
                      y={Math.max(12, y - 5)}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold fill-amber-600 dark:fill-amber-400 select-none"
                    >
                      {d.horas}h
                    </text>
                  )}
                </g>
              );
            })}

            {(() => {
              const maxEstudios = Math.max(5, ...chartData.map((c: any) => c.estudios));
              const points = chartData
                .map((d: any, idx: number) => {
                  const x = idx * 48 + 33;
                  const y = 155 - (d.estudios / maxEstudios) * 115;
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <>
                  <polyline
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    points={points}
                  />
                  {chartData.map((d: any, idx: number) => {
                    const x = idx * 48 + 33;
                    const y = 155 - (d.estudios / maxEstudios) * 115;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r={3}
                        fill="#fff"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </section>
    </div>
  );
};
