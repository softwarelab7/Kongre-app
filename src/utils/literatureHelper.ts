// src/utils/literatureHelper.ts
import { LiteratureItem, LiteratureSpecialOrder, Publisher } from '../types';

export const LITERATURE_CATEGORY_LABELS: Record<string, { label: string; iconName: string; color: string }> = {
  biblia: { label: 'Biblias', iconName: 'Book', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  libro: { label: 'Libros de Estudio', iconName: 'BookOpen', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  folleto: { label: 'Folletos', iconName: 'FileText', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  tratado: { label: 'Tratados', iconName: 'Bookmark', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  revista: { label: 'Revistas', iconName: 'Layers', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  campana_especial: { label: 'Campaña Especial', iconName: 'Flame', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  otro: { label: 'Otros Artículos', iconName: 'Package', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export const SPECIAL_ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  solicitado: { label: 'Solicitado', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  pedido_a_betel: { label: 'Pedido a Betel', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  recibido_en_salon: { label: 'Recibido en el Salón', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 font-bold' },
  entregado: { label: 'Entregado al Publicador', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelado: { label: 'Cancelado', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
};

/**
 * Builds WhatsApp message notifying a publisher that their special literature order has arrived
 */
export function buildSpecialOrderArrivedWhatsApp(
  order: LiteratureSpecialOrder,
  publisherName: string
): string {
  return (
    `Estimado/a hermano/a *${publisherName}*:\n\n` +
    `Te saludamos con afecto cristiano. Te informamos con alegría que tu *pedido especial de literatura* ya ha llegado al mostrador del Salón del Reino:\n\n` +
    `📖 *Publicación:* ${order.itemTitle}\n` +
    `🔢 *Cantidad:* ${order.quantity} ejemplar(es)\n` +
    (order.language ? `🌐 *Idioma:* ${order.language}\n` : '') +
    `📅 *Fecha de llegada:* ${new Date().toLocaleDateString('es-ES')}\n\n` +
    `Puedes pasar a retirarlo con el siervo o encargado de literatura al concluir la próxima reunión.\n\n` +
    `_Departamento de Literatura — Congregación_`
  );
}

/**
 * Builds WhatsApp summary of low stock items to request to Bethel
 */
export function buildLowStockReportWhatsApp(items: LiteratureItem[]): string {
  const lowStock = items.filter(i => i.currentStock <= i.minimumStock);
  if (lowStock.length === 0) {
    return `📦 *ESTADO DE LITERATURA (S-14)*\n\nTodas las publicaciones cuentan con existencias óptimas por encima del mínimo de seguridad. ¡Excelente provisión!`;
  }

  let text = `⚠️ *PUBLICACIONES CON STOCK BAJO / AGOTADAS (S-14)*\n`;
  text += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;
  text += `Las siguientes publicaciones requieren solicitud en el próximo pedido a la sucursal (Betel):\n\n`;

  lowStock.forEach(item => {
    const isOut = item.currentStock === 0;
    text += `${isOut ? '🔴 *AGOTADO*' : '🟡 *STOCK BAJO*'} [${item.code}] ${item.title}\n`;
    text += `   • Existencias actuales: ${item.currentStock} | Mínimo requerido: ${item.minimumStock}\n`;
    text += `   • Sugerido a pedir: +${Math.max(item.minimumStock * 2 - item.currentStock, 5)} ejemplares\n\n`;
  });

  text += `_Siervo de Literatura / Coordinador de Cuentas_`;
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
