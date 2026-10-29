# 📋 Registro de Versiones y Novedades — Kongre

Bienvenido al historial oficial de actualizaciones de **Kongre**. Aquí encontrarás de manera clara y sencilla todas las nuevas funciones, mejoras visuales y medidas de seguridad incorporadas en cada versión para la gestión teocrática de tu congregación.

---

## 🚀 Versión Actual

### [v0.1.0-alpha.38] — 28 de Octubre, 2026
**Actualizador Nativo de Escritorio en 1 Clic, Detección de Distribución y Aviso Inteligente para Fedora / Ubuntu**

- ⚡ **Actualizador Nativo en 1 Clic con Tauri Updater & Process (`@tauri-apps/plugin-updater`, `@tauri-apps/plugin-process`):**
  - Soporte de actualización automática sin salir de la app para Windows (`.exe` NSIS), macOS (`.dmg`) y Linux (`.AppImage`).
  - Descarga e instala en segundo plano con barra de progreso reactiva en tiempo real y reinicio automático seguro del sistema.
  - Firma criptográfica Minisign integrada con validación de integridad (`latest.json` y archivos `.sig`).
- 🐧 **Detección Inteligente de Tipo de Instalación (`src-tauri/src/lib.rs`):**
  - Nuevo comando IPC nativo en Rust `install_kind` que inspecciona las variables de entorno (`APPIMAGE`) y `/etc/os-release` para determinar si el usuario corre bajo `linux-rpm` (Fedora, RHEL, openSUSE), `linux-deb` (Ubuntu, Debian, Mint), `appimage`, `windows` o `macos`.
- 🖥️ **Modal Global de Actualización de Escritorio (`DesktopUpdateModal.tsx`, `desktopUpdateService.ts`):**
  - Para usuarios en Fedora (`.rpm`) o Ubuntu (`.deb`): muestra botón de descarga directa del paquete y un comando de terminal listo para copiar con 1 clic (ej. `sudo dnf install ./Kongre-0.1.0-alpha.38-1.x86_64.rpm` o `sudo dpkg -i ./Kongre_0.1.0-alpha.38_amd64.deb`).
  - Para usuarios en Windows, macOS o AppImage: botón directo *«Actualizar ahora en 1 clic»* con descarga asistida y reinicio seguro.
  - Integrado globalmente en la pantalla de bienvenida (`CongregationWelcomeLanding`), la web oficial y las vistas de congregación.
- 🔔 **Insignia Reactiva de Actualización en Cabecera y Pie (`CongregationWelcomeLanding.tsx`, `AppFooter.tsx`):**
  - Botón de cabecera con aviso visual dinámico (*«¡Actualizar PC! v0.1.0-alpha.38»* con anillo pulsante).
  - Botón interactivo de actualización directa en el pie de página junto a la píldora de versión.
- ⏱️ **Verificación Inmediata y Comparación SemVer Estricta (`desktopUpdateService.ts`):**
  - Chequeo inmediato al abrir la aplicación en PC (`force: true`), eliminando la espera de 4 horas de la caché de comprobación anterior.
  - Comparación SemVer formal (`compareVersions`) que asegura que solo se muestren notificaciones ante versiones estrictamente superiores a la instalada.

---

### [v0.1.0-alpha.37] — 28 de Octubre, 2026
**Navegación Directa a Instaladores PC/Móvil, Pestaña de Descargas Dedicada e Historial Reactivo**

- 📥 **Navegación Directa a «Instalar App (PC / Móvil)» desde la Pantalla de Bienvenida (`CongregationWelcomeLanding.tsx`, `KongreOfficialWebsite.tsx`, `App.tsx`):**
  - Al pulsar el botón *«Versión PC»* en la barra superior de la pantalla de bienvenida, la aplicación abre directamente la **Pestaña 3 («Instalar en PC / Móvil»)** de la presentación oficial en lugar de abrir una ventana emergente / pop-up modal.
  - Ofrece acceso simultáneo y organizado a los instaladores nativos para PC (Windows `.exe`, macOS `.dmg`, Ubuntu `.deb`, Fedora `.rpm`, `.AppImage`) y a las instrucciones y código QR para PWA Móvil (Android e iOS).
  - Integración completa con el historial del navegador (`#descargas`, `#downloads`, `#instalar`), permitiendo alternar fluidamente entre las pestañas *«Acerca de Kongre»*, *«Guía de Usuario»* e *«Instalar App»*, y volver al portal con el botón *«Usar Kongre»* o el botón «Atrás».
- 📱 **Sincronización de Accesos en Móvil y Banners de Compatibilidad (`CongregationWelcomeLanding.tsx`):**
  - El botón *«PC»* de la cabecera móvil y las tarjetas de descarga en el flujo de bienvenida ahora dirigen de forma homogénea a la pestaña dedicada de instalación oficial.

---

### [v0.1.0-alpha.36] — 28 de Octubre, 2026
**Optimización Móvil Integral, Select Portaled Bottom-Sheet, Transiciones Ligeras y Empaquetado Rust Multiplataforma**

- 📱 **Selector Desplegable `Select` con Bottom-Sheet Portaled para Móviles (`Select.tsx`):**
  - Implementación de renderizado mediante `createPortal` en `document.body` cuando se detecta un dispositivo móvil (`window.innerWidth < 640px`).
  - Presentación nativa estilo *Bottom-Sheet* modal con fondo oscuro semitransparente difuminado (`backdrop-blur-[2px]`), animación fluida de deslizamiento ascendente (`slide-in-from-bottom-4`) y respeto automático a la barra de inicio y gestos del sistema (`env(safe-area-inset-bottom)`).
  - En pantallas de escritorio, el selector conserva su menú flotante contextual optimizado (`absolute`) con orientación ascendente/descendente automática según el espacio en pantalla (`openUpward`).
- ⏱️ **Selector de Tiempo iOS Responsivo (`IosTimePicker.tsx`):**
  - Detección reactiva de móvil y pantalla táctil con controles ergonómicos adaptados para agilizar la selección precisa de horas y minutos en reuniones y asignaciones teocráticas.
- ⚡ **Optimización de Rendimiento Gráfico y Purga de `will-change` (`kongre-welcome.css`):**
  - Eliminación de propiedades `will-change` excesivas en cajas de registro y animaciones de bienvenida, reduciendo el consumo innecesario de memoria en GPU y batería en dispositivos móviles.
  - Simplificación de transformaciones CSS en estados finales de animación (`transform: none`, `filter: none`) para garantizar transiciones suaves a 60 fps sin micro-tirones.
- 🧭 **Navegación Móvil Segmentada y Margen Seguro para Muescas (`KongreOfficialWebsite.tsx`, `Navbar.tsx`):**
  - Integración de margen superior de seguridad para dispositivos con muesca o notch (`pt-[env(safe-area-inset-top,0px)]`) en la barra de navegación fija y cabecera de la web oficial.
  - Rediseño de la barra de navegación secundaria en móviles en una cuadrícula simétrica de 3 columnas (`grid-cols-3`) a ancho completo con etiquetas abreviadas inteligentes (*«Acerca de»*, *«Guía»*, *«Instalar App»*) para erradicar cualquier desbordamiento o salto de línea.
  - Dimensiones optimizadas en los botones de acceso (*«Mi Congregación»* / *«Usar Kongre»*) y selector de tema (`size={28}`) para pantallas pequeñas.
- 🦀 **Empaquetado Multiplataforma de Escritorio Rust + Tauri v2 (`desktop-release.yml`, `Cargo.toml`, `tauri.conf.json`):**
  - Sincronización oficial de versión en el motor nativo de escritorio a `v0.1.0-alpha.36` tanto en `Cargo.toml` como en `tauri.conf.json`.
  - Configuración del bundle de Windows a `--bundles nsis` para compilar el instalador ejecutable `.exe` oficial sin bloqueos de sintaxis en identificadores SemVer preliminares.
  - Integración en CI/CD de conversión automatizada de paquetes DEB a RPM mediante `alien` en Linux Ubuntu, garantizando la disponibilidad de instaladores para distribuciones Fedora, Red Hat y openSUSE.
- 🏛️ **Cockpit Teocrático en Vivo (`KongreOfficialWebsite.tsx`, `kongre-about-animations.css`):**
  - Maqueta interactiva con 4 pestañas reactivas (*Reunión Vida y Ministerio*, *Asistencia S-88*, *Territorios S-13* e *Informes de Servicio*) que simula el entorno real y operativo de una congregación en tiempo real.
- 🍱 **Bento Grid Asimétrico con Iconografía Vectorial Oficial (`KongreOfficialWebsite.tsx`):**
  - Cuadrícula moderna con ritmo visual diferenciado y los SVGs originales de la aplicación (`clm_vmc.svg`, `predicacion.svg`, `supervision.svg`, `discursos.svg`, `secretaria.svg`, `informes_servicio.svg`) con accesos directos temáticos a la Guía de Usuario.
- 🔄 **Flujo Teocrático en 3 Pasos (`KongreOfficialWebsite.tsx`):**
  - Franja secuencial que desglosa el proceso de adopción teocrática: 1. *Inicialización e Importación local*, 2. *Asignación y Programación Inteligente*, 3. *Coordinación y Consulta Segura por portal o PDF/WhatsApp*.
