// src/utils/literatureHelper.ts
import {
  LiteratureItem,
  LiteratureSpecialOrder,
  LiteratureGroupDistribution,
  LiteratureInventoryRecord,
  Publisher,
  PreachingGroup,
  CongregationSettings,
} from '../types';

export const LITERATURE_CATEGORY_LABELS: Record<
  string,
  { label: string; iconName: string; color: string }
> = {
  biblia: {
    label: 'Biblias',
    iconName: 'Book',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  libro: {
    label: 'Libros de Estudio',
    iconName: 'BookOpen',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  folleto: {
    label: 'Folletos',
    iconName: 'FileText',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  tratado: {
    label: 'Tratados',
    iconName: 'Bookmark',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  revista: {
    label: 'Revistas',
    iconName: 'Layers',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  campana_especial: {
    label: 'Campaña Especial',
    iconName: 'Flame',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  otro: {
    label: 'Otros Artículos',
    iconName: 'Package',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export const SPECIAL_ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  solicitado: {
    label: 'Solicitado',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  pedido_a_betel: {
    label: 'Pedido a Sucursal',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  recibido_en_salon: {
    label: 'Recibido en el Salón',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 font-bold',
  },
  entregado: {
    label: 'Entregado al Publicador',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
};

/**
 * Opens a WhatsApp URL safely via an anchor element without calling window.open
 */
export function openSafeWhatsAppUrl(text: string, phone?: string): void {
  const encoded = encodeURIComponent(text);
  let url = `https://wa.me/?text=${encoded}`;
  if (phone) {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone) {
      url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    }
  }
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface GroupSpecialOrdersSummary {
  groupNumber: number;
  groupName: string;
  overseerName: string;
  overseerPhone?: string;
  totalOrders: number;
  pendingCount: number;
  readyToDeliverCount: number;
  deliveredCount: number;
  orders: Array<{
    order: LiteratureSpecialOrder;
    publisherName: string;
    publisherPhone?: string;
  }>;
}

export interface LiteratureInventoryAnalysis {
  totalTitles: number;
  totalUnits: number;
  outOfStockItems: LiteratureItem[];
  lowStockItems: LiteratureItem[];
  optimalItems: LiteratureItem[];
  suggestedReorderList: Array<{
    item: LiteratureItem;
    deficit: number;
    suggestedOrderQty: number;
  }>;
  categoryTotals: Array<{
    category: string;
    label: string;
    titlesCount: number;
    unitsCount: number;
    lowCount: number;
  }>;
  ordersByGroup: GroupSpecialOrdersSummary[];
}

/**
 * Computes comprehensive S-28 / S-14 inventory analytics and groups special orders by Preaching Group
 */
export function computeLiteratureInventoryAnalysis(
  items: LiteratureItem[],
  specialOrders: LiteratureSpecialOrder[],
  publishers: Publisher[],
  preachingGroups: PreachingGroup[]
): LiteratureInventoryAnalysis {
  const pubMap = new Map<string, Publisher>();
  publishers.forEach(p => pubMap.set(p.id, p));

  const outOfStockItems = items.filter(i => (i.currentStock || 0) === 0);
  const lowStockItems = items.filter(
    i => (i.currentStock || 0) > 0 && (i.currentStock || 0) <= (i.minimumStock || 0)
  );
  const optimalItems = items.filter(i => (i.currentStock || 0) > (i.minimumStock || 0));

  const suggestedReorderList = items
    .filter(i => (i.currentStock || 0) <= (i.minimumStock || 0))
    .map(item => {
      const current = item.currentStock || 0;
      const min = Math.max(item.minimumStock || 5, 1);
      const deficit = Math.max(0, min - current);
      const suggestedOrderQty = Math.max(min * 2 - current, 5);
      return {
        item,
        deficit,
        suggestedOrderQty,
      };
    })
    .sort((a, b) => a.item.currentStock - b.item.currentStock);

  const categoriesOrder = [
    'biblia',
    'libro',
    'folleto',
    'tratado',
    'revista',
    'campana_especial',
    'otro',
  ];

  const categoryTotals = categoriesOrder.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    return {
      category: cat,
      label: LITERATURE_CATEGORY_LABELS[cat]?.label || cat,
      titlesCount: catItems.length,
      unitsCount: catItems.reduce((acc, i) => acc + (i.currentStock || 0), 0),
      lowCount: catItems.filter(i => (i.currentStock || 0) <= (i.minimumStock || 0)).length,
    };
  });

  // Group Special Orders by Preaching Group
  const ordersByGroup: GroupSpecialOrdersSummary[] = preachingGroups.map(group => {
    const overseer = group.overseerId ? pubMap.get(group.overseerId) : undefined;
    const groupOrders = specialOrders
      .filter(o => {
        const pub = pubMap.get(o.publisherId);
        return pub?.groupNumber === group.number || group.memberIds.includes(o.publisherId);
      })
      .map(order => {
        const pub = pubMap.get(order.publisherId);
        return {
          order,
          publisherName: pub?.name || 'Publicador',
          publisherPhone: pub?.phone,
        };
      });

    return {
      groupNumber: group.number,
      groupName: group.name || `Grupo ${group.number}`,
      overseerName: overseer?.name || 'Por asignar',
      overseerPhone: overseer?.phone,
      totalOrders: groupOrders.length,
      pendingCount: groupOrders.filter(
        x => x.order.status === 'solicitado' || x.order.status === 'pedido_a_betel'
      ).length,
      readyToDeliverCount: groupOrders.filter(
        x => x.order.status === 'recibido_en_salon'
      ).length,
      deliveredCount: groupOrders.filter(x => x.order.status === 'entregado').length,
      orders: groupOrders,
    };
  });

  return {
    totalTitles: items.length,
    totalUnits: items.reduce((acc, i) => acc + (i.currentStock || 0), 0),
    outOfStockItems,
    lowStockItems,
    optimalItems,
    suggestedReorderList,
    categoryTotals,
    ordersByGroup,
  };
}

/**
 * Builds WhatsApp message notifying a publisher that their special literature order has arrived
 */
export function buildSpecialOrderArrivedWhatsApp(
  order: LiteratureSpecialOrder,
  publisherName: string
): string {
  return (
    `Estimado/a hermano/a *${publisherName}*:\n\n` +
    `Te saludamos con afecto cristiano. Te informamos con alegría que tu *solicitud especial de literatura* ya ha llegado al mostrador del Salón del Reino:\n\n` +
    `📖 *Publicación:* ${order.itemTitle}\n` +
    `🔢 *Cantidad:* ${order.quantity} ejemplar(es)\n` +
    (order.language ? `🌐 *Idioma:* ${order.language}\n` : '') +
    `📅 *Fecha de aviso:* ${new Date().toLocaleDateString('es-ES')}\n\n` +
    `Puedes pasar a retirarlo en el mostrador de literatura al concluir la próxima reunión.\n\n` +
    `_Departamento de Literatura — Congregación_`
  );
}

/**
 * Builds WhatsApp summary of special orders for a Preaching Group Overseer
 */
export function buildGroupSpecialOrdersWhatsApp(
  summary: GroupSpecialOrdersSummary
): string {
  const activeOrders = summary.orders.filter(
    x => x.order.status !== 'entregado' && x.order.status !== 'cancelado'
  );

  let text = `📚 *PEDIDOS ESPECIALES DE LITERATURA — GRUPO ${summary.groupNumber}*\n`;
  text += `👤 *Superintendente de Grupo:* ${summary.overseerName}\n`;
  text += `📅 *Fecha:* ${new Date().toLocaleDateString('es-ES')}\n\n`;

  if (activeOrders.length === 0) {
    text += `✅ Actualmente todos los pedidos especiales de los publicadores de su grupo han sido entregados.\n`;
    return text;
  }

  const ready = activeOrders.filter(x => x.order.status === 'recibido_en_salon');
  const waiting = activeOrders.filter(x => x.order.status !== 'recibido_en_salon');

  if (ready.length > 0) {
    text += `🟢 *LISTOS PARA RETIRAR EN MOSTRADOR (${ready.length}):*\n`;
    ready.forEach(entry => {
      text += `• *${entry.publisherName}*: ${entry.order.itemTitle} (${entry.order.quantity} ej.)\n`;
    });
    text += `\n`;
  }

  if (waiting.length > 0) {
    text += `⏳ *EN TRÁMITE / PEDIDOS A SUCURSAL (${waiting.length}):*\n`;
    waiting.forEach(entry => {
      const statusLabel =
        SPECIAL_ORDER_STATUS_CONFIG[entry.order.status]?.label || entry.order.status;
      text += `• *${entry.publisherName}*: ${entry.order.itemTitle} (${entry.order.quantity} ej.) — _${statusLabel}_\n`;
    });
    text += `\n`;
  }

  text += `Agradecemos su apoyo recordando a los hermanos retirar sus publicaciones disponibles en el mostrador del Salón del Reino.`;
  return text;
}

/**
 * Builds WhatsApp summary of low stock items to request to Branch (S-14)
 */
export function buildLowStockReportWhatsApp(items: LiteratureItem[]): string {
  const lowStock = items.filter(i => i.currentStock <= i.minimumStock);
  if (lowStock.length === 0) {
    return `📦 *INVENTARIO DE LITERATURA (S-28 / S-14)*\n\nTodas las publicaciones cuentan con existencias óptimas por encima del mínimo de seguridad. ¡Excelente provisión!`;
  }

  let text = `⚠️ *SOLICITUD SUGERIDA DE LITERATURA (S-14 / S-28)*\n`;
  text += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
  text += `Las siguientes publicaciones se encuentran agotadas o bajo el stock mínimo y requieren incluirse en el próximo pedido a la sucursal:\n\n`;

  lowStock.forEach(item => {
    const isOut = item.currentStock === 0;
    const suggested = Math.max(item.minimumStock * 2 - item.currentStock, 5);
    text += `${isOut ? '🔴 *AGOTADO*' : '🟡 *STOCK BAJO*'} [${item.code}] ${item.title} (${item.language})\n`;
    text += `   • Existencia actual: ${item.currentStock} | Mínimo: ${item.minimumStock}\n`;
    text += `   • Cantidad sugerida a pedir: *+${suggested} ejemplares*\n\n`;
  });

  text += `_Departamento de Literatura — Congregación_`;
  return text;
}

/**
 * Builds WhatsApp message for preaching group monthly magazine distribution
 */
export function buildGroupDistributionWhatsApp(
  groupNumber: number,
  magazinesCount: number,
  tractsCount: number,
  overseerName?: string
): string {
  return (
    `📦 *LITERATURA Y REVISTAS — GRUPO ${groupNumber}*\n` +
    (overseerName ? `👤 *Superintendente:* ${overseerName}\n\n` : '\n') +
    `Se han preparado los paquetes de predicación para el grupo en el mostrador del Salón:\n\n` +
    `📰 *Revistas La Atalaya y ¡Despertad!:* ${magazinesCount} ejemplares\n` +
    `📑 *Tratados de contacto:* ${tractsCount} ejemplares\n\n` +
    `Agradecemos retirarlos para su distribución a los publicadores en las salidas al servicio del campo.`
  );
}

/**
 * Prints the official Monthly Literature Inventory (S-28) & Special Orders Register (S-14) in A4 format via hidden iframe
 */
export function printLiteratureInventoryS28A4(params: {
  settings: CongregationSettings;
  items: LiteratureItem[];
  specialOrders: LiteratureSpecialOrder[];
  groupDistributions: LiteratureGroupDistribution[];
  inventoryRecords: LiteratureInventoryRecord[];
  publishers: Publisher[];
  preachingGroups: PreachingGroup[];
}): void {
  const {
    settings,
    items,
    specialOrders,
    groupDistributions,
    inventoryRecords,
    publishers,
    preachingGroups,
  } = params;

  const analysis = computeLiteratureInventoryAnalysis(
    items,
    specialOrders,
    publishers,
    preachingGroups
  );

  const pubMap = new Map<string, Publisher>();
  publishers.forEach(p => pubMap.set(p.id, p));

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const latestRecord = inventoryRecords[0];
  const latestServant = latestRecord?.servantPublisherId
    ? pubMap.get(latestRecord.servantPublisherId)?.name
    : undefined;
  const latestOverseer = latestRecord?.overseerPublisherId
    ? pubMap.get(latestRecord.overseerPublisherId)?.name
    : undefined;

  const itemRowsHtml = items
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category) || a.code.localeCompare(b.code))
    .map((item, idx) => {
      const catLabel = LITERATURE_CATEGORY_LABELS[item.category]?.label || item.category;
      const isOut = item.currentStock === 0;
      const isLow = item.currentStock > 0 && item.currentStock <= item.minimumStock;
      const statusText = isOut ? 'AGOTADO' : isLow ? 'STOCK BAJO' : 'ÓPTIMO';
      const statusColor = isOut ? '#be123c' : isLow ? '#b45309' : '#047857';
      const suggested =
        item.currentStock <= item.minimumStock
          ? `+${Math.max(item.minimumStock * 2 - item.currentStock, 5)}`
          : '—';

      return `
        <tr>
          <td style="text-align:center; font-weight:700;">${idx + 1}</td>
          <td style="font-family:monospace; font-weight:700;">${item.code}</td>
          <td>
            <strong>${item.title}</strong>
            ${item.notes ? `<div style="font-size:9px; color:#52525b;">${item.notes}</div>` : ''}
          </td>
          <td style="text-align:center;">${catLabel}</td>
          <td style="text-align:center;">${item.language}</td>
          <td style="text-align:center;">${item.locationBox || 'Mostrador'}</td>
          <td style="text-align:center; font-weight:700;">${item.currentStock}</td>
          <td style="text-align:center;">${item.minimumStock}</td>
          <td style="text-align:center; color:${statusColor}; font-weight:700; font-size:9px;">${statusText}</td>
          <td style="text-align:center; font-weight:700;">${suggested}</td>
          <td style="text-align:center;">☐ ______</td>
        </tr>
      `;
    })
    .join('');

  const activeOrders = specialOrders.filter(o => o.status !== 'cancelado');
  const ordersRowsHtml =
    activeOrders.length > 0
      ? activeOrders
          .map((o, idx) => {
            const pub = pubMap.get(o.publisherId);
            const groupLabel = pub?.groupNumber ? `G${pub.groupNumber}` : '—';
            const statusLabel = SPECIAL_ORDER_STATUS_CONFIG[o.status]?.label || o.status;
            return `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><strong>${pub?.name || 'Publicador'}</strong></td>
                <td style="text-align:center; font-weight:700;">${groupLabel}</td>
                <td>${o.itemTitle}</td>
                <td style="text-align:center;">${o.language || 'Español'}</td>
                <td style="text-align:center; font-weight:700;">${o.quantity}</td>
                <td style="text-align:center;">${o.requestDate}</td>
                <td style="text-align:center; font-weight:700;">${statusLabel}</td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="8" style="text-align:center; padding:10px; color:#71717a;">No hay solicitudes especiales registradas.</td></tr>`;

  const groupsRowsHtml = preachingGroups
    .map(g => {
      const dist = groupDistributions.find(d => d.groupNumber === g.number);
      const overseer = g.overseerId ? pubMap.get(g.overseerId)?.name : 'Por asignar';
      return `
        <tr>
          <td style="text-align:center; font-weight:700;">Grupo ${g.number}</td>
          <td>${g.name}</td>
          <td>${overseer || 'Por asignar'}</td>
          <td style="text-align:center; font-weight:700;">${dist?.magazinesCount ?? 25}</td>
          <td style="text-align:center; font-weight:700;">${dist?.tractsCount ?? 50}</td>
          <td style="text-align:center; font-weight:700;">${dist?.brochuresCount ?? 10}</td>
          <td style="text-align:center;">☐ Entregado</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Inventario de Literatura S-28 / S-14 - ${settings.congregationName || 'Congregación'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #18181b;
          margin: 0;
          padding: 0;
          font-size: 10.5px;
          line-height: 1.35;
        }
        .header {
          border-bottom: 2.5px solid #1e1b4b;
          padding-bottom: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-title {
          font-size: 16px;
          font-weight: 900;
          text-transform: uppercase;
          color: #1e1b4b;
          letter-spacing: 0.4px;
        }
        .header-sub {
          font-size: 11px;
          font-weight: 700;
          color: #3f3f46;
          margin-top: 2px;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .kpi-box {
          border: 1px solid #d4d4d8;
          border-radius: 6px;
          padding: 6px 10px;
          background: #fafafa;
        }
        .kpi-label {
          font-size: 8.5px;
          text-transform: uppercase;
          font-weight: 800;
          color: #52525b;
        }
        .kpi-val {
          font-size: 15px;
          font-weight: 900;
          color: #18181b;
          margin-top: 2px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          background: #1e1b4b;
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 12px 0 6px 0;
          letter-spacing: 0.4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th, td {
          border: 1px solid #a1a1aa;
          padding: 4px 6px;
          font-size: 9.5px;
        }
        th {
          background: #f4f4f5;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 8.5px;
          color: #27272a;
        }
        .signatures {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: center;
          page-break-inside: avoid;
        }
        .sig-line {
          border-top: 1px solid #18181b;
          padding-top: 4px;
          margin-top: 28px;
          font-weight: 700;
          font-size: 9.5px;
        }
        .sig-sub {
          font-size: 8.5px;
          color: #52525b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="header-title">Inventario Mensual de Literatura (S-28) y Pedidos (S-14)</div>
          <div class="header-sub">
            ${settings.congregationName || 'Congregación Local'}
            ${settings.circuitNumber ? ` • Circuito ${settings.circuitNumber}` : ''}
          </div>
        </div>
        <div style="text-align:right; font-size:9.5px; color:#3f3f46;">
          <div><strong>Fecha de Emisión:</strong> ${todayFormatted}</div>
          <div><strong>Último Recuento:</strong> ${latestRecord?.countDate || 'En curso'}</div>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-label">Publicaciones en Catálogo</div>
          <div class="kpi-val">${analysis.totalTitles} títulos</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Existencia Total Física</div>
          <div class="kpi-val">${analysis.totalUnits} ejemplares</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Stock Bajo / Agotados</div>
          <div class="kpi-val">${analysis.outOfStockItems.length + analysis.lowStockItems.length} ítems</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Solicitudes Especiales Activas</div>
          <div class="kpi-val">${activeOrders.filter(o => o.status !== 'entregado').length} pedidos</div>
        </div>
      </div>

      <div class="section-title">1. Registro de Existencias y Movimiento Mensual (Formulario S-28)</div>
      <table>
        <thead>
          <tr>
            <th style="width:24px;">#</th>
            <th style="width:52px;">Código</th>
            <th>Publicación</th>
            <th style="width:72px;">Categoría</th>
            <th style="width:58px;">Idioma</th>
            <th style="width:74px;">Ubicación</th>
            <th style="width:46px;">Stock</th>
            <th style="width:42px;">Mín.</th>
            <th style="width:62px;">Estado</th>
            <th style="width:52px;">Pedir</th>
            <th style="width:68px;">Verificación</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <div class="section-title">2. Solicitudes Especiales de Publicadores (Formulario S-14)</div>
      <table>
        <thead>
          <tr>
            <th style="width:24px;">#</th>
            <th>Publicador Solicitante</th>
            <th style="width:45px;">Grupo</th>
            <th>Publicación Solicitada</th>
            <th style="width:60px;">Idioma</th>
            <th style="width:40px;">Cant.</th>
            <th style="width:68px;">Fecha Solicitud</th>
            <th style="width:95px;">Estado Actual</th>
          </tr>
        </thead>
        <tbody>
          ${ordersRowsHtml}
        </tbody>
      </table>

      <div class="section-title">3. Distribución Periódica por Grupos de Predicación</div>
      <table>
        <thead>
          <tr>
            <th style="width:65px;">Grupo</th>
            <th>Nombre / Sector</th>
            <th>Superintendente de Grupo</th>
            <th style="width:65px;">Revistas</th>
            <th style="width:65px;">Tratados</th>
            <th style="width:65px;">Folletos</th>
            <th style="width:85px;">Control de Entrega</th>
          </tr>
        </thead>
        <tbody>
          ${groupsRowsHtml}
        </tbody>
      </table>

      <div class="signatures">
        <div>
          <div class="sig-line">${latestServant || 'Siervo de Literatura'}</div>
          <div class="sig-sub">Encargado / Siervo de Literatura</div>
        </div>
        <div>
          <div class="sig-line">${latestOverseer || 'Superintendente de Servicio'}</div>
          <div class="sig-sub">Superintendente de Servicio</div>
        </div>
        <div>
          <div class="sig-line">${settings.coordinatorName || 'Coordinador del Cuerpo de Ancianos'}</div>
          <div class="sig-sub">Coordinador del Cuerpo de Ancianos</div>
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
