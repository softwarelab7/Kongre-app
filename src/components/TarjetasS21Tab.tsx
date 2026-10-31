// src/components/TarjetasS21Tab.tsx
import React, { useState, useMemo } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { Publisher, MonthlyServiceReport } from '../types';
import {
  getCurrentServiceYear,
  getAvailableServiceYears,
  buildS21CardForPublisher,
  determinePublisherStatus,
  computeSecretaryMetrics,
} from '../utils/s21Helper';
import {
  computePioneerServiceYearAudit,
  computeCircuitVisitExecutiveReport,
  printCircuitOverseerExecutiveDossierA4,
} from '../utils/secretaryAuditEngine';
import {
  FileText,
  Printer,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Share2,
  Edit2,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Download,
  Upload,
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';
import { LocalOfficialFormsCenter } from './LocalOfficialFormsCenter';
import {
  getLocalOfficialFormBytes,
  fillOfficialS21Pdf,
  downloadPdfBytesLocally,
} from '../services/localOfficialFormsService';
import { useToast } from '../context/ToastContext';

export const TarjetasS21Tab: React.FC = () => {
  const { showToast } = useToast();
  const {
    publishers,
    monthlyReports,
    updateMonthlyReport,
    updatePublisher,
    preachingGroups,
    settings,
    auxPioneerRequests,
    weeks,
    territories,
    circuitVisit,
  } = useCongregation();

  // Selected Service Year (default current service year, e.g. '2025-2026' or '2026-2027')
  const availableYears = useMemo(() => getAvailableServiceYears(), []);
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>(() => {
    // If reports have 2025-2026 data, default to 2025-2026 or current
    return '2025-2026';
  });

  // Active view: 'fichero' (tarjetero general), 'tarjeta' (detalle S-21), 'auditoria_precursores' (meta 600h), 'pastoral' (irregulares/inactivos), 'formato_local' (rellenador PDF oficial en local)
  const [activeView, setActiveView] = useState<'fichero' | 'tarjeta' | 'auditoria_precursores' | 'pastoral' | 'formato_local'>('fichero');

  // Selected publisher for single S-21 card view
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>(() => {
    return publishers[0]?.id || '';
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'irregulares' | 'inactivos' | 'precursores'>('todos');

  // Quick edit modal for a month in S-21 card
  const [editingMonth, setEditingMonth] = useState<{
    publisherId: string;
    monthKey: string;
    monthName: string;
    participated: boolean;
    hours?: number;
    bibleStudies: number;
    isAuxiliaryPioneer?: boolean;
    notes?: string;
  } | null>(null);

  // Edit publisher personal S-21 data modal
  const [isEditPersonalModalOpen, setIsEditPersonalModalOpen] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    birthDate: '',
    baptismDate: '',
    hope: 'otras_ovejas' as 'otras_ovejas' | 'ungido',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    phone: '',
  });

  // Active publishers
  const activePublishers = useMemo(() => publishers.filter((p) => p.active), [publishers]);

  // Secretary metrics
  const metrics = useMemo(() => {
    return computeSecretaryMetrics(publishers, monthlyReports, selectedServiceYear);
  }, [publishers, monthlyReports, selectedServiceYear]);

  // Pioneer Service Year Audit (600h / 50h)
  const pioneerAudit = useMemo(() => {
    return computePioneerServiceYearAudit(publishers, monthlyReports, auxPioneerRequests, selectedServiceYear);
  }, [publishers, monthlyReports, auxPioneerRequests, selectedServiceYear]);

  // Executive Report for A4 Dossier
  const executiveReport = useMemo(() => {
    return computeCircuitVisitExecutiveReport({
      publishers,
      weeks,
      monthlyReports,
      territories,
      preachingGroups,
      auxPioneerRequests,
      circuitVisit,
      settings,
      serviceYear: selectedServiceYear,
    });
  }, [publishers, weeks, monthlyReports, territories, preachingGroups, auxPioneerRequests, circuitVisit, settings, selectedServiceYear]);

  // Filtered publishers for fichero view
  const filteredPublishers = useMemo(() => {
    return publishers.filter((pub) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pub.name.toLowerCase().includes(q) ||
        pub.phone.includes(q) ||
        (pub.notes && pub.notes.toLowerCase().includes(q));

      // Group
      const matchesGroup = selectedGroup === 'todos' || pub.groupNumber === selectedGroup;

      // Status
      const statusInfo = determinePublisherStatus(pub, monthlyReports);
      let matchesStatus = true;
      if (statusFilter === 'activos') matchesStatus = statusInfo.status === 'activo';
      else if (statusFilter === 'irregulares') matchesStatus = statusInfo.status === 'irregular';
      else if (statusFilter === 'inactivos') matchesStatus = statusInfo.status === 'inactivo';
      else if (statusFilter === 'precursores') matchesStatus = pub.privilege === 'precursor_regular' || pub.pioneerStatus === 'regular';

      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [publishers, searchQuery, selectedGroup, statusFilter, monthlyReports]);

  // Selected publisher object & S-21 card
  const currentPublisher = useMemo(() => {
    return publishers.find((p) => p.id === selectedPublisherId) || publishers[0];
  }, [publishers, selectedPublisherId]);

  const currentS21Card = useMemo(() => {
    if (!currentPublisher) return null;
    return buildS21CardForPublisher(currentPublisher, selectedServiceYear, monthlyReports);
  }, [currentPublisher, selectedServiceYear, monthlyReports]);

  // Navigation handlers
  const handleSelectPublisher = (pubId: string) => {
    setSelectedPublisherId(pubId);
    setActiveView('tarjeta');
  };

  const handlePrevPublisher = () => {
    const currentIndex = publishers.findIndex((p) => p.id === selectedPublisherId);
    if (currentIndex > 0) {
      setSelectedPublisherId(publishers[currentIndex - 1].id);
    } else {
      setSelectedPublisherId(publishers[publishers.length - 1].id);
    }
  };

  const handleNextPublisher = () => {
    const currentIndex = publishers.findIndex((p) => p.id === selectedPublisherId);
    if (currentIndex < publishers.length - 1) {
      setSelectedPublisherId(publishers[currentIndex + 1].id);
    } else {
      setSelectedPublisherId(publishers[0].id);
    }
  };

  // Save Month Report from S-21 Card
  const handleSaveMonthEdit = () => {
    if (!editingMonth) return;

    // Find if report exists
    const existing = monthlyReports.find(
      (r) => r.publisherId === editingMonth.publisherId && r.month === editingMonth.monthKey
    );

    const updatedReport: MonthlyServiceReport = {
      id: existing?.id || `rep-${editingMonth.publisherId}-${editingMonth.monthKey}`,
      publisherId: editingMonth.publisherId,
      month: editingMonth.monthKey,
      participated: editingMonth.participated,
      hours: editingMonth.hours || 0,
      bibleStudies: editingMonth.bibleStudies || 0,
      isAuxiliaryPioneer: editingMonth.isAuxiliaryPioneer,
      isPioneer: currentPublisher?.privilege === 'precursor_regular' || currentPublisher?.pioneerStatus === 'regular',
      notes: editingMonth.notes || '',
      reportedAt: existing?.reportedAt || new Date().toISOString().split('T')[0],
    };

    updateMonthlyReport(updatedReport);
    setEditingMonth(null);
  };

  // Open Personal Info Modal
  const handleOpenEditPersonal = () => {
    if (!currentPublisher) return;
    setPersonalForm({
      birthDate: currentPublisher.birthDate || currentPublisher.birth_date || '',
      baptismDate: currentPublisher.baptismDate || currentPublisher.baptism_date || '',
      hope: currentPublisher.hope || (currentPublisher.is_anointed ? 'ungido' : 'otras_ovejas'),
      address: currentPublisher.address || '',
      emergencyContactName:
        currentPublisher.emergencyContactName ||
        currentPublisher.emergency_contacts?.[0]?.name ||
        '',
      emergencyContactPhone:
        currentPublisher.emergencyContactPhone ||
        currentPublisher.emergency_contacts?.[0]?.phone ||
        '',
      phone: currentPublisher.phone || '',
    });
    setIsEditPersonalModalOpen(true);
  };

  const handleSavePersonal = () => {
    if (!currentPublisher) return;
    const existingEm = currentPublisher.emergency_contacts || [];
    const syncedEmergencyContacts =
      personalForm.emergencyContactName || personalForm.emergencyContactPhone
        ? [
            {
              id: existingEm[0]?.id || 'em-1',
              name: personalForm.emergencyContactName || existingEm[0]?.name || 'Contacto Principal',
              relationship: existingEm[0]?.relationship || 'Familiar',
              phone: personalForm.emergencyContactPhone || existingEm[0]?.phone || '',
              alt_phone: existingEm[0]?.alt_phone || '',
              email: existingEm[0]?.email || '',
            },
            ...existingEm.slice(1),
          ]
        : existingEm;

    updatePublisher({
      ...currentPublisher,
      birthDate: personalForm.birthDate,
      birth_date: personalForm.birthDate,
      baptismDate: personalForm.baptismDate,
      baptism_date: personalForm.baptismDate,
      hope: personalForm.hope,
      is_anointed: personalForm.hope === 'ungido',
      address: personalForm.address,
      emergencyContactName: personalForm.emergencyContactName,
      emergencyContactPhone: personalForm.emergencyContactPhone,
      emergency_contacts: syncedEmergencyContacts,
      phone: personalForm.phone,
    });
    setIsEditPersonalModalOpen(false);
  };

  // WhatsApp pastoral message for irregular/inactive
  const handleSendPastoralWhatsApp = (pub: Publisher, missingMonths: number) => {
    const cleanPhone = pub.phone.replace(/[^0-9]/g, '');
    const greeting = pub.gender === 'hermana' ? 'Estimada hermana' : 'Estimado hermano';
    const text = encodeURIComponent(
      `¡Hola ${greeting} ${pub.name}! Le enviamos un saludo muy afectuoso y sincero de parte de los ancianos de la congregación ${settings.congregationName}.\n\n` +
      `Queremos que sepa que le tenemos muy presente y nos preocupamos con cariño por usted. Si hay algo en lo que podamos apoyarle espiritualmente o si desea que le visitemos para compartir un texto bíblico reconfortante, estamos a su entera disposición.\n\n` +
      `"Jehová está cerca de los que tienen el corazón destrozado" (Salmo 34:18). ¡Le enviamos un fuerte abrazo fraternal!`
    );
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Rellenar y descargar el PDF oficial S-21 cargado por el usuario (o redirigir a cargarlo si aún no está en la bóveda local)
  const handleDownloadOfficialS21ForPublisher = async (pub?: Publisher) => {
    const targetPub = pub || currentPublisher || publishers[0];
    if (!targetPub) return;
    setSelectedPublisherId(targetPub.id);

    const stored = await getLocalOfficialFormBytes('S-21');
    if (!stored) {
      setActiveView('formato_local');
      showToast(
        'Carga primero tu archivo oficial S-21.pdf descargado de JW Hub para que la aplicación lo rellene y puedas descargarlo.',
        'info'
      );
      return;
    }

    try {
      const filledBytes = await fillOfficialS21Pdf(
        stored.bytes,
        targetPub,
        selectedServiceYear,
        monthlyReports
      );
      const cleanName = (targetPub.name || 'Publicador').replace(
        /[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñ_-]/g,
        '_'
      );
      const outFileName = `S-21_${cleanName}_${selectedServiceYear}.pdf`;
      downloadPdfBytesLocally(filledBytes, outFileName);
      showToast(`Tarjeta oficial "${outFileName}" rellenada y descargada.`, 'success');
    } catch (err: any) {
      console.error('Error rellenando S-21 oficial:', err);
      setActiveView('formato_local');
      showToast('Verifica o vuelve a cargar tu plantilla oficial S-21.pdf.', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Barra de Acciones y Selector de Vista de Tarjetas S-21 */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] flex flex-col gap-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Main View Mode Selector - 2-column grid on mobile so nothing clips */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 bg-zinc-100 dark:bg-[#18181F] p-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
            <button
              onClick={() => setActiveView('fichero')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'fichero'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Fichero <span className="font-mono tabular-nums">({filteredPublishers.length})</span></span>
            </button>

            <button
              onClick={() => setActiveView('tarjeta')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'tarjeta'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tarjeta S-21</span>
            </button>

            <button
              onClick={() => setActiveView('auditoria_precursores')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'auditoria_precursores'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Precursores <span className="font-mono tabular-nums">({pioneerAudit.summary.totalRegularPioneers})</span></span>
            </button>

            <button
              onClick={() => setActiveView('pastoral')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeView === 'pastoral'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-[#F4F4F5] hover:bg-white/60 dark:hover:bg-[#27272A]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Pastoreo <span className="font-mono tabular-nums">({metrics.irregularCount + metrics.inactiveCount})</span></span>
            </button>
          </div>

          {/* Global Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            {/* Service Year Selector */}
            <div className="flex items-center justify-center gap-1.5 bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA]">Año:</span>
              <select
                value={selectedServiceYear}
                onChange={(e) => setSelectedServiceYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer font-mono tabular-nums"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5]">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setActiveView('formato_local')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                activeView === 'formato_local'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Cargar S-21</span>
            </button>

            <button
              onClick={() => handleDownloadOfficialS21ForPublisher(currentPublisher)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] border border-zinc-200 dark:border-[#27272A] rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">Descargar S-21</span>
            </button>

            <button
              onClick={() => printCircuitOverseerExecutiveDossierA4(executiveReport, settings, circuitVisit)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
              title="Imprimir Resumen Analítico Interno para la Visita"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Resumen Visita</span>
            </button>
          </div>
        </div>

        {/* Quick select publisher dropdown when in tarjeta view */}
        {activeView === 'tarjeta' && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-[#27272A]">
            <span className="text-xs font-bold text-zinc-500 dark:text-[#A1A1AA]">Publicador seleccionado:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevPublisher}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-600 dark:text-[#F4F4F5]"
                title="Publicador anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedPublisherId}
                onChange={(e) => setSelectedPublisherId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-xs font-bold text-zinc-800 dark:text-[#F4F4F5] max-w-[200px] sm:max-w-xs"
              >
                {publishers.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5]">
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNextPublisher}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-600 dark:text-[#F4F4F5]"
                title="Siguiente publicador"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards (Secretary Dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A]">
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 dark:text-[#A1A1AA] block uppercase">
            Total Publicadores
          </span>
          <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{metrics.totalPublishers}</span>
          <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] block mt-0.5">Fichero activo</span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A]">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
            Al Día (Activos)
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{metrics.activeCount}</span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80 block mt-0.5">
            <span className="font-mono tabular-nums">{metrics.totalPublishers > 0 ? Math.round((metrics.activeCount / metrics.totalPublishers) * 100) : 0}%</span> de la congregación
          </span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] cursor-pointer hover:border-amber-400 dark:hover:border-amber-400/60 transition" onClick={() => setActiveView('pastoral')}>
          <span className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 block uppercase flex items-center justify-between">
            <span>Irregulares</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">{metrics.irregularCount}</span>
          <span className="text-[11px] text-amber-700 dark:text-amber-400/80 block mt-0.5">1 a 5 meses pendientes</span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] cursor-pointer hover:border-rose-400 dark:hover:border-rose-400/60 transition" onClick={() => setActiveView('pastoral')}>
          <span className="text-[10px] sm:text-xs font-bold text-rose-600 dark:text-rose-400 block uppercase flex items-center justify-between">
            <span>Inactivos (6+ m)</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">{metrics.inactiveCount}</span>
          <span className="text-[11px] text-rose-700 dark:text-rose-400/80 block mt-0.5">Visitas de pastoreo</span>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 block uppercase">
            Horas Año Servicio
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{metrics.totalServiceYearHours}</span>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-400/80 block mt-0.5">
            <span className="font-mono tabular-nums">{metrics.regularPioneersCount}</span> precursores regulares
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: FICHERO GENERAL DE LA CONGREGACIÓN                     */}
      {/* ============================================================== */}
      {activeView === 'fichero' && (
        <div className="space-y-4 no-print">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-[#121216] p-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o privilegio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181F] focus:bg-white dark:focus:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-800 dark:text-[#F4F4F5] placeholder:text-zinc-400 dark:placeholder:text-[#71717A] rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] rounded-xl font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer"
              >
                <option value="todos" className="bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5]">Todos los Grupos</option>
                {preachingGroups.map((g) => (
                  <option key={g.number} value={g.number} className="bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5]">
                    Grupo {g.number}: {g.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'todos'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('activos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  statusFilter === 'activos'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Activos</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({metrics.activeCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('irregulares')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  statusFilter === 'irregulares'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Irregulares</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({metrics.irregularCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('inactivos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  statusFilter === 'inactivos'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Inactivos</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({metrics.inactiveCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('precursores')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  statusFilter === 'precursores'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] border border-zinc-200 dark:border-[#27272A]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Precursores</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">({metrics.regularPioneersCount})</span>
              </button>
            </div>
          </div>

          {/* Publisher S-21 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPublishers.map((pub) => {
              const card = buildS21CardForPublisher(pub, selectedServiceYear, monthlyReports);
              const status = determinePublisherStatus(pub, monthlyReports);
              const isPioneer = pub.privilege === 'precursor_regular' || pub.pioneerStatus === 'regular';

              return (
                <div
                  key={pub.id}
                  onClick={() => handleSelectPublisher(pub.id)}
                  className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:border-indigo-400 dark:hover:border-indigo-500/50 transition cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition flex items-center gap-1.5">
                        <span>{pub.name}</span>
                        {isPioneer && (
                          <span title="Precursor Regular">
                            <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] capitalize">
                        {pub.gender === 'hermano' ? 'Hermano' : 'Hermana'} • Grupo {pub.groupNumber || 'Sin grupo'}
                        {pub.privilege ? ` • ${pub.privilege.replace('_', ' ')}` : ''}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        status.status === 'activo'
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
                          : status.status === 'irregular'
                          ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400'
                          : 'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400'
                      }`}
                    >
                      {status.status === 'activo' ? 'Al día' : status.status === 'irregular' ? 'Irregular' : 'Inactivo'}
                    </span>
                  </div>

                  {/* 12 Months Miniature Strip */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#A1A1AA] font-medium font-mono tabular-nums">
                      <span>Año {selectedServiceYear}</span>
                      <span>{card.totalMonthsActive}/12 meses informados</span>
                    </div>
                    <div className="grid grid-cols-12 gap-0.5 bg-zinc-100 dark:bg-[#18181F] p-1 rounded-lg border border-zinc-200/50 dark:border-[#27272A]">
                      {card.months.map((m) => (
                        <div
                          key={m.monthKey}
                          className={`h-4 rounded-xs text-[8px] flex items-center justify-center font-bold transition ${
                            m.participated
                              ? m.isAuxiliaryPioneer
                                ? 'bg-indigo-500 text-white'
                                : 'bg-emerald-500 text-white'
                              : m.hasReport
                              ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                              : 'bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-400 dark:text-zinc-500'
                          }`}
                          title={`${m.monthName}: ${m.participated ? (m.hours ? `${m.hours} hrs` : 'Participó') : 'Pendiente'}`}
                        >
                          {m.monthShort[0]}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#27272A] text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-bold block">Horas</span>
                        <span className="font-extrabold text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{card.totalHours || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-bold block">Estudios</span>
                        <span className="font-extrabold text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums">{card.totalBibleStudies}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-bold block">Prom. Hrs</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{card.avgHoursPerMonth || '—'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadOfficialS21ForPublisher(pub);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Rellenar y descargar el PDF oficial S-21 cargado"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF S-21 Oficial</span>
                      </button>

                      <button
                        type="button"
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>Ver Registro</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* VIEW 2: TARJETA S-21 INDIVIDUAL (HISTORIAL DE REGISTROS)       */}
      {/* ============================================================== */}
      {activeView === 'tarjeta' && currentPublisher && currentS21Card && (
        <div className="space-y-6">
          {/* Card Action Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 no-print">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('fichero')}
                className="p-2 -ml-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] hover:bg-zinc-100 dark:hover:bg-[#18181F] transition-colors cursor-pointer active:scale-95 shrink-0"
                title="Volver al Fichero"
                aria-label="Volver al Fichero"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-zinc-800 dark:text-[#F4F4F5]">
                Registro de {currentPublisher.name} <span className="font-mono tabular-nums">({selectedServiceYear})</span>
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenEditPersonal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Editar Datos Personales S-21</span>
              </button>

              <button
                onClick={() => setActiveView('formato_local')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar / Previsualizar S-21 Oficial</span>
              </button>

              <button
                onClick={() => handleDownloadOfficialS21ForPublisher(currentPublisher)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-[#27272A] hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Rellenar y Descargar S-21 Oficial (PDF)</span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* TARJETA DE CONSULTA INTERNA DEL HISTORIAL DE INFORMES       */}
          {/* ========================================================== */}
          <div className="bg-white dark:bg-[#121216] border-2 border-zinc-800 dark:border-[#27272A] p-6 sm:p-8 rounded-2xl max-w-4xl mx-auto space-y-6 print:bg-white print:border print:shadow-none print:m-0 print:p-4">
            {/* Header */}
            <div className="border-b-2 border-zinc-800 dark:border-[#27272A] pb-4 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-[#A1A1AA] font-bold block print:text-zinc-500">
                Vista de Consulta Interna • Para exportar usa el formato oficial S-21 PDF cargado
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] tracking-wider uppercase font-serif print:text-black">
                REGISTRO DE PUBLICADOR DE LA CONGREGACIÓN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-zinc-700 dark:text-[#A1A1AA] pt-1 print:text-zinc-700">
                <span>Congregación: <strong>{settings.congregationName}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span>Año de Servicio: <strong className="font-mono tabular-nums">{selectedServiceYear}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span className="font-mono bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] px-2 py-0.5 rounded text-[11px] font-bold border border-zinc-200/50 dark:border-[#27272A] print:border-zinc-300">S-21</span>
              </div>
            </div>

            {/* Biographical & Theocratic Information (Front of S-21) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-zinc-50/70 dark:bg-[#18181F]/70 border border-zinc-300 dark:border-[#27272A] rounded-xl text-xs print:bg-zinc-50 print:border-zinc-300">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] block">Nombre del Publicador:</span>
                <p className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm print:text-black">{currentPublisher.name}</p>
                <p className="text-[11px] text-zinc-600 dark:text-[#A1A1AA] print:text-zinc-600">
                  {currentPublisher.gender === 'hermano' ? 'Varón (Hermano)' : 'Mujer (Hermana)'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] block">Fechas Clave:</span>
                <p className="text-zinc-800 dark:text-[#E4E4E7] print:text-black">
                  Nacimiento: <strong className="font-mono tabular-nums">{currentPublisher.birthDate || 'No registrada'}</strong>
                </p>
                <p className="text-zinc-800 dark:text-[#E4E4E7] print:text-black">
                  Bautismo: <strong className="font-mono tabular-nums">{currentPublisher.baptismDate || 'No registrada'}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] block">Condición Teocrática:</span>
                <p className="text-zinc-800 dark:text-[#E4E4E7] font-medium print:text-black">
                  Esperanza: <strong>{currentPublisher.hope === 'ungido' ? 'Ungido' : 'Otras ovejas'}</strong>
                </p>
                <p className="text-indigo-700 dark:text-indigo-400 font-bold capitalize print:text-indigo-900">
                  {currentPublisher.privilege
                    ? currentPublisher.privilege.replace('_', ' ')
                    : 'Publicador de las buenas noticias'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] block">Grupo de Servicio:</span>
                <p className="font-bold text-zinc-800 dark:text-[#E4E4E7] print:text-black">
                  Grupo {currentPublisher.groupNumber || 'Sin grupo'}
                  {currentPublisher.groupNumber && preachingGroups.find(g => g.number === currentPublisher.groupNumber)
                    ? ` (${preachingGroups.find(g => g.number === currentPublisher.groupNumber)?.name})`
                    : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] block">Dirección & Teléfono:</span>
                <p className="text-zinc-800 dark:text-[#E4E4E7] truncate print:text-black">{currentPublisher.address || 'Sin dirección guardada'}</p>
                <p className="text-zinc-800 dark:text-[#E4E4E7] font-mono tabular-nums print:text-black">{currentPublisher.phone || 'Sin teléfono'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA] block">Contacto de Emergencia:</span>
                <p className="text-zinc-800 dark:text-[#E4E4E7] print:text-black">{currentPublisher.emergencyContactName || 'No indicado'}</p>
                <p className="text-zinc-800 dark:text-[#E4E4E7] font-mono tabular-nums text-[11px] print:text-black">{currentPublisher.emergencyContactPhone || '—'}</p>
              </div>
            </div>

            {/* Official 12-Month Service Table */}
            <div className="border border-zinc-800 dark:border-[#27272A] rounded-xl overflow-x-auto print:border-zinc-800">
              <table className="w-full min-w-[540px] text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-800 dark:bg-[#18181F] text-white dark:text-[#F4F4F5] uppercase text-[10px] tracking-wider border-b border-zinc-700 dark:border-[#27272A] print:bg-zinc-800 print:text-white">
                    <th className="p-2.5 border-r border-zinc-700 dark:border-[#27272A] w-32 font-bold print:border-zinc-700">Mes</th>
                    <th className="p-2.5 border-r border-zinc-700 dark:border-[#27272A] w-28 text-center font-bold print:border-zinc-700">
                      ¿Participó en el ministerio?
                    </th>
                    <th className="p-2.5 border-r border-zinc-700 dark:border-[#27272A] w-28 text-center font-bold print:border-zinc-700">
                      Cursos Bíblicos
                    </th>
                    <th className="p-2.5 border-r border-zinc-700 dark:border-[#27272A] w-24 text-center font-bold print:border-zinc-700">
                      Horas
                    </th>
                    <th className="p-2.5 font-bold">Notas / Observaciones (Precursor auxiliar, etc.)</th>
                    <th className="p-2.5 text-right w-16 no-print">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-300 dark:divide-[#27272A] print:divide-zinc-300">
                  {currentS21Card.months.map((m, index) => (
                    <tr
                      key={m.monthKey}
                      className={`hover:bg-indigo-50/40 dark:hover:bg-[#18181F]/70 transition ${
                        index % 2 === 0 ? 'bg-white dark:bg-[#121216]' : 'bg-zinc-50/50 dark:bg-[#18181F]/30'
                      } print:bg-white`}
                    >
                      <td className="p-2.5 border-r border-zinc-300 dark:border-[#27272A] font-bold text-zinc-800 dark:text-[#F4F4F5] print:border-zinc-300 print:text-black">
                        {m.monthName}
                      </td>

                      <td className="p-2.5 border-r border-zinc-300 dark:border-[#27272A] text-center print:border-zinc-300">
                        {m.participated ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-bold print:bg-emerald-100 print:text-emerald-800">
                            ✓
                          </span>
                        ) : m.hasReport ? (
                          <span className="text-rose-500 font-bold">—</span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">Pendiente</span>
                        )}
                      </td>

                      <td className="p-2.5 border-r border-zinc-300 dark:border-[#27272A] text-center font-bold text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums print:border-zinc-300 print:text-black">
                        {m.participated ? m.bibleStudies : '—'}
                      </td>

                      <td className="p-2.5 border-r border-zinc-300 dark:border-[#27272A] text-center font-bold text-indigo-700 dark:text-indigo-400 font-mono tabular-nums print:border-zinc-300 print:text-indigo-800">
                        {m.hours !== undefined && m.hours !== null ? m.hours : '—'}
                      </td>

                      <td className="p-2.5 border-r border-zinc-300 dark:border-[#27272A] text-zinc-700 dark:text-[#A1A1AA] print:border-zinc-300 print:text-black">
                        <div className="flex items-center gap-2">
                          {m.isAuxiliaryPioneer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-400 print:bg-indigo-100 print:text-indigo-800">
                              Precursor Auxiliar
                            </span>
                          )}
                          <span>{m.notes || '—'}</span>
                        </div>
                      </td>

                      <td className="p-2.5 text-right no-print">
                        <button
                          onClick={() => {
                            setEditingMonth({
                              publisherId: currentPublisher.id,
                              monthKey: m.monthKey,
                              monthName: m.monthName,
                              participated: m.participated,
                              hours: m.hours,
                              bibleStudies: m.bibleStudies,
                              isAuxiliaryPioneer: m.isAuxiliaryPioneer,
                              notes: m.notes,
                            });
                          }}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-500 dark:text-[#A1A1AA] hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title={`Editar informe de ${m.monthName}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* S-21 Totals / Averages Row */}
                <tfoot>
                  <tr className="bg-zinc-100 dark:bg-[#18181F] font-extrabold text-zinc-900 dark:text-[#F4F4F5] border-t-2 border-zinc-800 dark:border-[#27272A] print:bg-zinc-100 print:border-zinc-800 print:text-black">
                    <td className="p-3 border-r border-zinc-300 dark:border-[#27272A] uppercase tracking-wider print:border-zinc-300">
                      TOTALES DEL AÑO
                    </td>
                    <td className="p-3 border-r border-zinc-300 dark:border-[#27272A] text-center text-emerald-700 dark:text-emerald-400 font-mono tabular-nums print:border-zinc-300 print:text-emerald-800">
                      {currentS21Card.totalMonthsActive} / 12 meses
                    </td>
                    <td className="p-3 border-r border-zinc-300 dark:border-[#27272A] text-center text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums print:border-zinc-300 print:text-black">
                      {currentS21Card.totalBibleStudies} (Prom: {currentS21Card.avgStudiesPerMonth})
                    </td>
                    <td className="p-3 border-r border-zinc-300 dark:border-[#27272A] text-center text-indigo-700 dark:text-indigo-400 text-sm font-mono tabular-nums print:border-zinc-300 print:text-indigo-800">
                      {currentS21Card.totalHours} hrs (Prom: {currentS21Card.avgHoursPerMonth})
                    </td>
                    <td colSpan={2} className="p-3 text-zinc-600 dark:text-[#A1A1AA] text-[11px] font-normal italic print:text-zinc-600">
                      {currentPublisher.privilege === 'precursor_regular' || currentPublisher.pioneerStatus === 'regular' ? (
                        <span className="font-semibold text-indigo-900 dark:text-indigo-400">
                          Precursor regular: {currentS21Card.totalHours}/600 hrs anuales ({Math.round((currentS21Card.totalHours / 600) * 100)}%)
                        </span>
                      ) : (
                        <span>Registro anual archivado por la congregación</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Official Signatures Block (For Circuit Overseer & Secretary) */}
            <div className="pt-4 border-t border-zinc-300 dark:border-[#27272A] grid grid-cols-2 gap-8 text-center text-xs print:border-zinc-300">
              <div className="border-t border-zinc-400 dark:border-[#27272A] pt-2 space-y-0.5 print:border-zinc-400">
                <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-bold block print:text-zinc-400">Firma del Secretario</span>
                <p className="font-semibold text-zinc-700 dark:text-[#F4F4F5] print:text-black">Secretario de la Congregación</p>
              </div>
              <div className="border-t border-zinc-400 dark:border-[#27272A] pt-2 space-y-0.5 print:border-zinc-400">
                <span className="text-[10px] text-zinc-400 dark:text-[#A1A1AA] uppercase font-bold block print:text-zinc-400">Revisión Semestral</span>
                <p className="font-semibold text-zinc-700 dark:text-[#F4F4F5] print:text-black">Superintendente de Circuito</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* VIEW 3: SEGUIMIENTO PASTORAL (IRREGULARES E INACTIVOS)          */}
      {/* ============================================================== */}
      {activeView === 'pastoral' && (
        <div className="space-y-6 no-print">
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] p-4 rounded-2xl space-y-1 shadow-xs">
            <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              <span>Atención Pastoral de la Congregación (Pautas Oficiales)</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
              Según las pautas del libro <em>Organizados para hacer la voluntad de Jehová</em>, los ancianos y siervos ministeriales se interesan con cariño por los publicadores que no han informado para brindarles ayuda espiritual oportuna antes de que se vuelvan inactivos (6 meses consecutivos sin predicar).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Irregular Section */}
            <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Publicadores Irregulares <span className="font-mono tabular-nums">({metrics.irregularCount})</span></span>
                </h3>
                <span className="text-xs bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A] px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  1 a 5 meses pendientes
                </span>
              </div>

              {metrics.irregularPublishers.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 dark:text-[#A1A1AA] text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>¡Excelente! No hay publicadores irregulares en este período.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.irregularPublishers.map(({ publisher, missingMonths, lastMonth }) => (
                    <div
                      key={publisher.id}
                      className="p-3 bg-zinc-50/80 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs shadow-2xs"
                    >
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5]">{publisher.name}</h4>
                        <p className="text-zinc-500 dark:text-[#A1A1AA] text-[11px]">
                          Grupo {publisher.groupNumber || 'Sin grupo'} • Faltan <span className="font-mono tabular-nums">{missingMonths}</span> meses por informar
                          {lastMonth ? ` (Último: ${lastMonth})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSendPastoralWhatsApp(publisher, missingMonths)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Enviar mensaje pastoral por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleSelectPublisher(publisher.id)}
                          className="px-2.5 py-1.5 bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] rounded-lg font-bold text-xs transition cursor-pointer"
                        >
                          Ver S-21
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inactive Section */}
            <div className="bg-white dark:bg-[#121216] p-5 rounded-xl border border-zinc-200 dark:border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Publicadores Inactivos <span className="font-mono tabular-nums">({metrics.inactiveCount})</span></span>
                </h3>
                <span className="text-xs bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8] border border-zinc-200 dark:border-[#27272A] px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  6+ meses sin predicar
                </span>
              </div>

              {metrics.inactivePublishers.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 dark:text-[#A1A1AA] text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>No hay publicadores clasificados como inactivos.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.inactivePublishers.map(({ publisher, missingMonths }) => (
                    <div
                      key={publisher.id}
                      className="p-3 bg-zinc-50/80 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs shadow-2xs"
                    >
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5]">{publisher.name}</h4>
                        <p className="text-zinc-500 dark:text-[#A1A1AA] text-[11px]">
                          Grupo {publisher.groupNumber || 'Sin grupo'} • <span className="font-mono tabular-nums">{missingMonths}</span> meses sin actividad registrada
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSendPastoralWhatsApp(publisher, missingMonths)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Enviar saludo pastoral por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleSelectPublisher(publisher.id)}
                          className="px-2.5 py-1.5 bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] rounded-lg font-bold text-xs transition cursor-pointer"
                        >
                          Ver S-21
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK MONTH EDIT MODAL                                         */}
      {/* ============================================================== */}
      {editingMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                Editar Informe: {editingMonth.monthName}
              </h3>
              <button
                onClick={() => setEditingMonth(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
                <SplashCheckbox
                  size="sm"
                  checked={editingMonth.participated}
                  onChange={(e) => setEditingMonth({ ...editingMonth, participated: e.target.checked })}
                  label="¿Participó en el ministerio este mes?"
                />
              </div>

              {editingMonth.participated && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] mb-1">Horas:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingMonth.hours ?? ''}
                        onChange={(e) => setEditingMonth({ ...editingMonth, hours: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Ej. 15"
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] font-bold text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] mb-1">Cursos Bíblicos:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingMonth.bibleStudies}
                        onChange={(e) => setEditingMonth({ ...editingMonth, bibleStudies: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] font-bold text-zinc-800 dark:text-[#F4F4F5] font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                    <SplashCheckbox
                      size="sm"
                      checked={!!editingMonth.isAuxiliaryPioneer}
                      onChange={(e) => setEditingMonth({ ...editingMonth, isAuxiliaryPioneer: e.target.checked })}
                      label="Sirvió como Precursor Auxiliar"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] mb-1">Observaciones / Notas S-21:</label>
                <input
                  type="text"
                  value={editingMonth.notes || ''}
                  onChange={(e) => setEditingMonth({ ...editingMonth, notes: e.target.value })}
                  placeholder="Ej. Crédito de horas, enfermedad, etc."
                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-xs font-medium text-zinc-800 dark:text-[#F4F4F5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                onClick={() => setEditingMonth(null)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-[#A1A1AA] font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMonthEdit}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Guardar en Tarjeta S-21
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT PERSONAL DATA S-21 MODAL                                  */}
      {/* ============================================================== */}
      {isEditPersonalModalOpen && currentPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                Datos Teocráticos & Personales (S-21): {currentPublisher.name}
              </h3>
              <button
                onClick={() => setIsEditPersonalModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Fecha de Nacimiento:</label>
                  <input
                    type="date"
                    value={personalForm.birthDate}
                    onChange={(e) => setPersonalForm({ ...personalForm, birthDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] rounded-xl text-xs font-semibold font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Fecha de Bautismo:</label>
                  <input
                    type="date"
                    value={personalForm.baptismDate}
                    onChange={(e) => setPersonalForm({ ...personalForm, baptismDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] rounded-xl text-xs font-semibold font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Esperanza:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-800 dark:text-[#F4F4F5]">
                    <input
                      type="radio"
                      name="hope"
                      checked={personalForm.hope === 'otras_ovejas'}
                      onChange={() => setPersonalForm({ ...personalForm, hope: 'otras_ovejas' })}
                    />
                    <span>Otras ovejas</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-800 dark:text-[#F4F4F5]">
                    <input
                      type="radio"
                      name="hope"
                      checked={personalForm.hope === 'ungido'}
                      onChange={() => setPersonalForm({ ...personalForm, hope: 'ungido' })}
                    />
                    <span>Ungido</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Dirección del Hogar:</label>
                <input
                  type="text"
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  placeholder="Calle, número, departamento..."
                  className="w-full px-3 py-1.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="w-full px-3 py-1.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-100 dark:border-[#27272A]">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Contacto de Emergencia:</label>
                  <input
                    type="text"
                    value={personalForm.emergencyContactName}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyContactName: e.target.value })}
                    placeholder="Nombre y parentesco"
                    className="w-full px-3 py-1.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA] mb-1">Teléfono Emergencia:</label>
                  <input
                    type="text"
                    value={personalForm.emergencyContactPhone}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyContactPhone: e.target.value })}
                    placeholder="+34..."
                    className="w-full px-3 py-1.5 border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] rounded-xl text-xs font-mono tabular-nums font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-[#27272A]">
              <button
                onClick={() => setIsEditPersonalModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-[#A1A1AA] font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePersonal}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Guardar Cambios S-21
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* VIEW 3.5: AUDITORÍA DE PRECURSORES REGULARES (600H) Y AUX.     */}
      {/* ============================================================== */}
      {activeView === 'auditoria_precursores' && (
        <div className="space-y-5 no-print">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A]">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase block">Precursores Regulares</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{pioneerAudit.summary.totalRegularPioneers}</span>
              <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] block mt-0.5">Meta: 600 h anuales (50 h/mes)</span>
            </div>
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>En Meta Pro-Rata</span>
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{pioneerAudit.summary.onTrackCount}</span>
              <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] block mt-0.5">Ritmo saludable (≥ 50 h/mes)</span>
            </div>
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>En Observación / Déficit</span>
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                {pioneerAudit.summary.warningCount + pioneerAudit.summary.behindCount}
              </span>
              <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] block mt-0.5">
                <span className="font-mono tabular-nums">{pioneerAudit.summary.warningCount}</span> observación • <span className="font-mono tabular-nums">{pioneerAudit.summary.behindCount}</span> rezagados
              </span>
            </div>
            <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] shadow-xs">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Promedio Mensual</span>
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{pioneerAudit.summary.avgRegularPioneerMonthlyHours} h</span>
              <span className="text-xs text-zinc-500 dark:text-[#A1A1AA] block mt-0.5">
                <span className="font-mono tabular-nums">{pioneerAudit.summary.combinedPioneerHours}</span> h acumuladas en <span className="font-mono tabular-nums">{selectedServiceYear}</span>
              </span>
            </div>
          </div>

          {/* Regular Pioneers Table */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Control Anual de Horas de Precursores Regulares y Especiales <span className="font-mono tabular-nums">({selectedServiceYear})</span></span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Seguimiento del requisito anual de 600 horas (50 h mensuales promedio) más horas de crédito teocrático para la revisión del Comité de Servicio y visita del Superintendente de Circuito.
                </p>
              </div>
              <button
                onClick={() => printCircuitOverseerExecutiveDossierA4(executiveReport, settings, circuitVisit)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-[#18181F] hover:bg-zinc-800 dark:hover:bg-[#27272A] text-white border border-transparent dark:border-[#27272A] rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Auditoría A4</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4">Precursor</th>
                    <th className="py-3 px-3 text-center">Grupo</th>
                    <th className="py-3 px-3 text-center">Meses Inf.</th>
                    <th className="py-3 px-3 text-right">Horas Pred.</th>
                    <th className="py-3 px-3 text-right">Crédito</th>
                    <th className="py-3 px-3 text-right">Total Efectivo</th>
                    <th className="py-3 px-3 text-right">Prom. / Mes</th>
                    <th className="py-3 px-3 text-right">Meta Pro-Rata</th>
                    <th className="py-3 px-3 text-right">Balance</th>
                    <th className="py-3 px-3 text-right">Faltan (600h)</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A]">
                  {pioneerAudit.regularPioneers.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-zinc-400 dark:text-[#A1A1AA]">
                        No hay precursores regulares registrados en el fichero.
                      </td>
                    </tr>
                  ) : (
                    pioneerAudit.regularPioneers.map((row) => {
                      const progressPct = Math.min(
                        100,
                        Math.round((row.effectiveHours / row.annualGoalHours) * 100)
                      );
                      return (
                        <tr key={row.publisher.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#18181F]/50 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-zinc-900 dark:text-[#F4F4F5]">{row.publisher.name}</div>
                            <div className="w-32 bg-zinc-100 dark:bg-[#18181F] h-1.5 rounded-full overflow-hidden mt-1 border border-zinc-200/50 dark:border-[#27272A]">
                              <div
                                className={`h-full rounded-full ${
                                  row.paceStatus === 'en_meta'
                                    ? 'bg-emerald-500'
                                    : row.paceStatus === 'atencion'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-zinc-600 dark:text-[#A1A1AA]">
                            G-{row.publisher.groupNumber || '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-zinc-700 dark:text-[#E4E4E7] font-mono tabular-nums">
                            {row.monthsReported} / 12
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-zinc-800 dark:text-[#E4E4E7] font-mono tabular-nums">
                            {row.totalHours} h
                          </td>
                          <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold font-mono tabular-nums">
                            {row.totalCreditHours > 0 ? `+${row.totalCreditHours} h` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                            {row.effectiveHours} h
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-zinc-800 dark:text-[#E4E4E7] font-mono tabular-nums">
                            {row.avgMonthlyHours} h
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                            {row.proRataTargetHours} h
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold font-mono tabular-nums ${
                              row.hoursDelta >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : row.hoursDelta >= -20
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {row.hoursDelta >= 0 ? `+${row.hoursDelta} h` : `${row.hoursDelta} h`}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-600 dark:text-[#A1A1AA] font-medium font-mono tabular-nums">
                            {row.remainingToAnnualGoal} h
                          </td>
                          <td className="py-3 px-3 text-center">
                            {row.paceStatus === 'en_meta' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400">
                                En Meta
                              </span>
                            ) : row.paceStatus === 'atencion' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400">
                                Observación
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400">
                                Déficit
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleSelectPublisher(row.publisher.id)}
                              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-lg font-bold text-[11px] transition cursor-pointer"
                            >
                              Abrir S-21
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Auxiliary Pioneers Summary */}
          {pioneerAudit.auxPioneers.length > 0 && (
            <div className="bg-white dark:bg-[#121216] rounded-xl border border-zinc-200 dark:border-[#27272A] p-4 space-y-3">
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                  Precursores Auxiliares en el Año de Servicio <span className="font-mono tabular-nums">({pioneerAudit.auxPioneers.length})</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Publicadores que han servido como precursores auxiliares (continuos o temporales de 15h / 30h).
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pioneerAudit.auxPioneers.map((aux) => (
                  <div
                    key={aux.publisher.id}
                    onClick={() => handleSelectPublisher(aux.publisher.id)}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-zinc-50/60 dark:bg-[#18181F]/60 cursor-pointer flex items-center justify-between gap-2 text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-[#F4F4F5] flex items-center gap-1.5">
                        <span>{aux.publisher.name}</span>
                        {aux.isContinuous && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold">
                            Continuo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                        <span className="font-mono tabular-nums">{aux.monthsServed}</span> mes(es): {aux.monthsLabels.join(', ') || 'Activo'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-indigo-700 dark:text-indigo-400 font-mono tabular-nums">{aux.totalHours} h</div>
                      <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Prom: <span className="font-mono tabular-nums">{aux.avgHours}</span> h/m</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: RELLENADOR LOCAL DE FORMATO OFICIAL S-21 */}
      {activeView === 'formato_local' && (
        <LocalOfficialFormsCenter
          initialFormCode="S-21"
          initialPublisherId={selectedPublisherId}
          initialServiceYear={selectedServiceYear}
          compactHeader={true}
        />
      )}
    </div>
  );
};