- 🛡️ **Seguridad Cero Conocimiento y Principio Bíblico (`KongreOfficialWebsite.tsx`):**
  - Bloque documental enfocado en almacenamiento local cifrado (AES-256 + PBKDF2), cero telemetría y respeto a las directrices de privacidad teocrática (*1 Corintios 14:40*).
- 🔘 **Componente Estándar y Unificado `DemoModeButton` (`DemoModeButton.tsx`):**
  - Nuevo botón reutilizable con diseño minimalista y serio en tonos slate neutros (`bg-slate-100 dark:bg-slate-800`, `border-slate-200 dark:border-slate-700`), unificado de forma homogénea en: cabecera y pie del cockpit en Acerca de Kongre, cabecera de PC, barra móvil y pestaña ID/PIN de Bienvenida, y la insignia interna `DemoBanner.tsx`.
- ✨ **Purga Total de Iconos de Estrella (`Sparkles`):**
  - Erradicación completa de destellos/estrellas en botones, insignias teocráticas y cabeceras en favor de iconos sobrios e institucionales (`Building2`, `CheckCircle2`, `Download`, `BookOpen`) o tipografía limpia.
- 🖥️ **Portal de Bienvenida 100% Zero-Scroll en Escritorio (`CongregationWelcomeLanding.tsx`, `AppFooter.tsx`):**
  - Contenedor de escritorio a pantalla completa (`lg:h-screen lg:max-h-screen lg:overflow-hidden`) con centrado automático `my-auto`, permitiendo visualizar las 4 opciones de acceso simultáneamente sin ningún desplazamiento vertical.
  - Eliminación de accesos redundantes en la tarjeta de inicio de sesión (*«Kongre para PC»* y *«Modo Demo»* ya presentes en la cabecera superior) y del banner duplicado de compatibilidad en la columna izquierda.
  - Ajuste de proporciones compactas en `DesktopOption`, `LandingFeatureCard`, barra superior de retorno (`py-1.5`) y `AppFooter` (`py-1.5 sm:py-2`).
- 🏷️ **Corrección de Identidad Institucional:**
  - Corrección del encabezado de previsualización en la maqueta de la web oficial, eliminando el texto erróneo *"Kongre Studio"* y restableciendo la denominación oficial: **«Kongre · Congregación Central»**.
- 🎨 **Estandarización de Encabezados y Selector de Tema (`AnimatedLogo.tsx`, `ThemeToggle.tsx`):**
  - Logotipo unificado `<AnimatedLogo height={32} />` y botón de alternancia de tema `<ThemeToggle size={36} />` con dimensiones homogéneas en toda la interfaz.

---

## 📅 Historial de Iteraciones Anteriores (Fase Alfa Preliminar)

> ℹ️ **Registro de Iteraciones de la Fase Alfa:**  
> Todas las entregas del historial corresponden a iteraciones de desarrollo activo de la fase Alfa (`v0.1.0-alpha.x` y `v0.0.x-alpha`), organizadas conforme a la norma internacional **SemVer** en su camino hacia la versión 1.0.0 definitiva.

---

### [v0.1.0-alpha.35] — 26 de Octubre, 2026
**Lanzamiento Multiplataforma para PC (Rust + Tauri v2), Reconocimiento de SO y Diseño Fluido**

- 🦀 **Lanzamiento de Kongre App para Escritorio (Rust + Tauri v2):**
  - Aplicación nativa ultraligera compilada con Rust (Tauri v2) que arranca en milisegundos y consume apenas ~15 MB de memoria RAM.
  - Paquetes de instalación oficiales para todas las plataformas de escritorio:
    - **Windows 10 / 11:** Instalador ejecutable `.exe` y paquete corporativo `.msi`.
    - **Linux Fedora / Red Hat:** Paquete nativo `.rpm` de 64 bits.
    - **Ubuntu / Debian:** Paquete `.deb`.
    - **Linux Universal:** Paquete portable `.AppImage`.
    - **macOS:** Binario Universal `.dmg` compatible con procesadores Apple Silicon (M1 a M4) e Intel.
- 💻 **Reconocimiento Inteligente de SO en Pantalla de Bienvenida (`DesktopCompatibilityBanner.tsx`):**
  - Banner interactivo que detecta en tiempo real si el usuario se conecta desde Windows, macOS, Fedora o Ubuntu y ofrece la descarga directa del paquete compatible con un clic y pestañas rápidas de selección.
- 📥 **Centro de Descargas en la Versión Web (`DesktopDownloadModal.tsx`):**
  - Modal interactivo con detección automática del sistema operativo del visitante, enlaces directos de descarga y acceso a los lanzamientos oficiales en GitHub.
- 🖥️ **Aprovechamiento Integral del Ancho de Pantalla (`App.tsx`, `UserProfileSettingsView.tsx`, `PanoramaGeneralTab.tsx`, `RolesManagerTab.tsx`, `MantenimientoTab.tsx`, `PanelElectricoTab.tsx`, `PersonalViewTab.tsx`, `MinisterioPublicadorTab.tsx`):**
  - Se eliminaron las restricciones de ancho fijo (`max-w-7xl`, `max-w-4xl`, `max-w-2xl`) en los contenedores principales para que todas las vistas aprovechen de forma responsiva el ancho completo de la pantalla en monitores y portátiles.
- 🔔 **Alineación Perfecta de Botones en Tarjeta Push (`PushNotificationQuickGuideCard.tsx`):**
  - Se corrigió el desbordamiento horizontal de los botones **Suscribirme a Notificaciones Push** y **Guía Visual** cuando la tarjeta se muestra dentro de una columna lateral.
**Rediseño Integral del Panel y Vista de Perfil de Usuario**

- 👤 **Panel Desplegable de Cuenta en Barra Superior (`Navbar.tsx`):**
  - Se rediseñó por completo el menú de usuario al hacer clic en el avatar superior en PC: incluye una cabecera de identidad con avatar, indicador en línea, correo, rol y congregación; una cuadrícula de acceso rápido de 2 columnas (**Mi Perfil** y **Mi Portal**); filas limpias para administración y seguridad (*Roles y Permisos*, *Ajustes de la Congregación*, *Registro de Auditoría*, *Bloquear Sesión con PIN*); selector rápido de apariencia (**Claro / Oscuro**); y pie de panel con versión y cierre de sesión.
- 🪪 **Vista Completa de Mi Perfil en 2 Columnas (`UserProfileSettingsView.tsx`):**
  - Se reemplazó el diseño vertical de bloques grandes por una arquitectura moderna de **2 columnas en escritorio** y tarjetas compactas en móvil:
    - **Tarjeta Superior de Identidad y Foto:** Avatar `rounded-2xl` con botón de cámara integrado, metadatos limpios en línea (*Rol · Congregación · Sincronización*), controles rápidos de imagen (*Subir Foto*, *Foto Google*, *Enlace URL*, *Quitar*) y selector compacto de 8 avatares predeterminados.
    - **Columna Izquierda (Contacto y Preferencias):** Formulario de identidad, teléfono/WhatsApp con enlace de prueba directa y selectores de canal preferido y horario de contacto con iconos vectoriales Lucide (eliminando los emojis gigantes).
    - **Columna Derecha (Ficha Resumen y Notificaciones Push):** Tabla de vista previa en vivo de la ficha personal y panel integrado de avisos Push y recordatorios en este dispositivo.

---

### [v0.1.0-alpha.33] — 26 de Octubre, 2026
**Rediseño de Barra Superior en PC: Buscador Central y Dock Minimalista de Solo Iconos**

- 🧭 **Miga de Pan Estructurada con Icono de Módulo (`Navbar.tsx`, `DemoBanner.tsx`):**
  - La zona izquierda muestra el icono de congregación, un separador chevron limpio (`›`), el icono representativo del módulo activo dentro de una insignia sutil y la etiqueta de **Modo Prueba** alineada en proporción y bordes (`rounded-lg`).
- 🔍 **Buscador Rápido Central en PC (`Navbar.tsx`):**
  - En lugar de una lupa suelta a la derecha, la barra superior en escritorio incorpora un buscador interactivo central (`Buscar en congregación...`) con indicador de atajo `Ctrl K`.
- 🎛️ **Sin Cronómetro Superior y Calendario como Solo Icono en el Dock (`Navbar.tsx`):**
  - Se retiró el botón de **Cronómetro** de la barra superior y se convirtió **Calendario** en un botón de solo icono integrado dentro del **Dock Unificado de Utilidades** (*Calendario*, *Publicadores*, *QR Móvil*, *PINs*, *Notificaciones* y *Tema*) junto a la tarjeta de perfil de usuario.

---

### [v0.1.0-alpha.32] — 26 de Octubre, 2026
**Unificación Integral de Cabecera Móvil y Contenedores Cohesivos de Control**

- ⬅️ **Barra Superior Adhesiva de Borde a Borde (`App.tsx`):**
  - Se eliminó la cápsula/burbuja flotante aislada de retroceso en móvil. Ahora opera como una cabecera nativa fija en la parte superior (`sticky top-0`) con efecto de difuminado (`backdrop-blur`), manteniendo el botón de retorno y el título integrados de forma limpia con la pantalla.
