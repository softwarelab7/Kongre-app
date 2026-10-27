# Kongre - Gestor Teocrático Integral

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo/kongre_horizontal_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="public/logo/kongre_horizontal_positivo.svg">
    <img src="public/logo/kongre_horizontal_positivo.svg" width="280" alt="Kongre - Gestor Teocrático Integral" />
  </picture>
</p>

<p align="center">
  <strong>Plataforma integral, moderna y segura para la administración y coordinación teocrática de congregaciones.</strong>
</p>

<p align="center">
  <a href="https://www.kongre-app.com"><strong>🌐 https://www.kongre-app.com — Acceder a la Aplicación en Producción</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versi%C3%B3n-v0.1.0--alpha.35-4C3AED?style=flat-square&logo=git&logoColor=white" alt="Versión v0.1.0-alpha.35" />
  <img src="https://img.shields.io/badge/Google%20OAuth-Brand%20Verified-4285F4?style=flat-square&logo=google&logoColor=white" alt="Google OAuth Brand Verified" />
  <img src="https://img.shields.io/badge/2FA-Microsoft%20Authenticator-00A4EF?style=flat-square&logo=microsoft&logoColor=white" alt="2FA Microsoft Authenticator" />
  <img src="https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-7.0-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Security-Zero--Knowledge%20AES--256--GCM-blueviolet?style=flat-square&logo=shield" alt="Zero-Knowledge AES-256" />
  <img src="https://img.shields.io/badge/Maps-OpenStreetMap%20%2F%20Leaflet-77dd77?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet / OSM" />
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-5a0fc8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Offline" />
</p>

---

## 📖 Descripción General

**Kongre** es una Progressive Web App (PWA) teocrática de última generación diseñada para asistir al cuerpo de ancianos, siervos ministeriales y publicadores en la organización eficiente, confidencial y armoniosa de las actividades de congregación:

- **Reunión Vida y Ministerio & Fin de Semana**: Programación semanal de intervenciones, asignaciones estudiantiles y generación de plantillas oficiales S-89 en PDF.
- **Territorios y Cartografía Interactiva**: Manzanas georreferenciadas con Leaflet y OpenStreetMap, polígonos interactivos, enlaces digitales por QR y turnos de predicación pública (carritos).
- **Publicadores y Fichas S-21**: Control de informes, grupos de servicio, privilegios y deduplicación inteligente de registros.
- **Asistencia S-88 y Dashboard Analítico**: Gráficos de tendencias mensuales y semanales con Recharts, desglose presencial/Zoom y métricas del año de servicio.
- **Cuentas, Literatura y Mantenimiento del Salón**: Libro de transacciones, hojas de auditoría, inventario físico de publicaciones y cuadro de disyuntores eléctricos.
- **Autenticación en Dos Pasos (2FA) TOTP**: Verificación opcional con **Microsoft Authenticator** (RFC 6238), códigos de respaldo y dispositivos de confianza por 30 días, 100% calculada en cliente de forma desconectada.
- **Seguridad Cero Conocimiento (Zero-Knowledge)**: Cifrado en el dispositivo mediante **AES-256-GCM** y derivación **PBKDF2 (600.000 iteraciones en sincronización, 200.000 iteraciones en bóveda local)**, claves no extraíbles en IndexedDB (`extractable: false`) y rotación asistida de credenciales antes de sincronizarse con la nube mediante **Supabase**.
- **Modo Offline & Modo Demo**: Soporte PWA 100% desconectado y entorno de demostración precargado para explorar sin modificar datos reales.

---

## ✨ Novedades Recientes (v2.12.11)

### 🛡️ Autenticación de Dos Pasos (2FA) con Microsoft Authenticator y Códigos de Respaldo
- **Motor Criptográfico TOTP Cliente Nativo (RFC 6238)**: Algoritmo HMAC-SHA1 ejecutado directamente en el navegador con la Web Crypto API (`window.crypto.subtle`), con intervalos de 30 segundos, código de 6 dígitos y tolerancia de desfase horario ($\pm 30$s). Funciona totalmente fuera de línea sin servidores de terceros.
- **Configuración Intuitiva con Microsoft Authenticator**: Asistente en 3 pasos con código QR oficial `otpauth://totp/...` y copiado de clave secreta manual.
- **8 Códigos de Respaldo de Emergencia**: Códigos alfanuméricos de un solo uso protegidos en reposo mediante hash SHA-256 (arquitectura de conocimiento cero) descargables en archivo `.txt`.
- **Dispositivos de Confianza ("Recordar por 30 días")**: Posibilidad de marcar el dispositivo de uso personal para no solicitar el código de 6 dígitos en cada inicio de sesión, exigiéndolo solo en navegadores nuevos o tras 30 días de inactividad.
- **Gestión Teocrática**: Insignia verde `[2FA]` en el Directorio y botón de restablecimiento de emergencia exclusivo para ancianos en caso de extravío de teléfono.

