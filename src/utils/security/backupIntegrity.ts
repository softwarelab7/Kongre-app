// src/utils/security/backupIntegrity.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).
import { sha256HexSync } from './sha256.ts';

const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const BACKUP_INTEGRITY_SEAL_SALT = 'kongre_backup_integrity_seal_2026_v1';

/**
 * Limpia recursivamente un objeto JSON importado desde un archivo externo:
 * 1. Elimina claves de Prototype Pollution (`__proto__`, `constructor`, `prototype`).
 * 2. Neutraliza vectores de inyección XSS (`<script>`, `javascript:`, `vbscript:`, `data:text/html`, manejadores inline `on*=`) en cadenas.
 */
export function sanitizeImportedBackupObject<T>(input: T, depth = 0): T {
  if (depth > 30 || input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string') {
    const cleaned = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
      .replace(/\bon(error|load|click|mouseover|focus|blur)\s*=/gi, '');
    return cleaned as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeImportedBackupObject(item, depth + 1)) as unknown as T;
  }
  if (typeof input === 'object') {
    const safeObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      if (FORBIDDEN_OBJECT_KEYS.has(key)) continue;
      safeObj[key] = sanitizeImportedBackupObject(value, depth + 1);
    }
    return safeObj as T;
  }
  return input;
}

/**
 * Calcula un sello criptográfico SHA-256 (`kgr_seal_v1_...`) sobre los datos esenciales de un respaldo JSON
 * para detectar cualquier alteración o corrupción antes de restaurarlo.
 */
export function computeBackupIntegritySeal(backupData: Record<string, any>): string {
  try {
    const pubs = Array.isArray(backupData.publishers) ? backupData.publishers : [];
    const weeks = Array.isArray(backupData.weeks) ? backupData.weeks : [];
    const territories = Array.isArray(backupData.territories) ? backupData.territories : [];
    const transactions = Array.isArray(backupData.transactions) ? backupData.transactions : [];
    const pubIds = pubs.map((p: any) => `${p?.id || ''}:${p?.name || ''}:${p?.theocraticRole || ''}`).sort().join(',');
    const weekIds = weeks.map((w: any) => String(w?.id || '')).sort().join(',');
    const congId = String(
      backupData.settings?.congregationNumber ||
      backupData.settings?.congregationId ||
      backupData.congregationName ||
      ''
    ).trim();

    const canonicalPayload = [
      BACKUP_INTEGRITY_SEAL_SALT,
      congId,
      String(pubs.length),
      pubIds,
      String(weeks.length),
      weekIds,
      String(territories.length),
      String(transactions.length),
    ].join('|');

    return `kgr_seal_v1_${sha256HexSync(canonicalPayload)}`;
  } catch {
    return '';
  }
}

/**
 * Verifica el sello criptográfico de integridad de un archivo de respaldo JSON.
 * Si el archivo incluye `integritySeal`, comprueba que coincida exactamente con el contenido actual.
 */
export function verifyBackupIntegritySeal(backupData: Record<string, any>): {
  valid: boolean;
  isSigned: boolean;
} {
  if (!backupData || typeof backupData !== 'object') {
    return { valid: false, isSigned: false };
  }
  const seal = typeof backupData.integritySeal === 'string' ? backupData.integritySeal.trim() : '';
  if (!seal) {
    // Respaldos legados sin firma se permiten tras pasar por sanitizeImportedBackupObject
    return { valid: true, isSigned: false };
  }
  const expected = computeBackupIntegritySeal(backupData);
  return {
    valid: Boolean(expected && seal === expected),
    isSigned: true,
  };
}
