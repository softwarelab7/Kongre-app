# Registro Oficial de Versiones y Actualizaciones (Changelog) - Kongre

Este documento registra de manera clara y cronológica cada una de las actualizaciones, mejoras, correcciones y nuevas funciones implementadas en **Kongre**.

---

## 📌 Guía para Desarrolladores

Cada vez que se solicite un cambio o actualización en el sistema, se debe seguir este procedimiento para mantener al usuario informado y garantizar la trazabilidad de los cambios:

1. **Incrementar el número de versión** siguiendo versionado semántico:
   - **Parche (v2.5.x)**: Corrección de errores menores, textos, ajustes de estilos visuales.
   - **Menor (v2.x.0)**: Nuevas funciones, nuevos módulos o cambios relevantes en la lógica de negocio.
   - **Mayor (vx.0.0)**: Cambios estructurales masivos en la arquitectura o base de datos.
2. **Actualizar `src/utils/versionLog.ts`**:
   - Modificar la constante `CURRENT_APP_VERSION`.
   - Modificar `BUILD_DATE` con la fecha actual.
   - Añadir una nueva entrada al inicio del arreglo `VERSION_HISTORY`.
3. **Actualizar `package.json`**:
   - Ajustar el campo `"version": "x.y.z"`.
4. **Actualizar este archivo `CHANGELOG.md`**:
   - Agregar la nueva versión en la sección de versiones más abajo con sus puntos clave.

---

## 🚀 Historial de Versiones

### [v2.12.7] - 23 de Octubre, 2026 (Compilación Activa)
**Título:** Auditoría Profunda de Seguridad: Mitigación de DoS en Rate Limits, Purga de PIN en Texto Plano y Blindaje Anti-Bypass
- **Almacenamiento Seguro de PIN en Vista Personal (Mitigación Fuga Texto Plano y Anti-Fuerza Bruta):**
  - Se eliminó el almacenamiento en texto plano en `localStorage.setItem('kongre_session_pin_v2')` en `PersonalViewTab.tsx`.
  - Ahora se utiliza `setSecureLocalPin`, conservando el PIN en memoria volátil de sesión (`sessionStorage`) y cifrándolo en reposo con `kgr_v2:...` derivado de la sal de entropía del dispositivo.
  - Purga completa y limpia de PINs y hashes al cerrar sesión en `PersonalViewTab.tsx`, `Navbar.tsx` y `AuthContext.tsx`.
  - **Temporizador Visual de Bloqueo Anti-Fuerza Bruta:** Al alcanzar el tope de intentos fallidos, la Vista Personal muestra un aviso con cuenta regresiva en vivo (`⏳ Bloqueo de seguridad: espera Xs`) e inhabilita el teclado táctil y el botón de ingreso.
  - **Auto-cierre por Inactividad (5 min):** Para proteger la privacidad en tabletas o dispositivos compartidos del Salón del Reino, el portal personal se cierra y purga credenciales tras 5 minutos sin interacción del usuario.
  - **Blindaje contra Autocompletado del Navegador:** Atributos `autoComplete="one-time-code"`, `data-lpignore="true"` y `data-1p-ignore="true"` para prevenir autoguardado del PIN en navegadores compartidos.
  - **Feedback Háptico y Animación de Sacudida:** Respuesta vibratoria (`navigator.vibrate`) y animación CSS `.animate-shake` ante fallos de autenticación.
- **Mitigación de DoS y Agotamiento de Tabla en Edge Function `kongre-sync`:**
  - En la acción `verify_personal_pin`, se verifica la existencia previa de `publisher_id` en `row.personal_verifiers` antes de instanciar contadores en la tabla `sync_rate_limits`.
  - Si el publicador no existe en la congregación, la solicitud es rechazada de forma estandarizada (`401 invalid_credentials`) sin crear buckets de contadores arbitrarios en Postgres, previniendo ataques de agotamiento de almacenamiento y DoS.
- **Sincronización Transparente de Prefijos con `isEncryptedPinAtRest`:**
  - Se implementó el helper canónico `isEncryptedPinAtRest` para reconocer tanto `kgr_v2:` como `kgr_v1:`, resolviendo inconsistencias en `AuthContext.tsx`, `App.tsx`, `SecurityContext.tsx`, `supabaseSyncService.ts` y `CongregationContext.tsx`.
- **Blindaje Anti-Bypass en Pantalla de Bloqueo y Firmas (Función `isSafeDemoMode`):**
  - Implementación de `isSafeDemoMode()`, que valida que el modo de demostración solo pueda activarse en congregaciones no registradas o de prueba (`DEMO`).
  - Si el usuario se encuentra en una congregación real registrada, cualquier intento de inyección manual de `kongre_demo_mode=true` en DevTools es automáticamente purgado y deshabilitado, impidiendo la elusión de la pantalla de bloqueo (`SessionLockModal`) o la falsificación de firmas de rol.
- **Firma de Rol v2 Ligada a Entropía del Dispositivo:**
  - `signRoleSession` y `verifyRoleSessionSignature` actualizados a `role_sig_v2`, combinando el rol, roles secundarios, constante criptográfica y la sal de hardware/dispositivo (`getDeviceEntropySalt()`).
  - Migración automática de firmas v1 a v2 al iniciar sesión.
- **Protección contra Tablas Arcoíris en Registro de Auditoría:**
  - `sanitizeActorNid` ahora incorpora la sal de entropía del dispositivo al calcular el identificador anónimo de actores que ingresan con PIN, impidiendo ataques de inversión mediante tablas arcoíris precalculadas de 10.000 combinaciones.

### [v2.12.6] - 23 de Octubre, 2026
**Título:** Remediación Integral de Seguridad: Cifrado en Reposo CTR con Tag MAC, CSP Estricta sin Unsafe-Inline y Claves Ligadas a Entropía
- **Cifrado en Reposo no Repetitivo (`kgr_sec3:`, Hallazgo H-02):**
  - Se sustituyó el flujo de cifrado repetitivo cada 30 bytes por un generador de flujo en modo contador (CTR) por bloques de 32 bytes derivados por SHA-256 con nonce CSPRNG de 128 bits.
  - Se incorporó una etiqueta de integridad y autenticación (MAC tag de 16 bytes) para validar la autenticidad antes de descifrar.
  - Compatibilidad total hacia atrás garantizada para registros legados `kgr_sec2:` y texto plano previo.
- **Protección de PINs en Memoria y Cifrado Ligado a Dispositivo (`kgr_v2:`, Hallazgo H-01):**
  - La sesión de credenciales activas del usuario se mantiene en memoria volátil de la pestaña (`sessionStorage`), minimizando la ventana de persistencia en disco.
  - Para persistencia local en `localStorage`, se reemplazó la ofuscación XOR con constante fija por cifrado CTR autenticado (`kgr_v2:`) derivado de la sal de entropía única del dispositivo (`kongre_device_entropy_salt_v1`).
- **Política de Seguridad de Contenido Estricta sin 'unsafe-inline' (Hallazgo H-03):**
  - Se extrajo el script inline de inicialización de tema en `index.html` hacia el archivo estático `/theme-init.js`.
  - Se eliminó `'unsafe-inline'` de `script-src` en la política `Content-Security-Policy` de `vercel.json` y se fijó `KONGRE_CSP=enforce` en el comando de compilación.
- **KDF v2 a 600.000 Iteraciones (Hallazgo M-07):**
  - Se activó `WRITE_KDF_V2 = true` en `src/utils/crypto.ts` para aplicar 600.000 iteraciones PBKDF2-SHA256 (estándar OWASP), manteniendo la capacidad de leer payloads v1 de 100.000 iteraciones.
- **CSPRNG Obligatorio sin Fallbacks a Math.random (Hallazgo L-01):**
  - Creación del helper `getSecureRandomBytes` que arroja excepciones explícitas si la Web Crypto API no está disponible en el entorno, evitando silenciosamente la degradación a generadores pseudoaleatorios predecibles.
  - Eliminación de sesgo de módulo en el algoritmo Fisher-Yates de mezcla de PINs mediante `secureRandomInt` (muestreo por rechazo).
- **Validación de Esquema HTTPS en Mapas (Hallazgo L-02):**
  - Sanitización de `mapUrl` en territorios digitales para requerir estrictamente el esquema `https://`.
