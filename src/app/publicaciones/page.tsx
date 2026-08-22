import type { Metadata } from "next";
import PublicationsPageClient from "./page.client";

import { getPublications } from "@/data/artist";
import { getProjects } from "@/data/projects";
import { getSiteContent } from "@/data/site";

export const metadata: Metadata = {
  title: "Publicaciones",
  description: "Textos, catálogos, entrevistas y publicaciones de Lynnette Campos.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicationsPage() {
  const [publications, projects, siteContent] = await Promise.all([
    getPublications(),
    getProjects(),
    getSiteContent(),
  ]);

  return (
    <PublicationsPageClient
      publications={publications}
      projects={projects.map(({ slug, name }) => ({ slug, name }))}
      copy={siteContent.publicationsPage}
    />
  );
}
