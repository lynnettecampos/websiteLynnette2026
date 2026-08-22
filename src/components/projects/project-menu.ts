import type { Project } from "@/domain/projects";
import { formatProjectTimeline, getProjectMenuLabel } from "@/domain/projects";
import type { LocaleText } from "@/lib/i18n";

export type ProjectMenuItem = {
  slug: string;
  label: LocaleText;
  timeline: string;
};

export const createProjectMenuItems = (projects: Project[]): ProjectMenuItem[] =>
  projects.map((project) => ({
    slug: project.slug,
    label: {
      es: getProjectMenuLabel(project, "es"),
      en: getProjectMenuLabel(project, "en"),
    },
    timeline: formatProjectTimeline(project),
  }));
