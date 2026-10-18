import { useState, useEffect, CSSProperties } from "react";
import { Moon, Sun, Tv } from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext";

export interface ThemeToggleProps {
  isDark?: boolean;
  themeMode?: ThemeMode;
  onToggle?: (next?: any) => void;
  className?: string;
  style?: CSSProperties;
  size?: number;
}

export default function ThemeToggle({
  isDark: propIsDark,
  themeMode: propThemeMode,
  onToggle,
  className = "",
  style = {},
  size = 28,
}: ThemeToggleProps) {
  let themeCtx: ReturnType<typeof useTheme> | null = null;
  try {
    themeCtx = useTheme();
  } catch {}

  const activeMode: ThemeMode =
    propThemeMode ||
    themeCtx?.themeMode ||
    (typeof propIsDark === "boolean"
      ? propIsDark
        ? "dark"
        : "light"
      : typeof document !== "undefined" && document.documentElement.classList.contains("theme-cabina")
      ? "cabina"
      : typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light");

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  function handleCycleTheme() {
    let next: ThemeMode = "dark";
    if (activeMode === "light") next = "dark";
    else if (activeMode === "dark") next = "cabina";
    else if (activeMode === "cabina") next = "light";
    else next = "dark";

    if (themeCtx?.setThemeMode) {
      themeCtx.setThemeMode(next);
    } else {
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.dataset.theme = next;
        if (next === "dark" || next === "cabina") root.classList.add("dark");
        else root.classList.remove("dark");

        if (next === "cabina") root.classList.add("theme-cabina");
        else root.classList.remove("theme-cabina");
      }
      try {
        localStorage.setItem("theme", next);
        localStorage.setItem("kongre-theme", next);
        localStorage.setItem("kongre_theme", next);
      } catch {}
    }

    onToggle?.(next);
  }

  // Calculate icon size proportionally
  const iconSize = size === 48 ? 22 : Math.max(13, Math.round(size * 0.5));

  const modeLabels: Record<ThemeMode, { title: string; aria: string; bg: string; color: string; border: string }> = {
    light: {
      title: "Modo Claro (Día) • Clic para Modo Oscuro",
      aria: "Modo Claro activo. Cambiar a Modo Oscuro",
      bg: "#E5EAF5",
      color: "#1B4F91",
      border: "rgba(27, 79, 145, 0.15)",
    },
    dark: {
      title: "Modo Oscuro (Noche) • Clic para Modo Cabina A/V",
      aria: "Modo Oscuro activo. Cambiar a Modo Cabina",
      bg: "#1E293B",
      color: "#9085F4",
      border: "rgba(144, 133, 244, 0.3)",
    },
    cabina: {
      title: "Modo Cabina & Acomodadores (Auditorio) • Clic para Modo Claro",
      aria: "Modo Cabina activo. Cambiar a Modo Claro",
      bg: "#050811",
      color: "#34D399",
      border: "rgba(52, 211, 153, 0.4)",
    },
  };

  const currentConfig = modeLabels[activeMode] || modeLabels.light;

  return (
    <button
      type="button"
      onClick={handleCycleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      aria-label={currentConfig.aria}
      title={currentConfig.title}
      className={`relative inline-flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B4F91] cursor-pointer transition-all ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1.5px solid ${currentConfig.border}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: currentConfig.bg,
        color: currentConfig.color,
        boxShadow: isHovered
          ? activeMode === "cabina"
            ? "0 0 16px rgba(52, 211, 153, 0.4), 0 0 0 1px rgba(52, 211, 153, 0.3)"
            : activeMode === "dark"
            ? "0 4px 16px rgba(144, 133, 244, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)"
            : "0 4px 16px rgba(27, 79, 145, 0.18), 0 0 0 1px rgba(27, 79, 145, 0.08)"
          : activeMode === "cabina"
          ? "0 0 8px rgba(52, 211, 153, 0.25)"
          : "0 1px 3px rgba(0, 0, 0, 0.05)",
        transform: isActive ? "scale(0.92)" : isHovered ? "scale(1.06)" : "scale(1)",
        transition:
          "background 250ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease, border-color 250ms ease",
        ...style,
      }}
    >
      {/* Animated Icon Container */}
      <div
        style={{
          position: "relative",
          width: iconSize,
          height: iconSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Phase 1: Sun Icon (shown in light mode) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: activeMode === "light" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
            opacity: activeMode === "light" ? 1 : 0,
            transition:
              "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease",
            pointerEvents: "none",
          }}
        >
          <Sun size={iconSize} />
        </div>

        {/* Phase 2: Moon Icon (shown in dark mode) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: activeMode === "dark" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
            opacity: activeMode === "dark" ? 1 : 0,
            transition:
              "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease",
            pointerEvents: "none",
          }}
        >
          <Moon size={iconSize} />
        </div>

        {/* Phase 3: Cabina A/V Icon (shown in cabina mode) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: activeMode === "cabina" ? "rotate(0deg) scale(1)" : "scale(0)",
            opacity: activeMode === "cabina" ? 1 : 0,
            transition:
              "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease",
            pointerEvents: "none",
          }}
        >
          <Tv size={iconSize} />
        </div>
      </div>
    </button>
  );
}