- 📦 **Contenedores Cohesivos para Controles y Acciones (`MantenimientoTab.tsx`, `PublishersTab.tsx`, `GruposServicioTab.tsx`, `MemorialAsambleasTab.tsx`, `VisitaSuperintendenteTab.tsx`, `PanelElectricoTab.tsx`, `TableroAnunciosTab.tsx`, `EquidadDashboardTab.tsx`, `ExportPdfTab.tsx`, `ConflictCenterTab.tsx`, `PersonalViewTab.tsx`, `RolesManagerTab.tsx`):**
  - Se agruparon todos los controles que antes flotaban sueltos sobre el fondo (botones desparramados en múltiples filas) dentro de tarjetas estructuradas (`rounded-2xl border bg-white dark:bg-slate-900 shadow-2xs`).
- 📐 **Cuadrículas Adaptativas sin Textos Cortados:**
  - Se reemplazaron las tiras horizontales estrechas con scroll que truncaban textos (como "Calendario Anu...") por cuadrículas de 2 y 3 columnas con etiquetas claras, directas y sin recortes en pantallas de teléfonos.

---

### [v0.1.0-alpha.31] — 26 de Octubre, 2026
**Unificación Visual Móvil: Colores Consistentes, Cuadrículas sin Cortes y Tablas Adaptativas**

- 🎨 **Consistencia de Color en Todos los Módulos (`InformeSucursalS1Tab.tsx`, `AttendanceTrendsDashboard.tsx`, `AsistenciaTab.tsx`):**
  - Se eliminaron las secciones con modo oscuro forzado cuando la app está en modo claro, unificando todas las tarjetas, tablas y cabeceras bajo el mismo sistema visual.
- 📐 **Sub-pestañas y Botones Alineados sin Recortes (`CleaningDutiesTab.tsx`, `S89SlipsTab.tsx`, `DiscursosPublicosTab.tsx`, `HospitalidadTab.tsx`, `TarjetasS21Tab.tsx`, `InformesServicioTab.tsx`, `PrecursoresAuxiliaresTab.tsx`, `CuentasTab.tsx`, `TerritoriosTab.tsx`, `CarritosTab.tsx`, `LiteraturaTab.tsx`):**
  - Todas las barras de sub-navegación y botones de acción usan cuadrículas adaptativas de 2 o 3 columnas en móvil con paleta unificada (`indigo-600` primario y `slate-100` secundario), evitando botones desalineados o texto cortado en los bordes.
- 📱 **Corrección de Herramientas del Programa y Tablas Móviles (`index.css`, `ScheduleTab.tsx`, `LiteraturaTab.tsx`, `TerritoriosTab.tsx`):**
  - Se corrigió el espacio en blanco en **Herramientas del Programa** y se añadieron tarjetas adaptativas en móvil para el catálogo de **Literatura** y los indicadores de **Territorios**.

---

### [v0.1.0-alpha.30] — 26 de Octubre, 2026
**Botones Atrás Móviles Minimalistas (Solo Icono sin Texto)**

- ⬅️ **Diseño Minimalista de Retorno (`App.tsx`, `ScheduleTab.tsx`, `AssignmentSelectorModal.tsx`, `CongregationCalendar.tsx`, `ConflictsModal.tsx`, `QrCodeModal.tsx`):**
  - Todos los botones de retroceso en páginas móviles muestran únicamente el icono de flecha izquierda (`←`) sin etiqueta de texto.

### [v0.1.0-alpha.29] — 26 de Octubre, 2026
**Botón Atrás en Todas las Nuevas Páginas Móviles (Antiguos Pop-ups)**

- ⬅️ **Barra de Navegación "Atrás" en Vistas Secundarias Móviles (`App.tsx`):**
  - Al acceder a páginas que antes eran menús o pop-ups en móvil (`Mi Perfil y Cuenta`, `Roles y Permisos`, `Centro de Conflictos`, `Ajustes del Sistema` y cualquier módulo secundario), se muestra una barra superior con el botón de retroceso para regresar con un toque a la pantalla previa.
- 📱 **Botón de Retroceso en Formularios y Selectores a Pantalla Completa (`ScheduleTab.tsx`, `AssignmentSelectorModal.tsx`, `CongregationCalendar.tsx`, `ConflictsModal.tsx`, `QrCodeModal.tsx`, `App.tsx`):**
  - Se incorporó el botón de retroceso en la esquina superior izquierda del Selector de Semanas, Herramientas del Programa, Selector de Participantes, creación/edición de Eventos del Calendario, detalle de reuniones y en todas las vistas a pantalla completa en móvil.

### [v0.1.0-alpha.28] — 26 de Octubre, 2026
**Experiencia Móvil 100% Nativa sin Pop-ups (Vistas a Pantalla Completa)**

- 📱 **Eliminación de Pop-ups Automáticos y Tarjetas Flotantes en Móvil (`App.tsx`, `LoadingSpinner.tsx`, `OfflineSyncBanner.tsx`, `AutoLockToastWarning.tsx`):**
  - Se desactivaron los modales automáticos (`DemoNoticeModal`, `AppLockPinSuggestionModal`) y los avisos flotantes inferiores en dispositivos móviles.
  - Durante la sincronización en la nube, la versión móvil muestra únicamente una barra de progreso delgada en la parte superior en lugar de una ventana emergente.
- 🧭 **Navegación Directa a Vistas de Página Completa (`Navbar.tsx`, `DemoBanner.tsx`, `MobileMenuTab.tsx`):**
  - Tocar el avatar de usuario en móvil abre directamente la vista completa de **Mi Perfil** sin desplegar menús flotantes.
  - El botón de tema claro/oscuro se integra directamente en la cabecera móvil para cambiar de apariencia en 1 toque.
  - Los accesos a **Cruces** y **Roles / Modo Demo** redirigen directamente a sus pestañas de página completa (`ConflictCenterTab` y `RolesManagerTab`).
- 🖥️ **Formularios y Selectores a Pantalla Completa en Móvil (`index.css`, `ScheduleTab.tsx`):**
  - Todos los formularios, selectores de semanas, menús de herramientas y diálogos se renderizan como páginas nativas a pantalla completa (`100%` del viewport sin marcos flotantes ni fondos oscurecidos) en pantallas móviles (`< 768px`).

### [v0.1.0-alpha.27] — 26 de Octubre, 2026
**Optimización de Interfaz Móvil: Menú Limpio, Calendario Integrado, Mi Ministerio y Programa de Reuniones**

- 📱 **Menú Móvil sin Banners Redundantes (`MobileMenuTab.tsx`):**
  - Se eliminaron el banner superior de perfil y la barra de búsqueda y píldoras de categorías, permitiendo ver de inmediato las herramientas rápidas (`PINs`, `Atril`, `Kiosko`, `QR`, `Cruces`, `Sincronía`) y las tarjetas de departamentos.
- 📅 **Calendario con Botón `+` Integrado (`CongregationCalendar.tsx`):**
  - Se retiró el banner superior con el campo de búsqueda y se integró el botón `+` (`Crear Evento`) directamente dentro de la barra de navegación superior del contenedor del calendario junto a `Hoy`, `< >` y el mes activo.
- ⏱️ **Ajustes de Diseño Móvil en Mi Ministerio (`MinisterioPublicadorTab.tsx`, `MinistryStopwatchDial.tsx`):**
  - **Meta y Registro Mensual:** El selector de meta de horas (`Meta: 15 h (Prec. Auxiliar)`) y el título `Resumen de Octubre 2026` se apilan limpiamente en móvil sin desbordarse fuera de la tarjeta.
  - **Tarjetas de Revisitas y Estudios Bíblicos:** Los botones `+ Nueva` / `Ver todas` y `+ Nuevo` / `Ver` mantienen su texto en una sola línea horizontal sin comprimir los títulos.
  - **Cronómetro de Predicación:** Cabecera compacta y selector de modalidades en una sola tira horizontal deslizable sin ocupar múltiples filas.
- 🏛️ **Simplificación en Mi Congregación y Programa (`PanoramaGeneralTab.tsx`, `ScheduleTab.tsx`, `ClmScheduleView.tsx`):**
  - Se eliminó el banner superior redundante en `Mi Congregación`.
  - En `Programa`, la barra de acciones (`Autoasignar`, `WhatsApp`, `Cruces`, `...`) se mantiene alineada en una sola fila compacta en móvil y el control de `Sala Auxiliar` se integra directamente en la cabecera de la `Reunión Entre Semana (VMC)`.
### [v0.1.0-alpha.26] — 26 de Octubre, 2026
**Estabilidad en Reposo de Pestaña, Prevención de Pantalla en Blanco y Optimización de Sincronización en Segundo Plano**

- 🛠️ **Solución Definitiva a la Pantalla en Blanco tras Reposo en el Navegador (`App.tsx`, `ErrorBoundary.tsx`):**
  - **Eliminación de Bucle de Verificación en la Nube:** Se corrigió el efecto de verificación de congregación en `App.tsx` que se re-ejecutaba en bucle en cada ciclo de sincronización y podía congelar la pestaña o limpiar la sesión activa ante límites de tasa (`429`) o cortes de red durante el reposo.
  - **Recuperación Automática al Despertar (`visibilitychange` / `pageshow`):** Cuando el usuario regresa a la pestaña tras haber estado inactiva o hibernada por el navegador, la aplicación rehidrata de forma transparente la bóveda criptográfica (`atRestVault`), restablece cualquier error transitorio de renderizado y sincroniza novedades sin necesidad de pulsar `F5`.
