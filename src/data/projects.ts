import { unstable_cache } from "next/cache";

import type { Project } from "@/domain/projects";
import { PROJECTS } from "@/content/projects";
import { mergeFallbackRecordsUntilInitialized } from "@/data/content-bootstrap";
import {
  CONTENT_CACHE_TAGS,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/content-cache";
import { createResilientContentReader } from "@/data/resilient-read";
import { hasDatabaseConfig } from "@/lib/env";
import {
  fetchProjectsFromDatabase,
  isProjectsCollectionInitialized,
} from "@/server/projects";


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

const getProjectsFallback = (includePrivate: boolean): Project[] =>
  sortProjectsByTimeline(filterPrivate(PROJECTS, includePrivate));

const getProjectsFromDatabase = async (includePrivate = false): Promise<Project[]> => {
  const [projects, initialized] = await Promise.all([
    fetchProjectsFromDatabase(),
    isProjectsCollectionInitialized(),
  ]);

  const resolvedProjects = mergeFallbackRecordsUntilInitialized(PROJECTS, projects, initialized);
  return sortProjectsByTimeline(filterPrivate(resolvedProjects, includePrivate));
};

const getPublicProjectsCached = unstable_cache(
  () => getProjectsFromDatabase(false),
  ["public-projects-v3"],
  {
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    tags: [CONTENT_CACHE_TAGS.projects],
  },
);

const readPublicProjects = createResilientContentReader("projects", () =>
  getProjectsFallback(false),
);
const readAllProjects = createResilientContentReader("projects:admin", () =>
  getProjectsFallback(true),
);

export const getProjects = async (includePrivate = false): Promise<Project[]> => {
  if (!hasDatabaseConfig()) {
    return getProjectsFallback(includePrivate);
  }

  return includePrivate
    ? readAllProjects(() => getProjectsFromDatabase(true))
    : readPublicProjects(getPublicProjectsCached);
};

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

  const projects = await getProjects(includePrivate);
  return projects.find((item) => item.slug === slug) ?? null;
};
