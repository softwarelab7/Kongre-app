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
  <img src="https://img.shields.io/badge/Versi%C3%B3n-v0.1.0--alpha.66-4C3AED?style=flat-square&logo=git&logoColor=white" alt="Versión v0.1.0-alpha.66" />
  <img src="https://img.shields.io/badge/Etapa-Alfa%20(pruebas%20antes%20de%20la%20beta)-orange?style=flat-square" alt="Etapa Alfa" />
  <img src="https://img.shields.io/badge/Desktop-Linux%20Nativo-orange?style=flat-square&logo=linux&logoColor=white" alt="Linux nativo" />
  <img src="https://img.shields.io/badge/Seguridad-Zero--Knowledge%20AES--256--GCM-blueviolet?style=flat-square&logo=shield" alt="Zero-Knowledge AES-256" />
  <img src="https://img.shields.io/badge/PWA-Offline--First-5a0fc8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Offline-First" />
</p>

---

## 📖 Descripción General

**Kongre** es un sistema teocrático integral diseñado para apoyar al cuerpo de ancianos, siervos ministeriales y publicadores en la organización ordenada, eficiente y confidencial de las actividades de la congregación, bajo el principio bíblico:

> *«Pero que todas las cosas se hagan de forma digna y ordenada.»*  
> — **1 Corintios 14:40**

Combina una **Progressive Web App (PWA) Offline-First** para móviles, tabletas y computadoras con una **aplicación nativa de escritorio para Linux** de arranque instantáneo y consumo mínimo (~15 MB de RAM). Cada hermano entra con **su propia cuenta Kongre** y ve solo lo que le corresponde según su nombramiento y sus departamentos. Ofrece **4 temas visuales** (**Claro**, **Oscuro**, **Sepia** y **Cabina A/V**), navegación pensada para el teléfono y un **Modo Demo** para explorar todo con datos de ejemplo.

> [!IMPORTANT]
> **Etapa actual: Alfa — pruebas antes de la beta.** Se está probando en una congregación real; las próximas versiones traen sobre todo arreglos y mejoras de lo que ya existe.

> [!NOTE]
> Para consultar el historial detallado de versiones, mejoras y correcciones, revisa el [CHANGELOG.md](CHANGELOG.md).

---

## 🏛️ Módulos y Capacidades del Sistema

### 🪪 Cuentas Kongre, Vinculación y Accesos
- **Cuenta personal con código único:** al registrarse, cada persona recibe un código `KP-XXXX-XXXX-XXXX` que es **su ID fijo** (no cambia nunca), con contraseña, código de recuperación, entrada opcional con correo o Google y su ministerio personal cifrado en la cuenta.
- **Vincular hermano por código:** los ancianos escriben el código que les envía el hermano y Kongre crea su ficha con **el nombre con que se registró**; si ya tenía una ficha hecha a mano (sin cuenta), se vincula esa sin duplicarla, y si estuvo antes en la congregación, se recupera su ficha con todo su historial.
- **Invitar a toda la congregación con QR:** un código QR por grupo de servicio; cada hermano elige su nombre y los ancianos aprueban en bloque.
- **Lo que ve cada uno sale de su ficha:** nombramiento, privilegio y departamentos deciden sus pantallas e insignias; los cambios se aplican al momento. Qué hace cada rol lo ven solo ancianos y siervos ministeriales.
- **Bajas ordenadas:** «Dar de baja» (traslado, dejó de asociarse…) desvincula la cuenta, cambia las llaves de la congregación, guarda la ficha con su historial y genera la **S-21** del traslado. La papelera nunca deja cuentas con acceso.

