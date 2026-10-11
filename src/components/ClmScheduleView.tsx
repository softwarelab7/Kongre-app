import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Publisher, ClmPrograma, ClmParte, TurnoDeber, WeekendPrograma, ClmHistorialItem } from '../types';
import { autoAsignarLocal, isPublisherEligibleForPart } from '../utils/clmAutoAssignLocal';
export { isPublisherEligibleForPart };
import { generateS89Pdf } from '../utils/pdfFillers';
import { Select } from './Select';
import { StudentS38HistoryModal } from './StudentS38HistoryModal';
import { ClmReplacementModal } from './ClmReplacementModal';
import { ClmWeeklyConflictsModal } from './ClmWeeklyConflictsModal';
import { ClmMonthlyBillboardModal } from './ClmMonthlyBillboardModal';
import { ClmAuxiliaryCounselorModal } from './ClmAuxiliaryCounselorModal';
import { generateCounselorSheetPdf } from '../utils/clmCounselorPdf';
import { useCongregation } from '../context/CongregationContext';
import { getOrganizedScheduleForWeek, applyOrganizedToWeek } from '../utils/organizedSync';
import { createDefaultPrograma, getMonday } from '../utils/clmDefaultProgram';
import { checkPublisherConflictsOnDate } from '../utils/assignmentConflictChecker';
import { OFFICIAL_STUDENT_LESSONS } from '../utils/theocraticData';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  CheckCircle2,
  CalendarDays,
  FileText,
  RefreshCw,
  AlertTriangle,
  Music,
  Share2,
  FileUp,
  X,
  Check,
  CloudCheck,
  CloudUpload,
  WifiOff,
  MessageCircle,
  Copy,
  ExternalLink,
  Send,
  BookOpen,
  History,
  Award,
  RotateCcw,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Edit3,
} from 'lucide-react';

// Banners oficiales por sección
const SECTION_BANNERS = {
  tesoros: {
    label: 'TESOROS DE LA BIBLIA',
    bgColor: '#2a6b77', // Verde azulado oficial
  },
  maestros: {
    label: 'SEAMOS MEJORES MAESTROS',
    bgColor: '#9b6d17', // Ocre dorado oficial
  },
  vida_cristiana: {
    label: 'NUESTRA VIDA CRISTIANA',
    bgColor: '#942926', // Rojo teocrático oficial
  },
};

/**
 * Construye el mensaje oficial y cortés para enviar por WhatsApp al publicador o estudiante
 */
