import fs from "node:fs";
import path from "node:path";

import { CLIENTS_BY_SLUG } from "@/content/clients";
import type { Client } from "@/content/clients";
import type {
  LocalizedValue,
  Project,
  ProjectCategory,
  ProjectDescriptionBlock,
  ProjectDescriptionImage,
  ProjectDescriptionMediaLayout,
  ProjectEntity,
  ProjectGalleryImage,
  ProjectVideoProvider,
  ProjectVideo,
} from "@/domain/projects";
import { normalizeProjectHomeColor } from "@/domain/projects";
import type { Locale, LocaleText } from "@/lib/i18n";

type ProjectFrontmatter = {
  order?: number;
  slug: string;
  name: LocaleText;
  homeLabel?: LocaleText;
  homeColor?: string;
  showOnHome?: boolean;
  homeOrder?: number;
  showInProjectsMenu?: boolean;
  projectsMenuOrder?: number;
  projectsMenuLabel?: LocaleText;
  subtitle: LocaleText;
  categories?: ProjectCategory[];
  year?: string;
  startYear?: number;
  endYear?: number;
  isOngoing?: boolean;
  client?: LocalizedValue;
  location?: LocalizedValue;
  cover: ProjectGalleryImage;
  gallery: ProjectGalleryImage[];
  video?: {
    url: string;
    title: LocaleText;
  };
  description: Record<Locale, string[]> | ProjectDescriptionBlock[];
  meta: { label: LocaleText; value: LocalizedValue }[];
  entities?: string[];
  isPrivate?: boolean;
};

const FRONTMATTER_REGEX = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*/;
const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

export const translateValue = (locale: Locale, value: LocalizedValue): string => {
  if (typeof value === "string") {
    return value;
  }

  return value[locale];
};

const parseLocaleText = (value: unknown, field: string): LocaleText => {
  if (
    !value ||
    typeof value !== "object" ||
    !("es" in value) ||
    !("en" in value)
  ) {
    throw new Error(`Missing locale values for ${field}`);
  }

  const es = (value as Record<string, unknown>).es;
  const en = (value as Record<string, unknown>).en;

  if (typeof es !== "string" || typeof en !== "string") {
    throw new Error(`Locale values for ${field} must be strings`);
  }

  return { es, en };
};

const parseLocalizedValue = (value: unknown, field: string): LocalizedValue => {
  if (typeof value === "string") {
    return value;
  }

  return parseLocaleText(value, field);
};

const parseYouTubeStart = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);

  if (!match) {
    return undefined;
  }

  const [, hours, minutes, seconds] = match;
  const hoursValue = hours ? Number.parseInt(hours, 10) * 3600 : 0;
  const minutesValue = minutes ? Number.parseInt(minutes, 10) * 60 : 0;
  const secondsValue = seconds ? Number.parseInt(seconds, 10) : 0;

  return hoursValue + minutesValue + secondsValue || undefined;
};

const parseVideo = (value: unknown, projectSlug: string): ProjectVideo | undefined => {
  if (!value) {
    return undefined;
  }

  if (!value || typeof value !== "object") {
    throw new Error(`Video for ${projectSlug} must be an object`);
  }

  const rawUrl = (value as Record<string, unknown>).url;
  const rawTitle = (value as Record<string, unknown>).title;

  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new Error(`Video for ${projectSlug} must include a url`);
  }

  let url: URL;

  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error(`Video url for ${projectSlug} is invalid`);
  }

  const hostname = url.hostname.replace(/^www\./, "");
  let provider: ProjectVideoProvider | undefined;
  let embedUrl: string | undefined;

  if (
    hostname === "youtu.be" ||
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com")
  ) {
    provider = "youtube";
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      const [id] = url.pathname.split("/").filter(Boolean);
      videoId = id ?? null;
    } else {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (pathSegments[0] === "embed" || pathSegments[0] === "shorts" || pathSegments[0] === "live") {
        videoId = pathSegments[1] ?? null;
      }
    }

    if (!videoId) {
      throw new Error(`Video url for ${projectSlug} must include a valid YouTube id`);
    }

    const start = parseYouTubeStart(url.searchParams.get("start") ?? url.searchParams.get("t"));
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

    if (start) {
      embedUrl += `?start=${start}`;
    }
  } else if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
    provider = "vimeo";
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const videoId = pathSegments.pop();

    if (!videoId) {
      throw new Error(`Video url for ${projectSlug} must include a valid Vimeo id`);
    }

    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  }

  if (!provider || !embedUrl) {
    throw new Error(
      `Video url for ${projectSlug} must point to a supported provider (YouTube or Vimeo)`,
    );
  }

  return {
    url: rawUrl.trim(),
    provider,
    embedUrl,
    title: parseLocaleText(rawTitle, `${projectSlug} video title`),
  } satisfies ProjectVideo;
};

