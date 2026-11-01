---
name: Kongre Design System
description: Sistema de diseño sobrio, teocrático, de alto contraste y adaptado para lectura prolongada y cabina A/V.
colors:
  primary: "#4C3AED"
  primary-hover: "#4332D6"
  primary-light: "rgba(76, 58, 237, 0.1)"
  neutral-dark-bg: "#09090b"
  neutral-dark-surface: "#121216"
  neutral-dark-card: "#18181F"
  neutral-dark-border: "#27272A"
  neutral-light-bg: "#F8F9FC"
  neutral-light-surface: "#FFFFFF"
  neutral-light-border: "rgba(0, 0, 0, 0.08)"
  sepia-bg: "#f4ecd8"
  sepia-surface: "#eae0c8"
  sepia-border: "#d0c2a2"
  cabina-bg: "#000000"
  cabina-surface: "#0A0A0F"
  cabina-border: "#27272A"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#E11D48"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  caption:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.neutral-dark-card}"
    textColor: "#F4F4F5"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  input-field:
    backgroundColor: "rgba(0, 0, 0, 0.04)"
    textColor: "inherit"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System

## Overview
Kongre es una herramienta teocrática diseñada para congregaciones de los Testigos de Jehová. La interfaz prioriza la **legibilidad inmediata**, la **sobriedad**, la **ausencia de distracciones** y una **operación táctil fluida tanto en dispositivos móviles (PWA) como en escritorio (Tauri)**.

El sistema responde a cuatro ambientes fundamentales:
1. **Modo Claro (Estándar):** Superficies limpias en blanco y gris suave con acentos índigo institucionales.
2. **Modo Oscuro (Zinc Profundo):** Fondo `#09090b` y tarjetas `#121216` con bordes `#27272A` para no cansar la vista.
3. **Modo Sepia (Lectura Prolongada):** Paleta pergamino cálida (`#f4ecd8` / `#eae0c8`) pensada para lectura teocrática extensa sin fatiga ocular.
4. **Modo Cabina A/V (Auditorio):** Fondo negro absoluto (`#000000`) para cabinas de sonido y plataformas donde cualquier emisión de luz blanca o gris resulta visible para el auditorio.

## Colors
- **Primario (Índigo Teocrático):** `#4C3AED` (Hover: `#4332D6`, Acento tenue: `rgba(76, 58, 237, 0.1)`).
- **Semánticos:**
  - Éxito / Aprobado: `#10B981` (Esmeralda)
  - Advertencia / Pendiente: `#F59E0B` (Ámbar)
  - Peligro / Cancelado / Inactivo: `#E11D48` (Rosa/Rojo suave)
- **Modo Sepia:**
  - Fondo general: `#f4ecd8`
  - Contenedores: `#eae0c8`
  - Bordes: `#d0c2a2`
  - Texto principal: `#2c221e`
  - Texto secundario: `#5c4b3b`
- **Modo Cabina A/V:**
  - Fondo general: `#000000`
  - Contenedores: `#0A0A0F`
  - Bordes tenues: `#1e1e24`

## Typography
- **Familia tipográfica:** `Plus Jakarta Sans`, respaldada por la pila del sistema operativo (`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- **Jerarquía:**
  - **Títulos principales:** `font-extrabold` / `font-bold` con `tracking-tight` (`-0.02em`).
  - **Encabezados de sección:** `font-bold` en `text-base` o `text-lg`.
  - **Cuerpo y tablas:** `text-sm` (`14px`) en desktop; inputs a `16px` mínimo en móviles para prevenir auto-zoom en iOS Safari.
  - **Metadatos y badges:** `text-xs` (`12px`) con `font-semibold` o `font-bold`.

## Layout
- **Estructura móvil / PWA:**
  - Altura con unidades dinámicas: `100dvh` para la carcasa principal (`min-h-[100dvh]`).
  - Respeto de Safe Area: `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.
  - Modales en móvil: Pantalla completa nativa sin rebotes molestos (`overscroll-behavior: none`).
- **Estructura escritorio / tablet:**
  - Barra de navegación lateral fija con iconos claros y tooltip descriptivo.
  - Ancho máximo de contenido contenido en contenedores fluidos para pantallas ultrapanorámicas.

## Elevation & Depth
- **Filosofía de sombras en capas:** Se prohíben sombras duras y desenfoques simples saturados.
  - Tarjetas flotantes: `shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]`
  - Modales y diálogos: `shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]`
  - Toasts flotantes: `shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.55)]`
- **Glassmorphism:** Uso moderado de `backdrop-blur-md` en headers y barras de herramientas flotantes para mantener el contexto espacial sin saturar la GPU.

## Shapes
- **Esquinas redondeadas:**
  - Botones y controles de entrada: `rounded-xl` (`12px` a `14px`).
  - Tarjetas y paneles: `rounded-2xl` (`16px`).
  - Diálogos y modales: `rounded-3xl` (`24px`).
  - Indicadores y badges: `rounded-full` (`9999px`).

## Components
- **Botones (`button`):**
  - Feedback físico: `:active { transform: scale(0.98); }` a `100ms cubic-bezier(0, 0, 0.2, 1)`.
  - Protección de selección: `user-select: none; touch-action: manipulation;`.
- **Inputs (`.kf-input`):**
  - Transición compuesta exclusiva de `border-color`, `box-shadow` y `background-color` (cero `transition: all`).
- **Modales y Diálogos:**
  - Entrada desde escala `0.95` (`zoom-in-95`), salida acelerada más veloz que la entrada.
- **Tarjetas de Territorio:**
  - Encabezados claros, estatus visual de asignación (Activo, Libre, Vencido) y botón de acceso rápido al mapa interactivo.

## Do's and Don'ts
- **DO:**
  - Mantener curvas de desaceleración suave (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Usar colores semánticos con badges tenues (fondo `rgba`, borde sutil y texto legible).
  - Asegurar que todo diálogo o aviso use el sistema centralizado de Kongre (`useModal` y `useToast`).
  - Respetar el contraste estricto en modo Sepia y modo Cabina A/V.
- **DON'T:**
  - No usar `animate-bounce` ni curvas con rebotes elásticos exagerados (`cubic-bezier(0.34, 1.56, ...)`).
  - No usar `transition: all` indiscriminadamente; listar las propiedades específicas.
  - No invocar `alert()`, `confirm()` o `prompt()` nativos del navegador.
  - No usar gradientes púrpuras chillones de IA en títulos; la tipografía debe ser limpia y legible.
  - No romper el viewport con `user-scalable=no`.
