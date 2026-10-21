import { useState, CSSProperties } from "react";
import ThemeToggleIcon from "./ThemeToggleIcon";
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
    propThemeMode === "dark" || propThemeMode === "light"
      ? propThemeMode
      : typeof propIsDark === "boolean"
      ? propIsDark
        ? "dark"
        : "light"
      : themeCtx?.themeMode === "dark"
      ? "dark"
      : typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  function handleToggleTheme() {
    const next: ThemeMode = activeMode === "light" ? "dark" : "light";

    if (themeCtx?.setThemeMode) {
      themeCtx.setThemeMode(next);
    } else if (onToggle) {
      onToggle(next);
    } else {
      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.dataset.theme = next;
        if (next === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
        root.classList.remove("theme-cabina");
      }
      try {
        localStorage.setItem("theme", next);
        localStorage.setItem("kongre-theme", next);
        localStorage.setItem("kongre_theme", next);
      } catch {}
    }
  }

  // Escalar el tamaño proporcional del SVG
  const iconSize = size === 48 ? 24 : Math.max(14, Math.round(size * 0.56));

  const isBrand = variant === "onBrand";

  const modeConfig = {
    light: {
      title: "Tema: Claro • Clic para cambiar a Modo Oscuro",
      aria: "Modo Claro activo. Cambiar a Modo Oscuro",
      bg: isBrand ? "rgba(255, 255, 255, 0.2)" : "#F4F3FE",
      color: isBrand ? "#FFFFFF" : "#4C3AED",
      border: isBrand ? "rgba(255, 255, 255, 0.35)" : "rgba(76, 58, 237, 0.18)",
      biteBg: isBrand ? "#4332D6" : "#F4F3FE",
    },
    dark: {
      title: "Tema: Oscuro • Clic para cambiar a Modo Claro",
      aria: "Modo Oscuro activo. Cambiar a Modo Claro",
      bg: isBrand ? "rgba(15, 23, 42, 0.7)" : "#1E293B",
      color: isBrand ? "#C7D2FE" : "#9085F4",
      border: isBrand ? "rgba(199, 210, 254, 0.4)" : "rgba(144, 133, 244, 0.3)",
      biteBg: isBrand ? "#24186B" : "#1E293B",
    },
  };

  const currentConfig = modeConfig[activeMode];

  return (
    <button
      type="button"
      onClick={handleToggleTheme}
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
          ? activeMode === "dark"
            ? "0 4px 16px rgba(144, 133, 244, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)"
            : "0 4px 16px rgba(76, 58, 237, 0.22), 0 0 0 1px rgba(76, 58, 237, 0.12)"
          : "0 1px 3px rgba(0, 0, 0, 0.05)",
        ["--tt-bg" as string]: currentConfig.biteBg,
        transform: isActive ? "scale(0.92)" : isHovered ? "scale(1.06)" : "scale(1)",
        transition:
          "background 250ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease, border-color 250ms ease",
        ...style,
      }}
    >
      <ThemeToggleIcon mode={activeMode} size={iconSize} />
    </button>
  );
}
