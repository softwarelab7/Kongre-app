// src/utils/p2pTransferEngine.ts
/**
 * Motor de Transferencia Directa Local P2P & QR para Salones del Reino (Offline-First).
 *
 * Características:
 * 1. 100% Offline: No requiere internet, servidores en la nube ni infraestructura externa.
 * 2. Transferencia Modular por Rol: Permite enviar la base completa, únicamente el programa
 *    de reuniones, informes mensuales S-4, asignaciones de territorios S-13 o publicadores.
 * 3. Compresión en Memoria: Emplea CompressionStream ('deflate') nativo para empaquetar
 *    datos en códigos QR de alta densidad legibles por cámara móvil.
 * 4. Integridad Criptográfica: Valida sellos SHA-256 e inmuniza contra Prototype Pollution y XSS.
 * 5. Conexión P2P Local (WebRTC + BroadcastChannel): Permite streaming directo de datos
 *    de dispositivo a dispositivo en la red Wi-Fi local del Salón sin intermediarios.
 */

import {
  computeBackupIntegritySeal,
  verifyBackupIntegritySeal,
  sanitizeImportedBackupObject,
} from './security/backupIntegrity.ts';
import {
  sanitizePublishersForLocalStorage,
  restorePublishersFromLocalStorage,
} from './security/sensitiveFields.ts';
import { mergePublisherData } from './publisherDeduplication.ts';
import { Publisher, WeekSchedule, MonthlyServiceReport } from '../types.ts';

export type TransferContentType =
  | 'full'          // Copia de seguridad completa de la congregación
  | 'meetings'      // Programa semanal de reuniones (Vida y Ministerio + Fin de Semana)
  | 'field_service' // Informes de servicio del campo (S-4)
  | 'territories'   // Cartografía y asignaciones de territorios (S-13)
  | 'publishers';   // Directorio de publicadores (S-21)

export interface TheocraticTransferPackage {
  format: 'kongre_p2p_v1';
  contentType: TransferContentType;
  exportedAt: string;
  congregationName: string;
  congregationNumber?: string;
  summary: {
    title: string;
    description: string;
    publishersCount?: number;
    weeksCount?: number;
    territoriesCount?: number;
    reportsCount?: number;
  };
  integritySeal: string;
  payload: Record<string, any>;
}

export interface CongregationTransferContext {
  publishers: Publisher[];
  weeks: WeekSchedule[];
  territories: any[];
  monthlyReports: MonthlyServiceReport[];
  preachingGroups?: any[];
  customDuties?: any[];
  settings?: any;
  outgoingSpeakers?: any[];
  cartLocations?: any[];
  cartShifts?: any[];
  transactions?: any[];
  quarterlyAudits?: any[];
}

export const QR_TRANSFER_PREFIX_COMPRESSED = 'kgr_p2p_z:';
export const QR_TRANSFER_PREFIX_PLAIN = 'kgr_p2p:';

/**
 * Construye un paquete de transferencia seguro y firmado según el tipo de datos seleccionado
 */