const parseGallery = (value: unknown, projectName: string): ProjectGalleryImage[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Gallery for ${projectName} must be an array`);
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Gallery item ${index + 1} for ${projectName} is invalid`);
    }

    const src = (item as Record<string, unknown>).src;
    const alt = (item as Record<string, unknown>).alt;
    const footnote = (item as Record<string, unknown>).footnote;
    const size = (item as Record<string, unknown>).size;

    if (typeof src !== "string") {
      throw new Error(`Gallery item ${index + 1} for ${projectName} is missing a src`);
    }

    if (size !== undefined && size !== "small" && size !== "medium" && size !== "large") {
      throw new Error(`Gallery item ${index + 1} for ${projectName} has an invalid size`);
    }

    return {
      src,
      alt: parseLocaleText(alt, `${projectName} gallery alt ${index + 1}`),
      footnote: footnote
        ? parseLocaleText(footnote, `${projectName} gallery footnote ${index + 1}`)
        : undefined,
      ...(size ? { size } : {}),
    };
  });
};

const parseDescriptionGallery = (
  value: unknown,
  projectName: string,
): ProjectDescriptionImage[] => parseGallery(value, projectName);

const parseYearNumber = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number") {
    throw new Error(`${field} debe ser un número`);
  }

  return value;
};

const parseDescription = (
  value: Record<Locale, string[]> | ProjectDescriptionBlock[],
  projectName: string,
): ProjectDescriptionBlock[] => {
  if (Array.isArray(value)) {
    return value.map((block, index) => {
      if (!block || typeof block !== "object" || !("text" in block)) {
        throw new Error(`Description block ${index + 1} for ${projectName} is invalid`);
      }

      const media = block.media;

      return {
        text: parseLocaleText(block.text, `${projectName} description ${index + 1}`),
        ...(media
          ? {
              media: {
                layout: media.layout as ProjectDescriptionMediaLayout,
                images: parseDescriptionGallery(
                  media.images,
                  `${projectName} description ${index + 1}`,
                ),
              },
            }
          : {}),
      };
    });
  }

  const es = Array.isArray(value.es) ? value.es : [];
  const en = Array.isArray(value.en) ? value.en : [];
  const length = Math.max(es.length, en.length);

  if (length === 0) {
    throw new Error(`Description for ${projectName} must include at least one paragraph`);
  }

  return Array.from({ length }, (_, index) => ({
    text: {
      es: es[index] ?? "",
      en: en[index] ?? "",
    },
  }));
};

const parseMeta = (
  value: { label: LocaleText; value: LocalizedValue }[] | undefined,
  projectName: string,
): { label: LocaleText; value: LocalizedValue }[] => {
  if (!value) {
    return [];
  }

  return value.map((item, index) => ({
    label: parseLocaleText(item.label, `${projectName} meta label ${index + 1}`),
    value: parseLocalizedValue(item.value, `${projectName} meta value ${index + 1}`),
  }));
};

