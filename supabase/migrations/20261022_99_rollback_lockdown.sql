-- ============================================================================
-- ROLLBACK de emergencia del cierre. VUELVE A ABRIR el acceso público a las tablas
-- (el estado inseguro original). Úsalo solo para recuperar servicio mientras arreglas algo.
-- ============================================================================
grant select, insert, update, delete on public.sync_queue to anon, authenticated;
create policy sync_queue_read   on public.sync_queue for select to public using (true);
create policy sync_queue_write  on public.sync_queue for insert to public with check (true);
create policy sync_queue_update on public.sync_queue for update to public using (true) with check (true);