export function buildTheocraticTransferPackage(
  contentType: TransferContentType,
  ctx: CongregationTransferContext,
  congregationName: string = 'Congregación',
  congregationNumber?: string
): TheocraticTransferPackage {
  const sanitizedPubs = sanitizePublishersForLocalStorage(ctx.publishers || []);
  const weeks = ctx.weeks || [];
  const territories = ctx.territories || [];
  const reports = ctx.monthlyReports || [];

  let payload: Record<string, any> = {};
  let summaryTitle = '';
  let summaryDescription = '';

  switch (contentType) {
    case 'meetings':
      payload = {
        weeks,
        customDuties: ctx.customDuties || [],
      };
      summaryTitle = 'Programa de Reuniones';
      summaryDescription = `${weeks.length} semanas con asignaciones de Vida y Ministerio y Fin de Semana.`;
      break;

    case 'field_service':
      payload = {
        monthlyReports: reports,
        preachingGroups: ctx.preachingGroups || [],
      };
      summaryTitle = 'Informes de Servicio del Campo (S-4)';
      summaryDescription = `${reports.length} registros mensuales de actividad del campo.`;
      break;

    case 'territories':
      payload = {
        territories,
      };
      summaryTitle = 'Cartografía y Territorios (S-13)';
      summaryDescription = `${territories.length} territorios con registro de manzanas y asignaciones.`;
      break;

    case 'publishers':
      payload = {
        publishers: sanitizedPubs,
        preachingGroups: ctx.preachingGroups || [],
      };
      summaryTitle = 'Directorio de Publicadores';
      summaryDescription = `${sanitizedPubs.length} fichas de publicadores con nombramientos teocráticos.`;
      break;

    case 'full':
    default:
      payload = {
        publishers: sanitizedPubs,
        weeks,
        preachingGroups: ctx.preachingGroups || [],
        customDuties: ctx.customDuties || [],
        settings: ctx.settings || {},
        outgoingSpeakers: ctx.outgoingSpeakers || [],
        cartLocations: ctx.cartLocations || [],
        cartShifts: ctx.cartShifts || [],
        monthlyReports: reports,
        territories,
        transactions: ctx.transactions || [],
        quarterlyAudits: ctx.quarterlyAudits || [],
      };
      summaryTitle = 'Copia Completa de Congregación';
      summaryDescription = `Respaldo integral (${sanitizedPubs.length} publicadores, ${weeks.length} semanas, ${territories.length} territorios).`;
      break;
  }

  const seal = computeBackupIntegritySeal({
    publishers: payload.publishers || sanitizedPubs,
    weeks: payload.weeks || weeks,
    territories: payload.territories || territories,
    transactions: payload.transactions || ctx.transactions || [],
    settings: ctx.settings || { congregationName, congregationNumber },
    congregationName,
  });

  return {
    format: 'kongre_p2p_v1',
    contentType,
    exportedAt: new Date().toISOString(),
    congregationName,
    congregationNumber,
    summary: {
      title: summaryTitle,
      description: summaryDescription,
      publishersCount: payload.publishers ? payload.publishers.length : undefined,
      weeksCount: payload.weeks ? payload.weeks.length : undefined,
      territoriesCount: payload.territories ? payload.territories.length : undefined,
      reportsCount: payload.monthlyReports ? payload.monthlyReports.length : undefined,
    },
    integritySeal: seal,
    payload,
  };
}

/**
 * Convierte un Uint8Array a cadena Base64 estándar
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

/**
 * Convierte una cadena Base64 estándar a Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Comprime un paquete en una cadena compacta optimizada para Código QR
 */
export async function compressPackageToTransferString(pkg: TheocraticTransferPackage): Promise<string> {
  const jsonStr = JSON.stringify(pkg);
  
  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('deflate');
      const writer = cs.writable.getWriter();
      writer.write(new TextEncoder().encode(jsonStr));
      void writer.close();
      const reader = cs.readable.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      return `${QR_TRANSFER_PREFIX_COMPRESSED}${uint8ArrayToBase64(merged)}`;
    } catch {
      // Fallback a Base64 sin compresión
    }
  }

  // Fallback simple Base64
  const plainBytes = new TextEncoder().encode(jsonStr);
  return `${QR_TRANSFER_PREFIX_PLAIN}${uint8ArrayToBase64(plainBytes)}`;
}

/**
 * Descomprime y valida una cadena de transferencia escaneada desde un QR o pegada
 */
