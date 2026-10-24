# 📋 Registro de Versiones y Novedades — Kongre

Bienvenido al historial oficial de actualizaciones de **Kongre**. Aquí encontrarás de manera clara y sencilla todas las nuevas funciones, mejoras visuales y medidas de seguridad incorporadas en cada versión para la gestión teocrática de tu congregación.

---

## 🚀 Versión Actual

### [v2.12.8] — 23 de Octubre, 2026
**Navegación Fluida en el Portal y Corrección en Menú de Google**

- 🧭 **Sincronización Precisa de Pantalla y Enlace:**
  - Se corrigió un problema donde refrescar la página en `#portal` mostraba la pantalla de inicio con Google en lugar del portal principal.
  - La barra de direcciones ahora refleja exactamente la opción en la que te encuentras (Google, Conectar con ID y PIN, o Invitación) y permite retroceder o refrescar sin perder tu ubicación.
- 🧹 **Higiene de Sesión:**
  - Al pulsar "Volver" o usar las flechas del navegador para regresar al portal de bienvenida, las pantallas temporales de inicio de sesión se limpian de inmediato.

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.7] — 23 de Octubre, 2026
**Blindaje de Privacidad en Vista Personal, Cierre por Inactividad y Protección del Sistema**

- 🔒 **Mayor Privacidad en Vista Personal:**
  - El PIN de acceso ahora se conserva únicamente en la memoria de la sesión activa y se cifra de forma segura en tu dispositivo. Al cerrar sesión, todas las credenciales temporales se purgan de inmediato.
  - **Auto-cierre por Inactividad (5 min):** Para proteger la privacidad en dispositivos o tabletas compartidas en el Salón del Reino, el portal personal se cierra automáticamente tras 5 minutos sin uso.
  - **Protección contra Intentos Repetidos:** Si se ingresa un PIN erróneo varias veces consecutivas, la pantalla muestra una cuenta regresiva visual (`⏳ Bloqueo de seguridad: espera Xs`) e inhabilita temporalmente el teclado para impedir intentos automatizados.
  - **Protección de Navegador:** Se activaron atributos para evitar que navegadores compartidos guarden o autocompleten el PIN personal sin autorización.
  - **Respuesta Táctil:** Vibración suave y animación de sacudida para confirmar errores de PIN de forma clara e intuitiva.

- ⚡ **Sincronización más Estable y Rápida:**
  - El servidor valida de forma estricta los identificadores de publicadores y limita la carga a un máximo de 500 hermanos por congregación, evitando sobrecargas de procesamiento y asegurando un servicio ágil para todos.
  - Se bloquean intentos maliciosos de saturar la base de datos con consultas inválidas.

- 🛡️ **Seguridad contra Manipulación de Permisos:**
  - La pantalla de bloqueo y los permisos de usuario están blindados para impedir que se omita la seguridad simulando un modo de demostración en una congregación real.
  - Las credenciales de rol quedan firmadas criptográficamente y ligadas de forma única a tu dispositivo y a tu congregación activa, impidiendo su reutilización en otros salones o dispositivos.

- 📄 **Registro de Auditoría Seguro:**
  - Las acciones registradas en el historial de auditoría enmascaran cualquier número de PIN o identificador sensible mediante claves de seguridad, impidiendo que terceros puedan deducir credenciales a partir de los registros.
  - Detección y ocultamiento automático de contraseñas accidentales en las descripciones de eventos (`••••`).

---

## 📅 Historial de Actualizaciones Anteriores

### [v2.12.6] — 23 de Octubre, 2026
**Cifrado de Grado Militar en el Dispositivo, Navegación Protegida y Salto de Seguridad OWASP**
- **Cifrado Fuerte de Datos Sensibles:** Los datos de salud, contactos de emergencia y teléfonos personales en tu dispositivo ahora se protegen con cifrado de flujo por bloques de última generación ligado al hardware del dispositivo.
- **Protección Web Estricta (CSP Bloqueador):** La aplicación no permite la ejecución de scripts no autorizados ni enlaces externos sospechosos, garantizando un entorno totalmente blindado.
- **Limpieza de Credenciales en la Barra del Navegador:** Ningún enlace o código QR deja contraseñas visibles en la barra de direcciones; las URLs se limpian al instante al cargar.

### [v2.12.5] — 23 de Octubre, 2026
**Seguridad Web en Producción y Optimización de Memoria**
- **Protección contra Secuestro de Clics (Clickjacking):** La app no puede ser incrustada en páginas externas no autorizadas.
- **Rendimiento Mejorado Fuera de Línea:** Almacenamiento optimizado para que la app instalada en móviles funcione más rápido sin consumir almacenamiento innecesario.

### [v2.12.4] — 23 de Octubre, 2026
**Invitaciones de Alta Seguridad y Facilidad de Entrada**
- **Códigos Imposibles de Adivinar:** Los nuevos códigos de invitación para publicadores y ancianos adoptan 10 caracteres aleatorios de alta seguridad (`KONG-[ROL]-XXXXX-XXXXX`).
- **Escritura Flexible:** Puedes escribir o pegar tu código con o sin guiones, con o sin el prefijo `KONG-`, o en minúsculas. El sistema lo reconoce y valida automáticamente.

### [v2.12.3] — 23 de Octubre, 2026
**Minimización de Datos en Nube (Ley 1581 de Protección de Datos)**
- **Mayor Reserva de Informes:** Los informes mensuales de predicación personales y correos electrónicos de los hermanos se retiraron del contenido público general, quedando reservados exclusivamente para el cuerpo de ancianos.
- **App Más Ligera:** Depuración profunda de componentes internos, reduciendo el peso de la aplicación.

