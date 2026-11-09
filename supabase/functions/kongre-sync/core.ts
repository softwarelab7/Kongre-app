/**
 * kongre-sync / core.ts
 * Lógica de autorización de la sincronización de Kongre, sin dependencias de Deno ni de Supabase
 * (solo APIs web estándar), para poder probarla en Node.
 *
 * Modelo (se mantiene el Cero Conocimiento: el servidor nunca ve el PIN ni las claves de cifrado):
 *  - El cliente deriva de cada PIN un "token de autenticación" (PBKDF2, sal distinta de la de cifrado).
 *  - El servidor guarda solo HMAC-SHA256(pepper, rol|id|token). El pepper es un secreto de la función,
 *    así que una filtración de la base de datos por sí sola no permite atacar los PINs.
 *  - Dos niveles: "master" (PIN del coordinador) y "public" (PIN de congregación).
 *      master -> lee payload + payload_public, escribe ambos, puede rotar credenciales y borrar.
 *      public -> lee solo payload_public y escribe solo payload_public.
 *  - Límite de intentos en el servidor (por congregación+IP, por IP y por congregación).
 */

export interface PersonalVerifier {
  id: string; // publisherId
  verifier: string; // HMAC con pepper del token del PIN
  name: string;
  role: string;
  privilege?: string;
  theocraticRoles?: string[];
  /** Versión del verificador. Solo existe la 2: HMAC con publisherId en el mensaje y sal por publicador en el cliente. */
  v?: number;
}

export interface SyncRow {
  id_congregacion: string;
  payload: string | null;
  payload_public: string | null;
  created_at: string;
  type: string | null;
  master_verifier: string | null;
  public_verifier: string | null;
  personal_verifiers?: PersonalVerifier[] | null;
}

export interface SyncDb {
  getRow(id: string): Promise<SyncRow | null>;
  /** Inserta; devuelve false si ya existía (carrera). */
  insertRow(row: SyncRow): Promise<boolean>;
  updateRow(id: string, patch: Partial<SyncRow>): Promise<void>;
  /**
   * Compare-and-swap atómico: actualiza SOLO si la fila sigue en `expectedCreatedAt` (valor tal como lo devolvió getRow).
   * Devuelve false si otro push se adelantó entre la lectura y la escritura (no se modifica nada).
   */
  updateRowIfVersion(id: string, patch: Partial<SyncRow>, expectedCreatedAt: string): Promise<boolean>;
  deleteRow(id: string): Promise<void>;
  /** Epoch ms hasta el que alguna de las claves está bloqueada, o null. */
  lockedUntil(keys: string[]): Promise<number | null>;
  /** Registra un fallo de forma atómica; devuelve epoch ms de bloqueo si se alcanzó el límite. */
  registerFailure(key: string, limit: number, windowSecs: number, lockSecs: number): Promise<number | null>;
  clearFailures(key: string): Promise<void>;
}

export interface SyncEnv {
  pepper: string;
  allowedOrigins: string[];
  now?: () => number;
}

type Tier = 'master' | 'public';

const TOKEN_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[A-Z0-9]{4,64}$/;
const PUB_ID_RE = /^[a-zA-Z0-9_.-]{1,80}$/;
const MAX_BODY_CHARS = 8_000_000;
const MAX_PAYLOAD_CHARS = 4_000_000;
const MAX_PERSONAL_PINS = 500;

