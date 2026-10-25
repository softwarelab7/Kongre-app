// src/utils/khsPublicWitnessingEngine.ts
import {
  CartShift,
  CartLocation,
  Publisher,
  CongregationSettings,
  Territory,
} from '../types';
import { arePublishersFamily, getPubId } from './familyGrouping';

export interface CartShiftEvaluation {
  shiftId: string;
  isFull: boolean;
  isPartial: boolean;
  isEmpty: boolean;
  isFamilyPair: boolean;
  isFixedPartnerPair: boolean;
  hasMixedGenderWarning: boolean;
  hasOverlappingShiftConflict: boolean;
  hasAbsenceConflict: boolean;
  warnings: string[];
}

export interface CartPublisherEquityRow {
  publisher: Publisher;
  isApprovedOrPioneer: boolean;
  shiftsCount: number;
  familyShiftsCount: number;
  daysAssigned: string[];
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
};

export function isPublisherAbsentOnShiftDate(pub: Publisher, dateStr?: string): boolean {
  if (!dateStr || !pub.ausencias || pub.ausencias.length === 0) return false;
  return pub.ausencias.some((a) => dateStr >= a.start_date && dateStr <= a.end_date);
}

export function isPublisherAvailableOnCartDay(pub: Publisher, dayOfWeek: string): boolean {
  if (!pub.cart_available_days || pub.cart_available_days.length === 0) return true;
  const dayNum = DAY_NAME_TO_NUMBER[dayOfWeek];
  if (dayNum === undefined) return true;
  return pub.cart_available_days.includes(dayNum);
}

export function isFixedCartPartner(pubA: Publisher, pubB: Publisher): boolean {
  const idA = getPubId(pubA);
  const idB = getPubId(pubB);
  return Boolean(
    (pubA.fixed_cart_partner_nid &&
      (pubA.fixed_cart_partner_nid === idB ||
        pubA.fixed_cart_partner_nid === pubB.id ||
        pubA.fixed_cart_partner_nid === pubB.nid)) ||
      (pubB.fixed_cart_partner_nid &&
        (pubB.fixed_cart_partner_nid === idA ||
          pubB.fixed_cart_partner_nid === pubA.id ||
          pubB.fixed_cart_partner_nid === pubA.nid))
  );
}

export function isCompatibleCartPair(pubA: Publisher, pubB: Publisher): boolean {
  if (pubA.id === pubB.id) return false;
  if (arePublishersFamily(pubA, pubB) || isFixedCartPartner(pubA, pubB)) {
    return true;
  }
  const genA = pubA.gender === 'hermana' || (pubA.gender as string) === 'female' ? 'F' : 'M';
  const genB = pubB.gender === 'hermana' || (pubB.gender as string) === 'female' ? 'F' : 'M';
  return genA === genB;
}

/**
 * Evalúa teocráticamente un turno de carrito (detecta matrimonios/familia, compañeros fijos,
 * parejas mixtas sin parentesco, choques de horario el mismo día y ausencias).
 */
