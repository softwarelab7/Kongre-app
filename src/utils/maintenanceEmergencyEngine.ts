// src/utils/maintenanceEmergencyEngine.ts
import {
  MaintenanceSheet,
  MaintenanceCategory,
  Publisher,
  PreachingGroup,
  Breaker,
  CongregationSettings,
} from '../types';
import { openSafeWhatsAppUrl } from './literatureHelper';

export interface ServiceYearMonthColumn {
  index: number; // 0..11
  monthNumber: number; // 9,10,11,12,1,2,3,4,5,6,7,8
  shortLabel: string; // 'Sep', 'Oct', ...
  fullLabel: string;
}

export const SERVICE_YEAR_MONTHS: ServiceYearMonthColumn[] = [
  { index: 0, monthNumber: 9, shortLabel: 'Sep', fullLabel: 'Septiembre' },
  { index: 1, monthNumber: 10, shortLabel: 'Oct', fullLabel: 'Octubre' },
  { index: 2, monthNumber: 11, shortLabel: 'Nov', fullLabel: 'Noviembre' },
  { index: 3, monthNumber: 12, shortLabel: 'Dic', fullLabel: 'Diciembre' },
  { index: 4, monthNumber: 1, shortLabel: 'Ene', fullLabel: 'Enero' },
  { index: 5, monthNumber: 2, shortLabel: 'Feb', fullLabel: 'Febrero' },
  { index: 6, monthNumber: 3, shortLabel: 'Mar', fullLabel: 'Marzo' },
  { index: 7, monthNumber: 4, shortLabel: 'Abr', fullLabel: 'Abril' },
  { index: 8, monthNumber: 5, shortLabel: 'May', fullLabel: 'Mayo' },
  { index: 9, monthNumber: 6, shortLabel: 'Jun', fullLabel: 'Junio' },
  { index: 10, monthNumber: 7, shortLabel: 'Jul', fullLabel: 'Julio' },
  { index: 11, monthNumber: 8, shortLabel: 'Ago', fullLabel: 'Agosto' },
];

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  seguridad: 'Seguridad y Prevención',
  climatizacion: 'Climatización y Ventilación',
  electricidad: 'Instalación Eléctrica',
  plomeria: 'Plomería y Sanitarios',
  edificacion: 'Edificación, Techos y Pintura',
  jardineria: 'Jardinería y Exteriores',
  audio_video: 'Audio, Video y Red',
  limpieza_profunda: 'Limpieza Profunda',
};

export interface AnnualCalendarRow {
  sheet: MaintenanceSheet;
  categoryLabel: string;
  assignedNames: string[];
  assignedPhones: string[];
  scheduledMonthIndices: number[]; // indices 0..11 in SERVICE_YEAR_MONTHS
  annualOccurrences: number;
  annualEstimatedHours: number;
}

export interface AnnualMaintenanceCalendarSummary {
  rows: AnnualCalendarRow[];
  totalActiveSheets: number;
  compliancePercent: number;
  totalAnnualEstimatedHours: number;
  monthlyTaskCounts: number[]; // length 12
}

/**
 * Determines which months (0..11 of Service Year Sep-Aug) a sheet is scheduled
 */
function getScheduledMonthsForSheet(sheet: MaintenanceSheet, rowPosition: number): number[] {
  let anchorIndex = rowPosition % 12;
  if (sheet.nextDueDate) {
    const parts = sheet.nextDueDate.split('-');
    if (parts.length >= 2) {
      const m = Number(parts[1]);
      const found = SERVICE_YEAR_MONTHS.findIndex(col => col.monthNumber === m);
      if (found >= 0) anchorIndex = found;
    }
  }

  switch (sheet.frequency) {
    case 'semanal':
    case 'mensual':
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    case 'bimestral': {
      const parity = anchorIndex % 2;
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(i => i % 2 === parity);
    }
    case 'trimestral': {
      const mod = anchorIndex % 3;
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(i => i % 3 === mod);
    }
    case 'semestral': {
      const mod = anchorIndex % 6;
      return [mod, (mod + 6) % 12].sort((a, b) => a - b);
    }
    case 'anual':
      return [anchorIndex];
    case 'segun_necesidad':
    default:
      return [anchorIndex];
  }
}

