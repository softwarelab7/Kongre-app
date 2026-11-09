// src/utils/congregationIdentity.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).

/**
 * Valida de forma estricta si el dispositivo se encuentra legítimamente en modo demostración.
 * Si la congregación activa es una congregación real registrada, el modo demostración queda estrictamente deshabilitado,
 * impidiendo la omisión de bloqueo de pantalla o firmas de seguridad mediante inyección manual en localStorage.
 */
export function isSafeDemoMode(congId?: string | null, isRegistered?: boolean): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawDemo = localStorage.getItem('kongre_demo_mode') === 'true';
    if (!rawDemo) return false;
    const cleanCong = String(
      congId ||
      localStorage.getItem('kongre_congregation_id') ||
      localStorage.getItem('kongre_congregation_number') ||
      ''
    ).trim().toUpperCase();
    const isRegisteredFlag = isRegistered ?? (localStorage.getItem('kongre_is_registered_congregation') === 'true');

    // Si hay una congregación real registrada con ID que no sea DEMO, invalidar demo_mode
    if (isRegisteredFlag && cleanCong && !cleanCong.includes('DEMO') && cleanCong !== '1001') {
      localStorage.removeItem('kongre_demo_mode');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Detecta si una cadena corresponde a un ID o código técnico generado en vez de un nombre oficial de congregación.
 * Por ejemplo: UUIDs ("7f6b7269-3ae2-4185-8cd1-0b3873d79f48"), "ID: 10582", "Congregación #10582", "10582", "KGR-8P2M-7X4W", "CONG_1234", etc.
 */
export function isCongregationIdString(name?: string | null): boolean {
  if (!name || !name.trim()) return false;
  const clean = name.trim();
  const lower = clean.toLowerCase();

  // Exact technical string "id"
  if (lower === 'id' || lower === 'id:' || lower === 'id#-') return true;

  // Formato UUID estándar (8-4-4-4-12 caracteres hexadecimales)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) return true;

  // Identificadores de sistema Cloud / Cloud Run / AI Studio (e.g. ai-studio-kongre-... o ais-...)
  if (/^(ai-studio|ais-dev|ais-pre|applet)[0-9a-z_-]+/i.test(clean)) return true;

  // Código técnico KGR-... o CONG_... con números/códigos largos
  if (/^(kgr|cong)[_-][0-9a-z]{6,}$/i.test(clean)) return true;

  // Hash técnico sin espacios de más de 16 caracteres hexadecimales
  if (!clean.includes(' ') && /^[a-f0-9]{16,}$/i.test(clean)) return true;

  return false;
}

/**
 * Devuelve el nombre amigable y oficial de la congregación para banners y encabezados,
 * garantizando que NUNCA muestre un ID numérico ni un código técnico en su lugar.
 */
export function getFriendlyCongregationName(
  congregationName?: string | null,
  fallback = 'Congregación Central'
): string {
  const localStoredName = typeof window !== 'undefined'
    ? localStorage.getItem('kongre_user_confirmed_name')?.trim() ||
      localStorage.getItem('kongre_congregation_name')?.trim() ||
      ''
    : '';

  const candidateLocal = localStoredName && !isCongregationIdString(localStoredName) && localStoredName !== 'Congregación Central'
    ? localStoredName
    : null;

  if (!congregationName || !congregationName.trim()) {
    return candidateLocal || fallback;
  }
  const clean = congregationName.trim();
  if (isCongregationIdString(clean) || (clean === 'Congregación Central' && candidateLocal)) {
    return candidateLocal || fallback;
  }
  return clean;
}

/**
 * Sanitiza recursivamente cualquier objeto o arreglo antes de enviarlo a Firestore,
 * eliminando todas las propiedades con valor `undefined` tanto en objetos como en elementos de arreglos.
 * Esto previene de forma definitiva el error:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return null as any;
  }

  const deepConvert = (val: any): any => {
    if (val === undefined || val === null) return null;
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) {
      return val
        .filter((item) => item !== undefined)
        .map((item) => deepConvert(item));
    }
    if (typeof val === 'object') {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        if (v !== undefined) {
          result[k] = deepConvert(v);
        }
      }
      return result;
    }
    return val;
  };

  try {
    const preprocessed = deepConvert(data);
    const jsonString = JSON.stringify(preprocessed, (_, value) => {
      if (value === undefined) return null;
      return value;
    });
    if (!jsonString) return null as any;
    return JSON.parse(jsonString);
  } catch (err) {
    console.warn('sanitizeForFirestore fallback:', err);
    return deepConvert(data);
  }
}

/** Alias con nomenclatura moderna neutral e independiente del backend */
export const sanitizeCongregationPayload = sanitizeForFirestore;

export const GENERIC_IDENTITY_NAMES = new Set([
  '',
  'usuario',
  'hermano',
  'coordinador',
  'coordinador / anciano',
  'coordinador del cuerpo de ancianos',
  'hermano de la congregación',
  'hermano autorizado',
  'hno. usuario',
  'anciano',
  'publicador',
]);

export const isGenericIdentityName = (name?: string | null): boolean => {
  if (!name) return true;
  const clean = name.trim().toLowerCase();
  return (
    GENERIC_IDENTITY_NAMES.has(clean) ||
    clean.startsWith('coordinador') ||
    clean.startsWith('hermano de la')
  );
};
