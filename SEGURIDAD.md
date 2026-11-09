# Modelo de seguridad de Kongre

Este documento describe qué protege cada credencial, qué **no** protege y las decisiones de arquitectura teocrática establecidas para el ecosistema Kongre.

---

## Niveles de acceso y Credenciales

| Nivel | Credencial | Qué permite en el servidor |
|---|---|---|
| **Maestro** | PIN maestro de la congregación (12 dígitos numéricos de alta entropía) | Leer y **escribir** (`push`), rotar credenciales, acceso a auditorías y comités |
| **Público** | PIN de congregación (mínimo 8 caracteres, soporta passphrases de hasta 24) | Descifrar y leer el `payload_public` (agenda, asignaciones públicas y tablero) |
| **Personal** | PIN personal del publicador (mínimo 6 dígitos) | Verificar identidad, token de rol firmado (`kgr_srt1`) y descifrado de su tarjeta S-21 |

El servidor nunca almacena ni conoce los PINs en texto claro. El cliente deriva un token criptográfico determinista con PBKDF2-SHA256 (600.000 iteraciones en la versión actual, garantizando paridad de coste computacional con el cifrado de datos; no existe ninguna derivación más barata aceptada por el servidor) y el servidor almacena únicamente `HMAC(pepper, rol|id|token)`. Por tanto, `KONGRE_SYNC_PEPPER` es el secreto maestro del servidor y jamás debe modificarse en producción para no invalidar las sesiones activas.

---

## Decisiones de Arquitectura y Seguridad (Directrices Oficiales)

### 1. Creación Descentralizada de Congregaciones (Sin código de invitación)
- **Decisión:** El registro de nuevas congregaciones permanece **abierto y descentralizado**, sin exigir un código de invitación inicial ni aprobación previa por correo.
- **Justificación:** Preserva la soberanía, anonimato y modelo Zero-Knowledge de cada cuerpo de ancianos. Ningún servidor ni administrador global actúa como guardián o punto de fallo central.
- **Protección contra abuso:**
  1. *Límite por IP en Edge Function:* Máximo 5 creaciones por hora por dirección IP (`LIMITS.create`).
  2. *Entropía del PIN Maestro:* Generación de 12 dígitos aleatorios vía CSPRNG Web Crypto (rechazando secuencias triviales o repetitivas).
  3. *Inmutabilidad de ID existente:* Rechazo si el ID de congregación ya fue registrado previamente en Supabase.

### 2. Normalización de PINs (Soporte de Símbolos y Passphrases)
- **Una sola normalización (`normalizePinV2`):** NFKC + recorte. Conserva símbolos y mayúsculas/minúsculas, de modo que una frase de paso mantiene toda su entropía. Solo el PIN estándar de congregación (`XXXX-XXXX`) se unifica a mayúsculas con guion. El formateador de PIN de congregación admite entre 8 y 24 caracteres (`XXXX-XXXX` estándar o bloques extendidos para passphrases de mayor entropía resistente a ataques offline por GPU).
- **Sin compatibilidad con esquemas anteriores:** se eliminaron la normalización que suprimía símbolos (`[^A-Z0-9]`), los tokens de 100.000 iteraciones (`master_legacy` / `public_legacy`), el reclamo de filas antiguas (`LEGACY_CLAIM`), el esquema de verificadores de PIN personal sin `publisherId` y la lectura de textos cifrados sin prefijo `v2:`. El proyecto no tenía congregaciones reales en el momento de la limpieza, así que no hay datos que migrar. Un texto cifrado con el esquema anterior se rechaza.

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
- **`expected_version` es obligatorio** en todo `push` sobre una fila existente. Sin él el servidor responde `428 expected_version_required` (y la versión vigente); con una versión que ya no es la actual responde `409 conflict_detected`.
- La comprobación definitiva es un *compare-and-swap* atómico en base de datos (`update … where created_at = <versión leída>`), por lo que dos guardados simultáneos con la misma versión nunca se aceptan ambos. Las versiones se comparan como instantes de tiempo, no como cadenas (Postgres puede devolver `+00:00` donde el cliente guarda `Z`).
- El cliente envía como `expected_version` la marca de la última lectura. Ante un 409/428 descarga la versión de la nube, la fusiona con los cambios locales (`mergeCongregationData`) y reintenta una vez. Solo si falla de nuevo informa al usuario. "Forzar" consiste en leer la versión vigente y usarla como base, nunca en omitirla.