export function computeAnnualMaintenanceCalendar(
  sheets: MaintenanceSheet[],
  publishersMap: Map<string, Publisher>
): AnnualMaintenanceCalendarSummary {
  const activeSheets = sheets
    .filter(s => s.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex || a.label.localeCompare(b.label));

  const monthlyTaskCounts = new Array(12).fill(0);
  let totalAnnualMinutes = 0;

  const rows: AnnualCalendarRow[] = activeSheets.map((sheet, idx) => {
    const scheduledMonthIndices = getScheduledMonthsForSheet(sheet, idx);
    scheduledMonthIndices.forEach(mIdx => {
      monthlyTaskCounts[mIdx] += 1;
    });

    const occurrences =
      sheet.frequency === 'semanal' ? 52 : scheduledMonthIndices.length;
    const estMinutes = sheet.estimatedMinutes || 60;
    const annualMinutes = occurrences * estMinutes;
    totalAnnualMinutes += annualMinutes;

    const assignedPubs = (sheet.assignedPublisherIds || [])
      .map(id => publishersMap.get(id))
      .filter((p): p is Publisher => Boolean(p));

    return {
      sheet,
      categoryLabel: MAINTENANCE_CATEGORY_LABELS[sheet.category] || sheet.category,
      assignedNames: assignedPubs.map(p => p.name),
      assignedPhones: assignedPubs.map(p => p.phone).filter(Boolean),
      scheduledMonthIndices,
      annualOccurrences: occurrences,
      annualEstimatedHours: Math.round((annualMinutes / 60) * 10) / 10,
    };
  });

  const alDiaCount = activeSheets.filter(s => s.status === 'al_dia').length;
  const compliancePercent =
    activeSheets.length > 0 ? Math.round((alDiaCount / activeSheets.length) * 100) : 100;

  return {
    rows,
    totalActiveSheets: activeSheets.length,
    compliancePercent,
    totalAnnualEstimatedHours: Math.round((totalAnnualMinutes / 60) * 10) / 10,
    monthlyTaskCounts,
  };
}

export interface PublisherEmergencyNode {
  id: string;
  name: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hasDpa: boolean;
  dpaExpiryDate?: string;
  hasVehicle: boolean;
  needsRide: boolean;
  isVulnerable: boolean; // elderly or infirm
  hasHallKey: boolean;
  roleLabel: string;
}

export interface GroupEmergencyTree {
  groupNumber: number;
  groupName: string;
  overseerName: string;
  overseerPhone: string;
  assistantName: string;
  assistantPhone: string;
  members: PublisherEmergencyNode[];
  stats: {
    totalMembers: number;
    withEmergencyContact: number;
    withDpa: number;
    withVehicle: number;
    vulnerableCount: number;
  };
}

export interface SafetyProtocolStation {
  id: string;
  code: string;
  title: string;
  location: string;
  procedure: string;
  verificationItems: string[];
}

export interface EmergencyReadinessPlan {
  totalActivePublishers: number;
  withPhoneCount: number;
  withEmergencyContactCount: number;
  withDpaCount: number;
  withVehicleCount: number;
  vulnerableCount: number;
  keyHolders: PublisherEmergencyNode[];
  groupsTree: GroupEmergencyTree[];
  criticalBreakers: Breaker[];
  safetyStations: SafetyProtocolStation[];
}

