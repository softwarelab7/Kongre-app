# Modelo de seguridad de Kongre

Este documento describe qué protege cada credencial, qué **no** protege y las decisiones de arquitectura teocrática establecidas para el ecosistema Kongre.

---

## Niveles de acceso y Credenciales

| Nivel | Credencial | Qué permite en el servidor |
|---|---|---|
| **Maestro** | PIN maestro de la congregación (12 dígitos numéricos de alta entropía) | Leer y **escribir** (`push`), rotar credenciales, acceso a auditorías y comités |
| **Público** | PIN de congregación (mínimo 8 caracteres, soporta passphrases de hasta 24) | Descifrar y leer el `payload_public` (agenda, asignaciones públicas y tablero) |
| **Personal** | PIN personal del publicador (mínimo 6 dígitos) | Verificar identidad, token de rol firmado (`kgr_srt1`) y descifrado de su tarjeta S-21 |

El servidor nunca almacena ni conoce los PINs en texto claro. El cliente deriva un token criptográfico determinista con PBKDF2-SHA256 (600.000 iteraciones en la versión actual, garantizando paridad de coste computacional con el cifrado de datos y soportando actualización transparente desde 100.000 iteraciones heredadas) y el servidor almacena únicamente `HMAC(pepper, rol|id|token)`. Por tanto, `KONGRE_SYNC_PEPPER` es el secreto maestro del servidor y jamás debe modificarse en producción para no invalidar las sesiones activas.

---

## Decisiones de Arquitectura y Seguridad (Directrices Oficiales)

### 1. Creación Descentralizada de Congregaciones (Sin código de invitación)
- **Decisión:** El registro de nuevas congregaciones permanece **abierto y descentralizado**, sin exigir un código de invitación inicial ni aprobación previa por correo.
- **Justificación:** Preserva la soberanía, anonimato y modelo Zero-Knowledge de cada cuerpo de ancianos. Ningún servidor ni administrador global actúa como guardián o punto de fallo central.
- **Protección contra abuso:**
  1. *Límite por IP en Edge Function:* Máximo 5 creaciones por hora por dirección IP (`LIMITS.create`).
  2. *Entropía del PIN Maestro:* Generación de 12 dígitos aleatorios vía CSPRNG Web Crypto (rechazando secuencias triviales o repetitivas).
  3. *Inmutabilidad de ID existente:* Rechazo si el ID de congregación ya fue registrado previamente en Supabase.

### 2. Normalización de PINs y Plan de Migración (Soporte de Símbolos y Passphrases)
- **Estado Actual (`v1/v2`):** `normalizePin` convierte a mayúsculas y suprime caracteres no alfanuméricos (`[^A-Z0-9]`). El formateador de PIN de congregación admite entre 8 y 24 caracteres (formato `XXXX-XXXX` estándar o bloques extendidos `XXXX-XXXX-XXXX...` para passphrases de mayor entropía resistente a ataques offline por GPU).
- **Plan de Migración Transparente hacia `v3`:**
  - *Fase 1 (Derivación Dual en Cliente):* Al verificar un PIN o descifrar un payload, el cliente intenta primero la derivación con el PIN exacto Unicode NFKC (`pin.trim()`). Si falla el tag de autenticación en AES-GCM, reintenta automáticamente con `normalizePin(pin)`.
  - *Fase 2 (Auto-actualización Silenciosa):* Al comprobar con éxito una clave en formato legado durante una sesión con permisos de escritura, el cliente recalcula el verificador a 600.000 iteraciones y lo envía a Supabase en el siguiente push.
  - *Fase 3 (Deprecación de Limpieza Alfanumérica):* Una vez completada la ventana de migración, se consolida la compatibilidad total con símbolos (`@`, `#`, `!`, `-`, `_`, etc.) sin riesgo de bloqueo para usuarios existentes.

### 3. Modelo Criptográfico y Segregación de Roles

#### A. Modelo en Producción Actual: E2EE Jerárquico + RBAC Verificado por Servidor
- **Cifrado E2EE a Nivel de Congregación:** El servidor solo almacena dos paquetes cifrados opacos:
  1. `payload`: Cifrado con la Clave Maestra derivada del PIN Maestro (`K_master`). Exclusivo para el cuerpo de ancianos. Contiene el snapshot completo (publicadores, comités, cuentas, territorios detallados, auditorías).
  2. `payload_public`: Cifrado con la Clave de Congregación (`K_pub`). Accesible para todos los miembros con el PIN de la congregación (programas de reuniones, tablero general, anuncios).
