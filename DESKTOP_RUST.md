# Kongre App en Rust (Windows, Linux, macOS)

Kongre App ahora cuenta con soporte oficial para compilación nativa en escritorio mediante **Tauri v2 (Rust)**.

Esta arquitectura combina:
- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS (código existente, 100% reutilizado).
- **Backend y Core Nativo:** **Rust** (alto rendimiento, seguridad en memoria, binarios ultraligeros de ~15MB frente a los ~150MB de Electron).
- **WebViews Nativas del SO:**
  - **Windows:** Microsoft Edge WebView2 (`.exe` instalador NSIS y `.msi`).
  - **Linux:** WebKitGTK (`.deb`, `.AppImage`).
  - **macOS:** WebKit nativo de Apple (`.dmg`, `.app` Universal para Intel y Apple Silicon M1/M2/M3/M4).

---

## 🚀 Comandos Rápidos

```bash
# Ejecutar en modo desarrollo de escritorio (abre la ventana nativa con HMR)
npm run desktop:dev

# Compilar el binario nativo de producción para el sistema actual
npm run desktop:build
```

---

## 📦 Compilación Automática Multiplataforma (GitHub Actions)

Dado que compilar binarios de macOS y Windows requiere sus respectivos sistemas operativos o toolchains nativas, se ha configurado el workflow:

`.github/workflows/desktop-release.yml`

### ¿Cómo generar los instaladores automáticamente?
1. **Automático en cada Push:** Simplemente haz un commit y push a la rama `main`:
   ```bash
   git add .
   git commit -m "feat: mi nuevo cambio"
   git push origin main
   ```
2. **O por Tag de Versión:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
   *(o activando el workflow manualmente desde la pestaña **Actions** en GitHub con `workflow_dispatch`)*.

3. **GitHub Actions compilará en paralelo:**
   - **Windows Runner:** Genera `Kongre_0.1.0_x64-setup.exe` y `Kongre_0.1.0_x64_en-US.msi`.
   - **macOS Runner:** Genera `Kongre_0.1.0_universal.dmg` (binario Universal compatible con Intel y Apple Silicon).
   - **Linux Runner:** Genera `Kongre_0.1.0_amd64.deb`, `Kongre_0.1.0_amd64.AppImage` y `Kongre-0.1.0-1.x86_64.rpm`.

4. **Disponibilidad inmediata:**
   - En **Releases** de GitHub: Listos para descarga pública directa.
   - En **Actions > Artifacts**: Descargables de inmediato como archivo zip por plataforma tras cada ejecución.

---

## 🛠️ Requisitos para compilar localmente en Linux

### En Fedora Linux (tu sistema actual):
Para compilar localmente en Fedora, instala las bibliotecas de desarrollo necesarias para WebKit y GTK:
```bash
sudo dnf install -y \
  webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  glib2-devel \
  gtk3-devel
```

### En Ubuntu / Debian:
```bash
sudo apt-get update && sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Toolchain de Rust
Rust ya se encuentra configurado en `~/.cargo/bin`. Puedes comprobarlo con:
```bash
cargo --version
rustc --version
```

---

## 📁 Estructura del proyecto Rust

```text
├── src-tauri/
│   ├── Cargo.toml            # Manifiesto de paquetes y dependencias de Rust
│   ├── build.rs              # Script de compilación de Tauri
│   ├── tauri.conf.json       # Configuración de ventana, identificador y empaquetado
│   ├── capabilities/         # Permisos y seguridad de Tauri v2
│   │   └── default.json
│   ├── icons/                # Iconos multiplataforma (.ico, .icns, .png)
│   └── src/
│       ├── lib.rs            # Inicialización del runtime de Tauri y plugins
│       └── main.rs           # Punto de entrada del ejecutable de escritorio
```