export const DEFAULT_HALL_SAFETY_STATIONS: SafetyProtocolStation[] = [
  {
    id: 'est-extintores',
    code: 'SEG-01',
    title: 'Extintores Contra Incendios y Rutas de Evacuación',
    location: 'Vestíbulo Principal, Plataforma y Cuarto Técnico',
    procedure:
      'En caso de humo o conato de incendio, los acomodadores abren de par en par las puertas de salida, guían a la concurrencia al punto de encuentro exterior y utilizan el extintor ABC solo si el fuego es incipiente.',
    verificationItems: [
      'Manómetro en franja verde y precinto de seguridad intacto',
      'Fecha de recarga anual vigente y señalización visible a 1.50 m',
      'Puertas de salida libres de candados o bloqueos durante las reuniones',
    ],
  },
  {
    id: 'est-electrico',
    code: 'SEG-02',
    title: 'Corte General de Energía y Tablero Eléctrico',
    location: 'Panel Eléctrico Principal y Cuarto de Audio/Video',
    procedure:
      'Ante cortocircuito, sismo fuerte o inundación, desconectar el interruptor termomagnético general antes de intervenir cualquier equipo. Mantener operativas las lámparas autónomas de emergencia.',
    verificationItems: [
      'Directorio de circuitos (Breakers) actualizado en la puerta del tablero',
      'Lámparas de emergencia con batería probada mensualmente',
      'Protección diferencial y puesta a tierra verificada',
    ],
  },
  {
    id: 'est-hidraulico',
    code: 'SEG-03',
    title: 'Válvulas de Cierre de Agua Potable y Suministros',
    location: 'Registro Exterior de Entrada y Cuarto de Limpieza',
    procedure:
      'Al concluir cada reunión o ante una fuga en sanitarios, cerrar la llave de paso secundaria y verificar que no queden grifos ni cisternas perdiendo agua.',
    verificationItems: [
      'Llave maestra de corte de agua identificada con etiqueta roja/azul',
      'Ausencia de filtraciones en tuberías de baños de hermanos y hermanas',
      'Desagües pluviales y canaletas despejados antes de temporada de lluvias',
    ],
  },
  {
    id: 'est-botiquin',
    code: 'SEG-04',
    title: 'Botiquín de Primeros Auxilios y Emergencia Médica',
    location: 'Mostrador de Acomodadores / Sala Auxiliar',
    procedure:
      'Si un asistente sufre una urgencia médica, el acomodador de vestíbulo contacta a los servicios de emergencia locales, despeja el acceso para la ambulancia y avisa al familiar o contacto de emergencia registrado.',
    verificationItems: [
      'Gasas estériles, antiséptico, vendas, guantes de nitrilo y tensiómetro funcional',
      'Sin medicamentos vencidos ni fármacos de prescripción dentro del botiquín',
      'Números de emergencia locales fijados junto al botiquín',
    ],
  },
];

