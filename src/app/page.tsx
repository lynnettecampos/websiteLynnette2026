import { randomUUID } from "node:crypto";

import HomePageClient, { type HomeProjectItem } from "./page.client";

import { getArtistProfile } from "@/data/artist";
import { getProjectsForHome } from "@/data/projects";
import { formatProjectTimeline, getProjectHomeLabel } from "@/domain/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [projects, artistProfile] = await Promise.all([
    getProjectsForHome(),
    getArtistProfile(),
  ]);

  const homeProjects: HomeProjectItem[] = projects.map((project) => ({
    slug: project.slug,
    label: {
      es: getProjectHomeLabel(project, "es"),
      en: getProjectHomeLabel(project, "en"),
    },
    color: project.homeColor,
    timeline: formatProjectTimeline(project),
    cover: project.cover,
  }));

  return (
    <HomePageClient
      artistName={artistProfile.name}
      projects={homeProjects}
      puzzleSeed={randomUUID()}
    />
  );
}
