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
  Building2,
  Tv,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Volume2,
  AlertCircle,
  Sparkle,
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

interface TableroAnunciosTabProps {
  onOpenKioskModal?: () => void;
}

const getPublisherGradient = (name: string) => {
  const gradients = [
    'from-indigo-600 to-violet-600',
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-violet-600 to-purple-600',
    'from-amber-600 to-orange-600',
    'from-rose-600 to-pink-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
};

export const TableroAnunciosTab: React.FC<TableroAnunciosTabProps> = ({ onOpenKioskModal }) => {
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

  const currentWeekIndex = useMemo(() => {
    return weeks.findIndex((w) => w.id === (selectedWeek?.id || ''));
  }, [weeks, selectedWeek]);

  const isCurrentWeekToday = Boolean(
    currentWeek && selectedWeek && selectedWeek.id === currentWeek.id
  );

  const goToPrevWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeekId(weeks[currentWeekIndex - 1].id);
    }
  };

  const goToNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setSelectedWeekId(weeks[currentWeekIndex + 1].id);
    }
  };

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
        return {
          label: 'Visita del SC',
          bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25',
          dot: 'bg-purple-500',
        };
      case 'asamblea':
        return {
          label: 'Asamblea',
          bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25',
          dot: 'bg-sky-500',
        };
      case 'campana':
        return {
          label: 'Campaña Especial',
          bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25',
          dot: 'bg-amber-500',
        };
      case 'limpieza':
        return {
          label: 'Aseo y Salón',
          bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
          dot: 'bg-emerald-500',
        };
      case 'carta':
        return {
          label: 'Carta Oficial',
          bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25',
          dot: 'bg-indigo-500',
        };
      default:
        return {
          label: 'Anuncio General',
          bg: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/25',
          dot: 'bg-zinc-500',
        };
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

  const getDutyIcon = (dKey: string) => {
    switch (dKey) {
      case 'deber_audio':
        return <Volume2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />;
      case 'deber_video':
        return <Tv className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />;
      case 'deber_microfonos':
        return <Mic className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />;
      case 'deber_acomodador':
        return <Users className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
      case 'deber_plataforma':
        return <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'deber_seguridad':
        return <Shield className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const renderDutyListChips = (namesString: string) => {
    if (!namesString || namesString === 'Sin asignar') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800">
          Sin asignar
        </span>
      );
    }
    const names = namesString.split(',').map((s) => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1">
        {names.map((name, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10"
          >
            {name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5 kg-ambient-mesh">
      {/* Toast Flotante */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl kg-glass-surface text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg animate-in fade-in border border-indigo-500/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          BARRA PRINCIPAL DE NAVEGACIÓN TÁCTIL (BENTO CAPSULE)
         ===================================================================== */}
      <div className="kg-card-bento kg-glass-surface kg-sheen-top p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-sm">
        {/* Subtab Segmented Control */}
        <div className="flex items-center p-1 bg-zinc-100/90 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/80 dark:border-white/10 gap-1 w-full lg:w-auto backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveSubTab('cartelera_khs')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 select-none ${
              activeSubTab === 'cartelera_khs'
                ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate hidden sm:inline">Cartelera del Salón</span>
            <span className="truncate sm:hidden">Cartelera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('despacho_mensual_khs')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 select-none ${
              activeSubTab === 'despacho_mensual_khs'
                ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate hidden sm:inline">Hojas por Hermano</span>
            <span className="truncate sm:hidden">Hojas (.ics)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 font-mono tabular-nums ${
                activeSubTab === 'despacho_mensual_khs'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                  : 'bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {bundleStats.publishersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('anuncios_cartas')}
            className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 select-none ${
              activeSubTab === 'anuncios_cartas'
                ? 'bg-white dark:bg-[#18181F] text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-white/10'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5]'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="truncate hidden sm:inline">Comunicados y Cartas</span>
            <span className="truncate sm:hidden">Comunicados</span>
            {notices.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 font-mono tabular-nums ${
                  activeSubTab === 'anuncios_cartas'
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                    : 'bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {notices.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end w-full lg:w-auto">
          {onOpenKioskModal && (
            <button
              type="button"
              onClick={onOpenKioskModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white/10 dark:hover:bg-white/15 text-white dark:text-zinc-100 text-xs font-bold transition-all cursor-pointer active:scale-95 border border-zinc-800 dark:border-white/10 shadow-xs"
              title="Abrir modo pantalla gigante / Kiosco TV para el Salón del Reino"
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Pantalla Salón (TV)</span>
            </button>
          )}

          {canManageNotices && (
            <button
              type="button"
              onClick={handleOpenNew}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow-indigo-500/25"
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
          {/* Barra de Control de la Semana y Acciones de Cartelera */}
          <div className="kg-card-bento kg-glass-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Prev / Next Week Capsule */}
              <div className="flex items-center bg-zinc-100/90 dark:bg-zinc-800/60 p-1 rounded-2xl border border-zinc-200/80 dark:border-white/10 gap-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={goToPrevWeek}
                  disabled={currentWeekIndex <= 0}
                  className="p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                  title="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={selectedWeek.id}
                  onChange={(e) => setSelectedWeekId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181F] text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] border border-zinc-200/80 dark:border-white/10 cursor-pointer font-mono tabular-nums focus:outline-none shadow-xs"
                >
                  {weeks.map((wk) => (
                    <option key={wk.id} value={wk.id}>
                      Semana: {wk.weekStartDate} al {wk.weekEndDate}
                      {wk.specialEvent?.title ? ` ★ ${wk.specialEvent.title}` : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={goToNextWeek}
                  disabled={currentWeekIndex >= weeks.length - 1}
                  className="p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                  title="Semana siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Botón Ir a Hoy */}
              {currentWeek && !isCurrentWeekToday && (
                <button
                  type="button"
                  onClick={() => setSelectedWeekId(currentWeek.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-400/40 cursor-pointer transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse inline-block" />
                  <span>Ir a Semana Actual</span>
                </button>
              )}

              {isCurrentWeekToday && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse inline-block" />
                  <span>Semana en Curso (Hoy)</span>
                </span>
              )}
            </div>

            {/* Acciones de Exportación de Cartelera */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrintBoardA4}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Imprimir hoja A4 consolidada lista para fijar en el Tablero de Información del Salón del Reino"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cartelera A4</span>
              </button>

              <button
                type="button"
                onClick={handleShareBoardWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs hover:shadow-emerald-500/20"
                title="Compartir el boletín semanal completo por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>Boletín WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyBoardWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Copiar boletín semanal de toda la cartelera"
              >
                {copiedBoardBull ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedBoardBull ? 'Copiado' : 'Copiar Boletín'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMasterIcs}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
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
              <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-800/30 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                        Reunión Vida y Ministerio Cristianos (S-140)
                      </h3>
                      <span className="text-[10px] text-indigo-300 font-medium block">
                        Programa semanal oficial y estudiantes
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-white/15 px-3 py-1 rounded-xl font-mono tabular-nums border border-white/10 shadow-xs">
                    {formatShortSpanishDate(selectedWeek.midweek.date || selectedWeek.weekStartDate)} •{' '}
                    {settings.midweekMeetingTime || '19:00'}
                  </span>
                </div>

                {selectedWeek.specialEvent?.noMeetingMidweek ? (
                  <div className="p-8 text-center text-xs text-zinc-500 dark:text-[#A1A1AA] space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      Sin reunión entre semana en el Salón
                    </p>
                    <p>Evento especial: {selectedWeek.specialEvent.title || 'Visita / Asamblea'}</p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Presidente, Consejero y Oración Inicial */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50/80 dark:bg-white/5 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Presidente
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white text-sm">
                          {resolvePublisherName(selectedWeek.midweek.presidentId, publishersMap)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Consejero Sala Auxiliar
                        </span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {selectedWeek.midweek.auxiliaryCounselorId
                            ? resolvePublisherName(selectedWeek.midweek.auxiliaryCounselorId, publishersMap)
                            : '—'}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Oración Inicial
                        </span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {resolvePublisherName(selectedWeek.midweek.initialPrayerId, publishersMap)}
                        </span>
                      </div>
                    </div>

                    {/* Tesoros de la Biblia */}
                    <div className="border-l-4 border-slate-500 pl-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Tesoros de la Biblia
                        </span>
                        {selectedWeek.midweek.bibleReading && (
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/40">
                            📖 {selectedWeek.midweek.bibleReading}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-zinc-100 dark:divide-white/5">
                        <div className="py-2 flex items-center justify-between gap-2">
                          <span className="text-zinc-600 dark:text-[#A1A1AA]">
                            1. {selectedWeek.midweek.tesoros.discurso.title} (10 min)
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                            {resolvePublisherName(
                              selectedWeek.midweek.tesoros.discurso.publisherId,
                              publishersMap
                            )}
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between gap-2">
                          <span className="text-zinc-600 dark:text-[#A1A1AA]">
                            2. Busquemos Perlas Escondidas (10 min)
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                            {resolvePublisherName(
                              selectedWeek.midweek.tesoros.perlas.publisherId,
                              publishersMap
                            )}
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between gap-2">
                          <span className="text-zinc-600 dark:text-[#A1A1AA]">
                            3. Lectura de la Biblia (4 min)
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] block">
                              {resolvePublisherName(
                                selectedWeek.midweek.tesoros.lecturaBiblia.publisherId,
                                publishersMap
                              )}
                            </span>
                            {selectedWeek.midweek.tesoros.lecturaBibliaAux?.publisherId && (
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
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
                    <div className="border-l-4 border-amber-500 pl-3.5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        Seamos Mejores Maestros
                      </span>
                      <div className="divide-y divide-zinc-100 dark:divide-white/5">
                        {selectedWeek.midweek.maestros.items.map((item, idx) => {
                          const tit = resolvePublisherName(item.publisherId, publishersMap);
                          const ast = item.assistantId
                            ? resolvePublisherName(item.assistantId, publishersMap)
                            : null;
                          return (
                            <div
                              key={item.id || idx}
                              className="py-2 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-zinc-600 dark:text-[#A1A1AA]">
                                  {item.title} {item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
                                </span>
                                {item.room === 'auxiliar' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                    Sala Auxiliar
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-right">
                                {tit}
                                {ast && (
                                  <span className="font-medium text-zinc-500 dark:text-[#A1A1AA]">
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
                    <div className="border-l-4 border-rose-600 pl-3.5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                        Nuestra Vida Cristiana
                      </span>
                      <div className="divide-y divide-zinc-100 dark:divide-white/5">
                        {selectedWeek.midweek.vidaCristiana.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="py-2 flex items-center justify-between gap-2"
                          >
                            <span className="text-zinc-600 dark:text-[#A1A1AA]">
                              {item.title} {item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                              {resolvePublisherName(item.publisherId, publishersMap)}
                            </span>
                          </div>
                        ))}
                        <div className="py-2 flex items-center justify-between gap-2">
                          <span className="font-semibold text-zinc-700 dark:text-[#F4F4F5]">
                            Estudio Bíblico de la Congregación (30 min)
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-right">
                            {resolvePublisherName(
                              selectedWeek.midweek.vidaCristiana.estudioBiblico.conductorId,
                              publishersMap
                            )}{' '}
                            <span className="font-normal text-zinc-500 dark:text-[#A1A1AA]">
                              (Lector:{' '}
                              {resolvePublisherName(
                                selectedWeek.midweek.vidaCristiana.estudioBiblico.lectorId,
                                publishersMap
                              )}
                              )
                            </span>
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between gap-2">
                          <span className="text-zinc-500 dark:text-[#A1A1AA]">Oración de Conclusión</span>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5]">
                            {resolvePublisherName(selectedWeek.midweek.finalPrayerId, publishersMap)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUE 2: REUNIÓN PÚBLICA Y ESTUDIO DE LA ATALAYA */}
              <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-blue-800/30 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                        Reunión Pública y Estudio de La Atalaya
                      </h3>
                      <span className="text-[10px] text-blue-300 font-medium block">
                        Discurso bíblico y artículo temático
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-white/15 px-3 py-1 rounded-xl font-mono tabular-nums border border-white/10 shadow-xs">
                    {formatShortSpanishDate(selectedWeek.weekend.date || selectedWeek.weekEndDate)} •{' '}
                    {settings.weekendMeetingTime || '10:00'}
                  </span>
                </div>

                {selectedWeek.specialEvent?.noMeetingWeekend ? (
                  <div className="p-8 text-center text-xs text-zinc-500 dark:text-[#A1A1AA] space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      Sin reunión de fin de semana en el Salón
                    </p>
                    <p>Evento especial: {selectedWeek.specialEvent.title || 'Asamblea / Memorial'}</p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 space-y-4 text-xs">
                    {/* Presidente, Canciones y Hospitalidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50/80 dark:bg-white/5 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Presidente
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white text-sm">
                          {resolvePublisherName(selectedWeek.weekend.presidentId, publishersMap)}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Canciones
                        </span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
                          {[
                            selectedWeek.weekend.openingSong && `#${selectedWeek.weekend.openingSong}`,
                            selectedWeek.weekend.middleSong && `#${selectedWeek.weekend.middleSong}`,
                            selectedWeek.weekend.closingSong && `#${selectedWeek.weekend.closingSong}`,
                          ]
                            .filter(Boolean)
                            .join(' • ') || 'Según programa'}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
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

                    {/* Discurso Público Hero Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                          Discurso Público (30 min)
                          {selectedWeek.weekend.publicTalkOutlineNumber
                            ? ` • Bosquejo #${selectedWeek.weekend.publicTalkOutlineNumber}`
                            : ''}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-800 dark:text-blue-200 border border-blue-500/25">
                          {selectedWeek.weekend.isVisitingSpeaker ? 'Orador Visitante' : 'Orador Local'}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white leading-snug">
                        “{selectedWeek.weekend.publicTalkTheme || 'Tema por confirmar'}”
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        <strong>Orador:</strong>{' '}
                        {selectedWeek.weekend.isVisitingSpeaker
                          ? selectedWeek.weekend.publicTalkSpeaker || 'Por confirmar'
                          : resolvePublisherName(
                              selectedWeek.weekend.publicTalkSpeaker,
                              publishersMap
                            )}
                        {selectedWeek.weekend.isVisitingSpeaker &&
                          selectedWeek.weekend.visitingSpeakerCongregation && (
                            <span className="text-zinc-500 dark:text-[#A1A1AA]">
                              {' '}
                              — Congregación {selectedWeek.weekend.visitingSpeakerCongregation}
                            </span>
                          )}
                      </p>
                    </div>

                    {/* Estudio de La Atalaya */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Conductor La Atalaya
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white text-sm">
                          {resolvePublisherName(selectedWeek.weekend.atalayaConductorId, publishersMap)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Lector La Atalaya
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white text-sm">
                          {resolvePublisherName(selectedWeek.weekend.atalayaLectorId, publishersMap)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                          Oración Final
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
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
              <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border-b border-teal-800/30 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                      Deberes, Audio/Video y Acomodadores
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50/90 dark:bg-white/5 border-b border-zinc-200/80 dark:border-white/10 text-[10px] font-extrabold uppercase text-zinc-500 dark:text-zinc-400">
                        <th className="py-2.5 px-3.5">Departamento</th>
                        <th className="py-2.5 px-3">Entre Semana</th>
                        <th className="py-2.5 px-3">Fin de Semana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
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
                          <tr key={dKey} className="hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-2">
                                {getDutyIcon(dKey)}
                                <span className="font-bold text-zinc-800 dark:text-[#F4F4F5]">
                                  {label}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              {renderDutyListChips(midNames)}
                            </td>
                            <td className="py-2.5 px-3">
                              {renderDutyListChips(wkndNames)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BLOQUE 4: PROGRAMA DE ASEO DEL SALÓN DEL REINO (S-28) */}
              <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-zinc-50/90 dark:bg-white/5 border-b border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-[#F4F4F5] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brush className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                      Aseo y Limpieza del Salón (S-28)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-white dark:bg-[#18181F] border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-full font-mono tabular-nums shadow-2xs">
                    {CLEANING_TYPE_LABELS[selectedWeek.cleaningType || 'semanal']}
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
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
                        className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-zinc-900 dark:text-white text-sm block font-mono tabular-nums">
                            Grupo #{gNum} {grp?.name ? `— ${grp.name}` : ''}
                          </span>
                          <span className="text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                            Sup.: <strong className="text-zinc-800 dark:text-[#F4F4F5]">{ovs}</strong> • Aux.: <strong className="text-zinc-800 dark:text-[#F4F4F5]">{ast}</strong>
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-bold text-[10px] shrink-0">
                          Responsable
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA] pt-1">
                    <span>
                      Modalidad:{' '}
                      <strong className="text-zinc-700 dark:text-[#F4F4F5]">
                        {CLEANING_TYPE_LABELS[selectedWeek.cleaningType || 'semanal']}
                      </strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span>Insumos:</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-200">
                        {CLEANING_SUPPLIES_LABELS[selectedWeek.cleaningSuppliesStatus || 'abastecido'].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 5: SALIDAS AL SERVICIO DEL CAMPO */}
              <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 border-b border-sky-800/30 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                      Salidas al Servicio del Campo
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 text-xs">
                  {fieldServiceMeetings.length === 0 ? (
                    <p className="text-zinc-400 dark:text-[#A1A1AA] text-center py-4">
                      No hay salidas registradas en el programa.
                    </p>
                  ) : (
                    fieldServiceMeetings.slice(0, 5).map((fsm) => (
                      <div
                        key={fsm.id}
                        className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                            {fsm.dayOfWeek} • {fsm.time}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] block">{fsm.location}</span>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold text-[11px] block">
                            {fsm.conductorId
                              ? resolvePublisherName(fsm.conductorId, publishersMap)
                              : 'Conductor'}
                          </span>
                          {fsm.territoryNumber && (
                            <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] font-mono tabular-nums">
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
              <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-800/30 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-amber-300" />
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                      Avisos y Cartas Fijadas
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('anuncios_cartas')}
                    className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer font-mono tabular-nums transition-colors"
                  >
                    Ver todos ({notices.length})
                  </button>
                </div>

                <div className="p-3.5 space-y-2.5 text-xs">
                  {sortedNotices.length === 0 ? (
                    <p className="text-zinc-400 dark:text-[#A1A1AA] text-center py-4">
                      No hay anuncios fijados en el tablero.
                    </p>
                  ) : (
                    sortedNotices.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] truncate">{n.title}</span>
                          <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] font-mono tabular-nums shrink-0">{n.date}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA] line-clamp-2">
                          {n.content}
                        </p>
                      </div>
                    ))
                  )}
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
          {/* Bento Hero & KPIs de Despacho Mensual */}
          <div className="kg-card-bento kg-glass-surface kg-sheen-top p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 space-y-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1">
                  Despacho Unificado Mensual
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white">
                  Hojas Personales del Mes y Calendarios (.ics) por Publicador
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-2xl mt-1 leading-relaxed">
                  Envía en un solo mensaje de WhatsApp o archivo .ics todas las partes de VMC, Fin de Semana, Audio/Micrófonos, Aseo y Carritos asignadas a cada hermano.
                </p>
              </div>

              {/* Tarjetas Resumen KPI con Destello Lumínico */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#18181F] border border-zinc-200/80 dark:border-white/10 shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/10 rounded-full blur-md" />
                  <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white block font-mono tabular-nums">
                    {bundleStats.publishersCount}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-[#A1A1AA] flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Hermanos
                  </span>
                </div>

                <div className="px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#18181F] border border-zinc-200/80 dark:border-white/10 shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-full blur-md" />
                  <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white block font-mono tabular-nums">
                    {bundleStats.totalAssignments}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-[#A1A1AA] flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Turnos / Partes
                  </span>
                </div>

                <div className="px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#18181F] border border-zinc-200/80 dark:border-white/10 shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-full blur-md" />
                  <span className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white block font-mono tabular-nums">
                    {bundleStats.totalFamilyDays}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-[#A1A1AA] flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    En Familia
                  </span>
                </div>
              </div>
            </div>

            {/* Controles de Filtro por Mes, Categoría y Buscador */}
            <div className="pt-4 border-t border-zinc-200/80 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dispatchSearch}
                  onChange={(e) => setDispatchSearch(e.target.value)}
                  placeholder="Buscar hermano o hermana..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#18181F] text-xs font-semibold text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
                {dispatchSearch && (
                  <button
                    type="button"
                    onClick={() => setDispatchSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={dispatchCategoryFilter}
                  onChange={(e) => setDispatchCategoryFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#18181F] text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] focus:outline-none shadow-2xs cursor-pointer"
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
                  className="px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#18181F] text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] focus:outline-none shadow-2xs cursor-pointer"
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
          {filteredBundles.length === 0 ? (
            <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 p-12 text-center">
              <Users className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                No se encontraron asignaciones para el filtro actual
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                Prueba cambiando el mes o término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBundles.map((bundle) => {
                const { publisher: pub, assignments, countsByCategory, familySharedDaysCount } = bundle;
                const isExpanded = Boolean(expandedPublisherIds[pub.id]);
                const avatarGradient = getPublisherGradient(pub.name);
                const initials = getInitials(pub.name);

                return (
                  <div
                    key={pub.id}
                    className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${avatarGradient} text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0`}
                          >
                            {initials}
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
                              {pub.name}
                            </h4>
                            <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                              {assignments.length}{' '}
                              {assignments.length === 1 ? 'asignación' : 'asignaciones'}
                              {pub.groupNumber ? ` • Grupo #${pub.groupNumber}` : ''}
                            </span>
                          </div>
                        </div>

                        {familySharedDaysCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-mono tabular-nums shrink-0">
                            👨‍👩‍👧‍👦 {familySharedDaysCount} d. en familia
                          </span>
                        )}
                      </div>

                      {/* Chips de desglose por área */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold font-mono tabular-nums">
                        {countsByCategory.vym > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                            📖 VMC: {countsByCategory.vym}
                          </span>
                        )}
                        {countsByCategory.fin_de_semana > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                            🏛️ Fin Sem.: {countsByCategory.fin_de_semana}
                          </span>
                        )}
                        {countsByCategory.deberes > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                            🎧 Deberes: {countsByCategory.deberes}
                          </span>
                        )}
                        {countsByCategory.limpieza > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                            🧹 Aseo: {countsByCategory.limpieza}
                          </span>
                        )}
                        {countsByCategory.carritos > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                            🛒 Carritos: {countsByCategory.carritos}
                          </span>
                        )}
                        {countsByCategory.servicio_campo > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10">
                            🧭 Campo: {countsByCategory.servicio_campo}
                          </span>
                        )}
                      </div>

                      {/* Vista previa rápida o desplegable */}
                      <div className="space-y-1.5 pt-1">
                        {(isExpanded ? assignments : assignments.slice(0, 3)).map((a) => (
                          <div
                            key={a.id}
                            className="text-[11px] flex items-center justify-between gap-2 py-1.5 border-b border-zinc-100 dark:border-white/5 last:border-0"
                          >
                            <span className="font-semibold text-zinc-700 dark:text-[#F4F4F5] truncate">
                              <strong className="text-zinc-900 dark:text-white font-mono tabular-nums">
                                {formatShortSpanishDate(a.date)}:
                              </strong>{' '}
                              {a.title}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">
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
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 cursor-pointer font-mono tabular-nums block"
                          >
                            {isExpanded
                              ? 'Ocultar lista completa'
                              : `Ver las ${assignments.length} asignaciones...`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Acciones 1-Clic de Despacho para el Hermano */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
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
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                        title="Enviar hoja mensual unificada por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
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
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
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
                          className="p-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
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
                          className="p-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 transition-all cursor-pointer active:scale-95"
                          title="Copiar resumen mensual"
                        >
                          {copiedPubBundleId === pub.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-VISTA 3: COMUNICADOS Y CARTAS OFICIALES DEL TABLERO
         ===================================================================== */}
      {activeSubTab === 'anuncios_cartas' && (
        <div className="space-y-5">
          {/* Categories Filter Bar */}
          <div className="kg-card-bento kg-glass-surface p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 flex items-center gap-2 overflow-x-auto shadow-xs">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  selectedCategory === c.id
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'bg-zinc-100/90 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/10 border border-zinc-200/80 dark:border-white/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Notices Grid */}
          {sortedNotices.length === 0 ? (
            <div className="kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 p-12 text-center">
              <Bell className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-[#F4F4F5] mb-1">
                No hay anuncios publicados en esta categoría
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto mb-4">
                Presione &ldquo;Publicar Anuncio&rdquo; para redactar un aviso para la congregación.
              </p>
              {canManageNotices && (
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Primer Anuncio</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sortedNotices.map((notice) => {
                const badge = getCategoryBadge(notice.category);

                return (
                  <div
                    key={notice.id}
                    className={`kg-card-bento kg-glass-surface rounded-2xl sm:rounded-3xl border p-5 sm:p-6 flex flex-col justify-between transition-all ${
                      notice.pinned
                        ? 'border-indigo-500/70 ring-1 ring-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                        : 'border-zinc-200/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          {notice.pinned && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">
                              <Pin className="w-3 h-3 fill-indigo-600" />
                              Fijado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyNotice(notice)}
                            className="p-2 text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                            title="Copiar texto para WhatsApp"
                          >
                            {copiedNoticeId === notice.id ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          {canManageNotices && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(notice)}
                                className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer"
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
                                  className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-colors"
                                >
                                  Confirmar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNoticeId(notice.id)}
                                  className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                  title="Eliminar anuncio"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white mb-2 leading-snug">
                        {notice.title}
                      </h3>

                      <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] leading-relaxed whitespace-pre-line mb-4">
                        {notice.content}
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-white/10 pt-3 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-mono tabular-nums">Publicado: {notice.date}</span>
                      </div>
                      {notice.author && (
                        <span className="font-semibold text-zinc-600 dark:text-zinc-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="kg-card-bento kg-glass-surface rounded-3xl border border-zinc-200/80 dark:border-white/15 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{editingNotice ? 'Editar Anuncio' : 'Nuevo Anuncio para el Tablero'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Título del Anuncio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Visita del Superintendente de Circuito"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181F] text-xs font-semibold text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
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
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:border-indigo-500"
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
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Publicado por
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cuerpo de Ancianos"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Contenido del Anuncio
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escriba los detalles completos del comunicado..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                    Vigencia hasta (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresDate}
                    onChange={(e) => setFormData({ ...formData, expiresDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181F] text-xs text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums focus:outline-none focus:border-indigo-500"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white cursor-pointer transition-all active:scale-95 shadow-sm"
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