export function computeEmergencyReadinessPlan(
  publishers: Publisher[],
  preachingGroups: PreachingGroup[],
  breakers: Breaker[]
): EmergencyReadinessPlan {
  const activePubs = publishers.filter(p => p.active);
  const pubMap = new Map<string, Publisher>();
  activePubs.forEach(p => pubMap.set(p.id, p));

  const toNode = (p: Publisher, groupOverseerId?: string, groupAssistantId?: string): PublisherEmergencyNode => {
    let roleLabel = 'Publicador';
    if (p.id === groupOverseerId) roleLabel = 'Sup. de Grupo';
    else if (p.id === groupAssistantId) roleLabel = 'Auxiliar de Grupo';
    else if (p.privilege === 'anciano') roleLabel = 'Anciano';
    else if (p.privilege === 'siervo_ministerial') roleLabel = 'Siervo Ministerial';
    else if (p.pioneerStatus === 'regular' || p.privilege === 'precursor_regular')
      roleLabel = 'Precursor Regular';

    return {
      id: p.id,
      name: p.name,
      phone: p.phone || '',
      address: p.address || p.neighborhood || 'Dirección por actualizar',
      emergencyContactName:
        p.emergencyContactName || p.healthcare_agent_name || 'Pendiente registrar',
      emergencyContactPhone:
        p.emergencyContactPhone || p.healthcare_agent_phone || '',
      hasDpa: Boolean(p.has_dpa || p.baptismDate || p.baptism_date),
      dpaExpiryDate: p.dpa_expiry_date,
      hasVehicle: Boolean(p.has_vehicle),
      needsRide: Boolean(p.needs_ride),
      isVulnerable: Boolean(p.is_elderly || p.is_infirm),
      hasHallKey: Boolean(
        p.has_key || p.privilege === 'anciano' || p.privilege === 'siervo_ministerial'
      ),
      roleLabel,
    };
  };

  const groupsTree: GroupEmergencyTree[] = preachingGroups.map(group => {
    const overseer = group.overseerId ? pubMap.get(group.overseerId) : undefined;
    const assistant = group.assistantId ? pubMap.get(group.assistantId) : undefined;

    const groupPubs = activePubs
      .filter(
        p =>
          p.groupNumber === group.number ||
          group.memberIds.includes(p.id) ||
          p.id === group.overseerId ||
          p.id === group.assistantId
      )
      .sort((a, b) => {
        if (a.id === group.overseerId) return -1;
        if (b.id === group.overseerId) return 1;
        if (a.id === group.assistantId) return -1;
        if (b.id === group.assistantId) return 1;
        return a.name.localeCompare(b.name);
      });

    const nodes = groupPubs.map(p => toNode(p, group.overseerId, group.assistantId));

    return {
      groupNumber: group.number,
      groupName: group.name || `Grupo ${group.number}`,
      overseerName: overseer?.name || 'Por designar',
      overseerPhone: overseer?.phone || '',
      assistantName: assistant?.name || 'Por designar',
      assistantPhone: assistant?.phone || '',
      members: nodes,
      stats: {
        totalMembers: nodes.length,
        withEmergencyContact: nodes.filter(n => Boolean(n.emergencyContactPhone)).length,
        withDpa: nodes.filter(n => n.hasDpa).length,
        withVehicle: nodes.filter(n => n.hasVehicle).length,
        vulnerableCount: nodes.filter(n => n.isVulnerable || n.needsRide).length,
      },
    };
  });

  const allNodes = activePubs.map(p => toNode(p));
  const keyHolders = allNodes.filter(n => n.hasHallKey);
  const criticalBreakers = breakers.filter(
    b => b.status === 'always' || b.status === 'on'
  );

  return {
    totalActivePublishers: activePubs.length,
    withPhoneCount: allNodes.filter(n => Boolean(n.phone)).length,
    withEmergencyContactCount: allNodes.filter(n => Boolean(n.emergencyContactPhone)).length,
    withDpaCount: allNodes.filter(n => n.hasDpa).length,
    withVehicleCount: allNodes.filter(n => n.hasVehicle).length,
    vulnerableCount: allNodes.filter(n => n.isVulnerable || n.needsRide).length,
    keyHolders,
    groupsTree,
    criticalBreakers,
    safetyStations: DEFAULT_HALL_SAFETY_STATIONS,
  };
}

/**
 * Builds a WhatsApp reminder message for an assigned maintenance sheet
 */
export function buildMaintenanceSheetWhatsApp(
  sheet: MaintenanceSheet,
  assignedNames: string[],
  congregationName?: string
): string {
  const catLabel = MAINTENANCE_CATEGORY_LABELS[sheet.category] || sheet.category;
  let text = `🛠️ *FICHA DE MANTENIMIENTO PREVENTIVO — ${congregationName || 'SALÓN DEL REINO'}*\n\n`;
  text += `📋 *Tarea:* ${sheet.label}\n`;
  text += `🏷️ *Categoría:* ${catLabel} (${sheet.frequency})\n`;
  if (sheet.nextDueDate) {
    text += `📅 *Próxima fecha programada:* ${sheet.nextDueDate}\n`;
  }
  text += `👷 *Encargados:* ${assignedNames.length > 0 ? assignedNames.join(', ') : 'Comité de Mantenimiento'}\n\n`;

  if (sheet.checklist && sheet.checklist.length > 0) {
    text += `*Lista de verificación:*\n`;
    sheet.checklist.forEach(item => {
      text += `${item.completed ? '✅' : '⬜'} ${item.text}\n`;
    });
    text += `\n`;
  }

  if (sheet.safetyGear && sheet.safetyGear.length > 0) {
    text += `🦺 *Equipo de protección requerido:* ${sheet.safetyGear.join(', ')}\n\n`;
  }

  text += `_Agradecemos de corazón su valiosa colaboración cuidando nuestro lugar de adoración._`;
  return text;
}

/**
 * Builds a WhatsApp Emergency Contact Tree for a Preaching Group Overseer
 */