- **Navegación Restringida a Mismo Origen en Notificaciones Push (Hallazgo L-03):**
  - Se restringió `openWindow` en el evento `notificationclick` de `public/push-sw.js` para aceptar únicamente rutas relativas del mismo origen.
- **Rechazo Total de Credenciales en URL Directa (Hallazgo L-04):**
  - Bloqueo de parámetros `cpin` o `pin` en texto plano en la barra de direcciones o fragmentos hash, limpiando de inmediato el historial de navegación.

### [v2.12.5] - 23 de Octubre, 2026
**Título:** CSP Activo en Producción, Higiene de PWA Caching y Orígenes Restringidos en Errores 500
- **Content-Security-Policy Activa (Modo Enforce):**
  - Transición definitiva de `Content-Security-Policy-Report-Only` a `Content-Security-Policy` bloqueador en `vercel.json`.
  - Protección estricta contra XSS, secuestro de clics (clickjacking con `frame-ancestors 'none'`) y ejecución de recursos externos no autorizados.
- **Higiene del Service Worker y Optimización de Almacenamiento:**
  - Se eliminó la regla de runtime caching de `*.supabase.co/rest/v1/*` en `vite.config.ts`, la cual resultaba obsoleta tras el bloqueo y migración a Edge Functions.
- **Restricción de Orígenes en Fallos del Servidor:**
  - Se ajustó el manejador global de excepciones en `supabase/functions/kongre-sync/index.ts` para aplicar `corsHeaders(req, env)` en errores 500, asegurando que nunca se exponga un comodín `*` en fallos no controlados.

### [v2.12.4] - 23 de Octubre, 2026
**Título:** Fortalecimiento de Invitaciones: 50 Bits de Entropía Criptográfica y Hash v2 Normalizado
- **Entropía Reforzada a 10 Caracteres Base32 (Crockford):**
  - Los nuevos códigos de invitación adoptan la estructura `KONG-[ROL]-XXXXX-XXXXX` con 50 bits de entropía real ($32^{10} \approx 1.12 \times 10^{15}$ combinaciones).
  - Esto erradica la viabilidad de cualquier ataque de recuperación por fuerza bruta offline con clusters de GPU sobre `payload_public`.
- **Hash Canónico v2 (`inv_h2_`) y Compatibilidad hacia Atrás:**
  - Nueva función `hashInvitationCode` normalizada que permite al usuario ingresar códigos con o sin prefijo `KONG-`, con o sin guiones intermedios, o en minúsculas.
  - Compatibilidad completa preservada con hashes v1 heredados (`inv_h1_`), garantizando que las invitaciones ya emitidas sigan funcionando de forma transparente.

### [v2.12.3] - 23 de Octubre, 2026
**Título:** Minimización de Datos en Nube (Ley 1581) e Higiene de Dependencias (0 Vulnerabilidades)
- **Minimización de Datos en `payload_public` (Ley 1581 / Privacidad):**
  - Se eliminaron los informes mensuales de predicación (`monthlyReports`) del payload público cifrado con PIN de congregación. Los informes de horas y estudios bíblicos ahora residen estrictamente en el payload maestro accesible solo por el cuerpo de ancianos.
  - Se removieron los correos electrónicos personales (`email`) de la lista de publicadores en el payload público, evitando la exposición innecesaria de datos de contacto a cualquier usuario con el PIN de congregación.
- **Higiene de Dependencias y Resolución de Vulnerabilidades (`0 vulnerabilities`):**
  - Desinstalación de librerías innecesarias en el frontend: `express`, `@types/express` y `dotenv`.
  - Actualización limpia de `dompurify`, `esbuild` y `vite` a sus versiones seguras, alcanzando `0 vulnerabilidades` en `npm audit`.

### [v2.12.2] - 23 de Octubre, 2026
**Título:** Blindaje de Seguridad Integral: Cifrado en Reposo (Ley 1581), Cabeceras HTTP y Dominio Oficial
- **Cifrado de Datos Sensibles en Reposo (Ley 1581 / Salud y Contactos):**
  - Implementación de cifrado autenticado AES-256-GCM para todos los datos de salud y contacto en el almacenamiento local (`localStorage`).
  - Notas médicas, alergias, directivas médicas anticipadas, números de teléfono personales, direcciones de domicilio y contactos de emergencia ahora se protegen con el prefijo `kgr_sec2:`, descifrándose únicamente en memoria de manera transparente.
  - Compatibilidad total hacia atrás: registros legados preexistentes se leen sin interrupciones.
- **Cabeceras HTTP de Seguridad Estrictas en Producción:**
  - Configuración completa en `vercel.json` de cabeceras de grado empresarial: `Content-Security-Policy` (modo Report-Only), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Permissions-Policy` y `Cross-Origin-Opener-Policy`.
- **Bloqueo RLS y Verificación de Cierre de Base de Datos:**
  - Tablas públicas en Supabase (`sync_queue`, `publisher_invitations`, `sync_rate_limits`) cerradas con restricción `42501 (Permission Denied)` para cualquier llamada REST directa con clave anónima.
  - Todas las operaciones de sincronización y verificación de PIN personal se ejecutan de manera aislada en la Edge Function `kongre-sync` con limitador de intentos distribuido.
- **Tokens de Enlace Seguros y Generador de PIN:**
  - Los enlaces y códigos QR generados (`kgr_tk1_...`) ya no transportan PINs de congregación ni personales en texto, con expiración estricta de 7 días.
  - Generador de PIN maestro reforzado a 12 dígitos aleatorios criptográficamente seguros.
- **Dominio Oficial y Analíticas en Tiempo Real:**
  - Migración y despliegue exitoso en el dominio propio `https://kongre-app.com` con SSL/TLS gestionado.
  - Integración de `@vercel/analytics` y `@vercel/speed-insights` para monitoreo de rendimiento y experiencia de usuario.
- **Higiene Web y Dependencias:**
  - Incorporación de `rel="noopener noreferrer"` en todos los enlaces externos de la interfaz.
  - Actualización de `esbuild` para resolución limpia de conflictos de dependencias con Vite.

### [v2.12.1] - 23 de Octubre, 2026
**Título:** Transición Fluida de OAuth con Google y Diseño Full-Width en Portal de Acceso
- **Navegación Fluida tras Autenticación con Google:**
  - Se eliminó el problema de tener que hacer clic dos veces en "Iniciar sesión con Google". Ahora la aplicación recuerda la vista pendiente y cambia automáticamente al menú de vinculación congregacional (`email_login`) en cuanto Supabase valida la cuenta de Google.
- **Diseño Limpio de Pantalla Completa (Full-Width) en las Vistas de Acción:**
  - El menú de acceso con Google y el de conexión por ID/PIN ahora aprovechan todo el ancho de la pantalla (`max-w-4xl xl:max-w-5xl`), ocultando la columna promocional estática izquierda y con bordes limpios sin barras superiores moradas.
  - Los campos de ID de Congregación y PIN de Congregación se distribuyen ahora en una cuadrícula simétrica de 2 columnas en pantallas medianas y grandes para una experiencia limpia y equilibrada.
- **Pre-llenado de ID Canónico:**
  - Para publicadores y coordinadores con cuenta ya enlazada en la nube, el sistema recupera y formatea automáticamente su ID oficial (ej: `KGR-XXXX-XXXX`).

### [v2.12.0] - 23 de Octubre, 2026
**Título:** Sincronización Segura vía Supabase Edge Function y Blindaje Criptográfico de PINs y Roles
- Implementación de arquitectura Cero Conocimiento mediante Edge Function `kongre-sync`.
- Eliminación de hashes de PIN en `payload_public` y verificación estricta en servidor.

### [v2.10.8] - 21 de Octubre, 2026
**Título:** Optimización Global de Interfaz: Eliminación de Banner Redundante y Arranque Directo con Contenido en Toda la App
- **Implementación Global de la Opción 1 (27 Secciones y Vistas Refactorizadas):**
  - Se completó la auditoría y refactorización integral de todos los módulos de la aplicación, eliminando tarjetas de encabezado redundantes (`SectionHeader` y contenedores con gradientes pesados) que duplicaban el nombre del departamento o sección.
  - La barra fija superior de navegación (`Navbar.tsx`) se establece de forma definitiva como la **única fuente de verdad** del contexto congregacional y departamental (`[Nombre de Congregación] / [Sección]`).
