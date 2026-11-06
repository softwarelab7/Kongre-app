// src/utils/shepherdingEngine.ts
import { Publisher, ShepherdingVisit, ShepherdingUrgency, ShepherdingFocus } from '../types';

export const SHEPHERDING_FOCUS_CONFIG: Record<
  ShepherdingFocus,
  { label: string; icon: string; description: string; suggestedScriptures: string[] }
> = {
  general: {
    label: 'Ánimo General y Familia',
    icon: 'HeartHandshake',
    description: 'Edificación espiritual general, metas de familia y gratitud.',
    suggestedScriptures: ['Romanos 1:11, 12', '1 Tesalonicenses 5:11', 'Hebreos 10:24, 25'],
  },
  animo: {
    label: 'Fortalecimiento y Consuelo',
    icon: 'Sparkles',
    description: 'Apoyo ante desánimo, estrés diario o pruebas personales.',
    suggestedScriptures: ['Salmo 34:18', 'Isaías 41:10', '1 Pedro 5:7'],
  },
  enfermedad: {
    label: 'Salud y Limitaciones',
    icon: 'HeartPulse',
    description: 'Atención a hermanos mayores o con problemas de salud física o emocional.',
    suggestedScriptures: ['Salmo 41:3', '2 Corintios 4:16', 'Santiago 5:14, 15'],
  },
  duelo: {
    label: 'Duelo y Pérdida',
    icon: 'Shield',
    description: 'Consuelo bíblico por la pérdida de un ser querido.',
    suggestedScriptures: ['Salmo 147:3', 'Juan 5:28, 29', 'Revelación 21:3, 4'],
  },
  inactividad: {
    label: 'Reactivación e Interés Pastoral',
    icon: 'AlertTriangle',
    description: 'Publicadores irregulares o inactivos con amor y empatía.',
    suggestedScriptures: ['Ezequiel 34:11, 12', 'Lucas 15:4-7', 'Santiago 5:19, 20'],
  },
  nuevo_bautizado: {
    label: 'Nuevos Bautizados',
    icon: 'Award',
    description: 'Establecimiento de hábitos espirituales sólidos tras el bautismo.',
    suggestedScriptures: ['Colosenses 2:6, 7', '1 Timoteo 4:15', '2 Pedro 3:18'],
  },
  meta_espiritual: {
    label: 'Metas Teocráticas y Progreso',
    icon: 'Compass',
    description: 'Apoyo hacia el precursorado auxiliar/regular o nombramiento.',
    suggestedScriptures: ['1 Timoteo 3:1', 'Mateo 6:33', 'Hebreos 6:10'],
  },
  familia: {
    label: 'Adoración en Familia y Matrimonio',
    icon: 'Users',
    description: 'Orientación para la adoración en familia y crianza de los hijos.',
    suggestedScriptures: ['Efesios 5:25-33', 'Deuteronomio 6:6, 7', 'Salmo 127:3'],
  },
  jovenes: {
    label: 'Jóvenes en la Escuela y Trabajo',
    icon: 'BookOpen',
    description: 'Presión de grupo, metas espirituales juveniles y compañerismo sano.',
    suggestedScriptures: ['Eclesiastés 12:1', '1 Timoteo 4:12', 'Proverbios 3:5, 6'],
  },
};

export interface EvaluatedPublisherPastoral {
  publisher: Publisher;
  urgency: ShepherdingUrgency;
  urgencyScore: number;
  monthsSinceLastVisit: number | null;
  daysSinceLastVisit: number | null;
  lastVisitDateText: string;
  label: string;
  badgeStyle: string;
  reason: string;
  hasPendingScheduledVisit: boolean;
  scheduledVisit?: ShepherdingVisit;
}

/**
 * Evalúa el estado pastoral de un publicador basándose en la fecha de su último pastoreo,
 * su actividad de servicio y condiciones espirituales especiales.
 */
