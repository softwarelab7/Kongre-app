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
| El PIN de congregación podía sobrescribir el payload maestro | **No puede escribir nada** (`403 push_requires_master_tier`); solo el PIN maestro hace `push` |
| Realtime sobre la tabla | Sondeo cada 30 s a la función |

## Archivos

- `supabase/migrations/20261022000001_sync_auth_prepare.sql` — aditiva, segura antes de desplegar.
- `supabase/migrations/20261022000002_personal_pin_verifiers.sql` — agrega personal_verifiers para validación segura de PINs personales.
- `supabase/migrations/20261022000003_sync_lockdown.sql` — el cierre. **Solo al final.** Ojo: `supabase db push` aplica TODAS las migraciones en orden, incluido este cierre. Aplícalo desde el SQL Editor, paso a paso, como indica el procedimiento.
- `supabase/rollback/rollback_lockdown.sql` — emergencia (reabre el acceso inseguro). **Solo para ejecutar a mano** en el SQL Editor si se requiere vuelta atrás. Se movió fuera de `migrations/` porque herramientas como `supabase db push` o `db reset` lo aplicarían automáticamente por orden alfabético después de la `02_lockdown`, reabriendo el acceso público a `sync_queue`.
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
6. **Comprobar que no quedan filas sin verificadores** (el reclamo de filas antiguas ya no existe: una fila sin
   verificadores no pertenece a nadie y nadie puede leerla ni reclamarla). Si el proyecto ya tiene datos de pruebas
   anteriores, bórralos: `select id_congregacion, created_at from sync_queue where master_verifier is null;`
   Crea después la congregación desde la app nueva y compruébala entrando desde otro dispositivo o ventana privada.
8. **Migración 02** (el cierre). Las versiones antiguas de la app dejan de sincronizar; los usuarios deben recargar/actualizar la PWA.
9. Verifica con las consultas comentadas al final de la 02 (deben devolver 0 filas).
   Especialmente comprueba que no existan políticas públicas residuales:
   ```sql
   select * from pg_policies where schemaname='public' and tablename='sync_queue';
   ```
   (debe devolver 0 filas).

## Qué probé y qué no

Probado: lógica de autorización (11 pruebas), integración del `syncApi.ts` real contra el servidor real,
migraciones sobre PostgreSQL 16 replicando el estado inseguro de tus CSV, `tsc` sin errores y `vite build` correcto.

**No probado**: la función corriendo en Deno/Supabase real (no hay Deno aquí) ni contra tu proyecto. Haz la
prueba de humo del paso 4 y un ciclo completo (alta → login → sync) en una congregación de prueba antes de cerrar.

## Riesgos que siguen abiertos

- **Reescritura de payload_public (Resuelto en kongre-sync/core.ts)**: La Edge Function ya exige `tier === 'master'` para ejecutar `push`, respondiendo con HTTP `403 push_requires_master_tier` a cualquier intento de escritura con el PIN de congregación. Por ende, los publicadores solo tienen acceso de solo lectura sobre `payload_public`.
- **La fuerza del PIN maestro sigue importando.** El límite frena ataques en línea, pero un atacante con muchas IPs
  tiene un tope de ~300 intentos/hora por congregación. Exige PIN maestro de 8+ caracteres.
- El límite por IP depende de `cf-connecting-ip` (es el mejor esfuerzo); el tope por congregación es la red de seguridad.
  Contrapartida: un atacante con muchas IPs puede bloquear 5 min a todos los usuarios de una congregación.
- **Cifrado en reposo y Vault (parcial)**: Las claves criptográficas locales (`kongre_v3`) están respaldadas por una `CryptoKey` no extraíble en `IndexedDB` (`extractable: false`) y protegen los PINs locales y campos sensibles puntuales (`address`, `emergencyContact`) con AES-GCM + AAD; los hashes de respaldo de credenciales se generan con PBKDF2 (`200.000` iteraciones). El resto del `localStorage` (`teocratic_app_data_v1`, historial de auditoría, colas offline) sigue en texto claro local.
- **Rotación de Credenciales**: Flujo integrado en el panel de Configuración del Coordinador para rotar el PIN de Congregación y/o el PIN Maestro re-cifrando los payloads y rotando los verificadores en el servidor (`rotate_to` exige que el payload correspondiente venga re-cifrado en la misma petición; si el dispositivo no conoce el PIN de congregación actual se lo pide explícitamente antes de re-cifrar `payload_public`; `settings.congregationPinHash` se actualiza dentro del propio push; longitudes mínimas unificadas en 12 caracteres para el PIN Maestro y 8 para el de congregación).
- **Token de rol firmado por el servidor**: Tras `verify_personal_pin`, la Edge Function emite un token HMAC-SHA256 (`kgr_srt1`, vigencia 30 días) usando `KONGRE_VERIFIER_PEPPER`; `verify_role_token` comprueba la firma **y** revalida contra `personal_verifiers` que el publicador siga activo y conserve el mismo rol/privilegios (revocación y degradación inmediatas en cuanto haya red).

## Dos bugs preexistentes que corregí de paso

- `JoinCongregationModal.tsx`: `verifySecureLocalPin` se usaba sin importarla (rompía la comprobación de coordinador).
- `CongregationContext.tsx`: `mergePublishers` se usaba sin estar importada/exportada (fallaba al hidratar listas casi vacías).
