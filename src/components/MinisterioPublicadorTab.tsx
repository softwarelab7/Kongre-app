// src/components/MinisterioPublicadorTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

export type MinistrySubTab =
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
  } = useCongregation();

  const { currentPublisherId, currentBrotherName } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<MinistrySubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Identify current publisher profile
  const activePublisherId = useMemo(() => {
    if (currentPublisherId && publishersMap.has(currentPublisherId)) {
      return currentPublisherId;
    }
    const saved = localStorage.getItem('kongre_current_publisher_id_v2');
    if (saved && publishersMap.has(saved)) return saved;
    if (currentBrotherName) {
      const match = publishers.find(
        (p) => p.name.toLowerCase().trim() === currentBrotherName.toLowerCase().trim()
      );
      if (match) return match.id;
    }
    return publishers[0]?.id || 'pub-local';
  }, [currentPublisherId, currentBrotherName, publishers, publishersMap]);

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

  // Save timer state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TIMER, JSON.stringify(timerState));
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
  const [timeLogs, setTimeLogs] = useState<MinistryTimeLog[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
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
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(timeLogs));
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
    setHourGoal(newGoal);
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, String(newGoal));
    } catch {}
  };

  // Save finished live timer session
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFinishAndSaveSession = () => {
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
      `¡Sesión guardada! Se sumaron ${Math.floor(minutes / 60)}h ${minutes % 60}min a tu registro del mes.`
    );
  };

  // Manual Time Log Modal
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [manualDate, setManualDate] = useState(todayIso);
  const [manualHours, setManualHours] = useState(2);
  const [manualMinutes, setManualMinutes] = useState(0);
  const [manualModality, setManualModality] = useState<MinistryTimeLog['modality']>('casa_en_casa');
  const [manualRV, setManualRV] = useState(0);
  const [manualPlacements, setManualPlacements] = useState(0);
  const [manualNotes, setManualNotes] = useState('');

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMins = manualHours * 60 + manualMinutes;
    if (totalMins <= 0) return;

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
    triggerToast('Registro de tiempo añadido correctamente.');
  };

  const handleDeleteTimeLog = (id: string) => {
    setTimeLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // =========================================================================
  // 3. AGENDA DE REVISITAS (PERSONAS INTERESADAS)
  // =========================================================================
  const [returnVisits, setReturnVisits] = useState<ReturnVisitRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RV);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
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
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RV, JSON.stringify(returnVisits));
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
    setReturnVisits((prev) => prev.filter((r) => r.id !== rvId));
  };

  // =========================================================================
  // 4. ESTUDIOS BÍBLICOS (CURSOS BÍBLICOS)
  // =========================================================================
  const [bibleStudies, setBibleStudies] = useState<BibleStudyRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
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
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDIES, JSON.stringify(bibleStudies));
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
    setBibleStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        const nextLesson = Math.max(1, Math.min(s.totalLessons, s.currentLesson + delta));
        return { ...s, currentLesson: nextLesson };
      })
    );
  };

  const handleMarkStudySessionToday = (studyId: string) => {
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
    setBibleStudies((prev) => prev.filter((s) => s.id !== studyId));
  };

  // =========================================================================
  // 5. CÁLCULO MENSUAL Y SINCRONIZACIÓN CON INFORME S-4
  // =========================================================================
  const monthSummary = useMemo(() => {
    const logsThisMonth = timeLogs.filter((l) => l.month === currentMonthKey);
    const totalMinutes = logsThisMonth.reduce((acc, l) => acc + l.minutes, 0);
    const fullHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalReturnVisitsLogged = logsThisMonth.reduce((acc, l) => acc + l.returnVisitsCount, 0);
    const totalPlacementsLogged = logsThisMonth.reduce((acc, l) => acc + l.placementsCount, 0);

    // Active bible studies conducted at least once in currentMonthKey
    const activeStudiesThisMonth = bibleStudies.filter((s) =>
      s.sessionsThisMonth.some((d) => d.startsWith(currentMonthKey))
    ).length;

    const totalStudiesCount = Math.max(activeStudiesThisMonth, bibleStudies.length);
    const progressPct = hourGoal > 0 ? Math.min(100, Math.round((totalMinutes / (hourGoal * 60)) * 100)) : 100;

    return {
      logsThisMonth,
      totalMinutes,
      fullHours,
      remainingMinutes,
      totalReturnVisitsLogged,
      totalPlacementsLogged,
      totalStudiesCount,
      progressPct,
    };
  }, [timeLogs, currentMonthKey, bibleStudies, hourGoal]);

  // Existing S-4 report in CongregationContext
  const existingS4Report = useMemo(() => {
    return (
      monthlyReports.find(
        (r) => r.publisherId === activePublisherId && r.month === currentMonthKey
      ) || null
    );
  }, [monthlyReports, activePublisherId, currentMonthKey]);

  const [s4Notes, setS4Notes] = useState(() => existingS4Report?.notes || '');
  const [s4Participated, setS4Participated] = useState(true);

  const handleSyncAndSubmitS4 = () => {
    const isPioneer =
      activePublisher?.privilege === 'precursor_regular' ||
      activePublisher?.pioneerStatus === 'regular' ||
      activePublisher?.pioneerStatus === 'especial';
    const isAux =
      activePublisher?.privilege === 'precursor_auxiliar' ||
      activePublisher?.pioneerStatus === 'auxiliar_continuo';

    const report: MonthlyServiceReport = {
      id: existingS4Report?.id || `rep-${activePublisherId}-${currentMonthKey}`,
      publisherId: activePublisherId,
      month: currentMonthKey,
      participated: s4Participated || monthSummary.totalMinutes > 0,
      hours: monthSummary.fullHours,
      bibleStudies: monthSummary.totalStudiesCount,
      notes:
        s4Notes.trim() ||
        (monthSummary.remainingMinutes > 0
          ? `Quedan ${monthSummary.remainingMinutes} min acumulados para el próximo mes.`
          : undefined),
      reportedAt: new Date().toISOString(),
      isPioneer: Boolean(isPioneer),
      isAuxiliaryPioneer: Boolean(isAux),
    };

    updateMonthlyReport(report);
    triggerToast('¡Informe S-4 sincronizado y enviado a la Secretaría de la congregación!');
  };

  const handleShareS4WhatsApp = () => {
    const pubName = activePublisher?.name || currentBrotherName || 'Publicador';
    const text =
      `*Informe de Servicio del Campo (S-4)* 📋\n` +
      `👤 *Hermano(a):* ${pubName}\n` +
      `📅 *Mes:* ${currentMonthLabel}\n` +
      `✅ *Participé en el ministerio:* Sí\n` +
      `⏱️ *Horas:* ${monthSummary.fullHours}\n` +
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in select-none">
      {/* =========================================================================
          1. CABECERA PRINCIPAL: MI MINISTERIO (MENÚ PRINCIPAL DE PUBLICADORES)
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                Menú Principal • Publicador
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {currentMonthLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
              Mi Ministerio y Actividad Personal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {activePublisher?.name || currentBrotherName || 'Publicador'} • Cronómetro de predicación, revisitas, estudios bíblicos e informe S-4
            </p>
          </div>
        </div>

        {/* Botones rápidos a Mis Asignaciones y a Panorama General */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('mi_vista')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mis Asignaciones</span>
            {myUpcomingAssignments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-600 text-white">
                {myUpcomingAssignments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('panorama_general')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Abrir el Panorama General y estadísticas de la congregación"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
            <span>Panorama General</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>

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

      {/* =========================================================================
          2. BARRA DE NAVEGACIÓN DE FUNCIONES PARA PUBLICADORES
         ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('resumen')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'resumen'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Panel Principal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cronometro')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'cronometro'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Timer className={`w-4 h-4 shrink-0 ${timerState.isRunning ? 'text-emerald-500 animate-spin' : ''}`} />
          <span>Cronómetro</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300">
            {monthSummary.fullHours}h
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('revisitas')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'revisitas'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>Revisitas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300">
            {returnVisits.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('estudios')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'estudios'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Estudios</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300">
            {bibleStudies.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('informe')}
          className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'informe'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Informe S-4</span>
          {existingS4Report && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Informe guardado" />
          )}
        </button>
      </div>

      {/* =========================================================================
          3. CONTENIDO: PANEL PRINCIPAL (RESUMEN + CRONÓMETRO EN VIVO + ACCESOS)
         ========================================================================= */}
      {(activeSubTab === 'resumen' || activeSubTab === 'cronometro') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Izquierda: Cronómetro de Predicación en Vivo */}
          <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-indigo-500/20 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    timerState.isRunning
                      ? 'bg-emerald-400 animate-ping'
                      : displaySeconds > 0
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                  {timerState.isRunning
                    ? 'Cronómetro de Ministerio en Curso'
                    : displaySeconds > 0
                    ? 'Sesión en Pausa'
                    : 'Cronómetro para Llevar el Tiempo'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsManualLogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-indigo-100 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Horas Manualmente</span>
              </button>
            </div>

            {/* Dígitos grandes del cronómetro */}
            <div className="py-3 sm:py-5 text-center">
              <div className="inline-flex items-baseline justify-center font-mono font-black tracking-tight text-5xl sm:text-7xl text-white drop-shadow">
                <span>{hrs}</span>
                <span className="text-indigo-400 mx-1">:</span>
                <span>{mins}</span>
                <span className="text-indigo-400 mx-1">:</span>
                <span className="text-3xl sm:text-5xl text-indigo-300">{secs}</span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-2">
                El tiempo sigue corriendo aunque cierres la pestaña o apagues la pantalla del teléfono
              </p>
            </div>

            {/* Botones de ajuste rápido de minutos */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAdjustTimerMinutes(-5)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-slate-300 cursor-pointer"
              >
                -5m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerMinutes(15)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-emerald-300 cursor-pointer"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerMinutes(30)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-emerald-300 cursor-pointer"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTimerMinutes(60)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono font-bold text-emerald-300 cursor-pointer"
              >
                +1h
              </button>
            </div>

            {/* Modalidad y Contadores de la Sesión */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                  Modalidad
                </label>
                <select
                  value={timerState.modality}
                  onChange={(e) =>
                    setTimerState((prev) => ({
                      ...prev,
                      modality: e.target.value as MinistryTimeLog['modality'],
                    }))
                  }
                  className="w-full rounded-xl bg-slate-900/90 border border-white/15 px-2.5 py-2 text-xs font-bold text-white focus:outline-none"
                >
                  {Object.entries(MODALITY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                  Revisitas en esta salida
                </label>
                <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-2.5 py-1.5 border border-white/15">
                  <button
                    type="button"
                    onClick={() =>
                      setTimerState((p) => ({
                        ...p,
                        sessionReturnVisits: Math.max(0, p.sessionReturnVisits - 1),
                      }))
                    }
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-sm">{timerState.sessionReturnVisits}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTimerState((p) => ({
                        ...p,
                        sessionReturnVisits: p.sessionReturnVisits + 1,
                      }))
                    }
                    className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                  Publicaciones / Videos
                </label>
                <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-2.5 py-1.5 border border-white/15">
                  <button
                    type="button"
                    onClick={() =>
                      setTimerState((p) => ({
                        ...p,
                        sessionPlacements: Math.max(0, p.sessionPlacements - 1),
                      }))
                    }
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-sm">{timerState.sessionPlacements}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTimerState((p) => ({
                        ...p,
                        sessionPlacements: p.sessionPlacements + 1,
                      }))
                    }
                    className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de Acción del Cronómetro */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleStartPauseTimer}
                className={`flex-1 py-3.5 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                  timerState.isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                {timerState.isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pausar Tiempo</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>{displaySeconds > 0 ? 'Reanudar Predicación' : 'Iniciar Predicación'}</span>
                  </>
                )}
              </button>

              {displaySeconds > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleFinishAndSaveSession}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Guardar Sesión</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-3.5 rounded-2xl bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 transition cursor-pointer"
                    title="Reiniciar a cero"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Derecha: Resumen del Mes y Meta de Horas */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Resumen de {currentMonthLabel}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Mi Meta y Registro Mensual
                  </h3>
                </div>
                <select
                  value={hourGoal}
                  onChange={(e) => handleUpdateGoal(Number(e.target.value))}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
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
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      {monthSummary.fullHours} h
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1.5">
                      {monthSummary.remainingMinutes} min
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {monthSummary.progressPct}% de {hourGoal} h
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${monthSummary.progressPct}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    {monthSummary.fullHours >= hourGoal
                      ? '¡Felicidades! Has alcanzado tu meta del mes 🎉'
                      : `Faltan ${Math.max(0, hourGoal - monthSummary.fullHours)} h para tu meta de ${hourGoal} h`}
                  </span>
                  <span>{monthSummary.logsThisMonth.length} salidas</span>
                </p>
              </div>

              {/* 3 Mini-Tarjetas: Revisitas, Estudios, Publicaciones */}
              <div className="grid grid-cols-3 gap-2.5 mt-3.5">
                <div
                  onClick={() => setActiveSubTab('revisitas')}
                  className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 cursor-pointer hover:shadow-xs transition"
                >
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
                    Revisitas
                  </span>
                  <span className="text-xl font-black text-emerald-900 dark:text-white mt-0.5 block">
                    {returnVisits.length}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    En agenda
                  </span>
                </div>

                <div
                  onClick={() => setActiveSubTab('estudios')}
                  className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 cursor-pointer hover:shadow-xs transition"
                >
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 block">
                    Estudios
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-white mt-0.5 block">
                    {bibleStudies.length}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    Cursos activos
                  </span>
                </div>

                <div
                  onClick={() => setActiveSubTab('informe')}
                  className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 cursor-pointer hover:shadow-xs transition"
                >
                  <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 block">
                    Publicaciones
                  </span>
                  <span className="text-xl font-black text-purple-900 dark:text-white mt-0.5 block">
                    {monthSummary.totalPlacementsLogged}
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">
                    Este mes
                  </span>
                </div>
              </div>
            </div>

            {/* Botón directo de envío de Informe S-4 */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAndSubmitS4}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Guardar en mi Informe S-4</span>
              </button>
              <button
                type="button"
                onClick={handleShareS4WhatsApp}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Enviar informe por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Sesiones de Tiempo (cuando está en la pestaña Cronómetro) */}
      {activeSubTab === 'cronometro' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Registro Diario de Salidas ({currentMonthLabel})
                </h3>
                <p className="text-xs text-slate-500">
                  Historial detallado de tus sesiones de predicación registradas este mes
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsManualLogOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Salida Anterior</span>
            </button>
          </div>

          {monthSummary.logsThisMonth.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
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
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-mono font-extrabold text-xs shrink-0">
                        {h > 0 ? `${h}h ` : ''}
                        {m > 0 || h === 0 ? `${m}m` : ''}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {MODALITY_LABELS[log.modality]}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{log.date}</span>
                          {log.returnVisitsCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              {log.returnVisitsCount} revisitas
                            </span>
                          )}
                          {log.placementsCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {log.placementsCount} pub.
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTimeLog(log.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
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
      {activeSubTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Revisitas Recientes / Para Hoy */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Mis Revisitas y Personas Interesadas
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Seguimiento de territorio personal y conversaciones
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenNewRv}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('revisitas')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                >
                  Ver todas ({returnVisits.length})
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {returnVisits.slice(0, 3).map((rv) => (
                <div
                  key={rv.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{rv.name}</span>
                        {rv.territoryNumber && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                            Terr. {rv.territoryNumber}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
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
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/70 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    <strong className="text-emerald-600 dark:text-emerald-400">Tema:</strong> {rv.topic}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Estudios Bíblicos y Mis Próximas Asignaciones */}
          <div className="lg:col-span-6 space-y-4">
            {/* Estudios Bíblicos */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Mis Estudios Bíblicos
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Progreso de lecciones y sesiones del mes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenNewStudy}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('estudios')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 cursor-pointer"
                  >
                    Ver ({bibleStudies.length})
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {bibleStudies.map((st) => {
                  const pct = Math.min(100, Math.round((st.currentLesson / st.totalLessons) * 100));
                  return (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {st.studentName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {st.publication} • <strong>Lección {st.currentLesson} de {st.totalLessons}</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMarkStudySessionToday(st.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer shrink-0"
                        >
                          ✓ Estudié hoy
                        </button>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Herramientas de la Congregación para Publicadores
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('programacion')}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate">Programa Semanal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('territorios')}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">Territorios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('carritos')}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="truncate">Turnos Carritos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tablero_anuncios')}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">Anuncios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('precursores_auxiliares')}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">Prec. Auxiliar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('panorama_general')}
                  className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">Panorama General</span>
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
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>Agenda de Revisitas y Personas Interesadas</span>
              </h3>
              <p className="text-xs text-slate-500">
                Anota direcciones, preguntas pendientes, publicaciones dejadas y convierte revisitas en cursos bíblicos
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewRv}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Revisita</span>
            </button>
          </div>

          {/* Buscador y Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rvSearch}
                onChange={(e) => setRvSearch(e.target.value)}
                placeholder="Buscar por nombre, calle, territorio o tema conversado..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
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
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {rv.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            rv.interestLevel === 'alto'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : rv.interestLevel === 'medio'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          Interés {rv.interestLevel}
                        </span>
                        {rv.territoryNumber && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Territorio #{rv.territoryNumber}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{rv.address}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRv(rv)}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar revisita"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRv(rv.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Eliminar revisita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <p className="text-slate-700 dark:text-slate-200">
                      <strong className="text-emerald-600 dark:text-emerald-400">Tema conversado:</strong>{' '}
                      {rv.topic}
                    </p>
                    {rv.pendingQuestion && (
                      <p className="text-slate-700 dark:text-slate-200">
                        <strong className="text-indigo-600 dark:text-indigo-400">Pregunta pendiente:</strong>{' '}
                        {rv.pendingQuestion}
                      </p>
                    )}
                    {rv.publicationLeft && (
                      <p className="text-slate-500 dark:text-slate-400">
                        <strong>Publicación / Video:</strong> {rv.publicationLeft}
                      </p>
                    )}
                    {rv.bestTime && (
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Horario: {rv.bestTime}</span>
                      </p>
                    )}
                  </div>

                  {/* Última nota del historial */}
                  {rv.visitsHistory.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Visitas ({rv.visitsHistory.length}):
                      </span>{' '}
                      Última el {rv.visitsHistory[0].date} — &ldquo;{rv.visitsHistory[0].note}&rdquo;
                    </div>
                  )}
                </div>

                {/* Acciones de la tarjeta de Revisita */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLogQuickVisitToday(rv.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Registrar visita hoy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConvertRvToStudy(rv)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
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
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
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
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
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
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span>Mis Estudios Bíblicos (Cursos Bíblicos)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Lleva el avance por lección de ¡Disfrute de la vida para siempre!, sesiones del mes y metas espirituales
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewStudy}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
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
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {st.scheduleDay} • {st.scheduleTime}
                        </span>
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                          {st.studentName}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{st.address || 'Dirección registrada'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStudy(st)}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudy(st.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progreso de Lección */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 block">
                            {st.publication}
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            Lección {st.currentLesson} de {st.totalLessons} ({pct}%)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStudyLesson(st.id, -1)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStudyLesson(st.id, 1)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-extrabold cursor-pointer"
                          >
                            +1 Lección
                          </button>
                        </div>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {st.spiritualGoal && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/40">
                        <strong className="text-amber-700 dark:text-amber-300">Meta espiritual:</strong>{' '}
                        {st.spiritualGoal}
                      </p>
                    )}

                    {st.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                        <strong>Notas:</strong> {st.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleMarkStudySessionToday(st.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar estudio realizado hoy</span>
                    </button>

                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
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
          7. CONTENIDO COMPLETO: INFORME MENSUAL S-4 (`informe`)
         ========================================================================= */}
      {activeSubTab === 'informe' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Formulario Oficial S-4
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Informe de Servicio del Campo — {currentMonthLabel}
              </h3>
              <p className="text-xs text-slate-500">
                Autocompletado con tu cronómetro de ministerio y tus cursos bíblicos del mes
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Participé en alguna faceta del ministerio durante el mes
                </span>
                <span className="text-xs text-slate-500">
                  Marca la casilla si predicaste durante {currentMonthLabel}
                </span>
              </div>
              <input
                type="checkbox"
                checked={s4Participated}
                onChange={(e) => setS4Participated(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 block">
                  Horas acumuladas (Precursores)
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {monthSummary.fullHours} <span className="text-sm font-semibold text-slate-400">horas</span>
                </div>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                  + {monthSummary.remainingMinutes} min guardados para el próximo mes
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 block">
                  Cursos Bíblicos Diferentes
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {monthSummary.totalStudiesCount}{' '}
                  <span className="text-sm font-semibold text-slate-400">estudios</span>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Calculado de tu lista de Estudios Bíblicos
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Comentarios o Notas (ej. Precursorado Auxiliar de 15h o 30h)
              </label>
              <textarea
                rows={2}
                value={s4Notes}
                onChange={(e) => setS4Notes(e.target.value)}
                placeholder="Opcional: Notas para el Superintendente de Grupo o Secretario..."
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSyncAndSubmitS4}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Informe S-4 a la Congregación</span>
              </button>

              <button
                type="button"
                onClick={handleShareS4WhatsApp}
                className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AÑADIR SALIDA / TIEMPO MANUALMENTE
         ========================================================================= */}
      {isManualLogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Añadir Tiempo de Ministerio
              </h3>
              <button
                type="button"
                onClick={() => setIsManualLogOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Fecha de la salida
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={manualHours}
                    onChange={(e) => setManualHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Modalidad
                </label>
                <select
                  value={manualModality}
                  onChange={(e) => setManualModality(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  {Object.entries(MODALITY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ej. Predicación con el grupo 2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualLogOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingRv ? 'Editar Revisita' : 'Registrar Nueva Revisita'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRvModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRv} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombre o Descripción de la Persona *
                  </label>
                  <input
                    type="text"
                    required
                    value={rvForm.name}
                    onChange={(e) => setRvForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Sra. María (casa portón verde)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Territorio #
                  </label>
                  <input
                    type="text"
                    value={rvForm.territoryNumber}
                    onChange={(e) => setRvForm((p) => ({ ...p, territoryNumber: e.target.value }))}
                    placeholder="Ej. 04"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dirección o Referencia
                  </label>
                  <input
                    type="text"
                    value={rvForm.address}
                    onChange={(e) => setRvForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Calle, número y referencia"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={rvForm.phone}
                    onChange={(e) => setRvForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tema conversado
                </label>
                <input
                  type="text"
                  value={rvForm.topic}
                  onChange={(e) => setRvForm((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="Ej. La esperanza de la resurrección (Juan 5:28, 29)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Pregunta pendiente para la próxima visita
                </label>
                <input
                  type="text"
                  value={rvForm.pendingQuestion}
                  onChange={(e) => setRvForm((p) => ({ ...p, pendingQuestion: e.target.value }))}
                  placeholder="Ej. ¿Por qué permite Dios el sufrimiento?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Publicación o Video dejado
                  </label>
                  <input
                    type="text"
                    value={rvForm.publicationLeft}
                    onChange={(e) => setRvForm((p) => ({ ...p, publicationLeft: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Día y hora en que se le encuentra
                  </label>
                  <input
                    type="text"
                    value={rvForm.bestTime}
                    onChange={(e) => setRvForm((p) => ({ ...p, bestTime: e.target.value }))}
                    placeholder="Ej. Sábados 10:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRvModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingStudy ? 'Editar Estudio Bíblico' : 'Registrar Nuevo Estudio Bíblico'}
              </h3>
              <button
                type="button"
                onClick={() => setIsStudyModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudy} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre del Estudiante *
                </label>
                <input
                  type="text"
                  required
                  value={studyForm.studentName}
                  onChange={(e) => setStudyForm((p) => ({ ...p, studentName: e.target.value }))}
                  placeholder="Ej. Carlos Méndez"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={studyForm.address}
                    onChange={(e) => setStudyForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Calle y número"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={studyForm.phone}
                    onChange={(e) => setStudyForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Día habitual
                  </label>
                  <input
                    type="text"
                    value={studyForm.scheduleDay}
                    onChange={(e) => setStudyForm((p) => ({ ...p, scheduleDay: e.target.value }))}
                    placeholder="Ej. Jueves"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={studyForm.scheduleTime}
                    onChange={(e) => setStudyForm((p) => ({ ...p, scheduleTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Próxima Meta Espiritual del Estudiante
                </label>
                <input
                  type="text"
                  value={studyForm.spiritualGoal}
                  onChange={(e) => setStudyForm((p) => ({ ...p, spiritualGoal: e.target.value }))}
                  placeholder="Ej. Asistir a su primera reunión en el Salón del Reino"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold cursor-pointer"
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