- **Ahorro de Espacio Vertical (60-90px en Cada Pantalla):**
  - Toda la aplicación adopta la filosofía de diseño moderna de herramientas profesionales (estilo Notion, Linear y Stripe).
  - Cada vista arranca inmediatamente con su contenido útil, filtros, selectores de fecha, cuadrículas de métricas o barras horizontales de píldoras.
- **Barras de Herramientas Directas y Píldoras de Navegación Estandarizadas:**
  - **Ajustes:** Píldoras de pestañas integradas con botones de acción (*Guardar Ajustes* y *Mi Perfil*).
  - **Publicadores:** Barra de acción directa (*Importar CSV*, *Exportar Excel*, *Fusionar*, *Nuevo Publicador*).
  - **Territorios:** Selector de vista en píldoras (*Tarjetas*, *Tabla*, *Mapa*, *S-13*) y botones de acción rápida.
  - **Asistencia:** Conmutador en píldoras (*Dashboard Visual*, *Registro Semanal*) y botón *Contador en Vivo*.
  - **Carritos:** Barra de estado directa con botones (*Copiar para WhatsApp*, *Puntos de Carrito*, *Nuevo Turno*).
  - **Hospitalidad:** Barra compacta con contador de familias, botón *Copiar WhatsApp* y *Nuevo Anfitrión*.
  - **Precursores Auxiliares:** Píldora de formulario S-205, *Imprimir Registro* y *Nueva Solicitud*.
  - **Panel Eléctrico:** Toolbar con conmutador *Modo Edición*, botón de acción rápida *Modo Reunión ON/OFF*, *Imprimir Rótulo* y *Nuevo Circuito*.
  - **Mantenimiento:** Píldora informativa, botón *Imprimir Registro* y *Nueva Ficha de Mantenimiento*.
  - **Informe Sucursal S-1:** Píldora S-1, botones directos de acción (*Copiar Resumen*, *Imprimir S-1*, *Abrir JW HUB*).
  - **Editor de Publicador:** Barra de herramientas superior con navegación atrás, nombre del publicador, estado activo, *Renombrar* y *Guardar Ficha*.
  - **Programa Semanal:** Barra compacta con navegación de semana, selector de vista y fila ergonómica de utilidades (autoasignación, WhatsApp, S-89, S-38, Modo Atril).
  - **Cuentas (S-26 / S-30):** Selector de mes en barra directa, con acciones para *Registrar Ingreso*, *Registrar Gasto* e *Imprimir*.
  - **Literatura:** Píldoras de subpestañas (*Catálogo S-14*, *Pedidos*, *Grupos*, *Recuento Físico*) y acciones inmediatas (*Stock Bajo WhatsApp*, *Imprimir S-14*).
  - **Discursos Públicos:** Píldoras horizontales (*Programa Fin de Semana*, *Bosquejos 1-194*, *Salientes*, *Historial*) y botón *Nueva Salida*.
  - **Memorial y Asambleas:** Píldoras de subpestañas (*Memorial*, *Asambleas*, *Checklist*, *Informe Sucursal*) y botones de acción.
  - **Visita Superintendente:** Fila directa de circuito e información de visita con KPI cards inmediatos.
  - **Tarjetas S-21, Informes S-4, Grupos de Servicio, Tablero de Anuncios, Hojas S-89, Centro de Conflictos, Dashboard de Equidad, Exportar PDF y Gestión de Roles:** Todas adaptadas con píldoras distintivas y barras de herramientas directas sin tarjetas duplicadas.
- **Cero Regresiones y Verificación de Tipos TypeScript:**
  - Verificación `tsc --noEmit` completada con 0 errores; todas las acciones, callbacks, filtros y modales permanecen 100% operativos.

### [v2.10.7] - 21 de Octubre, 2026
**Título:** Reloj Animado de Bloqueo por Inactividad, Anillos SVG de Progreso y Aviso Flotante
- **Chip Contador en Barra Superior (Navbar):**
  - Se integró un chip contador interactivo junto al botón de tema (`AutoLockTimerChip`) con un anillo SVG de progreso de 22px y cuenta regresiva dinámica en formato `mm:ss`.
  - Estados dinámicos de alerta: estado normal (índigo `#4C3AED` / `#9085F4`), estado advertencia en el último minuto (`<= 60s`, color ámbar `#D97706` con pulso suave) y estado crítico en los últimos 30 segundos (`<= 30s`, color rojo `#E11D48` con pulso rápido).
  - Al hacer clic en el chip o al detectar cualquier interacción del usuario (teclado, cursor, pantalla táctil, scroll), el anillo realiza una animación de recarga suave (*refill*) y reinicia la cuenta.
- **Aviso Flotante (Toast) en los Últimos 60 Segundos:**
  - Si el usuario deja la aplicación inactiva y restan menos de 60 segundos para el bloqueo, emerge suavemente en la parte inferior de la pantalla un toast flotante con candado, anillo SVG de 46px y segundero en vivo.
  - Tocar o hacer clic en cualquier parte del aviso o presionar cualquier tecla restablece la cuenta y disuelve el toast de inmediato.
- **Nueva Tarjeta Interactiva en Ajustes de Seguridad:**
  - Se sustituyó el selector desplegable básico por un panel de control interactivo con anillo SVG de 60px que muestra los minutos configurados, switch de encendido/apagado, deslizador continuo de 5 a 15 minutos con marcas numeradas y botones de acceso directo preestablecidos (5 min recomendado, 10 min, 15 min).
- **Cálculo de Inactividad por Fecha Límite (`deadline`):**
  - Implementado en `SecurityContext` mediante marcas de tiempo reales y sincronización con eventos de visibilidad (`visibilitychange` y `focus`), asegurando que si el usuario suspende el móvil o cambia de pestaña por más tiempo del permitido, la sesión se bloquee de forma segura y automática al volver.

### [v2.10.6] - 21 de Octubre, 2026
**Título:** Optimización de Interfaz: Eliminación de Banner Redundante en Ajustes y Arranque Directo con Contenido (Opción 1)
- **Eliminación del Banner Redundante:**
  - Se eliminó la tarjeta envolvente interior `<SectionHeader>` que duplicaba *"Ajustes de la Congregación Central"* justo debajo de la barra fija superior de navegación.
  - La barra superior fija queda ahora como la única fuente fidedigna y no redundante del contexto actual de la congregación y el departamento (`Congregación Central / Ajustes de la Congregación`).
- **Arranque Directo con Contenido:**
  - La sección inicia directamente con el selector de pestañas (Panel de Tarjetas / HUB, Notificaciones, General, Reglas, Invitaciones, Seguridad, Nube, Respaldos, Mantenimiento).
  - Se optimizó el espacio vertical de la vista ganando entre 70 y 90 píxeles útiles en pantalla (diseño moderno y limpio estilo Linear, Notion y Stripe).
- **Barra de Herramientas Unificada y Ergonómica:**
  - Se ubicaron los botones de acción principales (**Guardar Ajustes** y **Mi Perfil**) e indicadores de estado (`Cambios pendientes` / `Sincronizado`) directamente en la misma fila de herramientas que las pestañas, alineados a la derecha.

### [v2.10.5] - 21 de Octubre, 2026
**Título:** Botón de Modo Oscuro Sin Contenedor, Animación Fluida y Luna Blanca Nítida
- **Luna Blanca Brillante en Modo Oscuro:**
  - Se configuró el color de la luna y las estrellas en modo oscuro a blanco nítido (`text-white hover:text-slate-100`), garantizando alto contraste y máxima visibilidad sobre el fondo grafito/slate de la barra superior.
- **Eliminación del Contenedor del Botón de Modo Oscuro:**
  - Se eliminó el contenedor circular envolvente (fondo opaco, borde perimetral, cápsula redondeada y sombras pesadas) del componente `ThemeToggle`.
  - El botón se presenta ahora como un botón de icono unificado con el resto de la barra de navegación y la pantalla de bienvenida (`bg-transparent border-0 shadow-none`), con interacción sutil al pasar el cursor y responder al clic.
- **Animación Original Completa Restaurada:**
  - Se mantiene la física bezier suave original (`cubic-bezier(0.34, 1.3, 0.64, 1)`), con transición de sol a luna, giro de rayos y aparición escalonada de estrellas.

