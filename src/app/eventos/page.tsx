import type { Metadata } from "next";
import EventsPageClient from "./page.client";

import { getArtistEvents } from "@/data/artist";
import { getProjects } from "@/data/projects";
import { getSiteContent } from "@/data/site";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Exposiciones, charlas y performances de Lynnette Campos.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage() {
  const [events, projects, siteContent] = await Promise.all([
    getArtistEvents(),
    getProjects(),
    getSiteContent(),
  ]);
  const publishedProjectSlugs = new Set(projects.map((project) => project.slug));
  const publicEvents = events.map((event) =>
    event.projectSlug && !publishedProjectSlugs.has(event.projectSlug)
      ? { ...event, projectSlug: undefined }
      : event,
  );

  return (
    <EventsPageClient
      events={publicEvents}
      projects={projects.map(({ slug, name }) => ({ slug, name }))}
      copy={siteContent.eventsPage}
    />
  );
}
