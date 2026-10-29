# Reglas y Arquitectura de Kongre para Asistentes AI (Antigravity / Gemini)

> [!CRITICAL]
> ## 🏛️ Principios Fundamentales del Ecosistema Kongre
> 1. **`Kongre` (`softwarelab7/Kongre`):**
>    - Repositorio privado donde se guarda el proyecto y el código fuente.
>    - Se utiliza para el desarrollo interno y para enviar actualizaciones a la app PWA en **[kongre-app.com](https://www.kongre-app.com)**.
>    - Aquí se ejecutan los flujos de GitHub Actions CI/CD para compilar instaladores.
> 
> 2. **`Kongre-app` (`softwarelab7/Kongre-app`):**
>    - Repositorio público oficial de la versión para PC para que los usuarios finales descarguen e instalen los paquetes oficiales (`.exe`, `.dmg`, `.rpm`, `.deb`, `.AppImage`).
>    - Solo contiene documentación pública orientada al usuario (`README.md`, `CHANGELOG.md`) y releases con binarios precompilados.
>    - **NUNCA** empujar código fuente, carpetas `src/`, `src-tauri/` o archivos confidenciales a este repositorio.
> 
> 3. **Código Cerrado y Privativo:**
>    - Kongre es un software de **código cerrado**.
>    - Solo el desarrollador conoce y tiene acceso al código fuente.
>    - La documentación pública no debe incluir instrucciones de clonación ni compilación local para usuarios externos.