export function evaluatePublisherPastoralStatus(
  publisher: Publisher,
  scheduledVisits: ShepherdingVisit[] = []
): EvaluatedPublisherPastoral {
  const now = new Date();
  const scheduled = scheduledVisits.find(
    (v) => v.publisherId === publisher.id && v.status === 'programada'
  );

  let monthsSince: number | null = null;
  let daysSince: number | null = null;
  let lastVisitDateText = 'Sin registro previo';

  if (publisher.last_shepherding_visit) {
    const lastDate = new Date(publisher.last_shepherding_visit + 'T00:00:00');
    if (!isNaN(lastDate.getTime())) {
      const diffMs = now.getTime() - lastDate.getTime();
      daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      monthsSince = Math.floor(daysSince / 30.4375);
      lastVisitDateText = publisher.last_shepherding_visit;
    }
  }

  const isInactive = publisher.status === 'inactive' || (!publisher.active && publisher.status !== 'deleted');
  const isIrregular = publisher.is_regular === false;
  const isReproved = publisher.is_reproved === true;
  const explicitPriority = publisher.pastoral_priority;

  let urgency: ShepherdingUrgency = 'al_dia';
  let urgencyScore = 0;
  let label = 'Al día (< 6 meses)';
  let badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
  let reason = 'Visita pastoral reciente';

  if (isInactive) {
    urgency = 'urgente';
    urgencyScore = 100;
    label = 'Inactivo • Urgente';
    badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
    reason = 'Publicador inactivo requiere atención pastoral cariñosa inmediata';
  } else if (isIrregular || isReproved) {
    urgency = 'urgente';
    urgencyScore = 90;
    label = isIrregular ? 'Irregular • Urgente' : 'Atención Espiritual';
    badgeStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
    reason = isIrregular ? 'Publicador irregular en el informe mensual' : 'Bajo disciplina o consejo pastoral';
  } else if (explicitPriority === 'urgente') {
    urgency = 'urgente';
    urgencyScore = 85;
    label = 'Prioridad Alta';
    badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
    reason = 'Marcado con prioridad alta por los ancianos';
  } else if (monthsSince === null || monthsSince >= 12) {
    urgency = 'urgente';
    urgencyScore = monthsSince === null ? 80 : 70 + Math.min(monthsSince, 15);
    label = monthsSince === null ? 'Sin visita registrada' : `Vencido (${monthsSince} meses)`;
    badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
    reason = monthsSince === null ? 'No tiene fecha de pastoreo registrada' : 'Más de 12 meses desde la última visita';
  } else if (monthsSince >= 6 || explicitPriority === 'atencion') {
    urgency = 'atencion';
    urgencyScore = 40 + (monthsSince || 6);
    label = `Por Atender (${monthsSince} meses)`;
    badgeStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
    reason = 'Entre 6 y 12 meses transcurridos desde el último pastoreo';
  } else {
    urgency = 'al_dia';
    urgencyScore = 10;
    label = `Al día (${monthsSince || 0} meses)`;
    badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
    reason = 'Pastoreado recientemente dentro de los últimos 6 meses';
  }

  return {
    publisher,
    urgency,
    urgencyScore,
    monthsSinceLastVisit: monthsSince,
    daysSinceLastVisit: daysSince,
    lastVisitDateText,
    label,
    badgeStyle,
    reason,
    hasPendingScheduledVisit: Boolean(scheduled),
    scheduledVisit: scheduled,
  };
}

/**
 * Calcula las métricas consolidadas de pastoreo para toda la congregación.
 */
export function computeCongregationShepherdingMetrics(
  publishers: Publisher[],
  visits: ShepherdingVisit[]
) {
  const activePublishers = publishers.filter((p) => p.status !== 'deleted');
  const evaluated = activePublishers.map((p) => evaluatePublisherPastoralStatus(p, visits));

  const total = activePublishers.length;
  const urgentCount = evaluated.filter((e) => e.urgency === 'urgente').length;
  const attentionCount = evaluated.filter((e) => e.urgency === 'atencion').length;
  const upToDateCount = evaluated.filter((e) => e.urgency === 'al_dia').length;

  const scheduledCount = visits.filter((v) => v.status === 'programada').length;
  const completedVisits = visits.filter((v) => v.status === 'completada');

  // Cobertura del año de servicio en curso (septiembre a agosto)
  const now = new Date();
  const currentYear = now.getFullYear();
  const serviceYearStart = now.getMonth() >= 8 ? `${currentYear}-09-01` : `${currentYear - 1}-09-01`;

  const completedThisServiceYear = completedVisits.filter((v) => {
    const d = v.completedDate || v.scheduledDate;
    return d >= serviceYearStart;
  });

  // Publicadores únicos visitados en este año de servicio
  const uniqueVisitedIds = new Set<string>();
  completedThisServiceYear.forEach((v) => uniqueVisitedIds.add(v.publisherId));
  // También contar quienes tienen last_shepherding_visit >= serviceYearStart
  activePublishers.forEach((p) => {
    if (p.last_shepherding_visit && p.last_shepherding_visit >= serviceYearStart) {
      uniqueVisitedIds.add(p.id);
    }
  });

  const coveragePercentage = total > 0 ? Math.round((uniqueVisitedIds.size / total) * 100) : 0;

  return {
    totalPublishers: total,
    urgentCount,
    attentionCount,
    upToDateCount,
    scheduledCount,
    completedCount: completedVisits.length,
    completedThisServiceYearCount: uniqueVisitedIds.size,
    coveragePercentage,
    evaluated,
  };
}

