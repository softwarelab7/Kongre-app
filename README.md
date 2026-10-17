# Kongre 2 - Gestor Teocrático Integral

<p align="center">
  <img src="public/icon.svg" width="100" height="100" alt="Kongre Logo" />
</p>

<p align="center">
  <strong>Plataforma integral, moderna y segura para la administración y coordinación teocrática de congregaciones.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-7.0-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646cff?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ecf8e?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Security-Zero--Knowledge%20AES--256--GCM-blueviolet?logo=shield" alt="Zero-Knowledge AES-256" />
  <img src="https://img.shields.io/badge/Passkey-Crockford%20Base32%20CSPRNG-0ea5e9?logo=keybase" alt="Crockford Base32 CSPRNG" />
  <img src="https://img.shields.io/badge/Maps-OpenStreetMap%20%2F%20Leaflet-77dd77?logo=leaflet&logoColor=white" alt="Leaflet / OSM" />
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-5a0fc8?logo=pwa&logoColor=white" alt="PWA Offline" />
</p>

---

## 📖 Descripción General

**Kongre 2** es una Progressive Web App (PWA) de última generación diseñada para asistir al cuerpo de ancianos, siervos ministeriales y publicadores en la organización eficiente, confidencial y armoniosa de las actividades de congregación: desde la programación de reuniones de entre semana y fin de semana, hasta la administración de territorios con mapas interactivos satelitales, asistencia S-88, tarjetas S-21, cuentas, literatura y mantenimiento del Salón del Reino.

Todo el sistema opera bajo una estricta arquitectura de **Cero Conocimiento (Zero-Knowledge)**: los datos sensibles se cifran en el propio dispositivo del usuario con **AES-256-GCM** y derivación criptográfica **PBKDF2 (100,000 iteraciones)** antes de sincronizarse con la nube mediante **Supabase**. La aplicación ofrece **sincronización reactiva bidireccional continua** y soporte **100% offline**, garantizando disponibilidad total tanto en el Salón del Reino como en el ministerio del campo.

---

## ✨ Características Principales

### 1. Vida y Ministerio & Reunión Pública
- **Programación Semanal Completa**: Tesoros de la Biblia, Seamos Mejores Maestros, Nuestra Vida Cristiana y Estudio Bíblico de la Congregación.
- **Importador Inteligente de Guías MWB**: Carga directa y parseo de las guías mensuales oficiales de actividades.
- **Asignador Automático con Detección de Conflictos**: Algoritmo teocrático inteligente que respeta reglas de rotación, intervalos mínimos entre intervenciones y disponibilidad de hermanos.
- **Generación Oficial de Plantillas S-89 en PDF**: Hojas de asignación individuales listas para imprimir o compartir digitalmente.
- **Gestión de Oradores Salientes e Invitados**: Registro de bosquejos preparados, fechas y congregaciones de origen.

### 2. Territorios y Cartografía Interactiva (OpenStreetMap & Leaflet)
- **Vista General de Territorios en Mapa**: Visualización simultánea de todos los territorios delimitados con código de colores según su estado S-13 (Disponible, Asignado, Por Vencer o Vencido).
- **4 Capas de Mapa Dinámicas**:
  - Plano Urbano Claro (*CartoDB Positron*)
  - Modo Nocturno (*Dark Matter*)
  - Satélite de Alta Resolución (*Esri World Imagery*)
  - OpenStreetMap Clásico (*OSM Standard*)
- **Editor Visual de Polígonos Perimetrales**: Trazado interactivo de contornos con puntos de control móviles, buscador geocodificado de calles (Nominatim) y cálculo de área ($m^2$/ha) y perímetro en tiempo real.
- **Tarjetas Digitales para Publicadores con Código QR**: Acceso móvil directo con advertencias para casas con petición expresa de **NO VISITAR** y geolocalización GPS en vivo.
- **Exportación e Importación GeoJSON**: Compatibilidad total con Google Earth, QGIS y respaldos locales.

### 3. Registro de Publicadores y Fichas S-21
- **Tarjetas Oficiales S-21**: Historial de horas, cursos bíblicos, estado de precursorado y registros de servicio.
- **Control de Acceso Teocrático Basado en Roles (RBAC)**: Privilegios diferenciados por departamento (Coordinador, Secretario, Supt. VyM, Siervos de Territorios, Cuentas y Literatura).
- **Depuración Automática de Duplicados**: Fusión segura y preservación de registros históricos.