- ⚡ **Sincronización Ligera y Pausa en Pestañas Ocultas (`CongregationContext.tsx`, `supabaseSyncService.ts`, `OfflineSyncBadge.tsx`):**
  - **Pre-chequeo de Metadatos sin PBKDF2 Redundante:** El sondeo periódico ya no re-cifra ni sube toda la base de datos local cada 45 segundos si no existen cambios locales pendientes (`kongre_needs_cloud_upload`), evitando bloqueos del hilo principal.
  - **Suspensión de Temporizadores en Segundo Plano:** Los intervalos de sincronización en la nube, suscripción remota y lectura de cola `IndexedDB` se pausan automáticamente mientras `document.visibilityState === 'hidden'` y cuentan con candado de concurrencia para no acumular tareas al despertar.
- 🔒 **Ajuste de Auto-Bloqueo y Capa Modal (`SecurityContext.tsx`, `SessionLockModal.tsx`):**
  - **Temporizador Eficiente:** El contador de bloqueo por inactividad solo se activa cuando existe un PIN de bloqueo personal configurado, pausa sus ticks mientras la pestaña está oculta y utiliza `z-[100]` en el modal de bloqueo.

### [v0.1.0-alpha.25] — 26 de Octubre, 2026
**Blindaje de Concurrencia en Bóveda Local, Rotación Segura de Credenciales, Revalidación de Tokens y Cronómetro Estilo iOS**

- 🔐 **Concurrencia y Atomicidad en Bóveda Criptográfica (`atRestVault.ts`):**
  - **Secuenciador Monótono (`writeSeq`):** Evita que cifrados asíncronos en vuelo sobrescriban escrituras posteriores o vuelvan a escribir claves eliminadas tras un cierre de sesión.
  - **Hidratación en 2 Fases y Transacción Única:** `getOrCreateVaultKey` opera en una única transacción `readwrite` sobre `IndexedDB` para impedir colisiones entre pestañas, mientras que `initAtRestVault` separa la lectura (`planVaultHydration`) del compromiso (`commitVaultHydration`) para abortar limpiamente si vence el tiempo límite sin mutar el almacenamiento.
- 🛡️ **Endurecimiento de Rotación de Credenciales y Revalidación de Rol (`kongre-sync`):**
  - **Validación de Payloads en `rotate_to`:** El servidor rechaza rotar verificadores si no se incluye en la misma petición el payload re-cifrado correspondiente (`400 rotation_requires_master_payload` / `rotation_requires_public_payload`).
  - **Solicitud Explícita de PIN de Congregación y Portapapeles Seguro:** Si el dispositivo del coordinador no tiene almacenado el PIN de congregación actual al rotar únicamente el PIN Maestro, solicita ingresarlo (`needs_current_congregation_pin`) en lugar de usar el PIN Maestro como fallback; además, actualiza `settings.congregationPinHash`, preserva intacto `kongre_security_master_key_hash`, unifica longitudes mínimas (12 caracteres para PIN Maestro, 8 para Congregación) y vacía el portapapeles pasados 30 segundos.
  - **Revocación Inmediata en `verify_role_token` y `tokenSafe`:** Revalida contra `personal_verifiers` que el publicador siga activo y conserve el mismo rol/privilegios (`401 role_changed`), sanitizando delimitadores internos con `tokenSafe`.
- ⏱️ **Cronómetro de Predicación Estilo Reloj de iOS Sincronizado entre Móvil y PC:**
  - **Diseño Nativo iOS OLED (`#000000`):** Carátula analógica de 60 segundos con sub-esfera de 30 minutos, manecilla naranja `#FF9F0A`, botones circulares de doble anillo (*Iniciar* / *Detener* / *Vuelta* / *Reiniciar*), selector *Analógico / Digital*, atajo global `Ctrl+Shift+T` y sincronización en tiempo real del estado del cronómetro entre móvil y PC.

---

### [v0.1.0-alpha.24] — 25 de Octubre, 2026
**Token de Rol Firmado por el Servidor y Fase 2 de la Bóveda Local para Salud (DPA) y Notas Confidenciales**

- 🛡️ **Token Firmado por el Servidor para PIN Personal (`kgr_srt1` con HMAC-SHA256):**
  - **Generación en Edge Function (`kongre-sync`):** Al validar el PIN personal del publicador, el servidor genera un token firmado criptográficamente con el secreto del servidor (`pepper`), vinculando con firma constante el ID de la congregación, el ID del publicador, el rol teocrático primario, los roles departamentales secundarios y una expiración de 30 días.
  - **Protección contra Manipulación en DevTools:** El cliente valida la sesión local contra este token de servidor. Si un usuario intenta modificar variables locales como `kongre_active_role_v1` o elevar sus privilegios a Anciano o Coordinador, la sesión es invalidada de inmediato impidiendo cualquier escalada fraudulenta.
  - **Nuevo Endpoint `verify_role_token`:** La Edge Function provee verificación directa y en tiempo real de la vigencia e integridad de tokens emitidos.
- 🔐 **Fase 2 de la Bóveda Local en Reposo (`kgr_sec4:` respaldado por IndexedDB):**
  - **Protección de Datos Médicos DPA y Notas de Ancianos:** Se amplió la protección criptográfica para cubrir la Directiva Médica Anticipada (DPA), representantes de atención médica, alergias a fármacos, condiciones médicas crónicas y las notas espirituales/confidenciales de los ancianos.
  - **Cifrado AES-256 no extraíble (`atRestVault`):** Estos campos ahora se cifran bajo el formato `kgr_sec4:` en modo Counter autenticado (CTR + MAC), cuya clave deriva de la CryptoKey no extraíble (`extractable: false`) residente en IndexedDB. Incluso ante un volcado total de `localStorage`, un atacante no puede descifrar los datos médicos ni las notas sin la clave del navegador.
  - **Retrocompatibilidad Total:** Lectura y migración transparente de registros anteriores en formatos `kgr_sec3:`, `kgr_sec2:` y texto plano sin alterar la experiencia de usuario.

---

### [v0.1.0-alpha.23] — 25 de Octubre, 2026
**Rediseño Arquitectónico desde Cero de Estado Espiritual y las 11 Tarjetas del Publicador con Bloques Numerados y Cintas de KPIs**

- 🛡️ **Rediseño Total desde Cero de Estado Espiritual (`PrivilegesSection`):**
  - **Bloque 1 — Cabecera Ejecutiva, Selector de Rol y Cinta de KPIs:** Conmutador superior de **Esperanza S-21** (*Otras ovejas* / *Ungido*), 4 tarjetas arquitectónicas de rol teocrático (*Anciano*, *Siervo Ministerial*, *Publicador Bautizado* y *Publicador No Bautizado*) y cinta de 4 indicadores en tiempo real (*Tiempo de Bautismo*, *Modalidad de Servicio*, *Grupo de Servicio* y *Cuidado Pastoral*).
  - **Bloque 2 — Línea de Tiempo de Hitos Espirituales (`01–04`):** Tarjetas cronológicas para *Inicio como Publicador*, *Fecha de Bautismo S-21*, *Nombramiento / Inicio de Precursorado* y *Última Escuela de Precursores*, cada una con cálculo automático de tiempo transcurrido (`X años, Y meses`).
  - **Bloque 3 — Espacio Operativo en Dos Columnas:** Panel izquierdo para *Modalidad del Servicio de Precursor* (con meta de horas) y *Asignación en Grupo de Servicio del Campo* (*Publicador*, *Sup. Grupo*, *Auxiliar*); panel derecho para *Visitas de Pastoreo y Progreso Espiritual*, *Estado de Actividad Mensual* y un cajón colapsable discreto de *Registro Confidencial del Comité*.
  - **Bloque 4 — Matriz Filtrable de 16 Departamentos y Responsabilidades:** Pestañas de filtro (*Todos (16)*, *Asignados*, *Enseñanza y Comité*, *Cuentas y Territorios*, *Salón y Audio/Video*) y filas con controles segmentados de 3 estados (`No | Titular | Auxiliar`).
- 🏛️ **Arquitectura Multi-Bloque con Cintas de KPIs en Todas las Tarjetas del Publicador (`01` a `11`):**
  - **Información Personal (`01`), Contacto y Ubicación (`02`) y Directriz Médica DPA (`04`):** Cintas superiores de 4 indicadores tabulares y bloques numerados (`1.`, `2.`, `3.`) para filiación familiar, separación automática de nombres, captura GPS con enlaces a Google Maps/Waze, plazas de vehículo y representantes médicos del directorio.
  - **Asignaciones (`06`), Condiciones Especiales (`09`) y Ausencias y Notas (`10`):** Cinta de KPIs de habilitación por reunión, barra de filtros por área (*Todas*, *Activas*, *Vida y Ministerio*, *Fin de Semana y Campo*, *Acomodación, A/V y Salón*), panel pedagógico `S-38` y bosquejos (`1–194`), matriz de accesibilidad/traslado de congregación y calendario de ausencias con cálculo de días acumulados.
