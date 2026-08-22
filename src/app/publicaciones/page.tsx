import type { Metadata } from "next";
import PublicationsPageClient from "./page.client";

import { getPublications } from "@/data/artist";
import { getSiteContent } from "@/data/site";

export const metadata: Metadata = {
  title: "Publicaciones",
  description: "Textos, catálogos, entrevistas y publicaciones de Lynnette Campos.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicationsPage() {
  const [publications, siteContent] = await Promise.all([
    getPublications(),
    getSiteContent(),
  ]);

  return <PublicationsPageClient publications={publications} copy={siteContent.publicationsPage} />;
}
