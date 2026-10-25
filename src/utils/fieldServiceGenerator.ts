// src/utils/fieldServiceGenerator.ts
import {
  Publisher,
  PreachingGroup,
  Territory,
  FieldServiceMeeting,
  FieldServiceModality,
  CongregationSettings,
} from '../types';
import { arePublishersFamily, getPubDisplayName } from './familyGrouping';

export interface FieldServiceSlotTemplate {
  id: string;
  enabled: boolean;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  session: 'manana' | 'tarde' | 'noche';
  time: string; // '09:00'
  locationMode: 'salon' | 'hogar_grupo' | 'zoom' | 'personalizado';
  customLocation?: string;
  scope: 'general' | 'por_grupos';
  modality: FieldServiceModality;
  notes?: string;
}

export const DAYS_OF_WEEK_ORDER: Array<FieldServiceSlotTemplate['dayOfWeek']> = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const MODALITY_LABELS: Record<FieldServiceModality, string> = {
  casa_en_casa: 'Predicación de Casa en Casa',
  carritos: 'Exhibidores Públicos (Carritos)',
  estudios_revisitas: 'Revisitas y Estudios Bíblicos',
  telefonica_cartas: 'Predicación Telefónica / Cartas',
  negocios: 'Territorio de Negocios y Comercios',
};

export const MODALITY_SHORT_LABELS: Record<FieldServiceModality, string> = {
  casa_en_casa: 'Casa en casa',
  carritos: 'Carritos',
  estudios_revisitas: 'Revisitas / Estudios',
  telefonica_cartas: 'Telefónica / Cartas',
  negocios: 'Negocios',
};

export const DEFAULT_KHS_SLOTS: FieldServiceSlotTemplate[] = [
  {
    id: 'slot-lun-am',
    enabled: true,
    dayOfWeek: 'Lunes',
    session: 'manana',
    time: '09:00',
    locationMode: 'salon',
    scope: 'general',
    modality: 'casa_en_casa',
  },
  {
    id: 'slot-mar-am',
    enabled: true,
    dayOfWeek: 'Martes',
    session: 'manana',
    time: '09:00',
    locationMode: 'salon',
    scope: 'general',
    modality: 'casa_en_casa',
  },
  {
    id: 'slot-mie-am',
    enabled: true,
    dayOfWeek: 'Miércoles',
    session: 'manana',
    time: '09:00',
    locationMode: 'salon',
    scope: 'general',
    modality: 'casa_en_casa',
  },
  {
    id: 'slot-mie-pm',
    enabled: true,
    dayOfWeek: 'Miércoles',
    session: 'tarde',
    time: '16:00',
    locationMode: 'salon',
    scope: 'general',
    modality: 'estudios_revisitas',
  },
  {
    id: 'slot-jue-am',
    enabled: true,
    dayOfWeek: 'Jueves',
    session: 'manana',
    time: '09:00',
    locationMode: 'salon',
    scope: 'general',
    modality: 'negocios',
  },
  {
    id: 'slot-vie-am',
    enabled: true,
    dayOfWeek: 'Viernes',
    session: 'manana',
    time: '09:00',
    locationMode: 'salon',
    scope: 'general',
    modality: 'casa_en_casa',
  },
  {
    id: 'slot-vie-pm',
    enabled: false,
    dayOfWeek: 'Viernes',
    session: 'tarde',
    time: '16:30',
    locationMode: 'zoom',
    scope: 'general',
    modality: 'telefonica_cartas',
  },
  {
    id: 'slot-sab-am',
    enabled: true,
    dayOfWeek: 'Sábado',
    session: 'manana',
    time: '09:00',
    locationMode: 'hogar_grupo',
    scope: 'por_grupos',
    modality: 'casa_en_casa',
  },
  {
    id: 'slot-dom-am',
    enabled: true,
    dayOfWeek: 'Domingo',
    session: 'manana',
    time: '08:30',
    locationMode: 'salon',
    scope: 'general',
    modality: 'casa_en_casa',
  },
];

