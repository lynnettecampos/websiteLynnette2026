import { revalidatePath, revalidateTag } from "next/cache";

export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;

export const CONTENT_CACHE_TAGS = {
  artist: "public-artist-profile",
  events: "public-artist-events",
  projects: "public-projects",
  publications: "public-publications",
  site: "public-site-content",
} as const;

export type ContentCacheTag =
  (typeof CONTENT_CACHE_TAGS)[keyof typeof CONTENT_CACHE_TAGS];

export const invalidatePublicContent = (...tags: ContentCacheTag[]): void => {
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  // El contenido aparece en el layout y en varias rutas. Invalidar el layout
  // evita mantener una versión renderizada anterior después de guardar en admin.
  revalidatePath("/", "layout");
};