### [v2.10.4] - 21 de Octubre, 2026
**Título:** Auditoría Integral y Persistencia Total de Configuraciones y Datos en Supabase
- **Persistencia Completa de Configuración en Supabase:**
  - Se corrigió el proceso de guardado para transmitir siempre el objeto de configuración resuelto, unificado y validado (`resolvedSettings`), garantizando que días y horarios de reunión, nombre de congregación, PIN hashes, dirección del salón, reglas de conflicto y parámetros de PDF se guarden íntegramente en Supabase sin omisiones ni sobreescrituras parciales.
- **Sincronización Total de Todos los Módulos Teocráticos:**
  - Se integraron al payload cifrado AES-256-GCM y al proceso de sincronización bidireccional los 20 modelos de datos: grupos de predicación, deberes personalizados, discursantes salientes, salidas al servicio del campo, turnos y puntos de carritos, informes mensuales de servicio, visita del superintendente de circuito, conmemoración (memorial), asambleas regionales/circuito, eventos de congregación, programas VMC (CLM), panel eléctrico (breakers), fichas de mantenimiento, solicitudes de precursores auxiliares e informes mensuales S-1 a la sucursal.
- **Guardado Automático en Tiempo Real:**
  - Las acciones en Mantenimiento del Salón, Panel Eléctrico, Hospitalidad, Precursores Auxiliares e Informes Sucursal ahora actualizan sus referencias en memoria y disparan guardado automático debounced directamente a Supabase.
- **Cola Offline con Snapshot Fidedigno en IndexedDB:**
  - Las operaciones registradas sin conexión (asistencia, informes de servicio, territorios) ahora capturan el estado completo de la congregación antes de su almacenamiento sellado en IndexedDB, asegurando una subida íntegra a Supabase cuando se restablece la conexión.

### [v2.10.3] - 21 de Octubre, 2026
**Título:** Eliminación del Pop-up "¿Quién eres?" al Iniciar con PIN
- **Eliminación Total del Modal de Identidad (`IdentityNamePrompt`):**
  - Se eliminó el diálogo emergente que solicitaba "¿Quién eres? Entraste con tu PIN pero aún no tenemos tu nombre" al iniciar sesión con PIN.
  - El acceso mediante PIN ahora es completamente directo, limpio y sin interrupciones ni pantallas secundarias de confirmación de nombre.

### [v2.10.2] - 21 de Octubre, 2026
**Título:** Corrección Definitiva del Icono Oficial de Kongre en Pantalla de Inicio de iPhone (iOS Safari)
- **Iconos Oficiales en PNG RGB de 24 bits (`colorType: 2`, Cuadrado Completo sin Alfa):**
  - Regeneración de `apple-touch-icon.png`, `apple-touch-icon-180x180.png`, `apple-touch-icon-167x167.png`, `apple-touch-icon-152x152.png`, `apple-touch-icon-120x120.png`, `apple-touch-icon-precomposed.png`, `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` respetando estrictamente la geometría oficial del isotipo de la Guía de Marca (`rect x=25 y=26 width=13 height=48 rx=6.5` y chevrón `stroke-width=13` sobre fondo `#4C3AED`).
- **Incrustación Base64 Directa en `<head>` y `manifest.webmanifest`:**
  - En entornos protegidos por proxy o cookies de sesión, el proceso `SpringBoard` / `WebBookmark` de iOS realiza peticiones sin cookies al descargar `/apple-touch-icon.png`, provocando que iPhone no muestre el icono oficial. Ahora `index.html` y `manifest.webmanifest` incluyen el icono oficial de 180x180 directamente en `data:image/png;base64,...` junto con `crossorigin="use-credentials"`, garantizando que iPhone cargue siempre el icono oficial de Kongre de forma instantánea.
- **Detección de Vista Previa (`aistudio.google.com`) en iPhone (`PWAInstallButton.tsx`):**
  - Si el usuario abre la app dentro del contenedor de Google AI Studio en Safari y toca *Compartir → Agregar a inicio*, iOS toma el icono de Google AI Studio en lugar del de Kongre. El asistente de instalación en iPhone ahora es visible en la barra superior móvil, detecta si está dentro de un `iframe` y ofrece un botón directo para abrir la URL exclusiva de Kongre en Safari antes de instalarla.

### [v2.10.1] - 21 de Octubre, 2026
**Título:** Iconos PWA, Pantallas de Carga iOS y Nuevo Selector de Tema Animado (2 Modos: Claro y Oscuro)
- **Selector de Tema Dinámico con Animación Sol ⇄ Luna (`ThemeToggle.tsx` / `ThemeToggleIcon.tsx`):**
  - Implementación del nuevo icono SVG interactivo con transición animada entre Sol (rayos radiantes) y Luna creciente (mordida geométrica con estrellas titilantes).
  - Restricción estricta a dos modos teocráticos optimizados (**Claro** y **Oscuro**), eliminando modos innecesarios para una experiencia más rápida e intuitiva.
  - Compatibilidad total con barras de navegación (`variant="onBrand"` y `--tt-bg`) y prevención de parpadeo (FOUC) en el script inicial de `index.html`.
- **Accesos Directos Nativos de la Aplicación (PWA Shortcuts):**
  - 4 accesos directos al mantener presionado el icono instalado en móviles: **Programación**, **Territorios**, **Asistencia (S-88)** y **Tablero de Anuncios**.
  - Registro sincronizado en `vite.config.ts` y `manifest.webmanifest` con iconos en alta resolución (`96px` y `192px`).
- **Pantallas de Inicio Nativas para iOS y iPadOS (`public/splash/`):**
  - Cobertura completa de imágenes de bienvenida (Splash screens) para toda la gama de iPhone (desde iPhone SE hasta iPhone 16 Pro Max) y iPad Pro/Air/mini.
  - Inclusión de `safari-pinned-tab.svg` monocromo para pestañas fijadas en macOS / Safari.
- **Iconos Monocromáticos para Notificaciones Push en Android:**
  - Integración de `notification-badge-72.png` y `notification-badge-96.png` para iconos limpios en la barra de estado de Android.
  - Actualización de fallbacks en `src/services/notificationService.ts` y en el Service Worker de segundo plano `public/push-sw.js`.
- **Limpieza de Archivos y Correcciones de Tipado Estricto (TypeScript):**
  - Eliminación de `scripts/generate-icons.js` para proteger la nueva identidad visual contra sobrescrituras accidentales.
  - Corrección de tipos en `LocalOfficialFormsCenter.tsx`, `notificationService.ts` (detección de turnos de carritos y publicadores asignados), `PublishersTab.tsx` (actualización de grupos de predicación) y `usePublisherForm.ts`.

### [v2.10.0] - 21 de Octubre, 2026
**Título:** Suite de Funciones para Publicadores, Gestos Táctiles (Swipe) y Menú Independiente de Panorama General
- **Suite de Funciones para Publicadores en el Menú Principal (`MinisterioPublicadorTab.tsx` / `inicio`):**
  - **Cronómetro de Predicación en Vivo y Persistente:** Reloj digital `HH:MM:SS` que continúa contando incluso si se cierra la pestaña o se bloquea el teléfono. Controles de ajuste rápido (`+15m`, `+30m`, `+1h`, `-5m`), selector de modalidad (*De casa en casa*, *Carritos*, *Revisitas*, *Curso bíblico*, *Informal*) y contadores en vivo de revisitas y publicaciones dejadas.
  - **Meta Mensual de Horas y Progreso:** Barra de progreso con selector de metas (*Publicador*, *Precursor Auxiliar 15h/30h*, *Precursor Regular 50h*, *Precursor Especial 100h*) y formulario modal para añadir tiempo manual de salidas anteriores.
  - **Agenda de Revisitas y Personas Interesadas:** Tarjetas completas de contacto con botón directo a Google Maps, enlace a chat de WhatsApp, tema conversado, preguntas pendientes, publicaciones dejadas, horario idóneo, registro en 1 clic de *"✓ Visité hoy"* y conversión inmediata a Estudio Bíblico en 1 clic.
  - **Control de Cursos Bíblicos:** Seguimiento por lección con barra de progreso (*¡Disfrute de la vida para siempre!* de 60 o 3 lecciones), sesiones realizadas en el mes actual, metas espirituales y botón de avance rápido de lección.
  - **Sincronización Automática con el Informe Mensual (S-4):** Traspaso directo de horas acumuladas y estudios bíblicos activos al informe oficial y compartición del informe formateado por WhatsApp.
