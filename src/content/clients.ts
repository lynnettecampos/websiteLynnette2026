import fs from "node:fs";
import path from "node:path";

import type { LocaleText } from "@/lib/i18n";

export type ClientImage = {
  src: string;
  alt: LocaleText;
  footnote?: LocaleText;
};

export type ClientKind = "client" | "institution" | "partner";

export type Client = {
  slug: string;
  order?: number;
  name: string;
  sector: LocaleText;
  summary: LocaleText;
  website?: string;
  image?: ClientImage;
  kind: ClientKind;
  isPrivate?: boolean;
};

type ClientFrontmatter = {
  order?: number;
  slug: string;
  name: string;
  sector: LocaleText;
  summary: LocaleText;
  website?: string;
  image?: ClientImage;
  kind?: ClientKind;
  isPrivate?: boolean;
};

const FRONTMATTER_REGEX = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*/;
const CLIENTS_DIR = path.join(process.cwd(), "content/clients");

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

const parseImage = (value: unknown, clientName: string): ClientImage | undefined => {
  if (!value) {
    return undefined;
  }

  if (!value || typeof value !== "object") {
    throw new Error(`Image for ${clientName} must be an object`);
  }

  const src = (value as Record<string, unknown>).src;
  const alt = (value as Record<string, unknown>).alt;
  const footnote = (value as Record<string, unknown>).footnote;

  if (typeof src !== "string" || src.length === 0) {
    throw new Error(`Image for ${clientName} must include a src`);
  }

  return {
    src,
    alt: parseLocaleText(alt, `${clientName} image alt`),
    footnote: footnote ? parseLocaleText(footnote, `${clientName} image footnote`) : undefined,
  };
};

const readClientFile = (filePath: string): { client: Client; order: number } => {
  const rawContent = fs.readFileSync(filePath, "utf8");
  const match = rawContent.match(FRONTMATTER_REGEX);

  if (!match) {
    throw new Error(`Client file ${filePath} is missing frontmatter`);
  }

  const frontmatter = JSON.parse(match[1].trim()) as ClientFrontmatter;

  if (!frontmatter.slug) {
    throw new Error(`Client file ${filePath} is missing a slug`);
  }

  if (!frontmatter.name) {
    throw new Error(`Client file ${filePath} is missing a name`);
  }

  const client: Client = {
    slug: frontmatter.slug,
    order: frontmatter.order,
    name: frontmatter.name,
    sector: parseLocaleText(frontmatter.sector, `${frontmatter.name} sector`),
    summary: parseLocaleText(frontmatter.summary, `${frontmatter.name} summary`),
    website: frontmatter.website,
    image: parseImage(frontmatter.image, frontmatter.name),
    kind: frontmatter.kind ?? "client",
    isPrivate: frontmatter.isPrivate ?? false,
  };

  return { client, order: frontmatter.order ?? Number.MAX_SAFE_INTEGER };
};

const CLIENT_FILES = fs
  .readdirSync(CLIENTS_DIR)
  .filter((file) => file.endsWith(".md"))
  .map((file) => path.join(CLIENTS_DIR, file));

const CLIENT_RESULTS = CLIENT_FILES.map(readClientFile).sort((a, b) => {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return a.client.name.localeCompare(b.client.name);
});

export const CLIENTS: Client[] = CLIENT_RESULTS.map(({ client }) => client);

export const CLIENTS_BY_SLUG: Record<string, Client> = CLIENTS.reduce(
  (accumulator, client) => {
    accumulator[client.slug] = client;
    return accumulator;
  },
  {} as Record<string, Client>,
);
