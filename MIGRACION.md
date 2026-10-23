# Kongre · Sincronización segura (Edge Function)

Reemplaza el acceso directo del navegador a `sync_queue` por una Edge Function que valida el PIN
**en el servidor**, limita intentos y entrega a cada nivel solo lo que le corresponde.
Mantiene el cero conocimiento: el servidor nunca ve PINs ni claves de cifrado.

## Qué cambia

| Antes | Ahora |
|---|---|
| Cualquiera con la clave pública lee, sobrescribe o borra todas las congregaciones | `anon`/`authenticated` sin acceso a las tablas; solo la función (service_role) accede |
| "Verificación de propiedad" en el navegador | Verificación en el servidor (token derivado del PIN + pepper) |
| Anti-fuerza-bruta en `localStorage` | Límite en base de datos: 8 fallos/15 min por congregación+IP, 40 por IP, 300/h por congregación |
| El PIN de congregación descargaba también el payload maestro | Solo recibe `payload_public`; el maestro únicamente con el PIN maestro |
| El PIN de congregación podía sobrescribir el payload maestro | Solo puede escribir `payload_public` |
| Realtime sobre la tabla | Sondeo cada 30 s a la función |

## Archivos

- `supabase/migrations/20261022_01_sync_auth_prepare.sql` — aditiva, segura antes de desplegar.
- `supabase/migrations/20261023_03_personal_pin_verifiers.sql` — agrega personal_verifiers para validación segura de PINs personales.
- `supabase/migrations/20261022_02_sync_lockdown.sql` — el cierre. **Solo al final.**
- `supabase/migrations/20261022_99_rollback_lockdown.sql` — emergencia (reabre el acceso inseguro).
- `supabase/functions/kongre-sync/{core.ts,index.ts}` y `supabase/config.toml.snippet`.
- `src/services/syncApi.ts` (nuevo) y 4 archivos modificados (ver `cambios-src.patch`).
- `test/` — pruebas del servidor y de integración cliente↔servidor.

## Orden de despliegue (importa)

1. **Respaldo**: Dashboard → Database → Backups (o `supabase db dump`).
2. **Migración 01** en el SQL Editor.
3. **Pepper y secretos** (guarda el pepper en un gestor de contraseñas; si lo pierdes o lo cambias, todos los accesos quedan inválidos):
   ```bash
   supabase link --project-ref rceyevhwhtjshsthrrtp
   supabase secrets set KONGRE_SYNC_PEPPER="$(openssl rand -base64 48)"
   supabase secrets set ALLOWED_ORIGINS="https://TU-DOMINIO,http://localhost:3050"
   supabase secrets set LEGACY_CLAIM=true
   ```
4. **Desplegar la función** (añade el snippet de `config.toml.snippet` a tu `supabase/config.toml`):
   ```bash
   supabase functions deploy kongre-sync --no-verify-jwt
   ```
   Prueba de humo (debe responder `401 invalid_credentials`):
   ```bash
   curl -s -X POST https://rceyevhwhtjshsthrrtp.supabase.co/functions/v1/kongre-sync \
     -H 'Content-Type: application/json' \
     -d '{"action":"meta","id":"PRUEBA1","tokens":{"master":"'$(printf 'a%.0s' {1..64})'"}}'
   ```
5. **Copiar los archivos de `src/`** sobre tu proyecto, probar en local (`npm run dev`) y publicar la app.
6. **Reclamar tus congregaciones existentes** (mientras `LEGACY_CLAIM=true`): desde el dispositivo del coordinador
   con datos actualizados, abre la app nueva y pulsa "Sincronizar con Supabase". Eso registra los verificadores.
   Repite por cada congregación y comprueba entrando desde otro dispositivo o ventana privada.
   > La fila sin reclamar no se puede leer por nadie (ni por quien tenga el PIN) hasta que alguien la reclame;
   > mientras `LEGACY_CLAIM=true`, quien suba primero con un ID existente la reclama. Hazlo enseguida y apaga el flag.
7. `supabase secrets set LEGACY_CLAIM=false`. Para ver filas sin reclamar:
   `select id_congregacion, created_at from sync_queue where master_verifier is null;`
8. **Migración 02** (el cierre). Las versiones antiguas de la app dejan de sincronizar; los usuarios deben recargar/actualizar la PWA.
9. Verifica con las consultas comentadas al final de la 02 (deben devolver 0 filas).

## Qué probé y qué no

Probado: lógica de autorización (11 pruebas), integración del `syncApi.ts` real contra el servidor real,
migraciones sobre PostgreSQL 16 replicando el estado inseguro de tus CSV, `tsc` sin errores y `vite build` correcto.

**No probado**: la función corriendo en Deno/Supabase real (no hay Deno aquí) ni contra tu proyecto. Haz la
prueba de humo del paso 4 y un ciclo completo (alta → login → sync) en una congregación de prueba antes de cerrar.

## Riesgos que siguen abiertos

- **Cualquier publicador con el PIN de congregación puede reescribir `payload_public`** (nombres, roles que viajen ahí).
  Siguiente paso: acción dedicada para enviar informes y firmar el payload público con la clave maestra.
- **La fuerza del PIN maestro sigue importando.** El límite frena ataques en línea, pero un atacante con muchas IPs
  tiene un tope de ~300 intentos/hora por congregación. Exige PIN maestro de 8+ caracteres.
- El límite por IP depende de `cf-connecting-ip` (es el mejor esfuerzo); el tope por congregación es la red de seguridad.
  Contrapartida: un atacante con muchas IPs puede bloquear 5 min a todos los usuarios de una congregación.
- **Fuera de alcance de este cambio** (siguen pendientes de mi revisión anterior): los hashes de PIN personal dentro del
  payload público, la firma de rol con clave embebida, el "cifrado en reposo" XOR y la matriz de permisos.
- El soporte de rotación de PIN (`rotateFrom` / `rotate_to`) existe y está probado, pero la app no tiene hoy
  un flujo de "cambiar PIN maestro", así que no está conectado a ninguna pantalla.

## Dos bugs preexistentes que corregí de paso

- `JoinCongregationModal.tsx`: `verifySecureLocalPin` se usaba sin importarla (rompía la comprobación de coordinador).
- `CongregationContext.tsx`: `mergePublishers` se usaba sin estar importada/exportada (fallaba al hidratar listas casi vacías).
