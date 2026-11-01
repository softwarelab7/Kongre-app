// src/components/MinisterioPublicadorTab.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';
import { MonthlyServiceReport } from '../types';
import {
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  BookOpen,
  Users,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  FileText,
  Send,
  Trash2,
  Edit3,
  ChevronRight,
  Award,
  Target,
  Heart,
  Home,
  Search,
  Check,
  X,
  ArrowUpRight,
  LayoutGrid,
  UserCheck,
  Compass,
  Bookmark,
  GraduationCap,
  History,
  PlusCircle,
  MinusCircle,
  ArrowLeft,
} from 'lucide-react';
import { MinistryStopwatchDial } from './MinistryStopwatchDial';
import { getAvailableServiceYears, getServiceYearMonths } from '../utils/s21Helper';
import { getVaultValue, setVaultValue } from '../utils/atRestVault';

export type MinistrySubTab =
  | 'tarjetas'
  | 'resumen'
  | 'cronometro'
  | 'revisitas'
  | 'estudios'
  | 'informe';

export interface MinistryTimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  minutes: number;
  modality: 'casa_en_casa' | 'carritos' | 'revisitas' | 'estudio' | 'informal';
  returnVisitsCount: number;
  placementsCount: number;
  notes: string;
  createdAt: string;
}

export interface ReturnVisitRecord {
  id: string;
  name: string;
  address: string;
  territoryNumber?: string;
  phone?: string;
  topic: string;
  pendingQuestion: string;
  publicationLeft: string;
  bestTime: string;
  nextVisitDate: string; // YYYY-MM-DD
  interestLevel: 'alto' | 'medio' | 'inicial';
  visitsHistory: Array<{
    id: string;
    date: string;
    note: string;
  }>;
  createdAt: string;
}

export interface BibleStudyRecord {
  id: string;
  studentName: string;
  address: string;
  phone?: string;
  publication: string;
  currentLesson: number;
  totalLessons: number;
  scheduleDay: string;
  scheduleTime: string;
  spiritualGoal: string;
  notes: string;
  sessionsThisMonth: string[]; // Array of YYYY-MM-DD dates
  active: boolean;
  createdAt: string;
}

interface ActiveTimerState {
  isRunning: boolean;
  startedAt: number | null; // timestamp ms when started/resumed
  accumulatedSeconds: number; // seconds accumulated before current run
  modality: MinistryTimeLog['modality'];
  sessionReturnVisits: number;
  sessionPlacements: number;
  sessionNotes: string;
}

interface MinisterioPublicadorTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  initialSubTab?: MinistrySubTab;
  onOpenTimerModal?: () => void;
}

const STORAGE_KEY_TIMER = 'kongre_ministry_active_timer_v1';
const STORAGE_KEY_LOGS = 'kongre_ministry_time_logs_v1';
const STORAGE_KEY_RV = 'kongre_ministry_return_visits_v1';
const STORAGE_KEY_STUDIES = 'kongre_ministry_bible_studies_v1';
const STORAGE_KEY_GOAL = 'kongre_ministry_hour_goal_v1';

const MODALITY_LABELS: Record<MinistryTimeLog['modality'], string> = {
  casa_en_casa: 'De casa en casa',
  carritos: 'Predicación pública / Carritos',
  revisitas: 'Revisitas',
  estudio: 'Curso bíblico',
  informal: 'Informal / Teléfono / Cartas',
};

const PUBLICATIONS_CATALOG = [
  { title: '¡Disfrute de la vida para siempre! (Libro)', lessons: 60 },
  { title: '¡Disfrute de la vida para siempre! (Folleto)', lessons: 3 },
  { title: 'Escuche a Dios y vivirá para siempre', lessons: 15 },
  { title: 'Lecciones que aprendo de la Biblia', lessons: 103 },
  { title: ' Aprendamos del Gran Maestro', lessons: 48 },
  { title: 'Otra publicación de estudio', lessons: 30 },
];

