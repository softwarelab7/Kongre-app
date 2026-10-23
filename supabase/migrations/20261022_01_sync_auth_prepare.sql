-- ============================================================================
-- 01 · PREPARACIÓN (aditiva). Es seguro ejecutarla ANTES de desplegar la función
--      y no afecta a la app actual.
-- ============================================================================

-- Garantiza una fila por congregación (la app ya hacía upsert con este conflicto).
create unique index if not exists sync_queue_id_congregacion_key
  on public.sync_queue (id_congregacion);

-- Verificadores de acceso (HMAC con pepper; nunca contienen el PIN).
alter table public.sync_queue
  add column if not exists master_verifier text,
  add column if not exists public_verifier text;

-- Contadores para el límite de intentos del servidor.
create table if not exists public.sync_rate_limits (
  key          text primary key,
  fails        int         not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);
alter table public.sync_rate_limits enable row level security;
revoke all on public.sync_rate_limits from public, anon, authenticated;

create or replace function public.sync_locked_until(p_keys text[])
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select max(locked_until)
  from public.sync_rate_limits
  where key = any(p_keys) and locked_until > now();
$$;

create or replace function public.sync_register_failure(
  p_key text, p_limit int, p_window_secs int, p_lock_secs int
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.sync_rate_limits;
begin
  insert into public.sync_rate_limits as t (key, fails, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    fails = case when t.window_start < now() - make_interval(secs => p_window_secs)
                 then 1 else t.fails + 1 end,
    window_start = case when t.window_start < now() - make_interval(secs => p_window_secs)
                        then now() else t.window_start end
  returning * into r;

  if r.fails >= p_limit then
    update public.sync_rate_limits
       set locked_until = now() + make_interval(secs => p_lock_secs),
           fails = 0,
           window_start = now()
     where key = p_key;
    return now() + make_interval(secs => p_lock_secs);
  end if;

  -- Limpieza ocasional de contadores viejos
  if random() < 0.01 then
    delete from public.sync_rate_limits
     where window_start < now() - interval '1 day'
       and (locked_until is null or locked_until < now());
  end if;

  return null;
end;
$$;

create or replace function public.sync_clear_failures(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sync_rate_limits where key = p_key;
$$;

revoke all on function public.sync_locked_until(text[])                    from public, anon, authenticated;
revoke all on function public.sync_register_failure(text, int, int, int)   from public, anon, authenticated;
revoke all on function public.sync_clear_failures(text)                    from public, anon, authenticated;
grant execute on function public.sync_locked_until(text[])                  to service_role;
grant execute on function public.sync_register_failure(text, int, int, int) to service_role;
grant execute on function public.sync_clear_failures(text)                  to service_role;
