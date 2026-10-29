-- ============================================================================
-- 02 · CIERRE. Ejecutar SOLO DESPUÉS de:
--      (a) desplegar la función kongre-sync,
--      (b) publicar la nueva versión de la app,
--      (c) reclamar tus congregaciones existentes (ver MIGRACION.md).
--      Después de esto, las versiones antiguas de la app dejan de sincronizar.
-- ============================================================================

-- 1) Eliminar TODAS las políticas abiertas (true) de ambas tablas.
do $$
declare p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('sync_queue', 'publisher_invitations')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 2) RLS activo y sin políticas: nadie (salvo service_role, que la omite) puede acceder.
alter table public.sync_queue            enable row level security;
alter table public.publisher_invitations enable row level security;

-- 3) Quitar privilegios directos a los roles públicos (incluye la vista invitations_summary,
--    que al ser una vista del propietario podía saltarse RLS).
revoke all on public.sync_queue            from public, anon, authenticated;
revoke all on public.publisher_invitations from public, anon, authenticated;
revoke all on public.invitations_summary   from public, anon, authenticated;

-- 4) Sacar las tablas del Realtime (la app ya no lo usa; evita fugas por canal).
do $$
declare t text;
begin
  foreach t in array array['sync_queue', 'publisher_invitations'] loop
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end $$;

-- 5) (Recomendado) Que las tablas futuras NO nazcan expuestas a anon/authenticated.
--    Descomenta si todas tus tablas nuevas deben pasar por funciones o políticas explícitas.
-- alter default privileges in schema public revoke all on tables    from anon, authenticated;
-- alter default privileges in schema public revoke all on functions from anon, authenticated;

-- 6) Verificación: no debe devolver filas.
-- select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--  where table_schema = 'public' and grantee in ('anon','authenticated');
-- select * from pg_policies where schemaname = 'public';
