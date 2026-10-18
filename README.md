# Kongre - Gestor Teocrático Integral

<p align="center">
  <img src="public/logo/kongre_horizontal_positivo.svg" width="260" alt="Kongre Logo" />
</p>

<p align="center">
  <strong>Plataforma integral, moderna y segura para la administración y coordinación teocrática de congregaciones.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versi%C3%B3n-2.8.0-4C3AED?style=flat-square&logo=git&logoColor=white" alt="Versión 2.8.0" />
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
- **Seguridad Cero Conocimiento (Zero-Knowledge)**: Cifrado en el dispositivo mediante **AES-256-GCM** y derivación **PBKDF2 (100,000 iteraciones)** antes de sincronizarse con la nube mediante **Supabase**.
- **Modo Offline & Modo Demo**: Soporte PWA 100% desconectado y entorno de demostración precargado para explorar sin modificar datos reales.

---

## ✨ Novedades Recientes (v2.8.0)

### 🎨 Identidad de Marca Oficial Kongre v3
- **Nuevo Isotipo y Logotipo Oficial**: Paleta teocrática con color primario `#4C3AED`, fondo de página `#F8F9FC` y tokens temáticos adaptativos.
- **Logotipo Animado SVG (`AnimatedLogo`)**: Animación suave de dibujo de trazos y revelación tipográfica integrada en cabeceras.
- **Paquete Completo de Activos**: Variantes en positivo, negativo y negro en SVG y PNG de alta resolución, favicons multiformato e iconos web manifest PWA maskable.

### 💻 Portal de Bienvenida Teocrático para PC y Móviles
- **Experiencia de Escritorio (PC)**:
  - Cabecera con selector de tema de 3 modos: **Claro**, **Oscuro** y **Cabina A/V** (modo de contraste especial para cabina de sonido).
  - Acceso directo a **Modo Demo** con un solo clic.
  - Columna izquierda con insignia de destellos interactivos, titular en gradiente y cuadrícula 2x2 de características (`.feat`) con divisores sutiles y microanimaciones de trazo SVG (`AnimIcon`).
  - Tarjeta interactiva de acceso (`.card` y `.opt`):
    - 🏛️ **Registrar mi Congregación**: Asistente completo por pasos con badge oficial.
    - 👤 **Iniciar sesión con Google**: Vinculación de perfil y asignaciones.
    - 🔑 **Conectar con ID y PIN de Congregación**: Autenticación teocrática directa.
    - 👁️ **Iniciar sesión con código de invitación**: Acceso de un solo uso en dispositivo local con icono animado del ojo.
- **Experiencia Móvil (Smartphones)**:
  - Encabezado con gradiente teocrático `#4C3AED`, logotipo vertical e indicador de estado offline.
  - Bottom sheet táctil deslizante con esquinas redondeadas y opciones optimizadas para pulsación con una sola mano.

### 🧪 Modo Demo Teocrático
- Exploración de todas las funciones sin requerir registro ni alterar datos de una congregación real.
- Carga instantánea de publicadores simulados, programas de reuniones semanales, territorios cartográficos y hojas de asignación.
- Banner de advertencia flotante que permite reiniciar los datos de prueba o salir al portal de bienvenida en cualquier momento.

### 📊 Dashboard Analítico de Asistencia (Recharts)
- Visualización de doble capa (barras y áreas) de la asistencia mensual durante el Año de Servicio teocrático (Septiembre a Agosto).
- Comparativa presencial vs. Zoom con gráficos apilados y cálculo de promedios anuales.
- Vistas por desglose semanal continuo, distribución de canales y tabla exportable a formato CSV.

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Estilos & Diseño**: [Tailwind CSS v4](https://tailwindcss.com/) con sistema de tokens (`kongre-theme.css`, `kongre-welcome.css`) y temas Claro / Oscuro / Cabina A/V
- **Gráficos & Métricas**: [Recharts](https://recharts.org/)
- **Cartografía**: [Leaflet 1.9](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/), CartoDB, Esri
- **Base de Datos & Tiempo Real**: [Supabase](https://supabase.com/) (PostgreSQL, Realtime & Authentication)
- **Criptografía**: Web Crypto API nativa (AES-256-GCM, PBKDF2 SHA-256, CSPRNG)
- **Documentos PDF**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Entorno de Ejecución**: [Bun](https://bun.sh/)

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
# Comprobación estricta de tipos TypeScript
bun x tsc --noEmit

# Compilación optimizada para producción
bun run build
```

---

## 🔒 Confidencialidad y Privacidad Teocrática

Kongre ha sido concebido bajo los más rigurosos principios de confidencialidad cristiana y protección de datos teocráticos:

1. **Cifrado de Extremo a Extremo en el Dispositivo**: Los datos sensibles (asignaciones, notas de pastoreo, fichas de publicadores) se cifran antes de abandonar el navegador.
2. **Control de Acceso por Roles (RBAC)**: Cada hermano solo puede visualizar y editar la información correspondiente a su nombramiento o asignación oficial.
3. **Auditoría Inmutable**: Registro cronológico local de eventos críticos firmado criptográficamente para trazabilidad.

---

## 📄 Licencia

Este proyecto está disponible para el uso interno y teocrático de las congregaciones.
