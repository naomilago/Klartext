import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "klartext:theme";

function systemPrefersDark() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage indisponível — segue com a preferência do sistema
  }
  return systemPrefersDark() ? "dark" : "light";
}

export default function ThemeToggle({ size = 36 }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // sem storage disponível — o tema ainda funciona nesta sessão
    }
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="icon-button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--ink-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {isDark ? <SunIcon size={size * 0.5} /> : <MoonIcon size={size * 0.5} />}
    </button>
  );
}
