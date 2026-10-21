// src/components/PersonalViewTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { AssignmentStatus, MonthlyServiceReport, PublisherAbsence } from '../types';
import { generateGoogleCalendarUrl, downloadSingleIcsEvent } from '../utils/calendarExport';
import { SplashCheckbox } from './SplashCheckbox';
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

export type PublisherPortalTab = 'asignaciones' | 'informe' | 'ausencias' | 'grupo' | 'avisos';
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

  // PIN login state when not authenticated
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showSupervisorSelect, setShowSupervisorSelect] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

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
    if (!enteredPin || enteredPin.length < 4) {
      setPinError('Introduce tu PIN de 4 dígitos asignado.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    try {
      const res = await identifyRoleByPersonalPin(enteredPin);
      if (res.success) {
        localStorage.setItem('kongre_session_pin_v2', enteredPin.trim());
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
      } else {
        setPinError(res.message || 'PIN Personal no reconocido.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Error al validar el PIN.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Exit / switch publisher
  const handleExitPortal = () => {
    setIdentifiedPublisher(null);
    localStorage.removeItem('kongre_session_pin_v2');
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

  // Extract all future assignments for this publisher
  const myAssignments = useMemo(() => {
    if (!selectedPublisherId) return [];

    const list: Array<{
      id: string;
      weekId: string;
      date: string;
      meetingType: 'midweek' | 'weekend';
      meetingName: string;
      assignmentTitle: string;
      roleKey: string;
      assignmentPath: string;
      room?: 'principal' | 'auxiliar';
      assistantName?: string;
      timeMinutes?: number;
      status: AssignmentStatus;
    }> = [];

    const pid = selectedPublisherId;

    weeks.forEach((w) => {
      // Midweek
      if (!w.specialEvent?.noMeetingMidweek) {
        // President
        if (w.midweek.presidentId === pid) {
          list.push({
            id: `mid-pres-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Presidente de la reunión',
            roleKey: 'vym_presidente',
            assignmentPath: 'presidentId',
            status: 'confirmada',
          });
        }
        // Auxiliary Counselor
        if (w.midweek.auxiliaryCounselorId === pid) {
          list.push({
            id: `mid-auxc-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Consejero de la Sala Auxiliar',
            roleKey: 'vym_consejero_aux',
            assignmentPath: 'auxiliaryCounselorId',
            room: 'auxiliar',
            status: 'confirmada',
          });
        }
        // Initial Prayer
        if (w.midweek.initialPrayerId === pid) {
          list.push({
            id: `mid-inip-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Oración de apertura',
            roleKey: 'vym_oracion_inicial',
            assignmentPath: 'initialPrayerId',
            status: 'confirmada',
          });
        }
        // Final Prayer
        if (w.midweek.finalPrayerId === pid) {
          list.push({
            id: `mid-finp-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Oración final',
            roleKey: 'vym_oracion_final',
            assignmentPath: 'finalPrayerId',
            status: 'confirmada',
          });
        }
        // Treasures Talk
        if (w.midweek.tesoros.discurso.publisherId === pid) {
          list.push({
            id: `tes-disc-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: `Discurso: ${w.midweek.tesoros.discurso.title}`,
            roleKey: 'vym_tesoros_discurso',
            assignmentPath: 'tesoros.discurso',
            timeMinutes: 10,
            status: w.midweek.tesoros.discurso.status,
          });
        }
        // Treasures Gems
        if (w.midweek.tesoros.perlas.publisherId === pid) {
          list.push({
            id: `tes-perl-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Busquemos perlas escondidas',
            roleKey: 'vym_tesoros_perlas',
            assignmentPath: 'tesoros.perlas',
            timeMinutes: 10,
            status: w.midweek.tesoros.perlas.status,
          });
        }
        // Bible Reading Main
        if (w.midweek.tesoros.lecturaBiblia.publisherId === pid) {
          list.push({
            id: `tes-lect-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Lectura de la Biblia (Sala Principal)',
            roleKey: 'vym_tesoros_lectura',
            assignmentPath: 'tesoros.lecturaBiblia',
            room: 'principal',
            timeMinutes: 4,
            status: w.midweek.tesoros.lecturaBiblia.status,
          });
        }
        // Bible Reading Aux
        if (w.midweek.tesoros.lecturaBibliaAux?.publisherId === pid) {
          list.push({
            id: `tes-lectaux-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Lectura de la Biblia (Sala Auxiliar)',
            roleKey: 'vym_tesoros_lectura',
            assignmentPath: 'tesoros.lecturaBibliaAux',
            room: 'auxiliar',
            timeMinutes: 4,
            status: w.midweek.tesoros.lecturaBibliaAux.status,
          });
        }

        // Apply Yourself (Seamos mejores maestros)
        w.midweek.maestros.items.forEach((item, idx) => {
          if (item.publisherId === pid) {
            const assistant = item.assistantId ? publishersMap.get(item.assistantId)?.name : undefined;
            list.push({
              id: `maes-tit-${item.id}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Titular en: ${item.title}`,
              roleKey: 'vym_maestros_titular',
              assignmentPath: `maestros.${idx}`,
              room: item.room,
              assistantName: assistant ? `Ayudante: ${assistant}` : undefined,
              timeMinutes: item.timeMinutes,
              status: item.status,
            });
          }
          if (item.assistantId === pid) {
            const titularName = item.publisherId ? publishersMap.get(item.publisherId)?.name : 'Titular';
            list.push({
              id: `maes-asst-${item.id}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Ayudante en: ${item.title}`,
              roleKey: 'vym_maestros_ayudante',
              assignmentPath: `maestros_helper.${idx}`,
              room: item.room,
              assistantName: `Titular: ${titularName}`,
              timeMinutes: item.timeMinutes,
              status: item.status,
            });
          }
        });

        // Living as Christians
        w.midweek.vidaCristiana.items.forEach((item, idx) => {
          if (item.publisherId === pid) {
            list.push({
              id: `vida-${item.id}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Nuestra Vida Cristiana: ${item.title}`,
              roleKey: 'vym_vida_partes',
              assignmentPath: `vida.${idx}`,
              timeMinutes: item.timeMinutes,
              status: item.status,
            });
          }
        });

        // Congregation Bible Study Conductor & Reader
        if (w.midweek.vidaCristiana.estudioBiblico.conductorId === pid) {
          list.push({
            id: `cbs-cond-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Conductor del Estudio Bíblico de Congregación',
            roleKey: 'vym_estudio_conductor',
            assignmentPath: 'vidaCristiana.estudioBiblico.conductorId',
            timeMinutes: 30,
            status: 'confirmada',
          });
        }
        if (w.midweek.vidaCristiana.estudioBiblico.lectorId === pid) {
          list.push({
            id: `cbs-lect-${w.id}`,
            weekId: w.id,
            date: w.midweek.date,
            meetingType: 'midweek',
            meetingName: 'Vida y Ministerio Cristianos',
            assignmentTitle: 'Lector del Estudio Bíblico de Congregación',
            roleKey: 'vym_estudio_lector',
            assignmentPath: 'vidaCristiana.estudioBiblico.lectorId',
            timeMinutes: 30,
            status: 'confirmada',
          });
        }

        // Midweek Duties
        Object.entries(w.midweek.duties).forEach(([dKey, ids]) => {
          if (ids.includes(pid)) {
            list.push({
              id: `duty-mid-${w.id}-${dKey}`,
              weekId: w.id,
              date: w.midweek.date,
              meetingType: 'midweek',
              meetingName: 'Vida y Ministerio Cristianos',
              assignmentTitle: `Deber: ${dKey.replace('deber_', '').toUpperCase()}`,
              roleKey: dKey,
              assignmentPath: `midweek_duty_${dKey}`,
              status: 'confirmada',
            });
          }
        });
      }

      // Weekend
      if (!w.specialEvent?.noMeetingWeekend) {
        if (w.weekend.presidentId === pid) {
          list.push({
            id: `fds-pres-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Presidente de la reunión',
            roleKey: 'fds_presidente',
            assignmentPath: 'presidentId',
            status: 'confirmada',
          });
        }
        if (w.weekend.atalayaConductorId === pid) {
          list.push({
            id: `fds-cond-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Conductor del Estudio de La Atalaya',
            roleKey: 'fds_atalaya_conductor',
            assignmentPath: 'atalayaConductorId',
            timeMinutes: 60,
            status: 'confirmada',
          });
        }
        if (w.weekend.atalayaLectorId === pid) {
          list.push({
            id: `fds-lect-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Lector de La Atalaya',
            roleKey: 'fds_atalaya_lector',
            assignmentPath: 'atalayaLectorId',
            timeMinutes: 60,
            status: 'confirmada',
          });
        }
        if (w.weekend.finalPrayerId === pid) {
          list.push({
            id: `fds-finp-${w.id}`,
            weekId: w.id,
            date: w.weekend.date,
            meetingType: 'weekend',
            meetingName: 'Reunión del Fin de Semana',
            assignmentTitle: 'Oración final (Fin de semana)',
            roleKey: 'fds_oracion',
            assignmentPath: 'finalPrayerId',
            status: 'confirmada',
          });
        }

        // Weekend Duties
        Object.entries(w.weekend.duties).forEach(([dKey, ids]) => {
          if (ids.includes(pid)) {
            list.push({
              id: `duty-fds-${w.id}-${dKey}`,
              weekId: w.id,
              date: w.weekend.date,
              meetingType: 'weekend',
              meetingName: 'Reunión del Fin de Semana',
              assignmentTitle: `Deber: ${dKey.replace('deber_', '').toUpperCase()}`,
              roleKey: dKey,
              assignmentPath: `weekend_duty_${dKey}`,
              status: 'confirmada',
            });
          }
        });
      }
    });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedPublisherId, weeks, publishersMap]);

  // Handle assignment status confirmation
  const handleUpdateStatus = (
    weekId: string,
    meetingType: 'midweek' | 'weekend',
    assignmentPath: string,
    newStatus: AssignmentStatus
  ) => {
    if (!selectedPublisherId) return;
    replaceAssignment(weekId, meetingType, assignmentPath, selectedPublisherId, newStatus);
  };

  // Copy assignment text
  const copyAssignmentDetails = (item: any) => {
    const text =
      `Asignación teocrática:\n` +
      `📅 Fecha: ${item.date}\n` +
      `🏛 Reunión: ${item.meetingName}\n` +
      `📌 Tarea: ${item.assignmentTitle}` +
      (item.room ? `\nSala: ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}` : '') +
      (item.assistantName ? `\n${item.assistantName}` : '');

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Google Calendar URL generator
  const getGoogleCalLink = (item: any) => {
    const time =
      item.meetingType === 'midweek'
        ? settings.midweekMeetingTime || '19:00'
        : settings.weekendMeetingTime || '10:00';
    const loc = settings.hallAddress || 'Salón del Reino de los Testigos de Jehová';
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
      item.meetingType === 'midweek'
        ? settings.midweekMeetingTime || '19:00'
        : settings.weekendMeetingTime || '10:00';
    const loc = settings.hallAddress || 'Salón del Reino de los Testigos de Jehová';
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
      `📅 *Fecha:* ${item.date}\n` +
      `📖 *Reunión:* ${item.meetingName}\n` +
      `📌 *Parte:* ${item.assignmentTitle}` +
      (item.room ? `\n🏛 *Sala:* ${item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}` : '') +
      (item.assistantName ? `\n👥 ${item.assistantName}` : '') +
      `\n\n_Portal del Publicador Kongre_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 1. PIN LOGIN SCREEN (If not authenticated as publisher and not supervisor)
  if (!isAuthenticatedPublisher) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 sm:py-14 px-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
          {/* Logo / Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <KeyRound size={32} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-200/60 dark:border-purple-800/60">
              PORTAL DEL PUBLICADOR • KONGRE
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-1">
              Bienvenido a tu Portal Teocrático
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Introduce tu PIN Personal único de 4 dígitos para consultar tus partes, enviar tu informe de servicio y reportar ausencias.
            </p>
          </div>

          {/* Formulario de PIN */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                PIN Personal del Publicador
              </label>
              <div className="relative max-w-xs mx-auto">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••"
                  value={enteredPin}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setEnteredPin(clean);
                    setPinError(null);
                  }}
                  className="w-full text-center text-3xl font-mono tracking-widest py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-600 dark:focus:border-purple-500 focus:outline-hidden text-slate-900 dark:text-white transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-in fade-in">
                  <AlertCircle size={14} />
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
                  onClick={() => {
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
                  className={`py-3 rounded-xl font-bold text-base transition-all cursor-pointer ${
                    k === '✓'
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                      : k === 'C'
                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifyingPin || enteredPin.length < 4}
              className="w-full max-w-xs mx-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifyingPin ? (
                <span>Validando credencial...</span>
              ) : (
                <>
                  <span>Ingresar a Mi Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Ayuda */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2 text-center">
            <p className="italic">
              ¿No tienes tu PIN o lo extraviaste? Solicita a los ancianos tu <strong>papeleta de credenciales</strong> o nuevo enlace de acceso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. PORTAL PRINCIPAL DEL PUBLICADOR
  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* 2.1 BARRA SUPERIOR DE IDENTIDAD DEL PUBLICADOR (HEADER) */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {selectedPublisher?.name ? selectedPublisher.name[0].toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-200/60 dark:border-purple-800/60">
                Portal del Publicador
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                <CheckCircle2 size={10} /> PIN Verificado
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {selectedPublisher?.name || 'Publicador'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Congregación: <strong className="text-slate-700 dark:text-slate-300">{settings.congregationName || 'Central'}</strong>
              {myPreachingGroup && ` • Grupo ${myPreachingGroup.number}`}
            </p>
          </div>
        </div>

        {/* Acciones de la barra superior */}
        <div className="flex items-center gap-2 flex-wrap">
          {canSupervise && (
            <button
              type="button"
              onClick={() => setShowSupervisorSelect(!showSupervisorSelect)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
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
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {notifPermission === 'denied'
                      ? 'Permiso bloqueado en navegador'
                      : 'Funciona incluso con la app cerrada'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Recibe recordatorios automáticos de tus asignaciones sin abrir la app
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
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
                className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-all cursor-pointer"
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
            className="w-full text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-indigo-200 dark:border-indigo-800 focus:outline-hidden"
          >
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.active ? '' : '(Inactivo)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 2.2 PESTAÑAS PRINCIPALES DEL PORTAL */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto scrollbar-none border border-slate-200/80 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => setActiveModule('asignaciones')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeModule === 'asignaciones'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar size={16} />
          <span>Mis Asignaciones</span>
          {myAssignments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
              {myAssignments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('informe')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeModule === 'informe'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText size={16} />
          <span>Mi Informe (S-4)</span>
          {existingReport && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Informe del mes registrado" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('ausencias')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeModule === 'ausencias'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Plane size={16} />
          <span>Mis Ausencias</span>
          {(selectedPublisher?.ausencias || []).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              {(selectedPublisher?.ausencias || []).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('grupo')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeModule === 'grupo'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users size={16} />
          <span>Mi Grupo de Servicio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('avisos')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeModule === 'avisos'
              ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell size={16} />
          <span>Avisos & Literatura</span>
          {notices.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              {notices.length}
            </span>
          )}
        </button>
      </div>

      {/* 2.3 CONTENIDO DEL MÓDULO SELECCIONADO */}

      {/* MÓDULO 1: MIS ASIGNACIONES */}
      {activeModule === 'asignaciones' && (
        <div className="space-y-4">
          {myAssignments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No tienes asignaciones pendientes en el programa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Todas las semanas registradas están al día y no figuran tareas asignadas para tu perfil.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {myAssignments.length} {myAssignments.length === 1 ? 'asignación programada' : 'asignaciones programadas'}
                </p>
                <span className="text-[11px] text-slate-400">
                  Haz clic en Google Calendar o WhatsApp para sincronizar o avisar
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                {myAssignments.map((item) => {
                  const isConfirmed = item.status === 'confirmada';
                  const isRejected = item.status === 'rechazada';

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 sm:gap-4"
                    >
                      <div className="space-y-2">
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 px-2.5 py-1 rounded-xl border border-purple-100 dark:border-purple-800/60">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.date}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            {item.meetingName}
                          </span>
                          {item.room && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {item.room === 'auxiliar' ? 'Sala Auxiliar' : 'Sala Principal'}
                            </span>
                          )}
                        </div>

                        {/* Título de la parte */}
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {item.assignmentTitle}
                          </h4>
                          {item.assistantName && (
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1 flex items-center gap-1">
                              <Users size={12} />
                              <span>{item.assistantName}</span>
                            </p>
                          )}
                          {item.timeMinutes && (
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock size={12} />
                              <span>Tiempo estimado: {item.timeMinutes} minutos</span>
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
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                        {/* Confirmar / Rechazar */}
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
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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
                                : 'bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400'
                            }`}
                          >
                            <XCircle size={12} />
                            <span>No podré</span>
                          </button>
                        </div>

                        {/* Exportar / Compartir */}
                        <div className="flex items-center gap-1">
                          <a
                            href={getGoogleCalLink(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
                            title="Añadir a Google Calendar"
                          >
                            <Calendar size={14} />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
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
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
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

      {/* MÓDULO 2: MI INFORME MENSUAL (S-4) */}
      {activeModule === 'informe' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            {/* Header del informe */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
                  FORMULARIO S-4
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Informe del Ministerio del Campo
                </h3>
                <p className="text-xs text-slate-500">
                  Envía mensualmente tu informe a la secretaría y superintendente de grupo.
                </p>
              </div>

              {/* Selector de Mes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Mes de servicio:
                </label>
                <input
                  type="month"
                  value={selectedReportMonth}
                  onChange={(e) => setSelectedReportMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                />
              </div>
            </div>

            {/* Mensaje de éxito */}
            {reportSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{reportSuccessMsg}</span>
              </div>
            )}

            {/* Estado de envío */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    existingReport ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {existingReport
                    ? `Informe de ${selectedReportMonth} Registrado`
                    : `Informe de ${selectedReportMonth} Pendiente de Envío`}
                </span>
              </div>
              {existingReport?.reportedAt && (
                <span className="text-[10px] text-slate-400">
                  Actualizado: {new Date(existingReport.reportedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Campos del Formulario S-4 */}
            <div className="space-y-5">
              {/* 1. Casilla de Participación */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <SplashCheckbox
                  checked={reportForm.participated}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, participated: e.target.checked })
                  }
                  label="He participado en el ministerio durante este mes"
                  description="Requisito de participación activa en el ministerio para publicadores de congregación."
                />
              </div>

              {/* 2. Horas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                      Horas dedicadas al ministerio
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Obligatorio para precursores auxiliares (15/30 hrs) y regulares (50 hrs).
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          hours: Math.max(0, reportForm.hours - 1),
                        })
                      }
                      className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base hover:bg-slate-300 transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={reportForm.hours}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          hours: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-16 text-center text-lg font-bold py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          hours: reportForm.hours + 1,
                        })
                      }
                      className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base hover:bg-slate-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Cursos Bíblicos */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                      Cursos bíblicos diferentes dirigidos
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Número de personas diferentes con las que estudiaste la Biblia este mes.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          bibleStudies: Math.max(0, reportForm.bibleStudies - 1),
                        })
                      }
                      className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base hover:bg-slate-300 transition-colors"
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
                      className="w-16 text-center text-lg font-bold py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm({
                          ...reportForm,
                          bibleStudies: reportForm.bibleStudies + 1,
                        })
                      }
                      className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base hover:bg-slate-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Notas / Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  placeholder="Ej. Precursor auxiliar este mes con meta de 15 horas, crédito LDC..."
                  className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Acciones de envío */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleShareReportWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <Share2 size={14} />
                <span>Enviar copia por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMonthlyReport}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-purple-600/30"
              >
                <Send size={14} />
                <span>Guardar y Transmitir Informe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 3: MIS AUSENCIAS PLANIFICADAS */}
      {activeModule === 'ausencias' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                  DISPONIBILIDAD TEOCRÁTICA
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Mis Ausencias Planificadas
                </h3>
                <p className="text-xs text-slate-500">
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
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <Plane className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No tienes ausencias registradas actualmente
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Estás marcado como disponible para asignaciones de entre semana y fin de semana.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedPublisher.ausencias.map((abs) => (
                  <div
                    key={abs.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          📅 {abs.start_date} al {abs.end_date}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold">
                          Ausente
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{abs.reason || 'Sin motivo especificado'}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAbsence(abs.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                MINISTERIO DEL CAMPO
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {myPreachingGroup ? `Grupo de Servicio #${myPreachingGroup.number}: ${myPreachingGroup.name}` : 'Mi Grupo de Predicación'}
              </h3>
              <p className="text-xs text-slate-500">
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
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {groupOverseer?.name || 'No asignado'}
                    </p>
                    {groupOverseer?.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
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
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      Auxiliar de Grupo
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {groupAssistant?.name || 'No asignado'}
                    </p>
                    {groupAssistant?.phone && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        📞 {groupAssistant.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Integrantes del grupo */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                              : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
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
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Aún no estás asignado a un grupo de servicio
                </p>
                <p className="text-[11px] text-slate-500">
                  Consulta al superintendente de servicio para tu asignación de grupo.
                </p>
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <span>Tablero Oficial de Anuncios</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">{n.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedidos especiales de literatura */}
          {specialOrders.filter((o) => o.publisherId === selectedPublisherId).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>Mis Pedidos Especiales de Literatura</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specialOrders
                  .filter((o) => o.publisherId === selectedPublisherId)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {order.itemTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Cantidad: {order.quantity} • Solicitado: {order.requestDate}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NOTIFICAR AUSENCIA */}
      {showAddAbsenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Plane size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Notificar Próxima Ausencia
                </h4>
                <p className="text-xs text-slate-500">
                  Informa las fechas en las que no estarás disponible.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Inicio:
                </label>
                <input
                  type="date"
                  value={absenceStartDate}
                  onChange={(e) => setAbsenceStartDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Término:
                </label>
                <input
                  type="date"
                  value={absenceEndDate}
                  onChange={(e) => setAbsenceEndDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo:
                </label>
                <select
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
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

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAbsenceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Solicitud de Sustituto
                </h4>
                <p className="text-xs text-slate-500">
                  {declineModalState.assignment?.assignmentTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Confirmas que no podrás atender esta parte el <strong>{declineModalState.assignment?.date}</strong>? Se notificará al coordinador y hermanos encargados del programa para coordinar un reemplazo.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
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
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeclineModalState({ isOpen: false, assignment: null, reason: '' })
                }
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
    </div>
  );
};
