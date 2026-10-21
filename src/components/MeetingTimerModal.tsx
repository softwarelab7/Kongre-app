// src/components/MeetingTimerModal.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { createDefaultPrograma } from '../utils/clmDefaultProgram';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import type { ClmParte, ClmPrograma } from '../types';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  SkipForward,
  SkipBack,
  Sparkles,
  BookOpen,
  Monitor,
  LayoutDashboard,
  Bell,
  FileText,
  Copy,
  Check,
  MessageSquare,
  Timer,
  ArrowUpDown,
  Radio,
  ChevronRight,
  SlidersHorizontal,
  ListOrdered,
} from 'lucide-react';

export interface MeetingTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeetingType?: 'midweek' | 'weekend';
  initialRoom?: 'principal' | 'auxiliar';
  initialPartId?: string;
}

export interface TimerPartItem {
  id: string;
  partNumber?: number;
  title: string;
  subtitle?: string;
  speaker: string;
  assistant?: string;
  publisherId?: string;
  defaultMinutes: number;
  section: 'marco' | 'tesoros' | 'maestros' | 'vida_cristiana' | 'weekend';
  sectionLabel: string;
  sectionColor: string;
  isStudentPart?: boolean;
  hasCounselAfter?: boolean;
  lessonNumber?: number;
  lessonTitle?: string;
  lessonStatus?: 'pendiente' | 'completada' | 'continuar';
  clmPartRef?: ClmParte;
  room: 'principal' | 'auxiliar';
}

interface PartTimingRecord {
  elapsedSeconds: number;
  counselSeconds: number;
  completed: boolean;
  completedAt?: string;
}

type StageFlashCue = null | 'ultimo_minuto' | 'concluir' | 'microfono';

/**
 * Síntesis de timbre acústico suave mediante Web Audio API (100% local y sin archivos externos)
 */
function playTheocraticChime(type: 'warning' | 'overtime' | 'manual' = 'manual') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === 'overtime') {
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        gain.gain.setValueAtTime(0.001, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.95);
      });
    } else {
      [783.99, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.9);
      });
    }
  } catch {
    // Ignorar si el navegador bloquea audio sin interacción previa
  }
}

function addMinutesToTimeStr(timeStr: string, minutesToAdd: number): string {
  const clean = (timeStr || '19:00').trim();
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr || '19', 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h) || isNaN(m)) return '19:00';
  const totalMinutes = h * 60 + m + Math.round(minutesToAdd);
  const finalH = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
  const finalM = ((totalMinutes % 60) + 60) % 60;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

