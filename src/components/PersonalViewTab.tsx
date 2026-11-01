// src/components/PersonalViewTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { AssignmentStatus, MonthlyServiceReport, PublisherAbsence } from '../types';
import { generateGoogleCalendarUrl, downloadSingleIcsEvent } from '../utils/calendarExport';
import {
  extractUnifiedAssignmentsForPublisher,
  formatUnifiedMonthlyWhatsAppMessage,
  downloadPublisherUnifiedIcs,
  printPublisherUnifiedMonthlySheet,
  formatSpanishMonthLabel,
  UnifiedAssignmentCategory,
} from '../utils/unifiedMonthlyAssignments';
import { openWhatsAppLink } from '../utils/whatsapp';
import { SplashCheckbox } from './SplashCheckbox';
import { getAvailableServiceYears, buildS21CardForPublisher } from '../utils/s21Helper';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Share2,
  Copy,
  Check,
  User,
  MapPin,
  CalendarDays,
  ExternalLink,
  Map,
  ShieldAlert,
  Briefcase,
  Utensils,
  Compass,
  Wine,
  Flame,
  Building,
  Package,
  KeyRound,
  FileText,
  Send,
  Plane,
  Users,
  LogOut,
  HelpCircle,
  MessageCircle,
  Smartphone,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Bell,
  ArrowRight,
  Info,
  BellRing,
  X,
  ShieldCheck,
  Download,
  Printer,
  Layers,
  ArrowLeft,
  LayoutGrid,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  checkUpcomingAssignmentsAndNotify,
  subscribeToPushNotifications,
  getPushSubscriptionRecord,
  syncAssignmentsWithServiceWorker,
  PushSubscriptionRecord,
} from '../services/notificationService';
import { PushSubscriptionModal } from './PushSubscriptionModal';
import { TwoFactorSetupModal } from './TwoFactorSetupModal';
import { TwoFactorPromptModal } from './TwoFactorPromptModal';
import { ProfileDevicesAndCodesSection } from './ProfileDevicesAndCodesSection';
import { PinManagementModal } from './PinManagementModal';
import { setSecureLocalPin, getPinLockoutRemainingSeconds } from '../utils/theocraticSecurity';

export type PublisherPortalTab =
  | 'tarjetas'
  | 'asignaciones'
  | 'informe'
  | 'ausencias'
  | 'grupo'
  | 'avisos'
  | 'seguridad_2fa';
export type NWPublisherTab = PublisherPortalTab;