- **Gestos Táctiles (Swipe) para Menú Lateral en Móviles:**
  - **Swipe-to-Open:** Deslizar desde el borde izquierdo ($\le 45\text{ px}$) hacia la derecha abre el menú lateral suavemente sin tocar la hamburguesa.
  - **Swipe-to-Close:** Deslizar hacia la izquierda en cualquier parte del menú o fondo translúcido cierra el panel de forma instantánea.
  - Tirador visual con icono de flecha en el lateral del cajón y sensor táctil pasivo de borde.
- **Separación de Panorama General (`panorama_general`):**
  - La vista estadística global de la congregación (`ResumenInicioTab`) se ha trasladado a su propio apartado independiente en la barra lateral, menú deslizable y barra inferior móvil, distinguiendo con claridad el ministerio personal del publicador de la supervisión congregacional.
- **Modo Atril con API de Pantalla Completa:**
  - Integración nativa con la API de Fullscreen del navegador con botón etiquetado *"Pantalla completa"* / *"Salir de pantalla completa"* y sincronización bidireccional con eventos nativos del sistema (tecla `Esc`).
- **Optimizaciones Ergonómicas en Dispositivos Móviles:**
  - Rediseño táctil de la consola de presidencia con navegación inferior por pestañas (`Cronómetro`, `Programa`, `Notas`, `Tiempos`), mini-cronómetro sticky y selectores táctiles tipo bottom-sheet.

---

### [v2.9.2] - 21 de Octubre, 2026
**Título:** Suscripción a Notificaciones Web Push en Segundo Plano (Con App Cerrada)
- **Service Worker de Notificaciones en Segundo Plano (`public/push-sw.js`):**
  - Integración completa de `PushManager.subscribe` (estándar Web Push VAPID), `PeriodicSyncManager` (`kongre-assignment-reminders`), `SyncManager` y `TimestampTrigger` junto con una base de datos `IndexedDB` autónoma (`kongre_push_sw_db_v1`) dentro del Service Worker para disparar recordatorios aunque la pestaña o la aplicación estén cerradas.
  - Botones interactivos en cada notificación nativa (**"📅 Ver mis asignaciones"** y **"✅ Enterado"**) que abren o enfocan automáticamente el Portal del Publicador al tocarlos.
- **Gestor de Suscripción Push para Publicadores (`PushSubscriptionModal.tsx`):**
  - Disponible desde el **Portal del Publicador** y **Mi Perfil**, mostrando el estado en vivo del permiso del navegador, el motor del Service Worker y la cola de próximos recordatorios agendados con su fecha y hora de disparo.
  - Configuración personalizada de anticipación (`24h`, `48h`, `72h` o `7 días`), hora preferida del día (`07:00` a `20:00`), segundo recordatorio el mismo día de la reunión (`3h antes`), inclusión de turnos de audio/micrófonos/acomodador/aseo y turnos de carritos.
  - **Modo de Prueba con App Cerrada (5 segundos):** Permite disparar un evento push real con retardo de 5 segundos para minimizar el navegador o bloquear el teléfono y comprobar la alerta en segundo plano.

---

### [v2.9.1] - 21 de Octubre, 2026
**Título:** Bóveda y Rellenador 100% Local de Formatos Oficiales (S-21, S-89, S-140, S-88) y Conexión Integral de Publicadores
- **Centro de Formatos Oficiales 100% en Local (`LocalOfficialFormsCenter` / `localOfficialFormsService.ts`):**
  - En estricto apego a la directriz de la sucursal de no almacenar formatos oficiales en servidores privados ni en la nube, se incorporó un módulo dedicado (disponible en *Formatos Oficiales (Local) y PDF*, *Tarjetas S-21* y *Hojas S-89*) donde el usuario carga los archivos PDF oficiales desde su propio dispositivo.
  - Los archivos se procesan exclusivamente en el navegador (con opción de guardado local en `IndexedDB` del dispositivo o modo exclusivo en memoria RAM temporal de la sesión, más botón de purga inmediata).
  - **Rellenado Automático con `pdf-lib`:** Completa en local **S-21** (individual, por Grupo de Servicio o toda la Congregación en lote multipágina), **S-89** (detectando automáticamente si es plantilla 1x1 o 4x1), **S-140**, **S-88**, **S-13** y **S-26/S-30**.
  - **Inspector AcroForm Interactivo y Vista Previa en Vivo:** Permite buscar y editar manualmente cualquier campo o casilla detectada en el PDF oficial con previsualización inmediata antes de descargar.
- **Conexión y Sincronización Integral del Editor de Publicadores (`PublisherEditor` / `PublishersTab`):**
  - Sincronización bidireccional entre el historial **S-21** del editor (`s21_records`) y los informes mensuales globales (`monthlyReports`).
  - Sincronización automática de **Capitán / Auxiliar de Grupo** (`group_responsibility`) con `preachingGroups`, estados **Activo / Inactivo**, **Precursorado** (`pioneer_type` ↔ `pioneerStatus` en S-1 y S-21 incluso para ancianos y siervos ministeriales), **Ausencias**, **Contactos de Emergencia** y fecha de **Último Pastoreo**.

---

### [v2.9.0] - 20 de Octubre, 2026
**Título:** Gestor Dedicado de Roles Teocráticos a Pantalla Completa y Nuevo Sistema de Íconos
- **Gestor de Roles y PINs a Pantalla Completa (`RolesManagerTab` / `#roles`):**
  - Transformación integral de `RoleSwitcherModal` a una vista dedicada de página completa (`activeTab === 'roles'`), eliminando las restricciones de espacio y barras de desplazamiento anidadas.
  - Implementación de 5 tarjetas interactivas KPI (*Total Hermanos*, *Ancianos*, *Siervos Ministeriales*, *Con PIN Activo*, *Sin PIN*) que funcionan como filtros inmediatos por categoría.
  - Píldoras de PIN individuales con alternador de visibilidad (`••••`), regeneración segura de 4–6 dígitos y copiado de credenciales portátiles.
  - Integración de formato de envío teocrático directo por WhatsApp con detalles de rol y credenciales cifradas E2EE.
  - Selectores de los 16 roles teocráticos con ancho completo y etiquetas sin recorte de texto.
- **Panel "Mi Sesión / Cambiar con PIN":**
  - Módulo de cambio ágil de turno de usuario mediante teclado numérico para entrega de mostrador en el Salón del Reino sin cerrar la app ni perder contexto.
- **Cuentas Nube & QR y Matriz de Permisos Teocráticos:**
  - Panel para aprobación y rechazo en vivo de solicitudes de vinculación de cuentas Google (`accountLinkRequests`).
  - Generación de invitaciones temporales con códigos protegidos contra ataques de fuerza bruta.
  - Matriz interactiva de permisos departamentales que detalla privilegios sección por sección para cada rol.
- **Nuevo Catálogo de Íconos Temáticos y Animados (`NavIcons`):**
  - Incorporación de paquetes de íconos temáticos para departamentos y secciones en modos claro, oscuro e índigo con micro-animaciones SVG.
- **Correcciones de Onboarding y Modo Demo:**
  - Corrección del selector de día de reunión entre semana y fin de semana en `CongregationWelcomeLanding`, `RegisterCongregationWizard` y `JoinCongregationModal`.
  - Refinamiento de la sincronización offline con Supabase en Modo Demo para evitar alertas y mensajes intrusivos.

---

### [v2.8.12] - 20 de Octubre, 2026
**Título:** Rediseño del Menú Móvil y Optimización Integral de Interfaz para Teléfonos
- **Rediseño del Panel de Menú Móvil (`Navbar`):**
  - Unificación de la cabecera del menú en una sola fila compacta con el avatar del usuario, rol activo, accesos rápidos a PIN/Perfil, selector de modo claro/oscuro y botón de cierre.
  - Eliminación de bloques fijos redundantes en la parte superior para liberar **más del 80% de la altura de la pantalla** a la lista de departamentos y secciones (*Reuniones, Secretaría, Predicación, Salón, Supervisión*).
  - Reubicación de la cuadrícula de *Utilidades Rápidas* (*Escáner QR, PINs, Invitaciones, Solicitudes, Conflictos, Auditoría*) al final del área desplazable y compactación del pie del menú en una única barra inferior con versión y cierre/bloqueo de sesión.
