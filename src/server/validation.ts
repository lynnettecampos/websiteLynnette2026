import { z } from "zod";

import { PROJECT_HOME_COLOR_PATTERN } from "@/domain/projects";
import {
  MAX_WORD_SEARCH_WORD_LENGTH,
  normalizeWordSearchText,
} from "@/lib/word-search";

export const localeTextSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const imageSourceSchema = z.string().trim().min(1).refine(
  (value) => {
    if (value.startsWith("/") && !value.startsWith("//")) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
    } catch {
      return false;
    }
  },
  {
    message: "Use a local /images path or an HTTPS URL from res.cloudinary.com",
  },
);

const siteLocaleTextSchema = z.object({
  es: z.string(),
  en: z.string(),
});

export const localizedValueSchema = z.union([
  z.string().min(1),
  localeTextSchema,
]);

export const clientImageSchema = z
  .object({
    src: imageSourceSchema.optional(),
    publicId: z.string().min(1).optional(),
    alt: localeTextSchema,
    footnote: localeTextSchema.optional(),
  })
  .refine((value) => Boolean(value.src) || Boolean(value.publicId), {
    message: "Image requires a src or publicId",
  });

export const clientPayloadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["client", "institution", "partner"]).optional(),
  order: z.number().int().optional(),
  sector: localeTextSchema,
  summary: localeTextSchema,
  website: z.string().url().optional(),
  image: clientImageSchema.nullable().optional(),
  isPrivate: z.boolean().optional(),
});

export const projectCategorySchema = z.string().trim().min(1);

export const projectImageSchema = clientImageSchema;

export const projectMetaSchema = z.object({
  label: localeTextSchema,
  value: localizedValueSchema,
});

export const projectVideoSchema = z
  .object({
    url: z.string().url().refine(
      (value) => {
        try {
          const hostname = new URL(value).hostname.replace(/^www\./, "");
          return (
            hostname === "youtu.be" ||
            hostname === "youtube.com" ||
            hostname.endsWith(".youtube.com") ||
            hostname === "vimeo.com" ||
            hostname === "player.vimeo.com" ||
            hostname.endsWith(".vimeo.com")
          );
        } catch {
          return false;
        }
      },
      { message: "Use a YouTube or Vimeo URL" },
    ),
    title: localeTextSchema,
  })
  .optional()
  .nullable();

export const projectPayloadSchema = z
  .object({
    slug: z.string().min(1),
    name: localeTextSchema,
    homeLabel: localeTextSchema.optional().nullable(),
    homeColor: z
      .string()
      .trim()
      .regex(PROJECT_HOME_COLOR_PATTERN, "Use a six-digit hexadecimal color")
      .transform((value) => value.toLowerCase())
      .optional()
      .nullable(),
    showOnHome: z.boolean().optional(),
    homeOrder: z.number().int().optional().nullable(),
    showInProjectsMenu: z.boolean().optional(),
    projectsMenuOrder: z.number().int().optional().nullable(),
    projectsMenuLabel: localeTextSchema.optional().nullable(),
    subtitle: localeTextSchema,
    categories: z.array(projectCategorySchema).default([]),
    year: z.string().min(1),
    startYear: z.number().int().optional(),
    endYear: z.number().int().optional(),
    client: z.union([z.string(), siteLocaleTextSchema]).default(""),
    location: localizedValueSchema,
    cover: projectImageSchema,
    gallery: z.array(projectImageSchema).optional(),
    video: projectVideoSchema,
    description: z.array(localeTextSchema).min(1),
    meta: z.array(projectMetaSchema).optional(),
    entities: z.array(z.string().min(1)).optional(),
    order: z.number().int().optional(),
    isPrivate: z.boolean().optional(),
  })
  .superRefine((project, context) => {
    if (project.showOnHome === false) {
      return;
    }

    (["es", "en"] as const).forEach((locale) => {
      const effectiveLabel = project.homeLabel?.[locale] || project.name[locale];
      const normalizedLength = normalizeWordSearchText(effectiveLabel).length;

      if (normalizedLength === 0) {
        context.addIssue({
          code: "custom",
          path: ["homeLabel", locale],
          message: "Use at least one letter A-Z or number for the Home word search",
        });
      } else if (normalizedLength > MAX_WORD_SEARCH_WORD_LENGTH) {
        context.addIssue({
          code: "custom",
          path: ["homeLabel", locale],
          message: `Use no more than ${MAX_WORD_SEARCH_WORD_LENGTH} letters or numbers for the Home word search`,
        });
      }
    });
  });