- 🔐 **Endurecimiento de Seguridad Cero Conocimiento y Bóveda Criptográfica en Reposo:**
  - **Bóveda no extraíble `atRestVault` (IndexedDB AES-256-GCM):** Almacenamiento seguro de credenciales con clave criptográfica creada con `extractable: false`, autenticación de datos asociados (AAD) y migración transparente de credenciales previas.
  - **Derivación Robusta PBKDF2 (200.000 iteraciones):** Sustitución de hashes locales rápidos por PBKDF2 con sal aleatoria criptográfica, purga de `${key}_hash` en localStorage y erradicación de almacenamiento en texto claro en `sessionStorage`.
  - **Rotación Segura de Credenciales en la Nube (`RotateCredentialsModal`):** Asistente interactivo en Ajustes para rotar de forma independiente o simultánea el PIN de Congregación (Crockford Base32 `XXXX-XXXX`) y el PIN Maestro (12 dígitos), con re-cifrado en el cliente e invalidación inmediata de accesos anteriores en Supabase.
  - **Blindaje del Despliegue de Base de Datos:** Reubicación del rollback de emergencia fuera del directorio de migraciones automáticas (`supabase/rollback/`) para garantizar que `supabase db push` preserve siempre el cierre de permisos públicos.

---

### [v0.1.0-alpha.22] — 25 de Octubre, 2026
**Rediseño Editorial Completo de las 11 Tarjetas del Publicador, el Hub de Categorías, Registro S-21, Contactos de Emergencia y Credenciales PIN/QR**

- 🏛️ **Cabecera Ejecutiva, Pestañas Numeradas (`01–11`) y Nuevo Hub de Tarjetas (`PublisherEditor`):**
  - **Cabecera Ejecutiva Unificada:** Avatar con iniciales del publicador, edición rápida del nombre en línea, metadatos tipográficos separados por punto medio (`ID · Rol · Grupo · Edad · Estado de sincronización`) y medidor compacto de integridad de la ficha.
  - **Mosaico Editorial sin Cajas Anidadas:** Rediseño de las 11 tarjetas del Hub eliminando sub-cajas redundantes en favor de filas limpias separadas por líneas sutiles (*hairlines*) y numeración `tabular-nums`.
  - **Navegación Secuencial entre Tarjetas:** Nueva barra inferior dentro de cada sección que permite avanzar o retroceder directamente entre las 11 tarjetas (*Anterior / Siguiente tarjeta*) sin tener que regresar cada vez al Hub.
- 📊 **Rediseño del Registro Oficial de Publicador `S-21` (`S21RecordsSection`):**
  - **Selector Multi-Año (`2024–2027`) y Cinta de KPIs Anuales:** Resumen superior con cifras tabulares de *Meses Activos (`X/12`)*, *Total de Horas (con crédito)*, *Promedio Mensual*, *Cursos Bíblicos (promedio y máximo)* y *Meses de Precursor Auxiliar*.
  - **Acciones Rápidas de Secretaría y Exportación:** Botón **«Año activo»** para marcar los 12 meses de participación en un clic, botón por fila para **copiar los datos del mes anterior** y descarga directa de la tarjeta anual en formato **CSV**, acompañado de una curva anual limpia de horas y cursos bíblicos.
- 🚨 **Rediseño de Contactos de Emergencia (`EmergencyContactsSection`):**
  - **Importación desde el Directorio y desde el DPA:** Buscador integrado para vincular a cualquier hermano de la congregación como contacto de emergencia, estado vacío asistido con botón para importar en un clic al representante médico del DPA y etiquetas rápidas de parentesco en el modal (*Esposo(a)*, *Padre / Madre*, *Hijo(a)*, *Hermano(a) carnal*, *Hermano(a) de la congregación*).
  - **Acciones Directas Siempre Accesibles:** Botones de edición y eliminación visibles en pantallas táctiles y móviles, junto con botones de un clic para **Llamar**, abrir **WhatsApp**, **Copiar teléfono** y enviar **Correo**.
- 🔐 **Rediseño de Credenciales de Acceso y PIN Personal (`AccessCredentialsSection`) y Coherencia en las 11 Secciones:**
  - Espacio de trabajo unificado en dos columnas (*PIN Personal y Fortaleza* + *Nivel de Acceso y Permisos en la Aplicación*), papeleta imprimible con código QR renovada y cabeceras editoriales consistentes en las 11 tarjetas del publicador.

---

### [v0.1.0-alpha.21] — 25 de Octubre, 2026
**Renovación Integral de las Tarjetas del Publicador: Información Personal, Contacto y Ubicación, Estado Espiritual, DPA, Asignaciones e Historial**

- 👤 **Tarjeta de Información Personal (`BasicInfoSection`):**
  - **Nombre y Edad Inteligente:** Edición rápida de nombre completo con auto-separación en 4 campos, cálculo automático de edad y etapa de vida (*Niño(a)*, *Joven menor*, *Joven adulto*, *Adulto*, *Edad Avanzada 65+*) con botones de sugerencia rápida para marcar indicadores congregacionales.
  - **Filiación, Núcleo Familiar, Idiomas y Oficios:** Selector de 5 estados civiles, interruptores siempre visibles de *Cabeza de Familia* y *Menor de Edad*, selector de Padre/Madre o Tutor responsable, vinculación de cónyuge y etiquetas interactivas de **Idiomas** (incluyendo Lengua de Señas) y **Oficios / Habilidades Prácticas** para mantenimiento y emergencias.
- 📍 **Tarjeta de Contacto, Ubicación y Movilidad (`ContactSection`):**
  - **Acciones Directas y Ubicación GPS:** Botones de un clic para copiar, llamar, abrir WhatsApp o redactar correo, selector de medio preferido de contacto, campo de *Referencias del domicilio / entre calles*, captura de coordenadas GPS actuales y enlaces directos a **Google Maps** y **Waze**.
  - **Transporte y Literatura Impresa:** Selector de asientos disponibles en vehículo (`2` a `7` plazas) para apoyo al grupo de predicación y preferencias de publicaciones impresas incluyendo **Letra Grande**.
- 🛡️ **Tarjeta de Estado Espiritual y Privilegios (`PrivilegesSection`):**
  - **Trayectoria S-21 y Precursorado:** Botones directos para los 4 roles (*Anciano*, *Siervo Ministerial*, *Publicador Bautizado* y *No Bautizado*), selector explícito de **Esperanza S-21** (*Otras ovejas* / *Ungido*), fecha de nombramiento, fecha de inicio de precursorado y fecha de la última **Escuela del Servicio de Precursor**.
  - **Grupos de Servicio y Pastoreo:** Terminología teocrática oficial (*Publicador*, *Sup. Grupo*, *Auxiliar*), seguimiento de la última visita de pastoreo con antigüedad automática, ancianos visitadores, nivel de prioridad pastoral (*Normal*, *Pronto*, *Urgente*) y notas de progreso espiritual.
- 🏥 **Directriz Médica DPA, Asignaciones, Condiciones Especiales e Historial:**
  - **DPA y Salud (`MedicalDpaSection`):** Buscador de representantes de atención médica en el directorio de la congregación, botones de llamada/WhatsApp de urgencia, indicador de copia en archivo, alerta de revisión anual (`+1 año`) y campos separados para alergias y condiciones médicas.
  - **Asignaciones (`AssignmentsSection`), Condiciones (`SpecialConditionsSection`) e Historial (`PublisherHistoryPanel`):** Corrección de colores estáticos en Tailwind v4, selector de lección actual del folleto *Maestros* (`1–20`), registro de bosquejos de discursos públicos (`1–194`), indicadores de conexión regular por Zoom y asiento preferencial, panel de seguimiento de mudanza de congregación (carta de presentación y tarjeta `S-21`), barra de integridad de ficha en el Hub y auditoría de cambios con reversión en navegador.

---

### [v0.1.0-alpha.20] — 25 de Octubre, 2026
**Analítica Gráfica con Recharts y Selector Multi-Grupo de Servicio en el Tablero de Equidad (`EquidadDashboardTab`)**

- 📊 **Visualización Comparativa con Recharts y Detección Gráfica de Desequilibrios:**
  - **4 Modos de Análisis Gráfico:** *Por Áreas (Apilado)* (desglose de puntos en Enseñanza, Estudiantil/Lectura, Deberes/Audio, Campo/Carritos y Oraciones junto con curva de N° de asignaciones), *Brecha vs. Privilegio* (comparación de cada publicador frente al promedio de su cuerpo/privilegio), *Cuerpos y Estados* (rango mínimo, promedio y máximo por cuerpo junto con gráfico de dona interactivo) y *Por Grupos* (comparativa directa entre grupos de servicio).
  - **Líneas de Referencia y Selector de Muestra:** Indicadores visuales del promedio filtrado y del umbral de sobrecarga (`140%`), con vistas rápidas de contraste (*8 Más vs. 8 Menos Cargados*, *Top 15 Mayor Carga*, *Top 15 Menor Carga* y *Vista General*) e inspector detallado al hacer clic en cualquier barra.