const LIMITS = {
  congIp: { limit: 8, window: 900, lock: 900 },
  ip: { limit: 40, window: 900, lock: 900 },
  cong: { limit: 300, window: 3600, lock: 300 },
  create: { limit: 5, window: 3600, lock: 3600 },
  // Límite por (congregación, publicador) para PIN personal. Los PIN personales suelen ser de 4 dígitos
  // (9.000 combinaciones): sin este tope un atacante con el PIN de congregación los recorre en ~1,5 días.
  // Con 6 fallos/hora y 30 min de bloqueo, el máximo es ~12 intentos/hora por publicador (>30 días para
  // agotar el espacio) sin importar cuántas IPs use. Contrapartida: se puede bloquear a un publicador.
  pub: { limit: 6, window: 3600, lock: 1800 },
};

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifierOf(pepper: string, role: Tier, id: string, token: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${role}|${id}|${token}`));
  return toHex(sig);
}

/** v2: el publisherId forma parte del mensaje, así dos publicadores con el mismo PIN ya no comparten verificador. */
export async function verifierOfPersonalV2(pepper: string, congId: string, pubId: string, token: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`personal2|${congId}|${pubId}|${token}`));
  return toHex(sig);
}

async function buildPersonalVerifiers(pepper: string, congId: string, list: any[]): Promise<PersonalVerifier[]> {
  const out: PersonalVerifier[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const pubId = typeof item.id === 'string' ? item.id.trim() : '';
    const token = typeof item.token === 'string' ? item.token.trim() : '';
    if (!pubId || !PUB_ID_RE.test(pubId) || !TOKEN_RE.test(token)) continue;
    // Solo se acepta el esquema v2 (el publisherId entra en el HMAC): un mismo PIN en dos publicadores no comparte verificador.
    if (item.v !== 2) continue;
    out.push({
      id: pubId,
      verifier: await verifierOfPersonalV2(pepper, congId, pubId, token),
      v: 2,
      name: typeof item.name === 'string' ? item.name.trim().slice(0, 120) : '',
      role: typeof item.role === 'string' ? item.role.trim().slice(0, 40) : 'publico',
      privilege: typeof item.privilege === 'string' ? item.privilege.trim().slice(0, 40) : undefined,
      theocraticRoles: Array.isArray(item.theocraticRoles)
        ? item.theocraticRoles.filter((r: any) => typeof r === 'string').map((r: string) => r.trim().slice(0, 40))
        : undefined,
    });
  }
  return out;
}

// Reemplaza los delimitadores internos del token (`.`, `:`, `,`) para que ningún campo pueda romper el formato.
export function tokenSafe(value: string): string {
  return String(value ?? '').replace(/[.:,\s]/g, '_');
}

export async function signServerRoleToken(
  pepper: string,
  congId: string,
  pub: { id: string; role: string; theocraticRoles?: string[] },
  expiresAt: number
): Promise<string> {
  const safeCong = tokenSafe(congId);
  const safePub = tokenSafe(pub.id);
  const safeRole = tokenSafe(pub.role || 'publico');
  const rolesList = (pub.theocraticRoles && pub.theocraticRoles.length > 0)
    ? pub.theocraticRoles.map((r) => tokenSafe(r.trim())).filter(Boolean).join(',')
    : safeRole;
  const payload = `${safeCong}:${safePub}:${safeRole}:${rolesList}:${expiresAt}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`server_role_token_v1|${payload}`));
  return `kgr_srt1.${payload}.${toHex(sig)}`;
}

export async function verifyServerRoleToken(
  pepper: string,
  token: string,
  currentTime = Date.now()
): Promise<{ valid: boolean; congId?: string; publisherId?: string; role?: string; roles?: string[]; expiresAt?: number }> {
  if (!token || typeof token !== 'string' || !token.startsWith('kgr_srt1.')) {
    return { valid: false };
  }
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false };
  const [, payload, sigHex] = parts;
  const payloadParts = payload.split(':');
  if (payloadParts.length < 5) return { valid: false };
  const [congId, pubId, role, rolesStr, expStr] = payloadParts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || exp < currentTime) return { valid: false };

  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expectedSig = toHex(await crypto.subtle.sign('HMAC', key, enc.encode(`server_role_token_v1|${payload}`)));
  if (!safeEqual(expectedSig, sigHex)) return { valid: false };

  return {
    valid: true,
    congId,
    publisherId: pubId,
    role,
    roles: rolesStr.split(',').filter(Boolean),
    expiresAt: exp,
  };
}

/**
 * Compara dos marcas de versión de forma semántica. El cliente guarda `...Z` (la que devolvió el push) y Postgres
 * puede devolver `...+00:00` (o con microsegundos): comparar cadenas daría falsos conflictos.
 */
