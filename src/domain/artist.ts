import type { ProjectGalleryImage } from "@/domain/projects";
import type { LocaleText } from "@/lib/i18n";

export type ArtistProfile = {
  name: string;
  role: LocaleText;
  introduction: LocaleText;
  biography: LocaleText[];
  statementTitle: LocaleText;
  statement: LocaleText[];
  portrait?: ProjectGalleryImage;
  cvUrl?: string;
};

export type ArtistEventType =
  | "exhibition"
  | "talk"
  | "performance"
  | "residency"
  | "workshop"
  | "other";

export type ArtistEvent = {
  slug: string;
  title: LocaleText;
  type: ArtistEventType;
  startDate: string;
  endDate?: string;
  venue: LocaleText;
  location: LocaleText;
  description?: LocaleText;
  url?: string;
  image?: ProjectGalleryImage;
  projectSlug?: string;
  isPrivate?: boolean;
};

export type PublicationType =
  | "artist-text"
  | "catalogue"
  | "interview"
  | "press"
  | "academic"
  | "other";

export type Publication = {
  slug: string;
  title: LocaleText;
  type: PublicationType;
  publishedAt: string;
  publisher: LocaleText;
  summary?: LocaleText;
  url?: string;
  downloadUrl?: string;
  cover?: ProjectGalleryImage;
  isPrivate?: boolean;
};
