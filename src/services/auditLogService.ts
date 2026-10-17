// src/services/auditLogService.ts
import { AuditLogEntry } from '../utils/rbac';

const LOCAL_STORAGE_AUDIT_LOG_KEY = 'kongre_audit_log_v1';
const MAX_LOG_ENTRIES = 500;

export async function insertAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'fecha'> & { id?: string; fecha?: string }
): Promise<boolean> {
  try {
    const newEntry: AuditLogEntry = {
      id: entry.id || `AL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      accion: entry.accion,
      hermano_nid: entry.hermano_nid || 'anonimo',
      hermano_nombre: entry.hermano_nombre || undefined,
      modulo: entry.modulo,
      fecha: entry.fecha || new Date().toISOString(),
      detalles: entry.detalles || undefined,
    };

    const currentLogs = await getAuditLog();
    const updated = [newEntry, ...currentLogs].slice(0, MAX_LOG_ENTRIES);

    localStorage.setItem(LOCAL_STORAGE_AUDIT_LOG_KEY, JSON.stringify(updated));

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
      return parsed.slice(0, limit);
    }
    return [];
  } catch {
    return [];
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

    const removedCount = current.length - filtered.length;
    localStorage.setItem(LOCAL_STORAGE_AUDIT_LOG_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('kongre_audit_log_updated', { detail: filtered }));
    return removedCount;
  } catch {
    return 0;
  }
}

export async function clearAuditLog(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_AUDIT_LOG_KEY);
    window.dispatchEvent(new CustomEvent('kongre_audit_log_updated', { detail: [] }));
  } catch {}
}