/**
 * Genera el mensaje cordial de invitación o recordatorio para la familia o publicador.
 */
export function buildShepherdingFamilyInviteWhatsApp(params: {
  publisherName: string;
  date: string;
  time?: string;
  elder1Name: string;
  elder2Name?: string;
  focus: ShepherdingFocus;
  scriptures?: string;
}): string {
  const { publisherName, date, time, elder1Name, elder2Name, focus, scriptures } = params;
  const focusConfig = SHEPHERDING_FOCUS_CONFIG[focus];
  const dateFormatted = formatDateSpanish(date);

  let msg = `🐑 *VISITA DE PASTOREO Y ESTÍMULO ESPIRITUAL*\n\n`;
  msg += `Querido(a) hermano(a) *${publisherName}*,\n\n`;
  msg += `Esperamos de todo corazón que tú y tu familia se encuentren muy bien.\n\n`;
  msg += `Nos gustaría mucho visitarlos para compartir un breve momento de edificación espiritual y orar juntos.\n\n`;
  msg += `📅 *Fecha:* ${dateFormatted}\n`;
  if (time) msg += `⏰ *Hora acordada:* ${time}\n`;
  msg += `👥 *Hermanos que los visitarán:* ${elder1Name}${elder2Name ? ` y ${elder2Name}` : ''}\n`;
  msg += `🎯 *Objetivo:* ${focusConfig.label}\n`;

  if (scriptures && scriptures.trim()) {
    msg += `📖 *Texto para considerar:* ${scriptures.trim()}\n`;
  }

  msg += `\n_«Deseo ardientemente verlos para impartirles algún don espiritual a fin de que sean firmes; es decir, para que nos animemos mutuamente...» (Romanos 1:11, 12)_\n\n`;
  msg += `Por favor, confírmanos si este horario te queda bien o si prefieres que coordinemos otro momento que te sea más cómodo. Con mucho aprecio cristiano.`;

  return msg;
}

/**
 * Genera el mensaje de recordatorio para el compañero anciano asignado.
 */
export function buildShepherdingCompanionReminderWhatsApp(params: {
  companionName: string;
  publisherName: string;
  date: string;
  time?: string;
  phone?: string;
  address?: string;
  focus: ShepherdingFocus;
  scriptures?: string;
  notes?: string;
}): string {
  const { companionName, publisherName, date, time, phone, address, focus, scriptures, notes } = params;
  const focusConfig = SHEPHERDING_FOCUS_CONFIG[focus];
  const dateFormatted = formatDateSpanish(date);

  let msg = `📋 *RECORDATORIO DE PASTOREO (Cuerpo de Ancianos)*\n\n`;
  msg += `Hola hermano *${companionName}*,\n`;
  msg += `Te recordamos la visita de pastoreo que tenemos programada juntos:\n\n`;
  msg += `👤 *Publicador / Familia:* ${publisherName}\n`;
  msg += `📅 *Fecha:* ${dateFormatted}\n`;
  if (time) msg += `⏰ *Hora:* ${time}\n`;
  if (phone) msg += `📱 *Teléfono:* ${phone}\n`;
  if (address) msg += `📍 *Dirección:* ${address}\n`;
  msg += `🎯 *Enfoque:* ${focusConfig.label}\n`;

  if (scriptures && scriptures.trim()) {
    msg += `📖 *Textos previstos:* ${scriptures.trim()}\n`;
  }
  if (notes && notes.trim()) {
    msg += `📝 *Puntos de atención:* ${notes.trim()}\n`;
  }

  msg += `\nNos vemos unos minutos antes para orar y coordinar los puntos. Saludos fraternales.`;
  return msg;
}

/**
 * Formato de fecha legible en español (ej: "Lunes, 12 de Octubre de 2026").
 */
function formatDateSpanish(dateIso: string): string {
  try {
    const parts = dateIso.split('-');
    if (parts.length !== 3) return dateIso;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const dayName = dayNames[dateObj.getDay()] || '';
    const monthName = monthNames[m] || '';
    return `${dayName}, ${d} de ${monthName} de ${y}`;
  } catch {
    return dateIso;
  }
}

/**
 * Genera la hoja impresa interna de trabajo A4 para la reunión del Cuerpo de Ancianos.
 */