### [v2.12.2] — 23 de Octubre, 2026
**Protección de Datos Médicos, Dominio Oficial y Enlaces Temporales**
- **Dominio Oficial:** Lanzamiento en la dirección web oficial `https://kongre-app.com` con conexión cifrada de alta velocidad.
- **Protección Médica y DPA:** Alergias, directivas médicas anticipadas y notas pastorales se guardan cifradas en el dispositivo del hermano autorizado.
- **Enlaces con Caducidad:** Los enlaces compartidos y códigos QR expiran automáticamente a los 7 días y no transportan claves de congregación.

### [v2.12.1] — 23 de Octubre, 2026
**Acceso con Google en 1 Clic y Pantalla Completa**
- **Acceso Directo con Google:** Ya no es necesario hacer doble clic; la aplicación recuerda tu congregación y te conecta automáticamente al iniciar sesión.
- **Diseño Amplio de Bienvenida:** Las ventanas de acceso aprovechan todo el ancho de la pantalla, con campos simétricos para el ID y el PIN de la congregación.

### [v2.12.0] — 23 de Octubre, 2026
**Sincronización en la Nube de Cero Conocimiento**
- **Arquitectura Privada:** Nueva sincronización donde el servidor en la nube nunca conoce las contraseñas, los PINs ni el contenido íntimo de tu congregación.

---

### [v2.10.8] — 21 de Octubre, 2026
**Más Espacio en Pantalla y Arranque Directo con Contenido**
- **Más Espacio Vertical:** Se eliminaron tarjetas y encabezados que duplicaban el nombre de la sección en 27 módulos. Toda la aplicación arranca de inmediato con sus tablas, filtros y herramientas útiles.
- **Barra de Navegación Unificada:** La barra superior fija muestra siempre tu congregación y sección actual con un diseño limpio estilo Notion y Linear.

### [v2.10.7] — 21 de Octubre, 2026
**Reloj Animado de Bloqueo por Inactividad y Alerta Suave**
- **Contador en Barra Superior:** Chip interactivo con anillo de progreso y cuenta regresiva de minutos restantes de inactividad.
- **Aviso Flotante en los Últimos 60 Segundos:** Alerta suave en la parte inferior de la pantalla antes del bloqueo; tocar cualquier parte restablece el tiempo al instante.
- **Selector de Tiempo en Ajustes:** Deslizador para configurar el bloqueo automático entre 5, 10 o 15 minutos según las necesidades del salón.

### [v2.10.5 & v2.10.6] — 21 de Octubre, 2026
**Botón de Modo Oscuro Minimalista y Herramientas Agrupadas**
- **Transición Sol ⇄ Luna:** Nuevo botón con animación fluida y alto contraste en modo oscuro para facilitar la lectura nocturna.
- **Herramientas de Ajustes en una Sola Fila:** Los botones "Guardar Ajustes" y "Mi Perfil" se integraron en la misma fila que las pestañas para mayor comodidad.

### [v2.10.4] — 21 de Octubre, 2026
**Sincronización Total de 20 Módulos y Guardado Automático**
- **Guardado Automático:** Cambios en programas de reunión, territorios, discursos, asistencia, carritos, paneles eléctricos y mantenimiento se sincronizan solos en segundo plano.
- **Cola sin Conexión Confiable:** Si estás sin internet en el Salón o en el territorio, tus registros se guardan en el teléfono y se suben solos al restablecerse la conexión.

### [v2.10.0 a v2.10.3] — 21 de Octubre, 2026
**Suite del Publicador, Gestos Táctiles y Accesos Directos Móviles**
- **Herramientas para el Ministerio:** Cronómetro de predicación persistente (sigue contando al bloquear el teléfono), meta mensual de horas, agenda de revisitas con enlace a WhatsApp y control de lecciones de cursos bíblicos.
- **Gestos Móviles (Swipe):** Deslizar el dedo desde el borde abre y cierra el menú lateral con total fluidez.
- **Modo Atril a Pantalla Completa:** Vista amplia sin distracciones para oradores y presidentes de reunión.
- **Icono Oficial e Instalación Móvil:** Accesos directos al mantener presionado el icono de la app en Android y iPhone (*Programación, Territorios, Asistencia y Anuncios*).

---

### [v2.9.0 a v2.9.2] — 20 y 21 de Octubre, 2026
**Formatos Oficiales en Local, Avisos Push y Gestión de Roles**
- **Llenado Local de Formatos Oficiales (S-21, S-89, S-140, S-88):** Completa papeletas e historiales en PDF directamente desde tu navegador sin subir documentos oficiales a la nube.
- **Notificaciones Push en Segundo Plano:** Recordatorios de asignaciones y turnos que llegan a tu teléfono móvil incluso si la app o el navegador están cerrados.
- **Gestor de Roles a Pantalla Completa:** Panel interactivo para asignar y renovar PINs personales y enviar credenciales por WhatsApp con un solo clic.

---

### [v2.0.0 a v2.8.12] — Resumen de Fundamentos de Kongre
- **Gráficos de Tendencias de Asistencia:** Estadísticas mensuales del año de servicio y comparación presencial vs. Zoom.
- **Territorios Digitales y Mapas:** Asignación de territorios con enlaces QR y direcciones de no visitar.
- **Control de Acceso por Roles (RBAC):** Privilegios diferenciados para Coordinador, Ancianos, Siervos Ministeriales, Precursores y Publicadores.
- **Modo Fuera de Línea (PWA):** Aplicación instalable en teléfonos, tabletas y computadoras que funciona 100% sin conexión a internet.
