import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://rceyevhwhtjshsthrrtp.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_oku9hNDAl66eipU1oAMGug_N8rUSQlB';

if (!SUPABASE_URL || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Cloud sync will be unavailable.');
}

// NOTA: tras el cierre de RLS, este cliente solo se usa para Supabase Auth (Google).
// Los datos de congregación se sincronizan exclusivamente vía la Edge Function `kongre-sync`
// (ver src/services/syncApi.ts).
export const supabase = createClient(SUPABASE_URL, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
