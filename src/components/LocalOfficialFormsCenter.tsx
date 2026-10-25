// src/components/LocalOfficialFormsCenter.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useToast } from '../context/ToastContext';
import {
  OfficialFormCode,
  LocalOfficialFormMetadata,
  OFFICIAL_FORMS_CATALOG,
  saveLocalOfficialForm,
  listLocalOfficialForms,
  getLocalOfficialFormBytes,
  deleteLocalOfficialForm,
  purgeAllLocalOfficialForms,
  fillOfficialS21Pdf,
  fillBatchOfficialS21Pdf,
  fillOfficialS89Pdf,
  fillOfficialS88Pdf,
  fillOfficialS140Pdf,
  fillOfficialS13Pdf,
  fillOfficialS26Pdf,
  fillOfficialS30Pdf,
  fillOfficialS25Pdf,
  fillOfficialS28Pdf,
  fillCustomOfficialPdf,
  inspectPdfBytes,
  downloadPdfBytesLocally,
} from '../services/localOfficialFormsService';
import {
  getS89WeekSlipsFromIndexedDb,
  saveGeneratedS89PdfToIndexedDb,
} from '../services/s89IndexedDbService';
import { getAvailableServiceYears, getCurrentServiceYear } from '../utils/s21Helper';
import { computeMonthlyS26, formatMonthLabel } from '../utils/accountsHelper';
import {
  ShieldCheck,
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  HardDrive,
  Cpu,
  Users,
  User,
  Calendar,
  Sparkles,
  Sliders,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
  FileCheck,
  Search,
  Layers,
  X,
} from 'lucide-react';

export interface LocalOfficialFormsCenterProps {
  initialFormCode?: OfficialFormCode;
  initialPublisherId?: string;
  initialServiceYear?: string;
  initialWeekId?: string;
  initialMonth?: string;
  compactHeader?: boolean;
}

