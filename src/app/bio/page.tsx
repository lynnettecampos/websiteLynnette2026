import type { Metadata } from "next";
import BioPageClient from "./page.client";

import { getArtistProfile } from "@/data/artist";
import { getSiteContent } from "@/data/site";

export const metadata: Metadata = {
  title: "Bio",
  description: "Biografía y práctica artística de Lynnette Campos.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BioPage() {
  const [profile, siteContent] = await Promise.all([
    getArtistProfile(),
    getSiteContent(),
  ]);

  return <BioPageClient profile={profile} copy={siteContent.bioPage} />;
}