const parseEntities = (value: unknown, projectSlug: string): ProjectEntity[] => {
  if (!value) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Entities for ${projectSlug} must be an array`);
  }

  return value.map((entitySlug, index) => {
    if (typeof entitySlug !== "string") {
      throw new Error(`Entity ${index + 1} for ${projectSlug} must be a string slug`);
    }

    const client: Client | undefined = CLIENTS_BY_SLUG[entitySlug];

    if (!client) {
      throw new Error(`Project ${projectSlug} references unknown entity ${entitySlug}`);
    }

    return {
      slug: client.slug,
      name: client.name,
      summary: client.summary,
      sector: client.sector,
      website: client.website,
      image: client.image,
    } satisfies ProjectEntity;
  });
};

const readProjectFile = (filePath: string): { project: Project; order: number } => {
  const rawContent = fs.readFileSync(filePath, "utf8");
  const match = rawContent.match(FRONTMATTER_REGEX);

  if (!match) {
    throw new Error(`Project file ${filePath} is missing frontmatter`);
  }

  const frontmatter = JSON.parse(match[1].trim()) as ProjectFrontmatter;

  if (!frontmatter.slug) {
    throw new Error(`Project file ${filePath} is missing a slug`);
  }

  const name = parseLocaleText(frontmatter.name, `${frontmatter.slug} name`);
  const subtitle = parseLocaleText(frontmatter.subtitle, `${frontmatter.slug} subtitle`);
  const startYear = parseYearNumber(frontmatter.startYear, `${frontmatter.slug} startYear`);
  const endYear = parseYearNumber(frontmatter.endYear, `${frontmatter.slug} endYear`);
  const cover = {
    src: frontmatter.cover?.src ?? "",
    alt: parseLocaleText(frontmatter.cover?.alt, `${frontmatter.slug} cover alt`),
    footnote: frontmatter.cover?.footnote
      ? parseLocaleText(frontmatter.cover.footnote, `${frontmatter.slug} cover footnote`)
      : undefined,
  };

  if (!cover.src) {
    throw new Error(`Project file ${filePath} must include a cover src`);
  }

  const project: Project = {
    slug: frontmatter.slug,
    order: frontmatter.order,
    name,
    homeLabel: frontmatter.homeLabel
      ? parseLocaleText(frontmatter.homeLabel, `${frontmatter.slug} homeLabel`)
      : undefined,
    homeColor: normalizeProjectHomeColor(frontmatter.homeColor),
    showOnHome: frontmatter.showOnHome ?? true,
    homeOrder: frontmatter.homeOrder,
    showInProjectsMenu: frontmatter.showInProjectsMenu ?? true,
    projectsMenuOrder: frontmatter.projectsMenuOrder,
    projectsMenuLabel: frontmatter.projectsMenuLabel
      ? parseLocaleText(frontmatter.projectsMenuLabel, `${frontmatter.slug} projectsMenuLabel`)
      : undefined,
    subtitle,
    categories: frontmatter.categories ?? [],
    year: frontmatter.year ?? (startYear && endYear ? `${startYear}–${endYear}` : `${startYear ?? ""}`),
    startYear,
    endYear: frontmatter.isOngoing ? undefined : endYear,
    isOngoing: Boolean(frontmatter.isOngoing),
    client: frontmatter.client
      ? parseLocalizedValue(frontmatter.client, `${frontmatter.slug} client`)
      : "",
    location: frontmatter.location
      ? parseLocalizedValue(frontmatter.location, `${frontmatter.slug} location`)
      : "",
    cover,
    gallery: parseGallery(frontmatter.gallery, frontmatter.slug),
    video: parseVideo(frontmatter.video, frontmatter.slug),
    description: parseDescription(frontmatter.description, frontmatter.slug),
    meta: parseMeta(frontmatter.meta, frontmatter.slug),
    entities: parseEntities(frontmatter.entities, frontmatter.slug),
    isPrivate: Boolean(frontmatter.isPrivate),
  };

  return { project, order: frontmatter.order ?? Number.MAX_SAFE_INTEGER };
};

const PROJECT_FILES = fs.existsSync(PROJECTS_DIR)
  ? fs
      .readdirSync(PROJECTS_DIR)
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(PROJECTS_DIR, file))
  : [];

export const PROJECTS: Project[] = PROJECT_FILES
  .map(readProjectFile)
  .sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.project.slug.localeCompare(b.project.slug);
  })
  .map(({ project }) => project);

export {
  PROJECT_CATEGORY_LABELS,
  type LocalizedValue,
  type Project,
  type ProjectCategory,
  type ProjectEntity,
  type ProjectGalleryImage,
  type ProjectVideoProvider,
  type ProjectVideo,
} from "@/domain/projects";