export function printShepherdingPlanA4(
  congregationName: string,
  evaluatedPublishers: EvaluatedPublisherPastoral[],
  scheduledVisits: ShepherdingVisit[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const urgentList = evaluatedPublishers.filter((e) => e.urgency === 'urgente');
  const attentionList = evaluatedPublishers.filter((e) => e.urgency === 'atencion');
  const pendingVisits = scheduledVisits.filter((v) => v.status === 'programada');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan de Pastoreo y Cuidado Espiritual - ${congregationName}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #1f2937; margin: 0; line-height: 1.4; }
    .header { text-align: center; border-bottom: 2px solid #374151; padding-bottom: 8px; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 17px; text-transform: uppercase; letter-spacing: 0.5px; }
    .header p { margin: 3px 0 0; font-size: 11px; color: #4b5563; }
    .badge-confidential { display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; margin-top: 4px; }
    .kpi-row { display: flex; gap: 10px; margin-bottom: 14px; }
    .kpi-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; background: #f9fafb; text-align: center; }
    .kpi-val { font-size: 18px; font-weight: bold; }
    .kpi-lbl { font-size: 9px; text-transform: uppercase; color: #6b7280; }
    h2 { font-size: 12px; margin: 12px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #d1d5db; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10.5px; }
    th, td { border: 1px solid #d1d5db; padding: 5px 7px; text-align: left; }
    th { background: #f3f4f6; font-weight: bold; }
    .tag-urgente { color: #dc2626; font-weight: bold; }
    .tag-atencion { color: #d97706; font-weight: bold; }
    .footer { margin-top: 20px; font-size: 9px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Plan y Supervisión Pastoral de la Congregación</h1>
    <p>Congregación: <strong>${congregationName}</strong> · Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}</p>
    <span class="badge-confidential">DOCUMENTO CONFIDENCIAL · USO EXCLUSIVO DEL CUERPO DE ANCIANOS</span>
  </div>

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="kpi-val">${evaluatedPublishers.length}</div>
      <div class="kpi-lbl">Total Publicadores</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #dc2626;">${urgentList.length}</div>
      <div class="kpi-lbl">Prioridad Alta (>12 m / Inactivos)</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #d97706;">${attentionList.length}</div>
      <div class="kpi-lbl">Por Atender (6-12 m)</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #2563eb;">${pendingVisits.length}</div>
      <div class="kpi-lbl">Visitas Programadas</div>
    </div>
  </div>

  <h2>1. Visitas de Pastoreo Programadas (Próximas Fechas)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Publicador / Familia</th>
        <th style="width: 15%;">Fecha y Hora</th>
        <th style="width: 30%;">Ancianos Asignados</th>
        <th style="width: 30%;">Enfoque / Textos Previstos</th>
      </tr>
    </thead>
    <tbody>
      ${
        pendingVisits.length === 0
          ? '<tr><td colspan="4" style="text-align: center; color: #9ca3af;">No hay visitas programadas actualmente.</td></tr>'
          : pendingVisits
              .map(
                (v) => `
          <tr>
            <td><strong>${v.publisherName || 'Publicador'}</strong></td>
            <td>${v.scheduledDate} ${v.scheduledTime ? `(${v.scheduledTime})` : ''}</td>
            <td>${v.elder1Name || 'Anciano'}${v.elder2Name ? ` y ${v.elder2Name}` : ''}</td>
            <td>${SHEPHERDING_FOCUS_CONFIG[v.focus]?.label || v.focus}${v.scripturesOrPoints ? ` · ${v.scripturesOrPoints}` : ''}</td>
          </tr>
        `
              )
              .join('')
      }
    </tbody>
  </table>

  <h2>2. Publicadores con Prioridad Alta de Atención Pastoral</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Publicador</th>
        <th style="width: 10%;">Grupo</th>
        <th style="width: 18%;">Última Visita</th>
        <th style="width: 12%;">Tiempo</th>
        <th style="width: 30%;">Motivo de Atención</th>
      </tr>
    </thead>
    <tbody>
      ${
        urgentList.length === 0
          ? '<tr><td colspan="5" style="text-align: center; color: #16a34a;">¡Excelente! Ningún publicador se encuentra en situación urgente.</td></tr>'
          : urgentList
              .map(
                (e) => `
          <tr>
            <td><strong>${e.publisher.name}</strong></td>
            <td>G${e.publisher.groupNumber || '—'}</td>
            <td>${e.lastVisitDateText}</td>
            <td class="tag-urgente">${e.monthsSinceLastVisit !== null ? `${e.monthsSinceLastVisit} meses` : 'Sin reg.'}</td>
            <td>${e.reason}</td>
          </tr>
        `
              )
              .join('')
      }
    </tbody>
  </table>

  <div class="footer">
    Kongre · Asistente Teocrático de Congregación · Registro Interno de Cuidado Pastoral
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}