### 5. Protección de Datos de Especial Sensibilidad (RGPD Art. 9 / Ley 1581)
- La afiliación religiosa, directivas médicas (DPA / Voluntad Anticipada), contactos de emergencia e informes de servicio constituyen **datos de categoría especial**.
- **Salvaguardas en Reposo:**
  - Toda persistencia en `localStorage` pasa obligatoriamente por `sanitizePublishersForLocalStorage`, eliminando PINs en texto claro y cifrando campos sensibles.
  - La información médica confidencial y notas de pastoreo emplean cifrado local granular `kgr_sec5` (AES-256-GCM con subclave por registro) cuya clave se deriva de la entropía de la bóveda `atRestVault` (CryptoKey no extraíble en IndexedDB) y del salt del dispositivo. El PIN ya no interviene en esta clave. Los formatos `kgr_sec2`, `kgr_sec3` y `kgr_sec4` ya no se leen (no había datos que migrar); un valor con esos prefijos se conserva sin tocar.

---

## PINs Personales

- Los PINs personales **nuevos** exigen 6 dígitos numéricos como mínimo (aumentando el espacio a 1.000.000 de combinaciones).
- La protección activa contra ataques de fuerza bruta en línea es el límite estricto del servidor: máximo 6 intentos fallidos por hora por publicador.
- **Esquema v2 de Sal Única:** La sal del token incluye el `publisherId` (`kongre-personal-pin-v2|congId|publisherId`), impidiendo que dos publicadores con el mismo PIN compartan el mismo verificador hash en Supabase.

---

## Almacenamiento en el Dispositivo (En Reposo)

- Los PINs y credenciales persistidos en el almacenamiento local se cifran mediante `atRestVault` utilizando una CryptoKey AES-GCM no extraíble (`extractable: false`) respaldada por IndexedDB.
- Esta medida evita la copia no autorizada de archivos de almacenamiento hacia otros dispositivos o navegadores.
- Los datos médicos (DPA) y notas pastorales confidenciales utilizan cifrado granular complementario (`kgr_sec5`, AES-256-GCM) en reposo. Si la bóveda no está disponible (IndexedDB bloqueado) se usa el respaldo `kgr_sec5d` (AES-256-GCM con clave derivada solo del salt del dispositivo, que está en el mismo `localStorage`): protege contra una lectura casual, no contra quien copie el almacenamiento. Al volver a haber bóveda el valor se re-cifra solo a `kgr_sec5`.
- Límite conocido: la clave reside en memoria de la página mientras la app está abierta, por lo que este cifrado protege contra la copia del almacenamiento del navegador, no contra un XSS ni contra alguien con la sesión desbloqueada.

---

## Lista de Comprobación antes de Publicar en Producción

1. [ ] `KONGRE_SYNC_PEPPER` configurado en Supabase con al menos 32 caracteres aleatorios seguros.
2. [ ] `ALLOWED_ORIGINS` configurado en Supabase incluyendo el dominio web (`https://www.kongre-app.com`) y los orígenes de la app de escritorio (`tauri://localhost` y `http://tauri.localhost`).
3. [ ] La variable `LEGACY_CLAIM` ya no existe: si quedó definida en Supabase, elimínala (`supabase secrets unset LEGACY_CLAIM`).
4. [ ] Edge Function desplegada **antes** de actualizar la aplicación en producción:
   ```bash
   supabase functions deploy kongre-sync --no-verify-jwt
   ```
5. [ ] Migraciones SQL ejecutadas en orden cronológico formal:
   - `20261022000001_sync_auth_prepare.sql`
   - `20261022000002_personal_pin_verifiers.sql`
   - `20261022000003_sync_lockdown.sql` (aplicar al final para bloquear endpoints obsoletos).
6. [ ] Logs de la Edge Function revisados tras el despliegue para confirmar que no existan advertencias de orígenes abiertos.