### 🗓️ Reuniones, Plataforma y Coordinación
- **Reunión Vida y Ministerio:** programación semanal completa, importación de cuadernos (`.epub`), asignaciones estudiantiles, autoasignación equitativa según cualificaciones, sustituciones, historial y tarjetas **S-89** en PDF.
- **«Puedo / No puedo»:** cada hermano confirma sus asignaciones desde **Mis asignaciones**; si no puede, el encargado recibe el aviso con sustitutos sugeridos.
- **Reunión Pública y Visita del Superintendente de Circuito:** discursos públicos (1–194), oradores visitantes y hospedaje, presidente y lector de *La Atalaya*, y la **Visita del SC**.
- **Consola de Plataforma, TV y Cronómetro:** pantalla del orador (*Monitor Puro*, *Atril + Escaleta* y *Modo Zen*), semáforo de tiempo, avisos discretos y sincronización en vivo. La **pantalla del Salón** se vincula con su propia cuenta y abre directo en modo TV (programa, deberes y cartelera, solo para ver); la puede vincular el titular de Audio y Video.
- **Audio, Video, Zoom y Acomodadores:** turnos de Entre Semana y Fin de Semana para Audio, Video, Micrófonos, Plataforma, Acomodadores y **Anfitrión de Zoom**, con tablero de equidad.
- **Conmemoración, Asambleas, Calendario y Cartelera:** Conmemoración y asambleas, calendario de congregación, **cartelera** con programa, avisos y PDF con fecha de caducidad.

### 👥 Secretaría, Pastoreo y Servicio del Campo
- **Directorio de Publicadores y Tarjetas S-21:** ficha completa del hermano, grupos de servicio, precursores, notas confidenciales de pastoreo, directriz médica **DPA**, ausencias e impresión **S-21** en PDF. Cada ficha muestra el código de su cuenta como ID y nunca se mezcla con otra por tener un nombre parecido.
- **Mi Ministerio e Informes:** cronómetro de predicación, meta mensual con planta que crece (**Mi jardín**), revisitas y estudios, registro **S-4** con **recordatorio del 1 al 5 de cada mes** y pendientes por grupo, y consolidación mensual (**S-1** y **S-205b**).
- **Asistencia a las Reuniones (S-88):** conteo presencial y por Zoom, etiquetas **NFC**, promedios mensuales y gráficas por año de servicio.
- **Territorios y Mapas sin internet:** mapas interactivos, **mapa de la congregación que se descarga solo** en cada teléfono (Wi-Fi o datos móviles), tarjetas **S-13**, tarjetas digitales con **manzanas trabajadas y casas «no visitar» marcadas aunque no haya internet**, escáner **QR**, **NFC** y turnos de carritos.
- **Mochila de Emergencia:** lista personal o familiar para salir de casa, compartida con la familia.

### 🏢 Salón del Reino y Formatos Oficiales
- **Deberes, Aseo, Mantenimiento y Panel Eléctrico:** rotación de limpieza y deberes, bitácora de mantenimiento y diagrama del panel de disyuntores.
- **Inventario de literatura:** inventario de publicaciones y pedidos especiales.
- **Centro de Formatos y Visor PDF:** visor integrado con paginación, zoom y rotación, y llenado de formularios oficiales sin programas externos.

### 📱 Sin Internet, Varios Dispositivos y Respaldos
- **Offline-First con sincronización segura:** todo funciona sin conexión y se sincroniza al volver la señal, con protección contra versiones viejas y avisos **Web Push** según el rol de cada uno.
- **Respaldos:** copia del ministerio personal en un archivo o en **Google Drive** (cifrada con una frase propia), copias de congregación portables y transferencia directa entre dispositivos por **QR**.
- **Mi Perfil:** mi cuenta, mis roles, mis datos, copias, seguridad del dispositivo (bloqueo por inactividad y **Authenticator**) y avisos.

---

## 🔐 Privacidad Teocrática y Seguridad Cero Conocimiento