### 4. Seguridad de Cero Conocimiento (Zero-Knowledge) & Criptografía Militar
- **Cifrado AES-256-GCM en el Dispositivo**: Ni la base de datos en la nube ni terceros intermediarios pueden descifrar la información confidencial de la congregación sin las credenciales locales.
- **Identificador Teocrático Único (`KGR-XXXX-XXXX`)**: Generado con CSPRNG puro (36^8 combinaciones, >2.8 billones) con prefijo teocrático y regeneración segura.
- **Clave Alfanumérica de Congregación (`XXXX-XXXX`)**: Generada mediante el estándar **Crockford Base32** (alfabeto sin caracteres ambiguos como I, O, 1, 0, superando 1.09 billones de combinaciones), con edición libre de clave personalizada y verificación insensible a mayúsculas o guiones.
- **Desvinculación Conceptual de Credenciales**: La Clave de Congregación es compartida para acceso a cartelera y consulta de publicadores, mientras que el Bloqueo de la App utiliza un PIN de Seguridad Personal local en el dispositivo.
- **Doble Payload Protegido**:
  - *Payload Administrativo*: Cifrado con la Clave Maestra (exclusivo para ancianos y siervos autorizados).
  - *Payload Público*: Cifrado con la Clave de Congregación (publicadores y cartelera sin acceso a datos confidenciales).
- **Sincronización Bidireccional Continua**: Resolución inteligente de conflictos por marca de tiempo (*Last-Write-Wins* y unión no destructiva).
- **Canal de Difusión Local (BroadcastChannel)**: Sincronización instantánea entre pestañas abiertas sin consumo de ancho de banda.
- **Pista de Auditoría Teocrática Inmutable**: Registro cronológico de eventos críticos firmado criptográficamente para auditoría y trazabilidad.

### 5. Asistencia y Registro S-88
- **Conteo en Vivo de Asistentes**: Registro ágil para acomodadores durante las reuniones de entre semana y fin de semana.
- **Métricas y Estadísticas S-88**: Promedios mensuales, porcentajes de asistencia presencial y por videoconferencia.

### 6. Cuentas y Finanzas de Congregación
- **Libro Mayor de Transacciones**: Entradas (donaciones, cajas del Salón) y salidas (gastos operativos, mantenimiento).
- **Hojas de Auditoría Trimestral**: Formularios de verificación de cuentas y conciliación bancaria.

### 7. Literatura e Inventario
- **Control de Existencias**: Inventario físico de Biblias, libros, folletos y revistas.
- **Pedidos Especiales**: Solicitudes individuales de publicadores y distribución organizada por grupos de servicio.

### 8. Mantenimiento y Cuadro Eléctrico del Salón del Reino
- **Diagrama Visual de Breakers**: Identificación interactiva de fases y disyuntores del auditorio, plataforma y cabina de audio y video.
- **Hojas de Mantenimiento**: Registro de tareas periódicas de conservación, limpieza y reparaciones.

### 9. Experiencia de Usuario Moderna y Diseño Adaptativo
- **Diseño Responsive Integral**: Formulario de registro y portales de acceso adaptados tanto al ancho (`max-w-4xl` a `max-w-6xl`) como al alto de la pantalla, organizados en cuadrículas de 2 columnas lado a lado para portátiles/monitores y flujo vertical en smartphones.
- **Selector de Hora Estilo Rueda Cupertino iOS (`IosTimePicker`)**: Selección suave de horas y minutos con presets teocráticos habituales, auto-flip inteligente para evitar desbordamientos y modalidad bottom-sheet en pantallas móviles.
- **Menús Desplegables Modernos (`Select`)**: Componentes animados con glassmorphism, chevron interactivo y detección de clics externos en sustitución de selects nativos rígidos.
- **Tema A/V Cabina y Modo Claro/Oscuro**: Conmutador animado `ThemeToggle` con microinteracciones y paleta adaptada para poca luz en la cabina de sonido.

### 10. PWA Offline & Rendimiento
- **Service Worker con Workbox**: Caché automático de la aplicación y de mosaicos cartográficos.
- **División Modular del Bundle (Code Splitting)**: Chunks independientes generados con Rolldown para acelerar la carga en dispositivos móviles con conexiones lentas.

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Estilos & Animaciones**: [Tailwind CSS v4](https://tailwindcss.com/) con diseño adaptativo Claro / Oscuro / Cabina A/V
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
git clone https://github.com/softwarelab7/Kongre2.git
cd Kongre2
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
> Kongre 2 está diseñado para funcionar en modo 100% offline y local sin necesidad de configurar servicios en la nube.

### 4. Iniciar servidor de desarrollo
```bash
bun run dev
```
La aplicación se iniciará en `http://localhost:3050`.

### 5. Verificación de calidad y compilación para producción
```bash
# Comprobación estricta de tipos TypeScript
bun run lint

# Verificación de integridad, PWA y arquitectura de seguridad
bun run verify

# Compilación optimizada para producción
bun run build
```

---

## 🔒 Confidencialidad y Privacidad

Kongre 2 ha sido concebido respetando los más altos estándares de privacidad y confidencialidad teocrática. Gracias al cifrado de **Cero Conocimiento en el cliente**, la información de los publicadores, familias, notas y registros de la congregación permanece exclusivamente en manos de la congregación y bajo el control de los hermanos nombrados.

---

## 📄 Licencia

Este proyecto está disponible para el uso interno y teocrático de las congregaciones.
