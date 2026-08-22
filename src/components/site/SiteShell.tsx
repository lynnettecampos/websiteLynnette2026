"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { ProjectMenuItem } from "@/components/projects/project-menu";
import type { SiteContent } from "@/domain/site";
import type { Locale } from "@/lib/i18n";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { LocaleProvider } from "./locale-context";

type SiteShellProps = {
  siteContent: SiteContent;
  artistName: string;
  projectsMenu: ProjectMenuItem[];
  children: React.ReactNode;
};

export function SiteShell({ children, siteContent, artistName, projectsMenu }: SiteShellProps) {
  const [locale, setLocale] = useState<Locale>("es");
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isHomeRoute = pathname === "/";
  const isProjectDetailRoute = /^\/proyectos\/[^/]+\/?$/.test(pathname ?? "");

  const updateLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  };

  return (
    <LocaleProvider value={{ locale, setLocale: updateLocale }}>
      <div className={`site-shell${isHomeRoute ? " site-shell--home" : ""}`}>
        {isAdminRoute ? (
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">{children}</div>
          </main>
        ) : (
          <>
            <a href="#main-content" className="skip-link">
              {locale === "es" ? "Saltar al contenido" : "Skip to content"}
            </a>
            {!isHomeRoute ? (
              <Header
                navigation={siteContent.navigation}
                artistName={artistName}
                projectsMenu={projectsMenu}
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