function buildClmWhatsAppMessage(
  pub: { name?: string; full_name?: string; gender?: string; id?: string; nid?: string; phone?: string },
  part: ClmParte,
  semanaFecha: string,
  congregationName?: string,
  options?: {
    isReminder?: boolean;
    isAssistant?: boolean;
    mainPublisherName?: string;
    weekId?: string;
  }
): string {
  const honorific = pub.gender === 'hermana' ? 'hermana' : 'hermano';
  const pubName = pub.full_name || pub.name;
  const cong = congregationName || 'la congregación';
  const roomName = part.es_clase_auxiliar ? 'Sala Auxiliar' : 'Auditorio Principal';

  let dateFormatted = semanaFecha;
  try {
    const parts = semanaFecha.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      dateFormatted = d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {}

  const directUrl =
    options?.weekId && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?confirmar=1&semana=${encodeURIComponent(
          options.weekId
        )}&tipo=midweek&path=${encodeURIComponent(part.tipo)}&pub=${encodeURIComponent(
          pub.id || pub.nid || ''
        )}`
      : '';

  if (options?.isAssistant) {
    let msg = `✨ *Asignación como Ayudante en la Reunión*\n\n`;
    msg += `Apreciada(o) ${honorific} *${pubName}*,\n\n`;
    msg += `Te compartimos con gusto tu asignación para la *Reunión Vida y Ministerio Cristianos* de ${cong}:\n\n`;
    msg += `📅 *Semana:* ${dateFormatted}\n`;
    msg += `📌 *Demostración:* ${part.titulo}\n`;
    msg += `🏛 *Sala:* ${roomName}\n`;
    if (options.mainPublisherName) {
      msg += `👤 *Titular:* ${options.mainPublisherName}\n`;
    }
    if (part.duracion_min) {
      msg += `⏱ *Tiempo:* ${part.duracion_min} minutos\n`;
    }
    if (directUrl) {
      msg += `\n📲 *Por favor confirma tu participación aquí (1 clic):*\n${directUrl}\n`;
    } else {
      msg += `\nPor favor, responde a este mensaje para confirmar tu participación. ✨\n`;
    }
    msg += `\nMuchas gracias por tu valiosa colaboración y apoyo. 🙏`;
    return msg;
  }

  if (options?.isReminder) {
    let msg = `👋 *Recordatorio de Asignación*\n\n`;
    msg += `Estimado(a) ${honorific} *${pubName}*,\n\n`;
    msg += `Te recordamos con cariño tu participación para la próxima *Reunión Vida y Ministerio Cristianos* de ${cong}:\n\n`;
    msg += `📅 *Semana:* ${dateFormatted}\n`;
    msg += `📌 *Asignación:* ${part.titulo}\n`;
    msg += `🏛 *Sala:* ${roomName}\n`;
    if (part.asignado_auxiliar_nombre) {
      msg += `👥 *Ayudante:* ${part.asignado_auxiliar_nombre}\n`;
    }
    if (part.duracion_min) {
      msg += `⏱ *Tiempo:* ${part.duracion_min} minutos\n`;
    }
    if (part.descripcion) {
      msg += `📖 *Detalle / Lección:* ${part.descripcion}\n`;
    }
    if (directUrl) {
      msg += `\n📲 *Confirmar o pedir reemplazo en 1 clic:*\n${directUrl}\n`;
    }
    msg += `\nSi tienes algún inconveniente, por favor avísanos con tiempo. ¡Que Jehová bendiga tu preparación! 🙏`;
    return msg;
  }

  let msg = `✨ *Asignación de Reunión VMC*\n\n`;
  msg += `Apreciado(a) ${honorific} *${pubName}*,\n\n`;
  msg += `Te compartimos con gusto tu asignación para la *Reunión Vida y Ministerio Cristianos* de ${cong}:\n\n`;
  msg += `📅 *Semana:* ${dateFormatted}\n`;
  msg += `📌 *Asignación:* ${part.titulo}\n`;
  msg += `🏛 *Sala:* ${roomName}\n`;
  if (part.asignado_auxiliar_nombre) {
    msg += `👥 *Ayudante:* ${part.asignado_auxiliar_nombre}\n`;
  }
  if (part.duracion_min) {
    msg += `⏱ *Tiempo:* ${part.duracion_min} minutos\n`;
  }
  if (part.descripcion) {
    msg += `📖 *Detalle / Lección:* ${part.descripcion}\n`;
  }
  if (directUrl) {
    msg += `\n📲 *Por favor confirma tu asignación aquí (1 clic):*\n${directUrl}\n`;
  } else {
    msg += `\nPor favor, responde a este mensaje para confirmar tu participación. ✨\n`;
  }
  msg += `\nMuchas gracias por tu valiosa colaboración y disposición.`;
  return msg;
}

/**
 * Abre el enlace web o nativo de WhatsApp
 */
function sendWhatsApp(phone: string | undefined, text: string) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
}

export default function ClmScheduleView({
  publishers,
  congregationId,
  turnosDeberes = [],
  weekendProgramas = [],
  selectedWeekDate,
  onWeekChange,
  hideHeaderToolbar = false,
}: {
  publishers: Publisher[];
  congregationId?: string;
  turnosDeberes?: TurnoDeber[];
  weekendProgramas?: WeekendPrograma[];
  selectedWeekDate?: string;
  onWeekChange?: (weekStartDate: string) => void;
  hideHeaderToolbar?: boolean;
}) {
  const {
    clmProgramas,
    updateClmPrograma,
    getClmPrograma,
    syncStatus,
    settings,
    currentWeek,
    weeks,
    outgoingSpeakers,
    advancePublisherLesson,
    repeatPublisherLesson,
    updatePublisher,
    updateWeek,
  } = useCongregation();

  const [semanaActual, setSemanaActual] = useState<Date>(() => {
    if (selectedWeekDate) {
      const d = new Date(selectedWeekDate.length === 10 ? selectedWeekDate + 'T12:00:00' : selectedWeekDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  useEffect(() => {
    if (selectedWeekDate) {
      const d = new Date(selectedWeekDate.length === 10 ? selectedWeekDate + 'T12:00:00' : selectedWeekDate);
      if (!isNaN(d.getTime())) {
        setSemanaActual(d);
      }
    }
  }, [selectedWeekDate]);
  const semanaFechaStr = useMemo(() => {
    if (selectedWeekDate && selectedWeekDate.length === 10) {
      return selectedWeekDate;
    }
    return getMonday(semanaActual);
  }, [semanaActual, selectedWeekDate]);

  const [programa, setPrograma] = useState<ClmPrograma | null>(() => {
    const initialDate = selectedWeekDate && selectedWeekDate.length === 10 ? selectedWeekDate : getMonday(new Date());
    const fromCtx = getClmPrograma(initialDate);
    if (fromCtx && fromCtx.partes && fromCtx.partes.length > 0) return fromCtx;
    const correspondingWeek = weeks.find((w) => w.weekStartDate === initialDate);
    return createDefaultPrograma(initialDate, congregationId, correspondingWeek, publishers);
  });

  const [expandedPartId, setExpandedPartId] = useState<string | null>(null);
  const [showAuxRoom, setShowAuxRoom] = useState<boolean>(() => {
    if (programa?.sala_auxiliar_habilitada !== undefined) {
      return Boolean(programa.sala_auxiliar_habilitada);
    }
    return Boolean(
      programa?.partes.some(
        (p) =>
          p.es_clase_auxiliar &&
          (p.tipo === 'conductor_auxiliar'
            ? Boolean(p.asignado_nid)
            : Boolean(p.asignado_nid || p.asignado_nombre))
      )
    );
  });
  const [activeRoom, setActiveRoom] = useState<'principal' | 'auxiliar'>('principal');
  const [guardando, setGuardando] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppIsReminder, setWhatsAppIsReminder] = useState(false);
  const [copiedPartId, setCopiedPartId] = useState<string | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Publisher | null>(null);
  const [selectedPartForReplacement, setSelectedPartForReplacement] = useState<ClmParte | null>(null);
  const [isWeeklyConflictsModalOpen, setIsWeeklyConflictsModalOpen] = useState(false);
  const [isMonthlyBillboardModalOpen, setIsMonthlyBillboardModalOpen] = useState(false);
  const [isAuxCounselorModalOpen, setIsAuxCounselorModalOpen] = useState(false);
  const [isConfirmClearClmOpen, setIsConfirmClearClmOpen] = useState(false);
  const [editingSongPart, setEditingSongPart] = useState<ClmParte | null>(null);
  const [songNumberInput, setSongNumberInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auxCounselorPart = useMemo(() => {
    return programa?.partes.find((p) => p.tipo === 'conductor_auxiliar');
  }, [programa]);

  // Sincronizar showAuxRoom respetando la preferencia del usuario o si el programa tiene sala auxiliar habilitada
  useEffect(() => {
    if (!programa) return;
    if (programa.sala_auxiliar_habilitada !== undefined) {
      setShowAuxRoom(programa.sala_auxiliar_habilitada);
      if (!programa.sala_auxiliar_habilitada) {
        setActiveRoom('principal');
      }
    } else {
      const hasAux = Boolean(
        programa.partes.some(
          (p) =>
            p.es_clase_auxiliar &&
            (p.tipo === 'conductor_auxiliar'
              ? Boolean(p.asignado_nid)
              : Boolean(p.asignado_nid || p.asignado_nombre))
        )
      );
      setShowAuxRoom(hasAux);
      if (!hasAux) {
        setActiveRoom('principal');
      }
    }
  }, [programa?.id, programa?.semana_fecha, programa?.sala_auxiliar_habilitada]);

  const [notifiedPartIds, setNotifiedPartIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`clm_notified_${semanaFechaStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleNotified = (key: string) => {
    setNotifiedPartIds((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`clm_notified_${semanaFechaStr}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper para enviar asignación por WhatsApp
  const handleSendWhatsAppSingle = (
    part: ClmParte,
    target: 'main' | 'assistant',
    isReminder: boolean = false
  ) => {
    const pubId = target === 'main' ? part.asignado_nid : part.asignado_auxiliar_nid;
    const pubName = target === 'main' ? part.asignado_nombre : part.asignado_auxiliar_nombre;
    const pub = publishers.find(
      (p) => (p.nid || p.id) === pubId || p.full_name === pubName || p.name === pubName
    );

    if (!pub && !pubName) {
      showToast('No hay hermano asignado para enviar.');
      return;
    }

    const effectivePub = pub || {
      id: pubId || 'temp',
      name: pubName || 'Hermano',
      full_name: pubName,
      gender: 'hermano' as const,
      phone: '',
    };

    const text = buildClmWhatsAppMessage(
      effectivePub,
      part,
      semanaFechaStr,
      settings?.congregationName,
      {
        isReminder,
        isAssistant: target === 'assistant',
        mainPublisherName: part.asignado_nombre,
        weekId: currentWeek?.id,
      }
    );

    sendWhatsApp(effectivePub.phone, text);
    toggleNotified(`${part.id}_${target}`);
    showToast(`Abriendo WhatsApp para ${effectivePub.full_name || effectivePub.name}...`);
  };

  // Helper para copiar texto al portapapeles
  const handleCopyWhatsAppMessage = (
    part: ClmParte,
    target: 'main' | 'assistant',
    isReminder: boolean = false
  ) => {
    const pubId = target === 'main' ? part.asignado_nid : part.asignado_auxiliar_nid;
    const pubName = target === 'main' ? part.asignado_nombre : part.asignado_auxiliar_nombre;
    const pub = publishers.find(
      (p) => (p.nid || p.id) === pubId || p.full_name === pubName || p.name === pubName
    );

    const effectivePub = pub || {
      id: pubId || 'temp',
      name: pubName || 'Hermano',
      full_name: pubName,
      gender: 'hermano' as const,
      phone: '',
    };

    const text = buildClmWhatsAppMessage(
      effectivePub,
      part,
      semanaFechaStr,
      settings?.congregationName,
      {
        isReminder,
        isAssistant: target === 'assistant',
        mainPublisherName: part.asignado_nombre,
        weekId: currentWeek?.id,
      }
    );

    navigator.clipboard.writeText(text);
    setCopiedPartId(`${part.id}_${target}`);
    setTimeout(() => setCopiedPartId(null), 2500);
    showToast('¡Mensaje copiado al portapapeles!');
  };

  // Copiar resumen completo de la reunión
  const handleCopyFullMeetingSummary = () => {
    if (!programa) return;
    let summary = `📋 *PROGRAMA DE LA REUNIÓN VIDA Y MINISTERIO CRISTIANOS*\n`;
    summary += `🏛 *${settings?.congregationName || 'Congregación'}*\n`;
    summary += `📅 *${programa.rango_semana || programa.semana_fecha}*\n`;
    if (programa.lectura_semana) {
      summary += `📖 *Lectura semanal:* ${programa.lectura_semana}\n`;
    }
    summary += `\n─────────────────────\n`;

    programa.partes.forEach((p) => {
      if (p.tipo === 'canto') {
        summary += `🎵 *${p.titulo}*\n`;
      } else {
        const sala = p.es_clase_auxiliar ? ' (Sala Auxiliar)' : '';
        const tit = p.asignado_nombre ? `👉 *${p.asignado_nombre}*` : '⏳ [Sin asignar]';
        summary += `• *${p.titulo}${sala}*: ${tit}\n`;
        if (p.asignado_auxiliar_nombre) {
          summary += `   👥 Ayudante: *${p.asignado_auxiliar_nombre}*\n`;
        }
      }
    });

    summary += `\n─────────────────────\n`;
    summary += `🙏 _Por favor tengan a bien confirmar su participación o avisar con tiempo ante cualquier eventualidad._`;

    navigator.clipboard.writeText(summary);
    showToast('¡Resumen completo de la reunión copiado!');
  };

  // Helper para verificar cruces de un publicador
  const getPublisherConflicts = (pubId: string | null | undefined, pubName: string | undefined, partId: string) => {
    if (!pubId && !pubName) return { hasStrictConflict: false, conflicts: [] };
    return checkPublisherConflictsOnDate(
      pubId || '',
      pubName,
      semanaFechaStr,
      {
        clmProgramas: programa ? [programa] : [],
        weekendProgramas,
        turnosDeberes,
        weeks,
        publishers,
        outgoingSpeakers,
      },
      partId
    );
  };

  // Estadísticas globales de conflictos de la semana para el botón de la cabecera
  const currentWeekConflictStats = useMemo(() => {
    if (!programa?.partes) return { total: 0, strict: 0, warning: 0 };
    let strict = 0;
    let warning = 0;

    programa.partes.forEach((p) => {
      if (p.asignado_nombre || p.asignado_nid) {
        const tit = getPublisherConflicts(p.asignado_nid, p.asignado_nombre, p.id);
        tit.conflicts.forEach((c) => {
          if (c.severity === 'STRICT_CONFLICT') strict++;
          else warning++;
        });
      }
      if (p.asignado_auxiliar_nombre || p.asignado_auxiliar_nid) {
        const aux = getPublisherConflicts(p.asignado_auxiliar_nid, p.asignado_auxiliar_nombre, p.id);
        aux.conflicts.forEach((c) => {
          if (c.severity === 'STRICT_CONFLICT') strict++;
          else warning++;
        });
      }
    });

    return { total: strict + warning, strict, warning };
  }, [programa, semanaFechaStr, weeks, publishers, outgoingSpeakers]);

  // Manejador de confirmación de sustitución desde el modal
  const handleConfirmReplacement = (partId: string, newPublisherId: string, target: 'main' | 'assistant') => {
    handleAssignInline(partId, newPublisherId, target);
    const newPub = publishers.find((p) => (p.nid || p.id) === newPublisherId);
    showToast(`¡Sustitución aplicada! ${newPub?.full_name || newPub?.name} asignado.`);
  };

  // Cargar programa para la semana seleccionada con prioridad en la nube (Firestore)
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      // 1. Probar desde context / Firestore (siempre el estado más actualizado y compartido)
      const fromContext = getClmPrograma(semanaFechaStr);
      if (fromContext && fromContext.partes && fromContext.partes.length > 0 && !isCancelled) {
        setPrograma(fromContext);
        return;
      }

      // 2. Probar desde Electron SQLite si está disponible
      if (window.electronAPI && typeof window.electronAPI.getClmPrograma === 'function') {
        try {
          const res = await window.electronAPI.getClmPrograma(semanaFechaStr);
          if (res && res.partes && res.partes.length > 0 && !isCancelled) {
            setPrograma(res);
            return;
          }
        } catch (e) {
          console.warn('Error loading CLM program from Electron SQLite:', e);
        }
      }

      // 3. Probar desde localStorage
      const localStored = localStorage.getItem(`clm_programa_${semanaFechaStr}`);
      if (localStored) {
        try {
          const parsed = JSON.parse(localStored);
          if (parsed && parsed.partes && parsed.partes.length > 0 && !isCancelled) {
            setPrograma(parsed);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }

      // 4. Fallback con Organized y WeekSchedule de la congregación
      if (!isCancelled) {
        const correspondingWeek = weeks.find((w) => w.weekStartDate === semanaFechaStr);
        setPrograma(createDefaultPrograma(semanaFechaStr, congregationId, correspondingWeek, publishers));
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [semanaFechaStr, congregationId, clmProgramas, weeks, publishers]);

  // Auto-guardado debounce con sincronización bidireccional a Firestore
  useEffect(() => {
    if (!programa || !programa.partes || programa.partes.length === 0) return;
    setGuardando(true);
    const timer = setTimeout(async () => {
      try {
        await updateClmPrograma(programa);
      } catch (err) {
        console.error('Error syncing CLM program to Firestore:', err);
      } finally {
        setGuardando(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [programa]);

  // Ayudante de rotación y equidad de asignaciones
  const getPublisherRotationInfo = useMemo(() => {
    const map = new Map<string, { lastDate?: string; weeksAgo?: number; total: number }>();
    const now = new Date();

    Object.values(clmProgramas).forEach((prog) => {
      if (!prog?.partes) return;
      prog.partes.forEach((parte) => {
        [parte.asignado_nid, parte.asignado_auxiliar_nid].forEach((pid) => {
          if (!pid) return;
          const cur = map.get(pid) || { total: 0 };
          cur.total++;
          if (!cur.lastDate || prog.semana_fecha > cur.lastDate) {
            cur.lastDate = prog.semana_fecha;
          }
          map.set(pid, cur);
        });
      });
    });

    map.forEach((val) => {
      if (val.lastDate) {
        const d = new Date(val.lastDate);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        val.weeksAgo = Math.max(0, Math.floor(diffDays / 7));
      }
    });

    return (pubId: string) => map.get(pubId);
  }, [clmProgramas]);

  // Asignar titular o ayudante con sugerencia inteligente de lección
  function handleAssignInline(partId: string, value: string, type: 'main' | 'assistant') {
    if (!programa) return;
    const pub = publishers.find((p) => (p.nid || p.id) === value);
    setPrograma({
      ...programa,
      partes: programa.partes.map((p) => {
        if (p.id !== partId) return p;
        if (type === 'main') {
          const isStudentPart = p.seccion === 'maestros' || p.tipo === 'lectura_biblica';
          const suggestedLessonNum = isStudentPart
            ? p.leccion_numero || pub?.currentLessonNumber || 1
            : p.leccion_numero;
          const lessonObj = suggestedLessonNum
            ? OFFICIAL_STUDENT_LESSONS.find((l) => l.number === suggestedLessonNum)
            : undefined;

          return {
            ...p,
            asignado_nid: value || null,
            asignado_nombre: pub ? pub.full_name || pub.name : '',
            leccion_numero: suggestedLessonNum,
            leccion_titulo: lessonObj?.title || p.leccion_titulo,
            leccion_estado: p.leccion_estado || 'pendiente',
          };
        }
        return {
          ...p,
          asignado_auxiliar_nid: value || null,
          asignado_auxiliar_nombre: pub ? pub.full_name || pub.name : '',
        };
      }),
    });
  }

  // Modificar número de cántico de forma interactiva
  const handleSaveSong = () => {
    if (!editingSongPart || !programa) return;
    const cleanNum = songNumberInput.trim().replace(/[^0-9]/g, '');
    const newTitle = cleanNum ? `Cántico ${cleanNum}` : editingSongPart.titulo;
    const updatedProg: ClmPrograma = {
      ...programa,
      partes: programa.partes.map((p) =>
        p.id === editingSongPart.id ? { ...p, titulo: newTitle } : p
      ),
    };
    setPrograma(updatedProg);
    updateClmPrograma(updatedProg);

    if (currentWeek) {
      const numVal = parseInt(cleanNum, 10);
      if (!isNaN(numVal)) {
        const weekCopy = JSON.parse(JSON.stringify(currentWeek));
        if (
          editingSongPart.id.includes('canto-1') ||
          (!editingSongPart.id.includes('canto-2') && !editingSongPart.id.includes('canto-3'))
        ) {
          weekCopy.midweek.songFirst = numVal;
        } else if (
          editingSongPart.id.includes('canto-2') ||
          editingSongPart.seccion === 'vida_cristiana'
        ) {
          weekCopy.midweek.songMiddle = numVal;
        } else if (editingSongPart.id.includes('canto-3')) {
          weekCopy.midweek.songConclude = numVal;
        }
        updateWeek(weekCopy);
      }
    }

    setEditingSongPart(null);
    showToast(`Cántico actualizado a: ${newTitle}`);
  };

  // Cambiar lección asignada en la parte
  const handleUpdatePartLesson = (partId: string, lessonNum: number) => {
    if (!programa) return;
    const lessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === lessonNum);
    setPrograma({
      ...programa,
      partes: programa.partes.map((p) => {
        if (p.id !== partId) return p;
        return {
          ...p,
          leccion_numero: lessonNum,
          leccion_titulo: lessonObj?.title || `Lección ${lessonNum}`,
        };
      }),
    });
  };

  // Marcar lección como completada (Avanzar)
  const handleCompleteLesson = (part: ClmParte) => {
    if (!programa || !part.asignado_nid) return;
    const pub = publishers.find((p) => (p.nid || p.id) === part.asignado_nid);
    if (!pub) return;

    const currentNum = part.leccion_numero || pub.currentLessonNumber || 1;
    const nextNum = Math.min(20, currentNum + 1);

    advancePublisherLesson(pub.id, nextNum, `Completada en reunión del ${programa.semana_fecha}`);

    setPrograma({
      ...programa,
      partes: programa.partes.map((p) => {
        if (p.id !== part.id) return p;
        return {
          ...p,
          leccion_estado: 'completada',
        };
      }),
    });

    showToast(`¡Lección #${currentNum} aprobada! ${pub.full_name || pub.name} avanzó a la lección #${nextNum}.`);
  };

  // Marcar lección para repetir (Continuar practicando)
  const handleRepeatLesson = (part: ClmParte) => {
    if (!programa || !part.asignado_nid) return;
    const pub = publishers.find((p) => (p.nid || p.id) === part.asignado_nid);
    if (!pub) return;

    const currentNum = part.leccion_numero || pub.currentLessonNumber || 1;
    repeatPublisherLesson(pub.id, `Continuar practicando en la reunión del ${programa.semana_fecha}`);

    setPrograma({
      ...programa,
      partes: programa.partes.map((p) => {
        if (p.id !== part.id) return p;
        return {
          ...p,
          leccion_estado: 'continuar',
        };
      }),
    });

    showToast(`Se registró que ${pub.full_name || pub.name} continuará practicando la lección #${currentNum}.`);
  };

  // Restablecer estado de lección a pendiente
  const handleResetLessonStatus = (part: ClmParte) => {
    if (!programa) return;
    setPrograma({
      ...programa,
      partes: programa.partes.map((p) => {
        if (p.id !== part.id) return p;
        return {
          ...p,
          leccion_estado: 'pendiente',
        };
      }),
    });
    showToast('Estado de lección restablecido a pendiente.');
  };

  // Transferir parte entre Auditorio Principal y Sala Auxiliar
  const handleTogglePartRoom = (partId: string) => {
    if (!programa) return;
    const updated = (programa.partes || []).map((p) => {
      if (p.id === partId) {
        const toAux = !p.es_clase_auxiliar;
        let newTitle = p.titulo;
        if (toAux && !newTitle.includes('(Sala auxiliar)')) {
          newTitle = `${newTitle} (Sala auxiliar)`;
        } else if (!toAux && newTitle.includes('(Sala auxiliar)')) {
          newTitle = newTitle.replace(' (Sala auxiliar)', '').trim();
        }
        return {
          ...p,
          es_clase_auxiliar: toAux,
          titulo: newTitle,
        };
      }
      return p;
    });

    const willHaveAux = updated.some(
      (p) => p.es_clase_auxiliar && (p.tipo === 'conductor_auxiliar' ? Boolean(p.asignado_nid) : true)
    );
    if (willHaveAux && !showAuxRoom) {
      setShowAuxRoom(true);
    }

    const updatedProg: ClmPrograma = {
      ...programa,
      sala_auxiliar_habilitada: willHaveAux ? true : programa.sala_auxiliar_habilitada,
      partes: updated,
    };

    setPrograma(updatedProg);
    try {
      localStorage.setItem(`clm_programa_${semanaFechaStr}`, JSON.stringify(updatedProg));
    } catch {}
    updateClmPrograma(updatedProg);
    showToast('Asignación transferida de sala correctamente.');
  };

  // Alternar activación de la Sala Auxiliar para esta semana
  const handleToggleAuxRoom = (enabled: boolean) => {
    setShowAuxRoom(enabled);
    if (!enabled) {
      setActiveRoom('principal');
    }
    if (!programa) return;

    let updatedPartes = (programa.partes || []).map((p) => {
      // Si se desactiva la sala auxiliar, devolver cualquier asignación de estudiante al Auditorio Principal
      if (!enabled && p.es_clase_auxiliar && p.tipo !== 'conductor_auxiliar') {
        return {
          ...p,
          es_clase_auxiliar: false,
          titulo: p.titulo.replace(' (Sala auxiliar)', '').trim(),
        };
      }
      return p;
    });

    const updatedProg: ClmPrograma = {
      ...programa,
      sala_auxiliar_habilitada: enabled,
      partes: updatedPartes,
    };

    setPrograma(updatedProg);
    try {
      localStorage.setItem(`clm_programa_${semanaFechaStr}`, JSON.stringify(updatedProg));
    } catch {}
    updateClmPrograma(updatedProg);
    showToast(enabled ? 'Sala Auxiliar activada para esta semana.' : 'Sala Auxiliar desactivada correctamente.');
  };

  // Guardar manualmente en Firestore
  const handleGuardar = async (prog: ClmPrograma | null) => {
    if (!prog) return;
    setGuardando(true);
    try {
      await updateClmPrograma(prog);
      showToast('¡Programa sincronizado con Firestore exitosamente!');
    } catch (e) {
      console.error('Error en guardado:', e);
      showToast('Error al sincronizar con la nube');
    } finally {
      setGuardando(false);
    }
  };

  // Generar comprobantes oficiales S-89
  const handleGenerateS89 = () => {
    if (!programa) return;
    generateS89Pdf(programa, publishers);
  };

  // Auto-asignación inteligente
  const handleAutoAssign = () => {
    if (!programa) return;
    const historial: ClmHistorialItem[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('clm_programa_') && key !== `clm_programa_${programa.semana_fecha}`) {
          const val = localStorage.getItem(key);
          if (val) {
            const p: ClmPrograma = JSON.parse(val);
            if (p.partes) {
              p.partes.forEach((parte) => {
                if (parte.asignado_nid) {
                  historial.push({
                    publisher_nid: parte.asignado_nid,
                    publisher_name: parte.asignado_nombre,
                    semana_fecha: p.semana_fecha,
                    tipo_parte: parte.tipo,
                    titulo_parte: parte.titulo,
                    rol: 'titular',
                  });
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Historial warning:', e);
    }

    const asignado = autoAsignarLocal(programa, publishers, historial);
    setPrograma(asignado);
    showToast('Asignaciones completadas con rotación inteligente.');
  };

  // Quitar rápidamente a todos los publicadores asignados de esta reunión
  const handleQuickClearAllAssignments = () => {
    if (!programa) return;
    const hasAnyAssigned = (programa.partes || []).some(
      (p) => p.asignado_nid || p.asignado_nombre || p.asignado_auxiliar_nid || p.asignado_auxiliar_nombre
    );
    if (!hasAnyAssigned) {
      showToast('No hay participantes asignados en esta reunión.');
      return;
    }
    setIsConfirmClearClmOpen(true);
  };

  const handleConfirmClearClm = () => {
    if (!programa) return;
    setIsConfirmClearClmOpen(false);

    const cleared: ClmPrograma = {
      ...programa,
      partes: (programa.partes || []).map((p) => ({
        ...p,
        asignado_nid: null,
        asignado_nombre: '',
        asignado_auxiliar_nid: null,
        asignado_auxiliar_nombre: '',
      })),
    };
    setPrograma(cleared);
    try {
      localStorage.setItem(`clm_programa_${semanaFechaStr}`, JSON.stringify(cleared));
    } catch {}
    updateClmPrograma(cleared);
    showToast('Se quitaron todos los asignados de esta reunión.');
  };

  // Sincronizar catálogo oficial exactamente como en Organized
  const handleSyncOrganized = () => {
    if (!programa) return;
    const correspondingWeek = weeks.find((w) => w.weekStartDate === programa.semana_fecha);
    const org = getOrganizedScheduleForWeek(programa.id, programa.semana_fecha);
    if (!org) {
      showToast('No se encontró catálogo para esta semana en Organized.');
      return;
    }
    if (correspondingWeek) {
      const updatedWeek = applyOrganizedToWeek(correspondingWeek, org);
      updateWeek(updatedWeek);
    }
    const fresh = createDefaultPrograma(programa.semana_fecha, congregationId, correspondingWeek, publishers);
    setPrograma(fresh);
    try {
      localStorage.setItem(`clm_programa_${programa.semana_fecha}`, JSON.stringify(fresh));
    } catch {}
    updateClmPrograma(fresh);
    showToast('Datos de la semana sincronizados exactamente con Organized.');
  };

  // Enviar a Cartelera
  const handleSendBillboard = () => {
    showToast('¡Programa publicado y enviado a la cartelera digital!');
  };

  // Importar archivo .jwpub
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast(`Archivo "${file.name}" cargado exitosamente.`);
    }
  };

  // Navegación de fechas
  const handlePrevWeek = () => {
    const nextDate = new Date(semanaActual);
    nextDate.setDate(nextDate.getDate() - 7);
    setSemanaActual(nextDate);
    onWeekChange?.(getMonday(nextDate));
  };

  const handleNextWeek = () => {
    const nextDate = new Date(semanaActual);
    nextDate.setDate(nextDate.getDate() + 7);
    setSemanaActual(nextDate);
    onWeekChange?.(getMonday(nextDate));
  };

  // Garantizar que siempre exista un programa con partes completas (evita pantalla vacía)
  const effectivePrograma = useMemo(() => {
    if (programa && programa.partes && programa.partes.length > 0 && programa.semana_fecha === semanaFechaStr) {
      return programa;
    }
    const fromCtx = getClmPrograma(semanaFechaStr);
    if (fromCtx && fromCtx.partes && fromCtx.partes.length > 0) return fromCtx;
    const correspondingWeek = weeks.find((w) => w.weekStartDate === semanaFechaStr);
    return createDefaultPrograma(semanaFechaStr, congregationId, correspondingWeek, publishers);
  }, [programa, semanaFechaStr, clmProgramas, weeks, publishers, congregationId]);

  // Sala activa efectiva (si sala auxiliar está desactivada, siempre es Auditorio)
  const currentRoom = showAuxRoom ? activeRoom : 'principal';

  // Filtrado según sala seleccionada
  const visiblePartes = useMemo(() => {
    const prog = effectivePrograma;
    if (!prog || !prog.partes) return [];
    if (currentRoom === 'auxiliar') {
      return prog.partes.filter((p) => p.es_clase_auxiliar);
    }
    return prog.partes.filter((p) => !p.es_clase_auxiliar);
  }, [effectivePrograma, currentRoom]);

  // Agrupación visual por secciones
  const groupedSections = useMemo(() => {
    // Clasificar con precisión los cánticos de la reunión (Inicial, Intermedio y Final)
    const cantos = visiblePartes.filter((p) => p.tipo === 'canto');
    const cantoInicial =
      cantos.find((p) => p.id.includes('canto-1') || p.id.includes('inicio') || p.id.includes('apertura')) ||
      (cantos.length > 0 ? cantos[0] : null);
    const cantoFinal =
      cantos.find((p) => p.id.includes('canto-3') || p.id.includes('cierre') || p.id.includes('conclu')) ||
      (cantos.length >= 3 ? cantos[cantos.length - 1] : null);
    const cantoIntermedio =
      cantos.find(
        (p) =>
          p.id.includes('canto-2') ||
          (p.seccion === 'vida_cristiana' && p !== cantoInicial && p !== cantoFinal)
      ) || (cantos.length > 2 && cantos[1] !== cantoFinal ? cantos[1] : null);

    // 1. Marco Inicial: Solo Presidente, Cántico 1 (inicial), Oración de apertura y Conductor auxiliar
    const marcoInicial = visiblePartes.filter((p) => {
      if (p.seccion !== 'marco') return false;
      if (p.tipo === 'canto') {
        return p === cantoInicial;
      }
      return p.tipo === 'presidente' || p.tipo === 'oracion_apertura' || p.tipo === 'conductor_auxiliar';
    });

    // 2. Tesoros de la Biblia (Exactamente una sola lectura bíblica, sin duplicados)
    const tesorosRaw = visiblePartes.filter((p) => p.seccion === 'tesoros');
    let hasReading = false;
    const tesoros = tesorosRaw.filter((p) => {
      const isReading = p.tipo === 'lectura_biblica' || p.titulo.toLowerCase().includes('lectura de la biblia');
      if (isReading) {
        if (hasReading) return false;
        hasReading = true;
      }
      return true;
    });

    // 3. Seamos mejores maestros (Demostraciones estudiantiles, sin lecturas duplicadas)
    const maestros = visiblePartes.filter(
      (p) =>
        p.seccion === 'maestros' &&
        p.tipo !== 'lectura_biblica' &&
        !p.titulo.toLowerCase().includes('lectura de la biblia')
    );

    // 4. Cántico Intermedio (inicia Nuestra Vida Cristiana)
    const cantoMedio = visiblePartes.filter((p) => {
      if (p.tipo !== 'canto') return false;
      if (cantoIntermedio && p === cantoIntermedio) return true;
      return p.seccion === 'vida_cristiana' && p !== cantoInicial && p !== cantoFinal;
    });

    // 5. Nuestra Vida Cristiana (excluyendo cánticos y deduplicando estudio bíblico)
    let hasCbs = false;
    const vidaCristiana = visiblePartes.filter((p) => {
      if (p.seccion !== 'vida_cristiana' || p.tipo === 'canto') return false;
      const isCbs =
        p.tipo === 'estudio_biblico_grupo' ||
        p.id.includes('cbs') ||
        p.titulo.toLowerCase().includes('estudio bíblico') ||
        p.titulo.toLowerCase().includes('estudio biblico');
      if (isCbs && p.tipo !== 'lector_estudio') {
        if (hasCbs) return false;
        hasCbs = true;
      }
      return true;
    });

    // 6. Marco Final: Cántico 3 (conclusión) y Oración de conclusión
    const marcoFinal = visiblePartes.filter((p) => {
      if (p.tipo === 'oracion_cierre') return true;
      if (p.tipo === 'canto') {
        return p === cantoFinal && p !== cantoInicial;
      }
      return false;
    });

    return {
      marcoInicial,
      tesoros,
      maestros,
      cantoMedio,
      vidaCristiana,
      marcoFinal,
    };
  }, [visiblePartes]);

  // Conteo de numeración de partes (1, 2, 3...)
  let currentPartNumber = 0;

  // Renderizador de fila de parte individual
  const renderPartRow = (part: ClmParte) => {
    const isSong = part.tipo === 'canto';
    const isPrayer = part.tipo === 'oracion_apertura' || part.tipo === 'oracion_cierre' || part.tipo === 'oracion_estudio';
    const isExpanded = expandedPartId === part.id;
    const isCounselor = part.tipo === 'conductor_auxiliar';

    let badgeContent = null;
    if (isSong) {
      badgeContent = (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-indigo-500" />
        </div>
      );
    } else if (isPrayer) {
      badgeContent = (
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
        </div>
      );
    } else if (isCounselor) {
      badgeContent = (
        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
          C.
        </div>
      );
    } else {
      currentPartNumber++;
      badgeContent = (
        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
          {currentPartNumber}.
        </div>
      );
    }

    const { conflicts } = getPublisherConflicts(part.asignado_nid, part.asignado_nombre, part.id);
    const hasStrict = conflicts.some((c) => c.severity === 'STRICT_CONFLICT');
    const hasSaturation = conflicts.some((c) => c.severity === 'WARNING_SATURATION');

    const isStudentPart = part.seccion === 'maestros' || part.tipo === 'lectura_biblica';
    const studentPub = publishers.find(
      (p) =>
        (p.nid || p.id) === part.asignado_nid ||
        p.full_name === part.asignado_nombre ||
        p.name === part.asignado_nombre
    );
    const assignedLessonNum = part.leccion_numero || studentPub?.currentLessonNumber || 1;
    const assignedLessonObj = OFFICIAL_STUDENT_LESSONS.find((l) => l.number === assignedLessonNum);

    return (
      <div key={part.id} className="border-b border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
          {/* Lado izquierdo: Ícono/Número + Título + Subtítulo */}
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            {badgeContent}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {part.titulo}
                </h4>
                {part.duracion_min && !part.titulo.includes('min') && (
                  <span className="text-xs text-slate-400 font-normal">
                    ({part.duracion_min} min)
                  </span>
                )}
              </div>

              {part.descripcion && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tracking-tight">
                  {part.descripcion}
                </p>
              )}

              {part.asignado_auxiliar_nombre && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Ayudante: <strong>{part.asignado_auxiliar_nombre}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignInline(part.id, '', 'assistant');
                    }}
                    className="p-0.5 rounded-md text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                    title={`Quitar a ${part.asignado_auxiliar_nombre} como ayudante`}
                    aria-label="Quitar ayudante"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}

              {/* Distintivo de Consejero de la Sala Auxiliar */}
              {isCounselor && (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60">
                    <UserCheck size={11} />
                    <span>Consejero de Sala Auxiliar</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAuxCounselorModalOpen(true)}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline cursor-pointer font-semibold"
                  >
                    Ver panel del consejero y hoja S-38 →
                  </button>
                </div>
              )}

              {/* Barra de Lección de Estudiante (Folleto th / lmd) */}
              {isStudentPart && part.asignado_nombre && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-[11px] text-indigo-900 dark:text-indigo-200">
                    <BookOpen size={12} className="text-indigo-500" />
                    <span className="font-bold">Lecc. #{assignedLessonNum}:</span>
                    <span className="truncate max-w-[170px] sm:max-w-[240px]">
                      {part.leccion_titulo || assignedLessonObj?.title || `Lección ${assignedLessonNum}`}
                    </span>
                  </div>

                  {/* Estado de lección */}
                  {part.leccion_estado === 'completada' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 size={11} /> Aprobada
                    </span>
                  ) : part.leccion_estado === 'continuar' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <RotateCcw size={11} /> Practicar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Clock size={11} /> Pendiente
                    </span>
                  )}

                  {/* Acciones rápidas del consejero */}
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteLesson(part);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Aprobar lección y avanzar al estudiante en el registro S-38"
                    >
                      <Check size={11} />
                      <span>Aprobar</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepeatLesson(part);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Registrar para practicar de nuevo esta lección"
                    >
                      <RotateCcw size={11} />
                      <span>Repetir</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lado derecho: Estado / Botón de Asignación */}
          <div className="flex items-center gap-2 shrink-0">
            {isSong ? (
              <div className="flex items-center gap-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Congregación
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const numMatch = part.titulo.match(/\d+/);
                    setSongNumberInput(numMatch ? numMatch[0] : '');
                    setEditingSongPart(part);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cambiar o corregir número de cántico"
                >
                  <Edit3 size={13} />
                </button>
              </div>
            ) : part.asignado_nombre ? (
              <div className="flex items-center gap-1.5">
                {conflicts.length > 0 && (
                  <span
                    title={conflicts.map((c) => c.details).join(' | ')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-help ${
                      hasStrict
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <AlertTriangle size={11} />
                    {hasStrict ? 'Cruce' : 'Saturación'}
                  </span>
                )}

                <button
                  onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                  className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Editar o cambiar asignación"
                >
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{part.asignado_nombre}</span>
                </button>

                {/* Botón Rápido Quitar Titular */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssignInline(part.id, '', 'main');
                  }}
                  className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                  title={`Quitar a ${part.asignado_nombre} (dejar libre)`}
                  aria-label="Quitar asignado"
                >
                  <X size={13} />
                </button>

                {/* Asignado Ayudante si aplica */}
                {part.asignado_auxiliar_nombre && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Cambiar ayudante"
                    >
                      <span className="text-[10px] text-indigo-500 font-bold">Ayudante:</span>
                      <span>{part.asignado_auxiliar_nombre}</span>
                    </button>
                    {/* Botón Rápido Quitar Ayudante */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignInline(part.id, '', 'assistant');
                      }}
                      className="p-1 rounded-full text-rose-500 hover:text-white hover:bg-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
                      title={`Quitar ayudante a ${part.asignado_auxiliar_nombre} (dejar libre)`}
                      aria-label="Quitar ayudante"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* Botón Ficha S-38 Estudiante */}
                {isStudentPart && studentPub && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudentForModal(studentPub);
                    }}
                    className="p-1.5 rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
                    title={`Ver Ficha Oficial S-38 e historial de ${studentPub.full_name || studentPub.name}`}
                    aria-label="Ver Ficha S-38"
                  >
                    <Award size={14} />
                  </button>
                )}

                {/* Botón Sustituir Asignación */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPartForReplacement(part);
                  }}
                  className="p-1.5 rounded-full text-amber-600 hover:text-white hover:bg-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-600 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-2xs"
                  title={`Buscar sustituto para ${part.asignado_nombre}`}
                  aria-label="Sustituir asignación"
                >
                  <ArrowRightLeft size={14} />
                </button>

                {/* Botón WhatsApp Titular */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendWhatsAppSingle(part, 'main', false);
                  }}
                  className="p-1.5 rounded-full text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-600 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                  title={`Enviar asignación por WhatsApp a ${part.asignado_nombre}`}
                  aria-label="Enviar WhatsApp al titular"
                >
                  <MessageCircle size={14} />
                </button>

                {/* Botón WhatsApp Ayudante si aplica */}
                {part.asignado_auxiliar_nombre && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendWhatsAppSingle(part, 'assistant', false);
                    }}
                    className="p-1.5 rounded-full text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
                    title={`Enviar asignación por WhatsApp al ayudante ${part.asignado_auxiliar_nombre}`}
                    aria-label="Enviar WhatsApp al ayudante"
                  >
                    <MessageCircle size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                className="px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100/80 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
              >
                + Sin Asignar
              </button>
            )}
          </div>
        </div>

        {/* Panel expandible para seleccionar asignados */}
        {isExpanded && !isSong && (
          <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-white/[0.04] grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Hermano Asignado (Titular)
                </label>
                {part.asignado_nid && (
                  <button
                    type="button"
                    onClick={() => handleAssignInline(part.id, '', 'main')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X size={11} />
                    <span>Dejar sin asignar</span>
                  </button>
                )}
              </div>
              <Select
                value={part.asignado_nid || ''}
                onChange={(val) => handleAssignInline(part.id, val, 'main')}
                options={publishers
                  .filter((p) => isPublisherEligibleForPart(p, part, 'main'))
                  .map((p) => {
                    const pId = p.nid || p.id;
                    const { conflicts: pConflicts } = getPublisherConflicts(pId, p.full_name || p.name, part.id);
                    const conflictNote =
                      pConflicts.length > 0
                        ? pConflicts.some((c) => c.severity === 'STRICT_CONFLICT')
                          ? ' ⚠️ [Cruce]'
                          : ' ⏳ [Saturación]'
                        : '';
                    const rot = getPublisherRotationInfo(pId);
                    const rotationNote = rot?.weeksAgo !== undefined
                      ? rot.weeksAgo <= 1 ? ' • [Hace 1 sem.]' : ` • [Hace ${rot.weeksAgo} sem.]`
                      : ' • [Sin reg. reciente]';
                    const lessonNote = isStudentPart ? ` • Lecc. #${p.currentLessonNumber || 1}` : '';
                    return {
                      value: pId,
                      label: `${p.full_name || p.name}${p.privilege ? ` (${p.privilege})` : ''}${lessonNote}${rotationNote}${conflictNote}`,
                    };
                  })}
                placeholder="Seleccionar titular..."
              />
            </div>

            {part.seccion === 'maestros' && part.tipo !== 'discurso_estudiante' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Ayudante (Demostración)
                  </label>
                  {part.asignado_auxiliar_nid && (
                    <button
                      type="button"
                      onClick={() => handleAssignInline(part.id, '', 'assistant')}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <X size={11} />
                      <span>Quitar ayudante</span>
                    </button>
                  )}
                </div>
                <Select
                  value={part.asignado_auxiliar_nid || ''}
                  onChange={(val) => handleAssignInline(part.id, val, 'assistant')}
                  options={publishers
                    .filter(
                      (p) =>
                        (p.nid || p.id) !== part.asignado_nid &&
                        isPublisherEligibleForPart(p, part, 'assistant')
                    )
                    .map((p) => {
                      const pId = p.nid || p.id;
                      const rot = getPublisherRotationInfo(pId);
                      const rotationNote = rot?.weeksAgo !== undefined
                        ? rot.weeksAgo <= 1 ? ' • [Hace 1 sem.]' : ` • [Hace ${rot.weeksAgo} sem.]`
                        : '';
                      return {
                        value: pId,
                        label: `${p.full_name || p.name}${p.privilege ? ` (${p.privilege})` : ''}${rotationNote}`,
                      };
                    })}
                  placeholder="Seleccionar ayudante..."
                />
              </div>
            )}

            {/* Panel de Lección S-38 en el selector expandido */}
            {isStudentPart && (
              <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 mt-1 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <BookOpen size={14} className="text-indigo-500" />
                    Punto de Consejo (Lección Folleto Maestros th / lmd)
                  </span>
                  {studentPub && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForModal(studentPub)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Award size={13} />
                      <span>Abrir Ficha Completa S-38 de {studentPub.name}</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Asignar Otra Lección Oficial
                    </label>
                    <Select
                      value={String(part.leccion_numero || studentPub?.currentLessonNumber || 1)}
                      onChange={(val) => handleUpdatePartLesson(part.id, Number(val))}
                      options={OFFICIAL_STUDENT_LESSONS.map((l) => ({
                        value: String(l.number),
                        label: `Lección ${l.number}: ${l.title}`,
                      }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => handleCompleteLesson(part)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Aprobar Lección</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRepeatLesson(part)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      <span>Repetir Lección</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetLessonStatus(part)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-200 text-xs font-medium transition-all cursor-pointer"
                      title="Restablecer estado a pendiente"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones directas de WhatsApp en el panel expandido */}
            <div className="col-span-1 md:col-span-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {part.asignado_nombre && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppSingle(part, 'main', false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp a {part.asignado_nombre.split(' ')[0]}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppMessage(part, 'main', false)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-200 transition-all cursor-pointer"
                      title="Copiar texto del mensaje"
                    >
                      <Copy size={13} />
                      <span>{copiedPartId === `${part.id}_main` ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </>
                )}

                {part.asignado_auxiliar_nombre && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppSingle(part, 'assistant', false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp a Ayudante ({part.asignado_auxiliar_nombre.split(' ')[0]})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppMessage(part, 'assistant', false)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-200 transition-all cursor-pointer"
                      title="Copiar texto del ayudante"
                    >
                      <Copy size={13} />
                      <span>{copiedPartId === `${part.id}_assistant` ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isStudentPart && (
                  <button
                    type="button"
                    onClick={() => handleTogglePartRoom(part.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-2xs"
                    title={part.es_clase_auxiliar ? 'Transferir al Auditorio Principal' : 'Transferir a la Sala Auxiliar'}
                  >
                    <ArrowRightLeft size={13} />
                    <span>{part.es_clase_auxiliar ? 'Mover a Auditorio' : 'Mover a Sala Auxiliar'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppSingle(part, 'main', true)}
                  disabled={!part.asignado_nombre}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white underline cursor-pointer disabled:opacity-40"
                >
                  Enviar como recordatorio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fade-in">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── BARRA SUPERIOR DE ACCIONES (SOLO CUANDO NO ESTÁ EMBEBIDO EN LA BARRA UNIFICADA) ── */}
      {!hideHeaderToolbar ? (
        <>
          <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Título: Programa VMC */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  Programa <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">VMC</span>
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  Vida y Ministerio Cristianos
                </p>
              </div>
            </div>

            {/* Botones de acción derecha */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sincronizar */}
              <button
                onClick={handleSyncOrganized}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Sincronizar catálogo oficial con Organized"
              >
                <RefreshCw size={13} className="shrink-0" />
                <span>Sincronizar</span>
              </button>

              {/* Importar .jwpub */}
              <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs">
                <FileUp size={13} className="shrink-0" />
                <span>Importar .jwpub</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jwpub,.json,.epub"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>

              {/* Auto-Asignar */}
              <button
                onClick={handleAutoAssign}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Auto-asignar respetando rotación histórica y privilegios"
              >
                <Sparkles size={13} className="shrink-0" />
                <span>Auto-Asignar</span>
              </button>

              {/* Quitar Asignados */}
              <button
                type="button"
                onClick={handleQuickClearAllAssignments}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Quitar a todas las personas asignadas de esta reunión"
              >
                <UserMinus size={13} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Quitar Asignados</span>
              </button>

              {/* Cartelera Mensual Salón del Reino */}
              <button
                type="button"
                onClick={() => setIsMonthlyBillboardModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Abrir programa mensual apaisado para la cartelera de anuncios del Salón del Reino"
              >
                <CalendarDays size={13} className="shrink-0" />
                <span>Cartelera Mensual</span>
              </button>

              {/* WhatsApp VMC Notificador */}
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Centro de envíos de asignaciones y recordatorios por WhatsApp"
              >
                <MessageCircle size={13} className="shrink-0" />
                <span>WhatsApp VMC</span>
              </button>

              {/* Indicador de Estado de Sincronización en la Nube */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300">
                {syncStatus === 'saving' || guardando ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-indigo-500" />
                    <span className="hidden sm:inline">Guardando en nube...</span>
                  </>
                ) : syncStatus === 'synced' ? (
                  <>
                    <CloudCheck size={14} className="text-emerald-500" />
                    <span className="hidden sm:inline">Nube al día</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertTriangle size={14} className="text-rose-500" />
                    <span className="hidden sm:inline">Error de sync</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-amber-500" />
                    <span className="hidden sm:inline">Modo local seguro</span>
                  </>
                )}
              </div>

              {/* Guardar */}
              <button
                onClick={() => handleGuardar(programa)}
                disabled={guardando}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-white/10 dark:text-zinc-200 dark:border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Guardar y sincronizar con Firestore inmediatamente"
              >
                <Save size={13} className="shrink-0" />
                <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
              </button>

              {/* Imprimir S-89 */}
              <button
                onClick={handleGenerateS89}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Imprimir hojas oficiales de asignación S-89 en PDF"
              >
                <FileText size={13} className="shrink-0" />
                <span>Imprimir S-89</span>
              </button>

              {/* Fichas S-38 / Folleto Maestros */}
              <button
                type="button"
                onClick={() => {
                  const studentInProg = programa?.partes.find(
                    (p) => (p.seccion === 'maestros' || p.tipo === 'lectura_biblica') && p.asignado_nid
                  );
                  const pub = studentInProg
                    ? publishers.find((p) => (p.nid || p.id) === studentInProg.asignado_nid)
                    : publishers[0];
                  if (pub) setSelectedStudentForModal(pub);
                  else showToast('No hay estudiantes disponibles.');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Ver registros oficiales S-38 y control de lecciones del folleto de oratoria"
              >
                <Award size={13} className="shrink-0" />
                <span>Fichas S-38</span>
              </button>

              {/* Consejero Sala Auxiliar */}
              <button
                type="button"
                onClick={() => {
                  setShowAuxRoom(true);
                  setIsAuxCounselorModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Gestionar el Consejero y asignaciones de la Sala Auxiliar"
              >
                <UserCheck size={13} className="shrink-0" />
                <span>
                  {auxCounselorPart?.asignado_nombre
                    ? `Consejero: ${auxCounselorPart.asignado_nombre.split(' ')[0]}`
                    : 'Consejero Auxiliar'}
                </span>
              </button>

              {/* Botón Centro de Conflictos de la Semana */}
              <button
                type="button"
                onClick={() => setIsWeeklyConflictsModalOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
                  currentWeekConflictStats.strict > 0
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                    : currentWeekConflictStats.warning > 0
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}
                title="Ver auditoría de cruces, ausencias y saturaciones de esta semana"
              >
                {currentWeekConflictStats.strict > 0 ? (
                  <AlertTriangle size={13} className="text-rose-600" />
                ) : currentWeekConflictStats.warning > 0 ? (
                  <AlertTriangle size={13} className="text-amber-600" />
                ) : (
                  <ShieldCheck size={13} className="text-emerald-600" />
                )}
                <span>
                  {currentWeekConflictStats.strict > 0
                    ? `${currentWeekConflictStats.strict} Cruces`
                    : currentWeekConflictStats.warning > 0
                    ? `${currentWeekConflictStats.warning} Saturación`
                    : 'Sin Cruces'}
                </span>
              </button>
            </div>
          </div>

          {/* ── BARRA DE NAVEGACIÓN Y SELECTOR DE FECHAS STANDALONE ── */}
          <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
            {/* Cápsula de navegación semanal */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-xs gap-3">
              <button
                onClick={handlePrevWeek}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Semana anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-2.5 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {programa?.rango_semana || `Semana del ${semanaFechaStr}`}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {programa?.lectura_semana || 'JEREMÍAS 40, 41'}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  Semana {programa?.semana_num || '41'}
                </span>
              </div>

              <button
                onClick={handleNextWeek}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Semana siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Checkbox de Sala Auxiliar */}
            <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none">
              <input
                type="checkbox"
                checked={showAuxRoom}
                onChange={(e) => handleToggleAuxRoom(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300 cursor-pointer"
              />
              <span>Sala Auxiliar</span>
            </label>
          </div>

          {/* Selector de sala standalone */}
          <div className="px-6 pt-3.5 pb-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveRoom('principal')}
                className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                  activeRoom === 'principal'
                    ? 'text-slate-800 dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                <span>Auditorio</span>
              </button>

              {showAuxRoom && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <button
                    onClick={() => setActiveRoom('auxiliar')}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${
                      activeRoom === 'auxiliar'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span>Sala Auxiliar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── ENCABEZADO VMC SUPER MINIMALISTA (MODO EMBEBIDO / UNIFICADO) ── */
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200/70 dark:border-white/[0.05] flex items-center justify-between gap-3 flex-wrap text-xs">
          {/* Lectura bíblica y semana */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              Reunión Entre Semana (VMC)
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              {effectivePrograma?.lectura_semana || 'JEREMÍAS 40, 41'}
            </span>
          </div>

          {/* Selector de salas y configuración auxiliar compacta */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Píldora de sala Auditorio / Sala Auxiliar si está habilitada */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveRoom('principal')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRoom === 'principal'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Auditorio</span>
              </button>

              {showAuxRoom && (
                <button
                  type="button"
                  onClick={() => setActiveRoom('auxiliar')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeRoom === 'auxiliar'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Sala Auxiliar</span>
                </button>
              )}
            </div>

            {/* Checkbox discreto para activar Sala Auxiliar */}
            <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={showAuxRoom}
                onChange={(e) => handleToggleAuxRoom(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300 cursor-pointer"
              />
              <span className="text-[11px]">2 Salas</span>
            </label>

            {/* Acceso a Consejero si la sala auxiliar está activa */}
            {showAuxRoom && (
              <button
                type="button"
                onClick={() => setIsAuxCounselorModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/40 transition-all cursor-pointer"
                title="Consejero de la Sala Auxiliar"
              >
                <UserCheck size={12} className="shrink-0" />
                <span>
                  {auxCounselorPart?.asignado_nombre
                    ? auxCounselorPart.asignado_nombre.split(' ')[0]
                    : 'Consejero'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── LISTADO OFICIAL DE LA REUNIÓN ── */}
      <div className="flex-1 overflow-y-auto pb-16">
        {/* Banner de la Sala Auxiliar cuando está activa */}
        {activeRoom === 'auxiliar' && (
          <div className="mx-6 mt-3 mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <UserCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    SALA AUXILIAR
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Folleto Maestros
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Consejero:{' '}
                  <span className="text-amber-700 dark:text-amber-400">
                    {auxCounselorPart?.asignado_nombre || 'Sin asignar todavía'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {visiblePartes.filter((p) => p.seccion === 'maestros' || p.tipo === 'lectura_biblica').length} intervenciones de estudiantes programadas en esta sala.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAuxCounselorModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <UserCheck size={13} />
                <span>Panel del Consejero</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (programa) {
                    generateCounselorSheetPdf({
                      congregationName: settings?.congregationName || 'la congregación',
                      programa,
                      counselorName: auxCounselorPart?.asignado_nombre,
                      publishers,
                    });
                    showToast('Hoja de trabajo del Consejero descargada en PDF.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Descargar Hoja de Trabajo del Consejero en PDF para la reunión"
              >
                <FileText size={13} />
                <span>Hoja PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de guía si la Sala Auxiliar no tiene estudiantes asignados */}
        {activeRoom === 'auxiliar' && visiblePartes.filter((p) => p.seccion === 'maestros' || p.tipo === 'lectura_biblica').length === 0 && (
          <div className="mx-6 mb-5 p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
              No hay estudiantes programados en la Sala Auxiliar
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 max-w-md mx-auto">
              Todo el programa regular se muestra en el Auditorio Principal. Puedes transferir intervenciones a esta sala desde el Auditorio o desactivar la Sala Auxiliar si tu congregación no la utilizará esta semana.
            </p>
            <div className="mt-3.5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveRoom('principal')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Volver al Auditorio Principal
              </button>
              <button
                type="button"
                onClick={() => handleToggleAuxRoom(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              >
                Desactivar Sala Auxiliar
              </button>
            </div>
          </div>
        )}
        {/* 1. Marco Inicial: Presidente, Cántico 1, Oración */}
        {groupedSections.marcoInicial.map((part) => renderPartRow(part))}

        {/* 2. Sección: TESOROS DE LA BIBLIA */}
        {groupedSections.tesoros.length > 0 && (
          <div className="mt-2">
            <div
              style={{ backgroundColor: SECTION_BANNERS.tesoros.bgColor }}
              className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
            >
              {SECTION_BANNERS.tesoros.label}
            </div>
            {groupedSections.tesoros.map((part) => renderPartRow(part))}
          </div>
        )}

        {/* 3. Sección: SEAMOS MEJORES MAESTROS */}
        {groupedSections.maestros.length > 0 && (
          <div className="mt-2">
            <div
              style={{ backgroundColor: SECTION_BANNERS.maestros.bgColor }}
              className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
            >
              {SECTION_BANNERS.maestros.label}
            </div>
            {groupedSections.maestros.map((part) => renderPartRow(part))}
          </div>
        )}

        {/* 4. Cántico Intermedio */}
        {groupedSections.cantoMedio.map((part) => renderPartRow(part))}

        {/* 5. Sección: NUESTRA VIDA CRISTIANA */}
        {groupedSections.vidaCristiana.length > 0 && (
          <div className="mt-2">
            <div
              style={{ backgroundColor: SECTION_BANNERS.vida_cristiana.bgColor }}
              className="w-full text-white py-2.5 px-6 font-bold uppercase text-xs sm:text-sm tracking-wider text-center shadow-xs select-none"
            >
              {SECTION_BANNERS.vida_cristiana.label}
            </div>
            {groupedSections.vidaCristiana.map((part) => renderPartRow(part))}
          </div>
        )}

        {/* 6. Marco Final: Cántico de cierre y Oración de conclusión */}
        {groupedSections.marcoFinal.map((part) => renderPartRow(part))}
      </div>

      {/* ── MODAL CENTRO DE ENVÍOS WHATSAPP VMC ── */}
      {isWhatsAppModalOpen && programa && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Centro de Notificaciones WhatsApp
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      VMC
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {programa.rango_semana || `Semana del ${programa.semana_fecha}`} • {settings?.congregationName || 'Congregación'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Controles de Modo y Resumen */}
            <div className="p-4 sm:px-6 bg-slate-100/60 dark:bg-slate-800/30 border-b border-slate-200/80 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setWhatsAppIsReminder(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !whatsAppIsReminder
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Nueva Asignación
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppIsReminder(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    whatsAppIsReminder
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Recordatorio Semanal
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyFullMeetingSummary}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Copy size={13} />
                <span>Copiar Resumen Completo</span>
              </button>
            </div>

            {/* Lista de Partes Asignadas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {(() => {
                const assignedParts = programa.partes.filter(
                  (p) => p.tipo !== 'canto' && (p.asignado_nombre || p.asignado_auxiliar_nombre)
                );

                if (assignedParts.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <p className="text-sm">No hay hermanos asignados todavía para esta semana.</p>
                      <p className="text-xs mt-1">Asigna a los hermanos en el programa antes de enviar avisos.</p>
                    </div>
                  );
                }

                return assignedParts.map((part) => {
                  const titPub = publishers.find(
                    (p) => (p.nid || p.id) === part.asignado_nid || p.full_name === part.asignado_nombre || p.name === part.asignado_nombre
                  );
                  const auxPub = publishers.find(
                    (p) => (p.nid || p.id) === part.asignado_auxiliar_nid || p.full_name === part.asignado_auxiliar_nombre || p.name === part.asignado_auxiliar_nombre
                  );

                  const titNotified = notifiedPartIds[`${part.id}_main`];
                  const auxNotified = notifiedPartIds[`${part.id}_assistant`];

                  return (
                    <div
                      key={part.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                    >
                      {/* Info de la parte */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${SECTION_BANNERS[part.seccion as keyof typeof SECTION_BANNERS]?.bgColor || '#6366f1'}20`,
                              color: SECTION_BANNERS[part.seccion as keyof typeof SECTION_BANNERS]?.bgColor || '#6366f1',
                            }}
                          >
                            {part.seccion.replace('_', ' ')}
                          </span>
                          {part.es_clase_auxiliar && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Sala Auxiliar
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-800 dark:text-white">
                            {part.titulo}
                          </span>
                        </div>

                        {/* Titular */}
                        {part.asignado_nombre && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-500">Titular:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{part.asignado_nombre}</span>
                            {titPub?.phone ? (
                              <span className="text-slate-400 font-mono text-[11px]">{titPub.phone}</span>
                            ) : (
                              <span className="text-amber-500 text-[10px] italic">Sin teléfono registrado</span>
                            )}
                          </div>
                        )}

                        {/* Ayudante */}
                        {part.asignado_auxiliar_nombre && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-500">Ayudante:</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{part.asignado_auxiliar_nombre}</span>
                            {auxPub?.phone ? (
                              <span className="text-slate-400 font-mono text-[11px]">{auxPub.phone}</span>
                            ) : (
                              <span className="text-amber-500 text-[10px] italic">Sin teléfono registrado</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Botones de acción derecha */}
                      <div className="flex flex-wrap sm:flex-col items-end gap-1.5 shrink-0">
                        {part.asignado_nombre && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppSingle(part, 'main', whatsAppIsReminder)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                                titNotified
                                  ? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300 hover:bg-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={`Enviar WhatsApp a ${part.asignado_nombre}`}
                            >
                              <Send size={12} />
                              <span>{titNotified ? 'Reenviar a Titular' : 'Enviar a Titular'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyWhatsAppMessage(part, 'main', whatsAppIsReminder)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-200 transition-colors cursor-pointer"
                              title="Copiar texto del mensaje"
                            >
                              {copiedPartId === `${part.id}_main` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}

                        {part.asignado_auxiliar_nombre && (
                          <div className="flex items-center gap-1 mt-1 sm:mt-0">
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppSingle(part, 'assistant', whatsAppIsReminder)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                                auxNotified
                                  ? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300 hover:bg-slate-200'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                              title={`Enviar WhatsApp al ayudante ${part.asignado_auxiliar_nombre}`}
                            >
                              <Send size={12} />
                              <span>{auxNotified ? 'Reenviar a Ayudante' : 'Enviar a Ayudante'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyWhatsAppMessage(part, 'assistant', whatsAppIsReminder)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-zinc-200 transition-colors cursor-pointer"
                              title="Copiar texto del ayudante"
                            >
                              {copiedPartId === `${part.id}_assistant` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Los mensajes incluyen el enlace de confirmación en 1 clic.
              </span>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold text-slate-800 dark:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro Oficial S-38 e Historial de Estudiante */}
      {selectedStudentForModal && (
        <StudentS38HistoryModal
          publisher={selectedStudentForModal}
          isOpen={!!selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          allWeeks={weeks}
          clmProgramas={clmProgramas}
          onAdvanceLesson={advancePublisherLesson}
          onRepeatLesson={repeatPublisherLesson}
          onUpdatePublisher={updatePublisher}
        />
      )}

      {/* Modal de Sustitución de Última Hora */}
      {selectedPartForReplacement && programa && (
        <ClmReplacementModal
          isOpen={!!selectedPartForReplacement}
          onClose={() => setSelectedPartForReplacement(null)}
          part={selectedPartForReplacement}
          programa={programa}
          publishers={publishers}
          weeks={weeks}
          outgoingSpeakers={outgoingSpeakers}
          onConfirmReplacement={handleConfirmReplacement}
          congregationName={settings?.congregationName}
        />
      )}

      {/* Modal / Panel de Conflictos y Cruces de la Semana */}
      {isWeeklyConflictsModalOpen && programa && (
        <ClmWeeklyConflictsModal
          isOpen={isWeeklyConflictsModalOpen}
          onClose={() => setIsWeeklyConflictsModalOpen(false)}
          programa={programa}
          publishers={publishers}
          weeks={weeks}
          outgoingSpeakers={outgoingSpeakers}
          onOpenReplacementForPart={(partToReplace) => {
            setSelectedPartForReplacement(partToReplace);
          }}
        />
      )}

      {/* Modal de Cartelera Mensual Oficial (Landscape PDF & Preview) */}
      {isMonthlyBillboardModalOpen && (
        <ClmMonthlyBillboardModal
          isOpen={isMonthlyBillboardModalOpen}
          onClose={() => setIsMonthlyBillboardModalOpen(false)}
          congregationName={settings?.congregationName || 'la congregación'}
          clmProgramas={clmProgramas}
          publishers={publishers}
          currentDate={semanaActual}
          onPublishToBillboard={() => {
            showToast('¡Programa mensual publicado en el tablero digital de la congregación!');
          }}
        />
      )}

      {/* Modal del Consejero de la Sala Auxiliar */}
      {isAuxCounselorModalOpen && (
        <ClmAuxiliaryCounselorModal
          isOpen={isAuxCounselorModalOpen}
          onClose={() => setIsAuxCounselorModalOpen(false)}
          programa={programa}
          publishers={publishers}
          allWeeks={weeks}
          clmProgramas={Object.values(clmProgramas)}
          congregationName={settings?.congregationName || 'la congregación'}
          onUpdatePrograma={(updated) => {
            setPrograma(updated);
            updateClmPrograma(updated);
          }}
          onOpenS38Modal={(pub) => setSelectedStudentForModal(pub)}
          onCompleteLesson={handleCompleteLesson}
          onRepeatLesson={handleRepeatLesson}
          onToast={showToast}
        />
      )}
      {/* Modal de Confirmación para Quitar Asignados VMC */}
      {isConfirmClearClmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <UserMinus size={18} />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Quitar Asignados de la Reunión
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmClearClmOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              ¿Deseas quitar a todas las personas asignadas de esta reunión de entre semana?
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Los temas oficiales, canciones, lecturas de la Biblia y configuración de salas se mantendrán intactos. Solo se liberarán los participantes para que puedas reasignar libremente.
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearClmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearClm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <UserMinus size={14} />
                <span>Sí, Quitar Asignados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar número de cántico */}
      {editingSongPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Music size={18} />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Cambiar Cántico
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSongPart(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-300 block mb-1">
                Número del Cántico
              </label>
              <input
                type="number"
                min="1"
                max="158"
                value={songNumberInput}
                onChange={(e) => setSongNumberInput(e.target.value)}
                placeholder="Ej. 145"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveSong();
                  }
                }}
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5">
                Cántico actual: <span className="font-semibold text-slate-600 dark:text-zinc-300">{editingSongPart.titulo}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSongPart(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSong}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Guardar Cántico</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
