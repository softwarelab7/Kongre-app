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
  <img src="https://img.shields.io/badge/Versi%C3%B3n-v0.1.0--alpha.55-4C3AED?style=flat-square&logo=git&logoColor=white" alt="Versión v0.1.0-alpha.55" />
  <img src="https://img.shields.io/badge/Desktop-Rust%20%2B%20Tauri%20v2-orange?style=flat-square&logo=rust&logoColor=white" alt="Rust + Tauri v2" />
  <img src="https://img.shields.io/badge/SO-Linux%20Nativo%20%7C%20PWA%20Multiplataforma-blue?style=flat-square" alt="Sistemas Operativos" />
  <img src="https://img.shields.io/badge/Seguridad-Zero--Knowledge%20AES--256--GCM-blueviolet?style=flat-square&logo=shield" alt="Zero-Knowledge AES-256" />
  <img src="https://img.shields.io/badge/Bloqueo%20Local-TOTP%20RFC%206238-00A4EF?style=flat-square&logo=microsoft&logoColor=white" alt="Bloqueo Local TOTP RFC 6238" />
  <img src="https://img.shields.io/badge/PWA-Offline--First%20Ready-5a0fc8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Offline Ready" />
</p>

---

## 📖 Descripción General

**Kongre** es un sistema teocrático integral diseñado para apoyar al cuerpo de ancianos, siervos ministeriales y publicadores en la organización ordenada, eficiente y confidencial de las actividades de la congregación, bajo el principio bíblico:

> *«Pero que todas las cosas se hagan de forma digna y ordenada.»*  
> — **1 Corintios 14:40**

Combina una **Progressive Web App (PWA) 100 % Offline-First** para móviles, tabletas y ordenadores con una **aplicación nativa de escritorio para Linux** de arranque instantáneo y consumo mínimo (~15 MB de memoria RAM). Ofrece **4 temas visuales** (**Claro**, **Oscuro**, **Sepia** y **Cabina A/V**), navegación adaptada tanto para escritorio como para teléfono móvil y un **Modo Demo** interactivo para explorar todas sus funciones con datos de ejemplo.

> [!NOTE]
> Para consultar el historial detallado de versiones, mejoras y correcciones, revisa el [CHANGELOG.md](CHANGELOG.md).

---

## 🏛️ Módulos y Capacidades del Sistema

### 🗓️ Reuniones, Plataforma y Coordinación
- **Reunión Vida y Ministerio:** Programación semanal completa, importación directa de cuadernos semanales (`.epub`), asignaciones estudiantiles, autoasignación equitativa según cualificaciones, gestión de sustituciones, historial y generación de tarjetas de asignación **S-89** en PDF.
- **Reunión Pública y Visita del Superintendente de Circuito:** Agenda de discursos públicos (1–194), coordinación de oradores visitantes y hospedaje, turnos de presidente y lector de *La Atalaya*, y organización integral de la **Visita del SC**.
- **Consola de Plataforma, TV y Cronómetro:** Consola de presidencia y pantalla para el orador o televisor del salón (*Monitor Puro*, *Atril + Escaleta* y *Modo Zen*), semáforo de tiempo, avisos discretos a plataforma y sincronización en vivo entre pantallas.
- **Audio, Video, Zoom y Acomodadores:** Turnos semanales diferenciados entre **Entre Semana** y **Fin de Semana** para Audio, Video, Micrófonos, Plataforma, Acomodadores y **Anfitrión de Zoom**, junto con tablero de equidad en tres vistas.
- **Conmemoración, Asambleas, Calendario y Cartelera:** Planificación anual de la **Conmemoración (Memorial)** y asambleas, calendario de congregación, cartelera mensual y tablero digital de anuncios.

### 👥 Secretaría, Pastoreo y Servicio del Campo
- **Directorio de Publicadores y Tarjetas S-21:** Ficha personal en dos columnas, grupos de servicio, seguimiento de precursores regulares y auxiliares, notas confidenciales de pastoreo, directriz médica **DPA**, control de ausencias e impresión de tarjetas **S-21** en PDF.
- **Mi Ministerio e Informes del Servicio:** Cronómetro de predicación para uso personal del publicador, metas mensuales y registro **S-4**, recolección de informes de congregación y consolidación mensual para la sucursal (**S-1** y **S-205b**).
- **Asistencia a las Reuniones (S-88):** Registro numérico presencial y por Zoom, acceso rápido mediante etiquetas **NFC**, promedios mensuales y gráficas anuales por año de servicio.
- **Territorios, Cartografía y Predicación Pública:** Mapas interactivos (**Callejero**, **Satélite** y **Terreno**) con descarga para uso sin internet, geocerca GPS en vivo, trazado de manzanas, tarjetas **S-13** con notas de domicilio, tarjetas digitales móviles, escáner **QR**, etiquetas **NFC** y programación de turnos en carritos públicos.

### 🏢 Salón del Reino, Finanzas y Formatos Oficiales
- **Deberes, Aseo, Mantenimiento y Panel Eléctrico:** Rotación de grupos para limpieza y deberes del Salón del Reino, registro de mantenimiento preventivo o correctivo y diagrama del panel de disyuntores eléctricos de cabina.
- **Cuentas e Inventario:** Libro de cuentas de congregación, arqueo e informes de auditoría e inventario físico de publicaciones.
- **Centro de Formatos y Visor PDF Integrado:** Lector integrado de documentos PDF con paginación, zoom y rotación, además de llenado automático de formularios oficiales sin depender de programas externos.

