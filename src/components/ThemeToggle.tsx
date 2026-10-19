import { useState, CSSProperties } from "react";
import { Moon, Sun, MonitorSpeaker } from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext";

export interface ThemeToggleProps {
  isDark?: boolean;
  themeMode?: ThemeMode;
  onToggle?: (next?: ThemeMode) => void;
  className?: string;
  style?: CSSProperties;
  size?: number;
  variant?: "default" | "onBrand";
}

export default function ThemeToggle({
  isDark: propIsDark,
  themeMode: propThemeMode,
  onToggle,
  className = "",
  style = {},
  size = 34,
  variant = "default",
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
    } else if (onToggle) {
      onToggle(next);
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
  }

  const iconSize = size === 48 ? 22 : Math.max(15, Math.round(size * 0.5));

  const modeLabels: Record<
    ThemeMode,
    { title: string; aria: string; bg: string; color: string; border: string }
  > = {
    light: {
      title: "Tema: Claro • Clic para cambiar a Oscuro",
      aria: "Tema Claro activo. Cambiar a Modo Oscuro",
      bg: variant === "onBrand" ? "rgba(255, 255, 255, 0.2)" : "rgba(76, 58, 237, 0.1)",
      color: variant === "onBrand" ? "#FFFFFF" : "#4C3AED",
      border: variant === "onBrand" ? "rgba(255, 255, 255, 0.35)" : "rgba(76, 58, 237, 0.22)",
    },
    dark: {
      title: "Tema: Oscuro • Clic para cambiar a Cabina A/V",
      aria: "Tema Oscuro activo. Cambiar a Modo Cabina A/V",
      bg: variant === "onBrand" ? "rgba(15, 23, 42, 0.55)" : "#1E1B4B",
      color: "#A5B4FC",
      border: "rgba(165, 180, 252, 0.32)",
    },
    cabina: {
      title: "Tema: Cabina A/V • Clic para cambiar a Claro",
      aria: "Tema Cabina A/V activo. Cambiar a Modo Claro",
      bg: "#050811",
      color: "#34D399",
      border: "rgba(52, 211, 153, 0.45)",
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
      className={`relative inline-flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4C3AED] cursor-pointer transition-all shrink-0 backdrop-blur-xs ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        border: `1.5px solid ${currentConfig.border}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: currentConfig.bg,
        color: currentConfig.color,
        boxShadow: isHovered
          ? activeMode === "cabina"
            ? "0 0 14px rgba(52, 211, 153, 0.38)"
            : activeMode === "dark"
            ? "0 4px 14px rgba(129, 140, 248, 0.3)"
            : "0 4px 14px rgba(76, 58, 237, 0.2)"
          : activeMode === "cabina"
          ? "0 0 8px rgba(52, 211, 153, 0.22)"
          : "0 1px 2px rgba(0, 0, 0, 0.04)",
        transform: isActive ? "scale(0.92)" : isHovered ? "scale(1.06)" : "scale(1)",
        transition:
          "background 250ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease, border-color 250ms ease",
        ...style,
      }}
    >
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
        {/* Phase 1: Sun Icon (Light Mode) */}
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
          <Sun size={iconSize} strokeWidth={2.2} />
        </div>

        {/* Phase 2: Moon Icon (Dark Mode) */}
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
          <Moon size={iconSize} strokeWidth={2.2} />
        </div>

        {/* Phase 3: Cabina A/V Icon (Cabina Mode) */}
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
          <MonitorSpeaker size={iconSize} strokeWidth={2.2} />
        </div>
      </div>
    </button>
  );
}