- 👥 **Selector y Filtro Multi-Grupo de Servicio en Tiempo Real:**
  - Selector desplegable rápido y barra interactiva de *chips* por grupo de predicación que permiten filtrar un único grupo o comparar varios grupos de servicio específicos de forma simultánea.
  - Sincronización integral entre el selector superior, la barra multi-grupo, la tabla de radiografía por publicador y las tarjetas inferiores de grupos de predicación, incluyendo sufijos identificadores `(G#N)` en los gráficos al comparar múltiples grupos.

---

### [v0.1.0-alpha.19] — 25 de Octubre, 2026
**Centro Local y Motor Universal de Carga y Relleno Automático de Plantillas PDF Oficiales (`S-21`, `S-89`, `S-140`, `S-88`, `S-13`, `S-26`, `S-30`, `S-25`, `S-28` y `S-1`)**

- 📄 **Carga de Plantillas PDF Oficiales en Blanco (100% Local):**
  - En cumplimiento estricto con las políticas de propiedad intelectual, **Kongre jamás genera ni dibuja formularios oficiales desde cero**.
  - Cada usuario carga localmente desde su dispositivo su propio archivo PDF oficial en blanco (descargado de *jw.org* / *JW Hub*) y la aplicación lo rellena automáticamente en el navegador con los datos reales de la congregación usando `pdf-lib`.
- 🧠 **Ordenamiento Visual Inteligente de Campos Interactivos (`AcroForm`):**
  - Algoritmo de inspección espacial (`sortPdfFieldsVisually`) que ordena todos los cuadros de texto, casillas de verificación, listas desplegables y botones de opción por coordenadas visuales `(página, fila superior a inferior, columna izquierda a derecha)`.
  - Garantiza compatibilidad universal con cualquier idioma, edición o revisión de los formularios oficiales sin depender de nombres internos rígidos de campos, e incluye estampado por coordenadas como respaldo para PDFs aplanados.
- 🗂️ **Cobertura Completa de los 10 Formularios Teocráticos (`LocalOfficialFormsCenter` y `OfficialPdfModal`):**
  - **Registro de Publicador (`S-21`):** Relleno individual o generación de un único PDF multipágina por lotes (por grupo de servicio, precursores o toda la congregación), marcando sexo, esperanza, privilegios, horas, cursos bíblicos, notas y totales anuales.
  - **Asignaciones VMC (`S-89`) y Programa (`S-140`):** Relleno de hojas `S-89` (plantillas de 1 por página o 4 por página en cuadrícula con paginación automática) y plantilla semanal `S-140`.
  - **Asistencia (`S-88`), Territorios (`S-13`), Cuentas (`S-26`, `S-30`, `S-25`), Literatura (`S-28`) e Informe a la Sucursal (`S-1`):** Almacenamiento local en `IndexedDB` (o modo exclusivo en memoria RAM por sesión), inspector de campos detectados y botones directos de **«PDF Oficial»** integrados en cada módulo.

---

### [v0.1.0-alpha.18] — 25 de Octubre, 2026
**Auditoría de Secretaría, Carpeta Ejecutiva de Visita del Sup. de Circuito, Literatura (`S-28`/`S-14`), Mantenimiento/Emergencias y Contabilidad (`S-26`/`S-30`/`S-25`)**

- 📋 **Auditoría de Secretaría y Meta Anual de Precursores (600 h):**
  - Seguimiento en tiempo real del ritmo anual de los precursores regulares y especiales durante el año de servicio (meta de 600 horas, créditos de horas aprobados, promedio mensual y semáforo visual *En Meta / Atención / Rezagado*).
  - Panel de cuidado pastoral para identificar oportunamente publicadores irregulares o en riesgo de inactividad.
- 🧳 **Carpeta Ejecutiva (Dossier A4) para la Visita del Superintendente de Circuito:**
  - Nueva pestaña en **Visita del Sup. de Circuito** y en **Tarjetas S-21** que consolida automáticamente la radiografía completa de la congregación: estructura de publicadores y nombrados, precursores, promedios de estudios bíblicos, asistencia `S-88`, cobertura de territorios `S-13` y estado por grupo de servicio, lista para imprimir en formato A4 o compartir por WhatsApp.
- 📚 **Gestión Integral de Literatura (`S-28` / `S-14`) y Pedidos Especiales por Grupo:**
  - Diagnóstico automático de inventario (artículos agotados, stock bajo y cálculo de cantidad sugerida de reposición a la sucursal).
  - Seguimiento de pedidos especiales agrupados por grupo de servicio con avisos directos por WhatsApp al publicador o superintendente de grupo cuando el artículo llega al Salón del Reino, entregas por grupo y registro de recuentos físicos.
- 🛠️ **Calendario Anual de Mantenimiento Preventivo y Plan de Preparación ante Emergencias:**
  - **Matriz Anual de Mantenimiento (Septiembre – Agosto):** Programación visual de todas las fichas técnicas a lo largo de los 12 meses del año de servicio con porcentaje de cumplimiento y estimación de horas anuales.
  - **Plan de Preparación ante Emergencias y Desastres:** Árbol de contacto pastoral por grupo de servicio, directorio de hermanos con capacitación médica/primeros auxilios, vehículos disponibles para evacuación o apoyo, responsables con llaves del Salón e integración con el mapa de cortacircuitos del panel eléctrico (imprimible en A4 y enviable por WhatsApp).
- 🏦 **Contabilidad Congregacional Avanzada (`S-26`, `S-30` y Auditoría Trimestral `S-25`):**
  - Libro mensual `S-26` con cálculo de saldo acumulado línea por línea (`runningBalance`), desglose por fondos y conciliación interactiva entre extracto bancario y efectivo en caja.
  - Cálculo automático de la reserva operativa recomendada (2 meses de gastos locales) y excedente disponible para transferir a la sucursal.
  - Generador automático del texto oficial del anuncio mensual de cuentas (`S-30`) para lectura en la plataforma y módulo de **Auditoría Trimestral (`S-25`)** con verificación de comprobantes e impresión A4.

---

### [v0.1.0-alpha.17] — 25 de Octubre, 2026
**Suite Integral de Gestión Congregacional: Intercambio de Oradores, Deberes y Aseo, Carritos, Agrupación Familiar, Salidas al Campo, Cartelera Digital y Equidad Ponderada**

- 🎙️ **Motor de Intercambio de Oradores, Congregaciones Vecinas y Hospitalidad Inteligente:**
  - Directorio unificado de congregaciones vecinas (con horarios de reunión y datos de coordinadores) y catálogo de oradores visitantes.
  - Evaluador automático de repetición de bosquejos públicos y detector transversal de choques de agenda para oradores salientes (reunión de fin de semana, deberes, hospitalidad, carritos, salidas al campo y ausencias).
  - Sugeridor inteligente de familias anfitrionas de hospitalidad clasificado por puntaje de equidad, capacidad de invitados y alertas de alergias o dieta, con plantillas de WhatsApp para orador, anfitrión y coordinador vecino.
- 🧹 **Motor de Deberes Logísticos y Programa de Aseo Semanal/Profundo con Control de Insumos:**
  - Auto-asignación inteligente de Audio, Video, Micrófonos, Acomodadores, Plataforma, Seguridad y Zoom validando que ningún hermano tenga choque en la misma reunión o esté ausente.
  - Matriz de equidad de deberes y programación por grupos para aseo semanal regular, limpieza profunda (`S-28`), visita del superintendente de circuito y eventos especiales, incluyendo lista de verificación por áreas del Salón y semáforo de estado de insumos de aseo (*Insumos Completos / Reponer Pronto / Urgente Comprar*).
- 🛒 **Motor de Predicación Pública con Carritos y Emparejamiento Teocrático:**
  - Validación automática de cada turno de exhibidor público: reconocimiento de matrimonios/familiares y compañeros fijos, alerta ante parejas mixtas sin parentesco, detección de turnos solapados el mismo día y ausencias.
  - Auto-asignador equitativo según disponibilidad diaria de cada publicador/precursor, matriz de equidad y cuadrante imprimible A4.
- 👨‍👩‍👧‍👦 **Agrupación Familiar Inteligente, Reemplazos VMC y Despacho Mensual Unificado en 8 Módulos:**
  - Vinculación de núcleos familiares en la ficha del publicador con sugerencias automáticas por apellido o dirección compartida, e insignias en los selectores de asignación y reemplazos VMC cuando otro miembro de la familia ya participa en esa misma reunión.
  - **Consolidador Mensual Unificado (`unifiedMonthlyAssignments`):** Agrupa en un único resumen por hermano todas sus asignaciones del mes a través de 8 módulos (*Vida y Ministerio, Fin de Semana, Deberes, Limpieza, Carritos, Salidas al Campo, Orador Saliente y Hospitalidad*), permitiendo enviarlo en un solo WhatsApp desde `BatchWhatsAppModal` o `Mi Vista`, imprimir su hoja mensual personal o descargar un archivo de calendario `.ics` unificado.
- 📌 **Cartelera Digital del Salón del Reino y Generador Automático de Salidas al Campo:**
  - **Cartelera Digital Unificada:** Vista previa oficial e impresión A4 unificada para el tablero físico del Salón, boletín semanal consolidado para WhatsApp y descarga del calendario maestro `.ics` de la congregación.
  - **Generador de Salidas al Servicio del Campo:** Plantillas de bloques semanales (mañana, tarde, noche) y modalidades (*Casa en casa, Carritos, Revisitas/Estudios, Telefónica/Cartas, Negocios*) con asignación rotativa de conductores elegibles y recomendación automática de territorios con más tiempo sin trabajar.