### 📜 Páginas Legales Oficiales y Rutas Directas (v2.12.10)
- **Acceso Público a Documentos Legales**: Rutas directas `#privacy`, `#terms`, `/privacy` y `/terms` disponibles tanto en la PWA como mediante páginas HTML estáticas autónomas (`privacy.html`, `terms.html`).
- **Verificación de Marca Google OAuth**: Declaración transparente de cumplimiento de la *Google API Services User Data Policy* y requisitos de *Limited Use*, garantizando que ningún dato de perfil es comercializado ni compartido con terceros.

### 🔄 Selector y Cambio Fluido de Cuentas Google (v2.12.9)
- Selector de cuentas limpio e interactivo al pulsar "Cambiar cuenta", evitando bloqueos de pantalla o reapariciones involuntarias del botón de inicio.

### 💻 Portal de Bienvenida Teocrático para PC y Móviles
- Selector de tema de 3 modos: **Claro**, **Oscuro** y **Cabina A/V** (modo de contraste especial para cabina de sonido).
- Acceso directo a **Modo Demo** con un solo clic para capacitación y pruebas.
- Opciones de acceso unificadas: Registro de congregación, PIN teocrático, Google Sign-In y Códigos de Invitación.

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Estilos & Diseño**: [Tailwind CSS v4](https://tailwindcss.com/) con sistema de tokens (`kongre-theme.css`, `kongre-welcome.css`) y temas Claro / Oscuro / Cabina A/V
- **Gráficos & Métricas**: [Recharts](https://recharts.org/)
- **Cartografía**: [Leaflet 1.9](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/), CartoDB, Esri
- **Base de Datos & Tiempo Real**: [Supabase](https://supabase.com/) (PostgreSQL, Realtime & Authentication)
- **Criptografía**: Web Crypto API nativa (AES-256-GCM, PBKDF2 SHA-256, HMAC-SHA1 TOTP RFC 6238, CSPRNG)
- **Documentos PDF**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Entorno de Ejecución**: [Bun](https://bun.sh/) o Node.js v20+

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- [Bun](https://bun.sh/) (recomendado) o Node.js v20+

### 1. Clonar el repositorio
```bash
git clone https://github.com/softwarelab7/Kongre.git
cd Kongre
```

### 2. Instalar dependencias
```bash
bun install
```

### 3. Configurar variables de entorno (Opcional)
Crea un archivo `.env` en la raíz del proyecto para conectar tu propia instancia de Supabase:
```env
# URL de tu proyecto Supabase (Reemplazar con tus credenciales)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon_aqui
```

> [!NOTE]
> Kongre está diseñado con arquitectura **Offline-First**: funciona al 100% de manera local y en modo offline sin requerir servicios en la nube.

### 4. Iniciar servidor de desarrollo
```bash
bun run dev
```
La aplicación estará disponible de inmediato en `http://localhost:3050`.

### 5. Verificación de calidad y compilación para producción
```bash
# Ejecutar suite de pruebas unitarias y de integración
bun run test

# Comprobación estricta de tipos TypeScript
bun x tsc --noEmit

# Compilación optimizada para producción con CSP reforzado
bun run build
```

---

## 🔒 Confidencialidad y Privacidad Teocrática

Kongre ha sido concebido bajo los más rigurosos principios de confidencialidad cristiana y protección de datos teocráticos:

1. **Cifrado de Extremo a Extremo en el Dispositivo**: Los datos sensibles (asignaciones, notas de pastoreo, fichas de publicadores) se cifran antes de abandonar el navegador.
2. **Control de Acceso por Roles (RBAC)**: Cada hermano solo puede visualizar y editar la información correspondiente a su nombramiento o asignación oficial.
3. **Autenticación en Dos Pasos (2FA)**: Protección robusta opcional para evitar suplantaciones o accesos no autorizados en dispositivos nuevos o prestados.
4. **Auditoría Inmutable**: Registro cronológico local de eventos críticos firmado criptográficamente para trazabilidad.

---

## 📄 Licencia

Este proyecto está disponible para el uso interno y teocrático de las congregaciones.