export const LocalOfficialFormsCenter: React.FC<LocalOfficialFormsCenterProps> = ({
  initialFormCode = 'S-21',
  initialPublisherId,
  initialServiceYear,
  initialWeekId,
  initialMonth,
  compactHeader = false,
}) => {
  const {
    publishers,
    publishersMap,
    preachingGroups,
    monthlyReports,
    weeks,
    currentWeek,
    currentWeekId,
    getS89SlipsForWeek,
    territories,
    transactions,
    quarterlyAudits,
    literatureItems,
    branchReportsS1,
    settings,
  } = useCongregation();
  const { showToast } = useToast();

  // Lista de plantillas cargadas localmente
  const [localForms, setLocalForms] = useState<LocalOfficialFormMetadata[]>([]);
  const [selectedCode, setSelectedCode] = useState<OfficialFormCode>(initialFormCode);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [sessionOnlyMode, setSessionOnlyMode] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Parámetros de rellenado según tipo de formato
  const activePublishers = useMemo(
    () =>
      publishers
        .filter((p) => p.status !== 'deleted' && (p.active || p.is_active !== false))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [publishers]
  );

  const [s21TargetMode, setS21TargetMode] = useState<'single' | 'group' | 'all'>('single');
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>(
    initialPublisherId || activePublishers[0]?.id || ''
  );
  const [selectedGroupNum, setSelectedGroupNum] = useState<number>(
    preachingGroups[0]?.number || 1
  );
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>(
    initialServiceYear || getCurrentServiceYear()
  );
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    initialWeekId || currentWeekId || weeks[0]?.id || ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (initialMonth) return initialMonth;
    if (transactions && transactions.length > 0) {
      const months = Array.from(new Set(transactions.map((t) => t.month))).sort();
      if (months.length > 0) return months[months.length - 1];
    }
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Inspector AcroForm interactivo y vista previa en vivo
  const [activeSubView, setActiveSubView] = useState<'autofill' | 'inspector'>('autofill');
  const [inspectorFields, setInspectorFields] = useState<Record<string, string | boolean>>({});
  const [fieldSearch, setFieldSearch] = useState<string>('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [lastFilledBytes, setLastFilledBytes] = useState<Uint8Array | null>(null);
  const [lastFilledFileName, setLastFilledFileName] = useState<string>('Formato_Oficial_Rellenado.pdf');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableServiceYears = useMemo(() => getAvailableServiceYears(), []);
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    transactions.forEach((t) => {
      if (t.month) set.add(t.month);
    });
    monthlyReports.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set).sort().reverse();
  }, [transactions, monthlyReports]);

  const refreshLocalForms = useCallback(async () => {
    const list = await listLocalOfficialForms();
    setLocalForms(list);
    // Seleccionar automáticamente la plantilla que coincida con selectedCode
    const matching = list.find((f) => f.code === selectedCode);
    if (matching) {
      setSelectedFormId(matching.id);
    } else if (list.length > 0 && !selectedFormId) {
      setSelectedFormId(list[0].id);
    }
  }, [selectedCode, selectedFormId]);

  useEffect(() => {
    refreshLocalForms();
  }, [refreshLocalForms]);

  useEffect(() => {
    if (initialFormCode) setSelectedCode(initialFormCode);
  }, [initialFormCode]);

  useEffect(() => {
    if (initialPublisherId) setSelectedPublisherId(initialPublisherId);
  }, [initialPublisherId]);

  useEffect(() => {
    if (initialWeekId) setSelectedWeekId(initialWeekId);
  }, [initialWeekId]);

  useEffect(() => {
    if (initialMonth) setSelectedMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    if (!selectedPublisherId && activePublishers.length > 0) {
      setSelectedPublisherId(activePublishers[0].id);
    }
  }, [activePublishers, selectedPublisherId]);

  // Plantilla activa actualmente seleccionada
  const currentFormMeta = useMemo(() => {
    return (
      localForms.find((f) => f.id === selectedFormId) ||
      localForms.find((f) => f.code === selectedCode) ||
      null
    );
  }, [localForms, selectedFormId, selectedCode]);

  // Limpiar Blob URL al desmontar
  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  // Ejecutar el rellenado automático en memoria local y actualizar la vista previa
  const handleGenerateFilledPdf = useCallback(
    async (autoDownload = false, overrideFormMeta?: LocalOfficialFormMetadata) => {
      const targetMeta = overrideFormMeta || currentFormMeta;
      if (!targetMeta) {
        showToast('Primero selecciona o carga el archivo PDF oficial desde tu dispositivo.', 'error');
        return;
      }

      setIsGenerating(true);
      try {
        const stored = await getLocalOfficialFormBytes(targetMeta.id);
        if (!stored) {
          showToast('No se encontró el archivo en la memoria local. Por favor cárgalo nuevamente.', 'error');
          return;
        }

        let filledBytes: Uint8Array;
        let outFileName = `Rellenado_${targetMeta.fileName}`;

        if (activeSubView === 'inspector' && Object.keys(inspectorFields).length > 0 && !overrideFormMeta) {
          filledBytes = await fillCustomOfficialPdf(stored.bytes, inspectorFields);
          outFileName = `${targetMeta.code}_Personalizado_${new Date().toISOString().slice(0, 10)}.pdf`;
        } else if (targetMeta.code === 'S-21') {
          if (s21TargetMode === 'single') {
            const pub =
              publishersMap.get(selectedPublisherId) ||
              activePublishers.find((p) => p.id === selectedPublisherId) ||
              activePublishers[0];
            if (!pub) {
              showToast('Selecciona un publicador válido para rellenar la tarjeta S-21.', 'error');
              return;
            }
            filledBytes = await fillOfficialS21Pdf(
              stored.bytes,
              pub,
              selectedServiceYear,
              monthlyReports
            );
            const cleanName = (pub.name || 'Publicador').replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ_-]/g, '_');
            outFileName = `S-21_${cleanName}_${selectedServiceYear}.pdf`;
          } else if (s21TargetMode === 'group') {
            const groupPubs = activePublishers.filter(
              (p) =>
                p.groupNumber === selectedGroupNum ||
                String(p.id_grupo || '') === String(selectedGroupNum)
            );
            if (groupPubs.length === 0) {
              showToast(`No hay publicadores activos en el Grupo ${selectedGroupNum}.`, 'error');
              return;
            }
            filledBytes = await fillBatchOfficialS21Pdf(
              stored.bytes,
              groupPubs,
              selectedServiceYear,
              monthlyReports
            );
            outFileName = `S-21_Grupo_${selectedGroupNum}_${selectedServiceYear}.pdf`;
          } else {
            if (activePublishers.length === 0) {
              showToast('No hay publicadores activos registrados.', 'error');
              return;
            }
            filledBytes = await fillBatchOfficialS21Pdf(
              stored.bytes,
              activePublishers,
              selectedServiceYear,
              monthlyReports
            );
            outFileName = `S-21_Congregacion_Completa_${selectedServiceYear}.pdf`;
          }
        } else if (targetMeta.code === 'S-89') {
          const targetWeek = weeks.find((w) => w.id === selectedWeekId) || currentWeek || weeks[0];
          if (!targetWeek) {
            showToast('Selecciona una semana válida para rellenar las hojas S-89.', 'error');
            return;
          }
          let slips = getS89SlipsForWeek(targetWeek);
          if (slips.length === 0) {
            slips = await getS89WeekSlipsFromIndexedDb(targetWeek.id);
          }
          if (slips.length === 0) {
            showToast('No hay asignaciones estudiantiles en la semana seleccionada.', 'error');
            return;
          }
          filledBytes = await fillOfficialS89Pdf(stored.bytes, slips);
          outFileName = `S-89_Semana_${targetWeek.weekStartDate}.pdf`;
          await saveGeneratedS89PdfToIndexedDb(
            targetWeek.id,
            'official_pdf',
            filledBytes,
            outFileName,
            slips.length
          );
        } else if (targetMeta.code === 'S-140') {
          const targetWeek = weeks.find((w) => w.id === selectedWeekId) || currentWeek || weeks[0];
          if (!targetWeek) {
            showToast('Selecciona una semana válida para rellenar el programa S-140.', 'error');
            return;
          }
          filledBytes = await fillOfficialS140Pdf(
            stored.bytes,
            targetWeek,
            publishersMap,
            settings
          );
          outFileName = `S-140_Semana_${targetWeek.weekStartDate}.pdf`;
        } else if (targetMeta.code === 'S-88') {
          filledBytes = await fillOfficialS88Pdf(
            stored.bytes,
            weeks,
            selectedServiceYear,
            settings
          );
          outFileName = `S-88_Asistencia_${selectedServiceYear}.pdf`;
        } else if (targetMeta.code === 'S-13') {
          filledBytes = await fillOfficialS13Pdf(
            stored.bytes,
            territories,
            selectedServiceYear
          );
          outFileName = `S-13_Territorios_${selectedServiceYear}.pdf`;
        } else if (targetMeta.code === 'S-26') {
          filledBytes = await fillOfficialS26Pdf(
            stored.bytes,
            selectedMonth,
            transactions,
            settings
          );
          outFileName = `S-26_Cuentas_${selectedMonth}.pdf`;
        } else if (targetMeta.code === 'S-30') {
          filledBytes = await fillOfficialS30Pdf(
            stored.bytes,
            selectedMonth,
            transactions,
            settings
          );
          outFileName = `S-30_Informe_Mensual_Cuentas_${selectedMonth}.pdf`;
        } else if (targetMeta.code === 'S-25') {
          filledBytes = await fillOfficialS25Pdf(
            stored.bytes,
            quarterlyAudits,
            settings
          );
          outFileName = `S-25_Auditoria_Cuentas_${selectedMonth}.pdf`;
        } else if (targetMeta.code === 'S-28') {
          filledBytes = await fillOfficialS28Pdf(
            stored.bytes,
            literatureItems,
            settings
          );
          outFileName = `S-28_Inventario_Publicaciones_${new Date().toISOString().slice(0, 10)}.pdf`;
        } else if (targetMeta.code === 'S-1') {
          const monthRpts = monthlyReports.filter((r) => r.month === selectedMonth);
          const pubsRpts = monthRpts.filter((r) => !r.isPioneer && !r.isAuxiliaryPioneer);
          const auxRpts = monthRpts.filter((r) => r.isAuxiliaryPioneer && !r.isPioneer);
          const regRpts = monthRpts.filter((r) => r.isPioneer);
          const s1CustomMap: Record<string, string | boolean> = {
            Congregacion: settings.congregationName || '',
            Congregation: settings.congregationName || '',
            Mes: formatMonthLabel(selectedMonth),
            Month: formatMonthLabel(selectedMonth),
            PublicadoresActivos: String(activePublishers.length),
            PublicadoresInformes: String(pubsRpts.length),
            PublicadoresCursos: String(pubsRpts.reduce((s, r) => s + (r.bibleStudies || 0), 0)),
            AuxiliaresInformes: String(auxRpts.length),
            AuxiliaresHoras: String(auxRpts.reduce((s, r) => s + (r.hours || 0), 0)),
            AuxiliaresCursos: String(auxRpts.reduce((s, r) => s + (r.bibleStudies || 0), 0)),
            RegularesInformes: String(regRpts.length),
            RegularesHoras: String(regRpts.reduce((s, r) => s + (r.hours || 0), 0)),
            RegularesCursos: String(regRpts.reduce((s, r) => s + (r.bibleStudies || 0), 0)),
            ...inspectorFields,
          };
          filledBytes = await fillCustomOfficialPdf(stored.bytes, s1CustomMap);
          outFileName = `S-1_Informe_Sucursal_${selectedMonth}.pdf`;
        } else {
          // Formato personalizado o S-205b
          filledBytes = await fillCustomOfficialPdf(stored.bytes, inspectorFields);
          outFileName = `${targetMeta.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
        }

        // Sincronizar los valores resultantes en el Inspector para que el usuario pueda verlos o retocarlos
        const inspectedAfterFill = await inspectPdfBytes(filledBytes);
        const nextInspectorValues: Record<string, string | boolean> = {};
        inspectedAfterFill.fields.forEach((f) => {
          nextInspectorValues[f.name] = f.value;
        });
        setInspectorFields(nextInspectorValues);

        // Crear URL de vista previa local
        const blob = new Blob([filledBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setLastFilledBytes(filledBytes);
        setLastFilledFileName(outFileName);

        if (autoDownload) {
          downloadPdfBytesLocally(filledBytes, outFileName);
          showToast(`Archivo oficial "${outFileName}" rellenado y descargado.`, 'success');
        } else {
          showToast(`Formato oficial "${targetMeta.code}" rellenado con los datos de la congregación.`, 'success');
        }
      } catch (err: any) {
        console.error('Error rellenando PDF oficial en local:', err);
        showToast(`Error al rellenar el PDF: ${err.message || 'Verifica el archivo'}`, 'error');
      } finally {
        setIsGenerating(false);
      }
    },
    [
      currentFormMeta,
      activeSubView,
      inspectorFields,
      s21TargetMode,
      publishersMap,
      selectedPublisherId,
      activePublishers,
      selectedServiceYear,
      monthlyReports,
      selectedGroupNum,
      weeks,
      selectedWeekId,
      currentWeek,
      getS89SlipsForWeek,
      settings,
      territories,
      selectedMonth,
      transactions,
      quarterlyAudits,
      literatureItems,
      branchReportsS1,
      showToast,
    ]
  );

  // Cargar archivo PDF desde el dispositivo y rellenarlo inmediatamente
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      let lastSaved: LocalOfficialFormMetadata | null = null;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          showToast(`El archivo "${file.name}" no es un documento PDF válido.`, 'error');
          continue;
        }
        const saved = await saveLocalOfficialForm(
          file,
          files.length === 1 ? selectedCode : undefined,
          sessionOnlyMode
        );
        lastSaved = saved;
      }

      await refreshLocalForms();
      if (lastSaved) {
        setSelectedCode(lastSaved.code);
        setSelectedFormId(lastSaved.id);
        showToast(
          `Formato oficial "${lastSaved.fileName}" cargado (${lastSaved.fieldCount} campos detectados). Rellenando automáticamente...`,
          'success'
        );
        // Auto-rellenar inmediatamente después de cargar el PDF oficial
        await handleGenerateFilledPdf(false, lastSaved);
      }
    } catch (err: any) {
      console.error('Error cargando formato oficial local:', err);
      showToast(`No se pudo leer el archivo PDF: ${err.message || 'Error desconocido'}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Eliminar una plantilla local
  const handleDeleteTemplate = async (id: string, name: string) => {
    await deleteLocalOfficialForm(id);
    if (selectedFormId === id) {
      setSelectedFormId(null);
      setPreviewBlobUrl(null);
      setLastFilledBytes(null);
    }
    await refreshLocalForms();
    showToast(`Plantilla "${name}" eliminada de este dispositivo.`, 'info');
  };

  // Purgar todas las plantillas locales
  const handlePurgeAll = async () => {
    await purgeAllLocalOfficialForms();
    setLocalForms([]);
    setSelectedFormId(null);
    setPreviewBlobUrl(null);
    setLastFilledBytes(null);
    showToast(
      'Todos los formatos oficiales locales han sido borrados de este dispositivo.',
      'success'
    );
  };

  // Cuando cambia la plantilla seleccionada, inicializar el inspector con sus campos originales
  useEffect(() => {
    if (!currentFormMeta) {
      setInspectorFields({});
      return;
    }
    const initMap: Record<string, string | boolean> = {};
    currentFormMeta.fieldsSummary.forEach((f) => {
      initMap[f.name] = f.value;
    });
    setInspectorFields(initMap);
  }, [currentFormMeta]);

  const currentCatalogInfo = useMemo(() => {
    return (
      OFFICIAL_FORMS_CATALOG.find((c) => c.code === selectedCode) ||
      OFFICIAL_FORMS_CATALOG[0]
    );
  }, [selectedCode]);

  const filteredInspectorFields = useMemo(() => {
    if (!currentFormMeta) return [];
    const q = fieldSearch.trim().toLowerCase();
    if (!q) return currentFormMeta.fieldsSummary;
    return currentFormMeta.fieldsSummary.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        String(inspectorFields[f.name] ?? '').toLowerCase().includes(q)
    );
  }, [currentFormMeta, fieldSearch, inspectorFields]);

  return (
    <div className="space-y-6">
      {/* BANNER OFICIAL DE CUMPLIMIENTO DE LA CARTA DE LA SUCURSAL */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900 border border-emerald-500/30 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Directriz de la Sucursal • 100% Local
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200">
                  <Lock className="w-3 h-3" /> Sin almacenamiento en servidores privados
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                Rellenador Local de Formatos Oficiales (S-21, S-89, S-140, S-88, S-13, S-26)
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5 max-w-3xl leading-relaxed">
                En conformidad con las instrucciones de la sucursal, <strong>ningún formato oficial se aloja ni se sincroniza en servidores privados ni en la nube</strong>. Carga aquí tus archivos PDF oficiales descargados de JW Hub: se procesan y rellenan exclusivamente dentro de tu dispositivo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Selector de modo de persistencia local */}
            <button
              type="button"
              onClick={() => setSessionOnlyMode(!sessionOnlyMode)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sessionOnlyMode
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                  : 'bg-white/10 border-white/15 text-emerald-100 hover:bg-white/15'
              }`}
              title="Elige si guardar el archivo en el navegador de este dispositivo o únicamente en la memoria RAM mientras la pestaña esté abierta"
            >
              {sessionOnlyMode ? (
                <>
                  <Cpu className="w-4 h-4 text-amber-300" />
                  <span>Modo: Solo Memoria Temporal (RAM)</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-emerald-300" />
                  <span>Modo: Guardado Local en este Dispositivo</span>
                </>
              )}
            </button>

            {localForms.length > 0 && (
              <button
                type="button"
                onClick={handlePurgeAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-all cursor-pointer"
                title="Borrar inmediatamente todos los formatos oficiales cargados en este navegador"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Bóveda Local ({localForms.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SELECTOR DE CATEGORÍAS DE FORMATOS OFICIALES */}
      {!compactHeader && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {OFFICIAL_FORMS_CATALOG.map((item) => {
            const loadedForCode = localForms.find((f) => f.code === item.code);
            const isSelected = selectedCode === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setSelectedCode(item.code);
                  if (loadedForCode) {
                    setSelectedFormId(loadedForCode.id);
                  } else {
                    setSelectedFormId(null);
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-black tracking-tight px-2 py-0.5 rounded-lg ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {item.code === 'CUSTOM' ? 'OTRO PDF' : item.code}
                  </span>
                  {loadedForCode ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-emerald-400/25 text-emerald-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Listo
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      Sin cargar
                    </span>
                  )}
                </div>
                <div>
                  <p
                    className={`text-[11px] font-bold line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.title.replace(/\s*\(.*?\)\s*/g, '')}
                  </p>
                  <p
                    className={`text-[10px] line-clamp-1 mt-0.5 ${
                      isSelected ? 'text-indigo-100/80' : 'text-slate-400'
                    }`}
                  >
                    {loadedForCode
                      ? `${loadedForCode.fieldCount} campos detectados`
                      : 'Cargar archivo local'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* PANEL PRINCIPAL DIVIDIDO: CONFIGURACIÓN + CARGA LOCAL (IZQUIERDA) Y VISTA PREVIA / INSPECTOR (DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: CARGA DE ARCHIVO Y PARÁMETROS DE RELLENADO */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta 1: Cargar o Seleccionar Plantilla PDF Oficial */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Paso 1 • Plantilla Oficial Local ({selectedCode})
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentCatalogInfo.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentCatalogInfo.description}
                </p>
              </div>
            </div>

            {/* Zona de Carga Local */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-800/70 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-4 text-center cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isUploading
                  ? 'Analizando campos interactivos del PDF en local...'
                  : `Haz clic para cargar tu archivo ${selectedCode === 'CUSTOM' ? 'PDF oficial' : `${selectedCode}.pdf`} desde tu dispositivo`}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                También puedes seleccionar varios PDFs oficiales a la vez (S-21, S-89, S-140...). Nunca se suben a internet.
              </p>
            </div>

            {/* Estado del archivo activo */}
            {currentFormMeta ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentFormMeta.fileName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-600 text-white shrink-0">
                        {currentFormMeta.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                      {currentFormMeta.fieldCount} campos AcroForm • {currentFormMeta.pageCount}{' '}
                      {currentFormMeta.pageCount === 1 ? 'página' : 'páginas'} •{' '}
                      {Math.round(currentFormMeta.fileSize / 1024)} KB •{' '}
                      {currentFormMeta.sessionOnly ? 'Solo RAM' : 'Guardado en navegador'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteTemplate(currentFormMeta.id, currentFormMeta.fileName)
                  }
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                  title="Quitar este archivo del almacenamiento local"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Archivo {selectedCode} aún no cargado en este navegador.</strong> Selecciona el PDF oficial desde tu computadora o teléfono para habilitar el rellenado automático local.
                </div>
              </div>
            )}

            {/* Lista rápida si hay múltiples archivos locales cargados */}
            {localForms.length > 1 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Archivos oficiales disponibles en este dispositivo ({localForms.length})
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {localForms.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedCode(item.code);
                        setSelectedFormId(item.id);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                        currentFormMeta?.id === item.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 font-bold text-indigo-900 dark:text-indigo-200'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{item.fileName}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                        {item.code} ({item.fieldCount})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta 2: Configuración de Datos para Rellenar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Paso 2 • Datos de la Congregación a Rellenar
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Parámetros de Autocompletado Local
                </h4>
              </div>

              {/* Switch entre Autocompletado y Mapeador/Inspector de Campos */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSubView('autofill')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeSubView === 'autofill'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubView('inspector')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeSubView === 'inspector'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Campos ({currentFormMeta?.fieldCount || 0})
                </button>
              </div>
            </div>

            {/* Controles específicos para S-21 */}
            {(currentFormMeta?.code === 'S-21' || (!currentFormMeta && selectedCode === 'S-21')) && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                    Alcance del Rellenado S-21
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'single', label: 'Un Publicador', icon: User },
                      { id: 'group', label: 'Por Grupo', icon: Users },
                      { id: 'all', label: 'Todos (' + activePublishers.length + ')', icon: Layers },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = s21TargetMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setS21TargetMode(opt.id as any)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {s21TargetMode === 'single' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Seleccionar Publicador
                    </label>
                    <select
                      value={selectedPublisherId}
                      onChange={(e) => setSelectedPublisherId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {activePublishers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.full_name} — Grupo {p.groupNumber || p.id_grupo || 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {s21TargetMode === 'group' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Seleccionar Grupo de Servicio
                    </label>
                    <select
                      value={selectedGroupNum}
                      onChange={(e) => setSelectedGroupNum(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      {preachingGroups.map((g) => (
                        <option key={g.number} value={g.number}>
                          {g.name || `Grupo ${g.number}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Año de Servicio Teocrático
                  </label>
                  <select
                    value={selectedServiceYear}
                    onChange={(e) => setSelectedServiceYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {availableServiceYears.map((sy) => (
                      <option key={sy} value={sy}>
                        Año de Servicio {sy} (Septiembre – Agosto)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Controles específicos para S-89 o S-140 */}
            {(currentFormMeta?.code === 'S-89' ||
              currentFormMeta?.code === 'S-140' ||
              (!currentFormMeta && (selectedCode === 'S-89' || selectedCode === 'S-140'))) && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Semana del Programa VMC
                  </label>
                  <select
                    value={selectedWeekId}
                    onChange={(e) => setSelectedWeekId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {weeks.map((w) => (
                      <option key={w.id} value={w.id}>
                        Semana del {w.weekStartDate} al {w.weekEndDate} ({w.midweek.bibleReading || 'VMC'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Controles específicos para S-88 o S-13 */}
            {(currentFormMeta?.code === 'S-88' ||
              currentFormMeta?.code === 'S-13' ||
              (!currentFormMeta && (selectedCode === 'S-88' || selectedCode === 'S-13'))) && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Año de Servicio
                </label>
                <select
                  value={selectedServiceYear}
                  onChange={(e) => setSelectedServiceYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {availableServiceYears.map((sy) => (
                    <option key={sy} value={sy}>
                      Año de Servicio {sy}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Controles específicos para S-26, S-30, S-25 o S-1 */}
            {(currentFormMeta?.code === 'S-26' ||
              currentFormMeta?.code === 'S-30' ||
              currentFormMeta?.code === 'S-25' ||
              currentFormMeta?.code === 'S-1' ||
              (!currentFormMeta &&
                (selectedCode === 'S-26' ||
                  selectedCode === 'S-30' ||
                  selectedCode === 'S-25' ||
                  selectedCode === 'S-1'))) && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Mes del Informe / Registro ({selectedCode})
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)} ({m})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botones de Acción Local */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                disabled={!currentFormMeta || isGenerating}
                onClick={() => handleGenerateFilledPdf(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>
                  {isGenerating ? 'Rellenando en local...' : 'Rellenar y Previsualizar'}
                </span>
              </button>

              <button
                type="button"
                disabled={!currentFormMeta || isGenerating}
                onClick={() => handleGenerateFilledPdf(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Rellenar y Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA DEL PDF OFICIAL RELLENADO O INSPECTOR INTERACTIVO DE CAMPOS */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Procesamiento Local en Navegador • Cero Servidores
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {activeSubView === 'inspector'
                  ? `Inspector y Editor de Campos AcroForm (${currentFormMeta?.fileName || selectedCode})`
                  : `Vista Previa del Formato Oficial Rellenado (${lastFilledFileName})`}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {lastFilledBytes && (
                <button
                  type="button"
                  onClick={() => downloadPdfBytesLocally(lastFilledBytes, lastFilledFileName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar ({Math.round(lastFilledBytes.byteLength / 1024)} KB)</span>
                </button>
              )}
            </div>
          </div>

          {activeSubView === 'inspector' ? (
            <div className="space-y-4">
              {!currentFormMeta ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Carga primero un archivo PDF oficial a la izquierda para inspeccionar y editar sus campos interactivos.
                </div>
              ) : currentFormMeta.fieldsSummary.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-200">
                  Este archivo PDF no contiene campos de formulario interactivos (AcroForm). Aun así, para el formato S-21 el sistema estampará los datos sobre la página automáticamente.
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        placeholder="Buscar campo por nombre interno o valor (ej. 900_1, Nombre, Horas...)"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubView('autofill');
                        handleGenerateFilledPdf(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shrink-0 text-center"
                    >
                      Aplicar Cambios y Ver PDF
                    </button>
                  </div>

                  <div className="max-h-[480px] overflow-y-auto space-y-2 pr-1">
                    {filteredInspectorFields.map((field) => {
                      const val = inspectorFields[field.name];
                      return (
                        <div
                          key={field.name}
                          className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 block truncate">
                              {field.name}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              Tipo: {field.type}
                            </span>
                          </div>

                          {field.type === 'checkbox' ? (
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) =>
                                setInspectorFields((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 rounded text-indigo-600 cursor-pointer self-start sm:self-center"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(val ?? '')}
                              onChange={(e) =>
                                setInspectorFields((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              placeholder="Valor del campo..."
                              className="w-full sm:w-64 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : previewBlobUrl ? (
            <div className="w-full h-[65dvh] sm:h-[560px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
              <iframe
                src={previewBlobUrl}
                title="Vista Previa PDF Oficial Local"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="h-[460px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Vista Previa Local del Formato Oficial
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                1. Carga el archivo PDF oficial ({selectedCode}) desde tu dispositivo en el panel izquierdo.
                <br />
                2. Elige el publicador, grupo o semana y pulsa <strong>“Rellenar y Previsualizar”</strong> para ver el documento oficial completado aquí mismo sin subirlo a ningún servidor.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-lg">
                {currentCatalogInfo.autoFillCapabilities.map((cap, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface LocalOfficialFormsModalProps extends LocalOfficialFormsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const LocalOfficialFormsModal: React.FC<LocalOfficialFormsModalProps> = ({
  isOpen,
  onClose,
  title,
  ...centerProps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92dvh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {title || `Cargar y Rellenar Formato Oficial (${centerProps.initialFormCode || 'S-21'})`}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sube el formato oficial descargado de JW Hub para que la aplicación lo rellene con los datos de la congregación y lo descargues.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <LocalOfficialFormsCenter {...centerProps} />
        </div>
      </div>
    </div>
  );
};

