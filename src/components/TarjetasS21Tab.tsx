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
} from 'lucide-react';
import { SplashCheckbox } from './SplashCheckbox';
import { LocalOfficialFormsCenter } from './LocalOfficialFormsCenter';

export const TarjetasS21Tab: React.FC = () => {
  const {
    publishers,
    monthlyReports,
    updateMonthlyReport,
    updatePublisher,
    preachingGroups,
    settings,
  } = useCongregation();

  // Selected Service Year (default current service year, e.g. '2025-2026' or '2026-2027')
  const availableYears = useMemo(() => getAvailableServiceYears(), []);
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>(() => {
    // If reports have 2025-2026 data, default to 2025-2026 or current
    return '2025-2026';
  });

  // Active view: 'fichero' (tarjetero general), 'tarjeta' (detalle S-21), 'pastoral' (irregulares/inactivos), 'formato_local' (rellenador PDF oficial en local)
  const [activeView, setActiveView] = useState<'fichero' | 'tarjeta' | 'pastoral' | 'formato_local'>('fichero');

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
    window.open(url, '_blank');
  };

  // Batch Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones de Tarjetas S-21 (Opción 1: arranque directo sin banner redundante) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            Formulario S-21
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            Fichero oficial de 12 meses por año de servicio teocrático
          </span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Service Year Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Año:</span>
            <select
              value={selectedServiceYear}
              onChange={(e) => setSelectedServiceYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} {yr === '2025-2026' ? '(Año analizado)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveView('formato_local')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rellenar S-21 (Local)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Tarjetas S-21</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Secretary Dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 block uppercase">
            Total Publicadores
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">{metrics.totalPublishers}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Fichero activo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 block uppercase">
            Al Día (Activos)
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600">{metrics.activeCount}</span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">
            {metrics.totalPublishers > 0 ? Math.round((metrics.activeCount / metrics.totalPublishers) * 100) : 0}% de la congregación
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition" onClick={() => setActiveView('pastoral')}>
          <span className="text-[10px] sm:text-xs font-bold text-amber-600 block uppercase flex items-center justify-between">
            <span>Irregulares</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600">{metrics.irregularCount}</span>
          <span className="text-[11px] text-amber-700 block mt-0.5">1 a 5 meses pendientes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-rose-400 transition" onClick={() => setActiveView('pastoral')}>
          <span className="text-[10px] sm:text-xs font-bold text-rose-600 block uppercase flex items-center justify-between">
            <span>Inactivos (6+ m)</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600">{metrics.inactiveCount}</span>
          <span className="text-[11px] text-rose-700 block mt-0.5">Visitas de pastoreo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 block uppercase">
            Horas Año Servicio
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600">{metrics.totalServiceYearHours}</span>
          <span className="text-[11px] text-indigo-700 block mt-0.5">
            {metrics.regularPioneersCount} precursores regulares
          </span>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 no-print overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView('fichero')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'fichero'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Fichero de Tarjetas ({filteredPublishers.length})</span>
          </button>

          <button
            onClick={() => setActiveView('tarjeta')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'tarjeta'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tarjeta Oficial S-21 Individual</span>
          </button>

          <button
            onClick={() => setActiveView('pastoral')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeView === 'pastoral'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pastoreo: Irregulares e Inactivos ({metrics.irregularCount + metrics.inactiveCount})</span>
          </button>

          <button
            onClick={() => setActiveView('formato_local')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeView === 'formato_local'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cargar y Rellenar PDF Oficial (Local)</span>
          </button>
        </div>

        {/* Quick select publisher dropdown when in tarjeta view */}
        {activeView === 'tarjeta' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevPublisher}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              title="Publicador anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedPublisherId}
              onChange={(e) => setSelectedPublisherId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none"
            >
              {publishers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.privilege ? `(${p.privilege.replace('_', ' ')})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextPublisher}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              title="Publicador siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: FICHERO GENERAL DE LA CONGREGACIÓN                     */}
      {/* ============================================================== */}
      {activeView === 'fichero' && (
        <div className="space-y-4 no-print">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o privilegio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
              >
                <option value="todos">Todos los Grupos</option>
                {preachingGroups.map((g) => (
                  <option key={g.number} value={g.number}>
                    Grupo {g.number}: {g.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === 'todos'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('activos')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === 'activos'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Activos ({metrics.activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('irregulares')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === 'irregulares'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Irregulares ({metrics.irregularCount})
              </button>
              <button
                onClick={() => setStatusFilter('inactivos')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === 'inactivos'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Inactivos ({metrics.inactiveCount})
              </button>
              <button
                onClick={() => setStatusFilter('precursores')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === 'precursores'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                Precursores ({metrics.regularPioneersCount})
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
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                        <span>{pub.name}</span>
                        {isPioneer && (
                          <span title="Precursor Regular">
                            <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">
                        {pub.gender === 'hermano' ? 'Hermano' : 'Hermana'} • Grupo {pub.groupNumber || 'Sin grupo'}
                        {pub.privilege ? ` • ${pub.privilege.replace('_', ' ')}` : ''}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        status.status === 'activo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status.status === 'irregular'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {status.status === 'activo' ? 'Al día' : status.status === 'irregular' ? 'Irregular' : 'Inactivo'}
                    </span>
                  </div>

                  {/* 12 Months Miniature Strip */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Año {selectedServiceYear}</span>
                      <span>{card.totalMonthsActive}/12 meses informados</span>
                    </div>
                    <div className="grid grid-cols-12 gap-0.5 bg-slate-100 p-1 rounded-lg">
                      {card.months.map((m) => (
                        <div
                          key={m.monthKey}
                          className={`h-4 rounded-xs text-[8px] flex items-center justify-center font-bold transition ${
                            m.participated
                              ? m.isAuxiliaryPioneer
                                ? 'bg-indigo-500 text-white'
                                : 'bg-emerald-500 text-white'
                              : m.hasReport
                              ? 'bg-slate-300 text-slate-600'
                              : 'bg-white border border-slate-200 text-slate-400'
                          }`}
                          title={`${m.monthName}: ${m.participated ? (m.hours ? `${m.hours} hrs` : 'Participó') : 'Pendiente'}`}
                        >
                          {m.monthShort[0]}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Horas</span>
                        <span className="font-extrabold text-slate-800">{card.totalHours || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Estudios</span>
                        <span className="font-extrabold text-slate-800">{card.totalBibleStudies}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Prom. Hrs</span>
                        <span className="font-extrabold text-indigo-600">{card.avgHoursPerMonth || '—'}</span>
                      </div>
                    </div>

                    <button
                      className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1"
                    >
                      <span>Abrir S-21</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: TARJETA OFICIAL S-21 INDIVIDUAL (RÉPLICA FÍSICA)       */}
      {/* ============================================================== */}
      {activeView === 'tarjeta' && currentPublisher && currentS21Card && (
        <div className="space-y-6">
          {/* Card Action Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 no-print">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('fichero')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver al Fichero</span>
              </button>
              <h2 className="text-base font-bold text-slate-800">
                Tarjeta de {currentPublisher.name} ({selectedServiceYear})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditPersonal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Editar Datos Personales S-21</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Esta Tarjeta</span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* OFFICIAL S-21 PRINTABLE PHYSICAL CARD CONTAINER            */}
          {/* ========================================================== */}
          <div className="bg-white border-2 border-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-6 print:border print:shadow-none print:m-0 print:p-4">
            {/* Header: Exact S-21 Theocratic Heading */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                Formulario Oficial de la Congregación
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase font-serif">
                REGISTRO DE PUBLICADOR DE LA CONGREGACIÓN
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-700 pt-1">
                <span>Congregación: <strong>{settings.congregationName}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span>Año de Servicio: <strong>{selectedServiceYear}</strong></span>
                <span className="hidden sm:inline">•</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">S-21</span>
              </div>
            </div>

            {/* Biographical & Theocratic Information (Front of S-21) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/70 border border-slate-300 rounded-xl text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Nombre del Publicador:</span>
                <p className="font-bold text-slate-900 text-sm">{currentPublisher.name}</p>
                <p className="text-[11px] text-slate-600">
                  {currentPublisher.gender === 'hermano' ? 'Varón (Hermano)' : 'Mujer (Hermana)'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Fechas Clave:</span>
                <p className="text-slate-800">
                  Nacimiento: <strong>{currentPublisher.birthDate || 'No registrada'}</strong>
                </p>
                <p className="text-slate-800">
                  Bautismo: <strong>{currentPublisher.baptismDate || 'No registrada'}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Condición Teocrática:</span>
                <p className="text-slate-800 font-medium">
                  Esperanza: <strong>{currentPublisher.hope === 'ungido' ? 'Ungido' : 'Otras ovejas'}</strong>
                </p>
                <p className="text-indigo-700 font-bold capitalize">
                  {currentPublisher.privilege
                    ? currentPublisher.privilege.replace('_', ' ')
                    : 'Publicador de las buenas noticias'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Grupo de Servicio:</span>
                <p className="font-bold text-slate-800">
                  Grupo {currentPublisher.groupNumber || 'Sin grupo'}
                  {currentPublisher.groupNumber && preachingGroups.find(g => g.number === currentPublisher.groupNumber)
                    ? ` (${preachingGroups.find(g => g.number === currentPublisher.groupNumber)?.name})`
                    : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Dirección & Teléfono:</span>
                <p className="text-slate-800 truncate">{currentPublisher.address || 'Sin dirección guardada'}</p>
                <p className="text-slate-800 font-mono">{currentPublisher.phone || 'Sin teléfono'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Contacto de Emergencia:</span>
                <p className="text-slate-800">{currentPublisher.emergencyContactName || 'No indicado'}</p>
                <p className="text-slate-800 font-mono text-[11px]">{currentPublisher.emergencyContactPhone || '—'}</p>
              </div>
            </div>

            {/* Official 12-Month Service Table */}
            <div className="border border-slate-800 rounded-xl overflow-x-auto shadow-xs">
              <table className="w-full min-w-[540px] text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 border-r border-slate-700 w-32 font-bold">Mes</th>
                    <th className="p-2.5 border-r border-slate-700 w-28 text-center font-bold">
                      ¿Participó en el ministerio?
                    </th>
                    <th className="p-2.5 border-r border-slate-700 w-28 text-center font-bold">
                      Cursos Bíblicos
                    </th>
                    <th className="p-2.5 border-r border-slate-700 w-24 text-center font-bold">
                      Horas
                    </th>
                    <th className="p-2.5 font-bold">Notas / Observaciones (Precursor auxiliar, etc.)</th>
                    <th className="p-2.5 text-right w-16 no-print">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {currentS21Card.months.map((m, index) => (
                    <tr
                      key={m.monthKey}
                      className={`hover:bg-indigo-50/40 transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      <td className="p-2.5 border-r border-slate-300 font-bold text-slate-800">
                        {m.monthName}
                      </td>

                      <td className="p-2.5 border-r border-slate-300 text-center">
                        {m.participated ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            ✓
                          </span>
                        ) : m.hasReport ? (
                          <span className="text-rose-500 font-bold">—</span>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Pendiente</span>
                        )}
                      </td>

                      <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-800">
                        {m.participated ? m.bibleStudies : '—'}
                      </td>

                      <td className="p-2.5 border-r border-slate-300 text-center font-bold text-indigo-700">
                        {m.hours !== undefined && m.hours !== null ? m.hours : '—'}
                      </td>

                      <td className="p-2.5 border-r border-slate-300 text-slate-700">
                        <div className="flex items-center gap-2">
                          {m.isAuxiliaryPioneer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
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
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition"
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
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-800">
                    <td className="p-3 border-r border-slate-300 uppercase tracking-wider">
                      TOTALES DEL AÑO
                    </td>
                    <td className="p-3 border-r border-slate-300 text-center text-emerald-700">
                      {currentS21Card.totalMonthsActive} / 12 meses
                    </td>
                    <td className="p-3 border-r border-slate-300 text-center text-slate-900">
                      {currentS21Card.totalBibleStudies} (Prom: {currentS21Card.avgStudiesPerMonth})
                    </td>
                    <td className="p-3 border-r border-slate-300 text-center text-indigo-700 text-sm">
                      {currentS21Card.totalHours} hrs (Prom: {currentS21Card.avgHoursPerMonth})
                    </td>
                    <td colSpan={2} className="p-3 text-slate-600 text-[11px] font-normal italic">
                      {currentPublisher.privilege === 'precursor_regular' || currentPublisher.pioneerStatus === 'regular' ? (
                        <span className="font-semibold text-indigo-900">
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
            <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Firma del Secretario</span>
                <p className="font-semibold text-slate-700">Secretario de la Congregación</p>
              </div>
              <div className="border-t border-slate-400 pt-2 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Revisión Semestral</span>
                <p className="font-semibold text-slate-700">Superintendente de Circuito</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: SEGUIMIENTO PASTORAL (IRREGULARES E INACTIVOS)          */}
      {/* ============================================================== */}
      {activeView === 'pastoral' && (
        <div className="space-y-6 no-print">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              <span>Atención Pastoral de la Congregación (Pautas Oficiales)</span>
            </h3>
            <p className="text-xs text-amber-800">
              Según las pautas del libro <em>Organizados para hacer la voluntad de Jehová</em>, los ancianos y siervos ministeriales se interesan con cariño por los publicadores que no han informado para brindarles ayuda espiritual oportuna antes de que se vuelvan inactivos (6 meses consecutivos sin predicar).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Irregular Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Publicadores Irregulares ({metrics.irregularCount})</span>
                </h3>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  1 a 5 meses pendientes
                </span>
              </div>

              {metrics.irregularPublishers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>¡Excelente! No hay publicadores irregulares en este período.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.irregularPublishers.map(({ publisher, missingMonths, lastMonth }) => (
                    <div
                      key={publisher.id}
                      className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">{publisher.name}</h4>
                        <p className="text-slate-500 text-[11px]">
                          Grupo {publisher.groupNumber || 'Sin grupo'} • Faltan {missingMonths} meses por informar
                          {lastMonth ? ` (Último: ${lastMonth})` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSendPastoralWhatsApp(publisher, missingMonths)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition"
                          title="Enviar mensaje pastoral por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleSelectPublisher(publisher.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition"
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span>Publicadores Inactivos ({metrics.inactiveCount})</span>
                </h3>
                <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                  6+ meses sin predicar
                </span>
              </div>

              {metrics.inactivePublishers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p>No hay publicadores clasificados como inactivos.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.inactivePublishers.map(({ publisher, missingMonths }) => (
                    <div
                      key={publisher.id}
                      className="p-3 bg-rose-50/40 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">{publisher.name}</h4>
                        <p className="text-slate-500 text-[11px]">
                          Grupo {publisher.groupNumber || 'Sin grupo'} • {missingMonths} meses sin actividad registrada
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSendPastoralWhatsApp(publisher, missingMonths)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition"
                          title="Enviar saludo pastoral por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleSelectPublisher(publisher.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Editar Informe: {editingMonth.monthName}
              </h3>
              <button
                onClick={() => setEditingMonth(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
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
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Horas:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingMonth.hours ?? ''}
                        onChange={(e) => setEditingMonth({ ...editingMonth, hours: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Ej. 15"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Cursos Bíblicos:</label>
                      <input
                        type="number"
                        min="0"
                        value={editingMonth.bibleStudies}
                        onChange={(e) => setEditingMonth({ ...editingMonth, bibleStudies: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
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
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Observaciones / Notas S-21:</label>
                <input
                  type="text"
                  value={editingMonth.notes || ''}
                  onChange={(e) => setEditingMonth({ ...editingMonth, notes: e.target.value })}
                  placeholder="Ej. Crédito de horas, enfermedad, etc."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingMonth(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 font-semibold rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMonthEdit}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Datos Teocráticos & Personales (S-21): {currentPublisher.name}
              </h3>
              <button
                onClick={() => setIsEditPersonalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Nacimiento:</label>
                  <input
                    type="date"
                    value={personalForm.birthDate}
                    onChange={(e) => setPersonalForm({ ...personalForm, birthDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Fecha de Bautismo:</label>
                  <input
                    type="date"
                    value={personalForm.baptismDate}
                    onChange={(e) => setPersonalForm({ ...personalForm, baptismDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Esperanza:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="hope"
                      checked={personalForm.hope === 'otras_ovejas'}
                      onChange={() => setPersonalForm({ ...personalForm, hope: 'otras_ovejas' })}
                    />
                    <span>Otras ovejas</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
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
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Dirección del Hogar:</label>
                <input
                  type="text"
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  placeholder="Calle, número, departamento..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contacto de Emergencia:</label>
                  <input
                    type="text"
                    value={personalForm.emergencyContactName}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyContactName: e.target.value })}
                    placeholder="Nombre y parentesco"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Teléfono Emergencia:</label>
                  <input
                    type="text"
                    value={personalForm.emergencyContactPhone}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyContactPhone: e.target.value })}
                    placeholder="+34..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEditPersonalModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 font-semibold rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePersonal}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Guardar Cambios S-21
              </button>
            </div>
          </div>
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