export function getPresetSlots(preset: 'estandar_semanal' | 'compacto_congregacion' | 'campana_especial'): FieldServiceSlotTemplate[] {
  if (preset === 'compacto_congregacion') {
    return DEFAULT_KHS_SLOTS.map((s) => ({
      ...s,
      enabled: ['Martes', 'Jueves', 'Sábado', 'Domingo'].includes(s.dayOfWeek) && s.session === 'manana',
    }));
  }
  if (preset === 'campana_especial') {
    const campaignSlots: FieldServiceSlotTemplate[] = [];
    DAYS_OF_WEEK_ORDER.forEach((day, idx) => {
      campaignSlots.push({
        id: `camp-am-${idx}`,
        enabled: true,
        dayOfWeek: day,
        session: 'manana',
        time: day === 'Domingo' ? '08:30' : '09:00',
        locationMode: day === 'Sábado' ? 'hogar_grupo' : 'salon',
        scope: day === 'Sábado' ? 'por_grupos' : 'general',
        modality: 'casa_en_casa',
        notes: 'Campaña Especial',
      });
      if (day !== 'Domingo') {
        campaignSlots.push({
          id: `camp-pm-${idx}`,
          enabled: true,
          dayOfWeek: day,
          session: 'tarde',
          time: '16:00',
          locationMode: 'salon',
          scope: 'general',
          modality: idx % 2 === 0 ? 'estudios_revisitas' : 'negocios',
          notes: 'Turno vespertino de campaña',
        });
      }
    });
    return campaignSlots;
  }
  return DEFAULT_KHS_SLOTS.map((s) => ({ ...s }));
}

/**
 * Determina si un publicador está ausente en una fecha específica (YYYY-MM-DD).
 */
export function isPublisherAbsentOnDate(pub: Publisher, dateISO?: string): boolean {
  if (!dateISO) return false;
  const absences = pub.absences || [];
  for (const a of absences) {
    if (a.startDate && a.endDate && dateISO >= a.startDate && dateISO <= a.endDate) {
      return true;
    }
  }
  const ausencias = pub.ausencias || [];
  for (const a of ausencias) {
    if (a.start_date && a.end_date && dateISO >= a.start_date && dateISO <= a.end_date) {
      return true;
    }
  }
  return false;
}

/**
 * Obtiene la lista de hermanos capacitados para conducir Reuniones para el Servicio del Campo.
 */
export function getEligibleFieldServiceConductors(
  publishers: Publisher[],
  preachingGroups: PreachingGroup[]
): Publisher[] {
  const groupLeaderIds = new Set<string>();
  preachingGroups.forEach((g) => {
    if (g.overseerId) groupLeaderIds.add(g.overseerId);
    if (g.assistantId) groupLeaderIds.add(g.assistantId);
  });

  const qualified = publishers.filter((p) => {
    if (!p.active) return false;
    const isBrother = p.gender === 'hermano' || p.gender === 'male';
    if (!isBrother) return false;

    const isAppointed =
      p.privilege === 'anciano' ||
      p.privilege === 'siervo_ministerial' ||
      p.spiritualStatus === 'elder' ||
      p.spiritualStatus === 'ministerial_servant' ||
      p.spiritualStatus === 'anciano' ||
      p.spiritualStatus === 'siervo_ministerial';

    const isGroupLeader = groupLeaderIds.has(p.id) || (p.nid ? groupLeaderIds.has(p.nid) : false);
    const hasChairmanOrConductorRole =
      Boolean(p.roles?.vym_presidente) ||
      Boolean(p.roles?.vym_estudio_conductor) ||
      Boolean(p.roles?.fds_presidente) ||
      Boolean(p.roles?.vym_oracion);
    const isPioneerBrother =
      p.privilege === 'precursor_regular' ||
      p.privilege === 'precursor_especial' ||
      p.pioneerStatus === 'regular' ||
      p.pioneerStatus === 'especial';

    return isAppointed || isGroupLeader || hasChairmanOrConductorRole || isPioneerBrother;
  });

  if (qualified.length > 0) return qualified;

  // Respaldo: cualquier hermano activo bautizado
  return publishers.filter(
    (p) =>
      p.active &&
      (p.gender === 'hermano' || p.gender === 'male') &&
      p.privilege !== 'publicador_no_bautizado'
  );
}