export function evaluateCartShiftPair(
  shift: CartShift,
  allShifts: CartShift[],
  publishersMap: Map<string, Publisher>
): CartShiftEvaluation {
  const pub1 = shift.publisher1Id ? publishersMap.get(shift.publisher1Id) : undefined;
  const pub2 = shift.publisher2Id ? publishersMap.get(shift.publisher2Id) : undefined;

  const isFull = Boolean(pub1 && pub2);
  const isPartial = Boolean((pub1 && !pub2) || (!pub1 && pub2));
  const isEmpty = !pub1 && !pub2;

  let isFamilyPair = false;
  let isFixedPartnerPair = false;
  let hasMixedGenderWarning = false;
  let hasOverlappingShiftConflict = false;
  let hasAbsenceConflict = false;
  const warnings: string[] = [];

  if (pub1 && pub2) {
    if (pub1.id === pub2.id) {
      warnings.push('El mismo publicador figura en ambos lugares del turno.');
    } else {
      isFamilyPair = arePublishersFamily(pub1, pub2);
      isFixedPartnerPair = isFixedCartPartner(pub1, pub2);
      if (!isCompatibleCartPair(pub1, pub2)) {
        hasMixedGenderWarning = true;
        warnings.push(
          'Pareja de distinto género sin vínculo familiar/matrimonial registrado. Se recomienda asignar mismo género o familiares.'
        );
      }
    }
  }

  // Verificar ausencias en fecha
  if (shift.date) {
    if (pub1 && isPublisherAbsentOnShiftDate(pub1, shift.date)) {
      hasAbsenceConflict = true;
      warnings.push(`${pub1.name} tiene ausencia registrada para el ${shift.date}.`);
    }
    if (pub2 && isPublisherAbsentOnShiftDate(pub2, shift.date)) {
      hasAbsenceConflict = true;
      warnings.push(`${pub2.name} tiene ausencia registrada para el ${shift.date}.`);
    }
  }

  // Verificar otro turno el mismo día y hora superpuesta
  allShifts.forEach((other) => {
    if (other.id === shift.id) return;
    if (other.dayOfWeek !== shift.dayOfWeek) return;
    if (shift.date && other.date && shift.date !== other.date) return;

    const overlaps = !(other.endTime <= shift.startTime || other.startTime >= shift.endTime);
    if (!overlaps) return;

    if (
      pub1 &&
      (other.publisher1Id === pub1.id || other.publisher2Id === pub1.id)
    ) {
      hasOverlappingShiftConflict = true;
      warnings.push(`${pub1.name} ya tiene otro turno simultáneo el ${shift.dayOfWeek} (${other.startTime}-${other.endTime}).`);
    }
    if (
      pub2 &&
      (other.publisher1Id === pub2.id || other.publisher2Id === pub2.id)
    ) {
      hasOverlappingShiftConflict = true;
      warnings.push(`${pub2.name} ya tiene otro turno simultáneo el ${shift.dayOfWeek} (${other.startTime}-${other.endTime}).`);
    }
  });

  return {
    shiftId: shift.id,
    isFull,
    isPartial,
    isEmpty,
    isFamilyPair,
    isFixedPartnerPair,
    hasMixedGenderWarning,
    hasOverlappingShiftConflict,
    hasAbsenceConflict,
    warnings,
  };
}

/**
 * Obtiene la lista de publicadores aprobados o elegibles para predicación pública con exhibidores (carritos).
 */
export function getEligibleCartPublishers(publishers: Publisher[]): Publisher[] {
  const active = publishers.filter((p) => p.active !== false && !p.is_inactive);
  const approved = active.filter(
    (p) =>
      p.roles?.carritos ||
      p.is_cart_approved ||
      p.pioneerStatus === 'regular' ||
      p.pioneerStatus === 'especial' ||
      p.pioneerStatus === 'auxiliar_continuo'
  );
  return approved.length >= 4 ? approved : active;
}

/**
 * Auto-Asignador Inteligente KHS de Turnos de Carritos:
 * - Empareja prioritariamente matrimonios, núcleos familiares (KHS Family Grouping) y compañeros fijos.
 * - Cuando empareja hermanos no emparentados, garantiza que sean del mismo género (Hno+Hno o Hna+Hna).
 * - Equilibra la cantidad de turnos entre todos los publicadores aprobados.
 */
