// src/utils/khsInformationBoardEngine.ts
import {
  WeekSchedule,
  Publisher,
  CongregationSettings,
  PreachingGroup,
  FieldServiceMeeting,
  CongregationNotice,
  CustomDuty,
  CartShift,
  CartLocation,
  CircuitOverseerVisit,
  MemorialPlan,
  TheocraticAssembly,
} from '../types';
import { getDutyFriendlyLabel, formatShortSpanishDate } from './unifiedMonthlyAssignments';
import { CLEANING_TYPE_LABELS, CLEANING_SUPPLIES_LABELS } from './khsDutiesCleaningEngine';

export interface KhsBoardContext {
  week: WeekSchedule;
  weeks: WeekSchedule[];
  publishersMap: Map<string, Publisher>;
  settings: CongregationSettings;
  preachingGroups: PreachingGroup[];
  fieldServiceMeetings: FieldServiceMeeting[];
  notices: CongregationNotice[];
  customDuties?: CustomDuty[];
  cartShifts?: CartShift[];
  cartLocations?: CartLocation[];
  circuitVisit?: CircuitOverseerVisit | null;
  memorialPlans?: MemorialPlan[];
  theocraticAssemblies?: TheocraticAssembly[];
}

export function resolvePublisherName(
  idOrName: string | undefined | null,
  publishersMap: Map<string, Publisher>,
  fallback = 'Sin asignar'
): string {
  if (!idOrName) return fallback;
  const pub = publishersMap.get(idOrName);
  if (pub) return pub.name;
  for (const p of publishersMap.values()) {
    if (p.nid && p.nid === idOrName) return p.name;
  }
  return idOrName;
}

export function resolveDutyNamesList(
  dutiesRecord: Record<string, string[]> | undefined,
  dutyKeys: string[],
  publishersMap: Map<string, Publisher>
): string {
  if (!dutiesRecord) return 'Sin asignar';
  const names: string[] = [];
  dutyKeys.forEach((k) => {
    const ids = dutiesRecord[k] || [];
    ids.forEach((id) => {
      const name = resolvePublisherName(id, publishersMap, '');
      if (name && !names.includes(name)) {
        names.push(name);
      }
    });
  });
  return names.length > 0 ? names.join(', ') : 'Sin asignar';
}

/**
 * Construye el Boletín Semanal Consolidado KHS para enviar por WhatsApp a la Congregación o Cuerpo de Ancianos.
 */
