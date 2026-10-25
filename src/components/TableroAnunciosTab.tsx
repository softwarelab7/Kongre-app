import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { CongregationNotice } from '../types';
import {
  Bell,
  Pin,
  Calendar,
  Share2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Brush,
  FileText,
  X,
  Printer,
  Download,
  MessageCircle,
  Copy,
  Check,
  Mic,
  Shield,
  Compass,
  Users,
  Layers,
  Search,
  Sparkles,
  BookOpen,
  Radio,
  ShoppingBag,
  Utensils,
  Building2,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';
import { openWhatsAppLink } from '../utils/whatsapp';
import {
  buildWeeklyInformationBoardWhatsApp,
  printUnifiedKingdomHallBoardA4,
  downloadCongregationMasterCalendarIcs,
  resolvePublisherName,
  resolveDutyNamesList,
} from '../utils/khsInformationBoardEngine';
import {
  extractAllPublishersMonthlyBundles,
  formatUnifiedMonthlyWhatsAppMessage,
  downloadPublisherUnifiedIcs,
  printPublisherUnifiedMonthlySheet,
  formatSpanishMonthLabel,
  formatShortSpanishDate,
  getDutyFriendlyLabel,
  UnifiedAssignmentCategory,
} from '../utils/unifiedMonthlyAssignments';
import { CLEANING_TYPE_LABELS, CLEANING_SUPPLIES_LABELS } from '../utils/khsDutiesCleaningEngine';

type BoardSubTab = 'cartelera_khs' | 'despacho_mensual_khs' | 'anuncios_cartas';

export const TableroAnunciosTab: React.FC = () => {
  const {
    weeks,
    currentWeek,
    publishers,
    publishersMap,
    notices,
    addNotice,
    updateNotice,
    deleteNotice,
    settings,
    preachingGroups,
    fieldServiceMeetings,
    customDuties,
    cartShifts,
    cartLocations,
    outgoingSpeakers,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
  } = useCongregation();
  const { activeRole, isCoordinator } = useAuth();

  const canManageNotices =
    isCoordinator ||
    activeRole === 'coordinador' ||
    activeRole === 'anciano' ||
    activeRole === 'secretario' ||
    activeRole === 'superintendente_vym';

  // Pestaña activa del Centro de Tablero Digital KHS
  const [activeSubTab, setActiveSubTab] = useState<BoardSubTab>('cartelera_khs');

  // Semana seleccionada para la Cartelera KHS Todo-en-Uno
  const [selectedWeekId, setSelectedWeekId] = useState<string>(
    () => currentWeek?.id || weeks[0]?.id || ''
  );

  const selectedWeek = useMemo(() => {
    return weeks.find((w) => w.id === selectedWeekId) || currentWeek || weeks[0];
  }, [weeks, selectedWeekId, currentWeek]);

  // Toast informativo
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedBoardBull, setCopiedBoardBull] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Estado del Despacho Mensual de Hojas Personales KHS
  const [dispatchMonthFilter, setDispatchMonthFilter] = useState<string>('all_upcoming');
  const [dispatchSearch, setDispatchSearch] = useState<string>('');
  const [dispatchCategoryFilter, setDispatchCategoryFilter] = useState<'todas' | UnifiedAssignmentCategory>('todas');
  const [expandedPublisherIds, setExpandedPublisherIds] = useState<Record<string, boolean>>({});
  const [copiedPubBundleId, setCopiedPubBundleId] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    weeks.forEach((w) => {
      if (w.weekStartDate) set.add(w.weekStartDate.slice(0, 7));
      if (w.midweek?.date) set.add(w.midweek.date.slice(0, 7));
      if (w.weekend?.date) set.add(w.weekend.date.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [weeks]);

  const publisherBundles = useMemo(() => {
    return extractAllPublishersMonthlyBundles(
      {
        publishers,
        publishersMap,
        weeks,
        settings,
        preachingGroups,
        customDuties,
        cartShifts,
        cartLocations,
        outgoingSpeakers,
        fieldServiceMeetings,
        circuitVisit,
      },
      dispatchMonthFilter
    );
  }, [
    publishers,
    publishersMap,
    weeks,
    settings,
    preachingGroups,
    customDuties,
    cartShifts,
    cartLocations,
    outgoingSpeakers,
    fieldServiceMeetings,
    circuitVisit,
    dispatchMonthFilter,
  ]);

  const filteredBundles = useMemo(() => {
    const q = dispatchSearch.trim().toLowerCase();
    return publisherBundles.filter((b) => {
      if (q && !b.publisher.name.toLowerCase().includes(q)) return false;
      if (
        dispatchCategoryFilter !== 'todas' &&
        (b.countsByCategory[dispatchCategoryFilter] || 0) === 0
      ) {
        return false;
      }
      return true;
    });
  }, [publisherBundles, dispatchSearch, dispatchCategoryFilter]);

  const bundleStats = useMemo(() => {
    let totalAssignments = 0;
    let totalFamilyDays = 0;
    publisherBundles.forEach((b) => {
      totalAssignments += b.assignments.length;
      totalFamilyDays += b.familySharedDaysCount;
    });
    return {
      publishersCount: publisherBundles.length,
      totalAssignments,
      totalFamilyDays,
    };
  }, [publisherBundles]);

  // Estado de Comunicados Oficiales
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedNoticeId, setCopiedNoticeId] = useState<string | null>(null);
  const [confirmDeleteNoticeId, setConfirmDeleteNoticeId] = useState<string | null>(null);

  // Modal create/edit notice
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<CongregationNotice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'anuncio' as CongregationNotice['category'],
    content: '',
    date: new Date().toISOString().split('T')[0],
    expiresDate: '',
    pinned: false,
    author: 'Cuerpo de Ancianos',
  });

  const filteredNotices = notices.filter((n) => {
    if (selectedCategory !== 'todos' && n.category !== selectedCategory) return false;
    return true;
  });

  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.date.localeCompare(a.date);
  });

  const handleOpenNew = () => {
    if (!canManageNotices) return;
    setEditingNotice(null);
    setFormData({
      title: '',
      category: 'anuncio',
      content: '',
      date: new Date().toISOString().split('T')[0],
      expiresDate: '',
      pinned: false,
      author: 'Cuerpo de Ancianos',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: CongregationNotice) => {
    if (!canManageNotices) return;
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      category: notice.category,
      content: notice.content,
      date: notice.date,
      expiresDate: notice.expiresDate || '',
      pinned: notice.pinned,
      author: notice.author || 'Cuerpo de Ancianos',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingNotice) {
      updateNotice({
        ...editingNotice,
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        date: formData.date,
        expiresDate: formData.expiresDate || undefined,
        pinned: formData.pinned,
        author: formData.author.trim() || undefined,
      });
      triggerToast('Comunicado actualizado en el Tablero del Salón.');
    } else {
      addNotice({
        title: formData.title.trim(),
        category: formData.category,
        content: formData.content.trim(),
        date: formData.date,
        expiresDate: formData.expiresDate || undefined,
        pinned: formData.pinned,
        author: formData.author.trim() || undefined,
      });
      triggerToast('Nuevo comunicado fijado en el Tablero del Salón.');
    }

    setIsModalOpen(false);
  };

  const handleCopyNotice = (notice: CongregationNotice) => {
    let msg = `*📢 ${notice.title.toUpperCase()}*\n`;
    msg += `Congregación: ${settings.congregationName}\n`;
    msg += `Fecha: ${notice.date}\n`;
    if (notice.author) msg += `Publicado por: ${notice.author}\n\n`;
    msg += `${notice.content}\n\n`;
    if (notice.expiresDate) msg += `_Válido hasta: ${notice.expiresDate}_\n`;

    navigator.clipboard.writeText(msg);
    setCopiedNoticeId(notice.id);
    setTimeout(() => setCopiedNoticeId(null), 2500);
  };

  // Acciones de la Cartelera KHS Todo-en-Uno
  const buildBoardCtx = () => ({
    week: selectedWeek,
    weeks,
    publishersMap,
    settings,
    preachingGroups,
    fieldServiceMeetings,
    notices,
    customDuties,
    cartShifts,
    cartLocations,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
  });

  const handlePrintBoardA4 = () => {
    if (!selectedWeek) return;
    printUnifiedKingdomHallBoardA4(buildBoardCtx());
  };

  const handleShareBoardWhatsApp = () => {
    if (!selectedWeek) return;
    const msg = buildWeeklyInformationBoardWhatsApp(buildBoardCtx());
    openWhatsAppLink('', msg);
  };

  const handleCopyBoardWhatsApp = () => {
    if (!selectedWeek) return;
    const msg = buildWeeklyInformationBoardWhatsApp(buildBoardCtx());
    navigator.clipboard.writeText(msg);
    setCopiedBoardBull(true);
    setTimeout(() => setCopiedBoardBull(false), 2500);
    triggerToast('Boletín semanal consolidado copiado al portapapeles.');
  };

  const handleDownloadMasterIcs = () => {
    if (!selectedWeek) return;
    const count = downloadCongregationMasterCalendarIcs(buildBoardCtx());
    triggerToast(
      `Calendario Maestro del Salón del Reino (.ics) descargado con ${count} reuniones y eventos.`
    );
  };

  const getCategoryBadge = (cat: CongregationNotice['category']) => {
    switch (cat) {
      case 'circuito':
        return { label: 'Visita del SC', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'asamblea':
        return { label: 'Asamblea', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
      case 'campana':
        return { label: 'Campaña Especial', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'limpieza':
        return { label: 'Aseo y Salón', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
      case 'carta':
        return { label: 'Carta Oficial', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' };
      default:
        return { label: 'Anuncio General', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  const standardDutyKeys = [
    'deber_audio',
    'deber_video',
    'deber_microfonos',
    'deber_acomodador',
    'deber_plataforma',
    'deber_seguridad',
  ];

  return (
    <div className="space-y-5">
      {/* Toast flotante */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra Principal de Navegación del Tablero Digital */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('cartelera_khs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'cartelera_khs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Cartelera del Salón Todo-en-Uno</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('despacho_mensual_khs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'despacho_mensual_khs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Hojas Mensuales por Hermano (.ics + WhatsApp)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeSubTab === 'despacho_mensual_khs'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {bundleStats.publishersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('anuncios_cartas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'anuncios_cartas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Comunicados y Cartas Oficiales</span>
            {notices.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeSubTab === 'anuncios_cartas'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {notices.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManageNotices && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Anuncio</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          SUB-VISTA 1: CARTELERA DEL SALÓN DEL REINO TODO-EN-UNO
         ===================================================================== */}
      {activeSubTab === 'cartelera_khs' && selectedWeek && (
        <div className="space-y-5">
          {/* Barra de Control de la Semana y Exportaciones de Cartelera */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Tablero de Información S-140 / S-28 / Deberes
                </span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <select
                    value={selectedWeek.id}
                    onChange={(e) => setSelectedWeekId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {weeks.map((wk) => (
                      <option key={wk.id} value={wk.id}>
                        Semana del {wk.weekStartDate} al {wk.weekEndDate}
                        {wk.specialEvent?.title ? ` ★ ${wk.specialEvent.title}` : ''}
                      </option>
                    ))}
                  </select>

                  {currentWeek && selectedWeek.id !== currentWeek.id && (
                    <button
                      type="button"
                      onClick={() => setSelectedWeekId(currentWeek.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer"
                    >
                      Ir a Semana Actual
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de Acción de la Cartelera */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrintBoardA4}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Imprimir hoja A4 consolidada lista para fijar en el Tablero de Información del Salón del Reino"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cartelera A4 (Salón)</span>
              </button>

              <button
                type="button"
                onClick={handleShareBoardWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Compartir el boletín semanal completo por WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Boletín WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyBoardWhatsApp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                title="Copiar boletín semanal de toda la cartelera"
              >
                {copiedBoardBull ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedBoardBull ? 'Copiado' : 'Copiar Boletín'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMasterIcs}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-bold transition-all cursor-pointer"
                title="Descargar calendario general del Salón del Reino (.ics) para Google / Apple / Outlook Calendar"
              >
                <Download className="w-4 h-4" />
                <span>Calendario Salón (.ics)</span>
              </button>
            </div>
          </div>

          {/* Grid Principal de los 6 Bloques del Tablero del Salón del Reino */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* COLUMNA IZQUIERDA (7 cols): S-140 VIDA Y MINISTERIO + REUNIÓN PÚBLICA */}
            <div className="lg:col-span-7 space-y-5">
              {/* BLOQUE 1: VIDA Y MINISTERIO CRISTIANOS (S-140) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="bg-indigo-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Reunión Vida y Ministerio Cristianos (S-140)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-lg">
                    {formatShortSpanishDate(selectedWeek.midweek.date || selectedWeek.weekStartDate)} •{' '}
                    {settings.midweekMeetingTime || '19:00'}
                  </span>
                </div>

                {selectedWeek.specialEvent?.noMeetingMidweek ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Sin reunión entre semana en el Salón ({selectedWeek.specialEvent.title || 'Evento Especial'}).
                  </div>
                ) : (
                  <div className="p-4 space-y-4 text-xs">
                    {/* Presidente, Consejero y Oración Inicial */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Presidente
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {resolvePublisherName(selectedWeek.midweek.presidentId, publishersMap)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Consejero Sala Auxiliar
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {selectedWeek.midweek.auxiliaryCounselorId
                            ? resolvePublisherName(selectedWeek.midweek.auxiliaryCounselorId, publishersMap)
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Oración Inicial
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {resolvePublisherName(selectedWeek.midweek.initialPrayerId, publishersMap)}
                        </span>
                      </div>
                    </div>

                    {/* Tesoros de la Biblia */}
                    <div className="border-l-4 border-slate-600 pl-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Tesoros de la Biblia
                        </span>
                        {selectedWeek.midweek.bibleReading && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            📖 {selectedWeek.midweek.bibleReading}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <div className="py-1.5 flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-300">
                            1. {selectedWeek.midweek.tesoros.discurso.title} (10 min)
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {resolvePublisherName(
                              selectedWeek.midweek.tesoros.discurso.publisherId,
                              publishersMap
                            )}
                          </span>
                        </div>
                        <div className="py-1.5 flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-300">
                            2. Busquemos Perlas Escondidas (10 min)
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {resolvePublisherName(
                              selectedWeek.midweek.tesoros.perlas.publisherId,
                              publishersMap
                            )}
                          </span>
                        </div>
                        <div className="py-1.5 flex items-center justify-between gap-2">
                          <span className="text-slate-600 dark:text-slate-300">
                            3. Lectura de la Biblia (4 min)
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {resolvePublisherName(
                                selectedWeek.midweek.tesoros.lecturaBiblia.publisherId,
                                publishersMap
                              )}
                            </span>
                            {selectedWeek.midweek.tesoros.lecturaBibliaAux?.publisherId && (
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                Sala Aux:{' '}
                                {resolvePublisherName(
                                  selectedWeek.midweek.tesoros.lecturaBibliaAux.publisherId,
                                  publishersMap
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seamos Mejores Maestros */}
                    <div className="border-l-4 border-amber-500 pl-3 space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        Seamos Mejores Maestros
                      </span>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedWeek.midweek.maestros.items.map((item, idx) => {
                          const tit = resolvePublisherName(item.publisherId, publishersMap);
                          const ast = item.assistantId
                            ? resolvePublisherName(item.assistantId, publishersMap)
                            : null;
                          return (
                            <div
                              key={item.id || idx}
                              className="py-1.5 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-600 dark:text-slate-300">
                                  {item.title} {item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
                                </span>
                                {item.room === 'auxiliar' && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    Sala Auxiliar
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white text-right">
                                {tit}
                                {ast && (
                                  <span className="font-medium text-slate-500 dark:text-slate-400">
                                    {' '}
                                    / {ast}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nuestra Vida Cristiana */}
                    <div className="border-l-4 border-rose-600 pl-3 space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                        Nuestra Vida Cristiana
                      </span>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedWeek.midweek.vidaCristiana.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="py-1.5 flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-600 dark:text-slate-300">
                              {item.title} {item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {resolvePublisherName(item.publisherId, publishersMap)}
                            </span>
                          </div>
                        ))}
                        <div className="py-1.5 flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            Estudio Bíblico de la Congregación (30 min)
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-right">
                            {resolvePublisherName(
                              selectedWeek.midweek.vidaCristiana.estudioBiblico.conductorId,
                              publishersMap
                            )}{' '}
                            <span className="font-normal text-slate-500">
                              (Lector:{' '}
                              {resolvePublisherName(
                                selectedWeek.midweek.vidaCristiana.estudioBiblico.lectorId,
                                publishersMap
                              )}
                              )
                            </span>
                          </span>
                        </div>
                        <div className="py-1.5 flex items-center justify-between gap-2">
                          <span className="text-slate-500">Oración de Conclusión</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {resolvePublisherName(selectedWeek.midweek.finalPrayerId, publishersMap)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUE 2: REUNIÓN PÚBLICA Y ESTUDIO DE LA ATALAYA */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Reunión Pública y Estudio de La Atalaya
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-lg">
                    {formatShortSpanishDate(selectedWeek.weekend.date || selectedWeek.weekEndDate)} •{' '}
                    {settings.weekendMeetingTime || '10:00'}
                  </span>
                </div>

                {selectedWeek.specialEvent?.noMeetingWeekend ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Sin reunión de fin de semana en el Salón ({selectedWeek.specialEvent.title || 'Evento Especial'}).
                  </div>
                ) : (
                  <div className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Presidente
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {resolvePublisherName(selectedWeek.weekend.presidentId, publishersMap)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Canciones
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {[
                            selectedWeek.weekend.openingSong && `#${selectedWeek.weekend.openingSong}`,
                            selectedWeek.weekend.middleSong && `#${selectedWeek.weekend.middleSong}`,
                            selectedWeek.weekend.closingSong && `#${selectedWeek.weekend.closingSong}`,
                          ]
                            .filter(Boolean)
                            .join(' • ') || 'Según programa'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Hospitalidad Orador
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {selectedWeek.weekend.hospitalityPublisherId
                            ? resolvePublisherName(
                                selectedWeek.weekend.hospitalityPublisherId,
                                publishersMap
                              )
                            : 'Sin asignar'}
                        </span>
                      </div>
                    </div>

                    {/* Discurso Público */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          Discurso Público (30 min)
                          {selectedWeek.weekend.publicTalkOutlineNumber
                            ? ` • Bosquejo #${selectedWeek.weekend.publicTalkOutlineNumber}`
                            : ''}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                          {selectedWeek.weekend.isVisitingSpeaker ? 'Orador Visitante' : 'Orador Local'}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        “{selectedWeek.weekend.publicTalkTheme || 'Tema por confirmar'}”
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Orador:</strong>{' '}
                        {selectedWeek.weekend.isVisitingSpeaker
                          ? selectedWeek.weekend.publicTalkSpeaker || 'Por confirmar'
                          : resolvePublisherName(
                              selectedWeek.weekend.publicTalkSpeaker,
                              publishersMap
                            )}
                        {selectedWeek.weekend.isVisitingSpeaker &&
                          selectedWeek.weekend.visitingSpeakerCongregation && (
                            <span className="text-slate-500">
                              {' '}
                              — Congregación {selectedWeek.weekend.visitingSpeakerCongregation}
                            </span>
                          )}
                      </p>
                    </div>

                    {/* Estudio de La Atalaya */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                          Conductor La Atalaya
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {resolvePublisherName(selectedWeek.weekend.atalayaConductorId, publishersMap)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                          Lector La Atalaya
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {resolvePublisherName(selectedWeek.weekend.atalayaLectorId, publishersMap)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Oración Final
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {resolvePublisherName(selectedWeek.weekend.finalPrayerId, publishersMap)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA (5 cols): DEBERES MECÁNICOS + ASEO S-28 + SERVICIO DEL CAMPO */}
            <div className="lg:col-span-5 space-y-5">
              {/* BLOQUE 3: MATRIZ DE DEBERES MECÁNICOS Y ACOMODADORES */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Deberes, Audio/Video y Acomodadores
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold uppercase text-slate-500">
                        <th className="py-2.5 px-3">Departamento</th>
                        <th className="py-2.5 px-3">Entre Semana</th>
                        <th className="py-2.5 px-3">Fin de Semana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {standardDutyKeys.map((dKey) => {
                        const label = getDutyFriendlyLabel(dKey, customDuties);
                        const midNames = resolveDutyNamesList(
                          selectedWeek.midweek.duties,
                          [dKey],
                          publishersMap
                        );
                        const wkndNames = resolveDutyNamesList(
                          selectedWeek.weekend.duties,
                          [dKey],
                          publishersMap
                        );
                        return (
                          <tr key={dKey} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                              {label}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              {midNames}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              {wkndNames}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BLOQUE 4: PROGRAMA DE ASEO DEL SALÓN DEL REINO (S-28) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="bg-emerald-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brush className="w-4 h-4 text-emerald-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Aseo y Limpieza del Salón (S-28)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded">
                    {CLEANING_TYPE_LABELS[selectedWeek.cleaningType || 'semanal']}
                  </span>
                </div>

                <div className="p-4 space-y-2.5 text-xs">
                  {(selectedWeek.cleaningGroupNumbers?.length
                    ? selectedWeek.cleaningGroupNumbers
                    : [1]
                  ).map((gNum) => {
                    const grp = preachingGroups.find((g) => g.number === gNum);
                    const ovs = grp?.overseerId ? publishersMap.get(grp.overseerId)?.name : 'Por asignar';
                    const ast = grp?.assistantId ? publishersMap.get(grp.assistantId)?.name : 'Por asignar';
                    return (
                      <div
                        key={gNum}
                        className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm block">
                            Grupo #{gNum} {grp?.name ? `— ${grp.name}` : ''}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">
                            Sup.: <strong>{ovs}</strong> • Aux.: <strong>{ast}</strong>
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]">
                          Responsable
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Modalidad:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {CLEANING_TYPE_LABELS[selectedWeek.cleaningType || 'semanal']}
                      </strong>
                    </span>
                    <span>
                      Insumos:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {CLEANING_SUPPLIES_LABELS[selectedWeek.cleaningSuppliesStatus || 'abastecido'].label}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* BLOQUE 5: SALIDAS AL SERVICIO DEL CAMPO */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Salidas al Servicio del Campo
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 text-xs">
                  {fieldServiceMeetings.length === 0 ? (
                    <p className="text-slate-400 text-center py-3">
                      No hay salidas registradas en el programa.
                    </p>
                  ) : (
                    fieldServiceMeetings.slice(0, 5).map((fsm) => (
                      <div
                        key={fsm.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {fsm.dayOfWeek} • {fsm.time}
                          </span>
                          <span className="text-[11px] text-slate-500 block">{fsm.location}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] block">
                            {fsm.conductorId
                              ? resolvePublisherName(fsm.conductorId, publishersMap)
                              : 'Conductor'}
                          </span>
                          {fsm.territoryNumber && (
                            <span className="text-[10px] text-slate-400">
                              Territorio #{fsm.territoryNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* BLOQUE 6: ANUNCIOS FIJADOS EN LA CARTELERA */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="bg-indigo-950 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-amber-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Avisos y Cartas Fijadas
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('anuncios_cartas')}
                    className="text-[11px] font-bold text-indigo-200 hover:text-white underline cursor-pointer"
                  >
                    Ver todos ({notices.length})
                  </button>
                </div>

                <div className="p-3.5 space-y-2.5 text-xs">
                  {sortedNotices.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                        {n.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-VISTA 2: DESPACHO MENSUAL DE HOJAS PERSONALES (.ICS + WHATSAPP)
         ===================================================================== */}
      {activeSubTab === 'despacho_mensual_khs' && (
        <div className="space-y-5">
          {/* KPIs y Filtros de Despacho Mensual */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Despacho Unificado Mensual
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Hojas Personales del Mes y Calendarios (.ics) por Publicador
                </h3>
                <p className="text-xs text-slate-500">
                  Envía en un solo mensaje de WhatsApp o archivo .ics todas las partes de VMC, Fin de Semana, Audio/Micrófonos, Aseo y Carritos de cada hermano.
                </p>
              </div>

              {/* Tarjetas Resumen KPI */}
              <div className="grid grid-cols-3 gap-2.5 shrink-0">
                <div className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-center">
                  <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300 block">
                    {bundleStats.publishersCount}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Hermanos Asignados</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                  <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 block">
                    {bundleStats.totalAssignments}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Turnos / Partes</span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-center">
                  <span className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 block">
                    {bundleStats.totalFamilyDays}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Noches en Familia</span>
                </div>
              </div>
            </div>

            {/* Controles de Filtro por Mes, Categoría y Buscador */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dispatchSearch}
                  onChange={(e) => setDispatchSearch(e.target.value)}
                  placeholder="Buscar hermano o hermana..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={dispatchCategoryFilter}
                  onChange={(e) => setDispatchCategoryFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="todas">Todas las áreas teocráticas</option>
                  <option value="vym">📖 Vida y Ministerio</option>
                  <option value="fin_de_semana">🏛️ Reunión Fin de Semana</option>
                  <option value="deberes">🎧 Audio / Micrófonos / Acomodadores</option>
                  <option value="limpieza">🧹 Aseo del Salón (S-28)</option>
                  <option value="carritos">🛒 Carritos</option>
                  <option value="servicio_campo">🧭 Salidas al Campo</option>
                </select>

                <select
                  value={dispatchMonthFilter}
                  onChange={(e) => setDispatchMonthFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="all_upcoming">Todas las semanas cargadas</option>
                  {availableMonths.map((mKey) => (
                    <option key={mKey} value={mKey}>
                      {formatSpanishMonthLabel(mKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Paquetes Mensuales por Hermano */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBundles.map((bundle) => {
              const { publisher: pub, assignments, countsByCategory, familySharedDaysCount } = bundle;
              const isExpanded = Boolean(expandedPublisherIds[pub.id]);

              return (
                <div
                  key={pub.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {pub.name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {assignments.length}{' '}
                          {assignments.length === 1 ? 'asignación consolidada' : 'asignaciones consolidadas'}
                          {pub.groupNumber ? ` • Grupo #${pub.groupNumber}` : ''}
                        </span>
                      </div>

                      {familySharedDaysCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                          👨‍👩‍👧‍👦 {familySharedDaysCount} d. en familia
                        </span>
                      )}
                    </div>

                    {/* Chips de desglose por área */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                      {countsByCategory.vym > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          📖 VMC: {countsByCategory.vym}
                        </span>
                      )}
                      {countsByCategory.fin_de_semana > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          🏛️ Fin Sem.: {countsByCategory.fin_de_semana}
                        </span>
                      )}
                      {countsByCategory.deberes > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                          🎧 Deberes: {countsByCategory.deberes}
                        </span>
                      )}
                      {countsByCategory.limpieza > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          🧹 Aseo: {countsByCategory.limpieza}
                        </span>
                      )}
                      {countsByCategory.carritos > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          🛒 Carritos: {countsByCategory.carritos}
                        </span>
                      )}
                      {countsByCategory.servicio_campo > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                          🧭 Campo: {countsByCategory.servicio_campo}
                        </span>
                      )}
                    </div>

                    {/* Vista previa rápida o desplegable */}
                    <div className="space-y-1 pt-1">
                      {(isExpanded ? assignments : assignments.slice(0, 3)).map((a) => (
                        <div
                          key={a.id}
                          className="text-[11px] flex items-center justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800/70 last:border-0"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            <strong className="text-slate-900 dark:text-white">
                              {formatShortSpanishDate(a.date)}:
                            </strong>{' '}
                            {a.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {a.categoryLabel}
                          </span>
                        </div>
                      ))}

                      {assignments.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPublisherIds((prev) => ({
                              ...prev,
                              [pub.id]: !prev[pub.id],
                            }))
                          }
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 cursor-pointer"
                        >
                          {isExpanded
                            ? 'Ocultar lista completa'
                            : `Ver las ${assignments.length} asignaciones...`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Acciones 1-Clic de Despacho para el Hermano */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const msg = formatUnifiedMonthlyWhatsAppMessage(
                          pub,
                          dispatchMonthFilter,
                          assignments,
                          settings.congregationName
                        );
                        openWhatsAppLink(pub.phone || '', msg);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                      title="Enviar hoja mensual unificada por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Único</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          downloadPublisherUnifiedIcs(
                            pub,
                            dispatchMonthFilter,
                            assignments,
                            settings
                          );
                          triggerToast(`Calendario .ics descargado para ${pub.name}.`);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
                        title="Descargar archivo .ics con todas las asignaciones de este hermano"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.ics</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          printPublisherUnifiedMonthlySheet(
                            pub,
                            dispatchMonthFilter,
                            assignments,
                            settings
                          )
                        }
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        title="Imprimir Hoja Mensual Personal A4"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const msg = formatUnifiedMonthlyWhatsAppMessage(
                            pub,
                            dispatchMonthFilter,
                            assignments,
                            settings.congregationName
                          );
                          navigator.clipboard.writeText(msg);
                          setCopiedPubBundleId(pub.id);
                          setTimeout(() => setCopiedPubBundleId(null), 2000);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        title="Copiar resumen mensual"
                      >
                        {copiedPubBundleId === pub.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-VISTA 3: COMUNICADOS Y CARTAS OFICIALES DEL TABLERO
         ===================================================================== */}
      {activeSubTab === 'anuncios_cartas' && (
        <div className="space-y-5">
          {/* Categories Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos los anuncios' },
              { id: 'circuito', label: 'Visita del SC' },
              { id: 'asamblea', label: 'Asambleas' },
              { id: 'campana', label: 'Campañas' },
              { id: 'limpieza', label: 'Aseo y Salón' },
              { id: 'carta', label: 'Cartas' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Notices Grid */}
          {sortedNotices.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                No hay anuncios publicados en esta categoría
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Presione &ldquo;Publicar Anuncio&rdquo; para redactar un aviso para la congregación.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sortedNotices.map((notice) => {
                const badge = getCategoryBadge(notice.category);

                return (
                  <div
                    key={notice.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                      notice.pinned
                        ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-100 dark:ring-indigo-950/50'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          {notice.pinned && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                              <Pin className="w-3 h-3 fill-indigo-600" />
                              Fijado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyNotice(notice)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Copiar texto para WhatsApp"
                          >
                            {copiedNoticeId === notice.id ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          {canManageNotices && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(notice)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar anuncio"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {confirmDeleteNoticeId === notice.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteNotice(notice.id);
                                    setConfirmDeleteNoticeId(null);
                                    triggerToast('Anuncio eliminado del tablero.');
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold bg-rose-600 text-white rounded-lg cursor-pointer"
                                >
                                  Confirmar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNoticeId(notice.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar anuncio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                        {notice.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                        {notice.content}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Publicado: {notice.date}</span>
                      </div>
                      {notice.author && (
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          Por: {notice.author}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT NOTICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>{editingNotice ? 'Editar Anuncio' : 'Nuevo Anuncio para el Tablero'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Anuncio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Visita del Superintendente de Circuito"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as CongregationNotice['category'],
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="anuncio">Anuncio General</option>
                    <option value="circuito">Visita del SC</option>
                    <option value="asamblea">Asamblea</option>
                    <option value="campana">Campaña Especial</option>
                    <option value="limpieza">Aseo y Salón</option>
                    <option value="carta">Carta Oficial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Publicado por
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cuerpo de Ancianos"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contenido del Anuncio
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escriba los detalles completos del comunicado..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vigencia hasta (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresDate}
                    onChange={(e) => setFormData({ ...formData, expiresDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-1">
                <SplashCheckbox
                  size="sm"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  label="Fijar este anuncio al inicio del tablero"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
                >
                  Guardar Anuncio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