export const serviceSchema = z.object({
  slug: z.string().min(1),
  title: localeTextSchema,
  summary: localeTextSchema,
  outcomes: z.array(localeTextSchema).default([]),
  gallery: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: localeTextSchema,
      }),
    )
    .default([]),
});

const mediaSchema = z
  .object({
    url: z.string().url().optional(),
    publicId: z.string().min(1).optional(),
    poster: z.string().url().optional(),
  })
  .optional()
  .refine((value) => {
    if (!value) return true;
    return Boolean(value.url) || Boolean(value.publicId) || Boolean(value.poster);
  }, "Provide a video URL, publicId, or poster to enable the hero video.");

export const siteCopySchema = z.object({
  navigation: z.object({
    brand: siteLocaleTextSchema,
    homeLabel: siteLocaleTextSchema,
    bioLabel: siteLocaleTextSchema,
    servicesLabel: siteLocaleTextSchema,
    clientsLabel: siteLocaleTextSchema,
    projectsLabel: siteLocaleTextSchema,
    eventsLabel: siteLocaleTextSchema,
    publicationsLabel: siteLocaleTextSchema,
    contactLabel: siteLocaleTextSchema,
    openMenuLabel: siteLocaleTextSchema,
    closeMenuLabel: siteLocaleTextSchema,
  }),
  home: z.object({
    heroHeadline: siteLocaleTextSchema,
    heroSubtitle: siteLocaleTextSchema,
    heroPrimaryCta: siteLocaleTextSchema,
    heroSecondaryCta: siteLocaleTextSchema,
    heroTags: z.array(siteLocaleTextSchema).default([]),
    heroVideo: mediaSchema,
    servicesTitle: siteLocaleTextSchema,
    servicesCopy: siteLocaleTextSchema,
    servicesCta: siteLocaleTextSchema,
    servicesTags: z.array(siteLocaleTextSchema).default([]),
    servicesBadgeLabel: siteLocaleTextSchema,
    servicesCardCta: siteLocaleTextSchema,
    projectsTitle: siteLocaleTextSchema,
    projectsDescription: siteLocaleTextSchema,
    projectsTags: z.array(siteLocaleTextSchema).default([]),
    projectsBadgeLabel: siteLocaleTextSchema,
    projectsCardCta: siteLocaleTextSchema,
    projectsImageAlt: siteLocaleTextSchema,
    projectsCta: siteLocaleTextSchema,
    clientsTitle: siteLocaleTextSchema,
    clientsWebsiteLabel: siteLocaleTextSchema,
    contactCta: siteLocaleTextSchema,
  }),
  servicesPage: z.object({
    title: siteLocaleTextSchema,
    copy: siteLocaleTextSchema,
    ctaLabel: siteLocaleTextSchema,
    chips: z.array(siteLocaleTextSchema).default([]),
    outcomesLabel: siteLocaleTextSchema,
    quickMapLabel: siteLocaleTextSchema,
    highlightPrimaryLabel: siteLocaleTextSchema,
    highlightSecondaryLabel: siteLocaleTextSchema,
    sessionTitle: siteLocaleTextSchema,
    sessionCopy: siteLocaleTextSchema,
    talkCtaLabel: siteLocaleTextSchema,
    backToTopLabel: siteLocaleTextSchema,
    imageSrc: z.string().min(1).optional(),
    imageAlt: siteLocaleTextSchema,
    gallery: z
      .array(
        z.object({
          src: z.string().min(1),
          alt: siteLocaleTextSchema,
        }),
      )
      .default([]),
  }),
  projectsPage: z.object({
    title: siteLocaleTextSchema,
    copy: siteLocaleTextSchema,
    filterAllLabel: siteLocaleTextSchema,
    emptyState: siteLocaleTextSchema,
    cardCta: siteLocaleTextSchema,
    ctaTitle: siteLocaleTextSchema,
    ctaDescription: siteLocaleTextSchema,
    ctaAction: siteLocaleTextSchema,
  }),
  bioPage: z.object({
    title: siteLocaleTextSchema,
    pending: siteLocaleTextSchema,
    cvLabel: siteLocaleTextSchema,
  }),
  eventsPage: z.object({
    title: siteLocaleTextSchema,
    introduction: siteLocaleTextSchema,
    upcomingTitle: siteLocaleTextSchema,
    pastTitle: siteLocaleTextSchema,
    emptyUpcoming: siteLocaleTextSchema,
    emptyPast: siteLocaleTextSchema,
    detailsLabel: siteLocaleTextSchema,
  }),
  publicationsPage: z.object({
    title: siteLocaleTextSchema,
    introduction: siteLocaleTextSchema,
    empty: siteLocaleTextSchema,
    openLabel: siteLocaleTextSchema,
    downloadLabel: siteLocaleTextSchema,
  }),
  clientsPage: z.object({
    title: siteLocaleTextSchema,
    copy: siteLocaleTextSchema,
    imageSrc: z.string().min(1).optional(),
    imageAlt: siteLocaleTextSchema,
    websiteLabel: siteLocaleTextSchema,
  }),
  contact: z.object({
    title: siteLocaleTextSchema,
    copy: siteLocaleTextSchema,
    email: z.string().email(),
    preparation: z.array(siteLocaleTextSchema).default([]),
    bookCallTitle: siteLocaleTextSchema,
    bookCallCopy: siteLocaleTextSchema,
    bookCallCta: siteLocaleTextSchema,
    preparationTitle: siteLocaleTextSchema,
    formTitle: siteLocaleTextSchema,
    formSubtitle: siteLocaleTextSchema,
    successLabel: siteLocaleTextSchema,
    nameLabel: siteLocaleTextSchema,
    emailLabel: siteLocaleTextSchema,
    organizationLabel: siteLocaleTextSchema,
    phoneLabel: siteLocaleTextSchema,
    subjectLabel: siteLocaleTextSchema,
    messageLabel: siteLocaleTextSchema,
    submitLabel: siteLocaleTextSchema,
    sendingLabel: siteLocaleTextSchema,
    moreContactTitle: siteLocaleTextSchema,
    moreContactLabel: siteLocaleTextSchema,
    moreContactNote: siteLocaleTextSchema,
    imageSrc: z.string().min(1).optional(),
    imageAlt: siteLocaleTextSchema,
  }),
  footer: z.object({
    tagline: siteLocaleTextSchema,
    adminLabel: siteLocaleTextSchema,
    instagramLabel: siteLocaleTextSchema,
    instagramUrl: z.union([z.literal(""), z.string().url()]).optional(),
    facebookLabel: siteLocaleTextSchema,
    facebookUrl: z.union([z.literal(""), z.string().url()]).optional(),
    linkedinLabel: siteLocaleTextSchema,
    linkedinUrl: z.union([z.literal(""), z.string().url()]).optional(),
  }),
  services: z.array(serviceSchema).min(1),
});

