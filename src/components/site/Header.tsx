"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ProjectMenuItem } from "@/components/projects/project-menu";
import { ProjectSelector } from "@/components/projects/project-selector";
import type { SiteContent } from "@/domain/site";
import { AVAILABLE_LOCALES, translate } from "@/lib/i18n";
import { useLocale } from "./locale-context";

type HeaderProps = {
  navigation: SiteContent["navigation"];
  artistName: string;
  projectsMenu: ProjectMenuItem[];
};

export function Header({ navigation, artistName, projectsMenu }: HeaderProps) {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const toggleLabel = isMobileMenuOpen
    ? translate(locale, navigation.closeMenuLabel)
    : translate(locale, navigation.openMenuLabel);
  const navigationItems = [
    { href: "/", label: navigation.homeLabel },
    { href: "/bio", label: navigation.bioLabel },
    { href: "/proyectos", label: navigation.projectsLabel },
    { href: "/eventos", label: navigation.eventsLabel },
    { href: "/publicaciones", label: navigation.publicationsLabel },
    { href: "/contacto", label: navigation.contactLabel },
  ];

  const closeNavigation = () => {
    setIsMobileMenuOpen(false);
    setIsProjectsOpen(false);
  };

  const toggleProjects = (trigger: HTMLButtonElement) => {
    projectTriggerRef.current = trigger;
    setIsProjectsOpen((open) => !open);
  };

  useEffect(() => {
    if (!isProjectsOpen && !isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isProjectsOpen) {
        setIsProjectsOpen(false);
        projectTriggerRef.current?.focus();
        return;
      }

      setIsMobileMenuOpen(false);
      mobileMenuTriggerRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) {
        return;
      }

      closeNavigation();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen, isProjectsOpen]);

  const projectsLabel = translate(locale, navigation.projectsLabel);

  const projectsButtonContents = (
    <>
      <span className="site-projects-label">{projectsLabel}</span>
      <svg
        aria-hidden="true"
        className={`site-disclosure-mark ${isProjectsOpen ? "is-open" : ""}`}
        viewBox="0 0 12 8"
      >
        <path d="m1 1 5 5 5-5" />
      </svg>
    </>
  );

  return (
    <header ref={headerRef} className="site-header">
      <div className="editorial-frame site-header-row">
        <Link href="/" className="site-brand" onClick={closeNavigation}>
          {artistName}
        </Link>

        <nav
          className="desktop-navigation"
          aria-label={locale === "es" ? "Navegación principal" : "Main navigation"}
        >
          {navigationItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            if (item.href === "/proyectos") {
              return (
                <div key={item.href} className="desktop-projects-anchor">
                  <button
                    ref={projectTriggerRef}
                    id="desktop-projects-trigger"
                    type="button"
                    onClick={(event) => toggleProjects(event.currentTarget)}
                    aria-expanded={isProjectsOpen}
                    aria-controls="desktop-projects-panel"
                    className={`site-nav-link site-projects-trigger ${
                      isActive || isProjectsOpen ? "is-active" : ""
                    }`}
                  >
                    {projectsButtonContents}
                  </button>

                  {isProjectsOpen ? (
                    <div
                      id="desktop-projects-panel"
                      role="region"
                      aria-labelledby="desktop-projects-trigger"
                      className="desktop-projects-panel project-disclosure-list"
                    >
                      <ProjectSelector
                        projects={projectsMenu}
                        variant="panel"
                        onNavigate={closeNavigation}
                      />
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeNavigation}
                aria-current={isActive ? "page" : undefined}
                className={`site-nav-link ${isActive ? "is-active" : ""}`}
              >
                {translate(locale, item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="desktop-locale-switch" aria-label={locale === "es" ? "Idioma" : "Language"}>
          {AVAILABLE_LOCALES.map((option, index) => {
            const isSelected = option.code === locale;

            return (
              <span key={option.code} className="locale-option">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                <button
                  type="button"
                  onClick={() => setLocale(option.code)}
                  aria-pressed={isSelected}
                  className={isSelected ? "is-active" : ""}
                >
                  {option.label}
                </button>
              </span>
            );
          })}
        </div>

        <button
          ref={mobileMenuTriggerRef}
          type="button"
          className="mobile-menu-trigger"
          onClick={() => {
            setIsMobileMenuOpen((open) => {
              if (open) {
                setIsProjectsOpen(false);
              }

              return !open;
            });
          }}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={toggleLabel}
        >
          <span>
            {isMobileMenuOpen
              ? locale === "es"
                ? "Cerrar"
                : "Close"
              : locale === "es"
                ? "Menú"
                : "Menu"}
          </span>
          <span aria-hidden="true">{isMobileMenuOpen ? "−" : "+"}</span>
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div id="mobile-navigation" className="mobile-navigation-panel">
          <nav
            aria-label={locale === "es" ? "Navegación principal" : "Main navigation"}
            className="mobile-navigation-list"
          >
            {navigationItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              if (item.href === "/proyectos") {
                return (
                  <div key={item.href} className="mobile-projects-item">
                    <button
                      ref={isMobileMenuOpen ? projectTriggerRef : undefined}
                      id="mobile-projects-trigger"
                      type="button"
                      onClick={(event) => toggleProjects(event.currentTarget)}
                      aria-expanded={isProjectsOpen}
                      aria-controls="mobile-projects-panel"
                      className={`mobile-nav-link mobile-projects-trigger ${
                        isActive || isProjectsOpen ? "is-active" : ""
                      }`}
                    >
                      {projectsButtonContents}
                    </button>

                    {isProjectsOpen ? (
                      <div
                        id="mobile-projects-panel"
                        role="region"
                        aria-labelledby="mobile-projects-trigger"
                        className="mobile-projects-panel project-disclosure-list"
                      >
                        <ProjectSelector
                          projects={projectsMenu}
                          variant="mobile"
                          onNavigate={closeNavigation}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeNavigation}
                  aria-current={isActive ? "page" : undefined}
                  className={`mobile-nav-link ${isActive ? "is-active" : ""}`}
                >
                  {translate(locale, item.label)}
                </Link>
              );
            })}
          </nav>

          <div className="mobile-locale-switch" aria-label={locale === "es" ? "Idioma" : "Language"}>
            {AVAILABLE_LOCALES.map((option, index) => {
              const isSelected = option.code === locale;

              return (
                <span key={option.code} className="locale-option">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <button
                    type="button"
                    onClick={() => setLocale(option.code)}
                    aria-pressed={isSelected}
                    className={isSelected ? "is-active" : ""}
                  >
                    {option.label}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