- ⚖️ **Auditoría Ponderada de Carga Teocrática y Equidad Transversal (`EquidadDashboardTab`):**
  - Sistema de pesos configurables por rol y categoría (*Enseñanza Principal, Partes Estudiantiles, Deberes/Logística, Ministerio del Campo y Oraciones*) que calcula los puntos de esfuerzo real acumulados por cada hermano, identifica sobrecarga o subutilización, mide rachas semanales y genera informes de equidad imprimibles.

---

### [v0.1.0-alpha.16] — 23 de Octubre, 2026
**Optimización Integral de Experiencia Móvil (Auditoría UI/UX, Gestos Táctiles y Ergonomía)**

- 📱 **Cabecera Superior y Pie de Página Móvil Simplificados:**
  - Se redujo la densidad de iconos secundarios en la cabecera móvil (`< 640px`) trasladándolos al menú de cuenta y hoja inferior, y se compactó el pie de página interno a una sola línea discreta.
- 👆 **Navegación Táctil en Programa de Reuniones:**
  - Sub-cabecera de semanas fija (*sticky*) con soporte para deslizar horizontalmente (*swipe* izquierda/derecha) entre semanas, botón directo «Hoy» y agrupación de herramientas secundarias.
- 📊 **Cintas de KPIs Interactivas, Tablas con Primera Columna Fija y Modales *Bottom Sheet*:**
  - Los KPIs de Territorios y Publicadores funcionan como filtros rápidos deslizables en una sola fila móvil, las tablas fijan su primera columna al desplazar y los modales clave abren como hoja inferior.

---

### [v0.1.0-alpha.15] — 23 de Octubre, 2026
**Indicador de Carga Global (`LoadingSpinner`) durante la Sincronización con Supabase**

- ✨ **Componente Global `LoadingSpinner`:**
  - Nuevo indicador de carga con diseño *glassmorphism*, doble anillo orbital en rotación inversa e indicación de cifrado **Zero-Knowledge AES-256-GCM**.
- 🔄 **Superposición sobre el Contenido de cada Pestaña:**
  - Se muestra automáticamente sobre el contenedor de la pestaña activa mientras se realiza la sincronización de datos (carga inicial, subida cifrada o sincronización bidireccional) con Supabase, indicando el nombre de la vista en actualización.

---

### [v0.1.0-alpha.14] — 23 de Octubre, 2026
**Redacción Institucional y Profesional de Términos de Uso y Política de Privacidad**

- ⚖️ **Marco Normativo de Términos de Uso Teocrático:**
  - Reestructuración integral con lenguaje formal, claro e institucional dividido en 5 cláusulas normativas: Alcance Operativo e Independencia Institucional (aclaración expresa de no afiliación oficial con *jw.org*), Gobernanza de Accesos y Roles (RBAC en 3 niveles de PIN + 2FA TOTP), Confidencialidad y Uso Ético del Directorio, Arquitectura *Offline-First* y Responsabilidad de Respaldo, y Limitación de Responsabilidad y Baja Definitiva.
- 🔒 **Política de Privacidad, Cifrado y Protección de Datos:**
  - Documentación detallada de la arquitectura de **Conocimiento Cero (*Zero-Knowledge*)**, especificando el cifrado en el cliente mediante **AES-256-GCM** y derivación de llaves **PBKDF2-HMAC-SHA256** (hasta 600.000 iteraciones), principio de minimización de datos, cumplimiento de la cláusula de *Uso Limitado (Limited Use)* de Google OAuth 2.0 y ejercicio de derechos **ARCO+** (Acceso, Rectificación, Cancelación, Oposición, Portabilidad y Olvido Digital).
- 🌐 **Sincronización con Páginas Estáticas Oficiales (`/terms` y `/privacy`):**
  - Las páginas públicas estáticas en español e inglés han sido actualizadas con el mismo estándar profesional para usuarios y revisores de seguridad.

---

### [v0.1.0-alpha.13] — 23 de Octubre, 2026
**Vistas Dedicadas de Página Completa para Registro de Versiones (Changelog) y Términos y Privacidad**

- 📄 **Registro de Versiones (Changelog) en Página Completa:**
  - El historial de versiones y novedades ya no se abre en un cuadro emergente (*pop-up*), sino como una página completa de lectura cómoda con su botón superior «← Volver atrás».
- ⚖️ **Términos de Uso y Política de Privacidad en Página Completa:**
  - Los Términos de Uso y la Política de Privacidad (así como la pantalla de aceptación de primer ingreso) ahora se despliegan en una vista dedicada de página completa sin ventanas flotantes ni fondos superpuestos.

---

### [v0.1.0-alpha.12] — 23 de Octubre, 2026
**Aceptación Obligatoria de Términos de Uso y Política de Privacidad en Registro y Primer Ingreso**

- ⚖️ **Aceptación en el Registro de Congregación:**
  - En el último paso del asistente de registro, el coordinador debe confirmar que ha leído y acepta los **Términos de Uso** y la **Política de Privacidad** antes de registrar y activar la congregación.
- 🔐 **Aceptación en el Primer Inicio de Sesión:**
  - Al ingresar por primera vez mediante **Google**, **ID y PIN de Congregación** o **Código de Invitación**, se presenta una casilla interactiva obligatoria con enlaces directos para abrir y leer los Términos de Uso y la Política de Privacidad sin salir de la pantalla.
  - Al pulsar «Entendido y Aceptar» dentro del visor legal, la casilla queda marcada automáticamente y se guarda la aceptación en el dispositivo para no volver a solicitarla en futuros ingresos.
- 🛡️ **Ventana de Consentimiento en Acceso por Enlace Directo o QR:**
  - Si un hermano ingresa por primera vez escaneando un código QR o abriendo un enlace directo sin haber aceptado aún las condiciones, el sistema muestra el resumen interactivo de Términos y Privacidad para su aceptación previa.

---

### [v0.1.0-alpha.11] — 23 de Octubre, 2026
**Autenticación de Dos Pasos (2FA) con Microsoft Authenticator y Códigos de Respaldo**

- 📱 **Verificación en Dos Factores con Microsoft Authenticator (Opcional):**
  - Cada publicador puede activar de forma totalmente voluntaria la verificación en dos pasos en su portal ("Mi Vista" > pestaña "Seguridad 2FA").
  - Compatible de forma nativa con **Microsoft Authenticator**, Google Authenticator y cualquier aplicación TOTP estándar.
  - Escaneo sencillo con código QR o mediante clave secreta alfanumérica copiable.
- 💾 **Códigos de Respaldo de Emergencia (8 Códigos de Un Solo Uso):**
  - Al activar 2FA, se generan 8 códigos de recuperación imprimibles o descargables en texto para recuperar el acceso si pierdes o cambias de teléfono.
  - Cada código se almacena en el sistema únicamente como hash seguro SHA-256 (arquitectura de conocimiento cero).
- 🕒 **Dispositivos de Confianza ("Recordar este dispositivo por 30 días"):**
  - No necesitas introducir el código de 6 dígitos cada vez que uses tu propio teléfono. Al marcar la casilla de confianza, el sistema solo te pedirá el código 2FA cuando ingreses en un dispositivo nuevo o si han pasado más de 30 días sin actividad.
- 🏛️ **Herramientas para Ancianos y Administración Teocrática:**
  - En el Directorio Teocrático, los ancianos pueden ver qué publicadores tienen 2FA activo con una insignia verde identificativa (`2FA`).
  - Si un hermano extravía su teléfono o aplicación autenticadora, un anciano puede restablecer su 2FA con un solo clic para que pueda volver a ingresar con su PIN habitual.
- ⚡ **100% Autónomo y Fuera de Línea:**
  - La verificación de códigos se calcula íntegramente en el dispositivo del usuario con la API nativa del navegador (Web Crypto API), funcionando perfectamente sin conexión a internet.

---

### [v0.1.0-alpha.10] — 23 de Octubre, 2026
**Páginas Oficiales de Privacidad y Términos de Uso para Verificación de Google**

- 📜 **Acceso Directo y Universal a Términos y Privacidad:**
  - Los enlaces directos `https://kongre-app.com/#privacy` y `https://kongre-app.com/#terms` (así como `/privacy` y `/terms`) abren de inmediato los documentos legales correspondientes tanto en la aplicación interactiva como en navegadores sin iniciar sesión.
  - Se crearon páginas web dedicadas e independientes (`/privacy` y `/terms`) que cargan al instante incluso sin conexión o en navegadores antiguos.
- 🛡️ **Claridad Total sobre el Acceso con Google:**
  - Se añadió la declaración oficial de cumplimiento con la *Política de Datos de Usuario de Google* (Google API Services User Data Policy) y los requisitos de Uso Limitado (Limited Use), explicando con total transparencia que solo se accede al nombre, correo y foto para verificar al usuario y que los datos jamás se comparten ni comercializan.

---

### [v0.1.0-alpha.9] — 23 de Octubre, 2026
**Corrección en Cambio de Cuenta con Google**