/**
 * Ordena y sugiere los territorios más apropiados según el estado S-13 (disponibilidad y antigüedad sin trabajar).
 */
export function rankTerritoriesForFieldService(
  territories: Territory[],
  modality: FieldServiceModality = 'casa_en_casa',
  alreadySuggestedIds: Set<string> = new Set()
): Array<{ territory: Territory; score: number; reason: string }> {
  if (!territories || territories.length === 0) return [];

  const todayMs = Date.now();

  return territories
    .map((t) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Priorizar territorios disponibles en S-13
      if (t.status === 'disponible') {
        score += 100;
        reasons.push('Disponible en S-13');
      } else if (t.status === 'asignado') {
        score += 35;
        reasons.push('En curso');
      } else {
        score += 20;
      }

      // 2. Antigüedad desde la última vez que se completó (lastCompletedDate)
      if (!t.lastCompletedDate) {
        score += 65;
        reasons.push('Sin fecha reciente de cierre');
      } else {
        const lastMs = new Date(t.lastCompletedDate).getTime();
        if (!isNaN(lastMs)) {
          const daysSince = Math.max(0, Math.floor((todayMs - lastMs) / (1000 * 60 * 60 * 24)));
          score += Math.min(80, Math.floor(daysSince / 3));
          if (daysSince > 90) {
            reasons.push(`Hace ${Math.floor(daysSince / 30)} meses sin completar`);
          }
        }
      }

      // 3. Afinidad con la modalidad de la salida
      if (modality === 'negocios' && t.type === 'negocios') {
        score += 50;
        reasons.push('Especial para Negocios');
      } else if (modality === 'telefonica_cartas' && t.type === 'telefonico') {
        score += 50;
        reasons.push('Especial Telefónico');
      } else if (
        modality === 'casa_en_casa' &&
        (t.type === 'residencial' || t.type === 'edificios' || t.type === 'rural')
      ) {
        score += 25;
      }

      // 4. Penalizar si ya se sugirió en este mismo ciclo para rotar toda la congregación
      if (alreadySuggestedIds.has(t.id)) {
        score -= 90;
      }

      return {
        territory: t,
        score,
        reason: reasons.slice(0, 2).join(' • ') || 'Rotación S-13',
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.territory.number.localeCompare(b.territory.number, undefined, { numeric: true });
    });
}

export interface GenerateFieldServiceOptions {
  mode: 'week' | 'month';
  weekStartDateISO?: string; // YYYY-MM-DD (Lunes)
  monthKey?: string; // YYYY-MM (ej. '2026-10')
  slots: FieldServiceSlotTemplate[];
  publishers: Publisher[];
  preachingGroups: PreachingGroup[];
  territories: Territory[];
  settings: CongregationSettings;
  existingMeetings?: FieldServiceMeeting[];
  autoSuggestTerritories: boolean;
  preferGroupLeadersOnGroupDays: boolean;
  preferFamilyAffinity: boolean;
}

function getSpanishDayOfWeekFromDateISO(dateISO: string): FieldServiceSlotTemplate['dayOfWeek'] {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const map: Array<FieldServiceSlotTemplate['dayOfWeek']> = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  return map[dt.getDay()];
}