### 📱 Operación Offline, Multi-dispositivo y Respaldos
- **Offline-First con Sincronización en la Nube:** Todos los módulos funcionan sin conexión a internet y sincronizan cambios al recuperar señal, incluyendo un panel de estado offline, protección contra conflictos o retrocesos de versión y notificaciones **Web Push** en segundo plano.
- **Transferencia Local y Respaldos Portables:** Intercambio directo y cifrado entre dispositivos cercanos mediante código **QR** sin necesidad de internet, además de exportación e importación de copias de seguridad portables protegidas con frase de paso.
- **Cuenta Personal, Roles y Preferencias:** Consola unificada para gestionar perfil, sesiones activas, bloqueo automático por inactividad y apariencia en escritorio o móvil.

---

## 🔐 Privacidad Teocrática y Seguridad Cero Conocimiento

**Kongre** está diseñado desde su base para proteger la confidencialidad de la congregación:

1. **Cifrado de Conocimiento Cero (`Zero-Knowledge`):** Los datos sensibles (teléfonos, direcciones, notas de pastoreo, fichas S-21, finanzas, directrices médicas DPA) se cifran en el dispositivo del usuario (`AES-256-GCM` + `PBKDF2 600.000` iteraciones) antes de enviarse a la nube, divididos en ámbitos cifrados por departamento.
2. **Bóveda Local en Reposo:** Protección adicional de las credenciales y registros almacenados localmente en el dispositivo.
3. **Control Granular de Roles y Credenciales:** Administración de permisos por responsabilidad teocrática, revocación inmediata de PINs comprometidos, historial de dispositivos vinculados y bloqueo local opcional compatible con **Microsoft Authenticator** y Google Authenticator (**TOTP RFC 6238**).
4. **Sin Rastreo ni Telemetría Comercial:** Ningún dato personal o congregacional es vendido ni compartido con terceros, y las consultas externas de ubicación permanecen desactivadas salvo autorización expresa. Cumple con Google OAuth *Limited Use Policy* en el inicio de sesión asistido.

Las políticas legales completas están disponibles en el portal oficial:
- [Términos y Condiciones](https://www.kongre-app.com/terms.html)
- [Política de Privacidad y Protección de Datos](https://www.kongre-app.com/privacy.html)

---

## 📥 Instalación y Acceso Oficial

**Kongre** es un software teocrático de **código cerrado y uso privado**. Para utilizarlo, **no se requiere clonar código fuente ni compilar paquetes**. Todos los instaladores oficiales se distribuyen listos para usar o directamente desde la aplicación web en producción.

### Opción 1: Aplicación Nativa para Linux (PC y Cabina de Sonido)

Descarga el paquete correspondiente desde el **[Centro Oficial de Descargas de Kongre](https://github.com/softwarelab7/Kongre-app/releases/latest)**:

| Sistema Operativo | Paquete Oficial (`v0.1.0-alpha.55`) | Método de Instalación |
| :--- | :--- | :--- |
| **🔵 Fedora Linux / Red Hat / openSUSE** | `Kongre-0.1.0-alpha.55-1.x86_64.rpm` | `sudo dnf install ./Kongre-0.1.0-alpha.55-1.x86_64.rpm` |
| **🟠 Ubuntu / Debian / Linux Mint** | `Kongre_0.1.0-alpha.55_amd64.deb` | `sudo dpkg -i ./Kongre_0.1.0-alpha.55_amd64.deb` |
| **🐧 Linux Universal (Portable)** | `Kongre_0.1.0-alpha.55_amd64.AppImage` | `chmod +x Kongre_*.AppImage && ./Kongre_*.AppImage` |

> [!TIP]
> **Consumo ultraligero:** La aplicación nativa para Linux consume apenas ~15 MB de memoria RAM, garantizando arranque instantáneo y estabilidad continua incluso en computadoras modestas de cabina de sonido.

### Opción 2: Aplicación Web y PWA de Escritorio (Windows, macOS, Móviles y Tablets)

🌐 **Portal Web Oficial:** [https://www.kongre-app.com](https://www.kongre-app.com)

* **🪟 Windows (Google Chrome / Microsoft Edge):** Abre [https://www.kongre-app.com](https://www.kongre-app.com) y haz clic en el icono de instalación `⊕` en la barra de direcciones (o en el menú `⋮` $\rightarrow$ **«Instalar Kongre»**). Se anclará al Menú Inicio y a la Barra de Tareas sin advertencias de SmartScreen.
* **🍎 macOS (Safari / Google Chrome / Edge):** Abre [https://www.kongre-app.com](https://www.kongre-app.com) y selecciona **Archivo** $\rightarrow$ **«Agregar al Dock»** (o en Chrome: `⋮` $\rightarrow$ **«Instalar Kongre»**).
* **📱 Android (Chrome / Firefox):** Abre [https://www.kongre-app.com](https://www.kongre-app.com) y toca `⋮` $\rightarrow$ **«Instalar aplicación»** o **«Agregar a la pantalla principal»**.
* **🍏 iPhone / iPad (Safari):** Abre [https://www.kongre-app.com](https://www.kongre-app.com) y toca el botón **Compartir** $\rightarrow$ **«Agregar al inicio»**.

> [!NOTE]
> La aplicación web ofrece funcionamiento **100 % Offline-First**: una vez instalada o cargada, todos los módulos operan normalmente incluso sin conexión a internet.

### 🛡️ Naturaleza del Software y Uso Institucional
- **Software Privativo y Confidencial:** Kongre es una aplicación de código cerrado reservada para la administración teocrática confidencial de las congregaciones cristianas. Este repositorio público está destinado exclusivamente a la distribución de instaladores oficiales, documentación para usuarios finales y registro de versiones en [CHANGELOG.md](CHANGELOG.md).

---

## 📄 Licencia

Software de código cerrado destinado para el uso ordenado, interno y teocrático de las congregaciones cristianas. Todos los derechos reservados.