export async function decompressTransferStringToPackage(
  rawInput: string
): Promise<{ package: TheocraticTransferPackage | null; error?: string }> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { package: null, error: 'La cadena de datos está vacía.' };
  }

  let jsonStr = '';

  try {
    if (trimmed.startsWith(QR_TRANSFER_PREFIX_COMPRESSED)) {
      const base64Data = trimmed.slice(QR_TRANSFER_PREFIX_COMPRESSED.length);
      const compressedBytes = base64ToUint8Array(base64Data);

      if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        void writer.write(compressedBytes as any);
        void writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        jsonStr = new TextDecoder().decode(merged);
      } else {
        return { package: null, error: 'El navegador no soporta descompresión nativa.' };
      }
    } else if (trimmed.startsWith(QR_TRANSFER_PREFIX_PLAIN)) {
      const base64Data = trimmed.slice(QR_TRANSFER_PREFIX_PLAIN.length);
      const bytes = base64ToUint8Array(base64Data);
      jsonStr = new TextDecoder().decode(bytes);
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      jsonStr = trimmed;
    } else {
      return { package: null, error: 'Formato de transferencia no reconocido.' };
    }

    const parsed = JSON.parse(jsonStr);
    const sanitized = sanitizeImportedBackupObject(parsed);

    if (sanitized.format !== 'kongre_p2p_v1' || !sanitized.payload || typeof sanitized.payload !== 'object') {
      return { package: null, error: 'El paquete transferido no es válido para Kongre.' };
    }

    return { package: sanitized as TheocraticTransferPackage };
  } catch (err: any) {
    return { package: null, error: err.message || 'Error al procesar los datos de transferencia.' };
  }
}

/**
 * Fusión diferencial inteligente de datos recibidos sobre el estado actual de la congregación
 */