function buildDateListForOptions(options: GenerateFieldServiceOptions): string[] {
  const dates: string[] = [];
  if (options.mode === 'week') {
    const baseStr = options.weekStartDateISO || new Date().toISOString().slice(0, 10);
    const [y, m, d] = baseStr.split('-').map(Number);
    const start = new Date(y, m - 1, d);
    for (let i = 0; i < 7; i++) {
      const curr = new Date(start);
      curr.setDate(start.getDate() + i);
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
  } else {
    const mk = options.monthKey || new Date().toISOString().slice(0, 7);
    const [y, m] = mk.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(m).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      dates.push(`${y}-${mm}-${dd}`);
    }
  }
  return dates;
}

/**
 * Motor KHS: Genera automáticamente el cuadrante de Reuniones para el Servicio del Campo
 * con rotación equitativa de conductores autorizados y sugerencia de territorios S-13.
 */
export function generateFieldServiceScheduleKHS(
  options: GenerateFieldServiceOptions
): FieldServiceMeeting[] {
  const {
    slots,
    publishers,
    preachingGroups,
    territories,
    settings,
    autoSuggestTerritories,
    preferGroupLeadersOnGroupDays,
    preferFamilyAffinity,
  } = options;

  const enabledSlots = slots.filter((s) => s.enabled);
  if (enabledSlots.length === 0) return [];

  const eligibleConductors = getEligibleFieldServiceConductors(publishers, preachingGroups);
  const conductorUsageCount = new Map<string, number>();
  const conductorLastDate = new Map<string, string>();
  eligibleConductors.forEach((c) => conductorUsageCount.set(c.id, 0));

  const usedTerritoryIds = new Set<string>();
  const generated: FieldServiceMeeting[] = [];
  const dates = buildDateListForOptions(options);

  const hallLocation = settings.hallAddress
    ? `Salón del Reino (${settings.hallAddress})`
    : `Salón del Reino ${settings.congregationName || ''}`.trim();

  const pickConductor = (
    dateISO: string,
    targetGroup?: PreachingGroup,
    alreadyAssignedTodayIds: Set<string> = new Set()
  ): Publisher | undefined => {
    if (eligibleConductors.length === 0) return undefined;

    // 1. Si es salida por grupo y se prefiere a los encargados del grupo:
    if (targetGroup && preferGroupLeadersOnGroupDays) {
      const overseer = eligibleConductors.find(
        (c) => c.id === targetGroup.overseerId || (c.nid && c.nid === targetGroup.overseerId)
      );
      if (
        overseer &&
        !isPublisherAbsentOnDate(overseer, dateISO) &&
        !alreadyAssignedTodayIds.has(overseer.id)
      ) {
        conductorUsageCount.set(overseer.id, (conductorUsageCount.get(overseer.id) || 0) + 1);
        conductorLastDate.set(overseer.id, dateISO);
        return overseer;
      }

      const assistant = eligibleConductors.find(
        (c) => c.id === targetGroup.assistantId || (c.nid && c.nid === targetGroup.assistantId)
      );
      if (
        assistant &&
        !isPublisherAbsentOnDate(assistant, dateISO) &&
        !alreadyAssignedTodayIds.has(assistant.id)
      ) {
        conductorUsageCount.set(assistant.id, (conductorUsageCount.get(assistant.id) || 0) + 1);
        conductorLastDate.set(assistant.id, dateISO);
        return assistant;
      }
    }

    // 2. Puntaje de equidad KHS para todos los conductores elegibles
    const available = eligibleConductors.filter(
      (c) => !isPublisherAbsentOnDate(c, dateISO) && !alreadyAssignedTodayIds.has(c.id)
    );
    const pool = available.length > 0 ? available : eligibleConductors;

    const scored = pool.map((cand) => {
      let score = 100;
      const count = conductorUsageCount.get(cand.id) || 0;
      score -= count * 28; // Rotación equitativa: penalizar a quienes ya condujeron más veces

      // Evitar días consecutivos si hay más hermanos
      const lastDate = conductorLastDate.get(cand.id);
      if (lastDate) {
        const diffDays = Math.abs(
          (new Date(dateISO).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 1) score -= 45;
        else if (diffDays <= 2) score -= 20;
      }

      // Si es para un grupo específico, dar bono a los miembros de ese grupo
      if (targetGroup && cand.groupNumber === targetGroup.number) {
        score += 30;
      }

      // Afinidad familiar KHS si otro miembro de su familia ya participa hoy
      if (preferFamilyAffinity && alreadyAssignedTodayIds.size > 0) {
        alreadyAssignedTodayIds.forEach((otherId) => {
          const otherPub = publishers.find((p) => p.id === otherId);
          if (otherPub && arePublishersFamily(cand, otherPub)) {
            score += 22;
          }
        });
      }

      return { cand, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.cand.name.localeCompare(b.cand.name);
    });

    const chosen = scored[0]?.cand;
    if (chosen) {
      conductorUsageCount.set(chosen.id, (conductorUsageCount.get(chosen.id) || 0) + 1);
      conductorLastDate.set(chosen.id, dateISO);
    }
    return chosen;
  };

  const pickTerritory = (modality: FieldServiceModality): Territory | undefined => {
    if (!autoSuggestTerritories || territories.length === 0) return undefined;
    const ranked = rankTerritoriesForFieldService(territories, modality, usedTerritoryIds);
    const best = ranked[0]?.territory;
    if (best) {
      usedTerritoryIds.add(best.id);
      // Si ya rotamos por todos los territorios, reiniciar el ciclo para seguir sugiriendo equitativamente
      if (usedTerritoryIds.size >= territories.length) {
        usedTerritoryIds.clear();
      }
    }
    return best;
  };

  dates.forEach((dateISO) => {
    const dayOfWeek = getSpanishDayOfWeekFromDateISO(dateISO);
    const matchingSlots = enabledSlots.filter((s) => s.dayOfWeek === dayOfWeek);
    if (matchingSlots.length === 0) return;

    const assignedTodayIds = new Set<string>();

    matchingSlots.forEach((slot, slotIdx) => {
      if (slot.scope === 'por_grupos' && preachingGroups.length > 0) {
        preachingGroups.forEach((group) => {
          const conductor = pickConductor(dateISO, group, assignedTodayIds);
          if (conductor) assignedTodayIds.add(conductor.id);

          const suggestedTerr = pickTerritory(slot.modality);
          const overseer = publishers.find((p) => p.id === group.overseerId);
          const resolvedLocation =
            slot.locationMode === 'hogar_grupo'
              ? overseer?.address
                ? `Punto ${group.name} (${overseer.address})`
                : `Punto de encuentro ${group.name}`
              : slot.locationMode === 'zoom'
              ? 'Sala de Zoom de la Congregación'
              : slot.locationMode === 'personalizado' && slot.customLocation?.trim()
              ? slot.customLocation.trim()
              : hallLocation;

          generated.push({
            id: `fsm-${dateISO}-g${group.number}-${slotIdx}-${Math.random().toString(36).slice(2, 6)}`,
            date: dateISO,
            dayOfWeek,
            session: slot.session,
            time: slot.time,
            location: resolvedLocation,
            conductorId: conductor?.id,
            groupNumber: group.number,
            territoryId: suggestedTerr?.id,
            territoryNumber: suggestedTerr
              ? `${suggestedTerr.number} - ${suggestedTerr.name}`
              : undefined,
            modality: slot.modality,
            notes: slot.notes || MODALITY_SHORT_LABELS[slot.modality],
          });
        });
      } else {
        const conductor = pickConductor(dateISO, undefined, assignedTodayIds);
        if (conductor) assignedTodayIds.add(conductor.id);

        const suggestedTerr = pickTerritory(slot.modality);
        const resolvedLocation =
          slot.locationMode === 'zoom'
            ? 'Sala de Zoom de la Congregación'
            : slot.locationMode === 'personalizado' && slot.customLocation?.trim()
            ? slot.customLocation.trim()
            : hallLocation;

        generated.push({
          id: `fsm-${dateISO}-gen-${slotIdx}-${Math.random().toString(36).slice(2, 6)}`,
          date: dateISO,
          dayOfWeek,
          session: slot.session,
          time: slot.time,
          location: resolvedLocation,
          conductorId: conductor?.id,
          groupNumber: undefined,
          territoryId: suggestedTerr?.id,
          territoryNumber: suggestedTerr
            ? `${suggestedTerr.number} - ${suggestedTerr.name}`
            : undefined,
          modality: slot.modality,
          notes: slot.notes || MODALITY_SHORT_LABELS[slot.modality],
        });
      }
    });
  });

  return generated;
}

/**
 * Formatea el programa de salidas al servicio del campo para enviar por WhatsApp a los grupos o congregación.
 */
export function formatFieldServiceScheduleWhatsApp(
  meetings: FieldServiceMeeting[],
  publishersMap: Map<string, Publisher>,
  territories: Territory[],
  preachingGroups: PreachingGroup[],
  congregationName: string,
  periodLabel: string
): string {
  let msg = `🧭 *PROGRAMA DE REUNIONES PARA EL SERVICIO DEL CAMPO*\n`;
  if (congregationName) msg += `🏛 *Congregación ${congregationName}*\n`;
  if (periodLabel) msg += `📅 *Período:* ${periodLabel}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (meetings.length === 0) {
    msg += `_No hay salidas programadas en esta vista._`;
    return msg;
  }

  meetings.forEach((m) => {
    const conductor = m.conductorId ? publishersMap.get(m.conductorId) : undefined;
    const conductorName = conductor ? getPubDisplayName(conductor) : 'Por asignar';
    const grp = m.groupNumber
      ? preachingGroups.find((g) => g.number === m.groupNumber)
      : undefined;
    const groupLabel = grp ? grp.name : m.groupNumber ? `Grupo ${m.groupNumber}` : 'General';
    const terr = m.territoryId
      ? territories.find((t) => t.id === m.territoryId)
      : m.territoryNumber
      ? territories.find((t) => m.territoryNumber?.startsWith(t.number))
      : undefined;

    const dateBadge = m.date ? `${m.dayOfWeek} (${m.date})` : m.dayOfWeek;
    msg += `📌 *${dateBadge} — ⏰ ${m.time}*\n`;
    msg += `   👥 *Alcance:* ${groupLabel}\n`;
    msg += `   📍 *Lugar:* ${m.location}\n`;
    msg += `   👤 *Conductor:* ${conductorName}\n`;
    if (m.territoryNumber) {
      msg += `   🗺 *Territorio:* #${m.territoryNumber}\n`;
      if (terr?.noVisits && terr.noVisits.length > 0) {
        msg += `   ⚠️ *Atención:* ${terr.noVisits.length} casa(s) "No Visitar" registrada(s)\n`;
      }
    }
    if (m.modality) {
      msg += `   💼 *Modalidad:* ${MODALITY_SHORT_LABELS[m.modality] || m.modality}\n`;
    }
    if (m.notes && m.notes !== (m.modality ? MODALITY_SHORT_LABELS[m.modality] : '')) {
      msg += `   📝 _${m.notes}_\n`;
    }
    msg += `\n`;
  });

  msg += `_«Efectúa tu ministerio plenamente» (2 Tim. 4:5)_`;
  return msg;
}

