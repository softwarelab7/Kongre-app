# 🛠️ Guía de Desarrollo Interno — Kongre (Privado)

> [!IMPORTANT]
> ### 🏛️ Arquitectura del Ecosistema y Gobernanza de Código
> 1. **`Kongre` (`softwarelab7/Kongre`):** Repositorio privado donde se guarda el proyecto y el código fuente. Se utiliza para el desarrollo y para enviar actualizaciones a la app PWA en **[kongre-app.com](https://www.kongre-app.com)**.
> 2. **`Kongre-app` (`softwarelab7/Kongre-app`):** Repositorio público oficial donde se distribuye la versión para PC para que los usuarios finales instalen los paquetes oficiales.
> 3. **Código Cerrado y Privativo:** La aplicación es de **código cerrado**; únicamente el desarrollador conoce y tiene acceso al código fuente. Jamás sincronizar código fuente no compilado al repositorio público.

---

## 💻 Entorno de Desarrollo Local

### Prerrequisitos
- **Node.js** v20+ o [Bun](https://bun.sh/)
- **Rust y Cargo** (2021 edition): [rustup.rs](https://rustup.rs/) (requerido para compilar la versión de escritorio nativa con Tauri v2)
- En Linux (Fedora): `gcc`, `webkit2gtk4.1-devel`, `openssl-devel`, `curl`, `wget`, `file`, `libappindicator-gtk3-devel`, `librsvg2-devel`
- En Linux (Debian/Ubuntu): `build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

---

## 🚀 Puesta en Marcha

### 1. Clonar el repositorio privado
```bash
git clone https://github.com/softwarelab7/Kongre.git
cd Kongre
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno (Opcional para sincronización en la nube)
Crea un archivo `.env` en la raíz si deseas conectar un proyecto de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica
```
> [!NOTE]
> Kongre cuenta con arquitectura **Offline-First**: no requiere Supabase para funcionar; todos los módulos operan al 100% en modo local de forma desconectada.

---

## 📜 Scripts Disponibles

### Modo Web
```bash
# Iniciar servidor de desarrollo Vite con HMR en http://localhost:3000
npm run dev

# Verificación estricta de tipos TypeScript
npm run lint

# Ejecutar suite de pruebas unitarias
npm test

# Compilar para producción (genera la carpeta dist/)
npm run build
```

### Modo Escritorio (Rust + Tauri v2)
```bash
# Ejecutar la ventana nativa de escritorio en modo desarrollo con recarga en vivo
npm run desktop:dev

# Compilar el instalador nativo según tu sistema operativo local (.exe, .dmg, .rpm, .deb, .AppImage)
npm run desktop:build
```

---

## 🔄 Flujo de Publicación de Versiones
1. Actualizar número de versión en:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
   - `src/utils/versionLog.ts`
   - `CHANGELOG.md`
   - `README.md`
2. Crear commit y tag:
   ```bash
   git commit -am "chore(release): bump version to vX.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   ```
3. GitHub Actions compilará automáticamente los 5 instaladores para Windows, macOS y Linux.
4. Sincronizar la documentación y el tag con el repositorio público de distribución:
   ```bash
   git checkout -B deploy-kongre-app kongre-app/main
   git checkout main -- CHANGELOG.md README.md
   git commit -m "docs: sync CHANGELOG.md and README.md with vX.Y.Z release"
   git push kongre-app deploy-kongre-app:main
   git push kongre-app vX.Y.Z
   git checkout main
   git branch -D deploy-kongre-app
   ```
5. Descargar los binarios generados en `softwarelab7/Kongre` y publicarlos en `softwarelab7/Kongre-app/releases`.
