"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/site/locale-context";
import type { ProjectMenuItem } from "@/components/projects/project-menu";
import { translate } from "@/lib/i18n";

type ProjectSelectorProps = {
  projects: ProjectMenuItem[];
  onNavigate?: () => void;
  variant?: "panel" | "mobile" | "page";
};

export function ProjectSelector({
  projects,
  onNavigate,
  variant = "page",
}: ProjectSelectorProps) {
  const pathname = usePathname();
  const { locale } = useLocale();

  if (projects.length === 0) {
    return (
      <p className="border-t border-foreground/25 py-6 font-mono text-xs uppercase tracking-[0.12em] text-foreground/60">
        {locale === "es"
          ? "La selección de proyectos se publicará próximamente."
          : "The project selection will be published soon."}
      </p>
    );
  }

  return (
    <ol
      className={`list-none ${
        variant === "page"
          ? "border-t border-foreground/25"
          : "py-1 sm:py-2"
      }`}
      aria-label={locale === "es" ? "Selección de proyectos" : "Project selection"}
    >
      {projects.map((project) => {
        const href = `/proyectos/${project.slug}`;
        const isCurrent = pathname === href;

        return (
          <li
            key={project.slug}
            className={variant === "page" ? "border-b border-foreground/25" : undefined}
          >
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isCurrent ? "page" : undefined}
              className={`group block text-balance outline-none transition-[color,transform] duration-150 focus-visible:text-[var(--accent)] ${
                variant === "page"
                  ? "py-4 text-[clamp(1.65rem,4.4vw,4.75rem)] leading-[0.98] tracking-[-0.045em] sm:py-6"
                  : variant === "mobile"
                    ? "py-2.5 text-[clamp(1.45rem,7.5vw,2.35rem)] leading-[1.04] tracking-[-0.035em]"
                    : "py-2.5 text-[clamp(1.65rem,3vw,3.5rem)] leading-[1.02] tracking-[-0.04em] lg:py-3"
              } ${
                isCurrent
                  ? "text-[var(--accent)] underline decoration-1 underline-offset-[0.16em]"
                  : "text-foreground hover:text-[var(--accent)]"
              }`}
            >
              {translate(locale, project.label)}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