export const MinisterioPublicadorTab: React.FC<MinisterioPublicadorTabProps> = ({
  setActiveTab,
  initialSubTab = 'resumen',
}) => {
  const {
    publishers,
    publishersMap,
    weeks,
    settings,
    monthlyReports,
    updateMonthlyReport,
    preachingGroups,
    isDemoMode,
  } = useCongregation();

  const { currentPublisherId, currentBrotherName, activeRole } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<MinistrySubTab>(initialSubTab);

  // Referencia para saber si el usuario realizó cambios locales en esta sesión
  const hasUserEditedRef = useRef<boolean>(false);
  const lastAutoSavedSignatureRef = useRef<string>('');

  const markLocalMinistryEdit = () => {
    hasUserEditedRef.current = true;
    try {
      localStorage.setItem('kongre_ministry_local_updated_at', String(Date.now()));
    } catch {}
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handleOpenTimerEvent = () => {
      setActiveSubTab('cronometro');
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    };
    window.addEventListener('kongre_open_preaching_timer', handleOpenTimerEvent);
    return () => window.removeEventListener('kongre_open_preaching_timer', handleOpenTimerEvent);
  }, []);

  // Identify current publisher profile consistently across desktop and mobile
  const activePublisherId = useMemo(() => {
    if (currentPublisherId && publishersMap.has(currentPublisherId)) {
      return currentPublisherId;
    }
    const saved = localStorage.getItem('kongre_current_publisher_id_v2');
    if (saved && publishersMap.has(saved)) return saved;
    if (currentBrotherName) {
      const cleanName = currentBrotherName.toLowerCase().trim();
      const match = publishers.find(
        (p) => p.name.toLowerCase().trim() === cleanName
      );
      if (match) return match.id;
    }
    if (
      activeRole === 'coordinador' ||
      (currentBrotherName && currentBrotherName.toLowerCase().includes('coordinador'))
    ) {
      const coordName = (settings.coordinatorName || '').toLowerCase().trim();
      const coordMatch = publishers.find(
        (p) =>
          p.theocraticRole === 'coordinador' ||
          (p.id && p.id.startsWith('pub-coord')) ||
          (coordName && p.name.toLowerCase().trim() === coordName)
      );
      if (coordMatch) return coordMatch.id;
    }
    return publishers[0]?.id || 'pub-local';
  }, [currentPublisherId, currentBrotherName, activeRole, settings.coordinatorName, publishers, publishersMap]);

  const activePublisher = publishersMap.get(activePublisherId);

  // Current YYYY-MM and YYYY-MM-DD
  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const currentMonthKey = useMemo(() => todayIso.slice(0, 7), [todayIso]);

  const currentMonthLabel = useMemo(() => {
    const [y, m] = currentMonthKey.split('-');
    const names = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${names[parseInt(m, 10) - 1] || m} ${y}`;
  }, [currentMonthKey]);

  // =========================================================================
  // 1. CRONÓMETRO DE MINISTERIO EN VIVO (PERSISTENTE)
  // =========================================================================
  const [timerState, setTimerState] = useState<ActiveTimerState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TIMER);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          isRunning: Boolean(parsed.isRunning),
          startedAt: parsed.startedAt || null,
          accumulatedSeconds: Number(parsed.accumulatedSeconds) || 0,
          modality: parsed.modality || 'casa_en_casa',
          sessionReturnVisits: Number(parsed.sessionReturnVisits) || 0,
          sessionPlacements: Number(parsed.sessionPlacements) || 0,
          sessionNotes: parsed.sessionNotes || '',
        };
      }
    } catch {}
    return {
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
      modality: 'casa_en_casa',
      sessionReturnVisits: 0,
      sessionPlacements: 0,
      sessionNotes: '',
    };
  });

  const [displaySeconds, setDisplaySeconds] = useState<number>(0);

  // Save timer state to localStorage and broadcast update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(timerState));
      window.dispatchEvent(new CustomEvent('kongre_ministry_timer_updated', { detail: timerState }));
    } catch {}
  }, [timerState]);

  // Tick timer every second based on accurate wall-clock timestamp
  useEffect(() => {
    const computeSeconds = () => {
      if (timerState.isRunning && timerState.startedAt) {
        const delta = Math.max(0, Math.floor((Date.now() - timerState.startedAt) / 1000));
        return timerState.accumulatedSeconds + delta;
      }
      return timerState.accumulatedSeconds;
    };

    setDisplaySeconds(computeSeconds());

    if (!timerState.isRunning) return;
    const interval = setInterval(() => {
      setDisplaySeconds(computeSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.startedAt, timerState.accumulatedSeconds]);

  const handleStartPauseTimer = () => {
    markLocalMinistryEdit();
    setTimerState((prev) => {
      if (prev.isRunning) {
        const delta = prev.startedAt
          ? Math.max(0, Math.floor((Date.now() - prev.startedAt) / 1000))
          : 0;
        return {
          ...prev,
          isRunning: false,
          startedAt: null,
          accumulatedSeconds: prev.accumulatedSeconds + delta,
        };
      } else {
        return {
          ...prev,
          isRunning: true,
          startedAt: Date.now(),
        };
      }
    });
  };

  const handleAdjustTimerMinutes = (deltaMinutes: number) => {
    markLocalMinistryEdit();
    setTimerState((prev) => {
      const currentElapsed =
        prev.isRunning && prev.startedAt
          ? prev.accumulatedSeconds + Math.max(0, Math.floor((Date.now() - prev.startedAt) / 1000))
          : prev.accumulatedSeconds;
      const nextSeconds = Math.max(0, currentElapsed + deltaMinutes * 60);
      return {
        ...prev,
        accumulatedSeconds: nextSeconds,
        startedAt: prev.isRunning ? Date.now() : null,
      };
    });
  };

  const handleResetTimer = () => {
    markLocalMinistryEdit();
    setTimerState({
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: 0,
      modality: 'casa_en_casa',
      sessionReturnVisits: 0,
      sessionPlacements: 0,
      sessionNotes: '',
    });
  };

  const formatTimerHMS = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
    };
  };

  // =========================================================================
  // 2. HISTORIAL DE SESIONES DE PREDICACIÓN Y META DE HORAS
  // =========================================================================
  const DEMO_TIME_LOGS: MinistryTimeLog[] = useMemo(
    () => [
      {
        id: 'log-demo-1',
        date: todayIso,
        month: currentMonthKey,
        minutes: 120,
        modality: 'casa_en_casa',
        returnVisitsCount: 2,
        placementsCount: 3,
        notes: 'Predicación matutina con el grupo de servicio.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-demo-2',
        date: todayIso,
        month: currentMonthKey,
        minutes: 90,
        modality: 'revisitas',
        returnVisitsCount: 3,
        placementsCount: 1,
        notes: 'Tarde de revisitas y curso bíblico.',
        createdAt: new Date().toISOString(),
      },
    ],
    [todayIso, currentMonthKey]
  );

  const [timeLogs, setTimeLogs] = useState<MinistryTimeLog[]>(() => {
    try {
      const raw = getVaultValue(STORAGE_KEY_LOGS) || localStorage.getItem(STORAGE_KEY_LOGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (!isDemoMode) {
            return parsed.filter((l: any) => l?.id !== 'log-demo-1' && l?.id !== 'log-demo-2');
          }
          return parsed.length > 0 ? parsed : DEMO_TIME_LOGS;
        }
      }
    } catch {}
    return isDemoMode ? DEMO_TIME_LOGS : [];
  });

  useEffect(() => {
    setTimeLogs((prev) => {
      if (!isDemoMode) {
        const cleaned = prev.filter((l) => l.id !== 'log-demo-1' && l.id !== 'log-demo-2');
        return cleaned.length !== prev.length ? cleaned : prev;
      }
      return prev.length === 0 ? DEMO_TIME_LOGS : prev;
    });
  }, [isDemoMode, DEMO_TIME_LOGS]);

  useEffect(() => {
    try {
      setVaultValue(STORAGE_KEY_LOGS, JSON.stringify(timeLogs));
    } catch {}
  }, [timeLogs]);

  const [hourGoal, setHourGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOAL);
      if (saved !== null) return Number(saved);
    } catch {}
    if (activePublisher?.privilege === 'precursor_regular') return 50;
    if (activePublisher?.privilege === 'precursor_auxiliar') return 30;
    return 15;
  });

  const handleUpdateGoal = (newGoal: number) => {
    markLocalMinistryEdit();
    setHourGoal(newGoal);
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, String(newGoal));
    } catch {}
  };

  // Ajuste rápido directo desde la tarjeta "Mi Meta y Registro Mensual" (+15m, +30m, +1h, -5m)
  const handleQuickAdjustMonthlyMinutes = (deltaMinutes: number) => {
    markLocalMinistryEdit();
    setTimeLogs((prev) => {
      const quickLogId = `log-quick-${currentMonthKey}`;
      const existingQuick = prev.find((l) => l.id === quickLogId || (l.month === currentMonthKey && l.date === todayIso));
      if (existingQuick) {
        const nextMins = Math.max(0, existingQuick.minutes + deltaMinutes);
        if (nextMins === 0) {
          return prev.filter((l) => l.id !== existingQuick.id);
        }
        return prev.map((l) =>
          l.id === existingQuick.id
            ? { ...l, minutes: nextMins, createdAt: new Date().toISOString() }
            : l
        );
      }
      if (deltaMinutes <= 0) return prev;
      const newQuickLog: MinistryTimeLog = {
        id: quickLogId,
        date: todayIso,
        month: currentMonthKey,
        minutes: deltaMinutes,
        modality: timerState.modality || 'casa_en_casa',
        returnVisitsCount: 0,
        placementsCount: 0,
        notes: 'Registro rápido mensual',
        createdAt: new Date().toISOString(),
      };
      return [newQuickLog, ...prev];
    });
  };

  // Save finished live timer session
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFinishAndSaveSession = () => {
    markLocalMinistryEdit();
    const minutes = Math.max(1, Math.round(displaySeconds / 60));
    const newLog: MinistryTimeLog = {
      id: `log-${Date.now()}`,
      date: todayIso,
      month: todayIso.slice(0, 7),
      minutes,
      modality: timerState.modality,
      returnVisitsCount: timerState.sessionReturnVisits,
      placementsCount: timerState.sessionPlacements,
      notes: timerState.sessionNotes.trim() || `${MODALITY_LABELS[timerState.modality]}`,
      createdAt: new Date().toISOString(),
    };
    setTimeLogs((prev) => [newLog, ...prev]);
    handleResetTimer();
    triggerToast(
      `¡Sesión guardada y sincronizada automáticamente! Se sumaron ${Math.floor(minutes / 60)}h ${minutes % 60}min a tu registro del mes.`
    );
  };

  // Manual Time Log Modal
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [manualDate, setManualDate] = useState(todayIso);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(15);
  const [manualModality, setManualModality] = useState<MinistryTimeLog['modality']>('casa_en_casa');
  const [manualRV, setManualRV] = useState(0);
  const [manualPlacements, setManualPlacements] = useState(0);
  const [manualNotes, setManualNotes] = useState('');

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMins = manualHours * 60 + manualMinutes;
    if (totalMins <= 0) return;

    markLocalMinistryEdit();
    const newLog: MinistryTimeLog = {
      id: `log-${Date.now()}`,
      date: manualDate,
      month: manualDate.slice(0, 7),
      minutes: totalMins,
      modality: manualModality,
      returnVisitsCount: manualRV,
      placementsCount: manualPlacements,
      notes: manualNotes.trim() || MODALITY_LABELS[manualModality],
      createdAt: new Date().toISOString(),
    };

    setTimeLogs((prev) => [newLog, ...prev]);
    setIsManualLogOpen(false);
    setManualNotes('');
    setManualRV(0);
    setManualPlacements(0);
    triggerToast('Registro de tiempo añadido y sincronizado automáticamente.');
  };

  const handleDeleteTimeLog = (id: string) => {
    markLocalMinistryEdit();
    setTimeLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // =========================================================================
  // 3. AGENDA DE REVISITAS (PERSONAS INTERESADAS)
  // =========================================================================
  const DEMO_RETURN_VISITS: ReturnVisitRecord[] = useMemo(
    () => [
      {
        id: 'rv-1',
        name: 'Sra. Elena Morales',
        address: 'Calle Los Pinos #142 (portón café)',
        territoryNumber: '04',
        phone: '+52 55 1234 5678',
        topic: 'La promesa bíblica de un paraíso en la Tierra (Salmo 37:29)',
        pendingQuestion: '¿Cómo sabemos que el Reino de Dios pronto eliminará el sufrimiento?',
        publicationLeft: 'Folleto ¡Disfrute de la vida para siempre!',
        bestTime: 'Miércoles o Sábados 10:30 AM',
        nextVisitDate: todayIso,
        interestLevel: 'alto',
        visitsHistory: [
          {
            id: 'vh-1',
            date: todayIso,
            note: 'Muy amable, aceptó el folleto y le gustó el video ¿Por qué estudiar la Biblia?',
          },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'rv-2',
        name: 'Sr. Roberto Gómez',
        address: 'Av. Central #88, Depto. 3B',
        territoryNumber: '02',
        phone: '',
        topic: 'Consuelo ante la pérdida de un ser querido (Juan 5:28, 29)',
        pendingQuestion: '¿Dónde están los muertos según la Biblia?',
        publicationLeft: 'Tratado ¿Volverán a vivir los muertos?',
        bestTime: 'Domingos después de las 12:00 PM',
        nextVisitDate: todayIso,
        interestLevel: 'medio',
        visitsHistory: [
          {
            id: 'vh-2',
            date: todayIso,
            note: 'Escuchó con atención en la puerta, pidió que regresemos el fin de semana.',
          },
        ],
        createdAt: new Date().toISOString(),
      },
    ],
    [todayIso]
  );

  const [returnVisits, setReturnVisits] = useState<ReturnVisitRecord[]>(() => {
    try {
      const raw = getVaultValue(STORAGE_KEY_RV) || localStorage.getItem(STORAGE_KEY_RV);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (!isDemoMode) {
            return parsed.filter(
              (r: any) =>
                !(r?.id === 'rv-1' && r?.name === 'Sra. Elena Morales') &&
                !(r?.id === 'rv-2' && r?.name === 'Sr. Roberto Gómez')
            );
          }
          return parsed.length > 0 ? parsed : DEMO_RETURN_VISITS;
        }
      }
    } catch {}
    return isDemoMode ? DEMO_RETURN_VISITS : [];
  });

  useEffect(() => {
    setReturnVisits((prev) => {
      if (!isDemoMode) {
        const cleaned = prev.filter(
          (r) =>
            !(r.id === 'rv-1' && r.name === 'Sra. Elena Morales') &&
            !(r.id === 'rv-2' && r.name === 'Sr. Roberto Gómez')
        );
        return cleaned.length !== prev.length ? cleaned : prev;
      }
      return prev.length === 0 ? DEMO_RETURN_VISITS : prev;
    });
  }, [isDemoMode, DEMO_RETURN_VISITS]);

  useEffect(() => {
    try {
      setVaultValue(STORAGE_KEY_RV, JSON.stringify(returnVisits));
    } catch {}
  }, [returnVisits]);

  const [rvSearch, setRvSearch] = useState('');
  const [rvFilter, setRvFilter] = useState<'todas' | 'hoy' | 'alto'>('todas');
  const [isRvModalOpen, setIsRvModalOpen] = useState(false);
  const [editingRv, setEditingRv] = useState<ReturnVisitRecord | null>(null);
  const [rvForm, setRvForm] = useState<{
    name: string;
    address: string;
    territoryNumber: string;
    phone: string;
    topic: string;
    pendingQuestion: string;
    publicationLeft: string;
    bestTime: string;
    nextVisitDate: string;
    interestLevel: 'alto' | 'medio' | 'inicial';
  }>({
    name: '',
    address: '',
    territoryNumber: '',
    phone: '',
    topic: '',
    pendingQuestion: '',
    publicationLeft: 'Folleto ¡Disfrute de la vida para siempre!',
    bestTime: '',
    nextVisitDate: todayIso,
    interestLevel: 'alto',
  });

  const handleOpenNewRv = () => {
    setEditingRv(null);
    setRvForm({
      name: '',
      address: '',
      territoryNumber: '',
      phone: '',
      topic: '',
      pendingQuestion: '',
      publicationLeft: 'Folleto ¡Disfrute de la vida para siempre!',
      bestTime: '',
      nextVisitDate: todayIso,
      interestLevel: 'alto',
    });
    setIsRvModalOpen(true);
  };

  const handleOpenEditRv = (rv: ReturnVisitRecord) => {
    setEditingRv(rv);
    setRvForm({
      name: rv.name,
      address: rv.address,
      territoryNumber: rv.territoryNumber || '',
      phone: rv.phone || '',
      topic: rv.topic,
      pendingQuestion: rv.pendingQuestion,
      publicationLeft: rv.publicationLeft,
      bestTime: rv.bestTime,
      nextVisitDate: rv.nextVisitDate || todayIso,
      interestLevel: rv.interestLevel,
    });
    setIsRvModalOpen(true);
  };

  const handleSaveRv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rvForm.name.trim()) return;

    markLocalMinistryEdit();
    if (editingRv) {
      setReturnVisits((prev) =>
        prev.map((item) =>
          item.id === editingRv.id
            ? {
                ...item,
                ...rvForm,
              }
            : item
        )
      );
      triggerToast('Revisita actualizada correctamente.');
    } else {
      const newRv: ReturnVisitRecord = {
        id: `rv-${Date.now()}`,
        ...rvForm,
        visitsHistory: [
          {
            id: `vh-${Date.now()}`,
            date: todayIso,
            note: rvForm.topic || 'Primera conversación registrada.',
          },
        ],
        createdAt: new Date().toISOString(),
      };
      setReturnVisits((prev) => [newRv, ...prev]);
      triggerToast('Nueva revisita añadida a tu agenda.');
    }
    setIsRvModalOpen(false);
  };

  const handleLogQuickVisitToday = (rvId: string) => {
    markLocalMinistryEdit();
    setReturnVisits((prev) =>
      prev.map((rv) => {
        if (rv.id !== rvId) return rv;
        return {
          ...rv,
          visitsHistory: [
            {
              id: `vh-${Date.now()}`,
              date: todayIso,
              note: `Visita realizada (${todayIso}). Se analizó: ${rv.pendingQuestion || rv.topic}`,
            },
            ...rv.visitsHistory,
          ],
        };
      })
    );
    triggerToast('¡Visita de hoy registrada en el historial de la persona!');
  };

  const handleDeleteRv = (rvId: string) => {
    markLocalMinistryEdit();
    setReturnVisits((prev) => prev.filter((r) => r.id !== rvId));
  };

  // =========================================================================
  // 4. ESTUDIOS BÍBLICOS (CURSOS BÍBLICOS)
  // =========================================================================
  const DEMO_BIBLE_STUDIES: BibleStudyRecord[] = useMemo(
    () => [
      {
        id: 'st-1',
        studentName: 'Familia Hernández (Jorge y Lucía)',
        address: 'Calle Mirador #56',
        phone: '+52 55 9876 5432',
        publication: '¡Disfrute de la vida para siempre! (Libro)',
        currentLesson: 14,
        totalLessons: 60,
        scheduleDay: 'Jueves',
        scheduleTime: '18:00',
        spiritualGoal: 'Asistir a la reunión del fin de semana este mes',
        notes: 'Les gusta mucho ver los videos suplementarios de cada lección.',
        sessionsThisMonth: [todayIso],
        active: true,
        createdAt: new Date().toISOString(),
      },
    ],
    [todayIso]
  );

  const [bibleStudies, setBibleStudies] = useState<BibleStudyRecord[]>(() => {
    try {
      const raw = getVaultValue(STORAGE_KEY_STUDIES) || localStorage.getItem(STORAGE_KEY_STUDIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          if (!isDemoMode) {
            return parsed.filter(
              (s: any) => !(s?.id === 'st-1' && String(s?.studentName || '').includes('Familia Hernández'))
            );
          }
          return parsed.length > 0 ? parsed : DEMO_BIBLE_STUDIES;
        }
      }
    } catch {}
    return isDemoMode ? DEMO_BIBLE_STUDIES : [];
  });

  useEffect(() => {
    setBibleStudies((prev) => {
      if (!isDemoMode) {
        const cleaned = prev.filter(
          (s) => !(s.id === 'st-1' && String(s.studentName || '').includes('Familia Hernández'))
        );
        return cleaned.length !== prev.length ? cleaned : prev;
      }
      return prev.length === 0 ? DEMO_BIBLE_STUDIES : prev;
    });
  }, [isDemoMode, DEMO_BIBLE_STUDIES]);

  useEffect(() => {
    try {
      setVaultValue(STORAGE_KEY_STUDIES, JSON.stringify(bibleStudies));
    } catch {}
  }, [bibleStudies]);

  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<BibleStudyRecord | null>(null);
  const [studyForm, setStudyForm] = useState<{
    studentName: string;
    address: string;
    phone: string;
    publication: string;
    currentLesson: number;
    totalLessons: number;
    scheduleDay: string;
    scheduleTime: string;
    spiritualGoal: string;
    notes: string;
  }>({
    studentName: '',
    address: '',
    phone: '',
    publication: '¡Disfrute de la vida para siempre! (Libro)',
    currentLesson: 1,
    totalLessons: 60,
    scheduleDay: 'Jueves',
    scheduleTime: '18:00',
    spiritualGoal: '',
    notes: '',
  });

  const handleOpenNewStudy = () => {
    setEditingStudy(null);
    setStudyForm({
      studentName: '',
      address: '',
      phone: '',
      publication: '¡Disfrute de la vida para siempre! (Libro)',
      currentLesson: 1,
      totalLessons: 60,
      scheduleDay: 'Jueves',
      scheduleTime: '18:00',
      spiritualGoal: '',
      notes: '',
    });
    setIsStudyModalOpen(true);
  };

  const handleOpenEditStudy = (st: BibleStudyRecord) => {
    setEditingStudy(st);
    setStudyForm({
      studentName: st.studentName,
      address: st.address,
      phone: st.phone || '',
      publication: st.publication,
      currentLesson: st.currentLesson,
      totalLessons: st.totalLessons,
      scheduleDay: st.scheduleDay,
      scheduleTime: st.scheduleTime,
      spiritualGoal: st.spiritualGoal,
      notes: st.notes,
    });
    setIsStudyModalOpen(true);
  };

  const handleSaveStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyForm.studentName.trim()) return;

    markLocalMinistryEdit();
    if (editingStudy) {
      setBibleStudies((prev) =>
        prev.map((s) =>
          s.id === editingStudy.id
            ? {
                ...s,
                ...studyForm,
              }
            : s
        )
      );
      triggerToast('Estudio bíblico actualizado.');
    } else {
      const newStudy: BibleStudyRecord = {
        id: `st-${Date.now()}`,
        ...studyForm,
        sessionsThisMonth: [todayIso],
        active: true,
        createdAt: new Date().toISOString(),
      };
      setBibleStudies((prev) => [newStudy, ...prev]);
      triggerToast('¡Nuevo estudio bíblico registrado!');
    }
    setIsStudyModalOpen(false);
  };

  // Convert Return Visit into a Bible Study in 1 click
  const handleConvertRvToStudy = (rv: ReturnVisitRecord) => {
    markLocalMinistryEdit();
    const newStudy: BibleStudyRecord = {
      id: `st-${Date.now()}`,
      studentName: rv.name,
      address: rv.address,
      phone: rv.phone || '',
      publication: '¡Disfrute de la vida para siempre! (Folleto)',
      currentLesson: 1,
      totalLessons: 3,
      scheduleDay: 'Sábado',
      scheduleTime: '10:30',
      spiritualGoal: 'Completar las primeras 3 lecciones del folleto',
      notes: `Iniciado a partir de revisita. Tema previo: ${rv.topic}`,
      sessionsThisMonth: [todayIso],
      active: true,
      createdAt: new Date().toISOString(),
    };
    setBibleStudies((prev) => [newStudy, ...prev]);
    setActiveSubTab('estudios');
    triggerToast(`¡Qué alegría! ${rv.name} ha pasado a tu lista de Estudios Bíblicos.`);
  };

  const handleUpdateStudyLesson = (studyId: string, delta: number) => {
    markLocalMinistryEdit();
    setBibleStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        const nextLesson = Math.max(1, Math.min(s.totalLessons, s.currentLesson + delta));
        return { ...s, currentLesson: nextLesson };
      })
    );
  };

  const handleMarkStudySessionToday = (studyId: string) => {
    markLocalMinistryEdit();
    setBibleStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        const alreadyHasToday = s.sessionsThisMonth.includes(todayIso);
        if (alreadyHasToday) return s;
        return {
          ...s,
          currentLesson: Math.min(s.totalLessons, s.currentLesson + 1),
          sessionsThisMonth: [todayIso, ...s.sessionsThisMonth],
        };
      })
    );
    triggerToast('¡Sesión de estudio registrada hoy y lección avanzada!');
  };

  const handleDeleteStudy = (studyId: string) => {
    markLocalMinistryEdit();
    setBibleStudies((prev) => prev.filter((s) => s.id !== studyId));
  };

  // =========================================================================
  // 5. CÁLCULO MENSUAL Y SINCRONIZACIÓN AUTOMÁTICA CON INFORME S-4 Y NUBE
  // =========================================================================
  // Existing S-4 report in CongregationContext (con resolución inteligente entre escritorio y móvil)
  const existingS4Report = useMemo(() => {
    const exact = monthlyReports.find(
      (r) => r.publisherId === activePublisherId && r.month === currentMonthKey
    );
    if (exact) return exact;

    const fallbackLocal = monthlyReports.find(
      (r) => r.publisherId === 'pub-local' && r.month === currentMonthKey
    );
    if (fallbackLocal) return fallbackLocal;

    if (
      activeRole === 'coordinador' ||
      activePublisherId.startsWith('pub-coord') ||
      activePublisherId === publishers[0]?.id
    ) {
      const monthCandidates = monthlyReports.filter((r) => r.month === currentMonthKey);
      const coordCandidate = monthCandidates.find(
        (r) =>
          r.publisherId.startsWith('pub-coord') ||
          r.publisherId === publishers[0]?.id ||
          (r.timeLogs && r.timeLogs.length > 0) ||
          (r.totalMinutes && r.totalMinutes > 0)
      );
      if (coordCandidate) return coordCandidate;
    }

    return null;
  }, [monthlyReports, activePublisherId, currentMonthKey, activeRole, publishers]);

  // Hidratación reactiva desde la nube (Supabase / MonthlyServiceReport) para sesión móvil y escritorio
  useEffect(() => {
    if (!existingS4Report) return;

    const cloudUpdatedAt = new Date(
      existingS4Report.updatedAt || existingS4Report.reportedAt || 0
    ).getTime();
    let localUpdatedAt = 0;
    try {
      localUpdatedAt = Number(localStorage.getItem('kongre_ministry_local_updated_at') || 0);
    } catch {}

    const localLogsThisMonth = timeLogs.filter((l) => l.month === currentMonthKey);
    const localTotalMinutes =
      localLogsThisMonth.reduce((acc, l) => acc + (Number(l.minutes) || 0), 0) +
      Math.floor((Number(timerState.accumulatedSeconds) || 0) / 60);

    const cloudTotalMinutes =
      typeof existingS4Report.totalMinutes === 'number'
        ? existingS4Report.totalMinutes
        : (Number(existingS4Report.hours) || 0) * 60 + (Number(existingS4Report.minutes) || 0);

    const shouldHydrateFromCloud =
      (!hasUserEditedRef.current && localTotalMinutes === 0 && (cloudTotalMinutes > 0 || existingS4Report.hourGoal !== undefined)) ||
      (cloudUpdatedAt > localUpdatedAt + 500 && !hasUserEditedRef.current);

    if (!shouldHydrateFromCloud) return;

    if (typeof existingS4Report.hourGoal === 'number' && existingS4Report.hourGoal > 0) {
      setHourGoal(existingS4Report.hourGoal);
      try {
        localStorage.setItem(STORAGE_KEY_GOAL, String(existingS4Report.hourGoal));
      } catch {}
    }

    if (Array.isArray(existingS4Report.timeLogs) && existingS4Report.timeLogs.length > 0) {
      setTimeLogs((prev) => {
        const otherMonths = prev.filter((l) => l.month !== currentMonthKey);
        const next = [...existingS4Report.timeLogs!, ...otherMonths];
        try {
          setVaultValue(STORAGE_KEY_LOGS, JSON.stringify(next));
        } catch {}
        return next;
      });
    } else if (
      cloudTotalMinutes > 0 &&
      localTotalMinutes === 0 &&
      !existingS4Report.activeTimerSeconds
    ) {
      // Si el informe en la nube tenía minutos/horas (ej. 15 min) sin array de logs detallados, sintetizar el registro mensual
      const synthesizedLog: MinistryTimeLog = {
        id: `log-cloud-${currentMonthKey}`,
        date: todayIso,
        month: currentMonthKey,
        minutes: cloudTotalMinutes,
        modality: 'casa_en_casa',
        returnVisitsCount: existingS4Report.returnVisits || 0,
        placementsCount: existingS4Report.placements || 0,
        notes: 'Sincronizado desde mi informe en la nube',
        createdAt: existingS4Report.updatedAt || existingS4Report.reportedAt || new Date().toISOString(),
      };
      setTimeLogs((prev) => {
        const otherMonths = prev.filter((l) => l.month !== currentMonthKey);
        const next = [synthesizedLog, ...otherMonths];
        try {
          setVaultValue(STORAGE_KEY_LOGS, JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    if (
      typeof existingS4Report.activeTimerSeconds === 'number' ||
      typeof existingS4Report.activeTimerRunning === 'boolean'
    ) {
      setTimerState((prev) => ({
        ...prev,
        accumulatedSeconds:
          typeof existingS4Report.activeTimerSeconds === 'number'
            ? existingS4Report.activeTimerSeconds
            : prev.accumulatedSeconds,
        isRunning:
          typeof existingS4Report.activeTimerRunning === 'boolean'
            ? existingS4Report.activeTimerRunning
            : prev.isRunning,
        startedAt:
          existingS4Report.activeTimerStartedAt !== undefined
            ? existingS4Report.activeTimerStartedAt
            : prev.startedAt,
        modality: existingS4Report.activeTimerModality || prev.modality,
        sessionReturnVisits:
          typeof existingS4Report.activeTimerReturnVisits === 'number'
            ? existingS4Report.activeTimerReturnVisits
            : prev.sessionReturnVisits,
        sessionPlacements:
          typeof existingS4Report.activeTimerPlacements === 'number'
            ? existingS4Report.activeTimerPlacements
            : prev.sessionPlacements,
        sessionNotes:
          typeof existingS4Report.activeTimerNotes === 'string'
            ? existingS4Report.activeTimerNotes
            : prev.sessionNotes,
      }));
    }

    if (
      Array.isArray(existingS4Report.returnVisitRecords) &&
      existingS4Report.returnVisitRecords.length > 0
    ) {
      setReturnVisits(existingS4Report.returnVisitRecords);
    }

    if (
      Array.isArray(existingS4Report.bibleStudyRecords) &&
      existingS4Report.bibleStudyRecords.length > 0
    ) {
      setBibleStudies(existingS4Report.bibleStudyRecords);
    }

    if (cloudUpdatedAt > 0) {
      try {
        localStorage.setItem('kongre_ministry_local_updated_at', String(cloudUpdatedAt));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kongre_ministry_data_changed'));
    }
  }, [existingS4Report, currentMonthKey, todayIso]);

  const monthSummary = useMemo(() => {
    const logsThisMonth = timeLogs.filter((l) => l.month === currentMonthKey);
    const loggedMinutes = logsThisMonth.reduce((acc, l) => acc + (Number(l.minutes) || 0), 0);
    const activeTimerMinutes = Math.floor(displaySeconds / 60);
    const rawTotalMinutes = loggedMinutes + activeTimerMinutes;

    const cloudFallbackMinutes = existingS4Report
      ? typeof existingS4Report.totalMinutes === 'number'
        ? existingS4Report.totalMinutes
        : (Number(existingS4Report.hours) || 0) * 60 + (Number(existingS4Report.minutes) || 0)
      : 0;

    const totalMinutes =
      rawTotalMinutes > 0 || hasUserEditedRef.current ? rawTotalMinutes : cloudFallbackMinutes;
    const fullHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalReturnVisitsLogged =
      logsThisMonth.reduce((acc, l) => acc + (Number(l.returnVisitsCount) || 0), 0) +
      (timerState.sessionReturnVisits || 0);
    const totalPlacementsLogged =
      logsThisMonth.reduce((acc, l) => acc + (Number(l.placementsCount) || 0), 0) +
      (timerState.sessionPlacements || 0);

    // Active bible studies conducted at least once in currentMonthKey
    const activeStudiesThisMonth = bibleStudies.filter((s) =>
      s.sessionsThisMonth.some((d) => d.startsWith(currentMonthKey))
    ).length;

    const totalStudiesCount = Math.max(
      activeStudiesThisMonth,
      bibleStudies.length,
      existingS4Report?.bibleStudies || 0
    );
    const progressPct =
      hourGoal > 0 ? Math.min(100, Math.round((totalMinutes / (hourGoal * 60)) * 100)) : 100;

    const remainingGoalTotalMinutes = Math.max(0, hourGoal * 60 - totalMinutes);
    const remainingGoalHours = Math.floor(remainingGoalTotalMinutes / 60);
    const remainingGoalMinutes = remainingGoalTotalMinutes % 60;

    return {
      logsThisMonth,
      loggedMinutes,
      activeTimerMinutes,
      totalMinutes,
      fullHours,
      remainingMinutes,
      totalReturnVisitsLogged,
      totalPlacementsLogged,
      totalStudiesCount,
      progressPct,
      remainingGoalHours,
      remainingGoalMinutes,
    };
  }, [
    timeLogs,
    currentMonthKey,
    bibleStudies,
    hourGoal,
    displaySeconds,
    timerState.sessionReturnVisits,
    timerState.sessionPlacements,
    existingS4Report,
  ]);

  const [s4Notes, setS4Notes] = useState(() => existingS4Report?.notes || '');
  const [s4Participated, setS4Participated] = useState(true);

  const availableServiceYears = useMemo(() => getAvailableServiceYears(), []);
  const [selectedServiceYear, setSelectedServiceYear] = useState<string>('2025-2026');

  // Cálculo del Historial Mes a Mes (Año de Servicio Sep - Ago) y Meta Anual de Horas
  const serviceYearSummary = useMemo(() => {
    const monthsList = getServiceYearMonths(selectedServiceYear);
    const isRegularPioneer =
      activePublisher?.privilege === 'precursor_regular' ||
      activePublisher?.pioneerStatus === 'regular';
    const isSpecialPioneer =
      activePublisher?.privilege === 'precursor_especial' ||
      activePublisher?.pioneerStatus === 'especial';

    const annualGoalHours = isSpecialPioneer
      ? 1200
      : isRegularPioneer
      ? 600
      : hourGoal * 12;

    let totalHoursYear = 0;
    let totalMinutesExtraYear = 0;
    let totalStudiesYear = 0;
    let monthsParticipated = 0;

    const rows = monthsList.map((m) => {
      const isCurrentMonth = m.monthKey === currentMonthKey;
      const rep = monthlyReports.find(
        (r) =>
          (r.publisherId === activePublisherId || r.publisherId === 'pub-local') &&
          r.month === m.monthKey
      );

      const logsForMonth = timeLogs.filter((l) => l.month === m.monthKey);
      const localMins = logsForMonth.reduce((acc, l) => acc + (Number(l.minutes) || 0), 0);

      const hoursVal = isCurrentMonth
        ? Math.max(monthSummary.fullHours, rep?.hours || 0)
        : rep?.hours !== undefined
        ? rep.hours
        : localMins > 0
        ? Math.floor(localMins / 60)
        : undefined;

      const minsVal = isCurrentMonth
        ? monthSummary.remainingMinutes
        : rep?.minutes || (localMins > 0 ? localMins % 60 : 0);

      const studiesVal = isCurrentMonth
        ? Math.max(monthSummary.totalStudiesCount, rep?.bibleStudies || 0)
        : rep?.bibleStudies || 0;

      const participated = isCurrentMonth
        ? s4Participated || monthSummary.totalMinutes > 0 || Boolean(rep?.participated)
        : Boolean(rep?.participated) || (hoursVal !== undefined && hoursVal > 0);

      if (participated) {
        monthsParticipated++;
        totalHoursYear += hoursVal || 0;
        totalMinutesExtraYear += minsVal || 0;
        totalStudiesYear += studiesVal || 0;
      }

      return {
        ...m,
        isCurrentMonth,
        participated,
        hasRecord: Boolean(rep) || isCurrentMonth || localMins > 0,
        hours: hoursVal,
        minutes: minsVal,
        bibleStudies: studiesVal,
        isAuxiliaryPioneer: Boolean(rep?.isAuxiliaryPioneer),
        notes: isCurrentMonth ? s4Notes || rep?.notes || '' : rep?.notes || '',
      };
    });

    totalHoursYear += Math.floor(totalMinutesExtraYear / 60);
    const remainingYearMinutes = totalMinutesExtraYear % 60;
    const avgMonthlyHours =
      monthsParticipated > 0 ? Math.round((totalHoursYear / monthsParticipated) * 10) / 10 : 0;
    const annualProgressPct =
      annualGoalHours > 0 ? Math.min(100, Math.round((totalHoursYear / annualGoalHours) * 100)) : 0;
    const remainingAnnualHours = Math.max(0, annualGoalHours - totalHoursYear);

    return {
      rows,
      annualGoalHours,
      isRegularPioneer,
      isSpecialPioneer,
      totalHoursYear,
      remainingYearMinutes,
      totalStudiesYear,
      monthsParticipated,
      avgMonthlyHours,
      annualProgressPct,
      remainingAnnualHours,
    };
  }, [
    selectedServiceYear,
    activePublisher,
    hourGoal,
    currentMonthKey,
    monthlyReports,
    activePublisherId,
    timeLogs,
    monthSummary,
    s4Participated,
    s4Notes,
  ]);

  // Estado para seleccionar y editar cualquier mes del historial anual (por defecto el mes actual)
  const [selectedHistoryMonthKey, setSelectedHistoryMonthKey] = useState<string>(currentMonthKey);
  const selectedHistoryRow = useMemo(() => {
    return (
      serviceYearSummary.rows.find((r) => r.monthKey === selectedHistoryMonthKey) ||
      serviceYearSummary.rows.find((r) => r.isCurrentMonth) ||
      serviceYearSummary.rows[0]
    );
  }, [serviceYearSummary.rows, selectedHistoryMonthKey]);

  const [historyFormParticipated, setHistoryFormParticipated] = useState<boolean>(true);
  const [historyFormHours, setHistoryFormHours] = useState<number>(monthSummary.fullHours);
  const [historyFormMinutes, setHistoryFormMinutes] = useState<number>(monthSummary.remainingMinutes);
  const [historyFormStudies, setHistoryFormStudies] = useState<number>(monthSummary.totalStudiesCount);
  const [historyFormAuxPioneer, setHistoryFormAuxPioneer] = useState<boolean>(false);
  const [historyFormNotes, setHistoryFormNotes] = useState<string>(existingS4Report?.notes || '');

  useEffect(() => {
    if (!selectedHistoryRow) return;
    if (selectedHistoryRow.isCurrentMonth) {
      setHistoryFormParticipated(s4Participated || monthSummary.totalMinutes > 0);
      setHistoryFormHours(monthSummary.fullHours);
      setHistoryFormMinutes(monthSummary.remainingMinutes);
      setHistoryFormStudies(monthSummary.totalStudiesCount);
      setHistoryFormAuxPioneer(Boolean(selectedHistoryRow.isAuxiliaryPioneer));
      setHistoryFormNotes(s4Notes || selectedHistoryRow.notes || '');
    } else {
      setHistoryFormParticipated(Boolean(selectedHistoryRow.participated));
      setHistoryFormHours(selectedHistoryRow.hours ?? 0);
      setHistoryFormMinutes(selectedHistoryRow.minutes ?? 0);
      setHistoryFormStudies(selectedHistoryRow.bibleStudies ?? 0);
      setHistoryFormAuxPioneer(Boolean(selectedHistoryRow.isAuxiliaryPioneer));
      setHistoryFormNotes(selectedHistoryRow.notes || '');
    }
  }, [
    selectedHistoryRow?.monthKey,
    selectedHistoryRow?.isCurrentMonth,
    monthSummary.fullHours,
    monthSummary.remainingMinutes,
    monthSummary.totalStudiesCount,
    monthSummary.totalMinutes,
    s4Participated,
    s4Notes,
  ]);

  const handleSaveSelectedHistoryMonth = () => {
    if (!selectedHistoryRow) return;
    markLocalMinistryEdit();

    if (selectedHistoryRow.isCurrentMonth) {
      setS4Participated(historyFormParticipated);
      setS4Notes(historyFormNotes);
      // Si el usuario ajustó manualmente las horas del mes actual por encima o debajo del cronómetro,
      // sincronizamos la diferencia como ajuste en el mes actual
      const targetTotalMins = historyFormHours * 60 + historyFormMinutes;
      const diffMins = targetTotalMins - monthSummary.totalMinutes;
      if (diffMins !== 0) {
        const adjLog: MinistryTimeLog = {
          id: `log-adj-${Date.now()}`,
          date: todayIso,
          month: currentMonthKey,
          minutes: diffMins,
          modality: 'casa_en_casa',
          returnVisitsCount: 0,
          placementsCount: 0,
          notes: 'Ajuste manual en Historial Mensual',
          createdAt: new Date().toISOString(),
        };
        setTimeLogs((prev) => [adjLog, ...prev]);
      }

      const nowIso = new Date().toISOString();
      const baseReport = buildCurrentMonthlyReport();
      const updatedCurrentReport: MonthlyServiceReport = {
        ...baseReport,
        participated: historyFormParticipated,
        hours: historyFormHours,
        minutes: historyFormMinutes,
        totalMinutes: targetTotalMins,
        bibleStudies: historyFormStudies,
        isAuxiliaryPioneer: historyFormAuxPioneer,
        notes: historyFormNotes.trim() || undefined,
        updatedAt: nowIso,
      };
      updateMonthlyReport(updatedCurrentReport);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kongre_ministry_data_changed'));
        window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
      }
      triggerToast(
        `¡Mes de ${selectedHistoryRow.monthName} ${selectedHistoryRow.year} guardado (${historyFormHours}h ${historyFormMinutes}m)!`
      );
      return;
    }

    // Guardar cualquier otro mes del año de servicio
    const existingRepForMonth = monthlyReports.find(
      (r) =>
        (r.publisherId === activePublisherId || r.publisherId === 'pub-local') &&
        r.month === selectedHistoryRow.monthKey
    );
    const nowIso = new Date().toISOString();
    const isPioneer =
      activePublisher?.privilege === 'precursor_regular' ||
      activePublisher?.pioneerStatus === 'regular' ||
      activePublisher?.pioneerStatus === 'especial';

    const savedMonthReport: MonthlyServiceReport = {
      id: existingRepForMonth?.id || `rep-${activePublisherId}-${selectedHistoryRow.monthKey}`,
      publisherId: activePublisherId,
      month: selectedHistoryRow.monthKey,
      participated: historyFormParticipated,
      hours: historyFormParticipated ? historyFormHours : 0,
      minutes: historyFormParticipated ? historyFormMinutes : 0,
      totalMinutes: historyFormParticipated ? historyFormHours * 60 + historyFormMinutes : 0,
      hourGoal,
      bibleStudies: historyFormParticipated ? historyFormStudies : 0,
      isPioneer: Boolean(isPioneer),
      isAuxiliaryPioneer: historyFormAuxPioneer,
      notes: historyFormNotes.trim() || undefined,
      reportedAt: existingRepForMonth?.reportedAt || nowIso,
      updatedAt: nowIso,
    };

    updateMonthlyReport(savedMonthReport);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kongre_ministry_data_changed'));
      window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
    }
    triggerToast(
      `¡Historial de ${selectedHistoryRow.monthName} ${selectedHistoryRow.year} actualizado correctamente!`
    );
  };

  const handleShareSelectedMonthWhatsApp = () => {
    if (!selectedHistoryRow) return;
    const pubName = activePublisher?.name || currentBrotherName || 'Publicador';
    const timeLabel =
      historyFormMinutes > 0
        ? `${historyFormHours} h ${historyFormMinutes} min`
        : `${historyFormHours} h`;
    const text =
      `*Resumen Mensual de Ministerio* 📋\n` +
      `👤 *Hermano(a):* ${pubName}\n` +
      `📅 *Mes:* ${selectedHistoryRow.monthName} ${selectedHistoryRow.year}\n` +
      `✅ *Participó en el ministerio:* ${historyFormParticipated ? 'Sí' : 'No'}\n` +
      (historyFormParticipated ? `⏱️ *Tiempo:* ${timeLabel}\n` : '') +
      (historyFormParticipated ? `📖 *Cursos bíblicos:* ${historyFormStudies}\n` : '') +
      (historyFormAuxPioneer ? `🌟 *Modalidad:* Precursor Auxiliar\n` : '') +
      (historyFormNotes.trim() ? `📝 *Notas:* ${historyFormNotes.trim()}\n` : '') +
      `\n_Enviado desde Mi Ministerio • Kongre_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const buildCurrentMonthlyReport = (): MonthlyServiceReport => {
    const isPioneer =
      activePublisher?.privilege === 'precursor_regular' ||
      activePublisher?.pioneerStatus === 'regular' ||
      activePublisher?.pioneerStatus === 'especial';
    const isAux =
      activePublisher?.privilege === 'precursor_auxiliar' ||
      activePublisher?.pioneerStatus === 'auxiliar_continuo';

    const nowIso = new Date().toISOString();

    return {
      id: existingS4Report?.id || `rep-${activePublisherId}-${currentMonthKey}`,
      publisherId: activePublisherId,
      month: currentMonthKey,
      participated: s4Participated || monthSummary.totalMinutes > 0,
      hours: monthSummary.fullHours,
      minutes: monthSummary.remainingMinutes,
      totalMinutes: monthSummary.totalMinutes,
      hourGoal,
      returnVisits: Math.max(returnVisits.length, monthSummary.totalReturnVisitsLogged),
      placements: monthSummary.totalPlacementsLogged,
      bibleStudies: monthSummary.totalStudiesCount,
      activeTimerSeconds: timerState.accumulatedSeconds,
      activeTimerRunning: timerState.isRunning,
      activeTimerStartedAt: timerState.startedAt,
      activeTimerModality: timerState.modality,
      activeTimerReturnVisits: timerState.sessionReturnVisits,
      activeTimerPlacements: timerState.sessionPlacements,
      activeTimerNotes: timerState.sessionNotes,
      timeLogs: monthSummary.logsThisMonth,
      returnVisitRecords: returnVisits,
      bibleStudyRecords: bibleStudies,
      notes:
        s4Notes.trim() ||
        (monthSummary.remainingMinutes > 0
          ? `Tiempo registrado: ${monthSummary.fullHours}h ${monthSummary.remainingMinutes}min (Meta: ${hourGoal}h).`
          : undefined),
      reportedAt: nowIso,
      updatedAt: nowIso,
      isPioneer: Boolean(isPioneer),
      isAuxiliaryPioneer: Boolean(isAux),
    };
  };

  // Guardado y sincronización AUTOMÁTICA en mi informe y en la nube ante cualquier cambio de tiempo, meta, revisitas o estudios
  useEffect(() => {
    if (!hasUserEditedRef.current) return;

    const signature = JSON.stringify({
      publisherId: activePublisherId,
      month: currentMonthKey,
      totalMinutes: monthSummary.totalMinutes,
      hourGoal,
      logsLen: monthSummary.logsThisMonth.length,
      accSecs: timerState.accumulatedSeconds,
      isRunning: timerState.isRunning,
      startedAt: timerState.startedAt,
      modality: timerState.modality,
      sessRv: timerState.sessionReturnVisits,
      sessPl: timerState.sessionPlacements,
      sessNotes: timerState.sessionNotes,
      rvLen: returnVisits.length,
      studiesLen: bibleStudies.length,
      studiesCount: monthSummary.totalStudiesCount,
      s4Notes: s4Notes.trim(),
      s4Participated,
    });

    if (signature === lastAutoSavedSignatureRef.current) return;
    lastAutoSavedSignatureRef.current = signature;

    const report = buildCurrentMonthlyReport();
    updateMonthlyReport(report);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kongre_ministry_data_changed'));
    }
  }, [
    activePublisherId,
    currentMonthKey,
    monthSummary.totalMinutes,
    monthSummary.logsThisMonth,
    monthSummary.totalStudiesCount,
    hourGoal,
    timerState.accumulatedSeconds,
    timerState.isRunning,
    timerState.startedAt,
    timerState.modality,
    timerState.sessionReturnVisits,
    timerState.sessionPlacements,
    timerState.sessionNotes,
    returnVisits,
    bibleStudies,
    s4Notes,
    s4Participated,
  ]);

  const handleSyncAndSubmitS4 = () => {
    markLocalMinistryEdit();
    // Si hay tiempo en pausa en el cronómetro, consolidarlo también en el registro mensual
    if (!timerState.isRunning && displaySeconds >= 60) {
      const minutes = Math.max(1, Math.round(displaySeconds / 60));
      const newLog: MinistryTimeLog = {
        id: `log-${Date.now()}`,
        date: todayIso,
        month: currentMonthKey,
        minutes,
        modality: timerState.modality,
        returnVisitsCount: timerState.sessionReturnVisits,
        placementsCount: timerState.sessionPlacements,
        notes: timerState.sessionNotes.trim() || `${MODALITY_LABELS[timerState.modality]}`,
        createdAt: new Date().toISOString(),
      };
      const updatedLogs = [newLog, ...timeLogs];
      setTimeLogs(updatedLogs);
      setTimerState({
        isRunning: false,
        startedAt: null,
        accumulatedSeconds: 0,
        modality: 'casa_en_casa',
        sessionReturnVisits: 0,
        sessionPlacements: 0,
        sessionNotes: '',
      });
    }

    const report = buildCurrentMonthlyReport();
    lastAutoSavedSignatureRef.current = JSON.stringify({
      publisherId: activePublisherId,
      month: currentMonthKey,
      totalMinutes: report.totalMinutes,
      hourGoal,
      logsLen: report.timeLogs?.length || 0,
      accSecs: 0,
      rvLen: returnVisits.length,
      studiesLen: bibleStudies.length,
      studiesCount: report.bibleStudies,
      s4Notes: s4Notes.trim(),
      s4Participated,
    });
    updateMonthlyReport(report);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kongre_ministry_data_changed'));
      window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
    }
    triggerToast(
      `¡Informe S-4 sincronizado en la nube (${monthSummary.fullHours}h ${monthSummary.remainingMinutes}min)! Ya está disponible en tu sesión móvil.`
    );
  };

  const handleShareS4WhatsApp = () => {
    const pubName = activePublisher?.name || currentBrotherName || 'Publicador';
    const timeLabel =
      monthSummary.remainingMinutes > 0
        ? `${monthSummary.fullHours} h ${monthSummary.remainingMinutes} min`
        : `${monthSummary.fullHours} h`;
    const text =
      `*Informe de Servicio del Campo (S-4)* 📋\n` +
      `👤 *Hermano(a):* ${pubName}\n` +
      `📅 *Mes:* ${currentMonthLabel}\n` +
      `✅ *Participé en el ministerio:* Sí\n` +
      `⏱️ *Tiempo:* ${timeLabel}\n` +
      `📖 *Cursos bíblicos:* ${monthSummary.totalStudiesCount}\n` +
      `🏠 *Revisitas registradas:* ${returnVisits.length}\n` +
      (s4Notes.trim() ? `📝 *Notas:* ${s4Notes.trim()}\n` : '') +
      `\n_Enviado desde Mi Ministerio • Kongre_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered Return Visits
  const filteredReturnVisits = useMemo(() => {
    return returnVisits.filter((rv) => {
      if (rvFilter === 'hoy' && rv.nextVisitDate > todayIso) return false;
      if (rvFilter === 'alto' && rv.interestLevel !== 'alto') return false;
      if (!rvSearch.trim()) return true;
      const q = rvSearch.toLowerCase();
      return (
        rv.name.toLowerCase().includes(q) ||
        rv.address.toLowerCase().includes(q) ||
        rv.topic.toLowerCase().includes(q) ||
        (rv.territoryNumber || '').toLowerCase().includes(q)
      );
    });
  }, [returnVisits, rvFilter, rvSearch, todayIso]);

  // Upcoming assignments for current publisher
  const myUpcomingAssignments = useMemo(() => {
    if (!activePublisherId) return [];
    const list: Array<{
      id: string;
      date: string;
      title: string;
      meeting: string;
      room?: string;
    }> = [];

    weeks.slice(0, 4).forEach((w) => {
      if (w.midweek.presidentId === activePublisherId) {
        list.push({ id: `p-${w.id}`, date: w.midweek.date, title: 'Presidente de Reunión', meeting: 'Entre Semana' });
      }
      if (w.midweek.tesoros.discurso.publisherId === activePublisherId) {
        list.push({ id: `td-${w.id}`, date: w.midweek.date, title: w.midweek.tesoros.discurso.title, meeting: 'Tesoros de la Biblia' });
      }
      if (w.midweek.tesoros.perlas.publisherId === activePublisherId) {
        list.push({ id: `tp-${w.id}`, date: w.midweek.date, title: 'Busquemos perlas escondidas', meeting: 'Tesoros de la Biblia' });
      }
      if (w.midweek.tesoros.lecturaBiblia.publisherId === activePublisherId) {
        list.push({ id: `tl-${w.id}`, date: w.midweek.date, title: 'Lectura de la Biblia', meeting: 'Sala Principal' });
      }
      w.midweek.maestros.items.forEach((m) => {
        if (m.publisherId === activePublisherId || m.assistantId === activePublisherId) {
          list.push({
            id: `m-${m.id}`,
            date: w.midweek.date,
            title: `${m.publisherId === activePublisherId ? 'Titular' : 'Ayudante'}: ${m.title}`,
            meeting: 'Seamos Mejores Maestros',
          });
        }
      });
      w.midweek.vidaCristiana.items.forEach((v) => {
        if (v.publisherId === activePublisherId) {
          list.push({ id: `v-${v.id}`, date: w.midweek.date, title: v.title, meeting: 'Nuestra Vida Cristiana' });
        }
      });
    });
    return list;
  }, [weeks, activePublisherId]);

  const { hrs, mins, secs } = formatTimerHMS(displaySeconds);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-lg shadow-emerald-600/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="p-1 rounded-lg hover:bg-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjetas de Mi Ministerio o Barra de Sección Activa con «← Todas las tarjetas» */}
      {(() => {
        const timeSummaryStr =
          monthSummary.fullHours > 0
            ? monthSummary.remainingMinutes > 0
              ? `${monthSummary.fullHours}h ${monthSummary.remainingMinutes}m`
              : `${monthSummary.fullHours}h`
            : monthSummary.remainingMinutes > 0
            ? `${monthSummary.remainingMinutes}m`
            : '0h';

        const ministryCards: {
          id: Exclude<MinistrySubTab, 'tarjetas' | 'cronometro'>;
          title: string;
          shortLabel: string;
          subtitle: string;
          summary: string;
          statusText: string;
          icon: React.ElementType;
          iconBg: string;
          iconColor: string;
          onSelect: () => void;
        }[] = [
          {
            id: 'resumen',
            title: 'Cronómetro y Mes Actual',
            shortLabel: 'Cronómetro',
            subtitle: 'Cronómetro de predicación en vivo, registro de sesiones diarias y progreso hacia tu meta mensual.',
            summary: `Tiempo este mes: ${timeSummaryStr} · Meta: ${hourGoal}h`,
            statusText: timerState.isRunning ? 'En curso' : 'Abrir cronómetro',
            icon: Timer,
            iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            onSelect: () => {
              setActiveSubTab('resumen');
              setActiveTab('inicio');
            },
          },
          {
            id: 'revisitas',
            title: 'Agenda de Revisitas',
            shortLabel: 'Revisitas',
            subtitle: 'Personas interesadas, direcciones, temas conversados, preguntas pendientes y fechas de visita.',
            summary: `${returnVisits.length} revisita(s) registrada(s)`,
            statusText: 'Ver revisitas',
            icon: MapPin,
            iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            onSelect: () => {
              setActiveSubTab('revisitas');
              setActiveTab('revisitas');
            },
          },
          {
            id: 'estudios',
            title: 'Cursos Bíblicos (Estudios)',
            shortLabel: 'Estudios',
            subtitle: 'Seguimiento de estudiantes de la Biblia, publicación, lección actual y metas espirituales.',
            summary: `${bibleStudies.length} curso(s) bíblico(s) activo(s)`,
            statusText: 'Ver estudios',
            icon: BookOpen,
            iconBg: 'bg-amber-50 dark:bg-amber-950/60',
            iconColor: 'text-amber-600 dark:text-amber-400',
            onSelect: () => {
              setActiveSubTab('estudios');
              setActiveTab('estudios_biblicos');
            },
          },
          {
            id: 'informe',
            title: 'Historial Mensual e Informe S-4',
            shortLabel: 'Historial S-4',
            subtitle: 'Resumen anual por año de servicio, envío de informe S-4 a la congregación y respaldo por WhatsApp.',
            summary: `${serviceYearSummary.totalHoursYear}h acumuladas en el año de servicio`,
            statusText: 'Ver historial',
            icon: History,
            iconBg: 'bg-purple-50 dark:bg-purple-950/60',
            iconColor: 'text-purple-600 dark:text-purple-400',
            onSelect: () => {
              setActiveSubTab('informe');
            },
          },
        ];

        const normalizedActiveId = activeSubTab === 'cronometro' ? 'resumen' : activeSubTab;
        const activeCardMeta = ministryCards.find((c) => c.id === normalizedActiveId);

        if (activeSubTab === 'tarjetas') {
          return (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="px-1 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    Secciones de Mi Ministerio Personal
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Selecciona una tarjeta para entrar en la herramienta de predicación correspondiente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ministryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={card.onSelect}
                      className="group text-left kg-card-bento p-5 sm:p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer kg-sheen-top hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 active:scale-[0.99]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className={`w-12 h-12 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-xs`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:translate-x-0.5 transition-all">
                            <span>{card.statusText}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-extrabold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {card.title}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-zinc-100 dark:border-white/10 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
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
          <div className="kg-glass-surface kg-sheen-top p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setActiveSubTab('tarjetas')}
                className="px-3.5 py-2 rounded-xl bg-zinc-100/80 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-100 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 border border-zinc-200/60 dark:border-white/10 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Todas las tarjetas</span>
              </button>

              {activeCardMeta && (
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
                    {activeCardMeta.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden sm:block">
                    {activeCardMeta.summary}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
              {ministryCards.map((sc) => {
                const ScIcon = sc.icon;
                const isCurr = sc.id === normalizedActiveId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={sc.onSelect}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 ${
                      isCurr
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 border border-white/20'
                        : 'bg-zinc-100/60 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/10 border border-transparent'
                    }`}
                    title={sc.title}
                  >
                    <ScIcon className={`w-3.5 h-3.5 shrink-0 ${sc.id === 'resumen' && timerState.isRunning ? 'animate-spin' : ''}`} />
                    <span>{sc.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          3. CONTENIDO: PANEL PRINCIPAL (RESUMEN + CRONÓMETRO EN VIVO + ACCESOS)
         ========================================================================= */}
      {(activeSubTab === 'resumen' || activeSubTab === 'cronometro') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
          {/* Izquierda: Cronómetro de Predicación en Vivo con Anillo Circular */}
          <div className="lg:col-span-7 flex flex-col">
            <MinistryStopwatchDial
              displaySeconds={displaySeconds}
              isRunning={timerState.isRunning}
              startedAt={timerState.startedAt}
              modality={timerState.modality}
              onStartPause={handleStartPauseTimer}
              onFinish={handleFinishAndSaveSession}
              onReset={handleResetTimer}
              onAdjustMinutes={handleAdjustTimerMinutes}
              sessionReturnVisits={timerState.sessionReturnVisits}
              onUpdateReturnVisits={(updater) => {
                markLocalMinistryEdit();
                setTimerState((prev) => ({
                  ...prev,
                  sessionReturnVisits:
                    typeof updater === 'function' ? updater(prev.sessionReturnVisits) : updater,
                }));
              }}
              sessionPlacements={timerState.sessionPlacements}
              onUpdatePlacements={(updater) => {
                markLocalMinistryEdit();
                setTimerState((prev) => ({
                  ...prev,
                  sessionPlacements:
                    typeof updater === 'function' ? updater(prev.sessionPlacements) : updater,
                }));
              }}
              sessionNotes={timerState.sessionNotes}
              onUpdateSessionNotes={(notes) => {
                markLocalMinistryEdit();
                setTimerState((prev) => ({
                  ...prev,
                  sessionNotes: notes,
                }));
              }}
              onUpdateModality={(newModality) => {
                markLocalMinistryEdit();
                setTimerState((prev) => ({
                  ...prev,
                  modality: newModality,
                }));
              }}
              onOpenManualLog={() => setIsManualLogOpen(true)}
              modalityLabels={MODALITY_LABELS}
              loggedMinutesThisMonth={monthSummary.loggedMinutes}
              hourGoal={hourGoal}
            />
          </div>

          {/* Derecha: Resumen del Mes y Meta de Horas */}
          <div className="lg:col-span-5 kg-glass-surface kg-sheen-top rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 relative overflow-hidden shadow-sm">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-3 border-b border-zinc-200/60 dark:border-white/10">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      Resumen de {currentMonthLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Autoguardado
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white mt-1 tracking-tight truncate">
                    Mi Meta y Registro Mensual
                  </h3>
                </div>
                <select
                  value={hourGoal}
                  onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                  className="w-full sm:w-auto max-w-full text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-white/10 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-white/10 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                  title="Configurar meta de horas del mes"
                >
                  <option value={10}>Meta: 10 h (Personal)</option>
                  <option value={15}>Meta: 15 h (Prec. Auxiliar)</option>
                  <option value={30}>Meta: 30 h (Prec. Auxiliar)</option>
                  <option value={50}>Meta: 50 h (Prec. Regular)</option>
                  <option value={100}>Meta: 100 h (Prec. Especial)</option>
                </select>
              </div>

              {/* Barra de Progreso de Horas */}
              <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 shadow-2xs space-y-3">
                <div className="flex items-baseline justify-between flex-wrap gap-1">
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-white tracking-tight">
                      {monthSummary.fullHours} <span className="text-lg font-bold text-zinc-500 dark:text-zinc-400">h</span>
                    </span>
                    <span className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-zinc-500 dark:text-zinc-400 ml-1.5">
                      {monthSummary.remainingMinutes} min
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono tabular-nums px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {monthSummary.progressPct}% de {hourGoal} h
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-zinc-200/70 dark:bg-white/10 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, monthSummary.progressPct)}%` }}
                  />
                </div>

                {/* Controles rápidos de ajuste de tiempo mensual (+15m, +30m, +1h, -5m) con autoguardado en la nube */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                    Sumar al mes:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustMonthlyMinutes(-5)}
                      className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-rose-500/10 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200/80 dark:border-white/10 text-[10px] font-bold font-mono tabular-nums transition-all cursor-pointer active:scale-95"
                      title="Restar 5 minutos al registro mensual"
                    >
                      -5m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustMonthlyMinutes(15)}
                      className="px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 text-[10px] font-bold font-mono tabular-nums transition-all cursor-pointer active:scale-95"
                      title="Sumar 15 minutos al registro mensual"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustMonthlyMinutes(30)}
                      className="px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 text-[10px] font-bold font-mono tabular-nums transition-all cursor-pointer active:scale-95"
                      title="Sumar 30 minutos al registro mensual"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustMonthlyMinutes(60)}
                      className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xs border border-white/20 text-[10px] font-bold font-mono tabular-nums transition-all cursor-pointer active:scale-95 kg-sheen-top"
                      title="Sumar 1 hora al registro mensual"
                    >
                      +1h
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-0.5">
                  <span>
                    {monthSummary.totalMinutes >= hourGoal * 60
                      ? '¡Meta alcanzada! 🎉'
                      : monthSummary.remainingGoalMinutes > 0
                        ? `Faltan ${monthSummary.remainingGoalHours}h ${monthSummary.remainingGoalMinutes}m para meta`
                        : `Faltan ${monthSummary.remainingGoalHours} h para meta`}
                  </span>
                  <span className="font-mono tabular-nums font-semibold">{monthSummary.logsThisMonth.length} salidas</span>
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-white/10 text-[10px]">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                    Meta Anual ({selectedServiceYear}):{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                      {serviceYearSummary.totalHoursYear} / {serviceYearSummary.annualGoalHours} h ({serviceYearSummary.annualProgressPct}%)
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('informe')}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Ver historial</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 3 Mini-Tarjetas: Revisitas, Estudios, Publicaciones (estilo Bento) */}
              <div className="grid grid-cols-3 gap-2.5 mt-3">
                <div
                  onClick={() => setActiveSubTab('revisitas')}
                  className="p-3 rounded-2xl kg-card-bento cursor-pointer hover:border-teal-500/40 hover:-translate-y-0.5 transition-all duration-200 group/bento"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shadow-xs shadow-teal-500/50 shrink-0" />
                    Revisitas
                  </span>
                  <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white mt-1 block">
                    {returnVisits.length}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                    En agenda
                  </span>
                </div>

                <div
                  onClick={() => setActiveSubTab('estudios')}
                  className="p-3 rounded-2xl kg-card-bento cursor-pointer hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 group/bento"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50 shrink-0" />
                    Estudios
                  </span>
                  <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white mt-1 block">
                    {bibleStudies.length}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                    Cursos activos
                  </span>
                </div>

                <div
                  onClick={() => setActiveSubTab('informe')}
                  className="p-3 rounded-2xl kg-card-bento cursor-pointer hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 group/bento"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500/50 shrink-0" />
                    Publicac.
                  </span>
                  <span className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-white mt-1 block">
                    {monthSummary.totalPlacementsLogged}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate">
                    Este mes
                  </span>
                </div>
              </div>
            </div>

            {/* Botón directo de envío de Informe S-4 */}
            <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSyncAndSubmitS4}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 border border-white/20 transition-all duration-200 cursor-pointer active:scale-95 kg-sheen-top"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Guardar en mi Informe S-4</span>
              </button>
              <button
                type="button"
                onClick={handleShareS4WhatsApp}
                className="py-3 px-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 backdrop-blur-xs"
                title="Enviar informe por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Sesiones de Tiempo */}
      {(activeSubTab === 'resumen' || activeSubTab === 'cronometro') && (
        <div className="kg-glass-surface kg-sheen-top rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Registro Diario de Salidas ({currentMonthLabel})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Historial detallado de tus sesiones de predicación registradas este mes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsManualLogOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Salida Anterior</span>
            </button>
          </div>

          {monthSummary.logsThisMonth.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white/40 dark:bg-white/[0.02] rounded-2xl border border-zinc-200/80 dark:border-white/10">
              Aún no has guardado sesiones de predicación este mes. ¡Usa el cronómetro arriba o añade tiempo manualmente!
            </div>
          ) : (
            <div className="space-y-2.5">
              {monthSummary.logsThisMonth.map((log) => {
                const h = Math.floor(log.minutes / 60);
                const m = log.minutes % 60;
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3 flex-wrap shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-mono tabular-nums font-extrabold text-xs shadow-xs shrink-0">
                        {h > 0 ? `${h}h ` : ''}
                        {m > 0 || h === 0 ? `${m}m` : ''}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white">
                            {MODALITY_LABELS[log.modality]}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">{log.date}</span>
                          {log.returnVisitsCount > 0 && (
                            <span className="text-[10px] font-bold font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {log.returnVisitsCount} revisitas
                            </span>
                          )}
                          {log.placementsCount > 0 && (
                            <span className="text-[10px] font-bold font-mono tabular-nums px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              {log.placementsCount} pub.
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTimeLog(log.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          4. VISTA RÁPIDA DE REVISITAS Y ESTUDIOS EN EL PANEL PRINCIPAL
         ========================================================================= */}
      {(activeSubTab === 'resumen' || activeSubTab === 'cronometro') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Revisitas Recientes / Para Hoy */}
          <div className="lg:col-span-6 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-[#27272A] shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5] truncate">
                    Mis Revisitas y Personas Interesadas
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                    Seguimiento de territorio personal y conversaciones
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenNewRv}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Nueva</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('revisitas')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] hover:text-emerald-600 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  Ver todas (<span className="font-mono tabular-nums">{returnVisits.length}</span>)
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {returnVisits.slice(0, 3).map((rv) => (
                <div
                  key={rv.id}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/60 dark:border-[#27272A] flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                        <span>{rv.name}</span>
                        {rv.territoryNumber && (
                          <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                            Terr. {rv.territoryNumber}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{rv.address}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLogQuickVisitToday(rv.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition cursor-pointer shrink-0"
                    >
                      ✓ Visité hoy
                    </button>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-[#F4F4F5] bg-white dark:bg-[#121216] p-2 rounded-lg border border-zinc-200/50 dark:border-[#27272A]">
                    <strong className="text-emerald-600 dark:text-emerald-400">Tema:</strong> {rv.topic}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Estudios Bíblicos y Mis Próximas Asignaciones */}
          <div className="lg:col-span-6 space-y-4">
            {/* Estudios Bíblicos */}
            <div className="bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-[#27272A] shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-[#F4F4F5] truncate">
                      Mis Estudios Bíblicos
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                      Progreso de lecciones y sesiones del mes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenNewStudy}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Nuevo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('estudios')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] hover:text-amber-600 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                  >
                    Ver (<span className="font-mono tabular-nums">{bibleStudies.length}</span>)
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {bibleStudies.map((st) => {
                  const pct = Math.min(100, Math.round((st.currentLesson / st.totalLessons) * 100));
                  return (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/60 dark:border-[#27272A] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                            {st.studentName}
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                            {st.publication} • <strong>Lección <span className="font-mono tabular-nums">{st.currentLesson}</span> de <span className="font-mono tabular-nums">{st.totalLessons}</span></strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMarkStudySessionToday(st.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#27272A] dark:hover:bg-[#323238] border border-zinc-200 dark:border-[#3E3E42] text-zinc-800 dark:text-zinc-200 text-[11px] font-medium transition cursor-pointer shrink-0"
                        >
                          ✓ Estudié hoy
                        </button>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272A] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Accesos Rápidos del Publicador */}
            <div className="bg-white dark:bg-[#121216] rounded-2xl p-5 border border-zinc-200 dark:border-[#27272A] shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA] mb-3">
                Herramientas de la Congregación para Publicadores
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('mi_vista')}
                  className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-zinc-200/60 dark:border-[#27272A] text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">Mis Asignaciones</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('territorios')}
                  className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-zinc-200/60 dark:border-[#27272A] text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer transition-colors"
                >
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">Territorios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('carritos')}
                  className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-zinc-200/60 dark:border-[#27272A] text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer transition-colors"
                >
                  <Compass className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate">Turnos Carritos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tablero_anuncios')}
                  className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-zinc-200/60 dark:border-[#27272A] text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">Anuncios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('precursores_auxiliares')}
                  className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-zinc-200/60 dark:border-[#27272A] text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] cursor-pointer transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">Prec. Auxiliar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('grupos_servicio')}
                  className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer transition-colors"
                >
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Grupos Servicio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. CONTENIDO COMPLETO: AGENDA DE REVISITAS (`revisitas`)
         ========================================================================= */}
      {activeSubTab === 'revisitas' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#121216] p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>Agenda de Revisitas y Personas Interesadas</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Anota direcciones, preguntas pendientes, publicaciones dejadas y convierte revisitas en cursos bíblicos
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewRv}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Revisita</span>
            </button>
          </div>

          {/* Buscador y Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rvSearch}
                onChange={(e) => setRvSearch(e.target.value)}
                placeholder="Buscar por nombre, calle, territorio o tema conversado..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-xs font-medium text-zinc-900 dark:text-[#F4F4F5] focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: 'todas', label: `Todas (${returnVisits.length})` },
                { id: 'hoy', label: 'Para visitar hoy' },
                { id: 'alto', label: 'Mucho interés' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRvFilter(f.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    rvFilter === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200 dark:border-[#27272A]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Tarjetas de Revisitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReturnVisits.map((rv) => (
              <div
                key={rv.id}
                className="bg-white dark:bg-[#18181F] rounded-2xl p-5 border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                          {rv.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            rv.interestLevel === 'alto'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : rv.interestLevel === 'medio'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-[#18181F] dark:text-[#F4F4F5] border border-zinc-200/60 dark:border-[#27272A]'
                          }`}
                        >
                          Interés {rv.interestLevel}
                        </span>
                        {rv.territoryNumber && (
                          <span className="text-[10px] font-bold font-mono tabular-nums px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                            Territorio #{rv.territoryNumber}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{rv.address}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRv(rv)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer"
                        title="Editar revisita"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRv(rv.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Eliminar revisita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#121216] border border-zinc-100 dark:border-[#27272A] space-y-1.5 text-xs">
                    <p className="text-zinc-700 dark:text-[#F4F4F5]">
                      <strong className="text-emerald-600 dark:text-emerald-400">Tema conversado:</strong>{' '}
                      {rv.topic}
                    </p>
                    {rv.pendingQuestion && (
                      <p className="text-zinc-700 dark:text-[#F4F4F5]">
                        <strong className="text-indigo-600 dark:text-indigo-400">Pregunta pendiente:</strong>{' '}
                        {rv.pendingQuestion}
                      </p>
                    )}
                    {rv.publicationLeft && (
                      <p className="text-zinc-500 dark:text-[#A1A1AA]">
                        <strong>Publicación / Video:</strong> {rv.publicationLeft}
                      </p>
                    )}
                    {rv.bestTime && (
                      <p className="text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Horario: {rv.bestTime}</span>
                      </p>
                    )}
                  </div>

                  {/* Última nota del historial */}
                  {rv.visitsHistory.length > 0 && (
                    <div className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] px-1">
                      <span className="font-bold text-zinc-700 dark:text-[#F4F4F5]">
                        Visitas (<span className="font-mono tabular-nums">{rv.visitsHistory.length}</span>):
                      </span>{' '}
                      Última el <span className="font-mono tabular-nums">{rv.visitsHistory[0].date}</span> — &ldquo;{rv.visitsHistory[0].note}&rdquo;
                    </div>
                  )}
                </div>

                {/* Acciones de la tarjeta de Revisita */}
                <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLogQuickVisitToday(rv.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Registrar visita hoy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConvertRvToStudy(rv)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#27272A] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Convertir esta revisita en un Estudio Bíblico activo"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Pasar a Estudio</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {rv.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rv.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#121216] border border-zinc-200/70 dark:border-[#27272A] text-zinc-600 dark:text-[#A1A1AA]"
                        title="Abrir dirección en Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {rv.phone && (
                      <a
                        href={`https://wa.me/${rv.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. CONTENIDO COMPLETO: ESTUDIOS BÍBLICOS (`estudios`)
         ========================================================================= */}
      {activeSubTab === 'estudios' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#121216] p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>Mis Estudios Bíblicos (Cursos Bíblicos)</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Lleva el avance por lección de ¡Disfrute de la vida para siempre!, sesiones del mes y metas espirituales
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewStudy}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Estudio Bíblico</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bibleStudies.map((st) => {
              const pct = Math.min(100, Math.round((st.currentLesson / st.totalLessons) * 100));
              const monthSessions = st.sessionsThisMonth.filter((d) =>
                d.startsWith(currentMonthKey)
              );

              return (
                <div
                  key={st.id}
                  className="bg-white dark:bg-[#18181F] rounded-2xl p-5 border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-mono tabular-nums">
                          {st.scheduleDay} • {st.scheduleTime}
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-[#F4F4F5] mt-1">
                          {st.studentName}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{st.address || 'Dirección registrada'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStudy(st)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-[#121216] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudy(st.id)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progreso de Lección */}
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121216] border border-zinc-100 dark:border-[#27272A] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] block">
                            {st.publication}
                          </span>
                          <span className="text-sm font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">
                            Lección {st.currentLesson} de {st.totalLessons} ({pct}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStudyLesson(st.id, -1)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-bold cursor-pointer font-mono tabular-nums"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStudyLesson(st.id, 1)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold cursor-pointer font-mono tabular-nums shadow-xs"
                          >
                            +1 Lección
                          </button>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272A] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {st.spiritualGoal && (
                      <p className="text-xs text-zinc-700 dark:text-[#F4F4F5] bg-zinc-50 dark:bg-[#18181F] p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                        <strong className="text-zinc-900 dark:text-white">Meta espiritual:</strong>{' '}
                        {st.spiritualGoal}
                      </p>
                    )}

                    {st.notes && (
                      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] px-1">
                        <strong>Notas:</strong> {st.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleMarkStudySessionToday(st.id)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar estudio realizado hoy</span>
                    </button>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      {monthSessions.length} {monthSessions.length === 1 ? 'sesión' : 'sesiones'} este mes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
      {/* =========================================================================
          7. CONTENIDO COMPLETO REDISEÑADO: HISTORIAL MENSUAL Y META ANUAL (`informe`)
         ========================================================================= */}
      {activeSubTab === 'informe' && (
        <div className="w-full space-y-4 sm:space-y-5">
          {/* 1. CABECERA Y TARJETA DE META ANUAL DEL AÑO DE SERVICIO (SEPTIEMBRE - AGOSTO) */}
          <div className="bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-[#27272A] shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-zinc-100 dark:border-[#27272A]">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    <Target className="w-3 h-3" /> Año de Servicio (Septiembre – Agosto)
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA]">
                    {serviceYearSummary.isRegularPioneer
                      ? 'Precursor Regular (Meta oficial: 600 h/año)'
                      : serviceYearSummary.isSpecialPioneer
                      ? 'Precursor Especial (Meta oficial: 1200 h/año)'
                      : `Meta personal: ${hourGoal} h al mes (${serviceYearSummary.annualGoalHours} h al año)`}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-zinc-900 dark:text-[#F4F4F5] mt-1">
                  Mi Historial Mensual y Meta Anual de Horas
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Consulta tu avance mes a mes, ajusta tu meta de horas y toca cualquier mes para editarlo o enviarlo por WhatsApp.
                </p>
              </div>

              {/* Selectores rápidos: Meta Mensual/Anual y Año de Servicio */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#18181F] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA]">Mi Meta:</span>
                  <select
                    value={hourGoal}
                    onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                    className="bg-transparent text-xs font-extrabold text-zinc-900 dark:text-[#F4F4F5] focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10 h/mes (120 h/año)</option>
                    <option value={15}>15 h/mes (Auxiliar)</option>
                    <option value={30}>30 h/mes (Auxiliar)</option>
                    <option value={50}>50 h/mes (600 h/año)</option>
                    <option value={100}>100 h/mes (1200 h/año)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#18181F] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-[#A1A1AA]">Periodo:</span>
                  <select
                    value={selectedServiceYear}
                    onChange={(e) => {
                      const nextYr = e.target.value;
                      setSelectedServiceYear(nextYr);
                      const monthsInNextYr = getServiceYearMonths(nextYr);
                      const hasCurrent = monthsInNextYr.some((m) => m.monthKey === currentMonthKey);
                      setSelectedHistoryMonthKey(
                        hasCurrent ? currentMonthKey : monthsInNextYr[0]?.monthKey || currentMonthKey
                      );
                    }}
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

            {/* Resumen Visual de la Meta Anual (4 tarjetas limpias + Barra de Progreso) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Horas en el Año
                </span>
                <div className="flex items-baseline gap-1.5 mt-1 font-mono tabular-nums">
                  <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5]">
                    {serviceYearSummary.totalHoursYear} h
                  </span>
                  <span className="text-xs font-bold text-zinc-500 dark:text-[#A1A1AA]">
                    / {serviceYearSummary.annualGoalHours} h
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block font-mono tabular-nums">
                  {serviceYearSummary.annualProgressPct}% de tu meta anual
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                  Promedio por Mes
                </span>
                <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] mt-1 font-mono tabular-nums">
                  {serviceYearSummary.avgMonthlyHours} h
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 block font-mono tabular-nums">
                  Meta mensual: {hourGoal} h/mes
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                  Meses Informados
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tabular-nums">
                  {serviceYearSummary.monthsParticipated}{' '}
                  <span className="text-xs font-bold text-zinc-400">de 12</span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 block">
                  Septiembre a Agosto
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] block">
                  Faltan para la Meta
                </span>
                <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] mt-1 font-mono tabular-nums">
                  {serviceYearSummary.remainingAnnualHours === 0
                    ? '¡Lograda! 🎉'
                    : `${serviceYearSummary.remainingAnnualHours} h`}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] mt-0.5 block font-mono tabular-nums">
                  {serviceYearSummary.totalStudiesYear} estudios en el año
                </span>
              </div>
            </div>

            {/* Barra de progreso anual */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-zinc-600 dark:text-[#A1A1AA]">
                  Avance acumulado del año de servicio {selectedServiceYear}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                  {serviceYearSummary.totalHoursYear} h completadas ({serviceYearSummary.annualProgressPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-[#18181F] overflow-hidden p-0.5 border border-zinc-200/60 dark:border-[#27272A]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${serviceYearSummary.annualProgressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. PANEL DIVIDIDO: MIS 12 MESES DEL AÑO (IZQUIERDA) + DETALLE Y ENVÍO DEL MES SELECCIONADO (DERECHA) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* IZQUIERDA (7 cols): LISTA VISUAL INTERACTIVA DE LOS 12 MESES */}
            <div className="lg:col-span-7 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-[#27272A] shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-[#27272A]">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                    Mis 12 Meses ({selectedServiceYear})
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                    Toca cualquier mes de la lista para ver o editar tus horas, estudios y notas.
                  </p>
                </div>
                {selectedHistoryMonthKey !== currentMonthKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServiceYear('2025-2026');
                      setSelectedHistoryMonthKey(currentMonthKey);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 transition cursor-pointer shrink-0"
                  >
                    Ir al mes actual
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {serviceYearSummary.rows.map((row) => {
                  const isSelected = row.monthKey === selectedHistoryRow?.monthKey;
                  const rowHours = row.hours ?? 0;
                  const monthGoalPct =
                    hourGoal > 0 ? Math.min(100, Math.round((rowHours / hourGoal) * 100)) : 0;

                  return (
                    <button
                      key={row.monthKey}
                      type="button"
                      onClick={() => setSelectedHistoryMonthKey(row.monthKey)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                          : row.isCurrentMonth
                          ? 'bg-zinc-50/90 dark:bg-[#18181F]/90 border-indigo-200 dark:border-indigo-800/70 hover:border-indigo-400'
                          : 'bg-white dark:bg-[#18181F] border-zinc-200/80 dark:border-[#27272A] hover:bg-zinc-50 dark:hover:bg-[#18181F]/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                              {row.monthName}
                            </span>
                            <span className="text-[11px] font-semibold text-zinc-400 font-mono tabular-nums">
                              {row.year}
                            </span>
                            {row.isCurrentMonth && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                                Actual
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {row.participated ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Participó
                              </span>
                            ) : row.hasRecord ? (
                              <span className="text-[10px] font-bold text-rose-500">
                                Sin actividad
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-zinc-400">
                                Sin registro aún
                              </span>
                            )}
                            {row.isAuxiliaryPioneer && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                                Auxiliar
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                            {row.hours !== undefined ? `${row.hours} h` : '0 h'}
                            {row.minutes > 0 && (
                              <span className="text-[10px] font-bold text-zinc-400 ml-0.5">
                                {row.minutes}m
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-[#A1A1AA] block font-mono tabular-nums">
                            {row.bibleStudies > 0 ? `${row.bibleStudies} est.` : '0 est.'}
                          </span>
                        </div>
                      </div>

                      {/* Mini barra de progreso frente a la meta mensual */}
                      <div className="w-full space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-[#27272A] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              monthGoalPct >= 100
                                ? 'bg-emerald-500'
                                : row.participated
                                ? 'bg-indigo-500'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                            style={{ width: `${row.participated ? Math.max(6, monthGoalPct) : 0}%` }}
                          />
                        </div>
                        {row.notes && (
                          <p className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] truncate">
                            {row.notes}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DERECHA (5 cols): EDITOR SIMPLE Y ENVÍO DEL MES SELECCIONADO */}
            {selectedHistoryRow && (
              <div className="lg:col-span-5 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-[#27272A] shadow-2xs space-y-4 lg:sticky lg:top-20">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-[#27272A]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {selectedHistoryRow.isCurrentMonth
                          ? 'Mes en Curso (Sincronizado con Cronómetro)'
                          : 'Edición de Mes del Historial'}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-[#F4F4F5] mt-0.5">
                      {selectedHistoryRow.monthName} <span className="font-mono tabular-nums">{selectedHistoryRow.year}</span>
                    </h4>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                      selectedHistoryRow.participated
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                        : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] border border-zinc-200/60 dark:border-[#27272A]'
                    }`}
                  >
                    {selectedHistoryRow.participated ? 'Mes Activo' : 'Pendiente'}
                  </span>
                </div>

                {/* Paso 1: ¿Participaste en el ministerio este mes? */}
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] cursor-pointer">
                  <div className="pr-3">
                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-[#F4F4F5] block">
                      Participé en la predicación este mes
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-[#A1A1AA]">
                      Marca esta casilla si predicaste en {selectedHistoryRow.monthName}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={historyFormParticipated}
                    onChange={(e) => setHistoryFormParticipated(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                  />
                </label>

                {/* Paso 2: Horas y Estudios del Mes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Control de Horas */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5]">
                        Horas del Mes
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        Meta: {hourGoal}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHistoryFormHours((h) => Math.max(0, h - 1))}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-black hover:bg-zinc-100 dark:hover:bg-[#27272A] cursor-pointer"
                      >
                        -
                      </button>
                      <div className="flex items-baseline gap-1 font-mono tabular-nums">
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={historyFormHours}
                          onChange={(e) =>
                            setHistoryFormHours(Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-14 text-center text-lg font-black py-0.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums"
                        />
                        <span className="text-xs font-bold text-zinc-400">h</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryFormHours((h) => h + 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-black hover:bg-zinc-100 dark:hover:bg-[#27272A] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    {historyFormMinutes > 0 && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block text-center font-mono tabular-nums">
                        + {historyFormMinutes} min acumulados
                      </span>
                    )}
                  </div>

                  {/* Control de Cursos Bíblicos */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5]">
                        Cursos Bíblicos
                      </span>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Diferentes
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHistoryFormStudies((s) => Math.max(0, s - 1))}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-black hover:bg-zinc-100 dark:hover:bg-[#27272A] cursor-pointer"
                      >
                        -
                      </button>
                      <div className="flex items-baseline gap-1 font-mono tabular-nums">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={historyFormStudies}
                          onChange={(e) =>
                            setHistoryFormStudies(Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-14 text-center text-lg font-black py-0.5 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setHistoryFormStudies((s) => s + 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-black hover:bg-zinc-100 dark:hover:bg-[#27272A] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-400 block text-center">
                      Estudios dirigidos en el mes
                    </span>
                  </div>
                </div>

                {/* Paso 3: Precursor Auxiliar en este mes */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                      Hice el Precursorado Auxiliar este mes
                    </span>
                    <span className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                      Marca si serviste como precursor auxiliar (meta de 15 h o 30 h)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={historyFormAuxPioneer}
                    onChange={(e) => setHistoryFormAuxPioneer(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                  />
                </label>

                {/* Paso 4: Notas del mes */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] mb-1">
                    Notas o comentarios del mes (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={historyFormNotes}
                    onChange={(e) => setHistoryFormNotes(e.target.value)}
                    placeholder="Ej. Precursor auxiliar de 15h, horas en campaña especial..."
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-xs text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Botones de Acción del Mes */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSelectedHistoryMonth}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar {selectedHistoryRow.monthName} en mi Historial</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareSelectedMonthWhatsApp}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar {selectedHistoryRow.monthName} por WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AÑADIR SALIDA / TIEMPO MANUALMENTE
         ========================================================================= */}
      {isManualLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-md w-full p-6 border border-zinc-200 dark:border-[#27272A] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                Añadir Tiempo de Ministerio
              </h3>
              <button
                type="button"
                onClick={() => setIsManualLogOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Fecha de la salida
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-bold font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-sm font-mono tabular-nums font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-sm font-mono tabular-nums font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Modalidad
                </label>
                <select
                  value={manualModality}
                  onChange={(e) => setManualModality(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {Object.entries(MODALITY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ej. Predicación con el grupo 2"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualLogOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200/70 dark:hover:bg-[#27272A] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Guardar Tiempo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NUEVA / EDITAR REVISITA
         ========================================================================= */}
      {isRvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-[#27272A] shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                {editingRv ? 'Editar Revisita' : 'Registrar Nueva Revisita'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRvModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRv} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Nombre o Descripción de la Persona *
                  </label>
                  <input
                    type="text"
                    required
                    value={rvForm.name}
                    onChange={(e) => setRvForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Sra. María (casa portón verde)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Territorio #
                  </label>
                  <input
                    type="text"
                    value={rvForm.territoryNumber}
                    onChange={(e) => setRvForm((p) => ({ ...p, territoryNumber: e.target.value }))}
                    placeholder="Ej. 04"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Dirección o Referencia
                  </label>
                  <input
                    type="text"
                    value={rvForm.address}
                    onChange={(e) => setRvForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Calle, número y referencia"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={rvForm.phone}
                    onChange={(e) => setRvForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Tema conversado
                </label>
                <input
                  type="text"
                  value={rvForm.topic}
                  onChange={(e) => setRvForm((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="Ej. La esperanza de la resurrección (Juan 5:28, 29)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Pregunta pendiente para la próxima visita
                </label>
                <input
                  type="text"
                  value={rvForm.pendingQuestion}
                  onChange={(e) => setRvForm((p) => ({ ...p, pendingQuestion: e.target.value }))}
                  placeholder="Ej. ¿Por qué permite Dios el sufrimiento?"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Publicación o Video dejado
                  </label>
                  <input
                    type="text"
                    value={rvForm.publicationLeft}
                    onChange={(e) => setRvForm((p) => ({ ...p, publicationLeft: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Día y hora en que se le encuentra
                  </label>
                  <input
                    type="text"
                    value={rvForm.bestTime}
                    onChange={(e) => setRvForm((p) => ({ ...p, bestTime: e.target.value }))}
                    placeholder="Ej. Sábados 10:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRvModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200/70 dark:hover:bg-[#27272A] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Guardar Revisita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NUEVO / EDITAR ESTUDIO BÍBLICO
         ========================================================================= */}
      {isStudyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#121216] rounded-2xl max-w-lg w-full p-6 border border-zinc-200 dark:border-[#27272A] shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                {editingStudy ? 'Editar Estudio Bíblico' : 'Registrar Nuevo Estudio Bíblico'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStudyModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudy} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Nombre del Estudiante *
                </label>
                <input
                  type="text"
                  required
                  value={studyForm.studentName}
                  onChange={(e) => setStudyForm((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder="Ej. Carlos Méndez"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={studyForm.address}
                    onChange={(e) => setStudyForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Calle y número"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={studyForm.phone}
                    onChange={(e) => setStudyForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Publicación de Estudio
                </label>
                <select
                  value={studyForm.publication}
                  onChange={(e) => {
                    const pub = PUBLICATIONS_CATALOG.find((c) => c.title === e.target.value);
                    setStudyForm((p) => ({
                      ...p,
                      publication: e.target.value,
                      totalLessons: pub ? pub.lessons : p.totalLessons,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {PUBLICATIONS_CATALOG.map((c) => (
                    <option key={c.title} value={c.title}>
                      {c.title} ({c.lessons} lecciones)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Lección Actual
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={studyForm.totalLessons}
                    value={studyForm.currentLesson}
                    onChange={(e) =>
                      setStudyForm((p) => ({ ...p, currentLesson: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-bold font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Día habitual
                  </label>
                  <input
                    type="text"
                    value={studyForm.scheduleDay}
                    onChange={(e) => setStudyForm((p) => ({ ...p, scheduleDay: e.target.value }))}
                    placeholder="Ej. Jueves"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={studyForm.scheduleTime}
                    onChange={(e) => setStudyForm((p) => ({ ...p, scheduleTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#F4F4F5] block mb-1">
                  Próxima Meta Espiritual del Estudiante
                </label>
                <input
                  type="text"
                  value={studyForm.spiritualGoal}
                  onChange={(e) => setStudyForm((p) => ({ ...p, spiritualGoal: e.target.value }))}
                  placeholder="Ej. Asistir a su primera reunión en el Salón del Reino"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-[#F4F4F5] text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] text-xs font-bold text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200/70 dark:hover:bg-[#27272A] cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Guardar Estudio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