export const sitePayloadSchema = siteCopySchema;

const optionalArtistImageSchema = z
  .object({
    src: imageSourceSchema,
    alt: localeTextSchema,
    footnote: localeTextSchema.optional(),
  })
  .optional();

export const artistProfileSchema = z.object({
  name: z.string().min(1),
  role: localeTextSchema,
  introduction: siteLocaleTextSchema,
  biography: z.array(siteLocaleTextSchema),
  statementTitle: localeTextSchema,
  statement: z.array(siteLocaleTextSchema),
  portrait: optionalArtistImageSchema,
  cvUrl: z.string().url().optional(),
});

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z.string().superRefine((value, context) => {
  if (!ISO_DATE_PATTERN.test(value)) {
    context.addIssue({
      code: "custom",
      message: "Use YYYY-MM-DD",
    });
    return;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  const isCalendarDate =
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;

  if (!isCalendarDate) {
    context.addIssue({
      code: "custom",
      message: "Use a valid calendar date",
    });
  }
});

export const artistEventSchema = z
  .object({
    slug: z.string().min(1),
    title: localeTextSchema,
    type: z.enum(["exhibition", "talk", "performance", "residency", "workshop", "other"]),
    startDate: isoDateSchema,
    endDate: isoDateSchema.optional(),
    venue: siteLocaleTextSchema,
    location: siteLocaleTextSchema,
    description: siteLocaleTextSchema.optional(),
    url: z.string().url().optional(),
    image: optionalArtistImageSchema,
    projectSlug: z.string().min(1).optional(),
    isPrivate: z.boolean().optional(),
  })
  .superRefine((event, context) => {
    if (event.endDate && event.endDate < event.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate must be on or after startDate",
      });
    }
  });

export const publicationSchema = z.object({
  slug: z.string().min(1),
  title: localeTextSchema,
  type: z.enum(["artist-text", "catalogue", "interview", "press", "academic", "other"]),
  publishedAt: isoDateSchema,
  publisher: siteLocaleTextSchema,
  summary: siteLocaleTextSchema.optional(),
  url: z.string().url().optional(),
  downloadUrl: z.string().url().optional(),
  cover: optionalArtistImageSchema,
  isPrivate: z.boolean().optional(),
});