/**
 * Imprime el Cuadrante Oficial de Salidas para el Servicio del Campo (Estilo Cartelera KHS)
 * usando un iframe oculto para evitar bloqueo de ventanas emergentes.
 */
export function printFieldServiceScheduleKHS(
  meetings: FieldServiceMeeting[],
  publishersMap: Map<string, Publisher>,
  territories: Territory[],
  preachingGroups: PreachingGroup[],
  settings: CongregationSettings,
  periodLabel: string
): void {
  const rowsHtml = meetings
    .map((m, idx) => {
      const conductor = m.conductorId ? publishersMap.get(m.conductorId) : undefined;
      const conductorName = conductor ? getPubDisplayName(conductor) : 'Por asignar';
      const grp = m.groupNumber
        ? preachingGroups.find((g) => g.number === m.groupNumber)
        : undefined;
      const groupLabel = grp
        ? grp.name
        : m.groupNumber
        ? `Grupo ${m.groupNumber}`
        : 'Congregación General';
      const terr = m.territoryId
        ? territories.find((t) => t.id === m.territoryId)
        : undefined;
      const noVisitsBadge =
        terr?.noVisits && terr.noVisits.length > 0
          ? `<div style="font-size:10px;color:#b91c1c;font-weight:700;margin-top:2px;">⚠ ${terr.noVisits.length} No Visitar</div>`
          : '';
      const modalityLabel = m.modality ? MODALITY_SHORT_LABELS[m.modality] : 'Casa en casa';
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      return `
        <tr style="background:${bg};">
          <td style="padding:7px 9px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;white-space:nowrap;">
            ${m.dayOfWeek}
            ${m.date ? `<div style="font-size:10px;font-weight:600;color:#64748b;">${m.date}</div>` : ''}
          </td>
          <td style="padding:7px 9px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#1e40af;white-space:nowrap;">
            ${m.time}
          </td>
          <td style="padding:7px 9px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#334155;">
            <span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#eff6ff;color:#1d4ed8;font-size:10px;font-weight:700;">
              ${groupLabel}
            </span>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">${modalityLabel}</div>
          </td>
          <td style="padding:7px 9px;border-bottom:1px solid #e2e8f0;color:#1e293b;">
            <strong>${m.location}</strong>
            ${m.notes && m.notes !== modalityLabel ? `<div style="font-size:10px;color:#64748b;">${m.notes}</div>` : ''}
          </td>
          <td style="padding:7px 9px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">
            ${conductorName}
          </td>
          <td style="padding:7px 9px;border-bottom:1px solid #e2e8f0;color:#0f172a;">
            ${
              m.territoryNumber
                ? `<span style="font-weight:700;color:#047857;">#${m.territoryNumber}</span>${noVisitsBadge}`
                : '<span style="color:#94a3b8;font-size:11px;">Según necesidad</span>'
            }
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Programa de Reuniones para el Servicio del Campo - ${settings.congregationName || 'Kongre'}</title>
  <style>
    @page { size: letter portrait; margin: 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 12px;
    }
    .header {
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      color: #1e3a8a;
      letter-spacing: 0.02em;
      margin: 0;
    }
    .subtitle {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      margin-top: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
    }
    th {
      background: #1e3a8a;
      color: #ffffff;
      text-align: left;
      padding: 8px 9px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .footer {
      margin-top: 14px;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Programa de Reuniones para el Servicio del Campo</h1>
      <div class="subtitle">Congregación ${settings.congregationName || ''}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;font-weight:800;color:#0f172a;">${periodLabel}</div>
      <div style="font-size:10px;color:#64748b;">Tablero de Información del Salón del Reino</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Día / Fecha</th>
        <th>Hora</th>
        <th>Grupo / Modalidad</th>
        <th>Punto de Encuentro</th>
        <th>Conductor Asignado</th>
        <th>Territorio Sugerido (S-13)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="6" style="padding:20px;text-align:center;">Sin salidas registradas.</td></tr>'}
    </tbody>
  </table>
  <div class="footer">
    <span>Nota: Las reuniones para el servicio del campo no deben durar más de 5 a 7 minutos (km 3/15 pág. 3).</span>
    <span>Impreso el ${new Date().toLocaleDateString('es-ES')}</span>
  </div>
</body>
</html>`;

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
    }, 250);
  }
}
