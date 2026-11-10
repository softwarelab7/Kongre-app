/**
 * src/services/syncApi.ts
 * Cliente de la Edge Function `kongre-sync`.
 *
 * El navegador ya NO accede a la tabla sync_queue. Para cada operación envía "tokens de
 * autenticación" derivados del PIN (PBKDF2 con una sal distinta de la usada para cifrar), nunca el PIN.
 * El servidor valida el token, limita los intentos y decide qué nivel de datos devuelve.
 */
import { SUPABASE_URL } from '../lib/supabase';
import { normalizePin, normalizePinV2, isLegacyPinFormat } from '../utils/crypto';

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/kongre-sync`;
export const AUTH_ITERATIONS = 600_000;
export const AUTH_ITERATIONS_LEGACY = 100_000;

export type SyncRole = 'master' | 'public';

export interface SyncTokens {
  master?: string;
  public?: string;
  master_legacy?: string;
  public_legacy?: string;
}

export type SyncResult<T> =
  | ({ ok: true } & T)
  | { ok: false; status: number; error: string; retryAfter?: number; current_version?: string };

const tokenCache = new Map<string, string>();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Token de autenticación determinista: PBKDF2-SHA256(PIN normalizado, sal = rol|congregación). */
export async function deriveAuthToken(
  pin: string,
  congregationId: string,
  role: SyncRole,
  legacy: boolean = false,
  iterations: number = legacy ? AUTH_ITERATIONS_LEGACY : AUTH_ITERATIONS
): Promise<string> {
  const cleanPin = legacy ? normalizePin(pin) : normalizePinV2(pin);
  const cacheKey = `${role}|${congregationId}|${iterations}|${legacy ? 'leg:' : 'v2:'}${cleanPin}`;
  const cached = tokenCache.get(cacheKey);
  if (cached) return cached;

  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(cleanPin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(`kongre-sync-auth-v1|${role}|${congregationId}`),
      iterations,
      hash: 'SHA-256',
    },
    base,
    256
  );
  const token = toHex(bits);
  tokenCache.set(cacheKey, token);
  return token;
}

/** Tokens para una sesión con un único PIN (soporta derivación dual v2 a 600k con fallback a 100k legado). */
export async function tokensFromSinglePin(pin: string, congregationId: string): Promise<SyncTokens> {
  const isLegacy = isLegacyPinFormat(pin);
  const [master, pub] = await Promise.all([
    deriveAuthToken(pin, congregationId, 'master', false, AUTH_ITERATIONS),
    deriveAuthToken(pin, congregationId, 'public', false, AUTH_ITERATIONS),
  ]);

  const [masterLegacy, pubLegacy] = await Promise.all([
    deriveAuthToken(pin, congregationId, 'master', isLegacy, AUTH_ITERATIONS_LEGACY),
    deriveAuthToken(pin, congregationId, 'public', isLegacy, AUTH_ITERATIONS_LEGACY),
  ]);

  return {
    master,
    public: pub,
    master_legacy: masterLegacy,
    public_legacy: pubLegacy,
  };
}

function getSyncEndpoint(): string {
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (
      (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
      host.includes('.run.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return '/api/kongre-sync';
    }
  }
  return FUNCTION_URL;
}

function shouldSkipCloudCall(body: Record<string, unknown>): boolean {
  if (typeof window !== 'undefined') {
    try {
      if (
        localStorage.getItem('kongre_demo_mode') === 'true' ||
        sessionStorage.getItem('kongre_demo_mode') === 'true' ||
        localStorage.getItem('kongre_is_guest') === 'true'
      ) {
        return true;
      }
    } catch {}
  }
  const rawId = String(body?.id || '').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (
    !rawId ||
    rawId.startsWith('DEMO') ||
    ['1001', 'CENTRAL', 'MAIN', 'ID', 'CONGCENTRAL', 'CONGREGACIONCENTRAL'].includes(rawId)
  ) {
    return true;
  }
  return false;
}

async function call<T>(body: Record<string, unknown>): Promise<SyncResult<T>> {
  if (shouldSkipCloudCall(body)) {
    return {
      ok: false,
      status: 200,
      error: 'demo_mode',
    };
  }

  try {
    const endpoint = getSyncEndpoint();
    let res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 404 && endpoint !== FUNCTION_URL) {
      res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* respuesta no JSON */
    }
    if (res.ok && json?.ok) return json as SyncResult<T>;
    return {
      ok: false,
      status: res.status,
      error: json?.error || 'server_error',
      retryAfter: typeof json?.retry_after === 'number' ? json.retry_after : undefined,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: 'network_error',
    };
  }
}

export interface PullData {
  tier: SyncRole;
  created_at: string;
  type: string | null;
  payload: string | null;
  payload_public: string | null;
}

export function syncPull(id: string, pin: string) {
  return tokensFromSinglePin(pin, id).then((tokens) => call<PullData>({ action: 'pull', id, tokens }));
}

export function syncMeta(id: string, pin: string) {
  return tokensFromSinglePin(pin, id).then((tokens) =>
    call<{ tier: SyncRole; created_at: string; type: string | null }>({ action: 'meta', id, tokens })
  );
}

/** Token para PIN personal: PBKDF2(PIN normalizado, sal = `kongre-personal-pin-v1|${congregationId}`) */
export async function derivePersonalPinToken(pin: string, congregationId: string): Promise<string> {
  const cleanPin = normalizePin(pin);
  const cacheKey = `personal|${congregationId}|${cleanPin}`;
  const cached = tokenCache.get(cacheKey);
  if (cached) return cached;

  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(cleanPin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(`kongre-personal-pin-v1|${congregationId}`),
      iterations: AUTH_ITERATIONS,
      hash: 'SHA-256',
    },
    base,
    256
  );
  const token = toHex(bits);
  tokenCache.set(cacheKey, token);
  return token;
}

/** v2: la sal incluye el publisherId, así un mismo PIN produce tokens distintos en cada publicador. */
export async function derivePersonalPinTokenV2(pin: string, congregationId: string, publisherId: string): Promise<string> {
  const cleanPin = normalizePin(pin);
  const cacheKey = `personal2|${congregationId}|${publisherId}|${cleanPin}`;
  const cached = tokenCache.get(cacheKey);
  if (cached) return cached;

  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(cleanPin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(`kongre-personal-pin-v2|${congregationId}|${publisherId}`),
      iterations: AUTH_ITERATIONS,
      hash: 'SHA-256',
    },
    base,
    256
  );
  const token = toHex(bits);
  tokenCache.set(cacheKey, token);
  return token;
}

export interface VerifiedPublisher {
  id: string;
  name: string;
  role: string;
  privilege?: string;
  theocraticRoles?: string[];
}

export interface PersonalPinEntry {
  id: string;
  pin: string;
  name: string;
  role: string;
  privilege?: string;
  theocraticRoles?: string[];
}

export function syncVerifyPersonalPin(
  id: string,
  congregationPin: string,
  personalPin: string,
  publisherId: string
) {
  if (!publisherId || !publisherId.trim()) {
    return Promise.resolve({ ok: false as const, status: 400, error: 'publisher_id_required' });
  }
  return Promise.all([
    deriveAuthToken(congregationPin, id, 'public'),
    derivePersonalPinToken(personalPin, id),
    derivePersonalPinTokenV2(personalPin, id, publisherId.trim()),
  ]).then(([publicToken, pinToken, pinTokenV2]) =>
    call<{ publisher: VerifiedPublisher; session_token?: string; expires_at?: number }>({
      action: 'verify_personal_pin',
      id,
      tokens: { public: publicToken },
      pin_token: pinToken,
      pin_token_v2: pinTokenV2,
      publisher_id: publisherId.trim(),
    })
  );
}

export function syncVerifyRoleToken(
  id: string,
  congregationPin: string,
  token: string
) {
  const isLegacy = isLegacyPinFormat(congregationPin);
  return Promise.all([
    deriveAuthToken(congregationPin, id, 'public', false, AUTH_ITERATIONS),
    deriveAuthToken(congregationPin, id, 'public', isLegacy, AUTH_ITERATIONS_LEGACY),
  ]).then(([publicToken, publicLegacyToken]) =>
    call<{ valid: boolean; publisher_id: string; role: string; roles: string[]; expires_at: number }>({
      action: 'verify_role_token',
      id,
      tokens: { public: publicToken, public_legacy: publicLegacyToken },
      token,
    })
  );
}

export async function syncPush(params: {
  id: string;
  masterPin: string;
  publicPin: string;
  payload: string;
  payloadPublic: string;
  /** No sobrescribir el payload maestro existente (protección contra borrado por dispositivo vacío). */
  preserveMaster?: boolean;
  /** PINs personales para verificación segura en servidor (los hashes no se envían a payloadPublic). */
  personalPins?: PersonalPinEntry[];
  /** Rotación de credenciales: PINs nuevos. Los PINs actuales (masterPin/publicPin) autentican la operación. */
  rotateTo?: { masterPin?: string; publicPin?: string };
  /** Versión esperada (marca de tiempo de última lectura) para evitar sobreescritura accidental concurrente (409 Conflict). */
  expectedVersion?: string;
}) {
  const masterLegacy = isLegacyPinFormat(params.masterPin);
  const publicLegacy = isLegacyPinFormat(params.publicPin);

  const tokens: SyncTokens = {
    master: await deriveAuthToken(params.masterPin, params.id, 'master', false, AUTH_ITERATIONS),
    public: await deriveAuthToken(params.publicPin, params.id, 'public', false, AUTH_ITERATIONS),
    master_legacy: await deriveAuthToken(params.masterPin, params.id, 'master', masterLegacy, AUTH_ITERATIONS_LEGACY),
    public_legacy: await deriveAuthToken(params.publicPin, params.id, 'public', publicLegacy, AUTH_ITERATIONS_LEGACY),
  };

  let rotate_to: SyncTokens | undefined;
  if (params.rotateTo) {
    rotate_to = {};
    if (params.rotateTo.masterPin) {
      rotate_to.master = await deriveAuthToken(params.rotateTo.masterPin, params.id, 'master', false, AUTH_ITERATIONS);
    }
    if (params.rotateTo.publicPin) {
      rotate_to.public = await deriveAuthToken(params.rotateTo.publicPin, params.id, 'public', false, AUTH_ITERATIONS);
    }
  }
  let personal_pins: Array<{ id: string; token: string; v: 2; name: string; role: string; privilege?: string; theocraticRoles?: string[] }> | undefined;
  if (params.personalPins && params.personalPins.length > 0) {
    personal_pins = await Promise.all(
      params.personalPins.map(async (p) => ({
        id: p.id,
        token: await derivePersonalPinTokenV2(p.pin, params.id, p.id),
        v: 2 as const,
        name: p.name,
        role: p.role,
        privilege: p.privilege,
        theocraticRoles: p.theocraticRoles,
      }))
    );
  }
  return call<{ created_at: string; tier: SyncRole; created?: boolean; claimed?: boolean }>({
    action: 'push',
    id: params.id,
    tokens,
    payload: params.payload,
    payload_public: params.payloadPublic,
    preserve_master: params.preserveMaster ? true : undefined,
    personal_pins,
    rotate_to,
    expected_version: params.expectedVersion,
  });
}

export function syncDelete(id: string, masterPin: string) {
  const isLegacy = isLegacyPinFormat(masterPin);
  return Promise.all([
    deriveAuthToken(masterPin, id, 'master', false, AUTH_ITERATIONS),
    deriveAuthToken(masterPin, id, 'master', isLegacy, AUTH_ITERATIONS_LEGACY),
  ]).then(([master, masterLegacy]) =>
    call<{ deleted: boolean }>({ action: 'delete', id, tokens: { master, master_legacy: masterLegacy } })
  );
}

/** Mensaje en español para el usuario a partir de un resultado de error. */
export function describeSyncError(r: { status: number; error: string; retryAfter?: number }): string {
  if (r.status === 0 || r.error === 'network_error') {
    return 'No se pudo conectar con el servidor en la nube (Failed to fetch). Tus cambios se guardaron localmente.';
  }
  if (r.status === 429) {
    const mins = r.retryAfter ? Math.max(1, Math.ceil(r.retryAfter / 60)) : 1;
    return `Demasiados intentos. Espera ${mins} minuto${mins === 1 ? '' : 's'} antes de volver a intentar.`;
  }
  if (r.status === 409 || r.error === 'conflict_detected') {
    return 'Se detectaron cambios más recientes guardados desde otro dispositivo. Para no sobrescribir el trabajo de otro hermano, sincroniza primero los datos de la nube.';
  }
  if (r.status === 401) return 'El ID de congregación o el PIN no son correctos.';
  if (r.status === 403) return 'Tu nivel de acceso no permite esta operación.';
  if (r.error === 'rotation_requires_master_payload') {
    return 'No se puede rotar el PIN Maestro porque este dispositivo no tiene la lista completa de publicadores sincronizada. Sincroniza primero y vuelve a intentarlo.';
  }
  if (r.error === 'rotation_requires_public_payload') {
    return 'No se puede rotar el PIN de congregación sin los datos públicos. Sincroniza primero y vuelve a intentarlo.';
  }
  if (r.status === 413) return 'Los datos son demasiado grandes para sincronizar.';
  return 'El servidor de sincronización no pudo procesar la solicitud. Inténtalo de nuevo.';
}