- **Optimización Móvil de Cabecera, Barra Inferior y Vistas Principales:**
  - Compactación de la barra superior (`Navbar`) y de la franja `DemoBanner` en pantallas pequeñas para evitar desbordamientos horizontales en teléfonos de `360px–430px`.
  - Mejora ergonómica del `Programa de Reunión VMC` (`ClmScheduleView`), `Calendario General` (`CalendarScheduleView` y estilos móviles para `React Big Calendar`), `Panorama General` (`ResumenInicioTab`) y `Catálogo de Publicadores` (`PublishersTab`).

---

### [v2.8.11] - 20 de Octubre, 2026
**Título:** Eliminación Completa de Funciones de IA Externa y Operación 100% Local Determinista
- **Eliminación de Integración con Gemini AI:**
  - Retirado por completo el servicio `geminiService.ts`, el modal `ClmAiSuggestionsModal`, la dependencia `@google/genai`, y la pestaña/configuración de clave API de Gemini en `SettingsTab`.
- **Operación 100% Local y Determinista:**
  - El Programa de Vida y Ministerio Cristianos (`ClmScheduleView`), el importador de la Guía de Actividades (`MwbImportModal`) y el Tablero de Anuncios (`TableroAnunciosTab`) funcionan íntegramente con algoritmos locales deterministas sin enviar datos a servicios de IA externos.

---

### [v2.8.10] - 20 de Octubre, 2026
**Título:** Capa 6 de Seguridad: Invitaciones Hasheadas en Nube, Protección Anti-Formula-Injection CSV, Guardia RBAC de Modales y Enlaces Firmados
- **Cifrado en Reposo y Hashing SHA-256 de Invitaciones (`SecurityContext` y `supabaseSyncService`):**
  - Cifrado en reposo (`kgr_v1:`) de `kongre_theocratic_invitations_v1` y `kongre_device_sessions_v1` en `localStorage`.
  - Sustitución de códigos de invitación en texto plano dentro de `payload_public` por su hash criptográfico con sal (`codeHash`) y protección anti-fuerza bruta en el canje de invitaciones (`redeemInvitationCode`).
- **Guardia RBAC en Modales Administrativos y Rutas Hash (`#?modal=...`):**
  - Bloqueo de apertura no autorizada mediante manipulación del hash de URL (`#?modal=pines`, `invitaciones`, `vinculacion`, `auditoria`, `conflictos`) en `App.tsx` y validación de permisos a nivel de componente en `PublisherPinsModal`, `InvitationManagerModal`, `AccountLinkRequestsModal` y `AuditLogModal`.
- **Protección contra Inyección de Fórmulas CSV / Excel (CWE-1236) y Sanitización Anti-XSS:**
  - Sanitización de celdas exportadas a CSV/Excel (`sanitizeCsvFormulaInjection`) e importadas desde CSV (`sanitizeImportedCsvText`), protegiendo además las notas espirituales confidenciales durante la exportación.
- **Enlaces Firmados de Confirmación en 1-Clic y Limpieza Total al Cerrar Sesión:**
  - Firma criptográfica `sig` (`computeAssignmentConfirmSignature` / `verifyAssignmentConfirmSignature`) en enlaces de confirmación de asignaciones por WhatsApp con limpieza inmediata de la barra de direcciones, y purga completa de tokens/firmas de sesión en `handleLogout`.

---

### [v2.8.9] - 20 de Octubre, 2026
**Título:** Blindaje Integral de Seguridad Criptográfica en 5 Capas (Zero-Knowledge, Anti-Brute-Force, Tokens QR, Auditoría SHA-256 y Respaldos Firmados)
- **Capa 1 y 2 — Hashing Criptográfico, Cifrado en Reposo y Protección Anti-Fuerza Bruta:**
  - Sustitución de PINs en texto plano por hashes SHA-256 con sal (`personalPinHash`) en `payload_public` y cifrado en reposo (`kgr_v1:`) en `localStorage`.
  - Bloqueo temporal exponencial anti-fuerza bruta persistido en `localStorage` y `sessionStorage` ante intentos fallidos de PIN.
- **Capa 3 — Invitaciones CSPRNG, Tokens QR Cifrados y Firma de Sesión de Rol:**
  - Códigos de invitación generados con `crypto.getRandomValues` (CSPRNG), enlaces directos y códigos QR protegidos con tokens autenticados `kgr_tk1_` y limpieza automática de la barra de direcciones.
  - Firma criptográfica `kongre_role_session_sig_v1` para impedir escalada de privilegios editando `localStorage`.
- **Capa 4 — Propiedad Criptográfica en la Nube, Cola Offline Cifrada y Cadena de Auditoría SHA-256:**
  - Verificación obligatoria de descifrado antes de sobrescribir o borrar registros de congregación en Supabase (`sync_queue`).
  - Cifrado en reposo de instantáneas en `indexedDbQueue` y solicitudes de vinculación, junto con encadenamiento criptográfico SHA-256 (`prevHash` + `integrityHash`) en `auditLogService`.
- **Capa 5 — Sello de Integridad en Respaldos JSON, Sanitización Anti-Prototype-Pollution/XSS y Endurecimiento de Sesiones:**
  - Firma criptográfica SHA-256 (`integritySeal`) y sanitización de PINs al exportar respaldos JSON estándar, más filtrado recursivo contra *Prototype Pollution* y vectores XSS al importar respaldos.
  - Sanitización en reposo de `publisherPinsList` y `userRolesList`, verificación de firma de rol al inicializar `AuthContext` y controles estrictos de acceso por pestaña en `RoleSwitcherModal`.

---

### [v2.8.8] - 19 de Octubre, 2026
**Título:** Optimización de Roles Teocráticos, Ingreso por ID/PIN entre Dispositivos y Códigos de Invitación QR
- **Conexión Multidispositivo por ID y PIN de Congregación:**
  - Actualizado `loadCongregationFromCloud` para recibir directamente el PIN de Congregación y el PIN Personal ingresados por el usuario, permitiendo descifrar desde cero en navegadores o teléfonos móviles nuevos.
  - Eliminado el falso positivo que retornaba datos locales vacíos cuando un ID no existía o el PIN era incorrecto.
- **Sincronización de PIN Personal e Invitaciones en Payload Público:**
  - Enriquecido `payload_public` en `supabaseSyncService` con la estructura de ajustes básicos (`congregationPinHash`), directorio de roles/PINs personales e invitaciones activas, manteniendo privadas las tarjetas S-21 y notas pastorales.
- **Códigos de Invitación Portátiles y Lectura Automática de QR:**
  - Los códigos e invitaciones generados en `InvitationManagerModal` ahora sincronizan automáticamente con Supabase y generan enlaces directos y códigos QR con autocompletado automático (`?invite=...&cong=...&cpin=...`) en la pantalla de bienvenida.
- **Refinamiento de Roles Teocráticos:**
  - Corregido el rol base por defecto para siervos ministeriales sin departamento asignado y eliminada la llamada duplicada a `hydrateCongregation`.

---

### [v2.8.7] - 19 de Octubre, 2026
**Título:** Vista Previa de Documentos PDF antes de Descargar y Orientación de Página
- **Opciones de Orientación de Página (Vertical y Horizontal):** Incorporación de selectores visuales de orientación (*Vertical / Retrato* y *Horizontal / Paisaje*) compatibles con formatos Carta (`216 × 279 mm` / `279 × 216 mm`) y A4 (`210 × 297 mm` / `297 × 210 mm`), persistidos en la configuración de la congregación.
- **Vista Previa del Documento antes de la Descarga (`ExportPdfTab`):**
  - Alternancia en tiempo real entre **Hoja Interactiva** (con geometría proporcional a la orientación elegida y controles de zoom de `75%` a `120%`) y **Documento PDF Real** (visor PDF integrado generado con `jsPDF`).
  - **Modal de Previsualización Previa a la Descarga:** Permite inspeccionar el PDF final (tanto del Programa Mensual como de las Papeletas S-89), alternar orientación o tamaño al instante y confirmar la descarga.
