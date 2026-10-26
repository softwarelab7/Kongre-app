// src/components/PanoramaGeneralTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import {
  Plus,
  Check,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  FileText,
  Building2,
  Wine,
  ChevronRight,
  UserCheck,
  Calendar,
  BarChart3,
  X,
  Clock,
  Users,
  Mic,
  Map,
  Briefcase,
  Compass,
  Pin,
  AlertCircle,
  ArrowUpRight,
  Presentation,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import type { MinistryTimeLog, ReturnVisitRecord, BibleStudyRecord } from './MinisterioPublicadorTab';

interface PanoramaGeneralTabProps {
  setActiveTab: (tab: ActiveTab) => void;
}

const STORAGE_KEY_LOGS = 'kongre_ministry_time_logs_v1';
const STORAGE_KEY_RV = 'kongre_ministry_return_visits_v1';
const STORAGE_KEY_STUDIES = 'kongre_ministry_bible_studies_v1';

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatShortDateRange(startISO?: string, endISO?: string): string {
  if (!startISO) return '';
  const parseISO = (iso: string) => {
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  };
  const s = parseISO(startISO);
  if (!s) return startISO;
  const sMonth = SPANISH_MONTHS[s.month] || '';
  if (!endISO || endISO === startISO) {
    return `${s.day} de ${sMonth} de ${s.year}`;
  }
  const e = parseISO(endISO);
  if (!e) return `${s.day} de ${sMonth} de ${s.year}`;
  const eMonth = SPANISH_MONTHS[e.month] || '';
  if (s.month === e.month && s.year === e.year) {
    return `${s.day}-${e.day} de ${sMonth} de ${s.year}`;
  }
  return `${s.day} de ${sMonth} - ${e.day} de ${eMonth} de ${e.year}`;
}

