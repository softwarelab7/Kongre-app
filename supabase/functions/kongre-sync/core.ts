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
  /** Permite reclamar filas antiguas (sin verificadores). Activar solo durante la migración. */
  legacyClaim: boolean;
  now?: () => number;
}

type Tier = 'master' | 'public';

const TOKEN_RE = /^[a-f0-9]{64}$/;
const ID_RE = /^[A-Z0-9]{4,64}$/;
const MAX_BODY_CHARS = 8_000_000;
const MAX_PAYLOAD_CHARS = 4_000_000;

const LIMITS = {
  congIp: { limit: 8, window: 900, lock: 900 },
  ip: { limit: 40, window: 900, lock: 900 },
  cong: { limit: 300, window: 3600, lock: 300 },
  create: { limit: 10, window: 3600, lock: 3600 },
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

export async function verifierOfPersonal(pepper: string, congId: string, token: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`personal|${congId}|${token}`));
  return toHex(sig);
}

async function buildPersonalVerifiers(pepper: string, congId: string, list: any[]): Promise<PersonalVerifier[]> {
  const out: PersonalVerifier[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const pubId = typeof item.id === 'string' ? item.id.trim() : '';
    const token = typeof item.token === 'string' ? item.token.trim() : '';
    if (!pubId || !TOKEN_RE.test(token)) continue;
    const verifier = await verifierOfPersonal(pepper, congId, token);
    out.push({
      id: pubId,
      verifier,
      name: typeof item.name === 'string' ? item.name.trim() : '',
      role: typeof item.role === 'string' ? item.role.trim() : 'publico',
      privilege: typeof item.privilege === 'string' ? item.privilege.trim() : undefined,
      theocraticRoles: Array.isArray(item.theocraticRoles)
        ? item.theocraticRoles.filter((r: any) => typeof r === 'string')
        : undefined,
    });
  }
  return out;
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
  const allowAny = env.allowedOrigins.length === 0;
  const allowed = allowAny ? '*' : env.allowedOrigins.includes(origin) ? origin : env.allowedOrigins[0];
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

interface Tokens { master?: string; public?: string }

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
  if (!['pull', 'meta', 'push', 'delete', 'verify_personal_pin'].includes(action)) return json(req, env, 400, { ok: false, error: 'bad_action' });
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

  const tierOf = async (row: SyncRow): Promise<Tier | null> => {
    const mv = tokens.master ? await verifierOf(env.pepper, 'master', id, tokens.master) : null;
    const pv = tokens.public ? await verifierOf(env.pepper, 'public', id, tokens.public) : null;
    if (mv && row.master_verifier && safeEqual(mv, row.master_verifier)) return 'master';
    if (pv && row.public_verifier && safeEqual(pv, row.public_verifier)) return 'public';
    return null;
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

    // Fila antigua sin verificadores: solo se puede reclamar con LEGACY_CLAIM activo.
    if (!current.master_verifier) {
      if (!env.legacyClaim || !tokens.master || !tokens.public) return reject();
      const patch: Partial<SyncRow> = {
        created_at: nowIso,
        type: 'full_sync',
        master_verifier: await verifierOf(env.pepper, 'master', id, tokens.master),
        public_verifier: await verifierOf(env.pepper, 'public', id, tokens.public),
      };
      if (typeof payload === 'string' && !(body.preserve_master && current.payload)) patch.payload = payload;
      if (typeof payloadPublic === 'string') patch.payload_public = payloadPublic;
      if (Array.isArray(body.personal_pins)) {
        patch.personal_verifiers = await buildPersonalVerifiers(env.pepper, id, body.personal_pins);
      }
      await db.updateRow(id, patch);
      await db.clearFailures(kCongIp);
      return json(req, env, 200, { ok: true, created_at: nowIso, tier: 'master', claimed: true });
    }

    const tier = await tierOf(current);
    if (!tier) return reject();
    await db.clearFailures(kCongIp);

    // Seguridad: solo el nivel maestro puede escribir/actualizar datos (payload o payload_public).
    // El nivel público no puede sobrescribir la lista de publicadores, roles ni configuraciones.
    if (tier !== 'master') {
      return json(req, env, 403, { ok: false, error: 'push_requires_master_tier' });
    }

    const patch: Partial<SyncRow> = { created_at: nowIso, type: 'full_sync' };
    if (typeof payloadPublic === 'string') patch.payload_public = payloadPublic;
    if (typeof payload === 'string' && !body.preserve_master) patch.payload = payload;
    if (Array.isArray(body.personal_pins)) {
      patch.personal_verifiers = await buildPersonalVerifiers(env.pepper, id, body.personal_pins);
    }
    const rot = body.rotate_to;
    if (rot !== undefined) {
      const rt = parseTokens(rot);
      if (!rt) return json(req, env, 400, { ok: false, error: 'bad_tokens' });
      if (rt.master) patch.master_verifier = await verifierOf(env.pepper, 'master', id, rt.master);
      if (rt.public) patch.public_verifier = await verifierOf(env.pepper, 'public', id, rt.public);
    }

    await db.updateRow(id, patch);
    return json(req, env, 200, { ok: true, created_at: nowIso, tier });
  }

  // ---------- VERIFY PERSONAL PIN ----------
  if (action === 'verify_personal_pin') {
    if (!row || !row.master_verifier) return reject();
    const tier = await tierOf(row);
    if (!tier) return reject(); // Requiere credenciales válidas de la congregación

    const pinToken = typeof body?.pin_token === 'string' ? body.pin_token.trim() : '';
    if (!TOKEN_RE.test(pinToken)) {
      return json(req, env, 400, { ok: false, error: 'bad_pin_token' });
    }

    // Seguridad: publisher_id es OBLIGATORIO para evitar ataques de colisión aleatoria
    // contra cualquier publicador de la congregación.
    const publisherId = typeof body?.publisher_id === 'string' ? body.publisher_id.trim() : '';
    if (!publisherId) {
      return json(req, env, 400, { ok: false, error: 'publisher_id_required' });
    }

    // Evita claves de contador arbitrariamente largas (el atacante controla publisher_id).
    if (publisherId.length > 100) {
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

    const expectedVerifier = await verifierOfPersonal(env.pepper, id, pinToken);
    const matched = safeEqual(expectedVerifier, targetPublisher.verifier);

    if (!matched) {
      const pubLock = await db.registerFailure(kPub, LIMITS.pub.limit, LIMITS.pub.window, LIMITS.pub.lock);
      if (pubLock && pubLock > now()) {
        return json(req, env, 429, { ok: false, error: 'rate_limited', retry_after: Math.ceil((pubLock - now()) / 1000) });
      }
      return reject();
    }

    await db.clearFailures(kCongIp);
    await db.clearFailures(kPub);
    return json(req, env, 200, {
      ok: true,
      publisher: {
        id: targetPublisher.id,
        name: targetPublisher.name,
        role: targetPublisher.role,
        privilege: targetPublisher.privilege,
        theocraticRoles: targetPublisher.theocraticRoles || [],
      },
    });
  }

  // ---------- PULL / META / DELETE ----------
  if (!row || !row.master_verifier) return reject();
  const tier = await tierOf(row);
  if (!tier) return reject();
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