export function autoAssignCartShiftsKHS(
  shifts: CartShift[],
  publishers: Publisher[],
  mode: 'fill_vacant' | 'reassign_all' = 'fill_vacant'
): { updatedShifts: CartShift[]; assignedCount: number; familyPairsCount: number } {
  const pool = getEligibleCartPublishers(publishers);
  if (pool.length < 2) {
    return { updatedShifts: shifts, assignedCount: 0, familyPairsCount: 0 };
  }

  const workingShifts: CartShift[] = shifts.map((s) =>
    mode === 'reassign_all'
      ? { ...s, publisher1Id: undefined, publisher2Id: undefined }
      : { ...s }
  );

  // Contabilizar carga actual
  const countMap = new Map<string, number>();
  pool.forEach((p) => countMap.set(p.id, 0));
  workingShifts.forEach((s) => {
    if (s.publisher1Id) countMap.set(s.publisher1Id, (countMap.get(s.publisher1Id) || 0) + 1);
    if (s.publisher2Id) countMap.set(s.publisher2Id, (countMap.get(s.publisher2Id) || 0) + 1);
  });

  const hasConflictInDay = (pubId: string, dayOfWeek: string, currentShiftId: string): boolean => {
    return workingShifts.some(
      (other) =>
        other.id !== currentShiftId &&
        other.dayOfWeek === dayOfWeek &&
        (other.publisher1Id === pubId || other.publisher2Id === pubId)
    );
  };

  let assignedCount = 0;

  workingShifts.forEach((shift) => {
    const availableCandidates = pool.filter(
      (p) =>
        !isPublisherAbsentOnShiftDate(p, shift.date) &&
        isPublisherAvailableOnCartDay(p, shift.dayOfWeek) &&
        !hasConflictInDay(p.id, shift.dayOfWeek, shift.id)
    );

    // Si falta el Publicador 1 pero está el Publicador 2, pasamos P2 a P1 para buscarle pareja compatible
    if (!shift.publisher1Id && shift.publisher2Id) {
      shift.publisher1Id = shift.publisher2Id;
      shift.publisher2Id = undefined;
    }

    // 1. Asignar Publicador 1 si está vacante
    if (!shift.publisher1Id) {
      const sortedForP1 = [...availableCandidates].sort((a, b) => {
        const ca = countMap.get(a.id) || 0;
        const cb = countMap.get(b.id) || 0;
        if (ca !== cb) return ca - cb;
        const aPio = a.pioneerStatus === 'regular' || a.pioneerStatus === 'especial' ? 0 : 1;
        const bPio = b.pioneerStatus === 'regular' || b.pioneerStatus === 'especial' ? 0 : 1;
        return aPio - bPio;
      });

      const chosenP1 = sortedForP1[0];
      if (chosenP1) {
        shift.publisher1Id = chosenP1.id;
        countMap.set(chosenP1.id, (countMap.get(chosenP1.id) || 0) + 1);
        assignedCount++;
      }
    }

    // 2. Asignar Publicador 2 compatible con Publicador 1
    if (shift.publisher1Id && !shift.publisher2Id) {
      const pub1 = publishers.find((p) => p.id === shift.publisher1Id);
      if (pub1) {
        const compatibleCandidates = availableCandidates.filter(
          (cand) => cand.id !== pub1.id && isCompatibleCartPair(pub1, cand)
        );

        compatibleCandidates.sort((a, b) => {
          // Prioridad 1: Compañero fijo de carrito
          const aFixed = isFixedCartPartner(pub1, a) ? 0 : 1;
          const bFixed = isFixedCartPartner(pub1, b) ? 0 : 1;
          if (aFixed !== bFixed) return aFixed - bFixed;

          // Prioridad 2: Matrimonio / Núcleo Familiar KHS
          const aFam = arePublishersFamily(pub1, a) ? 0 : 1;
          const bFam = arePublishersFamily(pub1, b) ? 0 : 1;
          if (aFam !== bFam) return aFam - bFam;

          // Prioridad 3: Menor cantidad de turnos asignados
          const ca = countMap.get(a.id) || 0;
          const cb = countMap.get(b.id) || 0;
          return ca - cb;
        });

        const chosenP2 = compatibleCandidates[0];
        if (chosenP2) {
          shift.publisher2Id = chosenP2.id;
          countMap.set(chosenP2.id, (countMap.get(chosenP2.id) || 0) + 1);
          assignedCount++;
        }
      }
    }
  });

  let familyPairsCount = 0;
  workingShifts.forEach((s) => {
    if (s.publisher1Id && s.publisher2Id) {
      const p1 = publishers.find((p) => p.id === s.publisher1Id);
      const p2 = publishers.find((p) => p.id === s.publisher2Id);
      if (p1 && p2 && (arePublishersFamily(p1, p2) || isFixedCartPartner(p1, p2))) {
        familyPairsCount++;
      }
    }
  });

  return { updatedShifts: workingShifts, assignedCount, familyPairsCount };
}

/**
 * Calcula la matriz de equidad de turnos de carritos por publicador.
 */
