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
  const iconSize = Math.max(18, Math.round(size * 0.58));

  const isBrand = variant === "onBrand";

  const modeConfig = {
    light: {
      title: "Tema: Claro • Clic para cambiar a Modo Oscuro",
      aria: "Modo Claro activo. Cambiar a Modo Oscuro",
      biteBg: isBrand ? "#4332D6" : "#ffffff",
    },
    dark: {
      title: "Tema: Oscuro • Clic para cambiar a Modo Claro",
      aria: "Modo Oscuro activo. Cambiar a Modo Claro",
      biteBg: isBrand ? "#24186B" : "#0f172a",
    },
  };

  const currentConfig = modeConfig[activeMode];

  // Sin contenedor: sin borde, sin fondo permanente, sin sombra de caja
  const variantClasses = isBrand
    ? "text-white hover:text-white hover:bg-white/10"
    : activeMode === "dark"
    ? "text-white hover:text-zinc-100 hover:bg-zinc-800/60"
    : "text-amber-500 hover:text-amber-600 hover:bg-zinc-100/80 dark:text-amber-400 dark:hover:bg-[#27272A]/60";

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
      className={`relative inline-flex items-center justify-center p-1.5 rounded-xl bg-transparent border-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0 ${variantClasses} ${className}`}
      style={{
        width: size,
        height: size,
        ["--tt-bg" as string]: currentConfig.biteBg,
        transform: isActive ? "scale(0.92)" : isHovered ? "scale(1.08)" : "scale(1)",
        transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), color 200ms ease, background-color 200ms ease",
        ...style,
      }}
    >
      <ThemeToggleIcon mode={activeMode} size={iconSize} />
    </button>
  );
}
