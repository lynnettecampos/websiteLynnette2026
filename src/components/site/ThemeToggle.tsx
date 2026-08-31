"use client";

import type { Locale } from "@/lib/i18n";

export type SiteTheme = "light" | "dark";

type ThemeToggleProps = {
  theme: SiteTheme;
  locale: Locale;
  onThemeChange: (theme: SiteTheme) => void;
  className?: string;
};

const THEME_OPTIONS: SiteTheme[] = ["light", "dark"];

export function ThemeToggle({ theme, locale, onThemeChange, className }: ThemeToggleProps) {
  const labels =
    locale === "es"
      ? { group: "Apariencia", light: "Claro", dark: "Oscuro" }
      : { group: "Appearance", light: "Light", dark: "Dark" };

  return (
    <div
      className={["theme-switch", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={labels.group}
    >
      {THEME_OPTIONS.map((option, index) => (
        <span key={option} className="theme-option">
          {index > 0 ? (
            <span className="theme-separator" aria-hidden="true">
              /
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onThemeChange(option)}
            aria-pressed={theme === option}
            className={theme === option ? "is-active" : ""}
          >
            {labels[option]}
          </button>
        </span>
      ))}
    </div>
  );
}