export function buildWeeklyInformationBoardWhatsApp(ctx: KhsBoardContext): string {
  const {
    week: w,
    publishersMap,
    settings,
    preachingGroups,
    fieldServiceMeetings,
    notices,
    customDuties,
  } = ctx;

  const congName = settings.congregationName || 'Congregación';
  const midDate = formatShortSpanishDate(w.midweek.date || w.weekStartDate);
  const wkndDate = formatShortSpanishDate(w.weekend.date || w.weekEndDate);

  let msg = `🏛 *CARTELERA DIGITAL DEL SALÓN DEL REINO*\n`;
  msg += `*Congregación ${congName}*\n`;
  msg += `📅 *Semana del ${w.weekStartDate} al ${w.weekEndDate}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (w.specialEvent?.title) {
    msg += `✨ *EVENTO ESPECIAL:* ${w.specialEvent.title.toUpperCase()}\n\n`;
  }

  // 1. REUNIÓN VIDA Y MINISTERIO CRISTIANOS (S-140)
  msg += `📖 *1. VIDA Y MINISTERIO CRISTIANOS (${midDate} • ${settings.midweekMeetingTime || '19:00'})*\n`;
  if (w.specialEvent?.noMeetingMidweek) {
    msg += `   _Sin reunión entre semana por evento especial._\n\n`;
  } else {
    if (w.midweek.bibleReading) {
      msg += `   • *Lectura semanal:* ${w.midweek.bibleReading}\n`;
    }
    msg += `   • *Presidente:* ${resolvePublisherName(w.midweek.presidentId, publishersMap)}\n`;
    if (w.midweek.auxiliaryCounselorId) {
      msg += `   • *Consejero Sala Aux.:* ${resolvePublisherName(w.midweek.auxiliaryCounselorId, publishersMap)}\n`;
    }
    msg += `   • *Oración Inicial:* ${resolvePublisherName(w.midweek.initialPrayerId, publishersMap)}\n`;
    msg += `   • *Tesoros (Discurso):* ${resolvePublisherName(w.midweek.tesoros.discurso.publisherId, publishersMap)}\n`;
    msg += `   • *Perlas Escondidas:* ${resolvePublisherName(w.midweek.tesoros.perlas.publisherId, publishersMap)}\n`;
    msg += `   • *Lectura de la Biblia:* ${resolvePublisherName(w.midweek.tesoros.lecturaBiblia.publisherId, publishersMap)}`;
    if (w.midweek.tesoros.lecturaBibliaAux?.publisherId) {
      msg += ` (Aux: ${resolvePublisherName(w.midweek.tesoros.lecturaBibliaAux.publisherId, publishersMap)})`;
    }
    msg += `\n`;

    // Maestros
    w.midweek.maestros.items.forEach((item) => {
      const tit = resolvePublisherName(item.publisherId, publishersMap);
      const ast = item.assistantId ? resolvePublisherName(item.assistantId, publishersMap) : null;
      const roomTag = item.room === 'auxiliar' ? ' [Aux]' : '';
      msg += `   • *${item.title}${roomTag}:* ${tit}${ast ? ` / ${ast}` : ''}\n`;
    });

    // Vida Cristiana
    w.midweek.vidaCristiana.items.forEach((item) => {
      msg += `   • *${item.title}:* ${resolvePublisherName(item.publisherId, publishersMap)}\n`;
    });

    msg += `   • *Estudio Bíblico de la Congregación:* ${resolvePublisherName(
      w.midweek.vidaCristiana.estudioBiblico.conductorId,
      publishersMap
    )} (Lector: ${resolvePublisherName(
      w.midweek.vidaCristiana.estudioBiblico.lectorId,
      publishersMap
    )})\n`;
    msg += `   • *Oración Final:* ${resolvePublisherName(w.midweek.finalPrayerId, publishersMap)}\n\n`;
  }

  // 2. REUNIÓN PÚBLICA Y ESTUDIO DE LA ATALAYA
  msg += `🎙️ *2. REUNIÓN PÚBLICA Y LA ATALAYA (${wkndDate} • ${settings.weekendMeetingTime || '10:00'})*\n`;
  if (w.specialEvent?.noMeetingWeekend) {
    msg += `   _Sin reunión de fin de semana en el Salón por evento especial._\n\n`;
  } else {
    msg += `   • *Presidente:* ${resolvePublisherName(w.weekend.presidentId, publishersMap)}\n`;
    const speakerName = w.weekend.isVisitingSpeaker
      ? w.weekend.publicTalkSpeaker || 'Orador Visitante'
      : resolvePublisherName(w.weekend.publicTalkSpeaker, publishersMap);
    const congSuffix =
      w.weekend.isVisitingSpeaker && w.weekend.visitingSpeakerCongregation
        ? ` (${w.weekend.visitingSpeakerCongregation})`
        : '';
    msg += `   • *Discurso Público:* ${
      w.weekend.publicTalkOutlineNumber ? `#${w.weekend.publicTalkOutlineNumber} ` : ''
    }"${w.weekend.publicTalkTheme || 'Tema por confirmar'}"\n`;
    msg += `   • *Orador:* ${speakerName}${congSuffix}\n`;
    msg += `   • *Conductor La Atalaya:* ${resolvePublisherName(w.weekend.atalayaConductorId, publishersMap)}\n`;
    msg += `   • *Lector La Atalaya:* ${resolvePublisherName(w.weekend.atalayaLectorId, publishersMap)}\n`;
    if (w.weekend.hospitalityPublisherId) {
      msg += `   • *Hospitalidad:* ${resolvePublisherName(w.weekend.hospitalityPublisherId, publishersMap)}\n`;
    }
    msg += `\n`;
  }

  // 3. DEBERES MECÁNICOS Y ACOMODADORES
  msg += `🎧 *3. DEBERES Y ASISTENCIA TÉCNICA*\n`;
  const standardDutyKeys = [
    'deber_audio',
    'deber_video',
    'deber_microfonos',
    'deber_acomodador',
    'deber_plataforma',
    'deber_seguridad',
  ];
  standardDutyKeys.forEach((dKey) => {
    const label = getDutyFriendlyLabel(dKey, customDuties);
    const midNames = resolveDutyNamesList(w.midweek.duties, [dKey], publishersMap);
    const wkndNames = resolveDutyNamesList(w.weekend.duties, [dKey], publishersMap);
    if (midNames !== 'Sin asignar' || wkndNames !== 'Sin asignar') {
      msg += `   • *${label}:*\n`;
      msg += `     - Entre Sem.: ${midNames}\n`;
      msg += `     - Fin de Sem.: ${wkndNames}\n`;
    }
  });
  msg += `\n`;

  // 4. PROGRAMA DE ASEO S-28
  const groupNums = w.cleaningGroupNumbers?.length ? w.cleaningGroupNumbers : [1];
  const groupLabels = groupNums.map((num) => {
    const grp = preachingGroups.find((g) => g.number === num);
    const ovs = grp?.overseerId ? publishersMap.get(grp.overseerId)?.name : null;
    return `Grupo #${num}${grp?.name ? ` (${grp.name})` : ''}${ovs ? ` — Sup.: ${ovs}` : ''}`;
  });
  const cleanMode = CLEANING_TYPE_LABELS[w.cleaningType || 'semanal'];
  msg += `🧹 *4. ASEO DEL SALÓN DEL REINO (S-28)*\n`;
  msg += `   • *Asignado a:* ${groupLabels.join(' / ')}\n`;
  msg += `   • *Modalidad:* ${cleanMode}\n`;
  if (w.cleaningNotes) {
    msg += `   • *Notas:* ${w.cleaningNotes}\n`;
  }
  msg += `\n`;

  // 5. SALIDAS AL SERVICIO DEL CAMPO
  if (fieldServiceMeetings.length > 0) {
    msg += `🧭 *5. SALIDAS AL SERVICIO DEL CAMPO*\n`;
    fieldServiceMeetings.slice(0, 6).forEach((fsm) => {
      const cond = fsm.conductorId ? resolvePublisherName(fsm.conductorId, publishersMap) : 'Conductor';
      msg += `   • *${fsm.dayOfWeek} ${fsm.time}:* ${fsm.location} (Dirige: ${cond}${
        fsm.territoryNumber ? ` • Terr. #${fsm.territoryNumber}` : ''
      })\n`;
    });
    msg += `\n`;
  }

  // 6. ANUNCIOS FIJADOS
  const pinnedNotices = notices.filter((n) => n.pinned);
  if (pinnedNotices.length > 0) {
    msg += `📌 *6. ANUNCIOS DESTACADOS DEL TABLERO*\n`;
    pinnedNotices.slice(0, 3).forEach((n) => {
      msg += `   • *${n.title}:* ${n.content}\n`;
    });
    msg += `\n`;
  }

  msg += `_Tablero Digital • Congregación ${congName}_`;
  return msg;
}

/**
 * Imprime la Cartelera Consolidada del Salón del Reino en formato A4 ("Todo en Uno" S-140)
 * usando un iframe oculto para máxima compatibilidad en cualquier navegador.
 */
export function printUnifiedKingdomHallBoardA4(ctx: KhsBoardContext): void {
  const {
    week: w,
    publishersMap,
    settings,
    preachingGroups,
    fieldServiceMeetings,
    notices,
    customDuties,
  } = ctx;

  const congName = settings.congregationName || 'Congregación';
  const midDate = formatShortSpanishDate(w.midweek.date || w.weekStartDate);
  const wkndDate = formatShortSpanishDate(w.weekend.date || w.weekEndDate);

  const maestrosRowsHtml = w.midweek.maestros.items
    .map((item) => {
      const tit = resolvePublisherName(item.publisherId, publishersMap);
      const ast = item.assistantId ? resolvePublisherName(item.assistantId, publishersMap) : null;
      const roomBadge =
        item.room === 'auxiliar'
          ? '<span style="font-size:9px;background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;margin-left:4px;">Sala Aux.</span>'
          : '';
      return `
        <tr>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155;">
            ${item.title} ${item.timeMinutes ? `(${item.timeMinutes} min)` : ''}${roomBadge}
          </td>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;color:#0f172a;text-align:right;">
            ${tit}${ast ? ` <span style="font-weight:500;color:#64748b;">/ ${ast}</span>` : ''}
          </td>
        </tr>
      `;
    })
    .join('');

  const vidaRowsHtml = w.midweek.vidaCristiana.items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155;">
            ${item.title} ${item.timeMinutes ? `(${item.timeMinutes} min)` : ''}
          </td>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;color:#0f172a;text-align:right;">
            ${resolvePublisherName(item.publisherId, publishersMap)}
          </td>
        </tr>
      `
    )
    .join('');

  const dutyKeys = [
    'deber_audio',
    'deber_video',
    'deber_microfonos',
    'deber_acomodador',
    'deber_plataforma',
    'deber_seguridad',
  ];

  const dutiesRowsHtml = dutyKeys
    .map((dKey) => {
      const label = getDutyFriendlyLabel(dKey, customDuties);
      const mid = resolveDutyNamesList(w.midweek.duties, [dKey], publishersMap);
      const wknd = resolveDutyNamesList(w.weekend.duties, [dKey], publishersMap);
      return `
        <tr>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#1e293b;">${label}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155;">${mid}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#334155;">${wknd}</td>
        </tr>
      `;
    })
    .join('');

  const groupNums = w.cleaningGroupNumbers?.length ? w.cleaningGroupNumbers : [1];
  const groupDetailsHtml = groupNums
    .map((num) => {
      const grp = preachingGroups.find((g) => g.number === num);
      const ovs = grp?.overseerId ? publishersMap.get(grp.overseerId)?.name : 'Por asignar';
      const ast = grp?.assistantId ? publishersMap.get(grp.assistantId)?.name : 'Por asignar';
      return `<strong>Grupo #${num} ${grp?.name ? `(${grp.name})` : ''}</strong> • Sup.: ${ovs} • Aux.: ${ast}`;
    })
    .join('<br/>');

  const cleanMode = CLEANING_TYPE_LABELS[w.cleaningType || 'semanal'];
  const suppliesStatus = CLEANING_SUPPLIES_LABELS[w.cleaningSuppliesStatus || 'abastecido'].label;

  const fieldServiceHtml = fieldServiceMeetings
    .slice(0, 6)
    .map((fsm) => {
      const cond = fsm.conductorId ? resolvePublisherName(fsm.conductorId, publishersMap) : 'Por asignar';
      return `
        <tr>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:10.5px;">${fsm.dayOfWeek} ${fsm.time}</td>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:10.5px;">${fsm.location}</td>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:10.5px;font-weight:600;">${cond}</td>
          <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:10.5px;color:#475569;">${
            fsm.territoryNumber ? `Terr. #${fsm.territoryNumber}` : 'General'
          }</td>
        </tr>
      `;
    })
    .join('');

  const pinnedNotices = notices.filter((n) => n.pinned || n.category === 'carta' || n.category === 'circuito').slice(0, 3);
  const noticesHtml = pinnedNotices
    .map(
      (n) => `
        <div style="padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;margin-bottom:5px;">
          <div style="font-size:11px;font-weight:800;color:#0f172a;">📌 ${n.title} <span style="font-weight:500;color:#64748b;font-size:10px;">(${n.date})</span></div>
          <div style="font-size:10.5px;color:#334155;margin-top:2px;">${n.content}</div>
        </div>
      `
    )
    .join('');

  const speakerDisplay = w.weekend.isVisitingSpeaker
    ? `${w.weekend.publicTalkSpeaker || 'Orador Visitante'}${
        w.weekend.visitingSpeakerCongregation ? ` (${w.weekend.visitingSpeakerCongregation})` : ''
      }`
    : resolvePublisherName(w.weekend.publicTalkSpeaker, publishersMap);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Cartelera del Salón del Reino - ${w.weekStartDate}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            border-bottom: 3px solid #1e293b;
            padding-bottom: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; color: #0f172a; }
          .subtitle { font-size: 11px; font-weight: 700; color: #475569; margin-top: 2px; }
          .badge {
            background: #1e293b;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 10px;
            border-radius: 6px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          .box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }
          .box-header {
            padding: 5px 10px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #ffffff;
          }
          .bg-vmc { background: #312e81; }
          .bg-wknd { background: #1e3a8a; }
          .bg-duties { background: #0f766e; }
          .bg-clean { background: #065f46; }
          .bg-field { background: #334155; }
          .section-tag {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 3px 6px;
            background: #f1f5f9;
            color: #1e293b;
            border-bottom: 1px solid #cbd5e1;
          }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Tablero de Información del Salón del Reino</div>
            <div class="subtitle">Congregación ${congName} • Cartelera Oficial Unificada (S-140 / S-28 / Deberes)</div>
          </div>
          <div class="badge">Semana: ${w.weekStartDate} al ${w.weekEndDate}</div>
        </div>

        <div class="grid-2">
          <!-- COLUMNA 1: VIDA Y MINISTERIO CRISTIANOS (S-140) -->
          <div class="box">
            <div class="box-header bg-vmc">
              Vida y Ministerio Cristianos (${midDate} • ${settings.midweekMeetingTime || '19:00'})
            </div>
            <table>
              <tr>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;"><strong>Presidente:</strong> ${resolvePublisherName(w.midweek.presidentId, publishersMap)}</td>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;"><strong>Oración Inicial:</strong> ${resolvePublisherName(w.midweek.initialPrayerId, publishersMap)}</td>
              </tr>
              ${
                w.midweek.auxiliaryCounselorId
                  ? `<tr><td colspan="2" style="padding:3px 6px;border-bottom:1px solid #e2e8f0;font-size:10.5px;color:#475569;"><strong>Consejero Sala Auxiliar:</strong> ${resolvePublisherName(w.midweek.auxiliaryCounselorId, publishersMap)}</td></tr>`
                  : ''
              }
            </table>

            <div class="section-tag">Tesoros de la Biblia ${w.midweek.bibleReading ? `(${w.midweek.bibleReading})` : ''}</div>
            <table>
              <tr>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;">${w.midweek.tesoros.discurso.title} (10 min)</td>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;text-align:right;">${resolvePublisherName(w.midweek.tesoros.discurso.publisherId, publishersMap)}</td>
              </tr>
              <tr>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;">Busquemos Perlas Escondidas (10 min)</td>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;text-align:right;">${resolvePublisherName(w.midweek.tesoros.perlas.publisherId, publishersMap)}</td>
              </tr>
              <tr>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;">Lectura de la Biblia (4 min)</td>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;text-align:right;">
                  ${resolvePublisherName(w.midweek.tesoros.lecturaBiblia.publisherId, publishersMap)}
                  ${
                    w.midweek.tesoros.lecturaBibliaAux?.publisherId
                      ? `<br/><span style="font-size:10px;color:#64748b;">Aux: ${resolvePublisherName(w.midweek.tesoros.lecturaBibliaAux.publisherId, publishersMap)}</span>`
                      : ''
                  }
                </td>
              </tr>
            </table>

            <div class="section-tag">Seamos Mejores Maestros</div>
            <table>${maestrosRowsHtml}</table>

            <div class="section-tag">Nuestra Vida Cristiana</div>
            <table>
              ${vidaRowsHtml}
              <tr>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;">Estudio Bíblico de la Congregación (30 min)</td>
                <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;text-align:right;">
                  ${resolvePublisherName(w.midweek.vidaCristiana.estudioBiblico.conductorId, publishersMap)}
                  <span style="font-weight:500;color:#64748b;"> (Lector: ${resolvePublisherName(w.midweek.vidaCristiana.estudioBiblico.lectorId, publishersMap)})</span>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 6px;font-size:11px;">Oración de Conclusión</td>
                <td style="padding:4px 6px;font-size:11px;font-weight:700;text-align:right;">${resolvePublisherName(w.midweek.finalPrayerId, publishersMap)}</td>
              </tr>
            </table>
          </div>

          <!-- COLUMNA 2: REUNIÓN PÚBLICA + DEBERES + ASEO S-28 -->
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div class="box">
              <div class="box-header bg-wknd">
                Reunión Pública y Estudio de La Atalaya (${wkndDate} • ${settings.weekendMeetingTime || '10:00'})
              </div>
              <table>
                <tr>
                  <td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;"><strong>Presidente:</strong> ${resolvePublisherName(w.weekend.presidentId, publishersMap)}</td>
                  <td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;text-align:right;"><strong>Canción:</strong> ${w.weekend.openingSong ? `#${w.weekend.openingSong}` : '—'}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 8px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
                    <div style="font-size:10px;font-weight:800;color:#1e40af;text-transform:uppercase;">Discurso Público ${w.weekend.publicTalkOutlineNumber ? `(Bosquejo #${w.weekend.publicTalkOutlineNumber})` : ''}</div>
                    <div style="font-size:12px;font-weight:800;color:#0f172a;margin-top:1px;">"${w.weekend.publicTalkTheme || 'Tema pendiente'}"</div>
                    <div style="font-size:11px;color:#334155;margin-top:2px;"><strong>Orador:</strong> ${speakerDisplay}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;"><strong>Conductor La Atalaya:</strong><br/>${resolvePublisherName(w.weekend.atalayaConductorId, publishersMap)}</td>
                  <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px;"><strong>Lector La Atalaya:</strong><br/>${resolvePublisherName(w.weekend.atalayaLectorId, publishersMap)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px;font-size:11px;"><strong>Hospitalidad:</strong> ${
                    w.weekend.hospitalityPublisherId
                      ? resolvePublisherName(w.weekend.hospitalityPublisherId, publishersMap)
                      : 'Sin asignar'
                  }</td>
                  <td style="padding:4px 8px;font-size:11px;text-align:right;"><strong>Oración Final:</strong> ${resolvePublisherName(w.weekend.finalPrayerId, publishersMap)}</td>
                </tr>
              </table>
            </div>

            <!-- MATRIZ DE DEBERES MECÁNICOS -->
            <div class="box">
              <div class="box-header bg-duties">
                Deberes Mecánicos, Audio/Video, Micrófonos y Acomodadores
              </div>
              <table>
                <thead>
                  <tr style="background:#f1f5f9;">
                    <th style="padding:4px 8px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Departamento</th>
                    <th style="padding:4px 8px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Entre Semana</th>
                    <th style="padding:4px 8px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Fin de Semana</th>
                  </tr>
                </thead>
                <tbody>
                  ${dutiesRowsHtml}
                </tbody>
              </table>
            </div>

            <!-- PROGRAMA DE ASEO S-28 -->
            <div class="box">
              <div class="box-header bg-clean">
                Programa de Aseo y Mantenimiento del Salón del Reino (S-28)
              </div>
              <div style="padding:7px 10px;font-size:11px;line-height:1.45;">
                <div>${groupDetailsHtml}</div>
                <div style="margin-top:3px;color:#334155;">
                  <strong>Modalidad:</strong> ${cleanMode} &nbsp;•&nbsp; <strong>Insumos:</strong> ${suppliesStatus}
                </div>
                ${w.cleaningNotes ? `<div style="margin-top:2px;color:#475569;font-style:italic;">Nota: ${w.cleaningNotes}</div>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- FILA INFERIOR: SALIDAS AL SERVICIO DEL CAMPO Y ANUNCIOS -->
        <div class="grid-2">
          <div class="box">
            <div class="box-header bg-field">Programa de Reuniones para el Servicio del Campo</div>
            <table>
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:4px 6px;text-align:left;font-size:10px;color:#475569;border-bottom:1px solid #cbd5e1;">Día / Hora</th>
                  <th style="padding:4px 6px;text-align:left;font-size:10px;color:#475569;border-bottom:1px solid #cbd5e1;">Lugar de Salida</th>
                  <th style="padding:4px 6px;text-align:left;font-size:10px;color:#475569;border-bottom:1px solid #cbd5e1;">Conductor</th>
                  <th style="padding:4px 6px;text-align:left;font-size:10px;color:#475569;border-bottom:1px solid #cbd5e1;">Territorio</th>
                </tr>
              </thead>
              <tbody>
                ${
                  fieldServiceHtml ||
                  '<tr><td colspan="4" style="padding:8px;text-align:center;font-size:11px;color:#64748b;">Sin salidas registradas</td></tr>'
                }
              </tbody>
            </table>
          </div>

          <div class="box">
            <div class="box-header bg-field">Anuncios Oficiales y Cartas en el Tablero</div>
            <div style="padding:8px;">
              ${
                noticesHtml ||
                '<div style="font-size:11px;color:#64748b;text-align:center;padding:8px;">Sin anuncios fijados esta semana.</div>'
              }
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 350);
  }
}

function toIcsTimestamp(dateStr: string, timeStr: string): string {
  const cleanDate = (dateStr || '2026-01-01').replace(/-/g, '');
  const [hh, mm] = (timeStr || '19:00').split(':');
  return `${cleanDate}T${String(hh || '19').padStart(2, '0')}${String(mm || '00').padStart(2, '0')}00`;
}

function addMinutesIcs(dateStr: string, timeStr: string, durationMinutes: number): string {
  const [y, m, d] = (dateStr || '2026-01-01').split('-').map(Number);
  const [hh, mm] = (timeStr || '19:00').split(':').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 19, mm || 0);
  dt.setMinutes(dt.getMinutes() + durationMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

/**
 * Descarga el Calendario General Maestro de la Congregación en formato .ics (RFC 5545)
 * para importar en Google Calendar, Apple Calendar o Microsoft Outlook.
 */
export function downloadCongregationMasterCalendarIcs(ctx: KhsBoardContext): number {
  const {
    weeks,
    publishersMap,
    settings,
    preachingGroups,
    circuitVisit,
    memorialPlans,
    theocraticAssemblies,
  } = ctx;

  const congName = settings.congregationName || 'Congregación';
  const hallLoc = settings.hallAddress || `Salón del Reino (${congName})`;
  const midTime = settings.midweekMeetingTime || '19:00';
  const wkndTime = settings.weekendMeetingTime || '10:00';
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const vevents: string[] = [];

  weeks.forEach((w) => {
    const midDate = w.midweek.date || w.weekStartDate;
    const wkndDate = w.weekend.date || w.weekEndDate;

    // Evento 1: Reunión Entre Semana (Vida y Ministerio)
    if (!w.specialEvent?.noMeetingMidweek && midDate) {
      const pres = resolvePublisherName(w.midweek.presidentId, publishersMap);
      const condCbs = resolvePublisherName(
        w.midweek.vidaCristiana.estudioBiblico.conductorId,
        publishersMap
      );
      const groupNums = w.cleaningGroupNumbers?.length ? w.cleaningGroupNumbers : [1];
      const cleanLabel = groupNums
        .map((n) => preachingGroups.find((g) => g.number === n)?.name || `Grupo #${n}`)
        .join(', ');

      const desc = [
        `Reunión de Vida y Ministerio Cristianos — ${congName}`,
        w.midweek.bibleReading ? `Lectura semanal: ${w.midweek.bibleReading}` : '',
        `Presidente: ${pres}`,
        `Discurso Tesoros: ${w.midweek.tesoros.discurso.title} (${resolvePublisherName(w.midweek.tesoros.discurso.publisherId, publishersMap)})`,
        `Estudio Bíblico de la Congregación: ${condCbs}`,
        `Aseo del Salón (S-28): ${cleanLabel}`,
      ]
        .filter(Boolean)
        .join('\\n')
        .replace(/[\r\n]+/g, ' ');

      const summary = `Reunión Vida y Ministerio${w.midweek.bibleReading ? ` (${w.midweek.bibleReading})` : ''}`;

      vevents.push(
        [
          'BEGIN:VEVENT',
          `UID:kongre-midweek-${w.id}@kongre.org`,
          `DTSTAMP:${nowStamp}`,
          `DTSTART:${toIcsTimestamp(midDate, midTime)}`,
          `DTEND:${addMinutesIcs(midDate, midTime, 105)}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${desc}`,
          `LOCATION:${hallLoc.replace(/[\r\n]+/g, ' ')}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT2H',
          'ACTION:DISPLAY',
          `DESCRIPTION:Recordatorio: ${summary}`,
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n')
      );
    }

    // Evento 2: Reunión de Fin de Semana (Discurso Público y La Atalaya)
    if (!w.specialEvent?.noMeetingWeekend && wkndDate) {
      const speaker = w.weekend.isVisitingSpeaker
        ? `${w.weekend.publicTalkSpeaker || 'Orador Visitante'}${
            w.weekend.visitingSpeakerCongregation ? ` (${w.weekend.visitingSpeakerCongregation})` : ''
          }`
        : resolvePublisherName(w.weekend.publicTalkSpeaker, publishersMap);

      const talkTitle = w.weekend.publicTalkTheme || 'Discurso Público';
      const summary = `Reunión Pública: "${talkTitle}"`;

      const desc = [
        `Reunión Pública y Estudio de La Atalaya — ${congName}`,
        `Discurso Público ${w.weekend.publicTalkOutlineNumber ? `(#${w.weekend.publicTalkOutlineNumber})` : ''}: ${talkTitle}`,
        `Orador: ${speaker}`,
        `Presidente: ${resolvePublisherName(w.weekend.presidentId, publishersMap)}`,
        `Conductor La Atalaya: ${resolvePublisherName(w.weekend.atalayaConductorId, publishersMap)}`,
        `Lector La Atalaya: ${resolvePublisherName(w.weekend.atalayaLectorId, publishersMap)}`,
      ]
        .join('\\n')
        .replace(/[\r\n]+/g, ' ');

      vevents.push(
        [
          'BEGIN:VEVENT',
          `UID:kongre-weekend-${w.id}@kongre.org`,
          `DTSTAMP:${nowStamp}`,
          `DTSTART:${toIcsTimestamp(wkndDate, wkndTime)}`,
          `DTEND:${addMinutesIcs(wkndDate, wkndTime, 105)}`,
          `SUMMARY:${summary.replace(/[\r\n]+/g, ' ')}`,
          `DESCRIPTION:${desc}`,
          `LOCATION:${hallLoc.replace(/[\r\n]+/g, ' ')}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT2H',
          'ACTION:DISPLAY',
          `DESCRIPTION:Recordatorio: Reunión de Fin de Semana`,
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n')
      );
    }
  });

  // Visita del Superintendente de Circuito
  if (circuitVisit?.startDate) {
    vevents.push(
      [
        'BEGIN:VEVENT',
        `UID:kongre-sc-visit-${circuitVisit.startDate}@kongre.org`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${toIcsTimestamp(circuitVisit.startDate, '09:00')}`,
        `DTEND:${addMinutesIcs(circuitVisit.endDate || circuitVisit.startDate, '20:00', 60)}`,
        `SUMMARY:Visita del Superintendente de Circuito (${circuitVisit.overseerName || 'SC'})`,
        `DESCRIPTION:Semana especial de visita del Superintendente de Circuito a la Congregación ${congName}.`,
        `LOCATION:${hallLoc.replace(/[\r\n]+/g, ' ')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n')
    );
  }

  // Conmemoración (Memorial)
  (memorialPlans || []).forEach((mem) => {
    if (!mem.date) return;
    vevents.push(
      [
        'BEGIN:VEVENT',
        `UID:kongre-memorial-${mem.id}@kongre.org`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${toIcsTimestamp(mem.date, mem.time || '19:30')}`,
        `DTEND:${addMinutesIcs(mem.date, mem.time || '19:30', 90)}`,
        `SUMMARY:Conmemoración de la Muerte de Cristo (${mem.serviceYear})`,
        `DESCRIPTION:Orador: ${resolvePublisherName(mem.speakerPublisherId, publishersMap, mem.speakerTheme || 'Asignado')}`,
        `LOCATION:${(mem.location || hallLoc).replace(/[\r\n]+/g, ' ')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n')
    );
  });

  // Asambleas Teocráticas
  (theocraticAssemblies || []).forEach((asm) => {
    const firstDateMatch = (asm.dates || '').match(/\d{4}-\d{2}-\d{2}/);
    const asmDate = firstDateMatch ? firstDateMatch[0] : '';
    if (!asmDate) return;
    vevents.push(
      [
        'BEGIN:VEVENT',
        `UID:kongre-assembly-${asm.id}@kongre.org`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${toIcsTimestamp(asmDate, '09:20')}`,
        `DTEND:${addMinutesIcs(asmDate, '16:50', 10)}`,
        `SUMMARY:${asm.theme || 'Asamblea Teocrática'}`,
        `DESCRIPTION:Asamblea programada para la Congregación ${congName} (${asm.dates}).`,
        `LOCATION:${(asm.venue || 'Salón de Asambleas').replace(/[\r\n]+/g, ' ')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n')
    );
  });

  if (vevents.length === 0) return 0;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kongre//Tablero Digital del Salon del Reino//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Salón del Reino - ${congName}`,
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');

  const safeCong = congName.replace(/\s+/g, '_');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Calendario_Salon_del_Reino_${safeCong}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return vevents.length;
}