- **Optimización de `pdfGenerator.ts`:** Soporte nativo de orientación dinámica, ajuste inteligente de texto multilínea (`splitTextToSize`), encabezados temáticos según plantilla y numeración automática de páginas.

### [v2.8.6] - 19 de Octubre, 2026
**Título:** Unificación de Barra Inferior, Términos Legales, Botón de Tema y Mejoras Móviles
- **Términos de Uso y Política de Privacidad (`TermsAndPrivacyModal`):** Redacción completa e integración de ventana interactiva con pestañas dedicadas para los *Términos de Uso Teocrático* (propósito, custodia de PINs, uso ético y soporte PWA) y la *Política de Privacidad y Seguridad* (arquitectura Cero Conocimiento, cifrado AES-256-GCM con PBKDF2, minimización de datos, cero publicidad y control total por el Cuerpo de Ancianos).
- **Unificación de la Barra Inferior (`AppFooter`) en PC y Móvil:** Diseño unificado tanto en la portada de bienvenida (`variant="landing"`) como en el interior de la aplicación (`variant="app"`), integrando isotipo oficial, indicador de estado En línea / Modo Offline, enlaces directos a Términos de Uso y Política de Privacidad, insignia de sincronización offline y botón de versión/novedades.
- **Unificación del Botón de Modo Oscuro (`ThemeToggle`):** Estandarización visual e interactiva del selector circular de tema (Claro, Oscuro y Cabina A/V) en la bienvenida móvil (`variant="onBrand"`), cabecera de escritorio y barra superior de la aplicación.
- **Optimización de Bienvenida y Registro en Móvil:** Inclusión de la sección *Funciones de la App* debajo de las opciones de bienvenida en la vista principal móvil (ocultándose automáticamente al entrar en subvistas) y eliminación de contenedores con scroll interno en el asistente de registro de congregación para evitar el doble scroll.

### [v2.8.5] - 19 de Octubre, 2026
**Título:** Soporte Completo de Icono PWA en iPhone (iOS Apple Touch Icon)
- **Corrección del Icono en iPhone (iOS):** Generación de `apple-touch-icon.png` (180x180) y variantes (`152x152`, `167x167`, `precomposed`) con fondo 100% opaco índigo (`#4C3AED`) y sin canal alfa transparente para evitar iconos negros o capturas genéricas en Safari iOS.
- **Manifiesto Web Estándar:** Enlace explícito a `/manifest.webmanifest` en `index.html` y actualización del modal de guía de instalación en iOS con vista previa real del icono.