export function buildGroupEmergencyTreeWhatsApp(
  group: GroupEmergencyTree,
  congregationName?: string
): string {
  let text = `🚨 *ÁRBOL DE CONTACTO DE EMERGENCIA — GRUPO ${group.groupNumber}*\n`;
  text += `🏛️ *${congregationName || 'Congregación Local'}* (${group.groupName})\n`;
  text += `👤 *Superintendente:* ${group.overseerName} ${group.overseerPhone ? `(${group.overseerPhone})` : ''}\n`;
  text += `🤝 *Auxiliar:* ${group.assistantName} ${group.assistantPhone ? `(${group.assistantPhone})` : ''}\n\n`;

  text += `*DIRECTORIO DE PUBLICADORES (${group.members.length}):*\n`;
  group.members.forEach((m, idx) => {
    const flags: string[] = [];
    if (m.hasDpa) flags.push('DPA✓');
    if (m.hasVehicle) flags.push('🚗');
    if (m.isVulnerable || m.needsRide) flags.push('⚠️Apoyo');
    const flagStr = flags.length > 0 ? ` [${flags.join(' ')}]` : '';

    text += `${idx + 1}. *${m.name}*${flagStr}\n`;
    text += `   📞 Tel: ${m.phone || 'S/N'} | 📍 ${m.address}\n`;
    if (m.emergencyContactPhone) {
      text += `   🆘 Contacto Emerg.: ${m.emergencyContactName} (${m.emergencyContactPhone})\n`;
    }
  });

  text += `\n_Conserve esta lista disponible sin conexión ante cualquier eventualidad o emergencia._`;
  return text;
}

export function sendSafeMaintenanceWhatsApp(text: string, phone?: string): void {
  openSafeWhatsAppUrl(text, phone);
}

/**
 * Prints the Official 12-Month Preventive Maintenance Program in A4 format via hidden iframe
 */
