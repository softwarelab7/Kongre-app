-- ============================================================================
-- 03 · VERIFICADORES DE PIN PERSONAL EN SERVIDOR
--      Agrega columna para almacenar los verificadores ciegos (HMAC con pepper)
--      de los PINs personales de publicadores y ancianos.
--      Solo accesible por la Edge Function (service_role); anon y authenticated
--      no tienen acceso.
-- ============================================================================

alter table public.sync_queue
  add column if not exists personal_verifiers jsonb;
