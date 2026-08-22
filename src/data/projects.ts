import { unstable_cache } from "next/cache";

import type { Project } from "@/domain/projects";
import { PROJECTS } from "@/content/projects";
import { mergeFallbackRecordsUntilInitialized } from "@/data/content-bootstrap";
import {
  CONTENT_CACHE_TAGS,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/content-cache";
import { hasDatabaseConfig } from "@/lib/env";
import {
  fetchProjectBySlug,
  fetchProjectsFromDatabase,
  isProjectsCollectionInitialized,
} from "@/server/projects";

let warnedProjectFallback = false;

const logProjectFallback = (reason: string) => {
  if (!warnedProjectFallback) {
    console.warn(`[projects] Usando contenido local: ${reason}`);
    warnedProjectFallback = true;
  }
};

const sortProjectsByTimeline = (projects: Project[]): Project[] => {
  const score = (project: Project) => {
    if (project.isOngoing) {
      return new Date().getFullYear();
    }

    if (project.endYear) {
      return project.endYear;
    }

    if (project.startYear) {
      return project.startYear;
    }

    const parsed = Number.parseInt(project.year, 10);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  };

  return [...projects].sort((a, b) => {
    const scoreB = score(b);
    const scoreA = score(a);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return a.slug.localeCompare(b.slug);
  });
};

const filterPrivate = (projects: Project[], includePrivate: boolean) =>
  includePrivate ? projects : projects.filter((project) => !project.isPrivate);

const getProjectsUncached = async (includePrivate = false): Promise<Project[]> => {
  const fallback = () => sortProjectsByTimeline(filterPrivate(PROJECTS, includePrivate));

  if (!hasDatabaseConfig()) {
    return fallback();
  }

  const [projects, initialized] = await Promise.all([
    fetchProjectsFromDatabase(),
    isProjectsCollectionInitialized(),
  ]);

  if (!projects || initialized === null) {
    logProjectFallback("no se pudo contactar la base de datos");
    return fallback();
  }

  const resolvedProjects = mergeFallbackRecordsUntilInitialized(PROJECTS, projects, initialized);
  return sortProjectsByTimeline(filterPrivate(resolvedProjects, includePrivate));
};

const getPublicProjectsCached = unstable_cache(
  () => getProjectsUncached(false),
  ["public-projects-v2"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.projects],
  },
);

export const getProjects = async (includePrivate = false): Promise<Project[]> =>
  includePrivate ? getProjectsUncached(true) : getPublicProjectsCached();

export const getProjectsForHome = async (): Promise<Project[]> => {
  const projects = await getProjects();

  return projects
    .filter((project) => project.showOnHome)
    .sort((a, b) => {
      const aOrder = a.homeOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.homeOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder === bOrder ? a.slug.localeCompare(b.slug) : aOrder - bOrder;
    });
};

export const getProjectsForMenu = async (): Promise<Project[]> => {
  const projects = await getProjects();

  return projects
    .filter((project) => project.showInProjectsMenu)
    .sort((a, b) => {
      const aOrder = a.projectsMenuOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.projectsMenuOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
};

export const getProjectBySlug = async (
  slug: string,
  includePrivate = false,
): Promise<Project | null> => {
  const fallbackLookup = () => {
    const project = PROJECTS.find((item) => item.slug === slug);
    return project && (includePrivate || !project.isPrivate) ? project : null;
  };

  if (!hasDatabaseConfig()) {
    return fallbackLookup();
  }

  if (!includePrivate) {
    const projects = await getProjects();
    return projects.find((item) => item.slug === slug) ?? null;
  }

  const project = await fetchProjectBySlug(slug);

  if (project) {
    return project;
  }

  const hydratedProjects = await getProjects(true);
  return hydratedProjects.find((item) => item.slug === slug) ?? null;
};