- 🔄 **Cambio y Selección de Cuentas de Google Fluido:**
  - Al pulsar "Cambiar cuenta" y conectar de nuevo con Google, el selector de cuentas se abre siempre de forma limpia para que puedas elegir tu cuenta preferida.
  - Se corrigió un detalle que hacía que, al volver de Google tras cambiar de cuenta, la pantalla quedara esperando o volviera a mostrar el botón "Continuar con Google". Ahora la sesión se valida al instante y muestra directamente tu tarjeta de cuenta verificada.

---

### [v0.1.0-alpha.8] — 23 de Octubre, 2026
**Navegación Fluida en el Portal y Corrección en Menú de Google**

- 🧭 **Sincronización Precisa de Pantalla y Enlace:**
  - Se corrigió un problema donde refrescar la página en `#portal` mostraba la pantalla de inicio con Google en lugar del portal principal.
  - La barra de direcciones ahora refleja exactamente la opción en la que te encuentras (Google, Conectar con ID y PIN, o Invitación) y permite retroceder o refrescar sin perder tu ubicación.
- 🧹 **Higiene de Sesión:**
  - Al pulsar "Volver" o usar las flechas del navegador para regresar al portal de bienvenida, las pantallas temporales de inicio de sesión se limpian de inmediato.

---

### [v0.1.0-alpha.7] — 23 de Octubre, 2026
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

### [v0.1.0-alpha.6] — 23 de Octubre, 2026
**Cifrado de Grado Militar en el Dispositivo, Navegación Protegida y Salto de Seguridad OWASP**
- **Cifrado Fuerte de Datos Sensibles:** Los datos de salud, contactos de emergencia y teléfonos personales en tu dispositivo ahora se protegen con cifrado de flujo por bloques de última generación ligado al hardware del dispositivo.
- **Protección Web Estricta (CSP Bloqueador):** La aplicación no permite la ejecución de scripts no autorizados ni enlaces externos sospechosos, garantizando un entorno totalmente blindado.
- **Limpieza de Credenciales en la Barra del Navegador:** Ningún enlace o código QR deja contraseñas visibles en la barra de direcciones; las URLs se limpian al instante al cargar.

### [v0.1.0-alpha.5] — 23 de Octubre, 2026
**Seguridad Web en Producción y Optimización de Memoria**
- **Protección contra Secuestro de Clics (Clickjacking):** La app no puede ser incrustada en páginas externas no autorizadas.
- **Rendimiento Mejorado Fuera de Línea:** Almacenamiento optimizado para que la app instalada en móviles funcione más rápido sin consumir almacenamiento innecesario.

### [v0.1.0-alpha.4] — 23 de Octubre, 2026
**Invitaciones de Alta Seguridad y Facilidad de Entrada**
- **Códigos Imposibles de Adivinar:** Los nuevos códigos de invitación para publicadores y ancianos adoptan 10 caracteres aleatorios de alta seguridad (`KONG-[ROL]-XXXXX-XXXXX`).
- **Escritura Flexible:** Puedes escribir o pegar tu código con o sin guiones, con o sin el prefijo `KONG-`, o en minúsculas. El sistema lo reconoce y valida automáticamente.

### [v0.1.0-alpha.3] — 23 de Octubre, 2026
**Minimización de Datos en Nube (Ley 1581 de Protección de Datos)**
- **Mayor Reserva de Informes:** Los informes mensuales de predicación personales y correos electrónicos de los hermanos se retiraron del contenido público general, quedando reservados exclusivamente para el cuerpo de ancianos.
- **App Más Ligera:** Depuración profunda de componentes internos, reduciendo el peso de la aplicación.

### [v0.1.0-alpha.2] — 23 de Octubre, 2026
**Protección de Datos Médicos, Dominio Oficial y Enlaces Temporales**
- **Dominio Oficial:** Lanzamiento en la dirección web oficial `https://kongre-app.com` con conexión cifrada de alta velocidad.
- **Protección Médica y DPA:** Alergias, directivas médicas anticipadas y notas pastorales se guardan cifradas en el dispositivo del hermano autorizado.
- **Enlaces con Caducidad:** Los enlaces compartidos y códigos QR expiran automáticamente a los 7 días y no transportan claves de congregación.

### [v0.1.0-alpha.1] — 23 de Octubre, 2026
**Acceso con Google en 1 Clic y Pantalla Completa**
- **Acceso Directo con Google:** Ya no es necesario hacer doble clic; la aplicación recuerda tu congregación y te conecta automáticamente al iniciar sesión.
- **Diseño Amplio de Bienvenida:** Las ventanas de acceso aprovechan todo el ancho de la pantalla, con campos simétricos para el ID y el PIN de la congregación.

### [v0.1.0-alpha.0] — 23 de Octubre, 2026
**Sincronización en la Nube de Cero Conocimiento**
- **Arquitectura Privada:** Nueva sincronización donde el servidor en la nube nunca conoce las contraseñas, los PINs ni el contenido íntimo de tu congregación.

---

### [v0.0.10-alpha.8] — 21 de Octubre, 2026
**Más Espacio en Pantalla y Arranque Directo con Contenido**
- **Más Espacio Vertical:** Se eliminaron tarjetas y encabezados que duplicaban el nombre de la sección en 27 módulos. Toda la aplicación arranca de inmediato con sus tablas, filtros y herramientas útiles.
- **Barra de Navegación Unificada:** La barra superior fija muestra siempre tu congregación y sección actual con un diseño limpio estilo Notion y Linear.

### [v0.0.10-alpha.7] — 21 de Octubre, 2026
**Reloj Animado de Bloqueo por Inactividad y Alerta Suave**
- **Contador en Barra Superior:** Chip interactivo con anillo de progreso y cuenta regresiva de minutos restantes de inactividad.
- **Aviso Flotante en los Últimos 60 Segundos:** Alerta suave en la parte inferior de la pantalla antes del bloqueo; tocar cualquier parte restablece el tiempo al instante.
- **Selector de Tiempo en Ajustes:** Deslizador para configurar el bloqueo automático entre 5, 10 o 15 minutos según las necesidades del salón.

### [v0.0.10-alpha.5 & 6] — 21 de Octubre, 2026
**Botón de Modo Oscuro Minimalista y Herramientas Agrupadas**
- **Transición Sol ⇄ Luna:** Nuevo botón con animación fluida y alto contraste en modo oscuro para facilitar la lectura nocturna.
- **Herramientas de Ajustes en una Sola Fila:** Los botones "Guardar Ajustes" y "Mi Perfil" se integraron en la misma fila que las pestañas para mayor comodidad.

### [v0.0.10-alpha.4] — 21 de Octubre, 2026
**Sincronización Total de 20 Módulos y Guardado Automático**
- **Guardado Automático:** Cambios en programas de reunión, territorios, discursos, asistencia, carritos, paneles eléctricos y mantenimiento se sincronizan solos en segundo plano.
- **Cola sin Conexión Confiable:** Si estás sin internet en el Salón o en el territorio, tus registros se guardan en el teléfono y se suben solos al restablecerse la conexión.

### [v0.0.10-alpha.0 a 3] — 21 de Octubre, 2026
**Suite del Publicador, Gestos Táctiles y Accesos Directos Móviles**
- **Herramientas para el Ministerio:** Cronómetro de predicación persistente (sigue contando al bloquear el teléfono), meta mensual de horas, agenda de revisitas con enlace a WhatsApp y control de lecciones de cursos bíblicos.
- **Gestos Móviles (Swipe):** Deslizar el dedo desde el borde abre y cierra el menú lateral con total fluidez.
- **Modo Atril a Pantalla Completa:** Vista amplia sin distracciones para oradores y presidentes de reunión.
- **Icono Oficial e Instalación Móvil:** Accesos directos al mantener presionado el icono de la app en Android y iPhone (*Programación, Territorios, Asistencia y Anuncios*).

---

### [v0.0.9-alpha.0 a v0.0.9-alpha.2] — 20 y 21 de Octubre, 2026
**Formatos Oficiales en Local, Avisos Push y Gestión de Roles**
- **Llenado Local de Formatos Oficiales (S-21, S-89, S-140, S-88):** Completa papeletas e historiales en PDF directamente desde tu navegador sin subir documentos oficiales a la nube.
- **Notificaciones Push en Segundo Plano:** Recordatorios de asignaciones y turnos que llegan a tu teléfono móvil incluso si la app o el navegador están cerrados.
- **Gestor de Roles a Pantalla Completa:** Panel interactivo para asignar y renovar PINs personales y enviar credenciales por WhatsApp con un solo clic.

---

### [v0.0.1 a v0.0.8 (Alfa Inicial)] — Resumen de Fundamentos de Kongre
- **Gráficos de Tendencias de Asistencia:** Estadísticas mensuales del año de servicio y comparación presencial vs. Zoom.
- **Territorios Digitales y Mapas:** Asignación de territorios con enlaces QR y direcciones de no visitar.
- **Control de Acceso por Roles (RBAC):** Privilegios diferenciados para Coordinador, Ancianos, Siervos Ministeriales, Precursores y Publicadores.
- **Modo Fuera de Línea (PWA):** Aplicación instalable en teléfonos, tabletas y computadoras que funciona 100% sin conexión a internet.