- **Segregación por Rol (RBAC en Cliente):**
  - La separación departamental de pantallas y funciones en la aplicación cliente se controla mediante **RBAC (Role-Based Access Control)**.
  - Para siervos ministeriales y publicadores, la identidad y privilegios se autentican mediante verificación de PIN personal en la Edge Function, la cual emite un token de sesión de rol firmado con HMAC (`kgr_srt1`).
- **Custodia de Credenciales:** En la arquitectura actual, quien posee el PIN Maestro tiene acceso al snapshot íntegro de la congregación. El cuerpo de ancianos debe salvaguardar el PIN Maestro y no compartirlo fuera del cuerpo.

#### B. Sobres Criptográficos Departamentales (En Validación Técnica)
- El motor de sobres cifrados departamentales (`EncryptedCompartmentEnvelope` en `src/utils/security/compartments.ts` y validado en `test/compartments.test.ts`) implementa el cifrado de datos específicos de departamento mediante claves independientes (`K_dept`).
- Su activación en la sincronización en red está planificada como una fase posterior para asegurar una gestión robusta de rotación de claves entre siervos ministeriales.

### 4. Concurrencia Optimista y Detección de Conflictos (Anti-Sobrescritura)
- El cliente envía en cada `syncPush` la marca de tiempo `expected_version` correspondiente a la versión remota leída en el último `syncPull`.
- Si otro anciano ha guardado cambios en la nube en el intervalo, el servidor detecta el desfase de versión y devuelve HTTP `409 Conflict` (`conflict_detected`), alertando al usuario para sincronizar primero y evitando pérdida silenciosa de modificaciones concurrentes.

### 5. Protección de Datos de Especial Sensibilidad (RGPD Art. 9 / Ley 1581)
- La afiliación religiosa, directivas médicas (DPA / Voluntad Anticipada), contactos de emergencia e informes de servicio constituyen **datos de categoría especial**.
- **Salvaguardas en Reposo:**
  - Toda persistencia en `localStorage` pasa obligatoriamente por `sanitizePublishersForLocalStorage`, eliminando PINs en texto claro y cifrando campos sensibles.
  - La información médica confidencial y notas de pastoreo emplean cifrado local granular `kgr_sec4` respaldado por la bóveda `atRestVault` con CryptoKeys AES-GCM no extraíbles en IndexedDB.

---

## PINs Personales

- Los PINs personales **nuevos** exigen 6 dígitos numéricos como mínimo (aumentando el espacio a 1.000.000 de combinaciones).
- La protección activa contra ataques de fuerza bruta en línea es el límite estricto del servidor: máximo 6 intentos fallidos por hora por publicador.
- **Esquema v2 de Sal Única:** La sal del token incluye el `publisherId` (`kongre-personal-pin-v2|congId|publisherId`), impidiendo que dos publicadores con el mismo PIN compartan el mismo verificador hash en Supabase.

---

## Almacenamiento en el Dispositivo (En Reposo)

- Los PINs y credenciales persistidos en el almacenamiento local se cifran mediante `atRestVault` utilizando una CryptoKey AES-GCM no extraíble (`extractable: false`) respaldada por IndexedDB.
- Esta medida evita la copia no autorizada de archivos de almacenamiento hacia otros dispositivos o navegadores.
- Los datos médicos (DPA) y notas pastorales confidenciales utilizan cifrado granular complementario (`kgr_sec4`) en reposo.

---

## Lista de Comprobación antes de Publicar en Producción

1. [ ] `KONGRE_SYNC_PEPPER` configurado en Supabase con al menos 32 caracteres aleatorios seguros.
2. [ ] `ALLOWED_ORIGINS` configurado en Supabase incluyendo el dominio web (`https://www.kongre-app.com`) y los orígenes de la app de escritorio (`tauri://localhost` y `http://tauri.localhost`).
3. [ ] `LEGACY_CLAIM` desactivado en las variables de entorno de la Edge Function tras finalizar la migración inicial.
4. [ ] Edge Function desplegada **antes** de actualizar la aplicación en producción:
   ```bash
   supabase functions deploy kongre-sync --no-verify-jwt
   ```
5. [ ] Migraciones SQL ejecutadas en orden cronológico formal:
   - `20261022000001_sync_auth_prepare.sql`
   - `20261022000002_personal_pin_verifiers.sql`
   - `20261022000003_sync_lockdown.sql` (aplicar al final para bloquear endpoints obsoletos).
6. [ ] Logs de la Edge Function revisados tras el despliegue para confirmar que no existan advertencias de orígenes abiertos ni reclamo legado activo.