export const PanoramaGeneralTab: React.FC<PanoramaGeneralTabProps> = ({ setActiveTab }) => {
  const {
    weeks,
    currentWeek,
    publishers,
    publishersMap,
    notices,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
    congregationEvents,
    preachingGroups,
    customDuties,
    monthlyReports,
    updateMonthlyReport,
    territories,
    cartShifts,
    cartLocations,
    fieldServiceMeetings,
    settings,
    isDemoMode,
  } = useCongregation();

  const { currentPublisherId, currentBrotherName, effectiveRoleInfo } = useAuth();

  // Identify current publisher (matching MinisterioPublicadorTab cross-device resolution)
  const activePublisher = useMemo(() => {
    if (currentPublisherId && publishersMap.has(currentPublisherId)) {
      return publishersMap.get(currentPublisherId) || null;
    }
    const saved = localStorage.getItem('kongre_current_publisher_id_v2');
    if (saved && publishersMap.has(saved)) return publishersMap.get(saved) || null;
    if (currentBrotherName) {
      const match = publishers.find(
        (p) => p.name.toLowerCase().trim() === currentBrotherName.toLowerCase().trim()
      );
      if (match) return match;
    }
    if (settings.coordinatorName || settings.coordinatorEmail || settings.coordinatorPhone) {
      const coordName = (settings.coordinatorName || '').toLowerCase().trim();
      const coordEmail = (settings.coordinatorEmail || '').toLowerCase().trim();
      const coordPhone = (settings.coordinatorPhone || '').replace(/\D/g, '');
      const coordMatch = publishers.find((p) => {
        if (coordName && p.name.toLowerCase().trim() === coordName) return true;
        if (coordEmail && p.email && p.email.toLowerCase().trim() === coordEmail) return true;
        if (coordPhone && coordPhone.length >= 7 && p.phone && p.phone.replace(/\D/g, '').endsWith(coordPhone.slice(-7))) return true;
        return false;
      });
      if (coordMatch) return coordMatch;
    }
    if (isDemoMode && publishers.length > 0) {
      return publishers[0];
    }
    return null;
  }, [currentPublisherId, currentBrotherName, publishers, publishersMap, settings.coordinatorName, settings.coordinatorEmail, settings.coordinatorPhone, isDemoMode]);

  const activePublisherId = activePublisher?.id || currentPublisherId || 'pub-local';

  // Current and Previous Month calculations
  const now = useMemo(() => new Date(), []);
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const currentMonthName = SPANISH_MONTHS[currentMonthIndex];

  const prevMonthDate = useMemo(
    () => new Date(currentYear, currentMonthIndex - 1, 1),
    [currentYear, currentMonthIndex]
  );
  const prevMonthIndex = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthKey = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}`;
  const prevMonthName = SPANISH_MONTHS[prevMonthIndex];

  // Read local ministry data (synced with MinisterioPublicadorTab and Cloud S-4 Report)
  const [localStats, setLocalStats] = useState<{
    hours: number;
    minutes: number;
    totalMinutes: number;
    returnVisits: number;
    bibleStudies: number;
    hasRealRecord: boolean;
  }>({
    hours: 0,
    minutes: 0,
    totalMinutes: 0,
    returnVisits: 0,
    bibleStudies: 0,
    hasRealRecord: false,
  });

  const loadLocalMinistryData = () => {
    try {
      const rawLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      const parsedLogs: MinistryTimeLog[] = rawLogs ? JSON.parse(rawLogs) : [];
      const logs = !isDemoMode
        ? parsedLogs.filter((l) => l?.id !== 'log-demo-1' && l?.id !== 'log-demo-2')
        : parsedLogs;
      if (!isDemoMode && logs.length !== parsedLogs.length) {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
      }

      const monthLogs = logs.filter((l) => l.month === currentMonthKey);
      const loggedMinutes = monthLogs.reduce((acc, l) => acc + (Number(l.minutes) || 0), 0);
      const logReturnVisits = monthLogs.reduce(
        (acc, l) => acc + (Number(l.returnVisitsCount) || 0),
        0
      );

      // Include active stopwatch timer minutes if any
      let activeTimerMinutes = 0;
      try {
        const rawTimer = localStorage.getItem('kongre_ministry_active_timer_v1');
        if (rawTimer) {
          const parsedTimer = JSON.parse(rawTimer);
          let sec = Number(parsedTimer?.accumulatedSeconds || 0);
          const startedTimestamp = parsedTimer?.startedAt || parsedTimer?.startedAtMs;
          if (parsedTimer?.isRunning && startedTimestamp) {
            sec += Math.max(0, Math.floor((Date.now() - Number(startedTimestamp)) / 1000));
          }
          activeTimerMinutes = Math.floor(sec / 60);
        }
      } catch {}

      const rawRv = localStorage.getItem(STORAGE_KEY_RV);
      const parsedRv: ReturnVisitRecord[] = rawRv ? JSON.parse(rawRv) : [];
      const rvList = !isDemoMode
        ? parsedRv.filter(
            (r) =>
              !(r?.id === 'rv-1' && r?.name === 'Sra. Elena Morales') &&
              !(r?.id === 'rv-2' && r?.name === 'Sr. Roberto Gómez')
          )
        : parsedRv;
      if (!isDemoMode && rvList.length !== parsedRv.length) {
        localStorage.setItem(STORAGE_KEY_RV, JSON.stringify(rvList));
      }

      const rawStudies = localStorage.getItem(STORAGE_KEY_STUDIES);
      const parsedStudies: BibleStudyRecord[] = rawStudies ? JSON.parse(rawStudies) : [];
      const studiesList = !isDemoMode
        ? parsedStudies.filter(
            (s) => !(s?.id === 'st-1' && String(s?.studentName || '').includes('Familia Hernández'))
          )
        : parsedStudies;
      if (!isDemoMode && studiesList.length !== parsedStudies.length) {
        localStorage.setItem(STORAGE_KEY_STUDIES, JSON.stringify(studiesList));
      }
      const activeStudiesCount = studiesList.filter((s) => s.active).length;

      const reportsForMonth = monthlyReports.filter((r) => r.month === currentMonthKey);
      let existingCurrentReport = activePublisherId
        ? reportsForMonth.find((r) => r.publisherId === activePublisherId)
        : undefined;
      if (!existingCurrentReport) {
        existingCurrentReport = reportsForMonth.find((r) => r.publisherId === 'pub-local');
      }
      if (!existingCurrentReport && reportsForMonth.length === 1) {
        existingCurrentReport = reportsForMonth[0];
      }

      const localCombinedMinutes = loggedMinutes + activeTimerMinutes;
      const cloudMinutes =
        typeof existingCurrentReport?.totalMinutes === 'number'
          ? existingCurrentReport.totalMinutes
          : (existingCurrentReport?.hours || 0) * 60 + (existingCurrentReport?.minutes || 0);

      const effectiveTotalMinutes =
        localCombinedMinutes > 0 ? localCombinedMinutes : cloudMinutes;
      const computedHours = Math.floor(effectiveTotalMinutes / 60);
      const computedMinutes = effectiveTotalMinutes % 60;

      const computedRv =
        logReturnVisits > 0
          ? logReturnVisits
          : rvList.length > 0
            ? rvList.length
            : existingCurrentReport?.returnVisits ?? 0;
      const computedStudies =
        activeStudiesCount > 0
          ? activeStudiesCount
          : existingCurrentReport?.bibleStudies ?? 0;

      const hasReal =
        effectiveTotalMinutes > 0 ||
        monthLogs.length > 0 ||
        rvList.length > 0 ||
        activeStudiesCount > 0 ||
        Boolean(existingCurrentReport);

      if (!hasReal && isDemoMode) {
        setLocalStats({
          hours: 12,
          minutes: 0,
          totalMinutes: 720,
          returnVisits: 4,
          bibleStudies: 2,
          hasRealRecord: true,
        });
      } else {
        setLocalStats({
          hours: computedHours,
          minutes: computedMinutes,
          totalMinutes: effectiveTotalMinutes,
          returnVisits: computedRv,
          bibleStudies: computedStudies,
          hasRealRecord: hasReal,
        });
      }
    } catch {
      setLocalStats({
        hours: isDemoMode ? 12 : 0,
        minutes: 0,
        totalMinutes: isDemoMode ? 720 : 0,
        returnVisits: isDemoMode ? 4 : 0,
        bibleStudies: isDemoMode ? 2 : 0,
        hasRealRecord: isDemoMode,
      });
    }
  };

  useEffect(() => {
    loadLocalMinistryData();
    const handleMinistryChanged = () => loadLocalMinistryData();
    window.addEventListener('kongre_ministry_data_changed', handleMinistryChanged);
    window.addEventListener('kongre_monthly_reports_hydrated', handleMinistryChanged);
    return () => {
      window.removeEventListener('kongre_ministry_data_changed', handleMinistryChanged);
      window.removeEventListener('kongre_monthly_reports_hydrated', handleMinistryChanged);
    };
  }, [currentMonthKey, activePublisherId, monthlyReports, isDemoMode]);

  // Previous month sent state: strictly based on real report or explicit localStorage flag (unless in Demo Mode)
  const existingPrevReport = useMemo(() => {
    if (!activePublisherId) return undefined;
    return monthlyReports.find(
      (r) =>
        (r.publisherId === activePublisherId || r.publisherId === 'pub-local') &&
        r.month === prevMonthKey &&
        (r.participated || Boolean(r.reportedAt) || (r.hours ?? 0) > 0 || (r.totalMinutes ?? 0) > 0)
    );
  }, [monthlyReports, activePublisherId, prevMonthKey]);

  const [prevMonthSent, setPrevMonthSent] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`kongre_report_sent_${prevMonthKey}`);
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kongre_report_sent_${prevMonthKey}`);
      if (saved !== null) {
        setPrevMonthSent(saved === 'true');
        return;
      }
    } catch {}
    if (existingPrevReport) {
      setPrevMonthSent(true);
    } else if (isDemoMode) {
      setPrevMonthSent(true);
    } else {
      setPrevMonthSent(false);
    }
  }, [existingPrevReport, isDemoMode, prevMonthKey]);

  // Modal para registrar/editar informe rápidamente desde el botón "+"
  const [isQuickReportModalOpen, setIsQuickReportModalOpen] = useState(false);
  const [quickHours, setQuickHours] = useState<number>(0);
  const [quickRv, setQuickRv] = useState<number>(0);
  const [quickStudies, setQuickStudies] = useState<number>(0);

  const handleOpenQuickReportModal = () => {
    setQuickHours(localStats.hours);
    setQuickRv(localStats.returnVisits);
    setQuickStudies(localStats.bibleStudies);
    setIsQuickReportModalOpen(true);
  };

  const handleSaveQuickReport = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMins = quickHours * 60 + localStats.minutes;
    setLocalStats({
      hours: quickHours,
      minutes: localStats.minutes,
      totalMinutes: totalMins,
      returnVisits: quickRv,
      bibleStudies: quickStudies,
      hasRealRecord: true,
    });

    if (activePublisherId) {
      updateMonthlyReport({
        id: `rep-${activePublisherId}-${currentMonthKey}`,
        publisherId: activePublisherId,
        month: currentMonthKey,
        participated: true,
        hours: quickHours,
        minutes: localStats.minutes,
        totalMinutes: totalMins,
        returnVisits: quickRv,
        bibleStudies: quickStudies,
        notes: quickRv > 0 ? `Revisitas: ${quickRv}` : undefined,
        isPioneer: activePublisher?.pioneerStatus === 'regular' || activePublisher?.privilege === 'precursor_regular',
        isAuxiliaryPioneer: activePublisher?.pioneerStatus === 'auxiliar_continuo' || activePublisher?.privilege === 'precursor_auxiliar',
        updatedAt: new Date().toISOString(),
      });
    }

    setIsQuickReportModalOpen(false);
  };

  // =========================================================================
  // 2. PRÓXIMOS (Asignaciones, Deberes, Aseo y Turnos Reales vs Demo)
  // =========================================================================
  const dutyNameMap = useMemo(() => {
    const map: Record<string, string> = {
      audio: 'Audio y Video',
      deber_audio: 'Audio y Video',
      video: 'Audio y Video',
      deber_video: 'Audio y Video',
      microfonos: 'Micrófonos',
      deber_microfonos: 'Micrófonos',
      acomodadores: 'Acomodador',
      deber_acomodadores: 'Acomodador',
      plataforma: 'Plataforma',
      deber_plataforma: 'Plataforma',
      zoom: 'Operador Zoom',
      deber_zoom: 'Operador Zoom',
      estacionamiento: 'Estacionamiento',
      deber_estacionamiento: 'Estacionamiento',
    };
    customDuties.forEach((d) => {
      map[d.key] = d.name;
      map[d.key.replace('deber_', '')] = d.name;
    });
    return map;
  }, [customDuties]);

  const publisherGroup = useMemo(() => {
    if (!activePublisherId) return null;
    return (
      preachingGroups.find(
        (g) =>
          g.overseerId === activePublisherId ||
          g.assistantId === activePublisherId ||
          g.memberIds.includes(activePublisherId)
      ) || null
    );
  }, [preachingGroups, activePublisherId]);

  const upcomingItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      badge?: string;
      type: 'duty' | 'cleaning' | 'part' | 'cart';
      targetTab: ActiveTab;
    }> = [];

    // 1. Escanear asignaciones reales del publicador activo en las semanas programadas
    if (activePublisherId && weeks.length > 0) {
      weeks.slice(0, 6).forEach((w) => {
        const weekLabel =
          formatShortDateRange(w.weekStartDate, w.weekEndDate) ||
          w.midweek?.date ||
          w.id;

        // Deberes entre semana
        Object.entries(w.midweek?.duties || {}).forEach(([dKey, ids]) => {
          if (Array.isArray(ids) && ids.includes(activePublisherId)) {
            items.push({
              id: `mw-duty-${w.id}-${dKey}`,
              title: dutyNameMap[dKey] || dutyNameMap[dKey.replace('deber_', '')] || dKey,
              subtitle: `Entre semana · ${weekLabel}`,
              badge: settings.midweekMeetingDay || 'Entre semana',
              type: 'duty',
              targetTab: 'limpieza_deberes',
            });
          }
        });

        // Deberes fin de semana
        Object.entries(w.weekend?.duties || {}).forEach(([dKey, ids]) => {
          if (Array.isArray(ids) && ids.includes(activePublisherId)) {
            items.push({
              id: `we-duty-${w.id}-${dKey}`,
              title: dutyNameMap[dKey] || dutyNameMap[dKey.replace('deber_', '')] || dKey,
              subtitle: `Fin de semana · ${weekLabel}`,
              badge: settings.weekendMeetingDay || 'Fin de semana',
              type: 'duty',
              targetTab: 'limpieza_deberes',
            });
          }
        });

        // Partes de reunión Entre Semana (Presidente, Oraciones, Tesoros, Maestros, Nuestra Vida Cristiana)
        if (w.midweek?.presidentId === activePublisherId) {
          items.push({
            id: `mw-pres-${w.id}`,
            title: 'Presidente de la Reunión',
            subtitle: `Vida y Ministerio · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.midweek?.initialPrayerId === activePublisherId) {
          items.push({
            id: `mw-pray1-${w.id}`,
            title: 'Oración Inicial',
            subtitle: `Vida y Ministerio · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.midweek?.finalPrayerId === activePublisherId) {
          items.push({
            id: `mw-pray2-${w.id}`,
            title: 'Oración Final',
            subtitle: `Vida y Ministerio · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.midweek?.tesoros?.discurso?.publisherId === activePublisherId) {
          items.push({
            id: `mw-tes-disc-${w.id}`,
            title: w.midweek.tesoros.discurso.title || 'Discurso de Tesoros',
            subtitle: `Tesoros de la Biblia · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.midweek?.tesoros?.perlas?.publisherId === activePublisherId) {
          items.push({
            id: `mw-tes-perlas-${w.id}`,
            title: 'Busquemos Perlas Escondidas',
            subtitle: `Tesoros de la Biblia · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.midweek?.tesoros?.lecturaBiblia?.publisherId === activePublisherId) {
          items.push({
            id: `mw-tes-lec-${w.id}`,
            title: 'Lectura de la Biblia',
            subtitle: `Sala Principal · ${weekLabel}`,
            type: 'part',
            targetTab: 's89',
          });
        }
        if (w.midweek?.tesoros?.lecturaBibliaAux?.publisherId === activePublisherId) {
          items.push({
            id: `mw-tes-lec-aux-${w.id}`,
            title: 'Lectura de la Biblia (Sala Auxiliar)',
            subtitle: `Sala Auxiliar · ${weekLabel}`,
            type: 'part',
            targetTab: 's89',
          });
        }

        // Partes estudiantiles (Seamos Mejores Maestros)
        (w.midweek?.maestros?.items || []).forEach((m) => {
          if (m.publisherId === activePublisherId || m.assistantId === activePublisherId) {
            const isAssistant = m.assistantId === activePublisherId && m.publisherId !== activePublisherId;
            items.push({
              id: `mw-part-${w.id}-${m.id}`,
              title: isAssistant ? `${m.title} (Ayudante)` : m.title,
              subtitle: `Seamos Mejores Maestros · ${weekLabel}`,
              type: 'part',
              targetTab: 's89',
            });
          }
        });

        // Nuestra Vida Cristiana
        (w.midweek?.vidaCristiana?.items || []).forEach((vc) => {
          if (vc.publisherId === activePublisherId) {
            items.push({
              id: `mw-vc-${w.id}-${vc.id}`,
              title: vc.title,
              subtitle: `Nuestra Vida Cristiana · ${weekLabel}`,
              type: 'part',
              targetTab: 'programacion',
            });
          }
        });
        if (w.midweek?.vidaCristiana?.estudioBiblico?.conductorId === activePublisherId) {
          items.push({
            id: `mw-ebc-cond-${w.id}`,
            title: 'Estudio Bíblico de la Congregación (Conductor)',
            subtitle: `Vida y Ministerio · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.midweek?.vidaCristiana?.estudioBiblico?.lectorId === activePublisherId) {
          items.push({
            id: `mw-ebc-lec-${w.id}`,
            title: 'Lector del Estudio Bíblico',
            subtitle: `Vida y Ministerio · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }

        // Partes Fin de Semana
        if (w.weekend?.presidentId === activePublisherId) {
          items.push({
            id: `we-pres-${w.id}`,
            title: 'Presidente Reunión Pública',
            subtitle: `Fin de semana · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.weekend?.publicTalkSpeaker === activePublisherId) {
          items.push({
            id: `we-speaker-${w.id}`,
            title: w.weekend.publicTalkTheme || 'Discurso Público',
            subtitle: `Orador · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.weekend?.atalayaConductorId === activePublisherId) {
          items.push({
            id: `we-wt-cond-${w.id}`,
            title: 'Conductor de La Atalaya',
            subtitle: `Fin de semana · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }
        if (w.weekend?.atalayaLectorId === activePublisherId) {
          items.push({
            id: `we-wt-lec-${w.id}`,
            title: 'Lector de La Atalaya',
            subtitle: `Fin de semana · ${weekLabel}`,
            type: 'part',
            targetTab: 'programacion',
          });
        }

        // Aseo del Salón por grupo del publicador
        if (
          publisherGroup &&
          Array.isArray(w.cleaningGroupNumbers) &&
          w.cleaningGroupNumbers.includes(publisherGroup.number)
        ) {
          items.push({
            id: `clean-${w.id}-g${publisherGroup.number}`,
            title: `Aseo y Cierre (${publisherGroup.name})`,
            subtitle: weekLabel,
            type: 'cleaning',
            targetTab: 'limpieza_deberes',
          });
        }
      });
    }

    // Turnos de Carrito del publicador activo
    if (activePublisherId && cartShifts.length > 0) {
      cartShifts.forEach((shift) => {
        if (shift.publisher1Id === activePublisherId || shift.publisher2Id === activePublisherId) {
          const loc = cartLocations.find((l) => l.id === shift.locationId);
          items.push({
            id: `cart-${shift.id}`,
            title: `Carrito: ${loc?.name || ' Exhibidor Público'}`,
            subtitle: `${shift.dayOfWeek} · ${shift.startTime} - ${shift.endTime}`,
            type: 'cart',
            targetTab: 'carritos',
          });
        }
      });
    }

    // MODO DEMO: Si estamos en modo demo y no hay suficientes elementos para el usuario demo,
    // mostrar elementos interactivos que lleven a cada sección clave
    if (isDemoMode && items.length < 3) {
      const activeW = currentWeek || weeks[0];
      const rangeLabel = activeW
        ? formatShortDateRange(activeW.weekStartDate, activeW.weekEndDate)
        : `Semana actual`;

      const demoFallbacks: typeof items = [
        {
          id: 'demo-duty-audio',
          title: 'Operador de Audio y Video',
          subtitle: `${settings.weekendMeetingDay || 'Fin de semana'} · ${rangeLabel}`,
          type: 'duty',
          targetTab: 'limpieza_deberes',
        },
        {
          id: 'demo-part-s89',
          title: 'Lectura de la Biblia (Sala Principal)',
          subtitle: `${settings.midweekMeetingDay || 'Entre semana'} · Asignación S-89`,
          type: 'part',
          targetTab: 's89',
        },
        {
          id: 'demo-cleaning-salon',
          title: 'Aseo y Cierre del Salón',
          subtitle: `${ publisherGroup?.name || 'Grupo 1'} · ${rangeLabel}`,
          type: 'cleaning',
          targetTab: 'limpieza_deberes',
        },
        {
          id: 'demo-cart-shift',
          title: 'Predicación con Exhibidores (Carritos)',
          subtitle: 'Sábado · 09:00 - 11:00',
          type: 'cart',
          targetTab: 'carritos',
        },
      ];

      for (const df of demoFallbacks) {
        if (items.length < 4 && !items.some((i) => i.title === df.title)) {
          items.push(df);
        }
      }
    }

    return items;
  }, [
    activePublisherId,
    weeks,
    currentWeek,
    dutyNameMap,
    publisherGroup,
    cartShifts,
    cartLocations,
    settings.midweekMeetingDay,
    settings.weekendMeetingDay,
    isDemoMode,
  ]);

  // =========================================================================
  // 3. TABLERO DE ANUNCIOS (Anuncios y Documentos/Cartas — Cero datos falsos)
  // =========================================================================
  const { anunciosList, documentosList, anunciosCount, documentosCount } = useMemo(() => {
    const docs = notices.filter((n) => n.category === 'carta');
    const general = notices.filter((n) => n.category !== 'carta');

    if (isDemoMode && notices.length === 0) {
      return {
        anunciosList: [
          {
            id: 'demo-notice-1',
            title: 'Programa de limpieza especial previo a la Asamblea',
            category: 'anuncio' as const,
            date: 'Reciente',
            pinned: true,
          },
          {
            id: 'demo-notice-2',
            title: 'Campaña especial de predicación del mes',
            category: 'campana' as const,
            date: 'Activo',
            pinned: false,
          },
        ],
        documentosList: [
          {
            id: 'demo-doc-1',
            title: 'Carta a todas las congregaciones (S-147)',
            category: 'carta' as const,
            date: 'Mes actual',
            pinned: true,
          },
        ],
        anunciosCount: 2,
        documentosCount: 1,
      };
    }

    return {
      anunciosList: general,
      documentosList: docs,
      anunciosCount: general.length,
      documentosCount: docs.length,
    };
  }, [notices, isDemoMode]);

  // =========================================================================
  // 4. EVENTOS DE LA CONGREGACIÓN (Solo eventos reales o Demo en modo Demo)
  // =========================================================================
  const eventsList = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      dateLabel: string;
      subtitle?: string;
      kind: 'asamblea' | 'visita_sc' | 'conmemoracion' | 'evento';
      targetTab: ActiveTab;
    }> = [];

    // 1. Asambleas Teocráticas realmente registradas
    theocraticAssemblies.forEach((asm) => {
      if (asm.theme || asm.dates || asm.venue) {
        const typeLabel =
          asm.type === 'regional'
            ? 'Asamblea Regional'
            : asm.type === 'circuito_con_sc'
            ? 'Asamblea de Circuito (con el SC)'
            : 'Asamblea de Circuito (con Rep. de Sucursal)';
        list.push({
          id: `asm-${asm.id}`,
          title: asm.theme ? `${typeLabel}: "${asm.theme}"` : typeLabel,
          dateLabel: asm.dates || 'Fecha por confirmar',
          subtitle: asm.venue || undefined,
          kind: 'asamblea',
          targetTab: 'memorial_asambleas',
        });
      }
    });

    // 2. Visita del Superintendente de Circuito (solo si tiene datos configurados)
    if (
      circuitVisit &&
      (Boolean(circuitVisit.startDate?.trim()) || Boolean(circuitVisit.overseerName?.trim()))
    ) {
      const dateStr =
        circuitVisit.startDate && circuitVisit.endDate
          ? formatShortDateRange(circuitVisit.startDate, circuitVisit.endDate)
          : circuitVisit.startDate || 'Fecha por definir';
      list.push({
        id: `visit-${circuitVisit.id || 'sc'}`,
        title: circuitVisit.overseerName
          ? `Visita del Superintendente: ${circuitVisit.overseerName}`
          : 'Visita del Superintendente de Circuito',
        dateLabel: dateStr,
        subtitle: circuitVisit.midweekTalkTheme || undefined,
        kind: 'visita_sc',
        targetTab: 'visita_sc',
      });
    }

    // 3. Planes de la Conmemoración realmente registrados
    memorialPlans.forEach((plan) => {
      if (plan.date?.trim()) {
        list.push({
          id: `mem-${plan.id}`,
          title: `Conmemoración ${plan.serviceYear || ''}`.trim(),
          dateLabel: formatShortDateRange(plan.date),
          subtitle: plan.location
            ? `${plan.location}${plan.time ? ` · ${plan.time}` : ''}`
            : undefined,
          kind: 'conmemoracion',
          targetTab: 'memorial_asambleas',
        });
      }
    });

    // 4. Eventos del Calendario de la Congregación
    congregationEvents.forEach((ev) => {
      if (ev.title?.trim()) {
        const target: ActiveTab =
          ev.type === 'visit'
            ? 'visita_sc'
            : ev.type === 'assembly' || ev.type === 'memorial'
            ? 'memorial_asambleas'
            : 'calendario';
        list.push({
          id: `cal-ev-${ev.id}`,
          title: ev.title,
          dateLabel: formatShortDateRange(ev.start_date, ev.end_date),
          subtitle: ev.description || undefined,
          kind:
            ev.type === 'assembly'
              ? 'asamblea'
              : ev.type === 'visit'
              ? 'visita_sc'
              : ev.type === 'memorial'
              ? 'conmemoracion'
              : 'evento',
          targetTab: target,
        });
      }
    });

    // MODO DEMO: Si está activo el Modo Demo y la lista está vacía, mostrar eventos demostrativos completos
    if (isDemoMode && list.length === 0) {
      return [
        {
          id: 'demo-ev-asamblea-1',
          title: 'Asamblea de Circuito con el Superintendente',
          dateLabel: 'Próximo semestre · Salón de Asambleas',
          subtitle: 'Ver programa, transporte y voluntarios',
          kind: 'asamblea' as const,
          targetTab: 'memorial_asambleas' as ActiveTab,
        },
        {
          id: 'demo-ev-visita-sc',
          title: 'Visita del Superintendente de Circuito',
          dateLabel: 'Semana especial de actividad',
          subtitle: 'Reuniones de servicio, hospitalidad y discursos',
          kind: 'visita_sc' as const,
          targetTab: 'visita_sc' as ActiveTab,
        },
        {
          id: 'demo-ev-conmem',
          title: 'Conmemoración de la muerte de Cristo',
          dateLabel: 'Campaña e invitaciones',
          subtitle: 'Organización de emblemas, acomodadores y orador',
          kind: 'conmemoracion' as const,
          targetTab: 'memorial_asambleas' as ActiveTab,
        },
        {
          id: 'demo-ev-calendario',
          title: 'Calendario Teocrático Mensual',
          dateLabel: 'Fechas clave de la congregación',
          subtitle: 'Explorar todos los eventos del mes',
          kind: 'evento' as const,
          targetTab: 'calendario' as ActiveTab,
        },
      ];
    }

    return list;
  }, [theocraticAssemblies, circuitVisit, memorialPlans, congregationEvents, isDemoMode]);

  // =========================================================================
  // 5. SECCIONES INTERACTIVAS DE LA CONGREGACIÓN (Navegación directa)
  // =========================================================================
  const congregationQuickSections = useMemo(() => {
    const activeTerritoriesCount = territories.filter((t) => t.status === 'asignado').length;
    const totalTerritoriesCount = territories.length;
    const salidasCount = fieldServiceMeetings.length;
    const carritosCount = cartShifts.length;
    const groupsCount = preachingGroups.length;

    const scheduledWeeksCount = weeks.filter(
      (w) =>
        Boolean(w.midweek?.presidentId) ||
        Boolean(w.midweek?.tesoros?.discurso?.publisherId) ||
        Boolean(w.midweek?.tesoros?.perlas?.publisherId) ||
        Boolean(w.midweek?.tesoros?.lecturaBiblia?.publisherId) ||
        Boolean(w.weekend?.presidentId) ||
        Boolean(w.weekend?.publicTalkSpeaker)
    ).length;

    const hasRealWeekendTalk =
      Boolean(currentWeek?.weekend?.publicTalkSpeaker?.trim()) &&
      Boolean(currentWeek?.weekend?.publicTalkTheme?.trim()) &&
      currentWeek?.weekend?.publicTalkTheme !== 'Discurso Público';

    const assignedDutiesCount = currentWeek
      ? Object.values(currentWeek.midweek?.duties || {}).filter(
          (arr) => Array.isArray(arr) && arr.length > 0
        ).length +
        Object.values(currentWeek.weekend?.duties || {}).filter(
          (arr) => Array.isArray(arr) && arr.length > 0
        ).length
      : 0;

    return [
      {
        id: 'sec-vym',
        title: 'Vida y Ministerio',
        meta:
          scheduledWeeksCount > 0
            ? `${scheduledWeeksCount} ${scheduledWeeksCount === 1 ? 'semana programada' : 'semanas programadas'}`
            : isDemoMode
            ? `${weeks.length} semanas`
            : 'Ir al programa',
        icon: Calendar,
        targetTab: 'programacion' as ActiveTab,
        accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20',
      },
      {
        id: 'sec-publica',
        title: 'Reunión Pública',
        meta: hasRealWeekendTalk
          ? currentWeek!.weekend.publicTalkTheme
          : isDemoMode
          ? currentWeek?.weekend?.publicTalkTheme || 'Discursos y Atalaya'
          : 'Discursos y lectores',
        icon: Presentation,
        targetTab: 'reunion_publica' as ActiveTab,
        accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20',
      },
      {
        id: 'sec-deberes',
        title: 'Aseo y Deberes',
        meta:
          assignedDutiesCount > 0
            ? `${assignedDutiesCount} ${assignedDutiesCount === 1 ? 'turno asignado' : 'turnos asignados'}`
            : isDemoMode && customDuties.length > 0
            ? `${customDuties.length} departamentos`
            : 'Audio, acomodadores y aseo',
        icon: Sparkles,
        targetTab: 'limpieza_deberes' as ActiveTab,
        accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20',
      },
      {
        id: 'sec-salidas',
        title: 'Salidas al Campo',
        meta:
          salidasCount > 0
            ? `${salidasCount} ${salidasCount === 1 ? 'salida programada' : 'salidas programadas'}`
            : isDemoMode
            ? 'Puntos de encuentro'
            : 'Ver horarios',
        icon: Compass,
        targetTab: 'salidas' as ActiveTab,
        accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20',
      },
      {
        id: 'sec-territorios',
        title: 'Territorios',
        meta:
          totalTerritoriesCount > 0
            ? `${activeTerritoriesCount} de ${totalTerritoriesCount} en trabajo`
            : isDemoMode
            ? 'Mapa y tarjetas S-13'
            : 'Ver mapa y registro',
        icon: Map,
        targetTab: 'territorios' as ActiveTab,
        accent: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20',
      },
      {
        id: 'sec-carritos',
        title: 'Carritos',
        meta:
          carritosCount > 0
            ? `${carritosCount} ${carritosCount === 1 ? 'turno activo' : 'turnos activos'}`
            : isDemoMode
            ? 'Turnos y ubicaciones'
            : 'Predicación pública',
        icon: Briefcase,
        targetTab: 'carritos' as ActiveTab,
        accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20',
      },
      {
        id: 'sec-grupos',
        title: 'Grupos de Servicio',
        meta:
          groupsCount > 0
            ? `${groupsCount} ${groupsCount === 1 ? 'grupo' : 'grupos'} · ${publishers.length} pub.`
            : isDemoMode
            ? 'Superintendentes y miembros'
            : 'Organización por grupos',
        icon: Users,
        targetTab: 'grupos_servicio' as ActiveTab,
        accent: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/20',
      },
      {
        id: 'sec-mi-vista',
        title: 'Mis Asignaciones',
        meta:
          upcomingItems.length > 0
            ? `${upcomingItems.length} ${upcomingItems.length === 1 ? 'próxima' : 'próximas'}`
            : 'Agenda personal',
        icon: BookOpen,
        targetTab: 'mi_vista' as ActiveTab,
        accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/20',
      },
    ];
  }, [
    territories,
    fieldServiceMeetings.length,
    cartShifts.length,
    preachingGroups.length,
    weeks,
    currentWeek,
    customDuties.length,
    publishers.length,
    upcomingItems.length,
    isDemoMode,
  ]);

  const canViewSecretariaStats =
    effectiveRoleInfo.id === 'coordinador' ||
    effectiveRoleInfo.id === 'anciano' ||
    effectiveRoleInfo.id === 'secretario' ||
    effectiveRoleInfo.id === 'superintendente_servicio';

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fade-in select-none">
      {/* =========================================================================
          1. FILA SUPERIOR: INFORME & PRÓXIMOS (2 TARJETAS LADO A LADO)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 items-stretch">
        {/* TARJETA IZQUIERDA: INFORME */}
        <div className="bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 rounded-2xl border border-violet-200/70 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Cabecera Informe + Botón "+" */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Informe
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Abrir Mi Ministerio</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleOpenQuickReportModal}
                aria-label="Registrar o editar informe de predicación"
                title="Registrar o editar actividad del mes"
                className="w-8 h-8 rounded-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Mes Actual */}
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize">
                  {currentMonthName} {currentYear}
                </p>
                {!localStats.hasRealRecord && !isDemoMode && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Sin registros aún
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-violet-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Tiempo
                  </span>
                  <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                    {localStats.hours > 0
                      ? localStats.minutes > 0
                        ? `${localStats.hours}h ${localStats.minutes}m`
                        : `${localStats.hours}h`
                      : localStats.minutes > 0
                        ? `${localStats.minutes}m`
                        : '0h'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-violet-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Revisitas
                  </span>
                  <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                    {localStats.returnVisits > 0 ? localStats.returnVisits : '—'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-violet-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Cursos
                  </span>
                  <span className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
                    {localStats.bibleStudies > 0 ? localStats.bibleStudies : '—'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Mes Anterior y Estado Real */}
          <div className="mt-3.5 pt-3 border-t border-violet-200/50 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                Mes de {prevMonthName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {prevMonthSent ? 'Informe entregado' : 'Informe aún no marcado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('inicio')}
              aria-label={`Estado del informe de ${prevMonthName}: ${prevMonthSent ? 'Enviado' : 'Registrar en Mi Ministerio'}`}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                prevMonthSent
                  ? 'border-purple-700/70 dark:border-purple-400/60 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 hover:bg-purple-100/70 dark:hover:bg-purple-900/50'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-400 dark:hover:border-purple-500'
              }`}
            >
              {prevMonthSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 stroke-[2.5] shrink-0" />
                  <span>Enviado</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span>Informar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TARJETA DERECHA: PRÓXIMOS */}
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-2xl border border-amber-200/70 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          {/* Cabecera Próximos + Contador */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Próximos
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activePublisher ? `Asignaciones de ${activePublisher.name}` : 'Tus próximos privilegios'}
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs sm:text-sm font-extrabold text-amber-800 dark:text-amber-300">
              {upcomingItems.length} {upcomingItems.length === 1 ? 'asignación' : 'asignaciones'}
            </span>
          </div>

          {/* Lista de próximos deberes / partes o Estado Vacío real */}
          {upcomingItems.length > 0 ? (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800 flex-1 flex flex-col justify-center">
              {upcomingItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.targetTab)}
                  className="w-full py-2 first:pt-1 last:pb-1 flex items-center justify-between gap-2.5 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/50 rounded-lg px-1.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {item.type === 'duty' ? (
                        <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                      ) : item.type === 'cleaning' ? (
                        <Sparkles className="w-4 h-4 stroke-[2.2]" />
                      ) : item.type === 'cart' ? (
                        <Briefcase className="w-4 h-4 stroke-[2.2]" />
                      ) : (
                        <Mic className="w-4 h-4 stroke-[2.2]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                No tienes asignaciones ni deberes próximos registrados
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                Consulta el programa semanal o el cuadro de deberes y aseo del Salón.
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('programacion')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Ver programa
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('limpieza_deberes')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Deberes y aseo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. SECCIÓN MEDIA: TABLERO DE ANUNCIOS
         ========================================================================= */}
      <div className="bg-gradient-to-br from-rose-50/40 via-white to-rose-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/15 rounded-2xl border border-rose-200/60 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tablero de anuncios
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comunicados oficiales, cartas y avisos para la congregación
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('tablero_anuncios')}
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Abrir cartelera</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-rose-200/50 dark:divide-slate-800">
          {/* Fila 1: Anuncios */}
          <button
            type="button"
            onClick={() => setActiveTab('tablero_anuncios')}
            className="w-full py-3 px-2 flex items-center justify-between gap-3 hover:bg-rose-50/60 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 block truncate">
                  Anuncios de la Congregación
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  {anunciosList.length > 0
                    ? anunciosList[0].title
                    : 'Sin anuncios publicados actualmente'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400">
                {anunciosCount}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>

          {/* Fila 2: Documentos y Cartas */}
          <button
            type="button"
            onClick={() => setActiveTab('tablero_anuncios')}
            className="w-full py-3 px-2 flex items-center justify-between gap-3 hover:bg-rose-50/60 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 block truncate">
                  Documentos y Cartas
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  {documentosList.length > 0
                    ? documentosList[0].title
                    : 'Sin cartas fijadas actualmente'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400">
                {documentosCount}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. SECCIÓN: EVENTOS TEOCRÁTICOS (Solo eventos reales o Demo en modo Demo)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-orange-50/40 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/15 rounded-2xl border border-orange-200/60 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Eventos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Asambleas de circuito, regionales, visita del superintendente y Conmemoración
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('calendario')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Ver calendario</span>
          </button>
        </div>

        {eventsList.length > 0 ? (
          <div className="divide-y divide-orange-200/50 dark:divide-slate-800">
            {eventsList.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setActiveTab(ev.targetTab)}
                className="w-full py-3 px-2 flex items-center justify-between gap-3.5 hover:bg-orange-50/50 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 flex items-center justify-center shrink-0">
                    {ev.kind === 'asamblea' ? (
                      <Building2 className="w-5 h-5 stroke-[2]" />
                    ) : ev.kind === 'visita_sc' ? (
                      <UserCheck className="w-5 h-5 stroke-[2]" />
                    ) : ev.kind === 'conmemoracion' ? (
                      <Wine className="w-5 h-5 stroke-[2]" />
                    ) : (
                      <Calendar className="w-5 h-5 stroke-[2]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug truncate">
                      {ev.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span>{ev.dateLabel}</span>
                      {ev.subtitle && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{ev.subtitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-orange-600 dark:bg-orange-500 text-white flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform shadow-2xs">
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-5 px-3 text-center rounded-xl bg-white/60 dark:bg-slate-800/40 border border-dashed border-orange-200/70 dark:border-slate-700/80">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              No hay eventos especiales ni asambleas registradas en este momento
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Puedes programar fechas en el Calendario, Visita del Superintendente o Conmemoración y Asambleas.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('calendario')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Ir al Calendario
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('memorial_asambleas')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Asambleas y Conmemoración
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('visita_sc')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Visita del SC
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. DIRECTORIO RÁPIDO DE SECCIONES DE LA CONGREGACIÓN
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Secciones de la Congregación
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acceso directo a reuniones, predicación, territorios y organización
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {congregationQuickSections.map((sec) => {
            const IconComponent = sec.icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.targetTab)}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/70 dark:hover:border-indigo-500/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-slate-800 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sec.accent}`}
                  >
                    <IconComponent className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {sec.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {sec.meta}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MODAL RÁPIDO PARA ACTUALIZAR INFORME DEL MES (+)
         ========================================================================= */}
      {isQuickReportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Actualizar informe de ${currentMonthName}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Informe de Servicio S-4
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white capitalize">
                  Actividad de {currentMonthName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickReportModalOpen(false)}
                aria-label="Cerrar ventana de informe rápido"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickReport} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quickHours}
                    onChange={(e) => setQuickHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Revisitas
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quickRv}
                    onChange={(e) => setQuickRv(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Cursos
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={quickStudies}
                    onChange={(e) => setQuickStudies(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  Estado de {prevMonthName}:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !prevMonthSent;
                    setPrevMonthSent(next);
                    try {
                      localStorage.setItem(`kongre_report_sent_${prevMonthKey}`, String(next));
                    } catch {}
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    prevMonthSent
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{prevMonthSent ? 'Enviado' : 'Pendiente'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickReportModalOpen(false);
                    setActiveTab('inicio');
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Ir a Mi Ministerio
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

