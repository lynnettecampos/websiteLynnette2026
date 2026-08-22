import type { ClientImage } from "@/content/clients";
import type { Locale, LocaleText } from "@/lib/i18n";

export type LocalizedValue = string | LocaleText;

export type ProjectGalleryImage = {
  src: string;
  alt: LocaleText;
  footnote?: LocaleText;
};

export type ProjectVideoProvider = "youtube" | "vimeo";

export type ProjectVideo = {
  url: string;
  provider: ProjectVideoProvider;
  embedUrl: string;
  title: LocaleText;
};

export type ProjectEntity = {
  slug: string;
  name: string;
  summary: LocaleText;
  sector: LocaleText;
  website?: string;
  image?: ClientImage;
};

export type ProjectCategory = string;

export const PROJECT_HOME_COLOR_PALETTE = [
  "#ff645f",
  "#5d82ff",
  "#63df83",
  "#d98cff",
  "#ffa642",
  "#ff75ca",
  "#49dfd0",
  "#ffe061",
] as const;

export const PROJECT_HOME_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export const normalizeProjectHomeColor = (
  value: string | null | undefined,
): string | undefined => {
  const normalized = value?.trim().toLowerCase();
  return normalized && PROJECT_HOME_COLOR_PATTERN.test(normalized) ? normalized : undefined;
};

export const resolveProjectHomeColor = (
  value: string | null | undefined,
  index = 0,
): string =>
  normalizeProjectHomeColor(value) ??
  PROJECT_HOME_COLOR_PALETTE[Math.max(0, index) % PROJECT_HOME_COLOR_PALETTE.length];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, LocaleText> = {
  museografia: {
    es: "Museografía",
    en: "Museography",
  },
  "experiencias-digitales": {
    es: "Experiencias digitales",
    en: "Digital experiences",
  },
  "produccion-obra": {
    es: "Producción de obra de arte",
    en: "Production of artwork",
  },
  branding: {
    es: "Branding",
    en: "Branding",
  },
};

export type Project = {
  slug: string;
  /** Legacy database ordering value, preserved by the admin when editing. */
  order?: number;
  name: LocaleText;
  /** Optional short title used by the interactive word-search home. */
  homeLabel?: LocaleText;
  /** Optional highlight color used by this work in the interactive home. */
  homeColor?: string;
  /** Controls whether this work can be included in the word-search home. */
  showOnHome: boolean;
  /** Optional manual ordering for the word-search home. */
  homeOrder?: number;
  /** Controls whether this work appears in the curated projects selector. */
  showInProjectsMenu: boolean;
  /** Optional manual ordering within the curated projects selector. */
  projectsMenuOrder?: number;
  /** Optional short title used only by the curated projects selector. */
  projectsMenuLabel?: LocaleText;
  subtitle: LocaleText;
  categories: ProjectCategory[];
  year: string;
  startYear?: number;
  endYear?: number;
  client: LocalizedValue;
  location: LocalizedValue;
  cover: ProjectGalleryImage;
  gallery: ProjectGalleryImage[];
  video?: ProjectVideo;
  description: LocaleText[];
  meta: { label: LocaleText; value: LocalizedValue }[];
  entities: ProjectEntity[];
  isPrivate?: boolean;
};

export const formatProjectTimeline = (project: Project): string => {
  if (project.startYear && project.endYear) {
    return `${project.startYear} – ${project.endYear}`;
  }

  if (project.startYear) {
    return `${project.startYear}${project.endYear ? ` – ${project.endYear}` : ""}`;
  }

  return project.year;
};

export const getProjectHomeLabel = (project: Project, locale: Locale): string => {
  const customLabel = project.homeLabel?.[locale]?.trim();
  return customLabel || project.name[locale] || project.name[locale === "es" ? "en" : "es"];
};

export const getProjectMenuLabel = (project: Project, locale: Locale): string => {
  const customLabel = project.projectsMenuLabel?.[locale]?.trim();
  return customLabel || project.name[locale] || project.name[locale === "es" ? "en" : "es"];
};

const capitalizeWords = (value: string): string =>
  value.replace(/\b(\w)/g, (match) => match.toUpperCase());

const humanizeCategory = (category: string): string => {
  const normalized = category.trim().replace(/[-_]+/g, " ");

  if (!normalized) {
    return category;
  }

  return capitalizeWords(normalized);
};

export const translateCategoryLabel = (
  locale: Locale,
  category: ProjectCategory,
  labels: Record<ProjectCategory, LocaleText> = PROJECT_CATEGORY_LABELS,
): string => {
  const label = labels[category];

  if (label) {
    return label[locale];
  }

  return humanizeCategory(category);
};
