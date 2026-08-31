import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { createProjectMenuItems } from "@/components/projects/project-menu";
import { getArtistProfile } from "@/data/artist";
import { getProjectsForMenu } from "@/data/projects";
import { getSiteContent } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Lynnette Campos",
    template: "%s · Lynnette Campos",
  },
  description: "Sitio oficial y archivo de proyectos de la artista Lynnette Campos.",
  openGraph: {
    title: "Lynnette Campos",
    description: "Sitio oficial y archivo de proyectos de la artista Lynnette Campos.",
    type: "website",
    siteName: "Lynnette Campos",
    images: [
      {
        url: "/favicon.png",
        width: 500,
        height: 500,
        alt: "Lynnette Campos",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Lynnette Campos",
    description: "Sitio oficial y archivo de proyectos de la artista Lynnette Campos.",
    images: ["/favicon.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteContent, artistProfile, projects] = await Promise.all([
    getSiteContent(),
    getArtistProfile(),
    getProjectsForMenu(),
  ]);
  const projectsMenu = createProjectMenuItems(projects);

  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("lynnette-site-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <SiteShell
          siteContent={siteContent}
          artistName={artistProfile.name}
          projectsMenu={projectsMenu}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