export function computeCartEquityMatrix(
  shifts: CartShift[],
  publishers: Publisher[],
  publishersMap: Map<string, Publisher>
): CartPublisherEquityRow[] {
  const eligible = getEligibleCartPublishers(publishers);
  const rowsMap = new Map<string, CartPublisherEquityRow>();

  eligible.forEach((p) => {
    rowsMap.set(p.id, {
      publisher: p,
      isApprovedOrPioneer: Boolean(
        p.roles?.carritos ||
          p.is_cart_approved ||
          p.pioneerStatus === 'regular' ||
          p.pioneerStatus === 'especial'
      ),
      shiftsCount: 0,
      familyShiftsCount: 0,
      daysAssigned: [],
    });
  });

  shifts.forEach((s) => {
    const p1 = s.publisher1Id ? publishersMap.get(s.publisher1Id) : undefined;
    const p2 = s.publisher2Id ? publishersMap.get(s.publisher2Id) : undefined;
    const isFam = Boolean(p1 && p2 && (arePublishersFamily(p1, p2) || isFixedCartPartner(p1, p2)));

    [p1, p2].forEach((pub) => {
      if (!pub) return;
      if (!rowsMap.has(pub.id)) {
        rowsMap.set(pub.id, {
          publisher: pub,
          isApprovedOrPioneer: false,
          shiftsCount: 0,
          familyShiftsCount: 0,
          daysAssigned: [],
        });
      }
      const row = rowsMap.get(pub.id)!;
      row.shiftsCount += 1;
      if (isFam) row.familyShiftsCount += 1;
      const dayLabel = `${s.dayOfWeek.slice(0, 3)} ${s.startTime}`;
      if (!row.daysAssigned.includes(dayLabel)) {
        row.daysAssigned.push(dayLabel);
      }
    });
  });

  return Array.from(rowsMap.values()).sort((a, b) => {
    if (b.shiftsCount !== a.shiftsCount) return b.shiftsCount - a.shiftsCount;
    return a.publisher.name.localeCompare(b.publisher.name);
  });
}

/**
 * Genera mensaje de WhatsApp para recordar a una pareja su turno de exhibidor público.
 */
export function buildCartShiftWhatsAppSlip(
  shift: CartShift,
  location: CartLocation | undefined,
  publishersMap: Map<string, Publisher>,
  congregationName?: string
): string {
  const p1 = shift.publisher1Id ? publishersMap.get(shift.publisher1Id)?.name : 'Por asignar';
  const p2 = shift.publisher2Id ? publishersMap.get(shift.publisher2Id)?.name : 'Por asignar';

  let msg = `🛒 *RECORDATORIO DE TURNO DE EXHIBIDOR PÚBLICO (CARRITO)*\n`;
  msg += `🏛 *Congregación:* ${congregationName || 'Congregación'}\n\n`;
  msg += `📍 *Punto autorizado:* ${location?.name || 'Punto de Exhibidor'}\n`;
  if (location?.address) {
    msg += `🗺 *Dirección:* ${location.address}\n`;
  }
  msg += `📅 *Día y Horario:* ${shift.dayOfWeek}${shift.date ? ` (${shift.date})` : ''} de *${shift.startTime} a ${shift.endTime}*\n`;
  msg += `👥 *Pareja asignada:* *${p1}* y *${p2}*\n`;
  if (shift.notes || location?.notes) {
    msg += `📝 *Instrucciones:* ${shift.notes || location?.notes}\n`;
  }
  msg += `\n_Les agradecemos llegar 10 minutos antes para instalar el exhibidor y verificar las publicaciones._ 🙏`;
  return msg;
}

/**
 * Imprime el Cuadrante Oficial A4 de Predicación Pública con Exhibidores (Carritos)
 * para fijar en el Tablero del Salón del Reino.
 */
