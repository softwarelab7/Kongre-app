/**
 * kongre-sync / index.ts — adaptador Deno + Supabase para core.ts
 *
 * Secretos requeridos (supabase secrets set ...):
 *   KONGRE_SYNC_PEPPER   cadena aleatoria larga (>= 32 bytes). NO la cambies después: invalida todos los accesos.
 * Opcionales:
 *   ALLOWED_ORIGINS      orígenes permitidos separados por coma (ej. https://kongre.ai.studio,http://localhost:3050)
 * Inyectados por Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleRequest, type SyncDb, type SyncRow, corsHeaders } from './core.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const pepper = Deno.env.get('KONGRE_SYNC_PEPPER') || '';
if (pepper.length < 32) {
  console.error('KONGRE_SYNC_PEPPER no configurado o demasiado corto (mínimo 32 caracteres).');
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const db: SyncDb = {
  async getRow(id) {
    const { data, error } = await supabase
      .from('sync_queue')
      .select('id_congregacion,payload,payload_public,created_at,type,master_verifier,public_verifier,personal_verifiers')
      .eq('id_congregacion', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SyncRow) ?? null;
  },
  async insertRow(row) {
    const { error } = await supabase.from('sync_queue').insert({ ...row, consumed_at: null });
    if (error) {
      if (error.code === '23505') return false;
      throw new Error(error.message);
    }
    return true;
  },
  async updateRow(id, patch) {
    const { error } = await supabase.from('sync_queue').update({ ...patch, consumed_at: null }).eq('id_congregacion', id);
    if (error) throw new Error(error.message);
  },
  async updateRowIfVersion(id, patch, expectedCreatedAt) {
    const { data, error } = await supabase
      .from('sync_queue')
      .update({ ...patch, consumed_at: null })
      .eq('id_congregacion', id)
      .eq('created_at', expectedCreatedAt)
      .select('id_congregacion');
    if (error) throw new Error(error.message);
    return Array.isArray(data) && data.length > 0;
  },
  async deleteRow(id) {
    const { error } = await supabase.from('sync_queue').delete().eq('id_congregacion', id);
    if (error) throw new Error(error.message);
  },
  async lockedUntil(keys) {
    const { data, error } = await supabase.rpc('sync_locked_until', { p_keys: keys });
    if (error) throw new Error(error.message);
    return data ? Date.parse(data as string) : null;
  },
  async registerFailure(key, limit, windowSecs, lockSecs) {
    const { data, error } = await supabase.rpc('sync_register_failure', {
      p_key: key, p_limit: limit, p_window_secs: windowSecs, p_lock_secs: lockSecs,
    });
    if (error) throw new Error(error.message);
    return data ? Date.parse(data as string) : null;
  },
  async clearFailures(key) {
    const { error } = await supabase.rpc('sync_clear_failures', { p_key: key });
    if (error) throw new Error(error.message);
  },
};

const rawAllowedOrigins = Deno.env.get('ALLOWED_ORIGINS');
const parsedOrigins = (rawAllowedOrigins || '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => Boolean(s) && s !== 'false' && s !== 'none' && s !== 'null' && s !== 'undefined');

const env = {
  pepper,
  allowedOrigins: parsedOrigins,
};

// Avisos de configuración al arrancar (visibles en Dashboard → Edge Functions → Logs).
if (env.allowedOrigins.length === 0) {
  if (rawAllowedOrigins) {
    console.warn(
      `AVISO: ALLOWED_ORIGINS está definido como "${rawAllowedOrigins}", pero no contiene ningún origen web válido. ` +
        'Se usará fallback permisivo CORS "*" (o del originante). En producción define una lista separada por comas ' +
        '(ej: https://www.kongre-app.com,tauri://localhost,http://localhost:3000).'
    );
  } else {
    console.warn(
      'AVISO: ALLOWED_ORIGINS no está configurado; CORS responderá a cualquier origen ("*"). ' +
        'En producción define ALLOWED_ORIGINS (ej: https://www.kongre-app.com,tauri://localhost).'
    );
  }
}

Deno.serve(async (req) => {
  if (pepper.length < 32) {
    return new Response(JSON.stringify({ ok: false, error: 'server_misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders(req, env), 'Content-Type': 'application/json' },
    });
  }
  try {
    return await handleRequest(req, db, env);
  } catch (e) {
    console.error('kongre-sync error:', e instanceof Error ? e.message : e);
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 500,
      headers: { ...corsHeaders(req, env), 'Content-Type': 'application/json' },
    });
  }
});
