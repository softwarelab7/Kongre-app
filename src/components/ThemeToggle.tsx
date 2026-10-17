import { useState, useEffect, CSSProperties } from "react";
import { Moon, Sun } from "lucide-react";

export interface ThemeToggleProps {
  isDark?: boolean;
  onToggle?: (next: boolean) => void;
  className?: string;
  style?: CSSProperties;
  size?: number;
}

export default function ThemeToggle({
  isDark,
  onToggle,
  className = "",
  style = {},
  size = 28,
}: ThemeToggleProps) {
  const [internalDark, setInternalDark] = useState(() => {
    if (typeof isDark === "boolean") return isDark;
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const dark = typeof isDark === "boolean" ? isDark : internalDark;

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof isDark === "boolean") setInternalDark(isDark);
  }, [isDark]);

  function toggleTheme() {
    const next = !dark;
    if (typeof isDark !== "boolean") {
      setInternalDark(next);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
        document.documentElement.dataset.theme = next ? "dark" : "light";
        document.documentElement.style.colorScheme = next ? "dark" : "light";
      }
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
        localStorage.setItem("kongre-theme", next ? "dark" : "light");
        localStorage.setItem("kongre_theme", next ? "dark" : "light");
      } catch {}
    }
    onToggle?.(next);
  }

  // Calculate icon size proportionally (14px for 28px, 18px for 36px, 22px for 48px)
  const iconSize = size === 48 ? 22 : Math.max(13, Math.round(size * 0.5));

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-pressed={dark}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={`relative inline-flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B4F91] cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: dark ? "#D5E3FF" : "#E5EAF5",
        color: "#1B4F91",
        boxShadow: isHovered
          ? dark
            ? "0 4px 16px rgba(213, 227, 255, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)"
            : "0 4px 16px rgba(27, 79, 145, 0.18), 0 0 0 1px rgba(27, 79, 145, 0.08)"
          : "0 1px 3px rgba(0, 0, 0, 0.05)",
        transform: isActive ? "scale(0.92)" : isHovered ? "scale(1.06)" : "scale(1)",
        transition:
          "background 250ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease",
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
        {/* Sun Icon (shown when dark) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: dark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0)",
            opacity: dark ? 1 : 0,
            transition:
              "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease",
            pointerEvents: "none",
          }}
        >
          <Sun size={iconSize} />
        </div>

        {/* Moon Icon (shown when light) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: dark ? "rotate(-90deg) scale(0)" : "rotate(0deg) scale(1)",
            opacity: dark ? 0 : 1,
            transition:
              "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease",
            pointerEvents: "none",
          }}
        >
          <Moon size={iconSize} />
        </div>
      </div>
    </button>
  );
}