export function printAnnualMaintenanceProgramA4(params: {
  settings: CongregationSettings;
  sheets: MaintenanceSheet[];
  publishersMap: Map<string, Publisher>;
}): void {
  const { settings, sheets, publishersMap } = params;
  const calendar = computeAnnualMaintenanceCalendar(sheets, publishersMap);
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const monthHeadersHtml = SERVICE_YEAR_MONTHS.map(
    m => `<th style="width:24px; text-align:center;">${m.shortLabel}</th>`
  ).join('');

  const rowsHtml = calendar.rows
    .map((row, idx) => {
      const monthCells = SERVICE_YEAR_MONTHS.map(m => {
        const isScheduled = row.scheduledMonthIndices.includes(m.index);
        return `<td style="text-align:center; font-weight:900; background:${
          isScheduled ? '#e0e7ff' : '#ffffff'
        }; color:${isScheduled ? '#1e1b4b' : '#d4d4d8'};">${isScheduled ? '●' : '·'}</td>`;
      }).join('');

      const statusLabel =
        row.sheet.status === 'al_dia'
          ? 'AL DÍA'
          : row.sheet.status === 'proximo'
          ? 'PRÓXIMO'
          : row.sheet.status === 'vencido'
          ? 'VENCIDO'
          : 'PENDIENTE';

      return `
        <tr>
          <td style="text-align:center; font-weight:700;">${idx + 1}</td>
          <td>
            <strong>${row.sheet.label}</strong>
            <div style="font-size:8.5px; color:#52525b;">${row.categoryLabel} ${
        row.sheet.safetyGear?.length ? `• EPP: ${row.sheet.safetyGear.join(', ')}` : ''
      }</div>
          </td>
          <td style="text-align:center; text-transform:capitalize;">${row.sheet.frequency}</td>
          <td>${row.assignedNames.join(', ') || 'Comité de Mantenimiento'}</td>
          ${monthCells}
          <td style="text-align:center; font-weight:700;">${row.sheet.nextDueDate || '—'}</td>
          <td style="text-align:center; font-weight:800; font-size:8.5px;">${statusLabel}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Programa Anual de Mantenimiento Preventivo - ${settings.congregationName || 'Salón del Reino'}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #18181b;
          margin: 0;
          padding: 0;
          font-size: 9.5px;
        }
        .header {
          border-bottom: 2.5px solid #1e1b4b;
          padding-bottom: 6px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .title {
          font-size: 15px;
          font-weight: 900;
          text-transform: uppercase;
          color: #1e1b4b;
        }
        .subtitle {
          font-size: 10.5px;
          font-weight: 700;
          color: #3f3f46;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th, td {
          border: 1px solid #a1a1aa;
          padding: 4px 5px;
          font-size: 9px;
        }
        th {
          background: #1e1b4b;
          color: #ffffff;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 8px;
        }
        .safety-box {
          border: 1px solid #d4d4d8;
          background: #fafafa;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 8.5px;
          margin-top: 8px;
        }
        .signatures {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          text-align: center;
        }
        .sig-line {
          border-top: 1px solid #18181b;
          margin-top: 22px;
          padding-top: 3px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Programa Anual de Mantenimiento Preventivo del Salón del Reino</div>
          <div class="subtitle">
            ${settings.congregationName || 'Congregación Local'}
            ${settings.circuitNumber ? ` • Circuito ${settings.circuitNumber}` : ''}
            • Año de Servicio (Septiembre – Agosto)
          </div>
        </div>
        <div style="text-align:right;">
          <div><strong>Fecha:</strong> ${todayFormatted}</div>
          <div><strong>Rutinas Activas:</strong> ${calendar.totalActiveSheets} (${calendar.compliancePercent}% al día)</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:22px;">#</th>
            <th>Ficha / Procedimiento Preventivo</th>
            <th style="width:62px;">Frecuencia</th>
            <th style="width:135px;">Hermanos Asignados</th>
            ${monthHeadersHtml}
            <th style="width:65px;">Próx. Fecha</th>
            <th style="width:58px;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="safety-box">
        <strong>PAUTAS DE SEGURIDAD Y PREVENCIÓN:</strong> Toda tarea en techos o alturas mayores a 2 metros requiere al menos dos hermanos y equipo de protección personal (arnés y línea de vida). Antes de revisar equipos eléctricos o climatización, desconecte el circuito correspondiente en el panel eléctrico.
      </div>

      <div class="signatures">
        <div>
          <div class="sig-line">Coordinador de Mantenimiento</div>
          <div style="font-size:8px; color:#52525b;">Encargado de Mantenimiento del Salón</div>
        </div>
        <div>
          <div class="sig-line">${settings.coordinatorName || 'Coordinador del Cuerpo de Ancianos'}</div>
          <div style="font-size:8px; color:#52525b;">Coordinador del Cuerpo de Ancianos</div>
        </div>
        <div>
          <div class="sig-line">Revisión Semestral</div>
          <div style="font-size:8px; color:#52525b;">Fecha y Firma de Verificación</div>
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
    }, 300);
  }
}

/**
 * Prints the Congregation Emergency Preparedness & Safety Plan in A4 format via hidden iframe
 */
export function printEmergencyPreparednessPlanA4(params: {
  settings: CongregationSettings;
  publishers: Publisher[];
  preachingGroups: PreachingGroup[];
  breakers: Breaker[];
}): void {
  const { settings, publishers, preachingGroups, breakers } = params;
  const plan = computeEmergencyReadinessPlan(publishers, preachingGroups, breakers);
  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const stationsHtml = plan.safetyStations
    .map(
      st => `
      <tr>
        <td style="font-family:monospace; font-weight:800; text-align:center;">${st.code}</td>
        <td>
          <strong>${st.title}</strong>
          <div style="font-size:8.5px; color:#52525b;">Ubicación: ${st.location}</div>
        </td>
        <td>${st.procedure}</td>
        <td>
          ${st.verificationItems.map(v => `<div>☑ ${v}</div>`).join('')}
        </td>
      </tr>
    `
    )
    .join('');

  const groupsHtml = plan.groupsTree
    .map(group => {
      const memberRows = group.members
        .map(
          (m, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td><strong>${m.name}</strong> <span style="font-size:8px; color:#52525b;">(${m.roleLabel})</span></td>
            <td>${m.phone || '—'}</td>
            <td>${m.address}</td>
            <td>${m.emergencyContactName} ${
            m.emergencyContactPhone ? `(${m.emergencyContactPhone})` : ''
          }</td>
            <td style="text-align:center; font-weight:700;">${m.hasDpa ? 'Vigente' : 'Pendiente'}</td>
            <td style="text-align:center;">${
              m.isVulnerable || m.needsRide
                ? 'Prioridad Apoyo'
                : m.hasVehicle
                ? 'Vehículo Disponible'
                : 'Regular'
            }</td>
          </tr>
        `
        )
        .join('');

      return `
        <div style="page-break-inside: avoid; margin-bottom: 12px;">
          <div style="background:#1e1b4b; color:#fff; padding:4px 8px; font-weight:800; font-size:10px; border-radius:4px 4px 0 0; display:flex; justify-content:space-between;">
            <span>GRUPO ${group.groupNumber}: ${group.groupName.toUpperCase()}</span>
            <span>Sup.: ${group.overseerName} (${group.overseerPhone || 'S/N'}) • Aux.: ${group.assistantName}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:20px;">#</th>
                <th style="width:135px;">Publicador</th>
                <th style="width:75px;">Teléfono</th>
                <th>Dirección / Sector</th>
                <th style="width:145px;">Contacto de Emergencia</th>
                <th style="width:55px;">DPA</th>
                <th style="width:85px;">Movilidad / Apoyo</th>
              </tr>
            </thead>
            <tbody>
              ${memberRows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Plan de Emergencias y Seguridad - ${settings.congregationName || 'Congregación'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 11mm;
        }
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #18181b;
          margin: 0;
          padding: 0;
          font-size: 9.5px;
          line-height: 1.3;
        }
        .header {
          border-bottom: 2.5px solid #991b1b;
          padding-bottom: 6px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .title {
          font-size: 15px;
          font-weight: 900;
          text-transform: uppercase;
          color: #991b1b;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .kpi-box {
          border: 1px solid #d4d4d8;
          border-radius: 5px;
          padding: 5px 8px;
          background: #fafafa;
        }
        .kpi-label {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          color: #52525b;
        }
        .kpi-val {
          font-size: 13px;
          font-weight: 900;
          color: #18181b;
        }
        .section-heading {
          font-size: 10.5px;
          font-weight: 800;
          text-transform: uppercase;
          color: #991b1b;
          margin: 10px 0 5px 0;
          border-bottom: 1px solid #fecaca;
          padding-bottom: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        th, td {
          border: 1px solid #a1a1aa;
          padding: 3.5px 5px;
          font-size: 8.8px;
        }
        th {
          background: #f4f4f5;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Plan de Prevención de Emergencias y Árbol de Contacto</div>
          <div style="font-weight:700; color:#3f3f46; font-size:10.5px;">
            ${settings.congregationName || 'Congregación Local'}
            ${settings.hallAddress ? ` • ${settings.hallAddress}` : ''}
          </div>
        </div>
        <div style="text-align:right; font-size:9px;">
          <div><strong>Actualizado:</strong> ${todayFormatted}</div>
          <div><strong>Coordinador:</strong> ${settings.coordinatorName || 'Cuerpo de Ancianos'}</div>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-label">Publicadores Activos</div>
          <div class="kpi-val">${plan.totalActivePublishers} hermanos</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Contactos de Emergencia</div>
          <div class="kpi-val">${plan.withEmergencyContactCount} / ${plan.totalActivePublishers}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Directriz Médica (DPA)</div>
          <div class="kpi-val">${plan.withDpaCount} vigentes</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Vehículos de Apoyo</div>
          <div class="kpi-val">${plan.withVehicleCount} disponibles</div>
        </div>
      </div>

      <div class="section-heading">1. Protocolo Operativo de Seguridad en el Salón del Reino</div>
      <table>
        <thead>
          <tr>
            <th style="width:48px;">Código</th>
            <th style="width:140px;">Estación / Sistema</th>
            <th>Procedimiento de Actuación</th>
            <th style="width:170px;">Puntos de Control</th>
          </tr>
        </thead>
        <tbody>
          ${stationsHtml}
        </tbody>
      </table>

      <div class="section-heading">2. Árbol de Contacto y Pastoreo de Emergencia por Grupos de Predicación</div>
      ${groupsHtml}
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
    }, 300);
  }
}