1. **Cifrado de Conocimiento Cero (`Zero-Knowledge`):** los datos de la congregación se cifran en el dispositivo (`AES-256-GCM`) antes de llegar a la nube. **El servidor no guarda nombres** ni puede leer fichas, informes, notas de pastoreo ni directrices DPA.
2. **Llaves por cuenta y por departamento:** cada cuenta recibe solo las llaves que le corresponden (congregación, departamento o grupo). Al dar de baja a alguien, las llaves cambian.
3. **Cuenta personal protegida:** contraseña derivada con `PBKDF2`, código de recuperación, sesiones por dispositivo que se pueden cerrar a distancia y ministerio personal cifrado en una bóveda que solo la persona puede abrir.
4. **Bóveda local y bloqueo del dispositivo:** claves no extraíbles en `IndexedDB` y bloqueo local opcional compatible con **Microsoft Authenticator** y Google Authenticator (**TOTP RFC 6238**).
5. **Sin rastreo ni telemetría comercial:** nada se vende ni se comparte con terceros. Si algo falla, la app envía solo un resumen técnico del error, sin datos de la congregación.

Las políticas legales completas están en el portal oficial:
- [Términos y Condiciones](https://www.kongre-app.com/terms.html)
- [Política de Privacidad y Protección de Datos](https://www.kongre-app.com/privacy.html)

---

## 📥 Instalación y Acceso Oficial

**Kongre** es un software teocrático de **código cerrado y uso privado**. Para usarlo **no se requiere clonar código ni compilar paquetes**: se usa desde la web o con los instaladores oficiales.

### Opción 1: Aplicación Web y PWA (Windows, macOS, Android, iPhone y iPad)

🌐 **Portal Web Oficial:** [https://www.kongre-app.com](https://www.kongre-app.com) — siempre tiene la **última versión** (`v0.1.0-alpha.66`).

* **🪟 Windows (Chrome / Edge):** abre el portal y haz clic en el icono de instalación `⊕` de la barra de direcciones (o `⋮` → **«Instalar Kongre»**).
* **🍎 macOS (Safari / Chrome / Edge):** **Archivo** → **«Agregar al Dock»** (o `⋮` → **«Instalar Kongre»**).
* **📱 Android (Chrome / Firefox):** `⋮` → **«Instalar aplicación»**.
* **🍏 iPhone / iPad (Safari):** **Compartir** → **«Agregar al inicio»**.

Para unirte a tu congregación: crea tu cuenta con tu nombre, comparte tu código `KP-…` con los ancianos (o escanea el QR de tu grupo) y acepta la invitación.

### Opción 2: Aplicación Nativa para Linux (PC y Cabina de Sonido)

Descarga el paquete desde el **[Centro Oficial de Descargas de Kongre](https://github.com/softwarelab7/Kongre-app/releases/latest)**:

| Sistema Operativo | Paquete Oficial (`v0.1.0-alpha.56`) | Método de Instalación |
| :--- | :--- | :--- |
| **🔵 Fedora / Red Hat / openSUSE** | `Kongre-0.1.0-alpha.56-1.x86_64.rpm` | `sudo dnf install ./Kongre-0.1.0-alpha.56-1.x86_64.rpm` |
| **🟠 Ubuntu / Debian / Linux Mint** | `Kongre_0.1.0-alpha.56_amd64.deb` | `sudo dpkg -i ./Kongre_0.1.0-alpha.56_amd64.deb` |
| **🐧 Linux Universal (Portable)** | `Kongre_0.1.0-alpha.56_amd64.AppImage` | `chmod +x Kongre_*.AppImage && ./Kongre_*.AppImage` |

> [!NOTE]
> Los instaladores para Linux publicados son de la `v0.1.0-alpha.56`. Para tener las novedades más recientes (cuentas, vincular hermano por código, «Puedo / No puedo», mapas automáticos…), usa la aplicación web o su versión instalada como PWA.

### 🛡️ Naturaleza del Software y Uso Institucional
- **Software Privativo y Confidencial:** Kongre es una aplicación de código cerrado reservada para la administración teocrática confidencial de las congregaciones cristianas. Este repositorio público solo contiene los instaladores oficiales, la documentación para usuarios y el registro de versiones en [CHANGELOG.md](CHANGELOG.md).

---

## 📄 Licencia

Software de código cerrado destinado para el uso ordenado, interno y teocrático de las congregaciones cristianas. Todos los derechos reservados.
