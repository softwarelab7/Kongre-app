// src/services/auditLogService.ts
import { AuditLogEntry } from '../utils/rbac';
import { sha256HexSync, getDeviceEntropySalt } from '../utils/theocraticSecurity';

const LOCAL_STORAGE_AUDIT_LOG_KEY = 'kongre_audit_log_v1';
const LOCAL_STORAGE_AUDIT_CHAIN_SIG_KEY = 'kongre_audit_log_chain_sig_v1';
const AUDIT_CHAIN_SECRET = 'kongre_audit_chain_hmac_2026_v1';
const MAX_LOG_ENTRIES = 500;

/**
 * Sanitiza el identificador del hermano para garantizar que jamás se almacene un PIN en texto plano
 * dentro del registro de auditoría. Salteado con entropía del dispositivo para impedir ataques de tablas arcoíris.
 */
function sanitizeActorNid(rawNid?: string): string {
  if (!rawNid) return 'anonimo';
  const clean = String(rawNid).trim();
  if (!clean) return 'anonimo';
  // Si parece un PIN numérico puro (4 a 8 dígitos) o un PIN estilo XXXX-XXXX, enmascararlo con hash salteado por dispositivo
  if (/^\d{4,8}$/.test(clean) || /^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(clean)) {
    const salt = getDeviceEntropySalt();
    return `id_${sha256HexSync(`${clean}:${salt}:${AUDIT_CHAIN_SECRET}`).slice(0, 10)}`;
  }
  return clean;
}

/**
 * Calcula el hash de integridad encadenado (tipo blockchain ligera) para un registro de auditoría
 */
function computeEntryIntegrityHash(entry: AuditLogEntry, prevHash: string): string {
  const payload = [
    entry.id || '',
    entry.accion || '',
    entry.hermano_nid || '',
    entry.hermano_nombre || '',
    entry.modulo || '',
    entry.fecha || '',
    entry.detalles || '',
    prevHash || 'GENESIS',
    AUDIT_CHAIN_SECRET,
  ].join('|');
  return sha256HexSync(payload);
}

/**
 * Calcula la firma global de la cadena de auditoría actual
 */
function computeChainMasterSignature(entries: AuditLogEntry[]): string {
  if (!entries || entries.length === 0) {
    return sha256HexSync(`EMPTY_CHAIN|${AUDIT_CHAIN_SECRET}`);
  }
  const headHash = entries[0]?.integrityHash || '';
  const tailHash = entries[entries.length - 1]?.integrityHash || '';
  return sha256HexSync(`CHAIN_V1|${entries.length}|${headHash}|${tailHash}|${AUDIT_CHAIN_SECRET}`);
}

/**
 * Asegura que una lista de entradas tenga su cadena criptográfica calculada (migrando entradas legadas de forma transparente)
 */
function ensureHashChain(entries: AuditLogEntry[]): AuditLogEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  // Los registros están ordenados del más reciente (índice 0) al más antiguo (último índice)
  const chronological = [...entries].reverse();
  let prevHash = 'GENESIS';
  const chainedChronological = chronological.map((item) => {
    const cleanNid = sanitizeActorNid(item.hermano_nid);
    const normalized: AuditLogEntry = {
      ...item,
      hermano_nid: cleanNid,
      prevHash,
    };
    const integrityHash = computeEntryIntegrityHash(normalized, prevHash);
    normalized.integrityHash = integrityHash;
    prevHash = integrityHash;
    return normalized;
  });
  return chainedChronological.reverse();
}