function formatDurationMMSS(totalSeconds: number, showSign = false): string {
  const isNeg = totalSeconds < 0;
  const abs = Math.abs(Math.round(totalSeconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const sign = showSign ? (isNeg ? '+' : '-') : isNeg ? '+' : '';
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MeetingTimerModal: React.FC<MeetingTimerModalProps> = ({
  isOpen,
  onClose,
  initialMeetingType = 'midweek',
  initialRoom = 'principal',
  initialPartId,
}) => {
  const {
    currentWeek,
    publishers,
    publishersMap,
    settings,
    getClmPrograma,
    updateClmPrograma,
    advancePublisherLesson,
    repeatPublisherLesson,
  } = useCongregation();

  // Configuración principal de vista
  const [activeMeetingType, setActiveMeetingType] = useState<'midweek' | 'weekend'>(initialMeetingType);
  const [activeRoom, setActiveRoom] = useState<'principal' | 'auxiliar'>(initialRoom);
  const [displayMode, setDisplayMode] = useState<'presidencia' | 'atril'>('presidencia');
  const [rightPanelTab, setRightPanelTab] = useState<'programa' | 'notas' | 'resumen'>('programa');

  // En móvil (< lg), pestaña activa para evitar scroll infinito
  const [mobileSection, setMobileSection] = useState<'reloj' | 'programa' | 'notas' | 'resumen'>('reloj');
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  // Estado del cronómetro
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [elapsedInCurrentRun, setElapsedInCurrentRun] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCounselMode, setIsCounselMode] = useState(false);
  const [countDirection, setCountDirection] = useState<'down' | 'up'>('down');
  const [autoStartNext, setAutoStartNext] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stageFlashCue, setStageFlashCue] = useState<StageFlashCue>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Hora de inicio configurable para cálculo de horario proyectado
  const [meetingStartTime, setMeetingStartTime] = useState<string>(
    initialMeetingType === 'weekend'
      ? settings?.weekendMeetingTime || '10:00'
      : settings?.midweekMeetingTime || '19:00'
  );

  // Reloj en tiempo real
  const [nowDate, setNowDate] = useState(() => new Date());
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Wake Lock para evitar que la pantalla del móvil o tablet se apague en el atril
  useEffect(() => {
    if (!isOpen) return;
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignorar si el navegador no soporta WakeLock
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Registro de tiempos reales por parte
  const storageKeyTimings = useMemo(
    () => `timer_records_${currentWeek?.weekStartDate || 'default'}_${activeMeetingType}_${activeRoom}`,
    [currentWeek?.weekStartDate, activeMeetingType, activeRoom]
  );

  const [partRecords, setPartRecords] = useState<Record<string, PartTimingRecord>>({});

  // Notas del Presidente para la semana actual
  const storageKeyNotes = useMemo(
    () => `chairman_notes_${currentWeek?.weekStartDate || 'default'}_${activeMeetingType}`,
    [currentWeek?.weekStartDate, activeMeetingType]
  );
  const [chairmanNotes, setChairmanNotes] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  }, []);

  // Sincronizar props iniciales al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveMeetingType(initialMeetingType);
      setActiveRoom(initialRoom);
      setMobileSection('reloj');
      setIsMobileSettingsOpen(false);
      setMeetingStartTime(
        initialMeetingType === 'weekend'
          ? settings?.weekendMeetingTime || '10:00'
          : settings?.midweekMeetingTime || '19:00'
      );
    }
  }, [isOpen, initialMeetingType, initialRoom, settings?.midweekMeetingTime, settings?.weekendMeetingTime]);

  // Cargar registros y notas guardadas
  useEffect(() => {
    if (!isOpen) return;
    try {
      const savedRecords = localStorage.getItem(storageKeyTimings);
      if (savedRecords) {
        setPartRecords(JSON.parse(savedRecords));
      } else {
        setPartRecords({});
      }
    } catch {
      setPartRecords({});
    }
  }, [isOpen, storageKeyTimings]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const savedNotes = localStorage.getItem(storageKeyNotes);
      setChairmanNotes(savedNotes || '');
    } catch {
      setChairmanNotes('');
    }
  }, [isOpen, storageKeyNotes]);

  const handleSaveNotes = (val: string) => {
    setChairmanNotes(val);
    try {
      localStorage.setItem(storageKeyNotes, val);
    } catch {}
  };

  // Actualizar reloj cada segundo
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Obtener el ClmPrograma sincronizado para la semana actual
  const activeClmPrograma = useMemo<ClmPrograma | null>(() => {
    if (!currentWeek) return null;
    const fromCtx = getClmPrograma(currentWeek.weekStartDate);
    if (fromCtx && fromCtx.partes && fromCtx.partes.length > 0) {
      return fromCtx;
    }
    return createDefaultPrograma(
      currentWeek.weekStartDate,
      settings?.congregationName || currentWeek.id,
      currentWeek,
      publishers
    );
  }, [currentWeek, getClmPrograma, settings?.congregationName, publishers]);

  const hasAuxRoomParts = useMemo(() => {
    if (!activeClmPrograma) return false;
    return Boolean(
      activeClmPrograma.sala_auxiliar_habilitada ||
        activeClmPrograma.partes.some((p) => p.es_clase_auxiliar && p.tipo !== 'conductor_auxiliar')
    );
  }, [activeClmPrograma]);

  // Construir la lista completa y fiel de partes de la reunión
  const parts = useMemo<TimerPartItem[]>(() => {
    if (!currentWeek) return [];
    const getPubName = (id?: string) => (id ? publishersMap.get(id)?.name || 'Sin asignar' : 'Sin asignar');
    const list: TimerPartItem[] = [];

    if (activeMeetingType === 'midweek' && activeClmPrograma) {
      const allPartes = activeClmPrograma.partes || [];
      let numberedCounter = 0;

      const roomPartes =
        activeRoom === 'auxiliar'
          ? allPartes.filter(
              (p) =>
                p.es_clase_auxiliar ||
                (p.seccion === 'tesoros' && p.tipo !== 'lectura_biblica')
            )
          : allPartes.filter((p) => !p.es_clase_auxiliar);

      if (activeRoom === 'auxiliar') {
        const counselorPart = allPartes.find((p) => p.tipo === 'conductor_auxiliar');
        const auxStudents = allPartes.filter(
          (p) => p.es_clase_auxiliar && (p.seccion === 'maestros' || p.tipo === 'lectura_biblica')
        );

        auxStudents.forEach((p, idx) => {
          const studentPub = publishers.find(
            (pub) =>
              (pub.nid || pub.id) === p.asignado_nid ||
              pub.full_name === p.asignado_nombre ||
              pub.name === p.asignado_nombre
          );
          const lessonNum = p.leccion_numero || studentPub?.currentLessonNumber || 1;
          const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum);

          list.push({
            id: p.id,
            partNumber: idx + 3,
            title: p.titulo,
            subtitle: counselorPart?.asignado_nombre
              ? `Consejero Auxiliar: ${counselorPart.asignado_nombre}`
              : 'Sala Auxiliar',
            speaker: p.asignado_nombre || 'Sin asignar',
            assistant: p.asignado_auxiliar_nombre || undefined,
            publisherId: studentPub?.id || p.asignado_nid || undefined,
            defaultMinutes: p.duracion_min || 4,
            section: p.tipo === 'lectura_biblica' ? 'tesoros' : 'maestros',
            sectionLabel: p.tipo === 'lectura_biblica' ? 'TESOROS DE LA BIBLIA' : 'SEAMOS MEJORES MAESTROS',
            sectionColor: p.tipo === 'lectura_biblica' ? '#2a6b77' : '#9b6d17',
            isStudentPart: true,
            hasCounselAfter: true,
            lessonNumber: lessonNum,
            lessonTitle: p.leccion_titulo || lessonObj?.title || `Lección ${lessonNum}`,
            lessonStatus: p.leccion_estado || 'pendiente',
            clmPartRef: p,
            room: 'auxiliar',
          });
        });

        return list;
      }

      // Auditorio Principal
      const presidentPart = roomPartes.find((p) => p.tipo === 'presidente');
      const openingPrayerPart = roomPartes.find((p) => p.tipo === 'oracion_apertura');
      const closingPrayerPart = roomPartes.find((p) => p.tipo === 'oracion_cierre');
      const cantos = roomPartes.filter((p) => p.tipo === 'canto');
      const cantoInicial = cantos[0];
      const cantoIntermedio =
        cantos.length > 2
          ? cantos[1]
          : cantos.find((c) => c.seccion === 'vida_cristiana' && c !== cantos[0]);
      const cantoFinal = cantos.length >= 2 ? cantos[cantos.length - 1] : null;

      list.push({
        id: cantoInicial?.id || 'midweek-opening-song',
        title: `${cantoInicial?.titulo || `Cántico ${currentWeek.midweek.openingSong || ''}`.trim()} y Oración`,
        subtitle: `Presidente: ${presidentPart?.asignado_nombre || getPubName(currentWeek.midweek.presidentId)}`,
        speaker: openingPrayerPart?.asignado_nombre || getPubName(currentWeek.midweek.openingPrayerId),
        defaultMinutes: 5,
        section: 'marco',
        sectionLabel: 'APERTURA',
        sectionColor: '#4f46e5',
        room: 'principal',
      });

      list.push({
        id: presidentPart?.id || 'midweek-intro-remarks',
        title: 'Palabras de introducción',
        subtitle: activeClmPrograma.lectura_semana || currentWeek.midweek.bibleReading,
        speaker: presidentPart?.asignado_nombre || getPubName(currentWeek.midweek.presidentId),
        defaultMinutes: 1,
        section: 'marco',
        sectionLabel: 'PRESIDENCIA',
        sectionColor: '#4f46e5',
        room: 'principal',
      });

      const tesorosParts = roomPartes.filter((p) => p.seccion === 'tesoros');
      let hasReadingAdded = false;
      tesorosParts.forEach((p) => {
        const isReading = p.tipo === 'lectura_biblica' || p.titulo.toLowerCase().includes('lectura de la biblia');
        if (isReading) {
          if (hasReadingAdded) return;
          hasReadingAdded = true;
        }
        numberedCounter++;
        const studentPub = isReading
          ? publishers.find(
              (pub) =>
                (pub.nid || pub.id) === p.asignado_nid ||
                pub.full_name === p.asignado_nombre ||
                pub.name === p.asignado_nombre
            )
          : undefined;
        const lessonNum = isReading ? p.leccion_numero || studentPub?.currentLessonNumber || 1 : undefined;
        const lessonObj = lessonNum ? OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum) : undefined;

        list.push({
          id: p.id,
          partNumber: numberedCounter,
          title: p.titulo.replace(/^\d+\.\s*/, ''),
          subtitle: p.descripcion || undefined,
          speaker: p.asignado_nombre || 'Sin asignar',
          publisherId: studentPub?.id || p.asignado_nid || undefined,
          defaultMinutes: p.duracion_min || (isReading ? 4 : 10),
          section: 'tesoros',
          sectionLabel: 'TESOROS DE LA BIBLIA',
          sectionColor: '#2a6b77',
          isStudentPart: isReading,
          hasCounselAfter: isReading,
          lessonNumber: lessonNum,
          lessonTitle: isReading ? p.leccion_titulo || lessonObj?.title || `Lección ${lessonNum}` : undefined,
          lessonStatus: isReading ? p.leccion_estado || 'pendiente' : undefined,
          clmPartRef: p,
          room: 'principal',
        });
      });

      const maestrosParts = roomPartes.filter(
        (p) =>
          p.seccion === 'maestros' &&
          p.tipo !== 'lectura_biblica' &&
          !p.titulo.toLowerCase().includes('lectura de la biblia')
      );
      maestrosParts.forEach((p) => {
        numberedCounter++;
        const studentPub = publishers.find(
          (pub) =>
            (pub.nid || pub.id) === p.asignado_nid ||
            pub.full_name === p.asignado_nombre ||
            pub.name === p.asignado_nombre
        );
        const lessonNum = p.leccion_numero || studentPub?.currentLessonNumber || 1;
        const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum);

        list.push({
          id: p.id,
          partNumber: numberedCounter,
          title: p.titulo.replace(/^\d+\.\s*/, ''),
          subtitle: p.descripcion || undefined,
          speaker: p.asignado_nombre || 'Sin asignar',
          assistant: p.asignado_auxiliar_nombre || undefined,
          publisherId: studentPub?.id || p.asignado_nid || undefined,
          defaultMinutes: p.duracion_min || 4,
          section: 'maestros',
          sectionLabel: 'SEAMOS MEJORES MAESTROS',
          sectionColor: '#9b6d17',
          isStudentPart: true,
          hasCounselAfter: true,
          lessonNumber: lessonNum,
          lessonTitle: p.leccion_titulo || lessonObj?.title || `Lección ${lessonNum}`,
          lessonStatus: p.leccion_estado || 'pendiente',
          clmPartRef: p,
          room: 'principal',
        });
      });

      if (cantoIntermedio) {
        list.push({
          id: cantoIntermedio.id,
          title: cantoIntermedio.titulo,
          subtitle: 'Transición a Nuestra Vida Cristiana',
          speaker: 'Congregación',
          defaultMinutes: cantoIntermedio.duracion_min || 3,
          section: 'vida_cristiana',
          sectionLabel: 'NUESTRA VIDA CRISTIANA',
          sectionColor: '#942926',
          room: 'principal',
        });
      }

      const vcParts = roomPartes.filter(
        (p) => p.seccion === 'vida_cristiana' && p.tipo !== 'canto' && p.tipo !== 'lector_estudio'
      );
      const lectorEstudioPart = roomPartes.find((p) => p.tipo === 'lector_estudio');

      vcParts.forEach((p) => {
        numberedCounter++;
        const isCbs =
          p.tipo === 'estudio_biblico_grupo' ||
          p.id.includes('cbs') ||
          p.titulo.toLowerCase().includes('estudio bíblico') ||
          p.titulo.toLowerCase().includes('estudio biblico');

        list.push({
          id: p.id,
          partNumber: numberedCounter,
          title: p.titulo.replace(/^\d+\.\s*/, ''),
          subtitle:
            isCbs && lectorEstudioPart?.asignado_nombre
              ? `Lector: ${lectorEstudioPart.asignado_nombre}`
              : p.descripcion || undefined,
          speaker: p.asignado_nombre || 'Sin asignar',
          assistant: isCbs ? lectorEstudioPart?.asignado_nombre || undefined : undefined,
          defaultMinutes: p.duracion_min || (isCbs ? 30 : 15),
          section: 'vida_cristiana',
          sectionLabel: 'NUESTRA VIDA CRISTIANA',
          sectionColor: '#942926',
          clmPartRef: p,
          room: 'principal',
        });
      });

      list.push({
        id: 'midweek-closing-remarks',
        title: 'Palabras de conclusión y anuncios',
        subtitle: 'Repaso y adelanto de la próxima semana',
        speaker: presidentPart?.asignado_nombre || getPubName(currentWeek.midweek.presidentId),
        defaultMinutes: 3,
        section: 'marco',
        sectionLabel: 'CONCLUSIÓN',
        sectionColor: '#4f46e5',
        room: 'principal',
      });

      list.push({
        id: cantoFinal?.id || 'midweek-closing-song',
        title: `${cantoFinal?.titulo || `Cántico ${currentWeek.midweek.closingSong || ''}`.trim()} y Oración`,
        subtitle: 'Cierre de la reunión',
        speaker: closingPrayerPart?.asignado_nombre || getPubName(currentWeek.midweek.closingPrayerId),
        defaultMinutes: 5,
        section: 'marco',
        sectionLabel: 'CONCLUSIÓN',
        sectionColor: '#4f46e5',
        room: 'principal',
      });
    } else {
      const presidentName = getPubName(currentWeek.weekend.presidentId);
      const openingPrayerName = currentWeek.weekend.openingPrayerId
        ? getPubName(currentWeek.weekend.openingPrayerId)
        : presidentName;
      const closingPrayerName = getPubName(currentWeek.weekend.closingPrayerId);

      list.push({
        id: 'weekend-opening',
        title: `Cántico ${currentWeek.weekend.openingSong || ''} y Oración de Apertura`,
        subtitle: `Presidente: ${presidentName}`,
        speaker: openingPrayerName,
        defaultMinutes: 5,
        section: 'weekend',
        sectionLabel: 'APERTURA FIN DE SEMANA',
        sectionColor: '#059669',
        room: 'principal',
      });

      list.push({
        id: 'weekend-public-talk',
        partNumber: 1,
        title: currentWeek.weekend.publicTalkTitle
          ? `Discurso Público: "${currentWeek.weekend.publicTalkTitle}"`
          : 'Discurso Público',
        subtitle: currentWeek.weekend.publicTalkOutlineNumber
          ? `Bosquejo #${currentWeek.weekend.publicTalkOutlineNumber}${
              currentWeek.weekend.publicTalkCongregation
                ? ` · ${currentWeek.weekend.publicTalkCongregation}`
                : ''
            }`
          : currentWeek.weekend.publicTalkCongregation || 'Discurso bíblico de 30 minutos',
        speaker: currentWeek.weekend.publicTalkSpeaker || 'Orador asignado',
        defaultMinutes: 30,
        section: 'weekend',
        sectionLabel: 'DISCURSO PÚBLICO',
        sectionColor: '#059669',
        room: 'principal',
      });

      list.push({
        id: 'weekend-middle-song',
        title: `Cántico Intermedio ${currentWeek.weekend.middleSong ? `#${currentWeek.weekend.middleSong}` : ''}`.trim(),
        subtitle: 'Transición al Estudio de La Atalaya',
        speaker: 'Congregación',
        defaultMinutes: 5,
        section: 'weekend',
        sectionLabel: 'TRANSICIÓN',
        sectionColor: '#059669',
        room: 'principal',
      });

      const conductorName = getPubName(currentWeek.weekend.atalayaConductorId);
      const readerName = getPubName(currentWeek.weekend.atalayaLectorId);

      list.push({
        id: 'weekend-watchtower',
        partNumber: 2,
        title: currentWeek.weekend.watchtowerStudyTitle
          ? `Estudio de La Atalaya: "${currentWeek.weekend.watchtowerStudyTitle}"`
          : 'Estudio de La Atalaya',
        subtitle: `Lector: ${readerName}`,
        speaker: conductorName,
        assistant: readerName,
        defaultMinutes: 60,
        section: 'weekend',
        sectionLabel: 'ESTUDIO DE LA ATALAYA',
        sectionColor: '#059669',
        room: 'principal',
      });

      list.push({
        id: 'weekend-closing',
        title: `Cántico ${currentWeek.weekend.closingSong || ''} y Oración de Conclusión`,
        subtitle: 'Cierre de la reunión',
        speaker: closingPrayerName,
        defaultMinutes: 5,
        section: 'weekend',
        sectionLabel: 'CONCLUSIÓN',
        sectionColor: '#059669',
        room: 'principal',
      });
    }

    return list;
  }, [currentWeek, activeMeetingType, activeRoom, activeClmPrograma, publishers, publishersMap]);

  // Seleccionar parte inicial si se pasó initialPartId
  useEffect(() => {
    if (!isOpen || !initialPartId || parts.length === 0) return;
    const idx = parts.findIndex((p) => p.id === initialPartId);
    if (idx >= 0) {
      setSelectedPartIndex(idx);
    }
  }, [isOpen, initialPartId, parts]);

  useEffect(() => {
    if (selectedPartIndex >= parts.length && parts.length > 0) {
      setSelectedPartIndex(0);
    }
  }, [parts.length, selectedPartIndex]);

  const currentPart = parts[selectedPartIndex] || parts[0];
  const nextPart = parts[selectedPartIndex + 1] || null;

  // Sincronizar temporizador cuando cambia la parte seleccionada
  useEffect(() => {
    if (!currentPart) return;
    setIsRunning(false);
    setIsCounselMode(false);
    setStageFlashCue(null);
    const saved = partRecords[currentPart.id];
    const targetSec = currentPart.defaultMinutes * 60;
    if (saved && saved.elapsedSeconds > 0 && !saved.completed) {
      setElapsedInCurrentRun(saved.elapsedSeconds);
      setSecondsLeft(targetSec - saved.elapsedSeconds);
    } else {
      setElapsedInCurrentRun(0);
      setSecondsLeft(targetSec);
    }
  }, [selectedPartIndex, currentPart?.id]);

  // Guardar registro en localStorage
  const persistPartRecord = useCallback(
    (partId: string, updater: (prev: PartTimingRecord) => PartTimingRecord) => {
      setPartRecords((prev) => {
        const existing = prev[partId] || { elapsedSeconds: 0, counselSeconds: 0, completed: false };
        const updated = {
          ...prev,
          [partId]: updater(existing),
        };
        try {
          localStorage.setItem(storageKeyTimings, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    [storageKeyTimings]
  );

  // Efecto principal de cuenta cada segundo
  useEffect(() => {
    if (!isRunning || !currentPart) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev <= -900 ? prev : prev - 1;
        if (soundEnabled) {
          if (nextVal === 60 && !isCounselMode) {
            playTheocraticChime('warning');
          } else if (nextVal === 0) {
            playTheocraticChime('overtime');
          }
        }
        return nextVal;
      });

      setElapsedInCurrentRun((prev) => prev + 1);

      persistPartRecord(currentPart.id, (rec) => ({
        ...rec,
        elapsedSeconds: isCounselMode ? rec.elapsedSeconds : rec.elapsedSeconds + 1,
        counselSeconds: isCounselMode ? rec.counselSeconds + 1 : rec.counselSeconds,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentPart, soundEnabled, isCounselMode, persistPartRecord]);

  // Calcular ventana horaria proyectada para cada parte y el desfase global
  const scheduleTimeline = useMemo(() => {
    let cursorMinutes = 0;
    let totalActualCompletedSeconds = 0;
    let totalPlannedCompletedSeconds = 0;

    const windows = parts.map((p) => {
      const startStr = addMinutesToTimeStr(meetingStartTime, cursorMinutes);
      const counselExtra = p.hasCounselAfter ? 1 : 0;
      const partTotalMin = p.defaultMinutes + counselExtra;
      const endStr = addMinutesToTimeStr(meetingStartTime, cursorMinutes + partTotalMin);
      cursorMinutes += partTotalMin;

      const rec = partRecords[p.id];
      const plannedSec = p.defaultMinutes * 60;

      if (rec?.completed) {
        totalPlannedCompletedSeconds += plannedSec + (p.hasCounselAfter ? 60 : 0);
        totalActualCompletedSeconds += rec.elapsedSeconds + rec.counselSeconds;
      }

      return {
        partId: p.id,
        startStr,
        endStr,
        partTotalMin,
      };
    });

    let currentPartDelta = 0;
    if (currentPart) {
      const targetSec = currentPart.defaultMinutes * 60;
      if (elapsedInCurrentRun > targetSec && !isCounselMode) {
        currentPartDelta = elapsedInCurrentRun - targetSec;
      }
    }

    const netVarianceSeconds =
      totalActualCompletedSeconds - totalPlannedCompletedSeconds + currentPartDelta;
    const projectedEndStr = addMinutesToTimeStr(
      meetingStartTime,
      cursorMinutes + Math.round(netVarianceSeconds / 60)
    );

    return {
      windows,
      totalMinutesPlanned: cursorMinutes,
      netVarianceSeconds,
      projectedEndStr,
    };
  }, [parts, meetingStartTime, partRecords, currentPart, elapsedInCurrentRun, isCounselMode]);

  // Iniciar el cronómetro de 1 minuto de Consejo / Encomio del Presidente
  const handleStartCounselMinute = useCallback(() => {
    if (!currentPart) return;
    setIsCounselMode(true);
    setSecondsLeft(60);
    setElapsedInCurrentRun(0);
    setIsRunning(true);
    setStageFlashCue(null);
    showToast('⏱️ Cronómetro de Consejo (1:00 min) iniciado');
  }, [currentPart, showToast]);

  // Marcar parte actual como completada y pasar a la siguiente
  const handleCompleteAndNext = useCallback(() => {
    if (!currentPart) return;
    persistPartRecord(currentPart.id, (rec) => ({
      ...rec,
      completed: true,
      completedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }));

    if (selectedPartIndex < parts.length - 1) {
      const nextIdx = selectedPartIndex + 1;
      setSelectedPartIndex(nextIdx);
      setIsCounselMode(false);
      setStageFlashCue(null);
      const nextTarget = parts[nextIdx].defaultMinutes * 60;
      setSecondsLeft(nextTarget);
      setElapsedInCurrentRun(0);
      setIsRunning(autoStartNext);
    } else {
      setIsRunning(false);
      showToast('🎉 ¡Todas las partes de la reunión han concluido!');
    }
  }, [currentPart, persistPartRecord, selectedPartIndex, parts, autoStartNext, showToast]);

  // Aprobar o repetir lección S-38 directamente desde la Consola de Presidencia
  const handleEvaluateStudentLesson = (decision: 'completada' | 'continuar') => {
    if (!currentPart || !currentPart.isStudentPart) return;
    const pubId = currentPart.publisherId;
    const currentNum = currentPart.lessonNumber || 1;

    if (pubId) {
      if (decision === 'completada') {
        const nextNum = Math.min(20, currentNum + 1);
        advancePublisherLesson(
          pubId,
          nextNum,
          `Aprobada desde Consola de Presidencia (${currentWeek?.weekStartDate})`
        );
      } else {
        repeatPublisherLesson(
          pubId,
          `Continuar practicando desde Consola de Presidencia (${currentWeek?.weekStartDate})`
        );
      }
    }

    if (activeClmPrograma && currentPart.clmPartRef) {
      const updatedProg: ClmPrograma = {
        ...activeClmPrograma,
        partes: activeClmPrograma.partes.map((p) =>
          p.id === currentPart.id ? { ...p, leccion_estado: decision } : p
        ),
      };
      updateClmPrograma(updatedProg);
      try {
        localStorage.setItem(`clm_programa_${activeClmPrograma.semana_fecha}`, JSON.stringify(updatedProg));
      } catch {}
    }

    showToast(
      decision === 'completada'
        ? `✅ Lección #${currentNum} aprobada (${currentPart.speaker})`
        : `🔄 Repetir lección #${currentNum} (${currentPart.speaker})`
    );
  };

  // Sincronizar estado con el evento nativo fullscreenchange del navegador (ej. al presionar Esc)
  useEffect(() => {
    const handleFsChange = () => {
      const fsElement =
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      setIsFullscreen(Boolean(fsElement));
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Alternar pantalla completa utilizando la API de Fullscreen del navegador
  const handleToggleFullscreen = useCallback(async () => {
    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element;
        webkitExitFullscreen?: () => Promise<void>;
      };
      const el = (modalContainerRef.current || document.documentElement) as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };

      const isCurrentlyFs = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

      if (!isCurrentlyFs) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback visual en caso de restricción del contenedor
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Atajos de teclado
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((r) => !r);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsRunning(false);
        const target = isCounselMode ? 60 : (currentPart?.defaultMinutes || 5) * 60;
        setSecondsLeft(target);
        setElapsedInCurrentRun(0);
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleCompleteAndNext();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedPartIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'c' || e.key === 'C') {
        if (currentPart?.hasCounselAfter) {
          e.preventDefault();
          handleStartCounselMinute();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setDisplayMode((m) => (m === 'presidencia' ? 'atril' : 'presidencia'));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    currentPart,
    isCounselMode,
    handleCompleteAndNext,
    handleStartCounselMinute,
    handleToggleFullscreen,
  ]);

  if (!isOpen || !currentWeek) return null;

  const targetTotalSeconds = isCounselMode ? 60 : (currentPart?.defaultMinutes || 5) * 60;
  const isOvertime = secondsLeft < 0;
  const isCriticalWarning = secondsLeft <= 30 && secondsLeft >= 0;
  const isOneMinuteWarning = secondsLeft <= 60 && secondsLeft > 30;

  const displayedSeconds = countDirection === 'down' ? secondsLeft : elapsedInCurrentRun;
  const absDisplayed = Math.abs(displayedSeconds);
  const dispMin = Math.floor(absDisplayed / 60);
  const dispSec = absDisplayed % 60;
  const mainTimerFormatted = `${
    countDirection === 'down' && isOvertime ? '+' : ''
  }${String(dispMin).padStart(2, '0')}:${String(dispSec).padStart(2, '0')}`;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((targetTotalSeconds - Math.max(0, secondsLeft)) / Math.max(1, targetTotalSeconds)) * 100)
  );

  const liveClockShort = nowDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopyTimingSummary = () => {
    const meetingLabel =
      activeMeetingType === 'midweek'
        ? `Reunión VMC (${activeRoom === 'auxiliar' ? 'Sala Auxiliar' : 'Auditorio Principal'})`
        : 'Reunión de Fin de Semana';

    let text = `⏱️ *RESUMEN DE TIEMPOS DE PRESIDENCIA*\n`;
    text += `📅 Semana: ${currentWeek.weekStartDate} | ${meetingLabel}\n`;
    text += `🕒 Inicio: ${meetingStartTime} | Cierre proyectado: ${scheduleTimeline.projectedEndStr}\n\n`;

    parts.forEach((p, idx) => {
      const rec = partRecords[p.id];
      const realSec = rec?.elapsedSeconds || 0;
      const plannedSec = p.defaultMinutes * 60;
      const diff = realSec - plannedSec;
      const statusIcon = !rec?.completed ? '⚪' : diff > 15 ? '🔴' : diff < -30 ? '🟡' : '🟢';

      text += `${statusIcon} ${idx + 1}. *${p.title}* (${p.speaker})\n`;
      text += `   Asignado: ${p.defaultMinutes}:00 min | Real: ${
        realSec > 0 ? formatDurationMMSS(realSec) : 'Sin registrar'
      }`;
      if (rec?.counselSeconds) {
        text += ` | Consejo: ${formatDurationMMSS(rec.counselSeconds)}`;
      }
      text += `\n`;
    });

    if (chairmanNotes.trim()) {
      text += `\n📝 *Notas de Presidencia:*\n${chairmanNotes.trim()}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      showToast('Resumen de tiempos copiado al portapapeles');
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  const currentWindow = scheduleTimeline.windows[selectedPartIndex];

  // Sub-componente reutilizable para Lista de Programa (usado en Desktop y en pestaña Móvil)
  const renderProgramListContent = () => (
    <div className="flex-1 flex flex-col justify-between overflow-hidden p-3 sm:p-4">
      <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
        {parts.map((p, idx) => {
          const isSelected = selectedPartIndex === idx;
          const rec = partRecords[p.id];
          const win = scheduleTimeline.windows[idx];
          const realSec = rec?.elapsedSeconds || 0;
          const isOverPart = realSec > p.defaultMinutes * 60 + 15;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPartIndex(idx);
                setMobileSection('reloj');
              }}
              className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/70 ring-1 ring-indigo-500/80'
                  : rec?.completed
                  ? 'border-slate-800/80 bg-slate-950/30 text-slate-400 hover:bg-slate-900/60'
                  : 'border-slate-800/90 bg-slate-950/60 hover:bg-slate-900 text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.sectionColor }}
                    />
                    {win && (
                      <span>
                        {win.startStr} – {win.endStr}
                      </span>
                    )}
                    <span>·</span>
                    <span className="uppercase tracking-wider truncate">{p.sectionLabel}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    {rec?.completed && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm text-white leading-snug">
                      {p.partNumber ? `${p.partNumber}. ` : ''}
                      {p.title}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {p.speaker}
                    {p.assistant ? ` · Ayudante: ${p.assistant}` : ''}
                    {p.lessonNumber ? ` · Lecc. #${p.lessonNumber}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {p.defaultMinutes} min
                  </span>
                  {realSec > 0 && (
                    <span
                      className={`text-[10px] font-mono mt-0.5 ${
                        isOverPart ? 'text-rose-400 font-bold' : 'text-emerald-400'
                      }`}
                    >
                      Real: {formatDurationMMSS(realSec)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Sub-componente reutilizable para Notas de Presidencia
  const renderNotesContent = () => (
    <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-white">
          Apuntes del Presidente y Anuncios a la Congregación
        </h4>
        <p className="text-[11px] text-slate-400">
          Guardado automático para la semana del {currentWeek.weekStartDate}.
        </p>
      </div>

      <textarea
        value={chairmanNotes}
        onChange={(e) => handleSaveNotes(e.target.value)}
        placeholder="Escribe aquí tus notas de introducción, puntos para enlazar partes, anuncios locales, saludos o adelanto de la próxima semana..."
        className="flex-1 min-h-[220px] w-full rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
      />

      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-300">Recordatorios rápidos:</div>
        <p>
          · Lectura semanal:{' '}
          <strong className="text-indigo-300">
            {activeClmPrograma?.lectura_semana || currentWeek.midweek.bibleReading}
          </strong>
        </p>
        <p>
          · Consejo estudiantil: <strong className="text-amber-300">Máximo 1 minuto</strong> centrado en el folleto{' '}
          <em>th / lmd</em>.
        </p>
      </div>
    </div>
  );

  // Sub-componente reutilizable para Resumen de Tiempos
  const renderSummaryContent = () => (
    <div className="flex-1 flex flex-col justify-between p-4 space-y-4 overflow-y-auto">
      <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Duración Real por Intervención</h4>
            <p className="text-[11px] text-slate-400">
              Comparativa entre tiempo asignado y tiempo real empleado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPartRecords({});
              try {
                localStorage.removeItem(storageKeyTimings);
              } catch {}
              showToast('Registros de tiempo reiniciados');
            }}
            className="text-xs text-rose-400 hover:underline cursor-pointer font-semibold px-2 py-1"
          >
            Reiniciar todo
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {parts.map((p, idx) => {
            const rec = partRecords[p.id];
            const realSec = rec?.elapsedSeconds || 0;
            const plannedSec = p.defaultMinutes * 60;
            const diffSec = realSec - plannedSec;

            return (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-200 truncate">
                    {idx + 1}. {p.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{p.speaker}</p>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="text-slate-300">
                    {realSec > 0 ? formatDurationMMSS(realSec) : '--:--'}{' '}
                    <span className="text-slate-600">/ {p.defaultMinutes}:00</span>
                  </div>
                  {realSec > 0 && (
                    <div
                      className={`text-[10px] ${
                        diffSec > 15
                          ? 'text-rose-400 font-bold'
                          : diffSec < -30
                          ? 'text-sky-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {diffSec > 0
                        ? `+${formatDurationMMSS(diffSec)}`
                        : `-${formatDurationMMSS(Math.abs(diffSec))}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopyTimingSummary}
        className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.99]"
      >
        {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        <span>{copiedSummary ? '¡Informe Copiado!' : 'Copiar Informe de Tiempos'}</span>
      </button>
    </div>
  );

  return (
    <div
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md select-none ${
        isFullscreen || displayMode === 'atril' ? 'p-0' : 'p-0 sm:p-3 md:p-4'
      }`}
    >
      <div
        className={`bg-slate-950 text-white w-full flex flex-col shadow-2xl border-slate-800/90 overflow-hidden transition-all ${
          isFullscreen || displayMode === 'atril'
            ? 'h-dvh max-w-none rounded-none border-0'
            : 'h-dvh sm:h-[94vh] max-w-7xl rounded-none sm:rounded-3xl sm:border'
        }`}
      >
        {/* ── BARRA DE PROGRESO SUPERIOR DE ALTO CONTRASTE ── */}
        <div className="w-full h-1.5 sm:h-2 bg-slate-900 overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-500 ${
              isOvertime
                ? 'bg-rose-500'
                : isCriticalWarning
                ? 'bg-amber-500'
                : isOneMinuteWarning
                ? 'bg-yellow-400'
                : isCounselMode
                ? 'bg-sky-400'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${isOvertime ? 100 : progressPercent}%` }}
          />
        </div>

        {/* ── HEADER COMPACTO (ADAPTADO A MÓVIL EN 1 SOLA FILA) ── */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          {/* Izquierda: Selector rápido de modo en móvil + Título en desktop */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setDisplayMode('presidencia')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'presidencia'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Presidencia</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('atril')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'atril'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span>Atril</span>
              </button>
            </div>

            <div className="hidden md:block min-w-0 pl-1">
              <div className="text-xs font-bold text-slate-200 truncate">
                {activeMeetingType === 'midweek'
                  ? `Vida y Ministerio · ${activeRoom === 'auxiliar' ? 'Sala Auxiliar' : 'Auditorio'}`
                  : 'Reunión de Fin de Semana'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Parte {selectedPartIndex + 1} de {parts.length} · Fin est. {scheduleTimeline.projectedEndStr}
              </div>
            </div>
          </div>

          {/* Derecha: Reloj, Sonido, Ajustes Móvil y Cerrar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desfase en Desktop */}
            <div
              className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                scheduleTimeline.netVarianceSeconds > 60
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                  : scheduleTimeline.netVarianceSeconds < -60
                  ? 'bg-sky-950/60 border-sky-800/80 text-sky-300'
                  : 'bg-emerald-950/50 border-emerald-800/70 text-emerald-300'
              }`}
            >
              <span>
                {scheduleTimeline.netVarianceSeconds > 60
                  ? `Atraso: +${Math.round(scheduleTimeline.netVarianceSeconds / 60)}m`
                  : scheduleTimeline.netVarianceSeconds < -60
                  ? `Adelanto: ${Math.round(scheduleTimeline.netVarianceSeconds / 60)}m`
                  : 'En horario'}
              </span>
            </div>

            {/* Reloj Digital */}
            <div className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono tabular-nums text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-bold">{liveClockShort}</span>
            </div>

            {/* Botón de Ajustes de Reunión (Visible en móvil/tablet para no saturar la cabecera) */}
            {displayMode === 'presidencia' && (
              <button
                type="button"
                onClick={() => setIsMobileSettingsOpen((prev) => !prev)}
                className={`lg:hidden p-2.5 rounded-xl border transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  isMobileSettingsOpen
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
                title="Ajustes de reunión y sala"
                aria-label="Ajustes de reunión"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}

            {/* Sonido */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Botón Pantalla completa (API Fullscreen del navegador) */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 ${
                isFullscreen
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-white'
              }`}
              title={isFullscreen ? 'Salir de pantalla completa (Atajo: F)' : 'Pantalla completa (Atajo: F)'}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 shrink-0" />
              ) : (
                <Maximize2 className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              </span>
            </button>

            {/* Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-700 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Cerrar"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── SUB-BARRA DE CONFIGURACIÓN (SIEMPRE VISIBLE EN DESKTOP, DESPLEGABLE EN MÓVIL) ── */}
        {displayMode === 'presidencia' && (
          <div
            className={`${
              isMobileSettingsOpen ? 'flex' : 'hidden lg:flex'
            } px-3.5 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex-wrap items-center justify-between gap-2.5 shrink-0`}
          >
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 flex-1 sm:flex-initial">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMeetingType('midweek');
                    setSelectedPartIndex(0);
                    setMeetingStartTime(settings?.midweekMeetingTime || '19:00');
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMeetingType === 'midweek'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entre Semana
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMeetingType('weekend');
                    setActiveRoom('principal');
                    setSelectedPartIndex(0);
                    setMeetingStartTime(settings?.weekendMeetingTime || '10:00');
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeMeetingType === 'weekend'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fin de Semana
                </button>
              </div>

              {activeMeetingType === 'midweek' && hasAuxRoomParts && (
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoom('principal');
                      setSelectedPartIndex(0);
                    }}
                    className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRoom === 'principal'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Auditorio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoom('auxiliar');
                      setSelectedPartIndex(0);
                    }}
                    className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeRoom === 'auxiliar'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sala Auxiliar
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <span>Inicio:</span>
                <input
                  type="time"
                  value={meetingStartTime}
                  onChange={(e) => setMeetingStartTime(e.target.value)}
                  className="bg-transparent text-white font-mono font-bold text-xs focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setCountDirection((d) => (d === 'down' ? 'up' : 'down'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium cursor-pointer transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span>{countDirection === 'down' ? 'Cuenta regresiva' : 'Tiempo transcurrido'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoStartNext((a) => !a)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium cursor-pointer transition-colors ${
                  autoStartNext
                    ? 'bg-indigo-950/70 border-indigo-700 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Auto-iniciar</span>
              </button>
            </div>
          </div>
        )}

        {/* ── BANNER DE SEÑAL VISUAL EN ESCENARIO ── */}
        {stageFlashCue && (
          <div
            className={`px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 animate-pulse shrink-0 ${
              stageFlashCue === 'concluir'
                ? 'bg-rose-600 text-white'
                : stageFlashCue === 'ultimo_minuto'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-sky-500 text-slate-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm tracking-wide uppercase mx-auto text-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>
                {stageFlashCue === 'concluir'
                  ? 'TIEMPO CUMPLIDO — POR FAVOR CONCLUYA SU INTERVENCIÓN'
                  : stageFlashCue === 'ultimo_minuto'
                  ? 'AVISO: QUEDA MENOS DE 1 MINUTO'
                  : 'AVISO: ACÉRQUESE UN POCO MÁS AL MICRÓFONO'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStageFlashCue(null)}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-xs font-bold cursor-pointer shrink-0"
            >
              Ocultar
            </button>
          </div>
        )}

        {/* ── MINI-CRONÓMETRO FLOTANTE EN MÓVIL CUANDO EL USUARIO MIRA PROGRAMA / NOTAS / TIEMPOS ── */}
        {displayMode === 'presidencia' && mobileSection !== 'reloj' && (
          <div className="lg:hidden px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div
              onClick={() => setMobileSection('reloj')}
              className="min-w-0 flex-1 flex items-center gap-2.5 cursor-pointer"
            >
              <span
                className={`font-mono tabular-nums font-black text-lg px-2.5 py-1 rounded-xl border ${
                  isOvertime
                    ? 'bg-rose-950 text-rose-400 border-rose-500'
                    : isCriticalWarning
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-slate-950 text-emerald-400 border-slate-800'
                }`}
              >
                {mainTimerFormatted}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentPart?.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentPart?.speaker}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer min-w-[42px] min-h-[42px] ${
                  isRunning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                }`}
                aria-label={isRunning ? 'Pausar' : 'Iniciar'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleCompleteAndNext}
                className="p-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer min-w-[42px] min-h-[42px]"
                aria-label="Siguiente parte"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── CUERPO PRINCIPAL ── */}
        {displayMode === 'atril' ? (
          /* ============================================================================
             VISTA 1: MODO ATRIL PURO (MONITOR DE ESCENARIO OPTIMIZADO PARA MÓVIL Y TABLET)
             ============================================================================ */
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 md:p-10 bg-slate-950 overflow-y-auto">
            {/* Cabecera de parte actual */}
            <div className="text-center space-y-1.5 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-center gap-2 text-[11px] sm:text-sm font-bold tracking-widest uppercase text-slate-400 flex-wrap">
                <span style={{ color: currentPart?.sectionColor || '#818cf8' }}>
                  {isCounselMode ? 'CONSEJO DE PRESIDENCIA (1 MIN)' : currentPart?.sectionLabel}
                </span>
                {currentWindow && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-slate-400">
                      {currentWindow.startStr} – {currentWindow.endStr}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-snug line-clamp-2">
                {isCounselMode ? `Consejo: ${currentPart?.title}` : currentPart?.title}
              </h1>

              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-sm sm:text-xl text-slate-300 font-semibold">
                <span>{currentPart?.speaker}</span>
                {currentPart?.assistant && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-indigo-300">Ayudante: {currentPart.assistant}</span>
                  </>
                )}
                {currentPart?.lessonNumber && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-300">
                      Lecc. #{currentPart.lessonNumber}: {currentPart.lessonTitle}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Pantalla Gigante del Cronómetro sin desbordamiento en móviles de 360px */}
            <div className="my-auto py-3 sm:py-6 flex flex-col items-center justify-center w-full">
              <div
                onClick={() => setIsRunning(!isRunning)}
                title="Toca para Iniciar o Pausar"
                className={`w-full max-w-2xl cursor-pointer font-mono tabular-nums font-black text-[4.25rem] xs:text-7xl sm:text-8xl md:text-[9.5rem] leading-none tracking-tight px-4 sm:px-14 py-6 sm:py-10 rounded-3xl border-2 text-center transition-all shadow-2xl active:scale-[0.99] ${
                  isOvertime
                    ? 'bg-rose-950/80 text-rose-400 border-rose-500 animate-pulse'
                    : isCriticalWarning
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                    : isOneMinuteWarning
                    ? 'bg-yellow-950/60 text-yellow-300 border-yellow-600/80'
                    : isCounselMode
                    ? 'bg-sky-950/70 text-sky-300 border-sky-500/80'
                    : 'bg-slate-900/90 text-emerald-400 border-slate-800'
                }`}
              >
                {mainTimerFormatted}
              </div>

              <div className="mt-3 flex items-center justify-center gap-3 text-xs sm:text-base font-bold text-center">
                {isOvertime ? (
                  <span className="text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    Tiempo excedido ({formatDurationMMSS(Math.abs(secondsLeft))})
                  </span>
                ) : isCriticalWarning ? (
                  <span className="text-amber-300 uppercase tracking-widest">
                    Últimos 30 segundos — Concluyendo intervención
                  </span>
                ) : isOneMinuteWarning ? (
                  <span className="text-yellow-300 uppercase tracking-widest">
                    Último minuto disponible
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Asignado: {isCounselMode ? '1 min (Consejo)' : `${currentPart?.defaultMinutes} min`} ·{' '}
                    {isRunning ? 'En curso (Toca el reloj para pausar)' : 'En pausa (Toca el reloj para iniciar)'}
                  </span>
                )}
              </div>
            </div>

            {/* Controles inferiores ergonómicos para pulgar en móvil y tablet */}
            <div className="max-w-4xl mx-auto w-full space-y-3">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`col-span-2 sm:col-span-1 min-h-[52px] px-8 py-3.5 rounded-2xl text-base font-black shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>

                {currentPart?.hasCounselAfter && !isCounselMode && (
                  <button
                    type="button"
                    onClick={handleStartCounselMinute}
                    className="min-h-[48px] px-4 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    <Timer className="w-4 h-4 shrink-0" />
                    <span>Consejo (1:00)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCompleteAndNext}
                  className="min-h-[48px] px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <span>Siguiente</span>
                  <SkipForward className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPartIndex((i) => Math.max(0, i - 1))}
                  disabled={selectedPartIndex === 0}
                  className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <SkipBack className="w-4 h-4 shrink-0" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setSecondsLeft(isCounselMode ? 60 : (currentPart?.defaultMinutes || 5) * 60);
                    setElapsedInCurrentRun(0);
                  }}
                  className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reiniciar</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className={`col-span-2 sm:col-span-1 min-h-[48px] px-4 py-3 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                    isFullscreen
                      ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600 text-emerald-300'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                  }`}
                  title={isFullscreen ? 'Salir de pantalla completa (Atajo: F)' : 'Maximizar área visual en Pantalla completa (Atajo: F)'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <Maximize2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</span>
                </button>
              </div>

              {nextPart && (
                <div className="px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-slate-500 uppercase">Siguiente:</span>
                    <span className="font-bold text-slate-200 truncate">{nextPart.title}</span>
                    <span>·</span>
                    <span className="text-indigo-300 font-medium truncate">{nextPart.speaker}</span>
                  </div>
                  <span className="font-mono text-slate-400 shrink-0 ml-2">
                    {nextPart.defaultMinutes}m
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================================
             VISTA 2: CONSOLA DE PRESIDENCIA (CON NAVEGACIÓN POR PESTAÑAS EN MÓVIL)
             ============================================================================ */
          <div className="flex-1 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:p-6">
            {/* SECCIÓN IZQUIERDA (Reloj y Controles): Visible siempre en Desktop, o cuando mobileSection === 'reloj' */}
            <div
              className={`${
                mobileSection === 'reloj' ? 'flex' : 'hidden lg:flex'
              } lg:col-span-7 flex-1 flex-col justify-between space-y-4 p-3.5 sm:p-6 lg:rounded-3xl bg-slate-900/40 lg:bg-slate-900/60 lg:border lg:border-slate-800/90 overflow-y-auto`}
            >
              {/* Encabezado de la intervención activa */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] sm:text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-extrabold uppercase tracking-wider"
                      style={{ color: isCounselMode ? '#38bdf8' : currentPart?.sectionColor || '#818cf8' }}
                    >
                      {isCounselMode ? 'CONSEJO Y ENCOMIO (1:00)' : currentPart?.sectionLabel}
                    </span>
                    {currentWindow && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-slate-400">
                          {currentWindow.startStr} – {currentWindow.endStr}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-slate-400 font-mono">
                    Parte {selectedPartIndex + 1}/{parts.length} ·{' '}
                    <strong>{isCounselMode ? '1:00' : `${currentPart?.defaultMinutes}:00`}m</strong>
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                  {currentPart?.partNumber ? `${currentPart.partNumber}. ` : ''}
                  {currentPart?.title}
                </h2>

                <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-slate-300">
                  <span className="font-bold text-white">
                    Asignado: <span className="text-indigo-300">{currentPart?.speaker}</span>
                  </span>
                  {currentPart?.assistant && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span>
                        Ayudante: <strong className="text-slate-200">{currentPart.assistant}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* PANTALLA CENTRAL DEL CRONÓMETRO */}
              <div className="flex flex-col items-center justify-center py-1 sm:py-2">
                <div
                  onClick={() => setIsRunning(!isRunning)}
                  title="Toca para Iniciar o Pausar"
                  className={`w-full max-w-lg cursor-pointer font-mono tabular-nums font-black text-6xl xs:text-7xl sm:text-8xl tracking-tight py-5 sm:py-6 px-4 sm:px-6 rounded-3xl border-2 text-center transition-all shadow-inner active:scale-[0.99] ${
                    isOvertime
                      ? 'bg-rose-950/75 text-rose-400 border-rose-500 animate-pulse'
                      : isCriticalWarning
                      ? 'bg-amber-950/75 text-amber-300 border-amber-500'
                      : isOneMinuteWarning
                      ? 'bg-yellow-950/50 text-yellow-300 border-yellow-600/80'
                      : isCounselMode
                      ? 'bg-sky-950/60 text-sky-300 border-sky-500/70'
                      : 'bg-slate-950 text-emerald-400 border-slate-800'
                  }`}
                >
                  {mainTimerFormatted}
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-3 flex-wrap text-xs text-slate-400 font-mono">
                  <span>
                    Transcurrido: <strong className="text-slate-200">{formatDurationMMSS(elapsedInCurrentRun)}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Restante:{' '}
                    <strong className={isOvertime ? 'text-rose-400' : 'text-emerald-400'}>
                      {isOvertime
                        ? `+${formatDurationMMSS(Math.abs(secondsLeft))}`
                        : formatDurationMMSS(secondsLeft)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* CONTROLES PRINCIPALES ADAPTADOS AL PULGAR EN MÓVIL */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`col-span-2 sm:col-span-1 min-h-[48px] px-7 py-3 rounded-2xl text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      isRunning
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isRunning ? 'Pausar' : 'Iniciar Cronómetro'}</span>
                  </button>

                  {currentPart?.hasCounselAfter && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCounselMode) {
                          setIsCounselMode(false);
                          setSecondsLeft((currentPart?.defaultMinutes || 4) * 60);
                          setElapsedInCurrentRun(0);
                          setIsRunning(false);
                        } else {
                          handleStartCounselMinute();
                        }
                      }}
                      className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer border active:scale-95 ${
                        isCounselMode
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                          : 'bg-sky-950/80 hover:bg-sky-900 text-sky-300 border-sky-700/80'
                      }`}
                    >
                      <Timer className="w-4 h-4 shrink-0" />
                      <span>{isCounselMode ? 'Salir Consejo' : 'Consejo (1:00)'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCompleteAndNext}
                    className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <span>Siguiente</span>
                    <SkipForward className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRunning(false);
                      setSecondsLeft(isCounselMode ? 60 : (currentPart?.defaultMinutes || 5) * 60);
                      setElapsedInCurrentRun(0);
                    }}
                    className="min-h-[46px] px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>Reiniciar</span>
                  </button>
                </div>

                {/* Ajustes finos y Timbre en grilla compacta apta para móvil */}
                <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center justify-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSecondsLeft((s) => s - 60)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-bold cursor-pointer active:scale-95"
                  >
                    -1m
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondsLeft((s) => s - 30)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-bold cursor-pointer active:scale-95"
                  >
                    -30s
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondsLeft((s) => s + 30)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-bold cursor-pointer active:scale-95"
                  >
                    +30s
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondsLeft((s) => s + 60)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono font-bold cursor-pointer active:scale-95"
                  >
                    +1m
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playTheocraticChime('manual');
                      showToast('🔔 Timbre acústico reproducido');
                    }}
                    className="col-span-2 sm:col-span-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/70 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span>Timbre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageFlashCue((c) => (c === 'concluir' ? null : 'concluir'))}
                    className={`col-span-2 sm:col-span-1 min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 ${
                      stageFlashCue === 'concluir'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-800/70 text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Aviso Concluir</span>
                  </button>
                </div>
              </div>

              {/* TARJETA INTEGRADA DE EVALUACIÓN ESTUDIANTIL S-38 */}
              {currentPart?.isStudentPart && (
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Lección #{currentPart.lessonNumber}: {currentPart.lessonTitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Evaluar estudiante en registro S-38:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEvaluateStudentLesson('completada')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                        currentPart.lessonStatus === 'completada'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/70'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Aprobar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEvaluateStudentLesson('continuar')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                        currentPart.lessonStatus === 'continuar'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-700/70'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Repetir</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Vista previa táctil de la siguiente parte en móvil */}
              {nextPart && (
                <button
                  type="button"
                  onClick={() => setMobileSection('programa')}
                  className="lg:hidden w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-left text-xs text-slate-400 active:scale-[0.99]"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-500 uppercase mr-1.5">Sigue:</span>
                    <span className="font-bold text-slate-200">{nextPart.title}</span>
                    <span className="text-indigo-300 ml-1.5">({nextPart.speaker})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}
            </div>

            {/* SECCIÓN MÓVIL DEDICADA PARA PROGRAMA / NOTAS / TIEMPOS (< lg) */}
            {mobileSection === 'programa' && (
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden bg-slate-950">
                {renderProgramListContent()}
              </div>
            )}
            {mobileSection === 'notas' && (
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden bg-slate-950">
                {renderNotesContent()}
              </div>
            )}
            {mobileSection === 'resumen' && (
              <div className="lg:hidden flex-1 flex flex-col overflow-hidden bg-slate-950">
                {renderSummaryContent()}
              </div>
            )}

            {/* COLUMNA DERECHA EN DESKTOP (lg:col-span-5) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col rounded-3xl bg-slate-900/50 border border-slate-800/90 overflow-hidden">
              <div className="p-2 bg-slate-950 border-b border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('programa')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'programa'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Programa ({parts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('notas')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'notas'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Notas Presidencia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('resumen')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'resumen'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tiempos Reales</span>
                </button>
              </div>

              {rightPanelTab === 'programa' && renderProgramListContent()}
              {rightPanelTab === 'notas' && renderNotesContent()}
              {rightPanelTab === 'resumen' && renderSummaryContent()}
            </div>

            {/* ── BARRA DE NAVEGACIÓN INFERIOR EN MÓVIL (< lg) PARA MODO PRESIDENCIA ── */}
            <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] grid grid-cols-4 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMobileSection('reloj')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[46px] ${
                  mobileSection === 'reloj'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Timer className="w-4 h-4 mb-0.5" />
                <span>Cronómetro</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileSection('programa')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[46px] ${
                  mobileSection === 'programa'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListOrdered className="w-4 h-4 mb-0.5" />
                <span>Programa ({parts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileSection('notas')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[46px] ${
                  mobileSection === 'notas'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 mb-0.5" />
                <span>Notas</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileSection('resumen')}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer min-h-[46px] ${
                  mobileSection === 'resumen'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 mb-0.5" />
                <span>Tiempos</span>
              </button>
            </div>
          </div>
        )}

        {/* Notificación flotante interna */}
        {toastMsg && (
          <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 border border-indigo-500/50 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
