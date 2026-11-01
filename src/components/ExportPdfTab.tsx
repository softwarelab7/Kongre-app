// src/components/ExportPdfTab.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useCongregation } from '../context/CongregationContext';
import {
  generateProgramPdf,
  generateProgramPdfBlobUrl,
  generateS89Pdf,
  generateS89PdfBlobUrl,
  generateS21Pdf,
  generateS21PdfBlobUrl,
} from '../utils/pdfGenerator';
import {
  getAvailableServiceYears,
  getCurrentServiceYear,
  buildS21CardForPublisher,
} from '../utils/s21Helper';
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
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  User,
  Users,
  Search,
  Scissors,
  Check,
  Layers,
} from 'lucide-react';
import { LocalOfficialFormsCenter } from './LocalOfficialFormsCenter';

// Configure PDF.js worker for react-pdf with local bundler + CDN fallback
try {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface ReactPdfInteractivePreviewProps {
  fileUrl: string | null;
  title: string;
  subtitle?: string;
  docType: 's89' | 's21' | 'programa';
  pageSize: 'letter' | 'a4';
  pageOrientation: 'portrait' | 'landscape';
  onDownload: () => void;
  onPrint: () => void;
  onExpandModal?: () => void;
  minHeightClass?: string;
}

export const ReactPdfInteractivePreview: React.FC<ReactPdfInteractivePreviewProps> = ({
  fileUrl,
  title,
  subtitle,
  docType,
  pageSize,
  pageOrientation,
  onDownload,
  onPrint,
  onExpandModal,
  minHeightClass = 'min-h-[640px]',
}) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.05);
  const [rotation, setRotation] = useState<number>(0);
  const [renderAllPages, setRenderAllPages] = useState<boolean>(false);
  const [useNativeFallback, setUseNativeFallback] = useState<boolean>(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);

  useEffect(() => {
    setPageNumber(1);
    setUseNativeFallback(false);
  }, [fileUrl, docType]);

  const handleDocumentLoadSuccess = ({ numPages: loadedPages }: { numPages: number }) => {
    setNumPages(loadedPages || 1);
    setPageNumber(1);
    setIsLoadingDoc(false);
  };

  const handleDocumentLoadError = () => {
    setIsLoadingDoc(false);
    setUseNativeFallback(true);
  };

  const baseWidth = pageOrientation === 'landscape' ? 680 : 520;

  return (
    <div
      className={`rounded-3xl bg-zinc-900 border border-zinc-300 dark:border-[#27272A] shadow-xl overflow-hidden flex flex-col ${minHeightClass} no-print`}
    >
      {/* Interactive React-PDF Toolbar */}
      <div className="px-3.5 py-2.5 sm:px-4 bg-zinc-950 text-zinc-200 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-zinc-100 truncate">{title}</p>
            {subtitle && (
              <p className="text-[10.5px] text-zinc-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Interactive Controls: Pagination, Zoom, Rotation, Print & Download */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Page Navigation */}
          {!useNativeFallback && numPages > 1 && (
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                disabled={pageNumber <= 1 || renderAllPages}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="p-0.5 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-zinc-200 px-1">
                {renderAllPages ? `${numPages} págs.` : `${pageNumber} / ${numPages}`}
              </span>
              <button
                type="button"
                disabled={pageNumber >= numPages || renderAllPages}
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                className="p-0.5 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRenderAllPages((prev) => !prev)}
                className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  renderAllPages
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title="Alternar entre página única o todas las páginas"
              >
                <Layers className="w-3 h-3 inline mr-0.5" />
                {renderAllPages ? 'Todas' : '1 Pág'}
              </button>
            </div>
          )}

          {/* Zoom & Rotation Controls */}
          {!useNativeFallback && (
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.65, Number((s - 0.15).toFixed(2))))}
                className="p-0.5 text-zinc-300 hover:text-indigo-400 cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-zinc-200 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.75, Number((s + 0.15).toFixed(2))))}
                className="p-0.5 text-zinc-300 hover:text-indigo-400 cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-0.5 text-zinc-300 hover:text-indigo-400 cursor-pointer ml-0.5"
                title="Rotar página 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              {(scale !== 1.05 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setScale(1.05);
                    setRotation(0);
                  }}
                  className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
                  title="Restablecer vista"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Toggle React-PDF Canvas vs Native PDF Engine */}
          <button
            type="button"
            onClick={() => setUseNativeFallback((prev) => !prev)}
            className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Cambiar modo de visor PDF"
          >
            {useNativeFallback ? 'Lienzo React-PDF' : 'Visor Nativo'}
          </button>

          {onExpandModal && (
            <button
              type="button"
              onClick={onExpandModal}
              className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Ampliar vista previa en pantalla completa"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">Ampliar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrint}
            className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Enviar formato directamente a imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Descargar archivo PDF oficial"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive PDF Canvas Body */}
      <div className="flex-1 bg-zinc-800/90 overflow-auto flex flex-col items-center justify-start p-4 sm:p-6 relative">
        {!fileUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 text-sm gap-2 py-16">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <span>Generando vista previa del formato {docType.toUpperCase()}...</span>
          </div>
        ) : useNativeFallback ? (
          <iframe
            src={fileUrl}
            title={title}
            className="w-full flex-1 min-h-[580px] rounded-xl bg-zinc-700 border border-zinc-700"
          />
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center text-zinc-300 text-sm gap-2 py-16">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span>Renderizando documento con react-pdf...</span>
              </div>
            }
            className="flex flex-col items-center gap-5 max-w-full"
          >
            {renderAllPages ? (
              Array.from(new Array(numPages), (_, idx) => (
                <div
                  key={`page_${idx + 1}`}
                  className="bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-700/60 transition-all"
                >
                  <Page
                    pageNumber={idx + 1}
                    width={baseWidth}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-700/60 transition-all">
                <Page
                  pageNumber={pageNumber}
                  width={baseWidth}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            )}
          </Document>
        )}

        {/* Bottom Metadata Pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            Vista previa interactiva ({docType.toUpperCase()}) • {pageSize.toUpperCase()} •{' '}
            {pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ExportPdfTab: React.FC = () => {
  const {
    weeks,
    publishers,
    publishersMap,
    monthlyReports,
    settings,
    updateSettings,
    currentWeek,
    currentWeekId,
  } = useCongregation();

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
  const [activeTab, setActiveTab] = useState<
    'programa' | 's89' | 's21' | 'whatsapp' | 'formatos_oficiales'
  >(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      if (h.includes('formatos')) return 'formatos_oficiales';
      if (h.includes('s21')) return 's21';
      if (h.includes('s89')) return 's89';
    }
    return 'programa';
  });
  const [notifiedKeys, setNotifiedKeys] = useState<Record<string, boolean>>({});
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [pdfCongregationName, setPdfCongregationName] = useState(settings.congregationName || '');

  // Preview state for Programa Mensual
  const [previewMode, setPreviewMode] = useState<'sheet' | 'pdf'>('sheet');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Preview state for S-89 Slips (default to 'pdf' so react-pdf interactive preview is immediately visible)
  const [selectedS89WeekId, setSelectedS89WeekId] = useState<string>(
    () => currentWeekId || currentWeek?.id || weeks[0]?.id || ''
  );
  const [s89PreviewMode, setS89PreviewMode] = useState<'sheet' | 'pdf'>('pdf');
  const [s89Zoom, setS89Zoom] = useState<number>(100);
  const [s89RoomFilter, setS89RoomFilter] = useState<'todos' | 'principal' | 'auxiliar'>('todos');
  const [showS89OfficialTemplateCenter, setShowS89OfficialTemplateCenter] = useState<boolean>(false);

  // Preview state for S-21 Cards (default to 'pdf' so react-pdf interactive preview is immediately visible)
  const availableServiceYears = useMemo(() => getAvailableServiceYears(), []);
  const [selectedS21ServiceYear, setSelectedS21ServiceYear] = useState<string>(() =>
    getCurrentServiceYear()
  );
  const activePublishers = useMemo(
    () =>
      (publishers || [])
        .filter((p) => p.status !== 'deleted' && (p.active || p.is_active !== false))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [publishers]
  );
  const [selectedS21PublisherId, setSelectedS21PublisherId] = useState<string>(
    () => activePublishers[0]?.id || ''
  );
  const [s21SearchQuery, setS21SearchQuery] = useState<string>('');
  const [s21PreviewMode, setS21PreviewMode] = useState<'sheet' | 'pdf'>('pdf');
  const [s21Zoom, setS21Zoom] = useState<number>(100);
  const [showS21OfficialTemplateCenter, setShowS21OfficialTemplateCenter] = useState<boolean>(false);

  // Common Preview Modal & Blob URL state
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewModalDocType, setPreviewModalDocType] = useState<'programa' | 's89' | 's21'>('programa');

  useEffect(() => {
    setPdfCongregationName(settings.congregationName || '');
  }, [settings.congregationName]);

  // Fallback default publisher when activePublishers loads
  useEffect(() => {
    if (!selectedS21PublisherId && activePublishers.length > 0) {
      setSelectedS21PublisherId(activePublishers[0].id);
    }
  }, [activePublishers, selectedS21PublisherId]);

  // Target S-89 Week Schedule
  const s89Week = useMemo(() => {
    return weeks.find((w) => w.id === selectedS89WeekId) || currentWeek || weeks[0];
  }, [weeks, selectedS89WeekId, currentWeek]);

  // Target S-21 Publisher Object & Computed Card Data
  const selectedS21Publisher = useMemo(() => {
    return (
      publishersMap.get(selectedS21PublisherId) ||
      activePublishers.find((p) => p.id === selectedS21PublisherId) ||
      activePublishers[0]
    );
  }, [publishersMap, selectedS21PublisherId, activePublishers]);

  const s21CardData = useMemo(() => {
    if (!selectedS21Publisher) return null;
    return buildS21CardForPublisher(
      selectedS21Publisher,
      selectedS21ServiceYear,
      monthlyReports || []
    );
  }, [selectedS21Publisher, selectedS21ServiceYear, monthlyReports]);

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
    const isPdfActiveInTab =
      (activeTab === 'programa' && previewMode === 'pdf') ||
      activeTab === 's89' ||
      activeTab === 's21';

    if (!isPdfActiveInTab && !isPreviewModalOpen) return;

    let generatedUrl: string | null = null;
    try {
      const activeDocType = isPreviewModalOpen ? previewModalDocType : activeTab;
      const congregationTitle =
        pdfCongregationName.trim() || settings.congregationName || 'Congregación';

      if (activeDocType === 's89') {
        if (s89Week) {
          generatedUrl = generateS89PdfBlobUrl(
            s89Week,
            publishersMap,
            congregationTitle,
            pageSize,
            pageOrientation
          );
        }
      } else if (activeDocType === 's21') {
        if (selectedS21Publisher) {
          generatedUrl = generateS21PdfBlobUrl(
            selectedS21Publisher,
            selectedS21ServiceYear,
            monthlyReports || [],
            congregationTitle,
            pageSize,
            pageOrientation
          );
        }
      } else {
        generatedUrl = generateProgramPdfBlobUrl(
          weeks,
          publishersMap,
          getEffectivePdfSettings()
        );
      }

      if (generatedUrl) {
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return generatedUrl;
        });
      }
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
    s89PreviewMode,
    s21PreviewMode,
    isPreviewModalOpen,
    previewModalDocType,
    activeTab,
    weeks,
    s89Week,
    selectedS21Publisher,
    selectedS21ServiceYear,
    monthlyReports,
    publishersMap,
    pageSize,
    pageOrientation,
    pdfCongregationName,
    settings.congregationName,
    getEffectivePdfSettings,
  ]);

  const handleOpenPreviewBeforeDownload = (docType: 'programa' | 's89' | 's21') => {
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
    const targetWeek = s89Week || currentWeek;
    if (!targetWeek) return;
    generateS89Pdf(
      targetWeek,
      publishersMap,
      pdfCongregationName.trim() || settings.congregationName,
      pageSize,
      pageOrientation
    );
  };

  const handleDownloadS21 = () => {
    if (!selectedS21Publisher) return;
    generateS21Pdf(
      selectedS21Publisher,
      selectedS21ServiceYear,
      monthlyReports || [],
      pdfCongregationName.trim() || settings.congregationName || 'Congregación',
      pageSize,
      pageOrientation
    );
  };

  const handlePrint = () => {
    if (pdfBlobUrl && (activeTab === 's89' || activeTab === 's21' || previewMode === 'pdf' || isPreviewModalOpen)) {
      try {
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        printIframe.src = pdfBlobUrl;
        printIframe.onload = () => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch {
            window.print();
          }
          window.setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 60000);
        };
        document.body.appendChild(printIframe);
        return;
      } catch {
        // Fallback to standard print
      }
    }
    window.print();
  };

  const toggleNotified = (key: string) => {
    setNotifiedKeys((prev) => ({
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

      {/* Barra de Navegación de Exportación y Plantillas (Unified Container) */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print">
        {/* Tab switch between Monthly Program, S-89 Slips, Local Official Forms, and WhatsApp Center */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:flex items-center gap-1 bg-zinc-100 dark:bg-[#18181F]/80 border border-zinc-200/80 dark:border-[#27272A]/80 p-1 rounded-xl text-xs font-semibold w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('programa')}
            className={`px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'programa'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Programa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('s89')}
            className={`px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 's89'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Hojas S-89</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('s21')}
            className={`px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 's21'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="truncate">Tarjetas S-21</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('formatos_oficiales')}
            className={`px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'formatos_oficiales'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate hidden sm:inline">Formatos Oficiales</span>
            <span className="truncate sm:hidden">Oficiales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-[#A1A1AA] hidden md:inline">
            100% Local • Sin servidores externos
          </span>
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
          <div className="bg-white dark:bg-[#121216] p-6 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-5 no-print self-start">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Configuración del Documento</span>
            </h3>

            {/* 1. Template Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
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
                        : 'border-zinc-200 dark:border-[#27272A] hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-[#121216]'
                    }`}
                  >
                    <p className="font-bold text-xs text-zinc-900 dark:text-white">{t.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Page Size & Page Orientation */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-[#27272A]">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
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
                      : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
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
                      : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                  }`}
                >
                  Tamaño A4 (ISO)
                </button>
              </div>

              {/* Page Orientation Selector */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-600 dark:text-[#A1A1AA] mb-1.5">
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
                        : 'border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-700 dark:text-[#D4D4D8] hover:border-indigo-300'
                    }`}
                  >
                    <RectangleVertical className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">Vertical</span>
                      <span className="block text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
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
                        : 'border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-700 dark:text-[#D4D4D8] hover:border-indigo-300'
                    }`}
                  >
                    <RectangleHorizontal className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">Horizontal</span>
                      <span className="block text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                        Paisaje panorámico
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-[#A1A1AA] mb-1">
                  Encabezado de la Congregación:
                </label>
                <input
                  type="text"
                  value={pdfCongregationName}
                  onChange={e => setPdfCongregationName(e.target.value)}
                  placeholder="Ej. Congregación Central"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* 3. Sections toggle */}
            <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-[#27272A] text-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] mb-2">
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
            <div className="pt-4 border-t border-zinc-100 dark:border-[#27272A] space-y-2">
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
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-[#18181F] hover:bg-zinc-800 dark:hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                  className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 text-zinc-700 dark:text-[#D4D4D8] text-xs font-bold border border-zinc-200 dark:border-[#27272A] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Exportar calendario para Google Calendar, Apple Calendar o Outlook"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-600 dark:text-[#A1A1AA] shrink-0" />
                  <span className="truncate">Calendario (.ics)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Area */}
          <div className="lg:col-span-2 space-y-3">
            {/* Preview Toolbar */}
            <div className="bg-white dark:bg-[#121216] p-3 sm:px-4 rounded-2xl border border-zinc-200 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-2 text-xs no-print shadow-2xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-zinc-800 dark:text-[#E4E4E7]">
                  Vista Previa ({pageSize.toUpperCase()} •{' '}
                  {pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'} • {dimensionsLabel})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Switch between Interactive Paper Sheet and Real PDF Document */}
                <div className="flex items-center bg-zinc-100 dark:bg-[#18181F] p-0.5 rounded-xl border border-zinc-200/70 dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sheet')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      previewMode === 'sheet'
                        ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900'
                    }`}
                  >
                    Hoja Interactiva
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('pdf')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      previewMode === 'pdf'
                        ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900'
                    }`}
                  >
                    Documento PDF Real
                  </button>
                </div>

                {/* Zoom controls when in Sheet mode */}
                {previewMode === 'sheet' && (
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181F] px-1.5 py-0.5 rounded-xl border border-zinc-200/70 dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(75, z - 10))}
                      className="p-1 text-zinc-600 dark:text-[#D4D4D8] hover:text-indigo-600 cursor-pointer"
                      title="Reducir zoom"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-[#D4D4D8] min-w-[38px] text-center">
                      {previewZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(120, z + 10))}
                      className="p-1 text-zinc-600 dark:text-[#D4D4D8] hover:text-indigo-600 cursor-pointer"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    {previewZoom !== 100 && (
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(100)}
                        className="p-1 text-zinc-500 hover:text-zinc-800 cursor-pointer"
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

            {/* MODE A: EMBEDDED GENERATED PDF VIEWER (REACT-PDF) */}
            {previewMode === 'pdf' ? (
              <ReactPdfInteractivePreview
                fileUrl={pdfBlobUrl}
                title={`Vista Previa del Programa (${pageSize.toUpperCase()} • ${
                  pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'
                })`}
                subtitle={pdfCongregationName.trim() || settings.congregationName || 'Congregación'}
                docType="programa"
                pageSize={pageSize}
                pageOrientation={pageOrientation}
                onDownload={handleDownloadPdf}
                onPrint={handlePrint}
                onExpandModal={() => handleOpenPreviewBeforeDownload('programa')}
              />
            ) : (
              /* MODE B: PROPORTIONAL PAPER SHEET PREVIEW (PORTRAIT vs LANDSCAPE) */
              <div className="bg-zinc-200/70 dark:bg-zinc-950/80 p-3 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] overflow-x-auto flex justify-center">
                <div
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                  className={`w-full transition-all duration-300 bg-white border border-zinc-300 shadow-xl text-zinc-900 rounded-xl p-6 sm:p-8 ${
                    pageOrientation === 'landscape'
                      ? 'max-w-[1040px] min-h-[540px]'
                      : 'max-w-[740px] min-h-[760px]'
                  } ${
                    activeTemplate === 'clasica'
                      ? 'font-serif border-t-8 border-t-zinc-800'
                      : activeTemplate === 'minimalista'
                      ? 'font-sans border-t-4 border-t-black'
                      : activeTemplate === 'moderna'
                      ? 'font-sans border-t-8 border-t-indigo-600'
                      : 'font-sans border-t-8 border-t-indigo-800'
                  }`}
                >
                  {/* Document Header */}
                  <div className="text-center pb-5 border-b border-zinc-200">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900">
                      {pdfCongregationName.trim() || settings.congregationName || 'CONGREGACIÓN LOCAL'}
                    </h1>
                    <p className="text-xs uppercase tracking-widest text-indigo-700 font-bold mt-1">
                      Programa de Asignaciones Teocráticas
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
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
                            ? 'border-indigo-100 bg-zinc-50/50'
                            : activeTemplate === 'minimalista'
                            ? 'border-black/20 bg-white'
                            : activeTemplate === 'clasica'
                            ? 'border-zinc-300 bg-amber-50/20'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        {/* Week Title Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-zinc-200 gap-1">
                          <h3 className="font-extrabold text-sm text-zinc-900 uppercase">
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
                                <div className="pl-4 text-zinc-700 space-y-0.5">
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
                              <div className="space-y-1 pt-2 border-t border-zinc-100">
                                <div className="flex items-center gap-2 font-bold text-emerald-900">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                  <span>Reunión Fin de Semana ({w.weekend.date})</span>
                                </div>
                                <div className="pl-4 text-zinc-700 space-y-0.5">
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
                              <div className="pt-2 border-t border-zinc-100 text-zinc-600">
                                <p>
                                  <strong className="text-zinc-800">Deberes:</strong> Audio y
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
                              <div className="pt-1 text-zinc-500 italic">
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

      {/* TAB 2: HOJAS DE ASIGNACIÓN S-89 (VISTA PREVIA INTERACTIVA REACT-PDF + PLANTILLA OFICIAL) */}
      {activeTab === 's89' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* S-89 Controls & Selection Column */}
            <div className="bg-white dark:bg-[#121216] p-6 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-5 no-print self-start">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Formato S-89 (Papeletas)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  4 por hoja
                </span>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                  1. Seleccionar Semana de Reunión
                </label>
                <select
                  value={s89Week?.id || ''}
                  onChange={(e) => setSelectedS89WeekId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs font-bold text-zinc-900 dark:text-white"
                >
                  {weeks.map((w) => (
                    <option key={w.id} value={w.id}>
                      Semana del {w.weekStartDate} al {w.weekEndDate} ({w.midweek.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Size & Orientation for S-89 */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                  2. Formato de Hoja e Impresión
                </label>
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
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8]'
                    }`}
                  >
                    Carta (Letter)
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
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8]'
                    }`}
                  >
                    A4 (ISO)
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPageOrientation('portrait');
                      updateSettings({ pdfOrientation: 'portrait' });
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      pageOrientation === 'portrait'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA]'
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      pageOrientation === 'landscape'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-zinc-200 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA]'
                    }`}
                  >
                    <RectangleHorizontal className="w-3.5 h-3.5" />
                    <span>Horizontal</span>
                  </button>
                </div>
              </div>

              {/* Actions: Fullscreen Preview, Print, Download */}
              <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenPreviewBeforeDownload('s89')}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ampliar Vista Previa S-89</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadS89}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-bold border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Hojas S-89 (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-[#18181F] hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Hojas S-89</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowS89OfficialTemplateCenter((prev) => !prev)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {showS89OfficialTemplateCenter
                      ? 'Ocultar Rellenador de PDF Oficial'
                      : 'Cargar / Rellenar PDF Oficial S-89'}
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive React-PDF Preview Column for S-89 */}
            <div className="lg:col-span-2">
              <ReactPdfInteractivePreview
                fileUrl={pdfBlobUrl}
                title={`Vista Previa Interactiva S-89 — Semana ${s89Week?.weekStartDate || ''}`}
                subtitle={`${
                  pdfCongregationName.trim() || settings.congregationName || 'Congregación'
                } • ${pageSize.toUpperCase()} (${
                  pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'
                })`}
                docType="s89"
                pageSize={pageSize}
                pageOrientation={pageOrientation}
                onDownload={handleDownloadS89}
                onPrint={handlePrint}
                onExpandModal={() => handleOpenPreviewBeforeDownload('s89')}
              />
            </div>
          </div>

          {showS89OfficialTemplateCenter && (
            <LocalOfficialFormsCenter
              initialFormCode="S-89"
              initialWeekId={selectedS89WeekId}
              compactHeader={true}
            />
          )}
        </div>
      )}

      {/* TAB 3: TARJETAS DE PUBLICADOR S-21 (VISTA PREVIA INTERACTIVA REACT-PDF + PLANTILLA OFICIAL) */}
      {activeTab === 's21' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* S-21 Controls & Publisher Selector Column */}
            <div className="bg-white dark:bg-[#121216] p-6 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-5 no-print self-start">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tarjeta de Publicador S-21</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedS21ServiceYear}
                </span>
              </div>

              {/* Search & Select Publisher */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                  1. Seleccionar Publicador y Año
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={s21SearchQuery}
                    onChange={(e) => setS21SearchQuery(e.target.value)}
                    placeholder="Buscar hermano o hermana..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-white"
                  />
                </div>

                <select
                  value={selectedS21Publisher?.id || ''}
                  onChange={(e) => setSelectedS21PublisherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs font-bold text-zinc-900 dark:text-white"
                >
                  {activePublishers
                    .filter((p) =>
                      !s21SearchQuery.trim()
                        ? true
                        : (p.name || '')
                            .toLowerCase()
                            .includes(s21SearchQuery.trim().toLowerCase())
                    )
                    .map((pub) => (
                      <option key={pub.id} value={pub.id}>
                        {pub.name} (Grupo {pub.groupId || 1})
                      </option>
                    ))}
                </select>

                <select
                  value={selectedS21ServiceYear}
                  onChange={(e) => setSelectedS21ServiceYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-xs font-bold text-zinc-900 dark:text-white"
                >
                  {availableServiceYears.map((sy) => (
                    <option key={sy} value={sy}>
                      Año de Servicio {sy}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary Stats of Selected S-21 Card */}
              {s21CardData && (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Meses activos</span>
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      {s21CardData.totals.monthsActive} / 12
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Horas totales</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                      {s21CardData.totals.totalHours} h
                    </span>
                  </div>
                </div>
              )}

              {/* Actions: Fullscreen Preview, Print, Download */}
              <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenPreviewBeforeDownload('s21')}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ampliar Vista Previa S-21</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadS21}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-bold border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Tarjeta S-21 (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-[#18181F] hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Tarjeta S-21</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowS21OfficialTemplateCenter((prev) => !prev)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {showS21OfficialTemplateCenter
                      ? 'Ocultar Rellenador de PDF Oficial'
                      : 'Cargar / Rellenar PDF Oficial S-21'}
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive React-PDF Preview Column for S-21 */}
            <div className="lg:col-span-2">
              <ReactPdfInteractivePreview
                fileUrl={pdfBlobUrl}
                title={`Vista Previa Interactiva S-21 — ${
                  selectedS21Publisher?.name || 'Publicador'
                }`}
                subtitle={`Año de Servicio ${selectedS21ServiceYear} • ${pageSize.toUpperCase()} (${
                  pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'
                })`}
                docType="s21"
                pageSize={pageSize}
                pageOrientation={pageOrientation}
                onDownload={handleDownloadS21}
                onPrint={handlePrint}
                onExpandModal={() => handleOpenPreviewBeforeDownload('s21')}
              />
            </div>
          </div>

          {showS21OfficialTemplateCenter && (
            <LocalOfficialFormsCenter
              initialFormCode="S-21"
              initialPublisherId={selectedS21PublisherId}
              initialServiceYear={selectedS21ServiceYear}
              compactHeader={true}
            />
          )}
        </div>
      )}

      {/* TAB 3: CENTRO WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-[#121216] p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-[#27272A]">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Centro de Mensajes Masivos y Recordatorios por WhatsApp</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Semana del {currentWeek?.weekStartDate} al {currentWeek?.weekEndDate}. Notifica a
                cada hermano individualmente o copia el resumen general.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyWeekSummary}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-[#18181F] hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 cursor-pointer"
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
                          : 'bg-zinc-50 dark:bg-[#18181F]/50 border-zinc-200 dark:border-[#27272A]'
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
                            <span className="font-bold text-zinc-900 dark:text-white">
                              {pub.name}
                            </span>
                            {isNotified && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                · ✓ Notificado
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-600 dark:text-[#D4D4D8] mt-0.5">
                            {item.title} • {item.date}{' '}
                            {item.room
                              ? `(${
                                  item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'
                                })`
                              : ''}
                          </p>
                          {assistant && (
                            <p className="text-zinc-500 dark:text-[#A1A1AA] text-[11px]">
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
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] border border-zinc-300 dark:border-[#27272A] font-semibold transition-all cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fade-in no-print"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            className="w-full max-w-6xl h-[90dvh] rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header with Live Orientation & Page Size Controls */}
            <div className="px-5 py-3.5 sm:px-6 border-b border-zinc-200 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-[#121216] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
                    Vista Previa del Documento antes de la Descarga
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] truncate">
                    {previewModalDocType === 's89'
                      ? `Papeletas de Asignación S-89 (Semana ${s89Week?.weekStartDate || ''})`
                      : previewModalDocType === 's21'
                      ? `Tarjeta de Publicador S-21 (${selectedS21Publisher?.name || 'Publicador'} • ${selectedS21ServiceYear})`
                      : `Programa de Reuniones (${activeTemplate.toUpperCase()})`}{' '}
                    • {pageSize.toUpperCase()} ({dimensionsLabel})
                  </p>
                </div>
              </div>

              {/* Quick Orientation & Page Size Switchers inside Preview Modal */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-zinc-200/70 dark:bg-[#18181F] p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPageOrientation('portrait');
                      updateSettings({ pdfOrientation: 'portrait' });
                    }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      pageOrientation === 'portrait'
                        ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA]'
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
                        ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA]'
                    }`}
                  >
                    <RectangleHorizontal className="w-3.5 h-3.5" />
                    <span>Horizontal</span>
                  </button>
                </div>

                <div className="flex items-center bg-zinc-200/70 dark:bg-[#18181F] p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPageSize('letter');
                      updateSettings({ pdfPageSize: 'letter' });
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      pageSize === 'letter'
                        ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA]'
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
                        ? 'bg-white dark:bg-[#121216] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-zinc-600 dark:text-[#A1A1AA]'
                    }`}
                  >
                    A4
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded React-PDF Interactive Preview Body inside Modal */}
            <div className="flex-1 bg-zinc-900 relative flex flex-col overflow-hidden p-2 sm:p-4">
              <ReactPdfInteractivePreview
                fileUrl={pdfBlobUrl}
                title={
                  previewModalDocType === 's89'
                    ? `Papeletas S-89 (Semana ${s89Week?.weekStartDate || ''})`
                    : previewModalDocType === 's21'
                    ? `Tarjeta S-21 (${selectedS21Publisher?.name || 'Publicador'} • ${selectedS21ServiceYear})`
                    : `Programa de Reuniones (${activeTemplate.toUpperCase()})`
                }
                subtitle={`${pageSize.toUpperCase()} • ${
                  pageOrientation === 'landscape' ? 'Horizontal' : 'Vertical'
                }`}
                docType={previewModalDocType}
                pageSize={pageSize}
                pageOrientation={pageOrientation}
                onDownload={() => {
                  if (previewModalDocType === 's89') handleDownloadS89();
                  else if (previewModalDocType === 's21') handleDownloadS21();
                  else handleDownloadPdf();
                }}
                onPrint={handlePrint}
                minHeightClass="flex-1 h-full"
              />
            </div>

            {/* Modal Footer with Confirm & Download CTA */}
            <div className="px-5 py-3.5 sm:px-6 border-t border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#121216] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Orientación seleccionada:{' '}
                <strong className="text-zinc-800 dark:text-[#E4E4E7]">
                  {pageOrientation === 'landscape' ? 'Horizontal (Paisaje)' : 'Vertical (Retrato)'}
                </strong>{' '}
                • Formato <strong className="text-zinc-800 dark:text-[#E4E4E7]">{pageSize.toUpperCase()}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-xs font-bold transition-colors cursor-pointer"
                >
                  Seguir Editando
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewModalDocType === 's89') {
                      handleDownloadS89();
                    } else if (previewModalDocType === 's21') {
                      handleDownloadS21();
                    } else {
                      handleDownloadPdf();
                    }
                    setIsPreviewModalOpen(false);
                  }}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer flex-1 sm:flex-initial"
                >
                  <Download className="w-4 h-4 shrink-0" />
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
