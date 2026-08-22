import AdminDashboard from "./page.client";

import { getArtistEvents, getArtistProfile, getPublications } from "@/data/artist";
import { getClients } from "@/data/clients";
import { getProjects } from "@/data/projects";
import { getSiteContent } from "@/data/site";
import { hasCloudinaryConfig, hasDatabaseConfig } from "@/lib/env";
import { requireAdminSession } from "@/server/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  await requireAdminSession();

  const [clients, projects, siteContent, artistProfile, events, publications] = await Promise.all([
    getClients(true),
    getProjects(true),
    getSiteContent(),
    getArtistProfile(),
    getArtistEvents(true),
    getPublications(true),
  ]);

  return (
    <AdminDashboard
      clients={clients}
      projects={projects}
      siteContent={siteContent}
      artistProfile={artistProfile}
      events={events}
      publications={publications}
      databaseReady={hasDatabaseConfig()}
      cloudinaryReady={hasCloudinaryConfig()}
    />
  );
}
