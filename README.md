# Kongre — Gestor Teocrático Integral

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/kongre_horizontal_dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/kongre_horizontal_light.png">
    <img src="assets/kongre_horizontal_light.png" width="320" alt="Kongre — Gestor Teocrático Integral" />
  </picture>
</p>

<p align="center">
  <strong>Plataforma integral, moderna y segura para la administración, asignación y coordinación teocrática de congregaciones.</strong><br>
  <em>Disponible como Progressive Web App (PWA) Offline-First para todo dispositivo y aplicación nativa ultraligera para Linux (Rust + Tauri v2).</em>
</p>

<p align="center">
  <a href="https://www.kongre-app.com"><strong>🌐 Acceder a la Aplicación Web en Producción (https://www.kongre-app.com)</strong></a> •
  <a href="https://github.com/softwarelab7/Kongre-app/releases"><strong>📥 Centro Oficial de Descargas para PC (GitHub Releases)</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versi%C3%B3n-v0.1.0--alpha.50-4C3AED?style=flat-square&logo=git&logoColor=white" alt="Versión v0.1.0-alpha.50" />
  <img src="https://img.shields.io/badge/Desktop-Rust%20%2B%20Tauri%20v2-orange?style=flat-square&logo=rust&logoColor=white" alt="Rust + Tauri v2" />
  <img src="https://img.shields.io/badge/SO-Linux%20Nativo%20%7C%20PWA%20Multiplataforma-blue?style=flat-square" alt="Sistemas Operativos" />
  <img src="https://img.shields.io/badge/Seguridad-Zero--Knowledge%20AES--256--GCM-blueviolet?style=flat-square&logo=shield" alt="Zero-Knowledge AES-256" />
  <img src="https://img.shields.io/badge/2FA-TOTP%20RFC%206238-00A4EF?style=flat-square&logo=microsoft&logoColor=white" alt="2FA TOTP RFC 6238" />
  <img src="https://img.shields.io/badge/PWA-Offline--First%20Ready-5a0fc8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Offline Ready" />
</p>

---

## 📖 Descripción General

**Kongre** es un sistema teocrático integral diseñado para apoyar al cuerpo de ancianos, siervos ministeriales y publicadores en la organización ordenada, eficiente y confidencial de las actividades de congregación, bajo el principio bíblico:

> *«Pero que todas las cosas se hagan de forma digna y ordenada.»*  
> — **1 Corintios 14:40**

La aplicación combina la flexibilidad de una **Progressive Web App (PWA)** de última generación con la velocidad y seguridad de una **aplicación nativa de escritorio para Linux compilada con Rust (Tauri v2)**, permitiendo operar tanto con sincronización en la nube como de forma 100% desconectada (Offline-First).

---

## 🚀 Novedades de la Versión Actual (`v0.1.0-alpha.50`)

Para consultar el registro cronológico completo con todas las versiones y correcciones, revisa el [CHANGELOG.md](CHANGELOG.md).

### 🎨 Sistema Visual «Instrumento Teocrático Sobrio», Paridad Sepia y Accesibilidad (`v0.1.0-alpha.50`)
- **Diseño Sobrio de Alta Legibilidad:** Transición integral hacia hojas visuales limpias y uniformes en los **4 temas** (**Claro**, **Oscuro**, **Sepia** `#f4ecd8` y **Cabina A/V** `#000000`), pensadas para lectura prolongada sin fatiga visual y con alineación numérica precisa en cronogramas, cuentas e informes.
- **Accesibilidad y Diseño Móvil Reforzado:** Cierre uniforme de diálogos con tecla `Escape`, navegación consistente por teclado, respeto a preferencias de movimiento reducido, adaptación fluida a pantallas móviles verticales y eliminación total de diálogos nativos del navegador.

### ⚡ Arquitectura Optimizada y Mayor Fluidez de Arranque
- **Modularización Completa y Arranque Más Rápido:** Reorganización interna integral de la aplicación en módulos ligeros bajo demanda para que la pantalla inicial cargue más rápido y con menor consumo de memoria tanto en móvil como en PC.
- **Calidad Verificada:** Validación automatizada ampliada a **237 pruebas** continuas sobre criptografía, sincronización, documentos oficiales, mapas y accesibilidad.

### 🛡️ Seguridad Cero Conocimiento Fase 3: Sobres Departamentales, Anti-Rollback y Contexto
- **Sobres Departamentales y Validación de Contexto:** Compartimentación cifrada por departamento acorde al rol asignado, verificación estricta de pertenencia de los datos descifrados y filtro de calidad de PINs con clave maestra de 16 dígitos por defecto.
- **Protección de PINs en Reposo con AES-256-GCM:** Cifrado autenticado del almacenamiento local vinculado a la bóveda no extraíble del navegador, retirando formatos heredados.
- **Protección Anti-Rollback y Privacidad GeoIP:** Detección automática ante devoluciones inesperadas de versiones antiguas en sincronización con diálogo guiado de recuperación, firma de confirmación en asignaciones estudiantiles y bloqueo de consultas externas de ubicación salvo autorización explícita.

### ⏱️ «Cronómetro y Plataforma», Etiquetas NFC y Cartografía Offline (`v0.1.0-alpha.48` – `v0.1.0-alpha.50`)
- **Cronómetro y Plataforma para PC y Cabina A/V:** Consola unificada (**Consola Presidencia** y **Pantalla Orador** con disposiciones *Monitor Puro* y *Atril + Escaleta*), accesos directos exclusivos en PC desde Inicio, semáforo de tiempo, modo Zen sin distracciones, aviso visual para plataforma y sincronización multipantalla en vivo, junto con programas semanales Vida y Ministerio actualizados.
- **Lectura y Registro NFC + Mapas Offline:** Escaneo Web NFC en dispositivos compatibles para abrir tarjetas personales de territorio **S-13** o el registro de asistencia **S-88** al acercar una etiqueta registrada, descarga de mapas de territorios para consulta sin internet y exportación CSV en Grupos de Servicio.
- **Actualizador Nativo de Escritorio para Linux:** Verificación confiable de nuevas versiones desde GitHub Releases y el actualizador nativo interno, prioridad de paquete `.rpm` versionado con comando directo de actualización en Fedora/RHEL y descargas fijadas por versión para `.rpm`, `.deb` y `.AppImage`.

### 🔐 Blindaje Criptográfico y Respaldos Portables (`v0.1.0-alpha.45` – `v0.1.0-alpha.47`)
- **Tokens a 600.000 PBKDF2, Concurrencia Optimista y Passphrases:** Paridad criptográfica completa con `AES-256-GCM`, control atómico contra conflictos de guardado simultáneo con auto-reconciliación en la nube y soporte íntegro de passphrases de hasta 24 caracteres.
- **Respaldos Portables Cifrados y P2P / QR Cifrado de Extremo a Extremo:** Exportación `.kongre.json` protegida con frase de paso y recuperación integral al cambiar de navegador o equipo, transferencia directa local P2P/QR cifrada sin internet, códigos de invitación de 80 bits y revalidación continua de sesiones de rol.

### 🔐 Cifrado en Reposo Resiliente y Control Operativo
- **Descifrado Transparente en Reposo:** Protección local en el dispositivo de teléfonos, direcciones, notas de secretaría, visitas de pastoreo, finanzas y directriz médica DPA mediante bóveda criptográfica no extraíble.
- **Revocación Inmediata de Credenciales y Auditoría para Ancianos:** Invalidación en caliente de PINs comprometidos u olvidados con generación inmediata de nuevo PIN de 6 dígitos y registro de dispositivos vinculados.
- **Centro de Control Offline y Visor PDF Interactivo:** Inspección en vivo de registros cacheados y cola pendiente de sincronización, además de visor PDF integrado con paginación, zoom, rotación y autoasignación equitativa de reuniones.

### 🦀 Kongre App Nativa para Escritorio en Linux (Rust + Tauri v2)
- **Rendimiento Ultraligero:** Binario nativo que arranca en milisegundos y consume apenas ~15 MB de memoria RAM en PCs de escritorio o cabina de sonido.
- **Paquetes Oficiales para Linux:**
  - **Fedora / RHEL / openSUSE:** Paquete nativo `.rpm` de 64 bits.
  - **Ubuntu / Debian / Linux Mint:** Paquete nativo `.deb`.
  - **Linux Universal:** Paquete portátil `.AppImage` con actualización automática.
- **Windows y macOS vía PWA Dedicada:** Detección automática del sistema operativo para ofrecer instaladores Linux o instalación en 1 clic como App de Escritorio PWA sin advertencias ni certificados externos.

---

## 🏛️ Módulos y Capacidades del Sistema

| Módulo | Capacidades Principales |
| :--- | :--- |
| **Reunión Vida y Ministerio** | Programación semanal, asignaciones estudiantiles (Lectura, Primera Conversación, Revisitas, Discursos), exportación de asignaciones oficiales **S-89** en PDF (relleno de plantilla oficial o generador vectorial nativo en 1 clic), consola **Cronómetro y Plataforma** y control de sustituciones en tiempo real. |
| **Reunión Pública y Fin de Semana** | Agenda de discursos públicos (1–194), coordinación de oradores visitantes, hospedaje, asignación de presidentes y lectores de La Atalaya. |
| **Territorios y Cartografía** | Cartografía interactiva con OpenStreetMap y soporte offline, polígonos y geocerca GPS en vivo, asignaciones **S-13**, códigos QR y etiquetas NFC para publicadores y registro de turnos en carritos públicos. |
| **Directorio de Publicadores (S-21)** | Ficha personal completa, grupos de servicio, estado espiritual, control de nombramientos, ausencias acumuladas, directriz médica DPA, tarjetas **S-21** en PDF con generación nativa resiliente y deduplicación inteligente. |
| **Asistencia a las Reuniones (S-88)** | Registro numérico presencial vs. Zoom (incluyendo acceso rápido NFC), cálculo automático de promedios mensuales y gráficas analíticas por año de servicio. |
| **Informes del Servicio del Campo** | Consolidación mensual de informes de publicadores, horas de precursores regulares y auxiliares, notas confidenciales de secretaría y generación de resúmenes congregacionales **S-1**. |
| **Cuentas y Mantenimiento del Salón** | Libro de transacciones de congregación, arqueo e informes de auditoría, inventario físico de publicaciones, mantenimiento del Salón del Reino y diagrama del panel eléctrico de cabina. |

---

## 📥 Instalación y Acceso Oficial

**Kongre** es un software teocrático de **código cerrado y uso privado**. Para utilizarlo, **no se requiere clonar código fuente ni compilar paquetes**. Todos los instaladores oficiales se distribuyen listos para usar como binarios precompilados, o directamente mediante la aplicación web en producción.

---

### Opción 1: Aplicación Nativa para Linux (PC y Cabina de Sonido)

Para sistemas Linux, descarga el paquete correspondiente desde el **[Centro Oficial de Descargas de Kongre](https://github.com/softwarelab7/Kongre-app/releases/latest)** *(los binarios de `v0.1.0-alpha.50` estarán disponibles en Releases al publicarse la etiqueta `v0.1.0-alpha.50`)*:

| Sistema Operativo | Paquete Oficial | Método de Instalación |
| :--- | :--- | :--- |
| **🔵 Fedora Linux / Red Hat / openSUSE** | `Kongre-0.1.0-alpha.50-1.x86_64.rpm` | Ejecuta en terminal: `sudo dnf install ./Kongre-0.1.0-alpha.50-1.x86_64.rpm` |
| **🟠 Ubuntu / Debian / Linux Mint** | `Kongre_0.1.0-alpha.50_amd64.deb` | Ejecuta en terminal: `sudo dpkg -i ./Kongre_0.1.0-alpha.50_amd64.deb` |
| **🐧 Linux Universal (Portable)** | `Kongre_0.1.0-alpha.50_amd64.AppImage` | Asigna permisos y ejecuta: `chmod +x Kongre_*.AppImage && ./Kongre_*.AppImage` |

> [!TIP]
> **Consumo ultraligero:** La aplicación nativa para Linux está compilada en **Rust con Tauri v2** y consume únicamente ~15 MB de memoria RAM, garantizando arranque instantáneo y estabilidad continua incluso en computadoras modestas de cabina de sonido.

---

### Opción 2: Aplicación Web y PWA de Escritorio (Windows, macOS, Móviles y Tablets)

Para **Windows** y **macOS**, la experiencia oficial y recomendada es la **Progressive Web App (PWA)** desde el portal oficial:

🌐 **Portal Web Oficial:** [https://www.kongre-app.com](https://www.kongre-app.com)

#### Cómo instalar como App Nativa en 1 Clic (Sin advertencias ni configuraciones avanzadas):
* **🪟 Windows (Google Chrome / Microsoft Edge):** Abre [https://www.kongre-app.com](https://www.kongre-app.com), haz clic en el icono de instalación en la barra de direcciones `⊕` (o en el menú `⋮` $\rightarrow$ **«Instalar Kongre»**). Se anclará al Menú Inicio y a la Barra de Tareas, abriendo en su propia ventana independiente y sin advertencias de SmartScreen.
* **🍎 macOS (Google Chrome / Safari / Edge):** Abre [https://www.kongre-app.com](https://www.kongre-app.com), ve a **Archivo** $\rightarrow$ **«Agregar al Dock»** (o en Chrome: `⋮` $\rightarrow$ **«Instalar Kongre»**). Funcionará como una aplicación de escritorio en el Dock sin restricciones de Gatekeeper.
* **📱 Android (Chrome / Firefox):** Abre [https://www.kongre-app.com](https://www.kongre-app.com), toca `⋮` $\rightarrow$ **«Instalar aplicación»** o **«Agregar a la pantalla principal»**.
* **🍏 iPhone / iPad (Safari):** Abre [https://www.kongre-app.com](https://www.kongre-app.com), toca el botón **Compartir** $\rightarrow$ **«Agregar al inicio»**.

> [!NOTE]
> La aplicación web cuenta con soporte **100% Offline-First**: una vez cargada por primera vez, todos los módulos operan normalmente sin necesidad de conexión activa a internet.

---

### 🛡️ Naturaleza del Software y Uso Institucional
- **Software Privativo y Confidencial:** Kongre es una aplicación de código cerrado reservada para la administración teocrática confidencial de las congregaciones cristianas. Este repositorio público está destinado exclusivamente a la distribución de instaladores oficiales y notas de versión para usuarios finales.

---

## 🔒 Privacidad Teocrática y Seguridad Cero Conocimiento

Kongre fue diseñado desde el primer día con los más estrictos estándares de confidencialidad y principios bíblicos de respeto a los datos teocráticos:

1. **Cifrado de Conocimiento Cero (Zero-Knowledge):** Los datos teocráticos sensibles (asignaciones, notas de pastoreo, fichas de publicadores, teléfonos, directrices médicas) se cifran en el propio dispositivo (`AES-256-GCM` + `PBKDF2 600.000` iteraciones) antes de cualquier transmisión.
2. **Sin Rastreo ni Telemetría Comercial:** Ningún dato personal o de actividad es vendido, monetizado ni compartido con terceros.
3. **Autenticación en Dos Pasos (2FA) TOTP Offline:** Compatible con **Microsoft Authenticator** y Google Authenticator sin requerir conexión a internet para la validación.
4. **Cumplimiento de Marca Google OAuth:** Declaración de uso transparente (*Limited Use Policy*) para el inicio de sesión asistido con cuenta de Google.

Las políticas legales completas están disponibles en el portal oficial:
- [Términos y Condiciones](https://www.kongre-app.com/terms.html)
- [Política de Privacidad y Protección de Datos](https://www.kongre-app.com/privacy.html)

---

## 📄 Licencia

Software de código cerrado destinado para el uso ordenado, interno y teocrático de las congregaciones cristianas. Todos los derechos reservados.
