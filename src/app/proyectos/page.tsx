import ProjectsPageClient from "./page.client";

import { createProjectMenuItems } from "@/components/projects/project-menu";
import { getProjectsForMenu } from "@/data/projects";
import { getSiteContent } from "@/data/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const [projects, siteContent] = await Promise.all([
    getProjectsForMenu(),
    getSiteContent(),
  ]);

  return (
    <ProjectsPageClient
      projects={createProjectMenuItems(projects)}
      copy={siteContent.projectsPage}
    />
  );
}
