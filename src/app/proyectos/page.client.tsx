"use client";

import type { ProjectMenuItem } from "@/components/projects/project-menu";
import { ProjectSelector } from "@/components/projects/project-selector";
import { RichText } from "@/components/site/rich-text";
import { useLocale } from "@/components/site/locale-context";
import type { SiteContent } from "@/domain/site";

type ProjectsPageClientProps = {
  projects: ProjectMenuItem[];
  copy: SiteContent["projectsPage"];
};

export default function ProjectsPageClient({ projects, copy }: ProjectsPageClientProps) {
  const { locale } = useLocale();

  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="projects-index-title">
      <header className="mb-5 flex items-baseline gap-3 border-b border-foreground/25 pb-2 sm:mb-8">
        <RichText
          as="h1"
          id="projects-index-title"
          value={copy.title}
          className="text-lg font-normal uppercase tracking-[-0.03em] sm:text-2xl"
        />
        <span aria-hidden="true" className="text-lg text-foreground/60 sm:text-2xl">
          /
        </span>
        <span className="text-lg italic tracking-[-0.03em] text-foreground/70 sm:text-2xl">
          {locale === "es" ? "Projects" : "Proyectos"}
        </span>
      </header>

      <nav aria-label={locale === "es" ? "Índice de proyectos" : "Project index"}>
        <ProjectSelector projects={projects} variant="page" />
      </nav>
    </section>
  );
}
