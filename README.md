# Kongre - Gestor Teocrático Integral

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
  <img src="https://img.shields.io/badge/Firebase-Firestore%2012-ffca28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Maps-OpenStreetMap%20%2F%20Leaflet-77dd77?logo=leaflet&logoColor=white" alt="Leaflet / OSM" />
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-5a0fc8?logo=pwa&logoColor=white" alt="PWA Offline" />
</p>

---

## 📖 Descripción General

**Kongre** es una Progressive Web App (PWA) de última generación diseñada para asistir al cuerpo de ancianos, siervos ministeriales y publicadores en la organización eficiente y teocrática de las actividades de congregación: desde el programa de reuniones de entre semana y fin de semana, hasta el control de territorios con mapas interactivos satelitales, asistencia S-88, tarjetas S-21, cuentas y literatura.

Todo el sistema está optimizado para funcionar tanto en línea con **sincronización reactiva en tiempo real (Firestore)** como en modo **100% offline**, garantizando disponibilidad total durante las reuniones en el Salón del Reino o en el ministerio del campo.

---

## ✨ Características Principales

### 1. Vida y Ministerio & Reunión Pública
- **Programación Semanal Completa**: Tesoros de la Biblia, Seamos Mejores Maestros, Nuestra Vida Cristiana y Estudio Bíblico de la Congregación.
- **Importador Inteligente de Guías MWB**: Carga directa y parseo de las guías mensuales oficiales de actividades.
- **Asignador Automático con Detección de Conflictos**: Algoritmo teocrático inteligente que respeta reglas de rotación, tiempo mínimo entre intervenciones y disponibilidad.
- **Generación Oficial de Plantillas S-89 en PDF**: Hojas de asignación individuales listas para imprimir o enviar por WhatsApp.
- **Gestión de Oradores Salientes e Invitados**: Registro de bosquejos preparados, fechas y congregaciones de origen.

### 2. Territorios y Mapas Interactivos (Fase 5 - OpenStreetMap & Leaflet)
- **Vista General de Territorios en Mapa**: Visualización simultánea de todos los territorios delimitados con código de colores según su estado S-13 (Disponible, Asignado, Por Vencer o Vencido).
- **4 Capas de Mapa**: Plano Urbano Claro (*CartoDB Positron*), Modo Noche (*Dark Matter*), Satélite Aéreo (*Esri World Imagery*) y OpenStreetMap Clásico.
- **Editor Visual de Polígonos Perimetrales**: Trazado interactivo de contornos con puntos de control móviles, buscador geocodificado de calles (Nominatim) y cálculo de área ($m^2$/ha) y perímetro en tiempo real.
- **Tarjetas Digitales para Publicadores con Código QR**: Acceso móvil directo con advertencias para casas con petición expresa de **NO VISITAR** y geolocalización GPS en vivo.
- **Exportación e Importación GeoJSON**: Compatibilidad con Google Earth, QGIS y archivos de respaldo.

### 3. Registro de Publicadores y Fichas S-21
- **Tarjetas Oficiales S-21**: Historial de horas, cursos bíblicos, estado de precursorado y registros de servicio.
- **Control de Acceso Teocrático Basado en Roles (RBAC)**: Privilegios diferenciados por departamento (Coordinador, Secretario, Supt. VyM, Siervos de Territorios, Cuentas y Literatura).
- **Depuración Automática de Duplicados**: Fusión segura y preservación de PINs personales.

### 4. Asistencia y Registro S-88
- **Conteo en Vivo de Asistentes**: Registro rápido para acomodadores durante las reuniones de entre semana y fin de semana.
- **Métricas y Estadísticas S-88**: Promedios mensuales, porcentajes de asistencia presencial y por videoconferencia (Zoom).

### 5. Cuentas y Finanzas de Congregación
- **Libro Mayor de Transacciones**: Entradas (donaciones, cajas del Salón) y salidas (gastos operativos, mantenimiento).
- **Hojas de Auditoría Trimestral**: Formularios de verificación de cuentas y conciliación bancaria.

### 6. Literatura e Inventario
- **Control de Existencias**: Inventario físico de Biblias, libros, folletos y revistas.
- **Pedidos Especiales**: Solicitudes individuales de publicadores y distribución por grupos de servicio.

### 7. Mantenimiento y Cuadro Eléctrico del Salón
- **Diagrama Visual de Breakers**: Identificación interactiva de fases y disyuntores del auditorio, plataforma y cabina A/V.
- **Hojas de Mantenimiento**: Registro de tareas periódicas de conservación y limpieza.

### 8. Sincronización Granular en la Nube (Firestore v2)
- **Cero Sobreescrituras Concurrentes**: Subcolecciones atómicas (`/publishers`, `/weeks`, `/territories`, `/notices`, `/accounts`, `/literature`) que permiten a múltiples ancianos editar simultáneamente sin perder información.
- **Canal de Difusión Local (BroadcastChannel)**: Sincronización instantánea entre pestañas abiertas sin consumo de cuota de Firestore.

### 9. PWA Offline & Alto Rendimiento
- **Service Worker con Workbox**: Caché automático de la aplicación y de mosaicos de mapas satelitales.
- **División Modular del Bundle (Code Splitting)**: Chunks independientes generados con Rolldown para acelerar la carga en dispositivos móviles.

---

## 🛠️ Tecnologías Empleadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 8](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) con tema adaptativo Claro / Oscuro / Cabina A/V
- **Cartografía**: [Leaflet 1.9](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/), CartoDB, Esri
- **Base de Datos & Auth**: [Firebase SDK 12](https://firebase.google.com/) (Firestore & Authentication)
- **Documentos PDF**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Entorno de Ejecución**: [Bun](https://bun.sh/)

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- [Bun](https://bun.sh/) (recomendado) o Node.js v20+

### 1. Clonar el repositorio
```bash
git clone https://github.com/<TU_USUARIO>/Kongre.git
cd Kongre
```

### 2. Instalar dependencias
```bash
bun install
```

### 3. Iniciar servidor de desarrollo
```bash
bun run dev
```
La aplicación se iniciará en `http://localhost:3050`.

### 4. Verificación de calidad y compilación para producción
```bash
# Comprobación de tipos TypeScript
bun run lint

# Verificación de integridad, PWA y reglas de producción
bun run verify

# Compilación optimizada para producción
bun run build
```

---

## 📄 Licencia

Este proyecto está disponible para el uso interno y teocrático de las congregaciones.