export const PersonalViewTab: React.FC = () => {
  const {
    publishers,
    weeks,
    replaceAssignment,
    settings,
    publishersMap,
    cartShifts,
    cartLocations,
    notices,
    territories,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
    specialOrders,
    preachingGroups,
    customDuties,
    outgoingSpeakers,
    fieldServiceMeetings,
    monthlyReports,
    updateMonthlyReport,
    updatePublisher,
  } = useCongregation();

  const {
    currentPublisherId,
    setIdentifiedPublisher,
    currentBrotherName,
    activeRole,
    effectiveRoleInfo,
    identifyRoleByPersonalPin,
    publisherPinsList,
    enableTwoFactorForPublisher,
    disableTwoFactorForPublisher,
    verifyTwoFactorForPublisher,
  } = useAuth();

  // Módulo activo dentro del Portal del Publicador
  const [activeModule, setActiveModule] = useState<PublisherPortalTab>('asignaciones');

  // Selected publisher state
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>(() => {
    if (currentPublisherId && publishersMap.has(currentPublisherId)) {
      return currentPublisherId;
    }
    // Check local storage for quick access
    const saved = localStorage.getItem('kongre_current_publisher_id_v2');
    if (saved && publishersMap.has(saved)) return saved;
    return publishers[0]?.id || '';
  });

  // 2FA & PIN Request state
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FAPromptModal, setShow2FAPromptModal] = useState(false);
  const [isPinRequestModalOpen, setIsPinRequestModalOpen] = useState(false);
  const [pending2FAPublisher, setPending2FAPublisher] = useState<{ id: string; name: string } | null>(null);
  const [is2FADisabling, setIs2FADisabling] = useState(false);

  const currentPinRecord = useMemo(() => {
    if (!selectedPublisherId) return null;
    return publisherPinsList.find((p) => p.publisherId === selectedPublisherId);
  }, [publisherPinsList, selectedPublisherId]);

  const isCurrentPublisher2FAEnabled = Boolean(currentPinRecord?.twoFactorEnabled);

  // PIN login state when not authenticated
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showSupervisorSelect, setShowSupervisorSelect] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() => {
    return typeof window !== 'undefined' ? getPinLockoutRemainingSeconds() : 0;
  });
  const [isShaking, setIsShaking] = useState(false);

  // Temporizador de cuenta regresiva en vivo para el bloqueo por intentos fallidos
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Absence modal / form
  const [showAddAbsenceModal, setShowAddAbsenceModal] = useState(false);
  const [absenceStartDate, setAbsenceStartDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('Vacaciones familiares');

  // Replacement / decline assignment modal
  const [declineModalState, setDeclineModalState] = useState<{
    isOpen: boolean;
    assignment: any | null;
    reason: string;
  }>({
    isOpen: false,
    assignment: null,
    reason: '',
  });

  // Notification permission, Web Push subscription, and modal state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );
  const [pushSubscription, setPushSubscription] = useState<PushSubscriptionRecord | null>(() =>
    getPushSubscriptionRecord()
  );
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isActivatingNotif, setIsActivatingNotif] = useState(false);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('kongre_notif_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [notifSuccessToast, setNotifSuccessToast] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    setIsActivatingNotif(true);
    try {
      const pubId = selectedPublisherId || currentPublisherId || 'publicador';
      const pubName =
        publishersMap.get(pubId)?.name || currentBrotherName || 'Publicador';
      const res = await subscribeToPushNotifications({
        publisherId: pubId,
        publisherName: pubName,
        congregationName: settings.congregationName,
        weeks,
        cartShifts,
        cartLocations,
        settings,
        publishersMap,
      });
      setNotifPermission(res.permission);
      if (res.success && res.subscription) {
        setPushSubscription(res.subscription);
        setNotifSuccessToast(
          '¡Suscripción Push activa! Recibirás recordatorios automáticos incluso con la aplicación cerrada.'
        );
        setTimeout(() => setNotifSuccessToast(null), 5000);
        await sendTestNotification();
      } else if (res.permission === 'denied') {
        setIsPushModalOpen(true);
      }
    } finally {
      setIsActivatingNotif(false);
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTestNotif(true);
    try {
      const ok = await sendTestNotification();
      if (ok) {
        setNotifSuccessToast('Notificación enviada a tu dispositivo.');
        setTimeout(() => setNotifSuccessToast(null), 3000);
      }
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  const handleDismissBanner = () => {
    setNotifBannerDismissed(true);
    try {
      sessionStorage.setItem('kongre_notif_banner_dismissed', 'true');
    } catch {}
  };

  // Current selected month for S-4 report (YYYY-MM)
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedReportMonth, setSelectedReportMonth] = useState<string>(currentMonthKey);

  // Sync selected publisher when currentPublisherId changes
  useEffect(() => {
    if (currentPublisherId && publishersMap.has(currentPublisherId)) {
      setSelectedPublisherId(currentPublisherId);
    }
  }, [currentPublisherId, publishersMap]);

  const selectedPublisher = publishersMap.get(selectedPublisherId);

  // Sincronizar automáticamente la cola del Service Worker cuando cambian las semanas o el publicador
  useEffect(() => {
    if (!selectedPublisher || notifPermission !== 'granted') return;
    syncAssignmentsWithServiceWorker({
      publisherId: selectedPublisher.id,
      publisherName: selectedPublisher.name,
      congregationName: settings.congregationName,
      weeks,
      cartShifts,
      cartLocations,
      settings,
      publishersMap,
    }).then(() => {
      setPushSubscription(getPushSubscriptionRecord());
    });
  }, [
    selectedPublisher,
    notifPermission,
    weeks,
    cartShifts,
    cartLocations,
    settings,
    publishersMap,
  ]);

  // Is user in supervisor / elder mode?
  const canSupervise = useMemo(() => {
    return (
      activeRole === 'coordinador' ||
      activeRole === 'secretario' ||
      activeRole === 'superintendente_vym' ||
      effectiveRoleInfo?.canEditSchedule ||
      effectiveRoleInfo?.canEditPublishers
    );
  }, [activeRole, effectiveRoleInfo]);

  // Is authenticated as a publisher or admin
  const isAuthenticatedPublisher = Boolean(
    (currentPublisherId && publishersMap.has(currentPublisherId)) || canSupervise
  );

  // S-4 Report for selected publisher and month
  const existingReport = useMemo(() => {
    if (!selectedPublisherId) return null;
    return (
      monthlyReports.find(
        (r) => r.publisherId === selectedPublisherId && r.month === selectedReportMonth
      ) || null
    );
  }, [monthlyReports, selectedPublisherId, selectedReportMonth]);

  // Local state for the S-4 form
  const [reportForm, setReportForm] = useState<{
    participated: boolean;
    hours: number;
    bibleStudies: number;
    notes: string;
  }>({
    participated: true,
    hours: 0,
    bibleStudies: 0,
    notes: '',
  });

  // Sync form when month or publisher changes
  useEffect(() => {
    if (existingReport) {
      setReportForm({
        participated: existingReport.participated,
        hours: existingReport.hours || 0,
        bibleStudies: existingReport.bibleStudies || 0,
        notes: existingReport.notes || '',
      });
    } else {
      setReportForm({
        participated: true,
        hours: 0,
        bibleStudies: 0,
        notes: '',
      });
    }
  }, [existingReport, selectedPublisherId, selectedReportMonth]);

  // Handle PIN login directly
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!enteredPin || enteredPin.length < 4) {
      setPinError('Introduce tu PIN de 4 dígitos asignado.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await identifyRoleByPersonalPin(enteredPin);
      if (res.success) {
        setSecureLocalPin('kongre_session_pin_v2', enteredPin.trim());
        if (res.publisherId && publishersMap.has(res.publisherId)) {
          setSelectedPublisherId(res.publisherId);
          setIdentifiedPublisher(res.publisherId, res.name);
        } else {
          // If no specific publisherId was linked to the pin, search in publisher list
          const matchPub = publishers.find(
            (p) =>
              (p as any).personalPin === enteredPin ||
              (p as any).pin === enteredPin ||
              p.name.toLowerCase() === (res.name || '').toLowerCase()
          );
          if (matchPub) {
            setSelectedPublisherId(matchPub.id);
            setIdentifiedPublisher(matchPub.id, matchPub.name);
          }
        }
        setEnteredPin('');
        setLockoutSeconds(0);
      } else if (res.requires2FA && res.publisherId) {
        setPending2FAPublisher({ id: res.publisherId, name: res.name || '' });
        setShow2FAPromptModal(true);
        setIsVerifyingPin(false);
        return;
      } else {
        const remaining = getPinLockoutRemainingSeconds();
        if (remaining > 0) {
          setLockoutSeconds(remaining);
        }
        setPinError(res.message || 'PIN Personal no reconocido.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 60, 40]);
          }
        } catch {}
      }
    } catch (err: any) {
      setPinError(err.message || 'Error al validar el PIN.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Auto-cierre por inactividad (5 min) en vista personal para proteger privacidad en equipos compartidos
  useEffect(() => {
    if (!isAuthenticatedPublisher || canSupervise) return;

    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleExitPortal();
      }, 5 * 60 * 1000); // 5 minutos de inactividad
    };

    resetTimer();
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isAuthenticatedPublisher, canSupervise]);

  // Exit / switch publisher
  const handleExitPortal = () => {
    setIdentifiedPublisher(null);
    setSecureLocalPin('kongre_session_pin_v2', null);
    setEnteredPin('');
    setShowSupervisorSelect(false);
  };

  // Submit S-4 monthly report
  const handleSaveMonthlyReport = () => {
    if (!selectedPublisherId) return;

    const isPioneer =
      selectedPublisher?.pioneerStatus === 'regular' ||
      selectedPublisher?.pioneerStatus === 'especial' ||
      (selectedPublisher as any)?.serviceRole === 'regular_pioneer';

    const isAuxiliary =
      selectedPublisher?.pioneerStatus === 'auxiliar_continuo' ||
      (selectedPublisher as any)?.serviceRole === 'precursor_auxiliar';

    const newReport: MonthlyServiceReport = {
      id: existingReport?.id || `rep-${selectedPublisherId}-${selectedReportMonth}`,
      publisherId: selectedPublisherId,
      month: selectedReportMonth,
      participated: reportForm.participated,
      hours: reportForm.hours,
      bibleStudies: reportForm.bibleStudies,
      notes: reportForm.notes.trim() || undefined,
      reportedAt: new Date().toISOString(),
      isPioneer: Boolean(isPioneer),
      isAuxiliaryPioneer: Boolean(isAuxiliary),
    };

    updateMonthlyReport(newReport);
    setReportSuccessMsg('¡Informe mensual guardado y transmitido con éxito a la secretaría!');
    setTimeout(() => setReportSuccessMsg(null), 4000);
  };

  // Historial Mes a Mes (Año de Servicio Sep - Ago) y Meta Anual de Horas en Mi Vista
  const availableServiceYears = useMemo(() => getAvailableServiceYears(), []);
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>('2025-2026');

  const personalS21Summary = useMemo(() => {
    if (!selectedPublisher) return null;
    const card = buildS21CardForPublisher(selectedPublisher, selectedServiceYear, monthlyReports);
    const isRegularPioneer =
      selectedPublisher.privilege === 'precursor_regular' ||
      selectedPublisher.pioneerStatus === 'regular';
    const isSpecialPioneer =
      selectedPublisher.privilege === 'precursor_especial' ||
      selectedPublisher.pioneerStatus === 'especial';
    const isAuxPioneer =
      selectedPublisher.privilege === 'precursor_auxiliar' ||
      selectedPublisher.pioneerStatus === 'auxiliar_continuo';

    const annualGoalHours = isSpecialPioneer
      ? 1200
      : isRegularPioneer
      ? 600
      : isAuxPioneer
      ? 360
      : 180;

    const progressPct =
      annualGoalHours > 0 ? Math.min(100, Math.round((card.totalHours / annualGoalHours) * 100)) : 0;
    const remainingAnnualHours = Math.max(0, annualGoalHours - card.totalHours);

    return {
      card,
      isRegularPioneer,
      isSpecialPioneer,
      annualGoalHours,
      progressPct,
      remainingAnnualHours,
    };
  }, [selectedPublisher, selectedServiceYear, monthlyReports]);

  // Share S-4 report by WhatsApp
  const handleShareReportWhatsApp = () => {
    if (!selectedPublisher) return;

    const [y, m] = selectedReportMonth.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const monthName = monthNames[parseInt(m, 10) - 1] || selectedReportMonth;

    const text =
      `*Informe de Servicio del Campo (S-4)* 📋\n` +
      `👤 *Publicador:* ${selectedPublisher.name}\n` +
      `🏛 *Congregación:* ${settings.congregationName || 'Central'}\n` +
      `📅 *Mes:* ${monthName} ${y}\n` +
      `✅ *Participación:* ${reportForm.participated ? 'Sí participué' : 'Sin participación'}\n` +
      (reportForm.hours > 0 ? `⏱️ *Horas:* ${reportForm.hours}\n` : '') +
      (reportForm.bibleStudies > 0 ? `📖 *Cursos Bíblicos:* ${reportForm.bibleStudies}\n` : '') +
      (reportForm.notes ? `📝 *Notas:* ${reportForm.notes}\n` : '') +
      `\n_Enviado desde el Portal del Publicador Kongre_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Add planned absence
  const handleAddAbsence = () => {
    if (!selectedPublisher || !absenceStartDate || !absenceEndDate) return;

    const newAbsence: PublisherAbsence = {
      id: `abs-${Date.now()}`,
      start_date: absenceStartDate,
      end_date: absenceEndDate,
      reason: absenceReason.trim() || 'Ausencia planificada',
    };

    const currentAbsences = selectedPublisher.ausencias || [];
    const updated = [...currentAbsences, newAbsence];

    updatePublisher({
      ...selectedPublisher,
      ausencias: updated,
    });

    setAbsenceStartDate('');
    setAbsenceEndDate('');
    setShowAddAbsenceModal(false);
  };

  // Delete absence
  const handleDeleteAbsence = (absId: string) => {
    if (!selectedPublisher) return;
    const currentAbsences = selectedPublisher.ausencias || [];
    const updated = currentAbsences.filter((a) => a.id !== absId);
    updatePublisher({
      ...selectedPublisher,
      ausencias: updated,
    });
  };

  // Desactivar 2FA para el publicador activo
  const handleDisable2FA = async () => {
    if (!selectedPublisherId) return;
    if (!window.confirm('¿Deseas desactivar la verificación en dos pasos (2FA) para tu cuenta?')) return;
    setIs2FADisabling(true);
    try {
      const res = await disableTwoFactorForPublisher(selectedPublisherId);
      if (res.success) {
        alert('Verificación en dos pasos desactivada exitosamente.');
      } else {
        alert(res.message || 'No se pudo desactivar 2FA.');
      }
    } finally {
      setIs2FADisabling(false);
    }
  };

  // My Preaching Group
  const myPreachingGroup = useMemo(() => {
    if (!selectedPublisherId) return null;
    return preachingGroups.find(
      (g) =>
        g.memberIds.includes(selectedPublisherId) ||
        g.overseerId === selectedPublisherId ||
        g.assistantId === selectedPublisherId
    );
  }, [preachingGroups, selectedPublisherId]);

  const groupOverseer = myPreachingGroup?.overseerId
    ? publishersMap.get(myPreachingGroup.overseerId)
    : null;
  const groupAssistant = myPreachingGroup?.assistantId
    ? publishersMap.get(myPreachingGroup.assistantId)
    : null;

  // Filtros de la Hoja Unificada Mensual
  const [unifiedMonthFilter, setUnifiedMonthFilter] = useState<string>('all_upcoming');
  const [unifiedCategoryFilter, setUnifiedCategoryFilter] = useState<'todas' | UnifiedAssignmentCategory>('todas');
  const [copiedSummaryToast, setCopiedSummaryToast] = useState(false);

  const availableAssignmentMonths = useMemo(() => {
    const set = new Set<string>();
    weeks.forEach((w) => {
      if (w.weekStartDate) set.add(w.weekStartDate.slice(0, 7));
      if (w.midweek?.date) set.add(w.midweek.date.slice(0, 7));
      if (w.weekend?.date) set.add(w.weekend.date.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [weeks]);

  // Extraer todas las asignaciones unificadas (VMC, Fin de Semana, Audio/Micrófonos/Acomodadores, Limpieza, Carritos, Orador Saliente, Hospitalidad)
  const myUnifiedAssignmentsAll = useMemo(() => {
    if (!selectedPublisher) return [];
    return extractUnifiedAssignmentsForPublisher(
      selectedPublisher,
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
      unifiedMonthFilter
    );
  }, [
    selectedPublisher,
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
    unifiedMonthFilter,
  ]);

  const myAssignments = useMemo(() => {
    const filtered =
      unifiedCategoryFilter === 'todas'
        ? myUnifiedAssignmentsAll
        : myUnifiedAssignmentsAll.filter((a) => a.category === unifiedCategoryFilter);

    return filtered.map((u) => ({
      id: u.id,
      weekId: u.weekId || '',
      date: u.date,
      time: u.time,
      meetingType: u.meetingType || 'midweek',
      meetingName: u.meetingOrVenue,
      assignmentTitle: u.title,
      subtitle: u.subtitle,
      category: u.category,
      categoryLabel: u.categoryLabel,
      roleKey: u.category,
      assignmentPath: u.assignmentPath || '',
      room: u.room,
      assistantName: u.partnerName,
      timeMinutes: u.durationMinutes,
      status: u.status,
      canConfirmInPortal: Boolean(u.canConfirmInPortal && u.weekId && u.assignmentPath),
      familyAssignedSameDay: u.familyAssignedSameDay,
      rawUnified: u,
    }));
  }, [myUnifiedAssignmentsAll, unifiedCategoryFilter]);

  // Acciones de la Hoja Unificada Mensual
  const handleDownloadAllUnifiedIcs = () => {
    if (!selectedPublisher || myUnifiedAssignmentsAll.length === 0) return;
    downloadPublisherUnifiedIcs(
      selectedPublisher,
      unifiedMonthFilter,
      myUnifiedAssignmentsAll,
      settings
    );
    setNotifSuccessToast(
      `Calendario (.ics) con ${myUnifiedAssignmentsAll.length} asignaciones descargado con alarmas automáticas.`
    );
    setTimeout(() => setNotifSuccessToast(null), 4000);
  };

  const handleSendUnifiedMonthlyWhatsApp = () => {
    if (!selectedPublisher || myUnifiedAssignmentsAll.length === 0) return;
    const msg = formatUnifiedMonthlyWhatsAppMessage(
      selectedPublisher,
      unifiedMonthFilter,
      myUnifiedAssignmentsAll,
      settings.congregationName
    );
    openWhatsAppLink(selectedPublisher.phone || '', msg);
  };

  const handleCopyUnifiedMonthlySummary = () => {
    if (!selectedPublisher || myUnifiedAssignmentsAll.length === 0) return;
    const msg = formatUnifiedMonthlyWhatsAppMessage(
      selectedPublisher,
      unifiedMonthFilter,
      myUnifiedAssignmentsAll,
      settings.congregationName
    );
    navigator.clipboard.writeText(msg);
    setCopiedSummaryToast(true);
    setTimeout(() => setCopiedSummaryToast(false), 2500);
  };

  const handlePrintUnifiedMonthlySheet = () => {
    if (!selectedPublisher || myUnifiedAssignmentsAll.length === 0) return;
    printPublisherUnifiedMonthlySheet(
      selectedPublisher,
      unifiedMonthFilter,
      myUnifiedAssignmentsAll,
      settings
    );
  };

  // Handle assignment status confirmation
  const handleUpdateStatus = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newStatus: AssignmentStatus
  ) => {
    if (!selectedPublisherId || !weekId || !assignmentPath) return;
    replaceAssignment(weekId, meetingType, assignmentPath, selectedPublisherId, newStatus);
  };

  // Copy assignment text
  const copyAssignmentDetails = (item: any) => {
    const text =
      `Asignación teocrática:\n` +
      `📅 Fecha: ${item.date} (${item.time || ''})\n` +
      `🏛 Lugar / Reunión: ${item.meetingName}\n` +
      `📌 Privilegio: ${item.assignmentTitle}` +
      (item.room ? `\nSala: ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}` : '') +
      (item.assistantName ? `\n${item.assistantName}` : '') +
      (item.familyAssignedSameDay?.length
        ? `\n👨‍👩‍👧‍👦 Familiar asignado hoy: ${item.familyAssignedSameDay.join(', ')}`
        : '');

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Google Calendar URL generator
  const getGoogleCalLink = (item: any) => {
    const time =
      item.time ||
      (item.meetingType === 'midweek'
        ? settings.midweekMeetingTime || '19:00'
        : settings.weekendMeetingTime || '10:00');
    const loc = settings.hallAddress || item.meetingName || 'Salón del Reino de los Testigos de Jehová';
    const desc = `${item.assignmentTitle} - ${item.meetingName}. Asignado a ${selectedPublisher?.name || 'Publicador'}.`;

    return generateGoogleCalendarUrl(
      item.assignmentTitle,
      desc,
      loc,
      item.date,
      time,
      item.timeMinutes || 105
    );
  };

  // Download .ics
  const handleDownloadIcs = (item: any) => {
    const time =
      item.time ||
      (item.meetingType === 'midweek'
        ? settings.midweekMeetingTime || '19:00'
        : settings.weekendMeetingTime || '10:00');
    const loc = settings.hallAddress || item.meetingName || 'Salón del Reino de los Testigos de Jehová';
    const desc = `${item.assignmentTitle} - ${item.meetingName}.`;

    downloadSingleIcsEvent(
      item.assignmentTitle,
      desc,
      loc,
      item.date,
      time,
      item.timeMinutes || 105
    );
  };

  // Share by WhatsApp
  const handleShareAssignmentWhatsApp = (item: any) => {
    const text =
      `*Mi Asignación Teocrática* 🏛\n` +
      `📅 *Fecha:* ${item.date} (${item.time || ''})\n` +
      `📖 *Reunión / Área:* ${item.meetingName}\n` +
      `📌 *Parte:* ${item.assignmentTitle}` +
      (item.room ? `\n🏛 *Sala:* ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}` : '') +
      (item.assistantName ? `\n👥 ${item.assistantName}` : '') +
      (item.familyAssignedSameDay?.length
        ? `\n👨‍👩‍👧‍👦 *Familiar asignado hoy:* ${item.familyAssignedSameDay.join(', ')}`
        : '') +
      `\n\n_Portal del Publicador Kongre_`;

    openWhatsAppLink('', text);
  };

  // 1. PIN LOGIN SCREEN (If not authenticated as publisher and not supervisor)
  if (!isAuthenticatedPublisher) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 sm:py-14 px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
          {/* Logo / Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <KeyRound size={32} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60">
              PORTAL DEL PUBLICADOR • KONGRE
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white pt-1">
              Bienvenido a tu Portal Teocrático
            </h2>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">
              Introduce tu PIN Personal único de 4 dígitos para consultar tus partes, enviar tu informe de servicio y reportar ausencias.
            </p>
          </div>

          {/* Formulario de PIN */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            {/* Aviso visual de bloqueo por intentos fallidos */}
            {lockoutSeconds > 0 && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-pulse">
                <Clock size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Bloqueo de seguridad: espera {lockoutSeconds}s para reintentar</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                PIN Personal del Publicador
              </label>
              <div className={`relative max-w-xs mx-auto ${isShaking ? 'animate-shake' : ''}`}>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••"
                  value={enteredPin}
                  disabled={lockoutSeconds > 0 || isVerifyingPin}
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  spellCheck={false}
                  onChange={(e) => {
                    if (lockoutSeconds > 0) return;
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setEnteredPin(clean);
                    setPinError(null);
                  }}
                  className={`w-full text-center text-3xl font-mono tracking-widest py-3 px-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border-2 ${
                    isShaking ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-zinc-200 dark:border-[#27272A] focus:border-purple-600 dark:focus:border-purple-500'
                  } focus:outline-hidden text-zinc-900 dark:text-white transition-all shadow-inner ${
                    lockoutSeconds > 0 ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-[#18181F]' : ''
                  }`}
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            {/* Teclado rápido numérico en pantalla para táctil */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={lockoutSeconds > 0 || isVerifyingPin}
                  onClick={() => {
                    if (lockoutSeconds > 0 || isVerifyingPin) return;
                    if (k === 'C') {
                      setEnteredPin('');
                      setPinError(null);
                    } else if (k === '✓') {
                      handlePinSubmit();
                    } else {
                      if (enteredPin.length < 6) {
                        setEnteredPin((prev) => prev + k);
                        setPinError(null);
                      }
                    }
                  }}
                  className={`py-3 rounded-xl font-bold text-base transition-all ${
                    lockoutSeconds > 0 || isVerifyingPin ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    k === '✓'
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                      : k === 'C'
                      ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-600 dark:text-[#D4D4D8]'
                      : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-white border border-zinc-200/60 dark:border-[#27272A]'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifyingPin || enteredPin.length < 4 || lockoutSeconds > 0}
              className="w-full max-w-xs mx-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifyingPin ? (
                <span>Validando credencial...</span>
              ) : lockoutSeconds > 0 ? (
                <span>Bloqueado temporalmente ({lockoutSeconds}s)</span>
              ) : (
                <>
                  <span>Ingresar a Mi Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Ayuda y Solicitud de Cambio de PIN */}
          <div className="pt-4 border-t border-zinc-100 dark:border-[#27272A] text-xs text-zinc-500 space-y-3 text-center">
            <p className="italic">
              ¿Olvidaste tu PIN, perdiste tu dispositivo o sospechas de un acceso no autorizado?
            </p>
            <button
              type="button"
              onClick={() => setIsPinRequestModalOpen(true)}
              className="mx-auto py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Solicitar Cambio de PIN a los Ancianos</span>
            </button>
          </div>
        </div>

        <PinManagementModal
          isOpen={isPinRequestModalOpen}
          onClose={() => setIsPinRequestModalOpen(false)}
          publisherId={selectedPublisherId || currentPublisherId || 'publicador'}
          publisherName={selectedPublisher?.name || currentBrotherName || 'Publicador'}
          role={effectiveRoleInfo?.id}
        />
      </div>
    );
  }

  // 2. PORTAL PRINCIPAL DEL PUBLICADOR
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 2.1 BARRA SUPERIOR DE IDENTIDAD DEL PUBLICADOR (COMPACTA) */}
      <div className="bg-white dark:bg-[#121216] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            {selectedPublisher?.name ? selectedPublisher.name[0].toUpperCase() : 'P'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">
                {selectedPublisher?.name || 'Publicador'}
              </h2>
              <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.2 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                <CheckCircle2 size={9} /> PIN Verificado
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate mt-0.5 leading-tight">
              {settings.congregationName || 'Central'}{myPreachingGroup ? ` • Grupo ${myPreachingGroup.number}` : ''}
            </p>
          </div>
        </div>

        {/* Acciones de la barra superior */}
        <div className="flex items-center gap-2 flex-wrap">
          {canSupervise && (
            <button
              type="button"
              onClick={() => setShowSupervisorSelect(!showSupervisorSelect)}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{showSupervisorSelect ? 'Ocultar Selector' : 'Consultar otro hermano'}</span>
            </button>
          )}

          {isNotificationSupported() && (
            <button
              type="button"
              onClick={() => setIsPushModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                notifPermission === 'granted' && pushSubscription?.active
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50'
                  : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40'
              }`}
              title="Configurar suscripción a notificaciones push en segundo plano"
            >
              <BellRing
                size={14}
                className={
                  notifPermission === 'granted' && pushSubscription?.active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-purple-600 dark:text-purple-400'
                }
              />
              <span>
                {notifPermission === 'granted' && pushSubscription?.active
                  ? `Push Activo (${pushSubscription.scheduledCount || 0})`
                  : 'Suscribir Push'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExitPortal}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-800/40"
            title="Salir o cambiar de PIN"
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Toast de confirmación de notificación */}
      {notifSuccessToast && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notifSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotifSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Banner de Suscripción a Notificaciones Web Push con App Cerrada */}
      {isNotificationSupported() &&
        (notifPermission !== 'granted' || !pushSubscription?.active) &&
        !notifBannerDismissed && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200/80 dark:border-purple-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                <Bell className="animate-pulse" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                    Suscripción Push en Segundo Plano
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">
                    {notifPermission === 'denied'
                      ? 'Permiso bloqueado en navegador'
                      : 'Funciona incluso con la app cerrada'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                  Recibe recordatorios automáticos de tus asignaciones sin abrir la app
                </h3>
                <p className="text-xs text-zinc-600 dark:text-[#A1A1AA] max-w-xl">
                  Suscríbete a las notificaciones push del navegador para que tu dispositivo te avise automáticamente antes de tus partes estudiantiles, discursos, turnos de audio/micrófonos, aseo o carritos aunque tengas Kongre cerrado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center flex-wrap">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isActivatingNotif}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={15} />
                <span>{isActivatingNotif ? 'Suscribiendo...' : 'Suscribirme Ahora'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPushModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#18181F] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] border border-zinc-200 dark:border-[#27272A] text-xs font-bold transition-all cursor-pointer"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-500 hover:text-zinc-700 dark:text-[#A1A1AA] transition-all cursor-pointer"
                title="Cerrar por ahora"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

      {/* Selector supervisor desplegable para ancianos */}
      {canSupervise && showSupervisorSelect && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <Shield size={16} />
            <span>Modo Supervisor / Anciano: Selecciona cualquier publicador para revisar sus asignaciones</span>
          </div>
          <select
            value={selectedPublisherId}
            onChange={(e) => {
              setSelectedPublisherId(e.target.value);
              setIdentifiedPublisher(e.target.value);
            }}
            className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-[#121216] text-zinc-900 dark:text-white border border-indigo-200 dark:border-indigo-800 focus:outline-hidden"
          >
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.active ? '' : '(Inactivo)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 2.2 TARJETAS INTERACTIVAS DE SECCIONES DEL PORTAL O BARRA DE SECCIÓN ACTIVA */}
      {(() => {
        const portalCards: {
          id: Exclude<PublisherPortalTab, 'tarjetas'>;
          title: string;
          shortLabel: string;
          subtitle: string;
          summary: string;
          statusText: string;
          icon: React.ElementType;
          iconBg: string;
          iconColor: string;
        }[] = [
          {
            id: 'asignaciones',
            title: 'Mis Asignaciones y Partes',
            shortLabel: 'Asignaciones',
            subtitle: 'Consulta tus partes estudiantiles, discursos, turnos de audio/aseo y confirma asistencia.',
            summary: `${myAssignments.length} asignación(es) programada(s)`,
            statusText: 'Ver partes',
            icon: Calendar,
            iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            id: 'informe',
            title: 'Informe Mensual e Historial S-4',
            shortLabel: 'Informe S-4',
            subtitle: 'Envía tu informe mensual de predicación y consulta tu registro del año de servicio.',
            summary: existingReport ? 'Informe del mes registrado' : 'Pendiente de enviar este mes',
            statusText: 'Abrir informe',
            icon: CalendarDays,
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            id: 'ausencias',
            title: 'Mis Ausencias Programadas',
            shortLabel: 'Ausencias',
            subtitle: 'Informa con anticipación las semanas en que no podrás recibir asignaciones.',
            summary: `${(selectedPublisher?.ausencias || []).length} ausencia(s) registrada(s)`,
            statusText: 'Gestionar fechas',
            icon: Plane,
            iconBg: 'bg-amber-50 dark:bg-amber-950/60',
            iconColor: 'text-amber-600 dark:text-amber-400',
          },
          {
            id: 'grupo',
            title: 'Mi Grupo de Servicio',
            shortLabel: 'Mi Grupo',
            subtitle: 'Compañeros de grupo, superintendente, auxiliar y puntos de reunión para predicar.',
            summary: myPreachingGroup ? `Grupo ${myPreachingGroup.number} · ${myPreachingGroup.name}` : 'Grupo de servicio local',
            statusText: 'Ver mi grupo',
            icon: Users,
            iconBg: 'bg-blue-50 dark:bg-blue-950/60',
            iconColor: 'text-blue-600 dark:text-blue-400',
          },
          {
            id: 'avisos',
            title: 'Tablero de Avisos y Cartas',
            shortLabel: 'Avisos',
            subtitle: 'Comunicados recientes, anuncios de la congregación y eventos especiales.',
            summary: `${notices.length} aviso(s) disponible(s)`,
            statusText: 'Leer avisos',
            icon: Bell,
            iconBg: 'bg-purple-50 dark:bg-purple-950/60',
            iconColor: 'text-purple-600 dark:text-purple-400',
          },
          {
            id: 'seguridad_2fa',
            title: 'Seguridad 2FA y Mis Dispositivos',
            shortLabel: 'Seguridad 2FA',
            subtitle: 'Configura Microsoft Authenticator (2FA), solicita cambio de PIN y revisa tus dispositivos.',
            summary: isCurrentPublisher2FAEnabled ? '2FA Activo · Historial privado' : 'Configurar 2FA · Historial privado',
            statusText: 'Abrir seguridad',
            icon: ShieldCheck,
            iconBg: 'bg-teal-50 dark:bg-teal-950/60',
            iconColor: 'text-teal-600 dark:text-teal-400',
          },
        ];

        const activeCardMeta = portalCards.find((c) => c.id === activeModule);

        if (activeModule === 'tarjetas') {
          return (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="px-1">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                  Secciones de Mi Portal Teocrático
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Selecciona una tarjeta para abrir directamente esa sección.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portalCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setActiveModule(card.id)}
                      className="group text-left bg-white dark:bg-[#121216] hover:bg-zinc-50/80 dark:hover:bg-[#18181F] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-[#27272A] hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className={`w-11 h-11 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                            <span>{card.statusText}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {card.title}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] leading-relaxed">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] text-[11px] font-medium text-zinc-600 dark:text-[#D4D4D8] truncate">
                        {card.summary}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setActiveModule('tarjetas')}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Todas las tarjetas</span>
              </button>

              {activeCardMeta && (
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
                    {activeCardMeta.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate hidden sm:block">
                    {activeCardMeta.subtitle}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
              {portalCards.map((sc) => {
                const ScIcon = sc.icon;
                const isCurr = sc.id === activeModule;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setActiveModule(sc.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isCurr
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-zinc-50 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    title={sc.title}
                  >
                    <ScIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xl:inline">{sc.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 2.3 CONTENIDO DEL MÓDULO SELECCIONADO */}

      {/* MÓDULO 1: MIS ASIGNACIONES (HOJA UNIFICADA DEL MES + CALENDARIO .ICS + WHATSAPP ÚNICO) */}
      {activeModule === 'asignaciones' && (
        <div className="space-y-4">
          {/* BARRA MAESTRA: HOJA UNIFICADA DE MIS ASIGNACIONES DEL MES */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    <Layers size={11} /> Hoja Personal Unificada
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA]">
                    VMC • Fin de Semana • Audio/Acomodadores • Limpieza • Carritos
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  Mis Asignaciones del Mes ({myUnifiedAssignmentsAll.length})
                </h3>
              </div>

              {/* Botones de Exportación Unificada (.ics, WhatsApp único, Impresión) */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadAllUnifiedIcs}
                  disabled={myUnifiedAssignmentsAll.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Descargar todas tus asignaciones en un solo archivo .ics con recordatorios para Google/Apple/Outlook Calendar"
                >
                  <Download size={14} />
                  <span>Exportar Calendario (.ics)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendUnifiedMonthlyWhatsApp}
                  disabled={myUnifiedAssignmentsAll.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Enviar un único resumen consolidado por WhatsApp con todas las partes del mes"
                >
                  <MessageCircle size={14} />
                  <span>Resumen Único WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyUnifiedMonthlySummary}
                  disabled={myUnifiedAssignmentsAll.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] disabled:opacity-40 text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all cursor-pointer"
                  title="Copiar resumen mensual al portapapeles"
                >
                  {copiedSummaryToast ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>{copiedSummaryToast ? '¡Resumen Copiado!' : 'Copiar Mes'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintUnifiedMonthlySheet}
                  disabled={myUnifiedAssignmentsAll.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] disabled:opacity-40 text-zinc-700 dark:text-[#E4E4E7] text-xs font-bold transition-all cursor-pointer"
                  title="Imprimir o guardar en PDF tu Hoja Personal de Asignaciones del Mes"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Imprimir Hoja</span>
                </button>
              </div>
            </div>

            {/* Filtros por Mes y por Área Teocrática */}
            <div className="pt-2 border-t border-zinc-100 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {(
                  [
                    { id: 'todas', label: 'Todas las áreas' },
                    { id: 'vym', label: '📖 Vida y Min.' },
                    { id: 'fin_de_semana', label: '🏛️ Fin de Semana' },
                    { id: 'deberes', label: '🎧 Audio / Acomodador' },
                    { id: 'limpieza', label: '🧹 Limpieza' },
                    { id: 'carritos', label: '🛒 Carritos' },
                    { id: 'servicio_campo', label: '🧭 Salidas al Campo' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setUnifiedCategoryFilter(cat.id as any)}
                    className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      unifiedCategoryFilter === cat.id
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-[11px] font-bold text-zinc-500">Periodo:</label>
                <select
                  value={unifiedMonthFilter}
                  onChange={(e) => setUnifiedMonthFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] font-bold text-zinc-800 dark:text-white focus:outline-hidden"
                >
                  <option value="all_upcoming">Todas las semanas cargadas</option>
                  {availableAssignmentMonths.map((mKey) => (
                    <option key={mKey} value={mKey}>
                      {formatSpanishMonthLabel(mKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {myAssignments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#121216] rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No tienes asignaciones en el filtro seleccionado
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                Prueba seleccionando «Todas las áreas» o «Todas las semanas cargadas» para ver el programa completo.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Mostrando {myAssignments.length}{' '}
                  {myAssignments.length === 1 ? 'asignación programada' : 'asignaciones programadas'}
                </p>
                <span className="text-[11px] text-zinc-400">
                  Sincroniza con tu calendario o confirma asistencia en 1 clic
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                {myAssignments.map((item) => {
                  const isConfirmed = item.status === 'confirmada';
                  const isRejected = item.status === 'rechazada';

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 sm:gap-4"
                    >
                      <div className="space-y-2">
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-1 rounded-xl border border-purple-100 dark:border-purple-800/60">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.date} {item.time ? `• ${item.time}` : ''}
                          </span>
                          <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8]">
                            {item.categoryLabel || item.meetingName}
                          </span>
                          {item.room && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                            </span>
                          )}
                        </div>

                        {/* Título de la parte */}
                        <div>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">
                            {item.assignmentTitle}
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] font-medium mt-0.5">
                            {item.meetingName}
                          </p>
                          {item.subtitle && (
                            <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] mt-1">
                              {item.subtitle}
                            </p>
                          )}
                          {item.assistantName && (
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1 flex items-center gap-1">
                              <Users size={12} />
                              <span>{item.assistantName}</span>
                            </p>
                          )}
                          {item.familyAssignedSameDay && item.familyAssignedSameDay.length > 0 && (
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50 mt-1.5 inline-flex items-center gap-1.5">
                              <Users size={12} />
                              <span>
                                👨‍👩‍👧‍👦 También participa hoy: {item.familyAssignedSameDay.join(', ')}
                              </span>
                            </p>
                          )}
                          {item.timeMinutes && (
                            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                              <Clock size={12} />
                              <span>Duración estimada: {item.timeMinutes} minutos</span>
                            </p>
                          )}
                        </div>

                        {/* Estado actual */}
                        <div className="pt-1 flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isConfirmed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
                            }`}
                          >
                            {isConfirmed ? (
                              <>
                                <Check size={10} /> Asistencia Confirmada
                              </>
                            ) : isRejected ? (
                              <>
                                <XCircle size={10} /> Solicitud de sustituto enviada
                              </>
                            ) : (
                              <>
                                <Clock size={10} /> Pendiente de confirmación
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Botones de acción rápida */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2 flex-wrap">
                        {/* Confirmar / Rechazar */}
                        {item.canConfirmInPortal ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(
                                  item.weekId,
                                  item.meetingType,
                                  item.assignmentPath,
                                  'confirmada'
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isConfirmed
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] text-zinc-700 dark:text-[#D4D4D8]'
                              }`}
                            >
                              <Check size={12} />
                              <span>Confirmar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeclineModalState({
                                  isOpen: true,
                                  assignment: item,
                                  reason: '',
                                })
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isRejected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-zinc-100 hover:bg-rose-50 dark:bg-[#18181F] dark:hover:bg-rose-950/40 text-zinc-600 hover:text-rose-600 dark:text-[#A1A1AA]'
                              }`}
                            >
                              <XCircle size={12} />
                              <span>No podré</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 font-medium">
                            Programación general
                          </span>
                        )}

                        {/* Exportar / Compartir */}
                        <div className="flex items-center gap-1">
                          <a
                            href={getGoogleCalLink(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] transition-all"
                            title="Añadir a Google Calendar"
                          >
                            <Calendar size={14} />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(item)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] transition-all cursor-pointer"
                            title="Descargar archivo .ics para iCal/Outlook"
                          >
                            <ExternalLink size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareAssignmentWhatsApp(item)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer"
                            title="Compartir por WhatsApp"
                          >
                            <Share2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => copyAssignmentDetails(item)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] transition-all cursor-pointer"
                            title="Copiar detalles"
                          >
                            {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MÓDULO 2 REDISEÑADO: HISTORIAL MENSUAL Y META ANUAL */}
      {activeModule === 'informe' && (
        <div className="w-full space-y-4 sm:space-y-5">
          {/* 1. CABECERA Y META ANUAL DEL AÑO DE SERVICIO (SEPTIEMBRE - AGOSTO) */}
          {personalS21Summary && (
            <div className="bg-white dark:bg-[#121216] p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-zinc-100 dark:border-[#27272A]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                      <Calendar size={11} /> Año de Servicio (Septiembre – Agosto)
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA]">
                      {personalS21Summary.isRegularPioneer
                        ? 'Precursor Regular (Meta oficial: 600 h/año)'
                        : personalS21Summary.isSpecialPioneer
                        ? 'Precursor Especial (Meta oficial: 1200 h/año)'
                        : `Meta anual de horas: ${personalS21Summary.annualGoalHours} h/año`}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-zinc-900 dark:text-white mt-1">
                    Mi Historial Mensual y Meta Anual de Horas
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Revisa tu progreso mes a mes y toca cualquier mes de la lista para completar o actualizar tu actividad.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-auto">
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#18181F] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                    <Calendar size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-zinc-600 dark:text-[#D4D4D8]">Periodo:</span>
                    <select
                      value={selectedServiceYear}
                      onChange={(e) => setSelectedServiceYear(e.target.value)}
                      className="bg-transparent text-xs font-extrabold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                    >
                      {availableServiceYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4 Indicadores Visuales de la Meta Anual */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    Horas en el Año
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1 tabular-nums">
                    <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                      {personalS21Summary.card.totalHours} h
                    </span>
                    <span className="text-xs font-bold text-zinc-500 dark:text-[#A1A1AA]">
                      / {personalS21Summary.annualGoalHours} h
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {personalS21Summary.progressPct}% de tu meta anual
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                    Promedio por Mes
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1 tabular-nums">
                    {personalS21Summary.card.avgHoursPerMonth} h
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 block">
                    Promedio en meses activos
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                    Meses Informados
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                    {personalS21Summary.card.totalMonthsActive}{' '}
                    <span className="text-xs font-bold text-zinc-400">de 12</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 block">
                    Septiembre a Agosto
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                    Faltan para la Meta
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1 tabular-nums">
                    {personalS21Summary.remainingAnnualHours === 0
                      ? '¡Lograda! 🎉'
                      : `${personalS21Summary.remainingAnnualHours} h`}
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 block">
                    {personalS21Summary.card.totalBibleStudies} estudios acumulados
                  </span>
                </div>
              </div>

              {/* Barra de Progreso Anual */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-zinc-600 dark:text-[#D4D4D8]">
                    Avance acumulado del año de servicio {selectedServiceYear}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {personalS21Summary.card.totalHours} h completadas ({personalS21Summary.progressPct}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-[#18181F] overflow-hidden p-0.5 border border-zinc-200/60 dark:border-[#27272A]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${personalS21Summary.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. PANEL DIVIDIDO: MIS 12 MESES DEL AÑO (IZQUIERDA) + DETALLE Y ENVÍO DEL MES SELECCIONADO (DERECHA) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* IZQUIERDA (7 cols): LISTA INTERACTIVA DE LOS 12 MESES */}
            {personalS21Summary && (
              <div className="lg:col-span-7 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-[#27272A]">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                      Mis 12 Meses ({selectedServiceYear})
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                      Toca cualquier mes para ver o editar tus horas, cursos bíblicos y notas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {personalS21Summary.card.months.map((m) => {
                    const isSelected = m.monthKey === selectedReportMonth;
                    const monthlyTarget = Math.max(10, Math.round(personalS21Summary.annualGoalHours / 12));
                    const mHours = m.hours ?? 0;
                    const monthPct = Math.min(100, Math.round((mHours / monthlyTarget) * 100));

                    return (
                      <button
                        key={m.monthKey}
                        type="button"
                        onClick={() => setSelectedReportMonth(m.monthKey)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-white dark:bg-[#121216] border-zinc-200/80 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#27272A]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                                {m.monthName}
                              </span>
                              <span className="text-[11px] font-semibold text-zinc-400">
                                {m.monthKey.slice(0, 4)}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-600 text-white">
                                  Editando
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-1">
                              {m.participated ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 size={12} /> Participó
                                </span>
                              ) : m.hasReport ? (
                                <span className="text-[10px] font-bold text-rose-500">
                                  Sin actividad
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-zinc-400">
                                  Pendiente
                                </span>
                              )}
                              {m.isAuxiliaryPioneer && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                                  Auxiliar
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right tabular-nums shrink-0">
                            <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                              {m.hours !== undefined ? `${m.hours} h` : '0 h'}
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-500 dark:text-[#A1A1AA] block">
                              {m.bibleStudies ? `${m.bibleStudies} est.` : '0 est.'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-[#18181F] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                monthPct >= 100
                                  ? 'bg-emerald-500'
                                  : m.participated
                                  ? 'bg-indigo-500'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                              style={{ width: `${m.participated ? Math.max(6, monthPct) : 0}%` }}
                            />
                          </div>
                          {m.notes && (
                            <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                              {m.notes}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DERECHA (5 cols): REGISTRO Y ENVÍO DEL MES SELECCIONADO */}
            <div className="lg:col-span-5 bg-white dark:bg-[#121216] p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-4 lg:sticky lg:top-20">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Detalle y Cierre del Mes
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-0.5 capitalize">
                    {formatSpanishMonthLabel(selectedReportMonth)}
                  </h4>
                </div>

                <div>
                  <input
                    type="month"
                    value={selectedReportMonth}
                    onChange={(e) => setSelectedReportMonth(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white cursor-pointer"
                  />
                </div>
              </div>

              {reportSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{reportSuccessMsg}</span>
                </div>
              )}

              {/* Acceso directo al Cronómetro */}
              <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      Cronómetro de Ministerio
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                      Registra tus salidas en vivo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = 'cronometro_ministerio';
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('kongre_open_preaching_timer'));
                    }, 40);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all cursor-pointer shrink-0"
                >
                  Abrir
                </button>
              </div>

              {/* 1. Participación */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200 dark:border-[#27272A]">
                <SplashCheckbox
                  checked={reportForm.participated}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, participated: e.target.checked })
                  }
                  label="Participé en la predicación este mes"
                  description="Marca si participaste en alguna faceta del ministerio."
                />
              </div>

              {/* 2. Horas y Cursos Bíblicos en cuadrícula de 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200 dark:border-[#27272A] space-y-2">
                  <span className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] block">
                    Horas del Mes
                  </span>
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          hours: Math.max(0, reportForm.hours - 1),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-black hover:bg-zinc-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={250}
                      value={reportForm.hours}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          hours: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-14 text-center text-lg font-black py-0.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          hours: reportForm.hours + 1,
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-black hover:bg-zinc-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200 dark:border-[#27272A] space-y-2">
                  <span className="text-xs font-bold text-zinc-800 dark:text-[#E4E4E7] block">
                    Cursos Bíblicos
                  </span>
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          bibleStudies: Math.max(0, reportForm.bibleStudies - 1),
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-black hover:bg-zinc-100 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={reportForm.bibleStudies}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          bibleStudies: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-14 text-center text-lg font-black py-0.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          bibleStudies: reportForm.bibleStudies + 1,
                        })
                      }
                      className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-black hover:bg-zinc-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Notas */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] block">
                  Notas o comentarios del mes (opcional)
                </label>
                <textarea
                  rows={2}
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  placeholder="Ej. Precursor auxiliar este mes (15h o 30h)..."
                  className="w-full text-xs p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] focus:outline-hidden text-zinc-900 dark:text-white placeholder:text-zinc-400"
                />
              </div>

              {/* 4. Botones de Acción */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveMonthlyReport}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={16} />
                  <span>Guardar Mes en mi Historial</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareReportWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                >
                  <Share2 size={14} />
                  <span>Enviar copia por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 3: MIS AUSENCIAS PLANIFICADAS */}
      {activeModule === 'ausencias' && (
        <div className="w-full space-y-4">
          <div className="bg-white dark:bg-[#121216] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-[#27272A]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                  DISPONIBILIDAD TEOCRÁTICA
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                  Mis Ausencias Planificadas
                </h3>
                <p className="text-xs text-zinc-500">
                  Notifica con antelación viajes, vacaciones o convalecencias para no ser asignado en reuniones.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddAbsenceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Notificar Ausencia</span>
              </button>
            </div>

            {/* Listado de ausencias */}
            {(!selectedPublisher?.ausencias || selectedPublisher.ausencias.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-200/80 dark:border-[#27272A] space-y-2">
                <Plane className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto" />
                <p className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                  No tienes ausencias registradas actualmente
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  Estás marcado como disponible para asignaciones de entre semana y fin de semana.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedPublisher.ausencias.map((abs) => (
                  <div
                    key={abs.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          📅 {abs.start_date} al {abs.end_date}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold">
                          Ausente
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{abs.reason || 'Sin motivo especificado'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAbsence(abs.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Eliminar ausencia"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MÓDULO 4: MI GRUPO DE SERVICIO */}
      {activeModule === 'grupo' && (
        <div className="w-full space-y-4">
          <div className="bg-white dark:bg-[#121216] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-[#27272A] shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                MINISTERIO DEL CAMPO
              </span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                {myPreachingGroup ? `Grupo de Servicio #${myPreachingGroup.number}: ${myPreachingGroup.name}` : 'Mi Grupo de Predicación'}
              </h3>
              <p className="text-xs text-zinc-500">
                Información de contacto de los encargados de tu grupo y compañeros de servicio.
              </p>
            </div>

            {myPreachingGroup ? (
              <div className="space-y-4">
                {/* Encargados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Superintendente */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                      Superintendente de Grupo
                    </span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {groupOverseer?.name || 'No asignado'}
                    </p>
                    {groupOverseer?.phone && (
                      <p className="text-xs text-zinc-600 dark:text-[#D4D4D8]">
                        📞 {groupOverseer.phone}
                      </p>
                    )}
                    {groupOverseer?.phone && (
                      <a
                        href={`https://wa.me/${groupOverseer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                      >
                        <MessageCircle size={14} />
                        <span>Escribir por WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Auxiliar */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-200 dark:border-[#27272A] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-[#A1A1AA]">
                      Auxiliar de Grupo
                    </span>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {groupAssistant?.name || 'No asignado'}
                    </p>
                    {groupAssistant?.phone && (
                      <p className="text-xs text-zinc-600 dark:text-[#D4D4D8]">
                        📞 {groupAssistant.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Integrantes del grupo */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Integrantes del Grupo ({myPreachingGroup.memberIds.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {myPreachingGroup.memberIds.map((mId) => {
                      const pub = publishersMap.get(mId);
                      if (!pub) return null;
                      const isMe = pub.id === selectedPublisherId;

                      return (
                        <div
                          key={pub.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            isMe
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 font-bold text-purple-900 dark:text-purple-200'
                              : 'bg-white dark:bg-[#18181F] border-zinc-100 dark:border-[#27272A] text-zinc-700 dark:text-[#D4D4D8]'
                          }`}
                        >
                          <span className="truncate">{pub.name}</span>
                          {isMe && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 shrink-0">
                              Tú
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-[#18181F]/40 border border-zinc-200 space-y-2">
                <Users className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                  Aún no estás asignado a un grupo de servicio
                </p>
                <p className="text-[11px] text-zinc-500">
                  Consulta al superintendente de servicio para tu asignación de grupo.
                </p>
              </div>
            )}

            {/* Salidas de Predicación del Grupo y Congregación */}
            {fieldServiceMeetings.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-[#27272A] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    🧭 Programa de Salidas al Servicio del Campo
                  </h4>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    Tu grupo y salidas generales
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {fieldServiceMeetings
                    .filter(
                      (m) =>
                        !m.groupNumber ||
                        (myPreachingGroup && m.groupNumber === myPreachingGroup.number)
                    )
                    .slice(0, 8)
                    .map((fsm) => {
                      const cond = fsm.conductorId
                        ? publishersMap.get(fsm.conductorId)
                        : undefined;
                      return (
                        <div
                          key={fsm.id}
                          className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                              {fsm.dayOfWeek} {fsm.date ? `(${fsm.date})` : ''} • {fsm.time}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                              {fsm.groupNumber ? `Grupo ${fsm.groupNumber}` : 'General'}
                            </span>
                          </div>
                          <p className="text-zinc-700 dark:text-[#E4E4E7] font-semibold">
                            📍 {fsm.location}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            👤 Conductor: <strong>{cond?.name || 'Por asignar'}</strong>
                            {fsm.territoryNumber ? ` • 🗺 #${fsm.territoryNumber}` : ''}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MÓDULO 5: AVISOS Y LITERATURA */}
      {activeModule === 'avisos' && (
        <div className="space-y-4">
          {/* Tablero de anuncios */}
          {notices.length > 0 && (
            <div className="bg-white dark:bg-[#121216] rounded-3xl border border-zinc-200 dark:border-[#27272A] p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <span>Tablero Oficial de Anuncios</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-100 dark:border-[#27272A] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-zinc-900 dark:text-white text-xs">{n.title}</h4>
                      <span className="text-[10px] text-zinc-400">{n.date}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedidos especiales de literatura */}
          {specialOrders.filter((o) => o.publisherId === selectedPublisherId).length > 0 && (
            <div className="bg-white dark:bg-[#121216] rounded-3xl border border-zinc-200 dark:border-[#27272A] p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Mis Pedidos Especiales de Literatura</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specialOrders
                  .filter((o) => o.publisherId === selectedPublisherId)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs">
                          {order.itemTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Cantidad: {order.quantity} • Solicitado: {order.requestDate}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MÓDULO 6: SEGURIDAD Y VERIFICACIÓN EN DOS PASOS (2FA) */}
      {activeModule === 'seguridad_2fa' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#121216] rounded-3xl border border-zinc-200 dark:border-[#27272A] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-[#27272A]">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`p-3 rounded-2xl ${
                    isCurrentPublisher2FAEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                      Verificación en Dos Pasos (2FA)
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isCurrentPublisher2FAEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA]'
                      }`}
                    >
                      {isCurrentPublisher2FAEnabled ? '✓ Activada' : 'Desactivada'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
                    Compatible con <strong>Microsoft Authenticator</strong>, Google Authenticator y apps estándar (RFC 6238).
                  </p>
                </div>
              </div>

              {!isCurrentPublisher2FAEnabled ? (
                <button
                  type="button"
                  onClick={() => setShow2FASetupModal(true)}
                  className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Configurar Microsoft Authenticator</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShow2FASetupModal(true)}
                    className="py-2 px-3.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-700 dark:text-[#E4E4E7] text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Reconfigurar
                  </button>
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    disabled={is2FADisabling}
                    className="py-2 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {is2FADisabling ? 'Desactivando...' : 'Desactivar 2FA'}
                  </button>
                </div>
              )}
            </div>

            {/* Tarjetas de características y funcionamiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-100 dark:border-[#27272A] space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sin conexión requerida</span>
                </div>
                <p className="text-zinc-500 dark:text-[#A1A1AA] text-[11px] leading-relaxed">
                  Los códigos temporales de 6 dígitos se calculan con el reloj de tu teléfono. Funcionan incluso dentro del Salón del Reino sin señal móvil o en modo avión.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-100 dark:border-[#27272A] space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Solo en nuevos dispositivos</span>
                </div>
                <p className="text-zinc-500 dark:text-[#A1A1AA] text-[11px] leading-relaxed">
                  Puedes marcar «Recordar este dispositivo por 30 días» en tu teléfono habitual para no tener que escribir el código en cada reunión.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-100 dark:border-[#27272A] space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Códigos de respaldo</span>
                </div>
                <p className="text-zinc-500 dark:text-[#A1A1AA] text-[11px] leading-relaxed">
                  Al configurar 2FA recibes 8 códigos de respaldo de emergencia. Si alguna vez pierdes o cambias de teléfono, puedes utilizarlos para acceder sin quedarte fuera.
                </p>
              </div>
            </div>

            {isCurrentPublisher2FAEnabled && currentPinRecord?.twoFactorEnabledAt && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <span>🛡️ Tu cuenta está protegida activamente desde: <strong>{new Date(currentPinRecord.twoFactorEnabledAt).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>

          {/* HISTORIAL PRIVADO DE DISPOSITIVOS DEL PUBLICADOR */}
          <ProfileDevicesAndCodesSection
            targetPublisherId={selectedPublisherId}
            targetPublisherName={selectedPublisher?.name}
            isSupervisorPreviewingOther={Boolean(
              canSupervise &&
                showSupervisorSelect &&
                currentPublisherId &&
                selectedPublisherId !== currentPublisherId
            )}
          />
        </div>
      )}

      {/* MODAL: NOTIFICAR AUSENCIA */}
      {showAddAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Plane size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                  Notificar Próxima Ausencia
                </h4>
                <p className="text-xs text-zinc-500">
                  Informa las fechas en las que no estarás disponible.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                  Fecha de Inicio:
                </label>
                <input
                  type="date"
                  value={absenceStartDate}
                  onChange={(e) => setAbsenceStartDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                  Fecha de Término:
                </label>
                <input
                  type="date"
                  value={absenceEndDate}
                  onChange={(e) => setAbsenceEndDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8] mb-1">
                  Motivo:
                </label>
                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white focus:outline-hidden"
                >
                  <option value="Vacaciones familiares">Vacaciones familiares</option>
                  <option value="Viaje de trabajo">Viaje de trabajo</option>
                  <option value="Salud o convalecencia">Salud o convalecencia</option>
                  <option value="Compromiso familiar">Compromiso familiar</option>
                  <option value="Asamblea en otra congregación">Asamblea en otra congregación</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAbsenceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!absenceStartDate || !absenceEndDate}
                onClick={handleAddAbsence}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Guardar Ausencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NO PODRÉ ASISTIR / SOLICITAR SUSTITUTO */}
      {declineModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                  Solicitud de Sustituto
                </h4>
                <p className="text-xs text-zinc-500">
                  {declineModalState.assignment?.assignmentTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-[#D4D4D8] leading-relaxed">
              ¿Confirmas que no podrás atender esta parte el <strong>{declineModalState.assignment?.date}</strong>? Se notificará al coordinador y hermanos encargados del programa para coordinar un reemplazo.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700 dark:text-[#D4D4D8]">
                Motivo para los hermanos encargados (Opcional):
              </label>
              <textarea
                rows={2}
                value={declineModalState.reason}
                onChange={(e) =>
                  setDeclineModalState({
                    ...declineModalState,
                    reason: e.target.value,
                  })
                }
                placeholder="Ej. Fiebre, turno imprevisto de trabajo..."
                className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] focus:outline-hidden text-zinc-900 dark:text-white placeholder:text-zinc-400"
              />
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeclineModalState({ isOpen: false, assignment: null, reason: '' })
                }
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  if (declineModalState.assignment) {
                    handleUpdateStatus(
                      declineModalState.assignment.weekId,
                      declineModalState.assignment.meetingType,
                      declineModalState.assignment.assignmentPath,
                      'rechazada'
                    );
                  }
                  setDeclineModalState({ isOpen: false, assignment: null, reason: '' });
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Confirmar que no podré
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUSCRIPCIÓN Y GESTIÓN DE NOTIFICACIONES PUSH EN SEGUNDO PLANO */}
      <PushSubscriptionModal
        isOpen={isPushModalOpen}
        onClose={() => {
          setIsPushModalOpen(false);
          setNotifPermission(getNotificationPermission());
          setPushSubscription(getPushSubscriptionRecord());
        }}
        publisherId={selectedPublisher?.id || currentPublisherId || 'publicador'}
        publisherName={selectedPublisher?.name || currentBrotherName || 'Publicador'}
        congregationName={settings.congregationName}
        weeks={weeks}
        cartShifts={cartShifts}
        cartLocations={cartLocations}
        settings={settings}
        publishersMap={publishersMap}
        onSubscriptionChange={(sub) => {
          setPushSubscription(sub);
          setNotifPermission(getNotificationPermission());
        }}
      />

      {/* MODAL: CONFIGURAR 2FA CON MICROSOFT AUTHENTICATOR */}
      <TwoFactorSetupModal
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        publisherId={selectedPublisher?.id || currentPublisherId || ''}
        publisherName={selectedPublisher?.name || currentBrotherName || 'Publicador'}
        onSuccess={async (secret, backupCodes) => {
          const targetId = selectedPublisher?.id || currentPublisherId || '';
          if (!targetId) return false;
          const res = await enableTwoFactorForPublisher(targetId, secret, backupCodes);
          return res.success;
        }}
      />

      {/* MODAL: SOLICITAR CÓDIGO 2FA AL INICIAR SESIÓN */}
      <TwoFactorPromptModal
        isOpen={show2FAPromptModal}
        onClose={() => {
          setShow2FAPromptModal(false);
          setPending2FAPublisher(null);
        }}
        publisherName={pending2FAPublisher?.name || 'Publicador'}
        onVerifyCode={async (code, trustDevice) => {
          if (!pending2FAPublisher?.id) return { success: false, message: 'Identidad no encontrada' };
          return await verifyTwoFactorForPublisher(pending2FAPublisher.id, code, trustDevice);
        }}
        onSuccess={() => {
          setShow2FAPromptModal(false);
          if (pending2FAPublisher?.id) {
            setSelectedPublisherId(pending2FAPublisher.id);
            setIdentifiedPublisher(pending2FAPublisher.id, pending2FAPublisher.name);
          }
          setPending2FAPublisher(null);
          setEnteredPin('');
          setLockoutSeconds(0);
        }}
      />

      {/* MODAL EXCLUSIVO: SOLICITUD DE CAMBIO DE PIN A LOS ANCIANOS */}
      <PinManagementModal
        isOpen={isPinRequestModalOpen}
        onClose={() => setIsPinRequestModalOpen(false)}
        publisherId={selectedPublisher?.id || currentPublisherId || 'publicador'}
        publisherName={selectedPublisher?.name || currentBrotherName || 'Publicador'}
        role={effectiveRoleInfo?.id}
      />
    </div>
  );
};