export async function insertAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'fecha'> & { id?: string; fecha?: string }
): Promise<boolean> {
  try {
    const currentLogs = await getAuditLog(MAX_LOG_ENTRIES);
    const prevHash = currentLogs.length > 0 && currentLogs[0].integrityHash
      ? currentLogs[0].integrityHash
      : 'GENESIS';

    const newEntry: AuditLogEntry = {
      id: entry.id || `AL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      accion: entry.accion,
      hermano_nid: sanitizeActorNid(entry.hermano_nid),
      hermano_nombre: entry.hermano_nombre || undefined,
      modulo: entry.modulo,
      fecha: entry.fecha || new Date().toISOString(),
      detalles: entry.detalles || undefined,
      prevHash,
    };
    newEntry.integrityHash = computeEntryIntegrityHash(newEntry, prevHash);

    const updated = [newEntry, ...currentLogs].slice(0, MAX_LOG_ENTRIES);

    localStorage.setItem(LOCAL_STORAGE_AUDIT_LOG_KEY, JSON.stringify(updated));
    localStorage.setItem(LOCAL_STORAGE_AUDIT_CHAIN_SIG_KEY, computeChainMasterSignature(updated));

    // Despachar evento para reactividad instantánea en interfaces de auditoría
    window.dispatchEvent(new CustomEvent('kongre_audit_log_updated', { detail: updated }));

    return true;
  } catch (err) {
    console.warn('Aviso al insertar registro de auditoría:', err);
    return false;
  }
}

export async function getAuditLog(limit: number = 200): Promise<AuditLogEntry[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Si alguna entrada legada no tenía integrityHash o tenía un PIN en hermano_nid, migrar cadena automáticamente
      const needsMigration = parsed.some(
        (item) =>
          !item?.integrityHash ||
          /^\d{4,8}$/.test(String(item?.hermano_nid || '').trim())
      );
      if (needsMigration) {
        const migrated = ensureHashChain(parsed);
        localStorage.setItem(LOCAL_STORAGE_AUDIT_LOG_KEY, JSON.stringify(migrated));
        localStorage.setItem(LOCAL_STORAGE_AUDIT_CHAIN_SIG_KEY, computeChainMasterSignature(migrated));
        return migrated.slice(0, limit);
      }
      return parsed.slice(0, limit);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Verifica criptográficamente que ningún registro de auditoría haya sido alterado manualmente en localStorage
 */
export async function verifyAuditLogIntegrity(): Promise<{
  valid: boolean;
  totalEntries: number;
  tamperedCount: number;
}> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_LOG_KEY);
    if (!raw) return { valid: true, totalEntries: 0, tamperedCount: 0 };
    const parsed: AuditLogEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { valid: true, totalEntries: 0, tamperedCount: 0 };
    }

    let tamperedCount = 0;
    const chronological = [...parsed].reverse();

    for (let i = 0; i < chronological.length; i++) {
      const item = chronological[i];
      const expectedPrev = i === 0 ? (item.prevHash || 'GENESIS') : (chronological[i - 1].integrityHash || 'GENESIS');
      const expectedHash = computeEntryIntegrityHash(item, expectedPrev);
      if (item.integrityHash !== expectedHash || (i > 0 && item.prevHash !== expectedPrev)) {
        tamperedCount++;
      }
    }

    const storedMasterSig = localStorage.getItem(LOCAL_STORAGE_AUDIT_CHAIN_SIG_KEY);
    const expectedMasterSig = computeChainMasterSignature(parsed);
    if (storedMasterSig && storedMasterSig !== expectedMasterSig) {
      tamperedCount = Math.max(1, tamperedCount);
    }

    return {
      valid: tamperedCount === 0,
      totalEntries: parsed.length,
      tamperedCount,
    };
  } catch {
    return { valid: false, totalEntries: 0, tamperedCount: 1 };
  }
}

export async function pruneAuditLog(days: number = 30): Promise<number> {
  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const current = await getAuditLog(MAX_LOG_ENTRIES);
    const filtered = current.filter((item) => {
      if (!item.fecha) return false;
      const t = new Date(item.fecha).getTime();
      return t >= cutoff;
    });

    const rechained = ensureHashChain(filtered);
    const removedCount = current.length - rechained.length;
    localStorage.setItem(LOCAL_STORAGE_AUDIT_LOG_KEY, JSON.stringify(rechained));
    localStorage.setItem(LOCAL_STORAGE_AUDIT_CHAIN_SIG_KEY, computeChainMasterSignature(rechained));
    window.dispatchEvent(new CustomEvent('kongre_audit_log_updated', { detail: rechained }));
    return removedCount;
  } catch {
    return 0;
  }
}

export async function clearAuditLog(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_AUDIT_LOG_KEY);
    localStorage.setItem(LOCAL_STORAGE_AUDIT_CHAIN_SIG_KEY, computeChainMasterSignature([]));
    window.dispatchEvent(new CustomEvent('kongre_audit_log_updated', { detail: [] }));
  } catch {}
}