### [v2.8.4] - 18 de Octubre, 2026
**Título:** Estandarización de Marca Oficial Índigo #4C3AED y Optimización Integral de Activos
- **Redefinición de Escala Tailwind Indigo:** Creación e importación de `src/kongre-indigo.css`, alineando las más de 2.900 clases de Tailwind a los tonos oficiales de la marca (#4C3AED) de forma centralizada y limpia.
- **Configuración Oficial de Manifiesto PWA:** Actualización de `vite.config.ts` estableciendo el color de tema en `#4C3AED`, fondo `#FFFFFF` e íconos limpios (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`).
- **Metadatos OpenGraph y Redes Sociales:** Estandarización de URLs absolutas en `index.html` para la imagen destacada (`og:image` y `twitter:image`), garantizando una correcta previsualización en WhatsApp y redes sociales.
- **Depuración de Activos en `public/`:** Eliminación de archivos obsoletos (`icon.svg`, `pwa-*.png`, favicons redundantes y variantes oscuras previas), y regeneración de todos los logos e íconos en índigo de alta resolución.
- **Uniformidad Gráfica:** Ajuste del componente `KongreLogo` a la variante plana (`flat`) para consistencia milimétrica con los archivos de marca.

### [v2.8.3] - 18 de Octubre, 2026
**Título:** Eliminación Total de Iconos v4 y Estandarización Teocrática con Lucide React
- **Eliminación Integral de Paquete de Iconos v4:** Se removieron por completo más de 250 archivos gráficos y vectoriales redundantes en `/public/icons/` y `/public/anim/`, reduciendo la memoria del Service Worker PWA (más de 8 MB liberados) y aligerando la carga de red.
- **Estandarización Teocrática de Iconos:** La pantalla de bienvenida y los componentes del sistema renderizan de forma directa y nativa los iconos vectoriales de Lucide React, eliminando dependencias y envoltorios de animación artificiales.
- **Limpieza de Componentes Redundantes:** Eliminación de los archivos `src/SectionIconsLinea.tsx`, `src/components/icons/SectionIconsLinea.tsx`, `src/Bienvenida.tsx` y el envoltorio `src/AnimIcon.tsx`.
- **Depuración de Hojas de Estilo:** Retiro de selectores de animación `.kg-ico`, `.kg-m` y `@keyframes` de trazo y movimiento en `kongre-welcome.css`.

### [v2.8.2] - 18 de Octubre, 2026
**Título:** Optimización de Espaciados en Bienvenida PC y Modo Demo Sin Bloqueos
- **Optimización de Espaciados en PC (100% Responsive):** Ajuste de contenedores, espaciados verticales (`py-4 sm:py-6 lg:py-6 xl:py-8`), tipografía con escalado fluido `clamp` y tarjetas de opciones compactas para evitar desbordamientos y permitir visualización completa sin barra de desplazamiento en pantallas de escritorio y portátiles.
- **Aislamiento Estricto de Perfiles en Modo Demo:** Se previene la filtración de avatares guardados en `localStorage` procedentes de sesiones reales o pruebas previas, asignando un perfil limpio de demostración ("Carlos Mendoza") con iniciales por defecto.
- **Eliminación del Bloqueo por PIN en Modo Demo:** Desactivación de modales de bloqueo por PIN, temporizador de inactividad y advertencias de sesión bloqueada mientras se navega en modo de demostración.
- **Actualización de Activos de Marca:** Inclusión y optimización de logotipos e isotipos vectoriales de alta definición en el directorio público.

### [v2.8.1] - 18 de Octubre, 2026
**Título:** Aislamiento Local del Modo Demo (Sin Conexión a Supabase)
- **Desconexión Total de Supabase en Modo Demo:** Bloqueo preventivo en `supabaseSyncService` y `CongregationContext` para evitar que peticiones de subida, descarga o consultas remotas toquen la base de datos de Supabase en modo demostración.
- **Canales en Tiempo Real Desactivados:** Los canales de Supabase Realtime (`sync_queue`) se desconectan y no se abren mientras el modo demo esté activo.
- **Sincronizaciones Periódicas Deshabilitadas:** Se cancela el intervalo en segundo plano de sincronización automática y la subida de cola offline en reconexión de red mientras se use el modo demo.
- **Interfaz Contextualizada:** Se oculta el indicador de nube (`OfflineSyncBadge`) en la barra de navegación y pie de página, y se incluye una advertencia informativa en Ajustes > Nube indicando que los datos operan 100% de manera local.

### [v2.8.0] - 18 de Octubre, 2026
**Título:** Diseño Oficial de Bienvenida para PC / Escritorio (Kongre v3)
- **Cabecera de Escritorio:**
  - Logotipo animado SVG oficial `AnimatedLogo` (34px) con efecto de dibujo y revelación tipográfica.
  - Botón de acceso directo a **Modo Demo** con datos precargados.
  - Selector circular de tema `.tbtn` con alternancia entre 3 modos: **Claro**, **Oscuro** y **Cabina A/V**.
- **Columna de Presentación Teocrática (Izquierda):**
  - Insignia interactiva con destellos animados (`Sparkles`): *«Gestor Teocrático Integral • Seguro y Eficiente»*.
  - Titular principal con gradiente de marca: *«Toda la gestión teocrática de tu congregación, en un solo lugar.»*.
  - Párrafo introductorio optimizado para lectura y contexto teocrático.
  - Cuadrícula 2x2 de características (`.feat`) con separadores superiores sutiles e iconografía teocrática Lucide React:
    - *Reuniones & Guía S-89*
    - *Territorios & Carritos*
    - *Seguridad por Roles & PIN*
    - *PWA & Modo Offline*
- **Tarjeta de Acceso Interactiva (Derecha):**
  - Estructura `.card` con sombra teocrática suavizada y ceja descriptiva (`.eye`) con indicador *«KONGRE • PORTAL DE ACCESO»* y pill *«Gestor Teocrático»*.
  - Opciones de entrada rediseñadas (`.opt`):
    - **Registrar mi Congregación**: Estilo destacado `.main` con badge oficial.
    - **Iniciar sesión con Google**: Vinculación de perfil y asignaciones.
    - **Conectar con ID y PIN de Congregación**: Acceso teocrático directo.
    - **Iniciar sesión con código de invitación**: Acceso de un solo uso por dispositivo con icono del ojo (`Eye`) animado.
    - Acceso exclusivo para publicadores y siervos registrados (se eliminó la opción pública de Invitado/Cartas).
- **Pie de Página Unificado:**
  - Enlaces a Términos de Uso y Política de Privacidad.
  - Indicador de estado en línea y acceso directo al registro de cambios de versión.

---

### [v2.7.0] - 18 de Octubre, 2026
**Título:** Dashboard Visual de Tendencias de Asistencia con Recharts
- **Dashboard Analítico con Recharts:**
  - **Gráficos Compuestos de Asistencia**: Visualización de doble capa (barras y áreas suaves) para observar la evolución de la asistencia mes a mes durante el Año de Servicio teocrático (Septiembre a Agosto).
  - **Filtros Dinámicos**: Posibilidad de alternar entre reuniones Entre Semana, Fin de Semana o vista combinada.
  - **Desglose de Canales (Presencial vs. Zoom)**: Gráficos de barras apiladas y distribución porcentual para monitorear la asistencia física y remota.
  - **Líneas de Referencia y Máximos Históricos**: Indicador visual de promedio anual con identificación del mes pico de asistencia.
  - **Vistas Especializadas**: Modos de visualización por Tendencias Mensuales, Distribución de Canales, Vista Semanal continua y Tabla de Datos con exportación a CSV.
  - **Interconexión Directa**: Botones de acceso rápido entre el dashboard analítico y el registro mensual de asistencia (S-88).

---

### [v2.6.0] - 17 de Octubre, 2026
**Título:** Sincronización en Cola Offline con IndexedDB y Supabase (Zero-Knowledge)
- **Cola de Sincronización Persistente en IndexedDB:**
  - **Almacenamiento Local Garantizado**: Cuando el dispositivo pierde conexión o está en modo offline (por ejemplo, en el Salón del Reino o en el territorio), las modificaciones críticas como la marcación de asistencia (S-88), edición de informes de servicio (S-21 / S-4) o actualizaciones de publicadores se guardan inmediatamente en una cola persistente de **IndexedDB** (`kongre_offline_sync_db`).
  - **Tolerancia a fallos**: Si la red falla a mitad de una petición, la operación se encola automáticamente con descripción legible, datos de contexto y marca de tiempo exacta para garantizar cero pérdida de datos.
- **Sincronización Automática con Supabase:**
  - **Detección reactiva de conexión**: Mediante escucha continua del evento `online` y latido de reconexión, Kongre detecta el restablecimiento de WiFi o red móvil y vacía la cola automáticamente.
  - **Cifrado AES-256-GCM (Cero Conocimiento)**: Los datos encolados se cifran localmente con el PIN maestro antes de subir el snapshot a Supabase, manteniendo la privacidad absoluta de la congregación.
  - **Aclaración y Consolidación de Arquitectura**: Todo el flujo de persistencia en la nube está unificado en Supabase, eliminando dependencias obsoletas de Firebase.
- **Interfaz y Control de Usuario:**
  - **Modal Interactivo de Cola Offline**: Accesible desde el indicador en el pie de página y la barra superior para revisar las operaciones en cola, hora de registro y botón de "Sincronizar ahora con Supabase".
  - **Banner Dinámico de Conectividad**: Notifica en vivo el número exacto de cambios guardados en IndexedDB y el progreso de subida al reconectar.

---

### [v2.5.0] - 17 de Octubre, 2026
**Título:** Registro Oficial de Versiones y Navegación Histórica del Navegador
- **Novedades:**
  - **Pie de página con Registro de Versión**: Se agregó en la parte inferior de la aplicación el número de versión visible (`v2.5.0`) con enlace directo al modal detallado de registro de cambios.
  - **Modal Interactivo de Historial de Versiones**: Ventana que permite inspeccionar todas las versiones, fechas de despliegue, cambios realizados y copiar datos de diagnóstico.
  - **Documento Oficial de Registro de Cambios (`CHANGELOG.md`)**: Estructura formal para auditar cada versión y cambio desplegado en la aplicación.
- **Navegación e Historial del Navegador:**
  - **Soporte de botones Atrás y Adelante**: Compatibilidad total con las flechas de navegación del navegador (o gestos móviles en Android/iOS) para moverse entre las pestañas (`#publicadores`, `#programacion`, `#territorios`, etc.) sin perder el estado ni recargar la aplicación.
  - **Cierre de modales con el botón Atrás**: Al pulsar Atrás con un modal abierto (PINs, selector de rol, etc.), el modal se cierra automáticamente manteniendo la pestaña actual.
  - **Botones Atrás/Adelante en la barra superior**: Se incorporaron botones táctiles de flechas al lado del menú para usuarios en modo PWA o pantallas táctiles.

---

### [v2.4.0] - 16 de Octubre, 2026
**Título:** Autenticación Simplificada por ID y PIN Personal de Publicador
- **Novedades:**
  - **Ingreso directo con ID y PIN Personal**: El flujo de bienvenida permite a cualquier publicador ingresar únicamente con el ID de congregación y su PIN personal asignado por el Coordinador/Cuerpo de Ancianos.
  - **Guardián de Sesión en Tiempo Real**: Si los ancianos revocan, cambian o eliminan un PIN desde el directorio, la sesión en el dispositivo del publicador se cierra de forma inmediata con notificación explicativa.
  - **Protección del PIN de Coordinador**: Se aseguró que la sesión del Coordinador nunca se revoque accidentalmente durante el escaneo de publicadores.

---

### [v2.3.0] - 15 de Octubre, 2026
**Título:** Modo Bolsillo Teocrático, Códigos QR y Confirmación de Asignaciones
- **Novedades:**
  - **Pocket Mode**: Acceso mediante enlace directo (`?cong=...&pub=...&pin=...`) que inicia sesión de forma segura y limpia las credenciales de la barra de direcciones.
  - **Confirmación en 1-Clic por WhatsApp**: Enlace directo para que los publicadores confirmen sus asignaciones estudiantiles o de fin de semana.
  - **Tarjetas Digitales de Territorio Móviles**: Enlaces directos por código QR o WhatsApp (`?territorio=01`) para abrir la tarjeta de territorio digital con mapas Leaflet y direcciones de no visitar.

---

### [v2.2.0] - 14 de Octubre, 2026
**Título:** Sincronización en la Nube y Copias de Seguridad Automáticas
- **Novedades:**
  - Integración híbrida con Supabase y Firestore para respaldo de datos de la congregación.
  - Sistema de respaldo local en JSON y exportación rápida.
  - Detección automática de conectividad y banner de sincronización offline.

---

### [v2.1.0] - 12 de Octubre, 2026
**Título:** Formularios Oficiales S-21, S-88, S-89 e Informes S-1
- **Novedades:**
  - **Tarjetas de Registro de Publicador (S-21)**: Generación, visualización y exportación de tarjetas oficiales con cálculo automático de promedios.
  - **Hojas de Asignación S-89**: Generador e impresión en PDF de asignaciones para la reunión Vida y Ministerio.
  - **Informe a la Sucursal S-1**: Resumen mensual de publicadores activos, precursores, horas y cursos bíblicos.
  - **Registro de Asistencia S-88**: Gráficos interactivos y promedios por reunión de entre semana y fin de semana.

---

### [v2.0.0] - 10 de Octubre, 2026
**Título:** Rediseño Kongre con Tema Oscuro, PWA y Seguridad RBAC
- **Novedades:**
  - Nuevo diseño con paleta de colores teocrática índigo/pizarra, modo oscuro adaptativo y modo cabina de audio.
  - Control de Acceso Basado en Roles (RBAC): Coordinador, Ancianos, Siervos Ministeriales, Precursores y Publicadores.
  - Soporte PWA instalable con funcionamiento 100% fuera de línea.