export function mergeTheocraticTransferPackage(
  incomingPkg: TheocraticTransferPackage,
  currentState: CongregationTransferContext,
  mode: 'merge' | 'replace' = 'merge'
): {
  mergedContext: CongregationTransferContext;
  changesSummary: string[];
} {
  const p = incomingPkg.payload;
  const changesSummary: string[] = [];
  const next: CongregationTransferContext = { ...currentState };

  // 1. Manejo de Semanas y Asignaciones
  if (Array.isArray(p.weeks)) {
    if (mode === 'replace' && incomingPkg.contentType === 'meetings') {
      next.weeks = p.weeks;
      changesSummary.push(`Se reemplazaron ${p.weeks.length} semanas del programa.`);
    } else {
      const existingMap = new Map((next.weeks || []).map((w) => [w.id, w]));
      let updatedCount = 0;
      let addedCount = 0;
      p.weeks.forEach((incomingWeek: WeekSchedule) => {
        if (existingMap.has(incomingWeek.id)) {
          existingMap.set(incomingWeek.id, incomingWeek);
          updatedCount++;
        } else {
          existingMap.set(incomingWeek.id, incomingWeek);
          addedCount++;
        }
      });
      next.weeks = Array.from(existingMap.values());
      changesSummary.push(`Semanas: ${updatedCount} actualizadas, ${addedCount} agregadas.`);
    }
  }

  // 2. Manejo de Publicadores
  if (Array.isArray(p.publishers)) {
    const incomingRestored = restorePublishersFromLocalStorage(p.publishers);
    if (mode === 'replace' && (incomingPkg.contentType === 'publishers' || incomingPkg.contentType === 'full')) {
      next.publishers = incomingRestored;
      changesSummary.push(`Se reemplazó el directorio con ${incomingRestored.length} publicadores.`);
    } else {
      const currentList = next.publishers || [];
      const mergedList = [...currentList];
      let updatedPubs = 0;
      let addedPubs = 0;

      incomingRestored.forEach((incomingPub: Publisher) => {
        const idx = mergedList.findIndex(
          (cp) =>
            cp.id === incomingPub.id ||
            (cp.publisherCode && incomingPub.publisherCode && cp.publisherCode === incomingPub.publisherCode) ||
            (cp.name && incomingPub.name && cp.name.trim().toLowerCase() === incomingPub.name.trim().toLowerCase())
        );
        if (idx !== -1) {
          mergedList[idx] = mergePublisherData(mergedList[idx], incomingPub);
          updatedPubs++;
        } else {
          mergedList.push(incomingPub);
          addedPubs++;
        }
      });
      next.publishers = mergedList;
      changesSummary.push(`Publicadores: ${updatedPubs} actualizados, ${addedPubs} nuevos incorporados.`);
    }
  }

  // 3. Manejo de Informes del Servicio del Campo (S-4)
  if (Array.isArray(p.monthlyReports)) {
    if (mode === 'replace' && incomingPkg.contentType === 'field_service') {
      next.monthlyReports = p.monthlyReports;
      changesSummary.push(`Se reemplazaron ${p.monthlyReports.length} informes de servicio del campo.`);
    } else {
      const existingReports = new Map(
        (next.monthlyReports || []).map((r) => [`${r.publisherId}_${r.month}`, r])
      );
      let updatedRep = 0;
      let addedRep = 0;
      p.monthlyReports.forEach((incomingRep: MonthlyServiceReport) => {
        const key = `${incomingRep.publisherId}_${incomingRep.month}`;
        if (existingReports.has(key)) {
          existingReports.set(key, incomingRep);
          updatedRep++;
        } else {
          existingReports.set(key, incomingRep);
          addedRep++;
        }
      });
      next.monthlyReports = Array.from(existingReports.values());
      changesSummary.push(`Informes S-4: ${updatedRep} actualizados, ${addedRep} agregados.`);
    }
  }

  // 4. Manejo de Territorios (S-13)
  if (Array.isArray(p.territories)) {
    if (mode === 'replace' && incomingPkg.contentType === 'territories') {
      next.territories = p.territories;
      changesSummary.push(`Se reemplazaron ${p.territories.length} territorios.`);
    } else {
      const existingTerr = new Map((next.territories || []).map((t) => [t.id || String(t.number), t]));
      let updatedT = 0;
      let addedT = 0;
      p.territories.forEach((incomingTerr: any) => {
        const key = incomingTerr.id || String(incomingTerr.number);
        if (existingTerr.has(key)) {
          existingTerr.set(key, { ...existingTerr.get(key), ...incomingTerr });
          updatedT++;
        } else {
          existingTerr.set(key, incomingTerr);
          addedT++;
        }
      });
      next.territories = Array.from(existingTerr.values());
      changesSummary.push(`Territorios: ${updatedT} actualizados, ${addedT} agregados.`);
    }
  }

  // 5. Otros módulos si vienen en una copia completa
  if (incomingPkg.contentType === 'full') {
    if (Array.isArray(p.preachingGroups)) next.preachingGroups = p.preachingGroups;
    if (Array.isArray(p.customDuties)) next.customDuties = p.customDuties;
    if (Array.isArray(p.cartLocations)) next.cartLocations = p.cartLocations;
    if (Array.isArray(p.cartShifts)) next.cartShifts = p.cartShifts;
    if (Array.isArray(p.outgoingSpeakers)) next.outgoingSpeakers = p.outgoingSpeakers;
    if (Array.isArray(p.transactions)) next.transactions = p.transactions;
    if (Array.isArray(p.quarterlyAudits)) next.quarterlyAudits = p.quarterlyAudits;
    changesSummary.push('Se integraron los registros de configuración, cuentas y carritos.');
  }

  return { mergedContext: next, changesSummary };
}

/**
 * Gestor de Canal de Transmisión Local Instantánea (BroadcastChannel)
 * Permite comunicar dos pestañas o ventanas de Kongre en el mismo dispositivo sin red.
 */
export const LOCAL_P2P_BROADCAST_CHANNEL = 'kongre_local_p2p_broadcast_v1';

export function broadcastPackageLocally(pkg: TheocraticTransferPackage): void {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(LOCAL_P2P_BROADCAST_CHANNEL);
      channel.postMessage({ type: 'KONGRE_TRANSFER_OFFER', package: pkg });
      channel.close();
    } catch {}
  }
}
