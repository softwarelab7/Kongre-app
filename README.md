# Kongre — Gestor Teocrático Integral

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo/kongre_horizontal_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="public/logo/kongre_horizontal_positivo.svg">
    <img src="public/logo/kongre_horizontal_positivo.svg" width="300" alt="Kongre — Gestor Teocrático Integral" />
  </picture>
</p>

<p align="center">
  <strong>Plataforma integral, moderna y segura para la administración, asignación y coordinación teocrática de congregaciones.</strong><br>
  <em>Disponible como Progressive Web App (PWA) Offline-First y aplicación nativa ultraligera para PC (Windows, macOS y Linux con Rust y Tauri v2).</em>
</p>

<p align="center">
  <a href="https://www.kongre-app.com"><strong>🌐 Acceder a la Aplicación Web en Producción (https://www.kongre-app.com)</strong></a> •
  <a href="https://github.com/softwarelab7/Kongre-app/releases"><strong>📥 Centro Oficial de Descargas para PC (GitHub Releases)</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versi%C3%B3n-v0.1.0--alpha.39-4C3AED?style=flat-square&logo=git&logoColor=white" alt="Versión v0.1.0-alpha.39" />
  <img src="https://img.shields.io/badge/Desktop-Rust%20%2B%20Tauri%20v2-orange?style=flat-square&logo=rust&logoColor=white" alt="Rust + Tauri v2" />
  <img src="https://img.shields.io/badge/SO-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square" alt="Sistemas Operativos" />
  <img src="https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8%2B-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Seguridad-Zero--Knowledge%20AES--256--GCM-blueviolet?style=flat-square&logo=shield" alt="Zero-Knowledge AES-256" />
  <img src="https://img.shields.io/badge/2FA-TOTP%20RFC%206238-00A4EF?style=flat-square&logo=microsoft&logoColor=white" alt="2FA TOTP RFC 6238" />
  <img src="https://img.shields.io/badge/PWA-Offline--First%20Ready-5a0fc8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Offline Ready" />
</p>

---

> [!IMPORTANT]
> ### 🏛️ Nota Importante sobre el Ecosistema Kongre
> 1. **`Kongre` (`softwarelab7/Kongre`):** Repositorio privado principal donde se guarda el proyecto y el código fuente. Se utiliza para el desarrollo interno y para enviar todas las actualizaciones a la app PWA en producción en **[kongre-app.com](https://www.kongre-app.com)**.
> 2. **`Kongre-app` (`softwarelab7/Kongre-app`):** Repositorio público oficial de la versión para PC, diseñado para que los usuarios, siervos y congregaciones puedan descargar e instalar fácilmente la aplicación de escritorio (`.exe`, `.dmg`, `.rpm`, `.deb`, `.AppImage`).
> 3. **Software de Código Cerrado:** Kongre es una aplicación de **código cerrado y privativa**. Solo el desarrollador conoce y tiene acceso al código fuente, resguardando la confidencialidad y la integridad teocrática del sistema.

---

## 📖 Descripción General

**Kongre** es un sistema teocrático integral diseñado para apoyar al cuerpo de ancianos, siervos ministeriales y publicadores en la organización ordenada, eficiente y confidencial de las actividades de congregación, bajo el principio bíblico:

> *«Pero que todas las cosas se hagan de forma digna y ordenada.»*  
> — **1 Corintios 14:40**

La aplicación combina la flexibilidad de una **Progressive Web App (PWA)** de última generación con la velocidad y seguridad de una **aplicación nativa de escritorio compilada con Rust (Tauri v2)**, permitiendo operar tanto con sincronización en la nube como de forma 100% desconectada (Offline-First).

---

## 🚀 Novedades de la Versión Actual (`v0.1.0-alpha.39`)

Para consultar el registro cronológico exhaustivo con todas las versiones y correcciones, revisa el [CHANGELOG.md](file:///home/hectorgutierrezjimenez/Documentos/Kongre/CHANGELOG.md) y la documentación de compilación de escritorio en [DESKTOP_RUST.md](file:///home/hectorgutierrezjimenez/Documentos/Kongre/DESKTOP_RUST.md).

### 🛠️ Empaquetado Nativo RPM para Fedora y Corrección de Filesystem
- **RPM Nativo Oficial con Tauri v2:** Compilación directa mediante `rpmbuild` en lugar de conversión `alien`, solucionando el conflicto de directorios protegidos del sistema (`/usr/bin`) en Fedora 40+.
- **Resolución Automática de Dependencias:** Declaración explícita de `webkit2gtk4.1` y `libsoup3` para instalación fluida en DNF.

### ⚡ Actualizador Nativo en 1 Clic (Tauri Updater)
- **Actualización Automática sin Salir de la App:** Integración con `@tauri-apps/plugin-updater` y `@tauri-apps/plugin-process` para actualizar automáticamente en Windows (`.exe`), macOS (`.dmg`) y Linux (`.AppImage`) con barra de progreso en vivo y reinicio asistido.
- **Validación Criptográfica Minisign:** Comprobación estricta de firma digital en cada paquete antes de su ejecución para máxima seguridad.

### 🐧 Detección Inteligente para Fedora y Ubuntu
- **Comando IPC `install_kind`:** Detecta si la aplicación se ejecuta instalada como paquete del sistema (`linux-rpm` o `linux-deb`) o como paquete portable (`appimage`).
- **Instalación Asistida para `.rpm` y `.deb`:** Presenta botón de descarga directa y el comando exacto para terminal listo para copiar con 1 clic (ej. `sudo dnf install ./Kongre-0.1.0-alpha.39-1.x86_64.rpm`).

### 🔔 Notificación Inmediata en Cabecera y Pie
- **Chequeo Inmediato al Iniciar:** Verificación sin tiempo de espera al arrancar la versión de escritorio y comparación SemVer estricta.
- **Aviso Visual:** Botón destacado en cabecera (*«¡Actualizar PC! v0.1.0-alpha.39»*) y en pie de página para abrir el panel de actualización.
- **Historial Integrado:** Soporte reactivo de rutas `#descargas`, `#downloads` e `#instalar` con navegación fluida de ida y vuelta.

### 🏛️ Rediseño Integral de la Sección «Acerca de Kongre»
- **Cockpit Teocrático en Vivo:** Maqueta interactiva con 4 pestañas reactivas (*Reunión Vida y Ministerio*, *Asistencia S-88*, *Territorios S-13* e *Informes de Servicio*) que simula en tiempo real la experiencia operativa del sistema.
- **Bento Grid Asimétrico con Iconografía Oficial:** Cuadrícula con ritmo visual diferenciado que integra los SVGs originales de la aplicación (`clm_vmc.svg`, `predicacion.svg`, `supervision.svg`, `discursos.svg`, `secretaria.svg`, `informes_servicio.svg`) y enlaces directos a la Guía de Usuario.
- **Flujo Teocrático en 3 Pasos:** Secuencia clara de adopción: *1. Inicialización e Importación local*, *2. Asignación y Programación Inteligente*, *3. Coordinación y Consulta Segura por portal o PDF/WhatsApp*.
- **Seguridad Cero Conocimiento y Principio Bíblico:** Bloque documental enfocado en el almacenamiento local cifrado (AES-256 + PBKDF2), cero telemetría y respeto a la confidencialidad ministerial.

### 🔘 Botón Estándar `DemoModeButton` y Purga de Artificios Visuales
- **Componente Unificado `DemoModeButton`:** Botón minimalista y serio en tonos slate neutros (`bg-slate-100 dark:bg-slate-800`), homogéneo en la web oficial, cabecera de PC, barra móvil, modal de acceso y panel interno.
- **Purga Total de Estrellas (`Sparkles`):** Erradicación de iconos de estrellas en botones e insignias teocráticas en favor de iconografía teocrática formal (`Building2`, `CheckCircle2`, `Download`, `BookOpen`) o tipografía sobria.

### 🖥️ Pantalla de Bienvenida 100% Zero-Scroll en Escritorio
- **Contenedor a Pantalla Completa:** Optimización estructural (`lg:h-screen lg:max-h-screen lg:overflow-hidden`) con centrado automático `my-auto`, permitiendo visualizar las 4 vías de acceso simultáneamente en monitores sin necesidad de scroll vertical.
- **Eliminación de Redundancias:** Retiro de botones duplicados en la tarjeta de inicio de sesión y banner lateral simplificado.

### 🦀 Kongre App Nativa para Escritorio (Rust + Tauri v2)
- **Rendimiento Excepcional:** Binario ultraligero que arranca en milisegundos y consume apenas ~15 MB de memoria RAM (frente a los ~150 MB de entornos tradicionales basados en Chromium/Electron).
- **Paquetes Oficiales Multiplataforma:**
  - **Windows 10 / 11:** Instalador `.exe` (NSIS) y paquete `.msi`.
  - **macOS:** Binario Universal `.dmg` compatible con procesadores Apple Silicon (M1 a M4) e Intel.
  - **Linux Fedora / RHEL:** Paquete nativo `.rpm` de 64 bits.
  - **Linux Ubuntu / Debian:** Paquete nativo `.deb`.
  - **Linux Universal:** Paquete portátil `.AppImage`.
- **Detección Automática de SO en Bienvenida:** Banner interactivo que detecta el sistema operativo del usuario y ofrece la descarga directa del instalador correspondiente.

### 🔐 Seguridad Cero Conocimiento (Fase 2) y Bóveda Criptográfica en Reposo
- **Bóveda no extraíble `atRestVault`:** Almacenamiento seguro con clave criptográfica AES-256 no extraíble (`extractable: false`) en IndexedDB (`kongre_vault_db`).
- **Token de Rol Firmado en Servidor (`kgr_srt1` HMAC-SHA256):** Validación en Edge Function de privilegios que impide la manipulación no autorizada en DevTools o variables locales.
- **Protección de Datos Médicos DPA y Notas:** Cifrado en modo CTR con nonce CSPRNG (`kgr_sec4:`) para directrices médicas (`dpa_date`, representantes de salud) y notas confidenciales del comité.

---

## 🏛️ Módulos y Capacidades del Sistema

| Módulo | Icono Oficial | Descripción y Funcionalidades |
| :--- | :---: | :--- |
| **Reunión Vida y Ministerio** | `clm_vmc.svg` | Programación semanal, asignaciones estudiantiles (Lectura, Primera Conversación, Revisitas, Discursos), exportación de plantillas oficiales **S-89** en PDF y control de sustituciones en tiempo real. |
| **Reunión Pública y Fin de Semana** | `discursos.svg` | Agenda de discursos públicos (1–194), coordinación de oradores visitantes, hospedaje, asignación de presidentes y lectores de La Atalaya. |
| **Territorios y Cartografía** | `predicacion.svg` | Cartografía interactiva con Leaflet y OpenStreetMap, polígonos de manzanas, asignaciones **S-13**, códigos QR para publicadores y registro de turnos en carritos públicos. |
| **Directorio de Publicadores (S-21)** | `supervision.svg` | Ficha personal completa, grupos de servicio, estado espiritual, control de nombramientos, ausencias acumuladas, directriz médica DPA y deduplicación inteligente de registros. |
| **Asistencia a las Reuniones (S-88)** | `secretaria.svg` | Registro numérico presencial vs. Zoom, cálculo automático de promedios mensuales y gráficas analíticas por año de servicio con Recharts. |
| **Informes del Servicio del Campo** | `informes_servicio.svg` | Consolidación mensual de informes de publicadores, horas de precursores regulares y auxiliares, notas confidenciales de secretaría y generación de resúmenes congregacionales. |
| **Cuentas y Mantenimiento del Salón** | — | Libro de transacciones de congregación, arqueo de fondos, inventario físico de publicaciones y diagrama del panel de disyuntores eléctricos de cabina. |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend Web** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/) |
| **Escritorio Nativo** | [Rust 2021](https://www.rust-lang.org/), [Tauri v2](https://v2.tauri.app/) (Edge WebView2 en Windows, WebKitGTK en Linux, WebKit nativo en macOS) |
| **Estilos & UI** | [Tailwind CSS v4](https://tailwindcss.com/) con sistema centralizado de variables de tema |
| **Temas Visuales** | **Claro**, **Oscuro** y modo especial de alto contraste para cabina de audio/video |
| **Gráficos & Visualización** | [Recharts](https://recharts.org/) |
| **Cartografía** | [Leaflet](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/), CartoDB, Esri World Imagery |
| **Criptografía** | Web Crypto API nativa: AES-256-GCM, PBKDF2 (hasta 600.000 iteraciones), HMAC-SHA1 TOTP (RFC 6238), CSPRNG |
| **Documentos & Exportación** | [jsPDF](https://github.com/parallax/jsPDF), [pdf-lib](https://pdf-lib.js.org/) y [html2canvas](https://html2canvas.hertzen.com/) |
| **Iconografía** | [Lucide React](https://lucide.dev/) + SVGs vectoriales teocráticos institucionales |
| **Almacenamiento Local** | IndexedDB (`kongre_vault_db`, `localforage`) y `localStorage` blindado |
| **Nube & Sincronización** | [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Edge Functions seguras con Deno) |

---

## 📥 Instalación y Acceso Oficial

**Kongre** es una solución teocrática cerrada y privada. Para utilizarla, **no se requiere clonar código fuente ni compilar paquetes manualmente**. Todos los instaladores se distribuyen listos para usar como binarios precompilados y firmados, o a través de la aplicación web en producción.

---

### Opción 1: Aplicación Nativa para PC (Recomendada para Salones y Escritorio)

Descarga el instalador correspondiente a tu sistema operativo desde el **[Centro Oficial de Descargas de Kongre](https://github.com/softwarelab7/Kongre-app/releases/latest)**:

| Sistema Operativo | Paquete Oficial | Método de Instalación |
| :--- | :--- | :--- |
| **🪟 Windows 10 / 11** | `Kongre_0.1.0-alpha.39_x64-setup.exe` | Ejecuta el instalador con doble clic y sigue el asistente interactivo de instalación. |
| **🍎 macOS (Apple Silicon M1-M4 & Intel)** | `Kongre_0.1.0-alpha.39_universal.dmg` | Abre el archivo `.dmg` y arrastra el icono de **Kongre** a la carpeta `Aplicaciones`. |
| **🔵 Fedora Linux / Red Hat / openSUSE** | `Kongre-0.1.0-alpha.39-1.x86_64.rpm` | Ejecuta en terminal: `sudo dnf install ./Kongre-0.1.0-alpha.39-1.x86_64.rpm` |
| **🟠 Ubuntu / Debian / Linux Mint** | `Kongre_0.1.0-alpha.39_amd64.deb` | Ejecuta en terminal: `sudo dpkg -i ./Kongre_0.1.0-alpha.39_amd64.deb` |
| **🐧 Linux Universal (Portable)** | `Kongre_0.1.0-alpha.39_amd64.AppImage` | Asigna permisos y ejecuta: `chmod +x Kongre_*.AppImage && ./Kongre_*.AppImage` |

> [!TIP]
> **Consumo ultraligero:** La aplicación nativa para PC está escrita en **Rust con Tauri v2** y consume únicamente ~15 MB de memoria RAM, garantizando arranque instantáneo y estabilidad continua incluso en computadoras modestas de cabina de sonido.

---

### Opción 2: Versión Web y Progressive Web App (Móvil & Tablets)

Puedes acceder de forma inmediata a la versión web completa desde cualquier dispositivo:

🌐 **Portal Web Oficial:** [https://www.kongre-app.com](https://www.kongre-app.com)

#### Cómo instalar como App en Teléfonos y Tablets (PWA Offline-First):
- **Android (Chrome / Firefox):** Abre [https://www.kongre-app.com](https://www.kongre-app.com), toca los tres puntos verticales `⋮` de la barra superior y selecciona **«Instalar aplicación»** o **«Agregar a la pantalla principal»**.
- **iPhone / iPad (Safari):** Abre [https://www.kongre-app.com](https://www.kongre-app.com), toca el botón **Compartir** (icono de cuadrado con flecha hacia arriba) y selecciona **«Agregar al inicio»**.

> [!NOTE]
> La aplicación web cuenta con soporte **100% Offline-First**: una vez cargada por primera vez, todos los módulos operan normalmente sin necesidad de conexión activa a internet.

---

### 🛡️ Naturaleza del Software y Uso Institucional
- **Software Privativo y Confidencial:** Kongre no es un proyecto de código abierto abierto a contribuciones externas públicas; está reservado para la administración teocrática confidencial de las congregaciones.
- **Equipo de Desarrollo Interno:** Los desarrolladores y administradores autorizados con acceso al repositorio privado pueden consultar la guía técnica de desarrollo en `DEVELOPMENT.md`.

---

## 🔒 Privacidad Teocrática y Seguridad Cero Conocimiento

Kongre fue diseñado desde el primer día con los más estrictos estándares de confidencialidad y principios bíblicos de respeto a los datos teocráticos:

1. **Cifrado de Conocimiento Cero (Zero-Knowledge):** Los datos teocráticos sensibles (asignaciones, notas de pastoreo, fichas de publicadores, teléfonos) se cifran en el propio dispositivo antes de cualquier transmisión.
2. **Sin Rastreo ni Telemetría Comercial:** Ningún dato personal o de actividad es vendido, monetizado ni compartido con terceros.
3. **Autenticación en Dos Pasos (2FA) TOTP Offline:** Compatible con **Microsoft Authenticator** y Google Authenticator sin requerir conexión a internet para la validación.
4. **Cumplimiento de Marca Google OAuth:** Declaración de uso transparente (*Limited Use Policy*) para el inicio de sesión asistido con cuenta de Google.

Las políticas legales completas están disponibles en:
- [Términos y Condiciones](file:///home/hectorgutierrezjimenez/Documentos/Kongre/public/terms.html)
- [Política de Privacidad y Protección de Datos](file:///home/hectorgutierrezjimenez/Documentos/Kongre/public/privacy.html)

---

## 📄 Licencia

Este proyecto está destinado para el uso ordenado, interno y teocrático de las congregaciones cristianas. Todos los derechos reservados.
