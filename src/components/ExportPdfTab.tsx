// src/components/ExportPdfTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useCongregation } from '../context/CongregationContext';
import {
  generateProgramPdf,
  generateProgramPdfBlobUrl,
  generateS89Pdf,
  generateS89PdfBlobUrl,
} from '../utils/pdfGenerator';
import { createAssignmentWhatsAppMessage, openWhatsAppLink } from '../utils/whatsapp';
import { exportScheduleToCsvExcel } from '../utils/excelExport';
import { downloadMonthIcsSchedule } from '../utils/calendarExport';
import { SplashCheckbox } from './SplashCheckbox';
import {
  FileText,
  Printer,
  Download,
  Sliders,
  Eye,
  MessageCircle,
  FileCheck,
  FileSpreadsheet,
  CalendarDays,
  Copy,
  CheckCircle2,
  RectangleVertical,
  RectangleHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { LocalOfficialFormsCenter } from './LocalOfficialFormsCenter';

export const ExportPdfTab: React.FC = () => {
  const { weeks, publishersMap, settings, updateSettings, currentWeek } = useCongregation();

  const [activeTemplate, setActiveTemplate] = useState<
    'clasica' | 'moderna' | 'minimalista' | 'color' | 'oficial'
  >(
    settings.pdfTemplate === 'color' ||
      settings.pdfTemplate === 'clasica' ||
      settings.pdfTemplate === 'moderna' ||
      settings.pdfTemplate === 'minimalista'
      ? settings.pdfTemplate
      : 'oficial'
  );
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>(settings.pdfPageSize || 'letter');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>(
    settings.pdfOrientation || 'portrait'
  );
  const [showMidweek, setShowMidweek] = useState(settings.pdfSections.midweek);
  const [showWeekend, setShowWeekend] = useState(settings.pdfSections.weekend);
  const [showDuties, setShowDuties] = useState(settings.pdfSections.duties);
  const [showCleaning, setShowCleaning] = useState(settings.pdfSections.cleaning);
  const [activeTab, setActiveTab] = useState<'programa' | 's89' | 'whatsapp' | 'formatos_oficiales'>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      if (h.includes('formatos')) return 'formatos_oficiales';
    }
    return 'programa';
  });
  const [notifiedKeys, setNotifiedKeys] = useState<Record<string, boolean>>({});
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [pdfCongregationName, setPdfCongregationName] = useState(settings.congregationName || '');

  // Preview state (Interactive Paper Sheet vs Embedded Generated PDF & Fullscreen Preview Modal)
  const [previewMode, setPreviewMode] = useState<'sheet' | 'pdf'>('sheet');
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewModalDocType, setPreviewModalDocType] = useState<'programa' | 's89'>('programa');

  useEffect(() => {
    setPdfCongregationName(settings.congregationName || '');
  }, [settings.congregationName]);

  const getEffectivePdfSettings = useCallback(() => {
    return {
      ...settings,
      congregationName: pdfCongregationName.trim() || settings.congregationName || 'Congregación',
      pdfTemplate: activeTemplate,
      pdfPageSize: pageSize,
      pdfOrientation: pageOrientation,
      pdfSections: {
        midweek: showMidweek,
        weekend: showWeekend,
        duties: showDuties,
        cleaning: showCleaning,
      },
    };
  }, [
    settings,
    pdfCongregationName,
    activeTemplate,
    pageSize,
    pageOrientation,
    showMidweek,
    showWeekend,
    showDuties,
    showCleaning,
  ]);

  // Regenerate real PDF Blob URL whenever preview mode or modal is active and options change
  useEffect(() => {
    if (previewMode !== 'pdf' && !isPreviewModalOpen) return;

    let generatedUrl: string | null = null;
    try {
      if (isPreviewModalOpen && previewModalDocType === 's89' && currentWeek) {
        generatedUrl = generateS89PdfBlobUrl(
          currentWeek,
          publishersMap,
          pdfCongregationName.trim() || settings.congregationName || 'Congregación',
          pageSize,
          pageOrientation
        );
      } else if (activeTab === 's89' && !isPreviewModalOpen && currentWeek) {
        generatedUrl = generateS89PdfBlobUrl(
          currentWeek,
          publishersMap,
          pdfCongregationName.trim() || settings.congregationName || 'Congregación',
          pageSize,
          pageOrientation
        );
      } else {
        generatedUrl = generateProgramPdfBlobUrl(
          weeks,
          publishersMap,
          getEffectivePdfSettings()
        );
      }
      setPdfBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return generatedUrl;
      });
    } catch (err) {
      console.error('Error generando vista previa PDF:', err);
    }

    return () => {
      if (generatedUrl) {
        URL.revokeObjectURL(generatedUrl);
      }
    };
  }, [
    previewMode,
    isPreviewModalOpen,
    previewModalDocType,
    activeTab,
    weeks,
    currentWeek,
    publishersMap,
    pageSize,
    pageOrientation,
    pdfCongregationName,
    settings.congregationName,
    getEffectivePdfSettings,
  ]);

  const handleOpenPreviewBeforeDownload = (docType: 'programa' | 's89') => {
    setPreviewModalDocType(docType);
    setIsPreviewModalOpen(true);
  };

  const handleDownloadPdf = () => {
    generateProgramPdf(weeks, publishersMap, getEffectivePdfSettings());
  };

  const handleDownloadExcel = () => {
    exportScheduleToCsvExcel(weeks, publishersMap, {
      ...settings,
      congregationName: pdfCongregationName.trim() || settings.congregationName || 'Congregación',
    });
  };

  const handleDownloadIcs = () => {
    downloadMonthIcsSchedule(weeks, publishersMap, settings);
  };

  const handleDownloadS89 = () => {
    if (!currentWeek) return;
    generateS89Pdf(
      currentWeek,
      publishersMap,
      pdfCongregationName.trim() || settings.congregationName,
      pageSize,
      pageOrientation
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleNotified = (key: string) => {
    setNotifiedKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyWeekSummary = () => {
    if (!currentWeek) return;
    const getPub = (id?: string) => (id ? publishersMap.get(id)?.name || '---' : '---');

    let text = `📋 *PROGRAMA DE REUNIONES - ${settings.congregationName.toUpperCase()}*\n`;
    text += `Semana del ${currentWeek.weekStartDate} al ${currentWeek.weekEndDate}\n\n`;

    if (!currentWeek.specialEvent?.noMeetingMidweek) {
      text += `🏛 *VIDA Y MINISTERIO CRISTIANOS* (${currentWeek.midweek.date} - ${settings.midweekMeetingTime})\n`;
      text += `• Presidente: ${getPub(currentWeek.midweek.presidentId)}\n`;
      text += `• Oraciones: ${getPub(currentWeek.midweek.initialPrayerId)} / ${getPub(currentWeek.midweek.finalPrayerId)}\n`;
      text += `• Tesoros: ${currentWeek.midweek.tesoros.discurso.title} (${getPub(currentWeek.midweek.tesoros.discurso.publisherId)})\n`;
      text += `• Perlas: ${getPub(currentWeek.midweek.tesoros.perlas.publisherId)}\n`;
      text += `• Lectura: ${getPub(currentWeek.midweek.tesoros.lecturaBiblia.publisherId)}\n`;
      currentWeek.midweek.maestros.items.forEach((m, idx) => {
        text += `• Maestros #${idx + 1}: ${m.title} -> ${getPub(m.publisherId)}${
          m.assistantId ? ` (Ayudante: ${getPub(m.assistantId)})` : ''
        }\n`;
      });
      text += `• Estudio Bíblico: Conductor: ${getPub(
        currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId
      )} | Lector: ${getPub(currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId)}\n`;
      const midAudioVideo =
        Array.from(
          new Set([
            ...(currentWeek.midweek.duties.deber_audio || []),
            ...(currentWeek.midweek.duties.deber_video || []),
          ])
        )
          .map(getPub)
          .join(', ') || '---';
      text += `• Audio y Video: ${midAudioVideo}\n`;
      text += `• Micrófonos: ${
        (currentWeek.midweek.duties.deber_microfonos || []).map(getPub).join(', ') || '---'
      }\n\n`;
    }

    if (!currentWeek.specialEvent?.noMeetingWeekend) {
      text += `📖 *REUNIÓN DE FIN DE SEMANA* (${currentWeek.weekend.date} - ${settings.weekendMeetingTime})\n`;
      text += `• Presidente: ${getPub(currentWeek.weekend.presidentId)}\n`;
      text += `• Discurso Público: ${currentWeek.weekend.publicTalkSpeaker || '---'} ("${
        currentWeek.weekend.publicTalkTheme || ''
      }")\n`;
      text += `• Estudio Atalaya: Conductor: ${getPub(
        currentWeek.weekend.atalayaConductorId
      )} | Lector: ${getPub(currentWeek.weekend.atalayaLectorId)}\n`;
      const fdsAudioVideo =
        Array.from(
          new Set([
            ...(currentWeek.weekend.duties.deber_audio || []),
            ...(currentWeek.weekend.duties.deber_video || []),
          ])
        )
          .map(getPub)
          .join(', ') || '---';
      text += `• Audio y Video: ${fdsAudioVideo}\n`;
      text += `• Micrófonos: ${
        (currentWeek.weekend.duties.deber_microfonos || []).map(getPub).join(', ') || '---'
      }\n\n`;
    }

    text += `🧹 *Limpieza del Salón:* Grupo(s) #${currentWeek.cleaningGroupNumbers.join(', #')}\n`;
    text += `¡Muchas gracias a todos por su amor y colaboración! ✨`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const dimensionsLabel =
    pageSize === 'letter'
      ? pageOrientation === 'portrait'
        ? '216 × 279 mm'
        : '279 × 216 mm'
      : pageOrientation === 'portrait'
      ? '210 × 297 mm'
      : '297 × 210 mm';

  return (
    <div className="space-y-6">
      {/* Dynamic @page print rule so native printing matches selected size and orientation */}
      <style>
        {`@media print { @page { size: ${pageSize} ${pageOrientation}; margin: 10mm; } }`}
      </style>

      {/* Top action header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Exportación y Plantillas Oficiales • 100% Local
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Exportar Programa, Hojas S-89 y Formatos Oficiales (Local)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Previsualiza el programa o carga tus archivos oficiales (S-21, S-89, S-140, S-88, S-13) para rellenarlos 100% en local sin servidores privados.
          </p>
        </div>

        {/* Tab switch between Monthly Program, S-89 Slips, Local Official Forms, and WhatsApp Center */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('programa')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'programa'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Programa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('s89')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 's89'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Hojas S-89</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('formatos_oficiales')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'formatos_oficiales'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Formatos Oficiales (Local)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* TAB 4: FORMATOS OFICIALES 100% EN LOCAL */}
      {activeTab === 'formatos_oficiales' && (
        <LocalOfficialFormsCenter />
      )}

      {/* TAB 1: PROGRAMA MENSUAL */}
      {activeTab === 'programa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 no-print self-start">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Configuración del Documento</span>
            </h3>

            {/* 1. Template Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Estilo de Plantilla (5 Diseños)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'oficial', name: 'Cuadrícula Oficial', desc: 'Bandas teocráticas' },
                  { id: 'color', name: 'A Color', desc: 'Colores oficiales VYM' },
                  { id: 'clasica', name: 'Clásica', desc: 'Institucional y sobria' },
                  { id: 'moderna', name: 'Moderna', desc: 'Tarjetas suaves' },
                  { id: 'minimalista', name: 'Minimalista', desc: 'Ahorro de tinta' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTemplate(t.id as any);
                      updateSettings({ pdfTemplate: t.id as any });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeTemplate === t.id
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Page Size & Page Orientation */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Tamaño y Orientación de Página
              </label>

              {/* Page Size Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPageSize('letter');
                    updateSettings({ pdfPageSize: 'letter' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pageSize === 'letter'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Tamaño Carta (Letter)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPageSize('a4');
                    updateSettings({ pdfPageSize: 'a4' });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pageSize === 'a4'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Tamaño A4 (ISO)
                </button>
              </div>

              {/* Page Orientation Selector */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Orientación de la Hoja ({dimensionsLabel}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPageOrientation('portrait');
                      updateSettings({ pdfOrientation: 'portrait' });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      pageOrientation === 'portrait'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                  >
                    <RectangleVertical className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">Vertical</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        Retrato estándar
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPageOrientation('landscape');
                      updateSettings({ pdfOrientation: 'landscape' });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      pageOrientation === 'landscape'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                  >
                    <RectangleHorizontal className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">Horizontal</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        Paisaje panorámico
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Encabezado de la Congregación:
                </label>
                <input
                  type="text"
                  value={pdfCongregationName}
                  onChange={e => setPdfCongregationName(e.target.value)}
                  placeholder="Ej. Congregación Central"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* 3. Sections toggle */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                3. Secciones a Incluir
              </label>
              <div className="flex flex-col gap-2 pt-1">
                <SplashCheckbox
                  size="sm"
                  checked={showMidweek}
                  onChange={e => setShowMidweek(e.target.checked)}
                  label="Reunión de Entre Semana (Vida y Ministerio)"
                />
                <SplashCheckbox
                  size="sm"
                  checked={showWeekend}
                  onChange={e => setShowWeekend(e.target.checked)}
                  label="Reunión de Fin de Semana (Discurso / Atalaya)"
                />
                <SplashCheckbox
                  size="sm"
                  checked={showDuties}
                  onChange={e => setShowDuties(e.target.checked)}
                  label="Deberes Operativos (Audio, Video, Mics, Acomodadores)"
                />
                <SplashCheckbox
                  size="sm"
                  checked={showCleaning}
                  onChange={e => setShowCleaning(e.target.checked)}
                  label="Limpieza del Salón del Reino"
                />
              </div>
            </div>

            {/* 4. Preview & Download Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => handleOpenPreviewBeforeDownload('programa')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Generar Vista Previa antes de Descargar</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-bold border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  Descargar PDF Directo ({pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'})
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Hoja Actual</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/70 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Exportar a Excel / CSV con todas las columnas"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Excel (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Exportar calendario para Google Calendar, Apple Calendar o Outlook"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                  <span className="truncate">Calendario (.ics)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Area */}
          <div className="lg:col-span-2 space-y-3">
            {/* Preview Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:px-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs no-print shadow-2xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Vista Previa ({pageSize.toUpperCase()} •{' '}
                  {pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'} • {dimensionsLabel})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Switch between Interactive Paper Sheet and Real PDF Document */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sheet')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      previewMode === 'sheet'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Hoja Interactiva
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('pdf')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      previewMode === 'pdf'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Documento PDF Real
                  </button>
                </div>

                {/* Zoom controls when in Sheet mode */}
                {previewMode === 'sheet' && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(75, z - 10))}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                      title="Reducir zoom"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 min-w-[38px] text-center">
                      {previewZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(120, z + 10))}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    {previewZoom !== 100 && (
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(100)}
                        className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Restablecer zoom 100%"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenPreviewBeforeDownload('programa')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                  title="Abrir vista previa en pantalla completa antes de descargar"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Ampliar</span>
                </button>
              </div>
            </div>

            {/* MODE A: EMBEDDED GENERATED PDF VIEWER */}
            {previewMode === 'pdf' ? (
              <div className="rounded-3xl bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-lg overflow-hidden flex flex-col min-h-[680px] no-print">
                <div className="px-4 py-2.5 bg-slate-900 text-slate-200 text-xs flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold">
                      Previsualización del archivo PDF generado ({pageSize.toUpperCase()} •{' '}
                      {pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar este PDF</span>
                  </button>
                </div>
                {pdfBlobUrl ? (
                  <iframe
                    src={pdfBlobUrl}
                    title="Vista previa del PDF del Programa"
                    className="w-full flex-1 min-h-[640px] bg-slate-700"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-300 text-sm p-8">
                    Generando documento PDF...
                  </div>
                )}
              </div>
            ) : (
              /* MODE B: PROPORTIONAL PAPER SHEET PREVIEW (PORTRAIT vs LANDSCAPE) */
              <div className="bg-slate-200/70 dark:bg-slate-950/80 p-3 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto flex justify-center">
                <div
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                  className={`w-full transition-all duration-300 bg-white border border-slate-300 shadow-xl text-slate-900 rounded-xl p-6 sm:p-8 ${
                    pageOrientation === 'landscape'
                      ? 'max-w-[1040px] min-h-[540px]'
                      : 'max-w-[740px] min-h-[760px]'
                  } ${
                    activeTemplate === 'clasica'
                      ? 'font-serif border-t-8 border-t-slate-800'
                      : activeTemplate === 'minimalista'
                      ? 'font-sans border-t-4 border-t-black'
                      : activeTemplate === 'moderna'
                      ? 'font-sans border-t-8 border-t-indigo-600'
                      : 'font-sans border-t-8 border-t-indigo-800'
                  }`}
                >
                  {/* Document Header */}
                  <div className="text-center pb-5 border-b border-slate-200">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
                      {pdfCongregationName.trim() || settings.congregationName || 'CONGREGACIÓN LOCAL'}
                    </h1>
                    <p className="text-xs uppercase tracking-widest text-indigo-700 font-bold mt-1">
                      Programa de Asignaciones Teocráticas
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {settings.midweekMeetingDay} {settings.midweekMeetingTime} •{' '}
                      {settings.weekendMeetingDay} {settings.weekendMeetingTime} • Hoja{' '}
                      {pageSize.toUpperCase()} ({pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'})
                    </p>
                  </div>

                  {/* Weeks List — adapts layout to Portrait vs Landscape */}
                  <div
                    className={`mt-5 ${
                      pageOrientation === 'landscape'
                        ? 'grid grid-cols-1 xl:grid-cols-2 gap-4'
                        : 'space-y-5'
                    }`}
                  >
                    {weeks.map(w => (
                      <div
                        key={w.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          activeTemplate === 'color'
                            ? 'border-indigo-100 bg-slate-50/50'
                            : activeTemplate === 'minimalista'
                            ? 'border-black/20 bg-white'
                            : activeTemplate === 'clasica'
                            ? 'border-slate-300 bg-amber-50/20'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Week Title Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-1">
                          <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                            Semana del {w.weekStartDate} al {w.weekEndDate}
                          </h3>
                          {w.specialEvent?.isSpecial && (
                            <span className="text-[11px] font-bold text-amber-800">
                              [{w.specialEvent.title}]
                            </span>
                          )}
                        </div>

                        {/* Special Event Block if no meeting */}
                        {w.specialEvent?.isSpecial &&
                        w.specialEvent.noMeetingMidweek &&
                        w.specialEvent.noMeetingWeekend ? (
                          <p className="py-4 text-xs font-bold text-amber-800 italic">
                            * Sin reuniones regulares en el Salón del Reino con motivo de{' '}
                            {w.specialEvent.title}.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2.5 text-xs">
                            {/* Midweek section */}
                            {showMidweek && !w.specialEvent?.noMeetingMidweek && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 font-bold text-indigo-900">
                                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                  <span>Vida y Ministerio Cristianos ({w.midweek.date})</span>
                                </div>
                                <div className="pl-4 text-slate-700 space-y-0.5">
                                  <p>
                                    <strong>Presidente:</strong>{' '}
                                    {publishersMap.get(w.midweek.presidentId || '')?.name || '---'} |{' '}
                                    <strong>Oración:</strong>{' '}
                                    {publishersMap.get(w.midweek.initialPrayerId || '')?.name ||
                                      '---'}{' '}
                                    /{' '}
                                    {publishersMap.get(w.midweek.finalPrayerId || '')?.name || '---'}
                                  </p>
                                  <p>
                                    <strong>Tesoros:</strong> {w.midweek.tesoros.discurso.title} (
                                    {publishersMap.get(
                                      w.midweek.tesoros.discurso.publisherId || ''
                                    )?.name || '---'}
                                    ) | <strong>Perlas:</strong>{' '}
                                    {publishersMap.get(w.midweek.tesoros.perlas.publisherId || '')
                                      ?.name || '---'}{' '}
                                    | <strong>Lectura:</strong>{' '}
                                    {publishersMap.get(
                                      w.midweek.tesoros.lecturaBiblia.publisherId || ''
                                    )?.name || '---'}
                                  </p>
                                  {w.midweek.maestros.items.length > 0 && (
                                    <p>
                                      <strong>Seamos Mejores Maestros:</strong>{' '}
                                      {w.midweek.maestros.items
                                        .map(
                                          m =>
                                            `${m.title}: ${
                                              publishersMap.get(m.publisherId || '')?.name || '---'
                                            } ${
                                              m.assistantId
                                                ? `(Ayudante: ${
                                                    publishersMap.get(m.assistantId)?.name
                                                  })`
                                                : ''
                                            }`
                                        )
                                        .join(' • ')}
                                    </p>
                                  )}
                                  <p>
                                    <strong>Estudio Bíblico:</strong> Conductor:{' '}
                                    {publishersMap.get(
                                      w.midweek.vidaCristiana.estudioBiblico.conductorId || ''
                                    )?.name || '---'}{' '}
                                    | Lector:{' '}
                                    {publishersMap.get(
                                      w.midweek.vidaCristiana.estudioBiblico.lectorId || ''
                                    )?.name || '---'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Weekend section */}
                            {showWeekend && !w.specialEvent?.noMeetingWeekend && (
                              <div className="space-y-1 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 font-bold text-emerald-900">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                  <span>Reunión Fin de Semana ({w.weekend.date})</span>
                                </div>
                                <div className="pl-4 text-slate-700 space-y-0.5">
                                  <p>
                                    <strong>Presidente:</strong>{' '}
                                    {publishersMap.get(w.weekend.presidentId || '')?.name || '---'} |{' '}
                                    <strong>Discurso Público:</strong>{' '}
                                    {w.weekend.publicTalkOutlineNumber
                                      ? `#${w.weekend.publicTalkOutlineNumber} `
                                      : ''}
                                    {w.weekend.publicTalkTheme
                                      ? `"${w.weekend.publicTalkTheme}"`
                                      : ''}{' '}
                                    (
                                    {w.weekend.isVisitingSpeaker
                                      ? `${w.weekend.publicTalkSpeaker || '---'} [Visitante - ${
                                          w.weekend.visitingSpeakerCongregation || 'Sin cong.'
                                        }]`
                                      : publishersMap.get(w.weekend.publicTalkSpeaker || '')
                                          ?.name ||
                                        w.weekend.publicTalkSpeaker ||
                                        '---'}
                                    )
                                  </p>
                                  {w.weekend.hospitalityPublisherId && (
                                    <p className="text-amber-800">
                                      <strong>Hospitalidad / Comida:</strong>{' '}
                                      {publishersMap.get(w.weekend.hospitalityPublisherId)?.name ||
                                        '---'}
                                    </p>
                                  )}
                                  <p>
                                    <strong>Estudio de La Atalaya:</strong> Conductor:{' '}
                                    {publishersMap.get(w.weekend.atalayaConductorId || '')?.name ||
                                      '---'}{' '}
                                    | Lector:{' '}
                                    {publishersMap.get(w.weekend.atalayaLectorId || '')?.name ||
                                      '---'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Duties section */}
                            {showDuties && (
                              <div className="pt-2 border-t border-slate-100 text-slate-600">
                                <p>
                                  <strong className="text-slate-800">Deberes:</strong> Audio y
                                  Video:{' '}
                                  {Array.from(
                                    new Set([
                                      ...(w.midweek.duties.deber_audio || []),
                                      ...(w.midweek.duties.deber_video || []),
                                    ])
                                  )
                                    .map(id => publishersMap.get(id)?.name)
                                    .filter(Boolean)
                                    .join(', ') || '---'}{' '}
                                  | Micrófonos:{' '}
                                  {(w.midweek.duties.deber_microfonos || [])
                                    .map(id => publishersMap.get(id)?.name)
                                    .filter(Boolean)
                                    .join(', ') || '---'}{' '}
                                  | Acomodador:{' '}
                                  {(w.midweek.duties.deber_acomodador || [])
                                    .map(id => publishersMap.get(id)?.name)
                                    .filter(Boolean)
                                    .join(', ') || '---'}
                                </p>
                              </div>
                            )}

                            {/* Cleaning */}
                            {showCleaning && (
                              <div className="pt-1 text-slate-500 italic">
                                Limpieza Salón del Reino: Grupo(s) #
                                {w.cleaningGroupNumbers.join(', #')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HOJAS DE ASIGNACIÓN S-89 */}
      {activeTab === 's89' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Papeletas de Asignación S-89 (Seamos Mejores Maestros)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formato oficial de 4 papeletas por hoja listas para previsualizar, imprimir y recortar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Orientation Switcher for S-89 */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setPageOrientation('portrait');
                    updateSettings({ pdfOrientation: 'portrait' });
                  }}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    pageOrientation === 'portrait'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <RectangleVertical className="w-3.5 h-3.5" />
                  <span>Vertical</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPageOrientation('landscape');
                    updateSettings({ pdfOrientation: 'landscape' });
                  }}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    pageOrientation === 'landscape'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <RectangleHorizontal className="w-3.5 h-3.5" />
                  <span>Horizontal</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenPreviewBeforeDownload('s89')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Vista Previa PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadS89}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Papeletas S-89 (PDF)</span>
              </button>
            </div>
          </div>

          {/* S-89 Slips 2x2 Preview */}
          <div
            className={`mx-auto transition-all grid grid-cols-1 md:grid-cols-2 gap-4 ${
              pageOrientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
            }`}
          >
            {currentWeek &&
              currentWeek.midweek.maestros.items.map(item => {
                const student = item.publisherId
                  ? publishersMap.get(item.publisherId)?.name
                  : 'Estudiante asignado';
                const assistant = item.assistantId
                  ? publishersMap.get(item.assistantId)?.name
                  : '---';

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 space-y-3 font-sans shadow-xs"
                  >
                    <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                        Asignación para la Reunión
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        Vida y Ministerio Cristianos (S-89)
                      </p>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <p className="flex justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Congregación:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {settings.congregationName}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400">Fecha:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {currentWeek.midweek.date}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Estudiante:
                        </span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-400">
                          {student}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Ayudante:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {assistant}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Asignación:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-bold text-slate-600 dark:text-slate-400">Sala:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                        </span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-center">
                      <p className="text-[10px] text-slate-400 italic">
                        Presente esta hoja a su consejero con su libro Guía.
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: CENTRO WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Centro de Mensajes Masivos y Recordatorios por WhatsApp</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semana del {currentWeek?.weekStartDate} al {currentWeek?.weekEndDate}. Notifica a
                cada hermano individualmente o copia el resumen general.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyWeekSummary}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              {copiedSummary ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copiedSummary ? '¡Resumen Copiado!' : 'Copiar Resumen Semanal Completo'}</span>
            </button>
          </div>

          {/* List of all weekly assignments with Notified checkboxes */}
          <div className="space-y-2.5">
            {currentWeek &&
              (() => {
                const allItems: Array<{
                  id: string;
                  title: string;
                  meetingType: 'midweek' | 'weekend';
                  date: string;
                  publisherId?: string;
                  assistantId?: string;
                  room?: 'principal' | 'auxiliar';
                  timeMinutes?: number;
                }> = [];

                // Midweek
                if (currentWeek.midweek.presidentId) {
                  allItems.push({
                    id: 'mid-pres',
                    title: 'Presidente Entre Semana',
                    meetingType: 'midweek',
                    date: currentWeek.midweek.date,
                    publisherId: currentWeek.midweek.presidentId,
                  });
                }
                if (currentWeek.midweek.tesoros.discurso.publisherId) {
                  allItems.push({
                    id: 'mid-disc',
                    title: currentWeek.midweek.tesoros.discurso.title,
                    meetingType: 'midweek',
                    date: currentWeek.midweek.date,
                    publisherId: currentWeek.midweek.tesoros.discurso.publisherId,
                    timeMinutes: 10,
                  });
                }
                if (currentWeek.midweek.tesoros.perlas.publisherId) {
                  allItems.push({
                    id: 'mid-perl',
                    title: 'Perlas escondidas',
                    meetingType: 'midweek',
                    date: currentWeek.midweek.date,
                    publisherId: currentWeek.midweek.tesoros.perlas.publisherId,
                    timeMinutes: 10,
                  });
                }
                if (currentWeek.midweek.tesoros.lecturaBiblia.publisherId) {
                  allItems.push({
                    id: 'mid-lect',
                    title: 'Lectura de la Biblia',
                    meetingType: 'midweek',
                    date: currentWeek.midweek.date,
                    publisherId: currentWeek.midweek.tesoros.lecturaBiblia.publisherId,
                    timeMinutes: 4,
                    room: 'principal',
                  });
                }
                currentWeek.midweek.maestros.items.forEach((m, idx) => {
                  if (m.publisherId) {
                    allItems.push({
                      id: `mid-m-${idx}`,
                      title: m.title,
                      meetingType: 'midweek',
                      date: currentWeek.midweek.date,
                      publisherId: m.publisherId,
                      assistantId: m.assistantId,
                      room: m.room,
                      timeMinutes: m.timeMinutes,
                    });
                  }
                });
                currentWeek.midweek.vidaCristiana.items.forEach((v, idx) => {
                  if (v.publisherId) {
                    allItems.push({
                      id: `mid-v-${idx}`,
                      title: v.title,
                      meetingType: 'midweek',
                      date: currentWeek.midweek.date,
                      publisherId: v.publisherId,
                      timeMinutes: v.timeMinutes,
                    });
                  }
                });
                if (currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId) {
                  allItems.push({
                    id: 'mid-cbs-cond',
                    title: 'Conductor Estudio Bíblico',
                    meetingType: 'midweek',
                    date: currentWeek.midweek.date,
                    publisherId: currentWeek.midweek.vidaCristiana.estudioBiblico.conductorId,
                  });
                }
                if (currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId) {
                  allItems.push({
                    id: 'mid-cbs-lect',
                    title: 'Lector Estudio Bíblico',
                    meetingType: 'midweek',
                    date: currentWeek.midweek.date,
                    publisherId: currentWeek.midweek.vidaCristiana.estudioBiblico.lectorId,
                  });
                }
                // Midweek duties
                Object.entries(currentWeek.midweek.duties).forEach(([k, ids]) => {
                  ids.forEach((id, idx) => {
                    allItems.push({
                      id: `duty-mid-${k}-${idx}`,
                      title: `Deber: ${k.replace('deber_', '').toUpperCase()}`,
                      meetingType: 'midweek',
                      date: currentWeek.midweek.date,
                      publisherId: id,
                    });
                  });
                });

                // Weekend
                if (currentWeek.weekend.presidentId) {
                  allItems.push({
                    id: 'fds-pres',
                    title: 'Presidente Fin de Semana',
                    meetingType: 'weekend',
                    date: currentWeek.weekend.date,
                    publisherId: currentWeek.weekend.presidentId,
                  });
                }
                if (currentWeek.weekend.atalayaConductorId) {
                  allItems.push({
                    id: 'fds-cond',
                    title: 'Conductor de La Atalaya',
                    meetingType: 'weekend',
                    date: currentWeek.weekend.date,
                    publisherId: currentWeek.weekend.atalayaConductorId,
                  });
                }
                if (currentWeek.weekend.atalayaLectorId) {
                  allItems.push({
                    id: 'fds-lect',
                    title: 'Lector de La Atalaya',
                    meetingType: 'weekend',
                    date: currentWeek.weekend.date,
                    publisherId: currentWeek.weekend.atalayaLectorId,
                  });
                }
                Object.entries(currentWeek.weekend.duties).forEach(([k, ids]) => {
                  ids.forEach((id, idx) => {
                    allItems.push({
                      id: `duty-fds-${k}-${idx}`,
                      title: `Deber: ${k.replace('deber_', '').toUpperCase()} (FDS)`,
                      meetingType: 'weekend',
                      date: currentWeek.weekend.date,
                      publisherId: id,
                    });
                  });
                });

                return allItems.map(item => {
                  const pub = item.publisherId ? publishersMap.get(item.publisherId) : undefined;
                  if (!pub) return null;
                  const assistant = item.assistantId
                    ? publishersMap.get(item.assistantId)?.name
                    : undefined;
                  const isNotified = Boolean(notifiedKeys[item.id]);

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isNotified
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SplashCheckbox
                          size="sm"
                          checked={isNotified}
                          onChange={() => toggleNotified(item.id)}
                          title="Marcar como ya notificado"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {pub.name}
                            </span>
                            {isNotified && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                · ✓ Notificado
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                            {item.title} • {item.date}{' '}
                            {item.room
                              ? `(${
                                  item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'
                                })`
                              : ''}
                          </p>
                          {assistant && (
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                              Ayudante: {assistant}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-7 sm:pl-0">
                        <button
                          type="button"
                          onClick={() => {
                            const msg = createAssignmentWhatsAppMessage(
                              pub,
                              currentWeek,
                              item.title,
                              item.meetingType,
                              item.date,
                              {
                                assistantName: assistant,
                                room: item.room,
                                timeMinutes: item.timeMinutes,
                                congregationName: settings.congregationName,
                              }
                            );
                            openWhatsAppLink(pub.phone || '', msg);
                            setNotifiedKeys(prev => ({ ...prev, [item.id]: true }));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Notificar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const msg = createAssignmentWhatsAppMessage(
                              pub,
                              currentWeek,
                              item.title,
                              item.meetingType,
                              item.date,
                              {
                                isReminder: true,
                                assistantName: assistant,
                                room: item.room,
                                timeMinutes: item.timeMinutes,
                                congregationName: settings.congregationName,
                              }
                            );
                            openWhatsAppLink(pub.phone || '', msg);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold transition-all cursor-pointer"
                        >
                          Recordar
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE VISTA PREVIA DEL DOCUMENTO PDF ANTES DE LA DESCARGA
         ========================================================================= */}
      {isPreviewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fade-in no-print"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            className="w-full max-w-6xl h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header with Live Orientation & Page Size Controls */}
            <div className="px-5 py-3.5 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                    Vista Previa del Documento antes de la Descarga
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {previewModalDocType === 's89'
                      ? 'Papeletas de Asignación S-89'
                      : `Programa de Reuniones (${activeTemplate.toUpperCase()})`}{' '}
                    • {pageSize.toUpperCase()} ({dimensionsLabel})
                  </p>
                </div>
              </div>

              {/* Quick Orientation & Page Size Switchers inside Preview Modal */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPageOrientation('portrait');
                      updateSettings({ pdfOrientation: 'portrait' });
                    }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      pageOrientation === 'portrait'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <RectangleVertical className="w-3.5 h-3.5" />
                    <span>Vertical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPageOrientation('landscape');
                      updateSettings({ pdfOrientation: 'landscape' });
                    }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      pageOrientation === 'landscape'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <RectangleHorizontal className="w-3.5 h-3.5" />
                    <span>Horizontal</span>
                  </button>
                </div>

                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPageSize('letter');
                      updateSettings({ pdfPageSize: 'letter' });
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      pageSize === 'letter'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Carta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPageSize('a4');
                      updateSettings({ pdfPageSize: 'a4' });
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      pageSize === 'a4'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    A4
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded PDF Preview Body */}
            <div className="flex-1 bg-slate-800 relative flex flex-col overflow-hidden">
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Vista Previa del Documento PDF"
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                  Generando vista previa del PDF...
                </div>
              )}
            </div>

            {/* Modal Footer with Confirm & Download CTA */}
            <div className="px-5 py-3.5 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Orientación seleccionada:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {pageOrientation === 'landscape' ? 'Horizontal (Paisaje)' : 'Vertical (Retrato)'}
                </strong>{' '}
                • Formato <strong className="text-slate-800 dark:text-slate-200">{pageSize.toUpperCase()}</strong>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Seguir Editando
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (previewModalDocType === 's89') {
                      handleDownloadS89();
                    } else {
                      handleDownloadPdf();
                    }
                    setIsPreviewModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Confirmar y Descargar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
