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

### [v2.8.3] - 18 de Octubre, 2026 (Compilación Activa)
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
