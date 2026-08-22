import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/projects/project-detail";
import { createProjectMenuItems } from "@/components/projects/project-menu";
import { PROJECT_CATEGORY_LABELS } from "@/domain/projects";
import { getProjectBySlug, getProjectsForMenu } from "@/data/projects";

const DEFAULT_DESCRIPTION =
  "Archivo de proyectos de Lynnette Campos.";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProjectPageParams = { slug: string };

type ProjectPageProps = {
  params?: Promise<ProjectPageParams>;
};

async function resolveParams(params?: Promise<ProjectPageParams>) {
  if (!params) {
    notFound();
  }

  const resolved = await params;

  if (!resolved) {
    notFound();
  }

  return resolved;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);

  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Proyecto no encontrado",
      description: DEFAULT_DESCRIPTION,
    };
  }

  const title = project.name.es;
  const description = project.subtitle.es || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: project.cover.src,
          alt: project.cover.alt.es,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [project.cover.src],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await resolveParams(params);

  const [project, selectedProjects] = await Promise.all([
    getProjectBySlug(slug),
    getProjectsForMenu(),
  ]);

  if (!project) {
    notFound();
  }

  const menuItems = createProjectMenuItems(selectedProjects);
  const currentIndex = menuItems.findIndex((item) => item.slug === project.slug);
  const navigation =
    currentIndex >= 0
      ? {
          previous: currentIndex > 0 ? menuItems[currentIndex - 1] : undefined,
          next: currentIndex < menuItems.length - 1 ? menuItems[currentIndex + 1] : undefined,
        }
      : undefined;

  return (
    <ProjectDetail
      project={project}
      categoryLabels={PROJECT_CATEGORY_LABELS}
      navigation={navigation}
    />
  );
}
