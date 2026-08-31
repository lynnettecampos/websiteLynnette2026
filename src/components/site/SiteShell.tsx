"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { ProjectMenuItem } from "@/components/projects/project-menu";
import type { SiteContent } from "@/domain/site";
import type { Locale } from "@/lib/i18n";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { LocaleProvider } from "./locale-context";
import { ThemeToggle, type SiteTheme } from "./ThemeToggle";

const THEME_STORAGE_KEY = "lynnette-site-theme";
const THEME_CHANGE_EVENT = "lynnette-theme-change";

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

function getThemeSnapshot(): SiteTheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): SiteTheme {
  return "light";
}

type SiteShellProps = {
  siteContent: SiteContent;
  artistName: string;
  projectsMenu: ProjectMenuItem[];
  children: React.ReactNode;
};

export function SiteShell({ children, siteContent, artistName, projectsMenu }: SiteShellProps) {
  const [locale, setLocale] = useState<Locale>("es");
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isHomeRoute = pathname === "/";
  const isProjectDetailRoute = /^\/proyectos\/[^/]+\/?$/.test(pathname ?? "");

  const updateLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  };

  const updateTheme = (nextTheme: SiteTheme) => {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The selected theme still applies even when storage is unavailable.
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <LocaleProvider value={{ locale, setLocale: updateLocale }}>
      <div
        className={`site-shell${isHomeRoute ? " site-shell--home" : ""}${
          isAdminRoute ? " site-shell--admin" : ""
        }`}
      >
        {isAdminRoute ? (
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">{children}</div>
          </main>
        ) : (
          <>
            <a href="#main-content" className="skip-link">
              {locale === "es" ? "Saltar al contenido" : "Skip to content"}
            </a>
            {isHomeRoute ? (
              <ThemeToggle
                theme={theme}
                locale={locale}
                onThemeChange={updateTheme}
                className="home-theme-switch"
              />
            ) : null}
            {!isHomeRoute ? (
              <Header
                navigation={siteContent.navigation}
                artistName={artistName}
                projectsMenu={projectsMenu}
                theme={theme}
                onThemeChange={updateTheme}
              />
            ) : null}
            <main id="main-content" className="site-main" tabIndex={-1}>
              <div
                className={`editorial-frame site-main-frame${
                  isHomeRoute
                    ? " site-main-frame--home"
                    : isProjectDetailRoute
                      ? " site-main-frame--project-detail"
                      : ""
                }`}
              >
                {children}
              </div>
            </main>
            {!isHomeRoute ? <Footer footer={siteContent.footer} artistName={artistName} /> : null}
          </>
        )}
      </div>
    </LocaleProvider>
  );
}