export function versionsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isFinite(ta) && Number.isFinite(tb)) return ta === tb;
  return a === b;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function clientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return xff || 'unknown';
}

export function corsHeaders(req: Request, env: SyncEnv): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const validOrigins = (env.allowedOrigins || []).filter(
    (o) => Boolean(o) && o !== 'false' && o !== 'none' && o !== 'null' && o !== 'undefined'
  );
  const allowAny = validOrigins.length === 0 || validOrigins.includes('*');
  const allowed = allowAny ? (origin || '*') : validOrigins.includes(origin) ? origin : (validOrigins[0] || '*');
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(req: Request, env: SyncEnv, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req, env), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

interface Tokens {
  master?: string;
  public?: string;
}

function parseTokens(raw: any): Tokens | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Tokens = {};
  if (raw.master !== undefined) {
    if (typeof raw.master !== 'string' || !TOKEN_RE.test(raw.master)) return null;
    out.master = raw.master;
  }
  if (raw.public !== undefined) {
    if (typeof raw.public !== 'string' || !TOKEN_RE.test(raw.public)) return null;
    out.public = raw.public;
  }
  return out.master || out.public ? out : null;
}

export async function handleRequest(req: Request, db: SyncDb, env: SyncEnv): Promise<Response> {
  const now = env.now ?? Date.now;

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) });
  if (req.method !== 'POST') return json(req, env, 405, { ok: false, error: 'method_not_allowed' });

  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) return json(req, env, 413, { ok: false, error: 'payload_too_large' });

  let body: any;
  try { body = JSON.parse(text); } catch { return json(req, env, 400, { ok: false, error: 'bad_json' }); }

  const action = body?.action;
  const id = typeof body?.id === 'string' ? body.id.trim().toUpperCase() : '';
  if (!ID_RE.test(id)) return json(req, env, 400, { ok: false, error: 'bad_id' });
  if (!['pull', 'meta', 'push', 'delete', 'verify_personal_pin', 'verify_role_token'].includes(action)) return json(req, env, 400, { ok: false, error: 'bad_action' });
  const tokens = parseTokens(body.tokens);
  if (!tokens) return json(req, env, 400, { ok: false, error: 'bad_tokens' });

  const ip = clientIp(req);
  const kCongIp = `ci:${id}:${ip}`;
  const kIp = `ip:${ip}`;
  const kCong = `c:${id}`;

  const locked = await db.lockedUntil([kCongIp, kIp, kCong]);
  if (locked && locked > now()) {
    return json(req, env, 429, { ok: false, error: 'rate_limited', retry_after: Math.ceil((locked - now()) / 1000) });
  }

  const reject = async (): Promise<Response> => {
    const results = await Promise.all([
      db.registerFailure(kCongIp, LIMITS.congIp.limit, LIMITS.congIp.window, LIMITS.congIp.lock),
      db.registerFailure(kIp, LIMITS.ip.limit, LIMITS.ip.window, LIMITS.ip.lock),
      db.registerFailure(kCong, LIMITS.cong.limit, LIMITS.cong.window, LIMITS.cong.lock),
    ]);
    const until = Math.max(0, ...results.map((r) => r || 0));
    if (until > now()) {
      return json(req, env, 429, { ok: false, error: 'rate_limited', retry_after: Math.ceil((until - now()) / 1000) });
    }
    // Mismo error para "no existe" y "PIN incorrecto": no permite enumerar congregaciones.
    return json(req, env, 401, { ok: false, error: 'invalid_credentials' });
  };

  const authOf = async (row: SyncRow): Promise<{ tier: Tier } | null> => {
    if (tokens.master && row.master_verifier) {
      const mv = await verifierOf(env.pepper, 'master', id, tokens.master);
      if (safeEqual(mv, row.master_verifier)) return { tier: 'master' };
    }
    if (tokens.public && row.public_verifier) {
      const pv = await verifierOf(env.pepper, 'public', id, tokens.public);
      if (safeEqual(pv, row.public_verifier)) return { tier: 'public' };
    }
    return null;
  };

  const tierOf = async (row: SyncRow): Promise<Tier | null> => {
    const res = await authOf(row);
    return res ? res.tier : null;
  };

  const row = await db.getRow(id);

  // ---------- PUSH ----------
  if (action === 'push') {
    const payload = body.payload;
    const payloadPublic = body.payload_public;
    if (payload !== undefined && (typeof payload !== 'string' || payload.length > MAX_PAYLOAD_CHARS)) {
      return json(req, env, 400, { ok: false, error: 'bad_payload' });
    }
    if (payloadPublic !== undefined && (typeof payloadPublic !== 'string' || payloadPublic.length > MAX_PAYLOAD_CHARS)) {
      return json(req, env, 400, { ok: false, error: 'bad_payload' });
    }
    const nowIso = new Date(now()).toISOString();

    const createRow = async (): Promise<'created' | 'exists' | 'bad' | 'limited'> => {
      if (!tokens.master || !tokens.public || typeof payload !== 'string' || typeof payloadPublic !== 'string') return 'bad';
      // Límite de altas por IP. Hay que consultar el bloqueo ANTES de registrar: al activarse el bloqueo
      // el contador se reinicia y, sin esta comprobación, se podrían crear otras N congregaciones.
      const createKey = `create:${ip}`;
      const lockedCreate = await db.lockedUntil([createKey]);
      if (lockedCreate && lockedCreate > now()) return 'limited';
      const lim = await db.registerFailure(createKey, LIMITS.create.limit, LIMITS.create.window, LIMITS.create.lock);
      if (lim && lim > now()) return 'limited';
      let personalVerifiers: PersonalVerifier[] | null = null;
      if (Array.isArray(body.personal_pins)) {
        if (body.personal_pins.length > MAX_PERSONAL_PINS) return 'bad';
        personalVerifiers = await buildPersonalVerifiers(env.pepper, id, body.personal_pins);
      }
      const ok = await db.insertRow({
        id_congregacion: id,
        payload,
        payload_public: payloadPublic,
        created_at: nowIso,
        type: 'full_sync',
        master_verifier: await verifierOf(env.pepper, 'master', id, tokens.master),
        public_verifier: await verifierOf(env.pepper, 'public', id, tokens.public),
        personal_verifiers: personalVerifiers,
      });
      return ok ? 'created' : 'exists';
    };

    let current = row;
    if (!current) {
      const r = await createRow();
      if (r === 'bad') return json(req, env, 400, { ok: false, error: 'create_requires_both_tokens_and_payloads' });
      if (r === 'limited') return json(req, env, 429, { ok: false, error: 'rate_limited', retry_after: LIMITS.create.lock });
      if (r === 'created') return json(req, env, 200, { ok: true, created_at: nowIso, tier: 'master', created: true });
      current = await db.getRow(id); // carrera: otro cliente la creó primero
      if (!current) return json(req, env, 500, { ok: false, error: 'internal' });
    }

    // Una fila sin verificadores no pertenece a nadie y no se puede reclamar: se trata como credenciales inválidas.
    if (!current.master_verifier) return reject();

    const auth = await authOf(current);
    if (!auth) return reject();
    const tier = auth.tier;
    await db.clearFailures(kCongIp);

    // Seguridad: solo el nivel maestro puede escribir/actualizar datos (payload o payload_public).
    // El nivel público no puede sobrescribir la lista de publicadores, roles ni configuraciones.
    if (tier !== 'master') {
      return json(req, env, 403, { ok: false, error: 'push_requires_master_tier' });
    }

    // Concurrencia optimista OBLIGATORIA: toda actualización de una fila existente debe indicar la versión sobre la
    // que se basa. Sin ella un cliente podría sobrescribir a ciegas el trabajo de otro anciano.
    if (body.expected_version !== undefined && (typeof body.expected_version !== 'string' || body.expected_version.length > 100)) {
      return json(req, env, 400, { ok: false, error: 'bad_expected_version' });
    }
    const expectedVersion = typeof body?.expected_version === 'string' ? body.expected_version.trim() : '';
    if (!expectedVersion) {
      return json(req, env, 428, { ok: false, error: 'expected_version_required', current_version: current.created_at ?? null });
    }
    if (!current.created_at || !versionsEqual(current.created_at, expectedVersion)) {
      return json(req, env, 409, {
        ok: false,
        error: 'conflict_detected',
        current_version: current.created_at ?? null,
      });
    }

    const patch: Partial<SyncRow> = { created_at: nowIso, type: 'full_sync' };
    if (typeof payloadPublic === 'string') patch.payload_public = payloadPublic;
    if (typeof payload === 'string' && !body.preserve_master) patch.payload = payload;

    if (Array.isArray(body.personal_pins)) {
      if (body.personal_pins.length > MAX_PERSONAL_PINS) {
        return json(req, env, 400, { ok: false, error: 'too_many_publishers' });
      }
      patch.personal_verifiers = await buildPersonalVerifiers(env.pepper, id, body.personal_pins);
    }
    const rot = body.rotate_to;
    if (rot !== undefined) {
      const rt = parseTokens(rot);
      if (!rt) return json(req, env, 400, { ok: false, error: 'bad_tokens' });
      // No se permite rotar un verificador sin re-cifrar y enviar el payload correspondiente:
      // de lo contrario el verificador nuevo quedaría activo mientras el ciphertext seguiría cifrado con el PIN viejo.
      if (rt.master && (typeof payload !== 'string' || body.preserve_master)) {
        return json(req, env, 400, { ok: false, error: 'rotation_requires_master_payload' });
      }
      if (rt.public && typeof payloadPublic !== 'string') {
        return json(req, env, 400, { ok: false, error: 'rotation_requires_public_payload' });
      }
      if (rt.master) patch.master_verifier = await verifierOf(env.pepper, 'master', id, rt.master);
      if (rt.public) patch.public_verifier = await verifierOf(env.pepper, 'public', id, rt.public);
    }

    // La comprobación anterior solo da un mensaje rápido; la garantía real es este compare-and-swap atómico.
    const swapped = await db.updateRowIfVersion(id, patch, current.created_at);
    if (!swapped) {
      const latest = await db.getRow(id);
      return json(req, env, 409, { ok: false, error: 'conflict_detected', current_version: latest?.created_at ?? null });
    }
    return json(req, env, 200, { ok: true, created_at: nowIso, tier });
  }

  // ---------- VERIFY PERSONAL PIN ----------
  if (action === 'verify_personal_pin') {
    if (!row || !row.master_verifier) return reject();
    const tier = await tierOf(row);
    if (!tier) return reject(); // Requiere credenciales válidas de la congregación

    const pinTokenV2 = typeof body?.pin_token_v2 === 'string' ? body.pin_token_v2.trim() : '';
    if (!pinTokenV2 || !TOKEN_RE.test(pinTokenV2)) return json(req, env, 400, { ok: false, error: 'bad_pin_token' });

    // Seguridad: publisher_id es OBLIGATORIO para evitar ataques de colisión aleatoria
    // contra cualquier publicador de la congregación.
    const publisherId = typeof body?.publisher_id === 'string' ? body.publisher_id.trim() : '';
    if (!publisherId) {
      return json(req, env, 400, { ok: false, error: 'publisher_id_required' });
    }

    // Evita claves de contador arbitrariamente largas y rechaza caracteres no permitidos.
    if (!PUB_ID_RE.test(publisherId)) {
      return json(req, env, 400, { ok: false, error: 'bad_publisher_id' });
    }
    const verifiers = Array.isArray(row.personal_verifiers) ? row.personal_verifiers : [];
    const targetPublisher = verifiers.find((v) => v.id === publisherId);

    // Seguridad: si el publicador no existe en la congregación, rechazar inmediatamente
    // sin crear buckets de contador arbitrarios en la tabla sync_rate_limits (evita DoS por saturación).
    if (!targetPublisher) {
      return reject();
    }

    const kPub = `pp:${id}:${publisherId}`;
    const lockedPub = await db.lockedUntil([kPub]);
    if (lockedPub && lockedPub > now()) {
      return json(req, env, 429, { ok: false, error: 'rate_limited', retry_after: Math.ceil((lockedPub - now()) / 1000) });
    }

    // Solo existe el esquema v2. Un verificador sin v:2 (fila corrupta o ajena) nunca coincide.
    const matched =
      targetPublisher.v === 2 &&
      safeEqual(await verifierOfPersonalV2(env.pepper, id, targetPublisher.id, pinTokenV2), targetPublisher.verifier);

    if (!matched) {
      const pubLock = await db.registerFailure(kPub, LIMITS.pub.limit, LIMITS.pub.window, LIMITS.pub.lock);
      if (pubLock && pubLock > now()) {
        return json(req, env, 429, { ok: false, error: 'rate_limited', retry_after: Math.ceil((pubLock - now()) / 1000) });
      }
      return reject();
    }

    await db.clearFailures(kCongIp);
    await db.clearFailures(kPub);
    const tokenExp = now() + 30 * 24 * 3600 * 1000; // 30 días de vigencia
    const sessionToken = await signServerRoleToken(env.pepper, id, targetPublisher, tokenExp);
    return json(req, env, 200, {
      ok: true,
      publisher: {
        id: targetPublisher.id,
        name: targetPublisher.name,
        role: targetPublisher.role,
        privilege: targetPublisher.privilege,
        theocraticRoles: targetPublisher.theocraticRoles || [],
      },
      session_token: sessionToken,
      expires_at: tokenExp,
    });
  }

  // ---------- VERIFY ROLE TOKEN ----------
  if (action === 'verify_role_token') {
    if (!row || !row.master_verifier) return reject();
    const tier = await tierOf(row);
    if (!tier) return reject();
    const rawToken = typeof body?.token === 'string' ? body.token.trim() : '';
    const verification = await verifyServerRoleToken(env.pepper, rawToken, now());
    if (!verification.valid || verification.congId !== id) {
      return json(req, env, 401, { ok: false, error: 'invalid_or_expired_token' });
    }
    // Revalidar contra el estado actual de la congregación: si el publicador fue dado de baja
    // o su rol/privilegios cambiaron en un push posterior, el token emitido antes deja de ser válido.
    const verifiers = Array.isArray(row.personal_verifiers) ? row.personal_verifiers : [];
    const current = verifiers.find((v) => v && (v.id === verification.publisherId || tokenSafe(v.id) === verification.publisherId));
    if (!current) {
      return json(req, env, 401, { ok: false, error: 'invalid_or_expired_token' });
    }
    const currentRole = tokenSafe(current.role || 'publico');
    const currentRoles = (current.theocraticRoles && current.theocraticRoles.length > 0)
      ? current.theocraticRoles.map((r) => tokenSafe(r.trim())).filter(Boolean)
      : [currentRole];
    const sameRole = currentRole === verification.role;
    const sameRolesList =
      currentRoles.length === (verification.roles?.length ?? 0) &&
      currentRoles.every((r, i) => r === verification.roles![i]);
    if (!sameRole || !sameRolesList) {
      return json(req, env, 401, { ok: false, error: 'role_changed' });
    }
    await db.clearFailures(kCongIp);
    return json(req, env, 200, {
      ok: true,
      valid: true,
      publisher_id: current.id,
      role: current.role,
      roles: current.theocraticRoles && current.theocraticRoles.length > 0 ? current.theocraticRoles : [current.role],
      expires_at: verification.expiresAt,
    });
  }

  // ---------- PULL / META / DELETE ----------
  if (!row || !row.master_verifier) return reject();
  const auth = await authOf(row);
  if (!auth) return reject();
  const tier = auth.tier;
  await db.clearFailures(kCongIp);

  if (action === 'meta') {
    return json(req, env, 200, { ok: true, created_at: row.created_at, type: row.type, tier });
  }

  if (action === 'pull') {
    return json(req, env, 200, {
      ok: true,
      tier,
      created_at: row.created_at,
      type: row.type,
      payload: tier === 'master' ? row.payload : null,
      payload_public: row.payload_public,
    });
  }

  // delete
  if (tier !== 'master') return json(req, env, 403, { ok: false, error: 'forbidden' });
  await db.deleteRow(id);
  return json(req, env, 200, { ok: true, deleted: true });
}
