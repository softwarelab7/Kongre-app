# Registro Oficial de Versiones y Actualizaciones (Changelog) - Kongre

Este documento registra de manera clara y cronológica cada una de las actualizaciones, mejoras, correcciones y nuevas funciones implementadas en **Kongre** a través del entorno de desarrollo **Google AI Studio (Anti-Gravity)**.

---

## 📌 Guía para Desarrolladores / Anti-Gravity (Google AI Studio)

Cada vez que se solicite un cambio o actualización en Google AI Studio / Anti-Gravity, se debe seguir este procedimiento para mantener al usuario informado y garantizar la trazabilidad de los cambios:

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

### [v2.6.0] - 17 de Octubre, 2026 (Compilación Activa)
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
  - **Documento Oficial de Registro de Cambios (`CHANGELOG.md`)**: Estructura formal para auditar cada cambio subido en Google AI Studio (Anti-Gravity).
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