export function printCartScheduleA4KHS(
  cartLocations: CartLocation[],
  cartShifts: CartShift[],
  publishersMap: Map<string, Publisher>,
  settings: CongregationSettings
): void {
  const congName = settings.congregationName || 'Congregación';

  const sectionsHtml = cartLocations
    .map((loc) => {
      const locShifts = cartShifts.filter((s) => s.locationId === loc.id);
      if (locShifts.length === 0) return '';

      const rows = locShifts
        .map((s) => {
          const p1 = s.publisher1Id ? publishersMap.get(s.publisher1Id) : undefined;
          const p2 = s.publisher2Id ? publishersMap.get(s.publisher2Id) : undefined;
          const isFam = Boolean(p1 && p2 && arePublishersFamily(p1, p2));

          return `
            <tr>
              <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:12px;color:#0f172a;">
                ${s.dayOfWeek}${s.date ? ` (${s.date})` : ''}
              </td>
              <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:12px;color:#b45309;">
                ${s.startTime} - ${s.endTime}
              </td>
              <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#1e293b;">
                ${p1?.name || '<span style="color:#94a3b8;font-style:italic;">Vacante</span>'}
              </td>
              <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#1e293b;">
                ${p2?.name || '<span style="color:#94a3b8;font-style:italic;">Vacante</span>'}
                ${isFam ? ' <span style="font-size:10px;background:#dcfce7;color:#166534;padding:1px 6px;border-radius:99px;">Familia</span>' : ''}
              </td>
              <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">
                ${s.notes || '—'}
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div style="margin-bottom:16px;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;">
          <div style="background:#78350f;color:#ffffff;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:800;font-size:13px;text-transform:uppercase;">📍 Punto: ${loc.name}</span>
            <span style="font-size:11px;color:#fde68a;">${loc.address || ''}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Día</th>
                <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Horario</th>
                <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Publicador 1</th>
                <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Publicador 2</th>
                <th style="padding:6px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#475569;border-bottom:1px solid #cbd5e1;">Observaciones</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Programa de Predicación Pública con Exhibidores - ${congName}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; }
        </style>
      </head>
      <body>
        <div style="border-bottom:3px solid #78350f;padding-bottom:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div>
            <div style="font-size:18px;font-weight:900;text-transform:uppercase;">Programa de Testimonio Público con Exhibidores (Carritos)</div>
            <div style="font-size:12px;color:#475569;font-weight:600;margin-top:2px;">Congregación ${congName} • Tablero de Información del Salón del Reino</div>
          </div>
          <div style="font-size:11px;font-weight:700;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:6px;">
            Total Turnos: ${cartShifts.length}
          </div>
        </div>
        ${sectionsHtml || '<p>No hay turnos configurados.</p>'}
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
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
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 2000);
    }, 300);
  }
}

/**
 * Radar S-13 de Territorios: Identifica territorios vencidos (> 4 meses), próximos a vencer (15 días)
 * y no abarcados en los últimos 12 meses (prioritarios para campañas o salidas de grupo).
 */
export function evaluateTerritoryS13Radar(territories: Territory[]) {
  const today = new Date();
  const in15Days = new Date();
  in15Days.setDate(today.getDate() + 15);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const overdue: Territory[] = [];
  const expiringSoon: Territory[] = [];
  const unworkedOverYear: Territory[] = [];

  territories.forEach((t) => {
    if (t.status !== 'disponible') {
      const isOver = t.status === 'vencido' || (t.dueDate && new Date(t.dueDate) < today);
      if (isOver) {
        overdue.push(t);
      } else if (t.dueDate && new Date(t.dueDate) <= in15Days) {
        expiringSoon.push(t);
      }
    }

    if (!t.lastCompletedDate || new Date(t.lastCompletedDate) < oneYearAgo) {
      unworkedOverYear.push(t);
    }
  });

  return {
    overdue,
    expiringSoon,
    unworkedOverYear,
  };
}

export function buildOverdueTerritoryWhatsAppReminder(
  territory: Territory,
  assignee: Publisher | undefined,
  congregationName?: string
): string {
  const name = assignee?.name || 'Hermano(a)';
  return (
    `🗺 *RECORDATORIO AMIGABLE DE TERRITORIO (REGISTRO S-13)*\n` +
    `🏛 *Congregación:* ${congregationName || 'Congregación'}\n\n` +
    `Apreciado(a) *${name}*,\n` +
    `Esperamos que te encuentres muy bien. Te escribimos del departamento de territorios para consultar sobre el avance del *Territorio #${territory.number} (${territory.name})*, asignado el *${territory.assignedDate || '—'}* con fecha cumplida de 4 meses el *${territory.dueDate || '—'}*.\n\n` +
    `Por favor confírmanos por este medio:\n` +
    `1️⃣ Si ya fue completado en su totalidad (para anotar la fecha de cierre en el formulario S-13).\n` +
    `2️⃣ O si necesitas unas semanas adicionales o apoyo del grupo de servicio para terminarlo.\n\n` +
    `¡Muchas gracias por tu celo y apoyo para abarcar cabalmente nuestro territorio! 🙏`
  );
}
